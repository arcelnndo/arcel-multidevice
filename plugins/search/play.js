const yts = require("yt-search")
const axios = require("axios")
const config = require("../../config")

const pluginConfig = {
    name: "play",
    alias: ["playaudio"],
    category: "search",
    description: "Cari dan putar musik dari YouTube",
    usage: ".play <query>",
    example: ".play komang",
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query) {
        return m.reply(`*🎵 YOUTUBE PLAY*\n\nMasukkan judul lagu yang ingin dicari.\nContoh: \`${m.prefix}play nando medek\``)
    }

    m.react("🎧")

    try {
        const search = await yts(query)
        if (!search.videos.length) throw new Error("Video tidak ditemukan")
        
        const video = search.videos[0]
        
        // Membatasi maksimal 10 hasil agar pesan interaktif tidak error/oversize
        const rows = search.videos.slice(0, 10).map((v) => {
            return {
                header: v.title,
                title: v.author.name,
                description: `Durasi: ${v.timestamp} | Views: ${v.views}`,
                id: `${m.prefix}putar-play ${v.url}`
            }
        })

        const caption = 
            `*🎵 YOUTUBE PLAY*\n\n` +
            `Halo ${m.pushName || 'User'},\n` +
            `Berikut adalah hasil pencarian untuk lagumu:\n\n` +
            `Judul: ${video.title}\n` +
            `Channel: ${video.author.name}\n` +
            `Durasi: ${video.timestamp}\n\n` +
            `Klik tombol *▶️ Putar Musik* di bawah ini untuk mendengarkan, atau pilih versi lain melalui daftar menu.`

        await sock.sendMessage(m.chat, {
            image: { url: video.thumbnail },
            caption: caption,
            footer: `© ${config.bot?.name || 'ARCELZAI'}`,
            interactiveButtons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '▶️ Putar Musik',
                        id: `${m.prefix}putar-play ${video.url}`
                    })
                },
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Pilih Lagu Lain',
                        sections: [
                            {
                                title: 'Hasil Pencarian Serupa',
                                rows: rows
                            }
                        ]
                    })
                }
            ]
        }, { quoted: m })

        m.react("✅")

    } catch (err) {
        console.error('[Play]', err)
        m.react("❌")
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${err.message || err}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
