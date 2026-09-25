# Pendientes reales de la demo

La demo está preparada para mostrar el recorrido comercial, pero todavía no debe presentarse como el sitio oficial publicado. Esta lista contiene únicamente lo que requiere intervención externa.

## Bloqueante para publicación oficial

- **Autorización escrita para usar marca, logos, fotografías y material de Toyota.** Falta porque no contamos con aprobación del concesionario ni de Toyota Argentina. La debe proporcionar el concesionario o su responsable de marca. Se incorporará reemplazando los recursos de `toyota-sharp-assets/` y revisando los textos de `index.html` y `hilux.html`.
- **Confirmación de identidad legal y datos fiscales.** El nombre legal visible proviene de información pública, pero el CUIT está deliberadamente pendiente. El concesionario debe confirmar razón social, CUIT y responsable legal. Se cargará en `data/dealership.json` y en la sección legal.
- **Confirmación de teléfonos, WhatsApp, email, dirección y horarios.** Son datos públicos de referencia, marcados como pendientes de confirmación. El concesionario debe entregar la versión vigente. Se actualizan en `data/dealership.json` y luego se ejecuta `npm run sync:dealership`.
- **Aprobación legal de privacidad y textos comerciales.** La política actual es un borrador porque la demo no almacena datos: prepara WhatsApp o email localmente. El concesionario debe revisarla con su asesor legal antes de publicar.

## Recomendado antes de publicar

- **Modelos, versiones y equipamiento vigentes para la zona.** El catálogo actual sirve para la demo; debe validarse la gama que el concesionario realmente comercializa.
- **Fotografías autorizadas para cada modelo y del local.** Las siluetas se mantienen cuando no hay material autorizado. Se reemplazan en `data/models.json` y `toyota-sharp-assets/`.
- **Contenido comercial real.** Precios, promociones, tasas, stock, fechas de entrega y condiciones de financiación no se inventan y deben cargarse solo después de recibirlos.
- **Dominio y hosting definitivos.** La demo usa GitHub Pages. El concesionario debe decidir el dominio y quién será titular de la cuenta.

## Opcional / futuro

- **Stock de usados conectado a una fuente real.** Requiere decidir quién mantiene el inventario y si se usará una planilla, API o carga manual.
- **Panel de administración.** No es necesario para publicar la primera versión. Puede evaluarse si el concesionario necesita editar contenido sin asistencia técnica.
- **Analítica y campañas.** La demo no carga Google Analytics ni scripts de terceros. Para activarlos hay que definir cuenta, objetivos, consentimiento y política de privacidad.
- **Integración con CRM o bandeja de consultas.** Actualmente los formularios preparan mensajes que la persona revisa y envía por WhatsApp o email; no se almacenan consultas en el sitio.
