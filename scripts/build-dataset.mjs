import fs from 'fs';

const ARCANA_NORM = {
  '恋爱': '恋人',
  '恋人': '恋人',
  '星': '星星',
  '星星': '星星',
  '月': '月亮',
  '月亮': '月亮',
  '隐者': '隐士',
  '隐士': '隐士',
  '法王': '教皇',
  '教皇': '教皇',
  '女帝': '女皇',
  '女皇': '女皇',
  '死神': '死神',
  '愚者': '愚者',
  '魔术师': '魔术师',
  '女教皇': '女教皇',
  '皇帝': '皇帝',
  '战车': '战车',
  '正义': '正义',
  '命运': '命运',
  '力量': '力量',
  '倒悬者': '倒悬者',
  '节制': '节制',
  '恶魔': '恶魔',
  '塔': '塔',
  '太阳': '太阳',
  '审判': '审判',
  '信念': '信念',
  '顾问官': '顾问官',
  '世界': '世界'
};

const SKILL_ALIAS = {
  '指弾': '指弹',
  '玛哈亚吉达因': '玛哈拉基达因',
  '冻结几率UP': '冻结机率UP'
};

const PARTY_PERSONAS = new Set([
  '佐罗', '墨丘利', '迪亚哥',
  '船长基德', '齐天大圣', '威廉',
  '卡门', '赫卡忒', '赛莱斯廷',
  '五右卫门', '神须佐之男', '五郎吉',
  '琼安', '安娜迪', '艾格尼丝',
  '死灵之书', '普罗米修斯', '阿尔阿吉夫',
  '米莱狄', '阿斯塔尔塔', '露西',
  '罗宾汉', '洛基', '赫里沃德',
  '灰姑娘', '凡娜迪丝', '艾拉'
]);

const TREASURE_DEMONS = new Set([
  '摄政王', '王后的项链', '命运之石', '光之山', '奥尔洛夫',
  '大帝的护符', '希望钻石', '水晶骷髅', '王者金属'
]);

// Treasure demons in P5R can also carry elemental bloodline / eye traits when captured
const TREASURE_EXTRA_TRAITS = {
  '摄政王': ['万夫莫敌的眼神', '个别集中的眼神', '超乎常理的重量', '极致的英才'],
  '王后的项链': ['救星的血统', '支援的血统', '沉静灵气', '极致的英才'],
  '命运之石': ['拜火的血统', '冰寒的血统', '召雷的血统', '流浪的血统', '极致的英才'],
  '光之山': ['念视的血统', '热病的血统', '被祝福的血统', '被诅咒的血统', '极致的英才'],
  '奥尔洛夫': ['铁壁的抗体', '报复的身躯', '天性的危机管理', '极致的英才'],
  '大帝的护符': ['连锁诡计', '巧妙诡计', '极致的英才'],
  '希望钻石': ['卓越的暗示力', '无与伦比的自我暗示力', '极致的英才'],
  '水晶骷髅': ['贪吃的嘴巴', '品尝的嘴巴', '汲取殆尽的嘴巴', '极致的英才'],
  '王者金属': ['穷追的本性', '瘟疫之瞳', '致命绝症', '极致的英才']
};

const DLC_PERSONA_NAMES = new Set([
  '伊邪那岐', '伊邪那岐·贼神',
  '俄耳普斯', '俄耳甫斯·贼神',
  '俄耳普斯F', '俄耳甫斯·贼神F',
  '阿里亚德涅', '阿里亚德涅·贼神',
  '辉夜', '辉夜·贼神',
  '祸津伊邪那岐', '祸津伊邪那岐·贼神',
  '雅典娜', '雅典娜·贼神',
  '月读命', '月读命·贼神',
  '亚斯泰利欧斯', '亚斯泰利欧斯·贼神',
  '塔纳托斯', '塔纳托斯·贼神',
  '劳尔',
  '弥赛亚', '弥赛亚·贼神',
  '伊邪那岐大神', '伊邪那岐大神·贼神'
]);

const SPECIAL_FUSIONS = {
  '佛劳洛斯': ['比利士', '埃力格', '欧若博司'],
  '猫将军': ['木灵', '山灵', '安祖'],
  '塔姆林': ['猫妖精', '高等皮克希', '拉南希'],
  '巴古斯': ['皮克希', '毕舍遮', '诃梨帝母'],
  '地狱天使': ['大天使', '斗牛士', '单卡拉比'],
  '赛特': ['伊西丝', '图特', '阿努比斯', '荷鲁斯'],
  '吹号者': ['白骑士', '红骑士', '黑骑士', '苍白骑士'],
  '邪恶霜精': ['杰克灯笼', '杰克霜精', '霜精之王'],
  '婆苏吉': ['那伽', '那伽之王', '阿难陀'],
  '黄龙': ['玄武', '青龙', '朱雀', '白虎'],
  '阿修罗王': ['持国天', '增长天', '广目天', '毘沙门天'],
  '爱丽丝': ['奈比洛斯', '贝利亚'],
  '湿婆': ['兰达', '巴隆'],
  '阿尔达': ['帕尔瓦蒂', '湿婆'],
  '义经': ['式王子', '荒霸吐', '大国主', '八咫乌', '经津主'],
  '米迦勒': ['拉斐尔', '加百列', '尤利尔'],
  '蚩尤': ['白骑士', '百臂巨人', '托尔', '库夫林', '义经'],
  '梅塔特隆': ['权天使', '能天使', '主天使', '默基瑟德', '圣达芬', '米迦勒'],
  '隐形鬼': ['金鬼', '水鬼', '风鬼'],
  '斯拉欧加': ['密特拉', '米特拉斯', '默基瑟德', '莉莉丝', '加百列'],
  '路西法': ['阿努比斯', '阿难陀', '吹号者', '米迦勒', '梅塔特隆', '撒旦'],
  '撒旦耶尔': ['亚森', '安祖', '伊丝塔', '撒旦', '路西法', '米迦勒'],
  '伊邪那岐大神': ['山灵', '权天使', '犬神', '罗刹', '阿努比斯', '密特拉'],
  '伊邪那岐大神·贼神': ['大国主', '欧特鲁斯', '迦梨', '米特拉斯', '库夫林', '路西法']
};

// Exclusive skills mapped to the exact personas that can hold them
const EXCLUSIVE_SKILL_HOLDERS = {
  '八艘跳跃': ['义经'],
  '可以为我而死吗？': ['爱丽丝'],
  '回转讲道': ['大僧正'],
  '巴力神矛': ['巴力'],
  '深渊之眼': ['哈斯塔'],
  '漆黑之蛇': ['撒旦', '撒旦耶尔'],
  '拂晓明星': ['路西法'],
  '魔王的境界': ['撒旦耶尔'],
  '圣母的慈爱': ['马利亚'],
  '圣母的拥抱': ['马利亚'],
  '圣母的呢喃': ['马利亚'],
  '十文字斩': ['伊邪那岐', '伊邪那岐·贼神'],
  '华彩乐段': ['俄耳普斯', '俄耳甫斯·贼神'],
  '新华彩乐段': ['俄耳普斯F', '俄耳甫斯·贼神F'],
  '弦艺猛兽': ['阿里亚德涅', '阿里亚德涅·贼神'],
  '辉箭': ['辉夜', '辉夜·贼神'],
  '祸津曼荼罗': ['祸津伊邪那岐', '祸津伊邪那岐·贼神'],
  '虚无艺术': ['雅典娜', '雅典娜·贼神'],
  '炼狱之翼': ['月读命', '月读命·贼神'],
  '泰坦之战': ['亚斯泰利欧斯', '亚斯泰利欧斯·贼神'],
  '冥府之门': ['塔纳托斯', '塔纳托斯·贼神'],
  '幻影秀': ['劳尔'],
  '圣谭曲': ['弥赛亚', '弥赛亚·贼神'],
  '数万真言': ['伊邪那岐大神', '伊邪那岐大神·贼神']
};

async function run() {
  const raw = JSON.parse(fs.readFileSync('scratch/parsed_wiki.json', 'utf8'));

  // Fetch compendium HTML to get all avatar URLs
  const htmlRes = await fetch(
    'https://wiki.biligame.com/persona/api.php?action=parse&page=P5R/%E4%BA%BA%E6%A0%BC%E9%9D%A2%E5%85%B7%E5%9B%BE%E9%89%B4&prop=text&format=json'
  );
  const htmlData = await htmlRes.json();
  const compendiumHtml = htmlData.parse.text['*'];
  const avatarMap = {};
  const imgRegex = /<a href="[^"]+" title="P5R\/([^"]+)"><img[^>]+src="([^"]+)"/g;
  let m;
  while ((m = imgRegex.exec(compendiumHtml)) !== null) {
    avatarMap[m[1].trim()] = m[2];
  }
  console.log('Avatar map size:', Object.keys(avatarMap).length);

  // Filter and normalize 232 Compendium Personas
  const personas = raw.personas
    .filter((p) => !p.arcana.includes('{') && !PARTY_PERSONAS.has(p.name))
    .map((p) => {
      const arcana = ARCANA_NORM[p.arcana] || p.arcana;
      let trait = p.trait.trim();
      if (trait === '最快捷径的导引') trait = '最快捷径的引导';
      if (trait === '如产国之举') trait = '如创国之举';
      const skills = p.skills.map((s) => ({
        name: SKILL_ALIAS[s.name] || s.name,
        level: s.level,
        rawLevel: s.rawLevel
      }));
      return {
        ...p,
        arcana,
        trait,
        avatar: avatarMap[p.name] || p.avatar || '',
        isDlc: DLC_PERSONA_NAMES.has(p.name),
        isTreasure: TREASURE_DEMONS.has(p.name),
        isSpecial: Boolean(SPECIAL_FUSIONS[p.name]),
        specialRecipe: SPECIAL_FUSIONS[p.name] || null,
        skills
      };
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const personaByName = new Map(personas.map((p) => [p.name, p]));

  // Verify special fusions
  for (const [target, ing] of Object.entries(SPECIAL_FUSIONS)) {
    if (!personaByName.has(target)) {
      console.error('Missing special fusion target:', target);
    }
    for (const i of ing) {
      if (!personaByName.has(i)) {
        console.error(`Missing special fusion ingredient ${i} for ${target}`);
      }
    }
  }

  // Build skills list
  const skillLearners = new Map();
  for (const p of personas) {
    for (const s of p.skills) {
      if (!skillLearners.has(s.name)) skillLearners.set(s.name, []);
      skillLearners.get(s.name).push({
        persona: p.name,
        arcana: p.arcana,
        level: s.level || p.level,
        isInnate: s.level === 0,
        isDlc: p.isDlc
      });
    }
  }

  // Also check itemization (Electric Chair) from personas for Skill Cards!
  const chairCards = new Map();
  for (const p of personas) {
    if (p.itemization.type === '技能卡') {
      if (p.itemization.normal) {
        const sName = SKILL_ALIAS[p.itemization.normal] || p.itemization.normal;
        if (!chairCards.has(sName)) chairCards.set(sName, []);
        chairCards.get(sName).push({ persona: p.name, alarm: false });
      }
      if (p.itemization.alarm) {
        const sName = SKILL_ALIAS[p.itemization.alarm] || p.itemization.alarm;
        if (!chairCards.has(sName)) chairCards.set(sName, []);
        chairCards.get(sName).push({ persona: p.name, alarm: true });
      }
    }
  }

  const networkSkills = new Set(['万能强化', '高级万能强化', '魔导才能', '灵魂伴侣']);
  const mutationSkills = new Set(['潜伏', '喧哗']);

  const skillsMap = new Map();
  for (const s of raw.skills) {
    if (s.element === '特性' || s.name.includes('{')) continue;
    const name = SKILL_ALIAS[s.name] || s.name;
    const learners = skillLearners.get(name) || [];
    const cards = chairCards.get(name) || [];
    const isNetwork = networkSkills.has(name) || s.rawLearn.includes('网络合成');
    const isMutation = mutationSkills.has(name) || s.rawLearn.includes('警报');
    // Skip party-member-only / accessory-only skills that no compendium persona learns and have no skill card / network source
    if (learners.length === 0 && cards.length === 0 && !s.skillCard && !isNetwork && !isMutation) {
      continue;
    }
    const exclusiveTo = EXCLUSIVE_SKILL_HOLDERS[name] || null;
    skillsMap.set(name, {
      id: s.id,
      name,
      enName: s.enName,
      element: s.element,
      cost: s.cost,
      desc: s.desc,
      skillCardRaw: s.skillCard,
      chairCards: cards,
      learners,
      isNetwork,
      isMutation,
      exclusiveTo,
      inheritable: !exclusiveTo
    });
  }

  const skills = [...skillsMap.values()].sort((a, b) => a.id - b.id);

  // Build traits list from personas + wiki traits
  const traitsMap = new Map();
  for (const t of raw.traits) {
    let name = t.name.trim();
    if (name === '最快捷径的导引') name = '最快捷径的引导';
    if (name === '如产国之举') name = '如创国之举';
    traitsMap.set(name, {
      name,
      effect: t.effect,
      isSpecial: t.isSpecial,
      isDlc: t.isDlc,
      uninheritable: name === '如创国之举',
      holders: []
    });
  }

  for (const p of personas) {
    const tName = p.trait;
    if (!traitsMap.has(tName)) {
      traitsMap.set(tName, {
        name: tName,
        effect: p.traitDesc,
        isSpecial: false,
        isDlc: p.isDlc,
        uninheritable: tName === '如创国之举',
        holders: []
      });
    }
    const entry = traitsMap.get(tName);
    if (!entry.effect && p.traitDesc) entry.effect = p.traitDesc;
    entry.holders.push({
      name: p.name,
      arcana: p.arcana,
      level: p.level,
      isDlc: p.isDlc,
      isTreasure: p.isTreasure
    });
  }

  // Also add Treasure Demons to their extra traits
  for (const [tdName, tList] of Object.entries(TREASURE_EXTRA_TRAITS)) {
    const td = personaByName.get(tdName);
    if (!td) continue;
    for (const tName of tList) {
      const entry = traitsMap.get(tName);
      if (entry && !entry.holders.some((h) => h.name === tdName)) {
        entry.holders.push({
          name: td.name,
          arcana: td.arcana,
          level: td.level,
          isDlc: false,
          isTreasure: true
        });
      }
    }
  }

  const traits = [...traitsMap.values()].filter((t) => t.holders.length > 0);

  // Parse Arcana Fusion Chart and Treasure Demon Chart from steps/12/content.md
  const fusionWikiRes = await fetch(
    'https://wiki.biligame.com/persona/api.php?action=parse&page=P5R/%E5%90%88%E6%88%90%E8%8C%83%E5%BC%8F&prop=wikitext&format=json'
  );
  const fusionWikiData = await fusionWikiRes.json();
  const fusionWiki = fusionWikiData.parse.wikitext['*'];

  const tables = fusionWiki.split(/\{\|\s*class="wikitable"/).slice(1);
  // Table 0: Arcana 2-body chart
  const arcanaTableRaw = tables[0].split('|}')[0];
  const arcanaRows = arcanaTableRaw.split(/\|-/).slice(2);
  const arcanaHeader = arcanaRows[0]
    .split(/\n\|/)
    .slice(2)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((a) => ARCANA_NORM[a] || a);

  const arcanaChart = {};
  for (const a of arcanaHeader) arcanaChart[a] = {};

  for (let r = 1; r < arcanaRows.length; r++) {
    const cells = arcanaRows[r]
      .split(/\n\|/)
      .slice(1)
      .map((c) => {
        const idx = c.lastIndexOf('|');
        return (idx !== -1 ? c.slice(idx + 1) : c).trim();
      })
      .filter(Boolean);
    const rowArcana = ARCANA_NORM[cells[0]] || cells[0];
    if (!rowArcana || !arcanaChart[rowArcana]) continue;
    for (let c = 1; c < cells.length; c++) {
      const colArcana = arcanaHeader[c - 1];
      const val = cells[c];
      if (val && val !== '—' && val !== '-') {
        const resArcana = ARCANA_NORM[val] || val;
        arcanaChart[rowArcana][colArcana] = resArcana;
        arcanaChart[colArcana][rowArcana] = resArcana;
      }
    }
  }

  // Table 1: Treasure Demon rank modifier chart
  const tdTableRaw = tables[1].split('|}')[0];
  const tdRows = tdTableRaw.split(/\|-/).slice(2);
  const tdHeader = tdRows[0]
    .split(/\n\|/)
    .slice(2)
    .map((c) => {
      const idx = c.lastIndexOf('|');
      return (idx !== -1 ? c.slice(idx + 1) : c).trim();
    })
    .filter(Boolean)
    .map((a) => ARCANA_NORM[a] || a);

  const treasureChart = {};
  for (let r = 1; r < tdRows.length; r++) {
    const cells = tdRows[r]
      .split(/\n\|/)
      .slice(1)
      .map((c) => {
        const idx = c.lastIndexOf('|');
        return (idx !== -1 ? c.slice(idx + 1) : c).trim();
      })
      .filter(Boolean);
    const tdName = cells[0];
    if (!tdName) continue;
    treasureChart[tdName] = {};
    for (let c = 1; c < cells.length; c++) {
      const colArcana = tdHeader[c - 1];
      const mod = parseInt(cells[c], 10);
      if (!isNaN(mod) && colArcana) {
        treasureChart[tdName][colArcana] = mod;
      }
    }
  }

  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync(
    'src/data/p5rData.json',
    JSON.stringify(
      {
        arcanaOrder: [...arcanaHeader, '世界'],
        arcanaChart,
        treasureChart,
        specialFusions: SPECIAL_FUSIONS,
        personas,
        skills,
        traits
      },
      null,
      2
    )
  );
  console.log(
    `Successfully generated src/data/p5rData.json! Personas: ${personas.length}, Skills: ${skills.length}, Traits: ${traits.length}, Arcanas: ${arcanaHeader.length}`
  );
}

run();
