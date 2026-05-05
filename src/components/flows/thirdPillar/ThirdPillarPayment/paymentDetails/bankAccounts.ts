export type ThirdPillarBank = 'swedbank' | 'seb' | 'lhv' | 'luminor';

export const THIRD_PILLAR_BANK_IBANS: Record<ThirdPillarBank, string> = {
  swedbank: 'EE362200221067235244',
  seb: 'EE141010220263146225',
  lhv: 'EE547700771002908125',
  luminor: 'EE961700017004379157',
};
