'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      addItem: (product, qty = 1) => {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i), isOpen: true })
        } else {
          set({
            items: [...items, {
              id: product.id, slug: product.slug, name: product.name,
              brandName: product.brandName, validation: product.validation,
              price: product.price, originalPrice: product.originalPrice,
              qty,
            }],
            isOpen: true,
          })
        }
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
      updateQty: (id, qty) => {
        if (qty < 1) return set({ items: get().items.filter(i => i.id !== id) })
        set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) })
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    { name: 'gssl-cart' }
  )
)
