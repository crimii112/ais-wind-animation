import { useEffect, useState } from 'react';

import {
  FlexRowWrapper,
  FlexColWrapper,
  Input,
  Button,
} from '@/components/ui/common';
import CustomMultiSelect from '@/components/ui/custom-multiple-select';
import { Loading } from '@/components/ui/loading';
import { LineChart } from '@/components/ui/chart-line';
import { PieChart } from '@/components/ui/chart-pie';
import { BarChart } from '@/components/ui/chart-bar';
import ChartWrapper from '@/components/ui/chart-wrapper';

// 그래프 옵션 설정
const CHART_SETTINGS = {
  line: {
    onScale: true,
    axisSettings: [
      { label: 'Y-Left1', orientation: 'left', isAuto: true, min: 0, max: 100, selectedOptions: [] },
      { label: 'Y-Left2', orientation: 'left', isAuto: true, min: 0, max: 100, selectedOptions: [] },
      { label: 'Y-Right1', orientation: 'right', isAuto: true, min: 0, max: 100, selectedOptions: [] },
      { label: 'Y-Right2', orientation: 'right', isAuto: true, min: 0, max: 100, selectedOptions: [] },
    ],
  },
  pie: {
    onScale: false,
    axisSettings: [{ label: '물질', selectedOptions: [] }],
  },
  bar: {
    onScale: true,
    axisSettings: [{ label: '물질', isAuto: true, min: 0, max: 100, selectedOptions: [] }],
  },
};

/**
 * 그래프 프레임 컴포넌트
 * - 기본 line, pie, bar 그래프 타입에 사용
 * - 광화학/유해자동
 * @param {Object} datas - 데이터
 * @param {boolean} isLoading - 로딩 여부
 * @param {string} type - 그래프 타입
 * @param {string} title - 그래프 제목
 * @returns {React.ReactNode} 그래프 프레임 컴포넌트
 */
const ContentChartFrame = ({ datas, isLoading, type, title, setHighlightedRow }) => {
  const config = CHART_SETTINGS[type];

  const [pollutantList, setPollutantList] = useState([]); //multiSelect Options
  const [chartConfig, setChartConfig] = useState(null);
  const [axisSettings, setAxisSettings] = useState(config.axisSettings);

  useEffect(() => {
    if (!datas) return;

    setChartConfig(null);

    // option value, text 설정
    const options = datas.headList.map((value, idx) => ({
      value,
      text: datas.headNameList[idx],
    }));

    let startIndex = 2; // 날짜/측정소명 이후부터 시작
    if(title.includes('기상')) startIndex = 3;  // 기상자료검토의 경우 날짜/측정소명/코드 이후부터 시작
    if(title === '(선택)성분계산') startIndex = 3;
    
    // 'FLAG' 위치
    let flagIndex;
    if(title.includes('중금속')) {  //중금속의 경우 'FLAG'가 존재하지 않음
      flagIndex = 14;
    } else if(title.includes('기상')) {
      flagIndex = options.findIndex(option => option.value === 'flag');
    } else {
      flagIndex = options.findIndex(option => option.value === 'rflag');
    }

    setPollutantList(options.slice(startIndex, flagIndex));
  }, [datas, title]);

  const updateAxisSettings = (idx, updates) => {
    setAxisSettings(prev =>
      prev.map((axis, i) => (i === idx ? { ...axis, ...updates } : axis))
    );
  };

  // 그래프 그리기 버튼 클릭 이벤트
  const handleClickDrawChart = () => {
    setChartConfig({ datas, axisSettings, pollutantList });
  };

  return (
    <FlexColWrapper className="w-full p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      {isLoading ? (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Loading />
        </div>
      ) : (
        <>
          <FlexRowWrapper className="w-full gap-10 mb-4 items-start justify-between">
            <div className="mt-1.5 text-lg font-semibold text-gray-900 whitespace-nowrap p-1">
              그래프 설정
            </div>
            <FlexColWrapper className="w-full items-start justify-between gap-3">
              {axisSettings.map((axis, idx) => (
                <FlexRowWrapper key={axis.label} className="items-center gap-4">
                  <div className="w-20 text-center">
                    <span className="text-base font-medium text-gray-700">{axis.label}</span>
                  </div>
                  
                  <div className="flex-1">
                    <CustomMultiSelect
                      options={pollutantList}
                      setOutsideSelectedOptions={selected =>
                        updateAxisSettings(idx, {selectedOptions: selected})
                      }
                    />
                  </div>

                  {config.onScale && (
                    <FlexRowWrapper className="items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <Input
                          type="checkbox"
                          checked={axis.isAuto}
                          onChange={e => updateAxisSettings(idx, {isAuto: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        자동
                      </label>
                      
                      <Input
                        type="number"
                        value={axis.min}
                        onChange={e => updateAxisSettings(idx, {min: Number(e.target.value)})}
                        readOnly={axis.isAuto}
                        className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded read-only:bg-gray-50 text-center"
                      />
                      <span className="text-gray-400 pt-1.5">~</span>
                      <Input
                        type="number"
                        value={axis.max}
                        onChange={e => updateAxisSettings(idx, {max: Number(e.target.value)})}
                        readOnly={axis.isAuto}
                        className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded read-only:bg-gray-50 text-center"
                      />
                    </FlexRowWrapper>
                  )}
                </FlexRowWrapper>
              ))}
            </FlexColWrapper>
            <FlexRowWrapper className="gap-2 mt-1.5">
              <Button
                onClick={handleClickDrawChart}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
              >
                그래프 그리기
              </Button>
            </FlexRowWrapper>
          </FlexRowWrapper>

          {chartConfig && (
            <>
              <div className="w-full border-t border-gray-200" />
              <ChartWrapper title={title} >
                {type === 'line' && (
                  <LineChart
                    datas={chartConfig.datas}
                    axisSettings={chartConfig.axisSettings}
                    pollutantList={chartConfig.pollutantList}
                    setHighlightedRow={setHighlightedRow}
                  />
                )}
                {type === 'pie' && (
                  <PieChart
                    datas={chartConfig.datas}
                    axisSettings={chartConfig.axisSettings}
                    setHighlightedRow={setHighlightedRow}
                  />
                )}
                {type === 'bar' && (
                  <BarChart
                    datas={chartConfig.datas}
                    axisSettings={chartConfig.axisSettings}
                    pollutantList={chartConfig.pollutantList}
                    setHighlightedRow={setHighlightedRow}
                  />
                )}
              </ChartWrapper>
            </>
          )}
        </>
      )}
    </FlexColWrapper>
  );
};
export { ContentChartFrame };
