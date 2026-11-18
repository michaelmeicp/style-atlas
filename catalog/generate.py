"""Reproducibly build the two original style-recipe catalogs using stdlib only."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"
PALETTES = {
    "mineral": ("礦灰、岩朱、白堊", "mineral gray, iron red, chalk",
                ["#293644", "#A65744", "#EEE2CB", "#D8A561"]),
    "slate": ("深靛、鉛灰、冷白", "deep indigo, lead gray, cold white",
              ["#171F33", "#4B6782", "#D8E6E8", "#F1B15A"]),
    "tide": ("深海藍、青瓷、沙白", "marine blue, celadon, sand white",
             ["#163044", "#568879", "#F2E6CA", "#CC755D"]),
    "cedar": ("深棕、蜜茶、奶白", "deep umber, honey tea, cream",
              ["#432B2A", "#B17046", "#F1DEB6", "#9BAA65"]),
    "clay": ("棕黑、乾玫瑰、暖灰", "brown-black, dried rose, warm gray",
             ["#392D38", "#A46674", "#E5D3C8", "#DDAC6F"]),
    "moss": ("墨綠、苔灰、青檸點色", "shadow green, moss gray, lime accent",
             ["#1C3737", "#697E54", "#D9DCB5", "#B2AB54"]),
    "ember": ("暗藍、赭橙、明淺砂", "navy, ochre-orange, pale sand",
              ["#222A42", "#C96D48", "#F7E5BC", "#7D9C95"]),
    "rust": ("鐵灰、紅鏽、杏黃", "iron gray, vermilion rust, apricot",
             ["#393339", "#B84F3B", "#F5DCBA", "#E4A457"]),
    "porcelain": ("深灰、藍白、霧紫", "deep gray, blue-white, misty mauve",
                  ["#282D43", "#7F7D9F", "#E1E9F0", "#98C5C8"]),
    "linen": ("炭灰、燕麥、象牙白", "charcoal, oat, ivory",
              ["#3A382F", "#9B8869", "#F5EEDC", "#788B88"]),
    "petal": ("梅紫、胭脂、淺粉米", "plum, muted rouge, pink shell",
              ["#362948", "#B36D8B", "#F3DBCD", "#CEA269"]),
    "midnight": ("深夜藍、電光青、鎢絲金", "midnight blue, electric teal, tungsten gold",
                 ["#131B34", "#286C79", "#D7E2ED", "#ECA653"]),
    "silver": ("炭黑、銀灰、紙白", "charcoal black, silver gray, paper white",
               ["#202123", "#777876", "#EFEDE6", "#ADACA6"]),
    "sanguine": ("深紅褐、紅堊、暖灰底", "deep red-brown, red chalk, warm gray ground",
                 ["#4A2624", "#A85243", "#E7D2BD", "#F2E3CF"]),
    "prussian": ("普魯士藍、濕曬淺藍、紙白", "Prussian blue, pale contact blue, paper white",
                 ["#152C53", "#476D9B", "#ECEDEB", "#9EB8CB"]),
}
MONO = {
    "graphite": "silver", "charcoal": "silver", "crosshatch": "silver",
    "stippling": "silver", "contour": "silver", "sanguine": "sanguine",
    "ink-wash": "silver", "woodcut": "silver", "etching": "silver",
    "cyanotype": "prussian", "blueprint": "prussian", "monochrome-doc": "silver",
}
# Each photo family gets a compatible shot set; any family not listed uses an
# eight-scene field set for available-light or experimental practice.
SETS = {
  "field": "bridge coast table raincoat night-road cycles gull cafe",
  "spaces": "ridge coast gallery atrium interior pier night-road bridge",
  "details": "leaf petal fabric glass jar shoe frond noodle",
  "food": "noodle cafe glass table petal jar fabric shoe",
  "portrait": "portrait raincoat cafe frond glass jar fabric shoe",
  "light": "portrait table raincoat glass interior shoe petal shadow",
  "abstract": "rings shadow leaf glass fabric gallery bridge cycles",
  "motion": "cycles bridge portrait cafe pier gull night-road leaf",
}
PHOTO_PROFILE = {
    "street-zone":"field", "street-tele":"field", "mobile-candid":"field", "reportage":"field",
    "snapshot-flash":"light", "monochrome-doc":"field", "softbox":"light", "rembrandt":"portrait",
    "clamshell":"portrait", "rim":"light", "window-natural":"light", "hard-gobo":"abstract",
    "portrait-85":"portrait", "macro-one":"details", "focus-stack":"details", "tilt-shift":"spaces",
    "fisheye":"spaces", "split-diopter":"spaces", "color-negative":"field", "reversal":"spaces",
    "instant-film":"field", "bleach-bypass":"field", "infrared":"spaces", "halation":"field",
    "long-exposure":"motion", "golden-land":"spaces", "overcast-arch":"spaces", "bluehour":"spaces",
    "night-practicals":"field", "panorama":"spaces", "flatlay":"details", "product-clean":"details",
    "lifestyle":"field", "food-side":"food", "glass":"details", "editorial-color":"light",
    "motion-pan":"motion", "freeze":"motion", "intentional-blur":"motion", "double-exposure":"abstract",
    "pinhole":"spaces", "projection":"abstract",
}
LIGHT_CONTROL = {
    "softbox":("studio","近距大型柔光箱","a close broad softbox"),
    "rembrandt":("side","高位三角側光","a raised offset key making triangular light"),
    "clamshell":("studio","上主下補的棚燈","an upper key with weaker reflected light below"),
    "rim":("back","窄輪廓背光","a narrow rear rim source"),
    "window-natural":("window","單窗漸弱自然光","fading light from one window"),
    "hard-gobo":("harsh","切割投影硬光","hard projected light cut by a mask"),
    "snapshot-flash":("night","直打閃光","near on-axis flash against ambient falloff"),
    "halation":("night","點光源暈影","halation fringing practical point sources"),
    "golden-land":("dawn","曙暮低角度光","low golden-hour grazing light"),
    "overcast-arch":("overcast","均勻陰天體積光","even overcast ambient light"),
    "bluehour":("dusk","藍調暮光與暖色燈","blue ambient dusk with warm practical lights"),
    "night-practicals":("night","不均勻夜景小光源","uneven scene-motivated local light at night"),
    "product-clean":("studio","無縫紙上寬柔光","broad soft light on a seamless sweep"),
    "food-side":("back","蒸氣及邊緣側逆光","back-side light through vapor and the edge"),
    "glass":("back","窄輪廓燈與黑卡","a narrow tracing light with black cards"),
    "editorial-color":("studio","控制色塊的棚光","controlled studio light separating color blocks"),
    "freeze":("studio","短時閃燈","short-duration flash"),
    "projection":("spot","可見主體的局部投影","localized projection with readable substrate"),
}
# Shot variants change actual spatial arrangement and intended use, keeping
# the family's lens/optical treatment and compatible camera position intact.
VARIANTS = {
  "default": (
    ("全景交代", "Establishing view", "wide", "範圍稍廣，建立環境比例，用前景作尺度參照", "include more surroundings, establish scale with a near element, and keep a legible context", "環境尺度", "environment and scale"),
    ("局部聚焦", "Tight focal view", "closeup", "靠近局部閱讀面，只讓一種形狀或材質掌握焦點", "close in on one reading plane and give focus to a single shape or material", "主細節", "one primary detail"),
    ("邊位留空", "Off-axis study", "negative", "主重心置於邊位，留約三分之一呼吸空間且不以假文字填滿", "offset the center of interest and leave approximately a third of the frame open with no filler typography", "留白版面", "editorial negative space"),
  ),
  "detail": (
    ("紋理顯影", "Texture plane", "closeup", "讓主紋理橫過焦面，構圖保留一段可讀輪廓", "carry the main texture through the focus plane with one recognizable edge", "局部材質", "material detail"),
    ("斜線節拍", "Oblique detail", "diagonal", "在不改變媒材尺度下以斜線呈現接合處，角落保留景深退場", "keep the material scale but run one seam diagonally into the corner focus falloff", "接縫方向", "directional material seam"),
    ("單點提取", "Isolated specimen", "negative", "以窄層焦點孤立單一小片，周圍不干擾主形", "isolate a single small element with a narrow focal plane and uncluttered surroundings", "標本式局部", "isolated fragment"),
  ),
  "panorama": (
    ("開闊地平", "Open horizon", "wide", "以橫幅建立連續地平線和景物尺度，維持等高拼接", "build an uninterrupted wide horizon and consistent scale using level overlapping views", "連續地平", "continuous horizon"),
    ("縱深引導", "Deep panorama", "leading", "維持橫幅連貫、從斜方向延伸至遠處，使每一段有可讀層次", "retain a coherent panoramic ribbon with an oblique near-to-far line and legible segments", "橫幅縱深", "panoramic depth"),
    ("偏軸地標", "Off-axis panorama", "negative", "保持明確寬幅，讓地標弱偏一側、地平占據主要負空間", "keep a distinct wide span, with a slightly offset landmark and most open space along the horizon", "偏軸寬幅", "off-axis wide span"),
  ),
  "flatlay": (
    ("格狀陳列", "Grid arrangement", "overhead", "維持垂直俯視，對齊物件短邊形成規則格線", "maintain straight-down capture and align short edges to form a regular grid", "規整排列", "ordered grid"),
    ("斜向散佈", "Diagonal layout", "diagonal", "維持垂直俯視，把小物沿對角以不等距排列", "maintain straight-down capture and arrange objects at unequal intervals on one diagonal", "斜向排列", "staggered diagonal"),
    ("稀疏陳放", "Sparse overhead", "negative", "維持垂直俯視，只保留一或兩個主要形體和大面積間距", "maintain straight-down capture with only one or two principal forms and abundant spacing", "桌面留白", "spacious overhead drawing"),
  ),
  "motion": (
    ("動線入框", "Movement in context", "pan", "留出下一段移動空間，使環境能交代方向和尺度", "leave room for the next movement and keep environmental clues to direction and scale", "前進空間", "space ahead of motion"),
    ("近沿動態", "Motion detail", "closeup", "收進邊線和局部動態，以一段可辨輪廓當作位置參照", "move close to the edge and local motion, with a readable contour to anchor position", "局部運動", "readable local motion"),
    ("方向留痕", "Directional trace", "diagonal", "以連續斜向節奏串起動態的前後，不讓次要形狀搶焦", "organize the before and after of action along a continuous diagonal without competing secondary shapes", "主要動線", "dominant action axis"),
  ),
}
VARIANT_CHOICE = {
    "macro-one":"detail", "focus-stack":"detail", "panorama":"panorama", "flatlay":"flatlay",
    "motion-pan":"motion", "freeze":"motion", "intentional-blur":"motion", "long-exposure":"motion",
}
ART_LIGHT = {
    "cyanotype": ("back", "接觸曝光、非攝影透視", "contact exposure rather than camera perspective"),
    "blueprint": ("diffused", "均勻圖紙亮度", "even chart illumination"),
    "optical": ("diffused", "平面均勻亮度", "uniform flat illumination"),
    "flat-vector": ("diffused", "無真實投射陰影", "no physical cast shadows"),
}

def rows(path):
    return [line.strip().split("|") for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip()]

def brief_rows():
    result = {}
    fields = ("id","scene","name","nameEn","subjectZh","subject","composition","frameZh","frame",
              "lighting","lightZh","light","palette")
    for row in rows(HERE / "briefs.tsv"):
        b = dict(zip(fields,row,strict=True))
        result[b["id"]] = b
    return result

def build(library):
    is_art = library == "art"
    briefs = brief_rows()
    families, entries = [], []
    for category, category_en, family_id, family, family_en, process, process_en, tip, tip_en, uses in rows(HERE / (library + ".tsv")):
        group = f"{library}-{family_id}"
        families.append(dict(id=group,familyId=group,title=family,titleEn=family_en,category=category,
                             categoryEn=category_en,description=process,entryCount=24))
        if is_art:
            mix = [(b, None) for b in briefs.values()]
        else:
            profile = PHOTO_PROFILE[family_id]
            styles = VARIANTS[VARIANT_CHOICE.get(family_id, "default")]
            mix = [(briefs[key], variant) for key in SETS[profile].split() for variant in styles]
        for ix,(brief,var) in enumerate(mix,1):
            p_zh, p_en, colors = PALETTES[MONO.get(family_id,brief["palette"])]
            composition, frame, frame_en = brief["composition"],brief["frameZh"],brief["frame"]
            scene_name, scene_en = brief["name"],brief["nameEn"]
            lighting, light, light_en = (ART_LIGHT if is_art else LIGHT_CONTROL).get(
                family_id,(brief["lighting"],brief["lightZh"],brief["light"]))
            if var:
                sub,sub_en,composition,frame,frame_en,intent,intent_en=var
                scene_name += "｜"+sub
                scene_en += " / "+sub_en
            else:
                intent, intent_en = brief["name"],brief["nameEn"]
            entry_id = f"{group}-{ix:02}"
            seed = int.from_bytes(hashlib.sha256(entry_id.encode()).digest()[:4],"big")
            subject_zh, subject = brief["subjectZh"],brief["subject"]
            if is_art:
                prompt = (f"請以「{family}」創作原創插畫。畫面：{subject_zh}。技法：{process}；{tip}。"
                          f"構圖：{frame}。明暗：{light}。色盤：{p_zh}。不加入標誌、浮水印或多餘文字。")
                prompt_en = (f"Create an original {family_en.lower()} illustration of {subject}. "
                             f"Process: {process_en.capitalize()}; {tip_en}. Composition: {frame_en.capitalize()}. "
                             f"Value design: {light_en}. Palette: {p_en}. No logos, watermark, or extraneous type.")
            else:
                prompt = (f"生成一張具相機成像質感的原創影像，風格「{family}」。場景：{subject_zh}。"
                          f"光學與技法：{process}；{tip}。取景：{frame}。照明：{light}。"
                          f"色調：{p_zh}。保留合理透視與材質反應（鏡頭或合成的刻意變形除外），無商標、浮水印或多餘文字。")
                prompt_en = (f"Make an original photographic image of {subject} using a {family_en.lower()} approach. "
                             f"Capture treatment: {process_en.capitalize()}; {tip_en}. Framing: {frame_en.capitalize()}. "
                             f"Lighting: {light_en}. Tonal palette: {p_en}. Preserve plausible material response "
                             f"and the specified optical treatment; no logos, watermark, or extraneous type.")
            entries.append(dict(
                id=entry_id, library=library, category=category, categoryEn=category_en,
                family=family, familyEn=family_en, familyId=group,
                title=f"{family} · {scene_name}", titleEn=f"{family_en} · {scene_en}",
                prompt=prompt,promptEn=prompt_en,
                tags=[category,family,brief["name"],light,intent,brief["scene"]],
                use=f"適用：{uses}。此配方重點：{intent}。",
                parameters={"技法":family,"構圖":frame,"照明":light,"色盤":p_zh,"場景":brief["name"],"目標":intent},
                preview={"familyId":group,"scene":brief["scene"],"subject":subject,
                         "composition":composition,"lighting":lighting,"palette":colors,
                         "technique":family_id,"seed":seed},
                rights="本專案重寫提示詞；非轉載、非攝影原檔、無作品／作者背書",
                origin="original-editorial-recipe",
            ))
    return dict(version=1,library=library,
                title="美術風格" if is_art else "攝影風格",
                description="策劃技法家族加上可重複使用的場景與構圖配方，配方數不代表彼此獨立的歷史流派。",
                origin="原創策劃分類與重寫提示，未轉載社群原圖或逐字提示",
                familyCount=len(families),entryCount=len(entries),families=families,entries=entries)

def main():
    DATA.mkdir(parents=True,exist_ok=True)
    for lib in ("art", "photo"):
        result=build(lib)
        out=DATA/f"{lib}.json"
        out.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        print(f"{out.name}: {result['familyCount']} families × 24 = {result['entryCount']} entries, {out.stat().st_size:,} bytes")

if __name__ == "__main__":
    main()
