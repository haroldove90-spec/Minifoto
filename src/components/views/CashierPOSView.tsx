import React, { useState } from 'react';
import { Product, CartItem, Category, PaymentMethod, Sale } from '../../types';
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
  ArrowLeft,
  Delete,
  Receipt,
  Home,
  LogOut,
  ShoppingBag,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORY_FALLBACK_IMAGES } from '../../services/initialData';

interface CashierPOSViewProps {
  products: Product[];
  operatorName: string;
  onCompleteSale: (sale: Sale, options?: { autoPrint?: boolean }) => void;
  onExitToDashboard?: () => void;
  onSwitchRole?: () => void;
  brandLogo?: string;
}

type PosScreenMode = 'main' | 'variable_selector' | 'calculator_checkout';

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({
  products,
  operatorName,
  onCompleteSale,
  onExitToDashboard,
  onSwitchRole,
  brandLogo = 'https://appdesignproyectos.com/photologo.png',
}) => {
  // Navigation mode between the 3 touch screens
  const [screenMode, setScreenMode] = useState<PosScreenMode>('main');
  const [activeCategoryForVariables, setActiveCategoryForVariables] = useState<Category>('foto_estudio');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [mobileTab, setMobileTab] = useState<'categories' | 'ticket'>('categories');

  // Selected item modal for studio photo extras (Retoque / Autoadherible)
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [extraRetoque, setExtraRetoque] = useState(false);
  const [extraAutoAdherible, setExtraAutoAdherible] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Full-screen Calculator & Checkout State (Foto 3)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [calcInput, setCalcInput] = useState<string>(''); // Amount entered in the calculator
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Electronic simulation feedback
  const [terminalSimStatus, setTerminalSimStatus] = useState<'idle' | 'processing' | 'approved'>('idle');

  // Filter only active products for POS operations
  const activeProducts = products.filter((p) => p.isActive !== false);

  // Categories config with large touch color tiles and big vertical icons
  const categoriesConfig: { id: Category; label: string; icon: React.ReactNode; color: string; border: string }[] = [
    { 
      id: 'foto_estudio', 
      label: 'FOTO ESTUDIO', 
      icon: <Camera className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950',
      border: 'border-yellow-500' 
    },
    { 
      id: 'ampliaciones', 
      label: 'AMPLIACIONES', 
      icon: <Maximize2 className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-lime-400 hover:bg-lime-300 text-slate-950',
      border: 'border-lime-500' 
    },
    { 
      id: 'minilab', 
      label: 'MINILAB', 
      icon: <Film className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-yellow-300 hover:bg-yellow-200 text-slate-950',
      border: 'border-yellow-400' 
    },
    { 
      id: 'iglesias', 
      label: 'IGLESIAS / EVENTOS', 
      icon: <Church className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
      border: 'border-amber-500' 
    },
    { 
      id: 'fotoacabado', 
      label: 'FOTOACABADO', 
      icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-lime-300 hover:bg-lime-200 text-slate-950',
      border: 'border-lime-400' 
    },
    { 
      id: 'salon_seis_party', 
      label: 'SALÓN SIX PARTY', 
      icon: <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950',
      border: 'border-emerald-500' 
    },
    { 
      id: 'fuente_sodas', 
      label: 'CAFETERÍA / FUENTE', 
      icon: <Coffee className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-orange-400 hover:bg-orange-300 text-slate-950',
      border: 'border-orange-500' 
    },
    { 
      id: 'graduaciones', 
      label: 'GRADUACIONES 2026', 
      icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />, 
      color: 'bg-teal-400 hover:bg-teal-300 text-slate-950',
      border: 'border-teal-500' 
    },
  ];

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculator tendered amount
  const cashGiven = calcInput !== '' ? parseFloat(calcInput) || 0 : total;
  const changeDue = paymentMethod === 'efectivo' && cashGiven >= total ? cashGiven - total : 0;

  // Add direct product
  const addProductToCart = (product: Product, extras?: { retoque?: boolean; autoAdherible?: boolean }, qty = 1) => {
    const retoqueP = extras?.retoque ? (product.defaultRetoquePrice || 30) : 0;
    const autoAdhP = extras?.autoAdherible ? (product.defaultAutoAdheriblePrice || 20) : 0;
    const unitPrice = product.price + retoqueP + autoAdhP;

    // Check if same item with same options exists
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
  };

  const removeItem = (cartItemId: string) => {
    setCart(cart.filter((item) => item.id !== cartItemId));
  };

  const clearAllCart = () => {
    setCart([]);
    setCalcInput('');
  };

  // Open variable products screen for a given category (Foto 2)
  const handleOpenCategoryVariables = (category: Category) => {
    setActiveCategoryForVariables(category);
    setScreenMode('variable_selector');
  };

  // When a product card is clicked
  const handleProductCardClick = (product: Product) => {
    if (product.category === 'foto_estudio' || product.hasExtras) {
      setActiveModalProduct(product);
      setExtraRetoque(false);
      setExtraAutoAdherible(false);
      setModalQuantity(1);
    } else {
      addProductToCart(product);
    }
  };

  // Confirm studio photo extras modal
  const handleConfirmExtras = () => {
    if (!activeModalProduct) return;
    addProductToCart(activeModalProduct, {
      retoque: extraRetoque,
      autoAdherible: extraAutoAdherible,
    }, modalQuantity);
    setActiveModalProduct(null);
  };

  // Go to Full-Screen Calculator & Checkout (Foto 3)
  const handleGoToCalculator = () => {
    if (cart.length === 0) return;
    setCalcInput(total.toString()); // default to exact total
    setPaymentMethod('efectivo');
    setCheckoutError(null);
    setTerminalSimStatus('idle');
    setScreenMode('calculator_checkout');
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

  // Fast Denomination Buttons
  const handleSetDenomination = (amount: number) => {
    setCalcInput(amount.toString());
    setCheckoutError(null);
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

    const folio = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      folio,
      date: dateStr,
      role: 'cashier',
      operatorName: operatorName || 'Cajero de Mostrador',
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
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
      confetti({ particleCount: 70, spread: 80 });
    } catch {}

    setTimeout(() => {
      onCompleteSale(newSale, { autoPrint: autoPrintTicket });
      clearAllCart();
      setIsProcessing(false);
      setScreenMode('main');
    }, 450);
  };

  // Simulate Terminal Clip
  const handleSimulateClip = () => {
    setTerminalSimStatus('processing');
    setTimeout(() => {
      setTerminalSimStatus('approved');
    }, 1200);
  };

  // Products belonging to the active variable category (Only active items)
  const variableCategoryProducts = activeProducts.filter((p) => p.category === activeCategoryForVariables);
  const activeCategoryMeta = categoriesConfig.find((c) => c.id === activeCategoryForVariables);

  // Common quick items for the main screen tiles
  const quickDirectItems = activeProducts.slice(0, 8);

  // =========================================================================
  // SCREEN 3: CALCULADORA DE COBRO EN PANTALLA COMPLETA (Foto 3)
  // =========================================================================
  if (screenMode === 'calculator_checkout') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
        
        {/* Top bar with Monto and Concept */}
        <div className="bg-slate-950 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreenMode('main')}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md border-2 border-yellow-600 flex items-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Regresar al Ticket</span>
            </button>
            <span className="hidden sm:inline text-xs uppercase font-bold text-slate-400">
              Cajero: <strong className="text-yellow-400">{operatorName}</strong>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block">Total a Cobrar</span>
            <span className="text-2xl sm:text-4xl font-black text-yellow-400 font-mono tracking-tight">
              ${total.toFixed(2)} <span className="text-xs sm:text-sm text-yellow-200">MXN</span>
            </span>
          </div>
        </div>

        {/* Error notice if insufficient cash */}
        {checkoutError && (
          <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 animate-bounce">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Main 2-column Calculator Screen (Foto 3) */}
        <div className="flex-1 flex flex-col lg:flex-row p-3 sm:p-6 gap-4 sm:gap-8 max-w-7xl mx-auto w-full items-center justify-center">
          
          {/* LEFT: Giant Touch Calculator Keypad (Foto 3) */}
          <div className="w-full lg:w-1/2 max-w-md bg-slate-800/90 rounded-3xl p-4 sm:p-6 border-2 border-slate-700 shadow-2xl flex flex-col justify-center">
            
            {/* Monto Display Box */}
            <div className="mb-3 bg-slate-950 rounded-2xl p-3 sm:p-4 border-2 border-yellow-500 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span>EFECTIVO RECIBIDO (MONTO)</span>
                <span className="text-yellow-400 font-mono">MXN</span>
              </div>
              <div className="text-right font-mono text-3xl sm:text-5xl font-black text-yellow-400 tracking-wider truncate">
                ${cashGiven.toFixed(2)}
              </div>
            </div>

            {/* Quick Bill Chips */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => handleSetDenomination(total)}
                className="py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-black text-xs rounded-xl border border-yellow-500/40 cursor-pointer active:scale-95 text-center"
              >
                Exacto
              </button>
              <button
                type="button"
                onClick={() => handleSetDenomination(50)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer active:scale-95 text-center"
              >
                $50
              </button>
              <button
                type="button"
                onClick={() => handleSetDenomination(100)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer active:scale-95 text-center"
              >
                $100
              </button>
              <button
                type="button"
                onClick={() => handleSetDenomination(200)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer active:scale-95 text-center"
              >
                $200
              </button>
              <button
                type="button"
                onClick={() => handleSetDenomination(500)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer active:scale-95 text-center"
              >
                $500
              </button>
              <button
                type="button"
                onClick={() => handleSetDenomination(1000)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer active:scale-95 text-center"
              >
                $1k
              </button>
            </div>

            {/* Keypad Grid (Foto 3): 1 2 3 / 4 5 6 / 7 8 9 / 0 . C */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleCalcKeyPress(k)}
                  className={`h-14 sm:h-20 rounded-2xl font-black text-2xl sm:text-4xl shadow-md border-2 cursor-pointer active:scale-95 transition flex items-center justify-center ${
                    k === 'C'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-700'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-yellow-500'
                  }`}
                >
                  {k === 'C' ? <Delete className="w-7 h-7 sm:w-8 sm:h-8" /> : k}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Big Action Buttons & Change Output (Foto 3) */}
          <div className="w-full lg:w-1/2 max-w-md flex flex-col gap-3 sm:gap-4 justify-center">
            
            {/* Change Due Box */}
            <div className="bg-slate-800/90 rounded-3xl p-4 sm:p-5 border-2 border-slate-700 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block">Cambio a Entregar</span>
                <span className="text-xs text-slate-500">Saldo que regresa al cliente</span>
              </div>
              <span className={`text-3xl sm:text-5xl font-mono font-black ${changeDue > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
                ${changeDue.toFixed(2)}
              </span>
            </div>

            {/* Payment Method Selector Tiles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-md scale-102'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('clip')}
                className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${
                  paymentMethod === 'clip'
                    ? 'bg-[#F97800] text-white border-orange-500 shadow-md scale-102'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Clip 💳</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mercadopago')}
                className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${
                  paymentMethod === 'mercadopago'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-md scale-102'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>Mercado Pago</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${
                  paymentMethod === 'transferencia'
                    ? 'bg-teal-500 text-white border-teal-600 shadow-md scale-102'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <ArrowRight className="w-5 h-5" />
                <span>SPEI</span>
              </button>
            </div>

            {/* Electronic terminal simulation trigger if non-cash */}
            {paymentMethod !== 'efectivo' && (
              <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                {terminalSimStatus === 'idle' && (
                  <>
                    <span className="text-slate-300 font-semibold">Simular aprobación en terminal:</span>
                    <button
                      type="button"
                      onClick={handleSimulateClip}
                      className="px-3 py-1.5 bg-[#F97800] hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Aprobar Terminal
                    </button>
                  </>
                )}
                {terminalSimStatus === 'processing' && (
                  <span className="text-orange-400 font-bold animate-pulse">
                    Conectando con banco emisor...
                  </span>
                )}
                {terminalSimStatus === 'approved' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ¡Pago Aprobado! Aut #891238
                  </span>
                )}
              </div>
            )}

            {/* Checkbox auto-print */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={autoPrintTicket}
                onChange={(e) => setAutoPrintTicket(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500"
              />
              <span>Mandar ticket automáticamente a la impresora térmica</span>
            </label>

            {/* Giant Green CONTINUAR / COBRAR button (Foto 3) */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmCheckoutSale}
              className="w-full py-4 sm:py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 disabled:opacity-50 text-slate-950 font-black text-xl sm:text-2xl rounded-3xl shadow-2xl border-4 border-emerald-400 transition cursor-pointer flex items-center justify-center gap-3"
            >
              <Printer className="w-7 h-7 sm:w-8 sm:h-8" />
              <span>{isProcessing ? 'PROCESANDO...' : 'CONTINUAR / COBRAR E IMPRIMIR'}</span>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setScreenMode('main')}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer text-center"
            >
              Cancelar y regresar al Punto de Venta
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: SELECTOR DE PRODUCTOS VARIABLES (Foto 2) CON FOTOS
  // =========================================================================
  if (screenMode === 'variable_selector') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans select-none overflow-hidden">
        
        {/* Top Bar with Big Yellow Salir Button (Foto 2) */}
        <div className="bg-white border-b-2 border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs shrink-0">
          {/* Big Yellow "Salir" button (exact to photo 2) */}
          <button
            onClick={() => setScreenMode('main')}
            className="px-5 sm:px-8 py-2.5 sm:py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-sm sm:text-lg rounded-2xl shadow-md border-2 border-yellow-600 flex items-center gap-2 cursor-pointer transition"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Salir / Regresar</span>
          </button>

          {/* Title (e.g. FOTO ESTUDIO / AMPLIACIONES) */}
          <h1 className="text-base sm:text-2xl font-black text-[#004C59] uppercase tracking-wide truncate px-2">
            {activeCategoryMeta?.label || 'Selección de Producto'}
          </h1>

          {/* Quick Cart Status & Direct Checkout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500">Ticket</span>
              <span className="text-sm font-black text-[#004C59]">{totalItemsCount} arts (${total.toFixed(2)})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleGoToCalculator}
                className="px-4 py-2 sm:py-2.5 bg-[#F97800] hover:bg-orange-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                Cobrar (${total.toFixed(2)}) ➔
              </button>
            )}
          </div>
        </div>

        {/* Grid of Large Variable Product Tiles WITH PHOTOS (Foto 2) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100">
          <div className="max-w-7xl mx-auto">
            {variableCategoryProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto my-8">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-700">No hay productos activos en esta categoría</p>
                <p className="text-xs text-slate-500 mt-1">Puedes agregar o activar productos desde el Catálogo de Administrador.</p>
                <button
                  onClick={() => setScreenMode('main')}
                  className="mt-4 px-5 py-2.5 bg-[#004C59] hover:bg-teal-900 text-white rounded-xl text-sm font-bold cursor-pointer transition shadow-sm"
                >
                  Regresar al Menú Principal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                {variableCategoryProducts.map((prod) => {
                  const fallbackImg = CATEGORY_FALLBACK_IMAGES[prod.category] || CATEGORY_FALLBACK_IMAGES.foto_estudio;
                  const displayImg = prod.imageUrl || fallbackImg;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleProductCardClick(prod)}
                      type="button"
                      className="rounded-2xl bg-white hover:bg-yellow-50/40 border-2 border-yellow-400 hover:border-yellow-500 shadow-sm hover:shadow-xl active:scale-95 transition-all flex flex-col overflow-hidden text-left cursor-pointer group"
                    >
                      {/* Product Photo */}
                      <div className="relative w-full h-32 sm:h-38 bg-slate-200 overflow-hidden">
                        <img
                          src={displayImg}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = fallbackImg;
                          }}
                        />

                        {/* Extras Badge */}
                        {prod.hasExtras && (
                          <span className="absolute top-2 left-2 bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-yellow-500">
                            +Extras
                          </span>
                        )}

                        {/* Price Badge on photo */}
                        <span className="absolute bottom-2 right-2 bg-slate-950/85 backdrop-blur-xs text-yellow-400 font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg shadow-md">
                          ${prod.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Content: Title & Description */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                            {prod.name}
                          </h3>
                          {prod.description && (
                            <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 mt-1">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="w-full mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {prod.hasExtras ? 'Con Opciones' : 'Toca para agregar'}
                          </span>
                          <span className="text-sm sm:text-base font-black text-[#004C59] font-mono">
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Mobile Checkout Dock if Cart has items */}
        {cart.length > 0 && (
          <div className="sm:hidden bg-white border-t border-slate-200 p-3 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ticket</span>
              <span className="text-lg font-black text-[#004C59]">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleGoToCalculator}
              className="px-6 py-2.5 bg-[#F97800] text-white font-black text-sm rounded-xl shadow-md cursor-pointer active:scale-95"
            >
              Ir a Cobrar (${total.toFixed(2)}) ➔
            </button>
          </div>
        )}

        {/* MODAL EXTRAS (Retoque / Autoadherible si aplica) con foto del producto */}
        {activeModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#004C59] text-slate-800">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeModalProduct.imageUrl || CATEGORY_FALLBACK_IMAGES[activeModalProduct.category]}
                    alt={activeModalProduct.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-black text-[#004C59] leading-tight">{activeModalProduct.name}</h3>
                    <span className="text-xs text-slate-500 font-mono font-bold">Precio base: ${activeModalProduct.price.toFixed(2)}</span>
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
                  onClick={handleConfirmExtras}
                  className="flex-2 py-3 text-xs font-black bg-[#004C59] hover:bg-teal-900 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Agregar al Ticket
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: TERMINAL PRINCIPAL DE VENTAS TOUCH (Foto 1)
  // CON BOTONES VERTICALES: ICONO MÁS GRANDE ARRIBA Y NOMBRE ABAJO
  // =========================================================================
  return (
    <div className="fixed inset-0 z-40 bg-slate-900 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Clean POS Kiosk Header: Back to Dashboard, Brand Logo, Cashier info */}
      <div className="bg-slate-950 text-white px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
        
        {/* Left: Big Yellow Exit Button & Full Logo */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {onExitToDashboard && (
            <button
              onClick={onExitToDashboard}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-2 border-yellow-500 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              title="Regresar al menú principal"
            >
              <Home className="w-4 h-4" />
              <span>Regresar al Dashboard</span>
            </button>
          )}

          {/* Full unencapsulated logo */}
          <img 
            src={brandLogo} 
            alt="Logo POS" 
            className="h-8 sm:h-10 max-w-[130px] sm:max-w-[180px] object-contain shrink-0 hidden xs:block"
          />
        </div>

        {/* Center / Right: Operator and Session Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Punto de Venta Touch</span>
            <span className="font-extrabold text-yellow-400 truncate max-w-[140px] sm:max-w-xs">
              {operatorName}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearAllCart}
              type="button"
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition active:scale-95"
              title="Vaciar artículos del ticket"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}

          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              type="button"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer transition"
              title="Cerrar sesión o cambiar de rol"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher between Categories and Ticket */}
      <div className="lg:hidden flex bg-slate-800 text-white text-xs font-bold border-b border-slate-700">
        <button
          onClick={() => setMobileTab('categories')}
          className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 ${
            mobileTab === 'categories' ? 'bg-[#004C59] text-white font-black' : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Categorías y Productos</span>
        </button>
        <button
          onClick={() => setMobileTab('ticket')}
          className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 ${
            mobileTab === 'ticket' ? 'bg-[#004C59] text-white font-black' : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ver Ticket ({totalItemsCount} arts - ${total.toFixed(2)})</span>
        </button>
      </div>

      {/* Main Screen Layout (Foto 1) */}
      <div className="flex-1 flex flex-col lg:flex-row bg-slate-200 overflow-hidden">
        
        {/* LEFT / CENTER: Matrix of Large Touch Tiles & Ticket Table (Foto 1) */}
        <div className={`flex-1 flex-col overflow-hidden p-2 sm:p-3 ${mobileTab === 'categories' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Top: Categories Matrix of Large Touch Buttons WITH VERTICAL ICON & LABEL */}
          <div className="mb-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Toca un Servicio para ver sus Productos y Variantes:</span>
              <span className="text-slate-500 font-mono text-[10px]">Modo Touch</span>
            </div>

            {/* BOTONES VERTICALES: ICONO GRANDE ARRIBA Y NOMBRE ABAJO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {categoriesConfig.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleOpenCategoryVariables(cat.id)}
                  type="button"
                  className={`p-3 sm:p-3.5 rounded-2xl border-3 font-black transition-all shadow-md hover:shadow-xl active:scale-95 cursor-pointer flex flex-col items-center justify-center text-center min-h-[96px] sm:min-h-[112px] ${cat.color} ${cat.border}`}
                >
                  {/* Icono Más Grande Arriba */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-black/10 mb-1.5 shrink-0 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  {/* Nombre del Producto / Servicio Abajo */}
                  <span className="block font-black text-xs sm:text-sm tracking-tight leading-snug text-center max-w-full">
                    {cat.label}
                  </span>
                  <span className="text-[9px] font-bold opacity-80 block mt-0.5">
                    Ver Variantes ▶
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Frequent Items Row */}
          <div className="mb-2 hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase text-slate-600 whitespace-nowrap pl-1">Frecuentes:</span>
            {quickDirectItems.map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleProductCardClick(prod)}
                type="button"
                className="px-2.5 py-1.5 bg-white hover:bg-yellow-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                {prod.imageUrl && (
                  <img
                    src={prod.imageUrl}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                )}
                <span>{prod.name}</span>
                <strong className="text-[#004C59] font-mono">${prod.price}</strong>
              </button>
            ))}
          </div>

          {/* Bottom Area: Line Items Table (Foto 1) */}
          <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col overflow-hidden">
            
            {/* Table Header (Foto 1: N°, Descripción, Precio, Cantidad, Importe) */}
            <div className="bg-yellow-200 border-b border-yellow-400 px-3 py-2 grid grid-cols-12 text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 shrink-0">
              <span className="col-span-1">N°</span>
              <span className="col-span-5 sm:col-span-6">Descripción / Servicio</span>
              <span className="col-span-2 text-right">Precio</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-2 text-right">Importe</span>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 mb-1" />
                  <p className="font-bold text-xs sm:text-sm text-slate-600">Ticket Vacío</p>
                  <p className="text-[11px] text-slate-400">Presiona cualquier botón superior para añadir productos</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 grid grid-cols-12 text-xs font-medium items-center hover:bg-slate-50 transition"
                  >
                    <span className="col-span-1 font-mono font-bold text-slate-500">{idx + 1}</span>
                    <div className="col-span-5 sm:col-span-6 pr-1">
                      <span className="font-bold text-slate-900 block leading-tight">{item.name}</span>
                      {(item.options.retoque || item.options.autoAdherible) && (
                        <div className="text-[10px] text-[#004C59] font-bold flex gap-1">
                          {item.options.retoque && <span>+Retoque(${item.options.retoquePrice})</span>}
                          {item.options.autoAdherible && <span>+Adherible(${item.options.autoAdheriblePrice})</span>}
                        </div>
                      )}
                    </div>
                    <span className="col-span-2 text-right font-mono font-bold text-slate-600">
                      ${item.unitPrice.toFixed(2)}
                    </span>
                    
                    {/* Cantidad con botones táctiles */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-sm w-5 text-center font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <span className="font-mono font-black text-sm text-[#004C59]">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Total Bar (Foto 1: Total en letras gigantes) */}
            <div className="bg-slate-100 border-t-2 border-slate-300 p-2.5 sm:p-3 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Total a Pagar</span>
                <span className="text-xs font-semibold text-slate-600">{totalItemsCount} artículos en ticket</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-4xl font-black text-[#004C59] font-mono tracking-tight">
                  ${total.toFixed(2)} <span className="text-xs font-bold text-slate-500">MXN</span>
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Keypad & Giant COBRAR Button (Foto 1) */}
        <div className={`w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l-2 border-slate-300 p-3 sm:p-4 flex-col justify-between shadow-lg ${
          mobileTab === 'ticket' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Client Quick Info */}
          <div className="mb-3 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Datos del Cliente (Opcional):</span>
            <input
              type="text"
              placeholder="Nombre del cliente..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#004C59]"
            />
          </div>

          {/* Numeric Pad (Foto 1: Teclado táctil a la derecha) */}
          <div className="flex-1 flex flex-col justify-center my-2">
            <span className="text-[10px] font-black uppercase text-slate-500 mb-1.5 text-center">Teclado Numérico de Caja</span>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'C', '+'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      clearAllCart();
                    } else if (k === '+') {
                      if (cart.length > 0) updateQuantity(cart[cart.length - 1].id, 1);
                    }
                  }}
                  className={`h-12 sm:h-14 rounded-xl font-black text-lg sm:text-xl shadow-xs border-2 cursor-pointer active:scale-95 transition flex items-center justify-center ${
                    k === 'C'
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                      : 'bg-lime-300 hover:bg-lime-200 text-slate-900 border-lime-500'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* GIANT ACTION BUTTON: COBRAR (Foto 1) -> Switches to Screen 3 Calculator */}
          <div className="mt-3 space-y-2">
            <button
              onClick={handleGoToCalculator}
              disabled={cart.length === 0}
              type="button"
              className="w-full py-4 sm:py-5 bg-[#F97800] hover:bg-orange-600 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl border-3 border-orange-600 transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <CreditCard className="w-7 h-7" />
              <span>COBRAR (${total.toFixed(2)})</span>
            </button>
            <span className="text-[10px] text-center text-slate-500 font-bold block">
              Abre la calculadora en pantalla completa para cobrar e imprimir
            </span>
          </div>

        </div>

      </div>

      {/* Floating Sticky Bottom Bar for Mobile View when in categories tab */}
      {mobileTab === 'categories' && cart.length > 0 && (
        <div className="lg:hidden bg-slate-950 border-t-2 border-yellow-400 p-2.5 flex items-center justify-between shadow-2xl z-30 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total ({totalItemsCount} arts)</span>
            <span className="text-xl font-black text-yellow-400 font-mono">${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMobileTab('ticket')}
              className="px-3 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
            >
              Ver Ticket
            </button>
            <button
              onClick={handleGoToCalculator}
              className="px-5 py-2 bg-[#F97800] hover:bg-orange-600 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg border border-orange-400 flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>COBRAR (${total.toFixed(2)})</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
