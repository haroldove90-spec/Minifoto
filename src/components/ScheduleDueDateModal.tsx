import React, { useState } from 'react';
import { X, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { GraduationStudent } from '../types';
import { scheduleStudentDueDate } from '../services/storage';

interface ScheduleDueDateModalProps {
  student: GraduationStudent;
  operatorName: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ScheduleDueDateModal: React.FC<ScheduleDueDateModalProps> = ({
  student,
  operatorName,
  onClose,
  onSaved,
}) => {
  // Pre-fill next due date (default to 7 days from now)
  const defaultDate = student.nextDueDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const [dueDate, setDueDate] = useState<string>(defaultDate);
  const [dueAmount, setDueAmount] = useState<number>(
    student.nextDueAmount && student.nextDueAmount > 0 
      ? student.nextDueAmount 
      : Math.min(student.remainingAmount, 150)
  );

  const handleSetQuickDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || dueAmount <= 0) return;

    scheduleStudentDueDate(student.id, dueDate, dueAmount, operatorName || 'Cobrador');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-sm font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Programar Plazo de Pago</h3>
              <p className="text-xs text-[#ECB769] font-medium">Mini Foto Estudio • Compromiso de Abono</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#FFF3BC]/70 hover:text-white hover:bg-black/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Student Info */}
          <div className="p-3 bg-[#FCF9F2] rounded-2xl border border-[#ECB769]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Alumno</span>
              <p className="text-sm font-black text-[#4E2B01]">{student.studentName}</p>
              <p className="text-[11px] text-slate-600 font-medium">{student.schoolName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo Pendiente</span>
              <p className="text-base font-black text-amber-600">${student.remainingAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Accesos rápidos de fecha:
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSetQuickDays(3)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
              >
                +3 días
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(7)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
              >
                +1 semana
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(15)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
              >
                +15 días
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(30)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-center"
              >
                +1 mes
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Fecha acordada del plazo:
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
            />
          </div>

          {/* Amount presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              Monto del abono acordado ($):
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs mb-2">
              <button
                type="button"
                onClick={() => setDueAmount(Math.min(student.remainingAmount, 100))}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $100
              </button>
              <button
                type="button"
                onClick={() => setDueAmount(Math.min(student.remainingAmount, 150))}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $150
              </button>
              <button
                type="button"
                onClick={() => setDueAmount(Math.min(student.remainingAmount, 200))}
                className="py-1.5 px-2 bg-slate-100 hover:bg-[#ECB769]/30 rounded-xl font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                $200
              </button>
              <button
                type="button"
                onClick={() => setDueAmount(student.remainingAmount)}
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
                value={dueAmount || ''}
                onChange={(e) => setDueAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Máximo programable: ${student.remainingAmount.toFixed(2)}
            </span>
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
              className="px-5 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-[#ECB769]" />
              Guardar Plazo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
