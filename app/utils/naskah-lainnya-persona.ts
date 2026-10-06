/** Status delegasi menerangkan jabatan, bukan nama orang. */
export function normalizeNaskahPersona<
  T extends {
    nama?: string;
    jabatan?: string;
    positionStatus?: string;
    position_status?: string;
    delegator?: string;
    delegatePositionStatus?: string | null;
  },
>(persona: T): T {
  const name = persona.nama || '';
  const prefix = name.match(/^(PT|PH|PS)\.\s*/i);
  const status = (
    persona.positionStatus ||
    persona.position_status ||
    persona.delegatePositionStatus ||
    persona.delegator ||
    prefix?.[1] ||
    ''
  ).toUpperCase();
  const position = persona.jabatan || '';
  return {
    ...persona,
    nama: prefix ? name.slice(prefix[0].length) : name,
    jabatan:
      /^(PT|PH|PS)$/.test(status) && position
        ? `${status}. ${position.replace(/^(PT|PH|PS)\.\s*/i, '')}`
        : position,
  };
}

export function naskahPersonaLabel(persona?: {
  nama?: string;
  jabatan?: string;
  abbreviation?: string | null;
}): string {
  if (!persona) return '-';
  const person = normalizeNaskahPersona(persona);
  const position = [
    persona.abbreviation ? `(${persona.abbreviation.toUpperCase()})` : '',
    person.jabatan,
  ]
    .filter(Boolean)
    .join(' ');
  return [person.nama, position].filter(Boolean).join(' - ') || '-';
}

/**
 * Nama persona saja (tanpa jabatan) — dipakai sel tabel yang menampilkan
 * nama dan jabatan di baris terpisah.
 */
export function naskahPersonaName(persona?: {
  nama?: string;
  jabatan?: string;
}): string {
  if (!persona) return '-';
  return normalizeNaskahPersona(persona).nama || '-';
}

/**
 * Jabatan persona saja (dengan prefix delegasi + abbreviation) — dipakai sel
 * tabel yang menampilkan nama dan jabatan di baris terpisah.
 */
export function naskahPersonaPosition(persona?: {
  nama?: string;
  jabatan?: string;
  abbreviation?: string | null;
}): string {
  if (!persona) return '';
  const person = normalizeNaskahPersona(persona);
  return [
    persona.abbreviation ? `(${persona.abbreviation.toUpperCase()})` : '',
    person.jabatan,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Default paraf: semua direktur selain penandatangan, dengan pemrakarsa wajib disertakan. */
export function defaultNaskahDiketahuiDirectors<
  T extends { positionId?: string; persnum?: number; nama: string },
>(
  directors: T[],
  signers: { positionId?: string; persnum?: number; nama: string }[],
  required: T[] = []
): T[] {
  const sameDirector = (
    left: { positionId?: string; persnum?: number; nama: string },
    right: { positionId?: string; persnum?: number; nama: string }
  ) => {
    if (left.positionId && right.positionId)
      return String(left.positionId) === String(right.positionId);
    if (left.persnum && right.persnum) return Number(left.persnum) === Number(right.persnum);
    return !!left.nama && left.nama.trim().toLowerCase() === right.nama.trim().toLowerCase();
  };
  const selected = directors.filter(
    (director) => !signers.some((signer) => sameDirector(director, signer))
  );
  for (const director of required) {
    if (!selected.some((item) => sameDirector(item, director))) selected.push(director);
  }
  return selected;
}

/** Bila pemrakarsa juga menandatangani, paraf memerlukan direktur lain. */
export function validateNaskahSheetDirectors(
  sheet: {
    direkturPemrakarsa?: { positionId?: string; persnum?: number; nama: string }[];
    diketahuiOleh?: {
      positionId?: string;
      persnum?: number;
      nama: string;
      delegatePersnum?: number;
      delegateName?: string;
    }[];
  },
  signers: { positionId?: string; persnum?: number; nama: string }[]
): string | null {
  const initiator = sheet.direkturPemrakarsa?.[0];
  if (!initiator) return 'Direktur Pemrakarsa wajib dipilih.';
  const includesInitiator = (sheet.diketahuiOleh || []).some((director) => {
    if (initiator.positionId && director.positionId) {
      return String(initiator.positionId) === String(director.positionId);
    }
    if (initiator.persnum && director.persnum) return initiator.persnum === director.persnum;
    return (
      !!initiator.nama && initiator.nama.trim().toLowerCase() === director.nama.trim().toLowerCase()
    );
  });
  if (!includesInitiator)
    return 'Direktur Pemrakarsa wajib ada pada Diketahui Oleh dan tidak boleh dihapus.';
  const samePerson = (person: { positionId?: string; persnum?: number; nama: string }) =>
    (initiator.positionId && person.positionId && initiator.positionId === person.positionId) ||
    (initiator.persnum && person.persnum && initiator.persnum === person.persnum) ||
    (!!initiator.nama && initiator.nama.trim().toLowerCase() === person.nama.trim().toLowerCase());
  if (
    signers.some(samePerson) &&
    !(sheet.diketahuiOleh || []).some(
      (director) =>
        !samePerson({
          ...director,
          persnum: director.delegatePersnum || director.persnum,
          nama: director.delegateName || director.nama,
        })
    )
  ) {
    return 'Penandatangan juga Direktur Pembina/Pemrakarsa. Pilih direktur lain yang relevan pada Diketahui Oleh.';
  }
  return null;
}

/** Normalisasi identitas pada respons daftar/detail, termasuk snapshot lama. */
export function normalizeNaskahPersonas<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalizeNaskahPersonas) as T;
  if (!value || typeof value !== 'object') return value;
  const object = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeNaskahPersonas(item)])
  );
  return ('nama' in object && 'jabatan' in object ? normalizeNaskahPersona(object) : object) as T;
}
