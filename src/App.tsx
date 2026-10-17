/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Role, 
  Product, 
  School, 
  GraduationStudent, 
  Sale, 
  BrandConfig, 
  PaymentGatewayConfig, 
  SupabaseConfig 
} from './types';
import { 
  getStoredRole, 
  saveStoredRole, 
  getStoredOperator, 
  saveStoredOperator,
  getStoredProducts, 
  saveStoredProducts,
  getStoredSchools, 
  saveStoredSchools,
  getStoredStudents, 
  saveStoredStudents,
  getStoredSales, 
  addStoredSale,
  saveStoredSales,
  getStoredBrandConfig, 
  saveStoredBrandConfig,
  getStoredGateways, 
  saveStoredGateways,
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig,
  isSampleDataCleared,
  clearSampleDataSystem,
  restoreSampleDataSystem
} from './services/storage';

import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BottomBar } from './components/BottomBar';
import { TicketModal } from './components/TicketModal';

import { CashierPOSView } from './components/views/CashierPOSView';
import { DashboardHomeView } from './components/views/DashboardHomeView';
import { FieldCollectorView } from './components/views/FieldCollectorView';
import { PackageDeliveriesView } from './components/views/PackageDeliveriesView';
import { AdminCatalogsView } from './components/views/AdminCatalogsView';
import { AdminSchoolsView } from './components/views/AdminSchoolsView';
import { AdminReportsView } from './components/views/AdminReportsView';
import { AdminConfigView } from './components/views/AdminConfigView';

export default function App() {
  // Session & Role state
  const [currentRole, setCurrentRole] = useState<Role | null>(() => getStoredRole());
  const [operatorName, setOperatorName] = useState<string>(() => getStoredOperator());
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos_cashier');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // App data states
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<GraduationStudent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [brand, setBrand] = useState<BrandConfig>(getStoredBrandConfig);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>(getStoredGateways);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isSampleCleared, setIsSampleCleared] = useState<boolean>(isSampleDataCleared);

  // Ticket modal state
  const [activeSaleTicket, setActiveSaleTicket] = useState<Sale | null>(null);
  const [activeStudentTicket, setActiveStudentTicket] = useState<GraduationStudent | null>(null);
  const [autoPrintTicket, setAutoPrintTicket] = useState<boolean>(false);

  // Load stored data on mount
  useEffect(() => {
    setProducts(getStoredProducts());
    setSchools(getStoredSchools());
    setStudents(getStoredStudents());
    setSales(getStoredSales());
    setBrand(getStoredBrandConfig());
    setGateways(getStoredGateways());
    setSupabaseConfig(getStoredSupabaseConfig());
    setIsSampleCleared(isSampleDataCleared());
  }, []);

  // When role changes, set default active tab appropriately
  const handleSelectRole = (role: Role, opName: string) => {
    setCurrentRole(role);
    setOperatorName(opName);
    saveStoredRole(role);
    saveStoredOperator(opName);

    if (role === 'field') {
      setActiveTab('field_collector');
    } else if (role === 'cashier') {
      setActiveTab('pos_cashier');
    } else {
      setActiveTab('pos_cashier');
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    saveStoredRole(null);
  };

  // Data mutations
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
  };

  const handleSaveSchools = (newSchools: School[]) => {
    setSchools(newSchools);
    saveStoredSchools(newSchools);
  };

  const handleSaveStudents = (newStudents: GraduationStudent[]) => {
    setStudents(newStudents);
    saveStoredStudents(newStudents);
  };

  const handleCompleteSale = (newSale: Sale, options?: { autoPrint?: boolean }) => {
    const updated = addStoredSale(newSale);
    setSales(updated);
    setActiveSaleTicket(newSale);
    setActiveStudentTicket(null);
    setAutoPrintTicket(options?.autoPrint ?? true);
  };

  const handleAddStudentReceipt = (newStudent: GraduationStudent) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStoredStudents(updated);

    // Also record the deposit as a sale record
    if (newStudent.depositAmount > 0) {
      const depositSale: Sale = {
        id: `sale-dep-${Date.now()}`,
        folio: `ANT-${newStudent.folio.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
        date: newStudent.createdAt,
        role: 'field',
        operatorName: operatorName || 'Cobrador Móvil',
        clientName: newStudent.studentName,
        schoolName: newStudent.schoolName,
        items: [
          {
            id: `item-dep-${newStudent.id}`,
            productId: 'prod-anticipo',
            name: `Anticipo Paquete Escolar (${newStudent.packageName})`,
            category: 'graduaciones',
            unitPrice: newStudent.depositAmount,
            quantity: 1,
            options: {},
            totalPrice: newStudent.depositAmount,
          },
        ],
        subtotal: newStudent.depositAmount,
        discount: 0,
        total: newStudent.depositAmount,
        paymentMethod: 'efectivo',
        amountPaid: newStudent.depositAmount,
        change: 0,
        status: 'anticipo',
        notes: `Folio Alumno: ${newStudent.folio} - Escuela: ${newStudent.schoolName}`,
      };
      const updatedSales = addStoredSale(depositSale);
      setSales(updatedSales);
    }
  };

  const handleUpdateStudent = (updatedStudent: GraduationStudent) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStoredStudents(updated);
  };

  const handleRecordLiquidationSale = (liquidationSale: Sale, updatedStudent: GraduationStudent) => {
    handleUpdateStudent(updatedStudent);
    if (liquidationSale.total > 0) {
      const updatedSales = addStoredSale(liquidationSale);
      setSales(updatedSales);
    }
    setActiveStudentTicket(updatedStudent);
    setActiveSaleTicket(null);
    setAutoPrintTicket(true);
  };

  const handleSaveBrand = (newBrand: BrandConfig) => {
    setBrand(newBrand);
    saveStoredBrandConfig(newBrand);
  };

  const handleSaveGateways = (newGateways: PaymentGatewayConfig[]) => {
    setGateways(newGateways);
    saveStoredGateways(newGateways);
  };

  const handleSaveSupabase = (newConfig: SupabaseConfig) => {
    setSupabaseConfig(newConfig);
    saveStoredSupabaseConfig(newConfig);
  };

  // Permanent clear sample data
  const handleClearSampleData = async (cleanCatalogs: boolean) => {
    const result = await clearSampleDataSystem(cleanCatalogs);
    setIsSampleCleared(true);
    setStudents([]);
    setSales([]);
    setSchools([]);
    if (cleanCatalogs) {
      setProducts([]);
    }
    return result;
  };

  // Restore sample data
  const handleRestoreSampleData = () => {
    restoreSampleDataSystem();
    setIsSampleCleared(false);
    setProducts(getStoredProducts());
    setSchools(getStoredSchools());
    setStudents(getStoredStudents());
    setSales([]);
  };

  // 1. RENDER ROLE SELECTOR ON START IF LOGGED OUT
  // User Requirement:
  // "Acceso por Roles en Inicio (Cuadrícula 2 Columnas Móvil / 4 Columnas Escritorio): Selector limpio con tarjetas independientes para cada rol. Sin header, sin descripciones, solo nombre del rol."
  if (!currentRole) {
    return (
      <RoleSelector
        onSelectRole={handleSelectRole}
        brandLogo={brand.logoUrl}
      />
    );
  }

  // 2. FULLSCREEN KIOSK TOUCH POS (Hide Header, Sidebar, BottomBar completely)
  // User Requirement:
  // "Necesito que modifiques la interfaz del sistema pos.. si es necesario oculta el header, el footer, la barra de navegacion solo activa un boton para regresar al dashboard o home del cajero. basate en las imagenes que te comparto .pon botones grandes que al tocar muestran los productos variables si los hay, al final que se muestre en toda la interfaz la calculadora para poder hacer el cobro."
  if (activeTab === 'pos_cashier') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-slate-900 overflow-hidden font-sans">
        <CashierPOSView
          products={products}
          operatorName={operatorName}
          onCompleteSale={handleCompleteSale}
          onExitToDashboard={() => setActiveTab('home')}
          onSwitchRole={handleLogout}
          brandLogo={brand.logoUrl}
        />

        {/* Thermal Ticket / WhatsApp Receipt Modal */}
        <TicketModal
          sale={activeSaleTicket}
          studentTicket={activeStudentTicket}
          brand={brand}
          autoPrint={autoPrintTicket}
          onClose={() => {
            setActiveSaleTicket(null);
            setActiveStudentTicket(null);
            setAutoPrintTicket(false);
          }}
        />
      </div>
    );
  }

  // 3. MAIN DASHBOARD INTERFACE (Header, Sidebar, BottomBar for other modules)
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased">
      
      {/* Cabecera Institucional Unificada */}
      <Header
        currentRole={currentRole}
        operatorName={operatorName}
        onLogout={handleLogout}
        onClearSampleData={handleClearSampleData}
        onRestoreSampleData={handleRestoreSampleData}
        isSampleCleared={isSampleCleared}
        logoUrl={brand.logoUrl}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Menú Lateral Desplegable en Escritorio */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* Dynamic Main Workspace without duplicate horizontal tabs */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'home' && (
            <DashboardHomeView
              currentRole={currentRole}
              operatorName={operatorName}
              onSelectTab={setActiveTab}
              sales={sales}
              students={students}
              brandLogo={brand.logoUrl}
            />
          )}

          {activeTab === 'deliveries' && (
            <PackageDeliveriesView
              students={students}
              onUpdateStudent={handleUpdateStudent}
              onRecordLiquidationSale={handleRecordLiquidationSale}
              onOpenTicket={(std) => {
                setActiveStudentTicket(std);
                setActiveSaleTicket(null);
              }}
              operatorName={operatorName}
            />
          )}

          {activeTab === 'field_collector' && (
            <FieldCollectorView
              schools={schools}
              onAddStudentReceipt={handleAddStudentReceipt}
              onOpenTicket={(std) => {
                setActiveStudentTicket(std);
                setActiveSaleTicket(null);
                setAutoPrintTicket(true);
              }}
              recentStudents={students}
              operatorName={operatorName}
            />
          )}

          {activeTab === 'catalogs' && (
            <AdminCatalogsView
              products={products}
              onSaveProducts={handleSaveProducts}
            />
          )}

          {activeTab === 'schools' && (
            <AdminSchoolsView
              schools={schools}
              students={students}
              onSaveSchools={handleSaveSchools}
              onSaveStudents={handleSaveStudents}
              onOpenTicket={(std) => {
                setActiveStudentTicket(std);
                setActiveSaleTicket(null);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <AdminReportsView
              sales={sales}
              students={students}
              onOpenTicket={(sale) => {
                setActiveSaleTicket(sale);
                setActiveStudentTicket(null);
              }}
            />
          )}

          {activeTab === 'config' && (
            <AdminConfigView
              brand={brand}
              onSaveBrand={handleSaveBrand}
              gateways={gateways}
              onSaveGateways={handleSaveGateways}
              supabaseConfig={supabaseConfig}
              onSaveSupabase={handleSaveSupabase}
              onClearSampleData={handleClearSampleData}
              onRestoreSampleData={handleRestoreSampleData}
              isSampleCleared={isSampleCleared}
            />
          )}

          {activeTab === 'history' && (
            <AdminReportsView
              sales={sales}
              students={students}
              onOpenTicket={(sale) => {
                setActiveSaleTicket(sale);
                setActiveStudentTicket(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Navegación Móvil y Tablet (Bottom Bar) */}
      <BottomBar
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Thermal Ticket / WhatsApp Receipt Modal */}
      <TicketModal
        sale={activeSaleTicket}
        studentTicket={activeStudentTicket}
        brand={brand}
        autoPrint={autoPrintTicket}
        onClose={() => {
          setActiveSaleTicket(null);
          setActiveStudentTicket(null);
          setAutoPrintTicket(false);
        }}
      />
    </div>
  );
}
