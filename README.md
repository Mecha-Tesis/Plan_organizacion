# MECHA · la web del equipo

La planta del aula con cada estación pintada según cómo viene. Tocás una estación y ves qué es,
qué falta, qué hay que conseguir y quién. Se tilda desde acá y queda guardado en Notion.

Sale de la tarea 02 del repo `Tesis-bar` (`Tareas/02-Org/spec.md`).

## Cómo está armada

Sin dependencias ni paso de compilación: HTML, CSS y JavaScript.

| Archivo | Qué hace |
|---|---|
| `index.html`, `estilo.css`, `app.js` | La página. |
| `datos/estaciones.js` | **Lo fijo** de cada estación: qué es, quién, lo último que contó Ana, dónde está en la planta y su base de Notion. Lo usan la página y las funciones. |
| `lib/mecha.js` | Cómo se calcula el color de cada estación y el texto de `/mecha.md`. |
| `api/estado.js` | Lee de Notion las tareas de cada estación y el Inventario técnico. |
| `api/tildar.js` | Cambia el `Estado` de una tarea entre `Por hacer` y `Hecha`. Pide la clave del equipo. |
| `api/asignar.js` | Cambia quién se encarga de una tarea (`Quién`). Pide la clave del equipo. |
| `api/mecha.js` | `/mecha.md` y `/mecha.json`: todo junto, para pasarle a una IA. |
| `api/_notion.js` | Lo que habla con Notion. |
| `datos/demo.js` | Datos de prueba, solo para mirarla sin Notion. |
| `dev.mjs` | Servidor para probar en tu compu. No se sube a Vercel. |

**Colores:** verde todo hecho · amarillo falta algo · rojo algo `Bloqueada` · gris sin datos.

**Qué toca de Notion:** solo dos propiedades de las tareas de las bases de estación (Tejo, Booth,
Baño, Cuadro, Rocola, Karaoke, Trago, General):

- `Estado`, y solo entre `Por hacer` y `Hecha`.
- `Quién`, el menú que está al lado de cada tarea: quién se encarga. Las opciones son las de
  `EQUIPO` en `datos/estaciones.js`. Para sumar a alguien, agregalo ahí **y** como opción de
  `Quién` en las ocho bases.

No crea, no borra, no toca el Inventario. Las filas que empiezan con 🗑️ (para borrar) o ⏸️ (en
pausa) no se muestran.

## Ponerla en línea

### 1. Subirla a GitHub

La carpeta ya es un repositorio de git con su primer commit. Creá un repo **vacío** en GitHub
(sin README) y después, desde esta carpeta:

```
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

### 2. Crear la integración de Notion (5 minutos)

1. Entrá a <https://www.notion.so/profile/integrations> → **New integration**.
2. Nombre: `MECHA web`. Tipo: **Internal**. Workspace: el tuyo.
3. En **Capabilities** dejá tildado **Read content** y **Update content**. Lo demás, no.
4. Guardá y copiá el **Internal Integration Secret** (empieza con `ntn_`). Es una clave: no la
   pegues en ningún archivo ni en el chat.
5. En Notion, abrí la página **Tesis Mecha** → `•••` arriba a la derecha → **Connections** →
   agregá `MECHA web`. Así ve las bases de cada estación y el Inventario, y nada más de tu Notion.

### 3. Crear el proyecto en Vercel

1. <https://vercel.com/new> → importá el repo de GitHub.
2. **Project name:** `mecha-equipo` (el link queda `mecha-equipo.vercel.app` si está libre).
   **Framework Preset:** `Other`. No toques Build ni Output.
3. En **Environment Variables** cargá dos:
   - `NOTION_TOKEN` = el secreto del paso 2.
   - `MECHA_CLAVE` = la clave para tildar que quieras. Se la pasás al equipo por WhatsApp.
4. **Deploy.**

Cada `git push` a `main` la vuelve a publicar sola.

### 4. Probar que anda

- Abrí el link en el celular: la planta entra sin scroll de costado y las estaciones tienen color.
- Abrí `/mecha.md`: tiene que decir *"Estado leído de Notion"* con la hora.
- Tildá algo con la clave y fijate en Notion que pasó a `Hecha`. Destildalo.
- Probá con una clave mala: no tiene que tildar nada.

Si arriba dice **"No pude leer Notion"**:

| Dice | Qué pasa |
|---|---|
| Falta NOTION_TOKEN | La variable no está cargada en Vercel, o se cargó después del deploy: hacé **Redeploy**. |
| Notion rechazó NOTION_TOKEN | El secreto está mal copiado. |
| Notion no encuentra una base | La integración no está conectada a *Tesis Mecha* (paso 2.5). |

Si cambiás `MECHA_CLAVE`, a todos se les vuelve a pedir la clave la próxima vez que tilden.

## Para las IAs

Pasale a tu IA el link `https://mecha-equipo.vercel.app/mecha.md`. Es todo el estado en texto
plano: qué es cada estación, qué falta, qué se necesita. `/mecha.json` es lo mismo, en datos.

## Cambiar lo fijo

Lo fijo vive en `datos/estaciones.js`. Se edita ahí, se hace commit y push, y Vercel publica.
Cuando cierre la tarea 01 del repo `Tesis-bar`, esto se regenera desde `rules/estaciones/` y cada
estación deja de decir "a confirmar".

## Probar en tu compu

Hace falta Node 20 o más nuevo. Nada más.

```
node dev.mjs --demo     # datos de prueba; la clave es "demo"
node dev.mjs            # contra Notion de verdad: copiá .env.example como .env.local y llenalo
```

Abre en <http://localhost:3000>.
