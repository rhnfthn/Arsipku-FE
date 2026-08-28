import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  SdeMasalConcept,
  SdeMasalItem,
  SdeMasalFilter,
  SdeMasalSummary,
  SdeMasalUploadResult,
  SdeMasalPenerima,
  SdeMasalTemplate,
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

  /**
   * Simpan konsep SDE Masal (Step 1).
   */
  const saveConcept = async (data: SdeMasalConcept) => {
    const res: any = await apiPost('/sde-masal/concept', data);
    return res?.data ?? null;
  };

  /**
   * Upload Excel (Step 2).
   */
  const uploadExcel = async (
    file: File,
    conceptId: string,
    skemaTemplate: string,
    versiTemplate: string
  ): Promise<SdeMasalUploadResult | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conceptId', conceptId);
    formData.append('skemaTemplate', skemaTemplate);
    formData.append('versiTemplate', versiTemplate);

    const formDataConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
    const res: any = await apiPost('/sde-masal/upload', formData, formDataConfig);
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
    conceptId?: string;
    konsep: SdeMasalConcept;
    penerimaList: SdeMasalPenerima[];
    template: SdeMasalTemplate;
  }) => {
    const res: any = await apiPost('/sde-masal/generate', payload);
    return res?.data ?? null;
  };

  /**
   * Generate naskah SDE individual per penerima.
   * Memanggil backend untuk membuat naskah + sirkulasi per item.
   * Body: { ids?: string[] } — jika kosong, proses semua yang MENUNGGU.
   */
  const generateNaskah = async (ids?: string[]) => {
    const res: any = await apiPost('/sde-masal/generate-naskah', { ids });
    return res?.data ?? null;
  };

  /**
   * Parse Excel di sisi frontend untuk preview sebelum upload ke backend.
   * Menggunakan library xlsx yang sudah terinstall di frontend.
   * Membaca sheet "Data Penerima" (atau sheet pertama jika tidak ada).
   * Header case-insensitive.
   */
  const parseExcelLocal = async (file: File): Promise<SdeMasalPenerima[]> => {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Cari sheet "Data Penerima", fallback ke sheet pertama
    const sheetName =
      workbook.SheetNames.find((n) => n.toLowerCase().includes('data penerima')) ||
      workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

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

    const result: SdeMasalPenerima[] = [];
    let no = 0;
    rows.forEach((row) => {
      const perihalRow = getCol(row, 'Perihal', 'perihal');
      const idTertuju = getCol(row, 'id_tertuju', 'idTertuju');
      const idramount = getCol(row, 'idramount');
      const usdamount = getCol(row, 'usdamount');
      const namacro = getCol(row, 'namacro');
      const email = getCol(row, 'email', 'Email');
      const tembusan = getCol(row, 'tembusan', 'Tembusan');
      const isRevisionRaw = getCol(row, 'is_revision', 'isRevision');
      const emailTertuju = getCol(row, 'email_tertuju', 'emailTertuju');
      const emailCc = getCol(row, 'email_cc', 'emailCc');
      const emailBcc = getCol(row, 'email_bcc', 'emailBcc');

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

      // Skip baris kosong (semua field kosong)
      if (
        !perihalRow &&
        !idTertuju &&
        !idramount &&
        !usdamount &&
        !namacro &&
        !email &&
        !tembusan &&
        !emailTertuju &&
        !emailCc &&
        !emailBcc &&
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
        !tembusan2
      ) {
        return;
      }

      no++;
      // Validasi: Perihal wajib
      const isValid = !!perihalRow;
      const isRevision = isRevisionRaw === '1' || isRevisionRaw.toLowerCase() === 'true' ? 1 : 0;

      result.push({
        no,
        persnum: '',
        nama: '',
        jabatan: '',
        tertuju: idTertuju || perihalRow || '',
        alamat: null,
        kota: null,
        kodePos: null,
        keterangan: null,
        perihal: perihalRow || '',
        idTertuju: idTertuju || '',
        idramount: idramount || '',
        usdamount: usdamount || '',
        namacro: namacro || '',
        email: email || '',
        tembusan: tembusan || '',
        isRevision,
        emailTertuju: emailTertuju || '',
        emailCc: emailCc || '',
        emailBcc: emailBcc || '',
        jumlahTagihanIdr: jumlahTagihanIdr || '',
        jumlahTagihanUsd: jumlahTagihanUsd || '',
        namaCro: namaCro || '',
        emailCro: emailCro || '',
        jabatanSigner: jabatanSigner || '',
        namaSigner: namaSigner || '',
        jumlahLampiran: jumlahLampiran || '',
        jabatanPenerima: jabatanPenerima || '',
        alamatPenerima: alamatPenerima || '',
        panggilanPenerima: panggilanPenerima || '',
        nominalRupiah: nominalRupiah || '',
        nominalDolar: nominalDolar || '',
        tembusan1: tembusan1 || '',
        tembusan2: tembusan2 || '',
        isValid,
        validationMessage: isValid ? undefined : 'Perihal wajib diisi',
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

  return {
    items,
    summary,
    loading,
    error,
    meta,
    saveConcept,
    uploadExcel,
    downloadTemplate,
    generateMassal,
    generateNaskah,
    parseExcelLocal,
    fetchList,
    fetchSummary,
    fetchDetail,
    fetchNaskahDetail,
    updateItem,
    deleteItem,
    uploadLampiran,
  };
};
