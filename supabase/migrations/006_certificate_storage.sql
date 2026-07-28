-- Create storage bucket for certificate templates
insert into storage.buckets (id, name, public)
values ('certificate-templates', 'certificate-templates', true);

-- Storage Policies for 'certificate-templates' bucket
create policy "Allow all users to read certificate templates"
on storage.objects for select
to public
using ( bucket_id = 'certificate-templates' );

create policy "Allow admins to upload certificate templates"
on storage.objects for insert
to authenticated
with check ( 
    bucket_id = 'certificate-templates' 
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator') 
);

create policy "Allow admins to update certificate templates"
on storage.objects for update
to authenticated
using ( 
    bucket_id = 'certificate-templates' 
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator') 
);

create policy "Allow admins to delete certificate templates"
on storage.objects for delete
to authenticated
using ( 
    bucket_id = 'certificate-templates' 
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator') 
);
