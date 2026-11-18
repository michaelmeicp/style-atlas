#!/usr/bin/env python3
"""Independent XML decoding and actual image pixel decoding for all previews."""
from pathlib import Path
from xml.etree import ElementTree
from hashlib import sha256
import argparse, json, subprocess
from PIL import Image, ImageStat

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=r"""
import {artSvg} from './preview.mjs';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/art.json','utf8'));
for(const e of data.entries) for(const compare of [false,true]) console.log(JSON.stringify([e.id,compare,artSvg(e,compare)]));
"""
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.parse_args()
    proc=subprocess.Popen(['node','--input-type=module','-e',SCRIPT],cwd=ROOT,stdout=subprocess.PIPE,text=True)
    regular=set(); b_count=0; count=0
    for line in proc.stdout:
        id_, cmp, svg=json.loads(line)
        el=ElementTree.fromstring(svg)
        assert el.attrib['viewBox']=='0 0 384 256',id_
        if cmp:
            b_count+=1
        else:
            t=el.find('{http://www.w3.org/2000/svg}title')
            assert t is not None,id_
            el.remove(t)
            regular.add(sha256(ElementTree.tostring(el)).hexdigest())
        count+=1
    assert proc.wait()==0 and count==2016 and b_count==1008
    assert len(regular)==1008
    paths=sorted((ROOT/'assets/photo').glob('*.webp'))
    assert len(paths)==2020
    raw=set()
    for f in paths:
        with Image.open(f) as img:
            img.load()
            assert img.format=='WEBP' and img.width>=256 and img.height>=170,f.name
            assert sum(ImageStat.Stat(img.convert('RGB')).stddev)>4,f.name
            if not f.name.endswith(('-b.webp','-detail.webp')):
                raw.add(sha256(img.tobytes()).hexdigest())
    assert len(raw)==1008
    print('2,016 valid SVG variants, 1,008 unique primary vector treatments; 2,020 valid WebPs and all 1,008 primary pixel arrays distinct.')
if __name__=='__main__':main()
