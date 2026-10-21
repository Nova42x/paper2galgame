# paper2galgame 笔记与举手问答最小移植

核查日期：2026-10-21。适用主仓库基线：da60826012493b16872add56d6c6d412197e6f1c。

## 核查证据

- https://github.com/Nova42x/paper2galgame/issues/6 ：2026-07-13，Egerialiu 提三项建议；MrChenLearnSpace 回复其 fork 完成前两项。评论没有确认第三项完成。
- https://github.com/Nova42x/paper2galgame/blob/da60826012493b16872add56d6c6d412197e6f1c/components/GameScreen.tsx ：真实主线播放逻辑。
- https://github.com/MrChenLearnSpace/paper2galgame-open/blob/main/services/notesService.ts ：核查 blob 8eb54835ed2e948c5fa9f77ec3f426bf47240823。
- https://github.com/MrChenLearnSpace/paper2galgame-open/blob/main/components/NotesPanel.tsx ：核查 blob f0e339b9b5009029863dc5ee2f7c38a4fc43c8f0。

这是参考社区方案后针对主线独立实现的适配，不是整体 cherry-pick；未引入 fork 的模型路由或重构。发布前应确认双方项目许可和归属要求；此交付没有替社区源码声明许可证。

## 原状态与风险

GameScreen props 仅 script/title/onExit。currentIndex 控制当前句，displayedText/isTyping 控制 30ms 打字机，isAuto 在打字结束后 2 秒推进。根元素 click 调用 handleNext：打字未完成则立即补齐，否则下一句。历史窗口展示 script.slice(0,currentIndex+1)，仅阻止鼠标冒泡，原逻辑并未暂停自动播放。没有提问处理器、问答服务、分支 ID、稳定论文 ID 或会话持久化。

App 将生成的脚本和标题保存在内存，退出清空，刷新丢失。UploadScreen 仅把模型生成标题传入 App；该标题甚至允许是“有趣的概述”，不适合作为论文身份。

社区 Note 包含 id/title/content/createdAt/updatedAt；以 paper_notes_v1:paperTitle 作为 localStorage key。CRUD 读取整个数组再回写。标题重名会串笔记，标题变化会找不到原笔记；缺失 ID 回落 global/untitled 也会混合。JSON.parse 后直接断言类型，损坏数据被吞成空数组，下一次编辑可能覆盖原数据；写失败只打印控制台，界面误以为保存成功。组件直接修改 state 中对象，自动整理可能直接覆盖手写内容。其遮罩没有 stopPropagation，整段复制到根 click GameScreen 还会误推进。

社区 autoStructureDialogue 是关键词分类/摘录；优先命中第一个类别，Highlights 另行抽取，Summary 实际取前三条而非注释写的两条。Limitations 在关键词表却不在 sections 中，命中会 push 到 undefined；输出也没有 limitations。bySpeaker 生成但面板不展示。不能称为完整 LLM 总结。

## 改动与数据流

PDF bytes → SHA-256 paperId → UploadScreen 回调 → App → GameScreen → 独立 NotesPanel。

存储 key：paper_notes_v2:<64位PDF哈希>。内容为 {version:2, notes, branches}。Note 为 id/title/content/updatedAt。Branch 为 id/question/answer/createdAt/index/script；script 是提问时完整克隆的原脚本，index 为零基位置。每次成功回答独立成为一个单轮分支，不支持分支内继续追问或树状多级对话。

- 同标题不同 PDF 不混合；同一字节内容不同文件名仍归同一论文。PDF 元数据改变也会改变哈希，这是字节身份的限制。
- 分支不插入主 script。点击回溯切换到该分支保存的 script/index，且停用自动播放；并不是拿旧 index 跳到新生成的脚本。
- 面板隔离 click；打开时停用 auto，handleNext 也检查 showNotes/showLog。关闭后手动继续。
- 规则整理只处理到当前句，建立新笔记，不覆盖已有内容。完整摘录归到局限/实验/方法/背景/结论/其他，按此顺序首匹配，保留说话者。没有推理或摘要生成；含多个主题的句子只归一类，可能误分类。
- 每个标题/内容输入事件同步保存；只在写成功后更新 UI。损坏或未知版本阻止写入，明确报错。问答保存失败保留回答并提供重试，防止重复付费调用。
- 答案通过新增 questionService 调用现有 SDK 和同型号模型，原 analyzePaper 保持原样。只传已读讲解和问题，不包含 PDF，不共享长会话，也不保证回答事实正确。

## 直接应用

在干净的上述基线仓库中，从解压目录执行：

```bash
git apply --check /absolute/path/paper2galgame-notes.patch
git apply /absolute/path/paper2galgame-notes.patch
npm ci
npm test
npm run typecheck
npm run build
```

在项目 .env.local 配置 GEMINI_API_KEY，然后 npm run dev。这使用原 Vite 的 env define；密钥会进入浏览器 bundle，不能作为公共生产环境的密钥保护方案。主仓库原 analyzePaper 中已有硬编码 key，本补丁未复制、使用或更改它；部署前应由维护者撤销已公开 key，单独迁往服务端代理。不要将 .env.local 上传或放入补丁。

刷新不会自动回到游戏，因为没有扩展为整站会话管理。重新上传同一 PDF，打开“笔记 / 举手”，即可读取笔记和分支；回溯使用已保存脚本。重新上传仍会执行原论文分析，可能发生额外 API 调用。

## 自动化验证

npm test：8 项 Vitest 测试通过（jsdom，不是真浏览器）。npm run typecheck 通过；npm run build 通过。生产构建有 >500kB chunk 提示，属于 SDK/原应用体积，不影响构建成功。

测试覆盖：PDF 身份稳定与跨论文隔离；服务重新导入仍读取持久化数据；局限、英文关键词、未分类与空输入；损坏 JSON 不被覆盖；配额失败传播；不可变分支快照；笔记编辑删除和规则整理保留手写内容；面板卸载重挂恢复；异步问答记录和回溯回调；GameScreen 模态阻止推进并恢复位置；回答保存失败后可重试。

问答 API 在测试中 mock，不调用真实密钥、不声称真实 Gemini 已验证。页面刷新通过服务重新导入及组件重挂模拟，不等同浏览器端到端刷新测试。

## 必须实际运行的验收

1. 通过 localhost/HTTPS 启动（SHA-256 需要 secure context），上传 PDF A，记一条笔记并提问；刷新浏览器，再上传 A，核对笔记、回答与回溯原句。上传内容不同但同名/同标题的 B，确认列表隔离。
2. 让 A 再生成不同脚本；打开旧分支，点击回溯，确认角色文本和后续播放来自旧快照。提问期间不能关闭面板，也不能推进主对话。
3. 测试空回答/网络失败/缺少 key，确认不保存假答案；模拟 localStorage 配额错误，确认错误提示、回答重试与无重复分支。
4. 手机窄屏、输入法、长对话、键盘焦点、屏幕阅读器验收。当前提供 role/label，但尚无完整焦点陷阱和 Escape 关闭，布局属于最小可用实现。

## 其他限制

localStorage 只在同 origin/浏览器 profile 内共享，清理站点数据会丢失，无跨设备同步、导出或加密；单次写入同步阻塞，长脚本快照会较快消耗容量。每个分支保存完整脚本优先正确性，规模增大可改成按 script revision 去重的 IndexedDB。

读最新文档再修改减少单页陈旧 state 覆盖，但不是跨标签事务；没有 storage event 同步、锁或冲突合并，多标签同时编辑可能丢更新。保存失败的手写字符不会被标为成功，但 controlled input 回退到上次保存值；需恢复存储后重新输入。不可用 localStorage 时面板只读/禁用写入。

不自动迁移社区 v1：旧 key 只有标题，不能可靠推断对应哪份 PDF。应先备份原值，再由用户明确关联论文后导入；本版没有实现迁移向导。代码未自动删除或重写旧 key。
