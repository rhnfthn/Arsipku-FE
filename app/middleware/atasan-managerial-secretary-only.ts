export default defineNuxtRouteMiddleware(async () => {
  const { user, getProfile } = useAuth();

  if (!user.value) {
    await getProfile();
  }

  if (!user.value) return navigateTo('/beranda', { replace: true });

  try {
    const { apiGet } = useApi();
    const response: any = await apiGet(
      '/transfer-active-to-inactive/is-atasan',
      { validateStatus: () => true },
      { skipCache: true },
    );
    const isAtasan = response?.data?.isAtasan ?? response?.isAtasan ?? false;
    if (!isAtasan) return navigateTo('/beranda', { replace: true });
  } catch {
    return navigateTo('/beranda', { replace: true });
  }
});
