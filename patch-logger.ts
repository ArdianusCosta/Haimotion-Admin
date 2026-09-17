import fs from 'fs';
import path from 'path';

const pluginFile = path.resolve('node_modules/@better-auth/passkey/dist/index.mjs');
let content = fs.readFileSync(pluginFile, 'utf8');

// Find adapter.findOne inside passkeyVerifyAuthentication
content = content.replace(
  'const passkey = await ctx.context.adapter.findOne({',
  `console.log("PASSKEY LOGIN ATTEMPT: resp.id=", resp.id);
   const allPasskeys = await ctx.context.adapter.findMany({ model: "passkey" });
   console.log("ALL PASSKEYS IN DB:", JSON.stringify(allPasskeys, null, 2));
   const passkey = await ctx.context.adapter.findOne({`
);

fs.writeFileSync(pluginFile, content);
console.log("Patched");
