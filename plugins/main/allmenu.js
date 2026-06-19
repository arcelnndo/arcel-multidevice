const config = require('../../config')
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter')
const { getCommandsByCategory, getCategories, getPluginCount, getPlugin, getPluginsByCategory } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const { getCasesByCategory, getCaseCount } = require('../../case/ourin')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const pluginConfig = {
    name: 'allmenu',
    alias: ['fullmenu', 'am', 'allcommand', 'semua'],
    category: 'main',
    description: 'Menampilkan semua command lengkap per kategori',
    usage: '.allmenu',
    example: '.allmenu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// Fungsi getCommandSymbols diubah menggunakan teks kurung siku biasa agar lebih rapi
function getCommandSymbols(cmdName) {
    const plugin = getPlugin(cmdName)
    if (!plugin || !plugin.config) return ''
    
    const symbols = []
    if (plugin.config.isOwner) symbols.push('[O]')
    if (plugin.config.isPremium) symbols.push('[P]')
    if (plugin.config.limit && plugin.config.limit > 0) symbols.push('[L]')
    if (plugin.config.isAdmin) symbols.push('[A]')
    
    return symbols.length > 0 ? ' ' + symbols.join(' ') : ''
}

function getContextInfo(botConfig, m, thumbBuffer) {
    const saluranId = botConfig.saluran?.id || '@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
    
    return {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
    }
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const prefix = botConfig.command?.prefix || '.'
    const user = db.getUser(m.sender)
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const botMode = groupData.botMode || 'md'
    
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const casesByCategory = getCasesByCategory()
    
    let totalCommands = 0
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length
    }
    const totalCases = getCaseCount()
    const totalFeatures = totalCommands + totalCases
    
    let txt = `Hai @${m.pushName || "User"},\n\n`
    txt += `Aku ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}, bot WhatsApp yang siap bantu kamu.  \n`
    txt += `Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp.\n\n`

    txt += `*KETERANGAN*\n`
    txt += `- [O] = Owner Only\n`
    txt += `- [P] = Premium Only\n`
    txt += `- [L] = Limit Required\n`
    txt += `- [A] = Admin Only\n\n`
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium']
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a)
        const indexB = categoryOrder.indexOf(b)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    }
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    }
    
    try {
        const botmodePlugin = require('../group/botmode')
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES
            modeAllowedMap = {}
            modeExcludeMap = {}
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories
                modeExcludeMap[key] = val.excludeCategories
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode]
    const excludeCategories = modeExcludeMap[botMode] || []
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue
        
        const pluginCmds = commandsByCategory[category] || []
        const caseCmds = casesByCategory[category] || []
        const allCmds = [...pluginCmds, ...caseCmds]
        if (allCmds.length === 0) continue
        
        txt += `*[ ${category.toUpperCase()} ]*\n`
        for (const cmd of allCmds) {
            const symbols = getCommandSymbols(cmd)
            txt += `- ${prefix}${cmd}${symbols}\n`
        }
        txt += `\n`
    }
    
    txt += `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'} | ${require('moment-timezone')().tz('Asia/Jakarta').year()}\n`
    txt += `Developer: ${botConfig.bot?.developer || 'Lucky Archz'}`
    
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null
    
    try {
        await sock.sendMessage(m.chat, {    
            interactiveMessage: {      
                title: txt,      
                footer: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',      
                image: thumbBuffer,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 777,
                    isForwarded: true
                },
                externalAdReply: {
                    title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
                    body: `Owner: ${botConfig.owner?.name || 'Admin'}`,
                    mediaType: 1,
                    thumbnail: imageBuffer,
                    mediaUrl: " X ",
                    sourceUrl: botConfig.info?.website || '',
                    renderLargerThumbnail: true       
                },  
                nativeFlowMessage: {        
                    messageParamsJson: JSON.stringify({          
                        bottom_sheet: {            
                            in_thread_buttons_limit: 2,            
                            divider_indices: [1, 2, 3, 4, 5, 999],            
                            list_title: "Opsi Menu",            
                            button_title: "Pilih Opsi"          
                        },             
                    }),        
                    buttons: [ 
                        {
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },               
                        {
                            name: 'quick_reply',      
                            buttonParamsJson: JSON.stringify({              
                                display_text: 'Kembali Ke Menu Utama',
                                id: prefix + 'menu'
                            })
                        }    
                    ]      
                }    
            }  
        }, { quoted: m });
    } catch (error) {
        console.error('[AllMenu] Error:', error.message)
        if (imageBuffer) {
            await sock.sendMessage(m.chat, {
                image: imageBuffer,
                caption: txt,
                contextInfo: getContextInfo(botConfig, m)
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
