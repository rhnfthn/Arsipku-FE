// ~/composables/useTerkirim.ts
import { ref } from 'vue';
import { useApi } from './useApi';

const toWibDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  // Input dari BE adalah UTC (suffix Z). Tambahkan 7 jam untuk WIB.
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const formatDateTime = (value: string | null | undefined): string => {
  const d = toWibDate(value);
  if (!d) return '-';
  return dateTimeFormatter.format(d);
};

export interface SentParams {
  page?: number;
  limit?: number;
  jenis?: string;
  status_baca?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  arsip?: boolean;
  favorite?: boolean;
  priority?: boolean;
}

export const useSirkulasi = () => {
  const { apiGet, post, apiPatch } = useApi();

  const items = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const summary = ref<any>(null);

  const fetchSentBox = async (params: SentParams = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.jenis && !['ALL', 'Semua'].includes(params.jenis))
        query.append('jenis', params.jenis);
      if (params.status_baca && params.status_baca !== 'Semua')
        query.append('status_baca', params.status_baca);
      if (params.search) query.append('search', params.search);
      if (params.start_date) query.append('start_date', params.start_date);
      if (params.end_date) query.append('end_date', params.end_date);
      if (params.sort) query.append('sort', params.sort);
      if (params.arsip) query.append('arsip', 'true');
      if (params.favorite) query.append('favorite', 'true');
      if (params.priority) query.append('priority', 'true');

      const res = await apiGet(`/naskah_sirkulasi/sent/?${query.toString()}`, {}, { skipCache: params.search ? true : false });

      // Samakan normalisasi dengan useInbox agar pagination & summary selalu terbaca
      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data) ? responseBody.data : [];

      if (responseBody?.pagination) pagination.value = responseBody.pagination;
      if (responseBody?.summary) summary.value = responseBody.summary;

      items.value = rawItems.map((item: any) => {
        const listPenerima = item.penerima || [];
        const isSDE = ['SDE', 'EXTERNAL', 'EKSTERNAL'].includes((item.jenis || '').toUpperCase());

        let displayRecipient = 'Tanpa Penerima';
        let fullRecipientList = 'Tanpa Penerima';
        let firstRecipientTitle = 'Tanpa Penerima';
        let initialLetter = '?';

        if (listPenerima.length > 0) {
          const first = listPenerima[0];
          const primaryName =
            (isSDE ? first.nama : first.position_text || first.nama) || 'Tanpa Nama';

          firstRecipientTitle = first.position_text || first.nama || 'Tanpa Penerima';
          initialLetter = primaryName.charAt(0).toUpperCase();
          displayRecipient =
            listPenerima.length > 1
              ? `${primaryName} +${listPenerima.length - 1} lainnya`
              : primaryName;
          fullRecipientList = listPenerima
            .map(
              (p: any, idx: number) => `${idx + 1}. ${isSDE ? p.nama : p.position_text || p.nama}`
            )
            .join('\n');
        }

        return {
          id: item.id_naskah,
          naskahId: item.id_naskah,
          id_sirkulasi: item.id_sirkulasi,
          fullRecipients: fullRecipientList,
          from: displayRecipient,
          email: firstRecipientTitle,
          subject: item.perihal || '-',
          body: item.nomor || '-',
          category: item.jenis,
          category_label: item.jenis_label,
          date: formatDateTime(item.created_at),
          fullDate: item.created_at || item.tanggal,
          initial: initialLetter,
          viewCount: item.summary_baca?.terbaca || 0,
          isRead: true,
          isFlagged: ['rahasia', 'penting', 'segera'].includes((item.sifat || '').toLowerCase()),
          isLocked: item.is_locked,
          isArchived: item.arsip, // field dari API (bukan is_arsip)
          isStarred: item.favorit, // field dari API (bukan is_favorit)
          is_priority: item.is_priority,
          recipient: listPenerima.map((p: any) => p.position_text || p.nama).join(', '),
          labels: item.labels || [],
          originalData: item
        };
      });
    } catch (err: any) {
      console.error('Fetch Sent Box Error:', err);
      error.value = err.message || 'Terjadi kesalahan jaringan';
      items.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const toggleFlag = async (mail: any, flagType: 'favorit' | 'arsip') => {
    const oldVal = flagType === 'favorit' ? mail.isStarred : mail.isArchived;
    try {
      const idToSend =
        mail.id_sirkulasi || mail.originalData?.id_sirkulasi || mail.naskahId || mail.id;
      if (!idToSend) throw new Error('ID tidak ditemukan');
      await apiPatch('/naskah_sirkulasi/toggle-flag', {
        id_sirkulasi: idToSend,
        flag_type: flagType
      });
    } catch (err) {
      console.error('Gagal toggle flag:', flagType, err);
      if (flagType === 'favorit') mail.isStarred = oldVal;
      else mail.isArchived = oldVal;
      throw err;
    }
  };

  const bulkActionSent = async (payload: {
    position_id: number;
    naskah_ids: string[];
    action: string;
  }) => {
    isLoading.value = true;
    try {
      return await post('/naskah_sirkulasi/sent/bulk-action', payload);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSentNavigation = async (idNaskah: string, jenis?: string) => {
    try {
      const query = new URLSearchParams();
      if (jenis && !['ALL', 'Semua'].includes(jenis)) query.append('jenis', jenis);
      const res: any = await apiGet(
        `/naskah_sirkulasi/sent/${encodeURIComponent(idNaskah)}/navigation${query.toString() ? `?${query.toString()}` : ''}`,
        {},
        { skipCache: true },
      );

      const navData = res?.data ?? res;
      return {
        current: navData?.current ?? null,
        previous: navData?.previous ?? null,
        next: navData?.next ?? null,
      };
    } catch (err) {
      console.error('fetchSentNavigation error:', err);
      return { current: null, previous: null, next: null };
    }
  };

  return { items, pagination, summary, isLoading, error, fetchSentBox, bulkActionSent, toggleFlag, fetchSentNavigation };
};
