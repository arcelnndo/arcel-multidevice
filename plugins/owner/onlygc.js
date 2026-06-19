const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'onlygc',
    alias: ['onlygroup', 'grouponly'],
    category: 'owner',
    description: 'Toggle mode bot hanya di grup',
    usage: '.onlygc',
    example: '.onlygc',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const currentMode = db.setting('onlyGc') || false
    
    if (currentMode) {
        db.setting('onlyGc', false)
        m.react('❌')
        return m.reply(`*❌ ONLY GROUP MODE DINONAKTIFKAN*\n\nBot sekarang bisa diakses di grup maupun di private chat.`)
    } else {
        db.setting('onlyGc', true)
        db.setting('onlyPc', false)
        m.react('✅')
        return m.reply(`*✅ ONLY GROUP MODE DIAKTIFKAN*\n\nSekarang bot hanya akan merespon perintah di dalam grup saja. Mode Only PC otomatis dimatikan.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
