import rawData from '../data/p5rData.json';
import {
  P5RDataset,
  Persona,
  Skill,
  Trait,
  FusionPairRecipe,
  FusionChainStep,
  SkillAcquisitionPlan
} from '../types/p5r';

export const p5rData = rawData as unknown as P5RDataset;

export const personaMap = new Map<string, Persona>(
  p5rData.personas.map((p) => [p.name, p])
);

export const skillMap = new Map<string, Skill>(
  p5rData.skills.map((s) => [s.name, s])
);

export const traitMap = new Map<string, Trait>(
  p5rData.traits.map((t) => [t.name, t])
);

export function calcPersonaCost(level: number): number {
  return 27 * level * level + 126 * level + 2147;
}

export function isPersonaAvailable(p: Persona, enabledDlc: Set<string>): boolean {
  return !p.isDlc || enabledDlc.has(p.name);
}

export function canPersonaInheritSkill(persona: Persona, skill: Skill): boolean {
  // If the persona naturally learns this skill, it can always hold it
  if (persona.skills.some((s) => s.name === skill.name)) {
    return true;
  }
  if (skill.exclusiveTo && skill.exclusiveTo.length > 0) {
    return skill.exclusiveTo.includes(persona.name);
  }
  return Boolean(persona.inheritance[skill.element]);
}

export function canPersonaHoldTrait(persona: Persona, trait: Trait): boolean {
  if (persona.trait === trait.name) return true;
  if (trait.uninheritable) {
    return trait.holders.some((h) => h.name === persona.name);
  }
  return true;
}

function getNormalPool(arcana: string, enabledDlc: Set<string>): Persona[] {
  return p5rData.personas
    .filter(
      (p) =>
        p.arcana === arcana &&
        !p.isSpecial &&
        !p.isTreasure &&
        isPersonaAvailable(p, enabledDlc)
    )
    .sort((a, b) => a.level - b.level);
}

export function fuseTwoPersonas(
  p1: Persona,
  p2: Persona,
  enabledDlc: Set<string>
): { result: Persona; type: 'normal' | 'same_arcana' | 'treasure' | 'special_2' } | null {
  if (p1.name === p2.name) return null;
  if (!isPersonaAvailable(p1, enabledDlc) || !isPersonaAvailable(p2, enabledDlc)) {
    return null;
  }
  if (p1.isTreasure && p2.isTreasure) return null;

  // 1. Check 2-body special fusions
  for (const [targetName, ing] of Object.entries(p5rData.specialFusions)) {
    if (ing.length === 2) {
      if (
        (ing[0] === p1.name && ing[1] === p2.name) ||
        (ing[0] === p2.name && ing[1] === p1.name)
      ) {
        const res = personaMap.get(targetName);
        if (res && isPersonaAvailable(res, enabledDlc)) {
          return { result: res, type: 'special_2' };
        }
        return null;
      }
    }
  }

  // 2. Treasure Demon fusion
  if (p1.isTreasure || p2.isTreasure) {
    const td = p1.isTreasure ? p1 : p2;
    const normal = p1.isTreasure ? p2 : p1;
    const mod = p5rData.treasureChart[td.name]?.[normal.arcana];
    if (!mod) return null;
    const pool = getNormalPool(normal.arcana, enabledDlc);
    const idx = pool.findIndex((p) => p.name === normal.name);
    if (idx !== -1) {
      const targetIdx = idx + mod;
      if (targetIdx < 0 || targetIdx >= pool.length) return null;
      return { result: pool[targetIdx], type: 'treasure' };
    } else {
      // Special persona fused with Treasure Demon
      if (mod > 0) {
        const higher = pool.filter((p) => p.level > normal.level);
        const res = higher[mod - 1];
        return res ? { result: res, type: 'treasure' } : null;
      } else {
        const lower = pool.filter((p) => p.level < normal.level);
        const res = lower[lower.length + mod];
        return res ? { result: res, type: 'treasure' } : null;
      }
    }
  }

  const targetLv = Math.floor((p1.level + p2.level) / 2) + 1;

  // 3. Same-Arcana Down-Rank Fusion
  if (p1.arcana === p2.arcana) {
    const pool = getNormalPool(p1.arcana, enabledDlc);
    for (let i = pool.length - 1; i >= 0; i--) {
      const cand = pool[i];
      if (cand.level <= targetLv && cand.name !== p1.name && cand.name !== p2.name) {
        return { result: cand, type: 'same_arcana' };
      }
    }
    return null;
  }

  // 4. Different-Arcana Up-Rank Fusion
  const resArcana = p5rData.arcanaChart[p1.arcana]?.[p2.arcana];
  if (!resArcana) return null;
  const pool = getNormalPool(resArcana, enabledDlc);
  if (pool.length === 0) return null;
  for (const cand of pool) {
    if (cand.level >= targetLv) {
      return { result: cand, type: 'normal' };
    }
  }
  return { result: pool[pool.length - 1], type: 'normal' };
}

export function getReverseFusions(
  targetName: string,
  enabledDlc: Set<string>
): {
  specialRecipe: Persona[] | null;
  pairs: FusionPairRecipe[];
} {
  const target = personaMap.get(targetName);
  if (!target || !isPersonaAvailable(target, enabledDlc) || target.isTreasure) {
    return { specialRecipe: null, pairs: [] };
  }

  if (target.isSpecial && target.specialRecipe) {
    const ingPersonas = target.specialRecipe
      .map((n) => personaMap.get(n))
      .filter((p): p is Persona => Boolean(p));
    const pairs: FusionPairRecipe[] = [];
    if (ingPersonas.length === 2) {
      pairs.push({
        p1: ingPersonas[0],
        p2: ingPersonas[1],
        result: target,
        type: 'special_2',
        approxCost: calcPersonaCost(ingPersonas[0].level) + calcPersonaCost(ingPersonas[1].level)
      });
    }
    return { specialRecipe: ingPersonas, pairs };
  }

  const avail = p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc));
  const pairs: FusionPairRecipe[] = [];

  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      const p1 = avail[i];
      const p2 = avail[j];
      const fused = fuseTwoPersonas(p1, p2, enabledDlc);
      if (fused && fused.result.name === targetName) {
        pairs.push({
          p1,
          p2,
          result: target,
          type: fused.type,
          approxCost: calcPersonaCost(p1.level) + calcPersonaCost(p2.level)
        });
      }
    }
  }

  pairs.sort((a, b) => a.approxCost - b.approxCost);
  return { specialRecipe: null, pairs };
}

export function getForwardFusions(
  sourceName: string,
  enabledDlc: Set<string>
): {
  pairs: FusionPairRecipe[];
  specialTargets: Persona[];
} {
  const source = personaMap.get(sourceName);
  if (!source || !isPersonaAvailable(source, enabledDlc)) {
    return { pairs: [], specialTargets: [] };
  }

  const avail = p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc));
  const pairs: FusionPairRecipe[] = [];

  for (const partner of avail) {
    if (partner.name === source.name) continue;
    const fused = fuseTwoPersonas(source, partner, enabledDlc);
    if (fused) {
      pairs.push({
        p1: source,
        p2: partner,
        result: fused.result,
        type: fused.type,
        approxCost: calcPersonaCost(source.level) + calcPersonaCost(partner.level)
      });
    }
  }

  pairs.sort((a, b) => a.result.level - b.result.level || a.approxCost - b.approxCost);

  const specialTargets: Persona[] = [];
  for (const [tName, ing] of Object.entries(p5rData.specialFusions)) {
    if (ing.length > 2 && ing.includes(sourceName)) {
      const t = personaMap.get(tName);
      if (t && isPersonaAvailable(t, enabledDlc)) {
        specialTargets.push(t);
      }
    }
  }

  return { pairs, specialTargets };
}

// Cache the directed fusion adjacency list for a given DLC configuration
let cachedDlcKey = '';
let cachedAdjMap = new Map<
  string,
  Array<{
    next: string;
    partners: string[];
    type: 'normal' | 'same_arcana' | 'treasure' | 'special';
    cost: number;
  }>
>();

function getFusionGraph(enabledDlc: Set<string>) {
  const key = [...enabledDlc].sort().join(',');
  if (key === cachedDlcKey && cachedAdjMap.size > 0) {
    return cachedAdjMap;
  }

  const adj = new Map<
    string,
    Array<{
      next: string;
      partners: string[];
      type: 'normal' | 'same_arcana' | 'treasure' | 'special';
      cost: number;
    }>
  >();

  const avail = p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc));
  for (const p of avail) {
    adj.set(p.name, []);
  }

  // Add all 2-body edges (keep cheapest partner for each (u -> result) transition, plus bonus partners that carry useful skills)
  const bestEdge = new Map<
    string,
    {
      next: string;
      partners: string[];
      type: 'normal' | 'same_arcana' | 'treasure' | 'special';
      cost: number;
    }
  >();

  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      const p1 = avail[i];
      const p2 = avail[j];
      const fused = fuseTwoPersonas(p1, p2, enabledDlc);
      if (!fused) continue;
      const resName = fused.result.name;
      const type = fused.type === 'special_2' ? 'special' : fused.type;

      const k1 = `${p1.name}->${resName}`;
      const c2 = calcPersonaCost(p2.level);
      const prev1 = bestEdge.get(k1);
      if (!prev1 || c2 < prev1.cost) {
        bestEdge.set(k1, { next: resName, partners: [p2.name], type, cost: c2 });
      }

      const k2 = `${p2.name}->${resName}`;
      const c1 = calcPersonaCost(p1.level);
      const prev2 = bestEdge.get(k2);
      if (!prev2 || c1 < prev2.cost) {
        bestEdge.set(k2, { next: resName, partners: [p1.name], type, cost: c1 });
      }
    }
  }

  for (const [k, edge] of bestEdge.entries()) {
    const u = k.split('->')[0];
    adj.get(u)?.push(edge);
  }

  // Add multi-body special fusion edges
  for (const [targetName, ing] of Object.entries(p5rData.specialFusions)) {
    if (ing.length <= 2) continue;
    const t = personaMap.get(targetName);
    if (!t || !isPersonaAvailable(t, enabledDlc)) continue;
    if (!ing.every((name) => {
      const ip = personaMap.get(name);
      return ip && isPersonaAvailable(ip, enabledDlc);
    })) {
      continue;
    }
    const totalCost = ing.reduce(
      (acc, n) => acc + calcPersonaCost(personaMap.get(n)?.level || 1),
      0
    );
    for (const u of ing) {
      const others = ing.filter((x) => x !== u);
      adj.get(u)?.push({
        next: targetName,
        partners: others,
        type: 'special',
        cost: totalCost
      });
    }
  }

  cachedDlcKey = key;
  cachedAdjMap = adj;
  return adj;
}

/**
 * Finds the shortest valid fusion chain from any of `sourceNames` to `targetName`
 * where every intermediate persona can inherit all `requiredSkills`.
 * Also prefers paths where intermediate partners naturally contribute other desired skills!
 */
export function findShortestFusionChain(
  sourceNames: string[],
  targetName: string,
  enabledDlc: Set<string>,
  requiredSkills: Skill[] = [],
  carriedTrait?: string,
  allDesiredSkills: string[] = []
): FusionChainStep[] | null {
  const validSources = sourceNames.filter((s) => {
    const p = personaMap.get(s);
    return p && isPersonaAvailable(p, enabledDlc);
  });
  if (validSources.length === 0) return null;
  if (validSources.includes(targetName)) return [];

  const adj = getFusionGraph(enabledDlc);
  const visited = new Set<string>();
  const parent = new Map<
    string,
    {
      from: string;
      partners: string[];
      type: 'normal' | 'same_arcana' | 'treasure' | 'special';
    }
  >();

  let queue: string[] = [];
  for (const s of validSources) {
    visited.add(s);
    queue.push(s);
  }

  let found = false;
  let depth = 0;

  while (queue.length > 0 && depth < 6 && !found) {
    const nextQueue: string[] = [];
    for (const u of queue) {
      const edges = adj.get(u) || [];
      for (const edge of edges) {
        const v = edge.next;
        if (visited.has(v)) continue;
        const vPersona = personaMap.get(v);
        if (!vPersona) continue;

        // Check if vPersona can inherit all requiredSkills
        const canPassAll = requiredSkills.every((sk) =>
          canPersonaInheritSkill(vPersona, sk)
        );
        if (!canPassAll) continue;

        visited.add(v);
        parent.set(v, {
          from: u,
          partners: edge.partners,
          type: edge.type
        });

        if (v === targetName) {
          found = true;
          break;
        }
        nextQueue.push(v);
      }
      if (found) break;
    }
    queue = nextQueue;
    depth++;
  }

  if (!found) return null;

  // Reconstruct chain and see if we can upgrade any 2-body partner to one that ALSO carries a desired skill!
  const rawSteps: Array<{
    from: string;
    partners: string[];
    result: string;
    type: 'normal' | 'same_arcana' | 'treasure' | 'special';
  }> = [];

  let curr = targetName;
  while (parent.has(curr)) {
    const info = parent.get(curr)!;
    rawSteps.unshift({
      from: info.from,
      partners: info.partners,
      result: curr,
      type: info.type
    });
    curr = info.from;
  }

  const runningSkills = new Set<string>(requiredSkills.map((s) => s.name));
  // Check if starting persona also naturally has any other desired skills
  const startPersona = personaMap.get(rawSteps[0].from);
  if (startPersona) {
    for (const s of startPersona.skills) {
      if (allDesiredSkills.includes(s.name)) {
        runningSkills.add(s.name);
      }
    }
  }

  const avail = p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc));

  return rawSteps.map((step, idx) => {
    let chosenPartners = step.partners;
    const uPersona = personaMap.get(step.from)!;
    const resPersona = personaMap.get(step.result)!;

    // If it's a 2-body fusion, see if there's an alternative partner for (uPersona + partner = resPersona)
    // that naturally has one of `allDesiredSkills` not yet in `runningSkills`!
    if (step.partners.length === 1 && allDesiredSkills.length > 0) {
      let bestAlt = step.partners[0];
      let bestBonus = 0;
      for (const cand of avail) {
        if (cand.name === uPersona.name) continue;
        const fused = fuseTwoPersonas(uPersona, cand, enabledDlc);
        if (!fused || fused.result.name !== resPersona.name) continue;
        let bonus = 0;
        for (const s of cand.skills) {
          if (
            allDesiredSkills.includes(s.name) &&
            !runningSkills.has(s.name) &&
            skillMap.has(s.name) &&
            canPersonaInheritSkill(resPersona, skillMap.get(s.name)!)
          ) {
            bonus++;
          }
        }
        if (bonus > bestBonus) {
          bestBonus = bonus;
          bestAlt = cand.name;
        }
      }
      chosenPartners = [bestAlt];
    }

    // Collect any desired skills from partners and result persona
    for (const pName of chosenPartners) {
      const pObj = personaMap.get(pName);
      if (!pObj) continue;
      for (const s of pObj.skills) {
        const sk = skillMap.get(s.name);
        if (
          allDesiredSkills.includes(s.name) &&
          sk &&
          canPersonaInheritSkill(resPersona, sk)
        ) {
          runningSkills.add(s.name);
        }
      }
    }
    for (const s of resPersona.skills) {
      if (allDesiredSkills.includes(s.name)) {
        runningSkills.add(s.name);
      }
    }

    // Filter runningSkills to those that `resPersona` can actually inherit/hold
    for (const sName of [...runningSkills]) {
      const sk = skillMap.get(sName);
      if (sk && !canPersonaInheritSkill(resPersona, sk)) {
        runningSkills.delete(sName);
      }
    }

    return {
      stepIndex: idx + 1,
      ingredients: [step.from, ...chosenPartners],
      result: step.result,
      type: step.type,
      carriedTrait,
      carriedSkills: [...runningSkills]
    };
  });
}

/**
 * Generates a complete acquisition plan for the Target Persona's Trait + up to 8 Skills.
 */
export function generateBuildPlan(
  targetPersonaName: string,
  selectedTraitName: string,
  selectedSkillNames: string[],
  cardOrGallowsSet: Set<string>,
  preferredDonors: Record<string, string>,
  preferredTraitDonor: string | undefined,
  enabledDlc: Set<string>
): {
  traitChain: FusionChainStep[] | null;
  traitSourcePersona: string | null;
  skillPlans: SkillAcquisitionPlan[];
} {
  const target = personaMap.get(targetPersonaName);
  if (!target) {
    return { traitChain: null, traitSourcePersona: null, skillPlans: [] };
  }

  let traitChain: FusionChainStep[] | null = null;
  let traitSourcePersona: string | null = null;

  // 1. Plan Trait Chain
  if (selectedTraitName && target.trait === selectedTraitName) {
    traitSourcePersona = target.name;
    traitChain = [];
  } else if (selectedTraitName) {
    const traitObj = traitMap.get(selectedTraitName);
    if (traitObj && canPersonaHoldTrait(target, traitObj)) {
      const holders =
        preferredTraitDonor &&
        traitObj.holders.some((h) => h.name === preferredTraitDonor)
          ? [preferredTraitDonor]
          : traitObj.holders.map((h) => h.name);

      traitChain = findShortestFusionChain(
        holders,
        target.name,
        enabledDlc,
        [],
        selectedTraitName,
        selectedSkillNames
      );
      if (traitChain && traitChain.length > 0) {
        traitSourcePersona = traitChain[0].ingredients[0];
      }
    }
  }

  // See which skills are already covered by the Trait fusion chain!
  const coveredByTraitChain = new Set<string>(
    traitChain && traitChain.length > 0
      ? traitChain[traitChain.length - 1].carriedSkills
      : []
  );

  // 2. Plan each of the 8 skills
  const skillPlans: SkillAcquisitionPlan[] = [];

  for (const sName of selectedSkillNames) {
    const sk = skillMap.get(sName);
    if (!sk) continue;

    // Check if Target Persona naturally learns it
    if (target.skills.some((ls) => ls.name === sName)) {
      skillPlans.push({
        skillName: sName,
        mode: 'innate',
        preferredDonor: target.name
      });
      continue;
    }

    // Check if marked as Skill Card / Gallows by user
    if (cardOrGallowsSet.has(sName)) {
      skillPlans.push({
        skillName: sName,
        mode: 'card_or_gallows',
        preferredDonor: preferredDonors[sName] || sk.learners[0]?.persona
      });
      continue;
    }

    // Check if network/mutation only skill with no normal learner
    if (sk.learners.length === 0) {
      skillPlans.push({
        skillName: sName,
        mode: 'network'
      });
      continue;
    }

    // If covered by the trait chain and user didn't force a different donor, reuse trait chain!
    const userDonor = preferredDonors[sName];
    if (!userDonor && coveredByTraitChain.has(sName) && traitChain) {
      skillPlans.push({
        skillName: sName,
        mode: 'fusion',
        preferredDonor: traitSourcePersona || undefined,
        chain: traitChain
      });
      continue;
    }

    const candidateDonors = userDonor
      ? [userDonor]
      : sk.learners.map((l) => l.persona);

    const chain = findShortestFusionChain(
      candidateDonors,
      target.name,
      enabledDlc,
      [sk],
      undefined,
      selectedSkillNames
    );

    if (chain) {
      skillPlans.push({
        skillName: sName,
        mode: 'fusion',
        preferredDonor: chain[0]?.ingredients[0] || candidateDonors[0],
        chain
      });
    } else {
      // Fallback to Gallows / Skill Card if no inheritance-valid fusion chain exists
      skillPlans.push({
        skillName: sName,
        mode: 'card_or_gallows',
        preferredDonor: candidateDonors[0]
      });
    }
  }

  return {
    traitChain,
    traitSourcePersona,
    skillPlans
  };
}
