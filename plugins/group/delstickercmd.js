const { 
    getQuotedStickerHash, 
    deleteStickerCommand, 
    listStickerCommands,
    findByCommand 
} = require('../../src/lib/stickerCommand')

const pluginConfig = {
    name: 'delstickercmd',
    alias: ['delcmdsticker', 'delcmd', 'unsticker'],
    category: 'group',
    description: 'Hapus sticker command',
    usage: '.delstickercmd <command> atau reply sticker',
    example: '.delstickercmd menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const commandName = args[0]
    
    // List all if no args
    if (!commandName && !m.quoted) {
        const existingCmds = listStickerCommands()
        
        if (existingCmds.length === 0) {
            return m.reply(
                `*🖼️ STICKER COMMANDS*\n\n` +
                `Tidak ada sticker command yang terdaftar saat ini.\n` +
                `Gunakan .addcmdsticker untuk menambahkan.`
            )
        }
        
        let txt = `*🖼️ DAFTAR STICKER COMMANDS*\n\n`
        
        for (const (cmd, i) of existingCmds.entries()) {
            txt += `${i + 1}. Sticker → \`.${cmd.command}\`\n`
        }
        
        txt += `\n*Cara Menghapus:*\n`
        txt += `- \`.delstickercmd <nama command>\`\n`
        txt += `- Reply sticker lalu ketik \`.delstickercmd\``
        
        return m.reply(txt)
    }
    
    let deleted = false
    let deletedCmd = ''
    
    // Method 1: Reply sticker to delete
    if (m.quoted) {
        const stickerHash = getQuotedStickerHash(m)
        if (stickerHash) {
            const success = deleteStickerCommand(stickerHash)
            if (success) {
                deleted = true
                deletedCmd = 'sticker tersebut'
            }
        }
    }
    
    // Method 2: Delete by command name
    if (!deleted && commandName) {
        const cleanCmd = commandName.toLowerCase().replace(/^\./, '')
        const found = findByCommand(cleanCmd)
        
        if (found) {
            const success = deleteStickerCommand(found.hash)
            if (success) {
                deleted = true
                deletedCmd = `command .${cleanCmd}`
            }
        } else {
            return m.reply(
                `*❌ GAGAL*\n\nSticker command \`.${cleanCmd}\` tidak ditemukan dalam database.`
            )
        }
    }
    
    if (deleted) {
        await m.react('✅')
        await m.reply(
            `*✅ BERHASIL DIHAPUS*\n\nShortcut command untuk ${deletedCmd} telah dihapus dari sistem.`
        )
    } else {
        await m.reply(
            `*❌ GAGAL*\n\nUntuk menghapus, silakan:\n- Reply sticker yang ingin dihapus, atau\n- Ketik nama command: \`.delstickercmd menu\``
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
