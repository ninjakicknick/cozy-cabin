// Small, versioned, device-local memory. A damaged or unavailable store never blocks entry.
export const STORAGE_KEY = 'cozy-cabin.memory.v1';
export function readMemory(storage) {
  let raw = {};
  try { raw = JSON.parse(storage.getItem(STORAGE_KEY)) || {}; } catch {}
  return {
    windowOpen: raw.windowOpen === true,
    recordOn: raw.recordOn === true,
    page: Number.isInteger(raw.page) ? Math.max(0, Math.min(3, raw.page)) : 0,
    emberUntil: Number.isFinite(raw.emberUntil) ? Math.min(raw.emberUntil, Date.now() + 20 * 60e3) : 0,
    listened: raw.listened === true,
    muted: raw.muted === true,
  };
}
export function saveMemory(storage, memory) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch {}
}
export function parentView(view) {
  return view === 'floor' ? 'chair' : view === 'book' ? 'books' : 'room';
}
export const positions = {
  books: [10, 31], fire: [24, 60], chair: [54, 58],
  window: [62, 28], record: [86, 49], cat: [88, 76],
};
export function neighbor(current, dx, dy) {
  const ids = Object.keys(positions);
  if (!positions[current]) return 'chair';
  const [x, y] = positions[current];
  return ids.filter(id => id !== current).map(id => {
    const [xx, yy] = positions[id];
    const forward = (xx - x) * dx + (yy - y) * dy;
    const lateral = Math.abs((xx - x) * dy - (yy - y) * dx);
    return { id, score: forward > 0 ? Math.hypot(xx - x, yy - y) + lateral * 1.8 : Infinity };
  }).sort((a, b) => a.score - b.score).find(item => Number.isFinite(item.score))?.id || current;
}
