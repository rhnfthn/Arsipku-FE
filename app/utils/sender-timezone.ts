export type IndonesianTimeZone = 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';

export const INDONESIAN_TIME_LABELS: Record<IndonesianTimeZone, string> = {
  'Asia/Jakarta': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
};

// Nama wilayah dan kota pada snapshot area/subarea pengirim.
const EASTERN = /\b(?:maluku|papua|ambon|ternate|tidore|tual|saumlaki|namlea|namrole|dobo|jayapura|sentani|sorong|manokwari|biak|nabire|timika|merauke|wamena|fak[ -]?fak|kaimana|bintuni|serui)\b/i;
const CENTRAL = /\b(?:bali|denpasar|badung|ngurah rai|sulawesi|gorontalo|makassar|mat sc|matsc|manado|bitung|palu|kendari|mamuju|luwuk|pangkep|maros|toraja|nusa tenggara|ntb|ntt|lombok|mataram|sumbawa|bima|kupang|flores|ende|maumere|labuan bajo|waingapu|tambolaka|rote|alor|kalimantan (?:timur|selatan|utara)|kaltim|kalsel|kaltara|balikpapan|samarinda|banjarmasin|banjarbaru|tarakan|tanjung selor|berau|nunukan|malinau)\b/i;

export function resolveSenderTimeZone(sender: Record<string, unknown> | null | undefined): IndonesianTimeZone {
  if (!sender) return 'Asia/Jakarta';
  const explicit = String(sender.timeZone ?? sender.timezone ?? sender.time_zone ?? '');
  if (Object.hasOwn(INDONESIAN_TIME_LABELS, explicit)) return explicit as IndonesianTimeZone;
  const explicitLabel = explicit.toUpperCase();
  if (explicitLabel === 'WITA') return 'Asia/Makassar';
  if (explicitLabel === 'WIT') return 'Asia/Jayapura';
  if (explicitLabel === 'WIB') return 'Asia/Jakarta';
  // Subarea lebih spesifik daripada area; jangan membaca nama/jabatan pejabat.
  for (const value of [sender.kota, sender.sub_area_text, sender.subAreaText, sender.area_text, sender.areaText]) {
    const location = String(value ?? '');
    if (EASTERN.test(location)) return 'Asia/Jayapura';
    if (CENTRAL.test(location)) return 'Asia/Makassar';
    if (/\b(?:sumat[e]?ra|jawa|jakarta|tangerang|banten|kalimantan (?:barat|tengah)|kalbar|kalteng|pontianak|palangka ?raya)\b/i.test(location)) return 'Asia/Jakarta';
  }
  // Snapshot lama tanpa lokasi tetap memakai format WIB yang sudah digunakan.
  return 'Asia/Jakarta';
}

/** Timestamp BE tanpa offset selalu WIB; offset eksplisit/UTC tetap dihormati. */
export function formatSenderTimestamp(value: string, timeZone: IndonesianTimeZone, full = false): string {
  if (!value) return '-';
  const raw = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
    ? value.replace(' ', 'T') + '+07:00' : value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  const options: Intl.DateTimeFormatOptions = {
    timeZone, hour: '2-digit', minute: '2-digit', hour12: false,
    ...(full ? { day: '2-digit', month: 'long', year: 'numeric', second: '2-digit' } as const : {}),
  };
  return new Intl.DateTimeFormat('id-ID', options).format(date) + ' ' + INDONESIAN_TIME_LABELS[timeZone];
}
