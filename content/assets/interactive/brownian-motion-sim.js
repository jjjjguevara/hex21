// brownian-motion-sim.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BrownianMotionSimulation.css'; // Optional: for basic styling

const NUM_PARTICLES = 50; // Number of particles to simulate
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PARTICLE_COLOR = '#FFD700'; // Gold color for particles
const BACKGROUND_COLOR = '#282c34'; // Dark background

const BrownianMotionSimulation = () => {
  // --- State Variables ---
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5); // Controls magnitude of random step
  const [particleSize, setParticleSize] = useState(3); // Radius of particles
  const [trailPersistence, setTrailPersistence] = useState(0.95); // 0.8 (short) - 0.99 (long)

  // --- Refs ---
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // To store canvas context
  const particlesRef = useRef([]); // Stores particle {x, y} - Use ref to avoid state update overhead
  const animationFrameIdRef = useRef(null); // To cancel animation frame

  // --- Initialization ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctxRef.current = canvas.getContext('2d');

    // Initialize particles with random positions
    particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
    }));

    // Initial clear draw
    const ctx = ctxRef.current;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawParticles(ctx, particlesRef.current, particleSize); // Draw initial state

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Drawing Functions ---
  const drawParticles = (ctx, particles, size) => {
    ctx.fillStyle = PARTICLE_COLOR;
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // --- Animation Loop ---
  const animate = useCallback(() => {
    if (!isRunning || !ctxRef.current || !canvasRef.current) {
      // Stop loop if not running or context/canvas is missing
       if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
       }
      return;
    }

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    // 1. Create Fading Effect (Trails)
    // Draw a semi-transparent rectangle over the entire canvas.
    // Lower alpha means less is erased -> longer trails.
    // Higher alpha means more is erased -> shorter trails.
    // We use trailPersistence to control this: alpha = 1 - persistence
    ctx.fillStyle = `rgba(${hexToRgb(BACKGROUND_COLOR)}, ${1 - trailPersistence})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Update Particle Positions
    particlesRef.current.forEach(p => {
      // Einstein's model essence: random displacement in x and y
      const dx = (Math.random() - 0.5) * 2 * speed; // Random value between -speed and +speed
      const dy = (Math.random() - 0.5) * 2 * speed;

      p.x += dx;
      p.y += dy;

      // Boundary conditions (wrap around)
      if (p.x > canvas.width + particleSize) p.x = -particleSize;
      else if (p.x < -particleSize) p.x = canvas.width + particleSize;
      if (p.y > canvas.height + particleSize) p.y = -particleSize;
      else if (p.y < -particleSize) p.y = canvas.height + particleSize;
    });

    // 3. Draw Particles at New Positions
    drawParticles(ctx, particlesRef.current, particleSize);

    // 4. Request Next Frame
    animationFrameIdRef.current = requestAnimationFrame(animate);

  }, [isRunning, speed, particleSize, trailPersistence]); // Dependencies for the loop logic

  // --- Start/Stop Logic ---
  useEffect(() => {
    if (isRunning) {
      // Ensure previous frame is cancelled before starting a new one
       if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
       }
       // Start the animation loop
       animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Stop the animation loop
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    // Cleanup on unmount or if isRunning changes to false
    return () => {
        if (animationFrameIdRef.current) {
           cancelAnimationFrame(animationFrameIdRef.current);
        }
    };
  }, [isRunning, animate]); // Depend on isRunning and the animate function itself

  // --- Control Handlers ---
  const handleStartStop = () => {
    setIsRunning(prev => !prev);
  };

  const handleSpeedChange = (event) => {
    setSpeed(parseFloat(event.target.value));
  };

  const handleParticleSizeChange = (event) => {
    setParticleSize(parseFloat(event.target.value));
    // Re-draw immediately if not running to see size change
    if (!isRunning && ctxRef.current) {
         const ctx = ctxRef.current;
         ctx.fillStyle = BACKGROUND_COLOR;
         ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
         drawParticles(ctx, particlesRef.current, parseFloat(event.target.value));
    }
  };

    const handleTrailPersistenceChange = (event) => {
        setTrailPersistence(parseFloat(event.target.value));
    };

  // Helper to convert hex color for rgba background fade
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0'; // Default to black if conversion fails
    };


  // --- Render JSX ---
  return (
    <div className="simulation-container">
      <h1>Brownian Motion Simulation</h1>
      <p>Visualizing random particle movement based on principles described by Einstein.</p>
      <canvas ref={canvasRef} className="simulation-canvas"></canvas>
      <div className="controls">
        <button onClick={handleStartStop}>
          {isRunning ? 'Stop' : 'Start'}
        </button>

        <div className="slider-control">
          <label htmlFor="speed">Speed: {speed.toFixed(1)}</label>
          <input
            type="range"
            id="speed"
            min="0.1"
            max="5"
            step="0.1"
            value={speed}
            onChange={handleSpeedChange}
          />
        </div>

        <div className="slider-control">
          <label htmlFor="particleSize">Particle Size: {particleSize.toFixed(1)}</label>
          <input
            type="range"
            id="particleSize"
            min="1"
            max="10"
            step="0.5"
            value={particleSize}
            onChange={handleParticleSizeChange}
          />
        </div>

         <div className="slider-control">
          <label htmlFor="trailPersistence">Trail Persistence: {trailPersistence.toFixed(3)}</label>
          <input
            type="range"
            id="trailPersistence"
            min="0.800" // Shorter trails (faster fade)
            max="0.995" // Longer trails (slower fade)
            step="0.005"
            value={trailPersistence}
            onChange={handleTrailPersistenceChange}
          />
        </div>
      </div>
       <div className="explanation">
         <strong>How it relates to Einstein's work:</strong> Einstein mathematically showed that the seemingly random movement (Brownian motion) of larger particles suspended in a fluid is caused by numerous collisions with smaller, unseen molecules of the fluid. The key prediction is that the average squared distance a particle travels is directly proportional to time. This simulation models the *effect* of those collisions by giving each particle a small, random "kick" (displacement) in each time step, leading to the characteristic random walk pattern. The 'Speed' control adjusts the average magnitude of these random kicks.
       </div>
    </div>
  );
};

export default BrownianMotionSimulation;