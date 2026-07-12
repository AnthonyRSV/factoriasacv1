"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import styles from './page.module.css';
import {
  LayoutDashboard,
  ClipboardList,
  PackageOpen,
  BarChart3,
  Users,
  Plus,
  Factory,
  ListOrdered,
  LogOut,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Truck,
  XCircle,
  Menu,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

// Sidebar Button Component
const SidebarButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.75rem 0.875rem',
        borderRadius: '10px',
        background: active ? '#4F46E5' : 'transparent',
        color: active ? '#FFFFFF' : '#475569',
        border: 'none',
        textAlign: 'left',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#EFF6FF';
          e.currentTarget.style.color = '#2563EB';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      {React.cloneElement(icon as any, { 
        strokeWidth: 2, 
        style: { 
          ...(icon as any).props?.style, 
          color: active ? '#FFFFFF' : (icon as any).props?.style?.color || '#64748B' 
        } 
      })}
      {label}
    </button>
  );
};

// Predefined Roles for testing RBAC
const SYSTEM_USERS = [
  { name: 'Laura Vendedora', role: 'VENDEDOR', email: 'vendedor@metal.com' },
  { name: 'Manuel Jefe Taller', role: 'JEFE_TALLER', email: 'jefe@metal.com' },
  { name: 'Juan Almacenero', role: 'ALMACENERO', email: 'almacenero@metal.com' },
  { name: 'Carlos Admin', role: 'ADMIN', email: 'admin@metal.com' },
];

export default function Home() {
  // Authentication State with NextAuth
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // When session changes, update currentUser!
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setCurrentUser({
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
      });
    } else if (status === "unauthenticated") {
      setCurrentUser(null);
    }
  }, [session, status]);
  
  // Users state for Usuarios tab
  const [users, setUsers] = useState<any[]>([]);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Login State (for legacy login with email/password)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const authError = searchParams.get('authError') ?? searchParams.get('error');
    if (authError === 'not-registered' || authError === 'AccessDenied') {
      setLoginError('Este kbro no esta registrado');
    }
  }, [searchParams]);

  // Unified Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [kardex, setKardex] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Active Tab Selection
  const [activeTab, setActiveTab] = useState<string>('orders');

  // Modals & Detail Simulation State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeExternalToken, setActiveExternalToken] = useState<string | null>(null);
  const [externalOrderData, setExternalOrderData] = useState<any>(null);
  const [stageOperario, setStageOperario] = useState<{ [key: string]: string }>({});

  // Form States
  const [orderForm, setOrderForm] = useState({
    clienteNombre: '',
    tipoCliente: 'TIENDA',
    fechaComprometida: '',
    montoTotal: 0,
    montoAbonado: 0,
    metodoPago: 'EFECTIVO',
    esUrgente: false,
    productoId: '',
    largo: 0.5,
    ancho: 0.25,
    espesor: 0.01,
    forma: 'Rectangular',
    calidadAcero: 'A36',
    colorPintura: 'Ninguno',
    tuercasTipo: 'Ninguno',
    cantidadSolicitada: 10,
  });

  const [restockForm, setRestockForm] = useState({
    materiaPrimaId: '',
    cantidad: 50,
    distribuidor: 'Ansec',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // ----------------------------------------------------
  // DATA FETCHING & API INTERACTION
  // ----------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setLoginForm({ email: '', password: '' });
      } else {
        setLoginError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setLoginError('Error de red al intentar iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false }); // Don't redirect, we'll handle state
    setCurrentUser(null);
    setOrders([]);
    setMaterials([]);
    setFichas([]);
    setKardex([]);
    setReports(null);
  };


  const getHeaders = useCallback((): Record<string, string> => {
    if (!currentUser) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'x-user-role': currentUser.role,
      'x-user-email': currentUser.email,
    };
  }, [currentUser]);

  const loadData = useCallback(async () => {
    if (!currentUser) return; // Prevent fetching if not logged in
    try {
      // 1. Fetch Orders
      const ordersRes = await fetch('/api/orders', { headers: getHeaders() });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // 2. Fetch Inventory
      const invRes = await fetch('/api/inventory', { headers: getHeaders() });
      if (invRes.ok) {
        const invData = await invRes.json();
        setMaterials(invData.materials || []);
        setFichas(invData.fichas || []);
        setKardex(invData.kardex || []);
      }

      // 3. Fetch Reports (Only for ADMIN)
      if (currentUser?.role === 'ADMIN') {
        const repRes = await fetch('/api/reports', { headers: getHeaders() });
        if (repRes.ok) {
          const repData = await repRes.json();
          setReports(repData);
        }

        // 4. Fetch Users (Only for ADMIN)
        // Since there's no API yet, we'll use seed data for now
        // We'll create an API endpoint later if needed
        setUsers(SYSTEM_USERS);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [currentUser, getHeaders]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Auto-switch tabs to a valid option when role changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'VENDEDOR') {
      setActiveTab('orders');
    } else if (currentUser.role === 'JEFE_TALLER') {
      setActiveTab('production');
    } else if (currentUser.role === 'ALMACENERO') {
      setActiveTab('inventory');
    } else if (currentUser.role === 'ADMIN') {
      setActiveTab('dashboard');
      loadData();
    }
  }, [currentUser, loadData]);

  // Fetch external public view when simulated
  const handleLoadExternal = async (token: string) => {
    try {
      const res = await fetch(`/api/external/${token}`);
      if (res.ok) {
        const data = await res.json();
        setExternalOrderData(data);
        setActiveExternalToken(token);
      } else {
        alert('No se pudo encontrar el enlace público.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // CALCULATIONS (RF-11 Client Preview)
  // ----------------------------------------------------

  const getCalculatedMaterial = () => {
    if (!orderForm.productoId) return { qty: 0, unit: 'metros', material: '' };
    const p = fichas.find(ft => ft.id === orderForm.productoId);
    if (!p) return { qty: 0, unit: 'metros', material: '' };

    let qty = 0;
    const formulaObj = JSON.parse(p.formulaCalculo);
    let formulaStr = formulaObj.formula.toLowerCase();

    formulaStr = formulaStr.replace(/largo/g, orderForm.largo.toString());
    formulaStr = formulaStr.replace(/ancho/g, orderForm.ancho.toString());
    formulaStr = formulaStr.replace(/cantidad/g, orderForm.cantidadSolicitada.toString());
    formulaStr = formulaStr.replace(/espesor/g, orderForm.espesor.toString());

    try {
      qty = new Function(`return ${formulaStr}`)();
    } catch (e) {
      qty = Number(orderForm.largo) * Number(orderForm.cantidadSolicitada);
    }

    return {
      qty: parseFloat(qty.toFixed(2)),
      unit: formulaObj.unit || 'metros',
      material: p.materiaPrima ? p.materiaPrima.nombre : 'Insumo',
    };
  };

  const matPreview = getCalculatedMaterial();

  // Watch change in form to adjust base pricing automatically
  const handleFormChange = (field: string, value: any) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-pricing rules
      let basePrice = 20; // 20 soles per item
      if (updated.productoId) {
        const selectedFt = fichas.find(f => f.id === updated.productoId);
        if (selectedFt?.codigo === 'PROD-UBOLT-58') basePrice = 30;
        if (selectedFt?.codigo === 'PROD-ABRA-38') basePrice = 45;
        if (selectedFt?.codigo === 'PROD-MUELLE-ESP') basePrice = 80;
      }

      const subtotal = basePrice * updated.cantidadSolicitada;

      // Add-ons surcharges
      let extra = 0;
      if (updated.colorPintura && updated.colorPintura !== 'Ninguno') extra += 5 * updated.cantidadSolicitada;
      if (updated.tuercasTipo && updated.tuercasTipo !== 'Ninguno') extra += 8 * updated.cantidadSolicitada;

      updated.montoTotal = subtotal + extra;

      // If external client is selected, default to paying 50% abono
      if (updated.clienteNombre.toLowerCase() !== 'tienda') {
        updated.montoAbonado = parseFloat((updated.montoTotal * 0.50).toFixed(2));
      } else {
        updated.montoAbonado = updated.montoTotal; // store clients pay 100%
      }

      return updated;
    });
  };

  // Check workshop capacity to notify seller about extra costs (RF-10)
  const isWorkshopAtCapacity = orders.filter(o => o.estado === 'APROBADA').length >= 5;

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!orderForm.clienteNombre) {
      setFormError('Debe ingresar el nombre del cliente.');
      return;
    }
    if (!orderForm.productoId) {
      setFormError('Debe seleccionar un producto de la ficha técnica.');
      return;
    }
    if (!orderForm.fechaComprometida) {
      setFormError('Debe definir la fecha comprometida de entrega.');
      return;
    }

    try {
      const payload = {
        clienteNombre: orderForm.clienteNombre,
        tipoCliente: orderForm.tipoCliente,
        fechaComprometida: orderForm.fechaComprometida,
        montoTotal: orderForm.montoTotal,
        montoAbonado: orderForm.montoAbonado,
        metodoPago: orderForm.metodoPago,
        esUrgente: orderForm.esUrgente,
        detalles: [{
          productoId: orderForm.productoId,
          largo: Number(orderForm.largo),
          ancho: Number(orderForm.ancho),
          espesor: Number(orderForm.espesor),
          forma: orderForm.forma,
          calidadAcero: orderForm.calidadAcero,
          colorPintura: orderForm.colorPintura !== 'Ninguno' ? orderForm.colorPintura : undefined,
          tuercasTipo: orderForm.tuercasTipo !== 'Ninguno' ? orderForm.tuercasTipo : undefined,
          cantidadSolicitada: Number(orderForm.cantidadSolicitada),
        }]
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setFormSuccess(`Orden #${result.codigoCorrelativoUnico} creada exitosamente. Estado: ${result.estado}.`);
        loadData();
        // Reset form
        setOrderForm({
          clienteNombre: '',
          tipoCliente: 'TIENDA',
          fechaComprometida: '',
          montoTotal: 0,
          montoAbonado: 0,
          metodoPago: 'EFECTIVO',
          esUrgente: false,
          productoId: '',
          largo: 0.5,
          ancho: 0.25,
          espesor: 0.01,
          forma: 'Rectangular',
          calidadAcero: 'A36',
          colorPintura: 'Ninguno',
          tuercasTipo: 'Ninguno',
          cantidadSolicitada: 10,
        });
      } else {
        setFormError(result.error || 'No se pudo crear la orden.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de red.');
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ estado: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        loadData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModifyOrder = async (orderId: string, color: string, nuts: string, date: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          colorPintura: color,
          tuercasTipo: nuts,
          fechaComprometida: date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Orden modificada correctamente.');
        loadData();
        setSelectedOrder(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (stageId: string, currentOrder: any, completed: boolean) => {
    const op = stageOperario[stageId] || '';
    try {
      const res = await fetch(`/api/stages/${stageId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ completada: completed, operarioAsignado: op }),
      });
      if (res.ok) {
        loadData();
        // Update selection details
        const updatedOrdRes = await fetch(`/api/orders/${currentOrder.id}`, { headers: getHeaders() });
        if (updatedOrdRes.ok) {
          const updatedOrd = await updatedOrdRes.json();
          setSelectedOrder(updatedOrd);
        }
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!restockForm.materiaPrimaId) {
      setFormError('Seleccione la materia prima a reabastecer.');
      return;
    }

    try {
      const selectedMat = materials.find(m => m.id === restockForm.materiaPrimaId);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          materiaPrimaId: restockForm.materiaPrimaId,
          cantidad: Number(restockForm.cantidad),
          motivo: `Ingreso mensual de material. Distribuidor: ${restockForm.distribuidor}`,
        }),
      });

      if (res.ok) {
        setFormSuccess(`Se ingresaron ${restockForm.cantidad} unidades de ${selectedMat.nombre} exitosamente.`);
        loadData();
        setRestockForm(prev => ({ ...prev, materiaPrimaId: '' }));
      } else {
        const err = await res.json();
        setFormError(err.error || 'Error al reabastecer.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de red.');
    }
  };

  const handleAuthorizeRelease = async (orderId: string) => {
    try {
      const res = await fetch('/api/inventory/authorize', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ordenId: orderId }),
      });
      if (res.ok) {
        alert('Salida física del material autorizada correctamente.');
        loadData();
        const updatedOrdRes = await fetch(`/api/orders/${orderId}`, { headers: getHeaders() });
        if (updatedOrdRes.ok) {
          setSelectedOrder(await updatedOrdRes.json());
        }
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // INTERFACE RENDERING HELPERS
  // ----------------------------------------------------

  const getStageDotClass = (stage: any) => {
    return stage.completada ? 'progressDot progressDotDone' : 'progressDot';
  };

  const canCancelOrder = (order: any) => {
    if (order.estado === 'CANCELADA' || order.estado === 'ENTREGADA') return false;
    const creationTime = new Date(order.creadoEn).getTime();
    const oneHour = 60 * 60 * 1000;
    const hasStarted = order.procesos?.some((p: any) => p.completada);
    return (Date.now() - creationTime <= oneHour) && !hasStarted;
  };

  if (!currentUser) {
    return (
      <div className={styles.authScreen}>
        {/* Left Side: Representative Image */}
        <div className={styles.authHero}>
          <div className={styles.authHeroCard}>
            <h2 style={{ color: '#1d4ed8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Factoría Sánchez
            </h2>
            <p style={{ color: '#2563eb', fontSize: '0.95rem' }}>
              "Si no lo tenemos en Sánchez, lo hacemos". <br /><br />
              Sistema de gestión integral operativa para líderes en fabricación metal-mecánica y distribución de autopartes para vehículos pesados y agroindustria.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className={styles.authFormWrap}>
          <div className={styles.authCard}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '100px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 800 }}>Factoría Sánchez</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Ingreso Seguro al Sistema Central</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="formGroup" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="Ingrese su correo electrónico..."
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={{ padding: '0.9rem 1rem', borderRadius: '10px', fontSize: '0.95rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="formGroup" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingrese su contraseña..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={{ padding: '0.9rem 3rem 0.9rem 1rem', borderRadius: '10px', fontSize: '0.95rem', background: '#f8fafc', border: '1px solid #e2e8f0', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ padding: '1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}>{loginError}</span>
                </div>
              )}

              <button type="submit" className="btn btnPrimary" disabled={isLoggingIn} style={{ padding: '1rem', marginTop: '0.5rem', fontWeight: 'bold', borderRadius: '10px', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)' }}>
                {isLoggingIn ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>
            
            {/* Divider */}
            <div className={styles.dividerCompact} style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>o inicia sesión con</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            
            {/* Google Sign In Button */}
            <button
              onClick={() => signIn('google')}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#475569',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              {/* Google G Icon */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.32 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#4285F4" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', position: 'relative' }}>
      {/* Mobile overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          display: (isMobile && isMobileSidebarOpen) ? 'block' : 'none',
          flexDirection: 'column'
        }}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        style={{
          width: '260px',
          background: '#FFFFFF',
          color: '#1E293B',
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          zIndex: 50,
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isMobileSidebarOpen ? '0' : '-260px') : '0',
          top: 0,
          bottom: 0,
          transition: 'left 0.2s ease, transform 0.2s ease'
        }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
              <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
                // Fallback to Factory icon if logo not found
                const fallback = document.createElement('div');
                fallback.innerHTML = '<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#4F46E5;border-radius:8px;color:white;font-size:18px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 7h18"></path><path d="M5 7l1 14"></path><path d="M19 7l-1 14"></path><path d="M8 7l1 14"></path><path d="M16 7l-1 14"></path><path d="M12 3l-1 4"></path><path d="M12 3l1 4"></path><path d="M9 11h6"></path><path d="M9 15h6"></path></svg></div>';
                e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget.nextSibling);
              }} />
              <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>Factoría Sánchez</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, paddingLeft: '3rem' }}>Sistema de Gestión</p>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#475569'
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Admin Links */}
          {currentUser.role === 'ADMIN' && (
            <>
              <SidebarButton
                active={activeTab === 'dashboard'}
                icon={<LayoutDashboard size={18} strokeWidth={2} />}
                label="Dashboard"
                onClick={() => setActiveTab('dashboard')}
              />
              <SidebarButton
                active={activeTab === 'orders'}
                icon={<ClipboardList size={18} strokeWidth={2} />}
                label="Órdenes"
                onClick={() => setActiveTab('orders')}
              />
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Inventario Dual"
                onClick={() => setActiveTab('inventory')}
              />
              <SidebarButton
                active={activeTab === 'reports'}
                icon={<BarChart3 size={18} strokeWidth={2} />}
                label="Reportes Técnicos"
                onClick={() => setActiveTab('reports')}
              />
              <SidebarButton
                active={activeTab === 'users'}
                icon={<Users size={18} strokeWidth={2} />}
                label="Usuarios"
                onClick={() => setActiveTab('users')}
              />
            </>
          )}

          {/* Vendedor Links */}
          {currentUser.role === 'VENDEDOR' && (
            <>
              <SidebarButton
                active={activeTab === 'orders'}
                icon={<ClipboardList size={18} strokeWidth={2} />}
                label="Ver Órdenes"
                onClick={() => setActiveTab('orders')}
              />
              <SidebarButton
                active={activeTab === 'new_order'}
                icon={<Plus size={18} strokeWidth={2} />}
                label="Nueva Cotización"
                onClick={() => { setActiveTab('new_order'); setFormError(null); setFormSuccess(null); }}
              />
            </>
          )}

          {/* Jefe Taller Links */}
          {currentUser.role === 'JEFE_TALLER' && (
            <>
              <SidebarButton
                active={activeTab === 'production'}
                icon={<Factory size={18} strokeWidth={2} />}
                label="Líneas de Fabricación"
                onClick={() => setActiveTab('production')}
              />
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Stock Insumos"
                onClick={() => setActiveTab('inventory')}
              />
            </>
          )}

          {/* Almacenero Links */}
          {currentUser.role === 'ALMACENERO' && (
            <>
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Inventario Dual"
                onClick={() => setActiveTab('inventory')}
              />
              <SidebarButton
                active={activeTab === 'kardex'}
                icon={<ListOrdered size={18} strokeWidth={2} />}
                label="Kardex de Movimientos"
                onClick={() => setActiveTab('kardex')}
              />
              <SidebarButton
                active={activeTab === 'restock'}
                icon={<ShoppingCart size={18} strokeWidth={2} />}
                label="Ingresar Compra"
                onClick={() => { setActiveTab('restock'); setFormError(null); setFormSuccess(null); }}
              />
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#FFFFFF'
            }}>
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</p>
              <span style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>{currentUser.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.7rem 0.875rem',
              borderRadius: '10px',
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FECACA';
              e.currentTarget.style.color = '#B91C1C';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.color = '#DC2626';
            }}
          >
            <LogOut size={18} strokeWidth={2} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>
        {/* Top bar with hamburger menu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          gap: '1rem'
        }}>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          {/* Mobile logo and name in top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>Factoría Sánchez</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sistema de Gestión</span>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          {/* Header Area */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#1e293b' }}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'orders' && 'Órdenes'}
                {activeTab === 'inventory' && 'Inventario Dual'}
                {activeTab === 'reports' && 'Reportes Técnicos'}
                {activeTab === 'users' && 'Usuarios'}
                {activeTab === 'new_order' && 'Nueva Cotización'}
                {activeTab === 'production' && 'Líneas de Fabricación'}
                {activeTab === 'kardex' && 'Kardex de Movimientos'}
                {activeTab === 'restock' && 'Ingresar Compra'}
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                Bienvenido al sistema de gestión de Factoría Sánchez
              </p>
            </div>
          </header>

        {/* Global Notifications */}
        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span style={{ color: '#991b1b', fontWeight: 500 }}><strong>Error:</strong> {formError}</span>
          </div>
        )}
        {formSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span style={{ color: '#166534', fontWeight: 500 }}><strong>Éxito:</strong> {formSuccess}</span>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: DASHBOARD (Admin View)
            ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Órdenes Totales</span>
                  <div style={{ 
                    background: 'rgba(79,70,229,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <ClipboardList size={18} style={{ color: '#4F46E5' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{orders.length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Ordenes Pendientes</span>
                  <div style={{ 
                    background: 'rgba(251,191,36,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <AlertCircle size={18} style={{ color: '#F59E0B' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{orders.filter(o => o.estado === 'PENDIENTE_PAGO').length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Productos en Inventario</span>
                  <div style={{ 
                    background: 'rgba(16,185,129,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <PackageOpen size={18} style={{ color: '#10B981' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{materials.length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Usuarios Activos</span>
                  <div style={{ 
                    background: 'rgba(79,70,229,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <Users size={18} style={{ color: '#4F46E5' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{users.length}</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div style={{ 
              background: '#FFFFFF', 
              padding: '1.25rem', 
              borderRadius: '10px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Órdenes Recientes</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Código</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Estado</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#1E293B', fontSize: '0.85rem' }}>Orden {order.codigoCorrelativoUnico}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#475569', fontSize: '0.85rem' }}>{order.clienteNombre}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: order.estado === 'APROBADA' ? '#DCFCE7' : 
                                       order.estado === 'TERMINADA' ? '#E0F2FE' :
                                       order.estado === 'ENTREGADA' ? '#FEF3C7' : '#FEE2E2',
                            color: order.estado === 'APROBADA' ? '#16A34A' :
                                       order.estado === 'TERMINADA' ? '#0369A1' :
                                       order.estado === 'ENTREGADA' ? '#B45309' : '#DC2626'
                          }}>
                            {order.estado === 'PENDIENTE_PAGO' && <AlertCircle size={12} />}
                            {order.estado === 'APROBADA' && <CheckCircle2 size={12} />}
                            {order.estado === 'TERMINADA' && <CheckCircle2 size={12} />}
                            {order.estado === 'ENTREGADA' && <Truck size={12} />}
                            {order.estado === 'CANCELADA' && <XCircle size={12} />}
                            {order.estado}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>S/. {order.montoTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: USUARIOS (Admin View)
            ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div style={{ 
            background: '#FFFFFF', 
            padding: '1.25rem', 
            borderRadius: '10px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Lista de Usuarios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {users.map((user) => (
                <div key={user.email} style={{
                  padding: '1rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  background: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.25rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontWeight: 700
                    }}>
                      {user.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: 'rgba(79,70,229,0.1)',
                        color: '#4F46E5',
                        marginTop: '0.2rem'
                      }}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    {user.email}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: ORDERS (Seller & Admin View)
            ---------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>Historial de Órdenes de Fabricación</h3>
                {currentUser.role === 'VENDEDOR' && (
                  <button className="btn btnPrimary" onClick={() => setActiveTab('new_order')}>+ Crear Cotización</button>
                )}
              </div>

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Cód. Correlativo</th>
                      <th>Cliente</th>
                      <th>Cometido Entrega</th>
                      <th>Monto Total</th>
                      <th>Monto Abonado</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Enlace Externo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay órdenes de fabricación registradas.</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>Orden {order.codigoCorrelativoUnico}</strong></td>
                          <td>
                            {order.clienteNombre}
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.4rem' }}>
                              ({order.tipoCliente})
                            </span>
                          </td>
                          <td>{new Date(order.fechaComprometida).toLocaleDateString('es-PE')}</td>
                          <td>S/. {order.montoTotal}</td>
                          <td>S/. {order.montoAbonado}</td>
                          <td>
                            <span className={`badge ${order.estado === 'PENDIENTE_PAGO' ? 'badgePendiente' :
                              order.estado === 'APROBADA' ? 'badgeAprobada' :
                                order.estado === 'TERMINADA' ? 'badgeTerminada' :
                                  order.estado === 'ENTREGADA' ? 'badgeEntregada' : 'badgeCancelada'
                              }`}>
                              {order.estado}
                            </span>
                          </td>
                          <td>
                            {order.esUrgente ? (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>URGENTE</span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>Normal</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btnSecondary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => handleLoadExternal(order.tokenConsulta)}
                            >
                              🔗 Compartir
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="btn btnSecondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => setSelectedOrder(order)}
                              >
                                Ver Ficha
                              </button>

                              {currentUser.role === 'VENDEDOR' && order.estado === 'PENDIENTE_PAGO' && (
                                <button
                                  className="btn btnSuccess"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => handleStatusTransition(order.id, 'APROBADA')}
                                >
                                  Aprobar Pago
                                </button>
                              )}

                              {currentUser.role === 'VENDEDOR' && order.estado === 'TERMINADA' && (
                                <button
                                  className="btn btnPrimary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => handleStatusTransition(order.id, 'ENTREGADA')}
                                >
                                  Entregar
                                </button>
                              )}

                              {canCancelOrder(order) && (
                                <button
                                  className="btn btnDanger"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => handleStatusTransition(order.id, 'CANCELADA')}
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: NEW ORDER (Seller View)
            ---------------------------------------------------- */}
        {activeTab === 'new_order' && (
          <div className="tabContent">
            <div className="grid2">
              <div className="card">
                <h3>Cotización y Características Físicas</h3>
                <form onSubmit={handleCreateOrderSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="formRow">
                    <div className="formGroup">
                      <label>Nombre del Cliente</label>
                      <input
                        type="text"
                        value={orderForm.clienteNombre}
                        placeholder="Ej. Consorcio Damper"
                        onChange={(e) => handleFormChange('clienteNombre', e.target.value)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Tipo de Cliente</label>
                      <select
                        value={orderForm.tipoCliente}
                        onChange={(e) => handleFormChange('tipoCliente', e.target.value)}
                      >
                        <option value="TIENDA">Cliente Tienda (Venta Directa)</option>
                        <option value="EMPRESA">Empresa Externa</option>
                      </select>
                    </div>
                  </div>

                  <div className="formGroup">
                    <label>Producto de Ficha Técnica</label>
                    <select
                      value={orderForm.productoId}
                      onChange={(e) => handleFormChange('productoId', e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      {fichas.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre} ({f.codigo})</option>
                      ))}
                    </select>
                  </div>

                  {/* Physical specs (RF-02) */}
                  <div className="formRow">
                    <div className="formGroup">
                      <label>Largo (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.largo}
                        onChange={(e) => handleFormChange('largo', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Ancho (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.ancho}
                        onChange={(e) => handleFormChange('ancho', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Espesor (pulg/mm)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={orderForm.espesor}
                        onChange={(e) => handleFormChange('espesor', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Forma Física</label>
                      <input
                        type="text"
                        value={orderForm.forma}
                        placeholder="Ej. U-Form / Circular"
                        onChange={(e) => handleFormChange('forma', e.target.value)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Calidad del Acero</label>
                      <select
                        value={orderForm.calidadAcero}
                        onChange={(e) => handleFormChange('calidadAcero', e.target.value)}
                      >
                        <option value="A36">A36 (Acero Dulce)</option>
                        <option value="1045">1045 (Medio Carbono)</option>
                        <option value="BCL">BCL (Muelle Especial)</option>
                      </select>
                    </div>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Color de Pintura (Opcional)</label>
                      <input
                        type="text"
                        value={orderForm.colorPintura}
                        onChange={(e) => handleFormChange('colorPintura', e.target.value)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Tipo de Tuercas / Arandelas (Opcional)</label>
                      <input
                        type="text"
                        value={orderForm.tuercasTipo}
                        onChange={(e) => handleFormChange('tuercasTipo', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Cantidad Solicitada</label>
                      <input
                        type="number"
                        value={orderForm.cantidadSolicitada}
                        onChange={(e) => handleFormChange('cantidadSolicitada', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Fecha Prometida de Entrega</label>
                      <input
                        type="date"
                        value={orderForm.fechaComprometida}
                        onChange={(e) => handleFormChange('fechaComprometida', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="formRow" style={{ alignItems: 'center', margin: '0.5rem 0 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="urgente"
                        checked={orderForm.esUrgente}
                        onChange={(e) => handleFormChange('esUrgente', e.target.checked)}
                      />
                      <label htmlFor="urgente" style={{ color: orderForm.esUrgente ? 'var(--color-danger)' : 'inherit', cursor: 'pointer' }}>
                        💥 ¿Marcar como Pedido URGENTE?
                      </label>
                    </div>
                  </div>

                  {isWorkshopAtCapacity && orderForm.esUrgente && (
                    <div className="alertBanner" style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
                      <span>⚠️ Taller al límite de capacidad. Se aplicará un 15% de recargo por concepto de horas extras automáticas.</span>
                    </div>
                  )}

                  <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                  {/* Payment policies (RF-06) */}
                  <div className="formRow">
                    <div className="formGroup">
                      <label>Precio Total Calculado</label>
                      <input
                        type="text"
                        readOnly
                        value={`S/. ${orderForm.montoTotal + (orderForm.esUrgente && isWorkshopAtCapacity ? orderForm.montoTotal * 0.15 : 0)}`}
                        style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Abono Inicial del Pago</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.montoAbonado}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, montoAbonado: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Método de Pago</label>
                      <select
                        value={orderForm.metodoPago}
                        onChange={(e) => handleFormChange('metodoPago', e.target.value)}
                      >
                        <option value="EFECTIVO">Efectivo en Tienda</option>
                        <option value="TRANSFERENCIA_BANCARIA">Transferencia / Bancarizado</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Generar Órden de Fabricación
                  </button>
                </form>
              </div>

              {/* Live Preview (RF-11) */}
              <div className="card" style={{ alignSelf: 'start' }}>
                <h3>Ficha Técnica & Cálculo de Material</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Cálculo automático según dimensiones ingresadas en tiempo real</p>

                {orderForm.productoId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Fórmula Asociada:</span>
                      <p style={{ fontSize: '1rem', color: 'var(--color-text-primary)', margin: '0.2rem 0' }}>
                        {orderForm.productoId && JSON.parse(fichas.find(f => f.id === orderForm.productoId)?.formulaCalculo || '{}').formula}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {orderForm.productoId && JSON.parse(fichas.find(f => f.id === orderForm.productoId)?.formulaCalculo || '{}').desc}
                      </span>
                    </div>

                    <div style={{ padding: '1rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Materia prima requerida:</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{matPreview.material}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total material a descontar:</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{matPreview.qty} {matPreview.unit}</p>
                      </div>
                      <div style={{ alignSelf: 'center', fontSize: '2rem' }}>📐</div>
                    </div>

                    <div className="alertBanner alertBannerInfo" style={{ fontSize: '0.8rem', padding: '0.6rem', margin: 0 }}>
                      <span>💡 <strong>Deducción Transaccional:</strong> Este material será debitado automáticamente de la tabla <code>materia_prima</code> y registrado en el Kardex al aprobarse la orden.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    <span>Seleccione un producto en la cotización izquierda para visualizar la ficha técnica automatizada.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: PRODUCTION LINE / KANBAN (Workshop view)
            ---------------------------------------------------- */}
        {activeTab === 'production' && (
          <div className="tabContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Organizador Diario de Fabricación (Jefe de Planta)</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Filtro: Ordenado por Urgencia y Fecha Comprometida</span>
            </div>

            {/* Kanban representation of orders */}
            <div className="kanbanBoard">
              {['PENDIENTE_PAGO', 'APROBADA', 'TERMINADA', 'ENTREGADA', 'CANCELADA'].map((status) => {
                const colOrders = orders
                  .filter(o => o.estado === status)
                  .sort((a, b) => {
                    if (a.esUrgente && !b.esUrgente) return -1;
                    if (!a.esUrgente && b.esUrgente) return 1;
                    return new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime();
                  });

                return (
                  <div key={status} className="kanbanColumn">
                    <div className="kanbanColHeader">
                      <span className="kanbanColTitle">
                        {status === 'PENDIENTE_PAGO' ? '⏳ Espera Abono' :
                          status === 'APROBADA' ? '🚀 Fabricación' :
                            status === 'TERMINADA' ? '📦 Completadas' :
                              status === 'ENTREGADA' ? '✅ Entregado' : '❌ Cancelado'}
                      </span>
                      <span className="kanbanCount">{colOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
                      {colOrders.length === 0 ? (
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          Sin órdenes
                        </div>
                      ) : (
                        colOrders.map(o => (
                          <div
                            key={o.id}
                            className={`kanbanCard ${o.esUrgente ? 'kanbanCardUrgente' : ''}`}
                            onClick={() => setSelectedOrder(o)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Orden #{o.codigoCorrelativoUnico}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(o.fechaComprometida).toLocaleDateString('es-PE')}</span>
                            </div>

                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {o.clienteNombre}
                            </p>

                            <div style={{ margin: '0.4rem 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                              {o.detalles && o.detalles[0] ? (
                                <span>{o.detalles[0].cantidadSolicitada}x {o.detalles[0].producto.nombre}</span>
                              ) : 'Sin especificaciones'}
                            </div>

                            {/* RF-07: Process stages completed display */}
                            {o.estado === 'APROBADA' && o.procesos && (
                              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  {o.procesos.map((stage: any) => (
                                    <span
                                      key={stage.id}
                                      className={getStageDotClass(stage)}
                                      title={`${stage.etapaNombre}: ${stage.completada ? 'Completado' : 'Pendiente'}`}
                                    />
                                  ))}
                                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '0.2rem' }}>
                                    {o.procesos.filter((p: any) => p.completada).length}/4 Etapas
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: DUAL INVENTORY (Almacenero, Jefe, Admin view)
            ---------------------------------------------------- */}
        {activeTab === 'inventory' && (
          <div className="tabContent">
            <div className="grid2">
              {/* Production stock */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3>Inventario de Insumos (Producción)</h3>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Control de Materia Prima</span>
                </div>

                <div className="tableContainer">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre / Descripción</th>
                        <th>Tipo</th>
                        <th>Medidas</th>
                        <th>Stock Actual</th>
                        <th>Mínimo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.filter(m => !m.codigo.startsWith('COM-')).map((mat) => {
                        const isLow = mat.stockActual <= mat.stockMinimo;
                        return (
                          <tr key={mat.id} className={isLow ? 'stockLow' : ''}>
                            <td><code>{mat.codigo}</code></td>
                            <td><strong>{mat.nombre}</strong></td>
                            <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>{mat.tipo}</span></td>
                            <td>
                              {mat.diametro ? `Ø ${mat.diametro}"` : ''}
                              {mat.espesor ? ` Esp. ${mat.espesor}"` : ''}
                              {!mat.diametro && !mat.espesor ? 'N/A' : ''}
                            </td>
                            <td><strong>{mat.stockActual.toFixed(2)}</strong></td>
                            <td>{mat.stockMinimo.toFixed(2)}</td>
                            <td>
                              {isLow ? (
                                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', fontWeight: 'bold' }}>Alerta Minimo</span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}>Suficiente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial stock */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3>Inventario Comercial (Venta Directa)</h3>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Productos Estandarizados</span>
                </div>

                <div className="tableContainer">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre Producto</th>
                        <th>Stock Tienda</th>
                        <th>Mínimo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.filter(m => m.codigo.startsWith('COM-')).map((mat) => {
                        const isLow = mat.stockActual <= mat.stockMinimo;
                        return (
                          <tr key={mat.id} className={isLow ? 'stockLow' : ''}>
                            <td><code>{mat.codigo}</code></td>
                            <td><strong>{mat.nombre}</strong></td>
                            <td><strong>{mat.stockActual.toFixed(2)}</strong></td>
                            <td>{mat.stockMinimo.toFixed(2)}</td>
                            <td>
                              {isLow ? (
                                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>Bajo</span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}>Disponible</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: KARDEX MOVEMENTS (Almacenero view)
            ---------------------------------------------------- */}
        {activeTab === 'kardex' && (
          <div className="tabContent">
            <div className="card">
              <h3>Libro del Kardex de Inventario</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Historial transaccional auditable de movimientos en el almacén</p>

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha Registro</th>
                      <th>Material / Insumo</th>
                      <th>Movimiento</th>
                      <th>Cantidad</th>
                      <th>Motivo del Registro</th>
                      <th>Usuario Encargado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kardex.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay registros de inventario.</td>
                      </tr>
                    ) : (
                      kardex.map((kdx) => (
                        <tr key={kdx.id}>
                          <td>{new Date(kdx.creadoEn).toLocaleString('es-PE')}</td>
                          <td>
                            <strong>{kdx.materiaPrima?.nombre}</strong>
                            <br />
                            <code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kdx.materiaPrima?.codigo}</code>
                          </td>
                          <td>
                            <span className={`badge ${kdx.tipoMovimiento === 'INGRESO' ? 'badgeEntregada' : 'badgeCancelada'}`}>
                              {kdx.tipoMovimiento}
                            </span>
                          </td>
                          <td><strong>{kdx.cantidad}</strong></td>
                          <td>{kdx.motivo}</td>
                          <td>{kdx.usuario ? kdx.usuario.name : 'Sistema (Automático)'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: RESTOCK PURCHASE (Almacenero view)
            ---------------------------------------------------- */}
        {activeTab === 'restock' && (
          <div className="tabContent">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Registrar Ingreso de Compra Mensual</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Actualiza el stock e inserta la trazabilidad en la auditoría del Kardex</p>

              <form onSubmit={handleRestockSubmit}>
                <div className="formGroup">
                  <label>Materia Prima / Insumo</label>
                  <select
                    value={restockForm.materiaPrimaId}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, materiaPrimaId: e.target.value }))}
                  >
                    <option value="">-- Seleccionar Item --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} (Stock actual: {m.stockActual})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label>Cantidad Adquirida</label>
                  <input
                    type="number"
                    value={restockForm.cantidad}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, cantidad: Number(e.target.value) || 0 }))}
                  />
                </div>

                <div className="formGroup">
                  <label>Distribuidor Proveedor</label>
                  <select
                    value={restockForm.distribuidor}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, distribuidor: e.target.value }))}
                  >
                    <option value="Ansec">Ansec S.A.C.</option>
                    <option value="Metal Mark">Metal Mark</option>
                    <option value="Comercial RC">Comercial RC</option>
                  </select>
                </div>

                <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Guardar en Almacén & Log Kardex
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB: ADMIN TECHNICAL REPORTS (Admin view)
            ---------------------------------------------------- */}
        {activeTab === 'reports' && reports && (
          <div className="tabContent">
            <div className="grid3" style={{ marginBottom: '1.5rem' }}>
              <div className="card metricCard">
                <span className="metricTitle">Órdenes Pendientes</span>
                <p className="metricValue">{reports.pendingOrdersCount}</p>
                <p style={{ fontSize: '0.8rem' }}>En cola y fabricación activa</p>
              </div>
              <div className="card metricCard">
                <span className="metricTitle">Órdenes Entregadas</span>
                <p className="metricValue" style={{ color: 'var(--color-success)' }}>{reports.deliveredOrdersCount}</p>
                <p style={{ fontSize: '0.8rem' }}>Facturadas y despachadas</p>
              </div>
              <div className="card metricCard">
                <span className="metricTitle">Velocidad Promedio</span>
                <p className="metricValue" style={{ color: 'var(--color-secondary)' }}>
                  {reports.avgHours > 0 ? `${reports.avgHours} hrs` : '0.0 hrs'}
                </p>
                <p style={{ fontSize: '0.8rem' }}>Desde creación hasta entrega</p>
              </div>
            </div>

            <div className="grid2">
              {/* Product rankings chart */}
              <div className="card">
                <h3>Ranking de Productos Más Fabricados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                  {reports.ranking && reports.ranking.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No hay datos suficientes.</p>
                  ) : (
                    reports.ranking?.map((item: any) => (
                      <div key={item.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span>{item.name}</span>
                          <strong>{item.value} unidades</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', width: `${Math.min(100, (item.value / 150) * 100)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Material consumption ranking */}
              <div className="card">
                <h3>Consumo Detallado de Materia Prima (Kardex)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                  {reports.consumption && reports.consumption.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No hay movimientos de egreso aún.</p>
                  ) : (
                    reports.consumption?.map((item: any) => (
                      <div key={item.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span>{item.name}</span>
                          <strong>{item.value.toFixed(1)} metros</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-accent), #2dd4bf)', width: `${Math.min(100, (item.value / 200) * 100)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            OVERLAY / SIMULATED MODAL: ORDER DETAILS
            ---------------------------------------------------- */}
        {selectedOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <h4>Ficha de Producción: Orden #{selectedOrder.codigoCorrelativoUnico}</h4>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedOrder(null)}>✕ Cerrar</button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p><strong>Cliente:</strong> {selectedOrder.clienteNombre} ({selectedOrder.tipoCliente})</p>
                  <p><strong>Fecha Comprometida:</strong> {new Date(selectedOrder.fechaComprometida).toLocaleDateString('es-PE')}</p>
                  <p><strong>Monto Facturado:</strong> S/. {selectedOrder.montoTotal} {selectedOrder.cargoUrgencia > 0 && `(Inc. recargo S/. ${selectedOrder.cargoUrgencia} por urgencia)`}</p>
                  <p><strong>Monto Abonado:</strong> S/. {selectedOrder.montoAbonado}</p>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <p><strong>Metodo Pago:</strong> {selectedOrder.metodoPago}</p>
                  <p><strong>Estado:</strong> <span className="badge badgeAprobada" style={{ padding: '0.1rem 0.4rem' }}>{selectedOrder.estado}</span></p>
                  <p><strong>Fecha Registro:</strong> {new Date(selectedOrder.creadoEn).toLocaleString()}</p>
                  <p><strong>Autorización de Salida:</strong> {selectedOrder.salidaAutorizada ? `✅ Autorizado por ${selectedOrder.salidaAutorizada.jefeTaller?.name}` : '❌ Pendiente Autorizar'}</p>
                </div>
              </div>

              {/* Physical specifications */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h5 style={{ marginBottom: '0.5rem' }}>Detalle de Producto</h5>
                {selectedOrder.detalles?.map((d: any) => (
                  <div key={d.id} style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <p><strong>Producto:</strong> {d.producto?.nombre}</p>
                    <p><strong>Cantidad:</strong> {d.cantidadSolicitada} unidades</p>
                    <p><strong>Largo:</strong> {d.largo} m</p>
                    <p><strong>Ancho:</strong> {d.ancho} m</p>
                    <p><strong>Espesor:</strong> {d.espesor} pulg/mm</p>
                    <p><strong>Calidad Acero:</strong> {d.calidadAcero}</p>
                    {d.colorPintura && <p><strong>Pintura:</strong> {d.colorPintura}</p>}
                    {d.tuercasTipo && <p><strong>Tuercas:</strong> {d.tuercasTipo}</p>}
                  </div>
                ))}
              </div>

              {/* Process line (RF-07) */}
              {selectedOrder.estado !== 'PENDIENTE_PAGO' && selectedOrder.procesos && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Línea de Proceso y Operarios</h5>
                  <div className="progressList">
                    {selectedOrder.procesos.map((stage: any) => {
                      const isJefe = currentUser.role === 'JEFE_TALLER' || currentUser.role === 'ADMIN';
                      return (
                        <div key={stage.id} className={`progressItem ${stage.completada ? 'progressItemDone' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={getStageDotClass(stage)} />
                            <span><strong>{stage.etapaNombre}</strong> (Paso {stage.ordenSecuencia})</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {stage.completada ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Realizado por: <strong>{stage.operarioAsignado || 'Operario'}</strong>
                              </span>
                            ) : isJefe ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <input
                                  type="text"
                                  placeholder="Operario"
                                  value={stageOperario[stage.id] || stage.operarioAsignado || ''}
                                  onChange={(e) => setStageOperario(prev => ({ ...prev, [stage.id]: e.target.value }))}
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '100px' }}
                                />
                                <button
                                  className="btn btnSuccess"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleUpdateStage(stage.id, selectedOrder, true)}
                                >
                                  Listo
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pendiente</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modify Order Form (RF-03: Vendedor or Jefe) */}
              {(currentUser.role === 'VENDEDOR' || currentUser.role === 'JEFE_TALLER') && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Modificar Parámetros de Orden</h5>
                  <div className="formRow" style={{ gap: '0.5rem' }}>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Color Pintura</label>
                      <input
                        type="text"
                        id="modColor"
                        defaultValue={selectedOrder.detalles?.[0]?.colorPintura || ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Tuercas/Accesorios</label>
                      <input
                        type="text"
                        id="modNuts"
                        defaultValue={selectedOrder.detalles?.[0]?.tuercasTipo || ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Fecha Entrega</label>
                      <input
                        type="date"
                        id="modDate"
                        defaultValue={selectedOrder.fechaComprometida ? selectedOrder.fechaComprometida.substring(0, 10) : ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btnSecondary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => {
                      const colorEl = document.getElementById('modColor') as HTMLInputElement;
                      const nutsEl = document.getElementById('modNuts') as HTMLInputElement;
                      const dateEl = document.getElementById('modDate') as HTMLInputElement;
                      handleModifyOrder(selectedOrder.id, colorEl.value, nutsEl.value, dateEl.value);
                    }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              )}

              {/* Physical release authorization triggers (RF-15) */}
              {currentUser.role === 'JEFE_TALLER' && selectedOrder.estado === 'APROBADA' && !selectedOrder.salidaAutorizada && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>Autorizar Salida del Almacén</strong>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Firma la entrega de varillas/insumos al taller de metalúrgica.</p>
                  </div>
                  <button className="btn btnSuccess" onClick={() => handleAuthorizeRelease(selectedOrder.id)}>
                    ✍️ Autorizar Salida
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            OVERLAY / SIMULATED MODAL: CLIENT SECURE LINK VIEW
            ---------------------------------------------------- */}
        {activeExternalToken && externalOrderData && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5,8,16,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--color-accent)' }}>Consulta de Estado Externa</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Visualización Segura para Clientes (Sin Login)</span>
                </div>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setActiveExternalToken(null); setExternalOrderData(null); }}>✕ Salir</button>
              </div>

              <h3>{externalOrderData.clienteNombre}</h3>
              <p style={{ marginBottom: '1rem' }}>Seguimiento de Órden de Fabricación: <strong>Orden #{externalOrderData.codigoCorrelativoUnico}</strong></p>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Compromiso Entrega</span>
                  <p style={{ fontWeight: 'bold' }}>{new Date(externalOrderData.fechaComprometida).toLocaleDateString('es-PE')}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Estado Actual</span>
                  <br />
                  <span className={`badge ${externalOrderData.estado === 'PENDIENTE_PAGO' ? 'badgePendiente' :
                    externalOrderData.estado === 'APROBADA' ? 'badgeAprobada' :
                      externalOrderData.estado === 'TERMINADA' ? 'badgeTerminada' :
                        externalOrderData.estado === 'ENTREGADA' ? 'badgeEntregada' : 'badgeCancelada'
                    }`}>
                    {externalOrderData.estado}
                  </span>
                </div>
              </div>

              {/* Order products list */}
              <h5 style={{ marginBottom: '0.5rem' }}>Productos Solicitados</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {externalOrderData.detalles?.map((d: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: 'bold', color: 'white' }}>{d.cantidadSolicitada}x {d.productoNombre}</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                      Especificaciones: Largo {d.largo}m, Ancho {d.ancho}m, Espesor {d.espesor}mm, Estructura: {d.forma}
                    </p>
                  </div>
                ))}
              </div>

              {/* Real-time stages */}
              <h5 style={{ marginBottom: '0.5rem' }}>Avance de la Fabricación en Taller</h5>
              <div className="progressList">
                {externalOrderData.procesos?.length > 0 ? (
                  externalOrderData.procesos.map((stage: any, idx: number) => (
                    <div key={idx} className={`progressItem ${stage.completada ? 'progressItemDone' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={stage.completada ? 'progressDot progressDotDone' : 'progressDot'} />
                        <span>{stage.etapaNombre}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {stage.completada ? `Completada el ${new Date(stage.fechaCompletada).toLocaleDateString()}` : 'Pendiente en línea'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Esperando aprobación para iniciar el flujo de fabricación (Corte ➡️ Roscado ➡️ Doblado ➡️ Pintura).</p>
                )}
              </div>
            </div>
          </div>
        )}
        </div> {/* Close content area div */}
      </main>
    </div>
  );
}
