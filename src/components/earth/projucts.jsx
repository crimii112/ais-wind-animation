import { transform } from 'ol/proj';
import { useEffect, useRef } from 'react';

const bilinearInterpolateVector = (x, y, g00, g10, g01, g11) => {
  const rx = 1 - x;
  const ry = 1 - y;
  const a = rx * ry,
    b = x * ry,
    c = rx * y,
    d = x * y;
  const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
  const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;

  return [u, v, Math.sqrt(u * u + v * v)];
};

const bilinearInterpolateScalar = (x, y, g00, g10, g01, g11) => {
  const rx = 1 - x;
  const ry = 1 - y;
  return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
};

const buildGrid = (header, uData, vData) => {
  const λ0 = header.lo1,
    φ0 = header.la1;
  const Δλ = header.dx,
    Δφ = header.dy;
  const ni = header.nx,
    nj = header.ny;
  const date = new Date(header.refTime);

  const isContinuous = Math.floor(ni * Δλ) >= 360;
  const grid = Array.from({ length: nj }, (_, j) => {
    const row = [];
    const jj = nj - 1 - j;
    for (let i = 0; i < ni; i++) {
      const idx = jj * ni + i;
      row.push([uData[idx], vData[idx]]);
    }
    if (isContinuous) row.push(row[0]);

    return row;
  });

  const interpolate = (λ, φ) => {
    const i = (λ - λ0) / Δλ;
    let j;
    if (Δφ > 0) {
      j = (φ - φ0) / Δφ;
    } else {
      j = (φ0 - φ) / -Δφ;
    }

    const fi = Math.floor(i),
      ci = fi + 1;
    const fj = Math.floor(j),
      cj = fj + 1;

    if (grid[fj] && grid[cj]) {
      const rowF = grid[fj];
      const rowC = grid[cj];

      const g00 = rowF[fi];
      const g10 = rowF[ci];
      const g01 = rowC[fi];
      const g11 = rowC[ci];

      if (g00 != null && g10 != null && g01 != null && g11 != null) {
        return bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11);
      }
    }
    return null;
  };

  return { interpolate };
};

// 색상 스케일
const windIntensityColorScale = (step, maxWind) => {
  const colors = [];
  for (let j = 85; j <= 255; j += step) {
    colors.push(`rgba(${j},${j},${j},1)`);
  }
  colors.indexFor = m =>
    Math.floor((Math.min(m, maxWind) / maxWind) * (colors.length - 1));

  return colors;
};

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
    particles.current = Array.from({ length: particleCount }, () =>
      randomizeParticle(grid, toLonLat)
    );

    const evolve = () => {
      buckets.current.forEach(b => (b.length = 0));
      particles.current.forEach(p => {
        if (p.age > MAX_PARTICLE_AGE) {
          Object.assign(p, randomizeParticle(grid, toLonLat));
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

  const randomizeParticle = (grid, toLonLat) => {
    let x, y;
    let tries = 0;
    while (tries < 30) {
      x = Math.random() * width;
      y = Math.random() * height;
      const lonLat = toLonLat(x, y);
      if (!lonLat) {
        tries++;
        continue;
      }
      const wind = grid.interpolate(lonLat[0], lonLat[1]);
      if (wind && wind[2] != null) {
        return { x, y, age: Math.floor(Math.random() * MAX_PARTICLE_AGE) };
      }
      tries++;
    }
    // fallback
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      age: Math.floor(Math.random() * MAX_PARTICLE_AGE),
    };
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
