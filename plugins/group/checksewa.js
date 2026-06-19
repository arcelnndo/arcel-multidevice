const { getDatabase } = require("../../src/lib/database");
const timeHelper = require("../../src/lib/timeHelper");

const pluginConfig = {
  name: "checksewa",
  alias: ["ceksewa", "sisasewa"],
  category: "group",
  description: "Cek sisa waktu sewa bot di grup ini",
  usage: ".checksewa",
  example: ".checksewa",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function formatCountdown(expiredAt) {
  const diff = expiredAt - Date.now();
  if (diff <= 0) return { text: "EXPIRED", expired: true };

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  let text = "";
  if (days > 0) text += `${days} hari `;
  if (hours > 0) text += `${hours} jam `;
  if (minutes > 0 && days === 0) text += `${minutes} menit`;

  return { text: text.trim(), expired: false };
}

async function handler(m) {
  const db = getDatabase();

  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} };
    db.db.write();
  }

  if (!db.db.data.sewa.enabled) {
    return m.reply(`*ℹ️ INFO*\n\nSistem sewa bot saat ini sedang tidak diaktifkan oleh Owner.`);
  }

  const sewaData = db.db.data.sewa.groups[m.chat];

  if (!sewaData) {
    return m.reply(
      `*❌ TIDAK TERDAFTAR*\n\nGrup ini tidak terdaftar dalam database sistem sewa resmi. Silakan hubungi Owner untuk melakukan pendaftaran agar bot tidak leave otomatis.`
    );
  }

  if (sewaData.isLifetime) {
    m.react("♾️");
    return m.reply(
      `*♾️ STATUS SEWA PERMANEN*\n\n` +
        `Grup: ${sewaData.name || m.chat.split("@")[0]}\n` +
        `Masa Aktif: Selamanya (Lifetime)\n\n` +
        `_Bot akan tetap berada di grup ini tanpa batas waktu._`
    );
  }

  const countdown = formatCountdown(sewaData.expiredAt);
  const expiredStr = timeHelper.fromTimestamp(sewaData.expiredAt, "D MMMM YYYY HH:mm");

  if (countdown.expired) {
    return m.reply(
      `*❌ MASA SEWA HABIS*\n\n` +
        `Masa sewa untuk grup ini telah berakhir.\n` +
        `Waktu Selesai: ${expiredStr}\n\n` +
        `_Silakan hubungi Owner untuk memperpanjang masa sewa._`
    );
  }

  m.react("⏱️");
  return m.reply(
    `*⏱️ INFORMASI SISA SEWA*\n\n` +
      `Grup: ${sewaData.name || m.chat.split("@")[0]}\n` +
      `Sisa Waktu: ${countdown.text}\n` +
      `Tanggal Berakhir: ${expiredStr}\n\n` +
      `_Pastikan melakukan perpanjangan sebelum masa sewa berakhir._`
  );
}

module.exports = {
  config: pluginConfig,
  handler,
};
