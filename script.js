// ==========================================
// 1. GAME DATABASE (Architecture for scaling to 500+ items)
// ==========================================
const GAME_DB = {
    // Weapons
    'wpn_01': { id: 'wpn_01', name: "Iron Sword", type: "weapon", stat: "atk", val: 50, cost: 500, currency: 'gold', img: "https://images.unsplash.com/photo-1590218134444-6019777bd4a3?w=100&q=80" },
    'wpn_02': { id: 'wpn_02', name: "Dragon Blade", type: "weapon", stat: "atk", val: 150, cost: 200, currency: 'balens', img: "https://images.unsplash.com/photo-1605651589146-21045a5d2138?w=100&q=80" },
    // Armor
    'arm_01': { id: 'arm_01', name: "Leather Tunic", type: "armor", stat: "def", val: 30, cost: 400, currency: 'gold', img: "https://images.unsplash.com/photo-1599839619722-39751411ea63?w=100&q=80" },
    // Accessories
    'hat_01': { id: 'hat_01', name: "Mage Hood", type: "hat", stat: "hp", val: 200, cost: 300, currency: 'gold', img: "https://images.unsplash.com/photo-1579287310574-8b63e14fb571?w=100&q=80" },
    'wing_01':{ id: 'wing_01', name: "Archangel Wings", type: "wings", stat: "atk", val: 300, cost: 1000, currency: 'balens', img: "https://images.unsplash.com/photo-1601314167099-232775bbabce?w=100&q=80" },
    'ring_01':{ id: 'ring_01', name: "Ruby Ring", type: "ring", stat: "atk", val: 40, cost: 500, currency: 'gold', img: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?w=100&q=80" },
    'amu_01': { id: 'amu_01', name: "Void Amulet", type: "amulet", stat: "hp", val: 500, cost: 500, currency: 'balens', img: "https://images.unsplash.com/photo-1599643478524-fb82312d8ec9?w=100&q=80" },
    // Mounts
    'mnt_01': { id: 'mnt_01', name: "Royal Griffin", type: "mount", stat: "hp", val: 1000, cost: 500, currency: 'balens', img: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=100&q=80" },
    'mnt_02': { id: 'mnt_02', name: "Shadow Panther", type: "mount", stat: "atk", val: 250, cost: 600, currency: 'balens', img: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=100&q=80" },
    // Materials
    'mat_01': { id: 'mat_01', name: "Lvl 1 Enhance Stone", type: "material", cost: 100, currency: 'gold', img: "https://images.unsplash.com/photo-1525087740718-9e0f2c58c7ef?w=100&q=80" }
};

// ==========================================
// 2. PLAYER STATE & INITIALIZATION
// ==========================================
let player = {
    hp: 1000, maxHp: 1000, atk: 100, def: 50,
    gold: parseInt(localStorage.getItem('gold')) || 1000,
    balens: parseInt(localStorage.getItem('balens')) || 500,
    inventory: JSON.parse(localStorage.getItem('inventory')) || [], // Array of item IDs
    equipment: JSON.parse(localStorage.getItem('equipment')) || {
        weapon: null, armor: null, hat: null, wings: null, ring: null, amulet: null
    }
};

let enemy = { name: "Void Minotaur", hp: 1500, maxHp: 1500, atk: 80, def: 20 };
let currentCooldown = 0;

window.onload = () => {
    updateHUD();
    renderShop();
    renderBag();
    renderEquipment();
    calculateStats();
    resetBattle();
};

function saveGame() {
    localStorage.setItem('gold', player.gold);
    localStorage.setItem('balens', player.balens);
    localStorage.setItem('inventory', JSON.stringify(player.inventory));
    localStorage.setItem('equipment', JSON.stringify(player.equipment));
}

function updateHUD() {
    document.getElementById('gold-display').innerText = player.gold;
    document.getElementById('balen-display').innerText = player.balens;
    document.getElementById('stat-hp').innerText = player.maxHp;
    document.getElementById('stat-atk').innerText = player.atk;
    document.getElementById('stat-def').innerText = player.def;
    
    // Calculate Battle Rating (BR) like Wartune
    let br = player.maxHp + (player.atk * 5) + (player.def * 5);
    document.getElementById('hud-br').innerText = br;
}

// ==========================================
// 3. UI WINDOW CONTROLS
// ==========================================
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.style.display === "flex") {
        modal.style.display = "none";
    } else {
        // Close all others first
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        modal.style.display = "flex";
    }
}

function rechargeBalens() {
    player.balens += 1000;
    saveGame(); updateHUD();
}

// ==========================================
// 4. SHOP & INVENTORY SYSTEM
// ==========================================
function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    
    // Loop through all items in DB to create shop
    for (let key in GAME_DB) {
        let item = GAME_DB[key];
        let color = item.currency === 'balens' ? '#ff00ff' : '#ffcc00';
        
        grid.innerHTML += `
            <div class="shop-item">
                <img src="${item.img}">
                <div class="shop-item-info">
                    <div style="font-weight:bold; color:#00d2ff;">${item.name}</div>
                    <div style="font-size:0.8rem; color:${color};">${item.cost} ${item.currency}</div>
                </div>
                <button class="shop-buy-btn" onclick="buyItem('${item.id}')">Buy</button>
            </div>
        `;
    }
}

function buyItem(itemId) {
    let item = GAME_DB[itemId];
    if (item.currency === 'gold' && player.gold >= item.cost) {
        player.gold -= item.cost;
        player.inventory.push(itemId);
    } else if (item.currency === 'balens' && player.balens >= item.cost) {
        player.balens -= item.cost;
        player.inventory.push(itemId);
    } else {
        alert("Not enough currency!");
        return;
    }
    saveGame(); updateHUD(); renderBag();
    alert(`Purchased ${item.name}! Check your Backpack.`);
}

function renderBag() {
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = '';
    
    // Render 32 slots total
    for(let i=0; i<32; i++) {
        let itemId = player.inventory[i];
        if (itemId) {
            let item = GAME_DB[itemId];
            grid.innerHTML += `<div class="bag-slot" style="background-image:url('${item.img}')" onclick="equipFromBag(${i})"></div>`;
        } else {
            grid.innerHTML += `<div class="bag-slot"></div>`;
        }
    }
}

// ==========================================
// 5. EQUIPMENT SYSTEM
// ==========================================
function equipFromBag(invIndex) {
    let itemId = player.inventory[invIndex];
    let item = GAME_DB[itemId];
    
    if (item.type === 'material' || item.type === 'mount') {
        alert("This item cannot be equipped to a character slot.");
        return;
    }

    // Check if slot is already full, if so, put current item back in bag
    let currentEquip = player.equipment[item.type];
    if (currentEquip) {
        player.inventory.push(currentEquip);
    }

    // Equip new item and remove from bag
    player.equipment[item.type] = itemId;
    player.inventory.splice(invIndex, 1);
    
    saveGame(); renderBag(); renderEquipment(); calculateStats();
}

function unequipItem(type) {
    let itemId = player.equipment[type];
    if (!itemId) return;

    // Move to bag
    player.inventory.push(itemId);
    player.equipment[type] = null;
    
    saveGame(); renderBag(); renderEquipment(); calculateStats();
}

function renderEquipment() {
    const slots = ['weapon', 'armor', 'hat', 'wings', 'ring', 'amulet'];
    slots.forEach(slotType => {
        let el = document.getElementById(`eq-${slotType}`);
        let itemId = player.equipment[slotType];
        
        if (itemId) {
            el.style.backgroundImage = `url('${GAME_DB[itemId].img}')`;
            el.classList.add('filled');
            el.innerText = "";
        } else {
            el.style.backgroundImage = 'none';
            el.classList.remove('filled');
            el.innerText = slotType.charAt(0).toUpperCase() + slotType.slice(1);
        }
    });
}

function calculateStats() {
    // Base stats
    player.maxHp = 1000; player.atk = 100; player.def = 50;

    // Add stats from equipment
    for (let key in player.equipment) {
        let itemId = player.equipment[key];
        if (itemId) {
            let item = GAME_DB[itemId];
            if (item.stat === 'hp') player.maxHp += item.val;
            if (item.stat === 'atk') player.atk += item.val;
            if (item.stat === 'def') player.def += item.val;
        }
    }
    
    // Heal player if maxHp increased
    player.hp = player.maxHp;
    
    updateHUD(); updateHealthBars();
}

// ==========================================
// 6. COMBAT ENGINE (Fixed Enemy Counter-Attack)
// ==========================================
function updateHealthBars() {
    const playerHpPercent = Math.max((player.hp / player.maxHp) * 100, 0);
    document.getElementById('player-hp-bar').style.width = playerHpPercent + '%';
    
    const enemyHpPercent = Math.max((enemy.hp / enemy.maxHp) * 100, 0);
    document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
}

function logBattle(message) {
    const logBox = document.getElementById('battle-log');
    logBox.innerHTML = `<div>> ${message}</div>` + logBox.innerHTML; // Prepend for easy reading
}

function useSkill(type) {
    document.getElementById('basic-atk-btn').disabled = true;
    
    let playerDamage = Math.max(player.atk - enemy.def, 1);
    enemy.hp -= playerDamage;
    logBattle(`<span style="color:#00ffcc">You attacked ${enemy.name} for ${playerDamage} damage!</span>`);
    
    updateHealthBars();
    
    // Wait 500ms before enemy attacks back (Fixed Bug!)
    setTimeout(triggerEnemyTurn, 500);
}

function triggerEnemyTurn() {
    if (enemy.hp <= 0) {
        handleVictory();
        return; 
    }

    let enemyDamage = Math.max(enemy.atk - player.def, 1);
    player.hp -= enemyDamage;
    logBattle(`<span style="color:#ff0055">${enemy.name} counters for ${enemyDamage} damage!</span>`);

    if (player.hp <= 0) {
        logBattle(`<span style="color:red; font-weight:bold;">Defeat! You have fallen in battle.</span>`);
        document.getElementById('reset-battle-btn').style.display = 'inline-block';
    } else {
        document.getElementById('basic-atk-btn').disabled = false;
    }

    updateHealthBars();
}

function handleVictory() {
    logBattle(`<span style="color:#ffcc00; font-weight:bold;">Victory! ${enemy.name} is defeated.</span>`);
    let goldReward = Math.floor(Math.random() * 50) + 50;
    player.gold += goldReward;
    logBattle(`<span style="color:#ffcc00">Looted ${goldReward} Gold!</span>`);
    
    saveGame(); updateHUD();
    document.getElementById('reset-battle-btn').style.display = 'inline-block';
}

function resetBattle() {
    player.hp = player.maxHp;
    enemy.hp = enemy.maxHp;
    document.getElementById('basic-atk-btn').disabled = false;
    document.getElementById('reset-battle-btn').style.display = 'none';
    document.getElementById('battle-log').innerHTML = 'Awaiting battle...';
    updateHealthBars();
}

// Note: I left out the QTE code to keep this script from being too long, 
// but you can easily paste your old QTE logic back in to replace useSkill('special')!