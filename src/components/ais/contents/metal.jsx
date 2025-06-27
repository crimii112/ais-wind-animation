import { useState } from 'react';
import usePostRequest from '@/hooks/usePostRequest';

import { SearchFrame } from '../search-frame';
import { SearchDate } from '../search-date';
import { SearchStation } from '../search-station';
import { SearchCond } from '../search-cond';
import { SearchPollutant } from '../search-pollutant';
import { ContentTableFrame } from '../content-table-frame';
import { ContentChartFrame } from '../content-chart-frame';

/**
 * 중금속 컴포넌트
 * - 기간, 측정소, 자료획득률, 자료표기, 검색조건 선택 후 검색 버튼 클릭 시 데이터 조회
 * - [중금속 기간별 검색 | ]
 * @param {string} type - 페이지 타입 ['line']
 * @returns {React.ReactNode} - 중금속 컴포넌트
 */

const Metal = ({ type }) => {
  const config = METAL_SETTINGS[type];
  const postMutation = usePostRequest();

  const [dateList, setDateList] = useState([]);
  const [stationList, setStationList] = useState([]);
  const [searchCond, setSearchCond] = useState(config.initCond);
  const [pollutant, setPollutant] = useState(config.initPollutant);

  const [isLoading, setIsLoading] = useState(false);
  const [contentData, setContentData] = useState();

  const [highlightedRow, setHighlightedRow] = useState(null);

  const handleClickSearchBtn = async () => {
    if (!dateList.length) return alert('기간을 설정하여 주십시오.');
    if (!stationList.length) return alert('측정소를 선택하여 주십시오.');
    if (postMutation.isLoading) return;

    setIsLoading(true);
    setContentData(undefined);
    setHighlightedRow(null);

    // API 데이터
    const apiData = {
      page: config.page,
      date: dateList,
      site: stationList,
      cond: searchCond,
      polllist: pollutant,
      type: 'tmp',
    };
    
    try {
      let apiRes = await postMutation.mutateAsync({
        url: 'ais/srch/datas.do',
        data: apiData,
      });

      if (JSON.stringify(apiRes) === '{}') {
        apiRes = {
          headList: ['NO DATA'],
          headNameList: ['NO DATA'],
          rstList: ['NO DATA'],
        };
      }

      console.log(apiData);
      console.log(apiRes);

      setContentData(apiRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SearchFrame handleClickSearchBtn={handleClickSearchBtn}>
        <SearchDate setDateList={setDateList} dateType={config.dateType} />
        <SearchStation
          title="중금속"
          onTms={false}
          siteType="metal"
          setStationList={setStationList}
        />
        <SearchPollutant
          title="자료획득률"
          signList={config.signList1}
          initialPollutant={pollutant}
          setPollutant={setPollutant}
        />
        <SearchPollutant
          title="자료표기"
          signList={config.signList2}
          initialPollutant={pollutant}
          setPollutant={setPollutant}
        />
        <SearchCond
          condList={config.condList}
          initialSearchCond={searchCond}
          setSearchCond={setSearchCond}
        />
      </SearchFrame>

      <ContentTableFrame
        datas={contentData}
        isLoading={isLoading}
        fileName="중금속 기간별 검색"
        numberStartIndex={2}
        numberEndIndex={13}
        highlightedRow={highlightedRow}
      />

      <ContentChartFrame
        datas={contentData}
        isLoading={isLoading}
        type={config.chartType}
        title="중금속 기간별 검색"
        setHighlightedRow={setHighlightedRow}
      />
    </>
  );
};

export { Metal };

const condList = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: '', text: '월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'allbymonth', text: '전체기간월별' },
    ],
  },
  {
    type: 'selectBox',
    title: '데이터권역',
    id: 'region',
    content: [
      { value: 'site', text: '측정소별' },
      { value: 'sido', text: '시도' },
      { value: 'city', text: '도시' },
      { value: 'all', text: '전체' },
    ],
  },
  {
    type: 'selectBox',
    title: '데이터통계',
    id: 'stats',
    content: [
      { value: 'avg', text: '평균' },
      { value: 'min', text: '최소' },
      { value: 'max', text: '최대' },
      { value: 'count', text: '개수' },
      { value: 'stdv', text: '표준편차' },
      { value: 'median', text: '중앙값' },
      { value: 'percentile', text: '백분위수' },
    ],
  },
  {
    type: 'textInput',
    title: '소수점자릿수',
    id: 'digit',
    placeholder: '3',
  },
  {
    type: 'selectBox',
    title: '황사구분',
    id: 'dust',
    content: [
      { value: 'include', text: '황사기간포함' },
      { value: 'except', text: '황사기간제외' },
      { value: 'only', text: '황사기간만' },
    ],
  },
  {
    type: 'selectBox',
    title: ' 물질',
    id: 'poll',
    content: [
      { value: 'PM10', text: 'PM10' },
      { value: 'TSP', text: 'TSP' },
    ],
  },
  {
    type: 'selectBox',
    title: '정기측정',
    id: 'periodic',
    content: [
      { value: '1', text: 'Y' },
      { value: '0', text: 'N' },
    ],
  },
  {
    type: 'selectBox',
    title: '황사',
    id: 'dustYN',
    content: [
      { value: '0', text: 'N' },
      { value: '1', text: 'Y' },
    ],
  },
];
const condList2 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [{ value: 'day', text: '일별' }],
    disabled: true,
  },
  {
    type: 'selectBox',
    title: '데이터권역',
    id: 'region',
    content: [{ value: 'site', text: '측정소별' }],
    disabled: true,
  },
  {
    type: 'selectBox',
    title: '데이터통계',
    id: 'stats',
    content: [
      { value: 'avg', text: '평균' },
      { value: 'min', text: '최소' },
      { value: 'max', text: '최대' },
      { value: 'count', text: '개수' },
      { value: 'stdv', text: '표준편차' },
      { value: 'median', text: '중앙값' },
      { value: 'percentile', text: '백분위수' },
    ],
  },
  {
    type: 'textInput',
    title: '소수점자릿수',
    id: 'digit',
    placeholder: '3',
  },
  {
    type: 'selectBox',
    title: '황사구분',
    id: 'dust',
    content: [
      { value: 'include', text: '황사기간포함' },
      { value: 'except', text: '황사기간제외' },
      { value: 'only', text: '황사기간만' },
    ],
  },
  {
    type: 'selectBox',
    title: ' 물질',
    id: 'poll',
    content: [
      { value: 'PM10', text: 'PM10' },
      { value: 'TSP', text: 'TSP' },
    ],
  },
  {
    type: 'selectBox',
    title: '정기측정',
    id: 'periodic',
    content: [
      { value: '1', text: 'Y' },
      { value: '0', text: 'N' },
    ],
  },
  {
    type: 'selectBox',
    title: '황사',
    id: 'dustYN',
    content: [
      { value: '0', text: 'N' },
      { value: '1', text: 'Y' },
    ],
  },
];

const signList1 = [
  { id: 'High', text: '~60% 미만', checked: true, signvalue: '#' },
  { id: 'Low', text: '~40% 미만', checked: true, signvalue: '##' },
];
const signList2 = [
  {
    id: 'Zero',
    text: '0 -> ',
    checked: true,
    signvalue: 'N.D.',
    onCheckbox: false,
  },
  {
    id: 'Null',
    text: 'NULL -> ',
    checked: true,
    signvalue: '-',
    onCheckbox: false,
  },
];

const initCond = {
  sect: 'day',
  region: 'site',
  stats: 'avg',
  periodic: '1',
  dustYN: '0',
  dust: 'include',
  poll: 'PM10',
  toxicmonth: 'PM10',
  unit: '자동선택',
  percentile: '',
  digit: 3,
};
const initPollutant = [
  { id: 'High', checked: true, signvalue: '#' },
  { id: 'Low', checked: true, signvalue: '##' },
  { id: 'Zero', checked: true, signvalue: 'N.D.' },
  { id: 'Null', checked: true, signvalue: '-' },
];
const METAL_SETTINGS = {
  line: {
    page: 'metal/lineGraph',
    dateType: 'month',
    chartType: 'line',
    type: 'line',
    initCond: initCond,
    initPollutant: initPollutant,
    condList: condList,
    signList1: signList1,
    signList2: signList2,
  },
  mtgraph: {
    page: 'metal/mtgraph',
    dateType: 'onlyMonth',
    chartType: 'bar',
    type: 'bar',
    initCond: initCond,
    initPollutant: initPollutant,
    condList: condList2,
    signList1: signList1,
    signList2: signList2,
  },
};
