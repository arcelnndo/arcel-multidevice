const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'aktifaudiomenu',
    alias: ['audiomenu', 'setaudiomenu', 'toggleaudiomenu'],
    category: 'owner',
    description: 'Toggle audio saat menampilkan menu',
    usage: '.aktifaudiomenu ya/gak',
    example: '.aktifaudiomenu ya',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const option = args[0]?.toLowerCase()

    const current = db.setting('audioMenu') !== false

    if (!option) {
        return m.reply(
            `*🔊 AUDIO MENU SETTING*\n\n` +
            `Status saat ini: ${current ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
            `*Cara pakai:*\n` +
            `- \`${m.prefix}aktifaudiomenu ya\` (Untuk mengaktifkan)\n` +
            `- \`${m.prefix}aktifaudiomenu gak\` (Untuk menonaktifkan)`
        )
    }

    if (option === 'ya' || option === 'on' || option === '1' || option === 'aktif') {
        if (current) {
            return m.reply(`*⚠️ PERHATIAN*\n\nAudio menu sudah dalam keadaan aktif!`)
        }
        db.setting('audioMenu', true)
        await db.save()
        m.react('✅')
        return m.reply(`*✅ BERHASIL*\n\nAudio menu telah diaktifkan.\nSekarang ketika ada yang mengetik \`.menu\`, pesan audio akan ikut terkirim.`)
    }

    if (option === 'gak' || option === 'off' || option === '0' || option === 'nonaktif') {
        if (!current) {
            return m.reply(`*⚠️ PERHATIAN*\n\nAudio menu sudah dalam keadaan nonaktif!`)
        }
        db.setting('audioMenu', false)
        await db.save()
        m.react('✅')
        return m.reply(`*✅ BERHASIL*\n\nAudio menu telah dinonaktifkan.\nSekarang perintah \`.menu\` akan dikirim tanpa menyertakan pesan audio.`)
    }

    return m.reply(`*❌ GAGAL*\n\nOpsi tidak valid! Silakan gunakan \`ya\` atau \`gak\`.`)
}

module.exports = {
    config: pluginConfig,
    handler
}
