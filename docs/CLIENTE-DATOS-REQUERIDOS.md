# Datos necesarios para publicar

Esta checklist separa lo imprescindible para publicar de lo que puede agregarse después. La información debe entregarse por una persona autorizada del concesionario.

## Obligatorio para publicar

- [ ] Autorización para usar nombre comercial, logo, fotografías y material de Toyota.
- [ ] Razón social definitiva y CUIT.
- [ ] Dirección, teléfonos, WhatsApp, email y horarios confirmados.
- [ ] Lista de modelos y versiones que realmente se comercializan.
- [ ] Fotografías autorizadas del local, equipo, vehículos y servicios, si se desean publicar.
- [ ] Texto legal y política de privacidad aprobados.
- [ ] Dominio definitivo y cuenta de hosting, o autorización para configurarlos.
- [ ] Responsable que aprobará cambios y contenidos.

## Recomendado para mejorar el sitio

- [ ] Precios y vigencia de cada promoción.
- [ ] Stock y disponibilidad real.
- [ ] Tasas, financiación y condiciones comerciales vigentes.
- [ ] Catálogo de accesorios y repuestos con disponibilidad.
- [ ] Inventario de usados, fotos, kilometraje y precios.
- [ ] Enlaces oficiales de redes sociales y perfiles que quieran destacar.
- [ ] Testimonios o reseñas que autoricen publicar.
- [ ] Métricas o cuenta de analítica, si desean medir consultas.

## Cómo se incorporan los datos

Los datos de contacto se centralizan en `data/dealership.json`. Después de modificarlos, se ejecuta `npm run sync:dealership` y se revisa el resultado con `npm test`. Los modelos se mantienen en `data/models.json`; las páginas dedicadas se generan con `npm run generate:models` cuando corresponda.
