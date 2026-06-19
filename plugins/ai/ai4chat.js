const axios = require('axios')

const pluginConfig = {
    name: 'ai4chat',
    alias: ['ai'],
    category: 'ai',
    description: 'Chat dengan AI4Chat',
    usage: '.ai4chat <pertanyaan>',
    example: '.ai4chat Apa itu JavaScript?',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`🤖 *ᴀɪᴄʜᴀᴛ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}ai4chat Apa itu JavaScript?\``)
    }
    
    m.react('🤖')
    
    try {
        const url = `https://zelapioffciall.koyeb.app/ai/glm?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        m.react('✅')
        await m.reply(`🤖 \`\`\`${data.result.response}\`\`\``)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
