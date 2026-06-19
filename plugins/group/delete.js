const pluginConfig = {
    name: 'delete',
    alias: ['del', 'hapus', 'd'],
    category: 'group',
    description: 'Hapus pesan dengan reply',
    usage: '.delete (reply pesan)',
    example: '.delete',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    isBotAdmin: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply('*⚠️ PERHATIAN*\n\nSilakan reply pesan yang ingin dihapus terlebih dahulu!')
    }
    
    const quotedSender = m.quoted.sender || m.quoted.key?.participant
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const isOwnMessage = m.quoted.key?.fromMe || quotedSender === m.sender
    const isBotMessage = quotedSender === botJid || m.quoted.key?.fromMe
    
    if (!isOwnMessage && !isBotMessage) {
        if (!m.isBotAdmin) {
            return m.reply('*⚠️ AKSES DITOLAK*\n\nBot harus menjadi admin grup untuk dapat menghapus pesan anggota lain.')
        }
        if (!m.isAdmin && !m.isOwner) {
            return m.reply('*⚠️ AKSES DITOLAK*\n\nHanya Admin atau Owner yang diizinkan menghapus pesan milik anggota lain.')
        }
    }
    
    try {
        const key = {
            remoteJid: m.chat,
            id: m.quoted.key.id,
            fromMe: m.quoted.key.fromMe,
            participant: quotedSender
        }
        
        await sock.sendMessage(m.chat, { delete: key })
        await m.react('✅')
        
    } catch (err) {
        if (err.message?.includes('not found') || err.message?.includes('forbidden')) {
            await m.reply('*❌ GAGAL MENGHAPUS*\n\nPesan tidak ditemukan atau sudah terlalu lama (melewati batas waktu hapus WhatsApp).')
        } else {
            await m.react('❌')
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
