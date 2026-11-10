// Accept the standard preview runner flags and pass supported options to Netlify.
import {spawn} from 'node:child_process';
const input=process.argv.slice(2),args=[];
for(let i=0;i<input.length;i++){if(input[i]==='--host'){i++;continue;}if(input[i]==='--strictPort')continue;args.push(input[i]);}
const child=spawn('npx',['netlify','dev','--dir','public','--framework','#static','--no-open','--offline',...args],{stdio:'inherit',shell:process.platform==='win32'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
