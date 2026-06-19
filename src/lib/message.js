/**
 * Credits & Thanks to
 * Developer = Nando Dev ( Arcelz )
 * Project = 261 Area
 */

const { generateWAMessageFromContent, proto } = require('ourin');
const fs = require('fs');
const path = require('path');

/**
 * Fungsi Pengiriman Pesan Dasar (Rata Kiri, Tanpa Iklan)
 */
async function sendText(sock, jid, text, options = {}) {
    return sock.sendMessage(jid, {
        text: text,
        contextInfo: {
            mentionedJid: options.mentions || [],
            // externalAdReply DIBUANG TOTAL
        }
    }, { quoted: options.quoted });
}

async function sendReply(sock, jid, text, options = {}) {
    return sendText(sock, jid, text, { ...options, quoted: options.quoted });
}

async function sendImage(sock, jid, image, caption = '', options = {}) {
    let buffer = Buffer.isBuffer(image) ? image : { url: image };
    return sock.sendMessage(jid, {
        image: buffer,
        caption: caption,
        contextInfo: { mentionedJid: options.mentions || [] }
    }, { quoted: options.quoted });
}

async function sendWithPreview(sock, jid, text, preview, options = {}) {
    // Parameter preview diabaikan biar tetap rata kiri murni teks
    return sendText(sock, jid, text, options);
}

async function sendMenu(sock, jid, text, image = null, options = {}) {
    if (image) {
        return sendImage(sock, jid, image, text, options);
    }
    return sendText(sock, jid, text, options);
}

// Fungsi pendukung lainnya biar gak error
async function sendReact(sock, jid, key, emoji) {
    return sock.sendMessage(jid, { react: { text: emoji, key: key } });
}

async function deleteMessage(sock, jid, key) {
    return sock.sendMessage(jid, { delete: key });
}

module.exports = {
    sendText,
    sendReply,
    sendImage,
    sendWithPreview,
    sendMenu,
    sendReact,
    deleteMessage,
    // Tambahin export fungsi lain milik lu di sini biar gak undefined
};
