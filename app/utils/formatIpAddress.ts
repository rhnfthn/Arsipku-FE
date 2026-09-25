export const formatIpAddress = (ip: string | null | undefined): string => {
  if (!ip) return '-';

  const value = ip.trim();
  if (value.toLowerCase().startsWith('::ffff:')) return value.slice(7);
  if (value === '::1') return '127.0.0.1';

  return value;
};
