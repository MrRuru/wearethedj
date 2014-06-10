angular.module('app.directives.upvote', [])
.directive('upvote', function($timeout){

  // Constants
  var dashLength = 91;
  var cooldown = 10000; // 10 seconds


  // Global object for getting animation frame
  var AnimationRunner = {
    animations: {},

    register: function(id, animation){
      this.animations[id] = animation;
    },

    unregister: function(id){
      delete this.animations[id];
    },

    frame: function(){
      for (var id in this.animations) {
        if (this.animations.hasOwnProperty(id)) {
          this.animations[id]();
        }
      }
    }
  };

  // Launch drawing loop
  var draw = function(){
    AnimationRunner.frame();
    requestAnimationFrame(draw);
  };

  draw();


  // Actual directive instanciating
  var link = function(scope, element, attrs){
    console.log('linking directive with', scope, element, attrs);

    var lastUpvote = 0;
    var progressEl = element[0].childNodes[0].childNodes[1];

    var percent;

    var update = function(){

      percent = (Date.now() - lastUpvote) / cooldown;

      if (percent > 1) {
        percent = 1;
        // Stop drawing : cooldown finished
        AnimationRunner.unregister(scope.$id);        
      }

      progressEl.setAttribute('stroke-dashoffset', (1 - percent) * dashLength);

    };


    // Watch track changes
    scope.$watch('track.lastUpvote', function(newVal){
      lastUpvote = newVal;
  
      // start drawing
      AnimationRunner.register(scope.$id, update);
    });
  };


  return {
    // Check element name
    restrict: 'E',

    // Internal variables
    scope: {
      // 1-way binding
      track: '=track'
    },

    // HTML template
    template: '<svg width="42" height="42" viewPort="0 0 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg">                                                                           \
                  <circle class="outer" r="14.5" cx="21" cy="21" fill="transparent" stroke-dasharray="91 91" stroke-dashoffset="0" stroke-width="9" transform="rotate(-90 21 21)"></circle> \
                  <circle class="inner" r="6"    cx="21" cy="21" fill="transparent" stroke-width="4"></circle>                                                                              \
               </svg>',

    // Internal scope
    link: link
  }

});