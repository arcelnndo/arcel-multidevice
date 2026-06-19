const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setwelcome',
    alias: ['customwelcome'],
    category: 'group',
    description: 'Set custom welcome message',
    usage: '.setwelcome <pesan>',
    example: '.setwelcome Halo {user}, selamat datang di {group}!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.fullArgs?.trim() || m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `*📝 SET WELCOME MESSAGE*\n\n` +
            `Gunakan kata kunci di bawah untuk otomatisasi teks:\n` +
            `- \`{user}\` : Mention member baru\n` +
            `- \`{group}\` : Nama grup\n` +
            `- \`{desc}\` : Deskripsi grup\n` +
            `- \`{count}\` : Jumlah total member\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}setwelcome Halo {user}, selamat bergabung di {group}! Semoga betah ya.\``
        )
    }
    
    db.setGroup(m.chat, { welcomeMsg: text, welcome: true })
    db.save()
    
    m.react('✅')
    
    const preview = text
        .replace(/{user}/gi, '@User')
        .replace(/{group}/gi, 'Nama Grup')
        .replace(/{desc}/gi, 'Deskripsi Grup')
        .replace(/{count}/gi, '100')

    await m.reply(
        `*✅ BERHASIL DISET*\n\n` +
        `*Preview Pesan:*\n` +
        `${preview}\n\n` +
        `_Gunakan perintah ${m.prefix}resetwelcome untuk kembali ke pengaturan awal._`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
