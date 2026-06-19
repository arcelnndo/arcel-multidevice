const { getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'promote',
    alias: ['jadiadmin', 'admin'],
    category: 'group',
    description: 'Jadikan member sebagai admin',
    usage: '.promote @user',
    example: '.promote @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        await m.reply(
            `*❌ TARGET TIDAK DITEMUKAN*\n\n` +
            `Silakan reply pesan user atau mention orang yang ingin dijadikan admin.\n` +
            `Contoh: \`${m.prefix}promote @user\``
        )
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === target)

        if (!participant) {
            await m.reply(`*❌ GAGAL*\n\nUser tersebut tidak ditemukan di dalam grup ini.`)
            return
        }

        if (participant.admin) {
            await m.reply(`*❌ GAGAL*\n\nUser tersebut sudah menjabat sebagai admin sebelumnya.`)
            return
        }

        await sock.groupParticipantsUpdate(m.chat, [target], 'promote')

        await m.reply(
            `*✅ BERHASIL*\n\n` +
            `@${target.split('@')[0]} sekarang telah resmi menjadi admin grup ini.`,
            { mentions: [target] }
        )

    } catch (error) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat memproses promote: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
