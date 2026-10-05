export interface RingkasanCatatan {
  judul: string
  pratinjau: string
}

/**
 * Menghasilkan judul turunan dan pratinjau dari isi catatan.
 * - Judul: baris pertama yang tidak kosong, dipotong maksimal 60 karakter dengan '...' bila lebih panjang.
 * - Pratinjau: sisa isi setelah baris pertama, maksimal 120 karakter (dipotong dengan '...' bila lebih panjang).
 */
export function ringkasanCatatan(isi: string): RingkasanCatatan {
  if (!isi || typeof isi !== 'string') {
    return { judul: '', pratinjau: '' }
  }

  const lines = isi.split(/\r?\n/)
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0)

  if (firstNonEmptyIndex === -1) {
    return { judul: '', pratinjau: '' }
  }

  const firstLine = lines[firstNonEmptyIndex].trim()
  const judul = firstLine.length > 60
    ? firstLine.slice(0, 60) + '...'
    : firstLine

  const remainingLines = lines.slice(firstNonEmptyIndex + 1)
  const remainingText = remainingLines.join('\n').trim()

  const pratinjau = remainingText.length > 120
    ? remainingText.slice(0, 120) + '...'
    : remainingText

  return {
    judul,
    pratinjau,
  }
}
