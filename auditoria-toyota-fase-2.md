# Auditoría estratégica — Fase 2 (verificación de implementación + nuevos hallazgos)
### Toyota Piñeyro y Moscatelli — Concepción del Uruguay

**Nota metodológica — disciplina de evidencia:** en esta ronda no recibí capturas de pantalla nuevas, sino el código fuente completo actualizado (`index.html`, ~340 KB) dentro del `.zip`. Lo comparé línea por línea contra el código de la auditoría anterior. Esto me da certeza total sobre **qué cambió en el contenido, la estructura y la lógica** (marcado `OBSERVED`, porque está literalmente en el código), pero **no puedo confirmar cómo se ve o se siente en pantalla real** — spacing, jerarquía visual, comportamiento mobile, performance percibida (todo eso queda `HYPOTHESIS — REQUIRES VALIDATION` hasta que vea capturas o el sitio en vivo). Donde el código sugiere fuertemente un comportamiento pero no lo prueba (por ejemplo, intención de diseño detrás de una clase CSS), lo marco `INFERRED`.

Esta auditoría está organizada en dos partes: **primero**, una verificación punto por punto de lo que se implementó de la auditoría anterior (porque me pediste explícitamente evaluar la implementación); **segundo**, el análisis nuevo pedido en el brief que pegaste, con su misma estructura de salida.

---

# PARTE 1 — VERIFICACIÓN DE LA IMPLEMENTACIÓN ANTERIOR

| # | Recomendación (auditoría 1) | Estado | Evidencia en el código |
|---|---|---|---|
| 1 | Resolver "Usados" vacío con captura activa de interés | ✅ **IMPLEMENTADO** | El estado vacío ahora tiene un formulario real (`#usedInterestForm`): selector de tipo de vehículo + botón "Avisarme por WhatsApp", con mensaje de WhatsApp prearmado y tracking (`used_interest_click`). Exactamente el patrón que se recomendó. |
| 2 | Revisar tono de "Por qué acá" (sonaba a pitch de agencia, no a mensaje para el comprador) | ✅ **IMPLEMENTADO** | Reescrita de punta a punta. Antes: "Leads más calificados", "Valor preparado para medirse", "OBJETIVO DE NEGOCIO". Ahora: "Información honesta", "Modelos para explorar", "Canales directos", "Acompañamiento después", bajo el título "Por qué elegirnos" / "NUESTRO COMPROMISO". El copy ahora habla directamente al visitante, no al dueño del negocio. |
| 3 | Jerarquizar 1 CTA primario por sección (hoy compiten 10+ botones) | ⚠️ **PARCIALMENTE IMPLEMENTADO** | Hay un comentario explícito en el CSS: `/* Audit phase 3: one clear primary action per journey */`, que baja de peso visual los CTAs secundarios dentro de "Cómo comprar" (`.journey-aside`) y dentro de "Financiación"/"Plan canje" (`.related-row`), convirtiéndolos en links de texto en vez de botones. Es la corrección correcta, pero **se aplicó solo en 2-3 secciones puntuales**, no de forma sistemática en todo el sitio: la cantidad total de enlaces a WhatsApp prácticamente no bajó (23 → 22 en todo el documento). El problema de origen (demasiadas acciones con peso similar) sigue presente en secciones como "Postventa", "Contacto directo" e "Instalaciones". |
| 4 | Activar "modelos que miraste recién" (ya construida, oculta) | ❌ **NO IMPLEMENTADO** | La sección sigue con el atributo `hidden` en el código, sin cambios respecto a la versión anterior. Sigue siendo la oportunidad de menor costo del sitio, sin tocar. |
| 5 | Confirmar/arreglar URL propia por modelo (SEO) | ⚠️ **PARCIALMENTE IMPLEMENTADO** | Se agregó ruteo por hash: cada ficha de modelo ahora actualiza la URL a `#modelo/nombre-slug` (`history.pushState`) y el sitio restaura ese estado si alguien entra con ese link (`restoreHashRoute`). Esto mejora la posibilidad de **compartir el link de un modelo puntual** y de que la navegación de "atrás" del navegador funcione bien — una mejora real de UX. Pero **no es lo mismo que una URL indexable por Google**: sigue siendo un único documento HTML con estado en el fragmento (`#...`), y el `<link rel="canonical" href="/">` sigue apuntando a la home, con un comentario en el propio código que dice literalmente "reemplazar antes de publicar: canonical absoluta, dominio, endpoint real de leads". Es decir: **el propio equipo de desarrollo ya identificó que esto sigue pendiente.** Para SEO real de "Hilux Concepción del Uruguay", esto todavía no resuelve el problema. |
| 6 | Incluir los valores simulados (monto/plazo/anticipo) en el mensaje de WhatsApp de financiación | ✅ **IMPLEMENTADO** | El botón "Pedir mi tasa real por WhatsApp" ahora arma el mensaje con el monto formateado, la cantidad de meses, el % de anticipo y el monto financiado estimado, todos tomados en vivo del simulador. Es el tipo de mejora de bajo costo / alto impacto que se buscaba. |
| 7 | Sección de equipo humano (nombres, roles, caras reales) | ⚠️ **PARCIALMENTE IMPLEMENTADO** | No hay una sección dedicada de equipo con nombres y fotos individuales, pero sí se agregó una frase puntual en "Nuestro taller": *"El mismo equipo que te atiende por WhatsApp es el que después revisa tu Toyota en el taller"*, acompañada de una foto real de mecánicos trabajando (con alt text descriptivo) y el pie de foto "Nuestro equipo de mecánicos". Es un paso real en la dirección correcta, pero acotado a postventa/taller — el equipo de ventas/asesores sigue sin cara ni nombre en ningún punto del sitio. |
| 8 | Contenido geográfico de zona de influencia regional | ✅ **IMPLEMENTADO** | Nuevo bloque "Atención local y consultas regionales" dentro de "Por qué elegirnos": *"Estamos en Concepción del Uruguay y atendemos consultas de personas que buscan vehículos Toyota, financiación, plan canje o postventa en la región. Si estás organizando tu visita desde otra localidad, escribinos antes para confirmar horarios..."*. Nota: es contenido genérico ("la región", "otra localidad") sin nombrar ciudades concretas (Colón, Gualeguaychú, etc.) — probablemente a propósito, para no inventar datos de cobertura real. Cumple el objetivo de forma conservadora y honesta, aunque el impacto de SEO es menor al que tendría si nombrara localidades reales confirmadas. |
| 9 | Unificar comparación de formas de pago (contado / financiación / canje) | ✅ **IMPLEMENTADO** | Nueva sección completa `#formas-de-pago`: 4 tarjetas (Contado, Financiación, Plan canje, Combinada) con su propio link a cada flujo, y una nota de que "las alternativas se pueden combinar". Resuelve exactamente lo pedido. |
| 10 | Citar reseñas reales (con permiso) dentro del sitio, no solo linkear afuera | ❌ **NO IMPLEMENTADO** | La sección "Testimonios" es idéntica a la versión anterior: linkea a Google, no cita ninguna reseña real dentro del sitio. |
| 11 | FAQ ampliada con preguntas de intervalos de service, qué llevar al service, test drive | ✅ **IMPLEMENTADO** | Se agregaron 3 preguntas nuevas exactamente sobre esos tres temas: intervalo de service (con la respuesta honesta de "depende del modelo, consultá el manual o escribinos"), qué llevar al service, y disponibilidad para test drive/visita. Buena ejecución: mantiene la honestidad (no inventa intervalos por modelo) mientras cubre la intención de búsqueda. |
| 12 | Feed real de Instagram / mejorar la tarjeta estática | ❌ **NO IMPLEMENTADO** | Sigue siendo la misma tarjeta estática ("Vista previa estática · no reproduce publicaciones ni inventa contenido"), sin cambios. |
| 13 (no pedida, pero detectada de oficio) | Accesibilidad | ✅ **MEJORA ADICIONAL NO SOLICITADA** | Se agregó un `skip-link` ("Saltar al contenido principal") apuntando a un nuevo `id="contenido-principal"` en `<main>`, se sumaron más regiones `aria-live` y manejo de foco al abrir/cerrar la ficha de modelo (`detailLastFocus`, devolución de foco al cerrar). Buena señal de que el equipo de desarrollo está pensando en accesibilidad más allá de lo pedido explícitamente. |
| 14 (no pedida) | Performance / mantenibilidad del CSS | ✅ **MEJORA TÉCNICA ADICIONAL** | Los ~30 bloques `<style>` sueltos del código anterior se consolidaron en bloques numerados y comentados (`Consolidated CSS block 01…33`), y las transiciones genéricas `transition: all` se reemplazaron por listas explícitas de propiedades (`background-color, border-color, color, transform, box-shadow`). Esto es una mejora real de performance de repintado en el navegador (transición explícita es más barata que `all`) y de mantenibilidad del código — no estaba en mi lista de recomendaciones porque es una decisión de implementación, pero es coherente con la preocupación por percepción de performance que señalé. |

**Resumen de la verificación:** de los 10 puntos del Top 10 anterior, **6 se implementaron completos, 2 parcialmente, y 2 no se tocaron** ("modelos que miraste recién" y las reseñas citadas dentro del sitio). El ítem crítico (usados vacío) sí se resolvió. El de mayor riesgo pendiente es el de SEO por modelo (canonical/URL real), porque el propio código admite que sigue sin resolverse antes de publicar.

---

# PARTE 2 — NUEVO ANÁLISIS (según la estructura del brief)

## 1. RECONSTRUCCIÓN DEL PRODUCTO

Con los cambios implementados, la experiencia que reconstruyo ahora es más cerrada que en la primera versión: un visitante que llega sin saber cómo va a pagar tiene, por primera vez, **un solo lugar** donde ve las 4 vías de pago juntas antes de comprometerse con una. Alguien que busca un usado ya no se topa con un callejón sin salida: puede dejar una intención concreta sin salir de la página. Y la sección que antes sonaba a informe interno de agencia ahora suena a promesa de marca dirigida a la persona que está comprando.

Lo que **no cambió** en la reconstrucción de la experiencia: sigue sin haber una jerarquía clara de "cuál es la única acción que quiero que hagas en esta pantalla" fuera de las 2-3 secciones donde se trabajó puntualmente. Sigue sintiéndose, en las secciones de postventa y contacto, como un menú de opciones más que como un recorrido guiado. Y sigue sin haber ninguna cara humana del lado comercial (solo del lado de taller/mecánica).

`¿Se siente como una concesionaria digital o como una colección de secciones?` — Con esta ronda de cambios, se acerca un poco más a "producto coherente": la nueva sección de formas de pago actúa como una bisagra que conecta tres flujos que antes vivían aislados (financiación, canje, contado). Pero la falta de jerarquía de CTA fuera de esas secciones puntuales todavía traiciona un poco esa coherencia — se nota que las correcciones fueron quirúrgicas, no un rediseño sistemático de la jerarquía de acciones en todo el sitio. `INFERRED`, en base a cómo está aplicada la corrección en el CSS, no a una captura visual.

---

## 2. DISCIPLINA DE EVIDENCIA (recordatorio aplicado en todo el documento)

- **OBSERVED**: cualquier afirmación de esta sección sobre copy, estructura HTML, JS o CSS está tomada literalmente del código y puede verificarse con un buscador de texto.
- **INFERRED**: cualquier afirmación sobre intención de diseño, jerarquía visual probable o efecto en el usuario, deducida de clases/comentarios pero no vista renderizada.
- **HYPOTHESIS — REQUIRES VALIDATION**: todo lo relacionado a cómo se ve/siente realmente en pantalla, comportamiento mobile real, performance real (Core Web Vitals) y tasas de conversión reales. Nada de esto se puede probar sin ver el sitio renderizado o datos de analítica reales.

---

## 3. AUDITORÍA DE LA EXPERIENCIA (no solo UI)

**Navegación:** sin cambios estructurales; el menú "Compra" y "Postventa" siguen usando `<details>`/mega-panel, ahora con la etiqueta "Por qué elegirnos" unificada en ambos puntos donde antes decía cosas distintas ("Por qué acá" / "Por qué comprar acá") — corrección de consistencia terminológica que no había pedido explícitamente pero que suma.

**Formularios:** el nuevo formulario de interés en usados sigue el mismo patrón honesto que el de plan canje: aclara explícitamente *"No guardamos tus datos en esta página: se abre una consulta preparada para el equipo"* — coherente con la política de transparencia de todo el sitio. Buena decisión de UX legal/confianza.

**WhatsApp:** el mensaje de financiación ahora lleva datos reales simulados. Esto es la mejora de mayor calidad técnica de toda la ronda: transforma un lead genérico en uno con contexto financiero completo desde el primer mensaje, sin pedirle nada extra al usuario.

**FAQ:** el sistema de tabs por categoría (0km / usados / financiación / postventa) ya existía; se actualizó correctamente el arreglo de categorías (`keys`) para las 3 preguntas nuevas, evitando el bug típico de agregar contenido sin actualizar la clasificación. Buen detalle de calidad técnica.

**Accesibilidad:** mejoras reales más allá de lo pedido (skip-link, foco gestionado al abrir/cerrar fichas de modelo). Esto no estaba en ninguna recomendación anterior mía, así que es una señal de que el equipo de desarrollo tiene su propio criterio de calidad, no solo ejecuta lo que se le pide — vale la pena tenerlo en cuenta para las próximas rondas.

---

## 4. LO QUE PROBABLEMENTE NO SE ESTÁ VIENDO (ronda 2)

1. **La corrección de jerarquía de CTA quedó "a mitad de camino" de una forma que puede confundir más que ayudar.** Hoy, en "Cómo comprar" y en "Financiación/Canje", los CTAs secundarios se ven como texto liviano; en el resto del sitio (postventa, contacto, instalaciones) siguen siendo botones de igual peso. Un visitante que navega de una sección a otra va a percibir un cambio de "peso visual" de los botones sin razón aparente para él. Es más consistente para la marca **generalizar la jerarquía a todo el sitio de una sola vez**, o revertir el cambio parcial, que dejarlo a medio camino — la inconsistencia entre secciones puede leerse (sin que el usuario lo articule conscientemente) como que el sitio "no decide" qué es importante en cada pantalla.
2. **El ruteo por hash de modelos (`#modelo/nombre`) es una mejora de producto que hoy nadie sabe que existe, porque no se comunica.** Es perfecto para que el equipo comercial comparta un link directo a una ficha puntual por WhatsApp o redes ("mirá esta Hilux: [link]") en vez de decir "entrá a la web y buscá Hilux". Vale la pena avisarle al equipo comercial que esta funcionalidad ya existe — es una herramienta de venta que hoy está construida pero invisible para quien más la podría aprovechar (el vendedor, no el visitante).
3. **El comentario del propio código sobre el canonical pendiente es, en sí mismo, información de gestión de proyecto valiosa.** El desarrollador dejó una nota explícita de "reemplazar antes de publicar". Esto sugiere que el proyecto todavía está en una fase pre-lanzamiento formal — lo cual cambia la lectura de todo lo demás: si el sitio ya está en producción con ese canonical relativo, cualquier autoridad de SEO que esté acumulando hoy podría estar mal atribuida. Vale la pena confirmar el estado real de publicación antes de la próxima ronda de auditoría, porque cambia la urgencia de varias recomendaciones.
4. **La captura de interés en "Usados" y el "Plan canje" siguen siendo, operativamente, dos fuentes de datos separadas que deberían alimentarse mutuamente** (esto ya lo señalé en la ronda 1, sigue sin resolverse y sigue siendo válido): cada persona que deja su interés en "qué tipo de usado busca" es, en los hechos, un lead de demanda que se podría cruzar con cada persona que tasa su auto en el plan canje (oferta). Ninguna automatización es necesaria para empezar: alcanza con que el equipo comercial revise ambos flujos como una sola lista.

---

## 5. TRAYECTOS DE USUARIO — actualización

Los trayectos A a I descritos en la auditoría anterior siguen siendo válidos en su mayoría. Lo que cambia puntualmente:

- **Usuario que compara formas de pago (nuevo, antes no identificado como trayecto propio):** Entrada → "Formas de compra" → elige una tarjeta → cae en el flujo específico (financiación/canje/contado) → WhatsApp. Este trayecto **no existía como tal en la versión anterior** (las 3 vías estaban separadas); ahora es un recorrido limpio de punta a punta. Fricción restante: la opción "Combinada" lleva a un WhatsApp genérico de "consultar mi caso", sin el nivel de contexto que sí tiene ahora el CTA de financiación — sería consistente que también arrastrara algún dato si el usuario ya interactuó con el simulador o el formulario de canje antes de llegar ahí.
- **Usuario interesado en un usado (E, actualizado):** ya no abandona en un callejón sin salida. Entrada → ve "no hay stock publicado" → dejó su interés con 1 selección + 1 click → WhatsApp con mensaje armado. Fricción restante: el formulario no pide ningún dato de contacto adicional (nombre, presupuesto aproximado) — es intencionalmente mínimo (coherente con "no guardamos tus datos"), lo cual está bien para no asustar, pero significa que **todo el trabajo de calificar ese lead queda 100% en manos del vendedor dentro de WhatsApp**, sin ningún contexto previo más allá del tipo de vehículo.

---

## 6. EXPERIENCIA PREMIUM

No hay capturas nuevas para evaluar el resultado visual, así que esta sección es mayormente `HYPOTHESIS — REQUIRES VALIDATION`. Dos señales indirectas desde el código sí son relevantes:

- Se **removieron** dos animaciones de flotación constante (`hero-float`, `quiet-float`) que hacían que elementos del hero se movieran en loop infinito. Removerlas es, en términos de restraint y de percepción de calidad, una decisión acertada: una animación infinita de baja amplitud en el hero suele leerse como "plantilla animada" más que como diseño premium con propósito, y además consume ciclos de renderizado sin ninguna razón funcional. `INFERRED` como mejora de sobriedad; no confirmable sin ver el resultado.
- El cambio de `transition: all` a transiciones explícitas por propiedad es, además de una mejora de performance, un indicio de que se está afinando el detalle de interacción con más cuidado técnico que antes — coherente con un criterio de "craftsmanship" que valoré en la auditoría anterior.

---

## 7. AUDITORÍA AUTOMOTRIZ + CRO

`DISCOVER → UNDERSTAND → COMPARE → TRUST → CONTACT → CONVERT → OWNERSHIP`:

- **DISCOVER/UNDERSTAND/COMPARE:** sin cambios relevantes en esta ronda.
- **TRUST:** reforzado por el nuevo tono de "Por qué elegirnos" y por la foto real de mecánicos con mensaje de continuidad de equipo. Sigue faltando el lado comercial/ventas.
- **CONTACT/CONVERT:** reforzado significativamente por la nueva sección de formas de pago y por el mensaje de WhatsApp de financiación con datos reales. Es la zona de mayor avance de esta ronda.
- **OWNERSHIP:** sin cambios — sigue limitado a mantenimiento programado, sin contenido de uso o comunidad post-compra.

**¿Qué debería hacer el usuario a continuación, sección por sección?** Con los cambios, hoy es más clara la respuesta en "Formas de pago" (elegí una tarjeta) y en "Usados" (dejá tu interés). Sigue sin ser clara en "Postventa"/"Contacto directo", donde 5-6 canales compiten sin que ninguno se destaque como punto de entrada recomendado por defecto.

---

## 8. CONTENIDO + LOCAL + SEO

Ya cubierto en el detalle de verificación (puntos 5 y 8 de la Parte 1). Resumen: contenido local agregado de forma honesta pero genérica; ruteo por modelo mejorado para compartibilidad pero no para indexación real; canonical pendiente y así reconocido en el propio código.

**Nueva oportunidad de contenido que surge de lo ya implementado:** ya que ahora existe el formulario de interés en usados con categorías (Toyota usado / compacto / SUV / pick-up), esas mismas categorías podrían convertirse en pequeñas páginas o anclas de contenido ("¿Buscás una pick-up usada en Concepción del Uruguay?") que capturen intención de búsqueda específica — hoy esa intención se captura solo dentro del formulario, no se aprovecha como contenido indexable.

---

## 9. AUDITORÍA SECCIÓN POR SECCIÓN (solo secciones nuevas o modificadas)

### SECCIÓN NUEVA: Formas de pago (`#formas-de-pago`)
**Propósito:** unificar las 4 vías de compra en una sola vista comparativa.
**Qué funciona:** copy claro, jerarquía de 4 tarjetas iguales, con una destacada ("Contado" con clase `-featured`), y disclaimer honesto al pie.
**Problema:** la tarjeta "Combinada" no lleva contexto acumulado al WhatsApp, a diferencia de "Financiación".
**Falta:** conectar esta sección con lo que el usuario ya hizo antes (si vino del simulador, que el CTA lo sepa).
**Oportunidad de conversión:** alta — es el primer lugar del sitio donde alguien indeciso entre pagar de una forma u otra puede comparar antes de comprometerse con un flujo.
**Prioridad:** MEDIA (refinamiento, no fix) · **Complejidad:** BAJA.

### SECCIÓN MODIFICADA: Usados (estado vacío)
**Qué funciona:** convierte honestidad en acción, sin fricción, sin pedir datos de más.
**Problema:** cero calificación del lead más allá del tipo de vehículo.
**Oportunidad:** agregar (opcional, no obligatorio) un campo de rango de presupuesto o "para cuándo lo necesitás", sin volverlo un formulario largo.
**Prioridad:** BAJA (ya está resuelto lo crítico) · **Complejidad:** BAJA.

### SECCIÓN MODIFICADA: Por qué elegirnos (antes "Por qué acá")
**Qué funciona:** tono corregido, ahora habla al comprador.
**Problema:** ninguno grave detectado en el copy actual.
**Oportunidad:** conectar cada una de las 4 tarjetas ("Información honesta", "Modelos para explorar", "Canales directos", "Acompañamiento después") con datos concretos más abajo en el propio sitio (ya lo hacen parcialmente vía links) — está bien resuelto.
**Prioridad:** BAJA · **Complejidad:** —.

### SECCIÓN SIN CAMBIOS: Testimonios
**Problema persistente:** la prueba social sigue obligando a salir del sitio.
**Prioridad:** MEDIA (no subió de prioridad, pero tampoco bajó).

### SECCIÓN SIN CAMBIOS: "Vistos" (`#vistos`, oculta)
**Problema persistente:** funcionalidad construida y no activada.
**Prioridad:** ALTA otra vez — sigue siendo la relación costo/beneficio más favorable del sitio sin tocar.

---

## 10. ANÁLISIS CRUZADO ENTRE SECCIONES

La coherencia general mejoró en el tramo "decisión de compra" (cómo comprar → formas de pago → financiación/canje), que ahora se lee como un solo sistema con una entrada clara. La inconsistencia que persiste, y que esta ronda no tocó, es la de **terminología y peso visual de CTA fuera de ese tramo**: "Postventa" sigue funcionando como una colección de tarjetas independientes sin una jerarquía compartida con el resto del sitio. En términos simples: el sitio mejoró como producto en la mitad "quiero comprar" y se mantuvo igual en la mitad "ya compré / necesito ayuda después".

---

## 11. REDUCCIÓN

No se detectó contenido nuevo que debería eliminarse. La única reducción pendiente de la ronda anterior sigue vigente: **la cantidad de CTAs de WhatsApp con peso visual idéntico en secciones no tocadas por esta ronda** (Postventa, Contacto directo, Instalaciones) debería bajarse a un CTA primario por sección con el mismo criterio ya aplicado en "Cómo comprar" y "Financiación/Canje" — no agregar nada nuevo, sino terminar de aplicar el criterio que ya se definió y probó funciona ahí.

---

## 12. OPORTUNIDADES QUE PROBABLEMENTE NO SE ESTÁN VIENDO (consolidado, ronda 2)

Ver punto 4 de esta parte para el detalle completo. En síntesis, las 4 más valiosas de esta ronda:
1. Terminar de aplicar la jerarquía de CTA a todo el sitio (ya probada, ya en producción parcial).
2. Avisarle al equipo comercial que existe un link directo por modelo (`#modelo/nombre`) para compartir por WhatsApp — funcionalidad ya construida y no explotada.
3. Confirmar el estado real de publicación del sitio antes de seguir sumando contenido, por el canonical pendiente.
4. Cruzar operativamente la demanda de "Usados" (formulario nuevo) con la oferta de "Plan canje" (formulario existente) como una sola fuente de inventario futuro.

---

## 13. QUÉ NO CONSTRUIR (sin cambios respecto a la ronda anterior)

Las mismas ideas de bajo ROI / alta complejidad señaladas antes siguen aplicando sin cambios: configurador 3D, chatbot con IA generativa reemplazando el WhatsApp contextual actual, sistema de reservas de turnos con calendario en tiempo real, comparador universal de marcas, gamificación. Ninguna de las mejoras de esta ronda cambia esa evaluación.

---

## 14. SALIDA ESTRATÉGICA FINAL

### A. DIAGNÓSTICO EJECUTIVO
El sitio pasó de "muy bien pensado pero con un vacío crítico y una jerarquía de acciones difusa" a "resuelto en la mitad de decisión de compra, todavía difuso en la mitad de postventa/contacto". El equipo de desarrollo demostró buena capacidad de ejecución: tomó recomendaciones concretas y las llevó a código funcional, con extras no pedidos (accesibilidad, performance de CSS) que hablan de un estándar de calidad propio.

### B. PROBLEMAS MÁS IMPORTANTES
1. La jerarquía de CTA se corrigió solo parcialmente — queda inconsistente entre secciones.
2. El canonical/SEO por modelo sigue sin resolverse, y el propio código lo admite.
3. "Modelos que miraste recién" sigue construida y apagada.
4. La prueba social sigue obligando a salir del sitio.

### C. OPORTUNIDADES DE MAYOR VALOR
1. Generalizar la jerarquía de CTA ya probada a todo el sitio.
2. Explotar comercialmente el link directo por modelo que ya existe.
3. Cruzar demanda de usados con oferta de plan canje como una sola fuente.
4. Confirmar estado de publicación real antes de seguir invirtiendo en SEO de contenido.

### D. PIEZAS FALTANTES
Sección de equipo comercial (con nombres/fotos, más allá de taller); activación de "vistos"; testimonios citados dentro del sitio; contexto acumulado en el CTA de "Combinada" dentro de formas de pago.

### E. OPORTUNIDADES DE REDUCCIÓN
Ninguna de contenido. Una de jerarquía: unificar el peso visual de CTA en todo el sitio con el mismo criterio ya aplicado parcialmente.

### F. TOP 15 RECOMENDACIONES (ordenadas por impacto × valor × factibilidad)
1. Generalizar la jerarquía de 1 CTA primario por sección a todo el sitio, no solo a 2-3 secciones.
2. Confirmar y corregir el canonical/dominio antes de considerar el sitio "publicado" a efectos de SEO.
3. Activar "modelos que miraste recién".
4. Avisar al equipo comercial sobre el link directo por modelo para compartir por WhatsApp.
5. Cruzar operativamente los leads de "interés en usados" con las tasaciones de "plan canje".
6. Dar contexto acumulado al CTA "Combinada" en formas de pago, igual que ya tiene financiación.
7. Sección o mención de equipo comercial/ventas (no solo taller).
8. Citar 2-3 reseñas reales (con permiso) dentro de "Testimonios".
9. Reemplazar la tarjeta estática de Instagram por un feed real, dentro de los límites de la API de Meta.
10. Nombrar localidades regionales concretas en el contenido local, si el concesionario confirma cuáles son relevantes.
11. Agregar un campo opcional de presupuesto/urgencia en el formulario de interés en usados, sin volverlo largo.
12. Confirmar en dispositivo real cómo se ve la nueva sección de formas de pago y el formulario de usados en mobile.
13. Medir cuántos leads de WhatsApp llegan ya con el contexto financiero nuevo, para cuantificar el impacto de esa mejora.
14. Revisar consistencia de nomenclatura restante fuera de "Por qué elegirnos" (confirmar que no quedaron otras referencias viejas al "Por qué acá").
15. Documentar internamente qué falta antes de publicar (lista tipo la nota "reemplazar antes de publicar" que ya dejó el propio equipo, pero centralizada y con dueño y fecha).

### G. PLAN DE ACCIÓN MAESTRO

**FASE 1 — Antes de publicar formalmente**
- Resolver canonical, dominio absoluto y endpoint real de leads (ya señalado como pendiente en el propio código).
- Confirmar el estado real de publicación del sitio.

**FASE 2 — Mejoras de alto valor**
- Generalizar la jerarquía de CTA a todo el sitio.
- Activar "modelos que miraste recién".
- Avisar y capacitar al equipo comercial sobre el link directo por modelo.
- Cruzar demanda de usados con oferta de plan canje operativamente.

**FASE 3 — Diferenciación**
- Sección/mención de equipo comercial.
- Reseñas reales citadas dentro del sitio.
- Contexto acumulado en el CTA "Combinada".

**FASE 4 — Experimental**
- Feed real de Instagram.
- Campo opcional de presupuesto/urgencia en el formulario de usados.

**FASE 5 — Plataforma futura**
- Evaluar contenido indexable por categoría de usados (pick-up/SUV/compacto), aprovechando las categorías que ya usa el formulario de interés.
- Medir y reportar el impacto real de los CTAs con contexto (financiación) para justificar generalizar el patrón a más flujos.

---

*Documento elaborado comparando el código fuente completo de la versión anterior (`repomix-output.xml`) contra el `.zip` actualizado (`index.html`, ~340 KB), línea por línea vía diff. Todo lo marcado `HYPOTHESIS — REQUIRES VALIDATION` requiere capturas de pantalla o acceso al sitio en vivo para confirmarse; no fue posible validarlo en esta ronda porque no se recibieron imágenes nuevas.*
