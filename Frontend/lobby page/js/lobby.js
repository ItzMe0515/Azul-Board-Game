'use strict';

const API_BASE = '/api';
let selectedPlayerCount = null;
let currentTableId = null;
let pollingInterval = null;

// DOM Elements
const usernameSpan = document.getElementById('username');
const playerButtons = document.querySelectorAll('.player-btn');
const joinBtn = document.getElementById('join-btn');
const playerCountInput = document.getElementById('player-count');
const lobbyErrorDiv = document.getElementById('lobby-error');
const waitingRoomDiv = document.getElementById('waiting-room');
const tableIdSpan = document.getElementById('table-id');
const seatsTakenSpan = document.getElementById('seats-taken');
const seatsTotalSpan = document.getElementById('seats-total');
const playersList = document.getElementById('players');
const leaveBtn = document.getElementById('leave-btn');
const waitingErrorDiv = document.getElementById('waiting-error');
const gameTypeForm = document.getElementById('game-type-form');

// Utility Functions
function getAuthToken() {
    return localStorage.getItem('authToken');
}
function getCurrentUser() {
    let user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}
function showLobbyError(message) {
    lobbyErrorDiv.textContent = message || '';
    lobbyErrorDiv.style.display = message ? 'block' : 'none';
}
function showWaitingError(message) {
    waitingErrorDiv.textContent = message || '';
    waitingErrorDiv.style.display = message ? 'block' : 'none';
}
function resetJoinBtn() {
    joinBtn.disabled = true;
    joinBtn.textContent = 'Find or Create Table';
}

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../index.html';
        return;
    }
    usernameSpan.textContent = user.userName || user.username || user.email || 'Unknown';

    // Herstel tafelstatus na reload
    const savedTableId = localStorage.getItem('currentTableId');
    if (savedTableId) {
        try {
            let response = await fetch(`${API_BASE}/Tables/${savedTableId}`, {
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            if (response.ok) {
                let table = await response.json();
                const playersArr = table.currentPlayers || table.seatedPlayers || [];
                const isStillSeated = playersArr.some(player => {
                    const playerName = player.userName || player.username || player.email || player.name || 'Unknown';
                    return playerName === (user.userName || user.username || user.email || user.name);
                });
                if (isStillSeated) {
                    currentTableId = table.id;
                    let seats = (table.Preferences && table.Preferences.NumberOfPlayers)
                        || table.numberOfPlayers
                        || table.playerCount
                        || localStorage.getItem('currentTableSeats')
                        || selectedPlayerCount;
                    if (seats) localStorage.setItem('currentTableSeats', seats);
                    showWaitingRoom(table);
                    leaveBtn.disabled = false;
                    if (pollingInterval) clearInterval(pollingInterval);
                    pollingInterval = setInterval(() => pollTableStatus(savedTableId), 2000);
                    return;
                } else {
                    localStorage.removeItem('currentTableId');
                    localStorage.removeItem('currentTableSeats');
                }
            } else {
                localStorage.removeItem('currentTableId');
                localStorage.removeItem('currentTableSeats');
            }
        } catch (err) {
            localStorage.removeItem('currentTableId');
            localStorage.removeItem('currentTableSeats');
        }
    }

    waitingRoomDiv.classList.add('hidden');
    showLobbyError('');
    showWaitingError('');

    // Player count selection
    playerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            playerButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPlayerCount = parseInt(btn.dataset.count, 10);
            playerCountInput.value = selectedPlayerCount;
            joinBtn.disabled = false;
            showLobbyError('');
        });
    });

    // Join/Create Table
    gameTypeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        joinBtn.disabled = true;
        joinBtn.textContent = 'Joining...';
        showLobbyError('');

        if (!selectedPlayerCount) {
            showLobbyError('Please select the number of players.');
            resetJoinBtn();
            return;
        }

        try {
            let response = await fetch(`${API_BASE}/Tables/join-or-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                body: JSON.stringify({
                    numberOfPlayers: selectedPlayerCount
                })
            });

            let text = await response.text();
            let result = {};
            if (text) {
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    showLobbyError('Invalid server response!');
                    resetJoinBtn();
                    return;
                }
            }

            if (!response.ok) {
                showLobbyError(result.message || 'Could not join or create table!');
                resetJoinBtn();
                return;
            }

            showLobbyError('');
            let seats = (result.Preferences && result.Preferences.NumberOfPlayers)
                || result.numberOfPlayers
                || result.playerCount
                || selectedPlayerCount;
            if (seats) localStorage.setItem('currentTableSeats', seats);
            showWaitingRoom(result);
            localStorage.setItem('currentTableId', result.id);
            currentTableId = result.id;

            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(() => pollTableStatus(result.id), 2000);

        } catch (err) {
            showLobbyError('Could not connect to the server!');
            resetJoinBtn();
        }
    });

    // Leave Table (eventlistener HIER, NIET in showWaitingRoom)
    leaveBtn.addEventListener('click', async () => {
        if (!currentTableId) return;
        leaveBtn.disabled = true;
        showWaitingError('');
        try {
            let response = await fetch(`${API_BASE}/Tables/${currentTableId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
            if (!response.ok) {
                let err = {};
                try { err = await response.json(); } catch {}
                showWaitingError(err.message || 'Failed to leave table.');
                leaveBtn.disabled = false;
                return;
            }
            if (pollingInterval) clearInterval(pollingInterval);
            waitingRoomDiv.classList.add('hidden');
            gameTypeForm.style.display = '';
            playerButtons.forEach(b => b.classList.remove('selected'));
            playerCountInput.value = '';
            selectedPlayerCount = null;
            resetJoinBtn();
            localStorage.removeItem('currentTableId');
            localStorage.removeItem('currentTableSeats');
            currentTableId = null;
        } catch (err) {
            showWaitingError('Failed to leave table.');
            leaveBtn.disabled = false;
        }
    });
});

// UI Functions
function showWaitingRoom(table) {
    currentTableId = table.id;
    localStorage.setItem('currentTableId', currentTableId);

    let seats = (table.Preferences && table.Preferences.NumberOfPlayers)
        || table.numberOfPlayers
        || table.playerCount
        || localStorage.getItem('currentTableSeats')
        || selectedPlayerCount;
    if (seats) localStorage.setItem('currentTableSeats', seats);

    waitingRoomDiv.classList.remove('hidden');
    gameTypeForm.style.display = 'none';
    showWaitingError('');
    leaveBtn.disabled = false;
    renderTableStatus(table);
}

function renderTableStatus(table) {
    tableIdSpan.textContent = table.id || '-';
    let totalSeats = (table.Preferences && table.Preferences.NumberOfPlayers)
        || table.numberOfPlayers
        || table.playerCount
        || localStorage.getItem('currentTableSeats')
        || selectedPlayerCount
        || '-';
    seatsTotalSpan.textContent = totalSeats;

    const playersArr = table.currentPlayers || table.seatedPlayers || [];
    seatsTakenSpan.textContent = playersArr.length;

    playersList.innerHTML = '';
    const user = getCurrentUser();

    playersArr.forEach(player => {
        let li = document.createElement('li');
        const playerName = player.userName || player.username || player.email || player.name || 'Unknown';
        const isSelf = (
            playerName === (user.userName || user.username || user.email || user.name)
        );
        li.className = 'player' + (isSelf ? ' self' : '');
        li.innerHTML = `
            <span class="avatar">${isSelf ? '🧑' : '👤'}</span>
            <span class="name">${isSelf ? `You (${playerName})` : playerName}</span>
        `;
        playersList.appendChild(li);
    });
    for (let i = playersArr.length; i < totalSeats; i++) {
        let li = document.createElement('li');
        li.className = 'player empty';
        li.innerHTML = `<span class="avatar">+</span><span class="name">Waiting...</span>`;
        playersList.appendChild(li);
    }
}

async function pollTableStatus(tableId) {
    try {
        let response = await fetch(`${API_BASE}/Tables/${tableId}`, {
            headers: {
                'Authorization': 'Bearer ' + getAuthToken()
            }
        });
        if (!response.ok) return;
        let table = await response.json();
        renderTableStatus(table);

        const totalSeats = (table.Preferences && table.Preferences.NumberOfPlayers)
            || table.numberOfPlayers
            || table.playerCount
            || localStorage.getItem('currentTableSeats')
            || selectedPlayerCount
            || 0;
        const playersArr = table.currentPlayers || table.seatedPlayers || [];
        if (playersArr.length === Number(totalSeats)) {
            clearInterval(pollingInterval);
            window.location.href = `../game page/game.html?tableId=${table.id}`;
        }
    } catch (err) {
        showWaitingError('Error updating table status.');
    }
}
