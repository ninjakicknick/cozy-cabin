import { CabinAudio } from './audio.js';
import { readMemory, saveMemory, parentView, neighbor, positions } from './state.js';

const $ = selector => document.querySelector(selector);
const stage = $('#stage'), scene = $('#scene'), caption = $('#caption');
const back = $('#back'), actionPanel = $('#action-panel'), primary = $('#primary-action');
const book = $('#book'), pageText = $('#page-text'), pageTitle = $('#page-title');
let storage; try { storage = window.localStorage; } catch {}
const memory = readMemory(storage);
const state = { view: 'room', selected: null, input: 'pointer', idle: false, page: memory.page };
const things = {
  books: { scale: 1.9, x: 10, y: 31 }, fire: { scale: 2.18, x: 24, y: 60 },
  window: { scale: 1.75, x: 62, y: 28 }, record: { scale: 2, x: 86, y: 49 },
  cat: { scale: 2.35, x: 88, y: 76 },
};
const pages = [
  ['November', 'The first snow came while the kettle was on.\n\nI put another cup out. Old habit.\n\nThere is enough wood beneath the window to last until the road appears again.'],
  ['A small repair', 'The window latch sticks in the cold. Lift it a little before you pull.\n\nThe record with the plain sleeve belongs here. Please leave it when you go.'],
  ['Undated', 'I used to count the lit windows across the lake.\n\nThree on clear nights. Two when it snows.\n\nYesterday there were four.'],
  ['Inside the back cover', 'If you came here to get something done, I am afraid I have misplaced the clock key.\n\nStay anyway.'],
];
let captionTimer, idleTimer, petUntil = 0, lastFrame = performance.now(), quietTime = 0;
let glimmerUntil = 0, nextGlimmer = performance.now() + 65000 + Math.random() * 60000;
const audio = new CabinAudio(ok => {
  $('#sound').classList.toggle('unavailable', !ok);
  $('#sound').title = ok ? 'Sound · M' : 'Sound could not start. Tap to retry.';
});
function save() { saveMemory(storage, memory); }
function say(text, duration = 4300) {
  clearTimeout(captionTimer);
  caption.textContent = text;
  caption.classList.toggle('show', Boolean(text));
  captionTimer = setTimeout(() => caption.classList.remove('show'), duration);
}
function wake() {
  state.idle = false;
  stage.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (state.view === 'book') return;
    state.idle = true;
    stage.classList.add('idle');
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  }, 4800);
}
function updateControls() {
  const view = state.view;
  const labels = {
    books: 'Open the clothbound book', fire: memory.emberUntil > Date.now() ? 'Let the fire settle' : 'Add a log',
    window: memory.windowOpen ? 'Close the window' : 'Crack the window',
    record: memory.recordOn ? 'Lift the needle' : 'Lower the needle', cat: 'Pet the cat',
  };
  const label = labels[view];
  actionPanel.hidden = !label;
  primary.textContent = label || '';
  back.hidden = view === 'room' || view === 'book';
  back.setAttribute('aria-label', view === 'floor' ? 'Sit back up' : view === 'chair' ? 'Get up from the armchair' : 'Return to room');
  $('#sound').textContent = memory.muted ? 'Sound off' : 'Sound on';
  $('#sound').setAttribute('aria-pressed', String(!memory.muted));
  scene.classList.toggle('record-playing', memory.recordOn);
  scene.classList.toggle('window-open', memory.windowOpen);
  scene.classList.toggle('well-tended', memory.emberUntil > Date.now());
  for (const spot of document.querySelectorAll('.spot')) {
    spot.hidden = view !== 'room';
    spot.classList.toggle('selected', view === 'room' && state.input !== 'pointer' && spot.dataset.id === state.selected);
  }
  $('#floor-spot').hidden = view !== 'chair';
  $('#floor-spot').classList.toggle('selected', view === 'chair' && state.input !== 'pointer');
}
function updateVideos() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = state.view === 'chair' ? 'chair' : state.view === 'floor' ? 'floor' : 'room';
  for (const video of document.querySelectorAll('video')) {
    const active = video.dataset.view === visible && !document.hidden && !reduced;
    if (active) video.play().catch(() => {}); else video.pause();
    video.parentElement.classList.toggle('motion-off', reduced);
  }
}
function go(view) {
  const previous = state.view;
  state.view = view;
  say('');
  scene.classList.remove('chair-view', 'floor-view', 'cat-pet');
  if (view === 'chair' || view === 'floor') scene.classList.add(`${view}-view`);
  const point = things[view === 'book' ? 'books' : view];
  scene.style.transform = point ? `scale(${point.scale}) translate(${(50-point.x)*(point.scale-1)/point.scale}%,${(50-point.y)*(point.scale-1)/point.scale}%)` : '';
  stage.dataset.view = view;
  stage.setAttribute('aria-label', view === 'floor' ? 'Lying beside the fireplace' : view === 'chair' ? 'Sitting in the armchair' : 'Cozy cabin');
  if (view === 'book') {
    renderPage(); book.showModal(); $('#next-page').focus();
  } else if (book.open) book.close();
  if (view === 'room') state.selected = previous === 'chair' ? 'chair' : positions[previous] ? previous : state.selected;
  if (view !== 'book' && document.activeElement instanceof HTMLElement) document.activeElement.blur();
  updateControls(); updateVideos(); audio.mix(view, memory); wake();
  if (view === 'chair' || view === 'floor') audio.sound('wood');
}
function returnBack() { if (state.view !== 'room') go(parentView(state.view)); }
function renderPage() {
  const [title, text] = pages[state.page];
  pageTitle.textContent = title;
  pageText.textContent = text;
  $('#page-number').textContent = String(state.page + 1).padStart(2, '0');
  $('#previous-page').disabled = state.page === 0;
  $('#next-page').disabled = state.page === pages.length - 1;
  $('#margin-note').hidden = !(memory.listened && state.page === 2);
  memory.page = state.page; save();
}
function turnPage(direction) {
  const next = Math.max(0, Math.min(pages.length - 1, state.page + direction));
  if (next === state.page) return;
  state.page = next; audio.sound('page'); renderPage();
}
function act() {
  wake(); audio.wake();
  switch (state.view) {
    case 'room': go(state.selected || 'chair'); break;
    case 'chair': go('floor'); break;
    case 'floor': break;
    case 'books': audio.sound('page'); go('book'); break;
    case 'book': turnPage(state.page === pages.length - 1 ? -state.page : 1); break;
    case 'window':
      memory.windowOpen = !memory.windowOpen; audio.sound('wood');
      say(memory.windowOpen ? 'Cold air. The scent of pine.' : 'Warmth gathers behind the glass.'); break;
    case 'record':
      memory.recordOn = !memory.recordOn; audio.sound('needle');
      say(memory.recordOn ? 'The long way home.' : 'The needle comes to rest.'); break;
    case 'fire':
      if (memory.emberUntil > Date.now()) { say('It has everything it needs.'); break; }
      memory.emberUntil = Date.now() + 20 * 60e3; audio.sound('wood');
      say('The new wood catches slowly.'); break;
    case 'cat':
      if (performance.now() < petUntil) return;
      petUntil = performance.now() + 2300; audio.sound('purr');
      say(['One ear turns toward you.', 'A paw uncurls. Then a purr.', 'You may stay.'][Math.floor(Math.random() * 3)]);
      scene.classList.add('cat-pet'); break;
  }
  save(); updateControls(); audio.mix(state.view, memory);
}
function navigate(dx, dy) {
  wake();
  if (state.view === 'book') { if (dx) turnPage(dx); return; }
  if (state.view === 'room') state.selected = neighbor(state.selected, dx, dy);
  updateControls();
}
function mute() { memory.muted = !memory.muted; save(); updateControls(); audio.mix(state.view, memory); audio.wake(); }
async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await stage.requestFullscreen(); }
  catch { say('Fullscreen is not available in this browser.'); }
}
for (const spot of document.querySelectorAll('.spot')) {
  spot.addEventListener('click', () => { state.selected = spot.dataset.id; go(spot.dataset.id); });
  spot.addEventListener('pointerenter', () => { state.selected = spot.dataset.id; });
}
$('#floor-spot').addEventListener('click', () => go('floor'));
back.addEventListener('click', returnBack);
primary.addEventListener('click', act);
$('#sound').addEventListener('click', mute);
$('#fullscreen').addEventListener('click', fullscreen);
$('#close-book').addEventListener('click', returnBack);
$('#next-page').addEventListener('click', () => turnPage(1));
$('#previous-page').addEventListener('click', () => turnPage(-1));
book.addEventListener('cancel', event => { event.preventDefault(); returnBack(); });
book.addEventListener('click', event => { if (event.target === book) returnBack(); });
addEventListener('pointermove', () => { state.input = 'pointer'; wake(); updateControls(); }, { passive: true });
addEventListener('pointerdown', () => { state.input = 'pointer'; wake(); audio.wake(); }, { passive: true });
addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  state.input = 'keyboard'; wake(); audio.wake();
  const key = event.key.toLowerCase();
  const directions = { arrowleft: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0], arrowup: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1] };
  if (directions[key]) { event.preventDefault(); navigate(...directions[key]); }
  else if (key === 'escape' || key === 'backspace') { event.preventDefault(); returnBack(); }
  else if (key === 'm') mute();
  else if (key === 'f') fullscreen();
  else if (key === 'enter' || key === ' ') {
    // Native focused buttons retain normal keyboard activation, including dialog controls.
    if (event.target instanceof HTMLButtonElement && !event.target.hidden) return;
    event.preventDefault(); if (!event.repeat) act();
  }
});
addEventListener('visibilitychange', () => { lastFrame = performance.now(); updateVideos(); });
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateVideos);
addEventListener('fullscreenchange', () => {
  $('#fullscreen').textContent = document.fullscreenElement ? 'Leave fullscreen' : 'Fullscreen';
});
let lastButtons = [], lastAxis = '', repeatAt = 0;
function frame(now) {
  const elapsed = Math.min((now - lastFrame) / 1000, 1); lastFrame = now;
  if (!document.hidden) {
    if (['chair','floor','window'].includes(state.view) && !memory.recordOn) {
      quietTime += elapsed;
      if (quietTime > 75 && !memory.listened) { memory.listened = true; save(); }
    }
    if (now > nextGlimmer) {
      glimmerUntil = now + 9000;
      nextGlimmer = now + 110000 + Math.random() * 130000;
    }
    scene.classList.toggle('distant-light', now < glimmerUntil);
  }
  let pad;
  try { pad = [...(navigator.getGamepads?.() || [])].find(p => p?.connected); } catch {}
  if (pad) {
    const buttons = pad.buttons.map(button => button.pressed);
    const edge = i => buttons[i] && !lastButtons[i];
    const axis = Math.abs(pad.axes[0] || 0) > .55 ? (pad.axes[0] > 0 ? 'right' : 'left')
      : Math.abs(pad.axes[1] || 0) > .55 ? (pad.axes[1] > 0 ? 'down' : 'up') : '';
    const axisEdge = axis && (axis !== lastAxis || now > repeatAt);
    if (buttons.some((pressed, i) => pressed && !lastButtons[i]) || axisEdge) {
      state.input = 'gamepad'; wake(); audio.wake();
      if (edge(1)) returnBack(); else if (edge(0)) act();
      if (edge(12) || (axisEdge && axis === 'up')) navigate(0,-1);
      if (edge(13) || (axisEdge && axis === 'down')) navigate(0,1);
      if (edge(14) || (axisEdge && axis === 'left')) navigate(-1,0);
      if (edge(15) || (axisEdge && axis === 'right')) navigate(1,0);
      if (edge(9)) mute();
      if (axisEdge) repeatAt = now + (axis !== lastAxis ? 420 : 220);
      updateControls();
    }
    lastButtons = buttons; lastAxis = axis;
  } else { lastButtons = []; lastAxis = ''; }
  requestAnimationFrame(frame);
}
updateControls(); updateVideos(); audio.mix('room', memory); wake(); requestAnimationFrame(frame);
