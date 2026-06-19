const pluginConfig = {
    name: 'delpp',
    alias: ['delprofilebot', 'delppbot', 'hapusppbot'],
    category: 'tools',
    description: 'Menghapus foto profil bot',
    usage: '.delpp',
    example: '.delpp',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botJid = sock.user?.id
        if (!botJid) {
            await m.reply(`*❌ GAGAL*\n\nBot JID tidak ditemukan.`)
            return
        }
        
        await sock.removeProfilePicture(botJid)
        
        await m.reply(`*✅ BERHASIL*\n\nFoto profil bot berhasil dihapus.`)
    } catch (error) {
        await m.reply(`*❌ GAGAL*\n\nTidak dapat menghapus foto profil bot.\nError: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
