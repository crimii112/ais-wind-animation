import {
  FlexRowWrapper,
  FlexColWrapper,
  GridWrapper,
  Button,
} from '@/components/ui/common';

/**
 * 검색 프레임 컴포넌트
 * @param {React.ReactNode} children - 자식 컴포넌트
 * @param {Function} handleClickSearchBtn - 검색 버튼 클릭 핸들러
 */
const SearchFrame = ({ children, handleClickSearchBtn }) => {
  return (
    <FlexColWrapper className="w-full p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <FlexRowWrapper className="w-full mb-4 items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          검색 조건
        </div>
      </FlexRowWrapper>
      
      <GridWrapper className="w-full grid-cols-2 gap-4 mb-6">
        {children}
      </GridWrapper>

      <FlexRowWrapper className="justify-end">
        <Button
          onClick={handleClickSearchBtn}
          className="px-10 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200"
        >
          검색하기
        </Button>
      </FlexRowWrapper>
    </FlexColWrapper>
  );
};

export { SearchFrame };
