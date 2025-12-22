import React, { useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';

const Stage = () => {
  const containerRef = useRef(null);
  const isMobile = useMediaQuery({maxWidth: 767})

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const DURATION = 3000; 
    const PARTICLE_SIZE = isMobile ? 25 : 35; 
    const SPAWN_INTERVAL = 1000; 
    const PARTICLE_COLOR = '#824de0';
    const STOP_DISTANCE = 0.75; 

    function getEdgePositions(edge) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const points = [];
      
      for (let i = 0; i < 4; i++) {
        const t = i / 3; 
        const x = w * t;
        const y = edge === 'top' ? 0 : h;
        points.push({ x, y });
      }
      
      return points;
    }

    // Spawn satu partikel
    function spawnParticle(startX, startY) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = `${PARTICLE_SIZE}px`;
      particle.style.height = `${PARTICLE_SIZE}px`;
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = PARTICLE_COLOR;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '1';
      particle.style.left = `${startX - PARTICLE_SIZE / 2}px`;
      particle.style.top = `${startY - PARTICLE_SIZE / 2}px`;
      particle.style.opacity = '0';
      
      container.appendChild(particle);

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / DURATION, 1);

        // Partikel berhenti di 60% perjalanan (tidak terlalu dekat dengan center)
        const adjustedProgress = progress * STOP_DISTANCE;

        // Posisi bergerak dari start ke center
        const currentX = startX + (centerX - startX) * adjustedProgress;
        const currentY = startY + (centerY - startY) * adjustedProgress;

        // Ukuran mengecil seiring progress (dari PARTICLE_SIZE ke 0)
        const currentSize = PARTICLE_SIZE * (1 - progress);

        // Opacity: 0 -> 1 (first 40%) -> 1 (middle) -> 0 (last 30%)
        let opacity;
        if (progress < 0.4) {
          // Fade in: 0 -> 1 di 40% pertama
          opacity = progress / 0.4;
        } else if (progress < 0.7) {
          // Stay full opacity
          opacity = 1;
        } else {
          // Fade out: 1 -> 0 di 30% terakhir
          opacity = (1 - progress) / 0.3;
        }

        particle.style.left = `${currentX - currentSize / 2}px`;
        particle.style.top = `${currentY - currentSize / 2}px`;
        particle.style.width = `${currentSize}px`;
        particle.style.height = `${currentSize}px`;
        particle.style.opacity = opacity;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      }

      requestAnimationFrame(animate);
    }

    // Spawn batch (8 partikel sekaligus)
    function spawnBatch() {
      const topPoints = getEdgePositions('top');
      const bottomPoints = getEdgePositions('bottom');
      
      // Spawn 4 dari atas
      topPoints.forEach(point => {
        spawnParticle(point.x, point.y);
      });
      
      // Spawn 4 dari bawah
      bottomPoints.forEach(point => {
        spawnParticle(point.x, point.y);
      });
    }

    // Mulai animasi
    spawnBatch(); // Spawn pertama langsung
    const intervalId = setInterval(spawnBatch, SPAWN_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gray-50 flex items-center justify-center overflow-hidden"
    >
      <div className="text-center z-10 relative text-[48px] font-semibold text-black font-montserrat max-md:text-[32px]">
        <h1>Ready to be <br className="max-md:hidden"/>more <span className='text-logo'>Productive?</span></h1>
      </div>
    </div>
  );
};

export default Stage;