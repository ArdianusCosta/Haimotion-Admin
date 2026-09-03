import PusherClient from 'pusher-js'

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || 'app-key',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          let userId = ''
          try {
             if (typeof window !== 'undefined') {
                const user = localStorage.getItem('auth_user')
                if (user) userId = JSON.parse(user).id
             }
          } catch(e) {}
          
          fetch('/api/pusher/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `socket_id=${socketId}&channel_name=${channel.name}&user_id=${userId}`
          })
          .then(res => {
             if (!res.ok) throw new Error('Auth failed')
             return res.json()
          })
          .then(data => callback(null, data))
          .catch(err => callback(new Error(`Error authenticating with Pusher: ${err}`), null))
        }
      }
    }
  }
)
