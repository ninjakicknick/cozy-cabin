# Cozy Cabin

A small place to stay for a while. Three connected viewpoints, a fire, snow beyond the windows, a sleeping cat, a record player, and a few things left by someone else.

The experience stays quiet. There are no objectives, inventories, scores, or required discoveries. Sound begins with the first interaction, as required by browsers. Controls fade after a few seconds; moving, touching, or using a key/controller brings them back.

## Visit

https://ninjakicknick.github.io/cozy-cabin/

## Controls

- **Mouse / touch:** choose an object, then its natural action. From the chair, choose the rug to lie by the fire.
- **Keyboard:** arrows / WASD choose spatially; Enter / Space interacts; Escape / Backspace returns one viewpoint. M toggles sound; F toggles fullscreen. Tab works with all visible controls.
- **Controller:** D-pad or left stick chooses; A interacts; B returns. In the chair, A moves to the floor. Start toggles sound. In the book, left/right turns pages.

The web version is the priority; the static, dependency-free runtime also suits a small TV-connected machine. Landscape gives the artwork the most room, but portrait remains usable. Reduced motion preserves still artwork and stops video playback.

## Run locally

Serve this folder over HTTP (`python -m http.server 8000`) and open localhost:8000. ES modules require a server rather than opening index.html directly. There is no build or runtime package dependency. `npm test` runs Node's built-in test runner.

## Implementation

- `app.js`: one navigation state, scene rendering, object interactions, accessible book, keyboard and gamepad input, and subtle ambient events.
- `state.js`: spatial navigation and versioned, defensive device-local persistence.
- `audio.js`: decoded Web Audio loops with baked overlap seams, cancellable gain/filter transitions, and synthesized interaction sounds. Looping does not depend on JS scheduling or requestAnimationFrame.
- `style.css`: original scene alignments preserved; idle controls, book styling, small environmental changes.

Only the active viewpoint's videos run. Object states, the book's page, sound preference, and a small discovery persist locally; the visitor always arrives in the main room. Browser storage can be blocked without breaking the cabin. No analytics, account, server, or remote AI requests.

## Assets

Existing cabin images, animations and fire/wind recordings were supplied by the project owner and preserved. The existing source notes do not establish distribution licenses; no additional third-party recordings were introduced.

`assets/audio/the-long-way-home.mp3` is an original synthesized miniature created for this project. `tools/make-record.py` contains its deterministic score and generator (Python + NumPy); it writes `/tmp/cabin-record.wav`. Encode with ffmpeg at 96 kbps mono. Interaction sounds are synthesized at runtime.

## Testing and next work

Node regression tests cover spatial reachability, nested back navigation, corrupt/unavailable storage, persistence validation, and audio seam continuity. Browser verification notes for each development pass belong in `DEVELOPMENT.md`.

Keep new spaces visually consistent with the three established views. Prefer a handful of characteristic interactions over more hotspots. Do not turn the quiet discoveries into a checklist.
