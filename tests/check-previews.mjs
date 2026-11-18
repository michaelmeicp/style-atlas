import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {previewUrl,artSvg} from '../preview.mjs';

const dir = new URL('../',import.meta.url);
const get = (path) => fs.readFileSync(new URL(path,dir));
const read = library => JSON.parse(get('data/'+library+'.json'));
const hash = data => createHash('sha256').update(data).digest('hex');
test('both 1,008-card libraries carry local, distinct, usable preview files or vectors',()=>{
  const art=read('art'), photo=read('photo');
  for(const d of [art,photo]) {
    assert.equal(d.entries.length,1008);
    assert.equal(new Set(d.entries.map(e=>e.familyId)).size,42);
  }
  const families=new Map();
  const artSet=new Set();
  for(const e of art.entries) {
    const svg=artSvg(e,false), viz=svg.replace(/<title>.*?<\/title>/g,'');
    assert.match(svg,/^<svg[^>]+viewBox="0 0 384 256"/);
    assert(!/(?:<script|<image\s|onload=)/i.test(svg));
    assert(previewUrl(e).startsWith('data:image/svg+xml'));
    artSet.add(hash(viz));
    if(!families.has(e.familyId)) families.set(e.familyId,e);
  }
  assert(artSet.size>1000,'art geometry should not be synonym duplicates');
  const comparables = Array.from(families.values(), e => hash(artSvg(e,true).replace(/<title>.*?<\/title>/g,'')));
  assert(new Set(comparables).size>=40,'benchmark art treatments should differ across families');
  const names = new Set(), regular = new Set(), reference = new Set();
  for(const e of photo.entries) {
    for(const [benchmark,indices] of [[false,regular],[true,reference]]) {
      const f=previewUrl(e,{benchmark});
      assert.match(f,/^\.\/assets\/photo\/[\w-]+\.webp$/);
      assert(!names.has(f)); names.add(f);
      const b=get(f);
      assert(b.length>200,f);
      assert.equal(b.toString('ascii',0,4),'RIFF',f);
      assert.equal(b.toString('ascii',8,12),'WEBP',f);
      assert.equal(b.readUInt32LE(4)+8,b.length,f);
      indices.add(hash(b));
    }
  }
  for(const e of photo.entries) {
    const f=previewUrl(e,{size:'detail'});
    if(names.has(f)) continue;
    assert.match(f,/^\.\/assets\/photo\/[\w-]+-detail\.webp$/);
    const b=get(f); assert(b.length>500,f);
    assert.equal(b.toString('ascii',0,4),'RIFF',f);
    assert.equal(b.toString('ascii',8,12),'WEBP',f);
    assert.equal(b.readUInt32LE(4)+8,b.length,f);
    names.add(f);
  }
  assert.equal(regular.size,1008,'photographic-frame assets duplicated');
  assert(reference.size>=42,'need variation in comparable photo renderings');
  assert.equal(fs.readdirSync(fileURLToPath(new URL('./assets/photo/',dir))).length,names.size);
});
