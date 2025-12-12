// types/notaDinas.ts

export interface NotaDinasDraftPayload {
  pengirim: number
  penerima: number[]
  tembusan: number[]

  klasifikasi: string
  klasifikasi_text: string
  sifat: string
  perihal: string
  konten: string
  english: boolean

  nama_tempat: string
  nama_jabatan: string
  tanda_tangan: string
  nama_lengkap: string

  lampiran_files: string[]

  tgl: string // Format YYYY-MM-DD
  final_pdf?: string
}
