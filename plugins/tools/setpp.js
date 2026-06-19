const pluginConfig = {
    name: 'setpp',
    alias: ['setprofilebot', 'setppbot', 'setfotobot'],
    category: 'tools',
    description: 'Mengubah foto profil bot',
    usage: '.setpp (reply gambar)',
    example: '.setpp',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let buffer = null
    if (m.quoted?.isImage) {
        try {
            buffer = await m.quoted.download()
        } catch (e) {
            await m.reply(`*❌ GAGAL*\n\nGagal mengunduh gambar.`)
            return
        }
    } else if (m.isImage) {
        try {
            buffer = await m.download()
        } catch (e) {
            await m.reply(`*❌ GAGAL*\n\nGagal mengunduh gambar.`)
            return
        }
    }
    
    if (!buffer) {
        await m.reply(
            `*⚠️ CARA PAKAI*\n\n` +
            `Kirim gambar dengan caption \`${m.prefix}setpp\` atau reply gambar yang sudah ada dengan perintah \`${m.prefix}setpp\`.`
        )
        return
    }
    
    try {
        const botJid = sock.user?.id
        if (!botJid) {
            await m.reply(`*❌ GAGAL*\n\nBot JID tidak ditemukan.`)
            return
        }
        
        await sock.updateProfilePicture(botJid, buffer)
        
        await m.reply(`*✅ BERHASIL*\n\nFoto profil bot berhasil diperbarui.`)
    } catch (error) {
        await m.reply(`*❌ GAGAL*\n\nTidak dapat mengubah foto profil bot.\nError: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
