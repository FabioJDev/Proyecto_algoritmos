import React, { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../../services/firebase'
import CardItem from '../../components/Index/CardItem'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const productsData = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          basePrice: Number(d.data().basePrice) || 0,
          highestBid: d.data().highestBid ? Number(d.data().highestBid) : null
        }))
        setProducts(productsData)
      } catch (error) {
        console.error("❌ Error al cargar productos:", error)
        setError('Error al cargar los productos. Verifica tu conexión a Firebase.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-20 pb-12">
      {/* Hero Section */}
      <section className="relative -mt-8 pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616401784845-180886ba9ca2?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
              🚀 La plataforma #1 de subastas en Colombia
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight text-white mb-6">
              Encuentra tesoros <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                al mejor precio
              </span>
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Participa en subastas en tiempo real, oferta con seguridad y gana productos exclusivos.
            </p>
          </motion.div>

          {/* Hero Search */}
          <motion.div
            className="max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex-1 flex items-center px-4 bg-background/50 rounded-xl border border-white/5">
              <span className="text-text-muted">🔍</span>
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                className="w-full bg-transparent border-none py-3 px-3 text-white placeholder:text-text-muted focus:ring-0"
              />
            </div>
            <div className="w-full md:w-48">
              <select className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-text-muted focus:ring-0 cursor-pointer hover:bg-background/70 transition-colors appearance-none">
                <option>Todas las categorías</option>
                <option>Tecnología</option>
                <option>Vehículos</option>
                <option>Hogar</option>
              </select>
            </div>
            <button className="btn md:w-auto w-full">
              Buscar
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Categorías Populares</h2>
          <a href="#" className="text-primary hover:text-secondary transition-colors text-sm font-medium">Ver todas</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              className="group cursor-pointer"
              whileHover={{ y: -5 }}
            >
              <div className="bg-card border border-white/5 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors shadow-soft group-hover:shadow-glow">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                <h3 className="text-sm font-medium text-text-muted group-hover:text-white transition-colors">{cat.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Auctions (Slider/Grid) */}
      <section className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Subastas Destacadas 🔥</h2>
            <p className="text-text-muted">Las ofertas más calientes terminan pronto</p>
          </div>
          <Link to="/search" className="btn secondary text-sm px-4 py-2">
            Ver todo
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-error/10 rounded-2xl border border-error/20">
            <p className="text-error">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardItem product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Sell CTA */}
      <section className="max-w-[1280px] mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-secondary p-12 md:p-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-xl space-y-6">
            <h2 className="text-4xl font-bold text-white">¿Tienes algo para vender?</h2>
            <p className="text-white/90 text-lg">
              Convierte tus artículos en efectivo en minutos. Nuestra plataforma segura te conecta con miles de compradores verificados.
            </p>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-center gap-2">✓ Publicación gratuita</li>
              <li className="flex items-center gap-2">✓ Pagos seguros</li>
              <li className="flex items-center gap-2">✓ Soporte 24/7</li>
            </ul>
          </div>
          <div className="relative z-10">
            <Link to="/create">
              <motion.button
                className="bg-white text-primary font-bold text-lg px-8 py-4 rounded-xl shadow-2xl hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Vende en minutos
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const categories = [
  { name: 'Tecnología', icon: '💻' },
  { name: 'Vehículos', icon: '🚗' },
  { name: 'Hogar', icon: '🏠' },
  { name: 'Moda', icon: '👕' },
  { name: 'Deportes', icon: '⚽' },
  { name: 'Arte', icon: '🎨' },
]

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl p-4 animate-pulse border border-white/5">
      <div className="bg-white/5 h-48 rounded-xl mb-4"></div>
      <div className="space-y-3">
        <div className="h-6 bg-white/5 rounded w-3/4"></div>
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-2/3"></div>
      </div>
    </div>
  )
}
