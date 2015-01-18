$(window).ready(function(){

    'use strict';

    flyer.wrapper.subscribe({
        channel: 'yetu',
        topic: 'message.to.yetu',
        callback: function(data, topic, channel) {
            alert("the app: '" + data.title + "' has sent you: '" + data.message + "'");
        }
    });

    flyer.wrapper.subscribe({
        channel: 'yetu',
        topic: 'action.is.ready',
        callback: function(data, topic, channel) {
            alert("the app: '" + data.title + "' is ready for use and sent you: '" + data.message + "'");
        }
    });

    flyer.wrapper.subscribe({
        channel: 'yetu',
        topic: 'control.quit',
        callback: function(data, topic, channel) {
            alert("the app: '" + data.title + "' has just sent you a 'quit' signal");
        }
    });

    flyer.wrapper.subscribe({
        channel: 'yetu',
        topic: 'control.index',
        callback: function(data, topic, channel) {
            alert("the app: '" + data.title + "' has just sent you the 'index' number " + data.message.index);
        }
    });

    $('.iframe-changebox').click(function(event){

        event.preventDefault();
        event.stopImmediatePropagation();

        var key = $(this).attr('rel');
        if (typeof key !== 'undefined') {

            flyer.wrapper.broadcast({
                channel: 'yetu',
                topic: 'control.'+key,
                data: {}
            });
        }
    });
});