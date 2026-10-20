import React, { useState, useEffect } from 'react';
import { X, Landmark, CheckCircle, Search, Clock, Check, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { BankTransferRecord, GraduationStudent } from '../types';
import { getStoredBankTransfers, confirmBankTransfer, getStoredStudents } from '../services/storage';

interface SantanderReconciliationModalProps {
  operatorName: string;
  onClose: () => void;
  onReconciliationDone: () => void;
}

export const SantanderReconciliationModal: React.FC<SantanderReconciliationModalProps> = ({
  operatorName,
  onClose,
  onReconciliationDone,
}) => {
  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransferRecord | null>(null);
  const [bankFolioInput, setBankFolioInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendiente' | 'confirmado'>('pendiente');
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    setTransfers(getStoredBankTransfers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirm = (transfer: BankTransferRecord) => {
    const result = confirmBankTransfer(transfer.id, operatorName || 'Oficina', bankFolioInput || undefined);
    if (result.success) {
      setNotification(`✅ Transferencia de $${result.amount} conciliada exitosamente para ${result.studentName}. El saldo fue actualizado.`);
      loadData();
      setSelectedTransfer(null);
      setBankFolioInput('');
      onReconciliationDone();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filtered = transfers.filter((t) => {
    const matchesFilter = filterStatus === 'todos' || t.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      t.studentName.toLowerCase().includes(term) ||
      t.santanderReference.toLowerCase().includes(term) ||
      t.schoolName.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = transfers.filter(t => t.status === 'pendiente').length;
  const pendingTotal = transfers
    .filter(t => t.status === 'pendiente')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#EC0000] to-[#B30000] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-[#EC0000] rounded-2xl shadow-sm font-black">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Conciliación Bancaria Santander SPEI</h3>
              <p className="text-xs text-white/90 font-medium">Mini Foto Estudio • Oficina Administrativa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-black/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Notification */}
          {notification && (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Transferencias Pendientes</span>
              <span className="text-xl font-black text-amber-700">{pendingCount}</span>
            </div>
            <div className="p-3 bg-[#FCF9F2] border border-[#ECB769]/50 rounded-2xl">
              <span className="text-[10px] font-bold text-[#4E2B01] uppercase block">Monto por Conciliar</span>
              <span className="text-xl font-black text-[#4E2B01]">${pendingTotal.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Movimientos</span>
              <span className="text-xl font-black text-slate-800">{transfers.length}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por alumno o Ref. Santander..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('pendiente')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'pendiente'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('confirmado')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'confirmado'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Confirmados
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('todos')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'todos'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-black text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Ref. Santander</th>
                  <th className="py-2.5 px-3">Alumno / Escuela</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-medium text-slate-600">{t.date}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono font-black text-[#EC0000] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                          {t.santanderReference}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-bold text-slate-900">{t.studentName}</p>
                        <span className="text-[10px] text-slate-500">{t.schoolName}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 text-xs">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            t.status === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {t.status === 'pendiente' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTransfer(t)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-xs transition cursor-pointer"
                          >
                            Conciliar
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Acreditado</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron transferencias con los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Confirm Sub-modal / Drawer */}
          {selectedTransfer && (
            <div className="p-4 bg-[#FCF9F2] rounded-2xl border-2 border-[#ECB769] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-[#4E2B01]">
                  Confirmar Acreditación de Transferencia Bancaria
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTransfer(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <p><strong>Alumno:</strong> {selectedTransfer.studentName}</p>
                <p><strong>Ref Santander:</strong> {selectedTransfer.santanderReference}</p>
                <p><strong>Importe:</strong> ${selectedTransfer.amount.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {selectedTransfer.date}</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Folio de rastreo bancario Santander SPEI (opcional)"
                  value={bankFolioInput}
                  onChange={(e) => setBankFolioInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                />
                <button
                  type="button"
                  onClick={() => handleConfirm(selectedTransfer)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Confirmar y Acreditar Saldo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
          <span className="text-[11px] text-slate-500 font-medium">
            Al conciliar, el saldo pendiente del alumno se reduce y se notifica al cobrador.
          </span>
        </div>
      </div>
    </div>
  );
};
