import React, { useState, useEffect } from 'react';
import { Sale, GraduationStudent, BrandConfig } from '../types';
import { Printer, Share2, X, CheckCircle, Copy, Check } from 'lucide-react';
import { printTicketElement } from '../services/printService';

interface TicketModalProps {
  sale?: Sale | null;
  studentTicket?: GraduationStudent | null;
  brand: BrandConfig;
  onClose: () => void;
  autoPrint?: boolean;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  sale,
  studentTicket,
  brand,
  onClose,
  autoPrint = false,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if ((sale || studentTicket) && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [sale, studentTicket, autoPrint]);

  if (!sale && !studentTicket) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    printTicketElement('printable-ticket');
    setTimeout(() => {
      setIsPrinting(false);
    }, 2000);
  };

  const getPlainText = () => {
    if (studentTicket) {
      return (
        `${brand.businessName}\n` +
        `COMPROBANTE DE PAQUETE ESCOLAR\n` +
        `--------------------------------\n` +
        `Folio: ${studentTicket.folio}\n` +
        `Fecha: ${studentTicket.createdAt}\n` +
        `Alumno: ${studentTicket.studentName}\n` +
        `Escuela: ${studentTicket.schoolName}\n` +
        `Grado/Grupo: ${studentTicket.gradeGroup}\n` +
        `Paquete: ${studentTicket.packageName} (${studentTicket.totalPhotos})\n` +
        `--------------------------------\n` +
        `Precio Total: $${studentTicket.totalAmount.toFixed(2)}\n` +
        `Anticipo Pagado: $${studentTicket.depositAmount.toFixed(2)}\n` +
        `Resto Pendiente: $${studentTicket.remainingAmount.toFixed(2)}\n` +
        `Estatus: ${studentTicket.deliveryStatus.toUpperCase()}\n` +
        `--------------------------------\n` +
        `${brand.ticketFooter}`
      );
    }
    if (sale) {
      const itemsList = sale.items
        .map(
          (it) =>
            `${it.quantity}x ${it.name} - $${it.totalPrice.toFixed(2)}` +
            (it.options.retoque ? ' (+Retoque)' : '') +
            (it.options.autoAdherible ? ' (+Autoadherible)' : '')
        )
        .join('\n');

      return (
        `${brand.businessName}\n` +
        `TICKET DE VENTA #${sale.folio}\n` +
        `--------------------------------\n` +
        `Fecha: ${sale.date}\n` +
        `Atendió: ${sale.operatorName}\n` +
        (sale.clientName ? `Cliente: ${sale.clientName}\n` : '') +
        (sale.schoolName ? `Escuela: ${sale.schoolName}\n` : '') +
        `--------------------------------\n` +
        `${itemsList}\n` +
        `--------------------------------\n` +
        `TOTAL: $${sale.total.toFixed(2)}\n` +
        `Método: ${sale.paymentMethod.toUpperCase()}\n` +
        (sale.change > 0 ? `Cambio: $${sale.change.toFixed(2)}\n` : '') +
        `--------------------------------\n` +
        `${brand.ticketFooter}`
      );
    }
    return '';
  };

  const handleShareWhatsApp = () => {
    const text = getPlainText();
    const encoded = encodeURIComponent(text);
    const phone = studentTicket?.contactPhone || sale?.clientPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/52${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Top actions (Hidden in print) */}
        <div className="print:hidden bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Ticket de Venta Generado</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1"
              title="Copiar texto del ticket"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Cerrar ticket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status banner when print dialog was dispatched */}
        <div className="print:hidden bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 font-medium">
          <span className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            {isPrinting ? 'Enviando a la impresora...' : 'Listo para imprimir en ticketera térmica'}
          </span>
          <button
            onClick={handlePrint}
            className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
          >
            Reintentar impresión
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div className="p-6 bg-white font-mono text-slate-900 text-xs sm:text-sm print:p-2" id="printable-ticket">
          {/* Unencapsulated Full-Size Logo */}
          <div className="flex flex-col items-center mb-4 text-center">
            <img
              src={brand.logoUrl || 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png'}
              alt={brand.businessName}
              className="h-14 sm:h-16 w-auto max-w-[220px] object-contain mb-2 print:max-h-16"
            />
            <h2 className="font-sans font-bold text-base sm:text-lg text-slate-800 tracking-tight leading-none mt-1">
              {brand.businessName}
            </h2>
            <p className="text-[11px] text-slate-600 mt-1">{brand.address}</p>
            <p className="text-[11px] text-slate-600">Tel: {brand.phone}</p>
          </div>

          <div className="border-t border-dashed border-slate-400 my-2.5"></div>

          {/* Student Graduation / Mobile Seller Receipt */}
          {studentTicket && (
            <div className="space-y-2">
              <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
                COMPROBANTE DE PAQUETE ESCOLAR
              </div>
              
              <div className="grid grid-cols-2 text-xs gap-y-1 pt-1">
                <span className="text-slate-500 font-bold">Folio:</span>
                <span className="font-bold text-right text-slate-900">{studentTicket.folio}</span>

                <span className="text-slate-500">Fecha:</span>
                <span className="text-right text-slate-700">{studentTicket.createdAt}</span>

                <span className="text-slate-500 font-bold">Alumno:</span>
                <span className="font-bold text-right text-slate-900 truncate pl-1">
                  {studentTicket.studentName}
                </span>

                <span className="text-slate-500 font-bold">Escuela:</span>
                <span className="font-bold text-right text-[#4E2B01] truncate pl-1">
                  {studentTicket.schoolName}
                </span>

                <span className="text-slate-500">Grado/Grupo:</span>
                <span className="text-right text-slate-800">{studentTicket.gradeGroup}</span>

                <span className="text-slate-500 font-bold">Total Fotos:</span>
                <span className="font-bold text-right text-slate-900">
                  {studentTicket.totalPhotos}
                </span>

                <span className="text-slate-500">Paquete:</span>
                <span className="text-right text-slate-700 truncate pl-1 text-[11px]">
                  {studentTicket.packageName}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Price, Deposit and Remaining calculation */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Precio Total:</span>
                  <span className="font-bold text-slate-900">${studentTicket.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span className="font-bold">Anticipo Pagado:</span>
                  <span className="font-bold">-${studentTicket.depositAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between text-sm font-extrabold text-[#4E2B01]">
                  <span>Resto por Liquidar:</span>
                  <span>${studentTicket.remainingAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex justify-between pt-1">
                <span>Estatus de entrega:</span>
                <span className="font-bold uppercase text-[#4E2B01]">
                  {studentTicket.deliveryStatus}
                </span>
              </div>
            </div>
          )}

          {/* Standard Studio POS Ticket */}
          {sale && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Folio:</span>
                <span className="font-bold">#{sale.folio}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Fecha:</span>
                <span>{sale.date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Atendió:</span>
                <span>{sale.operatorName}</span>
              </div>
              {sale.clientName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold">{sale.clientName}</span>
                </div>
              )}
              {sale.schoolName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Escuela:</span>
                  <span className="font-bold text-[#4E2B01]">{sale.schoolName}</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Items List */}
              <div className="space-y-2 my-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex justify-between">
                  <span>Cant / Concepto</span>
                  <span>Importe</span>
                </div>
                {sale.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 text-xs">
                    <div className="flex justify-between items-start font-medium">
                      <span className="pr-2 leading-tight">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="shrink-0 font-bold">${item.totalPrice.toFixed(2)}</span>
                    </div>

                    {/* Extras: Retoque o Autoadherible */}
                    {(item.options.retoque || item.options.autoAdherible) && (
                      <div className="text-[11px] text-[#4E2B01] pl-3 flex flex-wrap gap-x-2">
                        {item.options.retoque && <span>+ Retoque (+${item.options.retoquePrice})</span>}
                        {item.options.autoAdherible && <span>+ Autoadherible (+${item.options.autoAdheriblePrice})</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>${sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento:</span>
                    <span>-${sale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#4E2B01] border-t border-slate-300 pt-1">
                  <span>TOTAL:</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>Método de Pago:</span>
                  <span className="font-bold uppercase text-slate-900">{sale.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Recibido:</span>
                  <span>${sale.amountPaid.toFixed(2)}</span>
                </div>
                {sale.change > 0 && (
                  <div className="flex justify-between text-[#ECB769] font-bold">
                    <span>Cambio entregado:</span>
                    <span>${sale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-dashed border-slate-400 my-3"></div>

          {/* Barcode simulation */}
          <div className="flex flex-col items-center justify-center my-2 space-y-1">
            <div className="h-9 w-44 bg-repeating-linear-to-r from-black via-black via-2px to-transparent to-4px"></div>
            <span className="text-[10px] tracking-widest text-slate-500">
              *{studentTicket ? studentTicket.folio : sale?.folio}*
            </span>
          </div>

          <p className="text-center text-[10px] text-slate-500 mt-2 leading-relaxed">
            {brand.ticketFooter}
          </p>
        </div>

        {/* Print & Action Footer (Hidden in print) */}
        <div className="print:hidden bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handlePrint}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#4E2B01] hover:bg-[#381e01] active:scale-95 text-[#FFF3BC] font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#ECB769]" />
            <span>{isPrinting ? 'Imprimiendo...' : 'Mandar a Imprimir Ticket'}</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
