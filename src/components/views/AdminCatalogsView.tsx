import React, { useState, useRef } from 'react';
import { Product, Category } from '../../types';
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
  AlertCircle
} from 'lucide-react';
import { CATEGORY_FALLBACK_IMAGES, PRESET_IMAGE_GALLERY } from '../../services/initialData';

interface AdminCatalogsViewProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
}

export const AdminCatalogsView: React.FC<AdminCatalogsViewProps> = ({
  products,
  onSaveProducts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('foto_estudio');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for create / edit
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

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const startCreate = () => {
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
  const handleToggleActive = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextState = p.isActive === false ? true : false;
        showToast(nextState ? `Producto "${p.name}" activado en el POS` : `Producto "${p.name}" desactivado del POS`);
        return { ...p, isActive: nextState };
      }
      return p;
    });
    onSaveProducts(updated);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

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
      showToast(`¡Producto "${newProd.name}" creado y sincronizado con el POS!`);
    } else if (editingProduct) {
      const updated = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
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
        }
        return p;
      });
      onSaveProducts(updated);
      showToast(`¡Producto "${formName.trim()}" actualizado y sincronizado!`);
    }

    cancelForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Seguro que deseas eliminar definitivamente "${name}" del catálogo?`)) {
      const updated = products.filter((p) => p.id !== id);
      onSaveProducts(updated);
      showToast(`Producto "${name}" eliminado`);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
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

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#004C59] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom border-2 border-teal-400">
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
                <span>Gestión de Catálogo y Precios</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Catálogo Multinegocio Sincronizado
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Da de alta productos, asigna fotos, fija precios y activa o desactiva conceptos para el POS en mostrador y campo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={startCreate}
              className="flex items-center gap-2 px-5 py-3 bg-[#004C59] hover:bg-teal-900 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>+ Dar de Alta Producto</span>
            </button>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-amber-50 border border-teal-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Sparkles className="w-5 h-5 text-[#F97800] shrink-0" />
            <span>
              <strong>Sincronización en tiempo real:</strong> Los productos activos se muestran automáticamente en el Punto de Venta Touch con su fotografía, precio y extras.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-xs font-bold">
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

        {/* FORMULARIO DE ALTA / EDICIÓN DE PRODUCTO */}
        {(isCreating || editingProduct) && (
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-3 border-[#004C59] space-y-5 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#004C59] flex items-center gap-2">
                  {isCreating ? <Plus className="w-5 h-5 text-[#F97800]" /> : <Edit3 className="w-5 h-5 text-[#F97800]" />}
                  <span>{isCreating ? 'Dar de Alta Nuevo Producto en el Catálogo' : `Editar Producto: ${editingProduct?.name}`}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Completa los datos del producto o servicio. Se guardará y sincronizará con el Punto de Venta Touch inmediatamente.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECCIÓN 1: FOTO DEL PRODUCTO */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Foto del Producto / Servicio (Visualización en Tarjetas POS)
              </label>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Image Preview Box */}
                <div className="relative w-full md:w-44 h-36 rounded-2xl bg-slate-200 border-2 border-slate-300 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                  {formImageUrl ? (
                    <img
                      src={formImageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[formCategory];
                      }}
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold block">Sin Foto Asignada</span>
                    </div>
                  )}
                  {formImageUrl && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                      Vista previa
                    </span>
                  )}
                </div>

                {/* Image Input Options */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>URL directa de la imagen (o pega un enlace de foto):</span>
                    </label>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto-producto.jpg"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Subir Archivo Local */}
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
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir desde dispositivo (PC/Móvil)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormImageUrl(CATEGORY_FALLBACK_IMAGES[formCategory])}
                      className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-[#004C59] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Usar foto sugerida por categoría
                    </button>
                  </div>

                  {/* Galería Rápida de Fotos de Estudio */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      O selecciona una foto rápida de la galería:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {PRESET_IMAGE_GALLERY.slice(0, 10).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className="px-2 py-1 bg-white hover:bg-yellow-50 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 whitespace-nowrap active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL PRODUCTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Producto o Servicio *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Foto Infantil Mate, Ampliación 11x14, Renta Salón..."
                  className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Categoría del Sistema *</label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as Category;
                    setFormCategory(nextCat);
                    if (!formImageUrl || formImageUrl === CATEGORY_FALLBACK_IMAGES[formCategory]) {
                      setFormImageUrl(CATEGORY_FALLBACK_IMAGES[nextCat]);
                    }
                    if (nextCat === 'foto_estudio') {
                      setFormHasExtras(true);
                    }
                  }}
                  className="w-full text-xs sm:text-sm font-bold px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
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
                <label className="text-xs font-bold text-slate-700 block">Estado en el POS:</label>
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
                      <span>Activo (Visible en POS)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>Desactivado (Oculto en POS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Descripción o Detalles Técnicos (opcional):</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Ej. 6 piezas papel mate, fondo blanco reglamentario, entrega el mismo día..."
                className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
              />
            </div>

            {/* Extras Configuration (Retoque / Autoadherible) */}
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
                <Save className="w-4 h-4" />
                <span>{isCreating ? 'Guardar y Sincronizar en POS' : 'Guardar Cambios'}</span>
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
              const count = products.filter((p) => p.category === cat.id).length;
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
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
              />
            </div>

            {/* Status Filter */}
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
          </div>
        </div>

        {/* LISTADO / CUADRÍCULA DE PRODUCTOS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              {selectedCategory === 'all' ? 'Todos los Productos y Servicios' : categories.find((c) => c.id === selectedCategory)?.label}
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">
              {filteredProducts.length} productos listados
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No se encontraron productos con los filtros seleccionados</p>
              <p className="text-xs text-slate-500 mt-1">Haz clic en "+ Dar de Alta Producto" para agregar uno nuevo.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const isActive = prod.isActive !== false;
                const fallbackImg = CATEGORY_FALLBACK_IMAGES[prod.category] || CATEGORY_FALLBACK_IMAGES.foto_estudio;
                const displayImg = prod.imageUrl || fallbackImg;

                return (
                  <div
                    key={prod.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition ${
                      isActive ? 'hover:bg-slate-50/80' : 'bg-slate-50/60 opacity-75'
                    }`}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Photo Thumbnail */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                        <img
                          src={displayImg}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = fallbackImg;
                          }}
                        />
                        {!isActive && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                            <span className="text-[9px] font-black text-rose-300 uppercase">Inactivo</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 truncate">{prod.name}</h4>
                          
                          {/* Active / Inactive Badge */}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isActive ? '● Activo en POS' : '✕ Desactivado'}
                          </span>

                          {prod.hasExtras && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                              + Retoque / Adherible
                            </span>
                          )}
                        </div>

                        {prod.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{prod.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="capitalize">{prod.category.replace('_', ' ')}</span>
                          {prod.unit && <span>• Unidad: {prod.unit}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Quick Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="font-mono font-black text-base sm:text-lg text-[#004C59] block">
                          ${prod.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Precio POS</span>
                      </div>

                      {/* Quick Toggle Active Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(prod.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
                          isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                        }`}
                        title={isActive ? 'Desactivar producto (ocultar del POS)' : 'Activar producto (mostrar en el POS)'}
                      >
                        {isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden md:inline">Desactivar</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden md:inline">Activar</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => startEdit(prod)}
                        className="p-2 text-slate-600 hover:text-[#004C59] hover:bg-teal-50 rounded-xl transition cursor-pointer"
                        title="Editar datos, foto y precio"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Eliminar del catálogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
