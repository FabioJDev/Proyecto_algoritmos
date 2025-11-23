import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithGoogle } from '../../services/firebase'

export default function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const nav = useNavigate()

  const getErrorMessage = (errorCode) => {
    const errors = {
      'auth/invalid-api-key': '⚠️ Error de configuración. Verifica el archivo .env',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'El formato del email no es válido',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    }
    return errors[errorCode] || 'Error al crear la cuenta. Intenta de nuevo.'
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await register(email, password, name)
      nav('/')
    } catch (err) {
      console.error('Error de registro:', err)
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoadingGoogle(true)

    try {
      const result = await signInWithGoogle()

      if (result.success) {
        nav('/')
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error inesperado con Google:', err)
      setError('⚠️ No se pudo registrar con Google. Inténtalo nuevamente.')
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="glass-card w-full max-w-md p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <span className="text-6xl mb-4 inline-block">🚀</span>
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Únete a SmartMarket
          </h2>
          <p className="text-text-muted">
            Crea tu cuenta y comienza a subastar
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Nombre completo</label>
            <input
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
            />
          </div>

          {error && (
            <motion.div
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            className="btn w-full text-lg py-3.5 shadow-glow"
            type="submit"
            whileHover={{ scale: loading || loadingGoogle ? 1 : 1.02 }}
            whileTap={{ scale: loading || loadingGoogle ? 1 : 0.98 }}
            disabled={loading || loadingGoogle}
          >
            {loading ? '⏳ Creando cuenta...' : '✨ Crear cuenta'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-text-muted text-xs uppercase tracking-wider">o regístrate con</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Google Button */}
        <motion.button
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white
                     bg-white/5 border border-white/10
                     hover:bg-white/10 hover:border-white/20
                     transition-all duration-300
                     flex items-center justify-center gap-3"
          onClick={handleGoogleSignIn}
          disabled={loading || loadingGoogle}
          whileHover={{ scale: loading || loadingGoogle ? 1 : 1.02 }}
          whileTap={{ scale: loading || loadingGoogle ? 1 : 0.98 }}
          type="button"
        >
          {loadingGoogle ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </>
          )}
        </motion.button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-secondary hover:text-secondary-light font-semibold transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
