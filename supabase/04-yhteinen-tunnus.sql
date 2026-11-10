-- Run once in your EXISTING Supabase SQL Editor. Preserves lunch/recipe data.
BEGIN;
CREATE TABLE IF NOT EXISTS public.app_sessions(token_hash text PRIMARY KEY,credential_hash text NOT NULL,expires_at timestamptz NOT NULL);
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_sessions FROM anon,authenticated;
GRANT ALL ON public.app_sessions TO service_role;
CREATE OR REPLACE FUNCTION public.create_shared_session(p_token_hash text,p_credential_hash text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 DELETE FROM app_sessions WHERE expires_at<now();
 INSERT INTO app_sessions VALUES(p_token_hash,p_credential_hash,now()+interval '12 hours');
END; $$;
REVOKE ALL ON FUNCTION public.create_shared_session(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_shared_session(text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.save_shared_record(p_entity text,p_id text,p_data jsonb,p_version integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE old_row record; key_column text; predicate text;
BEGIN
 IF p_entity NOT IN ('recipes','menus','lunches') OR p_version<0 OR p_version IS NULL OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' THEN RAISE EXCEPTION 'INVALID_RECORD'; END IF;
 key_column := CASE WHEN p_entity='recipes' THEN 'id' ELSE 'date' END;
 predicate := CASE WHEN p_entity='recipes' THEN '$1::uuid' ELSE '$1::date' END;
 IF p_version=0 THEN
   BEGIN
     EXECUTE format('INSERT INTO public.%I(%I,data) VALUES(%s,$2)',p_entity,key_column,predicate) USING p_id,p_data;
   EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'RECORD_CONFLICT'; END;
 ELSE
   EXECUTE format('SELECT data,version FROM public.%I WHERE %I=%s FOR UPDATE',p_entity,key_column,predicate) INTO old_row USING p_id;
   IF old_row.version IS NULL OR old_row.version<>p_version THEN RAISE EXCEPTION 'RECORD_CONFLICT'; END IF;
   INSERT INTO history(entity,entity_id,data,version,actor) VALUES(p_entity,p_id,old_row.data,old_row.version,NULL);
   EXECUTE format('UPDATE public.%I SET data=$2,version=version+1,updated=now() WHERE %I=%s',p_entity,key_column,predicate) USING p_id,p_data;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_shared_record(text,text,jsonb,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_shared_record(text,text,jsonb,integer) TO service_role;

COMMIT;
