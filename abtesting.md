Kamu adalah coding agent untuk repo Next.js ini: `/home/yudaclairee/coding-camp-dbs/dialens-frontend`.

Tugas: implementasikan A/B testing MVP untuk aplikasi DiaLens berdasarkan kode saat ini. Jangan ubah logic prediksi AI, kontrak API backend, threshold risiko, atau struktur data medis. Fokus pada UX, copywriting, layout, dan tracking event.

PENTING:
- Baca `AGENTS.md` terlebih dahulu.
- Ini Next.js 16, jadi baca guide relevan di `node_modules/next/dist/docs/` sebelum mengubah kode.
- Jangan melakukan refactor besar yang tidak perlu.
- Pertahankan behavior App A sebagai baseline saat ini.
- Buat App B sebagai varian UX baru.
- Pastikan build/lint berjalan jika memungkinkan.

Tujuan utama A/B test:
Mengukur apakah App B dapat meningkatkan:
1. klik CTA dari landing page,
2. penyelesaian form skrining,
3. pemahaman hasil prediksi,
4. klik tindakan lanjutan setelah hasil keluar.

Implementasi teknis:
1. Buat util/hook A/B test, misalnya:
   - `app/lib/ab-testing.ts`
   - atau `app/hooks/use-ab-variant.ts`
2. Variant hanya `A` atau `B`.
3. User bisa dipaksa masuk variant via query param:
   - `?ab=A`
   - `?ab=B`
4. Jika tidak ada query param, assign variant random 50/50 dan simpan di `localStorage`, misalnya key `dialens_ab_variant`.
5. Jangan pakai server-side cookie dulu. Cukup client-side.
6. Tambahkan helper tracking event sederhana:
   - simpan event ke `localStorage` key `dialens_ab_events`
   - bentuk event minimal:
     ```ts
     {
       event: string;
       variant: 'A' | 'B';
       path: string;
       timestamp: string;
       metadata?: Record<string, string | number | boolean>;
     }
     ```
   - juga boleh `console.info` saat development.

Experiment 1: Landing Page `app/page.tsx`
App A:
- Pertahankan copy dan layout sekarang.

App B:
- Ubah headline hero menjadi lebih direct dan user-friendly:
  “Cek Risiko Diabetes dalam 2 Menit”
- Supporting copy lebih sederhana:
  “Isi beberapa data kesehatan dasar, lalu DiaLens membantu memperkirakan tingkat risiko diabetes dan memberi rekomendasi tindak lanjut.”
- CTA utama:
  “Mulai Cek Risiko”
- Tambahkan CTA sekunder menuju `/login`:
  “Masuk ke Akun”
- Track event:
  - `landing_cta_primary_click`
  - `landing_cta_login_click`
  - metadata: `{ ctaText: string }`

Experiment 2: Form Skrining `app/check/page.tsx`
App A:
- Pertahankan form grid sekarang.

App B:
- Buat form step-by-step/wizard tanpa mengubah payload API.
- Step 1: Data Tubuh
  - usia, tinggi, berat, BMI calculated
- Step 2: Riwayat Klinis
  - tekanan darah tinggi, kolesterol tinggi, cek kolesterol, kondisi kesehatan umum
- Step 3: Kebiasaan
  - merokok, aktivitas fisik, konsumsi alkohol berat
- Tampilkan progress sederhana: “Langkah 1 dari 3”, dst.
- Tombol:
  - “Lanjut”
  - “Kembali”
  - step terakhir: “Mulai Analisis AI”
- Validasi minimal:
  - tinggi dan berat wajib sebelum bisa lanjut dari Step 1.
- Jangan ubah field names, state names boleh disesuaikan tapi payload akhir harus tetap:
  `Age, BMI, HighBP, HighChol, CholCheck, Smoker, HvyAlcoholConsump, PhysActivity, GenHlth, Weight, Height`
- Track event:
  - `screening_step_view`
  - `screening_step_next`
  - `screening_step_back`
  - `screening_submit`
  - `screening_success`
  - `screening_error`
  - metadata minimal: `{ step?: number, riskLevel?: string, probability?: number }`

Experiment 3: Hasil Prediksi `app/check/page.tsx`
App A:
- Pertahankan tampilan hasil sekarang.

App B:
- Setelah hasil muncul, tampilkan blok tindakan lanjutan yang lebih jelas:
  - Jika risiko `Tinggi`: CTA utama “Cari Rumah Sakit”
  - Jika risiko `Sedang`: CTA utama “Lihat Rekomendasi & Riwayat”
  - Jika risiko `Rendah`: CTA utama “Simpan dan Pantau Riwayat”
- Tambahkan tombol sekunder:
  - “Skrining Ulang”
  - “Lihat Dashboard”
- Link tujuan:
  - Cari Rumah Sakit: `/rumah-sakit`
  - Riwayat: `/history`
  - Dashboard: `/dashboard`
- Track event:
  - `result_action_click`
  - metadata: `{ action: string, riskLevel: string, probability: number }`

Experiment 4: Dashboard `app/dashboard/page.tsx`
App A:
- Pertahankan dashboard sekarang.

App B:
- Buat CTA “Luncurkan Skrining Baru” lebih terlihat di area atas dashboard, dekat header atau stat cards.
- Jangan hapus quick access lama jika tidak perlu.
- Track event:
  - `dashboard_new_screening_click`

Experiment 5: History `app/history/page.tsx`
App A:
- Pertahankan tabel sekarang.

App B:
- Jangan rewrite total.
- Cukup tambahkan microcopy di header agar value jelas:
  “Gunakan riwayat untuk membandingkan hasil skrining dan mengunduh PDF hasil pemeriksaan.”
- Track event:
  - `history_detail_open`
  - `history_pdf_download`
  - `history_search`
  - metadata search: `{ queryLength: number }`

Acceptance criteria:
- User dengan `?ab=A` selalu melihat baseline.
- User dengan `?ab=B` selalu melihat varian B.
- Tanpa query param, user mendapat A/B random dan tersimpan di localStorage.
- Tidak ada perubahan kontrak API.
- Tidak ada perubahan threshold risiko.
- Tidak ada dependency baru kecuali benar-benar perlu.
- UI tetap responsive mobile dan desktop.
- `npm run lint` dan/atau `npm run build` dijalankan setelah implementasi. Jika gagal karena masalah existing, laporkan dengan jelas.
- Berikan ringkasan file yang diubah dan cara mencoba:
  - `/ ?ab=A`
  - `/ ?ab=B`
  - `/check?ab=B`