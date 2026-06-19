const { getParticipantJid, getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'tagall',
    alias: ['all', 'everyone'],
    category: 'group',
    description: 'Tag semua member grup',
    usage: '.tagall <pesan>',
    example: '.tagall Halo semua!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    const text = m.text || 'Pengumuman untuk semua member'

    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []

        if (participants.length === 0) {
            await m.reply(`*❌ GAGAL*\n\nTidak ada anggota yang dapat ditag di grup ini.`)
            return
        }

        const mentions = getParticipantJids(participants)
        const memberList = participants.map((p, i) => `${i + 1}. @${getParticipantJid(p).split('@')[0]}`).join('\n')

        await sock.sendMessage(m.chat, {
            text: `*📢 TAG ALL MEMBERS*\n\n` +
                `Pesan: ${text}\n\n` +
                `Total Anggota: ${participants.length}\n\n` +
                memberList,
            mentions
        }, { quoted: m })

    } catch (error) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat melakukan tag all: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
