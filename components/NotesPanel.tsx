import React, { useEffect, useState } from 'react';
import { Note, DialogueLine } from '../types';
import NotesService from '../services/notesService';

interface Props {
  paperTitle: string;
  script: DialogueLine[];
  onClose: () => void;
}

export const NotesPanel: React.FC<Props> = ({ paperTitle, script, onClose }) => {
  const paperId = paperTitle || 'untitled';
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setNotes(NotesService.loadNotes(paperId));
  }, [paperId]);

  const refresh = () => setNotes(NotesService.loadNotes(paperId));

  const handleNew = () => {
    const n = NotesService.createNote(paperId, `笔记 ${new Date().toLocaleString()}`, '');
    setActiveId(n.id);
    refresh();
  };

  const handleSave = (note: Note) => {
    NotesService.updateNote(paperId, note);
    refresh();
  };

  const handleDelete = (id: string) => {
    NotesService.deleteNote(paperId, id);
    if (activeId === id) setActiveId(null);
    refresh();
  };

  const handleAutoStructure = (id?: string) => {
    const structured = NotesService.autoStructureDialogue(script);
    const content = [] as string[];
    content.push('## 自动整理的结构化笔记\n');
    if (structured.summary) content.push('### 摘要\n' + structured.summary + '\n');
    if (structured.background && structured.background.length) content.push('### 背景\n' + structured.background.join('\n') + '\n');
    if (structured.methodology && structured.methodology.length) content.push('### 方法\n' + structured.methodology.join('\n') + '\n');
    if (structured.experiments && structured.experiments.length) content.push('### 实验\n' + structured.experiments.join('\n') + '\n');
    if (structured.conclusion && structured.conclusion.length) content.push('### 结论\n' + structured.conclusion.join('\n') + '\n');
    if (structured.highlights && structured.highlights.length) content.push('### 要点\n' + structured.highlights.join('\n') + '\n');

    if (id) {
      const note = notes.find(n => n.id === id);
      if (note) {
        note.content = content.join('\n');
        NotesService.updateNote(paperId, note);
        refresh();
        return;
      }
    }

    const n = NotesService.createNote(paperId, `结构化笔记 ${new Date().toLocaleString()}`, content.join('\n'));
    setActiveId(n.id);
    refresh();
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6" style={{ zIndex: 9999 }}>
      <div className="bg-white w-full max-w-5xl h-[80%] rounded-xl overflow-hidden shadow-2xl flex">
        <div className="w-1/3 border-r p-4 overflow-y-auto bg-pink-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">笔记 — {paperTitle || '未命名'}</h3>
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-3 py-1 bg-gal-pink text-white rounded">新建</button>
              <button onClick={() => handleAutoStructure(activeId || undefined)} className="px-3 py-1 bg-blue-500 text-white rounded">自动整理</button>
            </div>
          </div>
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className={`p-2 rounded ${n.id===activeId? 'bg-white border-2 border-gal-pink':'bg-white/80'}`}>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm truncate">{n.title}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveId(n.id)} className="text-sm text-gray-600">打开</button>
                    <button onClick={() => handleDelete(n.id)} className="text-sm text-red-500">删除</button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{new Date(n.updatedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-2/3 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">编辑区</div>
            <div className="flex gap-2">
              <button onClick={() => { onClose(); }} className="px-3 py-1 bg-gray-200 rounded">关闭</button>
              <button onClick={() => { const active = notes.find(n=>n.id===activeId); if(active) handleSave(active); }} className="px-3 py-1 bg-gal-pink text-white rounded">保存</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeId ? (
              (() => {
                const active = notes.find(n => n.id === activeId)!;
                if (!active) return <div className="text-gray-500">请选择一个笔记</div>;
                return (
                  <div className="h-full flex flex-col">
                    <input value={active.title} onChange={(e)=>{ active.title = e.target.value; NotesService.updateNote(paperId, active); refresh(); }} className="w-full mb-2 p-2 border rounded" />
                    <textarea value={active.content} onChange={(e)=>{ active.content = e.target.value; NotesService.updateNote(paperId, active); refresh(); }} className="w-full h-full p-3 border rounded resize-none" />
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">尚未打开笔记。点击左侧“打开”或新建一条笔记</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
