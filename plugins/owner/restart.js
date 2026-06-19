const { spawn } = require('child_process')
const path = require('path')

const pluginConfig = {
    name: 'restart',
    alias: ['reset', 'reboot', 'restartbot'],
    category: 'owner',
    description: 'Restart bot process (real restart)',
    usage: '.restart',
    example: '.restart',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await m.react('🔄')
        
        const startTime = Date.now()
        
        await sock.sendMessage(m.chat, {
            text: `*🔄 RESTARTING BOT...*\n\n` +
                  `*Detail Proses:*\n` +
                  `- Waktu: ${new Date().toLocaleTimeString('id-ID')} WIB\n` +
                  `- Metode: Process Spawn\n` +
                  `- PID: ${process.pid}\n\n` +
                  `Bot akan memulai ulang dalam 2 detik. Proses ini biasanya memakan waktu 10-30 detik tergantung kecepatan server.`
        }, { quoted: m })
        
        console.log('[Restart] Command triggered by:', m.sender)
        console.log('[Restart] Initiating graceful restart...')
        
        setTimeout(() => {
            const cwd = process.cwd()
            const isWindows = process.platform === 'win32'
            
            let command, args
            
            if (isWindows) {
                command = 'cmd.exe'
                args = ['/c', 'start', '/b', 'node', 'index.js']
            } else {
                command = 'node'
                args = ['index.js']
            }
            
            const child = spawn(command, args, {
                cwd: cwd,
                detached: true,
                stdio: 'ignore',
                shell: isWindows,
                env: { ...process.env, RESTARTED: 'true', RESTART_TIME: startTime.toString() }
            })
            
            child.unref()
            
            console.log('[Restart] New process spawned, exiting current process...')
            
            setTimeout(() => {
                process.exit(0)
            }, 500)
            
        }, 2000)
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`*❌ RESTART GAGAL*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
