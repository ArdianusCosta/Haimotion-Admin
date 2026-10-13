const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Logika regex untuk membersihkan [RESIGN] / (RESIGN) dari nama
 * Contoh: "[RESIGN] Siska Harmelia Merywati Sihaloho" -> "Siska Harmelia Merywati Sihaloho"
 */
function cleanUserName(name) {
  if (!name) return ''
  return name.replace(/\[\s*resign\s*\]\s*|\(\s*resign\s*\)\s*/gi, '').trim()
}

function hasResignTag(name) {
  if (!name) return false
  return /\[\s*resign\s*\]|\(\s*resign\s*\)/i.test(name)
}

async function main() {
  console.log('🔍 Mencari user yang memiliki label [RESIGN] pada nama...')

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      firstname: true,
      lastname: true,
      status: true
    }
  })

  const targetUsers = allUsers.filter(u => hasResignTag(u.firstname) || hasResignTag(u.lastname))

  if (targetUsers.length === 0) {
    console.log('✅ Tidak ditemukan user dengan label [RESIGN]. Semua nama sudah bersih!')
    return
  }

  console.log(`📌 Ditemukan ${targetUsers.length} user yang perlu dibersihkan:\n`)

  let updatedCount = 0

  for (const user of targetUsers) {
    const cleanedFirstname = cleanUserName(user.firstname)
    const cleanedLastname = cleanUserName(user.lastname)

    console.log(`[ID ${user.id}]`)
    console.log(`  Nama Lama : ${user.firstname} ${user.lastname}`)
    console.log(`  Nama Baru : ${cleanedFirstname} ${cleanedLastname}`)
    console.log(`  Status    : ${user.status} -> resign`)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstname: cleanedFirstname,
        lastname: cleanedLastname,
        status: 'resign'
      }
    })

    updatedCount++
  }

  console.log(`\n🎉 Selesai! Sebanyak ${updatedCount} user berhasil diperbarui.`)
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat migrasi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
