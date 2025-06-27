import { useState, useEffect } from 'react';
import usePostRequest from '@/hooks/usePostRequest';

import { SearchFrame } from '@/components/ais/search-frame';
import { SearchDate } from '@/components/ais/search-date';
import { SearchStation } from '@/components/ais/search-station';
import { SearchPollutant } from '@/components/ais/search-pollutant';
import { SearchCond } from '@/components/ais/search-cond';
import { ContentTableFrame } from '@/components/ais/content-table-frame';

/**
 * 대기환경연구소 페이지 데이터 프레임 컴포넌트
 * - 대기환경연구소는 검색 부분이 거의 비슷하기 때문에 공통 컴포넌트로 분리
 * - 검색 조건 설정 컴포넌트 및 결과 테이블 컴포넌트 사용
 * - 그래프 그리는 부분은 각 페이지에서 구현
 * - 맨 아래 INTENSIVE_SETTINGS 변수에 페이지 타입별 설정 정보 저장
 * @param {React.ReactNode} children 자식 컴포넌트
 * @param {string} type 페이지 타입
 * @param {function} onDataLoaded 데이터 로드 시 실행할 함수
 * @param {function} onLoadingChange 로딩 상태 변경 시 실행할 함수
 * @param {function} initSettings 설정 초기화 함수
 * @param {string} highlightedRow 하이라이트 표시할 행의 rowKey
 * @example type = 'psize' | 'autoTimeCorrelation' | 'autoGraph' | 'autoPieGraph' | 'manualCorrelation' | 'manualGraph'
 * @returns {React.ReactNode} 대기환경연구소 페이지 데이터 프레임 컴포넌트
 */

const IntensiveDataFrame = ({
  children,
  type,
  onDataLoaded,
  onLoadingChange,
  initSettings,
  highlightedRow,
}) => {
  const config = INTENSIVE_SETTINGS[type];
  const postMutation = usePostRequest();

  // 검색 조건 설정
  const [dateList, setDateList] = useState([]);
  const [stationList, setStationList] = useState([]);
  const [pollutant, setPollutant] = useState(config.initPollutant);
  const [searchCond, setSearchCond] = useState(config.initCond);

  const [isLoading, setIsLoading] = useState(false);
  const [contentData, setContentData] = useState();
  const [endIndex, setEndIndex] = useState(0);

  // isLoading 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);
  

  const handleClickSearchBtn = async () => {
    if (!dateList.length) return alert('기간을 설정하여 주십시오.');
    if (!stationList.length) return alert('측정소를 설정하여 주십시오.');
    if (postMutation.isLoading) return;

    initSettings?.();
    setIsLoading(true);
    setContentData(undefined);

    const apiData = {
      page: config.page,
      date: dateList,
      site: stationList,
      ...(config.markList ? { cond: searchCond[0] } : { cond: searchCond }),
      ...(config.markList
        ? { mark: searchCond.slice(1) }
        : {
            mark: [
              { id: 'unit1', checked: false },
              { id: 'unit2', checked: false },
            ],
          }),
      ...(config.digitList
        ? { digitlist: pollutant[0] }
        : {
            digitlist: { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
          }),
      ...(config.digitList
        ? { polllist: pollutant.slice(1) }
        : { polllist: pollutant }),
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

      console.log(JSON.stringify(apiData));
      console.log(apiRes);
      setContentData(apiRes);

      setEndIndex(apiRes.headList.length - 1);

      if (onDataLoaded) {
        onDataLoaded(apiRes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 데이터 검색 조건 설정 */}
      <SearchFrame handleClickSearchBtn={handleClickSearchBtn}>
        <SearchDate
          setDateList={setDateList}
          type="intensive"
          dateType={config.dateType}
        />
        <SearchStation
          title="대기환경연구소"
          siteType="intensive"
          onTms={false}
          setStationList={setStationList}
        />
        <SearchPollutant
          title={config.digitList ? '물질 및 소수점 자릿수' : '자료획득률'}
          digitList={config.digitList}
          signList={config.signList}
          initialPollutant={pollutant}
          setPollutant={setPollutant}
        />
        <SearchCond
          condList={config.condList}
          markList={config.markList}
          initialSearchCond={searchCond}
          setSearchCond={setSearchCond}
        />
      </SearchFrame>

      {/* 결과 테이블 */}
      <ContentTableFrame
        datas={contentData}
        isLoading={isLoading}
        fileName={config.title}
        highlightedRow={highlightedRow}
        numberStartIndex={config.numberStartIndex}
        numberEndIndex={endIndex}
      />

      {children}
    </>
  );
};

export { IntensiveDataFrame };

// 자료획득률 조건 데이터 => searchPollutant 컴포넌트에서 사용
const signList = [
  { id: 'High', text: '~75% 미만', checked: true, signvalue: '#' },
  { id: 'Low', text: '~50% 미만', checked: true, signvalue: '##' },
];
// 검색 조건 데이터 => searchCond 컴포넌트에서 사용
const condList_1 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [{ value: 'calc', text: '성분계산' }],
    disabled: true,
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
    title: '입경구분',
    id: 'eqType',
    content: [
      { value: 'SMPS_APS_O', text: 'SMPS_APS_O' },
      { value: 'SMPS_APS', text: 'SMPS_APS' },
      { value: 'SMPS', text: 'SMPS' },
      { value: 'APS', text: 'APS' },
    ],
  },
];
const condList_2 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [{ value: 'calc', text: '성분계산' }],
    disabled: true,
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
];
const condList_3 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [
      { value: 'calc', text: '성분계산' },
      { value: 'raw', text: 'RawData' },
    ],
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
];
const condList_4 = [
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
    title: '검색항목',
    id: 'poll',
    content: [
      { value: 'calc', text: '성분계산' },
      { value: 'raw', text: 'RawData' },
    ],
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
];
const condList_5 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [{ value: 'raw', text: 'RawData' }],
    disabled: true,
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
];
const condList_6 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [
      { value: 'WD', text: 'WD' },
      { value: 'WS', text: 'WS' },
      { value: 'TMP', text: 'TMP' },
      { value: 'HUM', text: 'HUM' },
      { value: 'PRESSURE', text: 'PRESSURE' },
      { value: 'CLOUD', text: 'CLOUD' },
      { value: 'VISIBLE', text: 'VISIBLE' },
      { value: 'RAIN', text: 'RAIN' },
      { value: 'NEPH450', text: 'NEPH450' },
      { value: 'NEPH550', text: 'NEPH550' },
      { value: 'NEPH700', text: 'NEPH700' },
      { value: 'NEPH_HUM', text: 'NEPH_HUM' },
      { value: 'AETH370', text: 'AETH370' },
      { value: 'AETH470', text: 'AETH470' },
      { value: 'AETH520', text: 'AETH520' },
      { value: 'AETH590', text: 'AETH590' },
      { value: 'AETH660', text: 'AETH660' },
      { value: 'AETH880', text: 'AETH880' },
      { value: 'AETH950', text: 'AETH950' },
    ],
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
];
const condList_7 = [
  {
    type: 'selectBox',
    title: '데이터구분',
    id: 'sect',
    content: [
      { value: 'time', text: '시간별' },
      { value: 'day', text: '일별' },
      { value: 'month', text: '월별' },
      { value: 'year', text: '연별' },
      { value: 'all', text: '전체기간별' },
      { value: 'timezone', text: '시간대별' },
      { value: 'week', text: '요일별' },
      { value: 'season', text: '계절별' },
      { value: 'ys', text: '년도-계절별' },
      { value: 'lys', text: '전년도-계절별' },
      { value: 'a4', text: '년도-시간대별' },
      { value: 'a5', text: '전체-월별' },
      { value: 'a7', text: '전체-일별' },
      { value: 'accmonth', text: '년도-월별누적' },
      { value: 'accseason', text: '계절관리제누적' },
      { value: 'a1', text: '계절관리제연차누적' },
      { value: 'a2', text: '년도-일별누적' },
      { value: 'a3', text: '전체-일별누적' },
      { value: 'a6', text: '계절관리제일별누적' },
    ],
  },
  {
    type: 'selectBox',
    title: '검색항목',
    id: 'poll',
    content: [{ value: 'raw', text: 'RawData' }],
    disabled: true,
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
    title: '입경구분',
    id: 'eqType',
    content: [
      { value: 'SMPS_APS_O', text: 'SMPS_APS_O' },
      { value: 'SMPS_APS', text: 'SMPS_APS' },
      { value: 'SMPS', text: 'SMPS' },
      { value: 'APS', text: 'APS' },
    ],
  },
];
// 성분 데이터 => searchPollutant 컴포넌트에서 사용
const digitList = [
  {
    id: 'pm',
    text: 'PM',
    value: 1,
  },
  {
    id: 'lon',
    text: 'lon',
    value: 3,
  },
  {
    id: 'carbon',
    text: 'Carbon',
    value: 1,
  },
  {
    id: 'metal',
    text: 'Metal',
    value: 1,
  },
  {
    id: 'gas',
    text: 'Gas',
    value: 1,
  },
];
// 성분 자료 Not Null 및 단위표출 조건 데이터 => searchCond 컴포넌트에서 사용
const markList_1 = [
  {
    title: '성분 자료 Not Null',
    id: 'unit1',
    checked: false,
  },
  {
    title: '단위표출',
    id: 'unit2',
    checked: false,
  },
];
const markList_2 = [
  {
    title: '단위표출',
    id: 'unit2',
    checked: false,
  },
];

// 대기환경연구소 페이지별 세팅
const INTENSIVE_SETTINGS = {
  psize: {
    page: 'intensive/psize',
    initCond: {
      sect: 'time',
      poll: 'calc',
      dust: 'include',
      stats: '',
      eqType: 'SMPS_APS_O',
    },
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_1,
    signList: signList,
    title: '(단일)입경크기분포',
    numberStartIndex: 4,
    numberEndIndex: 108,
    dateType: 'all',
  },
  psizeCal: {
    page: 'intensive/psizecal',
    initCond: {
      sect: 'time',
      poll: 'raw',
      dust: 'include',
      stats: '',
      eqType: 'SMPS_APS_O',
    },
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_7,
    signList: signList,
    title: '(선택)성분계산',
    numberStartIndex: 3,
    numberEndIndex: 138,
    dateType: 'all',
  },
  autoTimeCorrelation: {
    page: 'intensive/autotimecorrelation',
    initCond: [
      {
        sect: 'time',
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_3,
    markList: markList_1,
    digitList: digitList,
    signList: signList,
    title: '자동-(단일)성분상관성검토',
    numberStartIndex: 3,
    numberEndIndex: 20,
    dateType: 'all',
  },
  autoGraph: {
    page: 'intensive/autograph',
    initCond: [
      {
        sect: 'time',
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_2,
    markList: markList_1,
    digitList: digitList,
    signList: signList,
    title: '자동-(단일)성분누적그래프',
    numberStartIndex: 3,
    numberEndIndex: 20,
    dateType: 'all',
  },
  autoPieGraph: {
    page: 'intensive/autopiegraph',
    initCond: [
      {
        sect: 'time',
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_2,
    markList: markList_1,
    digitList: digitList,
    signList: signList,
    title: '자동-(단일)성분파이그래프',
    numberStartIndex: 3,
    numberEndIndex: 20,
    dateType: 'all',
  },
  manualCorrelation: {
    page: 'intensive/manualcorrelation',
    initCond: [
      {
        sect: 'day',
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_4,
    markList: markList_1,
    digitList: digitList,
    signList: signList,
    title: '수동-(단일)성분상관성검토',
    numberStartIndex: 3,
    numberEndIndex: 34,
    dateType: 'day',
  },
  manualGraph: {
    page: 'intensive/manualgraph',
    initCond: [
      {
        sect: 'day',
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_4,
    markList: markList_1,
    digitList: digitList,
    signList: signList,
    title: '수동-(단일)성분누적그래프',
    numberStartIndex: 3,
    numberEndIndex: 16,
    dateType: 'day',
  },
  weatherRvwr: {
    page: 'intensive/weatherrvwr',
    initCond: [
      {
        sect: 'time',
        poll: 'raw',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_5,
    markList: markList_2,
    signList: signList,
    title: '(단일)기상자료검토',
    numberStartIndex: 3,
    numberEndIndex: 24,
    dateType: 'all',
  },
  wswdGraph: {
    page: 'intensive/wswdgraph',
    initCond: [
      {
        sect: 'time',
        poll: 'raw',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_5,
    markList: markList_2,
    signList: signList,
    title: '(단일)풍향,풍속그래프',
    numberStartIndex: 3,
    numberEndIndex: 25,
    dateType: 'all',
  },
  weatherTimeseries: {
    page: 'intensive/weathertimeseries',
    initCond: [
      {
        sect: 'time',
        poll: 'raw',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_5,
    markList: markList_2,
    signList: signList,
    title: '(선택)기상별 시계열',
    numberStartIndex: 3,
    numberEndIndex: 25,
    dateType: 'all',
  },
  weatherPivot: {
    page: 'intensive/weatherpivot',
    initCond: [
      {
        sect: 'time',
        poll: 'WD',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      { id: 'unit1', checked: false }, // markList
      { id: 'unit2', checked: false },
    ],
    initPollutant: [
      { id: 'High', checked: true, signvalue: '#' },
      { id: 'Low', checked: true, signvalue: '##' },
      { id: 'dumy', checked: false },
    ],
    condList: condList_6,
    markList: markList_2,
    signList: signList,
    title: '(선택)기상자료(PIVOT)',
    numberStartIndex: 3,
    numberEndIndex: 16,
    dateType: 'all',
  }
};
