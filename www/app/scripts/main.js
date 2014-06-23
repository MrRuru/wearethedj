'use strict';

$('#launch, #launch-bottom').on('click', function(){

    // Show the form
    var headerHeight = $('.header').height();

    var cont = $('.signup-form');
    var codeForm = $('.signup-form .created');

    var showCont = function(){
        cont.show();
        cont.css('z-index', 1);
        cont.css('min-height', headerHeight);
        cont.css('opacity', 1);
    };

    var showForm = function(){
        // Default hidden
        codeForm.find('.link').hide();
        codeForm.find('#loading').hide();
        codeForm.find('#success').hide();

        if(cont.height() > headerHeight){
            $('.header').css('height', cont.height());
        }

        setTimeout(function(){
            codeForm.show();
            codeForm.css('opacity', 1);
        }, 300);
    };

    showCont();
    setTimeout(showForm, 300);


    var submitCode = function(){
        var code = codeForm.find('input').val();

        if (!code) { alert('No code given'); }
        console.log('submitting new party with code', code);
        codeForm.find('#submit').hide();
        codeForm.find('#loading').show();

        $.ajax({
            url: 'http://local.poll.dance:8001/room',
            method: 'POST',
            dataType: 'json',
            contentType : 'application/json',
            data: JSON.stringify({
                code: code
            }),
            success: function(){
                codeForm.find('#loading').hide();
                codeForm.find('#success').show();
                codeForm.find('.why').fadeOut('slow', function(){
                    codeForm.find('.link').fadeIn('slow');
                });
            },
            error: function(message){
                codeForm.find('#loading').hide();
                codeForm.find('#submit').show();
                console.log('error', message);
                alert('An error happened');
            }
        });
    };

    codeForm.find('#submit').on('click', function(){
        submitCode();
    });

    codeForm.find('form').on('submit', function(e){
        e.preventDefault();
        submitCode();
    });




    // 300 ms (opacity) later, fade in text



    // TODO : animations and everything...
    // $('#under-construction').modal('show');

});