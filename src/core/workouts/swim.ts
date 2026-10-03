import type { LocalizedText, WorkoutStep } from "./types";

// Swimming extras: the equipment you take to the pool, the strokes and the
// technique drills. The swim workouts in ./data/swimming.json refer to these by id.

/** The pool lengths we write swim trainings for. */
export const poolLengths = [25, 50] as const;
export type PoolLength = (typeof poolLengths)[number];

export const equipmentTypes = ["fins", "pull_buoy", "paddles", "snorkel", "kickboard"] as const;
export type Equipment = (typeof equipmentTypes)[number];

export const equipmentNames: Record<Equipment, LocalizedText> = {
  fins: { nl: "zoomers", en: "fins" },
  pull_buoy: { nl: "pullbuoy", en: "pull buoy" },
  paddles: { nl: "handpeddels", en: "paddles" },
  snorkel: { nl: "snorkel", en: "snorkel" },
  kickboard: { nl: "plankje", en: "kickboard" },
};

export const strokes = ["freestyle", "backstroke", "breaststroke", "butterfly"] as const;
export type Stroke = (typeof strokes)[number];

/** Full name, and the short code swimmers use on a schedule (BC, RC, SS, VL). */
export const strokeNames: Record<Stroke, { name: LocalizedText; short: LocalizedText }> = {
  freestyle: { name: { nl: "borstcrawl", en: "freestyle" }, short: { nl: "BC", en: "free" } },
  backstroke: { name: { nl: "rugcrawl", en: "backstroke" }, short: { nl: "RC", en: "back" } },
  breaststroke: { name: { nl: "schoolslag", en: "breaststroke" }, short: { nl: "SS", en: "breast" } },
  butterfly: { name: { nl: "vlinderslag", en: "butterfly" }, short: { nl: "VL", en: "fly" } },
};

export type SwimDrill = {
  name: LocalizedText;
  /** How to do it, one or two sentences. Shown in the training and later on the print card. */
  howTo: LocalizedText;
  /** The stroke the drill belongs to. */
  stroke: Stroke;
};

export const swimDrills = {
  catch_up: {
    name: { nl: "bijleggen", en: "catch-up" },
    howTo: {
      nl: "Eén arm tegelijk: de volgende arm begint pas als de andere weer naast hem voor je ligt.",
      en: "One arm at a time: the next arm only starts once the other is back next to it in front of you.",
    },
    stroke: "freestyle",
  },
  fist: {
    name: { nl: "vuisten", en: "fists" },
    howTo: {
      nl: "Zwem met gebalde vuisten en houd je onderarm als peddel. Daarna voel je met open handen meer water.",
      en: "Swim with closed fists and use your forearm as the paddle. Opening your hands afterwards gives more feel for the water.",
    },
    stroke: "freestyle",
  },
  single_arm: {
    name: { nl: "één arm", en: "single arm" },
    howTo: {
      nl: "Zwem met één arm, de andere ligt gestrekt voor je. Adem naar de kant van de zwemmende arm. Wissel per baan.",
      en: "Swim with one arm while the other stays stretched in front. Breathe to the side of the working arm. Switch each length.",
    },
    stroke: "freestyle",
  },
  spread_fingers: {
    name: { nl: "gespreide vingers", en: "spread fingers" },
    howTo: {
      nl: "Spreid je vingers tijdens de doorhaal en maak de slag toch volledig af. Zo leer je de onderarm te gebruiken.",
      en: "Spread your fingers during the pull and still finish the full stroke. It teaches you to pull with your forearm.",
    },
    stroke: "freestyle",
  },
  fingertip_drag: {
    name: { nl: "rits", en: "fingertip drag" },
    howTo: {
      nl: "Sleep bij het terugbrengen je vingertoppen langs het water, met een hoge elleboog.",
      en: "Drag your fingertips along the surface on the recovery, keeping your elbow high.",
    },
    stroke: "freestyle",
  },
  scull_front: {
    name: { nl: "wrikken voor", en: "front scull" },
    howTo: {
      nl: "Armen gestrekt voor je, handen net onder water. Stuw jezelf vooruit met kleine heen-en-weerbewegingen vanuit je polsen.",
      en: "Arms stretched in front, hands just under the surface. Move forward with small side-to-side movements from your wrists.",
    },
    stroke: "freestyle",
  },
  scull_mid: {
    name: { nl: "wrikken zij", en: "mid scull" },
    howTo: {
      nl: "Ellebogen hoog naast je, onderarmen wijzen naar de bodem. Stuw met handen en onderarmen in kleine heen-en-weerbewegingen.",
      en: "Elbows high at your sides, forearms pointing to the bottom. Move forward with small side-to-side movements of hands and forearms.",
    },
    stroke: "freestyle",
  },
  doggy_paddle: {
    name: { nl: "hondjes", en: "doggy paddle" },
    howTo: {
      nl: "Korte slag onder water: haal ongeveer 20 cm door en breng je hand onder water terug naar voren.",
      en: "Short underwater stroke: pull back about 20 cm, then bring your hand forward again under water.",
    },
    stroke: "freestyle",
  },
  side_kick: {
    name: { nl: "benen op de zij", en: "side kick" },
    howTo: {
      nl: "Op je zij, onderste arm voor, bovenste arm langs je lichaam. Adem door je hoofd te draaien, niet op te tillen.",
      en: "On your side, bottom arm in front, top arm along your body. Breathe by turning your head, not lifting it.",
    },
    stroke: "freestyle",
  },
  kick: {
    name: { nl: "benen", en: "kick" },
    howTo: {
      nl: "Alleen benen, armen gestrekt voor je. Trap vanuit je heupen met losse enkels.",
      en: "Legs only, arms stretched in front. Kick from your hips with relaxed ankles.",
    },
    stroke: "freestyle",
  },
  pull: {
    name: { nl: "armen", en: "pull" },
    howTo: {
      nl: "Alleen armen, pullbuoy tussen je bovenbenen. Houd je heupen hoog en je lichaam stil.",
      en: "Arms only, pull buoy between your thighs. Keep your hips high and your body still.",
    },
    stroke: "freestyle",
  },
} satisfies Record<string, SwimDrill>;

export type DrillId = keyof typeof swimDrills;
// A tuple type, so zod can use it as an enum.
export const drillIds = Object.keys(swimDrills) as [DrillId, ...DrillId[]];

/** Everything you need to bring for these steps, in a fixed order (e.g. fins, snorkel). */
export function usedEquipment(steps: WorkoutStep[]): Equipment[] {
  const used = new Set<Equipment>();
  const collect = (list: WorkoutStep[]) => {
    for (const step of list) {
      if (step.type === "repeat") collect(step.steps);
      else step.equipment.forEach((item) => used.add(item));
    }
  };
  collect(steps);
  return equipmentTypes.filter((item) => used.has(item));
}
