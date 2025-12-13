export interface PenomoranPayload {
  position_id: number;
  tanggal: string; // format YYYY-MM-DD
  id_position_penandatangan: number | string;
  jenis: string;
  klasifikasi: string;
  perihal: string;
  jumlah: number;
}

export interface PenomoranResponse {
  success: boolean;
  message?: string;
  data?: any; // sesuaikan kalau BE punya struktur jelas
}

// bisa di penomoran.ts atau file terpisah
export interface BookingFile {
  file_name: string;
  file_text: string;
}

export interface BookingPayload {
  files: BookingFile[];
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: any; // sesuaikan BE
}
