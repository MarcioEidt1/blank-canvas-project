
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('vehicle-images', 'vehicle-images', true),
  ('banner-images', 'banner-images', true),
  ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for vehicle-images
CREATE POLICY "Public read vehicle-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Admins manage vehicle-images insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage vehicle-images update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage vehicle-images delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

-- Public read for banner-images
CREATE POLICY "Public read banner-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banner-images');

CREATE POLICY "Admins manage banner-images insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage banner-images update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage banner-images delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

-- Private vehicle-documents — admin only
CREATE POLICY "Admins read vehicle-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vehicle-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert vehicle-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update vehicle-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete vehicle-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-documents' AND public.has_role(auth.uid(), 'admin'));
