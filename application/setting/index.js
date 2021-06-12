let hasChange = false;
$(function () {
    loadSetting();
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function loadSetting() {
    try {
        var speed = $.getData('danmaku_speed');
        if (speed == '') speed = 5;
        $('#danmaku_speed').val(speed);
        var qn = $.getData('video_qn');
        if (qn == '') qn = 16;
        $("#video_qn").val(qn);
        var danmaku = $.getData('danmaku');
        if (danmaku == '') danmaku = 0;
        $("#danmaku").prop("checked", danmaku == 1);
    }
    catch (e) {
        console.log(e);
    }
}
function saveSetting() {
    try {
        var speed = $('#danmaku_speed').val();
        $.setData('danmaku_speed', speed);
        var qn = $("#video_qn").val();
        $.setData('video_qn', qn);
        var danmaku = $('#danmaku').is(':checked');
        $.setData('danmaku', danmaku ? 1 : 0);
        alert('保存成功！');
    }
    catch (e) {
        console.log(e);
        alert('保存失败...' + e.message);
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
        case 'Q':
        case 'SoftLeft':
            saveSetting();
            break;
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            if (hasChange) {
                if (confirm('有未保存的设置，是否保存？'))
                    saveSetting();
            }
            window.location.href = '../index.html';
            break;
        case 'Enter':
            if ($('#danmaku.select').length > 0) {
                var danmaku = $('#danmaku').is(':checked');
                $("#danmaku").prop("checked", !danmaku);
            }
            break;
    }
}
var current = 0;
function nav(move) {
    var next = current + move;
    const items = document.querySelectorAll('.item');
    if (next >= items.length) {
        next = items.length - 1;
    }
    else if (next < 0) {
        next = 0;
    }
    const targetElement = items[next];
    if (targetElement) {
        current = next;
        targetElement.focus();
        $('.item').removeClass('select');
        $(targetElement).addClass('select');
    }
}