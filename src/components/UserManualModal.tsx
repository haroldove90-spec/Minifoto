import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Store, 
  Smartphone, 
  FlaskConical, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Tag, 
  Barcode, 
  Camera, 
  DollarSign, 
  Layers, 
  GraduationCap, 
  Users, 
  Sparkles,
  ChevronRight,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Role } from '../types';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role | 'all';
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'all',
}) => {
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>(initialRole);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-[#1e1e1e] border-2 border-[#ECB769]/50 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header - Screen only */}
        <div className="p-4 sm:p-5 bg-[#252525] border-b border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4E2B01] border border-[#ECB769] flex items-center justify-center text-[#FFF3BC] shadow-md shrink-0">
              <BookOpen className="w-5 h-5 text-[#ECB769]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#FFF3BC] flex items-center gap-2">
                <span>Manual de Usuario Oficial por Roles</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#4E2B01] border border-[#ECB769]/40 text-[#ECB769]">
                  Minifoto 2026
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guía completa de operación de cada módulo, roles de usuario, POS, laboratorio, cobranza y Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Botón Imprimir / PDF */}
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020] font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition active:scale-95 cursor-pointer"
              title="Guardar o imprimir este manual en formato PDF"
            >
              <Printer className="w-4 h-4 text-[#202020]" />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#333] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Filter Tabs - Screen only */}
        <div className="bg-[#181818] p-3 border-b border-[#303030] flex items-center gap-2 overflow-x-auto print:hidden">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap pl-1">Filtrar Rol:</span>
          
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedRole === 'all'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            Todos los Roles (Manual Completo)
          </button>

          <button
            onClick={() => setSelectedRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'admin'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Administrador</span>
          </button>

          <button
            onClick={() => setSelectedRole('cashier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'cashier'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-300" />
            <span>2. Cajero Mostrador</span>
          </button>

          <button
            onClick={() => setSelectedRole('field')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'field'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Cobranza Escolar (Tablets)</span>
          </button>

          <button
            onClick={() => setSelectedRole('laboratorio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'laboratorio'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
            <span>4. Laboratorio / Retoque</span>
          </button>

          <button
            onClick={() => setSelectedRole('impresor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'impresor'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#262626] text-slate-300 hover:bg-[#333]'
            }`}
          >
            <Barcode className="w-3.5 h-3.5 text-rose-400" />
            <span>5. Impresor / Escáner</span>
          </button>
        </div>

        {/* Manual Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#1a1a1a] text-slate-200 print:bg-white print:text-black print:p-0 print:overflow-visible">
          
          {/* Printable Header Cover */}
          <div className="border-b-2 border-[#ECB769] pb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ECB769] print:text-[#4E2B01]">
                <span>Estudio Fotográfico Minifoto</span>
                <span>•</span>
                <span>Sistema Operativo Integral de Punto de Venta</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FFF3BC] print:text-[#4E2B01] mt-1">
                Manual Operativo de Usuario por Roles
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600 mt-1">
                Procedimientos estándar de operación, políticas de cobro, flujo de órdenes y manual técnico de software.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-400 print:text-slate-500 block">Versión 2026.1</span>
              <span className="text-xs font-mono font-bold text-[#ECB769] print:text-[#4E2B01]">Supabase Sync Active</span>
            </div>
          </div>

          {/* Quick Index */}
          <div className="bg-[#242424] print:bg-slate-50 border border-[#383838] print:border-slate-300 rounded-2xl p-4 text-xs">
            <h3 className="font-black text-[#FFF3BC] print:text-[#4E2B01] uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ECB769]" />
              <span>Contenido del Manual</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-slate-300 print:text-slate-700">
              <div>1. Rol Administrador (Uriel)</div>
              <div>2. Rol Cajero Mostrador (POS)</div>
              <div>3. Rol Cobranza Escolar (8 Tablets)</div>
              <div>4. Rol Laboratorio de Revelado</div>
              <div>5. Rol Operador Impresor</div>
              <div>6. Políticas y Sincronización Supabase</div>
            </div>
          </div>

          {/* =========================================================================
              SECCIÓN 1: ROL ADMINISTRADOR
              ========================================================================= */}
          {(selectedRole === 'all' || selectedRole === 'admin') && (
            <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-[#3b3b3b] print:border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01]">
                    1. Rol Administrador (Gestión y Control Total)
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Acceso irrestricto a finanzas, catálogos, listas de precios, asignación de roles y base de datos.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    A. Módulo "Lista de Precios Oficial":
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li><strong>Ajuste de Precios:</strong> Modifica el Precio Base ($ MXN), Retoque Digital ($) y Autoadherible ($) de cada servicio en tiempo real.</li>
                    <li><strong>Guardado y Sincronización:</strong> Haz clic en <em>"Guardar Todos los Cambios"</em> para actualizar la memoria local y la tabla <code>products</code> en Supabase al instante.</li>
                    <li><strong>Ajuste Masivo (+10% / Descuentos):</strong> Usa el botón <em>"% Ajuste Masivo"</em> para incrementar o decrementar tarifas por categoría o en todo el catálogo.</li>
                    <li><strong>Eliminación de Productos:</strong> Haz clic en el icono de bote de basura <Trash2 className="w-3 h-3 inline text-rose-400" /> en cualquier producto. Se abre la ventana de confirmación y se elimina permanentemente de Supabase y del POS.</li>
                    <li><strong>Gestionar y Borrar Categorías:</strong> Usa el botón <em>"Gestionar Categorías"</em> para crear nuevas o borrar categorías existentes. Los productos de la categoría borrada se reasignan automáticamente a "Foto Estudio" para nunca perder registros.</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    B. Módulo "Gestión Escolar & Alumnos":
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li>Alta de escuelas y ciclos escolares (ej. Secundaria 15, Bachilleres, Primarias).</li>
                    <li>Padrón de alumnos con generación automática de <strong>Referencia Bancaria Santander</strong> única (formato <code>MF-015-XXXXXX</code>).</li>
                    <li>Control de convenios, costos de paquetes de graduación y fechas límites de pago.</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    C. Módulo "Reportes y Métricas":
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li>Cortes de caja diarios por turno y operador.</li>
                    <li>Desglose por método de pago: Efectivo, Tarjeta Terminal Clip/MercadoPago, Transferencia Santander.</li>
                    <li>Reimpresión de tickets históricos y exportación de reportes.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECCIÓN 2: ROL CAJERO MOSTRADOR
              ========================================================================= */}
          {(selectedRole === 'all' || selectedRole === 'cashier') && (
            <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-[#3b3b3b] print:border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01]">
                    2. Rol Cajero Mostrador (Punto de Venta Touch)
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Cobro ágil al público en general, venta de fotografías, paquetes, cafetería y emisión de tickets térmicos.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    Pasos para realizar una Venta en Mostrador:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li><strong>Selección de Productos:</strong> Toca los botones de servicios (ej. Foto Infantil x6, Foto Título, Caritas). Puedes agregar extras (Retoque Digital +$30 o Autoadherible +$20).</li>
                    <li><strong>Calculadora Rápida:</strong> Si el cliente requiere un importe libre, usa el teclado numérico de la calculadora para agregar un cobro directo.</li>
                    <li><strong>Datos del Cliente:</strong> Ingresa el Nombre y Teléfono WhatsApp del cliente para asociarlo a su orden de revelado.</li>
                    <li><strong>Forma de Cobro:</strong> Selecciona Efectivo (ingresa el monto recibido para calcular el cambio exacto), Tarjeta o Transferencia.</li>
                    <li><strong>Anticipos o Liquidación:</strong> Si el cliente solo deja un anticipo (ej. $50 de $150), marca la casilla de anticipo y el sistema registrará el saldo pendiente para liquidar a la entrega.</li>
                    <li><strong>Emisión de Ticket:</strong> Al presionar <em>"Cobrar e Imprimir Ticket"</em>, se genera el folio <code>#TK-XXXXXX</code> con código de barras y QR, listo para la impresora térmica (80mm o 58mm) y con botón para enviar recibo por WhatsApp.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECCIÓN 3: ROL COBRANZA ESCOLAR (8 TABLETS)
              ========================================================================= */}
          {(selectedRole === 'all' || selectedRole === 'field') && (
            <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-[#3b3b3b] print:border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01]">
                    3. Rol Cobranza Escolar (Tableros Móviles para Tablets)
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Diseñado especialmente para cobradores de campo en graduaciones y escuelas con interfaz táctil grande.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    Operación en Campo (Escuelas y Graduaciones):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li><strong>Filtro por Escuela y Grado:</strong> Selecciona la institución (ej. Secundaria Técnica 15) y el grupo correspondiente.</li>
                    <li><strong>Búsqueda Inmediata:</strong> Escribe las primeras letras del nombre del alumno o su matrícula escolar.</li>
                    <li><strong>Registro de Abonos:</strong> Toca al alumno, introduce la cantidad que el padre o tutor está pagando en ese momento. El sistema calcula en vivo el <em>Saldo Restante</em>.</li>
                    <li><strong>Comprobante Digital Instantáneo:</strong> Envía el comprobante con un solo toque al WhatsApp del tutor con el detalle del abono y la fecha de entrega del paquete.</li>
                    <li><strong>Operación Offline:</strong> Si la escuela no cuenta con señal de internet, los cobros se guardan en el almacenamiento local del dispositivo y se sincronizan automáticamente con Supabase en cuanto recupera conexión.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECCIÓN 4: ROL LABORATORIO DE REVELADO
              ========================================================================= */}
          {(selectedRole === 'all' || selectedRole === 'laboratorio') && (
            <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-[#3b3b3b] print:border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01]">
                    4. Rol Laboratorio (Técnico de Revelado & Retoque Digital)
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Recepción de órdenes de trabajo, retoque fotográfico profesional, visualización de fotos del cliente y control de calidad.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    Flujo de Trabajo del Técnico de Laboratorio:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li><strong>Acceso a Órdenes de Trabajo:</strong> El rol Laboratorio tiene deshabilitado el cobro directo y se enfoca exclusivamente en la cola de producción.</li>
                    <li><strong>Subida y Galería de Fotografías:</strong> En la sección <em>"Galería de Fotografías del Cliente"</em>, el técnico puede cargar fotos originales en alta definición desde cualquier equipo Windows o Mac.</li>
                    <li><strong>Inspección de Notas Técnicas:</strong> Revisa especificaciones del cliente (ej. <em>"Fondo gris claro", "Retoque suave", "No quitar lunares", "Papel autoadherible mate"</em>).</li>
                    <li><strong>Transición de Estados:</strong>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-bold text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-600/50">Pendiente</span>
                        <span>➔</span>
                        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-600/50">En Retoque</span>
                        <span>➔</span>
                        <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-600/50">Listo para Impresión</span>
                        <span>➔</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-600/50">Entregado</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECCIÓN 5: ROL OPERADOR IMPRESOR
              ========================================================================= */}
          {(selectedRole === 'all' || selectedRole === 'impresor') && (
            <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
              <div className="flex items-center gap-3 border-b border-[#3b3b3b] print:border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01]">
                    5. Rol Operador Impresor (Escáner de Tickets & Producción)
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Módulo simplificado y exclusivo: escaneo de código de barras o QR para localizar la orden al instante e imprimir.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
                <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                  <h4 className="font-bold text-[#ECB769] print:text-[#4E2B01] mb-1">
                    Operación con Pistola Lectora / Escáner QR:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-700">
                    <li><strong>Solo Módulo Órdenes de Trabajo:</strong> El operador impresor tiene una vista despejada sin acceso a cobros ni finanzas.</li>
                    <li><strong>Escaneo con Pistola Láser:</strong> Con el ticket físico en mano, el operador dispara la pistola lectora sobre el código de barras o código QR.</li>
                    <li><strong>Detección Automática:</strong> El sistema identifica inmediatamente el folio (ej. <code>#TK-149450</code>), abre la orden del cliente y muestra las fotos en pantalla.</li>
                    <li><strong>Control de Papel y Acabado:</strong> Verifica tamaño de ampliación, papel mate o brillante y cantidad de copias antes de enviar a la impresora de fotos profesional.</li>
                    <li><strong>Marcar como "Listo para Impresión / Entrega":</strong> Con un solo clic se actualiza el estado para que el cajero sepa que el trabajo está listo en mostrador.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECCIÓN 6: SUPABASE & INSTALACIÓN PWA
              ========================================================================= */}
          <div className="bg-[#222222] print:bg-white border border-[#3b3b3b] print:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 break-inside-avoid">
            <h3 className="text-lg font-black text-[#FFF3BC] print:text-[#4E2B01] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ECB769]" />
              <span>6. Preguntas Frecuentes, Supabase y Modo Aplicación (PWA)</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 print:text-slate-800">
              <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                <h4 className="font-bold text-emerald-400 print:text-emerald-700 mb-1">
                  ¿Cómo instalar la aplicación en PC, Mac, Tablet o Celular?
                </h4>
                <p className="text-slate-300 print:text-slate-700">
                  Minifoto es una Aplicación Web Progresiva (PWA). Haz clic en el botón marrón superior <strong>"Instalar Minifoto"</strong> o en el icono de instalación del navegador en la barra de direcciones (Chrome / Edge / Safari). Se añadirá un acceso directo en tu escritorio o pantalla de inicio que abre la app a pantalla completa y sin barras de navegador.
                </p>
              </div>

              <div className="p-3 bg-[#191919] print:bg-slate-50 rounded-xl border border-[#333] print:border-slate-200">
                <h4 className="font-bold text-amber-400 print:text-amber-700 mb-1">
                  ¿Por qué no se borran los datos al refrescar la pantalla?
                </h4>
                <p className="text-slate-300 print:text-slate-700">
                  El sistema cuenta con un motor de persistencia bidireccional: guarda en el almacenamiento local del equipo y se sincroniza en vivo con la base de datos Supabase en la nube. Cuando eliminas un producto o categoría, el sistema registra la baja permanente para que nunca vuelva a restaurarse automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-[#3b3b3b] print:border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
            <span>© 2026 Minifoto Estudio Fotográfico • Todos los derechos reservados</span>
            <span>Generado digitalmente desde el Sistema Oficial Minifoto POS</span>
          </div>
        </div>

        {/* Modal Bottom Actions - Screen only */}
        <div className="p-4 bg-[#222] border-t border-[#383838] flex items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-400">
            Para compartir con tu cliente: Haz clic en <strong>"Imprimir / Guardar en PDF"</strong> y en la ventana de impresión selecciona <strong>"Guardar como PDF"</strong>.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl bg-[#333] hover:bg-[#444] text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020] text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#202020]" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
