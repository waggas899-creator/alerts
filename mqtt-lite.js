/* Minimal MQTT 3.1.1 client over WebSocket (QoS 0, retain, keepalive, auto-reconnect).
   Works in the browser (global WebSocket) and in Node (pass the `ws` constructor). */
(function (root) {
  'use strict';
  const te = new TextEncoder(), td = new TextDecoder();
  function lenBytes(n) { const o = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; o.push(b); } while (n > 0); return o; }
  function str(s) { const b = te.encode(s); return [b.length >> 8, b.length & 255, ...b]; }
  function packet(type, flags, body) { const h = [(type << 4) | flags, ...lenBytes(body.length)]; const out = new Uint8Array(h.length + body.length); out.set(h, 0); out.set(body, h.length); return out; }
  function concat(a, b) { const o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }

  class MqttLite {
    constructor(url, opts = {}) {
      this.url = url;
      this.WS = opts.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null);
      this.keepalive = opts.keepalive || 30;
      this.clientId = opts.clientId || ('wg' + Math.random().toString(36).slice(2, 12));
      this.subs = new Set();
      this.handlers = { message: [], connect: [], close: [] };
      this.buf = new Uint8Array(0);
      this.connected = false; this.closed = false; this.retry = 1000; this.pid = 1;
      this.open();
    }
    on(ev, fn) { (this.handlers[ev] || (this.handlers[ev] = [])).push(fn); return this; }
    emit(ev, ...a) { for (const f of this.handlers[ev] || []) { try { f(...a); } catch (e) { } } }
    open() {
      if (this.closed || !this.WS) return;
      let ws;
      try { ws = this.ws = new this.WS(this.url, 'mqtt'); } catch (e) { return this.later(); }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        const flags = 0x02; // clean session
        const body = [...str('MQTT'), 4, flags, this.keepalive >> 8, this.keepalive & 255, ...str(this.clientId)];
        this.raw(packet(1, 0, Uint8Array.from(body)));
      };
      ws.onmessage = (e) => { const d = e.data instanceof ArrayBuffer ? new Uint8Array(e.data) : new Uint8Array(e.data.buffer ? e.data.buffer.slice(e.data.byteOffset, e.data.byteOffset + e.data.byteLength) : e.data); this.buf = concat(this.buf, d); this.parse(); };
      ws.onclose = () => { const was = this.connected; this.connected = false; clearInterval(this.ping); if (was) this.emit('close'); this.later(); };
      ws.onerror = () => { try { ws.close(); } catch (e) { } };
    }
    later() { if (this.closed) return; clearTimeout(this.rt); this.rt = setTimeout(() => this.open(), this.retry); this.retry = Math.min(this.retry * 2, 15000); }
    raw(u8) { try { if (this.ws && this.ws.readyState === 1) this.ws.send(u8); } catch (e) { } }
    parse() {
      for (;;) {
        const b = this.buf; if (b.length < 2) return;
        let mul = 1, len = 0, i = 1, byte;
        do { if (i >= b.length) return; byte = b[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128);
        if (b.length < i + len) return;
        const type = b[0] >> 4, flags = b[0] & 15, body = b.subarray(i, i + len);
        this.buf = b.slice(i + len);
        if (type === 2) { // CONNACK
          if (body[1] === 0) {
            this.connected = true; this.retry = 1000;
            clearInterval(this.ping); this.ping = setInterval(() => this.raw(Uint8Array.from([0xc0, 0])), this.keepalive * 600);
            for (const t of this.subs) this.sendSub(t);
            this.emit('connect');
          } else { try { this.ws.close(); } catch (e) { } }
        } else if (type === 3) { // PUBLISH
          const tl = (body[0] << 8) | body[1];
          const topic = td.decode(body.subarray(2, 2 + tl));
          let p = 2 + tl; const qos = (flags >> 1) & 3;
          if (qos > 0) p += 2;
          this.emit('message', topic, td.decode(body.subarray(p)), !!(flags & 1));
        }
      }
    }
    sendSub(topic) { const id = this.pid = (this.pid % 65000) + 1; this.raw(packet(8, 2, Uint8Array.from([id >> 8, id & 255, ...str(topic), 0]))); }
    subscribe(topic) { this.subs.add(topic); if (this.connected) this.sendSub(topic); }
    publish(topic, payload, retain) {
      if (!this.connected) return false;
      const p = te.encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
      const head = Uint8Array.from(str(topic));
      this.raw(packet(3, retain ? 1 : 0, concat(head, p)));
      return true;
    }
    end() { this.closed = true; clearInterval(this.ping); clearTimeout(this.rt); try { this.ws && this.ws.close(); } catch (e) { } }
  }
  MqttLite.BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  if (typeof module !== 'undefined' && module.exports) module.exports = MqttLite; else root.MqttLite = MqttLite;
})(typeof self !== 'undefined' ? self : this);
