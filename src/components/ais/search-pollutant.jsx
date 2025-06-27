import { useEffect, useState } from 'react';

import { SearchCondFrame } from './search-cond-frame';
import { FlexRowWrapper, GridWrapper, Input } from '@/components/ui/common';


/**
 * 물질 및 소수점 자릿수 || 자료획득률 선택 컴포넌트  
 * @param {string} title - 컴포넌트 타이틀 ['물질 및 소수점 자릿수' | '자료획득률']
 * @param {Object} pollutantList - 물질 소수점 자릿수 리스트
 * @param {Object} digitList - 물질 소수점 자릿수 리스트(PM, lon, carbon, metal, gas, other)
 * @param {Object} signList - 자료 획득률 리스트
 * @param {Object} initialPollutant - 초기 리스트
 * @param {function} setPollutant - 물질 또는 자료획득률 리스트 설정 함수
 * @returns {React.ReactNode} 물질 및 소수점 자릿수 || 자료획득률 선택 컴포넌트
 */


const SearchPollutant = ({
  title = '물질 및 소수점 자릿수',
  pollutantList,
  digitList,
  signList,
  initialPollutant,
  setPollutant,
}) => {
  const [pollutantJson, setPollutantJson] = useState(initialPollutant);

  useEffect(() => {
    setPollutant(pollutantJson);
  }, [pollutantJson]);

  // 체크박스 변경 이벤트
  const handleChangeChecked = e => {
    const pollId = e.target.id;
    const pollChecked = e.target.checked;

    const findIdx = pollutantJson.findIndex(poll => {
      return poll['id'] === pollId;
    });
    pollutantJson[findIdx]['checked'] = pollChecked;

    setPollutantJson(pollutantJson);
  };

  // 입력 값 변경 이벤트
  const handleChangeInputValue = e => {
    const pollValueCategory = e.target.id.substring(0, 5);
    const pollId = e.target.id.substring(5);
    const pollValue = e.target.value;

    const findIdx = pollutantJson.findIndex(poll => {
      return poll['id'] === pollId;
    });

    if (pollValueCategory === 'sign1') {
      if (e.target.type === 'number')
        pollutantJson[findIdx]['signvalue'] = Number(pollValue);
      else if (e.target.type === 'text')
        pollutantJson[findIdx]['signvalue'] = pollValue;
    } else if (pollValueCategory === 'sign2')
      pollutantJson[findIdx]['signvalue2'] = Number(pollValue);

    setPollutantJson(pollutantJson);
  };

  const handleChangeDigitValue = e => {
    const digitId = e.target.id;
    const digitValue = Number(e.target.value);

    // pollutantJson에서 digitId와 일치하는 항목 찾기
    const findIdx = pollutantJson.findIndex(poll => poll[digitId] !== undefined);
    
    // 해당 항목의 값을 업데이트
    if (findIdx !== -1) {
      pollutantJson[findIdx][digitId] = digitValue;
      setPollutantJson(pollutantJson);
    }
  };

  return (
    <SearchCondFrame title={title}>
      {pollutantList && (     // 물질 리스트 존재 시
        <GridWrapper className="grid-cols-4 gap-1">
          {pollutantList.map(poll => (
            <FlexRowWrapper className="justify-between gap-0.5" key={poll.id}>
              <FlexRowWrapper className="justify-between gap-0.5">
                <label>
                  <input
                    type="checkbox"
                    id={poll.id}
                    defaultChecked={poll.checked}
                    onChange={handleChangeChecked}
                    className="mx-2 border-1 border-gray-300 rounded-sm"
                  />
                  {poll.text}
                </label>
              </FlexRowWrapper>
              <FlexRowWrapper className="justify-between gap-0.5">
                <input
                  type="number"
                  id={'sign1' + poll.id}
                  defaultValue={poll.signvalue}
                  onChange={handleChangeInputValue}
                  className="w-10 p-1.5 border-1 border-gray-300 rounded-sm bg-white"
                />
                <input
                  type="number"
                  id={'sign2' + poll.id}
                  defaultValue={poll.signvalue2}
                  onChange={handleChangeInputValue}
                  className="w-10 p-1.5 border-1 border-gray-300 rounded-sm bg-white"
                />
              </FlexRowWrapper>
            </FlexRowWrapper>
          ))}
        </GridWrapper>
      )}

      {digitList && (   // 물질 소수점 자릿수 리스트(PM, lon, carbon, metal, gas, other) 존재 시
        <GridWrapper className="grid-cols-5 gap-3">
          {digitList.map(digit => (
            <FlexRowWrapper className='justify-between gap-1' key={digit.id}>
              <div className='px-1'>
                <label className='whitespace-nowrap'>{digit.text} : </label>
              </div>
              <div>
                <Input
                  type="number"
                  id={digit.id}
                  defaultValue={digit.value}
                  className="w-13 p-1.5 border-1 border-gray-300 rounded-sm bg-white"
                  onChange={handleChangeDigitValue}
                />
              </div>
            </FlexRowWrapper>
          ))}
        </GridWrapper>
      )}

      {signList && (     // 자료획득률 리스트 존재 시
        <GridWrapper className="items-stretch gap-1">
          {signList.map(sign => (
            <FlexRowWrapper className="justify-between gap-0.5" key={sign.id}>
              {sign.onCheckbox !== false ?
                <div>
                  <label>
                      <Input
                        type="checkbox"
                        id={sign.id}
                        defaultChecked={sign.checked}
                        onChange={handleChangeChecked}
                        className="mx-2 border-1 border-gray-300 rounded-sm"
                      />
                    {sign.text}
                  </label>
                </div>
                :
                <div className='flex-1'>
                  <label className='flex justify-center'>
                    {sign.text}
                  </label>
                </div>
              }
              <div>
                <Input
                  type="text"
                  id={'sign1' + sign.id}
                  defaultValue={sign.signvalue}
                  onChange={handleChangeInputValue}
                  className="w-auto p-1.5 border-1 border-gray-300 rounded-sm text-sm bg-white"
                />
              </div>
            </FlexRowWrapper>
          ))}
        </GridWrapper>
      )}
    </SearchCondFrame>
  );
};

export { SearchPollutant };
