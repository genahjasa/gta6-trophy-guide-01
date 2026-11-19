// Filters: kind, grade, search text, hide-earned, and the spoiler rule. The
// spoiler rule hides a story trophy's name and description until it is earned.
export const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  'side-quests': 'Side quests',
  money: 'Money',
  unknown: 'Not yet known',
  platinum: 'Platinum path',
  online: 'Online',
};

export const KIND_ORDER = ['all', 'story', 'missable', 'collectibles', 'activities', 'crime', 'side-quests', 'money', 'unknown', 'platinum', 'online'];

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

export function isHiddenBySpoiler(trophy, spoilerOn, earned) {
  return spoilerOn && isStoryTrophy(trophy) && !earned.has(trophy.name);
}

export function displayName(trophy, spoilerOn, earned) {
  return isHiddenBySpoiler(trophy, spoilerOn, earned) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, spoilerOn, earned) {
  return isHiddenBySpoiler(trophy, spoilerOn, earned)
    ? 'Hidden until earned — tick it off to reveal it.'
    : trophy.description;
}

export function trophyMatches(trophy, settings, earned) {
  if (settings.kind === 'missable' && !trophy.missable) return false;
  if (settings.kind === 'online') return false; // This list has no online trophies.
  if (settings.kind !== 'all' && settings.kind !== 'missable' && trophy.kind !== settings.kind) return false;
  if (settings.grade !== 'all' && trophy.grade !== settings.grade) return false;
  if (settings.hideEarned && earned.has(trophy.name)) return false;
  const q = settings.search.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function filterTrophies(trophies, settings, earned) {
  return trophies.filter((t) => trophyMatches(t, settings, earned));
}
