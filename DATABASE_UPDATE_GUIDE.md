# Database Update Guide

## Option 1: Incremental Update (Recommended - Keeps Existing Data)

If you already have data in your database and want to keep it:

### Steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the new migration file**
   - Copy and paste the contents of `supabase/migrations/004_user_center_functions.sql`
   - Click "Run" to execute

3. **Update RLS policies (if needed)**
   - If you already ran `002_rls_policies.sql` before the recent updates, you may need to update it
   - The updated version now includes `DROP POLICY IF EXISTS` statements, so you can safely re-run it
   - Copy and paste the contents of `supabase/migrations/002_rls_policies.sql` and run it

That's it! Your existing data will be preserved.

---

## Option 2: Fresh Start (Drops Everything)

If you want to start completely fresh (⚠️ **WARNING: This deletes all data**):

### Steps:

1. **Open Supabase SQL Editor**

2. **Drop all existing objects** (run this first):
```sql
-- Drop all tables and related objects
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS shortages CASCADE;
DROP TABLE IF EXISTS user_centers CASCADE;
DROP TABLE IF EXISTS centers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS link_user_to_center(UUID, UUID, user_role);
DROP FUNCTION IF EXISTS is_first_center();
DROP FUNCTION IF EXISTS log_shortage_changes();
DROP FUNCTION IF EXISTS log_center_changes();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop types
DROP TYPE IF EXISTS blood_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
```

3. **Run migrations in order**:
   - Run `001_initial_schema.sql`
   - Run `002_rls_policies.sql`
   - Run `003_audit_triggers.sql`
   - Run `004_user_center_functions.sql`
   - (Optional) Run `seed.sql` for sample data

---

## Quick Check: Which Option Should I Use?

- **Use Option 1** if:
  - You have existing centers, users, or shortages
  - You want to keep your current data
  - You just need to add the new function

- **Use Option 2** if:
  - You're still in development/testing
  - You don't have important data yet
  - You want a clean slate

---

## Verification

After running the migrations, verify everything works:

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'link_user_to_center';

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('centers', 'user_centers', 'shortages', 'audit_logs');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('centers', 'user_centers', 'shortages', 'audit_logs');
```

All should return results if everything is set up correctly.

