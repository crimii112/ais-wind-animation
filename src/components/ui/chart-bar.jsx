import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart as BChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

import { FlexRowWrapper } from './common';


/**
 * 바 차트 컴포넌트
 * - 정해진 datas, axisSettings 형식에 맞춰서 데이터만 보내면 그래프 그릴 수 있습니다. 아래 예시 참고.
 * - X축은 측정일자(groupdate) 고정, Y축은 선택한 물질 데이터 값 표시
 * @param {Object} datas - 데이터(rstList 형태 고정)
 * @param {Object} axisSettings - 축 설정 
 * @param {Object} pollutantList - 물질 리스트 
 * @example datas = [rstList: [{groupdate: '2024-01-01', groupNm: '인천.강화군.석모리', data01: 10, data02: 20, ..., rflag: null, ...}, ...], ...]
 * @example axisSettings = [{ label: '물질', selectedOptions: [{value: 'data04', text: '4)Propylene'}] }]
 * @example pollutantList = [{value: 'data01', text: '1)Ethane'}, {value: 'data02', text: '2)Ethylene'}]
 * @returns {React.ReactNode} 바 차트 컴포넌트
 */


const BarChart = ({ datas, axisSettings, pollutantList, setHighlightedRow }) => {
  const [processedData, setProcessedData] = useState([]); // 처리된 데이터([{groupdate: '2015/01/01 01', '인천.강화군.석모리-data04': 10, '인천.남동구.구월동-data04': 20, ...}])
  const colorMapRef = useRef({}); // 여기에 색상 저장
  const colorIndexRef = useRef(0);

  // 그래프 타입(['default', 'stack', 'stack-group', '100-stack', '100-stack-group'])
  const [graphType, setGraphType] = useState('default'); 

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

    // groupdate가 같은 데이터끼리 묶기
    const newMap = {};
    clonedData.forEach(data => {
      const groupdate = data.groupdate;
      const groupNm = data.groupNm;

      if (!newMap[groupdate]) newMap[groupdate] = { groupdate: groupdate };

      Object.keys(data).forEach(key => {
        axisSettings[0].selectedOptions.forEach(option => {
          if (key === option.value) {
            const newKey = `${groupNm}-${key}`;
            newMap[groupdate][newKey] = data[key];
          }
        });
      });
    });

    setProcessedData(Object.values(newMap));
  }, [datas, pollutantList, graphType, axisSettings]);

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

  // 그래프 타입 변경 핸들러
  const handleChangeGraphType = e => {
    const selectedType = e.target.value;
    setGraphType(selectedType);
  };

  // 툴팁 커스텀(null값 -> '-'로 표시)
  const CustomTooltip = ({ active, payload, label }) => {
    const dataKeys = Object.keys(processedData[0]);
    const allKeys = dataKeys.filter(key => key !== 'groupdate');

    const payloadDataKeys = payload.map(p => p.dataKey);

    const difference = allKeys.filter(key => !payloadDataKeys.includes(key));

    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2.5 border-1 border-gray-300 rounded-md">
          <p className="pb-2">
            <strong>{label}</strong>
          </p>
          {difference &&
            difference.map(key => {
              let newKey;
              axisSettings[0].selectedOptions.forEach(option => {
                if (key.includes(option.value)) {
                  newKey = key.replace(option.value, option.text);
                }
              });

              return (
                <p key={key} style={{ color: getColorByKey(key) }}>
                  {newKey} : -
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
    }

    return null;
  };

  // 바 클릭 시 rowKey 설정 => 테이블에서 해당하는 행에 하이라이트 표시할 용도
  const handleBarClick = (data) => {

    if (data && data.groupdate && data.tooltipPayload) {
      // 클릭된 Bar의 name에서 groupNm 추출
      const name = data.tooltipPayload[0].name;

      if (name) {
        const groupNm = name.split(' - ')[0];
        const rowKey = data.groupdate + '_' + groupNm;
        setHighlightedRow(rowKey);
      }
    }
  };

  return (
    <ResponsiveContainer width="100%" height={600}>
      <FlexRowWrapper className="justify-end gap-3 mr-3">
        {chartTypeItems.map((item, idx) => (
          <label key={item.value}>
            <input
              type="radio"
              name="type"
              value={item.value}
              className="mr-1"
              onChange={handleChangeGraphType}
              defaultChecked={idx === 0 ? true : false}
            />
            {item.label}
          </label>
        ))}
      </FlexRowWrapper>
      <BChart
        data={processedData}
        margin={{ top: 20, right: 30, bottom: 30, left: 10 }}
        barGap={0}
        stackOffset={graphType.startsWith('100-stack') ? 'expand' : 'none'} // 100% 스택 그래프 타입일 경우 스택 오프셋 설정
      >
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
        {axisSettings.map(axis => (
          <YAxis
            key={axis.label}
            type="number"
            domain={
              graphType.startsWith('100-stack')  // 100% 스택 그래프 타입일 경우 도메인 설정
                ? [0, 1]
                : axis.isAuto
                ? ['auto', 'auto']
                : [axis.min, axis.max]
            }
            tickCount={10}
            fontSize={12}
            allowDataOverflow={true}
            tickFormatter={value => {
              return graphType.startsWith('100-stack')  // 100% 스택 그래프 타입일 경우 비율로 표시
                ? value * 100 + '%'
                : value;
            }}
          />
        ))}

        <Tooltip content={CustomTooltip} />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: 40,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        />

        {datas.rstList2.map(item =>
          axisSettings[0].selectedOptions.map(option => {
            const key = `${item.groupNm}-${option.text}`;
            return (
              <Bar
                key={key}
                data={processedData}
                dataKey={`${item.groupNm}-${option.value}`}
                name={`${item.groupNm} - ${option.text}`}
                fill={getColorByKey(`${item.groupNm}-${option.value}`)}
                stackId={
                  graphType === 'default'
                    ? undefined
                    : graphType.includes('stack-group')
                    ? item.groupNm
                    : 'stackgroup'
                }
                onClick={handleBarClick}
              />
            );
          })
        )}
      </BChart>
    </ResponsiveContainer>
  );
};
export { BarChart };

const chartTypeItems = [
  { value: 'default', label: '기본' },
  { value: 'stack', label: '누적 스택' },
  { value: 'stack-group', label: '누적 스택(그룹)' },
  { value: '100-stack', label: '100% 스택' },
  { value: '100-stack-group', label: '100% 스택(그룹)' },
];

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
