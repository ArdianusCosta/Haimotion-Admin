const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('model Role')) {
  // Add role_id and relations to User
  schema = schema.replace(
    '  user_preference            UserPreference?\n',
    '  user_preference            UserPreference?\n\n  role_id                Int?\n  role                   Role?                    @relation(fields: [role_id], references: [id])\n  sessions               Session[]\n  accounts               Account[]\n  emailVerified          Boolean                  @default(false)\n  updatedAt              DateTime                 @default(now()) @updatedAt\n'
  );

  // Add the models
  schema += `
model Role {
  id          Int              @id @default(autoincrement())
  name        String           @unique @db.VarChar(100)
  description String?          @db.Text
  permissions RolePermission[]
  users       User[]

  @@map("roles")
}

model RolePermission {
  id         Int    @id @default(autoincrement())
  role_id    Int
  permission String @db.VarChar(100)
  
  role       Role   @relation(fields: [role_id], references: [id], onDelete: Cascade)
  
  @@unique([role_id, permission])
  @@map("role_permissions")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                Int
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}
`;

  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Schema updated successfully.');
} else {
  console.log('Schema already updated.');
}
