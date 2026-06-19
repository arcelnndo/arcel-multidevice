const config = require('../../config')

const pluginConfig = {
    name: 'totag',
    alias: ['tagall2', 'mentionall'],
    category: 'group',
    description: 'Tag semua member dengan reply pesan',
    usage: '.totag (reply pesan)',
    example: '.totag',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply(
            `*📢 INFORMASI TOTAG*\n\n` +
            `Silakan reply pesan (teks/media) yang ingin diteruskan ke semua anggota grup.\n\n` +
            `Cara pakai: Reply pesan lalu ketik \`${m.prefix}totag\``
        )
    }
    
    m.react('📢')
    
    try {
        const participants = m.groupMembers || []
        
        if (!participants || participants.length === 0) {
            return m.reply(`*❌ GAGAL*\n\nBot tidak dapat menemukan data anggota di dalam grup ini.`)
        }
        
        const users = participants
            .map(u => u.id || u.jid || u)
            .filter(v => v && v !== sock.user?.jid && v !== sock.user?.id)
        
        await sock.sendMessage(m.chat, {
            forward: m.quoted.fakeObj || m.quoted,
            mentions: users
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat memproses totag: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
