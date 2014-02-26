# um-video-player.js

An HTML5 video player that can take in multiple videos with time offsets, and play them in a sequence. 

## Motivation

For playing multiple videos in a sequence, it is possible to use a single `<video>` element and change its `src` to other videos. But there is a time lag from the point it starts to load, to the point it actually becomes playable.

This javascript library preloads videos, coordinates the multiple `<video>` elements that are created, and enables cross-disolve transitions during playback. 

## Usage

Have these Javascript and CSS files included in your `<head>` section.

```html
<!-- Dependancies -->
<script src="./js/jquery-2.1.0.min.js"></script>
<script src="./js/video.js"></script>
<link rel="stylesheet" href="./css/video-js.css" />

<!-- Actual um-video-player.js -->
<script src="./js/um-video-player.js"></script>
```

Prepare the render object data structure. (For now, it is suppose to use the UM backend, all IDs are UMIDs, and automatically uses UMQuery to back reference the actual URL of video.)

```javascript
var renderObjects = {
    rID: 1,
    rtitle: 'Ultimate Media Remix',
    contentObjs: [{
        cId: "UU-0MrczERAe4",
        startTime: 2.0,
        endTime: 5.0,
    }, {
        cId: "UU-2QqLqnxXJc",                
        startTime: 2.0,
        endTime: 10.0,
    }, 

    /* Could contain as many content objects */
    
    ],
};
```

Prepare the placeholder `<div>` somewhere in your HTML document and be sure to define its height and width in css. (`id` could be arbitrary)

```html
<div id="um_video_player_wrapper"></div>
```

```css
#um_video_player_wrapper {
    width: 640px;
    height: 360px;
}
```

Use the syntax below to initialize the player object.

```javascript
var player;

player = new UMVideoPlayer("#um_video_player_wrapper", onReady, onLoadError, onTimeUpdate, onFinish);
player.setRenderObject(renderObjects);

function onReady() {
    console.log("READY");
}

function onLoadError(e) {
    console.log("ERROR", e);
}

function onTimeUpdate() {
    console.log("ON TIME UPDATE",　"Current Time is:", this.currentTime());
}

function onFinish() {
    console.log("ON FINISH");
}
```

## API Reference

#### UMVideoPlayer("#id_of_placeholder", onReady, onLoadError, onTimeUpdate, onFinish);

- `#id_of_placeholder"` is the `id` of the placeholder `<div>` element.
- `onReady` is the callback function for when the video is ready for play.
- `onLoadError` is the callback function for when their is an error.
- `onTimeUpdate` is the callback function for when the video progresses.
- `onFinish` is the callback function for when the video is done.

#### UMVideoPlayer.setRenderObject(obj)

- Give the instance and render object `obj`.

#### UMVideoPlayer.play()

- Play render object. Always call after `onReady` is invoked.

#### UMVideoPlayer.pause()

- Pause render object

#### UMVideoPlayer.currentTime()

- Get the current time of the render object.

## Dependancies

This relies on the following libraries to function properly.

- video.js (http://www.videojs.com/) - This repo includes version 4.4.1
- jQuery (http://jquery.com/) - This repo includes version 2.1.0

In order to reduce unexpected malfunctions, please use included library files.
