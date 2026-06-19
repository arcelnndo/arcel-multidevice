const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'resetgoodbye',
    alias: ['delgoodbye', 'cleargoodbye'],
    category: 'group',
    description: 'Reset goodbye message ke default',
    usage: '.resetgoodbye',
    example: '.resetgoodbye',
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
    const groupData = db.getGroup(m.chat)
    
    if (!groupData?.goodbyeMsg) {
        return m.reply(`*❌ INFO*\n\nPesan goodbye di grup ini memang sudah menggunakan pengaturan default.`)
    }
    
    db.setGroup(m.chat, { goodbyeMsg: null })
    
    m.react('✅')
    
    await m.reply(`*✅ BERHASIL DIRESET*\n\nPesan goodbye telah dikembalikan ke pengaturan awal (default).`)
}

module.exports = {
    config: pluginConfig,
    handler
}
