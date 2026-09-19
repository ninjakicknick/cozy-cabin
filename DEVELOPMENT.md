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

## Verification completed

- Five Node regression tests passed; module syntax and diff whitespace checks passed.
- Live Chrome: notebook open/page/close, keyboard page turns, saved page, chair → floor → chair → room, spatial navigation, fire and cat interaction, record toggle, window toggle, persisted record/window state after reload.
- Idle controls fade; active-view video continues and inactive videos pause. Audio asset readiness succeeded, with no app-origin console errors observed during the exercised flows.
- Responsive fixture checked at 390 × 844 and 844 × 390; notebook text and page/close controls remain readable and reachable. This is viewport testing, not a physical phone test.
- Corrected inactive scene descriptions being exposed to screen readers during verification.
- Native Web Audio seam continuity is covered numerically. No claim of speaker/headphone listening verification or physical gamepad/TV testing.

# The rest of the cabin — expansion pass

Main through 2fbd648 was reviewed before branching. This pass expands beyond the three original views with a connected kitchen, threshold, exterior, upstairs spaces and physical object close-ups. Eight new optimized images include actual lamp-off variants. Existing scene artwork and tuned fireplace placement remain intact.

The scene graph owns exits, hotspot geometry and actions; all input devices use the same graph. Scene loading waits for image decode and cancels superseded transitions. Active-visit events are deterministic and rate-limited, with no background-tab time accumulation. Wall-clock appliance states are separately validated and expire. New state migrates from the existing v1 local save without clearing it.

The soundscape adds a second original record side, synthesized environmental motifs and more distant/occluded mixes upstairs and outside. Weather changes gradually and snow is restricted to outdoor regions. There is no inventory, task list, reward counter or required path.

Pre-publication checks: 12 Node tests pass, including asset/exits integrity, spatial reachability for every hotspot, nested back routes, gamepad edge/repeat/disconnect handling, saved appliance timing, rare-event cooldown, old-save migration, one hour of simulated idle behavior, and seamless audio sample boundaries. Live browser checks are recorded below. Physical hardware and subjective listening remain outside this environment's verification.


## Expansion browser verification

Tested the published application through kitchen, drawer, loft, cupboard, resting space, telescope, boot room and porch. Pointer and keyboard routes, paper open/close, secondary object actions, lamp image variants and kettle readiness across rooms all worked. The loft lamp state survived a full reload. Idle controls faded on the porch. Original chair → floor → chair navigation remains functional; only the current scene video played.

Checked the actual application in the viewport fixture at 390 × 844 and 844 × 390. The kitchen composition fits without cropping away exits, and paper readers remain readable with reachable close controls and scrolling on shorter screens. These are browser viewport checks, not physical touch-device tests. Audio reached its ready state; no application-origin errors were observed during the main walkthrough. Rare event timing and one-hour stability were checked in deterministic unit tests, not an hour-long live browser session.

Final cleanup applies saved sound settings before the initial image decode and gives nested Back controls grammatical accessible labels. All 12 automated checks still pass. Physical controller, television performance and speaker/headphone listening remain unverified.
