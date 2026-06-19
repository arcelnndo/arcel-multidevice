const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'rch',
    alias: ['frch', 'reactch', 'fakereactch', 'fakerch'],
    category: 'tools',
    description: 'Kirim react ke post channel WhatsApp',
    usage: '.rch <link_post> <emoji>',
    example: '.rch https://whatsapp.com/channel/xxx/123 😂😍',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `*⚠️ FORMAT SALAH!*\n\n` +
            `Alat ini digunakan untuk mengirim reaksi (react) ke post saluran/channel.\n\n` +
            `*Cara pakai:*\n` +
            `${m.prefix}rch <link_post> <emoji>\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂\n` +
            `${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂😱🔥`
        )
    }
    
    const link = args[0]
    const emoji = args.slice(1).join('')
    
    if (!link.includes('whatsapp.com/channel')) {
        return m.reply(`*❌ LINK TIDAK VALID*\n\nTautan harus berupa link post channel WhatsApp.`)
    }
    
    if (!emoji) {
        return m.reply(`*❌ EMOJI KOSONG*\n\nMasukkan emoji yang ingin digunakan untuk reaksi!`)
    }
    
    m.react('⏳')
    
    try {
        const url = `https://api-faa.my.id/faa/react-channel?url=${encodeURIComponent(link)}&react=${encodeURIComponent(emoji)}`
        
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (data?.status) {
            m.react('✅')
            
            const saluranId = '0'
            const saluranName = config.bot?.name || 'ARCELZAI'
            
            await sock.sendMessage(m.chat, {
                text: `*✅ REAKSI TERKIRIM*\n\n` +
                      `Target: ${data.info?.destination || link}\n` +
                      `Emoji: ${data.info?.reaction_used?.replace(/,/g, ' ') || emoji.replace(/,/g, ' ')}`,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }, { quoted: m })
            
        } else {
            throw new Error(data?.message || 'Gagal mengirim reaksi')
        }
    } catch (err) {
        m.react('❌')
        await m.reply(
            `*❌ GAGAL MENGIRIM REAKSI*\n\n` +
            `Limit RCH mungkin telah habis untuk hari ini, atau terjadi kesalahan pada API. Silakan coba lagi besok.\n\n` +
            `Error: ${err.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
