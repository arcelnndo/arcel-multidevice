const { stopJadibot, getAllJadibotSessions } = require('../../src/lib/jadibotManager')

const pluginConfig = {
    name: 'stopdandeletejadibot',
    alias: ['deletejadibot', 'removejadibot', 'hapusjadibot'],
    category: 'owner',
    description: 'Stop dan hapus session jadibot user secara permanen',
    usage: '.stopdandeletejadibot @user',
    example: '.stopdandeletejadibot @628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    } else if (m.text?.trim()) {
        const num = m.text.trim().replace(/[^0-9]/g, '')
        if (num) target = num + '@s.whatsapp.net'
    }

    if (!target) {
        const sessions = getAllJadibotSessions()

        if (sessions.length === 0) {
            return m.reply(`*❌ INFO*\n\nTidak ada sesi jadibot yang tersimpan di database.`)
        }

        let txt = `*🗑️ STOP & DELETE JADIBOT*\n\n`
        txt += `Silakan pilih target dengan cara mention atau reply pesannya:\n\n`

        sessions.forEach((s, i) => {
            const statusIcon = s.isActive ? '🟢' : '⚫'
            txt += `${statusIcon} ${i + 1}. @${s.id}\n`
        })

        txt += `\nContoh: \`${m.prefix}stopdandeletejadibot @628xxx\``

        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: sessions.map(s => s.jid)
        }, { quoted: m })
    }

    const id = target.replace(/@.+/g, '')
    const sessions = getAllJadibotSessions()
    const session = sessions.find(s => s.id === id)

    if (!session) {
        return m.reply(`*❌ GAGAL*\n\nSesi jadibot untuk nomor @${id} tidak ditemukan.`, { mentions: [target] })
    }

    m.react('⏳')

    try {
        // Parameter true biasanya digunakan untuk menghapus file session secara permanen
        await stopJadibot(target, true)

        m.react('✅')

        await sock.sendMessage(m.chat, {
            text: `*🗑️ SESI BERHASIL DIHAPUS*\n\n` +
                `Nomor: @${id}\n` +
                `Status: Dihapus Permanen\n\n` +
                `Sesi telah dibersihkan dari database dan server. User tersebut harus menggunakan perintah \`.jadibot\` lagi jika ingin mendaftar ulang.`,
            mentions: [target]
        }, { quoted: m })
    } catch (error) {
        m.react('❌')
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat menghapus sesi: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
