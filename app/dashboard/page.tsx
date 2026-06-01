"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  User,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertOctagon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import Sidebar from '../components/Sidebar';
import { API_BASE_URL } from '../lib/api-url';
import { getApiErrorMessage } from '../lib/get-api-error-message';
import { useAbVariant } from '../lib/ab-testing';

interface MedicalLog {
  id: string;
  date: string;
  age: string;
  weight: string;
  height: string;
  bmi: string;
  highBP: string;
  highChol: string;
  prediction: string;
  status: string;
  ai_recommendation?: string; 
  risk_level?: string;         
  diabetesRisk?: number; 
}

type RawHealthRecord = {
  id?: string | number;
  _id?: string | number;
  date?: string;
  createdAt?: string;
  age?: string | number;
  weight?: string | number;
  height?: string | number;
  bmi?: string | number;
  BMI?: string | number;
  highBP?: unknown;
  HighBP?: unknown;
  highChol?: unknown;
  HighChol?: unknown;
  prediction?: string | number;
  status?: string;
  ai_recommendation?: string;
  risk_level?: string | number;
  diabetesRisk?: string | number;
  probability?: string | number;
  risk_score?: string | number;
  records?: unknown;
  data?: unknown;
};

interface StatCardProps {
  title: string;
  value: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  gradientBg: string;
  valueColor?: string;
}

const StatCard = ({ title, value, desc, icon: Icon, iconBg, gradientBg, valueColor = "text-slate-900" }: StatCardProps) => (
  <div className={`rounded-[2rem] border border-slate-200/60 bg-gradient-to-b ${gradientBg} p-6 shadow-sm transition-all duration-300 hover:shadow-md`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-100">
        User Activity
      </span>
      <div className={`p-2.5 rounded-xl ${iconBg} text-white shadow-sm`}>
        <Icon size={16} />
      </div>
    </div>
    <div className="mt-4">
      <h3 className={`text-2xl font-black tracking-tight ${valueColor}`}>{value}</h3>
      <p className="text-xs font-black uppercase tracking-[0.05em] text-slate-700 mt-1">{title}</p>
      <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const isRawHealthRecord = (value: unknown): value is RawHealthRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getRecordsFromResponse = (value: unknown): RawHealthRecord[] => {
  if (Array.isArray(value)) {
    return value.filter(isRawHealthRecord);
  }

  if (!isRawHealthRecord(value)) {
    return [];
  }

  const possibleRecords = value.records;
  const possibleData = value.data;

  if (Array.isArray(possibleRecords)) {
    return possibleRecords.filter(isRawHealthRecord);
  }

  if (Array.isArray(possibleData)) {
    return possibleData.filter(isRawHealthRecord);
  }

  return [];
};

export default function DashboardPage() {
  const { variant, track } = useAbVariant();
  const isVariantB = variant === 'B';
  const [displayName, setDisplayName] = useState('Pengguna DiaLens');
  const [historyData, setHistoryData] = useState<MedicalLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [screeningData, setScreeningData] = useState<{
    totalScreening: string;
    lastBmi: string;
    lastRisk: string; // Akan menyimpan string gabungan ex: "HIGH RISK (85%)"
    lastRiskLabel: string; // Murni label pendek (LOW/MEDIUM/HIGH) untuk pewarnaan card
    lastLog: MedicalLog | null;
  }>({
    totalScreening: '0 Kali',
    lastBmi: '- BMI',
    lastRisk: 'Belum Ada',
    lastRiskLabel: 'LOW',
    lastLog: null,
  });

  const fetchHealthRecords = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const token = localStorage.getItem('token'); 
      if (!token) {
        setErrorMessage("Token autentikasi tidak ditemukan. Silakan lakukan login ulang.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/health/records`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(getApiErrorMessage(errData));
      }

      const resJson: unknown = await res.json();
      const history = getRecordsFromResponse(resJson);

      const normalizeYesNo = (value: unknown): string => {
        return value === 1 || value === '1' || value === true || value === 'Ya' || value === 'yes'
          ? 'Ya'
          : 'Tidak';
      };

      const normalizedHistory: MedicalLog[] = history.map((log) => {
        const rawBmi = log.bmi ?? log.BMI;
        const numericBmi = Number(rawBmi);
        const finalBmi = Number.isFinite(numericBmi) && numericBmi > 0
          ? numericBmi.toFixed(1)
          : '-';

        const rawRiskText = log.risk_level ?? log.prediction ?? 'Low';
        let riskText = String(rawRiskText);
        if (rawRiskText === '1' || rawRiskText === 1 || rawRiskText === 'Diabetes Terdeteksi') riskText = 'High';
        if (rawRiskText === '0' || rawRiskText === 0 || rawRiskText === 'Aman / Normal') riskText = 'Low';

        const rawRisk = log.diabetesRisk ?? log.probability ?? log.risk_score ?? 0;

        return {
          id: String(log.id ?? log._id ?? 'DL-Log'),
          date: log.date || log.createdAt || new Date().toISOString(),
          age: String(log.age ?? '-'),
          weight: String(log.weight ?? '-'),
          height: String(log.height ?? '-'),
          bmi: finalBmi,
          highBP: normalizeYesNo(log.highBP ?? log.HighBP),
          highChol: normalizeYesNo(log.highChol ?? log.HighChol),
          prediction: riskText,
          status: log.status || 'Safe',
          ai_recommendation: log.ai_recommendation || 'Tidak ada rekomendasi dari AI.',
          risk_level: riskText,
          diabetesRisk: rawRisk !== undefined ? Number(rawRisk) : undefined
        };
      });

      const sortedForChart = [...normalizedHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setHistoryData(sortedForChart);

      // 🎯 SINKRONISASI KARTU UTAMA REAL-TIME DENGAN PERSENTASE DAN STR KATEGORI DINAMIS
      if (normalizedHistory.length > 0) {
        const latestLog = [...normalizedHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]; 

        // Hitung persentase risiko terurai dari database
        let numericRisk = latestLog.diabetesRisk ?? 0;
        if (numericRisk <= 1 && numericRisk > 0) {
          numericRisk = numericRisk * 100;
        }
        const finalRiskPercent = Math.round(numericRisk);

        // Petakan string penanda tingkatan risiko secara objektif berbasis persentase
        let textStatus = 'LOW';
        const rawStringRisk = String(latestLog.risk_level || latestLog.prediction || '').toUpperCase();
        
        if (finalRiskPercent >= 70 || rawStringRisk.includes('HIGH') || rawStringRisk.includes('TINGGI')) {
          textStatus = 'HIGH';
        } else if (finalRiskPercent >= 35 || rawStringRisk.includes('MEDIUM') || rawStringRisk.includes('SEDANG')) {
          textStatus = 'MEDIUM';
        }

        setScreeningData({
          totalScreening: `${normalizedHistory.length} Kali`,
          lastBmi: latestLog.bmi !== '-' ? `${latestLog.bmi} BMI` : '- BMI',
          lastRisk: `${textStatus} RISK (${finalRiskPercent}%)`, // Tampilan string kombinasi persentase pesanan Anda
          lastRiskLabel: textStatus,
          lastLog: latestLog,
        });
      } else {
        setScreeningData({
          totalScreening: '0 Kali',
          lastBmi: '- BMI',
          lastRisk: 'Belum Ada',
          lastRiskLabel: 'LOW',
          lastLog: null,
        });
      }
    } catch (error: unknown) {
      console.error("Log kesalahan penarikan data API:", error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyinkronkan database cluster grafik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName');
      const storedUser = localStorage.getItem('user');
      let nextDisplayName: string | null = storedName;
      
      if (!nextDisplayName && storedUser) {
        try {
          const parsedUser: unknown = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object') {
            const user = parsedUser as { name?: unknown };
            if (typeof user.name === 'string') {
              nextDisplayName = user.name;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      const displayNameToApply = nextDisplayName;
      if (displayNameToApply) {
        window.queueMicrotask(() => setDisplayName(displayNameToApply));
      }
    }
    window.queueMicrotask(() => {
      void fetchHealthRecords();
    });
  }, []);

  const getRiskStyles = (riskLabel: string) => {
    const normLabel = riskLabel.toLowerCase();
    if (normLabel.includes('high')) {
      return {
        bg: 'bg-rose-500',         
        text: 'text-rose-600',
        cardBg: 'from-rose-50/60 to-white',
        border: 'border-rose-100',
        icon: ShieldAlert
      };
    }
    if (normLabel.includes('medium')) {
      return {
        bg: 'bg-orange-500',       
        text: 'text-orange-600',
        cardBg: 'from-orange-50/60 to-white',
        border: 'border-orange-100',
        icon: AlertTriangle
      };
    }
    return {
      bg: 'bg-emerald-500',        
      text: 'text-emerald-600',
      cardBg: 'from-emerald-50/60 to-white',
      border: 'border-emerald-100',
      icon: CheckCircle2
    };
  };

  // Gunakan state label terpisah khusus untuk deteksi style CSS
  const currentRiskStyle = getRiskStyles(screeningData.lastRiskLabel);
  const StatusIcon = currentRiskStyle.icon;

  const chartData = historyData.map(({ date, bmi, prediction, diabetesRisk }) => {
    let riskPercent = 0; 
    if (diabetesRisk !== undefined && diabetesRisk !== null) {
      riskPercent = diabetesRisk <= 1 ? Math.round(diabetesRisk * 100) : diabetesRisk;
    } else {
      const normPred = prediction.toLowerCase();
      if (normPred === 'medium') riskPercent = 45;
      if (normPred === 'high') riskPercent = 75;
    }

    return {
      Tanggal: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + 
               ' ' + new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Indeks Massa Tubuh (BMI)': parseFloat(bmi) || 0,
      'Tingkat Risiko AI (%)': riskPercent,
    };
  });

  const formatRecommendationText = (text: string) => {
    if (!text) return '';
    return text.split('*').map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 bg-blue-50/60 px-1 rounded">{part}</strong> : part
    );
  };

  const handleNewScreeningClick = () => {
    if (isVariantB) {
      track('dashboard_new_screening_click');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-slate-900 font-sans selection:bg-blue-100">
      <div className="flex">
        
        <Sidebar />

        <div className="md:pl-64 pt-20 md:pt-0 w-full">
          <main className="p-8 max-w-7xl mx-auto space-y-6">
            
            {/* Header Dashboard */}
            <div className="rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-xl shadow-blue-100/60 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200">User Dashboard</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Selamat Datang, {displayName}!</h1>
                </div>
                <div className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed font-medium">
                  Ini adalah ruang pantau aktivitas kesehatan Anda. Gunakan menu navigasi untuk menguji risiko medis atau melihat riwayat pemeriksaan Anda.
                </div>
              </div>
            </div>

            {isVariantB && (
              <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-sm">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Skrining Baru</p>
                      <h2 className="text-lg font-black tracking-tight text-slate-900">Mulai pemeriksaan risiko terbaru</h2>
                    </div>
                  </div>
                  <Link
                    href="/check"
                    onClick={handleNewScreeningClick}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white shadow-md transition-all hover:bg-blue-700"
                  >
                    <span>Luncurkan Skrining Baru</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* Error Box */}
            {errorMessage && (
              <div className="rounded-[2rem] border-2 border-rose-100 bg-rose-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                  <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-200">
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 tracking-tight">Sinkronisasi Jalur API Terhambat</h4>
                    <p className="text-xs text-rose-700 font-medium mt-0.5 leading-relaxed max-w-2xl">{errorMessage}</p>
                  </div>
                </div>
                <button 
                  onClick={fetchHealthRecords}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Muat Ulang</span>
                </button>
              </div>
            )}

            {/* Grid Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Skrining" value={screeningData.totalScreening} desc="Jumlah akumulasi semua pemeriksaan Anda." icon={TrendingUp} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white" />
              <StatCard title="Indeks Massa Tubuh" value={screeningData.lastBmi} desc="Hasil BMI terbaru yang dihitung dari entri berat dan tinggi badan terakhir." icon={User} iconBg="bg-indigo-600" gradientBg="from-indigo-50/40 to-white" />
              <StatCard 
                title="Status Risiko AI" 
                value={screeningData.lastRisk} // Menampilkan teks interaktif (ex: HIGH RISK (85%))
                desc="Kategori risiko terakhir yang dipetakan dinamis sesuai kriteria medis." 
                icon={Zap} 
                iconBg={currentRiskStyle.bg} 
                gradientBg={currentRiskStyle.cardBg} 
                valueColor={currentRiskStyle.text}
              />
            </div>

            {/* DIAGRAM TREN */}
            <div className="rounded-[2.5rem] bg-white border border-slate-200/60 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Data Analytics</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Grafik Tren Kesehatan & Risiko DiaLens</h3>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-slate-600">Grafik BMI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                    <span className="text-slate-600">Proyeksi Risiko AI</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-72 text-xs font-semibold">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 italic gap-2">
                    <RefreshCw size={14} className="animate-spin text-indigo-500" />
                    <span>Menghubungkan kluster grafik...</span>
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="Tanggal" stroke="#94a3b8" tickLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                      <Area type="monotone" dataKey="Indeks Massa Tubuh (BMI)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBmi)" />
                      <Area type="monotone" dataKey="Tingkat Risiko AI (%)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 italic">Belum ada rekam medis tersimpan untuk akun ini.</div>
                )}
              </div>
            </div>

            {/* KOTAK REKOMENDASI MEDIS OTOMATIS */}
            <div className={`rounded-[2.5rem] bg-white border ${currentRiskStyle.border} p-6 md:p-8 shadow-sm space-y-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentRiskStyle.bg} text-white shadow-md`}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">AI Medical Advice</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Rekomendasi Klinis Terpersonalisasi</h3>
                </div>
              </div>

              {loading ? (
                <div className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin text-slate-400" />
                  <span>Mengekstrak instruksi medis...</span>
                </div>
              ) : screeningData.lastLog?.ai_recommendation ? (
                <div className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/80 rounded-2xl p-6 border border-slate-100 whitespace-pre-line shadow-inner">
                  {formatRecommendationText(screeningData.lastLog.ai_recommendation)}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed">
                  Belum memiliki data diagnosis rekomendasi dari kluster database.
                </div>
              )}
            </div>

            {/* Log Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-slate-200/60 p-8 shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Activity Logs</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Timeline Aktivitas Terbaru</h3>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-xs font-semibold text-slate-400 italic">Menyinkronkan log...</p>
                  ) : screeningData.lastLog ? (
                    <div className={`flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border ${currentRiskStyle.border}`}>
                      <div className={`p-2 ${currentRiskStyle.bg} text-white rounded-xl mt-0.5 shadow-sm`}>
                        <StatusIcon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Melakukan Cek Kesehatan Mandiri ({screeningData.lastLog.id.substring(0, 8).toUpperCase()})</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          Sistem berhasil memprediksi parameter fisik dengan kesimpulan status <span className={`font-black ${currentRiskStyle.text}`}>{screeningData.lastRiskLabel} RISK</span>.
                        </p>
                        <span className="inline-block text-[9px] font-black text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded mt-2">
                          {new Date(screeningData.lastLog.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 italic">Belum ada riwayat aktivitas log medis.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 rounded-[2.5rem] bg-white border border-slate-200/60 p-6 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Quick Access</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Mulai Tindakan</h3>
                </div>
                <div className="space-y-2.5">
                  <Link href="/check" onClick={handleNewScreeningClick} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xs transition-transform hover:scale-[1.02] shadow-sm shadow-blue-100">
                    <span>Luncurkan Skrining Baru</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>

            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
