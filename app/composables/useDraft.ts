import { ref } from "vue";
import { useApi } from "./useApi";

// --- HELPERS ---
const formatDateShort = (isoString: string) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatFullDate = (isoString: string, time: string) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const d = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${d} ${time || ""}`;
};

const getInitial = (name: string) =>
  name ? name.substring(0, 2).toUpperCase() : "NA";

const getRandomColor = (id: string) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
    "bg-indigo-100 text-indigo-600",
    "bg-orange-100 text-orange-600",
  ];
  // Fallback jika id null/undefined
  const charCode = id ? id.charCodeAt(0) : 0;
  return colors[charCode % colors.length] || colors[0];
};

// --- INTERFACES ---
export interface DraftParams {
  page?: number;
  limit?: number;
  jenis?: string;
  search?: string;
  date_filter?: string;
  sort_by?: string;
}

export const useDraft = () => {
  const { get, post, del, patch, api } = useApi();

  // --- STATE ---
  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  // Default Pagination State
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    from: 0,
    to: 0,
  });

  const multipartConfig = {
    headers: { "Content-Type": "multipart/form-data" },
  };

  // --- 1. FETCH DRAFTS (Disesuaikan dengan JSON Anda) ---
  const fetchDrafts = async (params: DraftParams = {}) => {
    pending.value = true;
    error.value = null;

    try {
      // 1. Setup Query Params
      const query = new URLSearchParams();
      const reqPage = params.page || pagination.value.page || 1;
      const reqLimit = params.limit || pagination.value.limit || 10;

      query.append("page", reqPage.toString());
      query.append("limit", reqLimit.toString());

      if (params.search) query.append("q", params.search);
      if (params.jenis && params.jenis !== "ALL")
        query.append("jenis", params.jenis);
      if (params.date_filter) query.append("date_filter", params.date_filter);
      if (params.sort_by) query.append("sort_by", params.sort_by);

      // 2. Call API
      const response = await get(`/draft/list?${query.toString()}`);

      // 3. Extract Data berdasarkan JSON Response Anda
      // Struktur: { success: true, data: [...], pagination: {...} }
      const rawData = response?.data || [];
      const meta = response?.pagination || {};

      // 4. Update Pagination State
      const totalItems = meta.total || 0;
      const currentPage = meta.page || reqPage;
      const currentLimit = meta.limit || reqLimit;
      const totalPages = meta.totalPages || 1;

      // Hitung 'from' dan 'to' secara manual untuk UI "1-10 Dari 100"
      const from = totalItems === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
      const to = Math.min(currentPage * currentLimit, totalItems);

      pagination.value = {
        total: totalItems,
        page: currentPage,
        limit: currentLimit,
        totalPages: totalPages,
        from: from,
        to: to,
      };

      // 5. Mapping Data ke format UI
      items.value = rawData.map((item: any) => {
        // Logic Display Penerima
        const listPenerima = item.penerima || [];
        let displayRecipient = "Tanpa Penerima";
        let displayNameForInitial = "NA";

        if (listPenerima.length > 0) {
          const firstPerson = listPenerima[0];
          const jenisSurat = (item.jenis || "").toUpperCase();
          const isSDE = ["SDE", "EXTERNAL", "EKSTERNAL"].includes(jenisSurat);

          // SDE pakai nama orang, Internal pakai Jabatan
          let primaryName = isSDE
            ? firstPerson.nama
            : firstPerson.position_text || firstPerson.nama;

          if (!primaryName) primaryName = "Tanpa Nama";

          displayNameForInitial = primaryName;

          // Format: "Direktur X +2 lainnya"
          displayRecipient =
            listPenerima.length > 1
              ? `${primaryName} +${listPenerima.length - 1} lainnya`
              : primaryName;
        }

        return {
          id: item.id_naskah, // Sesuai JSON: id_naskah
          from: displayRecipient,
          subject: item.isi_pesan || "Tanpa Subjek", // Sesuai JSON: isi_pesan
          body: item.isi_pesan,

          category: item.jenis || "", // DI, ND
          category_text: item.jenis_text || item.jenis, // Disposisi, Nota Dinas

          date: formatDateShort(item.tanggal),
          fullDate: formatFullDate(item.tanggal, item.waktu),
          rawDate: new Date(item.tanggal),

          initial: getInitial(displayNameForInitial),
          color: getRandomColor(item.id_naskah || "0"),
          isRead: true, // Draft dianggap sudah dibaca pemiliknya

          // Simpan data asli untuk keperluan edit/detail
          originalData: item,
        };
      });
    } catch (err) {
      console.error("Fetch drafts error:", err);
      error.value = err;
      items.value = [];
      pagination.value = { ...pagination.value, total: 0, from: 0, to: 0 };
    } finally {
      pending.value = false;
    }
  };

  // --- 2. DELETE ACTIONS ---
  const deleteDraft = async (idNaskah: string) => {
    pending.value = true;
    try {
      await del(`/draft/delete/${idNaskah}`);

      // Optimistic Update
      items.value = items.value.filter((i) => i.id !== idNaskah);

      // Update pagination info locally
      if (pagination.value.total > 0) {
        pagination.value.total -= 1;
        // Recalculate 'to'
        pagination.value.to = Math.min(
          pagination.value.page * pagination.value.limit,
          pagination.value.total,
        );
      }
      return true;
    } catch (err: any) {
      throw err;
    } finally {
      pending.value = false;
    }
  };

  const bulkDeleteDrafts = async (naskahIds: string[]) => {
    pending.value = true;
    try {
      await post(`/draft/bulk-delete`, { naskah_ids: naskahIds });

      // Optimistic Update
      items.value = items.value.filter((i) => !naskahIds.includes(i.id));

      // Update pagination info locally
      if (pagination.value.total > 0) {
        pagination.value.total -= naskahIds.length;
        pagination.value.to = Math.min(
          pagination.value.page * pagination.value.limit,
          pagination.value.total,
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
    fetchDrafts,
    deleteDraft,
    bulkDeleteDrafts,
  };
};
