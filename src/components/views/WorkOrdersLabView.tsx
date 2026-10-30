import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  WorkOrder, 
  ClientPhoto, 
  LabOrderStatus, 
  Sale, 
  BrandConfig, 
  Role 
} from '../../types';
import { 
  Search, 
  QrCode, 
  Barcode, 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  User, 
  Phone, 
  Calendar, 
  Maximize2, 
  RotateCw, 
  X, 
  Check, 
  ExternalLink, 
  FolderPlus, 
  FileText, 
  Receipt, 
  RefreshCw, 
  Filter, 
  ChevronRight,
  ArrowUpDown,
  Send,
  Volume2
} from 'lucide-react';
import { 
  getStoredWorkOrders, 
  saveStoredWorkOrders, 
  updateWorkOrderStatus, 
  addClientPhotoToWorkOrder, 
  deleteClientPhotoFromWorkOrder, 
  getWorkOrderByFolio 
} from '../../services/storage';
import { 
  uploadClientPhotoToSupabase, 
  deleteClientPhotoFromSupabase, 
  saveWorkOrderToSupabase, 
  fetchWorkOrdersFromSupabase 
} from '../../services/supabaseClient';
import { BarcodeSVG, QRCodeSVG } from '../BarcodeAndQR';

interface WorkOrdersLabViewProps {
  workOrders: WorkOrder[];
  onUpdateWorkOrders: (orders: WorkOrder[]) => void;
  onOpenSaleTicket: (sale: Sale) => void;
  brand: BrandConfig;
  currentRole: Role;
  operatorName: string;
}

// Synthesize pleasant scanner beep with Web Audio API (no external file needed)
const playScannerBeep = (isSuccess = true) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSuccess ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuccess ? 1760 : 350, ctx.currentTime); // A6 or low buzz
    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(2637, ctx.currentTime + 0.08); // E7
    }

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {}
};

export const WorkOrdersLabView: React.FC<WorkOrdersLabViewProps> = ({
  workOrders,
  onUpdateWorkOrders,
  onOpenSaleTicket,
  brand,
  currentRole,
  operatorName,
}) => {
  // Navigation & Filter States
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'urgente'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Scanner Bar & Gun Listener States
  const [scanInputText, setScanInputText] = useState('');
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Photo Management States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<ClientPhoto | null>(null);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print States
  const [showTechnicalOrderModal, setShowTechnicalOrderModal] = useState(false);
  const [showPhotoPrintModal, setShowPhotoPrintModal] = useState(false);
  const [photoPrintLayout, setPhotoPrintLayout] = useState<'full' | 'infantil6' | 'diploma2' | 'grid4'>('full');
  const [selectedPhotoForPrint, setSelectedPhotoForPrint] = useState<ClientPhoto | null>(null);

  // Keep selected order updated when workOrders changes
  useEffect(() => {
    if (selectedOrder) {
      const fresh = workOrders.find((w) => w.id === selectedOrder.id || w.folio === selectedOrder.folio);
      if (fresh) {
        setSelectedOrder(fresh);
      }
    }
  }, [workOrders]);

  // Global Barcode Scanner Gun Listener
  // Barcode guns type very quickly followed by 'Enter'
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside standard inputs unless it's the barcode reader input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Reset buffer if delay is too long (human typing is > 80ms, barcode guns type < 35ms)
      if (diff > 120) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleProcessScannedCode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [workOrders]);

  // Process Scanned Code from Gun or Manual Input
  const handleProcessScannedCode = (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    if (!clean) return;

    // Search by folio in orders
    const matched = workOrders.find((w) => {
      const wFolioClean = w.folio.toUpperCase().replace(/[^0-9A-Z]/g, '');
      const searchClean = clean.replace(/[^0-9A-Z]/g, '');
      return (
        w.folio.toUpperCase() === clean ||
        wFolioClean === searchClean ||
        w.id === clean ||
        (w.clientPhone && w.clientPhone.replace(/\D/g, '') === clean.replace(/\D/g, ''))
      );
    });

    if (matched) {
      playScannerBeep(true);
      setSelectedOrder(matched);
      setScannerNotice(`¡Orden #${matched.folio} encontrada y cargada!`);
      setScanInputText('');
      setTimeout(() => setScannerNotice(null), 3500);
    } else {
      playScannerBeep(false);
      setScannerNotice(`No se encontró ninguna orden con el código "${clean}".`);
      setTimeout(() => setScannerNotice(null), 3500);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Status filter
      if (activeFilter === 'urgente') {
        if (wo.urgency !== 'urgente') return false;
      } else if (activeFilter !== 'todos') {
        if (wo.labStatus !== activeFilter) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inFolio = wo.folio.toLowerCase().includes(q);
        const inClient = (wo.clientName || '').toLowerCase().includes(q);
        const inPhone = (wo.clientPhone || '').toLowerCase().includes(q);
        const inSchool = (wo.schoolName || '').toLowerCase().includes(q);
        const inItems = wo.items.some((it) => it.name.toLowerCase().includes(q));
        if (!inFolio && !inClient && !inPhone && !inSchool && !inItems) {
          return false;
        }
      }

      return true;
    });
  }, [workOrders, activeFilter, searchQuery]);

  // Status counts
  const counts = useMemo(() => {
    return {
      todos: workOrders.length,
      pendiente: workOrders.filter((w) => w.labStatus === 'pendiente').length,
      en_proceso: workOrders.filter((w) => w.labStatus === 'en_proceso').length,
      listo: workOrders.filter((w) => w.labStatus === 'listo').length,
      entregado: workOrders.filter((w) => w.labStatus === 'entregado').length,
      urgente: workOrders.filter((w) => w.urgency === 'urgente').length,
    };
  }, [workOrders]);

  // Change Status of Order
  const handleChangeStatus = (orderId: string, newStatus: LabOrderStatus) => {
    const updated = updateWorkOrderStatus(orderId, newStatus);
    onUpdateWorkOrders(updated);
    const target = updated.find((w) => w.id === orderId);
    if (target) {
      saveWorkOrderToSupabase(target);
    }
  };

  // Universal Process Files (Works reliably on Mac Safari/Chrome, Windows, iOS & Android)
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !selectedOrder) return;
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|heic|heif|tiff?|bmp|gif)$/i.test(f.name)
    );

    if (fileArray.length === 0) {
      alert('Por favor selecciona archivos de imagen válidos (JPG, PNG, HEIC, WebP).');
      return;
    }

    setIsUploading(true);
    setUploadProgressText(`Cargando ${fileArray.length} fotografía(s)...`);

    try {
      let currentOrderState = selectedOrder;

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgressText(`Guardando fotografía ${i + 1} de ${fileArray.length} en Supabase...`);

        const res = await uploadClientPhotoToSupabase(selectedOrder.folio, file);

        if (res.success && res.url) {
          const newPhoto: ClientPhoto = {
            id: res.photoId,
            clientFolio: selectedOrder.folio,
            url: res.url,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          };

          const updatedOrder = addClientPhotoToWorkOrder(selectedOrder.folio, newPhoto);
          if (updatedOrder) {
            currentOrderState = updatedOrder;
            setSelectedOrder(updatedOrder);
            // Sync updated work order to Supabase
            saveWorkOrderToSupabase(updatedOrder);
          }
        }
      }

      const freshAll = getStoredWorkOrders();
      onUpdateWorkOrders(freshAll);
      setScannerNotice(`¡${fileArray.length} fotografía(s) guardadas correctamente!`);
      setTimeout(() => setScannerNotice(null), 3000);
    } catch (err) {
      console.error('Error cargando fotografías:', err);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete Client Photo
  const handleDeletePhoto = async (photo: ClientPhoto) => {
    if (!selectedOrder) return;
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la fotografía "${photo.fileName}"?`);
    if (!confirmDelete) return;

    try {
      const updatedOrder = deleteClientPhotoFromWorkOrder(selectedOrder.folio, photo.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
        saveWorkOrderToSupabase(updatedOrder);
      }
      await deleteClientPhotoFromSupabase(photo.id, photo.url);

      const freshAll = getStoredWorkOrders();
      onUpdateWorkOrders(freshAll);
      if (lightboxPhoto?.id === photo.id) {
        setLightboxPhoto(null);
      }
    } catch (err) {
      console.error('Error al borrar fotografía:', err);
    }
  };

  // Single Photo Download
  const handleDownloadPhoto = (photo: ClientPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${selectedOrder?.folio || 'FOTO'}_${photo.fileName.replace(/\s+/g, '_')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch Download All Photos for Customer
  const handleDownloadAllPhotos = () => {
    if (!selectedOrder || !selectedOrder.photos || selectedOrder.photos.length === 0) return;
    selectedOrder.photos.forEach((photo, idx) => {
      setTimeout(() => {
        handleDownloadPhoto(photo);
      }, idx * 250);
    });
  };

  // Open Technical Studio Order Print View
  const handlePrintTechnicalOrder = () => {
    setShowTechnicalOrderModal(true);
  };

  // Open Purchase Ticket
  const handleOpenPurchaseTicket = () => {
    if (!selectedOrder) return;
    const syntheticSale: Sale = {
      id: selectedOrder.saleId || selectedOrder.id,
      folio: selectedOrder.folio,
      date: selectedOrder.date,
      role: 'cashier',
      operatorName: selectedOrder.operatorName || operatorName,
      clientName: selectedOrder.clientName,
      clientPhone: selectedOrder.clientPhone,
      clientEmail: selectedOrder.clientEmail,
      schoolName: selectedOrder.schoolName,
      items: selectedOrder.items,
      subtotal: selectedOrder.total,
      discount: 0,
      total: selectedOrder.total,
      paymentMethod: selectedOrder.paymentMethod,
      amountPaid: selectedOrder.amountPaid,
      change: 0,
      depositAmount: selectedOrder.depositAmount,
      remainingAmount: selectedOrder.remainingAmount,
      status: selectedOrder.remainingAmount === 0 ? 'liquidado' : 'anticipo',
      notes: selectedOrder.notes,
      photoSpecs: selectedOrder.photoSpecs,
    };
    onOpenSaleTicket(syntheticSale);
  };

  // Trigger browser print for printable section
  const triggerPrintWindow = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${brand.businessName} - Impresión</title>
          <style>
            @page {
              size: auto;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            .print-page { page-break-after: always; }
            img { max-width: 100%; height: auto; }
            .cut-guide {
              border: 1px dashed #bbb;
              position: relative;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FCF9F2] overflow-hidden select-none">
      {/* =========================================================================
          TOP ACTION BAR: PISTOLA LECTORA, ESCÁNER Y ESTADÍSTICAS
      ========================================================================= */}
      <div className="bg-white border-b border-[#ECB769]/40 p-3 sm:p-4 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Module Title & Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-[#ECB769]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-[#202020] tracking-tight">
                  {currentRole === 'impresor' ? 'Impresor & Órdenes de Trabajo' : 'Laboratorio & Órdenes de Trabajo'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#4E2B01] text-[#FFF3BC] uppercase tracking-wider">
                  {currentRole === 'impresor' ? 'Rol Impresor' : 'Rol Laboratorio'}
                </span>
              </div>
              <p className="text-xs text-[#4E2B01]/80 font-medium">
                {currentRole === 'impresor'
                  ? 'Escáner de código de barras/QR, visualización de tickets, fotos e impresión de pedidos'
                  : 'Control de revelado, tickets POS, retoques fotográficos y fotos por cliente'}
              </p>
            </div>
          </div>

          {/* Quick Scanner Gun Input & Camera Trigger */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScannedCode(scanInputText);
              }}
              className="relative flex-1"
            >
              <div className="relative">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInputText}
                  onChange={(e) => setScanInputText(e.target.value)}
                  placeholder="Escanear con Pistola Lectora 1D / 2D o ingresar Folio..."
                  className="w-full pl-10 pr-20 py-2.5 bg-[#FCF9F2] border-2 border-[#4E2B01]/30 focus:border-[#4E2B01] focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-[#202020] placeholder-slate-500 shadow-inner outline-hidden transition"
                />
                <Barcode className="w-4 h-4 text-[#4E2B01] absolute left-3 top-3" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#4E2B01] text-[#FFF3BC] rounded-lg text-xs font-bold hover:bg-[#381f01] transition cursor-pointer"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Camera QR Scanner Simulation Button */}
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="p-2.5 bg-[#FFF3BC] text-[#4E2B01] hover:bg-[#ECB769]/40 border border-[#ECB769] rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs shrink-0"
              title="Escanear con Cámara del Dispositivo"
            >
              <QrCode className="w-4 h-4 text-[#4E2B01]" />
              <span className="hidden sm:inline">Cámara</span>
            </button>
          </div>
        </div>

        {/* Scanner Feedback Notification */}
        {scannerNotice && (
          <div className="mt-2 p-2 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#4E2B01]" />
              <span>{scannerNotice}</span>
            </div>
            <button onClick={() => setScannerNotice(null)} className="text-amber-800 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Filter Tabs Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'todos'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FCF9F2] border border-slate-200'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.todos}</span>
          </button>

          <button
            onClick={() => setActiveFilter('pendiente')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'pendiente'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FCF9F2] border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.pendiente}</span>
          </button>

          <button
            onClick={() => setActiveFilter('en_proceso')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'en_proceso'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FCF9F2] border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>En Retoque</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.en_proceso}</span>
          </button>

          <button
            onClick={() => setActiveFilter('listo')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'listo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FCF9F2] border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Listos para Impresión</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.listo}</span>
          </button>

          <button
            onClick={() => setActiveFilter('entregado')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'entregado'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FCF9F2] border border-slate-200'
            }`}
          >
            <span>Entregados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.entregado}</span>
          </button>

          <button
            onClick={() => setActiveFilter('urgente')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'urgente'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Urgentes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15">{counts.urgente}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE: TWO-COLUMN LAYOUT (ORDERS LIST + CLIENT PHOTO SECTION)
      ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: LIST OF WORK ORDERS & TICKETS */}
        <div className={`lg:w-2/5 xl:w-5/12 flex flex-col border-r border-[#ECB769]/30 bg-white overflow-hidden ${
          selectedOrder ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Quick List Search */}
          <div className="p-3 border-b border-slate-200 bg-[#FCF9F2]/50 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por cliente, teléfono, producto..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-[#4E2B01]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
              {filteredOrders.length} orden(es)
            </span>
          </div>

          {/* Orders Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600">No hay órdenes de trabajo</p>
                <p className="text-xs text-slate-400 mt-1">
                  Los tickets emitidos en el POS aparecerán automáticamente aquí.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const photoCount = order.photos?.length || 0;
                const hasRetoque = order.items.some((it) => it.options?.retoque);

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4E2B01] bg-[#FFF3BC]/30 shadow-md ring-1 ring-[#4E2B01]'
                        : 'border-slate-200 bg-white hover:border-[#ECB769] hover:bg-slate-50'
                    }`}
                  >
                    {/* Header: Folio & Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#4E2B01] text-[#FFF3BC]">
                          #{order.folio}
                        </span>
                        {order.urgency === 'urgente' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                            URGENTE
                          </span>
                        )}
                        {hasRetoque && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Retoque
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.labStatus === 'pendiente'
                            ? 'bg-amber-100 text-amber-800'
                            : order.labStatus === 'en_proceso'
                            ? 'bg-blue-100 text-blue-800'
                            : order.labStatus === 'listo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {order.labStatus === 'pendiente'
                          ? 'Pendiente'
                          : order.labStatus === 'en_proceso'
                          ? 'En Retoque'
                          : order.labStatus === 'listo'
                          ? 'Listo p/ Imprimir'
                          : 'Entregado'}
                      </span>
                    </div>

                    {/* Client & Date */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-black text-[#202020] leading-tight">
                          {order.clientName || 'Cliente Mostrador'}
                        </h3>
                        {order.clientPhone && (
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#4E2B01]" />
                            {order.clientPhone}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {order.date}
                      </span>
                    </div>

                    {/* Items Requested */}
                    <div className="bg-[#FCF9F2] p-2 rounded-xl border border-[#ECB769]/30 text-xs text-slate-700 mb-2">
                      <div className="font-bold text-[11px] text-[#4E2B01] truncate mb-0.5">
                        {order.items.map((it) => `${it.quantity}x ${it.name}`).join(' • ')}
                      </div>
                      {order.photoSpecs?.childName && (
                        <div className="text-[10px] text-slate-600">
                          👶 Modelo Caritas: {order.photoSpecs.childName} ({order.photoSpecs.caritaModel || 'Estándar'})
                        </div>
                      )}
                      {order.photoSpecs?.ampliacionFormat && (
                        <div className="text-[10px] text-slate-600">
                          📐 Formato: {order.photoSpecs.ampliacionFormat}"
                        </div>
                      )}
                    </div>

                    {/* Footer: Photos counter and actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Camera className="w-3.5 h-3.5 text-[#ECB769]" />
                        <span>
                          {photoCount === 0 ? 'Sin fotos aún' : `${photoCount} foto(s)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#4E2B01]">
                          ${order.total.toFixed(2)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DEDICATED CLIENT SECTION (PHOTOS, SPECS, QR, UPLOAD, PRINT) */}
        <div className={`flex-1 flex flex-col bg-[#FCF9F2] overflow-y-auto ${
          selectedOrder ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedOrder ? (
            <div className="p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
              
              {/* Back button on mobile */}
              <div className="lg:hidden flex items-center justify-between pb-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#4E2B01] flex items-center gap-1"
                >
                  ← Volver a lista de órdenes
                </button>
              </div>

              {/* CLIENT HEADER BANNER */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#4E2B01] shadow-md relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Client Identification */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF3BC] border-2 border-[#ECB769] flex items-center justify-center shrink-0 shadow-sm">
                      <User className="w-8 h-8 text-[#4E2B01]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-[#202020]">
                          {selectedOrder.clientName || 'Cliente Mostrador'}
                        </h2>
                        <span className="font-mono font-black text-xs px-2.5 py-1 bg-[#4E2B01] text-[#FFF3BC] rounded-lg">
                          Folio: {selectedOrder.folio}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1 flex-wrap">
                        {selectedOrder.clientPhone && (
                          <a
                            href={`https://wa.me/52${selectedOrder.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {selectedOrder.clientPhone} (WhatsApp)
                          </a>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#4E2B01]" />
                          Pedido: {selectedOrder.date}
                        </span>
                        {selectedOrder.schoolName && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-[#4E2B01]">
                              {selectedOrder.schoolName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown & Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    {/* Status Changer */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Estado del Trabajo
                      </label>
                      <select
                        value={selectedOrder.labStatus}
                        onChange={(e) => handleChangeStatus(selectedOrder.id, e.target.value as LabOrderStatus)}
                        className="px-3 py-2 bg-[#FCF9F2] border-2 border-[#4E2B01] rounded-xl text-xs font-black text-[#4E2B01] cursor-pointer outline-hidden shadow-xs"
                      >
                        <option value="pendiente">⏳ Pendiente de Edición</option>
                        <option value="en_proceso">✨ En Retoque / Proceso</option>
                        <option value="listo">🖨️ Listo para Impresión</option>
                        <option value="entregado">✅ Entregado al Cliente</option>
                      </select>
                    </div>

                    {/* View Technical Studio Order Button */}
                    <button
                      onClick={handlePrintTechnicalOrder}
                      className="px-3.5 py-2.5 bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs mt-auto"
                      title="Ver Orden de Trabajo Técnica"
                    >
                      <FileText className="w-4 h-4 text-[#ECB769]" />
                      <span>Orden de Trabajo</span>
                    </button>

                    {/* View Thermal Ticket Button */}
                    <button
                      onClick={handleOpenPurchaseTicket}
                      className="px-3.5 py-2.5 bg-[#FFF3BC] text-[#4E2B01] hover:bg-[#ECB769]/50 border border-[#ECB769] rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs mt-auto"
                      title="Ver Ticket de Compra Oficial"
                    >
                      <Receipt className="w-4 h-4 text-[#4E2B01]" />
                      <span>Ticket de Compra</span>
                    </button>
                  </div>
                </div>

                {/* QR Code & Barcode of the Client Order */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FCF9F2] p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <QRCodeSVG data={selectedOrder.folio} size={68} />
                    <div>
                      <div className="text-xs font-black text-[#4E2B01]">
                        Código QR y Barras de Identificación
                      </div>
                      <p className="text-[11px] text-slate-600 max-w-sm mt-0.5">
                        Escanea este código con la pistola lectora o la cámara para acceder directamente a la sección de este cliente.
                      </p>
                    </div>
                  </div>
                  <BarcodeSVG value={selectedOrder.folio} width={180} height={40} showText={true} />
                </div>
              </div>

              {/* TECHNICAL JOB SPECIFICATIONS (CARITAS, FOTO ESTUDIO, RETOQUE, FONDOS) */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-black text-[#4E2B01] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ECB769]" />
                  Especificaciones Técnicas del Pedido
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedOrder.items.map((item, idx) => {
                    const specs = item.options.photoSpecs;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#FCF9F2] rounded-2xl border border-[#ECB769]/40 space-y-1.5"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-black text-xs text-[#202020]">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-xs font-bold text-[#4E2B01]">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Extra Options Chips */}
                        <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                          {item.options.retoque && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              + Retoque Digital
                            </span>
                          )}
                          {item.options.autoAdherible && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              + Auto-Adherible
                            </span>
                          )}
                        </div>

                        {/* Specific Studio Form Attributes */}
                        {specs?.childName && (
                          <div className="text-[11px] text-slate-700">
                            <strong>Niño:</strong> {specs.childName} | Mod: {specs.caritaModel || 'Estándar'}
                          </div>
                        )}
                        {specs?.ampliacionFormat && (
                          <div className="text-[11px] text-slate-700">
                            <strong>Formato Ampliación:</strong> {specs.ampliacionFormat}"
                          </div>
                        )}
                        {specs?.cambioFondoSize && (
                          <div className="text-[11px] text-slate-700">
                            <strong>Cambio de Fondo:</strong> {specs.cambioFondoSize}" {specs.customText ? `(Texto: "${specs.customText}")` : ''}
                          </div>
                        )}
                        {item.options.notes && (
                          <div className="text-[11px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                            <em>"{item.options.notes}"</em>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CLIENT PHOTO GALLERY & UPLOADER (SUBIR, VER, BORRAR, DESCARGAR, IMPRIMIR) */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                {/* Gallery Header with Upload & Batch Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#202020] flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#4E2B01]" />
                      Galería de Fotografías del Cliente
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fotografías guardadas en Supabase listas para revelado, retoque e impresión
                    </p>
                  </div>

                  {/* Actions: Upload, Download All, Print Sheet */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Native Offscreen File Input (Mac Safari/Chrome & Windows compatible) */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff,.bmp"
                      style={{
                        position: 'fixed',
                        top: '-9999px',
                        left: '-9999px',
                        opacity: 0,
                        width: '1px',
                        height: '1px',
                        pointerEvents: 'none',
                      }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processFiles(e.target.files);
                        }
                      }}
                    />

                    {/* Button Trigger (Works 100% on Mac Finder, Safari, Chrome & Mobile) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`px-4 py-2 bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] active:scale-95 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs ${
                        isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                      }`}
                      title="Subir fotos desde Mac, PC o celular"
                    >
                      <Upload className="w-4 h-4 text-[#ECB769]" />
                      <span>{isUploading ? 'Subiendo...' : 'Subir Fotos'}</span>
                    </button>

                    {/* Print Photos Sheet */}
                    {selectedOrder.photos && selectedOrder.photos.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPhotoForPrint(null);
                            setShowPhotoPrintModal(true);
                          }}
                          className="px-3.5 py-2 bg-[#FFF3BC] text-[#4E2B01] hover:bg-[#ECB769]/50 border border-[#ECB769] rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Imprimir Fotografías en Hoja de Impresión"
                        >
                          <Printer className="w-4 h-4 text-[#4E2B01]" />
                          <span>Imprimir Fotos</span>
                        </button>

                        <button
                          onClick={handleDownloadAllPhotos}
                          className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Descargar Todas las Fotos a la Computadora"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar Todo</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Uploading Status Banner */}
                {isUploading && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#4E2B01] animate-spin" />
                    <span className="text-xs font-black text-[#4E2B01]">
                      {uploadProgressText || 'Subiendo fotografías a Supabase...'}
                    </span>
                  </div>
                )}

                {/* Photos Grid or Drag & Drop Empty Dropzone */}
                {!selectedOrder.photos || selectedOrder.photos.length === 0 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOver(false);
                      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processFiles(e.dataTransfer.files);
                      }
                    }}
                    className={`p-8 sm:p-12 border-2 border-dashed rounded-3xl text-center transition-all ${
                      isDraggingOver
                        ? 'border-[#4E2B01] bg-[#FFF3BC]/50 scale-[1.01]'
                        : 'border-[#ECB769]/60 bg-[#FCF9F2]'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF3BC] border border-[#ECB769] flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <Upload className={`w-8 h-8 text-[#4E2B01] transition-transform ${isDraggingOver ? 'scale-125' : ''}`} />
                    </div>
                    <h4 className="text-sm font-black text-[#4E2B01]">
                      {isDraggingOver ? '¡Suelta las fotos aquí!' : 'No hay fotografías cargadas para este cliente'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                      Sube o arrastra las fotos desde tu Mac (Finder), PC o celular. Soporta JPG, PNG, HEIC, WebP.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-5 py-2.5 bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] active:scale-95 rounded-xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md transition"
                    >
                      <FolderPlus className="w-4 h-4 text-[#ECB769]" />
                      <span>{isUploading ? 'Procesando...' : 'Seleccionar Fotos del Dispositivo'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {selectedOrder.photos.map((photo, pIdx) => (
                      <div
                        key={photo.id || pIdx}
                        className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-[#4E2B01] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Photo Image Card */}
                        <div 
                          onClick={() => {
                            setPhotoRotation(0);
                            setLightboxPhoto(photo);
                          }}
                          className="relative aspect-4/3 sm:aspect-square bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center"
                        >
                          <img
                            src={photo.url}
                            alt={photo.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="p-2 bg-white/90 rounded-full text-slate-800 shadow-sm">
                              <Eye className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        {/* File Details & Action Buttons */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between bg-white border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-800 truncate" title={photo.fileName}>
                            {photo.fileName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>
                              {photo.fileSize ? `${(photo.fileSize / 1024).toFixed(0)} KB` : 'Foto HD'}
                            </span>
                            <span>
                              {new Date(photo.uploadedAt).toLocaleDateString('es-MX')}
                            </span>
                          </div>

                          {/* Action Toolbar on Each Photo */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                            {/* View / Lightbox */}
                            <button
                              onClick={() => {
                                setPhotoRotation(0);
                                setLightboxPhoto(photo);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#4E2B01] transition"
                              title="Ver en Grande"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>

                            {/* Download Single */}
                            <button
                              onClick={() => handleDownloadPhoto(photo)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#4E2B01] transition"
                              title="Descargar Foto"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Print Single Photo */}
                            <button
                              onClick={() => {
                                setSelectedPhotoForPrint(photo);
                                setShowPhotoPrintModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#4E2B01] transition"
                              title="Imprimir esta Fotografía"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Delete Photo */}
                            <button
                              onClick={() => handleDeletePhoto(photo)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                              title="Eliminar Fotografía"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-20 h-20 rounded-3xl bg-[#FFF3BC] border-2 border-[#ECB769] flex items-center justify-center mb-4 shadow-sm">
                <Barcode className="w-10 h-10 text-[#4E2B01]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#202020]">
                Ninguna orden seleccionada
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Usa la pistola lectora de código de barras, escanea un QR o selecciona una orden de la lista para ver sus fotos y especificaciones.
              </p>
              <button
                onClick={() => scanInputRef.current?.focus()}
                className="px-4 py-2 bg-[#4E2B01] text-[#FFF3BC] rounded-xl text-xs font-black shadow-xs hover:bg-[#381f01] transition"
              >
                Activar Pistola Lectora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          LIGHTBOX MODAL: FULL RESOLUTION VIEWER (ZOOM, ROTATE, DOWNLOAD, PRINT)
      ========================================================================= */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h4 className="text-sm font-black text-white">{lightboxPhoto.fileName}</h4>
              <p className="text-xs text-slate-400">
                Cliente: {selectedOrder?.clientName} (Folio: #{selectedOrder?.folio})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Girar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownloadPhoto(lightboxPhoto)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Descargar Foto"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedPhotoForPrint(lightboxPhoto);
                  setShowPhotoPrintModal(true);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Imprimir Foto"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
                title="Cerrar Visor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Photo Preview Center */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-6 max-h-[80vh] overflow-hidden">
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.fileName}
              style={{ transform: `rotate(${photoRotation}deg)` }}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
            />
          </div>

          {/* Bottom Bar Info */}
          <div className="text-xs text-slate-400 text-center pt-2">
            Usa el botón de imprimir para generar plantillas de tamaño oficial (Infantil, Óvalo, Diploma, Ampliación).
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT MODAL: PHOTO PRINTING TEMPLATES (AMPLIACIÓN, INFANTILES 6X, ETC.)
      ========================================================================= */}
      {showPhotoPrintModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-[#4E2B01] max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#202020] flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#4E2B01]" />
                  Impresión de Fotografías - Cliente #{selectedOrder.folio}
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona la plantilla fotográfica requerida para laboratorio
                </p>
              </div>
              <button
                onClick={() => setShowPhotoPrintModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="flex items-center gap-2 my-3 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setPhotoPrintLayout('full')}
                className={`px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  photoPrintLayout === 'full'
                    ? 'bg-[#4E2B01] text-[#FFF3BC]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1 Foto Ampliación (Página Completa)
              </button>

              <button
                onClick={() => setPhotoPrintLayout('infantil6')}
                className={`px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  photoPrintLayout === 'infantil6'
                    ? 'bg-[#4E2B01] text-[#FFF3BC]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                6 Fotos Infantiles (Con Guías de Corte)
              </button>

              <button
                onClick={() => setPhotoPrintLayout('diploma2')}
                className={`px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  photoPrintLayout === 'diploma2'
                    ? 'bg-[#4E2B01] text-[#FFF3BC]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2 Fotos Diploma / Título (5x7")
              </button>

              <button
                onClick={() => setPhotoPrintLayout('grid4')}
                className={`px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  photoPrintLayout === 'grid4'
                    ? 'bg-[#4E2B01] text-[#FFF3BC]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Mosaico 4 Fotos
              </button>
            </div>

            {/* Print Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-2xl border border-slate-300 flex items-center justify-center">
              <div
                id="photo-printable-area"
                className="bg-white p-4 sm:p-6 shadow-md max-w-lg w-full text-center border border-slate-300"
              >
                {/* Print Sheet Header / Lab Identification */}
                <div className="border-b border-dashed border-slate-300 pb-2 mb-3 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>{brand.businessName} • Laboratorio Fotográfico</span>
                  <span>Folio: #{selectedOrder.folio} • {selectedOrder.clientName}</span>
                </div>

                {/* Selected Photo Image URL */}
                {(() => {
                  const printPhoto = selectedPhotoForPrint || selectedOrder.photos[0];
                  if (!printPhoto) {
                    return <p className="text-xs text-slate-400 py-8">No hay fotografía para imprimir.</p>;
                  }

                  if (photoPrintLayout === 'full') {
                    return (
                      <div className="flex flex-col items-center">
                        <img
                          src={printPhoto.url}
                          alt="Ampliación"
                          className="max-h-[380px] w-auto object-contain border border-slate-200"
                        />
                        <span className="text-[10px] text-slate-500 mt-2 font-mono">
                          Ampliación Fotográfica #{selectedOrder.folio} - {selectedOrder.clientName}
                        </span>
                      </div>
                    );
                  }

                  if (photoPrintLayout === 'infantil6') {
                    return (
                      <div>
                        <div className="grid grid-cols-3 gap-3 p-2 border border-dashed border-slate-400">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center border border-slate-300 p-1 bg-white">
                              <img
                                src={printPhoto.url}
                                alt={`Infantil ${i + 1}`}
                                className="h-28 w-20 object-cover"
                              />
                              <span className="text-[8px] text-slate-400 mt-0.5">3 x 2.5 cm</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2">
                          Plantilla oficial 6 fotos infantiles estándar con líneas de corte.
                        </p>
                      </div>
                    );
                  }

                  if (photoPrintLayout === 'diploma2') {
                    return (
                      <div className="grid grid-cols-2 gap-4 p-2 border border-dashed border-slate-400">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center border border-slate-300 p-1.5 bg-white">
                            <img
                              src={printPhoto.url}
                              alt={`Diploma ${i + 1}`}
                              className="h-44 w-32 object-cover"
                            />
                            <span className="text-[9px] text-slate-400 mt-1">Formato Diploma 5x7"</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (photoPrintLayout === 'grid4') {
                    const photosToDisplay = selectedOrder.photos.slice(0, 4);
                    return (
                      <div className="grid grid-cols-2 gap-3 p-2 border border-dashed border-slate-400">
                        {photosToDisplay.map((p, i) => (
                          <div key={i} className="flex flex-col items-center border border-slate-300 p-1 bg-white">
                            <img src={p.url} alt={`Mosaico ${i + 1}`} className="h-32 w-auto object-cover" />
                            <span className="text-[8px] text-slate-500 mt-0.5 truncate max-w-[120px]">{p.fileName}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Print Sheet Footer with Barcode */}
                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Impreso en Laboratorio Minifoto</span>
                  <span>{new Date().toLocaleDateString('es-MX')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-3">
              <button
                onClick={() => setShowPhotoPrintModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                onClick={() => triggerPrintWindow('photo-printable-area')}
                className="px-5 py-2.5 bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#ECB769]" />
                <span>Imprimir Ahora (Diálogo de Impresora)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT TECHNICAL WORK ORDER MODAL ("ORDEN DE TRABAJO FOTOGRÁFICA")
      ========================================================================= */}
      {showTechnicalOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border-2 border-[#4E2B01] max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#202020] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#4E2B01]" />
                  Orden de Trabajo Fotográfica para Laboratorio
                </h3>
                <p className="text-xs text-slate-500">
                  Hoja de producción para laboratoristas y editores
                </p>
              </div>
              <button
                onClick={() => setShowTechnicalOrderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100 rounded-2xl border border-slate-300 my-3">
              <div id="technical-order-printable" className="bg-white p-5 shadow-md border border-slate-300">
                
                {/* Header with Logo, Folio and Barcode */}
                <div className="flex items-start justify-between border-b-2 border-[#4E2B01] pb-3 mb-4">
                  <div>
                    <h2 className="text-xl font-black text-[#4E2B01] tracking-tight">
                      {brand.businessName}
                    </h2>
                    <p className="text-xs font-bold text-slate-600">
                      ORDEN TÉCNICA DE PRODUCCIÓN Y REVELADO
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fecha: {selectedOrder.date} • Atendió: {selectedOrder.operatorName || operatorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-black text-[#4E2B01] bg-[#FFF3BC] px-3 py-1 rounded-lg border border-[#ECB769] inline-block">
                      FOLIO: #{selectedOrder.folio}
                    </div>
                  </div>
                </div>

                {/* Client Information Section */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Cliente:</span>
                    <strong className="text-sm text-slate-800">{selectedOrder.clientName}</strong>
                    {selectedOrder.clientPhone && (
                      <p className="text-slate-600 mt-0.5">Tel: {selectedOrder.clientPhone}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Entrega Prometida:</span>
                    <strong className="text-sm text-slate-800">{selectedOrder.deliveryDate || 'Fecha estándar'}</strong>
                    {selectedOrder.schoolName && (
                      <p className="text-slate-600 mt-0.5">Escuela: {selectedOrder.schoolName}</p>
                    )}
                  </div>
                </div>

                {/* Items & Specific Specs */}
                <div className="mb-4">
                  <h4 className="text-xs font-black text-[#4E2B01] uppercase tracking-wider mb-2 border-b pb-1">
                    Trabajos y Servicios Solicitados:
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b text-slate-500 text-[10px] uppercase">
                        <th className="py-1">Cant.</th>
                        <th className="py-1">Descripción</th>
                        <th className="py-1">Especificaciones / Acabados</th>
                        <th className="py-1 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it, idx) => {
                        const sp = it.options.photoSpecs;
                        return (
                          <tr key={idx} className="py-1.5">
                            <td className="py-1.5 font-bold align-top">{it.quantity}</td>
                            <td className="py-1.5 font-bold text-slate-800 align-top">
                              {it.name}
                            </td>
                            <td className="py-1.5 text-slate-600 align-top text-[11px]">
                              {it.options.retoque && <span className="font-bold text-amber-800">• Con Retoque Digital </span>}
                              {it.options.autoAdherible && <span className="font-bold text-blue-800">• Papel Auto-Adherible </span>}
                              {sp?.childName && <div>👶 Modelo: {sp.childName} ({sp.caritaModel || 'Caritas'})</div>}
                              {sp?.ampliacionFormat && <div>📐 Formato: {sp.ampliacionFormat}"</div>}
                              {sp?.cambioFondoSize && <div>🎨 Cambio Fondo: {sp.cambioFondoSize}" {sp.customText ? `(${sp.customText})` : ''}</div>}
                              {it.options.notes && <div className="text-slate-500 italic">Notas: {it.options.notes}</div>}
                            </td>
                            <td className="py-1.5 font-bold text-right align-top">${it.totalPrice.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Status & Financial Summary */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Estado en Laboratorio:</span>
                    <p className="font-black text-[#4E2B01] capitalize">{selectedOrder.labStatus.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600">Total: <strong>${selectedOrder.total.toFixed(2)}</strong></span>
                    <span className="text-emerald-700 ml-3">Pagado: <strong>${selectedOrder.amountPaid.toFixed(2)}</strong></span>
                    {selectedOrder.remainingAmount > 0 && (
                      <span className="text-red-700 ml-3">Saldo: <strong>${selectedOrder.remainingAmount.toFixed(2)}</strong></span>
                    )}
                  </div>
                </div>

                {/* Identification Barcode & QR for Scanner Guns */}
                <div className="pt-3 border-t-2 border-slate-300 flex flex-col items-center justify-center">
                  <BarcodeSVG value={selectedOrder.folio} width={220} height={46} showText={true} />
                  <div className="mt-2 flex items-center gap-2">
                    <QRCodeSVG data={selectedOrder.folio} size={70} />
                    <div className="text-[10px] text-slate-500 font-medium">
                      Código QR oficial Minifoto para pistola lectora o terminal móvil.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowTechnicalOrderModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                onClick={() => triggerPrintWindow('technical-order-printable')}
                className="px-5 py-2.5 bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381f01] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#ECB769]" />
                <span>Imprimir Orden de Trabajo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAMERA BARCODE / QR SCANNER MODAL (FOR MOBILE / WEBCAMS)
      ========================================================================= */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border-2 border-[#4E2B01]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-[#202020] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#4E2B01]" />
                Escáner de Cámara / Pistola Lectora
              </h3>
              <button onClick={() => setIsCameraScannerOpen(false)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-6 bg-slate-900 rounded-2xl text-center text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
              {/* Laser Scanner Visual Effect */}
              <div className="w-44 h-44 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse"></div>
                <QrCode className="w-16 h-16 text-emerald-400/40" />
              </div>
              <p className="text-xs text-slate-300 mt-3 font-medium">
                Apunta la pistola lectora o ingresa el folio del ticket a continuación
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribir o pegar folio aquí..."
                  className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProcessScannedCode((e.target as HTMLInputElement).value);
                      setIsCameraScannerOpen(false);
                    }
                  }}
                />
              </div>

              {/* Quick Select Recent Orders for Testing/Demonstration */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Órdenes recientes para simular lectura:
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {workOrders.slice(0, 4).map((wo) => (
                    <button
                      key={wo.id}
                      onClick={() => {
                        handleProcessScannedCode(wo.folio);
                        setIsCameraScannerOpen(false);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-[#FFF3BC] hover:text-[#4E2B01] rounded-lg text-[10px] font-bold text-slate-700 transition"
                    >
                      #{wo.folio} ({wo.clientName})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 mt-4 flex justify-end">
              <button
                onClick={() => setIsCameraScannerOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
