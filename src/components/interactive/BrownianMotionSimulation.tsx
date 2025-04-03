'use client'; // Add this directive for client components in App Router

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BrownianMotionSimulation.css'; // Corrected import path if needed

const DEFAULT_NUM_PARTICLES = 50;
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
  const [numParticles, setNumParticles] = useState(DEFAULT_NUM_PARTICLES); // Add state for particle count

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null); // Add type for canvas ref
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null); // Add type for context ref
  const particlesRef = useRef<{ x: number; y: number }[]>([]); // Add type for particle array ref
  const animationFrameIdRef = useRef<number | null>(null); // Add type for animation frame ID ref

  // Define animate before initializeSimulation because initializeSimulation uses it
  const animate = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    if (!isRunning || !ctx || !canvas) {
      if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
      }
      return;
    }

    // 1. Create Fading Effect (Trails)
    // Draw a semi-transparent rectangle over the entire canvas.
    // Lower alpha means less is erased -> longer trails.
    // Higher alpha means more is erased -> shorter trails.
    // We use trailPersistence to control this: alpha = 1 - persistence
    const rgbColor = hexToRgb(BACKGROUND_COLOR); // Get RGB color
    if (rgbColor) { // Ensure color conversion was successful
        ctx.fillStyle = `rgba(${rgbColor}, ${1 - trailPersistence})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Fallback if hexToRgb fails, maybe clear rect with solid color
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    // 2. Update Particle Positions
    particlesRef.current.forEach(p => {
      // Einstein's model essence: random displacement in x and y
      const dx = (Math.random() - 0.5) * 2 * speed; // Random value between -speed and +speed
      const dy = (Math.random() - 0.5) * 2 * speed;

      p.x += dx;
      p.y += dy;

      // Boundary conditions (wrap around)
      // Use canvas dimensions from ref
      if (p.x > canvas.width + particleSize) p.x = -particleSize;
      else if (p.x < -particleSize) p.x = canvas.width + particleSize;
      if (p.y > canvas.height + particleSize) p.y = -particleSize;
      else if (p.y < -particleSize) p.y = canvas.height + particleSize;
    });

    // 3. Draw Particles at New Positions
    drawParticles(ctx, particlesRef.current, particleSize);

    // 4. Request Next Frame
    animationFrameIdRef.current = requestAnimationFrame(animate);

  }, [isRunning, speed, particleSize, trailPersistence]);

  // --- Initialization & Reset Logic ---
  const initializeSimulation = useCallback((count: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Clear previous animation frame if any
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    // Reset particle positions
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
    }));

    // Clear canvas and draw initial particles
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawParticles(ctx, particlesRef.current, particleSize);

    // Restart animation if it was running
    if (isRunning) {
       animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [particleSize, isRunning, animate]); // Include dependencies

  // --- Initial Setup Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context");
        return;
    }
    ctxRef.current = ctx;

    // Initial setup with the current number of particles
    initializeSimulation(numParticles);

    // Cleanup function for unmount
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
    // Run only once on mount, initialization handled by initializeSimulation
     // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

   // --- Effect to re-initialize when numParticles changes ---
   useEffect(() => {
    // Don't re-init on first mount, handled by the setup effect
    if (particlesRef.current.length === 0) return; 
    initializeSimulation(numParticles);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [numParticles]); // Rerun only when numParticles changes

  // --- Drawing Functions ---
  // Add types for arguments
  const drawParticles = (
      ctx: CanvasRenderingContext2D,
      particles: { x: number; y: number }[],
      size: number
    ) => {
    ctx.fillStyle = PARTICLE_COLOR;
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

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

  // Add type for event
  const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseFloat(event.target.value));
  };

  // Add type for event
  const handleParticleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseFloat(event.target.value);
    setParticleSize(newSize);
    // Re-draw immediately if not running to see size change
    const ctx = ctxRef.current; // Get context from ref
    const canvas = canvasRef.current; // Get canvas from ref
    if (!isRunning && ctx && canvas) { // Check context and canvas validity
         ctx.fillStyle = BACKGROUND_COLOR;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         drawParticles(ctx, particlesRef.current, newSize);
    }
  };

  // Add type for event
  const handleTrailPersistenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setTrailPersistence(parseFloat(event.target.value));
  };

  // Add handler for particle number change
  const handleNumParticlesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setNumParticles(parseInt(event.target.value, 10));
  };

  // Add handler for restart button
  const handleRestart = () => {
      setIsRunning(false); // Stop simulation before resetting
      // Use a timeout to allow state update before re-initializing
      setTimeout(() => initializeSimulation(numParticles), 0); 
  };

  // Helper to convert hex color for rgba background fade
  // Add return type and handle potential null result from exec
  const hexToRgb = (hex: string): string | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null; // Return null if conversion fails
  };


  // --- Render JSX ---
  // Ensure refs are correctly assigned
  return (
    <div className="simulation-container">
      <h1>A first look at Brownian Motion</h1>
      <p>Visualizing random particle movement based on principles described by Einstein.</p>
      <canvas ref={canvasRef} className="simulation-canvas"></canvas>
      <div className="controls">
        <button onClick={handleStartStop}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
         <button onClick={handleRestart}>Restart</button>

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

        <div className="slider-control">
          <label htmlFor="numParticles">Particles: {numParticles}</label>
          <input
            type="range"
            id="numParticles"
            min="10"
            max="500" // Adjust max as needed
            step="10"
            value={numParticles}
            onChange={handleNumParticlesChange}
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