# 📘 Guía de Uso - SmartMarket

## 🎨 Sistema de Diseño

### Colores Principales
```css
/* Fondos */
--bg-primary: #0b1020
--bg-card: #131a35
--bg-light: #253565

/* Textos */
--text-main: #e9eefb
--text-muted: #8fa2d6

/* Acentos */
--accent-blue: #4f6ef7
--accent-purple: #a44fff
```

### Clases CSS Personalizadas

#### Tarjetas
```jsx
<div className="card">
  // Tarjeta con bordes redondeados, sombra y padding
</div>
```

#### Botones
```jsx
<button className="btn">Botón Principal</button>
<button className="btn secondary">Botón Secundario</button>
```

#### Badges
```jsx
<span className="badge">Badge Normal</span>
<span className="badge highlight">Badge Destacado</span>
```

#### Campos de formulario
```jsx
<div className="field">
  <label>Etiqueta</label>
  <input type="text" />
</div>
```

#### Grids responsivos
```jsx
<div className="grid-3">
  // 1 columna en móvil, 2 en tablet, 3 en desktop
</div>

<div className="grid-2">
  // 1 columna en móvil, 2 en desktop
</div>
```

## 🎭 Animaciones con Framer Motion

### Animación de entrada básica
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido
</motion.div>
```

### Hover y Tap
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Botón Interactivo
</motion.button>
```

### Animación en lista
```jsx
<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

## 🎯 Componentes Clave

### Loader
```jsx
import Loader from './components/Shared/Loader'

// Loader normal
<Loader />

// Loader de pantalla completa
<Loader fullScreen />
```

### Menu
- Automáticamente detecta si el usuario está autenticado
- Muestra/oculta opciones según el estado de autenticación
- Efectos glassmorphism y animaciones integradas

### CardItem
- Recibe un objeto `product` con estructura:
  ```js
  {
    id, title, description, basePrice, 
    highestBid, code, createdAt
  }
  ```

### BidPanel
- Requiere `productId` y `basePrice`
- Maneja ofertas en tiempo real
- Validación automática de ofertas
- Animaciones para nuevas ofertas

## 🔧 Mejoras Futuras (Opcionales)

### 1. Sistema de Imágenes Real
- Integrar Firebase Storage para subir imágenes
- Permitir múltiples imágenes por producto
- Galería de imágenes en ProductDetail

### 2. Temporizador de Subasta
```jsx
// Agregar countdown timer
<CountdownTimer endDate={product.auctionEnd} />
```

### 3. Notificaciones en Tiempo Real
- Push notifications cuando te superan en una oferta
- Toast notifications con react-hot-toast
- Sonido al recibir nueva oferta

### 4. Chat en Vivo
- Chat por producto usando Firebase Realtime Database
- Mensajes entre comprador y vendedor
- Sistema de mensajes privados

### 5. Favoritos
- Sistema para guardar productos favoritos
- Página de favoritos en Dashboard
- Notificaciones cuando baja el precio

### 6. Filtros y Búsqueda
```jsx
// Filtros en Home
<Filters
  categories={categories}
  priceRange={[min, max]}
  sortBy="price" | "date" | "popularity"
/>
```

### 7. Sistema de Categorías
- Categorizar productos (Electrónica, Moda, Hogar, etc.)
- Navegación por categorías
- Filtrado avanzado

### 8. Calificaciones y Reviews
- Calificar vendedores
- Sistema de reputación
- Reviews de productos anteriores

### 9. Modo Oscuro/Claro
```jsx
// Toggle para cambiar tema
const [theme, setTheme] = useState('dark')
```

### 10. Historial de Precios
- Gráfico con Chart.js o Recharts
- Mostrar evolución de ofertas
- Análisis de tendencias

## 📱 Responsividad

### Breakpoints de Tailwind
- `sm`: 640px (móvil grande)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (desktop grande)

### Ejemplo de uso
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // Se adapta automáticamente
</div>
```

## 🚀 Optimización de Rendimiento

### 1. Lazy Loading de Imágenes
```jsx
<img loading="lazy" src={imageUrl} alt={title} />
```

### 2. Paginación
```jsx
// Implementar infinite scroll o paginación
const ITEMS_PER_PAGE = 12
```

### 3. Memoización
```jsx
import { memo, useMemo } from 'react'

const CardItem = memo(({ product }) => {
  // Evita re-renders innecesarios
})
```

## 🎨 Personalización

### Cambiar colores de acento
Edita `tailwind.config.js`:
```js
colors: {
  accent: {
    blue: '#TU_COLOR_AZUL',
    purple: '#TU_COLOR_MORADO',
  }
}
```

### Cambiar fuente
Edita `src/styles/global.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=TU_FUENTE');

body {
  font-family: 'TU_FUENTE', sans-serif;
}
```

### Agregar nuevas animaciones
Edita `tailwind.config.js`:
```js
animation: {
  'tu-animacion': 'tu-animacion 1s ease-in-out',
},
keyframes: {
  'tu-animacion': {
    '0%': { ... },
    '100%': { ... },
  }
}
```

## 📞 Soporte

Para cualquier problema o duda:
1. Revisa la consola del navegador (F12)
2. Verifica que Firebase esté configurado correctamente
3. Asegúrate de que todas las dependencias estén instaladas
4. Ejecuta `npm install` si algo falta

## ✨ Tips Profesionales

1. **Consistencia**: Usa siempre las mismas clases de utilidad
2. **Accesibilidad**: Agrega `aria-labels` a botones con solo iconos
3. **Loading States**: Siempre muestra feedback visual al usuario
4. **Error Handling**: Captura y muestra errores de forma amigable
5. **Performance**: Usa `memo` y `useMemo` para optimizar

---

🎉 **¡Disfruta de tu nueva interfaz profesional de SmartMarket!**

