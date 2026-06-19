/**
 * @file plugins/owner/public.js
 * @description Plugin untuk mengaktifkan mode public (semua bisa akses)
 */

const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'public',
    alias: ['publicmode', 'open'],
    category: 'owner',
    description: 'Mengaktifkan mode public (semua user bisa akses)',
    usage: '.public',
    example: '.public',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

/**
 * Handler untuk command public
 */
async function handler(m, { sock }) {
    try {
        const isRealOwner = validateOwner(m);
        if (!isRealOwner) {
            return await m.reply('*❌ AKSES DITOLAK*\n\nHanya Owner resmi yang memiliki izin untuk mengubah mode akses bot.');
        }

        const currentMode = config.mode;
        if (currentMode === 'public') {
            return await m.reply('*ℹ️ INFO*\n\nBot saat ini sudah berada dalam mode *Public*.');
        }

        config.mode = 'public';
        const db = getDatabase();
        db.setting('botMode', 'public');
        
        const responseText = `*🌐 MODE PUBLIC DIAKTIFKAN*\n\n` +
            `Sekarang bot akan merespon perintah dari semua pengguna di grup maupun private chat.\n\n` +
            `_Gunakan perintah .self jika ingin menutup akses kembali ke mode privat._`;
            
        await m.reply(responseText);
        console.log(`[Mode] Changed to PUBLIC by ${m.pushName} (${m.sender})`);
    } catch (error) {
        console.error('[Public Command Error]', error);
        await m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${error.message}`);
    }
}

/**
 * Validasi owner dengan multiple checks
 */
function validateOwner(m) {
    if (!m.isOwner) return false;
    if (m.fromMe) return true;
    const senderNumber = m.sender?.replace(/[^0-9]/g, '') || '';
    const ownerNumbers = config.owner?.number || [];
    
    const isInOwnerList = ownerNumbers.some(owner => {
        const cleanOwner = owner.replace(/[^0-9]/g, '');
        return senderNumber.includes(cleanOwner) || cleanOwner.includes(senderNumber);
    });
    if (!isInOwnerList) return false;
    if (!m.sender || !m.sender.includes('@')) return false;
    return true;
}

module.exports = {
    config: pluginConfig,
    handler
};
