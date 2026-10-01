import 'dotenv/config';
import { auth } from '../lib/auth/auth';

async function test() {
  const ctx = await (auth as any).$context;
  console.log('authCookies.sessionToken.name:', ctx.authCookies.sessionToken.name);
}

test();
