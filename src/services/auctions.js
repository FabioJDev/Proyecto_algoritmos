import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

// Automatic auction closing logic
// Verifica y cierra subastas que han expirado

/**
 * Verifica todas las subastas activas y cierra las que han expirado
 * @returns {Promise<Array>} Array de subastas cerradas
 */
export async function checkAuctions() {
  try {
    console.log('🔍 Verificando subastas activas...')
    
    // Obtener todas las subastas activas
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'Activa')
    )
    
    const snapshot = await getDocs(q)
    const activeAuctions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`✅ Encontradas ${activeAuctions.length} subastas activas`)
    
    const now = Date.now()
    const closedAuctions = []
    
    // Verificar cada subasta activa
    for (const auction of activeAuctions) {
      // Validar que tenga fecha de finalización
      if (!auction.auctionEndDate) {
        console.warn(`⚠️ Subasta ${auction.id} no tiene fecha de finalización`)
        continue
      }
      
      const endTime = auction.auctionEndDate.toMillis()
      
      // Si la fecha actual es mayor o igual a la fecha de finalización, cerrar la subasta
      if (now >= endTime) {
        console.log(`⏱️ Cerrando subasta ${auction.id} - ${auction.title}`)
        
        try {
          await closeAuction(auction.id, auction)
          closedAuctions.push(auction)
        } catch (error) {
          console.error(`❌ Error al cerrar subasta ${auction.id}:`, error)
        }
      }
    }
    
    if (closedAuctions.length > 0) {
      console.log(`🏁 ${closedAuctions.length} subastas cerradas exitosamente`)
    }
    
    return closedAuctions
  } catch (error) {
    console.error('❌ Error al verificar subastas:', error)
    return []
  }
}

/**
 * Cierra una subasta específica
 * @param {string} productId - ID del producto/subasta
 * @param {Object} productData - Datos del producto (opcional, para evitar consulta adicional)
 */
export async function closeAuction(productId, productData = null) {
  try {
    console.log(`🏁 Iniciando cierre de subasta ${productId}`)
    
    // Obtener datos del producto si no se proporcionaron
    if (!productData) {
      const productRef = doc(db, 'products', productId)
      const productSnap = await getDoc(productRef)
      
      if (!productSnap.exists()) {
        console.error(`❌ Producto ${productId} no encontrado`)
        return
      }
      
      productData = { id: productSnap.id, ...productSnap.data() }
    }
    
    // Verificar que no esté ya finalizada (evitar duplicados)
    if (productData.status === 'Finalizada') {
      console.log(`⚠️ Subasta ${productId} ya está finalizada`)
      return
    }
    
    // Corrected winner selection - Obtener TODAS las ofertas del producto
    const bidsQuery = query(
      collection(db, 'bids'),
      where('productId', '==', productId)
    )
    
    const bidsSnapshot = await getDocs(bidsQuery)
    
    let updateData = {
      status: 'Finalizada',
      closedAt: serverTimestamp()
    }
    
    // Si hay ofertas, determinar el ganador
    if (!bidsSnapshot.empty) {
      // Mapear todas las ofertas
      const bids = bidsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log(`📊 Total de ofertas encontradas: ${bids.length}`, bids)
      
      // Ordenar por monto (de mayor a menor)
      bids.sort((a, b) => b.amount - a.amount)
      
      const highestBid = bids[0]
      
      // Validar que el ganador tenga todos los campos necesarios
      if (!highestBid.userId || !highestBid.userName || !highestBid.amount) {
        console.error('⚠️ Oferta ganadora tiene campos incompletos:', highestBid)
      }
      
      updateData = {
        ...updateData,
        winnerId: highestBid.userId,
        winnerName: highestBid.userName,
        finalPrice: highestBid.amount
      }
      
      console.log(`🏆 Ganador: ${highestBid.userName} con oferta de $${highestBid.amount}`)
      
      // Enviar notificación al ganador
      await sendNotification(highestBid.userId, {
        type: 'winner',
        title: '¡Felicidades, ganaste una subasta!',
        message: `Has ganado la subasta de "${productData.title}" con una oferta de $${highestBid.amount.toLocaleString('es-CO')}.`,
        productId: productId,
        productTitle: productData.title,
        finalPrice: highestBid.amount
      })
    } else {
      // Sin ofertas
      updateData = {
        ...updateData,
        winnerId: null,
        winnerName: 'Sin ofertas',
        finalPrice: 0
      }
      
      console.log(`📭 Subasta cerrada sin ofertas`)
    }
    
    // Actualizar el producto
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, updateData)
    
    console.log(`✅ Subasta ${productId} actualizada a 'Finalizada'`)
    
    // Enviar notificación al vendedor
    if (productData.sellerId) {
      // Solo si hubo ofertas o sin ofertas (diferente mensaje)
      if (updateData.winnerId) {
        // Hubo ganador
        await sendNotification(productData.sellerId, {
          type: 'seller',
          title: 'Tu subasta ha finalizado',
          message: `El producto "${productData.title}" ha terminado. Ganador: ${updateData.winnerName} por $${updateData.finalPrice.toLocaleString('es-CO')}.`,
          productId: productId,
          productTitle: productData.title,
          winnerId: updateData.winnerId,
          winnerName: updateData.winnerName,
          finalPrice: updateData.finalPrice
        })
      } else {
        // No hubo ofertas
        await sendNotification(productData.sellerId, {
          type: 'seller',
          title: 'Tu subasta ha finalizado',
          message: `Tu subasta de "${productData.title}" finalizó sin ofertas.`,
          productId: productId,
          productTitle: productData.title,
          winnerId: null,
          winnerName: 'Sin ofertas',
          finalPrice: 0
        })
      }
    }
    
    console.log(`✅ Subasta ${productId} cerrada exitosamente`)
    
  } catch (error) {
    console.error(`❌ Error al cerrar subasta ${productId}:`, error)
    throw error
  }
}

/**
 * Envía una notificación a un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} notificationData - Datos de la notificación
 */
async function sendNotification(userId, notificationData) {
  try {
    await addDoc(collection(db, 'notifications', userId, 'items'), {
      ...notificationData,
      createdAt: serverTimestamp(),
      read: false
    })
    
    console.log(`📬 Notificación enviada a usuario ${userId}`)
  } catch (error) {
    console.error(`❌ Error al enviar notificación a ${userId}:`, error)
  }
}

/**
 * Calcula el tiempo restante de una subasta
 * @param {Object} auctionEndDate - Timestamp de Firebase
 * @returns {Object} Objeto con días, horas, minutos, segundos y si ha expirado
 */
export function calculateTimeRemaining(auctionEndDate) {
  if (!auctionEndDate) return { expired: true, timeString: 'Sin fecha' }
  
  const now = Date.now()
  const endTime = auctionEndDate.toMillis()
  const diff = endTime - now
  
  if (diff <= 0) {
    return { expired: true, timeString: 'Finalizada' }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  let timeString = ''
  if (days > 0) timeString += `${days}d `
  if (hours > 0 || days > 0) timeString += `${hours}h `
  if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `
  timeString += `${seconds}s`
  
  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    timeString: timeString.trim()
  }
}

