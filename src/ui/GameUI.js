import { AVATARS } from '../assets/AvatarLibrary.js';

export class GameUI {
  constructor(game) {
    this.game = game;
    this.elements = {};
    this.timers = {};
    this.currentTimer = null;
  this.timerDuration = 15; // segundos para tirar dados
  this.decisionTimerDuration = 30; // segundos para decidir comprar/pasar
    this.setupElements();
    this.setupEventListeners();
    
    // Conectar actualización de estado si el juego expone callback
    if (this.game) {
      this.game.onGameStateChange = (state) => {
        if (state.currentPlayer) {
          this.updateUI(
            state.currentPlayer,
            state.canRollDice,
            state.canBuyProperty,
            state.canEndTurn,
            state.waitingForBuyDecision
          );
        }
        this.updateAllPlayersInfo(state.players);
      };
    }
  }

  setupElements() {
    // Elementos del juego
    this.elements = {
      // Panel de jugadores
      currentPlayer: document.getElementById('current-player'),
      playerMoney: document.getElementById('player-money'),
      playerProperties: document.getElementById('player-properties'),
      allPlayersInfo: document.getElementById('all-players-info'),
      
      // Controles del juego
      newGameBtn: document.getElementById('new-game-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      rulesBtn: document.getElementById('rules-btn'),
      
      // Botón central de dados
      centerDiceButton: document.getElementById('center-dice-button'),
      centerRollDiceBtn: document.getElementById('center-roll-dice-btn'),
      
      // Botones centrales de acción
      centerActionButtons: document.getElementById('center-action-buttons'),
      centerBuyBtn: document.getElementById('center-buy-btn'),
      centerPassBtn: document.getElementById('center-pass-btn'),
      
      // Modales
      gameSetupModal: document.getElementById('game-setup-modal'),
      gameOverModal: document.getElementById('game-over-modal'),
      destinyCardModal: document.getElementById('destiny-card-modal'),
      destinyCardText: document.getElementById('destiny-card-text'),
      destinyCardOk: document.getElementById('destiny-card-ok'),
  // Modal de cárcel
  jailOptionsModal: document.getElementById('jail-options-modal'),
  jailPlayerName: document.getElementById('jail-player-name'),
  jailPayBtn: document.getElementById('jail-pay-btn'),
  jailAcceptBtn: document.getElementById('jail-accept-btn'),
      
  // Configuración del juego
      playerCountBtns: document.querySelectorAll('.player-count-btn'),
  playerNamesContainer: document.getElementById('player-names-container'),
  playerAvatarsContainer: document.getElementById('player-avatars-container'),
      winAmountBtns: document.querySelectorAll('.win-amount-btn'),
      customWinAmount: document.getElementById('custom-win-amount'),
      setCustomAmountBtn: document.getElementById('set-custom-amount-btn'),
      startGameBtn: document.getElementById('start-game-btn'),
      summaryPlayers: document.getElementById('summary-players'),
      summaryWinAmount: document.getElementById('summary-win-amount'),
      summaryDuration: document.getElementById('summary-duration'),
      
      // Progress del juego
      gameProgress: document.getElementById('game-progress'),
      
      // Mensajes flotantes
      floatingMessages: document.getElementById('floating-messages')
    };
  }

  setupEventListeners() {
    // Configuración del juego
    this.elements.playerCountBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.selectPlayerCount(e));
    });

    this.elements.winAmountBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.selectWinAmount(e));
    });

    this.elements.setCustomAmountBtn.addEventListener('click', () => this.setCustomWinAmount());
    this.elements.startGameBtn.addEventListener('click', () => this.startNewGame());

    // Controles del juego
    this.elements.newGameBtn.addEventListener('click', () => this.showGameSetup());
    
    // Botón central de dados
    if (this.elements.centerRollDiceBtn) {
      this.elements.centerRollDiceBtn.addEventListener('click', () => this.handleCenterRollDice());
    }

    // Botones centrales de acción
    if (this.elements.centerBuyBtn) {
      this.elements.centerBuyBtn.addEventListener('click', () => this.handleCenterBuyProperty());
    }

    if (this.elements.centerPassBtn) {
      this.elements.centerPassBtn.addEventListener('click', () => this.handleCenterPassTurn());
    }

    // Modal de carta de destino
    if (this.elements.destinyCardOk) {
      this.elements.destinyCardOk.addEventListener('click', () => this.closeDestinyCard());
    }

    // Modal de opciones de cárcel
    if (this.elements.jailPayBtn) {
      this.elements.jailPayBtn.addEventListener('click', () => {
        if (this.game && typeof this.game.handleJailPayment === 'function') {
          this.game.handleJailPayment();
        }
      });
    }
    if (this.elements.jailAcceptBtn) {
      this.elements.jailAcceptBtn.addEventListener('click', () => {
        if (this.game && typeof this.game.handleJailAcceptance === 'function') {
          this.game.handleJailAcceptance();
        }
      });
    }

    // Controles de teclado
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  // Funciones de configuración del juego
  selectPlayerCount(e) {
    this.elements.playerCountBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const count = parseInt(e.target.dataset.count);
    this.elements.summaryPlayers.textContent = `${count} Jugadores`;
    this.elements.startGameBtn.disabled = false;
    
    // Actualizar duración estimada
    const duration = count <= 2 ? '10-20 minutos' : count <= 3 ? '15-25 minutos' : '20-35 minutos';
    this.elements.summaryDuration.textContent = duration;

  // Generar campos de nombres
  this.renderPlayerNameInputs(count);
  // Generar selectores de avatar/color/ficha
  this.renderPlayerAvatarSelectors(count);
  }

  selectWinAmount(e) {
    this.elements.winAmountBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const amount = parseInt(e.target.dataset.amount);
    this.elements.summaryWinAmount.textContent = this.formatMoney(amount);
    this.elements.customWinAmount.value = '';
  }

  setCustomWinAmount() {
    const customAmount = parseInt(this.elements.customWinAmount.value);
    if (customAmount && customAmount >= 1000000) {
      this.elements.winAmountBtns.forEach(btn => btn.classList.remove('active'));
      this.elements.summaryWinAmount.textContent = this.formatMoney(customAmount);
    }
  }

  startNewGame() {
    const selectedPlayerBtn = document.querySelector('.player-count-btn.active');
    const selectedAmountBtn = document.querySelector('.win-amount-btn.active');
    const customAmount = parseInt(this.elements.customWinAmount.value);
    
    if (!selectedPlayerBtn) {
      alert('Por favor selecciona la cantidad de jugadores');
      return;
    }

    const playerCount = parseInt(selectedPlayerBtn.dataset.count);
    const winAmount = customAmount || (selectedAmountBtn ? parseInt(selectedAmountBtn.dataset.amount) : 7500000);

    // Obtener nombres ingresados (fallback a nombres por defecto)
    const names = this.collectPlayerNames(playerCount);
    // Obtener selecciones de avatares/colores/fichas
  const avatars = [];
    for (let i = 0; i < playerCount; i++) {
      const sel = this._avatarSelections?.[i] || {};
      avatars.push({
    avatar: sel.avatar || (AVATARS[i % AVATARS.length]?.src || ''),
        color: sel.color || '#007BC7',
        token: sel.token || 'circle'
      });
    }

    this.hideGameSetup();
    // Pasar nombres personalizados al juego
    if (typeof this.game.startGame === 'function') {
      this.game.startGame(playerCount, winAmount, names, avatars);
    }
  }

  // Genera inputs para nombres según la cantidad
  renderPlayerNameInputs(count) {
    const container = this.elements.playerNamesContainer;
    if (!container) return;
    const defaults = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Magenta'];
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'player-name-row';
      row.innerHTML = `
        <label for="player-name-${i}">Jugador ${i + 1}:</label>
        <input id="player-name-${i}" class="player-name-input" type="text" maxlength="12" placeholder="${defaults[i]}" />
      `;
      container.appendChild(row);
    }
  }

  // Genera selectores de avatar/color/ficha por jugador
  renderPlayerAvatarSelectors(count) {
    const container = this.elements.playerAvatarsContainer;
    if (!container) return;
    container.innerHTML = '';

  const avatarSet = AVATARS;
    const colorSet = [
      '#E74C3C', // Rojo vibrante
      '#3498DB', // Azul brillante  
      '#2ECC71', // Verde esmeralda
      '#F39C12', // Naranja dorado
      '#9B59B6'  // Púrpura elegante
    ];
    const tokenSet = [
      { id: 'circle', label: 'Amarilla' },
      { id: 'diamond', label: 'Azul' },
      { id: 'star', label: 'Verde' },
      { id: 'triangle', label: 'Roja' },
      { id: 'hex', label: 'Violeta' }
    ];

    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'player-avatar-row';
      const colors = colorSet.map(c => `<button class="color-swatch" data-color="${c}" style="background:${c}"></button>`).join('');
      const tokens = tokenSet.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
  const avatars = avatarSet.map(a => `<button class="avatar-emoji" data-avatar="${a.src}"><img src="${a.src}" alt="${a.label}"/></button>`).join('');

      row.innerHTML = `
        <div class="avatar-col">
          <label>Jugador ${i+1}</label>
          <div class="avatar-emoji-list" id="avatar-list-${i}">
            ${avatars}
          </div>
        </div>
        <div class="color-col">
          <label>Color</label>
          <div class="color-swatch-list" id="color-list-${i}">${colors}</div>
        </div>
        <div class="token-col">
          <label>Ficha</label>
          <select id="token-select-${i}" class="token-select">${tokens}</select>
        </div>
        <div class="preview-col">
          <label>Vista previa</label>
          <div class="avatar-preview" id="avatar-preview-${i}">
            <span class="preview-emoji"><img src="${avatarSet[i % avatarSet.length].src}" alt="avatar"/></span>
            <span class="preview-color" style="background:${colorSet[i % colorSet.length]}"></span>
            <span class="preview-token">${tokenSet[i % tokenSet.length].label}</span>
          </div>
        </div>
      `;
      container.appendChild(row);

      // Estado inicial
      this.setAvatarSelection(i, {
        avatar: avatarSet[i % avatarSet.length].src,
        color: colorSet[i % colorSet.length],
        token: tokenSet[i % tokenSet.length].id // Token diferente por jugador
      });

      // Marcar selecciones por defecto visualmente
      // Marcar avatar por defecto
      const defaultAvatar = avatarSet[i % avatarSet.length].src;
      row.querySelectorAll('.avatar-emoji').forEach(btn => {
        if (btn.dataset.avatar === defaultAvatar) {
          btn.classList.add('selected');
        }
      });

      // Marcar color por defecto
      const defaultColor = colorSet[i % colorSet.length];
      row.querySelectorAll('.color-swatch').forEach(btn => {
        if (btn.dataset.color === defaultColor) {
          btn.classList.add('selected');
        }
      });

      // Preseleccionar token por defecto
      const defaultToken = tokenSet[i % tokenSet.length].id;
      const tokenSelect = row.querySelector(`#token-select-${i}`);
      if (tokenSelect) {
        tokenSelect.value = defaultToken;
      }

      // Listeners
      row.querySelectorAll('.avatar-emoji').forEach(btn => {
        btn.addEventListener('click', () => {
          const a = btn.dataset.avatar;
          this.setAvatarSelection(i, { avatar: a });
          row.querySelectorAll('.avatar-emoji').forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
      row.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = btn.dataset.color;
          this.setAvatarSelection(i, { color: c });
          row.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
          
          // Validar colores únicos - avisar si hay duplicados
          this.validateUniqueColors();
        });
      });
      const tokenSel = row.querySelector(`#token-select-${i}`);
      tokenSel.addEventListener('change', (e) => {
        this.setAvatarSelection(i, { token: e.target.value });
      });
    }
  }

  setAvatarSelection(index, partial) {
    if (!this._avatarSelections) this._avatarSelections = {};
    const prev = this._avatarSelections[index] || {};
    const next = { ...prev, ...partial };
    this._avatarSelections[index] = next;

    const prevEl = document.getElementById(`avatar-preview-${index}`);
    if (prevEl) {
  const emojiEl = prevEl.querySelector('.preview-emoji');
      const colorEl = prevEl.querySelector('.preview-color');
      const tokenEl = prevEl.querySelector('.preview-token');
      if (emojiEl && next.avatar) {
        emojiEl.innerHTML = `<img src="${next.avatar}" alt="avatar"/>`;
      }
      if (colorEl && next.color) colorEl.style.background = next.color;
      if (tokenEl && next.token) tokenEl.textContent = this.tokenLabel(next.token);
    }
  }

  tokenLabel(id) {
    switch(id) {
      case 'circle': return 'Amarilla';
      case 'diamond': return 'Azul';
      case 'star': return 'Verde';
      case 'triangle': return 'Roja';
      case 'hex': return 'Violeta';
      default: return id;
    }
  }

  // Lee los nombres ingresados o aplica placeholders
  collectPlayerNames(count) {
    const defaults = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Magenta'];
    const names = [];
    for (let i = 0; i < count; i++) {
      const input = document.getElementById(`player-name-${i}`);
      const raw = (input?.value || '').trim();
      names.push(raw || defaults[i]);
    }
    return names;
  }

  showGameSetup() {
    this.elements.gameSetupModal.classList.add('show');
  }

  hideGameSetup() {
    this.elements.gameSetupModal.classList.remove('show');
  }

  // Funciones de control del botón central de dados
  showCenterDiceButton() {
    console.log('Intentando mostrar botón central de dados');
    console.log('Elemento centerDiceButton:', this.elements.centerDiceButton);
    if (this.elements.centerDiceButton) {
      this.elements.centerDiceButton.style.display = 'block';
      console.log('Botón central de dados mostrado');
    } else {
      console.log('ERROR: No se encontró el elemento center-dice-button');
    }
  }

  hideCenterDiceButton() {
    if (this.elements.centerDiceButton) {
      this.elements.centerDiceButton.style.display = 'none';
    }
  }

  handleCenterRollDice() {
    this.hideCenterDiceButton();
    this.game.rollDice();
  }

  // Funciones de botones centrales de acción
  showCenterButtons(canBuy = false, propertyPrice = 0) {
    if (!this.elements.centerActionButtons) return;

    // Configurar botón de comprar
    if (canBuy) {
      this.elements.centerBuyBtn.style.display = 'flex';
      const priceElement = this.elements.centerBuyBtn.querySelector('.btn-price');
      if (priceElement) {
        priceElement.textContent = this.formatMoney(propertyPrice);
      }
    } else {
      this.elements.centerBuyBtn.style.display = 'none';
    }

    // Mostrar botón de pasar turno
    this.elements.centerPassBtn.style.display = 'flex';
    
    // Mostrar el contenedor
    this.elements.centerActionButtons.style.display = 'flex';
  }

  hideCenterButtons() {
    if (this.elements.centerActionButtons) {
      this.elements.centerActionButtons.style.display = 'none';
    }
  }

  handleCenterBuyProperty() {
    this.hideCenterButtons();
    this.game.buyProperty();
    
    // Cambiar de turno después de 3 segundos
    setTimeout(() => {
      this.game.endTurn();
    }, 3000);
  }

  handleCenterPassTurn() {
    this.hideCenterButtons();
    // Si estaba decidiendo compra, primero saltar compra y luego terminar turno
    if (this.game.waitingForBuyDecision) {
      this.game.skipPurchase();
    } else {
      this.game.endTurn();
    }
  }

  // Funciones de gestión de turnos y timers
  startTurnTimer(phase = 'ROLL_DICE') {
    const current = this.game.getCurrentPlayer();
    if (!current) return;
    // Fase de dados: mostrar botón de tirar dados
    if (phase === 'ROLL_DICE') {
      this.showCenterDiceButton();
      this.hideCenterButtons();
    }
    this.startPlayerTimer(current.id, this.timerDuration, 'ROLL_DICE');
  }

  startDecisionPhase() {
    const current = this.game.getCurrentPlayer();
    if (!current) return;
    // En fase de decisión se oculta el botón de dados; los botones de acción los controla updateUI
    this.hideCenterDiceButton();
    this.startPlayerTimer(current.id, this.decisionTimerDuration, 'DECISION');
  }

  startPlayerTimer(playerId, duration = this.timerDuration, phase = null) {
    this.stopCurrentTimer();
    
    this.currentTimer = {
      playerId: playerId,
      timeLeft: duration,
      phase: phase, // Almacenar la fase actual
      interval: setInterval(() => {
        this.currentTimer.timeLeft--;
        this.updatePlayerTimerDisplay(playerId, this.currentTimer.timeLeft);
        
        if (this.currentTimer.timeLeft <= 0) {
          this.stopCurrentTimer();
          // Ejecutar acción según la fase
          this.handleTimerExpired(phase);
        }
      }, 1000)
    };
    
    this.updatePlayerTimerDisplay(playerId, duration);
  }

  handleTimerExpired(phase) {
    if (phase === 'ROLL_DICE') {
      // Auto-tirar dados si el tiempo se agotó en la fase de tirada
      if (this.game.canRollDice && typeof this.game.rollDice === 'function') {
        console.log('⏰ Tiempo agotado - Tirando dados automáticamente');
        this.game.rollDice();
      }
    } else if (phase === 'DECISION' || this.game.waitingForBuyDecision) {
      // Auto-saltar compra si estaba decidiendo
      if (typeof this.game.skipPurchase === 'function') {
        console.log('⏰ Tiempo agotado - Saltando compra automáticamente');
        this.game.skipPurchase();
      }
    } else {
      // Auto-terminar turno en otras situaciones
      if (typeof this.game.autoEndTurn === 'function') {
        this.game.autoEndTurn();
      } else {
        this.game.endTurn();
      }
    }
  }

  stopCurrentTimer() {
    if (this.currentTimer) {
      clearInterval(this.currentTimer.interval);
      this.currentTimer = null;
    }
  }

  updatePlayerTimerDisplay(playerId, timeLeft) {
    const avatar = document.getElementById(`player-avatar-${playerId}`);
    if (avatar) {
      const timerElement = avatar.querySelector('.avatar-timer');
      if (timerElement) {
        timerElement.textContent = `${timeLeft}s`;
        timerElement.style.color = timeLeft <= 5 ? '#dc3545' : timeLeft <= 10 ? '#ffc107' : '#28a745';
      }
    }
  }

  // Funciones de actualización de UI
  updateUI(currentPlayer, canRollDice, canBuyProperty, canEndTurn, waitingForBuyDecision) {
    if (!currentPlayer) return;

    // Actualizar información del jugador actual
    this.updateCurrentPlayerInfo(currentPlayer);
    
    // Controlar visibilidad de botones centrales
    console.log('Estado del juego:', { canRollDice, waitingForBuyDecision, canBuyProperty, canEndTurn });
    if (canRollDice && !waitingForBuyDecision) {
      console.log('Debería mostrar botón de dados');
      this.showCenterDiceButton();
      this.hideCenterButtons();
    } else if (waitingForBuyDecision || canBuyProperty || canEndTurn) {
      this.hideCenterDiceButton();
      
      // Determinar si se puede comprar la propiedad
      const propertyPrice = this.game.getCurrentPropertyPrice?.() || 0;
      this.showCenterButtons(canBuyProperty, propertyPrice);
    } else {
      this.hideCenterDiceButton();
      this.hideCenterButtons();
    }

    // Actualizar avatares de jugadores
    this.updatePlayerAvatars();
  }

  updateCurrentPlayerInfo(player) {
    if (this.elements.currentPlayer) {
      this.elements.currentPlayer.innerHTML = `
        <div class="player-name" style="color: ${this.getPlayerColor(player.name)}">
          ${player.name}
        </div>
      `;
    }

    if (this.elements.playerMoney) {
      this.elements.playerMoney.innerHTML = `
        <div class="money-display">
          <span class="money-amount ${player.money < 0 ? 'negative' : ''}">${this.formatMoney(player.money)}</span>
        </div>
      `;
    }

    if (this.elements.playerProperties) {
      const props = Array.isArray(player.propertiesList) ? player.propertiesList : [];
      const rails = Array.isArray(player.railroadsList) ? player.railroadsList : [];
      const utils = Array.isArray(player.utilitiesList) ? player.utilitiesList : [];

      const propertiesHtml = props.length > 0
        ? props.map(p => {
            const level = (p.improvements || 0) + 1; // 1..3
            const tags = [p.hasMonopoly ? '<span class="tag monopoly">Monopolio</span>' : '']
              .filter(Boolean)
              .join(' ');
            return `
              <div class="property-item">
                <span class="color-dot" style="background:${p.color || '#999'}"></span>
                <span class="property-name">${p.name}</span>
                <span class="property-level">Nivel ${level}/3</span>
                ${tags}
              </div>
            `;
          }).join('')
        : '<p class="no-properties">Sin propiedades</p>';

      const railroadsHtml = rails.length > 0
        ? rails.map(r => `<div class="service-item">🚆 ${r.name}</div>`).join('')
        : '<p class="no-services">Sin transportes</p>';

      const utilitiesHtml = utils.length > 0
        ? utils.map(u => `<div class="service-item">⚡ ${u.name}</div>`).join('')
        : '<p class="no-services">Sin servicios</p>';

      this.elements.playerProperties.innerHTML = `
        <h4>Propiedades (${props.length})</h4>
        <div class="properties-list-ui">
          ${propertiesHtml}
        </div>
        <h4 style="margin-top:10px">Transportes (${rails.length})</h4>
        <div class="railroads-list-ui">${railroadsHtml}</div>
        <h4 style="margin-top:10px">Servicios (${utils.length})</h4>
        <div class="utilities-list-ui">${utilitiesHtml}</div>
      `;
    }
  }

  updateAllPlayersInfo(players) {
    if (!this.elements.allPlayersInfo || !players) return;

    this.elements.allPlayersInfo.innerHTML = players.map((player, index) => {
      const isActive = this.game.currentPlayerIndex === index;
      const isBankrupt = player.money <= -1000000;
      
      return `
        <div class="player-summary ${isActive ? 'active' : ''} ${isBankrupt ? 'bankrupt' : ''}">
          <div class="player-summary-header">
            <span class="player-summary-name" style="color: ${this.getPlayerColor(player.name)}">
              ${player.name}
            </span>
            <span class="player-summary-money ${player.money < 0 ? 'negative' : ''}">
              ${this.formatMoney(player.money)}
            </span>
          </div>
          <div class="player-summary-properties">
            ${player.properties?.length || 0} propiedades
          </div>
        </div>
      `;
    }).join('');
  }

  updatePlayerAvatars() {
    if (!this.game.players) return;

    this.game.players.forEach((player, index) => {
      const avatar = document.getElementById(`player-avatar-${index}`);
      if (avatar) {
        const isActive = this.game.currentPlayerIndex === index;
        const nameElement = avatar.querySelector('.avatar-name');
        const initialElement = avatar.querySelector('.avatar-initial');
        
        if (nameElement) {
          nameElement.textContent = player.name;
          nameElement.style.color = this.getPlayerColor(player.name);
        }
        
        if (initialElement) {
          const emoji = player.avatarEmoji;
          if (emoji && (emoji.endsWith('.svg') || emoji.endsWith('.png') || emoji.startsWith('/avatars/'))) {
            initialElement.innerHTML = `<img src="${emoji}" alt="avatar" style="width:28px;height:28px;border-radius:50%"/>`;
          } else {
            initialElement.textContent = emoji ? emoji : player.name.charAt(0).toUpperCase();
          }
          initialElement.style.backgroundColor = player.color || this.getPlayerColor(player.name);
        }
        
        // Resaltar jugador activo
        avatar.classList.toggle('active', isActive);
        
        // Mostrar/ocultar según el número de jugadores
        avatar.style.display = index < this.game.players.length ? 'flex' : 'none';
      }
    });
  }

  // Funciones de cartas de destino
  showDestinyCard(message) {
    if (!this.elements.destinyCardModal) return;

  this.elements.destinyCardText.textContent = message;
    this.elements.destinyCardModal.style.display = 'flex';
    
    // Animación de volteo de carta
    const cardFlip = this.elements.destinyCardModal.querySelector('.card-flip');
    if (cardFlip) {
      setTimeout(() => {
        cardFlip.style.transform = 'rotateY(180deg)';
      }, 500);
    }
  }

  closeDestinyCard() {
    if (this.elements.destinyCardModal) {
      this.elements.destinyCardModal.style.display = 'none';
      
      // Resetear animación
      const cardFlip = this.elements.destinyCardModal.querySelector('.card-flip');
      if (cardFlip) {
        cardFlip.style.transform = 'rotateY(0deg)';
      }
      // Notificar al juego para procesar la carta
      if (this.game && typeof this.game.continueAfterDestiny === 'function') {
        this.game.continueAfterDestiny();
      }
    }
  }

  // Modal de cárcel
  showJailOptionsModal(player) {
    if (!this.elements.jailOptionsModal) return;

    // Texto con el nombre del jugador
    if (this.elements.jailPlayerName) {
      this.elements.jailPlayerName.textContent = `${player.name}, ¿qué decides hacer?`;
    }
    // Asegurar que el botón de pagar muestra el monto correcto
    if (this.elements.jailPayBtn) {
      this.elements.jailPayBtn.textContent = 'Pagar $700.000';
    }

    // Ocultar botones centrales y detener timer mientras decide
    this.hideCenterDiceButton();
    this.hideCenterButtons();
    this.stopCurrentTimer();

    // Mostrar modal
    this.elements.jailOptionsModal.style.display = 'flex';
  }

  hideJailOptions() {
    if (this.elements.jailOptionsModal) {
      this.elements.jailOptionsModal.style.display = 'none';
    }
  }

  // Funciones de mensajes flotantes
  addFloatingMessage(message, type = 'info') {
    if (!this.elements.floatingMessages) return;

    const messageElement = document.createElement('div');
    messageElement.className = `floating-message ${type}`;
    messageElement.textContent = message;

    this.elements.floatingMessages.appendChild(messageElement);

    // Remover mensaje después de 5 segundos
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 5000);
  }

  // Funciones de controles de teclado
  handleKeyPress(e) {
    // Solo procesar si no hay modales abiertos
    if (this.elements.gameSetupModal.classList.contains('show') ||
  this.elements.destinyCardModal.style.display === 'flex' ||
  (this.elements.jailOptionsModal && this.elements.jailOptionsModal.style.display === 'flex')) {
      return;
    }

    switch(e.code) {
      case 'Space':
        e.preventDefault();
        if (this.elements.centerDiceButton && this.elements.centerDiceButton.style.display !== 'none') {
          this.handleCenterRollDice();
        }
        break;
      case 'KeyB':
        e.preventDefault();
        if (this.elements.centerBuyBtn && this.elements.centerBuyBtn.style.display !== 'none') {
          this.handleCenterBuyProperty();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.elements.centerPassBtn && this.elements.centerPassBtn.style.display !== 'none') {
          this.handleCenterPassTurn();
        }
        break;
    }
  }

  // Funciones de utilidad
  getPlayerColor(playerName) {
    const colors = [
      '#E74C3C', // Rojo vibrante
      '#3498DB', // Azul brillante  
      '#2ECC71', // Verde esmeralda
      '#F39C12', // Naranja dorado
      '#9B59B6'  // Púrpura elegante
    ];
    const index = parseInt(playerName.replace('Jugador ', '')) - 1;
    return colors[index % colors.length];
  }

  formatMoney(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(number) {
    return new Intl.NumberFormat('es-AR').format(number);
  }

  // Validar que no haya colores duplicados
  validateUniqueColors() {
    if (!this._avatarSelections) return true;
    
    const colors = Object.values(this._avatarSelections).map(selection => selection.color);
    const uniqueColors = [...new Set(colors)];
    
    if (colors.length !== uniqueColors.length) {
      // Hay colores duplicados - mostrar advertencia sutil
      console.warn('⚠️ Algunos jugadores tienen el mismo color. Considera usar colores únicos para una mejor experiencia.');
      return false;
    }
    
    return true;
  }
}
