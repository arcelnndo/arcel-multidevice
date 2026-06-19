const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'onlyadmin',
    alias: ['selfadmin', 'publicadmin', 'adminonly'],
    category: 'owner',
    description: 'Hanya admin grup yang bisa akses command bot',
    usage: '.onlyadmin on/off',
    example: '.onlyadmin on',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    const cmd = m.command.toLowerCase()
    const current = db.setting('onlyAdmin') || false

    if (cmd === 'selfadmin') {
        if (current) {
            db.setting('onlyAdmin', false)
            m.react('❌')
            return m.reply('*❌ ONLYADMIN DINONAKTIFKAN*\n\nBot sekarang bisa diakses oleh semua orang kembali.')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '*✅ ONLYADMIN DIAKTIFKAN*\n\n' +
            '*Hak Akses:*\n' +
            '- Admin Grup: Aktif\n' +
            '- Owner Bot: Aktif\n' +
            '- Member Biasa: Terblokir\n\n' +
            `Gunakan perintah \`${m.prefix}onlyadmin off\` untuk menonaktifkan.`
        )
    }

    if (cmd === 'publicadmin') {
        if (current) {
            db.setting('onlyAdmin', false)
            m.react('❌')
            return m.reply('*❌ ONLYADMIN DINONAKTIFKAN*\n\nBot sekarang bisa diakses oleh semua orang kembali.')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '*✅ ONLYADMIN DIAKTIFKAN*\n\n' +
            '*Hak Akses:*\n' +
            '- Admin Grup: Aktif\n' +
            '- Owner Bot: Aktif\n' +
            '- Private Chat: Aktif (Semua)\n' +
            '- Member Biasa di Grup: Terblokir\n\n' +
            `Gunakan perintah \`${m.prefix}onlyadmin off\` untuk menonaktifkan.`
        )
    }

    if (!args || args === 'status') {
        return m.reply(
            `*🔒 ONLYADMIN SETTING*\n\n` +
            `Status Saat Ini: ${current ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
            `*Cara Pakai:*\n` +
            `- \`${m.prefix}onlyadmin on\` (Aktifkan)\n` +
            `- \`${m.prefix}onlyadmin off\` (Nonaktifkan)\n\n` +
            `_Catatan: Jika aktif, hanya admin grup, owner, dan user di private chat yang bisa menggunakan fitur bot._`
        )
    }

    if (args === 'on') {
        if (current) return m.reply('*⚠️ PERHATIAN*\n\nFitur OnlyAdmin sudah dalam keadaan aktif.')
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '*✅ ONLYADMIN DIAKTIFKAN*\n\n' +
            '*Hak Akses:*\n' +
            '- Admin Grup: Aktif\n' +
            '- Owner Bot: Aktif\n' +
            '- Private Chat: Aktif (Semua)\n' +
            '- Member Biasa di Grup: Terblokir'
        )
    }

    if (args === 'off') {
        if (!current) return m.reply('*⚠️ PERHATIAN*\n\nFitur OnlyAdmin sudah dalam keadaan nonaktif.')
        db.setting('onlyAdmin', false)
        m.react('❌')
        return m.reply('*❌ ONLYADMIN DINONAKTIFKAN*\n\nBot sekarang bisa diakses oleh semua orang kembali.')
    }

    return m.reply('*❌ GAGAL*\n\nArgumen tidak valid. Silakan gunakan opsi `on` atau `off`.')
}

module.exports = {
    config: pluginConfig,
    handler
}
