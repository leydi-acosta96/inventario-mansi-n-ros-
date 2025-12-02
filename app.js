// ========================================
// CONFIGURACIÓN BASE
// ========================================
const BASE_URL = "https://api.sheety.co/301327363ae1c8d017800bb4566af87c/inventarioMansión";


// ========================================
// CARGAR PRODUCTOS
// ========================================
document.getElementById("btnCargarProductos").addEventListener("click", cargarProductos);

async function cargarProductos() {
  const res = await fetch(`${BASE_URL}/productos`);
  const data = await res.json();

  mostrarProductos(data.productos);
}

function mostrarProductos(lista) {
  const cont = document.getElementById("listaProductos");
  cont.innerHTML = "";

  lista.forEach(p => {
    cont.innerHTML += `
      <div class="producto">
        <strong>ID:</strong> ${p.idProducto}<br>
        <strong>Producto:</strong> ${p.nombreProducto}<br>
        <strong>Categoría:</strong> ${p.categoria}<br>
        <strong>Emprendedora:</strong> ${p.emprendedora}<br>
        <strong>Precio:</strong> $${p.precio}<br>
        <strong>Stock:</strong> ${p.stock}<br>
        <strong>Estado:</strong> ${p.estado}<br>
        <strong>Fecha:</strong> ${p.fecha}<br>
      </div>
      <hr>
    `;
  });
}


// ========================================
// REGISTRAR VENTA
// ========================================
document.getElementById("formVenta").addEventListener("submit", registrarVenta);

async function registrarVenta(e) {
  e.preventDefault();

  const idProd = document.getElementById("idProducto").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const canal = document.getElementById("canal").value;

  // 1. Obtener producto
  const productRes = await fetch(`${BASE_URL}/productos/${idProd}`);
  const productData = await productRes.json();
  const p = productData.producto;

  if (!p) {
    alert("❌ Producto no encontrado");
    return;
  }

  if (p.stock < cantidad) {
    alert("❌ Stock insuficiente");
    return;
  }

  const nuevoStock = p.stock - cantidad;

  // 2. Actualizar stock (PUT)
  await fetch(`${BASE_URL}/productos/${idProd}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      producto: {
        stock: nuevoStock
      }
    })
  });

  // 3. Registrar movimiento (POST)
  await fetch(`${BASE_URL}/movimientos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movimiento: {
        idProducto: idProd,
        tipo: "venta",
        cantidad: cantidad,
        canal: canal,
        emprendedora: p.emprendedora,
        fecha: new Date().toISOString()
      }
    })
  });

  alert("✔️ Venta registrada correctamente");
  cargarProductos();
}


// ========================================
// CARGAR MOVIMIENTOS
// ========================================
document.getElementById("btnCargarMovimientos").addEventListener("click", cargarMovimientos);

async function cargarMovimientos() {
  const res = await fetch(`${BASE_URL}/movimientos`);
  const data = await res.json();
  mostrarMovimientos(data.movimientos);
}

function mostrarMovimientos(lista) {
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";

  lista.forEach(m => {
    cont.innerHTML += `
      <div class="mov">
        <strong>ID Mov:</strong> ${m.idMovimientos}<br>
        <strong>ID Producto:</strong> ${m.idProducto}<br>
        <strong>Tipo:</strong> ${m.tipo}<br>
        <strong>Cantidad:</strong> ${m.cantidad}<br>
        <strong>Canal:</strong> ${m.canal}<br>
        <strong>Emprendedora:</strong> ${m.emprendedora}<br>
        <strong>Fecha:</strong> ${m.fecha}<br>
      </div>
      <hr>
    `;
  });
}
