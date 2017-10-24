/*global $,slfgl*/
const IP = 'https://myworkspace-jcousineau.c9users.io:8080/';

function App(){
  this.initialised();
}
App.prototype = {
  initialised:function(canvas,buffer,options){
    this.canvas = document.querySelector("#map");
    this.getSLF();
    this.onResizeWindow();
    this.initialisedHandles();
  },
  getSLF:function(data){
    const parent = this;
    const requestParameters = {url:IP + "data/ripple.2D.100.slf",responseType:'arraybuffer'};
    
    ajax(requestParameters,function(err,response){
      if(err){throw Error("WARNING: Issue with Selafin File")}
      parent.slfgl = new slfgl(parent.canvas,response.data,{keepbuffer:1,debug:0});
      $("body").append(html_alertGreen);
      // Instantiate a slider
      var mySlider = $("#ex1").bootstrapSlider();
      
      // Call a method on the slider
      // var mySlider = mySlider.bootstrapSlider('getValue');
      var updateFrame = function(e){
        parent.slfgl.updateFrame(e.value);
      }
      
      var mySlider = $("#ex1Slider").slider();
      mySlider.slider('setAttribute','max', 99);
      mySlider.slider('setValue',0);
		  mySlider.on('slide', updateFrame)
    
    });

  },

  onResizeWindow:function(){
  const parent = this;
  window.onresize = function() {
      parent.slfgl.changePView();
      // console.log('resize')
    };
  },
  initialisedHandles:function(){
    const parent = this;
    const handleMouseDown=function(event) {
          console.log("mousedown")
          parent.mouseDown = true;
          parent.lastMouseX = event.clientX;
          parent.lastMouseY = event.clientY;
        }
    const handleMouseUp=function(event) {
          parent.mouseDown = false;
        }
    const handleMouseMove=function(event) {
      if (!parent.mouseDown) return;
      var newX = event.clientX;
      var newY = event.clientY;
  
      var deltaX = newX - parent.lastMouseX;
      var deltaY = newY - parent.lastMouseY;
      parent.lastMouseX = newX
      parent.lastMouseY = newY;
      parent.slfgl.changeMView(deltaX,deltaY,0);
    };  
    const handleWheel=function(event) {+
    // console.log(event.deltaY*event.deltaFactor)
      parent.slfgl.changeMView(0,0,event.deltaY*event.deltaFactor);

    };  
    parent.canvas.onmousedown = handleMouseDown;
    document.onmousemove =handleMouseMove;
    document.onmouseup =handleMouseUp;
    document.mousewheel = handleWheel;
    $('#map').on('mousewheel',handleWheel);
    
    

    
  },
  

 

    
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