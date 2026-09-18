import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({ log: ['query'] }).$extends({
    query: {
      user: {
        async $allOperations({ operation, args, query }) {
          const convertArgsId = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            for (const key in obj) {
              if (key === 'id' && typeof obj[key] === 'string') {
                const parsed = parseInt(obj[key], 10);
                if (!isNaN(parsed)) obj[key] = parsed;
              } else if (key === 'id' && typeof obj[key] === 'object' && typeof obj[key].equals === 'string') {
                const parsed = parseInt(obj[key].equals, 10);
                if (!isNaN(parsed)) obj[key].equals = parsed;
              } else if (typeof obj[key] === 'object') {
                convertArgsId(obj[key]);
              }
            }
          };
          convertArgsId(args);
          const result = await query(args);
          
          const convertId = (user: any) => {
            if (user && typeof user.id === 'number') {
              user.id = String(user.id);
            }
          };
          
          if (Array.isArray(result)) {
            result.forEach(convertId);
          } else {
            convertId(result);
          }
          
          return result;
        }
      },
      account: {
        async $allOperations({ operation, args, query }) {
          const convertUserId = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            for (const key in obj) {
              if (key === 'userId' && typeof obj[key] === 'string') {
                const parsed = parseInt(obj[key], 10);
                if (!isNaN(parsed)) obj[key] = parsed;
              } else if (key === 'userId' && typeof obj[key] === 'object' && typeof obj[key].equals === 'string') {
                const parsed = parseInt(obj[key].equals, 10);
                if (!isNaN(parsed)) obj[key].equals = parsed;
              } else if (typeof obj[key] === 'object') {
                convertUserId(obj[key]);
              }
            }
          };
          convertUserId(args);
          const result = await query(args);
          
          const convertAccountId = (acc: any) => {
            if (acc) {
              if (typeof acc.accountId === 'number') {
                acc.accountId = String(acc.accountId);
              }
              if (typeof acc.userId === 'number') {
                acc.userId = String(acc.userId);
              }
              if (acc.providerId === 'credential') {
                acc.issuer = 'local:credential';
              }
            }
          };
          
          if (Array.isArray(result)) {
            result.forEach(convertAccountId);
          } else {
            convertAccountId(result);
          }
          
          return result;
        }
      },
      session: {
        async $allOperations({ operation, args, query }) {
          const convertUserId = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            for (const key in obj) {
              if (key === 'userId' && typeof obj[key] === 'string') {
                const parsed = parseInt(obj[key], 10);
                if (!isNaN(parsed)) obj[key] = parsed;
              } else if (key === 'userId' && typeof obj[key] === 'object' && typeof obj[key].equals === 'string') {
                const parsed = parseInt(obj[key].equals, 10);
                if (!isNaN(parsed)) obj[key].equals = parsed;
              } else if (typeof obj[key] === 'object') {
                convertUserId(obj[key]);
              }
            }
          };
          convertUserId(args);
          const result = await query(args);
          
          const convertSession = (sess: any) => {
            if (sess) {
              if (typeof sess.userId === 'number') {
                sess.userId = String(sess.userId);
              }
              if (sess.user && typeof sess.user.id === 'number') {
                sess.user.id = String(sess.user.id);
              }
            }
          };
          
          if (Array.isArray(result)) {
            result.forEach(convertSession);
          } else {
            convertSession(result);
          }
          
          return result;
        }
      }
    }
  })
}

declare global {
  var prisma8: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma8 ?? prismaClientSingleton()

export default prisma

export const __force_invalidate_cache = 5

if (process.env.NODE_ENV !== 'production') globalThis.prisma8 = prisma
