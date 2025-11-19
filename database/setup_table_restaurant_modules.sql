-- ============================================
-- TABLE RESTAURANT MODULE SETUP
-- ============================================
-- This script sets up the module system for the table-restaurant project
-- Tenant ID: 22abca07-a1ce-4a57-8b7a-2f22961109ad

-- ============================================
-- 1. INSERT MODULES INTO apps_registry
-- ============================================

-- Main Module: StockQR (Core Module for Admin Dashboard)
INSERT INTO public.apps_registry (key, name, description, is_core) 
VALUES
  ('stockqr', 'StockQR', 'Complete admin dashboard for restaurant/venue management', true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_core = EXCLUDED.is_core;

-- Sub-functionalities (Non-core modules)
INSERT INTO public.apps_registry (key, name, description, is_core) 
VALUES
  ('stockqr_orders', 'Gestión de Pedidos', 'Order management - view and manage customer orders', false),
  ('stockqr_finances', 'Panel de Finanzas', 'Finance panel - financial reports and analytics', false),
  ('stockqr_roles', 'Administración de Roles', 'Role administration - manage user roles and permissions', false),
  ('stockqr_menu', 'Gestión de Carta', 'Menu management - create and manage menu items', false),
  ('stockqr_qr_tracking', 'Barras & QRs', 'QR tracking - manage bars and QR codes', false),
  ('stockqr_stock', 'Stock & Reasignaciones', 'Stock management and reassignments', false)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_core = EXCLUDED.is_core;

-- ============================================
-- 2. ENABLE MODULES FOR TENANT
-- ============================================

-- Enable all modules for the table-restaurant tenant
-- Replace 'YOUR_TENANT_ID' with the actual tenant ID: 22abca07-a1ce-4a57-8b7a-2f22961109ad

INSERT INTO public.tenant_modules (tenant_id, app_id, enabled, activated_at)
SELECT 
  '22abca07-a1ce-4a57-8b7a-2f22961109ad'::uuid,
  id,
  true,
  NOW()
FROM apps_registry
WHERE key IN ('stockqr', 'stockqr_orders', 'stockqr_finances', 'stockqr_roles', 'stockqr_menu', 'stockqr_qr_tracking', 'stockqr_stock')
ON CONFLICT (tenant_id, app_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  activated_at = EXCLUDED.activated_at;

-- ============================================
-- 3. EXAMPLE QUERIES
-- ============================================

-- Example: Disable a specific module for a tenant
-- UPDATE tenant_modules 
-- SET enabled = false 
-- WHERE tenant_id = '22abca07-a1ce-4a57-8b7a-2f22961109ad' 
-- AND app_id = (SELECT id FROM apps_registry WHERE key = 'stockqr_orders');

-- Example: Enable a specific module for a tenant
-- UPDATE tenant_modules 
-- SET enabled = true, activated_at = NOW()
-- WHERE tenant_id = '22abca07-a1ce-4a57-8b7a-2f22961109ad' 
-- AND app_id = (SELECT id FROM apps_registry WHERE key = 'stockqr_orders');

-- Example: Check which modules are enabled for a tenant
-- SELECT 
--   tm.id,
--   tm.enabled,
--   tm.activated_at,
--   ar.key,
--   ar.name,
--   ar.description,
--   ar.is_core
-- FROM tenant_modules tm
-- JOIN apps_registry ar ON tm.app_id = ar.id
-- WHERE tm.tenant_id = '22abca07-a1ce-4a57-8b7a-2f22961109ad'
-- ORDER BY ar.is_core DESC, ar.name;

