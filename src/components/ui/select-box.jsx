import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { FlexRowWrapper, Button } from "@/components/ui/common";

/**
 * 선택 컴포넌트
 * @param {string} className - tailwind css 클래스 이름
 * @param {React.ReactNode} children - 자식 컴포넌트
 * @param {Object} props - 추가 속성
 * @returns {React.ReactNode} 선택 컴포넌트
 */
const Select = forwardRef(({ className, children, ...props }, ref) => (
    <select
      className={`${cn(
        'w-full p-1 box-border border border-gray-300 rounded-sm bg-white text-base',
        className
      )}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ));
  Select.displayName = 'SelectComponent';
  
  
  /**
   * 옵션 컴포넌트
   * @param {string} className - tailwind css 클래스 이름
   * @param {React.ReactNode} children - 자식 컴포넌트
   * @param {Object} props - 추가 속성
   * @returns {React.ReactNode} 옵션 컴포넌트
   */
  const Option = ({ className, children, ...props }) => {
    return (
      <option
        className={`${cn(
          'bg-white hover:bg-blue-50 transition duration-100',
          className
        )}`}
        {...props}
      >
        {children}
      </option>
    );
  };
  Option.displayName = 'OptionComponent';
  


/**
 * 화살표 버튼이 있는 Select 컴포넌트
 * @param {string} id - Select 컴포넌트의 id
 * @param {string} value - 현재 선택된 값
 * @param {Array} options - 선택 가능한 옵션 목록
 * @example options = [{value: '1', text: '1'}, {value: '2', text: '2'}]
 * @param {Function} onChange - 값 변경 시 호출되는 함수
 * @param {Function} onNavigate - 화살표 버튼 클릭 시 호출되는 함수
 * @param {string} className - 추가 클래스명
 * @returns {React.ReactNode} 화살표(up/down) 버튼이 있는 Select 컴포넌트
*/

const SelectWithArrows = ({ id, value, options, onChange, onNavigate, className = "" }) => {
    return (
        <FlexRowWrapper className={`items-stretch gap-1 ${className}`}>
            <Select 
                id={id} 
                className="w-fit min-w-24" 
                value={value}
                onChange={onChange}
            >
                {options.map((option, index) => (
                    <Option key={`${option.value}-${index}`} value={option.value}>
                        {typeof option.text === 'string' ? option.text : JSON.stringify(option.text)}
                    </Option>
                ))}
            </Select>
            <FlexRowWrapper className="flex-col gap-0.5">
                <Button 
                    className="w-6 h-6 p-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                    onClick={() => onNavigate('up')}
                >
                    ↑
                </Button>
                <Button 
                    className="w-6 h-6 p-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                    onClick={() => onNavigate('down')}
                >
                    ↓
                </Button>
            </FlexRowWrapper>
        </FlexRowWrapper>
    );
};

export { Select, Option, SelectWithArrows }; 