import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  LineChart as LChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';


/**
 * 시계열 그래프 컴포넌트
 * - 정해진 datas, axisSettings, pollutantList 형식에 맞춰서 데이터만 보내면 그래프 그릴 수 있습니다. 아래 예시 참고.
 * - X축은 측정일자(groupdate) 고정, Y축은 선택한 물질 데이터
 * @param {Object} datas - 데이터(rstList 형태 고정)
 * @param {Object} axisSettings - 축 설정 
 * @param {Object} pollutantList - 물질 리스트 
 * @example datas = [rstList: [{groupdate: '2024-01-01', groupNm: '인천.강화군.석모리', data01: 10, data02: 20, ..., rflag: null, ...}, ...], ...]
 * @example axisSettings = [{label: 'Y-Left1', orientation: 'left', isAuto: true, min: 0, max: 100, selectedOptions: [{ value:'data06', text:'6)n-Butane' }]}, 
 *           {label: 'Y-Left2', orientation: 'left', isAuto: true, min: 0, max: 100, selectedOptions: []},
 *           {label: 'Y-Right1', orientation: 'right', isAuto: true, min: 0, max: 100, selectedOptions: []},
 *           {label: 'Y-Right2', orientation: 'right', isAuto: true, min: 0, max: 100, selectedOptions: []}]
 * @example pollutantList = [{value: 'data01', text: '1)Ethane'}, {value: 'data02', text: '2)Ethylene'}]
 * @returns {React.ReactNode} 시계열 그래프 컴포넌트
 */


const LineChart = ({ datas, axisSettings, pollutantList, setHighlightedRow }) => {
  const [processedData, setProcessedData] = useState([]);
  const colorMapRef = useRef({}); // 여기에 색상 저장
  const colorIndexRef = useRef(0);

  // 데이터 처리
  useEffect(() => {
    if (!datas || !datas.rstList) return;

    // 데이터 clone해서 타입 변환(string -> float)
    // clone 안하면 데이터 원본이 변경되어 table에 영향을 미치게 됨
    const clonedData = datas.rstList.map(res => {
      const newRes = { ...res };
      pollutantList.forEach(option => {
        const rawVal = newRes[option.value];
        const parsed = parseFloat(rawVal);
        newRes[option.value] =
          rawVal !== undefined && rawVal !== '' && !isNaN(parsed)
            ? parsed
            : null;
      });

      return newRes;
    });

    setProcessedData(clonedData);

    // 선택한 측정소+물질 조합 모두 추출
    const groupNmList = datas.rstList2.flatMap(el => el.groupNm);
    const selectedOptionsList = axisSettings.flatMap(axis => axis.selectedOptions.map(option => option.text));
    const allKeys = groupNmList.flatMap(groupNm => 
      selectedOptionsList.map(option => `${groupNm}-${option}`)
    );

    allKeys.forEach(key => getColorByKey(key));
  }, [datas, pollutantList]);

  // Line 색상 지정
  const getNextColor = () => {
    const color = COLORS[colorIndexRef.current % COLORS.length];
    colorIndexRef.current += 1;
    return color;
  };
  const getColorByKey = key => {
    if (!colorMapRef.current[key]) {
      colorMapRef.current[key] = getNextColor();
    }
    return colorMapRef.current[key];
  };

  // 그래프 클릭 시 rowKey 설정 => 테이블에서 해당하는 행에 하이라이트 표시할 용도
  const handleActiveDotClick = (e, payload) => {
    const rowKey = payload.payload.groupdate + '_' + payload.payload.groupNm;
    setHighlightedRow(rowKey);
  };

  if (
    !datas ||
    !datas.rstList ||
    !datas.rstList2 ||
    processedData.length === 0
  ) {
    return (
      <div className="flex flex-row w-full items-center justify-center py-5 text-xl font-semibold">
        그래프를 그릴 데이터가 없습니다.
      </div>
    );
  }

  // 툴팁 커스텀(null값 -> '-'로 표시)
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length || !payload[0].payload) return null;

    // 선택한 측정소+물질 조합 모두 추출
    const groupNmList = datas.rstList2.flatMap(el => el.groupNm);
    const selectedOptionsList = axisSettings.flatMap(axis => axis.selectedOptions.map(option => option.text));
    const allKeys = groupNmList.flatMap(groupNm => 
      selectedOptionsList.map(option => `${groupNm} - ${option}`)
    );

    // 데이터가 있는 측정소+물질 조합
    const payloadNames = payload.map(p => p.name);

    // 데이터가 없는 측정소+물질 조합 추출
    const difference = allKeys.filter(key => !payloadNames.includes(key));

    return (
      <div className="bg-white p-2.5 border-1 border-gray-300 rounded-md">
        <p className="pb-2">
          <strong>{label}</strong>
        </p>
        {difference &&
          difference.map((key, index) => {
            return (
              <p key={key + index} style={{ color: getColorByKey(key) }}>
                {key} : -
              </p>
            );
          })}
        {payload.map((entry, index) => {
          return (
            <p key={index} style={{ color: entry.color }}>
              {entry.name} : {entry.value != null ? entry.value : '-'}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={700}>
      <LChart
        data={processedData}
        margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
      >
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: 40,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <CartesianGrid strokeDasharray="3" vertical={false} />
        <XAxis
          dataKey="groupdate"
          allowDuplicatedCategory={false}
          label={{
            value: '측정일자',
            position: 'bottom',
            fontWeight: 'bold',
          }}
          tick={{ fontSize: 12 }}
        />
        {axisSettings.map(
          axis =>
            axis.selectedOptions.length !== 0 && (
              <YAxis
                key={axis.label}
                yAxisId={`${axis.label}`}
                orientation={`${axis.orientation}`}
                type="number"
                domain={
                  axis.isAuto ? ['0', 'auto'] : [axis.min, axis.max]
                }
                fontSize={12}
                label={{
                  value: axis.selectedOptions.map(option => ' ' + option.text),
                  angle: -90,
                  position:
                    axis.orientation === 'left' ? 'insideLeft' : 'insideRight',
                  fontWeight: 'bold',
                  dx: axis.orientation === 'left' ? 10 : -10,
                  dy: axis.orientation === 'left' ? 50 : -50,
                }}
                allowDataOverflow={true}
                tickCount={10}
              />
            )
        )}
        {datas.rstList2.map(el =>
          axisSettings.map(axis =>
            axis.selectedOptions.map(option => {
              const key = `${el.groupNm} - ${option.text}`;
              return (
                <Line
                  key={key}
                  data={processedData.filter(
                    data => data.groupNm === el.groupNm
                  )}
                  yAxisId={axis.label}
                  dataKey={option.value}
                  name={key}
                  stroke={getColorByKey(key)}
                  connectNulls={false}
                  activeDot={{
                    onClick: handleActiveDotClick
                  }}
                />
              );
            })
          )
        )}
      </LChart>
    </ResponsiveContainer>
  );
};

export { LineChart };

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#003f5c',
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
