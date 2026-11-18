export const libraries={art:'美術',photo:'攝影'};
export const normalize=x=>String(x??'').normalize('NFKC').toLocaleLowerCase();
export const localized=x=>Array.isArray(x)?x.map(localized).join('、'):String(x??'');
export function external(x){
 try{const u=new URL(x);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}
}
const localImage=x=>typeof x==='string'&&/^(?:\.\/)?assets\/[\w-]+\.(webp|png|jpe?g)$/i.test(x);
const nonempty=x=>typeof x==='string'&&Boolean(x.trim());
export function readCases(data){
 if(!Array.isArray(data?.cases))throw TypeError('invalid case list');
 const entries=[],seen=new Set(),paths=new Set(),digests=new Set(),records=new Set();
 for(const c of data.cases){
  if(!c||!nonempty(c.id)||!Object.hasOwn(libraries,c.library)||![c.title,c.creator,c.date,c.source?.checked,c.license?.label].every(nonempty)||!localized(c.technique)||!localImage(c.image?.src)||!external(c.source?.url))continue;
  const path=c.image.src.replace(/^\.\//,'');
  const digest=c.image.sha256||'';
  const u=new URL(c.source.url);u.hash='';
  for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k))u.searchParams.delete(k);
  const record=u.href.replace(/\/$/,'');
  if(seen.has(c.id)||paths.has(path)||records.has(record)||(digest&&digests.has(digest)))continue;
  seen.add(c.id);paths.add(path);records.add(record);if(digest)digests.add(digest);
  const terms=normalize([c.title,c.titleEn,c.creator,c.technique,c.date,c.visual,c.method,c.why,c.tags].map(localized).join(' | '));
  entries.push({...c,terms,serial:String(entries.length+1).padStart(3,'0')});
 }
 return entries;
}
export function queryCases(cases,{group='all',query='',method=''}={}){
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return cases.filter(c=>(group==='all'||c.library===group)&&(!method||[c.technique].flat().includes(method))&&words.every(x=>c.terms.includes(x)));
}
