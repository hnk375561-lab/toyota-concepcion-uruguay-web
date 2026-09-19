# Secciones retiradas en Fase 5


Este archivo conserva el HTML completo de cada sección retirada. El contenido funcional fue movido o sus enlaces fueron retargeteados según `docs/reestructuracion-scroll.md`.

## #destacados

```html

<section class="premium-reveal" id="destacados">
<div class="wrap">
<div class="section-head split-head">
<div>
<span class="tag gold">Destacados</span>
<h2>Una selección de la gama.</h2>
<p>Un vistazo rápido a la gama. Deslizá o usá las flechas para ver más.</p>
</div>
<div aria-label="Desplazar destacados" class="highlight-nav">
<button aria-label="Ver destacados anteriores" class="highlight-nav-btn" id="highlightPrev" type="button"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path></svg></button>
<button aria-label="Ver más destacados" class="highlight-nav-btn" id="highlightNext" type="button"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path></svg></button>
</div>
</div>
<div class="highlight-track" id="highlightTrack"><!-- se completa por JS --></div>
</div>
</section>

```

## #categorias

```html

<section class="expansion-dark premium-reveal" id="categorias">
<div class="wrap"><div class="section-head"><div><span class="tag gold">Explorá por uso</span><h2>Encontrá la categoría que encaja con vos</h2><p class="muted">Filtrá la gama por tipo de vehículo y seguí desde ahí hacia la ficha o el comparador.</p></div></div>
<div class="category-grid">
<article class="category-card" data-category="pickup" data-mark="P"><img alt="" aria-hidden="true" class="category-mark-logo" decoding="async" height="256" loading="lazy" src="toyota-sharp-assets/asset-bec83be10e47-256.webp" width="256"/><h3>Pick-ups</h3><p>Para trabajo, carga y aventura. Incluye la gama Hilux disponible para consultar.</p><a class="category-link" href="#gama">Explorar pick-ups ↗</a></article>
<article class="category-card" data-category="suv" data-mark="S"><img alt="" aria-hidden="true" class="category-mark-logo" decoding="async" height="256" loading="lazy" src="toyota-sharp-assets/asset-bec83be10e47-256.webp" width="256"/><h3>SUV</h3><p>Más espacio y versatilidad para moverte en ciudad, ruta y viajes.</p><a class="category-link" href="#gama">Explorar SUV ↗</a></article>
<article class="category-card" data-category="sedan" data-mark="C"><img alt="" aria-hidden="true" class="category-mark-logo" decoding="async" height="256" loading="lazy" src="toyota-sharp-assets/asset-bec83be10e47-256.webp" width="256"/><h3>Sedanes</h3><p>Confort y eficiencia para el uso diario, con opciones publicadas para consultar.</p><a class="category-link" href="#gama">Explorar sedanes ↗</a></article>
<article class="category-card" data-category="todos" data-mark="T"><img alt="" aria-hidden="true" class="category-mark-logo" decoding="async" height="256" loading="lazy" src="toyota-sharp-assets/asset-bec83be10e47-256.webp" width="256"/><h3>Toda la gama</h3><p>Compará modelos, abrí una ficha y consultá versiones y disponibilidad.</p><a class="category-link" href="#gama">Ver todos ↗</a></article>
</div>
</div>
</section>

```

## #vistos

```html

<section class="premium-reveal" id="vistos">
<div class="wrap recent-shell"><strong>Modelos que miraste recién</strong><span class="muted">Retomá una ficha sin volver a buscarla.</span><div aria-atomic="true" aria-live="polite" class="recent-list" id="recentList"></div></div>
</section>

```

## #servicios-adicionales

```html

<section class="expansion-section premium-reveal" id="servicios-adicionales"><div class="wrap"><div class="section-head"><div><span class="tag">Servicios adicionales</span><h2>Completá tu consulta con el canal adecuado.</h2><p>Información general, sin atribuir alianzas o beneficios no confirmados.</p></div></div><div class="expansion-grid"><article class="expansion-card"><div class="expansion-icon">$</div><h3>Financiación</h3><p>Consultá alternativas con tu banco y las líneas vigentes en el concesionario.</p><a class="text-link" href="#financiacion">Ver simulador ↗</a></article><article class="expansion-card"><div class="expansion-icon">✓</div><h3>Seguro</h3><p>Pedí orientación sobre los pasos y documentación necesarios para tu operación.</p><a class="text-link" href="#contacto">Consultar orientación ↗</a></article><article class="expansion-card"><div class="expansion-icon">＋</div><h3>Garantía y cobertura</h3><p>La vigencia y las condiciones se revisan según el vehículo y el mantenimiento realizado.</p><a class="text-link" href="#faq">Leer preguntas ↗</a></article><article class="expansion-card"><div class="expansion-icon">↗</div><h3>Entrega</h3><p>Coordiná documentación, condiciones y fecha directamente con el concesionario.</p><a class="text-link" href="#contacto">Coordinar consulta ↗</a></article></div></div></section>

```

## #contacto-ampliado

```html

<section class="expansion-section premium-reveal" id="contacto-ampliado"><div class="wrap"><div class="section-head"><div><span class="tag">Contacto directo</span><h2>Elegí cómo querés hablar con el equipo.</h2><p>Canales individuales para ventas, turnos, repuestos, neumáticos y ubicación.</p></div></div><div class="contact-plus"><a class="contact-plus-card" href="https://wa.me/5493442473453?text=Hola!%20Quiero%20hablar%20con%20un%20asesor.%20" rel="noopener" target="_blank"><i class="contact-plus-icon"><svg aria-hidden="true" class="icon-solid" viewbox="0 0 32 32"><path d="M16.04 4C9.42 4 4.05 9.36 4.05 15.98c0 2.11.55 4.17 1.6 5.98L4 28l6.2-1.62a12 12 0 005.83 1.49h.01c6.62 0 11.99-5.36 11.99-11.98C28.03 9.36 22.66 4 16.04 4zm0 21.9h-.01a9.9 9.9 0 01-5.05-1.38l-.36-.22-3.75.98.99-3.66-.24-.38a9.9 9.9 0 01-1.53-5.28c0-5.48 4.46-9.94 9.96-9.94 2.66 0 5.15 1.04 7.03 2.92a9.85 9.85 0 012.91 7.02c0 5.48-4.46 9.94-9.95 9.94zm5.46-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"></path></svg></i><div><b>Hablar con un asesor</b><span>Consulta general por WhatsApp</span></div></a><a class="contact-plus-card" href="tel:+543442473453"><i class="contact-plus-icon">☎</i><div><b>Llamar al concesionario</b><span>03442 47-3453</span></div></a><a class="contact-plus-card" href="https://wa.me/5493442677433?text=Hola!%20Quiero%20consultar%20por%20repuestos%20o%20accesorios.%20" rel="noopener" target="_blank"><i class="contact-plus-icon">RP</i><div><b>Repuestos y accesorios</b><span>Consulta de disponibilidad</span></div></a><a class="contact-plus-card" href="https://wa.me/5493442502390?text=Hola!%20Quiero%20consultar%20por%20neum%C3%A1ticos.%20" rel="noopener" target="_blank"><i class="contact-plus-icon">NT</i><div><b>Neumáticos</b><span>Medidas y disponibilidad</span></div></a><a class="contact-plus-card" href="https://www.google.com/maps/search/?api=1&amp;query=Pi%C3%B1eyro%20y%20Moscatelli%20Toyota%20Concepci%C3%B3n%20del%20Uruguay" rel="noopener" target="_blank"><i class="contact-plus-icon">↗</i><div><b>Cómo llegar</b><span>Direcciones a 9 de Julio 1624</span></div></a><a class="contact-plus-card" href="https://www.instagram.com/toyotacdelu/?hl=es" rel="noopener" target="_blank"><i class="contact-plus-icon"><svg aria-hidden="true" class="icon-outline" viewbox="0 0 24 24"><rect height="18" rx="5.5" width="18" x="3" y="3"></rect><circle cx="12" cy="12" r="4.1"></circle><circle cx="17.35" cy="6.65" fill="currentColor" r="1.1" stroke="none"></circle></svg></i><div><b>Instagram</b><span>@toyotacdelu</span></div></a></div><div class="cta-lite"><a class="btn primary" href="https://wa.me/5493442473453?text=Hola!%20Quiero%20suscribirme%20a%20las%20novedades%20y%20promociones%20vigentes.%20" rel="noopener" target="_blank">Recibir novedades por WhatsApp ↗</a><a class="btn" href="#ubicacion">Ver horarios y ubicación ↗</a></div></div></section>

```
