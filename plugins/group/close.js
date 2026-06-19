const pluginConfig = {
    name: 'close',
    alias: ['tutup', 'closegroup', 'tutupgroup'],
    category: 'group',
    description: 'Menutup grup agar hanya admin yang bisa chat',
    usage: '.close',
    example: '.close',
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
        
        if (groupMeta.announce) {
            await m.reply(
                `*⚠️ INFO GRUP*\n\n` +
                `Grup ini sudah dalam keadaan tertutup sebelumnya. Saat ini hanya admin yang diperbolehkan mengirim pesan.`
            );
            return;
        }
        
        await sock.groupSettingUpdate(m.chat, 'announcement');
        
        const senderNum = m.sender.split('@')[0];
        
        const successMsg = `*🔒 GRUP BERHASIL DITUTUP*\n\n` +
            `Status: Tertutup (Closed)\n` +
            `Akses: Hanya Admin\n` +
            `Oleh: @${senderNum}\n\n` +
            `_Sekarang hanya admin yang bisa mengirim pesan di grup ini. Member biasa sementara tidak bisa mengirim pesan._`;
        
        await sock.sendMessage(m.chat, {
            text: successMsg,
            mentions: [m.sender]
        }, { quoted: m });
        
    } catch (error) {
        await m.reply(
            `*❌ ERROR*\n\n` +
            `Gagal menutup grup. Pastikan bot masih menjadi admin grup.\n` +
            `Pesan: ${error.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
