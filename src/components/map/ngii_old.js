import React, { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Feature, Overlay } from "ol";
import VectorLayer from "ol/layer/Vector";
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import { Heatmap as HeatmapLayer } from 'ol/layer';
import VectorSource from "ol/source/Vector";
import { Point } from "ol/geom";
import { transform } from "ol/proj";
import GeoJSON from 'ol/format/GeoJSON';
import Chart from 'ol-ext/style/Chart';
import CtrlLegend from "ol-ext/control/Legend";
import LgndLegend from "ol-ext/legend/Legend";
import "ol-ext/dist/ol-ext.css";
import { Style, Icon, Stroke } from 'ol/style';
import { IClickOn } from "../../img";
import MapContext from "./MapContext";
import fetchJsonp from "fetch-jsonp";
import axios from "axios";
import VectorImageLayer from "ol/layer/VectorImage";

const Ngii = ({ SetMap }) => {
    //common
    const apivalue = process.env.REACT_APP_NGIIAPI;
    const urlvalue = process.env.REACT_APP_NGIIURL;
    const map = useContext(MapContext);
    let overlay;
    const gsonFormat = new GeoJSON();
    const refPopup = useRef(null);
    const sourceMarker = new VectorSource({ wrapX: false });
    const layerMarker = new VectorLayer({ source: sourceMarker, id: 'Marker', styleType: 'marker', style: new Style({ image: new Icon({ anchor: [0.5, 26], anchorXUnits: 'fraction', anchorYUnits: 'pixels', src: IClickOn }) }), zIndex: 99 });
    // 일반대기측정소, 광화학, 유해대기 == 측정망
    const sourceGnrl = new VectorSource({ wrapX: false });
    const layerGnrl = new VectorLayer({ source: sourceGnrl, id: 'Gnrl', zIndex: 10 });
    // Prtr측정소
    const sourcePrtr = new VectorSource({ wrapX: false });
    const sourcePrtrHeatmap = new VectorSource({ wrapX: false });
    const layerPrtr = new VectorLayer({ source: sourcePrtr, id: 'Prtr', zIndex: 8 });
    let layerPrtrHeatmap =new HeatmapLayer({ source: sourcePrtrHeatmap, id: 'Prtr_Heatmap', zIndex: 9 });
    // SEMS측정소
    const sourceSems = new VectorSource({ wrapX: false });
    const sourceSemsHeatmap = new VectorSource({ wrapX: false });
    let layerSems = new WebGLPointsLayer({ source: sourceSems, id: 'Sems', style: { 'circle-radius': 5, 'circle-fill-color': 'rgba(255, 255, 255, 0.6)', 'circle-stroke-color': 'rgba(255, 255, 255, 1)' }, zIndex: 8 });
    let layerSemsHeatmap =new HeatmapLayer({ source: sourceSemsHeatmap, id: 'Sems_Heatmap', zIndex: 7 });
    // CAPSS측정소
    const sourceCapssP = new VectorSource({ wrapX: false });
    let layerCapssP = new WebGLPointsLayer({ source: sourceCapssP, id: 'capss_p', style: { 'circle-radius': 5, 'circle-fill-color': 'rgba(255, 255, 255, 0.6)', 'circle-stroke-color': 'rgba(255, 255, 255, 1)'  }, zIndex: 6 });
    const sourceCapssPHeatmap = new VectorSource({ wrapX: false });
    let layerCapssPHeatmap = new HeatmapLayer({ source: sourceCapssPHeatmap, id: 'Capss_P_Heatmap', zIndex: 6 });
    const sourceCapssAHeatmap = new VectorSource({ wrapX: false });
    let layerCapssAHeatmap = new HeatmapLayer({ source: sourceCapssAHeatmap, id: 'Capss_A_Heatmap', zIndex: 5 });
    const sourceCapssA = new VectorSource({ wrapX: false });
    let layerCapssA = new VectorLayer({ source: sourceCapssA, id: 'capss_a', zIndex: 5, renderMode: 'image', });
    const sourceCapssM = new VectorSource({ wrapX: false });
    let layerCapssM = new VectorLayer({ source: sourceCapssM, id: 'capss_m', style: null, zIndex: 5 });
    const sourceCapssMHeatmap = new VectorSource({ wrapX: false });
    let layerCapssMHeatmap =new HeatmapLayer({ source: sourceCapssMHeatmap, id: 'Capss_M_Heatmap', zIndex: 5 });
    // 공간정보
    const sourceSandan = new VectorSource({ wrapX: false });
    let layerSandan = new VectorLayer({ source: sourceSandan, style: null, id: 'Sandan', zIndex: 4 });
    const sourceSido = new VectorSource({ wrapX: false });
    let layerSido = new VectorLayer({ source: sourceSido, style: null, id:'Sido', zIndex: 3 });
    const sourceSigungu = new VectorSource({ wrapX: false });
    let layerSigungu = new VectorLayer({ source: sourceSigungu, style: null, id:'Sigungu', zIndex: 3 });
    const sourceLanduse = new VectorSource({ wrapX: false });
    let layerLanduse = new VectorImageLayer({ source: sourceLanduse, id: 'Landuse', declutter: true, renderMode: 'webgl', style: null, zIndex: 3 });
    const sourceMoctLink = new VectorSource({ wrapX: false });
    const layerMoctLink = new VectorLayer({ source: sourceMoctLink, style: null, id:'Moct_Link', zIndex: 3 });
    const sourceMoctLinkVol = new VectorSource({ wrapX: false });
    const layerMoctLinkVol = new VectorLayer({ source: sourceMoctLinkVol, style: null, id:'Moct_Link_Vol', zIndex: 3 });
    const sourcePpltndn = new VectorSource({ wrapX: false });
    const layerPpltndn = new VectorLayer({ source: sourcePpltndn, style: null, id:'Ppltndn', zIndex: 3 });
    // 반경 안에 들어간 site를 넣어주는 layer
    const sourceSiteInSearchRadius = new VectorSource({ wrapX: false });
    const layerSiteInSearchRadius = new VectorLayer({ source: sourceSiteInSearchRadius, id: 'SiteCircle', style: { 'circle-radius': ['get', 'gis_search_geom_size'], 'circle-fill-color': ['get', 'gis_search_geom_fill_color'], 'circle-stroke-color': ['get', 'gis_search_geom_stroke_color'], 'fill-color': ['get', 'gis_search_geom_fill_color'], 'stroke-color': ['get', 'gis_search_geom_stroke_color'], }, zIndex: 10 });
    // 반경을 넣어주는 layer
    const sourceSearchRadius = new VectorSource({ wrapX: false });
    const layerSearchRadius = new VectorLayer({ source: sourceSearchRadius, id: 'SearchRadius', style: { 'fill-color': ['get', 'fill_color'], 'stroke-color': ['get', 'stroke_color'], }, zIndex: 7 });
    // 중심점과 반경에 들어온 site를 연결하는 선을 넣는 layer  style: funcStyle, 
    const sourceDistance = new VectorSource({ wrapX: false });
    const layerDistance = new VectorLayer({ source: sourceDistance, id: 'Distance', zIndex: 10 });
    //popup
    const [txtPopup, setTxtPopup] = useState('');
    //legend
    const lgndLegendBase = new LgndLegend({ title: '', size: [20, 20], margin: 3, id: 'LegendBase', });
    const ctrlLegendBase = new CtrlLegend({ legend: lgndLegendBase, className: 'ol-legend ol-legend-right' });
    
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
        map.addLayer(layerSiteInSearchRadius);
        map.addLayer(layerSearchRadius);
        map.getView().setZoom(1);
        map.addControl(ctrlLegendBase);
        ctrlLegendBase.show();

        if(window.chrome.webview) {
            window.addEventListener('message', handleWindowMessage);
        }
        if(SetMap) {
            SetMap(map);
        }
    }, [map, map.ol_uid]);
    // const handleMapMoveEnd = async (e) => {
    //     // if(map.getView().getZoom() > 6) {
            
    //     //     const bound = map.getView().calculateExtent(map.getSize()); // [minx, miny, maxx, maxy]
    //     //     let strBound = `SRID=5179;POLYGON(( ${bound[0]} ${bound[1]}, ${bound[2]} ${bound[1]}, ${bound[2]} ${bound[3]}, ${bound[0]} ${bound[3]}, ${bound[0]} ${bound[1]} ))`
    //     //     window.chrome.webview.postMessage({ type: 'landuse', data: { bound: strBound } });
    //     // }
    //     // else {
    //     //     sourceLanduse.clear();
    //     // }
    // }
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
            const addr = await Geocoding('reverseGeo', grs[0], grs[1]);
            let addStr = '';

            if(addr) {
                if(addr.road.roadAdres) {
                    addStr = addr.road.roadAdres;
                }
                else {
                    addStr = addr.jibun.jibunAdres;
                }
            }
            
            window.chrome.webview.postMessage({ type: 'mapClick', data: { wgs: `${wgs[0].toFixed(5)} ${wgs[1].toFixed(5)}`, utm: `${parseFloat(coord[0]).toFixed()} ${parseFloat(coord[1]).toFixed()}` , grs: `${parseFloat(grs[0]).toFixed()} ${parseFloat(grs[1]).toFixed()}`, addr: addStr } });
        }
    }
    const handleWindowMessage = async (e) => {
        // c++builder 또는 c#에서 postMessage로 보냈을때 받는 곳
        if(!e.data.pagetype) { return ;}
        
        const message = e.data;

        if(message.pagetype === 'layerclear') {
            sourceMarker.clear();
            
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
            else if(message.clearType === 'radius') {
                sourceSearchRadius.clear();
                sourceSiteInSearchRadius.clear();
            }
            else if(message.clearType.includes('sandan')) {
                sourceSandan.clear();
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
        if(message.pagetype.includes('site')) {
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
            });
        }
        else if(message.pagetype === 'chart') {
            let chartIndex = map.getAllLayers().findIndex(layer => layer.get('id') ? layer.get('id') === 'Chart' : -1);
            let layer;

            if(chartIndex < 0) {
                layer = new VectorLayer({ 
                    source: new VectorSource({ wrapX: false })
                    , id: 'Chart'
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
        else if(message.pagetype === 'searchradius') {
            sourceSearchRadius.clear();
            sourceSiteInSearchRadius.clear();
        }
        else if(message.pagetype === 'shorcutcoord') {
            //좌표바로가기 :: 사용자는 wgs84만 보낸다는 가정하에 만듦 (2023-09-06)
            const grs = transform(message.coordinate, 'EPSG:4326', map.getView().getProjection().getCode());
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

            // const arrStyles = [];

            if(key.includes('chart')) {
                // chart
                let styles;
                console.log(obj, obj[key]);
                Object.keys(obj).forEach(key1 => {
                    if(typeof obj[key1] === 'object') {
                        const obj2 = obj[key1];
    
                        Object.keys(obj2).forEach(key2 => {
                            if(key2 === 'styles') {
                                styles = obj2[key2];
                            }
                        });
                    }
                });
    
                let chartIndex = map.getAllLayers().findIndex(layer => layer.get('id') ? layer.get('id') === 'Chart' : -1);
                let layer;
    
                if(chartIndex < 0) {
                    layer = new VectorLayer({ 
                        source: new VectorSource({ wrapX: false })
                        , id: 'Chart'
                        , zIndex: 3
                     });
                     map.addLayer(layer);
                }
                else {
                    layer = map.getAllLayers()[chartIndex];
                }
    
                const pieStyle = styles[styles.findIndex(item => item.charttype === 'pie')];
                const barStyle = styles[styles.findIndex(item => item.charttype === 'bar')];
                
                layer.setStyle( 
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
            else if(key === 'gnrl') {
                layerGnrl.setVisible(false);
                const styles = [];
                obj[key].forEach(siteStyle => {
                    if(Array.isArray(siteStyle.styles)) {
                        const arrColor = [];
                        
                        siteStyle.styles.forEach(step => {
                            styles.push({
                                filter: ['all', ['<=', parseInt(step.min), ['get', 'gis_conc']], ['>=', parseInt(step.max), ['get', 'gis_conc']], ],
                                style: { 'circle-radius': parseInt(step.point_size), 'circle-fill-color': step.fill_color, 'circle-stroke-color': step.stroke_color }
                            });
                        });
                    }
                    else {
                        styles.push({
                            filter: ['==', ['get', 'area_type2'], siteStyle.gnrlType],
                            style: { 'circle-radius': parseInt(siteStyle.styles.point_size), 'circle-fill-color': siteStyle.styles.fill_color, 'circle-stroke-color': siteStyle.styles.stroke_color }
                        });
                    }
                });
    
                layerGnrl.setStyle(styles);
                layerGnrl.setVisible(true);
            }
            else if(key === 'prtr') {
                const arrFillColor = ['case'], arrStrokeColor = ['case'], arrPointSize = ['case'], arrStrokeWidth=['case'];
                const styles = obj[key].styles;
    
                styles.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', 'prtr_total_sum']], ['>=', parseFloat(step.max), ['get', 'prtr_total_sum']], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                    arrPointSize.push(temp);
                    arrPointSize.push(parseInt(step.point_size));
                    arrStrokeWidth.push(temp);
                    arrStrokeWidth.push(parseInt(step.stroke_width));
                });
    
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                arrPointSize.push(3);
                arrStrokeWidth.push(3);
                layerPrtr.setStyle({
                    'circle-radius': arrPointSize,
                    'circle-fill-color': arrFillColor,
                    'circle-stroke-color': arrStrokeColor ,
                    'circle-stroke-width': arrStrokeWidth
                });
            }
            else if(key === 'prtr_heatmap') {
                map.removeLayer(layerPrtrHeatmap);
                
                const styles = obj[key].styles;
                const totalMin = styles[0].min;
                const totalMax = styles[styles.length - 1].max;
                const arrColor = [];
    
                styles.forEach(step => {
                    arrColor.push(step.fill_color);
                });
    
                layerPrtrHeatmap = new HeatmapLayer({ 
                    source: sourcePrtrHeatmap, 
                    blur: obj[key].blur,
                    radius: obj[key].radius,
                    gradient: arrColor,
                    weight: obj[key].pollType === '사업장' ? '1' :
                        (feature) => {
                            // ['get', pollType.toLowerCase().replace('.', '')]
                            const val = parseFloat(feature.get('prtr_total_sum'));
                            return val / (totalMax - totalMin);
                        },
                    id: 'Prtr_Heatmap',
                    zIndex: 9,
                });
                map.addLayer(layerPrtrHeatmap);
            }
            else if(key === 'sems') {
                let layerTarget;

                map.getAllLayers().forEach(layer => {
                    if(!layer.get('id')) { return; }
                    if(layer.get('id').toLowerCase() === key) { layerTarget = layer; }
                });
                map.removeLayer(layerTarget);
                // map.removeLayer(layerSems);
                const arrFillColor = ['case'], arrStrokeColor = ['case'], arrPointSize = ['case'], arrStrokeWidth = ['case'];
                const styles = obj[key].styles;
                styles.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', 'year_emission']], ['>=', parseFloat(step.max), ['get', 'year_emission']], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                    arrPointSize.push(temp);
                    arrPointSize.push(parseInt(step.point_size));
                    arrStrokeWidth.push(temp);
                    arrStrokeWidth.push(parseInt(step.stroke_width));
                });
    
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                arrPointSize.push(3);
                arrStrokeWidth.push(2);
                /// 여기 addLayer하는데 PointsLayer.js에서 flushbufferdata can't read error발생
                const layerTemp = new WebGLPointsLayer({ 
                    source: sourceSems, 
                    id: 'Sems', 
                    style: { 'circle-radius': arrPointSize, 'circle-fill-color': arrFillColor, 'circle-stroke-color': arrStrokeColor, 'circle-stroke-width': arrStrokeWidth }, 
                    zIndex: 8
                });
                map.addLayer(layerTemp);
            }
            else if(key === 'sems_heatmap') {
                map.removeLayer(layerSemsHeatmap);
                
                const styles = obj[key].styles;
                const totalMin = styles[0].min;
                const totalMax = styles[styles.length - 1].max;
                const arrColor = [];
    
                styles.forEach(step => {
                    arrColor.push(step.fill_color);
                });
                
                const layerTemp = new HeatmapLayer({ 
                    source: sourceSemsHeatmap, 
                    blur: obj[key].blur,
                    radius: obj[key].radius,
                    gradient: arrColor,
                    weight: 
                        obj[key].pollType === '사업장' ? '1' :
                        (feature) => {
                            const val = parseFloat(feature.get('year_emission'));
                            return val / (totalMax - totalMin);
                        }
                        ,
                    id: 'Sems_Heatmap',
                    zIndex: 7,
                });
    
                map.addLayer(layerTemp);
            }
            else if(key === 'capss_p') {
                let layerTarget, source;

                map.getAllLayers().forEach(layer => {
                    if(!layer.get('id')) { return; }
                    if(layer.get('id').toLowerCase() === key) { layerTarget = layer; source = layer.getSource(); }
                });
                map.removeLayer(layerTarget);
                const arrFillColor = ['case'], arrStrokeColor = ['case'], arrPointSize = ['case'], arrStrokeWidth = ['case'];
                const colorStep = obj[key].styles;
                const pollType = obj[key].pollType.toLowerCase().replace('.', '');
                
                colorStep.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', pollType]], ['>=', parseFloat(step.max), ['get', pollType]], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                    arrPointSize.push(temp);
                    arrPointSize.push(parseInt(step.point_size));
                    arrStrokeWidth.push(temp);
                    arrStrokeWidth.push(parseInt(step.stroke_width));
                });
                
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                arrPointSize.push(3);
                arrStrokeWidth.push(3);
                
                const layerTemp = new WebGLPointsLayer({ 
                    source: source, 
                    style: { 'circle-radius': arrPointSize, 'circle-fill-color': arrFillColor, 'circle-stroke-color': arrStrokeColor, 'circle-stroke-width': arrStrokeWidth }, 
                    id: key, 
                    zIndex: 6
                });
                map.addLayer(layerTemp);
            }
            else if(key === 'capss_p_heatmap') {
                map.removeLayer(layerCapssPHeatmap);
                
                const styles = obj[key].styles;
                const totalMin = styles[0].min;
                const totalMax = styles[styles.length - 1].max;
                const arrColor = [];
    
                styles.forEach(step => {
                    arrColor.push(step.fill_color);
                });
                
                layerCapssPHeatmap = new HeatmapLayer({ 
                    source: sourceCapssPHeatmap, 
                    blur: obj[key].blur,
                    radius: obj[key].radius,
                    gradient: arrColor,
                    weight: obj[key].pollType === '사업장' ? '1' :
                        (feature) => {
                            const val = parseFloat(feature.get(obj[key].pollType.toLowerCase().replace('.', '')));
                            return val / (totalMax - totalMin);
                        },
                    id: 'Capss_P_Heatmap',
                    zIndex: 5,
                });
                map.addLayer(layerCapssPHeatmap);
            }
            else if(key === 'capss_a' ||  key === 'capss_m') {
                let layer;

                if(key.includes('_a')) {
                    layer = layerCapssA;
                }
                else {
                    layer = layerCapssM;
                }

                // const source = layer.getSource();
                // map.removeLayer(layer);
                const arrFillColor = ['case'], arrStrokeColor = ['case'], arrStrokeWidth = ['case'];
                const colorStep = obj[key].styles;
                const pollType = obj[key].pollType.toLowerCase().replace('.', '');
                
                colorStep.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', pollType]], ['>=', parseFloat(step.max), ['get', pollType]], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                    arrStrokeWidth.push(temp);
                    arrStrokeWidth.push(parseInt(step.stroke_width));
                });
                
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                arrStrokeWidth.push(2);
    
                const styleCapssA = {
                    'fill-color': arrFillColor,
                    'stroke-color': arrStrokeColor,
                    'stroke-width': arrStrokeWidth, 
                    //parseInt(colorStep[0].stroke_width),
                    'stroke-offset': -1,
                }
                layer.setStyle(styleCapssA);
                // layer = new WebGLLayer({ 
                //     source: source
                    // , style: {
                    // 'fill-color': arrFillColor,
                    // 'stroke-color': arrStrokeColor,
                    // 'stroke-width': parseInt(colorStep[0].stroke_width),
                    // 'stroke-offset': -1,
                    // }
                //     ,  id: key
                //     , zIndex: 3
                // });
                
                // map.addLayer(layer);
            }
            else if(key === 'capss_a_heatmap') {
                map.removeLayer(layerCapssAHeatmap);
                
                const styles = obj[key].styles;
                const totalMin = styles[0].min;
                const totalMax = styles[styles.length - 1].max;
                const arrColor = [];
    
                styles.forEach(step => {
                    arrColor.push(step.fill_color);
                });
                
                layerCapssAHeatmap = new HeatmapLayer({ 
                    source: sourceCapssAHeatmap, 
                    blur: obj[key].blur,
                    radius: obj[key].radius,
                    gradient: arrColor,
                    weight: obj[key].pollType === '사업장' ? '1' :
                        (feature) => {
                            const val = parseFloat(feature.get(obj[key].pollType.toLowerCase().replace('.', '')));
    
                            return val / (totalMax - totalMin);
                        },
                    id: 'Capss_A_Heatmap',
                    zIndex: 4,
                });
                map.addLayer(layerCapssAHeatmap);
            }
            else if(key === 'capss_m_heatmap') {
                map.removeLayer(layerCapssMHeatmap);
                
                const styles = obj[key].styles;
                const totalMin = styles[0].min;
                const totalMax = styles[styles.length - 1].max;
                const arrColor = [];
    
                styles.forEach(step => {
                    arrColor.push(step.fill_color);
                });
                
                layerCapssMHeatmap = new HeatmapLayer({ 
                    source: sourceCapssMHeatmap, 
                    blur: obj[key].blur,
                    radius: obj[key].radius,
                    gradient: arrColor,
                    weight: obj[key].pollType === '사업장' ? '1' :
                        (feature) => {
                            const val = parseFloat(feature.get(obj[key].pollType.toLowerCase().replace('.', '')));
                            return val / (totalMax - totalMin);
                        },
                    id: 'Capss_M_Heatmap',
                    zIndex: 5,
                });
                map.addLayer(layerCapssMHeatmap);
            }
            else if(key === 'ppltndn') {
                const arrFillColor = ['case'], arrStrokeColor = ['case'];
                const styles = obj[key].styles;
    
                styles.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', 'gis_conc']], ['>=', parseFloat(step.max), ['get', 'gis_conc']], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                });
    
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                layerPpltndn.setStyle({
                    'fill-color': arrFillColor,
                    'stroke-color': arrStrokeColor
                });
            }
            else if(key === 'moct_link_vol') {
                const arrFillColor = ['case'], arrStrokeColor = ['case'], arrPointSize = ['case'];
                const styles = obj[key].styles;
    
                styles.forEach(step => {
                    const temp = ['all', ['<=', parseFloat(step.min), ['get', 'gis_conc']], ['>=', parseFloat(step.max), ['get', 'gis_conc']], ];
                    arrFillColor.push(temp);
                    arrFillColor.push(step.fill_color);
                    arrStrokeColor.push(temp);
                    arrStrokeColor.push(step.stroke_color);
                    arrPointSize.push(temp);
                    arrPointSize.push(parseInt(step.point_size));
                });
    
                arrFillColor.push('rgba(255,255,255,0.6)');
                arrStrokeColor.push('rgba(255,255,255,0.6)');
                arrPointSize.push(3);
                layerMoctLinkVol.setStyle({
                    'circle-radius': arrPointSize,
                    'circle-fill-color': arrFillColor,
                    'circle-stroke-color': arrStrokeColor
                });
            }
            else if(key === 'landuse') {
                const styles = obj[key].styles;
                const arrStyles = [];
                
                styles.forEach(style => {
                    const temp = {
                        filter: ['==', ['get', 'l2_code'], style.data_key],
                        style: {
                            'fill-color': style.fill_color,
                            'stroke-color': style.stroke_color,
                            'stroke_width': style.stroke_width,
                            'stroke-offset': -1,
                        }
                    }
                    arrStyles.push(temp);
                });

                layerLanduse.setStyle(arrStyles);
            }
            else {
                const arrStyle = [];

                obj[key].styles.forEach(style => {
                    if(style.stroke_color || style.fill_color) {
                        if(!(style.stroke_color === 'null' || style.fill_color === 'null')) {
                            arrStyle.push({
                                filter: ['==', ['get', 'gis_type_cd'], style.type],
                                style: { 
                                    'stroke-color': style.stroke_color, 
                                    'stroke-width': parseInt(style.stroke_width), 
                                    'stroke-offset': -1, 
                                    'fill-color': style.fill_color
                                 },
                            });
                        }
                    }
                });
                map.getLayers().forEach(layer => {
                    if(!layer.get('id')) {
                        return;
                    }
                    if(layer.get('id').toLowerCase() === key) {
                        layer.setStyle(arrStyle);
                    }
                });
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
        let url = `http://${urlvalue.replace("https://", '')}/openapi/search.json?target=${target}&apikey=${apivalue}`;

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

    return (
        <Container id='ngii'>
            <PopupContainer ref={refPopup}><PopupWrap>{txtPopup}</PopupWrap></PopupContainer>
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
        width: auto;
        padding: 5px 3px;
        left: auto;
        right: 20px;
        bottom: 7%;
        // display: none;
        display: flex;
        flex-direction: column;
        border-radius: 5px;
        font-family: NanumBarumGothic;

        //.ol-closebox
        button {
            display: none;
        }   
    }
    .ol-legend.ol-legend-right.active {
        display: block;
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