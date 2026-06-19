const {
  enableAutoBackup,
  disableAutoBackup,
  getBackupStatus,
  triggerManualBackup,
  formatInterval,
} = require("../../src/lib/autoBackup");
const timeHelper = require("../../src/lib/timeHelper");
const config = require("../../config");

const pluginConfig = {
  name: "autobackup",
  alias: ["backup", "ab"],
  category: "owner",
  description: "Kelola sistem auto backup",
  usage: ".autobackup <on/off/status/now> [interval]",
  example: ".autobackup on 5h",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.text?.trim().split(/\s+/) || [];
  const action = args[0]?.toLowerCase();

  if (!action) {
    const status = getBackupStatus();
    const ownerNum = config.owner?.number?.[0] || "Tidak diset";

    let txt = `*🗂️ AUTO BACKUP SYSTEM*\n\n`;
    txt += `*📊 Status Backup:*\n`;
    txt += `Status: ${status.enabled ? "✅ AKTIF" : "❌ NONAKTIF"}\n`;
    txt += `Interval: ${status.interval}\n`;
    txt += `Terakhir: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
    txt += `Total: ${status.backupCount} backup\n`;
    txt += `Dikirim ke: ${ownerNum}\n\n`;

    txt += `*Cara Pakai:*\n`;
    txt += `- \`${m.prefix}autobackup on <interval>\` (Aktifkan backup)\n`;
    txt += `- \`${m.prefix}autobackup off\` (Matikan backup)\n`;
    txt += `- \`${m.prefix}autobackup status\` (Cek info backup)\n`;
    txt += `- \`${m.prefix}autobackup now\` (Backup manual sekarang)\n\n`;

    txt += `*Format Interval:*\n`;
    txt += `\`5m\` = 5 menit\n`;
    txt += `\`1h\` = 1 jam\n`;
    txt += `\`6h\` = 6 jam\n`;
    txt += `\`1d\` = 1 hari\n\n`;

    txt += `*Contoh:*\n`;
    txt += `${m.prefix}autobackup on 6h`;

    return m.reply(txt);
  }

  switch (action) {
    case "on":
    case "enable":
    case "start": {
      const interval = args[1];

      if (!interval) {
        return m.reply(
          `*⚠️ INTERVAL DIBUTUHKAN*\n\n` +
            `Silakan tentukan interval waktu backup.\n` +
            `Format: \`${m.prefix}autobackup on <interval>\`\n\n` +
            `*Contoh:*\n` +
            `${m.prefix}autobackup on 30m (tiap 30 menit)\n` +
            `${m.prefix}autobackup on 6h (tiap 6 jam)\n` +
            `${m.prefix}autobackup on 1d (tiap 1 hari)`
        );
      }

      const result = enableAutoBackup(interval, sock);

      if (!result.success) {
        return m.reply(`*❌ GAGAL*\n\n${result.error}`);
      }

      const ownerNum = config.owner?.number?.[0] || "Owner #1";

      m.react("✅");
      return m.reply(
        `*✅ AUTO BACKUP DIAKTIFKAN*\n\n` +
          `*⚙️ Pengaturan:*\n` +
          `Interval: ${result.interval}\n` +
          `Dikirim ke: ${ownerNum}\n` +
          `Exclude: node_modules, .git, storages, dll\n\n` +
          `_Backup pertama akan dikirim dalam ${result.interval}._`
      );
    }

    case "off":
    case "disable":
    case "stop": {
      disableAutoBackup();

      m.react("✅");
      return m.reply(
        `*❌ AUTO BACKUP DINONAKTIFKAN*\n\n` +
          `Backup otomatis sudah dihentikan.\n` +
          `Gunakan perintah \`${m.prefix}autobackup on <interval>\` untuk mengaktifkannya kembali.`
      );
    }

    case "status":
    case "info": {
      const status = getBackupStatus();
      const ownerNum = config.owner?.number?.[0] || "Tidak diset";

      let txt = `*🗂️ STATUS AUTO BACKUP*\n\n`;
      txt += `Enabled: ${status.enabled ? "✅ Ya" : "❌ Tidak"}\n`;
      txt += `Interval: ${status.interval}\n`;
      txt += `Running: ${status.isRunning ? "✅ Ya" : "❌ Tidak"}\n`;
      txt += `Terakhir Backup: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
      txt += `Total Backup: ${status.backupCount} kali\n`;
      txt += `Target Pengiriman: ${ownerNum}`;

      return m.reply(txt);
    }

    case "now":
    case "manual":
    case "trigger": {
      m.react("⏳");
      await m.reply(`*⏳ MEMBUAT BACKUP...*\n\nMohon tunggu, sistem sedang membuat file backup dan akan segera mengirimkannya.`);

      try {
        await triggerManualBackup(sock);
        m.react("✅");
        return m.reply(`*✅ BACKUP SELESAI*\n\nFile backup telah berhasil dikirim ke nomor Owner!`);
      } catch (error) {
        m.react("❌");
        return m.reply(`*❌ GAGAL*\n\nTerjadi kesalahan: ${error.message}`);
      }
    }

    default:
      return m.reply(
        `*⚠️ ACTION TIDAK VALID*\n\n` +
          `Pilih salah satu opsi berikut: \`on\`, \`off\`, \`status\`, atau \`now\`.\n` +
          `Contoh: \`${m.prefix}autobackup on 6h\``
      );
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
