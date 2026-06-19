const os = require('os')

const pluginConfig = {
    name: 'stats',
    alias: ['botstats', 'status', 'stat'],
    category: 'main',
    description: 'Menampilkan statistik bot',
    usage: '.stats',
    example: '.stats',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
}

async function handler(m, { sock, db, uptime, config: botConfig }) {
    try {
        const users = db.db?.data?.users || {}
        const groups = db.db?.data?.groups || {}
        const memUsed = process.memoryUsage()
        const cpuUsage = os.loadavg()[0].toFixed(2)
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem

        const totalUsers = Object.keys(users).length
        const totalGroups = Object.keys(groups).length
        const premiumUsers = Object.values(users).filter(u => u.premium).length

        let statsText = `*BOT STATISTICS*\n\n`
        
        statsText += `*INFO*\n`
        statsText += `- Bot: ${botConfig?.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n`
        statsText += `- Version: v${botConfig?.bot?.version || '1.0.0'}\n`
        statsText += `- Uptime: ${formatUptime(uptime)}\n\n`
        
        statsText += `*DATABASE*\n`
        statsText += `- Users: ${totalUsers}\n`
        statsText += `- Premium: ${premiumUsers}\n`
        statsText += `- Groups: ${totalGroups}\n\n`
        
        statsText += `*SYSTEM*\n`
        statsText += `- Platform: ${os.platform()} ${os.arch()}\n`
        statsText += `- Node: ${process.version}\n`
        statsText += `- CPU Load: ${cpuUsage}%\n`
        statsText += `- RAM Used: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n`
        statsText += `- Heap: ${formatBytes(memUsed.heapUsed)} / ${formatBytes(memUsed.heapTotal)}\n\n`
        
        statsText += `Last updated: ${require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss')} WIB`

        await m.reply(statsText)

    } catch (error) {
        await m.reply(`*ERROR*\n\n${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
