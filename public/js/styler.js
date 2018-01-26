/*global $,palette,d3*/
function Color(name, shade) {
  this._name = name;
  this._shade = typeof shade !== "undefined" ? shade : "500";
} 
Color.prototype = {
  get name() {return this._name + " " + this.shade;},
  get group() {return this._name;},
  get color() {return this.getcolor();},
  get colors() {return [this.getcolor(), this.getcolor()];},
  get shade() {return this._shade;},
  set shade(value) {this._shade = value;},
  getcolor: function() {
    if (this._name !== "Clear") {
      return palette.get(this._name, this.shade);
    } else {
      return "repeating-linear-gradient(-45deg,white,red 2px,white 2px,white 4px)";
    }
  }
};
Array.prototype.max = function(){
    return Math.max.apply( Math, this );
};
Array.prototype.min = function(){
    return Math.min.apply( Math, this );
};
function Chart(tag,data,type,selectedcolor){
  this.type = type;
  this.data = data;
  this.color   = selectedcolor;
  const svg    = this.svg = d3.select(tag);
  const margin = this.margin = {top: 10, right: 30, bottom: 30, left: 50}
  const width  = this.width  = +svg.attr("width") - margin.left - margin.right;
  const height = this.height = +svg.attr("height") - margin.top - margin.bottom;
  this.g       = svg.append("g").attr("transform", "translate({0},{1})".format(margin.left,margin.top));
  this.construct(data,type);
}
Chart.prototype ={
  construct:function(){
    this.drawAxis();
    this.drawChart();    
  },
  update:function(){    
    this._histogram=null;
    this._bins=null;
    this.drawChart(); 
    this.updateAxis();
  },
  get data(){
    if(!(this._data)){
      this.type    = 'default'; 
      this._data   = d3.range(1000).map(d3.randomBates(10));
      this._minmax = [d3.min(this._data),d3.max(this._data)];
    }
    if(this.type==="slf"){
      return this._data().currentFrame;
    } else{
      return this._data;
    }
    
  },
  set data(value){this._data = value;},
  get minmax(){
    if(this.type==="slf"){
      return this._data().minmax;
    } else {
    return this._minmax;
    }
  },
  getScale:function(info){
    let scale;
    if(info.type==="linear"){scale = d3.scaleLinear();}
    else if(info.type==="power"){scale = d3.scalePow().exponent(info.value);}
    else if(info.type==="log"){scale = d3.scaleLog().base(10.0);}
    return scale;
  },
  get yscaleinfo(){if(!(this._yscaleinfo))this._yscaleinfo = {type:'linear',value:[1.0]};return this._yscaleinfo;},
  set yscaleinfo(value){this._yscaleinfo = value;this._yscale = null;this.update();},  
  get yscale(){
    if(!(this._yscale)){
      this._yscale = this.getScale(this.yscaleinfo);
      this._yscale.domain(this.minmax)
                  .rangeRound([this.height, 0]);
    }
    return this._yscale;
  },
  get xscaleinfo(){if(!(this._xscaleinfo))this._xscaleinfo = {type:'linear',value:[1.0]};return this._xscaleinfo;},
  set xscaleinfo(value){this._xscaleinfo = value;this._xscale = null;this.update();},
  get xscale(){
    if(!(this._xscale)){
      const max = d3.max(this.bins, function(d) { return d.length; });
      let min = d3.min(this.bins, function(d) { return d.length; });
      let domain = (this.xscaleinfo.type === 'log')?[min,max]:[0,max];
      this._xscale = this.getScale(this.xscaleinfo);
      this._xscale.domain(domain)
                  .rangeRound([0, this.width]);
    }
    return this._xscale;
  },
  get histogram(){
    if(!(this._histogram)){
      const nbins = this.nbins;
      const step = (this.minmax[1] - this.minmax[0]) / this.nbins;
      const min = this.minmax[0]
      const parent =this;
     
      const scale = this.getScale(this.yscaleinfo);
      scale.domain([0,nbins])
                  .rangeRound([min,this.minmax[1]]);
     
      const range = d3.range(nbins).map(function(d){return scale(d);});
      // const range = d3.range(nbins).map(function(d){return parent.yscale(d * step + min);});
      console.log(range)
      // console.log(d3.thresholdScott(this.data, min, this.minmax[1])); 
      this._histogram = d3.histogram()
          .domain(this.yscale.domain())
          .thresholds(range);
    }
    return this._histogram;    
  },
  get nbins(){if(!(this._nbins))this._nbins=20;return this._nbins;},
  set nbins(value){this._nbins=value;this.update();},
  get bins(){
    if(!(this._bins)){
      this._bins = this.histogram(this.data);
    }
    return this._bins;},
  drawChart:function(){
    const parent = this;
    const {xscale,yscale,g,bins,height} = this;
   
    const barwidth = yscale(bins[0].x0) - yscale(bins[0].x1);
    const eventtransform = function(d,i){
        return "translate(0,{0})".format(height-parent.yscale(bins[i].x0));
      };
    
     const color = this.color();
     const colorscale = d3.scaleLinear()
                          .domain(this.minmax)                         
                          .range(color.colors);
    const eventcolor = function(d,i){
        if(i===0)return colorscale(bins[i].x0)
        if(i===bins.length-1)return colorscale(bins[i].x1)
        return colorscale((bins[i].x0+bins[i].x1)*0.5);        
      };       
    const eventheight = function(d){ return parent.xscale(d.length);};
    const textposy = function(d,i) {
      const value = (parent.yscale(bins[i].x1) +parent.yscale(bins[i].x0))*0.5+4;
      return "translate(0,{0})".format(height-value);
      };
    const textposx = function(d) {return Math.max(10,parent.xscale(d.length)-2);};
    const formatCount = d3.format(",.0f");
    const bar = g.selectAll(".bar")  
                 .remove()
                 .exit()
                 .data(bins)
                 .enter()
                 .append("g");
   
    bar.attr("class", "bar")
       .append("rect") 
       .attr("y",1)     
       .attr("transform", eventtransform)  
       .attr("height", Math.max(0,barwidth))
       .transition()
       .duration(300)                  
       .attr("width", Math.max(0,eventheight))
       .attr("fill", eventcolor)
       .attr("stroke-width","1")
       .attr("stroke","#ccc");
    bar.append("text")
       .attr("class", "label")
       .attr("transform", textposy)
       .attr("x", 10)
       .transition()
       .duration(300)         
       .attr("x", textposx)
       .attr("text-anchor", "end")
       .text(function(d) { return formatCount(d.length); });
       
    
    
  },
  drawAxis:function(){
    const {xscale,yscale,g,height} = this;
    g.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0,{0})".format(height))
        .call(d3.axisBottom(xscale));
    g.append("g")
        .attr("class", "yaxis")
        .call(d3.axisLeft(yscale));  
  },
  updateAxis:function(){
    this.g.select('.xaxis')
          .transition()
          .duration(750)
		      .call(d3.axisBottom(this.xscale))
    this.g.select('.yaxis')
          .transition()
          .duration(750)
		      .call(d3.axisLeft(this.yscale))
  },
}

let GOOGLECOLORS = [
  new Color("Red"),
  new Color("Pink"),
  new Color("Purple"),
  new Color("Deep Purple"),
  new Color("Indigo"),
  new Color("Blue"),
  new Color("Light Blue"),
  new Color("Cyan"),
  new Color("Teal"),
  new Color("Green"),
  new Color("Light Green"),
  new Color("Lime"),
  new Color("Yellow"),
  new Color("Amber"),
  new Color("Orange"),
  new Color("Deep Orange"),
  new Color("Brown"),
  new Color("Grey"),
  new Color("Blue Grey")
];
let shades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",    
  "600",
  "700",
  "800",
  "900"
];
let UICOLORS = [];
for (let i = 0, n = GOOGLECOLORS.length; i < n; i++) {
  const color = GOOGLECOLORS[i];
  for (let j = 0, m = shades.length; j < m; j++) {
    const shade = shades[j];
    UICOLORS.push(new Color(color._name, shade));
  }
}

GOOGLECOLORS.unshift(new Color("Clear"));

function Styler(layerF) {
  this.layerF = layerF;
  this.gradient = UIGRADIENT;
  this.color = UICOLORS;
  this.selectedColor = this.layer.style;
  this.construct();
}  
Styler.prototype = {
  construct:function(){
    this.gradient = UIGRADIENT;
    this.color = UICOLORS;
    this.showing =false;
    this.classifiedColors();
    this.show();
    
  },
  get layer(){return this.layerF();},
  get list() {if (!this._list) this._list = this.rawlist[this.type];return this._list;},
  get type() {if (!this._type) this._type = "gradient";return this._type;},
  set type(value) {this._type = value;this._list = null;this.resetColorButtons();},
  get selectedColor(){
    if (!this._selectedColor)
      this.selectedColor = this[this.type][0];   
    return this._selectedColor;},
  set selectedColor(value){    
    this._selectedColor=value;
    this.layer.style=value;
    if(this.showing){
      $(".selectcolorbutton").css("background","linear-gradient({0})".format(this._selectedColor.colors));   
      this.chart.update();
    }
  },
  get chart(){    
    const parent=this;
    if (!this._chart){      
      let data;
      
      this._chart = new Chart("svg",function(){return parent.layer.layer.slfgl},"slf",function(){return parent.selectedColor;});
    }
    return this._chart;    
  },
  rawlist: {
    gradient: [
      {
        group: "Clear",
        color:
          "repeating-linear-gradient(-45deg,white,red 2px,white 2px,white 4px)"
      },
      { group: "Reds", color: "#cb2d3e" },
      { group: "Oranges", color: "#d76b26" },
      { group: "Yellows", color: "#ffd200" },
      { group: "Greens", color: "#159957" },
      { group: "Cyans", color: "#1cb5e0" },
      { group: "Blues", color: "#155799" },
      { group: "Magentas", color: "#ef32d9" },
      { group: "Whites", color: "#eaeaea" },
      { group: "Grays", color: "#c0c0cb" },
      { group: "Blacks", color: "#333333" }
    ],
    color: GOOGLECOLORS
  },
  change:function(){
    
  },
  show: function() {
    this.createHeader();
    this.createGraph();
    this.createBody();
    this.eventChecked();
    this.eventGroupButtonss();
    this.createBinSlider();
    this.createScaleSlider(); 
    this.eventGroupButtons();
    this.showing =true;
    $(".selectcolorbutton").css("background","linear-gradient({0})".format(this.selectedColor.colors));
  },
  hide: function() {
    this._chart = null;
    this.showing =false;
  },
  eventGroupButtonss: function() {
    const parent = this;
    const event = function(e) {
      const type = $(this).attr("type");
      let top;
      let left;
      if(type==="color") {
        top = "0px";
        left="60px";
      } else if(type==="scale") {
        top = "-200px";
        left="60px";
      } else if(type==="other"){
        top = "-400px";  
        left = "120px"
      }      
      $("#colorcontainer").css({ "margin-top": top });
       $(".graph").css({ "padding-left": left });
    }; 
    $(".header .btn").click(event);
  },  
  eventGroupButtons: function() {
    const parent = this;
    const event = function(e) {
      const type = $(this).attr("type");
      parent.type = type;
    };    
    
    $(".switchbuttons .btn").click(event);
  },  
  eventChecked: function() {
    $("#option").click(function() {
      let margin = $("#option").is(":checked") ? "0px":"-100%";
      $(".colordetail").css({ "left": margin });
    });
  },


  eventColorButton: function() {
    const parent = this;
    const type = this.type;
    const event = function(e) {
      const name = $(this).attr("name");
      $(".colorgroup .btn").removeClass("active");
      $(this).addClass("active");
      const items = (name !== "Clear") ? parent.filterPalettes(type, name) : parent[type];
      parent.createPanelDivs(items);
    };
    $(".colorgroup .btn").click(event);
  },
  eventPanelButton: function() {
    const parent = this;
    const type = this.type;
    const event = function(e) {
      const name = $(this).attr("name").toLowerCase();
      const item = parent[type].filter(item => item.name.toLowerCase().includes(name))[0];
      parent.selectedColor = item;      
    };
    $(".colorpanel").click(event);
  },

  eventSearch: function() {
    const parent = this;
    const type = this.type;

    const searchF = function() {
      $(".colorgroup .btn").removeClass("active");
      const value = $("#searchcolor").val().toLowerCase();
      const items = parent[type].filter(item => item.name.toLowerCase().includes(value));
      parent.createPanelDivs(items);
    };
    $("#searchcolorb").click(searchF);
    $("#searchcolor").change(searchF);
    $("#searchcolor").keyup(searchF);
  },
  filterPalettes(type, color) {
    if (type === "gradient")return this[type].filter(item => item.palletes.includes(color));
    return this[type].filter(item => color === item._name);
  },
  classifiedColors() {
    const type = this.type;
    this[type].forEach(item => {
      const tags = [];
      item.colors.forEach(color => tags.push(colorDetector(color)));
      item.palletes = tags;
      item.font = tags.includes("Blacks") ? "white" : "black";
    });
  },
  createHeader:function(){
    $(".parentcontainer").append(this.divHeader());
  },
  createGraph:function(){
     $(".parentcontainer").append(this.divGraph());
  },
  createBody:function(){
     $(".parentcontainer").append(this.divBody());
     $(".childcontainer").append(this.divColorBand());
     $(".childcontainer").append(this.divColorContainer());
     this.resetColorButtons();
  },
  resetColorButtons:function(){
     this.createColorButtons();
     this.createSearchButton();
  },
  createPanelDivs: function(items) {
    $(".colorpanels").empty();
    for (let j = 0, m = items.length; j < m; j++) {
      $(".colorpanels").append(this.divPanel(items[j]));
    }
    this.eventPanelButton();
  },
  createSearchButton:function(){
    $("#colorsearchcontainer").empty();
    $("#colorsearchcontainer").append(this.divColorSearch());
    this.eventSearch();
  },
  createColorButtons: function() {
    const colors = this.list.map(group => this.divColorButton(group), this);
    $(".colorgroup .btn-group-justified").empty();
    $(".colorgroup .btn-group-justified").append(colors);
    this.eventColorButton();
  },
  createBinSlider: function() {
    const parent = this;
    const id =  "ext4";
    $(".childcontainer").append(this.divSlider(id));
    $("#{0}".format(id)).slider({
        min: 1,
        max: 20,
        step: 1,
        value: this.chart.nbins,
        tooltip: 'hide',
        orientation: 'vertical',
        reversed : false,
    });    
    const event = function(slideEvt){      
        parent.chart.nbins = slideEvt.value.newValue;      
    };    
    $("#{0}".format(id)).on("change", event);   
  },
  createScaleSlider: function() {
    const parent = this;
    const id =  "ext5";
    $(".childcontainer").append(this.divSlider(id));
    const text =  ['Linear', 'Power', 'Log']
    $("#{0}".format(id)).slider({  
      reversed : false,
      ticks: [0, 1, 2],
      value: 0,
      // ticks_tooltip: true,
      formatter: function(value) {
    		return text[value];
    	},
      orientation: 'vertical',
    });
    const event = function(slideEvt){
        const type = text[slideEvt.value.newValue].toLowerCase();
        parent.chart.yscaleinfo = {type:type,value:[0.5]};      
    };
    $("#{0}".format(id)).on("change", event); 
  },
  divGraph:function(){
    return `<div class="graph">
             <svg width="350" height="200"></svg>
            </div>            
           `;
  },
  divHeader:function(){
    return `<div class="header">
             <div class="btn-group btn-group-justified" role="group" aria-label="...">
              <div class="btn-group" role="group">
               <button type="color" class="btn btn-default">
                <i class="glyphicon glyphicon-search"></i>    
               </button>
              </div>
              <div class="btn-group" role="group">
               <button type="scale" class="btn btn-default">
                <i class="glyphicon glyphicon-search"></i>    
               </button>
              </div>
              <div class="btn-group" role="group">
               <button type="other" class="btn btn-default">
                <i class="glyphicon glyphicon-search"></i>    
               </button>
              </div>
             </div>
            </div>
           `
  },
  divBody:function(){
    return `  <div id="colorcontainer" class="childcontainer"></div>`;
  },
  divColorBand:function(){
    return `<div class="selectcolorcontainer">
              <input type="checkbox" id="option"></input>
              <label class="selectcolorbutton btn btn-primary" for="option"></label>
            </div>
           `
  },
  divColorContainer:function(){
    return `<div class="colordetail">
             <div class="row">
              <div class="col-xs-6">
               <div class="btn-group switchbuttons">
                <button type="gradient" class="btn btn-default">
                 <i class="glyphicon glyphicon-search"></i>    
                </button>
                <button type="color" class="btn btn-default">
                 <i class="glyphicon glyphicon-search"></i>    
                </button>
                <button id="searchcolorb" class="btn btn-default">
                 <i class="glyphicon glyphicon-search"></i>    
                </button>
               </div>
              </div>
              <div id="colorsearchcontainer" class="col-xs-6"></div>
             </div>
             <div class="colorgroup">
              <div class="btn-group btn-group-justified" role="group">
              </div>
             </div>
             <div class="colorpanels">
             </div>
            </div>
           `
  },
  divColorSearch:function(){
    return `<div class="navbar-form" role="search">
             <div class="input-group">
              <input id="searchcolor" type="text" class="form-control" placeholder="Search" data-provide="typeahead" autocomplete="off">
              <div class="input-group-btn">
               <button id="searchcolorb" class="btn btn-default">
                <i class="glyphicon glyphicon-search"></i>    
               </button>
              </div>
             </div>
           </div>
           `;
  },
  divColorButton: function(item) {
    return `<div class="btn-group" role="group">
              <button type="button" name="{0}" class="btn">
                <div class="colorbtn" style="background:{1}"/>
              </button>
            </div>
           `.format(item.group, item.color);
  },
  divSlider:function(id){
    return `<div class="clearfix"></div>
            <div class="selectcolorcontainer">
              <div class="sliderContainer">
               <input id="{0}" type="text"/> 
              </div>
            </div>
           `.format(id);
  },
  divPanel:function(item){
    let name = item.name,
      colors = item.colors,
      font = item.font;
  return `<div class="colorpanel" name="{0}" style="color:{2};background:linear-gradient({1});">
            <div class="spancontainer"><span>{0}</span></div>
          </div>
         `.format(name, colors, font);  
  },
};



/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
}

function hexToRgb(hex) {
  if (hex.charAt && hex.charAt(0) === "#") {
    hex = removeHash(hex);
  }

  if (hex.length === 3) {
    hex = expand(hex);
  }

  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return [r, g, b];
}

function removeHash(hex) {
  var arr = hex.split("");
  arr.shift();
  return arr.join("");
}

function expand(hex) {
  return hex
    .split("")
    .reduce(function(accum, value) {
      return accum.concat([value, value]);
    }, [])
    .join("");
}
function hexToHsl(hex) {
  var hsl = rgbToHsl.apply(rgbToHsl, hexToRgb(hex));
  return [
    Math.round(hsl[0] * 255),
    parseInt(hsl[1] * 100, 10),
    parseInt(hsl[2] * 100, 10)
  ];
}
function colorDetector(hexColor) {
  const [hue, sat, lgt] = hexToHsl(hexColor);

  if (lgt / 100 < 0.2) return "Blacks";
  if (lgt / 100 > 0.85) return "Whites";

  if (sat / 100 < 0.2) return "Grays";

  if (hue < 30) return "Reds";
  if (hue < 60) return "Oranges";
  if (hue < 90) return "Yellows";
  if (hue < 150) return "Greens";
  if (hue < 210) return "Cyans";
  if (hue < 270) return "Blues";
  if (hue < 330) return "Magentas";

  return "Reds";
}

// String formatter
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != "undefined" ? args[number] : match;
    });
  };
}

const UIGRADIENT = [
  {
    name: "Mango",
    colors: ["#ffe259", "#ffa751"]
  },
  {
    name: "Windy",
    colors: ["#acb6e5", "#86fde8"]
  },
  {
    name: "Royal Blue",
    colors: ["#536976", "#292E49"]
  },
  {
    name: "Royal Blue + Petrol",
    colors: ["#BBD2C5", "#536976", "#292E49"]
  },
  {
    name: "Copper",
    colors: ["#B79891", "#94716B"]
  },
  {
    name: "Petrol",
    colors: ["#BBD2C5", "#536976"]
  },
  {
    name: "Sky",
    colors: ["#076585", "#fff"]
  },
  {
    name: "Sel",
    colors: ["#00467F", "#A5CC82"]
  },
  {
    name: "Skyline",
    colors: ["#1488CC", "#2B32B2"]
  },
  {
    name: "DIMIGO",
    colors: ["#ec008c", "#fc6767"]
  },
  {
    name: "Purple Love",
    colors: ["#cc2b5e", "#753a88"]
  },
  {
    name: "Sexy Blue",
    colors: ["#2193b0", "#6dd5ed"]
  },
  {
    name: "Blooker20",
    colors: ["#e65c00", "#F9D423"]
  },
  {
    name: "Sea Blue",
    colors: ["#2b5876", "#4e4376"]
  },
  {
    name: "Nimvelo",
    colors: ["#314755", "#26a0da"]
  },
  {
    name: "Hazel",
    colors: ["#77A1D3", "#79CBCA", "#E684AE"]
  },
  {
    name: "Noon to Dusk",
    colors: ["#ff6e7f", "#bfe9ff"]
  },
  {
    name: "YouTube",
    colors: ["#e52d27", "#b31217"]
  },
  {
    name: "Cool Brown",
    colors: ["#603813", "#b29f94"]
  },
  {
    name: "Harmonic Energy",
    colors: ["#16A085", "#F4D03F"]
  },
  {
    name: "Playing with Reds",
    colors: ["#D31027", "#EA384D"]
  },
  {
    name: "Sunny Days",
    colors: ["#EDE574", "#E1F5C4"]
  },
  {
    name: "Green Beach",
    colors: ["#02AAB0", "#00CDAC"]
  },
  {
    name: "Intuitive Purple",
    colors: ["#DA22FF", "#9733EE"]
  },
  {
    name: "Emerald Water",
    colors: ["#348F50", "#56B4D3"]
  },
  {
    name: "Lemon Twist",
    colors: ["#3CA55C", "#B5AC49"]
  },
  {
    name: "Monte Carlo",
    colors: ["#CC95C0", "#DBD4B4", "#7AA1D2"]
  },
  {
    name: "Horizon",
    colors: ["#003973", "#E5E5BE"]
  },
  {
    name: "Rose Water",
    colors: ["#E55D87", "#5FC3E4"]
  },
  {
    name: "Frozen",
    colors: ["#403B4A", "#E7E9BB"]
  },
  {
    name: "Mango Pulp",
    colors: ["#F09819", "#EDDE5D"]
  },
  {
    name: "Bloody Mary",
    colors: ["#FF512F", "#DD2476"]
  },
  {
    name: "Aubergine",
    colors: ["#AA076B", "#61045F"]
  },
  {
    name: "Aqua Marine",
    colors: ["#1A2980", "#26D0CE"]
  },
  {
    name: "Sunrise",
    colors: ["#FF512F", "#F09819"]
  },
  {
    name: "Purple Paradise",
    colors: ["#1D2B64", "#F8CDDA"]
  },
  {
    name: "Stripe",
    colors: ["#1FA2FF", "#12D8FA", "#A6FFCB"]
  },
  {
    name: "Sea Weed",
    colors: ["#4CB8C4", "#3CD3AD"]
  },
  {
    name: "Pinky",
    colors: ["#DD5E89", "#F7BB97"]
  },
  {
    name: "Cherry",
    colors: ["#EB3349", "#F45C43"]
  },
  {
    name: "Mojito",
    colors: ["#1D976C", "#93F9B9"]
  },
  {
    name: "Juicy Orange",
    colors: ["#FF8008", "#FFC837"]
  },
  {
    name: "Mirage",
    colors: ["#16222A", "#3A6073"]
  },
  {
    name: "Steel Gray",
    colors: ["#1F1C2C", "#928DAB"]
  },
  {
    name: "Kashmir",
    colors: ["#614385", "#516395"]
  },
  {
    name: "Electric Violet",
    colors: ["#4776E6", "#8E54E9"]
  },
  {
    name: "Venice Blue",
    colors: ["#085078", "#85D8CE"]
  },
  {
    name: "Bora Bora",
    colors: ["#2BC0E4", "#EAECC6"]
  },
  {
    name: "Moss",
    colors: ["#134E5E", "#71B280"]
  },
  {
    name: "Shroom Haze",
    colors: ["#5C258D", "#4389A2"]
  },
  {
    name: "Mystic",
    colors: ["#757F9A", "#D7DDE8"]
  },
  {
    name: "Midnight City",
    colors: ["#232526", "#414345"]
  },
  {
    name: "Sea Blizz",
    colors: ["#1CD8D2", "#93EDC7"]
  },
  {
    name: "Opa",
    colors: ["#3D7EAA", "#FFE47A"]
  },
  {
    name: "Titanium",
    colors: ["#283048", "#859398"]
  },
  {
    name: "Mantle",
    colors: ["#24C6DC", "#514A9D"]
  },
  {
    name: "Dracula",
    colors: ["#DC2424", "#4A569D"]
  },
  {
    name: "Peach",
    colors: ["#ED4264", "#FFEDBC"]
  },
  {
    name: "Moonrise",
    colors: ["#DAE2F8", "#D6A4A4"]
  },
  {
    name: "Clouds",
    colors: ["#ECE9E6", "#FFFFFF"]
  },
  {
    name: "Stellar",
    colors: ["#7474BF", "#348AC7"]
  },
  {
    name: "Bourbon",
    colors: ["#EC6F66", "#F3A183"]
  },
  {
    name: "Calm Darya",
    colors: ["#5f2c82", "#49a09d"]
  },
  {
    name: "Influenza",
    colors: ["#C04848", "#480048"]
  },
  {
    name: "Shrimpy",
    colors: ["#e43a15", "#e65245"]
  },
  {
    name: "Army",
    colors: ["#414d0b", "#727a17"]
  },
  {
    name: "Miaka",
    colors: ["#FC354C", "#0ABFBC"]
  },
  {
    name: "Pinot Noir",
    colors: ["#4b6cb7", "#182848"]
  },
  {
    name: "Day Tripper",
    colors: ["#f857a6", "#ff5858"]
  },
  {
    name: "Namn",
    colors: ["#a73737", "#7a2828"]
  },
  {
    name: "Blurry Beach",
    colors: ["#d53369", "#cbad6d"]
  },
  {
    name: "Vasily",
    colors: ["#e9d362", "#333333"]
  },
  {
    name: "A Lost Memory",
    colors: ["#DE6262", "#FFB88C"]
  },
  {
    name: "Petrichor",
    colors: ["#666600", "#999966"]
  },
  {
    name: "Jonquil",
    colors: ["#FFEEEE", "#DDEFBB"]
  },
  {
    name: "Sirius Tamed",
    colors: ["#EFEFBB", "#D4D3DD"]
  },
  {
    name: "Kyoto",
    colors: ["#c21500", "#ffc500"]
  },
  {
    name: "Misty Meadow",
    colors: ["#215f00", "#e4e4d9"]
  },
  {
    name: "Aqualicious",
    colors: ["#50C9C3", "#96DEDA"]
  },
  {
    name: "Moor",
    colors: ["#616161", "#9bc5c3"]
  },
  {
    name: "Almost",
    colors: ["#ddd6f3", "#faaca8"]
  },
  {
    name: "Forever Lost",
    colors: ["#5D4157", "#A8CABA"]
  },
  {
    name: "Winter",
    colors: ["#E6DADA", "#274046"]
  },
  {
    name: "Autumn",
    colors: ["#DAD299", "#B0DAB9"]
  },
  {
    name: "Candy",
    colors: ["#D3959B", "#BFE6BA"]
  },
  {
    name: "Reef",
    colors: ["#00d2ff", "#3a7bd5"]
  },
  {
    name: "The Strain",
    colors: ["#870000", "#190A05"]
  },
  {
    name: "Dirty Fog",
    colors: ["#B993D6", "#8CA6DB"]
  },
  {
    name: "Earthly",
    colors: ["#649173", "#DBD5A4"]
  },
  {
    name: "Virgin",
    colors: ["#C9FFBF", "#FFAFBD"]
  },
  {
    name: "Ash",
    colors: ["#606c88", "#3f4c6b"]
  },
  {
    name: "Shadow Night",
    colors: ["#000000", "#53346D"]
  },
  {
    name: "Cherryblossoms",
    colors: ["#FBD3E9", "#BB377D"]
  },
  {
    name: "Parklife",
    colors: ["#ADD100", "#7B920A"]
  },
  {
    name: "Dance To Forget",
    colors: ["#FF4E50", "#F9D423"]
  },
  {
    name: "Starfall",
    colors: ["#F0C27B", "#4B1248"]
  },
  {
    name: "Red Mist",
    colors: ["#000000", "#e74c3c"]
  },
  {
    name: "Teal Love",
    colors: ["#AAFFA9", "#11FFBD"]
  },
  {
    name: "Neon Life",
    colors: ["#B3FFAB", "#12FFF7"]
  },
  {
    name: "Man of Steel",
    colors: ["#780206", "#061161"]
  },
  {
    name: "Amethyst",
    colors: ["#9D50BB", "#6E48AA"]
  },
  {
    name: "Cheer Up Emo Kid",
    colors: ["#556270", "#FF6B6B"]
  },
  {
    name: "Shore",
    colors: ["#70e1f5", "#ffd194"]
  },
  {
    name: "Facebook Messenger",
    colors: ["#00c6ff", "#0072ff"]
  },
  {
    name: "SoundCloud",
    colors: ["#fe8c00", "#f83600"]
  },
  {
    name: "Behongo",
    colors: ["#52c234", "#061700"]
  },
  {
    name: "ServQuick",
    colors: ["#485563", "#29323c"]
  },
  {
    name: "Friday",
    colors: ["#83a4d4", "#b6fbff"]
  },
  {
    name: "Martini",
    colors: ["#FDFC47", "#24FE41"]
  },
  {
    name: "Metallic Toad",
    colors: ["#abbaab", "#ffffff"]
  },
  {
    name: "Between The Clouds",
    colors: ["#73C8A9", "#373B44"]
  },
  {
    name: "Crazy Orange I",
    colors: ["#D38312", "#A83279"]
  },
  {
    name: "Hersheys",
    colors: ["#1e130c", "#9a8478"]
  },
  {
    name: "Talking To Mice Elf",
    colors: ["#948E99", "#2E1437"]
  },
  {
    name: "Purple Bliss",
    colors: ["#360033", "#0b8793"]
  },
  {
    name: "Predawn",
    colors: ["#FFA17F", "#00223E"]
  },
  {
    name: "Endless River",
    colors: ["#43cea2", "#185a9d"]
  },
  {
    name: "Pastel Orange at the Sun",
    colors: ["#ffb347", "#ffcc33"]
  },
  {
    name: "Twitch",
    colors: ["#6441A5", "#2a0845"]
  },
  {
    name: "Atlas",
    colors: ["#FEAC5E", "#C779D0", "#4BC0C8"]
  },
  {
    name: "Instagram",
    colors: ["#833ab4", "#fd1d1d", "#fcb045"]
  },
  {
    name: "Flickr",
    colors: ["#ff0084", "#33001b"]
  },
  {
    name: "Vine",
    colors: ["#00bf8f", "#001510"]
  },
  {
    name: "Turquoise flow",
    colors: ["#136a8a", "#267871"]
  },
  {
    name: "Portrait",
    colors: ["#8e9eab", "#eef2f3"]
  },
  {
    name: "Virgin America",
    colors: ["#7b4397", "#dc2430"]
  },
  {
    name: "Koko Caramel",
    colors: ["#D1913C", "#FFD194"]
  },
  {
    name: "Fresh Turboscent",
    colors: ["#F1F2B5", "#135058"]
  },
  {
    name: "Green to dark",
    colors: ["#6A9113", "#141517"]
  },
  {
    name: "Ukraine",
    colors: ["#004FF9", "#FFF94C"]
  },
  {
    name: "Curiosity blue",
    colors: ["#525252", "#3d72b4"]
  },
  {
    name: "Dark Knight",
    colors: ["#BA8B02", "#181818"]
  },
  {
    name: "Piglet",
    colors: ["#ee9ca7", "#ffdde1"]
  },
  {
    name: "Lizard",
    colors: ["#304352", "#d7d2cc"]
  },
  {
    name: "Sage Persuasion",
    colors: ["#CCCCB2", "#757519"]
  },
  {
    name: "Between Night and Day",
    colors: ["#2c3e50", "#3498db"]
  },
  {
    name: "Timber",
    colors: ["#fc00ff", "#00dbde"]
  },
  {
    name: "Passion",
    colors: ["#e53935", "#e35d5b"]
  },
  {
    name: "Clear Sky",
    colors: ["#005C97", "#363795"]
  },
  {
    name: "Master Card",
    colors: ["#f46b45", "#eea849"]
  },
  {
    name: "Back To Earth",
    colors: ["#00C9FF", "#92FE9D"]
  },
  {
    name: "Deep Purple",
    colors: ["#673AB7", "#512DA8"]
  },
  {
    name: "Little Leaf",
    colors: ["#76b852", "#8DC26F"]
  },
  {
    name: "Netflix",
    colors: ["#8E0E00", "#1F1C18"]
  },
  {
    name: "Light Orange",
    colors: ["#FFB75E", "#ED8F03"]
  },
  {
    name: "Green and Blue",
    colors: ["#c2e59c", "#64b3f4"]
  },
  {
    name: "Poncho",
    colors: ["#403A3E", "#BE5869"]
  },
  {
    name: "Back to the Future",
    colors: ["#C02425", "#F0CB35"]
  },
  {
    name: "Blush",
    colors: ["#B24592", "#F15F79"]
  },
  {
    name: "Inbox",
    colors: ["#457fca", "#5691c8"]
  },
  {
    name: "Purplin",
    colors: ["#6a3093", "#a044ff"]
  },
  {
    name: "Pale Wood",
    colors: ["#eacda3", "#d6ae7b"]
  },
  {
    name: "Haikus",
    colors: ["#fd746c", "#ff9068"]
  },
  {
    name: "Pizelex",
    colors: ["#114357", "#F29492"]
  },
  {
    name: "Joomla",
    colors: ["#1e3c72", "#2a5298"]
  },
  {
    name: "Christmas",
    colors: ["#2F7336", "#AA3A38"]
  },
  {
    name: "Minnesota Vikings",
    colors: ["#5614B0", "#DBD65C"]
  },
  {
    name: "Miami Dolphins",
    colors: ["#4DA0B0", "#D39D38"]
  },
  {
    name: "Forest",
    colors: ["#5A3F37", "#2C7744"]
  },
  {
    name: "Nighthawk",
    colors: ["#2980b9", "#2c3e50"]
  },
  {
    name: "Superman",
    colors: ["#0099F7", "#F11712"]
  },
  {
    name: "Suzy",
    colors: ["#834d9b", "#d04ed6"]
  },
  {
    name: "Dark Skies",
    colors: ["#4B79A1", "#283E51"]
  },
  {
    name: "Deep Space",
    colors: ["#000000", "#434343"]
  },
  {
    name: "Decent",
    colors: ["#4CA1AF", "#C4E0E5"]
  },
  {
    name: "Colors Of Sky",
    colors: ["#E0EAFC", "#CFDEF3"]
  },
  {
    name: "Purple White",
    colors: ["#BA5370", "#F4E2D8"]
  },
  {
    name: "Ali",
    colors: ["#ff4b1f", "#1fddff"]
  },
  {
    name: "Alihossein",
    colors: ["#f7ff00", "#db36a4"]
  },
  {
    name: "Shahabi",
    colors: ["#a80077", "#66ff00"]
  },
  {
    name: "Red Ocean",
    colors: ["#1D4350", "#A43931"]
  },
  {
    name: "Tranquil",
    colors: ["#EECDA3", "#EF629F"]
  },
  {
    name: "Transfile",
    colors: ["#16BFFD", "#CB3066"]
  },

  {
    name: "Sylvia",
    colors: ["#ff4b1f", "#ff9068"]
  },
  {
    name: "Sweet Morning",
    colors: ["#FF5F6D", "#FFC371"]
  },
  {
    name: "Politics",
    colors: ["#2196f3", "#f44336"]
  },
  {
    name: "Bright Vault",
    colors: ["#00d2ff", "#928DAB"]
  },
  {
    name: "Solid Vault",
    colors: ["#3a7bd5", "#3a6073"]
  },
  {
    name: "Sunset",
    colors: ["#0B486B", "#F56217"]
  },
  {
    name: "Grapefruit Sunset",
    colors: ["#e96443", "#904e95"]
  },
  {
    name: "Deep Sea Space",
    colors: ["#2C3E50", "#4CA1AF"]
  },
  {
    name: "Dusk",
    colors: ["#2C3E50", "#FD746C"]
  },
  {
    name: "Minimal Red",
    colors: ["#F00000", "#DC281E"]
  },
  {
    name: "Royal",
    colors: ["#141E30", "#243B55"]
  },
  {
    name: "Mauve",
    colors: ["#42275a", "#734b6d"]
  },
  {
    name: "Frost",
    colors: ["#000428", "#004e92"]
  },
  {
    name: "Lush",
    colors: ["#56ab2f", "#a8e063"]
  },
  {
    name: "Firewatch",
    colors: ["#cb2d3e", "#ef473a"]
  },
  {
    name: "Sherbert",
    colors: ["#f79d00", "#64f38c"]
  },
  {
    name: "Blood Red",
    colors: ["#f85032", "#e73827"]
  },
  {
    name: "Sun on the Horizon",
    colors: ["#fceabb", "#f8b500"]
  },
  {
    name: "IIIT Delhi",
    colors: ["#808080", "#3fada8"]
  },
  {
    name: "Dusk",
    colors: ["#ffd89b", "#19547b"]
  },
  {
    name: "50 Shades of Grey",
    colors: ["#bdc3c7", "#2c3e50"]
  },
  {
    name: "Dania",
    colors: ["#BE93C5", "#7BC6CC"]
  },
  {
    name: "Limeade",
    colors: ["#A1FFCE", "#FAFFD1"]
  },
  {
    name: "Disco",
    colors: ["#4ECDC4", "#556270"]
  },
  {
    name: "Love Couple",
    colors: ["#3a6186", "#89253e"]
  },
  {
    name: "Azure Pop",
    colors: ["#ef32d9", "#89fffd"]
  },
  {
    name: "Nepal",
    colors: ["#de6161", "#2657eb"]
  },
  {
    name: "Cosmic Fusion",
    colors: ["#ff00cc", "#333399"]
  },
  {
    name: "Snapchat",
    colors: ["#fffc00", "#ffffff"]
  },
  {
    name: "Ed's Sunset Gradient",
    colors: ["#ff7e5f", "#feb47b"]
  },
  {
    name: "Brady Brady Fun Fun",
    colors: ["#00c3ff", "#ffff1c"]
  },
  {
    name: "Black Rosé",
    colors: ["#f4c4f3", "#fc67fa"]
  },
  {
    name: "80's Purple",
    colors: ["#41295a", "#2F0743"]
  },
  {
    name: "Radar",
    colors: ["#A770EF", "#CF8BF3", "#FDB99B"]
  },
  {
    name: "Ibiza Sunset",
    colors: ["#ee0979", "#ff6a00"]
  },
  {
    name: "Dawn",
    colors: ["#F3904F", "#3B4371"]
  },
  {
    name: "Mild",
    colors: ["#67B26F", "#4ca2cd"]
  },
  {
    name: "Vice City",
    colors: ["#3494E6", "#EC6EAD"]
  },
  {
    name: "Jaipur",
    colors: ["#DBE6F6", "#C5796D"]
  },
  {
    name: "Cocoaa Ice",
    colors: ["#c0c0aa", "#1cefff"]
  },
  {
    name: "EasyMed",
    colors: ["#DCE35B", "#45B649"]
  },
  {
    name: "Rose Colored Lenses",
    colors: ["#E8CBC0", "#636FA4"]
  },
  {
    name: "What lies Beyond",
    colors: ["#F0F2F0", "#000C40"]
  },
  {
    name: "Roseanna",
    colors: ["#FFAFBD", "#ffc3a0"]
  },
  {
    name: "Honey Dew",
    colors: ["#43C6AC", "#F8FFAE"]
  },
  {
    name: "Under the Lake",
    colors: ["#093028", "#237A57"]
  },
  {
    name: "The Blue Lagoon",
    colors: ["#43C6AC", "#191654"]
  },
  {
    name: "Can You Feel The Love Tonight",
    colors: ["#4568DC", "#B06AB3"]
  },
  {
    name: "Very Blue",
    colors: ["#0575E6", "#021B79"]
  },
  {
    name: "Love and Liberty",
    colors: ["#200122", "#6f0000"]
  },
  {
    name: "Orca",
    colors: ["#44A08D", "#093637"]
  },
  {
    name: "Venice",
    colors: ["#6190E8", "#A7BFE8"]
  },
  {
    name: "Pacific Dream",
    colors: ["#34e89e", "#0f3443"]
  },
  {
    name: "Learning and Leading",
    colors: ["#F7971E", "#FFD200"]
  },
  {
    name: "Celestial",
    colors: ["#C33764", "#1D2671"]
  },
  {
    name: "Purplepine",
    colors: ["#20002c", "#cbb4d4"]
  },
  {
    name: "Sha la la",
    colors: ["#D66D75", "#E29587"]
  },
  {
    name: "Mini",
    colors: ["#30E8BF", "#FF8235"]
  },
  {
    name: "Maldives",
    colors: ["#B2FEFA", "#0ED2F7"]
  },
  {
    name: "Cinnamint",
    colors: ["#4AC29A", "#BDFFF3"]
  },
  {
    name: "Html",
    colors: ["#E44D26", "#F16529"]
  },
  {
    name: "Coal",
    colors: ["#EB5757", "#000000"]
  },
  {
    name: "Sunkist",
    colors: ["#F2994A", "#F2C94C"]
  },
  {
    name: "Blue Skies",
    colors: ["#56CCF2", "#2F80ED"]
  },
  {
    name: "Chitty Chitty Bang Bang",
    colors: ["#007991", "#78ffd6"]
  },
  {
    name: "Visions of Grandeur",
    colors: ["#000046", "#1CB5E0"]
  },
  {
    name: "Crystal Clear",
    colors: ["#159957", "#155799"]
  },
  {
    name: "Mello",
    colors: ["#c0392b", "#8e44ad"]
  },
  {
    name: "Compare Now",
    colors: ["#EF3B36", "#FFFFFF"]
  },
  {
    name: "Meridian",
    colors: ["#283c86", "#45a247"]
  },
  {
    name: "Relay",
    colors: ["#3A1C71", "#D76D77", "#FFAF7B"]
  },
  {
    name: "Alive",
    colors: ["#CB356B", "#BD3F32"]
  },
  {
    name: "Scooter",
    colors: ["#36D1DC", "#5B86E5"]
  },
  {
    name: "Terminal",
    colors: ["#000000", "#0f9b0f"]
  },
  {
    name: "Telegram",
    colors: ["#1c92d2", "#f2fcfe"]
  },
  {
    name: "Crimson Tide",
    colors: ["#642B73", "#C6426E"]
  },
  {
    name: "Socialive",
    colors: ["#06beb6", "#48b1bf"]
  },
  {
    name: "Subu",
    colors: ["#0cebeb", "#20e3b2", "#29ffc6"]
  },
  {
    name: "Shift",
    colors: ["#000000", "#E5008D", "#FF070B"]
  },
  {
    name: "Clot",
    colors: ["#070000", "#4C0001", "#070000"]
  },
  {
    name: "Broken Hearts",
    colors: ["#d9a7c7", "#fffcdc"]
  },
  {
    name: "Kimoby Is The New Blue",
    colors: ["#396afc", "#2948ff"]
  },
  {
    name: "Dull",
    colors: ["#C9D6FF", "#E2E2E2"]
  },
  {
    name: "Purpink",
    colors: ["#7F00FF", "#E100FF"]
  },
  {
    name: "Orange Coral",
    colors: ["#ff9966", "#ff5e62"]
  },
  {
    name: "Summer",
    colors: ["#22c1c3", "#fdbb2d"]
  },
  {
    name: "King Yna",
    colors: ["#1a2a6c", "#b21f1f", "#fdbb2d"]
  },
  {
    name: "Velvet Sun",
    colors: ["#e1eec3", "#f05053"]
  },
  {
    name: "Zinc",
    colors: ["#ADA996", "#F2F2F2", "#DBDBDB", "#EAEAEA"]
  },
  {
    name: "Hydrogen",
    colors: ["#667db6", "#0082c8", "#0082c8", "#667db6"]
  },
  {
    name: "Argon",
    colors: ["#03001e", "#7303c0", "#ec38bc", "#fdeff9"]
  },
  {
    name: "Lithium",
    colors: ["#6D6027", "#D3CBB8"]
  },
  {
    name: "Digital Water",
    colors: ["#74ebd5", "#ACB6E5"]
  },
  {
    name: "Velvet Sun",
    colors: ["#e1eec3", "#f05053"]
  },
  {
    name: "Orange Fun",
    colors: ["#fc4a1a", "#f7b733"]
  },
  {
    name: "Rainbow Blue",
    colors: ["#00F260", "#0575E6"]
  },
  {
    name: "Pink Flavour",
    colors: ["#800080", "#ffc0cb"]
  },
  {
    name: "Sulphur",
    colors: ["#CAC531", "#F3F9A7"]
  },
  {
    name: "Selenium",
    colors: ["#3C3B3F", "#605C3C"]
  },
  {
    name: "Delicate",
    colors: ["#D3CCE3", "#E9E4F0"]
  },
  {
    name: "Ohhappiness",
    colors: ["#00b09b", "#96c93d"]
  },
  {
    name: "Lawrencium",
    colors: ["#0f0c29", "#302b63", "#24243e"]
  },
  {
    name: "Relaxing red",
    colors: ["#fffbd5", "#b20a2c"]
  },
  {
    name: "Taran Tado",
    colors: ["#23074d", "#cc5333"]
  },
  {
    name: "Bighead",
    colors: ["#c94b4b", "#4b134f"]
  },
  {
    name: "Sublime Vivid",
    colors: ["#FC466B", "#3F5EFB"]
  },
  {
    name: "Sublime Light",
    colors: ["#FC5C7D", "#6A82FB"]
  },
  {
    name: "Pun Yeta",
    colors: ["#108dc7", "#ef8e38"]
  },
  {
    name: "Quepal",
    colors: ["#11998e", "#38ef7d"]
  },
  {
    name: "Sand to Blue",
    colors: ["#3E5151", "#DECBA4"]
  },
  {
    name: "Wedding Day Blues",
    colors: ["#40E0D0", "#FF8C00", "#FF0080"]
  },
  {
    name: "Shifter",
    colors: ["#bc4e9c", "#f80759"]
  },
  {
    name: "Red Sunset",
    colors: ["#355C7D", "#6C5B7B", "#C06C84"]
  }
];
