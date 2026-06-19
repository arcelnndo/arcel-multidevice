const { getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'demote',
    alias: ['unadmin', 'turunkan'],
    category: 'group',
    description: 'Turunkan admin menjadi member biasa',
    usage: '.demote @user',
    example: '.demote @user',
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
            `Silakan reply pesan user atau mention orangnya langsung.\n` +
            `Contoh: \`${m.prefix}demote @user\``
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

        if (!participant.admin) {
            await m.reply(`*❌ GAGAL*\n\nUser tersebut memang bukan admin grup.`)
            return
        }

        if (participant.admin === 'superadmin') {
            await m.reply(`*❌ GAGAL*\n\nBot tidak memiliki izin untuk menurunkan jabatan Owner Grup (Superadmin).`)
            return
        }

        await sock.groupParticipantsUpdate(m.chat, [target], 'demote')

        await m.reply(
            `*✅ BERHASIL*\n\n` +
            `@${target.split('@')[0]} telah diturunkan jabatannya dan sekarang menjadi member biasa.`,
            { mentions: [target] }
        )

    } catch (error) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat memproses demote: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
