import React, { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Shared/Layout'
import { checkAuctions } from './services/auctions'

export default function App(){
  // Verificación periódica de subastas activas
  useEffect(() => {
    // Verificar inmediatamente al cargar la app
    checkAuctions()
    
    // Verificar cada 1 minuto (60000ms)
    const intervalId = setInterval(() => {
      checkAuctions()
    }, 60000)
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId)
  }, [])

  return (
    <AuthProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </AuthProvider>
  )
}
