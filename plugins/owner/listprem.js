const config = require('../../config')

const pluginConfig = {
    name: 'listprem',
    alias: ['listpremium', 'premlist'],
    category: 'owner',
    description: 'Melihat daftar premium user',
    usage: '.listprem',
    example: '.listprem',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = require('../../src/lib/database').getDatabase()
    const premiumUsers = db.data.premium || []
    
    if (premiumUsers.length === 0) {
        return m.reply(`*💎 DAFTAR PREMIUM KOSONG*\n\nBelum ada pengguna yang terdaftar sebagai user premium saat ini.\n\nGunakan perintah: \`${m.prefix}addprem <nomor>\``)
    }
    
    let txt = `*💎 DAFTAR PENGGUNA PREMIUM*\n\n`
    const now = Date.now()

    premiumUsers.forEach((p, i) => {
        const num = typeof p === 'string' ? p : p.id
        const exp = typeof p === 'object' && p.expired 
            ? Math.ceil((p.expired - now) / (1000 * 60 * 60 * 24))
            : '∞'
        
        const status = exp === '∞' ? 'Permanen' : `${exp} hari lagi`
        txt += `${i + 1}. ${num} (${status})\n`
    })
    
    txt += `\nTotal: ${premiumUsers.length} user premium\n\n`
    txt += `_Gunakan perintah \`.delprem <nomor>\` untuk menghapus akses premium._`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
