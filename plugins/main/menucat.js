const config = require('../../config')
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'menucat',
    alias: ['mc', 'category', 'cat'],
    category: 'main',
    description: 'Menampilkan commands dalam kategori tertentu',
    usage: '.menucat <kategori>',
    example: '.menucat tools',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

let cachedThumb = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    if (fs.existsSync(thumbPath)) cachedThumb = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo() {
    const saluranId = config.saluran?.id || '@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
    const botName = config.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
    
    return {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `Kategori Menu`,
            body: botName,
            sourceUrl: config.saluran?.link || '',
            mediaType: 1,
            renderLargerThumbnail: false,
            thumbnail: cachedThumb
        }
    }
}

async function handler(m, { sock }) {
    const prefix = config.command?.prefix || '.'
    const args = m.args || []
    const categoryArg = args[0]?.toLowerCase()
    
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    
    const { getCasesByCategory } = require('../../case/ourin')
    const casesByCategory = getCasesByCategory()
    
    if (!categoryArg) {
        const db = getDatabase()
        const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
        const botMode = groupData.botMode || 'md'
        
        let modeExcludeMap = {
            md: ['panel', 'pushkontak', 'store'],
            store: ['panel', 'pushkontak', 'jpm', 'ephoto', 'cpanel'],
            pushkontak: ['panel', 'store', 'jpm', 'ephoto', 'cpanel'],
            cpanel: ['pushkontak', 'store', 'jpm', 'ephoto']
        }
        
        try {
            const botmodePlugin = require('../group/botmode')
            if (botmodePlugin && botmodePlugin.MODES) {
                const modes = botmodePlugin.MODES
                modeExcludeMap = {}
                for (const [key, val] of Object.entries(modes)) {
                    if (val.excludeCategories) modeExcludeMap[key] = val.excludeCategories
                }
            }
        } catch (e) {}
        
        const excludeCategories = modeExcludeMap[botMode] || modeExcludeMap.md
        
        let txt = `*DAFTAR KATEGORI*\n\n`
        txt += `Ketik: ${prefix}menucat <kategori>\n\n`
        
        const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'jpm', 'pushkontak', 'panel', 'ephoto', 'store']
        
        const allCats = [...new Set([...categories, ...Object.keys(casesByCategory)])]
        const sortedCats = allCats.sort((a, b) => {
            const indexA = categoryOrder.indexOf(a)
            const indexB = categoryOrder.indexOf(b)
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
        })
        
        for (const cat of sortedCats) {
            if (cat === 'owner' && !m.isOwner) continue
            if (excludeCategories.includes(cat.toLowerCase())) continue
            const pluginCmds = commandsByCategory[cat] || []
            const caseCmds = casesByCategory[cat] || []
            const totalCmds = pluginCmds.length + caseCmds.length
            if (totalCmds === 0) continue
            
            txt += `- ${cat.toUpperCase()} (${totalCmds} cmds)\n`
        }
        
        txt += `\nContoh: ${prefix}menucat tools`
        
        return sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: getContextInfo()
        }, { quoted: m })
    }
    
    const allCategories = [...new Set([...categories, ...Object.keys(casesByCategory)])]
    const matchedCat = allCategories.find(c => c.toLowerCase() === categoryArg)
    
    if (!matchedCat) {
        let errorMsg = `*KATEGORI TIDAK DITEMUKAN*\n\n`
        errorMsg += `Kategori "${categoryArg}" tidak ada.\n`
        errorMsg += `Ketik ${prefix}menucat untuk melihat daftar kategori.`
        return m.reply(errorMsg)
    }
    
    if (matchedCat === 'owner' && !m.isOwner) {
        return m.reply(`*AKSES DITOLAK*\n\nKategori ini hanya untuk owner.`)
    }
    
    const pluginCommands = commandsByCategory[matchedCat] || []
    const caseCommands = casesByCategory[matchedCat] || []
    const allCommands = [...pluginCommands, ...caseCommands]
    
    if (allCommands.length === 0) {
        return m.reply(`*KOSONG*\n\nKategori "${matchedCat}" tidak memiliki command.`)
    }
    
    let txt = `*[ ${matchedCat.toUpperCase()} ]*\n\n`
    
    for (const cmd of allCommands) {
        txt += `- ${prefix}${cmd}\n`
    }
    
    txt += `\nTotal: ${allCommands.length} commands`
    if (caseCommands.length > 0) {
        txt += ` (${pluginCommands.length} plugin + ${caseCommands.length} case)`
    }
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
