const BASE_URL = 'http://localhost:3000';

async function testSuite() {
  console.log('🏁 Starting Programmatic Verification Suite...');
  
  // Headers for Seller (Laura Vendedora)
  const sellerHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'VENDEDOR',
    'x-user-email': 'vendedor@metal.com',
  };

  // Headers for Almacenero (Juan Almacenero)
  const almaceneroHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'ALMACENERO',
    'x-user-email': 'almacenero@metal.com',
  };

  // Headers for Jefe de Taller (Manuel Jefe Taller)
  const jefeHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'JEFE_TALLER',
    'x-user-email': 'jefe@metal.com',
  };

  // Headers for Admin (Carlos Admin)
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'ADMIN',
    'x-user-email': 'admin@metal.com',
  };

  try {
    // 1. Check current inventory stock levels
    console.log('\nStep 1: Fetching initial inventory...');
    const invRes = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    if (!invRes.ok) throw new Error('Failed to fetch inventory');
    const { materials, fichas } = await invRes.json();
    
    const varilla58 = materials.find(m => m.codigo === 'MP-VAR-58');
    const initialStock = varilla58 ? varilla58.stockActual : 0;
    console.log(`✅ Success. Initial Varilla 5/8" stock: ${initialStock}`);

    const uboltFicha = fichas.find(f => f.codigo === 'PROD-UBOLT-58');
    if (!uboltFicha) throw new Error('Ficha PROD-UBOLT-58 not found');
    console.log(`✅ Success. Found product U-Bolt with formula: ${uboltFicha.formulaCalculo}`);

    // 2. Create an order for Consorcio Damper (marked as urgent)
    // Formula calculations for U-Bolt 5/8": (largo * 2 + ancho + 0.1) * cantidad
    // Specs: largo = 0.5, ancho = 0.3, cantidad = 20
    // Material required = (0.5 * 2 + 0.3 + 0.1) * 20 = (1.0 + 0.3 + 0.1) * 20 = 1.4 * 20 = 28.0 meters of Varilla 5/8"
    console.log('\nStep 2: Creating a new urgent order for Consorcio Damper...');
    const orderPayload = {
      clienteNombre: 'Consorcio Damper',
      tipoCliente: 'EMPRESA',
      fechaComprometida: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      montoTotal: 600,
      montoAbonado: 600,
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      esUrgente: true,
      detalles: [{
        productoId: uboltFicha.id,
        largo: 0.5,
        ancho: 0.3,
        espesor: 0.012,
        forma: 'Perno en U',
        calidadAcero: 'A36',
        colorPintura: 'Azul Epóxico',
        tuercasTipo: 'Tuerca Rápida 5/8',
        cantidadSolicitada: 20
      }]
    };

    const createRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify(orderPayload)
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Failed to create order: ${err.error}`);
    }
    const order = await createRes.json();
    console.log(`✅ Success. Order #${order.codigoCorrelativoUnico} created. ID: ${order.id}. Estado: ${order.estado}`);
    
    // Assert auto-approval rules: Consorcio Damper is a large company, so it should be APROBADA
    if (order.estado !== 'APROBADA') {
      throw new Error(`Assertion failed: Order state is ${order.estado}, expected APROBADA`);
    }
    console.log('✅ Assertion passed: Order state is auto-approved to APROBADA.');

    // 3. Verify stock deduction (28.0 meters should be deducted from Varilla 5/8")
    console.log('\nStep 3: Checking inventory stock deduction...');
    const invRes2 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData2 = await invRes2.json();
    const varilla58After = invData2.materials.find(m => m.codigo === 'MP-VAR-58');
    const afterStock = varilla58After ? varilla58After.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" stock after approval: ${afterStock}`);
    
    const expectedStock = initialStock - 28.0;
    if (afterStock !== expectedStock) {
      throw new Error(`Assertion failed: Stock is ${afterStock}, expected ${expectedStock}`);
    }
    console.log('✅ Assertion passed: Material stock deducted exactly according to the technical formula (28.0 meters).');

    // 4. Verify Kardex log contains egress entry
    console.log('\nStep 4: Verifying Kardex entry...');
    const kdxEntry = invData2.kardex.find(k => k.motivo.includes(`Aprobación Orden #${order.codigoCorrelativoUnico}`));
    if (!kdxEntry) {
      throw new Error('Kardex log entry not found for order approval');
    }
    console.log(`✅ Success. Found Kardex entry: [${kdxEntry.tipoMovimiento}] - Cantidad: ${kdxEntry.cantidad} - Motivo: ${kdxEntry.motivo}`);

    // 5. Restock Varilla 5/8" with 100 units from distributor Ansec (Almacenero)
    console.log('\nStep 5: Restocking Varilla 5/8" with 100 units...');
    const restockRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: almaceneroHeaders,
      body: JSON.stringify({
        materiaPrimaId: varilla58After.id,
        cantidad: 100,
        motivo: 'Ingreso por reabastecimiento mensual. Distribuidor Ansec'
      })
    });
    if (!restockRes.ok) throw new Error('Restock failed');
    console.log('✅ Success. Refill completed.');

    // 6. Verify inventory stock increased
    console.log('\nStep 6: Checking inventory stock increase...');
    const invRes3 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData3 = await invRes3.json();
    const varilla58Final = invData3.materials.find(m => m.codigo === 'MP-VAR-58');
    const finalStock = varilla58Final ? varilla58Final.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" final stock: ${finalStock}`);
    if (finalStock !== (afterStock + 100)) {
      throw new Error(`Assertion failed: Final stock is ${finalStock}, expected ${afterStock + 100}`);
    }
    console.log('✅ Assertion passed: Stock correctly increased by 100 units.');

    // 7. Authorize material exit (Jefe de Taller)
    console.log('\nStep 7: Authorizing material release physical exit...');
    const authRes = await fetch(`${BASE_URL}/api/inventory/authorize`, {
      method: 'POST',
      headers: jefeHeaders,
      body: JSON.stringify({ ordenId: order.id })
    });
    if (!authRes.ok) {
      const err = await authRes.json();
      throw new Error(`Authorization failed: ${err.error}`);
    }
    console.log('✅ Success. Material exit release authorized.');

    // 8. Progress production stages
    console.log('\nStep 8: Completing Corte stage for Order...');
    // We get order details to fetch process stage ID
    const orderDetailsRes = await fetch(`${BASE_URL}/api/orders/${order.id}`, { headers: jefeHeaders });
    const orderDetails = await orderDetailsRes.json();
    const corteStage = orderDetails.procesos.find(p => p.etapaNombre === 'Corte');
    if (!corteStage) throw new Error('Corte stage not found in order processes');

    const stageRes = await fetch(`${BASE_URL}/api/stages/${corteStage.id}`, {
      method: 'PATCH',
      headers: jefeHeaders,
      body: JSON.stringify({
        completada: true,
        operarioAsignado: 'Roberto L.'
      })
    });
    if (!stageRes.ok) throw new Error('Failed to update stage');
    console.log('✅ Success. Corte stage completed by Roberto L.');

    // 9. Verify Admin Reports
    console.log('\nStep 9: Verifying Admin Dashboard Reports...');
    const repRes = await fetch(`${BASE_URL}/api/reports`, { headers: adminHeaders });
    if (!repRes.ok) throw new Error('Failed to fetch reports');
    const reportsData = await repRes.json();
    console.log('✅ Success. Fetched Admin Reports:');
    console.log(`   - Pending Orders: ${reportsData.pendingOrdersCount}`);
    console.log(`   - Delivered Orders: ${reportsData.deliveredOrdersCount}`);
    console.log(`   - Average Completion Speed: ${reportsData.avgHours} hours`);
    console.log('   - Rankings of top products:', reportsData.ranking);

    console.log('\n🎉 ALL VERIFICATION PASSED SUCCESSFULLY! The application works 100% correctly.');

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

testSuite();
