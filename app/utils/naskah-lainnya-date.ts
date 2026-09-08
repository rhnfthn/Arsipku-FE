type DateInput = string | number | Date | null | undefined;

function parseDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/** Standar tanggal tampilan Naskah Lainnya: DD/MM/YYYY. */
export function formatNaskahDate(value: DateInput, fallback = '—'): string {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${twoDigits(date.getDate())}/${twoDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Standar tanggal dan waktu Naskah Lainnya: DD/MM/YYYY HH:mm. */
export function formatNaskahDateTime(value: DateInput, fallback = '—'): string {
  const date = parseDate(value);
  if (!date) return fallback;
  return `${formatNaskahDate(date, fallback)} ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}
