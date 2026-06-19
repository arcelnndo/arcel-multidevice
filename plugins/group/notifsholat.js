const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'notifsholat',
    alias: ['notifsolat'],
    category: 'group',
    description: 'Mengatur pengingat waktu sholat di grup ini',
    usage: '.notifsholat on/off',
    example: '.notifsholat on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
};

async function handler(m, { sock, db }) {
    // Validasi admin
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`*❌ AKSES DITOLAK*\n\nHanya admin grup yang memiliki izin untuk mengubah pengaturan notifikasi sholat.`);
    }

    const args = m.args[0]?.toLowerCase();
    const group = db.getGroup(m.chat) || {};
    const globalDb = getDatabase();
    const kotaSetting = globalDb.setting('autoSholatKota') || { nama: 'KOTA JAKARTA' };

    if (!['on', 'off'].includes(args)) {
        const status = group.notifSholat !== false ? '✅ Aktif' : '❌ Nonaktif';
        return m.reply(
            `*🕌 PENGATURAN NOTIFIKASI SHOLAT*\n\n` +
            `Status Saat Ini: ${status}\n` +
            `Wilayah Pantauan: ${kotaSetting.nama}\n\n` +
            `*Cara Mengaktifkan:*\n` +
            `- \`${m.prefix}notifsholat on\` (Aktifkan)\n` +
            `- \`${m.prefix}notifsholat off\` (Nonaktifkan)`
        );
    }

    if (args === 'on') {
        group.notifSholat = true;
        db.setGroup(m.chat, group);
        return m.reply(
            `*✅ NOTIFIKASI DIAKTIFKAN*\n\n` +
            `Bot akan mengirimkan pengingat waktu sholat secara otomatis di grup ini.\n` +
            `Wilayah: ${kotaSetting.nama}`
        );
    }

    if (args === 'off') {
        group.notifSholat = false;
        db.setGroup(m.chat, group);
        return m.reply(
            `*❌ NOTIFIKASI DINONAKTIFKAN*\n\n` +
            `Pengingat waktu sholat untuk grup ini berhasil dimatikan.`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
