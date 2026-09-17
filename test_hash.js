const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function verify(password, hash) {
  if (hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }
  const md5Password = crypto.createHash('md5').update(password).digest('hex');
  return md5Password === hash;
}

async function main() {
  console.log(await verify('123456', 'e807f1fcf82d132f9bb018ca6738a19f')); // expects true
}
main();
