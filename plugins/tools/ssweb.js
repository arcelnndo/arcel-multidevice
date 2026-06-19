const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ssweb',
    alias: ['screenshot', 'ss', 'webss'],
    category: 'tools',
    description: 'Screenshot website',
    usage: '.ssweb <url>',
    example: '.ssweb https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function screenshotWeb(url, options = {}) {
    const { width = 1280, height = 720, fullPage = false, scale = 1 } = options
    
    const { data } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
        url: url,
        browserWidth: parseInt(width),
        browserHeight: parseInt(height),
        fullPage: fullPage,
        deviceScaleFactor: parseInt(scale),
        format: 'png'
    }, {
        headers: {
            'content-type': 'application/json',
            referer: 'https://imagy.app/full-page-screenshot-taker/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    })
    
    return data.fileUrl
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `*📸 SCREENSHOT WEB*\n\n` +
            `Alat ini digunakan untuk mengambil screenshot dari sebuah halaman website.\n\n` +
            `*Contoh penggunaan:*\n` +
            `${m.prefix}ssweb https://google.com\n\n` +
            `Gunakan \`--full\` untuk mengambil screenshot satu halaman penuh:\n` +
            `${m.prefix}ssweb https://github.com --full`
        )
    }
    
    let fullPage = false
    if (text.includes('--full')) {
        fullPage = true
        text = text.replace('--full', '').trim()
    }
    
    if (!text.startsWith('http')) {
        text = 'https://' + text
    }
    
    await m.react('⏳')
    await m.reply(config.messages?.wait || '*⏳ Sedang mengambil screenshot...*')
    
    try {
        const imageUrl = await screenshotWeb(text, { fullPage })
        
        const saluranId = '0'
        const saluranName = config.bot?.name || 'ARCELZAI'
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `*📸 HASIL SCREENSHOT*\n\nURL: ${text}\nFull Page: ${fullPage ? 'Ya' : 'Tidak'}`,
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
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
