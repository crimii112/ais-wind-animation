import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart as PChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';


/**
 * 파이 차트 컴포넌트
 * - 정해진 datas, axisSettings 형식에 맞춰서 데이터만 보내면 그래프 그릴 수 있습니다. 아래 예시 참고.
 * @param {Object} datas - 데이터(rstList 형태 고정)
 * @param {Object} axisSettings - 축 설정 
 * @example datas = [rstList: [{groupdate: '전체', groupNm: '전체', data01: 10, data02: 20, ..., rflag: null, ...}], ...]
 * @example axisSettings = [{ label: '물질', selectedOptions: [{value: 'data04', text: '4)Propylene'}] }]
 * @returns {React.ReactNode} 파이 차트 컴포넌트
 */


const PieChart = ({ datas, axisSettings, setHighlightedRow }) => {
  const [processedData, setProcessedData] = useState([]);  // 처리된 데이터([{name: '4)Propylene', value: 10}])
  const [totalSum, setTotalSum] = useState(0);  // 선택한 데이터 값 총합

  // 데이터 처리
  useEffect(() => {
    setTotalSum(0); // totalSum 초기화
    setProcessedData([]); // processedData 초기화

    if (!datas || !datas.rstList) return;

    const selectedOptions = axisSettings[0].selectedOptions;
    const clonedData = { ...datas.rstList[0] };
    
    const chartData = selectedOptions.map(option => {
      const rawVal = clonedData[option.value];
      const parsed = parseFloat(rawVal);
      clonedData[option.value] =
        rawVal !== undefined && rawVal !== '' && !isNaN(parsed) ? parsed : null;

      const sum = !isNaN(parsed) ? Math.abs(parsed) : 0;
      setTotalSum(prevSum => prevSum + sum); 

      return {
        name: option.text,
        value: Math.abs(clonedData[option.value]), // 절대값 사용
        isNegative: parsed < 0 // 음수 여부 저장
      };
    });

    setProcessedData(chartData);
  }, [datas, axisSettings]);

  if (
    !datas ||
    !datas.rstList ||
    processedData.length === 0
  ) {
    return (
      <div className="flex flex-row w-full items-center justify-center py-5 text-xl font-semibold">
        그래프를 그릴 데이터가 없습니다.
      </div>
    );
  }

  // 라벨 커스텀(비율 표시)
  const RADIAN = Math.PI / 180;
  const customizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    payload,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const calculatedPercent = ((Math.abs(payload.value)/ totalSum) * 100).toFixed(1);

    return (
      <text
        x={x}
        y={y}
        fill="black"
        className="font-semibold"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="middle"
      >
        {`${payload.name}: ${calculatedPercent}%`}
      </text>
    );
  };

  // 툴크 커스텀(값 표시)
  const customizedTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { value, isNegative } = payload[0].payload;
      const displayValue = isNegative ? -value : value;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 shadow-lg">
          <p className="text-base font-semibold">Value: {displayValue}</p>
        </div>
      );
    }
    return null;
  };

  const handleCellClick = (entry, index) => {
    if (entry) {
      const rowKey = datas.rstList[0].groupdate + '_' + datas.rstList[0].groupNm;
      setHighlightedRow(rowKey);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={600}>
      <PChart>
        <Pie
          data={processedData}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={250}
          label={customizedLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {processedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              onClick={() => handleCellClick(entry, index)}
            />
          ))}
        </Pie>
        <Tooltip content={customizedTooltip} />
      </PChart>
    </ResponsiveContainer>
  );
};
export { PieChart };

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
