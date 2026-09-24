═══════════════════════════════════════════════════════════════════════════════
ANÁLISIS: Toyota Concepción del Uruguay vs. Haimovicht Toyota
═══════════════════════════════════════════════════════════════════════════════

## Tu Situación Actual

### ✅ FORTALEZAS DE TU REPO

1. **Ficha madre profesional** (`templates/model.html`)
   - 92 KB, bien estructurada
   - Datos dinámicos desde JSON
   - Placeholders listos para replicar
   - Animaciones con GSAP + ScrollTrigger + Lenis
   - Lazy loading de scripts

2. **Data-driven** (`data/models.json`)
   - Estructura completa de especificaciones
   - Validación de campos en el generador
   - Metadata rich para SEO/OG

3. **Hilux.html como caso de éxito**
   - Secciones bien organizadas:
     * Hero con imagen destacada
     * ¿Qué conviene? (use cases)
     * Versiones comparables
     * Rendimiento motor (2.4 vs 2.8)
     * Ficha técnica estructurada
     * Dimensiones + off-road aptitud
     * Colores disponibles
     * Accesorios genuinos
     * FAQ
     * Fuentes verificadas
     * CTA clara (contacto)

4. **Stack moderno**
   - AVIF + WebP + srcset (optimización de imágenes)
   - Preload estratégico
   - `model-ficha.css` centralizado
   - Vendor JS lazy-loaded (GSAP, ScrollTrigger, Lenis, Flip)

---

## Análisis: Haimovicht Toyota (haimovichtoyota.com.ar)

### 📊 Qué hace bien

1. **Home profesional** con hero slide
2. **Catálogo de modelos** visible (listado)
3. **Contacto directo** (WhatsApp, teléfono)
4. **Newsletter** (recolección de leads)
5. **Locales** (dirección + horarios)
6. **Responsivo** (se ve bien en mobile)

### ❌ Dónde está débil

1. **Fichas de modelos = superficiales**
   - Datos genéricos, no especificaciones argentinas
   - Imágenes básicas
   - Sin comparación de versiones
   - Sin especificaciones locales (impuestos, promos)
   - No hay datos estructurados (schema.org)

2. **Sin datos verificados**
   - No menciona fuentes
   - No separa "oficial Toyota" de "datos locales"
   - Ambigüedad en disponibilidad

3. **UX de decisión débil**
   - El usuario no sabe qué versión le conviene
   - Sin comparativas de motores
   - Sin análisis de equipamiento
   - Sin FAQ contextualizado

4. **SEO débil**
   - Sin JSON-LD en fichas
   - Títulos genéricos
   - Sin Open Graph optimizado
   - Sin canonical tags claros

5. **Llamadas a acción débiles**
   - Botones genéricos
   - Sin contextualización por modelo
   - Sin oferta clara

---

## ✅ CÓMO SUPERARLOS (Plan de Ataque)

### Fase 1: Ficha Madre Completa (Ahora)

Tu `templates/model.html` ya es buena, pero agregar:

```json
// Campos a agregar en data/models.json para cada modelo:

{
  // ... (lo que ya tenés)
  
  // DIFERENCIALES LOCALES
  "localHook": "¿Por qué elegir esta versión en Concepción del Uruguay?",
  "financingPromo": "En Piñeyro y Moscatelli: %",
  "localSpecsTitle": "Especificaciones para Argentina",
  
  // USO CASES (no solo especificaciones)
  "useCases": [
    {
      "type": "ciudad",
      "title": "Para la ciudad",
      "description": "Consumo eficiente, fácil estacionamiento",
      "bestVersion": "SRV 2.0",
      "why": "Motor económico, tecnología de confort"
    },
    {
      "type": "familia",
      "title": "Para familias",
      "description": "Seguridad, espacio, confort",
      "bestVersion": "SRX 2.8",
      "why": "9 airbags, DSC, ESP"
    },
    {
      "type": "trabajo",
      "title": "Para trabajar",
      "description": "Carga útil, tracción, resistencia",
      "bestVersion": "TX 4x4",
      "why": "1065 kg de carga, 4x4 con reductor"
    }
  ],
  
  // COMPARATIVA INTERACTIVA
  "compareTo": ["rav4", "sw4"], // Otros modelos Toyota
  
  // FAQ CONTEXTUALIZADO AL MODELO
  "faqs": [
    {
      "q": "¿Cuál es la diferencia entre 2.4 y 2.8?",
      "a": "...",
      "updatedAt": "2026-09-23"
    }
  ],
  
  // OFERTAS LOCALES
  "localOffers": [
    {
      "title": "Plan de financiación",
      "rate": "X% TNA", 
      "terms": "36 cuotas",
      "validUntil": "2026-10-31"
    }
  ]
}
```

### Fase 2: Secciones Nuevas en la Ficha

Agregar a `templates/model.html`:

```html
<!-- 1. HERO CONTEXTUALIZADO -->
<section class="ficha-hero-context">
  <h2>¿Por qué este modelo es perfecto para vos?</h2>
  <div class="use-case-selector">
    <!-- Botones para Ciudad / Familia / Trabajo -->
    <!-- Cada uno muestra la versión recomendada + por qué -->
  </div>
</section>

<!-- 2. COMPARATIVA INTERACTIVA -->
<section class="ficha-compare">
  <h2>Compará con otros Toyota</h2>
  <table role="grid">
    <!-- Hilux vs RAV4 vs SW4 (precio, carga, consumo, etc.) -->
  </table>
</section>

<!-- 3. TIMELINE DE ESPECIFICACIONES ARGENTINAS -->
<section class="ficha-argentina-timeline">
  <h2>Especificaciones confirmadas para Argentina</h2>
  <timeline>
    <!-- Cuándo entró al mercado, cambios, versiones disponibles -->
  </timeline>
</section>

<!-- 4. SCORING DE EQUIPAMIENTO POR VERSIÓN -->
<section class="ficha-equipment-scoring">
  <h2>¿Qué versión tiene más features?</h2>
  <!-- Matriz: SRV, SRX, etc. vs Seguridad, Confort, Tech -->
</section>

<!-- 5. OFERTAS LOCALES (HAIMOVICHT NO TIENE ESTO) -->
<section class="ficha-local-offers">
  <h2>Ofertas actuales en Piñeyro y Moscatelli</h2>
  <!-- Financiación, seguros, accesorios, cambios -->
</section>

<!-- 6. VERIFICACIÓN DE STOCK LOCAL -->
<section class="ficha-stock">
  <h2>¿Está disponible en nuestro local?</h2>
  <form class="stock-checker">
    <!-- Selector de versión + "Consultar stock" -->
  </form>
</section>
```

### Fase 3: Datos Estructurados (JSON-LD)

Agregar a cada ficha:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Toyota Hilux",
  "description": "...",
  "url": "https://piñeyro-moscatelli.com/hilux.html",
  "brand": {
    "@type": "Brand",
    "name": "Toyota"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "ARS",
    "lowPrice": "XXX",
    "highPrice": "XXX",
    "offerCount": 3,
    "url": "https://wa.me/..."
  },
  "reviews": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Cliente" },
      "datePublished": "2026-09-23",
      "reviewRating": { "@type": "Rating", "ratingValue": "5" }
    }
  ]
}
</script>
```

### Fase 4: Funcionalidades Únicas (que Haimovicht NO TIENE)

1. **Configurador interactivo**
   ```
   Seleccionar:
   - Modelo
   - Versión
   - Color
   - Accesorios (opcional)
   → Precio estimado (con impuestos argentinos)
   → Link a WhatsApp con la configuración
   ```

2. **Comparador de versiones (drag & drop)**
   ```
   Elegir 2-3 versiones del MISMO modelo
   → Tabla interactiva destacando diferencias
   → "La SRX es 8% más cara pero tiene X features"
   ```

3. **Calculadora de TCO (Total Cost of Ownership)**
   ```
   Entrada: precio, combustible, mantenimiento, seguros
   Salida: costo total a 5 años
   ```

4. **"¿Cuál es MI Hilux?"**
   ```
   Quiz de 5 preguntas:
   - ¿Dónde manejás? (ciudad/ruta/off-road)
   - ¿Cuántos pasajeros?
   - ¿Lleva carga?
   - ¿Presupuesto?
   - ¿Importante el lujo?
   
   → Recomendación + por qué + link a WhatsApp
   ```

5. **Video-síntesis por versión**
   ```
   Cada versión: 60 seg video mostrando:
   - Interior / exterior
   - Puntos clave
   - CTA: "Agendar prueba de manejo"
   ```

---

## 📋 Plan de Ejecución

### Semana 1: Completar Datos
- Llenar `data/models.json` con campos nuevos
- Validar especificaciones (usar README existente)
- Confirmar ofertas locales con el concesionario

### Semana 2: Plantilla Expandida
- Agregar secciones a `templates/model.html`
- CSS en `model-ficha.css` (nuevas clases)
- Regenerar páginas con `generate-model-pages.mjs`

### Semana 3: Interactividad
- Configurador (vanilla JS, sin dependencias)
- Comparador (tabla + sorting)
- Quiz (formulario simple)

### Semana 4: Pulido + Verificación
- Ejecutar `node qa.mjs` (todos los anchos)
- Lighthouse score ≥ 90
- Tests de formularios
- Publicar en GitHub Pages

---

## 🎯 Diferenciadores vs Haimovicht

| Función | Haimovicht | Tuyo (Ahora) | Tuyo (Mejora) |
|---------|-----------|-------------|---------------|
| Fichas de modelos | Sí, genérica | Hilux solo | Todos, ricas |
| Especificaciones argentinas | No | Sí | Sí + validadas |
| Comparativa de versiones | No | Sí (Hilux) | Sí + interactivo |
| Datos verificados | No | Parcial | Sí, con fuentes |
| JSON-LD / Schema | No | No | Sí |
| Configurador | No | No | Sí |
| Calculadora TCO | No | No | Sí |
| Quiz recomendador | No | No | Sí |
| Ofertas locales | No | No | Sí |
| Video por versión | No | No | Sí |
| QA automático | No | No | Sí (qa.mjs) |

---

## 🚀 Ventajas de tu Approach

1. **Escalable**: Un JSON + una plantilla = N páginas
2. **Mantenible**: Cambios en un lugar, se replican a todas
3. **Data-driven**: Fácil agregar campos nuevos
4. **Verificable**: `qa.mjs` prueba TODO automáticamente
5. **Rápido**: Generación automática + cacheable

---

## 🎬 Próximos Pasos Inmediatos

1. **Completar `data/models.json`** con todos los Toyota Argentina (no solo Hilux)
2. **Expandir `templates/model.html`** con las 5 secciones nuevas
3. **Agregar quiz + configurador** (JS vanilla, responsivo)
4. **Ejecutar `node qa.mjs`** para validar todo

Tu ficha de Hilux = **plantilla madre perfecta**. Solo necesitás replicarla y expandirla.

¡Podés superarlos en 2-3 semanas!

═══════════════════════════════════════════════════════════════════════════════
