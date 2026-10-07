import { toTitleCase } from './formatNama';
import { formatDelegatedPosition } from './delegation-display';

export function correspondenceRecipientLabel(item: any, suffix: 'organization' | 'area' | '' = '', includeAbbreviation = true): string {
  if (!item) return '';
  const raw = item.raw || item;
  const position = String(raw.position_text || raw.positionText || item.labelJob || item.label || '').trim();
  const abbreviation = String(raw.position_abbreviation || raw.abbreviation || item.abbreviation || '').trim();
  if (!item.isGroup && !item.is_group &&
      (/^GM(?:[-_\s]|$)/i.test(abbreviation) || /^(?:general\s+manager|GM)\b/i.test(position.replace(/^(?:PT|PH|PS)\.\s*/i, '')))) {
    const name = String(raw.persnum_person_text || raw.nama_sirkuler || raw.namaSirkuler || raw.nama || '').trim();
    const branch = [raw.area_text, raw.areaText, raw.sub_area_text, raw.subAreaText, item.area_text, item.sub_area_text]
      .map(value => String(value ?? '').trim()).find(Boolean) || '';
    const positionWithBranch = branch && !position.toLocaleLowerCase('id-ID').endsWith(branch.toLocaleLowerCase('id-ID'))
      ? `${position} - ${branch}` : position;
    return [toTitleCase(name), includeAbbreviation ? abbreviation || 'GM' : '', formatDelegatedPosition(positionWithBranch, raw.position_status || raw.positionStatus)]
      .filter(Boolean).join(' - ');
  }
  const label = item.labelJob || item.label || position;
  const tail = suffix === 'organization' ? item.organization : suffix === 'area' ? raw.area_text : '';
  return tail ? `${label} - ${tail}` : label;
}

export function sdiRecipientLabel(item: any, suffix: 'organization' | 'area' | '' = ''): string {
  return correspondenceRecipientLabel(item, suffix, false);
}
