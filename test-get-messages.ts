import { getMessages } from './app/actions/chat'
async function run() {
  try {
    const msgs = await getMessages(1) // Assuming thread ID 1 exists
    console.log("Success", msgs.length)
  } catch (e) {
    console.error("Error:", e)
  }
}
run()
