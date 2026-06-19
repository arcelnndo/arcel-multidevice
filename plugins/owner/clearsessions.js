const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'clearsessions',
    alias: ['clearsession', 'delsession', 'delsessions'],
    category: 'owner',
    description: 'Menghapus semua session di storage/sessions/',
    usage: '.clearsessions',
    example: '.clearsessions',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m)  {
    const sessionsPath = path.join(process.cwd(), 'storage', 'sessions')
    
    if (!fs.existsSync(sessionsPath)) {
        return m.reply(`*❌ GAGAL*\n\nFolder sessions tidak ditemukan di direktori storage.`)
    }
    
    m.react('🗑️')
    
    try {
        const files = fs.readdirSync(sessionsPath)
        
        if (files.length === 0) {
            return m.reply(`*📁 INFO*\n\nFolder sessions sudah dalam keadaan kosong.`)
        }
        
        let deleted = 0
        let skipped = 0
        
        for (const file of files) {
            // Kita skip creds.json supaya bot nggak logout
            if (file === 'creds.json') {
                skipped++
                continue
            }
            
            const filePath = path.join(sessionsPath, file)
            try {
                const stat = fs.statSync(filePath)
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true })
                } else {
                    fs.unlinkSync(filePath)
                }
                deleted++
            } catch {}
        }
        
        m.react('✅')
        await m.reply(
            `*🗑️ CLEAR SESSIONS SELESAI*\n\n` +
            `Berhasil Dihapus: ${deleted} file\n` +
            `Dilewati: ${skipped} file\n\n` +
            `_Catatan: File creds.json tetap dipertahankan agar koneksi bot tidak terputus. Silakan restart bot jika diperlukan._`
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
