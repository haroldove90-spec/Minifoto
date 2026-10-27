import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, CartItem, Category, PaymentMethod, Sale, PhotoStudioSpecs } from '../../types';
import { 
  Camera, 
  Church, 
  Maximize2, 
  Film, 
  Sparkles, 
  PartyPopper, 
  Coffee, 
  GraduationCap, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowRight, 
  X, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Home, 
  ShoppingBag, 
  Image as ImageIcon, 
  Layers, 
  Tag, 
  LogOut, 
  FlaskConical, 
  BarChart3, 
  Copy, 
  Check, 
  Search, 
  Share2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Calculator,
  User,
  Sparkle,
  GripVertical,
  Move,
  CheckSquare,
  Square,
  Mail,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getStoredCategories, 
  generateNextSaleFolio, 
  getStoredProductsOrder, 
  saveStoredProductsOrder,
  getStoredPOSCart,
  saveStoredPOSCart,
  getStoredPOSClientName,
  saveStoredPOSClientName,
  getStoredPOSCategory,
  saveStoredPOSCategory
} from '../../services/storage';
import { printTicketElement } from '../../services/printService';

interface CashierPOSViewProps {
  products: Product[];
  sales?: Sale[];
  initialCart?: CartItem[];
  onClearPendingCart?: () => void;
  operatorName: string;
  onCompleteSale: (sale: Sale, options?: { autoPrint?: boolean }) => void;
  onExitToDashboard?: () => void;
  onSwitchRole?: () => void;
  onNavigateToReports?: () => void;
  brandLogo?: string;
}

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({
  products,
  sales = [],
  initialCart,
  onClearPendingCart,
  operatorName,
  onCompleteSale,
  onExitToDashboard,
  onSwitchRole,
  onNavigateToReports,
  brandLogo = 'https://xqggdnoxvskotwlcuwgd.supabase.co/storage/v1/object/public/logo/minifotologo.png',
}) => {
  // Active Category & Search (Everything on the same screen, persisted on refresh)
  const [activeCategory, setActiveCategoryState] = useState<Category>(() => (getStoredPOSCategory() as Category) || 'foto_estudio');
  const setActiveCategory = (cat: Category) => {
    setActiveCategoryState(cat);
    saveStoredPOSCategory(cat);
  };
  const [productSearch, setProductSearch] = useState('');

  // Cart state (Preserved across browser refresh)
  const [cart, setCartState] = useState<CartItem[]>(() => {
    if (initialCart && initialCart.length > 0) return initialCart;
    return getStoredPOSCart();
  });

  const setCart = (action: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCartState((prev) => {
      const nextCart = typeof action === 'function' ? action(prev) : action;
      saveStoredPOSCart(nextCart);
      return nextCart;
    });
  };

  const [clientName, setClientNameState] = useState(() => getStoredPOSClientName());
  const setClientName = (name: string) => {
    setClientNameState(name);
    saveStoredPOSClientName(name);
  };
  const [mobileTab, setMobileTab] = useState<'products' | 'calculator'>('products');

  // Selected item modal for studio photo form (Caritas, Ampliaciones, Cambios de Fondo, etc.)
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeModalType, setActiveModalType] = useState<'estudio' | 'caritas' | 'ampliaciones' | 'cambios_fondo'>('estudio');

  // 01 Studio Standard Form State
  const [extraRetoque, setExtraRetoque] = useState(false);
  const [extraAutoAdherible, setExtraAutoAdherible] = useState(false);
  const [extraAColor, setExtraAColor] = useState(true);
  const [extraBlancoNegro, setExtraBlancoNegro] = useState(false);
  const [extraEnvioEmail, setExtraEnvioEmail] = useState(false);
  const [extraSacoCorbata, setExtraSacoCorbata] = useState(false);
  const [extraBlazerMascada, setExtraBlazerMascada] = useState(false);
  const [extraCambioCamisa, setExtraCambioCamisa] = useState(false);
  const [inputColorVestimenta, setInputColorVestimenta] = useState('');
  const [inputObservacionesEditor, setInputObservacionesEditor] = useState('');

  // 02 Caritas Form State (image_1ad9e5f9.png)
  const [inputChildName, setInputChildName] = useState('');
  const [inputCaritaModel, setInputCaritaModel] = useState('');
  const [checkPromo8Plus8x10, setCheckPromo8Plus8x10] = useState(false);
  const [checkOrderRefTicket, setCheckOrderRefTicket] = useState(true);
  const [checkLinkPhotos, setCheckLinkPhotos] = useState(true);
  const [checkSendToLab, setCheckSendToLab] = useState(false);

  // 03 Ampliaciones Form State (image_63151215.png)
  const [selectedAmpliacionFormat, setSelectedAmpliacionFormat] = useState('8 x 10');
  const [inputPhotoCount, setInputPhotoCount] = useState(1);

  // 04 Cambios de Fondo Form State (image_8f803678.png)
  const [checkCambioFondo, setCheckCambioFondo] = useState(true);
  const [checkCambioVestimenta, setCheckCambioVestimenta] = useState(false);
  const [checkTextoPersonalizado, setCheckTextoPersonalizado] = useState(false);
  const [selectedCambioFondoSize, setSelectedCambioFondoSize] = useState('8 x 10');
  const [inputCustomText, setInputCustomText] = useState('');
  const [inputEditionNotes, setInputEditionNotes] = useState('');

  // Client Data Fields
  const [inputClientFullName, setInputClientFullName] = useState('');
  const [inputClientPhone, setInputClientPhone] = useState('');
  const [inputClientEmail, setInputClientEmail] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  // Drag and Drop & Touch Reordering of Products
  const [customProductOrder, setCustomProductOrder] = useState<string[]>(() => getStoredProductsOrder());
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const touchStartProductRef = useRef<string | null>(null);

  // Live Calculator & Payment State (Permanently visible on right)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [calcInput, setCalcInput] = useState<string>(''); // Amount entered in calculator
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Electronic terminal simulation
  const [terminalSimStatus, setTerminalSimStatus] = useState<'idle' | 'processing' | 'approved'>('idle');

  // Modals for Test Purchases and Shift Report (Corte de Caja)
  const [showTestModal, setShowTestModal] = useState(false);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [corteCopied, setCorteCopied] = useState(false);
  const [corteSearch, setCorteSearch] = useState('');

  // Auto-populate cart if items were forwarded from Catalog
  useEffect(() => {
    if (initialCart && initialCart.length > 0) {
      setCart((prev) => [...prev, ...initialCart]);
      if (onClearPendingCart) {
        onClearPendingCart();
      }
    }
  }, [initialCart, onClearPendingCart]);

  // Filter only active products for POS operations
  const activeProducts = products.filter((p) => p.isActive !== false);

  // Apply custom ordering saved by user via drag and drop
  const sortedProducts = useMemo(() => {
    if (!customProductOrder || customProductOrder.length === 0) return activeProducts;
    const orderMap = new Map(customProductOrder.map((id, index) => [id, index]));
    return [...activeProducts].sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      return indexA - indexB;
    });
  }, [activeProducts, customProductOrder]);

  const handleReorderProducts = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const currentList = sortedProducts.map((p) => p.id);
    const fromIdx = currentList.indexOf(sourceId);
    const toIdx = currentList.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...currentList];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    setCustomProductOrder(newOrder);
    saveStoredProductsOrder(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedProductId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProductId !== id) {
      setDragOverProductId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedProductId;
    if (sourceId) {
      handleReorderProducts(sourceId, targetId);
    }
    setDraggedProductId(null);
    setDragOverProductId(null);
  };

  const handleDragEnd = () => {
    setDraggedProductId(null);
    setDragOverProductId(null);
  };

  const handleTouchStartCard = (id: string) => {
    touchStartProductRef.current = id;
  };

  const handleTouchEndCard = (e: React.TouchEvent) => {
    const sourceId = touchStartProductRef.current;
    if (!sourceId) return;

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardElement = element?.closest('[data-product-card-id]') as HTMLElement;
    if (cardElement && cardElement.dataset.productCardId) {
      const targetId = cardElement.dataset.productCardId;
      if (targetId && targetId !== sourceId) {
        handleReorderProducts(sourceId, targetId);
      }
    }
    touchStartProductRef.current = null;
    setDragOverProductId(null);
  };

  // Dynamic categories list from storage
  const storedCategories = getStoredCategories();

  // Known categories meta with Minifoto official palette (#4E2B01, #ECB769, #FFF3BC, #202020, #000000)
  const KNOWN_CATEGORIES_META: Record<string, { icon: React.ReactNode; color: string; border: string }> = {
    foto_estudio: { 
      icon: <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-[#4E2B01]" />, 
      color: 'bg-[#ECB769] hover:bg-[#e0a753] text-[#4E2B01]',
      border: 'border-[#4E2B01]' 
    },
    ampliaciones: { 
      icon: <Maximize2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#4E2B01]" />, 
      color: 'bg-[#FFF3BC] hover:bg-[#f6e59b] text-[#4E2B01]',
      border: 'border-[#ECB769]' 
    },
    minilab: { 
      icon: <Film className="w-6 h-6 sm:w-7 sm:h-7 text-[#FFF3BC]" />, 
      color: 'bg-[#4E2B01] hover:bg-[#3b2001] text-[#FFF3BC]',
      border: 'border-[#ECB769]' 
    },
    iglesias: { 
      icon: <Church className="w-6 h-6 sm:w-7 sm:h-7 text-[#ECB769]" />, 
      color: 'bg-[#202020] hover:bg-[#000000] text-[#ECB769]',
      border: 'border-[#4E2B01]' 
    },
    fotoacabado: { 
      icon: <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-[#000000]" />, 
      color: 'bg-[#ECB769] hover:bg-[#e0a753] text-[#000000]',
      border: 'border-[#202020]' 
    },
    salon_seis_party: { 
      icon: <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-[#202020]" />, 
      color: 'bg-[#FFF3BC] hover:bg-[#f6e59b] text-[#202020]',
      border: 'border-[#4E2B01]' 
    },
    fuente_sodas: { 
      icon: <Coffee className="w-6 h-6 sm:w-7 sm:h-7 text-[#ECB769]" />, 
      color: 'bg-[#4E2B01] hover:bg-[#3b2001] text-[#ECB769]',
      border: 'border-[#FFF3BC]' 
    },
    graduaciones: { 
      icon: <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-[#FFF3BC]" />, 
      color: 'bg-[#202020] hover:bg-[#000000] text-[#FFF3BC]',
      border: 'border-[#ECB769]' 
    },
  };

  const categoriesConfig = storedCategories.map((c) => {
    const meta = KNOWN_CATEGORIES_META[c.id] || {
      icon: <Tag className="w-6 h-6 sm:w-7 sm:h-7 text-[#4E2B01]" />,
      color: 'bg-[#FFF3BC] hover:bg-[#f6e59b] text-[#4E2B01]',
      border: 'border-[#ECB769]',
    };
    return {
      id: c.id,
      label: c.label.toUpperCase(),
      icon: meta.icon,
      color: meta.color,
      border: meta.border,
    };
  });

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Tendered cash calculation (Optimized for elderly cashiers)
  const cashGiven = calcInput !== '' ? parseFloat(calcInput) || 0 : total;
  const changeDue = paymentMethod === 'efectivo' && cashGiven >= total ? cashGiven - total : 0;
  const isCashInsufficient = paymentMethod === 'efectivo' && cart.length > 0 && calcInput !== '' && cashGiven < total;

  // Add product to cart
  const addProductToCart = (product: Product, extras?: { retoque?: boolean; autoAdherible?: boolean }, qty = 1) => {
    const retoqueP = extras?.retoque ? (product.defaultRetoquePrice || 30) : 0;
    const autoAdhP = extras?.autoAdherible ? (product.defaultAutoAdheriblePrice || 20) : 0;
    const unitPrice = product.price + retoqueP + autoAdhP;

    const existingIdx = cart.findIndex(
      (it) => it.productId === product.id &&
              it.options.retoque === !!extras?.retoque &&
              it.options.autoAdherible === !!extras?.autoAdherible
    );

    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
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
      setCart([...cart, newItem]);
    }
    setCheckoutError(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    setCart(updated);
    setCheckoutError(null);
  };

  const removeItem = (cartItemId: string) => {
    setCart(cart.filter((item) => item.id !== cartItemId));
    setCheckoutError(null);
  };

  const clearAllCart = () => {
    setCart([]);
    saveStoredPOSCart([]);
    setClientName('');
    saveStoredPOSClientName('');
    setCalcInput('');
    setCheckoutError(null);
  };

  // Studio Formats table for Ampliaciones and Cambios de Fondo (exact from images 63151215.png and 8f803678.png)
  const STUDIO_FORMATS = [
    { label: '8 x 10', price: 85 },
    { label: '8 x 12', price: 110 },
    { label: '11 x 14', price: 180 },
    { label: '11 x 16', price: 210 },
    { label: '12 x 18', price: 260 },
    { label: '16 x 20', price: 390 },
    { label: '16 x 24', price: 480 },
  ];

  // Detect studio photo products requested by client: Caritas, Ampliaciones, Cambios de Fondo, Titulo, diploma, pasaporte, etc.
  const getProductStudioFormType = (product: Product): 'estudio' | 'caritas' | 'ampliaciones' | 'cambios_fondo' | null => {
    const name = (product.name || '').toLowerCase();
    const id = (product.id || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();

    // 1. Caritas (02 CARITAS - image_1ad9e5f9.png / image_484f212e.png)
    if (name.includes('carita') || id.startsWith('car-')) {
      return 'caritas';
    }

    // 2. Cambios de Fondo (04 CAMBIOS DE FONDO - image_8f803678.png)
    if (name.includes('cambio de fondo') || name.includes('cambios de fondo') || id.startsWith('cf-')) {
      return 'cambios_fondo';
    }

    // 3. Ampliaciones (03 AMPLIACIONES - image_63151215.png)
    if (cat === 'ampliaciones' || name.includes('ampliaci') || id.startsWith('amp-')) {
      return 'ampliaciones';
    }

    // 4. Estudio standard (Título, diploma, pasaporte, infantil, cartilla, óvalo, filiación, visa, etc.)
    if (
      cat === 'foto_estudio' ||
      Boolean(product.hasExtras) ||
      name.includes('titulo') ||
      name.includes('título') ||
      name.includes('diploma') ||
      name.includes('pasaporte') ||
      name.includes('infantil') ||
      name.includes('cartilla') ||
      name.includes('ovalo') ||
      name.includes('óvalo') ||
      name.includes('ovalada') ||
      name.includes('filiacion') ||
      name.includes('filiación') ||
      name.includes('visa')
    ) {
      return 'estudio';
    }

    return null;
  };

  const isStudioPhotoProduct = (product: Product) => getProductStudioFormType(product) !== null;

  // Product card click handler - opens the exact floating modal for each product
  const handleProductCardClick = (product: Product) => {
    const formType = getProductStudioFormType(product);
    if (formType) {
      setActiveModalProduct(product);
      setActiveModalType(formType);

      // Preload current client name if typed
      setInputClientFullName(clientName || '');
      setInputClientPhone('');
      setInputClientEmail('');
      setModalQuantity(1);

      if (formType === 'caritas') {
        setInputChildName('');
        setInputCaritaModel('16x20');
        setCheckPromo8Plus8x10(false);
        setCheckOrderRefTicket(true);
        setCheckLinkPhotos(true);
        setCheckSendToLab(false);
        setExtraRetoque(false);
        setExtraAutoAdherible(false);
      } else if (formType === 'ampliaciones') {
        const name = product.name || '';
        const matchedFmt = STUDIO_FORMATS.find(f => name.includes(f.label) || name.includes(f.label.replace(' x ', 'x')));
        setSelectedAmpliacionFormat(matchedFmt ? matchedFmt.label : '8 x 10');
        setInputPhotoCount(1);
      } else if (formType === 'cambios_fondo') {
        setCheckCambioFondo(true);
        setCheckCambioVestimenta(false);
        setCheckTextoPersonalizado(false);
        setSelectedCambioFondoSize('8 x 10');
        setInputCustomText('');
        setInputEditionNotes('');
      } else {
        setExtraRetoque(false);
        setExtraAutoAdherible(false);
        setExtraAColor(true);
        setExtraBlancoNegro(false);
        setExtraEnvioEmail(false);
        setExtraSacoCorbata(false);
        setExtraBlazerMascada(false);
        setExtraCambioCamisa(false);
        setInputColorVestimenta('');
        setInputObservacionesEditor('');
      }
    } else {
      addProductToCart(product);
    }
  };

  // Helper: compute effective price, name, specs, and totals for the active modal
  const getModalEffectiveItem = () => {
    if (!activeModalProduct) {
      return { unitPrice: 0, itemName: '', total: 0, photoSpecs: {} as PhotoStudioSpecs, qty: 1 };
    }

    let unitPrice = activeModalProduct.price;
    let itemName = activeModalProduct.name;
    const qty = activeModalType === 'ampliaciones' ? (inputPhotoCount || 1) : (modalQuantity || 1);

    if (activeModalType === 'caritas') {
      const retoqueP = extraRetoque ? (activeModalProduct.defaultRetoquePrice || 30) : 0;
      const autoAdhP = extraAutoAdherible ? (activeModalProduct.defaultAutoAdheriblePrice || 20) : 0;
      unitPrice = (activeModalProduct.price || 100) + retoqueP + autoAdhP;
      itemName = activeModalProduct.name.toLowerCase().includes('carita') 
        ? activeModalProduct.name 
        : `Caritas - ${activeModalProduct.name}`;
    } else if (activeModalType === 'ampliaciones') {
      const fmt = STUDIO_FORMATS.find((f) => f.label === selectedAmpliacionFormat);
      unitPrice = fmt ? fmt.price : (activeModalProduct.price || 85);
      itemName = `Ampliación ${selectedAmpliacionFormat}`;
    } else if (activeModalType === 'cambios_fondo') {
      const fmt = STUDIO_FORMATS.find((f) => f.label === selectedCambioFondoSize);
      unitPrice = fmt ? fmt.price : (activeModalProduct.price || 120);
      itemName = `Cambio de Fondo (${selectedCambioFondoSize})`;
    } else {
      const retoqueP = extraRetoque ? (activeModalProduct.defaultRetoquePrice || 30) : 0;
      const autoAdhP = extraAutoAdherible ? (activeModalProduct.defaultAutoAdheriblePrice || 20) : 0;
      unitPrice = activeModalProduct.price + retoqueP + autoAdhP;
    }

    const photoSpecs: PhotoStudioSpecs = {
      formType: activeModalType,
      clientFullName: inputClientFullName.trim() || undefined,
      clientPhone: inputClientPhone.trim() || undefined,
      clientEmail: inputClientEmail.trim() || undefined,

      ...(activeModalType === 'caritas' ? {
        childName: inputChildName.trim() || undefined,
        caritaModel: inputCaritaModel.trim() || undefined,
        promo8Plus8x10: checkPromo8Plus8x10,
        orderReferenceTicket: checkOrderRefTicket,
        linkPhotos: checkLinkPhotos,
        sendToLab: checkSendToLab,
        retoque: extraRetoque,
        autoAdherible: extraAutoAdherible,
      } : {}),

      ...(activeModalType === 'ampliaciones' ? {
        ampliacionFormat: selectedAmpliacionFormat,
        photoCount: qty,
      } : {}),

      ...(activeModalType === 'cambios_fondo' ? {
        cambioFondo: checkCambioFondo,
        cambioVestimenta: checkCambioVestimenta,
        agregarTextoPersonalizado: checkTextoPersonalizado,
        cambioFondoSize: selectedCambioFondoSize,
        customText: inputCustomText.trim() || undefined,
        editionNotes: inputEditionNotes.trim() || undefined,
      } : {}),

      ...(activeModalType === 'estudio' ? {
        retoque: extraRetoque,
        autoAdherible: extraAutoAdherible,
        aColor: extraAColor,
        blancoNegro: extraBlancoNegro,
        envioEmail: extraEnvioEmail,
        sacoCorbata: extraSacoCorbata,
        blazerMascada: extraBlazerMascada,
        cambioCamisa: extraCambioCamisa,
        colorVestimenta: inputColorVestimenta.trim() || undefined,
        observacionesEditor: inputObservacionesEditor.trim() || undefined,
      } : {}),
    };

    return {
      unitPrice,
      itemName,
      qty,
      total: unitPrice * qty,
      photoSpecs,
    };
  };

  // Primary Action in Modal: GENERAR TICKET (Immediate direct checkout & ticket emission with barcode)
  const handleGenerateTicketDirect = () => {
    if (!activeModalProduct) return;

    const { unitPrice, itemName, qty, total: itemTotal, photoSpecs } = getModalEffectiveItem();

    const cartItem: CartItem = {
      id: `${activeModalProduct.id}-${Date.now()}`,
      productId: activeModalProduct.id,
      name: itemName,
      category: activeModalProduct.category,
      unitPrice,
      quantity: qty,
      options: {
        retoque: extraRetoque,
        retoquePrice: extraRetoque ? (activeModalProduct.defaultRetoquePrice || 30) : 0,
        autoAdherible: extraAutoAdherible,
        autoAdheriblePrice: extraAutoAdherible ? (activeModalProduct.defaultAutoAdheriblePrice || 20) : 0,
        notes: (inputObservacionesEditor || inputEditionNotes).trim() || undefined,
        photoSpecs,
      },
      totalPrice: itemTotal,
    };

    // Custom folio generated automatically
    const folio = generateNextSaleFolio();
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const directSale: Sale = {
      id: `sale-${Date.now()}`,
      folio,
      date: dateStr,
      role: 'cashier',
      operatorName: operatorName || 'Cajero de Mostrador',
      clientName: inputClientFullName.trim() || clientName.trim() || 'Cliente Mostrador',
      clientPhone: inputClientPhone.trim() || undefined,
      clientEmail: inputClientEmail.trim() || undefined,
      items: [cartItem],
      subtotal: itemTotal,
      discount: 0,
      total: itemTotal,
      paymentMethod: 'efectivo',
      amountPaid: itemTotal,
      change: 0,
      status: 'completado',
      notes: `Ticket emitido desde POS: ${itemName}`,
      photoSpecs,
    };

    onCompleteSale(directSale, { autoPrint: autoPrintTicket });
    try {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    } catch {}
    setActiveModalProduct(null);
  };

  // Secondary Action in Modal: Agregar al ticket para seguir seleccionando
  const handleAddStudioProductToCart = () => {
    if (!activeModalProduct) return;

    const { unitPrice, itemName, qty, total: itemTotal, photoSpecs } = getModalEffectiveItem();

    const newItem: CartItem = {
      id: `${activeModalProduct.id}-${Date.now()}`,
      productId: activeModalProduct.id,
      name: itemName,
      category: activeModalProduct.category,
      unitPrice,
      quantity: qty,
      options: {
        retoque: extraRetoque,
        retoquePrice: extraRetoque ? (activeModalProduct.defaultRetoquePrice || 30) : 0,
        autoAdherible: extraAutoAdherible,
        autoAdheriblePrice: extraAutoAdherible ? (activeModalProduct.defaultAutoAdheriblePrice || 20) : 0,
        notes: (inputObservacionesEditor || inputEditionNotes).trim() || undefined,
        photoSpecs,
      },
      totalPrice: itemTotal,
    };

    setCart([...cart, newItem]);
    if (inputClientFullName.trim() && !clientName) {
      setClientName(inputClientFullName.trim());
    }
    setActiveModalProduct(null);
  };

  // Fast Denomination Buttons (Elderly friendly with huge touch targets)
  const handleSetDenomination = (amount: number) => {
    setCalcInput(amount.toString());
    setCheckoutError(null);
  };

  // Exact Amount Button
  const handleSetExactAmount = () => {
    setCalcInput(total.toString());
    setCheckoutError(null);
  };

  // Keypad clicks in calculator
  const handleCalcKeyPress = (key: string) => {
    setCheckoutError(null);
    if (key === 'C') {
      setCalcInput('');
      return;
    }
    if (key === '.') {
      if (!calcInput.includes('.')) {
        setCalcInput((prev) => (prev === '' ? '0.' : prev + '.'));
      }
      return;
    }
    setCalcInput((prev) => {
      if (prev === '0') return key;
      return prev + key;
    });
  };

  // Execute sale & emit ticket
  const handleConfirmCheckoutSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'efectivo' && cashGiven < total) {
      setCheckoutError(`El monto recibido ($${cashGiven.toFixed(2)}) es menor que el total ($${total.toFixed(2)}).`);
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);

    const folio = generateNextSaleFolio();
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      folio,
      date: dateStr,
      role: 'cashier',
      operatorName: operatorName || 'Cajero de Mostrador',
      clientName: clientName.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: 0,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'efectivo' ? cashGiven : total,
      change: changeDue,
      status: 'completado',
      notes: `Cobrado con ${paymentMethod.toUpperCase()}`,
    };

    try {
      confetti({ particleCount: 75, spread: 80 });
    } catch {}

    setTimeout(() => {
      onCompleteSale(newSale, { autoPrint: autoPrintTicket });
      clearAllCart();
      setIsProcessing(false);
    }, 400);
  };

  // Simulate Terminal Clip
  const handleSimulateClip = () => {
    setTerminalSimStatus('processing');
    setTimeout(() => {
      setTerminalSimStatus('approved');
    }, 1200);
  };

  // Presets for Test Purchases
  const TEST_PRESETS = [
    {
      id: 'test-1',
      title: '📸 Prueba 1: Foto Estudio Infantil + Retoque',
      description: 'Foto Infantil (x6 pzas) $110 + Retoque Digital profesional $30',
      total: 140,
      badge: 'Estudio Fotográfico',
      items: [
        {
          id: `item-test-estudio-${Date.now()}`,
          productId: 'fe-1',
          name: 'Foto Infantil (x6 pzas)',
          category: 'foto_estudio',
          unitPrice: 140,
          quantity: 1,
          options: {
            retoque: true,
            retoquePrice: 30,
            autoAdherible: false,
            autoAdheriblePrice: 0,
          },
          totalPrice: 140,
        },
      ],
    },
    {
      id: 'test-2',
      title: '🎓 Prueba 2: Paquete Graduación Escolar',
      description: 'Paquete Graduación Básico con Diploma y Fotografías Escolares',
      total: 450,
      badge: 'Paquete Escolar',
      items: [
        {
          id: `item-test-grad-${Date.now()}`,
          productId: 'grad-1',
          name: 'Paquete Graduación Básico 2026',
          category: 'graduaciones',
          unitPrice: 450,
          quantity: 1,
          options: {},
          totalPrice: 450,
        },
      ],
    },
    {
      id: 'test-3',
      title: '🖼️ Prueba 3: Ampliación 11x14 + Fotoacabado',
      description: 'Ampliación profesional 11x14" ($220) con acabado texturizado ($60)',
      total: 280,
      badge: 'Marcos y Cuadros',
      items: [
        {
          id: `item-test-amp-${Date.now()}`,
          productId: 'amp-2',
          name: 'Ampliación 11x14"',
          category: 'ampliaciones',
          unitPrice: 220,
          quantity: 1,
          options: {},
          totalPrice: 220,
        },
        {
          id: `item-test-acab-${Date.now()}`,
          productId: 'fa-1',
          name: 'Fotoacabado Texturizado / Poliéster',
          category: 'fotoacabado',
          unitPrice: 60,
          quantity: 1,
          options: {},
          totalPrice: 60,
        },
      ],
    },
    {
      id: 'test-4',
      title: '🎞️ Prueba 4: Revelado Minilab x10 + Foto Pasaporte',
      description: '10 impresiones Minilab 4x6" ($100) + 1 juego de Foto Pasaporte ($120)',
      total: 220,
      badge: 'Express Mostrador',
      items: [
        {
          id: `item-test-mini-${Date.now()}`,
          productId: 'ml-1',
          name: 'Impresión Minilab 4x6" (x10)',
          category: 'minilab',
          unitPrice: 100,
          quantity: 1,
          options: {},
          totalPrice: 100,
        },
        {
          id: `item-test-pasa-${Date.now()}`,
          productId: 'fe-3',
          name: 'Foto Pasaporte / Visa Fondo Blanco',
          category: 'foto_estudio',
          unitPrice: 120,
          quantity: 1,
          options: {},
          totalPrice: 120,
        },
      ],
    },
  ];

  const handleLoadTestPresetToCart = (preset: typeof TEST_PRESETS[0]) => {
    setCart([...preset.items]);
    setShowTestModal(false);
  };

  const handleDirectQuickTestSale = (preset: typeof TEST_PRESETS[0], method: PaymentMethod = 'efectivo') => {
    const folio = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    const amountPaid = method === 'efectivo' ? (preset.total <= 200 ? 200 : preset.total <= 500 ? 500 : 1000) : preset.total;
    const change = method === 'efectivo' ? amountPaid - preset.total : 0;

    const testSale: Sale = {
      id: `sale-test-${Date.now()}`,
      folio,
      date: dateStr,
      role: 'cashier',
      operatorName: operatorName || 'Cajero de Mostrador',
      clientName: 'Cliente Compra de Prueba',
      items: [...preset.items],
      subtotal: preset.total,
      discount: 0,
      total: preset.total,
      paymentMethod: method,
      amountPaid,
      change,
      status: 'completado',
      notes: `Venta de Prueba Realizada con Éxito (${method.toUpperCase()})`,
    };

    try {
      confetti({ particleCount: 80, spread: 90 });
    } catch {}

    setShowTestModal(false);
    clearAllCart();
    onCompleteSale(testSale, { autoPrint: true });
  };

  const getCorteReportPlainText = () => {
    const list = sales || [];
    const totalRev = list.reduce((sum, s) => sum + s.total, 0);
    const cashTotal = list.filter((s) => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
    const clipTotal = list.filter((s) => s.paymentMethod === 'clip').reduce((sum, s) => sum + s.total, 0);
    const mpTotal = list.filter((s) => s.paymentMethod === 'mercadopago').reduce((sum, s) => sum + s.total, 0);
    const transferTotal = list.filter((s) => s.paymentMethod === 'transferencia').reduce((sum, s) => sum + s.total, 0);

    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    let text = `=========================================\n`;
    text += `📸 MINIFOTO - CORTE DE CAJA / POS OFICINA\n`;
    text += `=========================================\n`;
    text += `Fecha y Hora: ${dateStr}\n`;
    text += `Operador: ${operatorName}\n`;
    text += `Terminal: POS Mostrador / Oficina\n`;
    text += `Estatus del Módulo: 🟢 ACTIVO AL 100%\n`;
    text += `-----------------------------------------\n`;
    text += `RESUMEN FINANCIERO:\n`;
    text += `• Total Ingresos: $${totalRev.toFixed(2)} MXN\n`;
    text += `• Tickets de Venta Emitidos: ${list.length}\n`;
    text += `• Efectivo en Caja: $${cashTotal.toFixed(2)} MXN\n`;
    text += `• Tarjeta / Clip: $${clipTotal.toFixed(2)} MXN\n`;
    text += `• SPEI / Transferencia: $${transferTotal.toFixed(2)} MXN\n`;
    text += `• Mercado Pago: $${mpTotal.toFixed(2)} MXN\n`;
    text += `-----------------------------------------\n`;
    text += `ÚLTIMOS TICKETS REGISTRADOS:\n`;
    if (list.length === 0) {
      text += `(Sin ventas registradas en esta sesión aún)\n`;
    } else {
      list.slice(0, 10).forEach((s, idx) => {
        text += `${idx + 1}. #${s.folio} | $${s.total.toFixed(2)} | ${s.paymentMethod.toUpperCase()} | ${s.clientName || 'Cliente General'}\n`;
      });
    }
    text += `=========================================\n`;
    text += `Reporte de ventas para el cliente - Sistema Minifoto`;
    return text;
  };

  const handleCopyCorteReport = async () => {
    try {
      await navigator.clipboard.writeText(getCorteReportPlainText());
      setCorteCopied(true);
      setTimeout(() => setCorteCopied(false), 2500);
    } catch {}
  };

  const handlePrintCorteThermal = () => {
    printTicketElement('corte-thermal-printable');
  };

  // Products to display: sorted by custom drag & drop order, filtered by active category or general search
  const displayProducts = sortedProducts.filter((p) => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return p.category === activeCategory;
  });

  const activeCategoryMeta = categoriesConfig.find((c) => c.id === activeCategory);

  return (
    <div className="fixed inset-0 z-40 bg-[#FCF9F2] text-[#202020] flex flex-col font-sans select-none overflow-hidden">
      
      {/* =========================================================================
          TOP BAR: BRAND LOGO, SENIOR STATUS, SHORTCUTS, SHIFT TOTALS
          ========================================================================= */}
      <div className="bg-[#FCF9F2] text-[#202020] px-3 sm:px-6 py-2 flex items-center justify-between border-b-2 border-[#ECB769]/50 shadow-xs shrink-0">
        
        {/* Left: Big Return Button & Full Unencapsulated Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onExitToDashboard && (
            <button
              onClick={onExitToDashboard}
              className="px-3 py-2 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] font-black text-xs sm:text-sm rounded-xl border-2 border-[#ECB769] shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              title="Regresar al menú principal"
            >
              <Home className="w-4 h-4 text-[#ECB769]" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          {/* Full unencapsulated logo Minifoto */}
          <img 
            src={brandLogo} 
            alt="Minifoto" 
            className="h-8 sm:h-11 w-auto max-w-[130px] sm:max-w-[200px] object-contain shrink-0 hidden xs:block"
          />

          {/* POS Active Indicator for Elderly reassurance */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-300 text-xs font-black">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>POS 100% ACTIVO • CALCULADORA PERMANENTE</span>
          </div>
        </div>

        {/* Center / Right: Operator and Session Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          
          {/* Quick Test Purchase Button */}
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="px-3 py-2 bg-[#FFF3BC] hover:bg-[#ECB769] text-[#4E2B01] border-2 border-[#ECB769] font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
            title="Realizar compras de prueba y emitir tickets"
          >
            <FlaskConical className="w-4 h-4 text-[#4E2B01]" />
            <span>Compras de Prueba</span>
          </button>

          {/* Shift Report / Corte de Caja Button */}
          <button
            type="button"
            onClick={() => setShowCorteModal(true)}
            className="px-3 py-2 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] border-2 border-[#ECB769] font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
            title="Ver corte de caja y reporte de ventas"
          >
            <BarChart3 className="w-4 h-4 text-[#ECB769]" />
            <span>Corte de Caja</span>
            <span className="bg-[#ECB769] text-[#4E2B01] text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {sales?.length || 0}
            </span>
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearAllCart}
              type="button"
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 transition active:scale-95 shadow-xs"
              title="Vaciar ticket"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vaciar</span>
            </button>
          )}

          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              type="button"
              className="p-2 bg-white hover:bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]/50 rounded-xl cursor-pointer transition shadow-2xs"
              title="Cerrar sesión o cambiar de rol"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible only on small phones) */}
      <div className="lg:hidden flex bg-[#FCF9F2] text-[#202020] text-xs font-bold border-b border-[#ECB769]/40">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 text-center flex items-center justify-center gap-2 transition ${
            mobileTab === 'products' ? 'bg-[#4E2B01] text-[#FFF3BC] font-black' : 'text-[#202020] hover:bg-[#FFF3BC]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#ECB769]" />
          <span>1. Productos & Categorías</span>
        </button>
        <button
          onClick={() => setMobileTab('calculator')}
          className={`flex-1 py-3 text-center flex items-center justify-center gap-2 transition ${
            mobileTab === 'calculator' ? 'bg-[#4E2B01] text-[#FFF3BC] font-black' : 'text-[#202020] hover:bg-[#FFF3BC]'
          }`}
        >
          <Calculator className="w-4 h-4 text-[#ECB769]" />
          <span>2. Calculadora & Cobro (${total.toFixed(2)})</span>
        </button>
      </div>

      {/* =========================================================================
          MAIN UNIFIED WORKSPACE: PRODUCTS (LEFT) + PERSISTENT CALCULATOR (RIGHT)
          THE CALCULATOR IS ALWAYS VISIBLE AT ALL TIMES
          ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#FCF9F2]">
        
        {/* =======================================================================
            LEFT COLUMN: SERVICE CATEGORIES & PRODUCTS GRID
            ======================================================================= */}
        <div className={`flex-1 flex-col overflow-hidden p-2 sm:p-4 border-r-2 border-[#ECB769]/40 ${
          mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* 1. Large Touch Category Buttons (Always visible at the top) */}
          <div className="mb-3 shrink-0">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#4E2B01]">
                Selecciona un Servicio:
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Toca cualquier foto abajo para agregarla al ticket
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {categoriesConfig.map((cat) => {
                const isSelected = activeCategory === cat.id && !productSearch.trim();
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setProductSearch('');
                    }}
                    type="button"
                    className={`px-3.5 py-2.5 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 ${
                      isSelected
                        ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#ECB769] shadow-md scale-102 ring-2 ring-[#ECB769]'
                        : `${cat.color} ${cat.border} opacity-85 hover:opacity-100`
                    }`}
                  >
                    <span className="shrink-0">{cat.icon}</span>
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Quick Search & Active Category Title */}
          <div className="mb-3 flex items-center justify-between gap-3 shrink-0 bg-white p-2.5 rounded-2xl border border-[#ECB769]/50 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ECB769]"></div>
              <h2 className="text-sm sm:text-base font-black text-[#4E2B01] uppercase tracking-wide truncate">
                {productSearch.trim() ? `Búsqueda: "${productSearch}"` : (activeCategoryMeta?.label || 'Catálogo')}
              </h2>
              <span className="text-xs text-slate-500 font-bold">
                ({displayProducts.length} disponibles)
              </span>
            </div>

            {/* Fast search input */}
            <div className="relative w-44 sm:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar foto o servicio..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Products Grid with Photos and Prices (Matches official Minifoto photos) */}
          {/* Reordering helper banner */}
          <div className="bg-amber-50/80 border border-[#ECB769]/60 px-3 py-1.5 rounded-xl mb-2 flex items-center justify-between text-[11px] text-[#4E2B01]">
            <span className="flex items-center gap-1.5 font-medium">
              <Move className="w-3.5 h-3.5 text-[#4E2B01]" />
              <strong>Organizar Productos:</strong> Jala cualquier producto con el mouse o con el dedo para ponerlo en el orden que gustes.
            </span>
            {customProductOrder.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCustomProductOrder([]);
                  saveStoredProductsOrder([]);
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer"
                title="Restablecer orden inicial de productos"
              >
                Restablecer orden
              </button>
            )}
          </div>

          {/* 3. Products Grid with Drag and Drop Reordering */}
          <div className="flex-1 overflow-y-auto pr-1">
            {displayProducts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 p-6 bg-white rounded-3xl border border-dashed border-[#ECB769]/60 text-center my-4">
                <ImageIcon className="w-10 h-10 text-[#ECB769] mb-1" />
                <p className="font-bold text-slate-700 text-sm">No se encontraron productos</p>
                <p className="text-xs text-slate-500">Prueba con otra categoría o borra el término de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {displayProducts.map((prod) => {
                  const isBeingDragged = draggedProductId === prod.id;
                  const isDragTarget = dragOverProductId === prod.id && !isBeingDragged;
                  return (
                    <div
                      key={prod.id}
                      data-product-card-id={prod.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, prod.id)}
                      onDragOver={(e) => handleDragOver(e, prod.id)}
                      onDrop={(e) => handleDrop(e, prod.id)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={() => handleTouchStartCard(prod.id)}
                      onTouchEnd={handleTouchEndCard}
                      onClick={() => handleProductCardClick(prod)}
                      className={`relative rounded-2xl bg-white hover:bg-[#FFF3BC]/20 border-2 transition-all flex flex-col overflow-hidden text-left cursor-grab active:cursor-grabbing group select-none shadow-sm hover:shadow-lg active:scale-95 ${
                        isDragTarget
                          ? 'border-[#4E2B01] ring-4 ring-[#ECB769] scale-102 bg-amber-50 z-20'
                          : 'border-[#ECB769] hover:border-[#4E2B01]'
                      } ${isBeingDragged ? 'opacity-40 scale-95 border-dashed border-slate-400' : 'opacity-100'}`}
                      title="Haz clic para seleccionar o jala para mover de posición"
                    >
                      {/* Product Photo */}
                      <div className="relative w-full h-28 sm:h-34 bg-slate-100 overflow-hidden flex items-center justify-center">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#FCF9F2] text-slate-400 p-2">
                            <Camera className="w-8 h-8 text-[#ECB769] mb-1" />
                            <span className="text-[10px] font-bold text-[#4E2B01]">Foto Minifoto</span>
                          </div>
                        )}

                        {/* Drag Handle Icon in corner */}
                        <div
                          className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-60 group-hover:opacity-100 transition shadow-xs z-10"
                          title="Arrastra con el mouse o dedo para mover"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-[#FFF3BC]" />
                        </div>

                        {/* Extras Badge */}
                        {(prod.hasExtras || isStudioPhotoProduct(prod)) && (
                          <span className="absolute top-2 left-2 bg-[#FFF3BC] text-[#4E2B01] font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-[#ECB769]">
                            +Opciones
                          </span>
                        )}

                        {/* Large Legible Price Badge */}
                        <span className="absolute bottom-2 right-2 bg-[#000000]/90 text-[#FFF3BC] font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg shadow-md border border-[#ECB769]/50">
                          ${prod.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Content: Title & Action */}
                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-xs sm:text-sm text-[#202020] leading-tight line-clamp-2">
                            {prod.name}
                          </h3>
                          {prod.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-[#ECB769] uppercase truncate">
                            {isStudioPhotoProduct(prod) ? 'Opciones y Ticket' : '+ Agregar'}
                          </span>
                          <span className="text-sm font-black text-[#4E2B01] font-mono whitespace-nowrap shrink-0">
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* =======================================================================
            RIGHT COLUMN: PERSISTENT TICKET + INTEGRATED TOUCH CALCULATOR
            ALWAYS VISIBLE - NEVER DISAPPEARS SO ELDERLY USERS NEVER GET LOST
            RESPONSIVE & NEVER CLIPS ON TABLETS OR PC
            ======================================================================= */}
        <div className={`w-full lg:w-[410px] xl:w-[460px] bg-white border-t-2 lg:border-t-0 border-[#ECB769] flex flex-col shadow-2xl shrink-0 h-full overflow-y-auto ${
          mobileTab === 'calculator' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* 1. TICKET HEADER & LIVE ITEMS LIST */}
          <div className="p-3 pb-2 shrink-0">
            
            {/* Ticket Title & Clear Button */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#4E2B01]" />
                <span className="font-black text-sm text-[#4E2B01] uppercase">
                  Ticket de Venta
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF3BC] text-[#4E2B01] text-[10px] font-black">
                  {totalItemsCount} arts
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {/* Optional Client Name Input */}
            <div>
              <input
                type="text"
                placeholder="Nombre del cliente (Opcional)..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4E2B01]"
              />
            </div>
          </div>

          {/* Live Cart Items Table */}
          <div className="px-3 divide-y divide-slate-100 max-h-44 sm:max-h-52 overflow-y-auto shrink-0 pr-1">
            {cart.length === 0 ? (
              <div className="py-2.5 px-3 my-1 flex items-center justify-center gap-2 text-slate-500 bg-amber-50/60 rounded-xl border border-dashed border-[#ECB769]/60 text-xs font-bold text-center">
                <ShoppingBag className="w-4 h-4 text-[#ECB769] shrink-0" />
                <span>Ticket vacío • Toca productos a la izquierda</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-black text-[#202020] block leading-tight truncate">{item.name}</span>
                    {(item.options.retoque || item.options.autoAdherible) && (
                      <div className="text-[10px] text-[#4E2B01] font-bold">
                        {item.options.retoque && <span>+Retoque($30) </span>}
                        {item.options.autoAdherible && <span>+Adherible($20)</span>}
                      </div>
                    )}
                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">${item.unitPrice.toFixed(2)} c/u</span>
                  </div>

                  {/* Quantity controls (+ / -) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-[#FFF3BC] hover:bg-[#ECB769] text-[#4E2B01] font-black flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black font-mono w-5 text-center text-sm text-[#4E2B01]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-[#FFF3BC] hover:bg-[#ECB769] text-[#4E2B01] font-black flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[75px] whitespace-nowrap">
                    <span className="font-mono font-black text-sm text-[#4E2B01] block whitespace-nowrap">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer text-[10px] font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 2. DEDICATED PROMINENT TOTAL BANNER (Always 100% visible, never clipped) */}
          <div className="mx-3 my-2 p-3 bg-[#FFF3BC] border-2 border-[#ECB769] rounded-2xl flex items-center justify-between shrink-0 shadow-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-black uppercase text-[#4E2B01]/80 block tracking-wide">
                TOTAL A COBRAR:
              </span>
              <span className="text-xs font-bold text-[#4E2B01] truncate block">
                {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'} en ticket
              </span>
            </div>
            <div className="text-right shrink-0 whitespace-nowrap">
              <span className="text-2xl sm:text-3xl font-black text-[#4E2B01] font-mono leading-none inline-block whitespace-nowrap">
                ${total.toFixed(2)}
              </span>
              <span className="text-xs font-black text-[#4E2B01]/70 ml-1">MXN</span>
            </div>
          </div>

          {/* =====================================================================
              3. INTEGRATED TOUCH CALCULATOR & CHECKOUT CONTROLS
              ALWAYS VISIBLE AT THE BOTTOM OF THE RIGHT COLUMN
              ===================================================================== */}
          <div className="p-3 bg-slate-50 border-t-2 border-[#ECB769]/50 flex flex-col space-y-2 shrink-0">
            
            {/* Payment Method Switcher */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('efectivo');
                  setCheckoutError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'efectivo'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-2 border-[#ECB769] shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-[#ECB769]" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('clip');
                  setCheckoutError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'clip'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-2 border-[#ECB769] shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#ECB769]" />
                <span>Clip / Tarjeta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transferencia');
                  setCheckoutError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                  paymentMethod === 'transferencia'
                    ? 'bg-[#4E2B01] text-[#FFF3BC] border-2 border-[#ECB769] shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowRight className="w-4 h-4 text-[#ECB769]" />
                <span>SPEI / Banco</span>
              </button>
            </div>

            {/* Quick Bill Denominations for Cash (Single-Touch for Elderly) */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                  <span>Billetes Rápidos (1 Toque):</span>
                  <button
                    type="button"
                    onClick={handleSetExactAmount}
                    className="text-[#4E2B01] font-black underline hover:text-[#ECB769] cursor-pointer"
                  >
                    Exacto (${total.toFixed(2)})
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[50, 100, 200, 500, 1000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => handleSetDenomination(denom)}
                      className={`py-1.5 text-xs font-black rounded-xl border cursor-pointer active:scale-95 transition ${
                        calcInput === denom.toString()
                          ? 'bg-[#4E2B01] text-[#FFF3BC] border-[#ECB769]'
                          : 'bg-white hover:bg-[#FFF3BC] text-[#4E2B01] border-[#ECB769]/50 shadow-2xs'
                      }`}
                    >
                      ${denom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cash Given & Change Display (High contrast for clarity) */}
            {paymentMethod === 'efectivo' ? (
              <div className="bg-white p-2 rounded-2xl border-2 border-[#ECB769] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Efectivo Recibido</span>
                  <span className="text-base sm:text-lg font-black font-mono text-[#202020] whitespace-nowrap">
                    ${cashGiven.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cambio a Entregar</span>
                  <span className={`text-lg sm:text-xl font-black font-mono whitespace-nowrap ${
                    changeDue > 0 ? 'text-emerald-600' : 'text-slate-700'
                  }`}>
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              /* Terminal Clip status banner if electronic */
              <div className="bg-white p-2 rounded-2xl border border-[#ECB769] flex items-center justify-between text-xs">
                {terminalSimStatus === 'idle' ? (
                  <>
                    <span className="text-slate-600 font-bold">Simulación de terminal Clip:</span>
                    <button
                      type="button"
                      onClick={handleSimulateClip}
                      className="px-3 py-1 bg-[#4E2B01] text-[#FFF3BC] font-black rounded-lg cursor-pointer hover:bg-[#202020]"
                    >
                      Aprobar Terminal
                    </button>
                  </>
                ) : terminalSimStatus === 'processing' ? (
                  <span className="text-[#ECB769] font-bold animate-pulse">Conectando con banco...</span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Pago aprobado en Clip
                  </span>
                )}
              </div>
            )}

            {/* Error notice if cash given is less than total */}
            {checkoutError && (
              <div className="bg-rose-50 text-rose-700 border border-rose-300 p-2 rounded-xl text-xs font-bold text-center">
                {checkoutError}
              </div>
            )}

            {/* Giant Touch Numeric Keypad for Seniors (Large Buttons) */}
            {paymentMethod === 'efectivo' && (
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcKeyPress(key)}
                    className={`h-9 sm:h-10 rounded-xl font-black text-base sm:text-lg shadow-2xs border-2 cursor-pointer active:scale-95 transition flex items-center justify-center ${
                      key === 'C'
                        ? 'bg-slate-800 text-[#FFF3BC] border-slate-900'
                        : 'bg-white hover:bg-[#FFF3BC] text-[#4E2B01] border-slate-200 hover:border-[#ECB769]'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}

            {/* Checkbox auto-print */}
            <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={autoPrintTicket}
                onChange={(e) => setAutoPrintTicket(e.target.checked)}
                className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
              />
              <span>Imprimir ticket térmico de 80mm automáticamente</span>
            </label>

            {/* GIANT CONTINUAR / COBRAR BUTTON (Cannot be missed by anyone) */}
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing || isCashInsufficient}
              onClick={handleConfirmCheckoutSale}
              className="w-full py-3 sm:py-3.5 bg-[#ECB769] hover:bg-[#fad88b] active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-[#4E2B01] font-black text-base sm:text-lg rounded-2xl shadow-xl border-2 border-[#4E2B01] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-5 h-5 text-[#4E2B01]" />
              <span className="whitespace-nowrap">
                {isProcessing
                  ? 'EMITIENDO TICKET...'
                  : `CONTINUAR / COBRAR (${cart.length > 0 ? `$${total.toFixed(2)}` : '$0.00'})`}
              </span>
            </button>

          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL: PRODUCT EXTRAS (Retoque Digital / Autoadherible)
          ========================================================================= */}
      {/* =========================================================================
          MODAL: FORMULARIO FLOTANTE ESTUDIO FOTOGRÁFICO Y GENERACIÓN DE TICKET
          (Retoque, Autoadherible, Color/BN, Vestimenta, Datos Cliente, etc.)
          ========================================================================= */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-3 border-[#4E2B01] text-[#202020] flex flex-col max-h-[92vh] overflow-hidden my-auto">
            
            {/* Header: Product Photo, Title, Base Price */}
            <div className="bg-[#4E2B01] text-[#FFF3BC] p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#ECB769] shrink-0">
              <div className="flex items-center gap-3">
                {activeModalProduct.imageUrl ? (
                  <img
                    src={activeModalProduct.imageUrl}
                    alt={activeModalProduct.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#ECB769] shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF3BC] border-2 border-[#ECB769] flex items-center justify-center shrink-0">
                    <Camera className="w-7 h-7 text-[#4E2B01]" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-[#FFF3BC] text-[#4E2B01] tracking-wide">
                      {activeModalType === 'caritas' && '02 CARITAS'}
                      {activeModalType === 'ampliaciones' && '03 AMPLIACIONES'}
                      {activeModalType === 'cambios_fondo' && '04 CAMBIOS DE FONDO'}
                      {activeModalType === 'estudio' && '01 FOTO ESTUDIO'}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#FFF3BC]/90">
                      Precio: ${getModalEffectiveItem().unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#FFF3BC] leading-tight mt-0.5">
                    {getModalEffectiveItem().itemName}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FCF9F2] flex-1">
              
              {/* ===============================================================
                  FORM TYPE 02: CARITAS (EXACTO DE LA IMAGEN 1ad9e5f9.png)
                  =============================================================== */}
              {activeModalType === 'caritas' && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#ECB769] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                    <h4 className="text-base font-black text-[#4E2B01] tracking-tight">
                      02 CARITAS
                    </h4>
                    <span className="text-xs font-bold text-slate-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Tamaño 16x20 • $100.00
                    </span>
                  </div>

                  {/* Nombre del niño */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del niño
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe el nombre del niño..."
                      value={inputChildName}
                      onChange={(e) => setInputChildName(e.target.value)}
                      className="w-full text-sm font-bold px-3 py-2 bg-slate-50 border-b-2 border-slate-400 focus:border-[#4E2B01] focus:bg-white focus:outline-none transition rounded-t-lg"
                    />
                  </div>

                  {/* Modelo de Carita */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Modelo de Carita
                      </label>
                      <div className="flex items-center gap-1">
                        {['16x20', 'Circo', 'Fantasía', 'Pastel'].map((pill) => (
                          <button
                            key={pill}
                            type="button"
                            onClick={() => setInputCaritaModel(pill)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                              inputCaritaModel === pill
                                ? 'bg-[#4E2B01] text-[#FFF3BC]'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                            }`}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. Modelo 1, Circo, Fantasía, 16x20..."
                      value={inputCaritaModel}
                      onChange={(e) => setInputCaritaModel(e.target.value)}
                      className="w-full text-sm font-bold px-3 py-2 bg-slate-50 border-b-2 border-slate-400 focus:border-[#4E2B01] focus:bg-white focus:outline-none transition rounded-t-lg"
                    />
                  </div>

                  {/* 2-Column Checkboxes from image_1ad9e5f9.png */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                      <input
                        type="checkbox"
                        checked={checkPromo8Plus8x10}
                        onChange={(e) => setCheckPromo8Plus8x10(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Promoción 8 + 8 × 10</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                      <input
                        type="checkbox"
                        checked={checkOrderRefTicket}
                        onChange={(e) => setCheckOrderRefTicket(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Orden con referencia y ticket</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                      <input
                        type="checkbox"
                        checked={checkLinkPhotos}
                        onChange={(e) => setCheckLinkPhotos(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Vincular fotografías</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                      <input
                        type="checkbox"
                        checked={checkSendToLab}
                        onChange={(e) => setCheckSendToLab(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Enviar al laboratorio</span>
                    </label>
                  </div>

                  {/* Extra Retoque & Autoadherible options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraRetoque}
                        onChange={(e) => setExtraRetoque(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Retoque profesional</span>
                      <span className="text-[10px] font-mono text-[#4E2B01] ml-auto font-bold">+$30</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraAutoAdherible}
                        onChange={(e) => setExtraAutoAdherible(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Autoadherible</span>
                      <span className="text-[10px] font-mono text-[#4E2B01] ml-auto font-bold">+$20</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  FORM TYPE 03: AMPLIACIONES (EXACTO DE LA IMAGEN 63151215.png)
                  =============================================================== */}
              {activeModalType === 'ampliaciones' && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#ECB769] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                    <h4 className="text-base font-black text-[#4E2B01] tracking-tight">
                      03 AMPLIACIONES
                    </h4>
                    <span className="text-xs font-bold text-slate-600">
                      Seleccionar formato (del menor al mayor)
                    </span>
                  </div>

                  {/* Formats Grid matching image_63151215.png */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {STUDIO_FORMATS.map((fmt) => {
                      const isSelected = selectedAmpliacionFormat === fmt.label;
                      return (
                        <label
                          key={fmt.label}
                          onClick={() => setSelectedAmpliacionFormat(fmt.label)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition select-none border-2 ${
                            isSelected
                              ? 'bg-amber-50 border-[#4E2B01] text-[#4E2B01] shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:border-[#ECB769] text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="ampliacionFormatRadio"
                              checked={isSelected}
                              onChange={() => setSelectedAmpliacionFormat(fmt.label)}
                              className="w-4 h-4 text-[#4E2B01] accent-[#4E2B01]"
                            />
                            <span className="font-black text-sm">{fmt.label}</span>
                          </div>
                          <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                            ${fmt.price.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Cantidad de fotografías */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700">
                      Cantidad de fotografías
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInputPhotoCount(Math.max(1, inputPhotoCount - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={inputPhotoCount}
                        onChange={(e) => setInputPhotoCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center font-mono font-black text-sm text-[#4E2B01] bg-slate-50 border border-slate-300 rounded-lg py-1"
                      />
                      <button
                        type="button"
                        onClick={() => setInputPhotoCount(inputPhotoCount + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  FORM TYPE 04: CAMBIOS DE FONDO (EXACTO DE LA IMAGEN 8f803678.png)
                  =============================================================== */}
              {activeModalType === 'cambios_fondo' && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#ECB769] shadow-xs space-y-4">
                  <div className="border-b pb-2 border-slate-200">
                    <h4 className="text-base font-black text-[#4E2B01] tracking-tight">
                      04 CAMBIOS DE FONDO
                    </h4>
                  </div>

                  {/* Servicios que solicita el cliente */}
                  <div>
                    <span className="block text-xs font-black uppercase text-[#4E2B01] mb-2 tracking-wide">
                      Servicios que solicita el cliente
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                        <input
                          type="checkbox"
                          checked={checkCambioFondo}
                          onChange={(e) => setCheckCambioFondo(e.target.checked)}
                          className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                        />
                        <span className="font-bold text-slate-800">Cambio de fondo</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50">
                        <input
                          type="checkbox"
                          checked={checkCambioVestimenta}
                          onChange={(e) => setCheckCambioVestimenta(e.target.checked)}
                          className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                        />
                        <span className="font-bold text-slate-800">Cambio de vestimenta</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer transition border border-slate-200 hover:border-[#ECB769] select-none bg-slate-50/50 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={checkTextoPersonalizado}
                          onChange={(e) => setCheckTextoPersonalizado(e.target.checked)}
                          className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                        />
                        <span className="font-bold text-slate-800">Agregar texto personalizado</span>
                      </label>
                    </div>
                  </div>

                  {/* Seleccionar tamaño */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-xs font-black uppercase text-[#4E2B01] mb-2 tracking-wide">
                      Seleccionar tamaño
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {STUDIO_FORMATS.map((fmt) => {
                        const isSelected = selectedCambioFondoSize === fmt.label;
                        return (
                          <label
                            key={fmt.label}
                            onClick={() => setSelectedCambioFondoSize(fmt.label)}
                            className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition select-none border ${
                              isSelected
                                ? 'bg-amber-100 border-[#4E2B01] text-[#4E2B01] font-black'
                                : 'bg-slate-50 border-slate-200 hover:border-[#ECB769] text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="cambioFondoSizeRadio"
                              checked={isSelected}
                              onChange={() => setSelectedCambioFondoSize(fmt.label)}
                              className="w-3.5 h-3.5 text-[#4E2B01] accent-[#4E2B01]"
                            />
                            <span>{fmt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Texto personalizado */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Texto personalizado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Mi Primer Año, Generación 2026, Recuerdo de Bautizo..."
                      value={inputCustomText}
                      onChange={(e) => setInputCustomText(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border-b-2 border-slate-400 focus:border-[#4E2B01] focus:bg-white focus:outline-none transition rounded-t-lg"
                    />
                  </div>

                  {/* Observaciones de edición / fondo / vestimenta */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observaciones de edición / fondo / vestimenta
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Fondo jardín desenfocado, saco azul marino, quitar sombras..."
                      value={inputEditionNotes}
                      onChange={(e) => setInputEditionNotes(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border-b-2 border-slate-400 focus:border-[#4E2B01] focus:bg-white focus:outline-none transition rounded-t-lg"
                    />
                  </div>
                </div>
              )}

              {/* ===============================================================
                  FORM TYPE 01: FOTO ESTUDIO (TÍTULO, DIPLOMA, PASAPORTE, ETC.)
                  =============================================================== */}
              {activeModalType === 'estudio' && (
                <div className="bg-white p-4 rounded-2xl border-2 border-[#ECB769]/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-black uppercase text-[#4E2B01] tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ECB769]" />
                      Opciones y Acabados de la Fotografía
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      Total producto: ${getModalEffectiveItem().total.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraRetoque}
                        onChange={(e) => setExtraRetoque(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Retoque profesional</span>
                      <span className="text-[10px] font-mono text-[#4E2B01] ml-auto font-bold">+$30</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraAutoAdherible}
                        onChange={(e) => setExtraAutoAdherible(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Fotografías autoadheribles</span>
                      <span className="text-[10px] font-mono text-[#4E2B01] ml-auto font-bold">+$20</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraAColor}
                        onChange={(e) => {
                          setExtraAColor(e.target.checked);
                          if (e.target.checked) setExtraBlancoNegro(false);
                        }}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">A color</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraBlancoNegro}
                        onChange={(e) => {
                          setExtraBlancoNegro(e.target.checked);
                          if (e.target.checked) setExtraAColor(false);
                        }}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Blanco y negro</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraEnvioEmail}
                        onChange={(e) => setExtraEnvioEmail(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Envío por correo electrónico</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraSacoCorbata}
                        onChange={(e) => setExtraSacoCorbata(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Saco y corbata</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraBlazerMascada}
                        onChange={(e) => setExtraBlazerMascada(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Blazer y mascada</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition select-none border border-transparent hover:border-[#ECB769]">
                      <input
                        type="checkbox"
                        checked={extraCambioCamisa}
                        onChange={(e) => setExtraCambioCamisa(e.target.checked)}
                        className="w-4 h-4 rounded text-[#4E2B01] accent-[#4E2B01]"
                      />
                      <span className="font-bold text-slate-800">Solo cambio de camisa</span>
                    </label>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Color de vestimenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Saco negro, camisa blanca, corbata roja..."
                        value={inputColorVestimenta}
                        onChange={(e) => setInputColorVestimenta(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observaciones para el editor
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Quitar brillo en frente, fondo blanco liso, orejas descubiertas..."
                        value={inputObservacionesEditor}
                        onChange={(e) => setInputObservacionesEditor(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: DATOS DEL CLIENTE (EXACTOS DE LA IMAGEN 008d90ce.png) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-[#ECB769]/60 shadow-xs space-y-3">
                <span className="text-xs font-black uppercase text-[#4E2B01] tracking-wide flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                  <User className="w-4 h-4 text-[#ECB769]" />
                  Datos del cliente: Nombre completo / Teléfono / Correo electrónico
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      value={inputClientFullName}
                      onChange={(e) => setInputClientFullName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="10 dígitos (ej. 555-123-4567)"
                      value={inputClientPhone}
                      onChange={(e) => setInputClientPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={inputClientEmail}
                      onChange={(e) => setInputClientEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity selector (for Caritas, Cambios de Fondo, and Estudio) */}
              {activeModalType !== 'ampliaciones' && (
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-black text-sm text-[#4E2B01]">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer with GENERAR TICKET (Action requested by client) */}
            <div className="bg-white p-3.5 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(null)}
                  className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddStudioProductToCart}
                  className="py-2.5 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition cursor-pointer w-full sm:w-auto border border-slate-300"
                  title="Añadir a la cuenta y seguir seleccionando productos"
                >
                  Agregar al Carrito
                </button>
              </div>

              {/* Main Primary Button: GENERAR TICKET */}
              <button
                type="button"
                onClick={handleGenerateTicketDirect}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 text-sm font-black bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] rounded-2xl shadow-xl cursor-pointer border-2 border-[#ECB769] transition flex items-center justify-center gap-2 active:scale-95"
                title="Generar ticket térmico oficial con código de barras y datos del cliente"
              >
                <Printer className="w-5 h-5 text-[#ECB769]" />
                <span>Generar ticket</span>
                <span className="font-mono text-xs text-[#FFF3BC]/90 font-bold ml-1">
                  (${getModalEffectiveItem().total.toFixed(2)})
                </span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: COMPRAS DE PRUEBA EN EL POS (100% OPERATIVO)
          ========================================================================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-3 border-[#4E2B01] overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-[#4E2B01] text-[#FFF3BC] p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#ECB769] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-xs">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-[#FFF3BC]">
                      Compras de Prueba en Punto de Venta
                    </h2>
                    <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider">
                      Activo 100%
                    </span>
                  </div>
                  <p className="text-xs text-[#FFF3BC]/80">
                    Realiza compras de prueba para emitir, visualizar e imprimir tickets térmicos de 80mm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FCF9F2] flex-1">
              
              <div className="bg-amber-50 border-2 border-[#ECB769] p-3.5 rounded-2xl text-xs text-[#4E2B01]">
                <p className="font-bold">
                  💡 ¿Cómo funciona una compra de prueba?
                </p>
                <p className="mt-1 text-slate-700">
                  Puedes <strong>cargar el ticket</strong> para probar el teclado táctil, billetes y cambio, o hacer <strong>Cobro Inmediato</strong> para que el sistema genere el folio oficial <span className="font-mono font-bold">#TK-XXXXXX</span>, active el confeti y mande el ticket térmico a impresión.
                </p>
              </div>

              {/* Presets List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TEST_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-white rounded-2xl p-4 border-2 border-[#ECB769]/60 hover:border-[#4E2B01] shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]">
                          {preset.badge}
                        </span>
                        <span className="text-base font-black font-mono text-[#4E2B01]">
                          ${preset.total.toFixed(2)}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-slate-900 leading-snug">
                        {preset.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadTestPresetToCart(preset)}
                          className="py-2.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer text-center active:scale-95"
                          title="Cargar artículos al ticket actual"
                        >
                          Cargar al Ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectQuickTestSale(preset, 'efectivo')}
                          className="py-2.5 px-2.5 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] font-black text-xs rounded-xl shadow-xs border border-[#ECB769] transition cursor-pointer text-center active:scale-95 flex items-center justify-center gap-1"
                          title="Cobro rápido en efectivo y emisión de ticket"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#ECB769]" />
                          <span>⚡ Cobrar Ticket</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDirectQuickTestSale(preset, 'clip')}
                        className="w-full py-1.5 text-[11px] font-bold text-[#4E2B01] hover:bg-[#FFF3BC] rounded-lg transition cursor-pointer text-center border border-dashed border-[#ECB769]"
                      >
                        Cobrar simulando Tarjeta / Clip
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="bg-white p-3.5 sm:p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Las compras se registran en el corte de caja y sincronizan con la base de datos.
              </span>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CORTE DE CAJA Y REPORTE DE VENTAS DEL POS
          ========================================================================= */}
      {showCorteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-3 border-[#4E2B01] overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-[#4E2B01] text-[#FFF3BC] p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#ECB769] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#ECB769] text-[#4E2B01] rounded-2xl shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-[#FFF3BC]">
                    Corte de Caja y Reporte de Ventas POS
                  </h2>
                  <p className="text-xs text-[#FFF3BC]/80">
                    Operador: {operatorName} • Terminal Mostrador (Oficina) • Módulo Operativo 100%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCorteModal(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#FCF9F2] flex-1">
              
              {/* Financial KPI Cards */}
              {(() => {
                const list = sales || [];
                const totalRev = list.reduce((sum, s) => sum + s.total, 0);
                const cashTotal = list.filter((s) => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
                const clipTotal = list.filter((s) => s.paymentMethod === 'clip').reduce((sum, s) => sum + s.total, 0);
                const mpTotal = list.filter((s) => s.paymentMethod === 'mercadopago').reduce((sum, s) => sum + s.total, 0);
                const transferTotal = list.filter((s) => s.paymentMethod === 'transferencia').reduce((sum, s) => sum + s.total, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border-2 border-[#ECB769] shadow-xs">
                      <span className="text-[10px] uppercase font-black text-slate-500 block">Total Vendido</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-[#4E2B01] block mt-0.5">
                        ${totalRev.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">{list.length} tickets emitidos</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Efectivo en Caja</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 block mt-0.5">
                        ${cashTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">Cobros físicos</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tarjeta / Clip</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-blue-700 block mt-0.5">
                        ${clipTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">Terminal bancaria</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">SPEI / Banco</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-[#4E2B01] block mt-0.5">
                        ${(transferTotal + mpTotal).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#ECB769] font-black">Santander / Digital</span>
                    </div>
                  </div>
                );
              })()}

              {/* Tickets Table */}
              <div className="bg-white rounded-2xl border-2 border-[#ECB769]/50 shadow-xs overflow-hidden">
                <div className="bg-[#FFF3BC] px-4 py-2.5 border-b border-[#ECB769] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#4E2B01]" />
                    <span className="font-black text-xs uppercase text-[#4E2B01]">
                      Historial de Tickets Emitidos en Mostrador ({sales?.length || 0})
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por folio, cliente..."
                      value={corteSearch}
                      onChange={(e) => setCorteSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4E2B01]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-64 divide-y divide-slate-100">
                  {(() => {
                    const list = (sales || []).filter((s) => {
                      if (!corteSearch.trim()) return true;
                      const q = corteSearch.toLowerCase();
                      return (
                        s.folio.toLowerCase().includes(q) ||
                        (s.clientName && s.clientName.toLowerCase().includes(q)) ||
                        s.paymentMethod.toLowerCase().includes(q)
                      );
                    });

                    if (list.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                          <p className="font-bold text-slate-600">No hay ventas registradas aún</p>
                          <p className="mt-0.5">Usa el botón "Compras de Prueba" arriba para generar tickets de demostración.</p>
                        </div>
                      );
                    }

                    return (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-600 tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Folio</th>
                            <th className="px-3 py-2">Fecha / Hora</th>
                            <th className="px-3 py-2">Cliente</th>
                            <th className="px-3 py-2">Artículos</th>
                            <th className="px-3 py-2">Método</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.map((s) => (
                            <tr key={s.id} className="hover:bg-amber-50/50 transition">
                              <td className="px-3 py-2 font-mono font-black text-[#4E2B01]">
                                #{s.folio}
                              </td>
                              <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                                {s.date}
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-800">
                                {s.clientName || 'Cliente General'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 text-[11px] truncate max-w-[180px]">
                                {s.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#FFF3BC] text-[#4E2B01] border border-[#ECB769]/50">
                                  {s.paymentMethod}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-black text-[#4E2B01]">
                                ${s.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Footer with Actions: Copy for Client, WhatsApp, Print Thermal Shift Report */}
            <div className="bg-white p-3.5 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy for client */}
                <button
                  type="button"
                  onClick={handleCopyCorteReport}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] font-black text-xs rounded-xl shadow-sm border border-[#ECB769] transition cursor-pointer active:scale-95"
                >
                  {corteCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#ECB769]" />}
                  <span>{corteCopied ? '¡Reporte Copiado!' : 'Copiar Reporte para Cliente'}</span>
                </button>

                {/* Send via WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getCorteReportPlainText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </a>

                {/* Print 80mm Z-Cut Thermal Ticket */}
                <button
                  type="button"
                  onClick={handlePrintCorteThermal}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FFF3BC] hover:bg-[#ECB769] text-[#4E2B01] font-black text-xs rounded-xl border border-[#ECB769] shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#4E2B01]" />
                  <span>Imprimir Corte Térmico (80mm)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCorteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Hidden printable thermal shift receipt container for 80mm printer */}
            <div id="corte-thermal-printable" className="hidden">
              <div className="text-center font-bold text-sm">MINIFOTO ESTUDIO</div>
              <div className="text-center text-xs">PUNTO DE VENTA Y MOSTRADOR</div>
              <div className="text-center text-xs">CORTE DE CAJA / TURNO</div>
              <div className="border-dashed"></div>
              <div className="flex-between text-xs">
                <span>Fecha:</span>
                <span>{new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}</span>
              </div>
              <div className="flex-between text-xs">
                <span>Operador:</span>
                <span>{operatorName}</span>
              </div>
              <div className="flex-between text-xs">
                <span>Terminal:</span>
                <span>POS OFICINA</span>
              </div>
              <div className="border-dashed"></div>
              <div className="flex-between text-xs font-bold">
                <span>TOTAL VENDIDO:</span>
                <span>${(sales || []).reduce((sum, s) => sum + s.total, 0).toFixed(2)} MXN</span>
              </div>
              <div className="flex-between text-xs">
                <span>Tickets Emitidos:</span>
                <span>{(sales || []).length}</span>
              </div>
              <div className="flex-between text-xs">
                <span>Efectivo:</span>
                <span>${(sales || []).filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0).toFixed(2)}</span>
              </div>
              <div className="flex-between text-xs">
                <span>Tarjeta (Clip):</span>
                <span>${(sales || []).filter(s => s.paymentMethod === 'clip').reduce((sum, s) => sum + s.total, 0).toFixed(2)}</span>
              </div>
              <div className="flex-between text-xs">
                <span>SPEI / Banco:</span>
                <span>${(sales || []).filter(s => s.paymentMethod === 'transferencia').reduce((sum, s) => sum + s.total, 0).toFixed(2)}</span>
              </div>
              <div className="border-dashed"></div>
              <div className="text-center text-[10px]">
                ¡Módulo POS 100% Operativo!
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
