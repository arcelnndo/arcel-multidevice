const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const config = require('../../config');

const pluginConfig = {
    name: 'system',
    alias: ['ram', 'cpu', 'disk', 'latency', 'ping'],
    category: 'main',
    description: 'Menampilkan informasi sistem (RAM, CPU, Disk, Latency)',
    usage: '.ram | .cpu | .disk | .ping',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

function formatSize(bytes) {
    if (bytes === 0) return '0 Byte';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getDiskUsage() {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n').slice(1);
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    const caption = parts[0];
                    const free = parseInt(parts[1]);
                    const size = parseInt(parts[2]);
                    const used = size - free;
                    return `*[ DRIVE ${caption} ]*\n- Total: ${formatSize(size)}\n- Used: ${formatSize(used)}\n- Free: ${formatSize(free)}\n`;
                }
                return null;
            }).filter(Boolean).join('\n');
        } else {
            const { stdout } = await execAsync('df -h /');
            const lines = stdout.trim().split('\n');
            const parts = lines[1].replace(/\s+/g, ' ').split(' ');
            return `*DISK USAGE*\n\n- Total: ${parts[1]}\n- Used: ${parts[2]}\n- Free: ${parts[3]}\n- Use: ${parts[4]}`;
        }
    } catch (e) {
        return 'Gagal mengambil informasi disk.';
    }
}

async function handler(m, { sock }) {
    const command = m.command.toLowerCase();

    try {
        switch (command) {
            case 'ram': {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                
                const text = `*RAM USAGE*\n\n` +
                             `- Total: ${formatSize(totalMem)}\n` +
                             `- Used: ${formatSize(usedMem)}\n` +
                             `- Free: ${formatSize(freeMem)}\n` +
                             `- Platform: ${os.platform()} (${os.arch()})`;
                m.reply(text);
                break;
            }

            case 'cpu': {
                const cpus = os.cpus();
                const model = cpus[0].model;
                const speed = cpus[0].speed;
                const cores = cpus.length;
                
                const uptime = os.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
                
                const text = `*CPU INFO*\n\n` +
                             `- Model: ${model.trim()}\n` +
                             `- Speed: ${speed} MHz\n` +
                             `- Cores: ${cores} Core(s)\n` +
                             `- Server Uptime: ${uptimeStr}`;
                m.reply(text);
                break;
            }

            case 'disk': {
                const diskInfo = await getDiskUsage();
                m.reply(diskInfo);
                break;
            }

            case 'ping':
            case 'latency': {
                const timestamp = m.messageTimestamp ? m.messageTimestamp * 1000 : Date.now();
                const latency = Math.max(1, Date.now() - timestamp);
                
                let speed = '';
                if (latency < 100) speed = 'Fast';
                else if (latency < 500) speed = 'Good';
                else if (latency < 1000) speed = 'Normal';
                else speed = 'Slow';
                
                m.reply(`*PONG*\n\n- Latency: ${latency}ms\n- Response: ${speed}`);
                break;
            }
        }
    } catch (e) {
        console.error('System Plugin Error:', e);
        m.reply('Terjadi kesalahan saat mengambil data sistem.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
