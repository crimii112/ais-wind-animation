import { useEffect, useState } from 'react';
import { Map as OlMap, View } from 'ol';
import { Attribution, Control, defaults as defaultControls } from 'ol/control';
import { MouseWheelZoom, defaults as defaultInteractions, } from 'ol/interaction';
import { Tile as TileLayer } from 'ol/layer';
import { WMTS } from 'ol/source';
import { get as getProjection } from 'ol/proj';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getTopLeft } from 'ol/extent';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import MapContext from './MapContext';

/*
 * Openlayers 지도 객체 만드는 파일
   - WMTS를 이용해 ais서버로 우회해서 지도타일이미지를 불러옴 ( 폐쇄망 및 모든 port를 뚫을 수 없는 특성 때문 )
   - layer는 기본이미지, 백지도, (위성지도-국토정보플랫폼 폐쇄망 서비스가 없음), 지도없음 으로 되어있음
 */

const MapNgii = ({ children, id='ngii' }) => {
  const [mapObj, setMapObj] = useState({});
  const [btnBActive, setBtnBActive] = useState('active'); //Base
  const [btnWActive, setBtnWActive] = useState('');       // White
  const [btnSActive, setBtnSActive] = useState('');       // Satellite
  const [btnNctive, setBtnNActive] = useState('');        //null

  proj4.defs( 'EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs' );
  register(proj4);
  const epsg = getProjection('EPSG:5179');
  epsg.setExtent( [-200000.0, -28024123.62, 31824123.62, 4000000.0] );

  // 측정소 데이터에 맞춘 extent
  const [mapLayer, setMapLayer] = useState([
    new TileLayer({
      source: new WMTS({
        url: '/ais/proxy/ngii/hybrid',
        matrixSet: 'EPSG:5179',
        format: 'image/png',
        projection: epsg,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(epsg.getExtent()),
          resolutions: [ 2088.96, 1044.48, 522.24, 261.12, 130.56, 65.28, 32.64, 16.32, 8.16, 4.08, 2.04, 1.02, 0.51, 0.255, ],
          matrixIds: [ 'L05','L06','L07','L08','L09','L10','L11','L12','L13','L14','L15','L16','L17','L18', ],
        }),
        style: 'korean',
        layer: 'korean_map',
        wrapX: true,
        // attributions: [ `<img style="width:96px; height:16px;"src="${urlvalue}/img/process/ms/map/common/img_btoLogo3.png" alt="로고">` ],   // 로고는 나중에 추가해야할 수도 있어서 완전 삭제는 안함
        crossOrigin: 'anonymous',
      }),
      id: 'base',
    }),
    new TileLayer({
      // 백지도
      source: new WMTS({
        url: '/ais/proxy/ngii/hybrid',
        matrixSet: 'EPSG:5179',
        format: 'image/png',
        projection: epsg,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(epsg.getExtent()),
          resolutions: [ 2088.96, 1044.48, 522.24, 261.12, 130.56, 65.28, 32.64, 16.32, 8.16, 4.08, 2.04, 1.02, 0.51, 0.255, ],
          matrixIds: [ 'L05','L06','L07','L08','L09','L10','L11','L12','L13','L14','L15','L16','L17','L18', ],
        }),
        style: 'korean',
        layer: 'white_map',
        wrapX: true,
        // attributions: [ `<img style="width:96px; height:16px;"src="${urlvalue}/img/process/ms/map/common/img_btoLogo3.png" alt="로고">` ],
        crossOrigin: 'anonymous',
      }),
      id: 'white',
      visible: false,
    }),
  ]);

  useEffect(() => {
    const map = new OlMap({
      controls: defaultControls({ zoom: true, rotate: false }),
      interactions: defaultInteractions({ mouseWheelZoom: true }).extend([
        new MouseWheelZoom({ constrainResolution: true }),
      ]),
      layers: mapLayer,
      view: new View({
        projection: 'EPSG:5179',
        center: [960551.04896058, 1819735.5150606],
        maxZoom: 18,
        minZoom: 5,
        zoom: 14,
        maxResolution: 2088.96,
        minResolution: 0.255,
        constrainResolution: true,
      }),
      logo: false,
      target: id,
    });

    // 사용자가 지도 선택할 수 있게 만든 버튼
    const divMapControlContainer = document.createElement('div');
    divMapControlContainer.className = 'gis-control-container';
    const divMapControl = document.createElement('div');
    divMapControl.className = 'gis-control';
    const divMapControlSub = document.createElement('div');
    divMapControlSub.id = 'gis-list';
    divMapControlSub.className = 'gis-list';
    divMapControlSub.onmouseleave = DivMapControlSubMouseLeave;

    const buttonMapChoose = document.createElement('button');
    buttonMapChoose.className = 'map-choose';
    buttonMapChoose.innerText = '배경지도\n선택';
    buttonMapChoose.onclick = BtnChooseMapOnClick;
    const buttonMap1 = document.createElement('button');
    buttonMap1.className = 'gis-type';
    buttonMap1.id = 'base';
    buttonMap1.innerText = '일반지도';
    buttonMap1.onclick = OnClickButtonMap;
    const buttonMap2 = document.createElement('button');
    buttonMap2.className = 'gis-type';
    buttonMap2.id = 'white';
    buttonMap2.innerText = '백지도';
    buttonMap2.onclick = OnClickButtonMap;
    // const buttonMap3 = document.createElement('button');
    // buttonMap3.className = 'gis-type';
    // buttonMap3.id = 'satellite';
    // buttonMap3.innerText = '위성지도';
    // buttonMap3.onclick = OnClickButtonMap;
    const buttonMap4 = document.createElement('button');
    buttonMap4.className = 'gis-type';
    buttonMap4.id = 'null';
    buttonMap4.innerText = '배경없음';
    buttonMap4.onclick = OnClickButtonMap;
    divMapControlSub.append(buttonMap1);
    divMapControlSub.append(buttonMap2);
    // divMapControlSub.append(buttonMap3);
    divMapControlSub.append(buttonMap4);
    divMapControl.append(buttonMapChoose);
    divMapControlContainer.append(divMapControlSub);
    divMapControlContainer.append(divMapControl);
    const controlObj = new Control({ element: divMapControlContainer });
    map.addControl(controlObj);

    setMapObj(map);
    return () => map.setTarget(undefined);
  }, [proj4]);

  const OnClickButtonMap = e => {
    const id = e.target.id;

    mapLayer.forEach(layer => {
      layer.setVisible(false);
    });

    if (id === 'base') {
      mapLayer[0].setVisible(true);
      setBtnBActive('active');
      setBtnWActive('');
      setBtnSActive('');
      setBtnNActive('');
    } 
    else if (id === 'white') {
      mapLayer[1].setVisible(true);
      setBtnBActive('');
      setBtnWActive('active');
      setBtnSActive('');
      setBtnNActive('');
    } 
    // else if (id === 'satellite') {
    //   mapLayer[2].setVisible(true);
    //   setBtnBActive('');
    //   setBtnWActive('');
    //   setBtnSActive('active');
    //   setBtnNActive('');
    // }
    // else if(id === 'hybrid') {
    //     mapLayer[1].setVisible(true);
    //     mapLayer[2].setVisible(true);
    //     setBtnBActive('');
    //     setBtnWActive('');
    //     setBtnSActive('active');
    //     setBtnNActive('');
    // }
    else if (id === 'null') {
      setBtnNActive('active');
      mapLayer[0].setVisible(false);
      mapLayer[1].setVisible(false);
      // mapLayer[2].setVisible(false);
    }
  };
  const BtnChooseMapOnClick = () => {
    if (!document.getElementById('gis-list').className.includes('active')) {
      document.getElementById('gis-list').classList.add('active');
    }
  };
  const DivMapControlSubMouseLeave = () => {
    document.getElementById('gis-list').classList.remove('active');
  };

  return <MapContext.Provider value={mapObj}>{children}</MapContext.Provider>;
};

export default MapNgii;
