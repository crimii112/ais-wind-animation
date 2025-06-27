import { useState, useEffect } from 'react';

import { FlexRowWrapper, Button } from '@/components/ui/common';
import { SelectWithArrows } from '@/components/ui/select-box';
import CustomMultiSelect from '@/components/ui/custom-multiple-select';
import { IntensiveDataFrame } from './intensive-data-frame';
import { ContentScatterChartFrame } from '../../content-scatter-chart-frame';
import { ContentChartFrame } from '@/components/ais/content-chart-frame';

/**
 * (단일)입경크기분포 페이지
 *
 * - 측정일자/TYPE/측정소 선택 후 그래프 그리기
 * - 그래프는 산점도 사용, X축 log 스케일 적용
 *
 * @returns {React.ReactNode}
 */

const IntensivePsize = ({type}) => {
  const [contentData, setContentData] = useState();
  const [isLoading, setIsLoading] = useState(false);

  // 그래프 데이터 설정
  const [optionSettings, setOptionSettings] = useState({
    groupdate: [],
    type: [],
    groupNm: [],
  }); // 선택한 그래프 옵션들
  const [options, setOptions] = useState({}); // select box에 들어갈 옵션들
  const [chartSettings, setChartSettings] = useState();

  const [highlightedRow, setHighlightedRow] = useState();
  const [shouldRedrawChart, setShouldRedrawChart] = useState(false);

  const initSettings = () => {
    setChartSettings(undefined);
    setHighlightedRow(null);
  };

  const handleDataLoaded = data => {
    setContentData(data);

    // 그래프 설정 옵션 설정
    const groupdate = [...new Set(data.rstList.map(item => item.groupdate))];
    const groupdateOptions = groupdate.map(item => {
      return {
        value: item,
        text: item,
      };
    });
    const type = [...new Set(data.rstList.map(item => item.type))];
    const typeOptions = type.map(item => {
      return {
        value: item,
        text: item,
      };
    });
    const groupNm = data.rstList2.map(item => ({
      value: item.groupNm,
      text: item.groupNm,
    }));

    const poll = data.headNameList.slice(3);

    setOptions({
      groupdate: groupdate[0],
      type: type[0],
      groupNm: groupNm[0],
    });

    setOptionSettings({
      groupdate: groupdateOptions,
      type: typeOptions,
      groupNm,
    });
  };

  const setSelectedGroupNms = selectedOptions => {
    setOptions(prev => ({ ...prev, groupNm: selectedOptions }));
  };

  // 툴팁 커스텀
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { groupNm, x, type, y } = payload[0].payload;
      return (
        <div className="bg-white p-2.5 border-1 border-gray-300 rounded-md">
          <p className="font-semibold pb-1">{groupNm}</p>
          <p>{`μg/m³ : ${x}`}</p>
          <p>{`${type} : ${y}`}</p>
        </div>
      );
    }
    return null;
  };

  // 그래프 그리기 버튼 클릭 핸들러
  const handleClickDrawChart = () => {
    if (!contentData?.rstList) return;

    const rawData = contentData.rstList.filter(
      data =>
        data.groupdate === options.groupdate &&
        options.groupNm.some(item => item.value === data.groupNm) &&
        data.type === options.type
    );

    if (!rawData.length) {
      alert('그래프를 그릴 데이터가 없습니다. 조건을 확인해주세요.');
      return;
    }

    const processedData = rawData.flatMap(
      ({ groupdate, groupNm, type, ...dataPoints }) =>
        Object.entries(dataPoints)
          .filter(([key, _]) => !isNaN(key))
          .map(([key, value]) => ({
            groupdate,
            groupNm,
            type,
            x: Number(key) / 10,
            y: parseFloat(value),
          }))
    );

    const groupedData = processedData.reduce((acc, curr) => {
      acc[curr.groupNm] = acc[curr.groupNm] || [];
      acc[curr.groupNm].push(curr);
      return acc;
    }, {});

    setChartSettings({
      xAxis: {
        dataKey: 'x',
        scale: 'log',
        domain: [10.6, 10000],
        ticks: [10, 100, 1000, 10000],
      },
      yAxis: {
        dataKey: 'y',
        label: `${options.type} (${typeUnits[options.type]})`,
      },
      data: groupedData,
      tooltip: CustomTooltip,
    });

    
  };

  // Select Box 옵션 이동(up/down) 핸들러
  const handleOptionNavigation = (optionName, direction) => {
    if (optionSettings[optionName].length === 0) return;

    const currentOptions = optionSettings[optionName];
    const currentValue = options[optionName];
    const currentIndex = currentOptions.findIndex(
      option => option.value === currentValue
    );

    let newIndex;
    if (direction === 'up') {
      newIndex =
        currentIndex > 0 ? currentIndex - 1 : currentOptions.length - 1;
    } else {
      newIndex =
        currentIndex < currentOptions.length - 1 ? currentIndex + 1 : 0;
    }

    const newOption = currentOptions[newIndex];
    setOptions(prev => ({ ...prev, [optionName]: newOption.value }));
    setShouldRedrawChart(true);
  };

  // options 상태가 변경되고 shouldRedrawChart가 true일 때만 차트를 다시 그립니다
  useEffect(() => {
    if (shouldRedrawChart && Object.keys(options).length > 0) {
      handleClickDrawChart();
      setShouldRedrawChart(false);
    }
  }, [options, shouldRedrawChart]);

  return (
    <IntensiveDataFrame
      type={type}
      onDataLoaded={handleDataLoaded}
      onLoadingChange={setIsLoading}
      initSettings={initSettings}
      highlightedRow={highlightedRow}
    >
      {type === 'psize' && (  //입경크기분포 그래프 
        <ContentScatterChartFrame
          isLoading={isLoading}
          title="입경크기분포"
          chartSettings={chartSettings}
          setHighlightedRow={setHighlightedRow}
        >
          <FlexRowWrapper className="w-full gap-10 mb-4 items-center justify-between">
            <div className="text-lg font-semibold text-gray-900 whitespace-nowrap p-1">
              그래프 설정
            </div>
            <FlexRowWrapper className="w-full items-stretch justify-start gap-3">
              <span className="flex flex-col items-center justify-center">
                측정일자 :{' '}
              </span>
              <SelectWithArrows
                id="groupdate"
                value={options.groupdate}
                options={optionSettings.groupdate}
                onChange={e =>
                  setOptions(prev => ({ ...prev, groupdate: e.target.value }))
                }
                onNavigate={direction =>
                  handleOptionNavigation('groupdate', direction)
                }
              />
              <span className="flex flex-col items-center justify-center">
                TYPE :{' '}
              </span>
              <SelectWithArrows
                id="type"
                value={options.type}
                options={optionSettings.type}
                onChange={e =>
                  setOptions(prev => ({ ...prev, type: e.target.value }))
                }
                onNavigate={direction =>
                  handleOptionNavigation('type', direction)
                }
              />
              <span className="flex flex-col items-center justify-center">
                측정소 :{' '}
              </span>
              <CustomMultiSelect
                className="w-100"
                options={optionSettings?.groupNm}
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
      )}
      {type === 'psizeCal' && (  //(선택)성분계산 그래프 
        <ContentChartFrame
          datas={contentData}
          isLoading={isLoading}
          type='line'
          title="(선택)성분계산"
          setHighlightedRow={setHighlightedRow}
        />
      )}
    </IntensiveDataFrame>
  );
};

export { IntensivePsize };

const typeUnits = {
  'dN/dlogdP': '#/cm3',
  'dS/dlogdP': 'um3/cm3',
  'dV/dlogdP': 'ug/cm3',
  'dM/dlogdP': 'm2#/cm3',
};
