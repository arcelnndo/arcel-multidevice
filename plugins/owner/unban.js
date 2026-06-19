const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'unban',
    alias: ['delban', 'unblockuser'],
    category: 'owner',
    description: 'Menghapus user dari daftar banned',
    usage: '.unban <nomor/@tag>',
    example: '.unban 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`*✅ UNBAN USER*\n\nSilakan masukkan nomor atau tag user yang ingin dibuka blokirnya.\n\nContoh: \`${m.prefix}unban 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    const cleanTarget = targetNumber.replace(/[^0-9]/g, '')
    const index = config.bannedUsers.findIndex(num => {
        const cleanNum = num.replace(/[^0-9]/g, '')
        return cleanNum === cleanTarget
    })
    
    if (index === -1) {
        return m.reply(`*❌ GAGAL*\n\nNomor \`${targetNumber}\` tidak ditemukan dalam daftar banned.`)
    }
    
    config.bannedUsers.splice(index, 1)
    
    const db = getDatabase()
    db.setting('bannedUsers', config.bannedUsers)
    
    m.react('✅')
    
    await m.reply(
        `*✅ USER BERHASIL DI-UNBAN*\n\n` +
        `Nomor: ${targetNumber}\n` +
        `Status: Aktif (Unbanned)\n` +
        `Sisa Ban: ${config.bannedUsers.length} user\n\n` +
        `_Pengguna ini sekarang sudah bisa menggunakan fitur bot kembali._`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
