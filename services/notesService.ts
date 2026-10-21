import { DialogueLine } from '../types';
export interface Note { id: string; title: string; content: string; updatedAt: string }
export interface Branch { id: string; question: string; answer: string; createdAt: string; index: number; script: DialogueLine[] }
export interface Notebook { version: 2; notes: Note[]; branches: Branch[] }
const key = (id: string) => { if (!id) throw new Error('Missing PDF identity'); return `paper_notes_v2:${id}`; };
export async function paperIdentity(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export function loadNotebook(id: string): Notebook {
  const raw = localStorage.getItem(key(id));
  if (!raw) return { version: 2, notes: [], branches: [] };
  const data = JSON.parse(raw);
  if (data.version !== 2 || !Array.isArray(data.notes) || !Array.isArray(data.branches) ||
      !data.notes.every((n: Note) => typeof n.id === 'string' && typeof n.title === 'string' && typeof n.content === 'string' && typeof n.updatedAt === 'string') ||
      !data.branches.every((b: Branch) => typeof b.id === 'string' && typeof b.question === 'string' && typeof b.answer === 'string' && typeof b.createdAt === 'string' && Number.isInteger(b.index) && b.index >= 0 && Array.isArray(b.script) && b.index < b.script.length && b.script.every(l => typeof l.text === 'string' && typeof l.speaker === 'string' && ['normal','happy','angry','surprised','shy','proud'].includes(l.emotion)))) {
    throw new Error('笔记数据损坏或版本不兼容；未覆盖原数据');
  }
  return data;
}
// Always read the latest document before a mutation; storage failures propagate to UI.
export function mutateNotebook(id: string, change: (book: Notebook) => Notebook): Notebook {
  const book = change(loadNotebook(id));
  localStorage.setItem(key(id), JSON.stringify(book));
  return book;
}
export function makeBranch(script: DialogueLine[], index: number, question: string, answer: string): Branch {
  if (!script[index] || !question.trim() || !answer.trim()) throw new Error('Invalid question/answer anchor');
  return { id: crypto.randomUUID(), question, answer, index, script: structuredClone(script), createdAt: new Date().toISOString() };
}
export function autoStructureDialogue(script: DialogueLine[]): string {
  const rules: [string, RegExp][] = [
    ['局限', /不足|限制|未来工作|缺点|limitation|future work/i],
    ['实验', /实验|评测|数据集|结果|experiment|dataset|result/i],
    ['方法', /方法|算法|模型|架构|步骤|method|algorithm|model/i],
    ['背景', /背景|问题|动机|目标|background|motivation/i],
    ['结论', /结论|总结|启示|conclusion/i],
    ['其他', /[\s\S]/]
  ];
  const sections = new Map(rules.map(([name]) => [name, [] as string[]]));
  for (const line of script) {
    if (!line.text.trim()) continue;
    const [section] = rules.find(([, re]) => re.test(line.text))!;
    sections.get(section)!.push(`${line.speaker}: ${line.text}`);
  }
  return '# 规则整理（对话摘录，非论文摘要）\n\n' + [...sections]
    .filter(([, lines]) => lines.length).map(([name, lines]) => `## ${name}\n${lines.join('\n')}`).join('\n\n');
}
