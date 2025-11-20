-- Migration to rename tables and update foreign key references
-- This migration implements the schema changes requested:
-- 1. users -> profiles
-- 2. orders -> event_orders
-- 3. Update foreign key references
-- Note: scans and order_items tables don't exist in ticket-client schema

-- Start transaction
BEGIN;

-- Step 1: Rename tables
ALTER TABLE users RENAME TO profiles;
ALTER TABLE orders RENAME TO event_orders;

-- Step 2: Update foreign key constraints and references
-- Update all foreign key references from users to profiles

-- Update event_orders table foreign keys
ALTER TABLE event_orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE event_orders ADD CONSTRAINT event_orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update tickets table foreign keys
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_order_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_transferred_to_fkey;

ALTER TABLE tickets ADD CONSTRAINT tickets_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES event_orders(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD CONSTRAINT tickets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD CONSTRAINT tickets_transferred_to_fkey 
    FOREIGN KEY (transferred_to) REFERENCES profiles(id);

-- Update ticket_transfers table foreign keys
ALTER TABLE ticket_transfers DROP CONSTRAINT IF EXISTS ticket_transfers_from_user_id_fkey;
ALTER TABLE ticket_transfers DROP CONSTRAINT IF EXISTS ticket_transfers_to_user_id_fkey;

ALTER TABLE ticket_transfers ADD CONSTRAINT ticket_transfers_from_user_id_fkey 
    FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ticket_transfers ADD CONSTRAINT ticket_transfers_to_user_id_fkey 
    FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update discount_code_uses table foreign keys
ALTER TABLE discount_code_uses DROP CONSTRAINT IF EXISTS discount_code_uses_order_id_fkey;
ALTER TABLE discount_code_uses DROP CONSTRAINT IF EXISTS discount_code_uses_user_id_fkey;

ALTER TABLE discount_code_uses ADD CONSTRAINT discount_code_uses_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES event_orders(id) ON DELETE CASCADE;
ALTER TABLE discount_code_uses ADD CONSTRAINT discount_code_uses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update notifications table foreign keys
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update user_sessions table foreign keys
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update activity_logs table foreign keys (if exists)
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 3: Update indexes
-- Drop old indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_event_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;

-- Create new indexes with updated names
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_event_orders_user_id ON event_orders(user_id);
CREATE INDEX idx_event_orders_event_id ON event_orders(event_id);
CREATE INDEX idx_event_orders_status ON event_orders(status);
CREATE INDEX idx_event_orders_created_at ON event_orders(created_at);

-- Update other indexes that reference the renamed tables
DROP INDEX IF EXISTS idx_tickets_order_id;
DROP INDEX IF EXISTS idx_tickets_user_id;
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);

DROP INDEX IF EXISTS idx_notifications_user_id;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

DROP INDEX IF EXISTS idx_user_sessions_user_id;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

DROP INDEX IF EXISTS idx_activity_logs_user_id;
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- Step 4: Update views
-- Drop and recreate the user_tickets_detailed view
DROP VIEW IF EXISTS user_tickets_detailed;
CREATE VIEW user_tickets_detailed AS
SELECT 
    t.id,
    t.ticket_number,
    t.qr_code,
    t.holder_name,
    t.holder_email,
    t.status,
    t.used_at,
    t.created_at,
    e.title as event_title,
    e.event_date,
    e.start_time,
    e.venue_name,
    e.venue_address,
    tt.name as ticket_type_name,
    tt.price,
    o.order_number
FROM tickets t
JOIN events e ON t.event_id = e.id
JOIN ticket_types tt ON t.ticket_type_id = tt.id
JOIN event_orders o ON t.order_id = o.id
WHERE o.status = 'paid';

COMMIT;
