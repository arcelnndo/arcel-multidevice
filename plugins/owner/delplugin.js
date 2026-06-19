const fs = require('fs')
const path = require('path')
const { unloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'delplugin',
    alias: ['delpl', 'hapusplugin', 'removeplugin'],
    category: 'owner',
    description: 'Hapus plugin berdasarkan nama',
    usage: '.delplugin <nama>',
    example: '.delplugin bliblidl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function findPluginFile(pluginsDir, name) {
    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
    
    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                return {
                    folder,
                    file,
                    path: path.join(folderPath, file)
                }
            }
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `*🗑️ DELETE PLUGIN*\n\n` +
            `Gunakan perintah ini untuk menghapus file plugin secara permanen.\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}delplugin bliblidl\``
        )
    }
    
    m.react('⏳')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const found = findPluginFile(pluginsDir, name)
        
        if (!found) {
            m.react('❌')
            return m.reply(`*❌ GAGAL*\n\nPlugin dengan nama \`${name}\` tidak dapat ditemukan di folder manapun.`)
        }
        
        // Unload dari memory
        const unloadResult = unloadPlugin(name)
        
        // Hapus file fisik
        fs.unlinkSync(found.path)
        
        m.react('✅')
        return m.reply(
            `*✅ PLUGIN BERHASIL DIHAPUS*\n\n` +
            `Nama File: ${found.file}\n` +
            `Folder: ${found.folder}\n` +
            `Status Unload: ${unloadResult.success ? '✅ Berhasil' : '⚠️ Pending'}\n\n` +
            `_File plugin telah dihapus secara permanen dari server dan tidak lagi aktif._`
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
