# Cozy Cabin

A small, persistent place to retreat into. Sit by the fire, turn toward the kitchen, go upstairs, or step out under the porch roof. There are things to handle and traces of other evenings here. None of them need completing.

[Visit the cabin](https://ninjakicknick.github.io/cozy-cabin/)

## Controls

- **Mouse / touch:** choose an object or doorway. The curved arrow near the lower edge of the living room turns toward the kitchen. Controls fade when you settle in; a movement, touch or key brings them back.
- **Keyboard:** arrows / WASD select spatially; Enter / Space interacts; Escape / Backspace goes back. In views with multiple actions, left/right selects an action and X uses the second action. M toggles sound; F toggles fullscreen. Native Tab navigation remains available.
- **Gamepad:** D-pad / left stick selects, A interacts, B returns, X uses the secondary action, Start toggles sound. In the book, left/right turns pages.

Sound starts on the first gesture. A saved sound preference, object states and notebook page survive visits on this device. A brief interruption returns you to your last resting place; a later visit begins in the living room. Familiar places and small routines are remembered locally, without an account or a visible progress system. Blocked browser storage does not prevent entry.

## Development

Static ES modules; no framework, no build, no runtime dependencies. Serve with `python -m http.server 8000`. Run `npm test` for Node's built-in regression tests.

- `clock.js`: a small persistent physical puzzle and access invariants.
- `world.js`: art, scene connections, objects, coordinates, actions and labels.
- `app.js`: shared interaction controller and accessible object readers.
- `renderer.js`: lazy image loading, cancellable scene transitions, active-view video playback, masked weather.
- `state.js`: validated local memory, navigation, active-visit timing and bounded ambient events.
- `rhythms.js`: persistent weather, local-time light, warmth, habitual memory and physical sound paths.
- `input.js`: pure gamepad interpretation shared with tests.
- `audio.js`: native seamless ambience, distance mixing and self-cleaning synthesized sound events.
- `stories.js`: short physical writing found around the cabin.
- `tests/clock.html`: isolated fresh/older-save walkthrough fixture; never writes the normal cabin save.
- `tests/viewport.html`: noindex responsive fixture, using the real application inside portrait/landscape frames.

Images load on first arrival, not all at startup. Only current-scene videos play. Snow is masked to windows/exterior areas and capped at 20 fps. Reduced motion disables it and the video masks. Weather is fictional and continuous across visits; subtle light follows the device’s local time. Records have a finite side, tea cools, and ambient sounds travel from their physical sources. Memory is checkpointed every thirty seconds and on actions/exit; background time never counts as time spent resting. Weather and sound transitions are gradual; the ambience loops independently of JavaScript timing.

## Art and sound

Original room/chair/floor imagery, video and wind/fire recordings remain intact. New scene artwork was generated from those references, with distinct light-off variants, then encoded as WebP. See `assets/scenes/PROVENANCE.md` for production notes. Original supplied assets retain their existing provenance; this pass introduced no third-party recordings.

The two record sides are original synthesized miniatures: `the-long-way-home.mp3` and `before-the-road.mp3`. Their deterministic Python / NumPy score generators are in `tools/`. Other small sound events are synthesized locally. No account, analytics, server calls or live AI service is required.

Physical TV/gamepad use and subjective speaker/headphone sound quality still need hardware verification. Responsive browser checks are not a substitute for testing mobile browser audio policy on a real phone.

Lighting: the quiet Lights control toggles the cabin lamps and candles while leaving the fire burning. Keyboard **L**, or the controller’s top face button (**Y** on Xbox/8BitDo layouts). The setting survives return visits; the existing loft and porch switches can still be used individually.

The loft telescope now looks across an explorable shore. Drag gently to move the view, or hold arrows / WASD or the controller stick / D-pad. A / Enter adjusts focus; B / Escape returns. Aim and focus are remembered. Life on the far shore keeps its own time, whether or not you are watching. Nothing there needs collecting.
