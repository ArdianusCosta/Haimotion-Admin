const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Preparing dual Prisma clients for migration...');

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let baseSchema = fs.readFileSync(schemaPath, 'utf8');

// 1. Prepare MySQL Migration Client Schema
let mysqlSchema = baseSchema.replace(/env\("DATABASE_URL"\)/, 'env("MYSQL_URL")');
mysqlSchema = mysqlSchema.replace(/provider\s*=\s*"prisma-client-js"/, 'provider = "prisma-client-js"\n  output = "../node_modules/@prisma/client-mysql"');
const mysqlSchemaPath = path.join(process.cwd(), 'prisma/schema.migrate-mysql.prisma');
fs.writeFileSync(mysqlSchemaPath, mysqlSchema);

// 2. Prepare Postgres Migration Client Schema
let pgSchema = baseSchema.replace(/provider\s*=\s*"mysql"/, 'provider = "postgresql"');
pgSchema = pgSchema.replace(/env\("DATABASE_URL"\)/, 'env("POSTGRES_URL")');
pgSchema = pgSchema.replace(/provider\s*=\s*"prisma-client-js"/, 'provider = "prisma-client-js"\n  output = "../node_modules/@prisma/client-postgres"');

// Postgres specific replacements
pgSchema = pgSchema.replace(/@db\.TinyInt/g, '@db.SmallInt');
pgSchema = pgSchema.replace(/@db\.DateTime\(\d+\)/g, '@db.Timestamp()');
pgSchema = pgSchema.replace(/@db\.DateTime/g, '@db.Timestamp()');
pgSchema = pgSchema.replace(/@db\.Time\(\d+\)/g, '@db.Time()');
pgSchema = pgSchema.replace(/@db\.Float/g, '@db.Real');
pgSchema = pgSchema.replace(/(@@(index|unique)\([^)]+?)(,\s*map:\s*"[^"]+")\)/g, '$1)');
pgSchema = pgSchema.replace(/(@unique\(\s*map:\s*"[^"]+"\s*\))/g, '@unique');

const pgSchemaPath = path.join(process.cwd(), 'prisma/schema.migrate-postgres.prisma');
fs.writeFileSync(pgSchemaPath, pgSchema);

// 3. Generate Clients
try {
  console.log('> Generating MySQL Client...');
  execSync('npx prisma generate --schema=prisma/schema.migrate-mysql.prisma', { stdio: 'inherit' });
  
  console.log('> Generating Postgres Client...');
  execSync('npx prisma generate --schema=prisma/schema.migrate-postgres.prisma', { stdio: 'inherit' });
  
  console.log('✅ Dual clients generated successfully.');
} catch (error) {
  console.error('❌ Failed to generate migration clients.', error);
  process.exit(1);
}
