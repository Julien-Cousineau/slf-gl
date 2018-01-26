'use strict';

const slf = require('../../slf-js/src/slf.js');
const glsl = require('glslify');

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
    debug: 0,               // logging level (0, 1 or 2)
    programs:{points   :{active:false,vertexSource:glsl.file('./shaders/mesh.vert.point.glsl'),fragmentSource:glsl.file('./shaders/mesh.frag.point.glsl'),mode:'POINTS'},
              wireframe:{active:false,vertexSource:glsl.file('./shaders/mesh.vert.glsl'),fragmentSource:glsl.file('./shaders/mesh.frag.glsl'),mode:'LINES'},
              surface  :{active:true,vertexSource:glsl.file('./shaders/mesh.vert.glsl'),fragmentSource:glsl.file('./shaders/mesh.frag.glsl'),mode:'TRIANGLES'},
              contours :{active:false,vertexSource:glsl.file('./shaders/mesh.vert.glsl'),fragmentSource:glsl.file('./shaders/mesh.frag.glsl'),mode:'TRIANGLES'},
              contoursL:{active:false,vertexSource:glsl.file('./shaders/mesh.vert.glsl'),fragmentSource:glsl.file('./shaders/mesh.frag.glsl'),mode:'TRIANGLES'},
             },
    },
  programsList:['points','wireframe','surface','contours','contoursL'],
  
  initialised:function(gl,buffer,options){
    const debug = this.options.debug;
    this.options = extend(Object.create(this.options), options);
    this.slf = new slf(buffer,options);
    
    this.gl = gl;
    gl.getExtension('OES_element_index_uint');
    
    if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    
    if (debug) console.time('Initialised slfGL');
    // this.meshProgram = util.createProgram(gl, meshvert, meshfrag);
    // TODO : add multiple programs to support different rendering (point, wireframe,surfrace,filled contours,etc...)
    this.initializePrograms();
    this.initialisedBuffer();
    if (debug) console.timeEnd('Initialised slfGL');
  
  
  },
  initializePrograms:function(){
    const gl = this.gl;
    let programs = this.options.programs;
    for (const key of Object.keys(programs)) {
      programs[key] = extend(Object.create(programs[key]), util.createProgram(gl, programs[key]['vertexSource'], programs[key]['fragmentSource']));
    }
    this.programs = programs;
  },
  initialisedBuffer:function(){
    const gl  = this.gl;
    const slf = this.slf;
    
    const indices      = slf.IKLE3F;
    const indicesW     = slf.IKLEW;
    this.indicesCount  = indices.length;
    this.indicesWCount = indicesW.length;
    
    this.XYBuffer      = util.createArrayBuffer(gl, slf.XY);
    this.currentFrame  =slf.getFrame();
    this.ColorBuffer   = util.createArrayBuffer(gl,this.currentFrame); 
    this.minmax        = new Float32Array([slf.minmax[0],slf.minmax[1]]);
    this.ElementBuffer = util.createElementBuffer(gl,indices);
    this.ElementBufferW= util.createElementBuffer(gl,indicesW);
    this.getColorTexture();
    // this.colorTexture  = util.createTexture(this.gl, this.gl.LINEAR, getColorRamp(defaultRampColors), 32, 32);
    
  },
  getColorTexture:function(paint){
    const colors = (typeof paint!=="undefined") ? paint:defaultRampColors;
    const colorramp=getColorRamp(colors);
    this.colorTexture  = util.createTexture(this.gl, this.gl.LINEAR, colorramp, 32, 32);
  },
  updateFrame:function(iframe,ivar){
    const gl = this.gl;
    const slf = this.slf;
    this.currentFrame  =slf.getFrame(iframe,ivar);
    this.minmax        = new Float32Array([slf.minmax[ivar * 2],slf.minmax[ivar * 2 + 1]]);
    this.ColorBuffer   = util.createArrayBuffer(gl,this.currentFrame);
  },
  drawScene:function(worldSize,projMatrix){
    const gl       = this.gl;
    const u_matrix = new Float32Array(projMatrix);
    
    for (const name in this.programs) {
      const program = this.programs[name];
      if(program.active){
        gl.useProgram(program.program);
        util.bindArrayAttribute(gl, this.XYBuffer, program.a_pos, 3);
        util.bindArrayAttribute(gl, this.ColorBuffer, program.a_data, 1);
        util.bindTexture(gl, this.colorTexture, 0);

        if(name!=='wireframe')util.bindElementAttribute(gl, this.ElementBuffer);
        if(name==='wireframe')util.bindElementAttribute(gl, this.ElementBufferW);
        const count = (name!=='wireframe') ? this.indicesCount : this.indicesWCount;

    
        gl.uniform1i(program.u_color_ramp, 0);
        gl.uniform2fv(program.u_minmax,this.minmax);
        gl.uniform1f(program.worldSize, worldSize);
        gl.uniformMatrix4fv(program.u_matrix,false, u_matrix);
        // gl.lineWidth(2.0);
        gl.drawElements(gl[program.mode],count,gl.UNSIGNED_INT,0);
        gl.useProgram(null);
      }
    }
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