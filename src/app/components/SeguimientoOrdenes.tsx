'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, AlertTriangle, Clock, CheckCircle, ArrowUpDown, ChevronDown, AlertCircle } from 'lucide-react';

interface OrdenProduccion {
  id: string;
  codigoCorrelativoUnico: number;
  clienteNombre: string;
  estado: string;
  fechaComprometida: string;
  fechaProduccion: string | null;
  prioridad: string;
  creadoEn: string;
  detalles: any[];
  estaAtrasada: boolean;
  diasRestantes: number;
  diasRetraso: number;
}

export default function SeguimientoOrdenes() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [filtros, setFiltros] = useState({
    codigo: '',
    cliente: '',
    estado: '',
    prioridad: '',
    soloAtrasadas: false,
    soloEnProduccion: false,
    soloUrgentes: false,
    fechaInicio: '',
    fechaFin: ''
  });

  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, [filtros]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtros.codigo) params.append('codigo', filtros.codigo);
      if (filtros.cliente) params.append('cliente', filtros.cliente);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
      if (filtros.soloAtrasadas) params.append('soloAtrasadas', 'true');
      if (filtros.soloEnProduccion) params.append('soloEnProduccion', 'true');
      if (filtros.soloUrgentes) params.append('soloUrgentes', 'true');
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);

      const res = await fetch(`/api/produccion/ordenes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (campo: string) => {
    if (sortBy === campo) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(campo);
      setSortOrder('asc');
    }
  };

  const ordenesOrdenadas = [...ordenes].sort((a, b) => {
    let comparacion = 0;
    
    switch (sortBy) {
      case 'codigo':
        comparacion = a.codigoCorrelativoUnico - b.codigoCorrelativoUnico;
        break;
      case 'cliente':
        comparacion = a.clienteNombre.localeCompare(b.clienteNombre);
        break;
      case 'fecha':
        comparacion = new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime();
        break;
      case 'prioridad':
        const prioridadOrden = { URGENTE: 3, ALTA: 2, NORMAL: 1 };
        comparacion = prioridadOrden[a.prioridad as keyof typeof prioridadOrden] - prioridadOrden[b.prioridad as keyof typeof prioridadOrden];
        break;
      case 'estado':
        comparacion = a.estado.localeCompare(b.estado);
        break;
      default:
        comparacion = 0;
    }
    
    return sortOrder === 'asc' ? comparacion : -comparacion;
  });

  const getProductoNombre = (orden: OrdenProduccion) => {
    return orden.detalles?.[0]?.producto?.nombre || 'Producto no especificado';
  };

  const getProductoCodigo = (orden: OrdenProduccion) => {
    return orden.detalles?.[0]?.producto?.codigo || '';
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'Pedido Aceptado';
      case 'APROBADA':
        return 'Aprobada';
      case 'EN_PRODUCCION':
        return 'En Producción';
      case 'TERMINADA':
        return 'Terminado';
      case 'ENTREGADA':
        return 'Entregado';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const getPrioridadBadgeClass = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'badgeCancelada';
      case 'ALTA':
        return 'badgePendiente';
      default:
        return 'badgeAprobada';
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'badgePendiente';
      case 'APROBADA':
        return 'badgeAprobada';
      case 'EN_PRODUCCION':
        return 'badgeTerminada';
      case 'TERMINADA':
        return 'badgeTerminada';
      case 'ENTREGADA':
        return 'badgeEntregada';
      case 'CANCELADA':
        return 'badgeCancelada';
      default:
        return 'badgeAprobada';
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      codigo: '',
      cliente: '',
      estado: '',
      prioridad: '',
      soloAtrasadas: false,
      soloEnProduccion: false,
      soloUrgentes: false,
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const abrirModalEstado = (orden: OrdenProduccion) => {
    setOrdenSeleccionada(orden);
    setNuevoEstado(orden.estado);
    setMostrarModalEstado(true);
  };

  const cerrarModalEstado = () => {
    setMostrarModalEstado(false);
    setOrdenSeleccionada(null);
    setNuevoEstado('');
  };

  const cambiarEstado = async () => {
    if (!ordenSeleccionada || !nuevoEstado) return;

    try {
      setActualizando(true);
      const res = await fetch(`/api/produccion/ordenes/${ordenSeleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        await cargarOrdenes();
        cerrarModalEstado();
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la orden');
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            <h3 style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Filtros de Búsqueda</h3>
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span>{mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros</span>
            <ChevronDown size={16} strokeWidth={2} style={{ transition: 'transform 0.2s', transform: mostrarFiltros ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>

        {mostrarFiltros && (
          <div className="formRow">
            <div className="formGroup">
              <label>Código de Orden</label>
              <input
                type="text"
                value={filtros.codigo}
                onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
                placeholder="Buscar por código..."
              />
            </div>
            <div className="formGroup">
              <label>Cliente</label>
              <input
                type="text"
                value={filtros.cliente}
                onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                placeholder="Buscar por cliente..."
              />
            </div>
            <div className="formGroup">
              <label>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE_PAGO">Pedido Aceptado</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="TERMINADA">Terminado</option>
                <option value="ENTREGADA">Entregado</option>
              </select>
            </div>
            <div className="formGroup">
              <label>Prioridad</label>
              <select
                value={filtros.prioridad}
                onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
              >
                <option value="">Todas las prioridades</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div className="formGroup">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div className="formGroup">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloAtrasadas}
                  onChange={(e) => setFiltros({ ...filtros, soloAtrasadas: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo atrasadas</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloEnProduccion}
                  onChange={(e) => setFiltros({ ...filtros, soloEnProduccion: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo en producción</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloUrgentes}
                  onChange={(e) => setFiltros({ ...filtros, soloUrgentes: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo urgentes</span>
              </label>
              <button
                onClick={limpiarFiltros}
                className="btn btnSecondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Espacio visual entre filtros y resumen */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Resumen */}
      <div className="grid3">
        <div className="card metricCard">
          <Calendar size={24} strokeWidth={2} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Total Órdenes</div>
          <div className="metricValue">{ordenes.length}</div>
        </div>
        <div className="card metricCard">
          <Clock size={24} strokeWidth={2} style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">En Producción</div>
          <div className="metricValue" style={{ color: 'var(--color-warning)' }}>
            {ordenes.filter(o => o.estado === 'EN_PRODUCCION').length}
          </div>
        </div>
        <div className="card metricCard">
          <AlertTriangle size={24} strokeWidth={2} style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Atrasadas</div>
          <div className="metricValue" style={{ color: 'var(--color-danger)' }}>
            {ordenes.filter(o => o.estaAtrasada).length}
          </div>
        </div>
        <div className="card metricCard">
          <AlertCircle size={24} strokeWidth={2} style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Urgentes</div>
          <div className="metricValue" style={{ color: 'var(--color-warning)' }}>
            {ordenes.filter(o => o.prioridad === 'URGENTE').length}
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="card tableContainer">
        <table>
          <thead>
            <tr>
              <th
                onClick={() => handleSort('codigo')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Código</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('cliente')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Cliente</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th>Producto</th>
              <th
                onClick={() => handleSort('fecha')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Fecha Entrega</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('prioridad')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Prioridad</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('estado')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Estado</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th>Tiempo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Cargando órdenes...
                </td>
              </tr>
            ) : ordenesOrdenadas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No se encontraron órdenes con los filtros actuales
                </td>
              </tr>
            ) : (
              ordenesOrdenadas.map((orden) => (
                <tr
                  key={orden.id}
                  style={{
                    background: orden.estaAtrasada ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      #{orden.codigoCorrelativoUnico}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>{orden.clienteNombre}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>{getProductoNombre(orden)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{getProductoCodigo(orden)}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>
                      {new Date(orden.fechaComprometida).toLocaleDateString('es-ES')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Creado: {new Date(orden.creadoEn).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getPrioridadBadgeClass(orden.prioridad)}`}>
                      {orden.prioridad}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoBadgeClass(orden.estado)}`}>
                      {getEstadoLabel(orden.estado)}
                    </span>
                  </td>
                  <td>
                    {orden.estaAtrasada ? (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={16} strokeWidth={2} style={{ marginRight: '0.25rem' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{orden.diasRetraso}d retraso</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-success)' }}>
                        <Clock size={16} strokeWidth={2} style={{ marginRight: '0.25rem' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{orden.diasRestantes}d restantes</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => abrirModalEstado(orden)}
                      className="btn btnPrimary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Cambiar Estado
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para cambiar estado */}
      {mostrarModalEstado && ordenSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '28rem', width: '100%', margin: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Cambiar Estado de Orden #{ordenSeleccionada.codigoCorrelativoUnico}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Cliente: {ordenSeleccionada.clienteNombre}
              </p>
            </div>
            <div className="formGroup">
              <label>Nuevo Estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
              >
                <option value="PENDIENTE_PAGO">Pedido Aceptado</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="TERMINADA">Terminado</option>
                <option value="ENTREGADA">Entregado</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={cerrarModalEstado}
                className="btn btnSecondary"
                disabled={actualizando}
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstado}
                className="btn btnPrimary"
                disabled={actualizando || nuevoEstado === ordenSeleccionada.estado}
              >
                {actualizando ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
