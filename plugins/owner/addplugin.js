const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'addplugin',
    alias: ['addpl', 'tambahplugin'],
    category: 'owner',
    description: 'Tambah plugin baru dari code yang di-reply',
    usage: '.addplugin [namafile] [folder]',
    example: '.addplugin bliblidl downloader',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function extractPluginInfo(code) {
    const info = { name: null, category: null }
    
    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i)
    if (nameMatch) info.name = nameMatch[1]
    
    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i)
    if (categoryMatch) info.category = categoryMatch[1]
    
    return info
}

async function handler(m, { sock }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `*📦 ADD PLUGIN*\n\n` +
            `Alat ini digunakan untuk menambahkan plugin baru langsung dari kode yang di-reply.\n\n` +
            `*Cara pakai:*\n` +
            `Reply kode plugin dengan perintah:\n` +
            `- \`${m.prefix}addplugin\` (Auto detect nama & folder)\n` +
            `- \`${m.prefix}addplugin namafile\` (Custom nama file)\n` +
            `- \`${m.prefix}addplugin namafile folder\` (Custom nama file & folder)`
        )
    }
    
    let code = quoted.text || quoted.body || ''
    
    if (quoted.mimetype === 'application/javascript' || quoted.filename?.endsWith('.js')) {
        try {
            code = (await quoted.download()).toString()
        } catch (e) {
            return m.reply(`*❌ GAGAL*\n\nGagal mengunduh file kode.`)
        }
    }
    
    if (!code || code.length < 50) {
        return m.reply(`*❌ GAGAL*\n\nKode terlalu pendek atau tidak valid.`)
    }
    
    if (!code.includes('module.exports') && !code.includes('pluginConfig')) {
        return m.reply(`*❌ GAGAL*\n\nKode bukan format plugin yang valid.\nHarus mengandung \`module.exports\` dan \`pluginConfig\`.`)
    }
    
    const extracted = extractPluginInfo(code)
    const args = m.args
    
    let fileName = args[0] || extracted.name
    let folderName = args[1] || extracted.category
    
    if (!fileName) {
        return m.reply(`*❌ GAGAL*\n\nTidak dapat mendeteksi nama plugin.\nGunakan format: \`${m.prefix}addplugin <namafile>\``)
    }
    
    if (!folderName) {
        folderName = 'other'
    }
    
    fileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '')
    folderName = folderName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    if (!fileName) {
        return m.reply(`*❌ GAGAL*\n\nNama file tidak valid.`)
    }
    
    m.react('⏳')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const folderPath = path.join(pluginsDir, folderName)
        const filePath = path.join(folderPath, `${fileName}.js`)
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
        
        if (fs.existsSync(filePath)) {
            m.react('❌')
            return m.reply(
                `*❌ GAGAL*\n\n` +
                `File \`${fileName}.js\` sudah ada di dalam folder \`${folderName}\`.\n\n` +
                `💡 *Tip:* Gunakan perintah \`${m.prefix}ganticode ${fileName} ${folderName}\` untuk mengganti kode yang sudah ada.`
            )
        }
        
        fs.writeFileSync(filePath, code)
        
        const reloadResult = hotReloadPlugin(filePath)
        
        m.react('✅')
        return m.reply(
            `*✅ PLUGIN DITAMBAHKAN*\n\n` +
            `Nama File: ${fileName}.js\n` +
            `Folder: ${folderName}\n` +
            `Ukuran: ${code.length} bytes\n` +
            `Hot Reload: ${reloadResult.success ? '✅ Sukses' : '⚠️ Pending'}\n\n` +
            `Plugin berhasil ditambahkan dan siap digunakan!`
        )
        
    } catch (error) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
