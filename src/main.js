import './style.css';
import { Game } from './game/Game.js';
import { GameUI } from './ui/GameUI.js';

// Inicializar el juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  
  if (!canvas) {
    console.error('No se encontró el canvas del juego');
    return;
  }
  
  // Crear la instancia del juego
  const game = new Game(canvas);
  
  // Crear la interfaz de usuario
  const gameUI = new GameUI(game);
  
  // Asignar la referencia de UI al juego
  game.ui = gameUI;

  // Conectar callbacks de estado y log para actualizar la UI
  game.onGameStateChange = (state) => {
    // UI principal
    if (state.currentPlayer) {
      gameUI.updateUI(
        state.currentPlayer,
        state.canRollDice,
        state.canBuyProperty,
        state.canEndTurn,
        state.waitingForBuyDecision
      );
    }
    // Panel lateral con todos los jugadores
    gameUI.updateAllPlayersInfo(state.players);
  };
  
  game.onLogMessage = (msg) => {
    gameUI.addFloatingMessage(msg);
  };
  
  // Exponer gameUI globalmente para las funciones onclick
  window.gameUI = gameUI;
  
  // Exponer game para pruebas (solo para desarrollo)
  window.game = game;
  
  // Función de prueba para ir directamente a la cárcel
  window.testJail = () => {
    const currentPlayer = game.getCurrentPlayer();
    currentPlayer.position = 5; // Posición de la cárcel
    currentPlayer.updateVisualPosition(game.board);
    game.handleJailLanding();
  };
  
  // Función de prueba para las cartas de destino
  window.testDestiny = () => {
    const currentPlayer = game.getCurrentPlayer();
    currentPlayer.position = 11; // Posición de destino
    currentPlayer.updateVisualPosition(game.board);
    game.handleDestinyLanding();
  };
  
  // Función de prueba para probar dados
  window.testDice = () => {
    console.log('=== TEST DADOS ===');
    const currentPlayer = game.getCurrentPlayer();
    console.log(`Jugador actual: ${currentPlayer.name}`);
    
    // Forzar mostrar el botón de dados
    gameUI.showCenterDiceButton();
    
    // Asegurar que se puede tirar dados
    game.canRollDice = true;
    game.waitingForBuyDecision = false;
    
    console.log('Botón de dados forzado a mostrarse');
    
    // Simular tirada de dados si es necesario
    // game.rollDice();
  };
  
  // Función de prueba para probar las reglas de servicios
  window.testUtilities = () => {
    const currentPlayer = game.getCurrentPlayer();
    console.log('=== TEST SERVICIOS ===');
    console.log(`Jugador actual: ${currentPlayer.name}`);
    console.log(`Dinero: $${currentPlayer.money.toLocaleString()}`);
    console.log(`Servicios actuales: ${currentPlayer.utilities.length}`);
    
    // Ir a Naturgy (id: 8) - deberá dar opción de compra
    currentPlayer.position = 8;
    currentPlayer.updateVisualPosition(game.board);
    console.log('Moviendo a Naturgy (servicio de gas)...');
    game.handleUtilityLanding(game.board.getSpace(8));
  };
  
  // Función de prueba para probar cartas de Destino (duplicado renombrado)
  window.testDestiny2 = () => {
    const currentPlayer = game.getCurrentPlayer();
    currentPlayer.position = 11; // Primera posición de Destino
    currentPlayer.updateVisualPosition(game.board);
    game.handleDestinyLanding();
  };
  
  // Loop de renderizado del juego
  function gameLoop() {
    game.draw();
    requestAnimationFrame(gameLoop);
  }
  
  // Iniciar el loop de renderizado
  gameLoop();
  
  // Hacer el canvas responsive
  function resizeCanvas() {
    const container = canvas.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    // Mantener proporción cuadrada con más margen para el tablero
    const maxSize = Math.min(containerRect.width - 40, containerRect.height - 40, 650);
    canvas.width = maxSize;
    canvas.height = maxSize;
    
    // Recrear el tablero con las nuevas dimensiones
    import('./board/Board.js').then(module => {
      game.board = new module.Board(canvas, canvas.getContext('2d'));
      // Enlazar jugadores al tablero para dibujar dueños en propiedades
      if (typeof game.board.setPlayers === 'function') {
        game.board.setPlayers(game.players);
      }
      
      // Pequeño retraso para asegurar que todo esté inicializado
      setTimeout(() => {
        // Actualizar animación de dados
        if (game.diceAnimation && typeof game.diceAnimation.updateCanvasSize === 'function') {
          game.diceAnimation.updateCanvasSize();
        }
        
        // Reposicionar jugadores
        game.players.forEach(player => {
          player.updateVisualPosition(game.board);
        });
      }, 100);
    });
  }
  
  // Ajustar canvas al cargar y al redimensionar
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Agregar controles de teclado
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
    case ' ': // Barra espaciadora para tirar dados
        event.preventDefault();
        if (game.canRollDice) {
      game.rollDice();
        }
        break;
      case 'b': // B para comprar propiedad
      case 'B':
        if (game.canBuyProperty && game.waitingForBuyDecision) {
          game.buyProperty();
        }
        break;
      case 'm': // M para mostrar monopolios y mejoras
      case 'M':
        game.showPlayerImprovements();
        break;
      case 'i': // I para mejorar propiedades (modo interactivo)
      case 'I':
        const currentPlayer = game.getCurrentPlayer();
        const improvableProperties = game.getImprovableProperties(currentPlayer);
        
        if (improvableProperties.length === 0) {
          game.logMessage(`❌ ${currentPlayer.name} no tiene propiedades mejorables`);
        } else {
          game.logMessage(`🏗️ Propiedades mejorables de ${currentPlayer.name}:`);
          improvableProperties.forEach((property, index) => {
            const cost = currentPlayer.getImprovementCost(property);
            const improvements = currentPlayer.propertyImprovements[property.id] || 0;
            game.logMessage(`${index + 1}. ${property.name} (Nivel ${improvements}/3) - Costo: $${cost.toLocaleString()}`);
          });
          game.logMessage(`💡 Usa números 1-${improvableProperties.length} para mejorar`);
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // Mejorar propiedad por número
        const propertyIndex = parseInt(event.key) - 1;
        const player = game.getCurrentPlayer();
        const properties = game.getImprovableProperties(player);
        
        if (properties[propertyIndex]) {
          game.improveProperty(properties[propertyIndex].id);
        }
        break;
      case 'Enter': // Enter para terminar turno o saltar compra
        if (game.waitingForBuyDecision) {
          game.skipPurchase();
        } else if (game.canEndTurn) {
          game.endTurn();
        }
        break;
      case 'n': // N para nuevo juego
      case 'N':
        if (event.ctrlKey) {
          event.preventDefault();
          game.newGame();
        }
        break;
    }
  });
  
  // Mostrar controles en consola
  console.log('🎮 Controles del juego:');
  console.log('Barra espaciadora: Tirar dados');
  console.log('B: Comprar propiedad (cuando está disponible)');
  console.log('M: Mostrar monopolios y mejoras disponibles');
  console.log('I: Ver propiedades mejorables');
  console.log('1-9: Mejorar propiedad por número (después de presionar I)');
  console.log('Enter: Terminar turno / Saltar compra de propiedad');
  console.log('Ctrl+N: Nueva partida');
  console.log('');
  console.log('📋 Flujo de turno:');
  console.log('1. Tirar dados (ESPACIO)');
  console.log('2. Si llega a propiedad libre: decidir comprar (B) o pasar (Enter)');
  console.log('3. Opcional: Ver mejoras (M) y construir (I + número)');
  console.log('4. Terminar turno (Enter)');
  console.log('');
  console.log('🏗️ Sistema de monopolios:');
  console.log('- Compra todas las ciudades del mismo color para obtener monopolio');
  console.log('- Con monopolio: alquileres se duplican y puedes construir mejoras');
  console.log('- Hasta 3 niveles de mejora por propiedad');
  console.log('- Costo de mejora: 50% del precio de la propiedad');
  
  // Agregar información del juego a la ventana global para debug
  if (typeof window !== 'undefined') {
    window.bankrollGame = game;
    window.bankrollUI = gameUI;
  }
});
