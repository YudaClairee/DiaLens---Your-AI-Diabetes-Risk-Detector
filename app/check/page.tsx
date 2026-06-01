"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  Scale,
  HeartPulse,
  Droplets,
  Eye,
  Dumbbell,
  Cigarette,
  Wine,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { API_BASE_URL } from '../lib/api-url';
import { useAbVariant } from '../lib/ab-testing';
import { getApiErrorMessage } from '../lib/get-api-error-message';

interface FormCardProps {
  label: string;
  alias: string;
  icon: React.ElementType;
  iconBg: string;
  gradientBg: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard = ({ label, alias, icon: Icon, iconBg, gradientBg, children, className = "" }: FormCardProps) => (
  <div className={`rounded-[2rem] border border-slate-200/60 bg-gradient-to-b ${gradientBg} p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200/80 flex flex-col justify-between group ${className}`}>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className={`p-2 rounded-xl text-white ${iconBg} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
          {alias}
        </span>
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-[0.05em] text-slate-700">{label}</h4>
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

interface PredictionResult {
  prediction: string;
  probability: number;
  riskLevel: string;
  aiRecommendation: string;
}

export default function CheckPage() {
  const { variant, track } = useAbVariant();
  const isVariantB = variant === 'B';

  const [ageGroup, setAgeGroup] = useState('1'); 
  const [heightCm, setHeightCm] = useState('');  
  const [weightKg, setWeightKg] = useState('');  

  const [highBP, setHighBP] = useState('0');
  const [highChol, setHighChol] = useState('0');
  const [cholCheck, setCholCheck] = useState('1');
  const [smoker, setSmoker] = useState('0');
  const [physActivity, setPhysActivity] = useState('1');
  const [hvyAlcoholConsump, setHvyAlcoholConsump] = useState('0');
  const [genHlth, setGenHlth] = useState('3');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const bmi = useMemo(() => {
    const heightMeters = parseFloat(heightCm) / 100;
    const weight = parseFloat(weightKg);

    if (heightMeters > 0 && weight > 0) {
      const calculatedBmi = weight / (heightMeters * heightMeters);
      return calculatedBmi.toFixed(1);
    }

    return '0';
  }, [heightCm, weightKg]);

  const getRiskStyles = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level === 'tinggi' || level === 'high') {
      return {
        bg: 'bg-red-50/40 border-red-100/60',
        text: 'text-red-600',
        badge: 'bg-red-50 text-red-600 border-red-100',
        indicator: 'text-red-100/50',
        label: 'text-red-500',
        cardBorder: 'border-red-200'
      };
    } else if (level === 'sedang' || level === 'medium') {
      return {
        bg: 'bg-orange-50/40 border-orange-100/60',
        text: 'text-orange-600',
        badge: 'bg-orange-50 text-orange-600 border-orange-100',
        indicator: 'text-orange-100/50',
        label: 'text-orange-500',
        cardBorder: 'border-orange-200'
      };
    } else {
      return {
        bg: 'bg-green-50/40 border-green-100/60',
        text: 'text-green-600',
        badge: 'bg-green-50 text-green-600 border-green-100',
        indicator: 'text-green-100/50',
        label: 'text-green-500',
        cardBorder: 'border-green-200'
      };
    }
  };

  const riskStyles = result ? getRiskStyles(result.riskLevel) : getRiskStyles('rendah');

  const getPrimaryResultAction = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();

    if (level === 'tinggi' || level === 'high') {
      return {
        label: 'Cari Rumah Sakit',
        href: '/rumah-sakit',
      };
    }

    if (level === 'sedang' || level === 'medium') {
      return {
        label: 'Lihat Rekomendasi & Riwayat',
        href: '/history',
      };
    }

    return {
      label: 'Simpan dan Pantau Riwayat',
      href: '/history',
    };
  };

  const resultPrimaryAction = result ? getPrimaryResultAction(result.riskLevel) : null;

  const trackResultAction = (action: string) => {
    if (!result) return;

    track('result_action_click', {
      action,
      riskLevel: result.riskLevel,
      probability: result.probability,
    });
  };

  const handleRestartScreening = () => {
    trackResultAction('Skrining Ulang');
    setResult(null);
    setErrorMessage(null);
    setCurrentStep(1);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isVariantB) {
      track('screening_step_view', { step: currentStep });
    }
  }, [currentStep, isVariantB, track]);

  const getStepMetadata = () => (isVariantB ? { step: currentStep } : undefined);

  const hasValidBodyData = () => {
    const height = Number(heightCm);
    const weight = Number(weightKg);
    return height > 0 && weight > 0;
  };

  const handleWizardNext = () => {
    if (currentStep === 1 && !hasValidBodyData()) {
      setErrorMessage('Tinggi dan berat badan harus diisi sebelum lanjut ke langkah berikutnya.');
      track('screening_error', { step: currentStep });
      return;
    }

    setErrorMessage(null);
    track('screening_step_next', { step: currentStep });
    setCurrentStep((step) => Math.min(step + 1, 3));
  };

  const handleWizardBack = () => {
    setErrorMessage(null);
    track('screening_step_back', { step: currentStep });
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isVariantB && currentStep !== 3) {
      handleWizardNext();
      return;
    }

    track('screening_submit', getStepMetadata());
    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    const height = Number(heightCm);
    const weight = Number(weightKg);
    const bmiValue = Number.parseFloat(bmi);

    if (height <= 0 || weight <= 0 || !Number.isFinite(bmiValue) || bmiValue <= 0) {
      setErrorMessage('Tinggi dan berat badan harus diisi dengan angka yang valid.');
      track('screening_error', getStepMetadata());
      setLoading(false);
      return;
    }

    const payload = {
      Age: parseInt(ageGroup),
      BMI: bmiValue,
      HighBP: parseInt(highBP),
      HighChol: parseInt(highChol),
      CholCheck: parseInt(cholCheck),
      Smoker: parseInt(smoker),
      HvyAlcoholConsump: parseInt(hvyAlcoholConsump),
      PhysActivity: parseInt(physActivity),
      GenHlth: parseInt(genHlth),
      Weight: weight,
      Height: height,
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Sesi masuk telah berakhir. Silakan lakukan login ulang.');
      }

      const res = await fetch(`${API_BASE_URL}/api/health/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(getApiErrorMessage(errData));
      }

      const resJson = await res.json();
      const rawData = resJson.data || resJson;

      const rLevel = String(rawData.risk_level || '').toLowerCase();
      const probability = rawData.probability !== undefined
        ? Number(rawData.probability)
        : 0;
      const probabilityPercent = probability <= 1 ? probability * 100 : probability;

      let tingkatRisikoIndo = 'Tidak Diketahui';
      if (rLevel.includes('high') || rLevel.includes('tinggi') || probabilityPercent >= 70) {
        tingkatRisikoIndo = 'Tinggi';
      } else if (rLevel.includes('medium') || rLevel.includes('sedang') || probabilityPercent >= 35) {
        tingkatRisikoIndo = 'Sedang';
      } else if (rLevel.includes('low') || rLevel.includes('rendah') || probabilityPercent > 0) {
        tingkatRisikoIndo = 'Rendah';
      }

      const prediksiIndo = tingkatRisikoIndo === 'Tidak Diketahui'
        ? 'Risiko Belum Diketahui'
        : tingkatRisikoIndo === 'Rendah'
        ? 'Risiko Diabetes Rendah'
        : `Terdeteksi Risiko Diabetes ${tingkatRisikoIndo}`;

      const probValue = Math.round(probabilityPercent);

      const recommendationText = rawData.ai_recommendation || rawData.aiRecommendation || 'Tetap jaga pola makan sehat, batasi konsumsi gula berlebih, dan lakukan aktivitas fisik secara teratur.';

      setResult({
        prediction: prediksiIndo,
        probability: probValue,
        riskLevel: tingkatRisikoIndo,
        aiRecommendation: recommendationText
      });
      track('screening_success', {
        ...(isVariantB ? { step: currentStep } : {}),
        riskLevel: tingkatRisikoIndo,
        probability: probValue
      });

    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi gangguan eksternal saat menghubungi server AI.');
      track('screening_error', getStepMetadata());
    } finally {
      setLoading(false);
    }
  };

  const formatRecommendationText = (text: string) => {
    if (!text) return '';
    return text.split('*').map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-extrabold text-blue-900 bg-blue-50 px-1 rounded">{part}</strong> : part
    );
  };

  const renderAgeField = () => (
    <FormCard label="Kelompok Usia Anda" alias="Demografi" icon={Calendar} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white">
      <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="1">Level 1 (Usia 18 - 24)</option>
        <option value="2">Level 2 (Usia 25 - 29)</option>
        <option value="3">Level 3 (Usia 30 - 34)</option>
        <option value="4">Level 4 (Usia 35 - 39)</option>
        <option value="5">Level 5 (Usia 40 - 44)</option>
        <option value="6">Level 6 (Usia 45 - 49)</option>
        <option value="7">Level 7 (Usia 50 - 54)</option>
        <option value="8">Level 8 (Usia 55 - 59)</option>
        <option value="9">Level 9 (Usia 60 - 64)</option>
        <option value="10">Level 10 (Usia 65 - 69)</option>
        <option value="11">Level 11 (Usia 70 - 74)</option>
        <option value="12">Level 12 (Usia 75 - 79)</option>
        <option value="13">Level 13 (Usia 80 atau lebih tua)</option>
      </select>
    </FormCard>
  );

  const renderHeightField = () => (
    <FormCard label="Tinggi Badan" alias="Antropometri" icon={Scale} iconBg="bg-indigo-600" gradientBg="from-indigo-50/40 to-white">
      <div className="relative flex items-center">
        <input type="number" min="1" required placeholder="Contoh: 165" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 pr-10 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
        <span className="absolute right-3 text-[10px] font-black text-slate-400 uppercase">cm</span>
      </div>
    </FormCard>
  );

  const renderWeightField = () => (
    <FormCard label="Berat Badan" alias="Massa Tubuh" icon={Scale} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white">
      <div className="relative flex items-center">
        <input type="number" min="1" required placeholder="Contoh: 86" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 pr-10 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
        <span className="absolute right-3 text-[10px] font-black text-slate-400 uppercase">kg</span>
      </div>
    </FormCard>
  );

  const renderHighBpField = () => (
    <FormCard label="Tekanan Darah Tinggi" alias="Hipertensi" icon={HeartPulse} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white">
      <select value={highBP} onChange={(e) => setHighBP(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="0">Tidak Ada / Normal</option>
        <option value="1">Ya, Ada Riwayat</option>
      </select>
    </FormCard>
  );

  const renderHighCholField = () => (
    <FormCard label="Kolesterol Tinggi" alias="Lipid" icon={Droplets} iconBg="bg-indigo-600" gradientBg="from-indigo-50/40 to-white">
      <select value={highChol} onChange={(e) => setHighChol(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="0">Tidak Ada / Normal</option>
        <option value="1">Ya, Di Atas Batas</option>
      </select>
    </FormCard>
  );

  const renderCholCheckField = () => (
    <FormCard label="Cek Kolesterol (5 Thn Terakhir)" alias="Pemeriksaan" icon={Eye} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white">
      <select value={cholCheck} onChange={(e) => setCholCheck(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="1">Ya, Pernah Cek</option>
        <option value="0">Belum Pernah</option>
      </select>
    </FormCard>
  );

  const renderSmokerField = () => (
    <FormCard label="Riwayat Merokok" alias="Eksternal" icon={Cigarette} iconBg="bg-indigo-600" gradientBg="from-indigo-50/40 to-white">
      <select value={smoker} onChange={(e) => setSmoker(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="0">Tidak Merokok</option>
        <option value="1">Ya, Perokok Aktif</option>
      </select>
    </FormCard>
  );

  const renderAlcoholField = () => (
    <FormCard label="Konsumsi Alkohol Berat" alias="Alkohol" icon={Wine} iconBg="bg-cyan-600" gradientBg="from-cyan-50/40 to-white">
      <select value={hvyAlcoholConsump} onChange={(e) => setHvyAlcoholConsump(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="0">Tidak / Dalam Batas Wajar</option>
        <option value="1">Ya, Konsumsi Berat</option>
      </select>
    </FormCard>
  );

  const renderPhysActivityField = () => (
    <FormCard label="Aktivitas Fisik / Olahraga" alias="Kebugaran" icon={Dumbbell} iconBg="bg-blue-600" gradientBg="from-blue-50/40 to-white">
      <select value={physActivity} onChange={(e) => setPhysActivity(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all">
        <option value="1">Rutin Beraktivitas</option>
        <option value="0">Tidak Pernah / Jarang</option>
      </select>
    </FormCard>
  );

  const renderBmiField = (className = "sm:col-span-2 lg:col-span-2") => (
    <FormCard 
      label="Indeks Massa Tubuh (BMI)" 
      alias="Kalkulasi" 
      icon={Activity} 
      iconBg="bg-indigo-600" 
      gradientBg="from-indigo-50/40 to-white"
      className={className}
    >
      <div className="w-full bg-blue-50/60 border border-blue-200 text-blue-700 font-black rounded-xl p-2.5 text-center text-sm shadow-inner mt-2">
        {bmi} <span className="text-[10px] font-medium text-slate-500 ml-1">kg/m²</span>
      </div>
    </FormCard>
  );

  const renderGenHealthField = (className = "sm:col-span-2 lg:col-span-2") => (
    <FormCard 
      label="Kondisi Kesehatan Umum" 
      alias="Kuesioner" 
      icon={Eye} 
      iconBg="bg-blue-600" 
      gradientBg="from-blue-50/40 to-white"
      className={className}
    >
      <select value={genHlth} onChange={(e) => setGenHlth(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all mt-2">
        <option value="1">Sangat Baik (Excellent)</option>
        <option value="2">Baik Sekali (Very Good)</option>
        <option value="3">Cukup Baik (Good)</option>
        <option value="4">Kurang Baik (Fair)</option>
        <option value="5">Buruk (Poor)</option>
      </select>
    </FormCard>
  );

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-slate-900 font-sans selection:bg-blue-100">
      <div className="flex">
        <Sidebar />
        <div className="md:pl-64 pt-20 md:pt-0 w-full">
          <main className="p-8 max-w-7xl mx-auto space-y-6">
            
            <div className="rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-xl shadow-blue-100/60 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200">Skrining Kesehatan</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Analisis Risiko Diabetes AI</h1>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-[2rem] border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-4">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-blue-900">Kendala Integrasi Server</h4>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePredict} className="space-y-6">
              {isVariantB ? (
                <div className="rounded-[2.5rem] border border-slate-200/70 bg-white p-5 md:p-6 shadow-sm space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Langkah {currentStep} dari 3</p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                        {currentStep === 1 ? 'Data Tubuh' : currentStep === 2 ? 'Riwayat Klinis' : 'Kebiasaan'}
                      </h2>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 md:w-56">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderAgeField()}
                      {renderHeightField()}
                      {renderWeightField()}
                      {renderBmiField("sm:col-span-2 lg:col-span-1")}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderHighBpField()}
                      {renderHighCholField()}
                      {renderCholCheckField()}
                      {renderGenHealthField("sm:col-span-2 lg:col-span-1")}
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderSmokerField()}
                      {renderPhysActivityField()}
                      {renderAlcoholField()}
                    </div>
                  )}

                  <div className={`flex flex-col gap-3 pt-2 sm:flex-row ${currentStep > 1 ? 'sm:justify-between' : 'sm:justify-end'}`}>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleWizardBack}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <ChevronLeft size={14} />
                        <span>Kembali</span>
                      </button>
                    )}

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleWizardNext}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span>Lanjut</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Sedang Mengalkulasi...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Mulai Analisis AI</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderAgeField()}
                    {renderHeightField()}
                    {renderWeightField()}
                    {renderHighBpField()}
                    {renderHighCholField()}
                    {renderCholCheckField()}
                    {renderSmokerField()}
                    {renderAlcoholField()}
                    {renderPhysActivityField()}
                    {renderBmiField()}
                    {renderGenHealthField()}
                  </div>

                  <div className="flex justify-center pt-4 w-full">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-4 px-6 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Sedang Mengalkulasi Parameter Medis...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Mulai Analisis AI Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="pt-4">
              {result ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className={`rounded-[2.5rem] bg-white border p-6 md:p-8 shadow-sm flex flex-col gap-6 ${riskStyles.cardBorder}`}>
                    <div className={`flex flex-col items-center justify-center p-6 rounded-3xl border relative overflow-hidden w-full max-w-md mx-auto ${riskStyles.bg}`}>
                      <p className={`text-[10px] font-black uppercase tracking-wider ${riskStyles.label}`}>Persentase Risiko</p>
                      <h2 className={`text-5xl font-black my-2 tracking-tighter ${riskStyles.text}`}>{result.probability}%</h2>
                      <p className={`text-[10px] font-bold bg-white px-3 py-1 rounded-full shadow-sm border ${riskStyles.badge}`}>Tingkat Kerawanan Sistemis</p>
                    </div>

                    <div className="text-center space-y-3 max-w-xl mx-auto border-t border-slate-100 pt-4 w-full">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs border ${riskStyles.badge}`}>
                        <CheckCircle2 size={14} />
                        <span>{result.prediction}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Kategori risiko: <span className={`font-black ${riskStyles.text}`}>{result.riskLevel}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[2.5rem] bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">AI Medical Advice</p>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Rekomendasi Klinis Terpersonalisasi</h3>
                      </div>
                    </div>

                    <div className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/80 rounded-2xl p-6 border border-slate-100 whitespace-pre-line shadow-inner">
                      {formatRecommendationText(result.aiRecommendation)}
                    </div>
                  </div>

                  {isVariantB && resultPrimaryAction && (
                    <div className="rounded-[2.5rem] bg-white border border-blue-100 p-6 md:p-8 shadow-sm space-y-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Tindakan Lanjutan</p>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Pilih langkah berikutnya</h3>
                        </div>
                        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${riskStyles.badge}`}>
                          Risiko {result.riskLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <Link
                          href={resultPrimaryAction.href}
                          onClick={() => trackResultAction(resultPrimaryAction.label)}
                          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.16em] text-white shadow-md transition-all hover:bg-blue-700"
                        >
                          <span>{resultPrimaryAction.label}</span>
                          <ChevronRight size={15} />
                        </Link>

                        <button
                          type="button"
                          onClick={handleRestartScreening}
                          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                          <RefreshCw size={14} />
                          <span>Skrining Ulang</span>
                        </button>

                        <Link
                          href="/dashboard"
                          onClick={() => trackResultAction('Lihat Dashboard')}
                          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                          <span>Lihat Dashboard</span>
                          <ChevronRight size={15} />
                        </Link>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="rounded-[2.5rem] bg-white border border-slate-200/60 p-8 shadow-sm text-center">
                  <div className="max-w-md mx-auto py-6 space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 text-slate-400">
                      <Info size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Menunggu Inisiasi Skrining</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Silakan isi semua parameter bento grid di atas terlebih dahulu, kemudian klik tombol <strong>Mulai Analisis AI Sekarang</strong> untuk memunculkan ringkasan prediksi risiko beserta instruksi klinis dari server secara lengkap di area ini.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
