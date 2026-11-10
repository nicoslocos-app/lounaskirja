// Shared offline backup conversion. No network, credentials or dependencies.
(function(root){
'use strict';
const tables=['lunches','menus','recipes','dishes','settings','history'];
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const uuid=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v))throw Error('Virheellinen tunniste varmistuksessa.');return quote(v)+'::uuid';};
const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||isNaN(+new Date(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw Error('Virheellinen päivämäärä.');return quote(v)+'::date';};
const object=v=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Virheellinen sisältörivi.');return quote(JSON.stringify(v))+'::jsonb';};
const version=v=>{if(!Number.isInteger(v)||v<1)throw Error('Virheellinen versionumero.');return v;};
const text=v=>{if(typeof v!=='string')throw Error('Tekstikenttä puuttuu.');return quote(v);};
function toSQL(backup){if(!backup||backup.schema!==2||backup.platform!=='supabase')throw Error('Valitse tämän Supabase-version JSON-varmuuskopio (schema 2).');for(const table of tables)if(!Array.isArray(backup[table]))throw Error('Varmistuksesta puuttuu taulu: '+table);if(backup.settings.length!==1||backup.settings[0].id!==1)throw Error('Ravintola-asetukset puuttuvat.');
const out=['-- Lounaskirja: REPLACES restaurant content. Take a current backup first.','-- Auth users and profiles are preserved. History actors are cleared.','BEGIN;','SET LOCAL standard_conforming_strings = on;',`LOCK TABLE ${tables.map(t=>'public.'+t).join(',')} IN EXCLUSIVE MODE;`];
for(const table of [...tables].reverse())out.push(`DELETE FROM public.${table};`);
for(const table of tables)for(const row of backup[table]){let columns,values;
 if(table==='dishes'){if(!['protein','carb','vegan'].includes(row.category)||typeof row.active!=='boolean')throw Error('Virheellinen ruokalaji.');columns='id,name,category,active';values=[uuid(row.id),text(row.name),text(row.category),row.active?'true':'false'];}
 else if(table==='settings'){columns='id,data';values=[1,object(row.data)];}
 else if(table==='history'){if(!['recipes','menus','lunches'].includes(row.entity))throw Error('Virheellinen historia.');columns='id,entity,entity_id,data,version,actor,created';values=[uuid(row.id),text(row.entity),text(row.entity_id),object(row.data),version(row.version),'NULL',text(row.created)+'::timestamptz'];}
 else{columns=(table==='recipes'?'id':'date')+',data,version,updated';values=[table==='recipes'?uuid(row.id):date(row.date),object(row.data),version(row.version),text(row.updated)+'::timestamptz'];}
 out.push(`INSERT INTO public.${table}(${columns}) VALUES(${values.join(',')});`);
}
out.push('COMMIT;');return out.join('\n')+'\n';
}
root.LounaskirjaBackup={toSQL};
})(globalThis);
