const { performance } = require('perf_hooks')
const { getDatabase } = require('../src/lib/database')
const { getAllPlugins, getCommandsByCategory, getCategories, pluginStore } = require('../src/lib/plugins')
const config = require('../config')

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

async function handleCommand(m, sock) {
    try {
        if (!m.isCommand) return { handled: false }
        
        const command = m.command?.toLowerCase()
        if (!command) return { handled: false }
        
        const db = getDatabase()
        
        switch (command) {
            // Category: info
            case "cping":
            case "cspeed":
            case "clatency": {
                try {
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("composing", m.chat)
                    }
                    
                    const start = performance.now()
                    
                    const msgTimestamp = m.messageTimestamp ? (m.messageTimestamp * 1000) : Date.now()
                    const latency = Math.max(1, Date.now() - msgTimestamp)
                    
                    const processTime = (performance.now() - start).toFixed(2)
                    
                    let pingStatus = 'Excellent'
                    if (latency > 100 && latency <= 300) pingStatus = 'Good'
                    else if (latency > 300) pingStatus = 'Poor'
                    
                    const text = `*SYSTEM PING*\n\n` +
                        `- Latency: ${latency}ms\n` +
                        `- Process: ${processTime}ms\n` +
                        `- Status: ${pingStatus}`
                    
                    await m.reply(text)
                    
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("paused", m.chat)
                    }
                } catch (error) {
                    console.error('[CPing] Error:', error)
                    await m.reply(`*Gagal:*\n${error.message}`)
                }
                return { handled: true }
            }
            
            case "lcase":
            case "caselist":
            case "allcase":
            case "listallcase": {
                try {
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("composing", m.chat)
                    }
                    
                    const casesByCategory = {
                        info: ['cping', 'listallcase', 'listallplugin']
                    }
                    
                    const caseAliases = {
                        'cping': ['cspeed', 'clatency'],
                        'listallcase': ['lcase', 'caselist', 'allcase'],
                        'listallplugin': ['lplugin', 'pluginlist', 'allplugin']
                    }
                    
                    let totalCases = 0
                    for (const cat in casesByCategory) {
                        totalCases += casesByCategory[cat].length
                    }
                    
                    let text = `*CASE LIST*\n`
                    text += `- Total: ${totalCases} cases\n`
                    text += `- Kategori: ${Object.keys(casesByCategory).length}\n\n`
                    
                    for (const category in casesByCategory) {
                        const commands = casesByCategory[category]
                        const categoryName = category.toUpperCase()
                        
                        text += `*[ ${categoryName} ]*\n`
                        commands.forEach((cmd, i) => {
                            const prefix = m.prefix || '.'
                            const aliases = caseAliases[cmd] ? ` (${caseAliases[cmd].slice(0, 2).join(', ')})` : ''
                            text += `${i + 1}. ${prefix}${cmd}${aliases}\n`
                        })
                        text += `\n`
                    }
                    
                    text += `Tip: Gunakan .listallplugin untuk melihat plugin`
                    
                    await sock.sendMessage(m.chat, {
                        text,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '@newsletter',
                                newsletterName: 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
                                serverMessageId: 127
                            }
                        }
                    }, { quoted: m })
                    
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("paused", m.chat)
                    }
                } catch (error) {
                    console.error('[ListAllCase] Error:', error)
                    await m.reply(`*Gagal:*\n${error.message}`)
                }
                return { handled: true }
            }
            
            case "lplugin":
            case "pluginlist":
            case "allplugin":
            case "listallplugin": {
                try {
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("composing", m.chat)
                    }
                    
                    const categories = getCategories()
                    const commandsByCategory = getCommandsByCategory()
                    
                    let totalPlugins = 0
                    for (const category of categories) {
                        totalPlugins += (commandsByCategory[category] || []).length
                    }
                    
                    if (totalPlugins === 0) {
                        await m.reply('Belum ada plugin yang dimuat.')
                        return { handled: true }
                    }
                    
                    let text = `*PLUGIN LIST*\n`
                    text += `- Total: ${totalPlugins} plugins\n`
                    text += `- Kategori: ${categories.length}\n\n`
                    
                    for (const category of categories.sort()) {
                        const commands = commandsByCategory[category] || []
                        if (commands.length === 0) continue
                        
                        const categoryName = category.toUpperCase()
                        
                        text += `*[ ${categoryName} ]*\n`
                        
                        commands.sort().forEach((cmd, i) => {
                            const plugin = pluginStore.commands.get(cmd)
                            if (plugin && plugin.config) {
                                const prefix = m.prefix || '.'
                                const aliases = plugin.config.alias ? ` (${plugin.config.alias.slice(0, 2).join(', ')})` : ''
                                text += `${i + 1}. ${prefix}${cmd}${aliases}\n`
                            }
                        })
                        
                        text += `\n`
                    }
                    
                    text += `Tip: Gunakan .listallcase untuk melihat case`
                    
                    await sock.sendMessage(m.chat, {
                        text,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '@newsletter',
                                newsletterName: 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
                                serverMessageId: 127
                            }
                        }
                    }, { quoted: m })
                    
                    if (config.features?.autoTyping) {
                        await sock.sendPresenceUpdate("paused", m.chat)
                    }
                } catch (error) {
                    console.error('[ListAllPlugin] Error:', error)
                    await m.reply(`*Gagal:*\n${error.message}`)
                }
                return { handled: true }
            }
            // End Category: info
            
            default:
                return { handled: false }
        }
        
    } catch (error) {
        console.error('[CaseHandler] Error:', error)
        try {
            await m.reply(`*Error:*\n${error.message}`)
        } catch {}
        return { handled: true, error: error.message }
    }
}

function getCaseCommands() {
    return {
        info: ['cping', 'listallcase', 'listallplugin']
    }
}

function getCaseCount() {
    const cases = getCaseCommands()
    let total = 0
    for (const category in cases) {
        total += cases[category].length
    }
    return total
}

function getCaseCategories() {
    return Object.keys(getCaseCommands())
}

function getCasesByCategory() {
    return getCaseCommands()
}

module.exports = {
    handleCommand,
    getCaseCommands,
    getCaseCount,
    getCaseCategories,
    getCasesByCategory
}
