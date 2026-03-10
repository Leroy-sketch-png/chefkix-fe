// Firebase Cloud Messaging Service Worker
// Handles background push notifications for ChefKix

// These will be replaced at build time with actual Firebase config
const firebaseConfig = {
  apiKey: '__FIREBASE_API_KEY__',
  authDomain: '__FIREBASE_AUTH_DOMAIN__',
  projectId: '__FIREBASE_PROJECT_ID__',
  storageBucket: '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__FIREBASE_APP_ID__',
}

// Import Firebase scripts for service workers
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'ChefKix'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: payload.data?.notificationId || 'chefkix-notification',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Determine the URL to open
  const data = event.notification.data || {}
  let url = '/'

  if (data.link) {
    url = data.link
  } else if (data.type && data.targetId) {
    // Build URL based on notification type
    switch (data.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
        url = `/post/${data.targetId}`
        break
      case 'NEW_FOLLOWER':
        url = `/profile/${data.targetId}`
        break
      case 'LEVEL_UP':
      case 'BADGE_EARNED':
        url = '/profile?tab=achievements'
        break
      case 'STREAK_WARNING':
        url = '/dashboard'
        break
      default:
        url = '/notifications'
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's an existing window we can focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // No existing window, open a new one
      return clients.openWindow(url)
    })
  )
})
