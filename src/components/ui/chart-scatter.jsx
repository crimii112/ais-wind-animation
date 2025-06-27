import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart as SChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * 산점도 그래프 컴포넌트
 * - 정해진 chartSettings 형식에 맞춰서 데이터만 보내면 그래프 그릴 수 있습니다. 아래 예시 참고.
 * @param {Object} chartSettings 그래프 설정
 * @param {function} setHighlightedRow 하이라이트 표시할 행의 rowKey 저장 함수
 * @example chartSettings = {xAxis: {dataKey: 'x', scale: 'log', domain: [10.6, 10000], ticks: [10, 100, 1000, 10000], label(optional): 'x축 라벨명'}, 
 *                           yAxis: {dataKey: 'y', label: 'dN/dlogdP (#/cm3)'}, 
 *                           data: {수도권: [{groupNm: '수도권', groupdate: '2015/01/01 01', type: "dN/dlogdP", x: 10.6, y: 100}, ...]}, 
 *                           tooltip: <CustomTooltip />}
 * @returns {React.ReactNode} 산점도 그래프 컴포넌트
 */


const ScatterChart = ({ chartSettings, setHighlightedRow }) => {
  const { xAxis, yAxis, data, tooltip } = chartSettings;

  /**
   * 데이터가 모두 NaN인지 체크하는 함수
   * - 데이터가 모두 NaN인 경우 축 생성이 아예 안되는 버그 해결
   * - domain 0~100으로 고정하면 축 생성됨
   * @param {string} axis 축 종류
   * @example axis = 'x' || 'y'
   * @returns {boolean} 데이터가 모두 NaN인 경우 true, 아니면 false
   */
  const isAllNaN = (axis) => {
    if (!data || typeof data !== 'object') return true;
    
    // 모든 그룹의 데이터를 하나의 배열로 합침
    const allData = Object.values(data).flat();
    if (allData.length === 0) return true;
    
    return allData.every(d => isNaN(d[axis]));
  };

  // 그래프 클릭 시 rowKey 설정 => 테이블에서 해당하는 행에 하이라이트 표시할 용도
  const handleChartClick = (e) => {
    const clicked = e?.activePayload?.[0]?.payload;
    if (clicked) {
      const rowKey = clicked.groupdate + '_' + clicked.groupNm;
      setHighlightedRow(rowKey);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={700}>
      <SChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }} onClick={handleChartClick}>
        <CartesianGrid strokeDasharray="3" />
        <XAxis
          type="number"
          name={xAxis.label}
          dataKey={xAxis.dataKey}
          scale={xAxis.scale}
          domain={isAllNaN('x') ? [0, 100] : xAxis.domain}
          ticks={xAxis.ticks}
          tick={{ fontSize: 12 }}
          label={{
            value: xAxis.label,
            position: 'bottom',
          }}
        />
        <YAxis
          type="number"
          name={yAxis.label}
          dataKey={yAxis.dataKey}
          label={{
            value: yAxis.label,
            angle: -90,
            position: 'insideLeft',
          }}
          tick={{ fontSize: 12 }}
          domain={isAllNaN('y') ? [0, 100] : [0, 'auto']}
        />
        {Object.entries(data).map(([group, groupData], idx) => (
          <Scatter
            key={group}
            name={group}
            data={groupData}
            fill={COLORS[idx % COLORS.length]}
            stroke="black"
          />
        ))}
        <Tooltip content={tooltip} />
        <Legend verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: 30,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
          }} 
        />
      </SChart>
    </ResponsiveContainer>
  );
};

export { ScatterChart };

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#a05195',
  '#1f77b4',
  '#d45087',
  '#2ca02c',
  '#17becf',
  '#f95d6a',
  '#9467bd',
  '#ff7c43',
  '#003f88',
  '#d62728',
  '#ffa600',
  '#8c564b',
  '#ff5733',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#4e79a7',
  '#f28e2c',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc949',
  '#af7aa1',
  '#b10026',
  '#666666',
  '#6a3d9a',
  '#e31a1c',
  '#b15928',
  '#1b9e77',
  '#084081',
  '#fc4e2a',
  '#7570b3',
  '#fd8d3c',
  '#0868ac',
  '#e7298a',
  '#feb24c',
  '#66a61e',
  '#fed976',
  '#2b8cbe',
  '#d95f02',
  '#e6ab02',
  '#4eb3d3',
];
