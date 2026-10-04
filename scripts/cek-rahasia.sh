#!/usr/bin/env bash

# ==============================================================================
# scripts/cek-rahasia.sh
# Memeriksa hasil build (dist) untuk memastikan tidak ada kunci rahasia
# (SUPABASE_SERVICE_ROLE_KEY, BOT_TOKEN, REMINDER_SECRET, TELEGRAM_WEBHOOK_SECRET)
# yang bocor ke dalam bundle frontend.
# ==============================================================================

set -euo pipefail

# Warna output terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 Memulai audit keamanan bundle frontend (dist/)...${NC}"

# 1. Pastikan folder dist ada
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️ Folder dist/ belum ditemukan. Menjalankan 'npm run build' terlebih dahulu...${NC}"
  npm run build
fi

DIST_DIR="dist"
ASSETS_DIR="dist/assets"

if [ ! -d "$ASSETS_DIR" ]; then
  echo -e "${RED}❌ Error: Folder $ASSETS_DIR tidak ditemukan setelah build!${NC}"
  exit 1
fi

LEAK_FOUND=0

# Fungsi untuk memeriksa string rahasia
check_secret_value() {
  local KEY_NAME="$1"
  local SECRET_VAL="$2"

  if [ -n "$SECRET_VAL" ] && [ "${#SECRET_VAL}" -ge 8 ]; then
    # Cari nilai rahasia di dalam folder dist/assets
    if grep -rqF "$SECRET_VAL" "$ASSETS_DIR"; then
      echo -e "${RED}❌ BAHAYA: Nilai rahasia untuk '$KEY_NAME' TERDETEKSI di dalam bundle frontend ($ASSETS_DIR)!${NC}"
      LEAK_FOUND=1
    fi
  fi
}

# 2. Baca nilai dari .env.local atau .env jika ada
for ENV_FILE in ".env.local" ".env"; do
  if [ -f "$ENV_FILE" ]; then
    echo -e "${CYAN}📄 Memeriksa nilai rahasia dari $ENV_FILE...${NC}"
    while IFS='=' read -r key val || [ -n "$key" ]; do
      # Bersihkan whitespace
      key=$(echo "$key" | tr -d ' \r\n')
      val=$(echo "$val" | tr -d ' \r\n"'\'')

      # Abaikan komentar atau baris kosong
      [[ "$key" =~ ^#.*$ ]] && continue
      [ -z "$key" ] && continue

      case "$key" in
        SUPABASE_SERVICE_ROLE_KEY|BOT_TOKEN|REMINDER_SECRET|TELEGRAM_WEBHOOK_SECRET)
          check_secret_value "$key" "$val"
          ;;
      esac
    done < "$ENV_FILE"
  fi
done

# 3. Pengecekan pola nama variabel berbahaya di bundle
DANGEROUS_PATTERNS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "service_role"
  "REMINDER_SECRET"
  "TELEGRAM_WEBHOOK_SECRET"
)

for PATTERN in "${DANGEROUS_PATTERNS[@]}"; do
  if grep -rqF "$PATTERN" "$ASSETS_DIR"; then
    echo -e "${RED}❌ PERINGATAN: Nama variabel/kunci '$PATTERN' ditemukan di bundle frontend!${NC}"
    LEAK_FOUND=1
  fi
done

# 4. Hasil Audit
echo "--------------------------------------------------------"
if [ "$LEAK_FOUND" -eq 1 ]; then
  echo -e "${RED}🚨 AUDIT GAGAL: Ditemukan rahasia yang bocor ke bundle client frontend!${NC}"
  echo -e "${RED}   Segera periksa impor dan pastikan service-role/bot token hanya dipakai di /api atau /server.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ AUDIT SUKSES: Bundle frontend bersih!${NC}"
  echo -e "${GREEN}   Tidak ditemukan SUPABASE_SERVICE_ROLE_KEY, BOT_TOKEN, REMINDER_SECRET, atau rahasia server lainnya di $ASSETS_DIR.${NC}"
  exit 0
fi
