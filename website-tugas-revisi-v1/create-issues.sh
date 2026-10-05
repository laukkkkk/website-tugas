#!/bin/bash
# Bulk create GitHub issues REVISI Website Tugas (batch 2) dari file markdown di folder issues/
# Jalankan dari dalam folder ini. Butuh GitHub CLI (gh) yang sudah login: gh auth login
# Nomor dependency diisi otomatis dari nomor issue yang benar-benar dibuat GitHub,
# jadi aman dijalankan walau repo sudah punya issue atau pull request. Jalankan sekali saja.
REPO="laukkkkk/website-tugas"

cd "$(dirname "$0")" || exit 1

if [ -z "$REPO" ]; then
  echo 'Isi variabel REPO dulu di dalam script ini'
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo 'GitHub CLI (gh) belum terpasang. Pasang dari https://cli.github.com lalu jalankan: gh auth login'
  exit 1
fi

declare -A NUM

create_issue() {
  local key="$1" title="$2" file="$3" labels="$4"
  local tmp url k
  tmp=$(mktemp)
  cp "$file" "$tmp"
  for k in "${!NUM[@]}"; do
    sed -i "s/\[\[$k\]\]/#${NUM[$k]}/g" "$tmp"
  done
  url=$(gh issue create --repo "$REPO" --title "$title" --body-file "$tmp" --label "$labels")
  rm -f "$tmp"
  if [ -z "$url" ]; then
    echo "GAGAL membuat issue $key, berhenti agar nomor dependency tidak salah."
    exit 1
  fi
  NUM[$key]="${url##*/}"
  echo "$key -> $url"
}

gh label create "web" --repo "$REPO" --color "00ACC1" 2>/dev/null
gh label create "bot" --repo "$REPO" --color "0088CC" 2>/dev/null
gh label create "backend" --repo "$REPO" --color "1D76DB" 2>/dev/null
gh label create "rilis" --repo "$REPO" --color "5319E7" 2>/dev/null
gh label create "manual" --repo "$REPO" --color "D93F0B" 2>/dev/null
gh label create "revisi" --repo "$REPO" --color "C5A3FF" 2>/dev/null

create_issue "R21" "Web — Mode terang dan gelap menyeluruh, teks putih di mode gelap" "issues/001-web-mode-terang-dan-gelap-menyeluruh-teks-putih-di-mode-gelap.md" "web,revisi"
create_issue "R22" "Web — Warna aksen konsisten biru-cyan di semua halaman dan kontras teks tombol" "issues/002-web-warna-aksen-konsisten-biru-cyan-di-semua-halaman-dan-kontras-teks.md" "web,revisi"
create_issue "R23" "Catatan — Hapus judul catatan: migrasi database, service, dan API" "issues/003-catatan-hapus-judul-catatan-migrasi-database-service-dan-api.md" "backend,revisi,manual"
create_issue "R24" "Bot — Perintah /note cukup isi catatan, tanpa simbol pemisah" "issues/004-bot-perintah-note-cukup-isi-catatan-tanpa-simbol-pemisah.md" "bot,revisi"
create_issue "R25" "Web — Halaman Catatan tanpa judul" "issues/005-web-halaman-catatan-tanpa-judul.md" "web,revisi"
create_issue "R26" "Web — Dashboard menampilkan tugas, kerjaan, catatan, dan to-do (maksimal 15 aktif)" "issues/006-web-dashboard-menampilkan-tugas-kerjaan-catatan-dan-to-do-maksimal-15.md" "web,revisi"
create_issue "R27" "Rilis — Tes ulang seluruh revisi dan deploy" "issues/007-rilis-tes-ulang-seluruh-revisi-dan-deploy.md" "rilis,revisi"

echo "Selesai. Cek: https://github.com/$REPO/issues"
