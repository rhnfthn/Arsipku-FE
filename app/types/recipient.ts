// types/recipients.ts

/** ------------------------------
 *  SENDER TYPE (pengirim nota dinas)
 *  berasal dari: data.sender
 * ------------------------------ */
export interface SenderInfo {
  position: number
  position_text: string
  position_abbreviation: string
  chief: number
  bod_tag: string | null
  departType: string | null
  persnum_person: number
  persnum_person_text: string
  organization_id: number
  organization_text: string
  organization_abbreviation: string
  organization_parent: number
  organization_parent_text: string
  sub_area: number
  sub_area_text: string
  area: string
  area_text: string
  level: number
  divisi_id: number | null
  divisi_name: string | null
  direktorat_id: number | null
  direktorat_name: string | null
  company: number
  company_name: string
}

/** ---------------------------------
 *  RECIPIENT ITEM (tiap orang tujuan)
 *  berasal dari tiap array di:
 *  data.recipients.ATASAN / REKAN / dst
 * ---------------------------------- */
export interface RecipientItem {
  position: number
  position_text: string
  position_abbreviation: string
  chief: number
  bod_tag: string | null
  departType: string | null
  persnum_person: number
  persnum_person_text: string
  organization_id: number
  organization_text: string
  organization_abbreviation: string
  organization_parent: number
  organization_parent_text: string
  sub_area: number
  sub_area_text: string
  area: string
  area_text: string
  level: number
  divisi_id: number | null
  divisi_name: string | null
  direktorat_id: number | null
  direktorat_name: string | null
  company: number
  company_name: string

  /** tambahan untuk hasil normalize */
  group?: string
  routing_source?: 'structural' | 'configured'
  routing_rule_ids?: string[]
  routing_effect?: 'ALLOW_SELECT' | 'AUTO_INCLUDE'
  routing_mandatory?: boolean
}

/** ---------------------------------
 *  TIPE UNTUK OBJECT GROUP RECIPIENTS
 *  Contoh struktur:
 *  recipients: {
 *    ATASAN: RecipientItem[]
 *    REKAN: RecipientItem[]
 *    BAWAHAN: RecipientItem[]
 *  }
 * ---------------------------------- */
export type RecipientGroups = Record<string, RecipientItem[]>

/** ---------------------------------
 *  TIPE ROOT RESPONSE GET /ND/get-recipient/{positionId}
 * ---------------------------------- */
export interface RecipientApiData {
  sender: SenderInfo
  recipients: RecipientGroups
}

export interface RecipientApiResponse {
  success: boolean
  data: RecipientApiData
}
