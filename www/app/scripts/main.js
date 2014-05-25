'use strict';

$('#launch, #launch-bottom').on('click', function(){

    // Show the form
    var headerHeight = $('.header').height();

    var cont = $('.signup-form');
    var spinner = $('.signup-form .creating');
    var result = $('.signup-form .created');

    var showCont = function(){
        cont.show();
        cont.css('z-index', 1);
        cont.css('min-height', headerHeight);
        cont.css('opacity', 1);
    };

    var showSpinner = function(){
        spinner.show();
        spinner.css('opacity', 1);
    };

    var showResult = function(){
        spinner.css('opacity', 0);
        if(cont.height() > headerHeight){
            $('.header').css('height', cont.height());
        }

        setTimeout(function(){
            spinner.hide();
            result.show();
            result.css('opacity', 1);
        }, 300);
    };

    showCont();
    setTimeout(showSpinner, 300);

    setTimeout(showResult, 2000);


    $('#edit-code').on('click', function(){
        $('#codeinput').focus();
    });

    // 300 ms (opacity) later, fade in text



    // TODO : animations and everything...
    // $('#under-construction').modal('show');

});