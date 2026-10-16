type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Never discard an old ID/token or silently create another row after 403/404. */
export async function saveSurveyRequest(
  payload: Record<string, any>, draftKey: string, storage: StorageLike, request = fetch,
) {
  const storedId = storage.getItem(`${draftKey}_db_id`);
  const id = payload.id || (storedId ? Number(storedId) : undefined);
  const token = id ? storage.getItem(`${draftKey}_edit_token`) : null;
  const response = await request('/api/industry-survey', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...payload, ...(id ? { id } : {}), ...(token ? { edit_token: token } : {}) }),
  });
  if (response.ok) {
    const result = await response.clone().json();
    if (result.survey?.id) storage.setItem(`${draftKey}_db_id`, String(result.survey.id));
    if (result.edit_token) storage.setItem(`${draftKey}_edit_token`, result.edit_token);
  }
  return response;
}

/** Restore original server answers, retaining a same-draft device's newer edits.
 * Back up the previous device state before replacing any storage keys.
 */
export function restoreRecoveredDraft(survey: any, token: string, key: string, storage: StorageLike) {
  const raw = storage.getItem(key);
  const oldId = storage.getItem(`${key}_db_id`);
  const oldToken = storage.getItem(`${key}_edit_token`);
  const fd = survey.form_data || {};
  const serverValues = fd.formValues || Object.fromEntries(
    Object.entries(fd)
      .filter(([name, value]) => !name.startsWith('_')
        && !['currentStep', 'surveyStartTime', 'gpsCoordinates'].includes(name)
        && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([name, value]) => [name, String(value)]),
  );
  let local: any = {};
  if (oldId === String(survey.id) && raw) {
    try { local = JSON.parse(raw) || {}; } catch { /* The raw backup below still preserves corrupt data. */ }
  }
  const draft = {
    formValues: { ...serverValues, ...(local.formValues || {}) },
    currentStep: Number.isInteger(local.currentStep) ? local.currentStep : (fd.currentStep || 0),
    surveyStartTime: local.surveyStartTime || fd.surveyStartTime || new Date().toISOString(),
    gpsCoordinates: local.gpsCoordinates || fd.gpsCoordinates || (
      survey.latitude != null && survey.longitude != null
        ? { lat: Number(survey.latitude), lng: Number(survey.longitude) } : null
    ),
  };
  if (raw || oldId || oldToken) {
    storage.setItem(`${key}_recovery_backup_${crypto.randomUUID()}`, JSON.stringify({ raw, id: oldId, editToken: oldToken }));
  }
  // Persist answers before credentials; quota errors must not discard the local draft.
  storage.setItem(key, JSON.stringify(draft));
  storage.setItem(`${key}_db_id`, String(survey.id));
  storage.setItem(`${key}_edit_token`, token);
  return draft;
}
