import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
      text: 'text-green-400',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: '⚠️'
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: 'ℹ️'
    }
  }

  const style = styles[type] || styles.success

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      className={`fixed top-20 right-4 z-50 ${style.bg} border ${style.border} backdrop-blur-md rounded-xl p-4 shadow-strong max-w-md flex items-center gap-3`}
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <span className="text-xl">{style.icon}</span>
      <p className={`${style.text} font-medium text-sm`}>{message}</p>
    </motion.div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <AnimatePresence>
      {toasts.map((toast, index) => (
        <motion.div
          key={toast.id}
          style={{ top: `${5 + index * 5}rem` }}
          className="fixed right-4 z-50 pointer-events-none"
        >
          <div className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

