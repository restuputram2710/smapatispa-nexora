/* ============================================================
   SMAPATISPA NEXORA — common.js : halaman bersama semua peran
   Notifikasi · Lainnya/Profil · Pusat Informasi · Surat · Laporan · Profil Siswa
   ============================================================ */
'use strict';

const NOTIF_IC = { surat: ['mail', 'violet'], jadwal: ['calendar-days', 'blue'], poin: ['triangle-alert', 'orange'], prestasi: ['trophy', 'amber'], hadir: ['clock', 'emerald'], kasus: ['shield-alert', 'rose'], rujukan: ['share-2', 'teal'], info: ['info', 'indigo'] };

// ============================================================ NOTIFIKASI
halaman('notifikasi', {
  title: 'Notifikasi', nav: 'notifikasi',
  render(el, p) {
    const n = S.boot.notif || { list: [], belum: 0 };
    const f = el._f || 'semua';
    const kat = [...new Set(n.list.map((x) => x.kategori))];
    const list = n.list.filter((x) => f === 'semua' || (f === 'belum' ? !x.dibaca : x.kategori === f));
    el.innerHTML = UI.ph('Notifikasi', n.belum ? n.belum + ' belum dibaca' : 'Semua sudah dibaca', { acts: n.belum ? '<button class="btn btn-ghost btn-sm" data-act="semua">Tandai dibaca</button>' : '' }) +
      '<div class="wrap"><div class="row between d-only mt-l"><p class="muted">' + (n.belum ? n.belum + ' notifikasi belum dibaca' : 'Semua notifikasi sudah dibaca') + '</p>' + (n.belum ? '<button class="btn btn-soft btn-sm" data-act="semua">' + ic('check-check', 's') + ' Tandai semua dibaca</button>' : '') + '</div>' +
      '<div class="mt">' + UI.chips([{ k: 'semua', l: 'Semua', n: n.list.length }, { k: 'belum', l: 'Belum dibaca', n: n.belum }].concat(kat.map((k) => ({ k, l: k.charAt(0).toUpperCase() + k.slice(1) }))), f, 'f', true) + '</div>' +
      '<div class="list mt">' + (list.map((x) => {
        const [icn, c] = NOTIF_IC[x.kategori] || NOTIF_IC.info;
        return '<div class="item click c-' + c + ' ' + (x.dibaca ? '' : 'unread') + '" data-act="buka" data-id="' + esc(x.id) + '"><span class="ic-c">' + ic(icn) + '</span><div class="grow"><div class="row between top"><h4>' + esc(x.judul) + '</h4>' + (x.dibaca ? '' : '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex:none;margin-top:6px"></span>') + '</div>' +
          '<p class="small" style="color:var(--text-2);margin-top:2px">' + esc(x.isi) + '</p><div class="xs muted mt" style="margin-top:4px">' + esc(relatif(x.waktu)) + '</div></div></div>';
      }).join('') || emptyState('bell-off', 'Belum ada notifikasi', 'Pemberitahuan jadwal, surat, dan catatan akan muncul di sini.')) + '</div></div>';
    bind(el, {
      f: (b) => { el._f = b.dataset.k; this.render(el, p); },
      semua: () => tandaiDibaca('semua'),
      buka: (b) => { const x = n.list.find((y) => y.id === b.dataset.id); if (!x) return; if (!x.dibaca) tandaiDibaca([x.id]); if (x.tautan) go(x.tautan); }
    });
  }
});
/** Optimistic: tandai lokal dulu, kirim ke server di latar. */
function tandaiDibaca(ids) {
  const n = S.boot.notif;
  n.list.forEach((x) => { if (ids === 'semua' || ids.indexOf(x.id) > -1) x.dibaca = true; });
  n.belum = n.list.filter((x) => !x.dibaca).length;
  Store.set(ukey('boot:' + S.role), { t: Date.now(), h: '', data: S.boot });
  App.renderUlang();
  api('notifDibaca', { ids });
}

// ============================================================ LAINNYA / PROFIL
halaman('lainnya', {
  title: 'Profil & Pengaturan', nav: 'lainnya',
  render(el) {
    const me = S.me, b = S.boot;
    const tema = Store.get('tema', 'light');
    const menu = (MENU[S.role] || []).filter((m) => m.k !== 'beranda');
    let ekstra = '';
    if (S.role === 'ortu' && b.siswa) {
      const w = b.siswa.wali;
      ekstra = '<div class="card mt"><div class="row">' + avatar(b.siswa.nama) + '<div class="grow"><div class="xs muted">Putra/putri Anda</div><b>' + esc(b.siswa.nama) + '</b><div class="small muted">' + esc(b.siswa.kelas) + ' · NISN ' + esc(b.siswa.nisn) + '</div></div>' + pill(levelInfo(b.siswa.level.kode).t, levelInfo(b.siswa.level.kode).p) + '</div>' +
        (w ? '<div class="divider"></div><div class="row"><span class="ic-c c-teal" style="width:36px;height:36px;border-radius:50%;background:var(--t);color:var(--c);display:grid;place-items:center">' + ic('user-round', 's') + '</span><div class="grow"><div class="xs muted">Wali kelas</div><b>' + esc(w.nama) + '</b></div>' + (w.no_wa ? '<a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(w.no_wa).replace(/\D/g, '').replace(/^0/, '62')) + '">' + ic('message-circle', 's') + ' Hubungi</a>' : '') + '</div>' : '') + '</div>';
    }
    if (S.role === 'kepsek') {
      ekstra = '<div class="card mt"><div class="row between"><div><h3>Tanda Tangan Elektronik</h3><p class="small muted">Dipakai saat menandatangani surat dengan metode "gambar tanda tangan".</p></div>' + (b.adaTtd ? pill('Tersimpan', 'green') : pill('Belum ada', 'amber')) + '</div>' +
        (b.ttdKepsek ? '<div class="mt" style="background:#fff;border-radius:12px;padding:10px;text-align:center;border:1px solid var(--border)"><img src="' + b.ttdKepsek + '" alt="Tanda tangan" style="max-height:90px"></div>' : '') +
        '<button class="btn btn-soft btn-block mt" data-act="ttd">' + ic('pen-line') + ' ' + (b.adaTtd ? 'Ganti tanda tangan' : 'Buat tanda tangan') + '</button></div>';
    }
    el.innerHTML = UI.ph('Lainnya', 'Profil, menu & pengaturan', { noBack: true }) + '<div class="wrap" style="max-width:760px">' +
      '<div class="card mt-l"><div class="row">' + avatar(me.nama, 'l') + '<div class="grow"><h2 style="font-size:17px">' + esc(me.nama) + '</h2><div class="small muted">' + esc(LABEL_PERAN[S.role]) + ' · ' + (me.tipe === 'staf' ? 'NIP ' + esc(me.nip) : 'NISN ' + esc(me.id)) + '</div>' +
      '<div class="row wrap gap-s mt" style="margin-top:6px">' + pill('Akun aktif', 'green') + (me.roles.length > 1 ? pill(me.roles.length + ' peran', 'indigo') : '') + '</div></div></div>' +
      (me.roles.length > 1 ? '<button class="btn btn-outline btn-block mt" data-act-global="peran">' + ic('arrow-left-right') + ' Ganti peran (aktif: ' + esc(LABEL_PERAN[S.role]) + ')</button>' : '') + '</div>' + ekstra +
      (menu.length ? '<div class="sec-head mt-l m-only"><h2>Menu</h2></div><div class="card p0 m-only">' + menu.map((m, i) => '<button class="row" data-go="#/' + m.k + '" style="width:100%;padding:14px 16px;border:0;background:none;text-align:left;cursor:pointer;' + (i ? 'border-top:1px solid var(--border-soft)' : '') + '"><span class="stat c-indigo" style="padding:0;border:0;box-shadow:none;background:none"><span class="ico" style="width:36px;height:36px">' + ic(m.ic, 's') + '</span></span><span class="grow b">' + esc(m.t) + '</span>' + ic('chevron-right', 's') + '</button>').join('') + '</div>' : '') +
      '<div class="sec-head mt-l"><h2>Pengaturan</h2></div><div class="card p0">' +
      '<div class="row" style="padding:14px 16px">' + ic('moon') + '<div class="grow"><b>Mode gelap</b><div class="xs muted">Nyaman untuk malam hari</div></div><label class="toggle"><input type="checkbox" data-change="tema" ' + (tema === 'dark' ? 'checked' : '') + ' aria-label="Mode gelap"><i></i></label></div>' +
      '<button class="row" data-act="sandi" style="width:100%;padding:14px 16px;border:0;border-top:1px solid var(--border-soft);background:none;text-align:left;cursor:pointer">' + ic('key-round') + '<span class="grow b">Ubah kata sandi</span>' + ic('chevron-right', 's') + '</button>' +
      '<button class="row" data-go="#/info" style="width:100%;padding:14px 16px;border:0;border-top:1px solid var(--border-soft);background:none;text-align:left;cursor:pointer">' + ic('circle-help') + '<span class="grow b">Bantuan & Pusat Informasi</span>' + ic('chevron-right', 's') + '</button>' +
      '<div class="row" style="padding:14px 16px;border-top:1px solid var(--border-soft)">' + ic('info') + '<div class="grow"><b>Tentang aplikasi</b><div class="xs muted">' + esc((S.cfg || {}).nama_app || '') + ' v' + esc((S.cfg || {}).versi || '1.0.0') + ' · ' + esc((S.cfg || {}).nama_sekolah || '') + '</div></div></div></div>' +
      '<div class="lockline mt">' + ic('lock', 's') + ' Sesi berakhir otomatis setelah 12 jam. Catatan konseling hanya dapat dibaca Guru BK.</div>' +
      '<button class="btn btn-danger-o btn-block btn-lg mt-l" data-act-global="keluar">' + ic('log-out') + ' Keluar</button>' + kreditHtml().replace('class="kredit"', 'class="kredit mt-l"') + '<div style="height:24px"></div></div>';
    bind(el, {
      'change:tema': (c) => { const t = c.checked ? 'dark' : 'light'; Store.set('tema', t); terapkanTema(t); },
      sandi: () => App.showGantiSandi(false),
      ttd: () => bukaTtd()
    });
  }
});

function bukaTtd() {
  let gambar = false;
  const m = Modal.open({
    title: 'Tanda tangan elektronik', size: '',
    body: '<p class="small muted mb">Goreskan tanda tangan di kotak, atau unggah gambar tanda tangan (PNG latar transparan/putih).</p><canvas class="sigpad" width="600" height="220" aria-label="Area tanda tangan"></canvas>' +
      '<div class="row between mt"><button class="btn btn-ghost btn-sm" data-act="hapus">' + ic('eraser', 's') + ' Bersihkan</button><label class="btn btn-outline btn-sm" style="position:relative">' + ic('upload', 's') + ' Unggah gambar<input type="file" accept="image/png,image/jpeg" data-change="file" style="position:absolute;inset:0;opacity:0"></label></div>',
    foot: '<button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="simpan">Simpan tanda tangan</button>',
    onMount(el) {
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#0F172A';
      let drawing = false;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      cv.addEventListener('pointerdown', (e) => { drawing = true; gambar = true; cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
      cv.addEventListener('pointermove', (e) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); });
      cv.addEventListener('pointerup', () => (drawing = false));
    },
    handlers: {
      hapus: () => { const cv = m.el.querySelector('canvas'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); gambar = false; },
      tutup: () => m.close(),
      'change:file': async (inp) => {
        try {
          const f = await bacaBerkas(inp.files[0], { png: true, dim: 600, maxMB: 1 });
          const img = new Image(); img.onload = () => { const cv = m.el.querySelector('canvas'), ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); const sk = Math.min(cv.width / img.width, cv.height / img.height); ctx.drawImage(img, (cv.width - img.width * sk) / 2, (cv.height - img.height * sk) / 2, img.width * sk, img.height * sk); gambar = true; }; img.src = f.preview;
        } catch (e) { toast(e.message, 'error'); }
      },
      simpan: async (btn) => {
        if (!gambar) { toast('Goreskan atau unggah tanda tangan terlebih dahulu.', 'warn'); return; }
        const data = m.el.querySelector('canvas').toDataURL('image/png');
        const r = await App.aksi('ttdSimpan', { data }, { btn });
        if (r) m.close();
      }
    }
  });
}

// ============================================================ PUSAT INFORMASI
const KAT_IC = { 'Karier & Kuliah': ['graduation-cap', 'blue'], 'Kesehatan Mental': ['heart-pulse', 'emerald'], 'Anti-Perundungan': ['shield-check', 'rose'], 'Layanan BK': ['heart-handshake', 'indigo'], 'FAQ': ['circle-help', 'amber'] };
halaman('info', {
  title: 'Pusat Informasi BK', nav: 'info',
  render(el, p) {
    const semua = (S.boot.info || []);
    if (p[0] === 'a') return infoArtikel(el, semua.find((a) => a.id === p[1]));
    const kat = p[0] === 'k' ? p[1] : (el._k || 'Semua');
    const q = (el._q || '').toLowerCase();
    const cocok = (a) => (kat === 'Semua' || a.kategori === kat) && (!q || (a.judul + ' ' + a.ringkasan + ' ' + a.isi).toLowerCase().includes(q));
    const list = semua.filter(cocok);
    const unggulan = list.find((a) => a.unggulan);
    const faq = list.filter((a) => a.kategori === 'FAQ');
    const artikel = list.filter((a) => a !== unggulan && a.kategori !== 'FAQ');
    const kats = ['Semua'].concat([...new Set(semua.map((a) => a.kategori))]);
    const grup = {}; artikel.forEach((a) => (grup[a.kategori] = grup[a.kategori] || []).push(a));
    const cfg = S.cfg || {};
    el.innerHTML = UI.ph('Pusat Informasi BK', 'Panduan studi, karier, kesehatan mental & FAQ') + '<div class="wrap" style="max-width:900px">' +
      '<div class="search-in mt-l">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari artikel, info SNBP, beasiswa, FAQ..." value="' + esc(el._q || '') + '" data-input="q"></div>' +
      '<div class="mt">' + UI.chips(kats.map((k) => ({ k, l: k, n: k === 'Semua' ? semua.length : semua.filter((a) => a.kategori === k).length })), kat, 'kat', true) + '</div>' +
      (unggulan ? '<div class="card mt-l" style="padding:0;overflow:hidden"><div style="height:6px;background:var(--grad)"></div><div style="padding:16px"><div class="row between">' + pill('PENGUMUMAN PENTING', 'dark') + '<span class="pill p-violet">BARU</span></div>' +
        '<h2 class="mt" style="font-size:18px">' + esc(unggulan.judul) + '</h2><div class="meta">' + '<span>' + ic('user-round', 's') + esc(unggulan.penulis) + '</span><span>' + ic('calendar', 's') + esc(tgl(unggulan.tanggal)) + '</span></div>' +
        '<p class="quote mt">' + esc(unggulan.ringkasan || unggulan.isi.slice(0, 160)) + '</p><button class="btn btn-primary btn-block mt" data-go="#/info/a/' + esc(unggulan.id) + '">Baca Panduan Lengkap ' + ic('arrow-right', 's') + '</button></div></div>' : '') +
      Object.keys(grup).map((k) => {
        const [icn, c] = KAT_IC[k] || ['book-open', 'indigo'];
        return '<section class="sec"><div class="sec-head"><h2 class="row c-' + c + '" style="gap:8px"><span class="tint-c">' + ic(icn) + '</span>' + esc(k) + '</h2></div><div class="list">' +
          grup[k].map((a) => '<div class="item click" data-go="#/info/a/' + esc(a.id) + '"><div class="grow"><div class="row between">' + pill(a.kategori, 'slate') + '<span class="xs muted">' + esc(tgl(a.tanggal)) + '</span></div><h4 class="mt" style="margin-top:6px">' + esc(a.judul) + '</h4><p class="small muted" style="margin-top:2px">' + esc(a.ringkasan || '') + '</p>' +
            '<div class="row between mt" style="margin-top:6px"><span class="xs muted">' + (a.lampiran ? ic('paperclip', 's') + ' ' + esc(a.lampiran_nama || 'Lampiran') : ic('user-round', 's') + ' ' + esc(a.penulis)) + '</span><span class="small b" style="color:var(--primary)">Baca ' + ic('chevron-right', 's') + '</span></div></div></div>').join('') + '</div></section>';
      }).join('') +
      (faq.length ? '<section class="sec"><div class="sec-head"><h2>Tanya Jawab (FAQ)</h2></div><div class="stack s">' + faq.map((a, i) => '<details class="card tight" ' + (i === 0 ? 'open' : '') + '><summary class="b" style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px">' + esc(a.judul) + ic('chevron-down', 's') + '</summary><p class="small mt" style="color:var(--text-2);white-space:pre-line">' + esc(a.isi) + '</p></details>').join('') + '</div></section>' : '') +
      (!list.length ? emptyState('search-x', 'Tidak ada artikel', 'Coba kata kunci atau kategori lain.') : '') +
      '<div class="card mt-l c-indigo"><div class="row top"><span class="stat" style="padding:0;border:0;box-shadow:none;background:none"><span class="ico">' + ic('map-pin') + '</span></span><div class="grow"><h3>Pusat Konsultasi Offline</h3><p class="small muted">' + esc(cfg.lokasi_bk || 'Ruang BK') + ' · ' + esc(cfg.jam_layanan || '') + '</p></div></div>' +
      (S.role === 'siswa' ? '<button class="btn btn-primary btn-block mt" data-go="#/konseling">' + ic('circle-plus') + ' Ajukan Sesi Konseling</button>' : '') + '</div><div style="height:24px"></div></div>';
    bind(el, {
      kat: (b) => { el._k = b.dataset.k; if (p[0] === 'k') go('#/info'); else this.render(el, p); },
      'input:q': debounce((i) => { el._q = i.value; const pos = i.selectionStart; this.render(el, p); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(pos, pos); }, 250)
    });
  }
});
function infoArtikel(el, a) {
  if (!a) { el.innerHTML = UI.ph('Artikel', '', { back: '#/info' }) + '<div class="wrap">' + emptyState('file-x', 'Artikel tidak ditemukan', 'Mungkin sudah dihapus.') + '</div>'; return; }
  const [icn, c] = KAT_IC[a.kategori] || ['book-open', 'indigo'];
  el.innerHTML = UI.ph(a.kategori, 'Pusat Informasi', { back: '#/info' }) + '<div class="wrap" style="max-width:760px"><article class="card mt-l">' +
    '<div class="row c-' + c + '"><span class="pill" style="background:var(--t);color:var(--c)">' + ic(icn, 's') + esc(a.kategori) + '</span><span class="xs muted">' + esc(tglP(a.tanggal)) + '</span></div>' +
    '<h1 class="mt" style="font-size:21px">' + esc(a.judul) + '</h1><div class="meta">' + '<span>' + ic('user-round', 's') + esc(a.penulis) + '</span></div>' +
    (a.ringkasan ? '<p class="quote mt">' + esc(a.ringkasan) + '</p>' : '') +
    '<div class="mt" style="font-size:15px;line-height:1.7;color:var(--text-2);white-space:pre-line">' + esc(a.isi) + '</div>' +
    (a.lampiran ? '<div class="file-row mt-l"><span class="thumb">' + ic('file-text') + '</span><div class="grow b ell">' + esc(a.lampiran_nama || 'Lampiran') + '</div><button class="btn btn-soft btn-sm" data-act="unduh">' + ic('download', 's') + ' Unduh</button></div>' : '') +
    '</article>' + (S.role === 'siswa' ? '<div class="btns mt"><button class="btn btn-primary" data-go="#/konseling">' + ic('heart-handshake') + ' Konsultasi dengan Guru BK</button><button class="btn btn-outline" data-go="#/lapor">' + ic('shield-alert') + ' Lapor Kasus</button></div>' : '') + '<div style="height:24px"></div></div>';
  bind(el, { unduh: (b) => unduhBerkas('info', a.id, b) });
}

// ============================================================ SURAT
const SURAT_C = { SP1: 'orange', SP2: 'orange', SP3: 'red', Pemanggilan: 'red', Perjanjian: 'slate', 'Rekap Bulanan': 'indigo' };
function pillJenis(j) { return pill(((S.cfg || {}).labelSurat || {})[j] ? (j === 'Pemanggilan' ? 'Pemanggilan Orang Tua' : j) : j, SURAT_C[j] || 'slate'); }
function suratList() { return S.boot.surat || []; }

halaman('surat', {
  roles: ['siswa', 'ortu', 'wali'], title: 'Surat Resmi', nav: 'surat',
  render(el, p) {
    if (p[0]) return suratDetailPenerima(el, p[0]);
    const all = suratList();
    const f = el._f || 'semua';
    const grup = { semua: () => true, sp: (s) => /^SP/.test(s.jenis), pgl: (s) => s.jenis === 'Pemanggilan', pj: (s) => s.jenis === 'Perjanjian' };
    const list = all.filter(grup[f]);
    const ortu = S.role === 'ortu';
    el.innerHTML = UI.ph('Surat Resmi', S.role === 'wali' ? 'Surat siswa di kelas Anda' : 'Dokumen, peringatan & pemanggilan') + '<div class="wrap" style="max-width:860px">' +
      '<div class="mt-l">' + UI.chips([{ k: 'semua', l: 'Semua', n: all.length }, { k: 'sp', l: 'Surat Peringatan', n: all.filter(grup.sp).length }, { k: 'pgl', l: 'Pemanggilan', n: all.filter(grup.pgl).length }, { k: 'pj', l: 'Perjanjian', n: all.filter(grup.pj).length }], f, 'f', true) + '</div>' +
      '<div class="list mt">' + (list.map((s) => {
        const perluKonf = ortu && s.jadwal_pertemuan && !s.konfirmasi && s.jadwal_pertemuan.slice(0, 10) >= hariIni();
        return '<div class="card" style="' + (perluKonf ? 'border:2px solid var(--rose)' : '') + '"><div class="row between wrap">' + pillJenis(s.jenis) + (perluKonf ? pill('MENUNGGU KONFIRMASI', 'amber') : pill(s.status)) + '</div>' +
          '<div class="row between mt"><span class="mono small muted">' + esc(s.nomor || '-') + '</span><span class="small muted">' + esc(tgl(s.waktu_kirim || s.dibuat)) + '</span></div>' +
          (S.role === 'wali' ? '<h4 class="mt b">' + esc(s.nama_siswa) + '</h4>' : '') + '<p class="mt" style="margin-top:6px">' + esc(s.pemicu) + '</p>' +
          (s.jadwal_pertemuan ? '<div class="card flat tight mt" style="background:var(--surface-2)"><div class="xs b muted">' + ic('calendar-clock', 's') + ' AGENDA PERTEMUAN</div><b class="small">' + esc(tglP(s.jadwal_pertemuan) + ' · ' + jam(s.jadwal_pertemuan) + ' WIB') + '</b><div class="small muted">' + esc(s.tempat || '') + '</div>' + (s.konfirmasi ? '<div class="small mt" style="color:#059669">' + ic('circle-check', 's') + ' Dikonfirmasi: ' + esc({ hadir: 'Bersedia hadir', jadwal_ulang: 'Minta jadwal ulang', diwakilkan: 'Diwakilkan' }[s.konfirmasi.pilihan]) + '</div>' : '') + '</div>' : '') +
          '<div class="btns mt"><button class="btn btn-primary btn-sm" data-go="#/surat/' + esc(s.id) + '">' + ic('eye', 's') + ' Pratinjau</button>' + (perluKonf ? '<button class="btn btn-outline btn-sm" data-go="#/surat/' + esc(s.id) + '/konfirmasi">' + ic('circle-check', 's') + ' Konfirmasi Kehadiran</button>' : '<button class="btn btn-outline btn-sm" data-act="dl" data-id="' + esc(s.id) + '">' + ic('download', 's') + ' Unduh PDF</button>') + '</div></div>';
      }).join('') || emptyState('mail-open', 'Belum ada surat', 'Surat resmi dari sekolah akan tampil di sini.')) + '</div>' +
      '<div class="alert info mt-l">' + ic('shield-check') + '<div>Dokumen sah diterbitkan secara elektronik dan dapat diverifikasi melalui kode QR pada surat.</div></div><div style="height:24px"></div></div>';
    bind(el, { f: (b) => { el._f = b.dataset.k; this.render(el, p); }, dl: (b) => unduhBerkas('surat', b.dataset.id, b) });
  }
});

function suratDetailPenerima(el, id) {
  const s = suratList().find((x) => x.id === id);
  if (!s) { el.innerHTML = UI.ph('Surat', '', { back: '#/surat' }) + '<div class="wrap">' + emptyState('mail-x', 'Surat tidak ditemukan', '') + '</div>'; return; }
  const ortu = S.role === 'ortu';
  const perluKonf = ortu && s.jadwal_pertemuan && s.jadwal_pertemuan.slice(0, 10) >= hariIni();
  const pel = S.role === 'wali' ? (S.boot.pelanggaran || []).filter((x) => x.nisn === s.nisn).map((x) => ({ tanggal: x.tanggal, nama: x.pelanggaran, poin: x.poin })) : (S.boot.pelanggaran || []).map((x) => ({ tanggal: x.tanggal, nama: x.nama, poin: x.poin }));
  const html = renderSurat(dataSurat(s, { pelanggaran: pel.slice().reverse(), nama_ortu: (S.boot.siswa && S.boot.siswa.nama_ortu) || '' }));
  const k = s.konfirmasi;
  el.innerHTML = UI.ph(((S.cfg || {}).labelSurat || {})[s.jenis] || s.jenis, s.nomor, { back: '#/surat' }) + '<div class="wrap"><div class="cols mt-l"><div>' +
    '<div class="a4-wrap"><div class="a4">' + html + '</div></div></div><div class="stack">' +
    (perluKonf && !k ? '<div class="card" style="background:var(--conf);color:#fff"><b>Status: surat resmi diterbitkan · menunggu konfirmasi</b><p class="small" style="opacity:.85;margin-top:4px">Mohon konfirmasi kehadiran sebelum ' + esc(tglP(tambahHari(s.jadwal_pertemuan.slice(0, 10), -1))) + '.</p></div>' : '') +
    '<div class="card">' + UI.kv([['Nomor surat', s.nomor], ['Tanggal terbit', tgl(s.waktu_kirim)], ['Jenis', ((S.cfg || {}).labelSurat || {})[s.jenis] || s.jenis], ['Siswa', s.nama_siswa + ' · ' + s.kelas], ['Ditandatangani', s.nama_ttd || '-']]) +
    '<button class="btn btn-primary btn-block mt" data-act="dl">' + ic('download') + ' Unduh Berkas PDF Resmi</button></div>' +
    (s.jadwal_pertemuan ? '<div class="card c-rose"><div class="row top"><div class="datetile" style="width:64px"><span class="m">' + tile(s.jadwal_pertemuan).m + '</span><span class="d">' + tile(s.jadwal_pertemuan).d + '</span><span class="w">' + HARI[D(s.jadwal_pertemuan).getDay()] + '</span></div><div class="grow"><div class="xs muted b">AGENDA PERTEMUAN TATAP MUKA</div><b>' + esc(jam(s.jadwal_pertemuan)) + ' WIB</b><div class="small">' + ic('map-pin', 's') + ' ' + esc(s.tempat || '') + '</div></div></div></div>' : '') +
    (ortu && s.jadwal_pertemuan ? formKonfirmasi(s) : '') +
    '<div class="lockline">' + ic('shield-check', 's') + ' Dokumen ditandatangani elektronik dan dapat diverifikasi dengan kode QR.</div></div></div><div style="height:24px"></div></div>';
  skalaA4(el);
  bind(el, {
    dl: (b) => unduhBerkas('surat', s.id, b),
    pil: (b) => { el.querySelectorAll('[data-act=pil]').forEach((x) => x.classList.toggle('on', x === b)); el.querySelector('[name=pilihan]').value = b.dataset.k; el.querySelector('[data-catatan-lbl]').textContent = b.dataset.k === 'hadir' ? 'Catatan tambahan (opsional)' : b.dataset.k === 'diwakilkan' ? 'Nama & hubungan wakil yang hadir' : 'Alasan & usulan hari pengganti'; },
    'submit:konf': async (f) => {
      const d = formData(f);
      if (!d.pilihan) { toast('Pilih salah satu opsi kehadiran.', 'warn'); return; }
      const r = await App.aksi('konfirmasiKehadiran', Object.assign({ id: s.id }, d), { btn: f.querySelector('[type=submit]') });
      if (r) { s.konfirmasi = r; suratDetailPenerima(el, id); }
    }
  });
  if (location.hash.endsWith('/konfirmasi')) setTimeout(() => { const f = el.querySelector('[data-form=konf]'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
}
function formKonfirmasi(s) {
  const k = s.konfirmasi;
  if (k) return '<div class="card"><div class="row"><span class="avatar s c-emerald">' + ic('check', 's') + '</span><div class="grow"><b>Konfirmasi terkirim</b><div class="small muted">' + esc({ hadir: 'Bersedia hadir tepat waktu', jadwal_ulang: 'Meminta jadwal ulang', diwakilkan: 'Diwakilkan' }[k.pilihan]) + ' · ' + esc(k.nama) + '</div></div></div>' + (k.catatan ? '<p class="quote mt">' + esc(k.catatan) + '</p>' : '') + '<p class="xs muted mt">Tercatat ' + esc(tgl(k.waktu) + ', ' + jam(k.waktu)) + ' WIB. Hubungi sekolah bila ada perubahan.</p></div>';
  const opsi = [['hadir', 'Bersedia Hadir Tepat Waktu', 'Hadir sesuai jadwal'], ['jadwal_ulang', 'Berhalangan (Minta Jadwal Ulang)', 'Wajib menyertakan alasan & usulan hari pengganti'], ['diwakilkan', 'Diwakilkan oleh Wali Lain', 'Sebutkan nama & hubungan dengan siswa']];
  return '<form class="card" data-form="konf"><h3 class="mb">' + ic('user-check') + ' Formulir Respon Orang Tua/Wali ' + pill('WAJIB', 'slate') + '</h3><div class="stack s">' +
    opsi.map((o) => '<button type="button" class="rcard" data-act="pil" data-k="' + o[0] + '"><span class="rad"></span><div><b>' + o[1] + '</b><div class="small muted">' + o[2] + '</div></div></button>').join('') + '</div><input type="hidden" name="pilihan">' +
    '<div class="field mt"><label class="lbl">Nama orang tua/wali yang hadir <span class="req">*</span></label><input class="input" name="nama" required value="' + esc((S.boot.siswa && S.boot.siswa.nama_ortu) || S.me.nama) + '"></div>' +
    '<div class="field"><label class="lbl">Nomor WhatsApp aktif</label><input class="input" name="no_wa" inputmode="tel" placeholder="08xxxxxxxxxx"></div>' +
    '<div class="field"><label class="lbl" data-catatan-lbl>Catatan tambahan (opsional)</label><textarea class="textarea" name="catatan" maxlength="500" placeholder="Tuliskan catatan atau pertanyaan awal untuk Guru BK..."></textarea></div>' +
    '<button class="btn btn-primary btn-block btn-lg" type="submit">' + ic('send') + ' Kirim Konfirmasi Kehadiran</button></form>';
}

// ── Surat untuk staf (Kesiswaan / BK / Kepala Sekolah) ──
halaman('surat', {
  roles: ['kesiswaan', 'bk', 'kepsek'], title: (p) => (p && p[0] ? 'Detail Surat' : S.role === 'kepsek' ? 'Surat Menunggu Tanda Tangan' : 'Antrean Surat & Persetujuan'), nav: 'surat',
  render(el, p) {
    if (p[0]) return suratDetailStaf(el, p[0]);
    const all = suratList();
    const kp = S.role === 'kepsek';
    const grup = {
      periksa: (s) => s.bisaPeriksa && (s.status === 'Draf' || s.status === 'Diperiksa'),
      ttd: (s) => s.status === 'Menunggu TTD', kirim: (s) => s.status === 'Terkirim', batal: (s) => s.status === 'Dibatalkan', semua: () => true
    };
    const f = el._f || (kp ? 'ttd' : 'periksa');
    const q = (el._q || '').toLowerCase();
    const list = all.filter(grup[f]).filter((s) => !q || (s.nama_siswa + ' ' + s.nomor + ' ' + s.jenis + ' ' + s.kelas).toLowerCase().includes(q));
    const tabs = (kp ? [['ttd', 'Menunggu TTD'], ['kirim', 'Terkirim'], ['semua', 'Semua']] : [['periksa', 'Perlu Diperiksa'], ['ttd', 'Menunggu TTD'], ['kirim', 'Terkirim'], ['batal', 'Dibatalkan'], ['semua', 'Semua']]).map((t) => ({ k: t[0], l: t[1], n: all.filter(grup[t[0]]).length }));
    el.innerHTML = UI.ph(kp ? 'Menunggu Tanda Tangan' : 'Antrean Surat', 'Draf otomatis → diperiksa → tanda tangan → terkirim', { acts: !kp ? '<button class="btn btn-primary btn-sm" data-act="buat">' + ic('plus', 's') + ' Buat</button>' : '' }) +
      '<div class="wrap"><div class="row between mt-l d-only"><p class="muted">Surat tidak pernah terkirim sebelum disetujui pemeriksa' + (kp ? '' : ' dan, bila perlu, ditandatangani Kepala Sekolah') + '.</p>' + (!kp ? '<button class="btn btn-primary" data-act="buat">' + ic('file-plus') + ' Buat Surat Manual</button>' : '') + '</div>' +
      '<div class="mt">' + UI.tabs(tabs, f, 'tab') + '</div>' +
      '<div class="toolbar mt"><div class="search-in">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari nama siswa, nomor, jenis..." value="' + esc(el._q || '') + '" data-input="q"></div></div>' +
      '<div class="card p0">' + UI.tabel([
        { k: 'nama_siswa', l: 'Siswa', f: (s) => '<b>' + esc(s.nama_siswa) + '</b><div class="xs muted">' + esc(s.kelas) + '</div>' },
        { k: 'jenis', l: 'Jenis', f: (s) => pillJenis(s.jenis) },
        { k: 'pemicu', l: 'Pemicu', f: (s) => '<span class="small">' + esc(s.pemicu) + '</span>' },
        { k: 'nomor', l: 'Nomor', f: (s) => '<span class="mono xs">' + esc(s.nomor || '—') + '</span>' },
        { k: 'dibuat', l: 'Dibuat', f: (s) => esc(tgl(s.dibuat)) },
        { k: 'status', l: 'Status', f: (s) => pill(s.status) + (s.konfirmasi ? ' ' + pill('Ortu ✓', 'green') : '') }
      ], list, { rowAct: 'buka', kosong: emptyState('inbox', f === 'periksa' ? 'Tidak ada surat yang perlu diperiksa' : 'Tidak ada surat', 'Draf baru dibuat otomatis saat poin siswa melewati ambang.') }) + '</div><div style="height:24px"></div></div>';
    bind(el, {
      tab: (b) => { el._f = b.dataset.k; this.render(el, p); },
      'input:q': debounce((i) => { el._q = i.value; this.render(el, p); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250),
      buka: (r) => go('#/surat/' + r.dataset.id),
      buat: () => buatSuratModal()
    });
  }
});

function suratDetailStaf(el, id) {
  const s = suratList().find((x) => x.id === id);
  if (!s) { el.innerHTML = UI.ph('Surat', '', { back: '#/surat' }) + '<div class="wrap">' + emptyState('mail-x', 'Surat tidak ditemukan', 'Mungkin sudah diproses. Muat ulang data.') + '</div>'; return; }
  const kp = S.role === 'kepsek';
  const bisaUbah = s.bisaPeriksa && (s.status === 'Draf' || s.status === 'Diperiksa');
  const urut = s.perluTtd ? ['Draf', 'Disetujui', 'Menunggu TTD', 'Terkirim'] : ['Draf', 'Disetujui', 'Terkirim'];
  const cur = s.status === 'Terkirim' ? urut.length - 1 : s.status === 'Menunggu TTD' ? 2 : 0;
  const perluJadwal = /^(Pemanggilan|SP3)$/.test(s.jenis);
  const val = el._v && el._v.id === id ? el._v : { id, jadwal: s.jadwal_pertemuan || '', tempat: s.tempat || '', catatan: s.catatan || '' };
  el._v = val;
  const preview = () => renderSurat(dataSurat(s, { jadwal: val.jadwal, tempat: val.tempat, catatan: val.catatan, pemeriksa: s.nama_pemeriksa || (bisaUbah ? S.me.nama : ''), jabatan: S.role === 'bk' ? 'Guru Bimbingan Konseling' : S.role === 'kesiswaan' ? 'Wakasek Kesiswaan' : undefined }));
  const ttdAda = !!(S.boot.ttdKepsek);
  el.innerHTML = UI.ph(((S.cfg || {}).labelSurat || {})[s.jenis] || s.jenis, s.nama_siswa + ' · ' + s.kelas, { back: '#/surat' }) +
    '<div class="wrap"><div class="row between mt-l d-only"><button class="btn btn-ghost" data-go="#/surat">' + ic('arrow-left') + ' Kembali ke antrean</button>' + pill(s.status, null, 'l') + '</div>' +
    '<div class="cols mt"><div><div class="a4-wrap"><div class="a4" data-a4>' + preview() + '</div></div></div><div class="stack">' +
    '<div class="card">' + UI.stepper(urut, cur) +
    '<div class="divider"></div>' + UI.kv([['Jenis', ((S.cfg || {}).labelSurat || {})[s.jenis] || s.jenis], ['Siswa', s.nama_siswa], ['Kelas', s.kelas], ['Total poin', String(s.poin)], ['Pemicu', s.pemicu], ['Nomor', s.nomor || 'Terbit saat disetujui'], ['Dibuat oleh', s.dibuat_oleh], ['Pemeriksa', s.nama_pemeriksa || '-']]) + '</div>' +
    (s.catatan_revisi && s.status === 'Diperiksa' ? '<div class="alert warn">' + ic('message-square-warning') + '<div><b>Dikembalikan Kepala Sekolah</b><br>' + esc(s.catatan_revisi) + '</div></div>' : '') +
    (s.galat ? '<div class="alert err">' + ic('circle-alert') + '<div><b>PDF belum terbentuk</b><br>' + esc(s.galat) + '</div></div>' : '') +
    (s.konfirmasi ? '<div class="alert ok">' + ic('user-check') + '<div><b>Konfirmasi orang tua:</b> ' + esc({ hadir: 'Bersedia hadir', jadwal_ulang: 'Minta jadwal ulang', diwakilkan: 'Diwakilkan' }[s.konfirmasi.pilihan]) + ' · ' + esc(s.konfirmasi.nama) + (s.konfirmasi.no_wa ? ' · ' + esc(s.konfirmasi.no_wa) : '') + (s.konfirmasi.catatan ? '<br><i>' + esc(s.konfirmasi.catatan) + '</i>' : '') + '</div></div>' : '') +
    (bisaUbah ? '<form class="card" data-form="setujui"><h3 class="mb">Periksa isi surat</h3>' +
      (perluJadwal || s.jadwal_pertemuan ? '<div class="field"><label class="lbl">Jadwal pertemuan ' + (perluJadwal ? '<span class="req">*</span>' : '') + '</label><input class="input" type="datetime-local" name="jadwal_pertemuan" value="' + esc(val.jadwal) + '" min="' + hariIni() + 'T07:00" data-input="pv"></div>' +
        '<div class="field"><label class="lbl">Tempat</label><input class="input" name="tempat" value="' + esc(val.tempat) + '" data-input="pv"></div>' : '') +
      '<div class="field"><label class="lbl">Catatan tambahan di surat <span class="opt">Opsional</span></label><textarea class="textarea" name="catatan" maxlength="1500" data-input="pv" placeholder="Mis. mohon membawa buku penghubung">' + esc(val.catatan) + '</textarea></div>' +
      '<div class="stack s"><button class="btn btn-primary btn-block" type="submit">' + ic('check') + ' ' + (s.perluTtd ? 'Setujui & Teruskan ke Kepala Sekolah' : 'Setujui & Kirim ke Orang Tua') + '</button>' +
      '<div class="btns"><button type="button" class="btn btn-outline" data-act="simpan">' + ic('save', 's') + ' Simpan draf</button><button type="button" class="btn btn-danger-o" data-act="batal">' + ic('x', 's') + ' Batalkan</button></div></div></form>' : '') +
    (kp && s.status === 'Menunggu TTD' ? '<form class="card" data-form="ttd"><h3 class="mb">Tanda tangani surat</h3><div class="stack s">' +
      '<label class="rcard ' + (ttdAda ? '' : '') + '" style="' + (ttdAda ? '' : 'opacity:.6') + '"><input type="radio" name="metode" value="gambar" ' + (ttdAda ? '' : 'disabled') + ' style="margin-top:3px"><div><b>Gambar tanda tangan</b><div class="small muted">' + (ttdAda ? 'Memakai tanda tangan tersimpan + kode QR verifikasi' : 'Belum ada — atur di menu Lainnya') + '</div></div></label>' +
      '<label class="rcard"><input type="radio" name="metode" value="qr" checked style="margin-top:3px"><div><b>Kode QR verifikasi</b><div class="small muted">Tanda tangan elektronik berbasis kode QR</div></div></label></div>' +
      '<button class="btn btn-primary btn-block mt" type="submit">' + ic('pen-line') + ' Tanda Tangani & Kirim</button><button type="button" class="btn btn-outline btn-block mt" data-act="kembalikan">' + ic('undo-2') + ' Kembalikan dengan Catatan</button></form>' : '') +
    (s.status === 'Terkirim' ? '<div class="card"><div class="row"><span class="avatar s c-emerald">' + ic('send', 's') + '</span><div class="grow"><b>Terkirim ' + esc(tgl(s.waktu_kirim)) + '</b><div class="small muted">Orang tua menerima notifikasi aplikasi' + ((S.cfg || {}).waText ? '' : ', WhatsApp & email bila aktif') + '.</div></div></div>' +
      '<div class="btns mt"><button class="btn btn-primary" data-act="dl">' + ic('download', 's') + ' Unduh PDF</button>' + (!s.ada_pdf ? '<button class="btn btn-outline" data-act="pdf">' + ic('refresh-cw', 's') + ' Buat ulang PDF</button>' : '') + '</div></div>' : '') +
    '</div></div><div style="height:24px"></div></div>';
  skalaA4(el);
  const segarPrev = () => { const a = el.querySelector('[data-a4]'); if (a) a.innerHTML = preview(); };
  bind(el, {
    'input:pv': (i) => { const k = i.name === 'jadwal_pertemuan' ? 'jadwal' : i.name; val[k] = i.value; segarPrev(); },
    simpan: async (b) => { const f = el.querySelector('[data-form=setujui]'); const d = formData(f); const r = await App.aksi('suratAksi', Object.assign({ id, aksi: 'simpan' }, d), { btn: b }); if (r) Object.assign(s, d); },
    'submit:setujui': async (f) => {
      const d = formData(f);
      if (perluJadwal && !d.jadwal_pertemuan) { toast('Isi jadwal pertemuan dengan orang tua.', 'warn'); return; }
      const ok = await konfirmasi({ title: s.perluTtd ? 'Teruskan ke Kepala Sekolah?' : 'Kirim surat ke orang tua?', text: s.perluTtd ? 'Nomor surat akan diterbitkan dan surat menunggu tanda tangan Kepala Sekolah.' : 'Nomor surat diterbitkan, PDF dibuat, dan orang tua menerima notifikasi.', ok: 'Ya, setujui' });
      if (!ok) return;
      const r = await App.aksi('suratAksi', Object.assign({ id, aksi: 'setujui' }, d), { btn: f.querySelector('[type=submit]'), teks: s.perluTtd ? 'Menyetujui...' : 'Membuat PDF...' });
      if (r) { s.status = s.perluTtd ? 'Menunggu TTD' : 'Terkirim'; el._v = null; suratDetailStaf(el, id); }
    },
    batal: async (b) => { const t = await mintaTeks({ title: 'Batalkan surat?', label: 'Alasan pembatalan', ok: 'Batalkan surat', danger: true }); if (t === null) return; const r = await App.aksi('suratAksi', { id, aksi: 'batal', catatan: t }, { btn: b }); if (r) { s.status = 'Dibatalkan'; go('#/surat'); } },
    'submit:ttd': async (f) => {
      const d = formData(f);
      const r = await App.aksi('suratAksi', { id, aksi: 'ttd', metode: d.metode || 'qr' }, { btn: f.querySelector('[type=submit]'), teks: 'Menandatangani...' });
      if (r) { s.status = 'Terkirim'; go('#/surat'); }
    },
    kembalikan: async (b) => { const t = await mintaTeks({ title: 'Kembalikan ke pemeriksa', label: 'Catatan revisi', required: true, ok: 'Kembalikan' }); if (!t) return; const r = await App.aksi('suratAksi', { id, aksi: 'kembalikan', catatan: t }, { btn: b }); if (r) { s.status = 'Diperiksa'; go('#/surat'); } },
    dl: (b) => unduhBerkas('surat', id, b),
    pdf: async (b) => { const r = await App.aksi('suratPdfUlang', { id }, { btn: b, teks: 'Membuat PDF...' }); if (r) s.ada_pdf = 1; }
  });
}

function buatSuratModal(nisn) {
  const daftar = (S.boot.siswa || []).map((x) => ({ nisn: x.nisn, nama: x.nama, kelas: x.kelas, poin: x.poin, level: x.level }));
  const jenisBoleh = ((S.cfg || {}).ambang || []).filter((a) => a.pemeriksa.indexOf(S.role) > -1).map((a) => a.jenis);
  const semua = ['SP1', 'SP2', 'SP3', 'Pemanggilan', 'Perjanjian'].filter((j) => jenisBoleh.indexOf(j) > -1 || j === 'Perjanjian' || (S.role === 'bk' && j === 'Pemanggilan'));
  let pilih = nisn ? daftar.find((x) => x.nisn === nisn) : null;
  const m = Modal.open({
    title: 'Buat surat manual', size: 'lg',
    body: '<div data-siswa></div><form data-form="buat" class="mt-l" ' + (pilih ? '' : 'hidden') + '><div data-terpilih></div>' +
      '<div class="grid2 mt"><div class="field"><label class="lbl">Jenis surat</label><select class="select" name="jenis" data-change="jenis">' + semua.map((j) => '<option value="' + j + '">' + esc(((S.cfg || {}).labelSurat || {})[j] || j) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="lbl">Alasan/pemicu <span class="req">*</span></label><input class="input" name="pemicu" required maxlength="200" placeholder="Mis. Koordinasi kedisiplinan"></div></div>' +
      '<div class="grid2" data-jadwal><div class="field"><label class="lbl">Jadwal pertemuan</label><input class="input" type="datetime-local" name="jadwal_pertemuan" min="' + hariIni() + 'T07:00"></div><div class="field"><label class="lbl">Tempat</label><input class="input" name="tempat" value="' + esc((S.cfg || {}).lokasi_bk || 'Ruang BK') + '"></div></div>' +
      '<div class="field"><label class="lbl">Catatan di surat <span class="opt">Opsional</span></label><textarea class="textarea" name="catatan" maxlength="1500"></textarea></div></form>',
    foot: '<button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="kirim">' + ic('file-plus') + ' Buat Draf</button>',
    onMount(el) {
      const tampilPilih = () => {
        el.querySelector('[data-form=buat]').hidden = !pilih;
        el.querySelector('[data-siswa]').hidden = !!pilih;
        if (pilih) el.querySelector('[data-terpilih]').innerHTML = '<div class="item">' + avatar(pilih.nama, 's') + '<div class="grow"><b>' + esc(pilih.nama) + '</b><div class="small muted">' + esc(pilih.kelas) + ' · ' + pilih.poin + ' poin</div></div><button type="button" class="btn btn-ghost btn-sm" data-act="ganti">Ganti</button></div>';
      };
      pemilihSiswa(el.querySelector('[data-siswa]'), daftar, (s) => { pilih = s; tampilPilih(); });
      tampilPilih();
    },
    handlers: {
      tutup: () => m.close(),
      ganti: () => { pilih = null; m.el.querySelector('[data-form=buat]').hidden = true; m.el.querySelector('[data-siswa]').hidden = false; },
      kirim: async (b) => {
        if (!pilih) { toast('Pilih siswa terlebih dahulu.', 'warn'); return; }
        const d = formData(m.el.querySelector('[data-form=buat]'));
        if (!d.pemicu) { toast('Isi alasan/pemicu surat.', 'warn'); return; }
        const r = await App.aksi('buatSurat', Object.assign({ nisn: pilih.nisn }, d), { btn: b });
        if (r) { m.close(); await App.muatBoot(true); go('#/surat/' + r.id); }
      }
    }
  });
}

// ============================================================ LAPORAN
halaman('laporan', {
  roles: ['bk', 'kesiswaan', 'kepsek', 'admin', 'wali'], title: (p) => (S.role === 'wali' ? 'Rekap Kelas' : 'Laporan & Statistik'), nav: 'laporan', live: false,
  render(el) {
    const f = el._f || { preset: 'bulan', kelas_id: '' };
    el._f = f;
    const hari = hariIni();
    const rentang = { bulan: [hari.slice(0, 8) + '01', hari], tiga: [tambahHari(hari, -90), hari], semester: [(S.cfg || {}).periode || tambahHari(hari, -180), hari], tahun: [tambahHari(hari, -365), hari] };
    const [dari, sampai] = f.preset === 'kustom' ? [f.dari || hari.slice(0, 8) + '01', f.sampai || hari] : rentang[f.preset];
    const kelas = S.role === 'wali' ? (S.boot.kelas || []) : ((S.cfg || {}).kelas || S.boot.kelas || []);
    el.innerHTML = UI.ph(S.role === 'wali' ? 'Rekap Kelas' : 'Laporan & Statistik', tgl(dari) + ' – ' + tgl(sampai)) + '<div class="wrap">' +
      '<div class="card mt-l"><form data-form="filter" class="row wrap" style="gap:10px;align-items:flex-end">' +
      '<div class="field" style="margin:0;min-width:170px;flex:1"><label class="lbl">Periode</label><select class="select" name="preset" data-change="preset">' + [['bulan', 'Bulan ini'], ['tiga', '3 bulan terakhir'], ['semester', 'Semester berjalan'], ['tahun', '12 bulan terakhir'], ['kustom', 'Pilih tanggal']].map((o) => '<option value="' + o[0] + '" ' + (f.preset === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      (f.preset === 'kustom' ? '<div class="field" style="margin:0"><label class="lbl">Dari</label><input class="input" type="date" name="dari" value="' + dari + '"></div><div class="field" style="margin:0"><label class="lbl">Sampai</label><input class="input" type="date" name="sampai" value="' + sampai + '"></div>' : '') +
      (S.role !== 'wali' && kelas.length ? '<div class="field" style="margin:0;min-width:150px;flex:1"><label class="lbl">Kelas</label><select class="select" name="kelas_id"><option value="">Semua kelas</option>' + kelas.map((k) => '<option value="' + esc(k.kelas_id) + '" ' + (f.kelas_id === k.kelas_id ? 'selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select></div>' : '') +
      '<button class="btn btn-primary" type="submit">' + ic('filter', 's') + ' Terapkan</button></form></div><div data-isi class="mt">' + skeleton(1, 110) + '<div class="cols even">' + skeleton(2, 220) + '</div></div></div>';
    const muat = (paksa) => swr('lap:' + dari + ':' + sampai + ':' + (f.kelas_id || ''), 'laporan', { dari, sampai, kelas_id: f.kelas_id }, (d) => laporanIsi(el, d), { fresh: paksa ? 0 : 120000, onError: (r) => (el.querySelector('[data-isi]').innerHTML = emptyState('wifi-off', 'Gagal memuat laporan', r.message)) });
    bind(el, {
      'change:preset': (s) => { f.preset = s.value; this.render(el); },
      'submit:filter': (fm) => { Object.assign(f, formData(fm)); this.render(el); }
    });
    muat();
  }
});

function laporanIsi(el, d) {
  const box = el.querySelector('[data-isi]'); if (!box) return;
  const r = d.ringkas, g = d.grafik, bk = ['bk', 'kepsek', 'admin', 'kesiswaan'].indexOf(S.role) > -1 && S.role !== 'wali';
  const tab = el._tab || 'rekap';
  const tabs = [{ k: 'rekap', l: 'Rekap Siswa', n: d.tabel.rekapSiswa.length }, { k: 'pel', l: 'Pelanggaran', n: d.tabel.pelanggaran.length }, { k: 'pres', l: 'Prestasi', n: d.tabel.prestasi.length }, { k: 'hadir', l: 'Kehadiran', n: d.tabel.kehadiran.length }]
    .concat(bk && d.tabel.kasus.length + d.tabel.layanan.length ? [{ k: 'kasus', l: 'Kasus', n: d.tabel.kasus.length }, { k: 'layanan', l: 'Layanan BK', n: d.tabel.layanan.length }] : []);
  const KOL = {
    rekap: [{ k: 'nama', l: 'Nama' }, { k: 'kelas', l: 'Kelas' }, { k: 'pelanggaran', l: 'Pelanggaran', num: 1 }, { k: 'poin', l: 'Poin', num: 1 }, { k: 'terlambat', l: 'Terlambat', num: 1 }, { k: 'prestasi', l: 'Prestasi', num: 1 }],
    pel: [{ k: 'tanggal', l: 'Tanggal' }, { k: 'nama', l: 'Nama' }, { k: 'kelas', l: 'Kelas' }, { k: 'pelanggaran', l: 'Pelanggaran' }, { k: 'poin', l: 'Poin', num: 1 }, { k: 'pencatat', l: 'Pencatat' }],
    pres: [{ k: 'tanggal', l: 'Tanggal' }, { k: 'nama', l: 'Nama' }, { k: 'kelas', l: 'Kelas' }, { k: 'prestasi', l: 'Prestasi' }, { k: 'tingkat', l: 'Tingkat' }],
    hadir: [{ k: 'tanggal', l: 'Tanggal' }, { k: 'jam', l: 'Jam' }, { k: 'nama', l: 'Nama' }, { k: 'kelas', l: 'Kelas' }, { k: 'jenis', l: 'Jenis' }, { k: 'alasan', l: 'Alasan' }],
    kasus: [{ k: 'kode', l: 'Kode' }, { k: 'tanggal', l: 'Tanggal' }, { k: 'kategori', l: 'Kategori' }, { k: 'prioritas', l: 'Prioritas' }, { k: 'status', l: 'Status' }, { k: 'penangan', l: 'Penangan' }],
    layanan: [{ k: 'tanggal', l: 'Tanggal' }, { k: 'layanan', l: 'Layanan' }, { k: 'sumber', l: 'Sumber' }, { k: 'kelas', l: 'Kelas' }, { k: 'status', l: 'Status' }]
  };
  const DATA = { rekap: d.tabel.rekapSiswa, pel: d.tabel.pelanggaran, pres: d.tabel.prestasi, hadir: d.tabel.kehadiran, kasus: d.tabel.kasus, layanan: d.tabel.layanan };
  const hal = el._hal || 1, per = 15;
  const rows = DATA[tab] || [];
  box.innerHTML = '<div class="stats">' +
    (bk ? UI.stat({ lbl: 'Layanan Konseling', v: r.layanan, ic: 'heart-handshake', c: 'indigo' }) + UI.stat({ lbl: 'Kasus Masuk', v: r.kasus, ic: 'shield-alert', c: 'rose', foot: r.kasusSelesai + ' selesai · ' + r.kasusPrioritas + ' prioritas' }) : UI.stat({ lbl: 'Siswa', v: r.siswaAktif, ic: 'users', c: 'indigo' }) + UI.stat({ lbl: 'Total Poin', v: r.poin, ic: 'gauge', c: 'rose' })) +
    UI.stat({ lbl: 'Pelanggaran', v: r.pelanggaran, ic: 'triangle-alert', c: 'orange', foot: r.terlambat + ' keterlambatan' }) + UI.stat({ lbl: 'Prestasi', v: r.prestasi, ic: 'trophy', c: 'amber' }) + '</div>' +
    '<div class="cols even mt">' +
    (bk ? '<div class="card"><h3 class="mb">Kasus per Jenis</h3>' + grafikBar(g.kasusPerJenis) + '</div>' : '<div class="card"><h3 class="mb">Pelanggaran per Kategori (periode)</h3>' + grafikBar(hitungLokal(d.tabel.pelanggaran, 'pelanggaran').slice(0, 8)) + '</div>') +
    '<div class="card"><h3 class="mb">Tren Pelanggaran per Bulan</h3>' + grafikGaris(g.trenPelanggaran, { warna: '#F43F5E' }) + '</div>' +
    '<div class="card"><h3 class="mb">' + (S.role === 'wali' ? 'Poin per Kelas' : 'Kelas dengan Poin Tertinggi') + '</h3>' + grafikBar(g.kelasTop, { persen: false, warna: '#F97316' }) + '</div>' +
    (bk ? '<div class="card"><h3 class="mb">Layanan Konseling per Bulan</h3>' + grafikBatang(g.layananPerBulan) + '</div>' : '<div class="card"><h3 class="mb">Keterlambatan & Izin</h3>' + grafikBar([{ label: 'Terlambat', nilai: r.terlambat }, { label: 'Izin keluar', nilai: r.izinKeluar }], { persen: false }) + '</div>') + '</div>' +
    (S.role === 'kepsek' ? '<div class="alert info mt">' + ic('lock') + '<div>Ringkasan tanpa identitas pelapor dan tanpa catatan rahasia konseling.</div></div>' : '') +
    '<div class="card p0 mt-l"><div class="card-head" style="flex-wrap:wrap"><h3>Tabel data</h3><div class="btns" style="flex:none"><button class="btn btn-outline btn-sm" data-act="xlsx" style="color:#047857;border-color:#A7F3D0">' + ic('file-spreadsheet', 's') + ' Unduh Excel</button><button class="btn btn-outline btn-sm" data-act="pdf" style="color:#BE123C;border-color:#FECDD3">' + ic('file-text', 's') + ' Unduh PDF</button></div></div>' +
    '<div style="padding:0 12px">' + UI.tabs(tabs, tab, 'tab') + '</div><div style="padding:8px 12px">' + UI.tabel(KOL[tab].map((c) => Object.assign({}, c, c.k === 'tanggal' ? { f: (x) => esc(tgl(x.tanggal)) } : c.k === 'status' || c.k === 'jenis' ? { f: (x) => pill(x[c.k]) } : {})), rows.slice((hal - 1) * per, hal * per)) + UI.pager(rows.length, hal, per, 'hal') + '</div></div><div style="height:24px"></div>';
  const judul = (S.role === 'wali' ? 'Rekap Kelas ' : 'Laporan BK & Kesiswaan ') + tgl(d.dari) + ' - ' + tgl(d.sampai);
  bind(el, Object.assign(el._h || {}, {
    tab: (b) => { el._tab = b.dataset.k; el._hal = 1; laporanIsi(el, d); },
    hal: (b) => { el._hal = +b.dataset.k; laporanIsi(el, d); },
    xlsx: () => { const sh = {}; tabs.forEach((t) => (sh[t.l] = (DATA[t.k] || []).map((x) => { const o = {}; KOL[t.k].forEach((c) => (o[c.l] = x[c.k])); return o; }))); eksporExcel(judul, sh); },
    pdf: () => eksporPdf(judul + ' - ' + tabs.find((t) => t.k === tab).l, KOL[tab], rows.map((x) => Object.assign({}, x, { tanggal: x.tanggal ? tgl(x.tanggal) : '' })), (S.cfg || {}).nama_sekolah)
  }));
}
function hitungLokal(rows, field) { const m = {}; rows.forEach((x) => (m[x[field]] = (m[x[field]] || 0) + 1)); return Object.keys(m).map((k) => ({ label: k, nilai: m[k] })).sort((a, b) => b.nilai - a.nilai); }

// ============================================================ PROFIL SISWA (staf)
halaman('siswa', {
  roles: ['kesiswaan', 'wali', 'admin'], title: 'Profil Siswa', nav: 'data',
  render(el, p) {
    const s = (S.boot.siswa || []).find((x) => x.nisn === p[0]);
    if (!s) { el.innerHTML = UI.ph('Profil Siswa') + '<div class="wrap">' + emptyState('user-x', 'Siswa tidak ditemukan', 'Siswa tidak ada dalam cakupan data Anda.') + '</div>'; return; }
    const b = S.boot, amb = (S.cfg || {}).ambang || [];
    const lv = levelInfo(s.level || levelKode(s.poin, amb));
    const pel = (b.pelanggaran || []).filter((x) => x.nisn === s.nisn), pres = (b.prestasi || []).filter((x) => x.nisn === s.nisn), hadir = (b.kehadiran || []).filter((x) => x.nisn === s.nisn);
    const surat = (b.surat || []).filter((x) => x.nisn === s.nisn);
    const tab = el._tab || 'pel';
    const hapusBtn = (jenis, id) => S.role === 'kesiswaan' ? '<button class="icon-btn" data-act="hapus" data-j="' + jenis + '" data-id="' + esc(id) + '" aria-label="Hapus catatan" style="color:#DC2626;width:36px;height:36px">' + ic('trash-2', 's') + '</button>' : '';
    const isi = {
      pel: pel.map((x) => '<div class="item c-orange"><span class="ic-c">' + ic('triangle-alert', 's') + '</span><div class="grow"><div class="row between"><b>' + esc(x.pelanggaran) + '</b>' + pill('+' + x.poin + ' poin', 'red') + '</div><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(x.tanggal) + (x.jam ? ', ' + x.jam : '')) + '</span><span>' + ic('user-round', 's') + esc(x.pencatat) + '</span></div>' + (x.keterangan ? '<p class="quote mt">' + esc(x.keterangan) + '</p>' : '') + (x.bukti ? '<button class="btn btn-ghost btn-sm" data-act="bukti" data-j="pelanggaran" data-id="' + esc(x.id) + '">' + ic('image', 's') + ' Lihat bukti</button>' : '') + '</div>' + hapusBtn('pelanggaran', x.id) + '</div>').join(''),
      pres: pres.map((x) => '<div class="item c-amber"><span class="ic-c">' + ic('trophy', 's') + '</span><div class="grow"><b>' + esc(x.prestasi) + '</b><div class="meta"><span>' + esc(x.tingkat) + '</span><span>' + esc(tgl(x.tanggal)) + '</span></div></div>' + hapusBtn('prestasi', x.id) + '</div>').join(''),
      hadir: hadir.map((x) => '<div class="item c-emerald"><span class="ic-c">' + ic('clock', 's') + '</span><div class="grow"><div class="row between"><b>' + esc(x.jenis) + '</b>' + pill(x.jenis) + '</div><div class="meta"><span>' + esc(tgl(x.tanggal) + ' · ' + x.jam + (x.jam_kembali ? '–' + x.jam_kembali : '')) + '</span>' + (x.alasan ? '<span>' + esc(x.alasan) + '</span>' : '') + '</div></div>' + hapusBtn('kehadiran', x.id) + '</div>').join(''),
      surat: surat.map((x) => '<div class="item click" data-go="#/surat/' + esc(x.id) + '"><span class="ic-c c-violet">' + ic('mail', 's') + '</span><div class="grow"><div class="row between">' + pillJenis(x.jenis) + pill(x.status) + '</div><div class="small muted mt">' + esc(x.pemicu) + '</div></div></div>').join('')
    };
    el.innerHTML = UI.ph(s.nama, s.kelas + ' · NISN ' + s.nisn, { back: S.role === 'wali' ? '#/beranda' : '#/data', keep: true }) + '<div class="wrap"><div class="cols mt">' +
      '<div class="stack"><div class="card"><div class="row">' + avatar(s.nama, 'l') + '<div class="grow"><h2 style="font-size:18px">' + esc(s.nama) + '</h2><div class="small muted">' + esc(s.kelas) + ' · NISN ' + esc(s.nisn) + (s.nama_ortu ? ' · Ortu: ' + esc(s.nama_ortu) : '') + '</div></div>' + pill(lv.t, lv.p, 'l') + '</div>' +
      '<div class="row between mt-l"><div><div class="xs muted b">POIN PERIODE INI</div><div style="font-family:var(--f-head);font-weight:700;font-size:34px;color:var(--' + lv.c + ')">' + s.poin + '</div></div><div class="tr small muted">' + s.terlambat + '× terlambat<br>' + pres.length + ' prestasi</div></div>' + UI.ambangBar(s.poin, amb) +
      '<div class="btns">' + (S.role !== 'admin' ? '<button class="btn btn-primary" data-go="#/catat/' + esc(s.nisn) + '">' + ic('square-pen', 's') + ' Catat</button>' : '') +
      (S.role === 'wali' ? '<button class="btn btn-outline" data-act="rujuk">' + ic('share-2', 's') + ' Rujuk ke BK</button>' : '') + (S.role === 'kesiswaan' ? '<button class="btn btn-outline" data-act="surat">' + ic('file-plus', 's') + ' Buat Surat</button>' : '') +
      (S.role === 'admin' ? '<button class="btn btn-outline" data-act="reset" data-t="siswa">' + ic('key-round', 's') + ' Reset sandi siswa</button><button class="btn btn-outline" data-act="reset" data-t="ortu">' + ic('key-round', 's') + ' Reset sandi ortu</button>' : '') + '</div></div></div>' +
      (S.role === 'admin' ? '<div class="card">' + UI.kv([['Nama orang tua', s.nama_ortu || '-'], ['No. WA orang tua', s.no_wa_ortu || '-'], ['Email orang tua', s.email_ortu || '-'], ['Sandi awal siswa', s.sandi_awal_siswa ? 'Belum diganti' : 'Sudah diganti'], ['Sandi awal ortu', s.sandi_awal_ortu ? 'Belum diganti' : 'Sudah diganti']]) + '</div>' :
        '<div>' + UI.tabs([{ k: 'pel', l: 'Pelanggaran', n: pel.length }, { k: 'pres', l: 'Prestasi', n: pres.length }, { k: 'hadir', l: 'Kehadiran', n: hadir.length }, { k: 'surat', l: 'Surat', n: surat.length }], tab, 'tab') + '<div class="list mt">' + (isi[tab] || '') + '</div>' + (!(isi[tab] || '') ? emptyState('inbox', 'Belum ada catatan', '') : '') + '</div>') +
      '</div><div style="height:24px"></div></div>';
    bind(el, {
      tab: (x) => { el._tab = x.dataset.k; this.render(el, p); },
      bukti: (x) => lihatBerkas(x.dataset.j, x.dataset.id, 0, x),
      surat: () => buatSuratModal(s.nisn),
      rujuk: () => rujukModal(s),
      reset: (x) => resetSandiModal(x.dataset.t, s.nisn, x.dataset.t === 'ortu' ? 'Orang tua ' + s.nama : s.nama),
      hapus: async (x) => {
        if (!(await konfirmasi({ title: 'Hapus catatan?', text: 'Poin siswa akan dihitung ulang. Tindakan ini tercatat di log.', ok: 'Hapus', danger: true }))) return;
        const r = await App.aksi('hapusCatatan', { jenis: x.dataset.j, id: x.dataset.id }, { btn: x });
        if (r) { const key = { pelanggaran: 'pelanggaran', prestasi: 'prestasi', kehadiran: 'kehadiran' }[x.dataset.j]; b[key] = b[key].filter((y) => y.id !== x.dataset.id); if (r.poin !== undefined) s.poin = r.poin; this.render(el, p); }
      }
    });
  }
});
