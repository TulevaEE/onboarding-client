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

export interface HackathonRegistration {
  registered: boolean;
  open: boolean;
  deadline: string;
  email: string | null;
  phoneNumber: string | null;
  role: HackathonRole | null;
  skills: HackathonSkill[];
  challenges: HackathonChallenge[];
  participation: HackathonParticipation | null;
  idea: string | null;
  linkedinUrl: string | null;
}

export interface HackathonRegistrationCommand {
  email: string;
  phoneNumber: string | null;
  role: HackathonRole;
  skills: HackathonSkill[];
  challenges: HackathonChallenge[];
  participation: HackathonParticipation;
  idea: string | null;
  linkedinUrl: string | null;
}
