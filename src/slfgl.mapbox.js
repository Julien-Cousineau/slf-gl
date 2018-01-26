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
    if (debug) console.timeEnd('Initialised slfGL');
  
  
  },
  initialisedBuffer:function(){
    const gl = this.gl;
    const slf = this.slf;
    const program = this.meshProgram;
    
    this.indices       = slf.getIndices();
    this.XYBuffer      = util.createArrayBuffer(gl, slf.TRIXY);

    this.ColorBuffer   = util.createArrayBuffer(gl, slf.getELEMENTFRAME()); 
    this.ElementBuffer = util.createElementBuffer(gl,this.indices);
    this.colorTexture  = util.createTexture(this.gl, this.gl.LINEAR, getColorRamp(defaultRampColors), 32, 32);
    
  },
  updateFrame:function(value){
    const gl = this.gl;
    const slf = this.slf;    
    this.ColorBuffer   = util.createArrayBuffer(gl, slf.getELEMENTFRAME(value));
  },
  drawScene:function(worldSize,projMatrix){
    const gl = this.gl;
    const slf = this.slf;
    const program = this.meshProgram;
    const indices = this.indices;

    
    let u_matrix = new Float32Array(projMatrix);

    gl.useProgram(program.program);
    
    util.bindArrayAttribute(gl, this.XYBuffer, program.a_pos, 3);
    util.bindArrayAttribute(gl, this.ColorBuffer, program.a_data, 1);
    util.bindElementAttribute(gl, this.ElementBuffer);
    util.bindTexture(gl, this.colorTexture, 0);
    
    gl.uniform1i(program.u_color_ramp, 0);
    
    gl.uniform2fv(program.u_minmax,slf.minmax);
    gl.uniform1f(program.worldSize, worldSize);
    gl.uniformMatrix4fv(program.u_matrix,false, u_matrix);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);
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