import { correspondenceRecipientLabel } from './correspondence-recipient-label';
import type { SdeMasalConcept, SdeMasalPenerima } from '~/types/sde-masal';

/** Format an ISO date without parsing it as UTC (which can shift the day). */
export function formatSdeMasalDate(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '[Tanggal Surat]';

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Konversi nilai tembusan (bisa berupa kode seperti "112" atau "112 — PT Garuda")
 * menjadi nama penerima eksternal. Data master diambil dari store tertuju eksternal.
 */
let tertujuEksternalLookup: { kode?: string; nama: string }[] = [];

export function setTertujuEksternalLookup(data: { kode?: string; nama: string }[]) {
  tertujuEksternalLookup = data || [];
}

// Lookup position ID internal → jabatan (position_text) dari org-data.
let internalPositionLookup: { position: string; position_text: string }[] = [];

export function setInternalPositionLookup(
  data: { position: string | number; position_text?: string }[]
) {
  internalPositionLookup = (data || []).map((row) => ({
    position: String(row.position ?? ''),
    position_text: correspondenceRecipientLabel({ raw: row }),
  }));
}

/**
 * Resolve kode tembusan eksternal (dipisah koma) menjadi daftar nama.
 * "119,117" → ["PT Telkom Indonesia", "PT Garuda Indonesia"]
 */
export function resolveTembusanEksternalNames(value: string | null | undefined): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  return raw
    .split(';')
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => {
      const found = tertujuEksternalLookup.find(
        (item) =>
          String(item.kode ?? '')
            .trim()
            .padStart(3, '0') === code.padStart(3, '0')
      );
      return found?.nama || code;
    });
}

/**
 * Resolve position ID tembusan internal (dipisah koma) menjadi daftar jabatan.
 * "119,117" → ["EVP of Technology Solution", "VP of Network"]
 */
export function resolveTembusanInternalNames(value: string | null | undefined): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  return raw
    .split(';')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      const found = internalPositionLookup.find((item) => String(item.position) === id);
      return found?.position_text || id;
    });
}

/**
 * Bangun blok tembusan bernomor (hardcoded): eksternal dulu, lalu internal.
 * Return string dengan <br> sebagai pemisah baris untuk konten HTML.
 * Fallback: jika tembusanInternal/tembusanEksternal kosong, gunakan kolom
 * tembusan lama sebagai tembusan eksternal (kompatibel data Excel lama).
 */
export function buildTembusanBlock(p: SdeMasalPenerima | null): string {
  if (!p) return '';
  const eksternal = p.tembusanEksternal || p.tembusan || '';
  const names = [
    ...resolveTembusanEksternalNames(eksternal),
    ...resolveTembusanInternalNames(p.tembusanInternal),
  ];
  if (!names.length) return '';
  return names.map((nama, idx) => `${idx + 1}. ${nama}`).join('<br>');
}

export function resolveTembusanLabel(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  // Ambil kode di awal (sebelum pemisah — atau -)
  const code = raw
    .split(/\s*(?:—|-)\s*/)[0]
    .trim()
    .padStart(3, '0');
  const found = tertujuEksternalLookup.find(
    (item) =>
      String(item.kode ?? '')
        .trim()
        .padStart(3, '0') === code
  );
  // Tampilkan nama saja (tanpa kode)
  return found?.nama || raw.replace(/^\s*\d+\s*(?:—|-)\s*/, '').trim() || raw;
}

/**
 * Render konten template SDE Masal dengan variabel penerima.
 * Dipakai bersama oleh SdeMasalLetterPreview (HTML preview) dan
 * SdeMasalExcelPreview (PDF preview via /SDE/preview-pdf).
 */
export function renderSdeMasalKonten(
  templateKonten: string,
  p: SdeMasalPenerima | null,
  konsep: SdeMasalConcept | null,
  recipientCompanyName?: string | null
): string {
  const html = templateKonten || '<p>(Konten kosong)</p>';
  if (!p) return html;

  // Helper: ambil nilai dari variables (Excel) dulu, lalu field langsung
  const val = (key: string): string => {
    const k = key.toLowerCase();
    const v = p.variables?.[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
    const direct = (p as any)[key];
    if (direct !== undefined && direct !== null && direct !== '') return String(direct);
    return '';
  };

  const nama = val('nama');
  const jabatan = val('jabatan') || p.jabatanPenerima || '';
  const tertuju =
    recipientCompanyName ||
    p.idTertuju ||
    p.tertuju ||
    (nama && jabatan ? `${nama} - ${jabatan}` : nama || jabatan || '-');

  // Tembusan: replace dengan lookup yang sudah dimuat (untuk preview HTML).
  // Untuk PDF, backend juga me-replace placeholder yang tersisa sebagai fallback.
  const tembusanBlock = buildTembusanBlock(p);
  const tembusan1Label = p.tembusan1 || (p.tembusan ? p.tembusan.split(';')[0] : '');
  const tembusan2Label = p.tembusan2 || (p.tembusan ? p.tembusan.split(';')[1] || '' : '');

  return (
    html
      .replace(/\{\{tertuju\}\}/g, tertuju)
      .replace(/\{\{nama\}\}/g, nama || '-')
      .replace(/\{\{jabatan\}\}/g, jabatan || '-')
      .replace(/\{\{persnum\}\}/g, val('persnum') || p.persnum || p.kodePos || '-')
      .replace(/\{\{keterangan\}\}/g, val('keterangan') || '-')
      .replace(/\{\{alamat\}\}/g, val('alamat') || p.alamat || '-')
      .replace(/\{\{kota\}\}/g, val('kota') || p.kota || '-')
      .replace(/\{\{kode_pos\}\}/g, val('kode_pos') || p.kodePos || '-')
      .replace(/\{\{kodepos\}\}/g, val('kodepos') || p.kodePos || '-')
      .replace(/\{\{perihal\}\}/g, p.perihal || konsep?.perihal || '-')
      .replace(/\{\{id_tertuju\}\}/g, recipientCompanyName || p.idTertuju || '-')
      .replace(/\{\{email\}\}/g, val('email') || p.email || '-')
      // {{tembusan}} → blok bernomor dari lookup frontend (eksternal dulu, lalu internal).
      // Jika lookup belum termuat, placeholder tetap utuh → backend yang replace.
      .replace(/\{\{tembusan\}\}/g, tembusanBlock || '{{tembusan}}')
      .replace(/\{\{email_tertuju\}\}/g, val('email_tertuju') || p.emailTertuju || '-')
      .replace(/\{\{email_cc\}\}/g, val('email_cc') || p.emailCc || '-')
      .replace(/\{\{email_bcc\}\}/g, val('email_bcc') || p.emailBcc || '-')
      .replace(
        /\{\{jumlah_tagihan_idr\}\}/g,
        val('jumlah_tagihan_idr') || p.jumlahTagihanIdr || '-'
      )
      .replace(
        /\{\{jumlah_tagihan_usd\}\}/g,
        val('jumlah_tagihan_usd') || p.jumlahTagihanUsd || '-'
      )
      .replace(/\{\{nama_cro\}\}/g, val('nama_cro') || p.namaCro || '-')
      .replace(/\{\{email_cro\}\}/g, val('email_cro') || p.emailCro || '-')
      .replace(/\{\{jabatan_signer\}\}/g, val('jabatan_signer') || p.jabatanSigner || '-')
      .replace(/\{\{nama_signer\}\}/g, val('nama_signer') || p.namaSigner || '-')
      .replace(
        /\{\{tanggal_surat\}\}/g,
        formatSdeMasalDate(konsep?.tanggalKonsep)
      )
      .replace(/\{\{nomor_surat\}\}/g, '[Nomor Surat]')
      .replace(/\{\{sifat_surat\}\}/g, konsep?.sifat || 'Biasa')
      .replace(/\{\{jumlah_lampiran\}\}/g, val('jumlah_lampiran') || p.jumlahLampiran || '-')
      .replace(/\{\{jabatan_penerima\}\}/g, val('jabatan_penerima') || p.jabatanPenerima || '-')
      .replace(
        /\{\{alamat_penerima\}\}/g,
        val('alamat_penerima') || p.alamatPenerima || p.alamat || 'Di tempat'
      )
      .replace(
        /\{\{panggilan_penerima\}\}/g,
        val('panggilan_penerima') || p.panggilanPenerima || 'Bapak/Ibu'
      )
      .replace(/\{\{nominal_rupiah\}\}/g, val('nominal_rupiah') || p.nominalRupiah || '-')
      .replace(/\{\{nominal_dolar\}\}/g, val('nominal_dolar') || p.nominalDolar || '-')
      .replace(/\{\{tembusan_1\}\}/g, resolveTembusanLabel(tembusan1Label) || '-')
      .replace(/\{\{tembusan_2\}\}/g, resolveTembusanLabel(tembusan2Label) || '-')
      // Variabel dinamis dari Excel (selain yang sudah dikenali di atas).
      // {{tembusan_internal}} dan {{tembusan_eksternal}} di-replace dengan
      // list bernomor dari lookup frontend; jika lookup belum termuat,
      // placeholder tetap utuh → backend yang replace.
      .replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (match, key: string) => {
        const normalized = key.trim().toLowerCase();
        // Fallback: kolom tembusan lama dipakai bila kolom baru kosong
        // (kompatibel dengan data Excel lama yang hanya punya kolom tembusan).
        const legacy = p.tembusan || '';
        if (normalized === 'tembusan_internal') {
          const names = resolveTembusanInternalNames(p.tembusanInternal || legacy);
          return names.length ? names.map((n, i) => `${i + 1}. ${n}`).join('<br>') : match;
        }
        if (normalized === 'tembusan_eksternal') {
          const names = resolveTembusanEksternalNames(p.tembusanEksternal || legacy);
          return names.length ? names.map((n, i) => `${i + 1}. ${n}`).join('<br>') : match;
        }
        if (normalized === 'tembusan') {
          return match; // sudah di-replace di atas
        }
        const value = p.variables?.[normalized];
        return value !== undefined && value !== null && value !== '' ? String(value) : match;
      })
  );
}
