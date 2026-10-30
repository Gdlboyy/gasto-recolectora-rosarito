# Gasto Meta · Recolectora Rosarito

Página estática con el gasto en anuncios de Meta (Facebook / Instagram) y las conversaciones de WhatsApp iniciadas. Lee todos sus datos de `data/gastos.json`; no hay servidor ni base de datos.

## Cómo actualizar

1. En el Administrador de anuncios, pestaña **Anuncios**, elige el rango de fechas y usa **Desglose → Por tiempo → Día**.
2. Abre `data/gastos.json` y agrega un objeto por día nuevo dentro de `"dias"`:
   `{ "fecha": "2026-10-30", "gasto": 50.12, "conversaciones": 3, "impresiones": 1200, "alcance": 950 }`
   (`gasto` en pesos, sin signo de $ ni comas; usa punto para los centavos).
3. Actualiza los totales de cada anuncio en `"anuncios"`, el alcance total en `"totales"` y la fecha en `"actualizado"`.
4. Guarda, haz commit y push. GitHub Pages se actualiza solo.

**Regla:** nunca inventes un número. Si falta un día, no lo agregues.

## Ver en tu computadora

`fetch` no funciona abriendo `index.html` con doble clic. Desde esta carpeta:

```
python -m http.server 8000
```

y abre `http://localhost:8000`.
