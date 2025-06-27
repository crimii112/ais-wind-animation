import { useState, useEffect } from 'react';

import { FlexColWrapper, FlexRowWrapper, Button } from '@/components/ui/common';
import { SelectWithArrows } from '@/components/ui/select-box';
import { Loading } from '@/components/ui/loading';
import { IntensiveDataFrame } from './intensive-data-frame';
import { PieChart } from '@/components/ui/chart-pie';
import ChartWrapper from '@/components/ui/chart-wrapper';

/**
 * 자동-(단일)성분파이그래프 페이지
 *
 * - 측정일자;측정소 선택 후 그래프 그리기
 * - <PieChart /> 컴포넌트 사용
 *
 * @returns {React.ReactNode}
 */

const IntensivePieGraph = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [contentData, setContentData] = useState(null);

  const [chartOptionSettings, setChartOptionSettings] = useState({
    groupDateAndNm: [],
  });
  const [chartSelectedOption, setChartSelectedOption] = useState(null);
  const [chartDatas, setChartDatas] = useState(null);
  const [axisSettings, setAxisSettings] = useState(null);

  const [shouldRedrawChart, setShouldRedrawChart] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState(null);

  const initSettings = () => {
    setChartDatas(null);
    setHighlightedRow(null);
  };

  // 데이터 로드 시 데이터 가공
  const handleDataLoaded = data => {
    if (!data?.headList || !data?.headNameList || !data?.rstList2) return;
    if (data.rstList[0] === 'NO DATA') return;

    setContentData(data);

    // 그래프 설정 옵션 설정(측정일자;측정소)
    const groupDateAndNmOptions = data.rstList.map(item => ({
      value: item.groupdate + ';' + item.groupNm,
      text: item.groupdate + ';' + item.groupNm,
    }));

    setChartOptionSettings({ groupDateAndNm: groupDateAndNmOptions });
    setChartSelectedOption(groupDateAndNmOptions[0]);
  };

  // 그래프(산점도) 선택 옵션(x, y축) 변경 핸들러
  const handleChangeChartSelectedOption = e => {
    const selectedOption = chartOptionSettings.groupDateAndNm.find(
      option => option.value === e.target.value
    );
    setChartSelectedOption(selectedOption);
  };

  // 옵션 네비게이션 핸들러
  const handleOptionNavigation = direction => {
    if (!chartOptionSettings.groupDateAndNm.length) return;

    const currentOptions = chartOptionSettings.groupDateAndNm;
    const currentValue = chartSelectedOption?.value;
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

    setChartSelectedOption(currentOptions[newIndex]);
    setShouldRedrawChart(true);
  };

  // options 상태가 변경되고 shouldRedrawChart가 true일 때만 차트를 다시 그립니다
  useEffect(() => {
    if (shouldRedrawChart && Object.keys(chartSelectedOption).length > 0) {
      handleClickDrawChart();
      setShouldRedrawChart(false);
    }
  }, [chartSelectedOption, shouldRedrawChart]);

  const handleClickDrawChart = () => {
    const chartData = contentData.rstList.filter(
      item =>
        item.groupdate === chartSelectedOption.value.split(';')[0] &&
        item.groupNm === chartSelectedOption.value.split(';')[1]
    );
    setChartDatas({ rstList: chartData });

    const axisSettings = [
      {
        label: '물질',
        selectedOptions: [
          { value: 'amSul', text: 'AM_SUL' },
          { value: 'amNit', text: 'AM_NIT' },
          { value: 'om', text: 'OM' },
          { value: 'ec', text: 'EC' },
          { value: 'etc', text: 'ETC' },
        ],
      },
    ];
    setAxisSettings(axisSettings);
  };

  return (
    <IntensiveDataFrame
      type="autoPieGraph"
      onDataLoaded={handleDataLoaded}
      onLoadingChange={setIsLoading}
      initSettings={initSettings}
      highlightedRow={highlightedRow}
    >
      <FlexColWrapper className="w-full p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        {isLoading ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <Loading />
          </div>
        ) : (
          <FlexColWrapper className="w-full h-full">
            <FlexRowWrapper className="w-full gap-10 mb-4 items-stretch justify-between">
              <div className="mt-1.5 text-lg font-semibold text-gray-900 whitespace-nowrap p-1">
                그래프 설정
              </div>
              <FlexRowWrapper className="w-full items-stretch justify-start gap-3">
                <span className="flex flex-col items-center justify-center">
                  측정일자;측정소 :{' '}
                </span>
                <SelectWithArrows
                  id="groupDateAndNm"
                  value={chartSelectedOption?.value}
                  options={chartOptionSettings?.groupDateAndNm}
                  onChange={handleChangeChartSelectedOption}
                  onNavigate={direction => handleOptionNavigation(direction)}
                />
              </FlexRowWrapper>
              <Button
                className="w-fit px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
                onClick={handleClickDrawChart}
              >
                그래프 그리기
              </Button>
            </FlexRowWrapper>
            {chartDatas && axisSettings && (
              <>
                <div className="w-full border-t border-gray-200" />
                <ChartWrapper title='자동-(단일)성분파이그래프'>
                  <PieChart
                    datas={chartDatas}
                    axisSettings={axisSettings}
                    setHighlightedRow={setHighlightedRow}
                  />
                </ChartWrapper>
              </>
            )}
          </FlexColWrapper>
        )}
      </FlexColWrapper>
    </IntensiveDataFrame>
  );
};

export { IntensivePieGraph };
