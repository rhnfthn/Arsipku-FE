// composables/useInbox.ts
import { ref, computed, watchEffect } from "vue";

export const useInbox = (positionId: string | Ref<string>) => {
  const raw = ref(null);
  const pending = ref(false);
  const error = ref(null);
  const items = ref<Array<any>>([]);

  const mapJenis = (jenis) => {
  if (!jenis) return "UNKNOWN";
  const j = jenis.toUpperCase();
  if (j === "DISPOSISI") return "DI";
  if (j === "INTERNAL") return "SDI";
  if (j === "EKSTERNAL") return "SDE";
  return j;
};


  const fetchInbox = async (id: string) => {
    if (!id) {
      raw.value = null;
      items.value = [];
      return;
    }
    pending.value = true;
    error.value = null;
    try {
      const url = `https://arsipku-api.rizan.app/naskah_sirkulasi/inbox/${encodeURIComponent(
        id,
      )}`;
      const { data, error: fetchError } = await useFetch(url, {
        method: "GET",
        // credentials / headers jika perlu, tambahkan di sini
      });
      if (fetchError.value) throw fetchError.value;
      raw.value = data.value;
      // map ke struktur yang digunakan oleh kotak-masuk.vue
      items.value = (data.value?.data?.items || []).map((it: any, idx: number) => {
        const tanggal = it.tanggal ? new Date(it.tanggal) : null;
        const fullDate = tanggal
          ? `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(
              2,
              "0",
            )}-${String(tanggal.getDate()).padStart(2, "0")} ${String(
              tanggal.getHours(),
            ).padStart(2, "0")}:${String(tanggal.getMinutes()).padStart(2, "0")}`
          : null;
        // initial: ambil inisial dari nama pengirim jika ada
        const namaPengirim = it.pengirim?.nama || it.pengirim?.position_text || "-";
        const initials = namaPengirim
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();

        return {
          // id yang unik untuk UI
          id: it.id_sirkulasi,
          from: `${it.pengirim?.nama || it.pengirim?.position_text || "-" }${it.pengirim?.organization_text ? " - "+it.pengirim.organization_text : ""}`,
          email: it.pengirim?.position_id ? `${it.pengirim.position_id}@org` : "",
          subject: it.perihal || it.nomor || "Tanpa perihal",
          body: "", // API tidak ada body, kalau ada gunakan it.body
          category: mapJenis(it.jenis),
          date: tanggal ? tanggal.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
          fullDate: fullDate,
          initial: initials || "NA",
          // warna avatar bisa di-generate berdasarkan jenis atau id
          color:
            it.jenis === "ND"
              ? "bg-blue-100 text-blue-700"
              : it.jenis === "SDI"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-gray-100 text-gray-700",
          isRead: it.status_baca === "sudah_dibaca" || it.status_baca === "dibaca",
          isFlagged: false,
          isStarred: !!it.is_favorit,
          isLocked: false,
          hasNote: !!it.is_note,
          isArchived: !!it.is_arsip,
          canOpenTab: true,
          recipient: "-", // kalau API berikan list penerima, map di sini
          disposition: "-", // kalau punya info
          note: "-",
          raw: it, // simpan raw item jika butuh detail nanti
        };
      });
    } catch (err: any) {
      error.value = err;
      items.value = [];
      raw.value = null;
    } finally {
      pending.value = false;
    }
  };

  // jalankan awal dan saat positionId berubah
  watchEffect(() => {
    const id = typeof positionId === "object" && "value" in (positionId as any)
      ? (positionId as any).value
      : (positionId as any);
    fetchInbox(id);
  });

const toggleFavorit = async (id_sirkulasi: string) => {
  // cari item di state
  const item = items.value.find(i => i.id === id_sirkulasi);
  if (!item) return;

  const oldValue = item.isStarred;
  const newValue = !oldValue;

  // 🔥 Optimistic update → UI langsung berubah
  item.isStarred = newValue;

  try {
    const response = await $fetch(
      "https://arsipku-api.rizan.app/naskah_sirkulasi/toggle-flag",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: {
          id_sirkulasi,
          flag_type: "favorit"
        }
      }
    );

    item.isStarred = response.data.new_value;

    return response;
  } catch (error) {
    console.error("Gagal update favorit:", error);

    // rollback UI kalau error
    item.isStarred = oldValue;

    throw error;
  }
};

const toggleArsip = async (id_sirkulasi: string) => {
  // cari item di state
  const item = items.value.find(i => i.id === id_sirkulasi);
  if (!item) return;

  const oldValue = item.isArchived;
  const newValue = !oldValue;

  // 🔥 Optimistic update → UI langsung berubah
  item.isArchived = newValue;

  try {
    const response = await $fetch(
      "https://arsipku-api.rizan.app/naskah_sirkulasi/toggle-flag",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: {
          id_sirkulasi,
          flag_type: "arsip"
        }
      }
    );

    item.isArchived = response.data.new_value;

    return response;
  } catch (error) {
    console.error("Gagal update favorit:", error);

    // rollback UI kalau error
    item.isArchived = oldValue;

    throw error;
  }
};

  return {
    raw,
    items,
    pending,
    error,
    refresh: () => {
      const id = typeof positionId === "object" && "value" in (positionId as any)
        ? (positionId as any).value
        : (positionId as any);
      return fetchInbox(id);
    },
    toggleFavorit,
    toggleArsip,
  };
  
};


