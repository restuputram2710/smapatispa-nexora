/* ============================================================
   SMAPATISPA NEXORA — admin.js : panel Admin
   Beranda · Pengguna & data induk · Impor Excel · Identitas aplikasi
   WA & Email · Templat surat · Log aktivitas
   ============================================================ */
'use strict';

const PERAN_STAF = ['admin', 'bk', 'kesiswaan', 'wali', 'piket', 'kepsek'];
const PERAN_C = { admin: 'dark', bk: 'indigo', kesiswaan: 'orange', wali: 'blue', piket: 'green', kepsek: 'violet' };

/** Tampilkan akun & kata sandi awal (hanya sekali) + unduh Excel. */
function akunModal(list, judul) {
  const siswa = list.some((a) => a.sandi_siswa);
  const rows = list.map((a) => siswa ? { NISN: a.nisn, Nama: a.nama, Kelas: a.kelas, 'Sandi Siswa': a.sandi_siswa, 'Sandi Orang Tua': a.sandi_ortu } : { 'NIP/Username': a.id || a.nip, Nama: a.nama, Peran: a.peran || '', 'Kata Sandi Awal': a.sandi });
  const kol = Object.keys(rows[0] || {});
  const m = Modal.open({
    title: judul || 'Akun & kata sandi awal', size: 'lg', dismiss: false,
    body: '<div class="alert warn mb">' + ic('key-round') + '<div><b>Kata sandi hanya ditampilkan sekali.</b> Unduh atau salin sekarang, lalu bagikan secara pribadi. Pengguna wajib menggantinya saat pertama masuk.</div></div>' +
      '<div class="table-wrap" style="max-height:50vh;overflow:auto"><table class="tbl"><thead><tr>' + kol.map((k) => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + kol.map((k) => '<td class="' + (/Sandi/.test(k) ? 'mono' : '') + '">' + esc(r[k]) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>',
    foot: '<button class="btn btn-outline" data-act="salin">' + ic('copy', 's') + ' Salin</button><button class="btn btn-outline" data-act="xlsx">' + ic('file-spreadsheet', 's') + ' Unduh Excel</button><button class="btn btn-primary" data-act="tutup">Selesai</button>',
    handlers: {
      salin: () => salin(rows.map((r) => kol.map((k) => k + ': ' + r[k]).join(' | ')).join('\n')),
      xlsx: () => eksporExcel('Akun ' + (siswa ? 'Siswa' : 'Staf') + ' ' + hariIni(), { Akun: rows }),
      tutup: () => m.close()
    }
  });
}
async function resetSandiModal(tipe, id, nama) {
  if (!(await konfirmasi({ title: 'Reset kata sandi?', text: 'Kata sandi ' + nama + ' akan diganti sandi acak baru dan semua sesi aktifnya diakhiri.', ok: 'Reset', danger: true }))) return;
  const r = await App.aksi('resetSandi', { tipe, id }, { segarkan: false });
  if (r) akunModal([{ id: r.id, nama: r.nama, peran: tipe === 'staf' ? 'Staf' : tipe === 'ortu' ? 'Orang tua' : 'Siswa', sandi: r.sandi }], 'Kata sandi baru');
}

// ============================================================ BERANDA ADMIN
halaman('beranda', {
  roles: ['admin'], title: 'Beranda Admin', nav: 'beranda',
  render(el) {
    const b = S.boot, st = b.stats || {}, pg = b.pengaturan || {}, an = (b.antrean || {}).jumlah || {};
    const contoh = (b.kelas || []).some((k) => k.tahun_ajaran === 'CONTOH');
    const awalStaf = (b.pengguna || []).filter((u) => u.aktif && u.wajib_ganti).length;
    const awalSiswa = (b.siswa || []).filter((s) => s.aktif && s.sandi_awal_siswa).length;
    const cek = [
      [!!pg.logo_data && pg.nama_app, 'Identitas & logo aplikasi', 'Unggah logo dan sesuaikan warna.', '#/identitas'],
      [!!pg.url_aplikasi, 'Alamat aplikasi (URL GitHub Pages)', 'Dibutuhkan untuk kode QR verifikasi surat.', '#/identitas'],
      [pg.fonnte_token_terisi && pg.wa_aktif, 'Notifikasi WhatsApp (Fonnte)', pg.fonnte_token_terisi ? 'Token tersimpan. Aktifkan saklar WA.' : 'Opsional — isi token saat berlangganan.', '#/notif-set', true],
      [pg.ada_ttd_kepsek, 'Tanda tangan Kepala Sekolah', 'Diatur oleh akun Kepala Sekolah di menu Lainnya.', '', true],
      [!contoh, 'Data contoh dihapus', 'Jalankan fungsi hapusDataContoh() di editor Apps Script sebelum dipakai resmi.', ''],
      [(b.kelas || []).filter((k) => k.tahun_ajaran !== 'CONTOH').length > 0, 'Data kelas, guru & siswa diimpor', 'Gunakan Impor Excel di menu Pengguna.', '#/pengguna']
    ];
    const siap = cek.filter((c) => c[0]).length;
    el.innerHTML = heroStaf('Panel Admin', (st.siswa || 0) + ' siswa · ' + (st.guru || 0) + ' guru & staf · ' + (st.kelas || 0) + ' kelas') +
      '<div class="wrap">' + UI.banner({ tag: 'Admin · ' + (pg.nama_sekolah || ''), judul: sapaan() + ', ' + S.me.nama.split(',')[0], teks: 'Kelola akun, data induk, identitas aplikasi, notifikasi, dan templat surat. Admin tidak dapat membuka catatan konseling rahasia.', minis: [{ l: 'Kesiapan', v: siap + '/' + cek.length }] }) +
      '<div class="stats mt-l">' + UI.stat({ lbl: 'Siswa Aktif', v: st.siswa || 0, ic: 'graduation-cap', c: 'indigo', go: '#/pengguna', foot: awalSiswa + ' belum ganti sandi' }) + UI.stat({ lbl: 'Guru & Staf', v: st.guru || 0, ic: 'users', c: 'teal', go: '#/pengguna', foot: awalStaf + ' belum ganti sandi' }) +
      UI.stat({ lbl: 'Kelas', v: st.kelas || 0, ic: 'school', c: 'blue', go: '#/pengguna' }) + UI.stat({ lbl: 'Antrean Notifikasi', v: (an.Menunggu || 0), ic: 'send', c: an.Gagal || an['Gagal Permanen'] ? 'rose' : 'emerald', go: '#/notif-set', foot: (an.Terkirim || 0) + ' terkirim · ' + ((an.Gagal || 0) + (an['Gagal Permanen'] || 0)) + ' gagal' }) + '</div>' +
      '<div class="cols"><div>' + UI.sec('Aksi Cepat', UI.quick([
        { ic: 'user-plus', t: 'Tambah Guru', s: 'Akun staf', c: 'teal', act: 'staf' }, { ic: 'user-round-plus', t: 'Tambah Siswa', s: 'Akun siswa & ortu', c: 'indigo', act: 'siswa' },
        { ic: 'file-up', t: 'Impor Excel', s: 'Kelas, guru, siswa', c: 'emerald', act: 'impor' }, { ic: 'palette', t: 'Identitas', s: 'Logo & warna', c: 'violet', go: '#/identitas' },
        { ic: 'message-circle', t: 'WA & Email', s: 'Fonnte', c: 'blue', go: '#/notif-set' }, { ic: 'file-text', t: 'Templat Surat', s: 'SP & pemanggilan', c: 'orange', go: '#/template' }
      ])) + '</div><div>' +
      UI.sec('Kesiapan Sistem', '<div class="card"><div class="row between mb"><b>' + siap + ' dari ' + cek.length + ' siap</b>' + cincin(siap / cek.length * 100, '#4F46E5') + '</div><div class="stack s">' + cek.map((c) => '<div class="row top" ' + (c[3] ? 'data-go="' + c[3] + '" style="cursor:pointer"' : '') + '><span style="color:' + (c[0] ? '#059669' : c[4] ? 'var(--faint)' : '#D97706') + ';margin-top:1px">' + ic(c[0] ? 'circle-check' : c[4] ? 'circle-dashed' : 'circle-alert', 's') + '</span><div class="grow"><b class="small">' + esc(c[1]) + '</b><div class="xs muted">' + esc(c[0] ? 'Selesai' : c[2]) + '</div></div>' + (c[3] && !c[0] ? ic('chevron-right', 's') : '') + '</div>').join('') + '</div></div>') +
      '</div></div><div style="height:24px"></div></div>';
    bind(el, { staf: () => stafModal(null), siswa: () => siswaModal(null), impor: () => imporModal('siswa') });
  }
});

// ============================================================ PENGGUNA & DATA INDUK
halaman('pengguna', {
  roles: ['admin'], title: 'Pengguna & Data Induk', nav: 'pengguna',
  render(el) {
    const b = S.boot;
    const f = el._f = el._f || { tab: 'staf', q: '', kelas: '', hal: 1 };
    const q = f.q.toLowerCase();
    const per = 20;
    let isi = '', aksi = '';
    if (f.tab === 'staf') {
      const rows = (b.pengguna || []).filter((u) => !q || (u.nama + ' ' + u.nip + ' ' + u.peran).toLowerCase().includes(q)).sort((a, c) => (a.nama < c.nama ? -1 : 1));
      isi = UI.tabel([
        { k: 'nama', l: 'Nama', f: (u) => '<div class="row" style="gap:10px">' + avatar(u.nama, 'xs') + '<div><b>' + esc(u.nama) + '</b><div class="xs muted mono">' + esc(u.nip) + '</div></div></div>' },
        { k: 'peran', l: 'Peran', f: (u) => '<div class="row wrap" style="gap:4px">' + String(u.peran).split(',').filter(Boolean).map((r) => pill(LABEL_PERAN[r] || r, PERAN_C[r])).join('') + '</div>' },
        { k: 'kontak', l: 'Kontak', f: (u) => '<span class="small">' + esc(u.no_wa || '-') + (u.email ? '<br><span class="muted">' + esc(u.email) + '</span>' : '') + '</span>' },
        { k: 'aktif', l: 'Status', f: (u) => pill(u.aktif ? 'Aktif' : 'Nonaktif') + (u.wajib_ganti ? ' ' + pill('Sandi awal', 'amber') : '') },
        { k: 'terakhir_masuk', l: 'Terakhir masuk', f: (u) => '<span class="small muted">' + esc(u.terakhir_masuk ? relatif(u.terakhir_masuk) : 'Belum pernah') + '</span>' }
      ], rows.slice((f.hal - 1) * per, f.hal * per), { rowAct: 'staf', idKey: 'id_user' }) + UI.pager(rows.length, f.hal, per, 'hal');
      aksi = '<button class="btn btn-primary" data-act="stafBaru">' + ic('user-plus', 's') + ' Tambah</button>';
    } else if (f.tab === 'siswa') {
      const rows = (b.siswa || []).filter((s) => (!f.kelas || s.kelas_id === f.kelas) && (!q || (s.nama + ' ' + s.nisn + ' ' + (s.nama_ortu || '')).toLowerCase().includes(q))).sort((a, c) => (a.kelas === c.kelas ? (a.nama < c.nama ? -1 : 1) : a.kelas < c.kelas ? -1 : 1));
      isi = UI.tabel([
        { k: 'nama', l: 'Nama', f: (s) => '<b>' + esc(s.nama) + '</b><div class="xs muted mono">' + esc(s.nisn) + ' · ' + (s.jk === 'P' ? 'P' : 'L') + '</div>' },
        { k: 'kelas', l: 'Kelas' },
        { k: 'ortu', l: 'Orang tua', f: (s) => '<span class="small">' + esc(s.nama_ortu || '-') + (s.no_wa_ortu ? '<br><span class="muted">' + esc(s.no_wa_ortu) + '</span>' : '') + '</span>' },
        { k: 'poin', l: 'Poin', num: 1 },
        { k: 'akun', l: 'Akun', f: (s) => (s.aktif ? '' : pill('Nonaktif') + ' ') + (s.sandi_awal_siswa ? pill('Siswa: sandi awal', 'amber') : pill('Siswa ✓', 'green')) + ' ' + (s.sandi_awal_ortu ? pill('Ortu: sandi awal', 'amber') : pill('Ortu ✓', 'green')) }
      ], rows.slice((f.hal - 1) * per, f.hal * per), { rowAct: 'siswa', idKey: 'nisn' }) + UI.pager(rows.length, f.hal, per, 'hal');
      aksi = '<select class="select" data-change="kelas" style="max-width:180px" aria-label="Kelas"><option value="">Semua kelas</option>' + (b.kelas || []).map((k) => '<option value="' + esc(k.kelas_id) + '" ' + (f.kelas === k.kelas_id ? 'selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select><button class="btn btn-primary" data-act="siswaBaru">' + ic('user-round-plus', 's') + ' Tambah</button>';
    } else {
      const rows = (b.kelas || []).filter((k) => !q || (k.nama_kelas + ' ' + k.nama_wali).toLowerCase().includes(q)).sort((a, c) => (a.nama_kelas < c.nama_kelas ? -1 : 1));
      isi = UI.tabel([
        { k: 'nama_kelas', l: 'Kelas', f: (k) => '<b>' + esc(k.nama_kelas) + '</b><div class="xs muted mono">' + esc(k.kelas_id) + '</div>' },
        { k: 'tingkat', l: 'Tingkat' }, { k: 'nama_wali', l: 'Wali kelas', f: (k) => esc(k.nama_wali || '—') },
        { k: 'jumlah', l: 'Siswa', num: 1 }, { k: 'tahun_ajaran', l: 'Tahun ajaran', f: (k) => (k.tahun_ajaran === 'CONTOH' ? pill('Data contoh', 'amber') : esc(k.tahun_ajaran || '-')) }
      ], rows, { rowAct: 'kelas', idKey: 'kelas_id' });
      aksi = '<button class="btn btn-outline" data-act="naik">' + ic('arrow-up-circle', 's') + ' Kenaikan Kelas</button><button class="btn btn-primary" data-act="kelasBaru">' + ic('plus', 's') + ' Tambah</button>';
    }
    el.innerHTML = UI.ph('Pengguna & Data Induk', (b.pengguna || []).length + ' staf · ' + (b.siswa || []).length + ' siswa · ' + (b.kelas || []).length + ' kelas', { acts: '<button class="btn btn-soft btn-sm" data-act="impor">' + ic('file-up', 's') + ' Impor</button>' }) + '<div class="wrap">' +
      '<div class="row between mt-l"><div class="grow">' + UI.tabs([{ k: 'staf', l: 'Guru & Staf', n: (b.pengguna || []).length }, { k: 'siswa', l: 'Siswa & Orang Tua', n: (b.siswa || []).length }, { k: 'kelas', l: 'Kelas', n: (b.kelas || []).length }], f.tab, 'tab') + '</div><button class="btn btn-soft d-only" data-act="impor">' + ic('file-up') + ' Impor Excel</button></div>' +
      '<div class="toolbar mt" style="flex-wrap:wrap"><div class="search-in" style="flex:1;min-width:200px">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari..." value="' + esc(f.q) + '" data-input="q"></div>' + aksi +
      '<button class="btn btn-outline" data-act="xlsx" aria-label="Ekspor Excel" style="color:#047857;border-color:#A7F3D0">' + ic('file-spreadsheet', 's') + '</button></div>' +
      '<div class="card p0"><div style="padding:6px 12px">' + isi + '</div></div><div style="height:24px"></div></div>';
    bind(el, {
      tab: (x) => { f.tab = x.dataset.k; f.hal = 1; f.q = ''; this.render(el); },
      hal: (x) => { f.hal = +x.dataset.k; this.render(el); },
      'input:q': debounce((i) => { f.q = i.value; f.hal = 1; this.render(el); const n = el.querySelector('[data-input=q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200),
      'change:kelas': (s) => { f.kelas = s.value; f.hal = 1; this.render(el); },
      staf: (r) => stafModal((b.pengguna || []).find((u) => u.id_user === r.dataset.id)), stafBaru: () => stafModal(null),
      siswa: (r) => siswaModal((b.siswa || []).find((s) => s.nisn === r.dataset.id)), siswaBaru: () => siswaModal(null),
      kelas: (r) => kelasModal((b.kelas || []).find((k) => k.kelas_id === r.dataset.id)), kelasBaru: () => kelasModal(null),
      naik: () => kenaikanModal(), impor: () => imporModal(f.tab === 'staf' ? 'guru' : f.tab),
      xlsx: () => {
        if (f.tab === 'staf') eksporExcel('Data Guru & Staf', { Staf: (b.pengguna || []).map((u) => ({ nip: u.nip, nama: u.nama, peran: u.peran, no_wa: u.no_wa, email: u.email, aktif: u.aktif ? 'Ya' : 'Tidak' })) });
        else if (f.tab === 'siswa') eksporExcel('Data Siswa', { Siswa: (b.siswa || []).map((s) => ({ nisn: s.nisn, nama: s.nama, jk: s.jk, kelas: s.kelas, nama_ortu: s.nama_ortu, no_wa_ortu: s.no_wa_ortu, email_ortu: s.email_ortu, poin: s.poin, aktif: s.aktif ? 'Ya' : 'Tidak' })) });
        else eksporExcel('Data Kelas', { Kelas: (b.kelas || []).map((k) => ({ kelas_id: k.kelas_id, nama_kelas: k.nama_kelas, tingkat: k.tingkat, nip_wali: k.nip_wali, wali: k.nama_wali, jumlah_siswa: k.jumlah, tahun_ajaran: k.tahun_ajaran })) });
      }
    });
  }
});

function stafModal(u) {
  const baru = !u; u = u || { peran: '', aktif: true };
  const peran = String(u.peran).split(',');
  const m = Modal.open({
    title: baru ? 'Tambah guru / staf' : 'Ubah data ' + u.nama,
    body: '<form><div class="grid2"><div class="field"><label class="lbl">NIP / Username <span class="req">*</span></label><input class="input mono" name="nip" value="' + esc(u.nip || '') + '" required></div><div class="field"><label class="lbl">Nama lengkap & gelar <span class="req">*</span></label><input class="input" name="nama" maxlength="100" value="' + esc(u.nama || '') + '" required></div></div>' +
      '<div class="field"><label class="lbl">Peran <span class="opt">boleh lebih dari satu</span></label><div class="row wrap" style="gap:8px">' + PERAN_STAF.map((r) => '<label class="chip ' + (peran.indexOf(r) > -1 ? 'on' : '') + '" style="cursor:pointer"><input type="checkbox" data-peran value="' + r + '" ' + (peran.indexOf(r) > -1 ? 'checked' : '') + ' style="display:none" data-change="peran">' + esc(LABEL_PERAN[r]) + '</label>').join('') + '</div><span class="help">Peran Wali Kelas otomatis diberikan saat ditetapkan sebagai wali di data kelas.</span></div>' +
      '<div class="grid2"><div class="field"><label class="lbl">No. WhatsApp</label><input class="input" name="no_wa" inputmode="tel" value="' + esc(u.no_wa || '') + '" placeholder="08xxxxxxxxxx"></div><div class="field"><label class="lbl">Email</label><input class="input" type="email" name="email" value="' + esc(u.email || '') + '"></div></div>' +
      (baru ? '<div class="field"><label class="lbl">Kata sandi awal <span class="opt">kosongkan untuk acak</span></label><input class="input mono" name="sandi" autocomplete="new-password"></div>' : '') +
      '<label class="row" style="gap:10px"><span class="toggle"><input type="checkbox" name="aktif" ' + (u.aktif ? 'checked' : '') + '><i></i></span><span class="small b">Akun aktif</span></label></form>',
    foot: (baru ? '' : '<button class="btn btn-ghost" data-act="reset" style="margin-right:auto">' + ic('key-round', 's') + ' Reset sandi</button>') + '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">' + ic('save', 's') + ' Simpan</button>',
    handlers: {
      batal: () => m.close(),
      'change:peran': (c) => c.parentElement.classList.toggle('on', c.checked),
      reset: () => { m.close(); resetSandiModal('staf', u.id_user, u.nama); },
      ok: async (b) => {
        const v = formData(m.el.querySelector('form'));
        v.peran = $$('[data-peran]', m.el).filter((c) => c.checked).map((c) => c.value).join(',');
        if (!v.nip || !v.nama) { toast('Isi NIP dan nama.', 'warn'); return; }
        if (!v.peran) { toast('Pilih minimal satu peran.', 'warn'); return; }
        const r = await App.aksi('penggunaSimpan', Object.assign(v, { id_user: u.id_user || '' }), { btn: b });
        if (r) { m.close(); if (r.akun) akunModal(r.akun.map((a) => Object.assign(a, { peran: v.peran })), 'Akun staf baru'); }
      }
    }
  });
}

function siswaModal(s) {
  const baru = !s; s = s || { jk: 'L', aktif: true, kelas_id: '' };
  let jk = s.jk || 'L';
  const m = Modal.open({
    title: baru ? 'Tambah siswa' : 'Ubah data ' + s.nama, size: 'lg',
    body: '<form><div class="grid2"><div class="field"><label class="lbl">NISN <span class="req">*</span></label><input class="input mono" name="nisn" inputmode="numeric" maxlength="12" value="' + esc(s.nisn || '') + '" ' + (baru ? '' : 'readonly style="background:var(--surface-2)"') + '></div><div class="field"><label class="lbl">Nama lengkap <span class="req">*</span></label><input class="input" name="nama" maxlength="100" value="' + esc(s.nama || '') + '"></div></div>' +
      '<div class="grid2"><div class="field"><label class="lbl">Jenis kelamin</label><div data-jk></div></div><div class="field"><label class="lbl">Kelas <span class="req">*</span></label><select class="select" name="kelas_id"><option value="">Pilih kelas</option>' + (S.boot.kelas || []).map((k) => '<option value="' + esc(k.kelas_id) + '" ' + (s.kelas_id === k.kelas_id ? 'selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('') + '</select></div></div>' +
      '<div class="divider"></div><h3 class="mb">Orang tua / wali</h3><div class="grid2"><div class="field"><label class="lbl">Nama orang tua</label><input class="input" name="nama_ortu" value="' + esc(s.nama_ortu || '') + '"></div><div class="field"><label class="lbl">No. WhatsApp orang tua</label><input class="input" name="no_wa_ortu" inputmode="tel" value="' + esc(s.no_wa_ortu || '') + '" placeholder="08xxxxxxxxxx"></div></div>' +
      '<div class="field"><label class="lbl">Email orang tua <span class="opt">untuk lampiran surat PDF</span></label><input class="input" type="email" name="email_ortu" value="' + esc(s.email_ortu || '') + '"></div>' +
      '<label class="row" style="gap:10px"><span class="toggle"><input type="checkbox" name="aktif" ' + (s.aktif ? 'checked' : '') + '><i></i></span><span class="small b">Siswa aktif</span></label>' +
      (baru ? '<p class="xs muted mt">Akun siswa (NISN) dan akun orang tua (NISN anak) dibuat otomatis dengan kata sandi acak.</p>' : '') + '</form>',
    foot: (baru ? '' : '<div class="btns" style="margin-right:auto"><button class="btn btn-ghost btn-sm" data-act="reset" data-t="siswa">' + ic('key-round', 's') + ' Sandi siswa</button><button class="btn btn-ghost btn-sm" data-act="reset" data-t="ortu">' + ic('key-round', 's') + ' Sandi ortu</button></div>') + '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">' + ic('save', 's') + ' Simpan</button>',
    onMount: (b) => { const seg = () => (b.querySelector('[data-jk]').innerHTML = UI.seg([{ k: 'L', l: 'Laki-laki' }, { k: 'P', l: 'Perempuan' }], jk, 'jk')); seg(); b._seg = seg; },
    handlers: {
      batal: () => m.close(),
      jk: (x) => { jk = x.dataset.k; m.el._seg(); },
      reset: (x) => { m.close(); resetSandiModal(x.dataset.t, s.nisn, x.dataset.t === 'ortu' ? 'orang tua ' + s.nama : s.nama); },
      ok: async (b) => {
        const v = formData(m.el.querySelector('form'));
        if (!/^\d{6,12}$/.test(v.nisn)) { toast('NISN harus 6–12 digit angka.', 'warn'); return; }
        if (!v.nama || !v.kelas_id) { toast('Isi nama dan kelas.', 'warn'); return; }
        const r = await App.aksi('siswaSimpan', Object.assign(v, { jk, edit: !baru }), { btn: b });
        if (r) { m.close(); if (r.akun) akunModal(r.akun, 'Akun siswa & orang tua'); }
      }
    }
  });
}

function kelasModal(k) {
  const baru = !k; k = k || { tingkat: 'X', tahun_ajaran: '' };
  const guru = (S.boot.pengguna || []).filter((u) => u.aktif).sort((a, b) => (a.nama < b.nama ? -1 : 1));
  const m = Modal.open({
    title: baru ? 'Tambah kelas' : 'Ubah kelas ' + k.nama_kelas,
    body: '<form><div class="grid2"><div class="field"><label class="lbl">Nama kelas <span class="req">*</span></label><input class="input" name="nama_kelas" maxlength="40" value="' + esc(k.nama_kelas || '') + '" placeholder="XI IPA 2"></div><div class="field"><label class="lbl">Tingkat</label><select class="select" name="tingkat">' + ['X', 'XI', 'XII'].map((t) => '<option ' + (k.tingkat === t ? 'selected' : '') + '>' + t + '</option>').join('') + '</select></div></div>' +
      '<div class="field"><label class="lbl">Wali kelas</label><select class="select" name="nip_wali"><option value="">— Belum ditetapkan —</option>' + guru.map((u) => '<option value="' + esc(u.nip) + '" ' + (k.nip_wali === u.nip ? 'selected' : '') + '>' + esc(u.nama) + ' (' + esc(u.nip) + ')</option>').join('') + '</select></div>' +
      '<div class="field"><label class="lbl">Tahun ajaran</label><input class="input" name="tahun_ajaran" value="' + esc(k.tahun_ajaran === 'CONTOH' ? '' : k.tahun_ajaran || '') + '" placeholder="2026/2027"></div></form>',
    foot: (baru ? '' : '<button class="btn btn-ghost" data-act="hapus" style="margin-right:auto;color:#DC2626">' + ic('trash-2', 's') + ' Hapus</button>') + '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="ok">' + ic('save', 's') + ' Simpan</button>',
    handlers: {
      batal: () => m.close(),
      hapus: async (b) => { if (!(await konfirmasi({ title: 'Hapus kelas ' + k.nama_kelas + '?', text: 'Kelas hanya dapat dihapus bila tidak berisi siswa aktif.', ok: 'Hapus', danger: true }))) return; const r = await App.aksi('kelasHapus', { kelas_id: k.kelas_id }, { btn: b }); if (r) m.close(); },
      ok: async (b) => { const v = formData(m.el.querySelector('form')); if (!v.nama_kelas) { toast('Isi nama kelas.', 'warn'); return; } const r = await App.aksi('kelasSimpan', Object.assign(v, { kelas_id: k.kelas_id || '' }), { btn: b }); if (r) m.close(); }
    }
  });
}

function kenaikanModal() {
  const kelas = (S.boot.kelas || []).slice().sort((a, b) => (a.nama_kelas < b.nama_kelas ? -1 : 1));
  const naikKe = { X: 'XI', XI: 'XII' };
  const tebak = (k) => { if (k.tingkat === 'XII') return 'LULUS'; const t = naikKe[k.tingkat]; const nama = k.nama_kelas.replace(/^(X{1,2}I{0,2})\b/, t); const c = kelas.find((x) => x.nama_kelas === nama); return c ? c.kelas_id : ''; };
  const m = Modal.open({
    title: 'Kenaikan kelas & kelulusan', size: 'lg',
    body: '<div class="alert warn mb">' + ic('triangle-alert') + '<div>Proses ini memindahkan seluruh siswa aktif sesuai pemetaan. Siswa kelas yang dipetakan ke <b>Lulus</b> dinonaktifkan (data tetap tersimpan). Lakukan di awal tahun ajaran baru.</div></div>' +
      '<div class="field"><label class="lbl">Tahun ajaran baru</label><input class="input" name="ta" placeholder="2027/2028"></div>' +
      '<div class="stack s">' + kelas.map((k) => '<div class="row" style="gap:10px"><b class="small" style="width:120px">' + esc(k.nama_kelas) + '</b><span class="xs muted" style="width:60px">' + k.jumlah + ' siswa</span>' + ic('arrow-right', 's') + '<select class="select grow" data-dari="' + esc(k.kelas_id) + '" style="height:40px"><option value="">Tidak berubah</option><option value="LULUS" ' + (tebak(k) === 'LULUS' ? 'selected' : '') + '>Lulus (nonaktifkan)</option>' + kelas.filter((x) => x.kelas_id !== k.kelas_id).map((x) => '<option value="' + esc(x.kelas_id) + '" ' + (tebak(k) === x.kelas_id ? 'selected' : '') + '>' + esc(x.nama_kelas) + '</option>').join('') + '</select></div>').join('') + '</div>' +
      '<p class="xs muted mt">Tips: buat kelas tujuan terlebih dahulu bila belum ada. Kelas XII dipetakan ke Lulus lebih dulu agar kelas XII dapat diisi siswa XI.</p>',
    foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-danger" data-act="ok">' + ic('arrow-up-circle', 's') + ' Proses Kenaikan</button>',
    handlers: {
      batal: () => m.close(),
      ok: async (b) => {
        const mapping = $$('[data-dari]', m.el).map((s) => ({ dari: s.dataset.dari, ke: s.value })).filter((x) => x.ke);
        if (!mapping.length) { toast('Belum ada pemetaan kelas.', 'warn'); return; }
        if (!(await konfirmasi({ title: 'Proses kenaikan kelas?', text: mapping.length + ' kelas akan dipindahkan. Pastikan pemetaan sudah benar.', ok: 'Ya, proses', danger: true }))) return;
        // urutkan: lulus dulu, lalu XI→XII, lalu X→XI (hindari bentrok kelas tujuan)
        const urutan = { LULUS: 0 };
        mapping.sort((a, c) => (urutan[a.ke] === 0 ? -1 : urutan[c.ke] === 0 ? 1 : 0));
        const r = await App.aksi('kenaikanKelas', { mapping, tahun_ajaran: m.el.querySelector('[name=ta]').value.trim() }, { btn: b, teks: 'Memproses...' });
        if (r) m.close();
      }
    }
  });
}

// ── Impor Excel ──
const TEMPLAT_IMPOR = {
  kelas: { judul: 'Kelas', kol: ['nama_kelas', 'tingkat', 'nip_wali', 'tahun_ajaran'], contoh: { nama_kelas: 'XI IPA 2', tingkat: 'XI', nip_wali: '198501012010011001', tahun_ajaran: '2026/2027' }, ket: 'Impor kelas lebih dulu, lalu guru, lalu siswa.' },
  guru: { judul: 'Guru & Staf', kol: ['nip', 'nama', 'peran', 'no_wa', 'email', 'sandi'], contoh: { nip: '198501012010011001', nama: 'Dra. Siti Aminah, M.Pd.', peran: 'bk,wali', no_wa: '081234567890', email: 'siti@sekolah.sch.id', sandi: '' }, ket: 'Peran: admin, bk, kesiswaan, wali, piket, kepsek (pisahkan koma). Sandi kosong = acak.' },
  siswa: { judul: 'Siswa', kol: ['nisn', 'nama', 'jk', 'kelas', 'nama_ortu', 'no_wa_ortu', 'email_ortu', 'sandi_siswa', 'sandi_ortu'], contoh: { nisn: '0081234567', nama: 'Rizky Pratama', jk: 'L', kelas: 'XI IPA 2', nama_ortu: 'Bpk. Hendra', no_wa_ortu: '081298765432', email_ortu: '', sandi_siswa: '', sandi_ortu: '' }, ket: 'Kolom kelas diisi nama kelas persis seperti di data kelas. Format kolom NISN sebagai Teks agar angka 0 di depan tidak hilang.' }
};
function imporModal(tipe) {
  if (!TEMPLAT_IMPOR[tipe]) tipe = 'siswa';
  let rows = null, namaF = '';
  const m = Modal.open({
    title: 'Impor data dari Excel', size: 'lg',
    body: '<div data-isi></div>',
    foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn btn-primary" data-act="kirim" disabled>' + ic('upload', 's') + ' Impor</button>',
    onMount: () => setTimeout(gambar, 0),
    handlers: {
      batal: () => m.close(),
      tipe: (x) => { tipe = x.dataset.k; rows = null; gambar(); },
      templat: async () => {
        const t = TEMPLAT_IMPOR[tipe];
        try {
          await muatSkrip(LIB.xlsx);
          const ws = XLSX.utils.json_to_sheet([t.contoh], { header: t.kol });
          ws['!cols'] = t.kol.map(() => ({ wch: 20 }));
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, t.judul);
          XLSX.writeFile(wb, 'Templat Impor ' + t.judul + '.xlsx');
        } catch (e) { eksporExcel('Templat Impor ' + t.judul, { [t.judul]: [t.contoh] }); }
      },
      'change:file': async (inp) => {
        const file = inp.files[0]; if (!file) return;
        namaF = file.name;
        try {
          await muatSkrip(LIB.xlsx);
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
          rows = data.map((r) => { const o = {}; Object.keys(r).forEach((k) => (o[String(k).trim().toLowerCase().replace(/\s+/g, '_')] = String(r[k]).trim())); return o; })
            .filter((r) => Object.values(r).some((v) => v !== ''));
          if (tipe === 'siswa') rows.forEach((r) => { if (/^\d{7,9}$/.test(r.nisn)) r.nisn = r.nisn.padStart(10, '0'); });
          gambar();
        } catch (e) { toast('Berkas tidak dapat dibaca: ' + e.message, 'error'); }
      },
      kirim: async (b) => {
        if (!rows || !rows.length) return;
        const r = await App.aksi('impor', { tipe, rows }, { btn: b, teks: 'Mengimpor ' + rows.length + ' baris...' });
        if (!r) return;
        m.el.querySelector('[data-isi]').innerHTML = '<div class="stats" style="grid-template-columns:repeat(3,1fr)">' + UI.stat({ lbl: 'Baru', v: r.baru, c: 'emerald', ic: 'circle-plus' }) + UI.stat({ lbl: 'Diperbarui', v: r.ubah, c: 'blue', ic: 'refresh-cw' }) + UI.stat({ lbl: 'Gagal', v: r.gagal.length, c: r.gagal.length ? 'rose' : 'slate', ic: 'circle-x' }) + '</div>' +
          (r.gagal.length ? '<div class="card mt"><h3 class="mb">Baris gagal</h3><div class="stack s" style="max-height:200px;overflow:auto">' + r.gagal.map((g) => '<div class="small">Baris ' + g.baris + ': <span class="muted">' + esc(g.alasan) + '</span></div>').join('') + '</div></div>' : '');
        m.el.querySelector('.sheet-foot').innerHTML = (r.akun.length ? '<button class="btn btn-primary" data-act="akun">' + ic('key-round', 's') + ' Lihat ' + r.akun.length + ' akun baru</button>' : '') + '<button class="btn btn-outline" data-act="batal">Tutup</button>';
        m.el._akun = r.akun;
      },
      akun: () => akunModal(m.el._akun, 'Akun hasil impor')
    }
  });
  function gambar() {
    const t = TEMPLAT_IMPOR[tipe];
    const kurang = rows && rows.length ? t.kol.slice(0, 2).filter((k) => !(k in rows[0])) : [];
    m.el.querySelector('[data-isi]').innerHTML = UI.seg([{ k: 'kelas', l: '1. Kelas' }, { k: 'guru', l: '2. Guru & Staf' }, { k: 'siswa', l: '3. Siswa' }], tipe, 'tipe') +
      '<div class="alert info mt">' + ic('info') + '<div>' + esc(t.ket) + ' Data yang sudah ada (NISN/NIP/kelas sama) akan diperbarui, bukan digandakan.</div></div>' +
      '<div class="row between mt"><span class="small">Kolom: <span class="mono xs">' + t.kol.join(', ') + '</span></span><button class="btn btn-soft btn-sm" data-act="templat">' + ic('download', 's') + ' Unduh templat</button></div>' +
      '<label class="drop mt"><input type="file" accept=".xlsx,.xls,.csv" data-change="file"><span class="ic">' + ic('file-spreadsheet') + '</span><b>' + (namaF && rows ? esc(namaF) : 'Pilih berkas Excel / CSV') + '</b><span class="xs">' + (rows ? rows.length + ' baris terbaca' : 'Baris pertama berisi nama kolom') + '</span></label>' +
      (kurang.length ? '<div class="alert err mt">' + ic('circle-alert') + '<div>Kolom wajib tidak ditemukan: <b>' + kurang.join(', ') + '</b>. Gunakan templat.</div></div>' : '') +
      (rows && rows.length && !kurang.length ? '<div class="mt"><div class="xs b muted mb-s">PRATINJAU 5 BARIS PERTAMA</div><div class="table-wrap"><table class="tbl"><thead><tr>' + t.kol.map((k) => '<th>' + k + '</th>').join('') + '</tr></thead><tbody>' + rows.slice(0, 5).map((r) => '<tr>' + t.kol.map((k) => '<td class="small">' + esc(r[k] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>' : '');
    const k = m.el.querySelector('[data-act=kirim]'); if (k) k.disabled = !(rows && rows.length && !kurang.length);
  }
}

// ============================================================ IDENTITAS APLIKASI
const PRESET_WARNA = [['Indigo', '#4F46E5', '#7C3AED', '#3B82F6'], ['Biru Laut', '#1D4ED8', '#0EA5E9', '#06B6D4'], ['Hijau Sekolah', '#047857', '#10B981', '#0D9488'], ['Merah Marun', '#9F1239', '#E11D48', '#F97316'], ['Ungu', '#6D28D9', '#A21CAF', '#7C3AED'], ['Oranye', '#C2410C', '#F59E0B', '#EF4444']];
function kontras(hex) { const c = hexKeRgb(hex); if (!c) return 21; const L = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); const l = 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2]; return 1.05 / (l + 0.05); }
halaman('identitas', {
  roles: ['admin'], title: 'Identitas Aplikasi', nav: 'identitas', live: false,
  render(el) {
    const pg = S.boot.pengaturan || {};
    const v = el._v = el._v || Object.assign({}, pg, { logo_baru: null });
    const fld = (k, l, o = {}) => '<div class="field"><label class="lbl" for="id-' + k + '">' + l + (o.opt ? ' <span class="opt">' + o.opt + '</span>' : '') + '</label><input class="input ' + (o.mono ? 'mono' : '') + '" id="id-' + k + '" data-input="v" name="' + k + '" value="' + esc(v[k] || '') + '" ' + (o.type ? 'type="' + o.type + '"' : '') + ' placeholder="' + esc(o.ph || '') + '" maxlength="' + (o.max || 200) + '">' + (o.help ? '<span class="help">' + o.help + '</span>' : '') + '</div>';
    const warna = (k, l) => '<div class="field"><label class="lbl">' + l + '</label><div class="row" style="gap:8px"><input type="color" class="swatch" data-input="warna" name="' + k + '" value="' + esc(v[k] || '#4F46E5') + '" aria-label="' + l + '"><input class="input mono" data-input="hex" name="' + k + '" value="' + esc(v[k] || '') + '" maxlength="7" style="max-width:120px"></div></div>';
    const k1 = kontras(v.warna_utama || '#4F46E5');
    el.innerHTML = UI.ph('Identitas Aplikasi', 'Nama, logo, warna, kop surat') + '<div class="wrap"><div class="cols mt-l"><div class="stack">' +
      '<div class="card"><h3 class="mb">Nama & logo</h3>' + fld('nama_app', 'Nama aplikasi', { max: 60 }) + fld('nama_sekolah', 'Nama sekolah', { max: 100 }) + '<div class="grid2">' + fld('slogan', 'Slogan', { max: 80, opt: 'Opsional' }) + fld('npsn', 'NPSN', { max: 12, opt: 'Opsional' }) + '</div>' +
      '<div class="field"><label class="lbl">Logo <span class="opt">PNG/JPG · dibuat versi mini otomatis</span></label><div class="row" style="gap:14px"><span class="brand-logo" style="width:72px;height:72px;border-radius:20px">' + (v.logo_data ? '<img src="' + v.logo_data + '" alt="Logo">' : ic('graduation-cap', 'xl')) + '</span><div class="stack s"><label class="btn btn-soft btn-sm" style="position:relative">' + ic('upload', 's') + ' Unggah logo<input type="file" accept="image/png,image/jpeg,image/webp" data-change="logo" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>' + (v.logo_data ? '<button class="btn btn-ghost btn-sm" data-act="hapusLogo" style="color:#DC2626">' + ic('trash-2', 's') + ' Hapus logo</button>' : '') + '</div></div></div></div>' +
      '<div class="card"><h3 class="mb">Warna tema</h3><div class="chips mb">' + PRESET_WARNA.map((p) => '<button class="chip" data-act="preset" data-k="' + p.slice(1).join(',') + '"><span style="width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,' + p[2] + ',' + p[1] + ',' + p[3] + ')"></span>' + p[0] + '</button>').join('') + '</div>' +
      '<div class="grid2">' + warna('warna_utama', 'Warna utama') + warna('warna_aksen', 'Warna aksen') + '</div>' + warna('warna_akhir', 'Warna akhir gradasi') +
      (k1 < 4.5 ? '<div class="alert warn">' + ic('contrast') + '<div>Kontras teks putih pada warna utama hanya ' + k1.toFixed(1) + ':1 (disarankan ≥ 4.5:1). Pilih warna lebih gelap agar mudah dibaca.</div></div>' : '<div class="lockline">' + ic('circle-check', 's') + ' Kontras teks putih ' + k1.toFixed(1) + ':1 — mudah dibaca.</div>') + '</div>' +
      '<div class="card"><h3 class="mb">Layanan & alamat aplikasi</h3><div class="grid2">' + fld('jam_layanan', 'Jam layanan BK') + fld('lokasi_bk', 'Lokasi BK', { max: 60 }) + '</div>' +
      fld('url_aplikasi', 'Alamat aplikasi (URL)', { type: 'url', ph: 'https://username.github.io/nexora/', help: 'Dipakai untuk kode QR verifikasi & tautan di pesan WA. <button type="button" class="btn btn-ghost btn-sm" data-act="urlIni" style="height:28px">Pakai alamat ini</button>' }) + '</div>' +
      '<div class="card"><h3 class="mb">Kop surat</h3>' + fld('kop_baris1', 'Baris 1', { ph: 'YAYASAN PEMBINA LEMBAGA PENDIDIKAN PGRI', opt: 'di atas nama sekolah' }) + fld('kop_baris2', 'Baris 2', { ph: 'Alamat sekolah' }) + fld('kop_baris3', 'Baris 3', { ph: 'Telp · Email · NPSN' }) + '<div class="grid2">' + fld('kota', 'Kota (tempat tanda tangan)', { max: 40 }) + fld('alamat', 'Alamat singkat', { opt: 'Opsional' }) + '</div></div>' +
      '<div class="card"><h3 class="mb">Periode & penomoran</h3><div class="grid2">' + fld('periode_mulai', 'Awal periode poin', { type: 'date', help: 'Poin dihitung sejak tanggal ini (mis. awal semester).' }) + fld('pengurang_prestasi', 'Pengurang poin per prestasi', { type: 'number', help: '0 = prestasi tidak mengurangi poin.' }) + '</div>' +
      fld('format_nomor', 'Format nomor surat', { mono: true, ph: '{NO}/{KODE}/SMAPATISPA/{BULAN}/{TAHUN}', help: 'Gunakan {NO}, {KODE}, {BULAN} (romawi), {TAHUN}.' }) + '</div>' +
      '<div class="sticky-act"><button class="btn btn-primary btn-block btn-lg" data-act="simpan">' + ic('save') + ' Simpan Identitas</button></div></div>' +
      '<div><div style="position:sticky;top:90px"><div class="xs b muted mb tc">PRATINJAU LANGSUNG</div><div data-prev></div></div></div></div><div style="height:24px"></div></div>';
    const prev = () => {
      const g = 'linear-gradient(135deg,' + (v.warna_aksen || '#7C3AED') + ' 0%,' + (v.warna_utama || '#4F46E5') + ' 50%,' + (v.warna_akhir || '#3B82F6') + ' 100%)';
      el.querySelector('[data-prev]').innerHTML = '<div class="phone"><div class="hero" style="background:' + g + ';padding-bottom:40px"><div class="hero-top"><div class="brand"><span class="brand-logo">' + (v.logo_data ? '<img src="' + v.logo_data + '" alt="">' : ic('graduation-cap')) + '</span><div class="ell"><b class="ell">' + esc(v.nama_app || 'Nama Aplikasi') + '</b><small>' + esc(v.nama_sekolah || '') + '</small></div></div></div><h1 style="font-size:19px">Halo, Rizky!</h1><p class="lead" style="font-size:12px">' + esc(v.slogan || 'Layanan BK & Kesiswaan') + '</p></div>' +
        '<div style="padding:0 12px;margin-top:-22px;position:relative"><div class="search-pill m" style="display:flex;margin:0;height:44px">' + ic('search', 's') + '<span class="small muted">Cari layanan...</span></div></div>' +
        '<div style="padding:14px 12px"><div class="grid-quick" style="grid-template-columns:repeat(3,1fr);gap:8px">' + [['heart-handshake', 'Konseling', v.warna_utama], ['shield-alert', 'Lapor', '#F43F5E'], ['calendar-days', 'Jadwal', v.warna_akhir]].map((q) => '<div class="qcard" style="min-height:86px;padding:10px 4px;--c:' + q[2] + ';background:#fff"><span class="qi" style="width:34px;height:34px;background:' + q[2] + '">' + ic(q[0], 's') + '</span><span class="qt" style="font-size:11px">' + q[1] + '</span></div>').join('') + '</div>' +
        '<button class="btn btn-block mt" style="background:' + (v.warna_utama || '#4F46E5') + ';color:#fff;height:42px">Ajukan Konseling</button></div></div>';
    };
    prev();
    const segarWarna = debounce(() => this.render(el), 400);
    bind(el, {
      'input:v': (i) => { v[i.name] = i.value; if (/nama_app|nama_sekolah|slogan/.test(i.name)) prev(); },
      'input:warna': (i) => { v[i.name] = i.value.toUpperCase(); const h = el.querySelector('[data-input=hex][name=' + i.name + ']'); if (h) h.value = v[i.name]; prev(); segarWarna(); },
      'input:hex': (i) => { if (/^#[0-9A-Fa-f]{6}$/.test(i.value)) { v[i.name] = i.value.toUpperCase(); const c = el.querySelector('[data-input=warna][name=' + i.name + ']'); if (c) c.value = v[i.name]; prev(); } },
      preset: (b) => { const [a, c, d] = b.dataset.k.split(','); Object.assign(v, { warna_utama: a, warna_aksen: c, warna_akhir: d }); this.render(el); },
      urlIni: () => { v.url_aplikasi = location.origin + location.pathname; this.render(el); },
      hapusLogo: () => { v.logo_data = ''; v.logo_baru = null; this.render(el); },
      'change:logo': async (i) => {
        try {
          const kecil = await bacaBerkas(i.files[0], { png: true, dim: 256, maxMB: 0.3 });
          const asli = await bacaBerkas(i.files[0], { png: true, dim: 1024, maxMB: 2 }).catch(() => null);
          v.logo_data = kecil.preview; v.logo_baru = asli;
          this.render(el);
        } catch (e) { toast(e.message, 'error'); }
      },
      simpan: async (b) => {
        const kirim = {};
        ['nama_app', 'nama_sekolah', 'slogan', 'npsn', 'warna_utama', 'warna_aksen', 'warna_akhir', 'jam_layanan', 'lokasi_bk', 'url_aplikasi', 'kop_baris1', 'kop_baris2', 'kop_baris3', 'kota', 'alamat', 'periode_mulai', 'pengurang_prestasi', 'format_nomor', 'logo_data'].forEach((k) => { if ((v[k] || '') !== (pg[k] || '')) kirim[k] = v[k] || ''; });
        if (v.logo_baru) kirim.logo_asli = { nama: v.logo_baru.nama, mime: v.logo_baru.mime, data: v.logo_baru.data };
        if (!Object.keys(kirim).length) { toast('Tidak ada perubahan.', 'info'); return; }
        if (kirim.url_aplikasi && !/^https:\/\//.test(kirim.url_aplikasi)) { toast('URL aplikasi harus diawali https://', 'warn'); return; }
        const r = await App.aksi('pengaturanSimpan', kirim, { btn: b });
        if (r) {
          S.boot.pengaturan = r.pengaturan; Object.assign(S.cfg, r.cfg); S.pub = r.cfg; Store.set('pub', r.cfg);
          terapkanMerek(S.cfg); App.segarkanChrome(); el._v = null; this.render(el);
        }
      }
    });
  }
});

// ============================================================ WA & EMAIL
halaman('notif-set', {
  roles: ['admin'], title: 'WA & Email', nav: 'notif-set', live: false,
  render(el) {
    const pg = S.boot.pengaturan || {}, an = S.boot.antrean || { jumlah: {} }, j = an.jumlah || {};
    const v = el._v = el._v || { wa_aktif: !!pg.wa_aktif, email_aktif: pg.email_aktif !== '' && pg.email_aktif !== false, nomor_wa_pengirim: pg.nomor_wa_pengirim || '', token: '', kanal: 'wa' };
    const terhubung = pg.fonnte_token_terisi && pg.wa_aktif;
    el.innerHTML = UI.ph('WA & Email', 'Notifikasi orang tua & guru') + '<div class="wrap" style="max-width:1000px"><div class="cols mt-l"><div class="stack">' +
      '<div class="card"><div class="row between"><div class="row"><span class="avatar s" style="background:#25D366">' + ic('message-circle', 's') + '</span><div><h3>WhatsApp (Fonnte)</h3><div class="xs muted">Pesan otomatis ke orang tua & guru</div></div></div>' + pill(terhubung ? 'Aktif' : pg.fonnte_token_terisi ? 'Token tersimpan' : 'Belum diatur', terhubung ? 'green' : pg.fonnte_token_terisi ? 'amber' : 'slate') + '</div>' +
      '<label class="row between mt-l" style="cursor:pointer"><span><b class="small">Aktifkan pengiriman WhatsApp</b><div class="xs muted">Bisa dinyalakan kapan saja tanpa deploy ulang</div></span><span class="toggle"><input type="checkbox" data-change="wa" ' + (v.wa_aktif ? 'checked' : '') + '><i></i></span></label>' +
      '<div class="field mt"><label class="lbl" for="ns-token">Token API Fonnte</label><input class="input mono" id="ns-token" type="password" autocomplete="off" data-input="token" value="' + esc(v.token) + '" placeholder="' + esc(pg.fonnte_token_mask || 'Tempel token dari dashboard fonnte.com') + '"><span class="help">' + ic('lock', 's') + 'Disimpan di Script Properties server — tidak pernah tampil utuh di aplikasi. Kosongkan untuk tetap memakai token lama.</span></div>' +
      '<div class="field"><label class="lbl">Nomor WA pengirim <span class="opt">informasi</span></label><input class="input" data-input="nomor" inputmode="tel" value="' + esc(v.nomor_wa_pengirim) + '" placeholder="08xxxxxxxxxx"></div>' +
      (pg.fonnte_token_terisi ? '<button class="btn btn-ghost btn-sm" data-act="hapusToken" style="color:#DC2626">' + ic('trash-2', 's') + ' Hapus token tersimpan</button>' : '') + '</div>' +
      '<div class="card"><div class="row between"><div class="row"><span class="avatar s c-blue">' + ic('mail', 's') + '</span><div><h3>Email (Gmail)</h3><div class="xs muted">Surat resmi dikirim beserta lampiran PDF</div></div></div>' + (pg.sisa_kuota_email !== null && pg.sisa_kuota_email !== undefined ? pill('Kuota hari ini: ' + pg.sisa_kuota_email, 'blue') : '') + '</div>' +
      '<label class="row between mt-l" style="cursor:pointer"><span><b class="small">Aktifkan pengiriman email</b><div class="xs muted">Memakai akun Google pemilik skrip</div></span><span class="toggle"><input type="checkbox" data-change="email" ' + (v.email_aktif ? 'checked' : '') + '><i></i></span></label></div>' +
      '<button class="btn btn-primary btn-block btn-lg" data-act="simpan">' + ic('save') + ' Simpan Pengaturan</button></div><div class="stack">' +
      '<div class="card"><h3 class="mb">Kirim pesan uji</h3>' + UI.seg([{ k: 'wa', l: 'WhatsApp', ic: 'message-circle' }, { k: 'email', l: 'Email', ic: 'mail' }], v.kanal, 'kanal') +
      '<div class="field mt"><label class="lbl">' + (v.kanal === 'wa' ? 'Nomor WhatsApp tujuan' : 'Alamat email tujuan') + '</label><input class="input" data-tujuan ' + (v.kanal === 'wa' ? 'inputmode="tel" placeholder="08xxxxxxxxxx"' : 'type="email" placeholder="nama@email.com"') + '></div><button class="btn btn-outline btn-block" data-act="tes">' + ic('send', 's') + ' Kirim Uji</button><p class="xs muted mt">Simpan token terlebih dahulu sebelum menguji WhatsApp.</p></div>' +
      '<div class="card"><div class="row between mb"><h3>Antrean notifikasi</h3><button class="btn btn-ghost btn-sm" data-act="proses">' + ic('refresh-cw', 's') + ' Proses sekarang</button></div>' +
      '<div class="grid2" style="gap:10px">' + [['Menunggu', 'amber', 'hourglass'], ['Terkirim', 'emerald', 'circle-check'], ['Gagal', 'rose', 'circle-alert'], ['Gagal Permanen', 'slate', 'circle-x']].map((x) => '<div class="row c-' + x[1] + '" style="gap:8px"><span class="avatar xs" style="background:var(--t);color:var(--c)">' + ic(x[2], 's') + '</span><div><b>' + (j[x[0]] || 0) + '</b><div class="xs muted">' + x[0] + '</div></div></div>').join('') + '</div>' +
      (an.galatTerakhir ? '<div class="alert err mt">' + ic('circle-alert') + '<div><b>Galat terakhir</b><br><span class="small">' + esc(an.galatTerakhir) + '</span></div></div>' : '') +
      '<p class="xs muted mt">Antrean diproses otomatis setiap 5 menit (maks. 25 pesan per putaran, 3× percobaan).</p></div>' +
      '<div class="alert info">' + ic('info') + '<div>Pesan WA berisi pemberitahuan singkat dan tautan ke aplikasi. Isi surat dan catatan siswa tidak dikirim lewat WA demi privasi.</div></div>' +
      '</div></div><div style="height:24px"></div></div>';
    bind(el, {
      'change:wa': (c) => (v.wa_aktif = c.checked), 'change:email': (c) => (v.email_aktif = c.checked),
      'input:token': (i) => (v.token = i.value.trim()), 'input:nomor': (i) => (v.nomor_wa_pengirim = i.value),
      kanal: (b) => { v.kanal = b.dataset.k; this.render(el); },
      hapusToken: async (b) => { if (!(await konfirmasi({ title: 'Hapus token Fonnte?', text: 'Pengiriman WhatsApp akan berhenti sampai token baru diisi.', ok: 'Hapus', danger: true }))) return; const r = await App.aksi('pengaturanSimpan', { fonnte_token: '', wa_aktif: false }, { btn: b }); if (r) { S.boot.pengaturan = r.pengaturan; el._v = null; this.render(el); } },
      simpan: async (b) => {
        const kirim = { wa_aktif: v.wa_aktif, email_aktif: v.email_aktif, nomor_wa_pengirim: v.nomor_wa_pengirim };
        if (v.token) kirim.fonnte_token = v.token;
        if (v.wa_aktif && !v.token && !pg.fonnte_token_terisi) { toast('Isi token Fonnte untuk mengaktifkan WhatsApp.', 'warn'); return; }
        const r = await App.aksi('pengaturanSimpan', kirim, { btn: b });
        if (r) { S.boot.pengaturan = r.pengaturan; el._v = null; this.render(el); }
      },
      tes: async (b) => { const t = el.querySelector('[data-tujuan]').value.trim(); if (!t) { toast('Isi tujuan pengiriman.', 'warn'); return; } busy(b, true, 'Mengirim...'); const r = await api('notifTes', { kanal: v.kanal, tujuan: t }); busy(b, false); toast(r.message, r.success ? 'success' : 'error'); },
      proses: async (b) => { busy(b, true); const r = await api('prosesAntreanSekarang', {}); busy(b, false); if (r.success) { S.boot.antrean = r.data; toast(r.message, 'success'); this.render(el); } else toast(r.message, 'error'); }
    });
  }
});

// ============================================================ TEMPLAT SURAT
const PLACEHOLDER = ['NAMA_SISWA', 'NISN', 'KELAS', 'NAMA_ORTU', 'NOMOR', 'TANGGAL', 'JADWAL', 'TEMPAT', 'PEMICU', 'TOTAL_POIN', 'CATATAN', 'NAMA_SEKOLAH', 'NAMA_KEPSEK', 'KOTA', 'DAFTAR_PELANGGARAN', 'JADWAL_BLOK'];
halaman('template', {
  roles: ['admin'], title: 'Templat Surat', nav: 'template', live: false,
  render(el) {
    const list = S.boot.template || [];
    const jenis = el._j || (list[0] || {}).jenis || 'SP1';
    const t = el._t && el._t.jenis === jenis ? el._t : (el._t = Object.assign({ jenis, judul: '', kode_nomor: '', isi: '' }, list.find((x) => x.jenis === jenis) || {}));
    const contoh = (S.boot.siswa || [])[0] || { nama: 'Rizky Pratama', nisn: '0081234567', kelas: 'XI IPA 2', nama_ortu: 'Bpk. Hendra' };
    const preview = () => renderSurat(Object.assign(dataSurat({ jenis, nomor: '001/' + (t.kode_nomor || jenis) + '/SMAPATISPA/X/' + new Date().getFullYear(), nama_siswa: contoh.nama, nisn: contoh.nisn, kelas: contoh.kelas, nama_ortu: contoh.nama_ortu, pemicu: 'Poin mencapai 50 (total 55)', poin: 55, jadwal_pertemuan: tambahHari(hariIni(), 3) + 'T09:00', tempat: (S.cfg || {}).lokasi_bk || 'Ruang BK', catatan: 'Mohon membawa buku penghubung.', dibuat: hariIni() + ' 08:00', rincian: [{ tanggal: tambahHari(hariIni(), -20), nama: 'Terlambat masuk sekolah', poin: 5 }, { tanggal: tambahHari(hariIni(), -9), nama: 'Membolos jam pelajaran', poin: 25 }, { tanggal: tambahHari(hariIni(), -2), nama: 'Merokok di lingkungan sekolah', poin: 25 }] }, { pemeriksa: 'Nama Pemeriksa' }), { tpl: { judul: t.judul, isi: t.isi } }));
    el.innerHTML = UI.ph('Templat Surat', 'Isi surat otomatis') + '<div class="wrap"><div class="mt-l">' + UI.tabs(list.map((x) => ({ k: x.jenis, l: ((S.cfg || {}).labelSurat || {})[x.jenis] || x.jenis })), jenis, 'j') + '</div>' +
      '<div class="cols split mt"><div class="card"><div class="grid2"><div class="field"><label class="lbl">Judul surat</label><input class="input" data-input="f" name="judul" maxlength="150" value="' + esc(t.judul) + '"></div><div class="field"><label class="lbl">Kode nomor</label><input class="input mono" data-input="f" name="kode_nomor" maxlength="40" value="' + esc(t.kode_nomor) + '" placeholder="SP.1"></div></div>' +
      '<div class="field"><label class="lbl">Isi surat <span class="opt">pisahkan paragraf dengan baris kosong</span></label><textarea class="textarea mono" data-input="f" name="isi" rows="16" maxlength="20000" style="font-size:13px;line-height:1.55">' + esc(t.isi) + '</textarea></div>' +
      '<div class="xs b muted mb-s">SISIPKAN DATA OTOMATIS (ketuk)</div><div class="chips">' + PLACEHOLDER.map((p) => '<button class="chip" data-act="sisip" data-k="' + p + '" style="font-family:var(--f-mono);font-size:11px">{{' + p + '}}</button>').join('') + '</div>' +
      '<p class="xs muted mt">{{DAFTAR_PELANGGARAN}} dan {{JADWAL_BLOK}} ditulis sebagai paragraf tersendiri. Paragraf {{CATATAN}} otomatis disembunyikan bila kosong.</p>' +
      '<div class="btns mt"><button class="btn btn-primary" data-act="simpan">' + ic('save', 's') + ' Simpan Templat</button><button class="btn btn-ghost" data-act="reset">' + ic('undo-2', 's') + ' Batalkan perubahan</button></div></div>' +
      '<div><div class="xs b muted mb">PRATINJAU (CONTOH DATA)</div><div class="a4-wrap"><div class="a4" data-a4>' + preview() + '</div></div></div></div><div style="height:24px"></div></div>';
    skalaA4(el);
    const segar = debounce(() => { const a = el.querySelector('[data-a4]'); if (a) a.innerHTML = preview(); }, 250);
    bind(el, {
      j: (b) => { el._j = b.dataset.k; this.render(el); },
      'input:f': (i) => { t[i.name] = i.value; segar(); },
      sisip: (b) => { const ta = el.querySelector('[name=isi]'); const s = ta.selectionStart || ta.value.length, e = ta.selectionEnd || s; const k = '{{' + b.dataset.k + '}}'; const blok = /DAFTAR_PELANGGARAN|JADWAL_BLOK/.test(b.dataset.k); const ins = blok ? '\n\n' + k + '\n\n' : k; ta.value = ta.value.slice(0, s) + ins + ta.value.slice(e); t.isi = ta.value; ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length); segar(); },
      reset: () => { el._t = null; this.render(el); },
      simpan: async (b) => {
        if (!t.judul.trim() || !t.isi.trim()) { toast('Judul dan isi tidak boleh kosong.', 'warn'); return; }
        const r = await App.aksi('templateSimpan', { jenis, judul: t.judul, kode_nomor: t.kode_nomor, isi: t.isi }, { btn: b });
        if (r) { const x = list.find((y) => y.jenis === jenis); if (x) Object.assign(x, { judul: t.judul, kode_nomor: t.kode_nomor, isi: t.isi }); (S.cfg.suratTpl = S.cfg.suratTpl || {})[jenis] = { judul: t.judul, isi: t.isi, kode_nomor: t.kode_nomor }; }
      }
    });
  }
});

// ============================================================ LOG AKTIVITAS
halaman('log', {
  roles: ['admin'], title: 'Log Aktivitas', nav: 'log',
  render(el) {
    const f = el._f = el._f || { q: '', peran: '', hal: 1 };
    const gambar = (data) => {
      const q = f.q.toLowerCase();
      const rows = (data || []).filter((r) => (!f.peran || r.peran === f.peran) && (!q || (r.nama + ' ' + r.aksi + ' ' + r.objek).toLowerCase().includes(q)));
      const box = el.querySelector('[data-isi]'); if (!box) return;
      box.innerHTML = UI.tabel([
        { k: 'waktu', l: 'Waktu', f: (r) => '<span class="small nowrap">' + esc(tgl(r.waktu) + ' ' + jam(r.waktu)) + '</span>' },
        { k: 'nama', l: 'Pengguna', f: (r) => '<b class="small">' + esc(r.nama || '-') + '</b>' }, { k: 'peran', l: 'Peran', f: (r) => (r.peran ? pill(LABEL_PERAN[r.peran] || r.peran, PERAN_C[r.peran] || 'slate') : '') },
        { k: 'aksi', l: 'Aksi', f: (r) => '<span class="mono xs">' + esc(r.aksi) + '</span>' }, { k: 'objek', l: 'Objek', f: (r) => '<span class="small">' + esc(r.objek || '') + '</span>' }
      ], rows.slice((f.hal - 1) * 25, f.hal * 25)) + UI.pager(rows.length, f.hal, 25, 'hal');
      el._rows = rows;
    };
    el.innerHTML = UI.ph('Log Aktivitas', '300 aktivitas terakhir') + '<div class="wrap"><div class="toolbar mt-l" style="flex-wrap:wrap"><div class="search-in" style="flex:1;min-width:200px">' + ic('search', 's') + '<input class="input" type="search" placeholder="Cari pengguna, aksi, objek..." value="' + esc(f.q) + '" data-input="q"></div>' +
      '<select class="select" data-change="peran" style="max-width:180px" aria-label="Peran"><option value="">Semua peran</option>' + Object.keys(LABEL_PERAN).map((p) => '<option value="' + p + '" ' + (f.peran === p ? 'selected' : '') + '>' + LABEL_PERAN[p] + '</option>').join('') + '</select>' +
      '<button class="btn btn-outline" data-act="muat">' + ic('refresh-cw', 's') + '</button><button class="btn btn-outline" data-act="xlsx" style="color:#047857;border-color:#A7F3D0">' + ic('file-spreadsheet', 's') + ' Excel</button></div>' +
      '<div class="card p0"><div style="padding:6px 12px" data-isi>' + skeleton(6, 44) + '</div></div>' +
      '<div class="alert info mt">' + ic('lock') + '<div>Log akses catatan konseling rahasia disimpan di spreadsheet terpisah yang hanya dapat dibuka pemilik akun Google sekolah.</div></div><div style="height:24px"></div></div>';
    const muat = (paksa) => swr('log', 'logList', {}, (d) => { el._data = d; gambar(d); }, { fresh: paksa ? 0 : 30000, force: paksa, onError: (r) => { const b = el.querySelector('[data-isi]'); if (b) b.innerHTML = emptyState('wifi-off', 'Gagal memuat log', r.message); } });
    bind(el, {
      'input:q': debounce((i) => { f.q = i.value; f.hal = 1; gambar(el._data); }, 200),
      'change:peran': (s) => { f.peran = s.value; f.hal = 1; gambar(el._data); },
      hal: (b) => { f.hal = +b.dataset.k; gambar(el._data); },
      muat: () => muat(true),
      xlsx: () => eksporExcel('Log Aktivitas ' + hariIni(), { Log: (el._rows || []).map((r) => ({ waktu: r.waktu, pengguna: r.nama, peran: r.peran, aksi: r.aksi, objek: r.objek })) })
    });
    muat(false);
  }
});
