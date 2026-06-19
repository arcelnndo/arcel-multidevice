const config = require('../../config')

const pluginConfig = {
    name: 'listban',
    alias: ['listbanned', 'banlist'],
    category: 'owner',
    description: 'Melihat daftar banned user',
    usage: '.listban',
    example: '.listban',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const bannedUsers = config.bannedUsers || []
    
    if (bannedUsers.length === 0) {
        return m.reply(`*🚫 DAFTAR BAN KOSONG*\n\nTidak ada pengguna yang terdaftar dalam daftar blokir saat ini.\n\nGunakan perintah: \`${m.prefix}ban <nomor>\` untuk memblokir user.`)
    }
    
    let caption = `*🚫 DAFTAR USER TERBLOKIR (BAN)*\n\n`
    
    for (let i = 0; i < bannedUsers.length; i++) {
        caption += `${i + 1}. ${bannedUsers[i]}\n`
    }
    
    caption += `\nTotal Terblokir: ${bannedUsers.length} user\n\n`
    caption += `_Gunakan perintah \`.unban <nomor>\` untuk membuka blokir._`
    
    await m.reply(caption)
}

module.exports = {
    config: pluginConfig,
    handler
}
