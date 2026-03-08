// ==========================================
// 1. GAME DATA & RESOURCES
// ==========================================
const classStats = {
    'Knight': { hp: 150, atk: 25, def: 20, specialName: "Holy Strike", specialMult: 1.8, cooldownTimer: 3, img: "https://images.unsplash.com/photo-1598974542562-38d5f30689b9?auto=format&fit=crop&w=150&q=80" },
    'Mage': { hp: 80, atk: 40, def: 5, specialName: "Meteor Storm", specialMult: 2.2, cooldownTimer: 4, img: "https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=150&q=80" },
    'Archer': { hp: 100, atk: 35, def: 10, specialName: "Snipe", specialMult: 2.0, cooldownTimer: 3, img: "https://images.unsplash.com/photo-1552874869-5c39ec9288dc?auto=format&fit=crop&w=150&q=80" }
};

let player = { name: "", hp: 0, maxHp: 0, atk: 0, def: 0 };
let enemy = { name: "Void Minotaur", hp: 100, maxHp: 100, atk: 15, def: 5 };

let playerGold = parseInt(localStorage.getItem('playerGold')) || 0;
let playerBalens = parseInt(localStorage.getItem('playerBalens')) || 0; // NEW: Premium Currency
let playerLevel = parseInt(localStorage.getItem('playerLevel')) || 1;
let playerExp = parseInt(localStorage.getItem('playerExp')) || 0;
let hasMount = localStorage.getItem('hasMount') === 'true'; // NEW: Mount Status

let currentCooldown = 0; 
function getExpRequirement(level) { return level * 100; }

function updateResourceUI() {
    document.getElementById('gold-display').innerText = playerGold;
    document.getElementById('balen-display').innerText = playerBalens;
    
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    let upgradeCost = cityLevel * 50; 
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (!localStorage.getItem('upgradeFinishTime')) {
        upgradeBtn.innerText = `Upgrade (Cost: ${upgradeCost}g)`;
        upgradeBtn.style.background = (playerGold < upgradeCost) ? "#885555" : "#00d2ff";
    }

    if(hasMount) {
        document.getElementById('buy-mount-btn').innerText = "Mount Purchased!";
        document.getElementById('buy-mount-btn').disabled = true;
        document.getElementById('mount-display').style.display = "block";
    }
}

// Fake "Recharge" button to simulate spending real money
function rechargeBalens() {
    playerBalens += 100;
    localStorage.setItem('playerBalens', playerBalens);
    updateResourceUI();
    alert("Recharge Successful! You received 100 Balens.");
}

// ==========================================
// 2. HERO PROGRESSION & MOUNTS
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
    document.getElementById('player-sprite').src = stats.img;
    document.getElementById('skill-bar').style.display = 'flex';
    document.getElementById('special-name').innerText = stats.specialName;
    
    currentCooldown = 0; 
    updateSkillUI();
    calculatePlayerStats();
    logBattle(`You selected the ${className}.`);
}

function buyMount() {
    if (playerBalens >= 100) {
        playerBalens -= 100;
        localStorage.setItem('playerBalens', playerBalens);
        hasMount = true;
        localStorage.setItem('hasMount', 'true');
        updateResourceUI();
        calculatePlayerStats();
        alert("You purchased the Royal Griffin Mount! Stats heavily increased.");
    } else {
        alert("Not enough Balens! Click 'Recharge +' at the top.");
    }
}

function calculatePlayerStats() {
    if (!player.name) return;
    const baseStats = classStats[player.name];
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1);
    
    let cityBonus = cityLevel - 1;
    let heroBonus = playerLevel - 1;
    
    // NEW: Apply Mount Bonus
    let mountHp = hasMount ? 500 : 0;
    let mountAtk = hasMount ? 50 : 0;

    player.maxHp = baseStats.hp + (cityBonus * 20) + (heroBonus * 30) + mountHp;
    player.atk = baseStats.atk + (cityBonus * 5) + (heroBonus * 8) + mountAtk;
    player.def = baseStats.def + (cityBonus * 3) + (heroBonus * 5);
    player.hp = player.maxHp; 
    updateHealthAndExpBars();
}

// ==========================================
// 3. WARTUNE FARM SYSTEM
// ==========================================
let farmPlots = {
    1: { state: 'empty', finishTime: 0 },
    2: { state: 'empty', finishTime: 0 }
};

function initFarm() {
    // Load farm data
    for(let i=1; i<=2; i++) {
        let savedTime = localStorage.getItem(`farmPlot_${i}`);
        if(savedTime) {
            farmPlots[i].finishTime = parseInt(savedTime);
            farmPlots[i].state = 'growing';
            checkFarmStatus(i);
        }
    }
    setInterval(() => { checkFarmStatus(1); checkFarmStatus(2); }, 1000);
}

function interactFarm(plotId) {
    let plot = farmPlots[plotId];
    if (plot.state === 'empty') {
        // Plant a seed (takes 20 seconds)
        plot.finishTime = Date.now() + 20000;
        plot.state = 'growing';
        localStorage.setItem(`farmPlot_${plotId}`, plot.finishTime);
        checkFarmStatus(plotId);
    } else if (plot.state === 'ready') {
        // Harvest
        plot.state = 'empty';
        plot.finishTime = 0;
        localStorage.removeItem(`farmPlot_${plotId}`);
        
        // Give massive rewards
        playerGold += 200;
        localStorage.setItem('playerGold', playerGold);
        gainExp(150);
        updateResourceUI();
        alert(`Harvested Plot ${plotId}! Gained 200 Gold and 150 EXP.`);
        checkFarmStatus(plotId);
    }
}

function checkFarmStatus(plotId) {
    let plot = farmPlots[plotId];
    let div = document.getElementById(`plot-${plotId}`);
    let text = document.getElementById(`plot-text-${plotId}`);
    
    if (plot.state === 'empty') {
        div.className = "farm-plot";
        text.innerHTML = "Empty Plot<br>(Click to Plant)";
    } else if (plot.state === 'growing') {
        let timeLeft = Math.ceil((plot.finishTime - Date.now()) / 1000);
        if (timeLeft <= 0) {
            plot.state = 'ready';
        } else {
            div.className = "farm-plot growing";
            text.innerHTML = `Growing...<br>${timeLeft}s`;
        }
    }
    
    if (plot.state === 'ready') {
        div.className = "farm-plot ready";
        text.innerHTML = "READY!<br>(Click to Harvest)";
    }
}

// ==========================================
// 4. COMBAT & QTE (Remains the Same)
// ==========================================
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

let qteActive = false; let qteSequence = []; let qteCurrentIndex = 0; let qteTimerInterval;
const POSSIBLE_KEYS = ['w', 'a', 's', 'd'];

function startQTE() {
    document.getElementById('basic-atk-btn').disabled = true;
    document.getElementById('special-atk-btn').disabled = true;
    qteSequence = [];
    for(let i=0; i<4; i++) qteSequence.push(POSSIBLE_KEYS[Math.floor(Math.random() * POSSIBLE_KEYS.length)]);
    qteCurrentIndex = 0; qteActive = true;
    
    document.getElementById('qte-overlay').style.display = 'flex';
    document.getElementById('qte-keys').innerHTML = '';
    qteSequence.forEach((key, index) => { document.getElementById('qte-keys').innerHTML += `<div class="qte-key" id="qte-key-${index}">${key}</div>`; });

    let timeLeft = 2500; 
    qteTimerInterval = setInterval(() => {
        timeLeft -= 50;
        document.getElementById('qte-timer-bar').style.width = (timeLeft / 2500) * 100 + '%';
        if (timeLeft <= 0) endQTE(false);
    }, 50);
}

window.addEventListener('keydown', (e) => {
    if (!qteActive) return;
    const key = e.key.toLowerCase();
    if (POSSIBLE_KEYS.includes(key)) {
        const keyDiv = document.getElementById(`qte-key-${qteCurrentIndex}`);
        if (key === qteSequence[qteCurrentIndex]) {
            keyDiv.classList.add('success'); qteCurrentIndex++;
            if (qteCurrentIndex >= qteSequence.length) endQTE(true);
        } else {
            keyDiv.classList.add('fail'); endQTE(false);
        }
    }
});

function endQTE(wasSuccessful) {
    clearInterval(qteTimerInterval); qteActive = false;
    setTimeout(() => {
        document.getElementById('qte-overlay').style.display = 'none';
        executeSpecialAttack(wasSuccessful);
    }, 300);
}

function updateSkillUI() {
    const specialBtn = document.getElementById('special-atk-btn');
    const overlay = document.getElementById('cooldown-overlay');
    if (currentCooldown > 0) { specialBtn.disabled = true; overlay.style.opacity = '1'; overlay.innerText = currentCooldown;
    } else { specialBtn.disabled = false; overlay.style.opacity = '0'; }
}

function useSkill(type) {
    if (type === 'basic') {
        let playerDamage = Math.max(player.atk - enemy.def, 1);
        enemy.hp -= playerDamage;
        logBattle(`<span style="color:#00ffcc">You attacked ${enemy.name} for ${playerDamage} damage!</span>`);
        triggerEnemyTurn();
    }
}

function executeSpecialAttack(qteSuccess) {
    const stats = classStats[player.name];
    let baseDmg = Math.max(Math.floor((player.atk * stats.specialMult) - enemy.def), 1);
    let finalDmg = qteSuccess ? Math.floor(baseDmg * 1.25) : baseDmg;
    let logMsg = qteSuccess ? `<span style="color:#ffcc00; font-weight:bold;">QTE PERFECT!</span> <span style="color:#d500f9">Used ${stats.specialName} for ${finalDmg} damage!</span>` : `<span style="color:#aaaaaa;">QTE Missed.</span> <span style="color:#d500f9">Used ${stats.specialName} for ${finalDmg} damage.</span>`;
    enemy.hp -= finalDmg; logBattle(logMsg);
    currentCooldown = stats.cooldownTimer + 1; triggerEnemyTurn();
}

function triggerEnemyTurn() {
    if (enemy.hp <= 0) { handleVictory(); return; }
    let enemyDamage = Math.max(enemy.atk - player.def, 1);
    player.hp -= enemyDamage;
    logBattle(`<span style="color:#ff0055">${enemy.name} hits you for ${enemyDamage} damage!</span>`);
    if (player.hp <= 0) {
        logBattle(`<span style="color:red; font-weight:bold;">Defeat! You have fallen.</span>`);
        document.getElementById('basic-atk-btn').disabled = true; document.getElementById('special-atk-btn').disabled = true; document.getElementById('reset-battle-btn').style.display = 'block';
    }
    if (currentCooldown > 0) currentCooldown--;
    updateHealthAndExpBars(); updateSkillUI();
}

function handleVictory() {
    updateHealthAndExpBars();
    logBattle(`<span style="color:#ffcc00; font-weight:bold;">Victory! ${enemy.name} is defeated.</span>`);
    let goldReward = 20 + Math.floor(Math.random() * 10);
    let expReward = 35 + Math.floor(Math.random() * 20); 
    logBattle(`<span style="color:#ffcc00">Looted ${goldReward} Gold and gained ${expReward} EXP!</span>`);
    playerGold += goldReward; localStorage.setItem('playerGold', playerGold); updateResourceUI(); gainExp(expReward);
    document.getElementById('basic-atk-btn').disabled = true; document.getElementById('special-atk-btn').disabled = true; document.getElementById('reset-battle-btn').style.display = 'block';
}

function gainExp(amount) {
    playerExp += amount; let expNeeded = getExpRequirement(playerLevel);
    if (playerExp >= expNeeded) {
        playerLevel++; playerExp -= expNeeded; localStorage.setItem('playerLevel', playerLevel);
        logBattle(`<span style="color:#aa00ff; font-weight:bold;">LEVEL UP! Now Level ${playerLevel}.</span>`); calculatePlayerStats(); 
    }
    localStorage.setItem('playerExp', playerExp); updateHealthAndExpBars();
}

function resetBattle() {
    player.hp = player.maxHp; currentCooldown = 0; 
    let enemyMultiplier = playerLevel - 1;
    enemy.maxHp = 100 + (enemyMultiplier * 15); enemy.hp = enemy.maxHp; enemy.atk = 15 + (enemyMultiplier * 3); enemy.def = 5 + (enemyMultiplier * 2);
    document.getElementById('basic-atk-btn').disabled = false; document.getElementById('reset-battle-btn').style.display = 'none'; document.getElementById('battle-log').innerHTML = '';
    logBattle(`A new ${enemy.name} approaches!`); updateHealthAndExpBars(); updateSkillUI();
}

// ==========================================
// 5. CITY BUILDING & INIT
// ==========================================
let countdownInterval; const UPGRADE_TIME_SECONDS = 10;
function initCity() {
    let savedLevel = localStorage.getItem('townHallLevel') || 1; document.getElementById('lvl').innerText = savedLevel;
    const finishTime = localStorage.getItem('upgradeFinishTime');
    if (finishTime) {
        if (Date.now() < parseInt(finishTime)) resumeUpgrade(parseInt(finishTime));
        else finishUpgrade(true); 
    }
}
function startUpgrade() {
    let cityLevel = parseInt(localStorage.getItem('townHallLevel') || 1); let upgradeCost = cityLevel * 50;
    if (playerGold < upgradeCost) { alert(`Not enough gold! You need ${upgradeCost}g.`); return; }
    playerGold -= upgradeCost; localStorage.setItem('playerGold', playerGold); updateResourceUI();
    const finishTime = Date.now() + (UPGRADE_TIME_SECONDS * 1000); localStorage.setItem('upgradeFinishTime', finishTime); resumeUpgrade(finishTime);
}
function resumeUpgrade(finishTime) {
    const btn = document.getElementById('upgrade-btn'); const status = document.getElementById('status'); const timerDisplay = document.getElementById('timer-display');
    btn.disabled = true; btn.innerText = "Upgrading..."; btn.style.background = "#555"; status.innerText = "Upgrading..."; status.className = "status-active";
    countdownInterval = setInterval(() => {
        const timeLeft = Math.ceil((finishTime - Date.now()) / 1000);
        if (timeLeft <= 0) { clearInterval(countdownInterval); finishUpgrade(false); }
        else timerDisplay.innerText = `Time Remaining: ${timeLeft}s`;
    }, 1000);
}
function finishUpgrade(wasOffline) {
    localStorage.removeItem('upgradeFinishTime');
    let currentLevel = parseInt(localStorage.getItem('townHallLevel') || 1); currentLevel++; localStorage.setItem('townHallLevel', currentLevel);
    document.getElementById('lvl').innerText = currentLevel; document.getElementById('status').innerText = "Idle"; document.getElementById('status').className = "status-idle"; document.getElementById('timer-display').innerText = ""; document.getElementById('upgrade-btn').disabled = false;
    calculatePlayerStats(); updateResourceUI(); 
}

window.onload = () => {
    updateResourceUI();
    initCity();
    initFarm(); // NEW: Start farm loops
    const savedHero = localStorage.getItem('selectedHero');
    if (savedHero) setupPlayer(savedHero);
};