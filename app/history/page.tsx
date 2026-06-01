"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Calendar, 
  Eye, 
  X, 
  Download, 
  FileText, 
  Activity, 
  RefreshCw, 
  AlertOctagon, 
  Trash2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { API_BASE_URL } from '../lib/api-url';
import { getApiErrorMessage } from '../lib/get-api-error-message';
import { useAbVariant } from '../lib/ab-testing';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface HistoryItem {
  id: string;
  date: string;
  age: string;       
  weight: string;    
  height: string;    
  bmi: string;
  highBP: string;
  highChol: string;
  prediction: string;
  status: 'LOW' | 'MEDIUM' | 'HIGH'; 
  diabetesRisk: number; 
  aiRecommendation: string;
}

type RawHistoryLog = Record<string, unknown>;

const EMPTY_RECOMMENDATION_TEXT = 'Rencana tindak lanjut belum tersimpan pada catatan ini.';

const isRecord = (value: unknown): value is RawHistoryLog => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const toDisplayString = (value: unknown, fallback = '-') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const getAgeRangeText = (ageValue: string | number) => {
  const val = String(ageValue).trim();
  switch (val) {
    case '1': return '18 - 24 Tahun';
    case '2': return '25 - 29 Tahun';
    case '3': return '30 - 34 Tahun';
    case '4': return '35 - 39 Tahun';
    case '5': return '40 - 44 Tahun';
    case '6': return '45 - 49 Tahun';
    case '7': return '50 - 54 Tahun';
    case '8': return '55 - 59 Tahun';
    case '9': return '60 - 64 Tahun';
    case '10': return '65 - 69 Tahun';
    case '11': return '70 - 74 Tahun';
    case '12': return '75 - 79 Tahun';
    case '13': return '80 Tahun Keatas';
    default: return val.includes('thn') || val.includes('Tahun') ? val : `${val} Tahun`;
  }
};

const getRecommendationText = (log: RawHistoryLog) => {
  return toDisplayString(
    log.ai_recommendation ??
      log.aiRecommendation ??
      log.recommendation ??
      log.recommendationText ??
      log.plan ??
      log.action_plan,
    ''
  );
};

const formatRecommendationText = (text: string) => {
  if (!text) return EMPTY_RECOMMENDATION_TEXT;

  return text.split('*').map((part, index) => (
    index % 2 === 1
      ? <strong key={index} className="font-extrabold text-blue-900 bg-blue-50 px-1 rounded">{part}</strong>
      : part
  ));
};

export default function HistoryPage() {
  const { variant, track } = useAbVariant();
  const isVariantB = variant === 'B';
  const [searchTerm, setSearchTerm] = useState('');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchUserHistory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("Token autentikasi tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/health/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(errData));
      }

      const resJson: unknown = await response.json();
      
      let rawLogs: RawHistoryLog[] = [];
      if (Array.isArray(resJson)) {
        rawLogs = resJson.filter(isRecord);
      } else if (isRecord(resJson)) {
        const recordsSource = resJson.records ?? resJson.data;
        rawLogs = Array.isArray(recordsSource) ? recordsSource.filter(isRecord) : [];
      }

      const normalizeYesNo = (value: unknown): string => {
        const normalizedValue = String(value ?? '').trim().toLowerCase();
        return value === 1 || value === true || ['1', 'ya', 'yes', 'true'].includes(normalizedValue)
          ? 'Ya'
          : 'Tidak';
      };

      const normalizedLogs: HistoryItem[] = rawLogs.map((log) => {
        const rawRiskValue = log.diabetesRisk ?? log.probability ?? log.risk_score ?? log.diabetes_risk ?? 0;
        let rawRisk = Number(rawRiskValue);
        if (!Number.isFinite(rawRisk)) {
          rawRisk = 0;
        }
        if (rawRisk <= 1 && rawRisk > 0) {
          rawRisk = rawRisk * 100;
        }
        const finalRiskPercent = Math.round(rawRisk);

        let calculatedStatus: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        let customPredictionText = 'Risiko Rendah';

        if (finalRiskPercent >= 70) {
          calculatedStatus = 'HIGH';
          customPredictionText = 'Risiko Tinggi';
        } else if (finalRiskPercent >= 35) {
          calculatedStatus = 'MEDIUM';
          customPredictionText = 'Risiko Sedang';
        }

        const dbRiskLevel = String(log.risk_level ?? log.riskLevel ?? log.prediction ?? '').toUpperCase();
        if (dbRiskLevel.includes('HIGH') || dbRiskLevel.includes('TINGGI')) {
          calculatedStatus = 'HIGH';
          customPredictionText = 'Risiko Tinggi';
        } else if (dbRiskLevel.includes('MEDIUM') || dbRiskLevel.includes('SEDANG')) {
          calculatedStatus = 'MEDIUM';
          customPredictionText = 'Risiko Sedang';
        }

        const cleanWeight = toDisplayString(log.weight ?? log.Weight);
        const cleanHeight = toDisplayString(log.height ?? log.Height);

        const rawBmi = log.bmi ?? log.BMI;
        const numericBmi = Number(rawBmi);
        const finalBmi = Number.isFinite(numericBmi) && numericBmi > 0
          ? numericBmi.toFixed(1)
          : '-';

        return {
          id: toDisplayString(log.id ?? log._id, 'DL-Log'),
          date: toDisplayString(log.date ?? log.createdAt, new Date().toISOString()),
          age: String(log.age ?? '1'),
          weight: cleanWeight,
          height: cleanHeight,
          bmi: finalBmi,
          highBP: normalizeYesNo(log.highBP ?? log.HighBP),
          highChol: normalizeYesNo(log.highChol ?? log.HighChol),
          prediction: customPredictionText,
          status: calculatedStatus,
          diabetesRisk: finalRiskPercent,
          aiRecommendation: getRecommendationText(log)
        };
      });

      const sortedLogs = normalizedLogs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setHistoryData(sortedLogs);
    } catch (error: unknown) {
      console.error("Kesalahan sinkronisasi riwayat:", error);
      setErrorMessage("Koneksi server sibuk. Silakan klik tombol Segarkan Riwayat beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan riwayat medis ini secara permanen?")) {
      return;
    }
    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/health/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Gagal menghapus.");
      setHistoryData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error: unknown) {
      console.error("Gagal menghapus riwayat:", error);
      alert("Gagal memproses penghapusan.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUserHistory();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUserHistory]);

  const filteredHistory = historyData.filter(item => {
    const searchString = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchString) ||
      item.status.toLowerCase().includes(searchString) ||
      item.prediction.toLowerCase().includes(searchString) ||
      item.aiRecommendation.toLowerCase().includes(searchString) ||
      item.date.includes(searchString)
    );
  });

  const handleOpenModal = (item: HistoryItem) => {
    track('history_detail_open', {
      riskLevel: item.status,
      probability: item.diabetesRisk,
    });
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    track('history_pdf_download', {
      riskLevel: selectedItem?.status ?? '',
      probability: selectedItem?.diabetesRisk ?? 0,
    });
    setIsDownloading(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const padding = 15;
      const contentWidth = pdfWidth - (padding * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const pageContentHeight = pdfHeight - (padding * 2);

      pdf.addImage(imgData, 'PNG', padding, padding, contentWidth, contentHeight);

      let remainingHeight = contentHeight - pageContentHeight;
      let imageTop = padding - pageContentHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', padding, imageTop, contentWidth, contentHeight);
        remainingHeight -= pageContentHeight;
        imageTop -= pageContentHeight;
      }

      pdf.save(`DiaLens_Hasil_Medis_${selectedItem?.id || 'Log'}.pdf`);
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert('Terjadi kesalahan saat mengekspor dokumen PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSearchTerm = event.target.value;
    setSearchTerm(nextSearchTerm);
    track('history_search', { queryLength: nextSearchTerm.length });
  };

  const getRiskTheme = (status: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (status) {
      case 'HIGH':
        return { text: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
      case 'MEDIUM':
        return { text: 'text-amber-600', bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { text: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-slate-900 font-sans selection:bg-blue-100">
      <div className="flex">
        <Sidebar />

        <div className="md:pl-64 pt-20 md:pt-0 w-full">
          <main className="p-8 max-w-7xl mx-auto space-y-6">
            
            <div className="rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 shadow-md text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100/80">Data Center Logs</p>
                  <h1 className="text-3xl font-black tracking-tight mt-1">Riwayat Skrining</h1>
                  <p className="text-xs text-blue-50/80 font-medium mt-1">
                    Kelola, cetak dokumen PDF resi, dan bersihkan log diagnosis medis AI sesuai akun Anda.
                  </p>
                  {isVariantB && (
                    <p className="text-xs text-blue-50 font-semibold mt-2 max-w-2xl">
                      Gunakan riwayat untuk membandingkan hasil skrining dan mengunduh PDF hasil pemeriksaan.
                    </p>
                  )}
                </div>
                <button 
                  onClick={fetchUserHistory}
                  className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 self-start sm:self-center"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin text-blue-200" : ""} />
                  <span>Segarkan Riwayat</span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-[2rem] border-2 border-rose-100 bg-rose-50/50 p-6 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 rounded-xl bg-rose-500 text-white">
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900">Koneksi Batas Waktu Terlampaui</h4>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm px-6 focus-within:border-blue-400 transition-colors">
              <Search className="text-blue-500" size={18} />
              <input 
                type="text"
                placeholder="Cari berdasarkan ID Log unik, status risiko AI, atau tanggal periksa..."
                className="w-full text-xs font-semibold outline-none bg-transparent placeholder:text-slate-400 text-slate-700"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-50/50 border-b border-blue-100 text-[10px] font-black uppercase tracking-wider text-blue-600">
                      <th className="py-5 px-6">Tanggal Periksa</th>
                      <th className="py-5 px-6">ID Log</th>
                      <th className="py-5 px-6">Indeks BMI</th>
                      <th className="py-5 px-6">Tensi & Kolesterol</th>
                      <th className="py-5 px-6">Tingkat Risiko AI</th>
                      <th className="py-5 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-600 divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw size={20} className="animate-spin text-blue-600" />
                            <span className="font-bold text-blue-600 text-xs">Mengekstrak berkas riwayat medis...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((item) => {
                        const theme = getRiskTheme(item.status);
                        return (
                          <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-4.5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-500 border border-blue-100/60">
                                  <Calendar size={14} />
                                </div>
                                <span className="font-bold text-slate-800">
                                  {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td className="py-4.5 px-6 font-mono text-[11px] text-blue-500 font-bold">
                              #{item.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4.5 px-6 whitespace-nowrap">
                              <span className="font-extrabold px-2.5 py-1 rounded-xl text-[11px] bg-blue-50 text-blue-700 border border-blue-100">
                                {item.bmi !== '-' ? `${parseFloat(item.bmi).toFixed(1)} BMI` : '- BMI'}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 whitespace-nowrap text-[11px] space-y-0.5">
                              <div>Tensi Tinggi: <span className={`font-black ${item.highBP === 'Ya' ? 'text-blue-600 bg-blue-50 px-1 rounded' : 'text-slate-400 bg-slate-100 px-1 rounded'}`}>{item.highBP}</span></div>
                              <div>Kolesterol Tinggi: <span className={`font-black ${item.highChol === 'Ya' ? 'text-blue-600 bg-blue-50 px-1 rounded' : 'text-slate-400 bg-slate-100 px-1 rounded'}`}>{item.highChol}</span></div>
                            </td>
                            <td className="py-4.5 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                                <span>{item.status} RISK ({item.diabetesRisk}%)</span>
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => handleOpenModal(item)}
                                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                  <Eye size={15} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteHistory(item.id)}
                                  disabled={deletingId === item.id}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-medium italic">
                          Tidak ditemukan berkas rekam medis historis untuk akun ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* =========================================================================
          ✨ MODAL PREVIEW DETAIL: AKURAT DAN SESUAI DATA ASLI DATABASE
         ========================================================================= */}
      {isModalOpen && selectedItem && (() => {
        const modalTheme = getRiskTheme(selectedItem.status);
        
        let parsedBMI = parseFloat(selectedItem.bmi);
        if (isNaN(parsedBMI) || parsedBMI <= 0) parsedBMI = 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/20">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="font-black text-base tracking-tight text-blue-900">Detail Dokumen Medis</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                <div 
                  ref={receiptRef}
                  className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm max-w-md mx-auto relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

                  <div className="text-center space-y-1">
                    <div className="flex justify-center items-center gap-2 text-blue-600 font-black text-xl tracking-tight">
                      <Activity size={22} className="stroke-[3]" />
                      <span>DIALENS</span>
                    </div>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Sistem Prediksi Risiko Diabetes AI</p>
                  </div>

                  <div className="border-b border-dashed border-blue-100 my-4" />

                  <div className="grid grid-cols-2 text-[11px] font-medium text-slate-500 gap-y-2">
                    <div>No. Dokumen:</div>
                    <div className="text-right font-bold text-slate-800 font-mono">#{selectedItem.id.toUpperCase()}</div>
                    <div>Waktu Periksa:</div>
                    <div className="text-right font-bold text-slate-800">
                      {new Date(selectedItem.date).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                  </div>

                  <div className="border-b border-slate-100 my-2" />

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600">Hasil Input Biometrik</h4>
                    <div className="bg-blue-50/30 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600 font-semibold">
                      <div className="flex justify-between">
                        <span>Rentang Usia</span>
                        <span className="text-slate-900 font-bold">{getAgeRangeText(selectedItem.age)}</span>
                      </div>
                      {selectedItem.weight && selectedItem.weight !== '-' && (
                        <div className="flex justify-between">
                          <span>Berat Badan</span>
                          <span className="text-slate-900 font-bold">{selectedItem.weight} KG</span>
                        </div>
                      )}
                      {selectedItem.height && selectedItem.height !== '-' && (
                        <div className="flex justify-between">
                          <span>Tinggi Badan</span>
                          <span className="text-slate-900 font-bold">{selectedItem.height} CM</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-blue-100 pt-2 mt-1">
                        <span className="text-blue-600 font-bold">Massa Tubuh (BMI)</span>
                        <span className="text-blue-600 font-black bg-blue-100/70 px-2 rounded">
                          {parsedBMI > 0 ? parsedBMI.toFixed(1) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600">Kondisi Klinis Historis</h4>
                    <div className="bg-blue-50/30 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600 font-semibold">
                      <div className="flex justify-between">
                        <span>Riwayat Tekanan Darah Tinggi</span>
                        <span className={`font-bold ${selectedItem.highBP === 'Ya' ? 'text-blue-600' : 'text-slate-900'}`}>{selectedItem.highBP}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Riwayat Kolesterol Tinggi</span>
                        <span className={`font-bold ${selectedItem.highChol === 'Ya' ? 'text-blue-600' : 'text-slate-900'}`}>{selectedItem.highChol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-blue-100 my-4" />

                  <div className="text-center p-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Kesimpulan Analisis Model AI</p>
                    <div className={`mt-2 flex items-center gap-1.5 font-black text-sm uppercase ${modalTheme.text}`}>
                      <span>RISIKO {selectedItem.status === 'HIGH' ? 'TINGGI' : selectedItem.status === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}</span>
                      <span className="text-slate-500 font-bold text-xs">({selectedItem.diabetesRisk}%)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600">Rencana Tindak Lanjut</h4>
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-[11px] text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {formatRecommendationText(selectedItem.aiRecommendation)}
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col items-center justify-center text-center">
                    <div className="text-blue-400 font-mono text-[9px] border border-blue-100 px-3 py-1 rounded-md tracking-wider uppercase bg-blue-50/50">
                      DIALENS VALIDATED AI
                    </div>
                    <div className="w-48 h-px bg-slate-200 mt-2 mb-1"></div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Signature</p>
                  </div>

                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  {isDownloading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Download size={16} />
                  )}
                  <span>{isDownloading ? 'Menyimpan...' : 'Unduh PDF'}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
