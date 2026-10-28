/* ============================================================
   SMAPATISPA NEXORA — ui.js : komponen tampilan bersama
   ============================================================ */
'use strict';

const UI = {
  /** Header halaman dalam (HP: sticky + tombol kembali; desktop: judul biasa bila keep) */
  ph(judul, sub, o = {}) {
    return '<header class="ph ' + (o.keep ? 'keep' : '') + '">' +
      (o.noBack ? '<span style="width:6px"></span>' : '<button class="icon-btn m-only" data-back="' + esc(o.back || '#/beranda') + '" aria-label="Kembali">' + ic('arrow-left') + '</button>') +
      '<div class="tt"><h1>' + esc(judul) + '</h1>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>' +
      (o.acts ? '<div class="acts">' + o.acts + '</div>' : '') + '</header>';
  },

  /** Header gradasi beranda (HP) */
  hero(o) {
    const cfg = S.cfg || {};
    const notif = (S.boot && S.boot.notif && S.boot.notif.belum) || 0;
    return '<section class="hero">' +
      '<div class="hero-top">' +
      '<button class="icon-btn" data-act-global="drawer" aria-label="Menu">' + ic('menu') + '</button>' +
      '<div class="brand">' + logoHtml(cfg) + '<div class="ell"><b class="ell">' + esc(cfg.nama_app || 'SMAPATISPA NEXORA') + '</b><small>' + esc(o.kecil || cfg.nama_sekolah || '') + '</small></div></div>' +
      '<button class="icon-btn" data-go="#/notifikasi" aria-label="Notifikasi">' + ic('bell') + (notif ? '<span class="dot-count">' + (notif > 9 ? '9+' : notif) + '</span>' : '') + '</button>' +
      '<button class="avatar s c-' + warnaDari(S.me.nama) + '" data-go="#/lainnya" aria-label="Profil">' + esc(inisial(S.me.nama)) + '</button>' +
      '</div>' +
      '<h1>' + esc(o.judul) + '</h1><p class="lead">' + esc(o.lead || '') + '</p>' + (o.isi || '') +
      '</section>' +
      (o.search === false ? '<div style="height:12px"></div>' : UI.cariPill(o.placeholder));
  },
  cariPill(ph) {
    return '<div class="search-pill m" data-search-box>' + ic('search') +
      '<input type="search" placeholder="' + esc(ph || 'Cari menu atau informasi...') + '" aria-label="Cari" data-global-search autocomplete="off">' +
      '<div class="search-results" data-search-res></div></div>';
  },

  /** Banner gradasi beranda (desktop) */
  banner(o) {
    return '<section class="banner"><div class="grow" style="position:relative;z-index:1">' + (o.tag ? '<span class="tagx">' + esc(o.tag) + '</span>' : '') +
      '<h2>' + esc(o.judul) + '</h2><p>' + esc(o.teks || '') + '</p></div>' +
      (o.minis || []).map((m) => '<div class="mini"><span>' + esc(m.l) + '</span><b>' + esc(m.v) + '</b></div>').join('') + '</section>';
  },

  sec(judul, isi, o = {}) {
    return '<section class="sec">' + (judul ? '<div class="sec-head"><h2>' + esc(judul) + (o.count !== undefined ? '<span class="count">' + o.count + '</span>' : '') + '</h2>' +
      (o.link ? '<button class="link" data-go="' + o.link[1] + '">' + esc(o.link[0]) + ' ' + ic(o.linkIc || 'chevron-right', 's') + '</button>' : (o.aksi || '')) + '</div>' : '') + isi + '</section>';
  },

  quick(items) {
    return '<div class="grid-quick">' + items.map((q) =>
      '<button class="qcard c-' + q.c + '" ' + (q.act ? 'data-act="' + q.act + '" data-k="' + esc(q.k || '') + '"' : 'data-go="' + q.go + '"') + ' aria-label="' + esc(q.t) + '">' + (q.baru ? '<span class="tag-new">BARU</span>' : '') + (q.dot ? '<span class="dot-red"></span>' : '') +
      '<span class="qi">' + ic(q.ic) + '</span><span class="qt">' + esc(q.t) + '</span><span class="qs">' + esc(q.s || '') + '</span></button>').join('') + '</div>';
  },

  stat(o) {
    return '<div class="stat c-' + (o.c || 'indigo') + '"' + (o.go ? ' data-go="' + o.go + '" style="cursor:pointer"' : '') + '><div class="top"><span class="lbl">' + esc(o.lbl) + '</span>' + (o.ic ? '<span class="ico">' + ic(o.ic) + '</span>' : (o.pill || '')) + '</div>' +
      '<div class="v">' + esc(o.v) + (o.small ? '<small>' + esc(o.small) + '</small>' : '') + '</div>' +
      (o.bar !== undefined ? '<div class="bar" style="--c:var(--c)"><i style="width:' + Math.min(100, Math.max(0, o.bar)) + '%;background:var(--c)"></i></div>' : '') +
      (o.foot ? '<div class="foot">' + o.foot + '</div>' : '') + '</div>';
  },

  agenda(o) {
    const t = tile(o.tanggal);
    return '<div class="agenda c-' + (o.c || 'indigo') + '"' + (o.go ? ' data-go="' + o.go + '"' : '') + ' role="button" tabindex="0">' +
      '<div class="datetile"><span class="m">' + t.m + '</span><span class="d">' + t.d + '</span><span class="w">' + t.w + '</span></div>' +
      '<div class="grow"><div class="row between top"><b class="ell" style="font-size:14px">' + esc(o.judul) + '</b>' + (o.pill || '') + '</div>' +
      '<div class="meta">' + (o.meta || []).filter((m) => m && m.t).map((m) => '<span>' + ic(m.ic, 's') + esc(m.t) + '</span>').join('') + '</div>' + (o.extra || '') + '</div></div>';
  },

  kv(pairs) { return '<dl class="kv">' + pairs.filter((p) => p && p[1] !== undefined && p[1] !== '').map((p) => '<dt>' + esc(p[0]) + '</dt><dd>' + (p[2] ? p[1] : esc(p[1])) + '</dd>').join('') + '</dl>'; },

  tabs(items, aktif, act) {
    return '<div class="tabs" role="tablist">' + items.map((t) => '<button role="tab" class="' + (t.k === aktif ? 'on' : '') + '" data-act="' + act + '" data-k="' + esc(t.k) + '">' + esc(t.l) + (t.n !== undefined ? '<span class="count">' + t.n + '</span>' : '') + '</button>').join('') + '</div>';
  },
  chips(items, aktif, act, scroll) {
    return '<div class="chips ' + (scroll ? 'scroll' : '') + '">' + items.map((t) => '<button class="chip ' + (t.k === aktif ? 'on' : '') + ' ' + (t.cls || '') + '" data-act="' + act + '" data-k="' + esc(t.k) + '">' + (t.ic ? ic(t.ic, 's') : '') + esc(t.l) + (t.n !== undefined ? '<span class="count">' + t.n + '</span>' : '') + (t.tag ? '<span class="tag">' + esc(t.tag) + '</span>' : '') + '</button>').join('') + '</div>';
  },
  seg(items, aktif, act) {
    return '<div class="seg">' + items.map((t) => '<button type="button" class="' + (t.k === aktif ? 'on' : '') + '" data-act="' + act + '" data-k="' + esc(t.k) + '">' + (t.ic ? ic(t.ic, 's') : '') + esc(t.l) + '</button>').join('') + '</div>';
  },

  /** Tabel responsif (HP → kartu). kolom: {k, l, num, f(row) → html, first} */
  tabel(kolom, rows, o = {}) {
    if (!rows.length) return o.kosong || emptyState('inbox', 'Belum ada data', 'Data akan tampil di sini.');
    return '<div class="table-wrap"><table class="tbl cards"><thead><tr>' + kolom.map((c) => '<th class="' + (c.num ? 'num' : '') + '">' + esc(c.l) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r) => '<tr' + (o.rowAct ? ' data-act="' + o.rowAct + '" data-id="' + esc(r[o.idKey || 'id']) + '" style="cursor:pointer"' : '') + '>' + kolom.map((c, i) => '<td data-l="' + esc(c.l) + '" class="' + (c.num ? 'num ' : '') + (i === 0 ? 'first' : '') + '">' + (c.f ? c.f(r) : esc(r[c.k] ?? '-')) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  },
  pager(total, hal, per, act) {
    const n = Math.ceil(total / per);
    if (n <= 1) return total ? '<div class="pager"><span>Menampilkan ' + total + ' data</span></div>' : '';
    const awal = (hal - 1) * per + 1, akhir = Math.min(total, hal * per);
    let btn = '';
    const tampil = new Set([1, n, hal - 1, hal, hal + 1].filter((x) => x >= 1 && x <= n));
    let prev = 0;
    [...tampil].sort((a, b) => a - b).forEach((p) => { if (p - prev > 1) btn += '<span style="padding:0 4px">…</span>'; btn += '<button class="' + (p === hal ? 'on' : '') + '" data-act="' + act + '" data-k="' + p + '">' + p + '</button>'; prev = p; });
    return '<div class="pager"><span>Menampilkan ' + awal + '–' + akhir + ' dari ' + total + '</span><div class="pg">' + btn + '</div></div>';
  },

  timeline(items) {
    return '<div class="tl">' + items.map((x, i) => '<div class="tl-item ' + (x.state || '') + '"><span class="dot">' + (x.state === 'done' ? ic('check', 's') : x.state === 'cur' ? '' : (i + 1)) + '</span><div class="box">' +
      '<div class="row between"><b>' + esc(x.judul) + '</b>' + (x.pill || '') + '</div>' + (x.waktu ? '<div class="small muted">' + esc(x.waktu) + '</div>' : '') + (x.ket ? '<div class="small" style="margin-top:2px">' + esc(x.ket) + '</div>' : '') + '</div></div>').join('') + '</div>';
  },
  stepper(langkah, cur) {
    return '<div class="stepper">' + langkah.map((l, i) => (i ? '<span class="ln"></span>' : '') + '<span class="st ' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '"><span class="n">' + (i < cur ? '✓' : i + 1) + '</span>' + esc(l) + '</span>').join('') + '</div>';
  },

  /** Bar ambang poin dengan penanda SP */
  ambangBar(poin, ambang) {
    const sp = (ambang || []).filter((a) => /^SP/.test(a.jenis));
    const maks = Math.max(100, ...sp.map((a) => a.batas + 25));
    const lv = levelInfo(levelKode(poin, ambang));
    return '<div class="thresh" style="--c:var(--' + lv.c + ')"><div class="fill" style="width:' + Math.min(100, poin / maks * 100) + '%;background:var(--' + lv.c + ')"></div>' +
      sp.map((a) => '<span class="mk" style="left:' + (a.batas / maks * 100) + '%"><span>' + esc(a.jenis) + ' · ' + a.batas + '</span></span>').join('') + '</div>';
  },

  fileRow(f, i, act) {
    return '<div class="file-row"><span class="thumb">' + (f.preview ? '<img src="' + f.preview + '" alt="">' : ic(/pdf/.test(f.mime) ? 'file-text' : /audio/.test(f.mime) ? 'mic' : 'file')) + '</span>' +
      '<div class="grow"><div class="b ell">' + esc(f.nama) + '</div><div class="xs muted">' + (f.ukuran / 1048576).toFixed(1) + ' MB · ' + ic('circle-check', 's') + ' Terlampir</div></div>' +
      '<button type="button" class="icon-btn" data-act="' + act + '" data-i="' + i + '" aria-label="Hapus lampiran" style="color:#DC2626">' + ic('trash-2') + '</button></div>';
  }
};

function levelKode(poin, ambang) {
  const sp = (ambang || []).filter((a) => /^SP/.test(a.jenis)).sort((a, b) => a.batas - b.batas);
  let idx = -1;
  sp.forEach((a, i) => { if (poin >= a.batas) idx = i; });
  return idx < 0 ? 'aman' : idx === 0 ? 'waspada' : idx === sp.length - 1 ? 'kritis' : 'peringatan';
}

// ============================================================
// PEMILIH SISWA (cari nama/NISN, dukung "terakhir dipilih")
// ============================================================
function pemilihSiswa(wadah, daftar, onPilih, o = {}) {
  const terakhirKey = ukey('siswa-terakhir');
  wadah.innerHTML = '<div class="search-in">' + ic('search', 's') + '<input class="input" type="search" placeholder="' + esc(o.ph || 'Cari nama atau NISN...') + '" autocomplete="off" aria-label="Cari siswa"></div>' +
    '<div class="chips mt" data-recent></div><div class="list mt" data-hasil style="max-height:320px;overflow:auto"></div>';
  const inp = wadah.querySelector('input'), hasil = wadah.querySelector('[data-hasil]'), recent = wadah.querySelector('[data-recent]');
  const byNisn = {}; daftar.forEach((s) => (byNisn[s.nisn] = s));
  const tampil = (list) => {
    hasil.innerHTML = list.slice(0, 30).map((s) => '<button type="button" class="item click" data-nisn="' + esc(s.nisn) + '" style="text-align:left;width:100%">' + avatar(s.nama, 's') +
      '<div class="grow"><h4 class="ell">' + esc(s.nama) + '</h4><div class="small muted">' + esc(s.kelas || '') + ' · NISN ' + esc(s.nisn) + '</div></div>' +
      (s.poin !== undefined ? pill(s.poin + ' poin', levelInfo(s.level || 'aman').p) : '') + '</button>').join('') || '<p class="muted small tc">Siswa tidak ditemukan.</p>';
  };
  const renderRecent = () => {
    const r = Store.get(terakhirKey, []).map((n) => byNisn[n]).filter(Boolean).slice(0, 6);
    recent.innerHTML = r.length ? '<span class="small muted" style="align-self:center">Terakhir:</span>' + r.map((s) => '<button type="button" class="chip" data-nisn="' + esc(s.nisn) + '">' + esc(s.nama.split(' ')[0]) + ' · ' + esc(s.kelas) + '</button>').join('') : '';
  };
  const cari = () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) { hasil.innerHTML = o.semua ? '' : ''; if (o.tampilAwal) tampil(daftar); return; }
    tampil(daftar.filter((s) => s.nama.toLowerCase().includes(q) || String(s.nisn).includes(q) || String(s.kelas || '').toLowerCase().includes(q)));
  };
  inp.addEventListener('input', debounce(cari, 120));
  wadah.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nisn]'); if (!b) return;
    const s = byNisn[b.dataset.nisn]; if (!s) return;
    Store.set(terakhirKey, [s.nisn].concat(Store.get(terakhirKey, []).filter((x) => x !== s.nisn)).slice(0, 8));
    onPilih(s);
  });
  renderRecent();
  if (o.tampilAwal) tampil(daftar);
  return { fokus: () => inp.focus() };
}

// ============================================================
// RENDER SURAT → HTML (salinan fungsi server renderSuratHtml_ agar pratinjau = PDF)
// ============================================================
function fmtTanggalSurat(t) { const d = D(t); return d ? d.getDate() + ' ' + BLN_P[d.getMonth()] + ' ' + d.getFullYear() : ''; }
function fmtTanggalJamSurat(t) { const d = D(t); if (!d) return ''; return HARI[d.getDay()] + ', ' + fmtTanggalSurat(t) + (String(t).length > 10 ? ', pukul ' + String(t).slice(11, 16) + ' WIB' : ''); }

function renderSurat(data) {
  const e = esc;
  const S0 = data.sekolah || {}, sw = data.siswa || {}, su = data.surat || {};
  const tabel = (data.pelanggaran || []).length
    ? '<table style="width:100%;border-collapse:collapse;font-size:11pt;margin:6px 0"><tr><th style="border:1px solid #444;padding:4px;text-align:left">No</th><th style="border:1px solid #444;padding:4px;text-align:left">Tanggal</th><th style="border:1px solid #444;padding:4px;text-align:left">Pelanggaran</th><th style="border:1px solid #444;padding:4px;text-align:right">Poin</th></tr>' +
      data.pelanggaran.map((p, i) => '<tr><td style="border:1px solid #444;padding:4px">' + (i + 1) + '</td><td style="border:1px solid #444;padding:4px">' + e(fmtTanggalSurat(p.tanggal)) + '</td><td style="border:1px solid #444;padding:4px">' + e(p.nama) + '</td><td style="border:1px solid #444;padding:4px;text-align:right">' + e(p.poin) + '</td></tr>').join('') +
      '<tr><td colspan="3" style="border:1px solid #444;padding:4px;text-align:right"><b>Total</b></td><td style="border:1px solid #444;padding:4px;text-align:right"><b>' + e(data.poin) + '</b></td></tr></table>'
    : '<p><i>(Tidak ada rincian pelanggaran pada periode ini.)</i></p>';
  const jadwalBlok = su.jadwal
    ? '<table style="border-collapse:collapse;font-size:11pt;margin:6px 0 6px 24px"><tr><td style="padding:2px 10px 2px 0">Hari/Tanggal</td><td>: <b>' + e(fmtTanggalJamSurat(su.jadwal).split(', pukul')[0]) + '</b></td></tr><tr><td style="padding:2px 10px 2px 0">Pukul</td><td>: <b>' + e(String(su.jadwal).slice(11, 16)) + ' WIB</b></td></tr><tr><td style="padding:2px 10px 2px 0">Tempat</td><td>: <b>' + e(su.tempat || '') + '</b></td></tr></table>'
    : '<p><i>(Jadwal pertemuan belum diisi.)</i></p>';
  const ganti = { NAMA_SISWA: e(sw.nama), NISN: e(sw.nisn), KELAS: e(sw.kelas), NAMA_ORTU: e(sw.nama_ortu || 'Orang Tua/Wali'), NOMOR: e(su.nomor || '(nomor terbit saat disetujui)'), TANGGAL: e(fmtTanggalSurat(su.tanggal)), JADWAL: e(fmtTanggalJamSurat(su.jadwal)), TEMPAT: e(su.tempat || ''), PEMICU: e(su.pemicu || ''), TOTAL_POIN: e(data.poin), CATATAN: e(su.catatan || ''), NAMA_SEKOLAH: e(S0.nama), NAMA_KEPSEK: e((data.kepsek || {}).nama || ''), KOTA: e(S0.kota || '') };
  const blok = { DAFTAR_PELANGGARAN: tabel, JADWAL_BLOK: jadwalBlok };
  let isi = String((data.tpl || {}).isi || '').split(/\n\s*\n/).map((para) => {
    const t = para.trim(); if (!t) return '';
    const m = /^\{\{(DAFTAR_PELANGGARAN|JADWAL_BLOK)\}\}$/.exec(t);
    if (m) return '@@' + m[1] + '@@';
    if (t === '{{CATATAN}}' && !su.catatan) return '';
    return '<p style="margin:0 0 10px;text-align:justify">' + e(t).replace(/\n/g, '<br>') + '</p>';
  }).join('');
  isi = isi.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in ganti ? ganti[k] : (blok[k] || ''))).replace(/@@([A-Z_]+)@@/g, (m, k) => blok[k] || '');
  const kp = data.kepsek || {}, pm = data.pemeriksa || {}, tt = data.ttd || {};
  const kolomKepsek = '<td style="width:50%;vertical-align:top;text-align:center;padding:4px">' + e(S0.kota || '') + ', ' + e(fmtTanggalSurat(su.tanggal)) + '<br>Kepala Sekolah,<br>' +
    (tt.gambar ? '<img src="' + tt.gambar + '" style="height:70px;margin:4px 0" alt="">' : (tt.qr ? '' : '<div style="height:70px"></div>')) +
    (tt.qr ? '<br><img src="' + tt.qr + '" style="width:84px;height:84px;margin:2px 0" alt="QR"><br><span style="font-size:8pt;color:#555">Ditandatangani elektronik · ' + e(tt.kode || '') + '</span>' : '') +
    '<br><b><u>' + e(kp.nama || '..............................') + '</u></b><br>NIP. ' + e(kp.nip || '-') + '</td>';
  const kolomPemeriksa = (lebar, denganTanggal) => '<td style="width:' + lebar + ';vertical-align:top;text-align:center;padding:4px">' + (denganTanggal ? e(S0.kota || '') + ', ' + e(fmtTanggalSurat(su.tanggal)) + '<br>' : '<br>') + e(pm.jabatan || 'Wakasek Kesiswaan') + ',<br>' +
    (!data.perluTtd && tt.qr ? '<img src="' + tt.qr + '" style="width:84px;height:84px;margin:4px 0" alt="QR"><br><span style="font-size:8pt;color:#555">Terverifikasi · ' + e(tt.kode || '') + '</span>' : '<div style="height:70px"></div>') +
    '<br><b><u>' + e(pm.nama || '..............................') + '</u></b></td>';
  let ttdHtml;
  if (su.jenis === 'Perjanjian') ttdHtml = '<table style="width:100%;margin-top:18px;font-size:11pt"><tr><td style="width:33%;text-align:center;vertical-align:top">Siswa,<div style="height:70px"></div><b><u>' + e(sw.nama) + '</u></b></td><td style="width:33%;text-align:center;vertical-align:top">Orang Tua/Wali,<div style="height:70px"></div><b><u>' + e(sw.nama_ortu || '..........................') + '</u></b></td>' + kolomPemeriksa('34%', false) + '</tr></table>';
  else if (data.perluTtd) ttdHtml = '<table style="width:100%;margin-top:18px;font-size:11pt"><tr>' + kolomPemeriksa('50%', false) + kolomKepsek + '</tr></table>';
  else ttdHtml = '<table style="width:100%;margin-top:18px;font-size:11pt"><tr><td style="width:50%"></td>' + kolomPemeriksa('50%', true) + '</tr></table>';
  const logo = S0.logo ? '<img src="' + S0.logo + '" style="width:72px;height:72px" alt="">' : '';
  return '<div style="font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;line-height:1.45"><table style="width:100%;border-bottom:3px double #000;padding-bottom:6px;margin-bottom:12px"><tr><td style="width:80px;vertical-align:middle">' + logo + '</td><td style="text-align:center;vertical-align:middle">' +
    (S0.kop1 ? '<div style="font-size:11pt">' + e(S0.kop1) + '</div>' : '') + '<div style="font-size:16pt;font-weight:bold;letter-spacing:.5px">' + e(S0.nama || '') + '</div>' + (S0.kop2 ? '<div style="font-size:10pt">' + e(S0.kop2) + '</div>' : '') + (S0.kop3 ? '<div style="font-size:10pt">' + e(S0.kop3) + '</div>' : '') +
    '</td><td style="width:80px"></td></tr></table><div style="text-align:center;margin-bottom:12px"><div style="font-weight:bold;text-decoration:underline;font-size:13pt">' + e((data.tpl || {}).judul || '') + '</div><div>Nomor: ' + e(su.nomor || '(nomor terbit saat disetujui)') + '</div></div>' + isi + ttdHtml + '</div>';
}

/** Susun data render dari tampilan surat (frontend) */
function dataSurat(s, o = {}) {
  const cfg = S.cfg || {};
  const tpl = (cfg.suratTpl || {})[s.jenis] || { judul: (cfg.labelSurat || {})[s.jenis] || s.jenis, isi: '' };
  const pel = s.rincian || o.pelanggaran || [];
  const ambang = (cfg.ambang || []).find((a) => a.jenis === s.jenis);
  const perluTtd = o.perluTtd !== undefined ? o.perluTtd : (s.perluTtd !== undefined ? s.perluTtd : ambang ? ambang.ttd : /^(SP3|Pemanggilan)$/.test(s.jenis));
  const url = (cfg.url_aplikasi || location.origin + location.pathname).replace(/\/?$/, '/');
  const qr = s.kode_verifikasi ? 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=' + encodeURIComponent(url + '#/verifikasi/' + s.kode_verifikasi) : '';
  return {
    tpl,
    surat: { nomor: s.nomor, jenis: s.jenis, tanggal: (s.waktu_ttd || s.waktu_kirim || s.waktu_setuju || s.dibuat || hariIni()).slice(0, 10), jadwal: o.jadwal !== undefined ? o.jadwal : s.jadwal_pertemuan, tempat: o.tempat !== undefined ? o.tempat : s.tempat, catatan: o.catatan !== undefined ? o.catatan : s.catatan, pemicu: s.pemicu },
    siswa: { nama: s.nama_siswa, nisn: s.nisn, kelas: s.kelas, nama_ortu: s.nama_ortu || o.nama_ortu || '' },
    poin: pel.reduce((a, p) => a + (+p.poin || 0), 0) || s.poin || 0,
    pelanggaran: /^(SP1|SP2|SP3|Pemanggilan)$/.test(s.jenis) ? pel : [],
    sekolah: { nama: (cfg.kop || {}).nama || cfg.nama_sekolah, kop1: (cfg.kop || {}).kop1, kop2: (cfg.kop || {}).kop2, kop3: (cfg.kop || {}).kop3, kota: (cfg.kop || {}).kota, logo: cfg.logo },
    kepsek: cfg.kepsek || {},
    pemeriksa: { nama: s.nama_pemeriksa || (o.pemeriksa || ''), jabatan: (s.nama_pemeriksa && s.jabatan_pemeriksa) || o.jabatan || s.jabatan_pemeriksa || ((s.pemeriksa || [])[0] === 'bk' ? 'Guru Bimbingan Konseling' : 'Wakasek Kesiswaan') },
    ttd: { gambar: s.metode_ttd === 'gambar' ? (S.boot && S.boot.ttdKepsek) || '' : '', qr: s.status === 'Terkirim' ? qr : '', kode: s.kode_verifikasi },
    perluTtd
  };
}
