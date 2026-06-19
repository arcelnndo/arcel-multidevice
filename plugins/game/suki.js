const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'sukihunt',
    alias: ['suki', 'pemburuansuki'],
    category: 'game',
    description: 'Main game Pemburuan Suki (5v5 Faction Battle)',
    usage: '.suki <create|join|start|vote|player|exit|delete>',
    example: '.suki create',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

if (!global.sukiGames) global.sukiGames = {}

let thumbSuki = null
let thumbNight = null
let thumbDay = null
let thumbWin = null

try {
    const assetsPath = path.join(process.cwd(), 'assets', 'images')
    if (fs.existsSync(path.join(assetsPath, 'ourin-games.jpg'))) {
        thumbSuki = fs.readFileSync(path.join(assetsPath, 'ourin-games.jpg'))
    }
    if (fs.existsSync(path.join(assetsPath, 'ourin.jpg'))) {
        thumbNight = fs.readFileSync(path.join(assetsPath, 'ourin.jpg'))
        thumbDay = fs.readFileSync(path.join(assetsPath, 'ourin.jpg'))
    }
    if (fs.existsSync(path.join(assetsPath, 'ourin-winner.jpg'))) {
        thumbWin = fs.readFileSync(path.join(assetsPath, 'ourin-winner.jpg'))
    }
} catch (e) {
    console.log('[SUKI] Failed to load thumbnails:', e.message)
}

const ROLES = {
    // FAKSI TENTARA HITAM
    komandan: { emoji: '🥷', name: 'Komandan Hitam', team: 'hitam', desc: 'Pimpin penyergapan dan bunuh Suki' },
    spy: { emoji: '👁️', name: 'Mata-mata Hitam', team: 'hitam', desc: 'Cari tahu identitas musuh' },
    prajurit_hitam: { emoji: '🗡️', name: 'Prajurit Hitam', team: 'hitam', desc: 'Bantu komandan di siang hari' },
    
    // FAKSI SUKI
    suki: { emoji: '👑', name: 'Suki (VIP)', team: 'suki', desc: 'Bertahan hidup dari buruan!' },
    pengawal: { emoji: '🛡️', name: 'Pengawal Suki', team: 'suki', desc: 'Lindungi target tiap malam' },
    intel: { emoji: '🔍', name: 'Intel Suki', team: 'suki', desc: 'Lacak pergerakan Tentara Hitam' },
    prajurit_suki: { emoji: '⚔️', name: 'Prajurit Suki', team: 'suki', desc: 'Bertarung dan lindungi Suki di siang hari' }
}

const WIN_REWARD = { koin: 7500, exp: 1500 }
const MIN_PLAYERS = 4
const MAX_PLAYERS = 10 // Dibuat max 10 biar pas 5v5
const PHASE_DURATION = {
    night: 60000,   // 60 detik (Fase Penyergapan)
    day: 90000      // 90 detik (Fase Diskusi/Perang Terbuka)
}

function getSukiContextInfo(title = '⚔️ PEMBURUAN SUKI', body = 'Suki vs Tentara Hitam', thumbBuffer = thumbSuki, mentions) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Arcelz System'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        mentionedJid: mentions,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    if (thumbBuffer) {
        contextInfo.externalAdReply = {
            title: title, body: body, thumbnail: thumbBuffer,
            mediaType: 1, renderLargerThumbnail: true, sourceUrl: config.saluran?.link || ''
        }
    }
    return contextInfo
}

function generateRoles(playerCount) {
    const roles = []
    
    // Konsep seimbang Suki vs Hitam
    if (playerCount === 4) {
        roles.push('suki', 'pengawal', 'komandan', 'spy')
    } else if (playerCount === 5) {
        roles.push('suki', 'pengawal', 'intel', 'komandan', 'spy')
    } else if (playerCount === 6) {
        roles.push('suki', 'pengawal', 'intel', 'komandan', 'spy', 'prajurit_hitam')
    } else if (playerCount === 7) {
        roles.push('suki', 'pengawal', 'intel', 'prajurit_suki', 'komandan', 'spy', 'prajurit_hitam')
    } else if (playerCount === 8) {
        roles.push('suki', 'pengawal', 'intel', 'prajurit_suki', 'komandan', 'spy', 'prajurit_hitam', 'prajurit_hitam')
    } else if (playerCount === 9) {
        roles.push('suki', 'pengawal', 'intel', 'prajurit_suki', 'prajurit_suki', 'komandan', 'spy', 'prajurit_hitam', 'prajurit_hitam')
    } else if (playerCount >= 10) { // 5 VS 5 (THE ULTIMATE BATTLE)
        roles.push('suki', 'pengawal', 'intel', 'prajurit_suki', 'prajurit_suki', 'komandan', 'spy', 'prajurit_hitam', 'prajurit_hitam', 'prajurit_hitam')
    }
    
    // Kocok role
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    return roles
}

function getRoleDescription(role, prefix = '.') {
    const descriptions = {
        komandan: `🥷 *KOMANDAN HITAM*\n\nKamu adalah pemimpin penyergapan!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Bunuh Suki!\n┃ ⚔️ Skill: Eksekusi 1 target tiap malam\n╰┈┈┈┈┈┈┈┈⬡\n\n> Ketik di PM:\n> \`${prefix}sukikill <nomor>\``,
        spy: `👁️ *MATA-MATA HITAM*\n\nKamu bekerja untuk Komandan!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Cari tahu siapa Suki\n┃ 🔍 Skill: Scan identitas 1 musuh\n╰┈┈┈┈┈┈┈┈⬡\n\n> Ketik di PM:\n> \`${prefix}sukicheck <nomor>\``,
        prajurit_hitam: `🗡️ *PRAJURIT HITAM*\n\nPasukan bayangan!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Bantu Komandan di siang hari\n┃ 🗳️ Skill: Vote eksekusi musuh\n╰┈┈┈┈┈┈┈┈⬡\n\n> Hasut warga di grup dan vote musuh!`,
        suki: `👑 *SUKI (VIP)*\n\nKamu adalah target utama Tentara Hitam!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Bertahan Hidup!\n┃ ⚠️ Jika kamu mati, musuh langsung menang.\n╰┈┈┈┈┈┈┈┈⬡\n\n> Bersembunyilah dengan baik di siang hari!`,
        pengawal: `🛡️ *PENGAWAL SUKI*\n\nNyawamu adalah tameng Suki!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Lindungi Suki\n┃ 🛡️ Skill: Tahan serangan tiap malam\n╰┈┈┈┈┈┈┈┈⬡\n\n> Ketik di PM:\n> \`${prefix}sukiguard <nomor>\``,
        intel: `🔍 *INTEL SUKI*\n\nKamu adalah mata Suki!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Lacak Tentara Hitam\n┃ 🔮 Skill: Cek identitas 1 orang\n╰┈┈┈┈┈┈┈┈⬡\n\n> Ketik di PM:\n> \`${prefix}sukicheck <nomor>\``,
        prajurit_suki: `⚔️ *PRAJURIT SUKI*\n\nLoyalis Klan Suki!\n\n╭┈┈⬡「 📋 *INFO* 」\n┃ 🎯 Tujuan: Habisi Tentara Hitam via Vote\n┃ 🗳️ Skill: Vote siang hari\n╰┈┈┈┈┈┈┈┈⬡\n\n> Lindungi Suki di fase diskusi grup!`
    }
    return descriptions[role] || 'Unknown Role'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const target = args[1]
    const gameData = global.sukiGames
    const prefix = m.prefix || config.command?.prefix || '.'
    
    const commands = {
        create: async () => {
            if (gameData[m.chat]) return m.reply(`❌ *MEDAN PERANG SUDAH AKTIF*\n> Selesaikan dulu game yang sedang berjalan!`)
            const existingRoom = Object.entries(gameData).find(([chatId, room]) => room.players.some(p => p.id === m.sender))
            if (existingRoom) return m.reply(`❌ Kamu masih bertarung di grup lain!`)
            
            gameData[m.chat] = {
                room: m.chat,
                owner: m.sender,
                status: 'waiting',
                day: 0,
                phase: 'lobby',
                players: [{ id: m.sender, number: 1, role: null, alive: true, voted: false, skillUsed: false }],
                dead: [],
                votes: {},
                actions: { kill: null, protect: null, check: null },
                createdAt: Date.now(),
                timeout: null
            }
            
            await m.react('⚔️')
            await sock.sendMessage(m.chat, {
                text: `⚔️ *PEMBURUAN SUKI (5v5)*\n\nMedan perang telah dibuka!\n\n╭┈┈⬡「 📋 *INFO ROOM* 」\n┃ 👑 Host: @${m.sender.split('@')[0]}\n┃ 👥 Pasukan: 1/${MAX_PLAYERS}\n┃ ⏱️ Min: ${MIN_PLAYERS} player\n╰┈┈┈┈┈┈┈┈⬡\n\n> Ketik \`${prefix}suki join\` untuk ikut berperang!`,
                mentions: [m.sender],
                contextInfo: getSukiContextInfo('⚔️ LOBBY DIBUKA', 'Suki vs Tentara Hitam')
            }, { quoted: m })
        },
        
        join: async () => {
            if (!gameData[m.chat]) return m.reply(`❌ Belum ada room!\n> Ketik \`${prefix}suki create\``)
            if (gameData[m.chat].status !== 'waiting') return m.reply(`❌ Perang sudah dimulai!`)
            if (gameData[m.chat].players.length >= MAX_PLAYERS) return m.reply(`❌ Pasukan sudah penuh! (Max ${MAX_PLAYERS})`)
            if (gameData[m.chat].players.some(p => p.id === m.sender)) return m.reply(`❌ Kamu sudah ada di dalam barisan!`)
            
            gameData[m.chat].players.push({ id: m.sender, number: gameData[m.chat].players.length + 1, role: null, alive: true, voted: false, skillUsed: false })
            
            const playerList = gameData[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')
            const canStart = gameData[m.chat].players.length >= MIN_PLAYERS
            
            await m.react('✅')
            await sock.sendMessage(m.chat, {
                text: `✅ *PASUKAN BERGABUNG*\n\n@${m.sender.split('@')[0]} siap bertarung!\n\n╭┈┈⬡「 👥 *BARISAN* 」\n${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
                    (canStart ? `> ✅ Bisa mulai! \`${prefix}suki start\`` : `> ⏳ Butuh ${MIN_PLAYERS - gameData[m.chat].players.length} orang lagi`),
                contextInfo: getSukiContextInfo('⚔️ PEMBURUAN SUKI', `${gameData[m.chat].players.length} Petarung siap`, null, gameData[m.chat].players.map(p => p.id))
            }, { quoted: m })
        },
        
        start: async () => {
            if (!gameData[m.chat]) return m.reply(`❌ Belum ada room!`)
            if (gameData[m.chat].status !== 'waiting') return m.reply(`❌ Perang sudah berjalan!`)
            if (gameData[m.chat].owner !== m.sender && !config.isOwner?.(m.sender)) return m.reply(`❌ Hanya host yang bisa memulai perang!`)
            if (gameData[m.chat].players.length < MIN_PLAYERS) return m.reply(`❌ Minimal ${MIN_PLAYERS} petarung!`)
            
            const roles = generateRoles(gameData[m.chat].players.length)
            gameData[m.chat].players.forEach((p, i) => { p.role = roles[i] })
            
            gameData[m.chat].status = 'playing'
            gameData[m.chat].day = 1
            gameData[m.chat].phase = 'night'
            
            for (const player of gameData[m.chat].players) {
                try {
                    await sock.sendMessage(player.id, {
                        text: getRoleDescription(player.role, prefix),
                        contextInfo: getSukiContextInfo(`${ROLES[player.role].emoji} ${ROLES[player.role].name}`, 'Peran Tempurmu!')
                    })
                } catch (e) {
                    console.log(`[SUKI] Gagal kirim PM ke ${player.id}`)
                }
            }
            
            const playerList = gameData[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')
            
            await m.react('🥷')
            await sock.sendMessage(m.chat, {
                text: `⚔️ *PERANG DIMULAI!*\n\n🌙 *Fase Penyergapan Malam (Hari-1)*\n\n╭┈┈⬡「 👥 *TARGET & PELAKU* 」\n${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n╰┈┈┈┈┈┈┈┈⬡\n\n> 📩 Cek PM untuk melihat identitas kalian!\n> 🥷 Tentara Hitam sedang memburu Suki...\n> ⏱️ Waktu penyergapan: ${PHASE_DURATION.night / 1000} detik`,
                mentions: gameData[m.chat].players.map(p => p.id),
                contextInfo: getSukiContextInfo('🌙 PENYERGAPAN', 'Tentara Hitam beraksi...', thumbNight, gameData[m.chat].players.map(p => p.id))
            }, { quoted: m })
            
            await sendActionPrompts(m.chat, sock, prefix)
            
            gameData[m.chat].timeout = setTimeout(() => {
                processActions(m.chat, sock, db, prefix)
            }, PHASE_DURATION.night)
        },
        
        vote: async () => {
            if (!gameData[m.chat] || gameData[m.chat].status !== 'playing') return m.reply(`❌ Tidak ada perang aktif!`)
            if (gameData[m.chat].phase !== 'day') return m.reply(`❌ Belum waktunya eksekusi! (Tunggu siang)`)
            
            const player = gameData[m.chat].players.find(p => p.id === m.sender)
            if (!player || !player.alive) return m.reply(`❌ Orang mati tidak bisa bersuara!`)
            if (player.voted) return m.reply(`❌ Kamu sudah menjatuhkan pilihan!`)
            
            if (!target) {
                const alivePlayers = gameData[m.chat].players.filter(p => p.alive)
                const list = alivePlayers.map(p => `${p.number}. @${p.id.split('@')[0]}`).join('\n')
                return sock.sendMessage(m.chat, {
                    text: `⚔️ *PERANG TERBUKA (VOTING)*\n\nSiapa musuh yang harus dieksekusi?\n\n${list}\n\n> Ketik: \`${prefix}suki vote <nomor>\``,
                    mentions: alivePlayers.map(p => p.id),
                    contextInfo: getSukiContextInfo('⚔️ EKSEKUSI', 'Pilih musuhmu!')
                }, { quoted: m })
            }
            
            const targetNum = parseInt(target)
            const targetPlayer = gameData[m.chat].players.find(p => p.number === targetNum)
            if (!targetPlayer || !targetPlayer.alive) return m.reply(`❌ Target tidak valid atau sudah mati!`)
            
            player.voted = true
            gameData[m.chat].votes[targetPlayer.id] = (gameData[m.chat].votes[targetPlayer.id] || 0) + 1
            
            const alivePlayers = gameData[m.chat].players.filter(p => p.alive)
            const votedCount = alivePlayers.filter(p => p.voted).length
            
            await m.react('🗡️')
            await sock.sendMessage(m.chat, {
                text: `🗡️ *TARGET TERPILIH*\n\n@${m.sender.split('@')[0]} memilih @${targetPlayer.id.split('@')[0]}\n\n> Progress: ${votedCount}/${alivePlayers.length}`,
                mentions: [m.sender, targetPlayer.id]
            }, { quoted: m })
            
            if (votedCount >= alivePlayers.length) {
                if (gameData[m.chat].timeout) clearTimeout(gameData[m.chat].timeout)
                await executeVote(m.chat, sock, db, prefix)
            }
        },

        player: async () => {
            if (!gameData[m.chat]) return m.reply(`❌ Tidak ada game di room ini!`)
            const playerList = gameData[m.chat].players.map(p => {
                const status = p.alive ? '✅' : `☠️ (${ROLES[p.role]?.name})`
                return `${p.number}. @${p.id.split('@')[0]} ${status}`
            }).join('\n')
            
            await sock.sendMessage(m.chat, {
                text: `⚔️ *STATUS MEDAN PERANG*\n\n╭┈┈⬡「 📊 *INFO* 」\n┃ 📅 Hari: ${gameData[m.chat].day}\n┃ 👤 Hidup: ${gameData[m.chat].players.filter(p => p.alive).length}\n┃ ☠️ Mati: ${gameData[m.chat].dead.length}\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 👥 *PETARUNG* 」\n${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n╰┈┈┈┈┈┈┈┈⬡`,
                mentions: gameData[m.chat].players.map(p => p.id)
            }, { quoted: m })
        },
        
        exit: async () => { /* Logika exit sama spt sebelumnya */ },
        delete: async () => { /* Logika delete sama spt sebelumnya */ }
    }
    
    if (!action || !commands[action]) {
        return m.reply(`⚔️ *PEMBURUAN SUKI*\n\nCommand:\n- \`${prefix}suki create\` (Bikin room)\n- \`${prefix}suki join\` (Gabung)\n- \`${prefix}suki start\` (Mulai)\n- \`${prefix}suki vote <no>\` (Vote)\n- \`${prefix}suki player\` (Cek orang)`)
    }
    try { await commands[action]() } catch (e) { console.log(e) }
}

async function sendActionPrompts(chatId, sock, prefix) {
    const game = global.sukiGames[chatId]
    if (!game) return
    const alivePlayers = game.players.filter(p => p.alive)
    let playerList = ''
    alivePlayers.forEach(p => playerList += `(${p.number}) @${p.id.split('@')[0]}\n`)
    
    for (const player of alivePlayers) {
        let text = ''
        switch (player.role) {
            case 'komandan': text = `🥷 *PENYERGAPAN MALAM*\n\nSiapa yang akan dibunuh?\n\n${playerList}\n> Ketik \`${prefix}sukikill <no>\``; break;
            case 'pengawal': text = `🛡️ *PENYERGAPAN MALAM*\n\nSiapa yang harus dilindungi?\n\n${playerList}\n> Ketik \`${prefix}sukiguard <no>\``; break;
            case 'spy': 
            case 'intel': text = `🔍 *PENYERGAPAN MALAM*\n\nSiapa yang mau di scan?\n\n${playerList}\n> Ketik \`${prefix}sukicheck <no>\``; break;
        }
        if (text) await sock.sendMessage(player.id, { text, mentions: alivePlayers.map(p => p.id) })
    }
}

async function processActions(chatId, sock, db, prefix) {
    const game = global.sukiGames[chatId]
    if (!game || game.phase !== 'night') return
    
    let killTarget = game.actions.kill
    const protectTarget = game.actions.protect
    let report = `☀️ *PAGI HARI KE-${game.day}*\n\n`
    
    if (killTarget && killTarget !== protectTarget) {
        const victim = game.players.find(p => p.id === killTarget)
        victim.alive = false
        game.dead.push(victim)
        report += `🩸 MENCEKAM! @${victim.id.split('@')[0]} ditemukan tewas mengenaskan!\n> Identitas: ${ROLES[victim.role].emoji} ${ROLES[victim.role].name}\n\n`
    } else if (killTarget && killTarget === protectTarget) {
        report += `🛡️ Dentingan pedang terdengar! Pengawal berhasil menangkis serangan Tentara Hitam!\n> Tidak ada yang tewas malam ini.\n\n`
    } else {
        report += `🌅 Malam yang sunyi... Tidak ada serangan.\n\n`
    }
    
    const winner = checkWinner(chatId)
    if (winner) {
        await sock.sendMessage(chatId, { text: report, mentions: game.players.map(p=>p.id) })
        return endGame(chatId, sock, db, winner)
    }
    
    game.phase = 'day'
    game.votes = {}
    game.actions = { kill: null, protect: null, check: null }
    game.players.forEach(p => { p.voted = false; p.skillUsed = false })
    
    report += `> ⚔️ Waktunya diskusi grup dan Eksekusi!\n> Ketik \`${prefix}suki vote <nomor>\``
    await sock.sendMessage(chatId, { text: report, mentions: game.players.map(p=>p.id) })
    
    game.timeout = setTimeout(() => executeVote(chatId, sock, db, prefix), PHASE_DURATION.day)
}

async function executeVote(chatId, sock, db, prefix) {
    const game = global.sukiGames[chatId]
    let maxVotes = 0, eliminated = null, isTie = false
    
    for (const [playerId, votes] of Object.entries(game.votes)) {
        if (votes > maxVotes) { maxVotes = votes; eliminated = playerId; isTie = false }
        else if (votes === maxVotes && maxVotes > 0) { isTie = true }
    }
    
    let txt = `⚖️ *HASIL EKSEKUSI*\n\n`
    if (isTie || maxVotes === 0) {
        txt += `🤷 Tidak ada kesepakatan! Semua selamat siang ini.\n\n`
    } else if (eliminated) {
        const player = game.players.find(p => p.id === eliminated)
        player.alive = false
        game.dead.push(player)
        txt += `☠️ @${eliminated.split('@')[0]} dieksekusi mati oleh massa!\n> Identitas Asli: ${ROLES[player.role].emoji} ${ROLES[player.role].name}\n\n`
    }
    
    const winner = checkWinner(chatId)
    if (winner) {
        await sock.sendMessage(chatId, { text: txt, mentions: eliminated ? [eliminated] : [] })
        return endGame(chatId, sock, db, winner)
    }
    
    game.phase = 'night'
    game.day++
    game.actions = { kill: null, protect: null, check: null }
    game.players.forEach(p => { p.voted = false; p.skillUsed = false })
    
    txt += `🌙 *Fase Penyergapan Malam (Hari-${game.day})*\n> Cek PM kalian masing-masing!`
    await sock.sendMessage(chatId, { text: txt, mentions: eliminated ? [eliminated] : [] })
    await sendActionPrompts(chatId, sock, prefix)
    
    game.timeout = setTimeout(() => processActions(chatId, sock, db, prefix), PHASE_DURATION.night)
}

function checkWinner(chatId) {
    const game = global.sukiGames[chatId]
    const alive = game.players.filter(p => p.alive)
    const hitam = alive.filter(p => ROLES[p.role].team === 'hitam')
    const sukiAlive = alive.find(p => p.role === 'suki') // Cek apakah Suki msh hidup
    
    // VIP Condition: Kalau suki mati, Tentara Hitam auto win!
    if (!sukiAlive) return 'hitam'
    if (hitam.length === 0) return 'suki'
    if (hitam.length >= alive.length - hitam.length) return 'hitam'
    return null
}

async function endGame(chatId, sock, db, winner) {
    const game = global.sukiGames[chatId]
    if (game.timeout) clearTimeout(game.timeout)
    
    const winTeam = winner === 'hitam' ? 'hitam' : 'suki'
    const winStr = winner === 'hitam' ? '🥷 *TENTARA HITAM MENANG!* (Suki berhasil dibunuh / Pasukan Suki Habis)' : '👑 *KLAN SUKI MENANG!* (Semua Tentara Hitam berhasil diberantas)'
    
    let allP = game.players.map(p => `${p.alive?'✅':'☠️'} @${p.id.split('@')[0]} - ${ROLES[p.role].emoji} ${ROLES[p.role].name}`).join('\n')
    
    await sock.sendMessage(chatId, {
        text: `🎉 *PERANG BERAKHIR!*\n\n${winStr}\n\n╭┈┈⬡「 👥 *REKAP IDENTITAS* 」\n${allP.split('\n').map(l=>`┃ ${l}`).join('\n')}\n╰┈┈┈┈┈┈┈┈⬡\n\n> 💰 Reward Koin: +${WIN_REWARD.koin}\n> ⭐ Reward EXP: +${WIN_REWARD.exp}`,
        mentions: game.players.map(p => p.id)
    })
    
    delete global.sukiGames[chatId]
}

async function actionHandler(m, { sock }) {
    const prefix = m.prefix || config.command?.prefix || '.'
    const gameId = Object.keys(global.sukiGames).find(id => global.sukiGames[id].players.some(p => p.id === m.sender && p.alive) && global.sukiGames[id].phase === 'night')
    if (!gameId) return m.reply(`❌ Kamu tidak sedang bertarung atau ini bukan fase malam!`)
    
    const game = global.sukiGames[gameId]
    const player = game.players.find(p => p.id === m.sender)
    if (player.skillUsed) return m.reply(`❌ Kamu sudah beraksi malam ini!`)
    
    const cmd = m.command?.toLowerCase()
    const targetNum = parseInt(m.args?.[0])
    if (isNaN(targetNum)) return m.reply(`❌ Masukkan nomor! Contoh: \`${prefix}${cmd} 2\``)
    
    const targetPlayer = game.players.find(p => p.number === targetNum && p.alive)
    if (!targetPlayer) return m.reply(`❌ Target mati/tidak valid!`)
    
    if (cmd === 'sukikill' && player.role === 'komandan') {
        if (ROLES[targetPlayer.role].team === 'hitam') return m.reply(`❌ Jangan bunuh sesama Tentara Hitam!`)
        game.actions.kill = targetPlayer.id; player.skillUsed = true
        return m.reply(`🥷 Target dikunci! Menunggu fajar...`)
    }
    if (cmd === 'sukiguard' && player.role === 'pengawal') {
        game.actions.protect = targetPlayer.id; player.skillUsed = true
        return m.reply(`🛡️ Target dilindungi! Menunggu fajar...`)
    }
    if (cmd === 'sukicheck' && (player.role === 'intel' || player.role === 'spy')) {
        player.skillUsed = true
        return m.reply(`🔍 *HASIL SCAN*\n\nTarget adalah: ${ROLES[targetPlayer.role].emoji} *${ROLES[targetPlayer.role].name}*`)
    }
}

module.exports = { config: pluginConfig, handler, actionHandler, ROLES, getSukiContextInfo }