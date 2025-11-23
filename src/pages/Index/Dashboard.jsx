import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Graph } from '../../utils/graph'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

export default function Dashboard() {
  const { user } = useAuth()
  const [myBids, setMyBids] = useState([])
  const [bidsWithProducts, setBidsWithProducts] = useState([])
  const [myProducts, setMyProducts] = useState([])
  const [wonAuctions, setWonAuctions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [wonAuctionsLoading, setWonAuctionsLoading] = useState(true)

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const notificationsRef = collection(db, 'notifications', user.uid, 'items')
    const q = query(notificationsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({
        id: doc.id,
        docRef: doc.ref,
        ...doc.data()
      }))
      setNotifications(notifData)
    })

    return () => unsubscribe()
  }, [user.uid])

  // Cargar productos publicados por el vendedor
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), where('sellerId', '==', user.uid), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const productsData = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
        setMyProducts(productsData)
      } catch (error) {
        console.error('❌ Error al cargar productos:', error)
      } finally {
        setProductsLoading(false)
      }
    })()
  }, [user.uid])

  // Cargar subastas ganadas (donde el usuario es el ganador)
  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('winnerId', '==', user.uid),
          where('status', '==', 'Finalizada')
        )
        const snap = await getDocs(q)
        const wonData = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
        setWonAuctions(wonData)
      } catch (error) {
        console.error('❌ Error al cargar subastas ganadas:', error)
      } finally {
        setWonAuctionsLoading(false)
      }
    })()
  }, [user.uid])

  useEffect(() => {
    (async () => {
      try {
        // Obtener todas las ofertas del usuario
        const q = query(collection(db, 'bids'), where('userId', '==', user.uid))
        const snap = await getDocs(q)
        const bidsData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setMyBids(bidsData)

        // Agrupar por producto (solo la oferta más reciente por producto)
        const bidsByProduct = new Map()
        for (const bid of bidsData) {
          const existing = bidsByProduct.get(bid.productId)
          if (!existing || bid.amount > existing.amount ||
            (bid.updatedAt && (!existing.updatedAt || bid.updatedAt > existing.updatedAt))) {
            bidsByProduct.set(bid.productId, bid)
          }
        }

        // Obtener información de cada producto
        const bidsWithProductData = await Promise.all(
          Array.from(bidsByProduct.values()).map(async (bid) => {
            try {
              const productSnap = await getDoc(doc(db, 'products', bid.productId))
              if (productSnap.exists()) {
                return {
                  ...bid,
                  product: {
                    id: productSnap.id,
                    ...productSnap.data()
                  }
                }
              }
              return {
                ...bid,
                product: null
              }
            } catch (error) {
              console.error('Error al cargar producto:', error)
              return {
                ...bid,
                product: null
              }
            }
          })
        )

        setBidsWithProducts(bidsWithProductData)

      } catch (error) {
        console.error("❌ Error al cargar ofertas:", error)
      } finally {
        setLoading(false)
      }
    })()
  }, [user.uid])

  const recs = useMemo(() => {
    const g = new Graph()
    for (const b of myBids) {
      const seller = (b.productId || '').slice(0, 3) || 'sellerX'
      g.addEdge(user.uid, seller)
    }
    return g.recommend(user.uid)
  }, [myBids, user.uid])

  // Calcular estadísticas basadas en ofertas únicas
  const totalBids = bidsWithProducts.length
  const totalSpent = bidsWithProducts.reduce((sum, bid) => sum + (bid.amount || 0), 0)
  const uniqueProducts = bidsWithProducts.length

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Mi Dashboard
          </h1>
          <p className="text-text-muted text-lg">
            Gestiona tus ofertas y descubre recomendaciones
          </p>
        </div>
        <Link to="/create-product">
          <motion.button
            className="btn px-6 py-3 shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Publicar Nuevo
          </motion.button>
        </Link>
      </motion.div>

      {/* Estadísticas */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          icon="📊"
          label="Productos con ofertas"
          value={totalBids}
          color="blue"
        />
        <StatCard
          icon="💰"
          label="Total ofertado"
          value={formatCurrency(totalSpent)}
          color="purple"
        />
        <StatCard
          icon="🎯"
          label="Subastas activas"
          value={uniqueProducts}
          color="blue"
        />
        <StatCard
          icon="🏆"
          label="Subastas ganadas"
          value={wonAuctions.length}
          color="green"
        />
      </motion.div>

      {/* Notificaciones */}
      {notifications.length > 0 && (
        <motion.div
          className="glass-card p-6 border-l-4 border-l-yellow-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔔 Notificaciones
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.read).length} nuevas
                </span>
              )}
            </h2>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {notifications.slice(0, 5).map((notif, index) => {
              const getNotificationContent = () => {
                switch (notif.type) {
                  case 'outbid':
                    return {
                      icon: '⚠️',
                      title: `Tu oferta en ${notif.productTitle} ha sido superada`,
                      subtitle: `Nueva oferta: ${formatCurrency(notif.newBidAmount)} por ${notif.bidderName}`,
                      borderColor: 'border-yellow-500/50',
                      bgColor: 'bg-yellow-500/10'
                    }
                  case 'winner':
                    return {
                      icon: '🏆',
                      title: `¡Ganaste la subasta de ${notif.productTitle}!`,
                      subtitle: `Tu oferta ganadora: ${formatCurrency(notif.finalPrice)}`,
                      borderColor: 'border-green-500/50',
                      bgColor: 'bg-green-500/10'
                    }
                  case 'seller':
                    return {
                      icon: '📦',
                      title: notif.title || 'Tu subasta ha finalizado',
                      subtitle: notif.message || `Producto: ${notif.productTitle}`,
                      borderColor: 'border-blue-500/50',
                      bgColor: 'bg-blue-500/10'
                    }
                  default:
                    return {
                      icon: '🔔',
                      title: notif.title || 'Nueva notificación',
                      subtitle: notif.message || '',
                      borderColor: 'border-primary/50',
                      bgColor: 'bg-primary/10'
                    }
                }
              }

              const content = getNotificationContent()

              return (
                <motion.div
                  key={notif.id}
                  className={`p-4 rounded-xl border ${notif.read
                      ? 'bg-white/5 border-white/5'
                      : `${content.bgColor} ${content.borderColor}`
                    } transition-all hover:bg-white/10`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <span className="text-xl">{content.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${notif.read ? 'text-text-muted' : 'text-white'}`}>
                          {content.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {content.subtitle}
                        </p>
                      </div>
                    </div>
                    {notif.productId && (
                      <Link to={`/product/${notif.productId}`}>
                        <button
                          className="text-primary text-xs font-medium hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20"
                          onClick={async () => {
                            try {
                              await updateDoc(notif.docRef, { read: true })
                            } catch (error) {
                              console.error('Error al marcar notificación:', error)
                            }
                          }}
                        >
                          Ver
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Subastas ganadas */}
      {wonAuctions.length > 0 && (
        <motion.div
          className="glass-card p-8 border-t-4 border-t-green-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🏆</span> Subastas Ganadas
            </h2>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-500/30">
              {wonAuctions.length} {wonAuctions.length === 1 ? 'victoria' : 'victorias'}
            </span>
          </div>

          {wonAuctionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white/5 h-32 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wonAuctions.map((auction, index) => (
                <motion.div
                  key={auction.id}
                  className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-green-400 transition-colors">
                      {auction.title}
                    </h3>
                    <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-lg">
                      {auction.closedAt ? new Date(auction.closedAt.toDate()).toLocaleDateString() : 'Reciente'}
                    </span>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                    <p className="text-xs text-green-400/80 mb-1 uppercase tracking-wider font-bold">Tu oferta ganadora</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(auction.finalPrice)}
                    </p>
                  </div>

                  {auction.sellerPhone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-4 bg-white/5 p-2 rounded-lg">
                      <span>📞</span>
                      <span>Vendedor: <span className="text-white font-medium">{auction.sellerPhone}</span></span>
                    </div>
                  )}

                  <Link to={`/product/${auction.id}`}>
                    <button className="w-full btn secondary py-2 text-sm group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-all">
                      Ver detalles
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Mis productos publicados */}
      {myProducts.length > 0 && (
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📦</span> Mis Productos
            </h2>
            <span className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-sm font-bold border border-primary/30">
              {myProducts.length} publicados
            </span>
          </div>

          {productsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 h-16 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-text-muted font-medium py-4 px-4">Producto</th>
                    <th className="text-left text-text-muted font-medium py-4 px-4">Categoría</th>
                    <th className="text-left text-text-muted font-medium py-4 px-4">Precio Base</th>
                    <th className="text-left text-text-muted font-medium py-4 px-4">Estado</th>
                    <th className="text-right text-text-muted font-medium py-4 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myProducts.map((product, index) => {
                    const isActive = product.auctionEndDate
                      ? product.auctionEndDate.toMillis() > Date.now()
                      : true

                    return (
                      <motion.tr
                        key={product.id}
                        className="hover:bg-white/5 transition-colors group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-medium group-hover:text-primary transition-colors">{product.title}</p>
                            <p className="text-text-muted text-xs font-mono opacity-50">#{product.code}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-white/5 text-text-muted px-2 py-1 rounded text-xs border border-white/10">
                            {product.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white font-medium">
                            {formatCurrency(product.basePrice)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                            {isActive ? '🟢 Activa' : '🔴 Finalizada'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link to={`/product/${product.id}`}>
                            <button className="text-sm text-primary hover:text-white transition-colors font-medium hover:underline">
                              Ver →
                            </button>
                          </Link>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Grid de contenido inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mis ofertas */}
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              Mis Ofertas Activas
            </h2>
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-bold">
              {totalBids}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 h-20 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : bidsWithProducts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-5xl mb-4 opacity-50">🎯</p>
              <p className="text-white font-medium mb-2">
                No tienes ofertas activas
              </p>
              <p className="text-text-muted text-sm mb-6">
                ¡Explora las subastas y encuentra algo increíble!
              </p>
              <Link to="/">
                <button className="btn px-6 py-2 text-sm">
                  Explorar Subastas
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {bidsWithProducts.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-primary/30 transition-all group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  {bid.product ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold group-hover:text-primary transition-colors line-clamp-1">
                          {bid.product.title}
                        </h3>
                        <p className="text-text-muted text-xs mt-1">
                          {bid.createdAt ? new Date(bid.createdAt.toDate()).toLocaleDateString() : 'Reciente'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted mb-1">Tu oferta</p>
                        <p className="text-primary font-bold text-lg">
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                      <Link to={`/product/${bid.productId}`}>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                          →
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-2 opacity-50">
                      <p className="text-sm">Producto no disponible</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recomendaciones */}
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              Recomendado para ti
            </h2>
            <span className="text-2xl">✨</span>
          </div>

          {recs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-5xl mb-4 opacity-50">🔮</p>
              <p className="text-white font-medium mb-2">
                Necesitamos más datos
              </p>
              <p className="text-text-muted text-sm">
                Participa en más subastas para recibir recomendaciones personalizadas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recs.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  className="bg-gradient-to-r from-white/5 to-transparent rounded-xl p-4 border border-white/5 flex items-center justify-between"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-glow">
                      {rec.id.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Vendedor Destacado
                      </p>
                      <p className="text-text-muted text-xs">
                        Basado en tu historial
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-white font-bold text-sm">{rec.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-emerald-500 to-green-500'
  }

  return (
    <motion.div
      className="glass-card p-6 relative overflow-hidden group"
      whileHover={{ y: -5 }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110`} />

      <div className="relative z-10">
        <div className="text-3xl mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <motion.div
          className="text-3xl font-bold text-white mb-1"
          key={value}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {value}
        </motion.div>
        <div className="text-text-muted text-sm font-medium">{label}</div>
      </div>
    </motion.div>
  )
}
