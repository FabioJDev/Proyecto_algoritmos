import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Index/Home'
import Login from '../pages/Index/Login'
import Register from '../pages/Index/Register'
import ProductDetail from '../pages/Index/ProductDetail'
import CreateProduct from '../pages/Index/CreateProduct'
import Dashboard from '../pages/Index/Dashboard'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/Shared/Loader'

function PrivateRoute({ children }){
  const { user, loading } = useAuth()
  if(loading) return <Loader fullScreen />
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/create" element={<PrivateRoute><CreateProduct /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
