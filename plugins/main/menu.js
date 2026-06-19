const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('ourin');
const { default: axios } = require('axios');

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

// Fungsi ini diubah agar mengembalikan teks uppercase biasa tanpa font alay
function toSmallCaps(text) {
    return text.toUpperCase();
}

function formatTime(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatTime('HH:mm');
}

function formatDateShort(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatFull('dddd, DD MMMM YYYY');
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const timeHelper = require('../../src/lib/timeHelper');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    const { getCaseCount, getCasesByCategory } = require('../../case/ourin');
    const totalCases = getCaseCount();
    const casesByCategory = getCasesByCategory();
    
    const totalFeatures = totalCommands + totalCases;
    
    let userRole = 'User';
    if (m.isOwner) userRole = 'Owner';
    else if (m.isPremium) userRole = 'Premium';
    
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    
    let txt = `Hai @${m.pushName || "User"},\n\n`;
    txt += `Aku ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}, siap membantu kamu.\n\n`;

    txt += `*BOT INFO*\n`;
    txt += `- Nama: ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n`;
    txt += `- Versi: v${botConfig.bot?.version || '1.2.0'}\n`;
    txt += `- Mode: ${(botConfig.mode || 'public').toUpperCase()}\n`;
    txt += `- Prefix: [ ${prefix} ]\n`;
    txt += `- Uptime: ${uptimeFormatted}\n`;
    txt += `- Total: ${totalUsers} Users\n\n`;

    txt += `*USER INFO*\n`;
    txt += `- Nama: ${m.pushName}\n`;
    txt += `- Role: ${userRole}\n`;
    txt += `- Limit: ${m.isOwner || m.isPremium ? 'Unlimited' : (user?.limit ?? 25)}\n`;
    txt += `- Waktu: ${timeStr} WIB\n\n`;
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm', 'pushkontak', 'panel', 'store'];
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    };
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    };
    
    try {
        const botmodePlugin = require('../group/botmode');
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES;
            modeAllowedMap = {};
            modeExcludeMap = {};
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories;
                modeExcludeMap[key] = val.excludeCategories;
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode];
    const excludeCategories = modeExcludeMap[botMode] || [];
    
    txt += `*DAFTAR MENU*\n`;
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue;
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
        
        const pluginCmds = commandsByCategory[category] || [];
        const caseCmds = casesByCategory[category] || [];
        const totalCmds = pluginCmds.length + caseCmds.length;
        if (totalCmds === 0) continue;
        
        txt += `- ${prefix}menucat ${category}\n`;
    }
    return txt;
}

function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranId = botConfig.saluran?.id || '@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
    const saluranLink = botConfig.saluran?.link || '';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
            body: `v${botConfig.bot?.version || '1.2.0'} • ${(botConfig.mode || 'public').toUpperCase()}`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail
        }
    };
    
    if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
    return ctx;
}

function getVerifiedQuoted(botConfig) {
    return {
        key: {
            participant: `0@s.whatsapp.net`,
            remoteJid: `status@broadcast`
        },
        message: {
            'contactMessage': {
                'displayName': botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ',
                'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                sendEphemeral: true
            }
        }
    }  
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);
    
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg');
    const videoPath = path.join(process.cwd(), 'assets', 'video', 'ourin.mp4');
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                const msgV2 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                
                let contextThumb = thumbBuffer;
                try {
                    const ourinPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
                    if (fs.existsSync(ourinPath)) {
                        contextThumb = fs.readFileSync(ourinPath);
                    }
                } catch (e) {}
                
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `No Pain No Gain`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 4:
                if (videoBuffer) {
                    await sock.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: text,
                        gifPlayback: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } else {
                    const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                    else { fallback.text = text; }
                    await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 5:
                const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '@newsletter';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => text.toUpperCase();
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    categoryRows.push({
                        title: cat.toUpperCase(),
                        id: `${prefix}menucat ${cat}`,
                        description: `${cmds.length} commands`
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                
                const uptimeFormatted = formatUptime(uptime);
                
                let headerText = `*@${m.pushName || "User"}*\n\n`;
                headerText += `Aku ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}, siap bantu kamu.\n\n`;
                headerText += `*BOT INFO*\n`;
                headerText += `- Nama: ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n`;
                headerText += `- Versi: v${botConfig.bot?.version || '1.2.0'}\n`;
                headerText += `- Mode: ${(botConfig.mode || 'public').toUpperCase()}\n`;
                headerText += `- Uptime: ${uptimeFormatted}\n`;
                headerText += `- Total Cmd: ${totalCmds}\n\n`;
                headerText += `Pilih kategori di bawah untuk melihat daftar command.`;
                
                try {
                    const { generateWAMessageFromContent, proto } = require('ourin');
                    
                    const buttons = [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: 'Pilih Kategori',
                                sections: [{
                                    title: 'Daftar Kategori',
                                    rows: categoryRows
                                }]
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Total Semua Fitur',
                                id: `${prefix}totalfitur`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Semua Menu',
                                id: `${prefix}allmenu`
                            })
                        }
                    ];
                    
                    let headerMedia = null;
                    if (imageBuffer) {
                        try {
                            const { prepareWAMessageMedia } = require('ourin');
                            headerMedia = await prepareWAMessageMedia({
                                image: imageBuffer
                            }, {
                                upload: sock.waUploadToServer
                            });
                        } catch (e) {}
                    }
                    
                    const msg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: headerText
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'} | ${sortedCats.length} Categories`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttons
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranId,
                                            newsletterName: saluranName,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    
                } catch (btnError) {
                    console.error('[Menu V5] Button error:', btnError.message);
                    
                    let catListText = `*KATEGORI MENU*\n\n`;
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        catListText += `- ${prefix}menucat ${cat} (${cmds.length})\n`;
                    }
                    
                    const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackMsg.image = imageBuffer; fallbackMsg.caption = headerText + '\n\n' + catListText; }
                    else { fallbackMsg.text = headerText + '\n\n' + catListText; }
                    await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 6:
                // ... logic document standard sama dengan aslinya (dibersihkan fileName)
                const thumbPathV6 = path.join(process.cwd(), 'assets', 'images', 'ourin3.jpg');
                const saluranIdV6 = botConfig.saluran?.id || '@newsletter';
                const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                const saluranLinkV6 = botConfig.saluran?.link || 'https://';
                
                let bannerThumbV6 = null;
                try {
                    const sourceBuffer = fs.existsSync(thumbPathV6) ? fs.readFileSync(thumbPathV6) : (thumbBuffer || imageBuffer);
                    if (sourceBuffer) {
                        bannerThumbV6 = await sharp(sourceBuffer).resize(200, 200, { fit: 'inside' }).jpeg({ quality: 90 }).toBuffer();
                    }
                } catch (e) { bannerThumbV6 = thumbBuffer; }
                
                const contextInfoV6 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: { newsletterJid: saluranIdV6, newsletterName: saluranNameV6, serverMessageId: 127 },
                    externalAdReply: {
                        title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', body: `v${botConfig.bot?.version || '1.0.1'} • Fast Response Bot`,
                        sourceUrl: saluranLinkV6, mediaType: 1, showAdAttribution: false, renderLargerThumbnail: true, thumbnail: thumbBuffer || imageBuffer
                    }
                };
                
                try {
                    await sock.sendMessage(m.chat, {
                        document: imageBuffer || Buffer.from('ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ Menu'),
                        mimetype: 'application/pdf',
                        fileName: `Menu System`,
                        fileLength: 9999999999,
                        caption: text,
                        jpegThumbnail: bannerThumbV6,
                        contextInfo: contextInfoV6
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } catch (e) {
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; } else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 7:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV7 = botConfig.command?.prefix || '.';
                    const categoriesV7 = getCategories();
                    const commandsByCategoryV7 = getCommandsByCategory();
                    const categoryOrderV7 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];
                    
                    const modeAllowedMapV7 = { md: null, cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'], store: ['main', 'group', 'sticker', 'owner', 'store'], pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak'] };
                    const modeExcludeMapV7 = { md: ['panel', 'pushkontak', 'store'], cpanel: null, store: null, pushkontak: null };
                    
                    const allowedCatsV7 = modeAllowedMapV7[botMode];
                    const excludeCatsV7 = modeExcludeMapV7[botMode] || [];
                    
                    const sortedCatsV7 = categoriesV7.sort((a, b) => {
                        const indexA = categoryOrderV7.indexOf(a);
                        const indexB = categoryOrderV7.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const carouselCards = [];
                    
                    for (const cat of sortedCatsV7) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowedCatsV7 && !allowedCatsV7.includes(cat.toLowerCase())) continue;
                        if (excludeCatsV7 && excludeCatsV7.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategoryV7[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        let cardBody = ``;
                        for (const cmd of cmds.slice(0, 15)) {
                            cardBody += `- ${prefixV7}${cmd}\n`;
                        }
                        if (cmds.length > 15) {
                            cardBody += `\n...dan ${cmds.length - 15} command lainnya`;
                        }
                        cardBody += `\n\nTotal: ${cmds.length} commands`;
                        
                        let cardMedia = null;
                        try {
                            const defaultV7Path = path.join(process.cwd(), 'assets', 'images', 'ourin-v7.jpg');
                            let sourceImage = fs.existsSync(defaultV7Path) ? fs.readFileSync(defaultV7Path) : thumbBuffer;
                            
                            if (sourceImage) {
                                const resizedImage = await sharp(sourceImage).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
                                cardMedia = await prepareWAMessageMedia({ image: resizedImage }, { upload: sock.waUploadToServer });
                            }
                        } catch (e) {}
                        
                        const cardMessage = {
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: cat.toUpperCase(),
                                hasMediaAttachment: !!cardMedia,
                                ...(cardMedia || {})
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({ text: cardBody }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: `${botConfig.bot?.name || 'Ourin'} • ${cat}` }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: `Lihat ${cat.toUpperCase()}`,
                                        id: `${prefixV7}menucat ${cat}`
                                    })
                                }]
                            })
                        };
                        carouselCards.push(cardMessage);
                    }
                    
                    if (carouselCards.length === 0) { await m.reply(text); break; }
                    
                    const msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `Hai ${m.pushName},\n\nGeser untuk melihat kategori menu, atau ketuk tombol untuk melihat detail.`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `${botConfig.bot?.name || 'Ourin'} v${botConfig.bot?.version || '1.0'}`
                                    }),
                                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: carouselCards })
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    
                } catch (carouselError) {
                    const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV7.image = imageBuffer; fallbackV7.caption = text; } else { fallbackV7.text = text; }
                    await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 8:
                const timeHelperV8 = require('../../src/lib/timeHelper');
                const timeV8 = timeHelperV8.formatTime('HH:mm');
                const dateV8 = timeHelperV8.formatFull('DD/MM/YYYY');
                const userV8 = db.getUser(m.sender);
                const uptimeV8 = formatUptime(uptime);
                
                const categoriesV8 = getCategories();
                const cmdsByCatV8 = getCommandsByCategory();
                let totalCmdV8 = 0;
                for (const cat of categoriesV8) { totalCmdV8 += (cmdsByCatV8[cat] || []).length; }
                
                let roleV8 = 'User';
                if (m.isOwner) roleV8 = 'Owner';
                else if (m.isPremium) roleV8 = 'Premium';
                
                const prefixV8 = botConfig.command?.prefix || '.';
                const catOrderV8 = ['main', 'ai', 'download', 'search', 'tools', 'fun', 'game', 'sticker', 'canvas', 'group', 'media', 'user', 'rpg', 'owner'];
                const sortedCatsV8 = [...categoriesV8].sort((a, b) => {
                    const iA = catOrderV8.indexOf(a.toLowerCase());
                    const iB = catOrderV8.indexOf(b.toLowerCase());
                    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
                });
                
                let menuV8 = `${botConfig.bot?.name?.toUpperCase() || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n\n`;
                
                menuV8 += `*PROFILE*\n`;
                menuV8 += `- Nama: ${m.pushName}\n`;
                menuV8 += `- Role: ${roleV8}\n`;
                menuV8 += `- Waktu: ${timeV8} WIB\n`;
                menuV8 += `- Tanggal: ${dateV8}\n\n`;
                
                menuV8 += `*SYSTEM STATS*\n`;
                menuV8 += `- Limit: ${m.isOwner || m.isPremium ? 'Unlimited' : `${userV8?.limit ?? 25}/25`}\n`;
                menuV8 += `- Uptime: ${uptimeV8}\n`;
                menuV8 += `- Mode: ${botMode.toUpperCase()}\n`;
                menuV8 += `- Total Cmd: ${totalCmdV8}\n`;
                menuV8 += `- Users: ${db.getUserCount()} Aktif\n\n`;
                
                menuV8 += `*COMMAND LIST*\n\n`;
                
                const excludeV8 = ['panel', 'pushkontak', 'store'];
                
                for (const cat of sortedCatsV8) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (excludeV8.includes(cat.toLowerCase())) continue;
                    
                    const cmdsV8 = cmdsByCatV8[cat] || [];
                    if (cmdsV8.length === 0) continue;
                    
                    menuV8 += `*[ ${cat.toUpperCase()} ]*\n`;
                    for (const cmd of cmdsV8) {
                        menuV8 += `- ${prefixV8}${cmd}\n`;
                    }
                    menuV8 += `\n`;
                }
                
                let thumbV8 = thumbBuffer;
                if (thumbBuffer) {
                    try { thumbV8 = await sharp(thumbBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer(); } catch (e) {}
                }
                
                const ftroliQuoted = {
                    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            orderId: '1337', thumbnail: thumbV8 || null, itemCount: totalCmdV8, status: 'INQUIRY', surface: 'CATALOG',
                            message: `${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'} Menu`, orderTitle: `Menu System`,
                            sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                            token: 'ourin-menu-v8', totalAmount1000: 0, totalCurrencyCode: 'IDR',
                            contextInfo: { isForwarded: true, forwardingScore: 9999, forwardedNewsletterMessageInfo: { newsletterJid: botConfig.saluran?.id || '@newsletter', newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', serverMessageId: 127 } }
                        }
                    }
                };
                
                await sock.sendMessage(m.chat, {
                    image: fs.existsSync('assets/images/ourin-v8.jpg') ? fs.readFileSync('assets/images/ourin-v8.jpg') : imageBuffer,
                    caption: menuV8,
                    contextInfo: getContextInfo(botConfig, m, imageBuffer, true)
                }, { quoted: ftroliQuoted });
                break;
                
            case 9:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV9 = botConfig.command?.prefix || '.';
                    const categoriesV9 = getCategories();
                    const cmdsByCatV9 = getCommandsByCategory();
                    const saluranIdV9 = botConfig.saluran?.id || '@newsletter';
                    const saluranNameV9 = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                    const saluranLinkV9 = botConfig.saluran?.link || 'https://';
                    
                    const zannerz = "https://wa.me/" + config.owner?.number?.[0]
                    
                    const buttonsV9 = [
                        { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Hubungi Owner", url: zannerz, merchant_url: zannerz }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tampilkan Semua Menu", id: `${m.prefix}allmenu` }) }
                    ];
                    
                    let headerMediaV9 = null;
                    if (imageBuffer) {
                        try {
                            const resizedV9 = await sharp(fs.readFileSync('./assets/images/ourin-v9.jpg')).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
                            headerMediaV9 = await prepareWAMessageMedia({ image: resizedV9 }, { upload: sock.waUploadToServer });
                        } catch (e) {}
                    }
                    
                    const msgV9 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: text }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'} v${botConfig.bot?.version || '1.9.0'}` }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: !!headerMediaV9, ...(headerMediaV9 || {}) }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: { text: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', url: saluranLinkV9, copy_code: botConfig.owner?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', expiration_time: Date.now() * 999 },
                                            bottom_sheet: { in_thread_buttons_energi: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', button_title: 'Pilih Kategori' },
                                        }),
                                        buttons: buttonsV9
                                    }),
                                    contextInfo: { mentionedJid: [m.sender], forwardingScore: 9999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranIdV9, newsletterName: saluranNameV9, serverMessageId: 127 } }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV9.message, { messageId: msgV9.key.id });
                    
                } catch (v9Error) {
                    const fallbackV9 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV9.image = imageBuffer; fallbackV9.caption = text; } else { fallbackV9.text = text; }
                    await sock.sendMessage(m.chat, fallbackV9, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 10:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const saluranIdV10 = botConfig.saluran?.id || '@newsletter';
                    const saluranNameV10 = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                    const uptimeFmtV10 = formatUptime(uptime);
                    
                    let productImageV10 = null;
                    try {
                        const imgPathV10 = path.join(process.cwd(), 'assets', 'images', 'ourin-v9.jpg');
                        const imgBufferV10 = fs.existsSync(imgPathV10) ? fs.readFileSync(imgPathV10) : (imageBuffer || thumbBuffer);
                        if (imgBufferV10) {
                            const resizedV10 = await sharp(imgBufferV10).resize(736, 890, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
                            productImageV10 = await prepareWAMessageMedia({ image: resizedV10 }, { upload: sock.waUploadToServer });
                        }
                    } catch (e) {}
                    
                    const footerTextV10 = `Hai @${m.pushName || "User"},\n\nAku ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}, bot WhatsApp yang siap membantu kamu.\n\n` +
                        `INFO SYSTEM:\n- Nama: ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n- Versi: v${botConfig.bot?.version || '1.9.0'}\n` +
                        `- Uptime: ${uptimeFmtV10}\n- Owner: ${botConfig.owner?.name || 'Admin'}\n\n` +
                        `Klik tombol di bawah untuk menampilkan menu`;
                    
                    const buttonsV10 = [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'Tampilkan Menu',
                            id: `${m.prefix}allmenu`,
                        })
                    }];
                    
                    const businessJid = botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : (m.botJid || sock.user?.id);
                    
                    const msgV10 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'} Menu`,
                                        hasMediaAttachment: !!productImageV10,
                                        productMessage: {
                                            product: { productImage: productImageV10?.imageMessage || null, productId: 'MenuSystem', title: 'Menu', description: 'Menu', currencyCode: 'IDR', priceAmount1000: '0', retailerId: botConfig.bot?.name || 'Ourin', productImageCount: 1 },
                                            businessOwnerJid: businessJid
                                        }
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}` }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footerTextV10 }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: buttonsV10 }),
                                    contextInfo: { mentionedJid: [m.sender], forwardingScore: 9999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranIdV10, newsletterName: saluranNameV10, serverMessageId: 127 } }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV10.message, { messageId: msgV10.key.id });
                    
                } catch (v10Error) {
                    const fallbackV10 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV10.image = imageBuffer; fallbackV10.caption = text; } else { fallbackV10.text = text; }
                    await sock.sendMessage(m.chat, fallbackV10, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 11:
                try {
                    const saluranIdV11 = botConfig.saluran?.id || '@newsletter';
                    const saluranNameV11 = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                    const docuThumbV11 = thumbBuffer || imageBuffer || fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin-allmenu.jpg'));
                    const prefix = botConfig.command?.prefix || '.';
                    
                    const categories = getCategories();
                    const commandsByCategory = getCommandsByCategory();
                    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                    
                    const sortedCats = [...categories].sort((a, b) => {
                        const indexA = categoryOrder.indexOf(a);
                        const indexB = categoryOrder.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const categoryRows = [];
                    const excludeCats = ['panel', 'pushkontak', 'store'];
                    
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (excludeCats.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        categoryRows.push({
                            header: `MENU ${cat.toUpperCase()}`,
                            id: `${prefix}menucat ${cat}`,
                            title: `Berisi ${cmds.length} Perintah`,
                            description: 'Buka menu kategori ini'
                        });
                    }
                    
                    let totalCmds = 0;
                    for (const cat of categories) { totalCmds += (commandsByCategory[cat] || []).length; }
                    
                    const menuBody = `Halo @${m.pushName},\nTerima kasih telah menggunakan layanan kami.\n\n` +
                        `INFORMASI BOT:\n- Nama Bot: ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}\n- Prefix: ${prefix}\n` +
                        `- Total Perintah: ${totalCmds}\n- Role Kamu: ${m.isOwner ? 'Owner' : m.isPremium ? "Premium" : "User Biasa"}\n\n` +
                        `Silahkan tekan tombol di bawah untuk memilih menu.`;

                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: menuBody,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'application/pdf',
                            fileName: `Menu System`,
                            jpegThumbnail: await sharp(docuThumbV11).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: { mentionedJid: [m.sender], forwardingScore: 777, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranIdV11, newsletterName: saluranNameV11, serverMessageId: 127 } },
                            externalAdReply: { title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', body: "Runtime: " + process.uptime() + "s", mediaType: 1, thumbnail: fs.readFileSync('./assets/images/ourin-v11.jpg') || '', mediaUrl: botConfig.saluran?.url || 'https://whatsapp.com', sourceUrl: botConfig.saluran?.url || 'https://whatsapp.com', renderLargerThumbnail: true },
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    limited_time_offer: { text: `Gunakan bot dengan bijak`, url: botConfig.saluran?.url || 'https://whatsapp.com', copy_code: botConfig.bot?.name || 'Ourin', expiration_time: Date.now() * 999 },
                                    bottom_sheet: { in_thread_buttons_limit: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: "Pilih Menu", button_title: "Pilih Kategori Menu" }
                                }),
                                buttons: [
                                    { name: "single_select", buttonParamsJson: JSON.stringify({ title: "Pilihan Menu", sections: [{ title: "Daftar Kategori", rows: categoryRows }] }) },
                                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Kunjungi Saluran', url: botConfig.saluran?.url || 'https://whatsapp.com', merchant_url: botConfig.saluran?.url || 'https://whatsapp.com' }) },
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Lihat Semua Menu', id: `${m.prefix}allmenu` }) }
                                ]
                            }
                        }
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v11Error) {
                    const fallbackV11 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV11.image = imageBuffer; fallbackV11.caption = text; } else { fallbackV11.text = text; }
                    await sock.sendMessage(m.chat, fallbackV11, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;

            case 12:
                try {
                    const saluranIdV12 = botConfig.saluran?.id || '@newsletter';
                    const saluranNameV12 = botConfig.saluran?.name || botConfig.bot?.name || 'ɴᴀɴᴅᴏ ᴅᴇᴠ | ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ';
                    const docuThumbV12 = thumbBuffer || imageBuffer || fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin-allmenu.jpg'));
                    const prefix = botConfig.command?.prefix || '.';
                    
                    const categories = getCategories();
                    const commandsByCategory = getCommandsByCategory();
                    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                    
                    const sortedCats = [...categories].sort((a, b) => {
                        const indexA = categoryOrder.indexOf(a);
                        const indexB = categoryOrder.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const categoryRows = [];
                    const excludeCats = ['panel', 'pushkontak', 'store'];
                    
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (excludeCats.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        categoryRows.push({
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: cat.toUpperCase(),
                                id: `${m.prefix}menucat ${cat}`
                            })
                        });
                    }
                    
                    let pp;
                    try {
                        pp = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer' })).data);
                    } catch (error) {
                        pp = fs.readFileSync('./assets/images/pp-kosong.jpg');
                    }

                    const zanton = [
                        { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Lihat Semua Menu', id: `${m.prefix}allmenu` }) }
                    ];
                    zanton.push(...categoryRows);

                    const menuBodyV12 = `Hai ${m.pushName},\n\nTerima kasih telah menggunakan bot kami.\n\n- Bot Version: ${botConfig.bot?.version || '2.1.0'}`;

                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: menuBodyV12,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'}`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'application/pdf',
                            fileName: `Menu System`,
                            jpegThumbnail: await sharp(pp).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: { mentionedJid: [m.sender], forwardingScore: 777, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: saluranIdV12, newsletterName: saluranNameV12, serverMessageId: 127 } },
                            externalAdReply: { title: botConfig.bot?.name || 'ᴀʀᴄᴇʟᴢ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ', body: `Owner Bot: ${botConfig.owner?.name || 'Admin'}`, mediaType: 1, thumbnail: fs.readFileSync('./assets/images/ourin-v11.jpg') || '', mediaUrl: botConfig?.info?.website || 'https://whatsapp.com', sourceUrl: botConfig?.info?.website || 'https://whatsapp.com', renderLargerThumbnail: true },
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    bottom_sheet: { in_thread_buttons_limit: 2, divider_indices: [1, 2, 3, 4, 5, 999], list_title: "Pilih Kategori", button_title: "Pilih Kategori" }
                                }),
                                buttons: zanton
                            }
                        }
                    }, { quoted: { key: {remoteJid: '0@s.whatsapp.net', fromMe: false, id: `ownername`, participant: '0@s.whatsapp.net'}, message: {requestPaymentMessage: {currencyCodeIso4217: "USD", amount1000: 999999999, requestFrom: '0@s.whatsapp.net', noteMessage: { extendedTextMessage: { text: `${botConfig?.bot?.name}`}}, expiryTimestamp: 999999999, amount: {value: 91929291929, offset: 1000, currencyCode: "USD"}}} } });
                } catch (v12Error) {
                    const fallbackV12 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV12.image = imageBuffer; fallbackV12.caption = text; } else { fallbackV12.text = text; }
                    await sock.sendMessage(m.chat, fallbackV12, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            default:
                await m.reply(text);
        }
        
        // Audio processing logic remains unchanged
        const audioEnabled = db.setting('audioMenu') !== false;
        if (audioEnabled) {
            const audioPath = path.join(process.cwd(), 'assets', 'audio', 'ourin.mp3');
            if (fs.existsSync(audioPath)) {
                const { spawn } = require('child_process');
                const tempOpus = path.join(process.cwd(), 'assets', 'audio', 'temp_vn.opus');
                try {
                    await new Promise((resolve, reject) => {
                        const ffmpeg = spawn('ffmpeg', ['-y', '-i', audioPath, '-c:a', 'libopus', '-b:a', '64k', tempOpus]);
                        ffmpeg.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg failed')));
                        ffmpeg.on('error', reject);
                        setTimeout(() => { ffmpeg.kill(); reject(new Error('Timeout')); }, 10000);
                    });
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(tempOpus),
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);
                } catch (ffmpegErr) {
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        ptt: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                }
            }
        }
    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
