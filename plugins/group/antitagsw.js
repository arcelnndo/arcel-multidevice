const pluginConfig = {
    name: 'antitagsw',
    alias: ['antitag', 'antistatustag'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti tag status di grup',
    usage: '.antitagsw <on/off>',
    example: '.antitagsw on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}

    if (!action) {
        const status = group.antitagsw || 'off'

        await m.reply(
            `*📢 ANTI TAG STATUS SETTING*\n\n` +
            `Status Saat Ini: ${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
            `Fitur ini akan otomatis menghapus pesan yang menggunakan fitur tag status (groupStatusMentionMessage) di dalam grup ini.\n\n` +
            `*Pilihan:* \n` +
            `- \`${m.prefix}antitagsw on\` (Aktifkan)\n` +
            `- \`${m.prefix}antitagsw off\` (Nonaktifkan)`
        )
        return
    }

    if (action === 'on') {
        db.setGroup(groupId, { ...group, antitagsw: 'on' })
        await m.reply(
            `*✅ ANTI TAG STATUS DIAKTIFKAN*\n\n` +
            `Fitur anti tag status berhasil dinyalakan. Setiap pesan tag status yang terdeteksi akan dihapus secara otomatis oleh bot.`
        )
        return
    }

    if (action === 'off') {
        db.setGroup(groupId, { ...group, antitagsw: 'off' })
        await m.reply(
            `*❌ ANTI TAG STATUS DINONAKTIFKAN*\n\n` +
            `Fitur anti tag status berhasil dimatikan. Bot tidak akan lagi menghapus pesan tag status.`
        )
        return
    }

    await m.reply(
        `*❌ GAGAL*\n\n` +
        `Pilihan tidak valid. Silakan gunakan argumen \`on\` atau \`off\`.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
