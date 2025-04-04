'use client'; // Add this directive for client components in App Router

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BrownianMotionSimulation.css'; // Corrected import path if needed
import { useTheme } from 'next-themes'; // Import useTheme

// Add RotaryKnob component
interface RotaryKnobProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  label: string;
  valueDisplay: string;
}

const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  min,
  max,
  step,
  onChange,
  size = 60,
  color = '#4B5563',
  label,
  valueDisplay
}) => {
  const knobRef = useRef<SVGCircleElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const { theme } = useTheme();
  
  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement>) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    // Calculate vertical movement. Moving up (negative deltaY) increases value
    const deltaY = e.clientY - startY.current;
    
    // Convert vertical movement to value change
    // Moving up (negative deltaY) = increase value (clockwise)
    // Moving down (positive deltaY) = decrease value (counter-clockwise)
    // Adjust sensitivity factor as needed
    const sensitivity = 0.5;
    const valueDelta = -deltaY * sensitivity * ((max - min) / 100);
    
    let newValue = startValue.current + valueDelta;
    
    // Clamp value between min and max
    newValue = Math.max(min, Math.min(max, newValue));
    
    // Snap to nearest step
    newValue = Math.round(newValue / step) * step;
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Convert value to angle (0 to 300 degrees)
  const valueToAngle = (val: number) => {
    const percentage = (val - min) / (max - min);
    return percentage * 300 - 150; // -150 to +150 degrees
  };

  const angle = valueToAngle(value);
  const knobColor = theme === 'dark' ? '#D1D5DB' : color;
  const indicatorColor = theme === 'dark' ? '#FDE047' : '#4F46E5';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="transparent" 
          stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} 
          strokeWidth="8" 
          strokeDasharray="1 4"
        />
        
        {/* Knob */}
        <circle 
          ref={knobRef}
          cx="50" 
          cy="50" 
          r="35" 
          fill={theme === 'dark' ? '#1F2937' : '#F3F4F6'} 
          stroke={knobColor}
          strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
        />
        
        {/* Indicator line */}
        <line 
          x1="50" 
          y1="50" 
          x2="50" 
          y2="20" 
          stroke={indicatorColor} 
          strokeWidth="2" 
          transform={`rotate(${angle}, 50, 50)`} 
        />
        
        {/* Center dot */}
        <circle 
          cx="50" 
          cy="50" 
          r="3" 
          fill={indicatorColor} 
        />
      </svg>
      <div className="font-medium text-xs text-gray-700 dark:text-gray-300 mt-1">{label}: {valueDisplay}</div>
    </div>
  );
};

const DEFAULT_NUM_PARTICLES = 50;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PARTICLE_COLOR = '#FFD700'; // Gold color for particles
const BACKGROUND_COLOR = '#282c34'; // Dark background

interface Particle {
  x: number;
  y: number;
  trail: { x: number; y: number }[];
}

const BrownianMotionSimulation = () => {
  // --- State Variables ---
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1.5); // Controls magnitude of random step
  const [particleSize, setParticleSize] = useState(3.0); // Radius of particles
  const [trailPersistence, setTrailPersistence] = useState(0.95); // 0.8 (short) - 0.99 (long)
  const [numParticles, setNumParticles] = useState(DEFAULT_NUM_PARTICLES); // Add state for particle count

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null); // Add type for canvas ref
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null); // Add type for context ref
  const particlesRef = useRef<Particle[]>([]); // Add type for particle array ref
  const animationFrameIdRef = useRef<number | null>(null); // Add type for animation frame ID ref
  const { theme } = useTheme(); // Get current theme

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

    // --- Theme-aware drawing ---
    const isDarkMode = theme === 'dark';
    const bgColor = isDarkMode ? '#111827' : '#FFFFFF'; // Dark gray vs White
    const particleColor = isDarkMode ? '#FDE047' : '#000000'; // Yellow vs Black
    const trailColor = isDarkMode ? 'rgba(253, 224, 71, 0.5)' : 'rgba(0, 0, 0, 0.5)'; // Semi-transparent particle color

    // 1. Create Fading Effect (Trails)
    // Draw a semi-transparent rectangle over the entire canvas.
    // Lower alpha means less is erased -> longer trails.
    // Higher alpha means more is erased -> shorter trails.
    // We use trailPersistence to control this: alpha = 1 - persistence
    ctx.fillStyle = isDarkMode ? `rgba(17, 24, 39, ${1 - trailPersistence})` : `rgba(255, 255, 255, ${1 - trailPersistence})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    particlesRef.current.forEach(p => {
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Request Next Frame
    animationFrameIdRef.current = requestAnimationFrame(animate);

  }, [isRunning, speed, particleSize, trailPersistence, theme]);

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
      trail: [],
    }));

    // Clear canvas and draw initial particles
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Inline the drawing logic
    const isDarkMode = theme === 'dark';
    const particleColor = isDarkMode ? '#FDE047' : '#000000'; // Yellow vs Black
    
    particlesRef.current.forEach(p => {
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    });

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
  // Remove the drawParticles function entirely

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

  // Updated handlers for knob controls
  const handleSpeedChange = (newValue: number) => {
    setSpeed(newValue);
  };

  const handleParticleSizeChange = (newValue: number) => {
    setParticleSize(newValue);
    // Re-draw immediately if not running to see size change
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!isRunning && ctx && canvas) {
         ctx.fillStyle = BACKGROUND_COLOR;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         // Inline the drawing logic
         const isDarkMode = theme === 'dark';
         const particleColor = isDarkMode ? '#FDE047' : '#000000'; // Yellow vs Black
         
         particlesRef.current.forEach(p => {
           ctx.fillStyle = particleColor;
           ctx.beginPath();
           ctx.arc(p.x, p.y, newValue, 0, Math.PI * 2);
           ctx.fill();
         });
    }
  };

  const handleTrailPersistenceChange = (newValue: number) => {
      setTrailPersistence(newValue);
  };

  const handleNumParticlesChange = (newValue: number) => {
      setNumParticles(Math.round(newValue));
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

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          console.log(`Canvas resized to: ${width}x${height}`);
          // Re-initialize or adjust particles on resize
          // Simple approach: Re-initialize fully
          initializeSimulation(numParticles);
        }
      }
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.unobserve(canvas);
    };
  }, [numParticles]); // Re-run if numParticles changes

  // --- Render JSX ---
  // Ensure refs are correctly assigned
  return (
    <div className="simulation-container my-6 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">A first look at Brownian Motion</h1>
      <p className="mb-4 text-gray-700 dark:text-gray-300">Visualizing random particle movement based on principles described by Einstein.</p>
      <canvas
        ref={canvasRef}
        className="simulation-canvas w-full h-[400px] md:h-[500px] lg:h-[600px] border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-900" // Explicit canvas bg
      />
      <div className="controls grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center col-span-1">
          <button 
            onClick={handleStartStop} 
            className={`px-4 py-2 text-white rounded mr-2 ${
              isRunning 
                ? 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700' // Gray for Pause
                : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700' // Gray for Start too
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={handleRestart} 
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            Restart
          </button>
        </div>
        
        {/* Knob controls in a 4-column layout */}
        <div className="knob-control flex justify-center">
          <RotaryKnob
            value={speed}
            min={0.1}
            max={5}
            step={0.1}
            onChange={handleSpeedChange}
            label="Speed"
            valueDisplay={speed.toFixed(1)}
          />
        </div>
        
        <div className="knob-control flex justify-center">
          <RotaryKnob
            value={particleSize}
            min={1}
            max={10}
            step={0.5}
            onChange={handleParticleSizeChange}
            label="Size"
            valueDisplay={particleSize.toFixed(1)}
          />
        </div>
        
        <div className="knob-control flex justify-center">
          <RotaryKnob
            value={trailPersistence}
            min={0.800}
            max={0.995}
            step={0.005}
            onChange={handleTrailPersistenceChange}
            label="Trail"
            valueDisplay={trailPersistence.toFixed(3)}
          />
        </div>
        
        <div className="knob-control flex justify-center">
          <RotaryKnob
            value={numParticles}
            min={10}
            max={500}
            step={10}
            onChange={handleNumParticlesChange}
            label="Particles"
            valueDisplay={numParticles.toString()}
          />
        </div>
      </div>
      <div className="explanation text-sm p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
        <strong className="text-gray-800 dark:text-gray-200">How it relates to Einstein's work:</strong> Einstein mathematically showed that the seemingly random movement (Brownian motion) of larger particles suspended in a fluid is caused by numerous collisions with smaller, unseen molecules of the fluid. The key prediction is that the average squared distance a particle travels is directly proportional to time. This simulation models the <em>effect</em> of those collisions by giving each particle a small, random "kick" (displacement) in each time step, leading to the characteristic random walk pattern. The 'Speed' control adjusts the average magnitude of these random kicks.
      </div>
    </div>
  );
};

export default BrownianMotionSimulation;