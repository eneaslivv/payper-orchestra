'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient, Event, EventWithTicketTypes, Ticket } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

// Hook for fetching all events
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getEvents()
      setEvents(response.events)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents
  }
}

// Hook for fetching a single event
export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventWithTicketTypes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getEvent(eventId)
      setEvent(response.event)
    } catch (err: any) {
      console.error('Error fetching event:', err)
      setError(err.message || 'Failed to fetch event details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  return {
    event,
    loading,
    error,
    refetch: fetchEvent
  }
}

// Hook for managing ticket quantities
export function useTicketQuantities(ticketTypes: any[] = [], eventId?: string, cartItems: any[] = [], onQuantityChange?: (ticketId: string, newQuantity: number) => void) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Create a stable reference for ticket type IDs
  const ticketTypeIds = useMemo(() =>
    ticketTypes.map(t => t.id).sort().join(','),
    [ticketTypes]
  )

  // Initialize quantities when ticket types change, syncing with cart items
  useEffect(() => {
    if (ticketTypes.length === 0) {
      setQuantities({})
      return
    }

    const initialQuantities: Record<string, number> = {}

    ticketTypes.forEach(ticket => {
      // Check if this ticket type is already in the cart for this event
      const cartItem = cartItems.find(item =>
        item.eventId === eventId && item.ticketTypeId === ticket.id
      )
      initialQuantities[ticket.id] = cartItem ? cartItem.quantity : 0
    })

    setQuantities(initialQuantities)
  }, [ticketTypeIds, eventId, cartItems]) // Use stable reference, eventId, and cartItems

  const updateQuantity = (ticketId: string, change: number) => {
    const newQuantity = Math.max(0, (quantities[ticketId] || 0) + change)
    setQuantities(prev => ({
      ...prev,
      [ticketId]: newQuantity
    }))

    // Call the callback to update the cart in real-time
    if (onQuantityChange) {
      onQuantityChange(ticketId, newQuantity)
    }
  }

  const setQuantity = (ticketId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }))
  }

  const getTotalQuantity = () => {
    return Object.values(quantities).reduce((total, quantity) => total + quantity, 0)
  }

  const calculateTotal = (ticketTypes: any[]) => {
    return ticketTypes.reduce((total, ticket) => {
      const quantity = quantities[ticket.id] || 0
      return total + (ticket.price * quantity)
    }, 0)
  }

  const getSelectedTickets = (ticketTypes: any[]) => {
    return ticketTypes
      .map(ticket => ({
        ...ticket,
        quantity: quantities[ticket.id] || 0
      }))
      .filter(ticket => ticket.quantity > 0)
  }

  return {
    quantities,
    updateQuantity,
    setQuantity,
    getTotalQuantity,
    calculateTotal,
    getSelectedTickets
  }
}

// Hook for fetching user tickets
export function useUserTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    if (!user?.id) {
      setTickets([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getUserTickets(user.id)
      setTickets(response.tickets)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets')
      console.error('Error fetching user tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [user?.id])

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets
  }
}

// Hook for fetching a single ticket
export function useTicket(ticketId: string) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("event_order_items")
          .select(`
            *,
            ticket_types(*),
            events(*)
          `)
          .eq('id', ticketId)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        setTicket(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch ticket')
        console.error('Error fetching ticket:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId])

  return {
    ticket,
    loading,
    error
  }
}
