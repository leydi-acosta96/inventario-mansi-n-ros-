/* ===========================
   CONFIGURACIÓN SHEETY
   =========================== */
const BASE_URL = "https://api.sheety.co/301327363ae1c8d017800bb4566af87c/inventarioMansión";

/* ---------------------------
   UTIL - mostrar errores
   --------------------------- */
function showError(err){
  console.error(err);
  alert("Error: " + (err.message || "Ocurrió un problema. Revisa la consola."));
}

/* ===========================
   PRODUCTOS - CARGAR / LISTAR
   =========================== */
document.getElementById("btnCargarProductos").addEventListener("click", cargarProductos);

async function cargarProductos(){
  try {
    const res = await fetch(`${BASE_URL}productos`);
    if(!res.ok) throw new Error("Error al obtener productos: " + res.status);
    const data = await res.json();
    const lista = data.productos;
    mostrarProductos(lista);
    actualizarDashboard(lista);
  } catch(err) {
    showError(err);
  }
}

function mostrarProductos(lista){
  const cont = document.getElementById("listaProductos");
  cont.innerHTML = "";
  if(!lista || lista.length === 0){
    cont.innerHTML = "<p>No hay productos.</p>";
    return;
  }

  lista.forEach(p => {
    // Sheety convierte filas a camelCase; si tus nombres son distintos revisa aquí
    const id = p.id || p.idProducto || p.id_producto || "";
    cont.innerHTML += `
      <div class="producto">
        <strong>ID:</strong> ${id}<br>
        <strong>Producto:</strong> ${p.nombreProducto || p.nombre_producto || ""}<br>
        <strong>Categoría:</strong> ${p.categoria || ""}<br>
        <strong>Emprendedora:</strong> ${p.emprendedora || ""}<br>
        <strong>Precio:</strong> $${p.precio || 0}<br>
        <strong>Stock:</strong> ${p.stock || 0}<br>
        <strong>Estado:</strong> ${p.estado || ""}<br>
        <strong>Fecha:</strong> ${p.fecha || ""}<br>
        <div style="margin-top:8px;">
          <button onclick="cargarProductoEnFormulario('${id}')">Editar</button>
          <button onclick="eliminarProducto('${id}')">Eliminar</button>
        </div>
      </div>`;
  });
}

/* ===========================
   PRODUCTOS - AGREGAR / EDITAR
   =========================== */
document.getElementById("productoForm").addEventListener("submit", async function(e){
  e.preventDefault();
  try {
    const id = document.getElementById("id_producto").value.trim();
    const payload = {
      producto: {
        id_producto: id || undefined,
        nombre_producto: document.getElementById("nombre_producto").value,
        categoria: document.getElementById("categoria").value,
        emprendedora: document.getElementById("emprendedora").value,
        precio: parseFloat(document.getElementById("precio").value) || 0,
        stock: parseInt(document.getElementById("stock").value) || 0,
        estado: document.getElementById("estado").value,
        fecha: document.getElementById("fecha").value
      }
    };

    if(id){
      // EDITAR: usar PUT al registro con ese ID
      const res = await fetch(`${BASE_URL}productos/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("Error al actualizar producto");
      alert("Producto actualizado");
    } else {
      // CREAR
      const res = await fetch(`${BASE_URL}productos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("Error al crear producto");
      alert("Producto creado");
    }

    // limpiar form y recargar
    document.getElementById("productoForm").reset();
    document.getElementById("btnCancelarEdicion").style.display = "none";
    cargarProductos();
  } catch(err){
    showError(err);
  }
});

// cargar datos de producto en formulario para editar
async function cargarProductoEnFormulario(id){
  try {
    const res = await fetch(`${BASE_URL}productos/${id}`);
    if(!res.ok) throw new Error("No se pudo obtener el producto");
    const data = await res.json();
    const p = data.producto || data;

    // mapear a campos del formulario (usar nombres de sheet)
    document.getElementById("id_producto").value = id;
    document.getElementById("nombre_producto").value = p.nombreProducto || p.nombre_producto || "";
    document.getElementById("categoria").value = p.categoria || "";
    document.getElementById("emprendedora").value = p.emprendedora || "";
    document.getElementById("precio").value = p.precio || 0;
    document.getElementById("stock").value = p.stock || 0;
    document.getElementById("estado").value = p.estado || "Disponible";
    document.getElementById("fecha").value = p.fecha ? p.fecha.split("T")[0] : "";

    document.getElementById("btnCancelarEdicion").style.display = "inline-block";
  } catch(err){
    showError(err);
  }
}

document.getElementById("btnCancelarEdicion").addEventListener("click", function(){
  document.getElementById("productoForm").reset();
  document.getElementById("btnCancelarEdicion").style.display = "none";
});

// eliminar producto
async function eliminarProducto(id){
  if(!confirm("¿Eliminar producto?")) return;
  try {
    const res = await fetch(`${BASE_URL}productos/${id}`, { method: "DELETE" });
    if(!res.ok) throw new Error("Error al eliminar");
    alert("Producto eliminado");
    cargarProductos();
  } catch(err){
    showError(err);
  }
}

/* ===========================
   VENTAS - Registrar venta
   =========================== */
document.getElementById("formVenta").addEventListener("submit", async function(e){
  e.preventDefault();
  try {
    const id = document.getElementById("idProducto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const canal = document.getElementById("canal").value;

    // obtener producto
    const resP = await fetch(`${BASE_URL}productos/${id}`);
    if(!resP.ok) throw new Error("Producto no encontrado");
    const pd = await resP.json();
    const p = pd.producto || pd;

    const currentStock = parseInt(p.stock || 0);
    if(currentStock < cantidad) return alert("Stock insuficiente");

    const nuevoStock = currentStock - cantidad;

    // actualizar stock
    const resUpd = await fetch(`${BASE_URL}productos/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ producto: { stock: nuevoStock } })
    });
    if(!resUpd.ok) throw new Error("No se pudo actualizar stock");

    // registrar movimiento
    const movimientoPayload = {
      movimiento: {
        idProducto: id,
        tipo: "venta",
        cantidad: cantidad,
        canal: canal,
        emprendedora: p.emprendedora || "",
        fecha: new Date().toISOString()
      }
    };

    const resMov = await fetch(`${BASE_URL}movimientos`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(movimientoPayload)
    });

    if(!resMov.ok) throw new Error("No se pudo registrar movimiento");

    alert("Venta registrada correctamente");
    cargarProductos();
  } catch(err){
    showError(err);
  }
});

/* ===========================
   MOVIMIENTOS - CARGAR / LISTAR
   =========================== */
document.getElementById("btnCargarMovimientos").addEventListener("click", cargarMovimientos);

async function cargarMovimientos(){
  try {
    const res = await fetch(`${BASE_URL}movimientos`);
    if(!res.ok) throw new Error("Error al cargar movimientos");
    const data = await res.json();
    mostrarMovimientos(data.movimientos);
  } catch(err){
    showError(err);
  }
}

function mostrarMovimientos(lista){
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";
  if(!lista || lista.length === 0){
    cont.innerHTML = "<p>No hay movimientos.</p>";
    return;
  }

  lista.forEach(m => {
    cont.innerHTML += `
      <div class="mov">
        <strong>ID Mov:</strong> ${m.idMovimientos || m.id || ""}<br>
        <strong>ID Producto:</strong> ${m.idProducto || m.id_producto || ""}<br>
        <strong>Tipo:</strong> ${m.tipo || ""}<br>
        <strong>Cantidad:</strong> ${m.cantidad || ""}<br>
        <strong>Canal:</strong> ${m.canal || ""}<br>
        <strong>Emprendedora:</strong> ${m.emprendedora || ""}<br>
        <strong>Fecha:</strong> ${m.fecha || ""}<br>
      </div>`;
  });
}

/* ===========================
   DASHBOARD - resumen sencillo
   =========================== */
function actualizarDashboard(productos){
  try {
    const cont = document.getElementById("dashboardContent");
    const totalProductos = productos.length;
    const productosBajoStock = productos.filter(p => (p.stock || 0) <= 2).length;
    cont.innerHTML = `
      <div class="item"><strong>Total productos:</strong> ${totalProductos}</div>
      <div class="item"><strong>Productos con stock bajo (&le;2):</strong> ${productosBajoStock}</div>
    `;
  } catch(err){
    console.warn(err);
  }
}

// cargar inicialmente
cargarProductos();
