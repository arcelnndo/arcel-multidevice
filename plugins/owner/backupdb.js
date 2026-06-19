const { sendStoreBackup, SCHEMA_VERSION } = require('../../src/lib/storeBackup')

const pluginConfig = {
    name: 'backupdb',
    alias: ['dbbackup', 'backupstore', 'storebackup'],
    category: 'owner',
    description: 'Backup database/store dan kirim ke owner',
    usage: '.backupdb',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const backupContents = [
        '- database/*.json (Semua file JSON)',
        '- database/cpanel/* (Data cPanel)',
        '- storage/database.json (Main database)',
        '- db.json (Root database)',
        '- database/main/*.json (Main database)',
        '- backup_metadata.json (Info schema)'
    ]
    
    await m.reply(
        `*⏳ MEMBUAT BACKUP DATABASE...*\n\n` +
        `*Data yang di-backup:*\n` +
        backupContents.join('\n')
    )
    
    const result = await sendStoreBackup(sock)
    
    if (result.success) {
        await m.reply(
            `*✅ BACKUP BERHASIL*\n\n` +
            `Ukuran File: ${result.size}\n` +
            `Total File: ${result.files}\n` +
            `Versi Schema: v${SCHEMA_VERSION}\n\n` +
            `_Catatan: Type-safe backup, kompatibel dengan update mendatang. File backup telah dikirim ke nomor Owner utama._`
        )
    } else {
        await m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan saat melakukan backup:\n${result.error}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
