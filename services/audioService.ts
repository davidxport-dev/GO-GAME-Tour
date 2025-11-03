// Create a single AudioContext to be reused.
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (audioCtx) {
        return audioCtx;
    }
    try {
        // Safari requires the audio context to be created after a user gesture.
        // We'll resume it on the first playSound call.
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
            audioCtx = new Ctx();
            return audioCtx;
        }
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
    }
    return null;
};


type SoundType = 'place' | 'capture' | 'pass';

export const playSound = (type: SoundType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // The AudioContext may be in a suspended state (e.g., in Chrome)
    // and needs to be resumed after a user gesture.
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    let oscillator: OscillatorNode;
    let gainNode: GainNode;

    switch (type) {
        case 'place':
            // A sharp, short click like a wooden piece on a board.
            oscillator = ctx.createOscillator();
            gainNode = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            gainNode.gain.setValueAtTime(1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            break;
            
        case 'capture':
            // A slightly lower, more impactful sound.
            oscillator = ctx.createOscillator();
            gainNode = ctx.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            break;
            
        case 'pass':
            // A soft, quick whoosh sound.
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;
            
            const bandpass = ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(400, ctx.currentTime);
            bandpass.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            
            gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            noise.connect(bandpass);
            bandpass.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 0.15);
            break;
    }
};
