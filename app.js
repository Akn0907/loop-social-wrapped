const slides = [
  { eyebrow: 'AYIN ÖNE ÇIKANI', title: 'Gündem hiç<br>elinden düşmemiş.', copy: 'Bu ay gönderilerinin %38’i gündem ve teknoloji üzerineydi. Merakın timeline’ına da yansımış.', label: 'KASIM', sub: '2026' },
  { eyebrow: 'ETKİLEŞİM ÇEMBERİN', title: 'Sohbetin hep<br>bir yerlerde sürmüş.', copy: '24 kişiyle karşılıklı etkileşim kurdun. Mert ile sohbet trafiğiniz bu ayın zirvesinde.', label: '24 KİŞİ', sub: 'ÇEMBERİNDE' },
  { eyebrow: 'DİJİTAL İMZAN', title: 'Senin enerjin:<br>Gündem radarı.', copy: 'Hızlı, meraklı ve konuşmaya hazır. Kasım boyunca en çok bu enerjiyi yansıttın.', label: 'SENİN', sub: 'ENERJİN' },
];
const leaderboards = {
  mentions: [
    { rank: '01', avatar: 'M', tone: 'av1', name: 'Mert Yılmaz', handle: '@mertyilmaz', count: 28, unit: 'mention' },
    { rank: '02', avatar: 'E', tone: 'av2', name: 'Ece Aydın', handle: '@eceaydin', count: 19, unit: 'mention' },
    { rank: '03', avatar: 'S', tone: 'av3', name: 'Selin Kaya', handle: '@selinkaya', count: 14, unit: 'mention' },
  ],
  replies: [
    { rank: '01', avatar: 'E', tone: 'av2', name: 'Ece Aydın', handle: '@eceaydin', count: 41, unit: 'yanıt' },
    { rank: '02', avatar: 'M', tone: 'av1', name: 'Mert Yılmaz', handle: '@mertyilmaz', count: 35, unit: 'yanıt' },
    { rank: '03', avatar: 'C', tone: 'av4', name: 'Can Demir', handle: '@candemir', count: 22, unit: 'yanıt' },
  ],
  you: [
    { rank: '01', avatar: 'S', tone: 'av3', name: 'Selin Kaya', handle: '@selinkaya', count: 17, unit: 'mention' },
    { rank: '02', avatar: 'M', tone: 'av1', name: 'Mert Yılmaz', handle: '@mertyilmaz', count: 12, unit: 'mention' },
    { rank: '03', avatar: 'D', tone: 'av5', name: 'Deniz Arı', handle: '@denizari', count: 9, unit: 'mention' },
  ],
};
let currentSlide = 0;
let toastTimer;
let latestTweets = [];
const config = window.LOOP_CONFIG || {};
const oauthSettings = {
  x: {
    clientId: config.xClientId,
    authorizeUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    scopes: ['users.read', 'tweet.read'],
  },
  spotify: {
    clientId: config.spotifyClientId,
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scopes: ['user-top-read', 'user-read-recently-played'],
  },
};

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function renderLeaders(kind = 'mentions') {
  const list = document.querySelector('#leader-list');
  list.replaceChildren(...leaderboards[kind].map(person => {
    const row = document.createElement('div'); row.className = 'leader-row';
    const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = person.rank;
    const avatar = document.createElement('span'); avatar.className = `avatar ${person.tone}`; avatar.textContent = person.avatar;
    const nameBlock = document.createElement('span'); nameBlock.className = 'leader-name';
    const name = document.createElement('b'); name.textContent = person.name;
    const handle = document.createElement('small'); handle.textContent = person.handle;
    nameBlock.append(name, handle);
    const score = document.createElement('span'); score.className = 'leader-score'; score.append(document.createTextNode(String(person.count)));
    const unit = document.createElement('small'); unit.textContent = person.unit; score.append(unit);
    row.append(rank, avatar, nameBlock, score);
    return row;
  }));
}

function renderSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  const slide = slides[currentSlide];
  const card = document.querySelector('#wrapped-card');
  card.classList.remove('replay');
  void card.offsetWidth;
  card.classList.add('replay');
  document.querySelector('#slide-count').innerHTML = `${String(currentSlide + 1).padStart(2, '0')} <i>/ 03</i>`;
  document.querySelector('.wrapped-chip').innerHTML = `<span>✦</span> ${slide.eyebrow}`;
  setLineText(document.querySelector('#slide-title'), slide.title);
  document.querySelector('#slide-copy').textContent = slide.copy;
  document.querySelector('.label-one').innerHTML = `${slide.label}<br><b>${slide.sub}</b>`;
  document.querySelectorAll('.slide-progress i').forEach((item, i) => item.classList.toggle('progress-active', i === currentSlide));
}

function setLineText(element, value) {
  const lines = String(value || '').replace(/<br\s*\/?>/gi, '\n').split('\n');
  const nodes = [];
  lines.forEach((line, index) => { if (index) nodes.push(document.createElement('br')); nodes.push(document.createTextNode(line)); });
  element.replaceChildren(...nodes);
}

function openAiModal() {
  if (!sessionStorage.getItem('loop.x.access') || !latestTweets.length) {
    toast('Önce X hesabını bağla; gönderi verisi henüz yok.');
    openConnectModal();
    return;
  }
  document.querySelector('#ai-error').textContent = '';
  document.querySelector('#ai-consent').checked = false;
  document.querySelector('#run-ai-analysis').disabled = true;
  document.querySelector('#ai-consent-modal').hidden = false;
  document.querySelector('#close-ai-modal').focus();
}

async function runAiAnalysis() {
  const button = document.querySelector('#run-ai-analysis');
  const error = document.querySelector('#ai-error');
  button.disabled = true;
  button.textContent = 'Gönderiler analiz ediliyor…';
  error.textContent = '';
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tweets: latestTweets.slice(0, 100) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analiz tamamlanamadı.');
    const raw = data.analysis.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const analysis = JSON.parse(raw);
    const topics = Array.isArray(analysis.topics) ? analysis.topics.filter(topic => typeof topic === 'string').slice(0, 3) : [];
    slides[0].title = analysis.summaryTitle || 'Bu ayın X özeti';
    slides[0].copy = `${analysis.summary || ''}${topics.length ? ` Konuların: ${topics.join(', ')}.` : ''}`;
    slides[0].eyebrow = 'GEMINI AYLIK ANALİZİ';
    document.querySelector('.meme-text h3').textContent = analysis.memeTitle || 'Gündem radarı';
    document.querySelector('.meme-text p').textContent = analysis.memeReason || analysis.style || 'Gönderi tarzından eğlenceli bir eşleşme.';
    document.querySelector('.meme-disc span').textContent = (analysis.memeTitle || 'GÜNDEM RADARI').toLocaleUpperCase('tr-TR');
    document.querySelector('.song-reason').textContent = `♫ ${analysis.songVibe || analysis.style || 'Gönderi enerjinle eşleşti'}`;
    renderSlide(0);
    document.querySelector('#ai-consent-modal').hidden = true;
    toast('Aylık analiz hazır.');
  } catch (exception) {
    error.textContent = exception instanceof SyntaxError ? 'Analiz yanıtı beklenen biçimde gelmedi; yeniden deneyebilirsin.' : exception.message;
  } finally {
    button.disabled = !document.querySelector('#ai-consent').checked;
    button.innerHTML = 'Onayla ve analiz et <span>✦</span>';
  }
}

function renderCircle(items) {
  const visual = document.querySelector('.orbit-visual');
  visual.querySelectorAll('.orbit-person').forEach(person => person.remove());
  const positions = ['person-one', 'person-two', 'person-three', 'person-four', 'person-five', 'person-six'];
  const colors = ['av1', 'av2', 'av3', 'av4', 'av5', 'av6'];
  items.slice(0, positions.length).forEach((item, index) => {
    const name = item.person.name || item.person.username || 'X kullanıcısı';
    const username = item.person.username || 'x-kullanıcısı';
    const button = document.createElement('button');
    button.className = `orbit-person ${positions[index]}`;
    button.dataset.person = `@${username} · ${item.mentions} mention`;
    button.setAttribute('aria-label', `${name}, ${item.mentions} mention`);
    const avatar = document.createElement('span'); avatar.className = `avatar ${colors[index]}`; avatar.textContent = name[0].toUpperCase();
    const status = document.createElement('i');
    button.append(avatar, status);
    button.addEventListener('click', () => toast(button.dataset.person));
    visual.append(button);
  });
  const top = items[0];
  const title = document.querySelector('.circle-insight b');
  const copy = document.querySelector('.circle-insight p');
  if (!top) {
    title.textContent = 'Bu ay yeni etkileşim yok';
    copy.textContent = 'Mention ve yanıtların geldikçe çemberin burada oluşacak.';
    return;
  }
  const displayName = top.person.name || `@${top.person.username}`;
  title.textContent = `${items.length} hesap çemberinde`;
  copy.replaceChildren(document.createTextNode(`${displayName} ile bu ay `));
  const strong = document.createElement('strong'); strong.textContent = `${top.mentions} mention`;
  copy.append(strong, document.createTextNode(' üzerinden etkileşim kurmuşsun.'));
}

function openConnectModal() {
  document.querySelector('#connect-modal').hidden = false;
  document.querySelector('#close-modal').focus();
}

function closeConnectModal() {
  document.querySelector('#connect-modal').hidden = true;
  document.querySelector('#connect-x').focus();
}

function setProviderConnected(provider, label) {
  const status = document.querySelector(`#${provider}-status`);
  status.textContent = label || 'Bağlandı';
  status.classList.add('connected');
  document.querySelector(`#disconnect-${provider}`).hidden = false;
  const side = document.querySelector('.connected-card');
  if (provider === 'x') {
    const profile = sessionStorage.getItem('loop.x.profile');
    const data = profile ? JSON.parse(profile) : null;
    const mini = document.querySelector('.profile-mini');
    mini.querySelector('strong').textContent = data?.username ? `@${data.username}` : 'X hesabı bağlı';
    mini.querySelector('small').textContent = data?.name || 'Bu oturum için bağlı';
    if (data?.profile_image_url) {
      try {
        const imageUrl = new URL(data.profile_image_url);
        if (imageUrl.protocol === 'https:') {
          const image = document.createElement('img'); image.src = imageUrl.href; image.alt = ''; image.loading = 'lazy';
          mini.querySelector('.avatar').replaceChildren(image);
        }
      } catch {}
    }
    side.querySelector('strong').textContent = 'X bağlı';
    side.querySelector('small').textContent = 'İzin verilen veriler';
    side.querySelector('.connected-dot').style.background = '#8ed7b4';
    side.querySelector('.connected-dot').style.boxShadow = '0 0 10px #8ed7b480';
    document.querySelector('#connect-x span').textContent = 'X bağlı';
  }
}

function disconnectProvider(provider) {
  ['access', 'refresh', 'expires', 'profile', 'name', 'trackUrl'].forEach(part => sessionStorage.removeItem(`loop.${provider}.${part}`));
  toast('Bu tarayıcı oturumundaki bağlantı kaldırıldı. İzni tamamen iptal etmek için platformun uygulama ayarlarını da kullan.');
  setTimeout(() => location.reload(), 900);
}

function encodeBase64Url(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(length = 64) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

async function startOAuth(provider) {
  const settings = oauthSettings[provider];
  const error = document.querySelector('#modal-error');
  error.textContent = '';
  if (!settings?.clientId) {
    error.textContent = `${provider === 'x' ? 'X' : 'Spotify'} Client ID’si config.js dosyasına girilmemiş.`;
    return;
  }
  const redirectUri = `${location.origin}${location.pathname}`;
  const state = randomString(32);
  const verifier = randomString(64);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = encodeBase64Url(new Uint8Array(digest));
  sessionStorage.setItem(`loop.oauth.${provider}`, JSON.stringify({ state, verifier, redirectUri }));
  const url = new URL(settings.authorizeUrl);
  url.search = new URLSearchParams({
    response_type: 'code', client_id: settings.clientId, redirect_uri: redirectUri,
    scope: settings.scopes.join(' '), state, code_challenge: challenge, code_challenge_method: 'S256',
  });
  location.assign(url.toString());
}

async function exchangeCode(provider, code, pending) {
  const settings = oauthSettings[provider];
  const body = new URLSearchParams({
    grant_type: 'authorization_code', code, redirect_uri: pending.redirectUri,
    client_id: settings.clientId, code_verifier: pending.verifier,
  });
  const response = await fetch(settings.tokenUrl, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body,
  });
  const token = await response.json();
  if (!response.ok || !token.access_token) throw new Error(token.error_description || token.error || 'İzin alınamadı. Uygulama ayarlarını kontrol et.');
  sessionStorage.setItem(`loop.${provider}.access`, token.access_token);
  if (token.refresh_token) sessionStorage.setItem(`loop.${provider}.refresh`, token.refresh_token);
  sessionStorage.setItem(`loop.${provider}.expires`, String(Date.now() + token.expires_in * 1000));
  return token.access_token;
}

async function connectX(accessToken) {
  const headers = { authorization: `Bearer ${accessToken}` };
  const response = await fetch('https://api.x.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics', { headers });
  const result = await response.json();
  if (!response.ok || !result.data) throw new Error(result.detail || result.title || 'X profil verisi alınamadı. API erişimini kontrol et.');
  sessionStorage.setItem('loop.x.profile', JSON.stringify(result.data));
  setProviderConnected('x');
  toast(`X hesabın bağlandı: @${result.data.username}`);
  try { await loadXInsights(accessToken, result.data); }
  catch (error) { toast(`X bağlandı; analiz verisi alınamadı: ${error.message}`); }
}

async function loadXInsights(accessToken, profile) {
  const headers = { authorization: `Bearer ${accessToken}` };
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const sinceId = new URLSearchParams({ max_results: '100', 'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets', expansions: 'author_id', 'user.fields': 'name,username,profile_image_url' });
  const [postsResponse, mentionsResponse] = await Promise.all([
    fetch(`https://api.x.com/2/users/${profile.id}/tweets?${sinceId}`, { headers }),
    fetch(`https://api.x.com/2/users/${profile.id}/mentions?${sinceId}`, { headers }),
  ]);
  const [posts, mentionPayload] = await Promise.all([postsResponse.json(), mentionsResponse.json()]);
  if (!postsResponse.ok) throw new Error(posts.detail?.[0]?.message || posts.title || 'Gönderilerine erişilemiyor.');
  const mentions = mentionsResponse.ok ? mentionPayload : { data: [], includes: { users: [] } };
  const monthPosts = (posts.data || []).filter(post => new Date(post.created_at) >= monthStart);
  const monthMentions = (mentions.data || []).filter(tweet => new Date(tweet.created_at) >= monthStart);
  latestTweets = monthPosts.map(post => post.text).filter(Boolean).slice(0, 100);
  document.querySelectorAll('.stat-number')[0].innerHTML = `${monthPosts.length}<small> gönderi</small>`;
  document.querySelectorAll('.stat-number')[1].innerHTML = `${monthMentions.length}<small> mention</small>`;
  const people = new Map((mentions.includes?.users || []).map(person => [person.id, person]));
  const byAuthor = new Map();
  monthMentions.forEach(tweet => {
    if (!tweet.author_id) return;
    const person = people.get(tweet.author_id) || { username: 'x-kullanıcısı', name: 'X kullanıcısı' };
    const item = byAuthor.get(tweet.author_id) || { person, mentions: 0, replies: 0 };
    item.mentions += 1;
    if ((tweet.referenced_tweets || []).some(ref => ref.type === 'replied_to')) item.replies += 1;
    byAuthor.set(tweet.author_id, item);
  });
  const topPeople = [...byAuthor.values()].sort((a, b) => b.mentions - a.mentions).slice(0, 3);
  if (topPeople.length) {
    leaderboards.mentions = topPeople.map((item, i) => ({ rank: `0${i + 1}`, avatar: (item.person.name || item.person.username || '?')[0].toUpperCase(), tone: `av${(i % 6) + 1}`, name: item.person.name || item.person.username || 'X kullanıcısı', handle: `@${item.person.username || 'x-kullanıcısı'}`, count: item.mentions, unit: 'mention' }));
    const replyPeople = [...byAuthor.values()].filter(item => item.replies).sort((a, b) => b.replies - a.replies).slice(0, 3);
    leaderboards.replies = replyPeople.map((item, i) => ({ rank: `0${i + 1}`, avatar: (item.person.name || item.person.username || '?')[0].toUpperCase(), tone: `av${(i % 6) + 1}`, name: item.person.name || item.person.username || 'X kullanıcısı', handle: `@${item.person.username || 'x-kullanıcısı'}`, count: item.replies, unit: 'yanıt' }));
    const youMention = new Map();
    monthPosts.forEach(post => (post.entities?.mentions || []).forEach(mention => {
      if (!mention.username) return;
      const key = mention.username;
      const item = youMention.get(key) || { name: mention.username, count: 0 };
      item.count += 1; youMention.set(key, item);
    }));
    const outgoing = [...youMention.values()].sort((a, b) => b.count - a.count).slice(0, 3);
    leaderboards.you = outgoing.map((item, i) => ({ rank: `0${i + 1}`, avatar: item.name[0].toUpperCase(), tone: `av${(i % 6) + 1}`, name: item.name, handle: `@${item.name}`, count: item.count, unit: 'mention' }));
    renderLeaders(document.querySelector('.leader-tab.active')?.dataset.kind || 'mentions');
    document.querySelectorAll('.stat-number')[2].innerHTML = `${byAuthor.size}<small> hesap</small>`;
    renderCircle([...byAuthor.values()].sort((a, b) => b.mentions - a.mentions));
  } else {
    leaderboards.mentions = [];
    leaderboards.replies = [];
    leaderboards.you = [];
    renderLeaders(document.querySelector('.leader-tab.active')?.dataset.kind || 'mentions');
    renderCircle([]);
  }
}

async function connectSpotify(accessToken) {
  const headers = { authorization: `Bearer ${accessToken}` };
  const [topResponse, recentResponse] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', { headers }),
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers }),
  ]);
  const [top, recent] = await Promise.all([topResponse.json(), recentResponse.json()]);
  if (!topResponse.ok) throw new Error(top.error?.message || 'Spotify dinleme verisi alınamadı. Geliştirici erişimini kontrol et.');
  const recentCounts = new Map();
  (recent.items || []).forEach(item => recentCounts.set(item.track.id, (recentCounts.get(item.track.id) || 0) + 1));
  const track = (top.items || []).slice().sort((a, b) =>
    ((recentCounts.get(b.id) || 0) * 3 + (top.items.indexOf(b) * -1)) - ((recentCounts.get(a.id) || 0) * 3 + (top.items.indexOf(a) * -1))
  )[0];
  if (!track) throw new Error('Spotify son dönem için eşleşecek bir parça döndürmedi.');
  const profileName = sessionStorage.getItem('loop.spotify.name') || 'Spotify hesabı bağlı';
  setProviderConnected('spotify', 'Bağlandı');
  document.querySelector('#spotify-status').textContent = profileName;
  document.querySelector('.song-info h3').textContent = track.name;
  document.querySelector('.song-info>p').textContent = `${track.artists.map(artist => artist.name).join(', ')} · En çok dinlenenlerin`;
  const cover = track.album?.images?.[0]?.url;
  if (cover) {
    try {
      const coverUrl = new URL(cover);
      if (coverUrl.protocol === 'https:' && coverUrl.hostname.endsWith('scdn.co')) document.querySelector('.album-art').style.backgroundImage = `linear-gradient(0deg,#0b1524bb,transparent 70%),url("${coverUrl.href}")`;
    } catch {}
  }
  const button = document.querySelector('#spotify-connect');
  button.innerHTML = '<span class="spotify-mark">◉</span> Spotify’da aç <span>↗</span>';
  sessionStorage.setItem('loop.spotify.trackUrl', track.external_urls.spotify || '');
  toast('Hesabının şarkısı güncellendi.');
}

async function finishOAuthCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  if (!code && !params.has('error')) return;
  const provider = ['x', 'spotify'].find(name => {
    try { return JSON.parse(sessionStorage.getItem(`loop.oauth.${name}`) || 'null')?.state === returnedState; } catch { return false; }
  });
  history.replaceState({}, '', `${location.pathname}${location.hash}`);
  if (!provider) { toast('Hesap bağlantısı doğrulanamadı. Lütfen yeniden dene.'); return; }
  const pending = JSON.parse(sessionStorage.getItem(`loop.oauth.${provider}`));
  sessionStorage.removeItem(`loop.oauth.${provider}`);
  if (params.has('error')) { toast('Hesap bağlantısı iptal edildi veya reddedildi.'); return; }
  try {
    const accessToken = await exchangeCode(provider, code, pending);
    if (provider === 'x') await connectX(accessToken);
    else {
      const meResponse = await fetch('https://api.spotify.com/v1/me', { headers: { authorization: `Bearer ${accessToken}` } });
      const me = await meResponse.json();
      if (!meResponse.ok) throw new Error(me.error?.message || 'Spotify profili okunamadı.');
      sessionStorage.setItem('loop.spotify.name', me.display_name || me.id);
      await connectSpotify(accessToken);
    }
    openConnectModal();
  } catch (error) {
    openConnectModal();
    document.querySelector('#modal-error').textContent = error.message;
  }
}

document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => toast(button.dataset.toast)));
document.querySelectorAll('.leader-tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.leader-tab').forEach(item => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
  renderLeaders(tab.dataset.kind);
}));
document.querySelector('#prev-slide').addEventListener('click', () => renderSlide(currentSlide - 1));
document.querySelector('#next-slide').addEventListener('click', () => renderSlide(currentSlide + 1));
document.querySelector('#open-wrapped').addEventListener('click', () => { document.querySelector('#wrapped').scrollIntoView({ behavior: 'smooth', block: 'center' }); renderSlide(0); });
document.querySelector('#view-all-wrapped').addEventListener('click', openAiModal);
document.querySelector('#share-summary').addEventListener('click', async () => {
  const text = `Letıthappenakin Kasım Wrapped: ${slides[currentSlide].title.replace('<br>', ' ')}`;
  try { if (navigator.share) await navigator.share({ title: 'Letıthappenakin Wrapped', text }); else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast('Özet metni panoya kopyalandı.'); } else toast('Paylaşım özelliği bu tarayıcıda kullanılamıyor.'); }
  catch (error) { if (error.name !== 'AbortError') toast('Paylaşım başlatılamadı.'); }
});
document.querySelector('#refresh-match').addEventListener('click', event => {
  const button = event.currentTarget;
  button.classList.add('spinning');
  setTimeout(() => button.classList.remove('spinning'), 650);
  toast('Gerçek eşleşmeler için hesabını bağlaman gerekecek.');
});
document.querySelector('#spotify-connect').addEventListener('click', () => {
  const trackUrl = sessionStorage.getItem('loop.spotify.trackUrl');
  if (trackUrl) window.open(trackUrl, '_blank', 'noopener,noreferrer');
  else openConnectModal();
});
document.querySelector('#connect-x').addEventListener('click', openConnectModal);
document.querySelector('#close-modal').addEventListener('click', closeConnectModal);
document.querySelector('#close-ai-modal').addEventListener('click', () => { document.querySelector('#ai-consent-modal').hidden = true; });
document.querySelector('#connect-modal').addEventListener('click', event => { if (event.target.id === 'connect-modal') closeConnectModal(); });
document.querySelector('#ai-consent-modal').addEventListener('click', event => { if (event.target.id === 'ai-consent-modal') document.querySelector('#ai-consent-modal').hidden = true; });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.querySelector('#connect-modal').hidden) closeConnectModal();
  if (event.key === 'Escape' && !document.querySelector('#ai-consent-modal').hidden) document.querySelector('#ai-consent-modal').hidden = true;
});
document.querySelector('#ai-consent').addEventListener('change', event => { document.querySelector('#run-ai-analysis').disabled = !event.target.checked; });
document.querySelector('#run-ai-analysis').addEventListener('click', runAiAnalysis);
document.querySelector('#authorize-x').addEventListener('click', () => startOAuth('x'));
document.querySelector('#authorize-spotify').addEventListener('click', () => startOAuth('spotify'));
document.querySelector('#disconnect-x').addEventListener('click', () => disconnectProvider('x'));
document.querySelector('#disconnect-spotify').addEventListener('click', () => disconnectProvider('spotify'));
document.querySelector('#circle-period').addEventListener('click', () => toast('Dönem seçimi hesap bağlantısı sonrası açılacak.'));
document.querySelectorAll('.orbit-person').forEach(person => person.addEventListener('click', () => toast(person.dataset.person)));
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item === link));
  const labels = { overview: 'Genel bakış', wrapped: 'Aylık Wrapped', circle: 'Etkileşim çemberi', leaderboard: 'Tweet liderliği', 'meme-song': 'Meme & şarkı' };
  document.querySelector('#crumb-current').textContent = labels[link.dataset.nav];
}));

const now = new Date();
const currentMonth = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(now);
const currentMonthTitle = `${currentMonth[0].toLocaleUpperCase('tr-TR')}${currentMonth.slice(1)}`;
const currentMonthUpper = currentMonth.toLocaleUpperCase('tr-TR');
const currentYear = String(now.getFullYear());
document.querySelector('#current-period').textContent = `${currentMonthUpper} ${currentYear}`;
document.querySelector('#dashboard-date').textContent = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now).toLocaleUpperCase('tr-TR');
document.querySelector('#wrapped-heading').textContent = `${currentMonthTitle} Wrapped`;
document.querySelector('#art-month').textContent = currentMonthUpper;
document.querySelector('#art-year').textContent = currentYear;
document.querySelector('#song-period').textContent = `${currentMonthTitle} ${currentYear}`;
slides[0].label = currentMonthUpper;
slides[0].sub = currentYear;

renderLeaders();
if (sessionStorage.getItem('loop.x.access')) {
  const profile = sessionStorage.getItem('loop.x.profile');
  if (profile) {
    setProviderConnected('x', 'Bu oturumda');
    connectX(sessionStorage.getItem('loop.x.access')).catch(error => toast(`X oturumu yenilenmeli: ${error.message}`));
  }
}
if (sessionStorage.getItem('loop.spotify.access')) {
  setProviderConnected('spotify', 'Bu oturumda');
  connectSpotify(sessionStorage.getItem('loop.spotify.access')).catch(error => toast(`Spotify oturumu yenilenmeli: ${error.message}`));
}
finishOAuthCallback();
