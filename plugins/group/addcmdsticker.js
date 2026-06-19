const { getQuotedStickerHash, addStickerCommand, listStickerCommands } = require('../../src/lib/stickerCommand')
const { getPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'addcmdsticker',
    alias: ['addstickercmd', 'setcmd', 'stickeradd'],
    category: 'group',
    description: 'Jadikan sticker sebagai shortcut command',
    usage: '.addcmdsticker <command> (reply sticker)',
    example: '.addcmdsticker menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const commandName = args[0]
    
    // Validasi command name
    if (!commandName) {
        const existingCmds = listStickerCommands()
        
        let txt = `*🖼️ STICKER COMMAND SETTING*\n\n`
        txt += `Gunakan fitur ini untuk membuat shortcut command melalui sticker.\n\n`
        txt += `*Cara Pakai:*\n`
        txt += `Reply sebuah sticker, lalu ketik:\n`
        txt += `\`${m.prefix}addcmdsticker <nama command>\`\n\n`
        txt += `*Contoh:*\n`
        txt += `\`${m.prefix}addcmdsticker menu\`\n\n`
        
        if (existingCmds.length > 0) {
            txt += `*Daftar Shortcut Aktif:*\n`
            for (const cmd of existingCmds.slice(0, 10)) {
                txt += `- Sticker → \`.${cmd.command}\`\n`
            }
            if (existingCmds.length > 10) {
                txt += `- ... dan ${existingCmds.length - 10} lainnya\n`
            }
        }
        
        return m.reply(txt)
    }
    
    // Validasi reply sticker
    if (!m.quoted) {
        return m.reply('*⚠️ PERHATIAN*\n\nSilakan reply sticker yang ingin dijadikan shortcut command!')
    }
    
    const stickerHash = getQuotedStickerHash(m)
    if (!stickerHash) {
        return m.reply('*❌ GAGAL*\n\nPesan yang kamu reply bukan merupakan sticker.')
    }
    
    // Validasi command exists
    const cleanCmd = commandName.toLowerCase().replace(/^\./, '')
    const plugin = getPlugin(cleanCmd)
    
    if (!plugin) {
        return m.reply(
            `*❌ COMMAND TIDAK DITEMUKAN*\n\n` +
            `Command \`${cleanCmd}\` tidak ada dalam sistem. Pastikan command yang ingin dijadikan shortcut sudah benar.`
        )
    }
    
    // Add sticker command
    const success = addStickerCommand(stickerHash, cleanCmd, m.sender)
    
    if (success) {
        await m.react('✅')
        await m.reply(
            `*✅ STICKER COMMAND BERHASIL DIBUAT*\n\n` +
            `Sekarang kamu bisa mengirim sticker tersebut untuk menjalankan perintah: \`.${cleanCmd}\` secara otomatis.`
        )
    } else {
        await m.reply('*❌ ERROR*\n\nGagal menyimpan konfigurasi sticker command ke database.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
