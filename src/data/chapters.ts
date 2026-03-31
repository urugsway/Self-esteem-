export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'author',
    title: 'Nathaniel Branden, Ph.D.',
    subtitle: 'Meet the Author',
    content: `Nathaniel Branden (1930–2014) was a world-renowned psychotherapist and philosopher. Often called the **"Father of the Self-Esteem Movement,"** he dedicated his life to exploring the psychological foundations of self-worth.

His seminal work, *The Six Pillars of Self-Esteem*, is widely regarded as the definitive guide on the subject. Branden's core insight is that self-esteem is not just a feeling, but a **practice**—a set of actions we take every day to honor our own existence.

> "Self-esteem is the reputation we acquire with ourselves."

By using this app, you are engaging in the very practices Dr. Branden developed to help thousands of people live more conscious, responsible, and fulfilling lives.`,
    icon: 'UserIcon',
    color: 'amber'
  },
  {
    id: 'intro',
    title: 'The Immune System of the Soul',
    subtitle: 'Understanding the Core',
    content: `Self-esteem, fully realized, is the experience that we are appropriate to life and to its requirements. It is not a gift we claim, but an achievement we build over time through consistent practice.

Branden identifies two core components that form the bedrock of our self-evaluation:

1. **Self-Efficacy:** Confidence in our ability to think, learn, and cope with the basic challenges of life.
2. **Self-Respect:** Confidence in our right to be happy, and the feeling of being worthy of our own efforts.`,
    icon: 'Sparkles',
    color: 'amber'
  },
  {
    id: 'manifestation',
    title: 'The Two Pillars of Worth',
    subtitle: 'How it shows up',
    content: `When self-esteem is healthy, it manifests as an authentic ease with oneself and others. It's the "immune system of consciousness," providing resistance, strength, and a capacity for regeneration.

**Key Manifestations:**
* **Authentic Ease** in social and personal contexts.
* **Openness** to new ideas and experiences.
* **Flexibility** in the face of change.
* **Spontaneity** and Assertiveness.
* **Resilience** after failure or setbacks.`,
    icon: 'Award',
    color: 'amber'
  },
  {
    id: 'pillar1',
    title: 'Living with Awareness',
    subtitle: 'The Pillar of Consciousness',
    content: `To live consciously means to be present to what we are doing while we are doing it. It is the practice of being aware of our internal and external reality.

**Key Practices:**
* **Respecting facts** rather than denying or avoiding them.
* **Being present** in the moment and fully engaged.
* **Seeking to understand** the world around us.
* **Monitoring progress** toward our goals and values.`,
    icon: 'Sun',
    color: 'amber'
  },
  {
    id: 'pillar2',
    title: 'The Power of Acceptance',
    subtitle: 'The Pillar of Self-Acceptance',
    content: `Self-acceptance is the refusal to be in an adversarial relationship with ourselves. It means accepting our thoughts, feelings, and actions without necessarily liking or condoning them.

**Key Practices:**
* **Experiencing feelings** without judgment or repression.
* **Being on our own side**, even when we make mistakes.
* **Accepting mistakes** as part of our growth journey.
* **Refusing to reject** any part of our identity.`,
    icon: 'Heart',
    color: 'amber'
  },
  {
    id: 'pillar3',
    title: 'Taking the Reins',
    subtitle: 'The Pillar of Self-Responsibility',
    content: `To be self-responsible is to recognize that we are the authors of our choices and actions. We are responsible for our life and well-being.

**Key Practices:**
* **Taking responsibility** for our own happiness.
* **Not waiting** for someone else to fix our lives.
* **Owning the quality** of our work and relationships.
* **Accepting consequences** of our choices.`,
    icon: 'Shield',
    color: 'amber'
  },
  {
    id: 'pillar4',
    title: 'Standing for Yourself',
    subtitle: 'The Pillar of Self-Assertiveness',
    content: `Self-assertiveness means honoring our wants, needs, and values and seeking appropriate forms of their expression in reality.

**Key Practices:**
* **Being who we are** and allowing others to see it.
* **Speaking our truth** even when it's uncomfortable.
* **Standing up** for our convictions and values.
* **Refusing to fake** beliefs to be liked or accepted.`,
    icon: 'Zap',
    color: 'amber'
  },
  {
    id: 'pillar5',
    title: 'The Intentional Life',
    subtitle: 'The Pillar of Living Purposefully',
    content: `To live purposefully is to use our powers for the attainment of goals we have selected. It is the practice of living with a sense of direction.

**Key Practices:**
* **Formulating goals** consciously and clearly.
* **Identifying actions** necessary to achieve them.
* **Monitoring progress** consistently.
* **Paying attention** to the outcome of our actions.`,
    icon: 'Target',
    color: 'amber'
  },
  {
    id: 'pillar6',
    title: 'Walking the Talk',
    subtitle: 'The Pillar of Personal Integrity',
    content: `Integrity is the integration of ideals, convictions, standards, beliefs—and behavior. When our behavior is congruent with our professed values, we have integrity.

**Key Practices:**
* **Keeping promises** to ourselves and others.
* **Honoring commitments** consistently.
* **Being honest** with ourselves and others.
* **Living our values** in our daily actions.`,
    icon: 'CheckCircle2',
    color: 'amber'
  }
];
