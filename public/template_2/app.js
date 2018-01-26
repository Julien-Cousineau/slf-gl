/*global $,LayerContainer,Layer,mapboxgl,ajax,slfgl*/
const IP = 'https://myworkspace-jcousineau.c9users.io:8080/';
function App(){
    new SideBar();

    const parent = this;
    // let layer1 = new Layer("museums",this.getMuseumObject());
    // let layer2 = new Layer("contours",this.getContourObject());
    // let layer3 = new Layer("route",getLine());
    // layer3.options['getApp'] = function(){return parent;};
    
    // let layers = [layer1,layer2,layer3];
    
    let line = getLine()
    line['getApp'] = function(){return parent;};
    // let layers = [this.getMuseumObject(),this.getContourObject(),line,this.getSLFObject()];  
    
    // let layers = [this.getSLFObject()];  
    let layers = [this.getSLFObject(),this.getMuseumObject(),line];
    // let layers = [this.getSLFObject(),this.getContourObject()];
    // let layers = [this.getSLFObject()];
    // let layers = [this.getContourObject()];
    this.layerContainer = new LayerContainer("name","layercontent",this.mapContainer,layers);
}

App.prototype = {
  get mapContainer(){
    if(!(this._mapContainer)){
      this._mapContainer = new MapContainer("#bodyContainer");
    }
    return this._mapContainer;
  },
  getMuseumObject:function(){
    const parent = this;
    return {
          'id': 'museums',
          'type': 'circle',
          'layout': {'visibility': 'visible'},
          'paint': {
                    'circle-radius': 8,
                    'circle-color': 'rgba(55,148,179,1)'
                   },
          'source-layer': 'museum-cusco',
          'getApp':function(){return parent;},
          'source':{type:'vector',url:'mapbox://mapbox.2opop9hr'}
          };
  },
  getContourObject:function(){
    const parent = this;
    return {
          'id': 'contours',
          'type': 'line',
          'source-layer': 'contour',
          'layout': {
              'visibility': 'visible',
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': '#877b59',
              'line-width': 1
          },
          'getApp':function(){return parent;},
          'source':{type:'vector',url:'mapbox://mapbox.mapbox-terrain-v2'}
      };
  },
  getSLFObject:function(){
    const parent = this;
    return {
          'id': 'mesh1800',
          'type': 'mesh', // 
          'source-layer': 'contour',
          'layout': {
              'visibility': 'visible',
              'render':''
          },
          'paint': {
              'line-color': '#877b59',
              'line-width': 1,
              'fill-color': '#877b59',
          },
          'getApp':function(){return parent;},
          'source':{type:'slf',url:IP + "data/mesh.1800.slf"}
      };     
  },
};

function MapContainer(container){
  this.initialise(container);
}
MapContainer.prototype = {
  initialise:function(container){
    $(container).append(this.getDiv());
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2ZlcmciLCJhIjoiY2l6OHF4eG85MDBwcTMybXB5dTY0MzlhNCJ9.Mt1hpCCddMlSvDiCtOQiUA';
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [-126, 48],
      zoom: 4
      // zoom: 15,
      // center: [-71.97722138410576, -13.517379300798098]
    });
  },
  addSource:function(name,source){
    this.map.addSource(name,source);
  },
  addLayer:function(layer){
    this.map.addLayer(layer);
  },
  getDiv:function(){
    return '<div id="map"></div>'
  },
  
  
}

function getLine(){
  return {
        "id": "route",
        "type": "line",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [-71.97722138410576, -13.517379300798098],
                        [-71.98, -13.517379300798098],
                       
                    ]
                }
            }
        },
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#888",
            "line-width": 8
        }
    }
}