# Payper Multi-Tenant Architecture Guide

## Overview

The Payper system has been successfully converted to a multi-tenant SaaS platform. This document explains the architecture, implementation, and usage.

## Architecture Summary

### Core Concept
- **Each tenant** represents one business/venue (bar, club, event location)
- **Tenants** can have multiple **venues** (for scalability)
- **All venue-related data** is automatically scoped to tenants
- **Users** can belong to multiple tenants with different roles

### Database Structure

#### Tenant Hierarchy
```
Tenants (business entities)
  └── Venues (physical locations)
      ├── Venue Bars
      ├── Orders
      ├── Stock Items
      ├── Staff
      ├── QR Codes
      ├── Cashflow
      └── Alerts
```

#### Key Tables
1. **tenants** - Business entities/customers
2. **tenant_users** - User-tenant mappings with roles
3. **venues** - Physical locations (linked to tenants via `tenant_id`)
4. **venue_bars, venue_orders, stock_items, etc.** - Venue-specific data

### Security Model

#### Row-Level Security (RLS)
All venue-related tables have RLS policies that:
- Allow **global admins** full access to all data
- Allow **tenant users** access only to their tenant's data via `can_access_tenant()`
- Allow **tenant owners** management access via `is_tenant_owner()`

#### Helper Functions (Security Definer)
- `can_access_tenant(tenant_id)` - Check if user can access a tenant
- `is_tenant_owner(tenant_id)` - Check if user is tenant owner
- `get_user_tenant_ids()` - Get list of tenant IDs user can access
- `is_global_admin()` - Check if user is a global admin

## User Roles

### Global Roles (Superadmin)
Defined in `global_admins` table:
- **super_admin** - Full system access, can create tenants
- **support_admin** - Support functions
- **sales_admin** - Sales functions  
- **read_only** - Read-only access

### Tenant Roles
Defined in `tenant_users` table:
- **tenant_owner** - Full tenant control
- **tenant_admin** - Complete management
- **tenant_ops** - Daily operations
- **tenant_finance** - Reports and financial data
- **tenant_viewer** - Read-only access

## Implementation Details

### Frontend Context

#### TenantContext (`src/contexts/TenantContext.tsx`)
Provides:
- `currentTenant` - Currently selected tenant
- `availableTenants` - List of accessible tenants
- `setCurrentTenant()` - Switch active tenant
- `loading` - Loading state

Usage:
```typescript
import { useTenant } from "@/contexts/TenantContext";

const { currentTenant, availableTenants, setCurrentTenant } = useTenant();
```

#### TenantSelector Component
- Displays dropdown to switch between tenants
- Auto-hidden if user has access to only one tenant
- Shows in sidebar for global admins and multi-tenant users

### Data Queries

All venue-related queries should filter by tenant:

```typescript
// Global admin - sees all data
let query = supabase.from("venues").select("*");

// Tenant user - filtered by current tenant
if (!globalAdmin && currentTenant) {
  query = query.eq("tenant_id", currentTenant.id);
}
```

### Creating New Tenants

#### Via Database Function
```sql
SELECT create_tenant_with_defaults(
  'Business Name',           -- p_name
  'business-slug',          -- p_slug
  'Legal Name Inc.',        -- p_legal_name (optional)
  'USD',                    -- p_currency (optional)
  'America/New_York',       -- p_timezone (optional)
  'user-uuid-here'          -- p_owner_user_id (optional)
);
```

This function:
1. Creates the tenant
2. Creates a default venue for the tenant
3. Adds the owner to `tenant_users`
4. Logs the creation in audit logs
5. Returns tenant_id, venue_id, and slug

#### Via Admin UI
Use the existing "Create Tenant" flow at `/admin/tenants/new`

## Migration Strategy Applied

### Phase 1: Database Schema (COMPLETED)
✅ Added `tenant_id` to `venues` table (nullable)
✅ Created default tenant for legacy data
✅ Backfilled existing venues with default tenant
✅ Created security definer helper functions
✅ Updated RLS policies for all venue tables

### Phase 2: Code Integration (COMPLETED)
✅ Created TenantContext provider
✅ Created TenantSelector component  
✅ Wrapped App in TenantProvider
✅ Updated Venues page to filter by tenant
✅ Added tenant selector to sidebar

### Phase 3: Remaining Work (TODO)
- [ ] Update all other admin pages to use tenant filtering
- [ ] Create new tenant creation UI for superadmins
- [ ] Add tenant impersonation feature
- [ ] Add tenant metrics dashboard
- [ ] Enforce `NOT NULL` on `venues.tenant_id` after validation

## Testing Checklist

### For Global Admins
- [ ] Can view all tenants in tenant selector
- [ ] Can switch between tenants
- [ ] Can create new tenants
- [ ] Can see all venues across all tenants
- [ ] Can filter venues by selected tenant

### For Tenant Users
- [ ] Can only see their assigned tenants
- [ ] Can switch between assigned tenants (if multiple)
- [ ] Cannot see other tenants' data
- [ ] Cannot create new tenants
- [ ] Can only manage venues for their tenant

### Data Isolation
- [ ] User A (Tenant 1) cannot see User B's (Tenant 2) venues
- [ ] Orders are scoped to correct tenant
- [ ] Stock items are scoped to correct tenant
- [ ] Staff are scoped to correct tenant
- [ ] QR codes are scoped to correct tenant

## Backward Compatibility

### Legacy Data
- All existing venues have been assigned to "Default Venue" tenant
- Legacy data continues to work without modification
- No data loss or breaking changes

### Migration Path
If you need to move venues between tenants:
```sql
UPDATE venues 
SET tenant_id = 'new-tenant-uuid'
WHERE id = 'venue-uuid';
```

## API Examples

### Get Current User's Tenants
```typescript
const { data } = await supabase
  .from("tenant_users")
  .select("tenants(id, name, slug, status)")
  .eq("user_id", user.id)
  .eq("status", "active");
```

### Get Venues for Current Tenant
```typescript
const { data } = await supabase
  .from("venues")
  .select("*")
  .eq("tenant_id", currentTenant.id);
```

### Create New Venue for Tenant
```typescript
const { data, error } = await supabase
  .from("venues")
  .insert({
    name: "New Venue",
    tenant_id: currentTenant.id,
    status: "active"
  });
```

## Database Functions

### create_tenant_with_defaults
Creates a complete tenant setup with default venue.

**Permissions:** Global admins only

**Returns:** JSON object with tenant_id, venue_id, slug

### can_access_tenant
Checks if current user can access a specific tenant.

**Usage in RLS:** 
```sql
USING (can_access_tenant(tenant_id))
```

### is_tenant_owner
Checks if current user is owner of a specific tenant.

**Usage in RLS:**
```sql
USING (is_tenant_owner(tenant_id))
```

## Security Considerations

1. **Never bypass RLS** - All queries automatically filtered by RLS
2. **Tenant context in frontend** - Always use `currentTenant` from context
3. **Audit logging** - All tenant creation logged automatically
4. **User isolation** - Users can only see tenants they're assigned to
5. **Admin privileges** - Only global admins can create/delete tenants

## Next Steps

1. Update remaining admin pages (Orders, Stock, etc.) to use tenant context
2. Build superadmin tenant management dashboard
3. Add tenant metrics and analytics
4. Implement tenant-level configuration
5. Add bulk operations for tenant management
6. Create tenant export/import functionality

## Support

For questions or issues:
1. Check RLS policies are enabled on all tables
2. Verify user has correct role in `tenant_users`
3. Check `currentTenant` is set in frontend context
4. Review audit logs for tenant operations
5. Verify `tenant_id` exists on all venue records
