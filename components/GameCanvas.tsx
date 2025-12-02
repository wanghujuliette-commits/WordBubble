
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, WordBubble, Particle, FloatingText, PopResult } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  bubbles: WordBubble[];
  setBubbles: React.Dispatch<React.SetStateAction<WordBubble[]>>;
  onBubblePop: (bubble: WordBubble) => PopResult;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  bubbles,
  setBubbles,
  onBubblePop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const timeRef = useRef<number>(0);
  const reqIdRef = useRef<number>();

  // Spawn visual effects (explosion)
  const spawnParticles = (x: number, y: number, color: string, radius: number) => {
    // 1. Expanding Shockwave Ring
    particlesRef.current.push({
        x, y, vx: 0, vy: 0, life: 1.0, color, size: radius, type: 'ring'
    });

    // 2. Glass Shards
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 4;
        particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 8 + 4,
            type: 'shard',
            rotation: Math.random() * Math.PI,
            vRotation: (Math.random() - 0.5) * 0.4
        });
    }

    // 3. Small droplets/bubbles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: color,
        size: Math.random() * 5 + 2,
        type: 'circle'
      });
    }
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      life: 1.2, // Slightly longer life for combo text
      color
    });
  };

  // Interaction Handler
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (gameState !== GameState.PLAYING || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check collision with bubbles (reverse order to hit top bubbles first)
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        if (bubble.isPopped) continue;

        const dx = x - bubble.x;
        const dy = y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bubble.radius) {
            // Hit!
            spawnParticles(bubble.x, bubble.y, bubble.color, bubble.radius);
            
            // Call parent logic to get score/combo result
            const result = onBubblePop(bubble);
            
            // Display the result text
            spawnFloatingText(bubble.x, bubble.y, result.label, result.color);
            
            break; // Only pop one at a time
        }
    }
  }, [gameState, bubbles, onBubblePop]);

  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onMouseDown = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY);
      const onTouchStart = (e: TouchEvent) => {
          // e.preventDefault(); // Prevent scrolling
          const touch = e.touches[0];
          handleInteraction(touch.clientX, touch.clientY);
      };

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });

      return () => {
          canvas.removeEventListener('mousedown', onMouseDown);
          canvas.removeEventListener('touchstart', onTouchStart);
      };
  }, [handleInteraction]);


  // Main Game Loop
  const update = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;
    timeRef.current += 0.02;

    // 1. Draw Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a'); // Slate 900
    bgGrad.addColorStop(1, '#1e293b'); // Slate 800
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Update & Draw Bubbles
    if (gameState === GameState.PLAYING) {
      
      // Repulsion Physics (keep them apart)
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
             const b1 = bubbles[i];
             const b2 = bubbles[j];
             if (b1.isPopped || b2.isPopped) continue;

             const dx = b1.x - b2.x;
             const dy = b1.y - b2.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             const minDist = b1.radius + b2.radius + 15;

             if (dist < minDist && dist > 0) {
                 const angle = Math.atan2(dy, dx);
                 const push = (minDist - dist) * 0.08;
                 b1.x += Math.cos(angle) * push;
                 b1.y += Math.sin(angle) * push;
                 b2.x -= Math.cos(angle) * push;
                 b2.y -= Math.sin(angle) * push;
             }
        }
      }

      bubbles.forEach(bubble => {
        if (bubble.isPopped) return;

        // Floating Physics
        bubble.x += (bubble.anchorX - bubble.x) * 0.03;
        bubble.y += (bubble.anchorY - bubble.y) * 0.03;
        bubble.x += Math.cos(timeRef.current + bubble.phaseOffset) * 0.8;
        bubble.y += Math.sin(timeRef.current + bubble.phaseOffset) * 0.8;

        // Draw Bubble
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
            bubble.x - bubble.radius * 0.3, 
            bubble.y - bubble.radius * 0.3, 
            5, 
            bubble.x, 
            bubble.y, 
            bubble.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.3, bubble.color);
        grad.addColorStop(1, bubble.color.replace('0.6', '0.85'));
        
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
        
        ctx.beginPath();
        const highlightRadius = bubble.radius * 0.6;
        ctx.arc(bubble.x - bubble.radius * 0.35, bubble.y - bubble.radius * 0.35, highlightRadius, 4, 5.5);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(bubble.text, bubble.x, bubble.y);
        ctx.shadowBlur = 0; 
      });
    }

    // 3. Draw Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type !== 'ring') {
         p.vy += 0.25; 
      }
      p.life -= 0.03;
      
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      
      if (p.type === 'ring') {
        p.size += 4; 
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'shard') {
        if (p.rotation !== undefined && p.vRotation !== undefined) {
             p.rotation += p.vRotation;
        }
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, p.size);
        ctx.lineTo(-p.size, p.size);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 4. Draw Floating Texts
    floatingTextsRef.current.forEach(ft => {
      ft.y -= 2.5; // Float up
      ft.life -= 0.02;
      
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      
      // Shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = ft.color;
      
      // Dynamic font size logic could be added here
      ctx.font = '900 36px "Segoe UI"'; 
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

    reqIdRef.current = requestAnimationFrame(update);
  }, [gameState, bubbles]);

  useEffect(() => {
    reqIdRef.current = requestAnimationFrame(update);
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [update]);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 z-0 cursor-pointer touch-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
