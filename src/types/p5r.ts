export type SkillElement =
  | '物理'
  | '枪击'
  | '火焰'
  | '冰冻'
  | '电击'
  | '疾风'
  | '念动'
  | '核热'
  | '祝福'
  | '咒怨'
  | '异常'
  | '恢复'
  | '万能'
  | '辅助'
  | '被动';

export interface PersonaSkillLearn {
  name: string;
  level: number; // 0 = innate (自带)
  rawLevel: string;
}

export interface Persona {
  name: string;
  arcana: string;
  level: number;
  enName: string;
  jpName: string;
  inheritType: string;
  trait: string;
  traitDesc: string;
  avatar: string;
  isDlc: boolean;
  isTreasure: boolean;
  isSpecial: boolean;
  specialRecipe: string[] | null;
  stats: {
    st: number;
    ma: number;
    en: number;
    ag: number;
    lu: number;
  };
  itemization: {
    type: string;
    normal: string;
    alarm: string;
  };
  affinities: {
    phys: string;
    gun: string;
    fire: string;
    ice: string;
    elec: string;
    wind: string;
    psy: string;
    nuke: string;
    bless: string;
    curse: string;
  };
  inheritance: Record<SkillElement, boolean>;
  skills: PersonaSkillLearn[];
}

export interface SkillLearnerInfo {
  persona: string;
  arcana: string;
  level: number;
  isInnate: boolean;
  isDlc: boolean;
}

export interface ChairCardInfo {
  persona: string;
  alarm: boolean;
}

export interface Skill {
  id: number;
  name: string;
  enName: string;
  element: SkillElement;
  cost: string;
  desc: string;
  skillCardRaw: string;
  chairCards: ChairCardInfo[];
  learners: SkillLearnerInfo[];
  isNetwork: boolean;
  isMutation: boolean;
  exclusiveTo: string[] | null;
  inheritable: boolean;
}

export interface TraitHolder {
  name: string;
  arcana: string;
  level: number;
  isDlc: boolean;
  isTreasure: boolean;
}

export interface Trait {
  name: string;
  effect: string;
  isSpecial: boolean;
  isDlc: boolean;
  uninheritable: boolean;
  holders: TraitHolder[];
}

export interface P5RDataset {
  arcanaOrder: string[];
  arcanaChart: Record<string, Record<string, string>>;
  treasureChart: Record<string, Record<string, number>>;
  specialFusions: Record<string, string[]>;
  personas: Persona[];
  skills: Skill[];
  traits: Trait[];
}

export interface FusionPairRecipe {
  p1: Persona;
  p2: Persona;
  result: Persona;
  type: 'normal' | 'same_arcana' | 'treasure' | 'special_2';
  approxCost: number;
}

export interface FusionChainStep {
  stepIndex: number;
  ingredients: string[];
  result: string;
  type: 'normal' | 'same_arcana' | 'treasure' | 'special';
  carriedTrait?: string;
  carriedSkills: string[];
}

export interface SkillAcquisitionPlan {
  skillName: string;
  mode: 'innate' | 'fusion' | 'card_or_gallows' | 'network';
  preferredDonor?: string;
  chain?: FusionChainStep[];
}

export interface SavedBuild {
  id: string;
  title: string;
  targetPersona: string;
  selectedTrait: string;
  selectedSkills: string[];
  cardOrGallowsSkills: string[];
  preferredDonors: Record<string, string>;
  preferredTraitDonor?: string;
  updatedAt: number;
}
