-- Lounaskirja: run ONCE in a NEW Supabase project's SQL Editor.
BEGIN;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL UNIQUE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160),
 role text NOT NULL DEFAULT 'staff' CHECK(role IN ('admin','staff')),
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.settings(id integer PRIMARY KEY CHECK(id=1),data jsonb NOT NULL);
INSERT INTO public.settings VALUES(1,'{"restaurant":"Lounaskirja","gn":"Ravintolan vakioastia – koko ja syvyys vahvistamatta"}');
CREATE TABLE public.dishes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160),category text NOT NULL CHECK(category IN ('protein','carb','vegan')),active boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX dishes_name_category ON public.dishes(lower(name),category);
CREATE TABLE public.recipes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),version integer NOT NULL DEFAULT 1 CHECK(version>0),updated timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.menus(date date PRIMARY KEY,data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),version integer NOT NULL DEFAULT 1 CHECK(version>0),updated timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.lunches(date date PRIMARY KEY,data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),version integer NOT NULL DEFAULT 1 CHECK(version>0),updated timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entity text NOT NULL CHECK(entity IN ('recipes','menus','lunches')),entity_id text NOT NULL,data jsonb NOT NULL,version integer NOT NULL,actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,created timestamptz NOT NULL DEFAULT now());
CREATE INDEX history_lookup ON public.history(entity,entity_id,created DESC);
CREATE TABLE public.login_limits(key text PRIMARY KEY,attempts integer NOT NULL,expires timestamptz NOT NULL);
-- All browser access denied. Only the server's secret key can use these tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles,public.settings,public.dishes,public.recipes,public.menus,public.lunches,public.history,public.login_limits FROM anon,authenticated;
GRANT ALL ON public.profiles,public.settings,public.dishes,public.recipes,public.menus,public.lunches,public.history,public.login_limits TO service_role;

-- Server-only RPC: history and versioned save are a single transaction.
CREATE FUNCTION public.save_record(p_entity text,p_id text,p_data jsonb,p_version integer,p_actor uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE old_row record; key_column text; predicate text;
BEGIN
 IF p_entity NOT IN ('recipes','menus','lunches') OR p_version<0 OR p_version IS NULL OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' THEN RAISE EXCEPTION 'INVALID_RECORD'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND active) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF p_entity='recipes' AND NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND active AND role='admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 key_column := CASE WHEN p_entity='recipes' THEN 'id' ELSE 'date' END;
 predicate := CASE WHEN p_entity='recipes' THEN '$1::uuid' ELSE '$1::date' END;
 IF p_version=0 THEN
   BEGIN
     EXECUTE format('INSERT INTO public.%I(%I,data) VALUES(%s,$2)',p_entity,key_column,predicate) USING p_id,p_data;
   EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'RECORD_CONFLICT'; END;
 ELSE
   EXECUTE format('SELECT data,version FROM public.%I WHERE %I=%s FOR UPDATE',p_entity,key_column,predicate) INTO old_row USING p_id;
   IF old_row.version IS NULL OR old_row.version<>p_version THEN RAISE EXCEPTION 'RECORD_CONFLICT'; END IF;
   INSERT INTO history(entity,entity_id,data,version,actor) VALUES(p_entity,p_id,old_row.data,old_row.version,p_actor);
   EXECUTE format('UPDATE public.%I SET data=$2,version=version+1,updated=now() WHERE %I=%s',p_entity,key_column,predicate) USING p_id,p_data;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_record(text,text,jsonb,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_record(text,text,jsonb,integer,uuid) TO service_role;

CREATE FUNCTION public.check_login_limit(p_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 DELETE FROM login_limits WHERE expires<now();
 INSERT INTO login_limits(key,attempts,expires) VALUES(p_key,1,now()+interval '15 minutes')
 ON CONFLICT(key) DO UPDATE SET attempts=login_limits.attempts+1 RETURNING attempts INTO n;
 RETURN n<=10;
END; $$;
REVOKE ALL ON FUNCTION public.check_login_limit(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_limit(text) TO service_role;
COMMIT;
