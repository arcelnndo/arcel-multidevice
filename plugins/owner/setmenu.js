const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');
const { generateWAMessageFromContent, proto } = require('ourin');

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan menu',
    usage: '.setmenu <v1-v12>',
    example: '.setmenu v8',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Image biasa tanpa contextInfo' },
    v2: { id: 2, name: 'Standard', desc: 'Image + full contextInfo (default)' },
    v3: { id: 3, name: 'Document', desc: 'Document + jpegThumbnail + verified quoted' },
    v4: { id: 4, name: 'Video', desc: 'Video + contextInfo + verified quoted' },
    v5: { id: 5, name: 'Button', desc: 'Image + buttons (single_select & quick_reply)' },
    v6: { id: 6, name: 'Document Premium', desc: 'Document + jpegThumbnail 1280x450 + full contextInfo' },
    v7: { id: 7, name: 'Carousel', desc: 'Swipeable cards per kategori (modern)' },
    v8: { id: 8, name: 'Minimalist', desc: 'Image + ftroli quoted + fresh design' },
    v9: { id: 9, name: 'NativeFlow', desc: 'Interactive + limited_time_offer + bottom_sheet + single_select' },
    v10: { id: 10, name: 'NativeFlow v2', desc: 'Tampilan NativeFlow dengan interaksi penuh' },
    v11: { id: 11, name: 'Document Interactive', desc: 'Document + nativeFlowMessage + limited_time_offer + cta buttons' },
    v12: { id: 12, name: 'Menu Versi 12', desc: 'Desain menu eksklusif terbaru' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();

    if (variant) {
        const selected = VARIANTS[variant];
        if (!selected) {
            await m.reply(`*❌ GAGAL*\n\nVariant tidak valid! Silakan gunakan v1 s/d v12.`);
            return;
        }

        db.setting('menuVariant', selected.id);
        await db.save();

        await m.reply(
            `*✅ BERHASIL*\n\n` +
            `Variant tampilan menu berhasil diubah ke *V${selected.id}*\n\n` +
            `*${selected.name}*\n` +
            `${selected.desc}`
        );
        return;
    }

    const current = db.setting('menuVariant') || config.ui?.menuVariant || 2;

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenu ${key}`
    }));

    const bodyText =
        `*🎨 SET MENU VARIANT*\n\n` +
        `Variant aktif saat ini: *V${current}*\n` +
        `(${VARIANTS[`v${current}`]?.name || 'Unknown'})\n\n` +
        `Silakan pilih variant tampilan menu dari daftar di bawah ini:`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎨 Pilih Variant',
                    sections: [{
                        title: 'Daftar Variant Menu',
                        rows
                    }]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: config.bot?.name || 'ARCELZ MULTI DEVICE'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '🎨 Menu Variant',
                            subtitle: `${Object.keys(VARIANTS).length} variant tersedia`,
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '0',
                                newsletterName: config.bot?.name || 'ARCELZAI',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
        let txt = `*🎨 SET MENU VARIANT*\n\n`;
        txt += `Variant aktif saat ini: *V${current}*\n\n`;
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `*${key.toUpperCase()}*${mark} — ${val.desc}\n`;
        }
        txt += `\n_Cara pakai: \`${m.prefix}setmenu v1\` (dan seterusnya)_`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
