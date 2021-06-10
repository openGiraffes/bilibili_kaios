var commentpage = 1, islike = 0, qn = 16;
let player = null;
let aid = 0, bvid = 0, cid = 0, mid = 0, season_type = 0;
$(function () {
	mid = $.getData('mid');
	qn = $.getData('video_qn');
	if (qn == '') qn = 16;
	aid = $.getQueryVar('aid');
	cid = $.getQueryVar('cid');
	bvid = $.getQueryVar('bvid');
	season_type = $.getQueryVar('season_type');
	document.activeElement.addEventListener('keydown', handleKeydown);
	if (season_type === false)
		getParts();
	else {
		$('#pages').hide();
		getBangmiPlayUrl();
	}
	getInfo();
	getIsLike();
});
function playVideo(url, type) {
	if (typeof player !== "undefined") {
		if (player != null) {
			player.unload();
			player.detachMediaElement();
			player.destroy();
			player = null;
		}
	}
	player = flvjs.createPlayer({
		type: type,
		isLive: false,
		url: url
	});
	player.attachMediaElement(document.getElementById('player'));
	player.load();
	player.play();
}
function openV() {
	const currentIndex = document.activeElement.tabIndex;
	window.location.href = './player/index.html?aid=' + aid[currentIndex] + '&bvid=' + bvid[currentIndex]
}
function playV(part) {
	if (season_type === false) {
		if (qn == '16' || qn == 16) {
			var url = 'https://www.bilibili.com/video/';
			if (bvid === false)
				url += 'av' + aid;
			else
				url += bvid;
			url += '?p=' + part;
			var result = $.getWeb(url);
			try {
				var playurl = result.match(/readyVideoUrl: \'(.*?)\',/g).toString();
				playurl = playurl.replace("readyVideoUrl: '", "");
				playurl = playurl.replace("',", "");
				if (playurl) {
					var player = document.getElementById("player");
					player.src = playurl;
					player.width = 240;
					player.height = 150;
					player.play();
				}
			}
			catch (err) {
				console.log(err);
				getPlayUrl(part);
			}
		}
		else {
			getPlayUrl(part);
		}
	}
	else {
		getBangmiPlayUrl();
	}
}
function getPlayUrl(part) {
	cid = playInfos[part - 1].cid;
	var link = 'https://api.bilibili.com/x/player/playurl?avid=' + aid + '&cid=' + cid + '&qn=' + qn + '&type=&otype=json';
	if (qn == '16' || qn == 16)
		link += '&platform=html5';
	var result = $.getApi(link, web);
	if (result.code == 0) {
		var url = result.data.durl[0].url;
		if (url) {
			var type = 'flv';
			if (url.indexOf('flv') == -1)
				type = 'mp4';
			playVideo(url, type);
		}
	}
}
//just for bangmi
function getBangmiPlayUrl() {
	var result = false;
	try {
		var url = 'https://bangumi.bilibili.com/player/web_api/v2/playurl?cid=' + cid + '&otype=json&type=&quality=' + qn + '&module=bangumi&season_type=' + season_type + '&qn=' + qn;
		var result = $.getApi(url, web);
		if (result.result == 'suee') {
			if (result.durl != null && result.durl.length > 0) {
				var url = result.durl[0].url;
				var type = 'flv';
				if (url.indexOf('flv') == -1)
					type = 'mp4';
				playVideo(url, type);
				result = true;
			}
		}
		else {
			console.log(result);
			alert("视频直链解析失败！");
		}
	}
	catch (e) {
		console.log(e);
		alert("视频直链解析失败！");
	}
	return result;
}
function add0(m) {
	return m < 10 ? '0' + m : m;
}
function formattime(ts) {
	var time = new Date(ts * 1000);
	var y = time.getFullYear();
	var m = time.getMonth() + 1;
	var d = time.getDate();
	var h = time.getHours();
	var mm = time.getMinutes();
	var s = time.getSeconds();
	return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s);
}
var username = "UP主";
var uid = 0;
function appendComments(item, tabIndex) {
	var content = item.content.message;
	var uname = item.member.uname;
	var avatar = item.member.avatar + '@40w_40h.jpg';
	var ctime = formattime(item.ctime);
	$('.items').append('<div class="itemcomment" tabIndex="' + tabIndex + '"><div class="commenthead"> <div class="left_img"> <div class="head"> <img src="' +
		avatar + '"alt=""></div></div><div class="user-info"><p>' + uname + '</p><span>' + ctime + '</span></div> </div> <div class="comment"> <p>' + content + '</p></div></div>');
}
function getComments(page) {
	if (page) { }
	else {
		$('.items').empty();
		$('.items').append('正在加载…')
		commentpage = 1;
		page = 1;
	}
	url = 'https://api.bilibili.com/x/v2/reply?jsonp=jsonp&pn=' + page + '&type=1&sort=2&oid=' + aid;
	$.getJSON(url, function (result) {
		if (result.data.replies) {
			$('.items').empty();
			$.each(result.data.replies, function (r, item) {
				appendComments(item, r + '');
			})
		}
		else {
			alert("没有更多评论了！");
			return;
		}
		if (document.querySelectorAll('.itemcomment')[0]) {
			document.querySelectorAll('.itemcomment')[0].focus()
		}
	}).fail(function (jqXHR, status, error) {
		alert(error + ",请求可能被拦截");
	});
};
function getInfo() {
	$.getJSON('https://api.bilibili.com/x/web-interface/view?aid=' + aid, function (result) {
		var title = result.data.title;
		var view = result.data.stat.view;
		var danmaku = result.data.stat.danmaku;
		var like = result.data.stat.like;
		var coin = result.data.stat.coin;
		var favorite = result.data.stat.favorite;
		$('.items').empty();
		$('.items').append("<div class='item' id='title' tabIndex='0'><a id='title'>" + title + "</a><br><div id='info'><div id='view'><img src='../img/inside_icon/play/view.svg'><a id='view'>" + view + "</a></div><div id='danmaku'><img src='../img/inside_icon/play/danmaku.svg'><a id='danmaku'>" + danmaku + "</a></div></div></div>")
		$('.items').append("<div class='item' id='sanlian' tabIndex='1'><div id='like'><img src='../img/inside_icon/play/like.svg'><a id='like'>" + like + "</a></div><div id='coin'><img src='../img/inside_icon/play/coin.svg'><a id='coin'>" + coin + "</a></div><div id='favorite'><img src='../img/inside_icon/play/favorite.svg'><a id='favorite'>" + favorite + "</a></div></div>")
		$('.items').append("<div class='item' id='desc' tabIndex='2'><p>" + result.data.desc + "</p></div> ");
		uid = result.data.owner.mid;
		username = result.data.owner.name;
		getIsLike(uid);
		document.querySelectorAll('.item')[0].focus();
	});
}
function toggleFullScreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
	}
	else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}
}
function handleKeydown(e) {
	if (e.key != "EndCall")
		e.preventDefault();
	switch (e.key) {
		case 'ArrowUp':
			nav(-1);
			break;
		case 'ArrowDown':
			nav(1);
			break;
		case 'ArrowRight':
			tab(1);
			break;
		case 'ArrowLeft':
			tab(-1);
			break;
		case 'Enter':
			enter();
			break;
		case 'Backspace':
			if ($('#player').attr('class') == 'video_fullscreen') {
				document.exitFullscreen();
				$('#player').attr('class', 'video_normal');
			}
			else {
				var type = $.getQueryVar('type');
				if (type === false)
					window.location.href = '../index.html?ref=' + $.getQueryVar('ref');
				else {
					var id = $.getQueryVar('id');
					var mid = $.getQueryVar('mid');
					if (id === false && mid === false)
						window.location.href = '../' + type + '/index.html';
					else if (mid === false)
						window.location.href = '../' + type + '/index.html?id=' + id;
					else
						window.location.href = '../' + type + '/index.html?mid=' + mid;
				}
			}
			break;
		case 'Q':
		case 'SoftLeft':
			if ($('#softkey-left').text() === "全屏") {
				if ($('#player').attr('class') == 'video_normal') {
					document.documentElement.requestFullscreen();
					$('#player').attr('class', 'video_fullscreen');
				} else {
					document.exitFullscreen();
					$('#player').attr('class', 'video_normal');
				}
			}
			else if ($('#softkey-left').text() === "下一页") {
				commentpage += 1;
				getComments(commentpage);
			}
			else if ($('#softkey-left').text() === "播放") {
				var index = $('.pages').attr('data-index');
				if (typeof index != 'undefined') {
					index = parseInt(index) + 1;
					playV(index);
				}
			}
			break;
		case 'E':
		case 'SoftRight':
			SoftRight();
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
	}
}
function seekTo(type) {
	try {
		var player = document.getElementById('player');
		if (!isNaN(player.duration)) {
			var next = player.currentTime + (type * 10);
			if (next < 0)
				next = 0;
			else if (next > player.duration)
				next = player.duration;
			player.currentTime = next;
			player.play();
		}
	}
	catch (e) {
		console.log(e);
	}
}
function refreshLike() {
	$.ajaxSettings.async = false;
	var data = localStorage.getItem('like');
	data = JSON.parse(data);
	$.each(data, function (r, item) {
		ajax = $.getJSON('https://api.bilibili.com/x/space/acc/info?mid=' + item.uid, function (result) {
			data[r].pic = result.data.face
			data[r].nick = result.data.name
		})
		ajax = $.getJSON('https://api.bilibili.com/x/relation/stat?vmid=' + item.uid, function (result) {
			data[r].sub = result.data.follower
		})
	})
	localStorage.setItem('like', JSON.stringify(data))
	$.ajaxSettings.async = true;
}
function LikeUser(uid) {
	var result = localStorage.getItem('like')
	try {
		result = JSON.parse(result)
	}
	catch (e) {
		result = [];
	}
	result.push({ uid: uid });
	localStorage.setItem('like', JSON.stringify(result))
	refreshLike();
}
function UnLikeUser(uid) {
	var result = localStorage.getItem('like')
	try {
		result = JSON.parse(result)
	}
	catch (e) {
		result = [];
	}
	for (var i = 0; i < result.length; i++) {
		if (result[i].uid === uid) {
			result.splice(i, 1);
			i--;
		}
	}
	localStorage.setItem('like', JSON.stringify(result))
	refreshLike();
}
function SoftRight() {
	if (tab_location == 0 || tab_location == 1) {
		if ($('#softkey-right').text() === '加载中' || $('#player').attr('class') == 'video_fullscreen') {
			return;
		}
		var islike = $('#softkey-right').text() === '取消关注';
		if (islike) {
			if (confirm('确定取消关注"' + username + '"吗？')) {
				UnLikeUser(uid);
				$('#softkey-right').text('关注');
			}
		}
		else {
			if (confirm('确定关注"' + username + '"吗？')) {
				LikeUser(uid);
				$('#softkey-right').text('取消关注');
			}
		}
	}
	else if (tab_location == 2) {
		var text = prompt("请输入您的评论", "");
		if (text != '') {
			var result = $.sendComment(aid, text);
			try {
				if (result.success_action == 0)
					alert(result.success_toast);
			}
			catch (e) {
				alert('发送失败！');
			}
		}
	}
}
var tab_location = 0;
function nav(move) {
	if (tab_location === 0) {
		const currentIndex = document.activeElement.tabIndex;
		var next = currentIndex + move;
		const items = document.querySelectorAll('.item');
		if (next >= items.length) {
			next = items.length - 1;
		}
		else if (next < 0) {
			next = 0;
		}
		const targetElement = items[next];
		if (targetElement) {
			targetElement.focus();
		}
		if (next == 0) {
			$('.items').scrollTop(0);
		}
		if (next == 2) {
			$('#softkey-center').text('查看');
		} else {
			var video = document.getElementById("player");
			if (video.paused == true) {
				$('#softkey-center').text('播放');
			} else {
				$('#softkey-center').text('暂停');
			}
		}
	}
	else if (tab_location === 1) {
		var items = $('.pages').children();
		var index = $('.pages').attr('data-index');
		if (index == undefined)
			index = 0;
		else if (index < items.length) {
			index = parseInt(index);
			index += move;
		}
		if (typeof index == 'number') {
			$(items).removeClass('select');
			const targetElement = items[index];
			if (targetElement) {
				targetElement.focus();
				$(targetElement).addClass('select');
			}
			$('.pages').attr('data-index', index);
		}
	}
	else if (tab_location === 2) {
		const currentIndex = document.activeElement.tabIndex;
		var next = currentIndex + move;
		const items = document.querySelectorAll('.itemcomment');
		if (next >= items.length) {
			next = items.length - 1;
		}
		else if (next < 0) {
			next = 0;
		}
		const targetElement = items[next];
		if (targetElement) {
			targetElement.focus();
		}
		if (next == 0) {
			$('.items').scrollTop(0);
		}
	}
}
function tab(move) {
	const currentIndex = parseInt($('.focus').attr('tabIndex'));
	var next = currentIndex + move;
	if (season_type === false) {
		if (next > 2) {
			next = 0;
		}
		else if (next < 0) {
			next = 2;
		}
	}
	else {
		if (next == 1)
			next = 2;
		else if (next > 2)
			next = 0;
	}
	const items = document.querySelectorAll('li');
	const targetElement = items[next];
	if (targetElement) {
		$('.focus').attr("class", "");
		targetElement.className = "focus";
		tab_location = next;
		if (tab_location == 0) {
			$('#softkey-left').text('全屏');
			if (islike) {
				$('#softkey-right').text("取消关注");
			} else {
				$('#softkey-right').text("关注");
			}
		}
		else if (tab_location == 1) {
			$('#softkey-left').text('播放');
			$('#softkey-center').text('');
		}
		else if (tab_location == 2) {
			$('#softkey-left').text('下一页');
			$('#softkey-right').text('发表评论');
		}
		load()
	}
}
function load() {
	switch (tab_location) {
		case 0:
			$('.items').show();
			$('.pages').hide();
			getInfo();
			$('#softkey-center').text("")
			break;
		case 1:
			$('.items').hide();
			$('.pages').show();
			break;
		case 2:
			$('.items').show();
			$('.pages').hide();
			getComments();
			$('#softkey-center').text("查看")
			break;
	}
}
function enter() {
	switch (tab_location) {
		case 0:
			var currentIndex = document.activeElement.tabIndex;
			if (currentIndex == 2 && $('#player').attr('class') != 'video_fullscreen') {
				var items = document.querySelectorAll('.item');
				alert($(items[currentIndex]).text());
			}
			else {
				try {
					var video = document.getElementById("player");
					if (video.paused == true) {
						video.play();
						$('#softkey-center').text('暂停');
					} else {
						video.pause();
						$('#softkey-center').text('播放');
					}
				}
				catch (err) {
					alert(err);
				}
			}
			break;
		case 2:
			var currentIndex = document.activeElement.tabIndex;
			var items = document.querySelectorAll('.comment');
			alert($(items[currentIndex]).text());
			break;
	}
}
function getIsLike(uid) {
	var result = localStorage.getItem('like')
	try {
		result = JSON.parse(result)
	} catch (e) {
		localStorage.setItem('like', "[]")
		$('#softkey-right').text("关注");
		return;
	}
	islike = 0;
	for (var i = 0; i < result.length; i++) {
		if (result[i].uid === uid) {
			islike = 1;
			break;
		}
	}
	if (islike) {
		$('#softkey-right').text("取消关注");
	} else {
		$('#softkey-right').text("关注");
	}
}
function getParts() {
	var url = 'https://app.bilibili.com/x/v2/view?plat=0';
	if (aid === false)
		url += '&bvid=' + bvid;
	else
		url += '&aid=' + aid;
	var result = $.getApi(url);
	if (result.code == 0) {
		var pages = result.data.pages;
		if (pages != null && pages.length > 0) {
			for (var index = 0; index < pages.length; index++) {
				playInfos.push(new playinfo(aid, pages[index], 0));
				var html = '<div class="item" tabIndex="' + index + '">&nbsp;P' + pages[index].page + '&nbsp;&nbsp;' + pages[index].part + '</div>';
				$('.pages').append(html);
			}
			playV(1);
		}
	}
	else {
		alert('获取视频地址失败！' + result.message);
	}
}
let playInfos = [];