"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_BASE_URL } from '../lib/api-url';
import { getApiErrorMessage } from '../lib/get-api-error-message';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.name || !form.email || !form.password) {
      setError('Semua kolom wajib diisi!');
      return;
    }

    setLoading(true);

    try {
      // Mengirimkan data pendaftaran ke URL API backend Vercel kamu
      const response = await fetch(`${API_BASE_URL}/api/health/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data));
      }

      // Simpan informasi user sementara
      localStorage.setItem('userName', data.user.name);
      
      // Arahkan ke halaman login setelah berhasil mendaftar
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-slate-900 font-sans flex flex-col justify-center items-center p-4">
      <main className="w-full max-w-[440px] bg-white rounded-[2.5rem] border border-slate-200/50 p-10 shadow-xl shadow-blue-100/50 flex flex-col items-center z-10">
        
        <div className="w-16 h-16 mb-2">
          <Image
            src="/Logo%20Dialens%20AI.png"
            alt="DiaLens Logo"
            width={64}
            height={64}
            className="w-full h-full object-contain rounded-2xl shadow-sm"
          />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-3 text-center">
          Daftar ke DiaLens
        </h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1.5 text-center">
          Buat akun baru untuk menyimpan riwayat kesehatan dan melihat hasil skrining AI.
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          {error && (
              <div className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 text-center">
                {error}
              </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Masukkan nama lengkap"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#00AEEF] focus:bg-white text-black shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="contoh@gmail.com"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#00AEEF] focus:bg-white text-black shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#00AEEF] focus:bg-white text-black shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00AEEF] hover:bg-[#009cd6] text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-all text-xs uppercase tracking-wider mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Membuat Akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-[11px] font-bold text-slate-400 mt-6 text-center">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#00AEEF] hover:underline font-black">
            Masuk di sini
          </Link>
        </p>
      </main>
    </div>
  );
}
