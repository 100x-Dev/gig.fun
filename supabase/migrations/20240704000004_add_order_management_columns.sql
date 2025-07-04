-- Add order management columns
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS buyer_notes TEXT,
ADD COLUMN IF NOT EXISTS seller_notes TEXT,
ADD COLUMN IF NOT EXISTS buyer_fid BIGINT,
ADD COLUMN IF NOT EXISTS seller_fid BIGINT;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE OR REPLACE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
