import React from 'react'
import Menu from './Menu'
import { useAuth } from '../../hooks/useAuth'
import Loader from './Loader'
import Footer from './Footer'

export default function Layout({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Menu />
      <main className="max-w-[1280px] mx-auto px-6 py-8 w-full flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
