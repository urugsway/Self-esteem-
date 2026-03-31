export interface Pillar {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
}

export const PILLARS_DATA: Pillar[] = [
  {
    id: "living-consciously",
    title: "The Practice of Living Consciously",
    description: "Living consciously means being aware of everything that bears on our actions, purposes, values, and goals—to the best of our ability—and behaving in accordance with that which we see and know.",
    keyPoints: [
      "A mind that is active rather than passive.",
      "An intelligence that takes joy in its own function.",
      "Being 'in the moment,' without losing the wider context.",
      "Reaching out toward relevant facts rather than withdrawing from them.",
      "Being concerned to distinguish among facts, interpretations, and emotions.",
      "Noticing and confronting impulses to avoid or deny painful or threatening realities."
    ]
  },
  {
    id: "self-acceptance",
    title: "The Practice of Self-Acceptance",
    description: "Self-acceptance is the refusal to be in an adversarial relationship to oneself. It is the precondition of change and growth.",
    keyPoints: [
      "Being on my own side—to be for myself.",
      "Willingness to experience that we think what we think, feel what we feel, desire what we desire.",
      "The refusal to regard any part of ourselves as alien or 'not me'.",
      "Compassion for oneself, even when we make mistakes.",
      "Acceptance of reality without necessarily liking it."
    ]
  },
  {
    id: "self-responsibility",
    title: "The Practice of Self-Responsibility",
    description: "To feel competent to live and worthy of happiness, I need to experience a sense of control over my existence. This requires being willing to take responsibility for my actions and the attainment of my goals.",
    keyPoints: [
      "I am responsible for the achievement of my desires.",
      "I am responsible for my choices and actions.",
      "I am responsible for the level of consciousness I bring to my work and relationships.",
      "I am responsible for my personal happiness.",
      "I am responsible for choosing the values by which I live."
    ]
  },
  {
    id: "self-assertiveness",
    title: "The Practice of Self-Assertiveness",
    description: "Self-assertiveness means honoring my wants, needs, and values and seeking appropriate forms of their expression in reality.",
    keyPoints: [
      "The willingness to stand up for myself, to be who I am openly.",
      "Treating myself with respect in all human encounters.",
      "The refusal to fake my person to be liked.",
      "Living authentically—speaking and acting from my innermost convictions.",
      "The courage to be 'visible' in the world."
    ]
  },
  {
    id: "living-purposefully",
    title: "The Practice of Living Purposefully",
    description: "To live purposefully is to use our powers for the attainment of goals we have selected. It means living and acting by intention.",
    keyPoints: [
      "Taking responsibility for formulating one's goals and purposes consciously.",
      "Identifying the actions necessary to achieve one's goals.",
      "Monitoring behavior to check that it is in alignment with one's goals.",
      "Paying attention to the outcomes of one's actions.",
      "Cultivating self-discipline to organize behavior over time."
    ]
  },
  {
    id: "personal-integrity",
    title: "The Practice of Personal Integrity",
    description: "Integrity is the integration of ideals, convictions, standards, beliefs—and behavior. When our behavior is congruent with our professed values, we have integrity.",
    keyPoints: [
      "Congruence: words and behavior match.",
      "Keeping promises and honoring commitments.",
      "Dealing with others fairly, justly, and benevolently.",
      "Striving for moral consistency.",
      "The willingness to question our standards if they lead to self-destruction."
    ]
  }
];
