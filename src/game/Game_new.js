import { Board } from '../board/Board.js';
import { Player } from '../player/Player.js';
import { communityChestCards, chanceCards, shuffleCards } from '../board/cards.js';
import { boardSpaces } from '../board/spaces.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = new Board(canvas, this.ctx);
    
    // Estado del juego
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gamePhase = 'SETUP'; // SETUP, PLAYING, GAME_OVER
    this.winner = null;
    this.diceRoll = [0, 0];
    this.canRollDice = true;
    this.canBuyProperty = false;
    this.canEndTurn = false;
    this.waitingForBuyDecision = false; // Nueva variable para esperar decisión de compra
    
    // Límites de dinero para terminar el juego
    this.winLimit = 7500000; // $7.500.000 para ganar (configurable)
    this.bankruptLimit = -1000000; // -$1.000.000 para quiebra
    
    // Configuración de jugadores
    this.minPlayers = 2;
    this.maxPlayers = 5;
    this.selectedPlayerCount = 2; // Por defecto 2 jugadores
    
    // Cartas
    this.communityChestDeck = shuffleCards(communityChestCards);
    this.chanceDeck = shuffleCards(chanceCards);
    this.communityChestIndex = 0;
    this.chanceIndex = 0;
    
    // Callbacks para la UI
    this.onGameStateChange = null;
    this.onLogMessage = null;
    this.onGameSetup = null;
    this.onGameOver = null;
    
    // No inicializar automáticamente, esperar configuración del usuario
    this.showGameSetup();
  }
  
  showGameSetup() {
    this.gamePhase = 'SETUP';
    if (this.onGameSetup) {
      this.onGameSetup();
    }
    this.updateGameState();
  }
  
  setPlayerCount(count) {
    if (count >= this.minPlayers && count <= this.maxPlayers) {
      this.selectedPlayerCount = count;
      return true;
    }
    return false;
  }
  
  setWinLimit(amount) {
    if (amount >= 1000000 && amount <= 50000000) {
      this.winLimit = amount;
      return true;
    }
    return false;
  }
  
  initializeGame() {
    // Limpiar jugadores anteriores
    this.players = [];
    this.currentPlayerIndex = 0;
    this.winner = null;
    
    // Colores predefinidos para los jugadores - Más atractivos y distintivos
    const playerColors = [
      '#E74C3C', // Rojo vibrante
      '#3498DB', // Azul brillante
      '#2ECC71', // Verde esmeralda
      '#F39C12', // Naranja dorado
      '#9B59B6'  // Púrpura elegante
    ];
    const playerNames = ['Fede', 'Walter', 'Franci', 'Facu', 'Tuma'];
    
    // Crear jugadores según la cantidad seleccionada
    for (let i = 0; i < this.selectedPlayerCount; i++) {
      this.addPlayer(playerNames[i], playerColors[i]);
    }
    
    // Posicionar jugadores en LARGADA
    this.players.forEach(player => {
      player.updateVisualPosition(this.board);
    });
    
    // Establecer animaciones para el jugador inicial
    this.updateCurrentPlayerAnimations();
    
    this.gamePhase = 'PLAYING';
    this.logMessage(`🎮 ¡Comienza la partida con ${this.selectedPlayerCount} jugadores!`);
    this.logMessage(`🎯 Meta de Victoria: $${this.winLimit.toLocaleString()}`);
    this.logMessage(`💸 Límite de Bancarrota: $${this.bankruptLimit.toLocaleString()}`);
    this.logMessage(`💰 Cada jugador inicia con $${this.players[0].money.toLocaleString()}`);
    this.logMessage(`🎯 Turno de ${this.getCurrentPlayer().name}`);
    this.logMessage(`🎲 Presiona ESPACIO para tirar los dados`);
    this.updateGameState();
  }
  
  addPlayer(name, color) {
    const player = new Player(this.players.length, name, color);
    this.players.push(player);
    return player;
  }
  
  getCurrentPlayer() {
    // Asegurar que devuelve un jugador activo (no en bancarrota)
    let attempts = 0;
    while (this.players[this.currentPlayerIndex]?.bankrupt && attempts < this.players.length) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
    }
    return this.players[this.currentPlayerIndex];
  }
  
  rollDice() {
    if (!this.canRollDice || this.gamePhase !== 'PLAYING') return [0, 0];
    
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    this.diceRoll = [dice1, dice2];
    
    const currentPlayer = this.getCurrentPlayer();
    const total = dice1 + dice2;
    
    this.logMessage(`🎲 ${currentPlayer.name} tiró los dados: ${dice1} + ${dice2} = ${total}`);
    
    // Verificar si está en la cárcel
    if (currentPlayer.isInJail) {
      if (currentPlayer.tryToGetOutOfJail(dice1, dice2)) {
        this.logMessage(`🔓 ${currentPlayer.name} sale de la cárcel!`);
        this.movePlayer(total);
      } else {
        this.logMessage(`🔒 ${currentPlayer.name} permanece en la cárcel (turno ${currentPlayer.jailTurns}/3)`);
        this.endTurn();
      }
    } else {
      this.movePlayer(total);
    }
    
    this.canRollDice = false;
    this.updateGameState();
    
    return this.diceRoll;
  }
  
  movePlayer(spaces) {
    const currentPlayer = this.getCurrentPlayer();
    const oldPosition = currentPlayer.position;
    
    currentPlayer.move(spaces, this.board);
    currentPlayer.isMoving = true;
    
    this.logMessage(`🚶 ${currentPlayer.name} se mueve de ${this.board.getSpace(oldPosition).name} a ${this.board.getSpace(currentPlayer.position).name}`);
    
    // Verificar si pasó por LARGADA y cobrar
    if (oldPosition > currentPlayer.position || (oldPosition + spaces >= 28)) {
      this.logMessage(`💰 ${currentPlayer.name} pasa por LARGADA y cobra $200.000`);
    }
    
    // Procesar la llegada a la nueva casilla después de un breve delay
    setTimeout(() => {
      this.processSpaceLanding();
    }, 500);
  }
  
  processSpaceLanding() {
    const currentPlayer = this.getCurrentPlayer();
    const space = this.board.getSpace(currentPlayer.position);
    
    this.logMessage(`📍 ${currentPlayer.name} llega a ${space.name}`);
    
    switch (space.type) {
      case 'PROPERTY':
        this.handlePropertyLanding(space);
        break;
      case 'RAILROAD':
        this.handleRailroadLanding(space);
        break;
      case 'UTILITY':
        this.handleUtilityLanding(space);
        break;
      case 'TAX':
        this.handleTaxLanding(space);
        break;
      case 'COMMUNITY_CHEST':
        this.handleCommunityChestLanding();
        break;
      case 'CHANCE':
        this.handleChanceLanding();
        break;
      case 'GO_TO_JAIL':
        this.handleGoToJail();
        break;
      case 'START':
        this.logMessage(`🏁 ${currentPlayer.name} está en LARGADA!`);
        this.canEndTurn = true;
        break;
      case 'JAIL':
        this.logMessage(`👀 ${currentPlayer.name} está de visita en la cárcel`);
        this.canEndTurn = true;
        break;
      case 'FREE_PARKING':
        this.logMessage(`🅿️ ${currentPlayer.name} descansa en el estacionamiento libre`);
        this.canEndTurn = true;
        break;
    }
    
    this.updateGameState();
  }
  
  handlePropertyLanding(space) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (!space.owner) {
      // Propiedad libre - verificar si puede comprar
      if (currentPlayer.money >= space.price) {
        this.canBuyProperty = true;
        this.waitingForBuyDecision = true;
        this.logMessage(`🏠 ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`💰 ${currentPlayer.name} tiene $${currentPlayer.money.toLocaleString()}`);
        this.logMessage(`❓ ¿Desea comprar esta propiedad? Presiona 'B' para comprar o 'Enter' para pasar turno`);
      } else {
        this.logMessage(`🏠 ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`❌ ${currentPlayer.name} no tiene suficiente dinero ($${currentPlayer.money.toLocaleString()})`);
        this.canEndTurn = true;
      }
    } else if (space.owner !== currentPlayer.id) {
      // Propiedad ocupada - pagar alquiler automáticamente
      const owner = this.players[space.owner];
      const rent = owner.calculateRent(space, boardSpaces);
      
      if (currentPlayer.pay(rent)) {
        owner.receive(rent);
        this.logMessage(`💸 ${currentPlayer.name} paga $${rent.toLocaleString()} de alquiler a ${owner.name}`);
      } else {
        this.logMessage(`💸 ${currentPlayer.name} no puede pagar el alquiler de $${rent.toLocaleString()}!`);
        this.handleBankruptcy(currentPlayer);
      }
      this.canEndTurn = true;
    } else {
      this.logMessage(`🏠 ${currentPlayer.name} está en su propia propiedad`);
      this.canEndTurn = true;
    }
  }
  
  handleRailroadLanding(space) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (!space.owner) {
      if (currentPlayer.money >= space.price) {
        this.canBuyProperty = true;
        this.waitingForBuyDecision = true;
        this.logMessage(`🚂 ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`💰 ${currentPlayer.name} tiene $${currentPlayer.money.toLocaleString()}`);
        this.logMessage(`❓ ¿Desea comprar este transporte? Presiona 'B' para comprar o 'Enter' para pasar turno`);
      } else {
        this.logMessage(`🚂 ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`❌ ${currentPlayer.name} no tiene suficiente dinero ($${currentPlayer.money.toLocaleString()})`);
        this.canEndTurn = true;
      }
    } else if (space.owner !== currentPlayer.id) {
      const owner = this.players[space.owner];
      const rent = owner.calculateRent(space, boardSpaces);
      
      if (currentPlayer.pay(rent)) {
        owner.receive(rent);
        this.logMessage(`💸 ${currentPlayer.name} paga $${rent.toLocaleString()} por usar ${space.name}`);
      } else {
        this.logMessage(`💸 ${currentPlayer.name} no puede pagar $${rent.toLocaleString()}!`);
        this.handleBankruptcy(currentPlayer);
      }
      this.canEndTurn = true;
    } else {
      this.logMessage(`🚂 ${currentPlayer.name} está en su propio transporte`);
      this.canEndTurn = true;
    }
  }
  
  handleUtilityLanding(space) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (!space.owner) {
      if (currentPlayer.money >= space.price) {
        this.canBuyProperty = true;
        this.waitingForBuyDecision = true;
        this.logMessage(`⚡ ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`💰 ${currentPlayer.name} tiene $${currentPlayer.money.toLocaleString()}`);
        this.logMessage(`❓ ¿Desea comprar este servicio? Presiona 'B' para comprar o 'Enter' para pasar turno`);
      } else {
        this.logMessage(`⚡ ${space.name} está disponible por $${space.price.toLocaleString()}`);
        this.logMessage(`❌ ${currentPlayer.name} no tiene suficiente dinero ($${currentPlayer.money.toLocaleString()})`);
        this.canEndTurn = true;
      }
    } else if (space.owner !== currentPlayer.id) {
      const owner = this.players[space.owner];
      const diceTotal = this.diceRoll[0] + this.diceRoll[1];
      const rent = owner.calculateRent(space, boardSpaces, diceTotal);
      
      if (currentPlayer.pay(rent)) {
        owner.receive(rent);
        this.logMessage(`💸 ${currentPlayer.name} paga $${rent.toLocaleString()} por usar ${space.name} (dados: ${diceTotal})`);
      } else {
        this.logMessage(`💸 ${currentPlayer.name} no puede pagar $${rent.toLocaleString()}!`);
        this.handleBankruptcy(currentPlayer);
      }
      this.canEndTurn = true;
    } else {
      this.logMessage(`⚡ ${currentPlayer.name} está en su propio servicio`);
      this.canEndTurn = true;
    }
  }
  
  handleTaxLanding(space) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer.pay(space.amount)) {
      this.logMessage(`💸 ${currentPlayer.name} paga $${space.amount.toLocaleString()} en impuestos (${space.name})`);
      this.logMessage(`💰 ${currentPlayer.name} ahora tiene $${currentPlayer.money.toLocaleString()}`);
    } else {
      this.logMessage(`💸 ${currentPlayer.name} no puede pagar los impuestos de $${space.amount.toLocaleString()}!`);
      this.handleBankruptcy(currentPlayer);
    }
    
    this.canEndTurn = true;
  }
  
  handleCommunityChestLanding() {
    const card = this.communityChestDeck[this.communityChestIndex];
    this.communityChestIndex = (this.communityChestIndex + 1) % this.communityChestDeck.length;
    
    this.logMessage(`Caja Comunitaria: ${card.title} - ${card.description}`);
    this.processCard(card);
  }
  
  handleChanceLanding() {
    const card = this.chanceDeck[this.chanceIndex];
    this.chanceIndex = (this.chanceIndex + 1) % this.chanceDeck.length;
    
    this.logMessage(`Destino: ${card.title} - ${card.description}`);
    this.processCard(card);
  }
  
  processCard(card) {
    const currentPlayer = this.getCurrentPlayer();
    
    switch (card.action) {
      case 'COLLECT':
        currentPlayer.receive(card.amount);
        this.logMessage(`${currentPlayer.name} recibe $${card.amount.toLocaleString()}`);
        break;
      case 'PAY':
        if (currentPlayer.pay(card.amount)) {
          this.logMessage(`${currentPlayer.name} paga $${card.amount.toLocaleString()}`);
        } else {
          this.logMessage(`${currentPlayer.name} no puede pagar!`);
        }
        break;
      case 'GO_TO_JAIL':
        currentPlayer.goToJail();
        currentPlayer.updateVisualPosition(this.board);
        this.logMessage(`${currentPlayer.name} va a la cárcel!`);
        break;
      case 'GET_OUT_OF_JAIL_FREE':
        currentPlayer.getOutOfJailFreeCards++;
        this.logMessage(`${currentPlayer.name} obtiene una carta para salir de la cárcel`);
        break;
      case 'PAY_PERCENTAGE':
        const amount = Math.floor(currentPlayer.money * card.percentage / 100);
        currentPlayer.pay(amount);
        this.logMessage(`${currentPlayer.name} pierde $${amount.toLocaleString()} (${card.percentage}% de su dinero)`);
        break;
      case 'COLLECT_FROM_ALL':
        this.players.forEach(player => {
          if (player.id !== currentPlayer.id) {
            if (player.pay(card.amount)) {
              currentPlayer.receive(card.amount);
            }
          }
        });
        this.logMessage(`Todos los jugadores pagan $${card.amount.toLocaleString()} a ${currentPlayer.name}`);
        break;
      case 'LOSE_TURN':
        this.logMessage(`${currentPlayer.name} pierde el próximo turno`);
        // TODO: Implementar lógica para perder turno
        break;
    }
    
    this.canEndTurn = true;
  }
  
  handleGoToJail() {
    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.goToJail();
    currentPlayer.updateVisualPosition(this.board);
    this.logMessage(`${currentPlayer.name} va directo a la cárcel!`);
    this.canEndTurn = true;
  }
  
  buyProperty() {
    if (!this.canBuyProperty || !this.waitingForBuyDecision) return false;
    
    const currentPlayer = this.getCurrentPlayer();
    const space = this.board.getSpace(currentPlayer.position);
    
    let success = false;
    
    if (space.type === 'PROPERTY') {
      success = currentPlayer.buyProperty(space);
    } else if (space.type === 'RAILROAD') {
      success = currentPlayer.buyRailroad(space);
    } else if (space.type === 'UTILITY') {
      success = currentPlayer.buyUtility(space);
    }
    
    if (success) {
      this.logMessage(`✅ ${currentPlayer.name} compra ${space.name} por $${space.price.toLocaleString()}`);
      this.logMessage(`💰 ${currentPlayer.name} ahora tiene $${currentPlayer.money.toLocaleString()}`);
      this.canBuyProperty = false;
      this.waitingForBuyDecision = false;
      this.canEndTurn = true;
    } else {
      this.logMessage(`❌ ${currentPlayer.name} no tiene suficiente dinero para comprar ${space.name}`);
    }
    
    this.updateGameState();
    return success;
  }
  
  skipPurchase() {
    if (!this.waitingForBuyDecision) return;
    
    const currentPlayer = this.getCurrentPlayer();
    const space = this.board.getSpace(currentPlayer.position);
    
    this.logMessage(`❌ ${currentPlayer.name} decide no comprar ${space.name}`);
    this.canBuyProperty = false;
    this.waitingForBuyDecision = false;
    this.canEndTurn = true;
    this.updateGameState();
  }
  
  handleBankruptcy(player) {
    player.bankrupt = true;
    this.logMessage(`💀 ${player.name} ha quedado en BANCARROTA!`);
    
    // Liberar todas las propiedades del jugador
    boardSpaces.forEach(space => {
      if (space.owner === player.id) {
        delete space.owner;
        this.logMessage(`🏠 ${space.name} queda libre nuevamente`);
      }
    });
    
    // Verificar si queda solo un jugador activo
    const activePlayers = this.players.filter(p => !p.bankrupt);
    if (activePlayers.length === 1) {
      this.winner = activePlayers[0];
      this.gamePhase = 'GAME_OVER';
      this.logMessage(`🏆 ¡${this.winner.name} GANA! Es el último jugador activo!`);
      if (this.onGameOver) {
        this.onGameOver(this.winner, 'LAST_STANDING');
      }
    }
  }
  
  checkGameEnd() {
    // Verificar si algún jugador ganó
    for (let player of this.players) {
      if (!player.bankrupt && player.money >= this.winLimit) {
        this.winner = player;
        this.gamePhase = 'GAME_OVER';
        this.logMessage(`🎉 ¡${player.name} GANA! Consiguió $${player.money.toLocaleString()}`);
        this.logMessage(`🏆 ¡Felicitaciones! Has conquistado Argentina económicamente!`);
        if (this.onGameOver) {
          this.onGameOver(player, 'WIN');
        }
        return true;
      }
      
      // Verificar bancarrota
      if (!player.bankrupt && player.money <= this.bankruptLimit) {
        this.handleBankruptcy(player);
        return this.gamePhase === 'GAME_OVER'; // Si quedó un solo jugador, el juego termina
      }
    }
    
    // Verificar si solo queda un jugador activo
    const activePlayers = this.players.filter(p => !p.bankrupt);
    if (activePlayers.length === 1) {
      this.winner = activePlayers[0];
      this.gamePhase = 'GAME_OVER';
      this.logMessage(`🏆 ¡${this.winner.name} GANA! Es el último jugador en pie!`);
      if (this.onGameOver) {
        this.onGameOver(this.winner, 'LAST_STANDING');
      }
      return true;
    }
    
    return false;
  }
  
  endTurn() {
    if (!this.canEndTurn && this.canRollDice) return;
    
    // Si está esperando decisión de compra, no puede terminar turno
    if (this.waitingForBuyDecision) {
      this.logMessage(`❓ ${this.getCurrentPlayer().name} debe decidir si compra la propiedad primero`);
      return;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    
    // Verificar condiciones de fin de juego después de cada turno
    if (this.checkGameEnd()) {
      this.updateGameState();
      return;
    }
    
    // Verificar si sacó dobles y no está en la cárcel
    const isDoubles = this.diceRoll[0] === this.diceRoll[1];
    if (isDoubles && !currentPlayer.isInJail && this.diceRoll[0] > 0) {
      this.logMessage(`🎲 ${currentPlayer.name} sacó dobles! Tira otra vez.`);
      this.canRollDice = true;
      this.canEndTurn = false;
      this.canBuyProperty = false;
      this.waitingForBuyDecision = false;
      
      // Mantener las animaciones del jugador actual
      this.updateCurrentPlayerAnimations();
    } else {
      // Pasar al siguiente jugador activo (no en bancarrota)
      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      } while (this.players[this.currentPlayerIndex].bankrupt);
      
      // Actualizar estado de jugador activo para animaciones
      this.updateCurrentPlayerAnimations();
      
      // Verificar nuevamente después del cambio de jugador
      if (!this.checkGameEnd()) {
        this.logMessage(`🎯 Turno de ${this.getCurrentPlayer().name} (Dinero: $${this.getCurrentPlayer().money.toLocaleString()})`);
        this.logMessage(`🎲 Presiona ESPACIO para tirar los dados`);
        this.canRollDice = true;
        this.canEndTurn = false;
        this.canBuyProperty = false;
        this.waitingForBuyDecision = false;
        this.diceRoll = [0, 0];
      }
    }
    
    this.updateGameState();
  }
  
  logMessage(message) {
    console.log(message);
    if (this.onLogMessage) {
      this.onLogMessage(message);
    }
  }
  
  updateGameState() {
    if (this.onGameStateChange) {
      this.onGameStateChange({
        currentPlayer: this.getCurrentPlayer(),
        canRollDice: this.canRollDice && this.gamePhase === 'PLAYING',
        canBuyProperty: this.canBuyProperty && this.gamePhase === 'PLAYING',
        canEndTurn: this.canEndTurn && this.gamePhase === 'PLAYING',
        waitingForBuyDecision: this.waitingForBuyDecision,
        diceRoll: this.diceRoll,
        players: this.players.map(p => p.getInfo()),
        activePlayers: this.players.filter(p => !p.bankrupt).length,
        gamePhase: this.gamePhase,
        winner: this.winner,
        selectedPlayerCount: this.selectedPlayerCount,
        minPlayers: this.minPlayers,
        maxPlayers: this.maxPlayers,
        winLimit: this.winLimit,
        bankruptLimit: this.bankruptLimit
      });
    }
  }
  
  draw() {
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar tablero
    this.board.draw();
    
    // Dibujar jugadores
    this.players.forEach(player => {
      player.draw(this.ctx, this.board);
    });
  }
  
  // Función para iniciar un nuevo juego
  newGame() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gamePhase = 'SETUP';
    this.winner = null;
    this.diceRoll = [0, 0];
    this.canRollDice = true;
    this.canBuyProperty = false;
    this.canEndTurn = false;
    this.waitingForBuyDecision = false;
    
    // Reiniciar mazos de cartas
    this.communityChestDeck = shuffleCards(communityChestCards);
    this.chanceDeck = shuffleCards(chanceCards);
    this.communityChestIndex = 0;
    this.chanceIndex = 0;
    
    // Reiniciar propiedades
    boardSpaces.forEach(space => {
      if (space.owner !== undefined) {
        delete space.owner;
      }
    });
    
    // Mostrar configuración del juego
    this.logMessage('🔄 Iniciando nueva partida...');
    this.showGameSetup();
  }
  
  // Actualizar estado de animaciones para el jugador actual
  updateCurrentPlayerAnimations() {
    this.players.forEach((player, index) => {
      const isCurrentPlayer = index === this.currentPlayerIndex;
      player.setAsCurrentPlayer(isCurrentPlayer);
    });
  }
}
