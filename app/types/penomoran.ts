export interface PenomoranPayload {
  position_id: number;
  tanggal: string; // format YYYY-MM-DD
  id_position_penandatangan: number | string;
  penandatangan: string;
  jenis: string;
  klasifikasi: string;
  perihal: string;
  jumlah: number;
}

export interface PenomoranResponse {
  success: boolean;
  message?: string;
  data?: any;
}

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
  data?: any;
}

export interface NomorDetail {
  id: string | null;
  nomor: string | null;
  template_nomor: string | null;
  status: "pending" | "booking" | "terpakai" | "ditolak" | "hangus";
  checked?: boolean;
  file_name: string | null;
  file_text: string | null;
  file_url?: string | null;
}

export interface VerifikasiRequest {
  id: string;
  jenis: string;
  tanggal: string;
  perihal: string;
  penandatangan: string;
  jumlah: number;
  pengusul: string;
  tglUsulan: string;
  status: string;
  klasifikasi: string;
  file_path?: string;
  template_nomor?: string;
  details?: NomorDetail[];
}

export interface ApprovalPayload {
  detail_ids: string[];
}

export interface RejectionPayload {
  detail_ids: string[];
  keterangan: string;
}
