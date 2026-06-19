const config = require('../../config')

const pluginConfig = {
    name: 'tqto',
    alias: ['thanksto', 'credits', 'kredit'],
    category: 'main',
    description: 'Menampilkan informasi pembuat bot',
    usage: '.tqto',
    example: '.tqto',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
    const developer = 'ɴᴀɴᴅᴏ ᴅᴇᴠ'
    
    let txt = `*THANKS TO*\n\n`
    txt += `Terima kasih telah menggunakan layanan kami!\n\n`
    
    txt += `- Bot: ${botName}\n`
    txt += `- Pembuat: ${developer}\n\n`
    
    txt += `Serta terima kasih kepada seluruh pengguna yang selalu mendukung perkembangan bot ini.`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
