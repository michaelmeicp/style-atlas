import {libraries as langLabel, normalize as norm, localized as text, external, readCases, queryCases} from './cases.mjs';
const $=id=>document.getElementById(id);
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!=null)n.textContent=String(value);if(cls)n.className=cls;return n};
const button=(label,action,cls)=>{const b=el('button',label,cls);b.type='button';b.onclick=action;return b};
const fmt=n=>Number(n).toLocaleString('zh-Hant');
let cases=[], group='all', page=1, ready=false, error=false;
const perPage=16, checked=new Set(), broken=new Set(), restore=new WeakMap();
function photo(c,isThumbnail=false){
 const i=el('img');i.alt=c.image.alt||c.title+' · '+c.creator;
 i.decoding='async';i.loading=isThumbnail?'lazy':'eager';
 if(c.image.width>0&&c.image.height>0){i.width=c.image.width;i.height=c.image.height}
 i.addEventListener('error',()=>{
  broken.add(c.id);refreshCoverage();
  const n=el('span','原作預覽暫不可用。可開啟詳情查閱原始來源。','missing-image');i.replaceWith(n);
 });
 i.src=new URL(c.image.src,import.meta.url);
 i.addEventListener('load',()=>{if(!checked.has(c.id)){checked.add(c.id);refreshCoverage();}});
 return i;
}
const focusOn=(dialog,opener)=>{restore.set(dialog,opener);dialog.showModal();dialog.querySelector('[data-close]')?.focus()};
for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('close',()=>{const n=restore.get(d);if(n?.isConnected)n.focus({preventScroll:true});else $('search').focus({preventScroll:true});restore.delete(d)});
 d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.x||e.clientX>r.right||e.clientY<r.y||e.clientY>r.bottom))d.close()});
}
function link(label,href){const a=el('a',label);a.href=external(href);a.target='_blank';a.rel='noopener noreferrer';return a;}
function copy(value,node,status){
 const fallback=()=>{const sel=getSelection();if(sel){const r=document.createRange();r.selectNodeContents(node);sel.removeAllRanges();sel.addRange(r)}status.textContent='未能自動複製；提示文字已選取，可手動複製。'};
 try{if(!navigator.clipboard?.writeText)return fallback();navigator.clipboard.writeText(value).then(()=>{status.textContent='已複製'},fallback)}catch{fallback()}
}
function detail(c,opener){
 const d=$('inspect'),shell=el('div',null,'dialog-in'),head=el('div',null,'dialog-head'),title=el('div');
 const h=el('h2',c.title);h.id='case-title';
 title.append(h);if(c.titleEn)title.append(el('p',c.titleEn,'detail-meta'));
 title.append(el('p',[c.creator,c.date,langLabel[c.library],text(c.technique)].filter(Boolean).join(' · '),'detail-meta'));
 if(c.family?.zh)title.append(el('p','技法家族：'+c.family.zh,'detail-meta'));
 const close=button('×',()=>d.close(),'close');close.dataset.close='';close.setAttribute('aria-label','關閉案例詳情');
 head.append(title,close);
 const zoom=el('div',null,'zoom'), img=photo(c);
 zoom.id='artwork-view';zoom.setAttribute('aria-label','作品圖像');
 const zoomBtn=button('放大檢視',()=>{
  const is=zoom.dataset.zoom!=='true';
  zoom.dataset.zoom=String(is);zoom.tabIndex=is?0:-1;
  zoomBtn.textContent=is?'還原大小':'放大檢視';zoomBtn.setAttribute('aria-pressed',String(is));
  if(!is){zoom.scrollTop=0;zoom.scrollLeft=0}
 },'plain');
 zoomBtn.setAttribute('aria-controls',zoom.id);zoomBtn.setAttribute('aria-pressed','false');zoom.append(img);
 const zoomRow=el('p',null,'view-note');zoomRow.append(zoomBtn,document.createTextNode(c.image.modification?' · '+c.image.modification:' · 保留原作比例'));
 const source=el('dl',null,'source-block');
 const addSource=(label,value)=>{if(!value)return;const wrap=el('div'),dd=el('dd');dd.append(value);wrap.append(el('dt',label),dd);source.append(wrap)};
 addSource('原始來源',link(c.source.publisher||'開啟原作',c.source.url));
 addSource('展示權利',external(c.license.url)?link(c.license.label,c.license.url):c.license.label);
 if(external(c.source.rightsUrl))addSource('權利依據',link('核對原始授權紀錄',c.source.rightsUrl));
 addSource('來源核對日期',c.source.checked);
 addSource('署名',c.source.credit||c.creator);
 if(external(c.source.imageUrl))addSource('來源影像',link('在來源站開啟',c.source.imageUrl));
 if(c.license.note)addSource('權利補充',c.license.note);
 const analysis=el('div',null,'analysis');
 for(const [label,value] of [['可見的畫面效果',c.visual],['可復用的方法',c.method],['為什麼有效',c.why],['來源未證實／未知',c.unknown]]){
  const n=el('section');n.append(el('h3',label),el('p',text(value)||'來源未載明。'));analysis.append(n)
 }
 const promptBox=el('section',null,'prompt-box');promptBox.append(el('h3','練習提示詞'),el('p','本庫依作品編輯的原創練習，不是原作者提示詞。'));
 const prompt=el('pre'),langs=el('div',null,'lang'),copied=el('span',null,'status');copied.setAttribute('role','status');
 const switchLang=key=>{
  prompt.textContent=(key==='en'?c.promptEn:c.prompt)||'此語言未收錄。';prompt.lang=key==='en'?'en':'zh-Hant';
  for(const a of langs.children)a.setAttribute('aria-pressed',String(a.dataset.lang===key));
  copied.textContent='';clone.disabled=!(key==='en'?c.promptEn:c.prompt);
 };
 const clone=button('複製提示詞',()=>copy(prompt.textContent,prompt,copied));
 for(const [k,label] of [['zh','繁體中文'],['en','English']]){const b=button(label,()=>switchLang(k));b.dataset.lang=k;langs.append(b)}
 switchLang('zh');
 promptBox.append(langs,prompt,clone,copied);
 shell.append(head,zoom,zoomRow,source,analysis,promptBox);
 $('inspect-content').replaceChildren(shell);focusOn(d,opener);
}
function refreshCoverage(){
 if(!ready)return;
 if(error){$('coverage').textContent='資料未能載入，現在無法核實收錄數。';return}
 const [a,p]=['art','photo'].map(g=>cases.filter(c=>c.library===g&&!broken.has(c.id)).length);
 $('coverage').textContent='已核對可展示作品：美術 '+fmt(a)+' 件／攝影 '+fmt(p)+' 件。這是作品數，不是不同風格數。';
 if(broken.size)$('coverage').textContent+=' 有 '+fmt(broken.size)+' 張預覽未能顯示。';
}
function showCase(c){
 const card=el('article',null,'card');
 const control=button('',()=>detail(c,control),'card-open');control.setAttribute('aria-label','檢視 '+c.title+'，'+c.creator);
 const captions=el('span',null,'card-text'),upper=el('span',null,'card-top');
 upper.append(el('span',text(c.technique)),el('span',c.serial,'num'));
 captions.append(upper,el('strong',c.title),el('span',c.creator+' · '+c.date,'card-credit'));
 if(c.source.credit&&c.source.credit!==c.creator)captions.append(el('span',c.source.credit,'card-credit'));
 control.append(photo(c,true),captions);card.append(control);return card;
}
function updateMethods(){
 const sel=$('method'),keep=sel.value;
 const fs=$('family'), scoped=cases.filter(c=>group==='all'||c.library===group);
 const options=[...new Set(scoped.filter(c=>!fs.value||c.family?.id===fs.value).flatMap(c=>[c.technique].flat().filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
 sel.replaceChildren(new Option('全部技法',''),...options.map(m=>new Option(m,m)));
 if(options.includes(keep))sel.value=keep;
}
function updateFamilies(){
 const fs=$('family'),keep=fs.value,m=new Map();
 for(const c of cases)if((group==='all'||c.library===group)&&c.family?.id&&c.family?.zh)m.set(c.family.id,c.family.zh);
 fs.replaceChildren(new Option('全部技法家族',''),...[...m].sort((a,b)=>a[1].localeCompare(b[1],'zh-Hant')).map(([id,label])=>new Option(label,id)));
 fs.closest('label').hidden=!m.size;
 if(m.has(keep))fs.value=keep;
}
function clear(){$('search').value=$('method').value=$('family').value='';page=1;updateMethods();render();}
function render(){
 if(!ready)return;
 const tags=norm($('search').value).trim().split(/\s+/).filter(Boolean), method=$('method').value,family=$('family').value;
 const matches=queryCases(cases,{group,query:$('search').value,method,family});
 const pages=Math.max(1,Math.ceil(matches.length/perPage));page=Math.min(Math.max(1,page),pages);
 $('count').textContent=error?'未能載入':'符合 '+fmt(matches.length)+' 件';
 $('clear').hidden=!(tags.length||method||family);
 $('pages').hidden=pages===1;
 $('prev').disabled=page<=1;$('next').disabled=page>=pages;$('page-label').textContent=page+' / '+pages;
 if(matches.length){const frag=document.createDocumentFragment();for(const c of matches.slice((page-1)*perPage,page*perPage))frag.append(showCase(c));$('sheet').replaceChildren(frag)}
 else{
  const m=el('div',null,'empty');
  m.append(el('strong',error?'作品資料未能載入':cases.length?'沒有符合的作品':'暫無通過核實的可展示作品'),
   el('p',error?'請重新整理再試。未能讀取的資料不算作已收錄。':cases.length?'試試較短的字詞，或移除一項篩選。':'只顯示來源與展示權利經核實的入選作品。'));
  if(error)m.append(button('重新載入',()=>location.reload(),'plain'));else if(tags.length||method||family)m.append(button('清除篩選',clear,'plain'));
  $('sheet').replaceChildren(m);
 }
}
function changePage(direction){page+=direction;render();const n=$('count');n.tabIndex=-1;n.focus();$('section-title').scrollIntoView({block:'start'});}
const criteria=$('criteria'),guide=$('guide');guide.querySelector('[data-close]').onclick=()=>guide.close();criteria.onclick=()=>focusOn(guide,criteria);
$('clear').onclick=clear;$('search').maxLength=160;
$('search').oninput=e=>{if(!e.isComposing){page=1;render()}};$('search').addEventListener('compositionend',()=>{page=1;render()});
$('method').onchange=()=>{page=1;render()};$('prev').onclick=()=>changePage(-1);$('next').onclick=()=>changePage(1);
$('family').onchange=()=>{page=1;$('method').value='';updateMethods();render()};
for(const b of document.querySelectorAll('[data-group]'))b.onclick=()=>{
 group=b.dataset.group;page=1;$('method').value=$('family').value='';
 document.querySelectorAll('[data-group]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 updateFamilies();updateMethods();render();
};
try{
 const response=await fetch(new URL('./data/cases.json',import.meta.url));
 if(!response.ok)throw Error('catalog unavailable');
 cases=readCases(await response.json());
 const feature=cases.find(c=>c.featured)||cases.find(c=>c.image?.width>=c.image?.height*1.23)||cases[0];
 if(feature){
  const b=$('feature-open');b.append(photo(feature));b.setAttribute('aria-label','檢視選集作品：'+feature.title);
  b.onclick=()=>detail(feature,b);
  $('feature-caption').append(el('span',feature.title),el('span',feature.creator+' · '+feature.date));$('feature').hidden=false;
 }
}catch{
 error=true;
 if($('sheet').querySelector('[data-static-case]')){
  $('count').textContent='互動功能未能載入。仍可瀏覽下方圖格、展開技法與提示詞，或開啟原始來源。';
 }
}
if(!error){$('gallery-controls').hidden=false;ready=true;updateFamilies();updateMethods();refreshCoverage();render();}
else if(!$('sheet').querySelector('[data-static-case]')){ready=true;refreshCoverage();render();}
