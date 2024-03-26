$(function(){
    document.activeElement.addEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
    $.clearEvent(e);
    switch (e.key) { 
        case 'E':
        case 'Backspace':
        case 'SoftRight':
            //window.location.href = '../dynamic/index.html';
            window.history.back();
            break;
    }
}
