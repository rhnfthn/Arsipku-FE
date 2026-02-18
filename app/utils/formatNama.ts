export const formatNama = (nama: string | null | undefined): string => {
  if (!nama) return "";

  // Split berdasarkan spasi (menangani spasi ganda juga)
  const words = nama.trim().split(/\s+/);

  // Jika kata <= 2, kembalikan aslinya
  if (words.length <= 2) {
    return nama;
  }

  // Ambil 2 kata pertama
  const firstTwo = words.slice(0, 2).join(" ");

  // Ambil sisa kata, ambil huruf depan, uppercase, LALU TAMBAH TITIK
  const initials = words
    .slice(2)
    .map((w) => w.charAt(0).toUpperCase() + ".") //
    .join(" ");

  return `${firstTwo} ${initials}`;
};
