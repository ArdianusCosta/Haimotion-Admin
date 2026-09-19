const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('model FinanceProductService')) {
  // Modify FinanceAccount
  schema = schema.replace(
    'model FinanceAccount {',
    'model FinanceAccount {\n  code           String?              @db.VarChar(50)\n  sub_type       String?              @db.VarChar(100)'
  );

  // Append new models
  const newModels = `
model FinanceProductService {
  id          Int      @id @default(autoincrement())
  code        String   @unique @db.VarChar(100)
  name        String   @db.VarChar(255)
  type        String   @db.VarChar(50)
  unit        String   @db.VarChar(50)
  brand       String?  @db.VarChar(100)
  price       Float    @default(0)
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now()) @updatedAt

  @@map("finance_products_services")
}

model FinanceContact {
  id          Int      @id @default(autoincrement())
  type        String   @db.VarChar(50)
  name        String   @db.VarChar(255)
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  address     String?  @db.Text
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now()) @updatedAt

  @@map("finance_contacts")
}
`;

  fs.writeFileSync('prisma/schema.prisma', schema + newModels);
  console.log('Schema updated successfully');
} else {
  console.log('Schema already updated');
}
