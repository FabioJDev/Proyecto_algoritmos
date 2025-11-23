import React, { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'

export default function UserPresence({ productId }) {
  const { user } = useAuth()
  const [connectedUsers, setConnectedUsers] = useState([])

  useEffect(() => {
    if (!user) return

    const presenceRef = doc(db, 'presence', productId, 'users', user.uid)

    // Registrar presencia del usuario
    const registerPresence = async () => {
      try {
        await setDoc(presenceRef, {
          userId: user.uid,
          userName: user.displayName || user.email,
          lastActive: serverTimestamp()
        })
        console.log('✅ Presencia registrada')
      } catch (error) {
        console.error('❌ Error al registrar presencia:', error)
      }
    }

    // Actualizar presencia cada 30 segundos
    registerPresence()
    const presenceInterval = setInterval(registerPresence, 30000)

    // Limpiar presencia al desmontar
    const cleanup = async () => {
      try {
        await deleteDoc(presenceRef)
        console.log('✅ Presencia eliminada')
      } catch (error) {
        console.error('❌ Error al eliminar presencia:', error)
      }
    }

    // Cleanup cuando el usuario cierra la pestaña
    window.addEventListener('beforeunload', cleanup)

    return () => {
      clearInterval(presenceInterval)
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
    }
  }, [productId, user])

  // Escuchar usuarios conectados en tiempo real
  useEffect(() => {
    const usersRef = collection(db, 'presence', productId, 'users')
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Filtrar usuarios activos (últimos 60 segundos)
      const now = Date.now()
      const activeUsers = users.filter(u => {
        if (!u.lastActive) return false
        const lastActive = u.lastActive.toMillis()
        return (now - lastActive) < 60000 // 60 segundos
      })
      
      setConnectedUsers(activeUsers)
      console.log('✅ Usuarios conectados:', activeUsers)
    })

    return () => unsubscribe()
  }, [productId])

  if (connectedUsers.length === 0) return null

  const currentUserOnly = connectedUsers.length === 1 && connectedUsers[0].userId === user?.uid

  return (
    <motion.div
      className="flex items-center gap-2 mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {currentUserOnly ? (
        <div className="badge">
          <span>👤 Solo tú estás viendo este producto</span>
        </div>
      ) : (
        <div className="badge highlight">
          <span>👥 {connectedUsers.length} usuarios conectados</span>
        </div>
      )}
    </motion.div>
  )
}

