export interface RecipientPerson {
  position: number;
  position_text: string;
  position_abbreviation: string;
  chief: number;
  bod_tag: string | null;
  departType: string | null;
  persnum_person: number;
  persnum_person_text: string;
  organization_id: number;
  organization_text: string;
  organization_abbreviation: string;
  company_name: string;
}

export interface RecipientResponse {
  success: boolean;
  data: {
    sender: RecipientPerson;
    recipients: Record<string, RecipientPerson[]>; // Key bisa "ATASAN", "REKAN", dll
  };
}

// Interface untuk Dropdown UI
export interface SelectOption {
  label: string;
  value: number; // Menggunakan position ID sebagai value unik
  originalData?: RecipientPerson; // Menyimpan data asli jika butuh detail lain
}
