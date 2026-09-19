#!/usr/bin/env python3
"""
Marca automáticamente todas las imágenes 'enhanced-*' con data-source="redes-toyota"
Uso: python3 mark-social-images.py index.html
"""

import re
import sys

def mark_social_images(html_path):
    """
    Lee el HTML, encuentra todas las imágenes enhanced-* y las marca con data-source
    """
    print(f"📖 Leyendo archivo: {html_path}")
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patrón: <img ... src="...enhanced-...webp" ... >
    # Buscar imágenes enhanced-* y agregarles data-source si no lo tienen ya
    
    pattern = r'(<img\s+[^>]*src="[^"]*enhanced-[^"]*"[^>]*)(?![^>]*data-source)'
    
    def add_data_source(match):
        img_tag = match.group(1)
        # Verificar que no tenga data-source ya
        if 'data-source=' in img_tag:
            return match.group(0)
        # Agregar data-source antes del cierre >
        return img_tag + ' data-source="redes-toyota"'
    
    new_content = re.sub(pattern, add_data_source, content)
    
    # Contar cambios
    count = len(re.findall(r'data-source="redes-toyota"', new_content)) - len(re.findall(r'data-source="redes-toyota"', content))
    
    if count > 0:
        print(f"✅ Se marcaron {count} imágenes como 'redes-toyota'")
        
        # Guardar
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"💾 Archivo actualizado: {html_path}")
    else:
        print("⚠️ No se encontraron imágenes nuevas para marcar")
    
    print("\n✨ Listo. Todas las imágenes enhanced-* tienen ahora data-source='redes-toyota'")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 mark-social-images.py <ruta-index.html>")
        print("Ejemplo: python3 mark-social-images.py index.html")
        sys.exit(1)
    
    html_path = sys.argv[1]
    mark_social_images(html_path)
