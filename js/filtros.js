// TecnoShop — Filtros y buscador
// Quincena 7: búsqueda en tiempo real sobre el catálogo de productos.
// El campo de búsqueda vive en el header (.nav__buscador) y está presente
// en todas las páginas: en Productos filtra en vivo, en el resto navega
// a productos.html?buscar=texto (funciona igual sin JavaScript).

(function () {
  'use strict';

  function normalizar(texto) {
    return (texto || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function buscarPorTexto(texto) {
    const contenedor = document.querySelector('#lista-productos .catalogo__grid');
    if (!contenedor) return;

    const termino = normalizar(texto).trim();
    const tarjetas = contenedor.querySelectorAll('.card');
    let visibles = 0;

    tarjetas.forEach(function (tarjeta) {
      const coincide = !termino || normalizar(tarjeta.dataset.nombre).includes(termino);
      tarjeta.hidden = !coincide;
      if (coincide) visibles++;
    });

    let mensaje = contenedor.querySelector('.catalogo__sin-resultados');
    if (!visibles && tarjetas.length) {
      if (!mensaje) {
        mensaje = document.createElement('p');
        mensaje.className = 'catalogo__sin-resultados';
        contenedor.appendChild(mensaje);
      }
      mensaje.textContent = 'No se encontraron productos para "' + texto + '".';
    } else if (mensaje) {
      mensaje.remove();
    }
  }

  function inicializarBuscador() {
    const form = document.querySelector('.nav__buscador');
    if (!form) return;

    const input = form.querySelector('input[type="search"]');
    const enPaginaProductos = !!document.getElementById('lista-productos');

    // Fuera de Productos, el formulario navega de forma nativa
    // (action="productos.html", method="get") y no necesita JS.
    if (!enPaginaProductos) return;

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      buscarPorTexto(input.value);
    });

    input.addEventListener('input', function () {
      buscarPorTexto(input.value);
    });

    // Si se llegó desde otra página con ?buscar=texto, precarga el campo
    // y filtra en cuanto catalogo.js termine de renderizar las tarjetas.
    const terminoInicial = new URLSearchParams(window.location.search).get('buscar');
    if (terminoInicial) {
      input.value = terminoInicial;
      if (window.TecnoProductos) {
        buscarPorTexto(terminoInicial);
      } else {
        document.addEventListener('productos:cargados', function () {
          buscarPorTexto(terminoInicial);
        }, { once: true });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarBuscador);
  } else {
    inicializarBuscador();
  }
})();
