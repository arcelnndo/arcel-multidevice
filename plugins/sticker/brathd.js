const axios = require('axios')

const pluginConfig = {
    name: 'brathd',
    alias: ['brathdsticker', 'brathds'],
    category: 'sticker',
    description: 'Membuat sticker brat HD',
    usage: '.brathd <text>',
    example: '.brathd hello world',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(`*🖼️ BRAT HD*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}brathd nando medek\``)
    }
    
    m.react('🖼️')
    
    try {
        const url = `https://api.nexray.web.id/maker/brathd?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        const buffer = Buffer.from(res.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
            author: m.pushName || 'ɴᴀɴᴅᴏ ᴅᴇᴠ'
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
