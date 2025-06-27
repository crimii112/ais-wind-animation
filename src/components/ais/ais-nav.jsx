import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';

import { useAisNav } from '@/context/AisNavContext';
import {
  HeaderWrapper,
  Logo,
  Navbar,
  NavbarMenu,
} from '@/components/ui/navbar';
import { CmmnAir } from './contents/cmmnair';
import { PhotoCh } from './contents/photoch';
import { Metal } from './contents/metal';
import { Toxic } from './contents/toxic';
import { IntensivePsize } from './contents/intensive/intensive-psize';
import { IntensiveCorrelation } from './contents/intensive/intensive-correlation';
import { IntensiveGraph } from './contents/intensive/intensive-graph';
import { IntensivePieGraph } from './contents/intensive/intensive-piegraph';
import { IntensiveWeather } from './contents/intensive/intensive-weather';
import { GisPie } from './contents/gispie';
import { MapNgii } from '@/components/map';
import { FlexColWrapper } from '@/components/ui/common';
import { GisWindMap } from './contents/gis-wind-map';

/**
 * 대기측정망 자료관리 시스템 네비게이션 아이템 데이터
 * @type {Object}
 */
const data = {
  navItems: [
    {
      id: 0,
      title: '일반 대기질 데이터 분석',
      subTitles: [
        {
          id: 'cmmn',
          title: '일반 대기질 데이터 검색',
          subItems: [
            {
              pathName: 'cmmnAir',
              title: '일반대기 검색',
              content: <CmmnAir />,
            },
          ],
        },
        {
          id: 'other',
          title: '기타 분석',
          subItems: [
            {
              pathName: 'gisPie',
              title: 'GIS 파이그래프',
              content: (
                <FlexColWrapper className="w-full h-[750px]">
                  <MapNgii id="gisPie">
                    <GisPie />
                  </MapNgii>
                </FlexColWrapper>
              ),
            },
            {
              pathName: 'gisWindMap',
              title: 'GIS 바람지도',
              content: (
                <FlexColWrapper className="w-full h-[750px]">
                  <MapNgii id="gisWindMap">
                    <GisWindMap />
                  </MapNgii>
                </FlexColWrapper>
              ),
            },
          ],
        },
      ],
    },
    {
      id: 1,
      title: '특수 대기질 테이터 분석',
      subTitles: [
        {
          id: 'photo',
          title: '광화학 데이터 검색',
          subItems: [
            {
              pathName: 'photoCh',
              title: '광화학 데이터 그래프',
              content: <PhotoCh type="line" />,
            },
            {
              pathName: 'photoChPie',
              title: '광화학 성분 파이그래프',
              content: <PhotoCh type="pie" />,
            },
            {
              pathName: 'photoChBar',
              title: '광화학 성분 막대그래프',
              content: <PhotoCh type="bar" />,
            },
            {
              pathName: 'photoChMedian',
              title: '광화학 일중간값 그래프',
              content: <PhotoCh type="medianLine" />,
            },
          ],
        },
        {
          id: 'metal',
          title: '중금속 데이터',
          subItems: [
            {
              pathName: 'metal',
              title: '중금속 기간별 검색',
              content: <Metal type="line" />,
            },
            {
              pathName: 'metalMtGraph',
              title: '중금속 데이터 그래프',
              content: <Metal type="mtgraph" />,
            },
          ],
        },
        {
          id: 'toxic',
          title: '유해대기 데이터 검색',
          subItems: [
            {
              pathName: 'toxic',
              title: '유해자동 데이터 그래프',
              content: <Toxic type="line" />,
            },
            {
              pathName: 'toxicPie',
              title: '유해자동 파이그래프',
              content: <Toxic type="pie" />,
            },
            {
              pathName: 'toxicBar',
              title: '유해자동 막대그래프',
              content: <Toxic type="bar" />,
            },
            {
              pathName: 'toxicMedian',
              title: '유해자동 일중간값 그래프',
              content: <Toxic type="medianLine" />,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      title: '대기환경연구소 데이터 분석',
      subTitles: [
        {
          id: 'intensiveAuto',
          title: '자동자료 검색',
          subItems: [
            {
              pathName: 'intensive/autotimecorrelation',
              title: '자동-(단일)성분상관성검토',
              content: <IntensiveCorrelation type="auto" />,
            },
            {
              pathName: 'intensive/autograph',
              title: '자동-(단일)성분누적그래프',
              content: <IntensiveGraph type="auto" />,
            },
            {
              pathName: 'intensive/autopiegraph',
              title: '자동-(단일)성분파이그래프',
              content: <IntensivePieGraph />,
            },
          ],
        },
        {
          id: 'intensiveManual',
          title: '수동자료 검색',
          subItems: [
            {
              pathName: 'intensive/manualcorrelation',
              title: '수동-(단일)성분상관성검토',
              content: <IntensiveCorrelation type="manual" />,
            },
            {
              pathName: 'intensive/manualgraph',
              title: '수동-(단일)성분누적그래프',
              content: <IntensiveGraph type="manual" />,
            },
          ],
        },
        {
          id: 'intensivePsize',
          title: '입경자료 검색',
          subItems: [
            {
              pathName: 'intensive/psize',
              title: '(단일)입경크기분포',
              content: <IntensivePsize type="psize" />,
            },
            {
              pathName: 'intensive/psizeCal',
              title: '(선택)성분계산',
              content: <IntensivePsize type="psizeCal" />,
            },
          ],
        },
        {
          id: 'intensiveWeather',
          title: '기상자료 검색',
          subItems: [
            // {
            //   pathName: 'intensive/weatherrvwr',
            //   title: '(단일)기상자료검토',
            //   content: <IntensiveWeather type="weatherRvwr" />,
            // },
            {
              pathName: 'intensive/wswdgraph',
              title: '(단일)풍향,풍속그래프',
              content: <IntensiveWeather type="wswdGraph" />,
            },
            {
              pathName: 'intensive/weathertimeseries',
              title: '(선택)기상별 시계열',
              content: <IntensiveWeather type="weatherTimeseries" />,
            },
            {
              pathName: 'intensive/weatherpivot',
              title: '(선택)기상자료(PIVOT)',
              content: <IntensiveWeather type="weatherPivot" />,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 대기측정망 자료관리 시스템 네비게이션 컴포넌트
 * @returns {React.ReactNode}
 */
const AisNav = () => {
  const { setTabList } = useAisNav();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState(null);
  const menuRef = useRef(null);

  /**
   * 탭 추가 핸들러
   * @param {Object} subItem - 탭 추가 핸들러
   */
  const handleAddTab = useCallback(
    subItem => {
      // GIS 파이 그래프 탭은 독립적인 지도 Context를 사용하기 위해 id에 랜덤 값을 추가(id 중복 방지)
      if (subItem.pathName === 'gisPie') {
        const randomId = uuidv4();
        const content = (
          <FlexColWrapper className="w-full h-[750px]">
            <MapNgii id={`gisPie-${randomId}`}>
              <GisPie mapId={`gisPie-${randomId}`} />
            </MapNgii>
          </FlexColWrapper>
        );
        setTabList(prev => [
          ...prev,
          { ...subItem, id: uuidv4(), content: content },
        ]);
      } else if (subItem.pathName === 'gisWindMap') {
        const randomId = uuidv4();
        const content = (
          <FlexColWrapper className="w-full h-[750px]">
            <MapNgii id={`gisWindMap-${randomId}`}>
              <GisWindMap mapId={`gisWindMap-${randomId}`} />
            </MapNgii>
          </FlexColWrapper>
        );
        setTabList(prev => [
          ...prev,
          { ...subItem, id: uuidv4(), content: content },
        ]);
      } else {
        setTabList(prev => [...prev, { ...subItem, id: uuidv4() }]);
      }
      setActiveMenuId(null);
      setActiveSubMenuId(null);
    },
    [setTabList]
  );

  const handleMenuClick = useCallback((itemId, e) => {
    e?.stopPropagation();
    setActiveMenuId(prev => (prev === itemId ? null : itemId));
    setActiveSubMenuId(null);
  }, []);

  const handleSubMenuEnter = useCallback(subTitleId => {
    setActiveSubMenuId(subTitleId);
  }, []);

  const handleSubMenuLeave = useCallback(() => {
    setActiveSubMenuId(null);
  }, []);

  const handleKeyDown = useCallback(
    (e, itemId, type, subTitleId = null, subItem = null) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (type === 'main') {
          handleMenuClick(itemId);
        } else if (type === 'subTitle') {
          handleSubMenuEnter(subTitleId);
        } else if (type === 'sub' && subItem) {
          handleAddTab(subItem);
        }
      }
    },
    [handleMenuClick, handleSubMenuEnter, handleAddTab]
  );

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
        setActiveSubMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const memoizedNavItems = useMemo(() => data.navItems, []);

  return (
    <HeaderWrapper className="bg-white border-b border-gray-200 shadow-sm">
      <Logo className="px-6">
        <span className="text-xl font-semibold text-gray-900">
          <Link to="/ais">대기측정망 자료관리 시스템</Link>
        </span>
      </Logo>
      <Navbar>
        <NavbarMenu className="gap-2 px-2">
          {memoizedNavItems.map(item => (
            <div key={item.id} className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={e => handleMenuClick(item.id, e)}
                onKeyDown={e => handleKeyDown(e, item.id, 'main')}
                aria-expanded={activeMenuId === item.id}
                aria-haspopup="true"
                tabIndex={0}
              >
                {item.title}
                <ChevronDown className="w-4 h-4" />
              </button>
              {activeMenuId === item.id && (
                <div
                  className="absolute mt-1 left-0 z-50 w-64 p-1 bg-white rounded-md shadow-lg border border-gray-200"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {item.subTitles.map(subTitle => (
                    <div
                      key={subTitle.id}
                      className="relative"
                      onMouseEnter={() => handleSubMenuEnter(subTitle.id)}
                      onMouseLeave={handleSubMenuLeave}
                    >
                      <div
                        className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-default select-none"
                        role="presentation"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e =>
                          handleKeyDown(e, item.id, 'subTitle', subTitle.id)
                        }
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <span>{subTitle.title}</span>
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </div>
                      </div>
                      {activeSubMenuId === subTitle.id && (
                        <div
                          className="absolute left-full top-0 z-50 w-64 p-1 bg-white rounded-md shadow-lg border border-gray-200"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          {subTitle.subItems.map(subItem => (
                            <button
                              key={subItem.pathName}
                              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                              onClick={() => handleAddTab(subItem)}
                              onKeyDown={e =>
                                handleKeyDown(
                                  e,
                                  item.id,
                                  'sub',
                                  subTitle.id,
                                  subItem
                                )
                              }
                              role="menuitem"
                              tabIndex={0}
                            >
                              {subItem.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </NavbarMenu>
      </Navbar>
    </HeaderWrapper>
  );
};

export { AisNav };
