import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Validar configuración
if (!firebaseConfig.apiKey) {
  console.warn('⚠️ Firebase API Key no encontrada. Verifica tu archivo .env')
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Added Google sign-in integration
// Configurar proveedor de Google
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ 
  prompt: "select_account" // Siempre mostrar selector de cuenta
})

/**
 * Inicia sesión con Google usando popup
 * Crea o actualiza el usuario en Firestore automáticamente
 */
export const signInWithGoogle = async () => {
  try {
    console.log('🔄 Iniciando sesión con Google...')
    
    // Abrir popup de Google
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    console.log('✅ Usuario autenticado:', user.email)
    
    // Verificar si el usuario ya existe en Firestore
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      // Crear nuevo usuario en Firestore
      const userData = {
        uid: user.uid,
        name: user.displayName || 'Usuario',
        email: user.email,
        photoURL: user.photoURL || null,
        provider: 'google',
        createdAt: serverTimestamp()
      }
      
      await setDoc(userRef, userData)
      console.log('✅ Nuevo usuario creado en Firestore:', user.uid)
    } else {
      // Actualizar datos del usuario si cambiaron
      const existingData = userSnap.data()
      const needsUpdate = 
        existingData.name !== user.displayName || 
        existingData.photoURL !== user.photoURL
      
      if (needsUpdate) {
        await setDoc(userRef, {
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          lastLogin: serverTimestamp()
        }, { merge: true })
        
        console.log('✅ Datos de usuario actualizados en Firestore')
      }
    }
    
    return {
      success: true,
      user: {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      }
    }
  } catch (error) {
    console.error('❌ Error en inicio de sesión con Google:', error)
    
    // Mensajes de error específicos
    let errorMessage = 'Error al iniciar sesión con Google'
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Cerraste la ventana de inicio de sesión'
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes y vuelve a intentarlo.'
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Solo puedes tener una ventana de inicio de sesión abierta a la vez'
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de red. Verifica tu conexión a internet.'
    }
    
    return {
      success: false,
      error: errorMessage,
      code: error.code
    }
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export const signOutUser = async () => {
  try {
    await signOut(auth)
    console.log('✅ Sesión cerrada exitosamente')
    return { success: true }
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error)
    return { 
      success: false, 
      error: 'Error al cerrar sesión' 
    }
  }
}

export const waitForAuth = () => new Promise(resolve => {
  const unsub = onAuthStateChanged(auth, user => {
    unsub()
    resolve(user || null)
  })
})
