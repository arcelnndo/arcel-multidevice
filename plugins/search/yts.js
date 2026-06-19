const yts = require('yt-search')

const pluginConfig = {
    name: 'yts',
    alias: ['ytsearch', 'youtubesearch'],
    category: 'search',
    description: 'Cari video di YouTube',
    usage: '.yts <query>',
    example: '.yts neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `*⚠️ CARA PAKAI*\n\n` +
            `Gunakan perintah ini untuk mencari video di YouTube.\n\n` +
            `*Format:*\n` +
            `${m.prefix}yts <pencarian>\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}yts neffex grateful`
        )
    }
    
    try {
        const search = await yts(query)
        const videos = search.videos.slice(0, 5)
        
        if (videos.length === 0) {
            return m.reply(`*❌ GAGAL*\n\nTidak ditemukan hasil pencarian untuk: ${query}`)
        }
        
        let txt = `*🔍 YOUTUBE SEARCH*\n\n`
        txt += `Hasil pencarian untuk: *${query}*\n\n`
        
        videos.forEach((v, i) => {
            txt += `*${i + 1}. ${v.title}*\n`
            txt += `Channel: ${v.author?.name || 'Unknown'}\n`
            txt += `Durasi: ${v.timestamp || '-'}\n`
            txt += `Views: ${v.views || 0}\n`
            txt += `Link: ${v.url}\n\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
