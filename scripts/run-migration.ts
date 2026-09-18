import { PrismaClient as MysqlClient, Prisma as MysqlPrisma } from '@prisma/client-mysql';
import { PrismaClient as PostgresClient } from '@prisma/client-postgres';

const mysql = new MysqlClient();
const pg = new PostgresClient();

async function migrate() {
  console.log('🚀 Starting Data Migration: MySQL -> PostgreSQL (Supabase)');
  
  try {
    // 1. Disable Foreign Key checks in Postgres to allow out-of-order inserts
    console.log('> Disabling Postgres Foreign Key checks (session_replication_role = replica)...');
    await pg.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
  } catch (err) {
    console.error('Failed to disable FK checks. Make sure you are using the postgres user.', err.message);
    process.exit(1);
  }
  
  const models = MysqlPrisma.dmmf.datamodel.models;
  
  // 2. Loop through every model and migrate data
  for (const modelDef of models) {
    const model = modelDef.name;
    // Map PascalCase to camelCase for the client property (e.g. User -> user, project_list -> project_list)
    const clientProp = model.charAt(0).toLowerCase() + model.slice(1);
    const tableName = modelDef.dbName || model;
    
    if (mysql[clientProp]) {
      try {
        const data = await mysql[clientProp].findMany();
        if (data.length > 0) {
          console.log(`Migrating ${model} (${data.length} rows)...`);
          
          // Batch inserts to prevent payload too large errors
          const BATCH_SIZE = 1000;
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            await pg[clientProp].createMany({
              data: batch,
              skipDuplicates: true // Skip if somehow already exists
            });
          }
          console.log(`✅ ${model} migrated.`);
        } else {
          console.log(`⏭️ ${model} is empty, skipping.`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${model}:`, error.message);
      }
      
      // 3. Fix auto-increment sequences (SERIAL) in Postgres
      // In Postgres, inserting explicit IDs does not advance the sequence.
      try {
         await pg.$executeRawUnsafe(`
           SELECT setval(
             pg_get_serial_sequence('"${tableName}"', 'id'), 
             coalesce(max(id), 1), 
             max(id) IS NOT null
           ) FROM "${tableName}";
         `);
      } catch (e) {
         // Silently ignore if table doesn't have an 'id' sequence
      }
    }
  }

  // 4. Re-enable Foreign Key checks
  console.log('> Re-enabling Postgres Foreign Key checks...');
  await pg.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
  
  console.log('🎉 Migration completed successfully!');
  await mysql.$disconnect();
  await pg.$disconnect();
}

migrate().catch(console.error);
