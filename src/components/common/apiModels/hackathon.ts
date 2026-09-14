export type HackathonRole = 'PARTICIPANT' | 'MENTOR';

export type HackathonSkill =
  | 'SOFTWARE_DEVELOPMENT'
  | 'DESIGN'
  | 'DATA_AND_AI'
  | 'LAW_AND_REGULATION'
  | 'BUSINESS_AND_PRODUCT'
  | 'MARKETING_AND_COMMUNICATION'
  | 'FINANCE_AND_INSURANCE';

export type HackathonChallenge =
  | 'FAIR_LENDING'
  | 'INSURANCE'
  | 'COLLECTIVE_BUYING_POWER'
  | 'WEALTH_AND_INHERITANCE';

export type HackathonParticipation = 'WITH_TEAM' | 'WITH_IDEA' | 'LOOKING_FOR_TEAM';

export type HackathonTshirtColor = 'WHITE' | 'GRAY' | 'NAVY' | 'NONE';

export type HackathonTshirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface HackathonRegistration {
  registered: boolean;
  open: boolean;
  deadline: string;
  email: string | null;
  phoneNumber: string | null;
  role: HackathonRole | null;
  skills: HackathonSkill[];
  otherSkills: string | null;
  challenges: HackathonChallenge[];
  participation: HackathonParticipation | null;
  idea: string | null;
  linkedinUrl: string | null;
  tshirtColor: HackathonTshirtColor | null;
  tshirtSize: HackathonTshirtSize | null;
  termsAccepted: boolean;
}

export interface HackathonRegistrationCommand {
  email: string;
  phoneNumber: string | null;
  role: HackathonRole;
  skills: HackathonSkill[];
  otherSkills: string | null;
  challenges: HackathonChallenge[];
  participation: HackathonParticipation;
  idea: string | null;
  linkedinUrl: string | null;
  tshirtColor: HackathonTshirtColor;
  tshirtSize: HackathonTshirtSize | null;
  termsAccepted: boolean;
}

export interface HackathonIdea {
  id: number;
  challenge: HackathonChallenge;
  problem: string;
  solution: string;
  progress: string | null;
  neededSkills: HackathonSkill[];
  additionalInfo: string | null;
  createdTime: string;
}

export interface HackathonIdeas {
  open: boolean;
  deadline: string;
  registered: boolean;
  ideas: HackathonIdea[];
}

export interface HackathonIdeaCommand {
  challenge: HackathonChallenge;
  problem: string;
  solution: string;
  progress: string | null;
  neededSkills: HackathonSkill[];
  additionalInfo: string | null;
}
