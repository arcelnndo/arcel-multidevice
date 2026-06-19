const config = require('../../config')

const pluginConfig = {
    name: ['block', 'blokir'],
    alias: [],
    category: 'owner',
    description: 'Blokir nomor WhatsApp',
    usage: '.block <nomor/reply/mention>',
    example: '.block 628xxx',
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
            '- `.block 628xxx` (Blokir via nomor)\n' +
            '- `.block` (Reply pesan untuk blokir pengirim)\n' +
            '- `.block @mention` (Blokir yang di-tag)\n' +
            '- `.block` (Di chat pribadi untuk blokir user tersebut)'
        )
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetJid === botJid) {
        return m.reply('*❌ GAGAL*\n\nBot tidak bisa memblokir nomornya sendiri.')
    }

    try {
        await sock.updateBlockStatus(targetJid, 'block')
        m.react('🚫')
        return m.reply(
            `*🚫 NOMOR BERHASIL DIBLOKIR*\n\n` +
            `Target: @${targetJid.split('@')[0]}\n\n` +
            `_Gunakan perintah \`.unblock\` jika ingin membuka blokir kembali._`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(`*❌ ERROR*\n\nGagal memblokir nomor: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
