const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'ban',
    alias: ['addban', 'block'],
    category: 'owner',
    description: 'Memblokir user dari menggunakan bot',
    usage: '.ban <nomor/@tag>',
    example: '.ban 6281234567890',
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
        return m.reply(`*🚫 BAN USER*\n\nSilakan masukkan nomor atau tag user yang ingin diblokir.\n\nContoh: \`${m.prefix}ban 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (config.isOwner(targetNumber)) {
        return m.reply(`*❌ GAGAL*\n\nTidak dapat memblokir (ban) nomor Owner.`)
    }
    
    if (config.isBanned(targetNumber)) {
        return m.reply(`*❌ GAGAL*\n\nNomor \`${targetNumber}\` sudah masuk dalam daftar ban.`)
    }
    
    config.bannedUsers.push(targetNumber)
    
    const db = getDatabase()
    db.setting('bannedUsers', config.bannedUsers)
    
    m.react('🚫')
    
    await m.reply(
        `*🚫 USER BERHASIL DIBANNED*\n\n` +
        `Nomor: ${targetNumber}\n` +
        `Status: Banned (Terblokir)\n` +
        `Total Ban: ${config.bannedUsers.length} user\n\n` +
        `_Pengguna ini tidak akan bisa menggunakan fitur bot lagi._`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
