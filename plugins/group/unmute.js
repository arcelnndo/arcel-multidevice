const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'unmute',
    alias: ['unbisukan'],
    category: 'group',
    description: 'Membatalkan bisu member (Global)',
    usage: '.unmute @user',
    example: '.unmute @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `*⚠️ CARA PENGGUNAAN*\n\n` +
            `- Reply pesan user lalu ketik \`${m.prefix}unmute\`\n` +
            `- Atau ketik langsung: \`${m.prefix}unmute @user\``
        )
        return
    }
    
    // Mengambil data mute global (sesuai perubahan di plugin mute tadi)
    let globalMuted = db.setting('globalMutedUsers') || {}
    const targetName = targetUser.split('@')[0]
    
    if (!globalMuted[targetUser]) {
        await m.reply(`*✅ INFO*\n\n@${targetName} saat ini tidak dalam status dibisukan (mute).`, { mentions: [targetUser] })
        return
    }
    
    // Hapus dari database global
    delete globalMuted[targetUser]
    db.setting('globalMutedUsers', globalMuted)
    
    await m.reply(
        `*🔊 STATUS BISU DICABUT*\n\n` +
        `Berhasil membatalkan status mute untuk @${targetName}. Sekarang user tersebut sudah bisa mengirim pesan kembali di semua grup.`,
        { mentions: [targetUser] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
