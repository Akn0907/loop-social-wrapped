# Loop

Mavi-siyah görsel tasarıma sahip, X Wrapped / etkileşim paneli prototipi.

## Yerelde çalıştırma

Node.js 18 veya üstü kurulu bilgisayarda bu klasörden `npm start` çalıştır. Windows'ta `Baslat.cmd` dosyasına çift tıklayabilir veya Python kuruluysa yerel önizleme sunucusu olarak kullanabilirsin. Adres: `http://127.0.0.1:4173`.

Gemini ile Wrapped analizi için `.env.example` dosyasını `.env` adıyla kopyala ve kendi `GEMINI_API_KEY` değerini gir. Anahtar sunucu tarafında kalır, tarayıcıya gönderilmez. Analiz kullanıcı onayından sonra çalışır ve Gemini Interactions API isteğinde `store: false` kullanır.

## OAuth bağlantı ayarları

Arayüzdeki gerçek bağlantılar için kendi geliştirici uygulamalarının **Client ID** değerlerini `config.js` dosyasına gir:

- X Developer Portal'da OAuth 2.0 etkin, **Single Page App / public client** türünde bir uygulama oluştur. Callback/Redirect URI olarak `http://127.0.0.1:4173/` ekle.
- Spotify Developer Dashboard'da bir uygulama oluştur; Redirect URI olarak `http://127.0.0.1:4173/` ekle.
- Client ID'ler tarayıcıda kullanılan herkese açık kimliklerdir. **Client Secret, API anahtarı veya kullanıcı token'ı `config.js` içine koyma.**

X için prototip şu salt okunur kapsamları ister: `users.read`, `tweet.read`. Spotify için `user-top-read` ve `user-read-recently-played` istenir. OAuth token'ları yalnızca o tarayıcı oturumu boyunca saklanır; izin verilmeden API çağrısı yapılmaz.

X ve Spotify geliştirici erişimi sağlayıcıların planlarına, onaylarına ve güncel sınırlamalarına tabidir. Bağlantı akışı, Client ID'ler eklenmeden gerçek hesapta kullanılamaz.

## Prototip sınırı

X gönderileri ve mention uçları bağlantıdan sonra okunur; hesap sayıları, liderlik ve çember verileri alınabilen son 100 gönderi/mention ile sınırlıdır. Gemini analizi açık kullanıcı onayıyla bu gönderi metinlerini işler. Çember/rozet/meme görseli ve Wrapped’in bazı kartları hâlâ prototip örnekleridir.

Bu yerel sürüm OAuth token'larını yalnızca tarayıcı sekmesi boyunca saklar ve X/Spotify erişimini sekme kapanınca kaybeder. Herkese açık dağıtım öncesinde OAuth token'larını güvenli sunucu oturumuna taşıma, hesap sahipliği, hız sınırlama, gizlilik politikası ve sağlayıcı uygulama erişim onayları eklenmelidir. Bu sunucu yalnızca `127.0.0.1`'e bağlanır.
