# Blog Planlayıcı

Modern ve kullanıcı dostu blog zamanlayıcı uygulaması. Electron.js ile geliştirilmiş cross-platform masaüstü uygulaması.

## Özellikler

- 📅 **Zaman Çizelgesi**: Görsel takvim arayüzü ile blog görevlerini takip edin
- 🏢 **Firma Yönetimi**: Her firma için ayrı blog zamanlayıcıları oluşturun
- ⏰ **Esnek Zamanlama**: Haftalık/aylık sıklık seçenekleri
- 📊 **Görev Takibi**: Bugünkü görevleri görün ve tamamlayın
- 🔔 **Bildirimler**: Otomatik görev hatırlatıcıları
- 🔄 **Otomatik Güncelleme**: Uygulama içinden güncelleme sistemi
- 💾 **Yerel Veri Saklama**: Verileriniz güvenle yerel olarak saklanır

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Geliştirme modunda çalıştırın:**
```bash
npm start
```

3. **Geliştirme modunda DevTools ile çalıştırın:**
```bash
npm run dev
```

## Kullanım

### Yeni Blog Zamanlayıcı Ekleme

1. "Blog Zamanlayıcı Ekle" butonuna tıklayın
2. Firma adını girin
3. Başlangıç tarihini seçin
4. Yayın sıklığını belirleyin (haftalık/aylık)
5. Sıklık değerini girin (1-52 hafta veya 1-12 ay)
6. Bitiş türünü seçin:
   - **Sınırsız**: Sürekli devam eder
   - **Süre**: Belirli yıl sayısı kadar devam eder
   - **Bitiş Tarihi**: Belirli tarihe kadar devam eder
7. "Kaydet" butonuna tıklayın

### Görev Takibi

- **Bugünkü Görevler**: Sol panelde bugün için planlanan blog görevlerini görün
- **Zaman Çizelgesi**: Ana ekranda takvim görünümünde görevleri takip edin
- **Görev Tamamlama**: Checkbox'ları işaretleyerek görevleri tamamlayın
- **Gün Detayları**: Takvimde görev olan günlere tıklayarak detayları görün

### Bildirimler

- Uygulama her dakika bugünkü görevleri kontrol eder
- Tamamlanmamış görevler varsa bildirim gösterir
- Tray'da çalışır ve arka planda bildirimler gönderir

## Geliştirme

### Proje Yapısı

```
blog-planlayici/
├── main.js              # Electron ana süreç
├── index.html           # Ana HTML dosyası
├── styles.css           # CSS stilleri
├── renderer.js          # Renderer süreç JavaScript
├── package.json         # Proje konfigürasyonu
├── data.json            # Yerel veri dosyası (otomatik oluşur)
└── assets/              # İkonlar ve diğer kaynaklar
```

### Build ve Dağıtım

**Windows .exe dosyası oluşturma:**
```bash
npm run dist
```

**Release oluşturma:**
```bash
npm run release
```

### Otomatik Güncelleme

Uygulama electron-updater kullanarak otomatik güncelleme sistemine sahiptir:

1. GitHub'da release oluşturun
2. Uygulama otomatik olarak güncellemeleri kontrol eder
3. Yeni sürüm varsa indirir ve kurar

## Teknolojiler

- **Electron.js**: Cross-platform masaüstü uygulaması
- **Moment.js**: Tarih işlemleri
- **Font Awesome**: İkonlar
- **CSS3**: Modern ve responsive tasarım

## Lisans

MIT License

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Destek

Sorunlarınız için GitHub Issues kullanın veya iletişime geçin. 