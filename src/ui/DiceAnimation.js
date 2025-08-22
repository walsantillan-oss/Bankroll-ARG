export class DiceAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isAnimating = false;
    this.animationProgress = 0;
    this.dice = [];
    this.diceSize = 60;
    this.shadowOffset = 8;
    this.rotationSpeed = 0.3;
    this.showDice = false; // Nueva propiedad para controlar la visibilidad
    
    // Configuración de colores realistas mejorados
    this.colors = {
      face: '#FEFEFE',        // Blanco más puro
      shadow: '#1A1A1A',      // Sombra más profunda
      edge: '#E8E8E8',        // Bordes más suaves
      dot: '#2C2C2C',         // Puntos más suaves
      highlight: '#FFFFFF',    // Brillos blancos puros
      ambient: '#F0F0F0',     // Luz ambiental más cálida
      gradientStart: '#FFFFFF',
      gradientEnd: '#F5F5F5'
    };
    
    // Inicializar sonidos de dados
    this.initializeSounds();
    
    this.initializeDice();
  }
  
  initializeSounds() {
    // Crear sonidos sintéticos mejorados para los dados
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    this.sounds = {
      roll: () => this.playDiceRollSound(),
      bounce: () => this.playDiceBounceSound(),
      settle: () => this.playDiceSettleSound()
    };
  }
  
  playDiceRollSound() {
    // Sonido de dados rodando mejorado - múltiples capas
    const duration = 0.4;
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + duration);
    
    // Capa 1: Ruido blanco filtrado (fricción de superficie)
    const noise = this.createWhiteNoise(duration, 0.05);
    const filter1 = this.audioContext.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 1200;
    filter1.Q.value = 3;
    noise.connect(filter1);
    filter1.connect(masterGain);
    
    // Capa 2: Tonos graves (peso del dado)
    const oscillator1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    oscillator1.type = 'triangle';
    oscillator1.frequency.setValueAtTime(120, this.audioContext.currentTime);
    oscillator1.frequency.linearRampToValueAtTime(80, this.audioContext.currentTime + duration);
    gain1.gain.setValueAtTime(0.03, this.audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    oscillator1.connect(gain1);
    gain1.connect(masterGain);
    
    // Capa 3: Clicks sutiles (aristas del dado)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const click = this.audioContext.createOscillator();
        const clickGain = this.audioContext.createGain();
        click.type = 'square';
        click.frequency.value = 800 + Math.random() * 400;
        clickGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        clickGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.02);
        click.connect(clickGain);
        clickGain.connect(masterGain);
        click.start();
        click.stop(this.audioContext.currentTime + 0.02);
      }, i * 60);
    }
    
    masterGain.connect(this.audioContext.destination);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + duration);
    oscillator1.start();
    oscillator1.stop(this.audioContext.currentTime + duration);
  }
  
  createWhiteNoise(duration, volume) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    return source;
  }
  
  playDiceBounceSound() {
    // Sonido de rebote mejorado - más realista
    const frequency = 180 + Math.random() * 220;
    const duration = 0.12;
    
    const masterGain = this.audioContext.createGain();
    
    // Tono principal del rebote
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, this.audioContext.currentTime + duration);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    // Harmónico agudo para el "clic"
    const harmonicOsc = this.audioContext.createOscillator();
    const harmonicGain = this.audioContext.createGain();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.value = frequency * 2.5;
    harmonicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    harmonicGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.002);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.04);
    
    oscillator.connect(gain);
    harmonicOsc.connect(harmonicGain);
    gain.connect(masterGain);
    harmonicGain.connect(masterGain);
    masterGain.connect(this.audioContext.destination);
    
    masterGain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
    harmonicOsc.start();
    harmonicOsc.stop(this.audioContext.currentTime + 0.04);
  }
  
  playDiceSettleSound() {
    // Sonido de asentamiento mejorado - más suave y elegante
    const duration = 0.08;
    const masterGain = this.audioContext.createGain();
    
    // Tono principal - más grave y suave
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(140, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + duration);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    // Filtro pasa-bajos para suavizar
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 300;
    lowpass.Q.value = 1;
    
    oscillator.connect(gain);
    gain.connect(lowpass);
    lowpass.connect(masterGain);
    masterGain.connect(this.audioContext.destination);
    
    masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  initializeDice() {
    // Inicializar dos dados con posiciones y rotaciones aleatorias
    this.dice = [
      {
        x: this.canvas.width / 2 - 80,
        y: this.canvas.height / 2,
        value: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        velocityX: 0,
        velocityY: 0,
        velocityRotX: 0,
        velocityRotY: 0,
        velocityRotZ: 0,
        bounceHeight: 0,
        settled: false
      },
      {
        x: this.canvas.width / 2 + 20,
        y: this.canvas.height / 2,
        value: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        velocityX: 0,
        velocityY: 0,
        velocityRotX: 0,
        velocityRotY: 0,
        velocityRotZ: 0,
        bounceHeight: 0,
        settled: false
      }
    ];
  }
  
  startAnimation(dice1Value, dice2Value, onComplete) {
    this.isAnimating = true;
    this.showDice = true; // Mostrar dados al iniciar animación
    this.animationProgress = 0;
    this.onComplete = onComplete; // Guardar el callback
    
    // Reproducir sonido de dados al comenzar
    this.sounds.roll();
    
    // Configurar valores finales
    this.dice[0].finalValue = dice1Value;
    this.dice[1].finalValue = dice2Value;
    
    // Timeout de seguridad para asegurar que la animación termine
    this.safetyTimeout = setTimeout(() => {
      if (this.isAnimating) {
        console.log('Timeout de seguridad: forzando fin de animación');
        this.isAnimating = false;
        // Establecer valores finales
        this.dice[0].value = dice1Value;
        this.dice[1].value = dice2Value;
        this.dice.forEach(die => die.settled = true);
        
        if (this.onComplete) {
          this.onComplete();
          this.onComplete = null;
        }
        
        // Ocultar dados después del timeout de seguridad
        setTimeout(() => {
          this.showDice = false;
          console.log('Dados ocultados por timeout de seguridad');
        }, 1000);
      }
    }, 5000); // 5 segundos máximo
    
    // Configurar física inicial para animación realista
    this.dice.forEach((die, index) => {
      die.value = Math.floor(Math.random() * 6) + 1;
      die.settled = false;
      die.bounceHeight = 0;
      
      // Velocidades iniciales aleatorias para efecto de lanzamiento
      die.velocityX = (Math.random() - 0.5) * 4;
      die.velocityY = (Math.random() - 0.5) * 4;
      die.velocityRotX = (Math.random() - 0.5) * 0.4;
      die.velocityRotY = (Math.random() - 0.5) * 0.4;
      die.velocityRotZ = (Math.random() - 0.5) * 0.4;
      
      // Posición inicial ligeramente desplazada
      die.x = this.canvas.width / 2 + (index === 0 ? -80 : 20) + (Math.random() - 0.5) * 40;
      die.y = this.canvas.height / 2 + (Math.random() - 0.5) * 40;
    });
    
    this.animate();
  }
  
  animate() {
    if (!this.isAnimating) return;
    
    this.animationProgress += 0.016; // ~60fps
    
    // Actualizar física de los dados
    this.dice.forEach((die, index) => {
      if (!die.settled) {
        // Aplicar gravedad y fricción
        die.velocityY += 0.3; // Gravedad
        die.velocityX *= 0.98; // Fricción
        die.velocityY *= 0.98;
        
        // Actualizar posición
        die.x += die.velocityX;
        die.y += die.velocityY;
        
        // Bouncing en los bordes
        const margin = this.diceSize / 2;
        if (die.x < margin || die.x > this.canvas.width - margin) {
          die.velocityX *= -0.7;
          die.x = Math.max(margin, Math.min(this.canvas.width - margin, die.x));
          // Sonido de rebote
          if (Math.abs(die.velocityX) > 1) {
            this.sounds.bounce();
          }
        }
        if (die.y < margin || die.y > this.canvas.height - margin) {
          die.velocityY *= -0.7;
          die.y = Math.max(margin, Math.min(this.canvas.height - margin, die.y));
          // Sonido de rebote
          if (Math.abs(die.velocityY) > 1) {
            this.sounds.bounce();
          }
        }
        
        // Actualizar rotaciones
        die.rotationX += die.velocityRotX;
        die.rotationY += die.velocityRotY;
        die.rotationZ += die.velocityRotZ;
        
        // Reducir velocidades de rotación
        die.velocityRotX *= 0.95;
        die.velocityRotY *= 0.95;
        die.velocityRotZ *= 0.95;
        
        // Cambiar valores durante la animación
        if (Math.random() < 0.15) {
          die.value = Math.floor(Math.random() * 6) + 1;
        }
        
        // Verificar si se ha asentado
        const totalVelocity = Math.abs(die.velocityX) + Math.abs(die.velocityY) + 
                             Math.abs(die.velocityRotX) + Math.abs(die.velocityRotY);
        
        if (totalVelocity < 0.5 && this.animationProgress > 1.0) {
          die.settled = true;
          die.value = die.finalValue;
          die.velocityX = 0;
          die.velocityY = 0;
          die.velocityRotX = 0;
          die.velocityRotY = 0;
          die.velocityRotZ = 0;
          // Sonido de asentamiento
          this.sounds.settle();
          console.log(`Dado ${index + 1} asentado con valor: ${die.value}`);
        }
      }
    });
    
    // Verificar si ambos dados se han asentado
    if (this.dice.every(die => die.settled) && this.animationProgress > 1.5) {
      console.log('Todos los dados asentados, terminando animación...');
      
      // Limpiar timeout de seguridad
      if (this.safetyTimeout) {
        clearTimeout(this.safetyTimeout);
        this.safetyTimeout = null;
      }
      
      setTimeout(() => {
        this.isAnimating = false;
        console.log('Animación terminada, ejecutando callback...');
        // Ejecutar callback cuando termina la animación
        if (this.onComplete) {
          this.onComplete();
          this.onComplete = null; // Limpiar el callback
        }
        
        // Ocultar dados después de 1 segundo adicional
        setTimeout(() => {
          this.showDice = false;
          console.log('Dados ocultados');
        }, 1000);
      }, 300);
    } else {
      requestAnimationFrame(() => this.animate());
    }
  }
  
  drawDice() {
    // Solo dibujar si se deben mostrar los dados
    if (!this.showDice) return;
    
    this.dice.forEach(die => {
      this.ctx.save();
      
      // Mover al centro del dado
      this.ctx.translate(die.x, die.y);
      
      // Dibujar sombra realista
      this.drawShadow(die);
      
      // Aplicar transformaciones 3D simuladas
      this.ctx.save();
      this.ctx.scale(1 + Math.sin(die.rotationY) * 0.1, 1 + Math.sin(die.rotationX) * 0.1);
      this.ctx.rotate(die.rotationZ);
      
      // Dibujar el dado con efecto 3D
      this.drawDie3D(die);
      
      this.ctx.restore();
      this.ctx.restore();
    });
  }
  
  drawShadow(die) {
    const shadowSize = this.diceSize * 0.9;
    const shadowOpacity = 0.25;
    
    this.ctx.save();
    this.ctx.translate(this.shadowOffset * 0.8, this.shadowOffset * 1.2);
    
    // Sombra con gradiente radial para mayor realismo
    const shadowGradient = this.ctx.createRadialGradient(
      0, shadowSize * 0.3, 0,
      0, shadowSize * 0.3, shadowSize * 0.7
    );
    shadowGradient.addColorStop(0, `rgba(26,26,26,${shadowOpacity})`);
    shadowGradient.addColorStop(0.6, `rgba(26,26,26,${shadowOpacity * 0.5})`);
    shadowGradient.addColorStop(1, 'rgba(26,26,26,0)');
    
    this.ctx.fillStyle = shadowGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(0, shadowSize * 0.3, shadowSize * 0.8, shadowSize * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawDie3D(die) {
    const size = this.diceSize;
    const half = size / 2;
    
    // Calcular intensidad de luz basada en rotación (más suave)
    const lightIntensity = 0.6 + 0.4 * Math.cos(die.rotationY);
    const shadowIntensity = 0.3 + 0.2 * Math.sin(die.rotationX);
    
    // Gradiente radial para la cara principal (más realista)
    const gradient = this.ctx.createRadialGradient(
      -half * 0.3, -half * 0.3, 0,
      0, 0, size * 0.7
    );
    gradient.addColorStop(0, this.colors.gradientStart);
    gradient.addColorStop(0.7, this.colors.face);
    gradient.addColorStop(1, this.colors.gradientEnd);
    
    this.ctx.fillStyle = gradient;
    this.drawRoundedRect(-half, -half, size, size, 12); // Esquinas más redondeadas
    this.ctx.fill();
    
    // Bordes 3D mejorados - cara derecha con gradiente
    const rightGradient = this.ctx.createLinearGradient(half, -half, half + 12, -half - 6);
    rightGradient.addColorStop(0, this.interpolateColor(this.colors.edge, this.colors.ambient, lightIntensity * 0.8));
    rightGradient.addColorStop(1, this.interpolateColor(this.colors.edge, this.colors.shadow, shadowIntensity * 0.5));
    
    this.ctx.fillStyle = rightGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(half, -half);
    this.ctx.lineTo(half + 12, -half - 6);
    this.ctx.lineTo(half + 12, half - 6);
    this.ctx.lineTo(half, half);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Bordes 3D mejorados - cara superior con gradiente
    const topGradient = this.ctx.createLinearGradient(-half, -half, -half + 6, -half - 12);
    topGradient.addColorStop(0, this.interpolateColor(this.colors.edge, this.colors.highlight, lightIntensity * 0.6));
    topGradient.addColorStop(1, this.interpolateColor(this.colors.edge, this.colors.ambient, lightIntensity * 0.3));
    
    this.ctx.fillStyle = topGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(-half, -half);
    this.ctx.lineTo(-half + 6, -half - 12);
    this.ctx.lineTo(half + 6, -half - 12);
    this.ctx.lineTo(half, -half);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Borde principal del dado más suave
    this.ctx.strokeStyle = this.interpolateColor(this.colors.edge, this.colors.shadow, 0.3);
    this.ctx.lineWidth = 1.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.drawRoundedRect(-half, -half, size, size, 12);
    this.ctx.stroke();
    
    // Dibujar puntos con efecto 3D mejorado
    this.drawDots3D(die.value, size);
    
    // Brillo superior más sutil y realista
    this.ctx.save();
    this.ctx.globalAlpha = 0.25;
    const highlightGradient = this.ctx.createLinearGradient(-half, -half, half, half);
    highlightGradient.addColorStop(0, this.colors.highlight);
    highlightGradient.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.fillStyle = highlightGradient;
    this.drawRoundedRect(-half, -half, size, size, 12);
    this.ctx.fill();
    this.ctx.restore();
    
    // Sombra interior sutil para profundidad
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    this.ctx.strokeStyle = this.colors.shadow;
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(-half + 2, -half + 2, size - 4, size - 4, 10);
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  drawDots3D(value, size) {
    const dotSize = size * 0.14; // Puntos ligeramente más grandes
    const margin = size * 0.25;
    const positions = this.getDotPositions(value, size, margin);
    
    positions.forEach(pos => {
      // Sombra del punto más suave
      this.ctx.save();
      this.ctx.globalAlpha = 0.25;
      const shadowGradient = this.ctx.createRadialGradient(
        pos.x + 1.5, pos.y + 1.5, 0,
        pos.x + 1.5, pos.y + 1.5, dotSize * 1.2
      );
      shadowGradient.addColorStop(0, this.colors.shadow);
      shadowGradient.addColorStop(1, 'rgba(26,26,26,0)');
      this.ctx.fillStyle = shadowGradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x + 1.5, pos.y + 1.5, dotSize * 1.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Punto principal con gradiente
      this.ctx.save();
      const dotGradient = this.ctx.createRadialGradient(
        pos.x - dotSize * 0.3, pos.y - dotSize * 0.3, 0,
        pos.x, pos.y, dotSize
      );
      dotGradient.addColorStop(0, '#3A3A3A'); // Centro más claro
      dotGradient.addColorStop(0.7, this.colors.dot);
      dotGradient.addColorStop(1, '#1A1A1A'); // Borde más oscuro
      
      this.ctx.fillStyle = dotGradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Brillo del punto más sutil
      this.ctx.save();
      this.ctx.globalAlpha = 0.4;
      const highlightGradient = this.ctx.createRadialGradient(
        pos.x - dotSize * 0.4, pos.y - dotSize * 0.4, 0,
        pos.x - dotSize * 0.4, pos.y - dotSize * 0.4, dotSize * 0.6
      );
      highlightGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
      
      this.ctx.fillStyle = highlightGradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x - dotSize * 0.4, pos.y - dotSize * 0.4, dotSize * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
  
  getDotPositions(value, size, margin) {
    const positions = [];
    
    switch (value) {
      case 1:
        positions.push({x: 0, y: 0});
        break;
      case 2:
        positions.push({x: -margin, y: -margin});
        positions.push({x: margin, y: margin});
        break;
      case 3:
        positions.push({x: -margin, y: -margin});
        positions.push({x: 0, y: 0});
        positions.push({x: margin, y: margin});
        break;
      case 4:
        positions.push({x: -margin, y: -margin});
        positions.push({x: margin, y: -margin});
        positions.push({x: -margin, y: margin});
        positions.push({x: margin, y: margin});
        break;
      case 5:
        positions.push({x: -margin, y: -margin});
        positions.push({x: margin, y: -margin});
        positions.push({x: 0, y: 0});
        positions.push({x: -margin, y: margin});
        positions.push({x: margin, y: margin});
        break;
      case 6:
        positions.push({x: -margin, y: -margin});
        positions.push({x: margin, y: -margin});
        positions.push({x: -margin, y: 0});
        positions.push({x: margin, y: 0});
        positions.push({x: -margin, y: margin});
        positions.push({x: margin, y: margin});
        break;
    }
    
    return positions;
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
  }
  
  interpolateColor(color1, color2, factor) {
    // Función para interpolar entre dos colores hexadecimales
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  getCurrentValues() {
    return [this.dice[0].value, this.dice[1].value];
  }
  
  // Método para ocultar dados manualmente
  hideDice() {
    this.showDice = false;
    this.isAnimating = false;
    console.log('Dados ocultados manualmente');
  }
  
  // Método para actualizar el tamaño del canvas
  updateCanvasSize() {
    // Reposicionar dados cuando cambia el tamaño del canvas
    if (this.dice && this.dice.length >= 2) {
      this.dice[0].x = this.canvas.width / 2 - 80;
      this.dice[0].y = this.canvas.height / 2;
      
      this.dice[1].x = this.canvas.width / 2 + 20;
      this.dice[1].y = this.canvas.height / 2;
    }
  }
}
