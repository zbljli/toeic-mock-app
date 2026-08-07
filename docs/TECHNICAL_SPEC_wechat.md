# TOEIC Coach 微信小程序 -- 技术实施方案

> 版本: v1.0  
> 日期: 2026-08-04  
> 目标用户: 1 万  
> 后端: 微信云开发 (Cloud Base), 零运维  

---

## 目录

1. [项目结构](#1-项目结构)
2. [云开发配置](#2-云开发配置)
3. [核心数据流](#3-核心数据流)
4. [技能复用](#4-技能复用)
5. [组件树 & 路由](#5-组件树--路由)
6. [开发环境 & 工具链](#6-开发环境--工具链)
7. [实施顺序](#7-实施顺序)

---

## 1. 项目结构

```
toeic-coach-miniprogram/
├── miniprogram/
│   ├── app.json                     # 全局配置: pages 注册, window, tabBar, 云开发目录
│   ├── app.js                       # 小程序入口: 云开发初始化, 全局数据, 静默登录
│   ├── app.wxss                     # 全局样式变量, Vant 主题覆盖
│   │
│   ├── pages/
│   │   ├── index/                   # 欢迎页 / 启动页
│   │   │   ├── index.js             #   静默登录, 判断是否首次使用 → 跳转 onboarding 或 home
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── onboarding/              # 新用户引导流程 (4 步)
│   │   │   ├── goal/                #   第1步: 设定目标分数 (current + target)
│   │   │   ├── diagnostic/          #   第2步: 诊断测试 (1 套 20 题快速测评)
│   │   │   └── report/              #   第3步: 诊断报告 (能力画像 + 学习建议)
│   │   │
│   │   ├── home/                    # Coach Home (Tab 首页)
│   │   │   ├── index.js             #   今日任务卡片, 进度概览, 快捷入口
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── exam/                    # 模考 / 练习
│   │   │   ├── index.js             #   考试模式选择 (全真模考 / Part 练习)
│   │   │   ├── index.wxml
│   │   │   ├── do.js                #   答题页面 (核心: 播放器 + 选项交互 + 计时)
│   │   │   ├── do.wxml
│   │   │   └── do.wxss
│   │   │
│   │   ├── result/                  # 考试成绩页
│   │   │   ├── index.js             #   分数展示, Part 正确率, 等级评价, 错题入口
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── review/                  # 答题回顾
│   │   │   ├── index.js             #   逐题查看: 题干, 你的选项, 正确答案, transcript
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── profile/                 # 我的 (Tab 页)
│   │   │   ├── index.js             #   用户信息, 学习统计, 历史成绩, 成长日记, 设置
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── vocab/                   # 词汇学习
│   │   │   ├── index.js             #   词汇列表 (按字母 / 场景分组), 搜索
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   │
│   │   ├── grammar/                 # 语法学习 (10 大语法点)
│   │   │   ├── index.js             #   语法点列表
│   │   │   ├── index.wxml
│   │   │   ├── detail.js            #   单语法点详情: 规则 + 例句 + 测验
│   │   │   ├── detail.wxml
│   │   │   └── detail.wxss
│   │   │
│   │   └── scenarios/               # 场景学习 (文章 / 对话阅读)
│   │       ├── index.js             #   场景列表 (20+ 场景)
│   │       ├── index.wxml
│   │       ├── article.js           #   文章阅读 (含高亮词汇)
│   │       ├── article.wxml
│   │       ├── article.wxss
│   │       ├── podcast.js           #   播客音频播放页
│   │       ├── podcast.wxml
│   │       └── podcast.wxss
│   │
│   ├── components/                  # 全局复用组件
│   │   ├── audio-player/            #   音频播放器 (innerAudioContext 封装)
│   │   │   ├── index.js
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   ├── option-card/             #   选项按钮 (四选一, 含选中/正确/错误态)
│   │   ├── progress-bar/            #   进度条 / 分数环形图
│   │   ├── part-indicator/          #   Part 标签 (Part 1-4 徽章，仅听力)
│   │   ├── vocab-card/              #   词汇卡片 (正面英文 + 背面中文)
│   │   ├── timer-bar/               #   倒计时进度条 (考试用)
│   │   ├── empty-state/             #   空状态占位图
│   │   └── loading-skeleton/        #   骨架屏加载
│   │
│   ├── utils/                       # 工具函数
│   │   ├── scoring.js               #   [复用] 评分换算: rawToScaled, getScoreLevel
│   │   ├── question-gen.js          #   [复用] 题目生成: generateQuestions
│   │   ├── audio.js                 #   音频管理: TTS 播放, 段落播放控制
│   │   ├── cache.js                 #   本地缓存封装: wx.getStorageSync 读写
│   │   ├── sync.js                  #   数据同步: 本地缓存 ↔ Cloud DB
│   │   ├── network.js               #   网络状态检测: wx.onNetworkStatusChange
│   │   ├── time.js                  #   计时工具: 考试倒计时, 答题耗时记录
│   │   └── consts.js                #   常量: TOEIC 结构, Part 信息, 颜色映射
│   │
│   ├── cloud/                       # 云函数根目录 (小程序端引用 cloud.init 自动识别)
│   │   └── functions/
│   │       ├── login/               #   静默登录: wx.login → openid → upsert users
│   │       │   ├── index.js
│   │       │   └── package.json
│   │       ├── getUserProfile/      #   获取用户完整数据 (Coach State)
│   │       │   ├── index.js
│   │       │   └── package.json
│   │       ├── syncExamResult/      #   提交考试结果 + 更新错题本 + 更新学习记录
│   │       │   ├── index.js
│   │       │   └── package.json
│   │       └── exportUserData/      #   导出用户全部数据 (JSON)
│   │           ├── index.js
│   │           └── package.json
│   │
│   └── static/                      # 静态资源 (构建时打包进小程序包)
│       ├── images/                  #   图标, 占位图, 引导页插画
│       └── icons/                   #   Tab 图标
│
├── cloudfunctions/                  # (备选) 如果云函数目录不在 miniprogram 内
├── project.config.json              # 微信开发者工具项目配置
├── package.json                     # npm 依赖 (vant-weapp 等)
└── README.md
```

### 各目录 / 文件职责说明

| 路径 | 职责 |
|------|------|
| `app.json` | 注册所有页面路径, 配置 Tab Bar (home + profile), 指定 `"cloud": true` 开启云开发, 声明 `usingComponents` 全局组件 |
| `app.js` | `App.onLaunch` 中初始化云开发 SDK (`wx.cloud.init`), 调用 login 云函数获取 openid, 将用户信息写入 globalData, 判断是否完成 onboarding |
| `app.wxss` | 全局 CSS 变量 (主题色, 字号, 间距), Vant Weapp CSS 变量覆盖 |
| `pages/index/` | **启动页**: 检查本地缓存 `onboardingCompleted` + 云端用户记录, 已完成 → 跳 home, 未完成 → 跳 onboarding/goal |
| `pages/onboarding/` | **新用户引导**: 3 个子页面, 依次为目标设定 → 诊断测试 (20 题快速测试) → 诊断报告 (能力雷达图 + 推荐学习路径) |
| `pages/home/` | **Coach Home**: 从 Cloud DB 拉取今日任务列表, 展示进度环形图, 快捷进入模考 / 词汇 / 语法 / 场景学习 |
| `pages/exam/` | **考试模块**: `index.js` 展示考试模式卡片 (全真模考 / Part 1-4 练习), `do.js` 是核心答题引擎: 音频播放 + 选项交互 + 倒计时 + 自动提交 |
| `pages/result/` | **成绩页**: 总分数 + 等级评价 + 各 Part 正确率柱状图 + "查看错题" 按钮 |
| `pages/review/` | **错题回顾**: 逐题展示, 正确 / 错误高亮, transcript 原文, 支持 "加入错题本" |
| `pages/profile/` | **个人中心**: 用户头像昵称, 学习天数, 累计做题数, 词汇量, 历史成绩折线图, 成长日记列表, 设置 (清除缓存, 导出数据) |
| `pages/vocab/` | **词汇**: 按字母 A-Z 分组展示, 搜索, 标记已掌握 / 未掌握, 同步 vocab_states |
| `pages/grammar/` | **语法**: 10 大语法点列表 → 详情页 (规则 + 中译英例句 + 小测验) |
| `pages/scenarios/` | **场景学习**: 20+ 场景 → 文章 / 对话阅读 → 高亮场景词汇, 支持播客音频播放 |
| `components/` | 全局组件, 被多个页面引用, 每个组件包含 `.js .wxml .wxss .json` 四件套 |
| `utils/` | 纯函数工具集, 从原 Expo 项目翻译而来, 不依赖任何小程序特有 API |
| `cloud/functions/` | 云函数代码, 每个函数独立目录, 需在 project.config.json 中注册 |
| `static/` | 编译时打包进小程序的静态文件, 受 2MB 主包限制, 大图应放 Cloud Storage |

---

## 2. 云开发配置

### 2.1 Cloud DB 集合设计

#### 2.1.1 `users` -- 用户基本信息

```javascript
{
  _id: "openid_xxxxxxxx",           // 主键 = 微信 openid
  _openid: "openid_xxxxxxxx",       // 自动字段, 用于权限控制
  createdAt: "2026-08-04T10:00:00Z",
  updatedAt: "2026-08-04T10:00:00Z",

  // 个人资料
  nickName: "微信用户",
  avatarUrl: "https://thirdwx.qlogo.cn/...",
  gender: 0,                        // 0=未知, 1=男, 2=女

  // Onboarding 状态
  onboardingStage: "completed",     // welcome | goal_setting | diagnostic_test | diagnosis_report | completed
  goal: {
    currentListeningScore: 250,
    targetListeningScore: 450,
    scoreGap: 200,
    setAt: "2026-08-04T10:00:00Z"
  },

  // 能力画像
  abilityProfile: {
    part1Accuracy: 0.45,
    part2Accuracy: 0.38,
    part3Accuracy: 0.52,
    part4Accuracy: 0.30,
    overallAccuracy: 0.41,
    weakestPart: 4,
    weakestAccuracy: 0.30,
    strengthPart: 3,
    strengthAccuracy: 0.52
  },

  // 统计数据 (每次考试后由云函数更新, 避免前端全量计算)
  stats: {
    totalExams: 5,                  // 累计考试次数
    totalQuestions: 480,            // 累计做题数
    totalCorrect: 287,              // 累计正确数
    highestScore: 420,              // 历史最高分
    latestScore: 395,               // 最近分数
    totalStudyDays: 12,            // 累计学习天数
    streakDays: 3,                  // 连续学习天数
    lastStudyDate: "2026-08-04",    // 最后学习日期
    vocabularyMastered: 156         // 已掌握词汇数
  },

  // 当前学习计划
  currentPlan: {
    stage: "breakthrough",          // foundation | breakthrough | consolidation
    targetPart: 4,
    recommendationId: "rec_20260804",
    planStartDate: "2026-08-01"
  }
}
```

**权限**: 仅创建者可读写 (`PERMISSION: "doc"`)

#### 2.1.2 `assessments` -- 诊断 / 评估记录

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T10:30:00Z",
  updatedAt: "2026-08-04T10:30:00Z",

  type: "diagnostic",               // diagnostic | mock_test | part_practice
  date: "2026-08-04",

  totalScore: 312,
  listeningScore: 312,              // 当前仅 Listening, Reading 暂为 0
  readingScore: 0,

  partScores: {
    "1": { correct: 4, total: 6, accuracy: 0.67, errorTypes: ["vocabulary_gap"] },
    "2": { correct: 12, total: 25, accuracy: 0.48, errorTypes: ["key_info_missed", "distractor_confused"] },
    "3": { correct: 18, total: 39, accuracy: 0.46, errorTypes: ["inference_error"] },
    "4": { correct: 9, total: 30, accuracy: 0.30, errorTypes: ["context_missed", "speaker_confusion"] }
  },

  answers: [                        // 仅存答题摘要, 不存全部答案 (节省空间)
    { questionId: "p1-1", selectedOptionId: "D", correctOptionId: "D", timeSpent: 12 },
    // ...
  ],

  timeSpent: 2700,                  // 总耗时 (秒)
  completedAt: "2026-08-04T10:57:00Z",

  // 诊断额外字段
  abilityProfile: { /* 同 users.abilityProfile */ },
  recommendation: {
    targetPart: 4,
    reason: "Part 4 正确率仅 30%, 是需要突破的瓶颈",
    stage: "breakthrough",
    estimatedDays: 30
  }
}
```

**权限**: 仅创建者可读写

#### 2.1.3 `training_records` -- 训练记录 (每次练习一条)

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T11:00:00Z",

  type: "part_training",            // mock_test | part_training | scene_listening | mistake_review | vocab_study
  date: "2026-08-04",

  part: 4,                          // 仅 type=part_training 时有值
  sceneId: null,                    // 仅 type=scene_listening 时有值

  questionCount: 30,
  correctCount: 18,
  accuracy: 0.60,
  durationMinutes: 22,

  associatedResultId: "result_id"   // 关联 assessments _id
}
```

**权限**: 仅创建者可读写

#### 2.1.4 `vocab_states` -- 用户词汇掌握状态

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T10:00:00Z",
  updatedAt: "2026-08-04T12:30:00Z",

  wordId: "w_0001",                 // 词汇全局 ID, 对应词汇表中的唯一标识
  word: "aberration",
  meaningZh: "偏差, 反常",
  letter: "A",
  sceneIds: ["s_office", "s_mgmt"], // 所属场景

  state: "learning",                // new | learning | review | mastered
  familiarity: 2,                   // 0-5 熟悉度
  lastReviewedAt: "2026-08-04T12:30:00Z",
  reviewCount: 3,
  correctCount: 2
}
```

**权限**: 仅创建者可读写

#### 2.1.5 `mistake_bank` -- 错题本

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T10:57:00Z",
  updatedAt: "2026-08-04T12:00:00Z",

  questionId: "p4-3",               // 题目 ID
  part: 4,
  userAnswer: "B",
  correctAnswer: "C",
  errorType: "context_missed",      // vocabulary_gap | key_info_missed | distractor_confused | inference_error | speaker_confusion | context_missed
  question: {                       // 快照原始题目 (避免跨表查询)
    prompt: "Where is the announcement taking place?",
    options: [
      { id: "A", text: "At an airport" },
      { id: "B", text: "At a train station" },
      { id: "C", text: "At a bus terminal" },
      { id: "D", text: "At a ferry port" }
    ],
    correctOptionId: "C",
    transcript: "Attention passengers. Flight 847 to Chicago...",
    audioScript: { /* 略 */ }
  },

  sourceExamId: "assessments_id",   // 来源考试
  wrongCount: 1,                    // 错过次数 (重复加入则 +1)
  isResolved: false,                // 是否已纠正 (连续 2 次答对)
  resolvedAt: null,
  notes: ""                         // 用户笔记
}
```

**权限**: 仅创建者可读写

#### 2.1.6 `exam_history` -- 考试历史 (轻量索引表)

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T10:57:00Z",

  type: "mock_test",                // mock_test | part_practice | diagnostic
  date: "2026-08-04",
  listeningScore: 312,
  totalScore: 312,
  accuracy: 0.43,
  questionCount: 100,
  correctCount: 43,
  durationMinutes: 45,
  detailsId: "assessments_id"       // 关联 assessments 集合的 _id
}
```

**权限**: 仅创建者可读写

#### 2.1.7 `daily_tasks` -- 每日学习任务

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T00:00:00Z",

  date: "2026-08-04",
  tasks: [
    {
      id: "task_001",
      type: "mock_test",            // mock_test | part_training | scene_listening | mistake_review | vocab_study
      part: null,
      sceneId: null,
      questionCount: 20,
      durationMinutes: 15,
      priority: "high",             // high | medium | low
      label: "完成一套限时模考",
      icon: "exam",
      isCompleted: false,
      completedAt: null
    },
    {
      id: "task_002",
      type: "part_training",
      part: 4,
      questionCount: 15,
      durationMinutes: 12,
      priority: "high",
      label: "Part 4 Talks 专项训练",
      icon: "training",
      isCompleted: false,
      completedAt: null
    },
    {
      id: "task_003",
      type: "vocab_study",
      questionCount: 20,
      durationMinutes: 10,
      priority: "medium",
      label: "复习 20 个商务词汇",
      icon: "vocab",
      isCompleted: false,
      completedAt: null
    }
  ],
  isAllCompleted: false,
  totalDurationMinutes: 37,
  generatedBy: "diagnosis_engine"   // diagnosis_engine | manual
}
```

**权限**: 仅创建者可读写

#### 2.1.8 `vocab_library` (静态数据, 只读) -- 全局词汇库

```javascript
{
  _id: "w_0001",
  word: "aberration",
  meaningZh: "偏差, 反常",
  letter: "A",
  sceneIds: ["s_office"],
  toeicParts: [2, 3, 4],
  exampleSentence: "The sudden drop in sales was an aberration, not a trend.",
  exampleZh: "销量的突然下降是反常现象, 并非趋势。",
  audioUrl: "cloud://xxx.xxx/audio/vocab/w_0001.mp3"
}
```

**权限**: 所有人可读, 仅管理员可写 (`PERMISSION: "read"`)

#### 2.1.9 `scenes` (静态数据, 只读) -- 场景信息

```javascript
{
  _id: "s_office",
  name: "Office",
  nameZh: "办公室场景",
  icon: "🏢",
  description: "Core office vocabulary: daily tasks, stationery, equipment",
  wordCount: 241,
  articleCount: 8,
  podcastCount: 2,
  toeicParts: [2, 3, 4, 5, 6, 7],
  coverImageUrl: "cloud://xxx.xxx/images/scenes/office.jpg"
}
```

**权限**: 所有人可读, 仅管理员可写

#### 2.1.10 `articles` (静态数据, 只读) -- 场景文章 / 对话

```javascript
{
  _id: "art_meeting_001",
  sceneId: "s_meeting",
  scene: "Business Meetings",
  sceneZh: "商务会议",
  title: "Quarterly Strategy Review at Meridian Corp",
  type: "article",                  // article | dialogue
  durationEstMin: 5,
  wordCount: 368,
  passage: "Meridian Corporation held its quarterly...",
  highlightedWords: ["w_0003", "w_0036", "w_0039"],  // 文中出现的词汇 ID
  audioUrl: "cloud://xxx.xxx/audio/scenarios/art_meeting_001.mp3"
}
```

**权限**: 所有人可读, 仅管理员可写

#### 2.1.11 `grammar_points` (静态数据, 只读) -- 语法知识点

```javascript
{
  _id: "svo",
  title: "Subject + Verb + Object",
  titleZh: "主谓宾",
  videoUrl: "https://b23.tv/j67XxE6",
  definition: "主语 + 动作(动词) + 宾语",
  rules: ["三单变形: he/she/it → 动词 +s/es", "..."],
  examples: [
    { chinese: "我爱你", english: "I love you", note: null },
    // ...
  ],
  traps: ["三单忘记 +s: He love you → He loves you", "..."],
  quiz: [
    {
      question: "'He ___ to help you.' 横线上填什么?",
      options: ["want", "wants", "wanting", "to want"],
      correctIndex: 1,
      explanation: "He 是三单主语, 谓语动词需要加 s → wants"
    }
    // ...
  ]
}
```

**权限**: 所有人可读, 仅管理员可写

#### 2.1.12 `growth_diary` -- 成长日记

```javascript
{
  _id: "auto_generated_id",
  _openid: "openid_xxxxxxxx",
  createdAt: "2026-08-04T22:00:00Z",

  dayNumber: 12,
  date: "2026-08-04",
  content: "今天做了一套全真模考, Part 4 还是有点吃力...",
  challenges: "Part 4 长文题目来不及预读选项",
  tomorrowPlan: "明天重点练习 Part 4 的 10 道题, 并复习错题本",
  completedTaskIds: ["task_001", "task_002", "task_003"],
  scoreSnapshot: 395,
  vocabularyCount: 156,
  mood: "good"                      // great | good | okay | tired
}
```

**权限**: 仅创建者可读写

---

### 2.2 数据库权限设置

在微信云开发控制台 → 数据库 → 集合权限管理 中设置:

| 集合 | 权限规则 | 说明 |
|------|---------|------|
| `users` | 仅创建者可读写 | 用户只能操作自己的数据 |
| `assessments` | 仅创建者可读写 | 考试成绩私密 |
| `training_records` | 仅创建者可读写 | 学习记录私密 |
| `vocab_states` | 仅创建者可读写 | 个人词汇掌握状态 |
| `mistake_bank` | 仅创建者可读写 | 个人错题本 |
| `exam_history` | 仅创建者可读写 | 个人考试历史 |
| `daily_tasks` | 仅创建者可读写 | 个人每日任务 |
| `growth_diary` | 仅创建者可读写 | 个人日记 |
| `vocab_library` | 所有人可读, 仅管理员可写 | 公共词汇库 |
| `scenes` | 所有人可读, 仅管理员可写 | 公共场景数据 |
| `articles` | 所有人可读, 仅管理员可写 | 公共文章 / 对话 |
| `grammar_points` | 所有人可读, 仅管理员可写 | 公共语法库 |

### 2.3 Cloud Storage 目录规划

```
cloud://toeic-coach-prod.xxx/
│
├── audio/
│   ├── vocab/                     # 词汇发音 (按 wordId 组织)
│   │   ├── w_0001.mp3
│   │   ├── w_0002.mp3
│   │   └── ...
│   ├── scenarios/                 # 场景文章 / 对话音频
│   │   ├── art_meeting_001.mp3
│   │   ├── art_office_101.mp3
│   │   └── ...
│   ├── exam/                      # 模考题目音频 (按 part 组织)
│   │   ├── part1/
│   │   │   ├── p1-1.mp3
│   │   │   └── ...
│   │   ├── part2/
│   │   ├── part3/
│   │   └── part4/
│   └── tts/                       # TTS 生成的音频 (用户请求合成后缓存)
│       └── ...
│
├── images/
│   ├── scenes/                    # 场景封面图
│   ├── exam/                      # 模考配图 (Part 1 图片题)
│   ├── onboarding/                # 引导页插画
│   └── icons/                     # 功能图标
│
└── exports/                       # 用户数据导出 (临时文件, 24h 后删除)
    └── openid_xxx/
        └── export_20260804.json
```

### 2.4 云函数设计

#### 2.4.1 `login` -- 静默登录

```
触发: 小程序端 app.js onLaunch
输入: wx.cloud.getWXContext().OPENID (云函数自动注入)
逻辑:
  1. 获取当前用户的 openid
  2. 查询 users 集合是否存在该 openid 记录
  3. 存在 → 返回 { user, isNew: false }
  4. 不存在 → 创建 users 记录 (初始化 onboardingStage = 'welcome') → 返回 { user, isNew: true }
  5. 同时返回 staticDataVersion (用于前端判断静态数据是否需要更新)
输出: { code: 0, data: { user, isNew, staticDataVersion } }
```

#### 2.4.2 `getUserProfile` -- 获取用户完整数据

```
触发: home 页 onShow 或下拉刷新时
输入: {}
逻辑:
  1. 获取 openid
  2. 从 users 集合获取用户文档
  3. 从 daily_tasks 获取今日任务 (date = 当天)
  4. 从 assessments 获取最近一次诊断结果
  5. 组装返回 CoachState
输出: { code: 0, data: { user, dailyTasks, latestAssessment } }
```

#### 2.4.3 `syncExamResult` -- 提交考试结果

```
触发: exam/do.js 完成考试后
输入:
  {
    type: "mock_test",          // mock_test | part_practice | diagnostic
    part: null,                 // part_practice 时必填
    answers: [...],             // 用户作答
    timeSpent: 2700,            // 总耗时
    questions: [...]            // 题目快照 (用于评分)
  }
逻辑:
  1. 服务端评分 (确保不可篡改)
     - 对比每个 answer.selectedOptionId 与 question.correctOptionId
     - 计算每个 Part 正确率
     - 调用 scoring.js 的 rawToScaled 算法转换分数
  2. 写入 assessments 集合 (考试详情)
  3. 写入 exam_history 集合 (轻量索引)
  4. 更新 users.stats (累计数据)
  5. 更新 users.abilityProfile (如果分数变动)
  6. 将错题写入 mistake_bank (updateOne upsert, wrongCount +1)
  7. 写入 training_records
  8. 更新 daily_tasks 中对应任务的完成状态
  9. 如果是 diagnostic 类型, 计算 abilityProfile 并写入 users
输出: { code: 0, data: { result, assessmentId } }
```

**为什么评分放在云函数?** 防止前端篡改比分数, 确保数据公正性。题目快照随请求一起上传, 服务端以此为准。

#### 2.4.4 `exportUserData` -- 导出用户所有数据

```
触发: profile 页 "导出学习数据"
输入: {}
逻辑:
  1. 获取 openid
  2. 查询 users, assessments, training_records, vocab_states, mistake_bank, exam_history, growth_diary
  3. 组装 JSON
  4. 写入 Cloud Storage: exports/{openid}/export_{date}.json
  5. 返回临时下载链接 (有效期 1h)
输出: { code: 0, data: { downloadUrl, expiresAt } }
```

---

## 3. 核心数据流

### 3.1 静默登录流程

```
┌──────────┐     wx.login()      ┌──────────────┐     code      ┌──────────────┐
│  小程序端  │ ──────────────────> │  微信开放接口  │ ────────────> │  微信服务端    │
│  app.js  │ <────────────────── │              │ <──────────── │              │
└──────────┘     return code     └──────────────┘   openid      └──────────────┘
     │
     │ wx.cloud.callFunction({ name: 'login' })
     ▼
┌──────────────┐
│   云函数 login │
│              │
│ 1. getWXContext().OPENID
│ 2. db.collection('users')
│      .where({ _id: openid })
│      .get()
│ 3. 存在 → 返回 user
│    不存在 → 创建 user (onboardingStage='welcome')
│ 4. 返回 { isNew, user }
└──────────────┘
     │
     ▼
┌──────────────┐
│  小程序端      │
│              │
│ isNew === true ?
│   YES → wx.redirectTo('/pages/onboarding/goal/goal')
│   NO  → wx.switchTab('/pages/home/home')
└──────────────┘
```

关键点:
- openid 不做为前端可读变量, 始终由云函数通过 `getWXContext().OPENID` 获取
- 用户 document `_id` 直接使用 openid, 避免多余索引
- `isNew` 判断只依赖 Cloud DB 中是否存在记录, 不依赖本地 Storage (防止卸载重装丢失状态)

### 3.2 答题数据流

```
┌──────────────────────────────────────────────────────────────────────────┐
│  答题页面 (exam/do.js)                                                     │
│                                                                          │
│  1. 选择模式 → 调用 util/question-gen.js 生成题目 (本地生成, 不上云)          │
│                                                                          │
│  2. 逐题作答:                                                             │
│     ┌─────────────────────────────────────────┐                          │
│     │  每道题:                                 │                          │
│     │  - 播放音频 (innerAudioContext)            │                          │
│     │  - 用户点击选项 → 记录到 answers[]          │                          │
│     │    { questionId, selectedOptionId,        │                          │
│     │      timeSpent: now - questionStartTime } │                          │
│     │  - 更新 currentQuestionIndex              │                          │
│     │  - 暂存到本地 Storage (每 5 题存一次)        │                          │
│     └─────────────────────────────────────────┘                          │
│                                                                          │
│  3. 提交考试:                                                             │
│     ┌─────────────────────────────────────────┐                          │
│     │  有网络:                                  │                          │
│     │    wx.cloud.callFunction({               │                          │
│     │      name: 'syncExamResult',             │                          │
│     │      data: { type, answers, questions,   │                          │
│     │              timeSpent }                 │                          │
│     │    })                                    │                          │
│     │      → 云函数评分 + 写入 Cloud DB          │                          │
│     │      → 本地 Storage 标记已同步             │                          │
│     │                                          │                          │
│     │  无网络:                                  │                          │
│     │    → 完整结果存入本地 Storage               │                          │
│     │    → 监听网络恢复 → 自动重试               │                          │
│     └─────────────────────────────────────────┘                          │
│                                                                          │
│  4. 跳转 result 页, 传入 assessmentId (云函数返回) 或 本地计算结果            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 数据同步策略

采用 **本地优先 (Local-First) + 云端为真实数据源 (Cloud as Source of Truth)** 的混合策略:

```
┌──────────────────────────────────────────────────┐
│                  同步分层架构                       │
├──────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: UI 层 (Page/Component)                 │
│    - 直接从本地 Storage 读取 (零延迟渲染)            │
│    - setData 绑定到 WXML                          │
│                                                  │
│  Layer 2: 本地缓存层 (wx.Storage)                  │
│    ├── cache_users          用户信息              │
│    ├── cache_vocabStates    词汇掌握状态           │
│    ├── cache_todayTasks     今日任务              │
│    ├── cache_examHistory    最近 10 次考试         │
│    ├── cache_scenes         场景列表 (静态)        │
│    ├── cache_grammar        语法点 (静态)          │
│    └── pending_sync[]       待同步操作队列         │
│                                                  │
│  Layer 3: Cloud DB (微信云开发)                    │
│    - 真实数据源                                    │
│    - 云函数做数据聚合 / 评分                        │
│    - 变更 >100ms 后更新本地缓存                     │
│                                                  │
└──────────────────────────────────────────────────┘

同步时机:
  1. 页面 onShow 时: 检查缓存 TTL (静态数据 24h, 动态数据 5min)
     - TTL 过期 → 从 Cloud DB 拉取 → 写入 Storage
     - TTL 未过期 → 直接用 Storage
  2. 下拉刷新: 强制从 Cloud DB 拉取全量数据
  3. 后台切前台: wx.onAppShow 触发增量同步
  4. 用户主动操作 (提交考试、标记词汇): 先更新本地 → 异步写 Cloud DB
```

**同步队列 (pending_sync) 机制**:

```javascript
// utils/sync.js 伪代码
class SyncQueue {
  constructor() {
    this.queue = wx.getStorageSync('pending_sync') || [];
  }

  async enqueue(operation) {
    this.queue.push({ ...operation, timestamp: Date.now(), retries: 0 });
    this._save();
    await this._tryFlush();
  }

  async _tryFlush() {
    while (this.queue.length > 0) {
      const op = this.queue[0];
      try {
        await this._executeOp(op);
        this.queue.shift();  // 成功 → 出队
        this._save();
      } catch (e) {
        if (op.retries >= 3) {
          console.error('Sync failed after 3 retries:', op);
          this.queue.shift();  // 超过重试次数 → 放弃并入日志
        } else {
          op.retries++;
          break;  // 失败 → 等待下次触发
        }
      }
    }
  }

  _executeOp(op) {
    switch (op.type) {
      case 'SYNC_EXAM':
        return wx.cloud.callFunction({ name: 'syncExamResult', data: op.payload });
      case 'MARK_VOCAB':
        return db.collection('vocab_states').update({ data: op.payload });
      // ... 其他操作
    }
  }
}
```

### 3.4 离线策略

```
┌──────────────────────────────────────────────────────┐
│  离线场景处理                                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  断网检测:                                            │
│    - wx.onNetworkStatusChange 监听网络变化             │
│    - 断网时:                                          │
│      ✓ 仍可浏览已缓存的词汇、语法、文章 (静态数据)        │
│      ✓ 仍可做题 (题目在本地生成)                       │
│      ✓ 答题结果暂存 Storage, 网络恢复后自动同步          │
│      ✗ 不能提交考试结果 (pending_sync)                 │
│      ✗ 不能加载新数据                                  │
│                                                      │
│  网络恢复时:                                          │
│    - 触发 SyncQueue._tryFlush()                      │
│    - Toast 提示 "数据同步完成"                         │
│                                                      │
│  界面表现:                                            │
│    - 断网时顶部显示黄色 Bar "当前无网络, 部分功能不可用"   │
│    - 需要网络的操作 (提交考试) → 按钮置灰 + 提示         │
│    - 本地已有数据正常渲染, 不阻塞                        │
│                                                      │
│  静态数据预加载:                                       │
│    - 词汇库 (~1300 词, ~50KB JSON)                    │
│    - 语法点 (10 个, ~20KB JSON)                       │
│    - 场景列表 (20 个, ~5KB JSON)                      │
│    - 首次启动时从 Cloud DB 一次性拉取 → Storage 缓存     │
│    - 后续用版本号做增量更新 (staticDataVersion)          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 4. 技能复用

### 4.1 可直接翻译的纯逻辑 (TypeScript → JavaScript)

以下原 Expo 项目中的纯函数逻辑, 不依赖任何 React Native / Expo API, 可直接复制到小程序的 `utils/` 目录中, 仅需去除 TypeScript 类型注解:

| 源文件 | 目标文件 | 复用函数 | 说明 |
|--------|---------|----------|------|
| `src/utils/scoring.ts` | `utils/scoring.js` | `calculateScore()`, `rawToScaled()`, `getScoreLevel()` | **评分换算核心算法**: Listening 原始分 → 转换分对照表 (16 个节点线性插值), 等级判定逻辑, 完全可复用 |
| `src/data/questions.ts` | `utils/question-gen.js` | `generateQuestions()`, `generatePart1()`, `generatePart2()`, `generatePart3()`, `generatePart4()` | **题目生成引擎**: 按 TOEIC 标准比例分配各 Part 题目数量, 模板池循环取题, Part 1-4 的题目结构定义 |
| `src/data/toeicStructure.ts` | `utils/consts.js` | `TOEIC_PARTS`, `LISTENING_TEST_CONFIG`, `getPartPracticeConfigs()` | **考试结构常量**: 7 个 Part 的定义, 听力模拟考配置, Part 练习模式配置 |
| `src/data/vocabulary.ts` | `utils/vocab-data.js` | `VOCAB_GROUPS` (JSON 数组) | **词汇数据**: ~1300 词按字母分组, 可直接导出为 JSON 上传 Cloud DB |
| `src/data/grammar.ts` | `utils/grammar-data.js` | `GRAMMAR_POINTS` (JSON 数组) | **语法数据**: 10 大语法点含规则、例句、测验, 可直接导出为 JSON 上传 Cloud DB |
| `src/data/scenes.json` | `utils/scene-data.js` | 场景 JSON 数组 | **场景数据**: 20 个场景含词汇映射, 可直接上传 Cloud DB |
| `src/types/coach.ts` | (JSON Schema 参考) | `UserGoal`, `AssessmentResult`, `AbilityProfile`, `LearningRecommendation`, `TrainingTask`, `DailyTasks`, `MistakeEntry`, `TrainingRecord` 等 | **数据模型定义**: TypeScript interface 翻译为 Cloud DB 文档的 JSON Schema (见第 2.1 节) |

### 4.2 需适配的逻辑

| 原 Expo 实现 | 小程序适配方案 |
|-------------|--------------|
| `expo-av` Audio.Sound 播放音频 | `wx.createInnerAudioContext()` 创建音频上下文, 封装为 `components/audio-player/` 组件 |
| `@react-native-async-storage/async-storage` 本地持久化 | `wx.setStorageSync()` / `wx.getStorageSync()` (单个 key 上限 1MB, 总上限 10MB) |
| React Navigation (Stack + Tab) | 微信小程序原生导航: `app.json` 中 `tabBar` + `pages` 注册, `wx.navigateTo` / `wx.switchTab` / `wx.redirectTo` |
| React Context (全局状态管理) | `App.globalData` + `wx.setStorageSync` 实现简易全局状态 |
| REST API 调用后端 | `wx.cloud.callFunction()` 调用云函数 |
| TypeScript 类型系统 | 去除类型注解, 转为纯 JavaScript; 在 JSDoc 注释中保留类型信息 |

### 4.3 现有 JSON 数据迁移路径

```
┌───────────────────────┐      ┌─────────────────────────┐
│ 现有数据源              │      │  迁移目标                  │
├───────────────────────┤      ├─────────────────────────┤
│                       │      │                         │
│ vocabulary.ts         │───→  │ Cloud DB vocab_library   │
│ (~1300 词)            │      │ 集合 (~1300 条文档)       │
│                       │      │                         │
│ grammar.ts            │───→  │ Cloud DB grammar_points  │
│ (10 语法点)            │      │ 集合 (10 条文档)          │
│                       │      │                         │
│ scenes.json           │───→  │ Cloud DB scenes 集合     │
│ (20 场景)             │      │ (20 条文档)              │
│                       │      │                         │
│ all_articles_podcast  │───→  │ Cloud DB articles 集合   │
│ .json (28 篇文章)      │      │ (28 条文档)              │
│                       │      │                         │
│ questions.ts 题库模板  │───→  │ 本地 utils/question-gen  │
│ (Part 1-4 模板题)      │      │ .js (纯逻辑, 不上云)     │
│                       │      │                         │
└───────────────────────┘      └─────────────────────────┘

迁移脚本: 编写一个 Node.js 脚本 `scripts/migrate-data.js`, 使用
  微信云开发 HTTP API 或 cloudbase-admin SDK 批量导入 JSON 数据到 Cloud DB
```

**迁移注意事项:**
- `vocabulary.ts` 中的 `VOCAB_GROUPS` 是嵌套结构 (字母 → 词列表), 需要扁平化为逐条文档, 每条添加 `_id`, `letter`, `sceneIds` 字段
- `scenes.json` 中的 `wordIds` 是引用字段, 迁移后保持字符串数组
- `questions.ts` 不迁移到 Cloud DB, 原因: (1) 题目是本地动态生成的模板题, 不是题库; (2) 避免每次答题都要网络请求; (3) 未来如果需要云端题库, 可新建 `question_bank` 集合

---

## 5. 组件树 & 路由

### 5.1 页面导航结构

```
app.json tabBar (底部标签栏)
│
├── Tab 1: "学习" (home/index)
│   └── 子页面 (navigateTo, 不显示 Tab):
│       ├── exam/index       (考试模式选择)
│       │   └── exam/do      (答题中)
│       │       └── result/index  (成绩)
│       │           └── review/index (错题回顾)
│       ├── vocab/index      (词汇列表)
│       ├── grammar/index    (语法列表)
│       │   └── grammar/detail   (语法详情 + 测验)
│       └── scenarios/index  (场景列表)
│           ├── scenarios/article (文章阅读)
│           └── scenarios/podcast (播客播放)
│
├── Tab 2: "我的" (profile/index)
│   └── 子页面:
│       └── (可内嵌 scroll-view, 不需要额外子页面)
│
└── 非 Tab 页面 (通过 redirectTo 导航, 不在 tabBar 中):
    ├── index                    (启动页)
    ├── onboarding/goal          (引导-目标设定)
    ├── onboarding/diagnostic    (引导-诊断测试)
    │   └── result/index         (引导-诊断报告, 复用 result 页面)
    └── onboarding/report        (引导-完整报告)

路由跳转规则:
  - Tab 之间切换: wx.switchTab
  - Tab 内子页面: wx.navigateTo (保留返回按钮)
  - 引导流程中: wx.redirectTo (不保留返回, 防止回退到已完成的步骤)
  - 考试提交 → 成绩: wx.redirectTo (考试页面不应回退)
```

### 5.2 核心组件 Props 和 Events

#### `audio-player` -- 音频播放器

```
所在路径: components/audio-player/

Properties (组件属性):
  src: String              // 音频文件 URL (cloud:// 或 https://)
  title: String            // 音频标题
  autoplay: Boolean        // 是否自动播放, 默认 false
  showControls: Boolean    // 是否显示控制条, 默认 true

Events (组件事件):
  bind:play                 // 开始播放
  bind:pause                // 暂停
  bind:ended               // 播放结束
  bind:timeupdate          // 播放进度更新, detail = { currentTime, duration }
  bind:error               // 播放错误, detail = { errMsg }

Methods (组件方法, 通过 this.selectComponent 调用):
  play()
  pause()
  seek(seconds)
  setRate(rate)            // 设置播放倍速: 0.5 / 0.75 / 1.0 / 1.25 / 1.5
```

#### `option-card` -- 选项卡片

```
所在路径: components/option-card/

Properties:
  optionId: String         // A / B / C / D
  text: String             // 选项文本
  state: String            // default | selected | correct | wrong | disabled
  showResult: Boolean      // 是否显示结果态 (对错图标)

Events:
  bind:tap                 // 点击选项, detail = { optionId }
```

#### `timer-bar` -- 考试倒计时

```
所在路径: components/timer-bar/

Properties:
  totalSeconds: Number     // 总秒数
  remainingSeconds: Number // 剩余秒数
  warningThreshold: Number // 警告阈值 (秒), 低于此值变红, 默认 300 (5 分钟)

Events:
  bind:timeup              // 时间到 (倒计时归零)
```

#### `progress-bar` -- 环形进度图

```
所在路径: components/progress-bar/

Properties:
  percent: Number          // 0-100
  size: Number             // 环形直径 (px), 默认 120
  strokeWidth: Number      // 线条宽度, 默认 8
  color: String            // 进度条颜色, 默认 '#4CAF50'
  label: String            // 中心文字
  sublabel: String         // 中心副文字
```

#### `vocab-card` -- 词汇闪卡

```
所在路径: components/vocab-card/

Properties:
  word: String             // 英文单词
  meaningZh: String        // 中文释义
  state: String            // new | learning | review | mastered
  showMeaning: Boolean     // 是否显示中文 (翻转效果), 默认 false

Events:
  bind:flip                // 翻转卡片
  bind:markKnown           // 标记为认识
  bind:markUnknown         // 标记为不认识
```

#### `part-indicator` -- Part 标签

```
所在路径: components/part-indicator/

Properties:
  part: Number             // 1-7
  size: String             // small | medium | large, 默认 medium
```

### 5.3 页面间数据传递

```
传递方式:
  1. URL 参数 (轻量数据): wx.navigateTo({ url: '/pages/result/index?assessmentId=xxx' })
  2. EventChannel (中等数据): wx.navigateTo({ success: res => res.eventChannel.emit(...) })
  3. 本地 Storage (大量数据):
     考试前: wx.setStorageSync('currentExam', { questions, answers, startTime })
     考试中: answer 数据更新时实时写 Storage
     成绩页: wx.getStorageSync('currentExam') → 渲染 → 提交后清除

原则:
  - URL 参数 < 1KB (主要用于传递 ID)
  - EventChannel 用于上一个页面需要监听结果的场景
  - Storage 用于考试答题等大数据量场景
```

---

## 6. 开发环境 & 工具链

### 6.1 微信开发者工具配置

**`project.config.json`** 关键配置:

```json
{
  "description": "TOEIC Coach - 托业考试AI教练",
  "packOptions": {
    "ignore": [
      { "type": "folder", "value": ".git" },
      { "type": "folder", "value": "node_modules" },
      { "type": "file", "value": ".gitignore" },
      { "type": "file", "value": "README.md" },
      { "type": "file", "value": "docs" }
    ]
  },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "condition": false
  },
  "compileType": "miniprogram",
  "libVersion": "3.7.0",
  "appid": "wxXXXXXXXXXXXXXXXX",
  "projectname": "toeic-coach",
  "cloudfunctionRoot": "miniprogram/cloud/functions/",
  "cloudbaseRoot": "miniprogram/cloud/",
  "condition": {
    "miniprogram": {
      "list": [
        {
          "name": "首页",
          "pathName": "pages/home/index",
          "query": "",
          "launchMode": "default",
          "scene": null
        },
        {
          "name": "引导-目标设定",
          "pathName": "pages/onboarding/goal/index",
          "query": "",
          "launchMode": "default",
          "scene": null
        },
        {
          "name": "答题页",
          "pathName": "pages/exam/do",
          "query": "mode=listening-only",
          "launchMode": "default",
          "scene": null
        }
      ]
    }
  }
}
```

### 6.2 Vant Weapp 组件库引入

**步骤 1**: 初始化 npm

```bash
cd toeic-coach-miniprogram
npm init -y
```

**步骤 2**: 安装 Vant Weapp

```bash
npm install @vant/weapp --production
```

**步骤 3**: 微信开发者工具 → 工具 → 构建 npm

**步骤 4**: 在 `app.json` 中注册全局组件 (按需引入):

```json
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-cell": "@vant/weapp/cell/index",
    "van-cell-group": "@vant/weapp/cell-group/index",
    "van-icon": "@vant/weapp/icon/index",
    "van-popup": "@vant/weapp/popup/index",
    "van-dialog": "@vant/weapp/dialog/index",
    "van-toast": "@vant/weapp/toast/index",
    "van-progress": "@vant/weapp/progress/index",
    "van-circle": "@vant/weapp/circle/index",
    "van-tab": "@vant/weapp/tab/index",
    "van-tabs": "@vant/weapp/tabs/index",
    "van-overlay": "@vant/weapp/overlay/index",
    "van-loading": "@vant/weapp/loading/index",
    "van-skeleton": "@vant/weapp/skeleton/index",
    "van-empty": "@vant/weapp/empty/index",
    "van-notice-bar": "@vant/weapp/notice-bar/index",
    "van-steps": "@vant/weapp/steps/index",
    "van-tag": "@vant/weapp/tag/index",
    "van-search": "@vant/weapp/search/index",
    "van-radio": "@vant/weapp/radio/index",
    "van-radio-group": "@vant/weapp/radio-group/index",
    "van-slider": "@vant/weapp/slider/index",
    "van-action-sheet": "@vant/weapp/action-sheet/index",
    "van-picker": "@vant/weapp/picker/index",
    "van-datetime-picker": "@vant/weapp/datetime-picker/index",
    "van-grid": "@vant/weapp/grid/index",
    "van-grid-item": "@vant/weapp/grid-item/index"
  }
}
```

### 6.3 npm 构建配置

**`package.json`**:

```json
{
  "name": "toeic-coach-miniprogram",
  "version": "1.0.0",
  "description": "TOEIC Coach - 托业考试AI教练微信小程序",
  "main": "miniprogram/app.js",
  "scripts": {
    "migrate:vocab": "node scripts/migrate-vocab.js",
    "migrate:grammar": "node scripts/migrate-grammar.js",
    "migrate:scenes": "node scripts/migrate-scenes.js",
    "migrate:articles": "node scripts/migrate-articles.js",
    "migrate:all": "npm run migrate:vocab && npm run migrate:grammar && npm run migrate:scenes && npm run migrate:articles"
  },
  "dependencies": {
    "@vant/weapp": "^1.11.0"
  },
  "devDependencies": {
    "@cloudbase/cli": "^2.0.0",
    "miniprogram-api-typings": "^3.12.0"
  }
}
```

### 6.4 其他开发工具

| 工具 | 用途 |
|------|------|
| 微信开发者工具 Stable (macOS/Windows) | 小程序开发、调试、预览、云开发控制台 |
| VSCode + WXML 插件 | 代码编写 (比微信开发者工具编辑器体验好) |
| cloudbase-cli | 命令行管理 Cloud DB 数据导入导出, 云函数部署 |
| 微信云开发控制台 (网页) | 数据库可视化, 存储管理, 云函数日志, 统计分析 |

### 6.5 环境管理

```
开发环境规划:
  - 微信小程序 AppID 不同:
    开发版: wxXXXXXXXXXXXXXXXX (开发 AppID, 云开发环境: toeic-dev)
    正式版: wxYYYYYYYYYYYYYYYY (正式 AppID, 云开发环境: toeic-prod)

  - 开发者工具中切换环境: project.config.json → appid 字段

  - 云函数环境 ID 在 app.js 初始化时指定:
    wx.cloud.init({
      env: 'toeic-prod',  // 或 'toeic-dev'
      traceUser: true
    })
```

---

## 7. 实施顺序

### Sprint 0: 项目初始化 (0.5 周)

**目标**: 开发环境就绪, 数据迁移完成, 基础框架搭建

| 任务 | 产出 | 估时 |
|------|------|------|
| 注册微信小程序账号, 开通云开发 | AppID + 云环境 ID | 0.5d |
| 创建小程序项目骨架, 配置 project.config.json | 能跑通的 Hello World | 0.5d |
| 安装 Vant Weapp, 构建 npm | 组件库可用 | 0.5d |
| 将原项目 TypeScript 类型翻译为 JS utils | `utils/scoring.js`, `utils/question-gen.js`, `utils/consts.js` | 1d |
| 编写数据迁移脚本, 将 JSON 导入 Cloud DB | vocab_library, grammar_points, scenes, articles 集合就绪 | 1d |
| 实现 app.js 全局初始化 + login 云函数 | 静默登录链路跑通 | 1d |

### Sprint 1: Onboarding + 核心答题 (2 周)

**目标**: 用户引导流程 + 听力答题引擎可运行

| 任务 | 产出 | 估时 |
|------|------|------|
| **pages/index** 启动页 (静默登录 + 路由判断) | 启动 → 引导 或 启动 → 首页 | 0.5d |
| **pages/onboarding/goal** (目标设定页) | 分数选择滑块 + 写入 users.goal | 1d |
| **pages/onboarding/diagnostic** (诊断测试) | 20 题快速测评 (复用 exam/do 引擎) | 0.5d |
| **pages/onboarding/report** (诊断报告) | 能力雷达图 + 推荐学习路径 | 1d |
| **components/audio-player** (核心音频组件) | innerAudioContext 封装, play/pause/seek/倍速 | 1.5d |
| **components/option-card** (选项卡片) | 四选一交互, 选择/正确/错误三态 | 0.5d |
| **components/timer-bar** (倒计时) | 倒计时 + 时间到回调 | 0.5d |
| **pages/exam/index** (模式选择) | 全真模考 / Part 1-4 练习 卡片 | 0.5d |
| **pages/exam/do** (答题引擎核心) | 逐题播放 + 选项交互 + 本地暂存 + 提交 | 3d |
| **云函数 syncExamResult** | 服务端评分 + 写入 Cloud DB | 1d |
| **pages/result/index** (成绩页) | 分数展示 + Part 正确率 + 等级 | 1d |
| **pages/review/index** (错题回顾) | 逐题回顾, 正误高亮, transcript 查看 | 1d |

### Sprint 2: Home + Profile + 学习模块 (2 周)

**目标**: Tab 主页完成, 词汇/语法/场景功能上线

| 任务 | 产出 | 估时 |
|------|------|------|
| **app.json Tab Bar 配置** | "学习" + "我的" 双 Tab | 0.5d |
| **pages/home/index** (Coach Home) | 今日任务卡片, 进度环形图, 快捷入口网格 | 2d |
| **云函数 getUserProfile** | 聚合并返回用户完整数据 | 1d |
| **utils/sync.js** (数据同步层) | 本地缓存 + Cloud DB 同步 + pending_sync 队列 | 1.5d |
| **utils/network.js** (离线检测) | 断网提示条 + 网络恢复同步 | 0.5d |
| **pages/vocab/index** | 按字母分组词汇列表 + 搜索 + 标记掌握状态 | 2d |
| **components/vocab-card** | 词汇闪卡 (翻转动画) | 0.5d |
| **pages/grammar/index + detail** | 语法点列表 + 详情 (规则+例句+测验) | 1.5d |
| **pages/scenarios/index + article** | 场景列表 + 文章阅读 (高亮场景词汇) | 2d |
| **pages/scenarios/podcast** | 场景播客音频播放页 | 1d |
| **pages/profile/index** | 用户信息, 学习统计, 历史成绩, 成长日记 | 2d |

### Sprint 3: 错题本 + 每日任务 + 数据导出 (1.5 周)

**目标**: 学习闭环完成, 用户可导出数据

| 任务 | 产出 | 估时 |
|------|------|------|
| **云函数 syncExamResult 增强** (错题写入逻辑) | mistake_bank upsert + wrongCount 自增 | 0.5d |
| **错题本页面** (内嵌在 profile 或独立页面) | 按 Part/错误类型筛选, 重新作答 | 1.5d |
| **每日任务生成逻辑** (云函数或本地算法) | 根据 abilityProfile + stage 生成 daily_tasks | 1d |
| **daily_tasks 完成状态同步** | 任务勾选 → 本地更新 → Cloud DB 同步 | 0.5d |
| **vocab_states 同步** | 词汇学习进度 → Cloud DB 持久化 | 0.5d |
| **云函数 exportUserData** | 用户全部数据导出 JSON → Cloud Storage 下载 | 1d |
| **growth_diary** (成长日记) | 每日学习总结弹窗 + 历史列表 | 1d |
| **成长日记 CRUD** | 写日记 + 查看历史 + Cloud DB 同步 | 1d |

### Sprint 4: 打磨 + 测试 + 上线 (1.5 周)

**目标**: 性能优化, 边界处理, 提审上线

| 任务 | 产出 | 估时 |
|------|------|------|
| **性能优化** | 分包加载 (独立分包放 static 大文件), setData 优化 (减少数据量, 合并调用), 图片懒加载 | 1.5d |
| **骨架屏** | home/profile/vocab 页面加载时骨架屏展示 | 1d |
| **空状态处理** | 各列表无数据时的空状态占位 + 引导文案 | 0.5d |
| **loading / toast 统一** | 加载态 + 错误提示 + 成功提示 全局封装 | 0.5d |
| **音频播放边界处理** | 后台播放暂停, 锁屏控制, 电话打断恢复 | 1d |
| **兼容性测试** | iOS 13+ / Android 8+ 真机测试 | 1d |
| **云函数压力测试** | 模拟 100 并发 syncExamResult 调用, 检查耗时 | 1d |
| **静态数据 CDN 加速** | 将 Cloud Storage 音频文件配置 CDN 加速域名 | 0.5d |
| **提审准备** | 隐私弹窗, 用户协议, 小程序描述 + 截图 | 0.5d |
| **代码审查 + Bug 修复** | 走查全部页面, 修复 UI 和逻辑 Bug | 1d |

### 总计: 约 7.5 周

```
Sprint 0 ████░░░░░░░░░░░░░░ 0.5 周 (项目初始化)
Sprint 1 ████████████░░░░░░ 2.0 周 (引导 + 答题引擎)
Sprint 2 ████████████████░░ 2.0 周 (首页 + 学习模块)
Sprint 3 ██████████████░░░░ 1.5 周 (闭环 + 导出)
Sprint 4 ██████████████░░░░ 1.5 周 (优化 + 上线)
```

---

## 附录

### A. 小程序包体积控制策略

```
主包 (上限 2MB):
  - 页面 JS/WXML/WXSS
  - 全局组件
  - utils (纯 JS, 很小)
  - 必要的 static/images (Tab 图标等)

分包 1: pages-sub (上限 2MB):
  - vocab, grammar, scenarios (静态学习内容, 较大)

分包 2: pages-exam (上限 2MB):
  - exam/do (答题引擎, 最大页面)

独立分包: static-assets (上限 2MB):
  - 引导页大图, 场景封面图, 音频文件 (放 Cloud Storage 而非本地)

Cloud Storage:
  - 所有音频 (vocab + scenarios + exam)
  - 所有图片 (cdn 加速)
  - 用户导出文件
```

### B. 关键性能指标 (目标)

| 指标 | 目标值 |
|------|-------|
| 首屏加载 (home 页) | < 1.5s (含云端数据拉取) |
| 答题页渲染 | < 500ms |
| 音频播放启动延迟 | < 300ms |
| 考试提交 (syncExamResult) | < 3s (含评分+写入) |
| 词汇列表滚动 | 60fps |
| 小程序包体积 (主包) | < 1.5MB |

### C. 技术风险 & 应对

| 风险 | 应对 |
|------|------|
| 微信云开发数据库 QPS 限制 (免费版 ~500 QPS) | 1 万用户日活 < 3000, 远低于限制; 高频查询走本地缓存 |
| 音频文件过多导致 Cloud Storage 成本高 | 初期用 TTS 合成 (云函数调用腾讯云 TTS), 缓存复用; 后期买商用音频授权 |
| 微信小程序审核不通过 | 确保无 UGC 内容 (或实现内容审核), 隐私弹窗合规, 不涉及虚拟支付 |
| Vant Weapp 与基础库版本不兼容 | 锁定 `@vant/weapp@1.11.x`, 固定 `libVersion: "3.7.0"` |
| 本地 Storage 10MB 上限 | 静态数据压缩存储 (JSON 不 prettify), 考试临时数据用完即删, 图片不存 Storage |
