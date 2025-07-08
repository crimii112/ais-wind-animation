import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import { WindLayer } from 'ol-wind';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { transform } from 'ol/proj';
import { Point } from 'ol/geom';

import MapContext from '@/components/map/MapContext';
import { Button, GridWrapper, Input } from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';

/**
 * 회사 모델 파일을 netCDF => json으로 변환하여 데이터 받아옴
 * 바람은 공통, 사용자가 선택한 옵션(tmp, o3, pm10, pm2.5)에 따라 히트맵 달라짐
 * ol-wind의 WindLayer, openlayers의 HeatmapLayer 사용
 */
const GisWindMap = ({ SetMap, mapId }) => {
  const map = useContext(MapContext);
  const FIXED_GEOGRAPHIC_RADIUS_METERS = 12000; // 지리적 반경(m 단위)

  const [selectedOption, setSelectedOption] = useState('tmp');
  const [selectedWindGap, setSelectedWindGap] = useState(1);
  const [selectedTstep, setSelectedTstep] = useState(1);
  const [visibleLegend, setVisibleLegend] = useState(true);

  const [tstepTime, setTstepTime] = useState();

  // tstep 자동 증가
  const [intervalId, setIntervalId] = useState(null);
  const [autoPlaying, setAutoPlaying] = useState(false);

  useEffect(() => {
    if (!map.ol_uid) {
      return;
    }

    map.getView().setZoom(2);
    map.getView().setCenter([1005321.0, 1771271.0]);

    map.getView().on('change:resolution', updateHeatmapRadius);

    if (SetMap) {
      SetMap(map);
    }
  }, [map, map.ol_uid]);

  // 히트맵 반경 업데이트 함수(해상도 변화 시 동적 재조정)
  const updateHeatmapRadius = () => {
    if (!map) return;

    const view = map.getView();
    const resolution = view.getResolution();
    if (!resolution) return;

    // EPSG:5179는 m 단위 해상도
    // heatmapLayer.radius는 픽셀 단위라서 -> 지리적 거리 / 해상도로 계산
    const radiusInPixels = FIXED_GEOGRAPHIC_RADIUS_METERS / resolution;

    map
      .getLayers()
      .getArray()
      .forEach(layer => {
        if (layer instanceof HeatmapLayer) {
          layer.setRadius(radiusInPixels);
          layer.setBlur(radiusInPixels);
        }
      });
  };

  // 바람/히트맵 그리기 버튼 핸들러
  const handleClickWindLayerBtn = async () => {
    document.body.style.cursor = 'progress';
    // setVisibleLegend(false);

    map.getView().setZoom(2);
    map.getView().setCenter([1005321.0, 1771271.0]);

    await axios
      .post(`${import.meta.env.VITE_WIND_API_URL}/api/wind`, {
        option: selectedOption,
        windGap: selectedWindGap,
        tstep: selectedTstep,
      })
      .then(res => res.data)
      .then(data => {
        console.log(data);

        // 기존 바람/히트맵 레이어 삭제
        const prevLayers = map.getLayers().getArray();
        [...prevLayers].forEach(layer => {
          if (layer instanceof WindLayer || layer instanceof HeatmapLayer) {
            map.removeLayer(layer);
          }
        });

        if (data.metaData) setTstepTime(data.metaData.time);

        if (!data.heatmapData) return;

        // 히트맵 레이어 => heatmapData 사용
        const heatmapAllFeatures = data.heatmapData.map(item => {
          const feature = new Feature({
            geometry: new Point(
              transform([item.lon, item.lat], 'EPSG:4326', 'EPSG:5179')
            ),
            value: item.value,
          });
          return feature;
        });

        heatmapIntervals[`${selectedOption}`].forEach(interval => {
          const rangeFeatures = filterByRange(
            heatmapAllFeatures,
            interval.min,
            interval.max
          );

          if (rangeFeatures.length > 0) {
            const layer = createHeatmapLayer(rangeFeatures, interval.gradient);
            map.addLayer(layer);
          }
        });

        updateHeatmapRadius();
        setVisibleLegend(true);

        if (!data.windData) return;

        // 바람 레이어 => windData 사용
        const windLayer = new WindLayer(data.windData, {
          forceRender: true,
          zIndex: 1000,
          projection: 'EPSG:5179',
          windOptions: {
            velocityScale: 0.001, // 바람 속도에 따라 움직이는 속도 배율 (기본: 0.005)
            paths: 10000, // 동시에 렌더링할 입자 수 (기본: 5000)
            lineWidth: 2, // 입자 선의 두께 (기본: 1)
            speedFactor: 0.5, // 입자 속도 배율 (velocityScale과 별개) (기본: 1)
            particleAge: 100, // 입자의 수명 (기본: 60)
          },
        });

        map.addLayer(windLayer);

        if (selectedOption !== 'tmp' && !autoPlaying) startAutoPlay();
      })
      .catch(error => {
        console.error('Error fetching wind data:', error);
        alert(
          '바람 데이터를 가져오는 데 실패했습니다. 나중에 다시 시도해주세요.'
        );
      });

    document.body.style.cursor = 'default';
  };

  // heatmapIntervals 범위에 맞는 features 찾기
  function filterByRange(features, min, max) {
    return features
      .filter(f => {
        const v = f.get('value');
        return v > min && v <= max;
      })
      .map(f => {
        const v = f.get('value');
        const weight = (v - min) / (max - min);
        f.set('weight', weight); // Heatmap weight을 고정
        return f;
      });
  }

  // heatmapLayer 생성 함수
  function createHeatmapLayer(features, gradient) {
    return new HeatmapLayer({
      source: new VectorSource({
        features: features,
      }),
      gradient: gradient,
      opacity: 0.7,
    });
  }

  // 선택 물질 onChange 핸들러
  const handleChangeSelectedOption = e => {
    stopAutoPlay();
    setVisibleLegend(false);
    setSelectedOption(e.target.value);
  };

  // 간격 설정, TSTEP 변경 시 실행 함수
  useEffect(() => {
    if (!map.ol_uid) return;

    // windLayer나 heatmapLayer가 깔려있을 때만 데이터 불러오는 함수 실행
    // 처음에는 바람/히트맵 그리기 버튼 눌러야함
    const prevLayers = map.getLayers().getArray();
    for (const layer of prevLayers) {
      if (layer instanceof WindLayer || layer instanceof HeatmapLayer) {
        handleClickWindLayerBtn();
        break;
      }
    }
  }, [selectedTstep]);

  // tstep 자동 증가
  const startAutoPlay = () => {
    if (intervalId) return;

    setAutoPlaying(true);

    const id = setInterval(() => {
      setSelectedTstep(prev => (prev >= 24 ? 1 : prev + 1));
    }, 3000);

    setIntervalId(id);
  };

  const stopAutoPlay = () => {
    setAutoPlaying(false);

    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // interval 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <Container id={mapId}>
      <div className="setting-wrapper">
        <Select
          className="text-sm"
          defaultValue={selectedOption}
          onChange={handleChangeSelectedOption}
        >
          <Option value="tmp">TMP</Option>
          <Option value="o3">O3</Option>
          <Option value="pm10">PM10</Option>
          <Option value="pm2.5">PM2.5</Option>
        </Select>
        {selectedOption !== 'tmp' && (
          <>
            <GridWrapper className="grid-cols-[1fr_2fr] gap-1">
              <span className="flex items-center justify-center text-sm">
                격자 간격
              </span>
              <Input
                id="wind-gap"
                className="w-full h-fit text-sm"
                type="number"
                defaultValue={selectedWindGap}
                min={1}
                max={10}
                onChange={e => {
                  setSelectedWindGap(e.target.value);
                  stopAutoPlay();
                }}
              />
            </GridWrapper>
            <GridWrapper className="grid-cols-[1fr_2fr] gap-1">
              <span className="flex items-center justify-center text-sm">
                TSTEP
              </span>
              <Input
                id="tstep"
                className="w-full h-fit text-sm"
                type="number"
                value={selectedTstep}
                min={1}
                max={24}
                onChange={e => setSelectedTstep(Number(e.target.value))}
              />
            </GridWrapper>
            <div className="flex w-full items-center justify-center text-red-400 font-semibold">
              {tstepTime && tstepTime}
            </div>
          </>
        )}
        <Button className="text-sm" onClick={handleClickWindLayerBtn}>
          바람/히트맵 그리기
        </Button>
        {selectedOption !== 'tmp' && (
          <Button
            className="text-sm"
            onClick={autoPlaying ? stopAutoPlay : startAutoPlay}
          >
            {autoPlaying ? '자동재생 중지' : '자동재생 시작'}
          </Button>
        )}
      </div>
      <HeatmapLegend
        intervals={heatmapIntervals[`${selectedOption}`]}
        title={selectedOption}
        visible={visibleLegend}
      />
    </Container>
  );
};

export { GisWindMap };

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
