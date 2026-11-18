import {previewUrl} from './preview.mjs';
import {organize,filterEntries,pageEntries,safeRead} from './gallery.mjs';

const $=id=>document.getElementById(id);
const make=(t,txt,cls)=>{
 const n=document.createElement(t);
 if(txt!=null)n.textContent=String(txt);
 if(cls)n.className=cls;
 return n;
};
const button=(label,fn,cls)=>{const b=make('button',label,cls);b.type='button';b.onclick=fn;return b};
const fmt=n=>Number(n).toLocaleString('zh-Hant');
const STORE='style-atlas-favorites-v1';
let storage;try{storage=localStorage}catch{}
const favorite=safeRead(storage,STORE);
const compared=new Map(), libraries={}, previews=new Map(), loading=new Map();
let library='art', pag=1, favOnly=false, preferredLang='zh', detailEntry=null, toastTimer;
const query=new URL(location.href).searchParams;
if(query.get('library')==='photo')library='photo';
$('search').value=(query.get('q')||'').slice(0,160);

const NAME={art:['01 / ART LIBRARY','探索美術','先選一種媒材、筆觸或構圖。每格都是可直接調整的創作配方。','美術風格原創示意'],photo:['02 / PHOTO LIBRARY','探索攝影','從鏡頭、取景與布光找方向。每格提供一個可延伸的攝影配方。','攝影風格的原創模擬示意']};
function notice(message){
 const toast=$('toast');clearTimeout(toastTimer);toast.hidden=false;toast.textContent=message;
 toastTimer=setTimeout(()=>{toast.hidden=true},2600);
}
function storeFavorites(){try{storage.setItem(STORE,JSON.stringify([...favorite]));}catch{notice('瀏覽器無法儲存收藏，本次仍可使用。')}}
function updateHeader(){
 $('favorite-count').textContent=fmt(favorite.size);
 $('saved').setAttribute('aria-pressed',String(favOnly));
 $('compare-count').textContent=compared.size;
 $('compare-link').disabled=compared.size<2;
 document.querySelectorAll('[data-library]').forEach(b=>{
  const yes=b.dataset.library===library;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));
 });
 $('section-kicker').textContent=favOnly?'SAVED STYLES / 本機收藏':NAME[library][0];
 $('library-heading').textContent=favOnly?(library==='art'?'收藏的美術':'收藏的攝影'):NAME[library][1];
 $('section-caption').textContent=NAME[library][2];
}
function imgFor(e,kind,benchmark=false){
 const img=make('img');
 img.alt=e.title+' · '+NAME[e.library][3];
 img.decoding='async';
 if(kind==='card')img.loading='lazy';
 img.width=650;img.height=450;
 try{
  const key=e.id+'/'+kind+'/'+benchmark;let u=previews.get(key);
  if(u){previews.delete(key);previews.set(key,u)}
  else{u=previewUrl(e,{size:kind==='card'?'card':'detail',benchmark});if(previews.size>=72)previews.delete(previews.keys().next().value);previews.set(key,u);}
  if(typeof u!=='string'||!u)throw Error('no preview');
  img.src=u;
 }catch{img.hidden=true;}
 img.onerror=()=>{img.hidden=true;img.parentElement?.classList.add('no-image')};
 return img;
}
function optionList(select,values,label){
 const keep=select.value||'';
 select.replaceChildren(new Option(label,''),...values.map(v=>new Option(v,v)));
 if(values.includes(keep))select.value=keep;
}
function updateOptions(){
 const entries=libraries[library]?.entries||[];
 const freq=new Map();
 for(const e of entries)for(const t of e.facets)freq.set(t,(freq.get(t)||0)+1);
 const byUse=[...freq].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'zh-Hant')).slice(0,36).map(x=>x[0]);
 optionList($('category'),[...new Set(entries.map(e=>e.category).filter(Boolean))],'所有分類');
 optionList($('use'),byUse,'全部用途或標籤');
}
function saveQuery(){
 const url=new URL(location.href);
 if(library==='photo')url.searchParams.set('library',library);else url.searchParams.delete('library');
 if($('search').value.trim())url.searchParams.set('q',$('search').value.trim());else url.searchParams.delete('q');
 history.replaceState(null,'',url);
}
function fillSwatches(e){
 const n=make('span',null,'swatches');n.setAttribute('aria-hidden','true');
 for(const color of (e.preview?.palette||[]).slice(0,6))if(/^#[0-9a-f]{6}$/i.test(color)){const dot=make('i');dot.style.backgroundColor=color;n.append(dot)}
 return n;
}
function favoriteButton(e,onChange,compact=true){
 const b=button('',()=>{if(favorite.has(e.id))favorite.delete(e.id);else favorite.add(e.id);storeFavorites();refresh();updateHeader();onChange?.();},compact?'heart':'secondary');
 function refresh(){
  const yes=favorite.has(e.id);b.textContent=compact?(yes?'♥':'♡'):(yes?'移除收藏':'加入收藏');
  b.setAttribute('aria-label',(yes?'移除收藏：':'加入收藏：')+e.title);b.setAttribute('aria-pressed',String(yes));
 }refresh();return b;
}
function compareButton(e,compact=true,status=null){
 const b=button('',()=>{
  if(compared.has(e.id))compared.delete(e.id);
  else if(compared.size===2){const warning='已選兩種風格；請先取消其中一種。';if(status)status.textContent=warning;else notice(warning);return;}
  else compared.set(e.id,e);
  refresh();updateHeader();if(status)status.textContent='';
 },compact?'compare-button':'secondary');
 function refresh(){
  const yes=compared.has(e.id);
  b.textContent=yes?'已選比較':(compact?'比較':'加入比較');
  b.setAttribute('aria-label',(yes?'取消比較：':'加入比較：')+e.title);b.setAttribute('aria-pressed',String(yes));
 }refresh();return b;
}
function card(e){
 const a=make('article',null,'card');
 const open=button('',()=>openDetails(e,open),'card-button');
 open.setAttribute('aria-label','查看 '+e.title+' 的風格提示詞');open.dataset.cardId=e.id;
 const media=make('span',null,'card-media'), image=imgFor(e,'card');media.append(image,fillSwatches(e));
 if(image.hidden)media.classList.add('no-image');
 const body=make('span',null,'card-body');
 body.append(make('span',e.category+' · '+e.family,'card-meta'),make('strong',e.title,'card-title'),make('span',e.titleEn,'title-en'));
 open.append(media,body);
 const tools=make('div',null,'card-actions');
 tools.append(favoriteButton(e,()=>{if(favOnly)render()}),compareButton(e));
 a.append(open,tools);
 return a;
}
function empty(title,reason,onReset){
 const box=make('section',null,'empty'), copy=make('div');
 copy.append(make('h3',title),make('p',reason));
 if(onReset)copy.append(button('重新瀏覽',onReset,'text-button'));
 box.append(copy);
 return box;
}
function render(){
 updateHeader();
 const entries=libraries[library]?.entries;
 if(!entries){
  const pending=loading.has(library);
  $('cards').replaceChildren(empty(pending?'正在載入圖鑑…':'此圖庫未能載入',pending?'正在準備配方與預覽。':'可重試，或先切換到另一個圖庫。',pending?null:()=>void showLibrary(library)));
  $('result-count').textContent=pending?'載入中':'載入失敗';
  $('pagination').hidden=true;return;
 }
 const q=$('search').value,category=$('category').value,use=$('use').value;
 const filtered=filterEntries(entries,{query:q,category,use,favorites:favOnly?favorite:null});
 const {items,page,pages}=pageEntries(filtered,pag);
 pag=page;
 $('clear').hidden=!(q||category||use);
 $('result-count').textContent='共 '+fmt(filtered.length)+' 個配方'+(filtered.length===entries.length?' · '+fmt(libraries[library].familyCount)+' 個風格家族':'');
 if(!filtered.length){
  $('cards').replaceChildren(empty(favOnly?'這裡沒有符合的收藏':'找不到符合的風格',favOnly?'點卡片的愛心收藏風格，或切回完整圖庫。':'試試短一點的關鍵字，或移除其中一項篩選。',()=>{
   favOnly=false;resetFilters();
  }));
 } else {
  const frag=document.createDocumentFragment();for(const entry of items)frag.append(card(entry));
  $('cards').replaceChildren(frag);
 }
 $('pagination').hidden=pages<2;
 $('page-label').textContent=fmt(page)+' / '+fmt(pages);
 $('previous').disabled=page<=1;
 $('more').disabled=page>=pages;
}
function resetFilters(){$('search').value=$('category').value=$('use').value='';pag=1;saveQuery();render()}
function switchLibrary(next){
 if(next===library)return;
 library=next;pag=1;
 $('category').value=$('use').value='';
 saveQuery();void showLibrary(next);
}
function nextPage(direction){
 pag+=direction;render();
 $('result-count').tabIndex=-1;$('result-count').focus({preventScroll:true});
 $('library-heading').scrollIntoView({block:'start',behavior:'instant'});
}
function copyPrompt(value,anchor,status){
 if(!value)return;
 const done=()=>{if(status)status.textContent='提示詞已複製';else notice('提示詞已複製')};
 const fallback=()=>{
  const range=document.createRange(),selection=getSelection();
  if(!anchor||!selection)return;
  range.selectNodeContents(anchor);selection.removeAllRanges();selection.addRange(range);
  if(status)status.textContent='瀏覽器未允許自動複製，已選取文字，可手動複製。';
  else notice('已選取文字，可以手動複製。');
 };
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(done,fallback);
 else {const ta=make('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';
  const host=document.querySelector('dialog[open]')||document.body;
  host.append(ta);ta.select();let copied=false;try{copied=document.execCommand('copy')}catch{}ta.remove();if(copied)done();else fallback();}
}
function closeDialog(d){if(d.open)d.close()}
const origFocus=new Map();
function openDialog(d,opener){origFocus.set(d,opener);d.showModal();d.querySelector('[data-close]')?.focus()}
function dialogTop(title,subtitle,titleId,d){
 const top=make('div',null,'dialog-top'),block=make('div'),h=make('h2',title);h.id=titleId;block.append(h);
 if(subtitle)block.append(make('span',subtitle,'title-en'));
 const close=button('×',()=>closeDialog(d));close.dataset.close='';close.setAttribute('aria-label','關閉');
 top.append(block,close);return top;
}
function openDetails(e,opener){
 detailEntry=e;const d=$('details'),shell=make('div',null,'dialog-shell'),img=make('div',null,'detail-preview');
 img.append(imgFor(e,'detail'));
 const actions=make('div',null,'detail-actions'),section=make('div',null,'detail-section'),langs=make('div',null,'language-switch');
 const prompt=make('p',null,'prompt-text'),status=make('p',null,'dialog-status');status.setAttribute('role','status');
 const copy=button('複製提示詞',()=>copyPrompt(prompt.textContent,prompt,status),'pill');
 const choose=(key)=>{preferredLang=key;prompt.textContent=key==='zh'?e.prompt:e.promptEn;prompt.lang=key==='zh'?'zh-Hant':'en';langs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===key)));status.textContent=''};
 for(const [key,label] of [['zh','繁體中文'],['en','English']]){const b=button(label,()=>choose(key));b.dataset.lang=key;langs.append(b)}
 choose(preferredLang);
 section.append(make('h3','提示詞'),langs);actions.append(copy,favoriteButton(e,null,false),compareButton(e,false,status));
 const params=make('dl',null,'params');
 for(const [k,v] of Object.entries(e.parameters||{}))if(v!=null&&v!==''){const unit=make('div');unit.append(make('dt',k),make('dd',Array.isArray(v)?v.join('、'):v));params.append(unit)}
 shell.append(dialogTop(e.title,e.titleEn,'dialog-title',d),img,make('p',NAME[e.library][3]+' · '+e.category+' / '+e.family,'preview-caption'),
  make('p',Array.isArray(e.use)?e.use.join('、'):e.use,'instructions'),section,prompt,actions,status,params,
  make('p',(typeof e.rights==='string'?e.rights:'原創配方；不使用社群貼文中的圖片。'),'credits'));
 $('dialog-content').replaceChildren(shell);
 openDialog(d,opener);
}
function openComparison(){
 if(compared.size!==2)return;
 const d=$('comparison'),shell=make('div',null,'dialog-shell'),grid=make('div',null,'comparison-grid');
 for(const e of compared.values()){
  const block=make('section'),p=make('p',preferredLang==='zh'?e.prompt:e.promptEn,'prompt-text'),
   s=make('p',null,'dialog-status');s.setAttribute('role','status');
  block.append(imgFor(e,'detail',true),make('h3',e.title),p,button('複製提示詞',()=>copyPrompt(p.textContent,p,s),'pill'),s);
  grid.append(block);
 }
 shell.append(dialogTop('並排比較',null,'compare-title',d),
  make('p','使用共同基準畫面，方便對照風格差異。提示詞仍顯示配方原文。','comparison-description'),
  grid,button('清空比較',()=>{compared.clear();updateHeader();render();closeDialog(d)},'text-button'));
 $('compare-content').replaceChildren(shell);openDialog(d,$('compare-link'));
}
for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('click',e=>{if(e.target===d){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog(d)}});
 d.addEventListener('close',()=>{
  const id=d===$('details')&&detailEntry?.id;
  let prior=origFocus.get(d);
  if(id){detailEntry=null;render();prior=[...document.querySelectorAll('[data-card-id]')].find(n=>n.dataset.cardId===id);}
  if(prior?.isConnected&&!prior.disabled)prior.focus({preventScroll:true});
  else if(d===$('details'))$('search').focus({preventScroll:true});
  else if(d===$('comparison')){const status=$('result-count');status.tabIndex=-1;status.focus({preventScroll:true});}
  origFocus.delete(d);
 });
}
$('about-dialog').querySelector('[data-close]').onclick=()=>closeDialog($('about-dialog'));
$('about').onclick=()=>openDialog($('about-dialog'),$('about'));
$('saved').onclick=()=>{favOnly=!favOnly;pag=1;render();$('gallery').scrollIntoView({block:'start'})};
$('clear').onclick=resetFilters;
$('compare-link').onclick=openComparison;
$('previous').onclick=()=>nextPage(-1);
$('more').onclick=()=>nextPage(1);
$('back-top').onclick=()=>{scrollTo({top:0,behavior:'instant'});document.querySelector('.logo').focus({preventScroll:true})};
document.querySelectorAll('[data-library]').forEach(b=>b.onclick=()=>switchLibrary(b.dataset.library));
$('search').maxLength=160;
const updateSearch=()=>{pag=1;saveQuery();render()};
$('search').oninput=e=>{if(!e.isComposing)updateSearch()};
$('search').addEventListener('compositionend',updateSearch);
for(const id of ['category','use'])$(id).onchange=()=>{pag=1;render()};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();$('search').focus()}});
async function load(lib){
 const res=await fetch(new URL('./data/'+lib+'.json',import.meta.url));
 if(!res.ok)throw Error('cannot load '+lib);
 const data=await res.json(), entries=organize(data.entries||[]);
 libraries[lib]={...data,entries,familyCount:new Set(entries.map(e=>e.familyId||e.family)).size};
 $(lib+'-count').textContent=fmt(entries.length);
 if(lib==='art'){
  const hero=entries.find(e=>e.familyId==='art-gouache')||entries[0];
  if(hero)$('hero-image').replaceChildren(imgFor(hero,'detail'));
 }
}
async function showLibrary(lib){
 if(!libraries[lib]&&!loading.has(lib)){
  const p=load(lib).catch(()=>{}).finally(()=>loading.delete(lib));
  loading.set(lib,p);
 }
 updateOptions();render();
 if(loading.has(lib)){
  await loading.get(lib);
  if(library===lib){updateOptions();render();}
 }
}
const heroPhoto=make('img');
heroPhoto.alt='海邊燈塔 · 原創攝影風格合成示意';
heroPhoto.src=new URL('./assets/photo/photo-bluehour-04-detail.webp',import.meta.url);
heroPhoto.width=650;heroPhoto.height=450;heroPhoto.decoding='async';
$('hero-image-2').append(heroPhoto);
await showLibrary(library);
