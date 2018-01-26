/*global $ */

function GUI(){
  this.initialiseBars();
}

GUI.prototype = {
  initialiseBars:function(){
    const chevronEnter = function(e){$(this).css({"opacity":0.9});};
    const chevronLeave = function(e){$(this).css({"opacity":0.5});};
    const bars = this.bars = [
      new SideBar("headerBar",'top'),
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
      });
    }
  },
  
};


function SideBar(id,position){
  this.id = id;
  this.active = true;
  this.position = position;
}
SideBar.prototype = {
  get attribute(){
    if(this.position=='top'){return 'marginTop';}
    else if(this.position=='bottom'){return 'marginBottom';}
    else if(this.position=='left'){return 'marginLeft';}
    else if(this.position=='right'){return 'marginRight';}
    else{throw Error("Error in initialiseBars")}
  },
  get toggle(){
    if(this.position=='top'){return 'glyphicon-chevron-down glyphicon-chevron-up';}
    else if(this.position=='bottom'){return 'glyphicon-chevron-up glyphicon-chevron-down';}
    // else if(this.position=='left'){return 'glyphicon-chevron-left glyphicon-chevron-right';}
    else if(this.position=='left'){return 'fa-bars fa-bars';}
    else if(this.position=='right'){return 'glyphicon-chevron-right glyphicon-chevron-left';}
    else{throw Error("Error in initialiseBars")}    
  },
  get offset(){
    const id = '#{0}'.format(this.id);
    let dist='0px';
    if(this.position=='top'){
      dist = "-100px";
    } else if(this.position=='left' ){
      dist = "-" + $(id).css('width')
    } else if(this.position=='right'){
      dist = "-" + $('#right_col').css('width');
    }
    console.log(dist)
    return (this.active) ? '0px':dist;
  },
  get object(){
    let object = {};
    object[this.attribute]=this.offset;
    return object;
  }
  
};