const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'sewabot',
    alias: ['sewa'],
    category: 'owner',
    description: 'Toggle sistem sewa bot',
    usage: '.sewabot <on/off>',
    example: '.sewabot on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const pendingConfirmations = new Map()

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim()?.toLowerCase()
    
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }
    
    const currentStatus = db.db.data.sewa.enabled
    const sewaGroups = Object.keys(db.db.data.sewa.groups || {})
    
    if (!args) {
        return m.reply(
            `*🔧 SEWABOT SYSTEM*\n\n` +
            `Status Saat Ini: ${currentStatus ? '✅ AKTIF' : '❌ NONAKTIF'}\n` +
            `Grup Terdaftar: ${sewaGroups.length} grup\n\n` +
            `*Cara Pakai:*\n` +
            `- \`${m.prefix}sewabot on\` (Aktifkan sistem sewa)\n` +
            `- \`${m.prefix}sewabot off\` (Nonaktifkan sistem sewa)`
        )
    }
    
    if (args === 'off') {
        db.db.data.sewa.enabled = false
        db.db.write()
        m.react('✅')
        return m.reply(`*✅ SEWABOT DINONAKTIFKAN*\n\nSistem sewa telah dimatikan. Bot tidak akan meninggalkan grup mana pun secara otomatis.`)
    }
    
    if (args === 'on') {
        const pending = pendingConfirmations.get(m.sender)
        if (pending && pending.type === 'sewabot_on' && Date.now() - pending.timestamp < 60000) {
            return m.reply(`*⏳ MENUNGGU KONFIRMASI*\n\nKetik \`${m.prefix}sewabot confirm\` untuk lanjut atau \`${m.prefix}sewabot cancel\` untuk batal.`)
        }
        
        pendingConfirmations.set(m.sender, {
            type: 'sewabot_on',
            timestamp: Date.now(),
            chat: m.chat
        })
        
        setTimeout(() => {
            if (pendingConfirmations.get(m.sender)?.type === 'sewabot_on') {
                pendingConfirmations.delete(m.sender)
            }
        }, 60000)
        
        return m.reply(
            `*⚠️ PERINGATAN SISTEM SEWA*\n\n` +
            `Jika sistem sewa diaktifkan:\n` +
            `- Grup Whitelist: ${sewaGroups.length} grup (Aman)\n` +
            `- Grup Lain: Akan otomatis ditinggalkan (Leave)!\n\n` +
            `*PENTING:* Bot akan keluar dari SEMUA grup yang tidak ada dalam daftar sewa.\n\n` +
            `*Konfirmasi:* \n` +
            `- Ketik \`${m.prefix}sewabot confirm\` untuk lanjut\n` +
            `- Ketik \`${m.prefix}sewabot cancel\` untuk batal\n\n` +
            `_Saran: Daftarkan grup penting dulu dengan perintah .addsewa_`
        )
    }
    
    if (args === 'confirm' || args === 'yes' || args === 'y') {
        const pending = pendingConfirmations.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') {
            return m.reply(`*❌ GAGAL*\n\nTidak ada permintaan aktivasi sistem sewa yang tertunda. Silakan ketik \`${m.prefix}sewabot on\` terlebih dahulu.`)
        }
        
        pendingConfirmations.delete(m.sender)
        
        db.db.data.sewa.enabled = true
        db.db.write()
        
        m.react('⏳')
        await m.reply(`*⏳ MEMPROSES...*\n\nSistem sewa diaktifkan. Memulai proses pembersihan grup non-whitelist...`)
        
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            
            let leftCount = 0
            let failedCount = 0
            
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendMessage(groupId, {
                        text: `*⛔ SEWABOT*\n\nGrup ini tidak terdaftar dalam sistem sewa resmi ARCELZAI. Bot akan segera meninggalkan grup ini.\n\n_Silakan hubungi Owner untuk melakukan sewa bot._`
                    })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 3000))
                } catch (e) {
                    failedCount++
                }
            }
            
            m.react('✅')
            return m.reply(
                `*✅ SEWABOT AKTIF*\n\n` +
                `Sistem sewa telah berjalan.\n` +
                `- Grup Aman (Whitelist): ${sewaGroups.length}\n` +
                `- Berhasil Keluar: ${leftCount} grup\n` +
                `- Gagal Keluar: ${failedCount} grup`
            )
        } catch (e) {
            m.react('✅')
            return m.reply(
                `*✅ SEWABOT AKTIF*\n\n` +
                `Sistem sewa aktif, namun gagal melakukan auto-leave otomatis.\n` +
                `Pesan Error: ${e.message}\n\n` +
                `_Gunakan perintah .sewabot leave untuk mencoba ulang._`
            )
        }
    }
    
    if (args === 'leave') {
        if (!currentStatus) {
            return m.reply(`*❌ GAGAL*\n\nAktifkan sistem sewa terlebih dahulu dengan \`${m.prefix}sewabot on\`.`)
        }
        
        m.react('⏳')
        await m.reply(`*⏳ MEMPROSES...*\n\nSedang mengambil daftar grup yang diikuti bot...`)
        
        global.sewaLeaving = true
        
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            
            if (unlistedGroups.length === 0) {
                delete global.sewaLeaving
                m.react('✅')
                return m.reply(`*✅ SELESAI*\n\nTidak ada grup non-whitelist yang perlu ditinggalkan.`)
            }
            
            await m.reply(`*📊 INFORMASI*\n\nTotal Grup: ${allGroupIds.length}\nWhitelist: ${sewaGroups.length}\nAkan Keluar Dari: ${unlistedGroups.length} grup\n\n_Memulai proses auto-leave..._`)
            
            let leftCount = 0
            let failedCount = 0
            
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendMessage(groupId, {
                        text: `*👋 SEWABOT*\n\nGrup ini tidak terdaftar dalam sistem sewa resmi. Bot akan segera meninggalkan grup ini.\n\n_Hubungi Owner untuk pendaftaran sewa._`
                    })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 5000))
                } catch (e) {
                    failedCount++
                }
            }
            
            delete global.sewaLeaving
            m.react('✅')
            return m.reply(
                `*✅ SELESAI*\n\n` +
                `Proses pembersihan grup selesai.\n` +
                `- Berhasil keluar: ${leftCount} grup\n` +
                `- Gagal: ${failedCount} grup`
            )
        } catch (e) {
            delete global.sewaLeaving
            m.react('❌')
            return m.reply(`*❌ ERROR*\n\nTerjadi kesalahan: ${e.message}`)
        }
    }
    
    if (args === 'cancel' || args === 'no' || args === 'n') {
        const pending = pendingConfirmations.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') {
            return m.reply(`*❌ GAGAL*\n\nTidak ada permintaan aktivasi yang perlu dibatalkan.`)
        }
        
        pendingConfirmations.delete(m.sender)
        m.react('❌')
        return m.reply(`*❌ DIBATALKAN*\n\nAktivasi sistem sewa dibatalkan. Silakan whitelist grup-grup penting terlebih dahulu jika diperlukan.`)
    }
    
    return m.reply(`*❌ GAGAL*\n\nOpsi tidak dikenal. Gunakan opsi berikut:\n- \`on\`: Aktifkan\n- \`off\`: Matikan\n- \`confirm\`: Lanjut aktifkan\n- \`leave\`: Retry pembersihan grup\n- \`cancel\`: Batalkan`)
}

module.exports = {
    config: pluginConfig,
    handler,
    pendingConfirmations
}
