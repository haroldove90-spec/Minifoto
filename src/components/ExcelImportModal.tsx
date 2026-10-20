import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Database } from 'lucide-react';
import { School, GraduationStudent } from '../types';
import { generateSantanderReference, saveStoredStudents, getStoredStudents, addAuditLog } from '../services/storage';

interface ExcelImportModalProps {
  schools: School[];
  operatorName: string;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  schools,
  operatorName,
  onClose,
  onImportComplete,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [csvText, setCsvText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const sampleTemplate = `Nombre,Matrícula,Grado,Grupo,Tutor,WhatsApp,Paquete,CostoTotal,Anticipo
María González López,202600123,1°,A,Laura López,5512345678,Paquete fotográfico,500,150
José Hernández Ruiz,202600124,1°,A,José Hernández Sr.,5523456789,Paquete fotográfico,450,300
Ana Martínez Pérez,202600125,1°,A,Patricia Pérez,5534567890,Paquete fotográfico,500,500
Carlos Rodríguez Díaz,202600126,1°,A,Carlos Rodríguez,5545678901,Paquete fotográfico,500,0
Sofía García Torres,202600127,1°,A,Silvia Torres,5556789012,Paquete fotográfico,500,250`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_alumnos_minifoto.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvText(sampleTemplate);
  };

  const handleProcessImport = () => {
    if (!csvText.trim()) return;

    setIsProcessing(true);
    try {
      const school = schools.find(s => s.id === selectedSchoolId) || schools[0];
      const schoolName = school ? school.name : 'Escuela General';
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      if (lines.length < 2) {
        setResultMessage('El archivo CSV debe tener al menos una fila de encabezado y una fila de datos.');
        setIsProcessing(false);
        return;
      }

      // Check header or skip header
      const dataRows = lines.slice(1);
      const currentStudents = getStoredStudents();
      const newStudents: GraduationStudent[] = [];

      dataRows.forEach((row, idx) => {
        const cols = row.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) return;

        const name = cols[0] || `Alumno ${idx + 1}`;
        const matricula = cols[1] || `${202600000 + idx + 1}`;
        const grade = cols[2] || '1°';
        const group = cols[3] || 'A';
        const tutor = cols[4] || '';
        const whatsapp = cols[5] || '';
        const packageName = cols[6] || 'Paquete fotográfico';
        const totalAmount = parseFloat(cols[7]) || 500;
        const depositAmount = parseFloat(cols[8]) || 0;
        const remainingAmount = Math.max(0, totalAmount - depositAmount);

        const folio = `MF-${Math.floor(100000 + Math.random() * 900000)}`;
        const santanderRef = generateSantanderReference(schoolName, matricula || folio);

        const newStudent: GraduationStudent = {
          id: `std-imp-${Date.now()}-${idx}`,
          folio,
          matricula,
          studentName: name,
          schoolId: school.id,
          schoolName,
          seasonYear: '2026',
          grade,
          group,
          gradeGroup: `${grade} ${group}`,
          packageName,
          totalPhotos: '6 fotos + Carpeta',
          totalAmount,
          depositAmount,
          remainingAmount,
          santanderReference: santanderRef,
          tutorName: tutor,
          tutorPhone: whatsapp,
          tutorWhatsapp: whatsapp,
          consentWhatsapp: true,
          deliveryStatus: remainingAmount === 0 ? 'listo' : 'pendiente',
          createdAt: new Date().toLocaleDateString('es-MX'),
          paymentHistory: depositAmount > 0 ? [
            {
              id: `pay-init-${idx}`,
              date: new Date().toLocaleDateString('es-MX'),
              concept: depositAmount >= totalAmount ? 'Liquidación Total' : 'Anticipo Inicial',
              amount: depositAmount,
              balanceAfter: remainingAmount,
              method: 'efectivo',
              status: 'completado',
              operatorName,
              terminalId: 'OFICINA-01',
            }
          ] : [],
          whatsappLogs: [],
        };

        newStudents.push(newStudent);
      });

      if (newStudents.length > 0) {
        const combined = [...newStudents, ...currentStudents];
        saveStoredStudents(combined);

        addAuditLog({
          user: operatorName,
          role: 'admin',
          action: 'IMPORTACION_MASIVA_ALUMNOS',
          details: `Importados ${newStudents.length} alumnos para ${schoolName} con referencias Santander automáticas`,
        });

        setResultMessage(`¡Éxito! Se importaron ${newStudents.length} alumnos con sus referencias bancarias Santander.`);
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 1500);
      } else {
        setResultMessage('No se pudieron leer registros válidos del texto ingresado.');
      }
    } catch (err: any) {
      setResultMessage(`Error al procesar: ${err.message || 'Formato inválido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-sm font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Importación Masiva de Alumnos (Excel / CSV)</h3>
              <p className="text-xs text-[#ECB769] font-medium">Asignación automática de referencias Santander</p>
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
          {/* Target School Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Seleccione la Escuela a la que se asignarán los alumnos:
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
            >
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.seasonYear})
                </option>
              ))}
            </select>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FCF9F2] text-[#4E2B01] hover:bg-[#ECB769]/30 rounded-xl font-bold border border-[#ECB769] cursor-pointer transition">
                <Upload className="w-4 h-4 text-[#4E2B01]" />
                <span>Cargar archivo .CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cargar Ejemplo
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 text-[11px] font-bold text-[#4E2B01] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar plantilla CSV
            </button>
          </div>

          {/* CSV Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Vista previa o pegar datos en formato CSV:
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Nombre,Matrícula,Grado,Grupo,Tutor,WhatsApp,Paquete,CostoTotal,Anticipo&#10;María González,202600123,1°,A,Laura López,5512345678,Paquete fotográfico,500,150..."
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
            />
          </div>

          {/* Result message */}
          {resultMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              resultMessage.includes('Éxito') 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {resultMessage.includes('Éxito') ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{resultMessage}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#4E2B01]" />
              Generación de Referencia Bancaria Santander:
            </p>
            <p>
              El sistema generará automáticamente la <strong>Referencia Única Santander</strong> para cada alumno (ej. <code className="font-mono text-[#4E2B01] font-bold">MF-015-000123</code>) para posibilitar los pagos por SPEI y conciliación inmediata.
            </p>
          </div>
        </div>

        {/* Footer */}
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
            onClick={handleProcessImport}
            disabled={!csvText.trim() || isProcessing}
            className="px-5 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4 text-[#ECB769]" />
            {isProcessing ? 'Procesando alumnos...' : 'Importar y Generar Referencias Santander'}
          </button>
        </div>
      </div>
    </div>
  );
};
