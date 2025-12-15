# Paper2Galgame - 技术架构与维护文档

## 1. 项目概述 (Project Overview)

**Paper2Galgame** 是一个基于 Web 的创新应用，旨在将枯燥的学术论文（PDF）转化为沉浸式的 Galgame（视觉小说）对话体验。项目通过集成生成式 AI，模拟二次元角色“丛雨”（Murasame）的口吻，对论文内容进行深度解析、吐槽和教学。

---

## 2. 技术栈 (Tech Stack)

本项目采用现代前端轻量化架构，主要技术选型如下：

*   **核心框架**: [React 19](https://react.dev/) - 使用函数式组件与 Hooks (`useState`, `useEffect`, `useRef`) 管理状态与生命周期。
*   **构建/模块**: ES Modules (通过 `importmap` 和 `esm.sh` 引入)，无需复杂的 Webpack/Vite 本地配置即可运行，适合快速原型开发。
*   **样式库**: [Tailwind CSS](https://tailwindcss.com/) (CDN 引入) - 原子化 CSS，实现快速 UI 开发与响应式布局。
*   **图标库**: [FontAwesome](https://fontawesome.com/) - 提供 UI 图标支持。
*   **AI API**: [Volcengine ARK (Doubao/豆包)](https://www.volcengine.com/docs/82379/1302007) - 火山引擎方舟大模型服务，使用原生 Fetch API 调用。
*   **字体**: Noto Serif SC (中文衬线) & Nunito (英文字体)，营造视觉小说的阅读质感。

---

## 3. 项目结构说明 (Project Structure)

```text
/
├── index.html                  # 入口文件，包含 Tailwind 配置、ImportMap 和全局样式
├── index.tsx                   # React 根节点挂载
├── App.tsx                     # 顶层组件，管理路由状态 (Title -> Upload -> Game)
├── types.ts                    # TypeScript 类型定义 (DialogueLine, GameSettings 等)
├── services/
│   ├── doubaoService.ts        # 核心业务逻辑：文件处理、Prompt 构造、Doubao API 调用
│   └── geminiService.ts        # (已弃用) 原 Gemini API 实现
└── components/
    ├── TitleScreen.tsx         # 标题/主菜单界面
    ├── UploadScreen.tsx        # 文件上传与加载状态界面
    ├── SettingsScreen.tsx      # 设置界面 (性格、解析深度)
    └── GameScreen.tsx          # 游戏主界面 (立绘、对话框、打字机效果)
```

---

## 4. 关键维护与修改点 (Key Maintenance Points)

### 4.1. API Key 配置
*   **位置**: `services/doubaoService.ts`
*   **变量**: `API_KEY`
*   **环境变量**: 创建 `.env` 文件并添加 `ARK_API_KEY=your_key_here`
*   **获取方式**: 
    1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
    2. 在模型推理页面获取 API Key
    3. 选择支持 PDF 文档理解的模型 (如 `doubao-seed-1-6-251015`)
*   **注意**: 目前 Key 可能为前端硬编码（仅供开发）。在生产环境中，务必通过环境变量或后端代理请求以防泄露。

### 4.2. 角色设定与 Prompt (Prompt Engineering)
*   **位置**: `services/doubaoService.ts` 中的 `prompt` 变量。
*   **修改**: 若要更改角色设定（例如从“丛雨”改为“猫娘”），需修改：
    1.  `personalityInstruction` 逻辑。
    2.  `prompt` 模板字符串中的“人物设定”和“口癖”部分。
    3.  响应 JSON schema 中的 `speaker` 枚举值。

### 4.3. 角色立绘 (Character Sprites)
*   **位置**: `components/GameScreen.tsx`
*   **变量**: `CHARACTER_IMAGES` 对象。
*   **修改**: 替换对象中的 URL 即可更改不同情绪下的角色图片。

### 4.4. 样式主题
*   **位置**: `index.html` 中的 `tailwind.config` script 标签。
*   **修改**: 修改 `colors` 对象中的 `gal-pink`, `gal-blue` 等自定义颜色变量，可实现全局换肤。

---

## 5. Doubao API 使用说明 (Doubao API Usage Guide)

### 5.1. API 架构
本项目现已迁移至 **Volcengine ARK (豆包/Doubao)** API，利用其 **原生 PDF 文档理解能力**。Doubao 支持直接上传 PDF 文件并通过视觉功能理解文档内容。

### 5.2. 支持的 PDF 输入方式
根据 Doubao 官方文档，支持三种方式：

1. **Files API 上传（推荐）**：
   - 最大支持 512MB 文件
   - 文件预处理后可复用，减少延迟
   - 默认存储 7 天
   
2. **Base64 编码传入**：
   - 适用于小文件（<50MB）
   - 请求体不超过 64MB
   
3. **文件 URL 传入**：
   - 文件需要公网可访问
   - 文件大小不超过 50MB

当前实现使用 **Files API 上传** 方式，代码位于 `services/doubaoService.ts`。

### 5.3. API 调用流程
```
1. 上传 PDF → /api/v3/files (获取 file_id)
2. 等待文件处理完成 (轮询状态)
3. 调用 Responses API → /api/v3/responses (传入 file_id 和 prompt)
4. 解析返回的 JSON 对话脚本
```

### 5.4. 如何切换回 Gemini 或其他 API

如果需要切换回 Gemini 或迁移到其他 API（OpenAI、DeepSeek 等）：

**切换回 Gemini**:
1. 修改 `UploadScreen.tsx` 的 import: `import { analyzePaper } from '../services/geminiService'`
2. 还原 `package.json` 中的 `@google/genai` 依赖
3. 更新 `vite.config.ts` 使用 `GEMINI_API_KEY`

**迁移到 OpenAI/DeepSeek**:
注意：OpenAI 和 DeepSeek 的标准 Chat API **不直接支持 PDF 上传**，需要：
1. 引入 PDF 解析库（如 `pdf.js`）将 PDF 转为文本
2. 创建新的 service 文件，使用 Chat Completions API
3. 将提取的文本作为 user message 发送

---
## 6. 后续功能增强建议 (Future Improvements)

### 6.1. 安全性 (Security)
*   **后端代理**: 创建一个轻量级后端 (Node.js/Next.js API Routes)，将 API Key 存储在服务器端，前端仅向后端发送文件，避免 Key 泄露。

### 6.2. 功能 (Features)
*   **流式输出 (Streaming)**: 目前是等待完全生成后才开始播放。可以改为流式接收 JSON 片段，实现“边想边说”的效果，减少首屏等待时间。
*   **语音合成 (TTS)**: 集成 ElevenLabs 或 Edge TTS，根据 `emotion` 字段为角色配音。
*   **历史记录回溯 (Log)**: 增强 Log 功能，允许点击历史对话跳转。
*   **存档系统**: 使用 `localStorage` 保存当前的阅读进度。

### 6.3. 性能 (Performance)
*   **PDF 解析优化**: 对于超长论文，Doubao 可能会遇到 Token 限制或处理缓慢。可以考虑先提取摘要，或分章节进行讲解。

### 6.4. 自定义 (Customization)
*   **自定义角色**: 允许用户上传自己的立绘包和设定 Prompt，创建属于自己的论文导读员。

---

## 7. 常见报错排查 (Troubleshooting)

*   **"Failed to summon the explanation"**: 
    *   检查 `services/doubaoService.ts` 中的 API Key 是否有效。
    *   检查网络是否能连接到 Volcengine ARK API (火山引擎)。
    *   检查上传的文件是否为标准 PDF。
*   **黑屏/白屏**: 
    *   检查浏览器控制台 (F12) 是否有 JS 报错。
    *   确保 `index.html` 中的 `type="module"` 脚本引用正确。
