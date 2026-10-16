import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/surveyDraftRecovery.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { saveSurveyRequest, restoreRecoveredDraft } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const makeStorage = (entries = {}) => {
  const map = new Map(Object.entries(entries));
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
};
for (const status of [403, 404, 500]) test(`${status} keeps original draft reference and never retries as a new row`, async () => {
  const storage = makeStorage({ draft: 'original answers', draft_db_id: '12', draft_edit_token: 'original-code' });
  let calls = 0;
  await saveSurveyRequest({ id: 12, status: 'draft' }, 'draft', storage, async (_, options) => {
    calls++;
    assert.equal(JSON.parse(options.body).id, 12);
    return new Response('{}', { status });
  });
  assert.equal(calls, 1);
  assert.equal(storage.getItem('draft_db_id'), '12');
  assert.equal(storage.getItem('draft_edit_token'), 'original-code');
  assert.equal(storage.getItem('draft'), 'original answers');
});
test('successful new save persists credentials for the next queued save', async () => {
  const storage = makeStorage();
  await saveSurveyRequest({ status: 'draft' }, 'draft', storage, async () => new Response(JSON.stringify({ survey: { id: 12 }, edit_token: 'new-code' })));
  await saveSurveyRequest({ status: 'draft' }, 'draft', storage, async (_, options) => {
    assert.equal(JSON.parse(options.body).id, 12);
    assert.equal(JSON.parse(options.body).edit_token, 'new-code');
    return new Response('{}');
  });
});
test('recovery keeps same ID, server-only answers, newer device answers and a raw local backup', () => {
  const raw = JSON.stringify({ formValues: { name: 'newer device value' }, currentStep: 5 });
  const storage = makeStorage({ draft: raw, draft_db_id: '12' });
  const result = restoreRecoveredDraft({ id: 12, form_data: { formValues: { name: 'old', photo: 'saved.jpg' }, currentStep: 2 } }, 'private-code', 'draft', storage);
  assert.deepEqual(result.formValues, { name: 'newer device value', photo: 'saved.jpg' });
  assert.equal(result.currentStep, 5);
  assert.equal(storage.getItem('draft_db_id'), '12');
  const backup = [...storage.map.entries()].find(([key]) => key.startsWith('draft_recovery_backup_'));
  assert.equal(JSON.parse(backup[1]).raw, raw);
});
test('a different draft is backed up, not merged into recovered answers', () => {
  const storage = makeStorage({ draft: JSON.stringify({ formValues: { wrong: 'other customer' } }), draft_db_id: '99' });
  const result = restoreRecoveredDraft({ id: 12, form_data: { b_name: 'Old flat answers', photo: 'saved.jpg' } }, 'private-code', 'draft', storage);
  assert.deepEqual(result.formValues, { b_name: 'Old flat answers', photo: 'saved.jpg' });
  assert.equal([...storage.map.keys()].filter(key => key.includes('_recovery_backup_')).length, 1);
});
test('backup failure leaves the original local answers and credentials untouched', () => {
  const storage = makeStorage({ draft: 'precious answers', draft_db_id: '12' });
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => restoreRecoveredDraft({ id: 12, form_data: {} }, 'private-code', 'draft', storage));
  assert.equal(storage.getItem('draft'), 'precious answers');
  assert.equal(storage.getItem('draft_db_id'), '12');
});
test('flat numeric answers are restored without treating metadata as survey answers', () => {
  const result = restoreRecoveredDraft({ id: 12, form_data: { employees: 0, active: false, currentStep: 2, surveyStartTime: '2026-01-01T00:00:00Z' } }, 'private-code', 'draft', makeStorage());
  assert.deepEqual(result.formValues, { employees: '0', active: 'false' });
  assert.equal(result.currentStep, 2);
});
