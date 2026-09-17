const { auth } = require('./lib/auth/auth');
async function main() {
  const userRecord = await auth.$context.internalAdapter.findUserByEmail('costa@gmail.com', { includeAccounts: true });
  console.log('User Record:', typeof userRecord.user.id, userRecord.user.id);
  console.log('Accounts:', userRecord.accounts);
}
main();
