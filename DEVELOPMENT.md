# A place to stay — development notes

## Reviewed

Main through PR #29; recent history around chair/floor fireplace alignment, stuck chair selection, and two wind-loop fixes. Used the deployed main room, chair and floor. Kept the established artwork and all tuned video masks.

## Changes

- Replaced patched global functions and intercepted back listeners with one navigation state.
- Made the floor accessible by A/Enter as well as touch; added spatial directional navigation and analog-stick support.
- Replaced alternating HTML audio / animation-frame loop scheduling with native decoded audio loops. Both fire and wind receive a three-second seam blend. Distance changes volume and filtering; rapid navigation cancels previous automation.
- Paused invisible videos; reduced motion now hides video masks as well as videos so dark placeholder rectangles do not cover the still artwork.
- Removed delayed fire callbacks that could overwrite a different object's caption. Added a renewable, time-based fire state rather than a permanent three-log limit.
- Added an original record, window latch interaction, and four-page cabin notebook. Subtle state survives visits in local storage, with schema validation and failure tolerance.
- Removed the floating cat heart; kept a soft synthesized purr and brief physical response.
- Added idle UI, mute, fullscreen, native keyboard-accessible book controls and a few unannounced environmental details.

## Deliberate limits

No new room images. The existing spatial continuity is more valuable than rapidly adding inconsistent perspectives. No quests, progress tracking UI, tutorial, inventory or settings screen. No autoplay sound before a gesture. No physical gamepad or TV hardware is available in this environment; that final hardware check remains necessary. Runtime audio was verified structurally and through browser playback state, not a human listening comparison on speakers.

## Next possibilities

A single carefully art-directed window-seat viewpoint; a kettle that sounds different from the chair; rare variations in distant lights. Keep the mystery gentle. Expanding it into anything threatening should be a deliberate taste decision.
