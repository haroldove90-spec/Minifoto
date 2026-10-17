import React, { useState } from 'react';
import { Sale, GraduationStudent } from '../../types';
import { 
  BarChart3, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Printer, 
  Search, 
  Calendar, 
  TrendingUp,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface AdminReportsViewProps {
  sales: Sale[];
  students: GraduationStudent[];
  onOpenTicket: (sale: Sale) => void;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  sales,
  students,
  onOpenTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      s.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.clientName && s.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.operatorName && s.operatorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchPayment = paymentFilter === 'todos' || s.paymentMethod === paymentFilter;
    return matchSearch && matchPayment;
  });

  // Financial aggregates
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCash = sales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((sum, s) => sum + s.total, 0);
  const totalClip = sales
    .filter((s) => s.paymentMethod === 'clip')
    .reduce((sum, s) => sum + s.total, 0);
  const totalMercadoPago = sales
    .filter((s) => s.paymentMethod === 'mercadopago')
    .reduce((sum, s) => sum + s.total, 0);
  const totalTransfer = sales
    .filter((s) => s.paymentMethod === 'transferencia')
    .reduce((sum, s) => sum + s.total, 0);

  // Field deposits from students
  const fieldDepositsTotal = students.reduce((sum, s) => sum + s.depositAmount, 0);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  sales.forEach((s) => {
    s.items.forEach((it) => {
      categoryCounts[it.category] = (categoryCounts[it.category] || 0) + it.totalPrice;
    });
  });

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">
                Reportes y Cortes de Caja
              </h1>
              <p className="text-xs text-slate-500">
                Resumen de ingresos, ventas por método de pago y desglose por categorías
              </p>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-600 block">Ventas Mostrador</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800">
              ${totalSalesRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-600 block mt-0.5">{sales.length} tickets expedidos</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-emerald-700 block">Efectivo en Caja</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ${totalCash.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-800 block mt-0.5">Cobro físico</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#F97800] block">Terminal Clip</span>
            <span className="text-xl sm:text-2xl font-black text-[#F97800]">
              ${totalClip.toFixed(2)}
            </span>
            <span className="text-[10px] text-orange-800 block mt-0.5">Tarjetas de crédito/débito</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-sky-700 block">Mercado Pago / Transf.</span>
            <span className="text-xl sm:text-2xl font-black text-sky-700">
              ${(totalMercadoPago + totalTransfer).toFixed(2)}
            </span>
            <span className="text-[10px] text-sky-800 block mt-0.5">Pagos electrónicos</span>
          </div>
        </div>

        {/* Sales Table / Tickets List */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Historial de Tickets de Venta
              </span>
              <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                {filteredSales.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Payment filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
              >
                <option value="todos">Todos los métodos</option>
                <option value="efectivo">Solo Efectivo</option>
                <option value="clip">Solo Clip</option>
                <option value="mercadopago">Solo Mercado Pago</option>
                <option value="transferencia">Solo Transferencia</option>
              </select>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Folio o cliente..."
                  className="w-full text-xs pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
                />
              </div>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No se han registrado ventas aún</p>
              <p className="text-xs text-slate-600 mt-1">
                Realiza cobros desde el punto de venta touch o módulo de entregas para verlas reflejadas aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Folio</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Atendió</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Artículos</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">#{sale.folio}</td>
                      <td className="p-3 text-slate-600">{sale.date}</td>
                      <td className="p-3 text-slate-800">{sale.operatorName}</td>
                      <td className="p-3 text-slate-700 font-bold">
                        {sale.clientName || 'Público General'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {sale.items.reduce((s, i) => s + i.quantity, 0)} arts
                        <span className="text-[11px] text-slate-600 block truncate max-w-[180px]">
                          {sale.items.map((i) => i.name).join(', ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-[#004C59]">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenTicket(sale)}
                          className="p-1.5 text-slate-600 hover:text-[#004C59] bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="Reimprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
