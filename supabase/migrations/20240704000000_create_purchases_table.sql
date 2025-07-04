-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  buyer_fid BIGINT NOT NULL,
  seller_fid BIGINT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  payment_tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'disputed')),
  UNIQUE(buyer_fid, service_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_fid ON public.purchases(buyer_fid);
CREATE INDEX IF NOT EXISTS idx_purchases_service_id ON public.purchases(service_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_fid ON public.purchases(seller_fid);

-- Enable RLS (Row Level Security)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert purchases
CREATE POLICY "Authenticated users can insert purchases"
  ON public.purchases FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow users to view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (auth.uid()::bigint = buyer_fid OR auth.uid()::bigint = seller_fid);

-- Create policy to allow sellers to update purchase status
CREATE POLICY "Sellers can update purchase status"
  ON public.purchases FOR UPDATE
  TO authenticated
  USING (auth.uid()::bigint = seller_fid)
  WITH CHECK (auth.uid()::bigint = seller_fid);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_fid ON public.purchases(seller_fid);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- Add RLS policies if using Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own purchases
CREATE POLICY "Users can view their own purchases" 
ON public.purchases 
FOR SELECT 
USING (auth.uid()::text = buyer_fid::text);

-- Policy to allow insert for authenticated users
CREATE POLICY "Authenticated users can create purchases" 
ON public.purchases 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
