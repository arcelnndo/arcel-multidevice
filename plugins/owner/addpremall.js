const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addpremall',
    alias: ['addpremiumall', 'setpremall'],
    category: 'owner',
    description: 'Menambahkan semua member grup ke premium',
    usage: '.addpremall',
    example: '.addpremall',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`*❌ GAGAL*\n\nTidak ada member di grup ini.`)
        }
        
        m.react('⏳')
        
        const db = getDatabase()
        if (!db.data.premium) db.data.premium = []
        
        let addedCount = 0
        let alreadyPremCount = 0
        const now = Date.now()
        const defaultDuration = 30 * 24 * 60 * 60 * 1000 // Default 30 Hari
        
        for (const participant of participants) {
            // Kompatibilitas untuk id atau jid
            const number = participant.id?.replace(/[^0-9]/g, '') || participant.jid?.replace(/[^0-9]/g, '') || ''
            
            if (!number) continue
            
            // Cek apakah user sudah ada di array premium (support string & object)
            const isAlreadyPrem = db.data.premium.some(p => 
                typeof p === 'string' ? p === number : p.id === number
            )
            
            if (isAlreadyPrem) {
                alreadyPremCount++
                continue
            }  
            
            // Push dalam bentuk Object agar struktur database konsisten dengan addprem
            db.data.premium.push({
                id: number,
                expired: now + defaultDuration,
                name: 'Member Grup',
                addedAt: now
            })
            
            const jid = number + '@s.whatsapp.net'
            const premLimit = config.limits?.premium || 100
            const user = db.getUser(jid) || db.setUser(jid)
            
            user.energi = premLimit
            user.isPremium = true
            
            db.setUser(jid, user)
            db.updateExp(jid, 200000)
            db.updateKoin(jid, 20000)
            addedCount++
        }
        
        db.save()
        
        m.react('💎')
        await m.reply(
            `*💎 ADD PREMIUM ALL BERHASIL*\n\n` +
            `Grup: ${groupMeta.subject}\n\n` +
            `Total Member: ${participants.length}\n` +
            `Ditambahkan: ${addedCount} user\n` +
            `Sudah Premium: ${alreadyPremCount} user\n` +
            `Total Premium Bot: ${db.data.premium.length} user\n\n` +
            `_Catatan: Seluruh member yang berhasil ditambahkan akan mendapatkan durasi premium 30 hari beserta bonus Exp, Koin, dan Energi._`
        )
        
    } catch (error) {
        m.react('❌')
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
