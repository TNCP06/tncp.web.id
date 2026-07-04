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

## 1. Cloudflare Tunnel — tambah route `blog.tncp.web.id`

Setup nyata (dari dashboard): tunnel **Cloud-Drive-Telegram**, tab **Published application
routes**. `tncp.web.id` diarahkan ke **nama container Docker** `http://tncpwebid-web-1:3000`.
Blog = **container yang sama** (dibedakan Host oleh middleware app), jadi tinggal tambah 1
route dengan **service yang sama persis**.

### Langkah (dashboard)
1. Cloudflare One → **Networks → Connectors** (atau **Tunnels**) → tunnel **Cloud-Drive-Telegram**
   → tab **Published application routes**.
2. Klik **+ Add a published application route**. Isi:
   - **Public hostname / Hostname**: `blog.tncp.web.id`
     (kalau form pisah: **Subdomain** `blog`, **Domain** `tncp.web.id`)
   - **Path**: `*`
   - **Service / URL**: `http://tncpwebid-web-1:3000`  ← **sama persis** dgn baris `tncp.web.id` (copy).
3. **Save**. Muncul baris baru `blog.tncp.web.id | * | http://tncpwebid-web-1:3000`.

### DNS (kalau `blog.tncp.web.id` belum resolve setelah save)
Cloudflare → domain **tncp.web.id** → **DNS → Records**:
1. Lihat record CNAME milik `tncp.web.id` → target bentuk `xxxxxxxx.cfargotunnel.com`.
2. **Add record**: Type **CNAME**, Name `blog`, Target = **target yang sama** itu, Proxy **ON** (oranye). Save.

### Verifikasi
Buka `https://blog.tncp.web.id`:
- **404** = SUKSES (tunnel + container nyambung; route `(blog)` belum dibangun — normal sekarang).
- **Error DNS / 1016 / 1033** = DNS/route belum beres → cek langkah DNS di atas.

> Catatan: `cloudflared` itu infra bersama. Cukup **TAMBAH** route; jangan ubah/hapus baris
> proyek lain (`stream.*`, `drive.*`, `tncp.web.id`).

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
