/**
 * 두 색(start, end) 사이를 선형으로 보간(interpolate)해서 i 비율(0~1) 위치의 색을 구하는 함수를 만들어 반환
 *
 * @param {Array} start
 * @param {Array} end
 * @returns {function} (i, a) => [r, g, b, a] 형식의 보간 함수
 */
const colorInterpolator = (start, end) => {
  const r = start[0],
    g = start[1],
    b = start[2];
  const Δr = end[0] - r,
    Δg = end[1] - g,
    Δb = end[2] - b;
  return (i, a) => {
    return [
      Math.floor(r + i * Δr),
      Math.floor(g + i * Δg),
      Math.floor(b + i * Δb),
      a,
    ];
  };
};

const τ = 2 * Math.PI;
/**
 * 무지개처럼 보이는 트라이포일(trefoil) 색 공간에서 색상 스타일을 생성합니다.
 * HSV와는 조금 다르지만, 보기 좋은 스펙트럼을 만들어냅니다.
 *
 * @param hue 색상 회전 값. 범위는 [0, 1]
 * @param a 알파(투명도) 값. 범위는 [0, 255]
 * @returns {Array} [r, g, b, a] 형식의 배열
 */
const sinebowColor = (hue, a) => {
  let rad = (hue * τ * 5) / 6; // hue 값 [0, 1]을 라디안 [0, 5/6τ] 범위로 변환합니다.
  rad *= 0.75;

  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const r = Math.floor(Math.max(0, -c) * 255);
  const g = Math.floor(Math.max(s, 0) * 255);
  const b = Math.floor(Math.max(c, 0, -s) * 255);
  return [r, g, b, a];
};

const BOUNDARY = 0.45;
const fadeToWhite = colorInterpolator(sinebowColor(1.0, 0), [255, 255, 255]);
/**
 * 0 <= i <= j 구간에서는 sinebow 색상을 보간(interpolate)하고,
 * j < i <= 1 구간에서는 흰색으로 서서히 전환(fade)합니다.
 *
 * @param i [0, 1] 범위의 숫자
 * @param a [0, 255] 범위의 알파(투명도) 값
 * @returns {Array} [r, g, b, a] 형식의 배열
 */
const extendedSinebowColor = (i, a) => {
  return i <= BOUNDARY
    ? sinebowColor(i / BOUNDARY, a)
    : fadeToWhite((i - BOUNDARY) / (1 - BOUNDARY), a);
};

const asColorStyle = (r, g, b, a) => {
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
};
/**
 * @returns {Array} 바람 색상 배열과, 바람 세기를 색상 스케일의 인덱스로 변환하는
 * 메서드인 indexFor를 포함한 배열을 반환합니다.
 */
const windIntensityColorScale = (step, maxWind) => {
  const result = [];
  for (let j = 85; j <= 255; j += step) {
    result.push(asColorStyle(j, j, j, 1.0));
  }
  result.indexFor = m => {
    return Math.floor((Math.min(m, maxWind) / maxWind) * (result.length - 1));
  };

  return result;
};

export { extendedSinebowColor, windIntensityColorScale };
