"use strict;"

function pHome() {
  // then, loading of the view displayed to the user
  this.view = new vHome();
  this.view.load();

  this.vm = new Vue({
    el:'#content',
    data:{

    }
  });



  this.init();



}

pHome.prototype = {

  /**
  */
  init: function(){
    var that = this;
  }

};
