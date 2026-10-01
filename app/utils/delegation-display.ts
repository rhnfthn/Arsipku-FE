export const formatDelegatedActorName = (
  name: unknown,
  _positionStatus: unknown,
): string => {
  return String(name ?? '').trim();
};

export const formatDelegatedPosition = (
  position: unknown,
  positionStatus: unknown,
): string => {
  const positionText = String(position ?? '').trim();
  const status = String(positionStatus ?? '').trim().toUpperCase();
  if (!['PT', 'PH', 'PS'].includes(status)) return positionText;
  return new RegExp(`^${status}\\.\\s*`, 'i').test(positionText)
    ? positionText
    : `${status}. ${positionText}`;
};
