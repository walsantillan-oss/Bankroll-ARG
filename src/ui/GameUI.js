export class GameUI {
  constructor(game) {
    this.game = game;
    this.elements = {};
    this.timers = {};
    this.currentTimer = null;
    this.timerDuration = 15; // segundos por turno
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
      
      // Configuración del juego
      playerCountBtns: document.querySelectorAll('.player-count-btn'),
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

  this.hideGameSetup();
  this.game.startGame(playerCount, winAmount);
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
    this.game.endTurn();
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
    this.startPlayerTimer(current.id, this.timerDuration);
  }

  startDecisionPhase() {
    const current = this.game.getCurrentPlayer();
    if (!current) return;
    // En fase de decisión se oculta el botón de dados; los botones de acción los controla updateUI
    this.hideCenterDiceButton();
    this.startPlayerTimer(current.id, this.timerDuration);
  }

  startPlayerTimer(playerId, duration = this.timerDuration) {
    this.stopCurrentTimer();
    
    this.currentTimer = {
      playerId: playerId,
      timeLeft: duration,
      interval: setInterval(() => {
        this.currentTimer.timeLeft--;
        this.updatePlayerTimerDisplay(playerId, this.currentTimer.timeLeft);
        
        if (this.currentTimer.timeLeft <= 0) {
          this.stopCurrentTimer();
          this.game.endTurn(); // Auto-terminar turno
        }
      }, 1000)
    };
    
    this.updatePlayerTimerDisplay(playerId, duration);
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
      const properties = player.properties || [];
      this.elements.playerProperties.innerHTML = `
        <h4>Propiedades (${properties.length})</h4>
        ${properties.length > 0 ? 
          properties.map(prop => `
            <div class="property-item">
              <span class="property-name">${prop.name}</span>
              <span class="property-rent">${this.formatMoney(prop.rent)}</span>
            </div>
          `).join('') : 
          '<p class="no-properties">Sin propiedades</p>'
        }
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
          initialElement.textContent = player.name.charAt(0).toUpperCase();
          initialElement.style.backgroundColor = this.getPlayerColor(player.name);
        }
        
        // Resaltar jugador activo
        avatar.classList.toggle('active', isActive);
        
        // Mostrar/ocultar según el número de jugadores
        avatar.style.display = index < this.game.players.length ? 'flex' : 'none';
      }
    });
  }

  // Funciones de cartas de destino
  showDestinyCard(title, message) {
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
        this.elements.destinyCardModal.style.display === 'flex') {
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
    const colors = ['#007BC7', '#DC143C', '#228B22', '#FFD700', '#9932CC'];
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
}
