/*global $ */
$(document).ready(function() {
    // $('#rightBar').on('drag',function() {(
    //   {
    //   handles: 'w',
    //   // minWidth: 230,
    //   maxWidth: 690,
    //   });
$('#example').DataTable();
});

function GUI(){
  this.initialiseBars();
  this.initialiseGroup();
  


  
}



GUI.prototype = {
  initialiseGroup:function(){
    const group = this.group = new Group("Model Group");
    
    group.addLayer(new Layer('file1',{name:'file1'}));
    group.addLayer(new Layer('file2',{name:'file2'}));
    group.addLayer(new Layer('file3',{name:'file3'}));
    group.addLayer(new Layer('file4',{name:'file4'}));
    
    $('#sidebarlist').append(group.getHTMLList());
    $('#groupname').append(group.getHTMLHeader());
    $('#idpanels').append(group.getHTMLPanels());
    
    
    const group2 = this.group2 = new Group("GIS Group");
    
    group2.addLayer(new Layer('file1',{name:'file1'}));
    group2.addLayer(new Layer('file2',{name:'file2'}));
    group2.addLayer(new Layer('file3',{name:'file3'}));
    group2.addLayer(new Layer('file4',{name:'file4'}));
    $('#sidebarlist').append(group2.getHTMLList());
    
    
  },
  initialisePanels:function(){
    const group = this.group;
    const layers = group.layers;
    for(let i=0,n=layers.length;i<n;i++){
      const layer = layers[i];
      
      
    }
  },
  initialiseBars:function(){
    const parent = this;
    const chevronEnter = function(e){$(this).css({"opacity":0.9});};
    const chevronLeave = function(e){$(this).css({"opacity":0.5});};
    const bars = this.bars = [
      new SideBar("headerBar",'top'),
      new SideBar("leftBar",'left'),
      new SideBar("rightBar",'right'),
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
          $('#leftBar').animate({top:offset}, 500);
          $('#rightBar').animate({top:offset}, 500);
        }
        if(bar.id == "rightBar"){
          let con = (bar.active) ? 'Block':'None';
          $('#rightBarSlider').css('display',con);
          
        }
      });
    }
    
    $('#rightBarSlider').on('mousedown touchstart', function (e) {parent.isResizing = true;});
    $("#resizefull").on('click',function() {
        let value = $('#rightBar').width()+286;
        $('#rightBar').animate({'width':value});
        // $('#right_col').animate({'width':value});
        $('#rightBarSlider').animate({'right':value});
        $('#rightBarChevron').animate({'right':value});
    });
    $("#resizesmall").on('click',function() {
        let value = $('#rightBar').width()-286;
        value = (value>286) ? value:286;
        $('#rightBar').animate({'width':value});
        // $('#right_col').animate({'width':value});
        $('#rightBarSlider').animate({'right':value});
        $('#rightBarChevron').animate({'right':value});
    });
    $(document).on('mousemove touchmove', function (e) {
        // e.preventDefault();
        if (!parent.isResizing) return;
        let value = $( window ).width() - e.clientX;
        value = (value>286) ? value:286;
        $('#rightBar').css('width',value  );
        $('#right_col').css('width',  value);
        $('#rightBarSlider').css('right',  value);
        $('#rightBarChevron').css('right',  value);
    });
    $(document).on('mouseup touchend', function (e) { parent.isResizing = false;});
    
    
    
    
    
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