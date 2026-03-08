// ==========================================
// 1. GAME DATA & RESOURCES
// ==========================================
const classStats = {
    'Knight': { hp: 150, atk: 25, def: 20 },
    'Mage': { hp: 80, atk: 40, def: 5 },
    'Archer': { hp: 100, atk: 35, def: 10 }
};

let player = { name: "", hp: 0, maxHp: 0, atk: 0, def: 0 };
let enemy = { name: "Void Minotaur", hp: 100, maxHp: 100, atk: 15, def: 5 };

// Economy & Progression State
let playerGold = parseInt(localStorage.getItem('playerGold')) || 0;
let playerLevel = parseInt(localStorage.getItem('playerLevel')) || 1;
let playerExp = parseInt(localStorage.getItem('playerExp')) || 0;

function getExpRequirement(level) {
    return level * 100; // Lv 1 needs 100, Lv 2 needs 200, etc.
}

function updateResourceUI() {
    document.getElementById('gold-display').innerText = playerGold;
    
    // Update Town Hall UI
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    let upgradeCost = cityLevel * 50; 
    
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (!localStorage.getItem('upgradeFinishTime')) {
        upgradeBtn.innerText = `Upgrade (Cost: ${upgradeCost}g)`;
        if (playerGold < upgradeCost) {
            upgradeBtn.style.background = "#885555";
        } else {
            upgradeBtn.style.background = "#00d2ff";
        }
    }
}

// ==========================================
// 2. HERO PROGRESSION & COMBAT
// ==========================================
function selectClass(className) {
    localStorage.setItem('selectedHero', className);
    setupPlayer(className);
}

function setupPlayer(className) {
    player.name = className;
    document.getElementById('status-message').innerText = `Active Hero: ${className}`;
    document.getElementById('player-name').innerText = className;
    document.getElementById('attack-btn').disabled = false;
    
    calculatePlayerStats();
    logBattle(`You selected the ${className}. The arena is ready!`);
}

function calculatePlayerStats() {
    if (!player.name) return;

    const baseStats = classStats[player.name];
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    
    // Multipliers for stats
    let cityBonus = cityLevel - 1;
    let heroBonus = playerLevel - 1;

    // Both Town Hall AND Hero Level increase stats now!
    player.maxHp = baseStats.hp + (cityBonus * 20) + (heroBonus * 30);
    player.atk = baseStats.atk + (cityBonus * 5) + (heroBonus * 8);
    player.def = baseStats.def + (cityBonus * 3) + (heroBonus * 5);
    
    player.hp = player.maxHp; 
    updateHealthAndExpBars();
}

function updateHealthAndExpBars() {
    // Player HP
    const playerHpPercent = Math.max((player.hp / player.maxHp) * 100, 0);
    document.getElementById('player-hp-bar').style.width = playerHpPercent + '%';
    document.getElementById('player-hp-text').innerText = `${Math.max(player.hp, 0)} / ${player.maxHp}`;

    // Enemy HP
    const enemyHpPercent = Math.max((enemy.hp / enemy.maxHp) * 100, 0);
    document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
    document.getElementById('enemy-hp-text').innerText = `${Math.max(enemy.hp, 0)} / ${enemy.maxHp}`;

    // Player EXP & Level
    document.getElementById('player-lvl-text').innerText = playerLevel;
    let expNeeded = getExpRequirement(playerLevel);
    const expPercent = Math.min((playerExp / expNeeded) * 100, 100);
    document.getElementById('player-exp-bar').style.width = expPercent + '%';
    document.getElementById('player-exp-text').innerText = `${playerExp} / ${expNeeded}`;
}

function logBattle(message) {
    const logBox = document.getElementById('battle-log');
    logBox.innerHTML += `<div>> ${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight; 
}

function attackEnemy() {
    // Player Attacks
    let playerDamage = Math.max(player.atk - enemy.def, 1);
    enemy.hp -= playerDamage;
    logBattle(`<span style="color:#00ffcc">You hit ${enemy.name} for ${playerDamage} damage!</span>`);

    if (enemy.hp <= 0) {
        updateHealthAndExpBars();
        logBattle(`<span style="color:#ffcc00; font-weight:bold;">Victory! ${enemy.name} is defeated.</span>`);
        
        // GIVE REWARDS (Gold and EXP)
        let goldReward = 20 + Math.floor(Math.random() * 10);
        let expReward = 35 + Math.floor(Math.random() * 20); // 35 to 54 EXP
        
        logBattle(`<span style="color:#ffcc00">Looted ${goldReward} Gold and gained ${expReward} EXP!</span>`);
        
        playerGold += goldReward;
        localStorage.setItem('playerGold', playerGold);
        updateResourceUI();
        
        gainExp(expReward);

        document.getElementById('attack-btn').disabled = true;
        document.getElementById('reset-battle-btn').style.display = 'block';
        return; 
    }

    // Enemy Attacks
    let enemyDamage = Math.max(enemy.atk - player.def, 1);
    player.hp -= enemyDamage;
    logBattle(`<span style="color:#ff0055">${enemy.name} hits you for ${enemyDamage} damage!</span>`);

    if (player.hp <= 0) {
        logBattle(`<span style="color:red; font-weight:bold;">Defeat! You have fallen in battle.</span>`);
        document.getElementById('attack-btn').disabled = true;
        document.getElementById('reset-battle-btn').style.display = 'block';
    }

    updateHealthAndExpBars();
}

function gainExp(amount) {
    playerExp += amount;
    let expNeeded = getExpRequirement(playerLevel);

    if (playerExp >= expNeeded) {
        // Level Up!
        playerLevel++;
        playerExp -= expNeeded; // Carry over excess EXP
        
        localStorage.setItem('playerLevel', playerLevel);
        
        logBattle(`<span style="color:#aa00ff; font-weight:bold;">LEVEL UP! You are now Level ${playerLevel}. Stats increased!</span>`);
        calculatePlayerStats(); // Recalculate max HP and heal to full
    }
    
    localStorage.setItem('playerExp', playerExp);
    updateHealthAndExpBars();
}

function resetBattle() {
    player.hp = player.maxHp;
    
    // Scale enemy slightly based on player level so it doesn't get too easy
    let enemyMultiplier = playerLevel - 1;
    enemy.maxHp = 100 + (enemyMultiplier * 15);
    enemy.hp = enemy.maxHp;
    enemy.atk = 15 + (enemyMultiplier * 3);
    enemy.def = 5 + (enemyMultiplier * 2);
    
    document.getElementById('attack-btn').disabled = false;
    document.getElementById('reset-battle-btn').style.display = 'none';
    document.getElementById('battle-log').innerHTML = '';
    
    logBattle(`A new ${enemy.name} approaches!`);
    updateHealthAndExpBars();
}

// ==========================================
// 3. CITY BUILDING SYSTEM
// ==========================================
let countdownInterval;
const UPGRADE_TIME_SECONDS = 10;

function initCity() {
    let savedLevel = localStorage.getItem('townHallLevel') || 1;
    document.getElementById('lvl').innerText = savedLevel;

    const finishTime = localStorage.getItem('upgradeFinishTime');
    if (finishTime) {
        const now = Date.now();
        if (now < parseInt(finishTime)) {
            resumeUpgrade(parseInt(finishTime));
        } else {
            finishUpgrade(true); 
        }
    }
}

function startUpgrade() {
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    let upgradeCost = cityLevel * 50;

    if (playerGold < upgradeCost) {
        alert(`Not enough gold! You need ${upgradeCost}g to upgrade. Head to the Arena!`);
        return;
    }

    playerGold -= upgradeCost;
    localStorage.setItem('playerGold', playerGold);
    updateResourceUI();

    const finishTime = Date.now() + (UPGRADE_TIME_SECONDS * 1000);
    localStorage.setItem('upgradeFinishTime', finishTime);
    resumeUpgrade(finishTime);
}

function resumeUpgrade(finishTime) {
    const btn = document.getElementById('upgrade-btn');
    const status = document.getElementById('status');
    const timerDisplay = document.getElementById('timer-display');
    
    btn.disabled = true;
    btn.innerText = "Upgrading...";
    btn.style.background = "#555"; 
    status.innerText = "Upgrading...";
    status.className = "status-active";

    countdownInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.ceil((finishTime - now) / 1000);

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            finishUpgrade(false);
        } else {
            timerDisplay.innerText = `Time Remaining: ${timeLeft}s`;
        }
    }, 1000);
}

function finishUpgrade(wasOffline) {
    localStorage.removeItem('upgradeFinishTime');
    
    let currentLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    currentLevel++;
    localStorage.setItem('townHallLevel', currentLevel);

    document.getElementById('lvl').innerText = currentLevel;
    document.getElementById('status').innerText = "Idle";
    document.getElementById('status').className = "status-idle";
    document.getElementById('timer-display').innerText = "";
    document.getElementById('upgrade-btn').disabled = false;

    calculatePlayerStats();
    updateResourceUI(); 
}

// ==========================================
// 4. INITIALIZATION ON LOAD
// ==========================================
window.onload = () => {
    updateResourceUI();
    initCity();
    
    const savedHero = localStorage.getItem('selectedHero');
    if (savedHero) {
        setupPlayer(savedHero);
    }
};