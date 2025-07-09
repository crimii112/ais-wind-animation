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

/**
 * JSON으로 변환한 파일 → 위경도 격자 배열(grid) + 보간(interpolate) 함수로 만드는 역할
 * */
const buildGrid = (header, uData, vData) => {
  const λ0 = header.lo1,
    φ0 = header.la1;
  const Δλ = header.dx,
    Δφ = header.dy;
  const ni = header.nx,
    nj = header.ny;
  const date = new Date(header.refTime);

  let grid = [],
    p = 0;
  const isContinuous = Math.floor(ni * Δλ) >= 360;
  for (let j = 0; j < nj; j++) {
    const row = [];
    const jj = nj - 1 - j;
    for (let i = 0; i < ni; i++, p++) {
      row.push([uData[p], vData[p]]);
    }
    if (isContinuous) row.push(row[0]);
    grid[jj] = row;
  }

  console.log(grid);

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

    let row;
    if ((row = grid[fj])) {
      const g00 = row[fi];
      const g10 = row[ci];
      if (
        g00 !== null &&
        g00 !== undefined &&
        g10 !== null &&
        g10 !== undefined &&
        (row = grid[cj])
      ) {
        const g01 = row[fi];
        const g11 = row[ci];
        if (
          g01 !== null &&
          g01 !== undefined &&
          g11 !== null &&
          g11 !== undefined
        ) {
          return bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }

    return null;
  };

  return { interpolate };
};

export { buildGrid };
