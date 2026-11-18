const text = v => Array.isArray(v) ? v.flat(Infinity).map(text).join(' ') : v && typeof v==='object' ? Object.values(v).map(text).join(' ') : String(v??'');
export const normalize = v => String(v??'').normalize('NFKC').toLocaleLowerCase().trim();
export function entryFacets(e) {
 return [...new Set([...(Array.isArray(e.tags)?e.tags:[]),e.useTag,e.purpose].filter(x=>typeof x==='string'&&x.trim()))];
}
export function organize(entries) {
 const byFamily=new Map();
 for(const e of entries){
  const key=e.familyId||e.family||e.id;
  if(!byFamily.has(key))byFamily.set(key,[]);
  byFamily.get(key).push({...e, facets:entryFacets(e), searchIndex:normalize(text([e.title,e.titleEn,e.category,e.categoryEn,e.family,e.familyEn,e.use,e.tags,e.parameters,e.preview]))});
 }
 const byCategory=new Map();
 for(const group of byFamily.values()){const c=group[0].category||'';if(!byCategory.has(c))byCategory.set(c,[]);byCategory.get(c).push(group);}
 const categories=[...byCategory.values()],lists=[],result=[];
 for(let ix=0;ix<Math.max(0,...categories.map(x=>x.length));ix++)for(const c of categories)if(c[ix])lists.push(c[ix]);
 for(let ix=0;ix<Math.max(0,...lists.map(x=>x.length));ix++)for(const list of lists)if(list[ix])result.push(list[ix]);
 return result;
}
export function filterEntries(entries,{query='',category='',use='',favorites=null}={}){
 const words=normalize(query).split(/\s+/).filter(Boolean);
 return entries.filter(e=>(!category||e.category===category)&&(!use||e.facets.includes(use))&&(!favorites||favorites.has(e.id))&&words.every(word=>e.searchIndex.includes(word)));
}
export function pageEntries(entries,index,perPage=18){
 const pages=Math.max(1,Math.ceil(entries.length/perPage)), page=Math.max(1,Math.min(pages,index||1));
 return {items:entries.slice((page-1)*perPage,page*perPage),page,pages};
}
export function safeRead(storage,key){
 try{const raw=JSON.parse(storage.getItem(key)||'[]');return new Set(Array.isArray(raw)?raw.filter(a=>typeof a==='string') : []);}catch{return new Set();}
}
