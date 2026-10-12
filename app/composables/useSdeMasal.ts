import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  SdeMasalConcept,
  SdeMasalItem,
  SdeMasalFilter,
  SdeMasalSummary,
  SdeMasalPenerima,
  SdeMasalTemplate,
  SdeMasalFolder,
  SdeMasalFolderItem,
  SdeMasalAttachmentRef,
} from '~/types/sde-masal';

/**
 * Composable untuk fitur SDE Masal (Surat Dinas Eksternal Massal).
 * Memanggil endpoint /sde-masal/* di backend.
 */
export const useSdeMasal = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi();

  const items = ref<SdeMasalItem[]>([]);
  const summary = ref<SdeMasalSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  const createFolder = async (data: Record<string, any>): Promise<SdeMasalFolder | null> => {
    const res: any = await apiPost('/sde-masal/folder', data);
    return res?.data ?? null;
  };

  const updateFolder = async (
    folderId: string,
    data: Record<string, any>
  ): Promise<SdeMasalFolder | null> => {
    const res: any = await apiPatch(`/sde-masal/folder/${folderId}`, data);
    return res?.data ?? null;
  };

  const fetchFolders = async (filter: Record<string, any> = {}) => {
    const params = Object.fromEntries(
      Object.entries(filter).filter(([, value]) => value !== '' && value != null)
    );
    return apiGet<any>('/sde-masal/folders', { params }, { skipCache: true });
  };

  const finalizeDirect = async (payload: {
    folderId: string;
    penerimaList: SdeMasalPenerima[];
    signOption: 'digsig' | 'qr_only' | 'ttd_basah';
    passphrase?: string;
    itemIds?: string[];
  }) => {
    const res: any = await apiPost('/sde-masal/finalize', payload);
    return res?.data ?? null;
  };

  const sendToSigner = async (folderId: string, ids: string[]) => {
    const res: any = await apiPost('/sde-masal/submit-verification', {
      folderId,
      ids,
      sendToSigner: true,
    });
    return res?.data ?? null;
  };

  const sendFolderEmails = async (
    folderId: string,
    emails?: Array<{ itemId: string; to: string; cc?: string; bcc?: string }>
  ) => {
    const res: any = await apiPost(`/sde-masal/folder/${folderId}/send-emails`, { emails });
    return res?.data ?? null;
  };

  const rejectFolder = async (folderId: string, reason: string) => {
    const res: any = await apiPost(`/sde-masal/folder/${folderId}/reject`, { reason });
    return res?.data ?? null;
  };

  const approveFolderVerification = async (folderId: string, catatan?: string) => {
    const res: any = await apiPatch(`/sde-masal/folder/${folderId}/approve-verification`, { catatan });
    return res?.data ?? null;
  };

  const rejectFolderVerification = async (folderId: string, catatan: string) => {
    const res: any = await apiPatch(`/sde-masal/folder/${folderId}/reject-verification`, { catatan });
    return res?.data ?? null;
  };

  const findNaskahInFolder = async (
    folderId: string
  ): Promise<{ folder: SdeMasalFolder; items: SdeMasalFolderItem[] } | null> => {
    const res: any = await apiGet(`/sde-masal/folder/${folderId}/naskah`, {}, { skipCache: true });
    return res?.data ?? null;
  };

  /**
   * Download template Excel.
   * @param skema - skema template, e.g. 'KEUANGAN' atau 'UMUM'
   */
  const downloadTemplate = async (skema?: string) => {
    try {
      const query = skema ? `?skema=${encodeURIComponent(skema)}` : '';
      const response = await fetch(
        (useApi().api?.defaults?.baseURL || '') + '/sde-masal/template' + query,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = skema?.toUpperCase().includes('KEUANGAN')
        ? 'template-sde-masal-keuangan.xlsx'
        : 'template-sde-masal.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Gagal download template:', e);
    }
  };

  /**
   * Generate massal SDE dari data wizard (Step 4).
   * Mengirim seluruh data wizard ke backend untuk diproses.
   */
  const generateMassal = async (payload: {
    folderId?: string;
    konsep: SdeMasalConcept;
    penerimaList: SdeMasalPenerima[];
    template: SdeMasalTemplate;
  }) => {
    const res: any = await apiPost('/sde-masal/generate', payload);
    return res?.data ?? null;
  };

  const submitVerification = async (ids: string[], verifikators: any[]) => {
    const res: any = await apiPost('/sde-masal/submit-verification', { ids, verifikators });
    return res?.data ?? null;
  };

  const fetchVerificationList = async (): Promise<SdeMasalItem[]> => {
    const res: any = await apiGet('/sde-masal/verification', {}, { skipCache: true });
    return res?.data ?? [];
  };

  const fetchVerificationFolders = async (): Promise<any[]> => {
    const res: any = await apiGet('/sde-masal/verification-folders', {}, { skipCache: true });
    return res?.data ?? [];
  };

  const approveVerification = async (id: string, catatan?: string) => {
    const res: any = await apiPatch(`/sde-masal/${id}/approve-verification`, { catatan });
    return res?.data ?? null;
  };

  const rejectVerification = async (id: string, catatan?: string) => {
    const res: any = await apiPatch(`/sde-masal/${id}/reject-verification`, { catatan });
    return res?.data ?? null;
  };

  /**
   * Parse Excel di sisi frontend untuk preview sebelum upload ke backend.
   * Menggunakan library xlsx yang sudah terinstall di frontend.
   * Membaca sheet "Data Penerima" (atau sheet pertama jika tidak ada).
   * Header case-insensitive.
   */
  const parseExcelLocal = async (
    file: File,
    expectedColumns: string[] = []
  ): Promise<SdeMasalPenerima[]> => {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    // Cari sheet "Data Penerima", fallback ke sheet pertama
    const sheetName =
      workbook.SheetNames.find((n) => n.toLowerCase().includes('data penerima')) ||
      workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // raw: false → kembalikan nilai sebagai teks terformat (seperti tampil di Excel).
    // Ini mencegah "119,117" diinterpretasikan sebagai angka 119117 (koma = pemisah ribuan).
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });

    // Header harus mengikuti skema template yang dipilih. Validasi dilakukan
    // sebelum mapping data agar file Keuangan tidak dapat dipakai untuk Umum,
    // maupun sebaliknya.
    const headerRow = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, range: 0 })[0] || [];
    const normalizeHeader = (value: unknown) =>
      String(value ?? '')
        .trim()
        .toLowerCase();
    const availableHeaders = new Set(headerRow.map(normalizeHeader).filter(Boolean));
    const missingColumns = expectedColumns.filter(
      (column) => !availableHeaders.has(normalizeHeader(column))
    );
    const isTemplateValid = missingColumns.length === 0;
    const templateValidationMessage = isTemplateValid
      ? undefined
      : `Template Excel tidak sesuai. Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`;

    // Helper: ambil nilai kolom case-insensitive
    const getCol = (row: any, ...keys: string[]): string => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.toLowerCase().trim() === k.toLowerCase().trim()) {
            const val = row[rowKey];
            if (val !== null && val !== undefined) return String(val).trim();
          }
        }
      }
      return '';
    };

    // Excel menyimpan "119;117" sebagai angka 119117 (koma = pemisah ribuan).
    // Kode eksternal = 3 digit, position ID internal = 8 digit (70xxxxxx).
    // Jika angka 6 digit (2 kode eksternal digabung, mis 119117), chunk per 3.
    // Jika angka 8 digit (position ID internal), JANGAN di-chunk.
    // Pemisah antar kode = titik koma (;).
    const reformatInternalTembusan = (value: string): string => {
      let raw = String(value || '').trim();
      if (!raw) return raw;
      // Koma dari format ribuan Excel ("70,016,742" → "70016742") dibuang.
      // Pola: koma di antara digit murni = pemisah ribuan, bukan pemisah kode.
      if (/^\d{1,3}(,\d{3})+$/.test(raw)) {
        raw = raw.replace(/,/g, '');
      }
      // Jika sudah ada titik koma, asumsikan sudah terformat dengan benar
      if (raw.includes(';')) return raw;
      // Jika ada koma sebagai pemisah kode (bukan format ribuan), ganti ke titik koma
      if (raw.includes(','))
        return raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(';');
      // Jika angka 6 digit (2 kode eksternal 3-digit digabung), chunk per 3
      if (/^\d{6}$/.test(raw)) {
        return raw.replace(/(\d{3})(?=\d)/g, '$1;');
      }
      // Position ID internal (8 digit, mis 70016742) — JANGAN di-chunk
      return raw;
    };

    const result: SdeMasalPenerima[] = [];
    let no = 0;
    rows.forEach((row) => {
      const perihalRow = getCol(row, 'Perihal', 'perihal');
      const tertujuRow = getCol(row, 'Tertuju', 'tertuju');
      const idTertuju = getCol(row, 'id_tertuju', 'idTertuju');
      const email = getCol(row, 'email', 'Email');
      const tembusan = getCol(row, 'tembusan', 'Tembusan');
      const tembusanInternal = getCol(
        row,
        'tembusan_internal',
        'tembusanInternal',
        'Tembusan Internal'
      );
      const tembusanEksternal = getCol(
        row,
        'tembusan_eksternal',
        'tembusanEksternal',
        'Tembusan Eksternal'
      );
      const isRevisionRaw = getCol(row, 'is_revision', 'isRevision');
      const emailTertuju = getCol(row, 'email_tertuju', 'emailTertuju');
      const emailCc = getCol(row, 'email_cc', 'emailCc');
      const emailBcc = getCol(row, 'email_bcc', 'emailBcc');
      const lampiran = getCol(row, 'lampiran', 'Lampiran');

      // Field skema keuangan / tagihan PINP
      const jumlahTagihanIdr = getCol(row, 'jumlah_tagihan_idr', 'jumlahTagihanIdr');
      const jumlahTagihanUsd = getCol(row, 'jumlah_tagihan_usd', 'jumlahTagihanUsd');
      const namaCro = getCol(row, 'nama_cro', 'namaCro');
      const emailCro = getCol(row, 'email_cro', 'emailCro');
      const jabatanSigner = getCol(row, 'jabatan_signer', 'jabatanSigner');
      const namaSigner = getCol(row, 'nama_signer', 'namaSigner');

      // Field skema umum / tagihan PJNP
      const jumlahLampiran = getCol(row, 'jumlah_lampiran', 'jumlahLampiran');
      const jabatanPenerima = getCol(row, 'jabatan_penerima', 'jabatanPenerima');
      const alamatPenerima = getCol(row, 'alamat_penerima', 'alamatPenerima');
      const panggilanPenerima = getCol(row, 'panggilan_penerima', 'panggilanPenerima');
      const nominalRupiah = getCol(row, 'nominal_rupiah', 'nominalRupiah');
      const nominalDolar = getCol(row, 'nominal_dolar', 'nominalDolar');
      const tembusan1 = getCol(row, 'tembusan_1', 'tembusan1');
      const tembusan2 = getCol(row, 'tembusan_2', 'tembusan2');
      const variables = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          String(key).trim().toLowerCase(),
          value === null || value === undefined ? '' : String(value).trim(),
        ])
      );

      // Baris dengan kolom yang tidak dikenali tetap perlu ditampilkan sebagai
      // invalid bila template tidak sesuai; jangan sampai preview terlihat kosong.
      const hasNoKnownValue =
        !perihalRow &&
        !idTertuju &&
        !email &&
        !tembusan &&
        !tembusanInternal &&
        !tembusanEksternal &&
        !emailTertuju &&
        !emailCc &&
        !emailBcc &&
        !lampiran &&
        !jumlahTagihanIdr &&
        !jumlahTagihanUsd &&
        !namaCro &&
        !emailCro &&
        !jabatanSigner &&
        !namaSigner &&
        !jumlahLampiran &&
        !jabatanPenerima &&
        !alamatPenerima &&
        !panggilanPenerima &&
        !nominalRupiah &&
        !nominalDolar &&
        !tembusan1 &&
        !tembusan2;
      const hasAnyValue = Object.values(row).some(
        (value) => value !== null && value !== undefined && String(value).trim() !== ''
      );

      // Hanya abaikan baris Excel yang benar-benar kosong.
      if (hasNoKnownValue && !hasAnyValue) {
        return;
      }

      // Skip baris tanpa perihal DAN tanpa tertuju/idTertuju — baris kosong/contoh
      if (!perihalRow && !tertujuRow && !idTertuju) {
        return;
      }

      no++;
      // Validasi: Perihal wajib
      const isValid = !!perihalRow && !!tertujuRow && isTemplateValid;
      const isRevision = isRevisionRaw === '1' || isRevisionRaw.toLowerCase() === 'true' ? 1 : 0;

      result.push({
        variables,
        no,
        persnum: '',
        nama: '',
        jabatan: '',
        tertuju: tertujuRow || idTertuju || '',
        alamat: null,
        kota: null,
        kodePos: null,
        keterangan: null,
        perihal: perihalRow || '',
        idTertuju: idTertuju || '',
        email: email || '',
        tembusan: tembusan || '',
        tembusanInternal: reformatInternalTembusan(tembusanInternal),
        tembusanEksternal: tembusanEksternal || '',
        isRevision,
        emailTertuju: emailTertuju || '',
        emailCc: emailCc || '',
        emailBcc: emailBcc || '',
        lampiran: lampiran || null,
        jumlahTagihanIdr: jumlahTagihanIdr || '',
        jumlahTagihanUsd: jumlahTagihanUsd || '',
        namaCro: namaCro || '',
        emailCro: emailCro || '',
        jabatanSigner: jabatanSigner || '',
        namaSigner: namaSigner || '',
        jumlahLampiran: jumlahLampiran || '',
        alamatPenerima: alamatPenerima || '',
        panggilanPenerima: panggilanPenerima || '',
        nominalRupiah: nominalRupiah || '',
        nominalDolar: nominalDolar || '',
        tembusan1: tembusan1 || '',
        tembusan2: tembusan2 || '',
        isValid,
        validationMessage: isValid
          ? undefined
          : templateValidationMessage || 'Perihal dan tertuju wajib diisi',
      });
    });

    return result;
  };

  /**
   * Ambil list SDE Masal dengan filter & pagination.
   */
  const fetchList = async (filter: SdeMasalFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      const res: any = await apiGet('/sde-masal', { params }, { skipCache: true });
      items.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat data';
      items.value = [];
      meta.value = null;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Ambil ringkasan dashboard.
   */
  const fetchSummary = async () => {
    try {
      const res: any = await apiGet('/sde-masal/summary', {}, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      return null;
    }
  };

  /**
   * Ambil detail satu item.
   */
  const fetchDetail = async (id: string): Promise<SdeMasalItem | null> => {
    const res: any = await apiGet(`/sde-masal/${id}`, {}, { skipCache: true });
    return res?.data ?? null;
  };

  /**
   * Ambil detail naskah SDE individual by naskahId.
   * Endpoint khusus SDE Masal — tidak ada access check ketat.
   */
  const fetchNaskahDetail = async (naskahId: string): Promise<any | null> => {
    const res: any = await apiGet(`/sde-masal/naskah/${naskahId}`, {}, { skipCache: true });
    return res?.data ?? null;
  };

  /**
   * Update item.
   */
  const updateItem = async (id: string, data: Partial<SdeMasalItem>) => {
    const res: any = await apiPatch(`/sde-masal/${id}`, data);
    return res?.data ?? null;
  };

  /**
   * Hapus item.
   */
  const deleteItem = async (id: string) => {
    await apiDelete(`/sde-masal/${id}`);
  };

  /**
   * Upload lampiran untuk item.
   */
  const uploadLampiran = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const formDataConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
    const res: any = await apiPost(`/sde-masal/${id}/lampiran`, formData, formDataConfig);
    return res?.data ?? null;
  };

  const prepareMassAttachments = async (
    folderId: string,
    file: File,
    requestedFileNames: string[]
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestedFileNames', JSON.stringify(requestedFileNames));
    const res: any = await apiPost(
      `/sde-masal/folder/${folderId}/lampiran-masal/prepare`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res?.data ?? null;
  };

  const commitMassAttachments = async (
    folderId: string,
    items: Array<{ itemId: string; attachments: SdeMasalAttachmentRef[] }>
  ) => {
    const res: any = await apiPost(`/sde-masal/folder/${folderId}/lampiran-masal/commit`, {
      items,
    });
    return res?.data ?? null;
  };

  return {
    items,
    summary,
    loading,
    error,
    meta,
    createFolder,
    updateFolder,
    fetchFolders,
    finalizeDirect,
    sendToSigner,
    sendFolderEmails,
    rejectFolder,
    approveFolderVerification,
    rejectFolderVerification,
    findNaskahInFolder,
    downloadTemplate,
    generateMassal,
    submitVerification,
    fetchVerificationList,
    fetchVerificationFolders,
    approveVerification,
    rejectVerification,
    parseExcelLocal,
    fetchList,
    fetchSummary,
    fetchDetail,
    fetchNaskahDetail,
    updateItem,
    deleteItem,
    uploadLampiran,
    prepareMassAttachments,
    commitMassAttachments,
  };
};
