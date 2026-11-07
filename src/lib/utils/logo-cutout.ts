/**
 * Utilitas client-side untuk memproses dan membersihkan logo tenant.
 * Spec 6.2:
 * - Batas upload: image/*, maks 2 MB sebelum resize.
 * - Resize maks 160px pada sisi terpanjang.
 * - Hapus background otomatis:
 *   - Ambil warna rata-rata 4 sudut.
 *   - Lewati jika sudut sudah transparan.
 *   - Flood fill dari seluruh tepi, hapus piksel dengan jarak selisih absolut R+G+B < 90.
 *   - Alpha piksel terhapus = 0.
 *   - Jika terhapus > 92% piksel, batalkan.
 */

export interface ProcessLogoResult {
  blob: Blob;
  previewUrl: string;
}

export async function processLogoFile(file: File): Promise<ProcessLogoResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (image/*).");
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 2 MB.");
  }

  // Muat gambar ke HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Gagal membaca file gambar."));
      image.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });

  // Hitung dimensi resize (maks 160px pada sisi terpanjang)
  const MAX_DIM = 160;
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
      targetWidth = MAX_DIM;
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
      targetHeight = MAX_DIM;
    }
  }

  // Buat canvas untuk pemrosesan
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Canvas 2D context tidak didukung.");
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const totalPixels = targetWidth * targetHeight;

  // Indeks 4 sudut
  const corners = [
    0, // kiri-atas
    (targetWidth - 1) * 4, // kanan-atas
    (targetHeight - 1) * targetWidth * 4, // kiri-bawah
    ((targetHeight - 1) * targetWidth + (targetWidth - 1)) * 4, // kanan-bawah
  ];

  // Periksa apakah ada sudut yang sudah transparan (alpha < 128)
  const anyCornerTransparent = corners.some((idx) => data[idx + 3] < 128);

  if (!anyCornerTransparent) {
    // Hitung rata-rata warna 4 sudut
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    for (const idx of corners) {
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
    }

    const avgR = sumR / 4;
    const avgG = sumG / 4;
    const avgB = sumB / 4;

    const isMatch = (pxIdx: number): boolean => {
      // Piksel sudah transparan tidak perlu dicocokkan lagi
      if (data[pxIdx + 3] === 0) return false;
      const diff =
        Math.abs(data[pxIdx] - avgR) +
        Math.abs(data[pxIdx + 1] - avgG) +
        Math.abs(data[pxIdx + 2] - avgB);
      return diff < 90;
    };

    // Flood fill dari seluruh tepi
    const visited = new Uint8Array(totalPixels);
    const queue: number[] = [];

    const enqueue = (x: number, y: number) => {
      const pIdx = y * targetWidth + x;
      if (!visited[pIdx] && isMatch(pIdx * 4)) {
        visited[pIdx] = 1;
        queue.push(pIdx);
      }
    };

    // Tepi atas dan bawah
    for (let x = 0; x < targetWidth; x++) {
      enqueue(x, 0);
      enqueue(x, targetHeight - 1);
    }
    // Tepi kiri dan kanan
    for (let y = 0; y < targetHeight; y++) {
      enqueue(0, y);
      enqueue(targetWidth - 1, y);
    }

    let deletedCount = 0;

    // BFS Flood Fill
    let head = 0;
    while (head < queue.length) {
      const pIdx = queue[head++];
      const byteIdx = pIdx * 4;

      // Hapus piksel (alpha = 0)
      data[byteIdx + 3] = 0;
      deletedCount++;

      const x = pIdx % targetWidth;
      const y = Math.floor(pIdx / targetWidth);

      // Tetangga 4 arah
      if (x > 0) enqueue(x - 1, y);
      if (x < targetWidth - 1) enqueue(x + 1, y);
      if (y > 0) enqueue(x, y - 1);
      if (y < targetHeight - 1) enqueue(x, y + 1);
    }

    // Jika > 92% piksel terhapus, batalkan dan beri tahu pengguna
    if (deletedCount / totalPixels > 0.92) {
      throw new Error(
        "Latar belakang terlalu dominan (>92% terhapus). Silakan gunakan gambar lain atau logo dengan kontras lebih tinggi."
      );
    }

    // Tulis kembali data piksel yang sudah diubah ke canvas
    ctx.putImageData(imageData, 0, 0);
  }

  // Buat Blob PNG transparan
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Gagal mengonversi gambar ke format PNG."));
    }, "image/png");
  });

  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl };
}

