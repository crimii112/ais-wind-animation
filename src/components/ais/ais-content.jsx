import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAisNav } from '@/context/AisNavContext';
import { FlexRowWrapper, FlexColWrapper, Button } from '@/components/ui/common';

/**
 * 탭 컨텐츠 컴포넌트
 * - Context API로 관리하고 있는 tabList를 사용합니다.
 * @returns {React.ReactNode} 탭 컨텐츠 컴포넌트
 */


const AisContent = () => {
  const { tabList, setTabList } = useAisNav();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [prevTabListLength, setPrevTabListLength] = useState(0);
  const [clickedCloseBtnIdx, setClickedCloseBtnIdx] = useState();
  const tabsContainerRef = useRef(null);

  // 탭 컨텐츠 캐싱용 ref
  const tabContentCacheRef = useRef({});

  // 캐시 초기화/추가 처리
  const memoizedTabContents = useMemo(() => {
    const cache = { ...tabContentCacheRef.current };

    tabList.forEach(tab => {
      if (!cache[tab.id]) {
        cache[tab.id] = (
          <FlexColWrapper className="gap-4 w-full h-full p-6">
            {tab.content}
          </FlexColWrapper>
        );
      }
    });

    tabContentCacheRef.current = cache;
    return cache;
  }, [tabList]);

  // activeTab 관리
  useEffect(() => {
    setPrevTabListLength(tabList.length);

    // 1) add tab
    if (tabList.length > prevTabListLength) {
      setActiveTabIndex(tabList.length - 1);
    }
    // 2) remove tab
    else {
      if (tabList.length === activeTabIndex) {
        setActiveTabIndex(tabList.length - 1);
      } else if (clickedCloseBtnIdx > activeTabIndex) {
        if (clickedCloseBtnIdx !== tabList.length) {
          setActiveTabIndex(activeTabIndex);
        } else if (clickedCloseBtnIdx - activeTabIndex !== 1) {
          setActiveTabIndex(activeTabIndex);
        } else {
          setActiveTabIndex(tabList.length - 1);
        }
      } else {
        if (clickedCloseBtnIdx === activeTabIndex) {
          setActiveTabIndex(activeTabIndex);
        } else {
          setActiveTabIndex(activeTabIndex - 1);
        }
      }
    }
  }, [tabList]);

  // tabList 변경 시 우측 끝으로 스크롤
  useEffect(() => {
    if (tabsContainerRef.current && tabList.length > prevTabListLength) {
      tabsContainerRef.current.scrollTo({
        left: tabsContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
    setPrevTabListLength(tabList.length);
  }, [tabList, prevTabListLength]);

  // 탭 닫기 핸들러
  const handleRemoveTab = idx => {
    setClickedCloseBtnIdx(idx);
    const newTabList = tabList.filter((_, i) => i !== idx);
    setTabList(newTabList);
  };

  // 스크롤 핸들러
  const handleScroll = (direction) => {
    if (!tabsContainerRef.current) return;
    
    const scrollAmount = 200;
    const currentScroll = tabsContainerRef.current.scrollLeft;
    
    if (direction === 'left') {
      tabsContainerRef.current.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth'
      });
    } else {
      tabsContainerRef.current.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="relative flex w-full h-12 bg-slate-800 shadow-md">
        <Button 
          className="absolute left-0 z-10 w-8 h-full bg-slate-800 hover:bg-slate-700 transition-all duration-200 flex items-center justify-center rounded-none border-r border-slate-600" 
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft className="w-5 h-5 text-slate-300 hover:text-white" />
        </Button>
        <div 
          ref={tabsContainerRef}
          className="flex-1 h-full overflow-x-auto scrollbar-hide mx-8"
        >
          <div className="inline-flex h-full">
            {tabList.map((tab, idx) => (
              <FlexRowWrapper
                key={idx}
                className={cn(
                  'h-full transition-all duration-200 border-r border-slate-600 shrink-0',
                  idx === activeTabIndex
                    ? 'bg-white border-t-2 border-t-slate-700'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                )}
              >
                <Button
                  id={idx}
                  onClick={() => setActiveTabIndex(idx)}
                  className={cn(
                    'px-4 py-2 rounded-none bg-transparent text-base font-medium flex items-center gap-2 transition-all duration-200 shrink-0',
                    idx === activeTabIndex 
                      ? 'text-slate-900' 
                      : 'text-slate-200 hover:text-white'
                  )}
                >
                  {tab.title}
                  <X
                    className={cn(
                      'w-4 h-4 rounded transition-all duration-200',
                      idx === activeTabIndex 
                        ? 'text-slate-700 hover:bg-slate-100' 
                        : 'text-slate-400 hover:bg-slate-700'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTab(idx);
                    }}
                  />
                </Button>
              </FlexRowWrapper>
            ))}
          </div>
        </div>
        <Button 
          className="absolute right-0 z-10 w-8 h-full bg-slate-800 hover:bg-slate-700 transition-all duration-200 flex items-center justify-center rounded-none border-l border-slate-600"
          onClick={() => handleScroll('right')}
        >
          <ChevronRight className="w-5 h-5 text-slate-300 hover:text-white" />
        </Button>
      </div>
      {tabList.map((tab, idx) => (
        <TabContentWrapper
          key={tab.id}
          className={cn(
            'flex-col shadow-inner',
            idx === activeTabIndex ? 'flex' : 'hidden'
          )}
        >
          {memoizedTabContents[tab.id]}
        </TabContentWrapper>
      ))}
    </div>
  );
};

export { AisContent };

// tab 관련 UI - TabContentWrapper
const TabContentWrapper = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        'absolute w-full bg-white', 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
TabContentWrapper.displayName = 'TabContentWrapper';
