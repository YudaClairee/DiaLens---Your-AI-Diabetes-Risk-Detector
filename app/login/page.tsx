"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, LogIn, Check } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from '../lib/api-url';
import { getApiErrorMessage } from '../lib/get-api-error-message';

function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/Logo%20Dialens%20AI.png"
      alt="DiaLens AI"
      width={160}
      height={48}
      className={`h-12 w-auto rounded-2xl object-contain bg-white ${className ?? ''}`}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Silakan isi semua kredensial klinis.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Integrasi langsung dengan URL API backend Vercel kamu
      const response = await fetch(`${API_BASE_URL}/api/health/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data));
      }

      // LOGIN BERHASIL: Simpan token autentikasi ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userName', data.user?.name || 'User');

      // Alihkan pengguna ke halaman dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 md:p-8 relative text-slate-900">
      <div className="absolute top-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[38rem] bg-white border border-slate-200">
        <div className="md:col-span-5 bg-blue-700 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_60%)]"></div>
          <button
            type="button"
            onClick={handleBack}
            className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke situs
          </button>

          <div className="relative z-10 space-y-5">
            <Logo className="relative z-10" />
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Diagnostik presisi yang dikurasi oleh AI.
              </h2>
              <p className="text-sm leading-relaxed text-white/80 font-light">
                Masuki era baru kecerdasan klinis. Autentikasi untuk mengakses dasbor institusi Anda, alat diagnostik, dan wawasan kesehatan pasien longitudinal secara aman.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-center">
              <svg className="w-40 h-20" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#7dd3fc" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#g1)" opacity="0.08" />
                <g stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 80 C44 30, 76 110, 108 70 C140 30, 172 90, 204 60" opacity="0.9" />
                  <circle cx="36" cy="58" r="6" fill="#fff" />
                  <circle cx="92" cy="84" r="6" fill="#fff" />
                  <circle cx="164" cy="56" r="6" fill="#fff" />
                </g>
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/90 text-center">
              Wawasan klinis berbantuan AI, lebih cepat dan lebih aman.
            </p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/70 text-center">
              Dipercaya oleh 2.000+ spesialis
            </p>
          </div>
        </div>

        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between bg-sky-50">
          <div className="space-y-8 max-w-sm w-full mx-auto">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Selamat datang kembali
              </h3>
              <p className="text-sm text-slate-500 font-light">
                Akses wawasan klinis mendalam dan profil pasien secara aman.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Kerja
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@rumahsakit.com"
                    className="bg-white border border-sky-200 rounded-xl py-3 pl-10 pr-4 text-sm w-full outline-none focus:bg-white focus:border-sky-500 hover:bg-sky-50 transition-all text-slate-700 placeholder-slate-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <button type="button" className="text-[10px] font-semibold text-sky-600 hover:underline" onClick={() => setError('Fitur lupa kata sandi masih dalam pengembangan')}>
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="bg-white border border-sky-200 rounded-xl py-3 pl-10 pr-10 text-sm w-full outline-none focus:bg-white focus:border-sky-500 hover:bg-sky-50 transition-all text-slate-700 placeholder-slate-400 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer" onClick={() => setRememberDevice(!rememberDevice)}>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white shadow-sm">
                  {rememberDevice && <Check className="w-3 h-3 text-sky-600 stroke-[3]" />}
                </span>
                <span className="font-light">
                  ingat saya di perangkat ini
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-sky-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Masuk</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="space-y-3">
              <p className="text-center text-xs text-slate-500">
                Belum punya akun?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="font-semibold text-sky-600 hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest absolute">
                atau lanjutkan dengan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setError('Autentikasi pihak ketiga Google belum dikonfigurasi di backend.')}
                className="border border-sky-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:bg-sky-100 transition-all"
              >
                <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center font-bold text-[10px] text-sky-700">G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => setError('Autentikasi pihak ketiga Apple belum dikonfigurasi di backend.')}
                className="border border-sky-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:bg-sky-100 transition-all"
              >
                <span className="w-6 h-6 bg-sky-900 rounded-full flex items-center justify-center font-bold text-[8px] text-white">A</span>
                <span>Apple</span>
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-light mt-8">
            &copy; 2026 DiaLens AI Diagnostics, Inc. Hanya untuk penggunaan klinis dan penelitian. Mematuhi HIPAA.
          </p>
        </div>
      </div>
    </div>
  );
}
