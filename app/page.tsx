"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BrainCircuit,
  ShieldAlert,
  Cpu,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { useAbVariant } from './lib/ab-testing';

interface LandingPageProps {
  onStartScreening?: () => void;
  onNavigate?: (view: 'landing' | 'login' | 'screening' | 'results' | 'history') => void;
}

const featureList = [
  {
    title: "Analisis Risiko Diabetes",
    description: "Estimasi risiko diabetes berbasis AI dengan penjelasan ringkas, membantu dokter memahami profil risiko pasien dan menentukan langkah pemeriksaan lanjutan yang tepat.",
    icon: Activity,
  },
  {
    title: "Proses Skrining Terintegrasi",
    description: "Dukungan proses pemeeriksaan end-to-end mulai dari input data sampai riwayat hasil, tanpa perlu pindah aplikasi.",
    icon: Sparkles,
  },
  {
    title: "Privasi dan Keamanan",
    description: "Dirancang dengan prinsip privasi sejak awal, data pasien dikelola secara aman untuk mendukung kepercayaan dalam lingkungan klinis.",
    icon: ShieldCheck,
  },
];

const teamMembers = [
  { name: "Djibrani Yuda", role: "Lead AI Engineer", initials: "DY", bg: "from-blue-100 to-indigo-100", text: "text-indigo-600", desc: "Mengembangkan arsitektur deep learning dan mengoptimalkan akurasi model neural network DiaLens." },
  { name: "Jonathan Alfa", role: "AI Engineer", initials: "JA", bg: "from-purple-100 to-indigo-100", text: "text-purple-600", desc: "Fokus pada integrasi pipeline model AI dan fine-tuning inferensi data klinis." },
  { name: "Reza Maulana", role: "Senior Data Scientist", initials: "RM", bg: "from-emerald-100 to-teal-100", text: "text-emerald-600", desc: "Menganalisis data medis untuk memastikan hasil prediksi yang akurat dan dapat dipertanggungjawabkan." },
  { name: "Farih Kamil", role: "Data Scientist", initials: "FK", bg: "from-teal-100 to-cyan-100", text: "text-teal-600", desc: "Menangani pembersihan dan normalisasi data medis untuk meningkatkan kualitas input model AI." },
  { name: "Edwin Fadhilah", role: "Lead Fullstack Developer", initials: "EF", bg: "from-sky-100 to-blue-100", text: "text-blue-600", desc: "Membangun pengalaman aplikasi Next.js yang responsif dan mengamankan alur data klinis pengguna." },
  { name: "Abinaya Azhar", role: "Fullstack Developer", initials: "AA", bg: "from-slate-100 to-blue-100", text: "text-slate-600", desc: "Mengimplementasikan UI intuitif, manajemen riwayat pemeriksaan, dan performa frontend aplikasi." },
];

export default function LandingPage({ onStartScreening }: LandingPageProps) {
  const { variant, track } = useAbVariant();
  const isVariantB = variant === 'B';

  // --- ANIMASI MENGETIK (TYPEWRITER) ---
  const words = useMemo(() => ["Diabetes Risk", "Your Health", "Clinical Data"], []);
  const [typedText, setTypedText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeSpeed, setTypeSpeed] = useState(150);

  useEffect(() => {
    const currentWord = words[wordIdx];
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setTypedText(currentWord.substring(0, typedText.length + 1));
        setTypeSpeed(120);
        if (typedText === currentWord) {
          setTypeSpeed(2000); 
          setIsDeleting(true);
        }
      } else {
        setTypedText(currentWord.substring(0, typedText.length - 1));
        setTypeSpeed(60);
        if (typedText === "") {
          setIsDeleting(false);
          setWordIdx((prev) => (prev + 1) % words.length);
          setTypeSpeed(300);
        }
      }
    }, typeSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, wordIdx, typeSpeed, words]);

  // --- SMOOTH SCROLL ---
  const handleSmoothScroll = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const trackLandingCta = (event: string, ctaText: string) => {
    track(event, { ctaText });
  };

  // --- STATE SCREENING INTERAKTIF ---
  const [form, setForm] = useState({ HighBP: 'No', HighChol: 'No', Weight: '65', Height: '170' });
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [prediction, setPrediction] = useState("");

  const bmiVal = useMemo(() => {
    const w = parseFloat(form.Weight);
    const h = parseFloat(form.Height) / 100;
    return w > 0 && h > 0 ? Math.round(w / (h * h)) : 0;
  }, [form.Weight, form.Height]);

  const handleFormChange = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResult(false);

    setTimeout(() => {
      let res = "Low Risk (Tingkat Risiko Rendah)";
      if (form.HighBP === 'Yes' || bmiVal > 25) res = "Medium Risk (Tingkat Risiko Sedang)";
      if (form.HighBP === 'Yes' && form.HighChol === 'Yes' && bmiVal > 27) res = "High Risk (Tingkat Risiko Tinggi)";
      
      setPrediction(res);
      setLoading(false);
      setShowResult(true);
    }, 1000);
  };

  // --- MODAL STATE ---
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-slate-900 font-sans selection:bg-blue-100 relative overflow-x-hidden" id="landing-page-container">
      
      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute top-0 right-0 w-[42rem] h-[42rem] rounded-full bg-blue-600/5 blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-24 left-0 w-[30rem] h-[30rem] rounded-full bg-teal-500/5 blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-[0.03] w-full max-w-7xl flex items-center justify-center scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" className="w-full text-blue-600">
          <path fill="currentColor" d="M400,100 C250,100 150,200 150,350 C150,450 200,550 300,650 L400,750 L500,650 C600,550 650,450 650,350 C650,200 550,100 400,100 Z" />
        </svg>
      </div>

      {/* NAV BAR */}
      <header className="w-full fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-md border-b border-slate-200/40 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2.5 group cursor-pointer">
            <Image src="/Logo%20Dialens%20AI.png" alt="DiaLens AI" height={32} width={32} className="h-8 w-auto rounded-md shadow-md" />
            <span className="font-black text-sm text-slate-900 tracking-tight">DIA LENS AI</span>
          </div>

          {/* Mobile tools: replace logo/text with compact menu tools */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
              <Menu size={18} />
            </button>
            <Link href="/login" onClick={() => trackLandingCta('landing_cta_login_click', 'Login Account')} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
              <ChevronRight size={18} />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-bold text-xs text-slate-500 uppercase tracking-wider">
            <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')} className="hover:text-blue-600 py-1.5 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#screening" onClick={(e) => handleSmoothScroll(e, 'screening')} className="hover:text-blue-600 py-1.5 relative group">
              Demo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')} className="hover:text-blue-600 py-1.5 relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          <div>
            <Link href="/login" onClick={() => trackLandingCta('landing_cta_login_click', 'Login Account')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-blue-100 flex items-center gap-1.5 hover:scale-[1.03] transition-all">
              <span>Login Account</span>
              <ChevronRight size={13} strokeWidth={3} />
            </Link>
          </div>
          {/* Mobile menu button */}
          
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute top-0 right-0 left-0 bg-white p-6">
            <div className="flex items-center justify-between">
                <div />
                <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg">
                  <X size={18} />
                </button>
              </div>

            <nav className="mt-6 flex flex-col space-y-3 text-center">
              <a onClick={(e) => { handleSmoothScroll(e, 'home'); setMobileNavOpen(false); }} href="#home" className="py-3 text-sm font-bold text-slate-700">Home</a>
              <a onClick={(e) => { handleSmoothScroll(e, 'screening'); setMobileNavOpen(false); }} href="#screening" className="py-3 text-sm font-bold text-slate-700">Demo</a>
              <a onClick={(e) => { handleSmoothScroll(e, 'about'); setMobileNavOpen(false); }} href="#about" className="py-3 text-sm font-bold text-slate-700">About</a>
              <Link href="/login" onClick={() => { trackLandingCta('landing_cta_login_click', 'Login Account'); setMobileNavOpen(false); }} className="mt-4 inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md">Login Account</Link>
            </nav>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section id="home" className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 space-y-8 text-left">
          
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200/60 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Clinical Grade AI Detector
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl">
            {isVariantB ? (
              <>
                Cek Risiko Diabetes <br />
                dalam 2 Menit
              </>
            ) : (
              <>
                The Clinical Curator <br />
                for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 border-r-4 border-indigo-600 pr-2">{typedText}</span>
              </>
            )}
          </h1>

          <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
            {isVariantB
              ? 'Isi beberapa data kesehatan dasar, lalu DiaLens membantu memperkirakan tingkat risiko diabetes dan memberi rekomendasi tindak lanjut.'
              : 'DiaLens AI berfungsi sebagai instrumen skrining risiko awal, bukan pengganti diagnosis medis profesional. Persentase risiko bersifat estimasi analitis dan wajib diverifikasi oleh tenaga kesehatan berkualifikasi sebelum diambil keputusan medis. Segera hubungi dokter jika Anda merasakan gejala klinis.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            {isVariantB ? (
              <>
                <Link href="/check" onClick={() => trackLandingCta('landing_cta_primary_click', 'Mulai Cek Risiko')} className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                  <span>Mulai Cek Risiko</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" onClick={() => trackLandingCta('landing_cta_login_click', 'Masuk ke Akun')} className="group border border-blue-200 bg-white/80 text-blue-700 font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-wider shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                  <span>Masuk ke Akun</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            ) : (
              <a href="#screening" onClick={(e) => { trackLandingCta('landing_cta_primary_click', 'Coba Skrining Gratis'); handleSmoothScroll(e, 'screening'); }} className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <span>Coba Skrining Gratis</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 relative hidden md:block">
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden bg-gray-900 shadow-2xl shadow-blue-200/50 border-4 border-white transform hover:rotate-1 transition-all duration-700 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
              alt="Clinical Specialist"
              referrerPolicy="no-referrer"
              className="w-full h-[32rem] object-cover opacity-90 group-hover:scale-105 transition-transform duration-[1500ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
          </div>

          <div className="absolute -bottom-6 -left-6 z-20 bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/40 max-w-[19rem] animate-bounce-slow">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-900 leading-tight">Keyakinan AI</p>
                <p className="text-[10px] text-gray-400 font-medium leading-none">Pola Diagnostik Dikenali</p>
                <div className="flex items-baseline space-x-1.5 pt-2">
                  <span className="text-2xl font-bold font-sans text-blue-600 select-none">74.4</span>
                  <span className="text-xs font-semibold text-blue-400">%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1 max-w-[10rem]">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: '74.4%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRIC SECTION */}
      <section className="bg-white border-y border-slate-100 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-8 text-center">
          <div className="space-y-0.5">
            <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">74.4%</h3>
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Akurasi Target AI</p>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-3xl font-black text-slate-900">&lt;30s</h3>
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Waktu Respon Inferensi</p>
          </div>
        </div>
      </section>

      {/* JEMBATAN VISUAL */}
      <div className="w-full rotate-180 -mb-1 pointer-events-none bg-white relative z-10">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full text-[#F4F8FF]">
          <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z" fill="currentColor"></path>
        </svg>
      </div>

      {/* 2. INTERACTIVE SCREENING SECTION */}
      <section id="screening" className="bg-[#eff7ff] py-24 px-4 relative z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-blue-600 shadow-sm">
              <Activity size={18} />
              Kalkulator Demo Instan
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Dapatkan pratinjau risiko dalam hitungan detik.</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              Masukkan data dasar Anda dan lihat bagaimana AI DiaLens memperhitungkan faktor klinis utama untuk memetakan tingkat risiko awal.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-stretch">
            <div className="rounded-[2.5rem] border border-slate-200/70 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-slate-50 p-5 border border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-3 rounded-3xl bg-blue-600/10 px-4 py-3 text-blue-700 font-black text-sm">
                    <BrainCircuit size={18} /> AI Risk Preview
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Output Instan</p>
                    <p className="text-sm font-semibold text-slate-800">Lebih cepat dari proses manual.</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cari tahu seberapa tinggi risiko awal Anda berdasarkan tekanan darah, kolesterol, dan indeks massa tubuh tanpa harus membuat akun terlebih dahulu.
                </p>
              </div>

              <form onSubmit={handleTestSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-blue-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tekanan Darah</label>
                    <select value={form.HighBP} onChange={e => handleFormChange('HighBP', e.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none">
                      <option value="No">Normal</option>
                      <option value="Yes">Riwayat Tinggi</option>
                    </select>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-blue-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Kolesterol</label>
                    <select value={form.HighChol} onChange={e => handleFormChange('HighChol', e.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none">
                      <option value="No">Normal</option>
                      <option value="Yes">Tinggi</option>
                    </select>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-blue-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tinggi Badan</label>
                    <input type="number" value={form.Height} onChange={e => handleFormChange('Height', e.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none" placeholder="cm" />
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-blue-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Berat Badan</label>
                    <input type="number" value={form.Weight} onChange={e => handleFormChange('Weight', e.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none" placeholder="kg" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70">
                  <BrainCircuit size={18} />
                  {loading ? 'Menghitung...' : 'Lihat Risiko Saya'}
                </button>
              </form>

              {showResult && (
                <div className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50/80 p-6 shadow-sm">
                  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">Hasil Prediksi</p>
                      <h4 className="mt-3 text-2xl font-black text-slate-900">{prediction}</h4>
                    </div>
                    <div className="inline-flex items-center gap-3 rounded-3xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm border border-blue-100">
                      <span className="rounded-full bg-blue-600/10 p-2 text-blue-600">
                        BMI
                      </span>
                      <span>{bmiVal}</span>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 text-left shadow-sm border border-white/70">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Isiannya</p>
                      <p className="mt-2 text-sm text-slate-600">Tekanan Darah: {form.HighBP}</p>
                      <p className="text-sm text-slate-600">Kolesterol: {form.HighChol}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-left shadow-sm border border-white/70">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Saran</p>
                      <p className="mt-2 text-sm text-slate-600">Gunakan hasil sebagai gambaran awal; konsultasikan dengan tenaga kesehatan bila perlu.</p>
                    </div>
                  </div>
                  <div className="mt-6 text-right">
                    <Link href="/register" className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-black uppercase tracking-[0.3em] text-white shadow-lg transition hover:brightness-110">
                      <ShieldCheck size={14} />
                      Simpan ke Akun
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-8 text-white shadow-2xl border border-white/10 overflow-hidden">
              <div className="mb-8 space-y-4">
                <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                  Insight Klinis
                </div>
                <h3 className="text-2xl font-black">Model AI yang transparan dan responsif.</h3>
                <p className="text-sm leading-relaxed text-blue-100/90">
                  Fitur demo ini memberi gambaran singkat terhadap elemen penentu risiko diabetes, dikemas dalam tampilan yang mudah dinavigasi.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl bg-white/10 p-5 border border-white/10 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-200 font-black">Fokus utama</p>
                  <p className="mt-2 text-sm text-slate-100">Tekanan darah dan BMI menjadi indikator awal yang cepat ditampilkan oleh kalkulator.</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 border border-white/10 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-200 font-black">Visualisasi cepat</p>
                  <p className="mt-2 text-sm text-slate-100">Hasil muncul dalam kartu yang jelas, sehingga pengguna langsung memahami status risiko.</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 border border-white/10 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-200 font-black">Langkah selanjutnya</p>
                  <p className="mt-2 text-sm text-slate-100">Jika risiko meningkat, sistem mendorong pendaftaran akun untuk menyimpan hasil dan melanjutkan pemantauan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}

      <section className="bg-slate-50/60 py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto space-y-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">Tentang Aplikasi</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Mengapa DiaLens adalah solusi skrining diabetes klinis terbaik</h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            DiaLens menggabungkan inferensi AI, antarmuka klinis responsif, dan pelacakan riwayat pasien sehingga tim kesehatan dapat membuat keputusan lebih cepat dengan konteks medis yang jelas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">Canggih</p>
              <h3 className="mt-4 text-xl font-black text-slate-900">AI Klinis Terverifikasi</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Menggunakan model prediktif yang dirancang untuk menilai risiko diabetes dari data pasien dengan fokus pada interpretabilitas klinis.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-[2rem] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">Responsive</p>
              <h3 className="mt-4 text-xl font-black text-slate-900">Tampil di Semua Perangkat</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Desain mobile-first yang mendukung tim medis sambil bergerak, dengan tampilan dashboard intuitif untuk desktop klinik dan tablet.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-[2rem] bg-white border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">Terpercaya</p>
              <h3 className="mt-4 text-xl font-black text-slate-900">Riwayat Data yang Aman</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Semua hasil pemeriksaan tersimpan rapi sehingga memudahkan peninjauan riwayat pasien dan persiapan tindak lanjut medis.</p>
            </motion.div>
          </div>

          <div className="pt-8">
            <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
              <span>Baca Selengkapnya</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="bg-slate-50 text-slate-900 py-24 px-6 md:px-10 lg:px-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Simple Intro Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-600 px-4 py-2 text-xs font-black uppercase tracking-[0.3em]">
              About DiaLens
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
              Solusi AI untuk skrining dan manajemen risiko diabetes.
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              DiaLens menghadirkan antarmuka klinis modern, prediksi AI yang dapat diandalkan, dan pengalaman pasien yang mudah diikuti — semua dirancang untuk membantu tim perawatan kesehatan membuat keputusan berbasis data.
            </p>
          </motion.div>

          {/* Features Section */}
          <section className="grid gap-8 lg:grid-cols-3">
            {featureList.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="rounded-[2rem] bg-white border border-slate-200/70 p-8 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-6 text-xl font-black text-slate-900">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </section>

          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="rounded-[2.5rem] border border-slate-200/70 bg-gradient-to-br from-slate-900 to-slate-800 p-10 md:p-14 text-white shadow-2xl"
          >
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300 font-black">Misi kami</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight">
                Membangun alat skrining risiko diabetes berbasis AI yang dapat dipercaya dan mudah digunakan.
              </h2>
              <p className="mt-6 text-sm md:text-base leading-relaxed text-slate-200">
                DiaLens dirancang untuk membantu tenaga kesehatan mengidentifikasi individu berisiko tinggi lebih awalm sehingga intervensi dapat dilakukan sebelum kondisi berkembang lebih lanjut. Kami berkomitmen pada transparansi hasil, kemudahan integrasi ke alur kerja klinis, dan perlindungan data pengguna.
              </p>
            </div>
          </motion.section>

          {/* Team Section at Bottom */}
          <section className="pt-8">
            <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">The Innovators</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Meet Our Special Team</h2>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                Tim lintas keahlian kami memadukan machine learning, pengolahan data klinis, dan pengalaman aplikasi untuk membangun DiaLens.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {teamMembers.map((member, index) => (
                <motion.article
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-[2rem] border border-slate-200/70 bg-white p-7 shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.bg} border-4 border-white shadow-md flex items-center justify-center mb-5`}>
                    <span className={`font-black text-xl ${member.text}`}>{member.initials}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-black mt-2">{member.role}</p>
                  <p className="mt-4 text-sm text-slate-500 leading-relaxed">{member.desc}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {/* CLINICAL MEDICAL DISCLAIMER */}
      <section className="max-w-7xl mx-auto px-6 mb-24 relative z-10">
        <div className="bg-white rounded-2xl p-6 md:p-8 flex items-start space-x-4 border border-slate-200/50 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-800 tracking-tight">Pernyataan Medis</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              DiaLens adalah alat skrining risiko diabetes berbasis AI yang dirancang untuk membantu pengguna memahami potensi faktor risiko berdasarkan data yang dimasukkan. Aplikasi ini bukan alat diagnosis medis dan tidak dimaksudkan untuk menggantikan konsultasi, diagnosis, atau pengobatan oleh tenaga medis profesional.
              Hasil dan persentase risiko yang ditampilkan merupakan estimasi analitis yang dihasilkan oleh model AI, yang memiliki keterbatasan dan mungkin tidak akurat untuk semua individu. Hasil ini wajib diinterpretasikan dan dikonfirmasi oleh dokter atau tenaga kesehatan berkualifikasi sebelum dijadikan dasar keputusan medis apapun.
              Jika Anda mengalami gejala yang mengkhawatirkan, segera konsultasikan dengan dokter tanpa menunggu hasil skrining ini.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-800 text-slate-100 py-16 px-6 border-t border-slate-890 relative z-10">

        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-0 pt-2 flex flex-col md:flex-row items-center justify-between text-xs font-medium">
          <span>&copy; {new Date().getFullYear()} DiaLens AI Clinical Curator. All rights reserved.</span>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">HOME</a>
            <a href="#" className="hover:text-white transition-colors">DEMO</a>
            <a href="#" className="hover:text-white transition-colors">ABOUT</a>
          </div>
        </div>
      </footer>

      {/* HIGH FIDELITY DEMO PLAYBACK MODAL */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-6">
                <div>
                  <span className="text-blue-500 font-bold text-xs uppercase tracking-widest font-mono">Platform Simulation</span>
                  <h3 className="text-xl font-bold font-sans mt-1">Diagnostic Interface Overview</h3>
                  <p className="text-slate-400 text-xs mt-1">Simulating retinal screening analysis with active computer vision layers.</p>
                </div>

                <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1579684389782-64d84b5e901d?auto=format&fit=crop&q=80&w=800"
                    alt="Simulated Eye Analysis"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-x-0 h-0.5 bg-cyan-400/85 top-1/4 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_8px_cyan]"></div>
                  
                  <div className="absolute top-4 left-4 bg-black/80 px-2.5 py-1 rounded-md text-[10px] font-mono border border-cyan-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                    <span>ACTIVE MICROSCOPIC_SCAN V4</span>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/80 p-3 rounded-lg text-[10px] font-mono border border-blue-500/20 space-y-1">
                    <p className="text-cyan-400 font-bold">DETECTION LABELS:</p>
                    <p>Focal microaneurysms: <span className="text-red-400">24 COUNT</span></p>
                    <p>Foveal stability: <span className="text-green-400">98% PRESERVED</span></p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 text-sm rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    Close Demo
                  </button>
                  <button
                    onClick={(e) => {
                      setShowDemoModal(false);
                      handleSmoothScroll(e, 'screening');
                      if (onStartScreening) onStartScreening();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors"
                  >
                    Launch Screener Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
