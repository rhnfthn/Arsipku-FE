export const stripKonsepPerihalPrefix = (
  value: unknown,
  jenis: 'ND' | 'SDI' | 'SDE',
): string => {
  const perihal = String(value ?? '');
  const prefix = `konsep-${jenis}-`;

  return perihal.toLowerCase().startsWith(prefix.toLowerCase())
    ? perihal.slice(prefix.length).trimStart()
    : perihal;
};
