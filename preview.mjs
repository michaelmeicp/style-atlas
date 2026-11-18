/* Self-contained original illustrations. No external URLs or social assets. */
const W=384,H=256;
const PALETTES=[
 ['#f3ebd9','#142b2d','#b85931','#cda475','#49897c'],
 ['#ede4f1','#282242','#9d597a','#d1a986','#6e7da4'],
 ['#f0dec7','#1a2533','#cb4d37','#edbc67','#648680'],
 ['#e9e9d6','#263328','#8d532f','#b19469','#678466'],
 ['#f4e8d4','#253349','#306cb1','#e3ac51','#8eabce'],
 ['#f9e1dc','#3d2233','#c53451','#edb082','#645d88'],
 ['#f3eddd','#2e2925','#a94e37','#e2bc86','#577364'],
 ['#e7ebed','#152032','#4c727d','#c8a56f','#7d9cae'],
 ['#eee6d0','#252321','#b58b2b','#dca861','#9a5839'],
 ['#e6e3f5','#1a1e34','#774eea','#f5a987','#55b9d0'],
 ['#ece8e2','#343231','#5d605c','#aba8a4','#7a8586'],
 ['#ede7de','#382638','#8b492d','#e98e72','#b697b4'],
];
function hash(v){let h=2166136261;for(const c of String(v)){h=Math.imul(h^c.codePointAt(0),16777619)}return h>>>0}
function rng(seed){let x=seed;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}}
function mixHex(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('')}
function xml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function recolorShapes(svg, stroke, width, keepFill){return svg.replace(/<(path|ellipse|circle|rect)\b[^<>]*>/g,tag=>{
  if(!/fill="#[a-f0-9]{6}"/i.test(tag))return tag;
  const clean=tag.replace(/\s+stroke(?:-width)?="[^"]*"/g,'').replace(/fill="(#[a-f0-9]{6})"/i,(_,ink)=>'fill="'+(keepFill?ink:'none')+'"');
  return clean.replace(/\s*\/>$/, ' stroke="'+stroke+'" stroke-width="'+width+'"/>');
})}
function pick(v,map,f){for(const [re,result] of map)if(re.test(v))return result;return f}
const techniqueRules=[
 [/pixel|像素|game|8.bit|16.bit/i,'pixel'],[/stained|vitrea|mosaic|琉璃|花窗|馬賽克/i,'glass'],
 [/embroider|textile|woven|needle|quil|編織|刺繡|織|織錦/i,'weave'],[/linocut|woodcut|etch|engrave|print|rubber|engraving|版畫|蝕刻|木刻|木版|凸版|孔版|riso|silk.?screen|絲網/i,'print'],
 [/blueprint|technical|architect|schematic|blue print|製圖|藍圖|建築圖|線稿|圖紙/i,'plan'],
 [/watercolor|watercolour|wash|ink wash|gouache|sumi|水彩|水墨|暈染|粉彩|淡彩/i,'wash'],
 [/impasto|oil paint|impressioni|alla prima|油畫|印象|厚塗|刮刀/i,'oil'],
 [/pointill|halftone|stipple|dot|點描|點彩|網點/i,'dot'],
 [/charcoal|graphite|conté|sketch|pencil|素描|炭筆|鉛筆|石墨/i,'graphite'],
 [/collage|paper cut|origami|papercut|拼貼|剪紙|摺紙|折紙|浮雕/i,'paper'],
 [/op art|kinetic|moire|歐普|光學|動態藝術/i,'op'],[/geomet|bauhaus|constructiv|geometry|cubis|de.stijl|構成|包浩斯|立體派|幾何|構成主義/i,'geometry'],
 [/poster|art deco|deco|advertising|travel graphic|海報|廣告|裝飾藝術|插畫/i,'poster'],
 [/neon|synthwave|vector|cyber|霓虹|合成波|向量|賽博/i,'neon'],
 [/line|comic|manga|illustrat|ink|漫畫|賽璐珞|線描|鋼筆/i,'ink'],
 [/pastel|chalk|encaust|plaster|fresco|ceramic|壁畫|陶瓷|粉筆|蠟/i,'chalk'],
 [/miniature|isometric|3d|low.poly|等角|低多邊|微縮|三維/i,'planes'],
 [/abstract|expression|drip|automatic|action|抽象|表現|滴畫/i,'abstract'],
];
const ART_FAMILY={
 'graphite':'graphite','charcoal':'charcoal','crosshatch':'crosshatch','stippling':'stipple','contour':'contour','sanguine':'sanguine',
 'water-wet':'wash','water-dry':'dry','gouache':'gouache','ink-wash':'inkwash','tempera':'tempera','acrylic-glaze':'acrylic',
 'impasto':'oil','oil-glaze':'glaze','alla-prima':'prima','soft-pastel':'chalk','wax':'wax','pointillism':'dot',
 'woodcut':'print','linocut':'lino','etching':'etch','screenprint':'screen','risograph':'riso','monotype':'mono',
 'papercut':'papercut','layered-paper':'paper','torn-collage':'torn','embroidered':'weave','tile-mosaic':'tile','cyanotype':'cyanotype',
 'flat-vector':'geometry','art-nouveau':'nouveau','deco':'deco','blueprint':'plan','stained-glass':'glass','optical':'op',
 'isometric':'planes','pixel':'pixel','voxel':'voxel','clay':'clay','cel':'ink','wireframe':'wire',
};
const ART_LIGHT={dawn:'warm',diffused:'soft',side:'hard',back:'back',window:'soft',harsh:'hard',night:'night',overcast:'soft',studio:'high',glow:'warm',dusk:'night',spot:'hard'};
const ART_COMP={thirds:[.92,32,7],symmetry:[.92,0,0],diagonal:[1.08,-13,2,-12],negative:[.69,55,22],overhead:[1.14,-13,-5,13],closeup:[1.44,-5,5],layers:[.86,14,12],leading:[.91,-21,10],low:[1.08,-14,-18],wide:[.79,0,10],frame:[.82,0,9],pan:[1.05,-42,3,-4],center:[.95,0,0]};
const ART_SCENE={landscape:'terrain',city:'city',coast:'coast',interior:'interior',portrait:'portrait',stilllife:'still',bloom:'botanic',architecture:'architecture',abstract:'orbit',food:'food',street:'street',wildlife:'animal'};
const artModes=['poster','geometry','wash','print','oil','paper','pixel','glass','dot','graphite','ink','weave','chalk','planes','plan','abstract','op','neon'];
const lightRules=[[/rim|backlight|剪影|逆光|背光/i,'back'],[/dramatic|hard|noir|high contrast|spot|暗調|硬光|戲劇|聚光|黑色電影/i,'hard'],[/soft|overcast|diffus|cloud|柔光|漫射|陰天|薄霧/i,'soft'],[/warm|golden|sunset|twilight|暖|金色|日暮|夕陽/i,'warm'],[/high key|high-key|bright|明調|白晝|高調|通透/i,'high'],[/night|moon|dusk|blue hour|月|藍調|夜|暮/i,'night']];
const compRules=[[/close|macro|detail|微距|特寫|局部/i,[1.38,0,4]],[/minimal|negative space|留白|負空間/i,[.67,47,26]],[/asymmetr|third|offset|三分|偏心|非對稱/i,[.92,35,10]],[/central|mirror|symmetr|center|置中|中央|中置|對稱/i,[.9,0,0]],[/diagon|動勢|斜|對角/i,[1.08,-15,3,-12]],[/panoram|wide|環景|寬|遠景/i,[.78,0,17]],[/overhead|flat lay|俯視|鳥瞰|平鋪/i,[1.12,-14,-5,14]]];
function sceneType(v,fallback){
 return pick(v,[[/still|product|vase|vessel|fruit|靜物|器皿|桌|產品|料理|餐/i,'still'],[/botan|flower|garden|植|花|葉|林/i,'botanic'],
 [/mount|landsca|desert|cloud|cliff|山|丘|荒野|風景|沙漠|岩|雲|極地/i,'terrain'],[/coast|sea|lighthouse|river|ocean|harbo|水面|河|海|港|岸|湖/i,'coast'],
 [/facade|architect|urban|street|archway|interior|門廊|窗|建築|街|室內|樓/i,'city'],[/portrait|silhouette|figure|person|人物|肖像|剪影|服裝/i,'portrait'],
 [/bird|animal|horse|creature|鳥|動物|獸|魚/i,'animal'],[/celestial|space|星|宇宙/i,'orbit']],fallback)
}
function motif(s,n,g,light){
 const [bg,k,a,b,c]=g;
 switch(s){
 case 'linen': return `<path d="m84 162 175-69 56 49-166 63Z" fill="${k}"/><path d="m84 153 170-67 61 56-168 55z" fill="${b}"/><path d="m94 144 157-56 54 48-157 51z" fill="${c}"/><path d="m105 133 143-50 49 44-145 43z" fill="${a}"/><path d="m118 133 129-44 42 37-133 38Z" fill="none" stroke="${k}" stroke-dasharray="2 3" stroke-width="1.2"/><path d="m98 152 54 42m-49-50 49 39m-37-46 40 37m87-58-61 21" stroke="${bg}" stroke-width="1.4" fill="none"/>`;
 case 'boot': return `<path d="M85 214h222l26-15-241 4Z" fill="${k}" opacity=".75"/><path d="M146 83q36 12 65 9l-5 55q46 22 75 34l12 18H84l1-16 29-27 13-16z" fill="${a}"/><path d="M145 84q38-11 65 9l-5 17q-37 4-64-7z" fill="${k}"/><path d="M122 144q20 12 39 10l29-35m-65 22 69 7m-59-14 41 18m-27-26 27 14m-26-20 34 14M89 190H288" fill="none" stroke="${k}" stroke-width="2"/><path d="m267 154 56-62 4 4-54 65z" fill="${b}"/><path d="M263 147q-21 15-4 34l18-25z" fill="${c}"/><path d="M54 125q14-40 57-26m-50 1Q50 78 69 62m-12 48-13 22" fill="none" stroke="${c}" stroke-width="2"/>`;
 case 'still': return `<path d="M75 174H332v40H54z" fill="${b}" opacity=".67"/><path d="M145 187c-24-11-25-55-8-73 10-12 28-16 30-35V57h45v22c2 18 24 23 32 36 15 23 11 62-10 72-18 9-71 9-89 0z" fill="${a}"/><path d="M149 177c-16-21-6-52 13-62m-7 22h70" fill="none" stroke="${bg}" opacity=".65" stroke-width="4"/><ellipse cx="189" cy="58" rx="22.5" ry="7" fill="${k}"/><path d="M244 187c1-30 36-41 49-18 8 16-13 33-33 30z" fill="${c}"/><ellipse cx="111" cy="184" rx="23" ry="16" fill="${b}"/><path d="m110 169 6-10m70-102 5-27m13 25 29-39m-17 41 33-16" fill="none" stroke="${k}" stroke-width="2"/>`;
 case 'interior': return `<path d="M50 202V41h271v161l44 30H18z" fill="${c}"/><path d="M93 49h87v115H93z" fill="${k}"/><path d="M102 57h69v99h-69zM135 57v100m-33-50h70" stroke="${k}" stroke-width="3" fill="${b}"/><path d="M211 145h79l10 44h-98z" fill="${a}"/><path d="M211 189l-14 43m93-43 15 43M88 232l58-50m-5 50 25-38" stroke="${k}" stroke-width="3"/><path d="m209 150 50-15v-18l-9-19h-17l-8 19v12z" fill="${bg}"/>`;
 case 'food': return `<path d="m39 51 287-14 31 170-316 21z" fill="${c}"/><ellipse cx="189" cy="132" rx="117" ry="76" fill="${k}"/><ellipse cx="189" cy="127" rx="106" ry="68" fill="${bg}"/><ellipse cx="189" cy="127" rx="86" ry="51" fill="${b}"/>`+Array.from({length:9},(_,j)=>{let ang=j*Math.PI*2/9;return `<ellipse cx="${190+62*Math.cos(ang)}" cy="${127+38*Math.sin(ang)}" rx="15" ry="10" transform="rotate(${j*40} ${190+62*Math.cos(ang)} ${127+38*Math.sin(ang)})" fill="${j%2?a:c}" stroke="${k}" stroke-width="1.4"/>`}).join('')+`<path d="M168 128q40-31 45 9-36 20-45-9z" fill="${k}"/><path d="M317 65l17 121m-22-118 11 122" stroke="${a}" stroke-width="4"/>`;
 case 'street': return `<path d="M88 40h212v115l83 70H0l88-70z" fill="${b}"/><path d="m0 212 159-74V63L0 97zM384 216 223 139V63l161 31z" fill="${c}"/><path d="M0 97l159-34h64l161 31v-19L221 42h-60L0 72Z" fill="${k}"/><path d="M164 146q30-42 57 0v11h-57z" fill="${k}"/><path d="M158 165h63l29 32H135z" fill="${a}"/><circle cx="146" cy="202" r="12" fill="${k}"/><circle cx="241" cy="202" r="12" fill="${k}"/><path d="M177 209l-28 35m49-35 20 35M53 188l64-41m213 42-63-42" stroke="${bg}" stroke-width="3"/>`;
 case 'architecture': return `<path d="M25 207h335l-72 24H90z" fill="${b}"/><path d="M72 199V94q120-124 240 0v105H72z" fill="${c}"/><path d="M111 200V105q81-100 162 0v95z" fill="${b}"/><path d="M139 199v-82q53-83 106 0v82z" fill="${k}"/><path d="M166 196v-63q26-48 52 0v63z" fill="${a}"/><path d="M86 155H61m263 0h-25M59 195h265M155 209l21-17m57 17-19-17" fill="none" stroke="${bg}" stroke-width="2.4"/>`;
 case 'city': return `<path d="M17 211l90-66 0-92h65v39h43V53h62v93l90 65z" fill="${k}" opacity=".92"/><path d="M47 204l53-38 27-108h46v37h45V45h48l33 125 41 32z" fill="${c}"/><path d="M133 192v-70a56 56 0 0 1 112 0v70Z" fill="${b}"/><path d="M152 192v-66a37 37 0 0 1 74 0v66Z" fill="${k}"/><path d="M173 192v-55a17 17 0 0 1 34 0v55z" fill="${a}"/><path d="m51 213 89-41m195 41-89-41M65 232l88-46m168 46-88-46" stroke="${bg}" fill="none" stroke-width="2"/><path d="M177 87h26M104 128h31m113-26h22M138 63h24" fill="none" stroke="${a}" stroke-width="2.5"/>`;
 case 'botanic': {let st='';for(let i=0;i<9;i++){const x=101+i*23,y=45+33*n(),d=(n()<.5?-1:1),x0=185+36*(n()-.5);st+=`<path d="M${x0} 198Q${x0+d*43} 104 ${x} ${y}" fill="none" stroke="${k}" stroke-width="2"/><path d="M${x} ${y}q${d*29} -31 ${d*53} -10q${d*-19} 33 ${d*-53} 10" fill="${[a,c,b][i%3]}"/><path d="M${x} ${y}q${d*18} -15 ${d*37} -16" fill="none" stroke="${bg}" opacity=".7"/>`}return st+`<path d="M146 176h93l-24 52h-44z" fill="${a}"/><ellipse cx="192" cy="176" rx="47" ry="7" fill="${b}"/>`}
 case 'coast': return `<circle cx="284" cy="71" r="24" fill="${b}"/><path d="M0 120c84 5 135-15 208 0s119 1 176 6v107H0z" fill="${c}"/><path d="M0 164q49 -31 92 1t87 2 83 -2 122 2v89H0z" fill="${k}"/><path d="M0 177q45 -27 90 0t89 0 83 -1 122 1m-384 23q45 -27 90 0t89 0 83 -1 122 1" fill="none" stroke="${bg}" opacity=".57" stroke-width="2"/><path d="M117 157l11-85h28l11 85Z" fill="${bg}"/><path d="M121 133l5-34h34l5 34Z" fill="${a}"/><path d="m122 74 20-26 20 26Z" fill="${k}"/><path d="M181 128h74l-18 17h-41zm34-60v55h-25z" fill="${a}"/>`;
 case 'portrait': return `<circle cx="184" cy="103" r="76" fill="${b}"/><path d="M113 215q-16-37 26-48l27-10v-40C131 90 141 42 172 33c60-12 90 34 65 75l17 22-20 11q0 21-20 24l-9 19 60 18 9 32H104z" fill="${a}"/><path d="M153 121q-40-30-6-75c33-43 100-17 108 35q-32-6-51-27-16 50-51 67z" fill="${k}"/><path d="M192 99q9-15 26-11m-11 16h13m-9 41 17-3m-85 70 43-31 19 43" fill="none" stroke="${k}" stroke-width="2.5"/><circle cx="183" cy="142" r="10" fill="none" stroke="${bg}" stroke-width="2"/>`;
 case 'animal': return `<path d="M85 155q34 4 60-22 4-39 55-55 22-43 58-30 30 8 35 49l23 13-28 11c-8 40-56 61-103 47-43 27-78 27-122 17l69-20Z" fill="${k}"/><path d="M159 132c14-50 63-50 105-27-49 2-46 49-101 55z" fill="${a}"/><circle cx="274" cy="80" r="4" fill="${bg}"/><path d="m181 172-10 29m35-28-10 28m-91 3h198" fill="none" stroke="${b}" stroke-width="3"/>`;
 case 'orbit': return `<circle cx="187" cy="124" r="72" fill="${a}"/><ellipse cx="188" cy="124" rx="142" ry="43" transform="rotate(-15 188 124)" fill="none" stroke="${k}" stroke-width="6"/><ellipse cx="188" cy="124" rx="150" ry="54" transform="rotate(-15 188 124)" fill="none" stroke="${c}" stroke-width="2"/><circle cx="116" cy="76" r="19" fill="${b}"/><circle cx="295" cy="146" r="15" fill="${bg}"/><path d="M182 62q-56 60-6 122" stroke="${bg}" fill="none" stroke-width="3" opacity=".5"/>`;
 default: return `<circle cx="266" cy="70" r="32" fill="${b}"/><path d="M0 192 103 92 152 142 213 44 384 205v51H0z" fill="${c}"/><path d="M0 207l108-80 49 37 61-61 70 65 96 20v68H0z" fill="${k}"/><path d="M121 255q120-43 119-65t144-25v91z" fill="${b}"/><path d="M183 88l31-43 33 38-25-11-8 13-13-7z" fill="${bg}"/><path d="M26 201l87-59m21 56 71-64m12 84 75-46" stroke="${a}" stroke-width="3" fill="none"/>`;
 }
}
function artSvg(entry,benchmark){
 const p=entry.preview??{}, get=(key)=>[p[key],entry[key+'En'],entry[key]].filter(Boolean).join(' '), id=entry.id??'unknown';
 const seed=hash(id+'//'+p.seed), r=rng(seed);
 const tx=get('technique')+' '+[entry.family,entry.familyEn,p.familyId].join(' '), light=ART_LIGHT[p.lighting]??pick(get('lighting'),lightRules,['soft','warm','night','back','hard','high'][hash(get('lighting'))%6]);
 const mode=ART_FAMILY[p.technique]??ART_FAMILY[String(p.familyId).replace(/^art-/,'')]??pick(tx,techniqueRules,artModes[hash(tx)%artModes.length]);
 const sg=get('scene')+' '+get('subject');
 const scene=benchmark?'still':p.scene==='stilllife'&&/folded linen sheet/i.test(p.subject)?'linen':p.scene==='stilllife'&&/boot waiting/i.test(p.subject)?'boot':(ART_SCENE[p.scene]??sceneType(sg,['still','terrain','city','coast','botanic','portrait','orbit','animal'][hash(sg||id)%8]));
 const fallbackPalette=PALETTES[hash(get('palette')||id)%PALETTES.length];
 const valid=p.palette?.length>=4&&p.palette.slice(0,4).every(x=>/^#[a-f0-9]{6}$/i.test(x));
 const [base,ink,a,b,c]=valid?[p.palette[2],p.palette[0],p.palette[3],mixHex(p.palette[2],p.palette[3],.43),p.palette[1]]:fallbackPalette;
 const bg=light==='night'||mode==='neon'?ink:base,k=bg===ink?base:ink;
 const pal=[bg,k,a,b,c];
 const [zoom,x,y,degrees=0]=ART_COMP[p.composition]??pick(get('composition'),compRules,[[.82,-26,15],[1,0,0],[1.12,18,-6],[.75,43,22],[1.16,-28,-8,-10]][hash(get('composition')||id)%5]);
 const motifSeed=benchmark?328978:hash(sg||id), n=rng(motifSeed);
 let defs=`<linearGradient id="light" x1="0" y1="0" x2="${light==='hard'?'1':'0.7'}" y2="1"><stop stop-color="${light==='warm'?b:bg}"/><stop offset="1" stop-color="${light==='night'?a:(light==='hard'?k:c)}" stop-opacity="${light==='hard'?.83:.38}"/></linearGradient><clipPath id="frame"><rect x="0" y="0" width="384" height="256"/></clipPath><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5l5-5" stroke="${k}" opacity=".27" stroke-width=".65"/></pattern><pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0v16" fill="none" stroke="${k}" opacity=".25" stroke-width=".55"/></pattern>`;
 let back=`<rect width="384" height="256" fill="${bg}"/><rect width="384" height="256" fill="url(#light)"/>`;
 let m=motif(scene,n,pal,light), top='', wrapper='';
 const scatter=(count,fn)=>Array.from({length:count},(_,i)=>fn(r()*W,r()*H,i)).join('');
 const flip=(s)=>`<g transform="translate(384 0) scale(-1 1)">${s}</g>`;
 switch(mode){
 case 'charcoal':
 case 'sanguine': {
   const dust=mode==='sanguine'?'#793b36':'#3c3632', mid=mode==='sanguine'?'#a56f56':'#6c6560';
   defs+=`<filter id="crumb"><feTurbulence baseFrequency=".20" type="fractalNoise" numOctaves="2" seed="${seed%90}"/><feDisplacementMap scale="${mode==='sanguine'?5:8}" in="SourceGraphic"/></filter>`;
   back=`<rect width="384" height="256" fill="${mode==='sanguine'?'#e6c9aa':'#dfd9cb'}"/>`;
   m=m.replaceAll(k,dust).replaceAll(a,mid).replaceAll(c,mid).replaceAll(b,'#bba393');
   wrapper='filter="url(#crumb)" opacity=".81"';
   top=scatter(155,(x,y,i)=>`<circle cx="${x|0}" cy="${y|0}" r="${r()*1.4+.17}" fill="${i%4===0?'#fff4d9':dust}" opacity=".28"/>`);break;
 }
 case 'contour':
 case 'wire':
 case 'etch':
 case 'crosshatch': {
   const color=mode==='wire'?a:k;
   back=`<rect width="384" height="256" fill="${mode==='wire'?bg:'#eae5d5'}"/>`;
   m=recolorShapes(m,color,mode==='contour'?2:.85,false);
   if(mode==='wire'){
     top=`<rect width="384" height="256" fill="url(#grid)" opacity=".6"/>`;
     m=Array.from({length:5},(_,i)=>`<g transform="translate(${5*i-10} ${3*i-6}) scale(${1.01-i*.007})" opacity="${.82-i*.14}">${m}</g>`).join('');
   }else if(mode==='crosshatch'){
     top=`<rect width="384" height="256" fill="url(#hatch)" opacity=".44"/>`+scatter(135,(x,y,i)=>`<path d="M${x|0} ${y|0}l${10+r()*9|0} ${i%2?9:-9}" stroke="${color}" stroke-width=".55" opacity=".25"/>`);
   }else if(mode==='etch'){
     top=`<path d="M13 12h358v232H13ZM17 16h349v224H17Z" fill="none" stroke="${color}" opacity=".54" stroke-width=".63"/><rect width="384" height="256" fill="url(#hatch)" opacity=".24"/>`;
   }
   break;
 }
 case 'stipple':
   back=`<rect width="384" height="256" fill="#ebe4d2"/>`;
   m=m.replaceAll(a,'#41403d').replaceAll(b,'#7c7671').replaceAll(c,'#a29f93');
   top=scatter(400,(x,y,i)=>`<circle cx="${x|0}" cy="${y|0}" r="${.24+r()*.83}" fill="${i%3===0?'#eae4d7':'#282724'}" opacity=".50"/>`);
   wrapper='opacity=".66"';break;
 case 'dry':
 case 'gouache':
 case 'tempera':
 case 'acrylic':
 case 'glaze':
 case 'prima':
 case 'wax':{
   if(mode==='acrylic'||mode==='glaze'||mode==='wax'){
     const count=mode==='acrylic'?4:3;
     m=Array.from({length:count},(_,i)=>`<g transform="translate(${i*3.2-3} ${i*-2+2})" opacity="${[.25,.48,.61,.74][i]}">${m}</g>`).join('');
     if(mode==='wax')top=scatter(72,(x,y,i)=>`<path d="M${x|0} ${y|0}q5 -4 11 ${i%2?3:-3}" fill="none" stroke="${bg}" opacity=".35"/>`);
   }else {
     const count={dry:191,gouache:49,tempera:178,prima:99}[mode];
     top=scatter(count,(x,y,i)=>`<path d="M${x|0} ${y|0}l${2+r()*(mode==='gouache'?20:9)|0} ${-3+r()*7|0}" fill="none" stroke="${mode==='dry'&&i%2===0?bg:[a,b,c,k][i%4]}" opacity="${mode==='tempera'?.42:.28}" stroke-width="${mode==='gouache'?3:mode==='prima'?2.8:.72}"/>`);
   }
   break;
 }
 case 'inkwash':
   back=`<rect width="384" height="256" fill="#eae5d8"/>`+scatter(40,(x,y,i)=>`<ellipse cx="${x|0}" cy="${y|0}" rx="${10+r()*53|0}" ry="${8+r()*21|0}" fill="#6e706a" opacity=".08"/>`);
   defs+=`<filter id="bleed"><feGaussianBlur stdDeviation="1.7"/></filter>`;
   m=m.replaceAll(a,'#464740').replaceAll(b,'#8e8e83').replaceAll(c,'#62665e');
   m=`<g filter="url(#bleed)" opacity=".68">${m}</g><g opacity=".80">${m}</g>`;break;
 case 'lino':
 case 'screen':
 case 'riso':
 case 'mono': {
   let freq=mode==='riso'?.72:mode==='lino'?.44:0;
   let plate= m.replaceAll(c,mode==='mono'?k:a).replaceAll(b,mode==='mono'?mixHex(bg,k,.40):a);
   if(mode==='mono') {
     defs+=`<filter id="ghost"><feGaussianBlur stdDeviation="2.9"/></filter>`;
     m=`<g transform="translate(5 -3)" filter="url(#ghost)" opacity=".5">${plate}</g><g opacity=".82">${plate}</g>`;
   }else {
     m=`<g transform="translate(${mode==='screen'?-3:2.5} 2)" opacity=".4">${plate}</g><g opacity=".85">${m}</g>`;
   }
   if(freq)top=`<rect width="384" height="256" fill="url(#hatch)" opacity="${freq}"/>`;
   if(mode==='riso')top+=scatter(169,(x,y,i)=>`<circle cx="${x|0}" cy="${y|0}" r="${.45+r()*1.2}" fill="${[a,k][i%2]}" opacity=".45"/>`);break;
 }
 case 'cyanotype': {
   back=`<rect width="384" height="256" fill="#154b71"/>`;
   m=m.replaceAll(a,'#d4dfdc').replaceAll(b,'#8eb8cf').replaceAll(c,'#e7e5cf').replaceAll(k,'#5d99b9').replaceAll(bg,'#e2eae5');
   top=scatter(110,(x,y)=>`<circle cx="${x|0}" cy="${y|0}" r=".8" fill="#8bbecc" opacity=".23"/>`);break;
 }
 case 'papercut':
 case 'torn': {
   back+=`<path d="M0 90 50 68 90 69 157 75 182 52 210 74 279 60 384 60v42L280 92l-50 25-77-17-80 8L0 120Z" fill="${b}" opacity=".5"/>`;
   if(mode==='torn'){defs+=`<filter id="torn"><feTurbulence baseFrequency=".068" numOctaves="2" seed="${seed%91}"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>`;wrapper='filter="url(#torn)"';}
   else {m=m.replaceAll(c,k).replaceAll(b,a);top=`<path d="M14 16h356v226H14z" fill="none" stroke="${a}" stroke-width="2"/>`;}
   break;
 }
 case 'tile':
 case 'voxel':{
   const tiles=Array.from({length:214},(_,i)=>{let x=r()*W|0,y=r()*H|0,d=2+(r()*8|0);return `<rect x="${x}" y="${y}" width="${d}" height="${d}" fill="${[a,b,c,k][i%4]}" opacity=".42" transform="rotate(${(i%5-2)*9} ${x} ${y})"/>`}).join('');
   top=tiles+`<rect width="384" height="256" fill="url(#grid)" opacity=".67"/>`;
   if(mode==='voxel'){m=`<g opacity=".28" transform="translate(8 -6)">${m}</g>`+m;wrapper='shape-rendering="crispEdges"';}
   break;
 }
 case 'clay':{
   defs+=`<filter id="clay-shadow"><feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="${k}" flood-opacity=".58"/></filter>`;
   wrapper='filter="url(#clay-shadow)"';
   top=scatter(65,(x,y)=>`<ellipse cx="${x|0}" cy="${y|0}" rx="2" ry="1" fill="${bg}" opacity=".24"/>`);
   break;
 }
 case 'nouveau':
 case 'deco':{
   const curve=Array.from({length:13},(_,i)=>mode==='deco'?`<path d="M192 128L${14+i*30} 13" stroke="${a}" stroke-width=".72"/>`:`<path d="M${15+i*2} 237C${11+i*3} 190 ${80-i*2} 143 ${20+i*4} 105C-7 71 ${70+i*2} 29 ${101+i*3} 14" fill="none" stroke="${[a,b,c][i%3]}" stroke-width=".85"/>`).join('');
   back+=curve+(mode==='nouveau'?flip(curve):'');
   top=`<rect x="11" y="11" width="362" height="234" rx="${mode==='deco'?1:25}" fill="none" stroke="${a}" stroke-width="1.2"/><rect x="16" y="16" width="352" height="224" rx="${mode==='deco'?1:20}" fill="none" stroke="${b}" stroke-width=".9"/>`;break;
 }
 case 'wash':
   defs+=`<filter id="wash"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="edge"><feTurbulence type="fractalNoise" baseFrequency=".027" numOctaves="2" seed="${seed%89}"/><feDisplacementMap in="SourceGraphic" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>`;
   back+=scatter(40,(x,y,i)=>`<ellipse cx="${x|0}" cy="${y|0}" rx="${10+r()*60|0}" ry="${8+r()*24|0}" fill="${[a,b,c][i%3]}" opacity=".07"/>`);
   wrapper=`filter="url(#edge)" opacity=".68"`; m=`<g filter="url(#wash)">${m}</g>`+m;break;
 case 'print':{let m1=m.replaceAll(bg,'#e0c79d').replaceAll(c,k).replaceAll(b,a);back=`<rect width="384" height="256" fill="${bg}"/>`;m=m1;top=`<rect width="384" height="256" fill="url(#hatch)" opacity=".78"/>`+scatter(95,(x,y,i)=>`<path d="M${x|0} ${y|0}h${2+r()*19|0}" stroke="${bg}" stroke-width=".8" opacity=".7"/>`);break}
 case 'graphite':{m=m.replaceAll(a,'#5a5851').replaceAll(c,'#77736c').replaceAll(b,'#a4a096');back=`<rect width="384" height="256" fill="${bg}"/>`;wrapper='opacity=".71"';top=`<rect width="384" height="256" fill="url(#hatch)" opacity=".45"/>`+scatter(125,(x,y)=>`<path d="M${x|0} ${y|0}l${4+r()*20|0} ${-8+r()*15|0}" stroke="${k}" stroke-width=".52" opacity=".22"/>`);break}
 case 'plan':
   back=`<rect width="384" height="256" fill="#194765"/><rect width="384" height="256" fill="url(#grid)"/><path d="M18 19h348v218H18z" fill="none" stroke="#e4dfbd" opacity=".65"/>`;
   m=recolorShapes(m,'#f1ebc9',1.1,false).replace(/stroke="#(?!f1ebc9)[0-9a-f]{6}"/gi,'stroke="#82c7e5"');
   top=`<path d="M192 16v224M16 128h350M38 31v180m307 0V31m-307 12h307m-307 168h307" stroke="#afd9eb" opacity=".47" stroke-dasharray="4 5" fill="none"/>`;break;
 case 'oil':
   defs+=`<filter id="dab"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${seed%59}"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter>`;
   wrapper=`filter="url(#dab)"`;
   top=scatter(185,(x,y,i)=>`<path d="M${x|0} ${y|0}q${r()*9|0} ${-r()*5|0} ${4+r()*15|0} ${-5+r()*12|0}" stroke="${[a,b,c,k][i%4]}" stroke-width="${1+r()*3|0}" opacity=".23" fill="none"/>`);break;
 case 'paper':
   defs+=`<filter id="lift"><feDropShadow dx="1.2" dy="4.3" stdDeviation="2.3" flood-color="#191614" flood-opacity=".55"/></filter>`;
   wrapper='filter="url(#lift)"';back+=`<path d="M0 73 384 29v47L0 105Z M0 163l384-26v47L0 189Z" opacity=".36" fill="${b}"/><path d="M0 202l384-37v91H0Z" opacity=".34" fill="${c}"/>`;break;
 case 'weave':
   defs+=`<pattern id="weave" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M0 0h6v5H0z" fill="none" stroke="${k}" stroke-width=".49" opacity=".52"/><path d="M0 4.6h6" stroke="${bg}" stroke-width=".65"/></pattern>`;
   back+=`<path d="M10 10h364v236H10zM21 21h342v214H21" stroke="${a}" stroke-width="3" stroke-dasharray="3 4" fill="none"/>`;
   top=`<rect width="384" height="256" fill="url(#weave)" opacity=".78"/>`;break;
 case 'pixel':{
   const block=benchmark?6:4+seed%5;let clouds='';
   for(let yy=0;yy<H;yy+=block)for(let xx=0;xx<W;xx+=block){const j=(xx-195)/(120*zoom),i=(yy-132)/(73*zoom);if(Math.abs(j)+Math.abs(i)<1.4+0.27*r()&&r()<.36)clouds+=`<rect x="${xx}" y="${yy}" width="${block}" height="${block}" fill="${[a,b,c,k][r()*4|0]}" opacity=".32"/>`}
   defs+=`<filter id="lofi" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation=".35"/></filter>`;
   back+=clouds;top=`<rect width="384" height="256" fill="url(#grid)" opacity=".5"/>`;wrapper='shape-rendering="crispEdges" filter="url(#lofi)"';break}
 case 'glass':
   back+=`<path d="M0 34 384 240M0 220 384 22M179 0l35 256M20 0l103 256m180-256-38 256" stroke="${k}" stroke-width="3" opacity=".58"/>`;
   m=recolorShapes(m,k,2.4,true);
   top=scatter(85,(x,y,i)=>`<path d="M${x|0} ${y|0}l${r()*15|0} ${r()*14|0}" stroke="${bg}" opacity=".44" stroke-width="1"/>`);break;
 case 'dot':
   defs+=`<pattern id="dot" width="6" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="${k}"/><circle cx="4" cy="4" r=".41" fill="${k}"/></pattern>`;top=`<rect width="384" height="256" fill="url(#dot)" opacity=".4"/>`+scatter(110,(x,y,i)=>`<circle cx="${x|0}" cy="${y|0}" r="${1+r()*2}" fill="${[a,b,c,k][i%4]}" opacity=".48"/>`);break;
 case 'op':
   back=`<rect width="384" height="256" fill="${bg}"/>`+Array.from({length:28},(_,i)=>`<path d="M-10 ${i*10}H100Q192 ${i*10+(i%2?58:38)} 272 ${i*10}h130" stroke="${k}" stroke-width="4" fill="none" opacity=".58"/>`).join('');
   wrapper='opacity=".86"';break;
 case 'planes':
   back+=`<path d="M45 167l160-54 140 62-155 62Z" fill="${b}"/><path d="M45 167l145 70v10L45 178z" fill="${c}"/><path d="M190 237l155-62v11l-155 61z" fill="${k}" opacity=".83"/>`;
   m=`<g transform="translate(9 26) matrix(.94 .24 -.20 .79 31 -22)">${m}</g>`;
   top=`<path d="M45 167l145 70 155-62M102 194l164-61m-47 91-145-65" stroke="${k}" fill="none" stroke-width=".68" opacity=".41"/>`;break;
 case 'geometry':
   back+=`<circle cx="48" cy="48" r="38" fill="${b}"/><path d="M0 256 384 38v102L167 256z M0 67l384 49v12L0 96z" fill="${c}" opacity=".7"/><path d="M215 24h133v146h-27V50H215z" fill="${k}" opacity=".24"/>`;break;
 case 'abstract':
   back+=scatter(45,(x,y,i)=>`<ellipse cx="${x|0}" cy="${y|0}" rx="${3+r()*50|0}" ry="${1+r()*14|0}" transform="rotate(${r()*180|0} ${x|0} ${y|0})" fill="${[a,b,c,k][i%4]}" opacity=".3"/>`);m=`<g opacity=".35" transform="translate(-110 10) scale(1.25)">${flip(m)}</g>`+m;break;
 case 'neon':
   defs+=`<filter id="glow"><feGaussianBlur stdDeviation="5"/></filter>`;
   back=`<rect width="384" height="256" fill="#171324"/>`+Array.from({length:13},(_,i)=>`<path d="M0 ${144+i*i*.72}H384M${i*38-10} 259L192 146" fill="none" stroke="${c}" stroke-width=".75" opacity=".58"/>`).join('');
   m=`<g filter="url(#glow)">${m}</g><g opacity=".84">${m}</g>`;break;
 case 'chalk':
   back+=scatter(255,(x,y,i)=>`<circle cx="${x|0}" cy="${y|0}" r="${.3+1.5*r()}" fill="${[a,b,c,k][i%4]}" opacity=".23"/>`);
   wrapper='opacity=".78"';break;
 case 'ink':m=recolorShapes(m,k,1.6,true);back+=`<path d="M12 12h360v232H12z" fill="none" stroke="${k}" stroke-width="1.15"/>`;break;
 }
 const canvas=`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="256" viewBox="0 0 384 256"><title>${xml(entry.title??entry.titleEn??'Style study')} · original illustrative study</title><defs>${defs}</defs><g clip-path="url(#frame)">${back}<g transform="translate(${x} ${y}) translate(192 128) rotate(${degrees}) scale(${zoom}) translate(-192 -128)" ${wrapper}>${m}</g>${top}</g></svg>`;
 return canvas;
}
const detailedPhotos=new Set(['photo-hard-gobo-02','photo-golden-land-05','photo-product-clean-02','photo-bluehour-04']);
const photoId=(id)=>/^[a-zA-Z0-9_-]+$/.test(id??'')?id:'';
export function previewUrl(entry,{size='card',benchmark=false}={}){
 if(entry.library==='photo'||entry.library==='photography') {
   const id=photoId(entry.id);
   if(id)return './assets/photo/'+id+(benchmark?'-b':size!=='card'&&detailedPhotos.has(id)?'-detail':'')+'.webp';
 }
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(artSvg(entry,benchmark));
}
export {artSvg};
