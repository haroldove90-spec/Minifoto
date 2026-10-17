import React, { useState } from 'react';
import { GraduationStudent, Sale } from '../../types';
import { 
  PackageCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Printer, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PackageDeliveriesViewProps {
  students: GraduationStudent[];
  onUpdateStudent: (student: GraduationStudent) => void;
  onRecordLiquidationSale: (sale: Sale, updatedStudent: GraduationStudent) => void;
  onOpenTicket: (student: GraduationStudent) => void;
  operatorName: string;
}

export const PackageDeliveriesView: React.FC<PackageDeliveriesViewProps> = ({
  students,
  onUpdateStudent,
  onRecordLiquidationSale,
  onOpenTicket,
  operatorName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendiente' | 'listo' | 'entregado'>('todos');
  const [selectedStudentForLiquidation, setSelectedStudentForLiquidation] = useState<GraduationStudent | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'clip' | 'mercadopago' | 'transferencia'>('efectivo');

  // Filter students
  const filtered = students.filter((s) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'todos' || s.deliveryStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmLiquidation = () => {
    if (!selectedStudentForLiquidation) return;

    const student = selectedStudentForLiquidation;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const updatedStudent: GraduationStudent = {
      ...student,
      depositAmount: student.totalAmount,
      remainingAmount: 0,
      deliveryStatus: 'entregado',
      deliveryDate: dateStr,
    };

    // Create a sale record for the rest payment
    const restSale: Sale = {
      id: `sale-liq-${Date.now()}`,
      folio: `LIQ-${student.folio.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
      date: dateStr,
      role: 'cashier',
      operatorName: operatorName || 'Cajero de Mostrador',
      clientName: student.studentName,
      schoolName: student.schoolName,
      items: [
        {
          id: `item-liq-${student.id}`,
          productId: 'prod-liq',
          name: `Liquidación Paquete Graduación (${student.packageName})`,
          category: 'graduaciones',
          unitPrice: student.remainingAmount,
          quantity: 1,
          options: {},
          totalPrice: student.remainingAmount,
        },
      ],
      subtotal: student.remainingAmount,
      discount: 0,
      total: student.remainingAmount,
      paymentMethod,
      amountPaid: student.remainingAmount,
      change: 0,
      status: 'liquidado',
      notes: `Folio Alumno: ${student.folio} - Escuela: ${student.schoolName}`,
    };

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    onRecordLiquidationSale(restSale, updatedStudent);
    setSelectedStudentForLiquidation(null);
  };

  const handleMarkReady = (student: GraduationStudent) => {
    const updated: GraduationStudent = {
      ...student,
      deliveryStatus: 'listo',
    };
    onUpdateStudent(updated);
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <PackageCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">
                Entrega y Liquidación de Paquetes Fotográficos
              </h1>
              <p className="text-xs text-slate-500">
                Búsqueda rápida por folio o alumno, cobro del resto pendiente y registro de entrega
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Folio, alumno o escuela..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1 text-xs">
              {(['todos', 'pendiente', 'listo', 'entregado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-2 rounded-lg font-bold capitalize transition ${
                    filterStatus === st
                      ? 'bg-[#004C59] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Students Table / Cards Grid */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-600">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No se encontraron alumnos con ese criterio</p>
              <p className="text-xs text-slate-600 mt-1">Verifica el nombre, folio o filtro de estatus.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((student) => {
                const isPaidFull = student.remainingAmount === 0;
                return (
                  <div
                    key={student.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                  >
                    {/* Left: Student info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {student.studentName}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {student.folio}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            student.deliveryStatus === 'entregado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.deliveryStatus === 'listo'
                              ? 'bg-teal-100 text-[#004C59]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {student.deliveryStatus}
                        </span>
                      </div>

                      <p className="text-xs text-[#004C59] font-bold">
                        {student.schoolName} • {student.gradeGroup}
                      </p>

                      <p className="text-xs text-slate-600">
                        {student.packageName} ({student.totalPhotos})
                        {student.deliveryDate && (
                          <span className="text-emerald-700 font-semibold ml-2">
                            • Entregado el {student.deliveryDate}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Middle: Financial Status */}
                    <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">Total</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-800">
                          ${student.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">Anticipo</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-emerald-700">
                          ${student.depositAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] uppercase font-bold text-[#F97800] block">Resto</span>
                        <span className={`font-mono font-extrabold text-sm ${student.remainingAmount > 0 ? 'text-[#F97800]' : 'text-slate-400'}`}>
                          ${student.remainingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      {/* Ticket button */}
                      <button
                        type="button"
                        onClick={() => onOpenTicket(student)}
                        className="p-2 text-slate-600 hover:text-[#004C59] bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                        title="Ver / Reimprimir Comprobante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* If package is not ready yet, allow marking it ready */}
                      {student.deliveryStatus === 'pendiente' && (
                        <button
                          type="button"
                          onClick={() => handleMarkReady(student)}
                          className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-[#004C59] font-bold text-xs rounded-xl border border-teal-200 transition"
                        >
                          Marcar Listo
                        </button>
                      )}

                      {/* Liquidation / Deliver button */}
                      {student.deliveryStatus !== 'entregado' && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForLiquidation(student)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 ${
                            student.remainingAmount > 0
                              ? 'bg-[#F97800] hover:bg-[#e06c00] text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>
                            {student.remainingAmount > 0
                              ? `Cobrar Resto ($${student.remainingAmount}) y Entregar`
                              : 'Entregar Paquete'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* LIQUIDATION MODAL */}
      {selectedStudentForLiquidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#004C59]">Liquidación y Entrega de Paquete</h3>
                <span className="text-xs text-slate-500 font-mono">Folio: {selectedStudentForLiquidation.folio}</span>
              </div>
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                <PackageCheck className="w-5 h-5" />
              </span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <p><strong>Alumno:</strong> {selectedStudentForLiquidation.studentName}</p>
              <p><strong>Escuela:</strong> {selectedStudentForLiquidation.schoolName}</p>
              <p><strong>Paquete:</strong> {selectedStudentForLiquidation.packageName}</p>
            </div>

            {/* Rest to be paid */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Saldo por Cobrar:</span>
                <span className="text-[11px] text-amber-700">Importe de liquidación final</span>
              </div>
              <span className="text-2xl font-black text-[#F97800]">
                ${selectedStudentForLiquidation.remainingAmount.toFixed(2)}
              </span>
            </div>

            {/* Payment Method */}
            {selectedStudentForLiquidation.remainingAmount > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Método de Pago para Liquidación:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                  {(['efectivo', 'clip', 'mercadopago', 'transferencia'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg capitalize border transition ${
                        paymentMethod === m
                          ? 'bg-[#004C59] text-white border-[#004C59] font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForLiquidation(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLiquidation}
                className="flex-1 py-2.5 text-xs font-bold bg-[#004C59] hover:bg-[#003842] text-white rounded-xl shadow-md transition"
              >
                Confirmar y Marcar Entregado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
