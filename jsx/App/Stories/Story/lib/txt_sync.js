// Based on http://community.village.virginia.edu/etst/

export function setupTextSync() {
    // Initialize YouTube player: 
    console.log("YouTube API ready? " + youTubeIframeAPIReady);
    player = new YT.Player('video', {
          height: '270',
          width: '480',
          videoId: 'M7lc1UVf-VE'
        });

    var doneInitializingPlayer = false;
    function onPlayerReady(event) {
        console.log("player ready");
        if (doneInitializingPlayer) {
            return;
        }

        // Make YouTube player behave like a <video/> or <audio/> element:

        // mimic the currentTime property
        Object.defineProperty(player, 'currentTime', { 
            get: player.getCurrentTime,
            set: function(t) { player.seekTo(t / 1000); },
            enumerable: true 
        });

        // mimic the ontimeupdate property by checking every 0.1 second
        Object.defineProperty(player, 'prevTime', { 
            value: player.currentTime, 
            enumerable: true,  
            writable: true
        });
        Object.defineProperty(player, 'ontimeupdate', { 
            value: function() {}, 
            enumerable: true,  
            writable: true
        });
        Object.defineProperty(player, 'checkTimeUpdate', { 
            value: function checkTimeUpdate() {
                console.log("checkTimeUpdate");
                if (player.currentTime !== player.prevTime) {
                    player.prevTime = player.currentTime;
                    console.log("ontimeupdate, currentTime = " + player.currentTime);
                    player.ontimeupdate();
                }
                setTimeout(checkTimeUpdate, 10);
            }, 
            enumerable: true
        });
        player.checkTimeUpdate();

        doneInitializingPlayer = true;
    }

    // When running LingView locally, the YT API fails to call onPlayerReady (due to cross-origin stuff?).
    // Make sure onPlayerReady gets called anyway. 
    setTimeout(onPlayerReady, 500);

    function scrollIntoViewIfNeeded(target) {
        var rect = target.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            target.scrollIntoView(false);
        }
        if (rect.top < 0) {
            target.scrollIntoView();
        } 
    }

    window.sync = function sync(current_time) {
        for (var i=0; i<ts_tag_array.length; i++) {
            // Somewhat hacky solution: decrease current_time by 0.001 to avoid highlighting before player starts
            if ((current_time-0.001 >= parseFloat(ts_start_time_array[i])/1000.0) && (current_time <= parseFloat(ts_stop_time_array[i])/1000.0)) {
                ts_tag_array[i].setAttribute("id", "current");
                scrollIntoViewIfNeeded($("#current")[0]);
                ts_tag_array[i].style.backgroundColor = "rgb(209, 200, 225)";
            }
            else {
                ts_tag_array[i].style.backgroundColor = "transparent";
                try { ts_tag_array[i].removeAttribute("id"); }
                catch (err) { }
            }
        }
    }

    try {
        const media = document.querySelectorAll("[data-live='true']")[0];
        media.setAttribute("ontimeupdate", "sync(this.currentTime)");
        media.setAttribute("onclick", "sync(this.currentTime)");
    } catch (err) {
        console.log(err);
    }

    const ts_tag_array = document.getElementsByClassName("labeledTimeBlock");
    const ts_start_time_array = [];
    const ts_stop_time_array = [];

    for (var i = 0; i < ts_tag_array.length; i++) {
        ts_start_time_array[i] = ts_tag_array[i].getAttribute("data-start_time");
        ts_stop_time_array[i] = ts_tag_array[i].getAttribute("data-end_time");
    }
    // }

    // I/P: t, an integer number of milliseconds
    // O/P: the player updates to the given time
    function jumpToTime(t) {
        updateTimestampQuery(t);
        try {
            const media = $("[data-live='true']").get(0);
            media.currentTime = (t + 2) / 1000;
        }
        catch(err) {
            console.log(err);
            console.log("We think you tried to jump to time before the MEDIA element was created.");
        }
    }

    $(".timeStamp").click(function() {
        jumpToTime($(this).data('start_time'));
    });

    // Jump to timestamp:
    // Based on: http://snydersoft.com/blog/2009/11/14/get-parameters-to-html-page-with-javascript/
    $( document ).ready(function() {
        let query_index = document.URL.indexOf("?");
        let startTime = Number(document.URL.substr(query_index+1));
        if (isFinite(startTime)) {
            jumpToTime(startTime + 1);
        }
    });

    function updateTimestampQuery(newTimestamp) {
        if (window.history.replaceState) {
            const newurl = window.location.href.replace(/\?.*$/,'') + `?${newTimestamp-1}`; // hacky...
            window.history.replaceState({ path: newurl }, '', newurl);
        }
    }
}