// Sound utility using Web Audio API for notification sounds
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.7; // Default volume (0-1)
    this.sounds = {
      bell: this.createBellSound.bind(this),
      chime: this.createChimeSound.bind(this),
      beep: this.createBeepSound.bind(this),
      notification: this.createNotificationSound.bind(this),
      ding: this.createDingSound.bind(this),
      alarm: this.createAlarmSound.bind(this),
      buzz: this.createBuzzSound.bind(this),
      pop: this.createPopSound.bind(this),
      whoosh: this.createWhooshSound.bind(this),
      trill: this.createTrillSound.bind(this),
      siren: this.createSirenSound.bind(this),
      success: this.createSuccessSound.bind(this),
      error: this.createErrorSound.bind(this),
      warning: this.createWarningSound.bind(this),
    };
  }

  // Initialize audio context (required for Web Audio API)
  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  // Set volume (0-100)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(100, volume)) / 100;
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Play a specific sound
  playSound(soundType, volume = null) {
    if (!this.isEnabled || !this.audioContext) return;

    const currentVolume = volume !== null ? volume / 100 : this.volume;
    const soundFunction = this.sounds[soundType];
    
    if (soundFunction) {
      soundFunction(currentVolume);
    } else {
      console.warn(`Unknown sound type: ${soundType}`);
    }
  }

  // Create a bell sound (gentle, pleasant)
  createBellSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Create a chime sound (light, airy)
  createChimeSound(volume) {
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.8);
    });
  }

  // Create a beep sound (simple, short)
  createBeepSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Create a notification sound (modern, soft)
  createNotificationSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Create a ding sound (single tone)
  createDingSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Create an alarm sound (urgent, attention-grabbing)
  createAlarmSound(volume) {
    // Create two oscillators for a more urgent sound
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
      oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
      oscillator.type = 'sawtooth';
      
      const startTime = this.audioContext.currentTime + (i * 0.3);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    }
  }

  // Create a buzz sound (vibrating, attention-grabbing)
  createBuzzSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
    oscillator.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Create a pop sound (quick, snappy)
  createPopSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.05);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Create a whoosh sound (swooshing, dynamic)
  createWhooshSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Create a trill sound (rapid, musical)
  createTrillSound(volume) {
    const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + (index * 0.05);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    });
  }

  // Create a siren sound (emergency, urgent)
  createSirenSound(volume) {
    for (let i = 0; i < 2; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1600, this.audioContext.currentTime + 0.5);
      oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 1.0);
      oscillator.type = 'sawtooth';
      
      const startTime = this.audioContext.currentTime + (i * 1.2);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 1.0);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 1.0);
    }
  }

  // Create a success sound (positive, uplifting)
  createSuccessSound(volume) {
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    });
  }

  // Create an error sound (negative, attention-grabbing)
  createErrorSound(volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
    oscillator.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.2);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Create a warning sound (caution, alerting)
  createWarningSound(volume) {
    for (let i = 0; i < 2; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
      oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
      oscillator.type = 'triangle';
      
      const startTime = this.audioContext.currentTime + (i * 0.4);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    }
  }

  // Test a sound (for preview in settings)
  testSound(soundType) {
    this.playSound(soundType);
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Initialize when the module loads
if (typeof window !== 'undefined') {
  soundManager.init();
}

export default soundManager;
