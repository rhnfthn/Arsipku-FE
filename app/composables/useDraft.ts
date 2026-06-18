import { ref } from 'vue';
import { useApi } from './useApi';

// Parse tanpa asumsi UTC — baca sebagai waktu lokal
const parseLocalDate = (isoString: string): Date | null => {
  if (!isoString) return null;
  // "2025-04-11T18:30:00" tanpa Z/offset → JS anggap UTC, geser +7 jadi 01:xx.
  // Strip timezone suffix lalu buat Date dari string yang dianggap lokal.
  const normalized =
    isoString
      .replace('Z', '') // buang UTC marker
      .split('+')[0] // buang offset positif
      .split('-').length > 3 // ada offset negatif? (e.g. -07:00)
      ? isoString.slice(0, 19)
      : isoString.slice(0, 19).replace('T', ' ');
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
};

const formatDateShort = (isoString: string) => {
  const date = parseLocalDate(isoString);
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const formatFullDate = (isoString: string, time: string) => {
  const date = parseLocalDate(isoString);
  if (!date) return '-';
  const d = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${d} ${time || ''}`;
};

const getInitial = (name: string) => (name ? name.substring(0, 2).toUpperCase() : 'NA');

const getRandomColor = (id: string) => {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-emerald-100 text-emerald-600',
    'bg-indigo-100 text-indigo-600',
    'bg-orange-100 text-orange-600'
  ];
  const charCode = id ? id.charCodeAt(0) : 0;
  return colors[charCode % colors.length] || colors[0];
};

export interface DraftParams {
  page?: number;
  limit?: number;
  jenis?: string;
  search?: string;
  sort?: string;
  start_date?: string;
  end_date?: string;
  is_konsep?: boolean;
}

export const useDraft = () => {
  const { get, post, del, api } = useApi();

  const isLoadingDraft = ref(false);
  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);
  const drafts = ref([]);
  const summary = ref<any>(null);

  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    from: 0,
    to: 0
  });

  const fetchDrafts = async (params: DraftParams = {}) => {
    pending.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      const reqPage = params.page || pagination.value.page || 1;
      const reqLimit = params.limit || pagination.value.limit || 10;

      query.append('page', reqPage.toString());
      query.append('limit', reqLimit.toString());

      if (params.search) query.append('q', params.search);
      if (params.jenis && params.jenis !== 'ALL') query.append('jenis', params.jenis);
      if (params.sort) query.append('sort', params.sort);
      if (params.start_date) query.append('start_date', params.start_date);
      if (params.end_date) query.append('end_date', params.end_date);
      if (params.is_konsep) query.append('is_konsep', 'true');

      const response = await get(`/draft/list?${query.toString()}`);
      const rawData = response?.data || [];
      const meta = response?.pagination || {};

      summary.value = response?.summary || null;

      const totalItems = meta.total || 0;
      const currentPage = meta.page || reqPage;
      const currentLimit = meta.limit || reqLimit;
      const totalPages = meta.totalPages || 1;

      const from = totalItems === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
      const to = Math.min(currentPage * currentLimit, totalItems);

      pagination.value = {
        total: totalItems,
        page: currentPage,
        limit: currentLimit,
        totalPages: totalPages,
        from: from,
        to: to
      };

      items.value = rawData.map((item: any) => {
        const listPenerima = item.penerima || [];
        let displayRecipient = 'Tanpa Penerima';
        let displayNameForInitial = 'NA';
        let fullRecipientList = 'Tanpa Penerima';

        if (listPenerima.length > 0) {
          const firstPerson = listPenerima[0];
          const jenisSurat = (item.jenis || '').toUpperCase();
          const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL'].includes(jenisSurat);

          let primaryName = isSDE
            ? firstPerson.nama
            : firstPerson.position_text || firstPerson.nama;

          if (!primaryName) primaryName = 'Tanpa Nama';
          displayNameForInitial = primaryName;

          displayRecipient =
            listPenerima.length > 1
              ? `${primaryName} +${listPenerima.length - 1} lainnya`
              : primaryName;

          fullRecipientList = listPenerima
            .map(
              (p: any, index: number) =>
                `${index + 1}. ${isSDE ? p.nama : p.position_text || p.nama}`
            )
            .join('\n');
        }

        return {
          id: item.id_naskah,
          isDraftKonsep: item.is_draft_konsep || false,
          jenisAsli: (item.jenis || '').toUpperCase(), // ← TAMBAHKAN INI
          from: displayRecipient,
          fullRecipients: fullRecipientList,
          subject: item.isi_pesan || 'Tanpa Keterangan',
          body: item.isi_pesan,
          nomor: item.nomor || '-',
          category: item.jenis || '',
          category_text: item.jenis_text || item.jenis,
          category_label: item.labels || [],
          date: formatDateShort(item.tanggal),
          fullDate: formatFullDate(item.tanggal, item.waktu),
          waktu: item.waktu || '', // ← pastikan baris ini ADA
          created_at: item.tanggal,
          initial: getInitial(displayNameForInitial),
          color: getRandomColor(item.id_naskah || '0'),
          isRead: true,
          isStarred: false,
          originalData: item
        };
      });
    } catch (err) {
      console.error('Fetch drafts error:', err);
      error.value = err;
      items.value = [];
      summary.value = null;
      pagination.value = { ...pagination.value, total: 0, from: 0, to: 0 };
    } finally {
      pending.value = false;
    }
  };

  const multipartConfig = {
    headers: { 'Content-Type': 'multipart/form-data' }
  };

  const saveDraft = async (formData: FormData, id_draft?: string | null) => {
    isLoadingDraft.value = true;
    try {
      let response;
      if (id_draft) {
        response = await api.patch(`/ND/update-draft/${id_draft}`, formData, multipartConfig);
      } else {
        response = await api.post(`/ND/save-draft`, formData, multipartConfig);
      }
      return response.data;
    } catch (error: any) {
      console.error('Save Draft Error:', error);
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  const sendMessage = async (formData: FormData) => {
    isLoadingDraft.value = true;
    try {
      const response = await api.post(`/ND/send-message`, formData, multipartConfig);
      return response.data;
    } catch (error: any) {
      console.error('Send Message Error:', error);
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  const getDraftDetail = async (idNaskah: string) => {
    isLoadingDraft.value = true;
    try {
      return await get(`/ND/${idNaskah}`);
    } catch (error: any) {
      console.error('Gagal ambil detail:', error);
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  const generatePdf = async (payload: any) => {
    try {
      const config = useRuntimeConfig();
      const url = `${config.public.apiBaseUrl}/ND/generate-pdf`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal generate PDF');
      return await res.blob();
    } catch (error) {
      console.error('Generate PDF Error:', error);
      throw error;
    }
  };

  const deleteDraft = async (idNaskah: string) => {
    pending.value = true;
    try {
      await del(`/draft/delete/${idNaskah}`);
      items.value = items.value.filter((i) => i.id !== idNaskah);
      if (pagination.value.total > 0) {
        pagination.value.total -= 1;
        pagination.value.to = Math.min(
          pagination.value.page * pagination.value.limit,
          pagination.value.total
        );
      }
      return true;
    } catch (err: any) {
      throw err;
    } finally {
      pending.value = false;
    }
  };

  const bulkDeleteDrafts = async (naskahIds: string[], positionId: number) => {
    pending.value = true;
    try {
      await post(`/draft/bulk-delete`, {
        position_id: positionId,
        naskah_ids: naskahIds
      });
      items.value = items.value.filter((i) => !naskahIds.includes(i.id));
      if (pagination.value.total > 0) {
        pagination.value.total -= naskahIds.length;
        pagination.value.to = Math.min(
          pagination.value.page * pagination.value.limit,
          pagination.value.total
        );
      }
      return true;
    } catch (err: any) {
      throw err;
    } finally {
      pending.value = false;
    }
  };

  return {
    items,
    pagination,
    pending,
    error,
    summary,
    drafts,
    fetchDrafts,
    deleteDraft,
    bulkDeleteDrafts,
    getDraftDetail,
    generatePdf,
    sendMessage,
    saveDraft
  };
};
