// Sakura Rhythm Tap — Playground Widget by Taiyang Zhang (Sunshine)
// SVA MFA Design '26 · Playful Rhythm HCI & Procedural Audio

const BPM = 128;
const BEAT_MS = 60000 / BPM; // 468.75ms
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]; // C5 to E6

export default {
  student: "Taiyang Zhang (Sunshine)",
  title: "Sakura Rhythm Tap",
  width: 320,
  height: 400,
  rotate: 2,
  mount(root) {
    let audioCtx = null;
    let combo = 0;
    let maxCombo = 0;
    let score = 0;
    let isFever = false;
    let soundMode = "arcade"; // 'arcade' | 'kawaii' | 'meow'
    let noteIndex = 0;
    let trauma = 0;
    let lastHitTime = 0;
    const beatStartTime = Date.now();

    const getMascot = (c) => {
      if (c >= 30) return "👑";
      if (c >= 20) return "🔥";
      if (c >= 10) return "⚡";
      if (c >= 5) return "🐱";
      return "🌸";
    };

    root.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }
        .rhythm-card {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 26px;
          background: linear-gradient(145deg, #180d26 0%, #100618 100%);
          border: 1px solid rgba(255, 117, 160, 0.28);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          color: #fce7f3;
          font-family: 'IBM Plex Mono', monospace;
          user-select: none;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          will-change: transform;
          transition: border 0.25s ease, box-shadow 0.25s ease, background 0.3s ease;
          box-sizing: border-box;
        }
        .rhythm-card.is-fever {
          background: linear-gradient(145deg, #25103a 0%, #150824 100%);
          border: 2px solid #ff75a0;
          box-shadow: 0 0 35px rgba(255, 117, 160, 0.45), 0 16px 36px rgba(0, 0, 0, 0.6);
        }
        .decay-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 4px;
          width: 100%;
          background: linear-gradient(90deg, #ff75a0, #c084fc);
          box-shadow: 0 0 8px #ff75a0;
          transition: width 0.08s linear;
          pointer-events: none;
        }
        .rhythm-card.is-fever .decay-bar {
          background: linear-gradient(90deg, #ff75a0, #fbbf24, #38bdf8);
        }
        .bg-glow {
          position: absolute;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(255, 117, 160, 0.25) 0%, transparent 70%);
          top: 38%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(40px);
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .rhythm-card.is-fever .bg-glow {
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(255, 117, 160, 0.4) 0%, rgba(251, 191, 36, 0.2) 40%, transparent 70%);
        }
        .header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          letter-spacing: 0.08em;
          z-index: 2;
        }
        .title-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .title-text {
          color: #ff75a0;
          font-weight: 800;
        }
        .badge {
          background: rgba(255, 117, 160, 0.16);
          border: 1px solid rgba(255, 117, 160, 0.4);
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 9px;
          color: #ff9ebb;
          font-weight: 700;
        }
        .sound-picker {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 9999px;
          padding: 2px;
        }
        .sound-btn {
          background: transparent;
          color: #d1b4cb;
          border: none;
          border-radius: 9999px;
          font-size: 9px;
          padding: 2px 6px;
          cursor: pointer;
          font-weight: 700;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sound-btn.active {
          background: #ff75a0;
          color: #ffffff;
        }
        .disc-wrapper {
          position: relative;
          width: 176px;
          height: 176px;
          margin: 6px 0;
          cursor: pointer;
          touch-action: manipulation;
          z-index: 2;
        }
        .approach-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 2px solid rgba(255, 117, 160, 0.6);
          animation: ringPulse 0.46875s ease-in infinite;
          pointer-events: none;
          box-shadow: 0 0 10px rgba(255, 117, 160, 0.4);
        }
        .rhythm-card.is-fever .approach-ring {
          border-color: #fbbf24;
          box-shadow: 0 0 15px #fbbf24;
        }
        @keyframes ringPulse {
          0% { transform: scale(1.45); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: scale(1.0); opacity: 1; }
        }
        .disc {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #2d163d 0%, #150921 75%);
          border: 2px solid rgba(255, 117, 160, 0.5);
          box-shadow: 0 0 24px rgba(255, 117, 160, 0.3), inset 0 0 18px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transform: scale(1);
          transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
        }
        .rhythm-card.is-fever .disc {
          background: radial-gradient(circle at 35% 35%, #421652 0%, #1c0a2b 75%);
          border-color: #fbbf24;
        }
        .disc.is-hit {
          transform: scale(0.88, 1.12);
          box-shadow: 0 0 45px rgba(255, 117, 160, 0.95), inset 0 0 20px rgba(255, 117, 160, 0.4);
        }
        .disc-ring {
          position: absolute;
          inset: 12px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.25);
          animation: rotateRing 12s linear infinite;
        }
        .rhythm-card.is-fever .disc-ring {
          animation-duration: 6s;
        }
        @keyframes rotateRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .disc-icon {
          font-size: 44px;
          line-height: 1;
          filter: drop-shadow(0 2px 8px rgba(255, 117, 160, 0.6));
          transition: transform 0.12s ease;
        }
        .rhythm-card.is-fever .disc-icon {
          filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.9));
        }
        .disc-tap-hint {
          font-size: 9px;
          letter-spacing: 0.14em;
          color: #ff75a0;
          font-weight: 800;
          margin-top: 4px;
        }
        .rhythm-card.is-fever .disc-tap-hint {
          color: #fbbf24;
        }
        .feedback-area {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Faculty Glyphic', serif;
          font-size: 16px;
          font-weight: 800;
          color: #ff75a0;
          text-shadow: 0 0 14px rgba(255, 117, 160, 0.6);
          z-index: 2;
        }
        .hit-grade-anim {
          animation: popGrade 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popGrade {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .floating-pop {
          position: absolute;
          font-family: 'Faculty Glyphic', serif;
          font-weight: 900;
          font-size: 13px;
          pointer-events: none;
          transform: translate(-50%, -50%);
          animation: floatFeedback 0.75s ease-out forwards;
          z-index: 10;
          white-space: nowrap;
        }
        @keyframes floatFeedback {
          0% { transform: translate(-50%, -50%) scale(0.7); opacity: 1; }
          40% { transform: translate(-50%, -75%) scale(1.25); opacity: 1; }
          100% { transform: translate(-50%, -120%) scale(0.95); opacity: 0; }
        }
        .stats-row {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 117, 160, 0.18);
          border-radius: 16px;
          padding: 8px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          box-sizing: border-box;
          z-index: 2;
        }
        .stat-label {
          color: #d1b4cb;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .combo-count {
          font-size: 20px;
          font-weight: 800;
          color: #38bdf8;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }
        .rhythm-card.is-fever .combo-count {
          color: #fbbf24;
        }
        .score-val {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
        }
        .max-val {
          color: #ff75a0;
          font-weight: 700;
          font-size: 13px;
        }
        .spark-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          pointer-events: none;
          animation: sparkBurst 0.6s ease-out forwards;
        }
        @keyframes sparkBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rhythm-card { transform: none !important; }
          .approach-ring { animation: none; }
          .disc-ring { animation: none; }
        }
      </style>

      <div class="rhythm-card">
        <div class="decay-bar"></div>
        <div class="bg-glow"></div>

        <div class="header">
          <div class="title-group">
            <span class="title-text">🌸 SUNSHINE BEAT</span>
            <span class="badge">128 BPM</span>
          </div>
          <div class="sound-picker">
            <button class="sound-btn active" data-mode="arcade">🎛️</button>
            <button class="sound-btn" data-mode="kawaii">🌸</button>
            <button class="sound-btn" data-mode="meow">🐱</button>
          </div>
        </div>

        <div class="disc-wrapper">
          <div class="approach-ring"></div>
          <div class="disc">
            <div class="disc-ring"></div>
            <div class="disc-icon">🌸</div>
            <div class="disc-tap-hint">HIT ON BEAT</div>
          </div>
        </div>

        <div class="feedback-area">
          <span class="hit-grade-anim">TAP ON BEAT!</span>
        </div>

        <div class="stats-row">
          <div>
            <div class="stat-label">COMBO</div>
            <div class="combo-count">00</div>
          </div>
          <div style="text-align: center;">
            <div class="stat-label">SCORE</div>
            <div class="score-val">0</div>
          </div>
          <div style="text-align: right;">
            <div class="stat-label">MAX STREAK</div>
            <div class="max-val">—</div>
          </div>
        </div>
      </div>
    `;

    const card = root.querySelector(".rhythm-card");
    const decayBar = root.querySelector(".decay-bar");
    const titleText = root.querySelector(".title-text");
    const disc = root.querySelector(".disc");
    const discWrapper = root.querySelector(".disc-wrapper");
    const discIcon = root.querySelector(".disc-icon");
    const discHint = root.querySelector(".disc-tap-hint");
    const feedback = root.querySelector(".feedback-area");
    const comboEl = root.querySelector(".combo-count");
    const scoreEl = root.querySelector(".score-val");
    const maxEl = root.querySelector(".max-val");
    const soundBtns = root.querySelectorAll(".sound-btn");

    // Sound picker buttons
    soundBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        soundBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        soundMode = btn.getAttribute("data-mode") || "arcade";
      });
    });

    // Web Audio Sound Generator
    const playJuicySound = (pitchBonus = 0) => {
      try {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const baseFreq = NOTES[(noteIndex + pitchBonus) % NOTES.length];
        noteIndex += 1;

        // Layer 1: Sub-bass 808 kick (Arcade or Fever)
        if (soundMode === "arcade" || isFever) {
          const bassOsc = audioCtx.createOscillator();
          const bassGain = audioCtx.createGain();
          bassOsc.type = "sine";
          bassOsc.frequency.setValueAtTime(145, now);
          bassOsc.frequency.exponentialRampToValueAtTime(34, now + 0.12);
          bassGain.gain.setValueAtTime(0.35, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          bassOsc.connect(bassGain);
          bassGain.connect(audioCtx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.13);
        }

        // Layer 2: Melodic Tone
        const toneOsc = audioCtx.createOscillator();
        const toneGain = audioCtx.createGain();

        if (soundMode === "meow") {
          toneOsc.type = "triangle";
          toneOsc.frequency.setValueAtTime(baseFreq * 0.8, now);
          toneOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.08);
          toneOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.25);
          toneGain.gain.setValueAtTime(0.01, now);
          toneGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
          toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        } else {
          toneOsc.type = soundMode === "arcade" ? "triangle" : "sine";
          toneOsc.frequency.setValueAtTime(baseFreq, now);
          toneOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.01, now + 0.1);
          toneGain.gain.setValueAtTime(0.01, now);
          toneGain.gain.linearRampToValueAtTime(0.2, now + 0.02);
          toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
        }

        toneOsc.connect(toneGain);
        toneGain.connect(audioCtx.destination);
        toneOsc.start(now);
        toneOsc.stop(now + 0.4);

        // Layer 3: Fever shimmer chord
        if (isFever || combo >= 10) {
          const chordOsc = audioCtx.createOscillator();
          const chordGain = audioCtx.createGain();
          chordOsc.type = "sine";
          chordOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
          chordGain.gain.setValueAtTime(0.001, now);
          chordGain.gain.linearRampToValueAtTime(0.12, now + 0.03);
          chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          chordOsc.connect(chordGain);
          chordGain.connect(audioCtx.destination);
          chordOsc.start(now);
          chordOsc.stop(now + 0.46);
        }
      } catch {
        // AudioContext disabled or error
      }
    };

    // Trauma Screen Shake Loop
    let animId;
    const shakeLoop = () => {
      if (trauma > 0.005) {
        const shake = trauma * trauma;
        const maxOffset = 10;
        const maxAngle = 2.0;
        const ox = (Math.random() * 2 - 1) * maxOffset * shake;
        const oy = (Math.random() * 2 - 1) * maxOffset * shake;
        const oa = (Math.random() * 2 - 1) * maxAngle * shake;
        card.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) rotate(${oa.toFixed(2)}deg)`;
        trauma *= 0.88;
      } else if (trauma > 0) {
        trauma = 0;
        card.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
      }
      animId = requestAnimationFrame(shakeLoop);
    };
    animId = requestAnimationFrame(shakeLoop);

    // Combo Decay Loop (2.2s countdown)
    let decayAnimId;
    const decayLoop = () => {
      if (combo > 0) {
        const elapsed = Date.now() - lastHitTime;
        const timeout = 2200;
        const remaining = Math.max(0, 1 - elapsed / timeout);
        decayBar.style.width = `${(remaining * 100).toFixed(1)}%`;
        if (remaining <= 0) {
          combo = 0;
          isFever = false;
          card.classList.remove("is-fever");
          titleText.textContent = "🌸 SUNSHINE BEAT";
          discHint.textContent = "HIT ON BEAT";
          discIcon.textContent = getMascot(0);
          feedback.innerHTML = `<span class="hit-grade-anim" style="color: #9ca3af;">COMBO BREAK 💔</span>`;
          comboEl.textContent = "00";
        }
      } else {
        decayBar.style.width = "100%";
      }
      decayAnimId = requestAnimationFrame(decayLoop);
    };
    decayAnimId = requestAnimationFrame(decayLoop);

    // Sparkle Burst Confetti Generator
    const triggerConfetti = (originX, originY) => {
      const colors = ["#ff75a0", "#c084fc", "#fbbf24", "#38bdf8", "#34d399"];
      for (let i = 0; i < 24; i++) {
        const spark = document.createElement("div");
        spark.className = "spark-particle";
        const angle = Math.random() * Math.PI * 2;
        const dist = 35 + Math.random() * 65;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        spark.style.setProperty("--tx", `${tx}px`);
        spark.style.setProperty("--ty", `${ty}px`);
        spark.style.left = `${originX}px`;
        spark.style.top = `${originY}px`;
        spark.style.background = colors[Math.floor(Math.random() * colors.length)];
        discWrapper.appendChild(spark);
        setTimeout(() => spark.remove(), 650);
      }
    };

    // On Tap
    const onHit = (e) => {
      const now = Date.now();
      lastHitTime = now;

      // Timing judgment
      const timeSinceBeat = (now - beatStartTime) % BEAT_MS;
      const offset = Math.min(timeSinceBeat, BEAT_MS - timeSinceBeat);

      let gradeText = "GOOD";
      let gradeColor = "#38bdf8";
      let points = 50;
      let shakeIntensity = 0.25;

      if (offset <= 65) {
        gradeText = "PERFECT!! 🌸";
        gradeColor = "#fbbf24";
        points = 300;
        shakeIntensity = 0.55;
      } else if (offset <= 125) {
        gradeText = "GREAT! ✨";
        gradeColor = "#f472b6";
        points = 150;
        shakeIntensity = 0.38;
      }

      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      score += points * (combo > 10 ? 2 : 1);

      // Check Fever
      if (combo === 10 || combo === 25 || combo === 50) {
        isFever = true;
        shakeIntensity = 0.85;
        card.classList.add("is-fever");
        titleText.textContent = "🔥 FEVER MODE";
        discHint.textContent = "FEVER TAP!";
        triggerConfetti(88, 88);
      }

      trauma = Math.min(1.0, trauma + shakeIntensity);
      playJuicySound(combo > 10 ? 1 : 0);

      // Disc feedback bounce
      disc.classList.remove("is-hit");
      void disc.offsetWidth;
      disc.classList.add("is-hit");
      setTimeout(() => disc.classList.remove("is-hit"), 120);

      // Update mascot
      discIcon.textContent = getMascot(combo);

      // Hit grade banner
      feedback.innerHTML = `<span class="hit-grade-anim" style="color: ${gradeColor}; text-shadow: 0 0 14px ${gradeColor};">${gradeText}</span>`;

      // Stats
      comboEl.textContent = combo > 0 ? `×${combo}` : "00";
      scoreEl.textContent = score.toLocaleString();
      maxEl.textContent = `×${maxCombo}`;

      // Floating pop text at cursor
      const rect = discWrapper.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const pop = document.createElement("div");
      pop.className = "floating-pop";
      pop.style.left = `${px}px`;
      pop.style.top = `${py}px`;
      pop.style.color = gradeColor;
      pop.style.textShadow = `0 0 10px ${gradeColor}`;
      pop.textContent = gradeText;
      discWrapper.appendChild(pop);
      setTimeout(() => pop.remove(), 750);
    };

    disc.addEventListener("pointerdown", onHit);
  },
};
