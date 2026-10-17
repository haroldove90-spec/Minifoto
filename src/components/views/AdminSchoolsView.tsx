import React, { useState } from 'react';
import { School, GraduationStudent } from '../../types';
import { 
  GraduationCap, 
  Plus, 
  School as SchoolIcon, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  Download,
  X,
  Save
} from 'lucide-react';

interface AdminSchoolsViewProps {
  schools: School[];
  students: GraduationStudent[];
  onSaveSchools: (schools: School[]) => void;
  onSaveStudents: (students: GraduationStudent[]) => void;
  onOpenTicket: (student: GraduationStudent) => void;
}

export const AdminSchoolsView: React.FC<AdminSchoolsViewProps> = ({
  schools,
  students,
  onSaveSchools,
  onSaveStudents,
  onOpenTicket,
}) => {
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolRep, setNewSchoolRep] = useState('');
  const [newSchoolPhone, setNewSchoolPhone] = useState('');

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stdName, setStdName] = useState('');
  const [stdSchoolId, setStdSchoolId] = useState(schools[0]?.id || '');
  const [stdGrade, setStdGrade] = useState('6° A');
  const [stdPackage, setStdPackage] = useState('Paquete Graduación Deluxe (10 Fotos + Cuadro)');
  const [stdPhotos, setStdPhotos] = useState('10 fotos');
  const [stdTotal, setStdTotal] = useState<number>(750);
  const [stdDeposit, setStdDeposit] = useState<number>(300);
  const [stdPhone, setStdPhone] = useState('');

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSeason = !s.seasonYear || s.seasonYear === selectedSeason;
    const matchSchool = selectedSchoolId === 'all' || s.schoolId === selectedSchoolId;
    const matchSearch =
      searchTerm.trim() === '' ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSeason && matchSchool && matchSearch;
  });

  // Financial aggregates
  const totalAmountContracted = filteredStudents.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalDepositsCollected = filteredStudents.reduce((sum, s) => sum + s.depositAmount, 0);
  const totalRemainingToCollect = filteredStudents.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalDelivered = filteredStudents.filter((s) => s.deliveryStatus === 'entregado').length;

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const newSch: School = {
      id: `sch-${Date.now()}`,
      name: newSchoolName.trim(),
      seasonYear: selectedSeason,
      active: true,
      representative: newSchoolRep.trim() || undefined,
      phone: newSchoolPhone.trim() || undefined,
    };

    onSaveSchools([...schools, newSch]);
    setNewSchoolName('');
    setNewSchoolRep('');
    setNewSchoolPhone('');
    setShowSchoolModal(false);
  };

  const handleDeleteSchool = (id: string) => {
    if (confirm('¿Eliminar esta escuela del catálogo escolar?')) {
      onSaveSchools(schools.filter((s) => s.id !== id));
      if (selectedSchoolId === id) setSelectedSchoolId('all');
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim()) return;

    const targetSchool = schools.find((s) => s.id === stdSchoolId);
    const folioNum = Math.floor(1000 + Math.random() * 9000);
    const folio = `FOL-${selectedSeason}-${folioNum}`;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const newStudent: GraduationStudent = {
      id: `std-${Date.now()}`,
      folio,
      schoolId: stdSchoolId,
      schoolName: targetSchool ? targetSchool.name : 'Escuela General',
      seasonYear: selectedSeason,
      studentName: stdName.trim(),
      gradeGroup: stdGrade.trim() || 'General',
      packageName: stdPackage,
      totalPhotos: stdPhotos,
      totalAmount: stdTotal,
      depositAmount: stdDeposit,
      remainingAmount: Math.max(0, stdTotal - stdDeposit),
      deliveryStatus: stdDeposit >= stdTotal ? 'listo' : 'pendiente',
      contactPhone: stdPhone.trim() || undefined,
      createdAt: dateStr,
    };

    onSaveStudents([newStudent, ...students]);
    setStdName('');
    setStdPhone('');
    setShowStudentModal(false);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este registro de alumno?')) {
      onSaveStudents(students.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Header with Season Segment */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#004C59]/10 rounded-xl">
              <GraduationCap className="w-6 h-6 text-[#004C59]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800">
                  Gestión Escolar y Convenios
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F97800] text-white">
                  Graduaciones {selectedSeason}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Segmentación por escuela, control de alumnos graduados, anticipos, resto y paquetes listos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Season Selector */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs font-bold px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none"
            >
              <option value="2026">Temporada 2026</option>
              <option value="2027">Temporada 2027</option>
              <option value="2025">Temporada 2025</option>
            </select>

            <button
              type="button"
              onClick={() => setShowSchoolModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#004C59] hover:bg-[#003842] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Escuela</span>
            </button>

            <button
              type="button"
              onClick={() => setShowStudentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F97800] hover:bg-[#e06c00] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cargar Alumno</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-600 block">Total Contratado</span>
            <span className="text-lg sm:text-2xl font-black text-slate-800">
              ${totalAmountContracted.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-600 block mt-0.5">{filteredStudents.length} alumnos registrados</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-emerald-700 block">Anticipos Cobrados</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-700">
              ${totalDepositsCollected.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-800 block mt-0.5">Recaudación en campo</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#F97800] block">Resto por Liquidar</span>
            <span className="text-lg sm:text-2xl font-black text-[#F97800]">
              ${totalRemainingToCollect.toFixed(2)}
            </span>
            <span className="text-[10px] text-orange-800 block mt-0.5">Pendiente por cobrar</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#004C59] block">Paquetes Entregados</span>
            <span className="text-lg sm:text-2xl font-black text-[#004C59]">
              {totalDelivered} / {filteredStudents.length}
            </span>
            <span className="text-[10px] text-teal-800 block mt-0.5">
              {filteredStudents.length > 0 ? Math.round((totalDelivered / filteredStudents.length) * 100) : 0}% entregado
            </span>
          </div>
        </div>

        {/* Escuela Direct Buttons (Required by prompt) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Filtrar por Escuela de Convenio:
            </span>
            <span className="text-xs text-slate-600">{schools.length} escuelas asignadas</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSchoolId('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedSchoolId === 'all'
                  ? 'bg-[#004C59] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas las Escuelas ({students.length})
            </button>

            {schools.map((sch) => {
              const isSelected = selectedSchoolId === sch.id;
              const count = students.filter((s) => s.schoolId === sch.id).length;
              return (
                <div key={sch.id} className="relative group shrink-0">
                  <button
                    onClick={() => setSelectedSchoolId(sch.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#004C59] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sch.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                      {count}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSchool(sch.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm"
                    title="Eliminar escuela"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alumnos Graduados Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Base de Datos de Alumnos Graduados
              </span>
              <span className="text-xs font-mono bg-teal-100 text-[#004C59] px-2 py-0.5 rounded font-bold">
                {filteredStudents.length} alumnos
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o folio..."
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No se encontraron alumnos registrados</p>
              <p className="text-xs text-slate-600 mt-1">
                Puedes cargarlos con el botón "+ Cargar Alumno" o desde el módulo de vendedor en campo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Folio</th>
                    <th className="p-3">Alumno</th>
                    <th className="p-3">Escuela / Grupo</th>
                    <th className="p-3">Paquete</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Anticipo</th>
                    <th className="p-3 text-right">Resto</th>
                    <th className="p-3 text-center">Estatus</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">{std.folio}</td>
                      <td className="p-3 font-bold text-slate-900">{std.studentName}</td>
                      <td className="p-3">
                        <span className="text-[#004C59] font-bold block">{std.schoolName}</span>
                        <span className="text-[11px] text-slate-500">{std.gradeGroup}</span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <span>{std.packageName}</span>
                        <span className="text-[11px] text-slate-500 block">({std.totalPhotos})</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ${std.totalAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        ${std.depositAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-[#F97800]">
                        ${std.remainingAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            std.deliveryStatus === 'entregado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : std.deliveryStatus === 'listo'
                              ? 'bg-teal-100 text-[#004C59]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {std.deliveryStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTicket(std)}
                            className="p-1.5 text-slate-600 hover:text-[#004C59] bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            title="Ver ticket del alumno"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(std.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar alumno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Nueva Escuela */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleAddSchool}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#004C59]">Nueva Escuela de Convenio</h3>
              <button
                type="button"
                onClick={() => setShowSchoolModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre de la Escuela *</label>
              <input
                type="text"
                required
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Ej. Escuela Lerdo de Tejada"
                className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Representante / Director:</label>
                <input
                  type="text"
                  value={newSchoolRep}
                  onChange={(e) => setNewSchoolRep(e.target.value)}
                  placeholder="Prof. Juan Pérez"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Teléfono:</label>
                <input
                  type="tel"
                  value={newSchoolPhone}
                  onChange={(e) => setNewSchoolPhone(e.target.value)}
                  placeholder="55-1234-5678"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSchoolModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#004C59] hover:bg-[#003842] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Guardar Escuela
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Cargar Alumno Graduado */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleAddStudent}
            className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#004C59]">Registrar Alumno Graduado</h3>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Escuela *</label>
                <select
                  value={stdSchoolId}
                  onChange={(e) => setStdSchoolId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Grado y Grupo *</label>
                <input
                  type="text"
                  required
                  value={stdGrade}
                  onChange={(e) => setStdGrade(e.target.value)}
                  placeholder="Ej. 6° A"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre Completo del Alumno *</label>
              <input
                type="text"
                required
                value={stdName}
                onChange={(e) => setStdName(e.target.value)}
                placeholder="Nombre del graduado..."
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Paquete Fotográfico:</label>
                <input
                  type="text"
                  value={stdPackage}
                  onChange={(e) => setStdPackage(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Total de fotos:</label>
                <input
                  type="text"
                  value={stdPhotos}
                  onChange={(e) => setStdPhotos(e.target.value)}
                  placeholder="10 fotos + cuadro"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-teal-50/60 p-3 rounded-xl border border-teal-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Precio Total ($):</label>
                <input
                  type="number"
                  min="0"
                  value={stdTotal}
                  onChange={(e) => setStdTotal(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700">Anticipo Recibido ($):</label>
                <input
                  type="number"
                  min="0"
                  max={stdTotal}
                  value={stdDeposit}
                  onChange={(e) => setStdDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold text-emerald-700 px-3 py-1.5 bg-white border border-emerald-400 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <span className="font-bold text-slate-600">Resto que quedará pendiente:</span>
              <span className="font-mono text-sm font-black text-[#F97800]">
                ${Math.max(0, stdTotal - stdDeposit).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp Padre de Familia:</label>
              <input
                type="tel"
                value={stdPhone}
                onChange={(e) => setStdPhone(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#F97800] hover:bg-[#e06c00] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Registrar Alumno
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
