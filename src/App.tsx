/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Role, 
  Product, 
  CartItem,
  School, 
  GraduationStudent, 
  Sale, 
  BrandConfig, 
  PaymentGatewayConfig, 
  SupabaseConfig,
  WorkOrder
} from './types';
import { 
  getStoredRole, 
  saveStoredRole, 
  getStoredOperator, 
  saveStoredOperator,
  getStoredActiveTab,
  saveStoredActiveTab,
  getStoredProducts, 
  saveStoredProducts,
  getDeletedProductIds,
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
  restoreSampleDataSystem,
  getStoredCategories,
  saveStoredCategories,
  getStoredWorkOrders,
  saveStoredWorkOrders,
  syncSaleToWorkOrder
} from './services/storage';

import {
  saveSaleToSupabase,
  saveStudentToSupabase,
  saveProductsBatchToSupabase,
  saveSchoolsBatchToSupabase,
  fetchProductsFromSupabase,
  fetchStudentsFromSupabase,
  fetchSalesFromSupabase,
  fetchSchoolsFromSupabase,
  fetchCategoriesFromSupabase,
  fetchWorkOrdersFromSupabase,
  saveWorkOrderToSupabase
} from './services/supabaseClient';

import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BottomBar } from './components/BottomBar';
import { TicketModal } from './components/TicketModal';

import { CashierPOSView } from './components/views/CashierPOSView';
import { WorkOrdersLabView } from './components/views/WorkOrdersLabView';
import { DashboardHomeView } from './components/views/DashboardHomeView';
import { FieldCollectorView } from './components/views/FieldCollectorView';
import { PackageDeliveriesView } from './components/views/PackageDeliveriesView';
import { AdminCatalogsView } from './components/views/AdminCatalogsView';
import { AdminSchoolsView } from './components/views/AdminSchoolsView';
import { AdminReportsView } from './components/views/AdminReportsView';
import { AdminConfigView } from './components/views/AdminConfigView';
import { UserProfileView } from './components/views/UserProfileView';
import { TabletPOSCobroView } from './components/views/TabletPOSCobroView';
import { PriceListView } from './components/views/PriceListView';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  // Session & Role state (Preserved across browser refresh)
  const [currentRole, setCurrentRole] = useState<Role | null>(() => getStoredRole());
  const [operatorName, setOperatorName] = useState<string>(() => getStoredOperator());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedTab = getStoredActiveTab() as ActiveTab | null;
    const role = getStoredRole();
    if (role === 'impresor') return 'work_orders';
    if (savedTab) return savedTab;
    if (role === 'cashier') return 'pos_cashier';
    if (role === 'laboratorio') return 'work_orders';
    if (role === 'client') return 'catalogs';
    return 'tablet_pos'; // admin and field default to tablet_pos
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const handleSelectTab = (tab: ActiveTab) => {
    let finalTab = tab;
    if ((currentRole === 'laboratorio' || currentRole === 'impresor') && (tab === 'pos_cashier' || tab === 'tablet_pos')) {
      finalTab = 'work_orders';
    }
    if (currentRole === 'impresor' && tab !== 'work_orders' && tab !== 'profile') {
      finalTab = 'work_orders';
    }
    setActiveTab(finalTab);
    saveStoredActiveTab(finalTab);
  };

  // App data states
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<GraduationStudent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [brand, setBrand] = useState<BrandConfig>(getStoredBrandConfig);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>(getStoredGateways);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isSampleCleared, setIsSampleCleared] = useState<boolean>(isSampleDataCleared);

  // Ticket modal state
  const [activeSaleTicket, setActiveSaleTicket] = useState<Sale | null>(null);
  const [activeStudentTicket, setActiveStudentTicket] = useState<GraduationStudent | null>(null);
  const [autoPrintTicket, setAutoPrintTicket] = useState<boolean>(false);
  const [pendingCartItems, setPendingCartItems] = useState<CartItem[]>([]);

  const handleGoToPOSWithItems = (items: CartItem[]) => {
    setPendingCartItems(items);
    handleSelectTab('pos_cashier');
  };

  // Load stored data on mount & background sync with Supabase
  useEffect(() => {
    setProducts(getStoredProducts());
    setSchools(getStoredSchools());
    setStudents(getStoredStudents());
    setSales(getStoredSales());
    setWorkOrders(getStoredWorkOrders());
    setBrand(getStoredBrandConfig());
    setGateways(getStoredGateways());
    setSupabaseConfig(getStoredSupabaseConfig());
    setIsSampleCleared(isSampleDataCleared());

    // Background sync work orders from Supabase if connected
    fetchWorkOrdersFromSupabase().then((remoteWo) => {
      if (remoteWo && remoteWo.length > 0) {
        setWorkOrders(remoteWo);
        saveStoredWorkOrders(remoteWo);
      }
    });

    // Background sync from Supabase if connected
    fetchProductsFromSupabase().then((remoteProds) => {
      if (remoteProds && remoteProds.length > 0) {
        const deletedIds = new Set(getDeletedProductIds());
        const filtered = remoteProds.filter((p) => !deletedIds.has(p.id));
        setProducts(filtered);
        saveStoredProducts(filtered);
      }
    });
    fetchStudentsFromSupabase().then((remoteStds) => {
      if (remoteStds && remoteStds.length > 0) {
        setStudents(remoteStds);
        saveStoredStudents(remoteStds);
      }
    });
    fetchSalesFromSupabase().then((remoteSales) => {
      if (remoteSales && remoteSales.length > 0) {
        setSales(remoteSales);
        saveStoredSales(remoteSales);
      }
    });
    fetchSchoolsFromSupabase().then((remoteSchools) => {
      if (remoteSchools && remoteSchools.length > 0) {
        setSchools(remoteSchools);
        saveStoredSchools(remoteSchools);
      }
    });
    fetchCategoriesFromSupabase().then((remoteCats) => {
      if (remoteCats && remoteCats.length > 0) {
        const localCats = getStoredCategories();
        const map = new Map(localCats.map((c) => [c.id, c]));
        remoteCats.forEach((rc) => {
          if (!map.has(rc.id)) {
            map.set(rc.id, {
              id: rc.id,
              label: rc.label,
              color: rc.color || 'text-teal-600',
              createdAt: new Date().toISOString(),
            });
          }
        });
        saveStoredCategories(Array.from(map.values()));
      }
    });
  }, []);

  // When role changes, set default active tab appropriately
  const handleSelectRole = (role: Role, opName: string) => {
    setCurrentRole(role);
    setOperatorName(opName);
    saveStoredRole(role);
    saveStoredOperator(opName);

    const savedTab = getStoredActiveTab() as ActiveTab | null;
    if (role === 'impresor') {
      handleSelectTab('work_orders');
    } else if (savedTab) {
      handleSelectTab(savedTab);
    } else if (role === 'cashier') {
      handleSelectTab('pos_cashier');
    } else if (role === 'laboratorio') {
      handleSelectTab('work_orders');
    } else if (role === 'client') {
      handleSelectTab('catalogs');
    } else {
      handleSelectTab('tablet_pos');
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    saveStoredRole(null);
  };

  // Data mutations with dual-sync: LocalStorage + Supabase
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    // Sync to Supabase
    saveProductsBatchToSupabase(newProducts);
  };

  const handleSaveSchools = (newSchools: School[]) => {
    setSchools(newSchools);
    saveStoredSchools(newSchools);
    // Sync to Supabase
    saveSchoolsBatchToSupabase(newSchools);
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
    // Sync sale to Supabase
    saveSaleToSupabase(newSale);
    // Sync sale to Work Orders (Laboratorio)
    const newWo = syncSaleToWorkOrder(newSale);
    setWorkOrders(getStoredWorkOrders());
    saveWorkOrderToSupabase(newWo);
  };

  const handleAddStudentReceipt = (newStudent: GraduationStudent) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStoredStudents(updated);
    // Sync student to Supabase
    saveStudentToSupabase(newStudent);

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
      // Sync deposit sale to Supabase
      saveSaleToSupabase(depositSale);
      // Sync to work orders
      const newWo = syncSaleToWorkOrder(depositSale);
      setWorkOrders(getStoredWorkOrders());
      saveWorkOrderToSupabase(newWo);
    }
  };

  const handleUpdateStudent = (updatedStudent: GraduationStudent) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStoredStudents(updated);
    // Sync updated student to Supabase
    saveStudentToSupabase(updatedStudent);
  };

  const handleRecordLiquidationSale = (liquidationSale: Sale, updatedStudent: GraduationStudent) => {
    handleUpdateStudent(updatedStudent);
    if (liquidationSale.total > 0) {
      const updatedSales = addStoredSale(liquidationSale);
      setSales(updatedSales);
      // Sync liquidation sale to Supabase
      saveSaleToSupabase(liquidationSale);
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
  if (!currentRole) {
    return (
      <>
        <SplashScreen minDisplayTimeMs={1200} />
        <RoleSelector
          onSelectRole={handleSelectRole}
          brandLogo={brand.logoUrl}
        />
      </>
    );
  }

  // 2. FULLSCREEN KIOSK TOUCH POS (Hide Header, Sidebar, BottomBar completely)
  if (activeTab === 'pos_cashier' && currentRole !== 'laboratorio' && currentRole !== 'impresor') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FCF9F2] text-[#202020] overflow-hidden font-sans">
        <SplashScreen minDisplayTimeMs={1200} />
        <CashierPOSView
          products={products}
          sales={sales}
          initialCart={pendingCartItems}
          onClearPendingCart={() => setPendingCartItems([])}
          operatorName={operatorName}
          onCompleteSale={handleCompleteSale}
          onExitToDashboard={() => handleSelectTab('home')}
          onSwitchRole={handleLogout}
          onNavigateToReports={() => handleSelectTab('reports')}
          onNavigateToWorkOrders={() => handleSelectTab('work_orders')}
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
    <div className="min-h-screen flex flex-col bg-[#FCF9F2] text-[#202020] font-sans antialiased">
      <SplashScreen minDisplayTimeMs={1200} />
      
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
        onOpenProfile={() => handleSelectTab('profile')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Menú Lateral Desplegable en Escritorio */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* Dynamic Main Workspace without duplicate horizontal tabs */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'work_orders' && (
            <WorkOrdersLabView
              workOrders={workOrders}
              onUpdateWorkOrders={(newOrders) => {
                setWorkOrders(newOrders);
                saveStoredWorkOrders(newOrders);
              }}
              onOpenSaleTicket={(sale) => {
                setActiveSaleTicket(sale);
                setActiveStudentTicket(null);
              }}
              brand={brand}
              currentRole={currentRole}
              operatorName={operatorName}
            />
          )}

          {activeTab === 'home' && (
            <DashboardHomeView
              currentRole={currentRole}
              operatorName={operatorName}
              onSelectTab={handleSelectTab}
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

          {activeTab === 'tablet_pos' && (
            <TabletPOSCobroView
              currentRole={currentRole}
              operatorName={operatorName}
            />
          )}

          {activeTab === 'field_collector' && (
            <TabletPOSCobroView
              currentRole={currentRole}
              operatorName={operatorName}
            />
          )}

          {activeTab === 'price_list' && (
            <PriceListView
              products={products}
              onSaveProducts={handleSaveProducts}
              currentRole={currentRole || 'admin'}
              onNavigateToPOS={() => handleSelectTab('pos_cashier')}
            />
          )}

          {activeTab === 'catalogs' && (
            <AdminCatalogsView
              products={products}
              onSaveProducts={handleSaveProducts}
              currentRole={currentRole}
              operatorName={operatorName}
              onGoToPOSWithItems={handleGoToPOSWithItems}
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

          {activeTab === 'profile' && (
            <UserProfileView
              currentRole={currentRole}
              operatorName={operatorName}
              onUpdateOperatorName={setOperatorName}
            />
          )}
        </main>
      </div>

      {/* Navegación Móvil y Tablet (Bottom Bar) */}
      <BottomBar
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
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
