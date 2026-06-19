const { getAllJadibotSessions, getActiveJadibots } = require('../../src/lib/jadibotManager')

const pluginConfig = {
    name: 'listjadibot',
    alias: ['jadibotlist', 'alljadibot'],
    category: 'owner',
    description: 'Lihat semua session jadibot yang tersimpan',
    usage: '.listjadibot',
    example: '.listjadibot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const sessions = getAllJadibotSessions()
    const active = getActiveJadibots()

    if (sessions.length === 0) {
        return m.reply(`*❌ INFO*\n\nTidak ada sesi jadibot yang tersimpan di database.`)
    }

    let txt = `*🤖 DAFTAR SESI JADIBOT*\n\n`
    txt += `Total Sesi: ${sessions.length}\n`
    txt += `Status Online: 🟢 ${active.length}\n`
    txt += `Status Offline: ⚫ ${sessions.length - active.length}\n\n`

    sessions.forEach((s, i) => {
        const statusIcon = s.isActive ? '🟢' : '⚫'
        const label = s.isActive ? 'Online' : 'Offline'
        txt += `${statusIcon} ${i + 1}. @${s.id} (${label})\n`
    })

    txt += `\n*Perintah Lain:*\n` +
           `- \`${m.prefix}listjadibotaktif\` (Detail yang aktif)\n` +
           `- \`${m.prefix}stopalljadibot\` (Hentikan semua)\n` +
           `- \`${m.prefix}stopdandeletejadibot @user\` (Hapus sesi)`

    const mentions = sessions.map(s => s.jid)

    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🟢 Lihat Aktif',
                    id: `${m.prefix}listjadibotaktif`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🛑 Stop Semua',
                    id: `${m.prefix}stopalljadibot`
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
