const pluginConfig = {
    name: 'open',
    alias: ['buka', 'opengroup', 'bukagroup'],
    category: 'group',
    description: 'Membuka grup agar semua member bisa chat',
    usage: '.open',
    example: '.open',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata;
        
        if (!groupMeta.announce) {
            await m.reply(
                `*⚠️ INFO GRUP*\n\n` +
                `Grup ini sudah dalam keadaan terbuka. Semua anggota sudah diperbolehkan mengirim pesan.`
            );
            return;
        }
        
        await sock.groupSettingUpdate(m.chat, 'not_announcement');
        
        const senderNum = m.sender.split('@')[0];
        
        const successMsg = `*🔓 GRUP BERHASIL DIBUKA*\n\n` +
            `Status: Terbuka (Open)\n` +
            `Akses: Semua Anggota\n` +
            `Oleh: @${senderNum}\n\n` +
            `_Sekarang semua anggota sudah bisa kembali mengirim pesan di grup ini._`;
        
        await sock.sendMessage(m.chat, {
            text: successMsg,
            mentions: [m.sender]
        }, { quoted: m });
        
    } catch (error) {
        await m.reply(
            `*❌ ERROR*\n\n` +
            `Gagal membuka grup. Pastikan bot masih menjadi admin grup.\n` +
            `Pesan: ${error.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
