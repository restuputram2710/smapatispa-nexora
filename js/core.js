/* ============================================================
   SMAPATISPA NEXORA — core.js
   State, penyimpanan lokal (SWR), API fetch (timeout + retry + idempoten),
   router hash, utilitas UI (modal, toast, grafik SVG, ekspor, berkas).
   ============================================================ */
'use strict';

const CFG = window.NEXORA_CONFIG || {};
const GAS_URL = CFG.GAS_URL || '';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/** State aplikasi (memori). boot = data bootstrap peran aktif. */
const S = { token: '', me: null, role: '', boot: null, cfg: null, exp: 0, current: null, pub: null };

// ── Penyimpanan lokal ber-namespace + versi skema ──
const LS = 'nexora:v1:';
const Store = {
  get(k, d) { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) {
    const s = JSON.stringify(v);
    try { localStorage.setItem(LS + k, s); }
    catch (e) {
      try { Object.keys(localStorage).filter((x) => x.indexOf(LS + 'u:') === 0 && x.indexOf(ukey('')) < 0).forEach((x) => localStorage.removeItem(x)); localStorage.setItem(LS + k, s); } catch (e2) { /* tetap jalan */ }
    }
  },
  del(k) { try { localStorage.removeItem(LS + k); } catch (e) {} }
};
const ukey = (k) => 'u:' + (S.me ? S.me.tipe + ':' + S.me.id : 'anon') + ':' + k;
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };

// ── Pengukur performa: Perf.table() di console ──
const Perf = {
  rows: [],
  add(action, total, server) { this.rows.push({ action, total, server: server ?? null, net: server != null ? total - server : null }); if (this.rows.length > 200) this.rows.shift(); },
  table() { console.table(this.rows.slice(-30)); }
};
window.Perf = Perf;

// ============================================================
// API — fetch POST text/plain (tanpa preflight CORS)
// ============================================================
const READ_ACTIONS = /^(bootstrap|batch|slotTersedia|laporan|logList|kasusDetail|berkas|lacakLaporan|verifikasiSurat|publicConfig|login)$/;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));

async function apiOnce(action, data, timeout, reqId) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const t0 = performance.now();
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST', redirect: 'follow', cache: 'no-store', signal: ctrl.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: S.token || '', role: S.role || '', reqId, data: data || {} })
    });
    const text = await res.text();
    try { const j = JSON.parse(text); Perf.add(action, Math.round(performance.now() - t0), j.ms); return j; }
    catch (e) { return { success: false, network: true, retryable: res.status >= 500 || res.status === 429 || res.status === 200, message: 'Server membalas tidak sesuai (HTTP ' + res.status + '). Periksa URL server di config.js.' }; }
  } catch (err) {
    return { success: false, network: true, retryable: true, message: err.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Koneksi terputus. Periksa internet Anda.' };
  } finally { clearTimeout(timer); }
}

function waitOnline(ms) {
  return new Promise((r) => {
    if (navigator.onLine !== false) return r();
    const done = () => { clearTimeout(t); removeEventListener('online', done); r(); };
    const t = setTimeout(done, ms); addEventListener('online', done);
  });
}

async function api(action, data, opt = {}) {
  if (!GAS_URL || /XXXX/.test(GAS_URL)) return { success: false, message: 'URL server belum diisi di js/config.js.' };
  const isRead = READ_ACTIONS.test(action);
  const reqId = isRead ? '' : (opt.reqId || uuid());
  const tries = isRead ? 3 : 2;
  let res;
  for (let i = 0; i < tries; i++) {
    if (i) { await sleep(1200 * i); if (navigator.onLine === false) await waitOnline(15000); }
    res = await apiOnce(action, data, isRead ? (i ? 40000 : 25000) : 90000, reqId);
    if (res.success || !res.retryable) break;
  }
  if (!res.success && res.data && res.data.code === 'AUTH' && action !== 'login') onSessionExpired();
  if (!res.success && res.data && res.data.code === 'GANTI_SANDI') App.showGantiSandi(true);   // tidak menggambar ulang bila sudah tampil
  return res;
}

function warmUp() {
  if (!GAS_URL || /XXXX/.test(GAS_URL)) return;
  fetch(GAS_URL + '?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}

/**
 * Stale-while-revalidate: render dari cache seketika, segarkan di latar.
 * render(data, dariCache) dipanggil maksimal 2× dan hanya bila data berubah.
 */
async function swr(key, action, payload, render, opt = {}) {
  const fresh = opt.fresh ?? 60000;
  const c = Store.get(ukey(key), null);
  if (c && render && !opt.skipCache) render(c.data, true);
  if (c && !opt.force && Date.now() - c.t < fresh) return { success: true, data: c.data, cached: true };
  const res = await api(action, payload);
  if (res.success) {
    const h = hashStr(JSON.stringify(res.data));
    Store.set(ukey(key), { t: Date.now(), h, data: res.data });
    if (render && (!c || c.h !== h)) render(res.data, false);
  } else if (!c && opt.onError) opt.onError(res);
  return res;
}

function onSessionExpired() {
  if (!S.token) return;
  toast('Sesi berakhir. Silakan masuk kembali.', 'warn');
  App.logout(true);
}

// ============================================================
// ROUTER HASH — halaman dibuat sekali, dirender dari state
// ============================================================
const Pages = {};
function page(name, def) { Pages[name] = Object.assign({ roles: '*' }, def); }
function go(hash) { if (location.hash === hash) App.route(); else location.hash = hash; }
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter((x) => x !== '').map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  return { name: parts[0] || '', params: parts.slice(1) };
}
function back(fallback) { if (history.length > 1 && S.navCount > 1) history.back(); else go(fallback || '#/beranda'); }

/**
 * Ikat aksi di dalam elemen akar (delegasi sekali).
 * handlers: { namaAksi(el, ev), 'submit:namaForm'(form, ev), 'change:nama'(el, ev), 'input:nama'(el, ev) }
 */
function bind(root, handlers) {
  root._h = handlers;
  if (root._bound) return;
  root._bound = true;
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || !root.contains(t) || t.disabled) return;
    const fn = root._h && root._h[t.dataset.act];
    if (fn) { e.preventDefault(); fn(t, e); }
  });
  root.addEventListener('submit', (e) => {
    const f = e.target;
    const fn = root._h && root._h['submit:' + (f.dataset.form || '')];
    if (fn) { e.preventDefault(); fn(f, e); }
  });
  ['change', 'input'].forEach((ev) => root.addEventListener(ev, (e) => {
    const t = e.target.closest('[data-' + ev + ']');
    if (!t || !root.contains(t)) return;
    const fn = root._h && root._h[ev + ':' + t.dataset[ev]];
    if (fn) fn(t, e);
  }));
}

/** Ambil nilai form → objek (checkbox → boolean). */
function formData(form) {
  const o = {};
  $$('[name]', form).forEach((el) => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else if (el.type !== 'file') o[el.name] = el.value.trim ? el.value.trim() : el.value;
  });
  return o;
}

// ============================================================
// FORMAT TANGGAL (data server dalam WIB)
// ============================================================
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BLN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_S = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const pad2 = (n) => String(n).padStart(2, '0');
function D(s) {
  s = String(s || '');
  if (s.length < 10) return null;
  const d = new Date(s.slice(0, 10) + 'T' + (s.length >= 16 ? s.slice(11, 16) : '12:00') + ':00');
  return isNaN(d) ? null : d;
}
function hariIni() { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function tambahHari(t, n) { const d = new Date(t + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function tgl(s) { const d = D(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : '-'; }
function tglP(s) { const d = D(s); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN_P[d.getMonth()] + ' ' + d.getFullYear() : '-'; }
function tglS(s) { const d = D(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] : '-'; }
function jam(s) { s = String(s || ''); return s.length >= 16 ? s.slice(11, 16) : (/^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : ''); }
function tile(s) { const d = D(s); return d ? { m: BLN[d.getMonth()].toUpperCase(), d: pad2(d.getDate()), w: HARI_S[d.getDay()] } : { m: '', d: '--', w: '' }; }
function relatif(s) {
  const d = D(s); if (!d) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400 && d.getDate() === new Date().getDate()) return Math.floor(diff / 3600) + ' jam lalu';
  if (diff < 172800) return 'kemarin';
  if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
  return tgl(s);
}
function sapaan() { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; }

// ============================================================
// IKON & KOMPONEN KECIL
// ============================================================
function ic(name, cls) {
  const b = (window.ICONS || {})[name];
  if (!b) { if (window.ICONS) console.warn('Ikon hilang:', name); return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24"></svg>'; }
  return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + b + '</svg>';
}
const WARNA = ['indigo', 'violet', 'blue', 'rose', 'orange', 'amber', 'emerald', 'teal'];
function inisial(nama) {
  const p = String(nama || '?').replace(/^(Dra?s?\.|Hj?\.|H\.|Ir\.)\s*/gi, '').replace(/,.*$/, '').split(/\s+/).filter(Boolean);
  return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
}
function warnaDari(s) { let h = 0; String(s).split('').forEach((c) => (h = (h * 17 + c.charCodeAt(0)) % 997)); return WARNA[h % WARNA.length]; }
function avatar(nama, cls) { return '<span class="avatar ' + (cls || '') + ' c-' + warnaDari(nama) + '" aria-hidden="true">' + esc(inisial(nama)) + '</span>'; }

const PILL = {
  'Menunggu': 'amber', 'Dijadwalkan': 'blue', 'Dijadwal Ulang': 'violet', 'Selesai': 'green', 'Dibatalkan': 'slate', 'Ditolak': 'red', 'Diproses': 'blue',
  'Baru': 'slate', 'Ditinjau': 'blue', 'Dalam Penanganan': 'violet', 'Tindak Lanjut': 'amber',
  'Draf': 'slate', 'Diperiksa': 'orange', 'Menunggu TTD': 'amber', 'Terkirim': 'green',
  'Tersedia': 'green', 'Terisi': 'slate', 'Terlambat': 'red', 'Izin Keluar': 'blue', 'Sakit': 'amber', 'Izin': 'violet', 'Alpa': 'red',
  'Gagal': 'red', 'Gagal Permanen': 'red', 'Aktif': 'green', 'Nonaktif': 'slate', 'Terbit': 'green',
  'Rendah': 'slate', 'Sedang': 'amber', 'Tinggi': 'red', 'Anonim': 'violet', 'Terbatas': 'blue', 'Terbuka': 'slate', 'PRIORITAS': 'red'
};
function pill(t, cls, extra) { return '<span class="pill ' + (extra || '') + ' p-' + (cls || PILL[t] || 'slate') + '">' + esc(t) + '</span>'; }
const LEVEL = { aman: { c: 'emerald', p: 'green', t: 'AMAN' }, waspada: { c: 'amber', p: 'amber', t: 'WASPADA' }, peringatan: { c: 'orange', p: 'orange', t: 'PERINGATAN' }, kritis: { c: 'rose', p: 'red', t: 'KRITIS' } };
function levelInfo(kode) { return LEVEL[kode] || LEVEL.aman; }

function emptyState(icon, judul, teks, aksi) {
  return '<div class="empty"><div class="ill">' + ic(icon || 'inbox', 'xl') + '</div><h3>' + esc(judul) + '</h3>' + (teks ? '<p>' + esc(teks) + '</p>' : '') + (aksi || '') + '</div>';
}
function skeleton(n, h) { let s = ''; for (let i = 0; i < (n || 3); i++) s += '<div class="sk" style="height:' + (h || 72) + 'px;margin-bottom:12px"></div>'; return s; }

function busy(btn, on, teks) {
  if (!btn) return;
  if (on) { btn._html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (teks ? ' ' + esc(teks) : ''); }
  else if (btn._html !== undefined) { btn.disabled = false; btn.innerHTML = btn._html; }
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type) {
  type = type || 'success';
  const icon = { success: 'circle-check', error: 'circle-alert', warn: 'triangle-alert', info: 'info' }[type] || 'info';
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = ic(icon) + '<div class="grow">' + esc(msg) + '</div><button class="x" aria-label="Tutup">' + ic('x', 's') + '</button>';
  $('#toasts').appendChild(el);
  const hapus = () => { el.style.opacity = '0'; el.style.transition = 'opacity .2s'; setTimeout(() => el.remove(), 200); };
  el.querySelector('.x').onclick = hapus;
  setTimeout(hapus, type === 'error' ? 6000 : 3500);
}

// ============================================================
// MODAL / LEMBAR BAWAH
// ============================================================
const Modal = {
  stack: [],
  open(o) {
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = '<div class="sheet ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><div class="grab"></div>' +
      '<div class="sheet-head"><h3>' + esc(o.title) + '</h3><button class="icon-btn" data-x aria-label="Tutup">' + ic('x') + '</button></div>' +
      '<div class="sheet-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="sheet-foot">' + o.foot + '</div>' : '') + '</div>';
    const root = $('#overlay');
    root.appendChild(ov); root.classList.add('on');
    document.body.style.overflow = 'hidden';
    const m = {
      el: ov.querySelector('.sheet'), ov,
      close(v) {
        if (m.closed) return; m.closed = true;
        ov.remove();
        Modal.stack = Modal.stack.filter((x) => x !== m);
        if (!Modal.stack.length) { root.classList.remove('on'); document.body.style.overflow = ''; }
        if (o.onClose) o.onClose(v);
      }
    };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov && o.dismiss !== false) m.close(); });
    ov.querySelector('[data-x]').onclick = () => m.close();
    this.stack.push(m);
    if (o.handlers) bind(m.el, o.handlers);
    if (o.onMount) o.onMount(m.el, m);
    const f = m.el.querySelector('input:not([type=hidden]):not([type=file]),textarea,select');
    if (f && window.innerWidth >= 768) setTimeout(() => f.focus(), 50);
    return m;
  },
  top() { return this.stack[this.stack.length - 1]; },
  closeAll() { this.stack.slice().forEach((m) => m.close()); }
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Modal.top()) Modal.top().close(); });

function konfirmasi(o) {
  return new Promise((res) => {
    const m = Modal.open({
      title: o.title || 'Konfirmasi',
      body: '<p style="color:var(--text-2)">' + esc(o.text || '') + '</p>',
      foot: '<button class="btn btn-outline" data-act="tidak">Batal</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ya">' + esc(o.ok || 'Ya, lanjutkan') + '</button>',
      handlers: { ya: () => m.close(true), tidak: () => m.close(false) },
      onClose: (v) => res(!!v)
    });
  });
}

/** Minta teks (alasan, catatan). Resolve null bila batal. */
function mintaTeks(o) {
  return new Promise((res) => {
    const m = Modal.open({
      title: o.title,
      body: '<form data-form="t"><div class="field"><label class="lbl">' + esc(o.label || 'Catatan') + (o.required ? ' <span class="req">*</span>' : '') + '</label>' +
        '<textarea class="textarea" name="t" maxlength="' + (o.max || 500) + '" placeholder="' + esc(o.placeholder || '') + '">' + esc(o.value || '') + '</textarea></div>' + (o.extra || '') + '</form>',
      foot: '<button class="btn btn-outline" data-act="batal">Batal</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' + esc(o.ok || 'Simpan') + '</button>',
      handlers: {
        batal: () => m.close(null),
        ok: () => {
          const v = m.el.querySelector('[name=t]').value.trim();
          if (o.required && !v) { m.el.querySelector('[name=t]').classList.add('bad'); return; }
          m.close(o.withForm ? formData(m.el.querySelector('form')) : v);
        },
        'submit:t': () => m.el.querySelector('[data-act=ok]').click()
      },
      onClose: (v) => res(v === undefined ? null : v)
    });
  });
}

// ============================================================
// BERKAS: baca + kompres gambar, unduh base64, muat skrip lazy
// ============================================================
function bacaBerkas(file, o = {}) {
  const maxMB = o.maxMB || 5;
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Tidak ada berkas.'));
    const r = new FileReader();
    r.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
    r.onload = () => {
      const url = r.result;
      const gambar = /^image\/(jpeg|png|webp)$/.test(file.type);
      if (!gambar) {
        if (file.size > maxMB * 1048576) return reject(new Error('Ukuran ' + file.name + ' melebihi ' + maxMB + ' MB.'));
        return resolve({ nama: file.name, mime: file.type || 'application/octet-stream', data: String(url).split(',')[1], ukuran: file.size });
      }
      const img = new Image();
      img.onload = () => {
        const maks = o.dim || 1600;
        const sk = Math.min(1, maks / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sk); c.height = Math.round(img.height * sk);
        const ctx = c.getContext('2d');
        if (!o.png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const mime = o.png ? 'image/png' : 'image/jpeg';
        const out = c.toDataURL(mime, o.q || 0.82);
        const nama = o.png ? file.name.replace(/\.\w+$/, '') + '.png' : file.name.replace(/\.\w+$/, '') + '.jpg';
        const data = out.split(',')[1];
        if (data.length * 0.75 > maxMB * 1048576) return reject(new Error('Gambar terlalu besar.'));
        resolve({ nama, mime, data, ukuran: Math.round(data.length * 0.75), preview: out });
      };
      img.onerror = () => reject(new Error('Gambar tidak valid.'));
      img.src = url;
    };
    r.readAsDataURL(file);
  });
}
function b64keBlob(b64, mime) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: mime });
}
function simpanBlob(blob, nama) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function unduhBerkas(jenis, id, btn, idx) {
  busy(btn, true);
  const r = await api('berkas', { jenis, id, idx: idx || 0 });
  busy(btn, false);
  if (!r.success) { toast(r.message, 'error'); return null; }
  simpanBlob(b64keBlob(r.data.data, r.data.mime), r.data.nama);
  return r.data;
}
async function lihatBerkas(jenis, id, idx, btn) {
  busy(btn, true);
  const r = await api('berkas', { jenis, id, idx: idx || 0 });
  busy(btn, false);
  if (!r.success) { toast(r.message, 'error'); return; }
  const f = r.data;
  const url = URL.createObjectURL(b64keBlob(f.data, f.mime));
  const isi = /^image\//.test(f.mime) ? '<img src="' + url + '" alt="' + esc(f.nama) + '" style="width:100%;border-radius:12px">'
    : /^audio\//.test(f.mime) ? '<audio controls src="' + url + '" style="width:100%"></audio>'
      : '<div class="empty">' + ic('file-text', 'xl') + '<p>' + esc(f.nama) + '</p></div>';
  Modal.open({ title: f.nama, body: isi, foot: '<button class="btn btn-primary" data-act="dl">' + ic('download') + ' Unduh</button>', handlers: { dl: () => simpanBlob(b64keBlob(f.data, f.mime), f.nama) }, onClose: () => URL.revokeObjectURL(url) });
}

const _scripts = {};
function muatSkrip(src) {
  if (_scripts[src]) return _scripts[src];
  _scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res;
    s.onerror = () => { delete _scripts[src]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
    document.head.appendChild(s);
  });
  return _scripts[src];
}

// ============================================================
// EKSPOR Excel & PDF (pustaka dimuat hanya saat diperlukan)
// ============================================================
const LIB = {
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js',
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  autotable: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
};
async function eksporExcel(nama, sheets) {
  try {
    await muatSkrip(LIB.xlsx);
    const wb = XLSX.utils.book_new();
    Object.keys(sheets).forEach((n) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheets[n].length ? sheets[n] : [{ Keterangan: 'Tidak ada data' }]), n.slice(0, 31)));
    XLSX.writeFile(wb, nama + '.xlsx');
  } catch (e) {
    const rows = sheets[Object.keys(sheets)[0]] || [];
    const kol = rows.length ? Object.keys(rows[0]) : [];
    const csv = '﻿' + [kol.join(';')].concat(rows.map((r) => kol.map((k) => '"' + String(r[k] ?? '').replace(/"/g, '""') + '"').join(';'))).join('\n');
    simpanBlob(new Blob([csv], { type: 'text/csv' }), nama + '.csv');
    toast('Pustaka Excel tidak termuat, berkas diunduh sebagai CSV.', 'info');
  }
}
async function eksporPdf(judul, kolom, rows, sub) {
  try {
    await muatSkrip(LIB.jspdf); await muatSkrip(LIB.autotable);
    const doc = new window.jspdf.jsPDF({ orientation: kolom.length > 5 ? 'landscape' : 'portrait' });
    doc.setFontSize(14); doc.text(judul, 14, 16);
    doc.setFontSize(9); doc.setTextColor(100); doc.text((sub || '') + ' · Dicetak ' + tglP(hariIni()), 14, 22);
    doc.autoTable({ startY: 27, head: [kolom.map((c) => c.l)], body: rows.map((r) => kolom.map((c) => String(r[c.k] ?? ''))), styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [79, 70, 229] }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(judul.replace(/[^\w\- ]+/g, '') + '.pdf');
  } catch (e) {
    const w = window.open('', '_blank');
    if (!w) { toast(e.message, 'error'); return; }
    w.document.write('<html><head><title>' + esc(judul) + '</title><style>body{font-family:Arial;font-size:11px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px}th{background:#EEF2FF}</style></head><body><h3>' + esc(judul) + '</h3><p>' + esc(sub || '') + '</p><table><tr>' + kolom.map((c) => '<th>' + esc(c.l) + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + kolom.map((c) => '<td>' + esc(r[c.k] ?? '') + '</td>').join('') + '</tr>').join('') + '</table><script>print()<\/script></body></html>');
    w.document.close();
  }
}

// ============================================================
// GRAFIK SVG RINGAN (tanpa pustaka)
// ============================================================
const CHART_C = ['#4F46E5', '#F97316', '#14B8A6', '#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];
function grafikBatang(data, o = {}) {
  if (!data || !data.length || !data.some((d) => d.nilai)) return emptyState('chart-column', 'Belum ada data', '');
  const W = 340, H = o.h || 170, top = 18, bottom = 26, n = data.length;
  const max = Math.max(1, ...data.map((d) => d.nilai));
  const gap = 10, bw = (W - gap * (n + 1)) / n;
  let s = '';
  for (let g = 0; g <= 3; g++) { const y = top + (H - top - bottom) * g / 3; s += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--border-soft)" stroke-width="1"/>'; }
  data.forEach((d, i) => {
    const h = Math.max(d.nilai ? 3 : 0, (H - top - bottom) * d.nilai / max);
    const x = gap + i * (bw + gap), y = H - bottom - h;
    const col = o.warna || CHART_C[0];
    s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="' + col + '" opacity="' + (i === n - 1 && o.sorotAkhir !== false ? 1 : .55) + '"><title>' + esc(d.label + ': ' + d.nilai) + '</title></rect>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" style="font-weight:600;fill:var(--text-2)">' + d.nilai + '</text>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(String(d.label).slice(0, 10)) + '</text>';
  });
  return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik batang') + '">' + s + '</svg></div>';
}
function grafikGaris(data, o = {}) {
  if (!data || !data.length || !data.some((d) => d.nilai)) return emptyState('chart-line', 'Belum ada data', '');
  const W = 340, H = o.h || 170, top = 20, bottom = 26, l = 16, r = 16;
  const max = Math.max(1, ...data.map((d) => d.nilai));
  const x = (i) => l + (W - l - r) * (data.length === 1 ? .5 : i / (data.length - 1));
  const y = (v) => H - bottom - (H - top - bottom) * v / max;
  const pts = data.map((d, i) => x(i) + ',' + y(d.nilai)).join(' ');
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  let s = '<defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + (o.warna || '#4F46E5') + '" stop-opacity=".25"/><stop offset="1" stop-color="' + (o.warna || '#4F46E5') + '" stop-opacity="0"/></linearGradient></defs>';
  for (let g = 0; g <= 3; g++) { const yy = top + (H - top - bottom) * g / 3; s += '<line x1="0" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--border-soft)"/>'; }
  s += '<polygon points="' + x(0) + ',' + (H - bottom) + ' ' + pts + ' ' + x(data.length - 1) + ',' + (H - bottom) + '" fill="url(#' + id + ')"/>';
  s += '<polyline points="' + pts + '" fill="none" stroke="' + (o.warna || '#4F46E5') + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  data.forEach((d, i) => {
    s += '<circle cx="' + x(i) + '" cy="' + y(d.nilai) + '" r="4" fill="var(--surface)" stroke="' + (o.warna || '#4F46E5') + '" stroke-width="2"><title>' + esc(d.label + ': ' + d.nilai) + '</title></circle>';
    s += '<text x="' + x(i) + '" y="' + (y(d.nilai) - 9) + '" text-anchor="middle" style="font-weight:600;fill:var(--text-2)">' + d.nilai + '</text>';
    s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(d.label) + '</text>';
  });
  return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik garis') + '">' + s + '</svg></div>';
}
function grafikBar(data, o = {}) {
  if (!data || !data.length) return emptyState('chart-bar', 'Belum ada data', '');
  const total = data.reduce((a, d) => a + d.nilai, 0) || 1;
  const max = Math.max(1, ...data.map((d) => d.nilai));
  return '<div class="hbars">' + data.slice(0, o.maks || 10).map((d, i) => {
    const pct = Math.round(d.nilai / total * 100);
    return '<div class="hbar" style="--c:' + (o.warna || CHART_C[i % CHART_C.length]) + '"><div class="top"><span class="ell">' + esc(d.label) + '</span><b>' + d.nilai + (o.persen !== false ? ' (' + pct + '%)' : '') + '</b></div><div class="bar"><i style="width:' + Math.max(2, d.nilai / max * 100) + '%"></i></div></div>';
  }).join('') + '</div>';
}
function cincin(pct, warna) {
  const r = 26, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
  return '<div class="ring"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--muted-bg)" stroke-width="7"/><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + (warna || '#10B981') + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (c * v / 100) + ' ' + c + '"/></svg><b>' + Math.round(v) + '%</b></div>';
}

// ============================================================
// TEMA & WARNA MEREK
// ============================================================
function hexKeRgb(h) { h = String(h || '').replace('#', ''); if (h.length !== 6) return null; return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); }
function campur(hex, ke, t) { const a = hexKeRgb(hex), b = hexKeRgb(ke); if (!a || !b) return hex; return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function terapkanMerek(cfg) {
  if (!cfg) return;
  const r = document.documentElement.style;
  const p = cfg.warna_utama || '#4F46E5';
  r.setProperty('--primary', p);
  r.setProperty('--primary-600', campur(p, '#000000', .14));
  const gelap = document.documentElement.dataset.theme === 'dark';
  r.setProperty('--primary-soft', gelap ? 'rgba(' + (hexKeRgb(p) || [79, 70, 229]).join(',') + ',.16)' : campur(p, '#FFFFFF', .9));
  r.setProperty('--primary-ring', 'rgba(' + (hexKeRgb(p) || [79, 70, 229]).join(',') + ',.22)');
  r.setProperty('--accent', cfg.warna_aksen || '#7C3AED');
  r.setProperty('--grad-end', cfg.warna_akhir || '#3B82F6');
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = p;
  document.title = cfg.nama_app || 'SMAPATISPA NEXORA';
}
function terapkanTema(t) {
  const tema = t || Store.get('tema', 'light');
  document.documentElement.dataset.theme = tema;
  terapkanMerek(S.cfg || S.pub);
}
function logoHtml(cfg, cls) {
  cfg = cfg || S.cfg || S.pub || {};
  return '<span class="brand-logo ' + (cls || '') + '">' + (cfg.logo ? '<img src="' + cfg.logo + '" alt="">' : ic('graduation-cap')) + '</span>';
}
/** Skala lembar A4 (794px) agar pas di layar sempit tanpa mengubah tata letak surat. */
function skalaA4(root) {
  $$('.a4', root || document).forEach((a) => {
    const w = a.parentElement.clientWidth - 24;
    a.style.zoom = w > 0 && w < 794 ? (w / 794).toFixed(4) : '';
  });
}
addEventListener('resize', debounce(() => skalaA4(), 150));
async function salin(teks) {
  try { await navigator.clipboard.writeText(teks); toast('Disalin ke papan klip.', 'info'); }
  catch (e) { const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('Disalin.', 'info'); }
}
