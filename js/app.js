/* ============================================================
   SMAPATISPA NEXORA — app.js : boot, autentikasi, shell, router, pencarian
   ============================================================ */
'use strict';

const LABEL_PERAN = { admin: 'Admin', bk: 'Guru BK', kesiswaan: 'Kesiswaan', wali: 'Wali Kelas', piket: 'Guru Piket', kepsek: 'Kepala Sekolah', siswa: 'Siswa', ortu: 'Orang Tua' };

/** Menu per peran (sidebar & halaman Lainnya). n = fungsi jumlah lencana. */
const MENU = {
  siswa: [
    { k: 'beranda', t: 'Beranda', ic: 'house' }, { k: 'konseling', t: 'Ajukan Konseling', ic: 'heart-handshake' }, { k: 'jadwal', t: 'Jadwal Saya', ic: 'calendar-days' },
    { k: 'lapor', t: 'Lapor Kasus', ic: 'shield-alert' }, { k: 'lacak', t: 'Lacak Laporan', ic: 'search-check' }, { k: 'poin', t: 'Poin & Riwayat', ic: 'gauge' },
    { k: 'surat', t: 'Surat', ic: 'mail' }, { k: 'info', t: 'Pusat Informasi', ic: 'book-open' }
  ],
  ortu: [
    { k: 'beranda', t: 'Beranda', ic: 'house' }, { k: 'poin', t: 'Poin & Presensi', ic: 'gauge' },
    { k: 'surat', t: 'Surat Resmi', ic: 'mail', n: () => (S.boot.surat || []).filter((s) => s.jadwal_pertemuan && !s.konfirmasi && s.jadwal_pertemuan.slice(0, 10) >= hariIni()).length },
    { k: 'info', t: 'Info Sekolah', ic: 'book-open' }
  ],
  bk: [
    { k: 'beranda', t: 'Beranda', ic: 'layout-dashboard' },
    { k: 'permintaan', t: 'Permintaan Konseling', ic: 'inbox', n: () => (S.boot.permintaan || []).filter((p) => p.status === 'Menunggu').length },
    { k: 'kasus', t: 'Kelola Kasus Siswa', ic: 'folder-lock', n: () => (S.boot.pengaduan || []).filter((p) => p.status !== 'Selesai').length, red: true },
    { k: 'jadwal', t: 'Jadwal & Slot', ic: 'calendar-days' },
    { k: 'rujukan', t: 'Rujukan Wali Kelas', ic: 'users', n: () => (S.boot.rujukan || []).filter((r) => r.status === 'Menunggu').length },
    { k: 'surat', t: 'Surat', ic: 'mail', n: () => (S.boot.surat || []).filter((s) => s.bisaPeriksa && (s.status === 'Draf' || s.status === 'Diperiksa')).length },
    { k: 'instrumen', t: 'Bank Instrumen BK', ic: 'folder-open', grup: 'Layanan & Sistem' }, { k: 'kelola-info', t: 'Pusat Informasi & FAQ', ic: 'book-open' },
    { k: 'laporan', t: 'Laporan & Statistik', ic: 'chart-column' }
  ],
  kesiswaan: [
    { k: 'beranda', t: 'Beranda', ic: 'layout-dashboard' }, { k: 'catat', t: 'Catat Cepat', ic: 'square-pen' },
    { k: 'data', t: 'Data Poin & Kehadiran', ic: 'table' },
    { k: 'surat', t: 'Antrean Surat', ic: 'mail', n: () => (S.boot.surat || []).filter((s) => s.bisaPeriksa && (s.status === 'Draf' || s.status === 'Diperiksa')).length },
    { k: 'rujukan-kasus', t: 'Rujukan dari BK', ic: 'share-2', n: () => (S.boot.rujukanKasus || []).filter((r) => r.status !== 'Selesai').length },
    { k: 'daftar-poin', t: 'Daftar Poin & Ambang', ic: 'list-checks', grup: 'Pengaturan' }, { k: 'laporan', t: 'Laporan & Statistik', ic: 'chart-column' }
  ],
  wali: [
    { k: 'beranda', t: 'Kelasku', ic: 'school' }, { k: 'catat', t: 'Catat', ic: 'square-pen' },
    { k: 'rujukan', t: 'Rujukan ke BK', ic: 'share-2' }, { k: 'surat', t: 'Surat Kelas', ic: 'mail' }, { k: 'laporan', t: 'Rekap Kelas', ic: 'chart-column' }
  ],
  piket: [{ k: 'beranda', t: 'Beranda Piket', ic: 'clipboard-check' }, { k: 'catat', t: 'Catat', ic: 'square-pen' }],
  kepsek: [
    { k: 'beranda', t: 'Ringkasan', ic: 'layout-dashboard' },
    { k: 'surat', t: 'Menunggu TTD', ic: 'pen-line', n: () => (S.boot.surat || []).filter((s) => s.status === 'Menunggu TTD').length },
    { k: 'laporan', t: 'Laporan & Grafik', ic: 'chart-column' }
  ],
  admin: [
    { k: 'beranda', t: 'Beranda', ic: 'layout-dashboard' }, { k: 'pengguna', t: 'Pengguna & Data Induk', ic: 'users' },
    { k: 'identitas', t: 'Identitas Aplikasi', ic: 'palette', grup: 'Pengaturan' }, { k: 'notif-set', t: 'WA & Email', ic: 'message-circle' },
    { k: 'template', t: 'Templat Surat', ic: 'file-text' }, { k: 'daftar-poin', t: 'Daftar Poin & Ambang', ic: 'list-checks' }, { k: 'log', t: 'Log Aktivitas', ic: 'history' }
  ]
};
const BOTTOM = {
  siswa: [['beranda', 'Beranda', 'house'], ['jadwal', 'Jadwal', 'calendar-days'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  ortu: [['beranda', 'Beranda', 'house'], ['surat', 'Surat', 'mail'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  bk: [['beranda', 'Beranda', 'house'], ['jadwal', 'Jadwal', 'calendar-days'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  kesiswaan: [['beranda', 'Beranda', 'house'], ['catat', 'Catat', 'square-pen'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  wali: [['beranda', 'Kelasku', 'school'], ['catat', 'Catat', 'square-pen'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  piket: [['beranda', 'Beranda', 'house'], ['catat', 'Catat', 'square-pen'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  kepsek: [['beranda', 'Beranda', 'house'], ['surat', 'TTD', 'pen-line'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']],
  admin: [['beranda', 'Beranda', 'house'], ['pengguna', 'Data', 'users'], ['notifikasi', 'Notifikasi', 'bell'], ['lainnya', 'Lainnya', 'layout-grid']]
};

// Registri halaman per peran: page(nama, {roles, title, render, live})
const PageReg = {};
function halaman(nama, def) { (PageReg[nama] = PageReg[nama] || []).push(Object.assign({ roles: '*', live: true }, def)); }
function cariHalaman(nama) { return (PageReg[nama] || []).find((d) => d.roles === '*' || d.roles.indexOf(S.role) > -1) || null; }

const App = {
  // ============================================================ BOOT
  async init() {
    terapkanTema();
    S.pub = Store.get('pub', null);
    terapkanMerek(S.pub);
    const sesi = Store.get('sesi', null);
    if (sesi && sesi.exp > Date.now() + 60000) Object.assign(S, { token: sesi.token, me: sesi.me, role: sesi.role, exp: sesi.exp });
    warmUp();
    App.muatPublik();
    window.addEventListener('hashchange', () => { S.navCount = (S.navCount || 0) + 1; App.route(); });
    App.ikatGlobal();
    if (S.token) {
      const c = Store.get(ukey('boot:' + S.role), null);
      if (c) { S.boot = c.data; S.cfg = c.data.cfg; terapkanMerek(S.cfg); }
      App.tampilShell();
      App.route();
      App.muatBoot(false);
    } else {
      App.route();
    }
    $('#splash').style.opacity = '0';
    setTimeout(() => $('#splash').remove(), 260);
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !S.token) return;
      if (Date.now() - (S.lastBoot || 0) > 120000) { warmUp(); App.muatBoot(true); }
    });
    setInterval(() => {   // staf: segarkan diam-diam tiap 90 detik saat tab terlihat
      if (S.token && S.me && S.me.tipe === 'staf' && document.visibilityState === 'visible' && Date.now() - (S.lastBoot || 0) > 85000) App.muatBoot(true);
    }, 30000);
  },

  async muatPublik() {
    if (!GAS_URL || /XXXX/.test(GAS_URL)) return;
    try {
      const r = await fetch(GAS_URL + '?action=publicConfig', { cache: 'no-store', redirect: 'follow' });
      const j = await r.json();
      if (j.success) {
        const lama = JSON.stringify(S.pub);
        S.pub = j.data; Store.set('pub', j.data);
        if (!S.token) { terapkanMerek(j.data); if (lama !== JSON.stringify(j.data)) Publik.segarMerek(); }
      }
    } catch (e) { /* tetap jalan dengan cache */ }
  },

  /** Muat bootstrap peran aktif (SWR). force = abaikan batas kesegaran. */
  async muatBoot(force) {
    const role = S.role;
    S.loading = true;
    const res = await swr('boot:' + role, 'bootstrap', {}, (data, dariCache) => {
      if (role !== S.role) return;
      const pertama = !S.boot;
      S.boot = data; S.cfg = data.cfg; terapkanMerek(S.cfg);
      if (!dariCache || pertama) { App.segarkanChrome(); pertama ? App.route() : App.renderUlang(); }
    }, { fresh: force ? 0 : 60000, force, skipCache: !!S.boot, onError: (r) => App.galatBoot(r) });
    S.loading = false;
    if (res && res.success) S.lastBoot = Date.now();
    return res;
  },
  galatBoot(r) {
    const v = $('#view');
    if (v && !S.boot) v.innerHTML = '<div class="wrap" style="padding-top:60px">' + emptyState('wifi-off', 'Gagal memuat data', r.message, '<button class="btn btn-primary mt" data-act-global="coba">' + ic('refresh-cw') + ' Coba lagi</button>') + '</div>';
  },

  simpanSesi() { Store.set('sesi', { token: S.token, me: S.me, role: S.role, exp: S.exp }); },

  // ============================================================ AUTENTIKASI
  async masuk(tipe, id, sandi, btn) {
    busy(btn, true, 'Memproses...');
    const r = await api('login', { tipe, id, sandi });
    busy(btn, false);
    if (!r.success) return r;
    App.terimaSesi(r.data);
    return r;
  },
  terimaSesi(d) {
    S.token = d.token; S.me = d.me; S.role = d.me.role; S.exp = d.exp;
    App.simpanSesi();
    if (d.wajibGanti) { App.showGantiSandi(true); return; }
    S.boot = d.boot; S.cfg = d.boot.cfg; S.lastBoot = Date.now();
    Store.set(ukey('boot:' + S.role), { t: Date.now(), h: hashStr(JSON.stringify(d.boot)), data: d.boot });
    terapkanMerek(S.cfg);
    App.tampilShell();
    if (location.hash === '#/beranda') App.route(); else location.hash = '#/beranda';
    toast('Selamat datang, ' + S.me.nama.split(',')[0] + '!', 'success');
  },
  logout(diam) {
    const tipe = S.me && S.me.tipe;
    Object.assign(S, { token: '', me: null, role: '', boot: null, cfg: null, exp: 0 });
    Store.del('sesi');
    Modal.closeAll();
    $('#shell').hidden = true;
    $('#view').innerHTML = '';
    S.tipeLogin = tipe;
    if (!diam) toast('Anda telah keluar.', 'info');
    location.hash = '#/masuk';
    App.route();
  },

  gantiPeran(role) {
    if (!S.me || S.me.roles.indexOf(role) < 0 || role === S.role) return;
    S.role = role; S.me.role = role; S.me.labelPeran = LABEL_PERAN[role];
    App.simpanSesi();
    const c = Store.get(ukey('boot:' + role), null);
    S.boot = c ? c.data : null;
    $('#view').innerHTML = '';
    App.tampilShell();
    if (location.hash !== '#/beranda') location.hash = '#/beranda'; else App.route();
    App.muatBoot(true);
    toast('Peran aktif: ' + LABEL_PERAN[role], 'info');
  },
  pilihPeran() {
    const m = Modal.open({
      title: 'Ganti peran',
      body: '<p class="muted small mb">Akun Anda memiliki lebih dari satu peran. Data & menu menyesuaikan peran yang dipilih.</p><div class="stack s">' +
        S.me.roles.map((r) => '<button class="rcard ' + (r === S.role ? 'on' : '') + '" data-act="r" data-k="' + r + '"><span class="rad"></span><div><b>' + LABEL_PERAN[r] + '</b></div></button>').join('') + '</div>',
      handlers: { r: (el) => { m.close(); App.gantiPeran(el.dataset.k); } }
    });
  },

  // ============================================================ HALAMAN PUBLIK (tanpa login)
  authRoute(nama, params) {
    $('#shell').hidden = true;
    const a = $('#auth');
    a.hidden = false;
    if (nama === 'verifikasi') return Publik.verifikasi(a, params[0]);
    if (nama === 'lacak') return Publik.lacak(a, params[0]);
    Publik.login(a);
  },

  showGantiSandi(wajib) {
    $('#shell').hidden = true;
    const a = $('#auth'); a.hidden = false;
    Publik.gantiSandi(a, wajib);
  },

  // ============================================================ SHELL
  tampilShell() {
    $('#auth').hidden = true; $('#auth').innerHTML = '';
    $('#shell').hidden = false;
    App.segarkanChrome();
  },

  segarkanChrome() {
    if (!S.me) return;
    const cfg = S.cfg || S.pub || {};
    const menu = MENU[S.role] || [];
    const nav = S.current ? (S.current.def.nav || S.current.name) : 'beranda';
    let grup = '';
    const item = (m) => {
      const n = m.n && S.boot ? m.n() : 0;
      let g = '';
      if (m.grup && m.grup !== grup) { grup = m.grup; g = '<div class="sb-label">' + esc(m.grup) + '</div>'; }
      return g + '<button class="sb-item ' + (m.k === nav ? 'on' : '') + '" data-go="#/' + m.k + '">' + ic(m.ic) + '<span class="grow ell">' + esc(m.t) + '</span>' + (n ? '<span class="cnt ' + (m.red ? 'red' : '') + '">' + n + '</span>' : '') + '</button>';
    };
    const notif = (S.boot && S.boot.notif && S.boot.notif.belum) || 0;
    $('#sidebar').innerHTML =
      '<div class="sb-brand">' + logoHtml(cfg) + '<div class="grow"><div class="t1">' + esc(cfg.nama_app || 'SMAPATISPA NEXORA') + '</div><div class="t2">' + esc(cfg.nama_sekolah || '') + '</div></div><button class="icon-btn m-only" data-act-global="drawer-close" aria-label="Tutup menu">' + ic('x') + '</button></div>' +
      '<button class="role-pill" ' + (S.me.roles.length > 1 ? 'data-act-global="peran"' : 'disabled style="cursor:default"') + '><span class="dot"></span><span class="grow" style="text-align:left">Peran: ' + esc(LABEL_PERAN[S.role]) + '</span>' + (S.me.roles.length > 1 ? ic('arrow-left-right', 's') : '') + '</button>' +
      '<div class="sb-label">Navigasi utama</div><nav class="sb-nav" aria-label="Menu utama">' + menu.map(item).join('') +
      '<button class="sb-item ' + (nav === 'notifikasi' ? 'on' : '') + '" data-go="#/notifikasi">' + ic('bell') + '<span class="grow">Notifikasi</span>' + (notif ? '<span class="cnt red">' + notif + '</span>' : '') + '</button>' +
      '<button class="sb-item ' + (nav === 'lainnya' ? 'on' : '') + '" data-go="#/lainnya">' + ic('settings') + '<span class="grow">Profil & Pengaturan</span></button></nav>' +
      '<div class="sb-user">' + avatar(S.me.nama, 's') + '<div class="grow"><div class="b ell" style="font-size:13px">' + esc(S.me.nama) + '</div><div class="xs muted ell">' + esc(LABEL_PERAN[S.role]) + (S.me.nip && S.me.tipe === 'staf' ? ' · ' + esc(S.me.nip) : '') + '</div></div><button class="icon-btn" data-act-global="keluar" aria-label="Keluar">' + ic('log-out') + '</button></div>';

    $('#bottomnav').innerHTML = (BOTTOM[S.role] || []).map((b) => {
      const on = b[0] === nav || (b[0] === 'lainnya' && !(BOTTOM[S.role] || []).some((x) => x[0] === nav) && nav !== 'beranda');
      const cnt = b[0] === 'notifikasi' ? notif : 0;
      return '<button class="bn ' + (on ? 'on' : '') + '" data-go="#/' + b[0] + '"' + (on ? ' aria-current="page"' : '') + '><span class="bi">' + ic(b[2]) + (cnt ? '<span class="dot-count">' + (cnt > 9 ? '9+' : cnt) + '</span>' : '') + '</span>' + esc(b[1]) + '</button>';
    }).join('');

    const def = S.current && S.current.def;
    const judul = def ? (typeof def.title === 'function' ? def.title(S.current.params) : def.title) : 'Beranda';
    $('#topbar').innerHTML = '<div class="grow"><div class="crumb">' + esc(LABEL_PERAN[S.role]) + ' · ' + esc(cfg.nama_sekolah || '') + '</div><h1>' + esc(judul || '') + '</h1></div>' +
      '<div class="search-pill" data-search-box>' + ic('search') + '<input type="search" placeholder="' + (S.me.tipe === 'staf' ? 'Cari siswa, menu, informasi...' : 'Cari menu atau informasi...') + '" aria-label="Cari" data-global-search autocomplete="off"><div class="search-results" data-search-res></div></div>' +
      '<button class="icon-btn" data-go="#/notifikasi" aria-label="Notifikasi">' + ic('bell') + (notif ? '<span class="dot-count">' + notif + '</span>' : '') + '</button>' +
      '<button class="avatar s c-' + warnaDari(S.me.nama) + '" data-go="#/lainnya" aria-label="Profil">' + esc(inisial(S.me.nama)) + '</button>';
  },

  // ============================================================ ROUTER
  route() {
    const { name, params } = parseHash();
    if (!S.token) return App.authRoute(name, params);
    if (name === 'verifikasi') { $('#auth').hidden = false; $('#shell').hidden = true; return Publik.verifikasi($('#auth'), params[0], true); }
    if (!$('#auth').hidden) App.tampilShell();
    if (name === 'masuk' || !name) { location.replace('#/beranda'); return; }
    let nama = name, def = cariHalaman(nama);
    if (!def) { nama = 'beranda'; def = cariHalaman('beranda'); if (name !== 'beranda') { history.replaceState(null, '', '#/beranda'); } }
    const view = $('#view');
    if (!S.boot) {
      view.innerHTML = '<div class="wrap" style="padding-top:24px">' + skeleton(1, 150) + '<div class="stats">' + skeleton(4, 90).replace(/margin-bottom:12px/g, '') + '</div>' + skeleton(4, 64) + '</div>';
      S.current = { name: nama, params, def, el: null };
      if (!S.loading) App.muatBoot(true);
      return;
    }
    const key = S.role + ':' + nama;
    let el = view.querySelector('.page[data-key="' + key + '"]');
    if (!el) { el = document.createElement('section'); el.className = 'page'; el.dataset.key = key; view.appendChild(el); }
    const pindah = !S.current || S.current.el !== el || JSON.stringify(S.current.params) !== JSON.stringify(params);
    $$('.page', view).forEach((p) => p.classList.toggle('active', p === el));
    S.current = { name: nama, params, def, el };
    try { def.render(el, params); } catch (e) { console.error(e); el.innerHTML = '<div class="wrap" style="padding-top:40px">' + emptyState('bug', 'Terjadi kesalahan tampilan', e.message) + '</div>'; }
    App.segarkanChrome();
    skalaA4(el);
    $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on');
    if (pindah) window.scrollTo(0, 0);
  },

  /** Render ulang halaman aktif setelah data segar (lewati bila pengguna sedang mengetik). */
  renderUlang() {
    const c = S.current;
    if (!c || !c.el || c.def.live === false) { App.segarkanChrome(); return; }
    const a = document.activeElement;
    if (a && c.el.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { App.segarkanChrome(); return; }
    if (adaIsian(c.el)) { App.segarkanChrome(); return; }       // jangan hapus isian yang belum disimpan
    if (Modal.stack.length) { App.segarkanChrome(); return; }
    const y = window.scrollY;
    try { c.def.render(c.el, c.params); } catch (e) { console.error(e); }
    App.segarkanChrome();
    skalaA4(c.el);
    window.scrollTo(0, y);
  },

  /** Jalankan aksi tulis: tombol sibuk → toast → segarkan bootstrap di latar. */
  async aksi(action, data, o = {}) {
    busy(o.btn, true, o.teks);
    const r = await api(action, data, { reqId: o.reqId });
    busy(o.btn, false);
    if (!r.success) { toast(r.message, 'error'); return null; }
    if (o.toast !== false) toast(r.message || 'Berhasil.', 'success');
    if (o.segarkan !== false) App.muatBoot(true);
    return r.data === null ? {} : r.data;
  },

  // ============================================================ EVENT GLOBAL
  ikatGlobal() {
    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g && !e.target.closest('[data-act]')) { e.preventDefault(); const h = g.dataset.go; if (h) go(h); return; }
      const b = e.target.closest('[data-back]');
      if (b) { e.preventDefault(); back(b.dataset.back); return; }
      const a = e.target.closest('[data-act-global]');
      if (!a) return;
      const k = a.dataset.actGlobal;
      if (k === 'drawer') { $('#sidebar').classList.add('open'); $('#scrim').classList.add('on'); }
      else if (k === 'drawer-close') { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); }
      else if (k === 'peran') App.pilihPeran();
      else if (k === 'keluar') konfirmasi({ title: 'Keluar dari aplikasi?', text: 'Anda perlu memasukkan kata sandi lagi untuk masuk.', ok: 'Keluar', danger: true }).then((y) => y && App.logout());
      else if (k === 'coba') App.muatBoot(true);
    });
    $('#scrim').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); });
    document.addEventListener('keydown', (e) => {
      const ag = e.target.closest && e.target.closest('.agenda[data-go], .qcard');
      if (ag && (e.key === 'Enter' || e.key === ' ') && ag.dataset.go) { e.preventDefault(); go(ag.dataset.go); }
    });
    // Pencarian global (header HP & topbar desktop)
    document.addEventListener('input', debounce((e) => {
      if (!e.target.matches('[data-global-search]')) return;
      Cari.tampil(e.target);
    }, 120));
    document.addEventListener('focusin', (e) => { if (e.target.matches('[data-global-search]') && e.target.value) Cari.tampil(e.target); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-search-box]')) $$('[data-search-res]').forEach((r) => r.classList.remove('on'));
      const it = e.target.closest('.sr-item');
      if (it) { $$('[data-search-res]').forEach((r) => r.classList.remove('on')); $$('[data-global-search]').forEach((i) => (i.value = '')); go(it.dataset.href); }
    });
  }
};

/** True bila ada kolom form yang sudah diubah pengguna namun belum disimpan. */
function adaIsian(root) {
  return $$('input:not([type=search]):not([type=hidden]):not([type=file]), textarea, select', root).some((x) => {
    if (x.closest('[data-global-search]') || x.matches('[data-global-search]')) return false;
    if (x.type === 'checkbox' || x.type === 'radio') return x.checked !== x.defaultChecked;
    if (x.tagName === 'SELECT') return Array.from(x.options).some((o) => o.selected !== o.defaultSelected) && x.selectedIndex !== Array.from(x.options).findIndex((o) => o.defaultSelected) && !(x.selectedIndex === 0 && !Array.from(x.options).some((o) => o.defaultSelected));
    return x.value !== x.defaultValue;
  });
}

// ============================================================
// PENCARIAN GLOBAL — lokal dari data yang sudah dimuat (tanpa panggilan server)
// ============================================================
const Cari = {
  tampil(inp) {
    const res = inp.parentElement.querySelector('[data-search-res]');
    const q = inp.value.trim().toLowerCase();
    if (!q) { res.classList.remove('on'); return; }
    const hasil = [];
    (MENU[S.role] || []).concat([{ k: 'notifikasi', t: 'Notifikasi', ic: 'bell' }, { k: 'lainnya', t: 'Profil & Pengaturan', ic: 'settings' }]).forEach((m) => {
      if (m.t.toLowerCase().includes(q)) hasil.push({ href: '#/' + m.k, ic: m.ic, t: m.t, s: 'Menu' });
    });
    const b = S.boot || {};
    const siswa = b.siswa && Array.isArray(b.siswa) ? b.siswa : [];
    if (S.me.tipe === 'staf') siswa.filter((s) => s.nama.toLowerCase().includes(q) || String(s.nisn).includes(q)).slice(0, 6).forEach((s) => {
      const href = S.role === 'piket' ? '#/catat/' + s.nisn : ['kesiswaan', 'wali', 'admin'].indexOf(S.role) > -1 ? '#/siswa/' + s.nisn : S.role === 'bk' ? '#/permintaan/q/' + encodeURIComponent(s.nama) : '#/beranda';
      hasil.push({ href, ic: 'user', t: s.nama, s: (s.kelas || '') + ' · NISN ' + s.nisn });
    });
    (b.info || b.infoSemua || []).filter((a) => (a.judul + ' ' + a.kategori + ' ' + (a.ringkasan || '')).toLowerCase().includes(q)).slice(0, 5)
      .forEach((a) => hasil.push({ href: '#/info/a/' + a.id, ic: 'book-open', t: a.judul, s: a.kategori }));
    res.innerHTML = hasil.slice(0, 12).map((h) => '<div class="sr-item" data-href="' + esc(h.href) + '" role="option">' + ic(h.ic) + '<div class="grow"><div class="b ell">' + esc(h.t) + '</div><div class="xs muted ell">' + esc(h.s) + '</div></div></div>').join('') || '<div class="sr-item muted">Tidak ditemukan.</div>';
    res.classList.add('on');
  }
};

// ============================================================
// HALAMAN PUBLIK: masuk, ganti sandi, lacak, verifikasi
// ============================================================
const Publik = {
  /** Perbarui nama/logo sekolah di halaman masuk tanpa menghapus isian pengguna. */
  segarMerek() {
    const cfg = S.pub || {};
    const b = $('#auth .auth-brand');
    if (b && b.querySelector('h1')) {
      b.querySelector('.brand-logo').outerHTML = logoHtml(cfg);
      if (!b.dataset.tetap) { b.querySelector('h1').textContent = cfg.nama_app || 'SMAPATISPA NEXORA'; const p = b.querySelector('p'); if (p) p.textContent = cfg.nama_sekolah || ''; }
    }
    const f = $('#auth .auth-foot');
    if (f) f.innerHTML = 'Bantuan BK: ' + esc(cfg.lokasi_bk || 'Ruang BK') + (cfg.jam_layanan ? ' · ' + esc(cfg.jam_layanan) : '') + '<br>' + esc(cfg.nama_app || 'SMAPATISPA NEXORA') + ' v' + esc(cfg.versi || '1.0.0');
  },
  login(a) {
    const cfg = S.pub || {};
    const tipe = S.tipeLogin || Store.get('tipeLogin', 'siswa');
    const label = { siswa: 'NISN', ortu: 'NISN Anak', staf: 'NIP / Username' };
    const ket = { siswa: 'Untuk siswa aktif ' + (cfg.nama_sekolah || ''), ortu: 'Gunakan NISN putra/putri Anda', staf: 'Untuk guru, staf, dan kepala sekolah' };
    a.innerHTML = '<div class="auth"><div class="auth-brand">' + logoHtml(cfg) + '<h1>' + esc(cfg.nama_app || 'SMAPATISPA NEXORA') + '</h1><p class="muted">' + esc(cfg.nama_sekolah || 'SMA PGRI 43 Singaparna') + '</p></div>' +
      '<div class="auth-card"><form data-form="login" novalidate>' +
      UI.seg([{ k: 'siswa', l: 'Siswa' }, { k: 'ortu', l: 'Orang Tua' }, { k: 'staf', l: 'Guru & Staf' }], tipe, 'tipe') +
      '<div class="field mt-l"><label class="lbl" for="lg-id">' + label[tipe] + '</label><input class="input" id="lg-id" name="id" ' + (tipe === 'staf' ? 'autocomplete="username"' : 'inputmode="numeric" autocomplete="username"') + ' required placeholder="' + (tipe === 'staf' ? 'Masukkan NIP atau username' : 'Contoh: 0081234567') + '">' +
      '<span class="help">' + ic('info', 's') + esc(ket[tipe]) + '</span></div>' +
      '<div class="field"><label class="lbl" for="lg-pw">Kata Sandi</label><div class="input-wrap"><input class="input" id="lg-pw" name="sandi" type="password" autocomplete="current-password" required placeholder="Masukkan kata sandi"><button type="button" class="icon-btn in-btn" data-act="lihat" aria-label="Tampilkan kata sandi">' + ic('eye') + '</button></div></div>' +
      '<div data-err></div>' +
      '<p class="small mb" style="margin-top:-4px">' + ic('circle-help', 's') + ' <span class="muted">Lupa kata sandi? Hubungi admin sekolah.</span></p>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Masuk ' + ic('arrow-right') + '</button></form>' +
      '<div class="alert info mt">' + ic('info') + '<div>Akun baru akan diminta mengganti kata sandi saat pertama kali masuk.</div></div></div>' +
      '<div class="mt-l tc"><button class="btn btn-ghost" data-go="#/lacak">' + ic('search-check') + ' Lacak laporan anonim</button></div>' +
      '<div class="auth-foot">Bantuan BK: ' + esc(cfg.lokasi_bk || 'Ruang BK') + (cfg.jam_layanan ? ' · ' + esc(cfg.jam_layanan) : '') + '<br>' + esc(cfg.nama_app || 'SMAPATISPA NEXORA') + ' v' + esc(cfg.versi || '1.0.0') + '</div></div>';
    bind(a, {
      tipe: (el) => { S.tipeLogin = el.dataset.k; Store.set('tipeLogin', el.dataset.k); Publik.login(a); $('#lg-id').focus(); },
      lihat: (el) => { const i = $('#lg-pw'); i.type = i.type === 'password' ? 'text' : 'password'; el.innerHTML = ic(i.type === 'password' ? 'eye' : 'eye-off'); },
      'submit:login': async (f) => {
        const d = formData(f);
        const err = f.querySelector('[data-err]');
        if (!d.id || !d.sandi) { err.innerHTML = '<div class="alert err mb">' + ic('circle-alert') + '<div><b>Lengkapi data</b><br>Isi ' + label[S.tipeLogin || tipe] + ' dan kata sandi.</div></div>'; return; }
        const r = await App.masuk(S.tipeLogin || tipe, d.id, d.sandi, f.querySelector('[type=submit]'));
        if (!r.success) err.innerHTML = '<div class="alert err mb" role="alert">' + ic('triangle-alert') + '<div><b>' + (r.data && r.data.code === 'LOCKED' ? 'Akun dikunci sementara' : 'Gagal masuk') + '</b><br>' + esc(r.message) + '</div></div>';
      }
    });
  },

  gantiSandi(a, wajib) {
    a.innerHTML = '<div class="auth"><div class="auth-card" style="margin-top:12px">' +
      '<div class="row mb"><span class="brand-logo" style="width:40px;height:40px;border-radius:12px">' + ic('shield-check') + '</span><div><h2 style="font-size:18px">Demi Keamanan Akun Anda ' + (wajib ? pill('WAJIB', 'dark') : '') + '</h2><div class="small muted">Ganti kata sandi awal sebelum melanjutkan.</div></div></div>' +
      '<div class="item mb" style="box-shadow:none">' + avatar(S.me.nama, 's') + '<div class="grow"><div class="xs muted">Masuk sebagai</div><b>' + esc(S.me.nama) + '</b></div>' + pill((S.me.tipe === 'staf' ? 'NIP ' : 'NISN ') + (S.me.nip || S.me.id), 'slate') + '</div>' +
      '<form data-form="gs" novalidate>' +
      '<div class="field"><label class="lbl">Kata Sandi Saat Ini</label><input class="input" type="password" name="lama" autocomplete="current-password" required></div>' +
      '<div class="field"><label class="lbl">Kata Sandi Baru <span class="req">*</span></label><input class="input" type="password" name="baru" autocomplete="new-password" required data-input="kuat"></div>' +
      '<div class="card flat tight mb" style="background:var(--surface-2)"><div class="row between small mb-s"><span class="muted">Kekuatan</span><b data-kuat-l>-</b></div><div class="strength" data-kuat><i></i><i></i><i></i></div>' +
      '<div class="stack s mt"><div class="rule" data-r="p">' + ic('circle', 's') + 'Minimal 8 karakter</div><div class="rule" data-r="h">' + ic('circle', 's') + 'Mengandung huruf dan angka</div><div class="rule" data-r="i">' + ic('circle', 's') + 'Tidak memuat NISN/NIP</div></div></div>' +
      '<div class="field"><label class="lbl">Ulangi Kata Sandi Baru <span class="req">*</span></label><input class="input" type="password" name="ulang" autocomplete="new-password" required></div>' +
      '<div data-err></div><button class="btn btn-primary btn-block btn-lg" type="submit">Simpan & Lanjutkan ' + ic('arrow-right') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-block mt" data-act="batal">' + (wajib ? 'Batal & kembali ke halaman masuk' : 'Batal') + '</button></form>' +
      '<p class="lockline mt">' + ic('lock', 's') + ' Sesi aktif ' + 12 + ' jam. Kata sandi disimpan terenkripsi (hash).</p></div></div>';
    const idKu = S.me.nip || S.me.id;
    bind(a, {
      'input:kuat': (el) => {
        const v = el.value, p = v.length >= 8, h = /[A-Za-z]/.test(v) && /\d/.test(v), i = v && v.indexOf(idKu) < 0;
        const sk = [p, h, i && /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
        a.querySelector('[data-kuat]').className = 'strength s' + (v ? sk : 0);
        a.querySelector('[data-kuat-l]').textContent = !v ? '-' : sk >= 3 ? 'Kuat' : sk === 2 ? 'Sedang' : 'Lemah';
        [['p', p], ['h', h], ['i', i]].forEach(([k, okv]) => { const r = a.querySelector('[data-r=' + k + ']'); r.classList.toggle('ok', !!okv); r.querySelector('svg').outerHTML = ic(okv ? 'circle-check' : 'circle', 's'); });
      },
      batal: () => (wajib ? App.logout(true) : (App.tampilShell(), back('#/lainnya'))),
      'submit:gs': async (f) => {
        const d = formData(f), err = f.querySelector('[data-err]');
        const tampil = (m) => (err.innerHTML = '<div class="alert err mb">' + ic('circle-alert') + '<div>' + esc(m) + '</div></div>');
        if (d.baru.length < 8 || !/[A-Za-z]/.test(d.baru) || !/\d/.test(d.baru)) return tampil('Kata sandi baru minimal 8 karakter dan berisi huruf serta angka.');
        if (d.baru !== d.ulang) return tampil('Ulangi kata sandi baru belum sama.');
        const btn = f.querySelector('[type=submit]');
        busy(btn, true, 'Menyimpan...');
        const r = await api('gantiSandi', { lama: d.lama, baru: d.baru });
        busy(btn, false);
        if (!r.success) return tampil(r.message);
        App.terimaSesi(r.data);
        toast('Kata sandi berhasil diganti.', 'success');
      }
    });
  },

  async lacak(a, kodeAwal) {
    const cfg = S.pub || {};
    a.innerHTML = '<div class="auth"><div class="auth-brand" data-tetap="1" style="margin:10px 0 16px">' + logoHtml(cfg) + '<h1 style="font-size:20px">Lacak Laporan</h1><p class="muted small">Pantau laporan tanpa masuk akun menggunakan kode lacak.</p></div>' +
      '<div class="auth-card"><form data-form="lacak"><div class="field"><label class="lbl">Kode lacak</label><div class="search-in">' + ic('key-round', 's') + '<input class="input mono" name="kode" placeholder="NXR-XXXXXX" value="' + esc(kodeAwal || '') + '" style="text-transform:uppercase;border-radius:12px" required></div></div>' +
      '<button class="btn btn-primary btn-block" type="submit">' + ic('search') + ' Lacak Status</button></form><div data-hasil class="mt-l"></div></div>' +
      '<div class="mt-l tc"><button class="btn btn-ghost" data-go="#/masuk">' + ic('arrow-left') + ' Kembali ke halaman masuk</button></div></div>';
    const cari = async (kode, btn) => {
      busy(btn, true);
      const r = await api('lacakLaporan', { kode });
      busy(btn, false);
      a.querySelector('[data-hasil]').innerHTML = r.success ? hasilLacak(r.data) : '<div class="alert err">' + ic('circle-alert') + '<div>' + esc(r.message) + '</div></div>';
    };
    bind(a, { 'submit:lacak': (f) => cari(formData(f).kode.toUpperCase(), f.querySelector('button')) });
    if (kodeAwal) cari(kodeAwal);
  },

  async verifikasi(a, kode, masuk) {
    const cfg = S.cfg || S.pub || {};
    a.hidden = false;
    a.innerHTML = '<div class="auth"><div class="auth-brand" data-tetap="1">' + logoHtml(cfg) + '<h1 style="font-size:20px">Verifikasi Surat</h1><p class="muted small">' + esc(cfg.nama_sekolah || '') + '</p></div><div class="auth-card" data-v>' + skeleton(3, 40) + '</div>' +
      '<div class="mt-l tc"><button class="btn btn-ghost" data-go="#/' + (masuk ? 'beranda' : 'masuk') + '">' + ic('arrow-left') + ' ' + (masuk ? 'Kembali ke aplikasi' : 'Halaman masuk') + '</button></div></div>';
    if (masuk) bind(a, {});
    const r = await api('verifikasiSurat', { kode });
    a.querySelector('[data-v]').innerHTML = r.success
      ? '<div class="tc mb"><span class="avatar l c-emerald" style="margin:0 auto">' + ic('shield-check', 'l') + '</span><h2 class="mt">Surat Terverifikasi</h2><p class="small muted">Surat ini sah diterbitkan oleh sekolah.</p></div>' +
        UI.kv([['Nomor', r.data.nomor], ['Jenis', r.data.jenis], ['Siswa', r.data.siswa], ['Kelas', r.data.kelas], ['Tanggal', tglP(r.data.tanggal)], ['Ditandatangani', r.data.ditandatangani]])
      : emptyState('shield-x', 'Surat tidak ditemukan', r.message);
  }
};

function hasilLacak(d) {
  const urut = (S.cfg || {}).statusKasus || ['Baru', 'Ditinjau', 'Dalam Penanganan', 'Tindak Lanjut', 'Selesai'];
  const idx = urut.indexOf(d.status);
  const peta = {}; (d.riwayat || []).forEach((r) => (peta[r.status] = r));
  return '<div class="card flat tight mb" style="background:var(--surface-2)"><div class="row between"><span class="pill p-dark">' + esc(d.kategori) + '</span>' + (d.prioritas ? pill('PRIORITAS', 'red') : '') + '</div>' +
    '<div class="meta mt"><span>' + ic('calendar', 's') + esc(tgl(d.dibuat) + ', ' + jam(d.dibuat) + ' WIB') + '</span><span>' + ic('user-round', 's') + 'Identitas ' + esc(String(d.mode).toLowerCase()) + '</span>' + (d.nama_bk ? '<span>' + ic('headset', 's') + esc(d.nama_bk) + '</span>' : '') + '</div></div>' +
    '<div class="row between mb"><b>Progres penanganan</b><span class="small muted">Tahap ' + (idx + 1) + ' dari ' + urut.length + '</span></div>' +
    UI.timeline(urut.map((st, i) => ({ judul: st, state: i < idx || (i === idx && st === 'Selesai') ? 'done' : i === idx ? 'cur' : '', waktu: peta[st] ? tgl(peta[st].waktu) + ', ' + jam(peta[st].waktu) + ' WIB' : '', ket: peta[st] ? peta[st].ket : '', pill: i === idx && st !== 'Selesai' ? pill('PROSES AKTIF', 'violet') : i < idx ? pill('SELESAI', 'green') : '' }))) +
    '<div class="alert info mt">' + ic('lock') + '<div><b>Kerahasiaan terjamin.</b> Detail percakapan dan catatan penanganan hanya disimpan Guru BK. Pelapor hanya melihat progres.</div></div>';
}

document.addEventListener('DOMContentLoaded', () => App.init());
