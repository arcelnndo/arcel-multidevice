const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const config = require('../../config')
const moment = require('moment-timezone')

const pluginConfig = {
    name: 'backupsc',
    alias: ['backup', 'backupscript', 'backupsource'],
    category: 'owner',
    description: 'Backup script bot dan kirim ke Private Chat Owner (auto-delete)',
    usage: '.backupsc',
    example: '.backupsc',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const EXCLUDE_DIRS = [
    'node_modules', '.git', 'storage', 'tmp', 'temp', 
    '.cache', 'logs', 'sessions', 'auth', '.npm', '.yarn'
]

const EXCLUDE_FILES = [
    '.env', '.env.local', 'creds.json', '*.log', 
    '*.zip', 'package-lock.json', 'yarn.lock'
]

function shouldExclude(filePath, basePath) {
    const relativePath = path.relative(basePath, filePath)
    const parts = relativePath.split(path.sep)
    for (const part of parts) {
        if (EXCLUDE_DIRS.includes(part)) return true
    }
    const fileName = path.basename(filePath)
    for (const pattern of EXCLUDE_FILES) {
        if (pattern.includes('*')) {
            const ext = pattern.replace('*', '')
            if (fileName.endsWith(ext)) return true
        } else if (fileName === pattern) {
            return true
        }
    }
    return false
}

async function handler(m, { sock }) {
    m.react('⏳')
    
    // Ambil nomor owner dari config untuk pengiriman PC
    const ownerNumber = config.owner?.number?.[0] 
    const ownerJid = ownerNumber ? (ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : ownerNumber + '@s.whatsapp.net') : m.sender

    await m.reply(`*⏳ PROSES BACKUP DIMULAI...*\n\nFile script akan dipacking dan dikirim langsung ke Chat Pribadi Owner demi keamanan. Mohon tunggu sebentar.`)
    
    let zipFilePath = null;
    
    try {
        const projectRoot = process.cwd()
        const timestamp = moment().tz('Asia/Jakarta').format('YYYY-MM-DD_HH-mm-ss')
        const botName = config.bot?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'ARCELZAI'
        const zipFileName = `${botName}_SC_${timestamp}.zip`
        zipFilePath = path.join(projectRoot, zipFileName)
        
        const output = fs.createWriteStream(zipFilePath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        
        await new Promise((resolve, reject) => {
            output.on('close', resolve)
            archive.on('error', reject)
            archive.pipe(output)
            
            function addDirectory(dirPath) {
                try {
                    const items = fs.readdirSync(dirPath)
                    for (const item of items) {
                        const fullPath = path.join(dirPath, item)
                        if (shouldExclude(fullPath, projectRoot)) continue
                        try {
                            const stat = fs.statSync(fullPath)
                            const relativePath = path.relative(projectRoot, fullPath)
                            if (stat.isDirectory()) {
                                addDirectory(fullPath)
                            } else if (stat.isFile()) {
                                archive.file(fullPath, { name: relativePath })
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
            }
            addDirectory(projectRoot)
            archive.finalize()
        })
        
        const stats = fs.statSync(zipFilePath)
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        const caption = `*✅ BACKUP SCRIPT SELESAI*\n\n` +
            `Nama File: ${zipFileName}\n` +
            `Ukuran: ${fileSizeMB} MB\n` +
            `Tanggal: ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY')}\n` +
            `Status: Otomatis dihapus dari Panel\n\n` +
            `_Catatan: Backup ini tidak menyertakan node_modules, .git, storage, dan file kredensial demi keamanan._`

        // Kirim ke nomor owner (Private Chat)
        await sock.sendMessage(ownerJid, {
            document: fs.readFileSync(zipFilePath),
            fileName: zipFileName,
            mimetype: 'application/zip',
            caption: caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '0',
                    newsletterName: 'ARCELZAI',
                    serverMessageId: 127
                }
            }
        })
        
        // Beri tahu di tempat perintah diketik (grup/PC) kalau sudah dikirim
        if (m.isGroup) {
            await m.reply(`*✅ BERHASIL*\n\nFile backup telah dikirim ke chat pribadi Owner (@${ownerJid.split('@')[0]}).`, { mentions: [ownerJid] })
        }
        
        // Hapus file ZIP dari panel setelah berhasil dikirim
        if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath)
        }
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
        
        if (zipFilePath && fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
