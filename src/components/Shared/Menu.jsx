import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'

export default function Menu() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <motion.header
      className="glass-card sticky top-0 z-50 border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl shadow-glow"
            whileHover={{ rotate: 10, scale: 1.05 }}
          >
            💎
          </motion.div>
          <span className="text-2xl font-bold font-heading tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-text-muted transition-all">
            SmartMarket
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Buscar subastas..."
            className="w-full bg-background/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
        </div>

        {/* Navigation & User */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Inicio</NavLink>
            <NavLink to="/create">Publicar</NavLink>
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          </div>

          <div className="h-6 w-px bg-white/10 hidden md:block"></div>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <div className="relative" onMouseEnter={() => setIsProfileOpen(true)} onMouseLeave={() => setIsProfileOpen(false)}>
                <button
                  className="flex items-center gap-3 py-2 focus:outline-none"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white leading-none">{user.displayName || 'Usuario'}</p>
                    <p className="text-xs text-text-muted mt-1">Ver perfil</p>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full border-2 border-white/10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary">
                      👤
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-strong overflow-hidden py-1"
                    >
                      <Link to="/profile" className="block px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                        Mi Perfil
                      </Link>
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                        Mis Subastas
                      </Link>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button
                        onClick={async () => {
                          await logout()
                          nav('/')
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-text-muted hover:text-white transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="btn text-sm py-2 px-4 shadow-glow">
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  )
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="relative text-sm font-medium text-text-muted hover:text-white transition-colors py-2"
    >
      {children}
    </Link>
  )
}
