const config = require('../../config')

const pluginConfig = {
    name: ['unblock', 'unblocknomor'],
    alias: [],
    category: 'owner',
    description: 'Buka blokir nomor WhatsApp',
    usage: '.unblock <nomor/reply/mention>',
    example: '.unblock 628xxx',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetJid = null

    if (m.mentionedJid?.length > 0) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted) {
        targetJid = m.quoted.sender || m.quoted.participant
    } else if (m.args[0]) {
        let num = m.args[0].replace(/[^0-9]/g, '')
        if (!num) return m.reply('*❌ GAGAL*\n\nNomor yang dimasukkan tidak valid.')
        targetJid = num + '@s.whatsapp.net'
    } else if (!m.isGroup) {
        targetJid = m.chat
    }

    if (!targetJid) {
        return m.reply(
            '*⚠️ CARA PAKAI*\n\n' +
            '- `.unblock 628xxx` (Unblock via nomor)\n' +
            '- `.unblock` (Reply pesan untuk unblock pengirim)\n' +
            '- `.unblock @mention` (Unblock yang di-tag)\n' +
            '- `.unblock` (Di chat pribadi untuk unblock user tersebut)'
        )
    }

    try {
        await sock.updateBlockStatus(targetJid, 'unblock')
        m.react('✅')
        return m.reply(
            `*✅ NOMOR BERHASIL DI-UNBLOCK*\n\n` +
            `Target: @${targetJid.split('@')[0]}\n\n` +
            `_Sekarang nomor tersebut sudah bisa berinteraksi kembali dengan bot._`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(`*❌ ERROR*\n\nGagal membuka blokir nomor: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
