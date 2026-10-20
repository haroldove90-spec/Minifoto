import React, { useState } from 'react';
import { X, Send, Phone, MessageSquare, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { GraduationStudent } from '../types';
import { logStudentWhatsApp } from '../services/storage';

interface WhatsAppModalProps {
  student: GraduationStudent;
  onClose: () => void;
  onLogSent?: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  student,
  onClose,
  onLogSent,
}) => {
  const [templateType, setTemplateType] = useState<'recordatorio' | 'vencimiento' | 'comprobante' | 'datos_bancarios'>('recordatorio');
  const [phone, setPhone] = useState(student.tutorWhatsapp || student.tutorPhone || student.contactPhone || '');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const formattedDueDate = student.nextDueDate 
    ? new Date(student.nextDueDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';

  const generateMessage = (): string => {
    switch (templateType) {
      case 'recordatorio':
        return `Buen día. Le recordamos que tiene un saldo pendiente de $${student.remainingAmount.toFixed(2)} por el paquete fotográfico escolar de su hijo(a) ${student.studentName}.

Fecha acordada de pago: ${formattedDueDate}.
Monto del plazo: $${(student.nextDueAmount || student.remainingAmount).toFixed(2)}.

Puede realizar su abono con nuestro personal o mediante transferencia bancaria Santander con la referencia:
📌 ${student.santanderReference}

¡Gracias por su confianza!
Mini Foto Estudio
Más de 55 años de tradición fotográfica.`;

      case 'vencimiento':
        return `Buen día. Hoy es la fecha acordada de pago del paquete fotográfico de su hijo(a) ${student.studentName}.

Saldo pendiente: $${student.remainingAmount.toFixed(2)}.
Referencia Santander: ${student.santanderReference}.

Si ya realizó su pago, por favor infórmenos para verificarlo.
¡Gracias por su atención!
Mini Foto Estudio
Más de 55 años de tradición fotográfica.`;

      case 'comprobante':
        return `¡Hola! Le enviamos el comprobante de pago de Mini Foto Estudio para el alumno(a) ${student.studentName}.

Escuela: ${student.schoolName} (${student.gradeGroup || 'General'}).
Total del paquete: $${student.totalAmount.toFixed(2)}.
Total abonado: $${student.depositAmount.toFixed(2)}.
Saldo pendiente: $${student.remainingAmount.toFixed(2)}.
Referencia Santander: ${student.santanderReference}.

¡Muchas gracias por su preferencia!
Mini Foto Estudio`;

      case 'datos_bancarios':
        return `Datos para transferencia bancaria - Mini Foto Estudio:

Banco: Santander México
Beneficiario: Mini Foto Estudio S.A. de C.V.
CLABE Interbancaria: 014180655012345678
Referencia Única obligatoria: ${student.santanderReference}
Alumno: ${student.studentName}
Importe a pagar: $${student.remainingAmount.toFixed(2)}

Favor de incluir la referencia ${student.santanderReference} en el concepto para acreditar su pago de inmediato.`;

      default:
        return '';
    }
  };

  const currentMessage = generateMessage() + (customNotes ? `\n\nNota: ${customNotes}` : '');

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const handleSendWhatsApp = () => {
    if (!cleanPhone) return;
    
    // Format for Mexico country code if 10 digits
    const targetPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(currentMessage)}`;
    
    // Log the message in student history
    logStudentWhatsApp(student.id, templateType, cleanPhone, currentMessage);
    if (onLogSent) onLogSent();

    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#25D366] text-white rounded-2xl shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Enviar Mensaje de WhatsApp</h3>
              <p className="text-xs text-[#ECB769] font-medium">Mini Foto Estudio • Cobranza y Recordatorios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#FFF3BC]/70 hover:text-white hover:bg-black/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Student summary banner */}
          <div className="p-3 bg-[#FCF9F2] rounded-2xl border border-[#ECB769]/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Alumno</span>
              <p className="text-sm font-black text-[#4E2B01]">{student.studentName}</p>
              <span className="text-[11px] text-slate-600 font-medium">
                {student.schoolName} • {student.gradeGroup}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo Actual</span>
              <p className="text-base font-black text-amber-600">${student.remainingAmount.toFixed(2)}</p>
              <span className="text-[10px] font-mono font-bold bg-[#ECB769]/20 text-[#4E2B01] px-2 py-0.5 rounded-md">
                Ref: {student.santanderReference}
              </span>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Seleccione la plantilla del mensaje:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('recordatorio')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  templateType === 'recordatorio'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">🔔 Recordatorio</div>
                <div className="text-[10px] opacity-80">3 días antes del plazo</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('vencimiento')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  templateType === 'vencimiento'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">⚠️ Aviso de Vencimiento</div>
                <div className="text-[10px] opacity-80">El día del plazo acordado</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('comprobante')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  templateType === 'comprobante'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">🧾 Comprobante / Saldo</div>
                <div className="text-[10px] opacity-80">Confirmación de abono</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('datos_bancarios')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  templateType === 'datos_bancarios'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#4E2B01] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">🏛️ Datos Santander SPEI</div>
                <div className="text-[10px] opacity-80">CLABE y Referencia</div>
              </button>
            </div>
          </div>

          {/* Phone input */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Número de WhatsApp del Padre / Tutor (10 dígitos):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+52</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 5512345678"
                className="w-full pl-11 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
            </div>
            {student.tutorName && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                Tutor registrado: <strong>{student.tutorName}</strong>
              </span>
            )}
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Previsualización del mensaje:</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-[#4E2B01] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
            <div className="p-3.5 bg-[#EFEAE2] rounded-2xl border border-slate-300 shadow-inner">
              <div className="bg-[#E7FFDB] p-3 rounded-2xl rounded-tr-none shadow-xs text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap font-sans border border-[#D0EBC2]">
                {currentMessage}
                <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                  {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nota adicional personalizada (opcional):
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ej. Estaremos en la escuela mañana de 8:00 a 11:00 am"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
            />
          </div>

          {/* Consent warning */}
          {student.consentWhatsapp === false && (
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>El tutor tiene desactivada la recepción automática de mensajes. Solo envíe con previa autorización.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!cleanPhone}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
