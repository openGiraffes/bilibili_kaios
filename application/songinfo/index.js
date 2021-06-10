let sid = 0, mid = 0;
let audio = null;
$(function () {
    audio = new Audio();
    audio.loop = true;
    audio.onplay = function () {
        $('#softkey-center').text('暂停');
    };
    audio.onpause = function () {
        $('#softkey-center').text('播放');
    };
    sid = $.getQueryVar('id');
    mid = $.getData('mid');
    var surl = 'https://api.bilibili.com/audio/music-service-c/url?mid=' + mid + '&privilege=2&quality=1&songid=' + sid;
    $.getApiAsync(surl, function (data) {
        if (data.code == 0) {
            if (data.data.cdns != null && data.data.cdns.length > 0) {
                var uri = data.data.cdns[0];
                playMusic(uri);
            }
            else {
                alert('获取歌曲播放地址失败！');
            }
        }
        else {
            alert('获取歌曲播放地址失败！' + data.message);
        }
    });
    loadData();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function playMusic(uri) {
    audio.pause();
    audio.src = uri;
    audio.play();
}
function playOrPause() {
    if (audio.paused)
        audio.play();
    else
        audio.pause();
}
function loadData() {
    var url = 'https://api.bilibili.com/audio/music-service-c/songs/playing?mid=' + mid + '&song_id=' + sid;
    var result = $.getApi(url);
    if (result.code == 0) {
        $('#cover').attr('src', result.data.cover_url + '@96w_80h.jpg');
        $('#title').text(result.data.title);
        $('#play').text(result.data.play_count);
        $('#collection').text(result.data.collect_count);
        $('#share').text(result.data.snum);
        $('#songName').text(result.data.intro);
        $('#uface').attr('src', result.data.up_img + '@64w_64h.jpg');
        $('#uname').text(result.data.up_name);
        $('#pt').text(result.data.ctime_str);
    }
    else {
        alert('获取歌曲信息失败！' + result.message);
    }
}
function handleKeydown(e) {
    switch (e.key) {
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case '2':
            navigator.volumeManager.requestUp();
            break;
        case '8':
            navigator.volumeManager.requestDown();
            break;
        case '4':
            seekTo(-1);
            break;
        case '6':
            seekTo(1);
            break;
        case 'Enter':
            playOrPause();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../music/index.html';
            break;
    }
}
function seekTo(type) {
    try {
        if (!audio.paused && !isNaN(audio.duration)) {
            var next = audio.currentTime + (type * 5);
            if (next < 0)
                next = 0;
            else if (next > audio.duration)
                next = audio.duration;
            audio.currentTime = next;
            audio.play();
        }
    }
    catch (e) {
        console.log(e);
    }
}