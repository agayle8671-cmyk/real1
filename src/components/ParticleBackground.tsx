import React, { useEffect, useRef } from 'react';

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number, y: number, vx: number, vy: number, size: number }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 10000); // Increased density
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 3 + 1.5 // Larger size
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1A73E8'; // Google Blue

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Draw particle
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Connect
                /* 
                // Optional: Connections (can be expensive, keeping off for minimalist "Antigravity" floating feel)
                particles.slice(i + 1).forEach(p2 => {
                   const dx = p.x - p2.x;
                   const dy = p.y - p2.y;
                   const dist = Math.sqrt(dx*dx + dy*dy);
                   if (dist < 100) {
                     ctx.beginPath();
                     ctx.strokeStyle = '#1A73E8';
                     ctx.globalAlpha = 0.1 * (1 - dist/100);
                     ctx.moveTo(p.x, p.y);
                     ctx.lineTo(p2.x, p2.y);
                     ctx.stroke();
                   }
                }); 
                */
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-50"
        />
    );
}
