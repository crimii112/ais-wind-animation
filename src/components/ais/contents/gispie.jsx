import { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Chart from 'ol-ext/style/Chart';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Stroke, Style } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { easeOut } from 'ol/easing';
import { unByKey } from 'ol/Observable';

import usePostRequest from '@/hooks/usePostRequest';
import MapContext from '@/components/map/MapContext';
import { GridWrapper, Input } from '@/components/ui/common';
import { Select, Option } from '@/components/ui/select-box';

const GisPie = ({ SetMap, mapId }) => {
  const map = useContext(MapContext);
  const postMutation = usePostRequest();

  const gsonFormat = new GeoJSON();

  const sourceChartRef = useRef(new VectorSource({ wrapX: false }));
  const sourceChart = sourceChartRef.current;
  const layerChart = new VectorLayer({
    source: sourceChart,
    style: null,
    id: 'chart',
    zIndex: 10,
  });

  const [chartType, setChartType] = useState();
  const [radius, setRadius] = useState(20);
  const [color, setColor] = useState('classic');

  const animationRef = useRef(false);
  const animationListenerRef = useRef(null);

  useEffect(() => {
    if (!map.ol_uid) {
      return;
    }

    map.addLayer(layerChart);

    map.getView().setZoom(1);
    map.getView().setCenter([1005321.0, 1771271.0]);

    if (SetMap) {
      SetMap(map);
    }

    // return () => {
    //   map.removeLayer(layerChart);
    //   sourceChart.clear();
    //   if (animationListenerRef.current) {
    //     unByKey(animationListenerRef.current);
    //   }
    // }
  }, [map, map.ol_uid]);

  const addChartFeature = async chartType => {
    document.body.style.cursor = 'progress';

    let siteFeatures = [];
    await axios
      .post(
        '/ais/gis/datas.do',
        { pagetype: 'site', areatype: '8' },
        {
          baseURL: import.meta.env.VITE_API_URL,
          responseEncoding: 'UTF-8',
          responseType: 'json',
        }
      )
      .then(res => res.data)
      .then(data => {
        siteFeatures = data.gnrl;
      });

    const sect = chartType === 'pie' ? 'all' : 'year';
    // test 데이터
    const apiData = {
      page: 'intensive/autopiegraph',
      date: ['DATARF;2015/01/01 01;2018/12/31 24'],
      site: [
        '132001',
        '131001',
        '324001',
        '100000',
        '525001',
        '111001',
        '238001',
        '823001',
        '735001',
        '339001',
        '534001',
        '633001',
      ],
      cond: {
        sect: sect,
        poll: 'calc',
        dust: 'include',
        stats: '',
        eqType: 'SMPS_APS_O',
      },
      mark: [
        { id: 'unit1', checked: false },
        { id: 'unit2', checked: false },
      ],
      digitlist: { pm: 1, lon: 3, carbon: 1, metal: 1, gas: 1, other: 6 },
      polllist: [
        { id: 'High', checked: true, signvalue: '#' },
        { id: 'Low', checked: true, signvalue: '##' },
        { id: 'dumy', checked: false },
      ],
    };

    let apiRes = await postMutation.mutateAsync({
      url: 'ais/srch/datas.do',
      data: apiData,
    });
    console.log(apiRes);

    if (chartType === 'pie') {
      apiRes.rstList.forEach(data => {
        const siteFeature = siteFeatures.find(item => {
          return (
            gsonFormat.readFeature(item.gis).get('site_nm') === data.groupNm
          );
        });
        if (!siteFeature) {
          return;
        }

        const feature = gsonFormat.readFeature(siteFeature.gis);
        const siteCoord = feature.getGeometry().getCoordinates();

        const siteData = [
          parseFloat(data.amSul) ? parseFloat(data.amSul) : 0,
          parseFloat(data.amNit) ? parseFloat(data.amNit) : 0,
          parseFloat(data.etc) ? parseFloat(data.etc) : 0,
          parseFloat(data.om) ? parseFloat(data.om) : 0,
          parseFloat(data.ec) ? parseFloat(data.ec) : 0,
        ];
        const siteSum = siteData.reduce((acc, curr) => acc + curr, 0);

        const chartFeature = new Feature({
          geometry: new Point(siteCoord),
          data: siteData,
          sum: siteSum,
          chartType: chartType,
        });

        sourceChart.addFeature(chartFeature);
      });
    } else if (chartType === 'bar') {
      const groupedData = apiRes.rstList.reduce((acc, curr) => {
        if (!acc[curr.groupNm]) {
          acc[curr.groupNm] = [];
        }
        acc[curr.groupNm].push(curr);
        return acc;
      }, {});

      Object.keys(groupedData).forEach(groupNm => {
        const siteFeature = siteFeatures.find(item => {
          return gsonFormat.readFeature(item.gis).get('site_nm') === groupNm;
        });
        if (!siteFeature) {
          return;
        }

        const feature = gsonFormat.readFeature(siteFeature.gis);
        const siteCoord = feature.getGeometry().getCoordinates();

        const siteData = groupedData[groupNm].map(item => {
          return parseFloat(item.pm25) ? parseFloat(item.pm25) : 0;
        });
        const siteSum = siteData.reduce((acc, curr) => acc + curr, 0);

        const chartFeature = new Feature({
          geometry: new Point(siteCoord),
          data: siteData,
          sum: siteSum,
          chartType: chartType,
        });

        sourceChart.addFeature(chartFeature);
      });
    }

    document.body.style.cursor = 'default';
  };

  const chartStyle = feature => {
    const chartType = feature.get('chartType');
    const data = feature.get('data');

    const style = [
      new Style({
        image: new Chart({
          type: chartType,
          colors: color, // ['classic', 'dark', 'pale', 'neon', 'red, green, blue, magenta']
          radius: radius,
          data: data,
          rotateWithView: true,
          animation: animationRef.current,
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    ];
    style[0].getImage().setAnimation(animationRef.current);

    return style;
  };

  // 애니메이션 함수
  const doAnimate = () => {
    // 기존 리스너가 살아있으면 제거
    if (animationListenerRef.current) {
      unByKey(animationListenerRef.current);
      animationListenerRef.current = null;
    }

    const start = new Date().getTime();
    const duration = 1000;
    animationRef.current = 0;

    console.log('Adding prerender listener again');
    animationListenerRef.current = layerChart.on(
      ['precompose', 'prerender'],
      event => {
        console.log('🔥 prerender event fired');
        const frameState = event.frameState;
        const elapsed = frameState.time - start;

        if (elapsed > duration) {
          unByKey(animationListenerRef.current);
          animationListenerRef.current = null;
          animationRef.current = false;
        } else {
          animationRef.current = easeOut(elapsed / duration);
          frameState.animate = true;
        }

        layerChart.changed();
      }
    );

    layerChart.changed();
    map.render();
  };

  const handleClickDrawPieChartBtn = async () => {
    // 이전 애니메이션 정리
    if (animationListenerRef.current) {
      unByKey(animationListenerRef.current);
      animationListenerRef.current = null;
    }

    setChartType('pie');
    setRadius(20);
    setColor('classic');

    sourceChart.clear();
    layerChart.getSource().clear();

    await addChartFeature('pie');

    layerChart.setStyle(chartStyle);

    doAnimate();

    layerChart.changed();
    map.render();
  };

  const handleClickDrawBarChartBtn = async () => {
    // 이전 애니메이션 정리
    if (animationListenerRef.current) {
      unByKey(animationListenerRef.current);
      animationListenerRef.current = null;
    }

    setChartType('bar');
    setRadius(20);
    setColor('classic');

    sourceChart.clear();
    layerChart.getSource().clear();
    layerChart.setStyle(null);

    await addChartFeature('bar');

    layerChart.setStyle(chartStyle);

    doAnimate();

    layerChart.changed();
    map.render();
  };

  // 차트 설정 변경(color, radius)
  useEffect(() => {
    if (!layerChart || !sourceChart.getFeatures().length) return;

    const features = sourceChart.getFeatures();

    features.forEach(feature => {
      const newStyle = [
        new Style({
          image: new Chart({
            type: chartType,
            colors: color, // ['classic', 'dark', 'pale', 'neon', 'red, green, blue, magenta']
            radius: radius,
            data: feature.get('data'),
            rotateWithView: true,
            animation: animationRef.current,
            stroke: new Stroke({
              color: 'white',
              width: 2,
            }),
          }),
        }),
      ];

      feature.setStyle(newStyle);
    });

    layerChart.changed();
  }, [color, radius]);

  const handleChangeColor = e => {
    setColor(e.target.value);
  };

  const handleChangeRadius = e => {
    setRadius(Number(e.target.value));
  };

  return (
    <Container id={mapId}>
      <div className="draw-chart-btn-wrapper">
        <button className="draw-chart-btn" onClick={handleClickDrawPieChartBtn}>
          파이 차트 그리기
        </button>
        <button className="draw-chart-btn" onClick={handleClickDrawBarChartBtn}>
          바 차트 그리기
        </button>
      </div>
      <div className="set-chart-wrapper">
        <span>차트 설정</span>
        <GridWrapper className="grid-cols-[1fr_2fr] justify-start gap-2">
          <span className="m-auto">Radius</span>
          <Input
            type="number"
            defaultValue={radius}
            className="w-[113px]"
            onChange={handleChangeRadius}
          />
        </GridWrapper>
        <GridWrapper className="grid-cols-[1fr_2fr] justify-start gap-2">
          <span className="m-auto">Color</span>
          <Select value={color} onChange={handleChangeColor}>
            <Option value="classic">Classic</Option>
            <Option value="dark">Dark</Option>
            <Option value="pale">Pale</Option>
            <Option value="pastel">Pastel</Option>
            <Option value="neon">Neon</Option>
          </Select>
        </GridWrapper>
      </div>
    </Container>
  );
};

export { GisPie };

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

  // 차트 그리기 버튼
  .draw-chart-btn-wrapper {
    position: absolute;
    top: 40px;
    left: 40px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .draw-chart-btn {
    background: #ffffff;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #cccccc;
    cursor: pointer;
  }

  .set-chart-wrapper {
    position: absolute;
    top: 150px;
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

const PopupContainer = styled.div`
  position: relative;
  top: 28px;
  left: -50px;
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

  &:after,
  &:before {
    position: absolute;
    width: 0;
    height: 0;
    bottom: 100%;
    border: solid transparent;
    content: ' ';
    pointer-event: none;
  }
  &:after {
    left: 48px;
    margin-left: -10px;
    border-bottom-color: #ffffff;
    border-width: 10px;
  }
  &:before {
    left: 48px;
    margin-left: -11px;
    border-bottom-color: #cccccc;
    border-width: 11px;
  }
`;

const PopupWrap = styled.div`
  width: 100%;
  font-family: 'Pretendard GOV Variable', 'Pretendard GOV', sans-serif;
  font-size: 15px;
  line-height: 18px;
  color: #000000;
  white-space: pre-line;
`;
