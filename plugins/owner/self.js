/**
 * @file plugins/owner/self.js
 * @description Plugin untuk mengaktifkan mode self (hanya owner & bot)
 */

const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'self',
    alias: ['selfmode', 'private-mode'],
    category: 'owner',
    description: 'Mengaktifkan mode self (hanya owner & bot yang bisa akses)',
    usage: '.self',
    example: '.self',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

/**
 * Handler untuk command self
 */
async function handler(m, { sock }) {
    try {
        const isRealOwner = validateOwner(m);
        if (!isRealOwner) {
            return await m.reply('*❌ AKSES DITOLAK*\n\nHanya Owner resmi yang memiliki izin untuk mengubah mode akses bot.');
        }

        const currentMode = config.mode;
        if (currentMode === 'self') {
            return await m.reply('*ℹ️ INFO*\n\nBot saat ini sudah berada dalam mode *Self*.');
        }

        config.mode = 'self';
        const db = getDatabase();
        db.setting('botMode', 'self');
        
        const responseText = `*🔒 MODE SELF DIAKTIFKAN*\n\n` +
            `Sekarang bot hanya akan merespon perintah dari:\n` +
            `- Owner Bot\n` +
            `- Bot Sendiri (Internal)\n\n` +
            `_Gunakan perintah .public jika ingin membuka akses untuk semua pengguna._`;
            
        await m.reply(responseText);
        console.log(`[Mode] Changed to SELF by ${m.pushName} (${m.sender})`);
    } catch (error) {
        console.error('[Self Command Error]', error);
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
