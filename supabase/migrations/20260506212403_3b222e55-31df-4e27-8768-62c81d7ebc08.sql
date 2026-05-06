
-- =========================================================
-- 1. VEHICLES — remove public SELECT on base table (sensitive cols)
-- =========================================================
DROP POLICY IF EXISTS "Public can view active vehicles" ON public.vehicles;

-- Public-safe view (excludes chassis, renavam, plate, engine_number, crv,
-- current_owner, ownership_type, purchase_price, fipe_price, suggested_price,
-- total_cost, extra_expenses_total, internal_notes, yard_location,
-- dpvat_year, licensing_year, entry_date)
CREATE OR REPLACE VIEW public.public_vehicles
WITH (security_invoker = true) AS
SELECT
  id, brand, model, version, display_name,
  year, year_model, km, color, internal_color, doors,
  fuel, transmission, power_cv,
  price, is_promotion, promotion_price, promotion_label, promotion_until,
  image_url, image_position, video_url,
  highlights, accessories, description,
  status, featured, show_on_website, is_active,
  factory_warranty_date,
  created_at, updated_at
FROM public.vehicles
WHERE is_active = true AND show_on_website = true;

GRANT SELECT ON public.public_vehicles TO anon, authenticated;

-- =========================================================
-- 2. SITE_SETTINGS — only expose explicitly-public keys
-- =========================================================
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Mark common public-safe keys as public (adjust as needed)
UPDATE public.site_settings
SET is_public = true
WHERE key IN (
  'phone','whatsapp','address','email','company_name','logo_url','favicon_url',
  'instagram','facebook','youtube','tiktok','google_maps','about','hero_title',
  'hero_subtitle','hero_image','primary_color','secondary_color','site_name',
  'site_description','opening_hours'
);

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view public site settings"
ON public.site_settings FOR SELECT
USING (is_public = true);

DROP POLICY IF EXISTS "Admins can view all site settings" ON public.site_settings;
CREATE POLICY "Admins can view all site settings"
ON public.site_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
