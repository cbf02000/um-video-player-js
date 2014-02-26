var DEFAULT_VIDEL_URL_API = "http://um-query.media.mit.edu/getvideourl";
var DEFAULT_VIDEO_QUALITY = "high"
var TRANSITION_TIME = 500;

function UMVideoPlayer(divId, onReady, onLoadError, onRenderObjectTimeUpdate, onVideoFinish) {

    var self = this;

    this.placeholderDiv = divId;
    this.placeholderHeight = 0;
    this.placeholderWidth = 0;

    this.onReady = onReady;
    this.onLoadError = onLoadError;
    this.onRenderObjectTimeUpdate = onRenderObjectTimeUpdate;
    this.onVideoFinish = onVideoFinish;

    this.renderObj = null;
    this.currentVideo = 0;
    this.isVideoReady = false;
    this.videoObjects = [];
    this.videoUuid = null;
    this.renderObjectTime = 0;
    this.contentTime = [];
    this.isVideoPlaying = false;

    this.setRenderObject = function(obj) {

        this.renderObj = obj;

        var res = this.getMediaUrl();
        //console.log(res);
        if (!res) {
            this.onLoadError("Invalid Render Object");
        }

    }

    this.play = function () {
        if (this.isVideoReady) {
            $("#video-"+self.videoUuid+"-"+self.currentVideo).fadeIn(TRANSITION_TIME);
            this.videoObjects[self.currentVideo].play();
            this.isVideoPlaying = true;
        } else {
            this.onLoadError("video not ready");
        }
    }

    this.pause = function () {
        if (this.videoObjects[self.currentVideo] != null) {
            if (!this.videoObjects[self.currentVideo].paused()) {
                this.videoObjects[self.currentVideo].pause();
            }
            if (!this.videoObjects[self.currentVideo + 1].paused()) {
                this.videoObjects[self.currentVideo + 1].pause();
            }

            this.isVideoPlaying = false;
        }
    }

    this.currentTime = function (newTime) {

        if (typeof newTime === 'number') {
            return "SKIMMING NOT YET IMPLEMENTED";
        } else {
            return this.renderObjectTime;
        }

    }

    this.getMediaUrl = function() {
        
        if (this.renderObj == null) {
            //console.log("RenderObject not set");
            return false;
        }

        var videoList = []

        for (var item in this.renderObj.contentObjs) {
            if (videoList.indexOf(this.renderObj.contentObjs[item].cId) < 0) {
                videoList.push(this.renderObj.contentObjs[item].cId);
            }
        }

        //console.log(videoList);

        if (videoList.length == 0) {
            return false;
        }

        $.post( DEFAULT_VIDEL_URL_API, { 
            id_list: JSON.stringify({list: videoList})
        }).done(function( json ) {
            self.processAjaxResponse(json);
        }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            self.onLoadError("URL Query AJAX Failed");
        });

        return true;

    }

    this.processAjaxResponse = function(res) {

        //console.log("processAjaxResponse");

        if (res.code == 0) {        

            for (var item in this.renderObj.contentObjs) {
                if (res.results.hasOwnProperty(this.renderObj.contentObjs[item].cId)) {
                    this.renderObj.contentObjs[item].url = res.results[this.renderObj.contentObjs[item].cId].mp4[DEFAULT_VIDEO_QUALITY];
                } else {
                    this.onLoadError("Not all content URLs exist");
                    return;
                }
            }

            this.loadInitialVideo();

        } else {
            this.onLoadError("Bad response from AJAX...");
            return;
        }
    }

    this.generateId = function(num) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < num; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    this.loadInitialVideo = function () {

        //console.log("loadInitialVideo");

        this.currentVideo = 0;
        this.videoObjects = new Array(this.renderObj.contentObjs.length);
        this.isVideoReady = false;
        this.videoUuid = self.generateId(10);
        this.renderObjectTime = 0;
        this.contentTime = new Array(this.renderObj.contentObjs.length);
        this.placeholderWidth = $(this.placeholderDiv).width();
        this.placeholderHeight = $(this.placeholderDiv).height();

        this.loadVideoElement(0);
    }

    this.loadVideoElement = function (id) {

        $(self.placeholderDiv).empty();
        $(self.placeholderDiv).css("position", "absolute");
        
        var content = this.renderObj.contentObjs[id];
        this.appendVideo(id, content.url, content.startTime, content.endTime);

        if (this.renderObj.contentObjs.length > id + 1) {
            content = null;
            content = this.renderObj.contentObjs[id + 1];
            this.appendVideo(id + 1, content.url, content.startTime, content.endTime);
        }
    }

    this.appendVideo = function (id) {

        var content = this.renderObj.contentObjs[id];
        var classTag = null;

        jQuery('<video />', {
            id: "video-" + self.videoUuid + "-" + id,
            class: "um_video_player vjs-default-skin",
            height: this.placeholderHeight, 
            width: this.placeholderWidth,
        }).appendTo(this.placeholderDiv);

        //console.log("APPENDING VIDEO");

        var videoObj = videojs("video-" + self.videoUuid + "-" + id, { 
            "controls": false, 
            "autoplay": false, 
            "preload": "auto", 
        }, function() {

            //console.log("VID OBJ READY");

            $("#video-" + self.videoUuid + "-" + id).css({
                "position": "absolute",
                "left": "0px",
                "top": "0px",
            });
            $("#video-" + self.videoUuid + "-" + id).hide();

            this.on("loadedmetadata", self.onMetadataLoaded);
            this.on("loadeddata", self.onVideoReady);
            this.on("play", self.onPlay);
            this.on("pause", self.onPause);
            this.on("timeupdate", self.onTimeUpdate);

            this.src(content.url);
        
        });

        this.videoObjects[id] = videoObj;
        this.contentTime[id] = 0;
    }    

    this.onMetadataLoaded = function() {
        
        //console.log("onMetadataLoaded");
        
        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (videoId == null || videoId < 0) {
            self.onLoadError("Something wrong with video element...");
            return;
        }

        //console.log("CONTENT TIME", self.contentTime[videoId], videoId);

        this.currentTime(self.renderObj.contentObjs[videoId].startTime);
        self.contentTime[videoId] = self.renderObj.contentObjs[videoId].startTime;

    }

    this.onVideoReady = function() {
        //console.log("onVideoReady");

        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (videoId == null || videoId < 0) {
            self.onLoadError("Something wrong with video element...");
            return;
        }

        if (videoId == 0) {
            self.isVideoReady = true;
            self.onReady();
        }
    }

    this.onPlay = function() {
        //console.log("onPlay");

    }

    this.onPause = function() {
        //console.log("onPause");

        if (self.currentVideo == self.renderObj.contentObjs.length && (self.renderObj.contentObjs[self.currentVideo - 1].endTime*1000) - (this.currentTime()*1000) < TRANSITION_TIME) {
            self.onVideoFinish();    
            self.loadInitialVideo();
            self.isVideoPlaying = false;
            //console.log("");
        }
    }

    this.onTimeUpdate = function() {

        var elementId = this.id_;
        var videoId = parseInt(elementId.replace("video-" + self.videoUuid + "-", ""));

        if (self.currentVideo == videoId) {

            //console.log("FUCK HERE!!!", this.currentTime(), (self.contentTime[videoId]))

            if (self.isVideoPlaying) {
                self.renderObjectTime += this.currentTime() - (self.contentTime[videoId]);
                self.contentTime[videoId] = this.currentTime();
                self.onRenderObjectTimeUpdate(self.renderObjectTime);
            }


            if ((self.renderObj.contentObjs[videoId].endTime*1000) - (this.currentTime()*1000) < TRANSITION_TIME) {

                self.currentVideo++;

                $("#video-"+self.videoUuid+"-"+videoId).fadeOut(TRANSITION_TIME, function() {
                    
                    if (self.currentVideo - 1 >= 0) {
                        //console.log("video being paused", self.currentVideo - 1);
                        self.videoObjects[self.currentVideo - 1].pause();
                        self.videoObjects[self.currentVideo - 1] = null;
                    }

                    this.remove();

                });

                if (self.renderObj.contentObjs.length > self.currentVideo) {
                    $("#video-"+self.videoUuid+"-"+self.currentVideo).fadeIn(TRANSITION_TIME);
                    self.videoObjects[self.currentVideo].play();

                    if (self.renderObj.contentObjs.length > self.currentVideo + 1) {
                        var content = self.renderObj.contentObjs[self.currentVideo + 1];
                        self.appendVideo(self.currentVideo + 1, content.url, content.startTime, content.endTime);
                    }

                }
            } 
        }
    }
}
