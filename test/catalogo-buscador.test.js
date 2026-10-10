import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));
const productos = leerJson('data/productos.json');
const servicios = leerJson('data/servicios.json');

function simularFetch(respuesta) {
  const fetchFalso = vi.fn(async () => respuesta);
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

async function abrirPagina(url = '/productos.html') {
  window.history.pushState({}, '', url);
  delete window.TecnoProductos;
  document.body.innerHTML = `
    <form class="nav__buscador" role="search" action="productos.html" method="get">
      <input type="search" id="nav-buscar" name="buscar">
    </form>
    <section id="lista-productos"><div class="catalogo__grid"></div></section>`;
  vi.resetModules();
  await import('../js/catalogo.js');
  await import('../js/filtros.js');
}

const esperarTarjetas = () =>
  vi.waitFor(() => expect(document.querySelectorAll('.card')).toHaveLength(productos.length));

const visibles = () =>
  [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.dataset.nombre);

function escribir(texto) {
  const input = document.getElementById('nav-buscar');
  input.value = texto;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  simularFetch({ ok: true, json: async () => productos });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Datos JSON', () => {
  it.each([
    ['productos', productos, ['id', 'nombre', 'descripcion', 'precio', 'categoria', 'imagen']],
    ['servicios', servicios, ['id', 'nombre', 'descripcion', 'categoria']]
  ])('%s.json tiene los campos requeridos', (_nombre, lista, campos) => {
    expect(lista.length).toBeGreaterThan(0);
    for (const item of lista) {
      for (const campo of campos) expect(item[campo], `${item.id}.${campo}`).toBeTruthy();
    }
  });

  it.each([['productos', productos], ['servicios', servicios]])('%s.json no repite ids', (_n, lista) => {
    const ids = lista.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los productos tienen precio numérico mayor a 0', () => {
    expect(productos.every((p) => Number.isFinite(p.precio) && p.precio > 0)).toBe(true);
  });
});

describe('Catálogo dinámico', () => {
  it('pide data/productos.json y pinta una tarjeta por producto', async () => {
    const fetchFalso = simularFetch({ ok: true, json: async () => productos });
    await abrirPagina();
    await esperarTarjetas();
    expect(fetchFalso).toHaveBeenCalledWith('data/productos.json');
    expect(visibles()).toEqual(productos.map((p) => p.nombre));
  });

  it('cada tarjeta lleva sus datos y su precio', async () => {
    await abrirPagina();
    await esperarTarjetas();
    const tarjeta = document.querySelector('.card');
    expect(tarjeta.dataset.id).toBe(productos[0].id);
    expect(tarjeta.dataset.precio).toBe(String(productos[0].precio));
    const precio = tarjeta.querySelector('.card__precio').textContent;
    expect(precio.replace(/\D/g, '')).toBe(String(productos[0].precio));
  });

  it('el botón Comprar abre WhatsApp con el nombre del producto', async () => {
    await abrirPagina();
    await esperarTarjetas();
    const href = document.querySelector('.btn--comprar').href;
    expect(href).toContain('wa.me/573147133443');
    expect(decodeURIComponent(href)).toContain(productos[0].nombre);
  });

  it('avisa al resto de scripts: evento productos:cargados y window.TecnoProductos', async () => {
    const evento = new Promise((resolver) =>
      document.addEventListener('productos:cargados', (e) => resolver(e.detail), { once: true })
    );
    await abrirPagina();
    expect(await evento).toHaveLength(productos.length);
    expect(window.TecnoProductos).toEqual(productos);
  });

  it('muestra un mensaje si el JSON no se puede cargar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    simularFetch({ ok: false });
    await abrirPagina();
    await vi.waitFor(() =>
      expect(document.querySelector('.catalogo__grid').textContent).toContain(
        'No se pudieron cargar los productos'
      )
    );
  });

  it('muestra un mensaje si la lista viene vacía', async () => {
    simularFetch({ ok: true, json: async () => [] });
    await abrirPagina();
    await vi.waitFor(() =>
      expect(document.querySelector('.catalogo__grid').textContent).toContain(
        'No hay productos disponibles.'
      )
    );
  });
});

describe('Buscador en tiempo real', () => {
  it('filtra las tarjetas mientras se escribe', async () => {
    await abrirPagina();
    await esperarTarjetas();
    escribir('mouse');
    expect(visibles()).toEqual(['Mouse inalámbrico', 'Mousepad gamer']);
  });

  it('ignora mayúsculas y tildes', async () => {
    await abrirPagina();
    await esperarTarjetas();
    escribir('AUDIFONOS');
    expect(visibles()).toEqual(['Audífonos de diadema']);
  });

  it('busca solo por nombre, no por descripción', async () => {
    await abrirPagina();
    await esperarTarjetas();
    escribir('inalambrico');
    expect(visibles()).toEqual(['Mouse inalámbrico']);
  });

  it('muestra un aviso cuando no hay resultados', async () => {
    await abrirPagina();
    await esperarTarjetas();
    escribir('xyz');
    expect(visibles()).toEqual([]);
    expect(document.querySelector('.catalogo__sin-resultados').textContent).toBe(
      'No se encontraron productos para "xyz".'
    );
  });

  it('al borrar el texto vuelven todas las tarjetas y desaparece el aviso', async () => {
    await abrirPagina();
    await esperarTarjetas();
    escribir('xyz');
    escribir('');
    expect(visibles()).toHaveLength(productos.length);
    expect(document.querySelector('.catalogo__sin-resultados')).toBeNull();
  });

  it('el envío del formulario no recarga la página en Productos', async () => {
    await abrirPagina();
    await esperarTarjetas();
    const form = document.querySelector('.nav__buscador');
    document.getElementById('nav-buscar').value = 'teclado';
    const envio = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(envio);
    expect(envio.defaultPrevented).toBe(true);
    expect(visibles()).toEqual(['Teclado retroiluminado']);
  });
});

describe('Búsqueda desde otras páginas (?buscar=)', () => {
  it('precarga el campo y filtra al llegar con ?buscar=mouse', async () => {
    await abrirPagina('/productos.html?buscar=mouse');
    await esperarTarjetas();
    await vi.waitFor(() => expect(visibles()).toEqual(['Mouse inalámbrico', 'Mousepad gamer']));
    expect(document.getElementById('nav-buscar').value).toBe('mouse');
  });

  it('entiende texto con tildes codificado en la URL', async () => {
    await abrirPagina('/productos.html?buscar=aud%C3%ADfonos');
    await esperarTarjetas();
    await vi.waitFor(() => expect(visibles()).toEqual(['Audífonos de diadema']));
  });

  it.each(['index', 'productos', 'servicios', 'nosotros', 'contacto'])(
    '%s.html envía la búsqueda a productos.html?buscar=',
    (pagina) => {
      const doc = new DOMParser().parseFromString(readFileSync(`${pagina}.html`, 'utf8'), 'text/html');
      const form = doc.querySelector('form.nav__buscador');
      expect(form).not.toBeNull();
      expect(form.getAttribute('action')).toBe('productos.html');
      expect(form.getAttribute('method').toLowerCase()).toBe('get');
      expect(form.querySelector('input[name="buscar"]')).not.toBeNull();
    }
  );
});