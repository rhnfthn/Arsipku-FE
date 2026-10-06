export default defineNuxtRouteMiddleware(async () => {
  const { user, getProfile } = useAuth();
  if (!user.value) {
    try {
      await getProfile();
    } catch {
      return;
    }
  }

  const bodTag = String(user.value?.bodTag ?? '')
    .trim()
    .toUpperCase();
  const positionText = String(user.value?.positionText ?? '').toUpperCase();
  const isAllowed =
    bodTag === 'BOD' ||
    bodTag === 'BOD-1' ||
    /\b(EVP|DIREKTUR|DIRUT|DIRECTOR|CEO|PRESIDEN|PRESIDENT|BOD)\b/.test(positionText);

  if (!isAllowed) {
    return navigateTo('/beranda', { replace: true });
  }
});
