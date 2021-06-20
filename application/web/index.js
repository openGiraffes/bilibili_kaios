$(function () {
    var id = $.getQueryVar('id');
    if (id === false) {
        var link = sessionStorage.getItem('link');
        if (link != null && link != '' && typeof link != 'undefined')
            $('#web').attr('src', link);
        else
            alert('打开地址失败！');
    }
    else {
        var url = 'https://www.bilibili.com/read/mobile?id=' + id;
        $('#web').attr('src', url);
    }
    document.activeElement.addEventListener('keydown', handleKeydown);
});
function handleKeydown(e) {
    $.clearEvent(e);
    switch (e.key) {
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            window.location.href = '../dynamic/index.html';
            break;
    }
}