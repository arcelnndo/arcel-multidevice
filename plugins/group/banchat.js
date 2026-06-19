const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'banchat',
    alias: ['bangroup', 'bangrup', 'unbanchat', 'unbangroup'],
    category: 'group',
    description: 'Ban grup dari penggunaan bot (hanya owner yang bisa akses)',
    usage: '.banchat',
    example: '.banchat',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isUnban = ['unbanchat', 'unbangroup'].includes(cmd)
    
    try {
        const groupMeta = m.groupMetadata
        const groupName = groupMeta.subject || 'Unknown'
        const groupData = db.getGroup(m.chat) || {}
        
        if (isUnban) {
            if (!groupData.isBanned) {
                return m.reply(
                    `*⚠️ INFO GRUP*\n\n` +
                    `Grup ini tidak sedang dalam status banned. Semua anggota bisa menggunakan bot seperti biasa.`
                )
            }
            
            db.setGroup(m.chat, { ...groupData, isBanned: false })
            
            return sock.sendMessage(m.chat, {
                text: `*✅ GRUP BERHASIL DI-UNBAN*\n\n` +
                    `Grup: ${groupName}\n` +
                    `Status: Aktif\n` +
                    `Unban Oleh: @${m.sender.split('@')[0]}\n\n` +
                    `Sekarang semua anggota di grup ini sudah bisa menggunakan fitur bot kembali.`,
                mentions: [m.sender]
            }, { quoted: m })
        }
        
        if (groupData.isBanned) {
            return m.reply(
                `*⚠️ INFO GRUP*\n\n` +
                `Grup ini sudah dalam status banned sebelumnya. Gunakan perintah \`.unbanchat\` untuk membuka akses.`
            )
        }
        
        db.setGroup(m.chat, { ...groupData, isBanned: true })
        
        await sock.sendMessage(m.chat, {
            text: `*🚫 GRUP BERHASIL DI-BAN*\n\n` +
                `Grup: ${groupName}\n` +
                `Status: Terblokir (Banned)\n` +
                `Ban Oleh: @${m.sender.split('@')[0]}\n\n` +
                `Anggota biasa tidak dapat menggunakan fitur bot di grup ini sampai blokir dibuka oleh Owner.`,
            mentions: [m.sender]
        }, { quoted: m })
        
    } catch (error) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan saat memproses perintah: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
