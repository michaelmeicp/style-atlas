"""Catalog checks runnable using only Python standard library."""
from pathlib import Path
import collections
import json
import re
import sys
sys.dont_write_bytecode = True
from generate import build

ROOT = Path(__file__).resolve().parent.parent
ids = set()
for lib in ("art", "photo"):
    file = ROOT / "data" / (lib + ".json")
    data = json.loads(file.read_text(encoding="utf-8"))
    assert data == build(lib), f"{lib} generated JSON not reproducible"
    assert data["library"] == lib and len(data["entries"]) == data["entryCount"] == 1008
    assert len(data["families"]) == data["familyCount"] == 42
    assert len({f["category"] for f in data["families"]}) == 7
    families = {f["id"]:f for f in data["families"]}
    for field in ("id","title","titleEn","prompt","promptEn"):
        assert len({e[field] for e in data["entries"]}) == 1008, (lib,field)
    uniq = collections.defaultdict(set)
    shape = collections.Counter()
    for e in data["entries"]:
        assert e["library"] == lib and e["id"] not in ids
        ids.add(e["id"])
        assert e["familyId"] in families and e["preview"]["familyId"] == e["familyId"]
        assert e["family"] == families[e["familyId"]]["title"]
        assert e["origin"] == "original-editorial-recipe" and "非轉載" in e["rights"]
        assert len(e["prompt"]) > 80 and len(e["promptEn"]) > 200
        assert "構圖" in e["parameters"] and e["parameters"]["照明"]
        assert len(e["preview"]["palette"]) == 4 and all(
            re.fullmatch(r"#[\dA-F]{6}", v) for v in e["preview"]["palette"])
        assert "http" not in e["prompt"] and "http" not in e["promptEn"]
        key = (e["preview"]["subject"], e["preview"]["composition"], e["parameters"]["構圖"],
               e["parameters"]["照明"], e["parameters"]["色盤"])
        uniq[e["familyId"]].add(key)
        shape[e["familyId"]] += 1
    assert all(v == 24 for v in shape.values()) and len(shape) == 42
    assert all(len(variants) == 24 for variants in uniq.values())
    print(f"{lib} {len(data['entries'])} cards, {len(families)} families, "
          f"all stable ids and bilingual prompts unique; {file.stat().st_size:,} bytes")
assert len(ids) == 2016
