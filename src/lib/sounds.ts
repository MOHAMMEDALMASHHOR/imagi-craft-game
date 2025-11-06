// Sound effects system using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3;
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Load enabled state from localStorage
      const savedEnabled = localStorage.getItem('soundEnabled');
      this.enabled = savedEnabled !== 'false';
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 1) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const finalVolume = this.masterVolume * volume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // Game sounds
  click() {
    this.playTone(800, 0.1, 'square', 0.3);
  }

  success() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    this.playTone(523.25, 0.15, 'sine', 0.4); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.4), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.5), 200); // G5
  }

  error() {
    if (!this.enabled || !this.audioContext) return;
    this.playTone(200, 0.2, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(150, 0.25, 'sawtooth', 0.4), 150);
  }

  move() {
    this.playTone(400, 0.08, 'sine', 0.2);
  }

  place() {
    this.playTone(600, 0.12, 'triangle', 0.3);
  }

  win() {
    if (!this.enabled || !this.audioContext) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 100);
    });
  }

  lose() {
    if (!this.enabled || !this.audioContext) return;
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sawtooth', 0.3), i * 100);
    });
  }

  powerUp() {
    if (!this.enabled || !this.audioContext) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(400 + i * 100, 0.08, 'square', 0.2), i * 50);
    }
  }

  countdown() {
    this.playTone(880, 0.1, 'square', 0.3);
  }

  tick() {
    this.playTone(1000, 0.05, 'sine', 0.15);
  }
}

export const soundManager = new SoundManager();
