// Variables para almacenar las tasas de cambio y la última actualización
let tasasDeCambioCache = null;
let ultimaActualizacion = 0;

// Función asíncrona para obtener las tasas de cambio
async function obtenerTasasDeCambio() {
  const ahora = Date.now();
  // Si tenemos tasas en caché y no ha pasado más de una hora, las usamos
  if (tasasDeCambioCache && ahora - ultimaActualizacion < 3600000) {
    return tasasDeCambioCache;
  }

  try {
    // Hacemos una petición a la API para obtener las tasas actualizadas
    const respuesta = await fetch('https://mindicador.cl/api');
    const datos = await respuesta.json();
    // Almacenamos las tasas de dólar y euro
    tasasDeCambioCache = {
      dolar: datos.dolar.valor,
      euro: datos.euro.valor,
    };
    ultimaActualizacion = ahora;
    return tasasDeCambioCache;
  } catch (error) {
    console.error('Error al obtener tasas de cambio:', error);
    throw new Error('Error al obtener datos. Por favor, intente más tarde.');
  }
}

// Función para convertir moneda
function convertirMoneda(monto, desde, hacia, tasasDeCambio) {
  if (desde === 'clp') {
    return monto / tasasDeCambio[hacia];
  } else {
    return monto * tasasDeCambio[desde];
  }
}

// Función para actualizar el resultado en el DOM
function actualizarResultado(monto, desde, hacia, resultado) {
  document.getElementById(
    'resultado'
  ).textContent = `${monto} ${desde.toUpperCase()} = ${resultado.toFixed(
    2
  )} ${hacia.toUpperCase()}`;
}

// Función asíncrona para obtener el historial de una moneda
async function obtenerHistorial(moneda) {
  try {
    const respuesta = await fetch(`https://mindicador.cl/api/${moneda}`);
    const datos = await respuesta.json();
    return datos.serie.slice(0, 10); // Retornamos los últimos 10 días
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}

// Función para crear el gráfico
function crearGrafico(historial, moneda) {
  const ctx = document.getElementById('grafico').getContext('2d');
  // Destruimos el gráfico existente si hay uno
  if (window.graficoMoneda) {
    window.graficoMoneda.destroy();
  }
  // Creamos un nuevo gráfico
  window.graficoMoneda = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historial.map(item => new Date(item.fecha).toLocaleDateString()),
      datasets: [
        {
          label: `Valor ${moneda.toUpperCase()} últimos 10 días`,
          data: historial.map(item => item.valor),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    },
  });
}

// Función principal para manejar la conversión
async function manejarConversion() {
  const monto = parseFloat(document.getElementById('montoPesos').value);
  const monedaDestino = document.getElementById('monedaDestino').value;

  if (isNaN(monto)) {
    document.getElementById('resultado').textContent =
      'Por favor, ingrese un monto válido.';
    return;
  }

  try {
    const tasasDeCambio = await obtenerTasasDeCambio();
    const resultado = convertirMoneda(
      monto,
      'clp',
      monedaDestino,
      tasasDeCambio
    );

    actualizarResultado(monto, 'CLP', monedaDestino, resultado);

    const historial = await obtenerHistorial(monedaDestino);
    crearGrafico(historial, monedaDestino);
  } catch (error) {
    console.error('Error en la conversión:', error);
    document.getElementById('resultado').textContent =
      'Error en la conversión. Por favor, intente más tarde.';
  }
}

// Agregamos event listeners para actualizar en tiempo real
document
  .getElementById('convertir')
  .addEventListener('click', manejarConversion);
document
  .getElementById('montoPesos')
  .addEventListener('input', manejarConversion);
document
  .getElementById('monedaDestino')
  .addEventListener('change', manejarConversion);

// Llamamos a manejarConversion inicialmente para cargar los datos
manejarConversion();
