import {createClient} from '@supabase/supabase-js';
import {createHash,randomUUID} from 'node:crypto';
import {categories,validDate,validateLunch} from './domain.mjs';
import {credentialsMatch,credentialHash,newToken,tokenHash} from './shared-auth.mjs';
import {fail,str,recipe} from './validation.mjs';

const security={
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
};
function checked(result){if(result.error){const code=result.error.code,message=result.error.message||'';if(message.includes('RECORD_CONFLICT')||code==='23505')fail('Tietue on jo olemassa tai toinen käyttäjä muokkasi sitä. Lataa näkymä uudelleen.',409);if(message.includes('FORBIDDEN'))fail('Toiminto ei ole sallittu.',403);throw Error('Database request failed');}return result.data;}
function defaultClients(env){const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};return {db:createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,options)};}
async function allRows(db,table){const rows=[],key=table==='menus'||table==='lunches'?'date':table==='login_limits'?'key':'id';for(let start=0;;start+=500){const page=checked(await db.from(table).select('*').order(key).range(start,start+499));rows.push(...page);if(page.length<500)return rows;}}
async function save(db,table,id,data,version,user){if(!Number.isInteger(version)||version<0)fail('Virheellinen versio.');checked(await db.rpc('save_shared_record',{p_entity:table,p_id:id,p_data:data,p_version:version}));}
function readCookies(req){try{return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(Boolean).map(s=>{const n=s.indexOf('=');return [s.slice(0,n),decodeURIComponent(s.slice(n+1))];}));}catch{return {};}}

export function createHandler({clients=defaultClients}={}){return async function handler(req,context={},env=process.env){
 const url=new URL(req.url),cookies=[],secure=url.protocol==='https:'?'; Secure':'';
 const setCookie=(name,value,maxAge=43200)=>cookies.push(`${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
 const clearCookies=()=>{setCookie('lk_session','',0);setCookie('lk_access','',0);setCookie('lk_refresh','',0);};
 let status=200,result;
 try{
  if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)fail('Supabase-yhteys puuttuu. Tarkista Netlifyn SUPABASE_URL ja SUPABASE_SECRET_KEY.',503);
  if(typeof env.APP_PASSWORD!=='string'||env.APP_PASSWORD.length<12||env.APP_PASSWORD.length>256)fail('Yhteinen salasana puuttuu. Lisää Netlifyyn APP_PASSWORD (12–256 merkkiä) ja julkaise uudelleen.',503);
  const path=url.pathname,method=req.method,mutation=!['GET','HEAD'].includes(method);
  if(mutation&&req.headers.get('Origin')!==url.origin)fail('Pyyntö ei tullut sovelluksesta.',403);
  if(mutation&&!req.headers.get('Content-Type')?.startsWith('application/json'))fail('Virheellinen sisältötyyppi.',415);
  if(Number(req.headers.get('Content-Length'))>600000)fail('Liian suuri pyyntö.',413);
  let body={};if(mutation){const text=await req.text();if(Buffer.byteLength(text)>600000)fail('Liian suuri pyyntö.',413);try{body=JSON.parse(text);}catch{fail('Virheellinen JSON.');}if(!body||Array.isArray(body)||typeof body!=='object')fail('Virheellinen JSON.');}
  const {db}=clients(env);
  const run=async()=>{
   if(path==='/api/login'&&method==='POST'){
    const username=str(body.username,80).toLowerCase(),password=body.password;
    if(typeof password!=='string'||password.length<1||password.length>256)fail('Virheellinen käyttäjätunnus tai salasana.',401);
    const key=createHash('sha256').update('shared-login:'+(context.ip||'unknown')).digest('hex');
    if(!checked(await db.rpc('check_login_limit',{p_key:key})))fail('Liian monta yritystä. Odota 15 minuuttia.',429);
    if(!await credentialsMatch(username,password,env))fail('Virheellinen käyttäjätunnus tai salasana.',401);
    const token=newToken();checked(await db.rpc('create_shared_session',{p_token_hash:tokenHash(token),p_credential_hash:credentialHash(env)}));
    checked(await db.from('login_limits').delete().eq('key',key));setCookie('lk_session',token);return {ok:true};
   }
   const token=readCookies(req).lk_session;
   if(!token||!/^[a-f0-9]{64}$/.test(token)){clearCookies();fail('Kirjaudu sisään.',401);}
   const session=checked(await db.from('app_sessions').select('*').eq('token_hash',tokenHash(token)).maybeSingle());
   if(!session||new Date(session.expires_at).getTime()<=Date.now()||session.credential_hash!==credentialHash(env)){clearCookies();fail('Istunto on päättynyt. Kirjaudu uudelleen.',401);}
   const user={id:'shared',username:env.APP_USERNAME||'lounas',name:'Keittiö',role:'admin'};
     if(path==='/api/logout'&&method==='POST'){checked(await db.from('app_sessions').delete().eq('token_hash',tokenHash(token)));clearCookies();return {ok:true};}
   if(path==='/api/data'&&method==='GET'){
    const settings=checked(await db.from('settings').select('*').eq('id',1).single());
    const out={user,settings:settings.data};
    for(const table of ['dishes','recipes','menus','lunches']){const rows=await allRows(db,table);out[table]=table==='dishes'?rows.filter(r=>r.active):rows.map(r=>({...r.data,...(r.id?{id:r.id}:{date:r.date}),version:r.version,updated:r.updated}));}return out;
   }
   if(path==='/api/lunches'&&method==='POST'){let value;try{value=validateLunch(body);}catch(e){fail(e.message);}await save(db,'lunches',value.date,value,body.version,user);return {ok:true};}
   if(path==='/api/menus'&&method==='POST'){if(!validDate(body.date))fail('Virheellinen päivämäärä.');const dishes={};for(const k of categories){if(!Array.isArray(body.dishes?.[k])||body.dishes[k].length>30)fail('Tarkista ruokalajit.');dishes[k]=body.dishes[k].map(s=>str(s));}await save(db,'menus',body.date,{date:body.date,dishes,closed:body.closed===true},body.version,user);return {ok:true};}
   if(path==='/api/dishes'&&method==='POST'){const row={name:str(body.name),category:str(body.category),active:body.active!==false};if(!categories.includes(row.category))fail('Virheellinen kategoria.');if(body.id)checked(await db.from('dishes').update(row).eq('id',str(body.id)));else checked(await db.from('dishes').insert(row));return {ok:true};}
   if(path==='/api/recipes'&&method==='POST'){await save(db,'recipes',body.id?str(body.id):randomUUID(),recipe(body),body.version,user);return {ok:true};}
   if(path==='/api/settings'&&method==='POST'){checked(await db.from('settings').update({data:{restaurant:str(body.restaurant),gn:str(body.gn,500)}}).eq('id',1));return {ok:true};}
   if(path==='/api/history'&&method==='GET'){const rows=checked(await db.from('history').select('*').order('created',{ascending:false}).limit(100));return rows.map(r=>({...r,data:JSON.stringify(r.data)}));}
   if(path==='/api/restore'&&method==='POST'){const h=checked(await db.from('history').select('*').eq('id',str(body.id)).maybeSingle());if(!h||!['recipes','menus','lunches'].includes(h.entity))fail('Versiota ei löytynyt.',404);const key=h.entity==='recipes'?'id':'date',current=checked(await db.from(h.entity).select('version').eq(key,h.entity_id).maybeSingle());await save(db,h.entity,h.entity_id,h.data,current?.version||0,user);return {ok:true};}
   if(path==='/api/export'&&method==='GET'){const out={schema:2,exported:new Date().toISOString(),platform:'supabase'};for(const t of ['lunches','menus','recipes','dishes','settings','history'])out[t]=await allRows(db,t);return out;}
   fail('Toimintoa ei löytynyt.',404);
  };
  result=await run();
 }catch(e){status=e.status||500;result={error:e.status?e.message:'Palvelinvirhe. Tietoja ei tallennettu. Tarkista yhteys tai Supabase-asennus ja yritä uudelleen.'};if(status===500)console.error('Lounaskirja API error');}
 const headers=new Headers(security);if(url.protocol==='https:')headers.set('Strict-Transport-Security','max-age=31536000');for(const cookie of cookies)headers.append('Set-Cookie',cookie);
 return new Response(JSON.stringify(result),{status,headers});
};}
export default createHandler();
