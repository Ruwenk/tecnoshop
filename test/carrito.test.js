import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

const mouse = { id: 'p1', nombre: 'Mouse inalámbrico', precio: 35000 };
const teclado = { id: 'p2', nombre: 'Teclado retroiluminado', precio: 55000 };

beforeAll(async () => {
  document.body.innerHTML = '<button class="cart-float"></button>';
  await import('../js/carrito.js');
});

beforeEach(() => {
  document.querySelector('[data-vaciar]').click();
});

describe('carrito', () => {
  it('agrega un producto con cantidad 1', () => {
    window.TecnoCarrito.agregar(mouse);
    const c = window.TecnoCarrito.leer();
    expect(c).toHaveLength(1);
    expect(c[0].cantidad).toBe(1);
  });

  it('suma la cantidad si el producto ya existe', () => {
    window.TecnoCarrito.agregar(mouse);
    window.TecnoCarrito.agregar(mouse);
    expect(window.TecnoCarrito.leer()[0].cantidad).toBe(2);
  });

  it('persiste en localStorage', () => {
    window.TecnoCarrito.agregar(mouse);
    const guardado = JSON.parse(localStorage.getItem('tecnoshop_carrito'));
    expect(guardado[0].id).toBe('p1');
  });

  it('calcula el total', () => {
    window.TecnoCarrito.agregar(mouse);
    window.TecnoCarrito.agregar(teclado);
    const total = document.querySelector('[data-total]').textContent;
    expect(total.replace(/\D/g, '')).toBe('90000');
  });

  it('el botón restar elimina el ítem al llegar a 0', () => {
    window.TecnoCarrito.agregar(mouse);
    document.querySelector('[data-accion="restar"]').click();
    expect(window.TecnoCarrito.leer()).toHaveLength(0);
  });

  it('muestra el contador en el botón flotante', () => {
    window.TecnoCarrito.agregar(mouse);
    window.TecnoCarrito.agregar(mouse);
    expect(document.querySelector('.cart-float__badge').textContent).toBe('2');
  });

  it('arma el enlace de WhatsApp con el pedido', () => {
    window.TecnoCarrito.agregar(mouse);
    const href = document.querySelector('[data-enviar]').href;
    expect(href).toContain('wa.me/573147133443');
    expect(decodeURIComponent(href)).toContain('Mouse inalámbrico x1');
  });
});
