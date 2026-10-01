import type { CorrespondenceDocumentType } from '~/composables/useCorrespondenceRoutingAccess';

const documentTypeFromPath = (path: string): CorrespondenceDocumentType | null => {
  if (path.includes('/surat-dinas-internal')) return 'SDI';
  if (path.includes('/surat-dinas-eksternal')) return 'SDE';
  if (path.includes('/nota-dinas')) return 'ND';
  if (path.includes('/disposisi')) return 'DI';
  if (path.includes('/kajian')) return 'KA';
  return null;
};

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  // Membuat konsep dari disposisi adalah aksi lanjutan pada naskah yang sudah
  // ada, bukan pembuatan naskah baru dari menu tulis. Jangan blokir alur ini
  // hanya karena user tidak memiliki capability membuat ND/SDI/SDE mandiri.
  const workflow = Array.isArray(to.query.workflow) ? to.query.workflow[0] : to.query.workflow;
  const refJenis = Array.isArray(to.query.ref_jenis) ? to.query.ref_jenis[0] : to.query.ref_jenis;
  const refId = Array.isArray(to.query.ref_id) ? to.query.ref_id[0] : to.query.ref_id;
  if (
    to.path.startsWith('/korespondensi/tulis/konsep/') &&
    String(workflow || '').toLowerCase() === 'konsep' &&
    String(refJenis || '').toUpperCase() === 'DI' &&
    Boolean(refId)
  ) {
    return;
  }

  const { user, getProfile } = useAuth();
  const { canCreateCorrespondence, fetchCapabilities } = useCorrespondenceRoutingAccess();
  if (!user.value) await getProfile();

  const path = to.path;
  const bodTag = String(user.value?.bodTag ?? '').trim();
  const positionText = String(user.value?.positionText ?? '').toUpperCase();

  // Kajian hanya untuk fungsional/staf (chief=0). bodTag maupun nama jabatan
  // dipakai sebagai guard tambahan karena snapshot organisasi tidak selalu
  // mengisi bodTag secara konsisten.
  if (
    path === '/korespondensi/tulis/kajian' &&
    (bodTag !== '' || /\b(EVP|AVP|VP)\b/.test(positionText))
  ) {
    return navigateTo('/beranda');
  }

  const documentType = documentTypeFromPath(to.path);
  if (!documentType) return;

  await fetchCapabilities();
  if (!canCreateCorrespondence(documentType)) {
    return navigateTo('/beranda');
  }
});
