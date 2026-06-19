const config = require('../../config')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'donasi',
    alias: ['donate', 'donation', 'support', 'saweria', 'trakteer'],
    category: 'main',
    description: 'Informasi donasi untuk mendukung bot dengan QRIS',
    usage: '.donasi',
    example: '.donasi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    // Default nama disesuaikan menjadi teks normal, bukan small caps font
    const botName = config.bot?.name || 'Nando Dev | Arcelz Multi Device'
    const ownerName = config.owner?.name || 'Nando Dev'
    const saluranId = config.saluran?.id || '@newsletter'
    const saluranName = config.saluran?.name || botName
    
    const donasiConfig = config.donasi || {}
    const payments = donasiConfig.payment || []
    const links = donasiConfig.links || []
    const qrisUrl = donasiConfig.qris || ''
    const benefits = donasiConfig.benefits || [
        'Mendukung development',
        'Server lebih stabil',
        'Fitur baru lebih cepat',
        'Priority support'
    ]
    
    let text = `*DONASI*\n\n`
    text += `Terima kasih telah menggunakan *${botName}*.\n\n`
    
    text += `*PAYMENT*\n`
    if (payments.length > 0 || links.length > 0) {
        for (const pay of payments) {
            const payName = pay.name?.toLowerCase().split('').map((c,i) => i === 0 ? c.toUpperCase() : c).join('')
            text += `- *${payName}*: ${pay.number} (a/n ${pay.holder})\n`
        }
        
        for (const link of links) {
            text += `- *${link.name}*: ${link.url}\n`
        }
        text += `\n`
    } else {
        text += `- Belum dikonfigurasi\n`
        text += `- Edit config.donasi\n\n`
    }
    
    text += `*BENEFIT*\n`
    for (const benefit of benefits) {
        text += `- ${benefit}\n`
    }
    text += `\n`
    
    text += `Donasi berapapun sangat berharga.\n`
    text += `Contact: @${config.owner?.number?.[0] || 'owner'}`
    
    const copyButtons = payments.map(pay => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            display_text: `Copy No. ${pay.name}`,
            copy_code: pay.number
        })
    }))
    
    const contextInfo = {
        mentionedJid: config.owner?.number?.[0] ? [`${config.owner.number[0]}@s.whatsapp.net`] : [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (qrisUrl) {
        try {
            const response = await fetch(qrisUrl)
            const qrisBuffer = Buffer.from(await response.arrayBuffer())
            
            await sock.sendMessage(m.chat, {
                image: qrisBuffer,
                caption: text,
                footer: botName,
                contextInfo: contextInfo,
                interactiveButtons: copyButtons
            }, { quoted: m })
        } catch (e) {
            await sock.sendMessage(m.chat, {
                text: text,
                footer: botName,
                contextInfo: contextInfo,
                interactiveButtons: copyButtons
            }, { quoted: m })
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: text,
            footer: botName,
            contextInfo: contextInfo,
            interactiveButtons: copyButtons
        }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
