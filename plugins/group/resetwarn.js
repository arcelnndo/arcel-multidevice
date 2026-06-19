const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'resetwarn',
    alias: ['clearwarn', 'hapuswarn', 'delwarn'],
    category: 'group',
    description: 'Reset warning member',
    usage: '.resetwarn @user',
    example: '.resetwarn @user',
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
            `- Reply pesan user lalu ketik \`${m.prefix}resetwarn\`\n` +
            `- Atau ketik langsung: \`${m.prefix}resetwarn @user\``
        )
        return
    }
    
    let groupData = db.getGroup(m.chat) || {}
    let warnings = groupData.warnings || {}
    
    const targetName = targetUser.split('@')[0]
    
    if (!warnings[targetUser] || warnings[targetUser].length === 0) {
        await m.reply(`*✅ INFO*\n\n@${targetName} saat ini tidak memiliki catatan pelanggaran (warning).`, { mentions: [targetUser] })
        return
    }
    
    const prevCount = warnings[targetUser].length
    delete warnings[targetUser]
    db.setGroup(m.chat, { ...groupData, warnings: warnings })
    
    await m.reply(
        `*✅ WARNING BERHASIL DIRESET*\n\n` +
        `Seluruh catatan pelanggaran untuk @${targetName} telah dihapus.\n\n` +
        `Sebelumnya: ${prevCount}/3\n` +
        `Sekarang: 0/3`,
        { mentions: [targetUser] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
