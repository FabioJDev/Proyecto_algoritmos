import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

// Función para calcular tiempo restante
const getTimeRemaining = (endDate) => {
  if (!endDate) return null
  const total = endDate.toMillis() - Date.now()
  if (total <= 0) return null

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { total, days, hours, minutes, seconds }
}

export default function CardItem({ product }) {
  const highest = product.highestBid || product.basePrice
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(product.auctionEndDate))

  useEffect(() => {
    if (product.status !== 'Activa' || !product.auctionEndDate) return

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(product.auctionEndDate)
      setTimeLeft(remaining)
      if (!remaining) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [product])

  // Verificar si la subasta está activa
  const isActive = product.status === 'Activa' && timeLeft !== null

  // Imágenes placeholder elegantes
  const placeholderImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=450&fit=crop'
  ]

  // Use a deterministic image based on product ID to avoid hydration mismatches or random changes
  const imageIndex = product.id ? product.id.charCodeAt(0) % placeholderImages.length : 0
  const imageUrl = placeholderImages[imageIndex]

  return (
    <motion.div
      className="group bg-card rounded-2xl shadow-strong border border-white/5 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow flex flex-col h-full"
      whileHover={{ y: -5 }}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-video overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60"></div>

        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isActive ? (
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              {timeLeft ? (
                <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
              ) : (
                <span>Termina pronto</span>
              )}
            </div>
          ) : (
            <span className="bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-text-muted">
              Finalizada
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="bg-primary/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
            {product.category || 'General'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
            {product.title}
          </h3>
        </div>

        <p className="text-text-muted text-sm line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>

        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-text-muted mb-1">Oferta actual</p>
              <p className="text-xl font-bold text-white tracking-tight">
                {formatCurrency(highest)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted mb-1">Pujas</p>
              <p className="text-sm font-medium text-white">
                {product.bidsCount || 0} ofertas
              </p>
            </div>
          </div>

          <Link to={`/product/${product.id}`} className="block">
            <button className="w-full btn py-2.5 text-sm shadow-none group-hover:shadow-glow transition-all">
              {isActive ? 'Ofertar ahora' : 'Ver resultados'}
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
