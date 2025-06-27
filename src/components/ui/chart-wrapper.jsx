import { useState } from 'react';
import html2canvas from 'html2canvas';

import { Button, FlexRowWrapper } from '@/components/ui/common';

/**
 * 차트 래퍼 컴포넌트
 * - 이미지 저장 기능
 * @param {Object} props
 * @param {string} props.title - 차트 제목
 * @param {React.ReactNode} props.children - 차트 컴포넌트
 * @returns {React.ReactNode} 차트 래퍼 컴포넌트
 */
const ChartWrapper = ({ title, children }) => {
  const [mountedTime] = useState(Date.now());

  const handleSaveImage = async () => {
    await document.fonts.ready;
    const canvas = await html2canvas(
      document.getElementById(`${title}-${mountedTime}-chart-wrapper`),
      { backgroundColor: '#fff', useCORS: true, scale: 1.5 }
    );
    const link = document.createElement('a');
    link.download = `${title}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <>
        <div id={`${title}-${mountedTime}-chart-wrapper`} className="w-full h-full py-6">
            {children}
        </div>
        <FlexRowWrapper className="w-full justify-end gap-2">
            <Button 
                onClick={handleSaveImage} 
                className="w-fit flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200 font-medium"
            >
                이미지 저장
            </Button>
        </FlexRowWrapper>
    </>
  );
};

export default ChartWrapper;