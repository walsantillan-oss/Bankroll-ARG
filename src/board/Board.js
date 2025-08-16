import { boardSpaces, propertyGroups } from './spaces.js';

export class Board {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.spaces = boardSpaces;
    this.groups = propertyGroups;
  this.players = [];
    
    // Dimensiones del tablero - ajustar al 90% del canvas para dejar margen
    const canvasSize = Math.min(canvas.width, canvas.height);
    this.boardSize = canvasSize * 0.90;
    this.spaceWidth = this.boardSize * 0.125; // Aproximadamente 1/8 del tablero
    this.spaceHeight = this.boardSize * 0.095; // Proporción para que quepan bien
    this.cornerSize = this.boardSize * 0.125;
    
    // Posición del tablero en el canvas - centrado
    this.offsetX = (canvas.width - this.boardSize) / 2;
    this.offsetY = (canvas.height - this.boardSize) / 2;
    
    this.calculateSpacePositions();
  }
  
  setPlayers(players) {
    this.players = players || [];
  }
  
  calculateSpacePositions() {
    const positions = [];
    const spacesPerSide = 7; // 6 espacios normales + 1 esquina por lado
    
    // Lado inferior (derecha a izquierda)
    for (let i = 0; i < spacesPerSide; i++) {
      if (i === 0) {
        // Esquina inferior derecha (LARGADA)
        positions.push({
          x: this.offsetX + this.boardSize - this.cornerSize,
          y: this.offsetY + this.boardSize - this.cornerSize,
          width: this.cornerSize,
          height: this.cornerSize,
          isCorner: true
        });
      } else {
        positions.push({
          x: this.offsetX + this.boardSize - this.cornerSize - (i * this.spaceWidth),
          y: this.offsetY + this.boardSize - this.spaceHeight,
          width: this.spaceWidth,
          height: this.spaceHeight,
          isCorner: false
        });
      }
    }
    
    // Esquina inferior izquierda (CÁRCEL)
    positions.push({
      x: this.offsetX,
      y: this.offsetY + this.boardSize - this.cornerSize,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });
    
    // Lado izquierdo (abajo hacia arriba)
    for (let i = 1; i < spacesPerSide; i++) {
      positions.push({
        x: this.offsetX,
        y: this.offsetY + this.boardSize - this.cornerSize - (i * this.spaceWidth),
        width: this.spaceHeight,
        height: this.spaceWidth,
        isCorner: false
      });
    }
    
    // Esquina superior izquierda (ESTACIONAMIENTO LIBRE)
    positions.push({
      x: this.offsetX,
      y: this.offsetY,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });
    
    // Lado superior (izquierda a derecha)
    for (let i = 1; i < spacesPerSide; i++) {
      positions.push({
        x: this.offsetX + (i * this.spaceWidth),
        y: this.offsetY,
        width: this.spaceWidth,
        height: this.spaceHeight,
        isCorner: false
      });
    }
    
    // Esquina superior derecha (VE A LA CÁRCEL)
    positions.push({
      x: this.offsetX + this.boardSize - this.cornerSize,
      y: this.offsetY,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });
    
    // Lado derecho (arriba hacia abajo)
    for (let i = 1; i < spacesPerSide; i++) {
      positions.push({
        x: this.offsetX + this.boardSize - this.spaceHeight,
        y: this.offsetY + (i * this.spaceWidth),
        width: this.spaceHeight,
        height: this.spaceWidth,
        isCorner: false
      });
    }
    
    this.spacePositions = positions;
  }
  
  draw() {
    this.drawBoard();
    this.drawSpaces();
    this.drawCenter();
  }
  
  drawBoard() {
    // Fondo del tablero con gradiente
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width/2, this.canvas.height/2, 0,
      this.canvas.width/2, this.canvas.height/2, this.boardSize/2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize);
    
    // Sombra exterior del tablero
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetX = 5;
    this.ctx.shadowOffsetY = 5;
    
    // Borde del tablero con gradiente dorado
    const borderGradient = this.ctx.createLinearGradient(
      this.offsetX, this.offsetY, 
      this.offsetX + this.boardSize, this.offsetY + this.boardSize
    );
    borderGradient.addColorStop(0, '#FFD700');
    borderGradient.addColorStop(0.5, '#FFA500');
    borderGradient.addColorStop(1, '#FF6B35');
    
    this.ctx.strokeStyle = borderGradient;
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize);
    
    // Resetear sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Centro del tablero con diseño atractivo
    this.drawBoardCenter();
  }

  drawBoardCenter() {
    const centerSize = this.boardSize - (this.spaceHeight * 2);
    const centerX = this.offsetX + this.spaceHeight;
    const centerY = this.offsetY + this.spaceHeight;
    
    // Fondo del centro con gradiente
    const centerGradient = this.ctx.createRadialGradient(
      centerX + centerSize/2, centerY + centerSize/2, 0,
      centerX + centerSize/2, centerY + centerSize/2, centerSize/2
    );
    centerGradient.addColorStop(0, '#0f3460');
    centerGradient.addColorStop(0.7, '#16537e');
    centerGradient.addColorStop(1, '#1a1a2e');
    
    this.ctx.fillStyle = centerGradient;
    this.ctx.fillRect(centerX, centerY, centerSize, centerSize);
    
    // Borde interior dorado
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(centerX, centerY, centerSize, centerSize);
    
    // Logo o título en el centro
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${Math.max(20, this.boardSize/25)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Efecto de brillo en el texto
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 10;
    
    this.ctx.fillText('BANKROLL', centerX + centerSize/2, centerY + centerSize/2 - 10);
    
    this.ctx.font = `${Math.max(14, this.boardSize/35)}px Arial`;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('ARGENTINA', centerX + centerSize/2, centerY + centerSize/2 + 15);
    
    // Resetear efectos
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }
  
  drawSpaces() {
    this.spaces.forEach((space, index) => {
      this.drawSpace(space, index);
    });
  }
  
  drawSpace(space, index) {
    const pos = this.spacePositions[index];
    if (!pos) return;
    
    // Colores modernos según el tipo de espacio
    let bgColor = '#ffffff';
    let accentColor = '#cccccc';
    
    if (space.type === 'PROPERTY' && space.group) {
      // Obtener el color del grupo
      const groupInfo = this.groups[space.group];
      if (groupInfo) {
        bgColor = groupInfo.color;
        accentColor = this.darkenColor(groupInfo.color, 20);
      }
    } else {
      // Colores para casillas especiales
      switch(space.type) {
        case 'START':
          bgColor = '#32CD32';
          accentColor = '#228B22';
          break;
        case 'JAIL':
          bgColor = '#FF6347';
          accentColor = '#DC143C';
          break;
        case 'FREE_PARKING':
          bgColor = '#9370DB';
          accentColor = '#8B008B';
          break;
        case 'GO_TO_JAIL':
          bgColor = '#FF0000';
          accentColor = '#B22222';
          break;
        case 'TAX':
          bgColor = '#FFD700';
          accentColor = '#FFA500';
          break;
        case 'RAILROAD':
          bgColor = '#2F2F2F';
          accentColor = '#000000';
          break;
        case 'UTILITY':
          bgColor = '#00CED1';
          accentColor = '#008B8B';
          break;
        case 'COMMUNITY_CHEST':
          bgColor = '#87CEEB';
          accentColor = '#4682B4';
          break;
        case 'CHANCE':
          bgColor = '#FF8C00';
          accentColor = '#FF6347';
          break;
      }
    }
    
    // Dibujar sombra de la casilla
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    // Fondo de la casilla con gradiente
    const gradient = this.ctx.createLinearGradient(
      pos.x, pos.y, pos.x + pos.width, pos.y + pos.height
    );
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, accentColor);
    
    this.ctx.fillStyle = gradient;
    
    // Casillas con bordes redondeados
    this.drawRoundedRect(pos.x, pos.y, pos.width, pos.height, 5);
    
    // Resetear sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Borde de la casilla con efecto brillante
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Barra de color del grupo para propiedades
    if (space.type === 'PROPERTY' && space.group && !pos.isCorner) {
      this.ctx.fillStyle = accentColor;
      if (pos.width > pos.height) { // Casilla horizontal
        this.ctx.fillRect(pos.x + 2, pos.y + 2, pos.width - 4, 8);
      } else { // Casilla vertical
        this.ctx.fillRect(pos.x + 2, pos.y + 2, 8, pos.height - 4);
      }
    }
    
    // Texto del espacio
    this.drawSpaceText(space, pos);
    
    // Dibujar icono según el tipo
    this.drawSpaceIcon(space, pos);

  // Indicador de propiedad comprada (dueño)
  this.drawOwnershipBadge(space, pos);
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawSpaceIcon(space, pos) {
    const iconSize = Math.max(12, Math.min(pos.width, pos.height) / 4);
    const iconX = pos.x + pos.width - iconSize - 3;
    const iconY = pos.y + 3;
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    let icon = '';
    switch(space.type) {
      case 'START': icon = '🏁'; break;
      case 'JAIL': icon = '🔒'; break;
      case 'FREE_PARKING': icon = '🅿️'; break;
      case 'GO_TO_JAIL': icon = '⚡'; break;
      case 'TAX': icon = '💸'; break;
      case 'RAILROAD': icon = '🚂'; break;
      case 'UTILITY': icon = '⚡'; break;
      case 'COMMUNITY_CHEST': icon = '📦'; break;
      case 'CHANCE': icon = '❓'; break;
      case 'PROPERTY': icon = '🏠'; break;
      default: icon = ''; break;
    }
    
    if (icon && !pos.isCorner) {
      this.ctx.fillText(icon, iconX + iconSize/2, iconY + iconSize/2);
    }
  }
  
  drawSpaceText(space, pos) {
    // Color del texto con mejor contraste
    let textColor = '#FFFFFF';
    if (space.type === 'PROPERTY' || space.type === 'TAX' || space.type === 'UTILITY' && space.group !== 'railroad') {
      textColor = '#000000';
    }
    
    this.ctx.fillStyle = textColor;
    this.ctx.strokeStyle = textColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
    this.ctx.lineWidth = 1;
    
    // Ajustar tamaño de fuente más grande para mejor visibilidad
    const baseFontSize = Math.max(10, this.boardSize / 60); // Aumentado de /80 a /60
    this.ctx.font = pos.isCorner ? `bold ${baseFontSize + 6}px Arial` : `bold ${baseFontSize + 2}px Arial`; // Aumentado
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Dividir el nombre en líneas si es muy largo
    const words = space.name.split(' ');
    let lines = [];
    
    if (pos.isCorner) {
      // Para las esquinas, usar el nombre completo con mejor formato
      lines = this.wrapText(space.name, pos.width - 20);
    } else {
      // Para espacios normales, abreviar si es necesario
      if (words.length > 1 && space.name.length > 15) {
        // Usar abreviaciones inteligentes
        lines = words.map(word => {
          if (word.length > 8) {
            return word.substring(0, 6) + '.';
          }
          return word;
        });
        if (lines.length > 2) {
          lines = [lines[0], lines.slice(1).join(' ')];
        }
      } else {
        lines = this.wrapText(space.name, pos.width - 12); // Reducido margen para más espacio
      }
    }
    
    const lineHeight = pos.isCorner ? baseFontSize + 8 : baseFontSize + 4; // Aumentado espaciado
    let startY = pos.y + pos.height/2 - ((lines.length - 1) * lineHeight / 2);
    
    // Ajustar posición si hay barra de color de grupo
    if (space.type === 'PROPERTY' && space.group && !pos.isCorner) {
      if (pos.width > pos.height) { // Casilla horizontal
        startY += 6; // Aumentado offset
      } else { // Casilla vertical
        // El texto ya está centrado correctamente
      }
    }
    
    // Dibujar texto con efecto de sombra más pronunciado para mejor legibilidad
    lines.forEach((line, i) => {
      const textX = pos.x + pos.width/2;
      const textY = startY + (i * lineHeight);
      
      // Sombra del texto más fuerte para mejor legibilidad
      if (textColor === '#FFFFFF') {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Sombra más fuerte
        this.ctx.fillText(line, textX + 1, textY + 1);
        this.ctx.fillText(line, textX + 2, textY + 2); // Doble sombra
      } else {
        // Contorno blanco para texto negro
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(line, textX, textY);
      }
      
      // Texto principal
      this.ctx.fillStyle = textColor;
      this.ctx.fillText(line, textX, textY);
    });
    
    // Mostrar precio si es una propiedad
    if (space.price && !pos.isCorner) {
      const priceText = `$${(space.price / 1000)}K`;
      const priceFontSize = Math.max(8, baseFontSize - 1); // Aumentado de -2 a -1
      
      this.ctx.font = `bold ${priceFontSize}px Arial`; // Agregado bold
      
      // Fondo semi-transparente para el precio
      const textMetrics = this.ctx.measureText(priceText);
      const priceWidth = textMetrics.width + 6; // Aumentado padding
      const priceHeight = priceFontSize + 4; // Aumentado padding
      const priceX = pos.x + pos.width - priceWidth - 2;
      const priceY = pos.y + pos.height - priceHeight - 2;
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Fondo más opaco
      this.ctx.fillRect(priceX, priceY, priceWidth, priceHeight);
      
      // Borde dorado del fondo
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(priceX, priceY, priceWidth, priceHeight);
      
      // Texto del precio en dorado con sombra
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        priceText,
        priceX + priceWidth/2 + 1,
        priceY + priceHeight/2 + 1
      );
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(
        priceText,
        priceX + priceWidth/2,
        priceY + priceHeight/2 + 1
      );
      
      // Resetear align
      this.ctx.textAlign = 'center';
    }
  }

  drawOwnershipBadge(space, pos) {
    // Mostrar solo para propiedades, ferrocarriles y servicios con dueño
    if (!space || pos.isCorner) return;
    const ownable = space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY';
    if (!ownable) return;
    if (space.owner === undefined || space.owner === null) return;

    // Buscar jugador por ID para obtener color e inicial
    const owner = Array.isArray(this.players) ? this.players.find(p => p.id === space.owner) : null;
    const color = owner?.color || '#FFD700';
    const initial = owner?.name ? owner.name.charAt(0).toUpperCase() : '';

    // Posición: esquina inferior izquierda de la casilla
    const base = Math.min(pos.width, pos.height);
    const radius = Math.max(6, base * 0.18);
    const cx = pos.x + 6 + radius;
    const cy = pos.y + pos.height - 6 - radius;

    // Sombra ligera
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Círculo con color del dueño
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Borde dorado
    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = Math.max(1.5, radius * 0.18);
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.stroke();

    // Inicial del jugador (si hay espacio suficiente)
    if (initial) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      this.ctx.lineWidth = Math.max(1, radius * 0.15);
      this.ctx.font = `bold ${Math.max(8, radius * 1.1)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.strokeText(initial, cx, cy);
      this.ctx.fillText(initial, cx, cy);
    }

    this.ctx.restore();
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    
    return lines;
  }
  
  drawCenter() {
    const centerX = this.offsetX + this.boardSize / 2;
    const centerY = this.offsetY + this.boardSize / 2;
    
    // Tamaño de fuente proporcional al tablero
    const baseFontSize = Math.max(16, this.boardSize / 25);
    
    // Logo del juego
    this.ctx.fillStyle = '#003D82';
    this.ctx.font = `bold ${baseFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('BANKROLL', centerX, centerY - baseFontSize/2);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${baseFontSize * 0.75}px Arial`;
    this.ctx.fillText('ARG', centerX, centerY + baseFontSize/3);
    
    // Bandera argentina pequeña - proporcional
    const flagWidth = this.boardSize * 0.12;
    const flagHeight = this.boardSize * 0.08;
    this.drawArgentinianFlag(centerX - flagWidth/2, centerY + baseFontSize, flagWidth, flagHeight);
  }
  
  drawArgentinianFlag(x, y, width, height) {
    // Celeste
    this.ctx.fillStyle = '#007BC7';
    this.ctx.fillRect(x, y, width, height/3);
    this.ctx.fillRect(x, y + (2*height/3), width, height/3);
    
    // Blanco
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(x, y + height/3, width, height/3);
    
    // Sol (simplificado) - tamaño proporcional
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    const sunRadius = Math.max(4, height/5);
    this.ctx.arc(x + width/2, y + height/2, sunRadius, 0, 2 * Math.PI);
    this.ctx.fill();
  }
  
  getSpacePosition(spaceIndex) {
    return this.spacePositions[spaceIndex];
  }
  
  getSpace(spaceIndex) {
    return this.spaces[spaceIndex];
  }

  // Función auxiliar para oscurecer colores
  darkenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}
