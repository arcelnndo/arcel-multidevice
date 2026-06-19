const { stopAllJadibots, getActiveJadibots } = require('../../src/lib/jadibotManager')

const pluginConfig = {
    name: 'stopalljadibot',
    alias: ['stopsemuajadibot', 'killalljadibots'],
    category: 'owner',
    description: 'Hentikan semua jadibot yang aktif',
    usage: '.stopalljadibot',
    example: '.stopalljadibot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const active = getActiveJadibots()

    if (active.length === 0) {
        return m.reply(`*❌ INFO*\n\nTidak ada sub-bot (jadibot) yang sedang aktif saat ini.`)
    }

    m.react('⏳')

    try {
        const stopped = await stopAllJadibots()

        m.react('✅')

        const names = stopped.map(id => `@${id}`).join(', ')

        await sock.sendMessage(m.chat, {
            text: `*🛑 SEMUA JADIBOT DIHENTIKAN*\n\n` +
                `Total Berhasil Dihentikan: ${stopped.length} bot\n` +
                `Status Sesi: Tersimpan di Database\n\n` +
                `Daftar User: ${names}\n\n` +
                `_Catatan: Semua sesi tetap tersimpan dan dapat diaktifkan kembali kapan saja._`,
            mentions: stopped.map(id => id + '@s.whatsapp.net')
        }, { quoted: m })
    } catch (error) {
        m.react('❌')
        await m.reply(`*❌ ERROR*\n\nGagal menghentikan jadibot: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
