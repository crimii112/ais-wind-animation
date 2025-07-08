import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import { WindLayer } from 'ol-wind';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { fromLonLat, transform } from 'ol/proj';
import { Point } from 'ol/geom';

import MapContext from '@/components/map/MapContext';
import { Input, Button, GridWrapper } from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';

/**
 * - 사용자가 선택한 date, time을 기준으로 'https://nomads.ncep.noaa.gov' 데이터를 grib2 => json으로 변환하여 받아옴
 * - 바람/히트맵(온도) 데이터와 ol-wind의 WindLayer, openlayers의 HeatmapLayer 사용하여 바람 애니메이션, 온도 히트맵 구현
 */
const GisWindMapTest = ({ SetMap, mapId }) => {
  const map = useContext(MapContext);

  const FIXED_GEOGRAPHIC_RADIUS_METERS = 30000; // 지리적 반경(m 단위)
  const heatmapSource = new VectorSource({ wrapX: false });
  const heatmapLayer = new HeatmapLayer({
    source: heatmapSource,
    id: 'heatmap',
    zIndex: 500,
    opacity: 0.6, // 히트맵 투명도
    radius: 25, // 히트맵 반경
    blur: 25, // 히트맵 블러 효과
    weight: f => {
      const weight = f.get('weight') || 0;
      return Math.pow(weight, 2);
    },
  });

  const [startWindAnimation, setStartWindAnimation] = useState(true); // 시작/정지
  const [onWindAnimation, setOnWindAnimation] = useState(true); // 켜기/끄기

  const [selectedDateJson, setSelectedDateJson] = useState({
    // api에 보낼 날짜와 시간 정보
    date: '2025-06-25',
    time: '00',
  });

  useEffect(() => {
    if (!map.ol_uid) {
      return;
    }

    map.getView().setZoom(1);
    map.getView().setCenter([1005321.0, 1771271.0]);

    map.addLayer(heatmapLayer);

    updateHeatmapRadius();
    map.getView().on('change:resolution', updateHeatmapRadius);

    if (SetMap) {
      SetMap(map);
    }
  }, [map, map.ol_uid]);

  // 히트맵 반경 업데이트 함수(해상도 변화 시 동적 재조정)
  const updateHeatmapRadius = () => {
    const view = map.getView();
    const resolution = view.getResolution();
    if (!resolution) return;

    // EPSG:5179는 m 단위 해상도
    // heatmapLayer.radius는 픽셀 단위라서 -> 지리적 거리 / 해상도로 계산
    const radiusInPixels = FIXED_GEOGRAPHIC_RADIUS_METERS / resolution;
    console.log(resolution, radiusInPixels);
    heatmapLayer.setRadius(radiusInPixels);
    heatmapLayer.setBlur(radiusInPixels);
  };

  // 바람 레이어 그리기 버튼 핸들러
  const handleClickWindLayerBtn = async () => {
    document.body.style.cursor = 'progress';

    const prevLayers = map.getLayers().getArray();
    prevLayers.forEach(layer => {
      if (layer instanceof WindLayer) {
        map.removeLayer(layer);
      }
    });

    heatmapSource.clear();
    heatmapLayer.getSource().clear();

    map.getView().setZoom(1);
    map.getView().setCenter([1005321.0, 1771271.0]);

    //날짜 형식 바꿔서 데이터 보내기
    const newJson = { ...selectedDateJson };
    const formattedDate = newJson.date.replace(/-/g, '');
    newJson.date = formattedDate;

    await axios
      .post(`${import.meta.env.VITE_WIND_API_URL}/api/wind/test`, newJson)
      .then(res => res.data)
      .then(data => {
        console.log(data);

        const minWeight = Math.min(...data.heatmapData.map(item => item.tmp));
        const maxWeight = Math.max(...data.heatmapData.map(item => item.tmp));

        const normalize = x => (x - minWeight) / (maxWeight - minWeight);

        const heatmapFeatures = data.heatmapData.map(item => {
          const feature = new Feature({
            geometry: new Point(
              transform([item.lon, item.lat], 'EPSG:4326', 'EPSG:5179')
            ),
            weight: normalize(item.tmp),
          });
          return feature;
        });
        console.log(heatmapFeatures);
        heatmapSource.addFeatures(heatmapFeatures);
        heatmapLayer.setVisible(true);

        const windLayer = new WindLayer(data.windData, {
          forceRender: true,
          zIndex: 1000,
          projection: 'EPSG:5179',
          windOptions: {
            velocityScale: 0.0005, // 바람 속도에 따라 움직이는 속도 배율 (기본: 0.005)
            paths: 5000, // 동시에 렌더링할 입자 수 (기본: 5000)
            lineWidth: 2, // 입자 선의 두께 (기본: 1)
            speedFactor: 0.5, // 입자 속도 배율 (velocityScale과 별개) (기본: 1)
            particleAge: 70, // 입자의 수명 (기본: 60)
            // colorScale: [
            //   // 속도에 따른 색상 배열
            //   'rgb(36,104, 180)',
            //   'rgb(60,157, 194)',
            //   'rgb(128,205,193)',
            //   'rgb(151,218,168)',
            //   'rgb(198,231,181)',
            //   'rgb(238,247,217)',
            //   'rgb(255,238,159)',
            //   'rgb(252,217,125)',
            //   'rgb(255,182,100)',
            //   'rgb(252,150,75)',
            //   'rgb(250,112,52)',
            //   'rgb(245,64,32)',
            //   'rgb(237,45,28)',
            //   'rgb(220,24,32)',
            //   'rgb(180,0,35)',
            // ],
          },
        });

        map.addLayer(windLayer);

        console.log(windLayer.getData());
      })
      .catch(error => {
        console.error('Error fetching wind data:', error);
        alert(
          '바람 데이터를 가져오는 데 실패했습니다. 나중에 다시 시도해주세요.'
        );
      });

    document.body.style.cursor = 'default';
  };

  // 바람 레이어 시작/정지 버튼 핸들러
  const handleClickWindLayerStartStopBtn = () => {
    setStartWindAnimation(prev => !prev);
  };
  useEffect(() => {
    if (!map.ol_uid) return;

    const windLayer = map
      .getLayers()
      .getArray()
      .find(layer => layer instanceof WindLayer);

    if (!windLayer) return;

    if (startWindAnimation) {
      windLayer.renderer_.wind.start();
    } else {
      windLayer.renderer_.wind.stop();
    }
  }, [startWindAnimation]);

  // 바람 레이어 켜기/끄기 버튼 핸들러
  const handleClickWindLayerOnOffBtn = () => {
    setOnWindAnimation(prev => !prev);
  };
  useEffect(() => {
    if (!map.ol_uid) return;

    const windLayer = map
      .getLayers()
      .getArray()
      .find(layer => layer instanceof WindLayer);

    if (!windLayer) return;

    windLayer.setVisible(onWindAnimation);
  }, [onWindAnimation]);

  return (
    <Container id={mapId}>
      <div className="setting-wrapper">
        <Input
          type="date"
          className="text-sm"
          value={selectedDateJson.date}
          onChange={e =>
            setSelectedDateJson(prev => ({
              ...prev,
              date: e.target.value,
            }))
          }
        />
        <Select
          className="text-sm"
          defaultValue={selectedDateJson.time}
          onChange={e =>
            setSelectedDateJson(prev => ({
              ...prev,
              time: e.target.value,
            }))
          }
        >
          <Option value="00">00시</Option>
          <Option value="06">06시</Option>
          <Option value="12">12시</Option>
          <Option value="18">18시</Option>
        </Select>
        <Button className="text-sm" onClick={handleClickWindLayerBtn}>
          바람 지도 그리기
        </Button>
        <GridWrapper className="grid-cols-2 gap-2">
          <Button
            className="text-sm"
            onClick={handleClickWindLayerStartStopBtn}
          >
            start/stop
          </Button>
          <Button className="text-sm" onClick={handleClickWindLayerOnOffBtn}>
            on/off
          </Button>
        </GridWrapper>
      </div>
      {/* <div className="options-wrapper">
        <span className="pb-1 text-center border-b-1 border-b-gray-300">
          옵션 설정
        </span>
        <GridWrapper className="grid-cols-[1fr_2fr] gap-2">
          <span className="text-sm text-center">velocityScale</span>{' '}
        </GridWrapper>
        <GridWrapper className="grid-cols-2 gap-2">
          <Button
            className="text-sm"
            onClick={handleClickWindLayerStartStopBtn}
          >
            start/stop
          </Button>
          <Button className="text-sm" onClick={handleClickWindLayerOnOffBtn}>
            on/off
          </Button>
        </GridWrapper>
      </div> */}
    </Container>
  );
};

export { GisWindMapTest };

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
    background: rgba(255, 255, 255, 0);
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
`;
