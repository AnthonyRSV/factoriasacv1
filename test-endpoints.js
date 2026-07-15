const BASE_URL = 'http://localhost:3000';

// Helper to log in and get the auth_token cookie
async function loginAndGetCookie(email, password) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed for ${email}: ${err.error}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie header returned for ${email}`);
  }

  const token = setCookie.split(';')[0];
  return token;
}

async function testSuite() {
  console.log('🏁 Starting Programmatic Verification Suite with Simplified Specs and Manual Kardex...');

  try {
    // 1. Programmatically log in to get session cookies for all roles
    console.log('\nLogging in for all roles...');
    
    const vendedorCookie = await loginAndGetCookie('vendedor@metal.com', 'vendedor123');
    console.log('✅ Logged in as VENDEDOR (Laura)');

    const almaceneroCookie = await loginAndGetCookie('almacenero@metal.com', 'almacenero123');
    console.log('✅ Logged in as ALMACENERO (Juan)');

    const jefeCookie = await loginAndGetCookie('jefe@metal.com', 'jefe123');
    console.log('✅ Logged in as JEFE_TALLER (Manuel)');

    const adminCookie = await loginAndGetCookie('admin@metal.com', 'admin123');
    console.log('✅ Logged in as ADMIN (Carlos)');

    // Headers with Cookie auth for each role
    const sellerHeaders = {
      'Content-Type': 'application/json',
      'Cookie': vendedorCookie
    };

    const almaceneroHeaders = {
      'Content-Type': 'application/json',
      'Cookie': almaceneroCookie
    };

    const jefeHeaders = {
      'Content-Type': 'application/json',
      'Cookie': jefeCookie
    };

    const adminHeaders = {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    };

    // ----------------------------------------------------
    // START TEST SUITE WORKFLOW
    // ----------------------------------------------------

    // 1. Check current inventory stock levels
    console.log('\nStep 1: Fetching initial inventory...');
    const invRes = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    if (!invRes.ok) {
      const errText = await invRes.text();
      throw new Error(`Failed to fetch inventory: ${invRes.status} - ${errText}`);
    }
    const { materials, fichas } = await invRes.json();
    
    const varilla58 = materials.find(m => m.codigo === 'MP-VAR-58');
    const initialStock = varilla58 ? varilla58.stockActual : 0;
    console.log(`✅ Success. Initial Varilla 5/8" stock: ${initialStock}`);

    const uboltFicha = fichas.find(f => f.codigo === 'PROD-UBOLT-58');
    if (!uboltFicha) throw new Error('Ficha PROD-UBOLT-58 not found');

    // 2. Create an order for Consorcio Damper (corporate exempt client, with Purchase Order OC)
    console.log('\nStep 2: Creating a new corporate order with Purchase Order (OC-9842)...');
    const orderPayload = {
      clienteNombre: 'Consorcio Damper',
      tipoCliente: 'EMPRESA',
      fechaComprometida: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      montoTotal: 600,
      montoAbonado: 0, // Exempt from 50% abono!
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      esUrgente: false,
      numeroOrdenCompra: 'OC-2026-9842', // Mandatory for corporate OC client
      detalles: [{
        productoId: uboltFicha.id,
        descripcionProducto: 'Abrazadera forma cuadrada de 3/4 x 3 x 16', // Point 1: Single description field
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
    
    if (order.estado !== 'APROBADA') {
      throw new Error(`Assertion failed: Order state is ${order.estado}, expected APROBADA (exemption approved)`);
    }

    if (!order.numeroOrdenCompra || !/^OC-\d{2}-\d{5}$/.test(order.numeroOrdenCompra)) {
      throw new Error(`Assertion failed: Order OC is "${order.numeroOrdenCompra}", expected strict format OC-YY-NNNNN (e.g. OC-26-00001)`);
    }
    console.log(`✅ Assertion passed: Strict OC format verified: ${order.numeroOrdenCompra}`);
    console.log('✅ Assertion passed: Corporate Order with Purchase Order is auto-approved with S/. 0 deposit.');

    // 3. Verify stock is NOT automatically deducted on order approval (Point 2: Discard rigid auto-egress)
    console.log('\nStep 3: Checking that inventory stock was NOT automatically deducted...');
    const invRes2 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData2 = await invRes2.json();
    const varilla58After = invData2.materials.find(m => m.codigo === 'MP-VAR-58');
    const afterStock = varilla58After ? varilla58After.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" stock after approval: ${afterStock}`);
    
    if (afterStock !== initialStock) {
      throw new Error(`Assertion failed: Stock is ${afterStock}, expected it to remain unchanged at ${initialStock}`);
    }
    console.log('✅ Assertion passed: Auto stock deduction is disabled.');

    // 4. Register a manual consumption (EGRESO) of 28.0 meters by the Almacenero (Point 2: Flexible manual movements)
    console.log('\nStep 4: Registering a manual material consumption (EGRESO) of 28.0 meters...');
    const egressRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: almaceneroHeaders,
      body: JSON.stringify({
        materiaPrimaId: varilla58After.id,
        cantidad: 28.0,
        tipoMovimiento: 'EGRESO',
        motivo: `Consumo para la fabricación de la Orden #${order.codigoCorrelativoUnico}`
      })
    });
    if (!egressRes.ok) {
      const err = await egressRes.json();
      throw new Error(`Failed to register manual egress: ${err.error}`);
    }
    console.log('✅ Success. Manual egress consumption logged.');

    // 5. Verify stock deduction after manual egress
    console.log('\nStep 5: Verifying stock deduction after manual egress...');
    const invRes3 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData3 = await invRes3.json();
    const varilla58Egress = invData3.materials.find(m => m.codigo === 'MP-VAR-58');
    const stockAfterEgress = varilla58Egress ? varilla58Egress.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" stock after egress: ${stockAfterEgress}`);
    
    const expectedStock = initialStock - 28.0;
    if (stockAfterEgress !== expectedStock) {
      throw new Error(`Assertion failed: Stock is ${stockAfterEgress}, expected ${expectedStock}`);
    }
    console.log('✅ Assertion passed: Material stock correctly updated via manual egress.');

    // 6. Verify Kardex log contains manual egress entry
    console.log('\nStep 6: Verifying manual Kardex entry...');
    const kdxEntry = invData3.kardex.find(k => k.tipoMovimiento === 'EGRESO' && k.motivo.includes(`Orden #${order.codigoCorrelativoUnico}`));
    if (!kdxEntry) {
      throw new Error('Kardex log manual entry not found');
    }
    console.log(`✅ Success. Found manual Kardex entry: [${kdxEntry.tipoMovimiento}] - Cantidad: ${kdxEntry.cantidad} - Motivo: ${kdxEntry.motivo}`);

    // 7. Restock Varilla 5/8" with 100 units from distributor Ansec (Almacenero manual refill)
    console.log('\nStep 7: Restocking Varilla 5/8" with 100 units manually...');
    const restockRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: almaceneroHeaders,
      body: JSON.stringify({
        materiaPrimaId: varilla58After.id,
        cantidad: 100,
        tipoMovimiento: 'INGRESO',
        motivo: 'Ingreso por reabastecimiento mensual. Distribuidor Ansec'
      })
    });
    if (!restockRes.ok) throw new Error('Restock failed');
    console.log('✅ Success. Refill completed.');

    // 8. Verify inventory stock increased by 100
    console.log('\nStep 8: Checking inventory stock increase...');
    const invRes4 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData4 = await invRes4.json();
    const varilla58Final = invData4.materials.find(m => m.codigo === 'MP-VAR-58');
    const finalStock = varilla58Final ? varilla58Final.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" final stock: ${finalStock}`);
    if (finalStock !== (stockAfterEgress + 100)) {
      throw new Error(`Assertion failed: Final stock is ${finalStock}, expected ${stockAfterEgress + 100}`);
    }
    console.log('✅ Assertion passed: Stock correctly increased by 100 units.');

    // 9. Authorize material exit (Jefe de Taller)
    console.log('\nStep 9: Authorizing material release physical exit...');
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

    console.log('\n🎉 ALL VERIFICATION PASSED SUCCESSFULLY! The application with manual Kardex and OC rules works 100% correctly.');

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

testSuite();
