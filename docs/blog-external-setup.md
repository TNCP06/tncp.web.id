# Blog (KANAL) — panduan setup eksternal untuk owner

> Langkah yang HARUS kamu lakukan sendiri (butuh akun Cloudflare/Meta/dll).
> Bisa dikerjakan paralel sambil Claude ngoding. Tak ada yang merusak apa pun —
> semua reversible. Rahasia JANGAN ditulis balik ke file yang di-commit.

## 0. Ringkasan yang perlu disiapkan
1. Subdomain `blog.tncp.web.id` lewat Cloudflare Tunnel (arahkan ke container yang sama).
2. Satu secret bersama `INGEST_SECRET` (dipakai tncp ⇄ Personal-Assistant-AI).
3. Isi beberapa env di dua sisi.

Belum perlu: apa pun soal Instagram (lagi di-pause).

---

## 1. Cloudflare Tunnel — tambah hostname `blog.tncp.web.id`

Tunnel-mu sekarang sudah mengarahkan `tncp.web.id` → container (port host **3100**).
Tinggal tambah satu hostname lagi ke container yang SAMA. Ada 2 cara — pakai yang sesuai
setup-mu:

### Cara A — Dashboard (Zero Trust) — paling gampang
1. Buka **one.dash.cloudflare.com** → **Networks → Tunnels** → pilih tunnel yang dipakai `tncp.web.id`.
2. Tab **Public Hostname** → **Add a public hostname**:
   - **Subdomain**: `blog`
   - **Domain**: `tncp.web.id`
   - **Service**: `HTTP` → `http://<yang-sama-dengan-tncp.web.id>`
     (kalau `tncp.web.id` pakai `http://172.17.0.1:3100`, samakan; kalau `http://localhost:3100`, samakan).
3. **Save**. Cloudflare bikin DNS otomatis. Selesai — tak perlu sentuh DNS manual.

### Cara B — Config file (kalau tunnel-mu diatur via `config.yml` di VPS)
Di file `config.yml` cloudflared, di bagian `ingress:` tambah SEBELUM baris `service: http_status:404`:
```yaml
  - hostname: blog.tncp.web.id
    service: http://172.17.0.1:3100   # samakan dengan entri tncp.web.id
```
Lalu route DNS-nya:
```bash
cloudflared tunnel route dns <NAMA_ATAU_ID_TUNNEL> blog.tncp.web.id
```
Restart service cloudflared (`sudo systemctl restart cloudflared` atau restart container-nya).

### Verifikasi
`https://blog.tncp.web.id` harus balas dari app yang sama (mungkin 404 dulu sampai route
`(blog)` dibuat — itu normal, yang penting nyambung ke container, bukan error Cloudflare 1033).

> Catatan: `cloudflared` itu infra bersama antar-proyek. Cukup TAMBAH hostname; jangan
> ubah/hapus entri proyek lain.

---

## 2. Buat `INGEST_SECRET`
Satu string acak, dipakai Personal-Assistant-AI buat push artikel ke blog. Buat sekali:
```bash
openssl rand -base64 32
```
Simpan hasilnya — nanti dipakai di DUA `.env` (angka yang sama persis). Jangan commit.

---

## 3. Env yang diisi (nanti, saat deploy — dicatat di sini biar siap)

**Di VPS `~/tncp.web.id/.env`:**
```
INGEST_SECRET=<hasil openssl tadi>
NEXT_PUBLIC_BLOG_URL=https://blog.tncp.web.id
```
(`NEXT_PUBLIC_BLOG_URL` yang bikin tombol "Blog" muncul di nav tncp.web.id.)

**Di VPS `~/personal-assistant-ai/.env`:**
```
INSTAGRAM_ENABLED=0
BLOG_INGEST_URL=https://blog.tncp.web.id
INGEST_SECRET=<hasil openssl yang SAMA>
BLOG_AUTOPUBLISH=0            # 0 = review dulu (2 minggu pertama); 1 = auto-publish
BLOG_APPROVE_WINDOW_MIN=30    # jeda sebelum auto-publish (kalau AUTOPUBLISH=1)
```

> Sebagian env ini baru "hidup" setelah kode blog + ingest jadi. Aman diisi lebih awal.

---

## 4. (Opsional) Agent API key di /admin
Kalau nanti butuh, buka `tncp.web.id/admin` → Users → user role `agent` → aktifkan API key.
Untuk alur publish sekarang TIDAK wajib (publish pakai `INGEST_SECRET`, bukan agent key).

---

## Checklist
- [ ] Hostname `blog.tncp.web.id` di tunnel (Cara A atau B) → `https://blog.tncp.web.id` nyambung ke container
- [ ] `INGEST_SECRET` dibuat (`openssl rand -base64 32`), disimpan aman
- [ ] Env tncp + PAI disiapkan (isi saat deploy)
- [ ] (opsional) agent API key

Kalau ada langkah yang beda dari setup-mu (mis. lokasi config tunnel), bilang — nanti
kucocokkan pas tahap deploy.
