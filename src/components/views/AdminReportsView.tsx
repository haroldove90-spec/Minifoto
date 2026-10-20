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
  FileSpreadsheet,
  Download,
  Smartphone,
  AlertTriangle,
  Clock,
  CheckCircle,
  Landmark,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { getStoredAuditLogs, getStoredBankTransfers } from '../../services/storage';

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
  const [activeReportTab, setActiveReportTab] = useState<'ventas' | 'cobradores' | 'vencimientos' | 'auditoria'>('ventas');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  const auditLogs = getStoredAuditLogs();
  const bankTransfers = getStoredBankTransfers();

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
  const totalTransfer = sales
    .filter((s) => s.paymentMethod === 'transferencia')
    .reduce((sum, s) => sum + s.total, 0);

  // Field student payments breakdown by terminal & collector
  const collectorMetrics: Record<string, { count: number; total: number; terminalId: string }> = {};
  students.forEach((std) => {
    (std.paymentHistory || []).forEach((pay) => {
      const key = `${pay.terminalId || 'POS-01'} - ${pay.operatorName || 'Cobrador'}`;
      if (!collectorMetrics[key]) {
        collectorMetrics[key] = { count: 0, total: 0, terminalId: pay.terminalId || 'POS-01' };
      }
      collectorMetrics[key].count += 1;
      collectorMetrics[key].total += pay.amount;
    });
  });

  // Students with upcoming or overdue installments
  const studentsWithBalance = students.filter(s => s.remainingAmount > 0);
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueStudents = studentsWithBalance.filter(s => s.nextDueDate && s.nextDueDate < todayStr);
  const upcomingStudents = studentsWithBalance.filter(s => s.nextDueDate && s.nextDueDate >= todayStr);

  // Export functions
  const handleExportSalesCSV = () => {
    const headers = 'Folio,Fecha,Atendio,Cliente,Metodo,Total\n';
    const rows = filteredSales.map(s => 
      `"${s.folio}","${s.date}","${s.operatorName}","${s.clientName || 'General'}","${s.paymentMethod}","${s.total}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_ventas_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudentsCSV = () => {
    const headers = 'Folio,Alumno,Escuela,GradoGrupo,Total,Abonado,Saldo,ReferenciaSantander,ProximoPlazo,Tutor,WhatsApp\n';
    const rows = students.map(s => 
      `"${s.folio}","${s.studentName}","${s.schoolName}","${s.gradeGroup}","${s.totalAmount}","${s.depositAmount}","${s.remainingAmount}","${s.santanderReference}","${s.nextDueDate || 'N/A'}","${s.tutorName || ''}","${s.tutorWhatsapp || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_alumnos_cobranza_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FCF9F2] text-[#4E2B01] rounded-2xl border border-[#ECB769]/50 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#4E2B01]">
                Reportes, Cobranza y Auditoría
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Cortes de caja, recaudación por terminal POS, vencimientos y auditoría de movimientos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={activeReportTab === 'ventas' ? handleExportSalesCSV : handleExportStudentsCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#ECB769]" />
              <span>Exportar Reporte (CSV)</span>
            </button>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveReportTab('ventas')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeReportTab === 'ventas'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ventas Mostrador & Cortes
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('cobradores')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeReportTab === 'cobradores'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cobranza por Terminal (POS-01 a POS-08)
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('vencimientos')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeReportTab === 'vencimientos'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vencimientos de Alumnos ({overdueStudents.length} Vencidos)
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('auditoria')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeReportTab === 'auditoria'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bitácora de Auditoría ({auditLogs.length})
          </button>
        </div>

        {/* REPORT TAB 1: VENTAS MOSTRADOR & KPI */}
        {activeReportTab === 'ventas' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Ventas Mostrador</span>
                <span className="text-xl sm:text-2xl font-black text-[#4E2B01]">
                  ${totalSalesRevenue.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{sales.length} tickets expedidos</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-emerald-700 block">Efectivo en Caja</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  ${totalCash.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-800 block mt-0.5">Cobro físico</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-[#ECB769] block">Terminal Clip</span>
                <span className="text-xl sm:text-2xl font-black text-[#ECB769]">
                  ${totalClip.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Tarjetas de crédito/débito</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-sky-700 block">Transferencias Santander</span>
                <span className="text-xl sm:text-2xl font-black text-sky-700">
                  ${totalTransfer.toFixed(2)}
                </span>
                <span className="text-[10px] text-sky-800 block mt-0.5">SPEI referenciado</span>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Historial de Tickets Mostrador
                  </span>
                  <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {filteredSales.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="todos">Todos los métodos</option>
                    <option value="efectivo">Solo Efectivo</option>
                    <option value="clip">Solo Clip</option>
                    <option value="transferencia">Solo Transferencia</option>
                  </select>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Folio o cliente..."
                      className="w-full text-xs pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4E2B01]"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FCF9F2] text-[#4E2B01] uppercase font-bold text-[10px] border-b border-[#ECB769]/40">
                    <tr>
                      <th className="p-3">Folio</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Atendió</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Método</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-700">#{sale.folio}</td>
                        <td className="p-3 text-slate-600">{sale.date}</td>
                        <td className="p-3 text-slate-800">{sale.operatorName}</td>
                        <td className="p-3 text-slate-700 font-bold">{sale.clientName || 'General'}</td>
                        <td className="p-3">
                          <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-[#4E2B01]">
                          ${sale.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenTicket(sale)}
                            className="p-1.5 text-[#4E2B01] hover:text-white bg-[#FFF3BC] hover:bg-[#4E2B01] rounded-lg transition border border-[#ECB769]/40 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TAB 2: COBRANZA POR COBRADOR & TERMINAL (POS-01 a POS-08) */}
        {activeReportTab === 'cobradores' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(collectorMetrics).map(([key, data]) => (
                <div key={key} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-[#4E2B01] bg-[#FCF9F2] px-2.5 py-1 rounded-xl border border-[#ECB769]/50">
                      {data.terminalId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{data.count} cobros</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Cobrador Asignado</span>
                    <p className="font-black text-slate-900 text-sm truncate">{key.split('-')[1] || key}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">Total Recaudado:</span>
                    <span className="text-base font-black text-emerald-700">${data.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(collectorMetrics).length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                Aún no hay cobros registrados desde las tablets móviles POS.
              </div>
            )}
          </div>
        )}

        {/* REPORT TAB 3: VENCIMIENTOS Y SALDOS */}
        {activeReportTab === 'vencimientos' && (
          <div className="space-y-4">
            {/* Overdue Alert */}
            {overdueStudents.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-sm">Alumnos con Plazos Vencidos ({overdueStudents.length})</h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Se recomienda enviar recordatorio por WhatsApp con el saldo pendiente y la referencia bancaria Santander.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-[#FCF9F2] border-b border-slate-200 flex items-center justify-between">
                <span className="font-black text-xs text-[#4E2B01]">
                  Alumnos con Plazos Programados
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {studentsWithBalance.length} alumnos con saldo pendiente
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-black text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Alumno</th>
                      <th className="p-3">Escuela / Grado</th>
                      <th className="p-3">Ref. Santander</th>
                      <th className="p-3 text-right">Saldo Restante</th>
                      <th className="p-3 text-right">Monto Plazo</th>
                      <th className="p-3">Fecha Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentsWithBalance.map((st) => {
                      const isOverdue = st.nextDueDate && st.nextDueDate < todayStr;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">{st.studentName}</td>
                          <td className="p-3 text-slate-600">
                            <span className="font-bold text-[#4E2B01]">{st.schoolName}</span>
                            <span className="text-[11px] block text-slate-400">{st.gradeGroup}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-red-700">{st.santanderReference}</td>
                          <td className="p-3 text-right font-black text-amber-700">${st.remainingAmount.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-slate-800">${(st.nextDueAmount || 0).toFixed(2)}</td>
                          <td className="p-3">
                            {st.nextDueDate ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {st.nextDueDate} {isOverdue && '(Vencido)'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Sin programar</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TAB 4: AUDITORÍA DE MOVIMIENTOS */}
        {activeReportTab === 'auditoria' && (
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Bitácora de Auditoría y Seguridad del Sistema
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Últimos {auditLogs.length} eventos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FCF9F2] text-[#4E2B01] font-bold text-[10px] uppercase border-b border-[#ECB769]/30">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Usuario / Terminal</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-500 font-mono">{log.timestamp}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {log.user} {log.terminalId && `(${log.terminalId})`}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        No hay eventos registrados en la bitácora todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
