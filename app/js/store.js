// Progress store: earned trophies and settings live in localStorage; export and
// import move them as a JSON file. Nothing here touches the network.
export const EARNED_KEY = 'leonida-ledger-earned-v1';
export const SETTINGS_KEY = 'leonida-ledger-settings-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort()));
}

export function loadSettings() {
  const defaults = { spoiler: false, hideEarned: false, kind: 'all', grade: 'all', search: '' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportProgress(earned, settings) {
  const payload = { game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...earned].sort(), settings };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseImport(text, validNames) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(list)) throw new Error('Expected a JSON array of trophy names, or an object with an "earned" array.');
  const names = new Set(validNames);
  const unknown = list.filter((n) => typeof n !== 'string' || !names.has(n));
  if (unknown.length) throw new Error(`Unknown trophies in file: ${unknown.slice(0, 5).join(', ')}`);
  return new Set(list);
}
