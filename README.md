# Loop

Mavi-siyah görsel tasarıma sahip, X Wrapped / etkileşim paneli prototipi.

## Yerelde çalıştırma

Node.js 18 veya üstü kurulu bilgisayarda bu klasörden `npm start` çalıştır. Windows'ta `Baslat.cmd` dosyasına çift tıklayabilir veya Python kuruluysa yerel önizleme sunucusu olarak kullanabilirsin. Adres: `http://127.0.0.1:4173`.

Gemini ile Wrapped analizi için `.env.example` dosyasını `.env` adıyla kopyala ve kendi `GEMINI_API_KEY` değerini gir. Anahtar sunucu tarafında kalır, tarayıcıya gönderilmez. Analiz kullanıcı onayından sonra çalışır ve Gemini Interactions API isteğinde `store: false` kullanır.

## OAuth bağlantı ayarları

Arayüzdeki gerçek bağlantılar için kendi geliştirici uygulamalarının **Client ID** değerlerini `.env` dosyasındaki `X_CLIENT_ID` ve `SPOTIFY_CLIENT_ID` alanlarına gir. Sunucu bu değerleri `/config.js` üzerinden arayüze verir; bunlar herkese açık OAuth kimlikleridir.

- X Developer Portal'da OAuth 2.0 etkin, **Single Page App / public client** türünde bir uygulama oluştur. Callback/Redirect URI olarak `http://127.0.0.1:4173/` ekle.
- Spotify Developer Dashboard'da bir uygulama oluştur; Redirect URI olarak `http://127.0.0.1:4173/` ekle.
- **Client Secret, API anahtarı veya kullanıcı token'ını `config.js` içine ya da herkese açık dosyalara koyma.**

X için prototip şu salt okunur kapsamları ister: `users.read`, `tweet.read`. Spotify için `user-top-read` ve `user-read-recently-played` istenir. OAuth token'ları yalnızca o tarayıcı oturumu boyunca saklanır; izin verilmeden API çağrısı yapılmaz.

X ve Spotify geliştirici erişimi sağlayıcıların planlarına, onaylarına ve güncel sınırlamalarına tabidir. Bağlantı akışı, Client ID'ler eklenmeden gerçek hesapta kullanılamaz.

## Prototip sınırı

X gönderileri ve mention uçları bağlantıdan sonra okunur; hesap sayıları, liderlik ve çember verileri alınabilen son 100 gönderi/mention ile sınırlıdır. Gemini analizi açık kullanıcı onayıyla bu gönderi metinlerini işler. Çember/rozet/meme görseli ve Wrapped’in bazı kartları hâlâ prototip örnekleridir.

Bu sürüm OAuth token'larını yalnızca tarayıcı sekmesi boyunca saklar ve X/Spotify erişimini sekme kapanınca kaybeder. Herkese açık üretim dağıtımından önce hesap oturumu, hız sınırı, gizlilik açıklamaları ve sağlayıcı uygulama erişim onayları eklenmelidir. Yerel varsayılan sunucu `127.0.0.1`'e bağlanır; Render'da `HOST=0.0.0.0` kullanılır.

## Render'da önizleme yayını

Bu depo, Node.js web servisi olarak Render'a bağlanabilir:

1. Render Dashboard'da **New → Web Service** seçip `Akn0907/loop-social-wrapped` deposunu bağla.
2. Build Command `npm install`, Start Command `npm start` olsun.
3. Environment alanında `HOST=0.0.0.0` ekle. İsteğe bağlı olarak `GEMINI_API_KEY`, `GEMINI_MODEL`, `X_CLIENT_ID` ve `SPOTIFY_CLIENT_ID` değerlerini de ekle. API anahtarını yalnızca Render'ın gizli ortam değişkeni alanına gir; GitHub'a yükleme.
4. Render URL'si oluştuktan sonra X ve Spotify geliştirici panellerindeki Redirect URI değerlerini tam olarak `https://<render-adresi>/` yap.

Anahtarlar ve Client ID'ler eklenmeden arayüz önizleme olarak açılır; gerçek Gemini, X ve Spotify bağlantıları çalışmaz. Render'ın ücretsiz web servisleri 15 dakika istek almayınca uykuya geçer ve ilk açılış yavaş olabilir; bu seçenek üretim hizmeti için uygun değildir.

Bu kod bir prototiptir. Herkese açık kullanıcı trafiği almadan önce Gemini kullanımına bütçe/hız sınırı, uygun kullanıcı oturumu ve gizlilik açıklamaları ekle. X ve Spotify API erişimi sağlayıcıların onay ve plan koşullarına bağlıdır.
