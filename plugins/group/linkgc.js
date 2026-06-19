const config = require('../../config')

const pluginConfig = {
    name: 'linkgc',
    alias: ['linkgrup', 'getlink', 'gclink'],
    category: 'group',
    description: 'Dapatkan link invite grup',
    usage: '.linkgc',
    example: '.linkgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🔗')
    
    try {
        const code = await sock.groupInviteCode(m.chat)
        const urlGrup = `https://chat.whatsapp.com/${code}`
        
        await sock.sendMessage(m.chat, {
            text: `*🔗 LINK INVITE GRUP*\n\n${urlGrup}`,
            contextInfo: {
                externalAdReply: null // Pastikan ad reply mati
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nGagal mengambil link grup. Pastikan bot adalah admin.\nDetail: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
