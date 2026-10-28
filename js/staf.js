/* ============================================================
   SMAPATISPA NEXORA — staf.js
   Guru BK · Kesiswaan · Wali Kelas · Guru Piket · Kepala Sekolah
   ============================================================ */
'use strict';

const KASUS_C = { 'Baru': 'slate', 'Ditinjau': 'blue', 'Dalam Penanganan': 'violet', 'Tindak Lanjut': 'amber', 'Selesai': 'emerald' };
const URG_C = { Rendah: 'slate', Sedang: 'amber', Tinggi: 'red' };
const JENIS_CATAT = { pelanggaran: ['Pelanggaran', 'triangle-alert', 'orange'], terlambat: ['Terlambat', 'alarm-clock', 'rose'], izin_keluar: ['Izin Keluar', 'door-open', 'blue'], kehadiran: ['Kehadiran', 'calendar-check', 'emerald'], prestasi: ['Prestasi', 'trophy', 'amber'] };
const TINGKAT = ['Sekolah', 'Kecamatan', 'Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'];
const keMenit = (j) => { const [h, m] = String(j || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const jamKini = () => { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
function heroStaf(judul, lead, o = {}) { return UI.hero(Object.assign({ judul, lead, kecil: LABEL_PERAN[S.role] + ' · ' + ((S.cfg || {}).nama_sekolah || ''), placeholder: 'Cari siswa, menu, informasi...' }, o)); }

// ============================================================
// GURU BK — BERANDA
// ============================================================
halaman('beranda', {
  roles: ['bk'], title: 'Beranda Guru BK', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, hari = hariIni();
    const sesi = (b.jadwal || []).filter((s) => s.tanggal === hari && s.status === 'Terisi').sort((a, c) => (a.jam_mulai < c.jam_mulai ? -1 : 1));
    const urgent = [].concat(
      (b.pengaduan || []).filter((k) => k.status !== 'Selesai' && (k.prioritas || k.status === 'Baru')).map((k) => ({ t: k.dibuat, go: '#/kasus/' + k.id, ic: k.prioritas ? 'siren' : 'shield-alert', c: k.prioritas ? 'rose' : 'violet', j: (k.prioritas ? 'PRIORITAS · ' : '') + k.kategori, s: (k.pelapor ? k.pelapor.nama + ' · ' : 'Pelapor anonim · ') + k.kode_lacak, pl: pill(k.status) })),
      (b.rujukan || []).filter((r) => r.status === 'Menunggu').map((r) => ({ t: r.dibuat, go: '#/rujukan', ic: 'share-2', c: 'teal', j: 'Rujukan: ' + r.nama, s: r.kelas + ' · dari ' + r.nama_perujuk, pl: pill('Urgensi ' + r.urgensi, URG_C[r.urgensi]) })),
      (b.permintaan || []).filter((p) => p.status === 'Menunggu').map((p) => ({ t: p.dibuat, go: '#/permintaan/id/' + p.id, ic: 'inbox', c: 'indigo', j: p.nama + ' · ' + p.jenis_layanan, s: p.kelas + ' · ' + (p.tanggal ? tglS(p.tanggal) + ' ' + p.jam_mulai : 'belum pilih waktu'), pl: pill('Menunggu') }))
    ).sort((a, c) => (a.c === 'rose' ? -1 : c.c === 'rose' ? 1 : a.t < c.t ? 1 : -1)).slice(0, 6);
    el.innerHTML = heroStaf('Halo, ' + namaDepan(S.me.nama) + '!', (st.sesiHariIni || 0) + ' sesi hari ini · ' + (st.permintaanBaru || 0) + ' permintaan baru') +
      '<div class="wrap">' + UI.banner({ tag: 'Guru BK · ' + tglP(hari), judul: sapaan() + ', ' + S.me.nama.split(',')[0], teks: 'Kelola permintaan konseling, kasus, dan jadwal dari satu tempat. Catatan konseling tersimpan terpisah dan hanya dapat dibuka Guru BK.', minis: [{ l: 'Layanan bulan ini', v: st.layananBulanIni || 0 }, { l: 'Kasus prioritas', v: st.prioritasAktif || 0 }] }) +
      '<div class="stats mt-l">' + UI.stat({ lbl: 'Permintaan Baru', v: st.permintaanBaru || 0, ic: 'inbox', c: 'indigo', go: '#/permintaan', foot: 'Konseling & rujukan' }) + UI.stat({ lbl: 'Kasus Aktif', v: st.kasusAktif || 0, ic: 'folder-lock', c: 'rose', go: '#/kasus', foot: (st.prioritasAktif || 0) + ' prioritas' }) +
      UI.stat({ lbl: 'Sesi Hari Ini', v: st.sesiHariIni || 0, ic: 'calendar-days', c: 'blue', go: '#/jadwal' }) + UI.stat({ lbl: 'Tindak Lanjut', v: st.tindakLanjut || 0, ic: 'bell-ring', c: 'amber', foot: 'Pengingat jatuh tempo' }) + '</div>' +
      '<div class="cols"><div>' +
      UI.sec('Perlu Tindakan', urgent.length ? '<div class="list">' + urgent.map((u) => '<div class="item click c-' + u.c + '" data-go="' + u.go + '"><span class="ic-c">' + ic(u.ic, 's') + '</span><div class="grow"><div class="row between top"><h4 class="ell">' + esc(u.j) + '</h4>' + u.pl + '</div><div class="small muted ell">' + esc(u.s) + '</div><div class="xs muted" style="margin-top:2px">' + esc(relatif(u.t)) + '</div></div></div>').join('') + '</div>' : emptyState('circle-check', 'Semua beres', 'Tidak ada permintaan atau kasus yang menunggu.')) +
      UI.sec('Jadwal Hari Ini', sesi.length ? '<div class="stack s">' + sesi.map((s) => UI.agenda({ tanggal: s.tanggal, judul: s.siswa + ' · ' + s.kelas, c: 'blue', go: '#/permintaan/id/' + s.id_permintaan, pill: pill(s.status_permintaan || 'Dijadwalkan'), meta: [{ ic: 'clock', t: s.jam_mulai + '–' + s.jam_selesai }, { ic: 'heart-handshake', t: s.layanan }, { ic: 'map-pin', t: s.lokasi }] })).join('') + '</div>' : '<div class="card tc"><p class="small muted">Tidak ada sesi hari ini.</p><button class="btn btn-soft btn-sm mt" data-go="#/jadwal">' + ic('calendar-plus', 's') + ' Buka slot jadwal</button></div>', { link: ['Kalender', '#/jadwal'] }) +
      '</div><div>' +
      ((b.pengingat || []).length ? UI.sec('Pengingat Tindak Lanjut', '<div class="list">' + b.pengingat.slice(0, 5).map((c) => '<div class="item click c-amber" data-go="#/kasus/' + (c.ref_tipe === 'permintaan' ? 'p/' : '') + esc(c.ref_id) + '"><span class="ic-c">' + ic('bell-ring', 's') + '</span><div class="grow"><h4>' + esc(c.siswa) + '</h4><div class="small muted">Jatuh tempo ' + esc(tgl(c.pengingat)) + '</div></div>' + (c.pengingat <= hari ? pill('Hari ini', 'red') : '') + '</div>').join('') + '</div>') : '') +
      UI.sec('Layanan 6 Bulan', '<div class="card">' + grafikBatang((b.grafik || {}).layananPerBulan, { label: 'Layanan per bulan' }) + '</div>') +
      UI.sec('Jenis Layanan Bulan Ini', '<div class="card">' + grafikBar((b.grafik || {}).layananPerJenis) + '</div>') +
      '</div></div><div style="height:24px"></div></div>';
  }
});
// ============================================================
// GURU BK — PERMINTAAN KONSELING
// ============================================================
halaman('permintaan', {
  roles: ['bk'], title: 'Permintaan Konseling', nav: 'permintaan',
  render(el, p) {
    if (p[0] !== 'id') el._buka = '';
    if (p[0] === 'q' && el._qp !== p[1]) { el._qp = p[1]; el._q = p[1]; el._t = 'semua'; }
    const all = S.boot.permintaan || [];
    const tab = el._t || 'baru';
    const grp = { baru: (x) => x.status === 'Menunggu' || x.status === 'Dijadwal Ulang', jadwal: (x) => x.status === 'Dijadwalkan', selesai: (x) => x.status === 'Selesai', lain: (x) => x.status === 'Ditolak' || x.status === 'Dibatalkan', semua: () => true };
    const q = (el._q || '').toLowerCase();
    const list = all.filter(grp[tab]).filter((x) => !q || (x.nama + ' ' + x.kelas + ' ' + x.jenis_layanan + ' ' + x.nisn).toLowerCase().includes(q));
    el.innerHTML = UI.ph('Permintaan Konseling', all.filter(grp.baru).length + ' menunggu tindakan') + '<div class="wrap">' +
      '<div class="mt-l">' + UI.tabs([['baru', 'Perlu Diproses'], ['jadwal', 'Terjadwal'], ['selesai', 'Selesai'], ['lain', 'Ditolak/Batal'], ['semua', 'Semua']].map((t) => ({ k: t[0], l: t[1], n: all.filter(grp[t[0]]).length })), tab, 't') + '</div>' +
      '<div class="toolbar mt"><div class="search-in">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari nama, kelas, layanan..." value="' + esc(el._q || '') + '" data-input="q"></div></div>' +
      '<div class="list">' + (list.map((x) => {
        const [icn, c] = LAYANAN_IC[x.jenis_layanan] || ['heart-handshake', 'indigo'];
        return '<div class="item click" data-act="buka" data-id="' + esc(x.id) + '">' + avatar(x.nama, 's') + '<div class="grow"><div class="row between top"><h4>' + esc(x.nama) + ' <span class="muted" style="font-weight:400">· ' + esc(x.kelas) + '</span></h4>' + pill(x.status) + '</div>' +
          '<div class="meta"><span class="c-' + c + '" style="color:var(--c)">' + ic(icn, 's') + esc(x.jenis_layanan) + '</span><span>' + ic('calendar', 's') + esc(x.tanggal ? tglS(x.tanggal) + ', ' + x.jam_mulai : x.usul ? 'Usulan ' + tglS(x.usul.tanggal) + ', ' + x.usul.jam_mulai : 'Belum ada waktu') + '</span>' + (x.nama_bk ? '<span>' + ic('user-round', 's') + esc(x.nama_bk) + '</span>' : '') + '</div>' +
          (x.topik ? '<p class="small muted ell" style="margin-top:4px">“' + esc(x.topik) + '”</p>' : '') + '<div class="xs muted" style="margin-top:2px">Diajukan ' + esc(relatif(x.dibuat)) + '</div></div></div>';
      }).join('') || emptyState('inbox', 'Tidak ada permintaan', tab === 'baru' ? 'Semua permintaan sudah diproses.' : '')) + '</div><div style="height:24px"></div></div>';
    bind(el, {
      t: (b) => { el._t = b.dataset.k; this.render(el, p); },
      'input:q': debounce((i) => { el._q = i.value; this.render(el, p); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      buka: (b) => permintaanModal(b.dataset.id)
    });
    if (p[0] === 'id' && p[1] && el._buka !== p[1]) { el._buka = p[1]; setTimeout(() => permintaanModal(p[1]), 60); }
  }
});

function slotBebas() {
  const h = hariIni(), j = jamKini();
  return (S.boot.jadwal || []).filter((s) => s.status === 'Tersedia' && (s.tanggal > h || (s.tanggal === h && s.jam_mulai > j)))
    .sort((a, b) => ((a.nip_bk === S.me.nip) === (b.nip_bk === S.me.nip) ? (a.tanggal + a.jam_mulai < b.tanggal + b.jam_mulai ? -1 : 1) : a.nip_bk === S.me.nip ? -1 : 1));
}
/** Pilih slot (+ catatan). Resolve {slot_id, catatan} atau null. */
function pilihSlotModal(o) {
  return new Promise((res) => {
    const daftar = slotBebas();
    let pilih = '';
    const grup = {}; daftar.forEach((s) => (grup[s.tanggal] = grup[s.tanggal] || []).push(s));
    const m = Modal.open({
      title: o.judul || 'Pilih slot jadwal', size: 'lg',
      body: (daftar.length ? '<p class="small muted mb">Slot milik Anda ditampilkan lebih dulu.</p><div class="stack" style="max-height:46vh;overflow:auto">' + Object.keys(grup).sort().map((t) => '<div><div class="xs b muted mb-s">' + esc(tglP(t).toUpperCase()) + '</div><div class="stack s">' +
        grup[t].map((s) => '<button type="button" class="slotrow" data-act="s" data-k="' + esc(s.slot_id) + '"><span class="ck">' + ic('clock', 's') + '</span><div class="grow"><b>' + esc(s.jam_mulai + ' – ' + s.jam_selesai) + '</b><div class="small muted">' + esc(s.nama_bk + ' · ' + s.lokasi) + '</div></div>' + (s.nip_bk === S.me.nip ? pill('Slot saya', 'indigo') : '') + '</button>').join('') + '</div></div>').join('') + '</div>'
        : emptyState('calendar-x', 'Tidak ada slot kosong', 'Buka slot baru di menu Jadwal & Slot terlebih dahulu.', '<button class="btn btn-primary mt" data-act="kejadwal">' + ic('calendar-plus') + ' Buka slot</button>')) +
        (o.catatan ? '<div class="field mt-l"><label class="lbl">' + esc(o.labelCatatan || 'Catatan untuk siswa') + (o.catatan === 'wajib' ? ' <span class="req">*</span>' : ' <span class="opt">Opsional</span>') + '</label><textarea class="textarea" name="cat" maxlength="300" placeholder="' + esc(o.ph || '') + '"></textarea></div>' : ''),
      foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok" disabled>' + esc(o.ok || 'Simpan') + '</button>',
      handlers: {
        s: (b) => { pilih = b.dataset.k; m.el.querySelectorAll('.slotrow').forEach((x) => { x.classList.toggle('on', x === b); x.querySelector('.ck').innerHTML = ic(x === b ? 'check' : 'clock', 's'); }); m.el.querySelector('[data-act=ok]').disabled = false; },
        kejadwal: () => { m.close(null); go('#/jadwal'); },
        batal: () => m.close(null),
        ok: () => {
          const cat = m.el.querySelector('[name=cat]');
          if (o.catatan === 'wajib' && !cat.value.trim()) { cat.classList.add('bad'); cat.focus(); return; }
          m.close({ slot_id: pilih, catatan: cat ? cat.value.trim() : '' });
        }
      },
      onClose: (v) => res(v || null)
    });
  });
}

function permintaanModal(id) {
  const x = (S.boot.permintaan || []).find((y) => y.id === id) || (S.boot.rujukan || []).find((y) => y.id === id);
  if (!x) { toast('Permintaan tidak ditemukan atau sudah diperbarui.', 'warn'); return; }
  const st = x.status;
  const aksi = [];
  if (st === 'Menunggu' && x.slot_id) aksi.push('<button class="btn btn-primary" data-act="setujui">' + ic('check') + ' Setujui Jadwal</button>');
  if (st === 'Menunggu' || st === 'Dijadwal Ulang') aksi.push('<button class="btn ' + (x.slot_id ? 'btn-outline' : 'btn-primary') + '" data-act="pilihSlot">' + ic('calendar-check') + ' ' + (x.slot_id ? 'Ganti Slot & Setujui' : 'Pilih Slot & Setujui') + '</button>');
  if (['Menunggu', 'Dijadwalkan', 'Dijadwal Ulang'].indexOf(st) > -1) aksi.push('<button class="btn btn-outline" data-act="ulang">' + ic('calendar-clock') + ' Usulkan Jadwal Lain</button>');
  if (st === 'Dijadwalkan' || st === 'Diproses') aksi.push('<button class="btn btn-success" data-act="selesai">' + ic('circle-check') + ' Tandai Selesai</button>');
  if (['Menunggu', 'Dijadwal Ulang'].indexOf(st) > -1) aksi.push('<button class="btn btn-danger-o" data-act="tolak">' + ic('x') + ' Tolak</button>');
  const m = Modal.open({
    title: 'Permintaan konseling', size: 'lg',
    body: '<div class="row">' + avatar(x.nama) + '<div class="grow"><h3>' + esc(x.nama) + '</h3><div class="small muted">' + esc(x.kelas) + ' · NISN ' + esc(x.nisn) + '</div></div>' + pill(st, null, 'l') + '</div>' +
      '<div class="card flat mt" style="background:var(--surface-2)">' + UI.kv([['Layanan', x.jenis_layanan], ['Diajukan', tgl(x.dibuat) + ', ' + jam(x.dibuat)], ['Jadwal', x.tanggal ? tglP(x.tanggal) + ', ' + x.jam_mulai + '–' + x.jam_selesai : '-'], ['Lokasi', x.lokasi || '-'], ['Guru BK', x.nama_bk || '-'], ['Usulan', x.usul ? tglP(x.usul.tanggal) + ', ' + x.usul.jam_mulai + ' (menunggu siswa)' : '']]) + '</div>' +
      (x.topik ? '<div class="mt"><div class="xs b muted mb-s">TOPIK DARI SISWA</div><p class="quote">' + esc(x.topik) + '</p></div>' : '') +
      (x.catatan_bk ? '<div class="alert info mt">' + ic('message-square') + '<div><b>Catatan terakhir</b><br>' + esc(x.catatan_bk) + '</div></div>' : '') +
      '<button class="btn btn-dark btn-block mt-l" data-act="rahasia">' + ic('lock') + ' Buka Catatan Konseling Rahasia</button>',
    foot: aksi.length ? '<div class="btns" style="width:100%;justify-content:flex-end">' + aksi.join('') + '</div>' : '<button class="btn btn-outline" data-act="tutup">Tutup</button>',
    handlers: {
      tutup: () => m.close(),
      rahasia: () => { m.close(); go('#/kasus/p/' + x.id); },
      setujui: async (b) => { const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'setujui' }, { btn: b }); if (r) { x.status = 'Dijadwalkan'; m.close(); App.renderUlang(); } },
      pilihSlot: async () => {
        const v = await pilihSlotModal({ judul: 'Setujui dengan slot', catatan: true, ok: 'Setujui & Jadwalkan' }); if (!v) return;
        const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'setujui', slot_id: v.slot_id, catatan: v.catatan }, { btn: m.el.querySelector('[data-act=pilihSlot]') });
        if (r) { tandaiSlot(v.slot_id, x); x.status = 'Dijadwalkan'; m.close(); App.renderUlang(); }
      },
      ulang: async () => {
        const v = await pilihSlotModal({ judul: 'Usulkan jadwal lain', catatan: 'wajib', labelCatatan: 'Alasan penjadwalan ulang', ph: 'Contoh: Ada rapat guru pada jam tersebut', ok: 'Kirim Usulan' }); if (!v) return;
        const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'jadwalUlang', slot_id: v.slot_id, catatan: v.catatan }, { btn: m.el.querySelector('[data-act=ulang]') });
        if (r) { tandaiSlot(v.slot_id, x); x.status = 'Dijadwal Ulang'; m.close(); App.renderUlang(); }
      },
      selesai: async (b) => { const t = await mintaTeks({ title: 'Tandai sesi selesai', label: 'Catatan singkat untuk riwayat (bukan catatan rahasia)', ok: 'Tandai Selesai' }); if (t === null) return; const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'selesai', catatan: t }, { btn: b }); if (r) { x.status = 'Selesai'; m.close(); App.renderUlang(); } },
      tolak: async (b) => { const t = await mintaTeks({ title: 'Tolak permintaan', label: 'Alasan (dikirim ke siswa)', required: true, ok: 'Tolak', danger: true }); if (!t) return; const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'tolak', catatan: t }, { btn: b }); if (r) { x.status = 'Ditolak'; m.close(); App.renderUlang(); } }
    }
  });
}
function tandaiSlot(slotId, x) { const s = (S.boot.jadwal || []).find((y) => y.slot_id === slotId); if (s) Object.assign(s, { status: 'Terisi', id_permintaan: x.id, siswa: x.nama, kelas: x.kelas, layanan: x.jenis_layanan }); }

// ============================================================
// GURU BK — KASUS (kanban) & DETAIL + CATATAN RAHASIA
// ============================================================
halaman('kasus', {
  roles: ['bk'], title: (p) => (p && p[0] ? 'Detail Kasus' : 'Kelola Kasus Siswa'), nav: 'kasus', live: true,
  render(el, p) {
    if (p[0]) return kasusDetail(el, p[0] === 'p' ? 'permintaan' : 'pengaduan', p[0] === 'p' ? p[1] : p[0]);
    const all = S.boot.pengaduan || [];
    const urut = (S.cfg || {}).statusKasus || Object.keys(KASUS_C);
    const f = el._f || { st: 'aktif', kat: '', prio: false, q: '' };
    el._f = f;
    const q = f.q.toLowerCase();
    const cocok = (k) => (!f.kat || k.kategori === f.kat) && (!f.prio || k.prioritas) && (!q || (k.kode_lacak + ' ' + k.kategori + ' ' + (k.pelapor ? k.pelapor.nama : '') + ' ' + (k.pihak || '')).toLowerCase().includes(q));
    const vis = all.filter(cocok);
    const kartu = (k) => '<div class="kcard ' + (k.prioritas ? 'prio' : '') + '" data-go="#/kasus/' + esc(k.id) + '" role="button" tabindex="0"><div class="row between"><span class="mono xs muted">' + esc(k.kode_lacak) + '</span>' + (k.prioritas ? pill('PRIORITAS', 'red') : '') + '</div>' +
      '<b class="small" style="display:block;margin-top:6px">' + esc(k.kategori) + '</b><div class="xs muted" style="margin-top:4px">' + (k.pelapor ? esc(k.pelapor.nama + ' · ' + k.pelapor.kelas) : ic('venetian-mask', 's') + ' ' + esc(k.mode === 'Anonim' ? 'Anonim' : 'Identitas ' + String(k.mode).toLowerCase())) + '</div>' +
      '<div class="row between" style="margin-top:8px"><span class="xs muted">' + ic('clock', 's') + ' ' + esc(relatif(k.dibuat)) + '</span>' + (k.nama_bk ? '<span class="avatar xs c-' + warnaDari(k.nama_bk) + '" title="' + esc(k.nama_bk) + '">' + esc(inisial(k.nama_bk)) + '</span>' : '') + '</div>' + (k.dirujuk ? '<div class="xs" style="margin-top:6px;color:var(--primary)">' + ic('share-2', 's') + ' Dirujuk ke Kesiswaan</div>' : '') + '</div>';
    const filter = '<div class="toolbar mt-l" style="flex-wrap:wrap"><div class="search-in" style="flex:1;min-width:200px">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari kode, kategori, nama..." value="' + esc(f.q) + '" data-input="q"></div>' +
      '<select class="select" data-change="kat" style="max-width:240px" aria-label="Kategori"><option value="">Semua kategori</option>' + ((S.cfg || {}).kategoriAduan || []).map((k) => '<option ' + (f.kat === k ? 'selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
      '<button class="chip ' + (f.prio ? 'on danger' : '') + '" data-act="prio">' + ic('siren', 's') + ' Prioritas</button></div>';
    el.innerHTML = UI.ph('Kelola Kasus Siswa', all.filter((k) => k.status !== 'Selesai').length + ' kasus aktif') + '<div class="wrap">' +
      '<div class="alert info mt-l d-only">' + ic('lock') + '<div>Detail kasus & catatan konseling hanya dapat dibuka Guru BK. Setiap akses tercatat di log kerahasiaan.</div></div>' + filter +
      '<div class="d-only"><div class="kanban">' + urut.map((s) => { const isi = vis.filter((k) => k.status === s); return '<div class="kcol c-' + KASUS_C[s] + '"><div class="kcol-h"><span class="d"></span>' + esc(s) + '<span class="count" style="margin-left:auto">' + isi.length + '</span></div>' + (isi.length ? isi.map(kartu).join('') : '<p class="xs muted tc" style="padding:20px 0">Kosong</p>') + '</div>'; }).join('') + '</div></div>' +
      '<div class="m-only"><div class="mt">' + UI.chips([{ k: 'aktif', l: 'Aktif', n: vis.filter((k) => k.status !== 'Selesai').length }].concat(urut.map((s) => ({ k: s, l: s, n: vis.filter((k) => k.status === s).length }))), f.st, 'st', true) + '</div>' +
      '<div class="stack s mt">' + (vis.filter((k) => (f.st === 'aktif' ? k.status !== 'Selesai' : k.status === f.st)).map((k) => kartu(k)).join('') || emptyState('folder-check', 'Tidak ada kasus', '')) + '</div></div>' +
      '<div style="height:24px"></div></div>';
    bind(el, {
      'input:q': debounce((i) => { f.q = i.value; this.render(el, p); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      'change:kat': (s) => { f.kat = s.value; this.render(el, p); },
      prio: () => { f.prio = !f.prio; this.render(el, p); },
      st: (b) => { f.st = b.dataset.k; this.render(el, p); }
    });
  }
});

/** Detail kasus: diambil langsung dari server & disimpan di memori saja (tidak di penyimpanan perangkat). */
const _rahasia = {};
function kasusDetail(el, tipe, id) {
  const key = tipe + ':' + id;
  const d = _rahasia[key];
  if (!d) {
    el.innerHTML = UI.ph('Detail Kasus', '', { back: '#/kasus' }) + '<div class="wrap"><div class="cols mt-l"><div>' + skeleton(1, 220) + skeleton(1, 160) + '</div><div>' + skeleton(1, 320) + '</div></div></div>';
    if (el._memuat !== key) {
      el._memuat = key;
      api('kasusDetail', { tipe, id }).then((r) => {
        el._memuat = '';
        if (!r.success) { el.innerHTML = UI.ph('Detail Kasus', '', { back: '#/kasus' }) + '<div class="wrap">' + emptyState('shield-x', 'Tidak dapat membuka kasus', r.message) + '</div>'; return; }
        _rahasia[key] = r.data;
        if (S.current && S.current.el === el) kasusDetail(el, tipe, id);
      });
    }
    return;
  }
  const k = d.kasus, cat = d.catatan || [];
  const urut = (S.cfg || {}).statusKasus || Object.keys(KASUS_C);
  const peng = tipe === 'pengaduan';
  const ed = el._ed && el._ed.key === key ? el._ed : (el._ed = { key, id: '', buka: !cat.length, draft: null });
  const fLama = el.querySelector('[data-form=catatan]');
  if (fLama && ed.buka) ed.draft = Object.assign({ _id: ed.id }, formData(fLama));     // jaga ketikan saat tampilan disegarkan
  const fSt = el.querySelector('[data-form=status]');
  if (fSt && adaIsian(fSt) && !ed.lepasStatus) ed.statusDraft = formData(fSt);
  ed.lepasStatus = false;
  const edit = Object.assign({}, ed.id ? cat.find((c) => c.id === ed.id) || {} : {}, ed.draft && ed.draft._id === ed.id ? ed.draft : {});
  const infoKiri = peng
    ? '<div class="card"><div class="row between"><span class="mono small muted">' + esc(k.kode_lacak) + '</span><div class="row" style="gap:6px">' + (k.prioritas ? pill('PRIORITAS', 'red') : '') + pill(k.status) + '</div></div>' +
      '<h2 class="mt" style="font-size:19px">' + esc(k.kategori) + '</h2><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(k.dibuat) + ', ' + jam(k.dibuat)) + '</span><span>' + ic('user-round', 's') + esc(k.peran_pelapor) + '</span><span>' + ic('eye', 's') + 'Identitas ' + esc(String(k.mode).toLowerCase()) + '</span></div>' +
      '<div class="divider"></div>' + (k.pelapor ? '<div class="row">' + avatar(k.pelapor.nama, 's') + '<div class="grow"><b>' + esc(k.pelapor.nama) + '</b><div class="small muted">' + esc(k.pelapor.kelas) + ' · NISN ' + esc(k.pelapor.nisn) + '</div></div></div>' : '<div class="row"><span class="avatar s c-slate">' + ic('venetian-mask', 's') + '</span><div><b>Pelapor anonim</b><div class="small muted">Identitas tidak disimpan oleh sistem</div></div></div>') +
      (k.pihak ? '<div class="mt"><div class="xs b muted mb-s">PIHAK TERLIBAT</div><p class="small">' + esc(k.pihak) + '</p></div>' : '') +
      '<div class="mt"><div class="xs b muted mb-s">KRONOLOGI</div><p class="quote" style="font-style:normal;white-space:pre-line">' + esc(k.kronologi) + '</p></div>' +
      (k.bukti ? '<div class="btns mt">' + Array.from({ length: k.bukti }, (_, i) => '<button class="btn btn-outline btn-sm" data-act="bukti" data-i="' + i + '">' + ic('paperclip', 's') + ' Bukti ' + (i + 1) + '</button>').join('') + '</div>' : '') + '</div>' +
      '<div class="card"><h3 class="mb">Status penanganan</h3>' + UI.stepper(urut, urut.indexOf(k.status)) +
      '<form data-form="status" class="mt"><div class="grid2"><div class="field"><label class="lbl">Ubah status</label><select class="select" name="status">' + urut.map((s) => '<option ' + (s === k.status ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div><div class="field"><label class="lbl">Keterangan publik <span class="opt">Terlihat pelapor</span></label><input class="input" name="ket" maxlength="200" placeholder="Mis. Penjadwalan mediasi"></div></div><button class="btn btn-primary btn-sm" type="submit">' + ic('save', 's') + ' Simpan Status</button></form>' +
      '<div class="divider"></div><div class="xs b muted mb">RIWAYAT (TERLIHAT DI HALAMAN LACAK)</div>' + UI.timeline(k.riwayat.slice().reverse().map((r, i) => ({ judul: r.status, waktu: tgl(r.waktu) + ', ' + jam(r.waktu), ket: r.ket, state: i === 0 ? 'cur' : 'done' }))) + '</div>' +
      '<div class="card c-blue"><div class="row between"><h3>Rujukan ke Kesiswaan</h3>' + (k.dirujuk ? pill('Sudah dirujuk', 'green') : '') + '</div><p class="small muted mt">Untuk kasus kedisiplinan. Hanya ringkasan yang dikirim — catatan rahasia tidak ikut.</p>' +
      (k.dirujuk ? '<p class="quote mt">' + esc(k.ringkasan_rujukan) + '</p>' : '<button class="btn btn-soft btn-sm mt" data-act="rujukK">' + ic('share-2', 's') + ' Rujuk ke Kesiswaan</button>') + '</div>'
    : '<div class="card"><div class="row">' + avatar(k.nama) + '<div class="grow"><h2 style="font-size:18px">' + esc(k.nama) + '</h2><div class="small muted">' + esc(k.kelas) + ' · NISN ' + esc(k.nisn) + '</div></div>' + pill(k.status) + '</div>' +
      '<div class="card flat mt" style="background:var(--surface-2)">' + UI.kv([['Layanan', k.jenis_layanan], ['Sumber', k.sumber === 'rujukan' ? 'Rujukan ' + (k.nama_perujuk || 'wali kelas') : 'Pengajuan siswa'], ['Jadwal', k.tanggal ? tglP(k.tanggal) + ', ' + k.jam_mulai : '-'], ['Guru BK', k.nama_bk || '-']]) + '</div>' + (k.topik ? '<div class="mt"><div class="xs b muted mb-s">' + (k.sumber === 'rujukan' ? 'ALASAN RUJUKAN' : 'TOPIK DARI SISWA') + '</div><p class="quote">' + esc(k.topik) + '</p></div>' : '') +
      '<button class="btn btn-outline btn-sm mt" data-act="perm">' + ic('external-link', 's') + ' Kelola permintaan</button></div>';
  const fld = (n, l, v, rows, ph) => '<div class="field"><label class="lbl">' + l + '</label><textarea class="textarea" name="' + n + '" rows="' + (rows || 3) + '" maxlength="5000" placeholder="' + esc(ph || '') + '">' + esc(v || '') + '</textarea></div>';
  const panel = '<section><div class="conf-head">' + ic('lock') + '<div class="grow"><b>Catatan Konseling Rahasia</b><div class="xs" style="opacity:.75">Hanya Guru BK · setiap akses tercatat</div></div>' + pill(cat.length + ' sesi', 'dark') + '</div><div class="conf-body">' +
    (cat.length ? '<div class="stack s">' + cat.slice().reverse().map((c) => '<div class="card tight"><div class="row between"><b>Sesi ke-' + c.sesi_ke + '</b><span class="xs muted">' + esc(tgl(c.tanggal)) + ' · ' + esc(c.nama_bk) + '</span></div>' +
      [['Ringkasan masalah', c.ringkasan_masalah], ['Analisis', c.analisis], ['Tindak lanjut', c.tindak_lanjut], ['Rencana berikutnya', c.rencana_berikutnya]].filter((x) => x[1]).map((x) => '<div class="mt"><div class="xs b muted">' + x[0].toUpperCase() + '</div><p class="small" style="white-space:pre-line;color:var(--text-2)">' + esc(x[1]) + '</p></div>').join('') +
      '<div class="row between mt">' + (c.pengingat ? '<span class="pill p-amber">' + ic('bell-ring', 's') + ' ' + esc(tgl(c.pengingat)) + '</span>' : '<span></span>') + '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + esc(c.id) + '">' + ic('pencil', 's') + ' Ubah</button></div></div>').join('') + '</div>' : '<p class="small muted tc" style="padding:10px 0">Belum ada catatan sesi.</p>') +
    (ed.buka ? '<form data-form="catatan" class="card mt" style="border:1.5px solid var(--border)"><h3 class="mb">' + (ed.id ? 'Ubah catatan sesi ke-' + edit.sesi_ke : 'Catatan sesi ke-' + (cat.length + 1)) + '</h3>' +
      fld('ringkasan_masalah', 'Ringkasan masalah', edit.ringkasan_masalah, 3, 'Apa yang disampaikan siswa?') + fld('analisis', 'Analisis / asesmen', edit.analisis, 3) + fld('tindak_lanjut', 'Tindak lanjut', edit.tindak_lanjut, 2) + fld('rencana_berikutnya', 'Rencana sesi berikutnya', edit.rencana_berikutnya, 2) +
      '<div class="field"><label class="lbl">Pengingat tindak lanjut <span class="opt">Opsional</span></label><input class="input" type="date" name="pengingat" value="' + esc(edit.pengingat || '') + '"></div>' +
      '<div class="btns"><button class="btn btn-dark" type="submit">' + ic('lock', 's') + ' Simpan Catatan Rahasia</button>' + (cat.length ? '<button type="button" class="btn btn-ghost" data-act="tutupF">Batal</button>' : '') + '</div></form>' : '<button class="btn btn-dark btn-block mt" data-act="baru">' + ic('plus') + ' Tambah catatan sesi</button>') +
    '</div></section>';
  el.innerHTML = UI.ph(peng ? 'Detail Kasus' : 'Catatan Konseling', peng ? k.kode_lacak : k.nama, { back: peng ? '#/kasus' : '#/permintaan' }) + '<div class="wrap"><div class="row between mt-l d-only"><button class="btn btn-ghost" data-back="' + (peng ? '#/kasus' : '#/permintaan') + '">' + ic('arrow-left') + ' Kembali</button><button class="btn btn-ghost btn-sm" data-act="muat">' + ic('refresh-cw', 's') + ' Muat ulang</button></div>' +
    '<div class="cols mt"><div class="stack">' + infoKiri + '</div><div>' + panel + '</div></div><div style="height:24px"></div></div>';
  if (ed.statusDraft) { const f2 = el.querySelector('[data-form=status]'); if (f2) { f2.status.value = ed.statusDraft.status; f2.ket.value = ed.statusDraft.ket || ''; } }
  bind(el, {
    muat: () => { delete _rahasia[key]; kasusDetail(el, tipe, id); },
    bukti: (b) => lihatBerkas('pengaduan', id, +b.dataset.i, b),
    perm: () => (k.sumber === 'rujukan' ? go('#/rujukan') : go('#/permintaan/id/' + id)),
    baru: () => { ed.buka = true; ed.id = ''; ed.draft = null; kasusDetail(el, tipe, id); },
    edit: (b) => { ed.buka = true; ed.id = b.dataset.id; ed.draft = null; el.querySelector('[data-form=catatan]') && el.querySelector('[data-form=catatan]').remove(); kasusDetail(el, tipe, id); setTimeout(() => { const f = el.querySelector('[data-form=catatan]'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50); },
    tutupF: () => { ed.buka = false; ed.id = ''; ed.draft = null; kasusDetail(el, tipe, id); },
    'submit:status': async (f) => {
      const v = formData(f);
      const r = await App.aksi('kasusStatus', { id, status: v.status, ket: v.ket }, { btn: f.querySelector('[type=submit]') });
      if (r) { ed.statusDraft = null; ed.lepasStatus = true; _rahasia[key].kasus = r; const g = (S.boot.pengaduan || []).find((x) => x.id === id); if (g) Object.assign(g, { status: r.status, riwayat: r.riwayat, nama_bk: r.nama_bk }); kasusDetail(el, tipe, id); }
    },
    'submit:catatan': async (f) => {
      const v = formData(f);
      const r = await App.aksi('catatanSimpan', Object.assign({ ref_tipe: tipe, ref_id: id, id: ed.id }, v), { btn: f.querySelector('[type=submit]'), segarkan: false });
      if (!r) return;
      ed.buka = false; ed.id = ''; ed.draft = null;
      const rr = await api('kasusDetail', { tipe, id });
      if (rr.success) _rahasia[key] = rr.data;
      kasusDetail(el, tipe, id);
      if (v.pengingat) App.muatBoot(true);
    },
    rujukK: async () => {
      const t = await mintaTeks({ title: 'Rujuk ke Kesiswaan', label: 'Ringkasan untuk Kesiswaan (tanpa detail rahasia)', required: true, max: 600, ok: 'Kirim Rujukan', placeholder: 'Mis. Laporan siswa merokok di belakang kantin pada jam istirahat.' });
      if (!t) return;
      const r = await App.aksi('rujukKesiswaan', { id, ringkasan: t });
      if (r) { k.dirujuk = true; k.ringkasan_rujukan = t; kasusDetail(el, tipe, id); }
    }
  });
}

// ============================================================
// GURU BK — JADWAL & SLOT (kalender pekan)
// ============================================================
halaman('jadwal', {
  roles: ['bk'], title: 'Jadwal & Slot', nav: 'jadwal',
  render(el) {
    const st = el._s = el._s || { w: 0, milik: true, hari: '' };
    const hari = hariIni(), kini = jamKini();
    const d0 = D(hari); const senin = tambahHari(hari, -((d0.getDay() + 6) % 7) + st.w * 7);
    const hariMinggu = Array.from({ length: 6 }, (_, i) => tambahHari(senin, i));
    if (!st.hari || hariMinggu.indexOf(st.hari) < 0) st.hari = hariMinggu.indexOf(hari) > -1 ? hari : hariMinggu[0];
    const semua = (S.boot.jadwal || []).filter((s) => (!st.milik || s.nip_bk === S.me.nip) && s.status !== 'Ditutup');
    const lewat = (s) => s.tanggal < hari || (s.tanggal === hari && s.jam_selesai <= kini);
    const H0 = 7, H1 = 16, PX = 56;
    const blok = (s) => {
      const top = (keMenit(s.jam_mulai) - H0 * 60) * PX / 60, h = Math.max(28, (keMenit(s.jam_selesai) - keMenit(s.jam_mulai)) * PX / 60 - 3);
      const cls = lewat(s) ? 'past' : s.status === 'Tersedia' ? 'free' : 'busy';
      return '<div class="slot-b ' + cls + '" style="top:' + top + 'px;height:' + h + 'px" data-act="slot" data-id="' + esc(s.slot_id) + '" role="button" tabindex="0" title="' + esc(s.jam_mulai + '–' + s.jam_selesai) + '"><b>' + esc(s.jam_mulai) + '</b> ' + (s.status === 'Tersedia' ? 'Tersedia' : esc(s.siswa || 'Terisi')) + (h > 40 ? '<div class="ell" style="opacity:.8">' + esc(s.status === 'Tersedia' ? (st.milik ? s.lokasi : s.nama_bk) : s.layanan) + '</div>' : '') + '</div>';
    };
    const minggu = '<div class="week"><div class="wh"></div>' + hariMinggu.map((t) => '<div class="wh ' + (t === hari ? 'today' : '') + '">' + HARI_S[D(t).getDay()] + ' ' + D(t).getDate() + '</div>').join('') +
      '<div class="wtime" style="height:' + (H1 - H0) * PX + 'px">' + Array.from({ length: H1 - H0 }, (_, i) => '<span style="position:absolute;right:6px;top:' + (i * PX + 2) + 'px">' + pad2(H0 + i) + ':00</span>').join('') + '</div>' +
      hariMinggu.map((t) => '<div class="wcol" style="height:' + (H1 - H0) * PX + 'px;background-image:repeating-linear-gradient(to bottom,transparent 0 ' + (PX - 1) + 'px,var(--border-soft) ' + (PX - 1) + 'px ' + PX + 'px);' + (t === hari ? 'background-color:var(--primary-soft)' : '') + '">' + semua.filter((s) => s.tanggal === t).map(blok).join('') + '</div>').join('') + '</div>';
    const daftarHari = semua.filter((s) => s.tanggal === st.hari).sort((a, b) => (a.jam_mulai < b.jam_mulai ? -1 : 1));
    const mobile = '<div class="daychips mt">' + hariMinggu.map((t) => { const n = semua.filter((s) => s.tanggal === t).length; const d = D(t); return '<button class="daychip ' + (t === st.hari ? 'on' : '') + '" data-act="hari" data-k="' + t + '"><div class="w">' + HARI_S[d.getDay()] + '</div><div class="d">' + d.getDate() + '</div><div class="m">' + (n ? n + ' slot' : '—') + '</div></button>'; }).join('') + '</div>' +
      '<div class="stack s mt">' + (daftarHari.map((s) => '<button class="slotrow ' + (lewat(s) ? 'taken' : '') + '" data-act="slot" data-id="' + esc(s.slot_id) + '" style="' + (lewat(s) ? 'cursor:pointer' : '') + '"><span class="ck" style="' + (s.status === 'Terisi' ? 'background:var(--primary-soft);color:var(--primary)' : 'background:#ECFDF5;color:#059669') + '">' + ic(s.status === 'Terisi' ? 'user-round' : 'clock', 's') + '</span><div class="grow"><b>' + esc(s.jam_mulai + ' – ' + s.jam_selesai) + '</b><div class="small muted ell">' + esc(s.status === 'Terisi' ? (s.siswa || 'Terisi') + ' · ' + (s.layanan || '') : 'Tersedia · ' + s.lokasi) + (st.milik ? '' : ' · ' + esc(s.nama_bk)) + '</div></div>' + pill(s.status) + '</button>').join('') || emptyState('calendar-x', 'Tidak ada slot', 'Buka slot agar siswa dapat memilih waktu.')) + '</div>';
    const n = semua.filter((s) => hariMinggu.indexOf(s.tanggal) > -1);
    el.innerHTML = UI.ph('Jadwal & Slot', tgl(hariMinggu[0]) + ' – ' + tgl(hariMinggu[5]), { acts: '<button class="btn btn-primary btn-sm" data-act="tambah">' + ic('plus', 's') + ' Slot</button>' }) + '<div class="wrap">' +
      '<div class="toolbar mt-l" style="flex-wrap:wrap"><div class="row" style="gap:6px"><button class="icon-btn" data-act="w" data-k="-1" aria-label="Pekan sebelumnya" style="border:1.5px solid var(--border)">' + ic('chevron-left') + '</button><button class="btn btn-outline btn-sm" data-act="w" data-k="0">Pekan ini</button><button class="icon-btn" data-act="w" data-k="1" aria-label="Pekan berikutnya" style="border:1.5px solid var(--border)">' + ic('chevron-right') + '</button></div>' +
      '<b class="d-only">' + esc(tgl(hariMinggu[0]) + ' – ' + tgl(hariMinggu[5])) + '</b><div class="grow"></div>' + UI.seg([{ k: 'milik', l: 'Slot saya' }, { k: 'semua', l: 'Semua Guru BK' }], st.milik ? 'milik' : 'semua', 'milik') +
      '<button class="btn btn-primary d-only" data-act="tambah">' + ic('calendar-plus') + ' Buka Slot</button></div>' +
      '<div class="row wrap gap-s small muted mb"><span>' + n.filter((s) => s.status === 'Tersedia').length + ' tersedia</span>·<span>' + n.filter((s) => s.status === 'Terisi').length + ' terisi</span><span class="grow"></span><span class="legend"><span style="--c:#10B981"><i></i>Tersedia</span><span style="--c:var(--primary)"><i></i>Terisi</span><span style="--c:#94A3B8"><i></i>Lewat</span></span></div>' +
      '<div class="d-only">' + minggu + '</div><div class="m-only">' + mobile + '</div>' +
      '<div class="lockline mt">' + ic('eye-off', 's') + ' Siswa hanya melihat status "Terisi" tanpa nama siswa lain.</div><div style="height:24px"></div></div>';
    bind(el, {
      w: (b) => { st.w = b.dataset.k === '0' ? 0 : st.w + Number(b.dataset.k); st.hari = ''; this.render(el); },
      milik: (b) => { st.milik = b.dataset.k === 'milik'; this.render(el); },
      hari: (b) => { st.hari = b.dataset.k; this.render(el); },
      tambah: () => slotBaruModal(st.hari > hari ? st.hari : hari, () => this.render(el)),
      slot: (b) => slotModal(b.dataset.id, () => this.render(el))
    });
  }
});

function slotBaruModal(tanggal, selesai) {
  const m = Modal.open({
    title: 'Buka slot konseling',
    body: '<form data-form="slot"><div class="field"><label class="lbl">Tanggal</label><input class="input" type="date" name="tanggal" required min="' + hariIni() + '" value="' + esc(tanggal) + '"></div>' +
      '<div class="grid2"><div class="field"><label class="lbl">Jam mulai</label><input class="input" type="time" name="jam_mulai" required value="09:00" step="300"></div><div class="field"><label class="lbl">Jam selesai</label><input class="input" type="time" name="jam_selesai" required value="09:45" step="300"></div></div>' +
      '<div class="chips mb">' + [30, 45, 60, 90].map((n) => '<button type="button" class="chip" data-act="dur" data-k="' + n + '">' + n + ' menit</button>').join('') + '</div>' +
      '<div class="field"><label class="lbl">Lokasi</label><input class="input" name="lokasi" maxlength="60" value="' + esc((S.cfg || {}).lokasi_bk || 'Ruang BK') + '"></div>' +
      '<div class="field"><label class="lbl">Ulangi setiap pekan</label><select class="select" name="ulang_minggu"><option value="0">Tidak diulang</option>' + [1, 2, 3, 4, 6, 8, 12].map((n) => '<option value="' + n + '">' + (n + 1) + ' pekan berturut-turut</option>').join('') + '</select><span class="help">Slot yang bertabrakan dengan jadwal Anda otomatis dilewati.</span></div></form>',
    foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="simpan">' + ic('calendar-plus') + ' Buka Slot</button>',
    handlers: {
      batal: () => m.close(),
      dur: (b) => { const f = m.el.querySelector('form'); const mul = keMenit(f.jam_mulai.value) + Number(b.dataset.k); f.jam_selesai.value = pad2(Math.floor(mul / 60) % 24) + ':' + pad2(mul % 60); },
      simpan: async (b) => {
        const v = formData(m.el.querySelector('form'));
        if (!v.tanggal || !v.jam_mulai || !v.jam_selesai) { toast('Lengkapi tanggal dan jam.', 'warn'); return; }
        if (v.jam_selesai <= v.jam_mulai) { toast('Jam selesai harus setelah jam mulai.', 'warn'); return; }
        const r = await App.aksi('slotSimpan', v, { btn: b });
        if (r) { (S.boot.jadwal = S.boot.jadwal || []).push(...r.slots.map((s) => Object.assign({ siswa: '', kelas: '', layanan: '' }, s))); m.close(); selesai && selesai(); }
      }
    }
  });
}
function slotModal(id, selesai) {
  const s = (S.boot.jadwal || []).find((x) => x.slot_id === id);
  if (!s) return;
  const milik = s.nip_bk === S.me.nip, bebas = s.status === 'Tersedia';
  const m = Modal.open({
    title: bebas ? 'Slot tersedia' : 'Sesi terjadwal',
    body: UI.kv([['Tanggal', tglP(s.tanggal)], ['Waktu', s.jam_mulai + ' – ' + s.jam_selesai + ' WIB'], ['Lokasi', s.lokasi], ['Guru BK', s.nama_bk], ['Siswa', bebas ? '' : (s.siswa || '-') + (s.kelas ? ' · ' + s.kelas : '')], ['Layanan', s.layanan || ''], ['Status', bebas ? 'Tersedia' : s.status_permintaan || 'Terisi']]),
    foot: (bebas ? (milik && s.tanggal >= hariIni() ? '<button class="btn btn-danger-o" data-act="hapus">' + ic('trash-2', 's') + ' Hapus slot</button>' : '') : '<button class="btn btn-primary" data-act="buka">' + ic('external-link', 's') + ' Buka permintaan</button>') + '<button class="btn btn-outline" data-act="tutup">Tutup</button>',
    handlers: {
      tutup: () => m.close(),
      buka: () => { m.close(); if (s.id_permintaan) { if ((S.boot.rujukan || []).some((r) => r.id === s.id_permintaan)) go('#/rujukan'); else go('#/permintaan/id/' + s.id_permintaan); } },
      hapus: async (b) => {
        const r = await App.aksi('slotHapus', { slot_id: id }, { btn: b });
        if (r) { S.boot.jadwal = S.boot.jadwal.filter((x) => x.slot_id !== id); m.close(); selesai && selesai(); }
      }
    }
  });
}

// ============================================================
// RUJUKAN WALI ↔ BK (dua sisi)
// ============================================================
function chatHtml(pesan) {
  return '<div class="chat" data-chat>' + (pesan.length ? pesan.map((m) => '<div class="bubble ' + (m.nip === S.me.nip ? 'me' : '') + '"><div class="who">' + esc(m.dari) + ' · ' + esc(tglS(m.waktu) + ' ' + jam(m.waktu)) + '</div>' + esc(m.isi) + '</div>').join('') : '<p class="xs muted tc">Belum ada pesan koordinasi.</p>') + '</div>' +
    '<form data-form="pesan" class="row mt"><input class="input grow" name="isi" maxlength="1000" placeholder="Tulis pesan koordinasi..." autocomplete="off" aria-label="Pesan"><button class="btn btn-primary" type="submit" aria-label="Kirim">' + ic('send', 's') + '</button></form>';
}
function rujukanModal(id) {
  const x = (S.boot.rujukan || []).find((y) => y.id === id);
  if (!x) return;
  const bk = S.role === 'bk';
  const aksi = !bk ? '' : [
    x.status === 'Menunggu' ? '<button class="btn btn-outline" data-act="proses">' + ic('check', 's') + ' Terima & Proses</button>' : '',
    ['Menunggu', 'Diproses', 'Dijadwal Ulang'].indexOf(x.status) > -1 ? '<button class="btn btn-primary" data-act="jadwal">' + ic('calendar-check', 's') + ' Jadwalkan</button>' : '',
    ['Diproses', 'Dijadwalkan'].indexOf(x.status) > -1 ? '<button class="btn btn-success" data-act="selesai">' + ic('circle-check', 's') + ' Selesai</button>' : ''
  ].join('');
  const isi = () => '<div class="row">' + avatar(x.nama) + '<div class="grow"><h3>' + esc(x.nama) + '</h3><div class="small muted">' + esc(x.kelas) + ' · dirujuk ' + esc(relatif(x.dibuat)) + '</div></div>' + pill(x.status) + '</div>' +
    '<div class="card flat mt" style="background:var(--surface-2)">' + UI.kv([['Perujuk', x.nama_perujuk], ['Urgensi', x.urgensi], ['Layanan', x.jenis_layanan], ['Guru BK', x.nama_bk || 'Belum ditangani'], ['Jadwal', x.tanggal ? tglP(x.tanggal) + ', ' + x.jam_mulai : '']]) + '</div>' +
    '<div class="mt"><div class="xs b muted mb-s">ALASAN RUJUKAN</div><p class="quote">' + esc(x.topik) + '</p></div>' +
    '<div class="card mt c-teal" style="border:1.5px solid var(--tb)"><div class="row between"><b>' + ic('file-text', 's') + ' Ringkasan tindak lanjut untuk wali</b>' + (bk ? '<button class="btn btn-ghost btn-sm" data-act="ringkas">' + ic('pencil', 's') + ' ' + (x.ringkasan_wali ? 'Ubah' : 'Tulis') + '</button>' : '') + '</div><p class="small mt" style="color:var(--text-2);white-space:pre-line">' + esc(x.ringkasan_wali || (bk ? 'Belum dibagikan. Tulis ringkasan umum tanpa detail rahasia.' : 'Guru BK belum membagikan ringkasan.')) + '</p></div>' +
    '<div class="mt-l"><div class="xs b muted mb-s">KOORDINASI</div>' + chatHtml(x.pesan || []) + '</div>' +
    (bk ? '<button class="btn btn-dark btn-block mt" data-act="rahasia">' + ic('lock', 's') + ' Catatan Konseling Rahasia</button>' : '<div class="lockline mt">' + ic('lock', 's') + ' Catatan konseling Guru BK bersifat rahasia dan tidak dibagikan.</div>');
  const m = Modal.open({
    title: 'Rujukan siswa', size: 'lg', body: isi(),
    foot: aksi ? '<div class="btns" style="width:100%;justify-content:flex-end">' + aksi + '</div>' : '<button class="btn btn-outline" data-act="tutup">Tutup</button>',
    onMount: (b) => { const c = b.querySelector('[data-chat]'); if (c) c.scrollTop = c.scrollHeight; },
    handlers: {
      tutup: () => m.close(),
      rahasia: () => { m.close(); go('#/kasus/p/' + x.id); },
      'submit:pesan': async (f) => {
        const t = f.isi.value.trim(); if (!t) return;
        const sementara = { waktu: new Date().toISOString().slice(0, 16).replace('T', ' '), dari: S.me.nama, nip: S.me.nip, isi: t };
        (x.pesan = x.pesan || []).push(sementara);
        m.el.querySelector('.sheet-body').innerHTML = isi();
        const c = m.el.querySelector('[data-chat]'); c.scrollTop = c.scrollHeight;
        const r = await api('rujukanPesan', { id_permintaan: x.id, isi: t });
        if (!r.success) { x.pesan = x.pesan.filter((p) => p !== sementara); m.el.querySelector('.sheet-body').innerHTML = isi(); toast(r.message, 'error'); }
      },
      ringkas: async () => { const t = await mintaTeks({ title: 'Ringkasan untuk wali kelas', label: 'Ringkasan umum (tanpa detail rahasia)', max: 1000, value: x.ringkasan_wali || '', ok: 'Bagikan' }); if (t === null) return; const r = await App.aksi('rujukanRingkasan', { id: x.id, ringkasan: t }); if (r) { x.ringkasan_wali = t; m.el.querySelector('.sheet-body').innerHTML = isi(); } },
      proses: async (b) => { const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'proses' }, { btn: b }); if (r) { x.status = 'Diproses'; m.close(); App.renderUlang(); } },
      jadwal: async () => { const v = await pilihSlotModal({ judul: 'Jadwalkan sesi rujukan', ok: 'Jadwalkan' }); if (!v) return; const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'setujui', slot_id: v.slot_id }); if (r) { tandaiSlot(v.slot_id, x); x.status = 'Dijadwalkan'; m.close(); App.renderUlang(); } },
      selesai: async (b) => { const r = await App.aksi('prosesPermintaan', { id: x.id, aksi: 'selesai' }, { btn: b }); if (r) { x.status = 'Selesai'; m.close(); App.renderUlang(); } }
    }
  });
}
halaman('rujukan', {
  roles: ['bk', 'wali'], title: (p) => (S.role === 'wali' ? 'Rujukan ke Guru BK' : 'Rujukan Wali Kelas'), nav: 'rujukan',
  render(el) {
    const all = S.boot.rujukan || [];
    const wali = S.role === 'wali';
    const tab = el._t || 'aktif';
    const grp = { aktif: (r) => ['Selesai', 'Ditolak', 'Dibatalkan'].indexOf(r.status) < 0, selesai: (r) => r.status === 'Selesai', semua: () => true };
    const list = all.filter(grp[tab]);
    el.innerHTML = UI.ph(wali ? 'Rujukan ke Guru BK' : 'Rujukan Wali Kelas', all.filter(grp.aktif).length + ' aktif', { acts: wali ? '<button class="btn btn-primary btn-sm" data-act="baru">' + ic('plus', 's') + ' Rujuk</button>' : '' }) + '<div class="wrap" style="max-width:960px">' +
      '<div class="row between mt-l d-only"><p class="muted">' + (wali ? 'Rujuk siswa yang membutuhkan pendampingan Guru BK dan pantau tindak lanjutnya.' : 'Rujukan dari wali kelas. Koordinasikan tanpa membagikan catatan rahasia.') + '</p>' + (wali ? '<button class="btn btn-primary" data-act="baru">' + ic('share-2') + ' Rujuk Siswa</button>' : '') + '</div>' +
      '<div class="mt">' + UI.tabs([{ k: 'aktif', l: 'Aktif', n: all.filter(grp.aktif).length }, { k: 'selesai', l: 'Selesai', n: all.filter(grp.selesai).length }, { k: 'semua', l: 'Semua', n: all.length }], tab, 't') + '</div>' +
      '<div class="list mt">' + (list.map((r) => '<div class="item click" data-act="buka" data-id="' + esc(r.id) + '">' + avatar(r.nama, 's') + '<div class="grow"><div class="row between top"><h4>' + esc(r.nama) + ' <span class="muted" style="font-weight:400">· ' + esc(r.kelas) + '</span></h4>' + pill(r.status) + '</div>' +
        '<p class="small ell" style="color:var(--text-2);margin-top:2px">' + esc(r.topik) + '</p><div class="meta">' + pill('Urgensi ' + r.urgensi, URG_C[r.urgensi]) + '<span>' + ic(wali ? 'headset' : 'user-round', 's') + esc(wali ? (r.nama_bk || 'Menunggu Guru BK') : r.nama_perujuk) + '</span>' + (r.tanggal ? '<span>' + ic('calendar', 's') + esc(tglS(r.tanggal) + ', ' + r.jam_mulai) + '</span>' : '') + ((r.pesan || []).length ? '<span>' + ic('message-circle', 's') + r.pesan.length + '</span>' : '') + '</div>' +
        (r.ringkasan_wali ? '<div class="xs" style="margin-top:4px;color:#0F766E">' + ic('file-text', 's') + ' Ringkasan tindak lanjut tersedia</div>' : '') + '</div></div>').join('') ||
        emptyState('share-2', 'Belum ada rujukan', wali ? 'Rujuk siswa yang perlu pendampingan khusus.' : '', wali ? '<button class="btn btn-primary mt" data-act="baru">' + ic('plus') + ' Rujuk Siswa</button>' : '')) + '</div><div style="height:24px"></div></div>';
    bind(el, { t: (b) => { el._t = b.dataset.k; this.render(el); }, buka: (b) => rujukanModal(b.dataset.id), baru: () => rujukModal() });
  }
});
function rujukModal(siswa) {
  let pilih = siswa || null;
  let urg = 'Sedang';
  const daftar = (S.boot.siswa || []);
  const m = Modal.open({
    title: 'Rujuk siswa ke Guru BK', size: 'lg',
    body: '<div data-pilih></div><form data-form="rj" class="mt" ' + (pilih ? '' : 'hidden') + '><div data-siswa></div>' +
      '<div class="field mt"><label class="lbl">Jenis layanan</label><select class="select" name="jenis_layanan">' + ((S.cfg || {}).layanan || []).map((l) => '<option>' + esc(l) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="lbl">Urgensi</label><div data-urg></div></div>' +
      '<div class="field"><label class="lbl">Alasan rujukan <span class="req">*</span></label><textarea class="textarea" name="alasan" maxlength="800" rows="4" placeholder="Perubahan perilaku yang diamati, sejak kapan, dan upaya yang sudah dilakukan."></textarea></div></form>',
    foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="kirim">' + ic('send', 's') + ' Kirim Rujukan</button>',
    onMount(b, mm) {
      const segar = () => {
        b.querySelector('[data-form=rj]').hidden = !pilih; b.querySelector('[data-pilih]').hidden = !!pilih;
        if (pilih) b.querySelector('[data-siswa]').innerHTML = '<div class="item">' + avatar(pilih.nama, 's') + '<div class="grow"><b>' + esc(pilih.nama) + '</b><div class="small muted">' + esc(pilih.kelas) + ' · ' + pilih.poin + ' poin</div></div><button type="button" class="btn btn-ghost btn-sm" data-act="ganti">Ganti</button></div>';
        b.querySelector('[data-urg]').innerHTML = UI.seg([{ k: 'Rendah', l: 'Rendah' }, { k: 'Sedang', l: 'Sedang' }, { k: 'Tinggi', l: 'Tinggi' }], urg, 'urg');
      };
      mm._segar = segar;
      pemilihSiswa(b.querySelector('[data-pilih]'), daftar, (s) => { pilih = s; segar(); }, { tampilAwal: true, ph: 'Cari siswa di kelas Anda...' });
      segar();
    },
    handlers: {
      batal: () => m.close(),
      ganti: () => { pilih = null; m._segar(); },
      urg: (b) => { urg = b.dataset.k; m._segar(); },
      kirim: async (b) => {
        if (!pilih) { toast('Pilih siswa terlebih dahulu.', 'warn'); return; }
        const v = formData(m.el.querySelector('form'));
        if (v.alasan.length < 10) { toast('Tuliskan alasan rujukan (minimal 10 karakter).', 'warn'); return; }
        const r = await App.aksi('rujuk', { nisn: pilih.nisn, jenis_layanan: v.jenis_layanan, urgensi: urg, alasan: v.alasan }, { btn: b });
        if (r) { (S.boot.rujukan = S.boot.rujukan || []).unshift({ id: r.id, dibuat: new Date().toISOString().slice(0, 16).replace('T', ' '), nisn: pilih.nisn, nama: pilih.nama, kelas: pilih.kelas, jenis_layanan: v.jenis_layanan, topik: v.alasan, urgensi: urg, status: 'Menunggu', nama_perujuk: S.me.nama, pesan: [] }); m.close(); if (S.current && S.current.name === 'rujukan') App.renderUlang(); else go('#/rujukan'); }
      }
    }
  });
}

// ============================================================
// GURU BK — BANK INSTRUMEN
// ============================================================
const JENIS_INSTRUMEN = ['Asesmen', 'Angket', 'Format Laporan', 'Modul/RPL', 'Lainnya'];
function ikonBerkas(mime) { return /pdf/.test(mime) ? ['file-text', 'rose'] : /sheet|excel|csv/.test(mime) ? ['file-spreadsheet', 'emerald'] : /word|document/.test(mime) ? ['file-type', 'blue'] : /image/.test(mime) ? ['image', 'violet'] : ['file', 'slate']; }
halaman('instrumen', {
  roles: ['bk'], title: 'Bank Instrumen BK', nav: 'instrumen',
  render(el) {
    const all = S.boot.instrumen || [];
    const f = el._f || ''; const q = (el._q || '').toLowerCase();
    const list = all.filter((x) => (!f || x.jenis === f) && (!q || (x.judul + ' ' + x.label + ' ' + x.nama_file).toLowerCase().includes(q)));
    el.innerHTML = UI.ph('Bank Instrumen BK', all.length + ' dokumen', { acts: '<button class="btn btn-primary btn-sm" data-act="unggah">' + ic('upload', 's') + ' Unggah</button>' }) + '<div class="wrap">' +
      '<div class="toolbar mt-l"><div class="search-in" style="flex:1">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari judul atau label..." value="' + esc(el._q || '') + '" data-input="q"></div><button class="btn btn-primary d-only" data-act="unggah">' + ic('upload') + ' Unggah Instrumen</button></div>' +
      UI.chips([{ k: '', l: 'Semua', n: all.length }].concat(JENIS_INSTRUMEN.map((j) => ({ k: j, l: j, n: all.filter((x) => x.jenis === j).length }))), f, 'f', true) +
      '<div class="grid-quick mt" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' + (list.map((x) => {
        const [icn, c] = ikonBerkas(x.mime);
        return '<div class="card c-' + c + '"><div class="row top"><span class="avatar s" style="background:var(--t);color:var(--c);border-radius:12px">' + ic(icn, 's') + '</span><div class="grow" style="min-width:0"><b class="ell" style="display:block">' + esc(x.judul) + '</b><div class="xs muted ell">' + esc(x.nama_file) + ' · ' + (x.ukuran / 1048576).toFixed(1) + ' MB</div></div></div>' +
          '<div class="row wrap gap-s mt">' + pill(x.jenis, 'indigo') + (x.label ? x.label.split(',').map((l) => pill(l.trim(), 'slate')).join('') : '') + '</div><div class="xs muted mt">' + esc(x.pengunggah) + ' · ' + esc(tgl(x.tanggal)) + '</div>' +
          '<div class="btns mt"><button class="btn btn-soft btn-sm" data-act="dl" data-id="' + esc(x.id) + '">' + ic('download', 's') + ' Unduh</button><button class="btn btn-ghost btn-sm" data-act="hapus" data-id="' + esc(x.id) + '" style="color:#DC2626">' + ic('trash-2', 's') + '</button></div></div>';
      }).join('') || '<div style="grid-column:1/-1">' + emptyState('folder-open', 'Belum ada instrumen', 'Unggah angket, format asesmen, atau modul layanan agar mudah dipakai ulang.') + '</div>') + '</div><div style="height:24px"></div></div>';
    bind(el, {
      f: (b) => { el._f = b.dataset.k; this.render(el); },
      'input:q': debounce((i) => { el._q = i.value; this.render(el); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      dl: (b) => unduhBerkas('instrumen', b.dataset.id, b),
      hapus: async (b) => { if (!(await konfirmasi({ title: 'Hapus instrumen?', text: 'Berkas akan dipindahkan ke tempat sampah Drive.', ok: 'Hapus', danger: true }))) return; const r = await App.aksi('instrumenHapus', { id: b.dataset.id }, { btn: b }); if (r) { S.boot.instrumen = all.filter((x) => x.id !== b.dataset.id); this.render(el); } },
      unggah: () => {
        let berkas = null;
        const m = Modal.open({
          title: 'Unggah instrumen',
          body: '<form><div class="field"><label class="lbl">Judul <span class="req">*</span></label><input class="input" name="judul" maxlength="150" required placeholder="Mis. Angket Kebutuhan Peserta Didik"></div><div class="grid2"><div class="field"><label class="lbl">Jenis</label><select class="select" name="jenis">' + JENIS_INSTRUMEN.map((j) => '<option>' + j + '</option>').join('') + '</select></div><div class="field"><label class="lbl">Label <span class="opt">pisahkan koma</span></label><input class="input" name="label" maxlength="120" placeholder="Kelas X, Karier"></div></div>' +
            '<label class="drop"><input type="file" data-change="f" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"><span class="ic">' + ic('upload') + '</span><b>Pilih berkas</b><span class="xs">PDF, Word, Excel, PowerPoint, gambar · maks. 10 MB</span></label><div data-f class="mt"></div></form>',
          foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">' + ic('upload', 's') + ' Unggah</button>',
          handlers: {
            batal: () => m.close(),
            'change:f': async (i) => { try { berkas = await bacaBerkas(i.files[0], { maxMB: 10, dim: 2000 }); m.el.querySelector('[data-f]').innerHTML = UI.fileRow(berkas, 0, 'hapusF'); } catch (e) { toast(e.message, 'error'); } },
            hapusF: () => { berkas = null; m.el.querySelector('[data-f]').innerHTML = ''; },
            ok: async (b) => {
              const v = formData(m.el.querySelector('form'));
              if (!v.judul || !berkas) { toast('Isi judul dan pilih berkas.', 'warn'); return; }
              const r = await App.aksi('instrumenUnggah', Object.assign(v, { berkas: { nama: berkas.nama, mime: berkas.mime, data: berkas.data } }), { btn: b, teks: 'Mengunggah...' });
              if (r) { (S.boot.instrumen = S.boot.instrumen || []).unshift(r); m.close(); this.render(el); }
            }
          }
        });
      }
    });
  }
});

// ============================================================
// GURU BK — KELOLA PUSAT INFORMASI
// ============================================================
halaman('kelola-info', {
  roles: ['bk'], title: 'Pusat Informasi & FAQ', nav: 'kelola-info',
  render(el) {
    const all = S.boot.infoSemua || [];
    const f = el._f || '';
    const kats = [...new Set(['Karier & Kuliah', 'Kesehatan Mental', 'Anti-Perundungan', 'Layanan BK', 'FAQ'].concat(all.map((a) => a.kategori)))];
    const list = all.filter((a) => !f || a.kategori === f);
    el.innerHTML = UI.ph('Pusat Informasi & FAQ', all.filter((a) => a.terbit).length + ' terbit · ' + all.filter((a) => !a.terbit).length + ' draf', { acts: '<button class="btn btn-primary btn-sm" data-act="baru">' + ic('plus', 's') + ' Tulis</button>' }) + '<div class="wrap">' +
      '<div class="row between mt-l"><div class="grow">' + UI.chips([{ k: '', l: 'Semua', n: all.length }].concat(kats.map((k) => ({ k, l: k, n: all.filter((a) => a.kategori === k).length }))), f, 'f', true) + '</div><button class="btn btn-primary d-only" data-act="baru">' + ic('pencil') + ' Tulis Artikel</button></div>' +
      '<div class="list mt">' + (list.map((a) => { const [icn, c] = KAT_IC[a.kategori] || ['book-open', 'indigo']; return '<div class="item"><span class="ic-c c-' + c + '">' + ic(icn, 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(a.judul) + '</h4><div class="row" style="gap:6px">' + (a.unggulan ? pill('Unggulan', 'violet') : '') + pill(a.terbit ? 'Terbit' : 'Draf', a.terbit ? 'green' : 'slate') + '</div></div><div class="meta"><span>' + esc(a.kategori) + '</span><span>' + esc(tgl(a.tanggal)) + '</span><span>' + esc(a.penulis) + '</span>' + (a.lampiran ? '<span>' + ic('paperclip', 's') + 'Lampiran</span>' : '') + '</div>' + (a.ringkasan ? '<p class="small muted ell" style="margin-top:4px">' + esc(a.ringkasan) + '</p>' : '') + '</div>' +
        '<div class="row" style="gap:2px"><button class="icon-btn" data-act="edit" data-id="' + esc(a.id) + '" aria-label="Ubah">' + ic('pencil', 's') + '</button><button class="icon-btn" data-act="hapus" data-id="' + esc(a.id) + '" aria-label="Hapus" style="color:#DC2626">' + ic('trash-2', 's') + '</button></div></div>'; }).join('') || emptyState('book-open', 'Belum ada artikel', 'Tulis panduan karier, kesehatan mental, atau FAQ untuk siswa.')) + '</div><div style="height:24px"></div></div>';
    const editor = (a) => {
      a = a || { kategori: f || 'Karier & Kuliah', terbit: true };
      let lampiran = null, hapusL = false;
      const m = Modal.open({
        title: a.id ? 'Ubah artikel' : 'Tulis artikel baru', size: 'lg',
        body: '<form><div class="grid2"><div class="field"><label class="lbl">Kategori</label><input class="input" name="kategori" list="dl-kat" maxlength="40" value="' + esc(a.kategori) + '"><datalist id="dl-kat">' + kats.map((k) => '<option value="' + esc(k) + '">').join('') + '</datalist></div><div class="field"><label class="lbl">Judul <span class="req">*</span></label><input class="input" name="judul" maxlength="150" value="' + esc(a.judul || '') + '"></div></div>' +
          '<div class="field"><label class="lbl">Ringkasan <span class="opt">tampil di daftar</span></label><input class="input" name="ringkasan" maxlength="300" value="' + esc(a.ringkasan || '') + '"></div>' +
          '<div class="field"><label class="lbl">Isi artikel <span class="req">*</span></label><textarea class="textarea" name="isi" rows="10" maxlength="20000" placeholder="Pisahkan paragraf dengan baris kosong.">' + esc(a.isi || '') + '</textarea></div>' +
          '<div class="field"><label class="lbl">Lampiran <span class="opt">PDF/dokumen · maks. 10 MB</span></label><div data-l>' + (a.lampiran ? '<div class="file-row"><span class="thumb">' + ic('paperclip') + '</span><div class="grow b ell">' + esc(a.lampiran_nama || 'Lampiran') + '</div><button type="button" class="icon-btn" data-act="hapusL" aria-label="Hapus lampiran" style="color:#DC2626">' + ic('trash-2', 's') + '</button></div>' : '<label class="drop" style="padding:12px"><input type="file" data-change="lamp"><b class="small">' + ic('paperclip', 's') + ' Pilih berkas lampiran</b></label>') + '</div></div>' +
          '<div class="row between mt"><label class="row" style="gap:10px"><span class="toggle"><input type="checkbox" name="terbit" ' + (a.terbit ? 'checked' : '') + '><i></i></span><span class="small b">Terbitkan</span></label><label class="row" style="gap:10px"><span class="toggle"><input type="checkbox" name="unggulan" ' + (a.unggulan ? 'checked' : '') + '><i></i></span><span class="small b">Jadikan pengumuman unggulan</span></label></div></form>',
        foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">' + ic('save', 's') + ' Simpan</button>',
        handlers: {
          batal: () => m.close(),
          'change:lamp': async (i) => { try { lampiran = await bacaBerkas(i.files[0], { maxMB: 10 }); m.el.querySelector('[data-l]').innerHTML = UI.fileRow(lampiran, 0, 'hapusL'); } catch (e) { toast(e.message, 'error'); } },
          hapusL: () => { lampiran = null; hapusL = true; m.el.querySelector('[data-l]').innerHTML = '<label class="drop" style="padding:12px"><input type="file" data-change="lamp"><b class="small">' + ic('paperclip', 's') + ' Pilih berkas lampiran</b></label>'; },
          ok: async (b) => {
            const v = formData(m.el.querySelector('form'));
            if (!v.judul || !v.isi || !v.kategori) { toast('Isi kategori, judul, dan isi artikel.', 'warn'); return; }
            const r = await App.aksi('infoSimpan', Object.assign(v, { id: a.id || '', hapus_lampiran: hapusL && !lampiran, lampiran: lampiran ? { nama: lampiran.nama, mime: lampiran.mime, data: lampiran.data } : null }), { btn: b });
            if (r) m.close();
          }
        }
      });
    };
    bind(el, {
      f: (b) => { el._f = b.dataset.k; this.render(el); },
      baru: () => editor(null),
      edit: (b) => editor(all.find((a) => a.id === b.dataset.id)),
      hapus: async (b) => { if (!(await konfirmasi({ title: 'Hapus artikel?', text: 'Artikel tidak lagi tampil untuk siswa dan orang tua.', ok: 'Hapus', danger: true }))) return; const r = await App.aksi('infoHapus', { id: b.dataset.id }, { btn: b }); if (r) { S.boot.infoSemua = all.filter((a) => a.id !== b.dataset.id); this.render(el); } }
    });
  }
});

// ============================================================
// KESISWAAN — BERANDA
// ============================================================
function catatPreset(j) { Store.set(ukey('catat-jenis'), j); go('#/catat'); }
halaman('beranda', {
  roles: ['kesiswaan'], title: 'Beranda Kesiswaan', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, g = b.grafik || {}, amb = (S.cfg || {}).ambang || [];
    const perhatian = (b.siswa || []).filter((s) => s.level !== 'aman').sort((a, c) => c.poin - a.poin).slice(0, 6);
    const terbaru = (b.pelanggaran || []).slice(0, 6);
    el.innerHTML = heroStaf('Halo, ' + namaDepan(S.me.nama) + '!', (st.pelanggaranHariIni || 0) + ' pelanggaran · ' + (st.terlambatHariIni || 0) + ' terlambat hari ini') +
      '<div class="wrap">' + UI.banner({ tag: 'Kesiswaan · ' + tglP(hariIni()), judul: sapaan() + ', ' + S.me.nama.split(',')[0], teks: 'Catat kedisiplinan dalam 3 ketukan. Draf surat dibuat otomatis saat poin siswa melewati ambang.', minis: [{ l: 'Surat menunggu', v: st.suratMenunggu || 0 }, { l: 'Prestasi bulan ini', v: st.prestasiBulanIni || 0 }] }) +
      '<div class="stats mt-l">' + UI.stat({ lbl: 'Pelanggaran Hari Ini', v: st.pelanggaranHariIni || 0, ic: 'triangle-alert', c: 'orange', go: '#/data' }) + UI.stat({ lbl: 'Terlambat Hari Ini', v: st.terlambatHariIni || 0, ic: 'alarm-clock', c: 'rose', go: '#/data' }) +
      UI.stat({ lbl: 'Surat Menunggu', v: st.suratMenunggu || 0, ic: 'mail', c: 'violet', go: '#/surat', foot: 'Perlu diperiksa' }) + UI.stat({ lbl: 'Siswa Poin ≥ 50', v: st.siswaPoinTinggi || 0, ic: 'gauge', c: 'amber', go: '#/data' }) + '</div>' +
      UI.sec('Catat Cepat', UI.quick([
        { ic: 'triangle-alert', t: 'Pelanggaran', s: 'Pilih siswa', c: 'orange', act: 'preset', k: 'pelanggaran' }, { ic: 'alarm-clock', t: 'Terlambat', s: 'Jam otomatis', c: 'rose', act: 'preset', k: 'terlambat' },
        { ic: 'door-open', t: 'Izin Keluar', s: 'Dengan alasan', c: 'blue', act: 'preset', k: 'izin_keluar' }, { ic: 'calendar-check', t: 'Kehadiran', s: 'Sakit/izin/alpa', c: 'emerald', act: 'preset', k: 'kehadiran' },
        { ic: 'trophy', t: 'Prestasi', s: 'Apresiasi', c: 'amber', act: 'preset', k: 'prestasi' }, { ic: 'file-plus', t: 'Buat Surat', s: 'Manual', c: 'violet', act: 'suratBaru' }
      ])) +
      '<div class="cols"><div>' +
      UI.sec('Siswa Perlu Perhatian', perhatian.length ? '<div class="list">' + perhatian.map((s) => { const lv = levelInfo(s.level); return '<div class="item click c-' + lv.c + '" data-go="#/siswa/' + esc(s.nisn) + '">' + avatar(s.nama, 's') + '<div class="grow"><div class="row between"><h4>' + esc(s.nama) + '</h4>' + pill(s.poin + ' poin', lv.p) + '</div><div class="small muted">' + esc(s.kelas) + ' · ' + s.terlambat + '× terlambat</div>' + UI.ambangBar(s.poin, amb).replace('class="thresh"', 'class="thresh" style="margin:8px 0 2px"') + '</div></div>'; }).join('') + '</div>' : emptyState('circle-check', 'Semua siswa aman', 'Belum ada siswa yang melewati ambang.'), { link: ['Semua', '#/data'] }) +
      UI.sec('Catatan Terbaru', terbaru.length ? '<div class="list">' + terbaru.map((p) => '<div class="item click" data-go="#/siswa/' + esc(p.nisn) + '"><span class="ic-c c-orange">' + ic('triangle-alert', 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(p.nama) + ' <span class="muted" style="font-weight:400">· ' + esc(p.kelas) + '</span></h4>' + pill('+' + p.poin, 'red') + '</div><div class="small muted ell">' + esc(p.pelanggaran) + '</div><div class="xs muted">' + esc(relatif(p.tanggal + ' ' + (p.jam || '12:00'))) + ' · ' + esc(p.pencatat) + '</div></div></div>').join('') + '</div>' : emptyState('inbox', 'Belum ada catatan', '')) +
      '</div><div>' +
      UI.sec('Tren Pelanggaran', '<div class="card">' + grafikGaris(g.trenBulanan, { warna: '#F97316' }) + '</div>') +
      UI.sec('Per Kategori (semester)', '<div class="card">' + grafikBar(g.perKategori) + '</div>') +
      UI.sec('Kelas dengan Poin Tertinggi', '<div class="card">' + grafikBar(g.kelasTop, { persen: false, warna: '#F43F5E', maks: 6 }) + '</div>') +
      '</div></div><div style="height:24px"></div></div>';
    bind(el, { preset: (x) => catatPreset(x.dataset.k), suratBaru: () => buatSuratModal() });
  }
});

// ============================================================
// CATAT CEPAT (Kesiswaan · Wali · Piket) — optimistic UI
// ============================================================
S.catatLog = [];
const muatUlangLambat = debounce(() => App.muatBoot(true), 3500);
function jenisBoleh() { return Object.keys(JENIS_CATAT).filter((j) => !(S.role === 'piket' && j === 'prestasi')); }

halaman('catat', {
  roles: ['kesiswaan', 'wali', 'piket'], title: 'Catat Cepat', nav: 'catat', live: false,
  render(el, p) {
    if (p[0]) return catatForm(el, p[0]);
    let jenis = Store.get(ukey('catat-jenis'), 'pelanggaran');
    if (jenisBoleh().indexOf(jenis) < 0) jenis = 'pelanggaran';
    const daftar = S.boot.siswa || [];
    el.innerHTML = UI.ph('Catat Cepat', 'Pilih jenis → pilih siswa → simpan') + '<div class="wrap" style="max-width:820px">' +
      '<div class="mt-l"><div class="chips scroll">' + jenisBoleh().map((j) => '<button class="chip ' + (j === jenis ? 'on' : '') + '" data-act="jenis" data-k="' + j + '">' + ic(JENIS_CATAT[j][1], 's') + esc(JENIS_CATAT[j][0]) + '</button>').join('') + '</div></div>' +
      '<div class="card mt"><h3 class="mb">' + ic('user-search', 's') + ' Pilih siswa</h3><div data-pilih></div></div>' +
      '<div data-log>' + catatLogHtml() + '</div><div style="height:24px"></div></div>';
    pemilihSiswa(el.querySelector('[data-pilih]'), daftar, (s) => go('#/catat/' + s.nisn), { tampilAwal: S.role === 'wali', ph: S.role === 'wali' ? 'Cari siswa di kelas Anda...' : 'Ketik nama atau NISN siswa...' });
    bind(el, {
      jenis: (b) => { Store.set(ukey('catat-jenis'), b.dataset.k); this.render(el, p); },
      ulang: (b) => { const x = S.catatLog.find((y) => y.id === b.dataset.id); if (x) kirimCatat(x); }
    });
    if (window.innerWidth >= 1024) setTimeout(() => { const i = el.querySelector('[data-pilih] input'); if (i) i.focus(); }, 30);
  }
});

function catatLogHtml() {
  const log = S.catatLog.filter((x) => x.role === S.role).slice(0, 8);
  return log.length ? UI.sec('Baru saja dicatat', '<div class="list">' + log.map((x) => '<div class="item ' + (x.st === 'gagal' ? 'c-rose' : '') + '"><span class="ic-c c-' + JENIS_CATAT[x.jenis][2] + '">' + (x.st === 'kirim' ? '<span class="spin" style="border-color:currentColor;border-right-color:transparent"></span>' : ic(x.st === 'gagal' ? 'circle-alert' : JENIS_CATAT[x.jenis][1], 's')) + '</span><div class="grow"><div class="row between top"><h4>' + esc(x.nama) + '</h4>' + (x.st === 'kirim' ? pill('Menyimpan…', 'slate') : x.st === 'gagal' ? pill('Gagal', 'red') : pill('Tersimpan', 'green')) + '</div><div class="small muted">' + esc(x.ringkas) + '</div>' + (x.pesan ? '<div class="xs" style="margin-top:2px;color:' + (x.st === 'gagal' ? '#DC2626' : 'var(--text-2)') + '">' + esc(x.pesan) + '</div>' : '') + '</div>' + (x.st === 'gagal' ? '<button class="btn btn-soft btn-sm" data-act="ulang" data-id="' + x.id + '">' + ic('refresh-cw', 's') + ' Ulangi</button>' : '') + '</div>').join('') + '</div>') : '';
}
function kirimCatat(x) {
  x.st = 'kirim'; x.pesan = '';
  const segar = () => { if (S.current && S.current.name === 'catat' && !S.current.params.length && S.current.el) { const l = S.current.el.querySelector('[data-log]'); if (l) l.innerHTML = catatLogHtml(); } };
  segar();
  api('catat', x.payload, { reqId: x.reqId }).then((r) => {
    if (r.success) {
      x.st = 'ok'; x.pesan = r.message;
      const h = r.data, s = (S.boot.siswa || []).find((y) => y.nisn === h.nisn);
      if (s && h.poin !== undefined) { s.poin = h.poin; if (h.level) s.level = h.level.kode; }
      toast(r.message, (h.suratBaru || []).length ? 'warn' : 'success');
      muatUlangLambat();
    } else { x.st = 'gagal'; x.pesan = r.message; toast(r.message, 'error'); }
    segar();
  });
}

function catatForm(el, nisn) {
  const s = (S.boot.siswa || []).find((x) => x.nisn === nisn);
  if (!s) { el.innerHTML = UI.ph('Catat', '', { back: '#/catat' }) + '<div class="wrap">' + emptyState('user-x', 'Siswa tidak ditemukan', 'Siswa tidak ada dalam cakupan Anda.') + '</div>'; return; }
  if (!el._c || el._c.nisn !== nisn) {
    let j = Store.get(ukey('catat-jenis'), 'pelanggaran'); if (jenisBoleh().indexOf(j) < 0) j = 'pelanggaran';
    el._c = { nisn, jenis: j, kode: '', q: '', tanggal: hariIni(), jam: jamKini(), ket: '', status: 'Sakit', jam_kembali: '', alasan: '', poinTerlambat: true, kodeTerlambat: '', nama_prestasi: '', tingkat: 'Sekolah', berkas: null };
  }
  const c = el._c;
  const amb = (S.cfg || {}).ambang || [];
  const lv = levelInfo(s.level || levelKode(s.poin, amb));
  const master = (S.boot.master || []).filter((m) => m.aktif !== false);
  const mTerlambat = master.filter((m) => /terlambat/i.test(m.nama));
  if (!c.kodeTerlambat && mTerlambat.length) c.kodeTerlambat = mTerlambat[0].kode;
  const pilihM = master.find((m) => m.kode === c.kode);
  const q = c.q.toLowerCase();
  const grup = {}; master.filter((m) => !q || (m.nama + ' ' + m.kategori + ' ' + m.kode).toLowerCase().includes(q)).forEach((m) => (grup[m.kategori] = grup[m.kategori] || []).push(m));
  const tglFld = '<div class="field"><label class="lbl">Tanggal</label><input class="input" type="date" data-input="tanggal" max="' + hariIni() + '" value="' + esc(c.tanggal) + '"></div>';
  const ketFld = (l, ph) => '<div class="field"><label class="lbl">' + (l || 'Keterangan') + ' <span class="opt">Opsional</span></label><input class="input" data-input="ket" maxlength="300" value="' + esc(c.ket) + '" placeholder="' + esc(ph || '') + '"></div>';
  const bukti = '<div class="field"><label class="lbl">Foto bukti <span class="opt">Opsional</span></label>' + (c.berkas ? UI.fileRow(c.berkas, 0, 'hapusB') : '<label class="drop" style="padding:12px"><input type="file" accept="image/*,application/pdf" capture="environment" data-change="bukti"><b class="small">' + ic('camera', 's') + ' Ambil / pilih foto</b></label>') + '</div>';
  let form = '';
  if (c.jenis === 'pelanggaran') {
    form = '<div class="search-in">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari jenis pelanggaran..." value="' + esc(c.q) + '" data-input="q" aria-label="Cari pelanggaran"></div>' +
      '<div class="stack mt" style="max-height:44vh;overflow:auto;padding:2px">' + (Object.keys(grup).sort((a, b) => Math.min(...grup[a].map((m) => m.poin)) - Math.min(...grup[b].map((m) => m.poin))).map((k) => '<div><div class="xs b muted mb-s">' + esc(k.toUpperCase()) + '</div><div class="stack s">' + grup[k].map((m) => '<button type="button" class="slotrow ' + (m.kode === c.kode ? 'on' : '') + '" data-act="kode" data-k="' + esc(m.kode) + '" style="padding:10px 12px"><span class="ck">' + ic(m.kode === c.kode ? 'check' : 'triangle-alert', 's') + '</span><span class="grow small b">' + esc(m.nama) + '</span>' + pill('+' + m.poin, m.poin >= 50 ? 'red' : m.poin >= 15 ? 'orange' : 'amber') + '</button>').join('') + '</div></div>').join('') || '<p class="small muted tc">Tidak ditemukan.</p>') + '</div>' +
      '<div class="grid2 mt">' + tglFld + '<div class="field"><label class="lbl">Jam</label><input class="input" type="time" data-input="jam" value="' + esc(c.jam) + '"></div></div>' + ketFld('Keterangan', 'Mis. di kantin saat jam pelajaran') + bukti;
  } else if (c.jenis === 'terlambat') {
    form = '<div class="grid2">' + tglFld + '<div class="field"><label class="lbl">Jam datang</label><input class="input" type="time" data-input="jam" value="' + esc(c.jam) + '"></div></div>' +
      (mTerlambat.length ? '<div class="card flat tight mb" style="background:var(--surface-2)"><label class="row between" style="cursor:pointer"><span><b class="small">Tambahkan poin keterlambatan</b><div class="xs muted">Sesuai daftar poin sekolah</div></span><span class="toggle"><input type="checkbox" data-change="poinT" ' + (c.poinTerlambat ? 'checked' : '') + '><i></i></span></label>' +
        (c.poinTerlambat ? '<select class="select mt" data-change="kodeT" aria-label="Jenis keterlambatan">' + mTerlambat.map((m) => '<option value="' + esc(m.kode) + '" ' + (m.kode === c.kodeTerlambat ? 'selected' : '') + '>' + esc(m.nama) + ' (+' + m.poin + ')</option>').join('') + '</select>' : '') + '</div>' : '') + ketFld('Alasan', 'Mis. ban bocor');
  } else if (c.jenis === 'izin_keluar') {
    form = '<div class="grid2"><div class="field"><label class="lbl">Jam keluar</label><input class="input" type="time" data-input="jam" value="' + esc(c.jam) + '"></div><div class="field"><label class="lbl">Perkiraan kembali <span class="opt">Opsional</span></label><input class="input" type="time" data-input="jam_kembali" value="' + esc(c.jam_kembali) + '"></div></div>' +
      '<div class="field"><label class="lbl">Alasan <span class="req">*</span></label><input class="input" data-input="alasan" maxlength="300" value="' + esc(c.alasan) + '" placeholder="Mis. Sakit, dijemput orang tua"></div>';
  } else if (c.jenis === 'kehadiran') {
    form = '<div class="field"><label class="lbl">Status</label>' + UI.seg([{ k: 'Sakit', l: 'Sakit' }, { k: 'Izin', l: 'Izin' }, { k: 'Alpa', l: 'Alpa' }], c.status, 'status') + '</div>' + tglFld + ketFld('Keterangan', 'Mis. surat dokter dari orang tua');
  } else if (c.jenis === 'prestasi') {
    form = '<div class="field"><label class="lbl">Nama prestasi <span class="req">*</span></label><input class="input" data-input="nama_prestasi" maxlength="150" value="' + esc(c.nama_prestasi) + '" placeholder="Mis. Juara 1 Lomba Debat Bahasa Inggris"></div>' +
      '<div class="grid2"><div class="field"><label class="lbl">Tingkat</label><select class="select" data-change="tingkat">' + TINGKAT.map((t) => '<option ' + (t === c.tingkat ? 'selected' : '') + '>' + t + '</option>').join('') + '</select></div>' + tglFld + '</div>' + ketFld() + bukti;
  }
  const ringkas = c.jenis === 'pelanggaran' ? (pilihM ? pilihM.nama + ' (+' + pilihM.poin + ')' : '') : c.jenis === 'terlambat' ? 'Terlambat ' + c.jam + (c.poinTerlambat && c.kodeTerlambat ? ' · +' + (master.find((m) => m.kode === c.kodeTerlambat) || {}).poin + ' poin' : '') : c.jenis === 'izin_keluar' ? 'Izin keluar ' + c.jam + (c.alasan ? ' · ' + c.alasan : '') : c.jenis === 'kehadiran' ? c.status + ' · ' + tgl(c.tanggal) : c.nama_prestasi;
  const prediksi = c.jenis === 'pelanggaran' && pilihM ? s.poin + pilihM.poin : null;
  const lewati = prediksi !== null ? amb.filter((a) => s.poin < a.batas && prediksi >= a.batas) : [];
  el.innerHTML = UI.ph('Catat untuk ' + namaDepan(s.nama), s.kelas, { back: '#/catat' }) + '<div class="wrap" style="max-width:820px">' +
    '<div class="card mt-l"><div class="row">' + avatar(s.nama) + '<div class="grow"><b>' + esc(s.nama) + '</b><div class="small muted">' + esc(s.kelas) + ' · NISN ' + esc(s.nisn) + '</div></div><div class="tr"><div style="font-family:var(--f-head);font-weight:700;font-size:22px;color:var(--' + lv.c + ')">' + s.poin + '</div>' + pill(lv.t, lv.p) + '</div></div></div>' +
    '<div class="mt"><div class="chips scroll">' + jenisBoleh().map((j) => '<button class="chip ' + (j === c.jenis ? 'on' : '') + '" data-act="jenis" data-k="' + j + '">' + ic(JENIS_CATAT[j][1], 's') + esc(JENIS_CATAT[j][0]) + '</button>').join('') + '</div></div>' +
    '<div class="card mt">' + form + '</div>' +
    (lewati.length ? '<div class="alert warn mt">' + ic('mail-warning') + '<div>Poin akan menjadi <b>' + prediksi + '</b> dan melewati ambang <b>' + lewati.map((a) => a.jenis).join(', ') + '</b>. Draf surat dibuat otomatis untuk diperiksa.</div></div>' : '') +
    '<div class="sticky-act"><button class="btn btn-primary btn-block btn-lg" data-act="simpan" ' + (ringkas ? '' : 'disabled') + '>' + ic('check') + ' Simpan' + (ringkas ? ' · ' + esc(ringkas.length > 40 ? ringkas.slice(0, 40) + '…' : ringkas) : '') + '</button></div><div style="height:16px"></div></div>';
  const ulang = () => { const y = window.scrollY; catatForm(el, nisn); window.scrollTo(0, y); };
  bind(el, {
    jenis: (b) => { c.jenis = b.dataset.k; Store.set(ukey('catat-jenis'), c.jenis); ulang(); },
    kode: (b) => { c.kode = b.dataset.k; ulang(); },
    'input:q': debounce((i) => { c.q = i.value; ulang(); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 150),
    'input:tanggal': (i) => (c.tanggal = i.value), 'input:jam': (i) => (c.jam = i.value), 'input:jam_kembali': (i) => (c.jam_kembali = i.value),
    'input:ket': (i) => (c.ket = i.value), 'input:alasan': debounce((i) => { c.alasan = i.value; const btn = el.querySelector('[data-act=simpan]'); btn.disabled = !i.value.trim(); }, 120),
    'input:nama_prestasi': debounce((i) => { c.nama_prestasi = i.value; el.querySelector('[data-act=simpan]').disabled = !i.value.trim(); }, 120),
    'change:tingkat': (i) => (c.tingkat = i.value), status: (b) => { c.status = b.dataset.k; ulang(); },
    'change:poinT': (i) => { c.poinTerlambat = i.checked; ulang(); }, 'change:kodeT': (i) => { c.kodeTerlambat = i.value; ulang(); },
    'change:bukti': async (i) => { try { c.berkas = await bacaBerkas(i.files[0], { maxMB: 5, dim: 1400 }); ulang(); } catch (e) { toast(e.message, 'error'); } },
    hapusB: () => { c.berkas = null; ulang(); },
    simpan: async (btn) => {
      const payload = { nisn, jenis: c.jenis, tanggal: c.tanggal, jam: c.jam, keterangan: c.ket };
      if (c.jenis === 'pelanggaran') { if (!c.kode) return toast('Pilih jenis pelanggaran.', 'warn'); payload.kode = c.kode; }
      if (c.jenis === 'terlambat' && c.poinTerlambat && c.kodeTerlambat) payload.kode = c.kodeTerlambat;
      if (c.jenis === 'izin_keluar') { if (!c.alasan.trim()) return toast('Alasan izin keluar wajib diisi.', 'warn'); payload.alasan = c.alasan; payload.jam_kembali = c.jam_kembali; payload.tanggal = hariIni(); }
      if (c.jenis === 'kehadiran') payload.status = c.status;
      if (c.jenis === 'prestasi') { if (!c.nama_prestasi.trim()) return toast('Isi nama prestasi.', 'warn'); payload.nama_prestasi = c.nama_prestasi; payload.tingkat = c.tingkat; }
      const x = { id: uuid(), reqId: uuid(), role: S.role, jenis: c.jenis, nama: s.nama, ringkas, payload, st: 'kirim' };
      if (c.berkas && (c.jenis === 'pelanggaran' || c.jenis === 'prestasi')) {
        payload.berkas = { nama: c.berkas.nama, mime: c.berkas.mime, data: c.berkas.data };
        busy(btn, true, 'Mengunggah bukti...');
        const r = await api('catat', payload, { reqId: x.reqId });
        busy(btn, false);
        if (!r.success) { toast(r.message, 'error'); return; }
        x.st = 'ok'; x.pesan = r.message; S.catatLog.unshift(x); toast(r.message, 'success'); muatUlangLambat();
      } else {
        S.catatLog.unshift(x);
        kirimCatat(x);        // optimistis: kembali ke daftar seketika, server menyusul
      }
      el._c = null;
      go('#/catat');
    }
  });
}

// ============================================================
// KESISWAAN — DATA POIN & KEHADIRAN
// ============================================================
halaman('data', {
  roles: ['kesiswaan'], title: 'Data Poin & Kehadiran', nav: 'data',
  render(el) {
    const b = S.boot;
    const f = el._f = el._f || { tab: 'siswa', kelas: '', level: '', q: '', hal: 1 };
    const q = f.q.toLowerCase();
    const okK = (x) => (!f.kelas || x.kelas_id === f.kelas) && (!q || (x.nama + ' ' + x.nisn).toLowerCase().includes(q));
    const DATA = {
      siswa: (b.siswa || []).filter((x) => okK(x) && (!f.level || x.level === f.level)).sort((a, c) => c.poin - a.poin),
      pel: (b.pelanggaran || []).filter(okK), hadir: (b.kehadiran || []).filter(okK), pres: (b.prestasi || []).filter(okK)
    };
    const KOL = {
      siswa: [{ k: 'nama', l: 'Nama', f: (x) => '<b>' + esc(x.nama) + '</b><div class="xs muted">NISN ' + esc(x.nisn) + '</div>' }, { k: 'kelas', l: 'Kelas' }, { k: 'poin', l: 'Poin', num: 1, f: (x) => '<b>' + x.poin + '</b>' }, { k: 'terlambat', l: 'Terlambat', num: 1 }, { k: 'level', l: 'Status', f: (x) => pill(levelInfo(x.level).t, levelInfo(x.level).p) }],
      pel: [{ k: 'tanggal', l: 'Tanggal', f: (x) => esc(tgl(x.tanggal) + ' ' + (x.jam || '')) }, { k: 'nama', l: 'Siswa', f: (x) => '<b>' + esc(x.nama) + '</b><div class="xs muted">' + esc(x.kelas) + '</div>' }, { k: 'pelanggaran', l: 'Pelanggaran' }, { k: 'poin', l: 'Poin', num: 1 }, { k: 'pencatat', l: 'Pencatat', f: (x) => '<span class="small">' + esc(x.pencatat) + '</span>' }],
      hadir: [{ k: 'tanggal', l: 'Tanggal', f: (x) => esc(tgl(x.tanggal) + ' ' + (x.jam || '')) }, { k: 'nama', l: 'Siswa', f: (x) => '<b>' + esc(x.nama) + '</b><div class="xs muted">' + esc(x.kelas) + '</div>' }, { k: 'jenis', l: 'Jenis', f: (x) => pill(x.jenis) }, { k: 'alasan', l: 'Alasan' }, { k: 'pencatat', l: 'Pencatat', f: (x) => '<span class="small">' + esc(x.pencatat) + '</span>' }],
      pres: [{ k: 'tanggal', l: 'Tanggal', f: (x) => esc(tgl(x.tanggal)) }, { k: 'nama', l: 'Siswa', f: (x) => '<b>' + esc(x.nama) + '</b><div class="xs muted">' + esc(x.kelas) + '</div>' }, { k: 'prestasi', l: 'Prestasi' }, { k: 'tingkat', l: 'Tingkat' }]
    };
    const rows = DATA[f.tab], per = 20;
    el.innerHTML = UI.ph('Data Poin & Kehadiran', 'Semester berjalan') + '<div class="wrap">' +
      '<div class="mt-l">' + UI.tabs([{ k: 'siswa', l: 'Rekap Siswa', n: DATA.siswa.length }, { k: 'pel', l: 'Pelanggaran', n: DATA.pel.length }, { k: 'hadir', l: 'Kehadiran', n: DATA.hadir.length }, { k: 'pres', l: 'Prestasi', n: DATA.pres.length }], f.tab, 'tab') + '</div>' +
      '<div class="toolbar mt" style="flex-wrap:wrap"><div class="search-in" style="flex:1;min-width:200px">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari nama atau NISN..." value="' + esc(f.q) + '" data-input="q"></div>' +
      '<select class="select" data-change="kelas" style="max-width:200px" aria-label="Kelas"><option value="">Semua kelas</option>' + (b.kelas || []).map((k) => '<option value="' + esc(k.kelas_id) + '" ' + (f.kelas === k.kelas_id ? 'selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select>' +
      (f.tab === 'siswa' ? '<select class="select" data-change="level" style="max-width:180px" aria-label="Status"><option value="">Semua status</option>' + ['aman', 'waspada', 'peringatan', 'kritis'].map((l) => '<option value="' + l + '" ' + (f.level === l ? 'selected' : '') + '>' + levelInfo(l).t + '</option>').join('') + '</select>' : '') +
      '<button class="btn btn-outline" data-act="xlsx" style="color:#047857;border-color:#A7F3D0">' + ic('file-spreadsheet', 's') + ' Excel</button></div>' +
      '<div class="card p0"><div style="padding:6px 12px">' + UI.tabel(KOL[f.tab], rows.slice((f.hal - 1) * per, f.hal * per), { rowAct: 'buka', idKey: 'nisn' }) + UI.pager(rows.length, f.hal, per, 'hal') + '</div></div><div style="height:24px"></div></div>';
    bind(el, {
      tab: (x) => { f.tab = x.dataset.k; f.hal = 1; this.render(el); },
      hal: (x) => { f.hal = +x.dataset.k; this.render(el); },
      'input:q': debounce((i) => { f.q = i.value; f.hal = 1; this.render(el); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      'change:kelas': (s) => { f.kelas = s.value; f.hal = 1; this.render(el); },
      'change:level': (s) => { f.level = s.value; f.hal = 1; this.render(el); },
      buka: (r) => go('#/siswa/' + r.dataset.id),
      xlsx: () => eksporExcel('Data ' + { siswa: 'Rekap Siswa', pel: 'Pelanggaran', hadir: 'Kehadiran', pres: 'Prestasi' }[f.tab] + ' ' + hariIni(), { Data: rows.map((x) => { const o = {}; KOL[f.tab].forEach((c) => (o[c.l] = c.k === 'level' ? levelInfo(x.level).t : c.k === 'nama' ? x.nama : x[c.k])); if (f.tab !== 'siswa') o.Kelas = x.kelas; o.NISN = x.nisn; return o; }) })
    });
  }
});

// ============================================================
// DAFTAR POIN & AMBANG (Kesiswaan & Admin)
// ============================================================
halaman('daftar-poin', {
  roles: ['kesiswaan', 'admin'], title: 'Daftar Poin & Ambang', nav: 'daftar-poin', live: false,
  render(el) {
    const master = S.boot.master || [];
    const amb = el._amb = el._amb || JSON.parse(JSON.stringify((S.cfg || {}).ambang || []));
    const q = (el._q || '').toLowerCase();
    const grup = {}; master.filter((m) => !q || (m.nama + ' ' + m.kategori + ' ' + m.kode).toLowerCase().includes(q)).forEach((m) => (grup[m.kategori] = grup[m.kategori] || []).push(m));
    const JS = ['SP1', 'SP2', 'SP3', 'Pemanggilan', 'Perjanjian'];
    el.innerHTML = UI.ph('Daftar Poin & Ambang', master.length + ' jenis pelanggaran', { acts: '<button class="btn btn-primary btn-sm" data-act="baru">' + ic('plus', 's') + ' Jenis</button>' }) + '<div class="wrap">' +
      '<div class="cols mt-l"><div>' +
      '<div class="row between mb"><h2 style="font-size:17px">Jenis Pelanggaran</h2><button class="btn btn-primary btn-sm d-only" data-act="baru">' + ic('plus', 's') + ' Tambah Jenis</button></div>' +
      '<div class="search-in mb">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari pelanggaran..." value="' + esc(el._q || '') + '" data-input="q"></div>' +
      Object.keys(grup).sort((a, b) => Math.min(...grup[a].map((m) => m.poin)) - Math.min(...grup[b].map((m) => m.poin))).map((k) => '<div class="card p0 mb"><div class="card-head"><h3>' + esc(k) + '</h3><span class="count">' + grup[k].length + '</span></div><div style="padding:0 12px 8px">' + grup[k].map((m, i) => '<div class="row" style="padding:10px 4px;' + (i ? 'border-top:1px solid var(--border-soft)' : '') + ';' + (m.aktif ? '' : 'opacity:.5') + '"><span class="mono xs muted" style="width:40px">' + esc(m.kode) + '</span><span class="grow small b">' + esc(m.nama) + '</span>' + pill('+' + m.poin, m.poin >= 50 ? 'red' : m.poin >= 15 ? 'orange' : 'amber') + (m.aktif ? '' : pill('Nonaktif', 'slate')) + '<button class="icon-btn" data-act="edit" data-k="' + esc(m.kode) + '" aria-label="Ubah ' + esc(m.nama) + '" style="width:36px;height:36px">' + ic('pencil', 's') + '</button></div>').join('') + '</div></div>').join('') +
      '</div><div>' +
      '<div class="card"><h3>Ambang Surat Otomatis</h3><p class="small muted mt mb">Saat total poin siswa mencapai batas, sistem membuat draf surat untuk diperiksa. Surat tidak pernah terkirim tanpa persetujuan.</p>' +
      '<div class="stack s">' + amb.map((a, i) => '<div class="card flat tight" style="background:var(--surface-2)"><div class="row" style="gap:8px"><span class="small muted">Poin ≥</span><input class="input" type="number" min="1" max="1000" value="' + a.batas + '" data-input="batas" data-i="' + i + '" style="width:84px;height:40px" aria-label="Batas poin"><select class="select grow" data-change="jenis" data-i="' + i + '" style="height:40px" aria-label="Jenis surat">' + JS.map((j) => '<option ' + (a.jenis === j ? 'selected' : '') + '>' + j + '</option>').join('') + '</select><button class="icon-btn" data-act="hapusA" data-i="' + i + '" aria-label="Hapus ambang" style="width:36px;height:36px;color:#DC2626">' + ic('trash-2', 's') + '</button></div>' +
        '<div class="row wrap mt" style="gap:12px"><span class="xs muted">Pemeriksa:</span>' + ['kesiswaan', 'bk'].map((p) => '<label class="row small" style="gap:6px"><input type="checkbox" data-change="pem" data-i="' + i + '" data-p="' + p + '" ' + (a.pemeriksa.indexOf(p) > -1 ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--primary)">' + LABEL_PERAN[p] + '</label>').join('') +
        '<label class="row small" style="gap:6px"><input type="checkbox" data-change="ttd" data-i="' + i + '" ' + (a.ttd ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--primary)">TTD Kepala Sekolah</label></div></div>').join('') + '</div>' +
      '<div class="btns mt"><button class="btn btn-outline btn-sm" data-act="tambahA">' + ic('plus', 's') + ' Tambah ambang</button><button class="btn btn-primary btn-sm" data-act="simpanA">' + ic('save', 's') + ' Simpan ambang</button></div></div>' +
      '<div class="card mt">' + UI.ambangBar(0, amb) + '<p class="xs muted">Penanda batas Surat Peringatan pada bilah poin siswa.</p></div>' +
      '</div></div><div style="height:24px"></div></div>';
    const editM = (m) => {
      m = m || { kategori: Object.keys(grup)[0] || 'Kedisiplinan', poin: 5, aktif: true };
      const md = Modal.open({
        title: m.kode ? 'Ubah jenis pelanggaran' : 'Tambah jenis pelanggaran',
        body: '<form><div class="field"><label class="lbl">Nama pelanggaran <span class="req">*</span></label><input class="input" name="nama" maxlength="150" value="' + esc(m.nama || '') + '"></div><div class="grid2"><div class="field"><label class="lbl">Kategori</label><input class="input" name="kategori" list="dl-katp" maxlength="40" value="' + esc(m.kategori) + '"><datalist id="dl-katp">' + Object.keys(grup).map((k) => '<option value="' + esc(k) + '">').join('') + '</datalist></div><div class="field"><label class="lbl">Poin</label><input class="input" type="number" name="poin" min="1" max="1000" value="' + m.poin + '"></div></div>' +
          '<label class="row" style="gap:10px"><span class="toggle"><input type="checkbox" name="aktif" ' + (m.aktif ? 'checked' : '') + '><i></i></span><span class="small b">Aktif (dapat dipilih saat mencatat)</span></label>' + (m.kode ? '<p class="xs muted mt">Perubahan poin tidak mengubah catatan yang sudah ada.</p>' : '') + '</form>',
        foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">Simpan</button>',
        handlers: {
          batal: () => md.close(),
          ok: async (b) => { const v = formData(md.el.querySelector('form')); if (!v.nama) { toast('Isi nama pelanggaran.', 'warn'); return; } const r = await App.aksi('masterSimpan', Object.assign(v, { kode: m.kode || '', poin: Number(v.poin) }), { btn: b }); if (r) { if (m.kode) Object.assign(m, v, { poin: Number(v.poin) }); else master.push(Object.assign(v, { kode: r.kode, poin: Number(v.poin) })); md.close(); this.render(el); } }
        }
      });
    };
    bind(el, {
      'input:q': debounce((i) => { el._q = i.value; this.render(el); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      baru: () => editM(null), edit: (b) => editM(master.find((m) => m.kode === b.dataset.k)),
      'input:batas': (i) => (amb[+i.dataset.i].batas = Number(i.value)),
      'change:jenis': (s) => (amb[+s.dataset.i].jenis = s.value),
      'change:pem': (c) => { const a = amb[+c.dataset.i]; a.pemeriksa = a.pemeriksa.filter((x) => x !== c.dataset.p); if (c.checked) a.pemeriksa.push(c.dataset.p); },
      'change:ttd': (c) => (amb[+c.dataset.i].ttd = c.checked),
      hapusA: (b) => { amb.splice(+b.dataset.i, 1); this.render(el); },
      tambahA: () => { amb.push({ batas: (amb.length ? Math.max(...amb.map((a) => a.batas)) + 25 : 25), jenis: 'SP1', pemeriksa: ['kesiswaan'], ttd: false }); this.render(el); },
      simpanA: async (b) => {
        if (amb.some((a) => !(a.batas > 0) || !a.pemeriksa.length)) { toast('Setiap ambang wajib memiliki batas poin dan minimal satu pemeriksa.', 'warn'); return; }
        const r = await App.aksi('ambangSimpan', { rows: amb }, { btn: b });
        if (r) { S.cfg.ambang = r; el._amb = null; this.render(el); }
      }
    });
  }
});

// ============================================================
// KESISWAAN — RUJUKAN KASUS DARI BK
// ============================================================
halaman('rujukan-kasus', {
  roles: ['kesiswaan'], title: 'Rujukan dari BK', nav: 'rujukan-kasus',
  render(el) {
    const all = (S.boot.rujukanKasus || []).slice().sort((a, b) => (a.dibuat < b.dibuat ? 1 : -1));
    el.innerHTML = UI.ph('Rujukan dari BK', 'Ringkasan kasus kedisiplinan') + '<div class="wrap" style="max-width:860px">' +
      '<div class="alert info mt-l">' + ic('lock') + '<div>Guru BK hanya membagikan ringkasan. Identitas pelapor dan catatan konseling tetap rahasia.</div></div>' +
      '<div class="list mt">' + (all.map((r) => '<div class="card"><div class="row between">' + pill(r.kategori, 'dark') + pill(r.status) + '</div><p class="mt" style="color:var(--text-2)">' + esc(r.ringkasan) + '</p><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(r.dibuat)) + '</span><span>' + ic('headset', 's') + esc(r.nama_bk || 'Guru BK') + '</span></div><div class="btns mt"><button class="btn btn-soft btn-sm" data-go="#/catat">' + ic('square-pen', 's') + ' Catat pelanggaran</button><button class="btn btn-outline btn-sm" data-act="surat">' + ic('file-plus', 's') + ' Buat surat</button></div></div>').join('') || emptyState('share-2', 'Belum ada rujukan', 'Rujukan kasus kedisiplinan dari Guru BK akan tampil di sini.')) + '</div><div style="height:24px"></div></div>';
    bind(el, { surat: () => buatSuratModal() });
  }
});

// ============================================================
// WALI KELAS — KELASKU
// ============================================================
halaman('beranda', {
  roles: ['wali'], title: 'Kelasku', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, amb = (S.cfg || {}).ambang || [];
    const kelas = b.kelas || [];
    if (!kelas.length) { el.innerHTML = heroStaf('Kelasku', 'Wali kelas') + '<div class="wrap">' + emptyState('school', 'Belum ditetapkan sebagai wali kelas', 'Hubungi admin untuk menautkan kelas ke akun Anda.') + '</div>'; return; }
    const f = el._f || 'semua';
    const siswa = (b.siswa || []).filter((s) => f === 'semua' || (f === 'perhatian' ? s.level !== 'aman' : s.kelas_id === f)).sort((a, c) => c.poin - a.poin || (a.nama < c.nama ? -1 : 1));
    const nk = kelas.map((k) => k.nama_kelas).join(', ');
    el.innerHTML = heroStaf('Kelas ' + nk, st.jumlahSiswa + ' siswa · ' + (st.terlambatMinggu || 0) + ' terlambat pekan ini') +
      '<div class="wrap">' + UI.banner({ tag: 'Wali Kelas · ' + (kelas[0].tahun_ajaran || ''), judul: 'Kelas ' + nk, teks: 'Pantau poin, kehadiran, dan prestasi siswa. Rujuk ke Guru BK bila ada siswa yang perlu pendampingan.', minis: [{ l: 'Siswa', v: st.jumlahSiswa || 0 }, { l: 'Total poin', v: st.totalPoin || 0 }] }) +
      '<div class="stats mt-l">' + UI.stat({ lbl: 'Jumlah Siswa', v: st.jumlahSiswa || 0, ic: 'users', c: 'indigo' }) + UI.stat({ lbl: 'Terlambat Pekan Ini', v: st.terlambatMinggu || 0, ic: 'alarm-clock', c: 'rose' }) +
      UI.stat({ lbl: 'Rujukan Aktif', v: st.rujukanAktif || 0, ic: 'share-2', c: 'teal', go: '#/rujukan' }) + UI.stat({ lbl: 'Surat Bulan Ini', v: st.suratBulanIni || 0, ic: 'mail', c: 'violet', go: '#/surat' }) + '</div>' +
      '<div class="btns mt"><button class="btn btn-primary" data-go="#/catat">' + ic('square-pen') + ' Catat</button><button class="btn btn-outline" data-act="rujuk">' + ic('share-2') + ' Rujuk ke BK</button><button class="btn btn-outline" data-go="#/laporan">' + ic('chart-column') + ' Rekap Kelas</button></div>' +
      UI.sec('Daftar Siswa', (UI.chips([{ k: 'semua', l: 'Semua', n: (b.siswa || []).length }, { k: 'perhatian', l: 'Perlu perhatian', n: (b.siswa || []).filter((s) => s.level !== 'aman').length }].concat(kelas.length > 1 ? kelas.map((k) => ({ k: k.kelas_id, l: k.nama_kelas })) : []), f, 'f', true)) +
        '<div class="grid-quick mt" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">' + siswa.map((s) => { const lv = levelInfo(s.level); return '<div class="item click c-' + lv.c + '" data-go="#/siswa/' + esc(s.nisn) + '">' + avatar(s.nama, 's') + '<div class="grow" style="min-width:0"><div class="row between"><h4 class="ell">' + esc(s.nama) + '</h4><b style="color:var(--c)">' + s.poin + '</b></div><div class="row between"><span class="xs muted">' + s.terlambat + '× terlambat</span>' + pill(lv.t, lv.p) + '</div></div></div>'; }).join('') + '</div>', { count: siswa.length }) +
      '<div class="cols"><div>' + UI.sec('Catatan Terbaru', (b.pelanggaran || []).length ? '<div class="list">' + b.pelanggaran.slice(0, 5).map((p) => '<div class="item click" data-go="#/siswa/' + esc(p.nisn) + '"><span class="ic-c c-orange">' + ic('triangle-alert', 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(p.nama) + '</h4>' + pill('+' + p.poin, 'red') + '</div><div class="small muted ell">' + esc(p.pelanggaran) + ' · ' + esc(tglS(p.tanggal)) + '</div></div></div>').join('') + '</div>' : emptyState('circle-check', 'Belum ada catatan', '')) + '</div>' +
      '<div>' + UI.sec('Prestasi Kelas', (b.prestasi || []).length ? '<div class="list">' + b.prestasi.slice(0, 5).map((p) => '<div class="item"><span class="ic-c c-amber">' + ic('trophy', 's') + '</span><div class="grow"><h4>' + esc(p.nama) + '</h4><div class="small muted">' + esc(p.prestasi) + ' · ' + esc(p.tingkat) + '</div></div></div>').join('') + '</div>' : emptyState('trophy', 'Belum ada prestasi', '')) + '</div></div>' +
      '<div style="height:24px"></div></div>';
    bind(el, { f: (x) => { el._f = x.dataset.k; this.render(el); }, rujuk: () => rujukModal() });
  }
});

// ============================================================
// GURU PIKET — BERANDA
// ============================================================
halaman('beranda', {
  roles: ['piket'], title: 'Piket Hari Ini', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, h = b.hariIni || { pelanggaran: [], kehadiran: [] };
    const semua = [].concat(h.kehadiran.map((x) => ({ j: x.jam, n: x.nama, k: x.kelas, nisn: x.nisn, t: x.jenis + (x.alasan ? ' · ' + x.alasan : ''), ic: x.jenis === 'Terlambat' ? 'alarm-clock' : x.jenis === 'Izin Keluar' ? 'door-open' : 'calendar-check', c: x.jenis === 'Terlambat' ? 'rose' : 'blue', p: pill(x.jenis), o: x.pencatat })),
      h.pelanggaran.map((x) => ({ j: x.jam, n: x.nama, k: x.kelas, nisn: x.nisn, t: x.pelanggaran, ic: 'triangle-alert', c: 'orange', p: pill('+' + x.poin, 'red'), o: x.pencatat }))).sort((a, c) => (a.j < c.j ? 1 : -1));
    el.innerHTML = heroStaf('Piket ' + HARI[new Date().getDay()], tglP(hariIni()) + ' · catat dalam 3 ketukan', { search: false }) +
      '<div class="wrap">' + UI.banner({ tag: 'Guru Piket', judul: 'Piket ' + tglP(hariIni()), teks: 'Catat keterlambatan, izin keluar, dan pelanggaran. Orang tua menerima pemberitahuan otomatis.', minis: [{ l: 'Dicatat Anda', v: st.olehSaya || 0 }] }) +
      '<div class="grid-quick mt-l" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + [['terlambat', 'Terlambat', 'alarm-clock', 'rose', st.terlambat], ['izin_keluar', 'Izin Keluar', 'door-open', 'blue', st.izinKeluar], ['pelanggaran', 'Pelanggaran', 'triangle-alert', 'orange', st.pelanggaran]].map((x) => '<button class="qcard c-' + x[3] + '" data-act="preset" data-k="' + x[0] + '" style="min-height:132px"><span class="qi">' + ic(x[2]) + '</span><span class="qt">' + x[1] + '</span><span class="qs">' + (x[4] || 0) + ' hari ini</span></button>').join('') + '</div>' +
      UI.sec('Tercatat Hari Ini', semua.length ? '<div class="list">' + semua.map((x) => '<div class="item c-' + x.c + '"><span class="ic-c">' + ic(x.ic, 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(x.n) + ' <span class="muted" style="font-weight:400">· ' + esc(x.k) + '</span></h4>' + x.p + '</div><div class="small muted ell">' + esc(x.t) + '</div><div class="xs muted">' + esc(x.j || '') + ' · ' + esc(x.o) + '</div></div></div>').join('') + '</div>' : emptyState('clipboard-check', 'Belum ada catatan hari ini', 'Gunakan tombol di atas untuk mulai mencatat.'), { count: semua.length }) +
      '<div style="height:24px"></div></div>';
    bind(el, { preset: (x) => catatPreset(x.dataset.k) });
  }
});

// ============================================================
// KEPALA SEKOLAH — RINGKASAN
// ============================================================
halaman('beranda', {
  roles: ['kepsek'], title: 'Ringkasan Kepala Sekolah', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, g = b.grafik || {};
    const ttd = (b.surat || []).filter((s) => s.status === 'Menunggu TTD');
    el.innerHTML = heroStaf(sapaan() + ', Bapak/Ibu', 'Ringkasan ' + BLN_P[new Date().getMonth()] + ' · ' + ttd.length + ' surat menunggu tanda tangan') +
      '<div class="wrap">' + UI.banner({ tag: 'Kepala Sekolah · ' + BLN_P[new Date().getMonth()] + ' ' + new Date().getFullYear(), judul: sapaan() + ', ' + S.me.nama.split(',')[0], teks: 'Ringkasan layanan BK dan kesiswaan bulan ini tanpa identitas pelapor dan tanpa catatan rahasia konseling.', minis: [{ l: 'Menunggu TTD', v: ttd.length }, { l: 'Siswa aktif', v: st.siswaAktif || 0 }] }) +
      (ttd.length ? '<div class="card mt-l" style="border:2px solid var(--amber,#F59E0B)"><div class="row between"><div class="row"><span class="avatar s c-amber">' + ic('pen-line', 's') + '</span><div><b>' + ttd.length + ' surat menunggu tanda tangan</b><div class="small muted">Sudah disetujui pemeriksa</div></div></div><button class="btn btn-primary btn-sm" data-go="#/surat">Tinjau</button></div>' +
        '<div class="list mt">' + ttd.slice(0, 4).map((s) => '<div class="item click" data-go="#/surat/' + esc(s.id) + '">' + avatar(s.nama_siswa, 's') + '<div class="grow"><div class="row between"><h4>' + esc(s.nama_siswa) + '</h4>' + pillJenis(s.jenis) + '</div><div class="small muted">' + esc(s.kelas) + ' · diperiksa ' + esc(s.nama_pemeriksa || '-') + '</div></div></div>').join('') + '</div></div>' : '') +
      '<div class="stats mt-l">' + UI.stat({ lbl: 'Layanan Konseling', v: st.layanan || 0, ic: 'heart-handshake', c: 'indigo', foot: 'Bulan ini' }) + UI.stat({ lbl: 'Kasus Masuk', v: st.kasus || 0, ic: 'shield-alert', c: 'rose', foot: (st.kasusSelesai || 0) + ' selesai · ' + (st.kasusPrioritas || 0) + ' prioritas' }) +
      UI.stat({ lbl: 'Pelanggaran', v: st.pelanggaran || 0, ic: 'triangle-alert', c: 'orange', foot: (st.terlambat || 0) + ' keterlambatan' }) + UI.stat({ lbl: 'Prestasi', v: st.prestasi || 0, ic: 'trophy', c: 'amber' }) + '</div>' +
      '<div class="cols even mt">' + '<div class="card"><h3 class="mb">Kasus per Jenis</h3>' + grafikBar(g.kasusPerJenis) + '</div><div class="card"><h3 class="mb">Tren Pelanggaran 6 Bulan</h3>' + grafikGaris(g.trenPelanggaran, { warna: '#F43F5E' }) + '</div>' +
      '<div class="card"><h3 class="mb">Layanan Konseling per Bulan</h3>' + grafikBatang(g.layananPerBulan) + '</div><div class="card"><h3 class="mb">Kelas dengan Poin Tertinggi</h3>' + grafikBar(g.kelasTop, { persen: false, warna: '#F97316', maks: 6 }) + '</div></div>' +
      (!b.adaTtd ? '<div class="alert warn mt-l">' + ic('pen-line') + '<div class="grow"><b>Tanda tangan elektronik belum diatur.</b> Anda tetap dapat menandatangani dengan kode QR.</div><button class="btn btn-sm btn-dark" data-go="#/lainnya">Atur</button></div>' : '') +
      '<div class="btns mt-l"><button class="btn btn-outline" data-go="#/laporan">' + ic('chart-column') + ' Laporan lengkap & ekspor</button></div><div style="height:24px"></div></div>';
  }
});
