const { getDatabase } = require('../../src/lib/database')
const { getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'mute',
    alias: ['bisukan'],
    category: 'group',
    description: 'Bisukan member secara global (tidak bisa chat di grup mana pun)',
    usage: '.mute @user [durasi_menit]',
    example: '.mute @user 30',
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
    
    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `*⚠️ CARA PENGGUNAAN*\n\n` +
            `Reply pesan target atau mention orangnya:\n` +
            `- \`${m.prefix}mute 30\` (Durasi 30 menit)\n` +
            `- \`${m.prefix}mute @user 60\` (Durasi 60 menit)\n\n` +
            `Default durasi adalah 30 menit jika tidak diisi.`
        )
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === targetUser)
        // Admin tetap tidak bisa di-mute biar gak chaos
        if (participant?.admin) {
            await m.reply(`*❌ GAGAL*\n\nBot tidak bisa membisukan Admin grup.`)
            return
        }
    } catch (e) {}
    
    const durationArg = m.text?.replace(/@\d+/g, '').trim()
    const duration = parseInt(durationArg) || 30
    
    if (duration < 1 || duration > 10080) { // Max 1 minggu biar ga kelamaan
        await m.reply(`*⚠️ PERINGATAN*\n\nDurasi minimal 1 menit dan maksimal 10080 menit (7 hari).`)
        return
    }
    
    // Ambil data mute global dari database setting
    let globalMuted = db.setting('globalMutedUsers') || {}
    
    const targetName = targetUser.split('@')[0]
    const unmuteTime = Date.now() + (duration * 60 * 1000)
    
    globalMuted[targetUser] = {
        until: unmuteTime,
        by: m.sender,
        time: Date.now()
    }
    
    // Simpan ke level setting (berlaku untuk semua grup)
    db.setting('globalMutedUsers', globalMuted)
    
    await m.reply(
        `*🔇 USER DIBISUKAN (GLOBAL)*\n\n` +
        `User: @${targetName}\n` +
        `Durasi: ${duration} menit\n\n` +
        `Status: Aktif di seluruh grup yang ada bot ini. Pesan user ini akan dihapus otomatis sampai masa mute berakhir.`,
        { mentions: [targetUser] }
    )
}

/**
 * Fungsi pengecekan (panggil ini di handler.js)
 */
function isMuted(groupJid, userJid, db) {
    const globalMuted = db.setting('globalMutedUsers') || {}
    const muteData = globalMuted[userJid]
    
    if (!muteData) return false
    
    // Cek apakah durasi sudah habis
    if (Date.now() > muteData.until) {
        delete globalMuted[userJid]
        db.setting('globalMutedUsers', globalMuted)
        return false
    }
    
    return true
}

module.exports = {
    config: pluginConfig,
    handler,
    isMuted
}
