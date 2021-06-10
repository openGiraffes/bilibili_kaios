$.extend({
    showLoading: function () {
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
        $(".loading").hide();
    },
});