-- First, let's verify the services table exists and has the correct primary key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        RAISE EXCEPTION 'The services table does not exist. Please create it first.';
    END IF;
    
    -- Check if the services table has an 'id' column of type UUID
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION 'The services table does not have an id column of type UUID.';
    END IF;
END $$;

-- Drop the existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchases_service_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE public.purchases DROP CONSTRAINT purchases_service_id_fkey';
    END IF;
END $$;

-- Recreate the foreign key constraint with explicit naming
ALTER TABLE public.purchases 
ADD CONSTRAINT purchases_service_id_fkey 
FOREIGN KEY (service_id) 
REFERENCES public.services(id) 
ON DELETE CASCADE;

-- Add a comment to document the relationship
COMMENT ON CONSTRAINT purchases_service_id_fkey ON public.purchases IS 'References the services table to track which service was purchased';

-- Refresh the database metadata
NOTIFY pgrst, 'reload schema';
