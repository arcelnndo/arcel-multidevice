const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'leaderboard',
    alias: ['lb', 'top', 'topbalance', 'topbal', 'toplimit', 'topexp', 'topxp', 'ranking'],
    category: 'main',
    description: 'Lihat leaderboard (balance, exp, energi)',
    usage: '.leaderboard',
    example: '.topbalance',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    
    const users = []
    const dbData = db.db?.data?.users || {}
    
    for (const [jid, userData] of Object.entries(dbData)) {
        if (!jid || jid === 'undefined') continue
        users.push({
            jid,
            balance: userData.koin || 0,
            exp: userData.exp || 0,
            energi: userData.energi || 0,
            level: userData.level || 1,
            name: userData.name || jid.split('@')[0]
        })
    }
    
    if (users.length === 0) {
        return m.reply(`*LEADERBOARD*\n\nBelum ada data user terdaftar.`)
    }
    
    let sortedUsers
    let title
    let field
    
    if (['topbalance', 'topbal'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.balance - a.balance).slice(0, 10)
        title = 'TOP BALANCE'
        field = 'balance'
    } else if (['topenergi'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.energi - a.energi).slice(0, 10)
        title = 'TOP ENERGI'
        field = 'energi'
    } else if (['topexp', 'topxp'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.exp - a.exp).slice(0, 10)
        title = 'TOP EXP'
        field = 'exp'
    } else {
        const totalBalance = users.reduce((sum, u) => sum + u.balance, 0)
        const totalExp = users.reduce((sum, u) => sum + u.exp, 0)
        const totalEnergi = users.reduce((sum, u) => sum + u.energi, 0)
        
        const maxBalUser = users.reduce((a, b) => a.balance > b.balance ? a : b)
        const maxExpUser = users.reduce((a, b) => a.exp > b.exp ? a : b)
        const maxEnergiUser = users.reduce((a, b) => a.energi > b.energi ? a : b)
        
        const balPct = totalBalance > 0 ? ((maxBalUser.balance / totalBalance) * 100).toFixed(1) : 0
        const expPct = totalExp > 0 ? ((maxExpUser.exp / totalExp) * 100).toFixed(1) : 0
        const energiPct = totalEnergi > 0 ? ((maxEnergiUser.energi / totalEnergi) * 100).toFixed(1) : 0
        
        const mentions = [maxBalUser.jid, maxExpUser.jid, maxEnergiUser.jid]
        
        let overviewText = `*LEADERBOARD OVERVIEW*\n\n`
        overviewText += `Total User: ${users.length}\n\n`
        
        overviewText += `*[ TOP BALANCE ]*\n`
        overviewText += `- User: @${maxBalUser.jid.split('@')[0]}\n`
        overviewText += `- Total: ${formatNumber(maxBalUser.balance)} (${balPct}%)\n\n`
        
        overviewText += `*[ TOP EXP ]*\n`
        overviewText += `- User: @${maxExpUser.jid.split('@')[0]}\n`
        overviewText += `- Total: ${formatNumber(maxExpUser.exp)} (${expPct}%)\n\n`
        
        overviewText += `*[ TOP ENERGI ]*\n`
        overviewText += `- User: @${maxEnergiUser.jid.split('@')[0]}\n`
        overviewText += `- Total: ${formatNumber(maxEnergiUser.energi)} (${energiPct}%)\n\n`
        
        overviewText += `Gunakan .topbalance, .topexp, atau .topenergi untuk melihat ranking lengkap.`
        
        return sock.sendMessage(m.chat, {
            text: overviewText,
            mentions
        }, { quoted: m })
    }
    
    let text = `*${title}*\n\n`
    text += `Total: ${users.length} user\n\n`
    
    const total = users.reduce((sum, u) => sum + u[field], 0)
    const mentions = []
    
    sortedUsers.forEach((u, i) => {
        const pct = total > 0 ? ((u[field] / total) * 100).toFixed(1) : 0
        text += `${i + 1}. @${u.jid.split('@')[0]}\n`
        text += `   - ${formatNumber(u[field])} (${pct}%)\n\n`
        mentions.push(u.jid)
    })
    
    text += `Ranking berdasarkan ${field}.`
    
    await sock.sendMessage(m.chat, {
        text,
        mentions
    }, { quoted: m })
}

function formatNumber(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toString()
}

module.exports = {
    config: pluginConfig,
    handler
}
