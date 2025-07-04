-- Enable RLS on the services table
alter table public.services enable row level security;

-- Allow authenticated users to view all services
create policy "Enable read access for all users" 
on public.services for select 
using (true);

-- Allow users to create their own services
create policy "Enable insert for authenticated users"
on public.services for insert 
to authenticated
with check (true);

-- Allow users to update their own services
create policy "Enable update for users based on fid"
on public.services for update 
using (auth.uid()::text = fid::text);

-- Allow users to delete their own services
create policy "Enable delete for users based on fid"
on public.services for delete 
using (auth.uid()::text = fid::text);
