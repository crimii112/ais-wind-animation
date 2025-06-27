import { FlexRowWrapper, FlexColWrapper } from '@/components/ui/common';

/**
 * 검색 조건 프레임 컴포넌트
 * @param {React.ReactNode} children - 자식 컴포넌트
 * @param {string} title - 타이틀
 * @example title = '기간', '대기측정소', '검색 조건', ...
 * @returns {React.ReactNode} 검색 조건 프레임 컴포넌트
 */
const SearchCondFrame = ({ children, title }) => (
  <FlexColWrapper className="items-stretch border border-gray-200 rounded-sm shadow-sm bg-white">
    <FlexRowWrapper className="p-1 bg-gray-100 text-gray-600 text-lg font-bold">
      {title}
    </FlexRowWrapper>
    <FlexColWrapper className="grow items-stretch justify-baseline gap-2 p-2 bg-white">
      {children}
    </FlexColWrapper>
  </FlexColWrapper>
);

export { SearchCondFrame };
