export default defineNuxtRouteMiddleware(async () => {
  const { user, getProfile } = useAuth();
  const { isEvpOrAbovePosition } = await import('~/utils/evp-access');
  if (!user.value) {
    try {
      await getProfile();
    } catch {
      return;
    }
  }

  if (!isEvpOrAbovePosition(user.value)) {
    return navigateTo('/beranda', { replace: true });
  }
});
