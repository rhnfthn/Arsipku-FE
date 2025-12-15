export interface Pengirim {
  id: string;
  nama_sirkuler: string;
  position_text: string;
  organization_text: string;
}

export interface Penerima {
  id: string;
  nama_sirkuler: string;
  position_text: string;
}

export interface LampiranFile {
  id: string;
  file_name: string;
  file_pdf: string;
}

export interface DetailDisposisi {
  disposisi: string;
  catatan: string;
  sifat?: string;
}

export interface NaskahDetail {
  id: string;
  jenis: string;
  jenis_label: string;
  sifat: string;
  nomor: string;
  tanggal: string;
  perihal: string;
  konten: string;
  status: string;
  pengirim: Pengirim;
  penerima: Penerima[];
  lampiran_files: LampiranFile[];
  detail_disposisi?: DetailDisposisi;
  nama_tempat?: string;
}
