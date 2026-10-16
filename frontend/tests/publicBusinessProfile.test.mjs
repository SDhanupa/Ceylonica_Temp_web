import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/utils/publicBusinessProfile.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { publicProfileDetails, publicPhotoUrls } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('private fields and internal metadata never become profile detail rows', () => {
  assert.deepEqual(publicProfileDetails({ b_nic: 'private', b_mobile: 'private', q_email: 'private',
    q_address: 'private', q_whatsapp: 'private', q_dob: 'private', q_dob_age: 'private', _edit_token_hash: 'private',
    b_photo: 'industry-survey/a.jpg', b_type: '1', b_reg_no: 'abc', b_name: 'Farm' }), [['b_name', 'Farm']]);
});
test('details preserve public answers, order key facts first and avoid duplicate owner', () => {
  assert.deepEqual(publicProfileDetails({ q_experience: '20', empty: ' ', b_owner_name: 'Owner', q_owner_name: 'Owner', b_name: 'Farm', invalid: {}, flag: false }),
    [['b_name', 'Farm'], ['b_owner_name', 'Owner'], ['q_experience', '20']]);
});
test('photos are deduplicated, encoded and confined to the existing upload endpoint', () => {
  assert.deepEqual(publicPhotoUrls(' industry-survey/a b.jpg,industry-survey/a b.jpg,https://other.test/a.jpg,industry-survey/../secret,industry-survey/c.jpg'),
    ['/api/uploads/industry-survey/a%20b.jpg', '/api/uploads/industry-survey/c.jpg']);
  assert.deepEqual(publicPhotoUrls(null), []);
  assert.deepEqual(publicPhotoUrls(''), []);
});
