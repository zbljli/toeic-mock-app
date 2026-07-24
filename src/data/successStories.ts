import type { SuccessStory } from '../types/coach';

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'story_1',
    nickname: 'Carrie',
    avatarEmoji: '👩‍💼',
    startScore: 300,
    targetScore: 400,
    finalScore: 400,
    improvement: 100,
    totalDays: 45,
    phases: [
      {
        label: '前15天',
        focus: '500核心词突破',
        description: '每天30个高频场景词汇，建立听力词汇基础。从"听不清"到"能听懂关键词"。',
      },
      {
        label: '中间20天',
        focus: 'Part 3 精听突破',
        description: '大量多人对话精听练习，抓关键词和说话人转换，逐步适应真实对话语速。',
      },
      {
        label: '最后10天',
        focus: '8套完整模拟',
        description: '全真模拟培养考试节奏感，复盘薄弱题型，建立考场自信。',
      },
    ],
    testimonial:
      '以前听Part 3像听天书，现在可以自然抓取关键信息了。45天，从300到400，+100分。找到正确的方法，你也可以做到。',
  },
];
