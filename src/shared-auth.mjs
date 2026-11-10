import {createHash,createHmac,randomBytes,timingSafeEqual,scrypt} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const tokenHash=value=>createHash('sha256').update(value).digest('hex');
export const newToken=()=>randomBytes(32).toString('hex');
export function credentialHash(env){return createHmac('sha256',env.SUPABASE_SECRET_KEY).update((env.APP_USERNAME||'lounas')+'\0'+env.APP_PASSWORD).digest('hex');}
// Compare salted, expensive derived keys, never raw password strings.
export async function credentialsMatch(username,password,env){const salt=createHash('sha256').update(env.SUPABASE_SECRET_KEY).digest();const [actual,expected]=await Promise.all([derive(password,salt,32),derive(env.APP_PASSWORD,salt,32)]);const userActual=tokenHash(username.trim().toLowerCase()),userExpected=tokenHash((env.APP_USERNAME||'lounas').trim().toLowerCase());return timingSafeEqual(actual,expected)&&timingSafeEqual(Buffer.from(userActual),Buffer.from(userExpected));}
