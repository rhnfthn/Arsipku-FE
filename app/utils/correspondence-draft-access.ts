const draftEditorPaths = new Set([
  '/korespondensi/tulis/nota-dinas',
  '/korespondensi/tulis/surat-dinas-internal',
  '/korespondensi/tulis/surat-dinas-eksternal',
  '/korespondensi/tulis/disposisi',
  '/korespondensi/tulis/kajian',
  '/korespondensi/tulis/konsep/nota-dinas',
  '/korespondensi/tulis/konsep/surat-dinas-internal',
  '/korespondensi/tulis/konsep/surat-dinas-eksternal',
]);

/** Recognize existing drafts only on pages that actually load draft_id. */
export function isCorrespondenceDraftEdit(
  path: string,
  query: Record<string, unknown>,
): boolean {
  const draftId = Array.isArray(query.draft_id) ? query.draft_id[0] : query.draft_id;
  return draftEditorPaths.has(path.replace(/\/$/, '')) &&
    typeof draftId === 'string' && draftId.trim().length > 0;
}

export function isNaskahLainnyaDraftEdit(
  path: string,
  query: Record<string, unknown>,
): boolean {
  const draftId = Array.isArray(query.draft_id) ? query.draft_id[0] : query.draft_id;
  const mode = Array.isArray(query.mode) ? query.mode[0] : query.mode;
  return path.replace(/\/$/, '') === '/naskah-lainnya/tulis' &&
    mode !== 'data-sistem' && typeof draftId === 'string' && draftId.trim().length > 0;
}
