// TecnoShop — Carrito de compra
// Quincena 7: lógica basada en localStorage (sin backend, persiste solo
// en el navegador del visitante). El panel lateral (drawer) se construye
// por JS y se inyecta en todas las páginas que cargan este script.

(function () {
  'use strict';

  const STORAGE_KEY = 'tecnoshop_carrito';
  const WHATSAPP = '573147133443'; // TODO: reemplazar por el número real de TecnoShop

  /* ---------- Estado ---------- */

  function leerCarrito() {
    try {
      const dato = localStorage.getItem(STORAGE_KEY);
      return dato ? JSON.parse(dato) : [];
    } catch (e) {
      return [];
    }
  }

  function guardarCarrito(carrito) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (e) {
      /* almacenamiento no disponible: el carrito vive solo en memoria */
    }
    render();
  }

  function agregarAlCarrito(producto) {
    const carrito = leerCarrito();
    const existente = carrito.find((item) => item.id === producto.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio) || 0,
        imagen: producto.imagen || '',
        cantidad: 1
      });
    }
    guardarCarrito(carrito);
    abrirDrawer();
  }

  function cambiarCantidad(id, delta) {
    const carrito = leerCarrito();
    const item = carrito.find((p) => p.id === id);
    if (!item) return;
    item.cantidad += delta;
    const filtrado = carrito.filter((p) => p.cantidad > 0);
    guardarCarrito(filtrado);
  }

  function eliminarItem(id) {
    guardarCarrito(leerCarrito().filter((p) => p.id !== id));
  }

  function vaciarCarrito() {
    guardarCarrito([]);
  }

  /* ---------- Utilidades ---------- */

  const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  function totalUnidades(carrito) {
    return carrito.reduce((suma, p) => suma + p.cantidad, 0);
  }

  function totalPrecio(carrito) {
    return carrito.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
  }

  /* ---------- Construcción del DOM ---------- */

  let refs = {};

  function construirDrawer() {
    const overlay = document.createElement('div');
    overlay.className = 'carrito-overlay';
    overlay.hidden = true;

    const drawer = document.createElement('aside');
    drawer.className = 'carrito-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Carrito de compras');
    drawer.hidden = true;
    drawer.innerHTML = [
      '<header class="carrito-drawer__head">',
      '  <h2>Tu carrito</h2>',
      '  <button type="button" class="carrito-drawer__cerrar" aria-label="Cerrar carrito">&times;</button>',
      '</header>',
      '<div class="carrito-drawer__items" data-items></div>',
      '<footer class="carrito-drawer__pie">',
      '  <div class="carrito-drawer__total">',
      '    <span>Total</span><strong data-total>$0</strong>',
      '  </div>',
      '  <a class="btn carrito-drawer__enviar" data-enviar target="_blank" rel="noopener">Finalizar por WhatsApp</a>',
      '  <button type="button" class="carrito-drawer__vaciar" data-vaciar>Vaciar carrito</button>',
      '</footer>'
    ].join('');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    refs = {
      overlay: overlay,
      drawer: drawer,
      items: drawer.querySelector('[data-items]'),
      total: drawer.querySelector('[data-total]'),
      enviar: drawer.querySelector('[data-enviar]'),
      cerrar: drawer.querySelector('.carrito-drawer__cerrar'),
      vaciar: drawer.querySelector('[data-vaciar]')
    };

    overlay.addEventListener('click', cerrarDrawer);
    refs.cerrar.addEventListener('click', cerrarDrawer);
    refs.vaciar.addEventListener('click', vaciarCarrito);

    refs.items.addEventListener('click', function (ev) {
      const boton = ev.target.closest('button[data-accion]');
      if (!boton) return;
      const fila = boton.closest('[data-item-id]');
      const id = fila && fila.getAttribute('data-item-id');
      if (!id) return;
      const accion = boton.getAttribute('data-accion');
      if (accion === 'sumar') cambiarCantidad(id, 1);
      if (accion === 'restar') cambiarCantidad(id, -1);
      if (accion === 'eliminar') eliminarItem(id);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !drawer.hidden) cerrarDrawer();
    });
  }

  /* ---------- Apertura / cierre ---------- */

  function abrirDrawer() {
    refs.overlay.hidden = false;
    refs.drawer.hidden = false;
    // fuerza reflow para que la transición se aplique
    void refs.drawer.offsetWidth;
    refs.overlay.classList.add('is-visible');
    refs.drawer.classList.add('is-open');
    document.body.classList.add('carrito-abierto');
  }

  function cerrarDrawer() {
    refs.overlay.classList.remove('is-visible');
    refs.drawer.classList.remove('is-open');
    document.body.classList.remove('carrito-abierto');
    window.setTimeout(function () {
      if (!refs.drawer.classList.contains('is-open')) {
        refs.overlay.hidden = true;
        refs.drawer.hidden = true;
      }
    }, 250);
  }

  function alternarDrawer() {
    if (refs.drawer.hidden) abrirDrawer();
    else cerrarDrawer();
  }

  /* ---------- Render ---------- */

  function render() {
    const carrito = leerCarrito();

    // Contador en el botón flotante
    const flotante = document.querySelector('.cart-float');
    if (flotante) {
      const unidades = totalUnidades(carrito);
      let badge = flotante.querySelector('.cart-float__badge');
      if (unidades > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'cart-float__badge';
          flotante.appendChild(badge);
        }
        badge.textContent = unidades > 99 ? '99+' : String(unidades);
      } else if (badge) {
        badge.remove();
      }
    }

    if (!refs.items) return;

    if (carrito.length === 0) {
      refs.items.innerHTML = '<p class="carrito-drawer__vacio">Tu carrito está vacío.</p>';
    } else {
      refs.items.innerHTML = carrito.map(filaItem).join('');
    }

    refs.total.textContent = formatoCOP.format(totalPrecio(carrito));

    // Enlace de WhatsApp con el resumen del pedido
    if (carrito.length === 0) {
      refs.enviar.setAttribute('aria-disabled', 'true');
      refs.enviar.removeAttribute('href');
    } else {
      refs.enviar.removeAttribute('aria-disabled');
      const lineas = carrito.map(
        (p) => '• ' + p.nombre + ' x' + p.cantidad + ' — ' + formatoCOP.format(p.precio * p.cantidad)
      );
      const mensaje =
        'Hola TecnoShop, quiero pedir:\n' +
        lineas.join('\n') +
        '\n\nTotal: ' +
        formatoCOP.format(totalPrecio(carrito));
      refs.enviar.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje);
    }
  }

  function filaItem(p) {
    const subtotal = formatoCOP.format(p.precio * p.cantidad);
    const media = p.imagen
      ? '<img src="' + p.imagen + '" alt="" class="carrito-item__img">'
      : '<div class="carrito-item__img carrito-item__img--ph">🛒</div>';
    return [
      '<div class="carrito-item" data-item-id="' + p.id + '">',
      media,
      '  <div class="carrito-item__info">',
      '    <p class="carrito-item__nombre">' + p.nombre + '</p>',
      '    <p class="carrito-item__precio">' + subtotal + '</p>',
      '    <div class="carrito-item__cantidad">',
      '      <button type="button" data-accion="restar" aria-label="Quitar uno">−</button>',
      '      <span>' + p.cantidad + '</span>',
      '      <button type="button" data-accion="sumar" aria-label="Agregar uno">+</button>',
      '    </div>',
      '  </div>',
      '  <button type="button" class="carrito-item__eliminar" data-accion="eliminar" aria-label="Eliminar del carrito">&times;</button>',
      '</div>'
    ].join('');
  }

  /* ---------- Enganche con la página ---------- */

  function init() {
    construirDrawer();

    const flotante = document.querySelector('.cart-float');
    if (flotante) flotante.addEventListener('click', alternarDrawer);

    // Botones "Agregar al carrito" en las tarjetas de producto.
    // Cada tarjeta debe llevar data-id / data-nombre / data-precio / data-imagen.
    document.addEventListener('click', function (ev) {
      const boton = ev.target.closest('[data-agregar]');
      if (!boton) return;
      ev.preventDefault();
      const card = boton.closest('[data-id]') || boton;
      agregarAlCarrito({
        id: card.dataset.id,
        nombre: card.dataset.nombre,
        precio: card.dataset.precio,
        imagen: card.dataset.imagen
      });
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expuesto por si otros scripts (catálogo dinámico) lo necesitan
  window.TecnoCarrito = { agregar: agregarAlCarrito, leer: leerCarrito, abrir: abrirDrawer };
})();
