import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle, Point } from "ol/geom";
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Icon} from 'ol/style';
import { Feature, Overlay } from 'ol';
import { Control } from 'ol/control';
import { IClickOn } from '@/img';

import { cn } from '@/lib/utils';
import MapContext from '@/components/map/MapContext';

const ContentGis = ({ SetMap, sitetype, tms, onAddStation, onInit }) => {
  const map = useContext(MapContext);

    let overlay;
    const gsonFormat = new GeoJSON();
    const refPopup = useRef(null);
    const sourceMarkerRef = useRef(new VectorSource({ wrapX: false }));
    const sourceMarker = sourceMarkerRef.current;
    const layerMarker = new VectorLayer({
        source: sourceMarker,
        id: "Marker",
        styleType: "marker",
        style: new Style({
          image: new Icon({
            anchor: [0.5, 26],
            anchorXUnits: "fraction",
            anchorYUnits: "pixels",
            src: IClickOn,
          }),
        }),
        zIndex: 99,
    });    

    // 일반대기측정소, 광화학, 유해대기 == 측정망
    const sourceGnrl = new VectorSource({ wrapX: false });
    const layerGnrl = new VectorLayer({ source: sourceGnrl, id: 'gnrl', zIndex: 10 });
    // 반경 안에 들어간 site를 넣어주는 layer
    const sourceSearchedSitesRef = useRef(new VectorSource({ wrapX: false }));
    const sourceSearchedSites = sourceSearchedSitesRef.current;
    const layerSearchedSites = new VectorLayer({ source: sourceSearchedSites, id: 'SearchedSites', style: null, zIndex: 10 });
    // 검색 반경을 넣어주는 layer
    const sourceSearchRadiusRef = useRef(new VectorSource({ wrapX: false }));
    const sourceSearchRadius = sourceSearchRadiusRef.current;
    const layerSearchRadius = new VectorLayer({ source: sourceSearchRadius, id: 'SearchRadius', style: null, zIndex: 9 });
    //popup
    const [txtPopup, setTxtPopup] = useState('');

    const [areatype, setAreatype] = useState('');   // GetAllSite에서 사용
    const radiusSearchTypeRef = useRef([]);   // SearchInRadius에서 사용
    const radiusRef = useRef(10000);   // 반경(기본값: 10km)

    // sitetype에 따라 areatype 설정
    // areatype 종류 [도시대기,도로변대기,교외대기,국가배경,항만,선박권역,유해대기,대기중금속,광화학,대기환경연구소,집중측정,산성강하물]
    // [1,2,3,4,5,6,13,12,14,8,7,11]
    useEffect(() => {
      let newAreatype = '';
      let newRadiusSearchType = [];

      if(sitetype === '대기측정소') {
        newAreatype = "1,2,3,4,5,6";
        newRadiusSearchType = ["001", "002", "003", "004", "005", "006"];
      } else if(sitetype === '광화학') {
        newAreatype = "14";
        newRadiusSearchType = ["014"];
      } else if(sitetype === '중금속') {
        newAreatype = "12";
        newRadiusSearchType = ["012"];
      } else if(sitetype === '유해대기') {
        newAreatype = "13";
        newRadiusSearchType = ["013"];
      } else if(sitetype === '대기환경연구소') {
        newAreatype = "8";
        newRadiusSearchType = ["008"];
      } 

      setAreatype(newAreatype);
      radiusSearchTypeRef.current = newRadiusSearchType;
    }, [sitetype]);

    useEffect(() => {
      if(sitetype !== '대기측정소') return;

      let newRadiusSearchType = [];
      if(tms === '도시대기') newRadiusSearchType = ['001'];
      else if(tms === '도로변대기') newRadiusSearchType = ['002'];
      else if(tms === '교외대기') newRadiusSearchType = ['003'];
      else if(tms === '국가배경') newRadiusSearchType = ['004'];
      else if(tms === '항만') newRadiusSearchType = ['005'];
      else if(tms === '선박권역') newRadiusSearchType = ['006'];
      else newRadiusSearchType = ['001', '002', '003', '004', '005', '006'];
      
      radiusSearchTypeRef.current = newRadiusSearchType;

      // 현재 마커가 있는 위치에서 반경 검색 실행
      const features = sourceMarker.getFeatures();
      if (features.length > 0) {
        const coord = features[0].getGeometry().getCoordinates();
        SearchInRadius(radiusSearchTypeRef.current, {x: coord[0], y: coord[1]}, radiusRef.current);
      }

    }, [tms]);

    // 지도 설정
    useEffect(() => {
        if(!map.ol_uid) { return; }
        map.updateSize();
        map.on('singleclick', handleMapClick);
        map.on('pointermove', handleMapPointermove);
        
        overlay = new Overlay({ element: refPopup.current, autoPan: { animation: true }, stopEvent:false });
        map.addOverlay(overlay);
        handlePopUpClose();
        
        map.addLayer(layerMarker);
        map.addLayer(layerGnrl);
        map.addLayer(layerSearchedSites);
        map.addLayer(layerSearchRadius);
        map.getView().setZoom(0);
        map.getView().setCenter([1005321.0, 1771271.0]);

        // 반경 설정 버튼 추가
        const divRadiusControlContainer = document.createElement('div');
        divRadiusControlContainer.className = 'radius-control-container';
        const divRadiusControl = document.createElement('div');
        divRadiusControl.className = 'radius-control';
        const divRadiusControlSub = document.createElement('div');
        divRadiusControlSub.id = 'radius-list';
        divRadiusControlSub.className = 'radius-list';
        divRadiusControlSub.onmouseleave = DivRadiusControlSubMouseLeave;

        const buttonRadiusChoose = document.createElement('button');
        buttonRadiusChoose.className = 'radius-choose';
        buttonRadiusChoose.innerText = '반경\n설정';
        buttonRadiusChoose.onclick = BtnChooseRadiusOnClick;
        
        const buttonRadius1 = document.createElement('button');
        buttonRadius1.className = 'radius-type';
        buttonRadius1.id = 'radius-1';
        buttonRadius1.innerText = '3km';
        buttonRadius1.onclick = OnClickButtonRadius;
        
        const buttonRadius2 = document.createElement('button');
        buttonRadius2.className = 'radius-type';
        buttonRadius2.id = 'radius-2';
        buttonRadius2.innerText = '5km';
        buttonRadius2.onclick = OnClickButtonRadius;
        
        const buttonRadius3 = document.createElement('button');
        buttonRadius3.className = 'radius-type';
        buttonRadius3.id = 'radius-3';
        buttonRadius3.innerText = '10km';
        buttonRadius3.onclick = OnClickButtonRadius;
        
        const buttonRadius4 = document.createElement('button');
        buttonRadius4.className = 'radius-type';
        buttonRadius4.id = 'radius-4';
        buttonRadius4.innerText = '20km';
        buttonRadius4.onclick = OnClickButtonRadius;

        divRadiusControlSub.append(buttonRadius1);
        divRadiusControlSub.append(buttonRadius2);
        divRadiusControlSub.append(buttonRadius3);
        divRadiusControlSub.append(buttonRadius4);

        // 입력 필드와 적용 버튼 DOM 생성 및 추가
        const divCustomRadius = document.createElement('div');
        divCustomRadius.className = 'custom-radius';

        const inputRadius = document.createElement('input');
        inputRadius.type = 'text';
        inputRadius.id = 'radius-input';
        inputRadius.placeholder = '직접 입력';
        inputRadius.className = 'radius-input';

        const spanUnit = document.createElement('span');
        spanUnit.innerText = 'km';
        spanUnit.className = 'radius-unit';

        const buttonApply = document.createElement('button');
        buttonApply.className = 'radius-apply';
        buttonApply.id = 'radius-5';
        buttonApply.innerText = '적용';
        buttonApply.onclick = OnClickButtonRadius;

        divCustomRadius.append(inputRadius);
        divCustomRadius.append(spanUnit);
        divCustomRadius.append(buttonApply);

        divRadiusControlSub.append(divCustomRadius);
        divRadiusControl.append(buttonRadiusChoose);
        divRadiusControlContainer.append(divRadiusControlSub);
        divRadiusControlContainer.append(divRadiusControl);
        const controlObj = new Control({ element: divRadiusControlContainer });
        map.addControl(controlObj);

        if(SetMap) {
            SetMap(map);
        }

        GetAllSite(areatype);
        
        // cleanup 함수 추가
        return () => {
          // 이벤트 리스너 제거
          map.un('singleclick', handleMapClick);
          map.un('pointermove', handleMapPointermove);
          
          // 오버레이 제거
          map.removeOverlay(overlay);
          
          // 레이어 제거
          map.removeLayer(layerMarker);
          map.removeLayer(layerGnrl);
          map.removeLayer(layerSearchedSites);
          map.removeLayer(layerSearchRadius);
          
          // 소스 클리어
          sourceMarker.clear();
          sourceGnrl.clear();
          sourceSearchedSites.clear();
          sourceSearchRadius.clear();
          
          // 컨트롤 제거
          const controls = map.getControls().getArray();
          controls.forEach(control => {
              if (control.element && control.element.className === 'radius-control-container') {
                  map.removeControl(control);
              }
          });
      };
    }, [map, map.ol_uid]);

    useEffect(() => {
      if(onInit) { initMap(); }
    }, [onInit]);
    
    const initMap = () => {
      ClearMarker();

      sourceSearchRadius.clear();
      layerSearchRadius.getSource().clear();
      layerSearchRadius.setStyle(null);

      sourceSearchedSites.clear();
      layerSearchedSites.getSource().clear();
      layerSearchedSites.setStyle(null);

      map.getView().setZoom(0);
      map.getView().setCenter([1005321.0, 1771271.0]);
    }

    const ClearMarker = () => { sourceMarker.clear(); }

    const handleMapClick = (e) => {
        SetMarker(e.coordinate);

        // 클릭한 좌표 기준 반경 내 검색
        const coord = {x: e.coordinate[0], y: e.coordinate[1]};
        SearchInRadius(radiusSearchTypeRef.current, coord, radiusRef.current);
    }

    const handleMapPointermove = (e) => {
        // point, polygon 위에 마우스 커서를 올렸을 경우 말풍선 띄우기 위함.
        // 근데 이제 Feature 안에 gis_overlay라는 parameter가 있을 경우에만 띄움.
        // gis_overlay는 백단에서 Feature 안에 같이 들어가 있음

        // 이 if문 없으면
        // 마우스로 지도 이동 중 feature 위로 커서가 올라갈 때마다 이동을 멈추고 말풍선 띄우기 하고 있음
        if(e.dragging) {
            return;
        }

        handlePopUpClose();
        
        const feature = map.forEachFeatureAtPixel(
            e.pixel, 
            function(feature) { 
                return feature; 
            }, 
            { hitTolerance: 0 }
        );
        
        if(!feature) { return; } // 이거 없으면 그냥 지도 위에 마우스 올리면 아래 함수가 작동됨. 지도 자체도 오브젝트이기때문
        if(!feature.get('gis_overlay')) { return; }
        
        overlay.setPosition(e.coordinate); // 말풍선이 마우스 커서를 따라오도록 하기 위함
        setTxtPopup(feature.get('gis_overlay')); // 말풍선 안에 글씨를 갱신시켜주기 위함
    }

    const handlePopUpClose = () => { overlay.setPosition(undefined); return; }
    
    // common function
    const SetMarker = async (coord) => {
        // 사용자가 지도를 클릭했을 때 해당 위치에 마커 찍기
        ClearMarker();
        sourceMarker.addFeature(
            new Feature({ geometry: new Point(coord), styleType: 'marker', id: 'marker' })
        );
    }

    // api 호출해서 데이터 받아오고 지도에 띄우기
    const handleWindowMessage = async (e) => {
        // c++builder 또는 c#에서 postMessage로 보냈을때 받는 곳
        if(!e.data.pagetype) { return ;}
        
        const message = e.data;
        console.log(message);
        
        // cpp에서 보내온 조건(message)를 백단에 보내서 받아온 feature json을 지도에 띄우기
      if (message.pagetype.includes("site") && !message.pagetype.includes("searchradius")) {
        document.body.style.cursor = "progress";
  
        await axios
          .post("/ais/gis/datas.do", message, {
            baseURL: import.meta.env.VITE_API_URL,
            responseEncoding: "UTF-8",
            responseType: "json",
          })
          .then((res) => res.data)
          .then((data) => {
            Object.keys(data).forEach((key) => {
              map.getAllLayers().forEach((layer) => {
                if (!layer.get("id")) {
                  return;
                }
                if (layer.get("id").toLowerCase() === key.toLowerCase()) {
                  const source = layer.getSource();
                  source.clear();
  
                  // 백단에서 보내오는 데이터 형식이 조금씩 다르기때문에 거기에 맞춘 if문
                  if (typeof data[key][0] === "string") {
                    if (data[key][0].includes("FeatureCollection")) {
                      source.addFeatures(gsonFormat.readFeatures(data[key][0]));
                    } else {
                      data[key].forEach((item) => {
                        source.addFeature(gsonFormat.readFeature(item.gis));
                      });
                    }
                  } else {
                    data[key].forEach((item) => {
                      source.addFeature(gsonFormat.readFeature(item.gis));
                    });
                  }
                }
              });
            });
          })
          .finally(() => {
            document.body.style.cursor = "default";
          });
      } else if (message.pagetype.includes("searchradius")) {
        // 반경 내 검색, 측정소 내/외 검색 결과를 받아서 지도에 표출
        document.body.style.cursor = "progress";
  
        await axios
          .post("/ais/gis/datas.do", message, {
            baseURL: import.meta.env.VITE_API_URL,
            responseEncoding: "UTF-8",
            responseType: "json",
          })
          .then((res) => res.data)
          .then((data) => {
            sourceSearchRadius.clear();
            sourceSearchedSites.clear();
  
            // 반경 내 검색된 features
            const searchList = data.searchList;
            layerSearchedSites.setStyle({
              "circle-radius": message.site_point_size,
              "circle-fill-color": message.site_fill_color,
              "circle-stroke-color": message.site_stroke_color,
              "circle-stroke-width": 2,
              "fill-color": message.site_fill_color,
              "stroke-color": message.site_stroke_color,
              "stroke-width": 2,
            });
            // 검색 반경을 위한 style
            layerSearchRadius.setStyle({
              "circle-fill-color": message.radius_fill_color,
              "circle-stroke-color": message.radius_stroke_color,
              "circle-stroke-width": 2,
              "fill-color": message.radius_fill_color,
              "stroke-color": message.radius_stroke_color,
              "stroke-width": 2,
            });
  
            const modalStationList = [];
            searchList.forEach((item) => {
              // 모달 선택한 측정소에 추가하기 위해 기존 데이터 형식 맞춰줌
              // 기존 데이터 형식 : { siteCd: 422141, siteData: '422141;[도시대기]대구.남구.대명동' }
              const feature = gsonFormat.readFeature(item.gis);
              const siteData = feature.get('site_cd') + ';[' + feature.get('area_type2') + ']' + feature.get('gungu_nm') + '.' + feature.get('site_nm');
              const siteJson = {siteCd: Number(feature.get('site_cd')), siteData: siteData};

              modalStationList.push(siteJson);

              sourceSearchedSites.addFeature(feature);
            });

            onAddStation(modalStationList);
  
            // 검색 반경 feature
            if (data.centerList) {
              // 중심이 측정소들인 경우
              const centerList = data.centerList;
  
              centerList.forEach((item) => {
                const feature = gsonFormat.readFeature(item.gis);
  
                if (feature.getGeometry().getType() === "Point") {
                  const ctrGeom = new Circle(feature.getGeometry().getCoordinates(), message.radius);
                  feature.setGeometry(ctrGeom);
                }
  
                sourceSearchRadius.addFeature(feature);
              });
            } else {
              // 중심이 좌표인 경우
              if (message.centerInfo.x && message.centerInfo.y) {
                sourceSearchRadius.addFeature(
                  new Feature({
                    geometry: new Circle(
                      [message.centerInfo.x, message.centerInfo.y],
                      message.radius
                    ),
                  })
                );
                map.getView().setCenter([message.centerInfo.x, message.centerInfo.y]);
                map.getView().setZoom(4);
              }
            }
          })
          .finally(() => {
            document.body.style.cursor = "default";
          });
      } 
      // else if (message.pagetype === "geocoder") {
      //   //주소찾기
      //   const result = await Geocoding("poi", message.addr);
      //   const newResult = [];
  
      //   result.poi.forEach((item) => {
      //     const newpoi = Object.assign({}, item);
      //     newpoi.jibunAdres = item.jibunAdres;
      //     newpoi.name = item.name;
      //     newpoi.roadAdres = item.roadAdres;
      //     newpoi.typeCode = item.typeCode;
      //     newpoi.x = parseFloat(item.x).toFixed();
      //     newpoi.y = parseFloat(item.y).toFixed();
      //     const wgs = transform([parseFloat(item.x), parseFloat(item.y)], "EPSG:5179", "EPSG:4326");
      //     newpoi.lon = wgs[0].toFixed(5);
      //     newpoi.lat = wgs[1].toFixed(5);
  
      //     newResult.push(newpoi);
      //   });
      // }
    }

    /*
        Feature Style 설정 함수 (예시)
        - 데이터들이 고정이 아니고 동적으로 바뀜
    */
    const StylingLayers = (obj = {}) => {
        Object.keys(obj).forEach((key) => {
        if (key === "pagetype") {
            return;
        }

        let layerTarget,
            arrStyles = [];

        map.getAllLayers().forEach((layer) => {
            if (!layer.get("id")) {
            return;
            }
            if (layer.get("id").toLowerCase() === key) {
            layerTarget = layer;
            }
        });

        layerTarget.setVisible(false);

        if (key === "gnrl") {
          // 측정소
          let hasArray = false;

          obj[key].forEach((item) => {
            if (hasArray) {
                return;
            }

            // 측정소가 오염물질값으로 되어있을 경우에는 모든 측정소 style이 동일하게 오염물질범위 값으로 이루어져있을거지만
            // 혹시나 하나만 오염물질범위값으로만 전달했을 경우 나머지 측정소 스타일은 무시하고 범위범례만 표출할 것
            if (Array.isArray(item.styles)) {

                // 도시대기처럼 단계 style이 있는 경우
                item.styles.forEach((step) => {
                arrStyles.push({
                    filter: [
                    "all",
                    ["<=", parseFloat(step.min), ["get", "gis_conc"]],
                    [">=", parseFloat(step.max), ["get", "gis_conc"]],
                    ],
                    style: {
                    "circle-radius": parseFloat(step.point_size),
                    "circle-fill-color": step.fill_color,
                    "circle-stroke-color": step.stroke_color,
                    "circle-stroke-width": parseFloat(step.stroke_width),
                    },
                });
                });

                hasArray = true;
            } else {
                // 도로변대기처럼 key value로 구분하는 경우
                arrStyles.push({
                filter: ["==", ["get", "area_type2"], item.gnrlType],
                style: {
                    "circle-radius": parseFloat(item.styles.point_size),
                    "circle-fill-color": item.styles.fill_color,
                    "circle-stroke-color": item.styles.stroke_color,
                    "circle-stroke-width": parseFloat(item.styles.stroke_width),
                },
                });
            }
            });
        } else {
            // 위에서 걸러지는 것을 제외한 레이어 스타일 적용을 위함
            // Point던 Polygon이던 하나로 설정해주기 위함
            obj[key].styles.forEach((step) => {
            if (step.stroke_color || step.fill_color) {
                if (!(step.stroke_color === "null" || step.fill_color === "null")) {
                arrStyles.push({
                    filter: ["==", ["get", "gis_type_cd"], step.data_key],
                    style: {
                    "fill-color": step.fill_color,
                    "stroke-color": step.stroke_color,
                    "stroke-width": parseFloat(step.stroke_width),
                    "stroke-offset": -1,
                    "circle-fill-color": step.fill_color,
                    "circle-stroke-color": step.stroke_color,
                    "circle-stroke-width": parseFloat(step.stroke_width),
                    "circle-radius": parseFloat(step.point_size),
                    },
                });
                }
            }
            });
        }
        if (layerTarget) {
            // 레이어가 있을 경우 해당 레이어 스타일 update해주는 부분(WebGL부분 제외)
            layerTarget.setStyle(arrStyles);
            layerTarget.setVisible(true);
        }
        });
    };

    // 전체 측정소 가져오는 함수
    const GetAllSite = (areatype) => {
        sourceGnrl.clear();
        const test = {
          data: { pagetype: "site", areatype: areatype}, 
        };
    
        handleWindowMessage(test);
    
        const testStyle = {
          pagetype: "styleApply",
          gnrl: [
            {
              gnrlType: "도시대기",
              styles: {
                data_key: "001",
                fill_color: "rgba(255,236,20,0.7)",
                // fill_color: "rgba(0,0,0, 0.5)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "도시대기",
              },
            },
            {
              gnrlType: "도로변대기",
              styles: [
                {
                  no: "0",
                  min: "1",
                  max: "10",
                  fill_color: "rgba(255,236,20,0.7)",
                  stroke_color: "rgba(0,0,0,1)",
                  stroke_width: "2",
                  point_size: "5",
                  label_text: "1 ~ 10",
                },
                {
                  no: "1",
                  min: "10",
                  max: "100",
                  fill_color: "rgba(190,255,33,1)",
                  stroke_color: "rgba(0,0,0,1)",
                  stroke_width: "2",
                  point_size: "5",
                  label_text: "10 ~ 100",
                },
                {
                  no: "2",
                  min: "100",
                  max: "1000",
                  fill_color: "rgba(255,159,43,1)",
                  stroke_color: "rgba(0,0,0,1)",
                  stroke_width: "2",
                  point_size: "5",
                  label_text: "100 ~ 1000",
                },
              ],
            },
            {
              gnrlType: "교외대기",
              styles: {
                data_key: "003",
                fill_color: "rgba(255,159,43,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "교외대기",
              },
            },
            {
              gnrlType: "국가배경",
              styles: {
                data_key: "004",
                fill_color: "rgba(19,255,80,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "국가배경",
              },
            },
            {
              gnrlType: "항만",
              styles: {
                data_key: "005",
                fill_color: "rgba(67,182,255,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "항만",
              },
            },
            {
              gnrlType: "선박권역",
              styles: {
                data_key: "006",
                fill_color: "rgba(65,253,255,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "선박권역",
              },
            },
            {
              gnrlType: "유해대기",
              styles: {
                data_key: "013",
                fill_color: "rgba(72,99,52,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "유해대기",
              },
            },
            {
              gnrlType: "대기중금속",
              styles: {
                data_key: "012",
                fill_color: "rgba(171,109,255,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "대기중금속",
              },
            },
            {
              gnrlType: "광화학",
              styles: {
                data_key: "014",
                fill_color: "rgba(255,70,222,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "광화학",
              },
            },
            {
              gnrlType: "대기환경연구소",
              styles: {
                data_key: "008",
                fill_color: "rgba(255,80,80,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "대기환경연구소",
              },
            },
            {
              gnrlType: "집중측정",
              styles: {
                data_key: "007",
                fill_color: "rgba(123,146,226,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "집중측정",
              },
            },
            {
              gnrlType: "산성강하물",
              styles: {
                data_key: "011",
                fill_color: "rgba(235,57,57,1)",
                stroke_color: "rgba(0,0,0,1)",
                stroke_width: "2",
                point_size: "5",
                label_text: "산성강하물",
              },
            },
          ],
        };
        StylingLayers( testStyle );
    };

    // 반경 내 측정소 가져오는 함수
    const SearchInRadius = (searchType, coord, radius = 10000) => {

      sourceSearchRadius.clear();
      sourceSearchedSites.clear();
    
      const test = {
        data: {
          pagetype: "searchradiuscoord",
          radius: radius, // 검색 반경(m)
          searchMethod: "within", // 반경에 완전 포함인지, 접점이 있기만 해도 검색될 것인지 조건. polygon 검색할 때에만 바꿔주면 됨
          searchType: searchType, // 측정소종류 [도시대기,도로변대기,교외대기,국가배경,항만,선박권역,유해대기,대기중금속,광화학,대기환경연구소,집중측정,산성강하물]
          searchRegStartDate: "202301", // 측정소검색시작연월
          searchRegEndDate: "202312", // 측정소검색끝연월
          pollutant: "",
          grid_num: "5",
          radius_fill_color: "rgba(0,128,0,0.7)", // 반경 색깔
          radius_stroke_color: "rgba(0,128,0,0.7)", // 반경 테두리 색깔
          site_fill_color: "rgba(255,0,0,0.7)", // 검색된 측정소 색깔
          site_stroke_color: "rgba(255,0,0,0.7)", // 검색된 측정소 테두리 색깔
          site_point_size: 4, // 검색된 측정소 크기
          centerInfo: {
            // 검색 반경 정보
            except: false, // 반경 내에서 검색할 것인지 밖에서 검색할 것인지
            type: "tm", // 중심좌표 종류 tm:사용자가 찍은 좌표.
            sites: [],
            x: coord.x,
            y: coord.y,
          //   x: 951111, // 중심좌표 utmx ( SetMarker의 e.coordinate를 그대로 사용하면 됨 )
          //   y: 1946683, // 중심좌표 utmy ( SetMarker의 e.coordinate를 그대로 사용하면 됨 )
          },
        },
      };

      handleWindowMessage(test);
    };

    const OnClickButtonRadius = e => {
        const id = e.target.id;

        if (id === 'radius-1') {
            radiusRef.current = 3000; // 3km
        } else if (id === 'radius-2') {
            radiusRef.current = 5000; // 5km
        } else if (id === 'radius-3') {
            radiusRef.current = 10000; // 10km
        } else if (id === 'radius-4') {
            radiusRef.current = 20000; // 20km
        } else if (id === 'radius-5') { // 사용자 입력 값
          const inputValue = document.getElementById('radius-input').value;

          if(inputValue === '') {
            alert('반경 입력 후에 버튼을 눌러주시길 바랍니다.');
            return;
          }

          if(isNaN(inputValue) || !/^\d+$/.test(inputValue)) {
            alert('숫자를 입력해주시길 바랍니다.');
            return;
          }

          radiusRef.current = inputValue * 1000; 
        }

        // 현재 마커가 있는 위치에서 반경 검색 실행
        const features = sourceMarker.getFeatures();
        if (features.length > 0) {
            const coord = features[0].getGeometry().getCoordinates();
            SearchInRadius(radiusSearchTypeRef.current, {x: coord[0], y: coord[1]}, radiusRef.current);
        }
    };

    const BtnChooseRadiusOnClick = () => {
        if (!document.getElementById('radius-list').className.includes('active')) {
            document.getElementById('radius-list').classList.add('active');
        }
    };

    const DivRadiusControlSubMouseLeave = () => {
        document.getElementById('radius-list').classList.remove('active');
    };

    return (
        <Container id="ngii">
            <PopupContainer ref={refPopup}>
                <PopupWrap>{txtPopup}</PopupWrap>
            </PopupContainer>
        </Container>
    )
}

export { ContentGis };

const SelectBoxTitle = ({ type, className, children, ...props }) => {
    const css =
      type === 'text'
        ? 'flex items-center justify-center w-full h-10 border-b-2 border-b-gray-200 bg-gray-200 font-semibold'
        : 'grid grid-cols-[1fr_2fr_0.7fr] gap-1 p-0.5 h-11 border-b-2 border-b-gray-200 bg-gray-200 text-sm';
  
    return (
      <div className={cn(css, className)} {...props}>
        {children}
      </div>
    );
  };
  SelectBoxTitle.displayName = 'SelectBoxTitle';
  
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

  // 반경 설정 컨트롤러
  .radius-control-container {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    font-family: 'Pretendard GOV Variable', 'Pretendard GOV', sans-serif;

    .radius-control {
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
    .radius-list {
      position: absolute;
      left: 100%;
      top: auto;
      width: 150px;
      height: 0;
      margin-top: 12px;
      padding-left: 10px;
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
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #999;
        cursor: pointer;
        overflow: hidden;
      }
      button:hover {
        background: #222;
        color: #ff96a3;
      }
      .custom-radius {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 4px;
        background: #333;
        margin-top: 1px;
        justify-content: center;

        .radius-input {
          width: 60px;
          height: 25px;
          padding: 0 6px;
          border: none;
          border-radius: 2px;
          background: #fff;
          color: #333;
          font-size: 11px;
          text-align: center;
        }

        .radius-unit {
          color: #999;
          font-size: 11px;
        }

        .radius-apply {
          height: 25px;
          padding: 0 10px;
          border: none;
          border-radius: 2px;
          background: #444;
          color: #999;
          font-size: 11px;
          cursor: pointer;
          margin-left: 2px;
          transition: background 0.2s;

          &:hover {
            background: #555;
            color: #ff96a3;
          }
        }
      }
    }
    .radius-list:after {
      position: absolute;
      width: 0;
      height: 0;
      top: 15px;
      left: 0px;
      border: 5px solid transparent;
      border-right-color: #333;
      display: block;
      content: "";
    }
    .radius-list.active {
      height: calc(50px * 3 - 1px);
    }
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
    .ol-zoom-in.ol-has-tooltip:hover[role="tooltip"],
    .ol-zoom-in.ol-has-tooltip:focus[role="tooltip"] {
      top: 3px;
    }
    .ol-zoom-out.ol-has-tooltip:hover [role="tooltip"],
    .ol-zoom-out.ol-has-tooltip:focus [role="tooltip"] {
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
      content: "";
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
    content: " ";
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