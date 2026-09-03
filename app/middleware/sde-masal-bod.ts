export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return;

  const { user, getProfile } = useAuth();
  if (!user.value) {
    try {
      await getProfile();
    } catch {
      // Jika getProfile gagal (token expired, network error, dll),
      // biarkan middleware auth yang handle redirect ke login.
      return;
    }
  }

  const bodTag = String(user.value?.bodTag ?? '')
    .trim()
    .toUpperCase();
  const allowedBodTags = ['BOD', 'BOD-0', 'BOD-1', 'BOD-2', 'BOD-3'];

  // BOD (Direksi) dan pejabat managerial (chief=1: EVP, VP, AVP) boleh akses.
  if (allowedBodTags.includes(bodTag)) return;

  // Cek apakah user adalah pejabat managerial (chief=1) dari org_data.
  // AVP, VP, EVP punya chief=1 → boleh membuat SDE Masal.
  const positionText = String(user.value?.positionText ?? '').toUpperCase();
  const managerialKeywords = ['EVP', 'VP ', 'AVP', 'DIREKTUR', 'DIREKTUR UTAMA'];
  if (managerialKeywords.some((kw) => positionText.includes(kw))) return;

  return navigateTo('/korespondensi/sde-masal/verifikasi', { replace: true });
});
