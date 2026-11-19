// Views: the checklist rows, the guide detail pane, the roadmap tab and the
// missables tab. All rendering is plain DOM, no framework.
import { KIND_LABELS, displayName, displayDescription, isHiddenBySpoiler } from './filters.js';
import { ROADMAP_STAGES, stageTrophies, stageProgress } from './roadmap.js';

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindTag(trophy) {
  return KIND_LABELS[trophy.kind] ?? trophy.kind;
}

function targetText(trophy) {
  if (trophy.target == null) return null;
  if (trophy.name === 'Dime on the Dollar') return '$250,000 total';
  if (trophy.name === 'Treat Yo Self') return '$100,000 total';
  return `${trophy.target} to go`;
}

function rowElement(trophy, state, onToggle, onSelect) {
  const earned = state.earned.has(trophy.name);
  const li = document.createElement('li');
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'row' + (earned ? ' earned' : '') + (state.selected === trophy.name ? ' selected' : '');
  row.setAttribute('aria-pressed', earned ? 'true' : 'false');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Earned: ${displayName(trophy, state.settings.spoiler, state.earned)}`);
  box.addEventListener('click', (event) => {
    event.stopPropagation();
    onToggle(trophy);
  });

  const body = document.createElement('span');
  const name = document.createElement('span');
  name.className = 't-name';
  name.textContent = displayName(trophy, state.settings.spoiler, state.earned);
  const desc = document.createElement('span');
  desc.className = 't-desc';
  desc.textContent = displayDescription(trophy, state.settings.spoiler, state.earned);
  const meta = document.createElement('span');
  meta.className = 't-meta';
  const kind = document.createElement('span');
  kind.className = 'tag';
  kind.textContent = kindTag(trophy);
  meta.append(kind);
  if (trophy.hidden) {
    const h = document.createElement('span');
    h.className = 'tag hidden-flag';
    h.textContent = 'Hidden on PSN';
    meta.append(h);
  }
  if (trophy.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = 'Potentially missable';
    meta.append(m);
  }
  const target = targetText(trophy);
  if (target) {
    const tg = document.createElement('span');
    tg.className = 'tag target';
    tg.textContent = target;
    meta.append(tg);
  }
  body.append(name, desc, meta);

  const medal = document.createElement('span');
  medal.className = `medal ${trophy.grade}`;
  medal.textContent = gradeLabel(trophy.grade);

  row.append(box, body, medal);
  row.addEventListener('click', () => onSelect(trophy));
  li.append(row);
  return li;
}

export function renderChecklist(rowsEl, countEl, emptyEl, trophies, state, onToggle, onSelect) {
  rowsEl.replaceChildren();
  for (const t of trophies) rowsEl.append(rowElement(t, state, onToggle, onSelect));
  countEl.textContent =
    trophies.length === state.all.length
      ? `Showing all ${trophies.length} trophies.`
      : `Showing ${trophies.length} of ${state.all.length} trophies.`;
  emptyEl.hidden = trophies.length !== 0;
}

export function renderDetail(detailEl, trophy, sources, state) {
  detailEl.replaceChildren();
  if (!trophy) {
    const hint = document.createElement('p');
    hint.className = 'muted';
    hint.textContent = 'Pick a trophy from the list to read its guide, its sources and when it can be missed.';
    detailEl.append(hint);
    return;
  }
  const earned = state.earned.has(trophy.name);
  const hidden = isHiddenBySpoiler(trophy, state.settings.spoiler, state.earned);

  const h2 = document.createElement('h2');
  h2.textContent = displayName(trophy, state.settings.spoiler, state.earned);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Official description hidden until earned.'
    : `“${trophy.description}” — ${gradeLabel(trophy.grade)}${trophy.hidden ? ' · hidden on PlayStation until earned' : ''}`;
  detailEl.append(h2, official);

  const status = document.createElement('p');
  status.textContent = earned
    ? '✓ Earned — ticked off in your checklist.'
    : 'Not earned yet — tick its box in the list when you unlock it.';
  detailEl.append(status);

  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    const strong = document.createElement('strong');
    strong.textContent = 'Potentially missable. ';
    warn.append(strong, document.createTextNode('See the guide below — one step of this trophy is only available in Chapter 1.'));
    detailEl.append(warn);
  }

  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = hidden ? 'Guide hidden until earned.' : trophy.guide;
  detailEl.append(guideH, guide);

  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources';
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const key of trophy.sources) {
    const src = sources[key];
    if (!src) continue;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = src.name;
    li.append(a);
    list.append(li);
  }
  const note = document.createElement('li');
  note.textContent = 'Official name, description and grade: the list as PlayStation publishes it.';
  list.append(note);
  detailEl.append(srcH, list);

  const metaH = document.createElement('h3');
  metaH.textContent = 'Where it fits';
  const meta = document.createElement('p');
  const stage = ROADMAP_STAGES.find((s) => s.stage === trophy.stage);
  meta.textContent =
    `${kindTag(trophy)} · Roadmap ${stage ? stage.title : ''}` +
    (trophy.target != null ? ` · PSN tracks ${trophy.target} toward it` : '') +
    (trophy.hidden ? ' · Hidden on PSN until earned' : '');
  detailEl.append(metaH, meta);
}

export function renderRoadmap(viewEl, trophies, state, onSelect) {
  viewEl.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'muted';
  intro.textContent =
    'One playthrough, about 200 hours, difficulty 4/10 (PowerPyx). No online trophies, no difficulty settings, no mission medals — and no mission replay, so keep a manual save at the start of each chapter.';
  viewEl.append(intro);
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('section');
    card.className = 'stage-card';
    const h2 = document.createElement('h2');
    h2.textContent = stage.title;
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    const prog = stageProgress(trophies, stage.stage, state.earned);
    meta.textContent = `${stage.time} · ${prog.done} of ${prog.total} trophies earned in this stage`;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const list = document.createElement('ol');
    for (const t of stageTrophies(trophies, stage.stage)) {
      const li = document.createElement('li');
      if (state.earned.has(t.name)) li.className = 'earned';
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = displayName(t, state.settings.spoiler, state.earned);
      b.addEventListener('click', () => onSelect(t));
      li.append(b);
      if (t.missable) {
        const m = document.createElement('span');
        m.className = 'tag missable';
        m.textContent = 'Potentially missable';
        li.append(' ', m);
      }
      list.append(li);
    }
    card.append(h2, meta, blurb, list);
    viewEl.append(card);
  }
}

export function renderMissables(viewEl, trophies, state, onSelect) {
  viewEl.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = document.createElement('section');
    card.className = 'miss-card danger';
    const h2 = document.createElement('h2');
    h2.textContent = `⚠ ${t.name} — potentially missable`;
    const p = document.createElement('p');
    p.textContent = t.guide;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Open the full guide';
    b.addEventListener('click', () => onSelect(t));
    card.append(h2, p, b);
    viewEl.append(card);
  }

  const safe = document.createElement('section');
  safe.className = 'miss-card';
  const h2 = document.createElement('h2');
  h2.textContent = 'Everything else cannot be missed';
  const p = document.createElement('p');
  p.textContent =
    'All 12 story trophies unlock automatically as you play the chapters. Every quest giver who goes quiet for a while — Kenton, for example — comes back later, and every side quest stays open in free-roam after the story. Nothing on the 100% checklist is missable, and the five trophies whose exact trigger is still unknown are all doable after the story too. The one habit that protects you anyway: keep a manual save at the start of each chapter (15 manual save slots), because there is no mission replay.';
  const list = document.createElement('ul');
  for (const name of ['Story trophies: automatic, all 12', 'Character questlines (Andy, Kenton, Billy, Randy, Tyrone, Bret): open after the story', 'Strangers & Freaks: open after the story', '100% checklist: nothing missable, all doable in free-roam', 'Cheats disable trophies and saving — keep trophy runs cheat-free']) {
    const li = document.createElement('li');
    li.textContent = name;
    list.append(li);
  }
  safe.append(h2, p, list);
  viewEl.append(safe);
}
