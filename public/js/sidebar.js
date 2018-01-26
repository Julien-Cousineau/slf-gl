/*global $*/
function SideBar(){
  this.initialise();
}
SideBar.prototype = {
  initialise:function(){
    $('#bodyContainer').append(this.getDiv());
    this.addSideBarFunction();
  },
  getDiv:function(){
    return `
    <div class="bodyContainer">
      <div class="sideBarIconContainer">
           <a class="sideBarIcon"><i class="fa fa-bars"></i></a>
      </div>
      <div class="mycontainer">
        <div class="accordion">
          <ul>
            <li>
              <input type="radio" name="select" class="accordion-select" checked />
              <div class="accordion-title"><span>Layers</span></div>
              <div id="layercontent" class="accordion-content"></div>
              <div class="accordion-separator"></div>
            </li>
            <li>
              <input id="propertyradio" type="radio" name="select" class="accordion-select" />
              <div class="accordion-title"><span>Properties</span></div>
              <div id="propertycontent" class="accordion-content prop-content" ></div>
              <div class="accordion-separator"></div>
            </li>
          </ul>
        </div>
      </div>
    </div>`;
  },
  addSideBarFunction:function() {
  
  $(".sideBarIconContainer").on("click", function() {
    let htmlStyles = window.getComputedStyle(document.querySelector("html"));
    let sideBarWidthIndex = htmlStyles.getPropertyValue("--sideBarWidthIndex");
    sideBarWidthIndex = (sideBarWidthIndex>1) ? 0:++sideBarWidthIndex;
    document.querySelector("html").style.setProperty("--sideBarWidthIndex", sideBarWidthIndex);
  });
}
  
};