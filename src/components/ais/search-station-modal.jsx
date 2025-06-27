import { useEffect, useRef, useState } from 'react';
import { SquareArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  ModalFrame,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from '@/components/ui/modal';
import {
  FlexRowWrapper,
  FlexColWrapper,
  GridWrapper,
  Button,
  Input,
} from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';
import usePostRequest from '@/hooks/usePostRequest';
import { ContentGis } from './search-station-gis';
import { MapNgii } from '@/components/map';


/**
 * 측정소 선택 모달
 * @param {number} tabType - 탭 타입
 * @param {string} siteType - 측정소 타입
 * @param {boolean} onTms - TMS 설정 여부
 * @param {function} setIsModalOpened - 모달 닫기 함수
 * @param {array} initialStationList - 초기 측정소 리스트
 * @param {function} setMultipleStationList - 측정소 리스트 설정 함수
 * @returns {React.ReactNode} 측정소 선택 모달
 */


const SearchStationModal = ({
  title,
  siteType = '',
  onTms,
  setIsModalOpened,
  initialStationList,
  setMultipleStationList,
}) => {

  const postMutation = usePostRequest();

  const [modalTabType, setModalTabType] = useState(0); // title에 따른 모달 탭 구성 설정
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedStationList, setSelectedStationList] = useState(initialStationList); //선택한 측정소 - list
  const [selectedOptions, setSelectedOptions] = useState([]); //선택한 측정소 - select onChange에 사용

  // 우측 상단 - tms 설정, 추이측정소
  const [tms, setTms] = useState({ airqltKndNm: '도시대기', progressYn: '0' });

  // 검색 방식
  const [selectboxSidoNm, setSelectboxSidoNm] = useState([]); //select box(api 호출 시 사용)
  const tbxSidoSearchRef = useRef(); //input
  const [searchStationList, setSearchStationList] = useState([]); //검색 결과 list(선택 전 list)
  const searchStationRef = useRef(); //multiple select dom

  // 시도 선택 checkbox list
  const [sidoCheckboxList, setSidoCheckboxList] = useState([
    { value: 'all', text: '전국', checked: false },
    { value: 'capital', text: '수도권', checked: false },
    { value: 'seoul', text: '서울', checked: false },
    { value: 'gyeonggi', text: '경기', checked: false },
    { value: 'incheon', text: '인천', checked: false },
    { value: 'daejeon', text: '대전', checked: false },
    { value: 'daegu', text: '대구', checked: false },
    { value: 'busan', text: '부산', checked: false },
    { value: 'ulsan', text: '울산', checked: false },
    { value: 'gwangju', text: '광주', checked: false },
    { value: 'sejong', text: '세종', checked: false },
    { value: 'gangwon', text: '강원', checked: false },
    { value: 'chungbuk', text: '충북', checked: false },
    { value: 'chungnam', text: '충남', checked: false },
    { value: 'jeonbuk', text: '전북', checked: false },
    { value: 'jeonnam', text: '전남', checked: false },
    { value: 'gyeongbuk', text: '경북', checked: false },
    { value: 'gyeongnam', text: '경남', checked: false },
    { value: 'jeju', text: '제주', checked: false },
  ]);

  // 반경 내 검색 지도 초기화 여부
  const [shouldInit, setShouldInit] = useState(false);

  // title에 따라 모달 탭 구성 설정
  useEffect(() => {
    if (['대기측정소', '기상대'].includes(title)) {
      setModalTabType(1);
    } else if (
      [
        '광화학',
        'TMS',
        '유해대기',
        '중금속',
        '산성강하물',
        '입경중량',
        '대기환경연구소',
      ].includes(title)
    ) {
      setModalTabType(2);
    }
  }, [title]);

  // api(/sido.do) 호출 함수
  const getStationList = async sidoNm => {
    if (postMutation.isLoading) return;

    const apiData = {
      airqltKndNm: onTms ? tms.airqltKndNm : '도시대기',
      progressYn: onTms ? tms.progressYn : '0',
      searchtype: 'tabpage' + activeTabIndex,
      sidoNm: sidoNm,
      siteType: siteType,
      tbxSidoSearch: tbxSidoSearchRef.current.value,
    };

    const apiRes = await postMutation.mutateAsync({
      url: '/ais/srch/sido.do',
      data: apiData,
    });

    return apiRes.sidoList;
  };

  // 시도 선택 방식 - 체크박스 onChange
  const handleChangeCheckbox = async e => {
    const id = e.target.id;
    const checked = e.target.checked;

    const arr = [...sidoCheckboxList];

    if (id === '전국') {
      arr.forEach(item => (item.checked = checked));
    } else if (id === '수도권') {
      arr.forEach(item => {
        if (['수도권', '서울', '인천', '경기'].includes(item.text)) {
          item.checked = checked;
        }
      });
    } else {
      if (sidoCheckboxList[0].checked && !checked) {
        arr.find(item => item.text === '전국').checked = false;
      } else if (
        sidoCheckboxList[1].checked &&
        !checked &&
        ['서울', '경기', '인천'].includes(id)
      ) {
        arr.find(item => item.text === '수도권').checked = false;
      }
      arr.find(item => item.text === id).checked = checked;
    }

    setSidoCheckboxList(arr); //checkbox item state 변경

    if (checked) {
      const sidoNm = [];

      if (id === '전국') {
        arr.forEach(item => {
          if (item.text !== '전국' && item.text !== '수도권') {
            sidoNm.push(item.text);
          }
        });
      } else if (id === '수도권') {
        ['서울', '경기', '인천'].forEach(sido => sidoNm.push(sido));
      } else {
        sidoNm.push(id);
      }

      const stationList = await getStationList(sidoNm);

      // 중복 방지
      let selectedStationArr = selectedStationList;
      stationList.forEach(station => {
        if (!selectedStationArr.find(item => item.siteCd === station.siteCd))
          selectedStationArr.push(station);
      });

      setSelectedStationList([...selectedStationArr]);
    }
  };

  // 검색 방식 - 검색 버튼 클릭 이벤트
  const handleClickSearchBtn = async () => {
    const sidoNm = selectboxSidoNm;
    const stationList = await getStationList(sidoNm);
    setSearchStationList(stationList);
  };

  // 검색 방식 - 선택 버튼 클릭 이벤트
  const handleClickArrowRightBtn = () => {
    const selectedOptions = Array.from(
      searchStationRef.current.selectedOptions
    );

    if (selectedOptions === null) return;

    let selectedStationArr = selectedStationList;
    selectedOptions.forEach(option => {
      const stationJson = searchStationList.find(
        item => item.siteData === option.innerText
      );

      // 중복 데이터 방지
      if (!selectedStationArr.find(item => item.siteCd === stationJson.siteCd))
        selectedStationArr.push(stationJson);
    });

    setSelectedStationList([...selectedStationArr]);
  };

  // 기타 방식 - 라디오 버튼 클릭 이벤트
  const handleClickRadioBtn = async text => {
    const sidoNm = text;
    const stationList = await getStationList(sidoNm);
    setSelectedStationList(stationList);
  };

  // 반경 내 검색 방식
  const handleSearchRadiusAddStation = (stationList) => {
    setSelectedStationList(stationList);
  }

  // Content 1) 시도 선택 방식
  const ContentSelectSido = (
    <GridWrapper className="grid-cols-[6fr_1fr] gap-2">
      <FlexColWrapper className="items-stretch box-border border-1 border-gray-300">
        <SelectBoxTitle type="text">시도</SelectBoxTitle>
        <GridWrapper className="grow grid-cols-3 p-8">
          {sidoCheckboxList.map(sido => (
            <label
              key={sido.value}
              className={`${
                sido.text === '서울' && 'col-start-1'
              } flex items-center ml-6`}
            >
              <Input
                className="mr-2"
                type="checkbox"
                id={sido.text}
                checked={sido.checked}
                onChange={handleChangeCheckbox}
              />
              {sido.text}
            </label>
          ))}
        </GridWrapper>
      </FlexColWrapper>
      <FlexRowWrapper>
        <SquareArrowRight
          width="40px"
          height="40px"
          className="rounded-xl text-blue-900"
        />
      </FlexRowWrapper>
    </GridWrapper>
  );

  // Content 2) 검색 방식
  const ContentSearch = (
    <GridWrapper className="grid-cols-[6fr_1fr] gap-2">
      <FlexColWrapper className="items-stretch box-border border-1 border-gray-300">
        <SelectBoxTitle type="grid">
          <Select
            name="searchTypeSidoNm"
            onChange={e => setSelectboxSidoNm([e.target.value])}
          >
            {RegionOptionList.map(region => (
              <option key={region.text} value={region.text}>
                {region.text}
              </option>
            ))}
          </Select>
          <Input ref={tbxSidoSearchRef} className="rounded-none" />
          <Button
            className="bg-gray-600 text-white rounded-none"
            onClick={handleClickSearchBtn}
          >
            검색
          </Button>
        </SelectBoxTitle>
        <div className="grow">
          <Select
            multiple
            ref={searchStationRef}
            className="w-full h-full border-none"
          >
            {searchStationList &&
              searchStationList.map(station => (
                <Option key={station.siteCd}>{station.siteData}</Option>
              ))}
          </Select>
        </div>
      </FlexColWrapper>
      <FlexRowWrapper>
        <Button
          onClick={handleClickArrowRightBtn}
          className="w-fit h-fit p-0 bg-transparent"
        >
          <SquareArrowRight
            width="40px"
            height="40px"
            className="rounded-xl text-blue-900"
          />
        </Button>
      </FlexRowWrapper>
    </GridWrapper>
  );

  // Content 3) 기타 방식
  const ContentEtc = (
    <GridWrapper className="grid-cols-[6fr_1fr] gap-2">
      <FlexColWrapper className="items-stretch box-border border-1 border-gray-300">
        <SelectBoxTitle type="text">기타</SelectBoxTitle>
        <GridWrapper className="grow grid-cols-1 items-center p-12">
          {EtcRadioBtnList.map(etc => (
            <label key={etc.text} className="flex items-center">
              <Input
                type="radio"
                name="etc"
                // defaultChecked={etc.text === '전국' && 'checked'}
                id={etc.text}
                onClick={e => handleClickRadioBtn(e.target.id)}
                className="mr-2"
              />
              {etc.text}
            </label>
          ))}
        </GridWrapper>
      </FlexColWrapper>
      <FlexRowWrapper>
        <SquareArrowRight
          width="40px"
          height="40px"
          className="rounded-xl text-blue-900"
        />
      </FlexRowWrapper>
    </GridWrapper>
  );

  // Content 4) 반경 내 검색 방식
  const ContentSearchRadius = (
    <GridWrapper className="grid-cols-[10fr_1fr] gap-2">
      <FlexColWrapper className="items-stretch box-border border-1 border-gray-300">
          <SelectBoxTitle type="text">지도에서 원하는 위치를 클릭해주세요. 기본 반경은 10km입니다.</SelectBoxTitle>
          <GridWrapper className="grow grid-cols-1 w-full h-full">
            <MapNgii><ContentGis sitetype={title} tms={tms.airqltKndNm} onAddStation={handleSearchRadiusAddStation} onInit={shouldInit}/></MapNgii> 
          </GridWrapper>
      </FlexColWrapper>
      <FlexRowWrapper>
          <SquareArrowRight
              width="40px"
              height="40px"
              className="rounded-xl text-blue-900"
          />
      </FlexRowWrapper>
    </GridWrapper>
  );

  // tabType에 따른 탭 구성
  const tabList = 
    modalTabType === 1
      ? [
          { title: '시도 선택 방식', content: ContentSelectSido },
          { title: '검색 방식', content: ContentSearch },
          { title: '기타 방식', content: ContentEtc },
          { title: '반경 내 검색', content: ContentSearchRadius },
        ]
      : modalTabType === 2
      ? [
          { title: '시도 선택 방식', content: ContentSelectSido },
          { title: '검색 방식', content: ContentSearch },
          { title: '반경 내 검색', content: ContentSearchRadius },
        ]
      : modalTabType === 3 && [
          { title: '가까운 측정소 검색 방식', content: <div></div> },
          { title: '검색 방식', content: ContentSearch },
        ];

  // 모달창 닫기
  const handleCloseModal = () => {
    setIsModalOpened(false);
  };

  // 좌측 상단 - 탭 이동시 검색 데이터 초기화
  const initSearchData = () => {
    // 시도 선택 방식
    setSidoCheckboxList(prev => {
      prev.forEach(item => (item.checked = false));
      return prev;
    });

    // 검색 방식
    document.getElementsByName(
      'searchTypeSidoNm'
    )[0].options[0].selected = true;
    tbxSidoSearchRef.current.value = '';
    setSearchStationList([]);
    setSelectboxSidoNm([]);

    // 기타 방식
    if (document.getElementsByName('etc')[0] !== undefined) {
      document.getElementsByName('etc')[0].checked = true;
    }

    // 반경 내 검색 방식
    setShouldInit(prev => !prev);
  };

  // 좌측 상단 - 탭 버튼 클릭 이벤트
  const handleClickTabBtn = e => {
    initSearchData();
    setActiveTabIndex(Number(e.target.id));
  };

  // 우측 상단 - TMS 변경 이벤트
  const handleChangeAirqltKndNm = e => {
    setTms(prev => ({
      ...prev,
      airqltKndNm: e.target.value
    }));
  };
  // 우측 상단 - 추이 측정소 변경 이벤트
  const handleChangeProgressYn = e => {
    setTms(prev => ({
      ...prev,
      progressYn: e.target.checked ? '1' : '0'
    }));
  };

  // 선택한 측정소 - multiple select 변경 이벤트
  const handleChangeMultipleSelect = e => {
    setSelectedOptions(Array.from(e.target.selectedOptions));
  };
  // 선택한 측정소 - 선택 삭제 버튼 클릭 이벤트
  const handleClickDeleteBtn = () => {
    if (selectedOptions.length === 0) return;

    let newArr = selectedStationList;
    selectedOptions.forEach(option => {
      newArr = newArr.filter(item => item.siteData != option.innerText);
    });
    setSelectedStationList(newArr);
  };

  // 측정소 적용 버튼 클릭 이벤트
  const handleClickSelectBtn = () => {
    setMultipleStationList([...selectedStationList]);
    setIsModalOpened(false);
  };

  return (
    <ModalFrame>
      <ModalHeader title="측정소 선택" onClick={handleCloseModal} />
      <ModalContent>
        <FlexRowWrapper className="justify-between w-full h-9">
          <FlexRowWrapper className="gap-0.5 h-full">
            {tabList && tabList.map((tab, idx) => (
              <Button
                key={tab.title}
                id={idx}
                className={`${
                  idx === activeTabIndex
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-200 text-black'
                } h-full whitespace-nowrap px-4 rounded-t-lg rounded-b-none`}
                onClick={handleClickTabBtn}
              >
                {tab.title}
              </Button>
            ))}
          </FlexRowWrapper>
          {/* tms 설정 on/off에 따라.. */}
          {onTms && (
            <FlexRowWrapper className="h-10 gap-2.5 items-stretch py-1 px-2.5 mb-2 bg-gray-200 rounded-sm">
              <span className="flex items-center font-semibold">TMS</span>
              <Select
                defaultValue={tms.airqltKndNm}
                onChange={handleChangeAirqltKndNm}
                className="w-fit"
              >
                {TmsOptionList.map(tms => (
                  <option key={tms.text} value={tms.text}>
                    {tms.text}
                  </option>
                ))}
              </Select>
              <label className="flex items-center">
                <Input
                  type="checkbox"
                  onChange={handleChangeProgressYn}
                  className="mr-1"
                />
                추이측정소
              </label>
            </FlexRowWrapper>
          )}
        </FlexRowWrapper>
        {tabList && tabList.map((tab, idx) => (
          <TabContentWrapper
            key={idx}
            className={`${
              activeTabIndex === idx
                ? 'grid grid-cols-[1.5fr_1fr] gap-1 justify-stretch'
                : 'hidden'
            }`}
          >
            {tab.content}
            <FlexColWrapper className="w-full h-full items-stretch box-border border-1 border-gray-300">
              <FlexRowWrapper className="w-full h-10 border-b-2 border-b-gray-200 bg-gray-200 font-semibold">
                선택한 측정소
              </FlexRowWrapper>
              <Select
                multiple
                onChange={handleChangeMultipleSelect}
                className="grow border-none"
              >
                {selectedStationList &&
                  selectedStationList.map(station => (
                    <Option key={station.siteCd}>{station.siteData}</Option>
                  ))}
              </Select>
              <FlexRowWrapper className="gap-0.5 justify-end p-1 border-t-2 border-t-gray-200">
                <Button onClick={handleClickDeleteBtn} className="w-fit px-3">
                  선택 삭제
                </Button>
                <Button
                  onClick={() => setSelectedStationList([])}
                  className="w-fit px-3"
                >
                  전체 삭제
                </Button>
              </FlexRowWrapper>
            </FlexColWrapper>
          </TabContentWrapper>
        ))}
      </ModalContent>
      <ModalFooter>
        <Button
          className="w-80 bg-blue-600 text-white text-lg"
          onClick={handleClickSelectBtn}
        >
          측정소 적용
        </Button>
      </ModalFooter>
    </ModalFrame>
  );
};

export { SearchStationModal };

const RegionOptionList = [
  { text: '전국' },
  { text: '수도권' },
  { text: '서울' },
  { text: '경기' },
  { text: '인천' },
  { text: '대전' },
  { text: '대구' },
  { text: '부산' },
  { text: '울산' },
  { text: '광주' },
  { text: '세종' },
  { text: '강원' },
  { text: '충북' },
  { text: '충남' },
  { text: '전북' },
  { text: '전남' },
  { text: '경북' },
  { text: '경남' },
  { text: '제주' },
];

const TmsOptionList = [
  { text: '전체' },
  { text: '도시대기' },
  { text: '도로변대기' },
  { text: '국가배경' },
  { text: '교외대기' },
  { text: '항만' },
  { text: '선박권역' },
  { text: '선박' },
  { text: '고고도관측' },
];

const EtcRadioBtnList = [
  { text: '전국' },
  { text: '수도권' },
  { text: '도청 소재 도시' },
  { text: '15개 주요 항만' },
];

const TabContentWrapper = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('grow p-5 box-border border-1 border-blue-900', className)}
      {...props}
    >
      {children}
    </div>
  );
};
TabContentWrapper.displayName = 'TabContentWrapper';

const SelectBoxTitle = ({ type, className, children, ...props }) => {
  const css =
    type === 'text'
      ? 'flex items-center justify-center w-full h-10 border-b-2 border-b-gray-200 bg-gray-200 font-semibold'
      : 'grid grid-cols-[1fr_2fr_0.7fr] gap-1 p-0.5 h-11 border-b-2 border-b-gray-200 bg-gray-200 text-sm';

  return (
    <div className={cn(css, className)} {...props}>
      {children}
    </div>
  );
};
SelectBoxTitle.displayName = 'SelectBoxTitle';
