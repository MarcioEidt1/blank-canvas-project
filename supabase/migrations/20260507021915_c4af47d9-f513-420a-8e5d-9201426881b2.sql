GRANT SELECT ON public.public_vehicles TO anon, authenticated;
ALTER VIEW public.public_vehicles SET (security_invoker = on);