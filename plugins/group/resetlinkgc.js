const pluginConfig = {
    name: 'resetlinkgc',
    alias: ['resetlink', 'revokelink', 'newlink'],
    category: 'group',
    description: 'Reset link invite grup',
    usage: '.resetlinkgc',
    example: '.resetlinkgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🔄')
    
    try {
        await sock.groupRevokeInvite(m.chat)
        
        m.react('✅')
        m.reply(
            `*✅ LINK BERHASIL DIRESET*\n\n` +
            `Tautan undangan lama telah ditarik dan tidak dapat digunakan lagi. Silakan gunakan perintah \`${m.prefix}linkgc\` untuk mendapatkan tautan undangan yang baru.`
        )
        
    } catch (err) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nGagal mereset tautan grup. Pastikan bot masih menjabat sebagai admin.\nDetail: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
