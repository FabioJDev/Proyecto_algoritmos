import React, { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useParams, Link } from 'react-router-dom'
import BidPanel from '../../components/Index/BidPanel'
import ChatBox from '../../components/Index/ChatBox'
import UserPresence from '../../components/Index/UserPresence'
import { motion, AnimatePresence } from 'framer-motion'
import Loader from '../../components/Shared/Loader'
import { ToastContainer } from '../../components/Shared/Toast'
import { useAuth } from '../../hooks/useAuth'

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])
  const [timeRemaining, setTimeRemaining] = useState('')

  // Escuchar cambios en tiempo real del producto
  useEffect(() => {
    const productRef = doc(db, 'products', id)

    const unsubscribe = onSnapshot(productRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          const productData = {
            id: snapshot.id,
            ...data,
            basePrice: Number(data.basePrice) || 0,
            highestBid: data.highestBid ? Number(data.highestBid) : null
          }
          setProduct(productData)
        } else {
          setError('Producto no encontrado')
        }
        setLoading(false)
      },
      (error) => {
        console.error("❌ Error al escuchar producto:", error)
        setError('Error al cargar el producto. Verifica tu conexión.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [id])

  const addToast = (message, type = 'success') => {
    const newToast = {
      id: Date.now(),
      message,
      type
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }

  // Calculate time remaining for auction
  useEffect(() => {
    if (!product?.auctionEndDate) return

    const calculateTimeRemaining = () => {
      const now = Date.now()
      const endTime = product.auctionEndDate.toMillis()
      const diff = endTime - now

      if (product.status === 'Finalizada' || diff <= 0) {
        setTimeRemaining('Subasta finalizada')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      let timeString = ''
      if (days > 0) timeString += `${days}d `
      if (hours > 0 || days > 0) timeString += `${hours}h `
      if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `
      timeString += `${seconds}s`

      setTimeRemaining(timeString.trim())
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [product?.auctionEndDate, product?.status])

  if (loading) return <Loader />

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-white mb-2">{error || 'Producto no encontrado'}</h2>
        <Link to="/" className="btn mt-4">Volver al inicio</Link>
      </div>
    )
  }

  // Imagen placeholder
  const placeholderImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200&h=800&fit=crop'
  ]

  const imageIndex = product.id ? product.id.charCodeAt(0) % placeholderImages.length : 0
  const imageUrl = placeholderImages[imageIndex]

  const isExpired = product.status === 'Finalizada' || timeRemaining === 'Subasta finalizada'

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-[1280px] mx-auto pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-xs">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Gallery & Info (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Gallery */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-strong border border-white/5">
              <div className="relative aspect-video">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <UserPresence productId={product.id} />
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-card rounded-2xl p-8 shadow-strong border border-white/5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{product.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-text-muted">
                      Lote: #{product.code}
                    </span>
                    <span className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary">
                      {product.category || 'General'}
                    </span>
                  </div>
                </div>
                <button className="btn secondary text-sm px-4 py-2">
                  ⭐ Seguir lote
                </button>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold text-white mb-2">Descripción</h3>
                <p className="text-text-muted leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Auction Info Table */}
              <div className="mt-8 border-t border-white/5 pt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Información de la subasta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                  <InfoRow label="Vendedor" value={product.sellerName || 'SmartMarket'} />
                  <InfoRow label="Ubicación" value="Bogotá, Colombia" />
                  <InfoRow label="Fecha de inicio" value={product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : '-'} />
                  <InfoRow label="Cierre estimado" value={product.auctionEndDate ? new Date(product.auctionEndDate.toDate()).toLocaleString() : '-'} />
                  <InfoRow label="Condición" value="Usado - Buen estado" />
                  <InfoRow label="Garantía" value="Sin garantía" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bidding & Chat (4 cols) - Sticky */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Bid Panel */}
              <div className="bg-card rounded-2xl shadow-strong border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-text-muted">Oferta actual</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                      {isExpired ? 'Finalizada' : 'En vivo'}
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white tracking-tight mb-2">
                    {formatCurrency(product.highestBid || product.basePrice)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {timeRemaining}
                  </div>
                </div>

                <div className="p-6">
                  <BidPanel
                    productId={product.id}
                    basePrice={product.basePrice}
                    onToast={addToast}
                    auctionStatus={product.status}
                    isExpired={isExpired}
                  />
                </div>
              </div>

              {/* Chat */}
              <div className="bg-card rounded-2xl shadow-strong border border-white/5 overflow-hidden h-[500px] flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <h3 className="font-semibold text-white">Chat en vivo</h3>
                </div>
                <div className="flex-grow overflow-hidden">
                  <ChatBox productId={product.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2">
      <span className="text-text-muted text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}
