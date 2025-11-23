import React, { useEffect, useState, useRef } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatBox({ productId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    const messagesRef = collection(db, 'chats', productId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        docRef: doc.ref,
        ...doc.data(),
        reactions: doc.data().reactions || { like: 0, heart: 0, fire: 0 },
        userReactions: doc.data().userReactions || {}
      }))
      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [productId])

  const sendMessage = async (e) => {
    e.preventDefault()

    if (!user) {
      alert('Inicia sesión para participar en el chat')
      return
    }

    if (!newMessage.trim()) {
      return
    }

    setSending(true)

    try {
      const messagesRef = collection(db, 'chats', productId, 'messages')
      await addDoc(messagesRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
        reactions: { like: 0, heart: 0, fire: 0 },
        userReactions: {}
      })

      setNewMessage('')
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error)
    } finally {
      setSending(false)
    }
  }

  const handleReaction = async (messageId, messageDocRef, reactionType, currentReactions, userReactions) => {
    if (!user) return

    try {
      const hasReacted = userReactions[user.uid] === reactionType

      if (hasReacted) {
        // Remover reacción
        await updateDoc(messageDocRef, {
          [`reactions.${reactionType}`]: increment(-1),
          [`userReactions.${user.uid}`]: null
        })
      } else {
        // Agregar o cambiar reacción
        const previousReaction = userReactions[user.uid]
        const updates = {
          [`reactions.${reactionType}`]: increment(1),
          [`userReactions.${user.uid}`]: reactionType
        }

        // Si tenía otra reacción, decrementarla
        if (previousReaction) {
          updates[`reactions.${previousReaction}`] = increment(-1)
        }

        await updateDoc(messageDocRef, updates)
      }
    } catch (error) {
      console.error('❌ Error al reaccionar:', error)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Ahora'

    const date = timestamp.toDate()
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Contenedor de mensajes */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm text-text-muted">
              Sé el primero en escribir algo<br />
              en esta subasta
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                className={`flex flex-col ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={`max-w-[85%] rounded-2xl p-3 ${msg.userId === user?.uid
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white/10 text-text-main rounded-tl-none'
                  }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-80">
                    <span className="text-xs font-bold">
                      {msg.userName}
                    </span>
                    <span className="text-[10px]">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm break-words leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {/* Reacciones */}
                <div className="flex items-center gap-1 mt-1 px-1">
                  <ReactionButton
                    emoji="👍"
                    type="like"
                    count={msg.reactions?.like || 0}
                    active={msg.userReactions?.[user?.uid] === 'like'}
                    onClick={() => handleReaction(msg.id, msg.docRef, 'like', msg.reactions, msg.userReactions)}
                    disabled={!user}
                  />
                  <ReactionButton
                    emoji="❤️"
                    type="heart"
                    count={msg.reactions?.heart || 0}
                    active={msg.userReactions?.[user?.uid] === 'heart'}
                    onClick={() => handleReaction(msg.id, msg.docRef, 'heart', msg.reactions, msg.userReactions)}
                    disabled={!user}
                  />
                  <ReactionButton
                    emoji="🔥"
                    type="fire"
                    count={msg.reactions?.fire || 0}
                    active={msg.userReactions?.[user?.uid] === 'fire'}
                    onClick={() => handleReaction(msg.id, msg.docRef, 'fire', msg.reactions, msg.userReactions)}
                    disabled={!user}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="p-4 border-t border-white/5 bg-card">
        {user ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
              maxLength={500}
            />
            <motion.button
              type="submit"
              className="btn px-4 py-2.5"
              disabled={!newMessage.trim() || sending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sending ? '...' : '➤'}
            </motion.button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-text-muted">
              🔒 Inicia sesión para participar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReactionButton({ emoji, type, count, active, onClick, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${active
          ? 'bg-primary/30 border border-primary/50 text-white'
          : 'bg-white/5 hover:bg-white/10 text-text-muted'
        }`}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
    >
      <span className={active ? 'scale-110' : ''}>{emoji}</span>
      {count > 0 && <span className="font-medium">{count}</span>}
    </motion.button>
  )
}
