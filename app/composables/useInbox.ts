// ~/composables/useInbox.ts
import { ref, watch, isRef } from "vue";
import { useApi } from "~/composables/useApi";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${tanggal} ${jam}`;
};

export function useInbox(positionId: any) {
  const { apiGet, apiPut } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const fetchInbox = async (id: string | null) => {
    if (!id) {
      items.value = [];
      return;
    }

    pending.value = true;
    error.value = null;

    try {
      const res = await apiGet(
        `/naskah_sirkulasi/inbox/${encodeURIComponent(id)}`,
      );

      const rawItems = res?.data?.items || [];

      items.value = rawItems.map((it: any) => {
        const position = it.pengirim?.position_text || "-";
        const name = it.pengirim?.nama || "-";

        return {
          id: it.id_sirkulasi,
          naskahId: it.id_naskah,

          category: it.jenis,
          category_label: it.jenis_label,
          nomor: it.nomor,
          date: formatDateTime(it.tanggal),
          subject: (it.perihal || it.nomor || "").toString().trim(),

          from: position,
          fromPosition: position,
          fromName: name,

          initial:
            name !== "-"
              ? name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
              : "?",

          // Status
          isRead: it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip: it.is_arsip,
          isNote: it.is_note,

          pengirim: it.pengirim,
          penerima: it.penerima
            ? Array.isArray(it.penerima)
              ? it.penerima
              : [it.penerima]
            : [],

          raw: it,
        };
      });
    } catch (err) {
      console.error("useInbox error:", err);
      error.value = err;
      items.value = [];
    } finally {
      pending.value = false;
    }
  };

  if (isRef(positionId)) {
    watch(positionId, (newId) => fetchInbox(newId), { immediate: true });
  }

  const refresh = () => {
    const id = isRef(positionId) ? positionId.value : positionId;
    return fetchInbox(id);
  };

  const markAsRead = async (mail: any, positionId: string) => {
    if (mail.isRead) return;

    try {
      await apiPut("/naskah_sirkulasi/update-read-status", {
        id_naskah: mail.naskahId,
        position_id: positionId,
      });

      mail.isRead = true;
      mail.raw.status_baca = "terbaca";
      mail.raw.read_time = new Date().toISOString();
    } catch (err) {
      console.error("Gagal update status baca:", err);
    }
  };

  return { items, pending, error, refresh, markAsRead };
}
