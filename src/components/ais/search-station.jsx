import { useEffect, useRef, useState } from 'react';

import {
  FlexRowWrapper,
  FlexColWrapper,
  Button,
} from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';
import { SearchCondFrame } from './search-cond-frame';
import { SearchStationModal } from './search-station-modal';


/**
 * 측정소 선택 컴포넌트
 * @param {string} title - 측정소 선택 타이틀
 * @param {string} siteType - 측정소 타입 ['', 'photoch', 'toxic', 'intensive']
 * @param {boolean} onTms - TMS 설정 여부
 * @param {function} setStationList - 측정소 리스트 설정 함수
 * @returns {React.ReactNode} 측정소 선택 컴포넌트
 */


const SearchStation = ({
  title,
  siteType = '',
  onTms = true,
  setStationList,
}) => {
  const [multipleStationList, setMultipleStationList] = useState([]);

  const [isModalOpened, setIsModalOpened] = useState(false);

  const multipleSelectRef = useRef();

  useEffect(() => {
    const arr = [];
    multipleStationList.forEach(station => arr.push(station.siteCd.toString()));
    setStationList(arr);
  }, [multipleStationList]);

  // 모달 open
  const handleClickSelectStationBtn = () => {
    setIsModalOpened(true);
  };

  // 선택 삭제 버튼 클릭 이벤트
  const handleClickDeleteSelected = () => {
    const selectedItems = Array.from(multipleSelectRef.current.selectedOptions);

    if (selectedItems != null) {
      let newArr = multipleStationList;
      selectedItems.forEach(option => {
        newArr = newArr.filter(listItem => listItem.siteData != option.value);
      });
      setMultipleStationList(newArr);
    }
  };

  // 전체 삭제 버튼 클릭 이벤트
  const handleClickDeleteAll = () => setMultipleStationList([]);

  return (
    <>
      <SearchCondFrame title={title}>
        <FlexRowWrapper className="items-stretch gap-1 w-full h-full">
          <FlexRowWrapper className="items-stretch grow">
            <Select multiple ref={multipleSelectRef}>
              {multipleStationList &&
                multipleStationList.map(station => (
                  <Option key={station.siteCd}>{station.siteData}</Option>
                ))}
            </Select>
          </FlexRowWrapper>
          <FlexColWrapper className="justify-baseline w-23 gap-0.5">
            <Button
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              onClick={handleClickSelectStationBtn}
            >
              측정소 선택
            </Button>
            <Button onClick={handleClickDeleteSelected}>선택 삭제</Button>
            <Button onClick={handleClickDeleteAll}>전체 삭제</Button>
          </FlexColWrapper>
        </FlexRowWrapper>
      </SearchCondFrame>
      {isModalOpened && (
          <SearchStationModal
            title={title}
            siteType={siteType}
            onTms={onTms}
            setIsModalOpened={setIsModalOpened}
            initialStationList={multipleStationList}
            setMultipleStationList={setMultipleStationList}
          />
      )}
    </>
  );
};

export { SearchStation };
