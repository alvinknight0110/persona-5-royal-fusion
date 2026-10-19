import fs from 'fs';

async function fetchCategory(cat) {
  let gcmcontinue = '';
  const pages = [];
  while (true) {
    const url =
      'https://wiki.biligame.com/persona/api.php?action=query&generator=categorymembers&gcmtitle=' +
      encodeURIComponent(cat) +
      '&gcmlimit=50&prop=revisions&rvprop=content&format=json' +
      (gcmcontinue ? '&gcmcontinue=' + encodeURIComponent(gcmcontinue) : '');
    const res = await fetch(url);
    const data = await res.json();
    if (data.query && data.query.pages) {
      pages.push(...Object.values(data.query.pages));
    }
    if (data.continue && data.continue.gcmcontinue) {
      gcmcontinue = data.continue.gcmcontinue;
    } else {
      break;
    }
  }
  return pages;
}

function parseTemplateParams(wikitext, templateNameRegex) {
  const match = wikitext.match(templateNameRegex);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let depth = 2;
  let i = startIdx;
  while (i < wikitext.length && depth > 0) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      depth += 2;
      i += 2;
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth -= 2;
      i += 2;
    } else {
      i++;
    }
  }
  const body = wikitext.slice(startIdx, i - 2).replace(/<!--[\s\S]*?-->/g, '');
  const params = {};
  const parts = body.split(/\n\s*\|/);
  for (const part of parts) {
    const clean = part.replace(/^\s*\|/, '').trim();
    if (!clean) continue;
    const eqIdx = clean.indexOf('=');
    if (eqIdx === -1) continue;
    const key = clean.slice(0, eqIdx).trim();
    const val = clean.slice(eqIdx + 1).trim();
    params[key] = val;
  }
  return params;
}

async function run() {
  console.log('Fetching Persona category pages...');
  const personaPages = await fetchCategory('Category:P5R人格面具');
  console.log('Fetched', personaPages.length, 'persona pages');

  const htmlRes = await fetch(
    'https://wiki.biligame.com/persona/api.php?action=parse&page=P5R/%E4%BA%BA%E6%A0%BC%E9%9D%A2%E5%85%B7%E5%9B%BE%E9%89%B4&prop=text&format=json'
  );
  const htmlData = await htmlRes.json();
  const compendiumHtml = htmlData.parse.text['*'];
  const avatarMap = {};
  const rowRegex = /<tr class="divsort"[\s\S]*?<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(compendiumHtml)) !== null) {
    const row = rowMatch[0];
    const imgMatch = row.match(/<img[^>]+src="([^"]+)"/);
    const titleMatch = row.match(/<a[^>]+title="P5R\/([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (imgMatch && titleMatch) {
      avatarMap[titleMatch[1].trim()] = imgMatch[1];
      avatarMap[titleMatch[2].trim()] = imgMatch[1];
    }
  }
  console.log('Extracted avatars for', Object.keys(avatarMap).length, 'keys');

  const personas = [];
  for (const page of personaPages) {
    const content = page.revisions?.[0]?.['*'] || '';
    const p = parseTemplateParams(content, /\{\{人格面具图鉴\/P5R/);
    if (!p || !p['人格面具名称']) continue;

    const skills = [];
    for (let idx = 1; idx <= 23; idx++) {
      const sName = p[`技能${idx}名称`];
      const sLvl = p[`技能${idx}解锁等级`];
      if (sName) {
        skills.push({
          name: sName.trim(),
          level: sLvl === '自带' || !sLvl ? 0 : parseInt(sLvl, 10) || 0,
          rawLevel: sLvl || '自带'
        });
      }
    }

    const name = p['人格面具名称'].trim();
    const arcana = (p['塔罗牌'] || '').trim();
    const level = parseInt(p['等级'], 10) || 1;

    personas.push({
      name,
      arcana,
      level,
      enName: p['英文名'] || '',
      jpName: p['日文名'] || '',
      inheritType: p['继承'] || '',
      trait: p['特性'] || '',
      traitDesc: p['特性简介'] || '',
      avatar: avatarMap[name] || '',
      stats: {
        st: parseInt(p['力'], 10) || 0,
        ma: parseInt(p['魔'], 10) || 0,
        en: parseInt(p['耐'], 10) || 0,
        ag: parseInt(p['速'], 10) || 0,
        lu: parseInt(p['运'], 10) || 0
      },
      itemization: {
        type: p['装备类型'] || '',
        normal: p['电刑名'] || '',
        alarm: p['警报电刑名'] || ''
      },
      affinities: {
        phys: p['物'] || '-',
        gun: p['枪'] || '-',
        fire: p['火'] || '-',
        ice: p['冰'] || '-',
        elec: p['电'] || '-',
        wind: p['风'] || '-',
        psy: p['念'] || '-',
        nuke: p['核'] || '-',
        bless: p['祝'] || '-',
        curse: p['咒'] || '-'
      },
      inheritance: {
        物理: p['物继'] === '√',
        枪击: p['枪继'] === '√',
        火焰: p['火继'] === '√',
        冰冻: p['冰继'] === '√',
        电击: p['电继'] === '√',
        疾风: p['风继'] === '√',
        念动: p['念继'] === '√',
        核热: p['核继'] === '√',
        祝福: p['祝继'] === '√',
        咒怨: p['咒继'] === '√',
        异常: p['异常继'] === '√',
        恢复: p['恢复继'] === '√',
        万能: true,
        辅助: true,
        被动: true
      },
      skills
    });
  }

  console.log('Fetching Skill category pages...');
  const skillPages = await fetchCategory('Category:P5R技能');
  console.log('Fetched', skillPages.length, 'skill pages');

  const skills = [];
  for (const page of skillPages) {
    const content = page.revisions?.[0]?.['*'] || '';
    const s = parseTemplateParams(content, /\{\{P5R[_\s]技能/);
    if (!s || !s['中文名']) continue;
    const name = s['中文名'].trim();
    const element = (s['属性'] || '').trim();
    const note = (s['备注'] || '').trim();
    const rawLearn = (s['获取'] || '').trim();
    const skillCard = (s['技能卡'] || '').trim();
    skills.push({
      id: parseInt(s['编号'], 10) || 9999,
      name,
      enName: (s['英文名'] || '').trim(),
      element,
      cost: (s['消耗'] || '').trim(),
      desc: (s['简介'] || '').trim(),
      rawLearn,
      skillCard,
      baseDamage: s['基础伤害'] || '',
      hitRate: s['命中率'] || '',
      critRate: s['暴击率'] || '',
      successRate: s['成功率'] || '',
      note,
      exclusive: note.includes('专属') || element === '特性'
    });
  }

  // Fetch traits page
  console.log('Fetching Traits page...');
  const traitRes = await fetch(
    'https://wiki.biligame.com/persona/api.php?action=parse&page=P5R/%E7%89%B9%E6%80%A7%E9%80%86%E6%9F%A5&prop=wikitext&format=json'
  );
  const traitData = await traitRes.json();
  const traitWiki = traitData.parse.wikitext['*'];
  const traitRows = traitWiki.split(/\|-/).slice(2);
  const traits = [];
  for (const row of traitRows) {
    const lines = row
      .trim()
      .split(/\n\|/)
      .map((l) => l.replace(/^\|/, '').trim())
      .filter(Boolean);
    if (lines.length < 3) continue;
    const cleanCell = (c) => {
      const idx = c.indexOf('|');
      // If style="..." | content
      if (idx !== -1 && (c.includes('style=') || c.includes('color'))) {
        return c.slice(idx + 1).trim();
      }
      return c.trim();
    };
    const isSpecial = row.includes('color:#F00');
    const isDlc = row.includes('font-style:italic') || row.includes('【DLC】');
    const name = cleanCell(lines[0]);
    const effect = cleanCell(lines[1]);
    const rawPersonas = cleanCell(lines[2]).replace(/\}\}\s*$/, '');
    const holders = rawPersonas
      .split(/<br\s*\/?>/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => {
        const m = item.match(/【([^】]+)】(.+)/);
        if (m) {
          return { tag: m[1].trim(), name: m[2].trim() };
        }
        return { tag: '', name: item };
      });
    if (name) {
      traits.push({
        name,
        effect,
        isSpecial,
        isDlc,
        holders
      });
    }
  }

  fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync(
    'scratch/parsed_wiki.json',
    JSON.stringify({ personas, skills, traits }, null, 2)
  );
  console.log(
    `Done! Personas: ${personas.length}, Skills: ${skills.length}, Traits: ${traits.length}`
  );
}

run();
