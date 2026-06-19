const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: ['ht', 'hidetag', 'h'],
    category: 'group',
    description: 'Hidetag dengan support reply pesan (teks/media)',
    usage: '.h [pesan] atau reply pesan',
    example: '.h atau reply pesan lalu .h',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const mentions = getParticipantJids(participants)

        const quoted = m.quoted
        const text = m.fullArgs?.trim()

        // ===== REPLY MODE =====
        if (quoted) {
            const qMsg = quoted.message || {}
            const type = Object.keys(qMsg)[0]

            // ===== IMAGE =====
            if (type === 'imageMessage') {
                const media = await quoted.download()
                const caption = qMsg.imageMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    image: media,
                    caption,
                    mentions
                })
            }

            // ===== VIDEO =====
            if (type === 'videoMessage') {
                const media = await quoted.download()
                const caption = qMsg.videoMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    video: media,
                    caption,
                    mentions
                })
            }

            // ===== STICKER =====
            if (type === 'stickerMessage') {
                const media = await quoted.download()

                await sock.sendMessage(m.chat, {
                    sticker: media,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== AUDIO =====
            if (type === 'audioMessage') {
                const media = await quoted.download()
                const audioMsg = qMsg.audioMessage || {}

                await sock.sendMessage(m.chat, {
                    audio: media,
                    mimetype: audioMsg.mimetype,
                    ptt: audioMsg.ptt || false,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== DOCUMENT =====
            if (type === 'documentMessage') {
                const media = await quoted.download()
                const docMsg = qMsg.documentMessage || {}

                await sock.sendMessage(m.chat, {
                    document: media,
                    mimetype: docMsg.mimetype,
                    fileName: docMsg.fileName || 'file',
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== TEXT / OTHER =====
            const quotedText =
                quoted.text ||
                qMsg.conversation ||
                qMsg.extendedTextMessage?.text ||
                ''

            const finalText = text || quotedText

            if (!finalText) {
                return m.reply('*❌ GAGAL*\n\nTidak ada pesan atau teks yang bisa dikirim.')
            }

            return sock.sendMessage(m.chat, {
                text: finalText,
                mentions
            })
        }

        if (!text) {
            return m.reply(
                `*📢 INFORMASI HIDETAG*\n\n` +
                `- Reply pesan lalu ketik \`${m.prefix}h\`\n` +
                `- Atau ketik langsung \`${m.prefix}h <pesan>\`\n\n` +
                `Fitur ini mendukung: Teks, Gambar, Video, Sticker, Audio, dan Dokumen.`
            )
        }

        await sock.sendMessage(m.chat, {
            text,
            mentions
        })

    } catch (err) {
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
