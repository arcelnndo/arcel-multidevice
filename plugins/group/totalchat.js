const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'totalchat',
    alias: ['chatstat', 'chatstats', 'topchat', 'leaderboard'],
    category: 'group',
    description: 'Lihat statistik chat member di grup',
    usage: '.totalchat',
    example: '.totalchat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const group = db.getGroup(m.chat) || {}
    const chatStats = group.chatStats || {}
    
    // Convert to array and sort by count
    const sorted = Object.entries(chatStats)
        .map(([jid, data]) => ({
            jid,
            count: data.count || 0,
            lastChat: data.lastChat || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15) // Top 15
    
    if (sorted.length === 0) {
        return m.reply(
            `*📊 STATISTIK CHAT*\n\n` +
            `Belum ada data aktivitas chat yang tercatat di grup ini. Data akan muncul otomatis setelah anggota aktif mengirim pesan.`
        )
    }
    
    let txt = `*📊 DAFTAR TOP CHATTER GRUP*\n\n`
    
    const medals = ['🥇', '🥈', '🥉']
    
    for (let i = 0; i < sorted.length; i++) {
        const { jid, count } = sorted[i]
        const rank = medals[i] || `${i + 1}.`
        const name = jid.split('@')[0]
        
        txt += `${rank} @${name} : ${count.toLocaleString('id-ID')} pesan\n`
    }
    
    // Total messages
    const totalMessages = Object.values(chatStats).reduce((sum, u) => sum + u.count, 0)
    
    txt += `\n*RINGKASAN STATISTIK*\n`
    txt += `- Anggota Aktif: ${Object.keys(chatStats).length}\n`
    txt += `- Total Seluruh Pesan: ${totalMessages.toLocaleString('id-ID')}`
    
    const mentions = sorted.map(u => u.jid)
    await m.reply(txt, { mentions })
}

// Function to increment chat count (called from handler.js)
function incrementChatCount(chatId, senderJid, db) {
    if (!chatId || !senderJid) return
    
    const group = db.getGroup(chatId) || {}
    if (!group.chatStats) group.chatStats = {}
    
    if (!group.chatStats[senderJid]) {
        group.chatStats[senderJid] = { count: 0, lastChat: 0 }
    }
    
    group.chatStats[senderJid].count++
    group.chatStats[senderJid].lastChat = Date.now()
    
    db.setGroup(chatId, group)
}

module.exports = {
    config: pluginConfig,
    handler,
    incrementChatCount
}
