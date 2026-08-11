import { Note, DialogueLine } from '../types';

const STORAGE_PREFIX = 'paper_notes_v1:';

function storageKey(paperId: string) {
  return STORAGE_PREFIX + (paperId || 'global');
}

export const loadNotes = (paperId: string): Note[] => {
  try {
    const raw = localStorage.getItem(storageKey(paperId));
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
  } catch (e) {
    console.error('loadNotes error', e);
    return [];
  }
};

export const saveNotes = (paperId: string, notes: Note[]) => {
  try {
    localStorage.setItem(storageKey(paperId), JSON.stringify(notes));
  } catch (e) {
    console.error('saveNotes error', e);
  }
};

export const createNote = (paperId: string, title = 'New Note', content = ''): Note => {
  const now = new Date().toISOString();
  const note: Note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  const notes = loadNotes(paperId);
  notes.unshift(note);
  saveNotes(paperId, notes);
  return note;
};

export const updateNote = (paperId: string, updated: Note) => {
  const notes = loadNotes(paperId).map(n => n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n);
  saveNotes(paperId, notes);
  return notes;
};

export const deleteNote = (paperId: string, noteId: string) => {
  const notes = loadNotes(paperId).filter(n => n.id !== noteId);
  saveNotes(paperId, notes);
  return notes;
};

// Simple heuristic to structure dialogue into sections
export const autoStructureDialogue = (script: DialogueLine[]) => {
  const text = script.map(s => `${s.speaker}: ${s.text}`).join('\n');

  const keywords: Record<string, string[]> = {
    Background: ['背景', '问题', '动机', '目标'],
    Methodology: ['方法', '算法', '模型', '架构', '步骤'],
    Experiments: ['实验', '评测', '数据集', '结果'],
    Conclusion: ['结论', '总结', '启示'],
    Limitations: ['不足', '限制', '未来工作', '缺点'],
  };

  const sections: Record<string, string[]> = {
    Summary: [],
    Background: [],
    Methodology: [],
    Experiments: [],
    Conclusion: [],
    Highlights: [],
  };

  // collect highlights and section lines
  for (const line of script) {
    const l = line.text;
    let matched = false;
    for (const sectionName of Object.keys(keywords)) {
      for (const kw of keywords[sectionName]) {
        if (l.indexOf(kw) >= 0) {
          sections[sectionName].push(`${line.speaker}: ${l}`);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    // also collect short highlights
    if (l.length < 140 && (l.indexOf('重要') >= 0 || l.indexOf('创新') >= 0 || l.indexOf('关键') >= 0)) {
      sections.Highlights.push(`${line.speaker}: ${l}`);
    }
  }

  // summary: first 2 non-empty lines or an assembly
  const firstTexts = script.map(s => s.text).filter(Boolean).slice(0,3);
  sections.Summary = firstTexts;

  // build a structured object
  const structured = {
    summary: sections.Summary.join('\n'),
    background: sections.Background,
    methodology: sections.Methodology,
    experiments: sections.Experiments,
    conclusion: sections.Conclusion,
    highlights: sections.Highlights,
    bySpeaker: script.reduce<Record<string,string[]>>((acc, cur) => {
      acc[cur.speaker] = acc[cur.speaker] || [];
      acc[cur.speaker].push(cur.text);
      return acc;
    }, {}),
  };

  return structured;
};

export default {
  loadNotes,
  saveNotes,
  createNote,
  updateNote,
  deleteNote,
  autoStructureDialogue,
};
