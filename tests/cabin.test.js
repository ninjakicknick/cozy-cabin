import test from 'node:test';
import assert from 'node:assert/strict';
import { readMemory, saveMemory, neighbor, parentView } from '../state.js';
import { loopSamples } from '../audio.js';

test('missing, corrupt, or blocked storage does not prevent entry', () => {
  for (const storage of [undefined, { getItem() { throw Error('blocked'); } }, { getItem: () => '{bad' }, {getItem: () => 'null'}]) {
    assert.equal(readMemory(storage).recordOn, false);
    assert.doesNotThrow(() => saveMemory(storage, {}));
  }
});
test('saved object states survive a return visit and invalid values are bounded', () => {
  let data;
  const store = { getItem: () => data, setItem: (_, value) => { data = value; } };
  saveMemory(store, { windowOpen: true, recordOn: true, page: 2, listened: true });
  assert.deepEqual(readMemory(store), { windowOpen: true, recordOn: true, page: 2, listened: true, emberUntil: 0, muted: false });
  data = JSON.stringify({ page: 99, emberUntil: 1e30, muted: 'true' });
  const restored = readMemory(store);
  assert.equal(restored.page, 3);
  assert.equal(restored.muted, false);
  assert.ok(restored.emberUntil <= Date.now() + 20 * 60e3);
});
test('back unwinds the floor and book without leaving orphaned views', () => {
  assert.equal(parentView('floor'), 'chair');
  assert.equal(parentView(parentView('floor')), 'room');
  assert.equal(parentView('book'), 'books');
  assert.equal(parentView(parentView('book')), 'room');
});
test('spatial navigation reaches every room object and never wraps across the room', () => {
  assert.equal(neighbor(null, 1, 0), 'chair');
  assert.equal(neighbor('chair', 0, -1), 'window');
  assert.equal(neighbor('window', 1, 0), 'record');
  assert.equal(neighbor('record', 0, 1), 'cat');
  assert.equal(neighbor('chair', -1, 0), 'fire');
  assert.equal(neighbor('fire', 0, -1), 'books');
  assert.equal(neighbor('books', -1, 0), 'books');
});
test('crossfaded buffer joins a discontinuous source without a hard wrap', () => {
  const input = Float32Array.from({length: 48000}, (_, i) => Math.sin(i / 2000) * .5 + i / 96000);
  const output = loopSamples(input, 8000);
  assert.equal(output.length, 40000);
  assert.ok(Math.abs(output.at(-1) - output[0]) < .001);
  assert.ok(output.every(Number.isFinite));
  assert.equal(input.length, 48000);
});
