const { betterAuth } = require('better-auth');
const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async () => 'test',
      verify: async () => true
    }
  }
});
console.log(auth);
