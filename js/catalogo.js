// TecnoShop — Catálogo dinámico
// Quincena 6: fetch() de data/productos.json y render de tarjetas en el DOM.

(function () {
  'use strict';

  const RUTA_PRODUCTOS = 'data/productos.json';

  const EMOJI_POR_CATEGORIA = {
    mouse: '🖱️',
    teclado: '⌨️',
    accesorios: '💻',
    almacenamiento: '💾',
    audio: '🎧'
  };

  const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  const WHATSAPP_NUMERO = '573147133443';

  function enlaceWhatsapp(producto) {
    const mensaje = 'Hola, quiero comprar el producto: ' + producto.nombre +
      ' (' + formatoCOP.format(producto.precio) + ')';
    return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);
  }

  function tarjetaProducto(producto) {
    const emoji = EMOJI_POR_CATEGORIA[producto.categoria] || '🛒';
    return [
      '<article class="card" data-id="' + producto.id + '" data-nombre="' + producto.nombre + '" data-precio="' + producto.precio + '" data-imagen="' + producto.imagen + '">',
      '  <div class="card__img">' + emoji + '</div>',
      '  <h2>' + producto.nombre + '</h2>',
      '  <p>' + producto.descripcion + '</p>',
      '  <p class="card__precio">Valor: ' + formatoCOP.format(producto.precio) + '</p>',
      '  <div class="card__acciones">',
      '    <button type="button" class="btn btn--small" data-agregar>Agregar al carrito</button>',
      '    <a class="btn btn--small btn--comprar" href="' + enlaceWhatsapp(producto) + '" target="_blank" rel="noopener">Comprar</a>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function renderTarjetas(lista, contenedor) {
    if (!lista.length) {
      contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
      return;
    }
    contenedor.innerHTML = lista.map(tarjetaProducto).join('');
  }

  function cargarProductos() {
    const seccion = document.getElementById('lista-productos');
    if (!seccion) return;

    const contenedor = seccion.querySelector('.catalogo__grid');
    if (!contenedor) return;

    fetch(RUTA_PRODUCTOS)
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo');
        return respuesta.json();
      })
      .then(function (productos) {
        renderTarjetas(productos, contenedor);
        // Otros scripts (filtros.js) lista de productos global
        window.TecnoProductos = productos;
        document.dispatchEvent(new CustomEvent('productos:cargados', { detail: productos }));
      })
      .catch(function (error) {
        contenedor.innerHTML = '<p>No se pudieron cargar los productos. Intenta de nuevo más tarde.</p>';
        console.error('Error al cargar productos:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarProductos);
  } else {
    cargarProductos();
  }
})();
