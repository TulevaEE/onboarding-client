export const HELP_TOPICS = [
  'sex',
  'pensionAge',
  'p1',
  'gross',
  'p2Rate',
  'p3Monthly',
  'p3Joined',
  'fundCur',
  'pillars',
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number];
