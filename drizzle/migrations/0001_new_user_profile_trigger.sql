-- Patrón estándar de Supabase: crear automáticamente una fila en
-- public.profiles cuando se crea un auth.users. Sin esto, un usuario recién
-- registrado no tiene profile hasta su primer UPDATE manual, lo que rompe
-- cualquier join contra profiles (ej. lista de miembros en Settings).
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();