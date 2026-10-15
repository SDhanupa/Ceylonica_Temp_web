import { cleanMojibake } from './mojibake';

type GnLocation = {
  divisionalSecretariatCode?: string | null;
  dsEn?: string | null;
  dsSi?: string | null;
  dsTa?: string | null;
  nameEn?: string | null;
  nameSi?: string | null;
  nameTa?: string | null;
};

const text = (value?: string | null) => cleanMojibake(value).trim();
const normalized = (value?: string | null) => text(value).replace(/\s+/g, ' ').toLowerCase();
const translated = (value: string | null | undefined, script: RegExp) => {
  const label = text(value);
  return script.test(label) ? label : '';
};

/** Resolve labels once for both the location dialog and the GN page header.
 * Some imports omit DS translations but retain them on the same-name GN.
 * Only use a GN within the same DS, never a similarly named neighbouring area.
 */
export function buildDsDivisions(rows: readonly GnLocation[]) {
  const groups = new Map<string, GnLocation[]>();
  for (const row of rows) {
    const code = text(row.divisionalSecretariatCode) || text(row.dsEn);
    if (!code) continue;
    const group = groups.get(code) || [];
    group.push(row);
    groups.set(code, group);
  }

  return Array.from(groups, ([code, group]) => {
    const dsEn = group.map(row => text(row.dsEn)).find(Boolean) || code;
    const matchingGns = group.filter(row => normalized(row.nameEn) === normalized(dsEn));
    const resolve = (dsKey: 'dsSi' | 'dsTa', gnKey: 'nameSi' | 'nameTa', script: RegExp) =>
      group.map(row => translated(row[dsKey], script)).find(Boolean)
      || matchingGns.map(row => translated(row[gnKey], script)).find(Boolean)
      || dsEn;

    return {
      code,
      divisionalSecretariatCode: code,
      dsEn,
      dsSi: resolve('dsSi', 'nameSi', /[\u0D80-\u0DFF]/),
      dsTa: resolve('dsTa', 'nameTa', /[\u0B80-\u0BFF]/),
    };
  }).sort((a, b) => a.dsEn.localeCompare(b.dsEn));
}
