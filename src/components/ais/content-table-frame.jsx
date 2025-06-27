import copy from 'copy-to-clipboard';
import * as XLSX from 'xlsx';

import { FlexRowWrapper, FlexColWrapper, Button } from '@/components/ui/common';
import { Table } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';

/**
 * 테이블 프레임 컴포넌트 
 * @param {Object} datas - 테이블 데이터
 * @param {boolean} isLoading - 로딩 여부
 * @param {string} fileName - 파일 이름
 * @param {number} highlightedRow - 강조된 행의 인덱스
 * @param {number} numberStartIndex - 숫자 시작 인덱스(숫자 우측 정렬 위함)
 * @param {number} numberEndIndex - 숫자 끝 인덱스(숫자 우측 정렬 위함)
 * @returns {React.ReactElement} 테이블 프레임 컴포넌트
 */
const ContentTableFrame = ({ datas, isLoading, fileName, highlightedRow, numberStartIndex, numberEndIndex }) => {

  /**
   * 클립보드 복사 함수(react-copy-to-clipboard 라이브러리 사용)
   */
  const handleClickCopyToClipboard = () => {
    if (datas === undefined) {
      alert('조회된 데이터가 없습니다.');
      return;
    }
    if (datas.headList[0] === 'NO DATA') {
      alert('조회된 데이터가 없습니다.');
      return;
    }

    let text = '';

    const headNameList = datas.headNameList
      .join('\t')
      .replaceAll('&lt;/br&gt;', '');
    text += headNameList + '\n';

    datas.rstList.forEach(arr => {
      datas.headList.map(
        headName =>
          (text += (arr[headName] === undefined ? '' : arr[headName]) + '\t')
      );
      text += '\n';
    });

    copy(text, { format: 'text/plain' });

    alert('데이터가 복사되었습니다.');
  };

  /**
   * 엑셀로 저장 함수(xlsx 라이브러리 사용)
   */
  const handleClickExportToExcel = () => {
    if (datas === undefined) {
      alert('조회된 데이터가 없습니다.');
      return;
    }
    if (datas.headList[0] === 'NO DATA') {
      alert('조회된 데이터가 없습니다.');
      return;
    }

    const headNameList = [...datas.headNameList].map(name =>
      name.replace('&lt;/br&gt;', '')
    );
    const rstList = [
      ...datas.rstList.map(arr => [
        ...datas.headList.map(headName => arr[headName]),
      ]),
    ];
    const sheet = [headNameList, ...rstList];
    const ws = XLSX.utils.aoa_to_sheet(sheet);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    XLSX.writeFile(wb, fileName + '.xlsx');
  };

  return (
    <FlexColWrapper className="w-full p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <FlexRowWrapper className="w-full mb-4 items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          조회 결과 
          {datas && datas.rstList && datas.headList[0] !== 'NO DATA' && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              (총 {datas.rstList.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}건)
            </span>
          )}
        </div>
        <FlexRowWrapper className="gap-2">
          <Button
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200 flex items-center gap-2"
            onClick={handleClickCopyToClipboard}
          >
            클립보드 복사
          </Button>
          <Button
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200 flex items-center gap-2"
            onClick={handleClickExportToExcel}
          >
            파일로 저장
          </Button>
        </FlexRowWrapper>
      </FlexRowWrapper>
      {isLoading ? (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Loading />
        </div>
      ) : (
        datas && <Table datas={datas} highlightedRow={highlightedRow} numberStartIndex={numberStartIndex} numberEndIndex={numberEndIndex} />
      )}
    </FlexColWrapper>
  );
};

export { ContentTableFrame };
