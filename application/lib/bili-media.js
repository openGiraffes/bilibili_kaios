/* Bilibili images and streaming media transport. Requires app.js; MP4 also requires MP4Box. */
(function (global, $) {
    'use strict';
    var transport = $.biliTransport;
    var CHUNK = 256 * 1024;
    var CDN = /(^|\.)(bilibili\.com|hdslb\.com|bilivideo\.com|bilivideo\.cn|acgvideo\.com|szbdyd\.com)$/i;

    function mediaURL(url) {
        if (url.slice(0, 2) === '//') url = 'https:' + url;
        var parsed = new URL(url, global.location.href);
        if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || !CDN.test(parsed.hostname)) {
            throw new Error('Unsupported media address');
        }
        parsed.protocol = 'https:';
        return parsed.href;
    }
    function isMediaURL(url) {
        try { mediaURL(url); return true; } catch (error) { return false; }
    }
    function request(url, responseType, headers) {
        var target = mediaURL(url);
        if (!transport.systemXHR && !transport.localDebug) {
            throw new Error('Media requests require systemXHR permission or the local debug proxy');
        }
        var xhr = transport.createXHR();
        xhr.open('GET', transport.localDebug ? '/__bili_media__/' + encodeURIComponent(target) : target, true);
        xhr.responseType = responseType;
        xhr.timeout = 30000;
        if (transport.systemXHR) {
            ['Referer', 'Origin', 'User-Agent'].forEach(function (name) {
                xhr.setRequestHeader(name, transport.headers[name]);
            });
        }
        Object.keys(headers || {}).forEach(function (name) { xhr.setRequestHeader(name, headers[name]); });
        return xhr;
    }
    function safePlay(element) {
        var promise = element.play();
        if (promise && promise.catch) promise.catch(function (error) {
            // Rebuilding MSE on seek can interrupt a pending play() promise.
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') console.error(error);
        });
    }
    function rangeRequest(url, start, end, callback) {
        var xhr = request(url, 'arraybuffer', { Range: 'bytes=' + start + '-' + end });
        var finished = false;
        function fail(message) {
            if (finished) return;
            finished = true;
            xhr.abort();
            callback(new Error(message));
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 2) return;
            // Refuse a full-file response before it can exhaust phone memory.
            if (xhr.status !== 206) fail('Media server must support byte ranges (HTTP ' + xhr.status + ')');
            var length = Number(xhr.getResponseHeader('Content-Length'));
            if (length > end - start + 1) fail('Media range response is too large');
        };
        xhr.onprogress = function (event) {
            if (event.loaded > end - start + 1) fail('Media server ignored the requested range');
        };
        xhr.onload = function () {
            if (finished) return;
            var match = /^bytes (\d+)-(\d+)\/(\d+)$/i.exec(xhr.getResponseHeader('Content-Range') || '');
            if (xhr.status !== 206 || !match || Number(match[1]) !== start || Number(match[2]) > end
                || !xhr.response || xhr.response.byteLength !== Number(match[2]) - start + 1) {
                fail('Invalid media range response');
                return;
            }
            finished = true;
            callback(null, xhr.response, Number(match[3]));
        };
        xhr.onerror = function () { fail('Media network error'); };
        xhr.ontimeout = function () { fail('Media request timed out'); };
        xhr.send();
        return xhr;
    }

    // Images inserted with jQuery are rewritten before insertion, so their original
    // remote src is never assigned to a live <img>. Attribute/property updates use
    // the same path; local icons and QR-code data URLs keep their normal behavior.
    var images = [], pendingImages = [], activeImages = 0, imageObserver;
    var nativeSrc = Object.getOwnPropertyDescriptor(global.HTMLImageElement.prototype, 'src');
    function imageCleanup(image) {
        var state = image._biliImage;
        if (!state) return;
        image._biliImage = null;
        if (state.xhr) state.xhr.abort();
        if (state.blob) global.URL.revokeObjectURL(state.blob);
        var index = images.indexOf(image);
        if (index !== -1) images.splice(index, 1);
    }
    function imageSet(image, url) {
        if (!isMediaURL(url)) {
            if (image._biliImage && image._biliImage.blob === url) return;
            imageCleanup(image);
            image.removeAttribute('data-bili-src');
            nativeSrc.set.call(image, url);
            return;
        }
        if (image._biliImage && image._biliImage.url === url && !image._biliImage.failed) return;
        imageCleanup(image);
        image.removeAttribute('src');
        image.removeAttribute('data-bili-error');
        image.setAttribute('data-bili-src', url);
        var state = { url: url, xhr: null, blob: null };
        image._biliImage = state;
        images.push(image);
        pendingImages.push({ image: image, state: state });
        imagePump();
    }
    function imagePump() {
        while (activeImages < 4 && pendingImages.length) {
            var item = pendingImages.shift();
            if (item.image._biliImage !== item.state) continue;
            imageLoad(item);
        }
    }
    function imageLoad(item) {
        var image = item.image, state = item.state, xhr, done = false;
        activeImages++;
        function complete(error) {
            if (done) return;
            done = true;
            activeImages--;
            state.xhr = null;
            if (image._biliImage === state) {
                if (!error && xhr.status >= 200 && xhr.status < 300 && xhr.response && xhr.response.size) {
                    state.blob = global.URL.createObjectURL(xhr.response);
                    nativeSrc.set.call(image, state.blob);
                } else {
                    state.failed = true;
                    image.setAttribute('data-bili-error', 'Image request failed');
                }
            }
            imagePump();
        }
        try {
            xhr = request(state.url, 'blob');
            state.xhr = xhr;
            xhr.onload = function () { complete(false); };
            xhr.onerror = xhr.ontimeout = xhr.onabort = function () { complete(true); };
            xhr.onprogress = function (event) { if (event.loaded > 4 * 1024 * 1024) xhr.abort(); };
            xhr.send();
        } catch (error) { complete(true); }
    }
    function imageScan(node) {
        if (node.nodeType !== 1 && node.nodeType !== 9) return;
        if (node.nodeName === 'IMG') {
            var source = node.getAttribute('data-bili-src') || node.getAttribute('src');
            if (source && isMediaURL(source)) imageSet(node, source);
        }
        var children = node.querySelectorAll('img[data-bili-src], img[src]');
        for (var i = 0; i < children.length; i++) imageScan(children[i]);
    }
    function initImages() {
        var prefilter = $.htmlPrefilter;
        $.htmlPrefilter = function (html) {
            html = prefilter(html);
            return html.replace(/<img\b[^>]*>/gi, function (tag) {
                return tag.replace(/(\s)src\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, function (attribute, space, value) {
                    var url = /^['"]/.test(value) ? value.slice(1, -1) : value;
                    return isMediaURL(url) ? space + 'data-bili-src=' + value : attribute;
                });
            });
        };
        var previousHook = $.attrHooks.src;
        $.attrHooks.src = {
            set: function (element, value, name) {
                if (element.nodeName === 'IMG') { imageSet(element, String(value)); return value; }
                if (previousHook && previousHook.set) return previousHook.set(element, value, name);
            }
        };
        Object.defineProperty(global.HTMLImageElement.prototype, 'src', {
            configurable: true, enumerable: nativeSrc.enumerable, get: nativeSrc.get,
            set: function (value) { imageSet(this, String(value)); }
        });
        imageObserver = new MutationObserver(function (records) {
            records.forEach(function (record) {
                if (record.type === 'attributes') {
                    var image = record.target, source = image.getAttribute('src');
                    if (record.attributeName === 'src' && image.nodeName === 'IMG' && source && !/^blob:/.test(source)) {
                        imageSet(image, source);
                    } else imageScan(image);
                }
                else for (var i = 0; i < record.addedNodes.length; i++) imageScan(record.addedNodes[i]);
            });
            images.slice().forEach(function (image) {
                if (!document.documentElement.contains(image)) imageCleanup(image);
            });
        });
        imageObserver.observe(document.documentElement, { childList: true, subtree: true,
            attributes: true, attributeFilter: ['src', 'data-bili-src'] });
        imageScan(document);
        global.addEventListener('pagehide', function () {
            imageObserver.disconnect();
            pendingImages = [];
            images.slice().forEach(imageCleanup);
        });
    }

    // flv.js customLoader contract. Chunked XHR is preferred for live streams;
    // finite videos also work with bounded byte-range XHR on other runtimes.
    function XHRLoader() {
        this.type = 'bili-system-xhr';
        this.status = 0;
        this.needStashBuffer = false;
        this.xhr = null;
        this.generation = 0;
    }
    XHRLoader.prototype.isWorking = function () { return this.status === 1 || this.status === 2; };
    XHRLoader.prototype.destroy = function () { this.abort(); };
    XHRLoader.prototype.abort = function () {
        this.generation++;
        this.status = 0;
        if (this.xhr) this.xhr.abort();
        if (this.controller) this.controller.abort();
        if (this.reader) this.reader.cancel().catch(function () { });
        this.xhr = null;
        this.controller = null;
        this.reader = null;
    };
    XHRLoader.prototype.open = function (source, range) {
        this.abort();
        var self = this, generation = this.generation, received = 0;
        var from = range.from || 0, offset = from, total = null;
        this.status = 1;
        function error(message, code) {
            if (generation !== self.generation) return;
            self.status = 3;
            if (self.onError) self.onError('Exception', { code: code || -1, msg: message });
        }
        function arrive(buffer) {
            if (!buffer || !buffer.byteLength) return;
            self.status = 2;
            received += buffer.byteLength;
            if (self.onDataArrival) self.onDataArrival(buffer, offset, received);
            offset += buffer.byteLength;
        }
        var xhr;
        try {
            xhr = request(source.url, 'arraybuffer');
            try { xhr.responseType = 'moz-chunked-arraybuffer'; } catch (unsupported) { }
            if (xhr.responseType === 'moz-chunked-arraybuffer') {
                self.xhr = xhr;
                // Seeking needs Range even with a streaming XHR loader.
                var ranged = from > 0 || range.to >= 0;
                if (ranged) xhr.setRequestHeader('Range', 'bytes=' + from + '-' + (range.to >= 0 ? range.to : ''));
                xhr.timeout = 0;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== 2) return;
                    var contentRange = /^bytes (\d+)-(\d+)\/(\d+)$/i.exec(xhr.getResponseHeader('Content-Range') || '');
                    if (xhr.status < 200 || xhr.status >= 300 || (ranged && (xhr.status !== 206 || !contentRange
                        || Number(contentRange[1]) !== from || (range.to >= 0 && Number(contentRange[2]) > range.to)))) {
                        error('Invalid FLV HTTP range/status ' + xhr.status, xhr.status); xhr.abort();
                    }
                };
                xhr.onprogress = function () { if (generation === self.generation && self.status !== 3) arrive(xhr.response); };
                xhr.onload = function () {
                    if (generation !== self.generation || self.status === 3) return;
                    self.status = 4;
                    if (self.onComplete) self.onComplete(from, offset - 1);
                };
                xhr.onerror = function () { error('FLV network error'); };
                xhr.send();
                return;
            }
        } catch (exception) { error(exception.message); return; }
        if (source.isLive) {
            // Local browsers have no moz-chunked-arraybuffer. Fetch reads only
            // the same-origin proxy; all upstream headers are set by the server.
            if (transport.localDebug && global.fetch && global.ReadableStream && global.AbortController) {
                self.controller = new AbortController();
                global.fetch('/__bili_media__/' + encodeURIComponent(mediaURL(source.url)), {
                    signal: self.controller.signal
                }).then(function (response) {
                    if (generation !== self.generation) return;
                    if (!response.ok || !response.body) throw new Error('Live HTTP ' + response.status);
                    self.reader = response.body.getReader();
                    function read() {
                        return self.reader.read().then(function (result) {
                            if (generation !== self.generation) return;
                            if (result.done) {
                                self.status = 4;
                                if (self.onComplete) self.onComplete(from, offset - 1);
                                return;
                            }
                            var data = result.value;
                            arrive(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                            return read();
                        });
                    }
                    return read();
                }).catch(function (failure) { error(failure.message); });
                return;
            }
            error('Live FLV requires moz-chunked-arraybuffer on this runtime');
            return;
        }
        function next() {
            if (generation !== self.generation) return;
            var end = offset + CHUNK - 1;
            if (range.to >= 0) end = Math.min(end, range.to);
            if (total !== null) end = Math.min(end, total - 1);
            if (end < offset) {
                self.status = 4;
                if (self.onComplete) self.onComplete(from, offset - 1);
                return;
            }
            self.xhr = rangeRequest(source.url, offset, end, function (failure, buffer, size) {
                if (generation !== self.generation) return;
                if (failure) { error(failure.message); return; }
                if (total === null) {
                    total = size;
                    if (self.onContentLengthKnown) self.onContentLengthKnown(size - from);
                }
                arrive(buffer);
                setTimeout(next, 0);
            });
        }
        next();
    };

    function MP4Player(url) {
        this.url = mediaURL(url);
        this.video = null;
        this.epoch = 0;
        this.playRequested = false;
        this.listeners = {};
        this.slots = [];
        this.objectURL = null;
        this.xhr = null;
    }
    MP4Player.prototype.on = function (event, callback) { this.listeners[event] = callback; };
    MP4Player.prototype.fail = function (error) {
        if (this.failed) return;
        this.failed = true;
        var callback = this.listeners.error;
        this.unload();
        if (callback) callback(error.message);
        else console.error(error.message);
    };
    MP4Player.prototype.attachMediaElement = function (video) {
        this.video = video;
        var self = this;
        this.tick = function () { self.drain(); };
        this.playState = function () { if (!self.settingTime) self.playRequested = !video.paused; };
        this.seeking = function () {
            if (self.settingTime || !self.parser || !self.ready) return;
            var time = video.currentTime, buffered = video.buffered;
            for (var i = 0; i < buffered.length; i++) {
                if (time >= buffered.start(i) && time < buffered.end(i)) { self.drain(); return; }
            }
            self.load(time);
        };
        video.addEventListener('timeupdate', this.tick);
        video.addEventListener('seeking', this.seeking);
        video.addEventListener('play', this.playState);
        video.addEventListener('pause', this.playState);
    };
    MP4Player.prototype.unload = function () {
        this.epoch++;
        this.settingTime = true;
        if (this.xhr) this.xhr.abort();
        this.xhr = null;
        if (this.parser) this.parser.stop();
        this.parser = null;
        this.slots = [];
        if (this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); }
        if (this.objectURL) global.URL.revokeObjectURL(this.objectURL);
        this.objectURL = null;
        this.mediaSource = null;
    };
    MP4Player.prototype.detachMediaElement = function () {
        if (!this.video) return;
        this.video.removeEventListener('timeupdate', this.tick);
        this.video.removeEventListener('seeking', this.seeking);
        this.video.removeEventListener('play', this.playState);
        this.video.removeEventListener('pause', this.playState);
        this.video = null;
    };
    MP4Player.prototype.destroy = function () { this.unload(); this.detachMediaElement(); this.listeners = {}; };
    MP4Player.prototype.play = function () {
        this.playRequested = true;
        safePlay(this.video);
    };
    MP4Player.prototype.load = function (time) {
        this.unload();
        var self = this, epoch = this.epoch;
        this.targetTime = time || 0;
        this.settingTime = true;
        this.failed = false;
        this.ready = false;
        this.eof = false;
        this.reading = false;
        this.offset = 0;
        this.jump = undefined;
        this.total = null;
        if (!global.MediaSource || !global.MP4Box) { this.fail(new Error('MP4 streaming requires MediaSource and MP4Box')); return; }
        this.mediaSource = new MediaSource();
        this.objectURL = global.URL.createObjectURL(this.mediaSource);
        this.video.src = this.objectURL;
        function sourceOpened() {
            if (epoch !== self.epoch) return;
            self.mediaSource.removeEventListener('sourceopen', sourceOpened);
            var parser = self.parser = global.MP4Box.createFile(false);
            parser.onError = function (error) {
                if (epoch === self.epoch) self.fail(new Error('MP4 parse error: ' + error));
            };
            parser.onSegment = function (id, slot, buffer, sample) {
                if (epoch !== self.epoch) return;
                slot.queue.push(buffer);
                parser.releaseUsedSamples(id, sample);
                self.drain();
            };
            parser.onReady = function (info) {
                if (epoch !== self.epoch) return;
                try {
                    self.mediaSource.duration = info.duration / info.timescale;
                    // Seek-to-end should select the final sample rather than
                    // leave initialization waiting for an impossible interval.
                    self.targetTime = Math.min(self.targetTime, Math.max(0, self.mediaSource.duration - 0.05));
                    var tracks = info.tracks.filter(function (track) { return track.video || track.audio; });
                    if (!tracks.length) throw new Error('MP4 has no playable tracks');
                    tracks.forEach(function (track) {
                        var mime = (track.video ? 'video' : 'audio') + '/mp4; codecs="' + track.codec + '"';
                        if (!MediaSource.isTypeSupported(mime)) throw new Error('Unsupported media codec: ' + track.codec);
                        var slot = { buffer: self.mediaSource.addSourceBuffer(mime), queue: [] };
                        self.slots.push(slot);
                        slot.buffer.addEventListener('updateend', function () { if (epoch === self.epoch) self.drain(); });
                        slot.buffer.addEventListener('error', function () { if (epoch === self.epoch) self.fail(new Error('MediaSource decode error')); });
                        parser.setSegmentOptions(track.id, slot, { nbSamples: track.video ? 30 : 60, rapAlignement: true });
                    });
                    parser.initializeSegmentation().forEach(function (segment) { segment.user.queue.push(segment.buffer); });
                    self.ready = true;
                    // Rebuild the parser/MSE on an unbuffered seek: MP4Box 0.5.x
                    // has no public API to discard an unfinished old segment.
                    self.jump = parser.seek(self.targetTime, true).offset;
                    parser.start();
                    self.drain();
                } catch (error) { self.fail(error); }
            };
            self.pump();
        }
        this.mediaSource.addEventListener('sourceopen', sourceOpened);
    };
    MP4Player.prototype.drain = function () {
        if (this.failed || !this.parser || this.mediaSource.readyState !== 'open') return;
        var self = this;
        try {
            this.slots.forEach(function (slot) {
                var buffer = slot.buffer;
                if (buffer.updating) return;
                var cutoff = self.video.currentTime - 15;
                if (cutoff > 0 && buffer.buffered.length && buffer.buffered.start(0) < cutoff - 2) {
                    buffer.remove(0, cutoff);
                    return;
                }
                if (slot.queue.length) buffer.appendBuffer(slot.queue.shift());
            });
            if (this.settingTime && this.ready && this.video.readyState > 0) {
                var available = this.video.buffered;
                for (var i = 0; i < available.length; i++) {
                    if (this.targetTime >= available.start(i) - 0.25 && this.targetTime < available.end(i)) {
                        this.video.currentTime = Math.max(this.targetTime, available.start(i));
                        this.settingTime = false;
                        if (this.playRequested) this.play();
                        break;
                    }
                }
            }
            if (this.eof && !this.reading && this.slots.every(function (slot) { return !slot.queue.length && !slot.buffer.updating; })) {
                this.mediaSource.endOfStream();
            } else this.pump();
        } catch (error) { this.fail(error); }
    };
    MP4Player.prototype.pump = function () {
        if (this.failed || this.reading || this.eof || !this.parser) return;
        if (this.slots.some(function (slot) { return slot.queue.length >= 3; })) return;
        var buffered = this.video.buffered;
        var time = this.settingTime ? this.targetTime : this.video.currentTime;
        for (var i = 0; i < buffered.length; i++) {
            if (time >= buffered.start(i) && buffered.end(i) - time > 20) return;
        }
        if (this.total !== null && this.offset >= this.total) {
            if (!this.ready) { this.fail(new Error('MP4 metadata was not found')); return; }
            this.eof = true;
            this.reading = true;
            this.parser.flush();
            this.reading = false;
            this.drain();
            return;
        }
        var self = this, epoch = this.epoch, start = this.offset;
        var end = start + CHUNK - 1;
        if (this.total !== null) end = Math.min(end, this.total - 1);
        this.reading = true;
        try {
            this.xhr = rangeRequest(this.url, start, end, function (error, buffer, total) {
                if (epoch !== self.epoch) return;
                if (error) { self.reading = false; self.fail(error); return; }
                self.total = total;
                buffer.fileStart = start;
                try {
                    var next = self.parser.appendBuffer(buffer);
                    self.offset = self.jump !== undefined ? self.jump : next;
                    self.jump = undefined;
                    if (!Number.isFinite(self.offset) || self.offset < 0) throw new Error('Invalid MP4 read offset');
                    if (self.offset === start) self.offset = start + buffer.byteLength;
                    self.reading = false;
                    self.drain();
                } catch (exception) { self.reading = false; self.fail(exception); }
            });
        } catch (error) { this.reading = false; this.fail(error); }
    };
    Object.defineProperty(MP4Player.prototype, 'currentTime', {
        get: function () { return this.video.currentTime; },
        set: function (time) { this.load(time); }
    });
    var players = [];
    $.biliMedia = {
        request: request,
        rangeRequest: rangeRequest,
        mediaURL: mediaURL,
        XHRLoader: XHRLoader,
        MP4Player: MP4Player,
        setImage: imageSet,
        play: safePlay,
        createPlayer: function (source) {
            var player;
            source.url = mediaURL(source.url);
            if (source.type === 'flv') {
                player = global.flvjs.createPlayer(source, { customLoader: XHRLoader, enableWorker: false,
                    autoCleanupSourceBuffer: true, autoCleanupMaxBackwardDuration: 30, autoCleanupMinBackwardDuration: 15 });
                // The bundled fork overwrites jQuery's factory in createPlayer.
                $.ajaxSettings.xhr = transport.createXHR;
            } else player = new MP4Player(source.url);
            players.push(player);
            var destroy = player.destroy;
            var destroyed = false;
            player.destroy = function () {
                if (destroyed) return;
                destroyed = true;
                var index = players.indexOf(player);
                if (index !== -1) players.splice(index, 1);
                destroy.call(player);
            };
            if (source.type === 'flv') {
                player.on('error', function () {
                    // Finish the library's current error dispatch before tearing
                    // down its decoder, source buffer and streaming connection.
                    setTimeout(function () { player.destroy(); }, 0);
                });
            }
            return player;
        }
    };
    global.addEventListener('pagehide', function () { players.slice().forEach(function (player) { player.destroy(); }); });
    initImages();
}(window, jQuery));
