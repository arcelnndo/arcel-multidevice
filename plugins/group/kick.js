const { findParticipantByNumber } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'kick',
    alias: ['remove', 'tendang'],
    category: 'group',
    description: 'Kick member dari grup',
    usage: '.kick @user',
    example: '.kick @user',
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
    let targetJid = null

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid) {
        await m.reply(
            `*❌ TARGET TIDAK DITEMUKAN*\n\n` +
            `Silakan reply pesan user atau mention orang yang ingin dikeluarkan.\n` +
            `Contoh: \`${m.prefix}kick @user\``
        )
        return
    }

    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetNumber = targetJid.replace(/@.*$/, '')

    if (targetJid === botNumber || targetNumber === botNumber.replace(/@.*$/, '')) {
        await m.reply(`*❌ GAGAL*\n\nBot tidak bisa mengeluarkan dirinya sendiri dari grup.`)
        return
    }

    if (targetJid === m.sender) {
        await m.reply(`*❌ GAGAL*\n\nAnda tidak bisa mengeluarkan diri sendiri. Gunakan fitur keluar grup jika diperlukan.`)
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const targetParticipant = findParticipantByNumber(groupMeta.participants, targetJid)
        
        if (!targetParticipant) {
            await m.reply(`*❌ GAGAL*\n\nPengguna tersebut tidak ditemukan di dalam grup ini.`)
            return
        }
        
        if (targetParticipant.admin) {
            await m.reply(`*❌ GAGAL*\n\nBot tidak bisa mengeluarkan Admin grup. Silakan demote terlebih dahulu jika ingin mengeluarkannya.`)
            return
        }
        
        await sock.groupParticipantsUpdate(m.chat, [targetParticipant.id], 'remove')

        await m.reply(
            `*✅ BERHASIL*\n\n` +
            `@${targetNumber} telah berhasil dikeluarkan dari grup.`,
            { mentions: [targetJid] }
        )

    } catch (error) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat memproses pengeluaran member: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
