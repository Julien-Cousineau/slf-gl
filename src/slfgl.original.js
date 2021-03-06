'use strict';

const slf = require('slf-js');
const glsl = require('glslify');
const glmatrix = require("gl-matrix");

const util = require('./util');

const meshvert = glsl.file('./shaders/mesh.vert.glsl');
const meshfrag = glsl.file('./shaders/mesh.frag.glsl');




/**
 * Create Selafin Object for WebGL - opentelemac.org
 * @param {Canvas} canvas - HTML canvas
 * @param {Buffer} buffer - Buffer containing binary information
 * @param {Object} options - Optional information
 * @returns {Object} SlfGL - a Selafin object for WebGL
 */
function SLFGL(gl,buffer, options){
  this.initialised(gl,buffer,options);
  // this.drawScene();
}

SLFGL.prototype = {
    options: {
    keepbuffer: 0,          // kepp buffer in memory
    debug: 0                // logging level (0, 1 or 2)
  },
  initialised:function(gl,buffer,options){
    // this.canvas = canvas;
    // const gl = this.gl = canvas.getContext("webgl");
    this.gl = gl;
    gl.getExtension('OES_element_index_uint');
    
    // Only continue if WebGL is available and working
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    this.slf = new slf(buffer,options);
    this.options = extend(Object.create(this.options), options);
    
    let debug = this.options.debug;
    
    if (debug) console.time('Initialised slfGL');
    this.meshProgram = util.createProgram(gl, meshvert, meshfrag);
    this.initialisedBuffer();
    // this.initialisedView();
    
    if (debug) console.timeEnd('Initialised slfGL');
  
  
  },
  initialisedBuffer:function(){
    const gl = this.gl;
    const slf = this.slf;
    const program = this.meshProgram;
    
    this.indices       = slf.getIndices();
    this.XYBuffer      = util.createArrayBuffer(gl, slf.TRIXY);
    // console.log(slf.getELEMENTFRAME())
    this.ColorBuffer   = util.createArrayBuffer(gl, slf.getELEMENTFRAME()); 
    this.ElementBuffer = util.createElementBuffer(gl,this.indices);
    this.colorTexture  = util.createTexture(this.gl, this.gl.LINEAR, getColorRamp(defaultRampColors), 32, 32);
    
  },
  initialisedView:function(){
    this.u_matrix = glmatrix.mat4.create();
    this.v_matrix = glmatrix.mat4.create();
    glmatrix.mat4.translate(this.v_matrix,this.v_matrix,[0,0,-10.0]);
    this.perspectiveview = {
      fieldOfView : 45 * Math.PI / 180,
      aspect : this.gl.canvas.clientWidth / this.gl.canvas.clientHeight,
      zNear : 0.01,
      zFar : 1000.0
    };
    this.changePView();
    this.changeMView(0,0,0);
  },
  changePView:function(perspectiveview){
    const gl = this.gl;
    const u_matrix = this.u_matrix;
    const canvas = this.gl.canvas;
    
    // Lookup the size the browser is displaying the canvas.
    canvas.width  = (canvas.width  != canvas.clientWidth) ? canvas.clientWidth:canvas.width;
    canvas.height = (canvas.height  != canvas.clientHeight) ? canvas.clientHeight:canvas.height;
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    const pv  = this.perspectiveview = extend(Object.create(this.perspectiveview), perspectiveview);
    pv.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    
    glmatrix.mat4.perspective(u_matrix,pv.fieldOfView,pv.aspect,pv.zNear,pv.zFar);
    
    // this.drawScene();
  },
  changeMView:function(x,y,z){
    const gl = this.gl;
    const u_matrix = this.u_matrix;
    const v_matrix = this.v_matrix;
    
    const vec3 = glmatrix.vec3.create();
    glmatrix.mat4.getTranslation(vec3, v_matrix);
    
    const u_matrixI = glmatrix.mat4.create();
    glmatrix.mat4.invert(u_matrixI,u_matrix);
    
    const maxz = 100.;
    const miz = 1.;
    const scaleZ = vec3[2];
    const scaleZI = -vec3[2];
    const newx = scaleZ * u_matrixI[0] * 2 * x / gl.canvas.clientWidth;
    const newy = scaleZ * u_matrixI[5] * 2 * y / gl.canvas.clientHeight;
    

    const factor = (Math.pow(scaleZI,2.)/(Math.pow(scaleZI,2.)+100.))/10.;
    z = z*factor;
    z = (scaleZ+z<-maxz) ? 0:z;
    z = (scaleZ+z>-miz) ? 0:z;
    
    glmatrix.mat4.translate(v_matrix,v_matrix,[-newx, newy, z]);
    // this.drawScene();
  },
  updateFrame:function(value){
    const gl = this.gl;
    const slf = this.slf;    
    // const program = this.meshProgram;
    
    this.ColorBuffer   = util.createArrayBuffer(gl, slf.getELEMENTFRAME(value)); 
    // util.bindArrayAttribute(gl, this.ColorBuffer, program.a_data, 1);
    // this.drawScene();
  },
  drawScene:function(worldSize,tileSize,projMatrix,pixelMatrixInverse,pixelMatrix,x,y){
    const gl = this.gl;
    const slf = this.slf;
    const program = this.meshProgram;
    // const u_matrix = this.u_matrix;
    // const v_matrix = this.v_matrix;
    const indices = this.indices;
    // console.log(u_matrix)
    // console.log(projMatrix)
    this.clearScence();
    // let temp = new Float32Array(projMatrix)
    // const v_matrix = glmatrix.mat4.create();
    // glmatrix.mat4.translate(v_matrix,v_matrix,[0,0,-10.0]);
    
    // const tempm = glmatrix.mat4.create();
    // // const vec3 = glmatrix.vec3.create([1,1,0]);
    // glmatrix.mat4.multiply(tempm,projMatrix,v_matrix)
    
    // const p = glmatrix.vec4.create();
    // glmatrix.vec4.transformMat4(p,[1,1,0,1],tempm)
    
    // console.log(p[0] / p[3], p[1] / p[3])
    // const coord0 = [0, 0, 0, 1];
    // const coord1 = [this.gl.canvas.clientWidth, this.gl.canvas.clientHeight, 1, 1];
    // glmatrix.vec4.transformMat4(coord0, coord0, pixelMatrix);
    // glmatrix.vec4.transformMat4(coord1, coord1, pixelMatrix);
    
    
    // const w0 = coord0[3];
    // const w1 = coord1[3];
    // const x0 = coord0[0] / w0;
    // const x1 = coord1[0] / w1;
    // const y0 = coord0[1] / w0;
    // const y1 = coord1[1] / w1;
    // const z0 = coord0[2] / w0;
    // const z1 = coord1[2] / w1;
    
    // console.log(x1,y1)
    // console.log(x,y)
    // const mm=new Float64Array(16);
    // glmatrix.mat4.invert(mm,projMatrix);
    // console.log(mm);
    
    // const ppp =[0,0,0,1];
    // glmatrix.vec4.transformMat4(ppp,ppp,mm)
    // console.log(ppp[0] / ppp[3], ppp[1] / ppp[3]);

    // lat/lng to location
    // const ll = [0, 0, 0, 1];
    // const lng = 1.0;
    // const lat = 1.0;
    // const xx = (180 + lng) * worldSize / 360;
    // const _yy = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    // const yy=  (180 -_yy) * worldSize / 360;
    
    // console.log(xx, yy);
    
    // console.log(x,y)
    // // location to pixel
    // const p = [x, y, 0, 1];
    // glmatrix.vec4.transformMat4(p, p, pixelMatrix);
    // console.log(p[0] / p[3], p[1] / p[3]);
    
    // // location to gl
    // const pp = [xx, yy, 0, 1];
    // glmatrix.vec4.transformMat4(pp, pp, projMatrix);
    // console.log(pp[0] / pp[3], pp[1] / pp[3]);
    
    
    // const pp =[p[0] / p[3],p[1] / p[3],0,1];
    // glmatrix.vec4.transformMat4(pp,pp,projMatrix)
    // console.log(pp[0] / pp[3], pp[1] / pp[3]);
    
    let u_matrix = new Float32Array(projMatrix)

    gl.useProgram(program.program);
    
    util.bindArrayAttribute(gl, this.XYBuffer, program.a_pos, 3);
    util.bindArrayAttribute(gl, this.ColorBuffer, program.a_data, 1);
    util.bindElementAttribute(gl, this.ElementBuffer);
    util.bindTexture(gl, this.colorTexture, 0);
    
    gl.uniform1i(program.u_color_ramp, 0);
    
    gl.uniform2fv(program.u_minmax,slf.minmax);
    gl.uniform1f(program.worldSize, worldSize);
    gl.uniformMatrix4fv(program.u_matrix,false, u_matrix);
    // gl.uniformMatrix4fv(program.v_matrix,false, v_matrix);
    
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);
  },
  clearScence:function(){
    const gl = this.gl;
    // gl.clearColor(1, 1, 1, 1);
    // gl.colorMask(false, false, false, true);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    // Turn off rendering to alpha
    // gl.colorMask(true, true, true, false);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Set clear color to black, fully opaque
    // gl.clearColor(1.0, 0.0, 0.0, 0.5);
    // gl.clearDepth(1.0);                 // Clear everything
    // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // gl.enable(gl.STENCIL_TEST);
    // gl.depthFunc(gl.LEQUAL);
    // gl.depthMask(false);
  },
  dummycolor:function(){
    const slf = this.slf;
    let n = slf.NELEM3*3*4;
    let dummy =new Float32Array(n);
    
    for(let i=0;i<n;i+=12){
      dummy[i]=1.0;
      dummy[i+1]=0.0;
      dummy[i+2]=0.0;
      dummy[i+3]=1.0;
      
      dummy[i+4]=0.0;
      dummy[i+5]=1.0;
      dummy[i+6]=0.0;
      dummy[i+7]=1.0;
      
      dummy[i+8]=0.0;
      dummy[i+9]=0.0;
      dummy[i+10]=1.0;
      dummy[i+11]=1.0;
    }
    return dummy;
  },


  
};

function getColorRamp(colors) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 1;

    const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
    for (const stop in colors) {
        gradient.addColorStop(+stop, colors[stop]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1);

    return new Uint8Array(ctx.getImageData(0, 0, 1024, 1).data);
}
const defaultRampColors = {
    0.0: '#3288bd',
    0.1: '#66c2a5',
    0.2: '#abdda4',
    0.3: '#e6f598',
    0.4: '#fee08b',
    0.5: '#fdae61',
    0.6: '#f46d43',
    1.0: '#d53e4f'
};

function extend(dest, src) {
    for (var i in src) dest[i] = src[i];
    return dest;
}

module.exports = SLFGL;