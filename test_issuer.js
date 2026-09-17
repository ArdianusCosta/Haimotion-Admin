try {
  const { createLocalAccountIssuer } = require('better-auth/dist/db/index.js');
  console.log(createLocalAccountIssuer('credential'));
} catch (e) {
  console.error(e);
}
