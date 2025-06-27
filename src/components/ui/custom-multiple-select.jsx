import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';


/**
 * 커스텀 다중 선택 컴포넌트
 * @param {Object[]} options - 옵션 배열
 * @param {Function} setOutsideSelectedOptions - 외부 선택된 옵션 설정 함수
 * @param {string} className - 클래스 이름
 * @example options = [{value: '1', text: '옵션1'}, {value: '2', text: '옵션2'}, ...]
 * @returns {React.ReactNode} 커스텀 다중 선택 컴포넌트
 */


export default function CustomMultiSelect({
  options,
  setOutsideSelectedOptions,
  className,
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  const wrapperRef = useRef(null);
  const scrollRef = useRef();
  const optionRefs = useRef([]);

  // 선택되지 않은 옵션 필터링
  const filteredOptions = options.filter(
    option => !selectedOptions.includes(option)
  );

  // 옵션 추가
  const addOption = option => {
    if (!selectedOptions.includes(option)) {
      setSelectedOptions([...selectedOptions, option]);
    }
    setIsOpen(false); // 드롭다운 닫기
  };

  // 옵션 제거
  const removeOption = option => {
    setSelectedOptions(selectedOptions.filter(o => o !== option));
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 휠 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = e => {
      e.preventDefault(); // 외부 세로 스크롤 막기
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // option 선택 시 마지막 요소 위치로 자동 이동
  // 외부로 선택 값 전달
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth', // 부드럽게 스크롤
      });
    }

    setOutsideSelectedOptions(selectedOptions);
  }, [selectedOptions]);

  // 드롭다운 열릴 때
  useEffect(() => {
    // 드롭다운 열릴 때 인덱스 초기화
    if (isOpen) setHighlightedIndex(0);

    // 드롭다운 열릴 때 위치를 계산하여 열리는 방향 설정(top/bottom)
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // 드롭다운 예상 최대 높이 (tailwind: max-h-60 = 240px)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }

      // 스크롤도 함께
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isOpen]);

  // 키보드 제어
  const onKeyDown = e => {
    if (e.key === 'Enter') {
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const selected = filteredOptions[highlightedIndex];
        if (selected) addOption(selected);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev =>
        Math.min(prev + 1, filteredOptions.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={wrapperRef}
      className={cn('w-140 whitespace-normal relative', className)}
    >
      {/* 셀렉트 박스 */}
      <div
        ref={scrollRef}
        className="h-[50px] border border-gray-300 rounded p-2 cursor-pointer overflow-x-auto scrollbar-hide"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 h-full min-w-fit w-max">
          {selectedOptions.length === 0 && (
            <span className="text-gray-400">Select</span>
          )}

          {selectedOptions.map(option => (
            <div
              key={option.value}
              className="border-2 border-blue-700 px-2 py-0.5 rounded flex items-center gap-0.5"
              onClick={e => {
                e.stopPropagation();
                removeOption(option);
              }}
            >
              <span className="truncate overflow-hidden whitespace-nowrap">
                {option.text}
              </span>
              &nbsp; &times;
            </div>
          ))}
        </div>
      </div>

      {/* 드롭다운 리스트 */}
      {isOpen && (
        <div
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape')
              setIsOpen(false);
          }}
          className={`absolute left-0 right-0 bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto z-10
           ${
             dropdownPosition === 'bottom'
               ? 'top-full mt-1'
               : 'bottom-full mb-1'
           }`}
        >
          {filteredOptions.map((option, idx) => (
            <div
              key={option.value}
              ref={el => (optionRefs.current[idx] = el)}
              onClick={() => addOption(option)}
              className={`p-2 cursor-pointer hover:bg-blue-100 ${
                idx === highlightedIndex ? 'bg-blue-200' : ''
              }`}
            >
              {option.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
