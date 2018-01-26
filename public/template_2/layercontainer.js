/*global $,extend,ajax*/

function LayerContainer(name,container,mapContainer,layers){  
  this.initialised(name,container,mapContainer,layers);
  this.initializeTable();
}
LayerContainer.prototype = {
  initialised:function(name,container,mapContainer,layers){
    if(typeof name===undefined)throw Error("LayerContainer must have a name");
    if(typeof container===undefined)throw Error("LayerContainer must have a container");
    if(typeof mapContainer===undefined)throw Error("LayerContainer must have a mapContainer");
    this.layers = [];
    // this.layers = (typeof layers===undefined)?[]:layers;
    this.name = name;
    this.container = container;
    this.mapContainer = mapContainer;
    this.icon = "fa fa-home";
    this.mapSetup(layers);
  },

  mapSetup:function(layers){
    const parent         = this;
    const mapContainer   = this.mapContainer;
    
    const map = mapContainer.map;
    
    map.on('load', function () {
      parent.inilizeLayers(layers);
      parent.updateTable();
    });
    const render = map.painter.render;
    map.painter.render = function(style,option) {
      render.call(this,style,option);
      const currentprogram = map.painter.currentProgram;
      for(let i=0,n=parent.layers.length;i<n;i++){
        let layer = parent.layers[i];
        if(layer.slfgl){
        }
      }
      this.gl.useProgram(currentprogram.program);
      
    };
    const renderLayer = map.painter.renderLayer;
    map.painter.renderLayer = function (painter, sourceCache, layer, coords) {
      renderLayer.call(this, painter, sourceCache, layer, coords);
      // console.log(layer.id)
      if (layer.id === "water") {
        for(let i=0,n=parent.layers.length;i<n;i++){
          let layer1 = parent.layers[i];
          if(layer1.slfgl && layer1.layout.visibility === 'visible'){
            this.gl.disable(this.gl.STENCIL_TEST);
            layer1.slfgl.drawScene(map.transform.worldSize,map.transform.projMatrix);
            map.painter.currentProgram = null;
          }
        }
      }
      
      
    };
    
  },
  inilizeLayers:function(layers){
    for(let i=0,n=layers.length;i<n;i++){
      this.addLayer(layers[i]);
    }
  },
  getSLF:function(layer,callback){
    console.log(layer)
    const requestParameters = {url:layer.source.url,responseType:'arraybuffer'};
    const gl = this.mapContainer.map.painter.gl;
    ajax(requestParameters,function(err,response){
      if(err)throw Error("WARNING: Issue with Selafin File");
      const _slfgl = new slfgl(gl,response.data,{fromProj:'EPSG:3156',toProj:'EPSG:4326',keepbuffer:1,debug:0});
      callback(_slfgl);
    }) ; 
  },
  
  addLayer:function(layerobj){
    const parent = this;
    if(this.getLayer(layerobj.id))throw Error('Layer already exist');
    if(layerobj.source.type !=='slf' && layerobj.source.type !=='slf2'){
       const layer = new Layer(layerobj);
       this.mapContainer.addLayer(layer.getMapboxLayer());
       this.layers.push(layer);
       parent.updateTable();
    } else {
      let layer = new Layer(layerobj);
      this.getSLF(layer,function(slfgl){
        layer.slfgl = slfgl;
        parent.layers.push(layer);
        parent.updateTable();
        parent.mapContainer.map._render();
      });
    }
  },
  getLayer:function(id){
    return this.layers.find(function(o){return o.id === id;});
  },  
  initializeTable:function(){
    let container = this.container;
    let dummylayer = new Layer({'source':{type:'dummy'}});
    let columns = dummylayer.getColumns();
    this.Table = new Table(container,this.name,columns,this.layers);    
  },
  getMapboxLayers:function(){
    let mplayers = [];
    for(let i=0,n=this.layers.length;i<n;i++){
      let layer = this.layers[i];
      console.log(layer);
      if(layer.source.type !=='slf' || layer.source.type !=='slf2'){
        mplayers.push(layer.getMapboxLayer());
      }
    }
    return mplayers;
  },
  // getSLFLayers:function(){
  //   let slflayers = [];
  //   for(let i=0,n=this.layers.length;i<n;i++){
  //     let layer = this.layers[i];
  //     if(layer.source.type ==='slf' || layer.source.type ==='slf2'){
  //       slflayers.push(layer.getSLFLayer());
  //     }
  //   }
  //   return slflayers;
  // },
  updateTable:function(){
    this.Table.update(this.layers);
  },

};



function Layer(options){
  this.options = extend(Object.create(this.options), options);
  this.initialised();
}

Layer.prototype = {
  options: {   
    id         :'id',
    type       :'circle',
    layout     :{'visibility': 'visible'},
    paint      :{'circle-radius': 8,'circle-color': 'rgba(55,148,179,1)'},
    // source:{type:'vector',url:'mapbox://mapbox.mapbox-terrain-v2'},
    group      :'gis',
    isOn       :true,
    title      :'title',
    subtitle   :'subtitle',
    description:'description',    
  },
  initialised:function(){
    const parent = this;
    const layer = function(){return parent;};
    if(this.source.type !== 'slf' && this.source.type !== 'slf2'){
     
      this.properties =[new Property(layer,"property1"),new Property(layer,"property2")];
    } else{
      this.properties = [];
    }
  },
  getMeshProperties:function(){
    const slf = this.slfgl.slf;
    const parent = this;
    const layer = function(){return parent;};
    
    for(let i=0;i<slf.NBV1;i++){
      const VAR = slf.VARNAMES[i];
      let minmax = slf.getVarMinMax(i);
      
      let property = new Property(layer,VAR,{minmax:minmax});
      this.properties.push(property);
    }
  },
  getColumns:function(){   
    return [
      {name:'isOn',type:'check',title:''},
      {name:'id',type:'string',title:'Name'},      
      {name:'type',type:'string',title:'Type'},
      {name:'paint',type:'paint',title:'Paint'},
      {name:'description',type:'description',title:'Description'},
      {name:'properties',type:'properties',title:'Properties'},
    ];
  },
  get isSLF(){
    return this.source.type ==='slf' || this.source.type ==='slf2';
  },
  getPropertyColumns:function(){
    if(this.isSLF){
    return [
        {name:'viewID',type:'string',title:'on/off'},
        {name:'minmax',type:'minmax',title:'Min-Max'},
        {name:'render',type:'select',title:'Render'},
        {name:'factor',type:'factor',title:'Factor'},
        {name:'weight',type:'weight',title:'Weight'},
        {name:'style',type:'style',title:'Style'},
        {name:'description',type:'description',title:'Description'},
      ];      
    } else {
    return [
        {name:'viewID',type:'string',title:'on/off'},
        {name:'minmax',type:'minmax',title:'Min-Max'},
        {name:'factor',type:'factor',title:'Factor'},
        {name:'weight',type:'weight',title:'Weight'},
        {name:'style',type:'style',title:'Style'},
        {name:'description',type:'description',title:'Description'},
      ];
    }
  },
  getMapboxLayer:function(){
    let options = this.options;
    options['id'] = this.id;
    return options;
  },
  getSLFLayer:function(gl){
    let options = this.options;
    options['id'] = this.id;
    return options;
  },
  get id(){return this.options.id;},
  get source(){return this.options.source;},
  get layout(){return this.options.layout;},
  get type(){return this.options.type;},
  get paint(){return this.options.paint;},
  set paint(value){this.options.paint = value;this.setPaint();},
  get paintSize(){return this.getPaintSize();},
  set paintSize(value){this.setPaintSize(value);},
  get group(){return this.options.group;},
  get isOn(){return this.options.isOn;},
  set isOn(value){this.options.isOn = value;this.toggleVisibility();},
  get slfgl(){return this.options.slfgl;},
  set slfgl(value){this.options.slfgl = value;this.getMeshProperties()},
  get title(){return this.options.title;},
  get subtitle(){ return this.options.subtitle;},
  get description(){return this.options.description;},
  toggleVisibility:function(){
    const visibility = (this.isOn) ? 'visible':'none';
    const map = this.options.getApp().mapContainer.map;
    this.layout.visibility = visibility;
    if(this.options.source.type !=="slf"){
      map.setLayoutProperty(this.id, 'visibility', visibility);
    } else {map._render();}
  },
  setPaint:function(){
    if(this.options.source.type !=="slf"){
      const map = this.options.getApp().mapContainer.map;
      map.setPaintProperty(this.id, '{0}-color'.format(this.type), this.paint['{0}-color'.format(this.type)]);
    } else {
      const map = this.options.getApp().mapContainer.map;
      let paint ={};
      const colorscale = d3.scaleLinear()
                           .domain([0,1])                         
                           .range(this.paint.colors);
      d3.range(0, 1.1, 0.1).forEach(value=>paint[value]=colorscale(value));
      this.slfgl.getColorTexture(paint)
      map._render();
    }
  },
  getPaintSize:function(){
    if(this.type==="circle")return this.paint['circle-radius'];
    if(this.type==="line")return this.paint['line-width'];
  },
  setPaintSize:function(value){
    if(this.type==="circle")this.paint['circle-radius']=value;
    if(this.type==="line")this.paint['line-width']=value;
    const name = (this.type==="circle") ? 'circle-radius' :'line-width';
    if(this.options.source.type !=="slf"){
      if(this.options.getApp().mapContainer && this.options.getApp().mapContainer.map._loaded){
        const map = this.options.getApp().mapContainer.map;
        map.setPaintProperty(this.id, name, value);
      }
    } else {
     throw Error("")
    }
  }  
};



function Property(layerF,id,options){
  this.layerF = layerF;
  this.options = extend(Object.create(this.options), options);
  this.id = id;
  this.initialised();
}

Property.prototype = {
  options: {   
    viewID     :0,
    minmax     :[0,1],
    render     :{points:false,wireframe:false,surface:true},
    factor     :'factors',
    weight     :'weight',
    style      :{name: "Windy",colors: ["#acb6e5", "#86fde8"]},
    description:'description',    
  },
  initialised:function(){    
  },
  parent:this,
  get layer(){return this.layerF();},
  get viewID(){return this.options.viewID;}, 
  get minmax(){return this.options.minmax;},
  get render(){return this.options.render;},
  get factor(){return this.options.factor;},
  get weight(){return this.options.weight;},
  get style(){return this.options.style;},
  set style(value){this.options.style =value;
    this.layer.paint=value;
  },
  get description(){return this.options.description;},
}

function Table(container,id,columns,data){
  this.container = container;
  this.id = id;
  this.columns = columns;
  this.data = data;
  this.initialize();
}
Table.prototype = {
   initialize:function(){
    const parent = this,
          container = this.container,
          id = this.id,
          columns = this.columns,
          data = this.data;

    this.pickers = {};
    this.createTable(container,id,columns,data);
    this.addFilterButton(id,columns);
    this.addColumnFunctions(id);
    // this.addTangle(this.data);

  },
  update:function(data){
    this.table.clear();
    this.table.rows.add(data);
    this.table.draw();
  },
  getLayer:function(id){
    return this.data.find(function(o){return o.id === id;});
  },
  createTable:function(container,id,columns,data){
    const parent = this;
    $("#{0}".format(container)).append(this.getDivTable(id));
    $("#{0}".format(id)).append(this.getDivHeader(columns));
    this.table = $("#{0}".format(id)).DataTable( {
                    "dom":"<'row'<'col-sm-12'l><'col-sm-12 {0} filtercontainer'f>>".format(id) + 
                          "<'row'<'col-sm-12'tr>>" + 
                          "<'row'<'col-sm-12'i><'col-sm-12'p>>",
                    // "scrollX": true,
                    // scrollY:'70vh',
                    autoWidth: true,
                    "order": [[ 1, 'asc' ]],
                    // scrollCollapse: true,
                    data: data,
                    columns: this.getColumns(columns),
                    "drawCallback": function( row, data, index ) {
                      parent.addTangle(parent.data);
                      
                    }
                });    
  },
  addTangle:function(layers){
    for(let i=0,n=layers.length;i<n;i++){
      const layer = layers[i];
      console.log($('#{0}_tangle'.format(layer.id)).length)
      if ($('#{0}_tangle'.format(layer.id)).length){
        var element = document.getElementById('{0}_tangle'.format(layer.id));
        
        $('#{0}_tangle span'.format(layer.id)).empty();
        $('#{0}_tangle div'.format(layer.id)).empty();
        var tangle = new Tangle(element, {
            initialize: function () {
                this.size = layer.paintSize;          },
            update: function () {
              layer.paintSize = this.size;
            }
        });      
      }
    }

    
  },
  addFilterButton:function(id,columns){    
    $(".{0}.filtercontainer".format(id)).prepend(this.getDivFilterButton(id));
    $("#{0}_dropdownfilter".format(id)).append(this.getDivFilterList(columns));
    this.addFilterFunction();
  },


//******************************************************
//   Functions
  addColumnFunctions:function(id){
    this.addDetailView(id);
    this.addPropertyView(id);
    this.addOnView(id);
    this.addPaintView(id);
    this.addStyleView(id);
  },
  addFilterFunction:function(){
    const parent = this;
    $('.checkbox input:checkbox').click(function() {
      let column =parent.table.column( $(this).attr('data-column'));
      column.visible(!column.visible());
    }); 
  },

  addDetailView:function(id){
    const parent = this;
    $('#{0} tbody'.format(id)).on('click', 'td.detailview', function () {      
      var tr = $(this).closest('tr');      
      var row = parent.table.row( tr );
      $(this).children("button").children("i").toggleClass("glyphicon-plus glyphicon-minus")

      if ( row.child.isShown() ) {
        row.child.hide();
        tr.removeClass('shown');
      } else {        
        row.child(parent.getDivDetail(row.data()) ).show();
        tr.addClass('shown');
      }
    });      
  },  
  addStyleView:function(id){
     const parent = this;
     $('#{0} tbody'.format(id)).on('click', 'td.styleview', function () {
      var tr = $(this).closest('tr');      
      var row = parent.table.row( tr );
      var layer = row.data();
      $(this).children("button").children("i").toggleClass("glyphicon-plus glyphicon-minus")
      if (row.child.isShown() ) {
        row.child.hide();
        tr.removeClass('shown');
      } else {        
        row.child(parent.getDivStyleDetail(row.data())).show();
        new Styler(function(){return layer});
        tr.addClass('shown');
      }
    });
    
  },

  addPropertyView:function(id){
     const parent = this;
     $('#{0} tbody'.format(id)).on('click', 'td.propertyview', function () {
      console.log("PropertyView Clicked")
      var tr = $(this).closest('tr');      
      var row = parent.table.row( tr );
      var layer = row.data();
      
      
      
      $("#propertycontent").empty();
      let container = 'propertycontent';
      let id = layer.id;
      
      let data = layer.properties;
      let columns =  layer.getPropertyColumns();
      parent.propertyTable = new Table(container,id,columns,data)      
      
      $("#propertyradio").prop("checked", true); 
      
    });
    
  },
  addPaintView:function(id){
    const parent = this;
		$('#{0} tbody'.format(id)).on('click', 'td.paintview .input-group-addon', function () {
		  const tr = $(this).closest('tr');      
      const row = parent.table.row( tr );
      let layer = row.data();
      
      if(layer.type !== 'mesh'){
        $('#{0}_picker'.format(layer.id)).colorpicker('show');
        $('#{0}_picker'.format(layer.id)).focus();
        $('#{0}_picker'.format(layer.id)).on('changeColor', function(e) {
          const layer = parent.getLayer($(this).attr("layer"));
          const color = $('#{0}_picker'.format(layer.id)).colorpicker('getValue');
          layer.paint['{0}-color'.format(layer.type)] = color;
          layer.paint = layer.paint;
        });
      } else {
        console.log("You have clicked paint for a mesh")
      }
		});
  },
  addOnView:function(id){
    const parent = this;
    $('#{0} tbody'.format(id)).on('click', 'td.onview', function () {
      var tr = $(this).closest('tr');      
      var row = parent.table.row( tr );
      var layer = row.data();
      layer.isOn = (layer.isOn) ? false:true;
      row.data(layer).draw();    
     });           
  },
//******************************************************
//   Columns and Divs
  getColumns:function(columns){
    let obj = []
    for(let i=0,n=columns.length;i<n;i++){obj.push(this.getColumnObject(columns[i]));}
    return obj;
  },  
  getColumnObject:function(column){
    const parent = this;
    const name  = column.name,
          type  = column.type,
          title = column.title;
    let columnObj = {"data":name};
    if(type==="description"){
      const div = this.getCellDivButton();
      columnObj = {"className":'detailview',"orderable":false,"data":null,"defaultContent":div};      
    } else if(type==="check"){      
      const checkF = function ( data, type, full, meta ) {return parent.getCellDivCheck(full)};
      columnObj = {"className":'onview',"orderable":false,"data":null, "render": checkF };
    } else if(type==="properties"){
      const  div = this.getCellDivProperty();
      columnObj =  {"className":'propertyview',"orderable":false,"data":null,"defaultContent":div};
    } else if(type==="paint"){
      const paintF = function ( data, type, full, meta ) {return parent.getDivPaint(full)};
      columnObj =  {"className":'paintview',"orderable":false,"data":null,"render":paintF};
    } else if(type==="style"){
      const styleF = function ( data, type, full, meta ) {return parent.getDivStyle(full)};
      columnObj =  {"className":'styleview',"orderable":false,"data":null,"render":styleF};
    }
    return columnObj;
  },
  getDivTable:function(id){
    return `<div class="mycontent"> 
              <table id="{0}" class="table table-striped table-bordered" cellspacing="0" width="100%"></table>
            </div>`.format(id);    
  },  
  getDivHeader:function(columns){
    let ths='';
    for(let i=0,n=columns.length;i<n;i++){ths+='<th>{0}</th>'.format(columns[i].title);}    
    return '<thead><tr>{0}</tr></thead>'.format(ths);
  },  
  getDivFilterButton:function(id){
    return `<div id="{0}_filterContainer" class="dropdown filterContainerc">
              <button id="dLabel" type="button" class="btn btn-primary" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
              </button>
              <ul id="{0}_dropdownfilter" class="dropdown-menu" aria-labelledby="dLabel">
              </ul>
           </div>`.format(id);  
  },  
  getDivDetail:function(d){ 
    let name = d.name;
    return  '<button id="mybutton10" type="button" class="btn btn-primary">+</button>';
  },
  getDivPaint:function(full){
    if(full.type !== 'mesh'){
      let color=full.paint['{0}-color'.format(full.type)];
      color = (color.indexOf('rgba') === -1) ? color:rgb2hex(color);
      return '<div id="{0}_picker" layer="{0}" class="input-group colorpicker-component colorpicker-element"><input type="text" value="{1}" class="form-control" /><span class="input-group-addon"><i style="background-color: {1}"></i></span><p id="{0}_tangle"><span data-var="size" class="TKAdjustableNumber" data-min="1" data-max="100"> size</span></p></div>'.format(full.id,color);
    } else {
      return '<div>Not complete</div>';
    }
  },
  getDivStyle:function(){
    return '<button type="button" class="btn-circle btn-xs btn-primary"><i class="glyphicon glyphicon-plus"></i></button><span>Style</span>'
  },
  getDivStyleDetail:function(){
    return `<div class="parentcontainer"></div>`;
  },
  getpickeroption:function(){
    return {
				valueElement: null,
				width: 300,
				height: 120,
				sliderSize: 20,
				position: 'top',
				borderColor: '#CCC',
				insetColor: '#CCC',
				backgroundColor: '#202020'
			};
  },
  getDivFilterList:function(columns){
    let obj = [];
    for(let i=0,n=columns.length;i<n;i++){obj.push(this.getDivFilterListRow(i,columns[i].title));}
    return obj;
  },  
  getDivFilterListRow:function(i,title){
    return `<div class="checkbox">
              <label>
                <input type="checkbox" data-column="{0}" checked> {1}
              </label>
            </div>`.format(i,title);     
  },  
  getCellDivCheck:function(full){
    return '<div class="checkbox1"><label><input  type="checkbox" {1}></label></div>'.format(full.name,(full.isOn)?'checked':'');
  },
  getCellDivButton:function(){
    return '<button type="button" class="btn-circle btn-xs btn-primary"><i class="glyphicon glyphicon-plus"></i></button><span>Description</span>';
  },
  getCellDivProperty:function(){
    return '<button type="button" class="btn-circle btn-primary"><i class="glyphicon glyphicon-plus"></i</button>';
  },
  // getCellDivProperty:function(){
    
  // },
}



