# Paper2Galgame 📚✨

> 将学术论文转化为沉浸式 Galgame 体验，由守护灵"丛雨"（Murasame）为你讲解！

![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF)

## �� 项目简介

Paper2Galgame 是一个创新的 Web 应用，利用 AI 将枯燥的学术论文转化为视觉小说风格的对话体验。由五百年守护灵"丛雨"以傲娇（或温柔/严厉）的方式，为你逐步讲解论文内容。

### ✨ 特性

- 📄 **PDF 解析**：自动提取论文文本内容
- 🤖 **AI 驱动**：支持 DeepSeek / OpenAI 兼容 API
- 🎭 **多种性格**：傲娇、温柔、严厉三种讲解风格
- 📊 **可调深度**：简略/详细/学术三档讲解深度
- 💬 **完整 VN 体验**：打字机效果、自动播放、对话历史
- 🎨 **精美 UI**：动态立绘、情绪表情切换

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm 或 pnpm

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd paper2galgame

# 安装依赖
npm install
```

### 配置 API

编辑 [`services/geminiService.ts`](services/geminiService.ts )，修改 API 端点和密钥：

```typescript
// 第 205 行附近
const response = await fetch("YOUR_API_ENDPOINT", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  // ...
});
```

### 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

访问 `http://localhost:3000` 开始使用。

## 📁 项目结构

```
paper2galgame/
 index.html          # 入口 HTML
 index.tsx           # React 入口
 App.tsx             # 主应用组件
 types.ts            # TypeScript 类型定义
 components/
    TitleScreen.tsx     # 标题界面
    UploadScreen.tsx    # 上传界面
    GameScreen.tsx      # 游戏主界面
    SettingsScreen.tsx  # 设置界面
 services/
     geminiService.ts    # API 服务层
```

## ⚙️ 配置选项

### 讲解深度 ([`GameSettings.detailLevel`](types.ts ))

| 选项 | 描述 | 对话轮数 |
|------|------|----------|
| `brief` | 简略模式，快速总结 | ~15 轮 |
| `detailed` | 详细模式，深入讲解 | ~30 轮 |
| `academic` | 学术模式，专业分析 | ~30 轮 |

### 性格模式 ([`GameSettings.personality`](types.ts ))

| 选项 | 描述 |
|------|------|
| `tsundere` | 傲娇模式：「真拿你没办法，笨蛋主殿！」 |
| `gentle` | 温柔模式：「没关系，慢慢来～」 |
| `strict` | 严厉模式：「不许偷懒！」 |

## 🎨 自定义立绘

编辑 [`components/GameScreen.tsx`](components/GameScreen.tsx ) 中的 [`CHARACTER_IMAGES`](components/GameScreen.tsx ) 对象：

```typescript
const CHARACTER_IMAGES: Record<string, string> = {
  normal: 'your-image-url',
  happy: 'your-image-url',
  angry: 'your-image-url',
  // ...
};
```

## 🔧 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS
- **PDF 解析**: pdfjs-dist
- **AI API**: OpenAI 兼容接口

## 📝 License

MIT License

---

*Designed for Research & Fun* 🌸
