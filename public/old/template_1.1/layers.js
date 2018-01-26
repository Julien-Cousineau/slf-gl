function Group(name){
  
  this.name = name;
  this.icon = "fa fa-home";
  this.initialised();
}

Group.prototype = {
  initialised:function(){
    this.layers =[];
  },
  addLayer:function(layer){
    // TODO : check obect is Layer
    if(!(this.getLayer(layer.name))){
      this.layers.push(layer);
    } else {
      throw Error('Layer already exist');
    }
  },
  getLayer:function(name){
    return this.layers.find(function(o){return o.name === name;});
  },
  getHTMLHeader:function(){
    return `<h3>{0}</h3>`.format(this.name);
  },
  getHTMLList:function(){
    return getHTMLList(this.icon,this.name,this.layers);
  },
  getHTMLPanels:function(){
    const layers = this.layers;
    let html = '';
    for(let i=0,n=layers.length;i<n;i++){
      const layer = layers[i];
      html += layer.htmlPanel();
    }
    return html;
  },
};


function Layer(file, options){
  options = this.options = extend(Object.create(this.options), options);
  this.file        = file;
  this.name        = options.name;
  this.group       = options.group;
  this.type        = options.type;
  this.title       = options.title;
  this.subtitle       = options.subtitle;
  this.description = options.description;
  // this.initialised();
}

Layer.prototype = {
   options: {
    name       :'name',
    group      :'gis',
    type       :'geojson',
    title      :'title',
    subtitle   :'subtitle',
    description:'description',
  },
  initialised:function(){
    this.NFRAME   = this.getNFRAME();
    this.NVAR     = this.getNVAR();
    this.NGEO     = this.getNGEO();
    this.extent   = this.getExtent();
    
  },
  getNGEO:function(){
    throw Error('Function not complete');
  },   
  getNVAR:function(){
    throw Error('Function not complete');
  },
  getNFRAME:function(){
    throw Error('Function not complete');
  },
  getExtent:function(){
    throw Error('Function not complete');    
  },
  htmlPanel:function(){
    
    
    return getHTMLPanel(this.title,this.subtitle,null);
  },
  
  get XY(){
    if (!(this._XY)) this.getXY();
    return this._XY;
  },
};

function Property(){
  this.initialised();
}

Property.prototype = {
  initialised:function(){
  },
};

function Plot(){
  this.initialised();
}

Plot.prototype = {
  initialised:function(){
  },
};

function extend(dest, src) {
    for (var i in src) dest[i] = src[i];
    return dest;
}

// function getHTMLPanel(title,subtitle,content){
  
// }
function getHTMLList(icon,name,layers){
  let layerhtml = '';
  for(let i=0,n=layers.length;i<n;i++){
    const layer = layers[i];
    layerhtml+='<li><a>{0}</a></li>'.format(layer.title);
  }
  
  return `<li class=""><a><i class="{0}"></i> {1} <span class="fa fa-chevron-down"></span></a>
            <ul class="nav child_menu" style="display: none;">
              {2}
            </ul>
          </li>`.format(icon,name,layerhtml);
}
function getHTMLPanel(title,subtitle,content){
  return `<div class="x_panel">
      <div class="x_title">
        <h2>{0}<small>{1}</small></h2>
        <ul class="nav navbar-right panel_toolbox">
          <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a></li>
          <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false"><i class="fa fa-wrench"></i></a>
            <ul class="dropdown-menu" role="menu">
              <li><a href="#">Settings 1</a>
              </li>
              <li><a href="#">Settings 2</a>
              </li>
            </ul>
          </li>
          <li><a class="close-link"><i class="fa fa-close"></i></a>
          </li>
        </ul>
        <div class="clearfix"></div>
      </div>
      <div class="x_content">
      {2}
      </div>
    </div>`.format(title,subtitle,content);  
}



// String formatter
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

