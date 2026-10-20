import React, { useState } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  DollarSign, 
  Phone, 
  MessageSquare, 
  Landmark, 
  CreditCard, 
  Clock, 
  Copy, 
  CheckCircle, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { GraduationStudent, PaymentRecord } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { ScheduleDueDateModal } from './ScheduleDueDateModal';
import { PaymentRegisterModal } from './PaymentRegisterModal';

interface StudentDetailModalProps {
  student: GraduationStudent;
  terminalId: string;
  operatorName: string;
  onClose: () => void;
  onUpdated: () => void;
  onOpenTicket: (payment: PaymentRecord, student: GraduationStudent) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  terminalId,
  operatorName,
  onClose,
  onUpdated,
  onOpenTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'generales' | 'pagos' | 'seguimiento' | 'referencia'>('pagos');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const isLiquidated = student.remainingAmount === 0;

  const handleCopySantander = () => {
    navigator.clipboard.writeText(student.santanderReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handlePaymentSuccess = (payment: PaymentRecord, updatedStudent: GraduationStudent) => {
    setShowPaymentModal(false);
    onUpdated();
    onOpenTicket(payment, updatedStudent);
  };

  const formattedDueDate = student.nextDueDate 
    ? new Date(student.nextDueDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'No programado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header / Student Identity (matches Mockup 9) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#4E2B01] to-[#381e01] text-[#FFF3BC] flex items-start justify-between border-b border-[#ECB769]/30">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {/* Student Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFF3BC] border-2 border-[#ECB769] overflow-hidden flex items-center justify-center text-[#4E2B01] font-black shrink-0 shadow-md">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.studentName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#4E2B01]/70" />
              )}
            </div>

            {/* Student Main Info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">{student.studentName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isLiquidated
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#ECB769] text-[#4E2B01]'
                  }`}
                >
                  {isLiquidated ? 'LIQUIDADO' : 'PENDIENTE'}
                </span>
              </div>
              <div className="text-xs text-[#FFF3BC]/90 font-medium mt-0.5 space-y-0.5">
                <p>
                  <strong>Escuela:</strong> {student.schoolName}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-[#ECB769]">
                  <span><strong>Grado:</strong> {student.grade || '1°'}</span>
                  <span><strong>Grupo:</strong> {student.group || 'A'}</span>
                  <span><strong>Matrícula:</strong> {student.matricula || student.folio}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#FFF3BC]/70 hover:text-white hover:bg-black/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs navigation (matches Mockup 9) */}
        <div className="flex items-center bg-[#FCF9F2] px-3 sm:px-6 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('generales')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'generales'
                ? 'border-[#4E2B01] text-[#4E2B01] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Datos Generales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pagos'
                ? 'border-[#4E2B01] text-[#4E2B01] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pagos y Abonos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seguimiento')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'seguimiento'
                ? 'border-[#4E2B01] text-[#4E2B01] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Seguimiento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('referencia')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'referencia'
                ? 'border-[#4E2B01] text-[#4E2B01] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Referencia Santander
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: DATOS GENERALES */}
          {activeTab === 'generales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Información Escolar</span>
                  <p><strong>Escuela:</strong> {student.schoolName}</p>
                  <p><strong>Grado y Grupo:</strong> {student.gradeGroup || `${student.grade} ${student.group}`}</p>
                  <p><strong>Matrícula:</strong> {student.matricula || 'Sin matrícula'}</p>
                  <p><strong>Folio Único:</strong> <span className="font-mono font-bold text-[#4E2B01]">{student.folio}</span></p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Padre o Tutor</span>
                  <p><strong>Nombre:</strong> {student.tutorName || 'No registrado'}</p>
                  <p><strong>Teléfono:</strong> {student.tutorPhone || student.contactPhone || 'No registrado'}</p>
                  <p><strong>WhatsApp:</strong> {student.tutorWhatsapp || 'No registrado'}</p>
                  <p><strong>Consentimiento WhatsApp:</strong> {student.consentWhatsapp ? '✅ Activo' : '❌ Desactivado'}</p>
                </div>
              </div>

              <div className="p-4 bg-[#FCF9F2] rounded-2xl border border-[#ECB769]/50 space-y-2">
                <span className="text-[10px] font-bold text-[#4E2B01] uppercase">Paquete y Finanzas</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Paquete</span>
                    <span className="font-black text-[#4E2B01] text-xs truncate block">{student.packageName}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Costo Total</span>
                    <span className="font-black text-slate-800 text-sm">${student.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Total Abonado</span>
                    <span className="font-black text-emerald-700 text-sm">${student.depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold block">Saldo Pendiente</span>
                    <span className="font-black text-amber-600 text-base">${student.remainingAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAGOS Y ABONOS (matches Mockup 9) */}
          {activeTab === 'pagos' && (
            <div className="space-y-4">
              {/* Table of payments */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-right">Saldo</th>
                      <th className="py-2.5 px-3">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {(student.paymentHistory || []).length > 0 ? (
                      student.paymentHistory!.map((pay, idx) => (
                        <tr key={pay.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 font-medium text-slate-600">{pay.date}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{pay.concept}</td>
                          <td className="py-2 px-3 text-right font-black text-emerald-700">${pay.amount.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">${pay.balanceAfter.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize inline-flex items-center gap-1 ${
                                pay.status === 'pendiente_confirmacion'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {pay.method}
                              {pay.status === 'pendiente_confirmacion' && ' (Pendiente)'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Aún no hay abonos registrados para este alumno.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Next due date banner (matches Mockup 9) */}
              <div className="p-3.5 bg-[#FCF9F2] border border-[#ECB769]/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Próximo plazo acordado</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="w-4 h-4 text-[#4E2B01]" />
                    <span className="font-bold text-slate-800 text-xs">{formattedDueDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Monto acordado</span>
                  <span className="text-sm font-black text-[#4E2B01]">
                    ${(student.nextDueAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEGUIMIENTO */}
          {activeTab === 'seguimiento' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-black text-[#4E2B01] text-xs mb-1">Compromiso y Fechas de Vencimiento</h4>
                <p className="text-slate-600 text-[11px]">
                  Fecha programada: <strong>{formattedDueDate}</strong> por un monto de{' '}
                  <strong>${(student.nextDueAmount || 0).toFixed(2)}</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-black text-slate-700 text-xs mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  Bitácora de Mensajes de WhatsApp Enviados
                </h4>
                <div className="space-y-2">
                  {(student.whatsappLogs || []).length > 0 ? (
                    student.whatsappLogs!.map((log, i) => (
                      <div key={log.id || i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-700 uppercase">{log.type}</span>
                          <span className="text-slate-400 font-mono">{log.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{log.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                      No se han enviado recordatorios por WhatsApp a este alumno todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REFERENCIA SANTANDER */}
          {activeTab === 'referencia' && (
            <div className="space-y-4">
              {/* Santander Card */}
              <div className="p-5 bg-gradient-to-br from-[#EC0000] to-[#B30000] text-white rounded-3xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-white" />
                    <span className="font-black tracking-wider text-sm">Santander</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                    Referencia Única SPEI
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 block">Referencia del Alumno</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-mono font-black tracking-widest bg-black/20 px-3 py-1 rounded-xl">
                      {student.santanderReference}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySantander}
                      className="px-3 py-1.5 bg-white text-[#EC0000] font-black rounded-xl hover:bg-white/90 transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedRef ? 'Copiada' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="opacity-75 block text-[10px]">Beneficiario</span>
                    <span className="font-bold">Mini Foto Estudio</span>
                  </div>
                  <div>
                    <span className="opacity-75 block text-[10px]">CLABE Interbancaria</span>
                    <span className="font-mono font-bold">014180655012345678</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Instrucciones de Pago por Transferencia Santander SPEI:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-amber-800">
                  <li>Ingrese a su banca móvil o portal de cualquier banco mexicano.</li>
                  <li>Seleccione transferir a CLABE <strong>014180655012345678</strong> (Banco Santander).</li>
                  <li>En el campo <strong>Concepto / Referencia</strong> escriba exactamente: <strong>{student.santanderReference}</strong>.</li>
                  <li>Al confirmarse en el banco, el saldo se acreditará en el sistema en oficinas.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer (matches Mockup 9) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Button 1: Registrar Pago */}
            <button
              type="button"
              disabled={isLiquidated}
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Registrar pago
            </button>

            {/* Button 2: Programar Plazo */}
            <button
              type="button"
              disabled={isLiquidated}
              onClick={() => setShowScheduleModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#ECB769]" />
              Programar plazo
            </button>

            {/* Button 3: Enviar WhatsApp */}
            <button
              type="button"
              onClick={() => setShowWhatsApp(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {showWhatsApp && (
        <WhatsAppModal
          student={student}
          onClose={() => setShowWhatsApp(false)}
          onLogSent={onUpdated}
        />
      )}

      {showScheduleModal && (
        <ScheduleDueDateModal
          student={student}
          operatorName={operatorName}
          onClose={() => setShowScheduleModal(false)}
          onSaved={onUpdated}
        />
      )}

      {showPaymentModal && (
        <PaymentRegisterModal
          student={student}
          terminalId={terminalId}
          operatorName={operatorName}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
