const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../application/lib/bili-media.js'), 'utf8');

function boot({ system = true, local = false, chunked = false } = {}) {
    const requests = [], revoked = [], pageEvents = {}, mutations = [];
    let blobIndex = 0;
    class Image {
        constructor() { this.nodeName = 'IMG'; this.nodeType = 1; this.attrs = {}; this.attached = true; }
        get src() { return this.attrs.src || ''; }
        set src(value) { this.attrs.src = value; }
        setAttribute(name, value) { this.attrs[name] = value; }
        getAttribute(name) { return this.attrs[name] || null; }
        removeAttribute(name) { delete this.attrs[name]; }
        querySelectorAll() { return []; }
    }
    class XHR {
        constructor() { this.headers = {}; this._responseType = ''; requests.push(this); }
        get responseType() { return this._responseType; }
        set responseType(type) { if (type !== 'moz-chunked-arraybuffer' || chunked) this._responseType = type; }
        open(method, url) { this.method = method; this.url = url; }
        setRequestHeader(name, value) { this.headers[name] = value; }
        getResponseHeader(name) { return (this.responseHeaders || {})[name] || null; }
        send() { this.sent = true; }
        abort() { this.aborted = true; if (this.onabort) this.onabort(); }
        complete(status, data, headers = {}) {
            this.status = status; this.response = data; this.responseHeaders = headers;
            this.readyState = 2;
            if (this.onreadystatechange) this.onreadystatechange();
            if (!this.aborted && this.onload) this.onload();
        }
    }
    const document = { nodeType: 9, querySelectorAll: () => [], documentElement: { contains: image => image.attached } };
    const $ = { htmlPrefilter: html => html, attrHooks: {}, ajaxSettings: {}, biliTransport: {
        systemXHR: system, localDebug: local, headers: { Referer: 'https://www.bilibili.com/',
            Origin: 'https://www.bilibili.com', 'User-Agent': 'test-client' }, createXHR: () => new XHR()
    } };
    class Observer {
        constructor(callback) { mutations.push(callback); }
        observe() {}
        disconnect() {}
    }
    class MediaURL extends URL {}
    MediaURL.createObjectURL = () => 'blob:test/' + (++blobIndex);
    MediaURL.revokeObjectURL = url => revoked.push(url);
    const window = { location: { href: 'app://kai.baiyang.bilibili/' }, URL: MediaURL,
        HTMLImageElement: Image, addEventListener: (event, callback) => { pageEvents[event] = callback; } };
    vm.runInNewContext(source, { window, jQuery: $, document, URL: MediaURL, MutationObserver: Observer,
        console, setTimeout, clearTimeout });
    return { media: $.biliMedia, $, requests, revoked, Image, pageEvents, mutations };
}

test('System media XHR adds headers and preserves signed CDN queries', () => {
    const { media } = boot();
    const xhr = media.request('http://video.bilivideo.com/a.mp4?sign=a%2Bb&x=1', 'arraybuffer');
    assert.equal(xhr.url, 'https://video.bilivideo.com/a.mp4?sign=a%2Bb&x=1');
    assert.equal(xhr.headers.Referer, 'https://www.bilibili.com/');
    assert.equal(xhr.headers.Origin, 'https://www.bilibili.com');
    assert.equal(xhr.headers['User-Agent'], 'test-client');
    assert.equal(xhr.headers.Cookie, undefined);
});

test('local media is same-origin and does not set forbidden headers', () => {
    const { media } = boot({ system: false, local: true });
    const xhr = media.request('//i0.hdslb.com/image.jpg', 'blob', { Range: 'bytes=0-99' });
    assert.match(xhr.url, /^\/__bili_media__\//);
    assert.equal(decodeURIComponent(xhr.url.split('/__bili_media__/')[1]), 'https://i0.hdslb.com/image.jpg');
    assert.deepEqual(xhr.headers, { Range: 'bytes=0-99' });
});

test('unsupported domains and unprivileged remote pages never make a request', () => {
    const { media, requests } = boot({ system: false });
    assert.throws(() => media.request('https://evil.test/image.jpg', 'blob'), /Unsupported/);
    assert.throws(() => media.request('https://i0.hdslb.com.evil.test/image.jpg', 'blob'), /Unsupported/);
    assert.throws(() => media.request('https://user:pass@i0.hdslb.com/image.jpg', 'blob'), /Unsupported/);
    assert.throws(() => media.request('https://i0.hdslb.com/image.jpg', 'blob'), /systemXHR permission/);
    assert.equal(requests.length, 0);
});

test('range reads validate Content-Range and reject full downloads at headers', () => {
    const { media } = boot();
    let result;
    const xhr = media.rangeRequest('https://v.bilivideo.com/a.mp4', 10, 19, (...args) => { result = args; });
    assert.equal(xhr.headers.Range, 'bytes=10-19');
    xhr.complete(206, new ArrayBuffer(10), { 'Content-Range': 'bytes 10-19/100', 'Content-Length': '10' });
    assert.equal(result[0], null);
    assert.equal(result[2], 100);
    let failures = 0;
    const bad = media.rangeRequest('https://v.bilivideo.com/a.mp4', 10, 19, error => { assert.ok(error); failures++; });
    bad.complete(200, null, { 'Content-Length': '10000000' });
    assert.equal(bad.aborted, true);
    assert.equal(failures, 1);
});

test('markup is rewritten before insertion while local/data images remain native', () => {
    const { $ } = boot();
    const html = $.htmlPrefilter('<img src="https://i0.hdslb.com/a.jpg?x=1&amp;y=2"><img src="../icon.svg"><img src="data:image/png;base64,AAA">');
    assert.match(html, /data-bili-src="https:\/\/i0\.hdslb\.com\/a.jpg\?x=1&amp;y=2"/);
    assert.match(html, /src="\.\.\/icon.svg"/);
    assert.match(html, /src="data:image/);
});

test('changing image URL cancels stale responses and revokes replaced/removed blobs', () => {
    const { Image, requests, revoked, mutations } = boot();
    const image = new Image();
    image.src = 'https://i0.hdslb.com/a.jpg';
    const old = requests[0];
    image.src = 'https://i0.hdslb.com/b.jpg';
    assert.equal(old.aborted, true);
    requests[1].complete(200, { size: 100 });
    const blob = image.src;
    assert.match(blob, /^blob:/);
    old.onload();
    assert.equal(image.src, blob);
    image.attached = false;
    mutations[0]([]);
    assert.deepEqual(revoked, [blob]);
});

test('failed images can retry the same URL', () => {
    const { Image, requests } = boot();
    const image = new Image();
    const url = 'https://i0.hdslb.com/a.jpg';
    image.src = url;
    requests[0].complete(403, null);
    image.src = url;
    assert.equal(requests.length, 2);
    requests[1].complete(200, { size: 100 });
    assert.match(image.src, /^blob:/);
    assert.equal(image.getAttribute('data-bili-error'), null);
});

test('image requests have a concurrency cap and pagehide cancels pending work', () => {
    const { Image, requests, pageEvents } = boot();
    for (let i = 0; i < 12; i++) new Image().src = 'https://i0.hdslb.com/' + i + '.jpg';
    assert.equal(requests.length, 4);
    requests[0].complete(200, { size: 100 });
    assert.equal(requests.length, 5);
    pageEvents.pagehide();
    assert.equal(requests.length, 5);
    assert.ok(requests.slice(1).every(xhr => xhr.aborted));
});

test('FLV chunked loader reports byte offsets and cancels late chunks', () => {
    const { media, requests } = boot({ chunked: true });
    const loader = new media.XHRLoader();
    const chunks = [];
    loader.onDataArrival = (buffer, offset, total) => chunks.push([buffer.byteLength, offset, total]);
    loader.open({ url: 'https://live.bilivideo.com/live.flv', isLive: true }, { from: 0, to: -1 });
    const xhr = requests[0];
    assert.equal(xhr.responseType, 'moz-chunked-arraybuffer');
    assert.ok(xhr.headers.Referer);
    xhr.response = new ArrayBuffer(12); xhr.onprogress();
    xhr.response = new ArrayBuffer(8); xhr.onprogress();
    assert.deepEqual(chunks, [[12, 0, 12], [8, 12, 20]]);
    loader.abort(); xhr.onprogress();
    assert.equal(chunks.length, 2);
    assert.equal(loader.isWorking(), false);
});

test('FLV rejects an ignored finite range starting at zero', () => {
    const { media, requests } = boot({ chunked: true });
    const loader = new media.XHRLoader();
    let error;
    loader.onError = (type, details) => { error = details; };
    loader.open({ url: 'https://v.bilivideo.com/video.flv' }, { from: 0, to: 99 });
    requests[0].complete(200, null);
    assert.ok(error);
    assert.ok(requests[0].aborted);
});

test('MP4 destruction cancels reads, clears media src, revokes Blob and removes listeners', () => {
    const { media, requests, revoked } = boot();
    const events = {};
    const video = { currentTime: 0, pause() {}, load() {}, removeAttribute(name) { this.removed = name; },
        addEventListener(name, fn) { events[name] = fn; }, removeEventListener(name) { delete events[name]; } };
    const player = new media.MP4Player('https://v.bilivideo.com/a.mp4');
    player.attachMediaElement(video);
    player.xhr = media.request(player.url, 'arraybuffer');
    player.objectURL = 'blob:test/video';
    player.parser = { stop() { this.stopped = true; } };
    const parser = player.parser;
    player.destroy();
    assert.ok(requests[0].aborted);
    assert.ok(parser.stopped);
    assert.equal(video.removed, 'src');
    assert.deepEqual(revoked, ['blob:test/video']);
    assert.deepEqual(events, {});
});

test('MP4 failures notify once and release parser, buffer queues and object URL', () => {
    const { media, revoked } = boot();
    const player = new media.MP4Player('https://v.bilivideo.com/a.mp4');
    player.objectURL = 'blob:test/failure';
    player.parser = { stop() {} };
    player.slots = [{ queue: [new ArrayBuffer(100)] }];
    let errors = 0;
    player.on('error', () => errors++);
    player.fail(new Error('decoder failed'));
    player.fail(new Error('decoder failed again'));
    assert.equal(errors, 1);
    assert.equal(player.parser, null);
    assert.equal(player.mediaSource, null);
    assert.equal(player.slots.length, 0);
    assert.deepEqual(revoked, ['blob:test/failure']);
});
