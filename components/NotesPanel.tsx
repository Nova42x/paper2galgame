import React, { useEffect, useRef, useState } from 'react';
import { DialogueLine } from '../types';
import { autoStructureDialogue, Branch, loadNotebook, makeBranch, mutateNotebook, Notebook } from '../services/notesService';
import { answerQuestion } from '../services/questionService';
interface Props { paperId: string; script: DialogueLine[]; index: number; onClose: () => void; onReturn: (branch: Branch) => void }
export function NotesPanel({ paperId, script, index, onClose, onReturn }: Props) {
  const [book, setBook] = useState<Notebook>({ version: 2, notes: [], branches: [] });
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState<Branch | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; try { setBook(loadNotebook(paperId)); setReady(true); } catch (e) { setError(String(e)); } return () => { alive.current = false; }; }, [paperId]);
  function commit(change: (b: Notebook) => Notebook): boolean {
    try { setBook(mutateNotebook(paperId, change)); setError(''); return true; }
    catch (e) { setError(`保存失败，原数据保留：${String(e)}`); return false; }
  }
  function add(content = '') {
    const note = { id: crypto.randomUUID(), title: '新笔记', content, updatedAt: new Date().toISOString() };
    commit(b => ({ ...b, notes: [note, ...b.notes] }));
  }
  async function ask() {
    if (lock.current || pending || !question.trim()) return;
    lock.current = true; setBusy(true); setError('');
    const snapshot = structuredClone(script), anchor = index, q = question.trim();
    try {
      const answer = await answerQuestion(snapshot, anchor, q);
      if (!alive.current) return;
      const branch = makeBranch(snapshot, anchor, q, answer);
      if (commit(b => ({ ...b, branches: [...b.branches, branch] }))) setQuestion('');
      else setPending(branch);
    } catch (e) { if (alive.current) setError(String(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <div role="dialog" aria-label="论文笔记与问答" className="absolute inset-0 z-50 bg-black/70 p-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
    <div className="bg-white rounded-xl p-5 w-full max-w-4xl max-h-full overflow-auto text-gray-800 select-text">
      <button disabled={busy || !!pending} onClick={onClose}>关闭</button>
      <p>本浏览器保存；规则整理只处理当前已读对话。关闭面板后手动继续播放。</p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={!ready}>
        <button onClick={() => add()}>新建笔记</button>{' '}
        <button onClick={() => add(autoStructureDialogue(script.slice(0, index + 1)))}>规则整理为新笔记</button>
        {book.notes.map(note => <article key={note.id} className="border p-2 my-2">
          <input aria-label="笔记标题" value={note.title} onChange={e => commit(b => ({ ...b, notes: b.notes.map(n => n.id === note.id ? { ...n, title: e.target.value, updatedAt: new Date().toISOString() } : n) }))} />
          <textarea aria-label="笔记内容" className="w-full border min-h-24" value={note.content} onChange={e => commit(b => ({ ...b, notes: b.notes.map(n => n.id === note.id ? { ...n, content: e.target.value, updatedAt: new Date().toISOString() } : n) }))} />
          <button onClick={() => commit(b => ({ ...b, notes: b.notes.filter(n => n.id !== note.id) }))}>删除笔记</button>
        </article>)}
        <h2>举手提问 · 原对话第 {index + 1} 句</h2>
        <p>回答依据已读讲解，不读取 PDF 原文。</p>
        <textarea aria-label="问题" value={question} onChange={e => setQuestion(e.target.value)} />
        <button disabled={busy || !!pending || !question.trim()} onClick={ask}>{busy ? '正在回答…' : '提问并保存分支'}</button>
        {pending && <div><pre className="whitespace-pre-wrap">{pending.answer}</pre><button onClick={() => { if (commit(b => ({ ...b, branches: [...b.branches.filter(x => x.id !== pending.id), pending] }))) { setPending(null); setQuestion(''); } }}>重试保存回答</button><button onClick={() => setPending(null)}>放弃未保存回答</button></div>}
        {book.branches.map(branch => <article key={branch.id} className="border p-2 my-2">
          <h3>{branch.question}</h3><p className="whitespace-pre-wrap">{branch.answer}</p>
          <blockquote>原第 {branch.index + 1} 句：{branch.script[branch.index].text}</blockquote>
          <button disabled={busy || !!pending} onClick={() => onReturn(branch)}>回到原对话位置</button>
        </article>)}
      </fieldset>
    </div>
  </div>;
}
