import { createCallSession } from './app/actions/chat'

async function run() {
  try {
    // Note: requires valid threadId and callerId. We can look them up in DB.
    console.log("We need to mock requireAuth or something.");
  } catch (e) {
    console.error(e)
  }
}
run()
