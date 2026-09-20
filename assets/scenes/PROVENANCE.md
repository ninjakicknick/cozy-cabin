# Scene production

Generated with the built-in image-generation tool for Cozy Cabin, using the existing living-room image as the visual reference. The new kitchen became the architectural reference for adjoining spaces. Light-off versions were generated as lighting-only edits of the corresponding daylight/lamplit frame. No stock photos or external artist references were used.

The working high-resolution images remain in the creation session. Production WebP files are encoded at quality 88 using Pillow, preserving full image dimensions. Originals in the existing assets folder were not replaced.

Prompt briefs:
- Kitchen: turn behind the familiar green plaid armchair toward a small timber kitchen; boot room doorway left, kettle and pine mugs at stove right, stairs at far right. Preserve amber wood and snowy blue light.
- Boot room: enter the kitchen's left doorway; bench, coats and scarf left, glazed porch door center-right, brass light switch and snowshoes right.
- Loft: emerge from kitchen stairs under low rafters; bed left, desk and telescope at gabled lake window, little eaves cupboard right.
- Porch: leave boot room onto a covered timber porch; glazed door left, bench, wind chime, bird dish and familiar lake/mountain view.
- Drawer: overhead close-up of the kitchen drawer, with recipe cards, summer ferry postcard, compass, pencil and small mundane objects.
- Eaves: low intimate wool-lined space behind loft cupboard, round window, small wooden boat and biscuit tin; same timber and lamplight.
- Night variants: switch off only the relevant lamp, preserving camera, framing, geometry and all objects; retain moonlight and light from adjoining spaces.

The game aligns hotspots to the actual generated positions rather than assumed prompt coordinates. Scene transforms provide additional seated, reclining, looking and optical viewpoints. Window/exterior masks constrain the procedural snow layer. Lighting variants crossfade without geometry changes.


## Clock and concealed room

Built-in image generation, September 19, 2026. No new external assets or services. PNG originals converted to WebP quality 88, with originals retained in the generation workspace.

- `clock-wall.webp`: existing living-room image as reference. Prompt: close viewpoint turned left at the bookshelf, honey pine panelling and stone chimney; closed flush panel with walnut mechanical wall clock, full threshold visible, no entrance hint.
- `mudroom-empty.webp`: exact boot-room image edit. Prompt: remove only brass key and ring at x27.5%, y29%; preserve empty hook and every other object/camera/light. Runtime clips this variant to the key area so unrelated image details never shift.
- `snug.webp`: clock wall and loft images as material/architecture references. Prompt: tiny ground-floor snug behind the chimney, low glazed lean-to roof, wool daybed, warm stone, turning brass lantern and small wooden thumb instrument.
- `clock-open.webp`: registered edit of the closed clock wall, snug as continuity reference. Prompt: panel swings inward on left hinge with clock attached; same narrow doorway, room visible beyond; keep bookcase, lamp, stone and rug fixed.

Reveal uses a clipped leaf derived from the closed scene and a perspective rotation over the open-state image. Reduced motion uses the final open state immediately. Lantern reflections and roof snow are lightweight canvas layers. Clock ticking, winding, key handling and instrument notes are original Web Audio synthesis.


## Daybed roof viewpoint
`snug-bed.webp` was generated with the built-in image tool from `snug.webp` as an architectural reference, then encoded as optimized WebP. Prompt: first-person camera lying on the daybed with head at the left end, looking up through the same sloping pine-framed glazed roof; snowy evergreen tops and blue winter twilight; narrow chimney edge at right; warm amber light from below; a little blanket at the bottom; no people, UI or text. Six individual pane masks keep procedural snow off timber and interior surfaces.


## Lights-out variants
Ten `*-unlit.webp` plates were created with the built-in image-generation tool from their corresponding existing viewpoint. Prompt: edit lighting only, preserve exact camera/framing/architecture/object positions; extinguish every lamp and candle, retain the original fireplace and cool window light, realistic falloff without crushed blacks. For spaces away from the fire, use faint blue snowlight and distant warm spill. The mudroom key-removal variant changes only the hook patch. WebP quality 88; original art is retained. No fireplace video masks were changed.

## Explorable telescope shore — September 20, 2026
Built-in image generation; no runtime AI. `assets/telescope/shore.webp` uses the existing porch as a world/style reference: an unobstructed telephoto panorama of the same cobalt winter lake, snowy firs and mountains, amber timber cottage with visible windows, path to dock, closed boathouse and red rowboat at left, bent pine on rocky point at right. No UI or people in the base plate. Generated at 1774 × 887; encoded WebP quality 94.

Six transparent sprites were generated together: ochre-coated adult walking with mug, the same adult standing from behind, pajama-clad adult doing a small awkward dance, red fox, perched snowy owl, softly glowing folded paper boat. Brief specified cinematic winter light, isolated full bodies in a 3 × 2 grid, no labels or background. The 1536 × 1024 RGBA output was sliced into cells and encoded as WebP with alpha preserved. Figure sizes and window/path registration are defined against the actual shore plate. No external art references. Source prompts and asset choices are recorded here; the generated originals remain in the creation session.
