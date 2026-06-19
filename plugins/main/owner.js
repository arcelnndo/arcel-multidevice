const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Menampilkan kontak owner bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const ownerType = db.setting('ownerType') || 1
    const ownerNumbers = botConfig.owner?.number || ['6281511214289']
    const ownerName = botConfig.owner?.name || 'ɴᴀɴᴢ'
    const botName = botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
    
    if (ownerType === 2) {
        const cards = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            const jid = cleanNumber + '@s.whatsapp.net'
            
            let ppUrl = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
            try {
                ppUrl = await sock.profilePictureUrl(jid, 'image')
            } catch {}
            
            cards.push({
                image: { url: ppUrl },
                body: `Owner ke-${ownerNumbers.indexOf(number) + 1}\n\nRules:\n- Jangan spam\n- Jangan Call/VidCall sembarangan\n- Jangan jadikan bot bahan bug/banned`,
                footer: botName,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Chat Owner',
                            url: `https://wa.me/${cleanNumber}`
                        })
                    }
                ]
            })
        }
        
        await sock.sendMessage(m.chat, {
            text: `Halo *${m.pushName}*,\n\nBerikut adalah daftar kontak owner dari bot ${botName}:`,
            title: 'Owner Info',
            footer: botName,
            cards
        }, { quoted: m.raw })
        
    } else if (ownerType === 3) {
        const contacts = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName} (Owner ${botName})\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`
            
            contacts.push({ vcard })
        }
        
        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: `${ownerName} - ${botName} Owners`,
                contacts
            }
        }, { quoted: m.raw })
        
    } else {
        let ownerText = `*OWNER INFORMATION*\n\n`
        ownerText += `- Nama: ${ownerName}\n`
        ownerText += `- Bot: ${botName}\n`
        ownerText += `- Status: Online\n\n`
        ownerText += `Jika ada pertanyaan atau kendala, silakan hubungi owner melalui kontak di bawah ini.`
        
        await m.reply(ownerText)
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName} (Owner ${botName})\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`
            
            await sock.sendMessage(m.chat, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m.raw })
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
