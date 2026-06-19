const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/zann')
const { default: axios } = require('axios')

const pluginConfig = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale gambar menjadi HD (V4)',
    usage: '.remini (reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(
            `*✨ REMINI ENHANCE*\n\n` +
            `Alat ini digunakan untuk meningkatkan resolusi dan kualitas gambar menjadi HD.\n\n` +
            `*Cara pakai:*\n` +
            `Kirim atau reply gambar dengan perintah \`${m.prefix}remini\``
        )
    }

    m.react('⏳')

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            m.react('❌')
            return m.reply(`*❌ GAGAL*\n\nGagal mengunduh gambar. Pastikan kamu mereply gambar yang valid.`)
        }
        
        await m.reply(`*⏳ Sedang memproses gambar menjadi HD...*`)

        const gmbr = await uploadToTmpFiles(buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        })
        
        const res = await axios.get(`https://api-faa.my.id/faa/hdv4?image=${encodeURIComponent(gmbr.directUrl)}`)
        const data = res.data.result

        const saluranId = '0'
        const saluranName = config.bot?.name || 'ARCELZAI'

        await sock.sendMessage(m.chat, {
            image: { url: data.image_upscaled },
            caption: `*✨ BERHASIL*\n\nGambar berhasil di-enhance menjadi HD.`,
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
