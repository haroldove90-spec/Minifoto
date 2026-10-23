import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, Role, CartItem } from '../../types';
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
  Info,
  CheckSquare,
  Square,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Tag
} from 'lucide-react';
import { CATEGORY_FALLBACK_IMAGES } from '../../services/initialData';
import { 
  saveProductToSupabase, 
  saveProductsBatchToSupabase, 
  deleteProductFromSupabase,
  deleteProductsBatchFromSupabase,
  testSupabaseConnection, 
  COMPLETE_SUPABASE_SQL, 
  SUPABASE_CONFIG_DATA,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase
} from '../../services/supabaseClient';
import { markProductAsDeleted, getStoredCategories, saveStoredCategories } from '../../services/storage';
import { CategoryItem } from '../../types';

interface AdminCatalogsViewProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  currentRole?: Role | null;
  operatorName?: string;
  onGoToPOSWithItems?: (items: CartItem[]) => void;
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
  onGoToPOSWithItems,
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

  // Bulk Delete state for Admin
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

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
  const [showSetupInstructions, setShowSetupInstructions] = useState(true);

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

  // Dynamic categories list initialized from storage
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(() => getStoredCategories());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('text-teal-600');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Helper to resolve icon for any category
  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'foto_estudio': return Camera;
      case 'ampliaciones': return Maximize2;
      case 'minilab': return Film;
      case 'iglesias': return Church;
      case 'fotoacabado': return Sparkles;
      case 'salon_seis_party': return PartyPopper;
      case 'fuente_sodas': return Coffee;
      case 'graduaciones': return GraduationCap;
      default: return Tag;
    }
  };

  // Add new category
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      alert('Por favor escribe el nombre de la categoría.');
      return;
    }

    const id = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_') || `cat_${Date.now()}`;

    if (categoriesList.some((c) => c.id === id || c.label.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Ya existe una categoría llamada "${trimmed}".`);
      return;
    }

    setIsAddingCategory(true);
    const newCat: CategoryItem = {
      id,
      label: trimmed,
      color: newCatColor,
      createdAt: new Date().toISOString(),
    };

    const updated = [...categoriesList, newCat];
    setCategoriesList(updated);
    saveStoredCategories(updated);
    await saveCategoryToSupabase(newCat);
    setIsAddingCategory(false);
    setNewCatName('');
    showToast(`¡Categoría "${trimmed}" agregada y sincronizada con Supabase!`);
  };

  // Delete category
  const handleDeleteCategory = async (catId: string, catLabel: string) => {
    if (!isAdmin) return;
    const count = products.filter((p) => p.category === catId).length;
    const confirmMsg = count > 0
      ? `¿Seguro que deseas eliminar definitivamente la categoría "${catLabel}"?\n\nExisten ${count} producto(s) en esta categoría. Se borrará de Supabase y del navegador.`
      : `¿Seguro que deseas eliminar la categoría "${catLabel}"? Se borrará de Supabase y del navegador.`;

    if (!confirm(confirmMsg)) return;

    const updated = categoriesList.filter((c) => c.id !== catId);
    setCategoriesList(updated);
    saveStoredCategories(updated);
    await deleteCategoryFromSupabase(catId);

    if (selectedCategory === catId) {
      setSelectedCategory('all');
    }
    if (formCategory === catId) {
      setFormCategory(updated[0]?.id || 'foto_estudio');
    }
    showToast(`Categoría "${catLabel}" eliminada del sistema y Supabase.`);
  };

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
    setTimeout(() => setNotification(null), 4000);
  };

  const startCreate = () => {
    if (!isAdmin) return;
    setIsCreating(true);
    setEditingProduct(null);
    const defaultCat = categoriesList[0]?.id || 'foto_estudio';
    const cat = selectedCategory === 'all' ? defaultCat : selectedCategory;
    setFormCategory(cat);
    setFormName('');
    setFormPrice(100);
    setFormDesc('');
    setFormUnit('pza');
    // EN BLANCO: Listo para subir la foto propia del producto
    setFormImageUrl('');
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
    setFormImageUrl(p.imageUrl || '');
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

    const finalImage = formImageUrl.trim();

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

  // SINGLE PRODUCT DELETE: Permanently remove from state, mark in localStorage, and delete from Supabase
  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`¿Seguro que deseas eliminar definitivamente "${name}" del catálogo? Se borrará de Supabase y no volverá a cargarse.`)) {
      // 1. Mark as permanently deleted in localStorage so browser never resurrects it
      markProductAsDeleted(id);

      // 2. Delete from Supabase
      deleteProductFromSupabase(id);

      // 3. Update local state
      const updated = products.filter((p) => p.id !== id);
      onSaveProducts(updated);

      // If it was selected for bulk delete, remove it
      setSelectedForDelete((prev) => prev.filter((item) => item !== id));

      showToast(`Producto "${name}" eliminado permanentemente del sistema y Supabase`);
    }
  };

  // BULK PRODUCT SELECTION & DELETE (One or Multiple Products)
  const toggleSelectForDelete = (productId: string) => {
    setSelectedForDelete((prev) => 
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllForDelete = () => {
    const currentFilteredIds = filteredProducts.map((p) => p.id);
    const allSelected = currentFilteredIds.every((id) => selectedForDelete.includes(id));
    if (allSelected) {
      setSelectedForDelete((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      setSelectedForDelete((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedForDelete.length === 0) return;

    const count = selectedForDelete.length;
    const confirmMessage = count === 1
      ? '¿Confirmas eliminar definitivamente este producto? Se borrará de Supabase y del navegador, y NO volverá a cargarse.'
      : `¿Confirmas eliminar definitivamente los ${count} productos seleccionados? Se borrarán de Supabase y del navegador, y NO volverán a cargarse.`;

    if (!confirm(confirmMessage)) return;

    setIsDeletingBulk(true);

    // 1. Register IDs in permanent deleted list so browser NEVER restores them
    markProductAsDeleted(selectedForDelete);

    // 2. Delete all from Supabase
    await deleteProductsBatchFromSupabase(selectedForDelete);

    // 3. Remove from local state
    const remaining = products.filter((p) => !selectedForDelete.includes(p.id));
    onSaveProducts(remaining);

    setIsDeletingBulk(false);
    setSelectedForDelete([]);
    setIsBulkDeleteMode(false);

    showToast(`✓ ${count} producto(s) borrados definitivamente del navegador y Supabase`);
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

  // Format WhatsApp order text
  const generateWhatsAppMessage = () => {
    let msg = `*MINIFOTO - Solicitud de Pedido y Venta Fotográfica:*\n\n`;
    selectedList.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}* (x${item.quantity}) - $${item.total.toFixed(2)}\n`;
      if (item.retoque) msg += `   + Retoque Digital\n`;
      if (item.autoadherible) msg += `   + Autoadherible\n`;
    });
    msg += `\n*Total a Pagar:* $${totalSelectedAmount.toFixed(2)} MXN\n`;
    msg += `Atendido por / Contacto: ${operatorName}\n`;
    msg += `¡Listo para procesar y emitir ticket de venta!`;
    return encodeURIComponent(msg);
  };

  // Send items directly to POS checkout
  const handleSendSelectionToPOS = () => {
    if (selectedList.length === 0) return;
    const cartItems: CartItem[] = selectedList.map((item) => ({
      id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: item.productId,
      name: item.name,
      category: item.category,
      unitPrice: item.price + item.extraTotal / item.quantity,
      quantity: item.quantity,
      options: {
        retoque: item.retoque,
        retoquePrice: item.retoque ? 30 : 0,
        autoAdherible: item.autoadherible,
        autoAdheriblePrice: item.autoadherible ? 20 : 0,
      },
      totalPrice: item.total,
    }));
    if (onGoToPOSWithItems) {
      onGoToPOSWithItems(cartItems);
      showToast('¡Productos enviados al Punto de Venta Touch!');
    }
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-28 md:pb-12 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#4E2B01] text-[#FFF3BC] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom border-2 border-[#ECB769]">
            <CheckCircle2 className="w-5 h-5 text-[#ECB769] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header & Stats Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-[#FFF3BC] text-[#4E2B01] rounded-2xl shrink-0 shadow-xs">
              <Layers className="w-7 h-7 text-[#4E2B01]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF3BC] border border-[#ECB769]/50 text-[#4E2B01] text-[10px] font-black uppercase mb-1">
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
                  ? 'Gestión de Catálogo, Fotos y Base de Datos' 
                  : isField 
                  ? 'Catálogo Fotográfico para Venta en Campo' 
                  : 'Catálogo de Fotografías y Paquetes'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                {isAdmin
                  ? 'Sube fotos, asigna precios, activa/desactiva productos o selecciona varios para borrarlos definitivamente del navegador y Supabase.'
                  : 'Explora las fotografías y servicios disponibles en alta calidad. Selecciona productos para realizar compras en el punto de venta touch y emitir tickets.'}
              </p>
            </div>
          </div>

          {/* ADMIN CONTROLS: Solo el admin puede subir fotos, seleccionar para borrar o gestionar */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botón Seleccionar Varios para Borrar */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isBulkDeleteMode;
                  setIsBulkDeleteMode(nextState);
                  if (!nextState) setSelectedForDelete([]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                  isBulkDeleteMode
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-200'
                }`}
                title="Seleccionar uno o varios productos para eliminarlos permanentemente"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isBulkDeleteMode ? 'Terminar Selección' : 'Seleccionar para Borrar'}</span>
              </button>

              {/* Botón Gestionar Categorías */}
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 text-xs font-bold rounded-2xl transition cursor-pointer shadow-xs"
                title="Agregar o borrar categorías del catálogo"
              >
                <FolderPlus className="w-4 h-4 text-[#4E2B01]" />
                <span>Gestionar Categorías</span>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] active:scale-95 text-[#FFF3BC] text-xs sm:text-sm font-black rounded-2xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-5 h-5 text-[#ECB769]" />
                <span>+ Nuevo Producto</span>
              </button>
            </div>
          )}

          {/* CLIENT & FIELD BADGE / SUMMARY BUTTON */}
          {!isAdmin && totalSelectedCount > 0 && (
            <button
              onClick={() => setShowSummaryDrawer(true)}
              className="flex items-center gap-2.5 px-5 py-3 bg-[#4E2B01] hover:bg-[#381e01] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg border-2 border-[#ECB769] cursor-pointer transition active:scale-95 shrink-0"
            >
              <ShoppingCart className="w-5 h-5 text-[#ECB769]" />
              <span>Ver Selección ({totalSelectedCount}) • ${totalSelectedAmount.toFixed(2)}</span>
            </button>
          )}
        </div>

        {/* =========================================================================
            BARRA DE ACCIÓN CUANDO ESTÁ ACTIVO EL MODO DE BORRADO MÚLTIPLE (ADMIN)
            ========================================================================= */}
        {isAdmin && (isBulkDeleteMode || selectedForDelete.length > 0) && (
          <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-600 text-white rounded-2xl shrink-0 shadow-sm">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black text-rose-900 block uppercase tracking-wide">
                  Modo de Borrado Múltiple Activo
                </span>
                <span className="text-xs text-rose-700 font-medium">
                  Has marcado <strong>{selectedForDelete.length}</strong> de {filteredProducts.length} producto(s). Los productos eliminados <strong>no volverán a cargarse en el navegador</strong> y se borrarán de Supabase.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSelectAllForDelete}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition cursor-pointer shadow-xs"
              >
                {filteredProducts.length > 0 && filteredProducts.every((p) => selectedForDelete.includes(p.id)) 
                  ? 'Deseleccionar Todos' 
                  : 'Seleccionar Todos'}
              </button>

              <button
                type="button"
                disabled={selectedForDelete.length === 0 || isDeletingBulk}
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingBulk ? 'Borrando...' : `Eliminar (${selectedForDelete.length}) Seleccionados`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBulkDeleteMode(false);
                  setSelectedForDelete([]);
                }}
                className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-xl"
                title="Cerrar modo de borrado"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            ALERTA VISUAL Y GUÍA: POR QUÉ LAS TABLAS NO APARECEN EN EL TABLE EDITOR
            ========================================================================= */}
        {isAdmin && !supabaseStatus.tablesExist && (
          <div className="bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md text-slate-900 animate-in fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 mt-0.5 shadow-sm">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-200 border border-amber-400 text-amber-950 text-[10px] font-black uppercase">
                    <span>Acción Requerida en tu Panel de Supabase</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    ¿Por qué el Table Editor de Supabase dice "No tables or views"?
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Tu proyecto <strong>{SUPABASE_CONFIG_DATA.projectId}</strong> está conectado, pero en Supabase las tablas no se crean solas: se crean ejecutando el script SQL una sola vez en el <strong>SQL Editor</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_CONFIG_DATA.projectId}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] font-black text-xs sm:text-sm rounded-2xl shadow-md transition cursor-pointer"
                >
                  <span>1. Abrir SQL Editor en Supabase</span>
                  <ExternalLink className="w-4 h-4 text-[#ECB769]" />
                </a>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#ECB769] hover:bg-[#d9a456] text-[#202020] font-black text-xs sm:text-sm rounded-2xl shadow-md transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? '¡SQL Copiado!' : '2. Copiar Script SQL'}</span>
                </button>
              </div>
            </div>

            {/* 3 Pasos Visuales */}
            <div className="mt-4 pt-4 border-t border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 font-black text-[#4E2B01] mb-1">
                  <span className="w-5 h-5 rounded-full bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-center text-[10px]">1</span>
                  <span>Abre el SQL Editor</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  En el menú oscuro de la izquierda de Supabase, haz clic en el icono <strong>&gt;_</strong> (SQL Editor) o en el botón azul de arriba.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 font-black text-[#4E2B01] mb-1">
                  <span className="w-5 h-5 rounded-full bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-center text-[10px]">2</span>
                  <span>Pega el Script SQL</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Copia el script con el botón amarillo y pégalo en el editor de consultas (New Query) de Supabase.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 font-black text-[#4E2B01] mb-1">
                  <span className="w-5 h-5 rounded-full bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-center text-[10px]">3</span>
                  <span>Presiona "Run"</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Haz clic en el botón verde <strong>Run</strong>. Al regresar al Table Editor verás las 4 tablas: <code>products</code>, <code>sales</code>, <code>graduation_students</code> y <code>schools</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Supabase Status Banner (Visible for Admin) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-[#FFF3BC]/60 via-[#FCF9F2] to-amber-50 border border-[#ECB769]/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#4E2B01] shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">
                  Supabase Proyecto: <code className="text-[#4E2B01] font-mono text-[11px] font-black">{SUPABASE_CONFIG_DATA.projectId}</code>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_CONFIG_DATA.projectId}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline"
                >
                  <span>Abrir SQL Editor en Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

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

        {/* MODAL GESTIÓN DE CATEGORÍAS (AGREGAR Y BORRAR) */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#ECB769] text-[#202020] rounded-xl shadow-xs">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black">Gestionar Categorías del Catálogo</h3>
                    <p className="text-[11px] text-[#FFF3BC]/80">Agrega nuevas categorías o elimina existentes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-6">
                {/* Form to add a new category */}
                <form onSubmit={handleAddCategory} className="bg-[#FCF9F2] p-4 rounded-2xl border border-[#ECB769]/30 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#4E2B01]" />
                    <span>Agregar Nueva Categoría</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Nombre de la Categoría *</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej. Retablos y Marcos, Fotolibros, Sublimación..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Color de Identificación:</label>
                    <select
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="text-[#4E2B01]">Café Minifoto</option>
                      <option value="text-[#ECB769]">Dorado Minifoto</option>
                      <option value="text-amber-600">Ámbar / Naranja</option>
                      <option value="text-emerald-600">Esmeralda</option>
                      <option value="text-indigo-600">Índigo / Azul</option>
                      <option value="text-rose-600">Rosa / Magenta</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingCategory || !newCatName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] active:scale-95 disabled:opacity-50 text-[#FFF3BC] text-xs font-black rounded-xl transition cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#ECB769]" />
                    <span>{isAddingCategory ? 'Guardando en Supabase...' : 'Guardar Nueva Categoría'}</span>
                  </button>
                </form>

                {/* List of existing categories with delete option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Categorías Registradas ({categoriesList.length})
                    </h4>
                    <span className="text-[10px] text-slate-400">Toca el botón rojo para borrar</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {categoriesList.map((cat) => {
                      const Icon = getCategoryIcon(cat.id);
                      const prodsCount = products.filter((p) => p.category === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                              <Icon className={`w-4 h-4 ${cat.color || 'text-teal-600'}`} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-slate-800 block truncate">
                                {cat.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                ID: {cat.id} • {prodsCount} producto(s)
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.label)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                            title={`Eliminar categoría "${cat.label}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Borrar</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cerrar
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
              <div className="relative w-full h-56 sm:h-64 bg-slate-100 shrink-0 flex items-center justify-center">
                {detailModalProduct.imageUrl ? (
                  <img
                    src={detailModalProduct.imageUrl}
                    alt={detailModalProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-12 h-12 text-slate-300 mb-1" />
                    <span className="text-xs font-semibold text-slate-400">Sin fotografía</span>
                  </div>
                )}
                <button
                  onClick={() => setDetailModalProduct(null)}
                  className="absolute top-3 right-3 p-2 bg-[#202020]/80 hover:bg-[#202020] text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 left-3 bg-[#4E2B01] text-[#FFF3BC] text-xs font-black px-3 py-1 rounded-xl shadow-md uppercase">
                  {detailModalProduct.category.replace('_', ' ')}
                </span>
                <span className="absolute bottom-3 right-3 bg-[#ECB769] text-[#202020] font-mono font-black text-base px-3 py-1 rounded-xl shadow-md">
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
                          className="w-4 h-4 text-[#4E2B01] rounded"
                        />
                        <span className="text-xs font-bold text-slate-800">Retoque Digital Profesional</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#4E2B01]">
                        +${detailModalProduct.defaultRetoquePrice || 30}.00
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={modalAutoAdh}
                          onChange={(e) => setModalAutoAdh(e.target.checked)}
                          className="w-4 h-4 text-[#4E2B01] rounded"
                        />
                        <span className="text-xs font-bold text-slate-800">Adhesivo Autoadherible</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#4E2B01]">
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
                  <span className="text-lg font-black text-[#4E2B01] font-mono">
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
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#4E2B01] hover:bg-[#381e01] active:scale-95 text-[#FFF3BC] font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#ECB769]" />
                  <span>{selectedItems[detailModalProduct.id] ? 'Actualizar Selección' : 'Seleccionar este Producto'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / DRAWER RESUMEN DE PRODUCTOS SELECCIONADOS (CLIENTE Y CAMPO) */}
        {showSummaryDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-[#4E2B01] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 bg-[#4E2B01] text-[#FFF3BC] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-6 h-6 text-[#ECB769]" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black">Resumen de Selección</h3>
                    <p className="text-xs text-[#FFF3BC]/80">
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
                          {item.retoque && <span className="ml-1 text-[#4E2B01] font-bold">+ Retoque</span>}
                          {item.autoadherible && <span className="ml-1 text-[#4E2B01] font-bold">+ Adhesivo</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#4E2B01] block">
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
                  <span className="text-xl font-black text-[#4E2B01] font-mono">
                    ${totalSelectedAmount.toFixed(2)} MXN
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

                  {onGoToPOSWithItems && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSendSelectionToPOS();
                        setShowSummaryDrawer(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] font-black text-xs rounded-xl shadow-md border-2 border-[#ECB769] transition cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#ECB769]" />
                      <span>Comprar en POS / Cobrar Ahora</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Pedido por WhatsApp</span>
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
            className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border-2 border-[#4E2B01] space-y-5 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ECB769] rounded-xl text-[#202020] shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {isCreating ? 'Dar de Alta Nuevo Producto & Subir Fotografía' : `Editar Producto: ${editingProduct?.name}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sube una foto desde tu equipo o dispositivo móvil. Se sincronizará inmediatamente.
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
                  <ImageIcon className="w-4 h-4 text-[#4E2B01]" />
                  <span>Fotografía del Producto / Portada *</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Visible en Catálogo de 4 columnas y POS
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview Thumbnail: Starts in blank with prompt to upload */}
                {formImageUrl ? (
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-300 shrink-0 shadow-md group">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg shadow-sm hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cambiar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="px-3 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-rose-700 transition cursor-pointer"
                      >
                        Dejar en Blanco
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-[#ECB769]/50 hover:border-[#4E2B01] bg-[#FFF3BC]/20 hover:bg-[#FFF3BC]/50 shrink-0 shadow-inner flex flex-col items-center justify-center text-center p-3 cursor-pointer transition group"
                    title="Toca aquí para seleccionar una imagen desde tu dispositivo"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF3BC] group-hover:bg-[#4E2B01] group-hover:text-[#FFF3BC] text-[#4E2B01] flex items-center justify-center transition mb-2 shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-700 leading-tight">
                      En blanco
                    </span>
                    <span className="text-[10px] text-[#4E2B01] font-bold mt-1">
                      Toca para subir foto
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Listo para tu producto
                    </span>
                  </div>
                )}

                {/* Upload & Source Controls (No preset stock images) */}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <Upload className="w-4 h-4 text-yellow-400" />
                        <span>Elegir Foto de mi Dispositivo</span>
                      </button>

                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar Foto</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Formatos JPG, PNG, WebP (Máx 2MB)</span>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      2. O escribe la URL directa de la imagen (opcional):
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://ejemplo.com/mifoto.jpg"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                      />
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
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Categoría del Catálogo *</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[10px] font-bold text-[#4E2B01] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3 text-[#ECB769]" />
                    <span>+ Nueva / Borrar Categoría</span>
                  </button>
                </div>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-medium"
                >
                  {categoriesList.map((c) => (
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
                  className="w-full text-sm font-black text-[#4E2B01] px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Unidad de Venta (opcional):</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Ej. pza, juego, evento, paquete..."
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
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
                className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
            </div>

            {/* Extras Configuration */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formHasExtras}
                  onChange={(e) => setFormHasExtras(e.target.checked)}
                  className="w-4 h-4 text-[#4E2B01] rounded border-slate-300 focus:ring-[#4E2B01]"
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
                className="flex items-center gap-2 px-6 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] active:scale-95 text-[#FFF3BC] text-xs sm:text-sm font-black rounded-xl shadow-lg transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#ECB769]" />
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
                  ? 'bg-[#4E2B01] text-[#FFF3BC] ring-2 ring-[#4E2B01]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Todos los Catálogos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>
                {products.length}
              </span>
            </button>

            {categoriesList.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => p.category === cat.id && (isAdmin || p.isActive !== false)).length;
              return (
                <div key={cat.id} className="relative flex items-center shrink-0">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#4E2B01] text-[#FFF3BC] ring-2 ring-[#4E2B01]'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#ECB769]' : (cat.color || 'text-[#4E2B01]')}`} />
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>

                  {/* Quick delete category button for Admin */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.label);
                      }}
                      className="ml-1 p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title={`Eliminar categoría "${cat.label}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Quick Add Category Button for Admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs whitespace-nowrap bg-[#FFF3BC] hover:bg-[#FFF3BC]/80 text-[#4E2B01] border-2 border-dashed border-[#ECB769] transition-all shadow-xs cursor-pointer shrink-0"
                title="Crear una nueva categoría para tus productos"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Categoría</span>
              </button>
            )}
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
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4E2B01]"
              />
            </div>

            {/* Status Filter: Solo visible para Admin */}
            {isAdmin ? (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-bold">
                <span className="text-slate-500 text-[11px] uppercase">Mostrar:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-[#4E2B01] text-[#FFF3BC]' : 'text-slate-600 hover:bg-slate-100'}`}
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
                <Info className="w-3.5 h-3.5 text-[#4E2B01]" />
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
              {selectedCategory === 'all' ? 'Todos los Productos del Catálogo' : categoriesList.find((c) => c.id === selectedCategory)?.label || selectedCategory}
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
                const isSelectedByRole = !isAdmin && !!selectedItems[prod.id];
                const selectedQty = selectedItems[prod.id]?.quantity || 0;
                const isSelectedForDeletion = isAdmin && selectedForDelete.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (isAdmin) {
                        if (isBulkDeleteMode) {
                          toggleSelectForDelete(prod.id);
                        }
                      } else {
                        openProductDetailModal(prod);
                      }
                    }}
                    className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 shadow-sm hover:shadow-xl flex flex-col overflow-hidden relative ${
                      isSelectedForDeletion
                        ? 'border-rose-600 ring-2 ring-rose-500 shadow-lg bg-rose-50/30'
                        : isSelectedByRole
                        ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                        : isActive 
                        ? 'border-slate-200 hover:border-yellow-400' 
                        : 'border-rose-200 bg-slate-50/70 opacity-80'
                    } ${(!isAdmin || isBulkDeleteMode) ? 'cursor-pointer' : ''}`}
                  >
                    {/* CHECKBOX PARA BORRAR (MODO ADMIN) */}
                    {isAdmin && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectForDelete(prod.id);
                        }}
                        className="absolute top-2.5 right-2.5 z-20 cursor-pointer p-1 rounded-xl bg-white/90 backdrop-blur-xs shadow-md border border-slate-300 hover:scale-110 transition"
                        title={isSelectedForDeletion ? 'Deseleccionar producto' : 'Seleccionar producto para borrar'}
                      >
                        {isSelectedForDeletion ? (
                          <CheckSquare className="w-5 h-5 text-rose-600 fill-rose-100" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-rose-500" />
                        )}
                      </div>
                    )}

                    {/* FOTO GRANDE DEL PRODUCTO (aspect 4/3) */}
                    <div className="relative w-full h-40 sm:h-52 bg-slate-100 overflow-hidden shrink-0 group flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-2 border-b border-slate-200">
                          <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-1" />
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Sin fotografía</span>
                          {isAdmin && (
                            <span className="text-[9px] text-[#4E2B01] font-bold mt-0.5">Toca para agregar foto</span>
                          )}
                        </div>
                      )}

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
                      <span className="absolute bottom-2.5 right-2.5 bg-[#202020]/90 backdrop-blur-xs text-[#ECB769] font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg shadow-md">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E2B01] block mb-0.5">
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
                        /* Acciones de Administrador: Editar, Desactivar, Borrar individual o Checkbox */
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
                              className="p-1.5 text-slate-600 hover:text-[#4E2B01] hover:bg-[#FFF3BC]/50 rounded-xl transition cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Eliminar Individual */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(prod.id, prod.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Eliminar definitivamente de Supabase y navegador"
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
                                : 'bg-[#4E2B01] text-[#FFF3BC] hover:bg-[#381e01]'
                            }`}
                          >
                            {isSelectedByRole ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#ECB769]" />
                                <span>Modificar ({selectedQty})</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 text-[#ECB769]" />
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
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#4E2B01] p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 safe-bottom">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#4E2B01] text-[#FFF3BC] rounded-2xl shadow-sm">
                <ShoppingCart className="w-5 h-5 text-[#ECB769]" />
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
                className="px-3 sm:px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Ver Detalle
              </button>

              {onGoToPOSWithItems && (
                <button
                  type="button"
                  onClick={handleSendSelectionToPOS}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#4E2B01] hover:bg-[#202020] active:scale-95 text-[#FFF3BC] text-xs sm:text-sm font-black rounded-xl shadow-lg border-2 border-[#ECB769] transition cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#ECB769]" />
                  <span>Comprar en POS</span>
                </button>
              )}

              <a
                href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer"
                title="Compartir por WhatsApp"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
