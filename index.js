/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Owner = Syura Salsabila
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 *
 * Modified by: Nando Dev (261 Area)
 */

const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  if (
    msg.includes("Closing") &&
    (msg.includes("session") || msg.includes("SessionEntry"))
  ) {
    return;
  }
  if (
    msg.includes("prekey") ||
    msg.includes("_chains") ||
    msg.includes("registrationId")
  ) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

const path = require("path");
const fs = require("fs");
const config = require("./config");
const { startConnection } = require("./src/connection");
const {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
} = require("./src/handler");
const { loadPlugins } = require("./src/lib/plugins");
const { initDatabase, getDatabase } = require("./src/lib/database");
const {
  initScheduler,
  loadScheduledMessages,
  startGroupScheduleChecker,
  startSewaChecker,
} = require("./src/lib/scheduler");
const { startAutoBackup } = require("./src/lib/backup");
const { handleAntiTagSW } = require("./src/lib/groupProtection");
const { initSholatScheduler } = require("./src/lib/sholatScheduler");
const { initAutoJpmScheduler } = require("./src/lib/autojpmScheduler");
const {
  logger,
  c,
  printBanner,
  printStartup,
  logConnection,
  logErrorBox,
  divider,
} = require("./src/lib/colors");

const startTime = Date.now();

/**
 * Setup anti-crash handlers
 */
function setupAntiCrash() {
  process.on("uncaughtException", (error) => {
    const ignoredErrors = ['write EOF', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'];
    if (ignoredErrors.some(msg => error.message?.includes(msg))) return;
    logErrorBox("Uncaught Exception", error.message);
  });

  process.on("unhandledRejection", (reason) => {
    logErrorBox("Unhandled Rejection", String(reason));
  });

  process.on("SIGINT", () => {
    const db = getDatabase();
    db.save();
    process.exit(0);
  });
}

/**
 * Fungsi utama untuk memulai bot
 */
async function main() {
  printBanner();
  printStartup({
    name: config.bot?.name || "261 Area Bot",
    version: "1.2.0",
    developer: "Nando Dev",
    mode: config.mode || "public",
  });
  setupAntiCrash();
  divider();

  logger.info("DATABASE", "Memuat database...");
  const dbPath = path.join(process.cwd(), config.database?.path || "./database/main");
  await initDatabase(dbPath);
  
  const db = getDatabase();
  const savedMode = db.setting("botMode");
  if (savedMode) config.mode = savedMode;

  if (config.backup?.enabled !== false) {
    startAutoBackup(dbPath);
  }

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("PLUGINS", `${pluginCount} plugin dimuat`);
  
  initScheduler(config);
  const bootTime = Date.now() - startTime;
  logger.success("BOOT", `Selesai dalam ${bootTime}ms`);
  divider();

  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (e) {}
    },

    onMessage: async (msg, sock) => {
      try {
        // Eksekusi handler langsung tanpa race timeout buat stabilitas panel
        await messageHandler(msg, sock);
      } catch (error) {
        logger.error("HANDLER", error.message);
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (e) {
        logger.error("GROUP", e.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (e) {
        logger.error("MSG_UPDATE", e.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (e) {
        logger.error("GROUP_SETTINGS", e.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        loadScheduledMessages(sock);
        startGroupScheduleChecker(sock);
        startSewaChecker(sock);
        initAutoJpmScheduler(sock);
        initSholatScheduler(sock);
        
        // Memulihkan sesi Jadibot (jika ada)
        try {
            const { getAllJadibotSessions, restartJadibotSession } = require('./src/lib/jadibotManager');
            const sessions = getAllJadibotSessions();
            for (const session of sessions) {
                await restartJadibotSession(sock, session.id);
            }
        } catch (e) {}

        divider();
      }
    },
  });
}

main().catch((error) => {
  logErrorBox("Fatal Error", error.message);
  process.exit(1);
});
