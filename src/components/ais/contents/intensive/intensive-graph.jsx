import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { FlexColWrapper, FlexRowWrapper, Button } from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';
import { Loading } from '@/components/ui/loading';
import { IntensiveDataFrame } from './intensive-data-frame';
import ChartWrapper from '@/components/ui/chart-wrapper';

const BAR_SIZE_CONFIG = {
  small: { barSize: 40, barGap: -40 },
  medium: { barSize: 20, barGap: -20 },
  large: { barSize: 15, barGap: -15 },
  xlarge: { barSize: 2, barGap: -2 },
  xxlarge: { barSize: 1, barGap: -1 },
};

/**
 * (단일)성분누적그래프 페이지
 *
 * - 그래프 그릴 때 측정소 선택
 * - 1. 성분별(기간별-STACKED), 2. PM2.5/PM10비율(기간별), 3. AM-SUL, AM-NIT(기간별)로 총 3가지 그래프 구현
 * - 그래프 클릭 시 해당하는 행 테이블에서 하이라이트 표시 기능
 *
 * @param {string} type - 타입(auto, manual)
 * @returns {React.ReactNode}
 */

const IntensiveGraph = ({ type }) => {
  const config = GRAPH_CONFIG[type];

  const [isLoading, setIsLoading] = useState(false);

  const [contentData, setContentData] = useState(); //테이블 전체 데이터
  const [chartOptionSettings, setChartOptionSettings] = useState(); //그래프 설정 옵션
  const [chartSelectedOption, setChartSelectedOption] = useState(); //선택한 그래프 설정 옵션

  const [chartDatas, setChartDatas] = useState(); //그래프 데이터

  const [highlightedRow, setHighlightedRow] = useState(null); //그래프에서 클릭한 행의 rowKey 저장

  const initSettings = () => {
    setChartDatas(null);
    setHighlightedRow(null);
  };

  // 데이터 로드 시 데이터 가공
  const handleDataLoaded = data => {
    if (data.rstList[0] === 'NO DATA') return;

    setContentData(data);

    // 그래프 설정 옵션 설정(측정소)
    const groupNmOptions = data.rstList2.map(item => ({
      value: item.groupNm,
      text: item.groupNm,
    }));

    setChartOptionSettings({ groupNm: groupNmOptions });
    setChartSelectedOption(groupNmOptions[0].value);
  };

  // 그래프 클릭 시 rowKey 설정 => 테이블에서 해당하는 행에 하이라이트 표시할 용도
  const handleChartClick = e => {
    if (!e?.activePayload?.[0]?.payload) return;

      const clicked = e.activePayload[0].payload;
      const rowKey = `${clicked.groupdate}_${clicked.groupNm}`;

      // 이전 값과 동일한 경우 업데이트 방지
      if (rowKey === highlightedRow) return;

    setHighlightedRow(rowKey);
  };

  // PM2.5/PM10비율(기간별) 그래프 데이터 크기에 따른 barSize, barGap 설정
  // recharts 라이브러리에 앞뒤로 겹치게 하는 기능이 없어서 barGap을 음수로 설정하여 겹치게 설정
  const getBarSize = dataLength => {
    if (dataLength < 20) return BAR_SIZE_CONFIG.small;
    if (dataLength < 50) return BAR_SIZE_CONFIG.medium;
    if (dataLength < 100) return BAR_SIZE_CONFIG.large;
    if (dataLength < 550) return BAR_SIZE_CONFIG.xlarge;
    return BAR_SIZE_CONFIG.xxlarge;
  };
  const type2BarSize = chartDatas?.type2
    ? getBarSize(chartDatas.type2.length)
    : BAR_SIZE_CONFIG.small;

  // 성분별(기간별-STACKED) 그래프 커스텀 툴팁
  const Type1Tooltip = ({ active, payload }) => {
    if (!active || !payload?.length || !payload[0].payload) return null;

    const allKeys = [{value: 'amSul', text: 'AM_SUL'}, {value: 'amNit', text: 'AM_NIT'}, {value: 'om', text: 'OM'}, {value: 'ec', text: 'EC'}, {value: 'cm', text: 'CM'}, {value: 'tm', text: 'TM'}, {value: 'etc', text: 'ETC'}, {value: 'pm25', text: 'PM2.5'}];
    const payloadKeys = payload.map(item => item.name);

    const difference = allKeys.filter(key => !payloadKeys.includes(key.value));
    
    const groupDate = payload[0].payload.groupdate;
    const groupNm = payload[0].payload.groupNm;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow">
        <p className="font-medium">
          {groupDate} - {groupNm}
        </p>
        
        {payload.map((entry, index) => {
          const poll = pollutants.find(item => item.value === entry.name);
          if (!poll) return null;
          return (
            <p key={index} style={{ color: entry.color }}>
              {poll.text}: {entry.value === null ? '-' : entry.value}
            </p>
          );
        })}
        {difference &&
          difference.map(key => {
            return (
              <p key={key.value}>{key.text} : -</p>
            );
          })}
      </div>
    );
  };

  // PM2.5/PM10비율(기간별) 그래프 커스텀 툴팁
  const Type2Tooltip = ({ active, payload }) => {
    if (!active || !payload?.length || !payload[0].payload) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow">
        <p className="font-medium">
          {data.groupdate} - {data.groupNm}
        </p>
        <p style={{ color: 'red' }}>PM2.5/PM10: {data.pmrate}</p>
        <p style={{ color: COLORS[0] }}>PM10: {data.pm10}</p>
        <p style={{ color: COLORS[1] }}>PM2.5: {data.pm25}</p>
      </div>
    );
  };

  // AM-SUL, AM-NIT(기간별) 그래프 커스텀 툴팁
  const Type3Tooltip = ({ active, payload }) => {
    if (!active || !payload?.length || !payload[0].payload) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow">
        <p className="font-medium">
          {data.groupdate} - {data.groupNm}
        </p>
        <p style={{ color: COLORS[0] }}>AM_SUL(ug/m3): {data.amSul}</p>
        <p style={{ color: COLORS[1] }}>AM_NIT(ug/m3): {data.amNit}</p>
      </div>
    );
  };

  // 그래프 그리기 버튼 클릭 핸들러
  const handleClickDrawChart = () => {
    if (!contentData) return;

    // 선택한 측정소 데이터만 필터링
    const filteredData = contentData.rstList.filter(
      item => item.groupNm === chartSelectedOption
    );

    const processedData = {
      // 성분별(기간별-STACKED) 그래프 데이터
      type1: filteredData.map(item => ({
        groupdate: item.groupdate,
        groupNm: item.groupNm,
        pm25: item.pm25 ? parseFloat(item.pm25) : null,
        ...selectedPollutant.bar.reduce(
          (acc, pollutant) => ({
            ...acc,
            [pollutant.value]: item[pollutant.value]
              ? parseFloat(item[pollutant.value])
              : null,
          }),
          {}
        ),
      })),
      // PM2.5/PM10비율(기간별) 그래프 데이터
      type2: filteredData.map(item => ({
        groupdate: item.groupdate,
        groupNm: item.groupNm,
        pm10: item.pm10 ? parseFloat(item.pm10) : null,
        pm25: item.pm25 ? parseFloat(item.pm25) : null,
        pmrate: item.pmrate ? parseFloat(item.pmrate) : null,
      })),
      // AM-SUL, AM-NIT(기간별) 그래프 데이터
      type3: filteredData.map(item => ({
        groupdate: item.groupdate,
        groupNm: item.groupNm,
        amSul: item.amSul ? parseFloat(item.amSul) : null,
        amNit: item.amNit ? parseFloat(item.amNit) : null,
      })),
    };

    setChartDatas(processedData);
  };

  return (
    <IntensiveDataFrame
      type={config.type}
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
          <FlexColWrapper className="w-full h-full gap-15">
            <FlexRowWrapper className="w-full gap-10 mb-4 items-stretch justify-between">
              <div className="text-lg font-semibold text-gray-900 whitespace-nowrap p-1">
                그래프 설정
              </div>
              <FlexRowWrapper className="w-full items-stretch justify-start gap-3">
                <span className="flex flex-col items-center justify-center">
                  측정소 :{' '}
                </span>
                <Select
                  className="w-40"
                  value={chartSelectedOption}
                  onChange={e => setChartSelectedOption(e.target.value)}
                >
                  {chartOptionSettings?.groupNm.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.text}
                    </Option>
                  ))}
                </Select>
              </FlexRowWrapper>
              <Button
                className="w-fit px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
                onClick={handleClickDrawChart}
              >
                그래프 그리기
              </Button>
            </FlexRowWrapper>
            {chartDatas && (
              <>
                {/* 성분별(기간별-STACKED) 그래프 */}
                <div className="w-full h-full">
                  <div className="text-lg font-bold">
                    성분별(기간별-STACKED)
                  </div>
                  <div className="w-full border-t border-gray-200" />
                  <ChartWrapper title='성분별(기간별-STACKED)'>
                  <ResponsiveContainer width="100%" height={700}>
                      <ComposedChart
                        margin={{ top: 20, right: 60, bottom: 30, left: 20 }}
                        data={chartDatas.type1}
                        barGap={0}
                        onClick={handleChartClick}
                      >
                        <CartesianGrid strokeDasharray="3" vertical={false} />
                        <XAxis
                          dataKey="groupdate"
                          tick={{ fontSize: 12 }}
                          label={{
                            value: '측정일자',
                            position: 'bottom',
                            fontWeight: 'bold',
                          }}
                        />
                        <YAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                          label={{
                            value: 'Conc.(ug/m3)',
                            position: 'insideLeft',
                            fontWeight: 'bold',
                            angle: -90,
                          }}
                        />
                        {selectedPollutant.bar.map((pollutant, idx) => (
                          <Bar
                            key={pollutant.value}
                            dataKey={pollutant.value}
                            fill={COLORS[idx]}
                            stackId="stackgroup"
                          />
                            
                        ))}
                        {selectedPollutant.line.map(pollutant => (
                          <Line
                            key={pollutant.value}
                            dataKey={pollutant.value}
                            stroke="red"
                            strokeWidth={2}
                          />
                        ))}
                        <Tooltip content={<Type1Tooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{
                            paddingTop: 40,
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </div>

                {/* PM2.5/PM10비율(기간별) 그래프 */}
                {type === 'auto' && (
                  <div className="w-full h-full">
                    <div className="text-lg font-bold">
                      PM2.5/PM10비율(기간별)
                    </div>
                    <div className="w-full border-t border-gray-200" />
                    <ChartWrapper title='PM2.5/PM10비율(기간별)'>
                      <ResponsiveContainer width="100%" height={700}>
                        <ComposedChart
                          margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
                          data={chartDatas.type2}
                          barGap={type2BarSize.barGap}
                          onClick={handleChartClick}
                        >
                          <CartesianGrid strokeDasharray="3" vertical={false} />
                          <XAxis
                            dataKey="groupdate"
                            allowDuplicatedCategory={false}
                            tick={{ fontSize: 12 }}
                            label={{
                              value: '측정일자',
                              position: 'bottom',
                              fontWeight: 'bold',
                            }}
                          />
                          <YAxis
                            yAxisId="poll"
                            type="number"
                            allowDuplicatedCategory={false}
                            tick={{ fontSize: 12 }}
                            tickCount={11}
                            label={{
                              value: 'Conc.(ug/m3)',
                              position: 'insideLeft',
                              fontWeight: 'bold',
                              angle: -90,
                            }}
                          />
                          <YAxis
                            yAxisId="pmrate"
                            type="number"
                            tick={{ fontSize: 12 }}
                            tickCount={11}
                            orientation="right"
                            label={{
                              value: 'PM2.5/PM10',
                              position: 'insideRight',
                              fontWeight: 'bold',
                              angle: -90,
                            }}
                            domain={[0, 1]}
                          />
                          <Line
                            yAxisId="pmrate"
                            dataKey="pmrate"
                            stroke="red"
                            strokeWidth={2}
                          />
                          <Tooltip content={<Type2Tooltip />} />
                          <Bar
                            yAxisId="poll"
                            dataKey="pm10"
                            fill={COLORS[0]}
                            barSize={type2BarSize.barSize}
                          />
                          <Bar
                            yAxisId="poll"
                            dataKey="pm25"
                            fill={COLORS[1]}
                            barSize={type2BarSize.barSize}
                          />
                          <Legend
                            verticalAlign="bottom"
                            wrapperStyle={{
                              paddingTop: 40,
                              border: 'none',
                              outline: 'none',
                              backgroundColor: 'transparent',
                            }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </ChartWrapper>
                  </div>
                )}

                {/* AM-SUL, AM-NIT(기간별) 그래프 */}
                <div className="w-full h-full">
                  <div className="text-lg font-bold">
                    AM-SUL, AM-NIT(기간별)
                  </div>
                  <div className="w-full border-t border-gray-200" />
                  <ChartWrapper title='AM-SUL,AM-NIT(기간별)'>
                    <ResponsiveContainer width="100%" height={700}>
                      <BarChart
                        data={chartDatas.type3}
                        margin={{ top: 20, right: 60, bottom: 30, left: 20 }}
                        stackOffset="expand"
                        barGap={0}
                        onClick={handleChartClick}
                      >
                        <CartesianGrid strokeDasharray="3" vertical={false} />
                        <XAxis
                          dataKey="groupdate"
                          allowDuplicatedCategory={false}
                          tick={{ fontSize: 12 }}
                          label={{
                            value: '측정일자',
                            position: 'bottom',
                            fontWeight: 'bold',
                          }}
                        />
                        <YAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickCount={11}
                          tickFormatter={value => value * 100}
                          label={{
                            value: 'percent(%)',
                            angle: -90,
                            position: 'insideLeft',
                            fontWeight: 'bold',
                          }}
                        />
                        <Tooltip content={<Type3Tooltip />} />
                        <Bar
                          data={chartDatas.type3}
                          key="amSul"
                          dataKey="amSul"
                          fill={COLORS[0]}
                          stackId="stackgroup"
                        />
                        <Bar
                          data={chartDatas.type3}
                          key="amNit"
                          dataKey="amNit"
                          fill={COLORS[1]}
                          stackId="stackgroup"
                        />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{
                            paddingTop: 40,
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </div>
              </>
            )}
          </FlexColWrapper>
        )}
      </FlexColWrapper>
    </IntensiveDataFrame>
  );
};

export { IntensiveGraph };

// 성분별(기간별-STACKED): 막대 그래프 물질 고정
const selectedPollutant = {
  line: [{ value: 'pm25', text: 'PM2.5' }],
  bar: [
    { value: 'amSul', text: 'AM_SUL' },
    { value: 'amNit', text: 'AM_NIT' },
    { value: 'om', text: 'OM' },
    { value: 'ec', text: 'EC' },
    { value: 'cm', text: 'CM' },
    { value: 'tm', text: 'TM' },
    { value: 'etc', text: 'ETC' },
  ],
};

const pollutants = [
  { value: 'pm25', text: 'PM2.5' },
  { value: 'pm10', text: 'PM10' },
  { value: 'pmrate', text: 'PM2.5/PM10' },
  { value: 'amSul', text: 'AM_SUL' },
  { value: 'amNit', text: 'AM_NIT' },
  { value: 'om', text: 'OM' },
  { value: 'ec', text: 'EC' },
  { value: 'cm', text: 'CM' },
  { value: 'tm', text: 'TM' },
  { value: 'etc', text: 'ETC' },
];

const GRAPH_CONFIG = {
  auto: {
    type: 'autoGraph',
    title: '자동-(단일)성분누적그래프',
  },
  manual: {
    type: 'manualGraph',
    title: '수동-(단일)성분누적그래프',
  },
};

const COLORS = [
  '#0088FE',
  '#FFBB28',
  '#00C49F',
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
