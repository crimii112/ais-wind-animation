import { useEffect, useState } from 'react';

import { SearchCondFrame } from './search-cond-frame';
import {
  FlexRowWrapper,
  GridWrapper,
  Input,
} from '@/components/ui/common';
import { Select } from '@/components/ui/select-box';

/**
 * 검색 조건 선택 컴포넌트
 * @param {Object} condList - 검색 조건 리스트
 * @param {Object} markList - 검색 조건 리스트
 * @param {Object} initialSearchCond - 초기 검색 조건
 * @param {function} setSearchCond - 검색 조건 설정 함수
 * @example condList = [{type: 'selectBox', title: '데이터구분', id: 'sect', content: [{value: 'time', text: '시간별'}, {value: 'day', text: '일별'}, ...]}, ...]
 * @example markList = [{id: 'unit1', title: '성분 자료 Not Null', checked: false}, {id: 'unit2', title: '단위표출', checked: false}, ...]
 * @example initialSearchCond = { sect: 'time', region: 'sido', stats: 'avg', sort: 'groupdate', dust: 'include', usertime: '' }
 * @returns {React.ReactNode} 검색 조건 선택 컴포넌트
 */


const SearchCond = ({ condList, markList, initialSearchCond, setSearchCond }) => {
  const [condJson, setCondJson] = useState(initialSearchCond);

  useEffect(() => {
    setSearchCond(condJson);
  }, [condJson]);

  // 검색 조건 변경 이벤트
  const handleChangeCond = e => {
    const condId = e.target.id;
    const condValue = e.target.value;

    // 1. markList가 없으면 condJson이 json 형식이므로 그냥 넣어줌
    if(!markList) {
      condJson[condId] = condValue;
      
      // 중금속
      // poll이 condId이고 toxicmonth 키가 존재하면 toxicmonth 값도 변경
      if (condId === 'poll' && condJson['toxicmonth'] !== undefined) {
        condJson['toxicmonth'] = condValue;
      }
    } else {
      // 2. markList가 있으면 condJson이 배열 형식이므로 배열 형식에 맞게 넣어줌
      const findIdx = condJson.findIndex(cond => cond[condId] !== undefined);
      
      if(findIdx !== -1) {
        condJson[findIdx][condId] = condValue;
        
        // 중금속
        // poll이 condId이고 toxicmonth 키가 존재하면 toxicmonth 값도 변경
        if (condId === 'poll' && condJson[findIdx]['toxicmonth'] !== undefined) {
          condJson[findIdx]['toxicmonth'] = condValue;
        }
      }
    }

    setCondJson(condJson);
  };

  const handleChangeMark = e => {
    const markId = e.target.id;
    const markChecked = e.target.checked;

    const findIdx = condJson.findIndex(cond => cond['id'] === markId);

    if(findIdx !== -1) {
      condJson[findIdx]['checked'] = markChecked;
      setCondJson(condJson);
    }
  }

  return (
    <SearchCondFrame title="검색 조건">
      {condList &&
        <GridWrapper className="gap-1.5 items-stretch justify-stretch">
          {condList.map(cond =>
            cond.type === 'selectBox' ? (     // 선택 박스 타입
              <GridWrapper key={cond.id} className="grid-cols-[1fr_1.5fr] gap-1">
                <FlexRowWrapper className="bg-gray-200 font-semibold">
                  {cond.title}
                </FlexRowWrapper>
                <Select
                  id={cond.id}
                  onChange={handleChangeCond}
                  className={`p-1.5 ${cond.disabled && 'bg-gray-200'}`}
                  disabled={cond.disabled}
                >
                  {cond.content.map((item, index) => (
                    <option key={item.value === '' ? 'empty'+index : item.value} value={item.value}>
                      {item.text}
                    </option>
                  ))}
                </Select>
              </GridWrapper>
            ) : (
              cond.type === 'textInput' && (     // 텍스트 입력 타입
                <GridWrapper
                  key={cond.id}
                  className="grid-cols-[1fr_1.5fr] gap-1"
                >
                  <div className="flex items-center justify-center bg-gray-200 font-semibold">
                    {cond.title}
                  </div>
                  <Input
                    type="text"
                    id={cond.id}
                    placeholder={cond.placeholder}
                    disabled={cond.disabled}
                    onChange={handleChangeCond}
                    className={`w-full p-1.5 ${cond.disabled && 'bg-gray-200'}`}
                  />
                </GridWrapper>
              )
            )
          )}
        </GridWrapper>
      }
      {
        markList && (
          <GridWrapper className="items-stretch gap-1"> 
            {markList.map(mark => (
              <FlexRowWrapper className="justify-between gap-0.5" key={mark.id}>
                <div>
                  <label>
                    <Input
                      type="checkbox"
                      id={mark.id}
                      defaultChecked={mark.checked}
                      onChange={handleChangeMark}
                      className="mx-2 border-1 border-gray-300 rounded-sm"
                    />
                    {mark.title}
                  </label>
                </div>
              </FlexRowWrapper>
            ))}
          </GridWrapper>
        )
      }
    </SearchCondFrame>
  );
};

export { SearchCond };
