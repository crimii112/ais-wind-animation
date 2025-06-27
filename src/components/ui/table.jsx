import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash';

/**
 * 텍스트 길이 측정 함수
 * @param {string} text - 텍스트
 * @param {string} font - 폰트
 * @returns {number} 텍스트 길이
 */
const measureTextWidth = (text, font = '14px Pretendard GOV') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text).width;
};

/**
 * 열 너비 자동 계산 함수 
 * @param {Array} data - 테이블 데이터 목록
 * @param {Array} headList - 테이블 헤더 목록
 * @param {Array} headNameList - 테이블 헤더 이름 목록
 * @param {number} sampleSize - 테이블 데이터 샘플 크기
 * @returns {Object} 열 너비 객체
 */
const calculateColumnWidths = (
  data,
  headList,
  headNameList,
  sampleSize = 10000
) => {
  const font = '14px Pretendard GOV';
  const result = {};

  headList.forEach((key, idx) => {
    const headerText = headNameList[idx]?.replaceAll('&lt;/br&gt;', '') ?? key;
    let maxWidth = measureTextWidth(headerText, font);

    for (let i = 0; i < Math.min(sampleSize, data.length); i++) {
      const value = String(data[i][key] ?? '-');
      const width = measureTextWidth(value, font);
      if (width > maxWidth) maxWidth = width;
    }

    result[key] = Math.ceil(maxWidth + 32);
  });

  return result;
};

/**
 * 테이블 컴포넌트      
 * @param {Object} datas - 테이블 데이터
 * @param {Array} datas.rstList - 테이블 데이터 목록
 * @param {Array} datas.headList - 테이블 헤더 목록
 * @param {Array} datas.headNameList - 테이블 헤더 이름 목록
 * @param {string} highlightedRow - 강조된 행의 키
 * @param {number} numberStartIndex - 숫자 시작 인덱스(숫자 우측 정렬 위함)
 * @param {number} numberEndIndex - 숫자 끝 인덱스(숫자 우측 정렬 위함)
 * @example datas.rstList = [{groupdate: '2024-01-01', groupNm: '인천.강화군.석모리', data01: 10, data02: 20, ..., rflag: null, ...}, ...]
 * @example datas.headList = ['groupdate', 'groupNm', 'data01', 'data02', ...]
 * @example datas.headNameList = ['측정일자', '측정소', '1)Ethane', '2)Ethylene', ...]
 * @returns {React.ReactElement} 테이블 컴포넌트
 */
const Table = ({ datas, highlightedRow, numberStartIndex, numberEndIndex }) => {
  const parentRef = useRef();
  const [columns, setColumns] = useState([]);

  // 컬럼 정의
  const columnHelper = createColumnHelper();
  useEffect(() => {
    if (!datas?.headList?.length || !datas?.rstList?.length) return;

    const columnWidths = calculateColumnWidths(
      datas.rstList,
      datas.headList,
      datas.headNameList
    );

    const newColumns = datas.headList.map((key, idx) =>
      columnHelper.accessor(row => row[key], {
        id: key,
        size: columnWidths[key],
        header: () => datas.headNameList[idx]?.replaceAll('&lt;/br&gt;', ''),
        cell: info => {
          const value = info.getValue();
          const isNumberColumn = idx >= numberStartIndex && idx <= numberEndIndex;
          return (
            <div className={`${isNumberColumn ? 'text-right' : 'text-center'}`}>
              {value === '' || value === undefined ? '-' : value}
            </div>
          );
        },
      })
    );

    setColumns(newColumns);
  }, [datas]);

  // 테이블 세팅
  const table = useReactTable({
    data: datas.rstList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 가상화 세팅
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  
  // 스크롤 위치 계산 함수
  const calculateScrollPosition = useCallback((index) => {
    const rowHeight = 40; // 각 행의 높이
    const containerHeight = parentRef.current?.clientHeight || 0;
    return Math.max(0, index * rowHeight - containerHeight / 2);
  }, []);

  // 스크롤 실행 함수
  const executeScroll = useCallback((scrollTop) => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // 디바운스된 스크롤 함수
  const debouncedScroll = useCallback(
    debounce((index) => {
      const scrollTop = calculateScrollPosition(index);
      executeScroll(scrollTop);
    }, 100),
    [calculateScrollPosition, executeScroll]
  );

  // 그래프에서 클릭한 데이터 -> 테이블에서 해당 행에 하이라이트 표시
  useEffect(() => {
    if (!highlightedRow || !datas?.rstList) return;

    const index = datas.rstList.findIndex( row => { 
      if(row.groupdate) return `${row.groupdate}_${row.groupNm}` === highlightedRow
      else return `${row.yyyymmddhh}_${row.areaName}` === highlightedRow
    });

    if (index !== -1) {
      debouncedScroll(index);
    }
  }, [highlightedRow, datas, debouncedScroll]);
  
  return (
    <div
      className="w-full max-h-[820px] overflow-auto border border-gray-200 rounded-md"
      ref={parentRef}
      role="table"
      aria-label="데이터 테이블"
    >
      <div className="inline-block min-w-full align-middle">
        {/* Header */}
        <div 
          className="sticky top-0 z-[1] w-full h-10 bg-gray-100"
          style={{
            position: 'sticky',
            left: 0,
            right: 0,
          }}
        />
        
        {/* Header Content */}
        <div 
          className="sticky top-0 z-[2] w-full" 
          role="rowgroup"
          style={{
            marginTop: '-40px'
          }}
        >
          {table.getHeaderGroups().map(headerGroup => (
            <div key={headerGroup.id} className="flex w-full border-b border-gray-200" role="row">
              {headerGroup.headers.map((header, index) => (
                <div
                  key={header.id}
                  className="p-2 whitespace-nowrap font-medium bg-gray-100 flex-1 text-center"
                  style={{
                    minWidth: `${header.getSize()}px`,
                    borderRight: index < headerGroup.headers.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}
                  role="columnheader"
                  aria-sort="none"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            height: `${totalSize}px`,
            position: 'relative',
            width: '100%',
          }}
          role="rowgroup"
        >
          {datas.rstList[0] === 'NO DATA' ? (
            <div className="flex w-full" role="row">
              <div 
                className="text-center p-4 text-gray-700 w-full bg-gray-50" 
                role="cell"
                aria-colspan={columns.length}
              >
                데이터가 없습니다
              </div>
            </div>
          ) : (
            virtualRows.map(virtualRow => {
              const row = table.getRowModel().rows[virtualRow.index];
              const rowKey = row.original.groupdate ? `${row.original.groupdate}_${row.original.groupNm}` : `${row.original.yyyymmddhh}_${row.original.areaName }`;
              const isHighlighted = rowKey === highlightedRow;

              return (
                <div
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%',
                  }}
                  className={`flex border-b border-gray-100 hover:bg-blue-100 transition-colors duration-150 ${isHighlighted ? 'bg-blue-500 hover:bg-blue-500' : ''}`}
                  role="row"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <div
                      key={cell.id}
                      className={`p-2 whitespace-nowrap text-gray-700 flex-1 text-center ${isHighlighted ? 'text-white' : ''}`}
                      style={{
                        minWidth: `${cell.column.getSize()}px`,
                        borderRight: index < row.getVisibleCells().length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}
                      role="cell"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


export { Table };
