/*global $*/
function Header(){
  this.initialiseHeader();
}
Header.prototype = {
  initialiseHeader:function(){
    $('#header').append(this.getDiv());
    
    const bars = this.bars = [
      new HeaderHelper("banner",'top'),
    ];
    const chevronEnter = function(e){$(this).css({"opacity":0.9});};
    const chevronLeave = function(e){$(this).css({"opacity":0.5});};

    
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
          let htmlStyles = window.getComputedStyle(document.querySelector("html"));
          let value = (bar.active) ? '0px':'-100px';
          document.querySelector("html").style.setProperty("--bannermargin", value);
      });
    }
  },
  getDiv:function(){
      return  `<div class = 'linkContainer'>
    <div class = 'gcLogoBox'>
      <img src='//www.nrc-cnrc.gc.ca/_gcwu/theme-gcwu-fegc/images/sig-eng.png'>
    </div>
    <div class = 'linkBox'>
      <table class = 'linkButtons'>
        <tr>
          <td>
            <a href='http://google.ca'>Button 1</a>
          </td>
          <td>
            <a href='http://google.ca'>Francais</a>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <div id="banner">
    <div class ='bannerContainer'>
      <div class ='leaflogo'></div>
      <div class="nrclogo"></div>                     
      <div class="row bannerrow"> 
        <div class="col-sm-6 bannerCC"><div class ='bannerText'>Marine Renewable Energy Atlas</div></div>       
      </div>
    </div>
    <div id="bannerChevron">
      <span id="bannerChevronI" class="glyphicon glyphicon-chevron-up"></span>
    </div>
  </div>`
  }
  
};


function HeaderHelper(id,position){
  this.id = id;
  this.active = true;
  this.position = position;
}
HeaderHelper.prototype = {
  get attribute(){return 'marginTop';},
  get toggle(){return 'glyphicon-chevron-down glyphicon-chevron-up';},
  get offset(){return (this.active) ? '0px':"-100px";},
  get object(){
    let object = {};
    object[this.attribute]=this.offset;
    return object;
  }
  
};


function changeSide(width) {
  let htmlStyles = window.getComputedStyle(document.querySelector("html"));
  let sideBarWidth = htmlStyles.getPropertyValue("--sideBarWidth");
  let newvalue = parseInt(sideBarWidth) + width;
  document.querySelector("html").style.setProperty("--sideBarWidth", newvalue + "px");
}