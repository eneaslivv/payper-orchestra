'use client'

import { Button } from '@/components/ui/button'
import { useUserTickets } from '@/hooks/use-events'
import { formatDate } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  CheckCircle,
  Clock,
  Package,
  QrCode,
  Star,
  TicketIcon,
  XCircle,
  Loader2,
  Calendar,
  MapPin,
  Clock as ClockIcon,
  Ticket,
  DollarSign
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QrCodeCopy from '@/components/QrCodeCopy'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface VipGuest {
  id: string
  name: string
  email: string
  event_id: string
  event_title: string
  status: 'invited' | 'confirmed' | 'cancelled'
  qr_code: string
  notes?: string
  created_at: string
}

export default function MyTicketsPage () {
  const { user } = useAuth()
  const { tickets, loading, error } = useUserTickets()
  const [vipGuests, setVipGuests] = useState<VipGuest[]>([])
  const [vipLoading, setVipLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventTicketTypes, setEventTicketTypes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(false)
  useEffect(() => {
    if (user) {
      loadVipGuests()
      setupVipGuestSubscription()
    }
  }, [user])
  const setupVipGuestSubscription = () => {
    if (!user) return

    const subscription = supabase
      .channel('vip_guests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vip_guests',
          filter: `email=eq.${user.email}`
        },
        payload => {
          console.log('VIP guest change detected:', payload)
          loadVipGuests() // Reload VIP guests when changes occur

          // Show toast notification for new VIP invitations
          if (payload.eventType === 'INSERT') {
            toast.success('🌟 You have received a new VIP invitation!')
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const loadVipGuests = async () => {
    if (!user) return

    try {
      setVipLoading(true)
      const { data, error } = await supabase
        .from('vip_guests')
        .select(
          `
          id,
          name,
          email,
          event_id,
          status,
          qr_code,
          notes,
          created_at,
          events!inner(title)
        `
        )
        .eq('email', user.email)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching VIP guests:', error)
        return
      }

      const formattedGuests =
        data?.map(guest => ({
          ...guest,
          event_title: (guest.events as any)?.title || 'Unknown Event'
        })) || []

      setVipGuests(formattedGuests)
    } catch (error) {
      console.error('Unexpected error loading VIP guests:', error)
    } finally {
      setVipLoading(false)
    }
  }
  if (!user) {
    return (
      <div className='container mx-auto p-4 md:p-8'>
        <div className='text-center py-12'>
          <h1 className='text-3xl font-bold mb-4'>My Tickets</h1>
          <p className='text-muted-foreground mb-4'>
            Please sign in to view your tickets
          </p>
          <Link href='/auth'>
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='container mx-auto p-4 md:p-8'>
        <h1 className='text-3xl font-bold mb-8'>My Tickets</h1>
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto p-4 md:p-8'>
        <h1 className='text-3xl font-bold mb-8'>My Tickets</h1>
        <div className='text-center py-12'>
          <p className='text-destructive mb-4'>
            Error loading tickets: {error}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-400' />
      case 'delivered':
        return <CheckCircle className='w-4 h-4 text-green-400' />
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-400' />
      default:
        return <Package className='w-4 h-4 text-gray-400' />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'delivered':
        return 'Entregada'
      case 'paid':
      case 'approved':
        return 'Pagado'
      case 'cancelled':
        return 'Cancelado'
      case 'waiting_payment':
        return 'Esperando Pago'
      case 'rejected':
        return 'Rechazado'
      case 'refunded':
        return 'Reembolsado'
      case 'in_process':
        return 'Procesando'
      default:
        return status
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'invited':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const handleConfirmVip = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('vip_guests')
        .update({ status: 'confirmed' })
        .eq('id', guestId)

      if (error) {
        console.error('Error confirming VIP:', error)
        toast.error('Failed to confirm VIP invitation')
        return
      }

      toast.success('VIP invitation confirmed!')
      loadVipGuests() // Reload to get updated data
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Failed to confirm VIP invitation')
    }
  }

  // Handle VIP guest click to show event details
  const handleVipGuestClick = async (guest: VipGuest) => {
    try {
      setIsLoadingTicketTypes(true)
      setSelectedEvent(guest)
      setIsModalOpen(true)

      // Fetch event details and ticket types
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', guest.event_id)
        .single()

      if (eventError) {
        console.error('Error fetching event:', eventError)
        toast.error('Failed to fetch event details')
        return
      }

      // Fetch ticket types for this event
      const { data: ticketTypes, error: ticketTypesError } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', guest.event_id)
        .order('price', { ascending: true })

      if (ticketTypesError) {
        console.error('Error fetching ticket types:', ticketTypesError)
        toast.error('Failed to fetch ticket types')
        return
      }

      setEventTicketTypes(ticketTypes || [])
      setSelectedEvent({ ...guest, ...eventData })
    } catch (error) {
      console.error('Error fetching event data:', error)
      toast.error('Failed to fetch event information')
    } finally {
      setIsLoadingTicketTypes(false)
    }
  }

  return (
    <div className='container mx-auto p-4 md:p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>My Tickets</h1>
        <p className='text-muted-foreground'>
          {tickets.length === 0
            ? "You haven't purchased any tickets yet"
            : `Total ${tickets.length} order(s)`}
        </p>
      </div>

      <Tabs defaultValue='tickets' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='tickets' className='flex items-center gap-2'>
            <TicketIcon className='h-4 w-4' />
            My Tickets {`(${tickets.length})`}
          </TabsTrigger>
          <TabsTrigger value='vip-guests' className='flex items-center gap-2'>
            <Star className='h-4 w-4' />
            VIP Guests
          </TabsTrigger>
        </TabsList>
        <TabsContent value='tickets' className='space-y-6'>
          {tickets.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>No tickets found</p>
              <Link href='/events'>
                <Button>Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className='space-y-4'>
              {tickets.map((order: any) => (
                <Card key={order.id} className='p-4 bg-black border-gray-900'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(order.status)}
                      <span className='text-white font-medium'>
                        Pedido #{order.id.slice(-8)}
                      </span>
                    </div>
                    <span className='text-sm text-gray-400'>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Estado del Pago:</span>
                      <span
                        className={`font-semibold ${
                          order.status === 'paid' ||
                          order.status === 'delivered'
                            ? 'text-green-400'
                            : order.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {getStatusText(order.payment_status || order.status)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Total:</span>
                      <span className='text-white font-semibold'>
                        ${order.total_price}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Validación:</span>
                      <span className='text-white font-semibold'>
                        {order.status === 'delivered'
                          ? 'Validado'
                          : 'Pendiente'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Método de pago:</span>
                      <span className='text-white'>{order.payment_method}</span>
                    </div>
                    {order.qr_code &&
                      (order.status === 'paid' ||
                        order.status === 'approved' ||
                        order.status === 'delivered') && (
                        <div className='flex justify-between'>
                          <span className='text-gray-400'>Código QR:</span>
                          <span className='text-white font-mono text-sm'>
                            {order.qr_code}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className='mt-4 pt-3 border-t border-gray-800 space-y-2'>
                    <Link href={`/confirmation?orderId=${order.id}`}>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full border-gray-700 text-white hover:bg-gray-800'
                      >
                        Ver detalles
                      </Button>
                    </Link>

                    {/* Show payment button for pending payments */}
                    {(order.status === 'waiting_payment' ||
                      order.status === 'pending') &&
                      order.payment_url && (
                        <a
                          href={order.payment_url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Button
                            size='sm'
                            className='w-full bg-lime-400 text-black hover:bg-lime-500'
                          >
                            Completar Pago
                          </Button>
                        </a>
                      )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value='vip-guests' className='space-y-6'>
          <Card className='bg-zinc-900/50 border-zinc-800'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Star className='h-5 w-5 text-yellow-500' />
                VIP Guest Invitations
              </CardTitle>
              <CardDescription>
                Manage your VIP guest invitations and access codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vipLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin' />
                </div>
              ) : vipGuests.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Star className='h-12 w-12 mx-auto mb-4 text-muted-foreground/50' />
                  <p>No VIP invitations found</p>
                  <p className='text-sm'>
                    You'll see your VIP guest invitations here when you receive
                    them
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='grid gap-4'>
                    {vipGuests.map(guest => (
                      <Card
                        key={guest.id}
                        className='bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50x transition-colors'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start justify-between'>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2'>
                                <Link
                                  className='font-semibold text-lg hover:underline'
                                  href={`/event/${guest.event_id}`}
                                >
                                  {guest.event_title}
                                </Link>
                                <Badge
                                  variant={getStatusBadgeVariant(guest.status)}
                                  className='flex items-center gap-1'
                                >
                                  {getStatusIcon(guest.status)}
                                  {guest.status}
                                </Badge>
                              </div>
                              <p className='text-sm text-muted-foreground'>
                                Guest: {guest.name}
                              </p>
                              {guest.notes && (
                                <p className='text-sm text-muted-foreground'>
                                  Notes: {guest.notes}
                                </p>
                              )}
                              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <QrCodeCopy guest={guest} />
                              </div>
                            </div>
                            <div className='flex flex-col gap-2 justify-center items-center self-stretch'>
                              {guest.status === 'invited' && (
                                <Button
                                  size='sm'
                                  onClick={() => handleConfirmVip(guest.id)}
                                  className='bg-green-600 hover:bg-green-700'
                                >
                                  <CheckCircle className='h-4 w-4 mr-2' />
                                  Confirm
                                </Button>
                              )}

                              <QRCodeSVG
                                value={guest.qr_code}
                                size={128}
                                level='M'
                                className='qr-code-svg'
                                bgColor='#ffffff'
                                fgColor='#000000'
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Event Details & Ticket Types
            </DialogTitle>
            <DialogDescription>
              Event information and available ticket types
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className='space-y-6'>
              {/* Event Information */}
              <Card className='bg-zinc-900/50 border-zinc-800'>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    {selectedEvent.title || selectedEvent.event_title}
                  </CardTitle>
                  <CardDescription>Event Information</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>Event Date:</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.date
                          ? new Date(selectedEvent.date).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <ClockIcon className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>Event Time:</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.time || 'Not specified'}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>Location:</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.location || 'Not specified'}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Star className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm font-medium'>VIP Guest:</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.name} ({selectedEvent.email})
                      </p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className='space-y-2'>
                      <span className='text-sm font-medium'>Description:</span>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {selectedEvent.notes && (
                    <div className='space-y-2'>
                      <span className='text-sm font-medium'>Notes:</span>
                      <p className='text-sm text-muted-foreground'>
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Types Section */}
              <Card className='bg-zinc-900/50 border-zinc-800'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Ticket className='h-5 w-5' />
                    Available Ticket Types ({eventTicketTypes.length})
                  </CardTitle>
                  <CardDescription>
                    All ticket types available for this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTicketTypes ? (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                      <span className='ml-2'>Loading ticket types...</span>
                    </div>
                  ) : eventTicketTypes.length > 0 ? (
                    <div className='space-y-4'>
                      {eventTicketTypes.map(ticketType => (
                        <div
                          key={ticketType.id}
                          className='border border-zinc-700 rounded-lg p-4 space-y-2 bg-zinc-800/30'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='space-y-1'>
                              <h4 className='font-medium text-white'>
                                {ticketType.name}
                              </h4>
                              <p className='text-sm text-muted-foreground'>
                                {ticketType.description ||
                                  'No description available'}
                              </p>
                            </div>
                            <div className='text-right'>
                              <div className='flex items-center gap-1 text-lg font-semibold text-green-400'>
                                <DollarSign className='h-4 w-4' />
                                {ticketType.price}
                              </div>
                              <p className='text-xs text-muted-foreground'>
                                {ticketType.total_quantity} available
                              </p>
                            </div>
                          </div>

                          <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                            <div>
                              <span className='font-medium text-muted-foreground'>
                                Price:
                              </span>
                              <p className='text-white'>${ticketType.price}</p>
                            </div>
                            <div>
                              <span className='font-medium text-muted-foreground'>
                                Quantity:
                              </span>
                              <p className='text-white'>
                                {ticketType.total_quantity}
                              </p>
                            </div>
                            <div>
                              <span className='font-medium text-muted-foreground'>
                                Combo:
                              </span>
                              <p className='text-white'>{ticketType.combo}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Ticket className='h-12 w-12 mx-auto mb-2 opacity-50' />
                      <p>No ticket types found for this event</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
