import { Control } from 'ol/control';
import { Point, Polygon } from "ol/geom";
import { toContext } from "ol/render";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

class LegendControl extends Control {
    constructor(opt) {
        const options = opt || {};
        const divControl = document.createElement('div');
        divControl.id = 'ControlGisLegend';
        divControl.className = 'gis-legend ol-unselectable ol-control';
        divControl.style.margin = '3px';
        divControl.style.padding = '3px';
        divControl.style.right = '0px';
        divControl.style.bottom = '5%';
        
        super({
            element: divControl,
            target: options.target,
        });

        this.divControl = divControl;
    }

    addLegend(id='', title='', pollutant=undefined) {
        // ELEMENT
        const btnIcon = document.createElement('button');
        btnIcon.id = 'GisLegendIcon';
        btnIcon.type = 'button';
        btnIcon.className = 'gis-legend legend-icon';
        // btnIcon.style.width = '22px';
        btnIcon.style.height = '22px';
        btnIcon.style.cursor = 'pointer';
        btnIcon.textContent = title;        //'L';
        // btnIcon.appendChild(document.createTextNode('L'));
        btnIcon.name = id;
        btnIcon.addEventListener('click', this.handleToggle.bind(this), false);
        const btnClose = document.createElement('button');
        btnClose.type = 'button';
        btnClose.className = 'gis-legend legend-close';
        btnClose.innerHTML = "&#xd7;";
        btnClose.name = id;
        btnClose.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        btnClose.style.border= 'none';
        btnClose.style.width = '22px';
        btnClose.style.height = '22px';
        btnClose.style.padding = '0';
        btnClose.style.fontSize = '15px';
        btnClose.style.fontWeight = '900';
        btnClose.style.position = 'absolute';
        btnClose.style.right = '0px';
        btnClose.style.top = '0px';
        btnClose.style.cursor = 'pointer';
        btnClose.addEventListener('click', this.handleToggle.bind(this), false);
        const divTitle = document.createElement('div');
        const spanTitle = document.createElement('span');
        spanTitle.id = `legendTitle`;
        spanTitle.style.fontFamily = 'NanumBarunGothic';
        spanTitle.style.fontSize = '15px';
        spanTitle.style.fontWeight = '800';
        spanTitle.innerText = title;        // options.legendTitle ? options.legendTitle : '';
        divTitle.appendChild(spanTitle);
        const divPollutant = document.createElement('div');
        const spanPollutant = document.createElement('span');
        spanPollutant.id = `legendPollutant`;
        spanPollutant.style.fontFamily = 'NanumBarunGothic';
        spanPollutant.style.fontSize = '13px';
        spanPollutant.innerText = pollutant;
        divPollutant.appendChild(spanPollutant);
        
        if(!pollutant) {
            divPollutant.style.display = 'none';
        }
        
        const divItemContainer = document.createElement('div');
        divItemContainer.id = 'DivItemContainer';
        // divItemContainer.style.display = 'flex';
        const divLegendBase = document.createElement('div');
        divLegendBase.id = 'DivBaseLegend';
        divLegendBase.className = 'gis-legend legend-base hidden';     //
        divLegendBase.style.padding = '12px 5px 5px 5px';   // t r b l
        divLegendBase.style.borderRadius = '5px';
        divLegendBase.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        divLegendBase.style.position = 'relative';
        // divLegendBase.style.display = 'flex';
        divLegendBase.appendChild(btnClose);
        divLegendBase.appendChild(divTitle);
        divLegendBase.appendChild(divPollutant);
        divLegendBase.appendChild(divItemContainer);
        
        const divLegendContainer = document.createElement('div');
        divLegendContainer.id = `legendCont_${id}`;
        divLegendContainer.appendChild(btnIcon);
        divLegendContainer.appendChild(divLegendBase);

        this.divControl.appendChild(divLegendContainer);
    }
    removeLegend(id='') {
        const contList = this.divControl.childNodes;

        for(const cont of contList) {
            if(cont.id === `legendCont_${id}`) {
                this.divControl.removeChild(cont);
                return;
            }
        }
    }
    findLegend(id='') {
        let result = false;

        if(this.divControl.querySelector(`#legendCont_${id}`)) {
            result = true;
        }

        return result;
    }

    handleToggle(evt) {
        const contList = this.divControl.childNodes;

        for(const cont of contList) {
            if(cont.id === `legendCont_${evt.target.name}`) {
                const children = cont.childNodes;
        
                for(const child of children) {
                    child.classList.toggle('hidden');
                }
            }
        }
    }

    setLegendTitle(id='', title = '') {
        const contList = this.divControl.childNodes;
        
        for(const cont of contList) {
            if(cont.id === `legendCont_${id}`) {
                const lgndTitle = cont.querySelector('#legendTitle');
                lgndTitle.innerHTML = title;
                lgndTitle.parentNode.style.display = 'block';
                return;
            }
        }
    }
    setLegendPollutant(id='', pollutant='') {
        const contList = this.divControl.childNodes;
        
        for(const cont of contList) {
            if(cont.id === `legendCont_${id}`) {
                const lgndPoll = cont.querySelector('#legendPollutant');
                lgndPoll.innerHTML = pollutant;
                lgndPoll.parentNode.style.display = 'block';
                return;
            }
        }
    }
    addLegendItem(id='', featureStyle={ }, geometryType='', title='') {
        const canvasFeature = document.createElement('canvas');
        const style = new Style();

        // set Style
        if(geometryType === 'Point') {
            const vc = toContext(canvasFeature.getContext('2d'), { size: [parseInt(featureStyle['circle-radius']) * 2.5, parseInt(featureStyle['circle-radius']) * 2.5] });   
            const pointStyle = new CircleStyle({
                radius: parseInt(featureStyle['circle-radius']),
                fill: new Fill({ color: featureStyle['circle-fill-color'] }),
                stroke: new Stroke({ color: featureStyle['circle-stroke-color'], width: parseInt(featureStyle['circle-stroke-width']) })
            });
            
            style.setImage(pointStyle);
            vc.setStyle(style);
            // 무조건 style 지정한 뒤에 draw를 해줘야 그림이 나오네
            const center = parseInt(featureStyle['circle-radius']) * 1.2;
            vc.drawGeometry(new Point([center, center]));
        }
        else if(geometryType === 'Polygon') {
            const vc = toContext(canvasFeature.getContext('2d'), { size: [20, 20] });
            style.setFill(new Fill({ color: featureStyle['fill-color'] }));
            style.setStroke(new Stroke({ color: featureStyle['stroke-color'], width: parseInt(featureStyle['stroke-width']) }));
            vc.setStyle(style);
            
            vc.drawGeometry(new Polygon([
                [[2, 2], [2, 18], [18, 18], [18, 2], [2, 2]]
            ]));
        }
        
        const lblLegendItem = document.createElement('label');
        lblLegendItem.innerText = title;
        lblLegendItem.style.fontFamily = 'NanumBarunGothic';
        lblLegendItem.style.fontSize = '12px';
        const divLegendItem = document.createElement('div');
        divLegendItem.style.padding = '1px 5px';
        divLegendItem.style.display = 'flex';
        divLegendItem.style.alignItems = 'center';
        divLegendItem.append(canvasFeature);
        divLegendItem.appendChild(lblLegendItem);
        // RenderFeature
        // this.divItemContainer.appendChild(divLegendItem);
        const control = this.divControl.querySelector(`#legendCont_${id}`);

        if(control) {
            const itemCont = control.querySelector('#DivBaseLegend').querySelector('#DivItemContainer');
            itemCont.appendChild(divLegendItem);
        }
    }
    removeLegendItemAll(id='') {
        // this.divItemContainer.querySelectorAll('*').forEach(n => n.remove());
        const control = this.divControl.querySelector(`#legendCont_${id}`);

        if(control) {
            const itemCont = control.querySelector('#DivBaseLegend').querySelector('#DivItemContainer');
            itemCont.querySelectorAll('*').forEach(n => n.remove());
        }
    }
}

export default LegendControl;