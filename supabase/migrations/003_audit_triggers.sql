-- Function to log shortage changes
CREATE OR REPLACE FUNCTION log_shortage_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_center_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Get current user ID from auth context
  v_user_id := auth.uid();
  
  -- Determine center_id and data based on trigger type
  IF TG_OP = 'DELETE' THEN
    v_center_id := OLD.center_id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_center_id := NEW.center_id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_center_id := NEW.center_id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    user_id,
    center_id,
    action,
    table_name,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    v_user_id,
    v_center_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'::audit_action
      WHEN TG_OP = 'UPDATE' THEN 'update'::audit_action
      WHEN TG_OP = 'DELETE' THEN 'delete'::audit_action
    END,
    TG_TABLE_NAME,
    v_old_data,
    v_new_data,
    NOW()
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for shortages table
CREATE TRIGGER shortage_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON shortages
  FOR EACH ROW
  EXECUTE FUNCTION log_shortage_changes();

-- Function to log center changes (optional, for completeness)
CREATE OR REPLACE FUNCTION log_center_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (
    user_id,
    center_id,
    action,
    table_name,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    v_user_id,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'::audit_action
      WHEN TG_OP = 'UPDATE' THEN 'update'::audit_action
      WHEN TG_OP = 'DELETE' THEN 'delete'::audit_action
    END,
    TG_TABLE_NAME,
    v_old_data,
    v_new_data,
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for centers table
CREATE TRIGGER center_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON centers
  FOR EACH ROW
  EXECUTE FUNCTION log_center_changes();

