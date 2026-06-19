const { stopJadibot, isJadibotActive, jadibotSessions, safeSend } = require('../../src/lib/jadibotManager')

const pluginConfig = {
    name: 'stopjadibot',
    alias: ['stopjbot', 'endjadibot'],
    category: 'premium',
    description: 'Hentikan jadibot kamu',
    usage: '.stopjadibot',
    example: '.stopjadibot',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
}

async function handler(m, { sock }) {
    const userJid = m.sender
    const id = userJid.replace(/@.+/g, '')

    if (!isJadibotActive(userJid)) {
        return sock.sendMessage(m.chat, {
            text: `*❌ TIDAK ADA JADIBOT AKTIF*\n\n` +
                `Kamu belum memiliki sesi jadibot yang berjalan saat ini.\n\n` +
                `Ketik \`${m.prefix}jadibot\` untuk memulai.`,
            interactiveButtons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🤖 Mulai Jadibot',
                        id: `${m.prefix}jadibot`
                    })
                }
            ]
        }, { quoted: m })
    }

    const session = jadibotSessions.get(id)
    if (session && session.ownerJid !== m.sender && !m.isOwner) {
        return m.reply(`*❌ GAGAL*\n\nKamu tidak memiliki akses untuk menghentikan jadibot milik orang lain.`)
    }

    const uptime = session ? formatUptime(Date.now() - session.startedAt) : '-'

    m.react('⏳')

    try {
        await stopJadibot(userJid, false)

        m.react('✅')
        await safeSend(sock, m.chat, {
            text: `*🛑 JADIBOT DIHENTIKAN*\n\n` +
                `Nomor: @${id}\n` +
                `Uptime: ${uptime}\n` +
                `Status: Sesi Disimpan\n\n` +
                `Sesi jadibot kamu telah dihentikan dan disimpan. Kamu bisa mengaktifkannya kembali kapan saja.`,
            mentions: [userJid],
            interactiveButtons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🔄 Aktifkan Lagi',
                        id: `${m.prefix}jadibot`
                    })
                }
            ]
        }, { quoted: m })
    } catch (error) {
        m.react('❌')
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
