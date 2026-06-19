const config = require('../../config')
const { generateWAMessageFromContent, proto } = require('ourin')

const pluginConfig = {
    name: 'cekidch',
    alias: ['idch', 'channelid'],
    category: 'tools',
    description: 'Cek ID channel dari link',
    usage: '.cekidch <link channel>',
    example: '.cekidch https://whatsapp.com/channel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(`📺 *CEK ID CHANNEL*\n\nMasukkan link channel.\nContoh: \`${m.prefix}cekidch https://whatsapp.com/channel/xxxxx\``)
    }
    
    if (!text.includes('https://whatsapp.com/channel/')) {
        return m.reply(`❌ *GAGAL*\n\nLink channel tidak valid. Pastikan link diawali dengan https://whatsapp.com/channel/`)
    }
    
    m.react('📺')
    
    try {
        const inviteCode = text.split('https://whatsapp.com/channel/')[1]?.split(/[\s?]/)[0]
        
        if (!inviteCode) {
            m.react('❌')
            return m.reply(`❌ *GAGAL*\n\nTidak dapat mengekstrak kode invite dari link tersebut.`)
        }
        
        const metadata = await sock.newsletterMetadata('invite', inviteCode)
        
        if (!metadata?.id) {
            m.react('❌')
            return m.reply(`❌ *GAGAL*\n\nChannel tidak ditemukan atau link sudah kadaluarsa.`)
        }
        
        const saluranId = config.saluran?.id || '@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'ARCELZAI'
        
        const infoText = `*📺 INFO CHANNEL*\n\n` +
            `ID: \`${metadata.id}\`\n` +
            `Nama: ${metadata.name || 'Unknown'}\n` +
            `Subscriber: ${metadata.subscribers || 0}`
        
        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copy ID',
                    copy_code: metadata.id
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📺 Buka Channel',
                    url: text
                })
            }
        ]
        
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: infoText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© ${config.bot?.name || 'ARCELZAI'}`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: buttons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })
        
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
