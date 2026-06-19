const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setgoodbye',
    alias: ['customgoodbye'],
    category: 'group',
    description: 'Set custom goodbye message',
    usage: '.setgoodbye <pesan>',
    example: '.setgoodbye Bye {user}, sampai jumpa lagi!',
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
            `*📝 SET GOODBYE MESSAGE*\n\n` +
            `Gunakan kata kunci di bawah untuk otomatisasi teks:\n` +
            `- \`{user}\` : Mention member yang keluar\n` +
            `- \`{group}\` : Nama grup\n` +
            `- \`{count}\` : Jumlah sisa member\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}setgoodbye Bye {user}, jangan lupa balik lagi ke {group}!\``
        )
    }
    
    db.setGroup(m.chat, { goodbyeMsg: text, goodbye: true, leave: true })
    db.save()
    
    m.react('✅')
    
    const preview = text
        .replace(/{user}/gi, `@User`)
        .replace(/{group}/gi, 'Nama Grup')
        .replace(/{count}/gi, '99')

    await m.reply(
        `*✅ BERHASIL DISET*\n\n` +
        `*Preview Pesan:*\n` +
        `${preview}\n\n` +
        `_Gunakan perintah ${m.prefix}resetgoodbye untuk kembali ke pengaturan awal._`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
