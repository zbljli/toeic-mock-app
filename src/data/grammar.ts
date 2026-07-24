/**
 * 10大英语语法知识点 — 翻译练习笔记
 *
 * 每个语法点：概念判断 → 关键规则 → 翻译例句 → 常见错误 → 测验
 */

export interface TranslationExample {
  chinese: string;
  english: string;
  note?: string; // 额外说明
}

export interface GrammarQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  titleZh: string;
  videoUrl?: string;
  /** 判断方式 / 什么是这个句型 */
  definition: string;
  /** 关键规则，每项一个要点 */
  rules: string[];
  /** 中译英练习 */
  examples: TranslationExample[];
  /** 常见错误 / 陷阱 */
  traps: string[];
  quiz: GrammarQuizItem[];
}

export const GRAMMAR_POINTS: GrammarPoint[] = [
  // ==========================================
  // 一、主谓宾
  // ==========================================
  {
    id: 'svo',
    title: 'Subject + Verb + Object',
    titleZh: '主谓宾',
    videoUrl: 'https://b23.tv/j67XxE6',
    definition: '主语 + 动作（动词）+ 宾语。表示"谁做了什么事"。谓语动词要随着主语的人称和数量变化（三单 +s），宾语前如果是动词要变形（后接 -ing 或前加 to）。',
    rules: [
      '三单变形：he/she/it 或单数主语 → 动词 +s/es（He loves you）',
      '宾语为动词时：like/love/enjoy + doing；want/decide/refuse + to do',
      '否定/疑问需要助动词 do/does/did + 动词原形',
    ],
    examples: [
      { chinese: '我爱你', english: 'I love you' },
      { chinese: '我爱吃面条', english: 'I love eating noodles', note: 'love + doing' },
      { chinese: '他爱你', english: 'He loves you', note: '三单 +s' },
      { chinese: '他爱吃面条', english: 'He loves eating noodles' },
      { chinese: '你吃米饭', english: 'You eat rice' },
      { chinese: '你喜欢吃米饭', english: 'You like eating rice' },
      { chinese: '这个人吃面条', english: 'This person eats noodles', note: '单数主语 +s' },
      { chinese: '这个人喜欢睡觉', english: 'This person likes sleeping' },
      { chinese: '我跑步', english: 'I run' },
      { chinese: '我想离开这里', english: 'I want to leave here', note: 'want + to do' },
      { chinese: '他们跑步', english: 'They run' },
      { chinese: '他们决定乘坐大巴', english: 'They decide to take a bus', note: 'decide + to do' },
      { chinese: '她跑步', english: 'She runs', note: '三单 +s' },
      { chinese: '她拒绝帮助你', english: 'She refuses to help you', note: 'refuse + to do' },
    ],
    traps: [
      '三单忘记 +s：He love you ❌ → He loves you ✓',
      '动词宾语形式混淆：I want eating ❌ → I want to eat ✓',
      '助动词后还用三单：He doesn\'t likes ❌ → He doesn\'t like ✓（do/does/did 后永远原形）',
    ],
    quiz: [
      {
        question: '"He ___ to help you." 横线上填什么？',
        options: ['want', 'wants', 'wanting', 'to want'],
        correctIndex: 1,
        explanation: 'He 是三单主语，谓语动词需要加 s → wants。want to do 是固定搭配。',
      },
      {
        question: '为什么 "I want eating" 是错的？',
        options: ['want 后只能接 to do，不是 doing', 'eating 拼写错了', 'I 应该用 wants', '不需要加 doing'],
        correctIndex: 0,
        explanation: 'want 后只能接 to do（不定式），不能说 want doing。类似词：decide to do, refuse to do。',
      },
    ],
  },

  // ==========================================
  // 二、主系表
  // ==========================================
  {
    id: 'svc',
    title: 'Subject + Linking Verb + Complement',
    titleZh: '主系表',
    videoUrl: 'https://b23.tv/OTDwhrR',
    definition: '主语 + 系动词 + 表语。系动词不是"做动作"，而是"连接主语和描述"。表语说明主语的状态、特征或身份。系动词后接形容词（不是副词！）。',
    rules: [
      '状态系动词：be (am/is/are/was/were)',
      '感官系动词：look / feel / sound / smell / taste → 后接形容词',
      '变化系动词：become / get / grow / turn / go / come',
      '持续系动词：keep / remain / stay',
      '表像系动词：seem / appear',
      '系动词后接形容词不是副词：smells sweet ✓  smells sweetly ❌',
    ],
    examples: [
      { chinese: '她是老师', english: 'She is a teacher' },
      { chinese: '花闻起来很香', english: 'The flower smells sweet', note: 'sweet是形容词，不是sweetly' },
      { chinese: '汤尝起来很好', english: 'The soup tastes good', note: 'good是形容词，不是well' },
      { chinese: '他看起来很累', english: 'He looks tired' },
      { chinese: '天气变冷了', english: 'The weather gets cold' },
      { chinese: '她变得有名了', english: 'She becomes famous' },
      { chinese: '音乐听起来很美', english: 'The music sounds beautiful' },
      { chinese: '门保持开着', english: 'The door remains open' },
      { chinese: '他似乎很开心', english: 'He seems happy' },
      { chinese: '我感觉很舒服', english: 'I feel comfortable' },
      { chinese: '食物看起来很美味', english: 'The food looks delicious' },
      { chinese: '她看起来很漂亮', english: 'She looks beautiful' },
      { chinese: '他似乎很生气', english: 'He seems angry' },
      { chinese: '问题变得越来越复杂', english: 'The problem gets increasingly complex' },
      { chinese: '天气变得越来越暖和', english: 'The weather becomes warmer and warmer' },
      { chinese: '她看起来越来越自信', english: 'She appears more and more confident' },
    ],
    traps: [
      '系动词后误用副词：She looks beautifully ❌ → She looks beautiful ✓',
      '感官动词做系动词 vs 实义动词：The soup tastes good（系，表状态）/ He tastes the soup（实义，表动作）',
      'become/get/grow 都表"变得"，但 get 最口语化，become 较正式',
    ],
    quiz: [
      {
        question: '"The music sounds ___." 横线上填什么？',
        options: ['beautifully', 'beautiful', 'beauty', 'more beautiful'],
        correctIndex: 1,
        explanation: 'sounds 是感官系动词，后接形容词 beautiful，不能接副词 beautifully。',
      },
      {
        question: '下面哪句是正确的？',
        options: ['She looks tired.', 'She looks tiredly.', 'She look tired.', 'She is look tired.'],
        correctIndex: 0,
        explanation: 'look 是系动词 + 形容词 tired。B 错在用了副词，C 缺三单 s，D 多了一个 is。',
      },
    ],
  },

  // ==========================================
  // 三、there be 句型
  // ==========================================
  {
    id: 'there-be',
    title: 'There Be (Existential)',
    titleZh: 'There Be 句型',
    videoUrl: 'https://b23.tv/8cvAMMq',
    definition: '表示"某处存在某物/某人"，不是"拥有"。There be ≠ Have！There be = 存在；Have = 拥有。哪里原则：be 动词与最近的主语保持一致（就近原则）。',
    rules: [
      'there is + 单数/不可数名词',
      'there are + 复数名词',
      '就近原则：There is a book and two pens（be跟最近的a book → is）',
      '过去：there was（单）/ there were（复）',
      '将来：there will be',
      '完成：there have been / there has been',
      'There be ≠ Have：There is a book on the desk ≠ I have a book',
    ],
    examples: [
      { chinese: '桌上有一本书', english: 'There is a book on the table' },
      { chinese: '房间里有两只猫', english: 'There are two cats in the room' },
      { chinese: '桌上有一本书和两只笔', english: 'There is a book and two pens on the table', note: '就近原则' },
      { chinese: '墙上有一幅画', english: 'There is a picture on the wall' },
      { chinese: '公园里有很多孩子', english: 'There are many children in the park' },
      { chinese: '天上有很多星星', english: 'There are many stars in the sky' },
      { chinese: '这里有一个问题', english: 'There is a problem here' },
      { chinese: '昨天有一场大雨', english: 'There was a heavy rain yesterday', note: '过去→was' },
      { chinese: '去年有很多变化', english: 'There were many changes last year', note: '过去+复数→were' },
      { chinese: '明天会有一场考试', english: 'There will be an exam tomorrow', note: '将来→will be' },
      { chinese: '一直有很多争议', english: 'There have been many debates', note: '完成时→have been' },
      { chinese: '冰箱里有牛奶', english: 'There is milk in the fridge', note: 'milk不可数→is' },
      { chinese: '碗里有一些米饭', english: 'There is some rice in the bowl', note: 'rice不可数→is' },
      { chinese: '街上有很多人', english: 'There are many people on the street' },
      { chinese: '我有一本书', english: 'I have a book', note: '拥有→have，不是there be' },
      { chinese: '学校里有一棵大树', english: 'There is a big tree in the school' },
    ],
    traps: [
      '混淆 there be 和 have：There is a book ❌ I have a book → 前者是存在，后者是拥有',
      '忽略就近原则：There are a book and two pens ❌ → There is a book and two pens ✓',
      '不可数名词用 are：There are milk ❌ → There is milk ✓',
    ],
    quiz: [
      {
        question: '"There ___ a cat and two dogs in the yard." 选什么？',
        options: ['is', 'are', 'were', 'have'],
        correctIndex: 0,
        explanation: '就近原则：be 动词与最近的主语 a cat（单数）一致，用 is。',
      },
      {
        question: '"There will ___ a meeting tomorrow." 横线上应该用什么？',
        options: ['is', 'are', 'be', 'have'],
        correctIndex: 2,
        explanation: '将来时 will + 动词原形 → will be。There will be = 将有。',
      },
    ],
  },

  // ==========================================
  // 四、否定句
  // ==========================================
  {
    id: 'negation',
    title: 'Negation',
    titleZh: '否定句',
    videoUrl: 'https://b23.tv/gLYmEZ2',
    definition: '在肯定句基础上加否定词，表达"不/没有/绝非"。否定方式有 not + 动词（最常见）、no + 名词、never（永不）、neither（两者都不）、hardly（几乎不）。核心区分：部分否定 ≠ 全部否定。',
    rules: [
      'not + 动词：do not / does not / did not / is not / will not',
      'no + 名词：no time / no money / no smoking',
      'never：永远不 | neither：两者都不',
      'hardly / scarcely：几乎不（半否定词）',
      '🔥 全部否定：none / neither / nothing / nobody（完全否定）',
      '🔥 部分否定：not + all / both / every / always（并非全部）',
    ],
    examples: [
      { chinese: '我不喜欢咖啡', english: "I don't like coffee" },
      { chinese: '她不是学生', english: "She isn't a student" },
      { chinese: '他不吃肉', english: "He doesn't eat meat" },
      { chinese: '我没有时间', english: "I have no time / I don't have time", note: '两种否定方式' },
      { chinese: '这里禁止吸烟', english: 'No smoking here' },
      { chinese: '他从不迟到', english: 'He never arrives late' },
      { chinese: '我几乎不懂法语', english: 'I hardly know French' },
      { chinese: '两个孩子都不聪明', english: 'Neither child is clever' },
      { chinese: '并非所有学生都通过了考试', english: 'Not all students passed the exam', note: '部分否定：有些过了，有些没过' },
      { chinese: '所有学生都没有通过考试', english: 'None of the students passed the exam', note: '全部否定：0个人通过' },
      { chinese: '并非每个人都喜欢运动', english: 'Not everyone likes sports', note: '部分否定' },
      { chinese: '两条路都不通', english: 'Neither road works' },
      { chinese: '这本书不是我的', english: 'This book is not mine' },
      { chinese: '他们不会来', english: "They won't come" },
      { chinese: '我不相信他', english: "I don't believe him" },
      { chinese: '她不常去超市', english: "She doesn't often go to the supermarket" },
    ],
    traps: [
      '部分否定 ≠ 全部否定：Not all students passed（部分及格）≠ None of the students passed（0人及格）',
      'hardly/barely 本身含否定义：I hardly know ≠ I know hard',
      'do/does/did 后动词用原形：He doesn\'t likes ❌ → He doesn\'t like ✓',
    ],
    quiz: [
      {
        question: '"Not all students passed the exam." 意思是？',
        options: ['所有学生都没通过', '有些学生通过了，有些没有', '所有学生都通过了', '只有一个学生通过了'],
        correctIndex: 1,
        explanation: 'Not all = 部分否定，"并非所有都" → 有些人过了有些人没过。如果是全部否定要说 None of。',
      },
      {
        question: '哪一句是完全否定的意思？',
        options: ['Not everyone came.', 'None of them came.', 'Not all of them came.', "He doesn't always come."],
        correctIndex: 1,
        explanation: 'None = 0个，完全否定。其他三个都是部分否定：Not everyone（不是每个人）、Not all（不是所有）、not always（不总是）。',
      },
    ],
  },

  // ==========================================
  // 五、疑问句
  // ==========================================
  {
    id: 'questions',
    title: 'Question Forms',
    titleZh: '疑问句',
    videoUrl: 'https://b23.tv/GsslX3d',
    definition: '用疑问词或助动词提问。四大类：一般疑问句（Yes/No）、特殊疑问句（Wh-）、选择疑问句（A or B）、反意疑问句（前肯后否，前否后肯）。疑问句用助动词 + 主语语序，不是主语 + 动词。',
    rules: [
      '一般疑问句：Be/Do/Have/Will + 主语 + ...？（回答 Yes/No）',
      '特殊疑问句：What/Who/When/Where/Why/How + 一般疑问句结构？',
      '选择疑问句：一般疑问句 + A or B？（不能答 Yes/No，要选一个）',
      '反意疑问句：前肯后否（You like it, don\'t you?），前否后肯（You don\'t like it, do you?）',
      '疑问词：what / who / whom / which / when / where / why / how / whose',
    ],
    examples: [
      { chinese: '你喜欢音乐吗？', english: 'Do you like music?' },
      { chinese: '她是老师吗？', english: 'Is she a teacher?' },
      { chinese: '他会来吗？', english: 'Will he come?' },
      { chinese: '你在做什么？', english: 'What are you doing?' },
      { chinese: '你住在哪里？', english: 'Where do you live?' },
      { chinese: '你为什么迟到？', english: 'Why are you late?' },
      { chinese: '你几点起床？', english: 'When do you get up?' },
      { chinese: '这是谁的笔？', english: 'Whose pen is this?' },
      { chinese: '你更喜欢哪一个？', english: 'Which one do you prefer?' },
      { chinese: '你是学生还是工人？', english: 'Are you a student or a worker?', note: '选择疑问句' },
      { chinese: '你喜欢它，对吗？', english: "You like it, don't you?", note: '前肯后否' },
      { chinese: '你不喜欢它，是吗？', english: "You don't like it, do you?", note: '前否后肯' },
      { chinese: '她不会来，对吗？', english: "She won't come, will she?" },
      { chinese: '他已经完成了，对吗？', english: "He has finished, hasn't he?" },
      { chinese: '这道题怎么做？', english: 'How do you solve this problem?' },
    ],
    traps: [
      '一般疑问句用 Yes/No 开头回答；特殊疑问句不能答 Yes/No',
      '反意疑问句前肯后否：You like it, don\'t you? 前否后肯：You don\'t like it, do you?',
      '选择疑问句不能答 Yes/No → 必须选 A 或 B',
      'How come = Why（口语），不是 How',
    ],
    quiz: [
      {
        question: '"You don\'t like coffee, ___?" 横线上填什么？',
        options: ["don't you", 'do you', "isn't it", 'will you'],
        correctIndex: 1,
        explanation: '前否后肯：主句有 don\'t（否定），反问用 do you（肯定）。',
      },
      {
        question: '"Are you a student or a teacher?" 怎么回答？',
        options: ['Yes, I am.', 'No, I am not.', "I'm a student.", "Yes, I'm a student."],
        correctIndex: 2,
        explanation: '选择疑问句不能回答 Yes/No，必须在 A 和 B 中选一个。',
      },
    ],
  },

  // ==========================================
  // 六、感叹句
  // ==========================================
  {
    id: 'exclamations',
    title: 'Exclamatory Sentences',
    titleZh: '感叹句',
    videoUrl: 'https://b23.tv/34tqv8c',
    definition: '用 What 或 How 开头表达强烈情感。What + 名词 / How + 形容词或副词。判断技巧：强调名词 → What；强调形容词/副词 → How。',
    rules: [
      'What 型：What + (a/an + adj.) + 名词 + 主谓！ → 可数单数必须有 a/an',
      'How 型：How + adj./adv. + 主谓！ → 后直接接形容词/副词，不接名词',
      'What 型名词为不可数或复数时，不加 a/an',
      'How 型后接副词时，描述的是动作方式',
    ],
    examples: [
      { chinese: '多美的花啊！', english: 'What a beautiful flower it is!', note: 'What型：强调名词flower，有a' },
      { chinese: '这花多美啊！', english: 'How beautiful the flower is!', note: 'How型：强调形容词beautiful' },
      { chinese: '多好的天气啊！', english: 'What fine weather it is!', note: 'weather不可数，不加a' },
      { chinese: '天气多好啊！', english: 'How fine the weather is!' },
      { chinese: '多聪明的孩子啊！', english: 'What clever children they are!', note: 'children复数，不加a' },
      { chinese: '这些孩子多聪明啊！', english: 'How clever the children are!' },
      { chinese: '多糟糕的一天啊！', english: 'What a terrible day it is!', note: 'day可数单数，有a' },
      { chinese: '这一天多糟糕啊！', english: 'How terrible the day is!' },
      { chinese: '他跑得多快啊！', english: 'How fast he runs!', note: 'fast是副词，用How' },
      { chinese: '多有趣的故事啊！', english: 'What an interesting story it is!', note: 'story可数单数，有an' },
      { chinese: '多漂亮的裙子啊！', english: 'What a pretty dress it is!' },
      { chinese: '这裙子多漂亮啊！', english: 'How pretty the dress is!' },
      { chinese: '多好的建议啊！', english: 'What good advice it is!', note: 'advice不可数，不加a' },
      { chinese: '她唱歌多好听啊！', english: 'How beautifully she sings!', note: 'beautifully是副词，用How' },
      { chinese: '多可惜啊！', english: 'What a pity it is!' },
    ],
    traps: [
      'What 后接名词（可数单数要 a/an），How 后接形容词/副词',
      '不可数名词和复数名词用 What 不加 a/an：What fine weather ✓  What a fine weather ❌',
      'How 不能直接接名词：How beautiful flower ❌ → What a beautiful flower ✓',
    ],
    quiz: [
      {
        question: '___ beautiful the garden is!',
        options: ['What', 'How', 'What a', 'How a'],
        correctIndex: 1,
        explanation: 'beautiful 是形容词，强调形容词用 How。如果选 What a 后要接名词 garden。',
      },
      {
        question: '"What a beautiful flower!" 和 "How beautiful the flower is!" 的区别是？',
        options: ['没有区别', 'What强调名词flower，How强调形容词beautiful', 'What用于疑问，How用于感叹', 'What是错的'],
        correctIndex: 1,
        explanation: '两者都正确，但强调对象不同：What 型强调名词（花），How 型强调形容词（美）。',
      },
    ],
  },

  // ==========================================
  // 七、过去时态
  // ==========================================
  {
    id: 'past-tense',
    title: 'Past Tenses',
    titleZh: '过去时态',
    videoUrl: 'https://b23.tv/VBWfebz',
    definition: '描述过去发生的事情。三大过去时态：一般过去时（did，过去事实/习惯）、过去进行时（was/were + doing，过去某时正在做）、过去完成时（had + done，过去的过去，先于另一过去动作）。',
    rules: [
      '一般过去时：动词过去式（did）→ 规则动词 +ed；不规则需记忆',
      '过去进行时：was/were + doing → 过去某时刻正在进行的动作',
      '过去完成时：had + done → 先于另一个过去动作发生',
      '过去完成时必须有参照点：before/after/by the time + 另一过去动作',
      '常见不规则动词：go→went, eat→ate, see→saw, buy→bought, write→wrote, come→came, take→took',
    ],
    examples: [
      { chinese: '我昨天学了英语', english: 'I studied English yesterday', note: '一般过去' },
      { chinese: '她去年去了北京', english: 'She went to Beijing last year' },
      { chinese: '他昨晚看了电影', english: 'He watched a movie last night' },
      { chinese: '他们吃了晚饭', english: 'They ate dinner' },
      { chinese: '我8点时正在学习', english: 'I was studying at 8 o\'clock', note: '过去进行' },
      { chinese: '她当时正在做饭', english: 'She was cooking at that time' },
      { chinese: '电话响了时我正在读书', english: 'I was reading when the phone rang', note: '过去进行 + 一般过去' },
      { chinese: '我在8点前已经写完了作业', english: 'I had finished my homework before 8 pm', note: '过去完成：先于8点' },
      { chinese: '他来之前我已经离开了', english: 'I had left before he arrived', note: '过去完成+一般过去' },
      { chinese: '到昨天为止她已经读了三本书', english: 'She had read three books by yesterday' },
      { chinese: '我们昨天玩得很开心', english: 'We had fun yesterday' },
      { chinese: '他买了一个新手机', english: 'He bought a new phone', note: 'buy→bought' },
      { chinese: '她写了一封信', english: 'She wrote a letter', note: 'write→wrote' },
      { chinese: '当他到达时，会议已经开始了', english: 'When he arrived, the meeting had started', note: '过去完成+一般过去' },
      { chinese: '我那时候正在跑步', english: 'I was running at that time' },
    ],
    traps: [
      '过去完成时不能独立使用：I had finished ❌ → 必须有另一个过去动作做参照',
      '不规则动词过去式混淆：go→goed ❌ → went ✓',
      'when 从句中一般过去（短动作）+ 过去进行（长动作）：I was reading when he came in',
    ],
    quiz: [
      {
        question: '"When he arrived, the meeting had started." — 哪个先发生？',
        options: ['他到达', '会议开始', '同时发生', '无法判断'],
        correctIndex: 1,
        explanation: 'had started 是过去完成时，表示在 arrived 之前就已经开始了。先有 had started，后有 arrived。',
      },
      {
        question: '"I ___ a letter yesterday." 填什么？',
        options: ['write', 'wrote', 'written', 'was writing'],
        correctIndex: 1,
        explanation: 'yesterday 提示一般过去时，write 的过去式是 wrote（不规则）。written 是过去分词，不能单独用。',
      },
    ],
  },

  // ==========================================
  // 八、进行时态
  // ==========================================
  {
    id: 'progressive',
    title: 'Progressive Tenses',
    titleZh: '进行时态',
    videoUrl: 'https://b23.tv/Q5o7Qdk',
    definition: '表示"正在做/此时此刻在做"，动词用 be + doing 形式。三大进行时：现在进行时（am/is/are + doing）、过去进行时（was/were + doing）、将来进行时（will be + doing）。🔥 状态动词不能用于进行时！',
    rules: [
      '现在进行时：am/is/are + doing → 现在正在做；也可表近期安排（I\'m leaving tomorrow）',
      '过去进行时：was/were + doing → 过去某时正在做',
      '将来进行时：will be + doing → 将来某时正在做',
      '🔥 状态动词不能用进行时：be / have / know / love / like / want / need / believe / understand / belong / own / seem',
      '进行时 + always = 抱怨：He is always losing his keys!（他总是在丢钥匙！）',
    ],
    examples: [
      { chinese: '我正在学习英语', english: 'I am studying English' },
      { chinese: '她正在看书', english: 'She is reading a book' },
      { chinese: '他们正在跑步', english: 'They are running' },
      { chinese: '你正在做什么？', english: 'What are you doing?' },
      { chinese: '我们正在吃晚饭', english: 'We are having dinner' },
      { chinese: '我昨天8点正在写作业', english: 'I was doing homework at 8 yesterday', note: '过去进行' },
      { chinese: '她当时正在打电话', english: 'She was making a call at that time' },
      { chinese: '明天5点我会在等你', english: 'I will be waiting for you at 5 pm tomorrow', note: '将来进行' },
      { chinese: '我明天就要走了', english: 'I am leaving tomorrow', note: '现在进行表将来：已安排' },
      { chinese: '天气正在变暖', english: 'The weather is getting warmer', note: '变化过程→用进行时' },
      { chinese: '他总是在丢钥匙！', english: 'He is always losing his keys!', note: '进行时+always表抱怨' },
      { chinese: '我了解他', english: 'I know him', note: '状态动词，不用进行时！❌I am knowing him' },
      { chinese: '我爱她', english: 'I love her', note: '状态动词！❌I am loving her' },
      { chinese: '我们正在讨论这个问题', english: 'We are discussing this problem' },
      { chinese: '孩子们正在外面玩耍', english: 'The children are playing outside' },
    ],
    traps: [
      '状态动词误用进行时：I am knowing ❌ → I know ✓',
      '现在进行时表将来 vs will：am leaving = 已安排的计划，will leave = 临时决定',
      'get + 形容词比较级常用进行时：getting warmer, becoming more popular',
    ],
    quiz: [
      {
        question: '哪一句是正确的？',
        options: ['I am knowing him.', 'I am loving this song.', 'I am reading a book.', 'I am wanting some water.'],
        correctIndex: 2,
        explanation: 'know/love/want 都是状态动词，不能用进行时。只有 read 是动作动词，可以用进行时。',
      },
      {
        question: '"I am leaving tomorrow." 用了什么时态？',
        options: ['现在进行时表将来', '将来时', '现在完成时', '一般现在时'],
        correctIndex: 0,
        explanation: '现在进行时 can 表示已安排好的近期计划，"我明天就要走了"。',
      },
    ],
  },

  // ==========================================
  // 九、将来时态
  // ==========================================
  {
    id: 'future',
    title: 'Future Tenses',
    titleZh: '将来时态',
    videoUrl: 'https://b23.tv/0RXxzOb',
    definition: '描述将来要发生的事情。四种表达：will + do（临时决定/预测）、be going to + do（已有计划/有迹象）、shall + do（征询建议，仅 I/we）、be + doing（已安排的个人计划）。🔥 核心区别：will = 临时，be going to = 事先。',
    rules: [
      'will + do → 临时决定 / 主观预测 / 意愿',
      'be going to + do → 已有计划 / 有迹象的预测（看到乌云→going to rain）',
      'shall + do → 征询建议（Shall we go?）',
      'be + doing → 已安排的个人计划（进行时表将来）',
      '🔥 条件句"主将从现"：If it rains, I won\'t go（从句用现在时，主句用将来时）',
    ],
    examples: [
      { chinese: '我会帮你', english: 'I will help you', note: '临时决定' },
      { chinese: '我打算出国留学', english: 'I am going to study abroad', note: '事先计划' },
      { chinese: '明天会下雨', english: 'It is going to rain', note: '看到乌云→有迹象的预测' },
      { chinese: '她明年要毕业', english: 'She will graduate next year' },
      { chinese: '电话响了，我去接', english: "The phone is ringing. I'll answer it.", note: '临时决定→用will' },
      { chinese: '我们走吧？', english: 'Shall we go?', note: '征询→用shall' },
      { chinese: '我明天要见他', english: 'I am meeting him tomorrow', note: '已安排→进行时表将来' },
      { chinese: '他不会来', english: "He won't come" },
      { chinese: '如果下雨，我就不走', english: "If it rains, I won't go", note: '条件句：主将从现' },
      { chinese: '我打算学吉他', english: 'I am going to learn guitar' },
      { chinese: '她将来会成功的', english: 'She will succeed in the future' },
      { chinese: '我们下周要去旅行', english: 'We are going to travel next week' },
      { chinese: '他们不会放弃', english: "They won't give up" },
      { chinese: '如果他努力学习，他就会通过考试', english: 'If he studies hard, he will pass the exam', note: '主将从现' },
      { chinese: '我明天要参加一个会议', english: 'I am attending a meeting tomorrow', note: '进行时表将来' },
    ],
    traps: [
      'will 和 be going to 的区别：看到乌云→It is going to rain（有迹象）vs I think it will rain（主观预测）',
      '条件句中从句不能用 will：If it will rain ❌ → If it rains ✓',
      'will not 缩写 won\'t，注意拼写',
    ],
    quiz: [
      {
        question: '"The phone is ringing." "I ___ answer it." 选哪个？',
        options: ['am going to', 'will', 'am answering', 'shall'],
        correctIndex: 1,
        explanation: '接电话是听到铃声后的临时决定，用 will。be going to 用于事先计划好的事。',
      },
      {
        question: '"If it ___ tomorrow, we ___ at home." 正确的搭配是？',
        options: ['will rain, stay', 'rains, will stay', 'will rain, will stay', 'rain, stay'],
        correctIndex: 1,
        explanation: '条件句主将从现：从句 If it rains（现在时），主句 we will stay（将来时）。',
      },
    ],
  },

  // ==========================================
  // 十、即将时态
  // ==========================================
  {
    id: 'imminent',
    title: 'Imminent Future',
    titleZh: '即将时态',
    videoUrl: 'https://b23.tv/60TF6zg',
    definition: '表示"马上就要"发生的动作，时间极近（几秒到几分钟）。三种表达：be about to + do（马上就要）、be on the point of + doing（正要做…的时刻）、be to + do（按计划/命令）。🔥 be about to 后不接时间状语！',
    rules: [
      'be about to + do → 马上就要做（极近将来），❌ 不能加 tomorrow/soon/immediately',
      'be on the point of + doing → 正要做某事的时刻（接动名词！）',
      'be to + do → 按计划/命令要做',
      '🔥 固定搭配：was/were about to + do + when... = "正要做…时突然…"',
    ],
    examples: [
      { chinese: '会议马上就要开始了', english: 'The meeting is about to begin' },
      { chinese: '飞机马上要起飞了', english: 'The plane is about to take off' },
      { chinese: '我正要离开', english: 'I am about to leave' },
      { chinese: '我正要出门时电话响了', english: 'I was about to leave when the phone rang', note: '固定搭配：was about to...when...' },
      { chinese: '她正要开口说话', english: 'She was on the point of speaking', note: 'on the point of + doing' },
      { chinese: '总统即将访问中国', english: 'The President is to visit China', note: 'be to + do：按计划' },
      { chinese: '暴风雨马上就要来了', english: 'The storm is about to arrive' },
      { chinese: '我正要给你打电话', english: 'I was about to call you' },
      { chinese: '他正要辞职时得到了升职', english: 'He was about to quit when he got promoted' },
      { chinese: '项目即将完成', english: 'The project is about to be completed' },
      { chinese: '我们正要出发', english: 'We are on the point of setting off', note: 'on the point of + doing' },
      { chinese: '考试马上就要开始了', english: 'The exam is about to start' },
      { chinese: '我刚要关门时风吹开了', english: 'I was about to close the door when the wind blew it open' },
      { chinese: '结果马上就要出来了', english: 'The result is about to come out' },
      { chinese: '新法规即将实施', english: 'The new law is to be implemented', note: 'be to：按计划/命令' },
    ],
    traps: [
      'be about to 后不能加时间状语：The meeting is about to begin soon ❌（about to 本身就含"马上"）',
      'on the point of 后接 doing（动名词），不是 to do',
      'was about to...when... 是固定句型，"when" 不能换成 while',
    ],
    quiz: [
      {
        question: '"I was about to ___ when the phone rang." 横线上应该用什么？',
        options: ['leave', 'leaving', 'left', 'to leaving'],
        correctIndex: 0,
        explanation: 'be about to + 动词原形（do），这是固定结构。was about to leave = 正要离开。',
      },
      {
        question: '哪句是错的？',
        options: ['The meeting is about to begin.', 'She was about to call you.', 'I am about to leave tomorrow.', 'He was on the point of leaving.'],
        correctIndex: 2,
        explanation: 'be about to 不能加时间状语 tomorrow。如果要表达"明天要离开"用 I am leaving tomorrow 或 I will leave tomorrow。',
      },
    ],
  },
];
