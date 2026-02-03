let usuarios = {};
async function cargarUsuarios() {
  const response = await fetch(
    "https://docs.google.com/spreadsheets/d/1GuFdjXY38mc7_EBMA4HxU18L_-EmHCnaOGyfNo3u85w/export?format=csv&gid=0");
  
  const texto = await response.text();
  const lineas = texto.split("\n").filter(l => l.trim() !== "");

  usuarios = {};

  for (let i = 1; i < lineas.length; i++) {
    const [id, clave, nombre] = lineas[i].split(",");
    usuarios[id] = {
      CLAVE: clave,
      NOMBRE: nombre
    };
  }

  console.log("Usuarios cargados:", usuarios);
}


let usuarioActual = null;

async function iniciarSesion() {
  if (Object.keys(usuarios).length === 0) {
    await cargarUsuarios();
  }

  const usuario = document.getElementById("usuario").value.trim();
  const clave = document.getElementById("clave").value.trim();
  const user = usuarios[usuario];


  if (user && user.CLAVE === clave) {
    usuarioActual = usuario;
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("app").classList.add("fade-in");
    document.getElementById("nombreUsuario").innerText = user.NOMBRE || usuario;
    if (usuario === "admin") document.getElementById("panelAdmin").classList.remove("hidden");
    await cargarDatos();
    cambiarMes();
    actualizarVisibilidadFooter();
  } else {
    alert("Usuario o clave incorrectos.");
  }
}

function cerrarSesion() {
  usuarioActual = null;
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("panelAdmin").classList.add("hidden");
  document.getElementById("usuario").value = "";
  document.getElementById("clave").value = "";
  document.getElementById("tablaCalificaciones").innerHTML = "";
  actualizarVisibilidadFooter();

}

function cambiarMes() {
  const mes = document.getElementById("selectorMes").value;
  renderCalificaciones(mes);
}

async function cargarDatos() {
  const url = "https://docs.google.com/spreadsheets/d/1QTwxp5aIYmBT4Zv5_EUyaTXp0mgoOYRr_1Yzw37aync/export?format=csv&gid=0";
  const response = await fetch(url);
  const texto = await response.text();
  const lineas = texto.split("\n").filter(l => l.trim() !== "");
  const headers = lineas[0].split(",");
  datos = {};
  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i].split(",");
    const legajo = fila[0];
    const nombre = fila[1];
    const mes = fila[2];
    if (!datos[legajo]) datos[legajo] = { nombre, calificaciones: {} };
    datos[legajo].calificaciones[mes] = {};
    for (let j = 3; j < headers.length - 1; j++) {
      datos[legajo].calificaciones[mes][headers[j]] = parseFloat(fila[j]) || 0;
    }
    datos[legajo].calificaciones[mes]["TOTAL"] = parseFloat(fila[headers.length - 1]) || 0;
  }
}

const esMobile = window.innerWidth <= 768;

function renderCalificaciones(mesSeleccionado) {

  const calif = datos[usuarioActual]?.calificaciones || {};
  const categorias = [
    "Dedicacion Interna",
    "Roperia",
    "Asistencia Diaria",
    "Total Orden Interno",
    "Instruccion",
    "Asistencia Obligatoria",
    "Asistencia Accidental",
    "Guardia",
    "Puntos Negativos",
    "Puntos Especiales",
    "TOTAL"
  ];

  const ordenMeses = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];

  let totales = {};
  for (let c of categorias) totales[c] = 0;

  const esMobile = window.innerWidth <= 768;
  let html = "";

  /* =========================
     VISTA MOBILE (CARDS)
  ==========================*/
  if (esMobile) {

    for (let mes of ordenMeses) {
      if (mesSeleccionado !== "ANUAL" && mes !== mesSeleccionado) continue;
      const fila = calif[mes];
      if (!fila) continue;

      html += `
        <div class="card-mes fade-in">
          <div class="card-header">${mes}</div>
          <div class="card-body">
      `;

      for (let c of categorias) {
        const val = parseFloat(fila[c]) || 0;
        totales[c] += val;

      if (c === "TOTAL") {
  html += `
    <div class="fila-total">
      <span>${c}</span>
      <strong>${val.toFixed(2)}</strong>
    </div>
  `;
} else {
  const claseExtra = c === "Puntos Negativos" && val < 0 ? "negativo" : "";
  html += `
    <div class="fila-dato ${claseExtra}">
      <span>${c}</span>
      <span>${val.toFixed(2)}</span>
    </div>
  `;
}

      }

      html += `
          </div>
        </div>
      `;
    }

    if (mesSeleccionado === "ANUAL") {
      html += `
        <div class="card-mes total-anual fade-in">
          <div class="card-header">TOTAL ANUAL</div>
          <div class="card-body">
      `;

      for (let c of categorias) {
        html += `
          <div class="fila-dato">
            <span>${c}</span>
            <strong>${totales[c].toFixed(2)}</strong>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

  /* =========================
     VISTA DESKTOP (TABLA)
  ==========================*/
  } else {

    html = `
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            ${categorias.map(c => `<th>${c}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
    `;

    for (let mes of ordenMeses) {
      if (mesSeleccionado !== "ANUAL" && mes !== mesSeleccionado) continue;
      const fila = calif[mes];
      if (!fila) continue;

      html += `<tr><td>${mes}</td>`;

      for (let c of categorias) {
        const val = parseFloat(fila[c]) || 0;
        html += `<td>${val.toFixed(2)}</td>`;
        totales[c] += val;
      }

      html += `</tr>`;
    }

    if (mesSeleccionado === "ANUAL") {
      html += `<tr class="admin-total"><td><strong>TOTAL ANUAL</strong></td>`;
      for (let c of categorias) {
        html += `<td><strong>${totales[c].toFixed(2)}</strong></td>`;
      }
      html += `</tr>`;
    }

    html += `
        </tbody>
      </table>
    `;
  }

  /* =========================
     FIRMA DIGITAL
  ==========================*/
  html += `
    <div class="firma-digital-horizontal fade-in">
      <hr class="linea-firma">
      <span class="icono-firma">🖊️</span>
      Firmado digitalmente por:
      <br>
      <img
        src="https://scorefire.github.io/bomberosargentina-calificaciones/firma.png"
        alt="Firma Jefe"
        class="imagen-firma"
        draggable="false"
      >
    </div>
  `;

  const tabla = document.getElementById("tablaCalificaciones");
  tabla.innerHTML = html;

  tabla.classList.remove("fade-refresh");
  void tabla.offsetWidth;
  tabla.classList.add("fade-refresh");

  mostrarPorcentajeHT(usuarioActual);
  actualizarVisibilidadFooter();
}


function previsualizarCSV() {
  const archivo = document.getElementById("archivoCSV").files[0];
  if (!archivo) return alert("Selecciona un archivo CSV.");
  const lector = new FileReader();
  lector.onload = function(e) {
    const lineas = e.target.result.split("\n").filter(l => l.trim() !== "");
    let html = "<table>";
    for (let i = 0; i < lineas.length; i++) {
      const columnas = lineas[i].split(",");
      html += "<tr>" + columnas.map(col => `<td>${col}</td>`).join("") + "</tr>";
    }
    html += "</table>";
    document.getElementById("preview").innerHTML = html;
  };
  lector.readAsText(archivo);
}

function mostrarPorcentajeHT(usuarioId) {
  fetch("https://docs.google.com/spreadsheets/d/1XOtsxFNYi2VW2f-w1ym5Prw93ctHb0PAtoxpyRgO_xc/export?format=csv&gid=0")
    .then(res => res.text())
    .then(data => {
      const lineas = data.trim().split("\n");
      const encabezado = lineas[0].split(",");
      const datos = lineas.slice(1);
      let resultado = null;

      for (let linea of datos) {
        const valores = linea.split(",");
        const id = valores[0];
        if (id === usuarioId) {
          const computables = valores[1];
          const concurridas = valores[2];
          const porcentaje = parseFloat(valores[3]);
          resultado = { computables, concurridas, porcentaje };
          break;
        }
      }

      const div = document.getElementById("porcentajeAsistencias");

      if (resultado) {
        div.innerHTML = `
          <h3 style="margin-top: 0; color: #ff4b4b;">Resumen de Asistencia a intervenciones "HT"</h3>
          <strong>Total intervenciones "HT":</strong> ${resultado.computables}<br>
          <strong>Total intervenciones concurridas:</strong> ${resultado.concurridas}<br>
          <strong>Porcentaje anual de asistencia:</strong> ${resultado.porcentaje.toFixed(1)}%
        `;
        div.classList.remove("hidden");
      } else {
        div.textContent = "";
        div.classList.add("hidden");
      }
    })
    .catch(err => {
      console.error("Error al cargar porcentajeht.csv:", err);
    });
}

function actualizarVisibilidadFooter() {
  if (usuarioActual) {
    document.getElementById("footer-app").classList.remove("oculto");
  } else {
    document.getElementById("footer-app").classList.add("oculto");
  }
}


// Protección para imágenes: impedir arrastre y selección
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
    img.style.pointerEvents = 'none';
  });

});

function ayudaWhatsApp() {
  const mensaje = encodeURIComponent(
    "Hola, tengo problemas para ingresar a la app de calificaciones. ¿Me pueden ayudar?"
  );

  // Reemplazá por el número real de asistencia (con código de país)
  const telefono = "5493329304565";

  window.open(
    `https://wa.me/${telefono}?text=${mensaje}`,
    "_blank"
  );
}
