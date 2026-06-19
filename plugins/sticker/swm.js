/**
 * @file plugins/sticker/swm.js
 * @description Plugin untuk mengganti packname dan author pada sticker
 */

const config = require('../../config')

const pluginConfig = {
    name: 'swm',
    alias: ['wm', 'stickerwm', 'stickermark', 'colong'],
    category: 'sticker',
    description: 'Mengganti packname dan author pada sticker',
    usage: '.swm <packname>|<author>',
    example: '.swm ARCELZAI|Nando Dev',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `*🖼️ STICKER WATERMARK*\n\n` +
            `Alat ini digunakan untuk mengubah packname dan author (watermark) pada stiker.\n\n` +
            `*Cara pakai:*\n` +
            `Reply stiker dengan perintah:\n` +
            `${m.prefix}swm packname|author\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}swm ARCELZAI|Nando Dev\n` +
            `${m.prefix}swm PackKu Saja\n` +
            `${m.prefix}swm |Pembuat Stiker`
        )
    }
    
    const isSticker = quoted.type === 'stickerMessage' || quoted.isSticker
    if (!isSticker) {
        return m.reply(`*❌ GAGAL*\n\nHarap reply pesan stiker, bukan ${quoted.type?.replace('Message', '') || 'media lain'}.`)
    }
    
    const input = m.text?.trim()
    if (!input) {
        return m.reply(
            `*❌ GAGAL*\n\n` +
            `Masukkan packname dan/atau author.\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}swm ARCELZAI|Nando Dev\n` +
            `${m.prefix}swm MyPack`
        )
    }
    
    let packname, author
    
    if (input.includes('|')) {
        const parts = input.split('|')
        packname = parts[0]?.trim() || botConfig.sticker?.packname || botConfig.bot?.name || 'ARCELZ MULTI DEVICE'
        author = parts[1]?.trim() || botConfig.sticker?.author || botConfig.owner?.name || 'Nando Dev'
    } else {
        packname = input
    }
    
    if (packname.length > 50) {
        return m.reply(`*❌ GAGAL*\n\nPackname terlalu panjang (maksimal 50 karakter).`)
    }
    
    if (author?.length > 50) {
        return m.reply(`*❌ GAGAL*\n\nAuthor terlalu panjang (maksimal 50 karakter).`)
    }
    
    m.react('⏳')
    
    try {
        const buffer = await quoted.download()
        
        if (!buffer || buffer.length === 0) {
            m.react('❌')
            return m.reply(`*❌ GAGAL*\n\nGagal mengunduh stiker.`)
        }
        
        const isAnimated = quoted.msg?.isAnimated || false
        
        if (isAnimated) {
            await sock.sendVideoAsSticker(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        } else {
            await sock.sendImageAsSticker(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        }
        
        m.react('✅')
        
    } catch (error) {
        console.error('[SWM] Error:', error.message)
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
