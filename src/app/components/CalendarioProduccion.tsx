'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

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

export default function CalendarioProduccion() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'mes' | 'semana'>('mes');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, [fechaActual, vista]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const inicioPeriodo = getInicioPeriodo();
      const finPeriodo = getFinPeriodo();
      
      const res = await fetch(`/api/produccion/ordenes?fechaInicio=${inicioPeriodo.toISOString()}&fechaFin=${finPeriodo.toISOString()}`);
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

  const getInicioPeriodo = () => {
    if (vista === 'mes') {
      return new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
      const day = fechaActual.getDay();
      const diff = fechaActual.getDate() - day;
      return new Date(fechaActual.setDate(diff));
    }
  };

  const getFinPeriodo = () => {
    if (vista === 'mes') {
      return new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    } else {
      const inicio = getInicioPeriodo();
      return new Date(inicio.setDate(inicio.getDate() + 6));
    }
  };

  const navegar = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (vista === 'mes') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (direccion === 'siguiente' ? 1 : -1));
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + (direccion === 'siguiente' ? 7 : -7));
    }
    setFechaActual(nuevaFecha);
  };

  const obtenerOrdenesDelDia = (fecha: Date) => {
    return ordenes.filter(orden => {
      const fechaOrden = new Date(orden.fechaComprometida);
      return fechaOrden.toDateString() === fecha.toDateString();
    });
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'ALTA':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getPrioridadBackgroundColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'rgba(239, 68, 68, 0.15)';
      case 'ALTA':
        return 'rgba(245, 158, 11, 0.15)';
      default:
        return 'rgba(99, 102, 241, 0.15)';
    }
  };

  const getPrioridadTextColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return '#dc2626';
      case 'ALTA':
        return '#d97706';
      default:
        return '#4f46e5';
    }
  };

  const getPrioridadBorderColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return '#dc2626';
      case 'ALTA':
        return '#d97706';
      default:
        return '#4f46e5';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'bg-gray-100 text-gray-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'EN_PRODUCCION':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINADA':
        return 'bg-blue-100 text-blue-800';
      case 'ENTREGADA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const abrirModalOrden = (orden: OrdenProduccion) => {
    setOrdenSeleccionada(orden);
    setNuevoEstado(orden.estado);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
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
        cerrarModal();
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

  const renderVistaMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = [];
    
    const diaInicio = primerDia.getDay();
    for (let i = 0; i < diaInicio; i++) {
      diasMes.push(null);
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasMes.push(new Date(año, mes, dia));
    }

    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
            {nombreMes}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navegar('anterior')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={() => setFechaActual(new Date())}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Hoy
            </button>
            <button
              onClick={() => navegar('siguiente')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {nombresDias.map(dia => (
            <div key={dia} style={{ 
              background: 'white', 
              padding: '0.75rem 0.5rem', 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {dia}
            </div>
          ))}
          {diasMes.map((fecha, index) => {
            const esHoy = fecha && fecha.toDateString() === hoy.toDateString();
            const ordenesDelDia = fecha ? obtenerOrdenesDelDia(fecha) : [];
            
            return (
              <div
                key={index}
                style={{
                  minHeight: '120px',
                  padding: '0.5rem',
                  background: fecha ? 'white' : 'rgba(241, 245, 249, 0.5)',
                  cursor: fecha ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (fecha) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                }}
                onMouseOut={(e) => {
                  if (fecha) e.currentTarget.style.background = 'white';
                }}
              >
                {fecha && (
                  <>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: esHoy ? 700 : 500,
                      color: esHoy ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      marginBottom: '0.5rem',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: esHoy ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                    }}>
                      {fecha.getDate()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {ordenesDelDia.slice(0, 3).map(orden => (
                        <div
                          key={orden.id}
                          onClick={() => abrirModalOrden(orden)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: getPrioridadBackgroundColor(orden.prioridad),
                            color: getPrioridadTextColor(orden.prioridad),
                            borderLeft: `3px solid ${getPrioridadBorderColor(orden.prioridad)}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`${orden.codigoCorrelativoUnico} - ${orden.clienteNombre}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>#{orden.codigoCorrelativoUnico}</span>
                          <span style={{ marginLeft: '4px' }}>{orden.clienteNombre.slice(0, 8)}{orden.clienteNombre.length > 8 ? '...' : ''}</span>
                        </div>
                      ))}
                      {ordenesDelDia.length > 3 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: 'var(--color-text-muted)',
                          padding: '2px 6px',
                          fontStyle: 'italic'
                        }}>
                          +{ordenesDelDia.length - 3} más
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaSemana = () => {
    const inicioSemana = getInicioPeriodo();
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dias = [];
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Semana del {inicioSemana.toLocaleDateString('es-ES')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navegar('anterior')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={() => setFechaActual(new Date())}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Hoy
            </button>
            <button
              onClick={() => navegar('siguiente')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {dias.map((fecha, index) => {
            const esHoy = fecha.toDateString() === hoy.toDateString();
            const ordenesDelDia = obtenerOrdenesDelDia(fecha);
            
            return (
              <div
                key={index}
                style={{
                  minHeight: '200px',
                  padding: '0.75rem',
                  background: 'white',
                  transition: 'background 0.15s',
                  ...(esHoy ? { boxShadow: 'inset 0 0 0 2px var(--color-primary)' } : {})
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {nombresDias[index]}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: esHoy ? 700 : 600,
                    color: esHoy ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    marginTop: '0.25rem'
                  }}>
                    {fecha.getDate()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ordenesDelDia.map(orden => (
                    <div
                      key={orden.id}
                      onClick={() => abrirModalOrden(orden)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: getPrioridadBackgroundColor(orden.prioridad),
                        color: getPrioridadTextColor(orden.prioridad),
                        borderLeft: `4px solid ${getPrioridadBorderColor(orden.prioridad)}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        ...(orden.estaAtrasada ? { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.3)' } : {})
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = orden.estaAtrasada ? '0 0 0 2px rgba(239, 68, 68, 0.3)' : 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>#{orden.codigoCorrelativoUnico}</span>
                        {orden.estaAtrasada && (
                          <AlertTriangle size={12} strokeWidth={2} style={{ color: getPrioridadTextColor(orden.prioridad) }} />
                        )}
                      </div>
                      <div style={{ fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {orden.clienteNombre}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        display: 'inline-block',
                        fontWeight: 600
                      }}>
                        {getEstadoLabel(orden.estado)}
                      </div>
                      {orden.estaAtrasada && (
                        <div style={{ fontSize: '0.65rem', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertTriangle size={10} strokeWidth={2} />
                          <span>{orden.diasRetraso}d retraso</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {ordenesDelDia.length === 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                      padding: '1rem',
                      fontStyle: 'italic'
                    }}>
                      Sin órdenes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Controles de Vista */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <div className="roleSelectorBar">
          <button
            onClick={() => setVista('mes')}
            className={`roleBtn ${vista === 'mes' ? 'roleBtnActive' : ''}`}
          >
            Vista Mensual
          </button>
          <button
            onClick={() => setVista('semana')}
            className={`roleBtn ${vista === 'semana' ? 'roleBtnActive' : ''}`}
          >
            Vista Semanal
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Carga del taller: <strong>{ordenes.length}</strong> órdenes
        </div>
      </div>

      {/* Espacio entre controles y calendario */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Calendario */}
      {loading ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '24rem' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        </div>
      ) : (
        <div className="card">
          {vista === 'mes' ? renderVistaMes() : renderVistaSemana()}
        </div>
      )}

      {/* Espacio entre calendario y leyenda */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Leyenda */}
      <div className="card" style={{ padding: '1rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Leyenda de Prioridades</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderLeft: '2px solid var(--color-primary)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderLeft: '2px solid var(--color-warning)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Alta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderLeft: '2px solid var(--color-danger)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Urgente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem' }}>
            <AlertTriangle size={16} strokeWidth={2} style={{ color: 'var(--color-danger)', marginRight: '0.5rem' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Atrasado</span>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Orden */}
      {mostrarModal && ordenSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '32rem', width: '100%', margin: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Orden #{ordenSeleccionada.codigoCorrelativoUnico}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {ordenSeleccionada.clienteNombre}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Estado Actual:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{getEstadoLabel(ordenSeleccionada.estado)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Prioridad:</span>
                <span style={{ fontWeight: 600, color: ordenSeleccionada.prioridad === 'URGENTE' ? 'var(--color-danger)' : ordenSeleccionada.prioridad === 'ALTA' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                  {ordenSeleccionada.prioridad}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Fecha Entrega:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {new Date(ordenSeleccionada.fechaComprometida).toLocaleDateString('es-ES')}
                </span>
              </div>
              {ordenSeleccionada.estaAtrasada && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>⚠️ Atrasada:</span>
                  <span style={{ fontWeight: 600 }}>{ordenSeleccionada.diasRetraso} días</span>
                </div>
              )}
              {!ordenSeleccionada.estaAtrasada && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>⏱️ Restante:</span>
                  <span style={{ fontWeight: 600 }}>{ordenSeleccionada.diasRestantes} días</span>
                </div>
              )}
              {ordenSeleccionada.detalles && ordenSeleccionada.detalles.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Producto:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {ordenSeleccionada.detalles[0].producto?.nombre || 'No especificado'}
                  </span>
                </div>
              )}
            </div>

            <div className="formGroup">
              <label>Cambiar Estado</label>
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
                onClick={cerrarModal}
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
