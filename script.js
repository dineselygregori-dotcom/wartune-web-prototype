// ==========================================
// 1. GAME DATA & RESOURCES
// ==========================================
// Note: We replaced the placeholder links with real image links here too!
const classStats = {
    'Knight': { hp: 150, atk: 25, def: 20, specialName: "Holy Strike", specialMult: 1.8, cooldownTimer: 3, img: "https://images.unsplash.com/photo-1598974542562-38d5f30689b9?auto=format&fit=crop&w=150&q=80" },
    'Mage': { hp: 80, atk: 40, def: 5, specialName: "Meteor Storm", specialMult: 2.2, cooldownTimer: 4, img: "https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=150&q=80" },
    'Archer': { hp: 100, atk: 35, def: 10, specialName: "Snipe", specialMult: 2.0, cooldownTimer: 3, img: "https://images.unsplash.com/photo-1552874869-5c39ec9288dc?auto=format&fit=crop&w=150&q=80" }
};

let player = { name: "", hp: 0, maxHp: 0, atk: 0, def: 0 };
let enemy = { name: "Void Minotaur", hp: 100, maxHp: 100, atk: 15, def: 5 };

let playerGold = parseInt(localStorage.getItem('playerGold')) || 0;
let playerLevel = parseInt(localStorage.getItem('playerLevel')) || 1;
let playerExp = parseInt(localStorage.getItem('playerExp')) || 0;

let currentCooldown = 0; 

function getExpRequirement(level) { return level * 100; }

function updateResourceUI() {
    document.getElementById('gold-display').innerText = playerGold;
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    let upgradeCost = cityLevel * 50; 
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (!localStorage.getItem('upgradeFinishTime')) {
        upgradeBtn.innerText = `Upgrade (Cost: ${upgradeCost}g)`;
        upgradeBtn.style.background = (playerGold < upgradeCost) ? "#885555" : "#00d2ff";
    }
}

// ==========================================
// 2. HERO PROGRESSION & UI
// ==========================================
function selectClass(className) {
    localStorage.setItem('selectedHero', className);
    setupPlayer(className);
}

function setupPlayer(className) {
    player.name = className;
    const stats = classStats[className];
    
    document.getElementById('status-message').innerText = `Active Hero: ${className}`;
    document.getElementById('player-name').innerText = className;
    
    // This part swaps the image in the Arena when you pick a class!
    document.getElementById('player-sprite').src = stats.img;
    
    document.getElementById('skill-bar').style.display = 'flex';
    document.getElementById('special-name').innerText = stats.specialName;
    currentCooldown = 0; 
    updateSkillUI();
    
    calculatePlayerStats();
    logBattle(`You selected the ${className}. The arena is ready!`);
}

function calculatePlayerStats() {
    if (!player.name) return;
    const baseStats = classStats[player.name];
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    let cityBonus = cityLevel - 1;
    let heroBonus = playerLevel - 1;

    player.maxHp = baseStats.hp + (cityBonus * 20) + (heroBonus * 30);
    player.atk = baseStats.atk + (cityBonus * 5) + (heroBonus * 8);
    player.def = baseStats.def + (cityBonus * 3) + (heroBonus * 5);
    player.hp = player.maxHp; 
    updateHealthAndExpBars();
}

function updateHealthAndExpBars() {
    const playerHpPercent = Math.max((player.hp / player.maxHp) * 100, 0);
    document.getElementById('player-hp-bar').style.width = playerHpPercent + '%';
    document.getElementById('player-hp-text').innerText = `${Math.max(player.hp, 0)} / ${player.maxHp}`;

    const enemyHpPercent = Math.max((enemy.hp / enemy.maxHp) * 100, 0);
    document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
    document.getElementById('enemy-hp-text').innerText = `${Math.max(enemy.hp, 0)} / ${enemy.maxHp}`;

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

// ==========================================
// 3. SKILLS & COMBAT LOGIC
// ==========================================
function updateSkillUI() {
    const specialBtn = document.getElementById('special-atk-btn');
    const overlay = document.getElementById('cooldown-overlay');
    
    if (currentCooldown > 0) {
        specialBtn.disabled = true;
        overlay.style.opacity = '1';
        overlay.innerText = currentCooldown;
    } else {
        specialBtn.disabled = false;
        overlay.style.opacity = '0';
    }
}

function useSkill(type) {
    let playerDamage = 0;
    let attackName = "Attack";
    let color = "#00ffcc";

    if (type === 'basic') {
        playerDamage = Math.max(player.atk - enemy.def, 1);
    } else if (type === 'special') {
        const stats = classStats[player.name];
        playerDamage = Math.max(Math.floor((player.atk * stats.specialMult) - enemy.def), 1);
        attackName = stats.specialName;
        color = "#d500f9"; 
        currentCooldown = stats.cooldownTimer + 1; 
    }

    enemy.hp -= playerDamage;
    logBattle(`<span style="color:${color}">You used ${attackName} on ${enemy.name} for ${playerDamage} damage!</span>`);

    if (enemy.hp <= 0) {
        handleVictory();
        return; 
    }

    let enemyDamage = Math.max(enemy.atk - player.def, 1);
    player.hp -= enemyDamage;
    logBattle(`<span style="color:#ff0055">${enemy.name} hits you for ${enemyDamage} damage!</span>`);

    if (player.hp <= 0) {
        logBattle(`<span style="color:red; font-weight:bold;">Defeat! You have fallen in battle.</span>`);
        document.getElementById('basic-atk-btn').disabled = true;
        document.getElementById('special-atk-btn').disabled = true;
        document.getElementById('reset-battle-btn').style.display = 'block';
    }

    if (currentCooldown > 0) {
        currentCooldown--;
    }
    
    updateHealthAndExpBars();
    updateSkillUI();
}

function handleVictory() {
    updateHealthAndExpBars();
    logBattle(`<span style="color:#ffcc00; font-weight:bold;">Victory! ${enemy.name} is defeated.</span>`);
    
    let goldReward = 20 + Math.floor(Math.random() * 10);
    let expReward = 35 + Math.floor(Math.random() * 20); 
    logBattle(`<span style="color:#ffcc00">Looted ${goldReward} Gold and gained ${expReward} EXP!</span>`);
    
    playerGold += goldReward;
    localStorage.setItem('playerGold', playerGold);
    updateResourceUI();
    gainExp(expReward);

    document.getElementById('basic-atk-btn').disabled = true;
    document.getElementById('special-atk-btn').disabled = true;
    document.getElementById('reset-battle-btn').style.display = 'block';
}

function gainExp(amount) {
    playerExp += amount;
    let expNeeded = getExpRequirement(playerLevel);

    if (playerExp >= expNeeded) {
        playerLevel++;
        playerExp -= expNeeded; 
        localStorage.setItem('playerLevel', playerLevel);
        logBattle(`<span style="color:#aa00ff; font-weight:bold;">LEVEL UP! You are now Level ${playerLevel}.</span>`);
        calculatePlayerStats(); 
    }
    localStorage.setItem('playerExp', playerExp);
    updateHealthAndExpBars();
}

function resetBattle() {
    player.hp = player.maxHp;
    currentCooldown = 0; 
    
    let enemyMultiplier = playerLevel - 1;
    enemy.maxHp = 100 + (enemyMultiplier * 15);
    enemy.hp = enemy.maxHp;
    enemy.atk = 15 + (enemyMultiplier * 3);
    enemy.def = 5 + (enemyMultiplier * 2);
    
    document.getElementById('basic-atk-btn').disabled = false;
    document.getElementById('reset-battle-btn').style.display = 'none';
    document.getElementById('battle-log').innerHTML = '';
    
    logBattle(`A new ${enemy.name} approaches!`);
    updateHealthAndExpBars();
    updateSkillUI();
}

// ==========================================
// 4. CITY BUILDING SYSTEM
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
        alert(`Not enough gold! You need ${upgradeCost}g to upgrade.`);
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
// 5. INITIALIZATION ON LOAD
// ==========================================
window.onload = () => {
    updateResourceUI();
    initCity();
    const savedHero = localStorage.getItem('selectedHero');
    if (savedHero) setupPlayer(savedHero);
};