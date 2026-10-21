// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { autoStructureDialogue, loadNotebook, makeBranch, mutateNotebook, paperIdentity } from '../services/notesService';
import { NotesPanel } from '../components/NotesPanel';
import { GameScreen } from '../components/GameScreen';
import { DialogueLine } from '../types';
vi.mock('../services/questionService', () => ({ answerQuestion: vi.fn(async () => '模型回答') }));
const script: DialogueLine[] = [{ speaker: '丛雨', text: '背景问题', emotion: 'normal' }, { speaker: '丛雨', text: '模型方法', emotion: 'happy' }];
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
test('PDF bytes determine identity, not title; notes isolated and persisted across reloads', async () => {
  const a = await paperIdentity(new TextEncoder().encode('PDF A').buffer);
  const b = await paperIdentity(new TextEncoder().encode('PDF B').buffer);
  expect(a).not.toBe(b); expect(a).toBe(await paperIdentity(new TextEncoder().encode('PDF A').buffer));
  mutateNotebook(a, book => ({ ...book, notes: [{ id: '1', title: '相同标题', content: '内容', updatedAt: 'now' }] }));
  expect(loadNotebook(b).notes).toEqual([]);
  vi.resetModules();
  const reloaded = await import('../services/notesService');
  expect(reloaded.loadNotebook(a).notes[0].content).toBe('内容');
});
test('structure handles limitations, English and unmatched text without losing content', () => {
  const lines = ['模型限制与未来工作', 'Experiment dataset result', '普通对话', ''];
  const result = autoStructureDialogue(lines.map(text => ({ ...script[0], text })));
  expect(result).toContain('## 局限'); expect(result).toContain('## 实验'); expect(result).toContain('## 其他');
  for (const line of lines.filter(Boolean)) expect(result).toContain(line);
  expect(autoStructureDialogue([])).toContain('非论文摘要');
});
test('corruption never silently overwrites; quota failure propagates', () => {
  localStorage.setItem('paper_notes_v2:a', '{broken');
  expect(() => mutateNotebook('a', b => b)).toThrow();
  expect(localStorage.getItem('paper_notes_v2:a')).toBe('{broken');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => mutateNotebook('b', b => b)).toThrow('quota');
});
test('branch persists full immutable source and position', () => {
  const input = structuredClone(script);
  const branch = makeBranch(input, 1, '问题', '回答');
  input[1].text = 'changed';
  mutateNotebook('a', b => ({ ...b, branches: [branch] }));
  expect(loadNotebook('a').branches[0].script[1].text).toBe('模型方法');
  expect(loadNotebook('b').branches).toEqual([]);
});
test('UI edit/delete persist; structure creates new note; remount restores', () => {
  const props = { paperId: 'a', script, index: 1, onClose: vi.fn(), onReturn: vi.fn() };
  const view = render(<NotesPanel {...props} />);
  fireEvent.click(screen.getByText('新建笔记'));
  fireEvent.change(screen.getByLabelText('笔记内容'), { target: { value: '手写内容' } });
  fireEvent.click(screen.getByText('规则整理为新笔记'));
  expect(loadNotebook('a').notes).toHaveLength(2);
  expect(loadNotebook('a').notes[1].content).toBe('手写内容');
  view.unmount(); render(<NotesPanel {...props} />);
  expect(screen.getAllByLabelText('笔记内容')[1]).toHaveProperty('value', '手写内容');
  fireEvent.click(screen.getAllByText('删除笔记')[0]); expect(loadNotebook('a').notes).toHaveLength(1);
});
test('question UI records anchor, survives remount, returns original snapshot', async () => {
  const onReturn = vi.fn(); const props = { paperId: 'a', script, index: 1, onClose: vi.fn(), onReturn };
  const view = render(<NotesPanel {...props} />);
  fireEvent.change(screen.getByLabelText('问题'), { target: { value: '为什么？' } });
  fireEvent.click(screen.getByText('提问并保存分支'));
  await waitFor(() => expect(loadNotebook('a').branches).toHaveLength(1));
  view.unmount(); render(<NotesPanel {...props} script={[script[0]]} index={0} />);
  fireEvent.click(screen.getByText('回到原对话位置'));
  expect(onReturn.mock.calls[0][0].index).toBe(1);
  expect(onReturn.mock.calls[0][0].script).toEqual(script);
});
test('GameScreen modal blocks clicks and auto advance; return restores original line', () => {
  vi.useFakeTimers();
  mutateNotebook('a', b => ({ ...b, branches: [makeBranch(script, 1, '问题', '旧回答')] }));
  render(<GameScreen paperId="a" script={script} title="论文" onExit={vi.fn()} />);
  fireEvent.click(screen.getByText('Auto'));
  fireEvent.click(screen.getByText('笔记 / 举手'));
  vi.advanceTimersByTime(10000);
  expect(screen.getByText('举手提问 · 原对话第 1 句')).toBeTruthy();
  fireEvent.click(screen.getByText('新建笔记'));
  expect(screen.getByText('举手提问 · 原对话第 1 句')).toBeTruthy();
  fireEvent.click(screen.getByText('回到原对话位置'));
  fireEvent.click(screen.getByText('笔记 / 举手'));
  expect(screen.getByText('举手提问 · 原对话第 2 句')).toBeTruthy();
});
test('failed answer persistence retains response for retry without repeating API call', async () => {
  render(<NotesPanel paperId="a" script={script} index={0} onClose={vi.fn()} onReturn={vi.fn()} />);
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  fireEvent.change(screen.getByLabelText('问题'), { target: { value: '问题' } });
  fireEvent.click(screen.getByText('提问并保存分支'));
  await waitFor(() => expect(screen.getByText('重试保存回答')).toBeTruthy());
  expect(screen.getByText('模型回答')).toBeTruthy();
  spy.mockRestore(); fireEvent.click(screen.getByText('重试保存回答'));
  expect(loadNotebook('a').branches).toHaveLength(1);
});
