import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Smartphone, 
  User, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  Calendar, 
  RefreshCw, 
  Landmark, 
  Upload, 
  Download,
  AlertCircle,
  FileText,
  Clock,
  Printer
} from 'lucide-react';
import { School, GraduationStudent, TerminalId, PaymentRecord, BrandConfig, Role } from '../../types';
import { 
  getStoredSchools, 
  getStoredStudents, 
  getActiveTerminal, 
  setActiveTerminal, 
  getStoredOperator,
  getStoredBrandConfig
} from '../../services/storage';
import { StudentDetailModal } from '../StudentDetailModal';
import { WhatsAppModal } from '../WhatsAppModal';
import { PaymentRegisterModal } from '../PaymentRegisterModal';
import { TicketModal } from '../TicketModal';
import { SantanderReconciliationModal } from '../SantanderReconciliationModal';
import { ExcelImportModal } from '../ExcelImportModal';

interface TabletPOSCobroViewProps {
  currentRole: Role;
  operatorName: string;
}

export const TabletPOSCobroView: React.FC<TabletPOSCobroViewProps> = ({
  currentRole,
  operatorName,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<GraduationStudent[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('todos');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTerminalId, setActiveTerminalId] = useState<TerminalId>(getActiveTerminal());
  const [brand, setBrand] = useState<BrandConfig>(getStoredBrandConfig());

  // Modals state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<GraduationStudent | null>(null);
  const [selectedStudentForWhatsApp, setSelectedStudentForWhatsApp] = useState<GraduationStudent | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<GraduationStudent | null>(null);
  const [ticketModalData, setTicketModalData] = useState<{
    student: GraduationStudent;
    payment?: PaymentRecord;
  } | null>(null);

  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = () => {
    const storedSchools = getStoredSchools();
    const storedStudents = getStoredStudents();
    setSchools(storedSchools);
    setStudents(storedStudents);

    // Default to the first school (prefer 'sch-sec15' or first)
    if (!selectedSchoolId && storedSchools.length > 0) {
      const preferred = storedSchools.find(s => s.id === 'sch-sec15') || storedSchools[0];
      setSelectedSchoolId(preferred.id);
    }
  };

  useEffect(() => {
    loadData();
    setActiveTerminalId(getActiveTerminal());
    setBrand(getStoredBrandConfig());
  }, []);

  const handleTerminalChange = (term: TerminalId) => {
    setActiveTerminalId(term);
    setActiveTerminal(term);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      loadData();
      setIsSyncing(false);
    }, 600);
  };

  // Get available grades and groups for current school
  const currentSchoolStudents = useMemo(() => {
    return students.filter(s => s.schoolId === selectedSchoolId);
  }, [students, selectedSchoolId]);

  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    currentSchoolStudents.forEach(s => {
      if (s.grade) grades.add(s.grade);
    });
    return Array.from(grades).sort();
  }, [currentSchoolStudents]);

  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    currentSchoolStudents.forEach(s => {
      if (s.group) groups.add(s.group);
    });
    return Array.from(groups).sort();
  }, [currentSchoolStudents]);

  // Filter students based on school, grade, group and search query
  const filteredStudents = useMemo(() => {
    return currentSchoolStudents.filter(s => {
      const matchesGrade = selectedGrade === 'todos' || s.grade === selectedGrade;
      const matchesGroup = selectedGroup === 'todos' || s.group === selectedGroup;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        s.studentName.toLowerCase().includes(term) ||
        (s.matricula && s.matricula.toLowerCase().includes(term)) ||
        s.folio.toLowerCase().includes(term) ||
        s.santanderReference.toLowerCase().includes(term);
      return matchesGrade && matchesGroup && matchesSearch;
    });
  }, [currentSchoolStudents, selectedGrade, selectedGroup, searchTerm]);

  // Metrics
  const totalCount = filteredStudents.length;
  const pendingCount = filteredStudents.filter(s => s.remainingAmount > 0).length;
  const liquidatedCount = filteredStudents.filter(s => s.remainingAmount === 0).length;
  const totalRemainingAmount = filteredStudents.reduce((acc, s) => acc + s.remainingAmount, 0);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  return (
    <div className="space-y-4">
      {/* TOP HEADER: TABLET POS IDENTIFIER (matches Mockup 8) */}
      <div className="bg-[#4E2B01] text-[#FFF3BC] rounded-3xl p-4 sm:p-5 shadow-lg border-2 border-[#ECB769]/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-sm font-black">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Cobranza Escolar en Tablet
              </h2>
              <span className="text-[10px] font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                En Línea / Offline Ready
              </span>
            </div>
            <p className="text-xs text-[#ECB769] font-medium">
              Mini Foto Estudio • Base de Datos y Control de Abonos
            </p>
          </div>
        </div>

        {/* Terminal and Operator badges (matches Mockup 8: POS-01 Juan Pérez) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Terminal Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-[#ECB769]/40 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] text-[#ECB769] font-bold uppercase">Terminal:</span>
            <select
              value={activeTerminalId}
              onChange={(e) => handleTerminalChange(e.target.value as TerminalId)}
              className="bg-transparent font-mono font-black text-xs text-white focus:outline-none cursor-pointer"
            >
              {(['POS-01', 'POS-02', 'POS-03', 'POS-04', 'POS-05', 'POS-06', 'POS-07', 'POS-08', 'OFICINA-01'] as TerminalId[]).map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white font-mono">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Name */}
          <div className="flex items-center gap-1.5 bg-black/30 border border-[#ECB769]/40 px-3 py-1.5 rounded-2xl">
            <User className="w-3.5 h-3.5 text-[#ECB769]" />
            <span className="text-xs font-bold text-white truncate max-w-[130px]">
              {operatorName || 'Juan Pérez'}
            </span>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 bg-[#ECB769] hover:bg-[#d99f4d] text-[#4E2B01] rounded-2xl transition shadow-xs cursor-pointer font-bold flex items-center gap-1"
            title="Sincronizar información con servidor central"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (Oficinas / Conciliación Santander / Importación) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowReconciliationModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#EC0000] to-[#C00000] text-white hover:brightness-110 font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Landmark className="w-4 h-4" />
            <span>Conciliación Bancaria Santander</span>
          </button>

          {(currentRole === 'admin' || currentRole === 'cashier') && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#4E2B01]" />
              <span>Importar Alumnos Excel (CSV)</span>
            </button>
          )}
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200">
            Pendientes: <strong>{pendingCount}</strong>
          </span>
          <span className="bg-[#FCF9F2] text-[#4E2B01] px-3 py-1.5 rounded-xl border border-[#ECB769]">
            Total por cobrar: <strong>${totalRemainingAmount.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {/* FILTER BAR (matches Mockup 8: Escuela dropdown, Grado dropdown, Grupo dropdown, Buscador) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Escuela Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Escuela:
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setSelectedGrade('todos');
                setSelectedGroup('todos');
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-black text-[#4E2B01] focus:outline-none focus:ring-2 focus:ring-[#4E2B01] cursor-pointer"
            >
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.seasonYear})
                </option>
              ))}
            </select>
          </div>

          {/* Grado Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Grado:
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4E2B01] cursor-pointer"
            >
              <option value="todos">Todos los Grados</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Grupo Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Grupo:
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4E2B01] cursor-pointer"
            >
              <option value="todos">Todos los Grupos</option>
              {availableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  Grupo {grp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscador de Alumnos (matches Mockup 8) */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar alumno por nombre o matrícula..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* STUDENTS TABLE (matches Mockup 8: Nombre del Alumno | Saldo | Estado) */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 bg-[#FCF9F2] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#4E2B01] text-xs sm:text-sm">
              {selectedSchool?.name || 'Listado de Alumnos'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({filteredStudents.length} alumnos encontrados)
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
            Haga clic en cualquier fila para ver la ficha completa y registrar abonos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-black text-xs border-b border-slate-200">
                <th className="py-3 px-4">Nombre del alumno</th>
                <th className="py-3 px-4 hidden md:table-cell">Matrícula / Ref. Santander</th>
                <th className="py-3 px-4 text-right">Saldo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const isLiquidated = st.remainingAmount === 0;
                  return (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudentForDetail(st)}
                      className="hover:bg-[#FCF9F2]/70 transition cursor-pointer group"
                    >
                      {/* Name & Grade */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-[#4E2B01] transition flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#FCF9F2] text-[#4E2B01] font-black text-xs flex items-center justify-center border border-[#ECB769]/50 shrink-0">
                            {st.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-black">{st.studentName}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {st.gradeGroup || `${st.grade} ${st.group}`}
                              {st.nextDueDate && (
                                <span className="ml-2 text-amber-700 font-bold">
                                  • Próx. plazo: {st.nextDueDate}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Matricula / Santander Reference */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="font-mono font-bold text-slate-600 text-[11px] block">
                          Mat: {st.matricula || st.folio}
                        </span>
                        <span className="font-mono text-[10px] text-[#EC0000] font-black bg-red-50 px-2 py-0.5 rounded-md border border-red-200 inline-block mt-0.5">
                          {st.santanderReference}
                        </span>
                      </td>

                      {/* Balance (matches Mockup 8) */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-base font-black font-mono ${
                            isLiquidated ? 'text-slate-500' : 'text-[#4E2B01]'
                          }`}
                        >
                          ${st.remainingAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          de ${st.totalAmount.toFixed(2)}
                        </span>
                      </td>

                      {/* Estado Badge (matches Mockup 8: Pendiente in amber, Liquidado in green) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs ${
                            isLiquidated
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isLiquidated ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Liquidado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Cobrar button */}
                          {!isLiquidated && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForPayment(st)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Cobrar</span>
                            </button>
                          )}

                          {/* Direct WhatsApp button */}
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForWhatsApp(st)}
                            className="p-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl shadow-xs transition cursor-pointer"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Detail button */}
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForDetail(st)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-bold">No se encontraron alumnos en esta selección.</p>
                    <p className="text-xs mt-1">Verifique los filtros de Grado, Grupo o el término de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: FICHA DEL ALUMNO (DETALLE - MOCKUP 9) */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          terminalId={activeTerminalId}
          operatorName={operatorName}
          onClose={() => setSelectedStudentForDetail(null)}
          onUpdated={() => {
            loadData();
            // Refresh currently opened student
            const refreshed = getStoredStudents().find(s => s.id === selectedStudentForDetail.id);
            if (refreshed) setSelectedStudentForDetail(refreshed);
          }}
          onOpenTicket={(payment, updatedStudent) => {
            setTicketModalData({ student: updatedStudent, payment });
          }}
        />
      )}

      {/* MODAL 2: WHATSAPP DIRECTO */}
      {selectedStudentForWhatsApp && (
        <WhatsAppModal
          student={selectedStudentForWhatsApp}
          onClose={() => setSelectedStudentForWhatsApp(null)}
          onLogSent={loadData}
        />
      )}

      {/* MODAL 3: REGISTRAR PAGO DIRECTO */}
      {selectedStudentForPayment && (
        <PaymentRegisterModal
          student={selectedStudentForPayment}
          terminalId={activeTerminalId}
          operatorName={operatorName}
          onClose={() => setSelectedStudentForPayment(null)}
          onPaymentSuccess={(payment, updatedStudent) => {
            setSelectedStudentForPayment(null);
            loadData();
            setTicketModalData({ student: updatedStudent, payment });
          }}
        />
      )}

      {/* MODAL 4: TICKET DE PAGO (MOCKUP 10) */}
      {ticketModalData && (
        <TicketModal
          studentTicket={ticketModalData.student}
          paymentRecord={ticketModalData.payment}
          terminalId={activeTerminalId}
          operatorName={operatorName}
          brand={brand}
          onClose={() => setTicketModalData(null)}
          autoPrint={true}
        />
      )}

      {/* MODAL 5: CONCILIACIÓN SANTANDER */}
      {showReconciliationModal && (
        <SantanderReconciliationModal
          operatorName={operatorName}
          onClose={() => setShowReconciliationModal(false)}
          onReconciliationDone={loadData}
        />
      )}

      {/* MODAL 6: IMPORTACIÓN EXCEL */}
      {showImportModal && (
        <ExcelImportModal
          schools={schools}
          operatorName={operatorName}
          onClose={() => setShowImportModal(false)}
          onImportComplete={loadData}
        />
      )}
    </div>
  );
};
