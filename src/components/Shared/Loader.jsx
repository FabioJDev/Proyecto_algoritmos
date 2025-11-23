import React from 'react'
import { motion } from 'framer-motion'

export default function Loader({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md z-50">
        <LoaderContent />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <LoaderContent />
    </div>
  )
}

function LoaderContent() {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative w-16 h-16 rounded-full border-4 border-white/10 border-t-primary border-r-secondary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        className="text-white font-medium text-lg animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Cargando SmartMarket...
      </motion.p>
    </div>
  )
}

