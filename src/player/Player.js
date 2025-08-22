export class Player {
  constructor(id, name, color, startingMoney = 1500000, avatarEmoji = null, tokenShape = 'circle') {
    this.id = id;
    this.name = name;
    this.color = color;
    this.money = startingMoney;
    this.avatarEmoji = avatarEmoji;
    this.tokenShape = tokenShape; // 'circle' | 'diamond' | 'star' | 'triangle' | 'hex'
    this.position = 0; // Comienza en la casilla 0 (LARGADA)
    this.properties = [];
    this.railroads = [];
    this.utilities = [];
    this.propertyImprovements = {}; // Almacena mejoras por ID de propiedad {propertyId: improvements}
    this.monopolies = []; // Almacena los grupos de color que tiene monopolio
    this.isInJail = false;
    this.jailTurns = 0;
    this.getOutOfJailFreeCards = 0;
    this.bankrupt = false;
    
    // Para la animación en el tablero
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isMoving = false;
  }
  
  // Mover el jugador a una nueva posición
  moveTo(newPosition, board) {
    const oldPosition = this.position;
    this.position = newPosition;
    
    // Actualizar posición visual
    this.updateVisualPosition(board);
    
    // Verificar si pasó por LARGADA
    if (oldPosition > newPosition || (oldPosition < 28 && newPosition >= 28)) {
      this.collectSalary();
    }
    
    this.position = this.position % 28; // El tablero tiene 28 casilleros
  }
  
  // Mover el jugador una cantidad específica de espacios
  move(spaces, board) {
    const newPosition = (this.position + spaces) % 28;
    this.moveTo(newPosition, board);
  }
  
  // Actualizar la posición visual del jugador en el tablero
  updateVisualPosition(board) {
    const spacePos = board.getSpacePosition(this.position);
    if (spacePos) {
      // Offset para múltiples jugadores en la misma casilla, proporcional al tablero
      const baseOffset = Math.max(4, board.boardSize / 100);
      const offset = this.id * baseOffset;
      this.targetX = spacePos.x + spacePos.width/2 + offset - baseOffset;
      this.targetY = spacePos.y + spacePos.height/2 + offset - baseOffset;
    }
  }
  
  // Cobrar salario al pasar por LARGADA
  collectSalary() {
    const salary = 200000;
    this.money += salary;
    return salary;
  }
  
  // Pagar dinero
  pay(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      return true;
    } else {
      // No tiene suficiente dinero
      return false;
    }
  }
  
  // Recibir dinero
  receive(amount) {
    this.money += amount;
  }
  
  // Comprar una propiedad
  buyProperty(property, allSpaces) {
    if (this.money >= property.price) {
      this.money -= property.price;
      this.properties.push(property);
      property.owner = this.id;
      
      // Verificar monopolios después de comprar
      if (allSpaces) {
        this.checkForMonopoly(allSpaces);
      }
      
      return true;
    }
    return false;
  }
  
  // Comprar un ferrocarril
  buyRailroad(railroad) {
    if (this.money >= railroad.price) {
      this.money -= railroad.price;
      this.railroads.push(railroad);
      railroad.owner = this.id;
      return true;
    }
    return false;
  }
  
  // Comprar un servicio público
  buyUtility(utility) {
    if (this.money >= utility.price) {
      this.money -= utility.price;
      this.utilities.push(utility);
      utility.owner = this.id;
      return true;
    }
    return false;
  }
  
  // Verificar si posee todas las propiedades de un grupo
  ownsCompleteGroup(group, allProperties) {
    const groupProperties = allProperties.filter(prop => prop.group === group);
    const ownedInGroup = this.properties.filter(prop => prop.group === group);
    return groupProperties.length === ownedInGroup.length;
  }
  
  // Calcular la renta de una propiedad
  calculateRent(property, allProperties, diceRoll = 0) {
    if (property.type === 'PROPERTY') {
      // Usar el nuevo método que considera mejoras y monopolios
      return this.getPropertyRent(property);
    } else if (property.type === 'RAILROAD') {
      const railroadsOwned = this.railroads.length;
      return property.rent[railroadsOwned - 1] || 0;
    } else if (property.type === 'UTILITY') {
      const utilitiesOwned = this.utilities.length;
      const baseRent = property.baseRent || 50000;
      
      // Calcular multiplicador según cantidad de servicios
      let multiplier = 1; // Alquiler base (1 servicio)
      if (utilitiesOwned === 2) {
        multiplier = 1.25; // 25% más
      } else if (utilitiesOwned === 3) {
        multiplier = 1.40; // 40% más
      } else if (utilitiesOwned === 4) {
        multiplier = 1.60; // 60% más
      }
      
      return Math.floor(baseRent * multiplier);
    }
    
    return 0;
  }
  
  // Ir a la cárcel
  goToJail() {
    this.position = 5; // Posición de la cárcel
    this.isInJail = true;
    this.jailTurns = 0;
  }
  
  // Intentar salir de la cárcel
  tryToGetOutOfJail(diceRoll1, diceRoll2) {
    if (!this.isInJail) return true;
    
    this.jailTurns++;
    
    // Salir con dobles
    if (diceRoll1 === diceRoll2) {
      this.isInJail = false;
      this.jailTurns = 0;
      return true;
    }
    
    // Después de 3 turnos, debe pagar
    if (this.jailTurns >= 3) {
      this.payToGetOutOfJail();
      return true;
    }
    
    return false;
  }
  
  // Pagar para salir de la cárcel
  payToGetOutOfJail() {
    const fine = 50000;
    if (this.pay(fine)) {
      this.isInJail = false;
      this.jailTurns = 0;
      return true;
    }
    return false;
  }
  
  // Usar carta para salir de la cárcel
  useGetOutOfJailFreeCard() {
    if (this.getOutOfJailFreeCards > 0) {
      this.getOutOfJailFreeCards--;
      this.isInJail = false;
      this.jailTurns = 0;
      return true;
    }
    return false;
  }
  
  // Verificar si el jugador está en bancarrota
  checkBankruptcy() {
    // TODO: Implementar lógica para calcular activos totales
    this.bankrupt = this.money <= 0 && this.properties.length === 0;
    return this.bankrupt;
  }
  
  // Obtener el patrimonio total del jugador
  getTotalWealth() {
    let total = this.money;
    
    // Sumar valor de propiedades
    this.properties.forEach(prop => {
      total += prop.price;
    });
    
    // Sumar valor de ferrocarriles
    this.railroads.forEach(railroad => {
      total += railroad.price;
    });
    
    // Sumar valor de servicios
    this.utilities.forEach(utility => {
      total += utility.price;
    });
    
    return total;
  }
  
  // Mapeo de tokenShape a imagen de ficha
  static getTokenImageFromShape(tokenShape) {
    const shapeMap = {
      'circle': 'amarilla',
      'diamond': 'azul', 
      'star': 'verde',
      'triangle': 'roja',
      'hex': 'violeta'
    };
    
    return shapeMap[tokenShape] || 'azul'; // Default a azul si no encuentra match
  }

  // DEPRECATED: Mapeo de colores a fichas (se mantiene por compatibilidad)
  static getTokenImageFromColor(color) {
    // Convertir color hex a nombre de ficha más cercano
    const colorMap = {
      '#FFD700': 'amarilla',  // Dorado -> Amarilla
      '#FFA500': 'amarilla',  // Naranja -> Amarilla
      '#FFFF00': 'amarilla',  // Amarillo -> Amarilla
      '#0000FF': 'azul',      // Azul -> Azul
      '#007BC7': 'azul',      // Azul claro -> Azul
      '#00BFFF': 'azul',      // Azul cielo -> Azul
      '#008000': 'verde',     // Verde -> Verde
      '#00FF00': 'verde',     // Verde lima -> Verde
      '#32CD32': 'verde',     // Verde lima -> Verde
      '#800080': 'violeta',   // Púrpura -> Violeta
      '#9400D3': 'violeta',   // Violeta -> Violeta
      '#FF00FF': 'violeta',   // Magenta -> Violeta
      '#FF0000': 'roja',      // Rojo -> Roja
      '#DC143C': 'roja',      // Carmesí -> Roja
      '#B22222': 'roja',      // Ladrillo -> Roja
    };
    
    return colorMap[color] || 'azul'; // Default a azul si no encuentra match
  }

  // Dibujar el jugador en el tablero
  draw(ctx, board) {
    // Interpolación suave mejorada para la animación
    if (this.isMoving) {
      // Usar easing para una animación más fluida
      const speed = 0.12; // Velocidad más lenta para suavidad
      const distanceX = this.targetX - this.x;
      const distanceY = this.targetY - this.y;
      
      // Easing out cubic para desaceleración natural
      const progress = 1 - Math.pow(1 - speed, 3);
      
      this.x += distanceX * progress;
      this.y += distanceY * progress;
      
      // Umbral más pequeño para mayor precisión
      if (Math.abs(this.targetX - this.x) < 0.5 && Math.abs(this.targetY - this.y) < 0.5) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
      }
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }
    
    // Tamaño del token proporcional al tablero (más grande)
    const tokenRadius = board ? Math.max(12, board.boardSize / 50) : 15;
    const tokenSize = tokenRadius * 2;
    const centerX = this.x + tokenRadius;
    const centerY = this.y + tokenRadius;
    
    // Sombra principal más realista
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = tokenRadius * 0.8;
    ctx.shadowOffsetX = tokenRadius * 0.3;
    ctx.shadowOffsetY = tokenRadius * 0.3;
    
    // Obtener imagen de ficha según el tokenShape del jugador
    const fichaColor = Player.getTokenImageFromShape(this.tokenShape);
    const fichaPath = `/fichas/ficha-${fichaColor}.webp`;
    
    // Crear imagen si no existe
    if (!this.tokenImage || this.tokenImage.src !== fichaPath) {
      this.tokenImage = new Image();
      this.tokenImage.src = fichaPath;
    }
    
    // Dibujar la ficha si la imagen está cargada
    if (this.tokenImage.complete && this.tokenImage.naturalWidth > 0) {
      // Dibujar imagen de ficha centrada
      ctx.drawImage(
        this.tokenImage, 
        this.x, 
        this.y, 
        tokenSize, 
        tokenSize
      );
    } else {
      // Fallback: dibujar forma básica mientras carga la imagen
      const gradient3D = ctx.createRadialGradient(
        centerX - tokenRadius * 0.3, centerY - tokenRadius * 0.3, 0,
        centerX, centerY, tokenRadius * 1.2
      );
      
      const baseColor = this.color;
      const lightColor = this.lightenColor(baseColor, 0.4);
      const darkColor = this.darkenColor(baseColor, 0.3);
      const deepShadow = this.darkenColor(baseColor, 0.6);
      
      gradient3D.addColorStop(0, lightColor);
      gradient3D.addColorStop(0.3, baseColor);
      gradient3D.addColorStop(0.7, darkColor);
      gradient3D.addColorStop(1, deepShadow);
      
      ctx.fillStyle = gradient3D;
      ctx.beginPath();
      ctx.arc(centerX, centerY, tokenRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Resetear sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Borde metálico opcional (más sutil para no competir con la imagen)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; // Dorado semitransparente
    ctx.lineWidth = Math.max(1, tokenRadius / 8);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, tokenRadius * 0.95, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Indicador de cárcel mejorado
    if (this.isInJail) {
      const lockX = centerX + tokenRadius * 0.6;
      const lockY = centerY - tokenRadius * 0.6;
      const lockSize = tokenRadius * 0.5;
      
      // Fondo del indicador de cárcel
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.beginPath();
      ctx.arc(lockX, lockY, lockSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Borde blanco
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icono de candado
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(8, lockSize * 1.2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', lockX, lockY);
    }
    
    ctx.restore();
  }

  // Función auxiliar para oscurecer colores
  darkenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Función auxiliar para aclarar colores
  lightenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  // Obtener información del jugador para la UI
  getInfo() {
    return {
      name: this.name,
    color: this.color,
    avatarEmoji: this.avatarEmoji,
    tokenShape: this.tokenShape,
  avatarEmoji: this.avatarEmoji,
  tokenShape: this.tokenShape,
      money: this.money,
      position: this.position,
      properties: this.properties.length,
      railroads: this.railroads.length,
      utilities: this.utilities.length,
      propertiesList: this.properties.map(p => ({ 
        name: p.name, 
        color: p.color, 
        type: p.type,
        improvements: this.propertyImprovements[p.id] || 0,
        hasMonopoly: this.monopolies.includes(p.group)
      })),
      railroadsList: this.railroads.map(r => ({ name: r.name, type: r.type })),
      utilitiesList: this.utilities.map(u => ({ name: u.name, type: u.type })),
      isInJail: this.isInJail,
      jailTurns: this.jailTurns,
      bankrupt: this.bankrupt,
      totalWealth: this.getTotalWealth(),
      monopolies: this.monopolies
    };
  }

  // Verificar si el jugador tiene monopolio de un grupo de color
  checkForMonopoly(allSpaces) {
    this.monopolies = []; // Resetear monopolios
    
    // Agrupar propiedades por grupo de color
    const propertyGroups = {};
    
    // Obtener todas las propiedades del tablero agrupadas por color
    allSpaces.filter(space => space.type === 'PROPERTY').forEach(space => {
      if (!propertyGroups[space.group]) {
        propertyGroups[space.group] = [];
      }
      propertyGroups[space.group].push(space);
    });
    
    // Verificar cada grupo de color
    Object.keys(propertyGroups).forEach(group => {
      const propertiesInGroup = propertyGroups[group];
      const ownedInGroup = this.properties.filter(prop => prop.group === group);
      
      // Si posee todas las propiedades del grupo, tiene monopolio
      if (ownedInGroup.length === propertiesInGroup.length) {
        this.monopolies.push(group);
      }
    });
    
    return this.monopolies;
  }

  // Mejorar una propiedad (niveles 1→2→3). Máximo 2 mejoras (nivel 3).
  improveProperty(propertyId, improvementCost) {
    if (!this.propertyImprovements[propertyId]) {
      this.propertyImprovements[propertyId] = 0;
    }
    
    // Máximo 2 mejoras por propiedad (para llegar a nivel 3)
    if (this.propertyImprovements[propertyId] >= 2) {
      return false;
    }
    
    if (this.money >= improvementCost) {
      this.money -= improvementCost;
      this.propertyImprovements[propertyId]++;
      return true;
    }
    
    return false;
  }

  // Obtener el alquiler de una propiedad según niveles (1, 2=x2, 3=x4)
  getPropertyRent(property) {
    const improvements = this.propertyImprovements[property.id] || 0; // 0..2 (nivel = improvements+1)
    const base = (Array.isArray(property.rent) && property.rent.length > 0)
      ? property.rent[0]
      : (property.baseRent || 0);

    // Escala por niveles: 1x, 2x, 4x
    const multipliers = [1, 2, 4];
    const idx = Math.max(0, Math.min(2, improvements));
    return Math.floor(base * multipliers[idx]);
  }

  // Obtener el costo de mejora para una propiedad
  getImprovementCost(property) {
    // El costo de mejora es aproximadamente el 50% del precio base de la propiedad
    return Math.floor(property.price * 0.5);
  }

  // Verificar si puede mejorar una propiedad (requiere monopolio y dinero suficiente)
  canImproveProperty(property) {
    // Debe tener monopolio del grupo de color
    if (!this.monopolies.includes(property.group)) {
      return false;
    }
    
    // No debe tener más de 2 mejoras (nivel máximo 3)
    const currentImprovements = this.propertyImprovements[property.id] || 0;
    if (currentImprovements >= 2) {
      return false;
    }
    
    // Debe tener dinero suficiente
    const cost = this.getImprovementCost(property);
    return this.money >= cost;
  }
}
