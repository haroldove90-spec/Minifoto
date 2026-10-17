import React from 'react';
import { Role, Sale, GraduationStudent } from '../../types';
import { 
  ShoppingBag, 
  PackageCheck, 
  GraduationCap, 
  Layers, 
  BarChart3, 
  Sliders, 
  Receipt, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  User
} from 'lucide-react';
import { ActiveTab } from '../Sidebar';

interface DashboardHomeViewProps {
  currentRole: Role;
  operatorName: string;
  onSelectTab: (tab: ActiveTab) => void;
  sales: Sale[];
  students: GraduationStudent[];
  brandLogo: string;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  currentRole,
  operatorName,
  onSelectTab,
  sales,
  students,
  brandLogo,
}) => {
  const today = new Date().toLocaleDateString('es-MX');
  const todaySales = sales.filter((s) => s.date.includes(today));
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
  const pendingDeliveries = students.filter((s) => s.deliveryStatus !== 'entregado').length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FCF9F2] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner de Bienvenida con Acceso Rápido al POS en Paleta Minifoto */}
        <div className="bg-gradient-to-r from-[#4E2B01] via-[#381e01] to-[#202020] rounded-3xl p-6 sm:p-8 text-[#FFF3BC] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-[#ECB769]/50">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECB769] text-[#4E2B01] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SISTEMA POS MINIFOTO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bienvenido, {operatorName}
            </h1>
            <p className="text-sm text-[#FFF3BC]/80 max-w-lg font-medium">
              Panel general de control Minifoto. Accede a tu punto de venta táctil en pantalla completa o gestiona entregas, convenios y reportes.
            </p>
          </div>

          {/* Botón Principal por Rol: Catálogo para Admin, POS Touch para Cajero */}
          {currentRole === 'admin' ? (
            <button
              onClick={() => onSelectTab('catalogs')}
              className="w-full md:w-auto px-7 py-4 sm:py-5 bg-[#ECB769] hover:bg-[#faea9f] active:scale-95 text-[#4E2B01] font-black text-base sm:text-lg rounded-2xl shadow-2xl border-2 border-[#4E2B01] cursor-pointer transition flex items-center justify-center gap-3 shrink-0"
            >
              <Layers className="w-6 h-6 text-[#4E2B01]" />
              <span>ADMINISTRAR CATÁLOGO & FOTOS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : currentRole === 'cashier' ? (
            <button
              onClick={() => onSelectTab('pos_cashier')}
              className="w-full md:w-auto px-8 py-5 bg-[#ECB769] hover:bg-[#faea9f] active:scale-95 text-[#4E2B01] font-black text-lg sm:text-xl rounded-2xl shadow-2xl border-2 border-[#4E2B01] cursor-pointer transition flex items-center justify-center gap-3 shrink-0"
            >
              <ShoppingBag className="w-7 h-7 text-[#4E2B01]" />
              <span>ABRIR PUNTO DE VENTA TOUCH</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('catalogs')}
              className="w-full md:w-auto px-7 py-4 sm:py-5 bg-[#ECB769] hover:bg-[#faea9f] active:scale-95 text-[#4E2B01] font-black text-base sm:text-lg rounded-2xl shadow-2xl border-2 border-[#4E2B01] cursor-pointer transition flex items-center justify-center gap-3 shrink-0"
            >
              <Layers className="w-6 h-6 text-[#4E2B01]" />
              <span>VER CATÁLOGO DE FOTOS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Resumen Rápido de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Ventas de Hoy</span>
            <span className="text-2xl font-black text-[#004C59] font-mono">
              ${todaySalesTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{todaySales.length} transacciones</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Entregas Pendientes</span>
            <span className="text-2xl font-black text-orange-600 font-mono">
              {pendingDeliveries}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Paquetes por entregar</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Alumnos</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {students.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">En convenios escolares</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Histórico</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {sales.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Tickets emitidos</span>
          </div>
        </div>

        {/* Cuadrícula de Módulos del Sistema */}
        <div>
          <h2 className="text-base font-black text-slate-800 mb-3 uppercase tracking-wide">
            Módulos del Sistema
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* POS Touch (Exclusivo para Cajero) */}
            {currentRole === 'cashier' && (
              <div 
                onClick={() => onSelectTab('pos_cashier')}
                className="p-5 bg-white hover:bg-yellow-50 rounded-2xl border-2 border-yellow-400 hover:border-yellow-500 shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
              >
                <div className="p-3 rounded-2xl bg-yellow-400 text-slate-950 shrink-0">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-base text-slate-900">Punto de Venta Touch</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Terminal táctil completa con botones grandes, selección de productos variables y calculadora de cobro.
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#F97800] mt-2">
                    Abrir Caja ➔
                  </span>
                </div>
              </div>
            )}

            {/* Catálogo de Productos (Para Admin, Vendedor en Campo y Cliente) */}
            {currentRole !== 'cashier' && (
              <div 
                onClick={() => onSelectTab('catalogs')}
                className="p-5 bg-white hover:bg-indigo-50 rounded-2xl border-2 border-indigo-400 hover:border-indigo-500 shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
              >
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shrink-0">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-base text-slate-900">
                    {currentRole === 'admin' ? 'Catálogo & Subida de Fotos' : 'Catálogo Fotográfico'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentRole === 'admin' 
                      ? 'Sube fotos, asigna precios, activa/desactiva productos y sincroniza con Supabase.'
                      : 'Visualiza fotografías en alta calidad, paquetes disponibles y selecciona productos.'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-700 mt-2">
                    {currentRole === 'admin' ? 'Administrar Catálogo ➔' : 'Ver Productos ➔'}
                  </span>
                </div>
              </div>
            )}

            {/* Entregas y Liquidación */}
            <div 
              onClick={() => onSelectTab('deliveries')}
              className="p-5 bg-white hover:bg-emerald-50 rounded-2xl border-2 border-emerald-400 hover:border-emerald-500 shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
            >
              <div className="p-3 rounded-2xl bg-emerald-500 text-white shrink-0">
                <PackageCheck className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base text-slate-900">Entregas y Liquidación</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Búsqueda de alumnos, cobro de saldos restantes, firma digital y entrega de fotos.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 mt-2">
                  Ver Paquetes ➔
                </span>
              </div>
            </div>

            {/* Gestión Escolar y Alumnos */}
            <div 
              onClick={() => onSelectTab('schools')}
              className="p-5 bg-white hover:bg-[#FFF3BC]/20 rounded-2xl border-2 border-[#ECB769]/50 hover:border-[#4E2B01] shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
            >
              <div className="p-3 rounded-2xl bg-[#4E2B01] text-[#FFF3BC] shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base text-[#202020]">Alumnos y Convenios 2026</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Directorio escolar, paquetes por escuela, registro de graduados y seguimiento.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#4E2B01] mt-2">
                  Ver Convenios ➔
                </span>
              </div>
            </div>

            {/* Historial de Ventas */}
            <div 
              onClick={() => onSelectTab('history')}
              className="p-5 bg-white hover:bg-[#FFF3BC]/20 rounded-2xl border-2 border-[#ECB769]/50 hover:border-[#4E2B01] shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
            >
              <div className="p-3 rounded-2xl bg-[#202020] text-[#ECB769] shrink-0">
                <Receipt className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base text-[#202020]">Historial de Ventas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Consulta de comprobantes emitidos, reimpresión de tickets térmicos y envío WhatsApp.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#4E2B01] mt-2">
                  Ver Historial ➔
                </span>
              </div>
            </div>

            {/* Catálogos (Admin) */}
            {currentRole === 'admin' && (
              <>
                <div 
                  onClick={() => onSelectTab('catalogs')}
                  className="p-5 bg-white hover:bg-[#FFF3BC]/20 rounded-2xl border-2 border-[#ECB769]/50 hover:border-[#4E2B01] shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
                >
                  <div className="p-3 rounded-2xl bg-[#4E2B01] text-[#FFF3BC] shrink-0">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-base text-[#202020]">Catálogos Multinegocio</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Altas y edición de foto estudio, iglesia, ampliaciones, salón y cafetería.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#4E2B01] mt-2">
                      Gestionar Precios ➔
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectTab('reports')}
                  className="p-5 bg-white hover:bg-rose-50 rounded-2xl border-2 border-rose-300 hover:border-rose-400 shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
                >
                  <div className="p-3 rounded-2xl bg-rose-700 text-white shrink-0">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-base text-[#202020]">Reportes Financieros</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Cortes de caja por método de pago, desglose por negocio y métricas de ganancia.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 mt-2">
                      Ver Métricas ➔
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectTab('config')}
                  className="p-5 bg-white hover:bg-slate-100 rounded-2xl border-2 border-slate-300 hover:border-[#4E2B01] shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
                >
                  <div className="p-3 rounded-2xl bg-[#202020] text-white shrink-0">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-base text-[#202020]">Configuración & Pagos</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Identidad corporativa Minifoto, logo, pasarelas de pago y datos demo.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#4E2B01] mt-2">
                      Ajustes del Sistema ➔
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Mi Perfil (Activo en todos los roles) */}
            <div 
              onClick={() => onSelectTab('profile')}
              className="p-5 bg-white hover:bg-[#FFF3BC]/30 rounded-2xl border-2 border-[#4E2B01] hover:border-[#202020] shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4 active:scale-98"
            >
              <div className="p-3 rounded-2xl bg-[#4E2B01] text-[#FFF3BC] shrink-0 border border-[#ECB769]/50">
                <User className="w-7 h-7 text-[#ECB769]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-[#202020]">Mi Perfil & Datos</h3>
                  <span className="text-[10px] font-black uppercase bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769] px-2 py-0.5 rounded-full">
                    Todos los Roles
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sube o cambia tu fotografía de perfil, actualiza tu nombre, teléfono WhatsApp y datos personales.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#4E2B01] mt-2">
                  Editar Perfil ➔
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
