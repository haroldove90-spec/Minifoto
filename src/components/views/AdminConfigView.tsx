import React, { useState } from 'react';
import { PaymentGatewayConfig, SupabaseConfig, BrandConfig } from '../../types';
import { 
  Sliders, 
  CreditCard, 
  Cloud, 
  Palette, 
  Trash2, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Database,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Receipt,
  Hash
} from 'lucide-react';
import { getStoredFolioConfig, saveStoredFolioConfig } from '../../services/storage';
import { BarcodeSVG } from '../BarcodeAndQR';

interface AdminConfigViewProps {
  brand: BrandConfig;
  onSaveBrand: (brand: BrandConfig) => void;
  gateways: PaymentGatewayConfig[];
  onSaveGateways: (gateways: PaymentGatewayConfig[]) => void;
  supabaseConfig: SupabaseConfig;
  onSaveSupabase: (config: SupabaseConfig) => void;
  onClearSampleData: (cleanCatalogs: boolean) => Promise<{ success: boolean; supabaseDeleted?: boolean }>;
  onRestoreSampleData: () => void;
  isSampleCleared: boolean;
}

export const AdminConfigView: React.FC<AdminConfigViewProps> = ({
  brand,
  onSaveBrand,
  gateways,
  onSaveGateways,
  supabaseConfig,
  onSaveSupabase,
  onClearSampleData,
  onRestoreSampleData,
  isSampleCleared,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'terminals' | 'gateways' | 'sync' | 'brand' | 'folios' | 'data'>('terminals');

  // Folio configuration state
  const [folioConfig, setFolioConfig] = useState(getStoredFolioConfig());

  // Brand form state
  const [bName, setBName] = useState(brand.businessName);
  const [bAddress, setBAddress] = useState(brand.address);
  const [bPhone, setBPhone] = useState(brand.phone);
  const [bFooter, setBFooter] = useState(brand.ticketFooter);
  const [bPrimary, setBPrimary] = useState(brand.primaryColor || '#4E2B01');
  const [bSecondary, setBSecondary] = useState(brand.secondaryColor || '#ECB769');
  const [bLogoUrl, setBLogoUrl] = useState(brand.logoUrl);

  // Supabase form state
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey);
  const [sbEnabled, setSbEnabled] = useState(supabaseConfig.syncEnabled);
  const [sbStatus, setSbStatus] = useState<string | null>(null);
  const [isTestingSb, setIsTestingSb] = useState(false);

  // Gateways local copy
  const [localGateways, setLocalGateways] = useState<PaymentGatewayConfig[]>(gateways);

  // Message toast
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBrand({
      ...brand,
      businessName: bName,
      address: bAddress,
      phone: bPhone,
      ticketFooter: bFooter,
      primaryColor: bPrimary,
      secondaryColor: bSecondary,
      logoUrl: bLogoUrl,
    });
    showSuccessToast();
  };

  const handleToggleGateway = (provider: string) => {
    const updated = localGateways.map((g) => {
      if (g.provider === provider) {
        return { ...g, active: !g.active };
      }
      return g;
    });
    setLocalGateways(updated);
    onSaveGateways(updated);
  };

  const handleUpdateGateway = (provider: string, field: keyof PaymentGatewayConfig, value: any) => {
    const updated = localGateways.map((g) => {
      if (g.provider === provider) {
        return { ...g, [field]: value };
      }
      return g;
    });
    setLocalGateways(updated);
  };

  const handleSaveAllGateways = () => {
    onSaveGateways(localGateways);
    showSuccessToast();
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSupabase({
      ...supabaseConfig,
      url: sbUrl.trim(),
      anonKey: sbKey.trim(),
      syncEnabled: sbEnabled,
      lastSyncTime: new Date().toLocaleString('es-MX'),
    });
    showSuccessToast();
  };

  const handleTestSupabase = async () => {
    if (!sbUrl || !sbKey) {
      setSbStatus('Por favor ingresa la URL y la Anon Key de Supabase');
      return;
    }
    setIsTestingSb(true);
    setSbStatus('Verificando conexión con Supabase...');
    try {
      const res = await fetch(`${sbUrl}/rest/v1/`, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      });
      if (res.ok || res.status === 404 || res.status === 401) {
        setSbStatus('¡Conexión establecida con el servidor de Supabase!');
      } else {
        setSbStatus(`Conexión respondida con código HTTP ${res.status}`);
      }
    } catch {
      setSbStatus('No se pudo contactar el endpoint (revisa la URL o restricciones CORS).');
    } finally {
      setIsTestingSb(false);
    }
  };

  const showSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Sliders className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">
                Configuración y Personalización del Sistema
              </h1>
              <p className="text-xs text-slate-500">
                Pasarelas de cobro con tarjeta, sincronización a la nube, datos de marca y depuración
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveSubTab('terminals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'terminals'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>8 Tablets (POS-01 a POS-08) & Santander</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gateways')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'gateways'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pasarelas de Pago (Clip / MP / Stripe)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'sync'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Nube & Supabase</span>
          </button>

          <button
            onClick={() => setActiveSubTab('brand')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'brand'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Identidad & Colores</span>
          </button>

          <button
            onClick={() => setActiveSubTab('folios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'folios'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Personalizar Folios</span>
          </button>

          <button
            onClick={() => setActiveSubTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'data'
                ? 'bg-[#4E2B01] text-[#FFF3BC] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Gestión de Datos</span>
          </button>
        </div>

        {/* 0. TERMINALS & SANTANDER BANKING TAB */}
        {activeSubTab === 'terminals' && (
          <div className="space-y-4">
            {/* Santander SPEI Info Card */}
            <div className="bg-gradient-to-r from-[#EC0000] to-[#B30000] text-white p-5 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black tracking-tight">Integración Bancaria Santander SPEI</h3>
                  <p className="text-xs text-white/90">Parámetros de conciliación escolar e identificación automática</p>
                </div>
                <span className="text-[10px] font-black bg-white text-[#EC0000] px-3 py-1 rounded-full uppercase">
                  Activo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-black/20 p-3 rounded-2xl">
                  <span className="text-[10px] opacity-80 uppercase font-bold block">Banco Receptor</span>
                  <span className="font-bold text-sm">Banco Santander México</span>
                </div>
                <div className="bg-black/20 p-3 rounded-2xl">
                  <span className="text-[10px] opacity-80 uppercase font-bold block">CLABE Concentradora</span>
                  <span className="font-mono font-black text-sm tracking-wider">014180655012345678</span>
                </div>
                <div className="bg-black/20 p-3 rounded-2xl">
                  <span className="text-[10px] opacity-80 uppercase font-bold block">Algoritmo de Referencia</span>
                  <span className="font-mono font-black text-sm">MF-[Escuela]-[Folio]</span>
                </div>
              </div>
            </div>

            {/* 8 Tablets Grid */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-800">
                    Control de 8 Tablets Móviles de Cobradores
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registro de dispositivos móviles (POS-01 a POS-08), cobrador asignado y estado de sincronización
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-[#4E2B01] bg-[#FCF9F2] px-3 py-1 rounded-xl border border-[#ECB769]">
                  8 Tablets Registradas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { id: 'POS-01', user: 'Juan Pérez', battery: '94%', sync: 'Hace 2 min', status: 'En Línea' },
                  { id: 'POS-02', user: 'Carlos Méndez', battery: '88%', sync: 'Hace 5 min', status: 'En Línea' },
                  { id: 'POS-03', user: 'Roberto Silva', battery: '76%', sync: 'Hace 12 min', status: 'En Línea' },
                  { id: 'POS-04', user: 'Ana Delgado', battery: '99%', sync: 'Hace 1 min', status: 'En Línea' },
                  { id: 'POS-05', user: 'Martín Gómez', battery: '82%', sync: 'Hace 8 min', status: 'En Línea' },
                  { id: 'POS-06', user: 'Laura Vargas', battery: '65%', sync: 'Hace 20 min', status: 'En Línea' },
                  { id: 'POS-07', user: 'David Morales', battery: '91%', sync: 'Hace 4 min', status: 'En Línea' },
                  { id: 'POS-08', user: 'Elena Torres', battery: '85%', sync: 'Hace 10 min', status: 'En Línea' },
                ].map((tablet) => (
                  <div key={tablet.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-[#4E2B01] bg-[#FCF9F2] px-2 py-0.5 rounded-lg border border-[#ECB769]/50">
                        {tablet.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        {tablet.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Cobrador</span>
                      <p className="font-bold text-slate-800 text-xs truncate">{tablet.user}</p>
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Batería: {tablet.battery}</span>
                      <span>Sinc: {tablet.sync}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. GATEWAYS TAB */}
        {activeSubTab === 'gateways' && (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Configuración de Terminales y Pasarelas de Cobro
              </h2>
              <p className="text-xs text-slate-500">
                Activa y asigna credenciales de terminal para cobro en mostrador o campo con Clip, Mercado Pago, Stripe o PayPal
              </p>
            </div>

            <div className="space-y-4">
              {localGateways.map((gw) => (
                <div
                  key={gw.provider}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    gw.active ? 'border-[#4E2B01] bg-[#FFF3BC]/20' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={gw.active}
                        onChange={() => handleToggleGateway(gw.provider)}
                        className="w-5 h-5 text-[#4E2B01] rounded border-slate-300 focus:ring-[#4E2B01]"
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-800">{gw.name}</span>
                        <span className="text-xs text-slate-500 block">Comisión estándar: {gw.commissionPercent}% + IVA</span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        gw.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {gw.active ? 'Activo en Cobro' : 'Inactivo'}
                    </span>
                  </div>

                  {gw.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Terminal ID / Dispositivo:</label>
                        <input
                          type="text"
                          value={gw.terminalId}
                          onChange={(e) => handleUpdateGateway(gw.provider, 'terminalId', e.target.value)}
                          placeholder="Ej. TERM-CLIP-01"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">API Key / Token de Acceso:</label>
                        <input
                          type="password"
                          value={gw.apiKey}
                          onChange={(e) => handleUpdateGateway(gw.provider, 'apiKey', e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAllGateways}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] text-xs sm:text-sm font-bold rounded-xl shadow-md transition"
              >
                <Save className="w-4 h-4 text-[#ECB769]" />
                <span>Guardar Pasarelas</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. SYNC & SUPABASE TAB */}
        {activeSubTab === 'sync' && (
          <form
            onSubmit={handleSaveSupabase}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800">
                  Sincronización a la Nube (Supabase / Modo Offline)
                </h2>
                <p className="text-xs text-slate-500">
                  El sistema funciona 100% offline y almacena datos localmente. Puedes conectar Supabase para respaldo en tiempo real y borrado remoto.
                </p>
              </div>
              <Cloud className="w-8 h-8 text-[#4E2B01]" />
            </div>

            <div className="p-3 bg-[#FFF3BC]/30 border border-[#ECB769]/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#4E2B01] block">Habilitar Sincronización Automática</span>
                <span className="text-[11px] text-slate-600">Sincroniza alumnos y ventas al restaurar conexión a internet</span>
              </div>
              <input
                type="checkbox"
                checked={sbEnabled}
                onChange={(e) => setSbEnabled(e.target.checked)}
                className="w-5 h-5 text-[#4E2B01] rounded border-slate-300 focus:ring-[#4E2B01]"
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Supabase Project URL:</label>
                <input
                  type="url"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Supabase Anon Key / Public Key:</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-mono"
                />
              </div>
            </div>

            {sbStatus && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 font-medium">
                {sbStatus}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSb}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
              >
                {isTestingSb ? 'Probando conexión...' : 'Probar Conexión'}
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] text-xs sm:text-sm font-bold rounded-xl shadow-md transition"
              >
                <Save className="w-4 h-4 text-[#ECB769]" />
                <span>Guardar Configuración Supabase</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. BRAND TAB */}
        {activeSubTab === 'brand' && (
          <form
            onSubmit={handleSaveBrand}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Identidad Gráfica y Paleta de Colores Minifoto
              </h2>
              <p className="text-xs text-slate-500">
                Colores corporativos oficiales: #4E2B01 (Café Principal), #ECB769 (Dorado Acento), #FFF3BC (Crema Suave) y #FCF9F2 (Fondo Header)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Color Primario Institucional:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bPrimary}
                    onChange={(e) => setBPrimary(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={bPrimary}
                    onChange={(e) => setBPrimary(e.target.value)}
                    className="font-mono text-xs font-bold uppercase px-3 py-2 bg-white border border-slate-300 rounded-lg w-28"
                  />
                  <span className="text-xs text-slate-600 font-semibold">(Minifoto #4E2B01)</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Color de Acento / Secundario:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bSecondary}
                    onChange={(e) => setBSecondary(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={bSecondary}
                    onChange={(e) => setBSecondary(e.target.value)}
                    className="font-mono text-xs font-bold uppercase px-3 py-2 bg-white border border-slate-300 rounded-lg w-28"
                  />
                  <span className="text-xs text-slate-600 font-semibold">(Acento #ECB769)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Negocio:</label>
                <input
                  type="text"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dirección para Tickets:</label>
                  <input
                    type="text"
                    value={bAddress}
                    onChange={(e) => setBAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Teléfono:</label>
                  <input
                    type="text"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mensaje al Pie del Ticket:</label>
                <input
                  type="text"
                  value={bFooter}
                  onChange={(e) => setBFooter(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">URL del Logotipo:</label>
                <input
                  type="url"
                  value={bLogoUrl}
                  onChange={(e) => setBLogoUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-[#4E2B01] hover:bg-[#381e01] text-[#FFF3BC] text-xs sm:text-sm font-bold rounded-xl shadow-md transition"
              >
                <Save className="w-4 h-4 text-[#ECB769]" />
                <span>Guardar Identidad</span>
              </button>
            </div>
          </form>
        )}

        {/* 3.5. FOLIOS PERSONALIZADOS (ROL ADMIN) */}
        {activeSubTab === 'folios' && (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Personalización de Folios de Venta y Tickets
                </h2>
                <p className="text-xs text-slate-500">
                  Define el formato, prefijo y numeración consecutiva para los tickets emitidos en el POS
                </p>
              </div>
              <div className="p-2.5 bg-[#FFF3BC] text-[#4E2B01] rounded-2xl border border-[#ECB769]">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-gradient-to-br from-[#FCF9F2] to-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-[#ECB769] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#4E2B01] px-2.5 py-0.5 bg-[#FFF3BC] rounded-md border border-[#ECB769]/70">
                  Vista Previa del Próximo Folio
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#4E2B01] mt-1.5">
                  #{folioConfig.prefix}{String(folioConfig.nextNumber).padStart(folioConfig.padding, '0')}{folioConfig.suffix || ''}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Este es el identificador único que aparecerá en el ticket físico, código de barras y base de datos.
                </p>
              </div>

              {/* Barcode Preview */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                <BarcodeSVG
                  value={`${folioConfig.prefix}${String(folioConfig.nextNumber).padStart(folioConfig.padding, '0')}${folioConfig.suffix || ''}`}
                  width={210}
                  height={45}
                />
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Lectura directa con pistola escáner
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Formatos preconfigurados rápidos:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFolioConfig({ prefix: 'TK-', nextNumber: 149444, padding: 6, suffix: '' })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFF3BC] hover:text-[#4E2B01] text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  Oficial: TK-149444
                </button>
                <button
                  type="button"
                  onClick={() => setFolioConfig({ prefix: 'MF-', nextNumber: 1001, padding: 6, suffix: '' })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFF3BC] hover:text-[#4E2B01] text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  Minifoto: MF-001001
                </button>
                <button
                  type="button"
                  onClick={() => setFolioConfig({ prefix: 'FOTO-', nextNumber: 500, padding: 5, suffix: '-26' })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFF3BC] hover:text-[#4E2B01] text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  Estudio con Año: FOTO-00500-26
                </button>
              </div>
            </div>

            {/* Folio Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveStoredFolioConfig(folioConfig);
                showSuccessToast();
              }}
              className="space-y-4 pt-2 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Prefijo del Folio:</label>
                  <input
                    type="text"
                    value={folioConfig.prefix}
                    onChange={(e) => setFolioConfig({ ...folioConfig, prefix: e.target.value.toUpperCase() })}
                    placeholder="Ej. TK- o MF-"
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-[#4E2B01] focus:ring-1 focus:ring-[#4E2B01]"
                  />
                  <span className="text-[10px] text-slate-400">Letras antes del número</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Número Consecutivo Siguiente:</label>
                  <input
                    type="number"
                    min="1"
                    value={folioConfig.nextNumber}
                    onChange={(e) => setFolioConfig({ ...folioConfig, nextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-[#4E2B01] focus:ring-1 focus:ring-[#4E2B01]"
                  />
                  <span className="text-[10px] text-slate-400">Próximo ticket que se emitirá</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cantidad de Dígitos (Relleno):</label>
                  <select
                    value={folioConfig.padding}
                    onChange={(e) => setFolioConfig({ ...folioConfig, padding: parseInt(e.target.value) || 6 })}
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-[#4E2B01]"
                  >
                    <option value={4}>4 dígitos (ej. 0001)</option>
                    <option value={5}>5 dígitos (ej. 00001)</option>
                    <option value={6}>6 dígitos (ej. 000001)</option>
                    <option value={8}>8 dígitos (ej. 00000001)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Ceros a la izquierda</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Sufijo Opcional:</label>
                  <input
                    type="text"
                    value={folioConfig.suffix || ''}
                    onChange={(e) => setFolioConfig({ ...folioConfig, suffix: e.target.value.toUpperCase() })}
                    placeholder="Ej. -OFI o /2026"
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-[#4E2B01]"
                  />
                  <span className="text-[10px] text-slate-400">Texto al final (opcional)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-slate-500">
                  Al registrar una venta en el POS, el folio se incrementará automáticamente de forma consecutiva.
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] text-xs font-bold rounded-xl shadow-md border-2 border-[#ECB769] transition cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4 text-[#ECB769]" />
                  <span>Guardar Formato de Folio</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. DATA MANAGEMENT TAB */}
        {activeSubTab === 'data' && (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800">
                  Gestión y Borrado de Datos de Muestra
                </h2>
                <p className="text-xs text-slate-500">
                  Controla la persistencia de datos de demostración y sincronización con Supabase
                </p>
              </div>
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Borrado Permanente de Datos de Muestra</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Al presionar este botón, se eliminarán los alumnos graduados de muestra, tickets de venta de prueba y registros de convenios. El navegador recordará esta preferencia en <code>localStorage</code> para que <strong>los datos de muestra no vuelvan a mostrarse</strong> al refrescar o recargar la página.
              </p>
              
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onClearSampleData(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Borrar Datos de Muestra (Mantener Catálogo de Servicios)
                </button>
                <button
                  type="button"
                  onClick={() => onClearSampleData(true)}
                  className="px-4 py-2 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Borrar TODO (Base de datos 100% limpia)
                </button>
              </div>
            </div>

            {isSampleCleared && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">
                    ✓ Los datos de muestra están borrados y desactivados.
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Tu sistema está operando con datos limpios y no regenerará información falsa.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRestoreSampleData}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg transition"
                >
                  Restaurar Datos de Demostración
                </button>
              </div>
            )}
          </div>
        )}

        {/* Global Toast */}
        {savedSuccess && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#4E2B01] text-[#FFF3BC] px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom text-xs font-bold border-2 border-[#ECB769]">
            <CheckCircle2 className="w-4 h-4 text-[#ECB769]" />
            <span>Configuración guardada correctamente</span>
          </div>
        )}

      </div>
    </div>
  );
};
