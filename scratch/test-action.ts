import { getProjects } from './app/actions/projects'
async function test() {
  try {
    // We cannot easily test server action with auth dependency directly like this because headers() from 'next/headers' will fail outside Next.js request context.
    console.log("We need to check server logs instead.");
  } catch(e) {
    console.error(e)
  }
}
test()
