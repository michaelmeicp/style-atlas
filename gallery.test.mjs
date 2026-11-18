import {test} from 'node:test';
import assert from 'node:assert/strict';
import {organize,filterEntries,pageEntries,safeRead} from './gallery.mjs';
const source=[
  { id:'ink1',title:'寫意水墨',titleEn:'Ink wash',familyId:'ink',category:'繪畫',tags:['紙本'],parameters:{照明:'柔光'}},
  { id:'ink2',title:'細線水墨',titleEn:'Detailed ink',familyId:'ink',category:'繪畫',tags:['紙本'] },
  { id:'photo1',title:'夜色肖像',titleEn:'Night portrait',familyId:'photo',category:'照片',tags:['人像'] },
];
test('first page interleaves families and index normalizes bilingual text, filters intersect',()=>{
 const entries=organize(source);
 assert.deepEqual(entries.map(e=>e.id),['ink1','photo1','ink2']);
 assert.deepEqual(filterEntries(entries,{query:'ＩＮＫ 柔光',category:'繪畫',use:'紙本'}).map(e=>e.id),['ink1']);
 assert.deepEqual(filterEntries(entries,{query:'ink',favorites:new Set(['ink2','photo1'])}).map(e=>e.id),['ink2']);
 assert.equal(filterEntries(entries,{query:'ink',category:'照片'}).length,0);
});
test('gallery pagination never renders more than fixed page size and clamps invalid page',()=>{
 const entries=Array.from({length:1138},(_,i)=>i);
 assert.equal(pageEntries(entries,999).items.length,4);
 assert.equal(pageEntries(entries,-20).page,1);
 assert.equal(pageEntries(entries,1).items.length,18);
 assert.deepEqual(pageEntries([],12),{items:[],page:1,pages:1});
});
test('favorite persistence reader handles malformed data and duplicates',()=>{
 assert.deepEqual([...safeRead({getItem:()=>'["safe","safe",3]'},'unused')],['safe']);
 assert.equal(safeRead({getItem:()=>{throw Error()}},'unused').size,0);
});
