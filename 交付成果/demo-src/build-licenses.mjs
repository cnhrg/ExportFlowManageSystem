import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const directory=fileURLToPath(new URL('.',import.meta.url));
const lock=JSON.parse(readFileSync(new URL('./package-lock.json',import.meta.url),'utf8'));
const sections=['Third-party notices\n\nInstalled non-development dependencies are attributed below. Some build-time Vue packages are included conservatively even when absent from the browser bundle.'];
for(const [location,entry] of Object.entries(lock.packages)) {
  if(!location||entry.dev)continue;
  const packageDirectory=directory+location+'/';
  const metadata=JSON.parse(readFileSync(packageDirectory+'package.json','utf8'));
  const files=readdirSync(packageDirectory).filter(name=>/^licen[sc]e(?:\.md|\.txt)?$/i.test(name));
  let notice;
  if(files.length)notice=files.map(name=>readFileSync(packageDirectory+name,'utf8')).join('\n');
  else if(metadata.name==='element-plus')notice=readFileSync(new URL('../assets/demo/ELEMENT-PLUS-LICENSE',import.meta.url),'utf8');
  else if(metadata.name==='lodash-unified')notice='Author: Jack Works. License: MIT (package metadata).\nThis entrypoint only re-exports lodash-es. Its re-export declarations add no implementation to the bundle; the lodash implementation and its license are included separately below.';
  else throw new Error('Missing third-party license: '+metadata.name);
  sections.push(metadata.name+' '+metadata.version+' - '+metadata.license+'\n\n'+notice.trim());
}
writeFileSync(new URL('../assets/demo/THIRD-PARTY-LICENSES.txt',import.meta.url),sections.join('\n\n'+'='.repeat(72)+'\n\n')+'\n');
