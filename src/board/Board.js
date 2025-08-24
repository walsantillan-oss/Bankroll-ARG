import { boardSpaces, propertyGroups } from './spaces.js';

// Paleta inspirada en Monopoly clásico
const PALETTE = {
  bgStart: '#F5F5DC',    // Beige claro como el tablero original
  bgEnd: '#FFFAF0',      // Blanco hueso
  frame: '#8B4513',      // Marrón para el borde
  spaceCard: '#FFFFFF',  // Blanco puro para las casillas
  border: '#000000',     // Negro para bordes
  shadow: 'rgba(0, 0, 0, 0.3)',
  textDark: '#000000',   // Negro para texto
  textLight: '#FFFFFF',
  priceBg: 'rgba(0,0,0,0.8)',
  priceText: '#FFFFFF',
  accentGold: '#FFD700', // Dorado clásico
  monopolyRed: '#DC143C' // Rojo Monopoly
};

export class Board {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.spaces = boardSpaces;
    this.groups = propertyGroups;
    this.players = [];

    // Imagen de fondo del centro del tablero
    this.backgroundImage = null;
    this.loadBackgroundImage();

    // Usar toda la pantalla disponible para el tablero
    const canvasSize = Math.min(canvas.width, canvas.height);
    this.boardSize = canvasSize * 0.95; // Usar más espacio de la pantalla
    this.spaceWidth = this.boardSize * 0.125;
    this.spaceHeight = this.boardSize * 0.095;
    this.cornerSize = this.boardSize * 0.125;

    this.offsetX = (canvas.width - this.boardSize) / 2;
    this.offsetY = (canvas.height - this.boardSize) / 2;

    this.calculateSpacePositions();
  }

  loadBackgroundImage() {
    this.backgroundImage = new Image();
    this.backgroundImage.onload = () => {
      // Redibujar el tablero cuando la imagen se cargue
      this.draw();
    };
    // Intentar cargar la nueva imagen, si falla usará el texto por defecto
    this.backgroundImage.onerror = () => {
      console.log('No se pudo cargar la imagen de fondo, usando texto por defecto');
      this.backgroundImage = null;
    };
    this.backgroundImage.src = '/backgrounds/fondo-tablero.webp'; // Archivo WebP
  }

  setPlayers(players) {
    this.players = players || [];
  }

  calculateSpacePositions() {
    const positions = [];
    const spacesPerSide = 7;

    for (let i = 0; i < spacesPerSide; i++) {
      if (i === 0) {
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

    positions.push({
      x: this.offsetX,
      y: this.offsetY + this.boardSize - this.cornerSize,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });

    for (let i = 1; i < spacesPerSide; i++) {
      positions.push({
        x: this.offsetX,
        y: this.offsetY + this.boardSize - this.cornerSize - (i * this.spaceWidth),
        width: this.spaceHeight,
        height: this.spaceWidth,
        isCorner: false
      });
    }

    positions.push({
      x: this.offsetX,
      y: this.offsetY,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });

    for (let i = 1; i < spacesPerSide; i++) {
      positions.push({
        x: this.offsetX + (i * this.spaceWidth),
        y: this.offsetY,
        width: this.spaceWidth,
        height: this.spaceHeight,
        isCorner: false
      });
    }

    positions.push({
      x: this.offsetX + this.boardSize - this.cornerSize,
      y: this.offsetY,
      width: this.cornerSize,
      height: this.cornerSize,
      isCorner: true
    });

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
    this.drawCenter(); // Activar el centro estilo Monopoly
  }

  drawBoard() {
    // Fondo beige como el Monopoly clásico
    this.ctx.fillStyle = PALETTE.bgStart;
    this.ctx.fillRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize);

    // Borde marrón grueso como el tablero original
    this.ctx.strokeStyle = PALETTE.frame;
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize);

    // Borde interno negro
    this.ctx.strokeStyle = PALETTE.border;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.offsetX + 6, this.offsetY + 6, this.boardSize - 12, this.boardSize - 12);

    this.drawBoardCenter();
  }

  drawBoardCenter() {
    const centerSize = this.boardSize - (this.spaceHeight * 2);
    const centerX = this.offsetX + this.spaceHeight;
    const centerY = this.offsetY + this.spaceHeight;

    const cg = this.ctx.createRadialGradient(
      centerX + centerSize/2, centerY + centerSize/2, centerSize * 0.1,
      centerX + centerSize/2, centerY + centerSize/2, centerSize * 0.8
    );
    cg.addColorStop(0, 'rgba(255,255,255,0.03)');
    cg.addColorStop(1, 'rgba(255,255,255,0.00)');
    this.ctx.fillStyle = cg;
    this.ctx.fillRect(centerX, centerY, centerSize, centerSize);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX, centerY, centerSize, centerSize);

    // Si hay imagen de fondo, usarla; si no, usar texto
    if (this.backgroundImage && this.backgroundImage.complete) {
      // Dibujar la imagen centrada y escalada proporcionalmente
      const imgAspect = this.backgroundImage.width / this.backgroundImage.height;
      const centerAspect = 1; // El centro es cuadrado
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > centerAspect) {
        // Imagen más ancha - ajustar por altura
        drawHeight = centerSize * 0.8; // Dejar margen
        drawWidth = drawHeight * imgAspect;
      } else {
        // Imagen más alta - ajustar por ancho
        drawWidth = centerSize * 0.8; // Dejar margen
        drawHeight = drawWidth / imgAspect;
      }
      
      drawX = centerX + (centerSize - drawWidth) / 2;
      drawY = centerY + (centerSize - drawHeight) / 2;
      
      this.ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Texto por defecto si no hay imagen
      this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const titleSize = Math.max(20, this.boardSize/26);
      const subtitleSize = Math.max(12, this.boardSize/40);

      this.ctx.font = `600 ${titleSize}px Arial`;
      this.ctx.fillText('BANKROLL', centerX + centerSize/2, centerY + centerSize/2 - subtitleSize*0.8);
      this.ctx.fillStyle = 'rgba(245,196,81,0.9)';
      this.ctx.font = `600 ${subtitleSize}px Arial`;
      this.ctx.fillText('ARGENTINA', centerX + centerSize/2, centerY + centerSize/2 + subtitleSize*0.8);
    }
  }

  drawSpaces() {
    this.spaces.forEach((space, index) => {
      this.drawSpace(space, index);
    });
  }

  drawSpace(space, index) {
    const pos = this.spacePositions[index];
    if (!pos) return;

    // Fondo blanco por defecto como en Monopoly clásico
    let bgColor = '#FFFFFF';
    let propertyColor = null;

    // Verificar si la propiedad tiene dueño
    const hasOwner = space.owner !== undefined && space.owner !== null;
    const owner = hasOwner && Array.isArray(this.players) ? this.players.find(p => p.id === space.owner) : null;
    
    // Colores de propiedades específicos por grupo (estilo Monopoly clásico)
    if (space.type === 'PROPERTY' && space.group) {
      const groupInfo = this.groups[space.group];
      if (groupInfo) {
        propertyColor = groupInfo.color;
      }
    } else {
      // Colores especiales para casillas especiales
      switch(space.type) {
        case 'START': bgColor = '#32CD32'; break;
        case 'JAIL': bgColor = '#FFA500'; break;
        case 'FREE_PARKING': bgColor = '#FF69B4'; break;
        case 'GO_TO_JAIL': bgColor = '#DC143C'; break;
        case 'TAX': bgColor = '#FFD700'; break;
        case 'RAILROAD': bgColor = '#2F2F2F'; break;
        case 'UTILITY': bgColor = '#87CEEB'; break;
        case 'COMMUNITY_CHEST': bgColor = '#87CEEB'; break;
        case 'CHANCE': bgColor = '#FF8C00'; break;
      }
    }

    // Dibujar fondo blanco de la casilla
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

    // Borde negro grueso como Monopoly
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

    // Si es propiedad, dibujar banda de color en la parte superior
    if (propertyColor && space.type === 'PROPERTY') {
      const colorBandHeight = pos.height * 0.25;
      this.ctx.fillStyle = propertyColor;
      this.ctx.fillRect(pos.x + 1, pos.y + 1, pos.width - 2, colorBandHeight);
      
      // Borde de la banda de color
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(pos.x + 1, pos.y + 1, pos.width - 2, colorBandHeight);
    }
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Si la propiedad tiene dueño, agregar resaltado del color del jugador
    if (hasOwner && owner && (space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY')) {
      const ownerColor = owner.color;
      
      // Borde grueso del color del jugador
      this.ctx.strokeStyle = ownerColor;
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(pos.x + 2, pos.y + 2, pos.width - 4, pos.height - 4);
      
      // Overlay semi-transparente del color del jugador
      this.ctx.save();
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillStyle = ownerColor;
      this.ctx.fillRect(pos.x + 2, pos.y + 2, pos.width - 4, pos.height - 4);
      this.ctx.restore();
      
      // Indicador de propiedad en la esquina superior derecha
      const flagSize = 12;
      const flagX = pos.x + pos.width - flagSize - 2;
      const flagY = pos.y + 2;
      
      // Triángulo bandera
      this.ctx.fillStyle = ownerColor;
      this.ctx.beginPath();
      this.ctx.moveTo(flagX, flagY);
      this.ctx.lineTo(flagX + flagSize, flagY + flagSize/2);
      this.ctx.lineTo(flagX, flagY + flagSize);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Borde negro de la bandera
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Asta de la bandera
      this.ctx.strokeStyle = '#654321';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(flagX, flagY);
      this.ctx.lineTo(flagX, flagY + flagSize + 2);
      this.ctx.stroke();
    }

    this.drawSpaceText(space, pos);
    this.drawSpaceIcon(space, pos);
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
    if (pos.isCorner) return; // Las esquinas no necesitan iconos

    const iconSize = Math.max(12, Math.min(pos.width, pos.height) / 4);
    const iconX = pos.x + pos.width - iconSize - 4;
    const iconY = pos.y + 4;

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    let icon = '';
    switch(space.type) {
      case 'RAILROAD': icon = '🚂'; break;
      case 'UTILITY': icon = '⚡'; break;
      case 'COMMUNITY_CHEST': icon = '📦'; break;
      case 'CHANCE': icon = '❓'; break;
      case 'TAX': icon = '💰'; break;
      default: icon = ''; break;
    }

    if (icon) {
      this.ctx.fillText(icon, iconX + iconSize/2, iconY);
    }
  }

  drawSpaceText(space, pos) {
    this.ctx.fillStyle = '#000000';
    
    const baseFontSize = Math.max(8, this.boardSize / 70);
    
    if (pos.isCorner) {
      // Esquinas con texto más grande
      this.ctx.font = `bold ${baseFontSize + 4}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const lines = this.wrapText(space.name, pos.width - 20);
      const lineHeight = baseFontSize + 6;
      const startY = pos.y + pos.height/2 - ((lines.length - 1) * lineHeight / 2);
      
      lines.forEach((line, i) => {
        this.ctx.fillText(line, pos.x + pos.width/2, startY + (i * lineHeight));
      });
    } else {
      // Casillas normales con texto más pequeño
      this.ctx.font = `${baseFontSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const maxWidth = pos.width - 10;
      const lines = this.wrapText(space.name, maxWidth);
      const lineHeight = baseFontSize + 2;
      
      // Ajustar posición Y si hay banda de color (propiedades)
      let textY = pos.y + pos.height/2;
      if (space.type === 'PROPERTY' && space.group) {
        textY = pos.y + (pos.height * 0.25) + (pos.height * 0.75) / 2;
      }
      
      const startY = textY - ((lines.length - 1) * lineHeight / 2);
      
      lines.forEach((line, i) => {
        this.ctx.fillText(line, pos.x + pos.width/2, startY + (i * lineHeight));
      });
      
      // Dibujar precio para propiedades
      if (space.price && (space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY')) {
        this.ctx.font = `${baseFontSize - 1}px Arial`;
        const priceText = `$${space.price.toLocaleString()}`;
        this.ctx.fillText(priceText, pos.x + pos.width/2, pos.y + pos.height - 8);
      }
    }
  }

  drawOwnershipBadge(space, pos) {
    if (!space || pos.isCorner) return;
    const ownable = space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY';
    if (!ownable) return;
    if (space.owner === undefined || space.owner === null) return;

    const owner = Array.isArray(this.players) ? this.players.find(p => p.id === space.owner) : null;
    const color = owner?.color || '#FFD700';

    const base = Math.min(pos.width, pos.height);
    const radius = Math.max(4, base * 0.12); // Hacer el badge más pequeño
    const cx = pos.x + pos.width - 6 - radius; // Mover a la esquina superior derecha
    const cy = pos.y + 6 + radius;

    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Dibujar un pequeño círculo sólido del color del jugador
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = Math.max(1, radius * 0.15);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.stroke();

    // Ya no dibujamos inicial - el color del casillero es suficiente indicador
    
    // Agregar casita para propiedades
    if (space.type === 'PROPERTY') {
      this.drawPropertyHouse(space, pos);
    }

    this.ctx.restore();
  }

  drawPropertyHouse(space, pos) {
    // Crear imagen de casita si no existe
    if (!this.casitaImage) {
      this.casitaImage = new Image();
      this.casitaImage.src = '/icons/casita.webp';
    }

    // Solo dibujar si la imagen está cargada
    if (this.casitaImage.complete && this.casitaImage.naturalWidth > 0) {
      const base = Math.min(pos.width, pos.height);
      const houseSize = Math.max(12, base * 0.25);
      
      // Posición en esquina superior derecha
      const houseX = pos.x + pos.width - houseSize - 4;
      const houseY = pos.y + 4;
      
      // Sombra para la casita
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      this.ctx.shadowBlur = 3;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      // Dibujar la casita
      this.ctx.drawImage(
        this.casitaImage,
        houseX,
        houseY,
        houseSize,
        houseSize
      );
      
      this.ctx.restore();
    }
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
    const centerSize = this.boardSize * 0.35;
    
    // Fondo blanco del centro como en Monopoly
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(centerX - centerSize/2, centerY - centerSize/2, centerSize, centerSize);
    
    // Borde negro
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(centerX - centerSize/2, centerY - centerSize/2, centerSize, centerSize);
    
    // Logo estilo Monopoly
    this.drawMonopolyStyleLogo(centerX, centerY, centerSize);
  }

  drawMonopolyStyleLogo(centerX, centerY, size) {
    const ctx = this.ctx;
    
    // Fondo rojo característico del logo Monopoly
    const logoWidth = size * 0.8;
    const logoHeight = size * 0.25;
    const logoY = centerY - size * 0.1;
    
    ctx.fillStyle = PALETTE.monopolyRed;
    this.roundedRect(centerX - logoWidth/2, logoY - logoHeight/2, logoWidth, logoHeight, 8);
    ctx.fill();
    
    // Borde dorado
    ctx.strokeStyle = PALETTE.accentGold;
    ctx.lineWidth = 2;
    this.roundedRect(centerX - logoWidth/2, logoY - logoHeight/2, logoWidth, logoHeight, 8);
    ctx.stroke();
    
    // Texto BANKROLL en estilo Monopoly
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.08}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BANKROLL', centerX, logoY);
    
    // Subtítulo ARG
    ctx.fillStyle = PALETTE.textDark;
    ctx.font = `bold ${size * 0.05}px Arial`;
    ctx.fillText('ARGENTINA', centerX, logoY + size * 0.08);
    
    // Símbolo del peso argentino
    const symbolSize = size * 0.15;
    const symbolY = centerY + size * 0.15;
    
    // Círculo dorado para el símbolo
    ctx.fillStyle = PALETTE.accentGold;
    ctx.beginPath();
    ctx.arc(centerX, symbolY, symbolSize, 0, 2 * Math.PI);
    ctx.fill();
    
    // Borde del círculo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Símbolo $
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${symbolSize * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', centerX, symbolY);
  }

  drawArgentinianFlag(x, y, width, height) {
    this.ctx.fillStyle = '#1992D4';
    this.ctx.fillRect(x, y, width, height/3);
    this.ctx.fillRect(x, y + (2*height/3), width, height/3);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(x, y + height/3, width, height/3);

    this.ctx.fillStyle = PALETTE.accentGold;
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

  darkenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
  }

  // Rectángulo redondeado sin trazar automáticamente (solo path)
  roundedRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
  }
}
