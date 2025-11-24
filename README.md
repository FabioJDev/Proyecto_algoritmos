# SmartMarket

Figma: https://www.figma.com/design/JotL8xnG84iLc8DCIasyQZ/Untitled?node-id=0-1&t=2GhK0ob2orsOcujZ-1

Hosting firebase : https://smartmarket-dev-fd27e.web.app/           // si sale la pantalla en blanco recargar la pagina

SmartMarket es una plataforma de subastas moderna e interactiva diseñada para facilitar la compra y venta de productos a través de un sistema de pujas en tiempo real.

## 🚀 Características

- **Autenticación de Usuarios**: Registro e inicio de sesión seguros para gestionar tu cuenta.
- **Listado de Productos**: Explora una amplia variedad de productos disponibles para subasta.
- **Detalle de Producto**: Visualiza información detallada, imágenes y el estado actual de la subasta.
- **Creación de Subastas**: Sube tus propios productos y configura los parámetros de la subasta.
- **Panel de Control (Dashboard)**: Gestiona tus subastas activas, historial de pujas y perfil de usuario.
- **Actualizaciones en Tiempo Real**: Mantente informado sobre el estado de tus pujas y subastas.

## 🛠️ Tecnologías Utilizadas

Este proyecto ha sido construido utilizando las siguientes tecnologías:

- **Frontend**: [React](https://reactjs.org/) (v18) - Biblioteca para construir interfaces de usuario.
- **Build Tool**: [Vite](https://vitejs.dev/) - Herramienta de construcción rápida y moderna.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS utilitario para un diseño rápido y personalizado.
- **Backend / Base de Datos**: [Firebase](https://firebase.google.com/) - Plataforma para el desarrollo de aplicaciones web y móviles.
- **Enrutamiento**: [React Router](https://reactrouter.com/) - Navegación declarativa para aplicaciones React.
- **Utilidades**:
    - `date-fns`: Manejo de fechas.
    - `uuid`: Generación de identificadores únicos.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) (versión recomendada: LTS)
- npm (viene incluido con Node.js)

## 🔧 Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1.  **Clonar el repositorio** (si aplica) o descargar los archivos del proyecto.

2.  **Instalar dependencias**:
    Abre una terminal en la carpeta raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```

3.  **Configuración de Firebase**:
    Asegúrate de tener un proyecto de Firebase configurado. Crea un archivo `.env` en la raíz del proyecto (o utiliza el existente si se proporciona de forma segura) con tus credenciales de Firebase. Ejemplo:
    ```env
    VITE_FIREBASE_API_KEY=tu_api_key
    VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
    VITE_FIREBASE_PROJECT_ID=tu_project_id
    VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
    VITE_FIREBASE_APP_ID=tu_app_id
    ```

4.  **Ejecutar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```

5.  **Abrir en el navegador**:
    Visita la URL que aparece en la terminal (generalmente `http://localhost:5173/`) para ver la aplicación.

## 📂 Estructura del Proyecto

```
src/
├── components/   # Componentes reutilizables de la UI
├── context/      # Contextos de React (ej. AuthContext)
├── hooks/        # Hooks personalizados
├── pages/        # Páginas principales de la aplicación
├── routes/       # Configuración de rutas
├── services/     # Lógica de conexión con Firebase/API
├── styles/       # Archivos de estilos globales (Tailwind)
└── utils/        # Funciones de utilidad
```

Desarrollado para la asignatura de Estructuras de Datos.
