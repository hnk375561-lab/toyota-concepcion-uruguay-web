# Go-live checklist

1. Confirmá por escrito el dominio final, teléfono, WhatsApp, horarios, dirección y redes.
2. Revisá la demo en 390, 768, 1440 y 1920 px; no publiques si hay errores de consola o enlaces rotos.
3. Definí `DOMAIN` al ejecutar `./golive/golive.sh` y aceptá la confirmación.
4. Verificá `robots.txt`, `sitemap.xml`, canonical y Open Graph en el dominio final.
5. Configurá `GA4_ID` solo si existe consentimiento y una política de privacidad aprobada.
6. Volvé a ejecutar los tests funcionales sobre la URL publicada.

El repositorio de demo conserva `noindex`. El script no cambia nada hasta recibir confirmación explícita.
