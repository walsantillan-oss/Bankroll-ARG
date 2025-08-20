import { boardSpaces, propertyGroups } from './spaces.js';

// Paleta y helpers para estilo moderno
const PALETTE = {
  bgStart: '#0E1320',
  bgEnd: '#161C2A',
  frame: 'rgba(255,255,255,0.08)',
  spaceCard: '#FBFBFD',
  border: 'rgba(10, 13, 17, 0.18)',
  shadow: 'rgba(0, 0, 0, 0.20)',
  textDark: '#14171F',
  textLight: '#FFFFFF',
  priceBg: 'rgba(20,23,31,0.65)',
  priceText: '#FFFFFF',
  accentGold: '#F5C451'
};

export class Board {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.spaces = boardSpaces;
    this.groups = propertyGroups;
    this.players = [];

    const canvasSize = Math.min(canvas.width, canvas.height);
    this.boardSize = canvasSize * 0.90;
    this.spaceWidth = this.boardSize * 0.125;
    this.spaceHeight = this.boardSize * 0.095;
    this.cornerSize = this.boardSize * 0.125;

    this.offsetX = (canvas.width - this.boardSize) / 2;
    this.offsetY = (canvas.height - this.boardSize) / 2;

    this.calculateSpacePositions();
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
    this.drawCenter();
  }

  drawBoard() {
    const bg = this.ctx.createLinearGradient(
      this.offsetX, this.offsetY, this.offsetX + this.boardSize, this.offsetY + this.boardSize
    );
    bg.addColorStop(0, PALETTE.bgStart);
    bg.addColorStop(1, PALETTE.bgEnd);
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize);

    this.ctx.strokeStyle = PALETTE.frame;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(this.offsetX + 2, this.offsetY + 2, this.boardSize - 4, this.boardSize - 4);

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

  drawSpaces() {
    this.spaces.forEach((space, index) => {
      this.drawSpace(space, index);
    });
  }

  drawSpace(space, index) {
    const pos = this.spacePositions[index];
    if (!pos) return;

    let bgColor = PALETTE.spaceCard;
    let accentColor = '#D5DBE7';

    if (space.type === 'PROPERTY' && space.group) {
      const groupInfo = this.groups[space.group];
      if (groupInfo) {
        bgColor = groupInfo.color;
        accentColor = this.darkenColor(groupInfo.color, 20);
      }
    } else {
      switch(space.type) {
        case 'START': bgColor = '#32CD32'; accentColor = '#228B22'; break;
        case 'JAIL': bgColor = '#FF6347'; accentColor = '#DC143C'; break;
        case 'FREE_PARKING': bgColor = '#9370DB'; accentColor = '#8B008B'; break;
        case 'GO_TO_JAIL': bgColor = '#FF0000'; accentColor = '#B22222'; break;
        case 'TAX': bgColor = '#FFD700'; accentColor = '#FFA500'; break;
        case 'RAILROAD': bgColor = '#2F2F2F'; accentColor = '#000000'; break;
        case 'UTILITY': bgColor = '#00CED1'; accentColor = '#008B8B'; break;
        case 'COMMUNITY_CHEST': bgColor = '#87CEEB'; accentColor = '#4682B4'; break;
        case 'CHANCE': bgColor = '#FF8C00'; accentColor = '#FF6347'; break;
      }
    }

    this.ctx.shadowColor = PALETTE.shadow;
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 3;

    const gradient = this.ctx.createLinearGradient(
      pos.x, pos.y, pos.x + pos.width, pos.y + pos.height
    );
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, accentColor);
    this.ctx.fillStyle = gradient;

    this.drawRoundedRect(pos.x, pos.y, pos.width, pos.height, 5);

    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.strokeStyle = PALETTE.border;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (space.type === 'PROPERTY' && space.group && !pos.isCorner) {
      this.ctx.fillStyle = accentColor;
      const barThickness = Math.max(10, Math.min(pos.width, pos.height) * 0.14);
      if (pos.width > pos.height) {
        this.roundedRect(pos.x + 3, pos.y + 3, pos.width - 6, barThickness, 4);
      } else {
        this.roundedRect(pos.x + 3, pos.y + 3, barThickness, pos.height - 6, 4);
      }
      this.ctx.fill();
    }

    this.drawSpaceText(space, pos);
    this.drawSpaceIcon(space, pos);
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
    const iconSize = Math.max(12, Math.min(pos.width, pos.height) / 4.5);
    const iconX = pos.x + pos.width - iconSize - 6;
    const iconY = pos.y + 6;

    this.ctx.fillStyle = 'rgba(20,23,31,0.9)';
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
      case 'DESTINY': icon = null; break;
      case 'PROPERTY': icon = '🏠'; break;
      default: icon = ''; break;
    }

    if (space.type === 'DESTINY' && !pos.isCorner) {
      // Dibujar una tarjetita con signo de pregunta
      const cardW = iconSize * 1.2;
      const cardH = iconSize * 1.6;
      const cx = iconX + iconSize/2; // anclaje similar al icono
      const cy = iconY + iconSize/2;

      // Fondo de tarjeta
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0,0,0,0.25)';
      this.ctx.shadowBlur = 3;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      this.roundedRect(cx - cardW/2, cy - cardH/2, cardW, cardH, Math.min(6, cardW*0.15));
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
      this.ctx.shadowColor = 'transparent';
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.ctx.stroke();

      // Signo de pregunta
      this.ctx.fillStyle = '#222';
      this.ctx.font = `bold ${Math.floor(iconSize * 0.9)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('?', cx, cy - 2);
      this.ctx.restore();
      return;
    }

    if (icon && !pos.isCorner) {
      this.ctx.fillText(icon, iconX + iconSize/2, iconY + iconSize/2);
    }
  }

  drawSpaceText(space, pos) {
    let textColor = PALETTE.textDark;
    if (pos.isCorner) textColor = PALETTE.textLight;

    this.ctx.fillStyle = textColor;
    this.ctx.lineWidth = 1;

    const baseFontSize = Math.max(10, this.boardSize / 60);
    this.ctx.font = pos.isCorner ? `600 ${baseFontSize + 6}px Arial` : `600 ${baseFontSize + 2}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const words = space.name.split(' ');
    let lines = [];

    if (pos.isCorner) {
      lines = this.wrapText(space.name, pos.width - 20);
    } else {
      if (words.length > 1 && space.name.length > 15) {
        lines = words.map(word => word.length > 8 ? word.substring(0, 6) + '.' : word);
        if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
      } else {
        lines = this.wrapText(space.name, pos.width - 12);
      }
    }

    const lineHeight = pos.isCorner ? baseFontSize + 8 : baseFontSize + 4;
    let startY = pos.y + pos.height/2 - ((lines.length - 1) * lineHeight / 2);

    if (space.type === 'PROPERTY' && space.group && !pos.isCorner) {
      if (pos.width > pos.height) startY += 6;
    }

    lines.forEach((line, i) => {
      const textX = pos.x + pos.width/2;
      const textY = startY + (i * lineHeight);

      if (textColor === PALETTE.textLight) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText(line, textX + 1, textY + 1);
        this.ctx.fillText(line, textX + 2, textY + 2);
      } else {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        this.ctx.fillText(line, textX, textY + 1);
      }

      this.ctx.fillStyle = textColor;
      this.ctx.fillText(line, textX, textY);
    });

    if (space.price && !pos.isCorner) {
      const priceText = `$${(space.price / 1000)}K`;
      const priceFontSize = Math.max(9, baseFontSize - 1);
      this.ctx.font = `700 ${priceFontSize}px Arial`;

      const textMetrics = this.ctx.measureText(priceText);
      const paddingX = 6;
      const paddingY = 3;
      const priceWidth = Math.ceil(textMetrics.width) + paddingX * 2;
      const priceHeight = priceFontSize + paddingY * 2;
      const priceX = pos.x + pos.width - priceWidth - 6;
      const priceY = pos.y + pos.height - priceHeight - 6;

      this.ctx.fillStyle = PALETTE.priceBg;
      this.roundedRect(priceX, priceY, priceWidth, priceHeight, Math.min(10, priceHeight/2));
      this.ctx.fill();

      this.ctx.fillStyle = PALETTE.priceText;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(priceText, priceX + priceWidth/2, priceY + priceHeight/2 + 1);
    }
  }

  drawOwnershipBadge(space, pos) {
    if (!space || pos.isCorner) return;
    const ownable = space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY';
    if (!ownable) return;
    if (space.owner === undefined || space.owner === null) return;

    const owner = Array.isArray(this.players) ? this.players.find(p => p.id === space.owner) : null;
    const color = owner?.color || '#FFD700';
    const initial = owner?.name ? owner.name.charAt(0).toUpperCase() : '';

    const base = Math.min(pos.width, pos.height);
    const radius = Math.max(6, base * 0.18);
    const cx = pos.x + 6 + radius;
    const cy = pos.y + pos.height - 6 - radius;

    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = Math.max(1.5, radius * 0.18);
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.stroke();

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

    const baseFontSize = Math.max(16, this.boardSize / 25);

    this.ctx.fillStyle = '#003D82';
    this.ctx.font = `bold ${baseFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('BANKROLL', centerX, centerY - baseFontSize/2);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${baseFontSize * 0.75}px Arial`;
    this.ctx.fillText('ARG', centerX, centerY + baseFontSize/3);

    const flagWidth = this.boardSize * 0.12;
    const flagHeight = this.boardSize * 0.08;
    this.drawArgentinianFlag(centerX - flagWidth/2, centerY + baseFontSize, flagWidth, flagHeight);
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
