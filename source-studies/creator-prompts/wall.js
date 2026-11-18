(()=>{'use strict';const bar=document.querySelector('.wall-filters'),q=document.querySelector('#search'),status=document.querySelector('#status'),d=document.querySelector('#lightbox'),pic=document.querySelector('#picture'),title=document.querySelector('#picture-title'),credit=document.querySelector('#picture-credit'),close=document.querySelector('#close'),rows=[...document.querySelectorAll('[data-card]')];bar.hidden=false;
const norm=s=>s.normalize('NFKC').toLocaleLowerCase();
q.addEventListener('input',()=>{const key=norm(q.value.trim());let shown=0;for(const r of rows){r.hidden=Boolean(key)&&!norm(r.textContent+' '+r.dataset.keywords).includes(key);shown+=Number(!r.hidden);}status.textContent=shown?'顯示 '+shown+' 張':'沒有符合的原圖';});
close.addEventListener('click',()=>d.close());
document.addEventListener('click',async e=>{
const target=e.target instanceof Element?e.target:null;if(!target)return;
const a=target.closest('a[data-enlarge]');
if(a&&typeof d.showModal==='function'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){
 e.preventDefault();const card=a.closest('article');pic.src=a.href;pic.alt=a.querySelector('img').alt;title.textContent=card.querySelector('h2').textContent;credit.textContent=card.querySelector('.by').textContent;d.showModal();return;
}
const b=target.closest('button[data-copy]');if(!b)return;const p=b.parentElement.querySelector('.prompt');try{await navigator.clipboard.writeText(p.textContent);status.textContent='已複製原提示詞。';b.textContent='已複製原提示詞';}catch{const s=window.getSelection(),r=document.createRange();r.selectNodeContents(p);s.removeAllRanges();s.addRange(r);status.textContent='已選取原提示詞；請用裝置複製指令。';b.textContent='已選取，請複製';}
});})();
