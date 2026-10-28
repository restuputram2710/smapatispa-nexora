/* ============================================================
   SMAPATISPA NEXORA — siswa.js : halaman Siswa & Orang Tua
   ============================================================ */
'use strict';

const LAYANAN_IC = { 'Konseling Individu': ['user-round', 'indigo'], 'Konseling Kelompok': ['users', 'violet'], 'Konsultasi Karier & Studi Lanjut': ['graduation-cap', 'blue'], 'Konsultasi Belajar': ['book-open', 'emerald'], 'Bimbingan Pribadi & Sosial': ['heart-handshake', 'rose'] };
const ADUAN_IC = { 'Perundungan': 'users-round', 'Kekerasan Fisik/Verbal': 'hand', 'Pelecehan/Kekerasan Seksual': 'shield-alert', 'Konflik dengan Teman': 'messages-square', 'Masalah Keluarga': 'house', 'Kecanduan Gim/Judi Online': 'gamepad-2', 'Kedisiplinan': 'clipboard-list', 'Tekanan Emosional': 'cloud-rain', 'Pergaulan': 'users', 'Lainnya': 'circle-ellipsis' };
const AKTIF = ['Menunggu', 'Dijadwalkan', 'Dijadwal Ulang'];
const HADIR_IC = { Terlambat: 'alarm-clock', 'Izin Keluar': 'door-open', Sakit: 'thermometer', Izin: 'file-check', Alpa: 'circle-x' };
const HADIR_C = { Terlambat: 'rose', 'Izin Keluar': 'blue', Sakit: 'amber', Izin: 'violet', Alpa: 'rose' };
function waLink(no) { return 'https://wa.me/' + String(no || '').replace(/\D/g, '').replace(/^0/, '62'); }
/** Nama panggilan: buang gelar depan (Dra., Hj., H., Drs., Ir.) dan gelar belakang. */
function namaDepan(n) { const k = String(n || '').replace(/,.*$/, '').split(/\s+/).filter(Boolean); const t = k.filter((w) => !/\.$/.test(w)); return (t[0] || k[0] || ''); }
function jadwalTeks(p) { return p.tanggal ? tglP(p.tanggal) + ' · ' + p.jam_mulai + '–' + p.jam_selesai + ' WIB' : 'Menunggu penjadwalan Guru BK'; }

// ============================================================ BERANDA SISWA
halaman('beranda', {
  roles: ['siswa'], title: 'Beranda', nav: 'beranda',
  render(el) {
    const b = S.boot, s = b.siswa, amb = (S.cfg || {}).ambang || [];
    const lv = levelInfo(s.level.kode);
    const agenda = (b.permintaan || []).filter((p) => AKTIF.indexOf(p.status) > -1).sort((a, c) => (a.tanggal || '9') < (c.tanggal || '9') ? -1 : 1);
    const ulang = agenda.filter((p) => p.status === 'Dijadwal Ulang').length;
    const kasusAktif = (b.pengaduan || []).filter((p) => p.status !== 'Selesai').length;
    const info = (b.info || []).slice(0, 3);
    const quick = UI.quick([
      { ic: 'heart-handshake', t: 'Konseling', s: 'Ajukan sesi', c: 'indigo', go: '#/konseling' },
      { ic: 'shield-alert', t: 'Lapor Kasus', s: 'Aman & rahasia', c: 'rose', go: '#/lapor' },
      { ic: 'calendar-days', t: 'Jadwal Saya', s: agenda.length ? agenda.length + ' aktif' : 'Belum ada', c: 'blue', go: '#/jadwal', dot: ulang > 0 },
      { ic: 'gauge', t: 'Poin Saya', s: s.poin + ' poin', c: 'orange', go: '#/poin' },
      { ic: 'search-check', t: 'Lacak Laporan', s: kasusAktif ? kasusAktif + ' diproses' : 'Kode lacak', c: 'violet', go: '#/lacak' },
      { ic: 'book-open', t: 'Pusat Info', s: 'Karier & FAQ', c: 'emerald', go: '#/info', baru: (b.info || []).some((a) => a.tanggal >= tambahHari(hariIni(), -3)) }
    ]);
    const agendaHtml = agenda.length ? '<div class="stack s">' + agenda.slice(0, 3).map((p) => p.tanggal
      ? UI.agenda({ tanggal: p.tanggal, judul: p.jenis_layanan, c: (LAYANAN_IC[p.jenis_layanan] || [])[1] || 'indigo', go: '#/jadwal', pill: pill(p.status), meta: [{ ic: 'clock', t: p.jam_mulai + '–' + p.jam_selesai }, { ic: 'map-pin', t: p.lokasi }, { ic: 'user-round', t: p.nama_bk }] })
      : '<div class="item click" data-go="#/jadwal"><span class="ic-c c-amber">' + ic('hourglass', 's') + '</span><div class="grow"><div class="row between"><h4>' + esc(p.jenis_layanan) + '</h4>' + pill(p.status) + '</div><div class="small muted">' + (p.usul ? 'Usulan jadwal baru: ' + esc(tglP(p.usul.tanggal) + ' · ' + p.usul.jam_mulai) : 'Menunggu Guru BK menentukan waktu') + '</div></div></div>').join('') + '</div>'
      : '<div class="card tc"><p class="muted small">Belum ada sesi konseling terjadwal.</p><button class="btn btn-soft btn-sm mt" data-go="#/konseling">' + ic('plus', 's') + ' Ajukan konseling</button></div>';
    const poinCard = '<div class="card c-' + lv.c + '"><div class="row between"><div><div class="xs muted b">POIN KEDISIPLINAN</div><div class="row" style="gap:8px;align-items:baseline"><span style="font-family:var(--f-head);font-weight:700;font-size:32px;color:var(--c)">' + s.poin + '</span><span class="small muted">poin semester ini</span></div></div>' + pill(lv.t, lv.p) + '</div>' +
      UI.ambangBar(s.poin, amb) + '<p class="small muted">' + (s.level.berikut ? 'Tetap semangat! <b>' + s.level.berikut.sisa + ' poin</b> lagi menuju ambang ' + esc(s.level.berikut.jenis) + '.' : s.poin ? 'Kamu sudah melewati semua ambang. Temui Guru BK atau wali kelas, ya.' : 'Pertahankan catatan bersihmu!') + '</p>' +
      '<div class="row between mt"><span class="small">' + ic('trophy', 's') + ' ' + (b.prestasi || []).length + ' prestasi · ' + ((b.rekapHadir || {}).Terlambat || 0) + '× terlambat</span><button class="btn btn-ghost btn-sm" data-go="#/poin">Detail ' + ic('chevron-right', 's') + '</button></div></div>';
    const infoHtml = info.map((a) => '<div class="item click" data-go="#/info/a/' + esc(a.id) + '"><span class="ic-c c-' + ((KAT_IC[a.kategori] || [])[1] || 'indigo') + '">' + ic((KAT_IC[a.kategori] || ['book-open'])[0], 's') + '</span><div class="grow"><div class="xs muted">' + esc(a.kategori) + ' · ' + esc(tglS(a.tanggal)) + '</div><h4 class="ell">' + esc(a.judul) + '</h4></div>' + ic('chevron-right', 's') + '</div>').join('');
    el.innerHTML = UI.hero({ judul: 'Halo, ' + namaDepan(s.nama) + '!', lead: s.kelas + ' · ' + sapaan() + ', semoga harimu menyenangkan.', placeholder: 'Cari layanan, info karier, FAQ...' }) +
      '<div class="wrap">' + UI.banner({ tag: s.kelas + ' · NISN ' + s.nisn, judul: sapaan() + ', ' + namaDepan(s.nama) + '!', teks: 'Butuh teman cerita atau ingin konsultasi studi lanjut? Guru BK siap membantu — semua percakapan bersifat rahasia.', minis: [{ l: 'Sesi aktif', v: agenda.length }, { l: 'Poin', v: s.poin }, { l: 'Prestasi', v: (b.prestasi || []).length }] }) +
      (ulang ? '<div class="alert warn mt-l">' + ic('calendar-clock') + '<div class="grow"><b>Guru BK mengusulkan jadwal baru</b><br>Setujui atau minta waktu lain.</div><button class="btn btn-sm btn-dark" data-go="#/jadwal">Lihat</button></div>' : '') +
      '<div class="cols">' +
      '<div>' + UI.sec('Layanan', quick) + UI.sec('Agenda Terdekat', agendaHtml, { link: ['Semua', '#/jadwal'] }) + '</div>' +
      '<div>' + UI.sec('Ringkasan Poin', poinCard) + (infoHtml ? UI.sec('Info Terbaru', '<div class="stack s">' + infoHtml + '</div>', { link: ['Lihat semua', '#/info'] }) : '') +
      '<div class="lockline mt">' + ic('lock', 's') + ' Cerita dan laporanmu hanya dibaca Guru BK.</div></div></div><div style="height:24px"></div></div>';
  }
});

// ============================================================ AJUKAN KONSELING (2 langkah)
halaman('konseling', {
  roles: ['siswa'], title: 'Ajukan Konseling', nav: 'konseling', live: false,
  render(el) {
    if (!el._k || el._k.step === 'ok') el._k = { step: 1, layanan: '', topik: '', tanggal: '', slot_id: '', tanpaSlot: false, slots: null };
    const k = el._k;
    const aktif = (S.boot.permintaan || []).filter((p) => AKTIF.indexOf(p.status) > -1).length;
    if (k.step === 1) {
      const layanan = (S.cfg || {}).layanan || Object.keys(LAYANAN_IC);
      el.innerHTML = UI.ph('Ajukan Konseling', 'Langkah 1 dari 2 · Pilih layanan', { back: '#/beranda' }) + '<div class="wrap" style="max-width:720px"><div class="mt-l">' + UI.stepper(['Pilih Layanan', 'Pilih Jadwal'], 0) + '</div>' +
        (aktif >= 3 ? '<div class="alert warn mt">' + ic('triangle-alert') + '<div>Kamu sudah memiliki 3 permintaan aktif. Tunggu salah satunya selesai sebelum mengajukan lagi.</div></div>' : '') +
        '<h2 class="mt-l" style="font-size:17px">Layanan apa yang kamu butuhkan?</h2><p class="small muted mb">Pilih satu. Guru BK akan menyesuaikan pendekatannya.</p><div class="stack s">' +
        layanan.map((l) => { const [icn, c] = LAYANAN_IC[l] || ['heart-handshake', 'indigo']; return '<button class="rcard c-' + c + ' ' + (k.layanan === l ? 'on' : '') + '" data-act="lay" data-k="' + esc(l) + '"><span class="ic-box">' + ic(icn) + '</span><div class="grow"><b>' + esc(l) + '</b><div class="small muted">' + esc({ 'Konseling Individu': 'Bicara empat mata tentang masalah pribadi', 'Konseling Kelompok': 'Diskusi bersama teman dengan masalah serupa', 'Konsultasi Karier & Studi Lanjut': 'Jurusan kuliah, SNBP/SNBT, beasiswa, kerja', 'Konsultasi Belajar': 'Cara belajar, motivasi, dan nilai', 'Bimbingan Pribadi & Sosial': 'Pertemanan, keluarga, dan emosi' }[l] || '') + '</div></div><span class="rad"></span></button>'; }).join('') + '</div>' +
        '<div class="field mt-l"><label class="lbl" for="kn-topik">Ceritakan singkat topiknya <span class="opt">Opsional</span></label><textarea class="textarea" id="kn-topik" maxlength="250" data-input="topik" placeholder="Contoh: Bingung memilih jurusan kuliah antara Teknik dan Kedokteran">' + esc(k.topik) + '</textarea><div class="row between"><span class="help">' + ic('lock', 's') + 'Hanya dibaca Guru BK</span><span class="counter" data-cnt>' + k.topik.length + '/250</span></div></div>' +
        '<div class="sticky-act"><button class="btn btn-primary btn-block btn-lg" data-act="lanjut" ' + (k.layanan && aktif < 3 ? '' : 'disabled') + '>Lanjut Pilih Jadwal ' + ic('arrow-right') + '</button></div><div style="height:16px"></div></div>';
      bind(el, {
        lay: (b) => { k.layanan = b.dataset.k; this.render(el); },
        'input:topik': (t) => { k.topik = t.value; el.querySelector('[data-cnt]').textContent = t.value.length + '/250'; },
        lanjut: () => { k.step = 2; this.render(el); window.scrollTo(0, 0); }
      });
      return;
    }
    if (k.step === 2) return konselingLangkah2(el, this);
    if (k.step === 'ok') return;
  }
});

function konselingLangkah2(el, def) {
  const k = el._k;
  const hari = hariIni();
  const slots = k.slots || [];
  const bebas = slots.filter((s) => s.status === 'Tersedia');
  const hariList = [];
  for (let i = 0; i < 21 && hariList.length < 14; i++) { const t = tambahHari(hari, i); if (D(t).getDay() !== 0) hariList.push(t); }
  if (!k.tanggal && bebas.length) k.tanggal = bebas[0].tanggal;
  const hariIniSlot = slots.filter((s) => s.tanggal === k.tanggal);
  const pilih = slots.find((s) => s.slot_id === k.slot_id);
  el.innerHTML = UI.ph('Pilih Jadwal', 'Langkah 2 dari 2 · ' + k.layanan, { back: '#/beranda' }) + '<div class="wrap" style="max-width:720px"><div class="mt-l">' + UI.stepper(['Pilih Layanan', 'Pilih Jadwal'], 1) + '</div>' +
    '<div class="item mt"><span class="ic-c c-' + ((LAYANAN_IC[k.layanan] || [])[1] || 'indigo') + '">' + ic((LAYANAN_IC[k.layanan] || ['heart-handshake'])[0], 's') + '</span><div class="grow"><div class="xs muted">Layanan dipilih</div><b>' + esc(k.layanan) + '</b></div><button class="btn btn-ghost btn-sm" data-act="ubah">Ubah</button></div>' +
    '<h2 class="mt-l" style="font-size:17px">Pilih hari & waktu</h2><p class="small muted mb">Slot yang sudah terisi ditandai tanpa menampilkan nama siswa lain.</p>' +
    (k.slots === null ? skeleton(1, 76) + skeleton(3, 60) :
      '<div class="daychips">' + hariList.map((t) => { const n = bebas.filter((s) => s.tanggal === t).length; const d = D(t); return '<button class="daychip ' + (t === k.tanggal ? 'on' : '') + ' ' + (n ? '' : 'off') + '" data-act="hari" data-k="' + t + '" ' + (n ? '' : 'disabled aria-disabled="true"') + ' aria-label="' + esc(tglP(t)) + ', ' + n + ' slot"><div class="w">' + HARI_S[d.getDay()] + '</div><div class="d">' + d.getDate() + '</div><div class="m">' + (n ? n + ' slot' : '—') + '</div></button>'; }).join('') + '</div>' +
      '<div class="stack s mt">' + (hariIniSlot.length ? hariIniSlot.map((s) => {
        const taken = s.status !== 'Tersedia';
        return '<button class="slotrow ' + (s.slot_id === k.slot_id ? 'on' : '') + ' ' + (taken ? 'taken' : '') + '" data-act="slot" data-k="' + esc(s.slot_id) + '" ' + (taken ? 'disabled' : '') + '><span class="ck">' + ic(s.slot_id === k.slot_id ? 'check' : 'clock', 's') + '</span><div class="grow"><b class="tm">' + esc(s.jam_mulai + ' – ' + s.jam_selesai) + ' WIB</b><div class="small muted">' + esc(s.nama_bk) + ' · ' + esc(s.lokasi) + '</div></div>' + (taken ? pill('Terisi', 'slate') : pill('Tersedia', 'green')) + '</button>';
      }).join('') : emptyState('calendar-x', bebas.length ? 'Pilih hari lain' : 'Belum ada slot terbuka', bebas.length ? 'Tidak ada slot pada hari ini.' : 'Kamu tetap bisa mengirim permintaan, Guru BK akan menentukan waktunya.')) + '</div>') +
    '<button class="rcard mt ' + (k.tanpaSlot ? 'on' : '') + '" data-act="tanpa"><span class="rad"></span><div><b>Belum menemukan waktu yang cocok</b><div class="small muted">Minta Guru BK menjadwalkan untukmu</div></div></button>' +
    '<div class="card mt" style="background:var(--surface-2)"><div class="xs b muted mb-s">RINGKASAN</div>' + UI.kv([['Layanan', k.layanan], ['Jadwal', pilih ? tglP(pilih.tanggal) + ', ' + pilih.jam_mulai + ' WIB' : k.tanpaSlot ? 'Ditentukan Guru BK' : 'Belum dipilih'], ['Guru BK', pilih ? pilih.nama_bk : '-'], ['Topik', k.topik || '-']]) + '</div>' +
    '<div class="sticky-act"><button class="btn btn-primary btn-block btn-lg" data-act="kirim" ' + (pilih || k.tanpaSlot ? '' : 'disabled') + '>' + ic('send') + ' Kirim Permintaan</button></div><div style="height:16px"></div></div>';
  const muat = (paksa) => swr('slot', 'slotTersedia', { hari: 21 }, (d) => { k.slots = d; if (S.current && S.current.el === el && k.step === 2) konselingLangkah2(el, def); }, { fresh: paksa ? 0 : 20000, force: paksa, onError: (r) => { k.slots = []; toast(r.message, 'error'); konselingLangkah2(el, def); } });
  bind(el, {
    ubah: () => { k.step = 1; def.render(el); },
    hari: (b) => { k.tanggal = b.dataset.k; konselingLangkah2(el, def); },
    slot: (b) => { k.slot_id = b.dataset.k; k.tanpaSlot = false; konselingLangkah2(el, def); },
    tanpa: () => { k.tanpaSlot = !k.tanpaSlot; if (k.tanpaSlot) k.slot_id = ''; konselingLangkah2(el, def); },
    kirim: async (btn) => {
      const r = await App.aksi('ajukanKonseling', { jenis_layanan: k.layanan, topik: k.topik, slot_id: k.tanpaSlot ? '' : k.slot_id }, { btn, teks: 'Mengirim...', toast: false });
      if (!r) { if (k.slot_id) { k.slot_id = ''; muat(true); } return; }
      (S.boot.permintaan = S.boot.permintaan || []).unshift(r);
      Store.del(ukey('slot'));
      k.step = 'ok';
      el.innerHTML = UI.ph('Permintaan Terkirim', '', { back: '#/beranda' }) + '<div class="wrap" style="max-width:560px"><div class="card mt-l tc"><span class="avatar l c-emerald" style="margin:6px auto 0">' + ic('check', 'l') + '</span><h2 class="mt">Permintaan terkirim!</h2><p class="muted small">Guru BK akan mengonfirmasi jadwalmu. Kamu akan menerima notifikasi.</p>' +
        '<div class="card flat tight mt tl0" style="background:var(--surface-2);text-align:left">' + UI.kv([['Layanan', r.jenis_layanan], ['Jadwal', jadwalTeks(r)], ['Status', r.status]]) + '</div>' +
        '<div class="stack s mt-l"><button class="btn btn-primary btn-block" data-go="#/jadwal">' + ic('calendar-days') + ' Lihat Jadwal Saya</button><button class="btn btn-outline btn-block" data-go="#/beranda">Kembali ke Beranda</button></div></div></div>';
    }
  });
  if (k.slots === null) muat(false);
}

// ============================================================ JADWAL SAYA
halaman('jadwal', {
  roles: ['siswa'], title: 'Jadwal Saya', nav: 'jadwal',
  render(el) {
    const all = S.boot.permintaan || [];
    const tab = el._t || 'aktif';
    const aktif = all.filter((p) => AKTIF.indexOf(p.status) > -1).sort((a, b) => (a.tanggal || '9') < (b.tanggal || '9') ? -1 : 1);
    const riwayat = all.filter((p) => AKTIF.indexOf(p.status) < 0);
    const list = tab === 'aktif' ? aktif : riwayat;
    el.innerHTML = UI.ph('Jadwal Saya', 'Sesi konseling & status permintaan', { acts: '<button class="btn btn-primary btn-sm" data-go="#/konseling">' + ic('plus', 's') + ' Ajukan</button>' }) + '<div class="wrap" style="max-width:820px">' +
      '<div class="row between mt-l d-only"><p class="muted">Pantau sesi konselingmu. Jadwal tidak menampilkan nama siswa lain.</p><button class="btn btn-primary" data-go="#/konseling">' + ic('plus') + ' Ajukan Konseling</button></div>' +
      '<div class="mt">' + UI.tabs([{ k: 'aktif', l: 'Mendatang', n: aktif.length }, { k: 'riwayat', l: 'Riwayat', n: riwayat.length }], tab, 't') + '</div>' +
      '<div class="stack mt">' + (list.map((p) => {
        const [icn, c] = LAYANAN_IC[p.jenis_layanan] || ['heart-handshake', 'indigo'];
        const t = p.tanggal ? tile(p.tanggal) : null;
        return '<div class="card c-' + c + '"><div class="row top">' + (t ? '<div class="datetile"><span class="m">' + t.m + '</span><span class="d">' + t.d + '</span><span class="w">' + t.w + '</span></div>' : '<span class="datetile">' + ic(icn) + '</span>') +
          '<div class="grow"><div class="row between top"><b>' + esc(p.jenis_layanan) + '</b>' + pill(p.status) + '</div><div class="meta">' + (p.tanggal ? '<span>' + ic('clock', 's') + esc(p.jam_mulai + '–' + p.jam_selesai) + ' WIB</span><span>' + ic('map-pin', 's') + esc(p.lokasi) + '</span>' : '<span>' + ic('hourglass', 's') + 'Menunggu penjadwalan</span>') + (p.nama_bk ? '<span>' + ic('user-round', 's') + esc(p.nama_bk) + '</span>' : '') + '</div>' +
          (p.topik ? '<p class="quote mt">' + esc(p.topik) + '</p>' : '') + '<div class="xs muted mt">Diajukan ' + esc(relatif(p.dibuat)) + '</div></div></div>' +
          (p.status === 'Dijadwal Ulang' && p.usul ? '<div class="alert warn mt">' + ic('calendar-clock') + '<div class="grow"><b>Usulan jadwal baru</b><br>' + esc(tglP(p.usul.tanggal) + ' · ' + p.usul.jam_mulai + '–' + p.usul.jam_selesai + ' WIB · ' + p.usul.lokasi) + (p.catatan_bk ? '<br><i>"' + esc(p.catatan_bk) + '"</i>' : '') + '</div></div>' +
            '<div class="btns mt"><button class="btn btn-primary btn-sm" data-act="setuju" data-id="' + esc(p.id) + '">' + ic('check', 's') + ' Setujui Jadwal Baru</button><button class="btn btn-outline btn-sm" data-act="lain" data-id="' + esc(p.id) + '">Minta Waktu Lain</button></div>' :
            (p.catatan_bk && (p.status === 'Ditolak' || p.status === 'Selesai' || p.status === 'Menunggu') ? '<div class="alert ' + (p.status === 'Ditolak' ? 'err' : 'info') + ' mt">' + ic('message-square') + '<div><b>Catatan Guru BK</b><br>' + esc(p.catatan_bk) + '</div></div>' : '')) +
          (AKTIF.indexOf(p.status) > -1 ? '<div class="row between mt"><span class="xs muted">' + (p.status === 'Dijadwalkan' ? ic('bell', 's') + ' Pengingat dikirim sehari sebelumnya' : '') + '</span><button class="btn btn-ghost btn-sm" data-act="batal" data-id="' + esc(p.id) + '" style="color:#DC2626">' + ic('x', 's') + ' Batalkan</button></div>' : '') + '</div>';
      }).join('') || emptyState('calendar-heart', tab === 'aktif' ? 'Belum ada jadwal' : 'Belum ada riwayat', tab === 'aktif' ? 'Ajukan sesi konseling kapan pun kamu butuh teman bicara.' : '', tab === 'aktif' ? '<button class="btn btn-primary mt" data-go="#/konseling">' + ic('plus') + ' Ajukan Konseling</button>' : '')) + '</div>' +
      '<div class="lockline mt-l">' + ic('lock', 's') + ' Topik dan catatan sesi hanya dapat dibaca Guru BK.</div><div style="height:24px"></div></div>';
    const ubah = (id, patch) => { const p = all.find((x) => x.id === id); if (p) Object.assign(p, patch); this.render(el); };
    bind(el, {
      t: (b) => { el._t = b.dataset.k; this.render(el); },
      setuju: async (b) => { const p = all.find((x) => x.id === b.dataset.id); const r = await App.aksi('responJadwalUlang', { id: p.id, setuju: true }, { btn: b }); if (r) ubah(p.id, Object.assign({ status: 'Dijadwalkan' }, p.usul, { usul: null })); },
      lain: async (b) => { const r = await App.aksi('responJadwalUlang', { id: b.dataset.id, setuju: false }, { btn: b }); if (r) ubah(b.dataset.id, { status: 'Menunggu', usul: null, tanggal: '', catatan_bk: 'Siswa meminta waktu lain.' }); },
      batal: async (b) => {
        if (!(await konfirmasi({ title: 'Batalkan permintaan?', text: 'Slot jadwalmu akan dibuka kembali untuk siswa lain.', ok: 'Ya, batalkan', danger: true }))) return;
        const r = await App.aksi('batalPermintaan', { id: b.dataset.id }, { btn: b });
        if (r) ubah(b.dataset.id, { status: 'Dibatalkan' });
      }
    });
  }
});

// ============================================================ LAPOR KASUS
halaman('lapor', {
  roles: ['siswa'], title: 'Lapor Kasus', nav: 'lapor', live: false,
  render(el) {
    if (el._sukses) { el._sukses = null; el._d = null; }
    const d = el._d = el._d || { kategori: '', peran: 'korban', mode: 'Terbatas', pihak: '', kronologi: '', berkas: [], setuju: false };
    const kats = (S.cfg || {}).kategoriAduan || Object.keys(ADUAN_IC);
    const prio = ((S.cfg || {}).kategoriPrioritas || []).indexOf(d.kategori) > -1;
    const MODE = [['Terbuka', 'eye', 'Identitasmu boleh diketahui pihak sekolah yang menangani.'], ['Terbatas', 'user-lock', 'Identitasmu hanya diketahui Guru BK. (Disarankan)'], ['Anonim', 'venetian-mask', 'Tidak ada identitas yang disimpan. Pantau lewat kode lacak.']];
    el.innerHTML = UI.ph('Lapor Kasus', 'Aman, rahasia, dan bisa anonim', { back: '#/beranda' }) + '<div class="wrap" style="max-width:760px">' +
      '<div class="card mt-l" style="background:var(--conf);color:#E2E8F0;border:0"><div class="row top"><span class="avatar s" style="background:rgba(255,255,255,.14);color:#fff">' + ic('shield-check', 's') + '</span><div><b style="color:#fff">Kamu tidak sendirian.</b><p class="small" style="opacity:.85;margin-top:2px">Laporanmu langsung diterima Guru BK. Pilih "Anonim" jika kamu tidak ingin identitasmu tersimpan.</p></div></div></div>' +
      '<div class="alert err mt">' + ic('siren') + '<div><b>Dalam bahaya sekarang?</b> Segera temui guru piket atau Guru BK terdekat, atau hubungi 112.</div></div>' +
      '<form data-form="lapor" novalidate>' +
      '<h3 class="mt-l mb">1. Apa yang terjadi? <span class="req">*</span></h3><div class="grid-quick" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">' +
      kats.map((k) => '<button type="button" class="rcard ' + (d.kategori === k ? 'on' : '') + '" data-act="kat" data-k="' + esc(k) + '" style="flex-direction:column;align-items:flex-start;gap:8px;min-height:92px"><span class="ic-box">' + ic(ADUAN_IC[k] || 'circle-ellipsis') + '</span><b class="small" style="line-height:1.3">' + esc(k) + '</b></button>').join('') + '</div>' +
      (prio ? '<div class="alert warn mt">' + ic('zap') + '<div>Kategori ini <b>diprioritaskan</b>. Guru BK menerima pemberitahuan segera.</div></div>' : '') +
      '<h3 class="mt-l mb">2. Kamu sebagai</h3>' + UI.seg([{ k: 'korban', l: 'Korban', ic: 'user-round' }, { k: 'saksi', l: 'Saksi', ic: 'eye' }], d.peran, 'peran') +
      '<h3 class="mt-l mb">3. Pilihan identitas</h3><div class="stack s">' + MODE.map((m) => '<button type="button" class="rcard ' + (d.mode === m[0] ? 'on' : '') + '" data-act="mode" data-k="' + m[0] + '"><span class="ic-box">' + ic(m[1]) + '</span><div class="grow"><b>' + m[0] + '</b><div class="small muted">' + m[2] + '</div></div><span class="rad"></span></button>').join('') + '</div>' +
      '<h3 class="mt-l mb">4. Ceritakan kejadiannya</h3>' +
      '<div class="field"><label class="lbl" for="lp-pihak">Pihak yang terlibat <span class="opt">Opsional</span></label><input class="input" id="lp-pihak" maxlength="200" data-input="pihak" value="' + esc(d.pihak) + '" placeholder="Contoh: Beberapa siswa kelas XI"></div>' +
      '<div class="field"><label class="lbl" for="lp-krono">Kronologi <span class="req">*</span></label><textarea class="textarea" id="lp-krono" rows="6" maxlength="3000" data-input="krono" placeholder="Kapan, di mana, dan apa yang terjadi? Tulis sesuai yang kamu ingat.">' + esc(d.kronologi) + '</textarea><div class="row between"><span class="help">Minimal 15 karakter</span><span class="counter" data-cnt>' + d.kronologi.length + '/3000</span></div></div>' +
      '<div class="field"><label class="lbl">Bukti pendukung <span class="opt">Opsional · maks. 2 berkas, 5 MB</span></label>' +
      (d.berkas.length < 2 ? '<label class="drop"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,audio/*" data-change="file"><span class="ic">' + ic('upload') + '</span><b>Unggah foto, PDF, atau rekaman suara</b><span class="xs">Ketuk untuk memilih berkas</span></label>' : '') +
      '<div class="stack s mt">' + d.berkas.map((f, i) => UI.fileRow(f, i, 'hapusF')).join('') + '</div></div>' +
      '<label class="row top mt" style="cursor:pointer"><input type="checkbox" data-change="setuju" ' + (d.setuju ? 'checked' : '') + ' style="width:20px;height:20px;margin-top:2px;accent-color:var(--primary)"><span class="small">Saya menyatakan laporan ini dibuat dengan jujur dan memahami bahwa Guru BK akan menindaklanjutinya secara rahasia.</span></label>' +
      '<div data-err class="mt"></div><div class="sticky-act"><button class="btn btn-primary btn-block btn-lg" type="submit">' + ic('send') + ' Kirim Laporan</button></div></form><div style="height:16px"></div></div>';
    bind(el, {
      kat: (b) => { d.kategori = b.dataset.k; this.render(el); },
      peran: (b) => { d.peran = b.dataset.k; this.render(el); },
      mode: (b) => { d.mode = b.dataset.k; this.render(el); },
      'input:pihak': (i) => (d.pihak = i.value),
      'input:krono': (t) => { d.kronologi = t.value; el.querySelector('[data-cnt]').textContent = t.value.length + '/3000'; },
      'change:setuju': (c) => (d.setuju = c.checked),
      'change:file': async (inp) => {
        try { const f = await bacaBerkas(inp.files[0], { maxMB: 5 }); d.berkas.push(f); this.render(el); }
        catch (e) { toast(e.message, 'error'); inp.value = ''; }
      },
      hapusF: (b) => { d.berkas.splice(+b.dataset.i, 1); this.render(el); },
      'submit:lapor': async (f) => {
        const err = (m) => { f.querySelector('[data-err]').innerHTML = '<div class="alert err">' + ic('circle-alert') + '<div>' + esc(m) + '</div></div>'; };
        if (!d.kategori) return err('Pilih kategori kejadian terlebih dahulu.');
        if (d.kronologi.trim().length < 15) return err('Ceritakan kejadiannya sedikit lebih lengkap (minimal 15 karakter).');
        if (!d.setuju) return err('Centang pernyataan kejujuran laporan.');
        const r = await App.aksi('kirimPengaduan', { kategori: d.kategori, peran: d.peran, mode: d.mode, pihak: d.pihak, kronologi: d.kronologi, berkas: d.berkas.map((x) => ({ nama: x.nama, mime: x.mime, data: x.data })) }, { btn: f.querySelector('[type=submit]'), teks: 'Mengirim laporan...', toast: false });
        if (!r) return;
        if (r.mode !== 'Anonim') (S.boot.pengaduan = S.boot.pengaduan || []).unshift({ id: r.id, kode_lacak: r.kode_lacak, kategori: d.kategori, status: 'Baru', mode: r.mode, dibuat: new Date().toISOString().slice(0, 16).replace('T', ' ') });
        el._sukses = r;
        laporSukses(el, r);
      }
    });
  }
});
function laporSukses(el, r) {
  const anon = r.mode === 'Anonim';
  el.innerHTML = UI.ph('Laporan Terkirim', '', { back: '#/beranda' }) + '<div class="wrap" style="max-width:560px"><div class="card mt-l tc"><span class="avatar l c-emerald" style="margin:6px auto 0">' + ic('shield-check', 'l') + '</span>' +
    '<h2 class="mt">Laporanmu sudah kami terima</h2><p class="small muted">' + (r.prioritas ? 'Laporan ini diprioritaskan. Guru BK segera menindaklanjuti.' : 'Guru BK akan meninjau laporanmu secepatnya.') + '</p>' +
    '<div class="codebox mt-l"><div class="xs b muted">KODE LACAK</div><div class="code" data-kode>' + esc(r.kode_lacak) + '</div><button class="btn btn-soft btn-sm mt" data-act="salin">' + ic('copy', 's') + ' Salin kode</button></div>' +
    '<p class="small mt" style="color:var(--text-2)">' + (anon ? 'Karena laporanmu <b>anonim</b>, kode ini satu-satunya cara memantau progres. Catat atau simpan baik-baik.' : 'Kamu juga bisa memantaunya di menu Lacak Laporan.') + '</p>' +
    (anon ? '<label class="row top mt" style="cursor:pointer;text-align:left"><input type="checkbox" data-change="simpan" style="width:20px;height:20px;accent-color:var(--primary)"><span class="small">Simpan kode di perangkat ini saja (tidak dikirim ke server). Jangan centang bila perangkat dipakai bersama.</span></label>' : '') +
    '<div class="stack s mt-l"><button class="btn btn-primary btn-block" data-go="#/lacak/' + esc(r.kode_lacak) + '">' + ic('search-check') + ' Lacak Status</button><button class="btn btn-outline btn-block" data-go="#/beranda">Kembali ke Beranda</button></div></div></div>';
  if (!anon) simpanKodeLokal(r.kode_lacak);
  bind(el, {
    salin: () => salin(r.kode_lacak),
    'change:simpan': (c) => (c.checked ? simpanKodeLokal(r.kode_lacak) : Store.set(ukey('kode-lacak'), Store.get(ukey('kode-lacak'), []).filter((x) => x !== r.kode_lacak)))
  });
}
function simpanKodeLokal(kode) { Store.set(ukey('kode-lacak'), [kode].concat(Store.get(ukey('kode-lacak'), []).filter((x) => x !== kode)).slice(0, 10)); }

// ============================================================ LACAK (di dalam aplikasi)
halaman('lacak', {
  roles: ['siswa'], title: 'Lacak Laporan', nav: 'lacak',
  render(el, p) {
    const milik = S.boot.pengaduan || [];
    const lokal = Store.get(ukey('kode-lacak'), []).filter((k) => !milik.some((m) => m.kode_lacak === k));
    if (p[0]) {
      const isi = (r) => (r.success ? '<div class="row between mb"><span class="mono b">' + esc(r.data.kode) + '</span>' + pill(r.data.status) + '</div>' + hasilLacak(r.data) : emptyState('search-x', 'Laporan tidak ditemukan', r.message));
      const c = (el._lk = el._lk || {})[p[0]];
      el.innerHTML = UI.ph('Status Laporan', p[0], { back: '#/lacak' }) + '<div class="wrap" style="max-width:720px"><div class="card mt-l" data-h>' + (c ? isi(c.r) : skeleton(4, 50)) + '</div><button class="btn btn-ghost mt" data-act="segar">' + ic('refresh-cw', 's') + ' Perbarui status</button></div>';
      const ambil = () => api('lacakLaporan', { kode: p[0] }).then((r) => { el._lk[p[0]] = { r, t: Date.now() }; const h = el.querySelector('[data-h]'); if (h && S.current && S.current.el === el) h.innerHTML = isi(r); });
      if (!c || Date.now() - c.t > 60000) ambil();
      bind(el, { segar: () => { const h = el.querySelector('[data-h]'); h.innerHTML = skeleton(4, 50); ambil(); } });
      return;
    }
    el.innerHTML = UI.ph('Lacak Laporan', 'Pantau progres laporan kasusmu') + '<div class="wrap" style="max-width:720px">' +
      '<form class="card mt-l" data-form="cari"><label class="lbl" for="lk-kode">Masukkan kode lacak</label><div class="row"><div class="search-in grow">' + ic('key-round', 's') + '<input class="input mono" id="lk-kode" name="kode" placeholder="NXR-XXXXXX" style="text-transform:uppercase" required></div><button class="btn btn-primary" type="submit">' + ic('search', 's') + ' Lacak</button></div></form>' +
      UI.sec('Laporan Saya', milik.length ? '<div class="list">' + milik.map((x) => '<div class="item click" data-go="#/lacak/' + esc(x.kode_lacak) + '"><span class="ic-c c-rose">' + ic(ADUAN_IC[x.kategori] || 'shield-alert', 's') + '</span><div class="grow"><div class="row between"><h4>' + esc(x.kategori) + '</h4>' + pill(x.status) + '</div><div class="meta"><span class="mono">' + esc(x.kode_lacak) + '</span><span>' + esc(tgl(x.dibuat)) + '</span><span>' + esc(x.mode) + '</span></div></div></div>').join('') + '</div>'
        : emptyState('inbox', 'Belum ada laporan', 'Laporan anonim tidak tercantum di sini. Gunakan kode lacak untuk memantaunya.')) +
      (lokal.length ? UI.sec('Kode tersimpan di perangkat ini', '<div class="list">' + lokal.map((k) => '<div class="item"><span class="ic-c c-violet">' + ic('venetian-mask', 's') + '</span><div class="grow"><b class="mono">' + esc(k) + '</b><div class="xs muted">Laporan anonim</div></div><button class="btn btn-soft btn-sm" data-go="#/lacak/' + esc(k) + '">Lacak</button><button class="icon-btn" data-act="hapus" data-k="' + esc(k) + '" aria-label="Hapus kode dari perangkat">' + ic('trash-2', 's') + '</button></div>').join('') + '</div>') : '') +
      '<div class="alert info mt-l">' + ic('lock') + '<div>Halaman lacak hanya menampilkan progres penanganan, bukan isi catatan konseling.</div></div><div style="height:24px"></div></div>';
    bind(el, {
      'submit:cari': (f) => { const k = formData(f).kode.toUpperCase(); if (k) go('#/lacak/' + k); },
      hapus: (b) => { Store.set(ukey('kode-lacak'), Store.get(ukey('kode-lacak'), []).filter((x) => x !== b.dataset.k)); this.render(el, p); }
    });
  }
});

// ============================================================ POIN & RIWAYAT (siswa & orang tua)
halaman('poin', {
  roles: ['siswa', 'ortu'], title: (p) => (S.role === 'ortu' ? 'Poin & Presensi' : 'Poin & Riwayat'), nav: 'poin',
  render(el, p) {
    const b = S.boot, s = b.siswa, amb = (S.cfg || {}).ambang || [];
    const lv = levelInfo(s.level.kode);
    const tab = el._t || (p[0] === 'hadir' ? 'hadir' : 'pel');
    const rh = b.rekapHadir || {};
    const ortu = S.role === 'ortu';
    const isi = {
      pel: (b.pelanggaran || []).map((x) => '<div class="item c-orange"><span class="ic-c">' + ic('triangle-alert', 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(x.nama) + '</h4>' + pill('+' + x.poin, 'red') + '</div><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(x.tanggal) + (x.jam ? ', ' + x.jam : '')) + '</span><span>' + ic('tag', 's') + esc(x.kategori) + '</span></div>' + (x.keterangan ? '<p class="small muted mt" style="margin-top:4px">' + esc(x.keterangan) + '</p>' : '') + '<div class="xs muted" style="margin-top:4px">Dicatat oleh ' + esc(x.pencatat) + '</div>' + (x.bukti ? '<button class="btn btn-ghost btn-sm" data-act="bukti" data-j="pelanggaran" data-id="' + esc(x.id) + '">' + ic('image', 's') + ' Lihat bukti</button>' : '') + '</div></div>').join(''),
      pres: (b.prestasi || []).map((x) => '<div class="item c-amber"><span class="ic-c">' + ic('trophy', 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(x.nama) + '</h4>' + pill(x.tingkat, 'amber') + '</div><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(x.tanggal)) + '</span></div>' + (x.keterangan ? '<p class="small muted" style="margin-top:4px">' + esc(x.keterangan) + '</p>' : '') + (x.bukti ? '<button class="btn btn-ghost btn-sm" data-act="bukti" data-j="prestasi" data-id="' + esc(x.id) + '">' + ic('image', 's') + ' Lihat sertifikat</button>' : '') + '</div></div>').join(''),
      hadir: (b.kehadiran || []).map((x) => '<div class="item c-' + ({ Terlambat: 'rose', 'Izin Keluar': 'blue', Sakit: 'amber', Izin: 'violet', Alpa: 'rose' }[x.jenis] || 'slate') + '"><span class="ic-c">' + ic({ Terlambat: 'alarm-clock', 'Izin Keluar': 'door-open', Sakit: 'thermometer', Izin: 'file-check', Alpa: 'circle-x' }[x.jenis] || 'clock', 's') + '</span><div class="grow"><div class="row between"><h4>' + esc(x.jenis) + '</h4>' + pill(x.jenis) + '</div><div class="meta"><span>' + ic('calendar', 's') + esc(tgl(x.tanggal)) + '</span><span>' + ic('clock', 's') + esc(x.jam + (x.jam_kembali ? ' – ' + x.jam_kembali : '')) + '</span></div>' + (x.alasan ? '<p class="small muted" style="margin-top:4px">' + esc(x.alasan) + '</p>' : '') + '</div></div>').join('')
    };
    el.innerHTML = UI.ph(ortu ? 'Poin & Presensi' : 'Poin & Riwayat', ortu ? s.nama + ' · ' + s.kelas : 'Semester berjalan sejak ' + tgl((S.cfg || {}).periode)) + '<div class="wrap" style="max-width:900px">' +
      '<div class="cols mt-l"><div class="card c-' + lv.c + '"><div class="row between"><div><div class="xs muted b">TOTAL POIN PELANGGARAN</div><div style="font-family:var(--f-head);font-weight:700;font-size:44px;line-height:1.1;color:var(--c)">' + s.poin + '</div><div class="small muted">' + esc(s.level.label) + '</div></div><div class="tc">' + pill(lv.t, lv.p, 'l') + '</div></div>' + UI.ambangBar(s.poin, amb) +
      '<p class="small" style="color:var(--text-2)">' + (s.level.berikut ? '<b>' + s.level.berikut.sisa + ' poin</b> lagi menuju ambang ' + esc(((S.cfg || {}).labelSurat || {})[s.level.berikut.jenis] || s.level.berikut.jenis) + '.' : s.poin ? 'Seluruh ambang sudah terlewati.' : 'Belum ada catatan pelanggaran. Pertahankan!') + '</p></div>' +
      '<div class="card"><h3 class="mb">Rekap kehadiran</h3><div class="grid2" style="gap:10px">' + [['Terlambat', 'rose', 'alarm-clock'], ['Izin Keluar', 'blue', 'door-open'], ['Sakit', 'amber', 'thermometer'], ['Izin', 'violet', 'file-check'], ['Alpa', 'rose', 'circle-x']].map((x) => '<div class="row c-' + x[1] + '" style="gap:8px"><span class="avatar s" style="background:var(--t);color:var(--c)">' + ic(x[2], 's') + '</span><div><b>' + (rh[x[0]] || 0) + '</b><div class="xs muted">' + x[0] + '</div></div></div>').join('') + '</div></div></div>' +
      '<div class="mt-l">' + UI.tabs([{ k: 'pel', l: 'Pelanggaran', n: (b.pelanggaran || []).length }, { k: 'pres', l: 'Prestasi', n: (b.prestasi || []).length }, { k: 'hadir', l: 'Kehadiran', n: (b.kehadiran || []).length }], tab, 't') + '</div>' +
      '<div class="list mt">' + (isi[tab] || emptyState(tab === 'pres' ? 'trophy' : 'circle-check', tab === 'pres' ? 'Belum ada prestasi' : 'Tidak ada catatan', tab === 'pel' ? 'Belum ada pelanggaran pada semester ini.' : '')) + '</div>' +
      (ortu && s.wali ? '<div class="card mt-l"><div class="row"><span class="avatar c-teal">' + ic('school', 's') + '</span><div class="grow"><div class="xs muted">Ada pertanyaan? Hubungi wali kelas</div><b>' + esc(s.wali.nama) + '</b></div>' + (s.wali.no_wa ? '<a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="' + waLink(s.wali.no_wa) + '">' + ic('message-circle', 's') + ' WhatsApp</a>' : '') + '</div></div>' : '') +
      '<div style="height:24px"></div></div>';
    bind(el, { t: (x) => { el._t = x.dataset.k; this.render(el, p); }, bukti: (x) => lihatBerkas(x.dataset.j, x.dataset.id, 0, x) });
  }
});

// ============================================================ BERANDA ORANG TUA
halaman('beranda', {
  roles: ['ortu'], title: 'Beranda', nav: 'beranda',
  render(el) {
    const b = S.boot, s = b.siswa, amb = (S.cfg || {}).ambang || [];
    const lv = levelInfo(s.level.kode);
    const perluKonf = (b.surat || []).filter((x) => x.jadwal_pertemuan && !x.konfirmasi && x.jadwal_pertemuan.slice(0, 10) >= hariIni());
    const akt = [].concat(
      (b.pelanggaran || []).map((x) => ({ t: x.tanggal + (x.jam || ''), ic: 'triangle-alert', c: 'orange', j: x.nama, s: '+' + x.poin + ' poin · ' + x.pencatat.replace(/\s*\(.*\)$/, ''), w: x.tanggal, pl: pill('+' + x.poin, 'red') })),
      (b.prestasi || []).map((x) => ({ t: x.tanggal, ic: 'trophy', c: 'amber', j: x.nama, s: 'Prestasi tingkat ' + x.tingkat, w: x.tanggal, pl: pill('Prestasi', 'amber') })),
      (b.kehadiran || []).map((x) => ({ t: x.tanggal + (x.jam || ''), ic: HADIR_IC[x.jenis] || 'clock', c: HADIR_C[x.jenis] || 'slate', j: x.jenis, s: (x.jam ? 'Pukul ' + x.jam : '') + (x.alasan ? ' · ' + x.alasan : ''), w: x.tanggal, pl: pill(x.jenis) }))
    ).sort((a, c) => (a.t < c.t ? 1 : -1)).slice(0, 6);
    const anak = '<div class="card"><div class="row">' + avatar(s.nama, 'l') + '<div class="grow"><div class="xs muted">Putra/putri Anda</div><h2 style="font-size:17px">' + esc(s.nama) + '</h2><div class="small muted">' + esc(s.kelas) + ' · NISN ' + esc(s.nisn) + '</div></div></div>' +
      '<div class="row between mt-l c-' + lv.c + '"><div><div class="xs muted b">POIN SEMESTER INI</div><span style="font-family:var(--f-head);font-weight:700;font-size:30px;color:var(--c)">' + s.poin + '</span></div>' + pill(lv.t, lv.p, 'l') + '</div>' + UI.ambangBar(s.poin, amb) +
      '<div class="row between"><span class="small muted">' + ((b.rekapHadir || {}).Terlambat || 0) + '× terlambat · ' + (b.prestasi || []).length + ' prestasi</span><button class="btn btn-ghost btn-sm" data-go="#/poin">Detail ' + ic('chevron-right', 's') + '</button></div></div>';
    el.innerHTML = UI.hero({ judul: sapaan() + ', Bapak/Ibu', lead: 'Pantau perkembangan ' + namaDepan(s.nama) + ' di sekolah.', kecil: 'Portal Orang Tua', placeholder: 'Cari menu atau informasi sekolah...' }) +
      '<div class="wrap">' + UI.banner({ tag: 'Portal Orang Tua', judul: sapaan() + ', Bapak/Ibu ' + (s.nama_ortu || ''), teks: 'Pantau kedisiplinan, presensi, prestasi, dan surat resmi untuk ' + s.nama + '.', minis: [{ l: 'Poin', v: s.poin }, { l: 'Prestasi', v: (b.prestasi || []).length }, { l: 'Surat', v: (b.surat || []).length }] }) +
      (perluKonf.length ? '<div class="card mt-l" style="border:2px solid var(--rose);background:#FFF1F2"><div class="row top"><span class="avatar s" style="background:#F43F5E;color:#fff">' + ic('mail-warning', 's') + '</span><div class="grow"><b style="color:#9F1239">Surat menunggu konfirmasi Anda</b><p class="small" style="color:#881337">' + esc(((S.cfg || {}).labelSurat || {})[perluKonf[0].jenis] || perluKonf[0].jenis) + ' · pertemuan ' + esc(tglP(perluKonf[0].jadwal_pertemuan)) + ', ' + esc(jam(perluKonf[0].jadwal_pertemuan)) + ' WIB</p></div></div><button class="btn btn-danger btn-block mt" data-go="#/surat/' + esc(perluKonf[0].id) + '/konfirmasi">' + ic('circle-check') + ' Konfirmasi Kehadiran</button></div>' : '') +
      '<div class="cols"><div>' + UI.sec('', anak) +
      UI.sec('Menu', UI.quick([
        { ic: 'gauge', t: 'Poin & Riwayat', s: s.poin + ' poin', c: 'orange', go: '#/poin' },
        { ic: 'calendar-check', t: 'Presensi', s: ((b.rekapHadir || {}).Terlambat || 0) + '× terlambat', c: 'emerald', go: '#/poin/hadir' },
        { ic: 'mail', t: 'Surat Resmi', s: (b.surat || []).length + ' surat', c: 'violet', go: '#/surat', dot: perluKonf.length > 0 },
        { ic: 'book-open', t: 'Info Sekolah', s: 'Pengumuman', c: 'blue', go: '#/info' }
      ]).replace('grid-quick', 'grid-quick q2')) + '</div>' +
      '<div>' + UI.sec('Aktivitas Terbaru', akt.length ? '<div class="list">' + akt.map((a) => '<div class="item c-' + a.c + '"><span class="ic-c">' + ic(a.ic, 's') + '</span><div class="grow"><div class="row between top"><h4>' + esc(a.j) + '</h4>' + a.pl + '</div><div class="small muted">' + esc(a.s) + '</div><div class="xs muted" style="margin-top:2px">' + esc(relatif(a.w)) + '</div></div></div>').join('') + '</div>' : emptyState('circle-check', 'Belum ada catatan', 'Belum ada aktivitas tercatat semester ini.'), { link: ['Semua', '#/poin'] }) +
      (s.wali ? '<div class="card mt"><div class="row"><span class="avatar c-teal">' + ic('school', 's') + '</span><div class="grow"><div class="xs muted">Wali kelas ' + esc(s.kelas) + '</div><b>' + esc(s.wali.nama) + '</b></div>' + (s.wali.no_wa ? '<a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="' + waLink(s.wali.no_wa) + '">' + ic('message-circle', 's') + ' Hubungi</a>' : '') + '</div></div>' : '') +
      '</div></div><div style="height:24px"></div></div>';
  }
});
