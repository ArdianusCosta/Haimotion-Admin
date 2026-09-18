const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  let envs = {};
  
  [envPath, envLocalPath].forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^#\s][^=]+)=(.*)$/);
        if (match) {
          envs[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        }
      });
    }
  });
  return envs;
}

const envs = loadEnv();
const activeDb = (process.env.ACTIVE_DB || envs.ACTIVE_DB || 'postgres').toLowerCase();

const command = process.argv[2] || 'generate';
let schemaArgs = '';
const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (activeDb === 'postgres') {
  console.log('🐘 PostgreSQL/Supabase Mode Active. Generating Postgres-compatible Prisma schema...');
  
  schemaContent = schemaContent.replace(/provider\s*=\s*"mysql"/, 'provider = "postgresql"');
  schemaContent = schemaContent.replace(/env\("DATABASE_URL"\)/, 'env("POSTGRES_URL")');
  
  schemaContent = schemaContent.replace(/@db\.TinyInt/g, '@db.SmallInt');
  schemaContent = schemaContent.replace(/@db\.DateTime\(\d+\)/g, '@db.Timestamp()');
  schemaContent = schemaContent.replace(/@db\.DateTime/g, '@db.Timestamp()');
  schemaContent = schemaContent.replace(/@db\.Time\(\d+\)/g, '@db.Time()');
  schemaContent = schemaContent.replace(/@db\.Float/g, '@db.Real');

  schemaContent = schemaContent.replace(/(@@(index|unique)\([^)]+?)(,\s*map:\s*"[^"]+")\)/g, '$1)');
  schemaContent = schemaContent.replace(/(@unique\(\s*map:\s*"[^"]+"\s*\))/g, '@unique');

  const generatedPath = path.join(process.cwd(), 'prisma/schema.postgresql.prisma');
  fs.writeFileSync(generatedPath, schemaContent);
  schemaArgs = '--schema=prisma/schema.postgresql.prisma';
  console.log('✅ Wrote prisma/schema.postgresql.prisma');
} else {
  console.log('🐬 MySQL Mode Active. Generating MySQL Prisma schema...');
  
  schemaContent = schemaContent.replace(/env\("DATABASE_URL"\)/, 'env("MYSQL_URL")');
  
  const generatedPath = path.join(process.cwd(), 'prisma/schema.mysql.prisma');
  fs.writeFileSync(generatedPath, schemaContent);
  schemaArgs = '--schema=prisma/schema.mysql.prisma';
  console.log('✅ Wrote prisma/schema.mysql.prisma');
}

try {
  const args = process.argv.slice(2).join(' ') || 'generate';
  let execCommand = `npx prisma ${args} ${schemaArgs}`;
  
  console.log(`> Running: ${execCommand}`);
  execSync(execCommand, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Prisma command failed.');
  process.exit(1);
}
