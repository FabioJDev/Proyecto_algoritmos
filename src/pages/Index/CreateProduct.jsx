import React, { useState, useCallback } from 'react'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { v4 as uuidv4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function CreateProduct() {
  const { user } = useAuth()
  const nav = useNavigate()

  // Form States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [category, setCategory] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('24')
  const [images, setImages] = useState([])

  // UI States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  // Categories available
  const categories = [
    'Tecnología', 'Hogar', 'Moda', 'Vehículos',
    'Deportes', 'Coleccionables', 'Arte', 'Otros'
  ]

  // Duration options
  const durationOptions = [
    { value: '0.05', label: '3 minutos (Demo)' },
    { value: '12', label: '12 horas' },
    { value: '24', label: '1 día' },
    { value: '48', label: '2 días' },
    { value: '72', label: '3 días' },
    { value: '168', label: '1 semana' }
  ]

  // Custom Dropzone Implementation
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setImages(prev => [...prev, ...newImages].slice(0, 4)) // Max 4 images
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const validateStep1 = () => {
    if (!title.trim()) return 'El título es obligatorio'
    if (!category) return 'Selecciona una categoría'
    if (!description.trim() || description.length < 20) return 'La descripción debe tener al menos 20 caracteres'
    return null
  }

  const validateStep2 = () => {
    if (!basePrice || parseFloat(basePrice) <= 0) return 'Ingresa un precio base válido'
    if (!auctionDuration) return 'Selecciona la duración'
    return null
  }

  const validateStep3 = () => {
    if (!sellerPhone || sellerPhone.length < 10) return 'Ingresa un número de contacto válido'
    return null
  }

  const handleNext = () => {
    setError('')
    let validationError = null

    if (activeStep === 1) validationError = validateStep1()
    if (activeStep === 2) validationError = validateStep2()

    if (validationError) {
      setError(validationError)
      return
    }

    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError('')
    setActiveStep(prev => prev - 1)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const validationError = validateStep3()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const code = uuidv4().slice(0, 8).toUpperCase()
      const durationInHours = parseFloat(auctionDuration)
      const auctionEndDate = Timestamp.fromMillis(
        Date.now() + (durationInHours * 60 * 60 * 1000)
      )

      const docRef = await addDoc(collection(db, 'products'), {
        title: title.trim(),
        description: description.trim(),
        basePrice: parseFloat(basePrice),
        code,
        createdAt: serverTimestamp(),
        highestBid: null,
        sellerId: user.uid,
        sellerName: user.displayName || user.email,
        sellerPhone: sellerPhone.replace(/\D/g, ''),
        category,
        currency: 'COP',
        basePriceCOP: parseFloat(basePrice),
        auctionDuration: durationInHours,
        auctionEndDate,
        status: 'Activa',
        images: images.map(img => img.preview) // In a real app, upload to storage first
      })

      setSuccess(true)
      setTimeout(() => nav(`/product/${docRef.id}`), 1500)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al publicar el producto. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Publicar Subasta</h1>
        <p className="text-text-muted">Completa los pasos para publicar tu producto</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${activeStep >= step ? 'bg-primary text-white shadow-glow' : 'bg-white/10 text-text-muted'
                }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 rounded-full mx-2 ${activeStep > step ? 'bg-primary' : 'bg-white/10'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Area */}
        <div className="lg:col-span-8">
          <motion.div
            className="bg-card rounded-2xl p-8 shadow-strong border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={submit}>
              <AnimatePresence mode="wait">
                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-6">Detalles del Producto</h2>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Título</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="Ej: MacBook Pro 2023"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Categoría</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`p-3 rounded-xl text-sm font-medium transition-all ${category === cat
                                ? 'bg-primary text-white shadow-glow'
                                : 'bg-white/5 text-text-muted hover:bg-white/10'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Descripción</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows="6"
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                        placeholder="Describe el estado, características y detalles importantes..."
                      />
                    </div>

                    {/* Image Upload UI */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Imágenes</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {images.length < 4 && (
                          <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10">
                            <span className="text-2xl mb-2">📷</span>
                            <span className="text-xs text-text-muted">Agregar foto</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-6">Precio y Duración</h2>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Precio Base (COP)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                        <input
                          type="number"
                          value={basePrice}
                          onChange={e => setBasePrice(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-xs text-text-muted text-right">{formatCurrency(basePrice)}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Duración de la subasta</label>
                      <div className="grid grid-cols-2 gap-3">
                        {durationOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAuctionDuration(opt.value)}
                            className={`p-4 rounded-xl text-left transition-all border ${auctionDuration === opt.value
                                ? 'bg-primary/10 border-primary text-white'
                                : 'bg-background border-white/10 text-text-muted hover:border-white/20'
                              }`}
                          >
                            <span className="block font-medium">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-6">Confirmación</h2>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-muted">Número de contacto</label>
                      <input
                        type="tel"
                        value={sellerPhone}
                        onChange={e => setSellerPhone(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="300 123 4567"
                      />
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 space-y-4">
                      <h3 className="font-semibold text-white">Resumen</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Producto</span>
                          <span className="text-white">{title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Precio Base</span>
                          <span className="text-white">{formatCurrency(basePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Duración</span>
                          <span className="text-white">{durationOptions.find(o => o.value === auctionDuration)?.label}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center"
                >
                  ¡Subasta publicada con éxito! Redirigiendo...
                </motion.div>
              )}

              <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl text-white hover:bg-white/5 transition-colors"
                  >
                    Atrás
                  </button>
                )}

                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl transition-all shadow-glow"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl transition-all shadow-glow disabled:opacity-50"
                  >
                    {loading ? 'Publicando...' : 'Publicar Subasta'}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4">Vista Previa</h3>
            <div className="bg-card rounded-2xl overflow-hidden shadow-strong border border-white/5">
              <div className="aspect-video bg-background relative">
                {images.length > 0 ? (
                  <img src={images[0].preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-white">
                    Termina en {durationOptions.find(o => o.value === auctionDuration)?.label.split(' ')[0]}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-white mb-1 line-clamp-1">{title || 'Título del producto'}</h4>
                <p className="text-sm text-text-muted mb-4 line-clamp-2">{description || 'Descripción del producto...'}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-text-muted">Precio base</p>
                    <p className="text-lg font-bold text-white">{basePrice ? formatCurrency(basePrice) : '$ 0'}</p>
                  </div>
                  <button className="btn text-xs px-3 py-1.5 pointer-events-none">Ver subasta</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
