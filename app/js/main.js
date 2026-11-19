// Boot: load the trophy data, wire the tabs, filters, spoiler setting, export
// and import, and keep the progress bar and detail pane in step.
import { loadEarned, saveEarned, loadSettings, saveSettings, exportProgress, parseImport } from './store.js';
import { KIND_ORDER, KIND_LABELS, filterTrophies } from './filters.js';
import { renderChecklist, renderDetail, renderRoadmap, renderMissables } from './views.js';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sources ?? {};

const state = {
  all: trophies,
  earned: loadEarned(),
  settings: loadSettings(),
  selected: null,
  view: 'checklist',
};

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const countEl = $('count-line');
const emptyEl = $('empty');
const detailEl = $('detail');
const searchEl = $('search');
const gradeEl = $('grade');
const hideEarnedEl = $('hide-earned');
const spoilerEl = $('spoiler');
const chipsEl = $('kind-chips');

function persistSettings() {
  saveSettings(state.settings);
}

function updateProgress() {
  const n = state.earned.size;
  $('earned-count').textContent = String(n);
  const fill = $('progress-fill');
  fill.style.width = `${Math.round((n / trophies.length) * 100)}%`;
  const bar = $('progress-bar');
  bar.setAttribute('aria-valuenow', String(n));
  $('progress-note').textContent =
    n === trophies.length
      ? 'Platinum earned — every trophy is yours.'
      : n === trophies.length - 1
        ? 'One more trophy and the platinum is yours.'
        : `Platinum needs all 54 others — ${trophies.length - 1 - n} to go.`;
}

function selectedTrophy() {
  return trophies.find((t) => t.name === state.selected) ?? null;
}

function renderAll() {
  updateProgress();
  const filtered = filterTrophies(trophies, state.settings, state.earned);
  renderChecklist(rowsEl, countEl, emptyEl, filtered, state, toggleEarned, selectTrophy);
  renderDetail(detailEl, selectedTrophy(), sources, state);
  renderRoadmap($('view-roadmap'), trophies, state, selectTrophy);
  renderMissables($('view-missables'), trophies, state, selectTrophy);
}

function toggleEarned(trophy) {
  if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
  else state.earned.add(trophy.name);
  saveEarned(state.earned);
  renderAll();
}

function selectTrophy(trophy) {
  state.selected = trophy.name;
  showView('checklist');
  renderAll();
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showView(view) {
  state.view = view;
  for (const name of ['checklist', 'roadmap', 'missables']) {
    $(`view-${name}`).hidden = name !== view;
    $(`tab-${name}`).classList.toggle('active', name === view);
  }
  $('checklist-controls').style.display = view === 'checklist' ? '' : 'none';
  detailEl.style.display = view === 'checklist' ? '' : 'none';
}

function buildChips() {
  for (const kind of KIND_ORDER) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (state.settings.kind === kind ? ' active' : '');
    chip.dataset.kind = kind;
    chip.textContent = KIND_LABELS[kind];
    chip.addEventListener('click', () => {
      state.settings.kind = kind;
      persistSettings();
      for (const c of chipsEl.children) c.classList.toggle('active', c.dataset.kind === kind);
      renderAll();
    });
    chipsEl.append(chip);
  }
}

for (const name of ['checklist', 'roadmap', 'missables']) {
  $(`tab-${name}`).addEventListener('click', () => {
    showView(name);
    renderAll();
  });
}

searchEl.value = state.settings.search;
searchEl.addEventListener('input', () => {
  state.settings.search = searchEl.value;
  persistSettings();
  renderAll();
});
gradeEl.value = state.settings.grade;
gradeEl.addEventListener('change', () => {
  state.settings.grade = gradeEl.value;
  persistSettings();
  renderAll();
});
hideEarnedEl.checked = state.settings.hideEarned;
hideEarnedEl.addEventListener('change', () => {
  state.settings.hideEarned = hideEarnedEl.checked;
  persistSettings();
  renderAll();
});
spoilerEl.checked = state.settings.spoiler;
spoilerEl.addEventListener('change', () => {
  state.settings.spoiler = spoilerEl.checked;
  persistSettings();
  renderAll();
});

$('export').addEventListener('click', () => exportProgress(state.earned, state.settings));
$('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state.earned = parseImport(await file.text(), trophies.map((t) => t.name));
    saveEarned(state.earned);
    renderAll();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  event.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies? Your saved progress will be lost.')) {
    state.earned = new Set();
    saveEarned(state.earned);
    renderAll();
  }
});

buildChips();
showView('checklist');
renderAll();
