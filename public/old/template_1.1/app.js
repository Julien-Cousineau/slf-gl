/*global $,slfgl,GUI*/
const IP = 'https://myworkspace-jcousineau.c9users.io:8080/';
mapboxgl.accessToken = 'pk.eyJ1Ijoic2ZlcmciLCJhIjoiY2l6OHF4eG85MDBwcTMybXB5dTY0MzlhNCJ9.Mt1hpCCddMlSvDiCtOQiUA';

function App(){
  this.ivar = 0;
  this.iframe = 0;
  
  this.initialised();
  this.gui = new GUI();
  // this.initialiseBars();
  // this.initialiseLeftIcons();
  // this.initialiseSliders();
  
}



App.prototype = {
  initialised:function(canvas,buffer,options){
    this.canvas = document.querySelector("#canvas");
    
    // this.onResizeWindow();
    // this.initialisedHandles();
    const parent = this;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [-126, 48],
      zoom: 4
    });
    let render = this.map.painter.render;
    this.map.on('load', function() {
        // parent.getSLF();
    });
    this.map.painter.render = function(style,option) {
      render.call(this,style,option);
      if(typeof parent.slfgl!=="undefined"){ 
        parent.slfgl.drawScene(parent.map.transform.worldSize,parent.map.transform.projMatrix);
        parent.map.painter.currentProgram = null;
      }
    };
    
    



  },
  initialiseBars:function(){
    const chevronEnter = function(e){$(this).css({"opacity":0.9});};
    const chevronLeave = function(e){$(this).css({"opacity":0.5});};
    const bannerHeight = '-100px';
    const barWidth = '-150px';
    
    
    const bars = this.bars = [
      new SideBar("headerBar",'0px',bannerHeight,'top'),
      new SideBar("leftBar",'0px',barWidth,'left'),
    ];
    
    for(let i=0,n=bars.length;i<n;i++){
      const bar = bars[i];
      const id = '#{0}'.format(bar.id);
      const chevron = '#{0}Chevron'.format(bar.id);
      const chevronI = '#{0}ChevronI'.format(bar.id);
      $(chevron).mouseenter(chevronEnter);
      $(chevron).mouseleave(chevronLeave);
      $(chevron).on('click',function() {
        bar.active =(bar.active)?false:true;
        $(chevronI).toggleClass(bar.toggle);
        $(id).animate(bar.object, 500);
        if(bar.id =="headerBar"){
          const offset = (bar.active) ? '140px':'40px';
          $('#leftBarGroup').animate({top:offset}, 500);
        }
      });

    }
  },
  initialiseLeftIcons:function(){
    var g_leftIcons = [
      {placement:"right",active:false,id:"modellayer",title:"Model Layers",icon:"glyphicon-globe"},
      {placement:"right",active:false,id:"gislayers",title:"GIS Layers",icon:"glyphicon-tasks"},
    ];
    
    function divSideBarIcons(list){
      var div='<ul class="sidernav-list">';
      list.forEach(function(item) {
        div +='<li id="{2}" class="sidernav-list-item"><i class="glyphiconL glyphicon {1}"/>{0}</li>'.format(item['title'],item["icon"],item["id"]);
      });
      div +='</ul>';
      return div;
    }
    $("#leftBar").append(divSideBarIcons(g_leftIcons));
  },
  initialiseSliders:function(){
    const parent = this;
    console.log(this.slfgl.slf.VARNAMES);
    const items = this.slfgl.slf.VARNAMES;
    // var items =[ 'None','Variable1','Variable2','Variable3','Variable4','Variable5','Variable6','Variable7'];
    $('#myRange').attr('min', 0);
    $('#myRange').attr('max', items.length-1);
    $('#myRange').attr('value', 0);
    $('#myRange').attr('step', 1);
    
    var width = 50*items.length;
    $(".slider-wrapper").css('width',width + "px");
    for(let i=0,n=items.length;i<n;i++){
      const item = items[i];
      const w =  i  * (width/(n-1.0)-1)-7.5;
      $("#legend").append("<label style='position: absolute;transform-origin: 0px 0px;transform:rotate(-90deg) translate(13px," + w + "px);'>"+item+"</label>");
    }
    const changeVar =function(e) {
      const iframe = parent.iframe;
      const ivar = parent.ivar = $("#myRange").val();
      if(parent.slfgl !=='undefined'){
        parent.slfgl.updateFrame(iframe,ivar);
        parent.map._render();
      }
    };
    
    $("#myRange").on("input change",changeVar);
    
  },
  getSLF:function(data){
    const parent = this;
    // const requestParameters = {url:IP + "data/ripple.2D.100.slf",responseType:'arraybuffer'};
    const requestParameters = {url:IP + "data/mesh.1800.10.slf",responseType:'arraybuffer'};
    
    ajax(requestParameters,function(err,response){
      if(err){throw Error("WARNING: Issue with Selafin File")}
      const gl = parent.map.painter.gl;
      parent.slfgl = new slfgl(gl,response.data,{fromProj:'EPSG:3156',toProj:'EPSG:4326',keepbuffer:1,debug:0});
      parent.map._render();
      parent.initialiseSliders();
      $("body").append(html_alertGreen);
      // Instantiate a slider
      var mySlider = $("#ex1").bootstrapSlider();
      

      var updateFrame = function(e){
        if(parent.slfgl !=='undefined'){
          const iframe = parent.iframe = e.value;
          const ivar = parent.ivar;
          parent.slfgl.updateFrame(iframe,ivar);
          parent.map._render()
        }
      }
      
      var mySlider = $("#ex1Slider").slider();
     
      mySlider.slider('setAttribute','max', 9);
      mySlider.slider('setValue',0);
		  mySlider.on('slide', updateFrame)
    
    });

  },

  // onResizeWindow:function(){
  // const parent = this;
  // window.onresize = function() {
  //     parent.slfgl.changePView();
  //     // console.log('resize')
  //   };
  // },
  // initialisedHandles:function(){
  //   const parent = this;
  //   const handleMouseDown=function(event) {
  //         console.log("mousedown")
  //         parent.mouseDown = true;
  //         parent.lastMouseX = event.clientX;
  //         parent.lastMouseY = event.clientY;
  //       }
  //   const handleMouseUp=function(event) {
  //         parent.mouseDown = false;
  //       }
  //   const handleMouseMove=function(event) {
  //     if (!parent.mouseDown) return;
  //     var newX = event.clientX;
  //     var newY = event.clientY;
  
  //     var deltaX = newX - parent.lastMouseX;
  //     var deltaY = newY - parent.lastMouseY;
  //     parent.lastMouseX = newX
  //     parent.lastMouseY = newY;
  //     parent.slfgl.changeMView(deltaX,deltaY,0);
  //   };  
  //   const handleWheel=function(event) {+
  //   // console.log(event.deltaY*event.deltaFactor)
  //     parent.slfgl.changeMView(0,0,event.deltaY*event.deltaFactor);

  //   };  
  //   parent.canvas.onmousedown = handleMouseDown;
  //   document.onmousemove =handleMouseMove;
  //   document.onmouseup =handleMouseUp;
  //   document.mousewheel = handleWheel;
  //   $('#map').on('mousewheel',handleWheel);
    
    

    
  // },
  

         // let attribute ='';
        // let offset ='';
        // if(bars[i].position === 'top'){

        //   offset = (bars[i].active) ? '140px':'40px';
        //   $('#leftBarGroup').animate({top:offset}, 500);
        //   $(chevronI).toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
        // } else if(bars[i].position === 'bottom'){
        //   offset = (bars[i].active) ? '0px':'-100px';
        //   $(id).animate({marginBottom:offset}, 500);
        //   $(chevronI).toggleClass('glyphicon-chevron-up glyphicon-chevron-down');
        // } else if(bars[i].position === 'left'){
        //   offset = (bars[i].active) ? '0px':'-60px';
        //   $(id).animate({marginLeft:offset}, 500);
        //   $(chevronI).toggleClass('glyphicon-chevron-left glyphicon-chevron-right');
        // } else if(bars[i].position === 'right'){
        //   offset = (bars[i].active) ? '0px':'-100px';
        //   $(id).animate({marginRight:offset}, 500);
        //   $(chevronI).toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
        // } else{throw Error("Error in initialiseBars")}

        
        // let object = {};object[attribute] = offset;
        // $(id).animate(object, 500);

    
};





function ajax(requestParameters,callback){
  const xhr = this.makeRequest(requestParameters);
  if(requestParameters.responseType =='arraybuffer'){
      xhr.responseType = 'arraybuffer';    
  } else {
      xhr.setRequestHeader('Accept', 'application/json');    
  }
  
  xhr.onerror = function() {
      callback(new Error(xhr.statusText));
  };
  xhr.onload = function() {
      const response = xhr.response;
      if (response.byteLength === 0 && xhr.status === 200) {
          return callback(new Error('http status 200 returned without content.'));
      }
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
          let status = (xhr.status==204) ? true:null;
           callback(status, {
                  data: response,
                  cacheControl: xhr.getResponseHeader('Cache-Control'),
                  expires: xhr.getResponseHeader('Expires')
              });
      } else {
          callback(new Error(xhr.statusText));
      }
  };
  xhr.send();
  return xhr;
};

function makeRequest(requestParameters) {
    const xhr = new window.XMLHttpRequest();

    xhr.open('GET', requestParameters.url, true);
    for (const k in requestParameters.headers) {
        xhr.setRequestHeader(k, requestParameters.headers[k]);
    }
    xhr.withCredentials = requestParameters.credentials === 'include';
    return xhr;
};
var html_slider= '<input id="ex1" data-slider-id="ex1Slider" type="text" data-slider-min="0" data-slider-max="20" data-slider-step="1" data-slider-value="14"/>';
var html_alertGreen = '<div class="alert alert-success alert-dismissable filealert">  <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>  ' + html_slider +'</div>';


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
