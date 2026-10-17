import React, { useState } from 'react';
import { School, GraduationStudent } from '../../types';
import { 
  GraduationCap, 
  Smartphone, 
  CheckCircle2, 
  Printer, 
  Share2, 
  Plus, 
  School as SchoolIcon, 
  Sparkles,
  Banknote,
  Search,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FieldCollectorViewProps {
  schools: School[];
  onAddStudentReceipt: (student: GraduationStudent) => void;
  onOpenTicket: (student: GraduationStudent) => void;
  recentStudents: GraduationStudent[];
  operatorName: string;
}

export const FieldCollectorView: React.FC<FieldCollectorViewProps> = ({
  schools,
  onAddStudentReceipt,
  onOpenTicket,
  recentStudents,
  operatorName,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    schools.length > 0 ? schools[0].id : ''
  );

  // Form states
  const [studentName, setStudentName] = useState('');
  const [gradeGroup, setGradeGroup] = useState('6° A');
  const [packageName, setPackageName] = useState('Paquete Graduación Deluxe (10 Fotos + Cuadro)');
  const [totalPhotos, setTotalPhotos] = useState('10 fotos');
  const [totalAmount, setTotalAmount] = useState<number>(750);
  const [depositAmount, setDepositAmount] = useState<string>('300');
  const [contactPhone, setContactPhone] = useState('');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [isAddingNewSchool, setIsAddingNewSchool] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Package presets for instant selection
  const packagePresets = [
    {
      title: 'Paquete Deluxe 2026',
      photos: '10 fotos + Cuadro',
      price: 750,
      description: 'Panorámica, diploma, fotos con toga y cuadro montado',
    },
    {
      title: 'Paquete Básico 2026',
      photos: '6 fotos + Carpeta',
      price: 450,
      description: 'Panorámica grupal + 4 individuales en carpeta',
    },
    {
      title: 'Foto Panorámica Grupal',
      photos: '1 foto 8x12',
      price: 200,
      description: 'Foto oficial de generación con nombres',
    },
    {
      title: 'Personalizado',
      photos: 'Variable',
      price: 500,
      description: 'Acordado con el comité escolar',
    },
  ];

  const handleSelectPackagePreset = (preset: typeof packagePresets[0]) => {
    setPackageName(preset.title);
    setTotalPhotos(preset.photos);
    setTotalAmount(preset.price);
    // suggest default deposit
    setDepositAmount(Math.round(preset.price * 0.4).toString());
  };

  // Calculations
  const depositNum = parseFloat(depositAmount) || 0;
  const remainingAmount = Math.max(0, totalAmount - depositNum);

  const activeSchool = schools.find((s) => s.id === selectedSchoolId);
  const currentSchoolName = isAddingNewSchool 
    ? customSchoolName 
    : (activeSchool ? activeSchool.name : 'Escuela General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMessage('Por favor ingrese el nombre del alumno para emitir el ticket.');
      return;
    }
    setErrorMessage(null);

    const folioNum = Math.floor(1000 + Math.random() * 9000);
    const folio = `FOL-2026-${folioNum}`;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const newStudent: GraduationStudent = {
      id: `std-${Date.now()}`,
      folio,
      schoolId: selectedSchoolId || 'sch-custom',
      schoolName: currentSchoolName,
      seasonYear: '2026',
      studentName: studentName.trim(),
      gradeGroup: gradeGroup.trim() || 'General',
      packageName,
      totalPhotos,
      totalAmount,
      depositAmount: depositNum,
      remainingAmount,
      deliveryStatus: remainingAmount === 0 ? 'listo' : 'pendiente',
      contactPhone: contactPhone.trim() || undefined,
      createdAt: dateStr,
    };

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch {}

    onAddStudentReceipt(newStudent);
    onOpenTicket(newStudent);

    // Reset student-specific fields
    setStudentName('');
    setContactPhone('');
  };

  // Summary statistics for today's field receipts
  const totalCollectedToday = recentStudents.reduce((sum, s) => sum + s.depositAmount, 0);

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Banner for Field Collector */}
        <div className="bg-linear-to-r from-[#004C59] to-teal-800 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Smartphone className="w-6 h-6 text-[#F97800]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">
                Módulo Vendedor en Campo (Móvil / Tablet)
              </h1>
              <p className="text-xs text-teal-100">
                Registro de alumnos, cobro de anticipos e impresión de tickets en escuelas y eventos
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between sm:justify-start gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Anticipos Hoy</span>
              <span className="text-lg font-extrabold text-white">${totalCollectedToday.toFixed(2)}</span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Recibos</span>
              <span className="text-lg font-extrabold text-amber-300">{recentStudents.length}</span>
            </div>
          </div>
        </div>

        {/* 1. SELECCIÓN DE ESCUELA (Botones directos según requerimiento) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SchoolIcon className="w-5 h-5 text-[#004C59]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Selecciona la Escuela del Alumno
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNewSchool(!isAddingNewSchool)}
              className="text-xs text-[#004C59] font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNewSchool ? 'Ver lista existente' : '+ Otra Escuela'}</span>
            </button>
          </div>

          {isAddingNewSchool ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Nombre de la nueva escuela:</label>
              <input
                type="text"
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
                placeholder="Ej. Escuela Secundaria #45"
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {schools.map((sch) => {
                const isSelected = selectedSchoolId === sch.id;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => setSelectedSchoolId(sch.id)}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer flex flex-col justify-between min-h-[75px] ${
                      isSelected
                        ? 'border-[#004C59] bg-[#004C59]/10 text-[#004C59] shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="line-clamp-2">{sch.name}</span>
                    <span className="text-[10px] text-slate-600 font-normal">
                      Temporada {sch.seasonYear}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. FORMULARIO DE REGISTRO DEL ALUMNO Y ANTICIPO */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#F97800]" />
              <span>Datos del Alumno & Anticipo</span>
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">
              Folio: Nuevo
            </span>
          </div>

          {/* Student Name & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre Completo del Alumno *</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ej. Emiliano Hernández Gómez"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Grado y Grupo *</label>
              <input
                type="text"
                required
                value={gradeGroup}
                onChange={(e) => setGradeGroup(e.target.value)}
                placeholder="Ej. 6° B"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-medium"
              />
            </div>
          </div>

          {/* Package Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Seleccionar Paquete de Graduación:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {packagePresets.map((preset, idx) => {
                const isSelected = packageName === preset.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPackagePreset(preset)}
                    className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-[#F97800] bg-orange-50/60 ring-1 ring-[#F97800]'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{preset.title}</span>
                      <span className="font-extrabold text-xs text-[#004C59]">${preset.price}</span>
                    </div>
                    <span className="text-[11px] text-[#F97800] font-semibold block mt-0.5">
                      {preset.photos}
                    </span>
                    <p className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package Customization & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Total de Fotos del Paquete:</label>
              <input
                type="text"
                value={totalPhotos}
                onChange={(e) => setTotalPhotos(e.target.value)}
                placeholder="Ej. 10 fotos + cuadro"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Precio Total Acordado ($):</label>
              <input
                type="number"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>
          </div>

          {/* Anticipo & Resto Calculation (Crucial field per user request) */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#004C59] font-bold text-sm">
              <Banknote className="w-5 h-5" />
              <span>Cobro de Anticipo y Cálculo de Resto</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Anticipo input */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Anticipo Recibido ($):</label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-black text-emerald-700 bg-white border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Fast touch buttons for anticipo */}
              <div className="sm:col-span-2 flex flex-col justify-end space-y-1">
                <span className="text-[11px] font-bold text-slate-500">Monto rápido de anticipo:</span>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDepositAmount('200')}
                    className="py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-700 active:scale-95"
                  >
                    $200
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount('300')}
                    className="py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-700 active:scale-95"
                  >
                    $300
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount('500')}
                    className="py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-700 active:scale-95"
                  >
                    $500
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(totalAmount.toString())}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg active:scale-95 shadow-xs"
                  >
                    Totalidad
                  </button>
                </div>
              </div>
            </div>

            {/* Resto Display */}
            <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase block">Resto por Liquidar:</span>
                <span className="text-[11px] text-slate-500">Saldo pendiente al entregar fotografías</span>
              </div>
              <span className="text-2xl font-black text-[#F97800]">
                ${remainingAmount.toFixed(2)}
              </span>
            </div>

            {/* Optional parent phone for WhatsApp receipt */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-slate-700">
                Teléfono del Padre / Tutor (para ticket por WhatsApp):
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ej. 55 1234 5678"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON: Generates the exact receipt required */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-[#004C59] hover:bg-[#003842] active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-5 h-5 text-[#F97800]" />
            <span>REGISTRAR Y EMITIR TICKET PORTÁTIL</span>
          </button>
        </form>

        {/* 3. LISTA DE RECIBOS EMITIDOS HOY POR EL COBRADOR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F97800]" />
              <span>Recibos Recientes Emitidos en Campo</span>
            </h3>
            <span className="text-xs text-slate-500">{recentStudents.length} registrados</span>
          </div>

          {recentStudents.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">
              Aún no has registrado ningún alumno en este turno.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 p-2 rounded-xl transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {student.studentName}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                        {student.folio}
                      </span>
                    </div>
                    <p className="text-xs text-[#004C59] font-medium">
                      {student.schoolName} • {student.gradeGroup}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Total: ${student.totalAmount} | Anticipo: <strong className="text-emerald-700">${student.depositAmount}</strong> | Resto: <strong className="text-[#F97800]">${student.remainingAmount}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenTicket(student)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#004C59]/10 hover:bg-[#004C59]/20 text-[#004C59] text-xs font-bold rounded-lg transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ver Ticket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
