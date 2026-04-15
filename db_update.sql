-- SQL Script to update database for Two-Step Security Architecture

-- Drop existing staffs table if necessary (be careful with existing data)
-- DROP TABLE IF EXISTS public.staffs;

CREATE TABLE IF NOT EXISTS public.staffs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  email text NOT NULL,
  full_name text NULL,
  role text NOT NULL DEFAULT 'staff'::text,
  passcode text NULL,
  password text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staffs_pkey PRIMARY KEY (id),
  CONSTRAINT staffs_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- 1. Ensure extensions for uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up profiles table if user wants to migrate to unified system
-- DROP TABLE IF EXISTS public.profiles;

-- 3. (Optional) Example data for testing
INSERT INTO public.staffs (email, full_name, role, passcode)
VALUES ('admin@gmail.com', 'Admin Manager', 'manager', '1234')
ON CONFLICT (email) DO UPDATE 
SET role = 'manager', passcode = '1234';

COMMENT ON TABLE public.staffs IS 'Unified table for all system operators (Managers and Staff)';
