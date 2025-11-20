# Database Status Reference

This document defines all possible status values for the main tables in the ticket platform database.

## Table of Contents
- [event_orders](#event_orders)
- [event_transactions](#event_transactions)
- [event_order_items (tickets)](#event_order_items-tickets)
- [Status Flow Examples](#status-flow-examples)

## `event_orders`

### `status` Field
| Status | Description | When Used |
|--------|-------------|-----------|
| `pending` | Order created, waiting for payment | Initial order creation |
| `paid` | Payment completed successfully | After MercadoPago approval |
| `cancelled` | Order was cancelled | Payment failed/rejected/user cancelled |
| `refunded` | Payment was refunded | After refund processing |
| `completed` | Order fully processed | All tickets delivered/used |

### `payment_status` Field
| Status | Description | MercadoPago Equivalent |
|--------|-------------|----------------------|
| `pending` | Payment is being processed | `pending`, `in_process`, `authorized` |
| `paid` | Payment successful | `approved` |
| `failed` | Payment failed/rejected | `rejected` |
| `cancelled` | Payment cancelled | `cancelled` |
| `refunded` | Payment refunded | `refunded`, `charged_back` |

## `event_transactions`

### `status` Field
| Status | Description | When Used |
|--------|-------------|-----------|
| `pending` | Transaction initiated, waiting for result | Initial transaction creation |
| `approved` | Payment approved by MercadoPago | Webhook receives `approved` status |
| `rejected` | Payment rejected by MercadoPago | Webhook receives `rejected` status |
| `refunded` | Transaction refunded | Webhook receives `refunded` or `charged_back` |
| `delivered` | Used when ticket is scanned/validated | Optional: when ticket is used at event |

## `event_order_items` (tickets)

### `status` Field
| Status | Description | When Used |
|--------|-------------|-----------|
| `pending` | Ticket created, payment not confirmed | Initial ticket creation |
| `paid` | Payment confirmed, ticket valid | After successful payment |
| `active` | Ticket is active and ready to use | Alternative to `paid` for ready tickets |
| `used` | Ticket has been scanned/used at event | After QR code scan at venue |
| `cancelled` | Ticket cancelled | Order cancelled or refunded |
| `transferred` | Ticket transferred to another user | Future feature for ticket transfers |

## Status Flow Examples

### Successful Purchase Flow
```
1. Order Created:
   ├── event_orders.status = 'pending'
   ├── event_orders.payment_status = 'pending'
   ├── event_transactions.status = 'pending'
   └── tickets.status = 'pending'

2. Payment Processing (MercadoPago):
   ├── event_orders.payment_status = 'pending'
   ├── event_transactions.status = 'pending'
   └── tickets.status = 'pending'

3. Payment Approved (Webhook):
   ├── event_orders.status = 'paid'
   ├── event_orders.payment_status = 'paid'
   ├── event_transactions.status = 'approved'
   └── tickets.status = 'paid' or 'active'

4. Ticket Used at Event:
   ├── tickets.status = 'used'
   └── event_transactions.status = 'delivered' (optional)
```

### Failed Payment Flow
```
1. Order Created:
   ├── event_orders.status = 'pending'
   ├── event_orders.payment_status = 'pending'
   ├── event_transactions.status = 'pending'
   └── tickets.status = 'pending'

2. Payment Rejected (Webhook):
   ├── event_orders.status = 'cancelled'
   ├── event_orders.payment_status = 'failed'
   ├── event_transactions.status = 'rejected'
   └── tickets.status = 'cancelled'
```

### Refund Flow
```
1. From Paid Status:
   ├── event_orders.status = 'paid'
   ├── event_orders.payment_status = 'paid'
   ├── event_transactions.status = 'approved'
   └── tickets.status = 'paid'

2. Refund Processed (Webhook):
   ├── event_orders.status = 'refunded'
   ├── event_orders.payment_status = 'refunded'
   ├── event_transactions.status = 'refunded'
   └── tickets.status = 'cancelled'
```

## MercadoPago Status Mapping

### Payment Status → Database Status
| MercadoPago Status | event_orders.status | event_orders.payment_status | event_transactions.status |
|-------------------|-------------------|---------------------------|--------------------------|
| `approved` | `paid` | `paid` | `approved` |
| `pending` | `pending` | `pending` | `pending` |
| `in_process` | `pending` | `pending` | `pending` |
| `authorized` | `pending` | `pending` | `pending` |
| `rejected` | `cancelled` | `failed` | `rejected` |
| `cancelled` | `cancelled` | `cancelled` | `rejected` |
| `refunded` | `refunded` | `refunded` | `refunded` |
| `charged_back` | `refunded` | `refunded` | `refunded` |

## Database Constraints

### event_orders
```sql
-- Status constraints
CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded', 'completed'))
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'))
```

### event_transactions
```sql
-- Status constraints
CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'delivered'))
```

### tickets (event_order_items)
```sql
-- Status constraints
CHECK (status IN ('pending', 'paid', 'active', 'used', 'cancelled', 'transferred'))
```

## Notes

1. **Consistency**: Always update all related tables atomically when status changes
2. **Webhooks**: Status changes should primarily come from MercadoPago webhooks
3. **UI Display**: Use `getStatusText()` function to display user-friendly status names
4. **Validation**: QR codes should only be generated/displayed for `paid` or `active` tickets
5. **Actions**: Payment buttons should only show for `pending` orders with `payment_url`

## Related Files
- `ticket-client/app/api/payment/webhook/route.ts` - Webhook handler
- `ticket-client/app/tickets/page.tsx` - Status display logic
- `ticket-client/database/migrations/add_payment_fields.sql` - Database constraints