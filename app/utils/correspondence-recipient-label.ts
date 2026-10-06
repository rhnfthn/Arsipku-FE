import { toTitleCase } from './formatNama';
import { formatDelegatedPosition } from './delegation-display';

export function correspondenceRecipientLabel(item: any, suffix: 'organization' | 'area' | '' = ''): string {
  if (!item) return '';
  const raw = item.raw || item;
  const position = String(raw.position_text || raw.positionText || item.labelJob || item.label || '').trim();
  const abbreviation = String(raw.position_abbreviation || raw.abbreviation || item.abbreviation || '').trim();
  if (!item.isGroup && !item.is_group &&
      (/^GM(?:[-_\s]|$)/i.test(abbreviation) || /^(?:general\s+manager|GM)\b/i.test(position.replace(/^(?:PT|PH|PS)\.\s*/i, '')))) {
    const name = String(raw.persnum_person_text || raw.nama_sirkuler || raw.namaSirkuler || raw.nama || '').trim();
    return [toTitleCase(name), abbreviation || 'GM', formatDelegatedPosition(position, raw.position_status || raw.positionStatus)]
      .filter(Boolean).join(' - ');
  }
  const label = item.labelJob || item.label || position;
  const tail = suffix === 'organization' ? item.organization : suffix === 'area' ? raw.area_text : '';
  return tail ? `${label} - ${tail}` : label;
}
