import { betterAuth } from "better-auth";
import crypto from 'crypto';
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { passkey } from "@better-auth/passkey";

const prismaWithHooks = prisma.$extends({
  query: {
    account: {
      async create({ args, query }) {
        const data = args.data as any;
        if (data?.userId && typeof data.userId === 'string') {
          data.userId = Number(data.userId);
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        const where = args.where as any;
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        return query(args);
      },
      async findMany({ args, query }) {
        const where = args.where as any;
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        return query(args);
      }
    },
    session: {
      async create({ args, query }) {
        const data = args.data as any;
        if (data?.userId && typeof data.userId === 'string') {
          data.userId = Number(data.userId);
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        const where = args.where as any;
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        return query(args);
      },
      async findMany({ args, query }) {
        const where = args.where as any;
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        return query(args);
      }
    },
    passkey: {
      async findMany({ args, query }) {
        const where = args.where as any;
        if (where?.credentialID) {
          if (typeof where.credentialID === 'string') {
            where.credentialID = where.credentialID.replace(/=+$/, '');
          } else if (typeof where.credentialID.equals === 'string') {
            where.credentialID.equals = where.credentialID.equals.replace(/=+$/, '');
          }
        }
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        if (where?.userId?.equals && typeof where.userId.equals === 'string') {
          where.userId.equals = Number(where.userId.equals);
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        const where = args.where as any;
        if (where?.credentialID) {
          if (typeof where.credentialID === 'string') {
            where.credentialID = where.credentialID.replace(/=+$/, '');
          } else if (typeof where.credentialID.equals === 'string') {
            where.credentialID.equals = where.credentialID.equals.replace(/=+$/, '');
          }
        }
        if (where?.userId && typeof where.userId === 'string') {
          where.userId = Number(where.userId);
        }
        if (where?.userId?.equals && typeof where.userId.equals === 'string') {
          where.userId.equals = Number(where.userId.equals);
        }
        return query(args);
      },
      async findUnique({ args, query }) {
        return query(args);
      },
      async create({ args, query }) {
        const data = args.data as any;
        if (data?.userId && typeof data.userId === 'string') {
          data.userId = Number(data.userId);
        }
        return query(args);
      },
      async update({ args, query }) {
        const data = args.data as any;
        if (data?.userId && typeof data.userId === 'string') {
          data.userId = Number(data.userId);
        }
        return query(args);
      }
    }
  }
});

const activeDb = (process.env.ACTIVE_DB || 'postgres').toLowerCase();
const dbProvider = activeDb === 'postgres' ? 'postgresql' : 'mysql';

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const getTrustedOrigins = () => {
  const origins = [
    "http://192.168.0.29:3000",
    "http://192.168.7.21:3000",
    "http://localhost:3000",
    "https://dashboardv2.haimotion.com",
    "http://dashboardv2.haimotion.com",
  ];
  if (process.env.BETTER_AUTH_URL) origins.push(process.env.BETTER_AUTH_URL);
  if (process.env.NEXT_PUBLIC_APP_URL) origins.push(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return Array.from(new Set(origins));
};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    database: {
      validateSchema: false
    }
  },
  database: prismaAdapter(prismaWithHooks as any, {
    provider: dbProvider,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email || "").toLowerCase().trim();
          
          // Split full name or email username into firstname & lastname
          const fullName = (user.name || "").trim();
          const parts = fullName ? fullName.split(/\s+/) : [email.split('@')[0] || "User"];
          const firstname = (user as any).firstname || parts[0] || "User";
          const lastname = (user as any).lastname || (parts.length > 1 ? parts.slice(1).join(" ") : "");
          const avatar = (user as any).avatar || (user as any).image || "";
          const password = (user as any).password || "";

          return {
            data: {
              ...user,
              email,
              name: fullName || `${firstname} ${lastname}`.trim(),
              firstname,
              lastname,
              avatar,
              password,
              status: (user as any).status || "active",
              emailVerified: true
            }
          };
        }
      }
    }
  },
  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error("BETTER AUTH API ERROR:", error);
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
    },
    additionalFields: {
      status: {
        type: "string",
        defaultValue: "active"
      },
      firstname: {
        type: "string",
        required: false
      },
      lastname: {
        type: "string",
        required: false
      },
      password: {
        type: "string",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`Reset password link for ${user.email}: ${url}`);
      // TODO: Implement actual email sending using Resend or Nodemailer
    },
    password: {
      async verify({ hash, password }) {
        if (!hash) return false;
        if (hash.startsWith("$2")) {
          return bcrypt.compare(password, hash);
        }
        
        // Fallback for legacy MD5 hashed passwords
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
      rpID: (() => {
        try {
          return new URL(getBaseURL()).hostname;
        } catch {
          return "localhost";
        }
      })(),
      rpName: "HaiMotion",
      origin: getBaseURL(),
    })
  ]
});
