import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, Role } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Church, 
  Maximize2, 
  Film, 
  Sparkles, 
  PartyPopper, 
  Coffee, 
  GraduationCap, 
  Layers, 
  Check, 
  Upload, 
  Link as LinkIcon, 
  Eye, 
  EyeOff, 
  Search, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  ShoppingBag,
  ShoppingCart,
  Send,
  Share2,
  Info
} from 'lucide-react';
import { CATEGORY_FALLBACK_IMAGES, PRESET_IMAGE_GALLERY } from '../../services/initialData';
import { 
  saveProductToSupabase, 
  saveProductsBatchToSupabase, 
  testSupabaseConnection, 
  COMPLETE_SUPABASE_SQL, 
  SUPABASE_CONFIG_DATA 
} from '../../services/supabaseClient';

interface AdminCatalogsViewProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  currentRole?: Role | null;
  operatorName?: string;
}

interface SelectedItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  category: Category;
  quantity: number;
  hasExtras?: boolean;
  retoque: boolean;
  autoadherible: boolean;
  extraTotal: number;
  total: number;
}

export const AdminCatalogsView: React.FC<AdminCatalogsViewProps> = ({
  products,
  onSaveProducts,
  currentRole = 'admin',
  operatorName = 'Usuario',
}) => {
  const isAdmin = currentRole === 'admin';
  const isField = currentRole === 'field';
  const isClient = currentRole === 'client';

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('foto_estudio');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected items state for Client & Field roles
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [detailModalProduct, setDetailModalProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalRetoque, setModalRetoque] = useState(false);
  const [modalAutoAdh, setModalAutoAdh] = useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);

  // Supabase states
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ checked: boolean; success: boolean; message: string; tablesExist: boolean }>({
    checked: false,
    success: false,
    message: '',
    tablesExist: false,
  });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form state for create / edit (Admin only)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('foto_estudio');
  const [formPrice, setFormPrice] = useState<number>(50);
  const [formDesc, setFormDesc] = useState('');
  const [formUnit, setFormUnit] = useState('pza');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formHasExtras, setFormHasExtras] = useState(false);
  const [formRetoquePrice, setFormRetoquePrice] = useState<number>(30);
  const [formAutoAdhPrice, setFormAutoAdhPrice] = useState<number>(20);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories: { id: Category; label: string; icon: any; color: string }[] = [
    { id: 'foto_estudio', label: 'Foto Estudio', icon: Camera, color: 'text-yellow-600' },
    { id: 'ampliaciones', label: 'Ampliaciones', icon: Maximize2, color: 'text-lime-600' },
    { id: 'minilab', label: 'Minilab', icon: Film, color: 'text-yellow-500' },
    { id: 'iglesias', label: 'Iglesias / Eventos', icon: Church, color: 'text-amber-600' },
    { id: 'fotoacabado', label: 'Fotoacabado', icon: Sparkles, color: 'text-lime-500' },
    { id: 'salon_seis_party', label: 'Salón Six Party', icon: PartyPopper, color: 'text-emerald-600' },
    { id: 'fuente_sodas', label: 'Fuente de Sodas / Cafetería', icon: Coffee, color: 'text-orange-600' },
    { id: 'graduaciones', label: 'Graduaciones 2026', icon: GraduationCap, color: 'text-teal-600' },
  ];

  // Test Supabase on mount
  useEffect(() => {
    checkSupabase();
  }, []);

  const checkSupabase = async () => {
    const res = await testSupabaseConnection();
    setSupabaseStatus({
      checked: true,
      success: res.success,
      message: res.message,
      tablesExist: res.tablesExist,
    });
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const startCreate = () => {
    if (!isAdmin) return;
    setIsCreating(true);
    setEditingProduct(null);
    const cat = selectedCategory === 'all' ? 'foto_estudio' : selectedCategory;
    setFormCategory(cat);
    setFormName('');
    setFormPrice(100);
    setFormDesc('');
    setFormUnit('pza');
    setFormImageUrl(CATEGORY_FALLBACK_IMAGES[cat] || '');
    setFormIsActive(true);
    const isStudio = cat === 'foto_estudio';
    setFormHasExtras(isStudio);
    setFormRetoquePrice(30);
    setFormAutoAdhPrice(20);
  };

  const startEdit = (p: Product) => {
    if (!isAdmin) return;
    setEditingProduct(p);
    setIsCreating(false);
    setFormCategory(p.category);
    setFormName(p.name);
    setFormPrice(p.price);
    setFormDesc(p.description || '');
    setFormUnit(p.unit || 'pza');
    setFormImageUrl(p.imageUrl || CATEGORY_FALLBACK_IMAGES[p.category] || '');
    setFormIsActive(p.isActive !== false);
    setFormHasExtras(!!p.hasExtras);
    setFormRetoquePrice(p.defaultRetoquePrice || 30);
    setFormAutoAdhPrice(p.defaultAutoAdheriblePrice || 20);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingProduct(null);
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 2MB. Por favor elige una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setFormImageUrl(dataUrl);
        showToast('Foto cargada exitosamente');
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle active/inactive for any product directly from list
  const handleToggleActive = async (productId: string) => {
    if (!isAdmin) return;
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextState = p.isActive === false ? true : false;
        const modified = { ...p, isActive: nextState };
        // Sync to Supabase in background
        saveProductToSupabase(modified);
        showToast(nextState ? `Producto "${p.name}" activado en el POS` : `Producto "${p.name}" desactivado del POS`);
        return modified;
      }
      return p;
    });
    onSaveProducts(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formName.trim()) return;

    const finalImage = formImageUrl.trim() || CATEGORY_FALLBACK_IMAGES[formCategory];

    if (isCreating) {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        description: formDesc.trim() || undefined,
        unit: formUnit.trim() || undefined,
        imageUrl: finalImage,
        isActive: formIsActive,
        hasExtras: formHasExtras,
        defaultRetoquePrice: formHasExtras ? formRetoquePrice : undefined,
        defaultAutoAdheriblePrice: formHasExtras ? formAutoAdhPrice : undefined,
      };
      const updated = [newProd, ...products];
      onSaveProducts(updated);
      
      // Sync to Supabase
      saveProductToSupabase(newProd);
      showToast(`¡Producto "${newProd.name}" guardado y sincronizado con Supabase!`);
    } else if (editingProduct) {
      const updatedProd: Product = {
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        description: formDesc.trim() || undefined,
        unit: formUnit.trim() || undefined,
        imageUrl: finalImage,
        isActive: formIsActive,
        hasExtras: formHasExtras,
        defaultRetoquePrice: formHasExtras ? formRetoquePrice : undefined,
        defaultAutoAdheriblePrice: formHasExtras ? formAutoAdhPrice : undefined,
      };

      const updated = products.map((p) => (p.id === editingProduct.id ? updatedProd : p));
      onSaveProducts(updated);
      
      // Sync to Supabase
      saveProductToSupabase(updatedProd);
      showToast(`¡Producto "${formName.trim()}" actualizado y sincronizado en Supabase!`);
    }

    cancelForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`¿Seguro que deseas eliminar definitivamente "${name}" del catálogo?`)) {
      const updated = products.filter((p) => p.id !== id);
      onSaveProducts(updated);
      showToast(`Producto "${name}" eliminado`);
    }
  };

  // Batch sync all local products to Supabase
  const handleSyncAllToSupabase = async () => {
    setIsSyncingSupabase(true);
    const result = await saveProductsBatchToSupabase(products);
    setIsSyncingSupabase(false);

    if (result.error) {
      if (result.error.includes('Could not find the table') || result.error.includes('PGRST205')) {
        setShowSqlModal(true);
        showToast('Debes crear las tablas en Supabase con el SQL primero');
      } else {
        alert(`Error al sincronizar con Supabase: ${result.error}`);
      }
    } else {
      showToast(`¡${result.savedCount} productos sincronizados con éxito en Supabase!`);
      checkSupabase();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(COMPLETE_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Selection logic for Client and Field roles
  const openProductDetailModal = (prod: Product) => {
    setDetailModalProduct(prod);
    const existing = selectedItems[prod.id];
    if (existing) {
      setModalQty(existing.quantity);
      setModalRetoque(existing.retoque);
      setModalAutoAdh(existing.autoadherible);
    } else {
      setModalQty(1);
      setModalRetoque(false);
      setModalAutoAdh(false);
    }
  };

  const handleConfirmSelection = (prod: Product) => {
    const fallbackImg = CATEGORY_FALLBACK_IMAGES[prod.category] || CATEGORY_FALLBACK_IMAGES.foto_estudio;
    const finalImg = prod.imageUrl || fallbackImg;
    
    let extraTotal = 0;
    if (prod.hasExtras) {
      if (modalRetoque) extraTotal += (prod.defaultRetoquePrice || 30);
      if (modalAutoAdh) extraTotal += (prod.defaultAutoAdheriblePrice || 20);
    }
    const unitTotal = prod.price + extraTotal;
    const total = unitTotal * modalQty;

    setSelectedItems((prev) => ({
      ...prev,
      [prod.id]: {
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        imageUrl: finalImg,
        category: prod.category,
        quantity: modalQty,
        hasExtras: prod.hasExtras,
        retoque: modalRetoque,
        autoadherible: modalAutoAdh,
        extraTotal,
        total,
      },
    }));

    showToast(`✓ "${prod.name}" agregado a tu selección (${modalQty} pza)`);
    setDetailModalProduct(null);
  };

  const handleRemoveSelection = (productId: string) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    showToast('Producto removido de la selección');
  };

  const handleQuickToggleSelect = (prod: Product) => {
    if (selectedItems[prod.id]) {
      handleRemoveSelection(prod.id);
    } else {
      openProductDetailModal(prod);
    }
  };

  // Selected totals
  const selectedList = Object.values(selectedItems);
  const totalSelectedCount = selectedList.reduce((acc, item) => acc + item.quantity, 0);
  const totalSelectedAmount = selectedList.reduce((acc, item) => acc + item.total, 0);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    // Non-admin roles only see active products
    if (!isAdmin && p.isActive === false) {
      return false;
    }

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? p.isActive !== false :
      p.isActive === false;

    const matchesQuery = 
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesQuery;
  });

  const totalActive = products.filter((p) => p.isActive !== false).length;
  const totalInactive = products.filter((p) => p.isActive === false).length;

  // Format WhatsApp quotation text
  const generateWhatsAppMessage = () => {
    let msg = `Hola, me interesa solicitar cotización del Catálogo Fotográfico:\n\n`;
    selectedList.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}* (x${item.quantity}) - $${item.total.toFixed(2)}\n`;
      if (item.retoque) msg += `   + Retoque Digital\n`;
      if (item.autoadherible) msg += `   + Autoadherible\n`;
    });
    msg += `\n*Total Estimado:* $${totalSelectedAmount.toFixed(2)} MXN\n`;
    msg += `Cliente/Contacto: ${operatorName}`;
    return encodeURIComponent(msg);
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-28 md:pb-12 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#004C59] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom border-2 border-teal-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header & Stats Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-[#004C59]/10 rounded-2xl shrink-0">
              <Layers className="w-7 h-7 text-[#004C59]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#004C59] text-[10px] font-black uppercase mb-1">
                <span>
                  {isAdmin 
                    ? 'Panel de Catálogos & Fotografías (Administrador)' 
                    : isField 
                    ? 'Catálogo Digital para Venta en Campo' 
                    : 'Catálogo Digital de Fotografías & Servicios'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {isAdmin 
                  ? 'Gestión de Catálogo y Subida de Fotos' 
                  : isField 
                  ? 'Catálogo Fotográfico para Venta en Campo' 
                  : 'Catálogo de Fotografías y Paquetes'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                {isAdmin
                  ? 'Sube las fotos de tus productos, asigna precios y categorías. Los cambios se sincronizan en Supabase y se visualizan en el POS y Catálogo Digital.'
                  : 'Explora las fotografías y servicios disponibles en alta calidad. Toca cualquier producto para seleccionarlo o ver sus detalles y cotización.'}
              </p>
            </div>
          </div>

          {/* ADMIN CONTROLS: Solo el admin puede subir fotos o gestionar productos */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botón Ver SQL Supabase */}
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition cursor-pointer"
                title="Ver el script SQL completo de Supabase"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Ver SQL Supabase</span>
              </button>

              {/* Botón Sincronizar Supabase */}
              <button
                type="button"
                disabled={isSyncingSupabase}
                onClick={handleSyncAllToSupabase}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-xs"
                title="Enviar todos los productos a Supabase"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                <span>{isSyncingSupabase ? 'Sincronizando...' : 'Sincronizar a Supabase'}</span>
              </button>

              {/* Botón Nuevo Producto */}
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#004C59] hover:bg-teal-900 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-5 h-5 text-yellow-400" />
                <span>+ Nuevo Producto</span>
              </button>
            </div>
          )}

          {/* CLIENT & FIELD BADGE / SUMMARY BUTTON */}
          {!isAdmin && totalSelectedCount > 0 && (
            <button
              onClick={() => setShowSummaryDrawer(true)}
              className="flex items-center gap-2.5 px-5 py-3 bg-[#004C59] hover:bg-teal-900 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg border-2 border-yellow-400 cursor-pointer transition active:scale-95 shrink-0"
            >
              <ShoppingCart className="w-5 h-5 text-yellow-400" />
              <span>Ver Selección ({totalSelectedCount}) • ${totalSelectedAmount.toFixed(2)}</span>
            </button>
          )}
        </div>

        {/* Supabase Status Banner (Visible for Admin) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 border border-teal-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#004C59] shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">
                  Supabase Proyecto: <code className="text-teal-800 font-mono text-[11px] font-black">{SUPABASE_CONFIG_DATA.projectId}</code>
                </span>
                <span className="text-[11px] text-slate-500">
                  {supabaseStatus.checked 
                    ? supabaseStatus.message 
                    : 'Verificando estado de conexión con Supabase...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs font-bold">
              <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                ✓ {totalActive} Activos
              </span>
              {totalInactive > 0 && (
                <span className="text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl">
                  ✕ {totalInactive} Inactivos
                </span>
              )}
            </div>
          </div>
        )}

        {/* MODAL CON SQL COMPLETO DE SUPABASE (ADMIN) */}
        {showSqlModal && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-3xl bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-emerald-500 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white">Script SQL Completo para Supabase</h3>
                    <p className="text-xs text-slate-400">
                      Copia este SQL y pégalo en el <strong>SQL Editor</strong> de tu proyecto Supabase ({SUPABASE_CONFIG_DATA.projectId})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-300 leading-relaxed mb-4">
                <pre className="whitespace-pre-wrap">{COMPLETE_SUPABASE_SQL}</pre>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400">
                  Incluye tablas: <code>products</code>, <code>sales</code>, <code>graduation_students</code>, <code>schools</code> con RLS y permisos anon.
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? '¡SQL Copiado al Portapapeles!' : 'Copiar Todo el Script SQL'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLE Y SELECCIÓN DE PRODUCTO (CLIENTE Y VENDEDOR EN CAMPO) */}
        {detailModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Image banner */}
              <div className="relative w-full h-56 sm:h-64 bg-slate-100 shrink-0">
                <img
                  src={detailModalProduct.imageUrl || CATEGORY_FALLBACK_IMAGES[detailModalProduct.category]}
                  alt={detailModalProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setDetailModalProduct(null)}
                  className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 left-3 bg-[#004C59] text-white text-xs font-black px-3 py-1 rounded-xl shadow-md uppercase">
                  {detailModalProduct.category.replace('_', ' ')}
                </span>
                <span className="absolute bottom-3 right-3 bg-yellow-400 text-slate-950 font-mono font-black text-base px-3 py-1 rounded-xl shadow-md">
                  ${detailModalProduct.price.toFixed(2)} MXN
                </span>
              </div>

              {/* Content & Options */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {detailModalProduct.name}
                  </h3>
                  {detailModalProduct.description ? (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {detailModalProduct.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">
                      Fotografía reglamentaria y acabados de estudio profesional.
                    </p>
                  )}
                </div>

                {/* Extras if product hasExtras */}
                {detailModalProduct.hasExtras && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                      Opciones y Extras Adicionales
                    </span>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={modalRetoque}
                          onChange={(e) => setModalRetoque(e.target.checked)}
                          className="w-4 h-4 text-[#004C59] rounded"
                        />
                        <span className="text-xs font-bold text-slate-800">Retoque Digital Profesional</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-800">
                        +${detailModalProduct.defaultRetoquePrice || 30}.00
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={modalAutoAdh}
                          onChange={(e) => setModalAutoAdh(e.target.checked)}
                          className="w-4 h-4 text-[#004C59] rounded"
                        />
                        <span className="text-xs font-bold text-slate-800">Adhesivo Autoadherible</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-800">
                        +${detailModalProduct.defaultAutoAdheriblePrice || 20}.00
                      </span>
                    </label>
                  </div>
                )}

                {/* Quantity selector */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-base text-slate-900 w-6 text-center">
                      {modalQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQty(modalQty + 1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal calculation */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-600 uppercase">Total por este producto:</span>
                  <span className="text-lg font-black text-[#004C59] font-mono">
                    ${((detailModalProduct.price + 
                      (detailModalProduct.hasExtras && modalRetoque ? (detailModalProduct.defaultRetoquePrice || 30) : 0) + 
                      (detailModalProduct.hasExtras && modalAutoAdh ? (detailModalProduct.defaultAutoAdheriblePrice || 20) : 0)
                    ) * modalQty).toFixed(2)} MXN
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDetailModalProduct(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSelection(detailModalProduct)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#004C59] hover:bg-teal-900 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  <Check className="w-4 h-4 text-yellow-400" />
                  <span>{selectedItems[detailModalProduct.id] ? 'Actualizar Selección' : 'Seleccionar este Producto'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / DRAWER RESUMEN DE PRODUCTOS SELECCIONADOS */}
        {showSummaryDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-[#004C59] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 bg-[#004C59] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black">Resumen de Selección</h3>
                    <p className="text-xs text-teal-200">
                      {totalSelectedCount} productos seleccionados • Total: ${totalSelectedAmount.toFixed(2)} MXN
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummaryDrawer(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                {selectedList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm font-bold">No has seleccionado ningún producto aún</p>
                    <p className="text-xs mt-1">Explora el catálogo y pulsa "Seleccionar" en los productos que te interesen.</p>
                  </div>
                ) : (
                  selectedList.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 justify-between"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">{item.name}</h4>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} pza x ${item.price.toFixed(2)}
                          {item.retoque && <span className="ml-1 text-teal-700 font-bold">+ Retoque</span>}
                          {item.autoadherible && <span className="ml-1 text-teal-700 font-bold">+ Adhesivo</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#004C59] block">
                          ${item.total.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveSelection(item.productId)}
                          className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <span className="text-xs text-slate-500 uppercase font-bold block">Total Selección:</span>
                  <span className="text-xl font-black text-[#004C59] font-mono">
                    ${totalSelectedAmount.toFixed(2)} MXN
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedItems({});
                      setShowSummaryDrawer(false);
                      showToast('Selección vaciada');
                    }}
                    className="px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    Vaciar
                  </button>

                  <a
                    href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Cotizar por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            FORMULARIO PARA CREAR O EDITAR PRODUCTO Y SUBIR FOTOS (SOLO ADMIN)
            ========================================================================= */}
        {isAdmin && (isCreating || editingProduct) && (
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border-2 border-[#004C59] space-y-5 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-yellow-400 rounded-xl text-slate-950">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {isCreating ? 'Dar de Alta Nuevo Producto & Subir Fotografía' : `Editar Producto: ${editingProduct?.name}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sube una foto desde tu equipo o dispositivo móvil, o selecciona de la galería. Se sincronizará inmediatamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECCIÓN FOTOGRAFÍA DEL PRODUCTO */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#004C59]" />
                  <span>Fotografía del Producto / Portada *</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Visible en Catálogo de 4 columnas y POS
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview Thumbnail */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0 shadow-inner group">
                  <img
                    src={formImageUrl || CATEGORY_FALLBACK_IMAGES[formCategory]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[formCategory];
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold text-center p-2">
                    Vista previa de imagen
                  </div>
                </div>

                {/* Upload & Source Controls */}
                <div className="flex-1 space-y-3 w-full">
                  {/* File Upload Button */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      1. Subir archivo de imagen desde tu computadora o celular:
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-yellow-400" />
                      <span>Elegir Foto de mi Dispositivo</span>
                    </button>
                    <span className="text-[10px] text-slate-400 block mt-1">Formatos JPG, PNG, WebP (Máx 2MB)</span>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      2. O escribe la URL directa de la imagen:
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://ejemplo.com/mifoto.jpg"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                      />
                    </div>
                  </div>

                  {/* Preset Gallery Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      3. O selecciona una fotografía temática predefinida:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {PRESET_IMAGE_GALLERY.map((preset, idx) => (
                        <button
                          key={`${preset.label}-${idx}`}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-transform hover:scale-105 cursor-pointer ${
                            formImageUrl === preset.url ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-slate-300'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Producto o Servicio *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Fotos Infantiles Color (6 pzas)"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Categoría del Catálogo *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Precio Regular ($ MXN) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black text-[#004C59] px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Unidad de Venta (opcional):</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Ej. pza, juego, evento, paquete..."
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                />
              </div>

              {/* Estado Activo / Inactivo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Estado en el Catálogo / POS:</label>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-full py-2 px-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    formIsActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {formIsActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Activo (Visible en Catálogo y POS)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>Desactivado (Oculto en Catálogo y POS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Descripción o Medidas Reglamentarias:</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Ej. 6 piezas papel mate, fondo blanco reglamentario..."
                className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>

            {/* Extras Configuration */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formHasExtras}
                  onChange={(e) => setFormHasExtras(e.target.checked)}
                  className="w-4 h-4 text-[#004C59] rounded border-slate-300 focus:ring-[#004C59]"
                />
                <span>Habilitar opciones adicionales para sumar al ticket (Retoque Digital y Autoadherible)</span>
              </label>

              {formHasExtras && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2.5 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Precio Extra Retoque Digital ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formRetoquePrice}
                      onChange={(e) => setFormRetoquePrice(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Precio Extra Autoadherible ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formAutoAdhPrice}
                      onChange={(e) => setFormAutoAdhPrice(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#004C59] hover:bg-teal-900 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-yellow-400" />
                <span>{isCreating ? 'Guardar y Sincronizar en Supabase' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Categories Bar & Filters */}
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#004C59] text-white ring-2 ring-[#004C59]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Todos los Catálogos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => p.category === cat.id && (isAdmin || p.isActive !== false)).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? 'bg-[#004C59] text-white ring-2 ring-[#004C59]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter Row */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>

            {/* Status Filter: Solo visible para Admin */}
            {isAdmin ? (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-bold">
                <span className="text-slate-500 text-[11px] uppercase">Mostrar:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-[#004C59] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Todos ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Activos ({totalActive})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'inactive' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Desactivados ({totalInactive})
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#004C59]" />
                <span>Haz clic en un producto para ver fotos y seleccionarlo</span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CUADRÍCULA DE PRODUCTOS:
            REQUISITO EXACTO DEL USUARIO:
            "los productos quiero que se muestren en un gril de 4 imagenes fullscreen y tablet y en version movil que se vean a 2 columnas"
            -> grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-6
            ========================================================================= */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              {selectedCategory === 'all' ? 'Todos los Productos del Catálogo' : categories.find((c) => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-xs font-mono text-slate-500 font-bold">
              {filteredProducts.length} productos mostrados
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No se encontraron productos con los filtros seleccionados</p>
              {isAdmin && (
                <p className="text-xs text-slate-500 mt-1">Haz clic en "+ Nuevo Producto" para agregar el primero.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {filteredProducts.map((prod) => {
                const isActive = prod.isActive !== false;
                const fallbackImg = CATEGORY_FALLBACK_IMAGES[prod.category] || CATEGORY_FALLBACK_IMAGES.foto_estudio;
                const displayImg = prod.imageUrl || fallbackImg;
                const isSelectedByRole = !!selectedItems[prod.id];
                const selectedQty = selectedItems[prod.id]?.quantity || 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (!isAdmin) {
                        openProductDetailModal(prod);
                      }
                    }}
                    className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 shadow-sm hover:shadow-xl flex flex-col overflow-hidden ${
                      isSelectedByRole
                        ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                        : isActive 
                        ? 'border-slate-200 hover:border-yellow-400' 
                        : 'border-rose-200 bg-slate-50/70 opacity-80'
                    } ${!isAdmin ? 'cursor-pointer' : ''}`}
                  >
                    {/* FOTO GRANDE DEL PRODUCTO (aspect 4/3) */}
                    <div className="relative w-full h-40 sm:h-52 bg-slate-100 overflow-hidden shrink-0 group">
                      <img
                        src={displayImg}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = fallbackImg;
                        }}
                      />

                      {/* Badge Activo / Desactivado (Para Admin) */}
                      {isAdmin ? (
                        <span className={`absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md shadow-md ${
                          isActive 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-rose-600 text-white'
                        }`}>
                          {isActive ? '● Activo en POS' : '✕ Desactivado'}
                        </span>
                      ) : (
                        isSelectedByRole && (
                          <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Seleccionado ({selectedQty})</span>
                          </span>
                        )
                      )}

                      {/* Precio sobre imagen */}
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-xs text-yellow-400 font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg shadow-md">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-0.5">
                          {prod.category.replace('_', ' ')}
                        </span>
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                          {prod.name}
                        </h3>
                        {prod.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      {/* ACCIONES DEPENDIENDO DEL ROL */}
                      {isAdmin ? (
                        /* Acciones de Administrador: Editar, Desactivar, Borrar */
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          {/* Botón Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(prod.id);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 cursor-pointer transition ${
                              isActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                            }`}
                            title={isActive ? 'Desactivar producto (ocultar del POS)' : 'Activar producto (mostrar en el POS)'}
                          >
                            {isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                            <span className="hidden sm:inline">{isActive ? 'Desactivar' : 'Activar'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Editar */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(prod);
                              }}
                              className="p-1.5 text-slate-600 hover:text-[#004C59] hover:bg-teal-50 rounded-xl transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(prod.id, prod.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Acciones para Vendedor en Campo y Cliente: Seleccionar Producto */
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductDetailModal(prod);
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                              isSelectedByRole
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-[#004C59] text-white hover:bg-teal-900'
                            }`}
                          >
                            {isSelectedByRole ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-yellow-300" />
                                <span>Modificar ({selectedQty})</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />
                                <span>Seleccionar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FLOATING ACTION BAR FOR CLIENT & FIELD ROLES */}
        {!isAdmin && totalSelectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#004C59] p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 safe-bottom">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#004C59] text-white rounded-2xl shadow-sm">
                <ShoppingCart className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Selección Actual</span>
                <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                  {totalSelectedCount} artículos • ${totalSelectedAmount.toFixed(2)} MXN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSummaryDrawer(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Ver Detalle
              </button>

              <a
                href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#F97800] hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Solicitar Cotización</span>
                <span className="sm:hidden">Cotizar</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
