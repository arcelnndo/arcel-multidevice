const config = require('../../config')
const { reelsvideo } = require('../../src/scraper/reelsvideo')

const pluginConfig = {
    name: 'instagramdl',
    alias: ['igdl', 'ig', 'instagram'],
    category: 'download',
    description: 'Download video/foto Instagram',
    usage: '.instagramdl <url>',
    example: '.instagramdl https://www.instagram.com/reel/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const IG_REGEX = /instagram\.com\/(p|reel|reels|stories|tv)\//i

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> \`${m.prefix}igdl <url>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/reel/xxx\`\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/p/xxx\``
        )
    }

    if (!IG_REGEX.test(url)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Instagram (reel/post/story).`)
    }

    await m.react('⏳')

    try {
        const result = await reelsvideo(url)

        if (result.type === 'unknown' || (!result.videos.length && !result.images.length)) {
            await m.react('❌')
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`)
        }

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        const ctxInfo = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }

        const typeLabel = {
            video: '🎬 Video',
            photo: '🖼️ Foto',
            carousel: '📸 Carousel'
        }

        const caption =
            `✅ *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> ${typeLabel[result.type] || '📦 Media'}` +
            (result.username ? `\n> 👤 @${result.username}` : '')

        if (result.type === 'video') {
            // await sock.sendMessage(m.chat, {
            //     video: { url: result.videos[0] },
            //     caption,
            //     contextInfo: ctxInfo
            // }, { quoted: m })
            await sock.sendMessage(
    m.chat, 
    { 
        albumMessage: result.videos.map(url => ({
            video: { url },
            caption
        })),
        contextInfo: ctxInfo
    }, { quoted: m })
        } else if (result.type === 'photo') {
        await sock.sendMessage(
    m.chat, 
    { 
        albumMessage: result.images.map(url => ({
            image: { url },
            caption
        })),
        contextInfo: ctxInfo
    }, { quoted: m })
        } else {
            await sock.sendMessage(
    m.chat, 
    { 
        albumMessage: result.videos.map(url => ({
            video: { url },
            caption
        })),
        contextInfo: ctxInfo
    }, { quoted: m })
            await sock.sendMessage(
    m.chat, 
    { 
        albumMessage: result.images.map(url => ({
            image: { url },
            caption
        })),
        contextInfo: ctxInfo
    }, { quoted: m })
        }

        await m.react('✅')
    } catch (err) {
        await m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
