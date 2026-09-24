═══════════════════════════════════════════════════════════════════════════════
BRIEF PARA MANUS — Expandir fichas de modelos Toyota
═══════════════════════════════════════════════════════════════════════════════

🎯 OBJETIVO
───────────
Convertir tu ficha Hilux en plantilla madre reutilizable para TODOS los modelos Toyota.
Resultado: fichas 10x más completas que Haimovicht (competencia).


📊 ESTADO ACTUAL
────────────────
✅ templates/model.html           Plantilla lista, 92 KB
✅ data/models.json               Estructura OK, falta llenar con modelos
✅ scripts/generate-model-pages    Generador automático funcionando
✅ hilux.html                      Ficha de referencia (ya reutilizable)
✅ qa.mjs                          Validación automática de TODO

❌ Solo Hilux tiene ficha completa
❌ RAV4, SW4, Corolla, Yaris = sin fichas


🚀 PRIMEROS 5 PASOS (Esta semana)
─────────────────────────────────

1️⃣  LLENAR data/models.json
    Copiar el objeto Hilux como base
    Agregar: RAV4, SW4, Corolla, Yaris
    (Especificaciones sacadas de README.md)

2️⃣  EXPANDIR cada modelo con campos nuevos
    - useCases: ciudad/familia/trabajo + versión recomendada
    - faqs: preguntas frecuentes por modelo
    - localOffers: financiación, promos vigentes
    - financingPromo: tasa + plazo

3️⃣  MEJORAR templates/model.html
    Agregar 5 secciones nuevas (ver abajo)

4️⃣  REGENERAR automáticamente
    node scripts/generate-model-pages.mjs

5️⃣  PROBAR TODO
    node qa.mjs --quick (8-12 min, solo 3 anchos)


📝 LAS 5 SECCIONES NUEVAS
──────────────────────────

1. "¿Cuál es mi versión?" (use case selector)
   Usuario elige: ciudad / familia / trabajo
   → Sistema recomienda versión + por qué

2. Comparativa interactiva (vs otros modelos)
   Hilux vs RAV4 vs SW4 (precio, carga, consumo)

3. Ofertas locales (que Haimovicht NO tiene)
   Financiación, seguros, accesorios, cambios

4. Stock local
   "¿Está disponible en nuestro local?"

5. Datos verificados + fuentes
   Transparencia: qué viene de Toyota vs qué es local


📚 DOCUMENTOS INCLUIDOS
─────────────────────────
1. PLAN-SUPERARLOS.md (estrategia completa + código)
2. hilux.html (referencia)
3. README.md (datos verificados)
4. data/models.json (estructura actual)
5. templates/model.html (plantilla madre)


✔️  VENTAJAS DE ESTE APPROACH
──────────────────────────────
• Escalable: 1 plantilla = N páginas
• Mantenible: cambios en un lugar, replican a todas
• Data-driven: fácil agregar campos nuevos
• Automático: generador hace el trabajo pesado
• Verificable: qa.mjs prueba TODO


⏱️  TIMELINE
───────────
Semana 1: Data + estructura          (3-4 horas)
Semana 2: Interactividad (quiz, etc) (4-6 horas)
Semana 3: Pulido + test              (2-3 horas)

Total: 2-3 semanas para tener **fichas profesionales**.


🔧 COMANDOS A USAR
──────────────────

# Llenar data/models.json
# (copiar hilux, renombrar slug, actualizar datos)

# Regenerar páginas desde JSON
node scripts/generate-model-pages.mjs

# Probar rapidito (3 anchos, 8-12 min)
node qa.mjs --quick

# Prueba completa (10 anchos, 20-30 min)
node qa.mjs

# Ver en navegador
# → qa-report/index.html


❓ DUDAS COMUNES
────────────────
P: ¿Hago fichas manuales o con el generador?
R: Generador. Editas JSON, regeneras páginas, listo.

P: ¿Cuántos modelos agrego ahora?
R: Empieza con 3 (RAV4, SW4, Corolla). Luego los demás.

P: ¿Cómo verifico que funciona todo?
R: Ejecuta `node qa.mjs --quick`. Si dice "OK", funciona.

P: ¿Se ve igual en mobile y desktop?
R: Sí. La plantilla ya es responsiva.


📖 LEE PRIMERO
──────────────
PLAN-SUPERARLOS.md (línea por línea, 5 min lectura rápida)
Tiene ejemplos de JSON + HTML + estrategia completa.


💡 PRÓXIMO PASO
────────────────
1. Abre data/models.json
2. Copia el objeto "hilux" completo
3. Renombra "slug" a "rav4"
4. Actualiza campos con especificaciones RAV4
5. Listo, regenera con `node scripts/generate-model-pages.mjs`

═══════════════════════════════════════════════════════════════════════════════

Creado: Septiembre 2024
Para: Manus (desarrollo de fichas)
Referencia: PLAN-SUPERARLOS.md
