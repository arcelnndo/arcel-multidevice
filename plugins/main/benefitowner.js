const { getAllPlugins } = require('../../src/lib/plugins')
const config = require('../../config')

const pluginConfig = {
    name: 'benefitowner',
    alias: ['ownerbenefits', 'ownerfitur'],
    category: 'main',
    description: 'Lihat penjelasan dan daftar fitur khusus Owner',
    usage: '.benefitowner',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const ownerCommands = plugins.filter(p => p.config.isOwner && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of ownerCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`${config.command?.prefix || '.'}${name}`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    
    let message = `*APA ITU OWNER?*\n\n`
    message += `Owner adalah *pemilik bot* yang memiliki akses penuh ke semua fitur dan kontrol sistem.\n\n`
    
    message += `*KEISTIMEWAAN OWNER*\n`
    message += `- Akses semua command tanpa batasan\n`
    message += `- Limit tidak terbatas\n`
    message += `- Bypass semua cooldown\n`
    message += `- Kontrol penuh sistem bot\n`
    message += `- Manajemen user & group\n`
    message += `- Akses panel & server\n\n`
    
    message += `*CARA KERJA*\n`
    message += `Owner ditambahkan melalui:\n`
    message += `- Perintah: ${config.command?.prefix || '.'}addowner <nomor>\n`
    message += `- Atau langsung dari dalam file config.js\n\n`
    
    message += `*DAFTAR COMMAND OWNER*\n`
    message += `Total: ${totalCommands} command\n\n`
    message += commandList.map(cmd => `- ${cmd}`).join('\n')
    message += `\n\nHubungi owner untuk mendapatkan akses.`
    
    await m.reply(message)
}

module.exports = {
    config: pluginConfig,
    handler
}
