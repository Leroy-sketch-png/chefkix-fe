// Firebase Cloud Messaging Service Worker
// Handles background push notifications for ChefKix
//
// Firebase config is passed via postMessage from the main thread (usePushNotifications hook).
// This avoids hardcoding secrets in a static file served from public/.

// Import Firebase compat SDK for service workers
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// Config is received from the main thread and cached in a variable
let firebaseInitialized = false

// Listen for config from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebaseInitialized) {
      firebase.initializeApp(event.data.config)
      firebaseInitialized = true
      setupMessaging()
    }
  }
})

function setupMessaging() {
  const messaging = firebase.messaging()

  // Handle background messages (when app is not in foreground)
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'ChefKix'
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
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
}

// Handle notification click — works regardless of Firebase init state
self.addEventListener('notificationclick', (event) => {
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
    switch (data.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
        url = '/post/' + data.targetId
        break
      case 'NEW_FOLLOWER':
        url = '/' + data.targetId
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
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
