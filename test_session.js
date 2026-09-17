const { auth } = require('./lib/auth/auth');
async function main() {
  try {
    const session = await auth.$context.internalAdapter.findSession('some-token');
    console.log(session);
  } catch(e) {
    console.error(e);
  }
}
// main();
