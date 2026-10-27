import React, { useState, useEffect } from 'react';
import { Sale, GraduationStudent, BrandConfig, PaymentRecord } from '../types';
import { Printer, Share2, X, CheckCircle, Copy, Check, Receipt, QrCode } from 'lucide-react';
import { printTicketElement } from '../services/printService';
import { BarcodeSVG, QRCodeSVG, TicketScannerCodes } from './BarcodeAndQR';

interface TicketModalProps {
  sale?: Sale | null;
  studentTicket?: GraduationStudent | null;
  paymentRecord?: PaymentRecord | null;
  terminalId?: string;
  operatorName?: string;
  brand: BrandConfig;
  onClose: () => void;
  autoPrint?: boolean;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  sale,
  studentTicket,
  paymentRecord,
  terminalId = 'POS-01',
  operatorName = 'Cobrador',
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
        .map((it) => {
          const sp = it.options.photoSpecs;
          let extraInfo = '';
          if (it.options.retoque) extraInfo += ' (+Retoque)';
          if (it.options.autoAdherible) extraInfo += ' (+Autoadherible)';
          if (sp?.childName) extraInfo += ` [Niño: ${sp.childName}, Mod: ${sp.caritaModel || 'N/A'}]`;
          if (sp?.ampliacionFormat) extraInfo += ` [Formato: ${sp.ampliacionFormat}, Fotos: ${sp.photoCount || it.quantity}]`;
          if (sp?.cambioFondoSize) extraInfo += ` [Tamaño: ${sp.cambioFondoSize}${sp.customText ? `, Texto: ${sp.customText}` : ''}]`;
          return `${it.quantity}x ${it.name} - $${it.totalPrice.toFixed(2)}${extraInfo}`;
        })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white animate-in fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#4E2B01] flex flex-col max-h-[86vh] sm:max-h-[82vh] my-auto print:max-h-none print:border-none print:shadow-none print:max-w-none print:w-full print:overflow-visible">
        
        {/* Top actions (Hidden in print) */}
        <div className="print:hidden bg-[#4E2B01] text-[#FFF3BC] px-4 py-3 border-b-2 border-[#ECB769] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#ECB769]" />
            <span className="font-black text-sm text-[#FFF3BC]">Ticket de Venta Generado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-lg text-[#FFF3BC]/80 hover:text-[#FFF3BC] hover:bg-white/10 transition text-xs flex items-center gap-1 cursor-pointer"
              title="Copiar texto del ticket"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#ECB769]" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#FFF3BC]/80 hover:text-[#FFF3BC] hover:bg-white/10 transition cursor-pointer"
              aria-label="Cerrar ticket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status banner when print dialog was dispatched */}
        <div className="print:hidden bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 font-medium shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <Printer className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            {isPrinting ? 'Enviando a la impresora...' : 'Listo para imprimir en ticketera térmica'}
          </span>
          <button
            onClick={handlePrint}
            className="text-[11px] font-black text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
          >
            Reintentar
          </button>
        </div>

        {/* Internal Scrollable Thermal Ticket Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-slate-100/70 print:p-0 print:overflow-visible print:bg-white">
          <div className="p-4 sm:p-5 bg-white font-mono text-slate-900 text-xs shadow-xs rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-2 max-w-sm mx-auto" id="printable-ticket">
            {/* Unencapsulated Full-Size Logo */}
            <div className="flex flex-col items-center mb-3 text-center">
              <img
                src={brand.logoUrl || 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png'}
                alt={brand.businessName}
                className="h-10 sm:h-12 w-auto max-w-[180px] object-contain mb-1.5 print:max-h-16"
              />
              <h2 className="font-sans font-black text-base text-slate-800 tracking-tight leading-none mt-1">
                {brand.businessName}
              </h2>
              <p className="text-[11px] text-slate-600 mt-1">{brand.address}</p>
              <p className="text-[11px] text-slate-600">Tel: {brand.phone}</p>
            </div>

          <div className="border-t border-dashed border-slate-400 my-2.5"></div>

          {/* Student Graduation / Mobile Seller Receipt (matches Mockup 10) */}
          {studentTicket && (
            <div className="space-y-2">
              <div className="text-center font-bold text-xs uppercase bg-[#4E2B01] text-[#FFF3BC] py-1.5 rounded-lg tracking-wider">
                COMPROBANTE DE PAGO
              </div>
              
              <div className="grid grid-cols-2 text-xs gap-y-1.5 pt-1">
                <span className="text-slate-500 font-bold">Folio:</span>
                <span className="font-bold text-right text-slate-900 font-mono">{studentTicket.folio}</span>

                <span className="text-slate-500">Fecha:</span>
                <span className="text-right text-slate-700 font-medium">
                  {paymentRecord?.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                </span>

                <span className="text-slate-500 font-bold">Terminal:</span>
                <span className="font-black text-right text-[#4E2B01] font-mono">{terminalId}</span>

                <span className="text-slate-500 font-bold">Cobrador:</span>
                <span className="font-bold text-right text-slate-900 uppercase truncate pl-1">
                  {operatorName}
                </span>

                <span className="text-slate-500 font-bold">Escuela:</span>
                <span className="font-bold text-right text-[#4E2B01] truncate pl-1">
                  {studentTicket.schoolName}
                </span>

                <span className="text-slate-500">Alumno:</span>
                <span className="font-black text-right text-slate-900 truncate pl-1">
                  {studentTicket.studentName}
                </span>

                <span className="text-slate-500">Concepto:</span>
                <span className="text-right text-slate-700 truncate pl-1 text-[11px]">
                  {studentTicket.packageName || 'Paquete fotográfico'}
                </span>

                {studentTicket.santanderReference && (
                  <>
                    <span className="text-slate-500 font-bold">Ref. Santander:</span>
                    <span className="font-bold text-right text-slate-800 font-mono text-[11px]">
                      {studentTicket.santanderReference}
                    </span>
                  </>
                )}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2.5"></div>

              {/* Price, Payment and Remaining calculation (matches Mockup 10) */}
              <div className="space-y-1.5 bg-[#FCF9F2] p-3 rounded-xl border border-[#ECB769]/50">
                <div className="flex justify-between text-xs text-slate-800">
                  <span className="font-bold">Pago recibido:</span>
                  <span className="font-black text-base text-emerald-700">
                    ${(paymentRecord?.amount ?? studentTicket.depositAmount).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between text-xs text-slate-800">
                  <span className="font-bold">Saldo pendiente:</span>
                  <span className="font-black text-base text-amber-700">
                    ${studentTicket.remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Standard Studio POS Ticket */}
          {sale && (
            <div className="space-y-2">
              <div className="text-center font-bold text-xs uppercase bg-[#4E2B01] text-[#FFF3BC] py-1.5 rounded-lg tracking-wider mb-2 flex items-center justify-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#ECB769]" />
                <span>TICKET DE VENTA Y COBRO OFICIAL</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Folio de Venta:</span>
                <span className="font-bold text-[#4E2B01] font-mono text-sm">#{sale.folio}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Fecha / Hora:</span>
                <span className="font-medium text-slate-700">{sale.date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Atendió:</span>
                <span>{sale.operatorName}</span>
              </div>
              {sale.clientName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Cliente:</span>
                  <span className="font-bold text-slate-800">{sale.clientName}</span>
                </div>
              )}
              {sale.clientPhone && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-medium text-slate-700">{sale.clientPhone}</span>
                </div>
              )}
              {sale.clientEmail && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-700 break-all">{sale.clientEmail}</span>
                </div>
              )}
              {sale.schoolName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Escuela:</span>
                  <span className="font-bold text-[#4E2B01]">{sale.schoolName}</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Items List with detailed studio photo options */}
              <div className="space-y-2.5 my-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex justify-between">
                  <span>Cant / Concepto</span>
                  <span>Importe</span>
                </div>
                {sale.items.map((item, idx) => {
                  const specs = item.options.photoSpecs;
                  return (
                    <div key={idx} className="space-y-1 text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start font-bold text-slate-900">
                        <span className="pr-2 leading-tight">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="shrink-0 font-mono text-[#4E2B01]">${item.totalPrice.toFixed(2)}</span>
                      </div>

                      {/* Studio photo specifications checklist */}
                      <div className="text-[10px] text-slate-600 pl-1 space-y-1">
                        
                        {/* 02 CARITAS SPECS */}
                        {(specs?.childName || specs?.formType === 'caritas') && (
                          <div className="bg-amber-50/90 border border-[#ECB769]/60 p-1.5 rounded-lg space-y-0.5 text-[#4E2B01]">
                            <div className="font-black text-[11px] text-[#4E2B01] flex items-center justify-between">
                              <span>★ 02 CARITAS</span>
                              <span className="text-[10px] text-slate-600 font-mono">16x20</span>
                            </div>
                            {specs?.childName && (
                              <div><strong>Nombre del niño:</strong> {specs.childName}</div>
                            )}
                            {specs?.caritaModel && (
                              <div><strong>Modelo:</strong> {specs.caritaModel}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {specs?.promo8Plus8x10 && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 font-bold rounded">
                                  ✓ Promoción 8 + 8 x 10
                                </span>
                              )}
                              {specs?.orderReferenceTicket && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-bold rounded">
                                  ✓ Orden con ref. y ticket
                                </span>
                              )}
                              {specs?.linkPhotos && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 font-bold rounded">
                                  ✓ Vincular fotografías
                                </span>
                              )}
                              {specs?.sendToLab && (
                                <span className="px-1.5 py-0.2 bg-orange-100 text-orange-900 font-bold rounded">
                                  ✓ Enviar al laboratorio
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 03 AMPLIACIONES SPECS */}
                        {(specs?.ampliacionFormat || specs?.formType === 'ampliaciones') && (
                          <div className="bg-lime-50/90 border border-lime-300 p-1.5 rounded-lg space-y-0.5 text-lime-950">
                            <div className="font-black text-[11px] text-lime-900">
                              ★ 03 AMPLIACIONES
                            </div>
                            {specs?.ampliacionFormat && (
                              <div><strong>Formato seleccionado:</strong> {specs.ampliacionFormat}</div>
                            )}
                            <div><strong>Cantidad de fotografías:</strong> {specs?.photoCount || item.quantity}</div>
                          </div>
                        )}

                        {/* 04 CAMBIOS DE FONDO SPECS */}
                        {(specs?.cambioFondoSize || specs?.formType === 'cambios_fondo' || specs?.cambioFondo) && (
                          <div className="bg-sky-50/90 border border-sky-300 p-1.5 rounded-lg space-y-0.5 text-sky-950">
                            <div className="font-black text-[11px] text-sky-900 flex items-center justify-between">
                              <span>★ 04 CAMBIOS DE FONDO</span>
                              {specs?.cambioFondoSize && (
                                <span className="font-bold text-[10px] bg-sky-200 px-1 rounded">{specs.cambioFondoSize}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {specs?.cambioFondo && (
                                <span className="px-1.5 py-0.2 bg-sky-100 text-sky-900 font-bold rounded">
                                  ✓ Cambio de fondo
                                </span>
                              )}
                              {specs?.cambioVestimenta && (
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-900 font-bold rounded">
                                  ✓ Cambio de vestimenta
                                </span>
                              )}
                              {specs?.agregarTextoPersonalizado && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded">
                                  ✓ Agregar texto personalizado
                                </span>
                              )}
                            </div>
                            {specs?.customText && (
                              <div><strong>Texto personalizado:</strong> {specs.customText}</div>
                            )}
                            {specs?.editionNotes && (
                              <div className="text-[10px] text-slate-700 bg-white/80 p-1 rounded border border-sky-200">
                                <strong>Obs. edición/fondo/vestimenta:</strong> {specs.editionNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* General Studio Extras (Retoque, Autoadherible, etc.) */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(item.options.retoque || specs?.retoque) && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-[#4E2B01] font-bold rounded">
                              ✓ Retoque profesional {item.options.retoquePrice ? `(+$${item.options.retoquePrice})` : ''}
                            </span>
                          )}
                          {(item.options.autoAdherible || specs?.autoAdherible) && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-[#4E2B01] font-bold rounded">
                              ✓ Autoadherible {item.options.autoAdheriblePrice ? `(+$${item.options.autoAdheriblePrice})` : ''}
                            </span>
                          )}
                          {specs?.aColor && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-bold rounded">
                              ✓ A color
                            </span>
                          )}
                          {specs?.blancoNegro && (
                            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 font-bold rounded">
                              ✓ Blanco y negro
                            </span>
                          )}
                          {specs?.envioEmail && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 font-bold rounded">
                              ✓ Envío por correo
                            </span>
                          )}
                          {specs?.sacoCorbata && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 font-bold rounded">
                              ✓ Saco y corbata
                            </span>
                          )}
                          {specs?.blazerMascada && (
                            <span className="px-1.5 py-0.2 bg-pink-100 text-pink-900 font-bold rounded">
                              ✓ Blazer y mascada
                            </span>
                          )}
                          {specs?.cambioCamisa && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded">
                              ✓ Solo cambio de camisa
                            </span>
                          )}
                        </div>

                        {/* Vestimenta & Observaciones */}
                        {specs?.colorVestimenta && (
                          <div className="text-[10px] text-slate-700">
                            <strong>Color vestimenta:</strong> {specs.colorVestimenta}
                          </div>
                        )}
                        {(specs?.observacionesEditor || item.options.notes) && !specs?.editionNotes && (
                          <div className="text-[10px] text-[#4E2B01] bg-amber-50 p-1 rounded border border-amber-200 mt-1">
                            <strong>Obs. Editor:</strong> {specs?.observacionesEditor || item.options.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

          {/* Genuine 1D Barcode & 2D QR Code for Scanner Guns */}
          <div className="flex flex-col items-center justify-center my-2 space-y-2">
            {studentTicket ? (
              <div className="flex flex-col items-center w-full">
                <BarcodeSVG value={studentTicket.folio} width={220} height={50} />
                <div className="mt-2">
                  <QRCodeSVG
                    data={`MINIFOTO:${studentTicket.folio}:ALUMNO:${studentTicket.studentName}:ESCUELA:${studentTicket.schoolName}:RESTO:$${studentTicket.remainingAmount}`}
                    size={110}
                    label="Escanear Comprobante"
                  />
                </div>
                <p className="font-bold text-xs text-slate-800 mt-2 font-sans text-center">
                  ¡Gracias por su confianza!
                </p>
              </div>
            ) : sale ? (
              <div className="flex flex-col items-center w-full">
                {/* 1D Laser Barcode */}
                <BarcodeSVG value={sale.folio} width={240} height={52} />
                <span className="text-[9px] text-slate-500 font-mono tracking-wider -mt-0.5">
                  CÓDIGO DE BARRAS OFICIAL
                </span>

                {/* 2D QR Code with all sale, client and product specs */}
                <div className="mt-2.5">
                  <QRCodeSVG
                    data={JSON.stringify({
                      folio: sale.folio,
                      fecha: sale.date,
                      cliente: sale.clientName || 'Cliente Mostrador',
                      tel: sale.clientPhone || '',
                      email: sale.clientEmail || '',
                      total: sale.total,
                      articulos: sale.items.map(i => ({
                        n: i.name,
                        q: i.quantity,
                        p: i.totalPrice,
                        r: i.options.retoque || i.options.photoSpecs?.retoque ? 1 : 0,
                        c: i.options.photoSpecs?.aColor ? 'Color' : i.options.photoSpecs?.blancoNegro ? 'BN' : '',
                        v: i.options.photoSpecs?.colorVestimenta || '',
                        obs: i.options.photoSpecs?.observacionesEditor || '',
                      })),
                    })}
                    size={115}
                    label="QR Completo de Venta"
                  />
                </div>
                <span className="text-[9px] text-slate-400 text-center max-w-[220px] mt-0.5">
                  Lectura directa con escáner de código de barras o cámara QR
                </span>
              </div>
            ) : null}
          </div>

          <p className="text-center text-[10px] text-slate-500 mt-2 leading-relaxed">
            {brand.ticketFooter}
          </p>
        </div>
      </div>

      {/* Print & Action Footer (Fixed at the bottom, ALWAYS visible on tablets & PCs) */}
      <div className="print:hidden bg-white p-3 sm:p-4 border-t-2 border-[#ECB769]/60 flex flex-col sm:flex-row gap-2 shrink-0">
        <button
          onClick={handlePrint}
          type="button"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#4E2B01] hover:bg-[#202020] active:scale-95 text-[#FFF3BC] font-black text-xs sm:text-sm rounded-xl shadow-md border-2 border-[#ECB769] transition cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#ECB769]" />
          <span>{isPrinting ? 'Imprimiendo...' : 'Mandar a Imprimir (80mm)'}</span>
        </button>
        <button
          onClick={handleShareWhatsApp}
          type="button"
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
        <button
          onClick={onClose}
          type="button"
          className="px-3 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer text-center"
        >
          Cerrar
        </button>
      </div>
      </div>
    </div>
  );
};
