import { describe, it, expect } from 'vitest'
import {
  hitungDeadlineTerdekat,
  ambilTugasTerdekat,
} from './dashboard-helpers.js'
import { susunPesanReminder } from '../../shared/pesan-reminder.js'
import type { Tugas, Kerjaan } from '../types/index.js'

describe('Dashboard Helpers', () => {
  const sekarang = new Date('2026-10-04T09:00:00+07:00')

  const sampleTugas: Tugas[] = [
    {
      id: 't-1',
      judul: 'Tugas Kalkulus',
      matkul: 'Matematika',
      tipe: 'individu',
      link_pengumpulan: 'https://classroom.google.com',
      deadline: '2026-10-05T23:59:00+07:00', // Besok (1 hari lagi) -> merah (< 2 hari)
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 't-2',
      judul: 'Makalah Etika',
      matkul: 'Etika Profesi',
      tipe: 'kelompok',
      link_pengumpulan: null,
      deadline: '2026-10-07T23:59:00+07:00', // 3 hari lagi -> kuning (< 4 hari)
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 't-3',
      judul: 'Proyek Sistem Operasi',
      matkul: 'Sistem Operasi',
      tipe: 'kelompok',
      link_pengumpulan: null,
      deadline: '2026-10-10T23:59:00+07:00', // 6 hari lagi -> hijau (< 7 hari)
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 't-4',
      judul: 'Tugas Jaringan',
      matkul: 'Jaringan Komputer',
      tipe: 'individu',
      link_pengumpulan: null,
      deadline: '2026-10-20T23:59:00+07:00', // 16 hari lagi -> netral
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 't-selesai',
      judul: 'Tugas Selesai',
      matkul: 'Fisika',
      tipe: 'individu',
      link_pengumpulan: null,
      deadline: '2026-10-02T23:59:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
  ]

  const sampleKerjaan: Kerjaan[] = [
    {
      id: 'k-1',
      judul: 'Revisi Proposal Klien',
      deskripsi: 'Update timeline dan biaya',
      deadline: '2026-10-04T18:00:00+07:00', // Hari ini -> merah
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'k-2',
      judul: 'Kirim Invoice',
      deskripsi: null,
      deadline: '2026-10-15T23:59:00+07:00',
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'k-selesai',
      judul: 'Kerjaan Selesai',
      deskripsi: null,
      deadline: '2026-10-03T12:00:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
  ]

  describe('hitungDeadlineTerdekat', () => {
    it('mengembalikan status netral dan tanda "-" jika tidak ada item aktif', () => {
      const res = hitungDeadlineTerdekat([], [], sekarang)
      expect(res.terdekat).toBeNull()
      expect(res.label).toBe('-')
      expect(res.warna).toBe('netral')
      expect(res.subtext).toContain('Tidak ada tugas atau kerjaan aktif')
    })

    it('mengabaikan item yang selesai: true', () => {
      const hanyaSelesaiTugas = sampleTugas.filter((t) => t.selesai)
      const hanyaSelesaiKerjaan = sampleKerjaan.filter((k) => k.selesai)
      const res = hitungDeadlineTerdekat(hanyaSelesaiTugas, hanyaSelesaiKerjaan, sekarang)

      expect(res.terdekat).toBeNull()
      expect(res.label).toBe('-')
    })

    it('memilih kerjaan jika deadline kerjaan lebih dekat dari tugas', () => {
      // k-1 deadline 4 Okt (Hari ini), t-1 deadline 5 Okt (Besok)
      const res = hitungDeadlineTerdekat(sampleTugas, sampleKerjaan, sekarang)

      expect(res.terdekat).not.toBeNull()
      expect(res.terdekat?.tipe).toBe('kerjaan')
      expect(res.terdekat?.judul).toBe('Revisi Proposal Klien')
      expect(res.label).toBe('Hari ini')
      expect(res.warna).toBe('merah') // Hari ini (< 2 hari) -> merah
    })

    it('memilih tugas jika deadline tugas lebih dekat dari kerjaan', () => {
      const res = hitungDeadlineTerdekat(
        [sampleTugas[0]], // 5 Okt (Besok)
        [sampleKerjaan[1]], // 15 Okt
        sekarang
      )

      expect(res.terdekat?.tipe).toBe('tugas')
      expect(res.terdekat?.judul).toBe('Tugas Kalkulus')
      expect(res.label).toBe('Besok')
      expect(res.warna).toBe('merah')
    })

    it('menghasilkan warna kuning jika selisih < 4 hari', () => {
      const res = hitungDeadlineTerdekat(
        [sampleTugas[1]], // 7 Okt (3 hari lagi dari 4 Okt)
        [],
        sekarang
      )

      expect(res.label).toBe('3 hari lagi')
      expect(res.warna).toBe('kuning')
    })

    it('menghasilkan warna hijau jika selisih < 7 hari', () => {
      const res = hitungDeadlineTerdekat(
        [sampleTugas[2]], // 10 Okt (6 hari lagi)
        [],
        sekarang
      )

      expect(res.label).toBe('6 hari lagi')
      expect(res.warna).toBe('hijau')
    })

    it('menghasilkan warna netral jika selisih >= 7 hari', () => {
      const res = hitungDeadlineTerdekat(
        [sampleTugas[3]], // 20 Okt (16 hari lagi)
        [],
        sekarang
      )

      expect(res.label).toBe('16 hari lagi')
      expect(res.warna).toBe('netral')
    })
  })

  describe('ambilTugasTerdekat', () => {
    it('mengambil maksimal 3 tugas belum selesai', () => {
      const hasil = ambilTugasTerdekat(sampleTugas, 3)
      expect(hasil.length).toBe(3)
      expect(hasil.every((t) => !t.selesai)).toBe(true)
      expect(hasil[0].id).toBe('t-1')
      expect(hasil[1].id).toBe('t-2')
      expect(hasil[2].id).toBe('t-3')
    })

    it('mengembalikan array kosong jika semua tugas selesai', () => {
      const semuaSelesai = sampleTugas.map((t) => ({ ...t, selesai: true }))
      const hasil = ambilTugasTerdekat(semuaSelesai, 3)
      expect(hasil).toEqual([])
    })
  })

  describe('Telegram Reminder Integration', () => {
    it('menyusun pesan dengan format identik menggunakan susunPesanReminder', () => {
      const pesan = susunPesanReminder(sampleTugas, sampleKerjaan, sekarang)
      expect(pesan).not.toBeNull()
      expect(pesan).toContain('🔔 *Pengingat —')
      expect(pesan).toContain('📋 *TUGAS')
      expect(pesan).toContain('💼 *KERJAAN')
      expect(pesan).toContain('Tugas Kalkulus')
      expect(pesan).toContain('Revisi Proposal Klien')
    })

    it('mengembalikan null jika tidak ada item aktif', () => {
      const pesan = susunPesanReminder([], [], sekarang)
      expect(pesan).toBeNull()
    })
  })
})
