/**
 * Credits & Thanks to
 * Developer = Nando Dev / Nanz Dev
 * Project = 261 Area
 */

const config = require("../config");
const { serialize } = require("./lib/serialize");
const { getPlugin, getPluginCount, getAllPlugins } = require("./lib/plugins");
const { findSimilarCommands } = require("./lib/similarity");
const { getDatabase } = require("./lib/database");
const { createErrorMessage } = require("./lib/formatter");
const { getUptime } = require("./connection");
const { logger, logMessage, logCommand } = require("./lib/colors");
const { handleAntilink, handleAntiRemove, cacheMessageForAntiRemove } = require("./lib/groupProtection");
const { debounceMessage } = require("./lib/performanceOptimizer");
const fs = require("fs");
const path = require("path");

/**
 * Main Message Handler
 */
async function messageHandler(msg, sock, options = {}) {
    try {
        const m = await serialize(sock, msg);
        if (!m || !m.message) return;

        const db = getDatabase();
        if (!db?.ready) return;

        // Debounce biar gak double execute
        const msgKey = `${sock.user.id}_${m.chat}_${m.sender}_${m.id}`;
        if (debounceMessage(msgKey)) return;

        // Auto Read
        if (config.features?.autoRead) sock.readMessages([m.key]).catch(() => {});

        // Log Ke Terminal
        logMessage({
            chatType: m.isGroup ? "group" : "private",
            pushName: m.pushName || "User",
            message: m.body
        });

        // Mode Check (Public/Self)
        const mode = db.setting("botMode") || config.mode || "public";
        if (mode === "self" && !m.fromMe && !m.isOwner) return;

        // Group Protections
        if (m.isGroup) {
            cacheMessageForAntiRemove(m, sock, db);
            if (await handleAntilink(m, sock, db)) return;
        }

        // Auto AI & Smart Triggers (Simple Rata Kiri)
        if (!m.isCommand) {
            const text = m.body?.toLowerCase();
            if (text === 'p') return m.reply('Halo, budayakan salam ya.');
            if (text === 'bot') return m.reply('Bot aktif. Ketik .menu untuk bantuan.');
            return;
        }

        // Plugin Execution
        const plugin = getPlugin(m.command);
        if (!plugin) {
            // Suggestion System Sederhana
            const allCommands = []; // Ambil dari pluginStore jika perlu
            const suggestions = findSimilarCommands(m.command, allCommands, { minSimilarity: 0.6 });
            if (suggestions.length > 0) {
                return m.reply(`*❌ COMMAND TIDAK ADA*\nMungkin maksud kamu: *${m.prefix}${suggestions[0]}*`);
            }
            return;
        }

        // Execute
        logCommand(`${m.prefix}${m.command}`, m.pushName, m.isGroup ? "group" : "private");
        const context = { sock, m, config, db, uptime: getUptime() };
        await plugin.handler(m, context);

    } catch (error) {
        logger.error("Handler Error", error.message);
    }
}

/**
 * Group Participant Update (Welcome/Promote/Demote)
 */
async function groupHandler(update, sock) {
    const { id, participants, action } = update;
    const db = getDatabase();
    const groupData = db.getGroup(id) || {};

    for (let jid of participants) {
        if (action === "promote" && groupData.notifPromote) {
            await sock.sendMessage(id, { text: `*👑 PROMOTE*\n@${jid.split("@")[0]} sekarang Admin.`, mentions: [jid] });
        }
        if (action === "demote" && groupData.notifDemote) {
            await sock.sendMessage(id, { text: `*📉 DEMOTE*\n@${jid.split("@")[0]} bukan Admin lagi.`, mentions: [jid] });
        }
        // Tambahkan logic Welcome/Goodbye di sini jika perlu
    }
}

/**
 * Message Update (Edit/Anti-Delete)
 */
async function messageUpdateHandler(updates, sock) {
    const db = getDatabase();
    for (const update of updates) {
        await handleAntiRemove(update, sock, db);
    }
}

/**
 * Group Settings Update (Buka/Tutup)
 */
async function groupSettingsHandler(update, sock) {
    const { id, announce } = update;
    if (announce === undefined) return;
    const text = announce ? "*🔒 GRUP DITUTUP*" : "*🔓 GRUP DIBUKA*";
    await sock.sendMessage(id, { text: text + "\nSekarang semua member bisa chat." });
}

// Checkers
function checkPermission(m, pluginConfig) {
    if (pluginConfig.isOwner && !m.isOwner) return { allowed: false, reason: "Owner only!" };
    if (pluginConfig.isGroup && !m.isGroup) return { allowed: false, reason: "Group only!" };
    return { allowed: true };
}

module.exports = {
    messageHandler,
    groupHandler,
    messageUpdateHandler,
    groupSettingsHandler,
    checkPermission
};
