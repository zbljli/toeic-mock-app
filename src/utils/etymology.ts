/**
 * Lightweight etymology engine.
 * Parses common English prefixes, roots, and suffixes to
 * display word-building logic without a pre-built database.
 */

export interface EtymologyResult {
  prefix?:  { text: string; meaning: string };
  root:     { text: string; meaning: string };
  suffix?:  { text: string; meaning: string };
  formula:  string;
  cognates: string[];
}

// ----- Affix databases -----

const PREFIXES: [string, string, string[]][] = [
  ['a-', '朝向/在…', ['aboard', 'aside', 'asleep']],
  ['ab-', '离开/偏离', ['abnormal', 'absent', 'abuse']],
  ['ac-', '朝向(ad-变体)', ['accelerate', 'accompany', 'accumulate']],
  ['ad-', '朝向/添加', ['advance', 'adjust', 'admit']],
  ['anti-', '反对/抗', ['antibiotic', 'anticipate']],
  ['auto-', '自己/自动', ['automobile', 'automatically', 'automaton']],
  ['bene-', '好', ['benefit', 'beneficial']],
  ['bio-', '生命', ['biology']],
  ['co-', '共同', ['coordinate', 'collaboration', 'cohesive']],
  ['com-', '共同/一起', ['commercial', 'community', 'communication']],
  ['con-', '共同/加强', ['conference', 'contract', 'connect']],
  ['contra-', '反对', ['contract', 'contrast']],
  ['counter-', '对应/反', ['counterpart', 'countersign']],
  ['de-', '向下/去除', ['decline', 'deficit', 'depart', 'depreciation']],
  ['dis-', '不/分开', ['discount', 'display', 'dispute', 'discard']],
  ['e-', '向外', ['evaluate', 'eligible', 'elaborate']],
  ['em-', '使…进入', ['embrace', 'employ', 'empathy']],
  ['en-', '使…', ['enclose', 'encounter', 'endeavor', 'endorse']],
  ['ex-', '向外/前任', ['export', 'extend', 'exchange', 'exceed']],
  ['extra-', '超出', ['extraordinary']],
  ['fore-', '预先/前', ['forecast', 'forward']],
  ['il-', '不(in-变体)', []],
  ['im-', '不/向内', ['impact', 'import', 'impression']],
  ['in-', '不/向内', ['income', 'inspect', 'install', 'involve']],
  ['inter-', '之间/相互', ['international', 'interview', 'interfere']],
  ['ir-', '不(in-变体)', ['irresistible', 'irrevocable']],
  ['mal-', '坏/错误', ['malfunction']],
  ['mis-', '错误', ['misconduct', 'miscellaneous']],
  ['multi-', '多', ['multimedia']],
  ['non-', '非', ['nonconforming']],
  ['out-', '超出/外', ['outlet', 'outpatient', 'outsourcing']],
  ['over-', '过度/在上', ['overdue', 'overtime', 'overseas']],
  ['per-', '贯穿/完全', ['permanent', 'permit', 'persuade']],
  ['post-', '后', ['postpone', 'postage']],
  ['pre-', '前/预', ['preliminary', 'preview', 'prescription']],
  ['pro-', '向前/支持', ['proceed', 'profit', 'promote', 'propose']],
  ['re-', '再次/回', ['return', 'review', 'revise', 'refund']],
  ['sub-', '下/次', ['subway', 'substitute', 'subsidiary']],
  ['super-', '上/超', ['supervise', 'supervisor']],
  ['sur-', '超过', ['survey', 'surplus', 'surrender']],
  ['tele-', '远', ['telephone', 'telemarketing']],
  ['trans-', '跨越/转换', ['transport', 'transfer', 'transit']],
  ['un-', '不', ['unemployment', 'unacceptable', 'unprecedented']],
  ['under-', '下/不足', ['undertake', 'undervalue']],
  ['up-', '向上', ['upgrade', 'update', 'up-to-date']],
  ['with-', '向后/对抗', ['withdraw', 'withdrawal']],
];

const ROOTS: [string, string, string[]][] = [
  ['act', '行动/做', ['action', 'active', 'activate', 'transaction']],
  ['aud', '听', ['audience', 'audition', 'auditorium']],
  ['bene/beni', '好', ['benefit', 'beneficial', 'benevolent']],
  ['cap/capt/ceive/cept', '拿/取', ['capability', 'capacity', 'receive', 'accept']],
  ['ced/ceed/cess', '走/去', ['proceed', 'succeed', 'access', 'exceed', 'concede']],
  ['celer', '快速', ['accelerate', 'decelerate']],
  ['cent', '百', ['percent', 'century', 'centimeter']],
  ['cert', '确定', ['certificate', 'certain', 'certify']],
  ['claim/clam', '喊/声称', ['claim', 'exclaim', 'proclaim', 'reclaim']],
  ['clud/clus/clos', '关闭', ['include', 'exclude', 'conclude', 'disclose']],
  ['cogn', '知道', ['recognize', 'cognitive']],
  ['cred', '相信/信任', ['credit', 'credible', 'credentials', 'incredible']],
  ['cur/curs', '跑/流', ['current', 'currency', 'occur', 'excursion']],
  ['dict/dic', '说', ['dictate', 'predict', 'dictionary', 'verdict']],
  ['duc/duct', '引导', ['conduct', 'product', 'deduction', 'introduction']],
  ['equ', '相等', ['equal', 'equity', 'adequate', 'equivalent']],
  ['fac/fect/fic', '做/制造', ['factory', 'manufacture', 'efficiency', 'sufficient']],
  ['fer', '带/运', ['transfer', 'refer', 'conference', 'offer', 'prefer']],
  ['fin', '结束/界限', ['final', 'finance', 'define', 'infinite', 'confine']],
  ['flect/flex', '弯曲', ['reflect', 'flexible', 'deflect']],
  ['form', '形状/形成', ['form', 'reform', 'inform', 'transform', 'platform']],
  ['gen', '产生/种类', ['generate', 'generator', 'general', 'gene']],
  ['grad/gress', '步/走', ['grade', 'graduate', 'progress', 'aggressive']],
  ['graph/gram', '写/画', ['photograph', 'diagram', 'program', 'autograph']],
  ['ject', '投/扔', ['reject', 'project', 'inject', 'subject', 'object']],
  ['jud/jur/jus', '法律/判断', ['judge', 'jury', 'justice', 'jurisdiction', 'adjust']],
  ['lect/leg', '选/读', ['select', 'collect', 'elect', 'elegant', 'eligible']],
  ['log', '说/学问', ['dialogue', 'logic', 'apologize', 'catalog']],
  ['man/manu', '手', ['manual', 'manufacture', 'manipulate', 'manage']],
  ['mand', '命令', ['command', 'demand', 'mandatory', 'recommend']],
  ['medi', '中间', ['media', 'medium', 'immediate', 'intermediate']],
  ['min', '小', ['minimum', 'minor', 'minimize', 'diminish']],
  ['miss/mit', '送/放', ['submit', 'admit', 'commit', 'transmit', 'permit', 'omit']],
  ['mot/mov/mob', '动', ['motive', 'promote', 'motion', 'remove', 'mobile', 'automobile']],
  ['norm', '规则/标准', ['normal', 'norm', 'abnormal', 'enormous']],
  ['not', '知道/标记', ['note', 'notice', 'notify', 'denote', 'notorious']],
  ['nov', '新', ['novel', 'novice', 'innovate', 'renovate']],
  ['ord/ordin', '顺序', ['order', 'ordinary', 'coordinate', 'subordinate']],
  ['part/port', '部分/分', ['part', 'partition', 'participate', 'portion', 'partial']],
  ['path/pass', '感觉/承受', ['sympathy', 'empathy', 'passion', 'patient', 'passive']],
  ['pel/puls', '推/驱动', ['compel', 'impulse', 'repel', 'propel', 'compulsive']],
  ['pend/pens', '悬挂/支付', ['pending', 'suspend', 'depend', 'expense', 'pension', 'compensation']],
  ['pet', '追求/寻求', ['compete', 'competitor', 'repeat', 'appetite', 'petition']],
  ['phon', '声音', ['telephone', 'microphone', 'symphony', 'phonetic']],
  ['plic/ply', '折叠/卷入', ['implication', 'apply', 'comply', 'supply', 'complicated']],
  ['pon/pos', '放/置', ['postpone', 'propose', 'compose', 'deposit', 'dispose', 'expose', 'position']],
  ['port', '携带/运送', ['portable', 'import', 'export', 'transport', 'report', 'support', 'portfolio']],
  ['press', '压', ['press', 'express', 'impress', 'compress', 'depress', 'suppress']],
  ['prim/prim', '第一', ['primary', 'prime', 'premier', 'primitive', 'premiere']],
  ['priv', '私人/分离', ['private', 'privilege', 'deprive', 'privacy']],
  ['prob/prov', '尝试/证明', ['prove', 'approve', 'approval', 'improve', 'probability']],
  ['pub', '公众', ['public', 'publicity', 'publish', 'republic']],
  ['quir/quis', '寻求/问', ['inquire', 'require', 'acquire', 'question', 'request']],
  ['rect/reg', '直/规则', ['correct', 'direct', 'regulation', 'regular', 'region']],
  ['rupt', '破/断', ['interrupt', 'bankrupt', 'corrupt', 'abrupt', 'disrupt']],
  ['scrib/script', '写', ['describe', 'prescribe', 'subscribe', 'manuscript', 'description']],
  ['sec/sequ', '跟随', ['second', 'consecutive', 'sequence', 'consequence', 'subsequent']],
  ['sect', '切/分', ['section', 'sector', 'intersection', 'dissect']],
  ['sens/sent', '感觉', ['sense', 'sentence', 'consent', 'consensus', 'sentiment', 'sensation']],
  ['serv', '服务/保持', ['service', 'serve', 'deserve', 'reserve', 'observe', 'preserve', 'conservative']],
  ['sign', '标记', ['sign', 'signal', 'signature', 'design', 'assign', 'significant', 'resign']],
  ['sist/sta/stat/st', '站立', ['assist', 'consist', 'insist', 'persist', 'resist', 'station', 'status', 'static', 'stable', 'establish', 'state', 'statement']],
  ['solv/solu', '松开/解决', ['solve', 'solution', 'dissolve', 'resolve', 'absolute']],
  ['spec/spect/spic', '看', ['inspect', 'respect', 'expect', 'specification', 'spectator', 'suspect', 'prospect', 'perspective', 'specific', 'special']],
  ['spir', '呼吸', ['inspire', 'spirit', 'respire', 'expire', 'conspiracy']],
  ['struct', '建造', ['structure', 'construct', 'destruct', 'instruct', 'obstruct', 'infrastructure']],
  ['sum/sumpt', '拿/取', ['assume', 'consume', 'presume', 'resume', 'consumption', 'assumption']],
  ['tain/ten/tin', '保持', ['contain', 'maintain', 'obtain', 'retain', 'sustain', 'tenant', 'continue', 'continent']],
  ['tend/tens/tent', '伸展/倾向', ['extend', 'attend', 'intend', 'pretend', 'intense', 'tension', 'attention', 'intention', 'extension']],
  ['term', '界限/终端', ['term', 'terminate', 'determine', 'terminal', 'terminology']],
  ['test', '证明/证据', ['test', 'protest', 'contest', 'testify', 'testimony']],
  ['tract/treat', '拉/拖', ['contract', 'attract', 'extract', 'subtract', 'abstract', 'retreat', 'treatment']],
  ['tribut', '给予/分配', ['contribute', 'distribute', 'attribute', 'tribute']],
  ['urb', '城市', ['urban', 'suburb', 'urbanization']],
  ['vac/van/void', '空', ['vacant', 'vacation', 'vacuum', 'vanish', 'void', 'avoid', 'vacancy']],
  ['val/vail', '价值/强', ['value', 'valid', 'evaluate', 'equivalent', 'prevail', 'available', 'invalid']],
  ['ven/vent', '来', ['event', 'invent', 'prevent', 'convene', 'convention', 'adventure', 'revenue', 'intervene']],
  ['ver/vers/vert', '转', ['reverse', 'version', 'convert', 'diverse', 'advertise', 'converse', 'versatile', 'universe', 'vertical']],
  ['vid/vis/view', '看', ['video', 'visible', 'vision', 'visit', 'revise', 'provide', 'evidence', 'supervise', 'review', 'interview', 'view']],
  ['voc/vok', '叫/喊', ['vocal', 'voice', 'vocabulary', 'advocate', 'provoke', 'revoke', 'invoke', 'vocation']],
  ['volv/volu', '卷/转', ['involve', 'evolve', 'volume', 'revolution', 'revolve']],
];

const SUFFIXES: [string, string, string[]][] = [
  ['-able/-ible', '可…的(形)', ['available', 'portable', 'eligible', 'credible']],
  ['-al/-ial', '…的(形)', ['commercial', 'essential', 'financial', 'potential']],
  ['-ance/-ence', '…状态(名)', ['attendance', 'insurance', 'maintenance', 'difference']],
  ['-ant/-ent', '…的人/物(名)', ['applicant', 'consultant', 'opponent', 'president']],
  ['-ary/-ory', '…的(形)', ['necessary', 'temporary', 'mandatory', 'preliminary']],
  ['-ate', '动词/形容词后缀', ['accelerate', 'estimate', 'coordinate', 'private', 'adequate']],
  ['-ation/-tion/-sion', '…行为/状态(名)', ['information', 'education', 'communication', 'decision', 'discussion', 'negotiation', 'presentation']],
  ['-cy', '…状态(名)', ['accuracy', 'efficiency', 'currency', 'frequency', 'pregnancy']],
  ['-ed', '被…的/已…(形)', ['interested', 'excited', 'structured', 'devoted']],
  ['-ence/-ance', '…状态(名)', ['conference', 'difference', 'experience', 'performance']],
  ['-er/-or/-ar', '…的人/物(名)', ['worker', 'manager', 'employer', 'director', 'competitor', 'calculator']],
  ['-ful', '充满…的(形)', ['successful', 'helpful', 'useful', 'powerful', 'wonderful']],
  ['-fy/-ify', '使…化(动)', ['clarify', 'classify', 'modify', 'identify', 'verify', 'diversify', 'purify']],
  ['-ic/-ical', '…的(形)', ['specific', 'economic', 'scientific', 'strategic', 'dynamic', 'electronic', 'periodic']],
  ['-ing', '正在…/…的', ['interesting', 'meeting', 'parking', 'building', 'training', 'marketing', 'answering']],
  ['-ion/-tion/-ation', '…行为/结果(名)', ['action', 'solution', 'promotion', 'regulation', 'evaluation', 'validation', 'interpretation', 'qualification', 'recommendation']],
  ['-ish', '有点…的(形)', ['selfish', 'foolish']],
  ['-ism', '…主义/学说(名)', ['capitalism', 'tourism', 'racism']],
  ['-ist', '…的人(名)', ['scientist', 'artist', 'specialist', 'typist']],
  ['-ive/-ative', '…倾向的(形)', ['active', 'creative', 'competitive', 'innovative', 'attractive', 'expensive', 'offensive']],
  ['-ize/-ise', '使…化(动)', ['organize', 'realize', 'recognize', 'apologize', 'authorize', 'itemize', 'standardize', 'utilize', 'symbolize']],
  ['-less', '无…的(形)', ['endless', 'careless', 'useless', 'wireless', 'limitless', 'regardless']],
  ['-ly', '…地(副)', ['quickly', 'certainly', 'approximately', 'automatically', 'consecutively', 'significantly', 'substantially', 'ultimately']],
  ['-ment', '…行为/结果(名)', ['agreement', 'development', 'management', 'equipment', 'investment', 'appointment', 'commitment', 'replacement', 'settlement', 'announcement']],
  ['-ness', '…性质/状态(名)', ['business', 'happiness', 'darkness', 'awareness', 'effectiveness', 'willingness']],
  ['-ous/-ious', '…性质的(形)', ['various', 'serious', 'obvious', 'generous', 'dangerous', 'continuous', 'tremendous', 'conscious', 'ambitious', 'curious', 'luxurious']],
  ['-ship', '…关系/状态(名)', ['relationship', 'partnership', 'leadership', 'membership', 'ownership', 'friendship', 'scholarship']],
  ['-ty/-ity', '…性质(名)', ['ability', 'quality', 'reality', 'security', 'opportunity', 'responsibility', 'personality', 'possibility', 'popularity']],
  ['-ure', '…行为/结果(名)', ['failure', 'pressure', 'procedure', 'structure', 'departure', 'signature', 'expenditure']],
  ['-ward', '朝向…(形/副)', ['forward', 'backward', 'toward', 'downward']],
  ['-y', '…性质的(形)', ['happy', 'healthy', 'wealthy', 'messy', 'trendy', 'worthy']],
];

// ====== Matching engine ======

function bestPrefixMatch(word: string): { text: string; meaning: string } | undefined {
  let best: { text: string; meaning: string } | undefined;
  for (const [text, meaning] of PREFIXES) {
    const clean = text.replace('-', '');
    if (word.startsWith(clean) && word.length > clean.length + 2) {
      if (!best || clean.length > best.text.replace('-', '').length) {
        best = { text, meaning };
      }
    }
  }
  return best;
}

function bestSuffixMatch(word: string): { text: string; meaning: string } | undefined {
  let best: { text: string; meaning: string } | undefined;
  for (const [text, meaning] of SUFFIXES) {
    // Try each variant separated by /
    for (const variant of text.split('/')) {
      const clean = variant.replace('-', '');
      if (word.endsWith(clean) && word.length > clean.length + 2) {
        if (!best || clean.length > best.text.replace('-', '').length) {
          best = { text: variant, meaning };
        }
      }
    }
  }
  return best;
}

function bestRootMatch(middle: string): { text: string; meaning: string } | undefined {
  let best: { text: string; meaning: string } | undefined;
  for (const [text, meaning] of ROOTS) {
    for (const variant of text.split('/')) {
      if (middle.includes(variant) && variant.length >= 3) {
        if (!best || variant.length > best.text.length) {
          best = { text: variant, meaning };
        }
      }
    }
  }
  return best;
}

// ====== Main API ======

export function analyzeEtymology(word: string): EtymologyResult | null {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');

  const prefix = bestPrefixMatch(lower);
  const suffix = bestSuffixMatch(lower);

  // Extract the middle part (root area)
  let middle = lower;
  if (prefix) {
    const pClean = prefix.text.replace('-', '');
    if (lower.startsWith(pClean)) {
      middle = lower.slice(pClean.length);
    }
  }
  if (suffix) {
    const sClean = suffix.text.replace('-', '');
    if (middle.endsWith(sClean)) {
      middle = middle.slice(0, -sClean.length);
    }
  }

  const root = bestRootMatch(middle);

  if (!root && !prefix && !suffix) return null;
  // Need at least a root or (prefix + suffix)
  if (!root && (!prefix || !suffix)) return null;

  // Build formula
  const parts: string[] = [];
  if (prefix) parts.push(prefix.text.replace('-', ''));
  parts.push(root?.text ?? (middle || '?'));
  if (suffix) parts.push(suffix.text.replace('-', ''));

  return {
    prefix,
    root: root ?? { text: middle || '?', meaning: '词根' },
    suffix,
    formula: parts.join(' + '),
    cognates: [], // Could be populated from word database
  };
}

export function findCognates(word: string, allWords: { id: string; word: string }[]): string[] {
  const result = analyzeEtymology(word);
  if (!result?.root) return [];

  const rootText = result.root.text.toLowerCase();
  return allWords
    .filter((w) => w.word.toLowerCase().includes(rootText) && w.word.toLowerCase() !== word.toLowerCase())
    .slice(0, 5)
    .map((w) => w.word);
}
