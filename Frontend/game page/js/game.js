'use strict';

//Asset Directory Constants
const TILE_IMAGE_DIR = 'assets/tiles/';
const FACTORY_BG_IMAGE = 'assets/factory/factory.jpg';
const BOARD_BG_IMAGE = 'assets/images/background board texture.jpg';
const BACKGROUND_IMAGE = 'assets/images/tabel background.png';

const TILE_IMAGES = {
    0: TILE_IMAGE_DIR + 'blue.png',
    1: TILE_IMAGE_DIR + 'yellow.png',
    2: TILE_IMAGE_DIR + 'red.png',
    3: TILE_IMAGE_DIR + 'black.png',
    4: TILE_IMAGE_DIR + 'lightblue.png',
    10: TILE_IMAGE_DIR + 'token.jpg'
};



let selectedFactoryId = null;
let selectedTileType = null;

const API_BASE = 'https://localhost:5051/api';

const urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('gameId');
const tableId = urlParams.get('tableId');

//Utility functions
function getAuthToken() {
    return localStorage.getItem('authToken');
}
function getCurrentUser() {
    let user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}
let notificationTimeout = null;

function showNotification(msg, duration = 2000) {
    const notif = document.getElementById('notification');
    notif.textContent = msg;
    notif.style.display = 'block';
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    notificationTimeout = setTimeout(() => {
        notif.style.display = 'none';
        notificationTimeout = null;
    }, duration);
}


// Background music
document.addEventListener('DOMContentLoaded', function () {
    // Playlist array
    const playlist = [
        { src: 'assets/music/Mexican Background Music.mp3', title: "Track 1" },
        { src: 'assets/music/Upbeat background music.mp3', title: "Track 2" }
    ];

    let currentTrack = 0;
    const audio = document.getElementById('bg-music');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const trackTitle = document.getElementById('track-title');

    // Load the first track
    function loadTrack(index) {
        audio.src = playlist[index].src;
        audio.volume = 0.5;
        trackTitle.textContent = playlist[index].title;
    }
    loadTrack(currentTrack);

    // Play after user interaction (due to autoplay restrictions)
    playBtn.addEventListener('click', () => {
        audio.play();
    });

    pauseBtn.addEventListener('click', () => {
        audio.pause();
    });

    nextBtn.addEventListener('click', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
        audio.play();
    });

    prevBtn.addEventListener('click', () => {
        currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrack);
        audio.play();
    });

    // Auto-play next track when current ends
    audio.addEventListener('ended', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
        audio.play();
    });


        const musicToggle = document.getElementById('music-toggle');
        const musicMenu = document.getElementById('music-menu');
        const closeMusicMenu = document.getElementById('close-music-menu');

        musicToggle.addEventListener('click', () => {
            musicMenu.classList.add('active');
        });

        closeMusicMenu.addEventListener('click', () => {
            musicMenu.classList.remove('active');
        });

        document.addEventListener('mousedown', (e) => {
            if (
                musicMenu.classList.contains('active') &&
                !musicMenu.contains(e.target) &&
                e.target !== musicToggle
            ) {
                musicMenu.classList.remove('active');
            }
        });
});

document.addEventListener('DOMContentLoaded', function () {
    const rulesToggle = document.getElementById('rules-toggle');
    const rulesMenu = document.getElementById('rules-menu');
    const closeRulesMenu = document.getElementById('close-rules-menu');

    rulesToggle.addEventListener('click', () => {
        rulesMenu.classList.add('active');
    });

    closeRulesMenu.addEventListener('click', () => {
        rulesMenu.classList.remove('active');
    });

    document.addEventListener('mousedown', (e) => {
        if (
            rulesMenu.classList.contains('active') &&
            !rulesMenu.contains(e.target) &&
            e.target !== rulesToggle
        ) {
            rulesMenu.classList.remove('active');
        }
    });
});


//Overlay/modal helpers
function showOverlay(html) {
    let overlay = document.getElementById('azul-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'azul-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.45)';
        overlay.style.zIndex = 1000;
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div style="background:#fff;padding:28px 32px;border-radius:12px;box-shadow:0 2px 16px #0004;min-width:260px;max-width:90vw;">${html}</div>`;
    overlay.onclick = e => {
        if (e.target === overlay) hideOverlay();
    };
}
function hideOverlay() {
    let overlay = document.getElementById('azul-overlay');
    if (overlay) overlay.remove();
}

function SoundPool(src, channels = 5) {
    this.pool = [];
    this.index = 0;
    for (let i = 0; i < channels; i++) {
        this.pool.push(new Audio(src));
    }
}
SoundPool.prototype.play = function(playbackRate = 1.0) {
    this.pool[this.index].currentTime = 0;
    this.pool[this.index].playbackRate = playbackRate;
    this.pool[this.index].play();
    this.index = (this.index + 1) % this.pool.length;
};


const soundEffects = {
    errorSound1: new SoundPool('assets/sounds/error-sound-1.mp3', 1),
    tilePlacingSound: new SoundPool('assets/sounds/tile-placing-sound.mp3', 1),
    leaveButtonSound: new SoundPool('assets/sounds/leave-button-sound.mp3', 1),
};

function playSound(name, playbackRate = 1.0) {
    if (soundEffects[name]) {
        soundEffects[name].play(playbackRate);
    }
}

//Factories & Center in a Circle
function renderFactoryCircle(factories, center, game, isMyTurn) {
    const circleDiv = document.getElementById('factory-circle');
    if (!circleDiv) return;
    circleDiv.innerHTML = '';

    const n = factories.length;
    const radius = 200;
    const cx = 240, cy = 240;

    factories.forEach((factory, i) => {
        const angle = ((2 * Math.PI) / n) * i - Math.PI / 2;
        const x = cx + radius * Math.cos(angle) - 55;
        const y = cy + radius * Math.sin(angle) - 55;
        const div = document.createElement('div');
        div.className = 'factory';
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.backgroundImage = `url('${FACTORY_BG_IMAGE}')`;

        // Count tiles by type
        const tileCounts = {};
        (factory.tiles || []).forEach(tile => {
            tileCounts[tile] = (tileCounts[tile] || 0) + 1;
        });

        // Render each tile with highlight if selected
        div.innerHTML = (factory.tiles || []).map(tile => {
            const isSelected = isMyTurn && selectedFactoryId === factory.id && selectedTileType == tile;
            const count = tileCounts[tile];
            return `<div class="factory-tile${isSelected ? ' selected-tile' : ''}" 
                style="background-image:url('${TILE_IMAGES[tile] || ''}')" 
                data-factory-id="${factory.id}" 
                data-tile-type="${tile}"
                title="${tile}">
                ${isSelected ? `<span class="tile-badge">${count}</span>` : ''}
            </div>`;
        }).join('');

        // Add click handler to each tile
        div.querySelectorAll('.factory-tile').forEach(tileDiv => {
            tileDiv.onclick = () => {
                if (!isMyTurn) return;
                selectedFactoryId = factory.id;
                selectedTileType = tileDiv.getAttribute('data-tile-type');
                renderFactoryCircle(factories, center, game, isMyTurn); // re-render to show highlight
                //show how many tiles will be taken
                showNotification(`You will take ${tileCounts[selectedTileType]} tile(s) of this color.`);
            };
        });
        circleDiv.appendChild(div);
    });

    // Render center
    const centerDiv = document.createElement('div');
    centerDiv.id = 'table-center';
    // Count tiles by type
    const centerTileCounts = {};
    (center.tiles || []).forEach(tile => {
        centerTileCounts[tile] = (centerTileCounts[tile] || 0) + 1;
    });
    centerDiv.innerHTML = (center.tiles || []).map(tile => {
        const isSelected = isMyTurn && selectedFactoryId === center.id && selectedTileType == tile;
        const count = centerTileCounts[tile];
        return `<div class="center-tile${isSelected ? ' selected-tile' : ''}" 
                    style="background-image:url('${TILE_IMAGES[tile] || ''}')" 
                    data-factory-id="${center.id}"
                    data-tile-type="${tile}"
                    title="${tile}">
                    ${isSelected ? `<span class="tile-badge">${count}</span>` : ''}
            </div>`;
    }).join('');

    centerDiv.querySelectorAll('.center-tile').forEach(tileDiv => {
        tileDiv.onclick = () => {
            if (!isMyTurn) return;
            selectedFactoryId = center.id;
            selectedTileType = tileDiv.getAttribute('data-tile-type');
            renderFactoryCircle(factories, center, game, isMyTurn); // re-render to show highlight
            renderTakeTilesButton();
            showNotification(`You will take ${centerTileCounts[selectedTileType]} tile(s) of this color.`);
        };
    });
    renderTakeTilesButton();
    circleDiv.appendChild(centerDiv);
}

function renderTakeTilesButton() {
    let btn = document.getElementById('take-tiles-btn');
    let factoryArea = document.getElementById('factory-area');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'take-tiles-btn';
        btn.textContent = 'Take selected tiles';
        btn.className = 'azul-action-btn';
        // Insert the button if not present
        factoryArea.appendChild(btn);
    }
    btn.style.display = (selectedTileType !== null && selectedFactoryId !== null) ? 'block' : 'none';
    btn.onclick = () => {
        if (selectedFactoryId && selectedTileType !== null) {
            takeTiles(selectedFactoryId, selectedTileType);
            selectedFactoryId = null;
            selectedTileType = null;
            renderTakeTilesButton();
        }
    };
}




//Boards
function renderBoards(players, currentPlayerId, playerToPlayId, game, isMyTurn) {


    const boardsDiv = document.getElementById('boards');
    if (!boardsDiv) return;
    boardsDiv.innerHTML = '';
    if (!players || !Array.isArray(players)) return;
    players.forEach((player, idx) => {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'player-board' + (player.id === currentPlayerId ? ' active' : '');
        boardDiv.style.backgroundImage = `url('${BOARD_BG_IMAGE}')`;

        //PATTERN LINES
        let patternLinesHtml = '';
        if (player.board && Array.isArray(player.board.patternLines)) {
            patternLinesHtml = player.board.patternLines.map((patternLine, plIdx) => {
                const tiles = [];
                const nTiles = Math.min(patternLine.tiles ? patternLine.tiles.length : 0, patternLine.length);
                const nEmpty = patternLine.length - nTiles;
                for (let i = 0; i < nEmpty; i++) {
                    tiles.push(`<div class="pattern-tile empty"></div>`);
                }

                for (let i = 0; i < nTiles; i++) {
                    const tileType = parseInt(patternLine.tiles[i]);
                    tiles.push(`<div class="pattern-tile" style="background-image:url('${TILE_IMAGES[parseInt(tileType)] || ''}')"></div>`);
                }

                let clickable = '';
                if (
                    isMyTurn &&
                    player.id === currentPlayerId &&
                    player.tilesToPlace &&
                    player.tilesToPlace.length > 0 &&
                    (!patternLine.tileType || patternLine.tileType === player.tilesToPlace[0]) &&
                    !patternLine.isComplete
                ) {
                    clickable = `style="cursor:pointer;outline:2px solid #f4a261;" onclick="window.__azulPlaceTilesPattern(${plIdx})"`;
                }
                return `<div class="pattern-line-row" ${clickable}>${tiles.join('')}</div>`;
            }).join('');

        }

        //FLOOR LINE
        let floorHtml = '';

        if (player.board && Array.isArray(player.board.floorLine)) {
            floorHtml = player.board.floorLine.map(tileSpot =>
                tileSpot.hasTile && tileSpot.type != null
                    ? `<div class="floor-tile" style="background-image:url('${TILE_IMAGES[parseInt(tileSpot.type)] || ''}')"></div>`
                    : `<div class="floor-tile"></div>`
            ).join('');

        }

        //WALL
        let wallHtml = '';
        if (player.board && player.board.wall) {
            wallHtml = Array.from(player.board.wall).map(row =>
                `<div class="wall-row">${Array.from(row).map(tileSpot => {
                    return `<div class="wall-tile${tileSpot.hasTile ? '' : ' wall-tile-empty'}" style="background-image:url('${TILE_IMAGES[parseInt(tileSpot.type)] || ''}')"></div>`;
                }).join('')}</div>`
            ).join('');
        }

        boardDiv.innerHTML = `
            <div class="player-name">
                ${player.name}
                ${player.id === playerToPlayId ? '<span class="turn-indicator"> TURN</span>' : ''}
            </div>
            <div class="score">Score: ${player.board?.score ?? 0}</div>
            <div class="board-flex">
                <div class="pattern-lines-vertical">
                    ${patternLinesHtml}
                </div>
                <div class="wall">${wallHtml}</div>
            </div>
            <div class="floor-line" id="floor-line-${player.id}">${floorHtml}</div>
            ${player.hasStartingTile ? '<div class="turn-indicator">Has Starting Tile</div>' : ''}
        `;

        boardsDiv.appendChild(boardDiv);

        // Maak vloer klikbaar indien nodig
        if (isMyTurn && player.id === currentPlayerId && player.tilesToPlace && player.tilesToPlace.length > 0) {
            const floorDiv = boardDiv.querySelector(`#floor-line-${player.id}`);
            if (floorDiv) {
                floorDiv.style.cursor = 'pointer';
                floorDiv.style.outline = '2px solid #f4a261';
                floorDiv.onclick = () => window.__azulPlaceTilesFloor();
            }
        }
    });
}

//Game Rendering
function renderGame(game) {
    try {
        if (game.hasEnded) {
            showWinnerModal(game);
            return;
        }

        document.getElementById('round-info').textContent = `Round: ${game.roundNumber}`;
        const currentUser = getCurrentUser();
        const myPlayer = game.players.find(p => p.id === currentUser?.id);
        const isMyTurn = game.playerToPlayId === currentUser?.id && !game.hasEnded;
        renderFactoryCircle(game.tileFactory?.displays, game.tileFactory?.tableCenter, game, isMyTurn);
        renderBoards(game.players, currentUser?.id, game.playerToPlayId, game, isMyTurn);

        // Check of ik tegels moet plaatsen
        if (isMyTurn && myPlayer && myPlayer.tilesToPlace && myPlayer.tilesToPlace.length > 0) {
            showNotification("Click on a row or the floorline to place your tiles!");
        }
    } catch (err) {
        showNotification('Could not render game');

    }

}

function updateScoreboard(game) {
    const scoreboard = document.getElementById('scoreboard');
    const players = Array.isArray(game.players) ? game.players : [];
    if (!players.length) {
        scoreboard.innerHTML = '<h3>Scores</h3><p>(geen spelers gevonden)</p>';
        return;
    }
    scoreboard.innerHTML = '<h3>Scores</h3><ul>' +
        players.map(p => `<li>${p.name}: ${p.board.score} punten</li>`).join('') +
        '</ul>';
}

function showWinnerModal(game) {
    const players = Array.isArray(game.Players) ? game.Players : [];
    // Find highest score
    const maxScore = Math.max(...players.map(p => p.Board.Score));
    const winners = players.filter(p => p.Board.Score === maxScore);

    // In case of tie, check for most complete horizontal lines
    let winnerNames = winners.map(w => w.Name);
    if (winners.length > 1) {
        let maxRows = Math.max(...winners.map(p => countCompletedRows(p.Board.Wall)));
        const bestWinners = winners.filter(p => countCompletedRows(p.Board.Wall) === maxRows);
        winnerNames = bestWinners.map(w => w.Name);
    }

    const summary = document.getElementById('winnerSummary');
    summary.innerHTML = `
        <h4>Eindscore:</h4>
        <ul>
            ${players.map(p => `<li>${p.Name}: ${p.Board.Score} punten</li>`).join('')}
        </ul>
    `;

    document.getElementById('main-content').classList.add('blur-bg');
    document.getElementById('winnerModal').style.display = 'flex';
}

function hideWinnerModal() {
    document.getElementById('main-content').classList.remove('blur-bg');
    document.getElementById('winnerModal').style.display = 'none';

}


function countCompletedRows(wall) {
    let count = 0;
    for (let row = 0; row < wall.length; row++) {
        if (wall[row].every(spot => spot.HasTile)) count++;
    }
    return count;
}

// Button handler to return to lobby
document.getElementById('returnToLobbyBtn').onclick = function() {
    window.location.href = '/lobby page/lobby.html';
};


async function takeTiles(displayId, tileType) {
    try {
        const res = await fetch(`${API_BASE}/Games/${gameId}/take-tiles`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayId,
                tileType: parseInt(tileType)
            })
        });
        if (!res.ok) {
            playSound('errorSound1');
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Could not take tiles!');
        }
        showNotification('Tiles taken! Now place them on your board.');
        pollGameState();
    } catch (err) {
        playSound('errorSound1');
        showNotification(err.message || 'Error while taking tiles.');
    }
}

//Interactie: Tegels plaatsen
window.__azulPlaceTilesPattern = async (idx) => {
    playSound('tilePlacingSound',2.5);
    try {
        const res = await fetch(`${API_BASE}/Games/${gameId}/place-tiles-on-patternline`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ patternLineIndex: idx })
        });
        if (!res.ok) {
            playSound('errorSound1');
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Could not place tiles!');
        }
        showNotification('Tiles placed!');

        pollGameState();
    } catch (err) {
        playSound('errorSound1');
        showNotification(err.message || 'Error while placing!');
    }
};
window.__azulPlaceTilesFloor = async () => {
    playSound('tilePlacingSound',2.5);
    try {
        const res = await fetch(`${API_BASE}/Games/${gameId}/place-tiles-on-floorline`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getAuthToken() }
        });
        if (!res.ok) {
            playSound('errorSound1');
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Could not place tiles!');
        }
        showNotification('Tiles placed on floorline!');

        pollGameState();
    } catch (err) {
        playSound('errorSound1');
        showNotification(err.message || 'Error while placing on floorline!');
    }
};

//API Calls & Polling
async function fetchTable(tableId) {
    const response = await fetch(`${API_BASE}/Tables/${tableId}`, {
        headers: { 'Authorization': 'Bearer ' + getAuthToken() }
    });
    if (!response.ok) throw new Error('Failed to fetch table');
    return await response.json();
}
async function pollForGameId() {
    if (!tableId) return;
    while (true) {
        try {
            const table = await fetchTable(tableId);
            if (table.gameId && table.gameId !== '00000000-0000-0000-0000-000000000000') {
                window.location.href = `game.html?gameId=${table.gameId}`;
                return;
            }
        } catch (err) {}
        showNotification("Waitin until game starts...", 1000);
        await new Promise(res => setTimeout(res, 2000));
    }
}
async function fetchGameWithRetry(gameId, maxRetries = 2, delayMs = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(`${API_BASE}/Games/${gameId}`, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            if (response.ok) {
                return await response.json();
            }
            if (response.status === 404) {
                attempt++;
                await new Promise(res => setTimeout(res, delayMs));
            } else {
                throw new Error('Error while catching game');
            }
        } catch (err) {
            attempt++;
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    throw new Error('Error while loading game!');
}

async function placeTilesOnPatternLine(gameId, patternLineIndex) {
    await fetch(`/api/Games/${gameId}/place-tiles-on-patternline`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ patternLineIndex })
    });
}

async function placeTilesOnFloorLine(gameId) {
    await fetch(`/api/Games/${gameId}/place-tiles-on-floorline`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
        }
    });
}


let pollInterval = null;
async function pollGameState() {
    try {
        const game = await fetchGameWithRetry(gameId, 2, 800);
        renderGame(game);
        updateScoreboard(game);

        if (game.hasEnded) {
            if (pollInterval) clearTimeout(pollInterval);
            pollInterval = null;
            showWinnerModal(game);
            return;
        }

        if (pollInterval) clearTimeout(pollInterval);
        const currentUser = getCurrentUser();
        const isMyTurn = game.playerToPlayId === currentUser?.id && !game.hasEnded;
        pollInterval = setTimeout(pollGameState, isMyTurn ? 1200 : 2500);
    } catch (err) {
        showNotification(err.message || 'Error while catching game');
        pollInterval = setTimeout(pollGameState, 3000);
    }

// Assume: game is the latest game state object
    const allTilesPlaced = game.players.every(p => p.tilesToPlace.length === 0);
    const allDisplaysEmpty =
        game.tileFactory.displays.every(d => d.tiles.length === 0) &&
        game.tileFactory.tableCenter.tiles.length === 0;

// Defensive: If it's my turn, all tiles are placed, and all displays are empty, force a dummy place-tiles call
    const currentUser = getCurrentUser();
    if (
        allTilesPlaced &&
        allDisplaysEmpty &&
        game.playerToPlayId === currentUser.id
    ) {
        // Try to POST to /api/Games/{gameId}/place-tiles-on-floorline
        fetch(`/api/Games/${game.id}/place-tiles-on-floorline`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        }).then(() => pollGameState());
    }



}


async function leaveGame() {
    const tableId = localStorage.getItem('tableId');
    if (tableId) {
        try {
            await fetch(`${API_BASE}/Tables/${tableId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
        } catch (err) {
            console.error('Error leaving table:', err);
        }
        localStorage.removeItem('tableId');
    }
    localStorage.removeItem('gameId');
    localStorage.removeItem('currentTableId');
    localStorage.removeItem('currentTableSeats');
    window.location.href = '../lobby page/lobby.html';
}


//Opstarten
window.addEventListener('DOMContentLoaded', () => {
    document.body.style.background = `none`;
    document.body.style.backgroundImage = `url('${BACKGROUND_IMAGE}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    document.getElementById('returnToLobbyBtn').onclick = function() {
        hideWinnerModal();
        leaveGame(); //notify backend and clean up
        window.location.href = '../lobby page/lobby.html';
    };



    if (!gameId && tableId) {
        pollForGameId();
    } else if (gameId) {
        pollGameState();
    }
    const leaveBtn = document.getElementById('leave-game');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', function(e) {
            playSound('leaveButtonSound');
            setTimeout(() => {
                leaveGame();
            }, 1000);
        });
    }

});
