# 🚀 Guía de despliegue — App Express + Node.js en VPS con Nginx

> Referencia para servir una aplicación Node.js/Express en un VPS con Nginx como proxy inverso y PM2 como gestor de procesos.

---

## 📋 Requisitos previos en el servidor

- Ubuntu/Debian con Node.js instalado
- Nginx instalado y corriendo
- Acceso SSH como root o usuario con sudo
- (Opcional) Dominio apuntando al VPS

---

## 1. Preparar el build local

Genera la carpeta `dist/` con el build de producción:

```bash
pnpm run build   # o npm run build
```

La carpeta `dist/` debe contener:
```
dist/
├── app.js
├── package.json
└── public/
```

---

## 2. Subir archivos al servidor (FileZilla)

- **Protocolo:** SFTP
- **Host:** `sftp://tu-dominio-o-ip`
- **Puerto:** `22`
- **Usuario / Contraseña:** credenciales SSH

Sube el **contenido** de `dist/` a la ruta del servidor, por ejemplo:
```
/var/www/udemy.antonydev.tech/victor-robles-web/.../01-traducciones-openai/
```

> ⚠️ **No subas** `.env` ni `node_modules/` por FileZilla.

---

## 3. Crear el `.env` en el servidor

Conéctate por SSH:
```bash
ssh root@tu-dominio-o-ip
```

Navega a la carpeta del proyecto y crea el `.env`:
```bash
cd /var/www/.../01-traducciones-openai
nano .env
```

Contenido:
```env
PORT=3001
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
```

Guarda: `Ctrl+O` → `Enter` → `Ctrl+X`

> El `PORT` es un puerto interno. Node.js escucha en él; Nginx redirige el tráfico externo hacia ese puerto.

---

## 4. Instalar dependencias en el servidor

```bash
npm install --omit=dev
```

Solo instala dependencias de producción (sin `devDependencies`).

---

## 5. Instalar y configurar PM2

PM2 mantiene la app corriendo en segundo plano y la reinicia si se cae.

```bash
npm install -g pm2
```

Arrancar la app:
```bash
pm2 start app.js --name "nombre-de-la-app"
```

Guardar el estado para que sobreviva reinicios del servidor:
```bash
pm2 save
pm2 startup   # copia y ejecuta el comando que te muestre
```

### Comandos útiles de PM2

```bash
pm2 list                        # ver apps corriendo
pm2 logs nombre-de-la-app       # ver logs en tiempo real
pm2 restart nombre-de-la-app    # reiniciar
pm2 stop nombre-de-la-app       # detener
pm2 delete nombre-de-la-app     # eliminar del listado
```

---

## 6. Configurar Nginx como proxy inverso

Edita el archivo de configuración de Nginx:
```bash
nano /etc/nginx/sites-available/tu-dominio.conf
```

Añade un bloque `location` **antes** del `location /` general:

```nginx
# 🔹 Node.js App — nombre del proyecto
location ^~ /ruta/del/proyecto {
    proxy_pass http://localhost:3001;   # mismo PORT del .env
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> ⚠️ El `location ^~` tiene prioridad sobre el `location /` del Astro/frontend estático — esto evita que las rutas caigan al fallback.

Verificar y recargar Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Verificar que todo funciona

```bash
pm2 list                         # la app debe aparecer como "online"
curl http://localhost:3001       # probar directamente el puerto Node
pm2 logs nombre-de-la-app        # revisar errores si algo falla
```

Abrir en el navegador:
```
https://tu-dominio.com/ruta/del/proyecto/
```

---

## 🔄 Flujo para actualizar la app

1. Hacer cambios y generar nuevo build: `pnpm run build`
2. Subir el contenido de `dist/` por FileZilla (reemplazar archivos)
3. En el servidor: `pm2 restart nombre-de-la-app`

---

## 🗂 Resumen de qué sube al servidor

| Archivo / Carpeta | ¿Sube? | Notas |
|---|---|---|
| `dist/app.js` | ✅ | Servidor Express |
| `dist/public/` | ✅ | Frontend estático |
| `dist/package.json` | ✅ | Lista de dependencias |
| `.env` | ❌ | Crear manualmente en servidor |
| `node_modules/` | ❌ | Instalar con `npm install` |
| `gulpfile.js` | ❌ | Solo para desarrollo local |
