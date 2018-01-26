/*global $,Header,SideBar*/
$(document).ready(function() {
    // new Header();
    new App();
});

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


function rgb2hex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function extend(dest, src) {
    for (var i in src) dest[i] = src[i];
    return dest;
}