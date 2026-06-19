const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'rules',
    alias: ['aturanbot', 'botrules'],
    category: 'main',
    description: 'Menampilkan rules/aturan bot',
    usage: '.rules',
    example: '.rules',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const DEFAULT_BOT_RULES = `*ATURAN BOT*\n\n` +
    `Berikut adalah aturan penggunaan bot:\n` +
    `1. Jangan spam command.\n` +
    `2. Gunakan fitur dengan bijak.\n` +
    `3. Dilarang menyalahgunakan bot.\n` +
    `4. Hormati sesama pengguna.\n` +
    `5. Report bug ke owner.\n` +
    `6. Jangan request fitur yang tidak pantas.\n` +
    `7. Bot tidak beroperasi 24/7 (ada waktu maintenance).\n\n` +
    `Catatan: Pelanggaran dapat mengakibatkan nomor Anda dibanned dari sistem.`;

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const customRules = db.setting('botRules')
    const rulesText = customRules || DEFAULT_BOT_RULES

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin-rules.jpg')
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null

    const saluranId = botConfig.saluran?.id || '@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'

    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: rulesText,
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
        await m.reply(rulesText)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_BOT_RULES
}
