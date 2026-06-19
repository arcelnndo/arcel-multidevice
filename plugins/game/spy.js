/**
 * 🕵️ WHO'S THE SPY
 * Social deduction game for WhatsApp
 * * Adapted from: Werewolf Game Structure
 * Enhanced for OurinAI
 */

const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'spy',
    alias: ['wts', 'spygame'],
    category: 'game',
    description: 'Main game Who\'s The Spy bersama player lain',
    usage: '.spy <create|join|start|vote|player|exit|delete>',
    example: '.spy create',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

if (!global.spyGames) global.spyGames = {}

let thumbSpy = null
let thumbWin = null

try {
    const assetsPath = path.join(process.cwd(), 'assets', 'images')
    if (fs.existsSync(path.join(assetsPath, 'ourin-games.jpg'))) {
        thumbSpy = fs.readFileSync(path.join(assetsPath, 'ourin-games.jpg'))
    }
    if (fs.existsSync(path.join(assetsPath, 'ourin-winner.jpg'))) {
        thumbWin = fs.readFileSync(path.join(assetsPath, 'ourin-winner.jpg'))
    }
} catch (e) {
    console.log('[SPY] Failed to load thumbnails:', e.message)
}

// Kumpulan kata (Bisa ditambah sesuai selera)
const WORD_PAIRS = [
    ['Apel', 'Pir'], ['Kucing', 'Anjing'], ['Gitar', 'Biola'],
    ['Bulan', 'Bintang'], ['Kopi', 'Teh'], ['Motor', 'Mobil'],
    ['Pensil', 'Pulpen'], ['Sepatu', 'Sandal'], ['Pantai', 'Gunung'],
    ['Kulkas', 'AC'], ['Laptop', 'Komputer'], ['Pesawat', 'Helikopter']
]

const ROLES = {
    warga: { emoji: '👨‍🌾', name: 'Warga', team: 'warga', desc: 'Deskripsikan katamu dan cari Spy!' },
    spy: { emoji: '🕵️', name: 'Spy', team: 'spy', desc: 'Kata kamu berbeda, pura-puralah jadi warga!' }
}

const WIN_REWARD = { koin: 5000, exp: 1000 }
const MIN_PLAYERS = 4
const MAX_PLAYERS = 15
const PHASE_DURATION = {
    discussion: 90000, // 90 detik diskusi
    vote: 60000        // 60 detik voting
}

function getSpyContextInfo(title = '🕵️ WHO\'S THE SPY', body = 'Social deduction game!', thumbBuffer = thumbSpy, mentions) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
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
            title: title,
            body: body,
            thumbnail: thumbBuffer,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

// Generate roles based on player count
function generateRoles(playerCount) {
    const roles = []
    let spyCount = 1
    
    if (playerCount >= 7 && playerCount <= 10) spyCount = 2
    else if (playerCount >= 11) spyCount = 3

    for (let i = 0; i < spyCount; i++) roles.push('spy')
    while (roles.length < playerCount) roles.push('warga')
    
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    
    return roles
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const target = args[1]
    const spy = global.spyGames
    const prefix = m.prefix || config.command?.prefix || '.'
    
    const commands = {
        create: async () => {
            if (spy[m.chat]) {
                const game = spy[m.chat]
                if (game.status === 'waiting') {
                    return sock.sendMessage(m.chat, {
                        text: `❌ *ROOM SUDAH ADA*\n\n` +
                            `> Room masih menunggu player\n` +
                            `> Ketik \`${prefix}spy join\` untuk gabung\n` +
                            `> Host: @${game.owner.split('@')[0]}`,
                        mentions: [game.owner],
                        contextInfo: getSpyContextInfo()
                    }, { quoted: m })
                }
                return m.reply(`❌ Game sedang berlangsung! Tunggu sampai selesai.`)
            }
            
            const existingRoom = Object.entries(spy).find(
                ([chatId, room]) => room.players.some(p => p.id === m.sender)
            )
            if (existingRoom) {
                return m.reply(`❌ Kamu masih dalam game di grup lain!`)
            }
            
            spy[m.chat] = {
                room: m.chat,
                owner: m.sender,
                status: 'waiting',
                round: 0,
                phase: 'lobby',
                words: { warga: '', spy: '' },
                players: [{
                    id: m.sender,
                    number: 1,
                    role: null,
                    word: null,
                    alive: true,
                    voted: false
                }],
                dead: [],
                votes: {},
                createdAt: Date.now(),
                timeout: null
            }
            
            await m.react('🕵️')
            await sock.sendMessage(m.chat, {
                text: `🕵️ *WHO'S THE SPY*\n\n` +
                    `Room berhasil dibuat!\n\n` +
                    `╭┈┈⬡「 📋 *INFO ROOM* 」\n` +
                    `┃ 👑 Host: @${m.sender.split('@')[0]}\n` +
                    `┃ 👥 Player: 1/${MAX_PLAYERS}\n` +
                    `┃ ⏱️ Min: ${MIN_PLAYERS} player\n` +
                    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                    `╭┈┈⬡「 🎮 *CARA MAIN* 」\n` +
                    `┃ ➕ \`${prefix}spy join\` - Gabung\n` +
                    `┃ ▶️ \`${prefix}spy start\` - Mulai (host)\n` +
                    `┃ 👥 \`${prefix}spy player\` - List player\n` +
                    `┃ 🚪 \`${prefix}spy exit\` - Keluar\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`,
                mentions: [m.sender],
                contextInfo: getSpyContextInfo('🕵️ WHO\'S THE SPY', 'Room Created!')
            }, { quoted: m })
        },
        
        join: async () => {
            if (!spy[m.chat]) return m.reply(`❌ Belum ada room!\n> Ketik \`${prefix}spy create\` untuk buat room`)
            if (spy[m.chat].status !== 'waiting') return m.reply(`❌ Game sudah dimulai! Tunggu ronde berikutnya.`)
            if (spy[m.chat].players.length >= MAX_PLAYERS) return m.reply(`❌ Room penuh! (Max ${MAX_PLAYERS} player)`)
            if (spy[m.chat].players.some(p => p.id === m.sender)) return m.reply(`❌ Kamu sudah bergabung!`)
            
            const existingRoom = Object.entries(spy).find(
                ([chatId, room]) => chatId !== m.chat && room.players.some(p => p.id === m.sender)
            )
            if (existingRoom) return m.reply(`❌ Kamu masih dalam game di grup lain!`)
            
            spy[m.chat].players.push({
                id: m.sender,
                number: spy[m.chat].players.length + 1,
                role: null,
                word: null,
                alive: true,
                voted: false
            })
            
            const playerList = spy[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')
            const canStart = spy[m.chat].players.length >= MIN_PLAYERS
            
            await m.react('✅')
            await sock.sendMessage(m.chat, {
                text: `✅ *PLAYER BERGABUNG*\n\n` +
                    `@${m.sender.split('@')[0]} masuk!\n\n` +
                    `╭┈┈⬡「 👥 *PLAYER LIST* 」\n` +
                    `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                    `> Total: ${spy[m.chat].players.length}/${MIN_PLAYERS} (min)\n` +
                    (canStart ? `> ✅ Bisa mulai! \`${prefix}spy start\`` : `> ⏳ Butuh ${MIN_PLAYERS - spy[m.chat].players.length} player lagi`),
                contextInfo: getSpyContextInfo('🕵️ SPY GAME', `${spy[m.chat].players.length} players`, null, spy[m.chat].players.map(p => p.id))
            }, { quoted: m })
        },
        
        start: async () => {
            if (!spy[m.chat]) return m.reply(`❌ Belum ada room!`)
            if (spy[m.chat].status !== 'waiting') return m.reply(`❌ Game sudah berjalan!`)
            if (spy[m.chat].owner !== m.sender && !config.isOwner?.(m.sender)) return m.reply(`❌ Hanya host yang dapat memulai game!`)
            if (spy[m.chat].players.length < MIN_PLAYERS) return m.reply(`❌ Minimal ${MIN_PLAYERS} player!\n> Saat ini: ${spy[m.chat].players.length} player`)
            
            // Setup Words & Roles
            const roles = generateRoles(spy[m.chat].players.length)
            const randomPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)]
            
            // Randomize which is Warga word and which is Spy word
            const isWargaFirst = Math.random() > 0.5
            spy[m.chat].words.warga = isWargaFirst ? randomPair[0] : randomPair[1]
            spy[m.chat].words.spy = isWargaFirst ? randomPair[1] : randomPair[0]
            
            spy[m.chat].status = 'playing'
            spy[m.chat].round = 1
            spy[m.chat].phase = 'discussion'
            
            spy[m.chat].players.forEach((p, i) => {
                p.role = roles[i]
                p.word = p.role === 'warga' ? spy[m.chat].words.warga : spy[m.chat].words.spy
            })
            
            // Send word to PM
            for (const player of spy[m.chat].players) {
                try {
                    await sock.sendMessage(player.id, {
                        text: `🕵️ *KATA RAHASIA*\n\n` +
                            `Kata kamu adalah: *${player.word}*\n\n` +
                            `> 💡 ${ROLES[player.role].desc}`,
                        contextInfo: getSpyContextInfo(`${ROLES[player.role].emoji} ${ROLES[player.role].name}`, 'Secret Word!')
                    })
                } catch (e) {
                    console.log(`[SPY] Failed to send word to ${player.id}:`, e.message)
                }
            }
            
            const playerList = spy[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')
            
            await m.react('💬')
            await sock.sendMessage(m.chat, {
                text: `🕵️ *GAME DIMULAI!*\n\n` +
                    `🗣️ *Ronde 1: Fase Diskusi*\n\n` +
                    `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
                    `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                    `> 📩 Cek PM untuk melihat KATA RAHASIA kalian!\n` +
                    `> 🗣️ Silakan deskripsikan kata kalian satu per satu.\n` +
                    `> ⏱️ Waktu diskusi: ${PHASE_DURATION.discussion / 1000} detik`,
                mentions: spy[m.chat].players.map(p => p.id),
                contextInfo: getSpyContextInfo('🗣️ DISKUSI', 'Mulai deskripsi!', thumbSpy, spy[m.chat].players.map(p => p.id))
            }, { quoted: m })
            
            spy[m.chat].timeout = setTimeout(() => {
                processVotingPhase(m.chat, sock, prefix)
            }, PHASE_DURATION.discussion)
        },
        
        vote: async () => {
            if (!spy[m.chat] || spy[m.chat].status !== 'playing') return m.reply(`❌ Tidak ada game aktif!`)
            if (spy[m.chat].phase !== 'vote') return m.reply(`❌ Sekarang bukan waktu voting!\n> Phase: ${spy[m.chat].phase === 'discussion' ? '🗣️ Diskusi' : spy[m.chat].phase}`)
            
            const player = spy[m.chat].players.find(p => p.id === m.sender)
            if (!player) return m.reply(`❌ Kamu bukan player dalam game ini!`)
            if (!player.alive) return m.reply(`❌ Kamu sudah mati! Tidak bisa vote.`)
            if (player.voted) return m.reply(`❌ Kamu sudah vote! Tunggu hasil voting.`)
            
            // Cek target (Bisa Reply, Tag, atau Nomor)
            let targetId = null
            if (m.quoted && m.quoted.sender) {
                targetId = m.quoted.sender
            } else if (m.mentions && m.mentions.length > 0) {
                targetId = m.mentions[0]
            } else if (target) {
                const targetNum = parseInt(target)
                const p = spy[m.chat].players.find(x => x.number === targetNum)
                if (p) targetId = p.id
            }

            if (!targetId) {
                const alivePlayers = spy[m.chat].players.filter(p => p.alive)
                const list = alivePlayers.map(p => `${p.number}. @${p.id.split('@')[0]}`).join('\n')
                return sock.sendMessage(m.chat, {
                    text: `🗳️ *VOTING SPY*\n\n` +
                        `Pilih siapa yang menurutmu Spy:\n\n${list}\n\n` +
                        `> Ketik: \`${prefix}spy vote <nomor/tag>\`\n` +
                        `> Atau balas (reply) pesan target dengan \`${prefix}spy vote\``,
                    mentions: alivePlayers.map(p => p.id),
                    contextInfo: getSpyContextInfo('🗳️ VOTING', 'Pilih Spy!')
                }, { quoted: m })
            }
            
            const targetPlayer = spy[m.chat].players.find(p => p.id === targetId)
            if (!targetPlayer) return m.reply(`❌ Player tersebut tidak ditemukan di game!`)
            if (!targetPlayer.alive) return m.reply(`❌ Player tersebut sudah mati!`)
            if (targetPlayer.id === m.sender) return m.reply(`❌ Kamu tidak bisa vote dirimu sendiri!`)
            
            player.voted = true
            spy[m.chat].votes[targetPlayer.id] = (spy[m.chat].votes[targetPlayer.id] || 0) + 1
            
            const alivePlayers = spy[m.chat].players.filter(p => p.alive)
            const votedCount = alivePlayers.filter(p => p.voted).length
            
            await m.react('🗳️')
            await sock.sendMessage(m.chat, {
                text: `🗳️ *VOTE TERCATAT*\n\n` +
                    `@${m.sender.split('@')[0]} mencurigai ➜ @${targetPlayer.id.split('@')[0]}\n\n` +
                    `> Progress: ${votedCount}/${alivePlayers.length}`,
                mentions: [m.sender, targetPlayer.id],
                contextInfo: getSpyContextInfo('🗳️ VOTE', `${votedCount}/${alivePlayers.length}`)
            }, { quoted: m })
            
            if (votedCount >= alivePlayers.length) {
                if (spy[m.chat].timeout) clearTimeout(spy[m.chat].timeout)
                await executeVote(m.chat, sock, db, prefix)
            }
        },
        
        player: async () => {
            if (!spy[m.chat]) return m.reply(`❌ Tidak ada game di room ini!`)
            
            const playerList = spy[m.chat].players.map((p, i) => {
                const status = p.alive ? '✅' : `☠️ (${ROLES[p.role]?.name || 'Unknown'})`
                return `${p.number}. @${p.id.split('@')[0]} ${status}`
            }).join('\n')
            
            const phaseEmoji = spy[m.chat].phase === 'discussion' ? '🗣️' : spy[m.chat].phase === 'vote' ? '🗳️' : '⏳'
            
            await sock.sendMessage(m.chat, {
                text: `🕵️ *WHO'S THE SPY - STATUS*\n\n` +
                    `╭┈┈⬡「 📊 *GAME INFO* 」\n` +
                    `┃ 🔄 Round: ${spy[m.chat].round}\n` +
                    `┃ ${phaseEmoji} Phase: ${spy[m.chat].phase}\n` +
                    `┃ 👤 Alive: ${spy[m.chat].players.filter(p => p.alive).length}\n` +
                    `┃ ☠️ Dead: ${spy[m.chat].dead.length}\n` +
                    `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                    `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
                    `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`,
                mentions: spy[m.chat].players.map(p => p.id),
                contextInfo: getSpyContextInfo('🕵️ STATUS', `Round ${spy[m.chat].round}`)
            }, { quoted: m })
        },
        
        exit: async () => {
            if (!spy[m.chat]) return m.reply(`❌ Tidak ada game di room ini!`)
            
            const playerIdx = spy[m.chat].players.findIndex(p => p.id === m.sender)
            if (playerIdx === -1) return m.reply(`❌ Kamu tidak ada di game ini!`)
            if (spy[m.chat].status === 'playing') return m.reply(`❌ Tidak bisa keluar saat game berjalan!`)
            
            spy[m.chat].players.splice(playerIdx, 1)
            spy[m.chat].players.forEach((p, i) => p.number = i + 1)
            
            if (spy[m.chat].players.length === 0) {
                if (spy[m.chat].timeout) clearTimeout(spy[m.chat].timeout)
                delete spy[m.chat]
                return m.reply(`🗑️ Room dihapus karena kosong.`)
            }
            
            if (spy[m.chat].owner === m.sender && spy[m.chat].players.length > 0) {
                spy[m.chat].owner = spy[m.chat].players[0].id
                await sock.sendMessage(m.chat, {
                    text: `👋 @${m.sender.split('@')[0]} keluar.\n👑 Host baru: @${spy[m.chat].owner.split('@')[0]}`,
                    mentions: [m.sender, spy[m.chat].owner],
                    contextInfo: getSpyContextInfo()
                }, { quoted: m })
            } else {
                await sock.sendMessage(m.chat, {
                    text: `👋 @${m.sender.split('@')[0]} keluar dari game.`,
                    mentions: [m.sender],
                    contextInfo: getSpyContextInfo()
                }, { quoted: m })
            }
        },
        
        delete: async () => {
            if (!spy[m.chat]) return m.reply(`❌ Tidak ada game di room ini!`)
            
            const isOwner = spy[m.chat].owner === m.sender
            const isBotOwner = config.isOwner?.(m.sender)
            
            if (!isOwner && !isBotOwner) return m.reply(`❌ Hanya host atau owner bot yang dapat menghapus!`)
            
            if (spy[m.chat].timeout) clearTimeout(spy[m.chat].timeout)
            delete spy[m.chat]
            
            await m.react('🗑️')
            await m.reply(`🗑️ Game dihapus!`)
        }
    }
    
    if (!action || !commands[action]) {
        return sock.sendMessage(m.chat, {
            text: `🕵️ *WHO'S THE SPY*\n\n` +
                `Temukan siapa yang memiliki kata berbeda!\n\n` +
                `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
                `┃ 🆕 \`${prefix}spy create\` - Buat room\n` +
                `┃ ➕ \`${prefix}spy join\` - Gabung\n` +
                `┃ ▶️ \`${prefix}spy start\` - Mulai (host)\n` +
                `┃ 🗳️ \`${prefix}spy vote <no/tag>\` - Vote eliminasi\n` +
                `┃ 👥 \`${prefix}spy player\` - List player\n` +
                `┃ 🚪 \`${prefix}spy exit\` - Keluar\n` +
                `┃ 🗑️ \`${prefix}spy delete\` - Hapus room\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Min: ${MIN_PLAYERS} players | Max: ${MAX_PLAYERS} players`,
            contextInfo: getSpyContextInfo('🕵️ WHO\'S THE SPY', 'Cari penyusup!')
        }, { quoted: m })
    }
    
    try {
        await commands[action]()
    } catch (error) {
        console.error('[SPY ERROR]', error)
        await m.reply(`❌ Terjadi error: ${error.message}`)
    }
}

// Proses perpindahan ke fase voting
async function processVotingPhase(chatId, sock, prefix) {
    const spy = global.spyGames
    if (!spy[chatId] || spy[chatId].phase !== 'discussion') return
    
    spy[chatId].phase = 'vote'
    spy[chatId].votes = {}
    spy[chatId].players.forEach(p => p.voted = false)
    
    const alivePlayers = spy[chatId].players.filter(p => p.alive)
    const playerList = alivePlayers.map(p => `${p.number}. @${p.id.split('@')[0]}`).join('\n')
    
    let text = `🗳️ *WAKTU VOTING!*\n\n` +
        `Fase diskusi telah berakhir.\nSiapa yang menurut kalian adalah SPY?\n\n` +
        `╭┈┈⬡「 👥 *PLAYER HIDUP* 」\n` +
        `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> Ketik \`${prefix}spy vote <nomor/tag>\`\n` +
        `> Atau balas pesan target dengan \`${prefix}spy vote\`\n` +
        `> ⏱️ Waktu: ${PHASE_DURATION.vote / 1000} detik`
    
    await sock.sendMessage(chatId, {
        text: text,
        mentions: spy[chatId].players.map(p => p.id),
        contextInfo: getSpyContextInfo('🗳️ VOTING', 'Waktunya eliminasi!', thumbSpy, spy[chatId].players.map(p => p.id))
    })
    
    spy[chatId].timeout = setTimeout(() => {
        executeVote(chatId, sock, getDatabase(), prefix)
    }, PHASE_DURATION.vote)
}

// Eksekusi hasil voting
async function executeVote(chatId, sock, db, prefix) {
    const spy = global.spyGames
    if (!spy[chatId] || spy[chatId].phase !== 'vote') return
    
    let maxVotes = 0
    let eliminated = null
    let isTie = false
    
    for (const [playerId, votes] of Object.entries(spy[chatId].votes)) {
        if (votes > maxVotes) {
            maxVotes = votes
            eliminated = playerId
            isTie = false
        } else if (votes === maxVotes && maxVotes > 0) {
            isTie = true
        }
    }
    
    let resultText = `⚖️ *HASIL VOTING*\n\n`
    
    if (isTie || maxVotes === 0) {
        resultText += `🤷 Tidak ada yang tereliminasi!\n`
        resultText += `> ${isTie ? 'Vote seri!' : 'Tidak ada yang vote.'}\n\n`
    } else if (eliminated) {
        const player = spy[chatId].players.find(p => p.id === eliminated)
        if (player) {
            player.alive = false
            spy[chatId].dead.push(player)
            
            resultText += `⚰️ @${eliminated.split('@')[0]} dieliminasi!\n`
            resultText += `> Ternyata dia adalah: ${ROLES[player.role].emoji} *${ROLES[player.role].name}*\n`
            resultText += `> Votes: ${maxVotes}\n\n`
        }
    }
    
    // Check Win Condition
    const winner = checkWinner(chatId)
    if (winner) {
        await sock.sendMessage(chatId, {
            text: resultText,
            mentions: eliminated ? [eliminated] : [],
            contextInfo: getSpyContextInfo('⚖️ HASIL', 'Game selesai!', thumbSpy)
        })
        await endGame(chatId, sock, db, winner)
        return
    }
    
    // Lanjut ke ronde berikutnya
    spy[chatId].phase = 'discussion'
    spy[chatId].round++
    
    resultText += `🔄 *RONDE ${spy[chatId].round} DIMULAI*\n\n`
    resultText += `> Spy masih berkeliaran! Lanjutkan diskusi.\n`
    resultText += `> ⏱️ Waktu diskusi: ${PHASE_DURATION.discussion / 1000} detik`
    
    await sock.sendMessage(chatId, {
        text: resultText,
        mentions: eliminated ? [eliminated] : [],
        contextInfo: getSpyContextInfo('🗣️ DISKUSI', `Ronde ${spy[chatId].round}`, thumbSpy)
    })
    
    spy[chatId].timeout = setTimeout(() => {
        processVotingPhase(chatId, sock, prefix)
    }, PHASE_DURATION.discussion)
}

// Cek Kondisi Menang
function checkWinner(chatId) {
    const spy = global.spyGames
    if (!spy[chatId]) return null
    
    const alivePlayers = spy[chatId].players.filter(p => p.alive)
    const spies = alivePlayers.filter(p => p.role === 'spy')
    const warga = alivePlayers.filter(p => p.role === 'warga')
    
    if (spies.length === 0) return 'warga'
    if (spies.length >= warga.length) return 'spy' // Spy menang jika jumlahnya sama/lebih dari warga yang tersisa
    
    return null
}

// Selesai Game dan Pemberian Reward
async function endGame(chatId, sock, db, winner) {
    const spy = global.spyGames
    if (!spy[chatId]) return
    
    if (spy[chatId].timeout) clearTimeout(spy[chatId].timeout)
    
    const winningTeam = winner === 'spy' ? 'spy' : 'warga'
    const winningPlayers = spy[chatId].players.filter(p => p.role === winningTeam)
    
    // Give rewards
    for (const player of winningPlayers) {
        try {
            db.updateKoin(player.id, WIN_REWARD.koin)
            const user = db.getUser(player.id)
            if (user) {
                user.exp = (user.exp || 0) + WIN_REWARD.exp
                db.setUser(player.id, user)
            }
        } catch (e) {
            console.log(`[SPY] Failed to give reward to ${player.id}:`, e.message)
        }
    }
    
    const allPlayers = spy[chatId].players.map(p => {
        const status = p.alive ? '✅' : '☠️'
        const isWinner = winningPlayers.some(w => w.id === p.id) ? '🏆' : ''
        return `${status} @${p.id.split('@')[0]} - ${ROLES[p.role].emoji} ${ROLES[p.role].name} (${p.word}) ${isWinner}`
    }).join('\n')
    
    await sock.sendMessage(chatId, {
        text: `🎉 *GAME OVER!*\n\n` +
            `${winner === 'spy' ? '🕵️ *SPY MENANG!*' : '👨‍🌾 *WARGA MENANG!*'}\n\n` +
            `Kata Warga: *${spy[chatId].words.warga}*\n` +
            `Kata Spy: *${spy[chatId].words.spy}*\n\n` +
            `╭┈┈⬡「 👥 *SEMUA PLAYER* 」\n` +
            `${allPlayers.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
            `┃ 💰 +${WIN_REWARD.koin.toLocaleString()} Koin\n` +
            `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> GG WP! Main lagi? \`${config.command?.prefix || '.'}spy create\``,
        mentions: spy[chatId].players.map(p => p.id),
        contextInfo: getSpyContextInfo(
            '🏆 GAME OVER', 
            `${winner === 'spy' ? 'Spy' : 'Warga'} wins!`,
            thumbWin
        )
    })
    
    delete spy[chatId]
}

module.exports = {
    config: pluginConfig,
    handler,
    ROLES,
    getSpyContextInfo
}
