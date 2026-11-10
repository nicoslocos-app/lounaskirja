import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {database} from './helpers.mjs';
test('Postgres migration, permissions, atomic versioning, history, and login limit',async()=>{const pg=await database();try{
 const user=randomUUID(),staff=randomUUID();for(const [id,role] of [[user,'admin'],[staff,'staff']]){await pg.query('INSERT INTO auth.users VALUES($1,$2)',[id,id+'@example.fi']);await pg.query('INSERT INTO profiles(id,username,name,role) VALUES($1,$2,$3,$4)',[id,id+'@example.fi','Test',role]);}
 const row={date:'2026-11-10',customers:100},id='2026-11-10';
 const save=(entity,key,version,actor=user,data=row)=>pg.query('SELECT save_record($1,$2,$3::jsonb,$4,$5::uuid)',[entity,key,JSON.stringify(data),version,actor]);
 await save('lunches',id,0);await assert.rejects(()=>save('lunches',id,0),/RECORD_CONFLICT/);await save('lunches',id,1,staff,{...row,customers:120});
 await assert.rejects(()=>save('lunches',id,1),/RECORD_CONFLICT/);
 const current=(await pg.query('SELECT * FROM lunches')).rows[0];assert.equal(current.version,2);assert.equal(current.data.customers,120);const history=(await pg.query('SELECT * FROM history')).rows;assert.equal(history.length,1);assert.equal(history[0].data.customers,100);
 await assert.rejects(()=>save('recipes',randomUUID(),0,staff),/FORBIDDEN/);await assert.rejects(()=>save('profiles',randomUUID(),0),/INVALID_RECORD/);
 for(let i=1;i<=11;i++)assert.equal((await pg.query("SELECT check_login_limit('test-key') AS ok")).rows[0].ok,i<=10);
 const rls=(await pg.query("SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('profiles','lunches','recipes','settings','menus','dishes','history','login_limits')")).rows;assert.equal(rls.length,8);assert.ok(rls.every(x=>x.relrowsecurity));
 for(const role of ['anon','authenticated']){await pg.exec('SET ROLE '+role);await assert.rejects(()=>pg.query('SELECT * FROM public.lunches'),/permission denied/);await assert.rejects(()=>pg.query('SELECT * FROM public.app_sessions'),/permission denied/);await assert.rejects(()=>pg.query("SELECT save_shared_record('lunches','2026-11-10','{}',1)"),/permission denied/);await assert.rejects(()=>pg.query("SELECT create_shared_session('x','y')"),/permission denied/);await assert.rejects(()=>pg.query("SELECT check_login_limit('x')"),/permission denied/);await pg.exec('RESET ROLE');}
 await pg.exec('SET ROLE service_role');assert.equal((await pg.query('SELECT * FROM public.lunches')).rows.length,1);await pg.exec('RESET ROLE');
}finally{await pg.close();}});
