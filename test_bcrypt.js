const bcrypt = require('bcryptjs');
async function main() {
  const hash = '$2y$10$G8ecP4sMdC3q.8QtczdDMeXRnE5pPZIrOlMmp4u79pBrQ6aG6aK8.';
  console.log(await bcrypt.compare('password123', hash));
  console.log(await bcrypt.compare('password', hash));
  console.log(await bcrypt.compare('costa@gmail.com', hash));
  console.log(await bcrypt.compare('user123', hash));
  console.log(await bcrypt.compare('123456', hash));
}
main();
