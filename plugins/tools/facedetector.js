const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'facedetector',
    alias: ['facedetect', 'detectface', 'deteksiwajah'],
    category: 'tools',
    description: 'Mendeteksi wajah pada gambar',
    usage: '.facedetector (reply gambar)',
    example: '.facedetector',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToTmpfiles(buffer) {
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', buffer, { filename: 'image.jpg' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
        headers: formData.getHeaders(),
        timeout: 60000
    })
    
    if (res.data?.data?.url) {
        return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Upload gagal')
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `*👁️ FACE DETECTOR*\n\n` +
            `Alat ini digunakan untuk mendeteksi letak wajah pada gambar.\n\n` +
            `*Cara pakai:*\n` +
            `Reply gambar dengan perintah \`${m.prefix}facedetector\` atau kirim gambar beserta caption \`${m.prefix}facedetector\`.`
        )
    }
    
    m.react('👁️')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer || buffer.length === 0) {
            throw new Error('Gagal mengunduh gambar.')
        }
        
        await m.reply(`*⏳ Sedang memproses gambar...*`)
        
        const imageUrl = await uploadToTmpfiles(buffer)
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key Lolhuman tidak ditemukan di konfigurasi.')
        }
        
        const apiUrl = `https://api.lolhuman.xyz/api/facedetect?apikey=${apiKey}&img=${encodeURIComponent(imageUrl)}`
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `*👁️ FACE DETECTOR*\n\nWajah berhasil dideteksi!`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
