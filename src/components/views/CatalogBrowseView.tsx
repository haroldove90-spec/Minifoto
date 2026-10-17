import React, { useState } from 'react';
import { Product, Category, CartItem, Sale, Role } from '../../types';
import { 
  Camera, 
  Church, 
  Maximize2, 
  Film, 
  Sparkles, 
  PartyPopper, 
  Coffee, 
  GraduationCap, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  X, 
  Share2, 
  CreditCard, 
  ArrowRight,
  Phone,
  FileText,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { CATEGORY_FALLBACK_IMAGES } from '../../services/initialData';
import confetti from 'canvas-confetti';

interface CatalogBrowseViewProps {
  products: Product[];
  currentRole: Role;
  operatorName: string;
  onCompleteSale?: (sale: Sale, options?: { autoPrint?: boolean }) => void;
  brandPhone?: string;
  brandBusinessName?: string;
}

export const CatalogBrowseView: React.FC<CatalogBrowseViewProps> = ({
  products,
  currentRole,
  operatorName,
  onCompleteSale,
  brandPhone = '555-789-0123',
  brandBusinessName = 'FOTOGRAFÍA & VIDEO ESTUDIO',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected items (Cart)
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  
  // Client order form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  // Extras modal
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [extraRetoque, setExtraRetoque] = useState(false);
  const [extraAutoAdherible, setExtraAutoAdherible] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);

  const categories: { id: Category; label: string; icon: any; color: string }[] = [
    { id: 'foto_estudio', label: 'Foto Estudio', icon: Camera, color: 'text-yellow-600' },
    { id: 'ampliaciones', label: 'Ampliaciones', icon: Maximize2, color: 'text-lime-600' },
    { id: 'minilab', label: 'Minilab', icon: Film, color: 'text-yellow-500' },
    { id: 'iglesias', label: 'Iglesias / Eventos', icon: Church, color: 'text-amber-600' },
    { id: 'fotoacabado', label: 'Fotoacabado', icon: Sparkles, color: 'text-lime-500' },
    { id: 'salon_seis_party', label: 'Salón Six Party', icon: PartyPopper, color: 'text-emerald-600' },
    { id: 'fuente_sodas', label: 'Fuente de Sodas', icon: Coffee, color: 'text-orange-600' },
    { id: 'graduaciones', label: 'Graduaciones 2026', icon: GraduationCap, color: 'text-teal-600' },
  ];

  // Only active products are shown to clients and vendors
  const activeProducts = products.filter((p) => p.isActive !== false);

  const filteredProducts = activeProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery = 
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  const totalItemsCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selectedItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Add product to selection
  const addProductToSelection = (product: Product, extras?: { retoque?: boolean; autoAdherible?: boolean }, qty = 1) => {
    const retoqueP = extras?.retoque ? (product.defaultRetoquePrice || 30) : 0;
    const autoAdhP = extras?.autoAdherible ? (product.defaultAutoAdheriblePrice || 20) : 0;
    const unitPrice = product.price + retoqueP + autoAdhP;

    const existingIdx = selectedItems.findIndex(
      (it) => it.productId === product.id &&
              it.options.retoque === !!extras?.retoque &&
              it.options.autoAdherible === !!extras?.autoAdherible
    );

    if (existingIdx >= 0) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setSelectedItems(updated);
    } else {
      const newItem: CartItem = {
        id: `sel-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        category: product.category,
        unitPrice,
        quantity: qty,
        options: {
          retoque: extras?.retoque,
          retoquePrice: retoqueP,
          autoAdherible: extras?.autoAdherible,
          autoAdheriblePrice: autoAdhP,
        },
        totalPrice: unitPrice * qty,
      };
      setSelectedItems([...selectedItems, newItem]);
    }

    try {
      confetti({ particleCount: 30, spread: 60 });
    } catch {}
  };

  const handleCardClick = (product: Product) => {
    if (product.category === 'foto_estudio' || product.hasExtras) {
      setActiveModalProduct(product);
      setExtraRetoque(false);
      setExtraAutoAdherible(false);
      setModalQuantity(1);
    } else {
      addProductToSelection(product);
    }
  };

  const handleConfirmModalExtras = () => {
    if (!activeModalProduct) return;
    addProductToSelection(activeModalProduct, {
      retoque: extraRetoque,
      autoAdherible: extraAutoAdherible,
    }, modalQuantity);
    setActiveModalProduct(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = selectedItems.map((item) => {
      if (item.id === id) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        return { ...item, quantity: nextQty, totalPrice: nextQty * item.unitPrice };
      }
      return item;
    }).filter(Boolean) as CartItem[];

    setSelectedItems(updated);
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  // WhatsApp order submission for client or field vendor
  const handleSendOrderWhatsApp = () => {
    if (selectedItems.length === 0) return;

    const itemsText = selectedItems.map((it) => {
      let opt = '';
      if (it.options.retoque) opt += ' +Retoque';
      if (it.options.autoAdherible) opt += ' +Autoadherible';
      return `• ${it.quantity}x ${it.name}${opt} - $${it.totalPrice.toFixed(2)}`;
    }).join('\n');

    const message = 
      `📸 *PEDIDO DE CATÁLOGO - ${brandBusinessName}*\n` +
      `--------------------------------\n` +
      `Cliente: ${clientName.trim() || 'Cliente Invitado'}\n` +
      `Teléfono: ${clientPhone.trim() || 'No especificado'}\n` +
      (clientNotes.trim() ? `Notas: ${clientNotes.trim()}\n` : '') +
      `Atendió: ${operatorName}\n` +
      `--------------------------------\n` +
      `*PRODUCTOS SELECCIONADOS:*\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `*TOTAL: $${totalAmount.toFixed(2)} MXN*\n\n` +
      `Hola, me gustaría confirmar y solicitar este pedido de su catálogo fotográfico.`;

    const cleanPhone = brandPhone.replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/521${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 4000);
  };

  // Vendor direct checkout / sale creation
  const handleVendorRegisterSale = () => {
    if (selectedItems.length === 0 || !onCompleteSale) return;

    const folio = `VEN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: Sale = {
      id: `sale-vendor-${Date.now()}`,
      folio,
      date: dateStr,
      role: 'field',
      operatorName: operatorName || 'Vendedor en Campo',
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      items: [...selectedItems],
      subtotal: totalAmount,
      discount: 0,
      total: totalAmount,
      paymentMethod: 'efectivo',
      amountPaid: totalAmount,
      change: 0,
      status: 'completado',
      notes: clientNotes.trim() || 'Pedido levantado desde Catálogo Digital por Vendedor',
    };

    onCompleteSale(newSale, { autoPrint: true });
    setSelectedItems([]);
    setIsOrderDrawerOpen(false);
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-28 md:pb-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Banner de Cabecera del Catálogo */}
        <div className="bg-gradient-to-r from-[#004C59] via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CATÁLOGO DIGITAL INTERACTIVO</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              {currentRole === 'client' ? 'Nuestros Trabajos y Servicios Fotográficos' : 'Catálogo para Vendedores en Campo y Mostrador'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Explora todas las fotografías y conceptos. Toca cualquier producto para seleccionarlo, elegir opciones de retoque o agregarlo a tu pedido.
            </p>
          </div>

          {/* Botón flotante para ver selección */}
          <button
            onClick={() => setIsOrderDrawerOpen(true)}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-[#F97800] hover:bg-orange-600 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl border-2 border-orange-400 cursor-pointer transition shrink-0"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Ver Mi Pedido ({totalItemsCount})</span>
            <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-xs sm:text-sm">
              ${totalAmount.toFixed(2)}
            </span>
          </button>
        </div>

        {/* Barra de Categorías y Buscador */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#004C59] text-white ring-2 ring-[#004C59]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Todos los Productos ({activeProducts.length})</span>
            </button>

            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = activeProducts.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? 'bg-[#004C59] text-white ring-2 ring-[#004C59]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : cat.color}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Buscar en el catálogo por nombre, medidas o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#004C59]"
            />
          </div>
        </div>

        {/* =========================================================================
            CUADRÍCULA: 4 IMÁGENES EN FULLSCREEN Y TABLET, 2 COLUMNAS EN MÓVIL
            ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">No se encontraron productos en esta categoría</p>
              <p className="text-xs text-slate-500 mt-1">Prueba seleccionando otra categoría o borrando la búsqueda.</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const fallbackImg = CATEGORY_FALLBACK_IMAGES[prod.category] || CATEGORY_FALLBACK_IMAGES.foto_estudio;
              const displayImg = prod.imageUrl || fallbackImg;
              const isSelected = selectedItems.some((i) => i.productId === prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleCardClick(prod)}
                  className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-98 flex flex-col overflow-hidden cursor-pointer group ${
                    isSelected ? 'border-[#004C59] ring-2 ring-[#004C59]/30' : 'border-slate-200 hover:border-yellow-400'
                  }`}
                >
                  {/* FOTO GRANDE DEL PRODUCTO (aspect-4/3 o h-44 sm:h-52) */}
                  <div className="relative w-full h-40 sm:h-52 bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={displayImg}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackImg;
                      }}
                    />

                    {/* Badge de extras si aplica */}
                    {prod.hasExtras && (
                      <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-md border border-yellow-500">
                        +Extras (Retoque)
                      </span>
                    )}

                    {/* Precio en badge sobre foto */}
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

                    {/* Botón de Selección */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-black text-[#004C59] font-mono">
                        ${prod.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-[#004C59] hover:bg-teal-900 text-white font-black text-xs rounded-xl transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Seleccionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL EXTRAS (Retoque Digital / Autoadherible) */}
        {activeModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#004C59] text-slate-800">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeModalProduct.imageUrl || CATEGORY_FALLBACK_IMAGES[activeModalProduct.category]}
                    alt={activeModalProduct.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-black text-[#004C59] leading-tight">{activeModalProduct.name}</h3>
                    <span className="text-xs text-slate-500 font-mono font-bold">Base: ${activeModalProduct.price.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalProduct(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between p-3 rounded-2xl border-2 border-slate-200 hover:border-[#004C59] bg-slate-50 cursor-pointer transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extraRetoque}
                      onChange={(e) => setExtraRetoque(e.target.checked)}
                      className="w-5 h-5 text-[#004C59] rounded"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">Lleva Retoque Digital</span>
                  </div>
                  <span className="text-xs font-black text-[#004C59]">
                    +${activeModalProduct.defaultRetoquePrice || 30}
                  </span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border-2 border-slate-200 hover:border-[#004C59] bg-slate-50 cursor-pointer transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extraAutoAdherible}
                      onChange={(e) => setExtraAutoAdherible(e.target.checked)}
                      className="w-5 h-5 text-[#004C59] rounded"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">Lleva Auto adherible</span>
                  </div>
                  <span className="text-xs font-black text-[#004C59]">
                    +${activeModalProduct.defaultAutoAdheriblePrice || 20}
                  </span>
                </label>

                {/* Cantidad */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100">
                  <span className="text-xs font-bold text-slate-700">Cantidad de paquetes:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="p-1 bg-white rounded-lg shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-sm w-6 text-center">{modalQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      className="p-1 bg-white rounded-lg shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(null)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModalExtras}
                  className="flex-2 py-3 text-xs font-black bg-[#004C59] hover:bg-teal-900 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Agregar a Mi Selección
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING ORDER DRAWER / MODAL */}
        {isOrderDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-[#004C59] flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#004C59] to-teal-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h3 className="font-black text-base sm:text-lg">Mi Selección de Productos</h3>
                    <span className="text-xs text-teal-200">{totalItemsCount} artículos en lista</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderDrawerOpen(false)}
                  className="p-1.5 text-teal-200 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
                {selectedItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-slate-600">Aún no has seleccionado productos</p>
                    <p className="text-xs text-slate-400 mt-1">Explora el catálogo y presiona "Seleccionar" en cualquier fotografía.</p>
                  </div>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-slate-900 block truncate">{item.name}</span>
                        {(item.options.retoque || item.options.autoAdherible) && (
                          <span className="text-[10px] text-[#004C59] font-bold block">
                            {item.options.retoque && '+Retoque Digital '}
                            {item.options.autoAdherible && '+Autoadherible'}
                          </span>
                        )}
                        <span className="text-slate-500 font-mono">${item.unitPrice.toFixed(2)} c/u</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 bg-white rounded-lg shadow-2xs hover:bg-slate-200 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-xs font-mono w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 bg-white rounded-lg shadow-2xs hover:bg-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-[#004C59] block">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Form */}
              {selectedItems.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
                  <div className="flex items-center justify-between text-base font-black">
                    <span className="text-slate-700">Total Estimado:</span>
                    <span className="text-2xl font-mono text-[#004C59]">${totalAmount.toFixed(2)} MXN</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del Cliente..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono / WhatsApp..."
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
                    />
                  </div>

                  {/* Actions according to Role */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {/* Botón WhatsApp (Para Cliente o Vendedor) */}
                    <button
                      type="button"
                      onClick={handleSendOrderWhatsApp}
                      className="flex-1 py-3 bg-[#25D366] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Enviar Pedido por WhatsApp</span>
                    </button>

                    {/* Si es vendedor en campo, puede registrarlo directo como venta */}
                    {currentRole === 'field' && onCompleteSale && (
                      <button
                        type="button"
                        onClick={handleVendorRegisterSale}
                        className="flex-1 py-3 bg-[#F97800] hover:bg-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Cobrar y Emitir Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Barra Flotante Inferior en Móvil con Total y Botón */}
        {selectedItems.length > 0 && !isOrderDrawerOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t-2 border-[#F97800] p-3 text-white flex items-center justify-between shadow-2xl safe-bottom">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {totalItemsCount} productos seleccionados
              </span>
              <span className="text-xl font-black text-yellow-400 font-mono">
                ${totalAmount.toFixed(2)} <span className="text-xs">MXN</span>
              </span>
            </div>
            <button
              onClick={() => setIsOrderDrawerOpen(true)}
              className="px-6 py-2.5 bg-[#F97800] hover:bg-orange-600 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg border border-orange-400 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Pedido ➔</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
