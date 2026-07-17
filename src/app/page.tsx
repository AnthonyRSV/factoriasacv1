"use client";

import React, { Suspense, useState, useEffect, useCallback } from 'react';
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
  Calendar,
  Trash2,
  Camera,
  Upload,
  Edit,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CalendarioProduccion from './components/CalendarioProduccion';
import SeguimientoOrdenes from './components/SeguimientoOrdenes';

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



function AuthErrorHandler({ onError }: { onError: (message: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get('authError') ?? searchParams.get('error');
    if (authError === 'not-registered' || authError === 'AccessDenied') {
      onError('Este kbro no esta registrado');
    }
  }, [onError, searchParams]);

  return null;
}

export default function Home() {
  // Authentication State with NextAuth
  const { data: session, status, update } = useSession();
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

  // Unified Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [kardex, setKardex] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Active Tab Selection
  const [activeTab, setActiveTab] = useState<string>('orders');
  
  // Production Module Internal Tab Selection
  const [productionActiveTab, setProductionActiveTab] = useState<'calendario' | 'seguimiento'>('calendario');

  // Modals & Detail Simulation State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [adicionalAbono, setAdicionalAbono] = useState<string>('');
  const [confirmingPaymentOrderId, setConfirmingPaymentOrderId] = useState<string | null>(null);
  const [ocSearchQuery, setOcSearchQuery] = useState<string>('OC-');
  const [activeExternalToken, setActiveExternalToken] = useState<string | null>(null);
  const [externalOrderData, setExternalOrderData] = useState<any>(null);
  const [stageOperario, setStageOperario] = useState<{ [key: string]: string }>({});

  // Form States
  const [orderForm, setOrderForm] = useState({
    clienteNombre: '',
    tipoCliente: 'TIENDA' as 'TIENDA' | 'EMPRESA',
    fechaComprometida: '',
    montoTotal: 0 as number | '',
    montoAbonado: 0 as number | '',
    metodoPago: 'EFECTIVO',
    esUrgente: false,
    productoId: '',
    descripcionProducto: '',
    numeroOrdenCompra: '',
    calidadAcero: 'A36',
    colorPintura: 'Ninguno',
    tuercasTipo: 'Ninguno',
    cantidadSolicitada: 10,
  });

  const [restockForm, setRestockForm] = useState({
    materiaPrimaId: '',
    cantidad: 50,
    tipoMovimiento: 'INGRESO',
    motivo: '',
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR',
    image: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [mpForm, setMpForm] = useState({
    codigo: '',
    nombre: '',
    tipo: 'VARILLA',
    diametro: '',
    espesor: '',
    stockActual: 0,
    stockMinimo: 0,
  });
  const [isCreatingMP, setIsCreatingMP] = useState(false);
  const [editingMPId, setEditingMPId] = useState<string | null>(null);

  const [inventorySubTab, setInventorySubTab] = useState<'produccion' | 'comercial'>('produccion');

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
        const usersRes = await fetch(`/api/users?_t=${Date.now()}`, { 
          headers: { ...getHeaders(), 'Cache-Control': 'no-cache' },
          cache: 'no-store'
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } else {
          console.error("Failed to fetch users:", await usersRes.text());
        }
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

    return {
      qty: 0,
      unit: 'metros',
      material: p.materiaPrima ? p.materiaPrima.nombre : 'Insumo',
    };
  };

  const matPreview = getCalculatedMaterial();

  const filteredOrders = orders.filter(order => {
    if (ocSearchQuery === 'OC-' || !ocSearchQuery) return true;
    return order.numeroOrdenCompra && order.numeroOrdenCompra.toLowerCase().includes(ocSearchQuery.toLowerCase());
  });

  // Watch change in form to adjust base pricing automatically
  const handleFormChange = (field: string, value: any) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field !== 'montoTotal') {
        let basePrice = 20; 
        const subtotal = basePrice * updated.cantidadSolicitada;

        let extra = 0;
        if (updated.colorPintura && updated.colorPintura !== 'Ninguno') extra += 5 * updated.cantidadSolicitada;
        if (updated.tuercasTipo && updated.tuercasTipo !== 'Ninguno') extra += 8 * updated.cantidadSolicitada;

        updated.montoTotal = subtotal + extra;
      }

      return updated;
    });
  };

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
        montoTotal: Number(orderForm.montoTotal) || 0,
        montoAbonado: Number(orderForm.montoAbonado) || 0,
        metodoPago: orderForm.metodoPago,
        esUrgente: orderForm.esUrgente,
        detalles: [{
          productoId: orderForm.productoId,
          descripcionProducto: orderForm.descripcionProducto,
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
        setOrderForm({
          clienteNombre: '',
          tipoCliente: 'TIENDA',
          fechaComprometida: '',
          montoTotal: 0 as number | '',
          montoAbonado: 0 as number | '',
          metodoPago: 'EFECTIVO',
          esUrgente: false,
          productoId: '',
          descripcionProducto: '',
          numeroOrdenCompra: '',
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

  const handleAddAbonoSubmit = async (orderId: string) => {
    const amt = parseFloat(adicionalAbono);
    if (isNaN(amt) || amt <= 0) {
      alert('Ingrese un monto de abono válido mayor a cero.');
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ abonoAdicional: amt }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
        setAdicionalAbono('');
        loadData();
      } else {
        alert(`Error: ${data.error || 'El monto ingresado supera el saldo pendiente de la orden.'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  const handleExportPDF = async (title: string) => {
    try {
      let headers: string[] = [];
      let rows: any[][] = [];

      if (title === 'Órdenes') {
        const res = await fetch('/api/orders', { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener órdenes');
        const data = await res.json();
        headers = ['ID', 'OC', 'Cliente', 'Total', 'Abonado', 'Estado'];
        rows = data.map((o: any) => [
          o.codigoCorrelativoUnico,
          o.numeroOrdenCompra || '-',
          o.clienteNombre,
          'S/. ' + o.montoTotal,
          'S/. ' + o.montoAbonado,
          o.estado
        ]);
      } else if (title === 'Líneas de Fabricación') {
        const res = await fetch('/api/orders', { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener líneas');
        const data = await res.json();
        headers = ['Orden', 'Etapa', 'Secuencia', 'Operario', 'Estado'];
        const list: any[] = [];
        data.forEach((o: any) => {
          if (o.procesos && o.procesos.length > 0) {
            o.procesos.forEach((p: any) => {
              list.push([
                o.codigoCorrelativoUnico,
                p.etapaNombre,
                p.ordenSecuencia,
                p.operarioAsignado || '-',
                p.completada ? 'LISTO' : 'PENDIENTE'
              ]);
            });
          }
        });
        rows = list;
      } else if (title === 'Materia Prima') {
        const res = await fetch('/api/inventory', { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener inventario');
        const data = await res.json();
        const mats = data.materials || [];
        headers = ['Codigo', 'Nombre', 'Tipo', 'Diametro', 'Espesor'];
        rows = mats.map((m: any) => [
          m.codigo,
          m.nombre,
          m.tipo,
          m.diametro || '-',
          m.espesor || '-'
        ]);
      } else if (title === 'Inventario Dual') {
        const res = await fetch('/api/inventory', { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener inventario');
        const data = await res.json();
        const mats = data.materials || [];
        headers = ['Codigo', 'Nombre', 'Stock Actual', 'Stock Minimo', 'Alerta'];
        rows = mats.map((m: any) => [
          m.codigo,
          m.nombre,
          m.stockActual,
          m.stockMinimo,
          m.stockActual < m.stockMinimo ? 'CRITICO' : 'OK'
        ]);
      } else if (title === 'Kardex de Movimientos' || title === 'Kardex') {
        const res = await fetch('/api/inventory', { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener inventario');
        const data = await res.json();
        const kdx = data.kardex || [];
        headers = ['Fecha', 'Material', 'Tipo', 'Cantidad', 'Motivo'];
        rows = kdx.map((k: any) => [
          new Date(k.creadoEn).toLocaleDateString(),
          k.materiaPrima?.nombre || '-',
          k.tipoMovimiento,
          k.cantidad,
          k.motivo
        ]);
      }

      if (rows.length === 0) {
        alert('El reporte no tiene datos registrados actualmente.');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`REPORTE DE ${title.toUpperCase()}`, 14, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text('Factoria SAC v1.0', 14, 34);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, 196, 38);
      
      doc.setFont('Courier', 'bold');
      doc.setFontSize(9);
      
      let y = 48;
      let headerStr = '';
      headers.forEach(h => {
        headerStr += h.padEnd(14).substring(0, 14) + ' ';
      });
      doc.text(headerStr, 14, y);
      
      y += 5;
      doc.line(14, y, 196, y);
      y += 8;
      
      doc.setFont('Courier', 'normal');
      rows.forEach(row => {
        let rowStr = '';
        row.forEach(cell => {
          rowStr += String(cell).substring(0, 13).padEnd(14) + ' ';
        });
        doc.text(rowStr, 14, y);
        y += 6;
        
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save(`Reporte_${title.toLowerCase().replace(/ /g, '_')}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert('Error al descargar el PDF.');
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
          tipoMovimiento: restockForm.tipoMovimiento,
          motivo: restockForm.motivo || (restockForm.tipoMovimiento === 'EGRESO' ? 'Consumo manual en taller' : 'Ingreso manual de material'),
        }),
      });

      if (res.ok) {
        setFormSuccess(`Movimiento de ${restockForm.tipoMovimiento === 'EGRESO' ? 'Salida' : 'Ingreso'} registrado con éxito para ${selectedMat.nombre}.`);
        loadData();
        setRestockForm({ materiaPrimaId: '', cantidad: 50, tipoMovimiento: 'INGRESO', motivo: '' });
      } else {
        const err = await res.json();
        setFormError(err.error || 'Error al actualizar inventario.');
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

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(editingUserId ? 'Usuario actualizado exitosamente.' : 'Usuario creado exitosamente.');
        setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR', image: '' });
        setIsCreatingUser(false);
        setEditingUserId(null);
        loadData();
      } else {
        setFormError(data.error || (editingUserId ? 'Error al actualizar usuario.' : 'Error al crear usuario.'));
      }
    } catch (err: any) {
      setFormError(editingUserId ? 'Error de red al actualizar usuario.' : 'Error de red al crear usuario.');
    }
  };

  const handleEditUserClick = (user: any) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      image: user.image || '',
    });
    setEditingUserId(user.id);
    setIsCreatingUser(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setFormSuccess('Usuario eliminado.');
        loadData();
      } else {
        setFormError('Error al eliminar usuario.');
      }
    } catch (err: any) {
      setFormError('Error de red al eliminar usuario.');
    }
  };

  const handleSaveMPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const url = editingMPId ? `/api/materia-prima/${editingMPId}` : '/api/materia-prima';
      const method = editingMPId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(mpForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(editingMPId ? 'Materia Prima actualizada.' : 'Materia Prima creada.');
        setMpForm({ codigo: '', nombre: '', tipo: 'VARILLA', diametro: '', espesor: '', stockActual: 0, stockMinimo: 0 });
        setIsCreatingMP(false);
        setEditingMPId(null);
        loadData();
      } else {
        setFormError(data.error || 'Error al guardar materia prima.');
      }
    } catch (err: any) {
      setFormError('Error de red.');
    }
  };

  const handleEditMPClick = (mp: any) => {
    setMpForm({
      codigo: mp.codigo,
      nombre: mp.nombre,
      tipo: mp.tipo,
      diametro: mp.diametro || '',
      espesor: mp.espesor || '',
      stockActual: mp.stockActual,
      stockMinimo: mp.stockMinimo,
    });
    setEditingMPId(mp.id);
    setIsCreatingMP(true);
  };

  const handleDeleteMP = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta materia prima?')) return;
    try {
      const res = await fetch(`/api/materia-prima/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Materia prima eliminada.');
        loadData();
      } else {
        setFormError(data.error || 'Error al eliminar materia prima.');
      }
    } catch (err: any) {
      setFormError('Error de red.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
            
            <div className={styles.dividerCompact} style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>o inicia sesión con</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            
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
              }} />
              <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>Factoría Sánchez</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, paddingLeft: '3rem' }}>Sistema de Gestión</p>
          </div>
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
                active={activeTab === 'new_order'}
                icon={<Plus size={18} strokeWidth={2} />}
                label="Nueva Cotización"
                onClick={() => { setActiveTab('new_order'); setFormError(null); setFormSuccess(null); }}
              />
              <SidebarButton
                active={activeTab === 'production'}
                icon={<Factory size={18} strokeWidth={2} />}
                label="Líneas de Fabricación"
                onClick={() => setActiveTab('production')}
              />
              <SidebarButton
                active={activeTab === 'restock'}
                icon={<ShoppingCart size={18} strokeWidth={2} />}
                label="Ingresar Compra"
                onClick={() => { setActiveTab('restock'); setFormError(null); setFormSuccess(null); }}
              />
              <SidebarButton
                active={activeTab === 'materia_prima'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Materia Prima (CRUD)"
                onClick={() => setActiveTab('materia_prima')}
              />
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
              <SidebarButton
                active={activeTab === 'produccion'}
                icon={<Calendar size={18} strokeWidth={2} />}
                label="Producción"
                onClick={() => setActiveTab('produccion')}
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
              <SidebarButton
                active={activeTab === 'produccion'}
                icon={<Calendar size={18} strokeWidth={2} />}
                label="Producción"
                onClick={() => setActiveTab('produccion')}
              />
            </>
          )}

          {/* Almacenero Links */}
          {currentUser.role === 'ALMACENERO' && (
            <>
              <SidebarButton
                active={activeTab === 'restock'}
                icon={<ShoppingCart size={18} strokeWidth={2} />}
                label="Ingresar Compra"
                onClick={() => { setActiveTab('restock'); setFormError(null); setFormSuccess(null); }}
              />
              <SidebarButton
                active={activeTab === 'materia_prima'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Materia Prima (CRUD)"
                onClick={() => setActiveTab('materia_prima')}
              />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>Factoría Sánchez</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sistema de Gestión</span>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
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
                {activeTab === 'produccion' && 'Producción y Seguimiento de Fabricación'}
                {activeTab === 'kardex' && 'Kardex de Movimientos'}
                {activeTab === 'restock' && 'Ingresar Compra'}
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                Bienvenido al sistema de gestión de Factoría Sánchez
              </p>
            </div>
          </header>

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

        {activeTab === 'dashboard' && (
          <div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Estado de Órdenes</h3>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Pendientes', value: orders.filter(o => o.estado === 'PENDIENTE_PAGO').length, color: '#F59E0B' },
                          { name: 'Aprobadas', value: orders.filter(o => o.estado === 'APROBADA').length, color: '#10B981' },
                          { name: 'En Producción', value: orders.filter(o => o.estado === 'EN_PRODUCCION').length, color: '#3B82F6' },
                          { name: 'Terminadas', value: orders.filter(o => o.estado === 'TERMINADA').length, color: '#6366F1' },
                          { name: 'Entregadas', value: orders.filter(o => o.estado === 'ENTREGADA').length, color: '#8B5CF6' }
                        ].filter(d => d.value > 0)} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {[
                          { name: 'Pendientes', value: orders.filter(o => o.estado === 'PENDIENTE_PAGO').length, color: '#F59E0B' },
                          { name: 'Aprobadas', value: orders.filter(o => o.estado === 'APROBADA').length, color: '#10B981' },
                          { name: 'En Producción', value: orders.filter(o => o.estado === 'EN_PRODUCCION').length, color: '#3B82F6' },
                          { name: 'Terminadas', value: orders.filter(o => o.estado === 'TERMINADA').length, color: '#6366F1' },
                          { name: 'Entregadas', value: orders.filter(o => o.estado === 'ENTREGADA').length, color: '#8B5CF6' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Stock vs Mínimo</h3>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer>
                    <BarChart data={materials.map(m => ({
                      name: m.nombre.length > 10 ? m.nombre.substring(0, 10) + '...' : m.nombre,
                      Stock: m.stockActual,
                      'Mínimo': m.stockMinimo
                    })).slice(0, 5)}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Stock" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Mínimo" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

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

        {activeTab === 'users' && (
          <div style={{ 
            background: '#FFFFFF', 
            padding: '1.25rem', 
            borderRadius: '10px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Lista de Usuarios</h3>
              <button 
                className="btn btnPrimary" 
                onClick={() => { setIsCreatingUser(!isCreatingUser); setEditingUserId(null); setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR', image: '' }); }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {isCreatingUser ? 'Cerrar Formulario' : '+ Crear Usuario'}
              </button>
            </div>

            {isCreatingUser && (
              <form onSubmit={handleSaveUserSubmit} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="formGroup">
                    <label>Nombre</label>
                    <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>Correo Electrónico</label>
                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>{editingUserId ? 'Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña'}</label>
                    <input type="password" required={!editingUserId} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>Rol</label>
                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="VENDEDOR">VENDEDOR</option>
                      <option value="JEFE_TALLER">JEFE_TALLER</option>
                      <option value="ALMACENERO">ALMACENERO</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                    <label>Foto de Perfil (Opcional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="file" accept="image/*" id="user-image" style={{ display: 'none' }} onChange={handleImageUpload} />
                      <label htmlFor="user-image" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Upload size={16} /> Subir Imagen
                      </label>
                      {userForm.image && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={userForm.image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setUserForm({...userForm, image: ''})} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}>Quitar</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btnPrimary">Guardar Usuario</button>
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {users.map((user) => (
                <div key={user.email} style={{
                  padding: '1rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  background: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => handleEditUserClick(user)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    {user.id !== currentUser.id && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.25rem' }}>
                    {user.image ? (
                      <img src={user.image} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                    ) : (
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
                    )}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1.5rem' }}>
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

        {activeTab === 'orders' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>Historial de Órdenes de Fabricación</h3>
                {(currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && (
                  <button className="btn btnPrimary" onClick={() => setActiveTab('new_order')}>+ Crear Cotización</button>
                )}
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Buscar por Código OC:</label>
                <input
                  type="text"
                  value={ocSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('OC-')) {
                      setOcSearchQuery(val);
                    } else if (val.length < 3) {
                      setOcSearchQuery('OC-');
                    } else {
                      const clean = val.replace('OC-', '');
                      setOcSearchQuery('OC-' + clean);
                    }
                  }}
                  placeholder="Ej. 26-00001"
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontWeight: 'bold',
                    width: '240px'
                  }}
                />
                {ocSearchQuery !== 'OC-' && (
                  <button
                    className="btn btnSecondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={() => setOcSearchQuery('OC-')}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Cód. Correlativo</th>
                      <th>Código OC</th>
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
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay órdenes de fabricación registradas.</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>{order.codigoCorrelativoUnico}</strong></td>
                          <td><code>{order.numeroOrdenCompra || '-'}</code></td>
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

                              {(currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && order.estado === 'PENDIENTE_PAGO' && (
                                <button
                                  className="btn btnSuccess"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => setConfirmingPaymentOrderId(order.id)}
                                >
                                  Aprobar Pago
                                </button>
                              )}

                              {(currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && order.estado === 'TERMINADA' && (
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

                  <div className="formGroup" style={{ marginBottom: '1rem' }}>
                    <label>Descripción del Producto (Medidas y Forma)</label>
                    <input
                      type="text"
                      value={orderForm.descripcionProducto || ''}
                      placeholder="Ej. Abrazadera forma cuadrada de 3/4 x 3 x 16 o Media redonda 1/2 x 2 x 10"
                      onChange={(e) => handleFormChange('descripcionProducto', e.target.value)}
                      required
                    />
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

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Calidad del Acero</label>
                      <select
                        value={orderForm.calidadAcero}
                        onChange={(e) => handleFormChange('calidadAcero', e.target.value)}
                      >
                        <option value="A36">A36 (Acero Dulce)</option>
                        <option value="1045">1045 (Medio Carbono)</option>
                        <option value="BCL">BCL (Muelle Especial)</option>
                        <option value="Fierro">Fierro Común</option>
                      </select>
                    </div>
                    <div className="formGroup">
                      <label>Cantidad Solicitada</label>
                      <input
                        type="number"
                        value={orderForm.cantidadSolicitada}
                        onChange={(e) => handleFormChange('cantidadSolicitada', parseInt(e.target.value) || 0)}
                      />
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

                  <div className="formGroup">
                    <label>Fecha Prometida de Entrega</label>
                    <input
                      type="date"
                      value={orderForm.fechaComprometida}
                      onChange={(e) => handleFormChange('fechaComprometida', e.target.value)}
                    />
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

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Precio Total (S/.)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.montoTotal}
                        onChange={(e) => handleFormChange('montoTotal', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        style={{ fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Abono Inicial del Pago</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.montoAbonado}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, montoAbonado: e.target.value === '' ? '' : Number(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Generar Órden de Fabricación
                  </button>
                </form>
              </div>

              <div className="card" style={{ alignSelf: 'start' }}>
                <h3>Ficha Técnica & Cálculo de Material</h3>
                {orderForm.productoId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Producto Seleccionado:</span>
                      <p style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: '0.2rem 0', fontWeight: 'bold' }}>
                        {fichas.find(f => f.id === orderForm.productoId)?.nombre}
                      </p>
                    </div>

                    <div className="alertBanner alertBannerInfo" style={{ fontSize: '0.85rem', padding: '0.8rem', margin: 0 }}>
                      <span>📋 La orden será procesada mediante el código y registrado en el Kardex al aprobarse la orden.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    <span>Seleccione un producto para visualizar la ficha técnica.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="tabContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Organizador Diario de Fabricación</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Filtro: Ordenado por Urgencia</span>
            </div>

            <div className="kanbanBoard">
              {['PENDIENTE_PAGO', 'APROBADA', 'TERMINADA', 'ENTREGADA', 'CANCELADA'].map((status) => {
                const colOrders = orders
                  .filter(o => o.estado === status)
                  .sort((a, b) => new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime());

                return (
                  <div key={status} className="kanbanColumn">
                    <div className="kanbanColHeader">
                      <span className="kanbanColTitle">{status}</span>
                      <span className="kanbanCount">{colOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
                      {colOrders.map(o => (
                        <div key={o.id} className="kanbanCard" onClick={() => setSelectedOrder(o)}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Orden #{o.codigoCorrelativoUnico}</span>
                          <p style={{ fontSize: '0.85rem' }}>{o.clienteNombre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'materia_prima' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>Gestión de Materia Prima</h3>
                <button 
                  className="btn btnPrimary" 
                  onClick={() => { setIsCreatingMP(!isCreatingMP); setEditingMPId(null); setMpForm({ codigo: '', nombre: '', tipo: 'VARILLA', diametro: '', espesor: '', stockActual: 0, stockMinimo: 0 }); }}
                >
                  {isCreatingMP ? 'Cancelar' : '+ Nueva Materia Prima'}
                </button>
              </div>

              {isCreatingMP && (
                <form onSubmit={handleSaveMPSubmit} style={{ background: 'rgba(79,70,229,0.03)', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid rgba(79,70,229,0.1)' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-primary)' }}>{editingMPId ? 'Editar Materia Prima' : 'Nueva Materia Prima'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="formGroup">
                      <label>Código Interno</label>
                      <input type="text" required value={mpForm.codigo} onChange={e => setMpForm({...mpForm, codigo: e.target.value})} placeholder="Ej: MAT-001" />
                    </div>
                    <div className="formGroup" style={{ gridColumn: 'span 2' }}>
                      <label>Nombre / Descripción</label>
                      <input type="text" required value={mpForm.nombre} onChange={e => setMpForm({...mpForm, nombre: e.target.value})} placeholder="Ej: Acero Inoxidable 304" />
                    </div>
                    <div className="formGroup">
                      <label>Stock Actual</label>
                      <input type="number" step="0.01" required value={mpForm.stockActual} onChange={e => setMpForm({...mpForm, stockActual: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btnPrimary">{editingMPId ? 'Guardar Cambios' : 'Registrar Materia Prima'}</button>
                  </div>
                </form>
              )}

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Stock</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(mp => (
                      <tr key={mp.id}>
                        <td><code>{mp.codigo}</code></td>
                        <td>{mp.nombre}</td>
                        <td>{mp.stockActual}</td>
                        <td>
                          <button onClick={() => handleEditMPClick(mp)} className="btn btnSecondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setInventorySubTab('produccion')}
                  style={{
                    background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                    color: inventorySubTab === 'produccion' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  Insumos
                </button>
              </div>

              {inventorySubTab === 'produccion' && (
                <div className="tableContainer">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((mat) => (
                        <tr key={mat.id}>
                          <td><code>{mat.codigo}</code></td>
                          <td>{mat.nombre}</td>
                          <td><strong>{mat.stockActual.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kardex' && (
          <div className="tabContent">
            <div className="card">
              <h3>Libro del Kardex</h3>
              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Material</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kardex.map((kdx) => (
                      <tr key={kdx.id}>
                        <td>{new Date(kdx.creadoEn).toLocaleString('es-PE')}</td>
                        <td>{kdx.materiaPrima?.nombre}</td>
                        <td>{kdx.tipoMovimiento}</td>
                        <td>{kdx.cantidad}</td>
                        <td>{kdx.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restock' && (
          <div className="tabContent">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Registrar Movimiento de Inventario</h3>
              <form onSubmit={handleRestockSubmit}>
                <div className="formGroup">
                  <label>Materia Prima</label>
                  <select
                    value={restockForm.materiaPrimaId}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, materiaPrimaId: e.target.value }))}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label>Tipo de Movimiento</label>
                  <select
                    value={restockForm.tipoMovimiento}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, tipoMovimiento: e.target.value }))}
                  >
                    <option value="INGRESO">Ingreso</option>
                    <option value="EGRESO">Egreso</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockForm.cantidad}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, cantidad: Number(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>Motivo</label>
                  <input
                    type="text"
                    value={restockForm.motivo}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, motivo: e.target.value }))}
                    required
                  />
                </div>

                <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Registrar
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'reports' && reports && (() => {
          const getFabricationLinesRows = () => {
            const list: any[] = [];
            orders.forEach(o => {
              if (o.procesos && o.procesos.length > 0) {
                o.procesos.forEach((p: any) => {
                  list.push({
                    orderId: o.codigoCorrelativoUnico,
                    etapa: p.etapaNombre,
                    secuencia: p.ordenSecuencia,
                    operario: p.operarioAsignado || '-',
                    completada: p.completada ? 'LISTO' : 'PENDIENTE'
                  });
                });
              }
            });
            return list;
          };
          const fabLines = getFabricationLinesRows();

          return (
            <div className="tabContent">
              <div className="grid3" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                  <h3>Pendientes</h3>
                  <p>{reports.pendingOrdersCount}</p>
                </div>
              </div>

              <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                  📂 Panel de Exportación de Reportes Técnicos
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                  Selecciona el reporte técnico correspondiente para descargar la información completa y actualizada directamente desde la base de datos en formato PDF.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  {/* Report 1: Órdenes */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem' }}>📋 Reporte de Órdenes</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                        Listado general de cotizaciones, precios, abonos, métodos de pago y estados.
                      </p>
                    </div>
                    <button
                      className="btn btnPrimary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => handleExportPDF('Órdenes')}
                    >
                      📥 Descargar PDF
                    </button>
                  </div>

                  {/* Report 2: Líneas de Fabricación */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem' }}>⚙️ Líneas de Fabricación</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                        Progreso de etapas en taller (Corte, Roscado, Doblado, Pintura) y asignación de operarios.
                      </p>
                    </div>
                    <button
                      className="btn btnPrimary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => handleExportPDF('Líneas de Fabricación')}
                    >
                      📥 Descargar PDF
                    </button>
                  </div>

                  {/* Report 3: Materia Prima */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem' }}>📐 Catálogo de Materia Prima</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                        Catálogo y parámetros de dimensiones (diámetro, espesor) de tubos, varillas y platinas.
                      </p>
                    </div>
                    <button
                      className="btn btnPrimary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => handleExportPDF('Materia Prima')}
                    >
                      📥 Descargar PDF
                    </button>
                  </div>

                  {/* Report 4: Inventario Dual */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem' }}>📦 Inventario Dual</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                        Niveles de stock físico de materiales y alertas de reposición crítica de seguridad.
                      </p>
                    </div>
                    <button
                      className="btn btnPrimary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => handleExportPDF('Inventario Dual')}
                    >
                      📥 Descargar PDF
                    </button>
                  </div>

                  {/* Report 5: Kardex de Movimientos */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem' }}>📜 Kardex de Movimientos</h5>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                        Historial detallado de entradas (compras) y salidas (consumos) en el almacén físico.
                      </p>
                    </div>
                    <button
                      className="btn btnPrimary"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => handleExportPDF('Kardex de Movimientos')}
                    >
                      📥 Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'produccion' && (
          <div className="tabContent">
            <div className="roleSelectorBar" style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => setProductionActiveTab('calendario')}
                className={`roleBtn ${productionActiveTab === 'calendario' ? 'roleBtnActive' : ''}`}
              >
                Calendario
              </button>
              <button
                onClick={() => setProductionActiveTab('seguimiento')}
                className={`roleBtn ${productionActiveTab === 'seguimiento' ? 'roleBtnActive' : ''}`}
              >
                Seguimiento
              </button>
            </div>
            {productionActiveTab === 'calendario' ? (
              <CalendarioProduccion />
            ) : (
              <SeguimientoOrdenes />
            )}
          </div>
        )}

        {selectedOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <h4>Ficha de Producción: Orden #{selectedOrder.codigoCorrelativoUnico}</h4>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedOrder(null)}>✕ Cerrar</button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p><strong>Cliente:</strong> {selectedOrder.clienteNombre} ({selectedOrder.tipoCliente}){selectedOrder.numeroOrdenCompra && ` [OC: ${selectedOrder.numeroOrdenCompra}]`}</p>
                  <p><strong>Fecha Comprometida:</strong> {new Date(selectedOrder.fechaComprometida).toLocaleDateString('es-PE')}</p>
                  <p><strong>Monto Facturado:</strong> S/. {selectedOrder.montoTotal} {selectedOrder.cargoUrgencia > 0 && `(Inc. recargo S/. ${selectedOrder.cargoUrgencia} por urgencia)`}</p>
                  <p><strong>Monto Abonado:</strong> S/. {selectedOrder.montoAbonado}</p>
                  {selectedOrder.montoTotal > 2000 && (
                    <p style={{ margin: '0.25rem 0 0.5rem 0' }}>
                      <strong>Clasificación:</strong>{' '}
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.4)', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        Bancario
                      </span>
                    </p>
                  )}
                  {selectedOrder.estado === 'PENDIENTE_PAGO' && (currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Agregar abono (S/.)"
                        value={adicionalAbono}
                        onChange={(e) => setAdicionalAbono(e.target.value)}
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '130px', background: 'white', color: 'black' }}
                      />
                      <button
                        className="btn btnSuccess"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => handleAddAbonoSubmit(selectedOrder.id)}
                      >
                        Agregar Abono
                      </button>
                    </div>
                  )}
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
                    {d.descripcionProducto ? (
                      <p style={{ gridColumn: 'span 2' }}><strong>Descripción:</strong> {d.descripcionProducto}</p>
                    ) : (
                      <>
                        <p><strong>Largo:</strong> {d.largo} m</p>
                        <p><strong>Ancho:</strong> {d.ancho} m</p>
                        <p><strong>Espesor:</strong> {d.espesor} pulg/mm</p>
                      </>
                    )}
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
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '100px', background: 'white', color: 'black' }}
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
              {(currentUser.role === 'VENDEDOR' || currentUser.role === 'JEFE_TALLER' || currentUser.role === 'ADMIN') && (
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
              {(currentUser.role === 'JEFE_TALLER' || currentUser.role === 'ADMIN') && selectedOrder.estado === 'APROBADA' && !selectedOrder.salidaAutorizada && (
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

        {activeExternalToken && externalOrderData && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5,8,16,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <h4>Consulta de Estado Externa</h4>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setActiveExternalToken(null); setExternalOrderData(null); }}>✕ Salir</button>
              </div>

              <h3>{externalOrderData.clienteNombre}</h3>
              <p>Orden #{externalOrderData.codigoCorrelativoUnico}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {externalOrderData.detalles?.map((d: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: 'bold', color: 'white' }}>{d.cantidadSolicitada}x {d.productoNombre}</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                      {d.descripcionProducto ? `Descripción: ${d.descripcionProducto}` : `Especificaciones: Largo ${d.largo}m, Ancho ${d.ancho}m, Espesor ${d.espesor}mm, Estructura: ${d.forma}`}
                    </p>
                  </div>
                ))}
              </div>
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
        {confirmingPaymentOrderId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'white' }}>Confirmar Pago Total</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                ¿Está seguro de que va a pagar la totalidad de la orden?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn btnSuccess"
                  onClick={() => {
                    handleStatusTransition(confirmingPaymentOrderId, 'APROBADA');
                    setConfirmingPaymentOrderId(null);
                  }}
                >
                  SÍ
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => setConfirmingPaymentOrderId(null)}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        )}
        </div> {/* Close content area div */}
      </main>
    </div>
  );
}
