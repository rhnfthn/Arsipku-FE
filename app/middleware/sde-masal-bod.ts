export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return;

  const { user, getProfile } = useAuth();
  if (!user.value) await getProfile();

  const bodTag = String(user.value?.bodTag ?? '').trim().toUpperCase();
  const allowedBodTags = ['BOD', 'BOD-0', 'BOD-1', 'BOD-2', 'BOD-3'];

  if (allowedBodTags.includes(bodTag)) return;

  return navigateTo('/korespondensi/sde-masal/verifikasi', { replace: true });
});
