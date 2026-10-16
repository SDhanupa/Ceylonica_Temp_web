// Keep presentation defensive even when a legacy response contains metadata.
export const PRIVATE_PROFILE_FIELDS = new Set([
  'b_nic', 'q_nic', 'q_dob_age', 'q_email', 'q_address', 'q_whatsapp',
  'q_mobile', 'b_mobile', 'b_photo', 'b_reg_no', 'b_type',
]);

export function publicProfileDetails(values: Record<string, unknown>) {
  const order = ['b_name', 'b_type_name', 'b_address', 'b_owner_name'];
  return Object.entries(values)
    .filter((entry): entry is [string, string] => {
      const [key, value] = entry;
      return !key.startsWith('_') && !PRIVATE_PROFILE_FIELDS.has(key)
        && typeof value === 'string' && value.trim() !== ''
        && !(key === 'q_owner_name' && value === values.b_owner_name);
    })
    .sort(([a], [b]) => (order.includes(a) ? order.indexOf(a) : 999)
      - (order.includes(b) ? order.indexOf(b) : 999));
}

export function publicPhotoUrls(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return [...new Set(value.split(',').map(path => path.trim()).filter(path =>
    path.startsWith('industry-survey/') && !path.includes('..') && !path.includes('\\'),
  ))].map(path => `/api/uploads/${path.split('/').map(encodeURIComponent).join('/')}`);
}
