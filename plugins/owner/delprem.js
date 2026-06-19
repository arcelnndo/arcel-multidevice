const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delprem',
    alias: ['delpremium', 'rmprem', 'removeprem'],
    category: 'owner',
    description: 'Menghapus user dari daftar premium',
    usage: '.delprem <nomor/@tag>',
    example: '.delprem 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`*💎 DELETE PREMIUM*\n\nSilakan masukkan nomor atau tag user yang ingin dihapus dari daftar premium.\n\nContoh: \`${m.prefix}delprem 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (!db.data.premium) db.data.premium = []
    const premiumList = db.data.premium
    
    const index = premiumList.findIndex(p => {
        const num = typeof p === 'string' ? p : p.id
        const cleanNum = num?.replace(/[^0-9]/g, '') || ''
        return cleanNum === targetNumber
    })
    
    if (index === -1) {
        return m.reply(`*❌ GAGAL*\n\nNomor \`${targetNumber}\` tidak ditemukan dalam daftar pengguna premium.`)
    }
    
    const removedData = db.data.premium.splice(index, 1)[0]
    const removedNumber = typeof removedData === 'string' ? removedData : removedData.id
    
    const jid = removedNumber + '@s.whatsapp.net'
    const user = db.getUser(jid)
    if (user) {
        user.isPremium = false
        db.setUser(jid, user)
    }
    
    db.save()
    
    m.react('✅')
    
    await m.reply(
        `*🗑️ PREMIUM BERHASIL DIHAPUS*\n\n` +
        `Nomor: ${removedNumber}\n` +
        `Status: Free User\n` +
        `Sisa Premium: ${db.data.premium.length} user\n\n` +
        `_Pengguna tersebut kini kembali menjadi pengguna biasa dan limitasi fitur premium telah dicabut._`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
