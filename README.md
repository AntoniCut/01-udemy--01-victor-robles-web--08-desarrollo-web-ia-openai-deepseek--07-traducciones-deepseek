# 07 - Traducciones con DeepSeek

Aplicacion de traduccion implementada con **JavaScript**, **Node.js**, **Express** y la **API de DeepSeek** (compatible con OpenAI). El usuario introduce un texto en el chat, elige el idioma destino y el backend llama a `openai.chat.completions.create()` con el modelo `deepseek-chat` para generar la traduccion, que se muestra en el chat con un mensaje temporal "Escribiendo..." mientras llega la respuesta.

Repositorio: https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--07-traducciones-deepseek

---

## Tabla de contenidos

1. [Stack tecnologico](#stack-tecnologico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Variables de entorno](#variables-de-entorno)
4. [Despliegue en local](#despliegue-en-local)
5. [Despliegue en produccion (VPS + Nginx)](#despliegue-en-produccion-vps--nginx)
6. [Endpoint API](#endpoint-api)
7. [UX del chat](#ux-del-chat)
8. [Build de produccion con Gulp](#build-de-produccion-con-gulp)
9. [Licencia](#licencia)

---

## Stack tecnologico

- **Backend:** Node.js (ES Modules), Express 5, OpenAI Node SDK 6 (apuntando a la API de DeepSeek mediante `baseURL`).
- **Frontend:** HTML + CSS + JS estaticos servidos desde `public/`. `main.js` como modulo ES con chat interactivo y animacion "Escribiendo..." mientras llega la respuesta.
- **Build:** Gulp 5 (terser, clean-css, htmlmin) para generar `dist/`.
- **Dev server:** Nodemon.
- **Despliegue:** Nginx como reverse proxy + PM2 como process manager.

Dependencias principales (`package.json`):

| Paquete     | Version  | Uso                                              |
|-------------|----------|--------------------------------------------------|
| express     | ^5.2.1   | Servidor HTTP y middleware                       |
| openai      | ^6.16.0  | SDK de OpenAI (apuntando a DeepSeek)            |
| dotenv      | ^17.2.3  | Carga de variables de entorno                    |
| axios       | 1.8.1    | Cliente HTTP (utilidades internas)               |

---

## Estructura del proyecto

```
07-traducciones-deepseek/
├── app.js                  # Servidor Express + endpoint /api/traducir
├── gulpfile.js             # Tareas de build (minificacion, copia a dist/)
├── package.json
├── pnpm-lock.yaml
├── jsconfig.json           # Configuracion de TypeScript para checkJs
├── .env                    # Variables de entorno (NO subir al repo)
├── .gitignore
├── app.http                # Pruebas del endpoint (VS Code REST Client)
├── DEPLOY.md               # Guia de despliegue en VPS
├── FLUJO_LLAMADAS.md       # Diagrama del flujo de llamadas
├── public/                 # Frontend estatico
│   ├── index.html
│   └── assets/
│       ├── css/
│       ├── img/
│       └── js/
│           └── main.js             # Modulo ES principal del chat
└── types/                  # Tipos JSDoc
    └── global.d.ts                # Tipos globales (TraduccionRequest, etc.)
```

---

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
# Puerto del servidor (en produccion, > 1024 para no necesitar root)
PORT=1117

# API key de DeepSeek (https://platform.deepseek.com/api_keys)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

Notas:

- `DEEPSEEK_API_KEY` es **obligatoria**. Sin ella, el endpoint devolvera `500`.
- El SDK de OpenAI se configura con `baseURL: "https://api.deepseek.com"` y la API key de DeepSeek.
- El archivo `.env` esta incluido en `.gitignore`. **No lo subas al repositorio**.

---

## Despliegue en local

### Requisitos

- Node.js >= 18 (recomendado 20 LTS o superior).
- npm (incluido con Node) o pnpm.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--07-traducciones-deepseek.git
cd 07-traducciones-deepseek

# 2. Instalar dependencias
npm install
# o, si prefieres pnpm:
pnpm install

# 3. Crear el archivo .env
nano .env
#   PORT=1117
#   DEEPSEEK_API_KEY=sk-...

# 4. Arrancar en modo desarrollo (con nodemon)
npm run dev
# o en modo produccion simple:
npm run serve
```

La aplicacion estara disponible en:

```
http://localhost:1117/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek/
```

> El puerto por defecto del codigo es `3000`, pero este proyecto usa `1117` para evitar conflicto con otros proyectos del portfolio. Puedes cambiar `PORT` en `.env`.

---

## Despliegue en produccion (VPS + Nginx)

Arquitectura: **Nginx** (reverse proxy + SSL con Let's Encrypt) -> **Node.js** gestionado con **PM2** en el mismo VPS.

### 1. Subir el codigo al VPS

Con FileZilla, sube todo el contenido del proyecto (excepto `node_modules`, `.env` y `dist/`) a:

```
/var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek
```

### 2. Instalar dependencias en el VPS (sin devDependencies)

Conecta por SSH y ejecuta:

```bash
cd /var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek

# Crear el .env de produccion (con tus claves reales)
nano .env
#   PORT=1117
#   DEEPSEEK_API_KEY=sk-...

# Instalar solo dependencias de produccion
npm install --omit=dev
```

> Importante: en Linux, los puertos < 1024 requieren root. Usa `PORT=1117` o cualquier puerto >= 1024 para no necesitar privilegios.

### 3. Arrancar con PM2 (persiste al cerrar SSH)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Arrancar la app
pm2 start app.js --name traducciones-deepseek

# Configurar arranque automatico tras reinicio del servidor
pm2 startup
pm2 save
```

Comandos utiles de PM2:

```bash
pm2 status                              # Ver estado
pm2 logs traducciones-deepseek          # Ver logs en tiempo real
pm2 restart traducciones-deepseek       # Reiniciar
pm2 stop traducciones-deepseek          # Detener
pm2 delete traducciones-deepseek        # Eliminar del registro
```

### 4. Configurar Nginx como reverse proxy

Edita el bloque `server` de tu vhost (`/etc/nginx/sites-available/udemy.antonydev.tech` o donde lo tengas) y anade una `location`:

```nginx
location ^~ /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek {
    proxy_pass http://localhost:1117;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> Usa `^~` para que Nginx no intente servir archivos estaticos directamente desde `root` antes de hacer proxy.

Recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Verificar

```
https://udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek/
```

---

## Endpoint API

### `POST /api/traducir`

Recibe un texto y un idioma destino, llama a la API de DeepSeek (modelo `deepseek-chat`) y devuelve el texto traducido.

**Request body:**

```json
{
  "text": "Hola, como estas?",
  "targetLang": "ingles"
}
```

**Respuesta 200 (exito):**

```json
{
  "translation": "Hello, how are you?"
}
```

**Respuesta 400 (solicitud invalida):**

```json
{ "error": "Faltan parametros: text o targetLang" }
```

**Respuesta 500 (error interno / fallo de DeepSeek):**

```json
{ "error": "Error al traducir el texto." }
```

Tambien accesible en la ruta con prefijo:

```
POST /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek/api/traducir
```

---

## UX del chat

1. El usuario escribe el texto a traducir y elige el idioma destino en el `<select>`.
2. Al pulsar **Traducir** (o `Enter`), se anade el texto al chat con el prefijo `Tu:`.
3. Se inserta un mensaje temporal con el prefijo `Traductor: Escribiendo.` y la clase `chat__message--typing` (estilo italic + opacidad 0.75). Un `setInterval` anima los puntos cada 500 ms.
4. El backend llama a `openai.chat.completions.create()` con dos prompts de sistema (uno define el rol de traductor experto, otro impone restricciones) y un prompt de usuario con el texto y el idioma destino.
5. Al recibir la respuesta, se detiene la animacion, se quita la clase `typing` del mensaje y se sustituye su contenido por `Traductor: {traduccion}`.

---

## Build de produccion con Gulp

El proyecto incluye un `gulpfile.js` que genera una version minificada del frontend y copia el backend a `dist/`:

```bash
npm run build
```

Salida: carpeta `dist/` con HTML/CSS/JS minificados, `app.js` y un `package.json` minimo.

Para ejecutar el build:

```bash
npm run start:prod
```

---

## Licencia

ISC (c) AntonyDev
