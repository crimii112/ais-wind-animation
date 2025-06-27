import React, { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Feature, Overlay } from "ol";
import VectorLayer from "ol/layer/Vector";
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import { Heatmap as HeatmapLayer } from 'ol/layer';
import VectorSource from "ol/source/Vector";
import { Circle, Point } from "ol/geom";
import { transform } from "ol/proj";
import GeoJSON from 'ol/format/GeoJSON';
import Chart from 'ol-ext/style/Chart';
// import CtrlLegend from "ol-ext/control/Legend";
// import LgndLegend from "ol-ext/legend/Legend";
import ControlBar from "ol-ext/control/Bar";
import "ol-ext/dist/ol-ext.css";
import { Style, Icon, Stroke, Fill } from 'ol/style';
import { IClickOn } from "../../img";
import MapContext from "./MapContext";
import fetchJsonp from "fetch-jsonp";
import axios from "axios";
import VectorImageLayer from "ol/layer/VectorImage";
import CircleStyle from "ol/style/Circle";
import LegendControl from "./legend/legendControl";

const Ngii = ({ SetMap }) => {
    //common
    // const apivalue = process.env.REACT_APP_NGIIAPI;
    // const urlvalue = process.env.REACT_APP_NGIIURL;
    const map = useContext(MapContext);
    let overlay;
    const gsonFormat = new GeoJSON();
    const refPopup = useRef(null);
    const sourceMarker = new VectorSource({ wrapX: false });
    const layerMarker = new VectorLayer({ source: sourceMarker, id: 'Marker', styleType: 'marker', style: new Style({ image: new Icon({ anchor: [0.5, 26], anchorXUnits: 'fraction', anchorYUnits: 'pixels', src: IClickOn }) }), zIndex: 99 });
    // 일반대기측정소, 광화학, 유해대기 == 측정망
    const sourceGnrl = new VectorSource({ wrapX: false });
    const layerGnrl = new VectorLayer({ source: sourceGnrl, id: 'gnrl', zIndex: 10 });
    // Prtr측정소
    const sourcePrtr = new VectorSource({ wrapX: false });
    const sourcePrtrHeatmap = new VectorSource({ wrapX: false });
    const layerPrtr = new VectorLayer({ source: sourcePrtr, id: 'prtr', zIndex: 9 });
    let layerPrtrHeatmap =new HeatmapLayer({ source: sourcePrtrHeatmap, id: 'prtr_heatmap', zIndex: 7 });
    // SEMS측정소
    const sourceSems = new VectorSource({ wrapX: false });
    const sourceSemsHeatmap = new VectorSource({ wrapX: false });
    const layerSems = new VectorLayer({ source: sourceSems, id: 'sems', style: null, zIndex: 9 });
    let layerSemsHeatmap =new HeatmapLayer({ source: sourceSemsHeatmap, id: 'sems_heatmap', zIndex: 7 });
    // CAPSS측정소
    const sourceCapssP = new VectorSource({ wrapX: false });
    let layerCapssP = new WebGLPointsLayer({ source: sourceCapssP, id: 'capss_p', style: { 'circle-radius': 9, 'circle-fill-color': 'rgba(255, 255, 255, 0.6)', 'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255, 255, 255, 1)'  }, zIndex: 9 });
    const sourceCapssPHeatmap = new VectorSource({ wrapX: false });
    let layerCapssPHeatmap = new HeatmapLayer({ source: sourceCapssPHeatmap, id: 'capss_p_heatmap', zIndex: 7 });
    const sourceCapssAHeatmap = new VectorSource({ wrapX: false });
    let layerCapssAHeatmap = new HeatmapLayer({ source: sourceCapssAHeatmap, id: 'capss_a_heatmap', zIndex: 7 });
    const sourceCapssA = new VectorSource({ wrapX: false });
    let layerCapssA = new VectorImageLayer({ source: sourceCapssA, id: 'capss_a', declutter: true, renderMode: 'webgl', zIndex: 8, });
    const sourceCapssM = new VectorSource({ wrapX: false });
    let layerCapssM = new VectorImageLayer({ source: sourceCapssM, id: 'capss_m', declutter: true, renderMode: 'webgl', style: null, zIndex: 8 });
    const sourceCapssMHeatmap = new VectorSource({ wrapX: false });
    let layerCapssMHeatmap =new HeatmapLayer({ source: sourceCapssMHeatmap, id: 'capss_m_heatmap', zIndex: 7 });
    // 공간정보
    const sourceSandan = new VectorSource({ wrapX: false });
    let layerSandan = new VectorLayer({ source: sourceSandan, style: null, id: 'sandan', zIndex: 4 });
    const sourceSido = new VectorSource({ wrapX: false });
    let layerSido = new VectorLayer({ source: sourceSido, style: null, id:'sido', zIndex: 3 });
    const sourceSigungu = new VectorSource({ wrapX: false });
    let layerSigungu = new VectorLayer({ source: sourceSigungu, style: null, id:'sigungu', zIndex: 3 });
    const sourceLanduse = new VectorSource({ wrapX: false });
    let layerLanduse = new VectorImageLayer({ source: sourceLanduse, id: 'landuse', declutter: true, renderMode: 'webgl', style: null, zIndex: 3 });
    const sourceMoctLink = new VectorSource({ wrapX: false });
    const layerMoctLink = new VectorImageLayer({ source: sourceMoctLink, id:'moct_link', declutter: true, renderMode: 'webgl', style: null, zIndex: 3 });
    const sourceMoctLinkVol = new VectorSource({ wrapX: false });
    const layerMoctLinkVol = new WebGLPointsLayer({ source: sourceMoctLinkVol, id: 'moct_link_vol', style: { 'circle-radius': 5, 'circle-fill-color': 'rgba(255, 255, 255, 0.6)', 'circle-stroke-color': 'rgba(255, 255, 255, 1)'  }, zIndex: 3 });
    //new VectorLayer({ source: sourceMoctLinkVol, style: null, id:'Moct_Link_Vol', zIndex: 3 });
    const sourcePpltndn = new VectorSource({ wrapX: false });
    const layerPpltndn = new VectorLayer({ source: sourcePpltndn, style: null, id:'ppltndn', zIndex: 3 });
    // 반경 안에 들어간 site를 넣어주는 layer
    // { 'circle-radius': ['get', 'point_size'], 'circle-fill-color': ['get', 'fill_color'], 'circle-stroke-color': ['get', 'stroke_color'] }
    const sourceSearchedSites = new VectorSource({ wrapX: false });
    const layerSearchedSites = new VectorLayer({ source: sourceSearchedSites, id: 'SearchedSites', style: null, zIndex: 10 });
    // 검색 반경을 넣어주는 layer
    const sourceSearchRadius = new VectorSource({ wrapX: false });
    // { 'fill-color': ['get', 'fill_color'], 'stroke-color': ['get', 'stroke_color'], }
    const layerSearchRadius = new VectorLayer({ source: sourceSearchRadius, id: 'SearchRadius', style: null, zIndex: 9 });
    // 중심점과 반경에 들어온 site를 연결하는 선을 넣는 layer  style: funcStyle, 
    const sourceDistance = new VectorSource({ wrapX: false });
    const layerDistance = new VectorLayer({ source: sourceDistance, id: 'Distance', zIndex: 10 });
    //popup
    const [txtPopup, setTxtPopup] = useState('');
    //legend
    const gisLegend = new LegendControl();

    //function
    useEffect(() => {
        if(!map.ol_uid) { return; }
        map.on('singleclick', handleMapClick);
        map.on('pointermove', handleMapPointermove);
        
        overlay = new Overlay({ element: refPopup.current, autoPan: { animation: true }, stopEvent:false });
        // stopEvent:false로 인해 feature위에서도 zoom 또는 dragging이 가능해짐
        map.addOverlay(overlay);
        handlePopUpClose();
        // LAYER
        map.addLayer(layerMarker);
        map.addLayer(layerGnrl);
        map.addLayer(layerPrtr);
        map.addLayer(layerPrtrHeatmap);
        map.addLayer(layerSems);
        map.addLayer(layerSemsHeatmap);
        map.addLayer(layerCapssP);
        map.addLayer(layerCapssPHeatmap);
        map.addLayer(layerCapssA);
        map.addLayer(layerCapssAHeatmap);
        map.addLayer(layerCapssM);
        map.addLayer(layerCapssMHeatmap);
        map.addLayer(layerSandan);
        map.addLayer(layerSido);
        map.addLayer(layerSigungu);
        map.addLayer(layerLanduse);
        map.addLayer(layerMoctLink);
        map.addLayer(layerMoctLinkVol);
        map.addLayer(layerPpltndn);
        map.addLayer(layerSearchedSites);
        map.addLayer(layerSearchRadius);
        map.getView().setZoom(1);
        // map.addControl(ctrlLegendBase);
        // ctrlLegendBase.show();

        map.addControl(gisLegend);

        const ctrlBar = new ControlBar();
        map.addControl(ctrlBar);
        ctrlBar.setPosition('bottom-right');
        
        if(window.chrome.webview) {
            window.addEventListener('message', handleWindowMessage);
        }
        if(SetMap) {
            SetMap(map);
        }
    }, [map, map.ol_uid]);

    const ClearMarker = () => { sourceMarker.clear(); }
    const handleMapClick = (e) => {
        SetMarker(e.coordinate);
    }
    // let overlayFeature;
    const handleMapPointermove = (e) => {
        if(e.dragging) {
            return;
        }

        handlePopUpClose();
        
        const feature = map.forEachFeatureAtPixel(e.pixel, function(feature) { return feature; });
        
        if(!feature) { return; }
        if(!feature.get('gis_overlay')) { return; }
        
        overlay.setPosition(e.coordinate);
        setTxtPopup(feature.get('gis_overlay'));
    }
    const handlePopUpClose = () => { overlay.setPosition(undefined); return; }
    // common function
    const SetMarker = async (coord) => {
        ClearMarker();
        sourceMarker.addFeature(new Feature({ geometry: new Point(coord), styleType: 'marker', id: 'marker' }));

        if(window.chrome.webview) {
            const wgs = transform(coord, map.getView().getProjection().getCode(), 'EPSG:4326');
            const grs = transform(coord, map.getView().getProjection().getCode(), 'EPSG:5179');
            let addStr = '';

            window.chrome.webview.postMessage({ type: 'mapClick', data: { wgs: `${wgs[0].toFixed(5)} ${wgs[1].toFixed(5)}`, utm: `${parseFloat(coord[0]).toFixed()} ${parseFloat(coord[1]).toFixed()}` , grs: `${parseFloat(grs[0]).toFixed()} ${parseFloat(grs[1]).toFixed()}`, addr: addStr } });
        }
    }
    const handleWindowMessage = async (e) => {
        // c++builder 또는 c#에서 postMessage로 보냈을때 받는 곳
        if(!e.data.pagetype) { return ;}
        
        const message = e.data;
        
        if(message.pagetype === 'layerclear') {
            sourceMarker.clear();
            gisLegend.removeLegend(message.clearType);

            if(message.clearType === 'site') {
                sourceGnrl.clear();
                sourcePrtr.clear();
                sourcePrtrHeatmap.clear();
                sourceSems.clear();
                sourceSemsHeatmap.clear();
                sourceCapssP.clear();
                sourceCapssPHeatmap.clear();
                sourceCapssA.clear();
                sourceCapssAHeatmap.clear();
                sourceCapssM.clear();
                sourceCapssMHeatmap.clear();
            }
            else if(message.clearType === 'gnrl') {
                sourceGnrl.clear();
            }
            else if(message.clearType === 'prtr') {
                sourcePrtr.clear();
            }
            else if(message.clearType === 'prtr_heatmap') {
                sourcePrtrHeatmap.clear();
            }
            else if(message.clearType === 'sems') {
                sourceSems.clear();
            }
            else if(message.clearType === 'sems_heatmap') {
                sourceSemsHeatmap.clear();
            }
            else if(message.clearType === 'capss_p') {
                sourceCapssP.clear();
            }
            else if(message.clearType === 'capss_p_heatmap') {
                sourceCapssPHeatmap.clear();
            }
            else if(message.clearType === 'capss_a') {
                sourceCapssA.clear();
            }
            else if(message.clearType === 'capss_a_heatmap') {
                sourceCapssAHeatmap.clear();
            }
            else if(message.clearType === 'capss_m') {
                sourceCapssM.clear();
            }
            else if(message.clearType === 'capss_m_heatmap') {
                sourceCapssMHeatmap.clear();
            }
            else if(message.clearType === 'searchradius') {
                sourceSearchRadius.clear();
                sourceSearchedSites.clear();
            }
            else if(message.clearType === 'chart') {
                map.getAllLayers().forEach(layer => {
                    if(layer.get('id')) {
                        if(layer.get('id') === 'Chart') {
                            layer.getSource().clear();
                        }
                    }
                });
            }
            else if(message.clearType === 'radius') {
                sourceSearchRadius.clear();
                sourceSearchedSites.clear();
            }
            else {
                map.getAllLayers().forEach(layer => {
                    if(layer.get('id')) {
                        if(layer.get('id').toLowerCase() === message.clearType) {
                            layer.getSource().clear();
                        }
                    }
                });
            }
        }
        if(message.pagetype === 'lenFeatures') {
            let count = 0;
            
            if(message.findType === 'gnrl') {
                count = sourceGnrl.getFeatures().length;
            }
            else if(message.findType === 'prtr') {
                count = sourcePrtr.getFeatures().length;
            }
            else if(message.findType === 'prtr_heatmap') {
                count = sourcePrtrHeatmap.getFeatures().length;
            }
            else if(message.findType === 'sems') {
                count = sourceSems.getFeatures().length;
            }
            else if(message.findType === 'sems_heatmap') {
                count = sourceSemsHeatmap.getFeatures().length;
            }
            else if(message.findType === 'capss_p') {
                count = sourceCapssP.getFeatures().length;
            }
            else if(message.findType === 'capss_p_heatmap') {
                count = sourceCapssPHeatmap.getFeatures().length;
            }
            else if(message.findType === 'capss_a') {
                count = sourceCapssA.getFeatures().length;
            }
            else if(message.findType === 'capss_a_heatmap') {
                count = sourceCapssAHeatmap.getFeatures().length;
            }
            else if(message.findType === 'capss_m') {
                count = sourceCapssM.getFeatures().length;
            }
            else if(message.findType === 'capss_m_heatmap') {
                count = sourceCapssMHeatmap.getFeatures().length;
            }
            else if(message.findType === 'chart') {
                map.getAllLayers().forEach(layer => {
                    if(layer.get('id')) {
                        if(layer.get('id') === 'chart') {
                            count = layer.getSource().getFeatures().length;
                        }
                    }
                });
            }
            else {
                map.getAllLayers().forEach(layer => {
                    if(layer.get('id')) {
                        if(layer.get('id').toLowerCase() === message.findType) {
                            count = layer.getSource().getFeatures().length;
                        }
                    }
                });
            }

            window.chrome.webview.postMessage({ type: 'lenFeatures', data: count });
        }
        if(message.pagetype === 'layerVisible') { 
            const visible = message.visible === true || message.visible === 'true' || message.visible === 'TRUE' || message.visible === 't' || message.visible === 'T' ? true : false;
            
            if(message.visibleType === 'site') {
                layerGnrl.setVisible(visible);
                layerPrtr.setVisible(visible);
                layerPrtrHeatmap.setVisible(visible);
                layerSems.setVisible(visible);
                layerSemsHeatmap.setVisible(visible);
                layerCapssP.setVisible(visible);
                layerCapssA.setVisible(visible);
                layerCapssM.setVisible(visible);
                layerCapssPHeatmap.setVisible(visible);
                layerCapssAHeatmap.setVisible(visible);
                layerCapssMHeatmap.setVisible(visible);
            }
            else {
                map.getLayers().forEach(layer => {
                    if(!layer.get('id')) {
                        return;
                    }
                    if(layer.get('id').toLowerCase() === message.visibleType.toLowerCase()) {
                        layer.setVisible(visible);
                    }
                });
            }
        }
        if(message.pagetype.includes('site') && !message.pagetype.includes('searchradius')) {
            document.body.style.cursor = 'progress';
            
            await axios.post('/ais/gis/datas.do', message, { responseEncoding: 'UTF-8', responseType: 'json' })
            .then(res => res.data)
            .then(data => {
                Object.keys(data).forEach(key => {
                    map.getAllLayers().forEach(layer => {
                        if(!layer.get('id')) { return; }
                        if(layer.get('id').toLowerCase() === key.toLowerCase()) {
                            const source = layer.getSource();
                            source.clear();

                            if(typeof data[key][0] === "string") {
                                if(data[key][0].includes('FeatureCollection')) {
                                    source.addFeatures(gsonFormat.readFeatures(data[key][0]));
                                }
                                else {
                                    data[key].forEach(item => {
                                        source.addFeature(gsonFormat.readFeature(item.gis));
                                    });
                                }
                            }
                            else {
                                data[key].forEach(item => {
                                    source.addFeature(gsonFormat.readFeature(item.gis));
                                });
                            }
                        }
                    });
                });
            })
            .finally(() => { document.body.style.cursor = 'default'; });
        }
        else if(message.pagetype === 'chart') {
            let chartIndex = map.getAllLayers().findIndex(layer => layer.get('id') ? layer.get('id') === 'Chart' : -1);
            let layer;

            if(chartIndex < 0) {
                layer = new VectorLayer({ 
                    source: new VectorSource({ wrapX: false })
                    , id: 'chart'
                    , zIndex: 3
                 });
                 map.addLayer(layer);
            }
            else {
                layer = map.getAllLayers()[chartIndex];
            }
            
            layer.getSource().clear();

            Object.keys(message.charts).forEach(key => {
                if(key === 'temp') {
                    return;
                }

                layer.getSource().addFeatures(gsonFormat.readFeatures(message.charts[key].value));
            });
        }
        else if(message.pagetype === 'styleApply') {
            StylingLayers(message);
        }
        else if(message.pagetype.includes('searchradius')) {
            document.body.style.cursor = 'progress';
            console.log(message);
            await axios.post('/ais/gis/datas.do', message, { responseEncoding: 'UTF-8', responseType: 'json' })
            .then(res => res.data)
            .then(data => {
                // 2024-10-04
                // 반경을 feature로 만들어서 sourceSearchRadius에 넣어야함. 검색된 site들은 gsonFormat.readFeatures()로 넣으려고 함
                sourceSearchRadius.clear();
                sourceSearchedSites.clear();
                console.log(data);
                const searchList = data.searchList;

                if(message.searchType.find(ele => ele === 'landuse')) {
                    layerSearchedSites.setStyle([
                        {
                            filter: ['==', ['get', 'val'], 0],      // 임시 : 주거지역
                            style: {
                                'fill-color': 'rgba(254, 230, 194, 0.6)',
                                "stroke-color": 'rgba(254, 230, 194, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            filter: ['==', ['get', 'val'], 1],      // 교통지역
                            style: {
                                'fill-color': 'rgba(247, 65, 42, 0.6)',
                                "stroke-color": 'rgba(247, 65, 42, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 2],       // 농업지역
                            style: {
                                'fill-color': 'rgba(238, 233, 70, 0.6)',
                                "stroke-color": 'rgba(238, 233, 70, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 3],      // 산림지역
                            style: {
                                'fill-color': 'rgba(42, 75, 45, 0.6)',
                                "stroke-color": 'rgba(42, 75, 45, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 4],      // 초지
                            style: {
                                'fill-color': 'rgba(57, 153, 38, 0.6)',
                                "stroke-color": 'rgba(57, 153, 38, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 5],      // 습지(수변식생)
                            style: {
                                'fill-color': 'rgba(124, 34, 126, 0.6)',
                                "stroke-color": 'rgba(124, 34, 126, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 6],      // 나지
                            style: {
                                'fill-color': 'rgba(89, 206, 202, 0.6)',
                                "stroke-color": 'rgba(89, 206, 202, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        {
                            else: true,
                            filter: ['==', ['get', 'val'], 7],      // 수역
                            style: {
                                'fill-color': 'rgba(6, 2, 250, 0.6)',
                                "stroke-color": 'rgba(6, 2, 250, 0.6)',
                                'stroke-width': 2,
                            }
                        },
                        ])
                }
                else {
                    layerSearchedSites.setStyle({ 
                        'circle-radius': message.site_point_size, 
                        'circle-fill-color': message.site_fill_color, 
                        'circle-stroke-color': message.site_stroke_color, 
                        'circle-stroke-width': 2,
                        'fill-color': message.site_fill_color,
                        'stroke-color': message.site_stroke_color,
                        'stroke-width': 2,
                    });
                }
                
                layerSearchRadius.setStyle({
                    'circle-fill-color': message.radius_fill_color, 
                    'circle-stroke-color': message.radius_stroke_color, 
                    'circle-stroke-width': 2,
                    'fill-color': message.radius_fill_color,
                    'stroke-color': message.radius_stroke_color,
                    'stroke-width': 2,
                });

                searchList.forEach(item => {
                    // console.log(item);
                    sourceSearchedSites.addFeature(gsonFormat.readFeature(item.gis));
                });
                if(data.centerList) {
                    const centerList = data.centerList;

                    centerList.forEach(item => {
                        const feature = gsonFormat.readFeature(item.gis);

                        if(feature.getGeometry().getType() === 'Point') {
                            const ctrGeom = new Circle(feature.getGeometry().getCoordinates(), message.radius);
                            feature.setGeometry(ctrGeom);
                        }
                        
                        sourceSearchRadius.addFeature(feature);
                    });
                }
                else {
                    if(message.centerInfo.x && message.centerInfo.y) {
                        sourceSearchRadius.addFeature( new Feature({ geometry: new Circle([message.centerInfo.x, message.centerInfo.y], message.radius) }));
                        // , fill_color: message.radius_fill_color, stroke_color: message.radius_stroke_color
                        map.getView().setCenter([message.centerInfo.x, message.centerInfo.y]);
                        map.getView().setZoom(3);
                    }
                }
            })
            .finally(() => { document.body.style.cursor = 'default'; });
        }
        else if(message.pagetype === 'shorcutcoord') {
            //좌표바로가기 :: 사용자는 wgs84만 보낸다는 가정하에 만듦 (2023-09-06)
            // const grs = transform(message.coordinate, 'EPSG:4326', map.getView().getProjection().getCode());
            // 2023-11 수정 5179로 받아서 wgs84도 같이 return해줘야함
            const grs = message.coordinate;
            SetMarker(grs);
            map.getView().setCenter(grs);
        }
        else if(message.pagetype === 'geocoder') {
            //주소찾기
            const result = await Geocoding('poi', message.addr);
            const newResult = [];

            result.poi.forEach(item => {
                const newpoi = Object.assign({}, item);
                newpoi.jibunAdres = item.jibunAdres;
                newpoi.name = item.name;
                newpoi.roadAdres = item.roadAdres;
                newpoi.typeCode = item.typeCode;
                newpoi.x = parseFloat(item.x).toFixed();
                newpoi.y = parseFloat(item.y).toFixed();
                const wgs = transform([parseFloat(item.x), parseFloat(item.y)], 'EPSG:5179', 'EPSG:4326');
                newpoi.lon = wgs[0].toFixed(5);
                newpoi.lat = wgs[1].toFixed(5);

                newResult.push(newpoi);
            });
            // poi에 wgs도 같이 넣어서 
            window.chrome.webview.postMessage({ type: 'geocoder', data: newResult });
        }
    }
    /*
        일반대기측정망, CAPSS, PRTR, SEMS 모두 공통으로 사용할 것
    */
    const StylingLayers = ( obj={ } ) => {
        Object.keys(obj).forEach(key => {
            if(key === 'pagetype') { return; }

            let layerTarget, arrStyles = [];
            
            if(key.includes('chart')) {
                // chart
                Object.keys(obj).forEach(key1 => {
                    if(typeof obj[key1] === 'object') {
                        const obj2 = obj[key1];
    
                        Object.keys(obj2).forEach(key2 => {
                            if(key2 === 'styles') {
                                arrStyles = obj2[key2];
                            }
                        });
                    }
                });
    
                let chartIndex = map.getAllLayers().findIndex(layer => layer.get('id') ? layer.get('id') === 'chart' : -1);
    
                if(chartIndex < 0) {
                    // 여기도 너무 느려지면 VectorImageLayer로 바꾸자
                    layerTarget = new VectorLayer({ 
                        source: new VectorSource({ wrapX: false })
                        , id: 'chart'
                        , zIndex: 3
                     });
                     map.addLayer(layerTarget);
                }
                else {
                    layerTarget = map.getAllLayers()[chartIndex];
                }
    
                const pieStyle = arrStyles[arrStyles.findIndex(item => item.charttype === 'pie')];
                const barStyle = arrStyles[arrStyles.findIndex(item => item.charttype === 'bar')];
                
                layerTarget.setStyle( 
                    (feature) => {
                        let style;
    
                        if(feature.get('chart_type') === 'pie') {
                            style = new Style({
                                image: new Chart({
                                    type: feature.get('chart_type'),
                                    radius: parseInt(pieStyle.radius),
                                    rotation: 0,
                                    colors: pieStyle.colors.split(";"),
                                    animation: false,
                                    data: feature.get(pieStyle.data_key),
                                    displacement: [parseInt(pieStyle.display_x), parseInt(pieStyle.display_y)],
                                    rotateWithView: true,
                                    stroke: new Stroke({ color: pieStyle.stroke_color, width: parseInt(pieStyle.stroke_width) }),
                                })
                            });
                        }
                        else if(feature.get('chart_type') === 'bar') {
                            style = new Style({
                                image: new Chart({
                                    type: feature.get('chart_type'),
                                    radius: parseInt(barStyle.radius),
                                    rotation: 0,
                                    colors: barStyle.colors.split(";"),
                                    animation: false,
                                    data: feature.get(barStyle.data_key),
                                    displacement: [parseInt(barStyle.display_x), parseInt(barStyle.display_y)],
                                    rotateWithView: true,
                                    stroke: new Stroke({ color: barStyle.stroke_color, width: parseInt(barStyle.stroke_width) }),
                                })
                            });
                        }
    
                        return style;
                    }
                );
            }
            else {
                map.getAllLayers().forEach(layer => {
                    if(!layer.get('id')) { return; }
                    if(layer.get('id').toLowerCase() === key) { layerTarget = layer; }
                });
                
                layerTarget.setVisible(false);

                if(key === 'gnrl') {
                    if(!gisLegend.findLegend('gnrl')) {
                        gisLegend.addLegend('gnrl', '측정소');
                    }
                    
                    gisLegend.removeLegendItemAll('gnrl');
                    let hasArray = false;
                    
                    obj[key].forEach(item => {
                        if(hasArray) {
                            return;
                        }
                        // 측정소가 오염물질값으로 되어있을 경우에는 모든 측정소 style이 동일하게 오염물질범위 값으로 이루어져있을거지만
                        // 혹시나 하나만 오염물질범위값으로만 전달했을 경우 나머지 측정소 스타일은 무시하고 범위범례만 표출할 것 <- 어차피 측정소 style을 위해서라도 전체를 범위 범례로 하겠구나
                        if(Array.isArray(item.styles)) {
                            gisLegend.removeLegendItemAll('gnrl');
                            gisLegend.setLegendPollutant('gnrl', obj.pollutant);
                            // 도시대기처럼 단계 style이 있는 경우
                            item.styles.forEach(step => {
                                arrStyles.push({
                                    filter: ['all', ['<=', parseFloat(step.min), ['get', 'gis_conc']], ['>=', parseFloat(step.max), ['get', 'gis_conc']], ],
                                    style: { 'circle-radius': parseFloat(step.point_size), 'circle-fill-color': step.fill_color, 'circle-stroke-color': step.stroke_color, 'circle-stroke-width': parseFloat(step.stroke_width) }
                                });
                                gisLegend.addLegendItem(
                                    'gnrl',
                                    { 'circle-radius': parseFloat(step.point_size), 'circle-fill-color': step.fill_color, 'circle-stroke-color': step.stroke_color, 'circle-stroke-width': parseFloat(step.stroke_width) },
                                    'Point',
                                    `${step.min}~${step.max}`
                                );
                            });

                            hasArray = true;
                        }
                        else {
                            // 도로변대기처럼 key value로 구분하는 경우
                            arrStyles.push({
                                filter: ['==', ['get', 'area_type2'], item.gnrlType],
                                style: { 'circle-radius': parseFloat(item.styles.point_size), 'circle-fill-color': item.styles.fill_color, 'circle-stroke-color': item.styles.stroke_color, 'circle-stroke-width': parseFloat(item.styles.stroke_width) }
                            });
                            gisLegend.addLegendItem(
                                'gnrl', 
                                { 'circle-radius': parseFloat(item.styles.point_size), 'circle-fill-color': item.styles.fill_color, 'circle-stroke-color': item.styles.stroke_color, 'circle-stroke-width': parseFloat(item.styles.stroke_width) },
                                'Point',
                                item.gnrlType
                            )
                        }
                    });
                }
                else if(key === 'prtr' || key === 'sems' || key === 'ppltndn') {
                    // let legend = undefined;
                    const keyKo = key === 'prtr' ? 'PRTR' : key === 'sems' ? 'SEMS' : '인구밀도';
                    
                    if(!gisLegend.findLegend(key)) {
                        gisLegend.addLegend(key, keyKo);
                    }
                    
                    gisLegend.removeLegendItemAll(key);
                    gisLegend.setLegendPollutant(key, obj[key].pollType);
                    const styles = obj[key].styles;
                    styles.forEach(step => {
                        arrStyles.push({
                            filter: ['all', ['<=', parseFloat(step.min), ['get', 'gis_conc']], ['>=', parseFloat(step.max), ['get', 'gis_conc']], ],
                            style: { 'fill-color': step.fill_color, 'stroke-color': step.stroke_color, 'stroke-width': parseFloat(step.stroke_width),
                                'circle-fill-color': step.fill_color, 'circle-stroke-color': step.stroke_color, 'circle-stroke-width': parseFloat(step.stroke_width), 'circle-radius': parseFloat(step.point_size) }
                        });
                        gisLegend.addLegendItem(
                            key,
                            {
                                'circle-radius': parseFloat(step.point_size), 
                                'circle-fill-color': step.fill_color, 
                                'circle-stroke-color': step.stroke_color, 
                                'circle-stroke-width': parseFloat(step.stroke_width)
                            },
                            'Point',
                            `${step.min} ~ ${step.max}`
                        )
                    });
                }
                else if(key === 'capss_p' || key === 'moct_link_vol') {
                    let source = layerTarget.getSource();
                    const arrFillColor = ['case'], arrStrokeColor = ['case'], arrPointSize = ['case'], arrStrokeWidth = ['case'];
                    let pollType;
                    const styles = obj[key].styles;
                    map.removeLayer(layerTarget);

                    if(obj[key].pollType) {
                        pollType = obj[key].pollType.toLowerCase().replace('.', '');
                    }
                    else {
                        pollType = 'gis_conc';
                    }
                    
                    const keyKo = key === 'capss_p' ? 'CAPSS 점오염원' : '차량대수';

                    if(!gisLegend.findLegend(key)) {
                        gisLegend.addLegend(key, keyKo);
                    }
                    
                    gisLegend.removeLegendItemAll(key);
                    gisLegend.setLegendPollutant(key, obj[key].pollType);
                    styles.forEach(step => {
                        const filter = ['all', ['<=', parseFloat(step.min), ['get', pollType]], ['>=', parseFloat(step.max), ['get', pollType]] ];
                        arrFillColor.push(filter);
                        arrStrokeColor.push(filter);
                        arrPointSize.push(filter);
                        arrStrokeWidth.push(filter);
                        arrFillColor.push(step.fill_color);
                        arrStrokeColor.push(step.stroke_color);
                        arrStrokeWidth.push(parseFloat(step.stroke_width));
                        arrPointSize.push(parseFloat(step.point_size));

                        gisLegend.addLegendItem(
                            key,
                            {
                                'circle-radius': parseFloat(step.point_size), 
                                'circle-fill-color': step.fill_color, 
                                'circle-stroke-color': step.stroke_color, 
                                'circle-stroke-width': parseFloat(step.stroke_width)
                            },
                            'Point',
                            `${step.min} ~ ${step.max}`
                        );
                    });
                    
                    // WebGL~Layer는 style에 default값이 무조건 있어야함
                    arrFillColor.push('rgba(255,255,255, 0)');
                    arrStrokeColor.push('rgba(255,255,255, 0)');
                    arrStrokeWidth.push(3);
                    arrPointSize.push(3);

                    const layerTemp = new WebGLPointsLayer({ 
                        source: source, 
                        style: { 'circle-radius': arrPointSize, 'circle-fill-color': arrFillColor, 'circle-stroke-color': arrStrokeColor, 'circle-stroke-width': arrStrokeWidth }, 
                        id: key, 
                        zIndex: 9
                    });

                    map.addLayer(layerTemp);
                    layerTarget.dispose();
                    return;
                }
                else if(key === 'capss_a' ||  key === 'capss_m') {
                    const pollType = obj[key].pollType.toLowerCase().replace('.', '');
                    const styles = obj[key].styles;
                    let title_ = 'CAPSS';

                    if(key.includes('_a')) {
                        title_ += ' 면오염원';
                    }
                    else {
                        title_ += ' 이동오염원';
                    }

                    // title_ += '(' + obj[key].pollType + ')';
                    
                    if(!gisLegend.findLegend(key)) {
                        gisLegend.addLegend(key, title_);
                    }

                    gisLegend.removeLegendItemAll(key);
                    gisLegend.setLegendPollutant(key, obj[key].pollType);

                    styles.forEach(step => {
                        arrStyles.push({
                            filter: ['all', ['<=', parseFloat(step.min), ['get', pollType]], ['>=', parseFloat(step.max), ['get', pollType]], ],
                            style: { 'fill-color': step.fill_color, 'stroke-color': step.stroke_color, 'stroke-width': parseFloat(step.stroke_width), 'stroke-offset': -1 }
                        });
                        gisLegend.addLegendItem(
                            key,
                            {
                                'fill-color': step.fill_color, 
                                'stroke-color': step.stroke_color, 
                                'stroke-width': parseFloat(step.stroke_width)
                            },
                            'Polygon',
                            `${step.min} ~ ${step.max}`
                        );
                    });
                }
                else if(key.includes('_heatmap')) {
                    const styles = obj[key].styles;
                    const totalMin = styles[0].min;
                    const totalMax = styles[styles.length - 1].max;
                    const arrColor = [];
        
                    styles.forEach(step => {
                        arrColor.push(step.fill_color);
                    });
                    const weightFunc = obj[key].pollType === '사업장' ? '1' : (feature) => {
                        const val = parseFloat(feature.get('gis_conc'));
                        return val / (totalMax - totalMin);
                    }

                    layerTarget.setBlur(obj[key].blur);
                    layerTarget.setRadius(obj[key].radius);
                    layerTarget.setGradient(arrColor);
                    layerTarget.set('weight', weightFunc);
                }
                else {
                    obj[key].styles.forEach(step => {
                        if(step.stroke_color || step.fill_color) {
                            if(!(step.stroke_color === 'null' || step.fill_color === 'null')) {
                                arrStyles.push({
                                    filter: ['==', ['get', 'gis_type_cd'], step.data_key],
                                    style: { 
                                        'fill-color': step.fill_color,
                                        'stroke-color': step.stroke_color, 
                                        'stroke-width': parseFloat(step.stroke_width), 
                                        'stroke-offset': -1, 
                                        'circle-fill-color': step.fill_color,
                                        'circle-stroke-color': step.stroke_color,
                                        'circle-stroke-width': parseFloat(step.stroke_width),
                                        'circle-radius': parseFloat(step.point_size)
                                     },
                                });
                            }
                        }
                    });
                }
                if(layerTarget) {
                    layerTarget.setStyle(arrStyles);
                    layerTarget.setVisible(true);
                }
            }
        });
    }
    /*
        target: [ 'geo' || 'reverseGeo' || 'poi' || 'des' ]
        x, y: EPSG:5179

        // reverseGeo = coordinate -> addr
        // geo = addr -> coordinate
        // poi = 관심지점 :: keyword로 주소 찾음
        // des = 지명 :: keyword로 주소 찾음
    */
    const Geocoding = async (target='reverseGeo', x, y) => {
        let returnValue;
        let url = '/ais/proxy/ngii/geocode?apikey=airinfo';     // 뒤에 지오코딩 타입을 붙이기 위해서 임의로 apikey를 넣음

        if(target === 'geo') {
            url += `&juso=${x}`;
        }
        else if(target === 'reverseGeo') {
            url += `&x=${x}&y=${y}`;
        }
        else if(target === 'poi') {
            url += `&keyword=${x}`;
        }
        else if(target === 'des') {
            url += `&keyword=${x}`;
        }

        await fetchJsonp(url, { method: 'GET', mode: 'cors', headers: { 'Content-Type': 'jsonp' }})
        .then(res => res.json())
        .then(result => {
            returnValue = result.search.contents;
        })
        .catch(err => {
            console.log(err);
        });

        return returnValue;
    }

    useEffect(() => {
        if(window.chrome.webview) {
            window.chrome.webview.postMessage({ type: 'init', data: 'init' });
        }
    }, [window.chrome.webview]);

    return (
        <Container id='ngii'>
            <PopupContainer ref={refPopup}><PopupWrap>{txtPopup}</PopupWrap></PopupContainer>
            <DivControlLegend className="gis-legend-container ol-legend ol-legend-right" id="gisLegends"></DivControlLegend>
        </Container>
    )
}

export default Ngii;

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
        width: 50px;
        top: 90px;
        right: 20px;
        box-sizing: border-box;

        .ol-zoom-in, .ol-zoom-out {
            width: 50px;
            height: 24px;
            margin: 1px;
            // margin-left: 5px;
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
            // margin-top: 213px;    
        }
        .ol-zoom-in.ol-has-tooltip:hover[role=tooltip], .ol-zoom-in.ol-has-tooltip:focus[role=tooltip] {
            top: 3px;
        }
        .ol-zoom-out.ol-has-tooltip:hover [role=tooltip], .ol-zoom-out.ol-has-tooltip:focus [role=tooltip] {
            top: 232px;
        }
    }
    // 배경지도
    .gis-control-container {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        font-family: NanumBarumGothic;

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
            height: 0;      //calc(36px * 3 - 1px);
            margin-top: 12px;
            padding-right: 10px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all .3s;

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
            // 삼각형
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
        // position: absolute;
        width: fit-content;
        padding: 0 10px 0 0;
        // height: 100px;
        // left: auto;
        // right: 20px;
        // bottom: 7%;
        // display: none;
        display: flex;
        flex-direction: column;
        border-radius: 5px;
        background-color: rgba(255, 255, 255, 0.8);
        font-family: NanumBarumGothic;

        //.ol-closebox
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
            line-height: .4em;
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
    // min-width: 0px;
    // min-height: 0px;
    top: 28px;
    left: -50px;
    padding: 10px;
    border: 1px solid #cccccc;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

    &:after, &:before {
        //말풍선 및 삼각형
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
    // font
    font-family: 나눔바른고딕;
    font-size: 14px;
    line-height: 18px;
    color: #000000;
    white-space: pre-line;
`;
const DivControlLegend = styled.div`
    background-color: rgba(255, 255, 255, 0.8);
`;
const DivLegendBase = styled.div`
    width: 100px;
    height: 100px;
    background: #ffffff;
`;