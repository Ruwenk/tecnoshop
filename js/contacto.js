// TecnoShop — Formulario de contacto
// Recopila los datos del formulario y los envía como mensaje de WhatsApp.

(function () {
  const NUMERO_WHATSAPP = "573147133443";

  const formulario = document.getElementById("form-contacto");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nombre = formulario.nombre.value.trim();
    const apellido = formulario.apellido.value.trim();
    const correo = formulario.correo.value.trim();
    const telefono = formulario.telefono.value.trim();
    const mensaje = formulario.mensaje.value.trim();

    const texto =
      `Hola TecnoShop, mi nombre es ${nombre} ${apellido}.\n` +
      `Correo: ${correo}\n` +
      `Teléfono: ${telefono}\n` +
      `Mensaje: ${mensaje}`;

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank", "noopener");
    formulario.reset();
  });
})();
