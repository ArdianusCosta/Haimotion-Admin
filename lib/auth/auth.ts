import fs from 'fs';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { passkey } from "@better-auth/passkey";

const prismaWithHooks = prisma.$extends({
  query: {
    passkey: {
      async findMany({ args, query }) {
        if (args.where?.credentialID) {
          if (typeof args.where.credentialID === 'string') {
            args.where.credentialID = args.where.credentialID.replace(/=+$/, '');
          } else if (typeof args.where.credentialID.equals === 'string') {
            args.where.credentialID.equals = args.where.credentialID.equals.replace(/=+$/, '');
          }
        }
        if (args.where?.userId && typeof args.where.userId === 'string') {
          args.where.userId = Number(args.where.userId);
        }
        if (args.where?.userId?.equals && typeof args.where.userId.equals === 'string') {
          args.where.userId.equals = Number(args.where.userId.equals);
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        console.log("findFirst called with:", JSON.stringify(args));
        if (args.where?.credentialID) {
          if (typeof args.where.credentialID === 'string') {
            args.where.credentialID = args.where.credentialID.replace(/=+$/, '');
          } else if (typeof args.where.credentialID.equals === 'string') {
            args.where.credentialID.equals = args.where.credentialID.equals.replace(/=+$/, '');
          }
        }
        if (args.where?.userId && typeof args.where.userId === 'string') {
          args.where.userId = Number(args.where.userId);
        }
        if (args.where?.userId?.equals && typeof args.where.userId.equals === 'string') {
          args.where.userId.equals = Number(args.where.userId.equals);
        }
        return query(args);
      },
      async findUnique({ args, query }) {
        console.log("findUnique called with:", JSON.stringify(args));
        return query(args);
      },
      async create({ args, query }) {
        if (args.data.userId && typeof args.data.userId === 'string') {
          args.data.userId = Number(args.data.userId);
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.userId && typeof args.data.userId === 'string') {
          args.data.userId = Number(args.data.userId);
        }
        return query(args);
      }
    }
  }
});

export const auth = betterAuth({
  trustedOrigins: ["http://192.168.0.29:3000", "http://192.168.7.21:3000"],
  database: prismaAdapter(prismaWithHooks as any, {
    provider: (process.env.ACTIVE_DB || 'postgres').toLowerCase() === 'mysql' ? 'mysql' : 'postgres',
  }),
  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error("BETTER AUTH API ERROR:", error);
      import('fs').then(fs => {
        fs.appendFileSync('better-auth-error.log', new Date().toISOString() + '\\n' + JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\\n');
      }).catch(() => {});
    }
  },
  user: {
    modelName: "user",
    fields: {
      id: "id",
      email: "email",
      image: "avatar",
      name: "name",
      createdAt: "date_created",
      emailVerified: "emailVerified",
      updatedAt: "updatedAt"
    }
  },
  emailAndPassword: {
    enabled: true,
    password: {
      async verify({ hash, password }) {
        if (!hash) return false;
        if (hash.startsWith("$2")) {
          return bcrypt.compare(password, hash);
        }
        
        // Fallback for legacy MD5 hashed passwords
        const crypto = require('crypto');
        const md5Password = crypto.createHash('md5').update(password).digest('hex');
        if (md5Password === hash) {
          return true;
        }
        
        // Original fallback in old system
        return password === hash;
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    passkey({
      rpID: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "localhost",
      rpName: "HaiMotion",
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    })
  ]
});
