-- Function to link user to center (bypasses RLS for signup)
-- This allows users to link themselves during signup
-- Also allows admins to link other users to centers
CREATE OR REPLACE FUNCTION link_user_to_center(
  p_user_id UUID,
  p_center_id UUID,
  p_role user_role DEFAULT 'editor'
)
RETURNS UUID AS $$
DECLARE
  v_user_center_id UUID;
  v_is_first_user BOOLEAN;
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_user_exists BOOLEAN;
BEGIN
  -- Get current user ID (might be null during signup)
  v_current_user_id := auth.uid();

  -- Check if the user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Check if center exists
  IF NOT EXISTS(SELECT 1 FROM centers WHERE id = p_center_id) THEN
    RAISE EXCEPTION 'Center does not exist';
  END IF;

  -- If linking someone else, check if current user is admin of the same center
  IF v_current_user_id IS NOT NULL AND p_user_id != v_current_user_id THEN
    SELECT EXISTS (
      SELECT 1 FROM user_centers
      WHERE user_id = v_current_user_id
      AND center_id = p_center_id
      AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Only admins can link other users to centers';
    END IF;
  END IF;

  -- Allow self-linking (for signup) - no additional check needed
  -- The function runs with SECURITY DEFINER so it bypasses RLS

  -- Check if this is the first user for this center
  SELECT COUNT(*) = 0 INTO v_is_first_user
  FROM user_centers
  WHERE center_id = p_center_id;

  -- If first user, make them admin
  IF v_is_first_user THEN
    p_role := 'admin';
  END IF;

  -- Insert the user-center link
  INSERT INTO user_centers (user_id, center_id, role)
  VALUES (p_user_id, p_center_id, p_role)
  ON CONFLICT (user_id, center_id) DO UPDATE
  SET role = p_role
  RETURNING id INTO v_user_center_id;

  RETURN v_user_center_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
-- Anon is needed for signup before user is fully authenticated
GRANT EXECUTE ON FUNCTION link_user_to_center(UUID, UUID, user_role) TO authenticated;

