import * as OpenCC from 'opencc-js';

// P5R-specific phrase & character overrides to prevent over-conversion or regional transliteration drift
const P5R_CUSTOM_S2T: Array<[string, string]> = [
  ['王后的项链', '王后的項鍊'],
  ['王后', '王后'],
  ['皇后', '皇后'],
  ['背负怪', '背負怪'],
  ['克洛索', '克洛索'],
  ['湿婆', '濕婆'],
  ['毗湿奴', '毗濕奴'],
  ['齐格飞', '齊格飛'],
  ['救世主之愈', '救世主之癒'],
  ['大治愈促进', '大治癒促進'],
  ['中治愈促进', '中治癒促進'],
  ['小治愈促进', '小治癒促進'],
  ['精神污染', '精神污染'],
  ['污秽空气', '污穢空氣'],
  ['污秽吐息', '污穢吐息']
];

const baseS2T = OpenCC.Converter({ from: 'cn', to: 'tw' });
const baseT2S = OpenCC.Converter({ from: 'tw', to: 'cn' });

const s2tCache = new Map<string, string>();
const t2sCache = new Map<string, string>();

export function toTraditional(str: string): string {
  if (!str) return '';
  const cached = s2tCache.get(str);
  if (cached !== undefined) return cached;

  // Apply P5R custom placeholders before OpenCC, or replace after
  let temp = str;
  const tokens: Array<{ token: string; target: string }> = [];
  P5R_CUSTOM_S2T.forEach(([simp, trad], idx) => {
    if (temp.includes(simp)) {
      const token = `__P5R_${idx}__`;
      temp = temp.split(simp).join(token);
      tokens.push({ token, target: trad });
    }
  });

  let converted = baseS2T(temp);
  for (const { token, target } of tokens) {
    converted = converted.split(token).join(target);
  }

  s2tCache.set(str, converted);
  return converted;
}

export function toSimplified(str: string): string {
  if (!str) return '';
  const cached = t2sCache.get(str);
  if (cached !== undefined) return cached;

  const converted = baseT2S(str);
  t2sCache.set(str, converted);
  return converted;
}

export function formatText(str: string, lang: 'tc' | 'sc'): string {
  if (!str) return '';
  return lang === 'tc' ? toTraditional(str) : str;
}

export function matchesSearch(target: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const qSimp = toSimplified(q);
  const qTrad = toTraditional(q);
  const tLower = target.toLowerCase();
  const tTrad = toTraditional(tLower);
  const tSimp = toSimplified(tLower);
  return (
    tLower.includes(q) ||
    tLower.includes(qSimp) ||
    tSimp.includes(qSimp) ||
    tTrad.includes(qTrad) ||
    tTrad.includes(q)
  );
}
