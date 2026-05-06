
-- 1. Remove vehicles from realtime publication (sensitive fields)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.vehicles';
  END IF;
END $$;

-- 2. VEHICLES
DROP POLICY IF EXISTS "Public can view active vehicles" ON public.vehicles;
CREATE POLICY "Public can view active vehicles"
ON public.vehicles FOR SELECT
USING (is_active = true AND show_on_website = true);

DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;
CREATE POLICY "Admins can view all vehicles"
ON public.vehicles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
CREATE POLICY "Admins can insert vehicles"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
CREATE POLICY "Admins can update vehicles"
ON public.vehicles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. BANNERS
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners"
ON public.banners FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners"
ON public.banners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. TESTIMONIALS
DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials"
ON public.testimonials FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. SITE_SETTINGS
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
ON public.site_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. CONTACTS
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;
CREATE POLICY "Anyone can submit contact"
ON public.contacts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;
CREATE POLICY "Admins can view contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;
CREATE POLICY "Admins can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Masters can view all roles" ON public.user_roles;
CREATE POLICY "Masters can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Masters can insert roles" ON public.user_roles;
CREATE POLICY "Masters can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Masters can update roles" ON public.user_roles;
CREATE POLICY "Masters can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.is_master_admin(auth.uid()))
WITH CHECK (public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Masters can delete roles" ON public.user_roles;
CREATE POLICY "Masters can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_master_admin(auth.uid()));

-- 8. USER_PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_master_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Masters can delete profiles" ON public.user_profiles;
CREATE POLICY "Masters can delete profiles"
ON public.user_profiles FOR DELETE
TO authenticated
USING (public.is_master_admin(auth.uid()));

-- 9. VEHICLE_IMAGES (public read for site)
DROP POLICY IF EXISTS "Public can view vehicle images" ON public.vehicle_images;
CREATE POLICY "Public can view vehicle images"
ON public.vehicle_images FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage vehicle images" ON public.vehicle_images;
CREATE POLICY "Admins manage vehicle images"
ON public.vehicle_images FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. VEHICLE_DOCUMENTS (admin only)
DROP POLICY IF EXISTS "Admins manage vehicle documents" ON public.vehicle_documents;
CREATE POLICY "Admins manage vehicle documents"
ON public.vehicle_documents FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. VEHICLE_EXPENSES (admin only)
DROP POLICY IF EXISTS "Admins manage vehicle expenses" ON public.vehicle_expenses;
CREATE POLICY "Admins manage vehicle expenses"
ON public.vehicle_expenses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. VEHICLE_MOVEMENTS (admin only)
DROP POLICY IF EXISTS "Admins manage vehicle movements" ON public.vehicle_movements;
CREATE POLICY "Admins manage vehicle movements"
ON public.vehicle_movements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master_admin(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master_admin(uuid) TO authenticated;
