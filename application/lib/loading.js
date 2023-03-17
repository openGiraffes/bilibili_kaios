//是否全局隐藏加载框
$.golbalhideLoading = false;
$.extend({
    showLoading: function () {
        if($.golbalhideLoading)
        {
            return;
        }
        try {
            if ($(".loading").length == 0) {
                var html = '<div class="loading"><div class="container"><span></span><span></span><span></span><span></span><span>' +
                    '</span><span></span><span></span><span></span></div></div>';
                $('body').append(html);
            }
            else {
                $(".loading").show();
            }
        }
        catch (e) {
            console.log(e);
        }
    },
    hideLoading: function () {
        if($.golbalhideLoading)
        {
            return;
        }
        $(".loading").hide();
    },
});