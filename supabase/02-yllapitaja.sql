-- FIRST create a confirmed user in Supabase Authentication → Users → Add user.
-- Change the email and name below to match YOUR user. Run this ONCE.
DO $$
DECLARE user_id uuid;
BEGIN
 SELECT id INTO user_id FROM auth.users WHERE lower(email)=lower('OMA_SAHKOPOSTI_TAHAN');
 IF user_id IS NULL THEN RAISE EXCEPTION 'Käyttäjää ei löytynyt. Luo käyttäjä ensin Authentication → Users -näkymässä ja tarkista sähköposti.'; END IF;
 INSERT INTO public.profiles(id,username,name,role,active)
 SELECT id,lower(email),'OMA_NIMI_TAHAN','admin',true FROM auth.users WHERE id=user_id;
END; $$;
