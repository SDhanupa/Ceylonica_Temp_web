import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Run this small TS utility with Node's built-in test runner, without adding dependencies.
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText).toString('base64')}`;
const mojibakeUrl = moduleUrl(await readFile(new URL('../src/utils/mojibake.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/utils/dsDivisions.ts', import.meta.url), 'utf8'))
  .replace("'./mojibake'", JSON.stringify(mojibakeUrl));
const { buildDsDivisions } = await import(moduleUrl(source));

const galen = {
  divisionalSecretariatCode: 'LK7127', dsEn: 'Galenbindunuwewa', dsSi: null, dsTa: null,
  nameEn: 'Galenbindunuwewa', nameSi: 'ගලෙන්බිඳුණුවැව', nameTa: 'கலென்பிந்துநுவேவா',
};

test('missing DS translations use the same-name GN in that DS, keeping English and codes', () => {
  const [option] = buildDsDivisions([galen]);
  assert.equal(option.dsSi, galen.nameSi);
  assert.equal(option.dsTa, galen.nameTa);
  assert.equal(option.dsEn, galen.dsEn);
  assert.equal(option.code, galen.divisionalSecretariatCode);
  assert.equal(option.divisionalSecretariatCode, galen.divisionalSecretariatCode);
});

test('later valid DS translations beat blank/English placeholders and GN fallback', () => {
  const direct = { ...galen, nameEn: 'Another village', dsSi: 'ගලෙන්බිඳුණුවැව කොට්ඨාසය', dsTa: 'பிரிவு' };
  const [option] = buildDsDivisions([{ ...galen, dsSi: 'Galenbindunuwewa', dsTa: ' ' }, direct]);
  assert.equal(option.dsSi, direct.dsSi);
  assert.equal(option.dsTa, direct.dsTa);
});

test('same-name matching ignores case and surrounding whitespace, but not different villages', () => {
  assert.equal(buildDsDivisions([{ ...galen, nameEn: '  GALENBINDUNUWEWA  ' }])[0].dsSi, galen.nameSi);
  assert.equal(buildDsDivisions([{ ...galen, nameEn: 'Galenbindunuwewa North' }])[0].dsSi, galen.dsEn);
});

test('never borrows a translation from a different DS', () => {
  const options = buildDsDivisions([
    { ...galen, nameEn: 'Another village', nameSi: null, nameTa: null },
    { ...galen, divisionalSecretariatCode: 'OTHER' },
  ]);
  assert.equal(options.find(option => option.code === 'LK7127').dsSi, galen.dsEn);
});

test('input rows remain unchanged and empty records are handled', () => {
  const rows = Object.freeze([Object.freeze({ ...galen }), Object.freeze({})]);
  assert.equal(buildDsDivisions(rows).length, 1);
  assert.equal(rows[0].dsSi, null);
  assert.deepEqual(buildDsDivisions([]), []);
});

test('all Anuradhapura DS options have Sinhala labels using the local database', {
  skip: !process.env.LOCAL_LOCATION_CHECK,
}, async () => {
  const response = await fetch('http://localhost:3003/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ pDistricts { admin2NameEn gramaNiladharis { divisionalSecretariatCode dsEn dsSi dsTa nameEn nameSi nameTa } } }' }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.errors, undefined);
  const district = result.data.pDistricts.find(row => row.admin2NameEn === 'Anuradhapura');
  assert.ok(district);
  const options = buildDsDivisions(district.gramaNiladharis);
  assert.ok(options.length > 0);
  for (const option of options) assert.match(option.dsSi, /[\u0D80-\u0DFF]/, option.dsEn);
  assert.equal(options.find(option => option.code === 'LK7127').dsSi, galen.nameSi);
  console.log(`Verified Sinhala labels for ${options.length} Anuradhapura DS divisions.`);
});
