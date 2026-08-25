#!/usr/bin/env python3
"""
Backend API tests for GlobalSSLWeb - Idempotent seed upserts verification
Tests the deployment-readiness fix: admin edits must be preserved after ensureSeeded runs
"""
import requests
import json
import time
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://cert-shop-preview.preview.emergentagent.com/api"
ADMIN_PASSWORD = "admin123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(name, status, message=""):
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.END} {name}")
    if message:
        print(f"      {message}")

def test_catalog_integrity():
    """Test 1: Catalog integrity - products, brands, categories"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}TEST 1: CATALOG INTEGRITY{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    results = {"passed": 0, "failed": 0}
    
    # Test products endpoint
    try:
        resp = requests.get(f"{BASE_URL}/products?limit=50", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/products?limit=50", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "items" not in data or "total" not in data:
                log_test("GET /api/products?limit=50", "FAIL", "Missing 'items' or 'total' in response")
                results["failed"] += 1
            elif data["total"] < 36:
                log_test("GET /api/products?limit=50", "FAIL", f"Expected total >= 36, got {data['total']}")
                results["failed"] += 1
            else:
                # Validate product structure
                if len(data["items"]) == 0:
                    log_test("GET /api/products?limit=50", "FAIL", "No products returned")
                    results["failed"] += 1
                else:
                    sample = data["items"][0]
                    required_fields = ["id", "slug", "name", "brandSlug", "brandName", "categorySlug", "validation", "price", "wholesalePriceUsd", "markup", "active"]
                    missing = [f for f in required_fields if f not in sample]
                    if missing:
                        log_test("GET /api/products?limit=50", "FAIL", f"Missing fields in product: {missing}")
                        results["failed"] += 1
                    elif not isinstance(sample["price"], (int, float)):
                        log_test("GET /api/products?limit=50", "FAIL", f"price is not a number: {type(sample['price'])}")
                        results["failed"] += 1
                    elif not isinstance(sample["wholesalePriceUsd"], (int, float)):
                        log_test("GET /api/products?limit=50", "FAIL", f"wholesalePriceUsd is not a number: {type(sample['wholesalePriceUsd'])}")
                        results["failed"] += 1
                    elif not isinstance(sample["markup"], (int, float)):
                        log_test("GET /api/products?limit=50", "FAIL", f"markup is not a number: {type(sample['markup'])}")
                        results["failed"] += 1
                    elif sample["active"] != True:
                        log_test("GET /api/products?limit=50", "FAIL", f"active is not true: {sample['active']}")
                        results["failed"] += 1
                    else:
                        log_test("GET /api/products?limit=50", "PASS", f"Total: {data['total']}, Items: {len(data['items'])}, All fields valid")
                        results["passed"] += 1
    except Exception as e:
        log_test("GET /api/products?limit=50", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # Test brands endpoint
    try:
        resp = requests.get(f"{BASE_URL}/brands", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/brands", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            brands = resp.json()
            if not isinstance(brands, list):
                log_test("GET /api/brands", "FAIL", "Response is not an array")
                results["failed"] += 1
            elif len(brands) != 6:
                log_test("GET /api/brands", "FAIL", f"Expected 6 brands, got {len(brands)}")
                results["failed"] += 1
            else:
                expected_brands = ["sectigo", "digicert", "geotrust", "rapidssl", "thawte", "entrust"]
                brand_slugs = [b.get("slug") for b in brands]
                missing = [b for b in expected_brands if b not in brand_slugs]
                if missing:
                    log_test("GET /api/brands", "FAIL", f"Missing brands: {missing}")
                    results["failed"] += 1
                else:
                    log_test("GET /api/brands", "PASS", f"All 6 brands present: {', '.join(brand_slugs)}")
                    results["passed"] += 1
    except Exception as e:
        log_test("GET /api/brands", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # Test categories endpoint
    try:
        resp = requests.get(f"{BASE_URL}/categories", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/categories", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            categories = resp.json()
            if not isinstance(categories, list):
                log_test("GET /api/categories", "FAIL", "Response is not an array")
                results["failed"] += 1
            elif len(categories) != 7:
                log_test("GET /api/categories", "FAIL", f"Expected 7 categories, got {len(categories)}")
                results["failed"] += 1
            else:
                log_test("GET /api/categories", "PASS", f"All 7 categories present")
                results["passed"] += 1
    except Exception as e:
        log_test("GET /api/categories", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    return results

def test_admin_edit_preservation():
    """Test 2: Admin edit preservation - THE CORE FIX"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}TEST 2: ADMIN EDIT PRESERVATION (CORE FIX){Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    results = {"passed": 0, "failed": 0}
    session = requests.Session()
    
    # Step 1: Admin login
    try:
        resp = session.post(f"{BASE_URL}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/admin/login", "FAIL", f"Status: {resp.status_code}, Body: {resp.text}")
            results["failed"] += 1
            return results
        else:
            log_test("POST /api/admin/login", "PASS", "Admin authenticated")
            results["passed"] += 1
    except Exception as e:
        log_test("POST /api/admin/login", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
        return results
    
    # Step 2: Read baseline product
    product_id = "p-sectigo-positivessl-dv"
    baseline_markup = None
    baseline_price = None
    
    try:
        resp = session.get(f"{BASE_URL}/admin/products", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/admin/products (baseline)", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
            return results
        else:
            data = resp.json()
            products = data.get("items", [])
            product = next((p for p in products if p.get("id") == product_id), None)
            if not product:
                log_test("GET /api/admin/products (baseline)", "FAIL", f"Product {product_id} not found")
                results["failed"] += 1
                return results
            else:
                baseline_markup = product.get("markup")
                baseline_price = product.get("price")
                log_test("GET /api/admin/products (baseline)", "PASS", f"Baseline markup: {baseline_markup}, price: {baseline_price}")
                results["passed"] += 1
    except Exception as e:
        log_test("GET /api/admin/products (baseline)", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
        return results
    
    # Step 3: PATCH product with new markup
    new_markup = 3.0
    try:
        resp = session.patch(f"{BASE_URL}/admin/products/{product_id}", json={"markup": new_markup}, timeout=10)
        if resp.status_code != 200:
            log_test(f"PATCH /api/admin/products/{product_id}", "FAIL", f"Status: {resp.status_code}, Body: {resp.text}")
            results["failed"] += 1
            return results
        else:
            updated = resp.json()
            if updated.get("markup") != new_markup:
                log_test(f"PATCH /api/admin/products/{product_id}", "FAIL", f"Expected markup {new_markup}, got {updated.get('markup')}")
                results["failed"] += 1
                return results
            else:
                new_price = updated.get("price")
                if new_price <= baseline_price:
                    log_test(f"PATCH /api/admin/products/{product_id}", "FAIL", f"Price should increase (baseline: {baseline_price}, new: {new_price})")
                    results["failed"] += 1
                    return results
                else:
                    log_test(f"PATCH /api/admin/products/{product_id}", "PASS", f"Markup updated to {new_markup}, price increased to {new_price}")
                    results["passed"] += 1
    except Exception as e:
        log_test(f"PATCH /api/admin/products/{product_id}", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
        return results
    
    # Step 4: Trigger ensureSeeded by hitting GET /api/products
    try:
        resp = requests.get(f"{BASE_URL}/products?limit=1", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/products?limit=1 (trigger ensureSeeded)", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            log_test("GET /api/products?limit=1 (trigger ensureSeeded)", "PASS", "ensureSeeded triggered")
            results["passed"] += 1
    except Exception as e:
        log_test("GET /api/products?limit=1 (trigger ensureSeeded)", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # Step 5: Verify markup is STILL 3.0 (not reverted)
    time.sleep(1)  # Give DB a moment
    try:
        resp = session.get(f"{BASE_URL}/admin/products", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/admin/products (verify preservation)", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            data = resp.json()
            products = data.get("items", [])
            product = next((p for p in products if p.get("id") == product_id), None)
            if not product:
                log_test("GET /api/admin/products (verify preservation)", "FAIL", f"Product {product_id} not found")
                results["failed"] += 1
            else:
                current_markup = product.get("markup")
                if current_markup != new_markup:
                    log_test("GET /api/admin/products (verify preservation)", "FAIL", 
                            f"❌ CRITICAL: Markup reverted from {new_markup} to {current_markup}! Admin edit NOT preserved!")
                    results["failed"] += 1
                else:
                    log_test("GET /api/admin/products (verify preservation)", "PASS", 
                            f"✅ CRITICAL: Markup STILL {new_markup}! Admin edit preserved after ensureSeeded!")
                    results["passed"] += 1
    except Exception as e:
        log_test("GET /api/admin/products (verify preservation)", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # Step 6: Restore original markup
    try:
        resp = session.patch(f"{BASE_URL}/admin/products/{product_id}", json={"markup": baseline_markup}, timeout=10)
        if resp.status_code != 200:
            log_test(f"PATCH /api/admin/products/{product_id} (restore)", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            log_test(f"PATCH /api/admin/products/{product_id} (restore)", "PASS", f"Markup restored to {baseline_markup}")
            results["passed"] += 1
    except Exception as e:
        log_test(f"PATCH /api/admin/products/{product_id} (restore)", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    return results

def test_other_endpoints():
    """Test 3: All other endpoints still work"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}TEST 3: OTHER ENDPOINTS SANITY CHECK{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    results = {"passed": 0, "failed": 0}
    
    # GET /api/products/slug/sectigo-positivessl-dv
    try:
        resp = requests.get(f"{BASE_URL}/products/slug/sectigo-positivessl-dv", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/products/slug/sectigo-positivessl-dv", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "product" not in data or "brand" not in data or "related" not in data:
                log_test("GET /api/products/slug/sectigo-positivessl-dv", "FAIL", "Missing product/brand/related")
                results["failed"] += 1
            else:
                log_test("GET /api/products/slug/sectigo-positivessl-dv", "PASS", "Product with brand and related")
                results["passed"] += 1
    except Exception as e:
        log_test("GET /api/products/slug/sectigo-positivessl-dv", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # GET /api/products/id/p-sectigo-positivessl-dv
    try:
        resp = requests.get(f"{BASE_URL}/products/id/p-sectigo-positivessl-dv", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/products/id/p-sectigo-positivessl-dv", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "id" not in data or data["id"] != "p-sectigo-positivessl-dv":
                log_test("GET /api/products/id/p-sectigo-positivessl-dv", "FAIL", "Invalid product response")
                results["failed"] += 1
            else:
                log_test("GET /api/products/id/p-sectigo-positivessl-dv", "PASS", "Product by ID")
                results["passed"] += 1
    except Exception as e:
        log_test("GET /api/products/id/p-sectigo-positivessl-dv", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # POST /api/cart/validate
    try:
        payload = {"items": [{"id": "p-sectigo-positivessl-dv", "qty": 1}]}
        resp = requests.post(f"{BASE_URL}/cart/validate", json=payload, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/cart/validate", "FAIL", f"Status: {resp.status_code}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "subtotal" not in data or "tax" not in data or "total" not in data:
                log_test("POST /api/cart/validate", "FAIL", "Missing subtotal/tax/total")
                results["failed"] += 1
            else:
                log_test("POST /api/cart/validate", "PASS", f"Subtotal: {data['subtotal']}, Tax: {data['tax']}, Total: {data['total']}")
                results["passed"] += 1
    except Exception as e:
        log_test("POST /api/cart/validate", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # POST /api/orders
    try:
        payload = {
            "customer": {"name": "John Doe", "email": "john.doe@example.com"},
            "billing": {"country": "India"},
            "items": [{"id": "p-sectigo-positivessl-dv", "qty": 1}]
        }
        resp = requests.post(f"{BASE_URL}/orders", json=payload, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/orders", "FAIL", f"Status: {resp.status_code}, Body: {resp.text[:200]}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "orderNumber" not in data:
                log_test("POST /api/orders", "FAIL", "Missing orderNumber")
                results["failed"] += 1
            else:
                log_test("POST /api/orders", "PASS", f"Order created: {data['orderNumber']}")
                results["passed"] += 1
    except Exception as e:
        log_test("POST /api/orders", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # POST /api/auth/register
    try:
        timestamp = int(time.time())
        email = f"test-{timestamp}@example.com"
        payload = {"email": email, "password": "secret123", "name": "Test User"}
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/auth/register", "FAIL", f"Status: {resp.status_code}, Body: {resp.text[:200]}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "user" not in data:
                log_test("POST /api/auth/register", "FAIL", "Missing user in response")
                results["failed"] += 1
            else:
                log_test("POST /api/auth/register", "PASS", f"User registered: {email}")
                results["passed"] += 1
                
                # POST /api/auth/login with same credentials
                try:
                    login_payload = {"email": email, "password": "secret123"}
                    login_resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
                    if login_resp.status_code != 200:
                        log_test("POST /api/auth/login", "FAIL", f"Status: {login_resp.status_code}")
                        results["failed"] += 1
                    else:
                        log_test("POST /api/auth/login", "PASS", f"User logged in: {email}")
                        results["passed"] += 1
                except Exception as e:
                    log_test("POST /api/auth/login", "FAIL", f"Exception: {str(e)}")
                    results["failed"] += 1
    except Exception as e:
        log_test("POST /api/auth/register", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    # POST /api/support/tickets
    try:
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Ticket",
            "body": "This is a test ticket"
        }
        resp = requests.post(f"{BASE_URL}/support/tickets", json=payload, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/support/tickets", "FAIL", f"Status: {resp.status_code}, Body: {resp.text[:200]}")
            results["failed"] += 1
        else:
            data = resp.json()
            if "ticketNumber" not in data:
                log_test("POST /api/support/tickets", "FAIL", "Missing ticketNumber")
                results["failed"] += 1
            else:
                log_test("POST /api/support/tickets", "PASS", f"Ticket created: {data['ticketNumber']}")
                results["passed"] += 1
    except Exception as e:
        log_test("POST /api/support/tickets", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    return results

def check_logs():
    """Test 4: Check logs for errors"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}TEST 4: LOGS CLEANLINESS CHECK{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    results = {"passed": 0, "failed": 0}
    
    try:
        import subprocess
        result = subprocess.run(
            ["tail", "-n", "100", "/var/log/supervisor/nextjs.out.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        log_content = result.stdout
        
        # Check for 500 errors
        if "500" in log_content or "Internal Server Error" in log_content:
            log_test("Check logs for 500 errors", "FAIL", "Found 500 errors in logs")
            results["failed"] += 1
        else:
            log_test("Check logs for 500 errors", "PASS", "No 500 errors found")
            results["passed"] += 1
        
        # Check for seed errors
        if "seed" in log_content.lower() and "error" in log_content.lower():
            log_test("Check logs for seed errors", "FAIL", "Found seed-related errors in logs")
            results["failed"] += 1
        else:
            log_test("Check logs for seed errors", "PASS", "No seed errors found")
            results["passed"] += 1
            
    except Exception as e:
        log_test("Check logs", "FAIL", f"Exception: {str(e)}")
        results["failed"] += 1
    
    return results

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}GlobalSSLWeb Backend API Tests - Idempotent Seed Upserts Verification{Colors.END}")
    print(f"{Colors.BLUE}Base URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    
    all_results = {"passed": 0, "failed": 0}
    
    # Run all tests
    r1 = test_catalog_integrity()
    all_results["passed"] += r1["passed"]
    all_results["failed"] += r1["failed"]
    
    r2 = test_admin_edit_preservation()
    all_results["passed"] += r2["passed"]
    all_results["failed"] += r2["failed"]
    
    r3 = test_other_endpoints()
    all_results["passed"] += r3["passed"]
    all_results["failed"] += r3["failed"]
    
    r4 = check_logs()
    all_results["passed"] += r4["passed"]
    all_results["failed"] += r4["failed"]
    
    # Final summary
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}FINAL SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.GREEN}PASSED: {all_results['passed']}{Colors.END}")
    print(f"{Colors.RED}FAILED: {all_results['failed']}{Colors.END}")
    
    if all_results["failed"] == 0:
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED! Deployment-readiness fix verified.{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.RED}❌ SOME TESTS FAILED! Review failures above.{Colors.END}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
