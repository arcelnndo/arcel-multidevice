/**
 * @file plugins/main/runtime.js
 * @description Plugin runtime dengan informasi lengkap dan styling minimalis
 * @author Lucky Archz, Keisya, hyuuSATAN
 * @version 2.0.0
 */

const os = require('os');
const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

/**
 * Konfigurasi plugin runtime
 */
const pluginConfig = {
    name: 'runtime',
    alias: ['run', 'uptime', 'up'],
    category: 'main',
    description: 'Lihat uptime dan statistik bot',
    usage: '.runtime',
    example: '.runtime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

/**
 * Format bytes ke human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime detailed
 */
function formatUptimeDetailed(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    return {
        days,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60,
        total: {
            seconds,
            minutes,
            hours,
            days
        }
    };
}

/**
 * Format date
 */
function formatDate(date) {
    const moment = require('moment-timezone');
    return moment(date).tz('Asia/Jakarta').format('dddd, D MMMM YYYY HH:mm:ss [WIB]');
}

/**
 * Get system uptime
 */
function getSystemUptime() {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${Math.floor(seconds)}s`;
    
    return result.trim();
}

/**
 * Handler untuk command runtime
 */
async function handler(m, { sock, config: botConfig, uptime }) {
    const db = getDatabase();
    const stats = db.getStats();
    const totalUsers = db.getUserCount();
    
    const uptimeData = formatUptimeDetailed(uptime);
    const now = Date.now();
    const startTime = new Date(Date.now() - uptime);
    
    // Memory info
    const memUsed = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);
    
    // Build message with clean formatting
    let text = `*BOT RUNTIME*\n`;
    text += `Statistik uptime dan performa sistem.\n\n`;
    
    // Uptime section
    text += `*UPTIME*\n`;
    text += `- Total Runtime: ${uptimeData.days} Hari, ${uptimeData.hours} Jam, ${uptimeData.minutes} Menit, ${uptimeData.seconds} Detik\n`;
    text += `- Started At: ${formatDate(startTime)}\n`;
    text += `- System Uptime: ${getSystemUptime()}\n\n`;
    
    // Statistics section
    text += `*STATISTICS*\n`;
    text += `- Total Users: ${totalUsers}\n`;
    text += `- Cmd Executed: ${stats.commandsExecuted || 0}\n`;
    text += `- Avg Cmd/Hour: ${(uptimeData.total.hours > 0 ? (stats.commandsExecuted / uptimeData.total.hours).toFixed(1) : stats.commandsExecuted || 0)}\n\n`;
    
    // Performance section
    text += `*PERFORMANCE*\n`;
    text += `- RAM Usage: ${usedMemPercent}% (${formatBytes(totalMem - freeMem)} free)\n`;
    text += `- Heap: ${formatBytes(memUsed.heapUsed)} / ${formatBytes(memUsed.heapTotal)}\n`;
    text += `- RSS: ${formatBytes(memUsed.rss)}\n`;
    text += `- External: ${formatBytes(memUsed.external)}\n`;
    text += `- CPU Cores: ${os.cpus().length}\n\n`;
    
    // Bot info section
    text += `*BOT INFO*\n`;
    text += `- Name: ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n`;
    text += `- Version: v${botConfig.bot?.version || '1.0.0'}\n`;
    text += `- Developer: ${botConfig.bot?.developer || 'Dev'}\n`;
    text += `- Mode: ${botConfig.mode || 'public'}\n`;
    text += `- Node.js: ${process.version}\n\n`;
    
    // Current time
    text += `Generated at: ${formatDate(now)}`;
    
    await m.reply(text);
}

module.exports = {
    config: pluginConfig,
    handler
};
