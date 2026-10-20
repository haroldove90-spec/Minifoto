import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, Landmark, CheckCircle, AlertTriangle } from 'lucide-react';
import { GraduationStudent, PaymentMethod, PaymentRecord } from '../types';
import { recordStudentPayment } from '../services/storage';

interface PaymentRegisterModalProps {
  student: GraduationStudent;
  terminalId: string;
  operatorName: string;
  onClose: () => void;
  onPaymentSuccess: (payment: PaymentRecord, updatedStudent: GraduationStudent) => void;
}

export const PaymentRegisterModal: React.FC<PaymentRegisterModalProps> = ({
  student,
  terminalId,
  operatorName,
  onClose,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(Math.min(student.remainingAmount, 150));
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(Math.min(student.remainingAmount, 150));
  const [notes, setNotes] = useState<string>('');

  const change = Math.max(0, cashReceived - amount);

  const handleQuickAmount = (val: number) => {
    const safeVal = Math.min(student.remainingAmount, val);
    setAmount(safeVal);
    if (cashReceived < safeVal) setCashReceived(safeVal);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > student.remainingAmount) return;

    const result = recordStudentPayment({
      studentId: student.id,
      amount,
      method,
      terminalId,
      operatorName,
      notes: notes || (method === 'transferencia' ? `Ref Santander: ${student.santanderReference}` : undefined),
    });

    if (result.success && result.student && result.payment) {
      onPaymentSuccess(result.payment, result.student);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-sm font-black">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Registrar Cobro / Abono</h3>
              <p className="text-xs text-[#ECB769] font-medium">Terminal: {terminalId} • {operatorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#FFF3BC]/70 hover:text-white hover:bg-black/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Student Banner */}
          <div className="p-3 bg-[#FCF9F2] rounded-2xl border border-[#ECB769]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Alumno</span>
              <p className="text-sm font-black text-[#4E2B01]">{student.studentName}</p>
              <p className="text-[11px] text-slate-600 font-medium">
                {student.schoolName} • {student.gradeGroup}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo Pendiente</span>
              <p className="text-base font-black text-amber-600">${student.remainingAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Amount Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span>Importe a Cobrar ($):</span>
              <span className="text-[10px] text-slate-500 font-normal">Accesos rápidos</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs mb-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $100
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(150)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $150
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(200)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $200
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(student.remainingAmount)}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-black border border-amber-200 transition cursor-pointer"
              >
                Liquidar
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">$</span>
              <input
                type="number"
                required
                min={1}
                max={student.remainingAmount}
                step="any"
                value={amount || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAmount(val);
                  if (cashReceived < val) setCashReceived(val);
                }}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-black text-[#4E2B01] focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Método de Pago:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMethod('efectivo')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'efectivo'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('clip')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'clip'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Clip / Tarjeta</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('transferencia')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'transferencia'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Transferencia</span>
              </button>
            </div>
          </div>

          {/* Cash calculation if cash */}
          {method === 'efectivo' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Monto Recibido en Efectivo:</label>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={amount}
                    step="any"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold text-right focus:outline-none focus:ring-1 focus:ring-[#4E2B01]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-600">Cambio a Entregar:</span>
                <span className={`text-sm font-black ${change > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  ${change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Warning if Transfer */}
          {method === 'transferencia' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Registro de Transferencia Santander</p>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  El pago quedará registrado en estado <strong>Pendiente de confirmar</strong> hasta que las oficinas concilien el movimiento con la referencia <strong>{student.santanderReference}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notas u observaciones (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Recibido por cobrador en puerta de escuela"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={amount <= 0 || amount > student.remainingAmount}
              className="px-5 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-[#ECB769]" />
              Confirmar Cobro e Imprimir Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
