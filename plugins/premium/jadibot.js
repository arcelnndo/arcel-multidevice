const { startJadibot, isJadibotActive } = require('../../src/lib/jadibotManager')
const config = require('../../config')
const fs = require('fs')

const pluginConfig = {
    name: 'jadibot',
    alias: ['jbot', 'rentbot'],
    category: 'premium',
    description: 'Jadikan nomor kamu sebagai bot sementara',
    usage: '.jadibot',
    example: '.jadibot',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const userJid = m.sender

    if (isJadibotActive(userJid)) {
        return sock.sendMessage(m.chat, {
            text: `*⚠️ JADIBOT SUDAH AKTIF*\n\n` +
                `Bot kamu saat ini sudah berjalan.\n\n` +
                `Ketik \`${m.prefix}stopjadibot\` untuk menghentikannya.`,
            interactiveButtons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🛑 Stop Jadibot',
                        id: `${m.prefix}stopjadibot`
                    })
                }
            ]
        }, { quoted: m })
    }

    let thumbnail = null
    try {
        if (fs.existsSync('./assets/images/ourin2.jpg')) {
            thumbnail = fs.readFileSync('./assets/images/ourin2.jpg')
        }
    } catch {}

    await sock.sendMessage(m.chat, {
        text: `*🤖 JADIBOT*\n\n` +
            `Sedang mempersiapkan pairing code...\n\n` +
            `- ⏳ Tunggu beberapa detik.\n` +
            `- 📱 Kode akan muncul untuk ditautkan ke WhatsApp kamu.\n\n` +
            `*⚠️ PERINGATAN:*\n` +
            `- Bot sementara akan expired jika bot utama direstart.\n` +
            `- JANGAN bagikan pairing code ini ke siapapun!`,
        contextInfo: {
            externalAdReply: {
                title: '🤖 Jadibot — Loading',
                body: 'Mempersiapkan pairing code...',
                ...(thumbnail ? { thumbnail } : {}),
                sourceUrl: null,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })

    m.react('⏳')

    try {
        const result = await startJadibot(sock, m, userJid, true)
        if (result.pairingCode) {
            m.react('✅')
        }
    } catch (error) {
        m.react('❌')
        await m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
