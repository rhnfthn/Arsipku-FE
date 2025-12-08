// types/disposition.d.ts

// Struktur data mentah dari API Eksternal
export interface RawRecipient {
  persnum_person_text: string;
  position_text: string;
  position: string;
  // tambahkan properti lain jika ada di API asli
}

export interface RawApiResponse {
  sender?: any;
  recipients?: {
    ATASAN?: RawRecipient[];
    BAWAHAN?: RawRecipient[];
  };
}

// Struktur data yang sudah diformat untuk UI (Select Menu)
export interface RecipientOption {
  label: string;
  value: string;
  suffix: string;
  group: 'ATASAN' | 'BAWAHAN'; // Opsional, berguna untuk filtering
}

export interface FormattedRecipientData {
  sender: any;
  recipients: {
    ATASAN: RecipientOption[];
    BAWAHAN: RecipientOption[];
    ALL: RecipientOption[]; // Gabungan untuk mempermudah pencarian
  };
}
