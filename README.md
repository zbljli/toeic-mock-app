# 📝 TOEIC 模拟考

[![Expo](https://img.shields.io/badge/Expo-57-blue.svg)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

一个基于 React Native (Expo) 构建的 **TOEIC 听力与阅读全真模拟考试 App**，支持 iOS、Android 和 Web。

## ✨ 功能

- 🎯 **完整模考** — 200 题全真模拟，听力 45 分钟 + 阅读 75 分钟
- 🔍 **分项练习** — 支持 7 个 Part 的独立专项练习
- 📊 **智能评分** — 基于 TOEIC 原始分→转换分模型，5-495 分制
- ⏱ **倒计时** — 自动计时，到时自动交卷
- 📋 **答案解析** — 逐题回顾，标注对错，查看听力文本
- 📈 **成绩历史** — 保存每次模考记录，追踪进步趋势

## 🏗 项目结构

```
src/
├── types/           # TypeScript 类型定义
│   └── index.ts
├── data/            # 题库 & 考试结构
│   ├── toeicStructure.ts   # TOEIC 7 Parts 配置
│   └── questions.ts        # 题目生成器
├── utils/           # 工具函数
│   ├── scoring.ts          # 分数换算
│   └── timer.ts            # 计时工具
├── context/         # React Context 状态管理
│   └── TestContext.tsx
├── components/      # 可复用组件
│   ├── QuestionCard.tsx
│   ├── OptionButton.tsx
│   ├── Timer.tsx
│   └── ProgressBar.tsx
├── screens/         # 页面
│   ├── HomeScreen.tsx      # 首页 - 选择考试模式
│   ├── TestScreen.tsx      # 考试页面
│   ├── ResultScreen.tsx    # 成绩展示
│   ├── ReviewScreen.tsx    # 答案解析
│   └── HistoryScreen.tsx   # 历史记录
└── navigation/      # 路由配置
    └── AppNavigator.tsx
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- npm 或 yarn
- Expo Go App（手机端扫码测试）

### 安装运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start
```

启动后，用 **Expo Go** 扫码即可在手机上运行。

### 构建生产版本

```bash
# Android
npx eas build --platform android

# iOS
npx eas build --platform ios
```

## 📐 TOEIC 考试结构

| Part | 名称 | 类型 | 题数 |
|------|------|------|------|
| Part 1 | Photographs / 照片描述 | 🎧 Listening | 6 |
| Part 2 | Question-Response / 应答问题 | 🎧 Listening | 25 |
| Part 3 | Conversations / 简短对话 | 🎧 Listening | 39 |
| Part 4 | Talks / 简短独白 | 🎧 Listening | 30 |
| Part 5 | Incomplete Sentences / 句子填空 | 📖 Reading | 30 |
| Part 6 | Text Completion / 段落填空 | 📖 Reading | 16 |
| Part 7 | Reading Comprehension / 阅读理解 | 📖 Reading | 54 |

## 🗺 路线图

- [ ] 真实 TOEIC 题库接入
- [ ] 音频播放（听力 Part 1-4）
- [ ] 答题卡快速跳转
- [ ] 错题本 & 收藏功能
- [ ] 学习统计 & 趋势图表
- [ ] 多语言界面（中/英/日/韩）
- [ ] AI 题目生成
- [ ] EAS 云端构建 & 发布

## 📄 License

MIT © TOEIC Mock App Contributors

---

🤖 Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
