const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-ARCELZAI'

const pluginConfig = {
    name: 'emojitoimage',
    alias: ['emoji2img', 'emojiimg', 'e2i'],
    category: 'tools',
    description: 'Konversi emoji ke gambar HD (style Apple)',
    usage: '.emojitoimage <emoji> [style]',
    example: '.emojitoimage 😳 apple',
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const STYLES = ['apple', 'google', 'microsoft', 'samsung', 'whatsapp', 'twitter', 'facebook']

let thumbTools = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-tools.jpg')
    if (fs.existsSync(p)) thumbTools = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    // Di-nol-kan sesuai permintaan
    const saluranId = '0' 
    const saluranName = config.bot?.name || 'ARCELZAI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbTools) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbTools,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function handler(m, { sock }) {
    const args = m.args || []
    const emoji = args[0]?.trim()
    const style = args[1]?.toLowerCase() || 'apple'
    
    if (!emoji) {
        return m.reply(
            `*🖼️ EMOJI TO IMAGE*\n\n` +
            `Alat ini digunakan untuk mengonversi emoji menjadi gambar HD.\n\n` +
            `*Format:*\n` +
            `${m.prefix}emojitoimage <emoji> [style]\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}emojitoimage 😳 apple\n\n` +
            `*Style tersedia:*\n` +
            `${STYLES.join(', ')}`
        )
    }
    
    const validStyle = STYLES.includes(style) ? style : 'apple'
    
    m.react('🖼️')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/emoimg?q=${encodeURIComponent(emoji)}&style=${validStyle}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 15000 })
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('*❌ GAGAL*\n\nEmoji tidak ditemukan atau sistem API sedang error.')
        }
        
        const imgUrl = data.data.url
        
        await sock.sendMessage(m.chat, {
            image: { url: imgUrl },
            caption: `*🖼️ EMOJI TO IMAGE*\n\n` +
                `Emoji: ${emoji}\n` +
                `Style: ${validStyle}\n` +
                `Code: ${data.data.code || '-'}`,
            contextInfo: getContextInfo('🖼️ EMOJI IMAGE', `${emoji} - ${validStyle}`)
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
