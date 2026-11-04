// Build-time restore for the compressed, published offline results. Never overwrites a different local result file.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createGunzip} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export async function fileHash(file){const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex')}
export async function restoreResults({archive=path.join(root,'spi/ai/results.sqlite.gz'),manifest=path.join(root,'spi/ai/results_manifest.json'),source=path.join(root,'spi/db/spi.sqlite'),destination=path.join(root,'spi/db/results.sqlite')}={}){
 const info=JSON.parse(fs.readFileSync(manifest,'utf8'));if(await fileHash(source)!==info.source_sha256)throw new Error('The baseline differs from this results snapshot. Rebuild the batch for this baseline.');if(await fileHash(archive)!==info.archive_sha256)throw new Error('The results archive checksum does not match its manifest.');
 if(fs.existsSync(destination)){if(await fileHash(destination)===info.snapshot_sha256)return {restored:false,destination};throw new Error('Existing results differ. Preserve or merge them before restoring the published snapshot.');}
 const temporary=destination+'.restoring-'+process.pid;fs.mkdirSync(path.dirname(destination),{recursive:true});try{await pipeline(fs.createReadStream(archive),createGunzip(),fs.createWriteStream(temporary,{flags:'wx'}));if(await fileHash(temporary)!==info.snapshot_sha256)throw new Error('The restored SQLite checksum is invalid');fs.renameSync(temporary,destination);return {restored:true,destination}}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)restoreResults().then(result=>console.log(JSON.stringify(result))).catch(e=>{console.error(e.message);process.exitCode=1});
