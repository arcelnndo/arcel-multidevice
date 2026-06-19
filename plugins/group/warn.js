const { getDatabase } = require('../../src/lib/database')
const { getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'warn',
    alias: ['warning', 'peringatan'],
    category: 'group',
    description: 'Memberi peringatan kepada member',
    usage: '.warn @user <alasan>',
    example: '.warn @user spam',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const MAX_WARNINGS = 3

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
            `- Reply pesan user lalu ketik \`${m.prefix}warn <alasan>\`\n` +
            `- Atau ketik langsung: \`${m.prefix}warn @user <alasan>\``
        )
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === targetUser)
        if (participant?.admin) {
            await m.reply(`*❌ GAGAL*\n\nBot tidak bisa memberi peringatan kepada Admin grup.`)
            return
        }
    } catch (e) {}
    
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetUser === botJid) {
        await m.reply(`*❌ GAGAL*\n\nBot tidak bisa memberi peringatan kepada dirinya sendiri.`)
        return
    }
    
    const reason = m.text?.replace(/@\d+/g, '').trim() || 'Tidak ada alasan'
    let groupData = db.getGroup(m.chat) || {}
    let warnings = groupData.warnings || {}
    let userWarnings = warnings[targetUser] || []
    
    userWarnings.push({
        reason: reason,
        by: m.sender,
        time: Date.now()
    })
    
    warnings[targetUser] = userWarnings
    db.setGroup(m.chat, { ...groupData, warnings: warnings })
    
    const warnCount = userWarnings.length
    const targetName = targetUser.split('@')[0]
    
    if (warnCount >= MAX_WARNINGS) {
        try {
            await sock.groupParticipantsUpdate(m.chat, [targetUser], 'remove')
            await m.reply(
                `*🚨 BATAS PERINGATAN TERLAPUI*\n\n` +
                `@${targetName} telah dikeluarkan dari grup karena mencapai batas maksimal peringatan.\n\n` +
                `Jumlah Warning: ${warnCount}/${MAX_WARNINGS}\n` +
                `Alasan Terakhir: ${reason}`,
                { mentions: [targetUser] }
            )
            // Reset warn setelah kick
            delete warnings[targetUser]
            db.setGroup(m.chat, { ...groupData, warnings: warnings })
        } catch (e) {
            await m.reply(`*❌ ERROR*\n\nGagal mengeluarkan user: ${e.message}`)
        }
    } else {
        await m.reply(
            `*⚠️ PERINGATAN MEMBER*\n\n` +
            `@${targetName} mendapatkan peringatan pelanggaran baru.\n\n` +
            `Status Warning: ${warnCount}/${MAX_WARNINGS}\n` +
            `Alasan: ${reason}\n\n` +
            `Catatan: ${MAX_WARNINGS - warnCount} peringatan lagi akan mengakibatkan kick otomatis.`,
            { mentions: [targetUser] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
