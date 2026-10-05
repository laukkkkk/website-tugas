import { describe, it, expect } from 'vitest'
import { ringkasanCatatan } from './catatan.js'

describe('shared/catatan.ts - ringkasanCatatan', () => {
  it('menangani isi satu baris', () => {
    const isi = 'Catatan singkat kuliah kalkulus hari ini'
    const res = ringkasanCatatan(isi)

    expect(res.judul).toBe('Catatan singkat kuliah kalkulus hari ini')
    expect(res.pratinjau).toBe('')
  })

  it('menangani banyak baris', () => {
    const isi = 'Rangkuman Materi Pertemuan 5\nPoin 1: Penjelasan konsep\nPoin 2: Contoh studi kasus'
    const res = ringkasanCatatan(isi)

    expect(res.judul).toBe('Rangkuman Materi Pertemuan 5')
    expect(res.pratinjau).toBe('Poin 1: Penjelasan konsep\nPoin 2: Contoh studi kasus')
  })

  it('menangani baris pertama kosong', () => {
    const isi = '\n   \n\n  Baris pertama yang sebenarnya  \nSisa rincian catatan kuliah'
    const res = ringkasanCatatan(isi)

    expect(res.judul).toBe('Baris pertama yang sebenarnya')
    expect(res.pratinjau).toBe('Sisa rincian catatan kuliah')
  })

  it('menangani isi sangat panjang (judul > 60 karakter dipotong dengan ..., pratinjau > 120 karakter dipotong dengan ...)', () => {
    const judulPanjang = 'A'.repeat(75)
    const sisaPanjang = 'B'.repeat(150)
    const isi = `${judulPanjang}\n${sisaPanjang}`

    const res = ringkasanCatatan(isi)

    expect(res.judul).toBe('A'.repeat(60) + '...')
    expect(res.judul.length).toBe(63)
    expect(res.pratinjau).toBe('B'.repeat(120) + '...')
    expect(res.pratinjau.length).toBe(123)
  })

  it('menangani isi hanya spasi atau string kosong', () => {
    expect(ringkasanCatatan('   \n  \t  \n  ')).toEqual({
      judul: '',
      pratinjau: '',
    })
    expect(ringkasanCatatan('')).toEqual({
      judul: '',
      pratinjau: '',
    })
    expect(ringkasanCatatan(null as unknown as string)).toEqual({
      judul: '',
      pratinjau: '',
    })
  })

  it('tidak memotong jika tepat 60 karakter untuk judul dan 120 karakter untuk pratinjau', () => {
    const judulTepat = 'X'.repeat(60)
    const sisaTepat = 'Y'.repeat(120)
    const isi = `${judulTepat}\n${sisaTepat}`

    const res = ringkasanCatatan(isi)

    expect(res.judul).toBe(judulTepat)
    expect(res.pratinjau).toBe(sisaTepat)
  })
})
