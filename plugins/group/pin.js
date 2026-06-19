const pluginConfig = {
    name: 'pin',
    alias: ['pinmsg', 'pinpesan'],
    category: 'group',
    description: 'Pin pesan penting di grup',
    usage: '.pin (reply pesan)',
    example: '.pin',
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

async function handler(m, { sock, args }) {
    if (!m.quoted || !m.quoted.key || !m.quoted.key.id) {
        await m.reply(
            `*⚠️ PERHATIAN*\n\n` +
            `Silakan reply pesan yang ingin disematkan (pin).\n\n` +
            `*Cara Penggunaan:*\n` +
            `- Reply pesan lalu ketik \`${m.prefix}pin\`\n` +
            `- Bisa atur durasi (jam), contoh: \`${m.prefix}pin 24\``
        );
        return;
    }
    
    let duration = 86400; // Default 24 jam
    if (args && args.length > 0 && args[0]) {
        const hours = parseInt(args[0]);
        if (!isNaN(hours) && hours >= 1 && hours <= 720) {
            duration = hours * 3600;
        }
    }
    
    try {
        const pinKey = {
            remoteJid: m.chat,
            fromMe: m.quoted.key.fromMe || false,
            id: m.quoted.key.id,
            participant: m.quoted.key.participant || m.quoted.sender
        };
        
        await sock.sendMessage(m.chat, {
            pin: pinKey,
            type: 1,
            time: duration
        });
        
        const durationText = duration >= 86400 
            ? `${Math.floor(duration / 86400)} hari` 
            : `${Math.floor(duration / 3600)} jam`;
        
        const successMsg = `*📌 PESAN BERHASIL DISEMATKAN*\n\n` +
            `Durasi: ${durationText}\n` +
            `Oleh: @${m.sender.split('@')[0]}\n\n` +
            `_Pesan tersebut sekarang muncul di bagian atas percakapan grup._`;
        
        await sock.sendMessage(m.chat, {
            text: successMsg,
            mentions: [m.sender]
        }, { quoted: m });
        
    } catch (error) {
        await m.reply(
            `*❌ ERROR*\n\n` +
            `Gagal mem-pin pesan. Pastikan bot memiliki izin admin.\n` +
            `Pesan: ${error.message}`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
