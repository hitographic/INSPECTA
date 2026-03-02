# 🔐 Secret Admin Panel Access

## Akses Rahasia ke Admin Panel

Admin Panel sekarang tersembunyi dari menu utama dan hanya bisa diakses dengan cara rahasia.

### 🎯 Cara Akses (untuk Admin saja):

**Method: Secret Click**

1. Login sebagai user dengan permission `view_admin_panel` (contoh: admin)
2. Di halaman **Menu Selection** (Pilih Menu), lihat judul besar "**Pilih Menu**"
3. **Klik judul "Pilih Menu" sebanyak 5 kali dengan cepat** (dalam waktu 2 detik)
4. Jika berhasil, Anda akan otomatis dibawa ke Admin Panel

### ⚡ Catatan Penting:

- Hanya user dengan permission `view_admin_panel` yang bisa akses
- User biasa tidak akan bisa akses meskipun tahu cara rahasianya
- Klik harus dilakukan dalam 2 detik, jika tidak counter akan reset
- Tidak ada indikator visual saat mengklik (benar-benar rahasia)

### 🔧 Technical Details:

- **Trigger**: 5 clicks pada h1 "Pilih Menu"
- **Timeout**: 2000ms (2 detik)
- **Permission Required**: `view_admin_panel`
- **Security**: Backend RLS tetap enforce permissions

### 🎨 User Experience:

**Sebelum (Old Flow):**
```
Login → Admin Panel (langsung) atau Plant Selection
```

**Sesudah (New Flow):**
```
Login → Menu Selection →
  ├─ 5x klik "Pilih Menu" → Admin Panel (secret)
  └─ Pilih "Sanitasi Besar" → Plant Selection → Records
```

### 📱 Untuk User Biasa (Non-Admin):

Menu Selection akan menampilkan 4 menu:
- ✅ Sanitasi Besar (available)
- ⏳ Kliping (coming soon)
- ⏳ Monitoring Area (coming soon)
- ⏳ Audit Internal (coming soon)

User biasa tidak perlu tahu tentang admin panel dan tidak bisa mengaksesnya.

---

**🔒 Keep this secret! Jangan bagikan ke user biasa.**
