const { getAllPlugins } = require('../../src/lib/plugins')
const config = require('../../config')

const pluginConfig = {
    name: 'benefitpremium',
    alias: ['premiumbenefits', 'premiumfitur', 'benefitprem'],
    category: 'main',
    description: 'Lihat penjelasan dan daftar fitur khusus Premium',
    usage: '.benefitpremium',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const premiumCommands = plugins.filter(p => p.config.isPremium && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of premiumCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`${config.command?.prefix || '.'}${name}`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    const defaultLimit = config.limits?.default || 25
    const premiumLimit = config.limits?.premium || 100
    
    let message = `*APA ITU PREMIUM?*\n\n`
    message += `Premium adalah *user berbayar* yang mendapatkan akses ke fitur eksklusif dan keuntungan lebih.\n\n`
    
    message += `*KEUNTUNGAN PREMIUM*\n`
    message += `- Limit harian: ${premiumLimit}x (vs ${defaultLimit}x user biasa)\n`
    message += `- Cooldown lebih rendah\n`
    message += `- Akses fitur eksklusif\n`
    message += `- Prioritas response\n`
    message += `- No watermark di beberapa fitur\n`
    message += `- Support prioritas\n\n`
    
    message += `*CARA MENDAPATKAN*\n`
    message += `Premium didapatkan melalui:\n`
    message += `- Hubungi owner bot\n`
    message += `- Perintah: ${config.command?.prefix || '.'}addprem <nomor> <durasi>\n`
    message += `- Contoh: .addprem 628xxx 30d\n\n`
    
    message += `*DAFTAR COMMAND PREMIUM*\n`
    message += `Total: ${totalCommands} command\n\n`
    
    if (totalCommands > 0) {
        message += commandList.map(cmd => `- ${cmd}`).join('\n')
    } else {
        message += `Semua command bisa diakses user biasa.`
    }
    
    message += `\n\nMau Upgrade? Silakan hubungi owner bot:\n`
    if (config.owner && config.owner.number) {
        message += config.owner.number.map(num => `- wa.me/${num}`).join('\n')
    }
    
    await m.reply(message)
}

module.exports = {
    config: pluginConfig,
    handler
}
