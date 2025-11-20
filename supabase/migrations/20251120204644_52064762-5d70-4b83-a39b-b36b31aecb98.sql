-- ============================================
-- PHASE 1: ADD MULTI-TENANT SUPPORT
-- Non-destructive, backward-compatible migration
-- ============================================

-- 1. Add tenant_id to venues table (NULLABLE for backward compatibility)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Create index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_venues_tenant_id ON public.venues(tenant_id);

-- 3. Create a default tenant for existing data (if not exists)
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Check if we already have a default tenant
  SELECT id INTO default_tenant_id 
  FROM public.tenants 
  WHERE slug = 'default-venue' 
  LIMIT 1;
  
  -- If no default tenant exists, create one
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      name,
      slug,
      status,
      legal_name,
      default_currency,
      timezone
    ) VALUES (
      'Default Venue',
      'default-venue',
      'active',
      'Legacy Data Tenant',
      'USD',
      'America/New_York'
    )
    RETURNING id INTO default_tenant_id;
    
    RAISE NOTICE 'Created default tenant with ID: %', default_tenant_id;
  END IF;
  
  -- Backfill all existing venues with the default tenant
  UPDATE public.venues
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled % venues with default tenant', 
    (SELECT COUNT(*) FROM public.venues WHERE tenant_id = default_tenant_id);
END $$;

-- 4. Create helper function to get user's accessible tenant IDs
-- This avoids RLS recursion issues
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT tenant_id 
  FROM public.tenant_users
  WHERE user_id = _user_id 
    AND status = 'active';
$$;

-- 5. Create helper function to check if user can access a tenant
CREATE OR REPLACE FUNCTION public.can_access_tenant(_tenant_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users
    WHERE tenant_id = _tenant_id 
      AND user_id = _user_id 
      AND status = 'active'
  );
$$;

-- 6. Create helper function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_tenant_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenant_users
    WHERE tenant_id = _tenant_id 
      AND user_id = _user_id 
      AND status = 'active'
      AND role = 'tenant_owner'
  );
$$;

-- 7. Update RLS policies for venues to include tenant filtering
DROP POLICY IF EXISTS "Global admins can manage all venues" ON public.venues;

CREATE POLICY "Global admins can manage all venues"
ON public.venues
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their venues"
ON public.venues
FOR SELECT
USING (
  is_global_admin() OR 
  can_access_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can manage their venues"
ON public.venues
FOR ALL
USING (
  is_global_admin() OR 
  is_tenant_owner(tenant_id)
);

-- 8. Update RLS policies for venue_bars
DROP POLICY IF EXISTS "Global admins can manage all venue_bars" ON public.venue_bars;

CREATE POLICY "Global admins can manage all venue_bars"
ON public.venue_bars
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their venue bars"
ON public.venue_bars
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_bars.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant owners can manage their venue bars"
ON public.venue_bars
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_bars.venue_id
      AND is_tenant_owner(v.tenant_id)
  )
);

-- 9. Update RLS policies for venue_orders
DROP POLICY IF EXISTS "Global admins can manage all venue_orders" ON public.venue_orders;

CREATE POLICY "Global admins can manage all venue_orders"
ON public.venue_orders
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their venue orders"
ON public.venue_orders
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_orders.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant users can manage their venue orders"
ON public.venue_orders
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_orders.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

-- 10. Update RLS policies for venue_users
DROP POLICY IF EXISTS "Global admins can manage all venue_users" ON public.venue_users;

CREATE POLICY "Global admins can manage all venue_users"
ON public.venue_users
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their venue users"
ON public.venue_users
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_users.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant users can manage their venue users"
ON public.venue_users
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_users.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

-- 11. Update RLS policies for staff
DROP POLICY IF EXISTS "Global admins can manage all staff" ON public.staff;

CREATE POLICY "Global admins can manage all staff"
ON public.staff
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their staff"
ON public.staff
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = staff.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant owners can manage their staff"
ON public.staff
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = staff.venue_id
      AND is_tenant_owner(v.tenant_id)
  )
);

-- 12. Update RLS policies for stock_items
DROP POLICY IF EXISTS "Global admins can manage all stock_items" ON public.stock_items;

CREATE POLICY "Global admins can manage all stock_items"
ON public.stock_items
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their stock items"
ON public.stock_items
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venue_bars vb
    JOIN public.venues v ON v.id = vb.venue_id
    WHERE vb.id = stock_items.bar_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant users can manage their stock items"
ON public.stock_items
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venue_bars vb
    JOIN public.venues v ON v.id = vb.venue_id
    WHERE vb.id = stock_items.bar_id
      AND can_access_tenant(v.tenant_id)
  )
);

-- 13. Update RLS policies for qr_codes
DROP POLICY IF EXISTS "Global admins can manage all qr_codes" ON public.qr_codes;

CREATE POLICY "Global admins can manage all qr_codes"
ON public.qr_codes
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their qr codes"
ON public.qr_codes
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venue_bars vb
    JOIN public.venues v ON v.id = vb.venue_id
    WHERE vb.id = qr_codes.bar_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant users can manage their qr codes"
ON public.qr_codes
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venue_bars vb
    JOIN public.venues v ON v.id = vb.venue_id
    WHERE vb.id = qr_codes.bar_id
      AND can_access_tenant(v.tenant_id)
  )
);

-- 14. Update RLS policies for venue_cashflow
DROP POLICY IF EXISTS "Global admins can manage all venue_cashflow" ON public.venue_cashflow;

CREATE POLICY "Global admins can manage all venue_cashflow"
ON public.venue_cashflow
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their cashflow"
ON public.venue_cashflow
FOR SELECT
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_cashflow.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

CREATE POLICY "Tenant users can manage their cashflow"
ON public.venue_cashflow
FOR ALL
USING (
  is_global_admin() OR
  EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = venue_cashflow.venue_id
      AND can_access_tenant(v.tenant_id)
  )
);

-- 15. Update RLS policies for system_alerts
DROP POLICY IF EXISTS "Global admins can manage all system_alerts" ON public.system_alerts;

CREATE POLICY "Global admins can manage all system_alerts"
ON public.system_alerts
FOR ALL
USING (is_global_admin());

CREATE POLICY "Tenant users can view their alerts"
ON public.system_alerts
FOR SELECT
USING (
  is_global_admin() OR
  (venue_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = system_alerts.venue_id
      AND can_access_tenant(v.tenant_id)
  ))
);

CREATE POLICY "Tenant users can manage their alerts"
ON public.system_alerts
FOR ALL
USING (
  is_global_admin() OR
  (venue_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = system_alerts.venue_id
      AND can_access_tenant(v.tenant_id)
  ))
);

-- 16. Create function to create new tenant with defaults
CREATE OR REPLACE FUNCTION public.create_tenant_with_defaults(
  p_name TEXT,
  p_slug TEXT,
  p_legal_name TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_timezone TEXT DEFAULT 'America/New_York',
  p_owner_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_venue_id UUID;
  v_result JSON;
BEGIN
  -- Check if user is global admin
  IF NOT is_global_admin() THEN
    RAISE EXCEPTION 'Only global admins can create tenants';
  END IF;
  
  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;
  
  -- Create tenant
  INSERT INTO tenants (name, slug, legal_name, default_currency, timezone, status)
  VALUES (p_name, p_slug, p_legal_name, p_currency, p_timezone, 'trial')
  RETURNING id INTO v_tenant_id;
  
  -- Create default venue for this tenant
  INSERT INTO venues (name, tenant_id, status)
  VALUES (p_name || ' - Main Venue', v_tenant_id, 'active')
  RETURNING id INTO v_venue_id;
  
  -- Add owner to tenant_users
  IF p_owner_user_id IS NOT NULL THEN
    INSERT INTO tenant_users (tenant_id, user_id, role, status)
    VALUES (v_tenant_id, p_owner_user_id, 'tenant_owner', 'active');
  END IF;
  
  -- Log the creation
  PERFORM insert_audit_log(
    'TENANT_CREATED',
    'tenant',
    v_tenant_id,
    NULL,
    json_build_object(
      'name', p_name,
      'slug', p_slug,
      'venue_id', v_venue_id
    )
  );
  
  -- Return result
  SELECT json_build_object(
    'tenant_id', v_tenant_id,
    'venue_id', v_venue_id,
    'slug', p_slug
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 17. Add comment explaining the tenant architecture
COMMENT ON TABLE public.venues IS 'Venues belong to tenants. Each tenant can have multiple venues for scalability.';
COMMENT ON COLUMN public.venues.tenant_id IS 'Links venue to its owning tenant. NULL values are legacy data.';
COMMENT ON FUNCTION public.create_tenant_with_defaults IS 'Creates a new tenant with a default venue and owner user. Only callable by global admins.';