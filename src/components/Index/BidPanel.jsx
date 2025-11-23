import React, { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { MaxHeap } from '../../utils/heap'
import { motion, AnimatePresence } from 'framer-motion'

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

// Función para formatear tiempo relativo
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Ahora'

  const date = timestamp.toDate()
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  return date.toLocaleDateString()
}

export default function BidPanel({ productId, basePrice, onToast, auctionStatus, isExpired }) {
  const { user } = useAuth()
  const [bids, setBids] = useState([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastBidUser, setLastBidUser] = useState(null)
  const [currentHighest, setCurrentHighest] = useState(basePrice)

  // Verificar si la subasta está activa
  const isAuctionActive = !isExpired && auctionStatus !== 'Finalizada'

  // Fixed bid history listener - Suscripción estable en tiempo real
  useEffect(() => {
    if (!productId) return

    const q = query(
      collection(db, 'bids'),
      where('productId', '==', productId),
      orderBy('amount', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bidsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setBids(bidsData)
    })

    return () => unsubscribe()
  }, [productId])

  // Detectar cuando el usuario es superado
  useEffect(() => {
    if (bids.length > 0 && user?.uid) {
      const highestBid = bids[0]
      const userBid = bids.find(b => b.userId === user.uid)

      if (userBid && highestBid.userId !== user.uid && lastBidUser !== highestBid.userId) {
        onToast?.('⚠️ Han superado tu oferta', 'warning')
        setLastBidUser(highestBid.userId)
      }
    }
  }, [bids, user, lastBidUser, onToast])

  // Escuchar cambios en el highestBid del producto
  useEffect(() => {
    if (!productId) return
    const productRef = doc(db, 'products', productId)
    const unsubscribe = onSnapshot(productRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setCurrentHighest(data.highestBid ? Number(data.highestBid) : basePrice)
      }
    })
    return () => unsubscribe()
  }, [productId, basePrice])

  // Calcular la oferta más alta
  const highest = useMemo(() => {
    const h = new MaxHeap()
    for (const b of bids) { h.push({ amount: b.amount, userId: b.userId }) }
    const calculatedHighest = h.peek()?.amount || basePrice
    return Math.max(calculatedHighest, currentHighest)
  }, [bids, basePrice, currentHighest])

  // Calcular porcentaje de progreso
  const progressPercentage = useMemo(() => {
    if (highest === basePrice) return 0
    const range = basePrice * 2
    const current = highest - basePrice
    return Math.min((current / range) * 100, 100)
  }, [highest, basePrice])

  const placeBid = async (e) => {
    e.preventDefault()
    setError('')

    if (!isAuctionActive) return
    if (!user) {
      setError('Debes iniciar sesión para ofertar')
      return
    }

    let cleanAmount = String(amount).trim().replace(',', '.')
    const val = parseFloat(cleanAmount)

    if (Number.isNaN(val) || val <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    const bidAmount = Math.floor(val)

    if (bidAmount <= highest) {
      setError(`La oferta debe ser mayor a ${formatCurrency(highest)}`)
      return
    }

    setSubmitting(true)

    try {
      const userName = user.displayName || user.email || 'Usuario'

      // Verificar si ya existe oferta del usuario
      const existingBidQuery = query(
        collection(db, 'bids'),
        where('productId', '==', productId),
        where('userId', '==', user.uid)
      )
      const existingBidSnap = await getDocs(existingBidQuery)

      if (!existingBidSnap.empty) {
        await updateDoc(doc(db, 'bids', existingBidSnap.docs[0].id), {
          amount: bidAmount,
          userName: userName,
          updatedAt: serverTimestamp()
        })
        onToast?.('✅ Oferta actualizada correctamente', 'success')
      } else {
        await addDoc(collection(db, 'bids'), {
          productId: String(productId),
          amount: bidAmount,
          userId: user.uid,
          userName: userName,
          createdAt: serverTimestamp()
        })
        onToast?.('✅ Oferta realizada exitosamente', 'success')
      }

      await updateDoc(doc(db, 'products', productId), {
        highestBid: bidAmount
      })

      setAmount('')
    } catch (err) {
      console.error('Error al ofertar:', err)
      setError('Error al registrar la oferta')
    } finally {
      setSubmitting(false)
    }
  }

  const isUserHighestBidder = useMemo(() => {
    if (!user || bids.length === 0) return false
    return bids[0].userId === user.uid
  }, [bids, user])

  // Obtener ofertas únicas por usuario
  const uniqueBids = useMemo(() => {
    const bidsByUser = new Map()
    for (const bid of bids) {
      if (!bid.userId || !bid.amount) continue
      const existing = bidsByUser.get(bid.userId)
      if (!existing || bid.amount > existing.amount) {
        bidsByUser.set(bid.userId, bid)
      }
    }
    return Array.from(bidsByUser.values()).sort((a, b) => b.amount - a.amount)
  }, [bids])

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Progreso de subasta</span>
          <span className="text-primary font-medium">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {isUserHighestBidder && (
          <p className="text-xs text-green-400 font-medium text-center">
            🏆 ¡Vas ganando esta subasta!
          </p>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={placeBid} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Tu oferta</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder={`Mínimo ${formatCurrency(highest + 1)}`}
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              className="w-full bg-background border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              disabled={!isAuctionActive || submitting}
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <motion.button
          className="btn w-full py-4 text-lg shadow-glow"
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!isAuctionActive || submitting}
        >
          {submitting ? 'Procesando...' : isAuctionActive ? 'Ofertar ahora' : 'Subasta finalizada'}
        </motion.button>
      </form>

      {/* Historial */}
      <div className="border-t border-white/5 pt-6">
        <h4 className="text-sm font-medium text-white mb-4 flex items-center justify-between">
          Historial de ofertas
          <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-text-muted">{uniqueBids.length}</span>
        </h4>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {uniqueBids.map((b, index) => (
              <motion.div
                key={b.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center justify-between p-3 rounded-xl border ${index === 0 ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${b.userId === user?.uid ? 'text-primary' : 'text-white'
                      }`}>
                      {b.userName} {b.userId === user?.uid && '(Tú)'}
                    </p>
                    <p className="text-xs text-text-muted">{formatRelativeTime(b.createdAt)}</p>
                  </div>
                </div>
                <span className={`font-bold ${index === 0 ? 'text-primary' : 'text-white'}`}>
                  {formatCurrency(b.amount)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {uniqueBids.length === 0 && (
            <p className="text-center text-sm text-text-muted py-4">
              Sé el primero en ofertar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
