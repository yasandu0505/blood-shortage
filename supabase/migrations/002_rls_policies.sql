-- RLS Policies for centers table
-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Public can read centers" ON centers;
DROP POLICY IF EXISTS "Authenticated users can read centers" ON centers;
DROP POLICY IF EXISTS "Public can create first center" ON centers;
DROP POLICY IF EXISTS "Admins can create centers" ON centers;

-- Public can read all centers
CREATE POLICY "Public can read centers"
  ON centers FOR SELECT
  USING (true);

-- Authenticated users can read all centers
CREATE POLICY "Authenticated users can read centers"
  ON centers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow creating first center (for initial setup)
-- This is handled by checking if centers table is empty
-- We'll use a function to check this
CREATE OR REPLACE FUNCTION is_first_center()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM centers) = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public to insert if it's the first center
CREATE POLICY "Public can create first center"
  ON centers FOR INSERT
  WITH CHECK (is_first_center());

-- Authenticated admins can create centers
CREATE POLICY "Admins can create centers"
  ON centers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.role = 'admin'
    )
  );

-- RLS Policies for user_centers table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own center assignments" ON user_centers;
DROP POLICY IF EXISTS "Users can insert own center assignment" ON user_centers;
DROP POLICY IF EXISTS "Admins can insert center assignments" ON user_centers;

-- Users can read their own center assignments
CREATE POLICY "Users can read own center assignments"
  ON user_centers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own center assignment (for signup)
-- This allows users to link themselves to a center during registration
CREATE POLICY "Users can insert own center assignment"
  ON user_centers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert center assignments for any user (for blood banks creating accounts for officials)
CREATE POLICY "Admins can insert center assignments"
  ON user_centers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
      AND uc.center_id = user_centers.center_id
    )
  );

-- RLS Policies for shortages table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read shortages" ON shortages;
DROP POLICY IF EXISTS "Users can create shortages for own center" ON shortages;
DROP POLICY IF EXISTS "Users can update shortages for own center" ON shortages;
DROP POLICY IF EXISTS "Admins can delete shortages" ON shortages;

-- Public can read all shortages
CREATE POLICY "Public can read shortages"
  ON shortages FOR SELECT
  USING (true);

-- Authenticated users can create shortages for their own center
CREATE POLICY "Users can create shortages for own center"
  ON shortages FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.center_id = shortages.center_id
    )
  );

-- Authenticated users can update shortages for their own center
CREATE POLICY "Users can update shortages for own center"
  ON shortages FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.center_id = shortages.center_id
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.center_id = shortages.center_id
    )
  );

-- Only admins can delete shortages
CREATE POLICY "Admins can delete shortages"
  ON shortages FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.center_id = shortages.center_id
      AND user_centers.role = 'admin'
    )
  );

-- RLS Policies for audit_logs table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "No manual audit log modifications" ON audit_logs;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_centers.user_id = auth.uid()
      AND user_centers.role = 'admin'
    )
  );

-- No one can insert, update, or delete audit logs (only triggers can)
CREATE POLICY "No manual audit log modifications"
  ON audit_logs FOR ALL
  USING (false)
  WITH CHECK (false);

