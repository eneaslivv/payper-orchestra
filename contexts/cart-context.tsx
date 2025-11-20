'use client'

import React, { createContext, useContext, useState } from 'react'

export interface CartItem {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime?: string
  eventLocation: string
  eventImage?: string
  ticketTypeId: string
  ticketTypeName: string
  ticketTypeDescription?: string
  price: number
  quantity: number
}

export type PaymentMethod = 'card'

interface CartContextType {
  items: CartItem[]
  paymentMethod: PaymentMethod
  addToCart: (item: Omit<CartItem, 'id'>) => void
  replaceInCart: (item: Omit<CartItem, 'id'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateItemQuantity: (eventId: string, ticketTypeId: string, quantity: number, itemData?: Omit<CartItem, 'id'>) => void
  setPaymentMethod: (method: PaymentMethod) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getSubtotal: () => number
  getTaxes: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.eventId}-${newItem.ticketTypeId}-${Date.now()}`

    // Check if same ticket type for same event already exists
    const existingItemIndex = items.findIndex(
      item => item.eventId === newItem.eventId && item.ticketTypeId === newItem.ticketTypeId
    )

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      setItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      ))
    } else {
      // Add new item
      setItems(prev => [...prev, { ...newItem, id }])
    }
  }

  const replaceInCart = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.eventId}-${newItem.ticketTypeId}-${Date.now()}`

    // Check if same ticket type for same event already exists
    const existingItemIndex = items.findIndex(
      item => item.eventId === newItem.eventId && item.ticketTypeId === newItem.ticketTypeId
    )

    if (existingItemIndex >= 0) {
      // Replace quantity of existing item
      setItems(prev => prev.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: newItem.quantity }
          : item
      ))
    } else {
      // Add new item
      setItems(prev => [...prev, { ...newItem, id }])
    }
  }

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const updateItemQuantity = (eventId: string, ticketTypeId: string, quantity: number, itemData?: Omit<CartItem, 'id'>) => {
    const existingItemIndex = items.findIndex(item =>
      item.eventId === eventId && item.ticketTypeId === ticketTypeId
    )

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      if (existingItemIndex !== -1) {
        const itemId = items[existingItemIndex].id
        removeFromCart(itemId)
      }
      return
    }

    if (existingItemIndex !== -1) {
      // Update existing item
      const itemId = items[existingItemIndex].id
      updateQuantity(itemId, quantity)
    } else if (itemData) {
      // Add new item
      addToCart({ ...itemData, quantity })
    }
  }

  const clearCart = () => {
    setItems([])
    setPaymentMethod('card')
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTaxes = () => {
    const subtotal = getSubtotal()
    return subtotal * 0.05 // 5% tax rate
  }

  const getTotalPrice = () => {
    return getSubtotal() + getTaxes()
  }

  const value: CartContextType = {
    items,
    paymentMethod,
    addToCart,
    replaceInCart,
    removeFromCart,
    updateQuantity,
    updateItemQuantity,
    setPaymentMethod,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTaxes
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
