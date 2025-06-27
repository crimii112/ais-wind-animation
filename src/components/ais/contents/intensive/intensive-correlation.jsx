import React, { useState, useEffect } from 'react';

import { FlexRowWrapper, Button } from '@/components/ui/common';
import { SelectWithArrows } from '@/components/ui/select-box';
import CustomMultiSelect from '@/components/ui/custom-multiple-select';
import { IntensiveDataFrame } from './intensive-data-frame';
import { ContentScatterChartFrame } from '../../content-scatter-chart-frame';

/**
 * (단일)성분상관성검토 페이지
 *
 * - X축/Y축/측정소 선택 후 그래프 그리기
 * - 그래프는 산점도 사용
 * - 그래프 클릭 시 해당하는 행 테이블에서 하이라이트 표시 기능
 *
 * @param {string} type - 타입(auto, manual)
 * @returns {React.ReactNode}
 */

const IntensiveCorrelation = ({ type }) => {
  const config = CORRELATION_CONFIG[type]

  const [isLoading, setIsLoading] = useState(false);
  const [contentData, setContentData] = useState();

  const [chartOptionSettings, setChartOptionSettings] = useState({
    pollutant: [],
    groupNm: [],
  });
  const [chartSelectedOption, setChartSelectedOption] = useState({});
  const [chartSettings, setChartSettings] = useState();
  const [shouldRedrawChart, setShouldRedrawChart] = useState(false);

  const [highlightedRow, setHighlightedRow] = useState(null);

  const initSettings = () => {
    setChartSettings(undefined);
    setHighlightedRow(null);
  };

  const handleDataLoaded = data => {
    if (!data?.headList || !data?.headNameList || !data?.rstList2) return;

    setContentData(data);

    // headList 중 물질만 추출하여 옵션 설정
    // 물질 옵션은 3번째 인덱스부터 시작
    const pollutantOptions = data.headList.map((value, idx) => ({
            value,
            text: data.headNameList[idx],
          }))
          .slice(3)

    const groupNmOptions = data.rstList2.map(item => ({
          value: item.groupNm,
          text: item.groupNm,
        }))

    setChartOptionSettings({
      pollutant: pollutantOptions,
      groupNm: groupNmOptions,
    });
    setChartSelectedOption({
      x: pollutantOptions[0],
      y: pollutantOptions[0],
    });
  };

  // 그래프(산점도) 선택 옵션(측정소명) 변경 핸들러
  const setSelectedGroupNms = selectedOptions => {
    setChartSelectedOption(prev => ({ ...prev, groupNm: selectedOptions }));
  };

  // 그래프(산점도) 선택 옵션(x, y축) 변경 핸들러
  const handleChangeChartSelectedOption = e => {
    const selectedOption = chartOptionSettings.pollutant.find(
      option => option.value === e.target.value
    );
    setChartSelectedOption(prev => ({
      ...prev,
      [e.target.id]: selectedOption,
    }));
  };

  // 옵션 네비게이션 핸들러 메모이제이션
  const handleOptionNavigation = (axis, direction) => {
    if (!chartOptionSettings.pollutant.length) return;

    const currentOptions = chartOptionSettings.pollutant;
    const currentValue = chartSelectedOption[axis]?.value;
    const currentIndex = currentOptions.findIndex(
      option => option.value === currentValue
    );

    const newIndex =
      direction === 'up'
        ? currentIndex > 0
          ? currentIndex - 1
          : currentOptions.length - 1
        : currentIndex < currentOptions.length - 1
        ? currentIndex + 1
        : 0;

    setChartSelectedOption(prev => ({
      ...prev,
      [axis]: currentOptions[newIndex],
    }));
    setShouldRedrawChart(true);
  };

  // options 상태가 변경되고 shouldRedrawChart가 true일 때만 차트를 다시 그립니다
  useEffect(() => {
    if (shouldRedrawChart && Object.keys(chartSelectedOption).length > 0) {
      handleClickDrawChart();
      setShouldRedrawChart(false);
    }
  }, [chartSelectedOption, shouldRedrawChart]);

  // 그래프(산점도) 그리기 버튼 클릭 핸들러
  const handleClickDrawChart = () => {
    if (!contentData?.rstList) return;

    const rawData = contentData.rstList.filter(data =>
      chartSelectedOption.groupNm?.some(item => item.value === data.groupNm)
    );

    if (!rawData.length) {
      alert('그래프를 그릴 데이터가 없습니다. 조건을 확인해주세요.');
      return;
    }

    const processedData = rawData.map(item => ({
          groupdate: item.groupdate,
          groupNm: item.groupNm,
          x: parseFloat(item[chartSelectedOption.x.value]),
          y: parseFloat(item[chartSelectedOption.y.value]),
        }));

    const groupedData = processedData.reduce((acc, curr) => {
          acc[curr.groupNm] = acc[curr.groupNm] || [];
          acc[curr.groupNm].push(curr);
          return acc;
        }, {});

    console.log(groupedData);
    
    setChartSettings({
      xAxis: {
        dataKey: 'x',
        scale: 'auto',
        domain: [0, 'auto'],
        ticks: [],
        label: chartSelectedOption.x.text,
      },
      yAxis: {
        dataKey: 'y',
        label: chartSelectedOption.y.text,
      },
      data: groupedData,
      tooltip: CustomTooltip,
    });
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length || !payload[0].payload) return null;

    const { groupdate, groupNm, x, y } = payload[0].payload;
    const xLabel = payload[0].name;
    const yLabel = payload[1].name;

    return (
      <div className="bg-white p-2.5 border-1 border-gray-300 rounded-md">
        <p className="font-semibold pb-1">
          {groupdate} - {groupNm}
        </p>
        <p>{`${xLabel} : ${x}`}</p>
        <p>{`${yLabel} : ${y}`}</p>
      </div>
    );
  };

  return (
    <IntensiveDataFrame
      type={config.type}
      onDataLoaded={handleDataLoaded}
      onLoadingChange={setIsLoading}
      initSettings={initSettings}
      highlightedRow={highlightedRow}
    >
      <ContentScatterChartFrame
        isLoading={isLoading}
        title={config.title}
        chartSettings={chartSettings}
        setHighlightedRow={setHighlightedRow}
      >
        <FlexRowWrapper className="w-full gap-10 mb-4 items-stretch justify-between">
          <div className="mt-1.5 text-lg font-semibold text-gray-900 whitespace-nowrap p-1">
            그래프 설정
          </div>
          <FlexRowWrapper className="w-full items-stretch justify-start gap-3">
            <span className="flex flex-col items-center justify-center">
              X :{' '}
            </span>
            <SelectWithArrows
              id="x"
              value={chartSelectedOption.x?.value}
              options={chartOptionSettings.pollutant}
              onChange={handleChangeChartSelectedOption}
              onNavigate={direction => handleOptionNavigation('x', direction)}
            />
            <span className="flex flex-col items-center justify-center">
              Y :{' '}
            </span>
            <SelectWithArrows
              id="y"
              value={chartSelectedOption.y?.value}
              options={chartOptionSettings.pollutant}
              onChange={handleChangeChartSelectedOption}
              onNavigate={direction => handleOptionNavigation('y', direction)}
            />
            <span className="flex flex-col items-center justify-center">
              측정소 :{' '}
            </span>
            <CustomMultiSelect
              className="w-100"
              options={chartOptionSettings.groupNm}
              setOutsideSelectedOptions={setSelectedGroupNms}
            />
          </FlexRowWrapper>
          <Button
            className="w-fit px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
            onClick={handleClickDrawChart}
          >
            그래프 그리기
          </Button>
        </FlexRowWrapper>
      </ContentScatterChartFrame>
    </IntensiveDataFrame>
  );
};

export { IntensiveCorrelation };

const CORRELATION_CONFIG = {
  auto: {
    type: 'autoTimeCorrelation',
    title: '자동-(단일)성분상관성검토',
  },
  manual: {
    type: 'manualCorrelation',
    title: '수동-(단일)성분상관성검토',
  },
};
