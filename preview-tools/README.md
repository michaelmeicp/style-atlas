# Original preview system

The site displays **visual studies**, not camera photographs, social media images,
or verified outputs from a named image model. The 42 × 24 recipes in each library
are more specific than the intentionally simplified illustrations. The photographs'
studio / streetscape / habitat are locally modeled 3D scenes; color and richness
intentionally stay compact for 2,000+ cards. “Same subject” compares simplified
still-life plates across techniques, composition, light and palette.

- **Art:** `preview.mjs` builds SVG from authored paths. It uses the catalog scene,
  subject where modeled, the actual swatch palette, viewing composition, lighting
  and 42 individual finish profiles (ink, optics, raised isometric platform,
  fiber, divot, glaze, registration offset, paper shadow, etc.). Cards load only
  when called within the visible page.
- **Photography:** each entry has a normal 288 × 192 WebP and a shared-subject
  256 × 171 WebP. The asset bake projects original cylinders, boxes and ellipsoids,
  using camera positions, ray intersections, light visibility, surface materials,
  synthetic optics and tonal processing. Original physical models include still
  life, interior, architecture, city or street, flowers, landscape, coast, food,
  sculpted portrait and wildlife. Portraits are deliberately styled as miniature
  non-identified subjects. Four selected recipes have 768 × 512 detail files.
  These are real browser-readable raster assets, not live model generation.
- No imported photography, pasted third-party content, browser image generation
  API calls, or remote dependencies. Python dependencies are for source re-baking
  and validation, not loading the gallery.

## Rebuild or verify

From project root:

```sh
python3 preview-tools/render_photo.py --width 288 --benchmark
python3 preview-tools/check_renders.py
```

Bake tool requires NumPy and Pillow with WebP support. The committed previews work
without either package. The independent audit decodes every WebP, XML-parses every
SVG across normal and benchmark modes, and checks normal image identities. “Unique”
in the audit means different observed rendered pixel arrays (photo) or SVG drawing
instructions (art); it does not assert 2,016 unrelated historical movements.
