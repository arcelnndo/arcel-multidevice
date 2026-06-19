const fs = require('fs')
const path = require('path')
const { mconverter } = require('../../src/scraper/mconverter')
const { downloadContentFromMessage } = require('ourin')
const config = require('../../config')

const pluginConfig = {
    name: 'converter',
    alias: ['convert', 'konversi'],
    category: 'tools',
    description: 'Convert file ke format lain',
    usage: '.converter <format> (reply file)',
    example: '.converter mp3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

async function handler(m, { sock }) {
    const targetFormat = m.text?.trim()?.toLowerCase()
    
    if (!m.quoted && !m.isMedia) {
        return m.reply(
            `*🔄 FILE CONVERTER*\n\n` +
            `Alat ini digunakan untuk mengonversi format file.\n\n` +
            `*Cara pakai:*\n` +
            `1. Reply pesan yang berisi file/media.\n` +
            `2. Ketik \`${m.prefix}converter <format_tujuan>\`\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}converter mp3\`\n` +
            `\`${m.prefix}converter mp4\`\n` +
            `\`${m.prefix}converter png\``
        )
    }
    
    if (!targetFormat) {
        return m.reply(`*❌ FORMAT KOSONG*\n\nMasukkan format tujuan!\nContoh: \`${m.prefix}converter mp3\``)
    }
    
    const quoted = m.quoted
    let mediaMessage = null
    let filename = 'file'
    
    if (quoted?.isMedia) {
        mediaMessage = quoted
        filename = quoted.message?.[quoted.type]?.fileName || `file_${Date.now()}`
    } else if (m.isMedia) {
        mediaMessage = m
        filename = m.message?.[m.type]?.fileName || `file_${Date.now()}`
    }
    
    if (!mediaMessage) {
        return m.reply(`*❌ GAGAL*\n\nHarap reply media atau file yang ingin diconvert!`)
    }
    
    m.react('⏳')
    await m.reply(`*⏳ Sedang mengunduh file...*`)
    
    try {
        const stream = await downloadContentFromMessage(
            mediaMessage.message[mediaMessage.type],
            mediaMessage.type.replace('Message', '')
        )
        
        const chunks = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const ext = filename.split('.').pop() || 'bin'
        const tempFile = path.join(tempDir, `convert_${Date.now()}.${ext}`)
        fs.writeFileSync(tempFile, buffer)
        
        await m.reply(`*🔄 Sedang Mengonversi*\n\nFormat: ${ext} ➞ ${targetFormat}`)
        
        const result = await mconverter.convert(tempFile, targetFormat)
        
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile)
        }
        
        if (result.error) {
            m.react('❌')
            return m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan dari API: ${result.error}`)
        }
        
        const saluranId = config.saluran?.id || '@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'ARCELZAI'
        
        await sock.sendMessage(m.chat, {
            document: { url: result.url },
            fileName: `converted_${Date.now()}.${targetFormat}`,
            mimetype: `application/${targetFormat}`,
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
        
    } catch (err) {
        console.error('[Converter] Error:', err.message)
        m.react('❌')
        return m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan pada sistem: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
