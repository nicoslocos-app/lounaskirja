import {PGlite} from '@electric-sql/pglite';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
export async function database(){const pg=new PGlite();await pg.exec('CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text); CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');await pg.exec(readFileSync('supabase/01-tietokanta.sql','utf8'));await pg.exec(readFileSync('supabase/04-yhteinen-tunnus.sql','utf8'));return pg;}
export async function testClients(pg){
class Query{
 constructor(table){this.table=table;this.kind='select';this.fields='*';this.params=[];this.filters=[];}
 select(fields='*'){this.fields=fields;return this;}eq(k,v){this.params.push(v);this.filters.push(`"${k}"=$${this.params.length}`);return this;}
 order(k,opt={}){this.sort=` ORDER BY "${k}" ${opt.ascending===false?'DESC':'ASC'}`;return this;}
 range(a,b){this.page=` LIMIT ${b-a+1} OFFSET ${a}`;return this;}limit(n){this.page=` LIMIT ${n}`;return this;}
 single(){this.one=true;this.required=true;return this;}maybeSingle(){this.one=true;return this;}
 insert(row){this.kind='insert';this.row=row;return this;}update(row){this.kind='update';this.row=row;return this;}delete(){this.kind='delete';return this;}
 async then(resolve,reject){try{let sql,params=[...this.params],where=this.filters.length?' WHERE '+this.filters.join(' AND '):'';
 if(this.kind==='select')sql=`SELECT ${this.fields==='*'?'*':this.fields.split(',').map(x=>'"'+x+'"').join(',')} FROM public."${this.table}"${where}${this.sort||''}${this.page||''}`;
 if(this.kind==='delete')sql=`DELETE FROM public."${this.table}"${where}`;
 if(this.kind==='insert'){const keys=Object.keys(this.row);params=keys.map(k=>this.row[k]);sql=`INSERT INTO public."${this.table}"(${keys.map(k=>'"'+k+'"').join(',')}) VALUES(${keys.map((_,i)=>'$'+(i+1)).join(',')})`;}
 if(this.kind==='update'){const keys=Object.keys(this.row),sets=keys.map(k=>{params.push(this.row[k]);return `"${k}"=$${params.length}`;});sql=`UPDATE public."${this.table}" SET ${sets.join(',')}${where}`;}
 const {rows}=await pg.query(sql,params);resolve({data:this.one?rows[0]||null:rows,error:this.required&&!rows.length?{message:'missing'}:null});}catch(e){resolve({data:null,error:{message:e.message,code:e.code}});}}
}
const db={from:table=>new Query(table),async rpc(name,args){try{const keys=Object.keys(args),sql=`SELECT public.${name}(${keys.map((k,i)=>`${k} => $${i+1}`).join(',')}) AS value`;const {rows}=await pg.query(sql,keys.map(k=>args[k]&&typeof args[k]==='object'?JSON.stringify(args[k]):args[k]));return {data:rows[0].value,error:null};}catch(e){return {data:null,error:{message:e.message,code:e.code}};}}};
return {db};
}
