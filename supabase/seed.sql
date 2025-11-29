-- Seed data for testing and development
-- This file contains sample centers and can be run after migrations

-- Insert sample centers
INSERT INTO centers (name, district, address, phone, opening_hours) VALUES
  ('National Blood Transfusion Service - Colombo', 'Colombo', 'No. 555, Elvitigala Mawatha, Colombo 05', '+94 11 236 8333', '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "8:00-13:00", "sunday": "closed"}'::jsonb),
  ('Teaching Hospital Kandy', 'Kandy', 'Peradeniya Road, Kandy', '+94 81 223 3111', '{"monday": "8:00-16:00", "tuesday": "8:00-16:00", "wednesday": "8:00-16:00", "thursday": "8:00-16:00", "friday": "8:00-16:00", "saturday": "8:00-12:00", "sunday": "closed"}'::jsonb),
  ('General Hospital Galle', 'Galle', 'Church Street, Galle', '+94 91 223 2265', '{"monday": "8:00-16:00", "tuesday": "8:00-16:00", "wednesday": "8:00-16:00", "thursday": "8:00-16:00", "friday": "8:00-16:00", "saturday": "8:00-12:00", "sunday": "closed"}'::jsonb),
  ('Teaching Hospital Jaffna', 'Jaffna', 'Kandy Road, Jaffna', '+94 21 222 2261', '{"monday": "8:00-16:00", "tuesday": "8:00-16:00", "wednesday": "8:00-16:00", "thursday": "8:00-16:00", "friday": "8:00-16:00", "saturday": "8:00-12:00", "sunday": "closed"}'::jsonb),
  ('General Hospital Kurunegala', 'Kurunegala', 'Kurunegala Road, Kurunegala', '+94 37 222 2261', '{"monday": "8:00-16:00", "tuesday": "8:00-16:00", "wednesday": "8:00-16:00", "thursday": "8:00-16:00", "friday": "8:00-16:00", "saturday": "8:00-12:00", "sunday": "closed"}'::jsonb);

-- Note: User accounts and user_centers should be created through Supabase Auth
-- and linked manually or through the application interface

