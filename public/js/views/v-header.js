"use strict;"

function vHeader() {}

vHeader.prototype = {

    /**
      change the HTML elements of the page
    */
    load: function(){
      $('#header').html(this.html());
    },

    /**
      returns the html content of the page itself
    */
    html: function(){
      return '<div>\
      </div>';
    }


};
