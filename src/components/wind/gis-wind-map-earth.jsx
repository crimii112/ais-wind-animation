import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import MapContext from '@/components/map/MapContext';
import { Button, GridWrapper, Input } from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';
import { WindCanvas } from '@/components/earth/projucts';
import proj4 from 'proj4';
import { transform } from 'ol/proj';

/**
 * 회사 모델 파일을 netCDF => json으로 변환하여 데이터 받아옴
 * earth.nullschool.net 오픈소스 활용하여 바람 애니메이션, tmp 오버레이 구현
 */
const GisWindMapEarth = ({ SetMap, mapId }) => {
  const map = useContext(MapContext);

  const [windData, setWindData] = useState(null);

  useEffect(() => {
    if (!map.ol_uid) {
      return;
    }

    map.getView().setZoom(2);
    map.getView().setCenter([1005321.0, 1771271.0]);

    if (SetMap) {
      SetMap(map);
    }
  }, [map, map.ol_uid]);

  // 바람/히트맵 그리기 버튼 핸들러
  const handleClickWindLayerBtn = async () => {
    document.body.style.cursor = 'progress';

    map.getView().setZoom(2);
    map.getView().setCenter([1005321.0, 1771271.0]);

    await axios
      .post(`${import.meta.env.VITE_WIND_API_URL}/api/wind`, {
        option: 'tmp',
        windGap: 1,
        tstep: 1,
      })
      .then(res => res.data)
      .then(data => {
        console.log(data);

        // 받아온 데이터로 구현
        setWindData(data.windData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        alert('데이터를 가져오는 데 실패했습니다. 나중에 다시 시도해주세요.');
      });

    document.body.style.cursor = 'default';
  };

  return (
    <Container id={mapId}>
      {windData && (
        <WindCanvas
          windData={windData}
          width={map.getSize()[0]}
          height={map.getSize()[1]}
          toLonLat={(x, y) => {
            const coord5179 = map.getCoordinateFromPixel([x, y]);
            if (!coord5179) return null;
            return transform(coord5179, 'EPSG:5179', 'EPSG:4326');
          }}
        />
      )}
      <div className="setting-wrapper">
        <Button className="text-sm" onClick={handleClickWindLayerBtn}>
          WIND
        </Button>
      </div>
    </Container>
  );
};

export { GisWindMapEarth };

// TMP 범위별 색상 지정
const heatmapIntervals = {
  tmp: [
    {
      min: 0,
      max: 10,
      gradient: [
        'rgba(180, 210, 255, 1)', // 연파랑
        'rgba(0, 100, 255, 1)', // 진파랑
      ],
    },
    {
      min: 10,
      max: 20,
      gradient: [
        'rgba(180, 255, 180, 1)', // 연초록
        'rgba(0, 128, 0, 1)', // 진초록
      ],
    },
    {
      min: 20,
      max: 30,
      gradient: [
        'rgba(255, 245, 180, 1)', // 연노랑
        'rgba(255, 200, 0, 1)', // 진노랑
      ],
    },
    {
      min: 30,
      max: 40,
      gradient: [
        'rgba(255, 180, 180, 1)', // 연빨강
        'rgba(200, 0, 0, 1)', // 진빨강
      ],
    },
  ],
  o3: [
    {
      min: 0,
      max: 0.0301,
      gradient: [
        'rgba(180, 210, 255, 1)', // 연파랑
        'rgba(0, 100, 255, 1)', // 진파랑
      ],
    },
    {
      min: 0.0301,
      max: 0.0901,
      gradient: [
        'rgba(180, 255, 180, 1)', // 연초록
        'rgba(0, 128, 0, 1)', // 진초록
      ],
    },
    {
      min: 0.0901,
      max: 0.1501,
      gradient: [
        'rgba(255, 245, 180, 1)', // 연노랑
        'rgba(255, 200, 0, 1)', // 진노랑
      ],
    },
    {
      min: 0.1501,
      max: 0.3001,
      gradient: [
        'rgba(255, 180, 180, 1)', // 연빨강
        'rgba(200, 0, 0, 1)', // 진빨강
      ],
    },
  ],
  pm10: [
    {
      min: 0,
      max: 31,
      gradient: [
        'rgba(180, 210, 255, 1)', // 연파랑
        'rgba(0, 100, 255, 1)', // 진파랑
      ],
    },
    {
      min: 31,
      max: 81,
      gradient: [
        'rgba(180, 255, 180, 1)', // 연초록
        'rgba(0, 128, 0, 1)', // 진초록
      ],
    },
    {
      min: 81,
      max: 151,
      gradient: [
        'rgba(255, 245, 180, 1)', // 연노랑
        'rgba(255, 200, 0, 1)', // 진노랑
      ],
    },
    {
      min: 151,
      max: 320,
      gradient: [
        'rgba(255, 180, 180, 1)', // 연빨강
        'rgba(200, 0, 0, 1)', // 진빨강
      ],
    },
  ],
  'pm2.5': [
    {
      min: 0,
      max: 16,
      gradient: [
        'rgba(180, 210, 255, 1)', // 연파랑
        'rgba(0, 100, 255, 1)', // 진파랑
      ],
    },
    {
      min: 16,
      max: 36,
      gradient: [
        'rgba(180, 255, 180, 1)', // 연초록
        'rgba(0, 128, 0, 1)', // 진초록
      ],
    },
    {
      min: 36,
      max: 76,
      gradient: [
        'rgba(255, 245, 180, 1)', // 연노랑
        'rgba(255, 200, 0, 1)', // 진노랑
      ],
    },
    {
      min: 76,
      max: 200,
      gradient: [
        'rgba(255, 180, 180, 1)', // 연빨강
        'rgba(200, 0, 0, 1)', // 진빨강
      ],
    },
  ],
};

// 히트맵 범례
const HeatmapLegend = ({ intervals, title, visible }) => {
  return (
    <LegendContainer className={visible ? '' : 'hidden'}>
      <LegendTitle>{title.toUpperCase()}</LegendTitle>
      {intervals
        .slice()
        .reverse()
        .map((interval, idx) => (
          <LegendItem key={idx}>
            <ColorBox
              style={{
                background: `linear-gradient(to right, ${interval.gradient.join(
                  ', '
                )})`,
              }}
            />
            <RangeLabel>
              {interval.min} ~ {interval.max}
            </RangeLabel>
          </LegendItem>
        ))}
    </LegendContainer>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;

  // 국토정보지리원 로고
  .ol-attribution {
    width: 96px;
    height: 16px;
    top: 96%;
    right: 2%;

    ul {
      margin: 0;
      padding: 0;
    }
    li {
      list-style-type: none;
    }
    button {
      display: none;
    }
  }
  .ol-control {
    position: absolute;
    line-height: normal;
  }

  // 줌 컨트롤러
  .ol-zoom {
    position: absolute;
    width: 50px;
    top: 90px;
    right: 20px;
    padding: 0;
    margin: 0;
    background: #000000;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 1px;

    .ol-zoom-in,
    .ol-zoom-out {
      width: 100%;
      height: 24px;
      padding: 0;
      background: #ffffff;
      border: none;
      font-weight: bold;
      color: #333;
      cursor: pointer;
    }
    .ol-zoom-in {
      border-radius: 2px 2px 0 0;
    }
    .ol-zoom-out {
      border-radius: 0 0 2px 2px;
    }
    .ol-zoom-in.ol-has-tooltip:hover[role='tooltip'],
    .ol-zoom-in.ol-has-tooltip:focus[role='tooltip'] {
      top: 3px;
    }
    .ol-zoom-out.ol-has-tooltip:hover [role='tooltip'],
    .ol-zoom-out.ol-has-tooltip:focus [role='tooltip'] {
      top: 232px;
    }
  }

  // 배경지도
  .gis-control-container {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    font-family: 'Pretendard GOV Variable', 'Pretendard GOV', sans-serif;

    .gis-control {
      button {
        box-sizing: border-box;
        width: 50px;
        height: 50px;
        padding: 3px;
        background: #ffffff;
        border-radius: 3px 5px;
        border: none;
        font-size: 11px;
        line-height: 14px;
        color: #333;
        cursor: pointer;
      }
    }
    .gis-list {
      position: absolute;
      right: 100%;
      top: auto;
      width: 76px;
      height: 0;
      margin-top: 12px;
      padding-right: 10px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s;

      button {
        position: static;
        width: 100%;
        margin: 0;
        padding: 0;
        padding-bottom: 1px;
        background: #333;
        border-radius: 0;
        border: none;
        outline: none;
        font-size: 11px;
        line-height: 33px;
        text-align: center;
        color: #999;
        cursor: pointer;
        overflow: hidden;
      }
      button:hover {
        background: #222;
        color: #ff96a3;
      }
    }
    .gis-list:after {
      position: absolute;
      width: 0;
      height: 0;
      top: 15px;
      right: 0px;
      border: 5px solid transparent;
      border-left-color: #333;
      display: block;
      content: '';
    }
    .gis-list.active {
      height: calc(36px * 3 - 1px);
    }
  }

  // 범례
  .ol-legend.ol-legend-right {
    width: fit-content;
    padding: 0 10px 0 0;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.8);
    font-family: 'Pretendard GOV Variable', 'Pretendard GOV', sans-serif;

    button {
      outline: none;
      margin: 1px;
      padding: 0;
      color: var(--ol-subtle-foreground-color);
      font-weight: bold;
      text-decoration: none;
      font-size: inherit;
      text-align: center;
      height: 1.375em;
      width: 1.375em;
      line-height: 0.4em;
      background-color: var(--ol-background-color);
      border: none;
      border-radius: 2px;
    }
  }
  .ol-legend.ol-legend-right.active {
    display: block;
  }

  // 2025-01-07 추가
  .hidden {
    display: none;
  }

  .setting-wrapper {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 200px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background: #ffffff;
    border-radius: 5px;
    border: 1px solid #cccccc;
  }

  .options-wrapper {
    position: absolute;
    top: 180px;
    left: 40px;
    width: 200px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background: #ffffff;
    border-radius: 5px;
    border: 1px solid #cccccc;
  }
`;

const LegendContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 2000;
  padding: 15px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  font-family: sans-serif;
  box-shadow: 0 2px 4px #cccccc;
`;

const LegendTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const ColorBox = styled.div`
  width: 70px;
  height: 16px;
  border: 1px solid #cccccc;
  margin-right: 6px;
`;

const RangeLabel = styled.span`
  font-size: 14px;
`;
