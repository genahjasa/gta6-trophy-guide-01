// The roadmap to the platinum, built from the official descriptions: three
// stages in the order the trophies are meant to be earned.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    time: '60–80 hours',
    blurb:
      'Play the five chapters and take optional missions as they appear. Scan vehicles and study animals on the way — that progress already counts toward 100%. Do the one thing that can be missed (see the Missables tab) in Chapter 1, and keep a manual save at the start of each chapter: there is no mission replay.',
  },
  {
    stage: 2,
    title: 'Stage 2 — The 100% checklist',
    time: 'About 100 hours',
    blurb:
      'After the credits, the 100% Completion checklist opens (Progress > Stats > 100% Completion). It is lenient — roughly 60% of true completion — and nothing on it is missable. Work it in free-roam: 200 of 277 vehicles, 100 of 255 animals, 70 of 80 challenges, 300 stunts, all 8 bank vaults, all 39 gang operations, all 15 Target Decks.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Cleanup & the platinum',
    time: 'About 10 hours',
    blurb:
      'Finish the Strangers & Freaks strands, chase the trophies whose exact trigger is still unconfirmed, and the platinum pops when the last one lands. No online trophies exist, so nothing here can expire.',
  },
];

export function stageOf(trophy) {
  return trophy.stage;
}

export function stageTrophies(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

export function stageProgress(trophies, stage, earned) {
  const list = stageTrophies(trophies, stage);
  return { total: list.length, done: list.filter((t) => earned.has(t.name)).length };
}
