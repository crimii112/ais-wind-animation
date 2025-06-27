import { FlexColWrapper } from '@/components/ui/common';
import { Loading } from '@/components/ui/loading';
import { ScatterChart } from '@/components/ui/chart-scatter';
import ChartWrapper from '@/components/ui/chart-wrapper';


/**
 * 산점도 그래프 프레임 컴포넌트
 * - 라인/파이/바 프레임 컴포넌트와 따로 사용
 * - 산점도 프레임은 그래프 설정 UI를 children으로 전달
 * @param {React.ReactNode} children 자식 컴포넌트(그래프 설정 UI)
 * @param {boolean} isLoading 로딩 상태
 * @param {string} title 그래프 제목
 * @param {Object} chartSettings 그래프 설정
 * @param {function} setHighlightedRow 하이라이트 표시할 행의 rowKey 저장 함수
 * @example chartSettings = {data: {수도권: [{groupNm: '수도권', groupdate: '2015/01/01 01', type: "dN/dlogdP", x: 10.6, y: 100}, ...]}, 
 *                           tooltip: <CustomTooltip />, 
 *                           xAxis: { dataKey: 'x', scale: 'log', domain: [10.6, 10000], ticks: [10, 100, 1000, 10000] }, 
 *                           yAxis: { dataKey: 'y', label: 'dN/dlogdP (#/cm3)' }}
 * @returns {React.ReactNode} 산점도 그래프 프레임 컴포넌트
*/


const ContentScatterChartFrame = ({ children, isLoading, title, chartSettings, setHighlightedRow }) => {

  return (
    <FlexColWrapper className="w-full p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      {isLoading ? (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Loading />
        </div>
      ) : (
        <>
          {/* 그래프 설정 UI */}
          {children}

          {/* 그래프 그리기 */}
          {chartSettings && (
            <>
              <div className="w-full border-t border-gray-200" />
              <ChartWrapper title={title}>
                <ScatterChart chartSettings={chartSettings} setHighlightedRow={setHighlightedRow} />  
              </ChartWrapper>
            </>
          )}
        </>
      )}
    </FlexColWrapper>
  );
};
export { ContentScatterChartFrame };
