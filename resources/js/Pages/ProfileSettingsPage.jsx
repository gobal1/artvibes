import React, { useState } from 'react';

export default function ProfileSettingsPage({ auth, navigateTo, onAuthUpdate }) {
  const user = auth?.user || {};
  const [bio, setBio] = useState(user.bio || '');
  const [profileBackgroundUrl, setProfileBackgroundUrl] = useState(user.profile_background || '');
  const [profileBackgroundFile, setProfileBackgroundFile] = useState(null);
  const [profileBackgroundPreview, setProfileBackgroundPreview] = useState(user.profile_background || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 'email', label: 'Notifikasi Email', enabled: true, description: 'Dapatkan ringkasan dan pemberitahuan aktivitas akun.' },
    { id: 'chat', label: 'Notifikasi Chat', enabled: true, description: 'Terima pemberitahuan pesan baru dari pembeli dan tim.' },
    { id: 'system', label: 'Notifikasi Sistem', enabled: false, description: 'Update sistem besar dan status jaringan.' },
  ]);

  const handleToggleNotification = (id) => {
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const formData = new FormData();
      formData.append('bio', bio || '');
      if (profileBackgroundFile) {
        formData.append('profile_background_file', profileBackgroundFile);
      } else if (profileBackgroundUrl) {
        formData.append('profile_background_url', profileBackgroundUrl);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setMessage(data.message || 'Profil berhasil disimpan.');
        if (data.user && typeof onAuthUpdate === 'function') {
          setAvatarPreview(data.user.avatar || avatarPreview);
          setAvatarFile(null);
          if (data.user.profile_background) {
            setProfileBackgroundPreview(data.user.profile_background);
            setProfileBackgroundUrl(data.user.profile_background);
            setProfileBackgroundFile(null);
          }
          onAuthUpdate(data.user);
        }
      } else {
        setMessage(data.message || 'Gagal menyimpan profil.');
      }
    } catch (error) {
      console.error('Error saving profile settings:', error);
      setMessage('Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_60%,#ecfeff_100%)] text-neutral-900 px-4 py-6 sm:px-6 lg:px-10 pb-36 md:pb-32 xl:pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-emerald-400 font-mono">Pengaturan Profil</p>
            <h1 className="text-3xl font-black uppercase tracking-tight">Edit Profil & Notifikasi</h1>
            <p className="mt-2 text-sm text-neutral-600">Atur informasi akun, bio kreator, dan jenis notifikasi yang ingin diterima.</p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="inline-flex items-center justify-center rounded-full border-2 border-neutral-950 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-900 transition hover:bg-neutral-50"
          >
            &larr; Kembali ke Dashboard
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="relative overflow-hidden lg:col-span-2 space-y-4 bg-white border-3 border-neutral-950 p-4 sm:p-5 rounded-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="pointer-events-none absolute -top-14 -left-10 h-36 w-36 rounded-full border-2 border-emerald-300 bg-emerald-100/70" />
            <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full border-2 border-sky-300 bg-sky-100/60" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-48 border-l-2 border-t-2 border-neutral-950/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(56,189,248,0.1))] [clip-path:polygon(32%_0,100%_0,100%_100%,0_100%)]" />

            <div className="relative flex items-start justify-between gap-3 rounded-3xl border-2 border-neutral-950 bg-[linear-gradient(130deg,#fefce8_0%,#dcfce7_52%,#ecfeff_100%)] p-4 sm:p-5">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-600 font-mono">Detail Akun</p>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">Profil Kreator</h2>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-xl">Tata profil studio dengan gaya unik, bio yang jelas, dan identitas visual yang kuat.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="h-10 w-10 shrink-0 rounded-full border-2 border-neutral-950 bg-white text-neutral-900 text-lg font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:bg-neutral-100"
                title="Kembali"
              >
                &larr;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="relative grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center rounded-3xl border-2 border-neutral-950/70 bg-white/90 p-3 sm:p-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">No Photo</div>
                  )}
                </div>
                <label className="space-y-2 text-[11px] text-neutral-600 min-w-0">
                  Foto Profil
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full rounded-2xl border-2 border-neutral-300 bg-white px-3 py-3 text-xs text-neutral-700 outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:text-white hover:file:bg-emerald-600"
                  />
                </label>
              </div>

              <label className="space-y-2 text-[11px] text-neutral-600">
                Background Profil (Upload atau URL)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setProfileBackgroundFile(file);
                    if (file) {
                      setProfileBackgroundPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full rounded-2xl border-2 border-neutral-300 bg-white px-3 py-3 text-xs text-neutral-700 outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:text-white hover:file:bg-emerald-600"
                />
                <input
                  type="text"
                  value={profileBackgroundUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setProfileBackgroundUrl(url);
                    setProfileBackgroundFile(null);
                    setProfileBackgroundPreview(url);
                  }}
                  placeholder="https://example.com/background.jpg"
                  className="w-full rounded-2xl border-2 border-neutral-300 bg-white px-3 py-3 text-xs text-neutral-700 outline-none transition focus:border-emerald-500"
                />
                <p className="text-[10px] text-neutral-500">Bisa pilih file lokal atau masukkan link. File lokal akan prioritas jika keduanya dipilih.</p>
              </label>

              {profileBackgroundPreview && (
                <div className="rounded-3xl overflow-hidden border border-neutral-300 bg-neutral-100">
                  <img src={profileBackgroundPreview} alt="Preview background" className="h-44 w-full object-cover" />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-[11px] text-neutral-600">
                  Nama Lengkap
                  <input
                    value={user.name || '-'}
                    readOnly
                    className="w-full rounded-2xl border-2 border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 outline-none"
                  />
                </label>
                <label className="space-y-2 text-[11px] text-neutral-600">
                  Email
                  <input
                    value={user.email || '-'}
                    readOnly
                    className="w-full rounded-2xl border-2 border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 outline-none"
                  />
                </label>
              </div>

              <label className="space-y-2 text-[11px] text-neutral-600">
                Bio Kreator
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-2xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-500 resize-none"
                  placeholder="Tulis deskripsi singkat tentang dirimu atau studio seni Anda."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-4 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">Wallet</p>
                  <p className="mt-2 text-sm font-black text-neutral-900 truncate">{user.wallet_address || user.wallet || 'Belum terhubung'}</p>
                </div>
                <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-4 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">Akun</p>
                  <p className="mt-2 text-sm text-neutral-700">{user.google_id || user.email ? 'Tertaut' : 'Tidak tertaut'}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-neutral-950 px-5 py-3 text-xs font-black uppercase tracking-[0.35em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${message.toLowerCase().includes('berhasil') ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-700'}`}>
                  {message}
                </div>
              )}
            </form>
          </section>

          <section className="space-y-4 rounded-3xl border-3 border-neutral-950 bg-white p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400 font-mono">Notifikasi</p>
              <h2 className="text-xl font-black uppercase tracking-tight">Pengaturan Notifikasi</h2>
              <p className="text-sm text-neutral-600">Aktifkan atau nonaktifkan jenis notifikasi untuk setiap channel.</p>
            </div>
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-neutral-300 bg-neutral-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-tight text-neutral-900">{item.label}</p>
                      <p className="text-[11px] text-neutral-500">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotification(item.id)}
                      className={`self-start rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition ${item.enabled ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-600 border border-neutral-300'}`}
                    >
                      {item.enabled ? 'Aktif' : 'Mati'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
              <p className="font-black uppercase tracking-[0.35em] text-neutral-500">Ringkasan</p>
              <p className="mt-2">Notifikasi chat dan sistem akan disimpan lokal jika backend belum menyediakan endpoint. Untuk pengalaman penuh, sambungkan akun Google & wallet agar semua pemberitahuan tampil di dashboard.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
