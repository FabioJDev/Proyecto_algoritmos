import React, { createContext, useEffect, useState, useContext } from 'react'
import { auth, waitForAuth } from '../services/firebase'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u); setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const register = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if(displayName){ await updateProfile(cred.user, { displayName }) }
    setUser({ ...cred.user })
    return cred.user
  }
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
