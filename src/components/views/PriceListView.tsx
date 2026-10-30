import React, { useState, useMemo } from 'react';
import { Product, Category, Role } from '../../types';
import { 
  DollarSign, 
  Search, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Copy, 
  Database, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Percent, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShoppingBag, 
  Layers, 
  Sliders, 
  Filter, 
  X,
  Camera,
  Film,
  Sparkles,
  Maximize2,
  Church,
  PartyPopper,
  Coffee,
  GraduationCap
} from 'lucide-react';
import { saveProductsBatchToSupabase, COMPLETE_SUPABASE_SQL } from '../../services/supabaseClient';
import { getStoredCategories } from '../../services/storage';

interface PriceListViewProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  currentRole: Role;
  onNavigateToPOS?: () => void;
}

export const PriceListView: React.FC<PriceListViewProps> = ({
  products,
  onSaveProducts,
  currentRole,
  onNavigateToPOS,
}) => {
  // Working copy of products to allow inline edits before or during save
  const [workingProducts, setWorkingProducts] = useState<Product[]>(products);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Save notification & sync status
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'saving' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [savedRowIds, setSavedRowIds] = useState<Record<string, boolean>>({});

  // SQL Modal state
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // New product modal state
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('foto_estudio');
  const [newPrice, setNewPrice] = useState<number>(100);
  const [newHasExtras, setNewHasExtras] = useState<boolean>(true);
  const [newRetoquePrice, setNewRetoquePrice] = useState<number>(30);
  const [newAutoAdhPrice, setNewAutoAdhPrice] = useState<number>(20);
  const [newUnit, setNewUnit] = useState<string>('pza');
  const [newDesc, setNewDesc] = useState<string>('');

  // Bulk percentage markup modal
  const [showMarkupModal, setShowMarkupModal] = useState<boolean>(false);
  const [markupPercent, setMarkupPercent] = useState<number>(10);
  const [markupCategory, setMarkupCategory] = useState<string>('all');

  // Categories list
  const categoriesList = useMemo(() => {
    const stored = getStoredCategories();
    return stored.length > 0 ? stored : [
      { id: 'foto_estudio', label: 'Foto Estudio', color: 'text-yellow-600' },
      { id: 'ampliaciones', label: 'Ampliaciones', color: 'text-lime-600' },
      { id: 'minilab', label: 'Minilab', color: 'text-yellow-500' },
      { id: 'iglesias', label: 'Iglesias / Eventos', color: 'text-amber-600' },
      { id: 'fotoacabado', label: 'Fotoacabado', color: 'text-lime-500' },
      { id: 'salon_seis_party', label: 'Salón Six Party', color: 'text-emerald-600' },
      { id: 'fuente_sodas', label: 'Fuente de Sodas', color: 'text-orange-600' },
      { id: 'graduaciones', label: 'Graduaciones 2026', color: 'text-teal-600' },
    ];
  }, []);

  // Update working products if prop changes and not currently edited
  React.useEffect(() => {
    setWorkingProducts(products);
  }, [products]);

  // Statistics
  const totalProducts = workingProducts.length;
  const activeProducts = workingProducts.filter((p) => p.isActive !== false).length;
  const avgPrice = totalProducts > 0 
    ? (workingProducts.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts).toFixed(2)
    : '0.00';
  const productsWithExtras = workingProducts.filter((p) => p.hasExtras).length;

  // Filtered list
  const filteredProducts = useMemo(() => {
    return workingProducts.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = 
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && p.isActive !== false) ||
        (statusFilter === 'inactive' && p.isActive === false);

      return matchCat && matchSearch && matchStatus;
    });
  }, [workingProducts, selectedCategory, searchQuery, statusFilter]);

  // Handle inline price update
  const handlePriceChange = (id: string, newPriceValue: number) => {
    const updated = workingProducts.map((p) => 
      p.id === id ? { ...p, price: Math.max(0, isNaN(newPriceValue) ? 0 : newPriceValue) } : p
    );
    setWorkingProducts(updated);
  };

  // Handle inline Retoque price update
  const handleRetoquePriceChange = (id: string, newRetoqueValue: number) => {
    const updated = workingProducts.map((p) => 
      p.id === id ? { ...p, defaultRetoquePrice: Math.max(0, isNaN(newRetoqueValue) ? 0 : newRetoqueValue) } : p
    );
    setWorkingProducts(updated);
  };

  // Handle inline Autoadherible price update
  const handleAutoAdhPriceChange = (id: string, newAutoAdhValue: number) => {
    const updated = workingProducts.map((p) => 
      p.id === id ? { ...p, defaultAutoAdheriblePrice: Math.max(0, isNaN(newAutoAdhValue) ? 0 : newAutoAdhValue) } : p
    );
    setWorkingProducts(updated);
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    const updated = workingProducts.map((p) => 
      p.id === id ? { ...p, isActive: p.isActive === false ? true : false } : p
    );
    setWorkingProducts(updated);
  };

  // Toggle hasExtras
  const handleToggleExtras = (id: string) => {
    const updated = workingProducts.map((p) => 
      p.id === id ? { 
        ...p, 
        hasExtras: !p.hasExtras,
        defaultRetoquePrice: p.defaultRetoquePrice || 30,
        defaultAutoAdheriblePrice: p.defaultAutoAdheriblePrice || 20
      } : p
    );
    setWorkingProducts(updated);
  };

  // Save single row
  const handleSaveSingleRow = async (id: string) => {
    onSaveProducts(workingProducts);
    setSavedRowIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSavedRowIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2500);
  };

  // Save all changes
  const handleSaveAll = async () => {
    setSaveStatus({ type: 'saving', message: 'Guardando lista de precios y sincronizando con Supabase...' });
    try {
      onSaveProducts(workingProducts);
      await saveProductsBatchToSupabase(workingProducts);
      setSaveStatus({ 
        type: 'success', 
        message: '¡Lista de precios guardada y sincronizada con éxito! El POS ya cuenta con estos precios.' 
      });
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 4000);
    } catch (err: any) {
      setSaveStatus({ 
        type: 'error', 
        message: 'Precios guardados en memoria local. (Hubo un detalle al enviar a Supabase: ' + (err.message || 'error de red') + ')' 
      });
    }
  };

  // Apply markup percentage
  const handleApplyMarkup = () => {
    if (markupPercent === 0) return;
    const factor = 1 + (markupPercent / 100);
    const updated = workingProducts.map((p) => {
      if (markupCategory === 'all' || p.category === markupCategory) {
        return {
          ...p,
          price: Math.round(p.price * factor * 100) / 100,
        };
      }
      return p;
    });
    setWorkingProducts(updated);
    setShowMarkupModal(false);
    setSaveStatus({ 
      type: 'success', 
      message: `Se aplicó un ajuste de ${markupPercent > 0 ? '+' : ''}${markupPercent}% a ${markupCategory === 'all' ? 'todos los productos' : markupCategory}. Haz clic en "Guardar Todos los Cambios" para confirmar.` 
    });
  };

  // Add new product
  const handleCreateProduct = () => {
    if (!newName.trim()) return;
    const newId = `prod-${Date.now().toString(36)}`;
    const created: Product = {
      id: newId,
      name: newName.trim(),
      category: newCategory,
      price: Number(newPrice) || 0,
      description: newDesc.trim() || undefined,
      unit: newUnit || 'pza',
      isActive: true,
      hasExtras: newHasExtras,
      defaultRetoquePrice: newHasExtras ? Number(newRetoquePrice) || 30 : 0,
      defaultAutoAdheriblePrice: newHasExtras ? Number(newAutoAdhPrice) || 20 : 0,
    };

    const updated = [created, ...workingProducts];
    setWorkingProducts(updated);
    onSaveProducts(updated);
    setShowNewModal(false);

    // Reset form
    setNewName('');
    setNewPrice(100);
    setNewDesc('');
    setSaveStatus({
      type: 'success',
      message: `Producto "${created.name}" agregado con precio de $${created.price.toFixed(2)}.`,
    });
  };

  // Delete product
  const handleDeleteProduct = (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${name}" de la lista de precios?`)) return;
    const updated = workingProducts.filter((p) => p.id !== id);
    setWorkingProducts(updated);
    onSaveProducts(updated);
  };

  // Copy full SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(COMPLETE_SUPABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Helper icons for categories
  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'foto_estudio': return <Camera className="w-4 h-4 text-amber-500" />;
      case 'ampliaciones': return <Maximize2 className="w-4 h-4 text-lime-500" />;
      case 'minilab': return <Film className="w-4 h-4 text-yellow-400" />;
      case 'fotoacabado': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'iglesias': return <Church className="w-4 h-4 text-amber-600" />;
      case 'salon_seis_party': return <PartyPopper className="w-4 h-4 text-fuchsia-400" />;
      case 'fuente_sodas': return <Coffee className="w-4 h-4 text-orange-400" />;
      case 'graduaciones': return <GraduationCap className="w-4 h-4 text-teal-400" />;
      default: return <Tag className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-slate-100 p-3 sm:p-6 space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-[#242424] border border-[#3b3b3b] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4E2B01] border border-[#ECB769] flex items-center justify-center text-[#FFF3BC] shadow-md">
                <DollarSign className="w-6 h-6 text-[#ECB769]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#FFF3BC] tracking-tight">
                  Lista de Precios Oficial (Admin)
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Establece precios base, retoques y acabados. Los cambios se sincronizan en vivo con el POS y Supabase.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Save all changes button */}
            <button
              onClick={handleSaveAll}
              disabled={saveStatus.type === 'saving'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020] font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saveStatus.type === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Todos los Cambios</span>
                </>
              )}
            </button>

            {/* SQL Supabase Button */}
            <button
              onClick={() => setShowSqlModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#333333] hover:bg-[#404040] text-emerald-400 font-bold text-xs sm:text-sm border border-emerald-500/30 transition active:scale-95 cursor-pointer"
              title="Ver el SQL completo con todos los 42 productos para no borrarlos en Supabase"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>SQL Supabase</span>
            </button>

            {/* Markup adjustment */}
            <button
              onClick={() => setShowMarkupModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#333333] hover:bg-[#404040] text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 transition active:scale-95 cursor-pointer"
            >
              <Percent className="w-4 h-4 text-amber-400" />
              <span>Ajuste %</span>
            </button>

            {/* Add new product */}
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#4E2B01] hover:bg-[#603502] text-[#FFF3BC] font-bold text-xs sm:text-sm border border-[#ECB769]/50 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#ECB769]" />
              <span>Nuevo Producto</span>
            </button>

            {/* Go to POS */}
            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#353535] text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Probar ventas con los nuevos precios en el Punto de Venta"
              >
                <ShoppingBag className="w-4 h-4 text-[#ECB769]" />
                <span>Ir al POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status notification toast */}
        {saveStatus.message && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold ${
              saveStatus.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : saveStatus.type === 'error'
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-amber-950/80 border-amber-500 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {saveStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {saveStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {saveStatus.type === 'saving' && <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />}
              <span>{saveStatus.message}</span>
            </div>
            <button
              onClick={() => setSaveStatus({ type: null, message: '' })}
              className="text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#1b1b1b] border border-[#333333] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Servicios</span>
              <span className="text-xl font-black text-[#FFF3BC] font-mono">{totalProducts}</span>
            </div>
            <Tag className="w-6 h-6 text-[#ECB769]/70" />
          </div>

          <div className="bg-[#1b1b1b] border border-[#333333] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Activos en POS</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{activeProducts}</span>
            </div>
            <Eye className="w-6 h-6 text-emerald-500/70" />
          </div>

          <div className="bg-[#1b1b1b] border border-[#333333] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Con Retoque/Extras</span>
              <span className="text-xl font-black text-amber-400 font-mono">{productsWithExtras}</span>
            </div>
            <Sparkles className="w-6 h-6 text-amber-500/70" />
          </div>

          <div className="bg-[#1b1b1b] border border-[#333333] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Precio Promedio</span>
              <span className="text-xl font-black text-[#ECB769] font-mono">${avgPrice}</span>
            </div>
            <TrendingUp className="w-6 h-6 text-[#ECB769]/70" />
          </div>
        </div>
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="bg-[#242424] border border-[#3b3b3b] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto o servicio (ej. Caritas, Óvalo, 16x20)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1b1b1b] border border-[#383838] focus:border-[#ECB769] focus:outline-none rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter toggle */}
          <div className="flex items-center gap-1.5 bg-[#1b1b1b] p-1 rounded-xl border border-[#383838] self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#4E2B01] text-[#FFF3BC] border border-[#ECB769]/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({workingProducts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activos ({activeProducts})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pausados ({workingProducts.length - activeProducts})
            </button>
          </div>
        </div>

        {/* Category Pill Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                : 'bg-[#1b1b1b] text-slate-300 hover:bg-[#333333] border border-[#383838]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas las Categorías</span>
          </button>

          {categoriesList.map((cat) => {
            const isSel = selectedCategory === cat.id;
            const count = workingProducts.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-[#ECB769] text-[#202020] font-black shadow-md'
                    : 'bg-[#1b1b1b] text-slate-300 hover:bg-[#333333] border border-[#383838]'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-[#202020] text-[#FFF3BC]' : 'bg-[#2b2b2b] text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Table of Prices */}
      <div className="bg-[#242424] border border-[#3b3b3b] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1b1b1b] text-[#ECB769] text-xs font-black uppercase tracking-wider border-b border-[#383838]">
                <th className="py-3 px-3 sm:px-4">Servicio / Producto</th>
                <th className="py-3 px-3 sm:px-4">Categoría</th>
                <th className="py-3 px-3 sm:px-4 min-w-[140px]">Precio Base ($ MXN)</th>
                <th className="py-3 px-3 sm:px-4 min-w-[130px]">Retoque Digital ($)</th>
                <th className="py-3 px-3 sm:px-4 min-w-[130px]">Autoadherible ($)</th>
                <th className="py-3 px-3 sm:px-4 text-center">Estado POS</th>
                <th className="py-3 px-3 sm:px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333] text-xs sm:text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                    No se encontraron productos o servicios con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isSavedJustNow = savedRowIds[prod.id];
                  const hasRetoqueField = prod.hasExtras || prod.category === 'foto_estudio';

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-[#2b2b2b]/80 transition ${
                        prod.isActive === false ? 'opacity-60 bg-[#1e1e1e]/50' : ''
                      }`}
                    >
                      {/* Product Name & Details */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#444] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#333333] border border-[#444] flex items-center justify-center shrink-0">
                              {getCategoryIcon(prod.category)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-100 block truncate text-sm">
                              {prod.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                              {prod.description || `ID: ${prod.id} • Unidad: ${prod.unit || 'pza'}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1b1b1b] border border-[#3b3b3b] text-slate-300">
                          {getCategoryIcon(prod.category)}
                          <span className="capitalize">{prod.category.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Base Price Editable Input */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="relative w-28 sm:w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[#ECB769] font-mono text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={prod.price}
                            onChange={(e) => handlePriceChange(prod.id, parseFloat(e.target.value))}
                            className="w-full pl-6 pr-2 py-1.5 bg-[#1b1b1b] border border-[#444] focus:border-[#ECB769] focus:bg-[#151515] focus:outline-none rounded-lg font-mono font-black text-sm text-[#FFF3BC] transition"
                          />
                        </div>
                      </td>

                      {/* Retoque Price Editable Input */}
                      <td className="py-3 px-3 sm:px-4">
                        {hasRetoqueField ? (
                          <div className="relative w-24 sm:w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-amber-500 font-mono text-xs">
                              +$
                            </span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={prod.defaultRetoquePrice ?? 30}
                              onChange={(e) => handleRetoquePriceChange(prod.id, parseFloat(e.target.value))}
                              className="w-full pl-7 pr-2 py-1.5 bg-[#1b1b1b] border border-[#444] focus:border-amber-400 focus:outline-none rounded-lg font-mono font-bold text-xs sm:text-sm text-amber-200 transition"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleExtras(prod.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Activar extras</span>
                          </button>
                        )}
                      </td>

                      {/* Autoadherible Price Editable Input */}
                      <td className="py-3 px-3 sm:px-4">
                        {hasRetoqueField ? (
                          <div className="relative w-24 sm:w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-sky-400 font-mono text-xs">
                              +$
                            </span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={prod.defaultAutoAdheriblePrice ?? 20}
                              onChange={(e) => handleAutoAdhPriceChange(prod.id, parseFloat(e.target.value))}
                              className="w-full pl-7 pr-2 py-1.5 bg-[#1b1b1b] border border-[#444] focus:border-sky-400 focus:outline-none rounded-lg font-mono font-bold text-xs sm:text-sm text-sky-200 transition"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Status Toggle in POS */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer select-none ${
                            prod.isActive !== false
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${prod.isActive !== false ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                          <span>{prod.isActive !== false ? 'Activo' : 'En Pausa'}</span>
                        </button>
                      </td>

                      {/* Row Action (Save button with feedback) */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveSingleRow(prod.id)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              isSavedJustNow
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#333333] hover:bg-[#ECB769] hover:text-[#202020] text-slate-200'
                            }`}
                            title="Guardar este precio"
                          >
                            {isSavedJustNow ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-2 rounded-xl bg-[#2a2a2a] hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="Eliminar de catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with batch save reminder */}
        <div className="bg-[#1b1b1b] p-4 border-t border-[#383838] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <div>
            Mostrando <span className="font-bold text-white">{filteredProducts.length}</span> de{' '}
            <span className="font-bold text-white">{workingProducts.length}</span> productos totales.
          </div>
          <div className="flex items-center gap-2">
            <span>¿Hiciste varios cambios?</span>
            <button
              onClick={handleSaveAll}
              className="px-3 py-1.5 rounded-lg bg-[#4E2B01] hover:bg-[#603502] text-[#FFF3BC] font-black border border-[#ECB769]/50 transition cursor-pointer"
            >
              Guardar Todos los Precios
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: SQL COMPLETO PARA SUPABASE (IDEMPOTENTE CON TODOS LOS PRODUCTOS)
          ========================================================================= */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#242424] border border-[#ECB769]/50 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#3b3b3b] flex items-center justify-between bg-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#FFF3BC]">
                    Script SQL Completo para Supabase (No Borra Códigos)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Incluye todas las tablas, RLS, Storage y los 42 productos con <code className="text-emerald-400">ON CONFLICT DO UPDATE</code>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Instructions */}
            <div className="bg-amber-950/40 border-b border-amber-900/60 p-3 sm:p-4 text-xs text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-bold">
                ⚠️ ¿Por qué se borraban o faltaban antes los datos?
              </p>
              <p>
                Este script es <strong>100% idempotente</strong>. Si ejecutas este código en tu{' '}
                <strong>Supabase SQL Editor</strong>, creará o conservará todas tus tablas (`products`, `sales`, `work_orders`, etc.) y
                asegurará que los <strong>42 productos de todas las categorías</strong> queden registrados en la base de datos sin sobreescribir ni borrar nada.
              </p>
            </div>

            {/* SQL Content Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#141414] font-mono text-xs text-slate-300">
              <pre className="whitespace-pre-wrap select-all">{COMPLETE_SUPABASE_SQL}</pre>
            </div>

            {/* Modal Footer with 1-click copy */}
            <div className="p-4 border-t border-[#3b3b3b] bg-[#1f1f1f] flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Líneas de código SQL listas para copiar y pegar en Supabase.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition cursor-pointer ${
                    copiedSql
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020]'
                  }`}
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar SQL Completo</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#333333] hover:bg-[#444] text-slate-300 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVO PRODUCTO O SERVICIO
          ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#242424] border border-[#ECB769]/50 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3b3b3b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4E2B01] border border-[#ECB769] flex items-center justify-center text-[#FFF3BC]">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#FFF3BC]">
                  Nuevo Producto o Servicio
                </h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Servicio / Producto *</label>
                <input
                  type="text"
                  placeholder="Ej. Foto Título Especial, Ampliación 20x30..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#444] focus:border-[#ECB769] rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#444] focus:border-[#ECB769] rounded-xl text-white outline-none cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio Base ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#444] focus:border-[#ECB769] rounded-xl text-[#FFF3BC] font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* Extras checkbox */}
              <div className="bg-[#1e1e1e] p-3 rounded-xl border border-[#383838] space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasExtras}
                    onChange={(e) => setNewHasExtras(e.target.checked)}
                    className="w-4 h-4 text-[#4E2B01] accent-[#ECB769]"
                  />
                  <span className="font-bold text-slate-200">Permitir extras (Retoque digital y autoadherible)</span>
                </label>

                {newHasExtras && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333]">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Retoque Digital ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={newRetoquePrice}
                        onChange={(e) => setNewRetoquePrice(parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#151515] border border-[#444] rounded-lg text-amber-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Autoadherible ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={newAutoAdhPrice}
                        onChange={(e) => setNewAutoAdhPrice(parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#151515] border border-[#444] rounded-lg text-sky-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción / Especificaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre medidas, papel o entrega..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#444] focus:border-[#ECB769] rounded-xl text-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3b3b3b]">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl bg-[#333] text-slate-300 font-bold hover:bg-[#444] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={!newName.trim()}
                className="px-5 py-2 rounded-xl bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020] font-black cursor-pointer disabled:opacity-50"
              >
                Crear y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AJUSTE PORCENTUAL MASIVO
          ========================================================================= */}
      {showMarkupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#242424] border border-[#ECB769]/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3b3b3b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300">
                  <Percent className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#FFF3BC]">
                  Ajuste Porcentual de Precios
                </h3>
              </div>
              <button onClick={() => setShowMarkupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Aumenta o descuenta un porcentaje a los precios base de los productos de forma masiva.
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Aplicar a la Categoría</label>
                <select
                  value={markupCategory}
                  onChange={(e) => setMarkupCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#444] rounded-xl text-white outline-none cursor-pointer"
                >
                  <option value="all">Todas las Categorías ({workingProducts.length} productos)</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Porcentaje de Ajuste (ej. 10 para +10%, -5 para descuento)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-[#1b1b1b] border border-[#444] rounded-xl text-[#FFF3BC] font-mono font-bold text-center"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[5, 10, 15, -5, -10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMarkupPercent(val)}
                    className="px-2.5 py-1 rounded-lg bg-[#333] hover:bg-[#444] text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    {val > 0 ? `+${val}%` : `${val}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3b3b3b]">
              <button
                onClick={() => setShowMarkupModal(false)}
                className="px-4 py-2 rounded-xl bg-[#333] text-slate-300 font-bold hover:bg-[#444] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyMarkup}
                className="px-5 py-2 rounded-xl bg-[#ECB769] hover:bg-[#d99f4d] text-[#202020] font-black cursor-pointer"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
