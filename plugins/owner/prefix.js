const fs = require('fs')
const path = require('path')
const config = require('../../config')

const PREF_DB_PATH = path.join(process.cwd(), 'database', 'prefix.json')

function loadPrefixes() {
    try {
        if (fs.existsSync(PREF_DB_PATH)) {
            return JSON.parse(fs.readFileSync(PREF_DB_PATH, 'utf8'))
        }
    } catch {}
    return { prefixes: [], noprefix: false }
}

function savePrefixes(data) {
    const dir = path.dirname(PREF_DB_PATH)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(PREF_DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function getAllPrefixes() {
    const dbPrefixes = loadPrefixes().prefixes || []
    const configPrefix = config.command?.prefix || '.'
    const combined = [configPrefix, ...dbPrefixes]
    return [...new Set(combined)]
}

function isNoPrefix() {
    const data = loadPrefixes()
    return data.noprefix === true
}

const pluginConfig = {
    name: ['addprefix', 'gantiprefix', 'setprefix', 'delprefix', 'listprefix', 'resetprefix'],
    alias: [],
    category: 'owner',
    description: 'Manajemen prefix bot (multi-prefix & noprefix)',
    usage: '.addprefix <prefix1> <prefix2>...',
    example: '.addprefix ! # $',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const cmd = m.command?.toLowerCase()
    const args = m.args || []
    
    const data = loadPrefixes()
    if (!data.prefixes) data.prefixes = []
    if (data.noprefix === undefined) data.noprefix = false
    
    switch (cmd) {
        case 'addprefix': {
            if (args.length === 0) {
                return m.reply(
                    `*✏️ TAMBAH PREFIX*\n\n` +
                    `Gunakan perintah ini untuk menambah prefix baru.\n\n` +
                    `*Format:*\n` +
                    `\`${m.prefix}addprefix <prefix1> <prefix2> ...\`\n\n` +
                    `*Contoh:*\n` +
                    `\`${m.prefix}addprefix ! # $\`\n\n` +
                    `*Khusus Noprefix:*\n` +
                    `\`${m.prefix}addprefix noprefix\` (Bot bisa merespon tanpa simbol)`
                )
            }
            
            if (args.includes('<noprefix>') || args.includes('noprefix')) {
                data.noprefix = true
                savePrefixes(data)
                return m.reply(`*✅ NOPREFIX DIAKTIFKAN*\n\nSekarang bot bisa merespon perintah tanpa perlu mengetik prefix (langsung nama command).`)
            }
            
            const newPrefixes = args.filter(p => {
                if (!p || p.length > 5) return false
                if (data.prefixes.includes(p)) return false
                return true
            })
            
            if (newPrefixes.length === 0) {
                return m.reply(`*❌ GAGAL*\n\nTidak ada prefix baru yang valid atau sudah ada di daftar.`)
            }
            
            data.prefixes = [...new Set([...data.prefixes, ...newPrefixes])]
            savePrefixes(data)
            
            m.reply(
                `*✅ PREFIX BERHASIL DITAMBAHKAN*\n\n` +
                `Berhasil ditambahkan: \`${newPrefixes.join('`, `')}\`\n\n` +
                `*Daftar Prefix Aktif Saat Ini:*\n` +
                `\`${getAllPrefixes().join('`, `')}\`` +
                `${data.noprefix ? '\n(+ Mode Noprefix Aktif)' : ''}`
            )
            break
        }
        
        case 'setprefix':
        case 'gantiprefix': {
            if (args.length === 0) {
                return m.reply(
                    `*🔄 GANTI / SET PREFIX*\n\n` +
                    `Perintah ini akan mengganti seluruh daftar prefix lama.\n\n` +
                    `*Format:*\n` +
                    `\`${m.prefix}${cmd} <prefix1> <prefix2> ...\`\n\n` +
                    `*Contoh:*\n` +
                    `\`${m.prefix}${cmd} ! #\`\n\n` +
                    `_Catatan: Prefix lama yang ada di database akan dihapus._`
                )
            }
            
            const hasNoprefix = args.includes('<noprefix>') || args.includes('noprefix')
            const newPrefixes = args.filter(p => {
                if (!p || p.length > 5) return false
                if (p === '<noprefix>' || p === 'noprefix') return false
                return true
            })
            
            data.prefixes = [...new Set(newPrefixes)]
            data.noprefix = hasNoprefix
            savePrefixes(data)
            
            let replyText = `*✅ PREFIX BERHASIL DIGANTI*\n\n`
            if (newPrefixes.length > 0) replyText += `Prefix baru: \`${newPrefixes.join('`, `')}\`\n`
            if (hasNoprefix) replyText += `Status Noprefix: Aktif\n`
            
            replyText += `\n*Daftar Prefix Aktif Sekarang:*\n`
            replyText += `\`${getAllPrefixes().join('`, `')}\``
            
            m.reply(replyText)
            break
        }
        
        case 'delprefix': {
            if (args.length === 0) {
                return m.reply(
                    `*🗑️ HAPUS PREFIX*\n\n` +
                    `Gunakan perintah ini untuk menghapus prefix tertentu.\n\n` +
                    `*Contoh:*\n` +
                    `\`${m.prefix}delprefix ! $\`\n` +
                    `\`${m.prefix}delprefix noprefix\` (Matikan mode tanpa prefix)`
                )
            }
            
            if (args.includes('<noprefix>') || args.includes('noprefix')) {
                data.noprefix = false
                savePrefixes(data)
                return m.reply(`*✅ NOPREFIX DINONAKTIFKAN*\n\nSekarang bot hanya merespon jika menggunakan prefix resmi.`)
            }
            
            const toDelete = args
            const deleted = []
            
            data.prefixes = data.prefixes.filter(p => {
                if (toDelete.includes(p)) {
                    deleted.push(p)
                    return false
                }
                return true
            })
            
            savePrefixes(data)
            
            m.reply(
                `*✅ PREFIX DIHAPUS*\n\n` +
                `Berhasil dihapus: \`${deleted.length > 0 ? deleted.join('`, `') : 'Tidak ada'}\`\n\n` +
                `*Prefix Aktif Saat Ini:*\n` +
                `\`${getAllPrefixes().join('`, `')}\``
            )
            break
        }
        
        case 'listprefix': {
            const all = getAllPrefixes()
            const configPref = config.command?.prefix || '.'
            
            let text = `*📋 DAFTAR PREFIX BOT*\n\n`
            text += `*Konfigurasi:*\n`
            text += `- Default (Config): \`${configPref}\`\n`
            text += `- Status Noprefix: ${data.noprefix ? '✅ Aktif' : '❌ Nonaktif'}\n\n`
            
            if (data.prefixes.length > 0) {
                text += `*Custom (Database):*\n`
                data.prefixes.forEach((p, i) => {
                    text += `${i + 1}. \`${p}\`\n`
                })
                text += `\n`
            }
            
            text += `Total Prefix Aktif: ${all.length}\n`
            text += `Lengkap: \`${all.join('`, `')}\``
            
            m.reply(text)
            break
        }
        
        case 'resetprefix': {
            data.prefixes = []
            data.noprefix = false
            savePrefixes(data)
            
            m.reply(
                `*✅ PREFIX BERHASIL DIRESET*\n\n` +
                `Seluruh prefix custom di database telah dihapus dan mode noprefix dinonaktifkan.\n\n` +
                `Prefix aktif saat ini kembali ke default: \`${config.command?.prefix || '.'}\``
            )
            break
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    getAllPrefixes,
    loadPrefixes,
    savePrefixes,
    isNoPrefix
}
