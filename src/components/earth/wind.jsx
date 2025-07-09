import { useEffect, useRef } from 'react';

import { windIntensityColorScale } from './micro';
import { buildGrid } from './projucts';
import _ from 'lodash';

const WindCanvas = ({ windData, width, height, toLonLat }) => {
  const canvasRef = useRef(null);
  const animationId = useRef();
  const particles = useRef([]);
  const buckets = useRef([]);
  const colorScale = useRef([]);

  const INTENSITY_SCALE_STEP = 10;
  const MAX_PARTICLE_AGE = 150;
  const PARTICLE_MULTIPLIER = 7;
  const fadeFillStyle = 'rgba(0, 0, 0, 0.85)';

  useEffect(() => {
    if (!windData || !windData[0] || !windData[1]) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // grid 생성
    const header = windData[0].header;
    const uData = windData[0].data;
    const vData = windData[1].data;
    const grid = buildGrid(header, uData, vData);

    colorScale.current = windIntensityColorScale(INTENSITY_SCALE_STEP, 17);
    buckets.current = colorScale.current.map(() => []);

    const particleCount = Math.round(width * PARTICLE_MULTIPLIER);
    console.log('particle count: ' + particleCount);

    // particles 초기화
    particles.current = Array.from({ length: particleCount }, p =>
      randomizeParticle(p, grid, toLonLat)
    );
    console.log(particles.current);

    const evolve = () => {
      //   const newBuckets = buckets.current.map(() => []);
      buckets.current.forEach(b => (b.length = 0));
      //   const newParticles = particles.current.map(particle => {
      //     let newParticle = { ...particle };

      //     if (newParticle.age > MAX_PARTICLE_AGE) {
      //       newParticle = {};
      //     }
      //   });
      particles.current.forEach(p => {
        if (p.age > MAX_PARTICLE_AGE) {
          Object.assign(p, randomizeParticle(p, grid, toLonLat));
        }

        const [lon, lat] = toLonLat(p.x, p.y);
        const wind = grid.interpolate(lon, lat);

        if (!wind) {
          p.age = MAX_PARTICLE_AGE;
          return;
        }

        const [u, v, m] = wind;
        if (m == null) {
          p.age = MAX_PARTICLE_AGE;
          return;
        }

        const velocityScale = height * 0.0005; // 속도 스케일
        const xt = p.x + u * velocityScale;
        const yt = p.y - v * velocityScale;

        const toLonLatResult = toLonLat(xt, yt);
        if (!toLonLatResult) {
          p.age = MAX_PARTICLE_AGE;
          return;
        }
        const [lonT, latT] = toLonLatResult;
        const windT = grid.interpolate(lonT, latT);
        if (!windT) {
          p.age = MAX_PARTICLE_AGE;
          return;
        }

        p.xt = xt;
        p.yt = yt;
        p.age += 1;

        buckets.current[colorScale.current.indexFor(m)].push(p);
      });
    };

    /** draw step */
    const draw = () => {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = fadeFillStyle;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      ctx.lineWidth = 1;

      buckets.current.forEach((bucket, i) => {
        if (!bucket.length) return;
        ctx.beginPath();
        ctx.strokeStyle = colorScale.current[i];
        bucket.forEach(p => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.xt, p.yt);
          p.x = p.xt;
          p.y = p.yt;
        });
        ctx.stroke();
      });
    };

    /** animation loop */
    const frame = () => {
      evolve();
      draw();
      animationId.current = requestAnimationFrame(frame);
    };
    animationId.current = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationId.current);
  }, [windData, width, height, toLonLat]);

  const randomizeParticle = (particle, grid, toLonLat) => {
    let x, y;
    let tries = 0;
    do {
      x = Math.round(_.random(0, width));
      y = Math.round(_.random(0, height));

      const lonLat = toLonLat(x, y);
      if (!lonLat) {
        tries++;
        continue;
      }
      const wind = grid.interpolate(lonLat[0], lonLat[1]);
      if (wind && wind[2] != null) {
        return { ...particle, x, y, age: _.random(MAX_PARTICLE_AGE) };
      }
      tries++;
    } while (tries < 30);

    return { ...particle, x, y, age: 0 };
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 3000,
      }}
    />
  );
};

export { WindCanvas };
