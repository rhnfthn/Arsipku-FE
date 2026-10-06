import type { NaskahListItem } from '../types/naskah-lainnya';
import { naskahPersonaLabel } from './naskah-lainnya-persona';

/** Pencarian tabel mencakup kedua identitas: pejabat pemrakarsa dan konseptor. */
export function matchesNaskahSearch(
  item: NaskahListItem,
  search: string,
  extraFields: (string | undefined)[] = []
): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [
    item.nomor,
    item.perihal,
    naskahPersonaLabel(item.pemrakarsaPejabat ?? item.pemrakarsa),
    naskahPersonaLabel(item.pemrakarsa),
    item.jenis,
    item.tahapan.replace(/_/g, ' '),
    item.tanggal,
    ...extraFields,
  ].some((value) => (value ?? '').toLowerCase().includes(query));
}
