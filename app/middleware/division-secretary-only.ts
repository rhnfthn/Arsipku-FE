export default defineNuxtRouteMiddleware(async () => {
  const { user, getProfile } = useAuth();

  if (!user.value) {
    await getProfile();
  }

  const positionStatus = String(user.value?.position_status ?? '')
    .trim()
    .toUpperCase();
  const positionText = String(user.value?.positionText ?? '');
  const tuRoles = Array.isArray(user.value?.tuRoles) ? user.value.tuRoles : [];
  const isAllowed =
    positionStatus === 'SE' ||
    /^\s*SE(?:\.|\s|$)/i.test(positionText) ||
    tuRoles.includes('sekretaris');

  if (!isAllowed) {
    return navigateTo('/beranda', { replace: true });
  }
});
