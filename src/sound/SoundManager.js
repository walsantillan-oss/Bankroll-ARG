class SoundManager {
  constructor() {
    // Crear contexto de audio
    this.audioContext = null;
    this.sounds = {};
    this.enabled = true;
    
    // Inicializar contexto de audio
    this.initAudioContext();
    
    // Crear sonidos sintéticos
    this.createSyntheticSounds();
  }
  
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Audio no soportado:', e);
      this.enabled = false;
    }
  }
  
  createSyntheticSounds() {
    if (!this.enabled || !this.audioContext) return;
    
    // Sonido de paso por casillero mejorado - más atractivo
    this.sounds.step = {
      frequency: 440, // Nota musical A4 - más agradable
      duration: 0.15,
      type: 'sine'
    };
    
    // Sonido al pasar por LARGADA
    this.sounds.salary = {
      frequency: 1200,
      duration: 0.3,
      type: 'triangle'
    };
    
    // Sonido de compra
    this.sounds.purchase = {
      frequency: 600,
      duration: 0.2,
      type: 'square'
    };
    
    // Sonido de error/no puede hacer acción
    this.sounds.error = {
      frequency: 300,
      duration: 0.3,
      type: 'sawtooth'
    };
  }
  
  playSound(soundName, volume = 0.1) {
    if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
    
    try {
      // Reanudar contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const sound = this.sounds[soundName];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
      oscillator.type = sound.type;
      
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + sound.duration);
    } catch (e) {
      console.warn('Error reproduciendo sonido:', e);
    }
  }
  
  playStep() {
    // Sonido mejorado para el movimiento de fichas
    this.playStepSound();
  }
  
  playStepSound() {
    if (!this.enabled || !this.audioContext) return;
    
    try {
      // Reanudar contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const duration = 0.2;
      const masterGain = this.audioContext.createGain();
      
      // Variación aleatoria en el tono para que no sea monótono
      const baseFreq1 = 523 + (Math.random() - 0.5) * 60; // C5 ± variación
      const baseFreq2 = 659 + (Math.random() - 0.5) * 40; // E5 ± variación
      const harmonic1 = 784 + (Math.random() - 0.5) * 30; // G5 ± variación
      const harmonic2 = 698 + (Math.random() - 0.5) * 30; // F5 ± variación
      
      // Tono principal - sonido suave y musical
      const oscillator1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(baseFreq1, this.audioContext.currentTime);
      oscillator1.frequency.linearRampToValueAtTime(baseFreq2, this.audioContext.currentTime + 0.1);
      
      gain1.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain1.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      // Armónico suave para riqueza
      const oscillator2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      oscillator2.type = 'triangle';
      oscillator2.frequency.setValueAtTime(harmonic1, this.audioContext.currentTime);
      oscillator2.frequency.linearRampToValueAtTime(harmonic2, this.audioContext.currentTime + 0.1);
      
      gain2.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain2.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      // Filtro pasa-bajos para suavizar
      const lowpass = this.audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2000 + (Math.random() - 0.5) * 400; // Variación en el filtro
      lowpass.Q.value = 1;
      
      // Conectar todo
      oscillator1.connect(gain1);
      oscillator2.connect(gain2);
      gain1.connect(lowpass);
      gain2.connect(lowpass);
      lowpass.connect(masterGain);
      masterGain.connect(this.audioContext.destination);
      
      masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      
      oscillator1.start();
      oscillator1.stop(this.audioContext.currentTime + duration);
      oscillator2.start();
      oscillator2.stop(this.audioContext.currentTime + duration);
      
    } catch (e) {
      console.warn('Error reproduciendo sonido de paso:', e);
    }
  }
  
  playSalary() {
    this.playSound('salary', 0.1);
  }
  
  playPurchase() {
    this.playSound('purchase', 0.1);
  }
  
  playError() {
    this.playSound('error', 0.1);
  }
  
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  toggle() {
    this.enabled = !this.enabled;
  }
}

export default SoundManager;
