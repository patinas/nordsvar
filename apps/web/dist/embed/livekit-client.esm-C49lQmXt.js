function yl(i, e) {
  return e.forEach(function(t) {
    t && typeof t != "string" && !Array.isArray(t) && Object.keys(t).forEach(function(n) {
      if (n !== "default" && !(n in i)) {
        var r = Object.getOwnPropertyDescriptor(t, n);
        Object.defineProperty(i, n, r.get ? r : { enumerable: !0, get: function() {
          return t[n];
        } });
      }
    });
  }), Object.freeze(i);
}
var kl = Object.defineProperty, Tl = (i, e, t) => e in i ? kl(i, e, {
  enumerable: !0,
  configurable: !0,
  writable: !0,
  value: t
}) : i[e] = t, aa = (i, e, t) => Tl(i, typeof e != "symbol" ? e + "" : e, t);
class ue {
  constructor() {
    aa(this, "_locking"), aa(this, "_locks"), this._locking = Promise.resolve(), this._locks = 0;
  }
  isLocked() {
    return this._locks > 0;
  }
  lock() {
    this._locks += 1;
    let e;
    const t = new Promise((r) => e = () => {
      this._locks -= 1, r();
    }), n = this._locking.then(() => e);
    return this._locking = this._locking.then(() => t), n;
  }
}
function ie(i, e) {
  if (!i)
    throw new Error(e);
}
const Sl = 34028234663852886e22, Cl = -34028234663852886e22, El = 4294967295, wl = 2147483647, _l = -2147483648;
function ri(i) {
  if (typeof i != "number") throw new Error("invalid int 32: " + typeof i);
  if (!Number.isInteger(i) || i > wl || i < _l) throw new Error("invalid int 32: " + i);
}
function qr(i) {
  if (typeof i != "number") throw new Error("invalid uint 32: " + typeof i);
  if (!Number.isInteger(i) || i > El || i < 0) throw new Error("invalid uint 32: " + i);
}
function Uo(i) {
  if (typeof i != "number") throw new Error("invalid float 32: " + typeof i);
  if (Number.isFinite(i) && (i > Sl || i < Cl))
    throw new Error("invalid float 32: " + i);
}
const Fo = Symbol("@bufbuild/protobuf/enum-type");
function Pl(i) {
  const e = i[Fo];
  return ie(e, "missing enum type on enum object"), e;
}
function Bo(i, e, t, n) {
  i[Fo] = qo(e, t.map((r) => ({
    no: r.no,
    name: r.name,
    localName: i[r.no]
  })));
}
function qo(i, e, t) {
  const n = /* @__PURE__ */ Object.create(null), r = /* @__PURE__ */ Object.create(null), s = [];
  for (const a of e) {
    const o = jo(a);
    s.push(o), n[a.name] = o, r[a.no] = o;
  }
  return {
    typeName: i,
    values: s,
    // We do not surface options at this time
    // options: opt?.options ?? Object.create(null),
    findName(a) {
      return n[a];
    },
    findNumber(a) {
      return r[a];
    }
  };
}
function Rl(i, e, t) {
  const n = {};
  for (const r of e) {
    const s = jo(r);
    n[s.localName] = s.no, n[s.no] = s.localName;
  }
  return Bo(n, i, e), n;
}
function jo(i) {
  return "localName" in i ? i : Object.assign(Object.assign({}, i), {
    localName: i.name
  });
}
class Ts {
  /**
   * Compare with a message of the same type.
   * Note that this function disregards extensions and unknown fields.
   */
  equals(e) {
    return this.getType().runtime.util.equals(this.getType(), this, e);
  }
  /**
   * Create a deep copy.
   */
  clone() {
    return this.getType().runtime.util.clone(this);
  }
  /**
   * Parse from binary data, merging fields.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  fromBinary(e, t) {
    const n = this.getType(), r = n.runtime.bin, s = r.makeReadOptions(t);
    return r.readMessage(this, s.readerFactory(e), e.byteLength, s), this;
  }
  /**
   * Parse a message from a JSON value.
   */
  fromJson(e, t) {
    const n = this.getType(), r = n.runtime.json, s = r.makeReadOptions(t);
    return r.readMessage(n, e, s, this), this;
  }
  /**
   * Parse a message from a JSON string.
   */
  fromJsonString(e, t) {
    let n;
    try {
      n = JSON.parse(e);
    } catch (r) {
      throw new Error("cannot decode ".concat(this.getType().typeName, " from JSON: ").concat(r instanceof Error ? r.message : String(r)));
    }
    return this.fromJson(n, t);
  }
  /**
   * Serialize the message to binary data.
   */
  toBinary(e) {
    const t = this.getType(), n = t.runtime.bin, r = n.makeWriteOptions(e), s = r.writerFactory();
    return n.writeMessage(this, s, r), s.finish();
  }
  /**
   * Serialize the message to a JSON value, a JavaScript value that can be
   * passed to JSON.stringify().
   */
  toJson(e) {
    const t = this.getType(), n = t.runtime.json, r = n.makeWriteOptions(e);
    return n.writeMessage(this, r);
  }
  /**
   * Serialize the message to a JSON string.
   */
  toJsonString(e) {
    var t;
    const n = this.toJson(e);
    return JSON.stringify(n, null, (t = e == null ? void 0 : e.prettySpaces) !== null && t !== void 0 ? t : 0);
  }
  /**
   * Override for serialization behavior. This will be invoked when calling
   * JSON.stringify on this message (i.e. JSON.stringify(msg)).
   *
   * Note that this will not serialize google.protobuf.Any with a packed
   * message because the protobuf JSON format specifies that it needs to be
   * unpacked, and this is only possible with a type registry to look up the
   * message type.  As a result, attempting to serialize a message with this
   * type will throw an Error.
   *
   * This method is protected because you should not need to invoke it
   * directly -- instead use JSON.stringify or toJsonString for
   * stringified JSON.  Alternatively, if actual JSON is desired, you should
   * use toJson.
   */
  toJSON() {
    return this.toJson({
      emitDefaultValues: !0
    });
  }
  /**
   * Retrieve the MessageType of this message - a singleton that represents
   * the protobuf message declaration and provides metadata for reflection-
   * based operations.
   */
  getType() {
    return Object.getPrototypeOf(this).constructor;
  }
}
function Il(i, e, t, n) {
  var r;
  const s = (r = n == null ? void 0 : n.localName) !== null && r !== void 0 ? r : e.substring(e.lastIndexOf(".") + 1), a = {
    [s]: function(o) {
      i.util.initFields(this), i.util.initPartial(o, this);
    }
  }[s];
  return Object.setPrototypeOf(a.prototype, new Ts()), Object.assign(a, {
    runtime: i,
    typeName: e,
    fields: i.util.newFieldList(t),
    fromBinary(o, c) {
      return new a().fromBinary(o, c);
    },
    fromJson(o, c) {
      return new a().fromJson(o, c);
    },
    fromJsonString(o, c) {
      return new a().fromJsonString(o, c);
    },
    equals(o, c) {
      return i.util.equals(a, o, c);
    }
  }), a;
}
function Ml() {
  let i = 0, e = 0;
  for (let n = 0; n < 28; n += 7) {
    let r = this.buf[this.pos++];
    if (i |= (r & 127) << n, (r & 128) == 0)
      return this.assertBounds(), [i, e];
  }
  let t = this.buf[this.pos++];
  if (i |= (t & 15) << 28, e = (t & 112) >> 4, (t & 128) == 0)
    return this.assertBounds(), [i, e];
  for (let n = 3; n <= 31; n += 7) {
    let r = this.buf[this.pos++];
    if (e |= (r & 127) << n, (r & 128) == 0)
      return this.assertBounds(), [i, e];
  }
  throw new Error("invalid varint");
}
function cr(i, e, t) {
  for (let s = 0; s < 28; s = s + 7) {
    const a = i >>> s, o = !(!(a >>> 7) && e == 0), c = (o ? a | 128 : a) & 255;
    if (t.push(c), !o)
      return;
  }
  const n = i >>> 28 & 15 | (e & 7) << 4, r = e >> 3 != 0;
  if (t.push((r ? n | 128 : n) & 255), !!r) {
    for (let s = 3; s < 31; s = s + 7) {
      const a = e >>> s, o = !!(a >>> 7), c = (o ? a | 128 : a) & 255;
      if (t.push(c), !o)
        return;
    }
    t.push(e >>> 31 & 1);
  }
}
const si = 4294967296;
function oa(i) {
  const e = i[0] === "-";
  e && (i = i.slice(1));
  const t = 1e6;
  let n = 0, r = 0;
  function s(a, o) {
    const c = Number(i.slice(a, o));
    r *= t, n = n * t + c, n >= si && (r = r + (n / si | 0), n = n % si);
  }
  return s(-24, -18), s(-18, -12), s(-12, -6), s(-6), e ? Wo(n, r) : Ss(n, r);
}
function Ol(i, e) {
  let t = Ss(i, e);
  const n = t.hi & 2147483648;
  n && (t = Wo(t.lo, t.hi));
  const r = Vo(t.lo, t.hi);
  return n ? "-" + r : r;
}
function Vo(i, e) {
  var t = Al(i, e);
  if (i = t.lo, e = t.hi, e <= 2097151)
    return String(si * e + i);
  const n = i & 16777215, r = (i >>> 24 | e << 8) & 16777215, s = e >> 16 & 65535;
  let a = n + r * 6777216 + s * 6710656, o = r + s * 8147497, c = s * 2;
  const d = 1e7;
  return a >= d && (o += Math.floor(a / d), a %= d), o >= d && (c += Math.floor(o / d), o %= d), c.toString() + ca(o) + ca(a);
}
function Al(i, e) {
  return {
    lo: i >>> 0,
    hi: e >>> 0
  };
}
function Ss(i, e) {
  return {
    lo: i | 0,
    hi: e | 0
  };
}
function Wo(i, e) {
  return e = ~e, i ? i = ~i + 1 : e += 1, Ss(i, e);
}
const ca = (i) => {
  const e = String(i);
  return "0000000".slice(e.length) + e;
};
function da(i, e) {
  if (i >= 0) {
    for (; i > 127; )
      e.push(i & 127 | 128), i = i >>> 7;
    e.push(i);
  } else {
    for (let t = 0; t < 9; t++)
      e.push(i & 127 | 128), i = i >> 7;
    e.push(1);
  }
}
function Dl() {
  let i = this.buf[this.pos++], e = i & 127;
  if ((i & 128) == 0)
    return this.assertBounds(), e;
  if (i = this.buf[this.pos++], e |= (i & 127) << 7, (i & 128) == 0)
    return this.assertBounds(), e;
  if (i = this.buf[this.pos++], e |= (i & 127) << 14, (i & 128) == 0)
    return this.assertBounds(), e;
  if (i = this.buf[this.pos++], e |= (i & 127) << 21, (i & 128) == 0)
    return this.assertBounds(), e;
  i = this.buf[this.pos++], e |= (i & 15) << 28;
  for (let t = 5; (i & 128) !== 0 && t < 10; t++) i = this.buf[this.pos++];
  if ((i & 128) != 0) throw new Error("invalid varint");
  return this.assertBounds(), e >>> 0;
}
function Ll() {
  const i = new DataView(new ArrayBuffer(8));
  if (typeof BigInt == "function" && typeof i.getBigInt64 == "function" && typeof i.getBigUint64 == "function" && typeof i.setBigInt64 == "function" && typeof i.setBigUint64 == "function" && (typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1")) {
    const r = BigInt("-9223372036854775808"), s = BigInt("9223372036854775807"), a = BigInt("0"), o = BigInt("18446744073709551615");
    return {
      zero: BigInt(0),
      supported: !0,
      parse(c) {
        const d = typeof c == "bigint" ? c : BigInt(c);
        if (d > s || d < r)
          throw new Error("int64 invalid: ".concat(c));
        return d;
      },
      uParse(c) {
        const d = typeof c == "bigint" ? c : BigInt(c);
        if (d > o || d < a)
          throw new Error("uint64 invalid: ".concat(c));
        return d;
      },
      enc(c) {
        return i.setBigInt64(0, this.parse(c), !0), {
          lo: i.getInt32(0, !0),
          hi: i.getInt32(4, !0)
        };
      },
      uEnc(c) {
        return i.setBigInt64(0, this.uParse(c), !0), {
          lo: i.getInt32(0, !0),
          hi: i.getInt32(4, !0)
        };
      },
      dec(c, d) {
        return i.setInt32(0, c, !0), i.setInt32(4, d, !0), i.getBigInt64(0, !0);
      },
      uDec(c, d) {
        return i.setInt32(0, c, !0), i.setInt32(4, d, !0), i.getBigUint64(0, !0);
      }
    };
  }
  const t = (r) => ie(/^-?[0-9]+$/.test(r), "int64 invalid: ".concat(r)), n = (r) => ie(/^[0-9]+$/.test(r), "uint64 invalid: ".concat(r));
  return {
    zero: "0",
    supported: !1,
    parse(r) {
      return typeof r != "string" && (r = r.toString()), t(r), r;
    },
    uParse(r) {
      return typeof r != "string" && (r = r.toString()), n(r), r;
    },
    enc(r) {
      return typeof r != "string" && (r = r.toString()), t(r), oa(r);
    },
    uEnc(r) {
      return typeof r != "string" && (r = r.toString()), n(r), oa(r);
    },
    dec(r, s) {
      return Ol(r, s);
    },
    uDec(r, s) {
      return Vo(r, s);
    }
  };
}
const ee = Ll();
var w;
(function(i) {
  i[i.DOUBLE = 1] = "DOUBLE", i[i.FLOAT = 2] = "FLOAT", i[i.INT64 = 3] = "INT64", i[i.UINT64 = 4] = "UINT64", i[i.INT32 = 5] = "INT32", i[i.FIXED64 = 6] = "FIXED64", i[i.FIXED32 = 7] = "FIXED32", i[i.BOOL = 8] = "BOOL", i[i.STRING = 9] = "STRING", i[i.BYTES = 12] = "BYTES", i[i.UINT32 = 13] = "UINT32", i[i.SFIXED32 = 15] = "SFIXED32", i[i.SFIXED64 = 16] = "SFIXED64", i[i.SINT32 = 17] = "SINT32", i[i.SINT64 = 18] = "SINT64";
})(w || (w = {}));
var wt;
(function(i) {
  i[i.BIGINT = 0] = "BIGINT", i[i.STRING = 1] = "STRING";
})(wt || (wt = {}));
function mt(i, e, t) {
  if (e === t)
    return !0;
  if (i == w.BYTES) {
    if (!(e instanceof Uint8Array) || !(t instanceof Uint8Array) || e.length !== t.length)
      return !1;
    for (let n = 0; n < e.length; n++)
      if (e[n] !== t[n])
        return !1;
    return !0;
  }
  switch (i) {
    case w.UINT64:
    case w.FIXED64:
    case w.INT64:
    case w.SFIXED64:
    case w.SINT64:
      return e == t;
  }
  return !1;
}
function cn(i, e) {
  switch (i) {
    case w.BOOL:
      return !1;
    case w.UINT64:
    case w.FIXED64:
    case w.INT64:
    case w.SFIXED64:
    case w.SINT64:
      return e == 0 ? ee.zero : "0";
    case w.DOUBLE:
    case w.FLOAT:
      return 0;
    case w.BYTES:
      return new Uint8Array(0);
    case w.STRING:
      return "";
    default:
      return 0;
  }
}
function Ho(i, e) {
  switch (i) {
    case w.BOOL:
      return e === !1;
    case w.STRING:
      return e === "";
    case w.BYTES:
      return e instanceof Uint8Array && !e.byteLength;
    default:
      return e == 0;
  }
}
function xl(i, e) {
  this.v = i, this.k = e;
}
function jr(i, e) {
  (e == null || e > i.length) && (e = i.length);
  for (var t = 0, n = Array(e); t < e; t++) n[t] = i[t];
  return n;
}
function Ko(i) {
  if (Array.isArray(i)) return i;
}
function N(i, e, t) {
  return (e = Wl(e)) in i ? Object.defineProperty(i, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : i[e] = t, i;
}
function Nl(i) {
  if (typeof Symbol < "u" && i[Symbol.iterator] != null || i["@@iterator"] != null) return Array.from(i);
}
function Ul(i, e) {
  var t = i == null ? null : typeof Symbol < "u" && i[Symbol.iterator] || i["@@iterator"];
  if (t != null) {
    var n, r, s, a, o = [], c = !0, d = !1;
    try {
      if (s = (t = t.call(i)).next, e === 0) {
        if (Object(t) !== t) return;
        c = !1;
      } else for (; !(c = (n = s.call(t)).done) && (o.push(n.value), o.length !== e); c = !0) ;
    } catch (l) {
      d = !0, r = l;
    } finally {
      try {
        if (!c && t.return != null && (a = t.return(), Object(a) !== a)) return;
      } finally {
        if (d) throw r;
      }
    }
    return o;
  }
}
function Go() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function la(i, e) {
  var t = Object.keys(i);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(i);
    e && (n = n.filter(function(r) {
      return Object.getOwnPropertyDescriptor(i, r).enumerable;
    })), t.push.apply(t, n);
  }
  return t;
}
function Fl(i) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? la(Object(t), !0).forEach(function(n) {
      N(i, n, t[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(i, Object.getOwnPropertyDescriptors(t)) : la(Object(t)).forEach(function(n) {
      Object.defineProperty(i, n, Object.getOwnPropertyDescriptor(t, n));
    });
  }
  return i;
}
function Bl(i, e) {
  if (i == null) return {};
  var t, n, r = ql(i, e);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(i);
    for (n = 0; n < s.length; n++) t = s[n], e.indexOf(t) === -1 && {}.propertyIsEnumerable.call(i, t) && (r[t] = i[t]);
  }
  return r;
}
function ql(i, e) {
  if (i == null) return {};
  var t = {};
  for (var n in i) if ({}.hasOwnProperty.call(i, n)) {
    if (e.indexOf(n) !== -1) continue;
    t[n] = i[n];
  }
  return t;
}
function L(i, e) {
  return Ko(i) || Ul(i, e) || zo(i, e) || Go();
}
function jl(i) {
  return Ko(i) || Nl(i) || zo(i) || Go();
}
function Vl(i, e) {
  if (typeof i != "object" || !i) return i;
  var t = i[Symbol.toPrimitive];
  if (t !== void 0) {
    var n = t.call(i, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(i);
}
function Wl(i) {
  var e = Vl(i, "string");
  return typeof e == "symbol" ? e : e + "";
}
function zo(i, e) {
  if (i) {
    if (typeof i == "string") return jr(i, e);
    var t = {}.toString.call(i).slice(8, -1);
    return t === "Object" && i.constructor && (t = i.constructor.name), t === "Map" || t === "Set" ? Array.from(i) : t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? jr(i, e) : void 0;
  }
}
function Hl(i) {
  return function() {
    return new kn(i.apply(this, arguments));
  };
}
function kn(i) {
  var e, t;
  function n(s, a) {
    try {
      var o = i[s](a), c = o.value, d = c instanceof xl;
      Promise.resolve(d ? c.v : c).then(function(l) {
        if (d) {
          var u = s === "return" && c.k ? s : "next";
          if (!c.k || l.done) return n(u, l);
          l = i[u](l).value;
        }
        r(!!o.done, l);
      }, function(l) {
        n("throw", l);
      });
    } catch (l) {
      r(2, l);
    }
  }
  function r(s, a) {
    s === 2 ? e.reject(a) : e.resolve({
      value: a,
      done: s
    }), (e = e.next) ? n(e.key, e.arg) : t = null;
  }
  this._invoke = function(s, a) {
    return new Promise(function(o, c) {
      var d = {
        key: s,
        arg: a,
        resolve: o,
        reject: c,
        next: null
      };
      t ? t = t.next = d : (e = t = d, n(s, a));
    });
  }, typeof i.return != "function" && (this.return = void 0);
}
kn.prototype[typeof Symbol == "function" && Symbol.asyncIterator || "@@asyncIterator"] = function() {
  return this;
}, kn.prototype.next = function(i) {
  return this._invoke("next", i);
}, kn.prototype.throw = function(i) {
  return this._invoke("throw", i);
}, kn.prototype.return = function(i) {
  return this._invoke("return", i);
};
var se;
(function(i) {
  i[i.Varint = 0] = "Varint", i[i.Bit64 = 1] = "Bit64", i[i.LengthDelimited = 2] = "LengthDelimited", i[i.StartGroup = 3] = "StartGroup", i[i.EndGroup = 4] = "EndGroup", i[i.Bit32 = 5] = "Bit32";
})(se || (se = {}));
class Kl {
  constructor(e) {
    this.stack = [], this.textEncoder = e ?? new TextEncoder(), this.chunks = [], this.buf = [];
  }
  /**
   * Return all bytes written and reset this writer.
   */
  finish() {
    this.chunks.push(new Uint8Array(this.buf));
    let e = 0;
    for (let r = 0; r < this.chunks.length; r++) e += this.chunks[r].length;
    let t = new Uint8Array(e), n = 0;
    for (let r = 0; r < this.chunks.length; r++)
      t.set(this.chunks[r], n), n += this.chunks[r].length;
    return this.chunks = [], t;
  }
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork() {
    return this.stack.push({
      chunks: this.chunks,
      buf: this.buf
    }), this.chunks = [], this.buf = [], this;
  }
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join() {
    let e = this.finish(), t = this.stack.pop();
    if (!t) throw new Error("invalid state, fork stack empty");
    return this.chunks = t.chunks, this.buf = t.buf, this.uint32(e.byteLength), this.raw(e);
  }
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(e, t) {
    return this.uint32((e << 3 | t) >>> 0);
  }
  /**
   * Write a chunk of raw bytes.
   */
  raw(e) {
    return this.buf.length && (this.chunks.push(new Uint8Array(this.buf)), this.buf = []), this.chunks.push(e), this;
  }
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(e) {
    for (qr(e); e > 127; )
      this.buf.push(e & 127 | 128), e = e >>> 7;
    return this.buf.push(e), this;
  }
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(e) {
    return ri(e), da(e, this.buf), this;
  }
  /**
   * Write a `bool` value, a variant.
   */
  bool(e) {
    return this.buf.push(e ? 1 : 0), this;
  }
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(e) {
    return this.uint32(e.byteLength), this.raw(e);
  }
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(e) {
    let t = this.textEncoder.encode(e);
    return this.uint32(t.byteLength), this.raw(t);
  }
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(e) {
    Uo(e);
    let t = new Uint8Array(4);
    return new DataView(t.buffer).setFloat32(0, e, !0), this.raw(t);
  }
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(e) {
    let t = new Uint8Array(8);
    return new DataView(t.buffer).setFloat64(0, e, !0), this.raw(t);
  }
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(e) {
    qr(e);
    let t = new Uint8Array(4);
    return new DataView(t.buffer).setUint32(0, e, !0), this.raw(t);
  }
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(e) {
    ri(e);
    let t = new Uint8Array(4);
    return new DataView(t.buffer).setInt32(0, e, !0), this.raw(t);
  }
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(e) {
    return ri(e), e = (e << 1 ^ e >> 31) >>> 0, da(e, this.buf), this;
  }
  /**
   * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(e) {
    let t = new Uint8Array(8), n = new DataView(t.buffer), r = ee.enc(e);
    return n.setInt32(0, r.lo, !0), n.setInt32(4, r.hi, !0), this.raw(t);
  }
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(e) {
    let t = new Uint8Array(8), n = new DataView(t.buffer), r = ee.uEnc(e);
    return n.setInt32(0, r.lo, !0), n.setInt32(4, r.hi, !0), this.raw(t);
  }
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(e) {
    let t = ee.enc(e);
    return cr(t.lo, t.hi, this.buf), this;
  }
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(e) {
    let t = ee.enc(e), n = t.hi >> 31, r = t.lo << 1 ^ n, s = (t.hi << 1 | t.lo >>> 31) ^ n;
    return cr(r, s, this.buf), this;
  }
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(e) {
    let t = ee.uEnc(e);
    return cr(t.lo, t.hi, this.buf), this;
  }
}
class Gl {
  constructor(e, t) {
    this.varint64 = Ml, this.uint32 = Dl, this.buf = e, this.len = e.length, this.pos = 0, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength), this.textDecoder = t ?? new TextDecoder();
  }
  /**
   * Reads a tag - field number and wire type.
   */
  tag() {
    let e = this.uint32(), t = e >>> 3, n = e & 7;
    if (t <= 0 || n < 0 || n > 5) throw new Error("illegal tag: field no " + t + " wire type " + n);
    return [t, n];
  }
  /**
   * Skip one element and return the skipped data.
   *
   * When skipping StartGroup, provide the tags field number to check for
   * matching field number in the EndGroup tag.
   */
  skip(e, t) {
    let n = this.pos;
    switch (e) {
      case se.Varint:
        for (; this.buf[this.pos++] & 128; )
          ;
        break;
      // eslint-disable-next-line
      // @ts-ignore TS7029: Fallthrough case in switch
      case se.Bit64:
        this.pos += 4;
      // eslint-disable-next-line
      // @ts-ignore TS7029: Fallthrough case in switch
      case se.Bit32:
        this.pos += 4;
        break;
      case se.LengthDelimited:
        let r = this.uint32();
        this.pos += r;
        break;
      case se.StartGroup:
        for (; ; ) {
          const s = this.tag(), a = L(s, 2), o = a[0], c = a[1];
          if (c === se.EndGroup) {
            if (t !== void 0 && o !== t)
              throw new Error("invalid end group tag");
            break;
          }
          this.skip(c, o);
        }
        break;
      default:
        throw new Error("cant skip wire type " + e);
    }
    return this.assertBounds(), this.buf.subarray(n, this.pos);
  }
  /**
   * Throws error if position in byte array is out of range.
   */
  assertBounds() {
    if (this.pos > this.len) throw new RangeError("premature EOF");
  }
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32() {
    let e = this.uint32();
    return e >>> 1 ^ -(e & 1);
  }
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64() {
    return ee.dec(...this.varint64());
  }
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64() {
    return ee.uDec(...this.varint64());
  }
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64() {
    let e = this.varint64(), t = L(e, 2), n = t[0], r = t[1], s = -(n & 1);
    return n = (n >>> 1 | (r & 1) << 31) ^ s, r = r >>> 1 ^ s, ee.dec(n, r);
  }
  /**
   * Read a `bool` field, a variant.
   */
  bool() {
    let e = this.varint64(), t = L(e, 2), n = t[0], r = t[1];
    return n !== 0 || r !== 0;
  }
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, !0);
  }
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, !0);
  }
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64() {
    return ee.uDec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64() {
    return ee.dec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, !0);
  }
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, !0);
  }
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes() {
    let e = this.uint32(), t = this.pos;
    return this.pos += e, this.assertBounds(), this.buf.subarray(t, t + e);
  }
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text.
   */
  string() {
    return this.textDecoder.decode(this.bytes());
  }
}
function zl(i, e, t, n) {
  let r;
  return {
    typeName: e,
    extendee: t,
    get field() {
      if (!r) {
        const s = typeof n == "function" ? n() : n;
        s.name = e.split(".").pop(), s.jsonName = "[".concat(e, "]"), r = i.util.newFieldList([s]).list()[0];
      }
      return r;
    },
    runtime: i
  };
}
function Jo(i) {
  const e = i.field.localName, t = /* @__PURE__ */ Object.create(null);
  return t[e] = Jl(i), [t, () => t[e]];
}
function Jl(i) {
  const e = i.field;
  if (e.repeated)
    return [];
  if (e.default !== void 0)
    return e.default;
  switch (e.kind) {
    case "enum":
      return e.T.values[0].no;
    case "scalar":
      return cn(e.T, e.L);
    case "message":
      const t = e.T, n = new t();
      return t.fieldWrapper ? t.fieldWrapper.unwrapField(n) : n;
    case "map":
      throw "map fields are not allowed to be extensions";
  }
}
function Ql(i, e) {
  if (!e.repeated && (e.kind == "enum" || e.kind == "scalar")) {
    for (let t = i.length - 1; t >= 0; --t)
      if (i[t].no == e.no)
        return [i[t]];
    return [];
  }
  return i.filter((t) => t.no === e.no);
}
let ct = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""), Di = [];
for (let i = 0; i < ct.length; i++) Di[ct[i].charCodeAt(0)] = i;
Di[45] = ct.indexOf("+");
Di[95] = ct.indexOf("/");
const Qo = {
  /**
   * Decodes a base64 string to a byte array.
   *
   * - ignores white-space, including line breaks and tabs
   * - allows inner padding (can decode concatenated base64 strings)
   * - does not require padding
   * - understands base64url encoding:
   *   "-" instead of "+",
   *   "_" instead of "/",
   *   no padding
   */
  dec(i) {
    let e = i.length * 3 / 4;
    i[i.length - 2] == "=" ? e -= 2 : i[i.length - 1] == "=" && (e -= 1);
    let t = new Uint8Array(e), n = 0, r = 0, s, a = 0;
    for (let o = 0; o < i.length; o++) {
      if (s = Di[i.charCodeAt(o)], s === void 0)
        switch (i[o]) {
          // @ts-ignore TS7029: Fallthrough case in switch
          case "=":
            r = 0;
          // reset state when padding found
          // @ts-ignore TS7029: Fallthrough case in switch
          case `
`:
          case "\r":
          case "	":
          case " ":
            continue;
          // skip white-space, and padding
          default:
            throw Error("invalid base64 string.");
        }
      switch (r) {
        case 0:
          a = s, r = 1;
          break;
        case 1:
          t[n++] = a << 2 | (s & 48) >> 4, a = s, r = 2;
          break;
        case 2:
          t[n++] = (a & 15) << 4 | (s & 60) >> 2, a = s, r = 3;
          break;
        case 3:
          t[n++] = (a & 3) << 6 | s, r = 0;
          break;
      }
    }
    if (r == 1) throw Error("invalid base64 string.");
    return t.subarray(0, n);
  },
  /**
   * Encode a byte array to a base64 string.
   */
  enc(i) {
    let e = "", t = 0, n, r = 0;
    for (let s = 0; s < i.length; s++)
      switch (n = i[s], t) {
        case 0:
          e += ct[n >> 2], r = (n & 3) << 4, t = 1;
          break;
        case 1:
          e += ct[r | n >> 4], r = (n & 15) << 2, t = 2;
          break;
        case 2:
          e += ct[r | n >> 6], e += ct[n & 63], t = 0;
          break;
      }
    return t && (e += ct[r], e += "=", t == 1 && (e += "=")), e;
  }
};
function Yl(i, e, t) {
  $o(e, i);
  const n = e.runtime.bin.makeReadOptions(t), r = Ql(i.getType().runtime.bin.listUnknownFields(i), e.field), s = Jo(e), a = L(s, 2), o = a[0], c = a[1];
  for (const d of r)
    e.runtime.bin.readField(o, n.readerFactory(d.data), e.field, d.wireType, n);
  return c();
}
function $l(i, e, t, n) {
  $o(e, i);
  const r = e.runtime.bin.makeReadOptions(n), s = e.runtime.bin.makeWriteOptions(n);
  if (Yo(i, e)) {
    const d = i.getType().runtime.bin.listUnknownFields(i).filter((l) => l.no != e.field.no);
    i.getType().runtime.bin.discardUnknownFields(i);
    for (const l of d)
      i.getType().runtime.bin.onUnknownField(i, l.no, l.wireType, l.data);
  }
  const a = s.writerFactory();
  let o = e.field;
  !o.opt && !o.repeated && (o.kind == "enum" || o.kind == "scalar") && (o = Object.assign(Object.assign({}, e.field), {
    opt: !0
  })), e.runtime.bin.writeField(o, t, a, s);
  const c = r.readerFactory(a.finish());
  for (; c.pos < c.len; ) {
    const d = c.tag(), l = L(d, 2), u = l[0], h = l[1], f = c.skip(h, u);
    i.getType().runtime.bin.onUnknownField(i, u, h, f);
  }
}
function Yo(i, e) {
  const t = i.getType();
  return e.extendee.typeName === t.typeName && !!t.runtime.bin.listUnknownFields(i).find((n) => n.no == e.field.no);
}
function $o(i, e) {
  ie(i.extendee.typeName == e.getType().typeName, "extension ".concat(i.typeName, " can only be applied to message ").concat(i.extendee.typeName));
}
function Xo(i, e) {
  const t = i.localName;
  if (i.repeated)
    return e[t].length > 0;
  if (i.oneof)
    return e[i.oneof.localName].case === t;
  switch (i.kind) {
    case "enum":
    case "scalar":
      return i.opt || i.req ? e[t] !== void 0 : i.kind == "enum" ? e[t] !== i.T.values[0].no : !Ho(i.T, e[t]);
    case "message":
      return e[t] !== void 0;
    case "map":
      return Object.keys(e[t]).length > 0;
  }
}
function ua(i, e) {
  const t = i.localName, n = !i.opt && !i.req;
  if (i.repeated)
    e[t] = [];
  else if (i.oneof)
    e[i.oneof.localName] = {
      case: void 0
    };
  else
    switch (i.kind) {
      case "map":
        e[t] = {};
        break;
      case "enum":
        e[t] = n ? i.T.values[0].no : void 0;
        break;
      case "scalar":
        e[t] = n ? cn(i.T, i.L) : void 0;
        break;
      case "message":
        e[t] = void 0;
        break;
    }
}
function dt(i, e) {
  if (i === null || typeof i != "object" || !Object.getOwnPropertyNames(Ts.prototype).every((n) => n in i && typeof i[n] == "function"))
    return !1;
  const t = i.getType();
  return t === null || typeof t != "function" || !("typeName" in t) || typeof t.typeName != "string" ? !1 : e === void 0 ? !0 : t.typeName == e.typeName;
}
function Zo(i, e) {
  return dt(e) || !i.fieldWrapper ? e : i.fieldWrapper.wrapField(e);
}
w.DOUBLE, w.FLOAT, w.INT64, w.UINT64, w.INT32, w.UINT32, w.BOOL, w.STRING, w.BYTES;
const ha = {
  ignoreUnknownFields: !1
}, fa = {
  emitDefaultValues: !1,
  enumAsInteger: !1,
  useProtoFieldName: !1,
  prettySpaces: 0
};
function Xl(i) {
  return i ? Object.assign(Object.assign({}, ha), i) : ha;
}
function Zl(i) {
  return i ? Object.assign(Object.assign({}, fa), i) : fa;
}
const bi = Symbol(), ai = Symbol();
function eu() {
  return {
    makeReadOptions: Xl,
    makeWriteOptions: Zl,
    readMessage(i, e, t, n) {
      if (e == null || Array.isArray(e) || typeof e != "object")
        throw new Error("cannot decode message ".concat(i.typeName, " from JSON: ").concat(Ze(e)));
      n = n ?? new i();
      const r = /* @__PURE__ */ new Map(), s = t.typeRegistry;
      for (const o of Object.entries(e)) {
        var a = L(o, 2);
        const c = a[0], d = a[1], l = i.fields.findJsonName(c);
        if (l) {
          if (l.oneof) {
            if (d === null && l.kind == "scalar")
              continue;
            const u = r.get(l.oneof);
            if (u !== void 0)
              throw new Error("cannot decode message ".concat(i.typeName, ' from JSON: multiple keys for oneof "').concat(l.oneof.name, '" present: "').concat(u, '", "').concat(c, '"'));
            r.set(l.oneof, c);
          }
          ma(n, d, l, t, i);
        } else {
          let u = !1;
          if (s != null && s.findExtension && c.startsWith("[") && c.endsWith("]")) {
            const h = s.findExtension(c.substring(1, c.length - 1));
            if (h && h.extendee.typeName == i.typeName) {
              u = !0;
              const f = Jo(h), g = L(f, 2), p = g[0], k = g[1];
              ma(p, d, h.field, t, h), $l(n, h, k(), t);
            }
          }
          if (!u && !t.ignoreUnknownFields)
            throw new Error("cannot decode message ".concat(i.typeName, ' from JSON: key "').concat(c, '" is unknown'));
        }
      }
      return n;
    },
    writeMessage(i, e) {
      const t = i.getType(), n = {};
      let r;
      try {
        for (r of t.fields.byNumber()) {
          if (!Xo(r, i)) {
            if (r.req)
              throw "required field not set";
            if (!e.emitDefaultValues || !nu(r))
              continue;
          }
          const a = r.oneof ? i[r.oneof.localName].value : i[r.localName], o = pa(r, a, e);
          o !== void 0 && (n[e.useProtoFieldName ? r.name : r.jsonName] = o);
        }
        const s = e.typeRegistry;
        if (s != null && s.findExtensionFor)
          for (const a of t.runtime.bin.listUnknownFields(i)) {
            const o = s.findExtensionFor(t.typeName, a.no);
            if (o && Yo(i, o)) {
              const c = Yl(i, o, e), d = pa(o.field, c, e);
              d !== void 0 && (n[o.field.jsonName] = d);
            }
          }
      } catch (s) {
        const a = r ? "cannot encode field ".concat(t.typeName, ".").concat(r.name, " to JSON") : "cannot encode message ".concat(t.typeName, " to JSON"), o = s instanceof Error ? s.message : String(s);
        throw new Error(a + (o.length > 0 ? ": ".concat(o) : ""));
      }
      return n;
    },
    readScalar(i, e, t) {
      return Sn(i, e, t ?? wt.BIGINT, !0);
    },
    writeScalar(i, e, t) {
      if (e !== void 0 && (t || Ho(i, e)))
        return oi(i, e);
    },
    debug: Ze
  };
}
function Ze(i) {
  if (i === null)
    return "null";
  switch (typeof i) {
    case "object":
      return Array.isArray(i) ? "array" : "object";
    case "string":
      return i.length > 100 ? "string" : '"'.concat(i.split('"').join('\\"'), '"');
    default:
      return String(i);
  }
}
function ma(i, e, t, n, r) {
  let s = t.localName;
  if (t.repeated) {
    if (ie(t.kind != "map"), e === null)
      return;
    if (!Array.isArray(e))
      throw new Error("cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(e)));
    const o = i[s];
    for (const c of e) {
      if (c === null)
        throw new Error("cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(c)));
      switch (t.kind) {
        case "message":
          o.push(t.T.fromJson(c, n));
          break;
        case "enum":
          const d = dr(t.T, c, n.ignoreUnknownFields, !0);
          d !== ai && o.push(d);
          break;
        case "scalar":
          try {
            o.push(Sn(t.T, c, t.L, !0));
          } catch (l) {
            let u = "cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(c));
            throw l instanceof Error && l.message.length > 0 && (u += ": ".concat(l.message)), new Error(u);
          }
          break;
      }
    }
  } else if (t.kind == "map") {
    if (e === null)
      return;
    if (typeof e != "object" || Array.isArray(e))
      throw new Error("cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(e)));
    const o = i[s];
    for (const c of Object.entries(e)) {
      var a = L(c, 2);
      const d = a[0], l = a[1];
      if (l === null)
        throw new Error("cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: map value null"));
      let u;
      try {
        u = tu(t.K, d);
      } catch (h) {
        let f = "cannot decode map key for field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(e));
        throw h instanceof Error && h.message.length > 0 && (f += ": ".concat(h.message)), new Error(f);
      }
      switch (t.V.kind) {
        case "message":
          o[u] = t.V.T.fromJson(l, n);
          break;
        case "enum":
          const h = dr(t.V.T, l, n.ignoreUnknownFields, !0);
          h !== ai && (o[u] = h);
          break;
        case "scalar":
          try {
            o[u] = Sn(t.V.T, l, wt.BIGINT, !0);
          } catch (f) {
            let g = "cannot decode map value for field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(e));
            throw f instanceof Error && f.message.length > 0 && (g += ": ".concat(f.message)), new Error(g);
          }
          break;
      }
    }
  } else
    switch (t.oneof && (i = i[t.oneof.localName] = {
      case: s
    }, s = "value"), t.kind) {
      case "message":
        const o = t.T;
        if (e === null && o.typeName != "google.protobuf.Value")
          return;
        let c = i[s];
        dt(c) ? c.fromJson(e, n) : (i[s] = c = o.fromJson(e, n), o.fieldWrapper && !t.oneof && (i[s] = o.fieldWrapper.unwrapField(c)));
        break;
      case "enum":
        const d = dr(t.T, e, n.ignoreUnknownFields, !1);
        switch (d) {
          case bi:
            ua(t, i);
            break;
          case ai:
            break;
          default:
            i[s] = d;
            break;
        }
        break;
      case "scalar":
        try {
          const l = Sn(t.T, e, t.L, !1);
          switch (l) {
            case bi:
              ua(t, i);
              break;
            default:
              i[s] = l;
              break;
          }
        } catch (l) {
          let u = "cannot decode field ".concat(r.typeName, ".").concat(t.name, " from JSON: ").concat(Ze(e));
          throw l instanceof Error && l.message.length > 0 && (u += ": ".concat(l.message)), new Error(u);
        }
        break;
    }
}
function tu(i, e) {
  if (i === w.BOOL)
    switch (e) {
      case "true":
        e = !0;
        break;
      case "false":
        e = !1;
        break;
    }
  return Sn(i, e, wt.BIGINT, !0).toString();
}
function Sn(i, e, t, n) {
  if (e === null)
    return n ? cn(i, t) : bi;
  switch (i) {
    // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
    // Either numbers or strings are accepted. Exponent notation is also accepted.
    case w.DOUBLE:
    case w.FLOAT:
      if (e === "NaN") return Number.NaN;
      if (e === "Infinity") return Number.POSITIVE_INFINITY;
      if (e === "-Infinity") return Number.NEGATIVE_INFINITY;
      if (e === "" || typeof e == "string" && e.trim().length !== e.length || typeof e != "string" && typeof e != "number")
        break;
      const r = Number(e);
      if (Number.isNaN(r) || !Number.isFinite(r))
        break;
      return i == w.FLOAT && Uo(r), r;
    // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
    case w.INT32:
    case w.FIXED32:
    case w.SFIXED32:
    case w.SINT32:
    case w.UINT32:
      let s;
      if (typeof e == "number" ? s = e : typeof e == "string" && e.length > 0 && e.trim().length === e.length && (s = Number(e)), s === void 0) break;
      return i == w.UINT32 || i == w.FIXED32 ? qr(s) : ri(s), s;
    // int64, fixed64, uint64: JSON value will be a decimal string. Either numbers or strings are accepted.
    case w.INT64:
    case w.SFIXED64:
    case w.SINT64:
      if (typeof e != "number" && typeof e != "string") break;
      const a = ee.parse(e);
      return t ? a.toString() : a;
    case w.FIXED64:
    case w.UINT64:
      if (typeof e != "number" && typeof e != "string") break;
      const o = ee.uParse(e);
      return t ? o.toString() : o;
    // bool:
    case w.BOOL:
      if (typeof e != "boolean") break;
      return e;
    // string:
    case w.STRING:
      if (typeof e != "string")
        break;
      try {
        encodeURIComponent(e);
      } catch {
        throw new Error("invalid UTF8");
      }
      return e;
    // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
    // Either standard or URL-safe base64 encoding with/without paddings are accepted.
    case w.BYTES:
      if (e === "") return new Uint8Array(0);
      if (typeof e != "string") break;
      return Qo.dec(e);
  }
  throw new Error();
}
function dr(i, e, t, n) {
  if (e === null)
    return i.typeName == "google.protobuf.NullValue" ? 0 : n ? i.values[0].no : bi;
  switch (typeof e) {
    case "number":
      if (Number.isInteger(e))
        return e;
      break;
    case "string":
      const r = i.findName(e);
      if (r !== void 0)
        return r.no;
      if (t)
        return ai;
      break;
  }
  throw new Error("cannot decode enum ".concat(i.typeName, " from JSON: ").concat(Ze(e)));
}
function nu(i) {
  return i.repeated || i.kind == "map" ? !0 : !(i.oneof || i.kind == "message" || i.opt || i.req);
}
function pa(i, e, t) {
  if (i.kind == "map") {
    ie(typeof e == "object" && e != null);
    const a = {}, o = Object.entries(e);
    switch (i.V.kind) {
      case "scalar":
        for (const d of o) {
          var n = L(d, 2);
          const l = n[0], u = n[1];
          a[l.toString()] = oi(i.V.T, u);
        }
        break;
      case "message":
        for (const d of o) {
          var r = L(d, 2);
          const l = r[0], u = r[1];
          a[l.toString()] = u.toJson(t);
        }
        break;
      case "enum":
        const c = i.V.T;
        for (const d of o) {
          var s = L(d, 2);
          const l = s[0], u = s[1];
          a[l.toString()] = lr(c, u, t.enumAsInteger);
        }
        break;
    }
    return t.emitDefaultValues || o.length > 0 ? a : void 0;
  }
  if (i.repeated) {
    ie(Array.isArray(e));
    const a = [];
    switch (i.kind) {
      case "scalar":
        for (let o = 0; o < e.length; o++)
          a.push(oi(i.T, e[o]));
        break;
      case "enum":
        for (let o = 0; o < e.length; o++)
          a.push(lr(i.T, e[o], t.enumAsInteger));
        break;
      case "message":
        for (let o = 0; o < e.length; o++)
          a.push(e[o].toJson(t));
        break;
    }
    return t.emitDefaultValues || a.length > 0 ? a : void 0;
  }
  switch (i.kind) {
    case "scalar":
      return oi(i.T, e);
    case "enum":
      return lr(i.T, e, t.enumAsInteger);
    case "message":
      return Zo(i.T, e).toJson(t);
  }
}
function lr(i, e, t) {
  var n;
  if (ie(typeof e == "number"), i.typeName == "google.protobuf.NullValue")
    return null;
  if (t)
    return e;
  const r = i.findNumber(e);
  return (n = r == null ? void 0 : r.name) !== null && n !== void 0 ? n : e;
}
function oi(i, e) {
  switch (i) {
    // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
    case w.INT32:
    case w.SFIXED32:
    case w.SINT32:
    case w.FIXED32:
    case w.UINT32:
      return ie(typeof e == "number"), e;
    // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
    // Either numbers or strings are accepted. Exponent notation is also accepted.
    case w.FLOAT:
    // assertFloat32(value);
    case w.DOUBLE:
      return ie(typeof e == "number"), Number.isNaN(e) ? "NaN" : e === Number.POSITIVE_INFINITY ? "Infinity" : e === Number.NEGATIVE_INFINITY ? "-Infinity" : e;
    // string:
    case w.STRING:
      return ie(typeof e == "string"), e;
    // bool:
    case w.BOOL:
      return ie(typeof e == "boolean"), e;
    // JSON value will be a decimal string. Either numbers or strings are accepted.
    case w.UINT64:
    case w.FIXED64:
    case w.INT64:
    case w.SFIXED64:
    case w.SINT64:
      return ie(typeof e == "bigint" || typeof e == "string" || typeof e == "number"), e.toString();
    // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
    // Either standard or URL-safe base64 encoding with/without paddings are accepted.
    case w.BYTES:
      return ie(e instanceof Uint8Array), Qo.enc(e);
  }
}
const Ht = Symbol("@bufbuild/protobuf/unknown-fields"), ga = {
  readUnknownFields: !0,
  readerFactory: (i) => new Gl(i)
}, va = {
  writeUnknownFields: !0,
  writerFactory: () => new Kl()
};
function iu(i) {
  return i ? Object.assign(Object.assign({}, ga), i) : ga;
}
function ru(i) {
  return i ? Object.assign(Object.assign({}, va), i) : va;
}
function su() {
  return {
    makeReadOptions: iu,
    makeWriteOptions: ru,
    listUnknownFields(i) {
      var e;
      return (e = i[Ht]) !== null && e !== void 0 ? e : [];
    },
    discardUnknownFields(i) {
      delete i[Ht];
    },
    writeUnknownFields(i, e) {
      const n = i[Ht];
      if (n)
        for (const r of n)
          e.tag(r.no, r.wireType).raw(r.data);
    },
    onUnknownField(i, e, t, n) {
      const r = i;
      Array.isArray(r[Ht]) || (r[Ht] = []), r[Ht].push({
        no: e,
        wireType: t,
        data: n
      });
    },
    readMessage(i, e, t, n, r) {
      const s = i.getType(), a = r ? e.len : e.pos + t;
      let o, c;
      for (; e.pos < a; ) {
        var d = e.tag(), l = L(d, 2);
        if (o = l[0], c = l[1], r === !0 && c == se.EndGroup)
          break;
        const u = s.fields.find(o);
        if (!u) {
          const h = e.skip(c, o);
          n.readUnknownFields && this.onUnknownField(i, o, c, h);
          continue;
        }
        ba(i, e, u, c, n);
      }
      if (r && // eslint-disable-line @typescript-eslint/strict-boolean-expressions
      (c != se.EndGroup || o !== t))
        throw new Error("invalid end group tag");
    },
    readField: ba,
    writeMessage(i, e, t) {
      const n = i.getType();
      for (const r of n.fields.byNumber()) {
        if (!Xo(r, i)) {
          if (r.req)
            throw new Error("cannot encode field ".concat(n.typeName, ".").concat(r.name, " to binary: required field not set"));
          continue;
        }
        const s = r.oneof ? i[r.oneof.localName].value : i[r.localName];
        ya(r, s, e, t);
      }
      return t.writeUnknownFields && this.writeUnknownFields(i, e), e;
    },
    writeField(i, e, t, n) {
      e !== void 0 && ya(i, e, t, n);
    }
  };
}
function ba(i, e, t, n, r) {
  let s = t.repeated, a = t.localName;
  switch (t.oneof && (i = i[t.oneof.localName], i.case != a && delete i.value, i.case = a, a = "value"), t.kind) {
    case "scalar":
    case "enum":
      const o = t.kind == "enum" ? w.INT32 : t.T;
      let c = yi;
      if (t.kind == "scalar" && t.L > 0 && (c = ou), s) {
        let g = i[a];
        if (n == se.LengthDelimited && o != w.STRING && o != w.BYTES) {
          let k = e.uint32() + e.pos;
          for (; e.pos < k; )
            g.push(c(e, o));
        } else
          g.push(c(e, o));
      } else
        i[a] = c(e, o);
      break;
    case "message":
      const d = t.T;
      s ? i[a].push(ci(e, new d(), r, t)) : dt(i[a]) ? ci(e, i[a], r, t) : (i[a] = ci(e, new d(), r, t), d.fieldWrapper && !t.oneof && !t.repeated && (i[a] = d.fieldWrapper.unwrapField(i[a])));
      break;
    case "map":
      let l = au(t, e, r), u = L(l, 2), h = u[0], f = u[1];
      i[a][h] = f;
      break;
  }
}
function ci(i, e, t, n) {
  const r = e.getType().runtime.bin, s = n == null ? void 0 : n.delimited;
  return r.readMessage(
    e,
    i,
    s ? n.no : i.uint32(),
    // eslint-disable-line @typescript-eslint/strict-boolean-expressions
    t,
    s
  ), e;
}
function au(i, e, t) {
  const n = e.uint32(), r = e.pos + n;
  let s, a;
  for (; e.pos < r; ) {
    const o = e.tag();
    switch (L(o, 1)[0]) {
      case 1:
        s = yi(e, i.K);
        break;
      case 2:
        switch (i.V.kind) {
          case "scalar":
            a = yi(e, i.V.T);
            break;
          case "enum":
            a = e.int32();
            break;
          case "message":
            a = ci(e, new i.V.T(), t, void 0);
            break;
        }
        break;
    }
  }
  if (s === void 0 && (s = cn(i.K, wt.BIGINT)), typeof s != "string" && typeof s != "number" && (s = s.toString()), a === void 0)
    switch (i.V.kind) {
      case "scalar":
        a = cn(i.V.T, wt.BIGINT);
        break;
      case "enum":
        a = i.V.T.values[0].no;
        break;
      case "message":
        a = new i.V.T();
        break;
    }
  return [s, a];
}
function ou(i, e) {
  const t = yi(i, e);
  return typeof t == "bigint" ? t.toString() : t;
}
function yi(i, e) {
  switch (e) {
    case w.STRING:
      return i.string();
    case w.BOOL:
      return i.bool();
    case w.DOUBLE:
      return i.double();
    case w.FLOAT:
      return i.float();
    case w.INT32:
      return i.int32();
    case w.INT64:
      return i.int64();
    case w.UINT64:
      return i.uint64();
    case w.FIXED64:
      return i.fixed64();
    case w.BYTES:
      return i.bytes();
    case w.FIXED32:
      return i.fixed32();
    case w.SFIXED32:
      return i.sfixed32();
    case w.SFIXED64:
      return i.sfixed64();
    case w.SINT64:
      return i.sint64();
    case w.UINT32:
      return i.uint32();
    case w.SINT32:
      return i.sint32();
  }
}
function ya(i, e, t, n) {
  ie(e !== void 0);
  const r = i.repeated;
  switch (i.kind) {
    case "scalar":
    case "enum":
      let a = i.kind == "enum" ? w.INT32 : i.T;
      if (r)
        if (ie(Array.isArray(e)), i.packed)
          du(t, a, i.no, e);
        else
          for (const o of e)
            Cn(t, a, i.no, o);
      else
        Cn(t, a, i.no, e);
      break;
    case "message":
      if (r) {
        ie(Array.isArray(e));
        for (const o of e)
          ka(t, n, i, o);
      } else
        ka(t, n, i, e);
      break;
    case "map":
      ie(typeof e == "object" && e != null);
      for (const o of Object.entries(e)) {
        var s = L(o, 2);
        const c = s[0], d = s[1];
        cu(t, n, i, c, d);
      }
      break;
  }
}
function cu(i, e, t, n, r) {
  i.tag(t.no, se.LengthDelimited), i.fork();
  let s = n;
  switch (t.K) {
    case w.INT32:
    case w.FIXED32:
    case w.UINT32:
    case w.SFIXED32:
    case w.SINT32:
      s = Number.parseInt(n);
      break;
    case w.BOOL:
      ie(n == "true" || n == "false"), s = n == "true";
      break;
  }
  switch (Cn(i, t.K, 1, s), t.V.kind) {
    case "scalar":
      Cn(i, t.V.T, 2, r);
      break;
    case "enum":
      Cn(i, w.INT32, 2, r);
      break;
    case "message":
      ie(r !== void 0), i.tag(2, se.LengthDelimited).bytes(r.toBinary(e));
      break;
  }
  i.join();
}
function ka(i, e, t, n) {
  const r = Zo(t.T, n);
  t.delimited ? i.tag(t.no, se.StartGroup).raw(r.toBinary(e)).tag(t.no, se.EndGroup) : i.tag(t.no, se.LengthDelimited).bytes(r.toBinary(e));
}
function Cn(i, e, t, n) {
  ie(n !== void 0);
  let r = ec(e), s = L(r, 2), a = s[0], o = s[1];
  i.tag(t, a)[o](n);
}
function du(i, e, t, n) {
  if (!n.length)
    return;
  i.tag(t, se.LengthDelimited).fork();
  let r = ec(e), s = L(r, 2), a = s[1];
  for (let o = 0; o < n.length; o++)
    i[a](n[o]);
  i.join();
}
function ec(i) {
  let e = se.Varint;
  switch (i) {
    case w.BYTES:
    case w.STRING:
      e = se.LengthDelimited;
      break;
    case w.DOUBLE:
    case w.FIXED64:
    case w.SFIXED64:
      e = se.Bit64;
      break;
    case w.FIXED32:
    case w.SFIXED32:
    case w.FLOAT:
      e = se.Bit32;
      break;
  }
  const t = w[i].toLowerCase();
  return [e, t];
}
function lu() {
  return {
    setEnumType: Bo,
    initPartial(i, e) {
      if (i === void 0)
        return;
      const t = e.getType();
      for (const r of t.fields.byMember()) {
        const s = r.localName, a = e, o = i;
        if (o[s] != null)
          switch (r.kind) {
            case "oneof":
              const c = o[s].case;
              if (c === void 0)
                continue;
              const d = r.findField(c);
              let l = o[s].value;
              d && d.kind == "message" && !dt(l, d.T) ? l = new d.T(l) : d && d.kind === "scalar" && d.T === w.BYTES && (l = mn(l)), a[s] = {
                case: c,
                value: l
              };
              break;
            case "scalar":
            case "enum":
              let u = o[s];
              r.T === w.BYTES && (u = r.repeated ? u.map(mn) : mn(u)), a[s] = u;
              break;
            case "map":
              switch (r.V.kind) {
                case "scalar":
                case "enum":
                  if (r.V.T === w.BYTES)
                    for (const g of Object.entries(o[s])) {
                      var n = L(g, 2);
                      const p = n[0], k = n[1];
                      a[s][p] = mn(k);
                    }
                  else
                    Object.assign(a[s], o[s]);
                  break;
                case "message":
                  const f = r.V.T;
                  for (const g of Object.keys(o[s])) {
                    let p = o[s][g];
                    f.fieldWrapper || (p = new f(p)), a[s][g] = p;
                  }
                  break;
              }
              break;
            case "message":
              const h = r.T;
              if (r.repeated)
                a[s] = o[s].map((f) => dt(f, h) ? f : new h(f));
              else {
                const f = o[s];
                h.fieldWrapper ? /* We can't use BytesValue.typeName as that will create a circular import */ h.typeName === "google.protobuf.BytesValue" ? a[s] = mn(f) : a[s] = f : a[s] = dt(f, h) ? f : new h(f);
              }
              break;
          }
      }
    },
    // TODO use isFieldSet() here to support future field presence
    equals(i, e, t) {
      return e === t ? !0 : !e || !t ? !1 : i.fields.byMember().every((n) => {
        const r = e[n.localName], s = t[n.localName];
        if (n.repeated) {
          if (r.length !== s.length)
            return !1;
          switch (n.kind) {
            case "message":
              return r.every((a, o) => n.T.equals(a, s[o]));
            case "scalar":
              return r.every((a, o) => mt(n.T, a, s[o]));
            case "enum":
              return r.every((a, o) => mt(w.INT32, a, s[o]));
          }
          throw new Error("repeated cannot contain ".concat(n.kind));
        }
        switch (n.kind) {
          case "message":
            let a = r, o = s;
            return n.T.fieldWrapper && (a !== void 0 && !dt(a) && (a = n.T.fieldWrapper.wrapField(a)), o !== void 0 && !dt(o) && (o = n.T.fieldWrapper.wrapField(o))), n.T.equals(a, o);
          case "enum":
            return mt(w.INT32, r, s);
          case "scalar":
            return mt(n.T, r, s);
          case "oneof":
            if (r.case !== s.case)
              return !1;
            const c = n.findField(r.case);
            if (c === void 0)
              return !0;
            switch (c.kind) {
              case "message":
                return c.T.equals(r.value, s.value);
              case "enum":
                return mt(w.INT32, r.value, s.value);
              case "scalar":
                return mt(c.T, r.value, s.value);
            }
            throw new Error("oneof cannot contain ".concat(c.kind));
          case "map":
            const d = Object.keys(r).concat(Object.keys(s));
            switch (n.V.kind) {
              case "message":
                const l = n.V.T;
                return d.every((h) => l.equals(r[h], s[h]));
              case "enum":
                return d.every((h) => mt(w.INT32, r[h], s[h]));
              case "scalar":
                const u = n.V.T;
                return d.every((h) => mt(u, r[h], s[h]));
            }
            break;
        }
      });
    },
    // TODO use isFieldSet() here to support future field presence
    clone(i) {
      const e = i.getType(), t = new e(), n = t;
      for (const s of e.fields.byMember()) {
        const a = i[s.localName];
        let o;
        if (s.repeated)
          o = a.map(Yn);
        else if (s.kind == "map") {
          o = n[s.localName];
          for (const c of Object.entries(a)) {
            var r = L(c, 2);
            const d = r[0], l = r[1];
            o[d] = Yn(l);
          }
        } else s.kind == "oneof" ? o = s.findField(a.case) ? {
          case: a.case,
          value: Yn(a.value)
        } : {
          case: void 0
        } : o = Yn(a);
        n[s.localName] = o;
      }
      for (const s of e.runtime.bin.listUnknownFields(i))
        e.runtime.bin.onUnknownField(n, s.no, s.wireType, s.data);
      return t;
    }
  };
}
function Yn(i) {
  if (i === void 0)
    return i;
  if (dt(i))
    return i.clone();
  if (i instanceof Uint8Array) {
    const e = new Uint8Array(i.byteLength);
    return e.set(i), e;
  }
  return i;
}
function mn(i) {
  return i instanceof Uint8Array ? i : new Uint8Array(i);
}
function uu(i, e, t) {
  return {
    syntax: i,
    json: eu(),
    bin: su(),
    util: Object.assign(Object.assign({}, lu()), {
      newFieldList: e,
      initFields: t
    }),
    makeMessageType(n, r, s) {
      return Il(this, n, r, s);
    },
    makeEnum: Rl,
    makeEnumType: qo,
    getEnumType: Pl,
    makeExtension(n, r, s) {
      return zl(this, n, r, s);
    }
  };
}
class hu {
  constructor(e, t) {
    this._fields = e, this._normalizer = t;
  }
  findJsonName(e) {
    if (!this.jsonNames) {
      const t = {};
      for (const n of this.list())
        t[n.jsonName] = t[n.name] = n;
      this.jsonNames = t;
    }
    return this.jsonNames[e];
  }
  find(e) {
    if (!this.numbers) {
      const t = {};
      for (const n of this.list())
        t[n.no] = n;
      this.numbers = t;
    }
    return this.numbers[e];
  }
  list() {
    return this.all || (this.all = this._normalizer(this._fields)), this.all;
  }
  byNumber() {
    return this.numbersAsc || (this.numbersAsc = this.list().concat().sort((e, t) => e.no - t.no)), this.numbersAsc;
  }
  byMember() {
    if (!this.members) {
      this.members = [];
      const e = this.members;
      let t;
      for (const n of this.list())
        n.oneof ? n.oneof !== t && (t = n.oneof, e.push(t)) : e.push(n);
    }
    return this.members;
  }
}
function tc(i, e) {
  const t = nc(i);
  return e ? t : bu(vu(t));
}
function fu(i) {
  return tc(i, !1);
}
const mu = nc;
function nc(i) {
  let e = !1;
  const t = [];
  for (let n = 0; n < i.length; n++) {
    let r = i.charAt(n);
    switch (r) {
      case "_":
        e = !0;
        break;
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        t.push(r), e = !1;
        break;
      default:
        e && (e = !1, r = r.toUpperCase()), t.push(r);
        break;
    }
  }
  return t.join("");
}
const pu = /* @__PURE__ */ new Set([
  // names reserved by JavaScript
  "constructor",
  "toString",
  "toJSON",
  "valueOf"
]), gu = /* @__PURE__ */ new Set([
  // names reserved by the runtime
  "getType",
  "clone",
  "equals",
  "fromBinary",
  "fromJson",
  "fromJsonString",
  "toBinary",
  "toJson",
  "toJsonString",
  // names reserved by the runtime for the future
  "toObject"
]), ic = (i) => "".concat(i, "$"), vu = (i) => gu.has(i) ? ic(i) : i, bu = (i) => pu.has(i) ? ic(i) : i;
class yu {
  constructor(e) {
    this.kind = "oneof", this.repeated = !1, this.packed = !1, this.opt = !1, this.req = !1, this.default = void 0, this.fields = [], this.name = e, this.localName = fu(e);
  }
  addField(e) {
    ie(e.oneof === this, "field ".concat(e.name, " not one of ").concat(this.name)), this.fields.push(e);
  }
  findField(e) {
    if (!this._lookup) {
      this._lookup = /* @__PURE__ */ Object.create(null);
      for (let t = 0; t < this.fields.length; t++)
        this._lookup[this.fields[t].localName] = this.fields[t];
    }
    return this._lookup[e];
  }
}
function ku(i, e) {
  var t, n, r, s, a, o;
  const c = [];
  let d;
  for (const l of typeof i == "function" ? i() : i) {
    const u = l;
    if (u.localName = tc(l.name, l.oneof !== void 0), u.jsonName = (t = l.jsonName) !== null && t !== void 0 ? t : mu(l.name), u.repeated = (n = l.repeated) !== null && n !== void 0 ? n : !1, l.kind == "scalar" && (u.L = (r = l.L) !== null && r !== void 0 ? r : wt.BIGINT), u.delimited = (s = l.delimited) !== null && s !== void 0 ? s : !1, u.req = (a = l.req) !== null && a !== void 0 ? a : !1, u.opt = (o = l.opt) !== null && o !== void 0 ? o : !1, l.packed === void 0 && (u.packed = l.kind == "enum" || l.kind == "scalar" && l.T != w.BYTES && l.T != w.STRING), l.oneof !== void 0) {
      const h = typeof l.oneof == "string" ? l.oneof : l.oneof.name;
      (!d || d.name != h) && (d = new yu(h)), u.oneof = d, d.addField(u);
    }
    c.push(u);
  }
  return c;
}
const v = uu(
  "proto3",
  (i) => new hu(i, (e) => ku(e)),
  // TODO merge with proto2 and initExtensionField, also see initPartial, equals, clone
  (i) => {
    for (const e of i.getType().fields.byMember()) {
      if (e.opt)
        continue;
      const t = e.localName, n = i;
      if (e.repeated) {
        n[t] = [];
        continue;
      }
      switch (e.kind) {
        case "oneof":
          n[t] = {
            case: void 0
          };
          break;
        case "enum":
          n[t] = 0;
          break;
        case "map":
          n[t] = {};
          break;
        case "scalar":
          n[t] = cn(e.T, e.L);
          break;
      }
    }
  }
);
class Pe extends Ts {
  constructor(e) {
    super(), this.seconds = ee.zero, this.nanos = 0, v.util.initPartial(e, this);
  }
  fromJson(e, t) {
    if (typeof e != "string")
      throw new Error("cannot decode google.protobuf.Timestamp from JSON: ".concat(v.json.debug(e)));
    const n = e.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:Z|\.([0-9]{3,9})Z|([+-][0-9][0-9]:[0-9][0-9]))$/);
    if (!n)
      throw new Error("cannot decode google.protobuf.Timestamp from JSON: invalid RFC 3339 string");
    const r = Date.parse(n[1] + "-" + n[2] + "-" + n[3] + "T" + n[4] + ":" + n[5] + ":" + n[6] + (n[8] ? n[8] : "Z"));
    if (Number.isNaN(r))
      throw new Error("cannot decode google.protobuf.Timestamp from JSON: invalid RFC 3339 string");
    if (r < Date.parse("0001-01-01T00:00:00Z") || r > Date.parse("9999-12-31T23:59:59Z"))
      throw new Error("cannot decode message google.protobuf.Timestamp from JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive");
    return this.seconds = ee.parse(r / 1e3), this.nanos = 0, n[7] && (this.nanos = parseInt("1" + n[7] + "0".repeat(9 - n[7].length)) - 1e9), this;
  }
  toJson(e) {
    const t = Number(this.seconds) * 1e3;
    if (t < Date.parse("0001-01-01T00:00:00Z") || t > Date.parse("9999-12-31T23:59:59Z"))
      throw new Error("cannot encode google.protobuf.Timestamp to JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive");
    if (this.nanos < 0)
      throw new Error("cannot encode google.protobuf.Timestamp to JSON: nanos must not be negative");
    let n = "Z";
    if (this.nanos > 0) {
      const r = (this.nanos + 1e9).toString().substring(1);
      r.substring(3) === "000000" ? n = "." + r.substring(0, 3) + "Z" : r.substring(6) === "000" ? n = "." + r.substring(0, 6) + "Z" : n = "." + r + "Z";
    }
    return new Date(t).toISOString().replace(".000Z", n);
  }
  toDate() {
    return new Date(Number(this.seconds) * 1e3 + Math.ceil(this.nanos / 1e6));
  }
  static now() {
    return Pe.fromDate(/* @__PURE__ */ new Date());
  }
  static fromDate(e) {
    const t = e.getTime();
    return new Pe({
      seconds: ee.parse(Math.floor(t / 1e3)),
      nanos: t % 1e3 * 1e6
    });
  }
  static fromBinary(e, t) {
    return new Pe().fromBinary(e, t);
  }
  static fromJson(e, t) {
    return new Pe().fromJson(e, t);
  }
  static fromJsonString(e, t) {
    return new Pe().fromJsonString(e, t);
  }
  static equals(e, t) {
    return v.util.equals(Pe, e, t);
  }
}
Pe.runtime = v;
Pe.typeName = "google.protobuf.Timestamp";
Pe.fields = v.util.newFieldList(() => [{
  no: 1,
  name: "seconds",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "nanos",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}]);
const Tu = /* @__PURE__ */ v.makeMessageType("livekit.MetricsBatch", () => [{
  no: 1,
  name: "timestamp_ms",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "normalized_timestamp",
  kind: "message",
  T: Pe
}, {
  no: 3,
  name: "str_data",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 4,
  name: "time_series",
  kind: "message",
  T: Su,
  repeated: !0
}, {
  no: 5,
  name: "events",
  kind: "message",
  T: Eu,
  repeated: !0
}]), Su = /* @__PURE__ */ v.makeMessageType("livekit.TimeSeriesMetric", () => [{
  no: 1,
  name: "label",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "participant_identity",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "track_sid",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "samples",
  kind: "message",
  T: Cu,
  repeated: !0
}, {
  no: 5,
  name: "rid",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Cu = /* @__PURE__ */ v.makeMessageType("livekit.MetricSample", () => [{
  no: 1,
  name: "timestamp_ms",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "normalized_timestamp",
  kind: "message",
  T: Pe
}, {
  no: 3,
  name: "value",
  kind: "scalar",
  T: 2
  /* ScalarType.FLOAT */
}]), Eu = /* @__PURE__ */ v.makeMessageType("livekit.EventMetric", () => [{
  no: 1,
  name: "label",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "participant_identity",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "track_sid",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "start_timestamp_ms",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 5,
  name: "end_timestamp_ms",
  kind: "scalar",
  T: 3,
  opt: !0
}, {
  no: 6,
  name: "normalized_start_timestamp",
  kind: "message",
  T: Pe
}, {
  no: 7,
  name: "normalized_end_timestamp",
  kind: "message",
  T: Pe,
  opt: !0
}, {
  no: 8,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 9,
  name: "rid",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), wu = /* @__PURE__ */ v.makeEnum("livekit.AudioCodec", [{
  no: 0,
  name: "DEFAULT_AC"
}, {
  no: 1,
  name: "OPUS"
}, {
  no: 2,
  name: "AAC"
}, {
  no: 3,
  name: "AC_MP3"
}]), _u = /* @__PURE__ */ v.makeEnum("livekit.VideoCodec", [{
  no: 0,
  name: "DEFAULT_VC"
}, {
  no: 1,
  name: "H264_BASELINE"
}, {
  no: 2,
  name: "H264_MAIN"
}, {
  no: 3,
  name: "H264_HIGH"
}, {
  no: 4,
  name: "VP8"
}]), Pu = /* @__PURE__ */ v.makeEnum("livekit.ImageCodec", [{
  no: 0,
  name: "IC_DEFAULT"
}, {
  no: 1,
  name: "IC_JPEG"
}]), rc = /* @__PURE__ */ v.makeEnum("livekit.BackupCodecPolicy", [{
  no: 0,
  name: "PREFER_REGRESSION"
}, {
  no: 1,
  name: "SIMULCAST"
}, {
  no: 2,
  name: "REGRESSION"
}]), je = /* @__PURE__ */ v.makeEnum("livekit.TrackType", [{
  no: 0,
  name: "AUDIO"
}, {
  no: 1,
  name: "VIDEO"
}, {
  no: 2,
  name: "DATA"
}]), ce = /* @__PURE__ */ v.makeEnum("livekit.TrackSource", [{
  no: 0,
  name: "UNKNOWN"
}, {
  no: 1,
  name: "CAMERA"
}, {
  no: 2,
  name: "MICROPHONE"
}, {
  no: 3,
  name: "SCREEN_SHARE"
}, {
  no: 4,
  name: "SCREEN_SHARE_AUDIO"
}]), Cs = /* @__PURE__ */ v.makeEnum("livekit.VideoQuality", [{
  no: 0,
  name: "LOW"
}, {
  no: 1,
  name: "MEDIUM"
}, {
  no: 2,
  name: "HIGH"
}, {
  no: 3,
  name: "OFF"
}]), zt = /* @__PURE__ */ v.makeEnum("livekit.ConnectionQuality", [{
  no: 0,
  name: "POOR"
}, {
  no: 1,
  name: "GOOD"
}, {
  no: 2,
  name: "EXCELLENT"
}, {
  no: 3,
  name: "LOST"
}]), An = /* @__PURE__ */ v.makeEnum("livekit.ClientConfigSetting", [{
  no: 0,
  name: "UNSET"
}, {
  no: 1,
  name: "DISABLED"
}, {
  no: 2,
  name: "ENABLED"
}]), Ae = /* @__PURE__ */ v.makeEnum("livekit.DisconnectReason", [{
  no: 0,
  name: "UNKNOWN_REASON"
}, {
  no: 1,
  name: "CLIENT_INITIATED"
}, {
  no: 2,
  name: "DUPLICATE_IDENTITY"
}, {
  no: 3,
  name: "SERVER_SHUTDOWN"
}, {
  no: 4,
  name: "PARTICIPANT_REMOVED"
}, {
  no: 5,
  name: "ROOM_DELETED"
}, {
  no: 6,
  name: "STATE_MISMATCH"
}, {
  no: 7,
  name: "JOIN_FAILURE"
}, {
  no: 8,
  name: "MIGRATION"
}, {
  no: 9,
  name: "SIGNAL_CLOSE"
}, {
  no: 10,
  name: "ROOM_CLOSED"
}, {
  no: 11,
  name: "USER_UNAVAILABLE"
}, {
  no: 12,
  name: "USER_REJECTED"
}, {
  no: 13,
  name: "SIP_TRUNK_FAILURE"
}, {
  no: 14,
  name: "CONNECTION_TIMEOUT"
}, {
  no: 15,
  name: "MEDIA_FAILURE"
}, {
  no: 16,
  name: "AGENT_ERROR"
}]), rt = /* @__PURE__ */ v.makeEnum("livekit.ReconnectReason", [{
  no: 0,
  name: "RR_UNKNOWN"
}, {
  no: 1,
  name: "RR_SIGNAL_DISCONNECTED"
}, {
  no: 2,
  name: "RR_PUBLISHER_FAILED"
}, {
  no: 3,
  name: "RR_SUBSCRIBER_FAILED"
}, {
  no: 4,
  name: "RR_SWITCH_CANDIDATE"
}]), Ru = /* @__PURE__ */ v.makeEnum("livekit.SubscriptionError", [{
  no: 0,
  name: "SE_UNKNOWN"
}, {
  no: 1,
  name: "SE_CODEC_UNSUPPORTED"
}, {
  no: 2,
  name: "SE_TRACK_NOTFOUND"
}]), fe = /* @__PURE__ */ v.makeEnum("livekit.AudioTrackFeature", [{
  no: 0,
  name: "TF_STEREO"
}, {
  no: 1,
  name: "TF_NO_DTX"
}, {
  no: 2,
  name: "TF_AUTO_GAIN_CONTROL"
}, {
  no: 3,
  name: "TF_ECHO_CANCELLATION"
}, {
  no: 4,
  name: "TF_NOISE_SUPPRESSION"
}, {
  no: 5,
  name: "TF_ENHANCED_NOISE_CANCELLATION"
}, {
  no: 6,
  name: "TF_PRECONNECT_BUFFER"
}]), dn = /* @__PURE__ */ v.makeEnum("livekit.PacketTrailerFeature", [{
  no: 0,
  name: "PTF_USER_TIMESTAMP"
}, {
  no: 1,
  name: "PTF_FRAME_ID"
}, {
  no: 2,
  name: "PTF_USER_DATA"
}]), Li = /* @__PURE__ */ v.makeMessageType("livekit.Room", () => [{
  no: 1,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "empty_timeout",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 14,
  name: "departure_timeout",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "max_participants",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 5,
  name: "creation_time",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 15,
  name: "creation_time_ms",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 6,
  name: "turn_password",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 7,
  name: "enabled_codecs",
  kind: "message",
  T: ki,
  repeated: !0
}, {
  no: 8,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 9,
  name: "num_participants",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 11,
  name: "num_publishers",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 10,
  name: "active_recording",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 13,
  name: "version",
  kind: "message",
  T: bc
}]), ki = /* @__PURE__ */ v.makeMessageType("livekit.Codec", () => [{
  no: 1,
  name: "mime",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "fmtp_line",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Iu = /* @__PURE__ */ v.makeMessageType("livekit.ParticipantPermission", () => [{
  no: 1,
  name: "can_subscribe",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 2,
  name: "can_publish",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "can_publish_data",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 9,
  name: "can_publish_sources",
  kind: "enum",
  T: v.getEnumType(ce),
  repeated: !0
}, {
  no: 7,
  name: "hidden",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 8,
  name: "recorder",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 10,
  name: "can_update_metadata",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 11,
  name: "agent",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 12,
  name: "can_subscribe_metrics",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 13,
  name: "can_manage_agent_session",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), qt = /* @__PURE__ */ v.makeMessageType("livekit.ParticipantInfo", () => [{
  no: 1,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "state",
  kind: "enum",
  T: v.getEnumType(Yt)
}, {
  no: 4,
  name: "tracks",
  kind: "message",
  T: Jt,
  repeated: !0
}, {
  no: 5,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "joined_at",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 17,
  name: "joined_at_ms",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 9,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 10,
  name: "version",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 11,
  name: "permission",
  kind: "message",
  T: Iu
}, {
  no: 12,
  name: "region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 13,
  name: "is_publisher",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 14,
  name: "kind",
  kind: "enum",
  T: v.getEnumType(Dn)
}, {
  no: 15,
  name: "attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 16,
  name: "disconnect_reason",
  kind: "enum",
  T: v.getEnumType(Ae)
}, {
  no: 18,
  name: "kind_details",
  kind: "enum",
  T: v.getEnumType(Mu),
  repeated: !0
}, {
  no: 19,
  name: "data_tracks",
  kind: "message",
  T: xi,
  repeated: !0
}, {
  no: 20,
  name: "client_protocol",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 21,
  name: "capabilities",
  kind: "enum",
  T: v.getEnumType(Ln),
  repeated: !0
}]), Yt = /* @__PURE__ */ v.makeEnum("livekit.ParticipantInfo.State", [{
  no: 0,
  name: "JOINING"
}, {
  no: 1,
  name: "JOINED"
}, {
  no: 2,
  name: "ACTIVE"
}, {
  no: 3,
  name: "DISCONNECTED"
}]), Dn = /* @__PURE__ */ v.makeEnum("livekit.ParticipantInfo.Kind", [{
  no: 0,
  name: "STANDARD"
}, {
  no: 1,
  name: "INGRESS"
}, {
  no: 2,
  name: "EGRESS"
}, {
  no: 3,
  name: "SIP"
}, {
  no: 4,
  name: "AGENT"
}, {
  no: 7,
  name: "CONNECTOR"
}, {
  no: 8,
  name: "BRIDGE"
}]), Mu = /* @__PURE__ */ v.makeEnum("livekit.ParticipantInfo.KindDetail", [{
  no: 0,
  name: "CLOUD_AGENT"
}, {
  no: 1,
  name: "FORWARDED"
}, {
  no: 2,
  name: "CONNECTOR_WHATSAPP"
}, {
  no: 3,
  name: "CONNECTOR_TWILIO"
}, {
  no: 4,
  name: "BRIDGE_RTSP"
}, {
  no: 5,
  name: "SIMULATION"
}]), G = /* @__PURE__ */ v.makeEnum("livekit.Encryption.Type", [{
  no: 0,
  name: "NONE"
}, {
  no: 1,
  name: "GCM"
}, {
  no: 2,
  name: "CUSTOM"
}]), Ou = /* @__PURE__ */ v.makeMessageType("livekit.SimulcastCodecInfo", () => [{
  no: 1,
  name: "mime_type",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "mid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "cid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "layers",
  kind: "message",
  T: kt,
  repeated: !0
}, {
  no: 5,
  name: "video_layer_mode",
  kind: "enum",
  T: v.getEnumType(_s)
}, {
  no: 6,
  name: "sdp_cid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Jt = /* @__PURE__ */ v.makeMessageType("livekit.TrackInfo", () => [{
  no: 1,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "type",
  kind: "enum",
  T: v.getEnumType(je)
}, {
  no: 3,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "muted",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 5,
  name: "width",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 6,
  name: "height",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 7,
  name: "simulcast",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 8,
  name: "disable_dtx",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 9,
  name: "source",
  kind: "enum",
  T: v.getEnumType(ce)
}, {
  no: 10,
  name: "layers",
  kind: "message",
  T: kt,
  repeated: !0
}, {
  no: 11,
  name: "mime_type",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 12,
  name: "mid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 13,
  name: "codecs",
  kind: "message",
  T: Ou,
  repeated: !0
}, {
  no: 14,
  name: "stereo",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 15,
  name: "disable_red",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 16,
  name: "encryption",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 17,
  name: "stream",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 18,
  name: "version",
  kind: "message",
  T: bc
}, {
  no: 19,
  name: "audio_features",
  kind: "enum",
  T: v.getEnumType(fe),
  repeated: !0
}, {
  no: 20,
  name: "backup_codec_policy",
  kind: "enum",
  T: v.getEnumType(rc)
}, {
  no: 21,
  name: "packet_trailer_features",
  kind: "enum",
  T: v.getEnumType(dn),
  repeated: !0
}]), xi = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackInfo", () => [{
  no: 1,
  name: "pub_handle",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "encryption",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 5,
  name: "frame_encoding",
  kind: "message",
  T: sc,
  opt: !0
}, {
  no: 6,
  name: "schema",
  kind: "message",
  T: Es,
  opt: !0
}]), sc = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackFrameEncoding", () => [{
  no: 1,
  name: "well_known",
  kind: "enum",
  T: v.getEnumType(Au),
  oneof: "value"
}, {
  no: 2,
  name: "custom",
  kind: "scalar",
  T: 9,
  oneof: "value"
}]), Au = /* @__PURE__ */ v.makeEnum("livekit.DataTrackFrameEncoding.WellKnownFrameEncoding", [{
  no: 0,
  name: "WELL_KNOWN_FRAME_ENCODING_UNSPECIFIED",
  localName: "UNSPECIFIED"
}, {
  no: 1,
  name: "WELL_KNOWN_FRAME_ENCODING_ROS1",
  localName: "ROS1"
}, {
  no: 2,
  name: "WELL_KNOWN_FRAME_ENCODING_CDR",
  localName: "CDR"
}, {
  no: 3,
  name: "WELL_KNOWN_FRAME_ENCODING_PROTOBUF",
  localName: "PROTOBUF"
}, {
  no: 4,
  name: "WELL_KNOWN_FRAME_ENCODING_FLATBUFFER",
  localName: "FLATBUFFER"
}, {
  no: 5,
  name: "WELL_KNOWN_FRAME_ENCODING_CBOR",
  localName: "CBOR"
}, {
  no: 6,
  name: "WELL_KNOWN_FRAME_ENCODING_MSGPACK",
  localName: "MSGPACK"
}, {
  no: 7,
  name: "WELL_KNOWN_FRAME_ENCODING_JSON",
  localName: "JSON"
}]), Du = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackSchemaEncoding", () => [{
  no: 1,
  name: "well_known",
  kind: "enum",
  T: v.getEnumType(Lu),
  oneof: "value"
}, {
  no: 2,
  name: "custom",
  kind: "scalar",
  T: 9,
  oneof: "value"
}]), Lu = /* @__PURE__ */ v.makeEnum("livekit.DataTrackSchemaEncoding.WellKnownSchemaEncoding", [{
  no: 0,
  name: "WELL_KNOWN_SCHEMA_ENCODING_UNSPECIFIED",
  localName: "UNSPECIFIED"
}, {
  no: 1,
  name: "WELL_KNOWN_SCHEMA_ENCODING_PROTOBUF",
  localName: "PROTOBUF"
}, {
  no: 2,
  name: "WELL_KNOWN_SCHEMA_ENCODING_FLATBUFFER",
  localName: "FLATBUFFER"
}, {
  no: 3,
  name: "WELL_KNOWN_SCHEMA_ENCODING_ROS1_MSG",
  localName: "ROS1_MSG"
}, {
  no: 4,
  name: "WELL_KNOWN_SCHEMA_ENCODING_ROS2_MSG",
  localName: "ROS2_MSG"
}, {
  no: 5,
  name: "WELL_KNOWN_SCHEMA_ENCODING_ROS2_IDL",
  localName: "ROS2_IDL"
}, {
  no: 6,
  name: "WELL_KNOWN_SCHEMA_ENCODING_OMG_IDL",
  localName: "OMG_IDL"
}, {
  no: 7,
  name: "WELL_KNOWN_SCHEMA_ENCODING_JSON_SCHEMA",
  localName: "JSON_SCHEMA"
}]), Es = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackSchemaId", () => [{
  no: 1,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "encoding",
  kind: "message",
  T: Du
}]), xu = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackSubscriptionOptions", () => [{
  no: 1,
  name: "target_fps",
  kind: "scalar",
  T: 13,
  opt: !0
}]), ws = /* @__PURE__ */ v.makeMessageType("livekit.DataBlobKey", () => [{
  no: 1,
  name: "generic",
  kind: "scalar",
  T: 9,
  oneof: "key"
}, {
  no: 2,
  name: "schema_id",
  kind: "message",
  T: Es,
  oneof: "key"
}]), ac = /* @__PURE__ */ v.makeMessageType("livekit.DataBlob", () => [{
  no: 1,
  name: "key",
  kind: "message",
  T: ws
}, {
  no: 2,
  name: "contents",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}]), kt = /* @__PURE__ */ v.makeMessageType("livekit.VideoLayer", () => [{
  no: 1,
  name: "quality",
  kind: "enum",
  T: v.getEnumType(Cs)
}, {
  no: 2,
  name: "width",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "height",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "bitrate",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 5,
  name: "ssrc",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 6,
  name: "spatial_layer",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 7,
  name: "rid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 8,
  name: "repair_ssrc",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), _s = /* @__PURE__ */ v.makeEnum("livekit.VideoLayer.Mode", [{
  no: 0,
  name: "MODE_UNUSED"
}, {
  no: 1,
  name: "ONE_SPATIAL_LAYER_PER_STREAM"
}, {
  no: 2,
  name: "MULTIPLE_SPATIAL_LAYERS_PER_STREAM"
}, {
  no: 3,
  name: "ONE_SPATIAL_LAYER_PER_STREAM_INCOMPLETE_RTCP_SR"
}]), Ce = /* @__PURE__ */ v.makeMessageType("livekit.DataPacket", () => [{
  no: 1,
  name: "kind",
  kind: "enum",
  T: v.getEnumType(Tt)
}, {
  no: 4,
  name: "participant_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "destination_identities",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 2,
  name: "user",
  kind: "message",
  T: Ps,
  oneof: "value"
}, {
  no: 3,
  name: "speaker",
  kind: "message",
  T: Nu,
  oneof: "value"
}, {
  no: 6,
  name: "sip_dtmf",
  kind: "message",
  T: lc,
  oneof: "value"
}, {
  no: 7,
  name: "transcription",
  kind: "message",
  T: Uu,
  oneof: "value"
}, {
  no: 8,
  name: "metrics",
  kind: "message",
  T: Tu,
  oneof: "value"
}, {
  no: 9,
  name: "chat_message",
  kind: "message",
  T: Ti,
  oneof: "value"
}, {
  no: 10,
  name: "rpc_request",
  kind: "message",
  T: Rs,
  oneof: "value"
}, {
  no: 11,
  name: "rpc_ack",
  kind: "message",
  T: Ni,
  oneof: "value"
}, {
  no: 12,
  name: "rpc_response",
  kind: "message",
  T: Is,
  oneof: "value"
}, {
  no: 13,
  name: "stream_header",
  kind: "message",
  T: Ui,
  oneof: "value"
}, {
  no: 14,
  name: "stream_chunk",
  kind: "message",
  T: lt,
  oneof: "value"
}, {
  no: 15,
  name: "stream_trailer",
  kind: "message",
  T: Ms,
  oneof: "value"
}, {
  no: 18,
  name: "encrypted_packet",
  kind: "message",
  T: oc,
  oneof: "value"
}, {
  no: 16,
  name: "sequence",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 17,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Tt = /* @__PURE__ */ v.makeEnum("livekit.DataPacket.Kind", [{
  no: 0,
  name: "RELIABLE"
}, {
  no: 1,
  name: "LOSSY"
}]), oc = /* @__PURE__ */ v.makeMessageType("livekit.EncryptedPacket", () => [{
  no: 1,
  name: "encryption_type",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 2,
  name: "iv",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}, {
  no: 3,
  name: "key_index",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "encrypted_value",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}]), cc = /* @__PURE__ */ v.makeMessageType("livekit.EncryptedPacketPayload", () => [{
  no: 1,
  name: "user",
  kind: "message",
  T: Ps,
  oneof: "value"
}, {
  no: 3,
  name: "chat_message",
  kind: "message",
  T: Ti,
  oneof: "value"
}, {
  no: 4,
  name: "rpc_request",
  kind: "message",
  T: Rs,
  oneof: "value"
}, {
  no: 5,
  name: "rpc_ack",
  kind: "message",
  T: Ni,
  oneof: "value"
}, {
  no: 6,
  name: "rpc_response",
  kind: "message",
  T: Is,
  oneof: "value"
}, {
  no: 7,
  name: "stream_header",
  kind: "message",
  T: Ui,
  oneof: "value"
}, {
  no: 8,
  name: "stream_chunk",
  kind: "message",
  T: lt,
  oneof: "value"
}, {
  no: 9,
  name: "stream_trailer",
  kind: "message",
  T: Ms,
  oneof: "value"
}]), Nu = /* @__PURE__ */ v.makeMessageType("livekit.ActiveSpeakerUpdate", () => [{
  no: 1,
  name: "speakers",
  kind: "message",
  T: dc,
  repeated: !0
}]), dc = /* @__PURE__ */ v.makeMessageType("livekit.SpeakerInfo", () => [{
  no: 1,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "level",
  kind: "scalar",
  T: 2
  /* ScalarType.FLOAT */
}, {
  no: 3,
  name: "active",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), Ps = /* @__PURE__ */ v.makeMessageType("livekit.UserPacket", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "participant_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "payload",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}, {
  no: 3,
  name: "destination_sids",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 6,
  name: "destination_identities",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 4,
  name: "topic",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 8,
  name: "id",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 9,
  name: "start_time",
  kind: "scalar",
  T: 4,
  opt: !0
}, {
  no: 10,
  name: "end_time",
  kind: "scalar",
  T: 4,
  opt: !0
}, {
  no: 11,
  name: "nonce",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}]), lc = /* @__PURE__ */ v.makeMessageType("livekit.SipDTMF", () => [{
  no: 3,
  name: "code",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "digit",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Uu = /* @__PURE__ */ v.makeMessageType("livekit.Transcription", () => [{
  no: 2,
  name: "transcribed_participant_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "track_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "segments",
  kind: "message",
  T: Fu,
  repeated: !0
}]), Fu = /* @__PURE__ */ v.makeMessageType("livekit.TranscriptionSegment", () => [{
  no: 1,
  name: "id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "text",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "start_time",
  kind: "scalar",
  T: 4
  /* ScalarType.UINT64 */
}, {
  no: 4,
  name: "end_time",
  kind: "scalar",
  T: 4
  /* ScalarType.UINT64 */
}, {
  no: 5,
  name: "final",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 6,
  name: "language",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Ti = /* @__PURE__ */ v.makeMessageType("livekit.ChatMessage", () => [{
  no: 1,
  name: "id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "timestamp",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 3,
  name: "edit_timestamp",
  kind: "scalar",
  T: 3,
  opt: !0
}, {
  no: 4,
  name: "message",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "deleted",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 6,
  name: "generated",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), Rs = /* @__PURE__ */ v.makeMessageType("livekit.RpcRequest", () => [{
  no: 1,
  name: "id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "method",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "payload",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "response_timeout_ms",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 5,
  name: "version",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 6,
  name: "compressed_payload",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}]), Ni = /* @__PURE__ */ v.makeMessageType("livekit.RpcAck", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Is = /* @__PURE__ */ v.makeMessageType("livekit.RpcResponse", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "payload",
  kind: "scalar",
  T: 9,
  oneof: "value"
}, {
  no: 3,
  name: "error",
  kind: "message",
  T: uc,
  oneof: "value"
}, {
  no: 4,
  name: "compressed_payload",
  kind: "scalar",
  T: 12,
  oneof: "value"
}]), uc = /* @__PURE__ */ v.makeMessageType("livekit.RpcError", () => [{
  no: 1,
  name: "code",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "message",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "data",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), hc = /* @__PURE__ */ v.makeMessageType("livekit.ParticipantTracks", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "track_sids",
  kind: "scalar",
  T: 9,
  repeated: !0
}]), fc = /* @__PURE__ */ v.makeMessageType("livekit.ServerInfo", () => [{
  no: 1,
  name: "edition",
  kind: "enum",
  T: v.getEnumType(mc)
}, {
  no: 2,
  name: "version",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "protocol",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 4,
  name: "region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "node_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "debug_info",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 7,
  name: "agent_protocol",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}]), mc = /* @__PURE__ */ v.makeEnum("livekit.ServerInfo.Edition", [{
  no: 0,
  name: "Standard"
}, {
  no: 1,
  name: "Cloud"
}]), pc = /* @__PURE__ */ v.makeMessageType("livekit.ClientInfo", () => [{
  no: 1,
  name: "sdk",
  kind: "enum",
  T: v.getEnumType(gc)
}, {
  no: 2,
  name: "version",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "protocol",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 4,
  name: "os",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "os_version",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "device_model",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 7,
  name: "browser",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 8,
  name: "browser_version",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 9,
  name: "address",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 10,
  name: "network",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 11,
  name: "other_sdks",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 12,
  name: "client_protocol",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 13,
  name: "capabilities",
  kind: "enum",
  T: v.getEnumType(Ln),
  repeated: !0
}]), gc = /* @__PURE__ */ v.makeEnum("livekit.ClientInfo.SDK", [{
  no: 0,
  name: "UNKNOWN"
}, {
  no: 1,
  name: "JS"
}, {
  no: 2,
  name: "SWIFT"
}, {
  no: 3,
  name: "ANDROID"
}, {
  no: 4,
  name: "FLUTTER"
}, {
  no: 5,
  name: "GO"
}, {
  no: 6,
  name: "UNITY"
}, {
  no: 7,
  name: "REACT_NATIVE"
}, {
  no: 8,
  name: "RUST"
}, {
  no: 9,
  name: "PYTHON"
}, {
  no: 10,
  name: "CPP"
}, {
  no: 11,
  name: "UNITY_WEB"
}, {
  no: 12,
  name: "NODE"
}, {
  no: 13,
  name: "UNREAL"
}, {
  no: 14,
  name: "ESP32"
}]), Ln = /* @__PURE__ */ v.makeEnum("livekit.ClientInfo.Capability", [{
  no: 0,
  name: "CAP_UNUSED"
}, {
  no: 1,
  name: "CAP_PACKET_TRAILER"
}, {
  no: 2,
  name: "CAP_COMPRESSION_DEFLATE_RAW"
}]), vc = /* @__PURE__ */ v.makeMessageType("livekit.ClientConfiguration", () => [{
  no: 1,
  name: "video",
  kind: "message",
  T: Ta
}, {
  no: 2,
  name: "screen",
  kind: "message",
  T: Ta
}, {
  no: 3,
  name: "resume_connection",
  kind: "enum",
  T: v.getEnumType(An)
}, {
  no: 4,
  name: "disabled_codecs",
  kind: "message",
  T: Bu
}, {
  no: 5,
  name: "force_relay",
  kind: "enum",
  T: v.getEnumType(An)
}]), Ta = /* @__PURE__ */ v.makeMessageType("livekit.VideoConfiguration", () => [{
  no: 1,
  name: "hardware_encoder",
  kind: "enum",
  T: v.getEnumType(An)
}]), Bu = /* @__PURE__ */ v.makeMessageType("livekit.DisabledCodecs", () => [{
  no: 1,
  name: "codecs",
  kind: "message",
  T: ki,
  repeated: !0
}, {
  no: 2,
  name: "publish",
  kind: "message",
  T: ki,
  repeated: !0
}]), bc = /* @__PURE__ */ v.makeMessageType("livekit.TimedVersion", () => [{
  no: 1,
  name: "unix_micro",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "ticks",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}]), Vr = /* @__PURE__ */ v.makeEnum("livekit.DataStream.OperationType", [{
  no: 0,
  name: "CREATE"
}, {
  no: 1,
  name: "UPDATE"
}, {
  no: 2,
  name: "DELETE"
}, {
  no: 3,
  name: "REACTION"
}]), be = /* @__PURE__ */ v.makeEnum("livekit.DataStream.CompressionType", [{
  no: 0,
  name: "NONE"
}, {
  no: 1,
  name: "DEFLATE_RAW"
}]), yc = /* @__PURE__ */ v.makeMessageType("livekit.DataStream.TextHeader", () => [{
  no: 1,
  name: "operation_type",
  kind: "enum",
  T: v.getEnumType(Vr)
}, {
  no: 2,
  name: "version",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 3,
  name: "reply_to_stream_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "attached_stream_ids",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 5,
  name: "generated",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}], {
  localName: "DataStream_TextHeader"
}), kc = /* @__PURE__ */ v.makeMessageType("livekit.DataStream.ByteHeader", () => [{
  no: 1,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}], {
  localName: "DataStream_ByteHeader"
}), Ui = /* @__PURE__ */ v.makeMessageType("livekit.DataStream.Header", () => [{
  no: 1,
  name: "stream_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "timestamp",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 3,
  name: "topic",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "mime_type",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "total_length",
  kind: "scalar",
  T: 4,
  opt: !0
}, {
  no: 7,
  name: "encryption_type",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 8,
  name: "attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 9,
  name: "text_header",
  kind: "message",
  T: yc,
  oneof: "content_header"
}, {
  no: 10,
  name: "byte_header",
  kind: "message",
  T: kc,
  oneof: "content_header"
}, {
  no: 11,
  name: "inline_content",
  kind: "scalar",
  T: 12,
  opt: !0
}, {
  no: 12,
  name: "compression",
  kind: "enum",
  T: v.getEnumType(be)
}], {
  localName: "DataStream_Header"
}), lt = /* @__PURE__ */ v.makeMessageType("livekit.DataStream.Chunk", () => [{
  no: 1,
  name: "stream_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "chunk_index",
  kind: "scalar",
  T: 4
  /* ScalarType.UINT64 */
}, {
  no: 3,
  name: "content",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}, {
  no: 4,
  name: "version",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 5,
  name: "iv",
  kind: "scalar",
  T: 12,
  opt: !0
}], {
  localName: "DataStream_Chunk"
}), Ms = /* @__PURE__ */ v.makeMessageType("livekit.DataStream.Trailer", () => [{
  no: 1,
  name: "stream_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "reason",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}], {
  localName: "DataStream_Trailer"
}), qu = /* @__PURE__ */ v.makeMessageType("livekit.FilterParams", () => [{
  no: 1,
  name: "include_events",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 2,
  name: "exclude_events",
  kind: "scalar",
  T: 9,
  repeated: !0
}]), ju = /* @__PURE__ */ v.makeMessageType("livekit.WebhookConfig", () => [{
  no: 1,
  name: "url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "signing_key",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "filter_params",
  kind: "message",
  T: qu
}]), Vu = /* @__PURE__ */ v.makeMessageType("livekit.SubscribedAudioCodec", () => [{
  no: 1,
  name: "codec",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "enabled",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), Wu = /* @__PURE__ */ v.makeEnum("livekit.JobRestartPolicy", [{
  no: 0,
  name: "JRP_ON_FAILURE"
}, {
  no: 1,
  name: "JRP_NEVER"
}]), di = /* @__PURE__ */ v.makeMessageType("livekit.RoomAgentDispatch", () => [{
  no: 1,
  name: "agent_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "restart_policy",
  kind: "enum",
  T: v.getEnumType(Wu)
}, {
  no: 4,
  name: "deployment",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}]), Tc = /* @__PURE__ */ v.makeEnum("livekit.EncodingOptionsPreset", [{
  no: 0,
  name: "H264_720P_30"
}, {
  no: 1,
  name: "H264_720P_60"
}, {
  no: 2,
  name: "H264_1080P_30"
}, {
  no: 3,
  name: "H264_1080P_60"
}, {
  no: 4,
  name: "PORTRAIT_H264_720P_30"
}, {
  no: 5,
  name: "PORTRAIT_H264_720P_60"
}, {
  no: 6,
  name: "PORTRAIT_H264_1080P_30"
}, {
  no: 7,
  name: "PORTRAIT_H264_1080P_60"
}]), Hu = /* @__PURE__ */ v.makeEnum("livekit.EncodedFileType", [{
  no: 0,
  name: "DEFAULT_FILETYPE"
}, {
  no: 1,
  name: "MP4"
}, {
  no: 2,
  name: "OGG"
}, {
  no: 3,
  name: "MP3"
}]), Ku = /* @__PURE__ */ v.makeEnum("livekit.StreamProtocol", [{
  no: 0,
  name: "DEFAULT_PROTOCOL"
}, {
  no: 1,
  name: "RTMP"
}, {
  no: 2,
  name: "SRT"
}, {
  no: 3,
  name: "WEBSOCKET"
}]), Gu = /* @__PURE__ */ v.makeEnum("livekit.SegmentedFileProtocol", [{
  no: 0,
  name: "DEFAULT_SEGMENTED_FILE_PROTOCOL"
}, {
  no: 1,
  name: "HLS_PROTOCOL"
}]), zu = /* @__PURE__ */ v.makeEnum("livekit.SegmentedFileSuffix", [{
  no: 0,
  name: "INDEX"
}, {
  no: 1,
  name: "TIMESTAMP"
}]), Ju = /* @__PURE__ */ v.makeEnum("livekit.ImageFileSuffix", [{
  no: 0,
  name: "IMAGE_SUFFIX_INDEX"
}, {
  no: 1,
  name: "IMAGE_SUFFIX_TIMESTAMP"
}, {
  no: 2,
  name: "IMAGE_SUFFIX_NONE_OVERWRITE"
}]), Qu = /* @__PURE__ */ v.makeEnum("livekit.AudioMixing", [{
  no: 0,
  name: "DEFAULT_MIXING"
}, {
  no: 1,
  name: "DUAL_CHANNEL_AGENT"
}, {
  no: 2,
  name: "DUAL_CHANNEL_ALTERNATE"
}]), Sc = /* @__PURE__ */ v.makeMessageType("livekit.EncodingOptions", () => [{
  no: 1,
  name: "width",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 2,
  name: "height",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 3,
  name: "depth",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 4,
  name: "framerate",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 5,
  name: "audio_codec",
  kind: "enum",
  T: v.getEnumType(wu)
}, {
  no: 6,
  name: "audio_bitrate",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 7,
  name: "audio_frequency",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 8,
  name: "video_codec",
  kind: "enum",
  T: v.getEnumType(_u)
}, {
  no: 9,
  name: "video_bitrate",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 10,
  name: "key_frame_interval",
  kind: "scalar",
  T: 1
  /* ScalarType.DOUBLE */
}, {
  no: 11,
  name: "audio_quality",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 12,
  name: "video_quality",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}]), Sa = /* @__PURE__ */ v.makeMessageType("livekit.StreamOutput", () => [{
  no: 1,
  name: "protocol",
  kind: "enum",
  T: v.getEnumType(Ku)
}, {
  no: 2,
  name: "urls",
  kind: "scalar",
  T: 9,
  repeated: !0
}]), Wr = /* @__PURE__ */ v.makeMessageType("livekit.SegmentedFileOutput", () => [{
  no: 1,
  name: "protocol",
  kind: "enum",
  T: v.getEnumType(Gu)
}, {
  no: 2,
  name: "filename_prefix",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "playlist_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 11,
  name: "live_playlist_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "segment_duration",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 10,
  name: "filename_suffix",
  kind: "enum",
  T: v.getEnumType(zu)
}, {
  no: 8,
  name: "disable_manifest",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 5,
  name: "s3",
  kind: "message",
  T: Fi,
  oneof: "output"
}, {
  no: 6,
  name: "gcp",
  kind: "message",
  T: Bi,
  oneof: "output"
}, {
  no: 7,
  name: "azure",
  kind: "message",
  T: qi,
  oneof: "output"
}, {
  no: 9,
  name: "aliOSS",
  kind: "message",
  T: ji,
  oneof: "output"
}]), Yu = /* @__PURE__ */ v.makeMessageType("livekit.ImageOutput", () => [{
  no: 1,
  name: "capture_interval",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "width",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 3,
  name: "height",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 4,
  name: "filename_prefix",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "filename_suffix",
  kind: "enum",
  T: v.getEnumType(Ju)
}, {
  no: 6,
  name: "image_codec",
  kind: "enum",
  T: v.getEnumType(Pu)
}, {
  no: 7,
  name: "disable_manifest",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 8,
  name: "s3",
  kind: "message",
  T: Fi,
  oneof: "output"
}, {
  no: 9,
  name: "gcp",
  kind: "message",
  T: Bi,
  oneof: "output"
}, {
  no: 10,
  name: "azure",
  kind: "message",
  T: qi,
  oneof: "output"
}, {
  no: 11,
  name: "aliOSS",
  kind: "message",
  T: ji,
  oneof: "output"
}]), Fi = /* @__PURE__ */ v.makeMessageType("livekit.S3Upload", () => [{
  no: 1,
  name: "access_key",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "secret",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 11,
  name: "session_token",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 12,
  name: "assume_role_arn",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 13,
  name: "assume_role_external_id",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "endpoint",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "bucket",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "force_path_style",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 7,
  name: "metadata",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 8,
  name: "tagging",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 9,
  name: "content_disposition",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 10,
  name: "proxy",
  kind: "message",
  T: Cc
}]), Bi = /* @__PURE__ */ v.makeMessageType("livekit.GCPUpload", () => [{
  no: 1,
  name: "credentials",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "bucket",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "proxy",
  kind: "message",
  T: Cc
}]), qi = /* @__PURE__ */ v.makeMessageType("livekit.AzureBlobUpload", () => [{
  no: 1,
  name: "account_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "account_key",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "container_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), ji = /* @__PURE__ */ v.makeMessageType("livekit.AliOSSUpload", () => [{
  no: 1,
  name: "access_key",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "secret",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "endpoint",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "bucket",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Cc = /* @__PURE__ */ v.makeMessageType("livekit.ProxyConfig", () => [{
  no: 1,
  name: "url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "username",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "password",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), $u = /* @__PURE__ */ v.makeMessageType("livekit.AutoParticipantEgress", () => [{
  no: 1,
  name: "preset",
  kind: "enum",
  T: v.getEnumType(Tc),
  oneof: "options"
}, {
  no: 2,
  name: "advanced",
  kind: "message",
  T: Sc,
  oneof: "options"
}, {
  no: 3,
  name: "file_outputs",
  kind: "message",
  T: Hr,
  repeated: !0
}, {
  no: 4,
  name: "segment_outputs",
  kind: "message",
  T: Wr,
  repeated: !0
}]), Xu = /* @__PURE__ */ v.makeMessageType("livekit.AutoTrackEgress", () => [{
  no: 1,
  name: "filepath",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "disable_manifest",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 2,
  name: "s3",
  kind: "message",
  T: Fi,
  oneof: "output"
}, {
  no: 3,
  name: "gcp",
  kind: "message",
  T: Bi,
  oneof: "output"
}, {
  no: 4,
  name: "azure",
  kind: "message",
  T: qi,
  oneof: "output"
}, {
  no: 6,
  name: "aliOSS",
  kind: "message",
  T: ji,
  oneof: "output"
}]), Zu = /* @__PURE__ */ v.makeMessageType("livekit.RoomCompositeEgressRequest", () => [{
  no: 1,
  name: "room_name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "layout",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "audio_only",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 15,
  name: "audio_mixing",
  kind: "enum",
  T: v.getEnumType(Qu)
}, {
  no: 4,
  name: "video_only",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 5,
  name: "custom_base_url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "file",
  kind: "message",
  T: Hr,
  oneof: "output"
}, {
  no: 7,
  name: "stream",
  kind: "message",
  T: Sa,
  oneof: "output"
}, {
  no: 10,
  name: "segments",
  kind: "message",
  T: Wr,
  oneof: "output"
}, {
  no: 8,
  name: "preset",
  kind: "enum",
  T: v.getEnumType(Tc),
  oneof: "options"
}, {
  no: 9,
  name: "advanced",
  kind: "message",
  T: Sc,
  oneof: "options"
}, {
  no: 11,
  name: "file_outputs",
  kind: "message",
  T: Hr,
  repeated: !0
}, {
  no: 12,
  name: "stream_outputs",
  kind: "message",
  T: Sa,
  repeated: !0
}, {
  no: 13,
  name: "segment_outputs",
  kind: "message",
  T: Wr,
  repeated: !0
}, {
  no: 14,
  name: "image_outputs",
  kind: "message",
  T: Yu,
  repeated: !0
}, {
  no: 16,
  name: "webhooks",
  kind: "message",
  T: ju,
  repeated: !0
}]), Hr = /* @__PURE__ */ v.makeMessageType("livekit.EncodedFileOutput", () => [{
  no: 1,
  name: "file_type",
  kind: "enum",
  T: v.getEnumType(Hu)
}, {
  no: 2,
  name: "filepath",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 6,
  name: "disable_manifest",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "s3",
  kind: "message",
  T: Fi,
  oneof: "output"
}, {
  no: 4,
  name: "gcp",
  kind: "message",
  T: Bi,
  oneof: "output"
}, {
  no: 5,
  name: "azure",
  kind: "message",
  T: qi,
  oneof: "output"
}, {
  no: 7,
  name: "aliOSS",
  kind: "message",
  T: ji,
  oneof: "output"
}]), eh = /* @__PURE__ */ v.makeMessageType("livekit.RoomEgress", () => [{
  no: 1,
  name: "room",
  kind: "message",
  T: Zu
}, {
  no: 3,
  name: "participant",
  kind: "message",
  T: $u
}, {
  no: 2,
  name: "tracks",
  kind: "message",
  T: Xu
}]), En = /* @__PURE__ */ v.makeMessageType("livekit.RoomConfiguration", () => [{
  no: 1,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "empty_timeout",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "departure_timeout",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "max_participants",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 11,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "egress",
  kind: "message",
  T: eh
}, {
  no: 7,
  name: "min_playout_delay",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 8,
  name: "max_playout_delay",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 9,
  name: "sync_streams",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 10,
  name: "agents",
  kind: "message",
  T: di,
  repeated: !0
}, {
  no: 12,
  name: "tags",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}]), Ve = /* @__PURE__ */ v.makeEnum("livekit.SignalTarget", [{
  no: 0,
  name: "PUBLISHER"
}, {
  no: 1,
  name: "SUBSCRIBER"
}]), Kr = /* @__PURE__ */ v.makeEnum("livekit.StreamState", [{
  no: 0,
  name: "ACTIVE"
}, {
  no: 1,
  name: "PAUSED"
}]), th = /* @__PURE__ */ v.makeEnum("livekit.CandidateProtocol", [{
  no: 0,
  name: "UDP"
}, {
  no: 1,
  name: "TCP"
}, {
  no: 2,
  name: "TLS"
}]), nh = /* @__PURE__ */ v.makeMessageType("livekit.SignalRequest", () => [{
  no: 1,
  name: "offer",
  kind: "message",
  T: _t,
  oneof: "message"
}, {
  no: 2,
  name: "answer",
  kind: "message",
  T: _t,
  oneof: "message"
}, {
  no: 3,
  name: "trickle",
  kind: "message",
  T: Vi,
  oneof: "message"
}, {
  no: 4,
  name: "add_track",
  kind: "message",
  T: xn,
  oneof: "message"
}, {
  no: 5,
  name: "mute",
  kind: "message",
  T: Wi,
  oneof: "message"
}, {
  no: 6,
  name: "subscription",
  kind: "message",
  T: Hi,
  oneof: "message"
}, {
  no: 7,
  name: "track_setting",
  kind: "message",
  T: _c,
  oneof: "message"
}, {
  no: 8,
  name: "leave",
  kind: "message",
  T: Ki,
  oneof: "message"
}, {
  no: 10,
  name: "update_layers",
  kind: "message",
  T: Rc,
  oneof: "message"
}, {
  no: 11,
  name: "subscription_permission",
  kind: "message",
  T: Oc,
  oneof: "message"
}, {
  no: 12,
  name: "sync_state",
  kind: "message",
  T: Fs,
  oneof: "message"
}, {
  no: 13,
  name: "simulate",
  kind: "message",
  T: Xe,
  oneof: "message"
}, {
  no: 14,
  name: "ping",
  kind: "scalar",
  T: 3,
  oneof: "message"
}, {
  no: 15,
  name: "update_metadata",
  kind: "message",
  T: Ns,
  oneof: "message"
}, {
  no: 16,
  name: "ping_req",
  kind: "message",
  T: Lc,
  oneof: "message"
}, {
  no: 17,
  name: "update_audio_track",
  kind: "message",
  T: xs,
  oneof: "message"
}, {
  no: 18,
  name: "update_video_track",
  kind: "message",
  T: Pc,
  oneof: "message"
}, {
  no: 19,
  name: "publish_data_track_request",
  kind: "message",
  T: Os,
  oneof: "message"
}, {
  no: 20,
  name: "unpublish_data_track_request",
  kind: "message",
  T: Ds,
  oneof: "message"
}, {
  no: 21,
  name: "update_data_subscription",
  kind: "message",
  T: Ec,
  oneof: "message"
}, {
  no: 22,
  name: "store_data_blob_request",
  kind: "message",
  T: lh,
  oneof: "message"
}, {
  no: 23,
  name: "get_data_blob_request",
  kind: "message",
  T: hh,
  oneof: "message"
}]), Ca = /* @__PURE__ */ v.makeMessageType("livekit.SignalResponse", () => [{
  no: 1,
  name: "join",
  kind: "message",
  T: ah,
  oneof: "message"
}, {
  no: 2,
  name: "answer",
  kind: "message",
  T: _t,
  oneof: "message"
}, {
  no: 3,
  name: "offer",
  kind: "message",
  T: _t,
  oneof: "message"
}, {
  no: 4,
  name: "trickle",
  kind: "message",
  T: Vi,
  oneof: "message"
}, {
  no: 5,
  name: "update",
  kind: "message",
  T: dh,
  oneof: "message"
}, {
  no: 6,
  name: "track_published",
  kind: "message",
  T: Ls,
  oneof: "message"
}, {
  no: 8,
  name: "leave",
  kind: "message",
  T: Ki,
  oneof: "message"
}, {
  no: 9,
  name: "mute",
  kind: "message",
  T: Wi,
  oneof: "message"
}, {
  no: 10,
  name: "speakers_changed",
  kind: "message",
  T: mh,
  oneof: "message"
}, {
  no: 11,
  name: "room_update",
  kind: "message",
  T: ph,
  oneof: "message"
}, {
  no: 12,
  name: "connection_quality",
  kind: "message",
  T: vh,
  oneof: "message"
}, {
  no: 13,
  name: "stream_state_update",
  kind: "message",
  T: yh,
  oneof: "message"
}, {
  no: 14,
  name: "subscribed_quality_update",
  kind: "message",
  T: Th,
  oneof: "message"
}, {
  no: 15,
  name: "subscription_permission_update",
  kind: "message",
  T: Ch,
  oneof: "message"
}, {
  no: 16,
  name: "refresh_token",
  kind: "scalar",
  T: 9,
  oneof: "message"
}, {
  no: 17,
  name: "track_unpublished",
  kind: "message",
  T: ch,
  oneof: "message"
}, {
  no: 18,
  name: "pong",
  kind: "scalar",
  T: 3,
  oneof: "message"
}, {
  no: 19,
  name: "reconnect",
  kind: "message",
  T: oh,
  oneof: "message"
}, {
  no: 20,
  name: "pong_resp",
  kind: "message",
  T: wh,
  oneof: "message"
}, {
  no: 21,
  name: "subscription_response",
  kind: "message",
  T: Rh,
  oneof: "message"
}, {
  no: 22,
  name: "request_response",
  kind: "message",
  T: Ih,
  oneof: "message"
}, {
  no: 23,
  name: "track_subscribed",
  kind: "message",
  T: Mh,
  oneof: "message"
}, {
  no: 24,
  name: "room_moved",
  kind: "message",
  T: Eh,
  oneof: "message"
}, {
  no: 25,
  name: "media_sections_requirement",
  kind: "message",
  T: Dh,
  oneof: "message"
}, {
  no: 26,
  name: "subscribed_audio_codec_update",
  kind: "message",
  T: Sh,
  oneof: "message"
}, {
  no: 27,
  name: "publish_data_track_response",
  kind: "message",
  T: As,
  oneof: "message"
}, {
  no: 28,
  name: "unpublish_data_track_response",
  kind: "message",
  T: ih,
  oneof: "message"
}, {
  no: 29,
  name: "data_track_subscriber_handles",
  kind: "message",
  T: rh,
  oneof: "message"
}, {
  no: 30,
  name: "store_data_blob_response",
  kind: "message",
  T: uh,
  oneof: "message"
}, {
  no: 31,
  name: "get_data_blob_response",
  kind: "message",
  T: fh,
  oneof: "message"
}]), Gr = /* @__PURE__ */ v.makeMessageType("livekit.SimulcastCodec", () => [{
  no: 1,
  name: "codec",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "cid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "layers",
  kind: "message",
  T: kt,
  repeated: !0
}, {
  no: 5,
  name: "video_layer_mode",
  kind: "enum",
  T: v.getEnumType(_s)
}]), xn = /* @__PURE__ */ v.makeMessageType("livekit.AddTrackRequest", () => [{
  no: 1,
  name: "cid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "type",
  kind: "enum",
  T: v.getEnumType(je)
}, {
  no: 4,
  name: "width",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 5,
  name: "height",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 6,
  name: "muted",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 7,
  name: "disable_dtx",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 8,
  name: "source",
  kind: "enum",
  T: v.getEnumType(ce)
}, {
  no: 9,
  name: "layers",
  kind: "message",
  T: kt,
  repeated: !0
}, {
  no: 10,
  name: "simulcast_codecs",
  kind: "message",
  T: Gr,
  repeated: !0
}, {
  no: 11,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 12,
  name: "stereo",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 13,
  name: "disable_red",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 14,
  name: "encryption",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 15,
  name: "stream",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 16,
  name: "backup_codec_policy",
  kind: "enum",
  T: v.getEnumType(rc)
}, {
  no: 17,
  name: "audio_features",
  kind: "enum",
  T: v.getEnumType(fe),
  repeated: !0
}, {
  no: 18,
  name: "packet_trailer_features",
  kind: "enum",
  T: v.getEnumType(dn),
  repeated: !0
}]), Os = /* @__PURE__ */ v.makeMessageType("livekit.PublishDataTrackRequest", () => [{
  no: 1,
  name: "pub_handle",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "encryption",
  kind: "enum",
  T: v.getEnumType(G)
}, {
  no: 4,
  name: "frame_encoding",
  kind: "message",
  T: sc,
  opt: !0
}, {
  no: 5,
  name: "schema",
  kind: "message",
  T: Es,
  opt: !0
}]), As = /* @__PURE__ */ v.makeMessageType("livekit.PublishDataTrackResponse", () => [{
  no: 1,
  name: "info",
  kind: "message",
  T: xi
}]), Ds = /* @__PURE__ */ v.makeMessageType("livekit.UnpublishDataTrackRequest", () => [{
  no: 1,
  name: "pub_handle",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), ih = /* @__PURE__ */ v.makeMessageType("livekit.UnpublishDataTrackResponse", () => [{
  no: 1,
  name: "info",
  kind: "message",
  T: xi
}]), rh = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackSubscriberHandles", () => [{
  no: 1,
  name: "sub_handles",
  kind: "map",
  K: 13,
  V: {
    kind: "message",
    T: sh
  }
}]), sh = /* @__PURE__ */ v.makeMessageType("livekit.DataTrackSubscriberHandles.PublishedDataTrack", () => [{
  no: 1,
  name: "publisher_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "publisher_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}], {
  localName: "DataTrackSubscriberHandles_PublishedDataTrack"
}), Vi = /* @__PURE__ */ v.makeMessageType("livekit.TrickleRequest", () => [{
  no: 1,
  name: "candidateInit",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "target",
  kind: "enum",
  T: v.getEnumType(Ve)
}, {
  no: 3,
  name: "final",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), Wi = /* @__PURE__ */ v.makeMessageType("livekit.MuteTrackRequest", () => [{
  no: 1,
  name: "sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "muted",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), ah = /* @__PURE__ */ v.makeMessageType("livekit.JoinResponse", () => [{
  no: 1,
  name: "room",
  kind: "message",
  T: Li
}, {
  no: 2,
  name: "participant",
  kind: "message",
  T: qt
}, {
  no: 3,
  name: "other_participants",
  kind: "message",
  T: qt,
  repeated: !0
}, {
  no: 4,
  name: "server_version",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 5,
  name: "ice_servers",
  kind: "message",
  T: Ic,
  repeated: !0
}, {
  no: 6,
  name: "subscriber_primary",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 7,
  name: "alternative_url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 8,
  name: "client_configuration",
  kind: "message",
  T: vc
}, {
  no: 9,
  name: "server_region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 10,
  name: "ping_timeout",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 11,
  name: "ping_interval",
  kind: "scalar",
  T: 5
  /* ScalarType.INT32 */
}, {
  no: 12,
  name: "server_info",
  kind: "message",
  T: fc
}, {
  no: 13,
  name: "sif_trailer",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}, {
  no: 14,
  name: "enabled_publish_codecs",
  kind: "message",
  T: ki,
  repeated: !0
}, {
  no: 15,
  name: "fast_publish",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), oh = /* @__PURE__ */ v.makeMessageType("livekit.ReconnectResponse", () => [{
  no: 1,
  name: "ice_servers",
  kind: "message",
  T: Ic,
  repeated: !0
}, {
  no: 2,
  name: "client_configuration",
  kind: "message",
  T: vc
}, {
  no: 3,
  name: "server_info",
  kind: "message",
  T: fc
}, {
  no: 4,
  name: "last_message_seq",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Ls = /* @__PURE__ */ v.makeMessageType("livekit.TrackPublishedResponse", () => [{
  no: 1,
  name: "cid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "track",
  kind: "message",
  T: Jt
}]), ch = /* @__PURE__ */ v.makeMessageType("livekit.TrackUnpublishedResponse", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), _t = /* @__PURE__ */ v.makeMessageType("livekit.SessionDescription", () => [{
  no: 1,
  name: "type",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "sdp",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 4,
  name: "mid_to_track_id",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}]), dh = /* @__PURE__ */ v.makeMessageType("livekit.ParticipantUpdate", () => [{
  no: 1,
  name: "participants",
  kind: "message",
  T: qt,
  repeated: !0
}]), Hi = /* @__PURE__ */ v.makeMessageType("livekit.UpdateSubscription", () => [{
  no: 1,
  name: "track_sids",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 2,
  name: "subscribe",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "participant_tracks",
  kind: "message",
  T: hc,
  repeated: !0
}]), Ec = /* @__PURE__ */ v.makeMessageType("livekit.UpdateDataSubscription", () => [{
  no: 1,
  name: "updates",
  kind: "message",
  T: wc,
  repeated: !0
}]), wc = /* @__PURE__ */ v.makeMessageType("livekit.UpdateDataSubscription.Update", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "subscribe",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "options",
  kind: "message",
  T: xu
}], {
  localName: "UpdateDataSubscription_Update"
}), lh = /* @__PURE__ */ v.makeMessageType("livekit.StoreDataBlobRequest", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "blob",
  kind: "message",
  T: ac
}]), uh = /* @__PURE__ */ v.makeMessageType("livekit.StoreDataBlobResponse", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "key",
  kind: "message",
  T: ws
}]), hh = /* @__PURE__ */ v.makeMessageType("livekit.GetDataBlobRequest", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "participant_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "key",
  kind: "message",
  T: ws
}]), fh = /* @__PURE__ */ v.makeMessageType("livekit.GetDataBlobResponse", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "blob",
  kind: "message",
  T: ac
}]), _c = /* @__PURE__ */ v.makeMessageType("livekit.UpdateTrackSettings", () => [{
  no: 1,
  name: "track_sids",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 3,
  name: "disabled",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 4,
  name: "quality",
  kind: "enum",
  T: v.getEnumType(Cs)
}, {
  no: 5,
  name: "width",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 6,
  name: "height",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 7,
  name: "fps",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 8,
  name: "priority",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), xs = /* @__PURE__ */ v.makeMessageType("livekit.UpdateLocalAudioTrack", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "features",
  kind: "enum",
  T: v.getEnumType(fe),
  repeated: !0
}]), Pc = /* @__PURE__ */ v.makeMessageType("livekit.UpdateLocalVideoTrack", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "width",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "height",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Ki = /* @__PURE__ */ v.makeMessageType("livekit.LeaveRequest", () => [{
  no: 1,
  name: "can_reconnect",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 2,
  name: "reason",
  kind: "enum",
  T: v.getEnumType(Ae)
}, {
  no: 3,
  name: "action",
  kind: "enum",
  T: v.getEnumType($t)
}, {
  no: 4,
  name: "regions",
  kind: "message",
  T: _h
}]), $t = /* @__PURE__ */ v.makeEnum("livekit.LeaveRequest.Action", [{
  no: 0,
  name: "DISCONNECT"
}, {
  no: 1,
  name: "RESUME"
}, {
  no: 2,
  name: "RECONNECT"
}]), Rc = /* @__PURE__ */ v.makeMessageType("livekit.UpdateVideoLayers", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "layers",
  kind: "message",
  T: kt,
  repeated: !0
}]), Ns = /* @__PURE__ */ v.makeMessageType("livekit.UpdateParticipantMetadata", () => [{
  no: 1,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "name",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 4,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Ic = /* @__PURE__ */ v.makeMessageType("livekit.ICEServer", () => [{
  no: 1,
  name: "urls",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 2,
  name: "username",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "credential",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), mh = /* @__PURE__ */ v.makeMessageType("livekit.SpeakersChanged", () => [{
  no: 1,
  name: "speakers",
  kind: "message",
  T: dc,
  repeated: !0
}]), ph = /* @__PURE__ */ v.makeMessageType("livekit.RoomUpdate", () => [{
  no: 1,
  name: "room",
  kind: "message",
  T: Li
}]), gh = /* @__PURE__ */ v.makeMessageType("livekit.ConnectionQualityInfo", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "quality",
  kind: "enum",
  T: v.getEnumType(zt)
}, {
  no: 3,
  name: "score",
  kind: "scalar",
  T: 2
  /* ScalarType.FLOAT */
}]), vh = /* @__PURE__ */ v.makeMessageType("livekit.ConnectionQualityUpdate", () => [{
  no: 1,
  name: "updates",
  kind: "message",
  T: gh,
  repeated: !0
}]), bh = /* @__PURE__ */ v.makeMessageType("livekit.StreamStateInfo", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "state",
  kind: "enum",
  T: v.getEnumType(Kr)
}]), yh = /* @__PURE__ */ v.makeMessageType("livekit.StreamStateUpdate", () => [{
  no: 1,
  name: "stream_states",
  kind: "message",
  T: bh,
  repeated: !0
}]), Us = /* @__PURE__ */ v.makeMessageType("livekit.SubscribedQuality", () => [{
  no: 1,
  name: "quality",
  kind: "enum",
  T: v.getEnumType(Cs)
}, {
  no: 2,
  name: "enabled",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), kh = /* @__PURE__ */ v.makeMessageType("livekit.SubscribedCodec", () => [{
  no: 1,
  name: "codec",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "qualities",
  kind: "message",
  T: Us,
  repeated: !0
}]), Th = /* @__PURE__ */ v.makeMessageType("livekit.SubscribedQualityUpdate", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "subscribed_qualities",
  kind: "message",
  T: Us,
  repeated: !0
}, {
  no: 3,
  name: "subscribed_codecs",
  kind: "message",
  T: kh,
  repeated: !0
}]), Sh = /* @__PURE__ */ v.makeMessageType("livekit.SubscribedAudioCodecUpdate", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "subscribed_audio_codecs",
  kind: "message",
  T: Vu,
  repeated: !0
}]), Mc = /* @__PURE__ */ v.makeMessageType("livekit.TrackPermission", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "all_tracks",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "track_sids",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 4,
  name: "participant_identity",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), Oc = /* @__PURE__ */ v.makeMessageType("livekit.SubscriptionPermission", () => [{
  no: 1,
  name: "all_participants",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 2,
  name: "track_permissions",
  kind: "message",
  T: Mc,
  repeated: !0
}]), Ch = /* @__PURE__ */ v.makeMessageType("livekit.SubscriptionPermissionUpdate", () => [{
  no: 1,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "allowed",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}]), Eh = /* @__PURE__ */ v.makeMessageType("livekit.RoomMovedResponse", () => [{
  no: 1,
  name: "room",
  kind: "message",
  T: Li
}, {
  no: 2,
  name: "token",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "participant",
  kind: "message",
  T: qt
}, {
  no: 4,
  name: "other_participants",
  kind: "message",
  T: qt,
  repeated: !0
}]), Fs = /* @__PURE__ */ v.makeMessageType("livekit.SyncState", () => [{
  no: 1,
  name: "answer",
  kind: "message",
  T: _t
}, {
  no: 2,
  name: "subscription",
  kind: "message",
  T: Hi
}, {
  no: 3,
  name: "publish_tracks",
  kind: "message",
  T: Ls,
  repeated: !0
}, {
  no: 4,
  name: "data_channels",
  kind: "message",
  T: Dc,
  repeated: !0
}, {
  no: 5,
  name: "offer",
  kind: "message",
  T: _t
}, {
  no: 6,
  name: "track_sids_disabled",
  kind: "scalar",
  T: 9,
  repeated: !0
}, {
  no: 7,
  name: "datachannel_receive_states",
  kind: "message",
  T: Ac,
  repeated: !0
}, {
  no: 8,
  name: "publish_data_tracks",
  kind: "message",
  T: As,
  repeated: !0
}]), Ac = /* @__PURE__ */ v.makeMessageType("livekit.DataChannelReceiveState", () => [{
  no: 1,
  name: "publisher_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "last_seq",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Dc = /* @__PURE__ */ v.makeMessageType("livekit.DataChannelInfo", () => [{
  no: 1,
  name: "label",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 3,
  name: "target",
  kind: "enum",
  T: v.getEnumType(Ve)
}]), Xe = /* @__PURE__ */ v.makeMessageType("livekit.SimulateScenario", () => [{
  no: 1,
  name: "speaker_update",
  kind: "scalar",
  T: 5,
  oneof: "scenario"
}, {
  no: 2,
  name: "node_failure",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}, {
  no: 3,
  name: "migration",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}, {
  no: 4,
  name: "server_leave",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}, {
  no: 5,
  name: "switch_candidate_protocol",
  kind: "enum",
  T: v.getEnumType(th),
  oneof: "scenario"
}, {
  no: 6,
  name: "subscriber_bandwidth",
  kind: "scalar",
  T: 3,
  oneof: "scenario"
}, {
  no: 7,
  name: "disconnect_signal_on_resume",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}, {
  no: 8,
  name: "disconnect_signal_on_resume_no_messages",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}, {
  no: 9,
  name: "leave_request_full_reconnect",
  kind: "scalar",
  T: 8,
  oneof: "scenario"
}]), Lc = /* @__PURE__ */ v.makeMessageType("livekit.Ping", () => [{
  no: 1,
  name: "timestamp",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "rtt",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}]), wh = /* @__PURE__ */ v.makeMessageType("livekit.Pong", () => [{
  no: 1,
  name: "last_ping_timestamp",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}, {
  no: 2,
  name: "timestamp",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}]), _h = /* @__PURE__ */ v.makeMessageType("livekit.RegionSettings", () => [{
  no: 1,
  name: "regions",
  kind: "message",
  T: Ph,
  repeated: !0
}]), Ph = /* @__PURE__ */ v.makeMessageType("livekit.RegionInfo", () => [{
  no: 1,
  name: "region",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 3,
  name: "distance",
  kind: "scalar",
  T: 3
  /* ScalarType.INT64 */
}]), Rh = /* @__PURE__ */ v.makeMessageType("livekit.SubscriptionResponse", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "err",
  kind: "enum",
  T: v.getEnumType(Ru)
}]), Ih = /* @__PURE__ */ v.makeMessageType("livekit.RequestResponse", () => [{
  no: 1,
  name: "request_id",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "reason",
  kind: "enum",
  T: v.getEnumType(Ot)
}, {
  no: 3,
  name: "message",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "trickle",
  kind: "message",
  T: Vi,
  oneof: "request"
}, {
  no: 5,
  name: "add_track",
  kind: "message",
  T: xn,
  oneof: "request"
}, {
  no: 6,
  name: "mute",
  kind: "message",
  T: Wi,
  oneof: "request"
}, {
  no: 7,
  name: "update_metadata",
  kind: "message",
  T: Ns,
  oneof: "request"
}, {
  no: 8,
  name: "update_audio_track",
  kind: "message",
  T: xs,
  oneof: "request"
}, {
  no: 9,
  name: "update_video_track",
  kind: "message",
  T: Pc,
  oneof: "request"
}, {
  no: 10,
  name: "publish_data_track",
  kind: "message",
  T: Os,
  oneof: "request"
}, {
  no: 11,
  name: "unpublish_data_track",
  kind: "message",
  T: Ds,
  oneof: "request"
}]), Ot = /* @__PURE__ */ v.makeEnum("livekit.RequestResponse.Reason", [{
  no: 0,
  name: "OK"
}, {
  no: 1,
  name: "NOT_FOUND"
}, {
  no: 2,
  name: "NOT_ALLOWED"
}, {
  no: 3,
  name: "LIMIT_EXCEEDED"
}, {
  no: 4,
  name: "QUEUED"
}, {
  no: 5,
  name: "UNSUPPORTED_TYPE"
}, {
  no: 6,
  name: "UNCLASSIFIED_ERROR"
}, {
  no: 7,
  name: "INVALID_HANDLE"
}, {
  no: 8,
  name: "INVALID_NAME"
}, {
  no: 9,
  name: "DUPLICATE_HANDLE"
}, {
  no: 10,
  name: "DUPLICATE_NAME"
}, {
  no: 11,
  name: "INVALID_REQUEST"
}]), Mh = /* @__PURE__ */ v.makeMessageType("livekit.TrackSubscribed", () => [{
  no: 1,
  name: "track_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]), xc = /* @__PURE__ */ v.makeMessageType("livekit.ConnectionSettings", () => [{
  no: 1,
  name: "auto_subscribe",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 2,
  name: "adaptive_stream",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 3,
  name: "subscriber_allow_pause",
  kind: "scalar",
  T: 8,
  opt: !0
}, {
  no: 4,
  name: "disable_ice_lite",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 5,
  name: "auto_subscribe_data_track",
  kind: "scalar",
  T: 8,
  opt: !0
}]), Oh = /* @__PURE__ */ v.makeMessageType("livekit.JoinRequest", () => [{
  no: 1,
  name: "client_info",
  kind: "message",
  T: pc
}, {
  no: 2,
  name: "connection_settings",
  kind: "message",
  T: xc
}, {
  no: 3,
  name: "metadata",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 4,
  name: "participant_attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 5,
  name: "add_track_requests",
  kind: "message",
  T: xn,
  repeated: !0
}, {
  no: 6,
  name: "publisher_offer",
  kind: "message",
  T: _t
}, {
  no: 7,
  name: "reconnect",
  kind: "scalar",
  T: 8
  /* ScalarType.BOOL */
}, {
  no: 8,
  name: "reconnect_reason",
  kind: "enum",
  T: v.getEnumType(rt)
}, {
  no: 9,
  name: "participant_sid",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 10,
  name: "sync_state",
  kind: "message",
  T: Fs
}]), Ah = /* @__PURE__ */ v.makeMessageType("livekit.WrappedJoinRequest", () => [{
  no: 1,
  name: "compression",
  kind: "enum",
  T: v.getEnumType(zr)
}, {
  no: 2,
  name: "join_request",
  kind: "scalar",
  T: 12
  /* ScalarType.BYTES */
}]), zr = /* @__PURE__ */ v.makeEnum("livekit.WrappedJoinRequest.Compression", [{
  no: 0,
  name: "NONE"
}, {
  no: 1,
  name: "GZIP"
}]), Dh = /* @__PURE__ */ v.makeMessageType("livekit.MediaSectionsRequirement", () => [{
  no: 1,
  name: "num_audios",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}, {
  no: 2,
  name: "num_videos",
  kind: "scalar",
  T: 13
  /* ScalarType.UINT32 */
}]), Lh = /* @__PURE__ */ v.makeMessageType("livekit.TokenSourceRequest", () => [{
  no: 1,
  name: "room_name",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 2,
  name: "participant_name",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 3,
  name: "participant_identity",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 4,
  name: "participant_metadata",
  kind: "scalar",
  T: 9,
  opt: !0
}, {
  no: 5,
  name: "participant_attributes",
  kind: "map",
  K: 9,
  V: {
    kind: "scalar",
    T: 9
    /* ScalarType.STRING */
  }
}, {
  no: 6,
  name: "room_config",
  kind: "message",
  T: En,
  opt: !0
}]), Nc = /* @__PURE__ */ v.makeMessageType("livekit.TokenSourceResponse", () => [{
  no: 1,
  name: "server_url",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}, {
  no: 2,
  name: "participant_token",
  kind: "scalar",
  T: 9
  /* ScalarType.STRING */
}]);
function xh(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var li = { exports: {} }, Nh = li.exports, Ea;
function Uh() {
  return Ea || (Ea = 1, (function(i) {
    (function(e, t) {
      i.exports ? i.exports = t() : e.log = t();
    })(Nh, function() {
      var e = function() {
      }, t = "undefined", n = typeof window !== t && typeof window.navigator !== t && /Trident\/|MSIE /.test(window.navigator.userAgent), r = ["trace", "debug", "info", "warn", "error"], s = {}, a = null;
      function o(p, k) {
        var T = p[k];
        if (typeof T.bind == "function")
          return T.bind(p);
        try {
          return Function.prototype.bind.call(T, p);
        } catch {
          return function() {
            return Function.prototype.apply.apply(T, [p, arguments]);
          };
        }
      }
      function c() {
        console.log && (console.log.apply ? console.log.apply(console, arguments) : Function.prototype.apply.apply(console.log, [console, arguments])), console.trace && console.trace();
      }
      function d(p) {
        return p === "debug" && (p = "log"), typeof console === t ? !1 : p === "trace" && n ? c : console[p] !== void 0 ? o(console, p) : console.log !== void 0 ? o(console, "log") : e;
      }
      function l() {
        for (var p = this.getLevel(), k = 0; k < r.length; k++) {
          var T = r[k];
          this[T] = k < p ? e : this.methodFactory(T, p, this.name);
        }
        if (this.log = this.debug, typeof console === t && p < this.levels.SILENT)
          return "No console available for logging";
      }
      function u(p) {
        return function() {
          typeof console !== t && (l.call(this), this[p].apply(this, arguments));
        };
      }
      function h(p, k, T) {
        return d(p) || u.apply(this, arguments);
      }
      function f(p, k) {
        var T = this, S, I, b, y = "loglevel";
        typeof p == "string" ? y += ":" + p : typeof p == "symbol" && (y = void 0);
        function C(D) {
          var U = (r[D] || "silent").toUpperCase();
          if (!(typeof window === t || !y)) {
            try {
              window.localStorage[y] = U;
              return;
            } catch {
            }
            try {
              window.document.cookie = encodeURIComponent(y) + "=" + U + ";";
            } catch {
            }
          }
        }
        function M() {
          var D;
          if (!(typeof window === t || !y)) {
            try {
              D = window.localStorage[y];
            } catch {
            }
            if (typeof D === t)
              try {
                var U = window.document.cookie, H = encodeURIComponent(y), ae = U.indexOf(H + "=");
                ae !== -1 && (D = /^([^;]+)/.exec(U.slice(ae + H.length + 1))[1]);
              } catch {
              }
            return T.levels[D] === void 0 && (D = void 0), D;
          }
        }
        function A() {
          if (!(typeof window === t || !y)) {
            try {
              window.localStorage.removeItem(y);
            } catch {
            }
            try {
              window.document.cookie = encodeURIComponent(y) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            } catch {
            }
          }
        }
        function B(D) {
          var U = D;
          if (typeof U == "string" && T.levels[U.toUpperCase()] !== void 0 && (U = T.levels[U.toUpperCase()]), typeof U == "number" && U >= 0 && U <= T.levels.SILENT)
            return U;
          throw new TypeError("log.setLevel() called with invalid level: " + D);
        }
        T.name = p, T.levels = {
          TRACE: 0,
          DEBUG: 1,
          INFO: 2,
          WARN: 3,
          ERROR: 4,
          SILENT: 5
        }, T.methodFactory = k || h, T.getLevel = function() {
          return b ?? I ?? S;
        }, T.setLevel = function(D, U) {
          return b = B(D), U !== !1 && C(b), l.call(T);
        }, T.setDefaultLevel = function(D) {
          I = B(D), M() || T.setLevel(D, !1);
        }, T.resetLevel = function() {
          b = null, A(), l.call(T);
        }, T.enableAll = function(D) {
          T.setLevel(T.levels.TRACE, D);
        }, T.disableAll = function(D) {
          T.setLevel(T.levels.SILENT, D);
        }, T.rebuild = function() {
          if (a !== T && (S = B(a.getLevel())), l.call(T), a === T)
            for (var D in s)
              s[D].rebuild();
        }, S = B(a ? a.getLevel() : "WARN");
        var F = M();
        F != null && (b = B(F)), l.call(T);
      }
      a = new f(), a.getLogger = function(k) {
        if (typeof k != "symbol" && typeof k != "string" || k === "")
          throw new TypeError("You must supply a name when creating a logger.");
        var T = s[k];
        return T || (T = s[k] = new f(k, a.methodFactory)), T;
      };
      var g = typeof window !== t ? window.log : void 0;
      return a.noConflict = function() {
        return typeof window !== t && window.log === a && (window.log = g), a;
      }, a.getLoggers = function() {
        return s;
      }, a.default = a, a;
    });
  })(li)), li.exports;
}
var Jn = Uh(), Nn;
(function(i) {
  i[i.trace = 0] = "trace", i[i.debug = 1] = "debug", i[i.info = 2] = "info", i[i.warn = 3] = "warn", i[i.error = 4] = "error", i[i.silent = 5] = "silent";
})(Nn || (Nn = {}));
var te;
(function(i) {
  i.Default = "livekit", i.Room = "livekit-room", i.TokenSource = "livekit-token-source", i.Participant = "livekit-participant", i.Track = "livekit-track", i.Publication = "livekit-track-publication", i.Engine = "livekit-engine", i.Signal = "livekit-signal", i.PCManager = "livekit-pc-manager", i.PCTransport = "livekit-pc-transport", i.E2EE = "lk-e2ee", i.DataTracks = "livekit-data-tracks", i.Region = "livekit-region", i.ICE = "livekit-ice", i.Stats = "livekit-stats";
})(te || (te = {}));
let q = Jn.getLogger(te.Default);
const Uc = Object.values(te).map((i) => Jn.getLogger(i));
q.setDefaultLevel(Nn.info);
function he(i, e) {
  const t = Jn.getLogger(i);
  return t.setDefaultLevel(q.getLevel()), e ? Fh(t, e) : t;
}
function Fh(i, e) {
  const t = (r) => (s, a) => {
    const o = e(), c = o || a ? Object.assign(Object.assign({}, o), a) : void 0;
    i[r](s, c);
  }, n = Object.create(i);
  return n.trace = t("trace"), n.debug = t("debug"), n.info = t("info"), n.warn = t("warn"), n.error = t("error"), n;
}
function $g(i, e) {
  if (e)
    Jn.getLogger(e).setLevel(i);
  else
    for (const t of Uc)
      t.setLevel(i);
}
function Xg(i, e) {
  (e ? [e] : Uc).forEach((n) => {
    const r = n.methodFactory;
    n.methodFactory = (s, a, o) => {
      const c = r(s, a, o), d = Nn[s], l = d >= a && d < Nn.silent;
      return (u, h) => {
        h ? c(u, h) : c(u), l && i(d, u, h);
      };
    }, n.setLevel(n.getLevel());
  });
}
const ln = Jn.getLogger(te.E2EE), Jr = /* @__PURE__ */ new Set(), Bh = ln.setLevel.bind(ln);
ln.setLevel = (i, e) => {
  Bh(i, e);
  const t = ln.getLevel();
  Jr.forEach((n) => n(t));
};
function wa(i) {
  return Jr.add(i), () => {
    Jr.delete(i);
  };
}
const pn = 7e3, qh = [0, 300, 4 * 300, 9 * 300, 16 * 300, pn, pn, pn, pn, pn];
class jh {
  constructor(e) {
    this._retryDelays = e !== void 0 ? [...e] : qh;
  }
  nextRetryDelayInMs(e) {
    if (e.retryCount >= this._retryDelays.length) return null;
    const t = this._retryDelays[e.retryCount];
    return e.retryCount <= 1 ? t : t + Math.random() * 1e3;
  }
}
function Bs(i, e) {
  var t = {};
  for (var n in i) Object.prototype.hasOwnProperty.call(i, n) && e.indexOf(n) < 0 && (t[n] = i[n]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, n = Object.getOwnPropertySymbols(i); r < n.length; r++)
      e.indexOf(n[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, n[r]) && (t[n[r]] = i[n[r]]);
  return t;
}
function m(i, e, t, n) {
  function r(s) {
    return s instanceof t ? s : new t(function(a) {
      a(s);
    });
  }
  return new (t || (t = Promise))(function(s, a) {
    function o(l) {
      try {
        d(n.next(l));
      } catch (u) {
        a(u);
      }
    }
    function c(l) {
      try {
        d(n.throw(l));
      } catch (u) {
        a(u);
      }
    }
    function d(l) {
      l.done ? s(l.value) : r(l.value).then(o, c);
    }
    d((n = n.apply(i, e || [])).next());
  });
}
function _a(i) {
  var e = typeof Symbol == "function" && Symbol.iterator, t = e && i[e], n = 0;
  if (t) return t.call(i);
  if (i && typeof i.length == "number") return {
    next: function() {
      return i && n >= i.length && (i = void 0), { value: i && i[n++], done: !i };
    }
  };
  throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function ut(i) {
  return this instanceof ut ? (this.v = i, this) : new ut(i);
}
function Fc(i, e, t) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var n = t.apply(i, e || []), r, s = [];
  return r = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), o("next"), o("throw"), o("return", a), r[Symbol.asyncIterator] = function() {
    return this;
  }, r;
  function a(f) {
    return function(g) {
      return Promise.resolve(g).then(f, u);
    };
  }
  function o(f, g) {
    n[f] && (r[f] = function(p) {
      return new Promise(function(k, T) {
        s.push([f, p, k, T]) > 1 || c(f, p);
      });
    }, g && (r[f] = g(r[f])));
  }
  function c(f, g) {
    try {
      d(n[f](g));
    } catch (p) {
      h(s[0][3], p);
    }
  }
  function d(f) {
    f.value instanceof ut ? Promise.resolve(f.value.v).then(l, u) : h(s[0][2], f);
  }
  function l(f) {
    c("next", f);
  }
  function u(f) {
    c("throw", f);
  }
  function h(f, g) {
    f(g), s.shift(), s.length && c(s[0][0], s[0][1]);
  }
}
function Vh(i) {
  var e, t;
  return e = {}, n("next"), n("throw", function(r) {
    throw r;
  }), n("return"), e[Symbol.iterator] = function() {
    return this;
  }, e;
  function n(r, s) {
    e[r] = i[r] ? function(a) {
      return (t = !t) ? { value: ut(i[r](a)), done: !1 } : s ? s(a) : a;
    } : s;
  }
}
function Ne(i) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var e = i[Symbol.asyncIterator], t;
  return e ? e.call(i) : (i = typeof _a == "function" ? _a(i) : i[Symbol.iterator](), t = {}, n("next"), n("throw"), n("return"), t[Symbol.asyncIterator] = function() {
    return this;
  }, t);
  function n(s) {
    t[s] = i[s] && function(a) {
      return new Promise(function(o, c) {
        a = i[s](a), r(o, c, a.done, a.value);
      });
    };
  }
  function r(s, a, o, c) {
    Promise.resolve(c).then(function(d) {
      s({ value: d, done: o });
    }, a);
  }
}
var $n = { exports: {} }, Pa;
function Wh() {
  if (Pa) return $n.exports;
  Pa = 1;
  var i = typeof Reflect == "object" ? Reflect : null, e = i && typeof i.apply == "function" ? i.apply : function(y, C, M) {
    return Function.prototype.apply.call(y, C, M);
  }, t;
  i && typeof i.ownKeys == "function" ? t = i.ownKeys : Object.getOwnPropertySymbols ? t = function(y) {
    return Object.getOwnPropertyNames(y).concat(Object.getOwnPropertySymbols(y));
  } : t = function(y) {
    return Object.getOwnPropertyNames(y);
  };
  function n(b) {
    console && console.warn && console.warn(b);
  }
  var r = Number.isNaN || function(y) {
    return y !== y;
  };
  function s() {
    s.init.call(this);
  }
  $n.exports = s, $n.exports.once = T, s.EventEmitter = s, s.prototype._events = void 0, s.prototype._eventsCount = 0, s.prototype._maxListeners = void 0;
  var a = 10;
  function o(b) {
    if (typeof b != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof b);
  }
  Object.defineProperty(s, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
      return a;
    },
    set: function(b) {
      if (typeof b != "number" || b < 0 || r(b))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + b + ".");
      a = b;
    }
  }), s.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, s.prototype.setMaxListeners = function(y) {
    if (typeof y != "number" || y < 0 || r(y))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + y + ".");
    return this._maxListeners = y, this;
  };
  function c(b) {
    return b._maxListeners === void 0 ? s.defaultMaxListeners : b._maxListeners;
  }
  s.prototype.getMaxListeners = function() {
    return c(this);
  }, s.prototype.emit = function(y) {
    for (var C = [], M = 1; M < arguments.length; M++) C.push(arguments[M]);
    var A = y === "error", B = this._events;
    if (B !== void 0) A = A && B.error === void 0;
    else if (!A) return !1;
    if (A) {
      var F;
      if (C.length > 0 && (F = C[0]), F instanceof Error)
        throw F;
      var D = new Error("Unhandled error." + (F ? " (" + F.message + ")" : ""));
      throw D.context = F, D;
    }
    var U = B[y];
    if (U === void 0) return !1;
    if (typeof U == "function")
      e(U, this, C);
    else
      for (var H = U.length, ae = g(U, H), M = 0; M < H; ++M) e(ae[M], this, C);
    return !0;
  };
  function d(b, y, C, M) {
    var A, B, F;
    if (o(C), B = b._events, B === void 0 ? (B = b._events = /* @__PURE__ */ Object.create(null), b._eventsCount = 0) : (B.newListener !== void 0 && (b.emit("newListener", y, C.listener ? C.listener : C), B = b._events), F = B[y]), F === void 0)
      F = B[y] = C, ++b._eventsCount;
    else if (typeof F == "function" ? F = B[y] = M ? [C, F] : [F, C] : M ? F.unshift(C) : F.push(C), A = c(b), A > 0 && F.length > A && !F.warned) {
      F.warned = !0;
      var D = new Error("Possible EventEmitter memory leak detected. " + F.length + " " + String(y) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      D.name = "MaxListenersExceededWarning", D.emitter = b, D.type = y, D.count = F.length, n(D);
    }
    return b;
  }
  s.prototype.addListener = function(y, C) {
    return d(this, y, C, !1);
  }, s.prototype.on = s.prototype.addListener, s.prototype.prependListener = function(y, C) {
    return d(this, y, C, !0);
  };
  function l() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  function u(b, y, C) {
    var M = {
      fired: !1,
      wrapFn: void 0,
      target: b,
      type: y,
      listener: C
    }, A = l.bind(M);
    return A.listener = C, M.wrapFn = A, A;
  }
  s.prototype.once = function(y, C) {
    return o(C), this.on(y, u(this, y, C)), this;
  }, s.prototype.prependOnceListener = function(y, C) {
    return o(C), this.prependListener(y, u(this, y, C)), this;
  }, s.prototype.removeListener = function(y, C) {
    var M, A, B, F, D;
    if (o(C), A = this._events, A === void 0) return this;
    if (M = A[y], M === void 0) return this;
    if (M === C || M.listener === C)
      --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete A[y], A.removeListener && this.emit("removeListener", y, M.listener || C));
    else if (typeof M != "function") {
      for (B = -1, F = M.length - 1; F >= 0; F--)
        if (M[F] === C || M[F].listener === C) {
          D = M[F].listener, B = F;
          break;
        }
      if (B < 0) return this;
      B === 0 ? M.shift() : p(M, B), M.length === 1 && (A[y] = M[0]), A.removeListener !== void 0 && this.emit("removeListener", y, D || C);
    }
    return this;
  }, s.prototype.off = s.prototype.removeListener, s.prototype.removeAllListeners = function(y) {
    var C, M, A;
    if (M = this._events, M === void 0) return this;
    if (M.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : M[y] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete M[y]), this;
    if (arguments.length === 0) {
      var B = Object.keys(M), F;
      for (A = 0; A < B.length; ++A)
        F = B[A], F !== "removeListener" && this.removeAllListeners(F);
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (C = M[y], typeof C == "function")
      this.removeListener(y, C);
    else if (C !== void 0)
      for (A = C.length - 1; A >= 0; A--)
        this.removeListener(y, C[A]);
    return this;
  };
  function h(b, y, C) {
    var M = b._events;
    if (M === void 0) return [];
    var A = M[y];
    return A === void 0 ? [] : typeof A == "function" ? C ? [A.listener || A] : [A] : C ? k(A) : g(A, A.length);
  }
  s.prototype.listeners = function(y) {
    return h(this, y, !0);
  }, s.prototype.rawListeners = function(y) {
    return h(this, y, !1);
  }, s.listenerCount = function(b, y) {
    return typeof b.listenerCount == "function" ? b.listenerCount(y) : f.call(b, y);
  }, s.prototype.listenerCount = f;
  function f(b) {
    var y = this._events;
    if (y !== void 0) {
      var C = y[b];
      if (typeof C == "function")
        return 1;
      if (C !== void 0)
        return C.length;
    }
    return 0;
  }
  s.prototype.eventNames = function() {
    return this._eventsCount > 0 ? t(this._events) : [];
  };
  function g(b, y) {
    for (var C = new Array(y), M = 0; M < y; ++M) C[M] = b[M];
    return C;
  }
  function p(b, y) {
    for (; y + 1 < b.length; y++) b[y] = b[y + 1];
    b.pop();
  }
  function k(b) {
    for (var y = new Array(b.length), C = 0; C < y.length; ++C)
      y[C] = b[C].listener || b[C];
    return y;
  }
  function T(b, y) {
    return new Promise(function(C, M) {
      function A(F) {
        b.removeListener(y, B), M(F);
      }
      function B() {
        typeof b.removeListener == "function" && b.removeListener("error", A), C([].slice.call(arguments));
      }
      I(b, y, B, {
        once: !0
      }), y !== "error" && S(b, A, {
        once: !0
      });
    });
  }
  function S(b, y, C) {
    typeof b.on == "function" && I(b, "error", y, C);
  }
  function I(b, y, C, M) {
    if (typeof b.on == "function")
      M.once ? b.once(y, C) : b.on(y, C);
    else if (typeof b.addEventListener == "function")
      b.addEventListener(y, function A(B) {
        M.once && b.removeEventListener(y, A), C(B);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof b);
  }
  return $n.exports;
}
var Ie = Wh();
let Bc = !0, qc = !0;
function Tn(i, e, t) {
  const n = i.match(e);
  return n && n.length >= t && parseFloat(n[t], 10);
}
function Wt(i, e, t) {
  if (!i.RTCPeerConnection)
    return;
  if (!Object.getOwnPropertyDescriptor(EventTarget.prototype, "addEventListener").writable) {
    qs("Unable to polyfill events");
    return;
  }
  const r = i.RTCPeerConnection.prototype, s = r.addEventListener;
  r.addEventListener = function(o, c) {
    if (o !== e)
      return s.apply(this, arguments);
    const d = (l) => {
      const u = t(l);
      u && (c.handleEvent ? c.handleEvent(u) : c(u));
    };
    return this._eventMap = this._eventMap || {}, this._eventMap[e] || (this._eventMap[e] = /* @__PURE__ */ new Map()), this._eventMap[e].set(c, d), s.apply(this, [o, d]);
  };
  const a = r.removeEventListener;
  r.removeEventListener = function(o, c) {
    if (o !== e || !this._eventMap || !this._eventMap[e])
      return a.apply(this, arguments);
    if (!this._eventMap[e].has(c))
      return a.apply(this, arguments);
    const d = this._eventMap[e].get(c);
    return this._eventMap[e].delete(c), this._eventMap[e].size === 0 && delete this._eventMap[e], Object.keys(this._eventMap).length === 0 && delete this._eventMap, a.apply(this, [o, d]);
  }, Object.defineProperty(r, "on" + e, {
    get() {
      return this["_on" + e];
    },
    set(o) {
      this["_on" + e] && (this.removeEventListener(e, this["_on" + e]), delete this["_on" + e]), o && this.addEventListener(e, this["_on" + e] = o);
    },
    enumerable: !0,
    configurable: !0
  });
}
function Hh(i) {
  return typeof i != "boolean" ? new Error("Argument type: " + typeof i + ". Please use a boolean.") : (Bc = i, i ? "adapter.js logging disabled" : "adapter.js logging enabled");
}
function Kh(i) {
  return typeof i != "boolean" ? new Error("Argument type: " + typeof i + ". Please use a boolean.") : (qc = !i, "adapter.js deprecation warnings " + (i ? "disabled" : "enabled"));
}
function qs() {
  if (typeof window == "object") {
    if (Bc)
      return;
    typeof console < "u" && typeof console.log == "function" && console.log.apply(console, arguments);
  }
}
function js(i, e) {
  qc && console.warn(i + " is deprecated, please use " + e + " instead.");
}
function Gh(i) {
  const e = {
    browser: null,
    version: null
  };
  if (typeof i > "u" || !i.navigator || !i.navigator.userAgent)
    return e.browser = "Not a browser.", e;
  const t = i.navigator;
  if (t.userAgentData && t.userAgentData.brands) {
    const n = t.userAgentData.brands.find((r) => r.brand === "Chromium");
    if (n) {
      const r = parseInt(n.version, 10);
      if (r >= 90)
        return {
          browser: "chrome",
          version: r
        };
    }
  }
  if (t.mozGetUserMedia)
    e.browser = "firefox", e.version = parseInt(Tn(t.userAgent, /Firefox\/(\d+)\./, 1));
  else if (t.webkitGetUserMedia || i.isSecureContext === !1 && i.webkitRTCPeerConnection)
    e.browser = "chrome", e.version = parseInt(Tn(t.userAgent, /Chrom(e|ium)\/(\d+)\./, 2)) || null;
  else if (i.RTCPeerConnection && t.userAgent.match(/AppleWebKit\/(\d+)\./))
    e.browser = "safari", e.version = parseInt(Tn(t.userAgent, /AppleWebKit\/(\d+)\./, 1)), e.supportsUnifiedPlan = i.RTCRtpTransceiver && "currentDirection" in i.RTCRtpTransceiver.prototype, e._safariVersion = Tn(t.userAgent, /Version\/(\d+(\.?\d+))/, 1);
  else
    return e.browser = "Not a supported browser.", e;
  return e;
}
function Ra(i) {
  return Object.prototype.toString.call(i) === "[object Object]";
}
function jc(i) {
  return Ra(i) ? Object.keys(i).reduce(function(e, t) {
    const n = Ra(i[t]), r = n ? jc(i[t]) : i[t], s = n && !Object.keys(r).length;
    return r === void 0 || s ? e : Object.assign(e, {
      [t]: r
    });
  }, {}) : i;
}
function Qr(i, e, t) {
  !e || t.has(e.id) || (t.set(e.id, e), Object.keys(e).forEach((n) => {
    n.endsWith("Id") ? Qr(i, i.get(e[n]), t) : n.endsWith("Ids") && e[n].forEach((r) => {
      Qr(i, i.get(r), t);
    });
  }));
}
function Ia(i, e, t) {
  const n = t ? "outbound-rtp" : "inbound-rtp", r = /* @__PURE__ */ new Map();
  if (e === null)
    return r;
  const s = [];
  return i.forEach((a) => {
    a.type === "track" && a.trackIdentifier === e.id && s.push(a);
  }), s.forEach((a) => {
    i.forEach((o) => {
      o.type === n && o.trackId === a.id && Qr(i, o, r);
    });
  }), r;
}
const Ma = qs;
function Vc(i, e) {
  if (e.version >= 64)
    return;
  const t = i && i.navigator;
  if (!t.mediaDevices)
    return;
  const n = function(o) {
    if (typeof o != "object" || o.mandatory || o.optional)
      return o;
    const c = {};
    return Object.keys(o).forEach((d) => {
      if (d === "require" || d === "advanced" || d === "mediaSource")
        return;
      const l = typeof o[d] == "object" ? o[d] : {
        ideal: o[d]
      };
      l.exact !== void 0 && typeof l.exact == "number" && (l.min = l.max = l.exact);
      const u = function(h, f) {
        return h ? h + f.charAt(0).toUpperCase() + f.slice(1) : f === "deviceId" ? "sourceId" : f;
      };
      if (l.ideal !== void 0) {
        c.optional = c.optional || [];
        let h = {};
        typeof l.ideal == "number" ? (h[u("min", d)] = l.ideal, c.optional.push(h), h = {}, h[u("max", d)] = l.ideal, c.optional.push(h)) : (h[u("", d)] = l.ideal, c.optional.push(h));
      }
      l.exact !== void 0 && typeof l.exact != "number" ? (c.mandatory = c.mandatory || {}, c.mandatory[u("", d)] = l.exact) : ["min", "max"].forEach((h) => {
        l[h] !== void 0 && (c.mandatory = c.mandatory || {}, c.mandatory[u(h, d)] = l[h]);
      });
    }), o.advanced && (c.optional = (c.optional || []).concat(o.advanced)), c;
  }, r = function(o, c) {
    if (e.version >= 61)
      return c(o);
    if (o = JSON.parse(JSON.stringify(o)), o && typeof o.audio == "object") {
      const d = function(l, u, h) {
        u in l && !(h in l) && (l[h] = l[u], delete l[u]);
      };
      o = JSON.parse(JSON.stringify(o)), d(o.audio, "autoGainControl", "googAutoGainControl"), d(o.audio, "noiseSuppression", "googNoiseSuppression"), o.audio = n(o.audio);
    }
    if (o && typeof o.video == "object") {
      let d = o.video.facingMode;
      d = d && (typeof d == "object" ? d : {
        ideal: d
      });
      const l = e.version < 66;
      if (d && (d.exact === "user" || d.exact === "environment" || d.ideal === "user" || d.ideal === "environment") && !(t.mediaDevices.getSupportedConstraints && t.mediaDevices.getSupportedConstraints().facingMode && !l)) {
        delete o.video.facingMode;
        let u;
        if (d.exact === "environment" || d.ideal === "environment" ? u = ["back", "rear"] : (d.exact === "user" || d.ideal === "user") && (u = ["front"]), u)
          return t.mediaDevices.enumerateDevices().then((h) => {
            h = h.filter((g) => g.kind === "videoinput");
            let f = h.find((g) => u.some((p) => g.label.toLowerCase().includes(p)));
            return !f && h.length && u.includes("back") && (f = h[h.length - 1]), f && (o.video.deviceId = d.exact ? {
              exact: f.deviceId
            } : {
              ideal: f.deviceId
            }), o.video = n(o.video), Ma("chrome: " + JSON.stringify(o)), c(o);
          });
      }
      o.video = n(o.video);
    }
    return Ma("chrome: " + JSON.stringify(o)), c(o);
  }, s = function(o) {
    return e.version >= 64 ? o : {
      name: {
        PermissionDeniedError: "NotAllowedError",
        PermissionDismissedError: "NotAllowedError",
        InvalidStateError: "NotAllowedError",
        DevicesNotFoundError: "NotFoundError",
        ConstraintNotSatisfiedError: "OverconstrainedError",
        TrackStartError: "NotReadableError",
        MediaDeviceFailedDueToShutdown: "NotAllowedError",
        MediaDeviceKillSwitchOn: "NotAllowedError",
        TabCaptureError: "AbortError",
        ScreenCaptureError: "AbortError",
        DeviceCaptureError: "AbortError"
      }[o.name] || o.name,
      message: o.message,
      constraint: o.constraint || o.constraintName,
      toString() {
        return this.name + (this.message && ": ") + this.message;
      }
    };
  }, a = function(o, c, d) {
    r(o, (l) => {
      t.webkitGetUserMedia(l, c, (u) => {
        d && d(s(u));
      });
    });
  };
  if (t.getUserMedia = a.bind(t), t.mediaDevices.getUserMedia) {
    const o = t.mediaDevices.getUserMedia.bind(t.mediaDevices);
    t.mediaDevices.getUserMedia = function(c) {
      return r(c, (d) => o(d).then((l) => {
        if (d.audio && !l.getAudioTracks().length || d.video && !l.getVideoTracks().length)
          throw l.getTracks().forEach((u) => {
            u.stop();
          }), new DOMException("", "NotFoundError");
        return l;
      }, (l) => Promise.reject(s(l))));
    };
  }
}
function Wc(i) {
  i.MediaStream = i.MediaStream || i.webkitMediaStream;
}
function Hc(i, e) {
  if (!(e.version > 102))
    if (typeof i == "object" && i.RTCPeerConnection && !("ontrack" in i.RTCPeerConnection.prototype)) {
      Object.defineProperty(i.RTCPeerConnection.prototype, "ontrack", {
        get() {
          return this._ontrack;
        },
        set(n) {
          this._ontrack && this.removeEventListener("track", this._ontrack), this.addEventListener("track", this._ontrack = n);
        },
        enumerable: !0,
        configurable: !0
      });
      const t = i.RTCPeerConnection.prototype.setRemoteDescription;
      i.RTCPeerConnection.prototype.setRemoteDescription = function() {
        return this._ontrackpoly || (this._ontrackpoly = (r) => {
          r.stream.addEventListener("addtrack", (s) => {
            let a;
            i.RTCPeerConnection.prototype.getReceivers ? a = this.getReceivers().find((c) => c.track && c.track.id === s.track.id) : a = {
              track: s.track
            };
            const o = new Event("track");
            o.track = s.track, o.receiver = a, o.transceiver = {
              receiver: a
            }, o.streams = [r.stream], this.dispatchEvent(o);
          }), r.stream.getTracks().forEach((s) => {
            let a;
            i.RTCPeerConnection.prototype.getReceivers ? a = this.getReceivers().find((c) => c.track && c.track.id === s.id) : a = {
              track: s
            };
            const o = new Event("track");
            o.track = s, o.receiver = a, o.transceiver = {
              receiver: a
            }, o.streams = [r.stream], this.dispatchEvent(o);
          });
        }, this.addEventListener("addstream", this._ontrackpoly)), t.apply(this, arguments);
      };
    } else
      Wt(i, "track", (t) => (t.transceiver || Object.defineProperty(t, "transceiver", {
        value: {
          receiver: t.receiver
        }
      }), t));
}
function Kc(i) {
  if (typeof i == "object" && i.RTCPeerConnection && !("getSenders" in i.RTCPeerConnection.prototype) && "createDTMFSender" in i.RTCPeerConnection.prototype) {
    const e = function(r, s) {
      return {
        track: s,
        get dtmf() {
          return this._dtmf === void 0 && (s.kind === "audio" ? this._dtmf = r.createDTMFSender(s) : this._dtmf = null), this._dtmf;
        },
        _pc: r
      };
    };
    if (!i.RTCPeerConnection.prototype.getSenders) {
      i.RTCPeerConnection.prototype.getSenders = function() {
        return this._senders = this._senders || [], this._senders.slice();
      };
      const r = i.RTCPeerConnection.prototype.addTrack;
      i.RTCPeerConnection.prototype.addTrack = function(o, c) {
        let d = r.apply(this, arguments);
        return d || (d = e(this, o), this._senders.push(d)), d;
      };
      const s = i.RTCPeerConnection.prototype.removeTrack;
      i.RTCPeerConnection.prototype.removeTrack = function(o) {
        s.apply(this, arguments);
        const c = this._senders.indexOf(o);
        c !== -1 && this._senders.splice(c, 1);
      };
    }
    const t = i.RTCPeerConnection.prototype.addStream;
    i.RTCPeerConnection.prototype.addStream = function(s) {
      this._senders = this._senders || [], t.apply(this, [s]), s.getTracks().forEach((a) => {
        this._senders.push(e(this, a));
      });
    };
    const n = i.RTCPeerConnection.prototype.removeStream;
    i.RTCPeerConnection.prototype.removeStream = function(s) {
      this._senders = this._senders || [], n.apply(this, [s]), s.getTracks().forEach((a) => {
        const o = this._senders.find((c) => c.track === a);
        o && this._senders.splice(this._senders.indexOf(o), 1);
      });
    };
  } else if (typeof i == "object" && i.RTCPeerConnection && "getSenders" in i.RTCPeerConnection.prototype && "createDTMFSender" in i.RTCPeerConnection.prototype && i.RTCRtpSender && !("dtmf" in i.RTCRtpSender.prototype)) {
    const e = i.RTCPeerConnection.prototype.getSenders;
    i.RTCPeerConnection.prototype.getSenders = function() {
      const n = e.apply(this, []);
      return n.forEach((r) => r._pc = this), n;
    }, Object.defineProperty(i.RTCRtpSender.prototype, "dtmf", {
      get() {
        return this._dtmf === void 0 && (this.track.kind === "audio" ? this._dtmf = this._pc.createDTMFSender(this.track) : this._dtmf = null), this._dtmf;
      }
    });
  }
}
function Gc(i, e) {
  if (e.version >= 67 || !(typeof i == "object" && i.RTCPeerConnection && i.RTCRtpSender && i.RTCRtpReceiver))
    return;
  if (!("getStats" in i.RTCRtpSender.prototype)) {
    const n = i.RTCPeerConnection.prototype.getSenders;
    n && (i.RTCPeerConnection.prototype.getSenders = function() {
      const a = n.apply(this, []);
      return a.forEach((o) => o._pc = this), a;
    });
    const r = i.RTCPeerConnection.prototype.addTrack;
    r && (i.RTCPeerConnection.prototype.addTrack = function() {
      const a = r.apply(this, arguments);
      return a._pc = this, a;
    }), i.RTCRtpSender.prototype.getStats = function() {
      const a = this;
      return this._pc.getStats().then((o) => (
        /* Note: this will include stats of all senders that
         *   send a track with the same id as sender.track as
         *   it is not possible to identify the RTCRtpSender.
         */
        Ia(o, a.track, !0)
      ));
    };
  }
  if (!("getStats" in i.RTCRtpReceiver.prototype)) {
    const n = i.RTCPeerConnection.prototype.getReceivers;
    n && (i.RTCPeerConnection.prototype.getReceivers = function() {
      const s = n.apply(this, []);
      return s.forEach((a) => a._pc = this), s;
    }), Wt(i, "track", (r) => (r.receiver._pc = r.srcElement, r)), i.RTCRtpReceiver.prototype.getStats = function() {
      const s = this;
      return this._pc.getStats().then((a) => Ia(a, s.track, !1));
    };
  }
  if (!("getStats" in i.RTCRtpSender.prototype && "getStats" in i.RTCRtpReceiver.prototype))
    return;
  const t = i.RTCPeerConnection.prototype.getStats;
  i.RTCPeerConnection.prototype.getStats = function() {
    if (arguments.length > 0 && arguments[0] instanceof i.MediaStreamTrack) {
      const r = arguments[0];
      let s, a, o;
      return this.getSenders().forEach((c) => {
        c.track === r && (s ? o = !0 : s = c);
      }), this.getReceivers().forEach((c) => (c.track === r && (a ? o = !0 : a = c), c.track === r)), o || s && a ? Promise.reject(new DOMException("There are more than one sender or receiver for the track.", "InvalidAccessError")) : s ? s.getStats() : a ? a.getStats() : Promise.reject(new DOMException("There is no sender or receiver for the track.", "InvalidAccessError"));
    }
    return t.apply(this, arguments);
  };
}
function zc(i) {
  i.RTCPeerConnection.prototype.getLocalStreams = function() {
    return this._shimmedLocalStreams = this._shimmedLocalStreams || {}, Object.keys(this._shimmedLocalStreams).map((a) => this._shimmedLocalStreams[a][0]);
  };
  const e = i.RTCPeerConnection.prototype.addTrack;
  i.RTCPeerConnection.prototype.addTrack = function(a, o) {
    if (!o)
      return e.apply(this, arguments);
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    const c = e.apply(this, arguments);
    return this._shimmedLocalStreams[o.id] ? this._shimmedLocalStreams[o.id].indexOf(c) === -1 && this._shimmedLocalStreams[o.id].push(c) : this._shimmedLocalStreams[o.id] = [o, c], c;
  };
  const t = i.RTCPeerConnection.prototype.addStream;
  i.RTCPeerConnection.prototype.addStream = function(a) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {}, a.getTracks().forEach((d) => {
      if (this.getSenders().find((u) => u.track === d))
        throw new DOMException("Track already exists.", "InvalidAccessError");
    });
    const o = this.getSenders();
    t.apply(this, arguments);
    const c = this.getSenders().filter((d) => o.indexOf(d) === -1);
    this._shimmedLocalStreams[a.id] = [a].concat(c);
  };
  const n = i.RTCPeerConnection.prototype.removeStream;
  i.RTCPeerConnection.prototype.removeStream = function(a) {
    return this._shimmedLocalStreams = this._shimmedLocalStreams || {}, delete this._shimmedLocalStreams[a.id], n.apply(this, arguments);
  };
  const r = i.RTCPeerConnection.prototype.removeTrack;
  i.RTCPeerConnection.prototype.removeTrack = function(a) {
    return this._shimmedLocalStreams = this._shimmedLocalStreams || {}, a && Object.keys(this._shimmedLocalStreams).forEach((o) => {
      const c = this._shimmedLocalStreams[o].indexOf(a);
      c !== -1 && this._shimmedLocalStreams[o].splice(c, 1), this._shimmedLocalStreams[o].length === 1 && delete this._shimmedLocalStreams[o];
    }), r.apply(this, arguments);
  };
}
function Jc(i, e) {
  if (!i.RTCPeerConnection)
    return;
  if (i.RTCPeerConnection.prototype.addTrack && e.version >= 65)
    return zc(i);
  const t = i.RTCPeerConnection.prototype.getLocalStreams;
  i.RTCPeerConnection.prototype.getLocalStreams = function() {
    const l = t.apply(this);
    return this._reverseStreams = this._reverseStreams || {}, l.map((u) => this._reverseStreams[u.id]);
  };
  const n = i.RTCPeerConnection.prototype.addStream;
  i.RTCPeerConnection.prototype.addStream = function(l) {
    if (this._streams = this._streams || {}, this._reverseStreams = this._reverseStreams || {}, l.getTracks().forEach((u) => {
      if (this.getSenders().find((f) => f.track === u))
        throw new DOMException("Track already exists.", "InvalidAccessError");
    }), !this._reverseStreams[l.id]) {
      const u = new i.MediaStream(l.getTracks());
      this._streams[l.id] = u, this._reverseStreams[u.id] = l, l = u;
    }
    n.apply(this, [l]);
  };
  const r = i.RTCPeerConnection.prototype.removeStream;
  i.RTCPeerConnection.prototype.removeStream = function(l) {
    this._streams = this._streams || {}, this._reverseStreams = this._reverseStreams || {}, r.apply(this, [this._streams[l.id] || l]), delete this._reverseStreams[this._streams[l.id] ? this._streams[l.id].id : l.id], delete this._streams[l.id];
  }, i.RTCPeerConnection.prototype.addTrack = function(l, u) {
    if (this.signalingState === "closed")
      throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
    const h = [].slice.call(arguments, 1);
    if (h.length !== 1 || !h[0].getTracks().find((p) => p === l))
      throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.", "NotSupportedError");
    if (this.getSenders().find((p) => p.track === l))
      throw new DOMException("Track already exists.", "InvalidAccessError");
    this._streams = this._streams || {}, this._reverseStreams = this._reverseStreams || {};
    const g = this._streams[u.id];
    if (g)
      g.addTrack(l), Promise.resolve().then(() => {
        this.dispatchEvent(new Event("negotiationneeded"));
      });
    else {
      const p = new i.MediaStream([l]);
      this._streams[u.id] = p, this._reverseStreams[p.id] = u, this.addStream(p);
    }
    return this.getSenders().find((p) => p.track === l);
  };
  function s(d, l) {
    let u = l.sdp;
    return Object.keys(d._reverseStreams || []).forEach((h) => {
      const f = d._reverseStreams[h], g = d._streams[f.id];
      u = u.replace(new RegExp(g.id, "g"), f.id);
    }), new RTCSessionDescription({
      type: l.type,
      sdp: u
    });
  }
  function a(d, l) {
    let u = l.sdp;
    return Object.keys(d._reverseStreams || []).forEach((h) => {
      const f = d._reverseStreams[h], g = d._streams[f.id];
      u = u.replace(new RegExp(f.id, "g"), g.id);
    }), new RTCSessionDescription({
      type: l.type,
      sdp: u
    });
  }
  ["createOffer", "createAnswer"].forEach(function(d) {
    const l = i.RTCPeerConnection.prototype[d], u = {
      [d]() {
        const h = arguments;
        return arguments.length && typeof arguments[0] == "function" ? l.apply(this, [(g) => {
          const p = s(this, g);
          h[0].apply(null, [p]);
        }, (g) => {
          h[1] && h[1].apply(null, g);
        }, arguments[2]]) : l.apply(this, arguments).then((g) => s(this, g));
      }
    };
    i.RTCPeerConnection.prototype[d] = u[d];
  });
  const o = i.RTCPeerConnection.prototype.setLocalDescription;
  i.RTCPeerConnection.prototype.setLocalDescription = function() {
    return !arguments.length || !arguments[0].type ? o.apply(this, arguments) : (arguments[0] = a(this, arguments[0]), o.apply(this, arguments));
  };
  const c = Object.getOwnPropertyDescriptor(i.RTCPeerConnection.prototype, "localDescription");
  Object.defineProperty(i.RTCPeerConnection.prototype, "localDescription", {
    get() {
      const d = c.get.apply(this);
      return d.type === "" ? d : s(this, d);
    }
  }), i.RTCPeerConnection.prototype.removeTrack = function(l) {
    if (this.signalingState === "closed")
      throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
    if (!l._pc)
      throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.", "TypeError");
    if (!(l._pc === this))
      throw new DOMException("Sender was not created by this connection.", "InvalidAccessError");
    this._streams = this._streams || {};
    let h;
    Object.keys(this._streams).forEach((f) => {
      this._streams[f].getTracks().find((p) => l.track === p) && (h = this._streams[f]);
    }), h && (h.getTracks().length === 1 ? this.removeStream(this._reverseStreams[h.id]) : h.removeTrack(l.track), this.dispatchEvent(new Event("negotiationneeded")));
  };
}
function Yr(i, e) {
  !i.RTCPeerConnection && i.webkitRTCPeerConnection && (i.RTCPeerConnection = i.webkitRTCPeerConnection), i.RTCPeerConnection && e.version < 53 && ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(t) {
    const n = i.RTCPeerConnection.prototype[t], r = {
      [t]() {
        return arguments[0] = new (t === "addIceCandidate" ? i.RTCIceCandidate : i.RTCSessionDescription)(arguments[0]), n.apply(this, arguments);
      }
    };
    i.RTCPeerConnection.prototype[t] = r[t];
  });
}
function Qc(i, e) {
  e.version > 102 || Wt(i, "negotiationneeded", (t) => {
    const n = t.target;
    if (!((e.version < 72 || n.getConfiguration && n.getConfiguration().sdpSemantics === "plan-b") && n.signalingState !== "stable"))
      return t;
  });
}
var Oa = /* @__PURE__ */ Object.freeze({ __proto__: null, fixNegotiationNeeded: Qc, shimAddTrackRemoveTrack: Jc, shimAddTrackRemoveTrackWithNative: zc, shimGetSendersWithDtmf: Kc, shimGetUserMedia: Vc, shimMediaStream: Wc, shimOnTrack: Hc, shimPeerConnection: Yr, shimSenderReceiverGetStats: Gc });
function Yc(i, e) {
  const t = i && i.navigator;
  if (!t.mediaDevices)
    return;
  const n = i && i.MediaStreamTrack;
  if (t.getUserMedia = function(r, s, a) {
    js("navigator.getUserMedia", "navigator.mediaDevices.getUserMedia"), t.mediaDevices.getUserMedia(r).then(s, a);
  }, !(e.version > 55 && "autoGainControl" in t.mediaDevices.getSupportedConstraints())) {
    const r = function(a, o, c) {
      o in a && !(c in a) && (a[c] = a[o], delete a[o]);
    }, s = t.mediaDevices.getUserMedia.bind(t.mediaDevices);
    if (t.mediaDevices.getUserMedia = function(a) {
      return typeof a == "object" && typeof a.audio == "object" && (a = JSON.parse(JSON.stringify(a)), r(a.audio, "autoGainControl", "mozAutoGainControl"), r(a.audio, "noiseSuppression", "mozNoiseSuppression")), s(a);
    }, n && n.prototype.getSettings) {
      const a = n.prototype.getSettings;
      n.prototype.getSettings = function() {
        const o = a.apply(this, arguments);
        return r(o, "mozAutoGainControl", "autoGainControl"), r(o, "mozNoiseSuppression", "noiseSuppression"), o;
      };
    }
    if (n && n.prototype.applyConstraints) {
      const a = n.prototype.applyConstraints;
      n.prototype.applyConstraints = function(o) {
        return this.kind === "audio" && typeof o == "object" && (o = JSON.parse(JSON.stringify(o)), r(o, "autoGainControl", "mozAutoGainControl"), r(o, "noiseSuppression", "mozNoiseSuppression")), a.apply(this, [o]);
      };
    }
  }
}
function zh(i, e) {
  i.navigator.mediaDevices && (i.navigator.mediaDevices && "getDisplayMedia" in i.navigator.mediaDevices || (i.navigator.mediaDevices.getDisplayMedia = function(n) {
    if (!(n && n.video)) {
      const r = new DOMException("getDisplayMedia without video constraints is undefined");
      return r.name = "NotFoundError", r.code = 8, Promise.reject(r);
    }
    return n.video === !0 ? n.video = {
      mediaSource: e
    } : n.video.mediaSource = e, i.navigator.mediaDevices.getUserMedia(n);
  }));
}
function $c(i) {
  typeof i == "object" && i.RTCTrackEvent && "receiver" in i.RTCTrackEvent.prototype && !("transceiver" in i.RTCTrackEvent.prototype) && Object.defineProperty(i.RTCTrackEvent.prototype, "transceiver", {
    get() {
      return {
        receiver: this.receiver
      };
    }
  });
}
function $r(i, e) {
  typeof i != "object" || !(i.RTCPeerConnection || i.mozRTCPeerConnection) || (!i.RTCPeerConnection && i.mozRTCPeerConnection && (i.RTCPeerConnection = i.mozRTCPeerConnection), e.version < 53 && ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(t) {
    const n = i.RTCPeerConnection.prototype[t], r = {
      [t]() {
        return arguments[0] = new (t === "addIceCandidate" ? i.RTCIceCandidate : i.RTCSessionDescription)(arguments[0]), n.apply(this, arguments);
      }
    };
    i.RTCPeerConnection.prototype[t] = r[t];
  }));
}
function Xc(i, e) {
  if (typeof i != "object" || !(i.RTCPeerConnection || i.mozRTCPeerConnection) || e.version >= 151)
    return;
  const t = {
    inboundrtp: "inbound-rtp",
    outboundrtp: "outbound-rtp",
    candidatepair: "candidate-pair",
    localcandidate: "local-candidate",
    remotecandidate: "remote-candidate"
  }, n = i.RTCPeerConnection.prototype.getStats;
  i.RTCPeerConnection.prototype.getStats = function() {
    const s = Array.prototype.slice.call(arguments), a = s[0], o = s[1], c = s[2];
    return this.signalingState === "closed" ? Promise.resolve(/* @__PURE__ */ new Map()) : n.apply(this, [a || null]).then((d) => {
      if (e.version < 53 && !o)
        try {
          d.forEach((l) => {
            l.type = t[l.type] || l.type;
          });
        } catch (l) {
          if (l.name !== "TypeError")
            throw l;
          d.forEach((u, h) => {
            d.set(h, Object.assign({}, u, {
              type: t[u.type] || u.type
            }));
          });
        }
      return d;
    }).then(o, c);
  };
}
function Zc(i) {
  if (!(typeof i == "object" && i.RTCPeerConnection && i.RTCRtpSender) || i.RTCRtpSender && "getStats" in i.RTCRtpSender.prototype)
    return;
  const e = i.RTCPeerConnection.prototype.getSenders;
  e && (i.RTCPeerConnection.prototype.getSenders = function() {
    const r = e.apply(this, []);
    return r.forEach((s) => s._pc = this), r;
  });
  const t = i.RTCPeerConnection.prototype.addTrack;
  t && (i.RTCPeerConnection.prototype.addTrack = function() {
    const r = t.apply(this, arguments);
    return r._pc = this, r;
  }), i.RTCRtpSender.prototype.getStats = function() {
    return this.track ? this._pc.getStats(this.track) : Promise.resolve(/* @__PURE__ */ new Map());
  };
}
function ed(i) {
  if (!(typeof i == "object" && i.RTCPeerConnection && i.RTCRtpSender) || i.RTCRtpSender && "getStats" in i.RTCRtpReceiver.prototype)
    return;
  const e = i.RTCPeerConnection.prototype.getReceivers;
  e && (i.RTCPeerConnection.prototype.getReceivers = function() {
    const n = e.apply(this, []);
    return n.forEach((r) => r._pc = this), n;
  }), Wt(i, "track", (t) => (t.receiver._pc = t.srcElement, t)), i.RTCRtpReceiver.prototype.getStats = function() {
    return this._pc.getStats(this.track);
  };
}
function td(i) {
  !i.RTCPeerConnection || "removeStream" in i.RTCPeerConnection.prototype || (i.RTCPeerConnection.prototype.removeStream = function(t) {
    js("removeStream", "removeTrack"), this.getSenders().forEach((n) => {
      n.track && t.getTracks().includes(n.track) && this.removeTrack(n);
    });
  });
}
function nd(i) {
  i.DataChannel && !i.RTCDataChannel && (i.RTCDataChannel = i.DataChannel);
}
function id(i, e) {
  if (!(typeof i == "object" && i.RTCPeerConnection) || e.version >= 110)
    return;
  const t = i.RTCPeerConnection.prototype.addTransceiver;
  t && (i.RTCPeerConnection.prototype.addTransceiver = function() {
    this.setParametersPromises = [];
    let r = arguments[1] && arguments[1].sendEncodings;
    r === void 0 && (r = []), r = [...r];
    const s = r.length > 0;
    s && r.forEach((o) => {
      if ("rid" in o && !/^[a-z0-9]{0,16}$/i.test(o.rid))
        throw new TypeError("Invalid RID value provided.");
      if ("scaleResolutionDownBy" in o && !(parseFloat(o.scaleResolutionDownBy) >= 1))
        throw new RangeError("scale_resolution_down_by must be >= 1.0");
      if ("maxFramerate" in o && !(parseFloat(o.maxFramerate) >= 0))
        throw new RangeError("max_framerate must be >= 0.0");
    });
    const a = t.apply(this, arguments);
    if (s) {
      const o = a.sender, c = o.getParameters();
      (!("encodings" in c) || // Avoid being fooled by patched getParameters() below.
      c.encodings.length === 1 && Object.keys(c.encodings[0]).length === 0) && (c.encodings = r, o.sendEncodings = r, this.setParametersPromises.push(o.setParameters(c).then(() => {
        delete o.sendEncodings;
      }).catch(() => {
        delete o.sendEncodings;
      })));
    }
    return a;
  });
}
function rd(i, e) {
  if (!(typeof i == "object" && i.RTCRtpSender) || e.version >= 110)
    return;
  const t = i.RTCRtpSender.prototype.getParameters;
  t && (i.RTCRtpSender.prototype.getParameters = function() {
    const r = t.apply(this, arguments);
    return "encodings" in r || (r.encodings = [].concat(this.sendEncodings || [{}])), r;
  });
}
function sd(i, e) {
  if (!(typeof i == "object" && i.RTCPeerConnection) || e.version >= 110)
    return;
  const t = i.RTCPeerConnection.prototype.createOffer;
  i.RTCPeerConnection.prototype.createOffer = function() {
    return this.setParametersPromises && this.setParametersPromises.length ? Promise.all(this.setParametersPromises).then(() => t.apply(this, arguments)).finally(() => {
      this.setParametersPromises = [];
    }) : t.apply(this, arguments);
  };
}
function ad(i, e) {
  if (!(typeof i == "object" && i.RTCPeerConnection) || e.version >= 110)
    return;
  const t = i.RTCPeerConnection.prototype.createAnswer;
  i.RTCPeerConnection.prototype.createAnswer = function() {
    return this.setParametersPromises && this.setParametersPromises.length ? Promise.all(this.setParametersPromises).then(() => t.apply(this, arguments)).finally(() => {
      this.setParametersPromises = [];
    }) : t.apply(this, arguments);
  };
}
var Aa = /* @__PURE__ */ Object.freeze({ __proto__: null, shimAddTransceiver: id, shimCreateAnswer: ad, shimCreateOffer: sd, shimGetDisplayMedia: zh, shimGetParameters: rd, shimGetStats: Xc, shimGetUserMedia: Yc, shimOnTrack: $c, shimPeerConnection: $r, shimRTCDataChannel: nd, shimReceiverGetStats: ed, shimRemoveStream: td, shimSenderGetStats: Zc });
function od(i) {
  if (!(typeof i != "object" || !i.RTCPeerConnection)) {
    if ("getLocalStreams" in i.RTCPeerConnection.prototype || (i.RTCPeerConnection.prototype.getLocalStreams = function() {
      return this._localStreams || (this._localStreams = []), this._localStreams;
    }), !("addStream" in i.RTCPeerConnection.prototype)) {
      const e = i.RTCPeerConnection.prototype.addTrack;
      i.RTCPeerConnection.prototype.addStream = function(n) {
        this._localStreams || (this._localStreams = []), this._localStreams.includes(n) || this._localStreams.push(n), n.getAudioTracks().forEach((r) => e.call(this, r, n)), n.getVideoTracks().forEach((r) => e.call(this, r, n));
      }, i.RTCPeerConnection.prototype.addTrack = function(n) {
        for (var r = arguments.length, s = new Array(r > 1 ? r - 1 : 0), a = 1; a < r; a++)
          s[a - 1] = arguments[a];
        return s && s.forEach((o) => {
          this._localStreams ? this._localStreams.includes(o) || this._localStreams.push(o) : this._localStreams = [o];
        }), e.apply(this, arguments);
      };
    }
    "removeStream" in i.RTCPeerConnection.prototype || (i.RTCPeerConnection.prototype.removeStream = function(t) {
      this._localStreams || (this._localStreams = []);
      const n = this._localStreams.indexOf(t);
      if (n === -1)
        return;
      this._localStreams.splice(n, 1);
      const r = t.getTracks();
      this.getSenders().forEach((s) => {
        r.includes(s.track) && this.removeTrack(s);
      });
    });
  }
}
function cd(i) {
  if (!(typeof i != "object" || !i.RTCPeerConnection) && ("getRemoteStreams" in i.RTCPeerConnection.prototype || (i.RTCPeerConnection.prototype.getRemoteStreams = function() {
    return this._remoteStreams ? this._remoteStreams : [];
  }), !("onaddstream" in i.RTCPeerConnection.prototype))) {
    Object.defineProperty(i.RTCPeerConnection.prototype, "onaddstream", {
      get() {
        return this._onaddstream;
      },
      set(t) {
        this._onaddstream && (this.removeEventListener("addstream", this._onaddstream), this.removeEventListener("track", this._onaddstreampoly)), this.addEventListener("addstream", this._onaddstream = t), this.addEventListener("track", this._onaddstreampoly = (n) => {
          n.streams.forEach((r) => {
            if (this._remoteStreams || (this._remoteStreams = []), this._remoteStreams.includes(r))
              return;
            this._remoteStreams.push(r);
            const s = new Event("addstream");
            s.stream = r, this.dispatchEvent(s);
          });
        });
      }
    });
    const e = i.RTCPeerConnection.prototype.setRemoteDescription;
    i.RTCPeerConnection.prototype.setRemoteDescription = function() {
      const n = this;
      return this._onaddstreampoly || this.addEventListener("track", this._onaddstreampoly = function(r) {
        r.streams.forEach((s) => {
          if (n._remoteStreams || (n._remoteStreams = []), n._remoteStreams.indexOf(s) >= 0)
            return;
          n._remoteStreams.push(s);
          const a = new Event("addstream");
          a.stream = s, n.dispatchEvent(a);
        });
      }), e.apply(n, arguments);
    };
  }
}
function dd(i) {
  if (typeof i != "object" || !i.RTCPeerConnection)
    return;
  const e = i.RTCPeerConnection.prototype, t = e.createOffer, n = e.createAnswer, r = e.setLocalDescription, s = e.setRemoteDescription, a = e.addIceCandidate;
  e.createOffer = function(d, l) {
    const u = arguments.length >= 2 ? arguments[2] : arguments[0], h = t.apply(this, [u]);
    return l ? (h.then(d, l), Promise.resolve()) : h;
  }, e.createAnswer = function(d, l) {
    const u = arguments.length >= 2 ? arguments[2] : arguments[0], h = n.apply(this, [u]);
    return l ? (h.then(d, l), Promise.resolve()) : h;
  };
  let o = function(c, d, l) {
    const u = r.apply(this, [c]);
    return l ? (u.then(d, l), Promise.resolve()) : u;
  };
  e.setLocalDescription = o, o = function(c, d, l) {
    const u = s.apply(this, [c]);
    return l ? (u.then(d, l), Promise.resolve()) : u;
  }, e.setRemoteDescription = o, o = function(c, d, l) {
    const u = a.apply(this, [c]);
    return l ? (u.then(d, l), Promise.resolve()) : u;
  }, e.addIceCandidate = o;
}
function ld(i) {
  const e = i && i.navigator;
  if (e.mediaDevices && e.mediaDevices.getUserMedia) {
    const t = e.mediaDevices, n = t.getUserMedia.bind(t);
    e.mediaDevices.getUserMedia = (r) => n(ud(r));
  }
  !e.getUserMedia && e.mediaDevices && e.mediaDevices.getUserMedia && (e.getUserMedia = (function(n, r, s) {
    e.mediaDevices.getUserMedia(n).then(r, s);
  }).bind(e));
}
function ud(i) {
  return i && i.video !== void 0 ? Object.assign({}, i, {
    video: jc(i.video)
  }) : i;
}
function hd(i) {
  if (!i.RTCPeerConnection)
    return;
  const e = i.RTCPeerConnection;
  i.RTCPeerConnection = function(n, r) {
    if (n && n.iceServers) {
      const s = [];
      for (let a = 0; a < n.iceServers.length; a++) {
        let o = n.iceServers[a];
        o.urls === void 0 && o.url ? (js("RTCIceServer.url", "RTCIceServer.urls"), o = JSON.parse(JSON.stringify(o)), o.urls = o.url, delete o.url, s.push(o)) : s.push(n.iceServers[a]);
      }
      n.iceServers = s;
    }
    return new e(n, r);
  }, i.RTCPeerConnection.prototype = e.prototype, "generateCertificate" in e && Object.defineProperty(i.RTCPeerConnection, "generateCertificate", {
    get() {
      return e.generateCertificate;
    }
  });
}
function fd(i) {
  typeof i == "object" && i.RTCTrackEvent && "receiver" in i.RTCTrackEvent.prototype && !("transceiver" in i.RTCTrackEvent.prototype) && Object.defineProperty(i.RTCTrackEvent.prototype, "transceiver", {
    get() {
      return {
        receiver: this.receiver
      };
    }
  });
}
function md(i) {
  const e = i.RTCPeerConnection.prototype.createOffer;
  i.RTCPeerConnection.prototype.createOffer = function(n) {
    if (n) {
      typeof n.offerToReceiveAudio < "u" && (n.offerToReceiveAudio = !!n.offerToReceiveAudio);
      const r = this.getTransceivers().find((a) => a.receiver.track.kind === "audio");
      n.offerToReceiveAudio === !1 && r ? r.direction === "sendrecv" ? r.setDirection ? r.setDirection("sendonly") : r.direction = "sendonly" : r.direction === "recvonly" && (r.setDirection ? r.setDirection("inactive") : r.direction = "inactive") : n.offerToReceiveAudio === !0 && !r && this.addTransceiver("audio", {
        direction: "recvonly"
      }), typeof n.offerToReceiveVideo < "u" && (n.offerToReceiveVideo = !!n.offerToReceiveVideo);
      const s = this.getTransceivers().find((a) => a.receiver.track.kind === "video");
      n.offerToReceiveVideo === !1 && s ? s.direction === "sendrecv" ? s.setDirection ? s.setDirection("sendonly") : s.direction = "sendonly" : s.direction === "recvonly" && (s.setDirection ? s.setDirection("inactive") : s.direction = "inactive") : n.offerToReceiveVideo === !0 && !s && this.addTransceiver("video", {
        direction: "recvonly"
      });
    }
    return e.apply(this, arguments);
  };
}
function pd(i) {
  typeof i != "object" || i.AudioContext || (i.AudioContext = i.webkitAudioContext);
}
var Da = /* @__PURE__ */ Object.freeze({ __proto__: null, shimAudioContext: pd, shimCallbacksAPI: dd, shimConstraints: ud, shimCreateOfferLegacy: md, shimGetUserMedia: ld, shimLocalStreamsAPI: od, shimRTCIceServerUrls: hd, shimRemoteStreamsAPI: cd, shimTrackEventTransceiver: fd }), ur = { exports: {} }, La;
function Jh() {
  return La || (La = 1, (function(i) {
    const e = {};
    e.generateIdentifier = function() {
      return Math.random().toString(36).substring(2, 12);
    }, e.localCName = e.generateIdentifier(), e.splitLines = function(t) {
      return t.trim().split(`
`).map((n) => n.trim());
    }, e.splitSections = function(t) {
      return t.split(`
m=`).map((r, s) => (s > 0 ? "m=" + r : r).trim() + `\r
`);
    }, e.getDescription = function(t) {
      const n = e.splitSections(t);
      return n && n[0];
    }, e.getMediaSections = function(t) {
      const n = e.splitSections(t);
      return n.shift(), n;
    }, e.matchPrefix = function(t, n) {
      return e.splitLines(t).filter((r) => r.indexOf(n) === 0);
    }, e.parseCandidate = function(t) {
      let n;
      t.indexOf("a=candidate:") === 0 ? n = t.substring(12).split(" ") : n = t.substring(10).split(" ");
      const r = {
        foundation: n[0],
        component: {
          1: "rtp",
          2: "rtcp"
        }[n[1]] || n[1],
        protocol: n[2].toLowerCase(),
        priority: parseInt(n[3], 10),
        ip: n[4],
        address: n[4],
        // address is an alias for ip.
        port: parseInt(n[5], 10),
        // skip parts[6] == 'typ'
        type: n[7]
      };
      for (let s = 8; s < n.length; s += 2)
        switch (n[s]) {
          case "raddr":
            r.relatedAddress = n[s + 1];
            break;
          case "rport":
            r.relatedPort = parseInt(n[s + 1], 10);
            break;
          case "tcptype":
            r.tcpType = n[s + 1];
            break;
          case "ufrag":
            r.ufrag = n[s + 1], r.usernameFragment = n[s + 1];
            break;
          default:
            r[n[s]] === void 0 && (r[n[s]] = n[s + 1]);
            break;
        }
      return r;
    }, e.writeCandidate = function(t) {
      const n = [];
      n.push(t.foundation);
      const r = t.component;
      r === "rtp" ? n.push(1) : r === "rtcp" ? n.push(2) : n.push(r), n.push(t.protocol.toUpperCase()), n.push(t.priority), n.push(t.address || t.ip), n.push(t.port);
      const s = t.type;
      return n.push("typ"), n.push(s), s !== "host" && t.relatedAddress && t.relatedPort !== void 0 && (n.push("raddr"), n.push(t.relatedAddress), n.push("rport"), n.push(t.relatedPort)), t.tcpType && t.protocol.toLowerCase() === "tcp" && (n.push("tcptype"), n.push(t.tcpType)), (t.usernameFragment || t.ufrag) && (n.push("ufrag"), n.push(t.usernameFragment || t.ufrag)), "candidate:" + n.join(" ");
    }, e.parseIceOptions = function(t) {
      return t.substring(14).split(" ");
    }, e.parseRtpMap = function(t) {
      let n = t.substring(9).split(" ");
      const r = {
        payloadType: parseInt(n.shift(), 10)
        // was: id
      };
      return n = n[0].split("/"), r.name = n[0], r.clockRate = parseInt(n[1], 10), r.channels = n.length === 3 ? parseInt(n[2], 10) : 1, r.numChannels = r.channels, r;
    }, e.writeRtpMap = function(t) {
      let n = t.payloadType;
      t.preferredPayloadType !== void 0 && (n = t.preferredPayloadType);
      const r = t.channels || t.numChannels || 1;
      return "a=rtpmap:" + n + " " + t.name + "/" + t.clockRate + (r !== 1 ? "/" + r : "") + `\r
`;
    }, e.parseExtmap = function(t) {
      const n = t.substring(9).split(" ");
      return {
        id: parseInt(n[0], 10),
        direction: n[0].indexOf("/") > 0 ? n[0].split("/")[1] : "sendrecv",
        uri: n[1],
        attributes: n.slice(2).join(" ")
      };
    }, e.writeExtmap = function(t) {
      return "a=extmap:" + (t.id || t.preferredId) + (t.direction && t.direction !== "sendrecv" ? "/" + t.direction : "") + " " + t.uri + (t.attributes ? " " + t.attributes : "") + `\r
`;
    }, e.parseFmtp = function(t) {
      const n = {};
      let r;
      const s = t.substring(t.indexOf(" ") + 1).split(";");
      for (let a = 0; a < s.length; a++)
        r = s[a].trim().split("="), n[r[0].trim()] = r[1];
      return n;
    }, e.writeFmtp = function(t) {
      let n = "", r = t.payloadType;
      if (t.preferredPayloadType !== void 0 && (r = t.preferredPayloadType), t.parameters && Object.keys(t.parameters).length) {
        const s = [];
        Object.keys(t.parameters).forEach((a) => {
          t.parameters[a] !== void 0 ? s.push(a + "=" + t.parameters[a]) : s.push(a);
        }), n += "a=fmtp:" + r + " " + s.join(";") + `\r
`;
      }
      return n;
    }, e.parseRtcpFb = function(t) {
      const n = t.substring(t.indexOf(" ") + 1).split(" ");
      return {
        type: n.shift(),
        parameter: n.join(" ")
      };
    }, e.writeRtcpFb = function(t) {
      let n = "", r = t.payloadType;
      return t.preferredPayloadType !== void 0 && (r = t.preferredPayloadType), t.rtcpFeedback && t.rtcpFeedback.length && t.rtcpFeedback.forEach((s) => {
        n += "a=rtcp-fb:" + r + " " + s.type + (s.parameter && s.parameter.length ? " " + s.parameter : "") + `\r
`;
      }), n;
    }, e.parseSsrcMedia = function(t) {
      const n = t.indexOf(" "), r = {
        ssrc: parseInt(t.substring(7, n), 10)
      }, s = t.indexOf(":", n);
      return s > -1 ? (r.attribute = t.substring(n + 1, s), r.value = t.substring(s + 1)) : r.attribute = t.substring(n + 1), r;
    }, e.parseSsrcGroup = function(t) {
      const n = t.substring(13).split(" ");
      return {
        semantics: n.shift(),
        ssrcs: n.map((r) => parseInt(r, 10))
      };
    }, e.getMid = function(t) {
      const n = e.matchPrefix(t, "a=mid:")[0];
      if (n)
        return n.substring(6);
    }, e.parseFingerprint = function(t) {
      const n = t.substring(14).split(" ");
      return {
        algorithm: n[0].toLowerCase(),
        // algorithm is case-sensitive in Edge.
        value: n[1].toUpperCase()
        // the definition is upper-case in RFC 4572.
      };
    }, e.getDtlsParameters = function(t, n) {
      return {
        role: "auto",
        fingerprints: e.matchPrefix(t + n, "a=fingerprint:").map(e.parseFingerprint)
      };
    }, e.writeDtlsParameters = function(t, n) {
      let r = "a=setup:" + n + `\r
`;
      return t.fingerprints.forEach((s) => {
        r += "a=fingerprint:" + s.algorithm + " " + s.value + `\r
`;
      }), r;
    }, e.parseCryptoLine = function(t) {
      const n = t.substring(9).split(" ");
      return {
        tag: parseInt(n[0], 10),
        cryptoSuite: n[1],
        keyParams: n[2],
        sessionParams: n.slice(3)
      };
    }, e.writeCryptoLine = function(t) {
      return "a=crypto:" + t.tag + " " + t.cryptoSuite + " " + (typeof t.keyParams == "object" ? e.writeCryptoKeyParams(t.keyParams) : t.keyParams) + (t.sessionParams ? " " + t.sessionParams.join(" ") : "") + `\r
`;
    }, e.parseCryptoKeyParams = function(t) {
      if (t.indexOf("inline:") !== 0)
        return null;
      const n = t.substring(7).split("|");
      return {
        keyMethod: "inline",
        keySalt: n[0],
        lifeTime: n[1],
        mkiValue: n[2] ? n[2].split(":")[0] : void 0,
        mkiLength: n[2] ? n[2].split(":")[1] : void 0
      };
    }, e.writeCryptoKeyParams = function(t) {
      return t.keyMethod + ":" + t.keySalt + (t.lifeTime ? "|" + t.lifeTime : "") + (t.mkiValue && t.mkiLength ? "|" + t.mkiValue + ":" + t.mkiLength : "");
    }, e.getCryptoParameters = function(t, n) {
      return e.matchPrefix(t + n, "a=crypto:").map(e.parseCryptoLine);
    }, e.getIceParameters = function(t, n) {
      const r = e.matchPrefix(t + n, "a=ice-ufrag:")[0], s = e.matchPrefix(t + n, "a=ice-pwd:")[0];
      return r && s ? {
        usernameFragment: r.substring(12),
        password: s.substring(10)
      } : null;
    }, e.writeIceParameters = function(t) {
      let n = "a=ice-ufrag:" + t.usernameFragment + `\r
a=ice-pwd:` + t.password + `\r
`;
      return t.iceLite && (n += `a=ice-lite\r
`), n;
    }, e.parseRtpParameters = function(t) {
      const n = {
        codecs: [],
        headerExtensions: [],
        fecMechanisms: [],
        rtcp: []
      }, s = e.splitLines(t)[0].split(" ");
      n.profile = s[2];
      for (let o = 3; o < s.length; o++) {
        const c = s[o], d = e.matchPrefix(t, "a=rtpmap:" + c + " ")[0];
        if (d) {
          const l = e.parseRtpMap(d), u = e.matchPrefix(t, "a=fmtp:" + c + " ");
          switch (l.parameters = u.length ? e.parseFmtp(u[0]) : {}, l.rtcpFeedback = e.matchPrefix(t, "a=rtcp-fb:" + c + " ").map(e.parseRtcpFb), n.codecs.push(l), l.name.toUpperCase()) {
            case "RED":
            case "ULPFEC":
              n.fecMechanisms.push(l.name.toUpperCase());
              break;
          }
        }
      }
      e.matchPrefix(t, "a=extmap:").forEach((o) => {
        n.headerExtensions.push(e.parseExtmap(o));
      });
      const a = e.matchPrefix(t, "a=rtcp-fb:* ").map(e.parseRtcpFb);
      return n.codecs.forEach((o) => {
        a.forEach((c) => {
          o.rtcpFeedback.find((l) => l.type === c.type && l.parameter === c.parameter) || o.rtcpFeedback.push(c);
        });
      }), n;
    }, e.writeRtpDescription = function(t, n) {
      let r = "";
      r += "m=" + t + " ", r += n.codecs.length > 0 ? "9" : "0", r += " " + (n.profile || "UDP/TLS/RTP/SAVPF") + " ", r += n.codecs.map((a) => a.preferredPayloadType !== void 0 ? a.preferredPayloadType : a.payloadType).join(" ") + `\r
`, r += `c=IN IP4 0.0.0.0\r
`, r += `a=rtcp:9 IN IP4 0.0.0.0\r
`, n.codecs.forEach((a) => {
        r += e.writeRtpMap(a), r += e.writeFmtp(a), r += e.writeRtcpFb(a);
      });
      let s = 0;
      return n.codecs.forEach((a) => {
        a.maxptime > s && (s = a.maxptime);
      }), s > 0 && (r += "a=maxptime:" + s + `\r
`), n.headerExtensions && n.headerExtensions.forEach((a) => {
        r += e.writeExtmap(a);
      }), r;
    }, e.parseRtpEncodingParameters = function(t) {
      const n = [], r = e.parseRtpParameters(t), s = r.fecMechanisms.indexOf("RED") !== -1, a = r.fecMechanisms.indexOf("ULPFEC") !== -1, o = e.matchPrefix(t, "a=ssrc:").map((h) => e.parseSsrcMedia(h)).filter((h) => h.attribute === "cname"), c = o.length > 0 && o[0].ssrc;
      let d;
      const l = e.matchPrefix(t, "a=ssrc-group:FID").map((h) => h.substring(17).split(" ").map((g) => parseInt(g, 10)));
      l.length > 0 && l[0].length > 1 && l[0][0] === c && (d = l[0][1]), r.codecs.forEach((h) => {
        if (h.name.toUpperCase() === "RTX" && h.parameters.apt) {
          let f = {
            ssrc: c,
            codecPayloadType: parseInt(h.parameters.apt, 10)
          };
          c && d && (f.rtx = {
            ssrc: d
          }), n.push(f), s && (f = JSON.parse(JSON.stringify(f)), f.fec = {
            ssrc: c,
            mechanism: a ? "red+ulpfec" : "red"
          }, n.push(f));
        }
      }), n.length === 0 && c && n.push({
        ssrc: c
      });
      let u = e.matchPrefix(t, "b=");
      return u.length && (u[0].indexOf("b=TIAS:") === 0 ? u = parseInt(u[0].substring(7), 10) : u[0].indexOf("b=AS:") === 0 ? u = parseInt(u[0].substring(5), 10) * 1e3 * 0.95 - 2e3 * 8 : u = void 0, n.forEach((h) => {
        h.maxBitrate = u;
      })), n;
    }, e.parseRtcpParameters = function(t) {
      const n = {}, r = e.matchPrefix(t, "a=ssrc:").map((o) => e.parseSsrcMedia(o)).filter((o) => o.attribute === "cname")[0];
      r && (n.cname = r.value, n.ssrc = r.ssrc);
      const s = e.matchPrefix(t, "a=rtcp-rsize");
      n.reducedSize = s.length > 0, n.compound = s.length === 0;
      const a = e.matchPrefix(t, "a=rtcp-mux");
      return n.mux = a.length > 0, n;
    }, e.writeRtcpParameters = function(t) {
      let n = "";
      return t.reducedSize && (n += `a=rtcp-rsize\r
`), t.mux && (n += `a=rtcp-mux\r
`), t.ssrc !== void 0 && t.cname && (n += "a=ssrc:" + t.ssrc + " cname:" + t.cname + `\r
`), n;
    }, e.parseMsid = function(t) {
      let n;
      const r = e.matchPrefix(t, "a=msid:");
      if (r.length === 1)
        return n = r[0].substring(7).split(" "), {
          stream: n[0],
          track: n[1]
        };
      const s = e.matchPrefix(t, "a=ssrc:").map((a) => e.parseSsrcMedia(a)).filter((a) => a.attribute === "msid");
      if (s.length > 0)
        return n = s[0].value.split(" "), {
          stream: n[0],
          track: n[1]
        };
    }, e.parseSctpDescription = function(t) {
      const n = e.parseMLine(t), r = e.matchPrefix(t, "a=max-message-size:");
      let s;
      r.length > 0 && (s = parseInt(r[0].substring(19), 10)), isNaN(s) && (s = 65536);
      const a = e.matchPrefix(t, "a=sctp-port:");
      if (a.length > 0)
        return {
          port: parseInt(a[0].substring(12), 10),
          protocol: n.fmt,
          maxMessageSize: s
        };
      const o = e.matchPrefix(t, "a=sctpmap:");
      if (o.length > 0) {
        const c = o[0].substring(10).split(" ");
        return {
          port: parseInt(c[0], 10),
          protocol: c[1],
          maxMessageSize: s
        };
      }
    }, e.writeSctpDescription = function(t, n) {
      let r = [];
      return t.protocol !== "DTLS/SCTP" ? r = ["m=" + t.kind + " 9 " + t.protocol + " " + n.protocol + `\r
`, `c=IN IP4 0.0.0.0\r
`, "a=sctp-port:" + n.port + `\r
`] : r = ["m=" + t.kind + " 9 " + t.protocol + " " + n.port + `\r
`, `c=IN IP4 0.0.0.0\r
`, "a=sctpmap:" + n.port + " " + n.protocol + ` 65535\r
`], n.maxMessageSize !== void 0 && r.push("a=max-message-size:" + n.maxMessageSize + `\r
`), r.join("");
    }, e.generateSessionId = function() {
      return Math.random().toString().substr(2, 22);
    }, e.writeSessionBoilerplate = function(t, n, r) {
      let s;
      const a = n !== void 0 ? n : 2;
      return t ? s = t : s = e.generateSessionId(), `v=0\r
o=` + (r || "thisisadapterortc") + " " + s + " " + a + ` IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
`;
    }, e.getDirection = function(t, n) {
      const r = e.splitLines(t);
      for (let s = 0; s < r.length; s++)
        switch (r[s]) {
          case "a=sendrecv":
          case "a=sendonly":
          case "a=recvonly":
          case "a=inactive":
            return r[s].substring(2);
        }
      return n ? e.getDirection(n) : "sendrecv";
    }, e.getKind = function(t) {
      return e.splitLines(t)[0].split(" ")[0].substring(2);
    }, e.isRejected = function(t) {
      return t.split(" ", 2)[1] === "0";
    }, e.parseMLine = function(t) {
      const r = e.splitLines(t)[0].substring(2).split(" ");
      return {
        kind: r[0],
        port: parseInt(r[1], 10),
        protocol: r[2],
        fmt: r.slice(3).join(" ")
      };
    }, e.parseOLine = function(t) {
      const r = e.matchPrefix(t, "o=")[0].substring(2).split(" ");
      return {
        username: r[0],
        sessionId: r[1],
        sessionVersion: parseInt(r[2], 10),
        netType: r[3],
        addressType: r[4],
        address: r[5]
      };
    }, e.isValidSDP = function(t) {
      if (typeof t != "string" || t.length === 0)
        return !1;
      const n = e.splitLines(t);
      for (let r = 0; r < n.length; r++)
        if (n[r].length < 2 || n[r].charAt(1) !== "=")
          return !1;
      return !0;
    }, i.exports = e;
  })(ur)), ur.exports;
}
var gd = Jh(), Xt = /* @__PURE__ */ xh(gd), Qh = /* @__PURE__ */ yl({ __proto__: null, default: Xt }, [gd]);
function ui(i) {
  if (!i.RTCIceCandidate || i.RTCIceCandidate && "foundation" in i.RTCIceCandidate.prototype)
    return;
  const e = i.RTCIceCandidate;
  i.RTCIceCandidate = function(n) {
    if (typeof n == "object" && n.candidate && n.candidate.indexOf("a=") === 0 && (n = JSON.parse(JSON.stringify(n)), n.candidate = n.candidate.substring(2)), n.candidate && n.candidate.length) {
      const r = new e(n), s = Xt.parseCandidate(n.candidate);
      for (const a in s)
        a in r || Object.defineProperty(r, a, {
          value: s[a]
        });
      return r.toJSON = function() {
        return {
          candidate: r.candidate,
          sdpMid: r.sdpMid,
          sdpMLineIndex: r.sdpMLineIndex,
          usernameFragment: r.usernameFragment
        };
      }, r;
    }
    return new e(n);
  }, i.RTCIceCandidate.prototype = e.prototype, Wt(i, "icecandidate", (t) => (t.candidate && Object.defineProperty(t, "candidate", {
    value: new i.RTCIceCandidate(t.candidate),
    writable: "false"
  }), t));
}
function Xr(i) {
  !i.RTCIceCandidate || i.RTCIceCandidate && "relayProtocol" in i.RTCIceCandidate.prototype || Wt(i, "icecandidate", (e) => {
    if (e.candidate) {
      const t = Xt.parseCandidate(e.candidate.candidate);
      t.type === "relay" && (e.candidate.relayProtocol = {
        0: "tls",
        1: "tcp",
        2: "udp"
      }[t.priority >> 24]);
    }
    return e;
  });
}
function hi(i, e) {
  if (!i.RTCPeerConnection || e.browser === "chrome" && e.version > 102 || e.browser === "firefox" && e.version >= 113)
    return;
  "sctp" in i.RTCPeerConnection.prototype || Object.defineProperty(i.RTCPeerConnection.prototype, "sctp", {
    get() {
      return typeof this._sctp > "u" ? null : this._sctp;
    }
  });
  const t = function(o) {
    if (!o || !o.sdp)
      return !1;
    const c = Xt.splitSections(o.sdp);
    return c.shift(), c.some((d) => {
      const l = Xt.parseMLine(d);
      return l && l.kind === "application" && l.protocol.indexOf("SCTP") !== -1;
    });
  }, n = function(o) {
    const c = o.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
    if (c === null || c.length < 2)
      return -1;
    const d = parseInt(c[1], 10);
    return d !== d ? -1 : d;
  }, r = function(o) {
    let c = 65536;
    return e.browser === "firefox" && (e.version < 57 ? o === -1 ? c = 16384 : c = 2147483637 : e.version < 60 ? c = e.version === 57 ? 65535 : 65536 : c = 2147483637), c;
  }, s = function(o, c) {
    let d = 65536;
    e.browser === "firefox" && e.version === 57 && (d = 65535);
    const l = Xt.matchPrefix(o.sdp, "a=max-message-size:");
    return l.length > 0 ? d = parseInt(l[0].substring(19), 10) : e.browser === "firefox" && c !== -1 && (d = 2147483637), d;
  }, a = i.RTCPeerConnection.prototype.setRemoteDescription;
  i.RTCPeerConnection.prototype.setRemoteDescription = function() {
    if (this._sctp = null, e.browser === "chrome" && e.version >= 76 && this.getConfiguration().sdpSemantics === "plan-b" && Object.defineProperty(this, "sctp", {
      get() {
        return typeof this._sctp > "u" ? null : this._sctp;
      },
      enumerable: !0,
      configurable: !0
    }), t(arguments[0])) {
      const c = n(arguments[0]), d = r(c), l = s(arguments[0], c);
      let u;
      d === 0 && l === 0 ? u = Number.POSITIVE_INFINITY : d === 0 || l === 0 ? u = Math.max(d, l) : u = Math.min(d, l);
      const h = {};
      Object.defineProperty(h, "maxMessageSize", {
        get() {
          return u;
        }
      }), this._sctp = h;
    }
    return a.apply(this, arguments);
  };
}
function fi(i, e) {
  if (!(i.RTCPeerConnection && "createDataChannel" in i.RTCPeerConnection.prototype) || e.browser === "chrome" && e.version >= 149 || e.browser === "firefox" && e.version > 60)
    return;
  function t(r, s) {
    const a = r.send;
    r.send = function() {
      const c = arguments[0], d = c.length || c.size || c.byteLength;
      if (r.readyState === "open" && s.sctp && d > s.sctp.maxMessageSize)
        throw new TypeError("Message too large (can send a maximum of " + s.sctp.maxMessageSize + " bytes)");
      return a.apply(r, arguments);
    };
  }
  const n = i.RTCPeerConnection.prototype.createDataChannel;
  i.RTCPeerConnection.prototype.createDataChannel = function() {
    const s = n.apply(this, arguments);
    return t(s, this), s;
  }, Wt(i, "datachannel", (r) => (t(r.channel, r.target), r));
}
function Zr(i) {
  if (!i.RTCPeerConnection || "connectionState" in i.RTCPeerConnection.prototype)
    return;
  const e = i.RTCPeerConnection.prototype;
  Object.defineProperty(e, "connectionState", {
    get() {
      return {
        completed: "connected",
        checking: "connecting"
      }[this.iceConnectionState] || this.iceConnectionState;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "onconnectionstatechange", {
    get() {
      return this._onconnectionstatechange || null;
    },
    set(t) {
      this._onconnectionstatechange && (this.removeEventListener("connectionstatechange", this._onconnectionstatechange), delete this._onconnectionstatechange), t && this.addEventListener("connectionstatechange", this._onconnectionstatechange = t);
    },
    enumerable: !0,
    configurable: !0
  }), ["setLocalDescription", "setRemoteDescription"].forEach((t) => {
    const n = e[t];
    e[t] = function() {
      return this._connectionstatechangepoly || (this._connectionstatechangepoly = (r) => {
        const s = r.target;
        if (s._lastConnectionState !== s.connectionState) {
          s._lastConnectionState = s.connectionState;
          const a = new Event("connectionstatechange", r);
          s.dispatchEvent(a);
        }
        return r;
      }, this.addEventListener("iceconnectionstatechange", this._connectionstatechangepoly)), n.apply(this, arguments);
    };
  });
}
function es(i, e) {
  if (!i.RTCPeerConnection || e.browser === "chrome" && e.version >= 71 || e.browser === "safari" && e._safariVersion >= 13.1)
    return;
  const t = i.RTCPeerConnection.prototype.setRemoteDescription;
  i.RTCPeerConnection.prototype.setRemoteDescription = function(r) {
    if (r && r.sdp && r.sdp.indexOf(`
a=extmap-allow-mixed`) !== -1) {
      const s = r.sdp.split(`
`).filter((a) => a.trim() !== "a=extmap-allow-mixed").join(`
`);
      i.RTCSessionDescription && r instanceof i.RTCSessionDescription ? arguments[0] = new i.RTCSessionDescription({
        type: r.type,
        sdp: s
      }) : r.sdp = s;
    }
    return t.apply(this, arguments);
  };
}
function mi(i, e) {
  if (!(i.RTCPeerConnection && i.RTCPeerConnection.prototype))
    return;
  const t = i.RTCPeerConnection.prototype.addIceCandidate;
  !t || t.length === 0 || (i.RTCPeerConnection.prototype.addIceCandidate = function() {
    return arguments[0] ? (e.browser === "chrome" && e.version < 78 || e.browser === "firefox" && e.version < 68 || e.browser === "safari") && arguments[0] && arguments[0].candidate === "" ? Promise.resolve() : t.apply(this, arguments) : (arguments[1] && arguments[1].apply(null), Promise.resolve());
  });
}
function pi(i, e) {
  if (!(i.RTCPeerConnection && i.RTCPeerConnection.prototype))
    return;
  const t = i.RTCPeerConnection.prototype.setLocalDescription;
  !t || t.length === 0 || (i.RTCPeerConnection.prototype.setLocalDescription = function() {
    let r = arguments[0] || {};
    if (typeof r != "object" || r.type && r.sdp)
      return t.apply(this, arguments);
    if (r = {
      type: r.type,
      sdp: r.sdp
    }, !r.type)
      switch (this.signalingState) {
        case "stable":
        case "have-local-offer":
        case "have-remote-pranswer":
          r.type = "offer";
          break;
        default:
          r.type = "answer";
          break;
      }
    return r.sdp || r.type !== "offer" && r.type !== "answer" ? t.apply(this, [r]) : (r.type === "offer" ? this.createOffer : this.createAnswer).apply(this).then((a) => t.apply(this, [a]));
  });
}
var Yh = /* @__PURE__ */ Object.freeze({ __proto__: null, removeExtmapAllowMixed: es, shimAddIceCandidateNullOrEmpty: mi, shimConnectionState: Zr, shimMaxMessageSize: hi, shimParameterlessSetLocalDescription: pi, shimRTCIceCandidate: ui, shimRTCIceCandidateRelayProtocol: Xr, shimSendThrowTypeError: fi });
function $h() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, e = i.window, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    shimChrome: !0,
    shimFirefox: !0,
    shimSafari: !0
  };
  const n = qs, r = Gh(e), s = {
    browserDetails: r,
    commonShim: Yh,
    extractVersion: Tn,
    disableLog: Hh,
    disableWarnings: Kh,
    // Expose sdp as a convenience. For production apps include directly.
    sdp: Qh
  };
  switch (r.browser) {
    case "chrome":
      if (!Oa || !Yr || !t.shimChrome)
        return n("Chrome shim is not included in this adapter release."), s;
      if (r.version === null)
        return n("Chrome shim can not determine version, not shimming."), s;
      n("adapter.js shimming chrome."), s.browserShim = Oa, mi(e, r), pi(e), Vc(e, r), Wc(e), Yr(e, r), Hc(e, r), Jc(e, r), Kc(e), Gc(e, r), Qc(e, r), ui(e), Xr(e), Zr(e), hi(e, r), fi(e, r), es(e, r);
      break;
    case "firefox":
      if (!Aa || !$r || !t.shimFirefox)
        return n("Firefox shim is not included in this adapter release."), s;
      n("adapter.js shimming firefox."), s.browserShim = Aa, mi(e, r), pi(e), Yc(e, r), $r(e, r), Xc(e, r), $c(e), td(e), Zc(e), ed(e), nd(e), id(e, r), rd(e, r), sd(e, r), ad(e, r), ui(e), Zr(e), hi(e, r), fi(e, r);
      break;
    case "safari":
      if (!Da || !t.shimSafari)
        return n("Safari shim is not included in this adapter release."), s;
      n("adapter.js shimming safari."), s.browserShim = Da, mi(e, r), pi(e), hd(e), md(e), dd(e), od(e), cd(e), fd(e), ld(e), pd(e), ui(e), Xr(e), hi(e, r), fi(e, r), es(e, r);
      break;
    default:
      n("Unsupported browser!");
      break;
  }
  return s;
}
$h({
  window: typeof window > "u" ? void 0 : window
});
var ts, vd;
class Ee extends (vd = Promise) {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(e) {
    super(e);
  }
  catch(e) {
    return super.catch(e);
  }
  static reject(e) {
    return super.reject(e);
  }
  static all(e) {
    return super.all(e);
  }
  static race(e) {
    return super.race(e);
  }
}
ts = Ee;
Ee.resolve = (i) => Reflect.get(vd, "resolve", ts).call(ts, i);
const Xh = /version\/(\d+(\.?_?\d+)+)/i;
let hr;
function ye(i) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  if (typeof i > "u" && typeof navigator > "u")
    return;
  const t = (i ?? navigator.userAgent).toLowerCase();
  if (hr === void 0 || e) {
    const n = Zh.find((r) => r.test.test(t));
    hr = n == null ? void 0 : n.describe(t);
  }
  return hr;
}
const Zh = [
  {
    test: /firefox|iceweasel|fxios/i,
    describe(i) {
      return {
        name: "Firefox",
        version: gi(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i, i),
        os: i.toLowerCase().includes("fxios") ? "iOS" : void 0,
        osVersion: fr(i)
      };
    }
  },
  {
    test: /chrom|crios|crmo/i,
    describe(i) {
      return {
        name: "Chrome",
        version: gi(/(?:chrome|chromium|crios|crmo)\/(\d+(\.?_?\d+)+)/i, i),
        os: i.toLowerCase().includes("crios") ? "iOS" : void 0,
        osVersion: fr(i)
      };
    }
  },
  /* Safari */
  {
    test: /safari|applewebkit/i,
    describe(i) {
      return {
        name: "Safari",
        version: gi(Xh, i),
        os: i.includes("mobile/") ? "iOS" : "macOS",
        osVersion: fr(i)
      };
    }
  }
];
function gi(i, e) {
  let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
  const n = e.match(i);
  return n && n.length >= t && n[t] || "";
}
function fr(i) {
  return i.includes("mac os") ? gi(/\(.+?(\d+_\d+(:?_\d+)?)/, i, 1).replace(/_/g, ".") : void 0;
}
var ef = "2.22.3";
const tf = ef, nf = 17, bd = 0, ns = 1, yd = 2, rf = yd;
class Qe extends Error {
  constructor(e, t, n) {
    super(t || "an error has occurred"), this.name = "LiveKitError", this.code = e, typeof (n == null ? void 0 : n.cause) < "u" && (this.cause = n == null ? void 0 : n.cause);
  }
}
class Ue extends Qe {
}
class Zg extends Qe {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "Simulated failure";
    super(-1, e), this.name = "simulated";
  }
}
var J;
(function(i) {
  i[i.NotAllowed = 0] = "NotAllowed", i[i.ServerUnreachable = 1] = "ServerUnreachable", i[i.InternalError = 2] = "InternalError", i[i.Cancelled = 3] = "Cancelled", i[i.LeaveRequest = 4] = "LeaveRequest", i[i.Timeout = 5] = "Timeout", i[i.WebSocket = 6] = "WebSocket", i[i.ServiceNotFound = 7] = "ServiceNotFound";
})(J || (J = {}));
class x extends Ue {
  constructor(e, t, n, r) {
    super(1, e), this.name = "ConnectionError", this.status = n, this.reason = t, this.context = r, this.reasonName = J[t];
  }
  static notAllowed(e, t, n) {
    return new x(e, J.NotAllowed, t, n);
  }
  static timeout(e) {
    return new x(e, J.Timeout);
  }
  static leaveRequest(e, t) {
    return new x(e, J.LeaveRequest, void 0, t);
  }
  static internal(e, t) {
    return new x(e, J.InternalError, void 0, t);
  }
  static cancelled(e) {
    return new x(e, J.Cancelled);
  }
  static serverUnreachable(e, t) {
    return new x(e, J.ServerUnreachable, t);
  }
  static websocket(e, t, n) {
    return new x(e, J.WebSocket, t, n);
  }
  static serviceNotFound(e, t) {
    return new x(e, J.ServiceNotFound, void 0, t);
  }
}
class Gi extends Qe {
  constructor(e) {
    super(21, e ?? "device is unsupported"), this.name = "DeviceUnsupportedError";
  }
}
class et extends Qe {
  constructor(e) {
    super(20, e ?? "track is invalid"), this.name = "TrackInvalidError";
  }
}
class sf extends Qe {
  constructor(e) {
    super(10, e || "unsupported server"), this.name = "UnsupportedServer";
  }
}
class X extends Qe {
  constructor(e) {
    super(12, e || "unexpected connection state"), this.name = "UnexpectedConnectionState";
  }
}
class St extends Qe {
  constructor(e) {
    super(13, e || "unable to negotiate"), this.name = "NegotiationError";
  }
}
class af extends Qe {
  constructor(e) {
    super(14, e || "unable to publish data"), this.name = "PublishDataError";
  }
}
class xa extends Qe {
  constructor(e, t) {
    super(15, e), this.name = "PublishTrackError", this.status = t;
  }
}
class Na extends Ue {
  constructor(e, t) {
    super(15, e), this.name = "SignalRequestError", this.reason = t, this.reasonName = typeof t == "string" ? t : Ot[t];
  }
}
var ne;
(function(i) {
  i[i.AlreadyOpened = 0] = "AlreadyOpened", i[i.AbnormalEnd = 1] = "AbnormalEnd", i[i.DecodeFailed = 2] = "DecodeFailed", i[i.LengthExceeded = 3] = "LengthExceeded", i[i.Incomplete = 4] = "Incomplete", i[i.HandlerAlreadyRegistered = 7] = "HandlerAlreadyRegistered", i[i.EncryptionTypeMismatch = 8] = "EncryptionTypeMismatch", i[i.HeaderTooLarge = 9] = "HeaderTooLarge", i[i.PayloadTooLarge = 10] = "PayloadTooLarge";
})(ne || (ne = {}));
class de extends Ue {
  constructor(e, t) {
    super(16, e), this.name = "DataStreamError", this.reason = t, this.reasonName = ne[t];
  }
}
class Kt extends Qe {
  constructor(e) {
    super(18, e), this.name = "SignalReconnectError";
  }
}
var Si;
(function(i) {
  i.PermissionDenied = "PermissionDenied", i.NotFound = "NotFound", i.DeviceInUse = "DeviceInUse", i.Other = "Other";
})(Si || (Si = {}));
(function(i) {
  function e(t) {
    if (t && "name" in t)
      return t.name === "NotFoundError" || t.name === "DevicesNotFoundError" ? i.NotFound : t.name === "NotAllowedError" || t.name === "PermissionDeniedError" ? i.PermissionDenied : t.name === "NotReadableError" || t.name === "TrackStartError" ? i.DeviceInUse : i.Other;
  }
  i.getFailure = e;
})(Si || (Si = {}));
class Q {
}
Q.setTimeout = function() {
  return setTimeout(...arguments);
};
Q.setInterval = // eslint-disable-next-line @typescript-eslint/no-implied-eval
function() {
  return setInterval(...arguments);
};
Q.clearTimeout = function() {
  return clearTimeout(...arguments);
};
Q.clearInterval = function() {
  return clearInterval(...arguments);
};
var _;
(function(i) {
  i.Connected = "connected", i.Reconnecting = "reconnecting", i.SignalReconnecting = "signalReconnecting", i.Reconnected = "reconnected", i.Disconnected = "disconnected", i.ConnectionStateChanged = "connectionStateChanged", i.Moved = "moved", i.MediaDevicesChanged = "mediaDevicesChanged", i.ParticipantConnected = "participantConnected", i.ParticipantDisconnected = "participantDisconnected", i.TrackPublished = "trackPublished", i.TrackSubscribed = "trackSubscribed", i.TrackSubscriptionFailed = "trackSubscriptionFailed", i.TrackUnpublished = "trackUnpublished", i.TrackUnsubscribed = "trackUnsubscribed", i.TrackMuted = "trackMuted", i.TrackUnmuted = "trackUnmuted", i.LocalTrackPublished = "localTrackPublished", i.LocalTrackUnpublished = "localTrackUnpublished", i.LocalAudioSilenceDetected = "localAudioSilenceDetected", i.ActiveSpeakersChanged = "activeSpeakersChanged", i.ParticipantMetadataChanged = "participantMetadataChanged", i.ParticipantNameChanged = "participantNameChanged", i.ParticipantAttributesChanged = "participantAttributesChanged", i.ParticipantActive = "participantActive", i.RoomMetadataChanged = "roomMetadataChanged", i.DataReceived = "dataReceived", i.SipDTMFReceived = "sipDTMFReceived", i.TranscriptionReceived = "transcriptionReceived", i.ConnectionQualityChanged = "connectionQualityChanged", i.TrackStreamStateChanged = "trackStreamStateChanged", i.TrackSubscriptionPermissionChanged = "trackSubscriptionPermissionChanged", i.TrackSubscriptionStatusChanged = "trackSubscriptionStatusChanged", i.AudioPlaybackStatusChanged = "audioPlaybackChanged", i.VideoPlaybackStatusChanged = "videoPlaybackChanged", i.MediaDevicesError = "mediaDevicesError", i.ParticipantPermissionsChanged = "participantPermissionsChanged", i.SignalConnected = "signalConnected", i.RecordingStatusChanged = "recordingStatusChanged", i.ParticipantEncryptionStatusChanged = "participantEncryptionStatusChanged", i.EncryptionError = "encryptionError", i.DCBufferStatusChanged = "dcBufferStatusChanged", i.ActiveDeviceChanged = "activeDeviceChanged", i.ChatMessage = "chatMessage", i.LocalTrackSubscribed = "localTrackSubscribed", i.MetricsReceived = "metricsReceived", i.DataTrackPublished = "dataTrackPublished", i.DataTrackUnpublished = "dataTrackUnpublished", i.LocalDataTrackPublished = "localDataTrackPublished", i.LocalDataTrackUnpublished = "localDataTrackUnpublished";
})(_ || (_ = {}));
var O;
(function(i) {
  i.TrackPublished = "trackPublished", i.TrackSubscribed = "trackSubscribed", i.TrackSubscriptionFailed = "trackSubscriptionFailed", i.TrackUnpublished = "trackUnpublished", i.TrackUnsubscribed = "trackUnsubscribed", i.TrackMuted = "trackMuted", i.TrackUnmuted = "trackUnmuted", i.LocalTrackPublished = "localTrackPublished", i.LocalTrackUnpublished = "localTrackUnpublished", i.LocalTrackCpuConstrained = "localTrackCpuConstrained", i.LocalSenderCreated = "localSenderCreated", i.ParticipantMetadataChanged = "participantMetadataChanged", i.ParticipantNameChanged = "participantNameChanged", i.DataReceived = "dataReceived", i.SipDTMFReceived = "sipDTMFReceived", i.TranscriptionReceived = "transcriptionReceived", i.IsSpeakingChanged = "isSpeakingChanged", i.ConnectionQualityChanged = "connectionQualityChanged", i.TrackStreamStateChanged = "trackStreamStateChanged", i.TrackSubscriptionPermissionChanged = "trackSubscriptionPermissionChanged", i.TrackSubscriptionStatusChanged = "trackSubscriptionStatusChanged", i.TrackCpuConstrained = "trackCpuConstrained", i.MediaDevicesError = "mediaDevicesError", i.AudioStreamAcquired = "audioStreamAcquired", i.ParticipantPermissionsChanged = "participantPermissionsChanged", i.PCTrackAdded = "pcTrackAdded", i.AttributesChanged = "attributesChanged", i.LocalTrackSubscribed = "localTrackSubscribed", i.ChatMessage = "chatMessage", i.Active = "active";
})(O || (O = {}));
var P;
(function(i) {
  i.TransportsCreated = "transportsCreated", i.Connected = "connected", i.Disconnected = "disconnected", i.Resuming = "resuming", i.Resumed = "resumed", i.Restarting = "restarting", i.Restarted = "restarted", i.SignalResumed = "signalResumed", i.SignalRestarted = "signalRestarted", i.Closing = "closing", i.MediaTrackAdded = "mediaTrackAdded", i.ActiveSpeakersUpdate = "activeSpeakersUpdate", i.DataPacketReceived = "dataPacketReceived", i.RTPVideoMapUpdate = "rtpVideoMapUpdate", i.DCBufferStatusChanged = "dcBufferStatusChanged", i.ParticipantUpdate = "participantUpdate", i.RoomUpdate = "roomUpdate", i.SpeakersChanged = "speakersChanged", i.StreamStateChanged = "streamStateChanged", i.ConnectionQualityUpdate = "connectionQualityUpdate", i.SubscriptionError = "subscriptionError", i.SubscriptionPermissionUpdate = "subscriptionPermissionUpdate", i.RemoteMute = "remoteMute", i.SubscribedQualityUpdate = "subscribedQualityUpdate", i.LocalTrackUnpublished = "localTrackUnpublished", i.LocalTrackSubscribed = "localTrackSubscribed", i.Offline = "offline", i.SignalRequestResponse = "signalRequestResponse", i.SignalConnected = "signalConnected", i.RoomMoved = "roomMoved", i.PublishDataTrackResponse = "publishDataTrackResponse", i.UnPublishDataTrackResponse = "unPublishDataTrackResponse", i.DataTrackSubscriberHandles = "dataTrackSubscriberHandles", i.DataTrackPacketReceived = "dataTrackPacketReceived", i.Joined = "joined", i.TokenRefreshed = "tokenRefreshed", i.ServerRegionsReported = "serverRegionsReported";
})(P || (P = {}));
var R;
(function(i) {
  i.Message = "message", i.Muted = "muted", i.Unmuted = "unmuted", i.Restarted = "restarted", i.Ended = "ended", i.Subscribed = "subscribed", i.Unsubscribed = "unsubscribed", i.CpuConstrained = "cpuConstrained", i.UpdateSettings = "updateSettings", i.UpdateSubscription = "updateSubscription", i.AudioPlaybackStarted = "audioPlaybackStarted", i.AudioPlaybackFailed = "audioPlaybackFailed", i.AudioSilenceDetected = "audioSilenceDetected", i.VisibilityChanged = "visibilityChanged", i.VideoDimensionsChanged = "videoDimensionsChanged", i.VideoPlaybackStarted = "videoPlaybackStarted", i.VideoPlaybackFailed = "videoPlaybackFailed", i.ElementAttached = "elementAttached", i.ElementDetached = "elementDetached", i.UpstreamPaused = "upstreamPaused", i.UpstreamResumed = "upstreamResumed", i.SubscriptionPermissionChanged = "subscriptionPermissionChanged", i.SubscriptionStatusChanged = "subscriptionStatusChanged", i.SubscriptionFailed = "subscriptionFailed", i.TrackProcessorUpdate = "trackProcessorUpdate", i.AudioTrackFeatureUpdate = "audioTrackFeatureUpdate", i.TranscriptionReceived = "transcriptionReceived", i.TimeSyncUpdate = "timeSyncUpdate", i.PreConnectBufferFlushed = "preConnectBufferFlushed";
})(R || (R = {}));
function mr(i) {
  const e = {};
  for (const n of Object.entries(i)) {
    var t = L(n, 2);
    const r = t[0], s = t[1];
    s !== void 0 && (e[r] = s);
  }
  return e;
}
function pr(i, e) {
  return i && e ? "".concat(i, "x").concat(e) : void 0;
}
function is(i) {
  return Math.round(i * 1e4) / 1e4;
}
function of(i) {
  const e = i.jitterBufferDelay, t = i.jitterBufferEmittedCount;
  return e !== void 0 && t ? is(e / t) : void 0;
}
function cf(i, e) {
  if (i.playoutDelay !== void 0)
    return is(i.playoutDelay);
  const t = e == null ? void 0 : e.totalPlayoutDelay, n = e == null ? void 0 : e.totalSamplesCount;
  return t !== void 0 && n ? is(t / n) : void 0;
}
function rs(i) {
  var e, t;
  const n = /* @__PURE__ */ new Map(), r = [], s = [], a = [];
  let o;
  i.forEach((p) => n.set(p.id, p));
  const c = (p) => {
    var k;
    return p.codecId ? (k = n.get(p.codecId)) === null || k === void 0 ? void 0 : k.mimeType : void 0;
  }, d = (p, k) => p[k] ? n.get(p[k]) : void 0;
  i.forEach((p) => {
    switch (p.type) {
      case "inbound-rtp": {
        const k = d(p, "playoutId");
        s.push(mr({
          kind: p.kind,
          ssrc: p.ssrc,
          mid: p.mid,
          // matches `streamTrackID` in the track's own log context
          trackId: p.trackIdentifier,
          codec: c(p),
          decoder: p.decoderImplementation,
          resolution: pr(p.frameWidth, p.frameHeight),
          fps: p.framesPerSecond,
          bytesReceived: p.bytesReceived,
          packetsReceived: p.packetsReceived,
          packetsLost: p.packetsLost,
          packetsDiscarded: p.packetsDiscarded,
          // frames received without frames decoded is a decode failure
          framesReceived: p.framesReceived,
          framesDecoded: p.framesDecoded,
          framesDropped: p.framesDropped,
          keyFramesDecoded: p.keyFramesDecoded,
          freezeCount: p.freezeCount,
          totalFreezesDuration: p.totalFreezesDuration,
          pauseCount: p.pauseCount,
          nackCount: p.nackCount,
          pliCount: p.pliCount,
          firCount: p.firCount,
          jitter: p.jitter,
          jitterBuffer: of(p),
          playoutDelay: cf(p, k),
          audioLevel: p.audioLevel,
          totalSamplesReceived: p.totalSamplesReceived,
          concealedSamples: p.concealedSamples
        }));
        break;
      }
      case "outbound-rtp": {
        const k = d(p, "remoteId"), T = d(p, "mediaSourceId");
        a.push(mr({
          kind: p.kind,
          ssrc: p.ssrc,
          mid: p.mid,
          rid: p.rid,
          trackId: T == null ? void 0 : T.trackIdentifier,
          active: p.active,
          codec: c(p),
          encoder: p.encoderImplementation,
          resolution: pr(p.frameWidth, p.frameHeight),
          fps: p.framesPerSecond,
          // what the source produces, to tell a stalled capture from a stalled encoder
          captureResolution: pr(T == null ? void 0 : T.width, T == null ? void 0 : T.height),
          captureFps: T == null ? void 0 : T.framesPerSecond,
          audioLevel: T == null ? void 0 : T.audioLevel,
          targetBitrate: p.targetBitrate,
          bytesSent: p.bytesSent,
          packetsSent: p.packetsSent,
          retransmittedPacketsSent: p.retransmittedPacketsSent,
          framesEncoded: p.framesEncoded,
          keyFramesEncoded: p.keyFramesEncoded,
          limitedBy: p.qualityLimitationReason === "none" ? void 0 : p.qualityLimitationReason,
          nackCount: p.nackCount,
          pliCount: p.pliCount,
          firCount: p.firCount,
          // loss, jitter and RTT are only known from what the remote reports
          remotePacketsLost: k == null ? void 0 : k.packetsLost,
          remoteFractionLost: k == null ? void 0 : k.fractionLost,
          remoteJitter: k == null ? void 0 : k.jitter,
          remoteRoundTripTime: k == null ? void 0 : k.roundTripTime
        }));
        break;
      }
      case "transport":
        o = p;
        break;
      case "candidate-pair":
        r.push(p);
        break;
    }
  });
  const l = o == null ? void 0 : o.selectedCandidatePairId, u = (t = (e = l ? n.get(l) : void 0) !== null && e !== void 0 ? e : r.find((p) => p.selected)) !== null && t !== void 0 ? t : r.find((p) => p.nominated), h = u != null && u.localCandidateId ? n.get(u.localCandidateId) : void 0, f = u != null && u.remoteCandidateId ? n.get(u.remoteCandidateId) : void 0, g = mr({
    ice: o == null ? void 0 : o.iceState,
    dtls: o == null ? void 0 : o.dtlsState,
    route: h && f ? "".concat(h.candidateType, "/").concat(h.protocol, " -> ").concat(f.candidateType) : void 0,
    network: h == null ? void 0 : h.networkType,
    currentRoundTripTime: u == null ? void 0 : u.currentRoundTripTime,
    // the send bandwidth estimate; no RTP stream reports it
    availableOutgoingBitrate: u == null ? void 0 : u.availableOutgoingBitrate,
    availableIncomingBitrate: u == null ? void 0 : u.availableIncomingBitrate,
    bytesSent: u == null ? void 0 : u.bytesSent,
    bytesReceived: u == null ? void 0 : u.bytesReceived,
    candidatePairChanges: o == null ? void 0 : o.selectedCandidatePairChanges
  });
  return {
    connection: Object.keys(g).length > 0 ? g : void 0,
    outbound: a.length > 0 ? a : void 0,
    inbound: s.length > 0 ? s : void 0
  };
}
function df(i) {
  return typeof i > "u" ? i : typeof structuredClone == "function" ? typeof i == "object" && i !== null ? structuredClone(Object.assign({}, i)) : structuredClone(i) : JSON.parse(JSON.stringify(i));
}
class Y {
  constructor(e, t, n, r, s) {
    if (typeof e == "object")
      this.width = e.width, this.height = e.height, this.aspectRatio = e.aspectRatio, this.encoding = {
        maxBitrate: e.maxBitrate,
        maxFramerate: e.maxFramerate,
        priority: e.priority
      };
    else if (t !== void 0 && n !== void 0)
      this.width = e, this.height = t, this.aspectRatio = e / t, this.encoding = {
        maxBitrate: n,
        maxFramerate: r,
        priority: s
      };
    else
      throw new TypeError("Unsupported options: provide at least width, height and maxBitrate");
  }
  get resolution() {
    return {
      width: this.width,
      height: this.height,
      frameRate: this.encoding.maxFramerate,
      aspectRatio: this.aspectRatio
    };
  }
}
const lf = ["opus", "red"], uf = ["vp8", "h264"], hf = ["vp8", "h264", "vp9", "av1", "h265"];
function kd(i) {
  return !!uf.find((e) => e === i);
}
const ff = kd;
var Ua;
(function(i) {
  i[i.PREFER_REGRESSION = 0] = "PREFER_REGRESSION", i[i.SIMULCAST = 1] = "SIMULCAST", i[i.REGRESSION = 2] = "REGRESSION";
})(Ua || (Ua = {}));
var ss;
(function(i) {
  i.telephone = {
    maxBitrate: 12e3
  }, i.speech = {
    maxBitrate: 24e3
  }, i.music = {
    maxBitrate: 48e3
  }, i.musicStereo = {
    maxBitrate: 64e3
  }, i.musicHighQuality = {
    maxBitrate: 96e3
  }, i.musicHighQualityStereo = {
    maxBitrate: 128e3
  };
})(ss || (ss = {}));
const Un = {
  h90: new Y(160, 90, 9e4, 20),
  h180: new Y(320, 180, 16e4, 20),
  h216: new Y(384, 216, 18e4, 20),
  h360: new Y(640, 360, 45e4, 20),
  h540: new Y(960, 540, 8e5, 25),
  h720: new Y(1280, 720, 17e5, 30),
  h1080: new Y(1920, 1080, 3e6, 30),
  h1440: new Y(2560, 1440, 5e6, 30),
  h2160: new Y(3840, 2160, 8e6, 30)
}, as = {
  h120: new Y(160, 120, 7e4, 20),
  h180: new Y(240, 180, 125e3, 20),
  h240: new Y(320, 240, 14e4, 20),
  h360: new Y(480, 360, 33e4, 20),
  h480: new Y(640, 480, 5e5, 20),
  h540: new Y(720, 540, 6e5, 25),
  h720: new Y(960, 720, 13e5, 30),
  h1080: new Y(1440, 1080, 23e5, 30),
  h1440: new Y(1920, 1440, 38e5, 30)
}, zi = {
  h360fps3: new Y(640, 360, 2e5, 3, "medium"),
  h360fps15: new Y(640, 360, 4e5, 15, "medium"),
  h720fps5: new Y(1280, 720, 8e5, 5, "medium"),
  h720fps15: new Y(1280, 720, 15e5, 15, "medium"),
  h720fps30: new Y(1280, 720, 2e6, 30, "medium"),
  h1080fps15: new Y(1920, 1080, 25e5, 15, "medium"),
  h1080fps30: new Y(1920, 1080, 5e6, 30, "medium"),
  // original resolution, without resizing
  original: new Y(0, 0, 7e6, 30, "medium")
};
function Td(i, e, t) {
  var n, r, s, a;
  const o = Ed(i ?? {}), c = o.optionsWithoutProcessor, d = o.audioProcessor, l = o.videoProcessor, u = e == null ? void 0 : e.processor, h = t == null ? void 0 : t.processor, f = c ?? {};
  return f.audio === !0 && (f.audio = {}), f.video === !0 && (f.video = {}), f.audio && (os(f.audio, e), (n = (s = f.audio).deviceId) !== null && n !== void 0 || (s.deviceId = {
    ideal: "default"
  }), (d || u) && (f.audio.processor = d ?? u)), f.video && (os(f.video, t), (r = (a = f.video).deviceId) !== null && r !== void 0 || (a.deviceId = {
    ideal: "default"
  }), (l || h) && (f.video.processor = l ?? h)), f;
}
function os(i, e) {
  return Object.keys(e).forEach((t) => {
    i[t] === void 0 && (i[t] = e[t]);
  }), i;
}
function Vs(i) {
  var e, t, n, r;
  const s = {};
  if (i.video)
    if (typeof i.video == "object") {
      const a = {}, o = a, c = i.video;
      Object.keys(c).forEach((d) => {
        switch (d) {
          case "resolution":
            os(o, c.resolution);
            break;
          default:
            o[d] = c[d];
        }
      }), s.video = a, (e = (n = s.video).deviceId) !== null && e !== void 0 || (n.deviceId = {
        ideal: "default"
      });
    } else
      s.video = i.video ? {
        deviceId: {
          ideal: "default"
        }
      } : !1;
  else
    s.video = !1;
  return i.audio ? typeof i.audio == "object" ? (s.audio = i.audio, (t = (r = s.audio).deviceId) !== null && t !== void 0 || (r.deviceId = {
    ideal: "default"
  })) : s.audio = {
    deviceId: {
      ideal: "default"
    }
  } : s.audio = !1, s;
}
function Sd(i) {
  return m(this, arguments, void 0, function(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 200;
    return (function* () {
      const n = Ws();
      if (n) {
        const r = n.createAnalyser();
        r.fftSize = 2048;
        const s = r.frequencyBinCount, a = new Uint8Array(s);
        n.createMediaStreamSource(new MediaStream([e.mediaStreamTrack])).connect(r), yield ke(t), r.getByteTimeDomainData(a);
        const c = a.some((d) => d !== 128 && d !== 0);
        return n.close(), !c;
      }
      return !1;
    })();
  });
}
function Ws() {
  var i;
  const e = (
    // @ts-ignore
    typeof window < "u" && (window.AudioContext || window.webkitAudioContext)
  );
  if (e) {
    const t = new e({
      latencyHint: "interactive"
    });
    if (t.state === "suspended" && typeof window < "u" && (!((i = window.document) === null || i === void 0) && i.body)) {
      const n = () => m(this, void 0, void 0, function* () {
        var r;
        try {
          t.state === "suspended" && (yield t.resume());
        } catch (s) {
          console.warn("Error trying to auto-resume audio context", s);
        } finally {
          (r = window.document.body) === null || r === void 0 || r.removeEventListener("click", n);
        }
      });
      t.addEventListener("statechange", () => {
        var r;
        t.state === "closed" && ((r = window.document.body) === null || r === void 0 || r.removeEventListener("click", n));
      }), window.document.body.addEventListener("click", n);
    }
    return t;
  }
}
function mf(i) {
  return i === "audioinput" ? E.Source.Microphone : i === "videoinput" ? E.Source.Camera : E.Source.Unknown;
}
function cs(i) {
  return i === E.Source.Microphone ? "audioinput" : i === E.Source.Camera ? "videoinput" : void 0;
}
function Cd(i) {
  var e, t;
  let n = (e = i.video) !== null && e !== void 0 ? e : !0;
  return i.resolution && i.resolution.width > 0 && i.resolution.height > 0 && (n = typeof n == "boolean" ? {} : n, Vt() ? n = Object.assign(Object.assign({}, n), {
    width: {
      max: i.resolution.width
    },
    height: {
      max: i.resolution.height
    },
    frameRate: i.resolution.frameRate
  }) : n = Object.assign(Object.assign({}, n), {
    width: {
      ideal: i.resolution.width
    },
    height: {
      ideal: i.resolution.height
    },
    frameRate: i.resolution.frameRate
  })), {
    audio: (t = i.audio) !== null && t !== void 0 ? t : !1,
    video: n,
    // @ts-expect-error support for experimental display media features
    controller: i.controller,
    selfBrowserSurface: i.selfBrowserSurface,
    surfaceSwitching: i.surfaceSwitching,
    systemAudio: i.systemAudio,
    preferCurrentTab: i.preferCurrentTab
  };
}
function wn(i) {
  return i.split("/")[1].toLowerCase();
}
function pf(i) {
  const e = [];
  return i.forEach((t) => {
    t.track !== void 0 && e.push(new Ls({
      cid: t.track.mediaStreamID,
      track: t.trackInfo
    }));
  }), e;
}
function j(i) {
  return "mediaStreamTrack" in i ? {
    trackID: i.sid,
    source: i.source,
    muted: i.isMuted,
    enabled: i.mediaStreamTrack.enabled,
    kind: i.kind,
    streamID: i.mediaStreamID,
    streamTrackID: i.mediaStreamTrack.id
  } : {
    trackID: i.trackSid,
    enabled: i.isEnabled,
    muted: i.isMuted,
    trackInfo: Object.assign({
      mimeType: i.mimeType,
      name: i.trackName,
      encrypted: i.isEncrypted,
      kind: i.kind,
      source: i.source
    }, i.track ? j(i.track) : {})
  };
}
function gf() {
  return typeof RTCRtpReceiver < "u" && typeof RTCRtpReceiver.prototype.getSynchronizationSources == "function";
}
function vf(i, e) {
  var t;
  i === void 0 && (i = {}), e === void 0 && (e = {});
  const n = [...Object.keys(e), ...Object.keys(i)], r = {};
  for (const s of n)
    i[s] !== e[s] && (r[s] = (t = e[s]) !== null && t !== void 0 ? t : "");
  return r;
}
function Ed(i) {
  const e = Object.assign({}, i);
  let t, n;
  return typeof e.audio == "object" && e.audio.processor && (t = e.audio.processor, e.audio = Object.assign(Object.assign({}, e.audio), {
    processor: void 0
  })), typeof e.video == "object" && e.video.processor && (n = e.video.processor, e.video = Object.assign(Object.assign({}, e.video), {
    processor: void 0
  })), {
    audioProcessor: t,
    videoProcessor: n,
    optionsWithoutProcessor: df(e)
  };
}
function bf(i) {
  switch (i) {
    case ce.CAMERA:
      return E.Source.Camera;
    case ce.MICROPHONE:
      return E.Source.Microphone;
    case ce.SCREEN_SHARE:
      return E.Source.ScreenShare;
    case ce.SCREEN_SHARE_AUDIO:
      return E.Source.ScreenShareAudio;
    default:
      return E.Source.Unknown;
  }
}
function Fa(i, e) {
  return i.width * i.height < e.width * e.height;
}
function yf(i, e) {
  var t;
  return (t = i.layers) === null || t === void 0 ? void 0 : t.find((n) => n.quality === e);
}
const kf = 5e3, gn = [];
var De;
(function(i) {
  i[i.LOW = 0] = "LOW", i[i.MEDIUM = 1] = "MEDIUM", i[i.HIGH = 2] = "HIGH";
})(De || (De = {}));
class E extends Ie.EventEmitter {
  /**
   * indicates current state of stream, it'll indicate `paused` if the track
   * has been paused by congestion controller
   */
  get streamState() {
    return this._streamState;
  }
  /** @internal */
  setStreamState(e) {
    this._streamState !== e && this.log.debug("stream state changed: ".concat(this._streamState, " -> ").concat(e)), this._streamState = e;
  }
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var r;
    super(), this.attachedElements = [], this.isMuted = !1, this._streamState = E.StreamState.Active, this.isInBackground = !1, this._currentBitrate = 0, this.finalStatsLogged = !1, this.log = q, this.appVisibilityChangedListener = () => {
      this.backgroundTimeout && clearTimeout(this.backgroundTimeout), document.visibilityState === "hidden" ? this.backgroundTimeout = setTimeout(() => this.handleAppVisibilityChanged(), kf) : this.handleAppVisibilityChanged();
    }, this.loggerContextCb = n.loggerContextCb, this.log = he((r = n.loggerName) !== null && r !== void 0 ? r : te.Track, () => this.logContext), this.setMaxListeners(100), this.kind = t, this._mediaStreamTrack = e, this._mediaStreamID = e.id, this.source = E.Source.Unknown;
  }
  get logContext() {
    var e;
    return Object.assign(Object.assign({}, (e = this.loggerContextCb) === null || e === void 0 ? void 0 : e.call(this)), j(this));
  }
  /** current receive bits per second */
  get currentBitrate() {
    return this._currentBitrate;
  }
  get mediaStreamTrack() {
    return this._mediaStreamTrack;
  }
  /**
   * @internal
   * used for keep mediaStream's first id, since it's id might change
   * if we disable/enable a track
   */
  get mediaStreamID() {
    return this._mediaStreamID;
  }
  attach(e) {
    let t = "audio";
    this.kind === E.Kind.Video && (t = "video"), this.attachedElements.length === 0 && this.kind === E.Kind.Video && this.addAppVisibilityListener(), e || (t === "audio" && (gn.forEach((s) => {
      s.parentElement === null && !e && (e = s);
    }), e && gn.splice(gn.indexOf(e), 1)), e || (e = document.createElement(t))), this.attachedElements.includes(e) || this.attachedElements.push(e), Qt(this.mediaStreamTrack, e);
    const n = e.srcObject.getTracks(), r = n.some((s) => s.kind === "audio");
    return e.play().then(() => {
      this.emit(r ? R.AudioPlaybackStarted : R.VideoPlaybackStarted);
    }).catch((s) => {
      s.name === "NotAllowedError" ? this.emit(r ? R.AudioPlaybackFailed : R.VideoPlaybackFailed, s) : s.name === "AbortError" ? this.log.debug("".concat(r ? "audio" : "video", " playback aborted, likely due to new play request")) : this.log.warn("could not playback ".concat(r ? "audio" : "video"), {
        error: s
      }), r && e && n.some((a) => a.kind === "video") && s.name === "NotAllowedError" && (e.muted = !0, e.play().catch(() => {
      }));
    }), this.emit(R.ElementAttached, e), e;
  }
  detach(e) {
    try {
      if (e) {
        Zt(this.mediaStreamTrack, e);
        const n = this.attachedElements.indexOf(e);
        return n >= 0 && (this.attachedElements.splice(n, 1), this.recycleElement(e), this.emit(R.ElementDetached, e)), e;
      }
      const t = [];
      return this.attachedElements.forEach((n) => {
        Zt(this.mediaStreamTrack, n), t.push(n), this.recycleElement(n), this.emit(R.ElementDetached, n);
      }), this.attachedElements = [], t;
    } finally {
      this.attachedElements.length === 0 && this.removeAppVisibilityListener();
    }
  }
  stop() {
    this.log.debug("stopping track"), this.stopMonitor(), this._mediaStreamTrack.stop();
  }
  enable() {
    this._mediaStreamTrack.enabled = !0;
  }
  disable() {
    this._mediaStreamTrack.enabled = !1;
  }
  /* @internal */
  stopMonitor() {
    this.monitorInterval && clearInterval(this.monitorInterval), this.timeSyncHandle !== void 0 && (cancelAnimationFrame(this.timeSyncHandle), this.timeSyncHandle = void 0), this.logFinalStats();
  }
  /**
   * Dumps the raw stats of the track as it ends, once: a track that stops
   * between two of the room's stats dumps is gone by the time the next one runs.
   */
  logFinalStats() {
    this.finalStatsLogged || (this.finalStatsLogged = !0, this.getRTCStatsReport().then((e) => {
      e && this.log.info("final track stats", rs(e));
    }).catch((e) => this.log.debug("could not collect final track stats", {
      error: e
    })));
  }
  /** @internal */
  updateLoggerOptions(e) {
    e.loggerContextCb && (this.loggerContextCb = e.loggerContextCb), e.loggerName && (this.log = he(e.loggerName, () => this.logContext));
  }
  recycleElement(e) {
    if (e instanceof HTMLAudioElement) {
      let t = !0;
      e.pause(), gn.forEach((n) => {
        n.parentElement || (t = !1);
      }), t && gn.push(e);
    }
  }
  handleAppVisibilityChanged() {
    return m(this, void 0, void 0, function* () {
      this.isInBackground = document.visibilityState === "hidden", !this.isInBackground && this.kind === E.Kind.Video && setTimeout(() => this.attachedElements.forEach((e) => e.play().catch(() => {
      })), 0);
    });
  }
  addAppVisibilityListener() {
    Re() ? (this.isInBackground = document.visibilityState === "hidden", document.addEventListener("visibilitychange", this.appVisibilityChangedListener)) : this.isInBackground = !1;
  }
  removeAppVisibilityListener() {
    Re() && document.removeEventListener("visibilitychange", this.appVisibilityChangedListener);
  }
}
function Qt(i, e) {
  let t;
  e.srcObject instanceof MediaStream ? t = e.srcObject : t = new MediaStream();
  let n;
  i.kind === "audio" ? n = t.getAudioTracks() : n = t.getVideoTracks(), n.includes(i) || (n.forEach((r) => {
    t.removeTrack(r);
  }), t.addTrack(i)), (!Vt() || !(e instanceof HTMLVideoElement)) && (e.autoplay = !0), e.muted = t.getAudioTracks().length === 0, e instanceof HTMLVideoElement && (e.playsInline = !0), e.srcObject !== t && (e.srcObject = t, (Vt() || jt()) && e instanceof HTMLVideoElement && setTimeout(() => {
    e.srcObject = t, e.play().catch(() => {
    });
  }, 0));
}
function Zt(i, e) {
  if (e.srcObject instanceof MediaStream) {
    const t = e.srcObject;
    t.removeTrack(i), t.getTracks().length > 0 ? e.srcObject = t : e.srcObject = null;
  }
}
(function(i) {
  let e;
  (function(d) {
    d.Audio = "audio", d.Video = "video", d.Unknown = "unknown";
  })(e = i.Kind || (i.Kind = {}));
  let t;
  (function(d) {
    d.Camera = "camera", d.Microphone = "microphone", d.ScreenShare = "screen_share", d.ScreenShareAudio = "screen_share_audio", d.Unknown = "unknown";
  })(t = i.Source || (i.Source = {}));
  let n;
  (function(d) {
    d.Active = "active", d.Paused = "paused", d.Unknown = "unknown";
  })(n = i.StreamState || (i.StreamState = {}));
  function r(d) {
    switch (d) {
      case e.Audio:
        return je.AUDIO;
      case e.Video:
        return je.VIDEO;
      default:
        return je.DATA;
    }
  }
  i.kindToProto = r;
  function s(d) {
    switch (d) {
      case je.AUDIO:
        return e.Audio;
      case je.VIDEO:
        return e.Video;
      default:
        return e.Unknown;
    }
  }
  i.kindFromProto = s;
  function a(d) {
    switch (d) {
      case t.Camera:
        return ce.CAMERA;
      case t.Microphone:
        return ce.MICROPHONE;
      case t.ScreenShare:
        return ce.SCREEN_SHARE;
      case t.ScreenShareAudio:
        return ce.SCREEN_SHARE_AUDIO;
      default:
        return ce.UNKNOWN;
    }
  }
  i.sourceToProto = a;
  function o(d) {
    switch (d) {
      case ce.CAMERA:
        return t.Camera;
      case ce.MICROPHONE:
        return t.Microphone;
      case ce.SCREEN_SHARE:
        return t.ScreenShare;
      case ce.SCREEN_SHARE_AUDIO:
        return t.ScreenShareAudio;
      default:
        return t.Unknown;
    }
  }
  i.sourceFromProto = o;
  function c(d) {
    switch (d) {
      case Kr.ACTIVE:
        return n.Active;
      case Kr.PAUSED:
        return n.Paused;
      default:
        return n.Unknown;
    }
  }
  i.streamStateFromProto = c;
})(E || (E = {}));
const Tf = "|", en = "https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension";
function wd(i) {
  const e = i.split(Tf);
  return e.length > 1 ? [e[0], i.substr(e[0].length + 1)] : [i, ""];
}
function ke(i) {
  return new Ee((e) => Q.setTimeout(e, i));
}
function Ci() {
  return "addTransceiver" in RTCPeerConnection.prototype;
}
function ds() {
  return "addTrack" in RTCPeerConnection.prototype;
}
function ev() {
  return typeof ResizeObserver < "u" && typeof IntersectionObserver < "u";
}
function tv() {
  return Ci();
}
function Sf() {
  if (!("getCapabilities" in RTCRtpSender) || Vt() || jt())
    return !1;
  const i = RTCRtpSender.getCapabilities("video");
  let e = !1;
  if (i) {
    for (const t of i.codecs)
      if (t.mimeType.toLowerCase() === "video/av1") {
        e = !0;
        break;
      }
  }
  return e;
}
function Cf() {
  if (!("getCapabilities" in RTCRtpSender) || jt())
    return !1;
  if (Vt()) {
    const t = ye();
    if (t != null && t.version && Je(t.version, "16") < 0 || (t == null ? void 0 : t.os) === "iOS" && (t != null && t.osVersion) && Je(t.osVersion, "16") < 0)
      return !1;
  }
  const i = RTCRtpSender.getCapabilities("video");
  let e = !1;
  if (i) {
    for (const t of i.codecs)
      if (t.mimeType.toLowerCase() === "video/vp9") {
        e = !0;
        break;
      }
  }
  return e;
}
function nv() {
  if (!("getCapabilities" in RTCRtpSender))
    return !1;
  const i = RTCRtpSender.getCapabilities("video");
  let e = !1;
  if (i) {
    for (const t of i.codecs)
      if (t.mimeType.toLowerCase() === "video/h265") {
        e = !0;
        break;
      }
  }
  return e;
}
function Pt(i) {
  return i === "av1" || i === "vp9";
}
function Ef(i) {
  var e;
  const t = (e = i.getHeaderExtensionsToNegotiate) === null || e === void 0 ? void 0 : e.call(i);
  if (!t || !i.setHeaderExtensionsToNegotiate)
    return !1;
  const n = t.find((r) => r.uri === en);
  if (!n)
    return !1;
  if (n.direction !== "stopped")
    return !0;
  n.direction = "sendrecv";
  try {
    return i.setHeaderExtensionsToNegotiate(t), !0;
  } catch {
    return !1;
  }
}
function tn(i, e) {
  var t;
  return Pt(i) && !!(e != null && e.simulcast) && !!(!((t = e.scalabilityMode) === null || t === void 0) && t.startsWith("L1T"));
}
function _d() {
  const i = ye();
  return Fn() || // Even tho RN runs M114, it does not produce SVC layers when a single encoding
  // is provided. So we'll use the legacy SVC specification for now.
  // TODO: when we upstream libwebrtc, this will need additional verification
  ze() || (i == null ? void 0 : i.name) === "Chrome" && Je(i.version, "113") < 0;
}
const wf = "1.13.6";
function _f(i) {
  return i ? Je(i, wf) > 0 : !1;
}
function Ei(i) {
  return !document || Fn() ? !1 : (i || (i = document.createElement("audio")), "setSinkId" in i);
}
function iv() {
  return Ei();
}
function Pf() {
  return typeof RTCPeerConnection > "u" ? !1 : Ci() || ds();
}
function jt() {
  var i;
  return ((i = ye()) === null || i === void 0 ? void 0 : i.name) === "Firefox";
}
function Rf() {
  const i = ye();
  return !!i && i.name === "Chrome" && i.os !== "iOS";
}
function ls() {
  return typeof window < "u" && // @ts-ignore
  typeof window.RTCRtpScriptTransform < "u" && !Rf();
}
function Vt() {
  var i;
  return ((i = ye()) === null || i === void 0 ? void 0 : i.name) === "Safari";
}
function Fn() {
  const i = ye();
  return (i == null ? void 0 : i.name) === "Safari" || (i == null ? void 0 : i.os) === "iOS";
}
function Pd() {
  const i = ye();
  return (i == null ? void 0 : i.name) === "Safari" && i.version.startsWith("17.") || (i == null ? void 0 : i.os) === "iOS" && !!(i != null && i.osVersion) && Je(i.osVersion, "17") >= 0;
}
function If(i) {
  return i || (i = ye()), (i == null ? void 0 : i.name) === "Safari" && Je(i.version, "18.3") > 0 || (i == null ? void 0 : i.os) === "iOS" && !!(i != null && i.osVersion) && Je(i.osVersion, "18.3") > 0;
}
function Rd() {
  var i, e;
  return Re() ? (
    // @ts-expect-error `userAgentData` is not yet part of typescript
    (e = (i = navigator.userAgentData) === null || i === void 0 ? void 0 : i.mobile) !== null && e !== void 0 ? e : /Tablet|iPad|Mobile|Android|BlackBerry/.test(navigator.userAgent)
  ) : !1;
}
function Mf() {
  const i = ye(), e = "17.2";
  if (i)
    return i.name !== "Safari" && i.os !== "iOS" || i.os === "iOS" && i.osVersion && Je(i.osVersion, e) >= 0 ? !0 : i.name === "Safari" && Je(i.version, e) >= 0;
}
function Re() {
  return typeof document < "u";
}
function ze() {
  return navigator.product == "ReactNative";
}
function un(i) {
  return i.hostname.endsWith(".livekit.cloud") || i.hostname.endsWith(".livekit.run");
}
function gr(i) {
  return un(i) ? i.hostname.split(".")[0] : null;
}
function Id() {
  if (global && global.LiveKitReactNativeGlobal)
    return global.LiveKitReactNativeGlobal;
}
function Md() {
  if (!ze())
    return;
  let i = Id();
  if (i)
    return i.platform;
}
function Ba() {
  if (Re())
    return window.devicePixelRatio;
  if (ze()) {
    let i = Id();
    if (i)
      return i.devicePixelRatio;
  }
  return 1;
}
function Je(i, e) {
  const t = i.split("."), n = e.split("."), r = Math.min(t.length, n.length);
  for (let s = 0; s < r; ++s) {
    const a = parseInt(t[s], 10), o = parseInt(n[s], 10);
    if (a > o) return 1;
    if (a < o) return -1;
    if (s === r - 1 && a === o) return 0;
  }
  return i === "" && e !== "" ? -1 : e === "" ? 1 : t.length == n.length ? 0 : t.length < n.length ? -1 : 1;
}
function Of(i) {
  for (const e of i)
    e.target.handleResize(e);
}
function Af(i) {
  for (const e of i)
    e.target.handleVisibilityChanged(e);
}
let vr = null;
const qa = () => (vr || (vr = new ResizeObserver(Of)), vr);
let br = null;
const ja = () => (br || (br = new IntersectionObserver(Af, {
  root: null,
  rootMargin: "0px"
})), br);
function Df(i) {
  var e;
  const t = new pc({
    capabilities: i,
    sdk: gc.JS,
    protocol: nf,
    clientProtocol: rf,
    version: tf
  });
  return ze() && (t.os = (e = Md()) !== null && e !== void 0 ? e : ""), t;
}
let yr;
function rv() {
  return yr || (yr = us()), yr.clone();
}
function us() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 16, e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 16, t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1, n = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !1;
  const r = document.createElement("canvas");
  r.width = i, r.height = e;
  const s = r.getContext("2d");
  s == null || s.fillRect(0, 0, r.width, r.height), n && s && (s.beginPath(), s.arc(i / 2, e / 2, 50, 0, Math.PI * 2, !0), s.closePath(), s.fillStyle = "grey", s.fill());
  const o = r.captureStream().getTracks(), c = L(o, 1), d = c[0];
  if (!d)
    throw Error("Could not get empty media stream video track");
  return d.enabled = t, d;
}
let vn;
function kr() {
  if (!vn) {
    const t = new AudioContext(), n = t.createOscillator(), r = t.createGain();
    r.gain.setValueAtTime(0, 0);
    const s = t.createMediaStreamDestination();
    n.connect(r), r.connect(s), n.start();
    var i = s.stream.getAudioTracks(), e = L(i, 1);
    if (vn = e[0], !vn)
      throw Error("Could not get empty media stream audio track");
    vn.enabled = !1;
  }
  return vn.clone();
}
class ve {
  get isResolved() {
    return this._isResolved;
  }
  constructor(e, t) {
    this._isResolved = !1, this.onFinally = t, this.promise = new Promise((n, r) => m(this, void 0, void 0, function* () {
      this.resolve = n, this.reject = r, e && (yield e(n, r));
    })).finally(() => {
      var n;
      this._isResolved = !0, (n = this.onFinally) === null || n === void 0 || n.call(this);
    });
  }
}
function sv(i, e) {
  const t = Object.assign({
    cloneTrack: !1,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -80
  }, e), n = Ws();
  if (!n)
    throw new Error("Audio Context not supported on this browser");
  const r = t.cloneTrack ? i.mediaStreamTrack.clone() : i.mediaStreamTrack, s = n.createMediaStreamSource(new MediaStream([r])), a = n.createAnalyser();
  a.minDecibels = t.minDecibels, a.maxDecibels = t.maxDecibels, a.fftSize = t.fftSize, a.smoothingTimeConstant = t.smoothingTimeConstant, s.connect(a);
  const o = new Uint8Array(a.frequencyBinCount);
  return {
    calculateVolume: () => {
      a.getByteFrequencyData(o);
      let l = 0;
      for (const h of o)
        l += Math.pow(h / 255, 2);
      return Math.sqrt(l / o.length);
    },
    analyser: a,
    cleanup: () => m(this, void 0, void 0, function* () {
      yield n.close(), t.cloneTrack && r.stop();
    })
  };
}
function av(i) {
  return lf.includes(i);
}
function Od(i) {
  return hf.includes(i);
}
function nn(i) {
  if (typeof i == "string" || typeof i == "number")
    return i;
  if (Array.isArray(i))
    return i[0];
  if (i.exact !== void 0)
    return Array.isArray(i.exact) ? i.exact[0] : i.exact;
  if (i.ideal !== void 0)
    return Array.isArray(i.ideal) ? i.ideal[0] : i.ideal;
  throw Error("could not unwrap constraint");
}
function Lf(i) {
  return i.startsWith("http") ? i.replace(/^(http)/, "ws") : i;
}
function Bn(i) {
  return i.startsWith("ws") ? i.replace(/^(ws)/, "http") : i;
}
function xf(i, e) {
  return i.segments.map((t) => {
    let n = t.id, r = t.text, s = t.language, a = t.startTime, o = t.endTime, c = t.final;
    var d;
    const l = (d = e.get(n)) !== null && d !== void 0 ? d : Date.now(), u = Date.now();
    return c ? e.delete(n) : e.set(n, l), {
      id: n,
      text: r,
      startTime: Number.parseInt(a.toString()),
      endTime: Number.parseInt(o.toString()),
      final: c,
      language: s,
      firstReceivedTime: l,
      lastReceivedTime: u
    };
  });
}
function Nf(i) {
  const e = i.id, t = i.timestamp, n = i.message, r = i.editTimestamp;
  return {
    id: e,
    timestamp: Number.parseInt(t.toString()),
    editTimestamp: r ? Number.parseInt(r.toString()) : void 0,
    message: n
  };
}
function Va(i) {
  switch (i.reason) {
    case J.LeaveRequest:
      return i.context;
    case J.Cancelled:
      return Ae.CLIENT_INITIATED;
    case J.NotAllowed:
      return Ae.USER_REJECTED;
    case J.ServerUnreachable:
      return Ae.JOIN_FAILURE;
    default:
      return Ae.UNKNOWN_REASON;
  }
}
function Gt(i) {
  return i !== void 0 ? Number(i) : void 0;
}
function Ge(i) {
  return i !== void 0 ? BigInt(i) : void 0;
}
function Ft(i) {
  return !!i && !(i instanceof MediaStreamTrack) && i.isLocal;
}
function nt(i) {
  return !!i && i.kind == E.Kind.Audio;
}
function ht(i) {
  return !!i && i.kind == E.Kind.Video;
}
function $e(i) {
  return Ft(i) && ht(i);
}
function st(i) {
  return Ft(i) && nt(i);
}
function hs(i) {
  return !!i && !i.isLocal;
}
function Uf(i) {
  return !!i && !i.isLocal;
}
function Tr(i) {
  return hs(i) && ht(i);
}
function Ff(i) {
  return i.isLocal;
}
function ov(i) {
  return !i.isLocal;
}
function Bf(i, e) {
  const t = [];
  let n = new TextEncoder().encode(i);
  for (; n.length > e; ) {
    let r = e;
    for (; r > 0; ) {
      const s = n[r];
      if (s !== void 0 && (s & 192) !== 128)
        break;
      r--;
    }
    t.push(n.slice(0, r)), n = n.slice(r);
  }
  return n.length > 0 && t.push(n), t;
}
function vi(i) {
  return new ReadableStream({
    start(e) {
      e.enqueue(i), e.close();
    }
  });
}
function qf(i, e) {
  return Fc(this, arguments, function* () {
    const n = i.getReader();
    let r = new Uint8Array(0);
    try {
      for (; ; ) {
        const s = yield ut(n.read()), a = s.done, o = s.value;
        if (a)
          break;
        if (o.byteLength === 0)
          continue;
        const c = new Uint8Array(r.byteLength + o.byteLength);
        for (c.set(r), c.set(o, r.byteLength), r = c; r.byteLength >= e; )
          yield yield ut(r.slice(0, e)), r = r.slice(e);
      }
      r.byteLength > 0 && (yield yield ut(r));
    } finally {
      n.releaseLock();
    }
  });
}
function jf(i) {
  var e;
  const t = i.get("Cache-Control");
  if (t) {
    const n = (e = t.match(/(?:^|[,\s])max-age=(\d+)/)) === null || e === void 0 ? void 0 : e[1];
    if (n)
      return parseInt(n, 10);
  }
}
function Ct() {
  return typeof CompressionStream < "u";
}
function Vf() {
  return Ct() && !jt();
}
function Wa(i, e) {
  const t = wd(e.id), n = L(t, 2), r = n[1];
  if (r != null && r.startsWith("TR"))
    return r;
  if (i.id.startsWith("TR"))
    return i.id;
}
function Wf(i, e) {
  let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1;
  const n = Hf(i, e);
  return t ? n : Hs(n, "v1");
}
function Hf(i, e) {
  const t = new URL(Lf(i));
  return e.forEach((n, r) => {
    t.searchParams.set(r, n);
  }), Hs(t, "rtc");
}
function Kf(i) {
  const e = new URL(Bn(i));
  return Hs(e, "validate");
}
function Ad(i) {
  return i.endsWith("/") ? i : "".concat(i, "/");
}
function Hs(i, e) {
  return i.pathname = "".concat(Ad(i.pathname)).concat(e), i;
}
function Ha(i) {
  if (typeof i == "string")
    return Ca.fromJson(JSON.parse(i), {
      ignoreUnknownFields: !0
    });
  if (i instanceof ArrayBuffer)
    return Ca.fromBinary(new Uint8Array(i));
  throw new Error("could not decode websocket message: ".concat(typeof i));
}
function Gf(i) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "Unknown reason";
  if (i instanceof Error)
    return i.message;
  if (!(i instanceof AbortSignal))
    return e;
  const t = i.reason;
  switch (typeof t) {
    case "string":
      return t;
    case "object":
      return t instanceof Error ? t.message : e;
    default:
      return "toString" in t ? t.toString() : e;
  }
}
function zf(i, e) {
  return i instanceof Error ? i.name && i.message ? "".concat(i.name, ": ").concat(i.message) : i.name : "Encountered unknown ".concat(e, " error: ").concat(String(i));
}
const Dd = "AES-GCM", Jf = 10, Xn = "lk_e2ee", Zn = "lk_e2ee_track_id", Qf = "LKFrameEncryptionKey", Yf = {
  sharedKey: !1,
  ratchetSalt: Qf,
  ratchetWindowSize: 8,
  failureTolerance: Jf,
  keyringSize: 16,
  keySize: 128
};
var Et;
(function(i) {
  i.SetKey = "setKey", i.RatchetRequest = "ratchetRequest", i.KeyRatcheted = "keyRatcheted";
})(Et || (Et = {}));
var Ka;
(function(i) {
  i.KeyRatcheted = "keyRatcheted";
})(Ka || (Ka = {}));
var vt;
(function(i) {
  i.ParticipantEncryptionStatusChanged = "participantEncryptionStatusChanged", i.EncryptionError = "encryptionError";
})(vt || (vt = {}));
var Ga;
(function(i) {
  i.Error = "cryptorError";
})(Ga || (Ga = {}));
function $f() {
  return Ks() || Xf();
}
function Xf() {
  return typeof window < "u" && typeof window.RTCRtpScriptTransform < "u";
}
function Ks() {
  return typeof window < "u" && typeof window.RTCRtpSender < "u" && // @ts-ignore
  typeof window.RTCRtpSender.prototype.createEncodedStreams < "u";
}
function cv(i) {
  return "type" in i;
}
function dv(i) {
  return m(this, arguments, void 0, function(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
      name: Dd
    }, n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "encrypt";
    return (function* () {
      return crypto.subtle.importKey("raw", e, t, !1, n === "derive" ? ["deriveBits", "deriveKey"] : ["encrypt", "decrypt"]);
    })();
  });
}
function Zf(i) {
  return m(this, void 0, void 0, function* () {
    let e = new TextEncoder();
    return yield crypto.subtle.importKey("raw", e.encode(i), {
      name: "PBKDF2"
    }, !1, ["deriveBits", "deriveKey"]);
  });
}
function em(i) {
  return m(this, void 0, void 0, function* () {
    return yield crypto.subtle.importKey("raw", i, "HKDF", !1, ["deriveBits", "deriveKey"]);
  });
}
function Ld(i, e) {
  const n = new TextEncoder().encode(e);
  switch (i) {
    case "HKDF":
      return {
        name: "HKDF",
        salt: n,
        hash: "SHA-256",
        info: new ArrayBuffer(128)
      };
    case "PBKDF2":
      return {
        name: "PBKDF2",
        salt: n,
        hash: "SHA-256",
        iterations: 1e5
      };
    default:
      throw new Error("algorithm ".concat(i, " is currently unsupported"));
  }
}
function lv(i, e) {
  return m(this, void 0, void 0, function* () {
    const t = Ld(i.algorithm.name, e.ratchetSalt), n = yield crypto.subtle.deriveKey(t, i, {
      name: Dd,
      length: e.keySize
    }, !1, ["encrypt", "decrypt"]);
    return {
      material: i,
      encryptionKey: n
    };
  });
}
function uv() {
  return window.crypto.getRandomValues(new Uint8Array(32));
}
function hv(i, e) {
  return m(this, void 0, void 0, function* () {
    const t = Ld(i.algorithm.name, e);
    return crypto.subtle.deriveBits(t, i, 256);
  });
}
function fv(i) {
  for (var e = 0; e < i.length - 3; e++)
    if (i[e] == 0 && i[e + 1] == 0 && i[e + 2] == 3) return !0;
  return !1;
}
function mv(i) {
  const e = [];
  for (var t = i.length, n = 0; n < i.length; )
    t - n >= 3 && !i[n] && !i[n + 1] && i[n + 2] == 3 ? (e.push(i[n++]), e.push(i[n++]), n++) : e.push(i[n++]);
  return new Uint8Array(e);
}
const tm = 2, za = 3;
function pv(i) {
  const e = [];
  for (var t = 0, n = 0; n < i.length; ++n) {
    var r = i[n];
    r <= za && t >= tm && (e.push(za), t = 0), e.push(r), r == 0 ? ++t : t = 0;
  }
  return new Uint8Array(e);
}
function nm(i) {
  var e, t, n, r, s;
  if (((e = i.value) === null || e === void 0 ? void 0 : e.case) !== "sipDtmf" && ((t = i.value) === null || t === void 0 ? void 0 : t.case) !== "metrics" && ((n = i.value) === null || n === void 0 ? void 0 : n.case) !== "speaker" && ((r = i.value) === null || r === void 0 ? void 0 : r.case) !== "transcription" && ((s = i.value) === null || s === void 0 ? void 0 : s.case) !== "encryptedPacket")
    return new cc({
      value: i.value
    });
}
class im extends Ie.EventEmitter {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    super(), this.latestManuallySetKeyIndex = 0, this.onKeyRatcheted = (t, n, r) => {
      q.debug("key ratcheted event received", {
        ratchetResult: t,
        participantId: n,
        keyIndex: r
      });
    }, this.keyInfoMap = /* @__PURE__ */ new Map(), this.options = Object.assign(Object.assign({}, Yf), e), this.on(Et.KeyRatcheted, this.onKeyRatcheted);
  }
  /**
   * callback to invoke once a key has been set for a participant
   * @param key
   * @param participantIdentity
   * @param keyIndex
   */
  onSetEncryptionKey(e, t, n) {
    const r = {
      key: e,
      participantIdentity: t,
      keyIndex: n
    };
    if (!this.options.sharedKey && !t)
      throw new Error("participant identity needs to be passed for encryption key if sharedKey option is false");
    this.keyInfoMap.set("".concat(t ?? "shared", "-").concat(n ?? 0), r), n !== void 0 && (this.latestManuallySetKeyIndex = n), this.emit(Et.SetKey, r, n !== void 0);
  }
  getKeys() {
    return Array.from(this.keyInfoMap.values());
  }
  getLatestManuallySetKeyIndex() {
    return this.latestManuallySetKeyIndex;
  }
  getOptions() {
    return this.options;
  }
  ratchetKey(e, t) {
    this.emit(Et.RatchetRequest, e, t);
  }
}
class gv extends im {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const t = Object.assign(Object.assign({}, e), {
      sharedKey: !0,
      // for a shared key provider failing to decrypt for a specific participant
      // should not mark the key as invalid, so we accept wrong keys forever
      // and won't try to auto-ratchet
      ratchetWindowSize: 0,
      failureTolerance: -1
    });
    super(t);
  }
  /**
   * Accepts a passphrase that's used to create the crypto keys.
   * When passing in a string, PBKDF2 is used. (recommended for maximum compatibility across SDKs)
   * When passing in an ArrayBuffer of cryptographically random numbers, HKDF is used.
   *
   * Note: Not all client SDKS support HKDF.
   * @param key
   */
  setKey(e) {
    return m(this, void 0, void 0, function* () {
      const t = typeof e == "string" ? yield Zf(e) : yield em(e);
      this.onSetEncryptionKey(t);
    });
  }
}
var wi;
(function(i) {
  i[i.InvalidKey = 0] = "InvalidKey", i[i.MissingKey = 1] = "MissingKey", i[i.InternalError = 2] = "InternalError";
})(wi || (wi = {}));
class rm extends Qe {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : wi.InternalError, n = arguments.length > 2 ? arguments[2] : void 0;
    super(40, e), this.reason = t, this.participantIdentity = n;
  }
}
function qn() {
  return ls();
}
function jn(i) {
  return !!(i != null && i.worker) && (Ks() || qn());
}
function _i(i) {
  return !!(i != null && i.timestamp || i != null && i.frameId);
}
function sm(i) {
  const e = [];
  return i != null && i.timestamp && e.push(dn.PTF_USER_TIMESTAMP), i != null && i.frameId && e.push(dn.PTF_FRAME_ID), e;
}
function am(i) {
  if (!i || i.length === 0)
    return;
  const e = {};
  return i.includes(dn.PTF_USER_TIMESTAMP) && (e.timestamp = !0), i.includes(dn.PTF_FRAME_ID) && (e.frameId = !0), e.timestamp || e.frameId ? e : void 0;
}
function Gs(i) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 50, t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  var n, r;
  let s;
  const a = (n = t.isImmediate) !== null && n !== void 0 ? n : !1, o = (r = t.callback) !== null && r !== void 0 ? r : !1, c = t.maxWait;
  let d = Date.now(), l = [];
  function u() {
    if (c !== void 0) {
      const f = Date.now() - d;
      if (f + e >= c)
        return c - f;
    }
    return e;
  }
  const h = function() {
    for (var f = arguments.length, g = new Array(f), p = 0; p < f; p++)
      g[p] = arguments[p];
    const k = this;
    return new Promise((T, S) => {
      const I = function() {
        if (s = void 0, d = Date.now(), !a) {
          const y = i.apply(k, g);
          o && o(y), l.forEach((C) => {
            let M = C.resolve;
            return M(y);
          }), l = [];
        }
      }, b = a && s === void 0;
      if (s !== void 0 && Q.clearTimeout(s), s = Q.setTimeout(I, u()), b) {
        const y = i.apply(k, g);
        return o && o(y), T(y);
      }
      l.push({
        resolve: T,
        reject: S
      });
    });
  };
  return h.cancel = function(f) {
    s !== void 0 && Q.clearTimeout(s), l.forEach((g) => {
      let p = g.reject;
      return p(f);
    }), l = [];
  }, h;
}
const zs = 2e3;
function Ji(i, e) {
  if (!e)
    return 0;
  let t, n;
  return "bytesReceived" in i ? (t = i.bytesReceived, n = e.bytesReceived) : "bytesSent" in i && (t = i.bytesSent, n = e.bytesSent), t === void 0 || n === void 0 || i.timestamp === void 0 || e.timestamp === void 0 ? 0 : (t - n) * 8 * 1e3 / (i.timestamp - e.timestamp);
}
class xd extends E {
  constructor(e, t, n, r, s) {
    super(e, n, s), this.timeSyncLoop = () => {
      var a;
      if (this.listenerCount(R.TimeSyncUpdate) === 0) {
        this.timeSyncHandle = void 0;
        return;
      }
      this.timeSyncHandle = requestAnimationFrame(this.timeSyncLoop);
      const o = (a = this.receiver) === null || a === void 0 ? void 0 : a.getSynchronizationSources()[0];
      if (o) {
        const c = o.timestamp, d = o.rtpTimestamp;
        d && this.rtpTimestamp !== d && (this.emit(R.TimeSyncUpdate, {
          timestamp: c,
          rtpTimestamp: d
        }), this.rtpTimestamp = d);
      }
    }, this.onTimeSyncListenerAdded = (a) => {
      a === R.TimeSyncUpdate && this.timeSyncHandle === void 0 && (this.timeSyncHandle = requestAnimationFrame(this.timeSyncLoop));
    }, this.sid = t, this.receiver = r;
  }
  get isLocal() {
    return !1;
  }
  /** @internal */
  setMuted(e) {
    this.isMuted !== e && (this.isMuted = e, this._mediaStreamTrack.enabled = !e, this.emit(e ? R.Muted : R.Unmuted, this));
  }
  /** @internal */
  setMediaStream(e) {
    this.mediaStream = e;
    const t = (n) => {
      n.track === this._mediaStreamTrack && (e.removeEventListener("removetrack", t), this.receiver && "playoutDelayHint" in this.receiver && (this.receiver.playoutDelayHint = void 0), this.receiver = void 0, this._currentBitrate = 0, this.emit(R.Ended, this));
    };
    e.addEventListener("removetrack", t);
  }
  start() {
    this.startMonitor(), super.enable();
  }
  stop() {
    this.stopMonitor(), super.disable();
  }
  /**
   * Gets the RTCStatsReport for the RemoteTrack's underlying RTCRtpReceiver
   * See https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport
   *
   * @returns Promise<RTCStatsReport> | undefined
   */
  getRTCStatsReport() {
    return m(this, void 0, void 0, function* () {
      var e;
      return !((e = this.receiver) === null || e === void 0) && e.getStats ? yield this.receiver.getStats() : void 0;
    });
  }
  /**
   * Allows to set a playout delay (in seconds) for this track.
   * A higher value allows for more buffering of the track in the browser
   * and will result in a delay of media being played back of `delayInSeconds`
   */
  setPlayoutDelay(e) {
    this.receiver ? "playoutDelayHint" in this.receiver ? this.receiver.playoutDelayHint = e : this.log.warn("Playout delay not supported in this browser") : this.log.warn("Cannot set playout delay, track already ended");
  }
  /**
   * Returns the current playout delay (in seconds) of this track.
   */
  getPlayoutDelay() {
    if (this.receiver) {
      if ("playoutDelayHint" in this.receiver)
        return this.receiver.playoutDelayHint;
      this.log.warn("Playout delay not supported in this browser");
    } else
      this.log.warn("Cannot get playout delay, track already ended");
    return 0;
  }
  /* @internal */
  startMonitor() {
    this.monitorInterval || (this.monitorInterval = setInterval(() => this.monitorReceiver(), zs)), gf() && this.registerTimeSyncUpdate();
  }
  /* @internal */
  stopMonitor() {
    super.stopMonitor(), this.off("newListener", this.onTimeSyncListenerAdded);
  }
  registerTimeSyncUpdate() {
    const e = this;
    e.off("newListener", this.onTimeSyncListenerAdded), e.on("newListener", this.onTimeSyncListenerAdded), this.timeSyncHandle === void 0 && this.timeSyncLoop();
  }
}
const Sr = 100;
class Js extends xd {
  constructor(e, t, n, r, s) {
    super(e, t, E.Kind.Video, n, s), this.elementInfos = [], this.monitorReceiver = () => m(this, void 0, void 0, function* () {
      if (!this.receiver) {
        this._currentBitrate = 0;
        return;
      }
      const a = yield this.getReceiverStats();
      a && this.prevStats && this.receiver && (this._currentBitrate = Ji(a, this.prevStats)), this.prevStats = a;
    }), this.debouncedHandleResize = Gs(() => {
      this.updateDimensions();
    }, Sr), this.adaptiveStreamSettings = r;
  }
  get isAdaptiveStream() {
    return this.adaptiveStreamSettings !== void 0;
  }
  /**
   * Look up frame-level metadata for a given RTP timestamp.
   * Use with the `TrackEvent.TimeSyncUpdate` event to correlate displayed frames
   * with their capture-time metadata.
   *
   * Requires the room to be configured with the `frameMetadata` worker option
   * and the publishing track to have frame metadata features enabled.
   *
   */
  lookupFrameMetadata(e) {
    let t = e.rtpTimestamp;
    var n;
    return (n = this.frameMetadataExtractor) === null || n === void 0 ? void 0 : n.lookupMetadata(t);
  }
  setStreamState(e) {
    super.setStreamState(e), this.log.debug("setStreamState", e), this.isAdaptiveStream && e === E.StreamState.Active && this.updateVisibility();
  }
  /**
   * Note: When using adaptiveStream, you need to use remoteVideoTrack.attach() to add the track to a HTMLVideoElement, otherwise your video tracks might never start
   */
  get mediaStreamTrack() {
    return this._mediaStreamTrack;
  }
  /** @internal */
  setMuted(e) {
    super.setMuted(e), this.attachedElements.forEach((t) => {
      e ? Zt(this._mediaStreamTrack, t) : Qt(this._mediaStreamTrack, t);
    });
  }
  attach(e) {
    if (e ? super.attach(e) : e = super.attach(), this.adaptiveStreamSettings && this.elementInfos.find((t) => t.element === e) === void 0) {
      const t = new om(e);
      this.observeElementInfo(t);
    }
    return e;
  }
  /**
   * Observe an ElementInfo for changes when adaptive streaming.
   * @param elementInfo
   * @internal
   */
  observeElementInfo(e) {
    this.adaptiveStreamSettings && this.elementInfos.find((t) => t === e) === void 0 ? (e.handleResize = () => {
      this.debouncedHandleResize();
    }, e.handleVisibilityChanged = () => {
      this.updateVisibility();
    }, this.elementInfos.push(e), e.observe(), this.debouncedHandleResize(), this.updateVisibility()) : this.log.warn("visibility resize observer not triggered", this.logContext);
  }
  /**
   * Stop observing an ElementInfo for changes.
   * @param elementInfo
   * @internal
   */
  stopObservingElementInfo(e) {
    if (!this.isAdaptiveStream) {
      this.log.warn("stopObservingElementInfo ignored", this.logContext);
      return;
    }
    const t = this.elementInfos.filter((n) => n === e);
    for (const n of t)
      n.stopObserving();
    this.elementInfos = this.elementInfos.filter((n) => n !== e), this.updateVisibility(), this.debouncedHandleResize();
  }
  detach(e) {
    if (e)
      return this.stopObservingElement(e), super.detach(e);
    const t = super.detach();
    for (const n of t)
      this.stopObservingElement(n);
    return t;
  }
  /** @internal */
  getDecoderImplementation() {
    var e;
    return (e = this.prevStats) === null || e === void 0 ? void 0 : e.decoderImplementation;
  }
  getReceiverStats() {
    return m(this, void 0, void 0, function* () {
      if (!this.receiver || !this.receiver.getStats)
        return;
      const e = yield this.receiver.getStats();
      let t, n = "", r = /* @__PURE__ */ new Map();
      return e.forEach((s) => {
        s.type === "inbound-rtp" ? (n = s.codecId, t = {
          type: "video",
          streamId: s.id,
          framesDecoded: s.framesDecoded,
          framesDropped: s.framesDropped,
          framesReceived: s.framesReceived,
          packetsReceived: s.packetsReceived,
          packetsLost: s.packetsLost,
          frameWidth: s.frameWidth,
          frameHeight: s.frameHeight,
          pliCount: s.pliCount,
          firCount: s.firCount,
          nackCount: s.nackCount,
          jitter: s.jitter,
          timestamp: s.timestamp,
          bytesReceived: s.bytesReceived,
          decoderImplementation: s.decoderImplementation
        }) : s.type === "codec" && r.set(s.id, s);
      }), t && n !== "" && r.get(n) && (t.mimeType = r.get(n).mimeType), t;
    });
  }
  stopObservingElement(e) {
    const t = this.elementInfos.filter((n) => n.element === e);
    for (const n of t)
      this.stopObservingElementInfo(n);
  }
  handleAppVisibilityChanged() {
    const e = Object.create(null, {
      handleAppVisibilityChanged: {
        get: () => super.handleAppVisibilityChanged
      }
    });
    return m(this, void 0, void 0, function* () {
      yield e.handleAppVisibilityChanged.call(this), this.isAdaptiveStream && this.updateVisibility();
    });
  }
  updateVisibility(e) {
    var t, n;
    const r = this.elementInfos.reduce((c, d) => Math.max(c, d.visibilityChangedAt || 0), 0), s = !((n = (t = this.adaptiveStreamSettings) === null || t === void 0 ? void 0 : t.pauseVideoInBackground) !== null && n !== void 0) || n ? this.isInBackground : !1, a = this.elementInfos.some((c) => c.pictureInPicture), o = this.elementInfos.some((c) => c.visible) && !s || a;
    if (!(this.lastVisible === o && !e)) {
      if (!o && Date.now() - r < Sr) {
        Q.setTimeout(() => {
          this.updateVisibility();
        }, Sr);
        return;
      }
      this.lastVisible = o, this.emit(R.VisibilityChanged, o, this);
    }
  }
  updateDimensions() {
    var e, t;
    let n = 0, r = 0;
    const s = this.getPixelDensity();
    for (const a of this.elementInfos) {
      const o = a.width() * s, c = a.height() * s;
      o + c > n + r && (n = o, r = c);
    }
    ((e = this.lastDimensions) === null || e === void 0 ? void 0 : e.width) === n && ((t = this.lastDimensions) === null || t === void 0 ? void 0 : t.height) === r || (this.lastDimensions = {
      width: n,
      height: r
    }, this.emit(R.VideoDimensionsChanged, this.lastDimensions, this));
  }
  getPixelDensity() {
    var e;
    const t = (e = this.adaptiveStreamSettings) === null || e === void 0 ? void 0 : e.pixelDensity;
    return t === "screen" ? Ba() : t || (Ba() > 2 ? 2 : 1);
  }
}
class om {
  get visible() {
    return this.isPiP || this.isIntersecting;
  }
  get pictureInPicture() {
    return this.isPiP;
  }
  constructor(e, t) {
    this.onVisibilityChanged = (n) => {
      var r;
      const s = n.target, a = n.isIntersecting;
      s === this.element && (this.isIntersecting = a, this.isPiP = bn(this.element), this.visibilityChangedAt = Date.now(), (r = this.handleVisibilityChanged) === null || r === void 0 || r.call(this));
    }, this.onEnterPiP = () => {
      var n, r;
      (r = (n = window.documentPictureInPicture) === null || n === void 0 ? void 0 : n.window) === null || r === void 0 || r.addEventListener("pagehide", this.onLeavePiP), queueMicrotask(() => {
        requestAnimationFrame(() => {
          var s;
          this.isPiP = bn(this.element), (s = this.handleVisibilityChanged) === null || s === void 0 || s.call(this);
        });
      });
    }, this.onLeavePiP = () => {
      var n;
      this.isPiP = bn(this.element), (n = this.handleVisibilityChanged) === null || n === void 0 || n.call(this);
    }, this.element = e, this.isIntersecting = t ?? fs(e), this.isPiP = Re() && bn(e), this.visibilityChangedAt = 0;
  }
  width() {
    return this.element.clientWidth;
  }
  height() {
    return this.element.clientHeight;
  }
  observe() {
    var e, t, n;
    this.isIntersecting = fs(this.element), this.isPiP = bn(this.element), this.element.handleResize = () => {
      var r;
      (r = this.handleResize) === null || r === void 0 || r.call(this);
    }, this.element.handleVisibilityChanged = this.onVisibilityChanged, ja().observe(this.element), qa().observe(this.element), this.element.addEventListener("enterpictureinpicture", this.onEnterPiP), this.element.addEventListener("leavepictureinpicture", this.onLeavePiP), (e = window.documentPictureInPicture) === null || e === void 0 || e.addEventListener("enter", this.onEnterPiP), (n = (t = window.documentPictureInPicture) === null || t === void 0 ? void 0 : t.window) === null || n === void 0 || n.addEventListener("pagehide", this.onLeavePiP);
  }
  stopObserving() {
    var e, t, n, r, s;
    (e = ja()) === null || e === void 0 || e.unobserve(this.element), (t = qa()) === null || t === void 0 || t.unobserve(this.element), this.element.removeEventListener("enterpictureinpicture", this.onEnterPiP), this.element.removeEventListener("leavepictureinpicture", this.onLeavePiP), (n = window.documentPictureInPicture) === null || n === void 0 || n.removeEventListener("enter", this.onEnterPiP), (s = (r = window.documentPictureInPicture) === null || r === void 0 ? void 0 : r.window) === null || s === void 0 || s.removeEventListener("pagehide", this.onLeavePiP);
  }
}
function bn(i) {
  var e, t;
  return document.pictureInPictureElement === i ? !0 : !((e = window.documentPictureInPicture) === null || e === void 0) && e.window ? fs(i, (t = window.documentPictureInPicture) === null || t === void 0 ? void 0 : t.window) : !1;
}
function fs(i, e) {
  const t = e || window;
  let n = i.offsetTop, r = i.offsetLeft;
  const s = i.offsetWidth, a = i.offsetHeight, o = i, c = o.hidden, d = getComputedStyle(i), l = d.display;
  for (; i.offsetParent; )
    i = i.offsetParent, n += i.offsetTop, r += i.offsetLeft;
  return n < t.pageYOffset + t.innerHeight && r < t.pageXOffset + t.innerWidth && n + a > t.pageYOffset && r + s > t.pageXOffset && !c && l !== "none";
}
class Ut extends Ie.EventEmitter {
  get logContext() {
    var e, t;
    return {
      room: (e = this.room) === null || e === void 0 ? void 0 : e.name,
      participant: (t = this.room) === null || t === void 0 ? void 0 : t.localParticipant.identity
    };
  }
  constructor(e, t) {
    super(), this.decryptDataRequests = /* @__PURE__ */ new Map(), this.encryptDataRequests = /* @__PURE__ */ new Map(), this.log = he(te.E2EE, () => this.logContext), this.onWorkerMessage = (n) => {
      var r, s;
      const a = n.data, o = a.kind, c = a.data;
      switch (o) {
        case "error":
          if (c.uuid) {
            const u = this.decryptDataRequests.get(c.uuid);
            if (u != null && u.reject) {
              u.reject(c.error);
              break;
            }
            const h = this.encryptDataRequests.get(c.uuid);
            if (h != null && h.reject) {
              h.reject(c.error);
              break;
            }
          }
          this.log.error(c.error.message), this.emit(vt.EncryptionError, c.error, c.participantIdentity);
          break;
        case "initAck":
          c.enabled && this.keyProvider.getKeys().forEach((u) => {
            this.postKey(u, !1);
          });
          break;
        case "enable":
          if (c.enabled && this.keyProvider.getKeys().forEach((u) => {
            this.postKey(u, !1);
          }), this.encryptionEnabled !== c.enabled && c.participantIdentity === ((r = this.room) === null || r === void 0 ? void 0 : r.localParticipant.identity))
            this.emit(vt.ParticipantEncryptionStatusChanged, c.enabled, this.room.localParticipant), this.encryptionEnabled = c.enabled;
          else if (c.participantIdentity) {
            const u = (s = this.room) === null || s === void 0 ? void 0 : s.getParticipantByIdentity(c.participantIdentity);
            if (!u)
              throw TypeError("couldn't set encryption status, participant not found".concat(c.participantIdentity));
            this.emit(vt.ParticipantEncryptionStatusChanged, c.enabled, u);
          }
          break;
        case "ratchetKey":
          this.keyProvider.emit(Et.KeyRatcheted, c.ratchetResult, c.participantIdentity, c.keyIndex);
          break;
        case "decryptDataResponse":
          const d = this.decryptDataRequests.get(c.uuid);
          d != null && d.resolve && d.resolve(c);
          break;
        case "encryptDataResponse":
          const l = this.encryptDataRequests.get(c.uuid);
          l != null && l.resolve && l.resolve(c);
          break;
        case "packetTrailerMetadata":
          this.handleFrameMetadata(c.trackId, c.rtpTimestamp, c.ssrc, c.metadata);
          break;
        case "log":
          ln[c.level](c.msg, c.context);
          break;
      }
    }, this.onWorkerError = (n) => {
      this.log.error("e2ee worker encountered an error:", {
        error: n.error
      }), this.emit(vt.EncryptionError, n.error, void 0);
    }, this.keyProvider = e.keyProvider, this.worker = e.worker, this.encryptionEnabled = !1, this.dataChannelEncryptionEnabled = t;
  }
  get isEnabled() {
    return this.encryptionEnabled;
  }
  get isDataChannelEncryptionEnabled() {
    return this.isEnabled && this.dataChannelEncryptionEnabled;
  }
  /**
   * @internal
   */
  setup(e) {
    if (!$f())
      throw new Gi("tried to setup end-to-end encryption on an unsupported browser");
    if (this.log.info("setting up e2ee"), e !== this.room) {
      this.room = e, this.setupEventListeners(e, this.keyProvider);
      const t = {
        kind: "init",
        data: {
          keyProviderOptions: this.keyProvider.getOptions(),
          loglevel: ln.getLevel()
        }
      };
      this.worker && (this.log.info("initializing worker", {
        worker: this.worker
      }), this.worker.onmessage = this.onWorkerMessage, this.worker.onerror = this.onWorkerError, this.worker.postMessage(t), this.subscribeToLogLevelChanges());
    }
  }
  /**
   * Subscribe the current worker to main-thread `workerLogger` level changes,
   * without strongly retaining `this` or `this.worker` from the module-global
   * listener Set on the logger. See {@link disposeRegistry}.
   */
  subscribeToLogLevelChanges() {
    var e;
    (e = this.unsubscribeLogLevel) === null || e === void 0 || e.call(this);
    let t;
    if (Ut.disposeRegistry) {
      const n = new WeakRef(this.worker);
      t = wa((r) => {
        const s = n.deref();
        if (!s) {
          t == null || t();
          return;
        }
        s.postMessage({
          kind: "setLogLevel",
          data: {
            level: r
          }
        });
      }), Ut.disposeRegistry.register(this, t, this);
    } else {
      const n = this.worker;
      t = wa((r) => {
        n.postMessage({
          kind: "setLogLevel",
          data: {
            level: r
          }
        });
      });
    }
    this.unsubscribeLogLevel = t;
  }
  /**
   * @internal
   * Release the log-level subscription, reject any pending encrypt/decrypt
   * futures, and detach the worker message handlers. The worker itself is
   * caller-owned and is not terminated. Idempotent.
   */
  dispose() {
    var e, t, n;
    (e = this.unsubscribeLogLevel) === null || e === void 0 || e.call(this), this.unsubscribeLogLevel = void 0, Ut.disposeRegistry && Ut.disposeRegistry.unregister(this);
    const r = new rm("E2EEManager disposed", wi.InternalError);
    for (const s of [...this.encryptDataRequests.values()])
      (t = s.reject) === null || t === void 0 || t.call(s, r);
    for (const s of [...this.decryptDataRequests.values()])
      (n = s.reject) === null || n === void 0 || n.call(s, r);
    this.worker && (this.worker.onmessage = null, this.worker.onerror = null), this.removeAllListeners();
  }
  /**
   * @internal
   */
  setParticipantCryptorEnabled(e, t) {
    this.log.debug("set e2ee to ".concat(e, " for participant ").concat(t)), this.postEnable(e, t);
  }
  /**
   * @internal
   */
  setSifTrailer(e) {
    !e || e.length === 0 ? this.log.warn("ignoring server sent trailer as it's empty") : this.postSifTrailer(e);
  }
  handleFrameMetadata(e, t, n, r) {
    if (this.room) {
      for (const s of [this.room.localParticipant, ...this.room.remoteParticipants.values()])
        for (const a of s.trackPublications.values())
          if (a.track && a.track.mediaStreamID === e && a.track instanceof Js && a.track.frameMetadataExtractor) {
            a.track.frameMetadataExtractor.storeMetadata(t, n, r);
            return;
          }
    }
  }
  setupEngine(e) {
    e.on(P.RTPVideoMapUpdate, (t) => {
      this.postRTPMap(t);
    });
  }
  setupEventListeners(e, t) {
    e.on(_.TrackPublished, (n, r) => this.setParticipantCryptorEnabledForPublication(n, r.identity)), e.on(_.ConnectionStateChanged, (n) => {
      n === K.Connected && e.remoteParticipants.forEach((r) => {
        r.trackPublications.forEach((s) => {
          this.setParticipantCryptorEnabledForPublication(s, r.identity);
        });
      });
    }).on(_.TrackUnsubscribed, (n, r, s) => {
      var a;
      const o = {
        kind: "removeTransform",
        data: {
          participantIdentity: s.identity,
          trackId: n.mediaStreamID
        }
      };
      (a = this.worker) === null || a === void 0 || a.postMessage(o);
    }).on(_.TrackSubscribed, (n, r, s) => {
      this.setupE2EEReceiver(n, s.identity, r.trackInfo);
    }).on(_.SignalConnected, () => {
      if (!this.room)
        throw new TypeError("expected room to be present on signal connect");
      const n = t.getLatestManuallySetKeyIndex();
      t.getKeys().forEach((r) => {
        var s;
        this.postKey(r, n === ((s = r.keyIndex) !== null && s !== void 0 ? s : 0));
      }), this.setParticipantCryptorEnabled(this.room.localParticipant.isE2EEEnabled, this.room.localParticipant.identity);
    }), e.localParticipant.on(O.LocalSenderCreated, (n, r) => m(this, void 0, void 0, function* () {
      this.setupE2EESender(r, n);
    })), e.localParticipant.on(O.LocalTrackPublished, (n) => {
      if (!ht(n.track) || !Fn())
        return;
      const r = {
        kind: "updateCodec",
        data: {
          trackId: n.track.mediaStreamID,
          codec: wn(n.trackInfo.codecs[0].mimeType),
          participantIdentity: this.room.localParticipant.identity,
          hasPacketTrailer: !1
        }
      };
      this.worker.postMessage(r);
    }), t.on(Et.SetKey, (n, r) => this.postKey(n, r ?? !0)).on(Et.RatchetRequest, (n, r) => this.postRatchetRequest(n, r));
  }
  encryptData(e) {
    return m(this, void 0, void 0, function* () {
      if (!this.worker)
        throw Error("could not encrypt data, worker is missing");
      const t = crypto.randomUUID(), n = {
        kind: "encryptDataRequest",
        data: {
          uuid: t,
          payload: e,
          participantIdentity: this.room.localParticipant.identity
        }
      }, r = new ve();
      return r.onFinally = () => {
        this.encryptDataRequests.delete(t);
      }, this.encryptDataRequests.set(t, r), this.worker.postMessage(n), r.promise;
    });
  }
  handleEncryptedData(e, t, n, r) {
    if (!this.worker)
      throw Error("could not handle encrypted data, worker is missing");
    const s = crypto.randomUUID(), a = {
      kind: "decryptDataRequest",
      data: {
        uuid: s,
        payload: e,
        iv: t,
        participantIdentity: n,
        keyIndex: r
      }
    }, o = new ve();
    return o.onFinally = () => {
      this.decryptDataRequests.delete(s);
    }, this.decryptDataRequests.set(s, o), this.worker.postMessage(a), o.promise;
  }
  postRatchetRequest(e, t) {
    if (!this.worker)
      throw Error("could not ratchet key, worker is missing");
    const n = {
      kind: "ratchetRequest",
      data: {
        participantIdentity: e,
        keyIndex: t
      }
    };
    this.worker.postMessage(n);
  }
  postKey(e, t) {
    let n = e.key, r = e.participantIdentity, s = e.keyIndex;
    var a;
    if (!this.worker)
      throw Error("could not set key, worker is missing");
    const o = {
      kind: "setKey",
      data: {
        participantIdentity: r,
        isPublisher: r === ((a = this.room) === null || a === void 0 ? void 0 : a.localParticipant.identity),
        key: n,
        keyIndex: s,
        updateCurrentKeyIndex: t
      }
    };
    this.worker.postMessage(o);
  }
  postEnable(e, t) {
    if (this.worker) {
      const n = {
        kind: "enable",
        data: {
          enabled: e,
          participantIdentity: t
        }
      };
      this.worker.postMessage(n);
    } else
      throw new ReferenceError("failed to enable e2ee, worker is not ready");
  }
  postRTPMap(e) {
    var t;
    if (!this.worker)
      throw TypeError("could not post rtp map, worker is missing");
    if (!(!((t = this.room) === null || t === void 0) && t.localParticipant.identity))
      throw TypeError("could not post rtp map, local participant identity is missing");
    const n = {
      kind: "setRTPMap",
      data: {
        map: e,
        participantIdentity: this.room.localParticipant.identity
      }
    };
    this.worker.postMessage(n);
  }
  postSifTrailer(e) {
    if (!this.worker)
      throw Error("could not post SIF trailer, worker is missing");
    const t = {
      kind: "setSifTrailer",
      data: {
        trailer: e
      }
    };
    this.worker.postMessage(t);
  }
  /**
   * Derive the participant's encryption state from one of its publications.
   * Publications without trackInfo are skipped rather than thrown on: throwing
   * inside the forEach above would leave every remaining participant without an
   * encryption state, and a cryptor with unknown state can no longer decrypt.
   */
  setParticipantCryptorEnabledForPublication(e, t) {
    if (!e.trackInfo) {
      this.log.warn("skipping e2ee enabled update for publication without trackInfo", {
        trackSid: e.trackSid
      });
      return;
    }
    this.setParticipantCryptorEnabled(e.trackInfo.encryption !== G.NONE, t);
  }
  setupE2EEReceiver(e, t, n) {
    if (!e.receiver)
      return;
    if (!(n != null && n.mimeType) || n.mimeType === "")
      throw new TypeError("MimeType missing from trackInfo, cannot set up E2EE cryptor");
    const r = e.kind === "video" && !!n.packetTrailerFeatures && n.packetTrailerFeatures.length > 0;
    this.handleReceiver(e.receiver, e.mediaStreamID, t, e.kind === "video" ? wn(n.mimeType) : void 0, r);
  }
  setupE2EESender(e, t) {
    var n, r, s;
    if (!Ft(e) || !t) {
      t || this.log.warn("early return because sender is not ready");
      return;
    }
    this.handleSender(t, e.mediaStreamID, void 0, ht(e) ? (r = (n = e.publishOptions) === null || n === void 0 ? void 0 : n.frameMetadata) !== null && r !== void 0 ? r : (s = e.publishOptions) === null || s === void 0 ? void 0 : s.packetTrailer : void 0);
  }
  /**
   * Handles the given {@code RTCRtpReceiver} by creating a {@code TransformStream} which will inject
   * a frame decoder.
   *
   */
  handleReceiver(e, t, n, r, s) {
    return m(this, void 0, void 0, function* () {
      if (this.worker) {
        if (ls()) {
          const a = {
            kind: "decode",
            participantIdentity: n,
            trackId: t,
            codec: r,
            hasPacketTrailer: s
          };
          e.transform = new RTCRtpScriptTransform(this.worker, a);
        } else {
          if (Xn in e && Zn in e) {
            const d = {
              kind: "updateCodec",
              data: {
                trackId: t,
                previousTrackId: e[Zn],
                codec: r,
                participantIdentity: n,
                hasPacketTrailer: s
              }
            };
            this.worker.postMessage(d), e[Zn] = t;
            return;
          }
          let a = e.writableStream, o = e.readableStream;
          if (!a || !o) {
            const d = e.createEncodedStreams();
            e.writableStream = d.writable, a = d.writable, e.readableStream = d.readable, o = d.readable;
          }
          const c = {
            kind: "decode",
            data: {
              readableStream: o,
              writableStream: a,
              trackId: t,
              codec: r,
              participantIdentity: n,
              hasPacketTrailer: s
            }
          };
          this.worker.postMessage(c, [o, a]);
        }
        e[Xn] = !0, e[Zn] = t;
      }
    });
  }
  /**
   * Handles the given {@code RTCRtpSender} by creating a {@code TransformStream} which will inject
   * a frame encoder.
   *
   */
  handleSender(e, t, n, r) {
    var s;
    if (!(Xn in e || !this.worker)) {
      if (!(!((s = this.room) === null || s === void 0) && s.localParticipant.identity) || this.room.localParticipant.identity === "")
        throw TypeError("local identity needs to be known in order to set up encrypted sender");
      if (ls()) {
        this.log.info("initialize script transform");
        const a = {
          kind: "encode",
          participantIdentity: this.room.localParticipant.identity,
          trackId: t,
          codec: n,
          hasPacketTrailer: _i(r),
          packetTrailer: r
        };
        e.transform = new RTCRtpScriptTransform(this.worker, a);
      } else {
        this.log.info("initialize encoded streams");
        const a = e.createEncodedStreams(), o = {
          kind: "encode",
          data: {
            readableStream: a.readable,
            writableStream: a.writable,
            codec: n,
            trackId: t,
            participantIdentity: this.room.localParticipant.identity,
            hasPacketTrailer: _i(r),
            packetTrailer: r
          }
        };
        this.worker.postMessage(o, [a.readable, a.writable]);
      }
      e[Xn] = !0;
    }
  }
}
Ut.disposeRegistry = typeof FinalizationRegistry < "u" && typeof WeakRef < "u" && new FinalizationRegistry((i) => {
  i();
});
const cm = 300;
class dm {
  constructor() {
    this.metadataMap = /* @__PURE__ */ new Map(), this.activeSsrc = 0;
  }
  storeMetadata(e, t, n) {
    for (this.activeSsrc !== 0 && this.activeSsrc !== t && this.metadataMap.clear(), this.activeSsrc = t; this.metadataMap.size >= cm; ) {
      const r = this.metadataMap.keys().next().value;
      this.metadataMap.delete(r);
    }
    this.metadataMap.set(e, n);
  }
  lookupMetadata(e) {
    return this.metadataMap.get(e);
  }
  dispose() {
    this.metadataMap.clear(), this.activeSsrc = 0;
  }
}
class Nd {
  constructor(e) {
    this.extractors = /* @__PURE__ */ new Map(), this.workerPipelines = /* @__PURE__ */ new Map(), this.onWorkerMessage = (t) => {
      const n = t.data;
      if (n.kind === "metadata") {
        const r = this.extractors.get(n.data.trackId);
        r && r.storeMetadata(n.data.rtpTimestamp, n.data.ssrc, n.data.metadata);
      }
    }, this.onWorkerError = (t) => {
      q.error("frame metadata worker encountered an error:", {
        error: t.error
      });
    }, this.worker = e == null ? void 0 : e.worker;
  }
  /** @internal */
  setup(e) {
    e !== this.room && (this.room = e, this.worker && (this.worker.onmessage = this.onWorkerMessage, this.worker.onerror = this.onWorkerError, this.worker.postMessage({
      kind: "init"
    })), e.on(_.TrackSubscribed, (t, n, r) => {
      t.kind === "video" && this.setupReceiver(t, n.trackInfo);
    }).on(_.TrackUnsubscribed, (t) => {
      this.teardownTrack(t);
    }).on(_.Disconnected, () => {
      this.cleanup();
    }));
  }
  setupReceiver(e, t) {
    var n, r, s;
    const a = e.receiver;
    if (!a)
      return;
    if (!(!!(t != null && t.packetTrailerFeatures) && t.packetTrailerFeatures.length > 0)) {
      !((n = this.room) === null || n === void 0) && n.hasE2EESetup || this.setupPassthroughReceiver(a, e.mediaStreamID);
      return;
    }
    if (!jn(this.worker ? {
      worker: this.worker
    } : void 0) && !(!((r = this.room) === null || r === void 0) && r.hasE2EESetup)) {
      q.warn("frame metadata transform not supported; skipping extraction");
      return;
    }
    const c = new dm(), d = e.mediaStreamID;
    this.extractors.set(d, c), e.frameMetadataExtractor = c, !(!((s = this.room) === null || s === void 0) && s.hasE2EESetup) && this.setupWorkerReceiver(a, d, !0);
  }
  setupPassthroughReceiver(e, t) {
    if (qn()) {
      "transform" in e && (e.transform = null);
      return;
    }
    if (this.worker && jn({
      worker: this.worker
    }) && !this.workerPipelines.has(e)) {
      this.setupWorkerReceiver(e, t, !1);
      return;
    }
    this.worker && this.workerPipelines.has(e) && this.setupWorkerReceiver(e, t, !1);
  }
  setupWorkerReceiver(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0;
    const r = this.worker;
    if (!r)
      return;
    if (qn()) {
      e.transform = new RTCRtpScriptTransform(r, {
        kind: "decode",
        trackId: t
      });
      return;
    }
    const s = this.workerPipelines.get(e);
    if (s) {
      const c = {
        kind: "updateTrackId",
        data: {
          oldTrackId: s,
          newTrackId: t,
          hasPacketTrailer: n
        }
      };
      r.postMessage(c), this.workerPipelines.set(e, t);
      return;
    }
    if (!("createEncodedStreams" in e)) {
      q.warn("createEncodedStreams not supported");
      return;
    }
    let a;
    try {
      a = e.createEncodedStreams();
    } catch (c) {
      q.warn("failed to create encoded streams", {
        error: c
      });
      return;
    }
    const o = {
      kind: "decode",
      data: {
        readableStream: a.readable,
        writableStream: a.writable,
        trackId: t,
        hasPacketTrailer: n
      }
    };
    r.postMessage(o, [a.readable, a.writable]), this.workerPipelines.set(e, t);
  }
  teardownTrack(e) {
    const t = e.mediaStreamID, n = this.extractors.get(t);
    n && (n.dispose(), this.extractors.delete(t)), e instanceof Js && (e.frameMetadataExtractor = void 0);
  }
  cleanup() {
    var e;
    for (const t of this.extractors.values())
      t.dispose();
    this.extractors.clear(), this.workerPipelines.clear(), (e = this.worker) === null || e === void 0 || e.terminate();
  }
}
const vv = Nd, lm = 500, um = 15e3;
class rn {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {
    this.failedConnectionAttempts = /* @__PURE__ */ new Map(), this.backOffPromises = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    return this._instance || (this._instance = new rn()), this._instance;
  }
  addFailedConnectionAttempt(e) {
    var t;
    const n = new URL(e), r = gr(n);
    if (!r)
      return;
    let s = (t = this.failedConnectionAttempts.get(r)) !== null && t !== void 0 ? t : 0;
    this.failedConnectionAttempts.set(r, s + 1), this.backOffPromises.set(r, ke(Math.min(lm * Math.pow(2, s), um)));
  }
  getBackOffPromise(e) {
    const t = new URL(e), n = t && gr(t);
    return n && this.backOffPromises.get(n) || Promise.resolve();
  }
  resetFailedConnectionAttempts(e) {
    const t = new URL(e), n = t && gr(t);
    n && (this.failedConnectionAttempts.set(n, 0), this.backOffPromises.set(n, Promise.resolve()));
  }
  resetAll() {
    this.backOffPromises.clear(), this.failedConnectionAttempts.clear();
  }
}
rn._instance = null;
const Cr = "default";
class me {
  constructor() {
    this._previousDevices = [];
  }
  static getInstance() {
    return this.instance === void 0 && (this.instance = new me()), this.instance;
  }
  get previousDevices() {
    return this._previousDevices;
  }
  getDevices(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
      return (function* () {
        var s;
        if (((s = me.userMediaPromiseMap) === null || s === void 0 ? void 0 : s.size) > 0) {
          q.debug("awaiting getUserMedia promise");
          try {
            t ? yield me.userMediaPromiseMap.get(t) : yield Promise.all(me.userMediaPromiseMap.values());
          } catch {
            q.warn("error waiting for media permissons");
          }
        }
        let a = yield navigator.mediaDevices.enumerateDevices();
        if (r && // for safari we need to skip this check, as otherwise it will re-acquire user media and fail on iOS https://bugs.webkit.org/show_bug.cgi?id=179363
        !(Vt() && n.hasDeviceInUse(t)) && (a.filter((c) => c.kind === t).length === 0 || a.some((c) => {
          const d = c.label === "", l = t ? c.kind === t : !0;
          return d && l;
        }))) {
          const c = {
            video: t !== "audioinput" && t !== "audiooutput",
            audio: t !== "videoinput" && {
              deviceId: {
                ideal: "default"
              }
            }
          }, d = yield navigator.mediaDevices.getUserMedia(c);
          a = yield navigator.mediaDevices.enumerateDevices(), d.getTracks().forEach((l) => {
            l.stop();
          });
        }
        return n._previousDevices = a, t && (a = a.filter((o) => o.kind === t)), a;
      })();
    });
  }
  normalizeDeviceId(e, t, n) {
    return m(this, void 0, void 0, function* () {
      if (t !== Cr)
        return t;
      const r = yield this.getDevices(e), s = r.find((o) => o.deviceId === Cr);
      if (!s) {
        q.warn("could not reliably determine default device");
        return;
      }
      const a = r.find((o) => o.deviceId !== Cr && o.groupId === (n ?? s.groupId));
      if (!a) {
        q.warn("could not reliably determine default device");
        return;
      }
      return a == null ? void 0 : a.deviceId;
    });
  }
  hasDeviceInUse(e) {
    return e ? me.userMediaPromiseMap.has(e) : me.userMediaPromiseMap.size > 0;
  }
}
me.mediaDeviceKinds = ["audioinput", "audiooutput", "videoinput"];
me.userMediaPromiseMap = /* @__PURE__ */ new Map();
const Qs = 65535, Ud = 4294967295;
class Ke {
  static u16(e) {
    return new Ke(e, Qs);
  }
  static u32(e) {
    return new Ke(e, Ud);
  }
  constructor(e, t) {
    if (this.value = e, e < 0)
      throw new Error("WrapAroundUnsignedInt: cannot faithfully represent an integer smaller than 0");
    if (t > Number.MAX_SAFE_INTEGER)
      throw new Error("WrapAroundUnsignedInt: cannot faithfully represent an integer bigger than MAX_SAFE_INTEGER.");
    this.maxSize = t, this.clamp();
  }
  /** Manually clamp the given containing value according to the wrap around max size bounds. Use
   * this after out of bounds modification to the contained value by external code. */
  clamp() {
    for (; this.value > this.maxSize; )
      this.value -= this.maxSize + 1;
    for (; this.value < 0; )
      this.value += this.maxSize + 1;
  }
  clone() {
    return new Ke(this.value, this.maxSize);
  }
  /** When called, maps the containing value to a new containing value. After mapping, the wrap
   * around external max size bounds are applied. Note that this is a mutative operation. */
  update(e) {
    this.value = e(this.value), this.clamp();
  }
  /** Increments the given `n` to the inner value. Note that this is a mutative operation. */
  increment() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
    this.update((t) => t + e);
  }
  /** Decrements the given `n` from the inner value. Note that this is a mutative operation. */
  decrement() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
    this.update((t) => t - e);
  }
  getThenIncrement() {
    const e = this.value;
    return this.increment(), new Ke(e, this.maxSize);
  }
  /** Returns true if {@link this} is before the passed other {@link WrapAroundUnsignedInt}. */
  isBefore(e) {
    const t = this.value >>> 0, r = (e.value >>> 0) - t >>> 0;
    return r !== 0 && r < this.maxSize + 1;
  }
}
class sn {
  static fromRtpTicks(e) {
    return new sn(e, 9e4);
  }
  /** Generates a timestamp initialized to a non cryptographically secure random value, so that
   * different streams are more difficult to correlate in packet capture. */
  static rtpRandom() {
    const e = Math.round(Math.random() * Ud);
    return sn.fromRtpTicks(e);
  }
  constructor(e, t) {
    this.timestamp = Ke.u32(e), this.rateInHz = t;
  }
  asTicks() {
    return this.timestamp.value;
  }
  clone() {
    return new sn(this.timestamp.value, this.rateInHz);
  }
  wrappingAdd(e) {
    this.timestamp.increment(e);
  }
  /** Returns true if {@link this} is before the passed other {@link DataTrackTimestamp}. */
  isBefore(e) {
    return this.timestamp.isBefore(e.timestamp);
  }
}
class At {
  constructor(e, t, n) {
    this.epoch = t, this.base = n, this.previous = n.clone(), this.rateInHz = e;
  }
  static startingNow(e, t) {
    return new At(t, /* @__PURE__ */ new Date(), e);
  }
  static startingAtTime(e, t, n) {
    return new At(n, e, t);
  }
  static rtpStartingNow(e) {
    return At.startingNow(e, 9e4);
  }
  static rtpStartingAtTime(e, t) {
    return At.startingAtTime(e, t, 9e4);
  }
  now() {
    return this.at(/* @__PURE__ */ new Date());
  }
  at(e) {
    let t = e.getTime() - this.epoch.getTime(), n = At.durationInMsToTicks(t, this.rateInHz), r = this.base.clone();
    return r.wrappingAdd(n), r.isBefore(this.previous) && (r = this.previous), this.previous = r.clone(), r.clone();
  }
  /** Convert a duration since the epoch into clock ticks. */
  static durationInMsToTicks(e, t) {
    let r = (e * 1e6 * t + 5e8) / 1e9;
    return Math.round(r);
  }
}
function Ys(i) {
  if (i instanceof DataView)
    return i;
  if (i instanceof ArrayBuffer)
    return new DataView(i);
  if (i instanceof Uint8Array)
    return new DataView(i.buffer, i.byteOffset, i.byteLength);
  throw new Error("Error coercing ".concat(i, " to DataView - input was not DataView, ArrayBuffer, or Uint8Array."));
}
var Bt;
(function(i) {
  i[i.Reserved = 0] = "Reserved", i[i.TooLarge = 1] = "TooLarge";
})(Bt || (Bt = {}));
class hn extends Ue {
  constructor(e, t) {
    super(19, e), this.name = "DataTrackHandleError", this.reason = t, this.reasonName = Bt[t];
  }
  isReason(e) {
    return this.reason === e;
  }
  static tooLarge() {
    return new hn("Value too large to be a valid track handle", Bt.TooLarge);
  }
  static reserved(e) {
    return new hn("0x".concat(e.toString(16), " is a reserved value."), Bt.Reserved);
  }
}
const hm = {
  fromNumber(i) {
    if (i === 0)
      throw hn.reserved(i);
    if (i > Qs)
      throw hn.tooLarge();
    return i;
  }
};
class fm {
  constructor() {
    this.value = 0;
  }
  /** Returns a unique track handle for the next publication, if one can be obtained. */
  get() {
    return this.value += 1, this.value > Qs ? null : this.value;
  }
  reset() {
    this.value = 0;
  }
}
const Pi = {
  from(i) {
    return {
      sid: i.sid,
      pubHandle: i.pubHandle,
      name: i.name,
      usesE2ee: i.encryption !== G.NONE
    };
  },
  toProtobuf(i) {
    return new xi({
      sid: i.sid,
      pubHandle: i.pubHandle,
      name: i.name,
      encryption: i.usesE2ee ? G.GCM : G.NONE
    });
  }
};
var _n;
(function(i) {
  i[i.WAITING = 0] = "WAITING", i[i.RUNNING = 1] = "RUNNING", i[i.COMPLETED = 2] = "COMPLETED";
})(_n || (_n = {}));
class mm {
  constructor() {
    this.pendingTasks = /* @__PURE__ */ new Map(), this.taskMutex = new ue(), this.nextTaskIndex = 0;
  }
  run(e) {
    return m(this, void 0, void 0, function* () {
      const t = {
        id: this.nextTaskIndex++,
        enqueuedAt: Date.now(),
        status: _n.WAITING
      };
      this.pendingTasks.set(t.id, t);
      const n = yield this.taskMutex.lock();
      try {
        return t.executedAt = Date.now(), t.status = _n.RUNNING, yield e();
      } finally {
        t.status = _n.COMPLETED, this.pendingTasks.delete(t.id), n();
      }
    });
  }
  flush() {
    return m(this, void 0, void 0, function* () {
      return this.run(() => m(this, void 0, void 0, function* () {
      }));
    });
  }
  snapshot() {
    return Array.from(this.pendingTasks.values());
  }
}
const pm = ["client"];
var Fd = class {
  constructor() {
    N(this, "listeners", /* @__PURE__ */ new Map());
  }
  on(e, t) {
    let n = this.listeners.get(e);
    return n || (n = /* @__PURE__ */ new Set(), this.listeners.set(e, n)), n.add(t), {
      off: () => {
        n.delete(t);
      }
    };
  }
  /**
  * Emit a named event, notifying wildcard listeners first, then named listeners.
  *
  * Wildcard listeners receive `(eventName, data)`; named listeners receive
  * only `data`. The firing order (wildcards before named) is intentional —
  * it lets relay listeners (like Fsm's bfsm proxy) observe all events
  * before specific subscribers react.
  */
  emit(e, t) {
    const n = this.listeners.get("*");
    if (n) for (const s of n) s(e, t);
    const r = this.listeners.get(e);
    if (r) for (const s of r) s(t);
  }
  /**
  * Remove all listeners (named and wildcard).
  *
  * Existing `Subscription` objects remain valid — their `off()` closures
  * hold a reference to the now-empty Set, so calling them is harmless.
  * Called by `dispose()` to prevent memory retention after an FSM shuts down.
  */
  clear() {
    this.listeners.clear();
  }
}, an = class extends Error {
  constructor(i, e) {
    super("non-serializable value at ".concat(i, " (").concat(e, ")")), this.path = i, this.label = e;
  }
};
const gm = (i, e) => ms(i, e, /* @__PURE__ */ new Set()), ms = (i, e, t) => {
  if (i === null) return null;
  switch (typeof i) {
    case "string":
    case "boolean":
      return i;
    case "number":
      if (!Number.isFinite(i)) throw new an(e, bm(i));
      return i;
    case "object":
      return vm(i, e, t);
    default:
      throw new an(e, typeof i);
  }
}, vm = (i, e, t) => {
  var n, r;
  if (t.has(i)) throw new an(e, "circular reference");
  if (Array.isArray(i)) {
    if (i.length !== Object.keys(i).length) throw new an(e, "sparse array or array with non-index properties");
    t.add(i);
    const o = i.map((c, d) => ms(c, "".concat(e, "[").concat(d, "]"), t));
    return t.delete(i), o;
  }
  const s = Object.getPrototypeOf(i);
  if (s !== Object.prototype && s !== null) throw new an(e, (n = (r = i.constructor) === null || r === void 0 ? void 0 : r.name) !== null && n !== void 0 ? n : "object");
  t.add(i);
  const a = {};
  for (const o of Object.keys(i)) {
    const c = ms(i[o], "".concat(e, ".").concat(o), t);
    Object.defineProperty(a, o, {
      value: c,
      enumerable: !0,
      writable: !0,
      configurable: !0
    });
  }
  return t.delete(i), a;
}, bm = (i) => Number.isNaN(i) ? "NaN" : i > 0 ? "Infinity" : "-Infinity", ps = function(i) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : /* @__PURE__ */ new Set();
  if (i === null || typeof i != "object" || e.has(i)) return i;
  if (Array.isArray(i)) {
    e.add(i);
    const r = i.map((s) => ps(s, e));
    return e.delete(i), r;
  }
  const t = Object.getPrototypeOf(i);
  if (t !== Object.prototype && t !== null) return i;
  e.add(i);
  const n = {};
  for (const r of Object.keys(i)) {
    const s = ps(i[r], e);
    Object.defineProperty(n, r, {
      value: s,
      enumerable: !0,
      writable: !0,
      configurable: !0
    });
  }
  return e.delete(i), n;
}, Pn = Symbol("machina.type"), Ja = 20;
var ym = class {
  constructor(e) {
    N(this, "id", void 0), N(this, "initialState", void 0), N(this, Pn, "BehavioralFsm"), N(this, "states", void 0), N(this, "emitter", new Fd()), N(this, "clients", /* @__PURE__ */ new WeakMap()), N(this, "knownClients", /* @__PURE__ */ new Set()), N(this, "childSubscriptions", []), N(this, "disposed", !1), N(this, "transitionDepth", 0), this.id = e.id, this.initialState = e.initialState, this.states = e.states, this.wrapChildLinks(), this.setupChildSubscriptions();
  }
  /**
  * Dispatch an input to the given client's current state handler.
  *
  * Delegation order: if the current state has a `_child` FSM that can
  * handle the input, it is dispatched there. If the child emits `nohandler`,
  * the input bubbles up to this FSM's local handler. If no handler exists
  * here either, `nohandler` is emitted on this FSM's emitter.
  *
  * No-ops silently when disposed.
  */
  handle(e, t) {
    var n;
    if (this.disposed) return;
    const r = this.getOrCreateClientMeta(e);
    for (var s = arguments.length, a = new Array(s > 2 ? s - 2 : 0), o = 2; o < s; o++)
      a[o - 2] = arguments[o];
    r.currentActionArgs = a;
    const c = (n = this.states[r.state]) === null || n === void 0 ? void 0 : n._child;
    if (c && c.canHandle(e, t)) {
      try {
        c.handle(e, t, ...a);
      } finally {
        r.currentActionArgs = void 0;
      }
      return;
    }
    this.handleLocally(e, t, a, r);
  }
  /**
  * Returns true if the client's current state has a handler for `inputName`
  * (or a catch-all `"*"` handler), or if the current state's `_child` chain
  * can handle it — the check recurses to the same depth `handle()`'s
  * delegation can actually reach, so a grandchild-only input answers true
  * from the root. Does NOT initialize the client — no `_onEnter`, no
  * events, no side effects. Unseen clients are treated as if they were
  * already in `initialState`. Returns false when disposed.
  */
  canHandle(e, t) {
    var n, r, s;
    if (this.disposed) return !1;
    const a = (n = (r = this.clients.get(e)) === null || r === void 0 ? void 0 : r.state) !== null && n !== void 0 ? n : this.initialState, o = this.states[a];
    if ((s = o == null ? void 0 : o[t]) !== null && s !== void 0 ? s : o != null && o["*"]) return !0;
    const c = o == null ? void 0 : o._child;
    return c ? c.canHandle(e, t) : !1;
  }
  /**
  * Transition the client back to `initialState`, firing `_onEnter` and
  * lifecycle events as if entering it fresh. No-ops when disposed.
  */
  reset(e) {
    this.disposed || this.transition(e, this.initialState);
  }
  /**
  * Returns the client's current state, or `undefined` if the client has
  * never been initialized (i.e. `handle()`, `transition()`, or `reset()`
  * have never been called for it). Does NOT trigger initialization.
  */
  currentState(e) {
    var t;
    return (t = this.clients.get(e)) === null || t === void 0 ? void 0 : t.state;
  }
  /**
  * Directly transition `client` to `toState`, running the full lifecycle:
  * `_onExit` for the current state → `transitioning` event → update state →
  * `_onEnter` for new state → `transitioned` event → child reset → deferred
  * queue replay → bounce (if `_onEnter` returned a state name).
  *
  * Same-state transitions are silently ignored. Transitions to unknown state
  * names emit `invalidstate` instead of throwing. Throws if the transition
  * depth exceeds `MAX_TRANSITION_DEPTH` (likely an `_onEnter` → transition loop).
  *
  * No-ops when disposed.
  */
  transition(e, t) {
    if (this.disposed) return;
    const n = this.getOrCreateClientMeta(e), r = n.state;
    if (t !== r) {
      if (!Object.hasOwn(this.states, t)) {
        this.emitter.emit("invalidstate", {
          stateName: t,
          client: e
        });
        return;
      }
      if (this.transitionDepth++, this.transitionDepth > Ja)
        throw this.transitionDepth = 0, new Error("Max transition depth (".concat(Ja, ') exceeded in FSM "').concat(this.id, '". Likely an infinite _onEnter → transition loop.'));
      try {
        const s = this.states[r], a = this.states[t];
        if (s != null && s._onExit && typeof s._onExit == "function") {
          const l = this.buildHandlerArgs(e, "", n);
          s._onExit(l);
        }
        n.state = t;
        const o = {
          fromState: r,
          toState: t,
          client: e
        };
        this.emitter.emit("transitioning", o);
        let c;
        if (a != null && a._onEnter && typeof a._onEnter == "function") {
          const l = this.buildHandlerArgs(e, "", n);
          c = a._onEnter(l);
        }
        this.emitter.emit("transitioned", o);
        const d = a == null ? void 0 : a._child;
        d && d.reset(e), this.processQueue(e, n), typeof c == "string" && n.state === t && this.transition(e, c);
      } finally {
        this.transitionDepth--;
      }
    }
  }
  /**
  * Returns the client's state as a dot-delimited path including any active
  * child FSM states (e.g. `"active.connecting.retrying"`). Returns just the
  * current state name when no child is active. Returns `""` for clients that
  * have never been initialized (unlike `currentState()` which returns `undefined`).
  */
  compositeState(e) {
    var t;
    const n = this.clients.get(e);
    if (!n) return "";
    const r = (t = this.states[n.state]) === null || t === void 0 ? void 0 : t._child;
    if (r) {
      const s = r.compositeState(e);
      if (s) return "".concat(n.state, ".").concat(s);
    }
    return n.state;
  }
  rehydrate(e, t) {
    if (this.disposed) return;
    if (typeof t == "string") {
      this.rehydrateCompositePath(e, t);
      return;
    }
    const n = this.planSnapshotWrites(e, t);
    for (const r of n) r();
  }
  /**
  * Snapshot everything machina tracks for `client`: current state, pending
  * deferred inputs, and — recursively — the same for every `_child` that has
  * ever seen this client, active or not. Feed the result to the object form
  * of `rehydrate()` to restore it later, deferrals included.
  *
  * Returns `undefined` for a client this FSM has never seen (mirrors
  * `currentState()`) — the call does NOT trigger initialization.
  *
  * Throws if any deferred input's args contain a non-serializable value
  * (function, undefined, symbol, bigint, non-finite number, Date/Map/class
  * instance, or a circular reference) — naming the input, its `until` target
  * if any, the FSM id, and the exact value path. Throws for an Fsm child
  * that's on `client`'s active path *relative to the true root* (consistent
  * with `rehydrate()`'s conditional throw) — an Fsm owns its own context, so
  * there's nothing per-client to snapshot. An Fsm child declared at a state
  * `client` never visited, OR nested under a `BehavioralFsm` child that is
  * itself off-path from the root, is skipped rather than throwing — neither
  * has any per-client state to lose, so one Fsm child anywhere in the
  * hierarchy doesn't disable `dehydrate()` for clients that never reach that
  * branch, no matter how deeply nested the Fsm child is.
  *
  * Meant for clients at rest between `handle()` calls — `currentActionArgs`
  * (the in-flight args mid-handler) has no meaning here and is excluded.
  *
  * @param isOnActivePath - @internal Whether this FSM itself is currently
  * reachable from the true root's active path. Defaults to `true` for the
  * public entry point (this FSM IS the root from its own perspective); the
  * `ChildLink` adapter passes `false` down when recursing into a nested
  * `BehavioralFsm` child that is itself off-path, so that child's own
  * Fsm-child checks don't recompute reachability from its dormant local
  * state alone.
  */
  dehydrate(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
    const n = this.clients.get(e);
    if (!n) return;
    const r = {
      state: n.state,
      deferred: n.deferredQueue.map((a) => this.snapshotDeferredInput(a))
    }, s = this.collectChildSnapshots(e, n.state, t);
    return s && (r.children = s), r;
  }
  /**
  * @internal
  * Validates `snapshot` against this level's state graph and recurses into
  * every declared child, returning write thunks to run only once the WHOLE
  * tree — every level — validates successfully. Nothing is written here.
  * Called by the object-form of `rehydrate()` and, recursively, by ChildLink
  * so a nested BehavioralFsm participates in the same validate-then-write
  * pass. Not part of the public persistence API — call `rehydrate()` instead.
  */
  planSnapshotWrites(e, t) {
    if (this.disposed) return [];
    const n = t.state, r = t.deferred, s = t.children;
    if (!Object.hasOwn(this.states, n)) throw new Error('rehydrate: unknown state "'.concat(n, '" in FSM "').concat(this.id, '". Valid states: ').concat(Object.keys(this.states).join(", ")));
    const a = [];
    if (s) for (const d of Object.keys(s)) {
      var o;
      if (!Object.hasOwn(this.states, d)) throw new Error('rehydrate: unknown state "'.concat(d, '" in FSM "').concat(this.id, '" referenced by snapshot.children.'));
      const l = (o = this.states[d]) === null || o === void 0 ? void 0 : o._child;
      if (!l) throw new Error('rehydrate: state "'.concat(d, '" in FSM "').concat(this.id, '" has no _child, but the snapshot has a children["').concat(d, '"] entry.'));
      a.push(...l.planRehydrate(e, s[d]));
    }
    const c = r.map((d) => Fl({
      inputName: d.inputName,
      args: ps(d.args)
    }, d.untilState !== void 0 ? {
      untilState: d.untilState
    } : {}));
    return a.push(() => {
      this.clients.has(e) || this.knownClients.add(new WeakRef(e)), this.clients.set(e, {
        state: n,
        deferredQueue: c
      });
    }), a;
  }
  rehydrateCompositePath(e, t) {
    const n = t.split("."), r = jl(n), s = r[0], a = jr(r).slice(1);
    if (!Object.hasOwn(this.states, s)) throw new Error('rehydrate: unknown state "'.concat(s, '" in FSM "').concat(this.id, '". Valid states: ').concat(Object.keys(this.states).join(", ")));
    if (a.length > 0) {
      var o;
      const c = a.join("."), d = (o = this.states[s]) === null || o === void 0 ? void 0 : o._child;
      if (!d) throw new Error('rehydrate: state "'.concat(s, '" in FSM "').concat(this.id, '" has no _child, but composite path "').concat(t, '" requires one.'));
      d.rehydrate(e, c);
    }
    this.clients.has(e) || this.knownClients.add(new WeakRef(e)), this.clients.set(e, {
      state: s,
      deferredQueue: []
    });
  }
  /**
  * Walks every declared state's `_child`, dehydrating each one that has ever
  * seen `client`. The same child instance can be declared under multiple
  * state names (shared child) — it's dehydrated once and the result is
  * reused under every declaring state name, matching how the engine already
  * treats shared children elsewhere (dispose, event subscriptions).
  *
  * Declaring names are grouped by `childLink.instance` (the actual FSM
  * instance, not the `ChildLink` wrapper — `wrapChildLinks()` mints a fresh
  * wrapper per declaring state, so grouping by wrapper would never hit for a
  * shared child) BEFORE any `onPath` is computed or any child is dehydrated.
  * A shared child's `onPath` is the OR of `stateName === activeState` across
  * every declaring name in its group: at most one declaring name can ever
  * equal `activeState`, so this combined flag is correct and, critically,
  * independent of `Object.keys(this.states)` iteration order — computing
  * `onPath` per-declaring-name and caching whichever one happened to run
  * first would silently launder an on-path client's Fsm-child throw through
  * an unrelated off-path declaring name.
  *
  * An off-path Fsm child (declared only at states other than `activeState`,
  * OR nested anywhere under a `BehavioralFsm` child that is itself off-path
  * relative to the true root) is skipped entirely rather than dehydrated:
  * Fsm state isn't tracked per-client to begin with, so an off-path Fsm
  * child has nothing to lose by being skipped — unlike a BehavioralFsm
  * child's off-path meta, which is real per-client data. `isOnActivePath`
  * is the inherited "am I even reachable from the root" flag; combining it
  * with the group's `stateNames.includes(activeState)` check (rather than
  * using that check alone) is what keeps a nested Fsm grandchild from
  * throwing when its immediate BehavioralFsm parent is itself off-path —
  * the parent's own dormant `activeState` is irrelevant once the parent
  * isn't reachable. This keeps one Fsm child anywhere in the hierarchy from
  * disabling `dehydrate()` for every client, only for clients actually on
  * that branch.
  */
  collectChildSnapshots(e, t, n) {
    const r = /* @__PURE__ */ new Map();
    for (const o of Object.keys(this.states)) {
      var s;
      const c = (s = this.states[o]) === null || s === void 0 ? void 0 : s._child;
      if (!c) continue;
      const d = r.get(c.instance);
      d ? d.stateNames.push(o) : r.set(c.instance, {
        childLink: c,
        stateNames: [o]
      });
    }
    let a;
    for (const o of r.values()) {
      const c = o.childLink, d = o.stateNames, l = n && d.includes(t);
      if (c.instance[Pn] === "Fsm" && !l) continue;
      const u = c.dehydrate(e, l);
      if (u) {
        a ?? (a = {});
        for (const h of d) a[h] = u;
      }
    }
    return a;
  }
  snapshotDeferredInput(e) {
    let t;
    try {
      t = gm(e.args, "args");
    } catch (r) {
      if (!(r instanceof an)) throw r;
      const s = e.untilState ? ' (until "'.concat(e.untilState, '")') : "";
      throw new Error('dehydrate: deferred input "'.concat(e.inputName, '"').concat(s, ' in FSM "').concat(this.id, '" has a non-serializable value at ').concat(r.path, " (").concat(r.label, ")"));
    }
    const n = {
      inputName: e.inputName,
      args: t
    };
    return e.untilState !== void 0 && (n.untilState = e.untilState), n;
  }
  on(e, t) {
    return this.disposed ? {
      off() {
      }
    } : this.emitter.on(e, t);
  }
  /**
  * Emit a custom event through the FSM. Built-in lifecycle events are
  * emitted automatically — this is for user-defined events from handlers.
  * No-ops when disposed.
  */
  emit(e, t) {
    this.disposed || this.emitter.emit(e, t);
  }
  /**
  * Permanently shut down this FSM. Irreversible — all subsequent method
  * calls become silent no-ops. Tears down child subscriptions, clears all
  * listeners, and cascades disposal to child FSMs (unless `preserveChildren`
  * is set). The same child appearing in multiple states is disposed once.
  */
  dispose(e) {
    this.disposed = !0;
    for (const n of this.childSubscriptions) n.off();
    if (!(e != null && e.preserveChildren)) {
      const n = /* @__PURE__ */ new Set();
      for (const r of Object.keys(this.states)) {
        var t;
        const s = (t = this.states[r]) === null || t === void 0 ? void 0 : t._child;
        s && !n.has(s.instance) && (n.add(s.instance), s.dispose());
      }
    }
    this.emitter.clear();
  }
  /**
  * Walks all states at construction time, detects raw FSM instances assigned
  * to _child, and wraps them into ChildLink adapters via createChildLink().
  * Must run BEFORE setupChildSubscriptions() so the subscriptions see
  * ChildLink objects, not raw FSM instances.
  */
  wrapChildLinks() {
    for (const e of Object.keys(this.states)) {
      const t = this.states[e], n = t == null ? void 0 : t._child;
      if (n) {
        if (typeof n != "object") throw new Error('State "'.concat(e, '"._child: expected an Fsm or BehavioralFsm instance, got ').concat(String(n)));
        if (!(Pn in n)) throw new Error('State "'.concat(e, '"._child: expected an Fsm or BehavioralFsm instance, got a plain object'));
        t._child = km(n);
      }
    }
  }
  /**
  * Walks all states at construction time, finds states with _child, and
  * subscribes once to each unique child's wildcard events. Subscriptions are
  * stored for cleanup in dispose(). We deduplicate by `childLink.instance`
  * (the underlying Fsm/BehavioralFsm instance), not the `ChildLink` wrapper —
  * `wrapChildLinks()` mints a fresh wrapper per declaring state, so a child
  * shared across states would otherwise get one subscription PER declaring
  * state, each independently walking known clients and relaying events. That
  * silently double-fires client-less relays (Fsm-child events, or a
  * BehavioralFsm child's custom `emit()` with no `client` in the payload)
  * whenever two different clients are active on two different declaring
  * names at once — the same wrapper-vs-instance identity bug
  * `collectChildSnapshots()` had before its #184 fix.
  */
  setupChildSubscriptions() {
    const e = /* @__PURE__ */ new Set();
    for (const n of Object.keys(this.states)) {
      var t;
      const r = (t = this.states[n]) === null || t === void 0 ? void 0 : t._child;
      if (!r || e.has(r.instance)) continue;
      e.add(r.instance);
      const s = r.onAny((a, o) => {
        if (a === "nohandler") {
          var c;
          const u = o;
          if (u.client !== void 0) this.bubbleNohandler(u.client, r, u.inputName, (c = u.args) !== null && c !== void 0 ? c : []);
          else for (const h of this.knownClients) {
            var d;
            const f = h.deref();
            if (f === void 0) {
              this.knownClients.delete(h);
              continue;
            }
            this.bubbleNohandler(f, r, u.inputName, (d = u.args) !== null && d !== void 0 ? d : []);
          }
          return;
        }
        const l = o;
        if (l && typeof l == "object" && "client" in l)
          this.isChildActiveForClient(l.client, r) && this.emitter.emit(a, o);
        else for (const u of this.knownClients) {
          const h = u.deref();
          if (!h) {
            this.knownClients.delete(u);
            continue;
          }
          if (this.isChildActiveForClient(h, r)) {
            this.emitter.emit(a, o);
            break;
          }
        }
      });
      this.childSubscriptions.push(s);
    }
  }
  /**
  * Bubbles a child nohandler to the parent for the given client.
  * Only fires if the client is currently in a state that has this childLink.
  * Extracted from the lambda in setupChildSubscriptions to keep it readable.
  */
  bubbleNohandler(e, t, n, r) {
    if (!this.isChildActiveForClient(e, t)) return;
    const s = this.clients.get(e);
    s.currentActionArgs = r, this.handleLocally(e, n, r, s);
  }
  /**
  * Returns true if the given client is currently in a parent state whose
  * _child resolves to the same underlying instance as childLink. Returns
  * false if the client has no meta (never initialized) or is in a state
  * with a different (or no) child.
  *
  * Compares `.instance`, not the `ChildLink` wrapper itself — setupChildSubscriptions()
  * dedupes subscriptions by instance and keeps only ONE representative wrapper
  * per shared child, so the client's actual active declaring state may hold a
  * DIFFERENT wrapper for that same instance (wrapChildLinks() mints one per
  * declaring state). Comparing wrappers directly would only ever match the one
  * declaring state whose wrapper happened to be kept for the subscription,
  * silently breaking relay for every other declaring name of a shared child.
  */
  isChildActiveForClient(e, t) {
    var n;
    const r = this.clients.get(e);
    return r ? ((n = this.states[r.state]) === null || n === void 0 || (n = n._child) === null || n === void 0 ? void 0 : n.instance) === t.instance : !1;
  }
  /**
  * The inner handler dispatch — no delegation, no initialization side effects
  * beyond what getOrCreateClientMeta already did. Called by handle() after
  * the delegation check, and by the nohandler child listener for bubbling.
  */
  handleLocally(e, t, n, r) {
    var s;
    const a = this.states[r.state], o = (s = a == null ? void 0 : a[t]) !== null && s !== void 0 ? s : a == null ? void 0 : a["*"];
    if (!o) {
      this.emitter.emit("nohandler", {
        inputName: t,
        args: n,
        client: e
      }), r.currentActionArgs = void 0;
      return;
    }
    try {
      this.emitter.emit("handling", {
        inputName: t,
        client: e
      });
      const c = this.buildHandlerArgs(e, t, r);
      let d;
      typeof o == "string" ? d = o : typeof o == "function" && (d = o(c, ...n)), this.emitter.emit("handled", {
        inputName: t,
        client: e
      }), typeof d == "string" && this.transition(e, d);
    } finally {
      r.currentActionArgs = void 0;
    }
  }
  getOrCreateClientMeta(e) {
    let t = this.clients.get(e);
    return t || (t = {
      state: void 0,
      deferredQueue: []
    }, this.clients.set(e, t), this.knownClients.add(new WeakRef(e)), this.transition(e, this.initialState), t);
  }
  buildHandlerArgs(e, t, n) {
    return {
      ctx: e,
      inputName: t,
      defer: (r) => {
        if (!n.currentActionArgs) return;
        const s = {
          inputName: t,
          args: [...n.currentActionArgs],
          untilState: r == null ? void 0 : r.until
        };
        n.deferredQueue.push(s), this.emitter.emit("deferred", {
          inputName: t,
          client: e
        });
      },
      emit: (r, s) => {
        this.emitter.emit(r, s);
      }
    };
  }
  processQueue(e, t) {
    const n = [], r = [];
    for (const s of t.deferredQueue) s.untilState === void 0 || s.untilState === t.state ? n.push(s) : r.push(s);
    t.deferredQueue = r;
    for (const s of n) this.handle(e, s.inputName, ...s.args);
  }
};
function km(i) {
  if (!i || typeof i != "object") throw new Error("createChildLink: expected an Fsm or BehavioralFsm instance, got ".concat(String(i)));
  const e = i[Pn];
  if (e === "BehavioralFsm") return {
    instance: i,
    canHandle(t, n) {
      return i.canHandle(t, n);
    },
    handle(t, n) {
      for (var r = arguments.length, s = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
        s[a - 2] = arguments[a];
      i.handle(t, n, ...s);
    },
    reset(t) {
      i.transition(t, i.initialState);
    },
    onAny(t) {
      return i.on("*", t);
    },
    compositeState(t) {
      return i.compositeState(t);
    },
    rehydrate(t, n) {
      i.rehydrate(t, n);
    },
    dehydrate(t, n) {
      return i.dehydrate(t, n);
    },
    planRehydrate(t, n) {
      return i.planSnapshotWrites(t, n);
    },
    dispose() {
      i.dispose();
    }
  };
  if (e === "Fsm") return {
    instance: i,
    canHandle(t, n) {
      return i.canHandle(n);
    },
    handle(t, n) {
      for (var r = arguments.length, s = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
        s[a - 2] = arguments[a];
      i.handle(n, ...s);
    },
    reset(t) {
      i.reset();
    },
    onAny(t) {
      return i.on("*", t);
    },
    compositeState(t) {
      return i.compositeState();
    },
    rehydrate(t, n) {
      throw new Error("rehydrate: cannot rehydrate an Fsm child. Fsm owns its own context; rehydrate is only valid for BehavioralFsm hierarchies.");
    },
    dehydrate(t, n) {
      throw new Error("dehydrate: cannot dehydrate an Fsm child. Fsm owns its own context; dehydrate is only valid for BehavioralFsm hierarchies.");
    },
    planRehydrate(t, n) {
      throw new Error("rehydrate: cannot rehydrate an Fsm child. Fsm owns its own context; rehydrate is only valid for BehavioralFsm hierarchies.");
    },
    dispose() {
      i.dispose();
    }
  };
  throw new Error("createChildLink: expected an Fsm or BehavioralFsm instance, got [MACHINA_TYPE] = ".concat(String(e ?? "undefined")));
}
var Tm = class {
  constructor(e) {
    var t;
    N(this, "id", void 0), N(this, "initialState", void 0), N(this, Pn, "Fsm"), N(this, "states", void 0), N(this, "bfsm", void 0), N(this, "context", void 0), N(this, "emitter", new Fd()), N(this, "disposed", !1), this.id = e.id, this.initialState = e.initialState, this.context = (t = e.context) !== null && t !== void 0 ? t : {}, this.bfsm = new ym(e), this.states = e.states, this.bfsm.on("*", (n, r) => {
      if (r && typeof r == "object" && "client" in r) {
        r.client;
        const s = Bl(r, pm);
        this.emitter.emit(n, s);
      } else this.emitter.emit(n, r);
    }), this.bfsm.transition(this.context, e.initialState);
  }
  /**
  * Dispatch an input to the current state's handler.
  * If a `_child` FSM in the current state can handle it, delegation occurs
  * there first; unhandled inputs bubble up to the parent.
  * No-ops silently when disposed.
  */
  handle(e) {
    if (!this.disposed) {
      for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
        n[r - 1] = arguments[r];
      this.bfsm.handle(this.context, e, ...n);
    }
  }
  /**
  * Returns true if the current state has a handler for `inputName`
  * (or a catch-all `"*"` handler), or if the current state's `_child`
  * chain can handle it (checked recursively, matching `handle()`'s
  * delegation reach). Does not trigger initialization or any side
  * effects. Returns false when disposed.
  */
  canHandle(e) {
    return this.disposed ? !1 : this.bfsm.canHandle(this.context, e);
  }
  /**
  * Transition back to `initialState`, firing `_onEnter` and lifecycle
  * events as if entering it fresh. No-ops silently when disposed.
  */
  reset() {
    this.disposed || this.bfsm.reset(this.context);
  }
  /**
  * Returns the current state name. Always defined — Fsm eagerly
  * initializes into `initialState` during construction.
  */
  currentState() {
    return this.bfsm.currentState(this.context);
  }
  /**
  * Directly transition to `toState`, firing `_onExit`, `_onEnter`, and
  * lifecycle events. Same-state transitions are silently ignored.
  * No-ops when disposed.
  */
  transition(e) {
    this.disposed || this.bfsm.transition(this.context, e);
  }
  /**
  * Returns the current state as a dot-delimited path that includes
  * any active child FSM states (e.g. `"active.connecting.retrying"`).
  * Returns just the current state name when no child is active.
  */
  compositeState() {
    return this.bfsm.compositeState(this.context);
  }
  on(e, t) {
    return this.disposed ? {
      off() {
      }
    } : this.emitter.on(e, t);
  }
  /**
  * Emit a custom event through the FSM. Built-in lifecycle events are
  * emitted automatically — this is for user-defined events from handlers.
  * Routes through the BehavioralFsm so all relay paths are consistent.
  * No-ops when disposed.
  */
  emit(e, t) {
    this.disposed || this.bfsm.emit(e, t);
  }
  /**
  * Permanently shut down this FSM. Irreversible — all subsequent method
  * calls become silent no-ops. Clears all listeners and cascades disposal
  * to child FSMs (unless `preserveChildren` is set).
  */
  dispose(e) {
    this.disposed = !0, this.bfsm.dispose(e), this.emitter.clear();
  }
};
function Sm(i) {
  return new Tm(i);
}
function Bd(i, e) {
  return e.attemptId === i.attemptId;
}
const Qa = (i, e) => {
  let t = i.ctx;
  if (Bd(t, e))
    return "connected";
}, Er = (i) => {
  let e = i.ctx;
  return e.attemptId += 1, e.lastError = void 0, "connecting";
}, wr = (i) => {
  let e = i.ctx;
  return e.attemptId += 1, e.lastError = void 0, "reconnecting";
}, yn = (i, e) => {
  let t = i.ctx;
  return t.closeReason = e.reason, "disconnecting";
}, Cm = {
  new: {
    connect: Er,
    close: yn
  },
  connecting: {
    connectComplete: Qa,
    // An initial connect has no session to fall back on, so failure is terminal.
    connectFailed: (i, e) => {
      let t = i.ctx;
      return t.lastError = e.error, "closed";
    },
    close: yn
  },
  connected: {
    reconnect: wr,
    transportFailed: (i, e) => {
      let t = i.ctx;
      if (Bd(t, e))
        return t.lastError = e.reason, "offline";
    },
    close: yn
  },
  offline: {
    connect: Er,
    reconnect: wr,
    close: yn
  },
  reconnecting: {
    reconnectComplete: Qa,
    reconnectFailed: (i, e) => {
      let t = i.ctx;
      return t.lastError = e.error, e.recoverable ? "offline" : "closed";
    },
    close: yn
  },
  // Owns the transport until the close handshake settles. Every path into this state is followed
  // by a `closeComplete`, so it cannot become a trap.
  disconnecting: {
    closeComplete: "closed"
  },
  // No transport, but the session may still be resumable: the engine resumes after an unexpected
  // close just as it does from `offline`.
  closed: {
    connect: Er,
    reconnect: wr
  }
};
function Em() {
  let i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "new";
  return Sm({
    id: "signal",
    initialState: i,
    context: {
      attemptId: 0
    },
    states: Cm
  });
}
class wm {
  get readyState() {
    return this.ws.readyState;
  }
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var n, r;
    if (!((n = t.signal) === null || n === void 0) && n.aborted)
      throw new DOMException("This operation was aborted", "AbortError");
    this.url = e;
    const s = new WebSocket(e, (r = t.protocols) !== null && r !== void 0 ? r : []);
    s.binaryType = "arraybuffer", this.ws = s;
    const a = function() {
      let o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, c = o.closeCode, d = o.reason;
      return s.close(c, d);
    };
    this.opened = new Ee((o, c) => {
      const d = () => {
        c(x.websocket("Encountered websocket error during connection establishment"));
      };
      s.onopen = () => {
        o({
          readable: new ReadableStream({
            start(l) {
              s.onmessage = (u) => {
                let h = u.data;
                return l.enqueue(h);
              }, s.onerror = (u) => l.error(x.websocket(zf(u, "websocket"))), s.onclose = (u) => {
                u.wasClean || u.code === 1e3 ? l.close() : l.error(x.websocket("WS closed unexpectedly with code ".concat(u.code)));
              };
            },
            cancel: a
          }),
          writable: new WritableStream({
            write(l) {
              s.send(l);
            },
            abort() {
              s.close();
            },
            close: a
          }),
          protocol: s.protocol,
          extensions: s.extensions
        }), s.removeEventListener("error", d);
      }, s.addEventListener("error", d);
    }), this.closed = new Ee((o, c) => {
      const d = () => m(this, void 0, void 0, function* () {
        const l = new Ee((h) => {
          s.readyState !== WebSocket.CLOSED && s.addEventListener("close", (f) => {
            h(f);
          }, {
            once: !0
          });
        }), u = yield Ee.race([ke(250), l]);
        u ? o(u) : c(x.websocket("Encountered unspecified websocket error without a timely close event"));
      });
      s.addEventListener("close", (l) => {
        let u = l.code, h = l.reason;
        o({
          closeCode: u,
          reason: h
        }), s.removeEventListener("error", d);
      }), s.addEventListener("error", d);
    }), t.signal && (t.signal.onabort = () => s.close()), this.close = a;
  }
}
const _m = ["syncState", "trickle", "offer", "answer", "simulate", "leave"];
function Pm(i) {
  return i instanceof x ? i.reason !== J.LeaveRequest && i.reason !== J.NotAllowed : !0;
}
function Rm(i) {
  const e = _m.indexOf(i.case) >= 0;
  return q.trace("request allowed to bypass queue:", {
    canPass: e,
    req: i
  }), e;
}
var Se;
(function(i) {
  i[i.CONNECTING = 0] = "CONNECTING", i[i.CONNECTED = 1] = "CONNECTED", i[i.RECONNECTING = 2] = "RECONNECTING", i[i.DISCONNECTING = 3] = "DISCONNECTING", i[i.DISCONNECTED = 4] = "DISCONNECTED";
})(Se || (Se = {}));
function Im(i) {
  switch (i) {
    case "connected":
      return Se.CONNECTED;
    case "connecting":
      return Se.CONNECTING;
    case "reconnecting":
      return Se.RECONNECTING;
    case "disconnecting":
      return Se.DISCONNECTING;
    default:
      return Se.DISCONNECTED;
  }
}
const Mm = 250, Om = 5e3;
class $s {
  get currentState() {
    return Im(this.lifecycleState);
  }
  get isDisconnected() {
    const e = this.currentState;
    return e === Se.DISCONNECTING || e === Se.DISCONNECTED;
  }
  /** Runtime lifecycle state, finer grained than the public {@link currentState} projection. */
  get lifecycleState() {
    return this.machine.currentState();
  }
  /** Id of the current connection attempt and of the transport it owns. */
  get attemptId() {
    return this.machine.context.attemptId;
  }
  /**
   * Applies a lifecycle input and reports whether it moved the machine
   */
  sendLifecycleInput(e) {
    const t = this.lifecycleState;
    return this.machine.handle(e.type, e), this.lifecycleState !== t;
  }
  /**
   * Waits out a close that is already in flight. Establishing a session while one is tearing down
   * would race it for the transport — the teardown can close the socket the new attempt just
   * opened.
   */
  settleInFlightClose() {
    return m(this, void 0, void 0, function* () {
      this.log.debug("waiting for an in-flight close to settle before establishing a session"), (yield this.closingLock.lock())();
    });
  }
  get isEstablishingConnection() {
    return this.lifecycleState === "connecting" || this.lifecycleState === "reconnecting";
  }
  getNextRequestId() {
    return this._requestId += 1, this._requestId;
  }
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !1, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var n;
    this.rtt = 0, this.log = q, this._requestId = 0, this.useV0SignalPath = !1, this.resetCallbacks = () => {
      this.onAnswer = void 0, this.onLeave = void 0, this.onLocalTrackPublished = void 0, this.onLocalTrackUnpublished = void 0, this.onNegotiateRequested = void 0, this.onOffer = void 0, this.onRemoteMuteChanged = void 0, this.onSubscribedQualityUpdate = void 0, this.onTokenRefresh = void 0, this.onTrickle = void 0, this.onClose = void 0, this.onMediaSectionsRequirement = void 0;
    }, this.loggerContextCb = t.loggerContextCb, this.log = he((n = t.loggerName) !== null && n !== void 0 ? n : te.Signal, () => this.logContext), this.useJSON = e, this.requestQueue = new mm(), this.queuedRequests = [], this.closingLock = new ue(), this.connectionLock = new ue(), this.machine = Em(), this.machine.on("transitioned", (r) => {
      let s = r.fromState, a = r.toState;
      this.log.debug("signal lifecycle: ".concat(s, " -> ").concat(a));
    }), this.machine.on("nohandler", (r) => {
      let s = r.inputName;
      this.log.debug("ignoring signal lifecycle input ".concat(s, " in state ").concat(this.lifecycleState));
    }), this.machine;
  }
  get logContext() {
    var e, t;
    return (t = (e = this.loggerContextCb) === null || e === void 0 ? void 0 : e.call(this)) !== null && t !== void 0 ? t : {};
  }
  join(e, t, n, r) {
    return m(this, arguments, void 0, function(s, a, o, c) {
      var d = this;
      let l = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !1, u = arguments.length > 5 ? arguments[5] : void 0;
      return (function* () {
        if (d.lifecycleState === "disconnecting" && (yield d.settleInFlightClose()), !d.sendLifecycleInput({
          type: "connect"
        }))
          throw x.internal("cannot establish a signal session from '".concat(d.lifecycleState, "', close the current one first"));
        d.options = o;
        try {
          return yield d.connect(s, a, o, c, l, u);
        } catch (h) {
          throw d.sendLifecycleInput({
            type: "connectFailed",
            error: h
          }), h;
        }
      })();
    });
  }
  reconnect(e, t, n, r) {
    return m(this, void 0, void 0, function* () {
      if (!this.options) {
        this.log.warn("attempted to reconnect without signal options being set, ignoring");
        return;
      }
      if (this.lifecycleState === "disconnecting" && (yield this.settleInFlightClose()), !this.sendLifecycleInput({
        type: "reconnect"
      }))
        throw x.internal("cannot resume the signal session from '".concat(this.lifecycleState, "'"));
      this.clearPingInterval();
      try {
        return yield this.connect(e, t, Object.assign(Object.assign({}, this.options), {
          reconnect: !0,
          sid: n,
          reconnectReason: r
        }), void 0, this.useV0SignalPath);
      } catch (s) {
        throw this.sendLifecycleInput({
          type: "reconnectFailed",
          error: s,
          recoverable: Pm(s)
        }), s;
      }
    });
  }
  connect(e, t, n, r) {
    return m(this, arguments, void 0, function(s, a, o, c) {
      var d = this;
      let l = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !1, u = arguments.length > 5 ? arguments[5] : void 0;
      return (function* () {
        const h = yield d.connectionLock.lock();
        d.connectOptions = o, d.useV0SignalPath = l;
        const f = Df(o.clientInfoCapabilities), g = l ? Am(a, f, o) : yield Dm(a, f, o, u), p = Wf(s, g, l).toString(), k = Kf(p).toString();
        return new Promise((T, S) => m(d, void 0, void 0, function* () {
          var I, b;
          try {
            let y = !1;
            const C = (U) => m(this, void 0, void 0, function* () {
              if (y)
                return;
              y = !0;
              const H = U instanceof Event ? U.currentTarget : U, ae = Gf(H, "Abort handler called");
              this.streamWriter && !this.isDisconnected ? this.sendLeave().then(() => this.close(ae)).catch((Me) => {
                this.log.error(Me), this.close();
              }) : this.close(), M(), S(U instanceof x ? U : x.cancelled(ae));
            });
            c == null || c.addEventListener("abort", C);
            const M = () => {
              clearTimeout(A), c == null || c.removeEventListener("abort", C);
            }, A = setTimeout(() => {
              C(x.timeout("room connection has timed out (signal)"));
            }, o.websocketTimeout), B = new URL(p);
            if (B.searchParams.has("access_token") && B.searchParams.set("access_token", "<redacted>"), this.ws) {
              const U = performance.now();
              yield this.teardownTransport("replaced by a new connection attempt"), this.log.debug("closed previous ws connection in ".concat(performance.now() - U, "ms"));
            }
            const F = this.attemptId;
            this.log.info("signal connecting to ".concat(B), {
              reconnect: o.reconnect,
              reconnectReason: o.reconnectReason
            }), this.ws = new wm(p);
            let D = !1;
            this.ws.opened.catch(() => {
              D = !0;
            });
            try {
              this.ws.closed.then((pe) => {
                this.isEstablishingConnection && !D && S(x.internal("Websocket got closed during a (re)connection attempt: ".concat(pe.reason))), this.log.debug("websocket closed", {
                  reason: pe.reason,
                  code: pe.closeCode,
                  attemptId: F,
                  state: this.lifecycleState
                }), this.handleOnClose(pe.reason || (pe.closeCode === 1e3 ? "server closed the signal connection" : "Unexpected WS error"), F);
              }).catch((pe) => {
                this.isEstablishingConnection && !D && S(x.internal("Websocket error during a (re)connection attempt: ".concat(pe)));
              });
              const U = yield this.ws.opened.catch((pe) => m(this, void 0, void 0, function* () {
                if (this.lifecycleState !== "connected") {
                  clearTimeout(A);
                  const It = yield this.handleConnectionError(pe, k);
                  S(It);
                  return;
                }
                this.handleWSError(pe), S(pe);
              }));
              if (clearTimeout(A), !U)
                return;
              const H = U.readable.getReader();
              this.streamWriter = U.writable.getWriter();
              let ae, Me;
              try {
                ae = yield Promise.race([H.read(), new Promise((pe, It) => {
                  Me = setTimeout(() => {
                    It(x.timeout("signal connection timed out while waiting for the first message"));
                  }, Om);
                })]);
              } catch (pe) {
                H.releaseLock(), S(pe), this.close();
                return;
              } finally {
                clearTimeout(Me);
              }
              if (H.releaseLock(), !ae.value)
                throw x.internal("no message received as first message");
              const Ye = Ha(ae.value), ft = this.validateFirstMessage(Ye, (I = o.reconnect) !== null && I !== void 0 ? I : !1);
              if (!ft.isValid) {
                S(ft.error);
                return;
              }
              ((b = Ye.message) === null || b === void 0 ? void 0 : b.case) === "join" && (this.pingTimeoutDuration = Ye.message.value.pingTimeout, this.pingIntervalDuration = Ye.message.value.pingInterval, this.pingTimeoutDuration && this.pingTimeoutDuration > 0 && this.log.debug("ping config", {
                timeout: this.pingTimeoutDuration,
                interval: this.pingIntervalDuration
              }), this.onJoined && this.onJoined(Ye.message.value));
              const Qn = ft.shouldProcessFirstMessage ? Ye : void 0;
              this.handleSignalConnected(U, A, F, Qn), T(ft.response);
            } catch (U) {
              S(U);
            } finally {
              M();
            }
          } finally {
            h();
          }
        }));
      })();
    });
  }
  startReadingLoop(e, t) {
    return m(this, void 0, void 0, function* () {
      t && this.handleSignalResponse(t);
      const n = this.attemptId;
      for (; ; ) {
        this.signalLatency && (yield ke(this.signalLatency));
        try {
          const r = yield e.read(), s = r.done, a = r.value;
          if (s)
            break;
          const o = Ha(a);
          this.handleSignalResponse(o);
        } catch (r) {
          this.log.error("error reading from signal stream", {
            error: r
          }), yield this.handleOnClose("error in reading loop", n);
          break;
        }
      }
    });
  }
  close() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "Close method called on signal client";
      return (function* () {
        const r = t && e.sendLifecycleInput({
          type: "close",
          reason: n
        }), s = yield e.closingLock.lock();
        try {
          yield e.teardownTransport(n);
        } finally {
          r && e.sendLifecycleInput({
            type: "closeComplete"
          }), s();
        }
      })();
    });
  }
  /**
   * Releases the transport and everything tied to it, without touching the lifecycle state. Used
   * both by {@link close} and by paths that replace the transport under a live lifecycle (a new
   * attempt, or an unexpected close that leaves the client in `offline`).
   */
  teardownTransport(e) {
    return m(this, void 0, void 0, function* () {
      try {
        if (this.clearPingInterval(), this.ws) {
          this.ws.close({
            closeCode: 1e3,
            reason: e
          });
          const t = this.ws.closed;
          this.ws = void 0, this.streamWriter = void 0, yield Promise.race([t, ke(Mm)]);
        }
      } catch (t) {
        this.log.debug("websocket error while closing", {
          error: t
        });
      }
    });
  }
  // initial offer after joining
  sendOffer(e, t) {
    this.log.debug("sending offer", {
      offerSdp: e.sdp
    }), this.sendRequest({
      case: "offer",
      value: Dt(e, t)
    });
  }
  // answer a server-initiated offer
  sendAnswer(e, t) {
    return this.log.debug("sending answer", {
      answerSdp: e.sdp
    }), this.sendRequest({
      case: "answer",
      value: Dt(e, t)
    });
  }
  sendIceCandidate(e, t) {
    return this.log.debug("sending ice candidate", {
      candidate: e
    }), this.sendRequest({
      case: "trickle",
      value: new Vi({
        candidateInit: JSON.stringify(e),
        target: t
      })
    });
  }
  sendMuteTrack(e, t) {
    return this.sendRequest({
      case: "mute",
      value: new Wi({
        sid: e,
        muted: t
      })
    });
  }
  sendAddTrack(e) {
    return this.sendRequest({
      case: "addTrack",
      value: e
    });
  }
  sendUpdateLocalMetadata(e, t) {
    return m(this, arguments, void 0, function(n, r) {
      var s = this;
      let a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return (function* () {
        const o = s.getNextRequestId();
        return yield s.sendRequest({
          case: "updateMetadata",
          value: new Ns({
            requestId: o,
            metadata: n,
            name: r,
            attributes: a
          })
        }), o;
      })();
    });
  }
  sendUpdateTrackSettings(e) {
    this.sendRequest({
      case: "trackSetting",
      value: e
    });
  }
  sendUpdateSubscription(e) {
    return this.sendRequest({
      case: "subscription",
      value: e
    });
  }
  sendSyncState(e) {
    return this.sendRequest({
      case: "syncState",
      value: e
    });
  }
  sendUpdateVideoLayers(e, t) {
    return this.sendRequest({
      case: "updateLayers",
      value: new Rc({
        trackSid: e,
        layers: t
      })
    });
  }
  sendUpdateSubscriptionPermissions(e, t) {
    return this.sendRequest({
      case: "subscriptionPermission",
      value: new Oc({
        allParticipants: e,
        trackPermissions: t
      })
    });
  }
  sendSimulateScenario(e) {
    return this.sendRequest({
      case: "simulate",
      value: e
    });
  }
  sendPing() {
    return Promise.all([this.sendRequest({
      case: "ping",
      value: ee.parse(Date.now())
    }), this.sendRequest({
      case: "pingReq",
      value: new Lc({
        timestamp: ee.parse(Date.now()),
        rtt: ee.parse(this.rtt)
      })
    })]);
  }
  sendUpdateLocalAudioTrack(e, t) {
    return this.sendRequest({
      case: "updateAudioTrack",
      value: new xs({
        trackSid: e,
        features: t
      })
    });
  }
  sendLeave() {
    return this.sendRequest({
      case: "leave",
      value: new Ki({
        reason: Ae.CLIENT_INITIATED,
        // server doesn't process this field, keeping it here to indicate the intent of a full disconnect
        action: $t.DISCONNECT
      })
    });
  }
  sendPublishDataTrackRequest(e, t, n) {
    return this.sendRequest({
      case: "publishDataTrackRequest",
      value: new Os({
        pubHandle: e,
        name: t,
        encryption: n ? G.GCM : G.NONE
      })
    });
  }
  sendUnPublishDataTrackRequest(e) {
    return this.sendRequest({
      case: "unpublishDataTrackRequest",
      value: new Ds({
        pubHandle: e
      })
    });
  }
  sendUpdateDataSubscription(e, t) {
    return this.sendRequest({
      case: "updateDataSubscription",
      value: new Ec({
        // FIXME: consider refactoring to allow caller to pass an array of events through
        updates: [new wc({
          trackSid: e,
          subscribe: t
        })]
      })
    });
  }
  sendRequest(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1;
      return (function* () {
        const s = !r && !Rm(t), a = n.lifecycleState === "reconnecting" || n.queuedRequests.length > 0;
        if (s && a) {
          n.queuedRequests.push(() => m(n, void 0, void 0, function* () {
            yield this.sendRequest(t, !0);
          }));
          return;
        }
        r || (yield n.requestQueue.flush()), n.signalLatency && (yield ke(n.signalLatency));
        const o = t.case === "leave" && !!n.streamWriter;
        if (n.isDisconnected && !o) {
          n.log.debug("skipping signal request (type: ".concat(t.case, ") - SignalClient disconnected"));
          return;
        }
        if (!n.streamWriter) {
          n.log.error("cannot send signal request before connected, type: ".concat(t == null ? void 0 : t.case));
          return;
        }
        const c = new nh({
          message: t
        });
        try {
          n.useJSON ? yield n.streamWriter.write(c.toJsonString()) : yield n.streamWriter.write(c.toBinary().buffer);
        } catch (d) {
          n.log.error("error sending signal message", {
            error: d
          });
        }
      })();
    });
  }
  handleSignalResponse(e) {
    var t, n;
    const r = e.message;
    if (r == null) {
      this.log.debug("received unsupported message");
      return;
    }
    let s = !1;
    if (r.case === "answer") {
      const a = Ya(r.value);
      this.onAnswer && this.onAnswer(a, r.value.id, r.value.midToTrackId);
    } else if (r.case === "offer") {
      const a = Ya(r.value);
      this.onOffer && this.onOffer(a, r.value.id, r.value.midToTrackId);
    } else if (r.case === "trickle") {
      const a = JSON.parse(r.value.candidateInit);
      this.onTrickle && this.onTrickle(a, r.value.target);
    } else r.case === "update" ? this.onParticipantUpdate && this.onParticipantUpdate((t = r.value.participants) !== null && t !== void 0 ? t : []) : r.case === "trackPublished" ? this.onLocalTrackPublished && this.onLocalTrackPublished(r.value) : r.case === "speakersChanged" ? this.onSpeakersChanged && this.onSpeakersChanged((n = r.value.speakers) !== null && n !== void 0 ? n : []) : r.case === "leave" ? this.onLeave && this.onLeave(r.value) : r.case === "mute" ? this.onRemoteMuteChanged && this.onRemoteMuteChanged(r.value.sid, r.value.muted) : r.case === "roomUpdate" ? this.onRoomUpdate && r.value.room && this.onRoomUpdate(r.value.room) : r.case === "connectionQuality" ? this.onConnectionQuality && this.onConnectionQuality(r.value) : r.case === "streamStateUpdate" ? this.onStreamStateUpdate && this.onStreamStateUpdate(r.value) : r.case === "subscribedQualityUpdate" ? this.onSubscribedQualityUpdate && this.onSubscribedQualityUpdate(r.value) : r.case === "subscriptionPermissionUpdate" ? this.onSubscriptionPermissionUpdate && this.onSubscriptionPermissionUpdate(r.value) : r.case === "refreshToken" ? this.onTokenRefresh && this.onTokenRefresh(r.value) : r.case === "trackUnpublished" ? this.onLocalTrackUnpublished && this.onLocalTrackUnpublished(r.value) : r.case === "subscriptionResponse" ? this.onSubscriptionError && this.onSubscriptionError(r.value) : r.case === "pong" || (r.case === "pongResp" ? (this.rtt = Date.now() - Number.parseInt(r.value.lastPingTimestamp.toString()), this.resetPingTimeout(), s = !0) : r.case === "requestResponse" ? this.onRequestResponse && this.onRequestResponse(r.value) : r.case === "trackSubscribed" ? this.onLocalTrackSubscribed && this.onLocalTrackSubscribed(r.value.trackSid) : r.case === "roomMoved" ? (this.onTokenRefresh && this.onTokenRefresh(r.value.token), this.onRoomMoved && this.onRoomMoved(r.value)) : r.case === "mediaSectionsRequirement" ? this.onMediaSectionsRequirement && this.onMediaSectionsRequirement(r.value) : r.case === "publishDataTrackResponse" ? this.onPublishDataTrackResponse && this.onPublishDataTrackResponse(r.value) : r.case === "unpublishDataTrackResponse" ? this.onUnPublishDataTrackResponse && this.onUnPublishDataTrackResponse(r.value) : r.case === "dataTrackSubscriberHandles" ? this.onDataTrackSubscriberHandles && this.onDataTrackSubscriberHandles(r.value) : this.log.debug("unsupported message", {
      msgCase: r.case
    }));
    s || this.resetPingTimeout();
  }
  setReconnected() {
    for (; this.queuedRequests.length > 0; ) {
      const e = this.queuedRequests.shift();
      e && this.requestQueue.run(e);
    }
  }
  /**
   * Handles a transport we lost without asking to. The client goes to `offline` rather than
   * `closed`: whether this session gets resumed, restarted or given up on is the engine's call.
   */
  handleOnClose(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.attemptId;
      return (function* () {
        const s = n.onClose;
        if (!n.sendLifecycleInput({
          type: "transportFailed",
          attemptId: r,
          reason: t
        })) {
          n.log.debug("ignoring transport close in state ".concat(n.lifecycleState), {
            reason: t,
            attemptId: r,
            currentAttemptId: n.attemptId
          });
          return;
        }
        yield n.teardownTransport(t), n.log.info("websocket connection closed: ".concat(t), {
          reason: t
        }), s && s(t);
      })();
    });
  }
  handleWSError(e) {
    this.log.error("websocket error", {
      error: e
    });
  }
  /**
   * Resets the ping timeout and starts a new timeout.
   * Call this after receiving a pong message
   */
  resetPingTimeout() {
    if (this.clearPingTimeout(), !this.pingTimeoutDuration) {
      this.log.warn("ping timeout duration not set");
      return;
    }
    this.pingTimeout = Q.setTimeout(() => {
      this.log.warn("ping timeout triggered. last pong received at: ".concat(new Date(Date.now() - this.pingTimeoutDuration * 1e3).toUTCString())), this.handleOnClose("ping timeout");
    }, this.pingTimeoutDuration * 1e3);
  }
  /**
   * Clears ping timeout (does not start a new timeout)
   */
  clearPingTimeout() {
    this.pingTimeout && Q.clearTimeout(this.pingTimeout);
  }
  startPingInterval() {
    if (this.clearPingInterval(), this.resetPingTimeout(), !this.pingIntervalDuration) {
      this.log.warn("ping interval duration not set");
      return;
    }
    this.log.debug("start ping interval"), this.pingInterval = Q.setInterval(() => {
      this.sendPing();
    }, this.pingIntervalDuration * 1e3);
  }
  clearPingInterval() {
    this.log.debug("clearing ping interval"), this.clearPingTimeout(), this.pingInterval && Q.clearInterval(this.pingInterval);
  }
  /**
   * Handles the successful connection to the signal server
   * @param connection The WebSocket connection
   * @param timeoutHandle The timeout handle to clear
   * @param firstMessage Optional first message to process
   * @internal
   */
  handleSignalConnected(e, t, n, r) {
    if (clearTimeout(t), !this.sendLifecycleInput(this.lifecycleState === "reconnecting" ? {
      type: "reconnectComplete",
      attemptId: n
    } : {
      type: "connectComplete",
      attemptId: n
    })) {
      this.log.debug("discarding a connection whose attempt no longer owns the session", {
        attemptId: n,
        currentAttemptId: this.attemptId,
        state: this.lifecycleState
      });
      return;
    }
    this.log.info("signal connected"), this.startPingInterval(), this.startReadingLoop(e.readable.getReader(), r);
  }
  /**
   * Validates the first message received from the signal server
   * @param firstSignalResponse The first signal response received
   * @param isReconnect Whether this is a reconnection attempt
   * @returns Validation result with response or error
   * @internal
   */
  validateFirstMessage(e, t) {
    var n, r, s, a, o;
    return ((n = e.message) === null || n === void 0 ? void 0 : n.case) === "join" ? {
      isValid: !0,
      response: e.message.value
    } : this.lifecycleState === "reconnecting" && ((r = e.message) === null || r === void 0 ? void 0 : r.case) !== "leave" ? ((s = e.message) === null || s === void 0 ? void 0 : s.case) === "reconnect" ? {
      isValid: !0,
      response: e.message.value
    } : (this.log.debug("declaring signal reconnected without reconnect response received"), {
      isValid: !0,
      response: void 0,
      shouldProcessFirstMessage: !0
    }) : this.isEstablishingConnection && ((a = e.message) === null || a === void 0 ? void 0 : a.case) === "leave" ? {
      isValid: !1,
      error: x.leaveRequest("Received leave request while trying to (re)connect", e.message.value.reason)
    } : t ? {
      isValid: !1,
      error: x.internal("Unexpected first message")
    } : {
      isValid: !1,
      error: x.internal("did not receive join response, got ".concat((o = e.message) === null || o === void 0 ? void 0 : o.case, " instead"))
    };
  }
  /**
   * Handles WebSocket connection errors by validating with the server
   * @param reason The error that occurred
   * @param validateUrl The URL to validate the connection with
   * @returns A ConnectionError with appropriate reason and status
   * @internal
   */
  handleConnectionError(e, t) {
    return m(this, void 0, void 0, function* () {
      try {
        const n = yield fetch(t);
        switch (n.status) {
          case 404:
            const r = yield n.text();
            return r.includes("requested room does not exist") ? x.notAllowed(r, n.status) : x.serviceNotFound("v1 RTC path not found. Consider upgrading your LiveKit server version", "v0-rtc");
          case 401:
          case 403:
            const s = yield n.text();
            return x.notAllowed(s, n.status);
          default:
            break;
        }
        return e instanceof x ? e : x.internal("Encountered unknown websocket error during connection: ".concat(e), {
          status: n.status,
          statusText: n.statusText
        });
      } catch (n) {
        return n instanceof x ? n : x.serverUnreachable(n instanceof Error ? n.message : "server was not reachable");
      }
    });
  }
}
function Ya(i) {
  const e = {
    type: "offer",
    sdp: i.sdp
  };
  switch (i.type) {
    case "answer":
    case "offer":
    case "pranswer":
    case "rollback":
      e.type = i.type;
      break;
  }
  return e;
}
function Dt(i, e) {
  return new _t({
    sdp: i.sdp,
    type: i.type,
    id: e
  });
}
function Am(i, e, t) {
  var n;
  const r = new URLSearchParams();
  return r.set("access_token", i), t.reconnect && (r.set("reconnect", "1"), t.sid && r.set("sid", t.sid)), r.set("auto_subscribe", t.autoSubscribe ? "1" : "0"), r.set("sdk", ze() ? "reactnative" : "js"), r.set("version", e.version), r.set("protocol", e.protocol.toString()), r.set("client_protocol", e.clientProtocol.toString()), e.deviceModel && r.set("device_model", e.deviceModel), e.os && r.set("os", e.os), e.osVersion && r.set("os_version", e.osVersion), e.browser && r.set("browser", e.browser), e.browserVersion && r.set("browser_version", e.browserVersion), t.adaptiveStream && r.set("adaptive_stream", "1"), t.reconnectReason && r.set("reconnect_reason", t.reconnectReason.toString()), !((n = navigator.connection) === null || n === void 0) && n.type && r.set("network", navigator.connection.type), r;
}
function Dm(i, e, t, n) {
  return m(this, void 0, void 0, function* () {
    const r = new URLSearchParams();
    r.set("access_token", i);
    const s = new Oh({
      clientInfo: e,
      connectionSettings: new xc({
        autoSubscribe: !!t.autoSubscribe,
        adaptiveStream: !!t.adaptiveStream
      }),
      reconnect: !!t.reconnect,
      participantSid: t.sid ? t.sid : void 0,
      publisherOffer: n
    });
    t.reconnectReason && (s.reconnectReason = t.reconnectReason);
    const a = s.toBinary();
    let o, c;
    if (Ct()) {
      const h = new CompressionStream("gzip"), f = h.writable.getWriter();
      f.write(new Uint8Array(a)), f.close();
      const g = [], p = h.readable.getReader();
      for (; ; ) {
        const I = yield p.read(), b = I.done, y = I.value;
        if (b) break;
        g.push(y);
      }
      const k = g.reduce((I, b) => I + b.length, 0), T = new Uint8Array(k);
      let S = 0;
      for (const I of g)
        T.set(I, S), S += I.length;
      o = T, c = zr.GZIP;
    } else
      o = a, c = zr.NONE;
    const l = new Ah({
      joinRequest: o,
      compression: c
    }).toBinary(), u = (h) => {
      const f = Array.from(h, (g) => String.fromCodePoint(g)).join("");
      return btoa(f);
    };
    return r.set("join_request", u(l).replace(/\+/g, "-").replace(/\//g, "_")), r;
  });
}
class Lm {
  /**
   * @param ttl ttl of the key (ms)
   */
  constructor(e) {
    this._map = /* @__PURE__ */ new Map(), this._lastCleanup = 0, this.ttl = e;
  }
  set(e, t) {
    const n = Date.now();
    n - this._lastCleanup > this.ttl / 2 && this.cleanup();
    const r = n + this.ttl;
    return this._map.set(e, {
      value: t,
      expiresAt: r
    }), this;
  }
  get(e) {
    const t = this._map.get(e);
    if (t) {
      if (t.expiresAt < Date.now()) {
        this._map.delete(e);
        return;
      }
      return t.value;
    }
  }
  has(e) {
    const t = this._map.get(e);
    return t ? t.expiresAt < Date.now() ? (this._map.delete(e), !1) : !0 : !1;
  }
  delete(e) {
    return this._map.delete(e);
  }
  clear() {
    this._map.clear();
  }
  cleanup() {
    const e = Date.now();
    for (const n of this._map.entries()) {
      var t = L(n, 2);
      const r = t[0];
      t[1].expiresAt < e && this._map.delete(r);
    }
    this._lastCleanup = e;
  }
  get size() {
    return this.cleanup(), this._map.size;
  }
  forEach(e) {
    this.cleanup();
    for (const n of this._map.entries()) {
      var t = L(n, 2);
      const r = t[0], s = t[1];
      s.expiresAt >= Date.now() && e(s.value, r, this.asValueMap());
    }
  }
  map(e) {
    this.cleanup();
    const t = [], n = this.asValueMap();
    for (const s of n.entries()) {
      var r = L(s, 2);
      const a = r[0], o = r[1];
      t.push(e(o, a, n));
    }
    return t;
  }
  asValueMap() {
    const e = /* @__PURE__ */ new Map();
    for (const n of this._map.entries()) {
      var t = L(n, 2);
      const r = t[0], s = t[1];
      s.expiresAt >= Date.now() && e.set(r, s.value);
    }
    return e;
  }
}
var Fe = {}, _r = {}, Pr = { exports: {} }, $a;
function Xs() {
  if ($a) return Pr.exports;
  $a = 1;
  var i = Pr.exports = {
    v: [{
      name: "version",
      reg: /^(\d*)$/
    }],
    o: [{
      // o=- 20518 0 IN IP4 203.0.113.1
      // NB: sessionId will be a String in most cases because it is huge
      name: "origin",
      reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
      names: ["username", "sessionId", "sessionVersion", "netType", "ipVer", "address"],
      format: "%s %s %d %s IP%d %s"
    }],
    // default parsing of these only (though some of these feel outdated)
    s: [{
      name: "name"
    }],
    i: [{
      name: "description"
    }],
    u: [{
      name: "uri"
    }],
    e: [{
      name: "email"
    }],
    p: [{
      name: "phone"
    }],
    z: [{
      name: "timezones"
    }],
    // TODO: this one can actually be parsed properly...
    r: [{
      name: "repeats"
    }],
    // TODO: this one can also be parsed properly
    // k: [{}], // outdated thing ignored
    t: [{
      // t=0 0
      name: "timing",
      reg: /^(\d*) (\d*)/,
      names: ["start", "stop"],
      format: "%d %d"
    }],
    c: [{
      // c=IN IP4 10.47.197.26
      name: "connection",
      reg: /^IN IP(\d) (\S*)/,
      names: ["version", "ip"],
      format: "IN IP%d %s"
    }],
    b: [{
      // b=AS:4000
      push: "bandwidth",
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ["type", "limit"],
      format: "%s:%s"
    }],
    m: [{
      // m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
      names: ["type", "port", "protocol", "payloads"],
      format: "%s %d %s %s"
    }],
    a: [
      {
        // a=rtpmap:110 opus/48000/2
        push: "rtp",
        reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
        names: ["payload", "codec", "rate", "encoding"],
        format: function(e) {
          return e.encoding ? "rtpmap:%d %s/%s/%s" : e.rate ? "rtpmap:%d %s/%s" : "rtpmap:%d %s";
        }
      },
      {
        // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
        // a=fmtp:111 minptime=10; useinbandfec=1
        push: "fmtp",
        reg: /^fmtp:(\d*) ([\S| ]*)/,
        names: ["payload", "config"],
        format: "fmtp:%d %s"
      },
      {
        // a=control:streamid=0
        name: "control",
        reg: /^control:(.*)/,
        format: "control:%s"
      },
      {
        // a=rtcp:65179 IN IP4 193.84.77.194
        name: "rtcp",
        reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
        names: ["port", "netType", "ipVer", "address"],
        format: function(e) {
          return e.address != null ? "rtcp:%d %s IP%d %s" : "rtcp:%d";
        }
      },
      {
        // a=rtcp-fb:98 trr-int 100
        push: "rtcpFbTrrInt",
        reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
        names: ["payload", "value"],
        format: "rtcp-fb:%s trr-int %d"
      },
      {
        // a=rtcp-fb:98 nack rpsi
        push: "rtcpFb",
        reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
        names: ["payload", "type", "subtype"],
        format: function(e) {
          return e.subtype != null ? "rtcp-fb:%s %s %s" : "rtcp-fb:%s %s";
        }
      },
      {
        // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
        // a=extmap:1/recvonly URI-gps-string
        // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
        push: "ext",
        reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
        names: ["value", "direction", "encrypt-uri", "uri", "config"],
        format: function(e) {
          return "extmap:%d" + (e.direction ? "/%s" : "%v") + (e["encrypt-uri"] ? " %s" : "%v") + " %s" + (e.config ? " %s" : "");
        }
      },
      {
        // a=extmap-allow-mixed
        name: "extmapAllowMixed",
        reg: /^(extmap-allow-mixed)/
      },
      {
        // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
        push: "crypto",
        reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
        names: ["id", "suite", "config", "sessionConfig"],
        format: function(e) {
          return e.sessionConfig != null ? "crypto:%d %s %s %s" : "crypto:%d %s %s";
        }
      },
      {
        // a=setup:actpass
        name: "setup",
        reg: /^setup:(\w*)/,
        format: "setup:%s"
      },
      {
        // a=connection:new
        name: "connectionType",
        reg: /^connection:(new|existing)/,
        format: "connection:%s"
      },
      {
        // a=mid:1
        name: "mid",
        reg: /^mid:([^\s]*)/,
        format: "mid:%s"
      },
      {
        // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
        name: "msid",
        reg: /^msid:(.*)/,
        format: "msid:%s"
      },
      {
        // a=ptime:20
        name: "ptime",
        reg: /^ptime:(\d*(?:\.\d*)*)/,
        format: "ptime:%d"
      },
      {
        // a=maxptime:60
        name: "maxptime",
        reg: /^maxptime:(\d*(?:\.\d*)*)/,
        format: "maxptime:%d"
      },
      {
        // a=sendrecv
        name: "direction",
        reg: /^(sendrecv|recvonly|sendonly|inactive)/
      },
      {
        // a=ice-lite
        name: "icelite",
        reg: /^(ice-lite)/
      },
      {
        // a=ice-ufrag:F7gI
        name: "iceUfrag",
        reg: /^ice-ufrag:(\S*)/,
        format: "ice-ufrag:%s"
      },
      {
        // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
        name: "icePwd",
        reg: /^ice-pwd:(\S*)/,
        format: "ice-pwd:%s"
      },
      {
        // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
        name: "fingerprint",
        reg: /^fingerprint:(\S*) (\S*)/,
        names: ["type", "hash"],
        format: "fingerprint:%s %s"
      },
      {
        // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
        // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
        // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
        // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
        // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
        push: "candidates",
        reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
        names: ["foundation", "component", "transport", "priority", "ip", "port", "type", "raddr", "rport", "tcptype", "generation", "network-id", "network-cost"],
        format: function(e) {
          var t = "candidate:%s %d %s %d %s %d typ %s";
          return t += e.raddr != null ? " raddr %s rport %d" : "%v%v", t += e.tcptype != null ? " tcptype %s" : "%v", e.generation != null && (t += " generation %d"), t += e["network-id"] != null ? " network-id %d" : "%v", t += e["network-cost"] != null ? " network-cost %d" : "%v", t;
        }
      },
      {
        // a=end-of-candidates (keep after the candidates line for readability)
        name: "endOfCandidates",
        reg: /^(end-of-candidates)/
      },
      {
        // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
        name: "remoteCandidates",
        reg: /^remote-candidates:(.*)/,
        format: "remote-candidates:%s"
      },
      {
        // a=ice-options:google-ice
        name: "iceOptions",
        reg: /^ice-options:(\S*)/,
        format: "ice-options:%s"
      },
      {
        // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
        push: "ssrcs",
        reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
        names: ["id", "attribute", "value"],
        format: function(e) {
          var t = "ssrc:%d";
          return e.attribute != null && (t += " %s", e.value != null && (t += ":%s")), t;
        }
      },
      {
        // a=ssrc-group:FEC 1 2
        // a=ssrc-group:FEC-FR 3004364195 1080772241
        push: "ssrcGroups",
        // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
        reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
        names: ["semantics", "ssrcs"],
        format: "ssrc-group:%s %s"
      },
      {
        // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
        name: "msidSemantic",
        reg: /^msid-semantic:\s?(\w*) (\S*)/,
        names: ["semantic", "token"],
        format: "msid-semantic: %s %s"
        // space after ':' is not accidental
      },
      {
        // a=group:BUNDLE audio video
        push: "groups",
        reg: /^group:(\w*) (.*)/,
        names: ["type", "mids"],
        format: "group:%s %s"
      },
      {
        // a=rtcp-mux
        name: "rtcpMux",
        reg: /^(rtcp-mux)/
      },
      {
        // a=rtcp-rsize
        name: "rtcpRsize",
        reg: /^(rtcp-rsize)/
      },
      {
        // a=sctpmap:5000 webrtc-datachannel 1024
        name: "sctpmap",
        reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
        names: ["sctpmapNumber", "app", "maxMessageSize"],
        format: function(e) {
          return e.maxMessageSize != null ? "sctpmap:%s %s %s" : "sctpmap:%s %s";
        }
      },
      {
        // a=x-google-flag:conference
        name: "xGoogleFlag",
        reg: /^x-google-flag:([^\s]*)/,
        format: "x-google-flag:%s"
      },
      {
        // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
        push: "rids",
        reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
        names: ["id", "direction", "params"],
        format: function(e) {
          return e.params ? "rid:%s %s %s" : "rid:%s %s";
        }
      },
      {
        // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
        // a=imageattr:* send [x=800,y=640] recv *
        // a=imageattr:100 recv [x=320,y=240]
        push: "imageattrs",
        reg: new RegExp(
          // a=imageattr:97
          "^imageattr:(\\d+|\\*)[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?"
        ),
        names: ["pt", "dir1", "attrs1", "dir2", "attrs2"],
        format: function(e) {
          return "imageattr:%s %s %s" + (e.dir2 ? " %s %s" : "");
        }
      },
      {
        // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
        // a=simulcast:recv 1;4,5 send 6;7
        name: "simulcast",
        reg: new RegExp(
          // a=simulcast:
          "^simulcast:(send|recv) ([a-zA-Z0-9\\-_~;,]+)(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?$"
        ),
        names: ["dir1", "list1", "dir2", "list2"],
        format: function(e) {
          return "simulcast:%s %s" + (e.dir2 ? " %s %s" : "");
        }
      },
      {
        // old simulcast draft 03 (implemented by Firefox)
        //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
        // a=simulcast: recv pt=97;98 send pt=97
        // a=simulcast: send rid=5;6;7 paused=6,7
        name: "simulcast_03",
        reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
        names: ["value"],
        format: "simulcast: %s"
      },
      {
        // a=framerate:25
        // a=framerate:29.97
        name: "framerate",
        reg: /^framerate:(\d+(?:$|\.\d+))/,
        format: "framerate:%s"
      },
      {
        // RFC4570
        // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
        name: "sourceFilter",
        reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
        names: ["filterMode", "netType", "addressTypes", "destAddress", "srcList"],
        format: "source-filter: %s %s %s %s %s"
      },
      {
        // a=bundle-only
        name: "bundleOnly",
        reg: /^(bundle-only)/
      },
      {
        // a=label:1
        name: "label",
        reg: /^label:(.+)/,
        format: "label:%s"
      },
      {
        // RFC version 26 for SCTP over DTLS
        // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
        name: "sctpPort",
        reg: /^sctp-port:(\d+)$/,
        format: "sctp-port:%s"
      },
      {
        // RFC version 26 for SCTP over DTLS
        // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
        name: "maxMessageSize",
        reg: /^max-message-size:(\d+)$/,
        format: "max-message-size:%s"
      },
      {
        // RFC7273
        // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
        push: "tsRefClocks",
        reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
        names: ["clksrc", "clksrcExt"],
        format: function(e) {
          return "ts-refclk:%s" + (e.clksrcExt != null ? "=%s" : "");
        }
      },
      {
        // RFC7273
        // a=mediaclk:direct=963214424
        name: "mediaClk",
        reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
        names: ["id", "mediaClockName", "mediaClockValue", "rateNumerator", "rateDenominator"],
        format: function(e) {
          var t = "mediaclk:";
          return t += e.id != null ? "id=%s %s" : "%v%s", t += e.mediaClockValue != null ? "=%s" : "", t += e.rateNumerator != null ? " rate=%s" : "", t += e.rateDenominator != null ? "/%s" : "", t;
        }
      },
      {
        // a=keywds:keywords
        name: "keywords",
        reg: /^keywds:(.+)$/,
        format: "keywds:%s"
      },
      {
        // a=content:main
        name: "content",
        reg: /^content:(.+)/,
        format: "content:%s"
      },
      // BFCP https://tools.ietf.org/html/rfc4583
      {
        // a=floorctrl:c-s
        name: "bfcpFloorCtrl",
        reg: /^floorctrl:(c-only|s-only|c-s)/,
        format: "floorctrl:%s"
      },
      {
        // a=confid:1
        name: "bfcpConfId",
        reg: /^confid:(\d+)/,
        format: "confid:%s"
      },
      {
        // a=userid:1
        name: "bfcpUserId",
        reg: /^userid:(\d+)/,
        format: "userid:%s"
      },
      {
        // a=floorid:1
        name: "bfcpFloorId",
        reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
        names: ["id", "mStream"],
        format: "floorid:%s mstrm:%s"
      },
      {
        // any a= that we don't understand is kept verbatim on media.invalid
        push: "invalid",
        names: ["value"]
      }
    ]
  };
  return Object.keys(i).forEach(function(e) {
    var t = i[e];
    t.forEach(function(n) {
      n.reg || (n.reg = /(.*)/), n.format || (n.format = "%s");
    });
  }), Pr.exports;
}
var Xa;
function xm() {
  return Xa || (Xa = 1, (function(i) {
    var e = function(o) {
      return String(Number(o)) === o ? Number(o) : o;
    }, t = function(o, c, d, l) {
      if (l && !d)
        c[l] = e(o[1]);
      else
        for (var u = 0; u < d.length; u += 1)
          o[u + 1] != null && (c[d[u]] = e(o[u + 1]));
    }, n = function(o, c, d) {
      var l = o.name && o.names;
      o.push && !c[o.push] ? c[o.push] = [] : l && !c[o.name] && (c[o.name] = {});
      var u = o.push ? {} : (
        // blank object that will be pushed
        l ? c[o.name] : c
      );
      t(d.match(o.reg), u, o.names, o.name), o.push && c[o.push].push(u);
    }, r = Xs(), s = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
    i.parse = function(o) {
      var c = {}, d = [], l = c;
      return o.split(/(\r\n|\r|\n)/).filter(s).forEach(function(u) {
        var h = u[0], f = u.slice(2);
        h === "m" && (d.push({
          rtp: [],
          fmtp: []
        }), l = d[d.length - 1]);
        for (var g = 0; g < (r[h] || []).length; g += 1) {
          var p = r[h][g];
          if (p.reg.test(f))
            return n(p, l, f);
        }
      }), c.media = d, c;
    };
    var a = function(o, c) {
      var d = c.split(/=(.+)/, 2);
      return d.length === 2 ? o[d[0]] = e(d[1]) : d.length === 1 && c.length > 1 && (o[d[0]] = void 0), o;
    };
    i.parseParams = function(o) {
      return o.split(/;\s?/).reduce(a, {});
    }, i.parseFmtpConfig = i.parseParams, i.parsePayloads = function(o) {
      return o.toString().split(" ").map(Number);
    }, i.parseRemoteCandidates = function(o) {
      for (var c = [], d = o.split(" ").map(e), l = 0; l < d.length; l += 3)
        c.push({
          component: d[l],
          ip: d[l + 1],
          port: d[l + 2]
        });
      return c;
    }, i.parseImageAttributes = function(o) {
      return o.split(" ").map(function(c) {
        return c.substring(1, c.length - 1).split(",").reduce(a, {});
      });
    }, i.parseSimulcastStreamList = function(o) {
      return o.split(";").map(function(c) {
        return c.split(",").map(function(d) {
          var l, u = !1;
          return d[0] !== "~" ? l = e(d) : (l = e(d.substring(1, d.length)), u = !0), {
            scid: l,
            paused: u
          };
        });
      });
    };
  })(_r)), _r;
}
var Rr, Za;
function Nm() {
  if (Za) return Rr;
  Za = 1;
  var i = Xs(), e = /%[sdv%]/g, t = function(a) {
    var o = 1, c = arguments, d = c.length;
    return a.replace(e, function(l) {
      if (o >= d)
        return l;
      var u = c[o];
      switch (o += 1, l) {
        case "%%":
          return "%";
        case "%s":
          return String(u);
        case "%d":
          return Number(u);
        case "%v":
          return "";
      }
    });
  }, n = function(a, o, c) {
    var d = o.format instanceof Function ? o.format(o.push ? c : c[o.name]) : o.format, l = [a + "=" + d];
    if (o.names)
      for (var u = 0; u < o.names.length; u += 1) {
        var h = o.names[u];
        o.name ? l.push(c[o.name][h]) : l.push(c[o.names[u]]);
      }
    else
      l.push(c[o.name]);
    return t.apply(null, l);
  }, r = ["v", "o", "s", "i", "u", "e", "p", "c", "b", "t", "r", "z", "a"], s = ["i", "c", "b", "a"];
  return Rr = function(a, o) {
    o = o || {}, a.version == null && (a.version = 0), a.name == null && (a.name = " "), a.media.forEach(function(u) {
      u.payloads == null && (u.payloads = "");
    });
    var c = o.outerOrder || r, d = o.innerOrder || s, l = [];
    return c.forEach(function(u) {
      i[u].forEach(function(h) {
        h.name in a && a[h.name] != null ? l.push(n(u, h, a)) : h.push in a && a[h.push] != null && a[h.push].forEach(function(f) {
          l.push(n(u, h, f));
        });
      });
    }), a.media.forEach(function(u) {
      l.push(n("m", i.m[0], u)), d.forEach(function(h) {
        i[h].forEach(function(f) {
          f.name in u && u[f.name] != null ? l.push(n(h, f, u)) : f.push in u && u[f.push] != null && u[f.push].forEach(function(g) {
            l.push(n(h, f, g));
          });
        });
      });
    }), l.join(`\r
`) + `\r
`;
  }, Rr;
}
var eo;
function Um() {
  if (eo) return Fe;
  eo = 1;
  var i = xm(), e = Nm(), t = Xs();
  return Fe.grammar = t, Fe.write = e, Fe.parse = i.parse, Fe.parseParams = i.parseParams, Fe.parseFmtpConfig = i.parseFmtpConfig, Fe.parsePayloads = i.parsePayloads, Fe.parseRemoteCandidates = i.parseRemoteCandidates, Fe.parseImageAttributes = i.parseImageAttributes, Fe.parseSimulcastStreamList = i.parseSimulcastStreamList, Fe;
}
var xe = Um();
const Fm = 0.9, Bm = 1e3, qm = 20;
function jm(i, e, t, n) {
  let r = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !1;
  var s, a, o;
  if (!(!((s = i.msid) === null || s === void 0) && s.includes(e)))
    return;
  const c = (o = (a = i.rtp.find((h) => h.codec.toUpperCase() === t.toUpperCase())) === null || a === void 0 ? void 0 : a.payload) !== null && o !== void 0 ? o : 0;
  if (c === 0)
    return 0;
  const d = Math.round(n * Fm), l = r ? d : Math.min(d, Bm), u = i.fmtp.find((h) => h.payload === c);
  return u ? u.config.includes("x-google-start-bitrate") || (u.config += ";x-google-start-bitrate=".concat(l)) : i.fmtp.push({
    payload: c,
    config: "x-google-start-bitrate=".concat(l)
  }), c;
}
const bt = {
  NegotiationStarted: "negotiationStarted",
  NegotiationComplete: "negotiationComplete",
  // Fired with the offerId for every successful publisher answer application,
  // including answers that immediately recurse into another offer via
  // `renegotiate`. Use this rather than NegotiationComplete to know that a
  // specific offer has been negotiated end-to-end.
  OfferAnswered: "offerAnswered",
  RTPVideoPayloadTypes: "rtpVideoPayloadTypes"
};
class to extends Ie.EventEmitter {
  get pc() {
    return this._pc || (this._pc = this.createPC()), this._pc;
  }
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var n;
    super(), this.log = q, this.iceLog = q, this.ddExtID = 0, this.latestOfferId = 0, this.latestAcknowledgedOfferId = 0, this.pendingCandidates = [], this.restartingIce = !1, this.renegotiate = !1, this.trackBitrates = [], this.remoteStereoMids = [], this.remoteNackMids = [], this.negotiate = Gs((r) => m(this, void 0, void 0, function* () {
      this.emit(bt.NegotiationStarted);
      try {
        yield this.createAndSendOffer();
      } catch (s) {
        if (r)
          r(s);
        else
          throw s;
      }
    }), qm), this.close = () => {
      this._pc && (this.log.debug("closing peer connection"), this.pendingInitialOffer = void 0, this._pc.close(), this._pc.onconnectionstatechange = null, this._pc.oniceconnectionstatechange = null, this._pc.onicegatheringstatechange = null, this._pc.ondatachannel = null, this._pc.onnegotiationneeded = null, this._pc.onsignalingstatechange = null, this._pc.onicecandidate = null, this._pc.ondatachannel = null, this._pc.ontrack = null, this._pc.onconnectionstatechange = null, this._pc.oniceconnectionstatechange = null, this._pc = null);
    }, this.loggerOptions = t, this.log = he((n = t.loggerName) !== null && n !== void 0 ? n : te.PCTransport, () => this.logContext), this.iceLog = he(te.ICE, () => this.logContext), this.config = e, this._pc = this.createPC(), this.offerLock = new ue();
  }
  createPC() {
    const e = new RTCPeerConnection(this.config);
    return e.onicecandidate = (t) => {
      var n;
      t.candidate && (this.iceLog.debug("local ICE candidate gathered", {
        candidate: t.candidate.candidate
      }), (n = this.onIceCandidate) === null || n === void 0 || n.call(this, t.candidate));
    }, e.onicecandidateerror = (t) => {
      var n;
      this.iceLog.debug("ICE candidate error", {
        event: t
      }), (n = this.onIceCandidateError) === null || n === void 0 || n.call(this, t);
    }, e.oniceconnectionstatechange = () => {
      var t;
      this.iceLog.debug("ICE connection state: ".concat(e.iceConnectionState)), (t = this.onIceConnectionStateChange) === null || t === void 0 || t.call(this, e.iceConnectionState);
    }, e.onsignalingstatechange = () => {
      var t;
      this.log.debug("signaling state: ".concat(e.signalingState)), (t = this.onSignalingStatechange) === null || t === void 0 || t.call(this, e.signalingState);
    }, e.onconnectionstatechange = () => {
      var t;
      this.log.debug("connection state: ".concat(e.connectionState)), (t = this.onConnectionStateChange) === null || t === void 0 || t.call(this, e.connectionState);
    }, e.ondatachannel = (t) => {
      var n;
      this.log.debug("data channel opened by peer", {
        label: t.channel.label,
        id: t.channel.id
      }), (n = this.onDataChannel) === null || n === void 0 || n.call(this, t);
    }, e.ontrack = (t) => {
      var n;
      (n = this.onTrack) === null || n === void 0 || n.call(this, t);
    }, e;
  }
  get logContext() {
    var e, t;
    return Object.assign({}, (t = (e = this.loggerOptions).loggerContextCb) === null || t === void 0 ? void 0 : t.call(e));
  }
  get isICEConnected() {
    return this._pc !== null && (this.pc.iceConnectionState === "connected" || this.pc.iceConnectionState === "completed");
  }
  addIceCandidate(e) {
    return m(this, void 0, void 0, function* () {
      if (this.pc.remoteDescription && !this.restartingIce)
        return this.pc.addIceCandidate(e);
      this.iceLog.debug("queuing remote ICE candidate until remote description applied", {
        pendingCount: this.pendingCandidates.length + 1
      }), this.pendingCandidates.push(e);
    });
  }
  setRemoteDescription(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r;
      if (e.type === "answer" && this.latestOfferId > 0 && t > 0 && t !== this.latestOfferId)
        return this.log.warn("ignoring answer for old offer", {
          offerId: t,
          latestOfferId: this.latestOfferId
        }), !1;
      let s;
      if (e.type === "offer") {
        let a = zm(e), o = a.stereoMids, c = a.nackMids;
        this.remoteStereoMids = o, this.remoteNackMids = c;
      } else if (e.type === "answer") {
        if (this.pendingInitialOffer && this._pc) {
          const c = this.pendingInitialOffer;
          this.pendingInitialOffer = void 0;
          const d = xe.parse((n = c.sdp) !== null && n !== void 0 ? n : "");
          d.media.forEach((l) => {
            ei(l);
          }), this.log.debug("setting pending initial offer before processing answer"), yield this.setMungedSDP(c, xe.write(d));
        }
        const a = xe.parse((r = e.sdp) !== null && r !== void 0 ? r : "");
        a.media.forEach((c) => {
          const d = Rn(c.mid);
          c.type === "audio" && this.trackBitrates.some((l) => {
            if (!l.transceiver || d != l.transceiver.mid)
              return !1;
            let u = 0;
            if (c.rtp.some((f) => f.codec.toUpperCase() === l.codec.toUpperCase() ? (u = f.payload, !0) : !1), u === 0)
              return !0;
            let h = !1;
            for (const f of c.fmtp)
              if (f.payload === u) {
                f.config = f.config.split(";").filter((g) => !g.includes("maxaveragebitrate")).join(";"), l.maxbr > 0 && (f.config += ";maxaveragebitrate=".concat(l.maxbr * 1e3)), h = !0;
                break;
              }
            return h || l.maxbr > 0 && c.fmtp.push({
              payload: u,
              config: "maxaveragebitrate=".concat(l.maxbr * 1e3)
            }), !0;
          });
        });
        const o = this.getPlaceholderMids();
        o.size > 0 && ro(a.media, (c) => o.has(Rn(c.mid))), s = xe.write(a);
      }
      return yield this.setMungedSDP(e, s, !0), this.pendingCandidates.length > 0 && this.iceLog.debug("flushing queued ICE candidates", {
        count: this.pendingCandidates.length
      }), this.pendingCandidates.forEach((a) => {
        this.pc.addIceCandidate(a);
      }), this.pendingCandidates = [], this.restartingIce = !1, e.type === "answer" && (this.latestAcknowledgedOfferId = t, this.emit(bt.OfferAnswered, t)), this.renegotiate ? (this.renegotiate = !1, yield this.createAndSendOffer()) : e.type === "answer" && (this.emit(bt.NegotiationComplete), e.sdp && xe.parse(e.sdp).media.forEach((o) => {
        o.type === "video" && this.emit(bt.RTPVideoPayloadTypes, o.rtp);
      })), !0;
    });
  }
  createInitialOffer() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.offerLock.lock();
      try {
        if (this.pc.signalingState !== "stable") {
          this.log.warn("signaling state is not stable, cannot create initial offer");
          return;
        }
        const n = this.latestOfferId + 1;
        this.latestOfferId = n;
        const r = yield this.pc.createOffer();
        this.pendingInitialOffer = {
          sdp: r.sdp,
          type: r.type
        };
        const s = xe.parse((e = r.sdp) !== null && e !== void 0 ? e : "");
        return s.media.forEach((a) => {
          ei(a);
        }), r.sdp = xe.write(s), {
          offer: r,
          offerId: n
        };
      } finally {
        t();
      }
    });
  }
  createAndSendOffer(e) {
    return m(this, void 0, void 0, function* () {
      var t;
      const n = yield this.offerLock.lock();
      try {
        if (this.onOffer === void 0)
          return;
        if (e != null && e.iceRestart && (this.iceLog.debug("restarting ICE"), this.restartingIce = !0), this._pc && (this._pc.signalingState === "have-local-offer" || this.pendingInitialOffer)) {
          const c = this._pc.remoteDescription;
          if (e != null && e.iceRestart && c)
            yield this._pc.setRemoteDescription(c);
          else {
            if (e != null && e.iceRestart)
              throw new St("ICE restart requested without a remote description, peer connection must be recreated");
            this.renegotiate = !0, this.log.debug("requesting renegotiation");
            return;
          }
        } else if (!this._pc || this._pc.signalingState === "closed") {
          this.log.warn("could not createOffer with closed peer connection");
          return;
        }
        this.log.debug("starting to negotiate");
        const r = this.latestOfferId + 1;
        this.latestOfferId = r;
        const s = yield this.pc.createOffer(e);
        this.log.debug("original offer", {
          sdp: s.sdp
        });
        const a = xe.parse((t = s.sdp) !== null && t !== void 0 ? t : "");
        a.media.forEach((c) => {
          ei(c), c.type === "audio" ? io(c, ["all"], []) : c.type === "video" && this.trackBitrates.some((d) => {
            if (!d.cid)
              return !1;
            const l = jm(c, d.cid, d.codec, d.maxbr, d.isScreenShare);
            return l === void 0 ? !1 : (l > 0 && Pt(d.codec) && !Vt() && (this.ddExtID = Vm(c, a, this.ddExtID)), !0);
          });
        });
        const o = this.getPlaceholderMids();
        if (o.size > 0 && ro(a.media, (c) => o.has(Rn(c.mid))), this.latestOfferId > r) {
          this.log.warn("latestOfferId mismatch", {
            latestOfferId: this.latestOfferId,
            offerId: r
          });
          return;
        }
        yield this.setMungedSDP(s, xe.write(a)), this.onOffer(s, this.latestOfferId);
      } finally {
        n();
      }
    });
  }
  createAndSetAnswer() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.pc.createAnswer(), n = xe.parse((e = t.sdp) !== null && e !== void 0 ? e : "");
      return n.media.forEach((r) => {
        ei(r), r.type === "audio" && io(r, this.remoteStereoMids, this.remoteNackMids);
      }), yield this.setMungedSDP(t, xe.write(n)), t;
    });
  }
  /**
   * Returns the mids of transceivers that carry no outgoing track on this
   * (publisher) connection: the pre-populated placeholders added by
   * `RTCEngine.applyInitialPublisherLayout`, plus any transceiver that was used
   * for a track and reverted on unpublish. Their codec fmtp is conformed to the
   * published tracks so a shared payload type stays consistent across the bundle.
   */
  getPlaceholderMids() {
    var e, t;
    return Gm((t = (e = this._pc) === null || e === void 0 ? void 0 : e.getTransceivers()) !== null && t !== void 0 ? t : []);
  }
  createDataChannel(e, t) {
    return this.pc.createDataChannel(e, t);
  }
  addTransceiver(e, t) {
    return this.pc.addTransceiver(e, t);
  }
  addTransceiverOfKind(e, t) {
    return this.pc.addTransceiver(e, t);
  }
  addTrack(e) {
    if (!this._pc)
      throw new X("PC closed, cannot add track");
    return this._pc.addTrack(e);
  }
  setTrackCodecBitrate(e) {
    this.trackBitrates.push(e);
  }
  setConfiguration(e) {
    var t;
    if (!this._pc)
      throw new X("PC closed, cannot configure");
    return (t = this._pc) === null || t === void 0 ? void 0 : t.setConfiguration(e);
  }
  canRemoveTrack() {
    var e;
    return !!(!((e = this._pc) === null || e === void 0) && e.removeTrack);
  }
  removeTrack(e) {
    var t;
    return (t = this._pc) === null || t === void 0 ? void 0 : t.removeTrack(e);
  }
  getConnectionState() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.connectionState) !== null && t !== void 0 ? t : "closed";
  }
  getICEConnectionState() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.iceConnectionState) !== null && t !== void 0 ? t : "closed";
  }
  getSignallingState() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.signalingState) !== null && t !== void 0 ? t : "closed";
  }
  getTransceivers() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.getTransceivers()) !== null && t !== void 0 ? t : [];
  }
  getSenders() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.getSenders()) !== null && t !== void 0 ? t : [];
  }
  getLocalDescription() {
    var e;
    return (e = this._pc) === null || e === void 0 ? void 0 : e.localDescription;
  }
  getRemoteDescription() {
    var e;
    return (e = this.pc) === null || e === void 0 ? void 0 : e.remoteDescription;
  }
  /** stats of the underlying connection, `undefined` when there is none */
  getStats() {
    var e;
    return (e = this._pc) === null || e === void 0 ? void 0 : e.getStats();
  }
  getMaxMessageSize() {
    var e, t;
    return (t = (e = this._pc) === null || e === void 0 ? void 0 : e.sctp) === null || t === void 0 ? void 0 : t.maxMessageSize;
  }
  getConnectedAddress() {
    return m(this, void 0, void 0, function* () {
      var e;
      if (!this._pc)
        return;
      let t = "";
      const n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
      if ((yield this._pc.getStats()).forEach((o) => {
        switch (o.type) {
          case "transport":
            t = o.selectedCandidatePairId;
            break;
          case "candidate-pair":
            t === "" && o.selected && (t = o.id), n.set(o.id, o);
            break;
          case "remote-candidate":
            r.set(o.id, "".concat(o.address, ":").concat(o.port));
            break;
        }
      }), t === "")
        return;
      const a = (e = n.get(t)) === null || e === void 0 ? void 0 : e.remoteCandidateId;
      if (a !== void 0)
        return r.get(a);
    });
  }
  setMungedSDP(e, t, n) {
    return m(this, void 0, void 0, function* () {
      var r, s;
      const a = e.sdp;
      if (t) {
        e.sdp = t;
        try {
          this.log.debug("setting munged ".concat(n ? "remote" : "local", " description")), n ? yield this.pc.setRemoteDescription(e) : yield this.pc.setLocalDescription(e);
          return;
        } catch (o) {
          this.log.warn("not able to set ".concat(e.type, ", falling back to unmodified sdp"), {
            error: o,
            mungedSdp: t,
            originalSdp: a
          }), e.sdp = a;
        }
      }
      try {
        n ? yield (r = this._pc) === null || r === void 0 ? void 0 : r.setRemoteDescription(e) : yield (s = this._pc) === null || s === void 0 ? void 0 : s.setLocalDescription(e);
      } catch (o) {
        let c = "unknown error";
        o instanceof Error ? c = o.message : typeof o == "string" && (c = o);
        const d = {
          error: c,
          sdp: e.sdp
        };
        throw t && t !== a && (d.mungedSdp = t), !n && this.pc.remoteDescription && (d.remoteSdp = this.pc.remoteDescription), this.log.error("unable to set ".concat(e.type), {
          fields: d
        }), new St(c);
      }
    });
  }
}
function Vm(i, e, t) {
  var n, r;
  const s = Wm(e, t);
  return s === void 0 ? t : (!((n = i.ext) === null || n === void 0) && n.some((a) => a.uri === en) || ((r = i.ext) !== null && r !== void 0 || (i.ext = []), i.ext.push({
    value: s,
    uri: en
  })), s);
}
function Wm(i, e) {
  const t = Hm(i, en);
  return t !== void 0 ? no(i, t, en) ? void 0 : t : e !== 0 && !no(i, e, en) ? e : Km(i);
}
function Hm(i, e) {
  var t;
  for (const n of i.media) {
    const r = (t = n.ext) === null || t === void 0 ? void 0 : t.find((s) => s.uri === e);
    if (r)
      return r.value;
  }
}
function no(i, e, t) {
  return i.media.some((n) => {
    var r;
    return (r = n.ext) === null || r === void 0 ? void 0 : r.some((s) => s.value === e && s.uri !== t);
  });
}
function Km(i) {
  let e = 0;
  return i.media.forEach((t) => {
    var n;
    (n = t.ext) === null || n === void 0 || n.forEach((r) => {
      r.value > e && (e = r.value);
    });
  }), e + 1 === 15 ? 16 : e + 1;
}
function qd(i, e) {
  return i.split(";").some((t) => t.trim() === e);
}
function io(i, e, t) {
  const n = Rn(i.mid);
  let r = 0;
  i.rtp.some((s) => s.codec.toLowerCase() === "opus" ? (r = s.payload, !0) : !1), r > 0 && (i.rtcpFb || (i.rtcpFb = []), t.includes(n) && !i.rtcpFb.some((s) => s.payload === r && s.type === "nack") && i.rtcpFb.push({
    payload: r,
    type: "nack"
  }), (e.includes(n) || e.length === 1 && e[0] === "all") && i.fmtp.some((s) => s.payload === r ? (qd(s.config, "stereo=1") || (s.config += ";stereo=1"), !0) : !1));
}
function Gm(i) {
  const e = /* @__PURE__ */ new Set();
  for (const t of i)
    t.mid && !t.sender.track && e.add(t.mid);
  return e;
}
function ro(i, e) {
  var t, n;
  const r = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Set();
  for (const a of i) {
    const o = e(a);
    for (const c of (t = a.fmtp) !== null && t !== void 0 ? t : [])
      o ? r.has(c.payload) || r.set(c.payload, c.config) : (r.set(c.payload, c.config), s.add(c.payload));
  }
  if (r.size !== 0) {
    for (const a of i)
      if (e(a))
        for (const o of (n = a.fmtp) !== null && n !== void 0 ? n : []) {
          const c = r.get(o.payload);
          c !== void 0 && o.config !== c && (o.config = c);
        }
  }
}
function zm(i) {
  var e;
  const t = [], n = [], r = xe.parse((e = i.sdp) !== null && e !== void 0 ? e : "");
  let s = 0;
  return r.media.forEach((a) => {
    var o;
    const c = Rn(a.mid);
    a.type === "audio" && (a.rtp.some((d) => d.codec.toLowerCase() === "opus" ? (s = d.payload, !0) : !1), !((o = a.rtcpFb) === null || o === void 0) && o.some((d) => d.payload === s && d.type === "nack") && n.push(c), a.fmtp.some((d) => d.payload === s ? (qd(d.config, "sprop-stereo=1") && t.push(c), !0) : !1));
  }), {
    stereoMids: t,
    nackMids: n
  };
}
function ei(i) {
  if (i.connection) {
    const e = i.connection.ip.indexOf(":") >= 0;
    (i.connection.version === 4 && e || i.connection.version === 6 && !e) && (i.connection.ip = "0.0.0.0", i.connection.version = 4);
  }
}
function Rn(i) {
  return typeof i == "number" ? i.toFixed(0) : i;
}
const gs = "vp8", Jm = {
  audioPreset: ss.music,
  dtx: !0,
  red: !0,
  forceStereo: !1,
  simulcast: !0,
  screenShareEncoding: zi.h1080fps15.encoding,
  stopMicTrackOnMute: !1,
  videoCodec: gs,
  backupCodec: !0,
  preConnectBuffer: !1
}, jd = {
  deviceId: {
    ideal: "default"
  },
  autoGainControl: !0,
  echoCancellation: !0,
  noiseSuppression: !0,
  voiceIsolation: !0
}, Vd = {
  deviceId: {
    ideal: "default"
  },
  resolution: Un.h720.resolution
}, Qm = {
  adaptiveStream: !1,
  dynacast: !1,
  stopLocalTrackOnUnpublish: !0,
  reconnectPolicy: new jh(),
  disconnectOnPageLeave: !0,
  webAudioMix: !1,
  singlePeerConnection: !0
}, Zs = {
  autoSubscribe: !0,
  maxRetries: 1,
  peerConnectionTimeout: 15e3,
  websocketTimeout: 15e3
};
var $;
(function(i) {
  i[i.NEW = 0] = "NEW", i[i.CONNECTING = 1] = "CONNECTING", i[i.CONNECTED = 2] = "CONNECTED", i[i.FAILED = 3] = "FAILED", i[i.CLOSING = 4] = "CLOSING", i[i.CLOSED = 5] = "CLOSED";
})($ || ($ = {}));
class so {
  get needsPublisher() {
    return this.isPublisherConnectionRequired;
  }
  get needsSubscriber() {
    return this.isSubscriberConnectionRequired;
  }
  get currentState() {
    return this.state;
  }
  get mode() {
    return this._mode;
  }
  constructor(e, t, n) {
    var r;
    this.peerConnectionTimeout = Zs.peerConnectionTimeout, this.log = q, this.iceLog = q, this.updateState = () => {
      var s, a;
      const o = this.state, c = this.requiredTransports.map((d) => d.getConnectionState());
      c.every((d) => d === "connected") ? this.state = $.CONNECTED : c.some((d) => d === "failed") ? this.state = $.FAILED : c.some((d) => d === "connecting") ? this.state = $.CONNECTING : c.every((d) => d === "closed") ? this.state = $.CLOSED : c.some((d) => d === "closed") ? this.state = $.CLOSING : c.every((d) => d === "new") && (this.state = $.NEW), o !== this.state && (this.log.debug("pc state change: from ".concat($[o], " to ").concat($[this.state])), (s = this.onStateChange) === null || s === void 0 || s.call(this, this.state, this.publisher.getConnectionState(), (a = this.subscriber) === null || a === void 0 ? void 0 : a.getConnectionState()));
    }, this.loggerOptions = t, this.log = he((r = t.loggerName) !== null && r !== void 0 ? r : te.PCManager, () => this.logContext), this.iceLog = he(te.ICE, () => this.logContext), this.isPublisherConnectionRequired = e !== "subscriber-primary", this.isSubscriberConnectionRequired = e === "subscriber-primary", this.publisher = new to(n, t), this._mode = e, e !== "publisher-only" && (this.subscriber = new to(n, t), this.subscriber.onConnectionStateChange = this.updateState, this.subscriber.onIceConnectionStateChange = this.updateState, this.subscriber.onSignalingStatechange = this.updateState, this.subscriber.onIceCandidate = (s) => {
      var a;
      (a = this.onIceCandidate) === null || a === void 0 || a.call(this, s, Ve.SUBSCRIBER);
    }, this.subscriber.onDataChannel = (s) => {
      var a;
      (a = this.onDataChannel) === null || a === void 0 || a.call(this, s);
    }, this.subscriber.onTrack = (s) => {
      var a;
      (a = this.onTrack) === null || a === void 0 || a.call(this, s);
    }), this.publisher.onConnectionStateChange = this.updateState, this.publisher.onIceConnectionStateChange = this.updateState, this.publisher.onSignalingStatechange = this.updateState, this.publisher.onIceCandidate = (s) => {
      var a;
      (a = this.onIceCandidate) === null || a === void 0 || a.call(this, s, Ve.PUBLISHER);
    }, this.publisher.onTrack = (s) => {
      var a;
      (a = this.onTrack) === null || a === void 0 || a.call(this, s);
    }, this.publisher.onOffer = (s, a) => {
      var o;
      (o = this.onPublisherOffer) === null || o === void 0 || o.call(this, s, a);
    }, this.state = $.NEW, this.connectionLock = new ue(), this.remoteOfferLock = new ue();
  }
  get logContext() {
    var e, t;
    return Object.assign({}, (t = (e = this.loggerOptions).loggerContextCb) === null || t === void 0 ? void 0 : t.call(e));
  }
  requirePublisher() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
    this.isPublisherConnectionRequired = e, this.updateState();
  }
  createAndSendPublisherOffer(e) {
    return this.publisher.createAndSendOffer(e);
  }
  setPublisherAnswer(e, t) {
    return this.publisher.setRemoteDescription(e, t);
  }
  removeTrack(e) {
    return this.publisher.removeTrack(e);
  }
  close() {
    return m(this, void 0, void 0, function* () {
      var e;
      if (this.publisher && this.publisher.getSignallingState() !== "closed") {
        const t = this.publisher;
        for (const n of t.getSenders())
          try {
            t.canRemoveTrack() && t.removeTrack(n);
          } catch (r) {
            this.log.warn("could not removeTrack", {
              error: r
            });
          }
      }
      yield Promise.all([this.publisher.close(), (e = this.subscriber) === null || e === void 0 ? void 0 : e.close()]), this.updateState();
    });
  }
  /**
   * Restarts ICE on the transports that need it. Only the publisher: the server restarts the
   * subscriber's ICE itself and follows with a fresh offer.
   *
   * The subscriber deliberately does NOT enter `restartingIce` here. Queueing its remote
   * candidates would guard against candidates for a new generation arriving before the offer
   * that introduces it, but the server does not send them in that order -- on a same-node
   * resume it buffers them until the offer has gone out, and on a reconnect that lands on
   * another node it withholds subscriber candidates until immediately before creating the
   * offer. Setting the flag only risks withholding candidates during the window that decides
   * whether the reconnect succeeded.
   */
  triggerIceRestart() {
    return m(this, void 0, void 0, function* () {
      this.iceLog.warn("triggering ICE restart"), this.needsPublisher && (yield this.createAndSendPublisherOffer({
        iceRestart: !0
      }));
    });
  }
  addIceCandidate(e, t) {
    return m(this, void 0, void 0, function* () {
      var n;
      this.iceLog.debug("adding remote ICE candidate", {
        target: t,
        candidate: e
      }), t === Ve.PUBLISHER ? yield this.publisher.addIceCandidate(e) : yield (n = this.subscriber) === null || n === void 0 ? void 0 : n.addIceCandidate(e);
    });
  }
  createSubscriberAnswerFromOffer(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r, s;
      this.log.debug("received server offer", {
        RTCSdpType: e.type,
        sdp: e.sdp,
        signalingState: (n = this.subscriber) === null || n === void 0 ? void 0 : n.getSignallingState().toString()
      });
      const a = yield this.remoteOfferLock.lock();
      try {
        return (yield (r = this.subscriber) === null || r === void 0 ? void 0 : r.setRemoteDescription(e, t)) ? yield (s = this.subscriber) === null || s === void 0 ? void 0 : s.createAndSetAnswer() : void 0;
      } finally {
        a();
      }
    });
  }
  updateConfiguration(e, t) {
    var n;
    this.log.debug("updating rtc configuration", {
      iceRestart: t
    }), this.publisher.setConfiguration(e), (n = this.subscriber) === null || n === void 0 || n.setConfiguration(e), t && this.triggerIceRestart();
  }
  ensurePCTransportConnection(e, t) {
    return m(this, void 0, void 0, function* () {
      var n;
      const r = yield this.connectionLock.lock();
      try {
        this.isPublisherConnectionRequired && this.publisher.getConnectionState() !== "connected" && this.publisher.getConnectionState() !== "connecting" && (this.log.debug("negotiation required, start negotiating"), this.publisher.negotiate()), yield Promise.all((n = this.requiredTransports) === null || n === void 0 ? void 0 : n.map((s) => this.ensureTransportConnected(s, e, t)));
      } finally {
        r();
      }
    });
  }
  negotiate(e) {
    return m(this, void 0, void 0, function* () {
      return new Ee((t, n) => {
        const r = this.publisher.latestOfferId;
        if (this.publisher.latestAcknowledgedOfferId > r) {
          this.log.debug("negotiation already handled in more recent acknowledged offer", this.logContext), t();
          return;
        }
        let s = !1;
        const a = () => {
          s || (s = !0, clearTimeout(d), this.publisher.off(bt.OfferAnswered, o), e.signal.removeEventListener("abort", c));
        }, o = (l) => {
          l > r && (a(), t());
        }, c = () => {
          a(), n(new St("negotiation aborted"));
        }, d = setTimeout(() => {
          a(), n(new St("negotiation timed out"));
        }, this.peerConnectionTimeout);
        e.signal.addEventListener("abort", c), this.publisher.on(bt.OfferAnswered, o), this.publisher.negotiate((l) => {
          a(), l instanceof Error ? n(l) : n(new Error(String(l)));
        });
      });
    });
  }
  addPublisherTransceiver(e, t) {
    return this.publisher.addTransceiver(e, t);
  }
  addPublisherTransceiverOfKind(e, t) {
    return this.publisher.addTransceiverOfKind(e, t);
  }
  getMidForReceiver(e) {
    const n = (this.subscriber ? this.subscriber.getTransceivers() : this.publisher.getTransceivers()).find((r) => r.receiver === e);
    return n == null ? void 0 : n.mid;
  }
  getMaxPublisherMessageSize() {
    return this.publisher.getMaxMessageSize();
  }
  addPublisherTrack(e) {
    return this.publisher.addTrack(e);
  }
  createPublisherDataChannel(e, t) {
    return this.publisher.createDataChannel(e, t);
  }
  /**
   * Returns the first required transport's address if no explicit target is specified
   */
  getConnectedAddress(e) {
    return e === Ve.PUBLISHER ? this.publisher.getConnectedAddress() : e === Ve.SUBSCRIBER ? this.publisher.getConnectedAddress() : this.requiredTransports[0].getConnectedAddress();
  }
  get requiredTransports() {
    const e = [];
    return this.isPublisherConnectionRequired && e.push(this.publisher), this.isSubscriberConnectionRequired && this.subscriber && e.push(this.subscriber), e;
  }
  ensureTransportConnected(e, t) {
    return m(this, arguments, void 0, function(n, r) {
      var s = this;
      let a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : this.peerConnectionTimeout;
      return (function* () {
        if (n.getConnectionState() !== "connected")
          return new Promise((c, d) => m(s, void 0, void 0, function* () {
            const l = () => {
              this.log.warn("abort transport connection"), Q.clearTimeout(u), d(x.cancelled("room connection has been cancelled"));
            };
            r != null && r.signal.aborted && l(), r == null || r.signal.addEventListener("abort", l);
            const u = Q.setTimeout(() => {
              r == null || r.signal.removeEventListener("abort", l), d(x.internal("could not establish pc connection"));
            }, a);
            for (; this.state !== $.CONNECTED; )
              if (yield ke(50), r != null && r.signal.aborted) {
                d(x.cancelled("room connection has been cancelled"));
                return;
              }
            Q.clearTimeout(u), r == null || r.signal.removeEventListener("abort", l), c();
          }));
      })();
    });
  }
}
class Wd {
  constructor(e) {
    this.bufferStatusLow = !0, this.headroomLock = new ue(), this.waiterAbortController = new AbortController(), this.kind = e.kind, this.lowWaterMark = e.lowWaterMark, this.highWaterMark = e.highWaterMark, this.isEngineClosed = e.isEngineClosed, this.onBufferStatusChanged = e.onBufferStatusChanged;
  }
  /** The currently attached RTCDataChannel handle, if any. */
  get channelHandle() {
    return this.handle;
  }
  /**
   * Attaches the channel handle this wrapper controls. Replacing an existing handle rejects
   * parked waiters — their events would never fire again on the abandoned object — and installs a
   * fresh controller, so queued senders re-check against the new channel. Wrappers outlive their
   * handles: this is the one place handle turnover happens, which is what makes stranding a
   * waiter structurally impossible.
   */
  attach(e) {
    this.handle && this.handle !== e && this.invalidateWaiters("data channel replaced"), this.handle = e;
  }
  /** Detaches the handle on teardown, rejecting parked waiters. */
  detach() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "data channel torn down";
    this.handle && this.invalidateWaiters(e), this.handle = void 0;
  }
  getChannel() {
    return this.handle;
  }
  /**
   * Whether the send buffer has room to accept more data (the send gate). Senders proceed while
   * this is true and block once it goes false. Callers resolve the handle (and decide what an
   * absent one means) before asking.
   */
  isBelowHighWaterMark(e) {
    return e.bufferedAmount <= this.highWaterMark;
  }
  /**
   * Whether the send buffer has drained to its low-water mark. Drives the engine's public
   * DCBufferStatusChanged event.
   */
  isBelowLowWaterMark(e) {
    return e.bufferedAmount <= e.bufferedAmountLowThreshold;
  }
  /**
   * Acquires the headroom lock, resolving with the unlock function. Batch senders (the resume
   * replay) hold it across all of their sends so no other sender can interleave, calling
   * {@link waitForHeadroomWithoutLock} per message to respect flow control within the batch.
   */
  lockHeadroom() {
    return this.headroomLock.lock();
  }
  /**
   * Resolves once the caller may send on this channel: immediately while the send buffer is at or
   * below its high-water mark, otherwise once the buffer has drained to the low-water mark (the
   * `bufferedamountlow` event). Callers are serialized through the headroom lock so that, when
   * the buffer drains, they refill it one at a time (up to the high-water mark) rather than all
   * sending at once and overflowing the SCTP send buffer (see livekit/client-sdk-js#1995). The
   * closed/buffer checks run inside the lock so queued callers proceed in FIFO order.
   */
  waitForHeadroomWithLock() {
    return m(this, void 0, void 0, function* () {
      const e = yield this.lockHeadroom();
      try {
        yield this.waitForHeadroomWithoutLock();
      } finally {
        e();
      }
    });
  }
  /** Core wait of {@link waitForHeadroomWithLock}. The caller must hold the headroom lock. */
  waitForHeadroomWithoutLock() {
    return m(this, void 0, void 0, function* () {
      if (this.isEngineClosed())
        throw new X("engine closed");
      const e = this.getChannel();
      if (!e)
        throw new X("DataChannel not found, kind: ".concat(this.kind));
      if (this.isBelowHighWaterMark(e))
        return;
      const t = this.waiterAbortController.signal;
      yield new Ee((n, r) => {
        const s = () => {
          c(), n();
        }, a = () => {
          c(), r(new X("DataChannel ".concat(this.kind, " closed while draining the buffer")));
        }, o = () => {
          c(), r(new X("DataChannel ".concat(this.kind, " was replaced or torn down while waiting for headroom")));
        }, c = () => {
          e.removeEventListener("bufferedamountlow", s), e.removeEventListener("close", a), t.removeEventListener("abort", o);
        };
        if (t.aborted) {
          o();
          return;
        }
        e.addEventListener("bufferedamountlow", s), e.addEventListener("close", a), t.addEventListener("abort", o);
      });
    });
  }
  /** Rejects all parked headroom waiters; the next waiter gets a fresh controller. */
  invalidateWaiters(e) {
    this.waiterAbortController.abort(e), this.waiterAbortController = new AbortController();
  }
  /**
   * Recomputes whether the buffer has drained to the low-water mark and, if that changed since the
   * last check, notifies the status listener. Two independent triggers land here: a send (which
   * raises the buffer) and the `bufferedamountlow` drain event (which lowers it) — the latter has
   * no send to hang the work off, which is why this is a shared entry point rather than a tail of
   * `send`.
   */
  refreshBufferStatus() {
    var e;
    const t = this.getChannel();
    if (!t)
      return;
    const n = this.isBelowLowWaterMark(t);
    n !== this.bufferStatusLow && (this.bufferStatusLow = n, (e = this.onBufferStatusChanged) === null || e === void 0 || e.call(this, n));
  }
}
class ao extends Wd {
  constructor(e) {
    super(e), this.statCurrentBytes = 0, this.statByterate = 0, this.dropCount = 0, this.bufferFullBehavior = e.bufferFullBehavior, this.shouldSkipSends = e.shouldSkipSends;
  }
  /** Sends prepared bytes with this channel's full-buffer policy (drop or wait). */
  send(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.getChannel();
      if (t) {
        switch (this.bufferFullBehavior) {
          case "wait":
            this.isBelowHighWaterMark(t) || (yield this.waitForHeadroomWithLock());
            break;
          case "drop":
            if (!this.isBelowLowWaterMark(t)) {
              this.dropCount += 1, this.dropCount % 100 === 0 && q.warn("dropping lossy data channel messages, total dropped: ".concat(this.dropCount));
              return;
            }
        }
        if (this.statCurrentBytes += e.byteLength, !this.shouldSkipSends())
          try {
            t.send(e), this.refreshBufferStatus();
          } catch (n) {
            if (n instanceof TypeError)
              q.error(n);
            else
              throw n;
          }
      }
    });
  }
  /**
   * Starts the once-per-second adjustment of the channel's `bufferedAmountLowThreshold` to the
   * observed byterate, keeping the drop gate at roughly 100ms of buffered latency (clamped to
   * the watermarks). Restarts cleanly if already running.
   */
  startThresholdTuning() {
    this.stopThresholdTuning(), this.statInterval = Q.setInterval(() => {
      this.statByterate = this.statCurrentBytes, this.statCurrentBytes = 0;
      const e = this.getChannel();
      if (e) {
        const t = this.statByterate / 10;
        e.bufferedAmountLowThreshold = Math.min(Math.max(t, this.lowWaterMark), this.highWaterMark);
      }
    }, 1e3);
  }
  /** Stops the threshold tuning and resets the stats and drop counter. */
  stopThresholdTuning() {
    this.statByterate = 0, this.statCurrentBytes = 0, this.statInterval && (Q.clearInterval(this.statInterval), this.statInterval = void 0), this.dropCount = 0;
  }
}
class oo {
  constructor() {
    this.buffer = [], this._totalSize = 0, this._sentSize = 0;
  }
  push(e) {
    this.buffer.push(e), this._totalSize += e.data.byteLength, e.sent && (this._sentSize += e.data.byteLength);
  }
  pop() {
    const e = this.buffer.shift();
    return e && (this._totalSize -= e.data.byteLength, e.sent && (this._sentSize -= e.data.byteLength)), e;
  }
  getAll() {
    return this.buffer.slice();
  }
  /** Every queued packet not yet handed to the channel, in sequence order. */
  getUnsent() {
    return this.buffer.filter((e) => !e.sent);
  }
  /** Marks a single queued packet as handed to the channel. */
  markSent(e) {
    e.sent || (e.sent = !0, this._sentSize += e.data.byteLength);
  }
  /**
   * Marks every queued packet as not-yet-sent. Used at the start of a resume replay: whatever is
   * still buffered was sent on the previous channel (or deferred) and must be re-handed to the
   * current one, so none of it counts as sent until the replay actually transmits it.
   */
  markAllUnsent() {
    for (const e of this.buffer)
      e.sent = !1;
    this._sentSize = 0;
  }
  popToSequence(e) {
    for (; this.buffer.length > 0 && this.buffer[0].sequence <= e; )
      this.pop();
  }
  alignBufferedAmount(e) {
    for (; this.buffer.length > 0; ) {
      const t = this.buffer[0];
      if (!t.sent || this._sentSize - t.data.byteLength <= e)
        break;
      this.pop();
    }
  }
  get length() {
    return this.buffer.length;
  }
}
class Ym extends Wd {
  constructor(e) {
    super(e), this.messageBuffer = new oo(), this.sequence = 1, this.isDeferringSends = e.isDeferringSends;
  }
  /**
   * Claims the next packet sequence. The caller stamps it into the packet before serialization,
   * then passes it back to {@link send} so the replay buffer stays keyed by wire sequence.
   */
  nextSequence() {
    const e = this.sequence;
    return this.sequence += 1, e;
  }
  /**
   * Sends prepared bytes with reliable semantics. Resolves once the packet has either been handed
   * to the channel or queued for the resume replay; throws only when the engine is closed.
   */
  send(e, t) {
    return m(this, void 0, void 0, function* () {
      if (this.isDeferringSends()) {
        this.messageBuffer.push({
          data: e,
          sequence: t,
          sent: !1
        });
        return;
      }
      const n = this.getChannel();
      if (n) {
        try {
          yield this.waitForHeadroomWithLock();
        } catch (r) {
          if (this.isEngineClosed())
            throw r;
          this.messageBuffer.push({
            data: e,
            sequence: t,
            sent: !1
          });
          return;
        }
        if (this.isDeferringSends()) {
          this.messageBuffer.push({
            data: e,
            sequence: t,
            sent: !1
          });
          return;
        }
        this.messageBuffer.push({
          data: e,
          sequence: t,
          sent: !0
        }), n.send(e), this.refreshBufferStatus();
      }
    });
  }
  /**
   * Replays the buffered backlog after a resume: drops everything the server acked
   * (`lastMessageSeq`), then re-sends the rest in order. The headroom lock is held across the
   * whole replay — releasing it between messages would let a concurrent send (whose newer
   * sequence was already assigned before it queued on the lock) hit the wire mid-replay, and
   * receivers would then discard the remaining lower-sequence resent messages as duplicates.
   */
  replay(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.getChannel();
      if (!t)
        return;
      this.messageBuffer.popToSequence(e);
      const n = yield this.lockHeadroom();
      try {
        this.messageBuffer.markAllUnsent();
        for (let r = this.messageBuffer.getUnsent(); r.length > 0; r = this.messageBuffer.getUnsent())
          for (const s of r)
            yield this.waitForHeadroomWithoutLock(), t.send(s.data), this.messageBuffer.markSent(s);
      } finally {
        n();
      }
      this.refreshBufferStatus();
    });
  }
  /**
   * Before recomputing status, trim packets the transport has now delivered — a send or a drain
   * may have acked buffered packets, and the replay buffer is keyed off the channel's buffered
   * bytes.
   */
  refreshBufferStatus() {
    const e = this.channelHandle;
    e && this.messageBuffer.alignBufferedAmount(e.bufferedAmount), super.refreshBufferStatus();
  }
  /**
   * Drops all replay state and restarts sequencing. Only valid on a full reconnect, where the
   * session (and the receivers' sequence tracking) starts over.
   */
  reset() {
    this.messageBuffer = new oo(), this.sequence = 1;
  }
}
var V;
(function(i) {
  i[i.RELIABLE = 0] = "RELIABLE", i[i.LOSSY = 1] = "LOSSY", i[i.DATA_TRACK_LOSSY = 2] = "DATA_TRACK_LOSSY";
})(V || (V = {}));
const $m = 64 * 1024, Xm = 1024 * 1024, Zm = 8 * 1024, ep = 256 * 1024;
function tp(i) {
  return i === V.RELIABLE ? $m : Zm;
}
function np(i) {
  return i === V.RELIABLE ? Xm : ep;
}
const co = "_lossy", lo = "_reliable", uo = "_data_track";
class ip {
  constructor(e) {
    this.opts = e;
    const t = (n) => ({
      kind: n,
      lowWaterMark: tp(n),
      highWaterMark: np(n),
      isEngineClosed: e.isEngineClosed,
      onBufferStatusChanged: (r) => e.onBufferStatusChanged(n, r)
    });
    this.reliable = new Ym(Object.assign(Object.assign({}, t(V.RELIABLE)), {
      isDeferringSends: e.isReconnecting
    })), this.lossy = new ao(Object.assign(Object.assign({}, t(V.LOSSY)), {
      // Classic lossy user data: a stale packet is worthless, so drop instead of queueing.
      bufferFullBehavior: "drop",
      shouldSkipSends: e.isReconnecting
    })), this.dataTrack = new ao(Object.assign(Object.assign({}, t(V.DATA_TRACK_LOSSY)), {
      // Data tracks backpressure the producer instead — it decides what to skip at frame
      // granularity rather than the engine dropping arbitrary chunks out of frames.
      bufferFullBehavior: "wait",
      shouldSkipSends: e.isReconnecting
    }));
  }
  /** The flow-control wrapper for `kind`. */
  channelFor(e) {
    switch (e) {
      case V.RELIABLE:
        return this.reliable;
      case V.LOSSY:
        return this.lossy;
      case V.DATA_TRACK_LOSSY:
        return this.dataTrack;
    }
  }
  /** The raw RTCDataChannel handle for `kind`, publisher side by default. */
  getHandle(e) {
    if (!(arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1))
      return this.channelFor(e).channelHandle;
    switch (e) {
      case V.RELIABLE:
        return this.reliableSub;
      case V.LOSSY:
        return this.lossySub;
      case V.DATA_TRACK_LOSSY:
        return this.dataTrackSub;
    }
  }
  get hasPublisherChannels() {
    return !!(this.reliable.channelHandle || this.lossy.channelHandle || this.dataTrack.channelHandle);
  }
  /**
   * Creates the three publisher data channels on the given transport, wires their handlers, and
   * attaches them to the wrappers — attaching rejects any waiters still parked on replaced
   * channel objects.
   */
  createPublisherChannels(e) {
    for (const n of [this.lossy, this.reliable, this.dataTrack]) {
      const r = n.channelHandle;
      r && (r.onmessage = null, r.onerror = null, r.onclose = null);
    }
    const t = (n, r, s) => {
      r.onmessage = s, r.onerror = this.opts.onDataError, r.onclose = () => this.opts.onChannelClose(n.kind), r.bufferedAmountLowThreshold = n.lowWaterMark, r.onbufferedamountlow = () => n.refreshBufferStatus(), n.attach(r);
    };
    t(this.lossy, e.createPublisherDataChannel(co, {
      ordered: !1,
      maxRetransmits: 0
    }), this.opts.onDataMessage), t(this.reliable, e.createPublisherDataChannel(lo, {
      ordered: !0
    }), this.opts.onDataMessage), t(this.dataTrack, e.createPublisherDataChannel(uo, {
      ordered: !1,
      maxRetransmits: 0
    }), this.opts.onDataTrackMessage), this.lossy.startThresholdTuning();
  }
  /**
   * Adopts a subscriber-side data channel by label, wiring the matching receive handler.
   * Returns false for labels this manager doesn't own.
   */
  adoptSubscriberChannel(e) {
    let t;
    if (e.label === lo)
      this.reliableSub = e, t = this.opts.onDataMessage;
    else if (e.label === co)
      this.lossySub = e, t = this.opts.onDataMessage;
    else if (e.label === uo)
      this.dataTrackSub = e, t = this.opts.onDataTrackMessage;
    else
      return !1;
    return e.onmessage = t, !0;
  }
  /**
   * Tears down all channels for a peer-connection cleanup: rejects parked waiters (detach — the
   * spec allows `pc.close()` to transition channels to 'closed' without firing events, so waiting
   * for browser close events is not an option), strips handlers, closes the handles, and resets
   * the reliable session state.
   */
  teardown() {
    const e = (t) => {
      t && (t.onbufferedamountlow = null, t.onclose = null, t.onclosing = null, t.onerror = null, t.onmessage = null, t.onopen = null, t.close());
    };
    for (const t of [this.lossy, this.reliable, this.dataTrack]) {
      const n = t.channelHandle;
      t.detach("peer connections cleaned up"), e(n);
    }
    e(this.lossySub), e(this.reliableSub), e(this.dataTrackSub), this.lossySub = void 0, this.reliableSub = void 0, this.dataTrackSub = void 0, this.reliable.reset();
  }
}
const ea = typeof MediaRecorder < "u";
class rp {
  constructor() {
    throw new Error("MediaRecorder is not available in this environment");
  }
}
const sp = ea ? MediaRecorder : rp;
class ap extends sp {
  constructor(e, t) {
    if (!ea)
      throw new Error("MediaRecorder is not available in this environment");
    super(new MediaStream([e.mediaStreamTrack]), t);
    let n, r;
    const s = () => r === void 0, a = () => {
      this.removeEventListener("dataavailable", n), this.removeEventListener("stop", a), this.removeEventListener("error", o), r == null || r.close(), r = void 0;
    }, o = (c) => {
      r == null || r.error(c), this.removeEventListener("dataavailable", n), this.removeEventListener("stop", a), this.removeEventListener("error", o), r = void 0;
    };
    this.byteStream = new ReadableStream({
      start: (c) => {
        r = c, n = (d) => m(this, void 0, void 0, function* () {
          let l;
          if (d.data.arrayBuffer) {
            const u = yield d.data.arrayBuffer();
            l = new Uint8Array(u);
          } else if (d.data.byteArray)
            l = d.data.byteArray;
          else
            throw new Error("no data available!");
          s() || c.enqueue(l);
        }), this.addEventListener("dataavailable", n);
      },
      cancel: () => {
        a();
      }
    }), this.addEventListener("stop", a), this.addEventListener("error", o);
  }
}
function op() {
  return ea;
}
const cp = 1e3, dp = 1e4;
class Hd extends E {
  /** @internal */
  get sender() {
    return this._sender;
  }
  /** @internal */
  set sender(e) {
    this._sender = e;
  }
  get constraints() {
    return this._constraints;
  }
  get hasPreConnectBuffer() {
    return !!this.localTrackRecorder;
  }
  /**
   *
   * @param mediaTrack
   * @param kind
   * @param constraints MediaTrackConstraints that are being used when restarting or reacquiring tracks
   * @param userProvidedTrack Signals to the SDK whether or not the mediaTrack should be managed (i.e. released and reacquired) internally by the SDK
   */
  constructor(e, t, n) {
    let r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !1, s = arguments.length > 4 ? arguments[4] : void 0;
    super(e, t, s), this.manuallyStopped = !1, this.pendingDeviceChange = !1, this._isUpstreamPaused = !1, this.handleTrackMuteEvent = () => this.debouncedTrackMuteHandler().catch(() => this.log.debug("track mute bounce got cancelled by an unmute event", this.logContext)), this.debouncedTrackMuteHandler = Gs(() => m(this, void 0, void 0, function* () {
      yield this.pauseUpstream();
    }), 5e3), this.handleTrackUnmuteEvent = () => m(this, void 0, void 0, function* () {
      this.debouncedTrackMuteHandler.cancel("unmute"), yield this.resumeUpstream();
    }), this.handleEnded = () => {
      this.isInBackground && (this.reacquireTrack = !0), this._mediaStreamTrack.removeEventListener("mute", this.handleTrackMuteEvent), this._mediaStreamTrack.removeEventListener("unmute", this.handleTrackUnmuteEvent), this.emit(R.Ended, this);
    }, this.reacquireTrack = !1, this.providedByUser = r, this.muteLock = new ue(), this.pauseUpstreamLock = new ue(), this.trackChangeLock = new ue(), this.trackChangeLock.lock().then((a) => m(this, void 0, void 0, function* () {
      try {
        yield this.setMediaStreamTrack(e, !0);
      } finally {
        a();
      }
    })), this._constraints = e.getConstraints(), n && (this._constraints = n);
  }
  get id() {
    return this._mediaStreamTrack.id;
  }
  get dimensions() {
    if (this.kind !== E.Kind.Video)
      return;
    const e = this._mediaStreamTrack.getSettings(), t = e.width, n = e.height;
    if (t && n)
      return {
        width: t,
        height: n
      };
  }
  get isUpstreamPaused() {
    return this._isUpstreamPaused;
  }
  get isUserProvided() {
    return this.providedByUser;
  }
  get mediaStreamTrack() {
    var e, t;
    return (t = (e = this.processor) === null || e === void 0 ? void 0 : e.processedTrack) !== null && t !== void 0 ? t : this._mediaStreamTrack;
  }
  get isLocal() {
    return !0;
  }
  /**
   * @internal
   * returns mediaStreamTrack settings of the capturing mediastreamtrack source - ignoring processors
   */
  getSourceTrackSettings() {
    return this._mediaStreamTrack.getSettings();
  }
  setMediaStreamTrack(e, t, n) {
    return m(this, void 0, void 0, function* () {
      var r;
      if (e === this._mediaStreamTrack && !t)
        return;
      this._mediaStreamTrack && (this.attachedElements.forEach((a) => {
        Zt(this._mediaStreamTrack, a);
      }), this.debouncedTrackMuteHandler.cancel("new-track"), this._mediaStreamTrack.removeEventListener("ended", this.handleEnded), this._mediaStreamTrack.removeEventListener("mute", this.handleTrackMuteEvent), this._mediaStreamTrack.removeEventListener("unmute", this.handleTrackUnmuteEvent)), this.mediaStream = new MediaStream([e]), e && (e.addEventListener("ended", this.handleEnded), e.addEventListener("mute", this.handleTrackMuteEvent), e.addEventListener("unmute", this.handleTrackUnmuteEvent), this._constraints = e.getConstraints());
      let s;
      if (this.processor && e) {
        if (this.log.debug("restarting processor", this.logContext), this.kind === "unknown")
          throw TypeError("cannot set processor on track of unknown kind");
        this.processorElement && (Qt(e, this.processorElement), this.processorElement.muted = !0), yield this.processor.restart({
          track: e,
          kind: this.kind,
          element: this.processorElement,
          localTrack: this
        }), s = this.processor.processedTrack;
      }
      this.sender && ((r = this.sender.transport) === null || r === void 0 ? void 0 : r.state) !== "closed" && (yield this.sender.replaceTrack(s ?? e)), !this.providedByUser && this._mediaStreamTrack !== e && this._mediaStreamTrack.stop(), this._mediaStreamTrack = e, e && (this._mediaStreamTrack.enabled = n ? !0 : !this.isMuted, yield this.resumeUpstream(), this.attachedElements.forEach((a) => {
        Qt(s ?? e, a);
      }));
    });
  }
  waitForDimensions() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : cp;
      return (function* () {
        var n;
        if (e.kind === E.Kind.Audio)
          throw new Error("cannot get dimensions for audio tracks");
        ((n = ye()) === null || n === void 0 ? void 0 : n.os) === "iOS" && (yield ke(10));
        const r = Date.now();
        for (; Date.now() - r < t; ) {
          const s = e.dimensions;
          if (s)
            return s;
          yield ke(50);
        }
        throw new et("unable to get track dimensions after timeout");
      })();
    });
  }
  setDeviceId(e) {
    return m(this, void 0, void 0, function* () {
      return this._constraints.deviceId === e && this._mediaStreamTrack.getSettings().deviceId === nn(e) ? !0 : (this._constraints.deviceId = e, this.isMuted ? (this.pendingDeviceChange = !0, !0) : (yield this.restartTrack(), nn(e) === this._mediaStreamTrack.getSettings().deviceId));
    });
  }
  /**
   * @returns DeviceID of the device that is currently being used for this track
   */
  getDeviceId() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
      return (function* () {
        if (e.source === E.Source.ScreenShare)
          return;
        const n = e._mediaStreamTrack.getSettings(), r = n.deviceId, s = n.groupId, a = e.kind === E.Kind.Audio ? "audioinput" : "videoinput";
        return t ? me.getInstance().normalizeDeviceId(a, r, s) : r;
      })();
    });
  }
  mute() {
    return m(this, void 0, void 0, function* () {
      return this.setTrackMuted(!0), this;
    });
  }
  unmute() {
    return m(this, void 0, void 0, function* () {
      return this.setTrackMuted(!1), this;
    });
  }
  replaceTrack(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = yield this.trackChangeLock.lock();
      try {
        if (!this.sender)
          throw new et("unable to replace an unpublished track");
        let r, s;
        typeof t == "boolean" ? r = t : t !== void 0 && (r = t.userProvidedTrack, s = t.stopProcessor), this.providedByUser = r ?? !0, this.log.debug("replace MediaStreamTrack", this.logContext), yield this.setMediaStreamTrack(e), s && this.processor && (yield this.internalStopProcessor());
      } finally {
        n();
      }
      return yield this.onSenderTrackSwapped(), this;
    });
  }
  /**
   * Hook invoked after the MediaStreamTrack on the sender has been swapped
   * (via replaceTrack, setProcessor, or stopProcessor). Fires outside the
   * trackChangeLock so subclasses can do asynchronous work such as polling
   * for new dimensions without blocking other track operations.
   */
  onSenderTrackSwapped() {
    return m(this, void 0, void 0, function* () {
    });
  }
  restart(e, t) {
    return m(this, void 0, void 0, function* () {
      this.manuallyStopped = !1;
      const n = yield this.trackChangeLock.lock();
      try {
        e || (e = this._constraints);
        const r = e, s = r.deviceId, a = r.facingMode, o = Bs(e, ["deviceId", "facingMode"]);
        this.log.debug("restarting track with constraints", Object.assign(Object.assign({}, this.logContext), {
          constraints: e
        }));
        const c = {
          audio: !1,
          video: !1
        };
        this.kind === E.Kind.Video ? c.video = s || a ? {
          deviceId: s,
          facingMode: a
        } : !0 : c.audio = s ? Object.assign({
          deviceId: s
        }, o) : !0, this.attachedElements.forEach((u) => {
          Zt(this.mediaStreamTrack, u);
        }), this._mediaStreamTrack.removeEventListener("ended", this.handleEnded), this._mediaStreamTrack.stop();
        const l = (yield navigator.mediaDevices.getUserMedia(c)).getTracks()[0];
        return this.kind === E.Kind.Video && (yield l.applyConstraints(o)), l.addEventListener("ended", this.handleEnded), this.log.debug("re-acquired MediaStreamTrack", this.logContext), yield this.setMediaStreamTrack(l, !1, t), this._constraints = e, this.pendingDeviceChange = !1, this.emit(R.Restarted, this), this.manuallyStopped && (this.log.warn("track was stopped during a restart, stopping restarted track", this.logContext), this.stop()), this;
      } finally {
        n();
      }
    });
  }
  setTrackMuted(e) {
    this.log.debug("setting ".concat(this.kind, " track ").concat(e ? "muted" : "unmuted"), this.logContext), !(this.isMuted === e && this._mediaStreamTrack.enabled !== e) && (this.isMuted = e, this._mediaStreamTrack.enabled = !e, this.emit(e ? R.Muted : R.Unmuted, this));
  }
  get needsReAcquisition() {
    return this._mediaStreamTrack.readyState !== "live" || this._mediaStreamTrack.muted || !this._mediaStreamTrack.enabled || this.reacquireTrack;
  }
  handleAppVisibilityChanged() {
    const e = Object.create(null, {
      handleAppVisibilityChanged: {
        get: () => super.handleAppVisibilityChanged
      }
    });
    return m(this, void 0, void 0, function* () {
      yield e.handleAppVisibilityChanged.call(this), Rd() && (this.log.debug("visibility changed, is in Background: ".concat(this.isInBackground), this.logContext), !this.isInBackground && this.needsReAcquisition && !this.isUserProvided && !this.isMuted && (this.log.debug("track needs to be reacquired, restarting ".concat(this.source), this.logContext), yield this.restart(), this.reacquireTrack = !1));
    });
  }
  stop() {
    var e;
    this.manuallyStopped = !0, super.stop(), this._mediaStreamTrack.removeEventListener("ended", this.handleEnded), this._mediaStreamTrack.removeEventListener("mute", this.handleTrackMuteEvent), this._mediaStreamTrack.removeEventListener("unmute", this.handleTrackUnmuteEvent), (e = this.processor) === null || e === void 0 || e.destroy(), this.processor = void 0;
  }
  /**
   * pauses publishing to the server without disabling the local MediaStreamTrack
   * this is used to display a user's own video locally while pausing publishing to
   * the server.
   * this API is unsupported on Safari < 12 due to a bug
   **/
  pauseUpstream() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.pauseUpstreamLock.lock();
      try {
        if (this._isUpstreamPaused === !0)
          return;
        if (!this.sender) {
          this.log.warn("unable to pause upstream for an unpublished track", this.logContext);
          return;
        }
        this._isUpstreamPaused = !0, this.emit(R.UpstreamPaused, this);
        const n = ye();
        if ((n == null ? void 0 : n.name) === "Safari" && Je(n.version, "12.0") < 0)
          throw new Gi("pauseUpstream is not supported on Safari < 12.");
        ((e = this.sender.transport) === null || e === void 0 ? void 0 : e.state) !== "closed" && (yield this.sender.replaceTrack(null));
      } finally {
        t();
      }
    });
  }
  resumeUpstream() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.pauseUpstreamLock.lock();
      try {
        if (this._isUpstreamPaused === !1)
          return;
        if (!this.sender) {
          this.log.warn("unable to resume upstream for an unpublished track", this.logContext);
          return;
        }
        this._isUpstreamPaused = !1, this.emit(R.UpstreamResumed, this), ((e = this.sender.transport) === null || e === void 0 ? void 0 : e.state) !== "closed" && (yield this.sender.replaceTrack(this.mediaStreamTrack));
      } finally {
        t();
      }
    });
  }
  /**
   * Gets the RTCStatsReport for the LocalTrack's underlying RTCRtpSender
   * See https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport
   *
   * @returns Promise<RTCStatsReport> | undefined
   */
  getRTCStatsReport() {
    return m(this, void 0, void 0, function* () {
      var e;
      return !((e = this.sender) === null || e === void 0) && e.getStats ? yield this.sender.getStats() : void 0;
    });
  }
  /**
   * Sets a processor on this track.
   * See https://github.com/livekit/track-processors-js for example usage
   *
   * @param processor
   * @param showProcessedStreamLocally
   * @returns
   */
  setProcessor(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
      return (function* () {
        var s;
        const a = yield n.trackChangeLock.lock();
        try {
          n.log.debug("setting up processor", n.logContext);
          const o = document.createElement(n.kind), c = {
            kind: n.kind,
            track: n._mediaStreamTrack,
            element: o,
            audioContext: n.audioContext,
            localTrack: n
          };
          if (yield t.init(c), n.log.debug("processor initialized", n.logContext), n.processor && (yield n.internalStopProcessor()), n.kind === "unknown")
            throw TypeError("cannot set processor on track of unknown kind");
          if (Qt(n._mediaStreamTrack, o), o.muted = !0, o.play().catch((d) => {
            d instanceof DOMException && d.name === "AbortError" ? (n.log.warn("failed to play processor element, retrying", Object.assign(Object.assign({}, n.logContext), {
              error: d
            })), setTimeout(() => {
              o.play().catch((l) => {
                n.log.error("failed to play processor element", Object.assign(Object.assign({}, n.logContext), {
                  err: l
                }));
              });
            }, 100)) : n.log.error("failed to play processor element", Object.assign(Object.assign({}, n.logContext), {
              error: d
            }));
          }), n.processor = t, n.processorElement = o, n.processor.processedTrack) {
            for (const d of n.attachedElements)
              d !== n.processorElement && r && (Zt(n._mediaStreamTrack, d), Qt(n.processor.processedTrack, d));
            yield (s = n.sender) === null || s === void 0 ? void 0 : s.replaceTrack(n.processor.processedTrack);
          }
          n.emit(R.TrackProcessorUpdate, n.processor);
        } finally {
          a();
        }
        yield n.onSenderTrackSwapped();
      })();
    });
  }
  getProcessor() {
    return this.processor;
  }
  /**
   * Stops the track processor
   * See https://github.com/livekit/track-processors-js for example usage
   *
   */
  stopProcessor() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
      return (function* () {
        const n = yield e.trackChangeLock.lock();
        try {
          yield e.internalStopProcessor(t);
        } finally {
          n();
        }
        yield e.onSenderTrackSwapped();
      })();
    });
  }
  /**
   * @internal
   * This method assumes the caller has acquired a trackChangeLock already.
   * The public facing method for stopping the processor is `stopProcessor` and it wraps this method in the trackChangeLock.
   */
  internalStopProcessor() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
      return (function* () {
        var n, r;
        e.processor && (e.log.debug("stopping processor", e.logContext), (n = e.processor.processedTrack) === null || n === void 0 || n.stop(), yield e.processor.destroy(), e.processor = void 0, t || ((r = e.processorElement) === null || r === void 0 || r.remove(), e.processorElement = void 0), yield e._mediaStreamTrack.applyConstraints(e._constraints), yield e.setMediaStreamTrack(e._mediaStreamTrack, !0), e.emit(R.TrackProcessorUpdate));
      })();
    });
  }
  /** @internal */
  startPreConnectBuffer() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 100;
    if (!op()) {
      this.log.warn("MediaRecorder is not available, cannot start preconnect buffer", this.logContext);
      return;
    }
    if (this.localTrackRecorder) {
      this.log.warn("preconnect buffer already started");
      return;
    } else {
      let t = "audio/webm;codecs=opus";
      MediaRecorder.isTypeSupported(t) || (t = "video/mp4"), this.localTrackRecorder = new ap(this, {
        mimeType: t
      });
    }
    this.localTrackRecorder.start(e), this.autoStopPreConnectBuffer = setTimeout(() => {
      this.log.warn("preconnect buffer timed out, stopping recording automatically", this.logContext), this.stopPreConnectBuffer();
    }, dp);
  }
  /** @internal */
  stopPreConnectBuffer() {
    clearTimeout(this.autoStopPreConnectBuffer), this.localTrackRecorder && (this.localTrackRecorder.stop(), this.localTrackRecorder = void 0);
  }
  /** @internal */
  getPreConnectBuffer() {
    var e;
    return (e = this.localTrackRecorder) === null || e === void 0 ? void 0 : e.byteStream;
  }
  getPreConnectBufferMimeType() {
    var e;
    return (e = this.localTrackRecorder) === null || e === void 0 ? void 0 : e.mimeType;
  }
}
class Vn extends Hd {
  /**
   * boolean indicating whether enhanced noise cancellation is currently being used on this track
   */
  get enhancedNoiseCancellation() {
    return this.isKrispNoiseFilterEnabled;
  }
  /**
   *
   * @param mediaTrack
   * @param constraints MediaTrackConstraints that are being used when restarting or reacquiring tracks
   * @param userProvidedTrack Signals to the SDK whether or not the mediaTrack should be managed (i.e. released and reacquired) internally by the SDK
   */
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0, r = arguments.length > 3 ? arguments[3] : void 0, s = arguments.length > 4 ? arguments[4] : void 0;
    super(e, E.Kind.Audio, t, n, s), this.stopOnMute = !1, this.isKrispNoiseFilterEnabled = !1, this.monitorSender = () => m(this, void 0, void 0, function* () {
      if (!this.sender) {
        this._currentBitrate = 0;
        return;
      }
      let a;
      try {
        a = yield this.getSenderStats();
      } catch (o) {
        this.log.error("could not get audio sender stats", Object.assign(Object.assign({}, this.logContext), {
          error: o
        }));
        return;
      }
      a && this.prevStats && (this._currentBitrate = Ji(a, this.prevStats)), this.prevStats = a;
    }), this.handleKrispNoiseFilterEnable = () => {
      this.isKrispNoiseFilterEnabled = !0, this.log.debug("Krisp noise filter enabled", this.logContext), this.emit(R.AudioTrackFeatureUpdate, this, fe.TF_ENHANCED_NOISE_CANCELLATION, !0);
    }, this.handleKrispNoiseFilterDisable = () => {
      this.isKrispNoiseFilterEnabled = !1, this.log.debug("Krisp noise filter disabled", this.logContext), this.emit(R.AudioTrackFeatureUpdate, this, fe.TF_ENHANCED_NOISE_CANCELLATION, !1);
    }, this.audioContext = r, this.checkForSilence();
  }
  mute() {
    const e = Object.create(null, {
      mute: {
        get: () => super.mute
      }
    });
    return m(this, void 0, void 0, function* () {
      const t = yield this.muteLock.lock();
      try {
        return this.isMuted ? (this.log.debug("Track already muted", this.logContext), this) : (this.source === E.Source.Microphone && this.stopOnMute && !this.isUserProvided && (this.log.debug("stopping mic track", this.logContext), this._mediaStreamTrack.stop()), yield e.mute.call(this), this);
      } finally {
        t();
      }
    });
  }
  unmute() {
    const e = Object.create(null, {
      unmute: {
        get: () => super.unmute
      }
    });
    return m(this, void 0, void 0, function* () {
      const t = yield this.muteLock.lock();
      try {
        return this.isMuted ? (this.source === E.Source.Microphone && (this.stopOnMute || this._mediaStreamTrack.readyState === "ended" || this.pendingDeviceChange) && !this.isUserProvided && (this.log.debug("reacquiring mic track", this.logContext), yield this.restart(void 0, !0)), yield e.unmute.call(this), this) : (this.log.debug("Track already unmuted", this.logContext), this);
      } finally {
        t();
      }
    });
  }
  restartTrack(e) {
    return m(this, void 0, void 0, function* () {
      let t;
      if (e) {
        const n = Vs({
          audio: e
        });
        typeof n.audio != "boolean" && (t = n.audio);
      }
      yield this.restart(t);
    });
  }
  applyConstraints(e) {
    return m(this, void 0, void 0, function* () {
      const t = yield this.trackChangeLock.lock();
      try {
        const n = yield this._mediaStreamTrack.applyConstraints(e);
        return this._constraints = Object.assign(Object.assign({}, this._constraints), e), n;
      } finally {
        t();
      }
    });
  }
  restart(e, t) {
    const n = Object.create(null, {
      restart: {
        get: () => super.restart
      }
    });
    return m(this, void 0, void 0, function* () {
      const r = yield n.restart.call(this, e, t);
      return this.checkForSilence(), r;
    });
  }
  /* @internal */
  startMonitor() {
    Re() && (this.monitorInterval || (this.monitorInterval = setInterval(() => {
      this.monitorSender();
    }, zs)));
  }
  setProcessor(e) {
    return m(this, void 0, void 0, function* () {
      var t;
      const n = yield this.trackChangeLock.lock();
      try {
        if (!ze() && !this.audioContext)
          throw Error("Audio context needs to be set on LocalAudioTrack in order to enable processors");
        this.processor && (yield this.internalStopProcessor());
        const r = {
          kind: this.kind,
          track: this._mediaStreamTrack,
          // RN won't have or use AudioContext
          audioContext: this.audioContext,
          localTrack: this
        };
        this.log.debug("setting up audio processor ".concat(e.name), this.logContext), yield e.init(r), this.processor = e, this.processor.processedTrack && (yield (t = this.sender) === null || t === void 0 ? void 0 : t.replaceTrack(this.processor.processedTrack), this.processor.processedTrack.addEventListener("enable-lk-krisp-noise-filter", this.handleKrispNoiseFilterEnable), this.processor.processedTrack.addEventListener("disable-lk-krisp-noise-filter", this.handleKrispNoiseFilterDisable)), this.emit(R.TrackProcessorUpdate, this.processor);
      } finally {
        n();
      }
    });
  }
  /**
   * @internal
   * @experimental
   */
  setAudioContext(e) {
    this.audioContext = e;
  }
  getSenderStats() {
    return m(this, void 0, void 0, function* () {
      var e;
      if (!(!((e = this.sender) === null || e === void 0) && e.getStats))
        return;
      const t = yield this.sender.getStats();
      let n;
      return t.forEach((r) => {
        if (r.type === "outbound-rtp") {
          n = {
            type: "audio",
            streamId: r.id,
            packetsSent: r.packetsSent,
            bytesSent: r.bytesSent,
            timestamp: r.timestamp
          };
          const s = t.get(r.remoteId);
          s && (n.packetsLost = s.packetsLost, n.jitter = s.jitter, n.roundTripTime = s.roundTripTime);
        }
      }), n;
    });
  }
  checkForSilence() {
    return m(this, void 0, void 0, function* () {
      const e = yield Sd(this);
      return e && (this.isMuted || this.log.debug("silence detected on local audio track", this.logContext), this.emit(R.AudioSilenceDetected)), e;
    });
  }
}
function lp(i, e, t) {
  switch (i.kind) {
    case "audio":
      return new Vn(i, e, !1, void 0, t);
    case "video":
      return new Wn(i, e, !1, t);
    default:
      throw new et("unsupported track type: ".concat(i.kind));
  }
}
const up = Object.values(Un), hp = Object.values(as), fp = Object.values(zi), mp = [Un.h180, Un.h360], pp = [as.h180, as.h360], gp = (i) => [{
  scaleResolutionDownBy: 2,
  fps: i.encoding.maxFramerate
}].map((t) => {
  var n, r;
  return new Y(Math.floor(i.width / t.scaleResolutionDownBy), Math.floor(i.height / t.scaleResolutionDownBy), Math.max(15e4, Math.floor(i.encoding.maxBitrate / (Math.pow(t.scaleResolutionDownBy, 2) * (((n = i.encoding.maxFramerate) !== null && n !== void 0 ? n : 30) / ((r = t.fps) !== null && r !== void 0 ? r : 30))))), t.fps, i.encoding.priority);
}), vs = ["q", "h", "f"];
function Ri(i, e, t, n) {
  var r, s;
  let a = n == null ? void 0 : n.videoEncoding;
  i && (a = n == null ? void 0 : n.screenShareEncoding);
  const o = n == null ? void 0 : n.simulcast, c = n == null ? void 0 : n.scalabilityMode, d = n == null ? void 0 : n.videoCodec, l = tn(d, n);
  if (!a && !o && !c || !e || !t)
    return [{}];
  a || (a = bp(i, e, t, d), q.debug("using video encoding", a));
  const u = a.maxFramerate, h = new Y(e, t, a.maxBitrate, a.maxFramerate, a.priority);
  if (c && Pt(d) && !l) {
    const S = new Gd(c), I = [];
    if (S.spatial > 3)
      throw new Error("unsupported scalabilityMode: ".concat(c));
    const b = ye();
    if (_d()) {
      const y = S.suffix == "h" ? 2 : 3, C = If(b);
      for (let M = 0; M < S.spatial; M += 1)
        I.push({
          rid: vs[2 - M],
          maxBitrate: a.maxBitrate / Math.pow(y, M),
          maxFramerate: h.encoding.maxFramerate,
          scaleResolutionDownBy: C ? Math.pow(2, M) : void 0
        });
      I[0].scalabilityMode = c;
    } else
      I.push({
        maxBitrate: a.maxBitrate,
        maxFramerate: h.encoding.maxFramerate,
        /* @ts-ignore */
        scalabilityMode: c
      });
    return h.encoding.priority && (I[0].priority = h.encoding.priority, I[0].networkPriority = h.encoding.priority), q.debug("using svc encoding", {
      encodings: I
    }), I;
  }
  if (!o)
    return [a];
  const f = (S) => (l && S.forEach((I) => {
    I.scalabilityMode = c;
  }), S);
  let g;
  i ? g = (r = fo(n == null ? void 0 : n.screenShareSimulcastLayers)) !== null && r !== void 0 ? r : ho(i, h) : g = (s = fo(n == null ? void 0 : n.videoSimulcastLayers)) !== null && s !== void 0 ? s : ho(i, h);
  let p;
  if (g.length > 0) {
    const S = g[0];
    if (g.length > 1) {
      var k = g, T = L(k, 2);
      p = T[1];
    }
    const I = Math.max(e, t);
    if (I >= 960 && p)
      return f(Ir(e, t, [S, p, h], u));
    if (I >= 480)
      return f(Ir(e, t, [S, h], u));
  }
  return f(Ir(e, t, [h]));
}
function vp(i, e, t) {
  var n, r;
  return Pt(i) && !tn(i, e) ? (r = (n = t[0]) === null || n === void 0 ? void 0 : n.maxBitrate) !== null && r !== void 0 ? r : 0 : t.reduce((s, a) => {
    var o;
    return s + ((o = a.maxBitrate) !== null && o !== void 0 ? o : 0);
  }, 0);
}
function Kd(i, e, t) {
  var n, r, s, a;
  if (!t.backupCodec || t.backupCodec === !0 || t.backupCodec.codec === t.videoCodec)
    return;
  e !== t.backupCodec.codec && q.warn("requested a different codec than specified as backup", {
    serverRequested: e,
    backup: t.backupCodec.codec
  }), t.videoCodec = e, t.videoEncoding = t.backupCodec.encoding;
  const o = i.mediaStreamTrack.getSettings(), c = (n = o.width) !== null && n !== void 0 ? n : (r = i.dimensions) === null || r === void 0 ? void 0 : r.width, d = (s = o.height) !== null && s !== void 0 ? s : (a = i.dimensions) === null || a === void 0 ? void 0 : a.height;
  return i.source === E.Source.ScreenShare && t.simulcast && (t.simulcast = !1), Ri(i.source === E.Source.ScreenShare, c, d, t);
}
function bp(i, e, t, n) {
  const r = yp(i, e, t);
  let s = r[0].encoding;
  const a = Math.max(e, t);
  for (let o = 0; o < r.length; o += 1) {
    const c = r[o];
    if (s = c.encoding, c.width >= a)
      break;
  }
  if (n)
    switch (n) {
      case "av1":
      case "h265":
        s = Object.assign({}, s), s.maxBitrate = s.maxBitrate * 0.7;
        break;
      case "vp9":
        s = Object.assign({}, s), s.maxBitrate = s.maxBitrate * 0.85;
        break;
    }
  return s;
}
function yp(i, e, t) {
  if (i)
    return fp;
  const n = e > t ? e / t : t / e;
  return Math.abs(n - 16 / 9) < Math.abs(n - 4 / 3) ? up : hp;
}
function ho(i, e) {
  if (i)
    return gp(e);
  const t = e.width, n = e.height, r = t > n ? t / n : n / t;
  return Math.abs(r - 16 / 9) < Math.abs(r - 4 / 3) ? mp : pp;
}
function Ir(i, e, t, n) {
  const r = [];
  if (t.forEach((s, a) => {
    if (a >= vs.length)
      return;
    const o = Math.min(i, e), d = {
      rid: vs[a],
      scaleResolutionDownBy: Math.max(1, o / Math.min(s.width, s.height)),
      maxBitrate: s.encoding.maxBitrate
    }, l = n && s.encoding.maxFramerate ? Math.min(n, s.encoding.maxFramerate) : s.encoding.maxFramerate;
    l && (d.maxFramerate = l);
    const u = ye(), h = (u == null ? void 0 : u.name) === "Firefox" && u.os !== "iOS" || a === 0;
    s.encoding.priority && h && (d.priority = s.encoding.priority, d.networkPriority = s.encoding.priority), r.push(d);
  }), ze() && Md() === "ios") {
    let s;
    r.forEach((o) => {
      s ? o.maxFramerate && o.maxFramerate > s && (s = o.maxFramerate) : s = o.maxFramerate;
    });
    let a = !0;
    r.forEach((o) => {
      var c;
      o.maxFramerate != s && (a && (a = !1, q.info("Simulcast on iOS React-Native requires all encodings to share the same framerate.")), q.info('Setting framerate of encoding "'.concat((c = o.rid) !== null && c !== void 0 ? c : "", '" to ').concat(s)), o.maxFramerate = s);
    });
  }
  return r;
}
function fo(i) {
  if (i)
    return i.slice().sort((e, t) => {
      const n = e.encoding, r = t.encoding;
      return n.maxBitrate > r.maxBitrate ? 1 : n.maxBitrate < r.maxBitrate ? -1 : n.maxBitrate === r.maxBitrate && n.maxFramerate && r.maxFramerate ? n.maxFramerate > r.maxFramerate ? 1 : -1 : 0;
    });
}
class Gd {
  constructor(e) {
    const t = e.match(/^L(\d)T(\d)(h|_KEY|_KEY_SHIFT){0,1}$/);
    if (!t)
      throw new Error("invalid scalability mode");
    if (this.spatial = parseInt(t[1]), this.temporal = parseInt(t[2]), t.length > 3)
      switch (t[3]) {
        case "h":
        case "_KEY":
        case "_KEY_SHIFT":
          this.suffix = t[3];
      }
  }
  toString() {
    var e;
    return "L".concat(this.spatial, "T").concat(this.temporal).concat((e = this.suffix) !== null && e !== void 0 ? e : "");
  }
}
function kp(i) {
  switch (i.source) {
    case E.Source.Camera:
      return "maintain-framerate";
    case E.Source.ScreenShare:
      return "maintain-resolution";
    default:
      return "balanced";
  }
}
const Tp = 5e3;
class Wn extends Hd {
  get sender() {
    return this._sender;
  }
  set sender(e) {
    this._sender = e, this.degradationPreference && this.setDegradationPreference(this.degradationPreference);
  }
  /**
   *
   * @param mediaTrack
   * @param constraints MediaTrackConstraints that are being used when restarting or reacquiring tracks
   * @param userProvidedTrack Signals to the SDK whether or not the mediaTrack should be managed (i.e. released and reacquired) internally by the SDK
   */
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0, r = arguments.length > 3 ? arguments[3] : void 0;
    super(e, E.Kind.Video, t, n, r), this.simulcastCodecs = /* @__PURE__ */ new Map(), this.degradationPreference = "balanced", this.isCpuConstrained = !1, this.optimizeForPerformance = !1, this.monitorSender = () => m(this, void 0, void 0, function* () {
      if (!this.sender) {
        this._currentBitrate = 0;
        return;
      }
      let s;
      try {
        s = yield this.getSenderStats();
      } catch (c) {
        this.log.error("could not get video sender stats", Object.assign(Object.assign({}, this.logContext), {
          error: c
        }));
        return;
      }
      const a = new Map(s.map((c) => [c.rid, c])), o = s.some((c) => c.qualityLimitationReason === "cpu");
      if (o !== this.isCpuConstrained && (this.isCpuConstrained = o, this.isCpuConstrained && this.emit(R.CpuConstrained)), this.prevStats) {
        let c = 0;
        a.forEach((d, l) => {
          var u;
          const h = (u = this.prevStats) === null || u === void 0 ? void 0 : u.get(l);
          c += Ji(d, h);
        }), this._currentBitrate = c;
      }
      this.prevStats = a;
    }), this.senderLock = new ue();
  }
  get isSimulcast() {
    return !!(this.sender && this.sender.getParameters().encodings.length > 1);
  }
  /* @internal */
  startMonitor(e) {
    var t;
    if (this.signalClient = e, !Re())
      return;
    const n = (t = this.sender) === null || t === void 0 ? void 0 : t.getParameters();
    n && (this.encodings = n.encodings), !this.monitorInterval && (this.monitorInterval = setInterval(() => {
      this.monitorSender();
    }, zs));
  }
  stop() {
    this._mediaStreamTrack.getConstraints(), this.simulcastCodecs.forEach((e) => {
      e.mediaStreamTrack.stop();
    }), super.stop();
  }
  pauseUpstream() {
    const e = Object.create(null, {
      pauseUpstream: {
        get: () => super.pauseUpstream
      }
    });
    return m(this, void 0, void 0, function* () {
      var t, n, r, s, a;
      yield e.pauseUpstream.call(this);
      try {
        for (var o = !0, c = Ne(this.simulcastCodecs.values()), d; d = yield c.next(), t = d.done, !t; o = !0)
          s = d.value, o = !1, yield (a = s.sender) === null || a === void 0 ? void 0 : a.replaceTrack(null);
      } catch (l) {
        n = {
          error: l
        };
      } finally {
        try {
          !o && !t && (r = c.return) && (yield r.call(c));
        } finally {
          if (n) throw n.error;
        }
      }
    });
  }
  resumeUpstream() {
    const e = Object.create(null, {
      resumeUpstream: {
        get: () => super.resumeUpstream
      }
    });
    return m(this, void 0, void 0, function* () {
      var t, n, r, s, a;
      yield e.resumeUpstream.call(this);
      try {
        for (var o = !0, c = Ne(this.simulcastCodecs.values()), d; d = yield c.next(), t = d.done, !t; o = !0) {
          s = d.value, o = !1;
          const l = s;
          yield (a = l.sender) === null || a === void 0 ? void 0 : a.replaceTrack(l.mediaStreamTrack);
        }
      } catch (l) {
        n = {
          error: l
        };
      } finally {
        try {
          !o && !t && (r = c.return) && (yield r.call(c));
        } finally {
          if (n) throw n.error;
        }
      }
    });
  }
  mute() {
    const e = Object.create(null, {
      mute: {
        get: () => super.mute
      }
    });
    return m(this, void 0, void 0, function* () {
      const t = yield this.muteLock.lock();
      try {
        return this.isMuted ? (this.log.debug("Track already muted", this.logContext), this) : (this.source === E.Source.Camera && !this.isUserProvided && (this.log.debug("stopping camera track", this.logContext), this._mediaStreamTrack.stop()), yield e.mute.call(this), this);
      } finally {
        t();
      }
    });
  }
  unmute() {
    const e = Object.create(null, {
      unmute: {
        get: () => super.unmute
      }
    });
    return m(this, void 0, void 0, function* () {
      const t = yield this.muteLock.lock();
      try {
        return this.isMuted ? (this.source === E.Source.Camera && !this.isUserProvided && (this.log.debug("reacquiring camera track", this.logContext), yield this.restart(void 0, !0)), yield e.unmute.call(this), this) : (this.log.debug("Track already unmuted", this.logContext), this);
      } finally {
        t();
      }
    });
  }
  setTrackMuted(e) {
    super.setTrackMuted(e);
    for (const t of this.simulcastCodecs.values())
      t.mediaStreamTrack.enabled = !e;
  }
  getSenderStats() {
    return m(this, void 0, void 0, function* () {
      var e;
      if (!(!((e = this.sender) === null || e === void 0) && e.getStats))
        return [];
      const t = [], n = yield this.sender.getStats();
      return n.forEach((r) => {
        var s;
        if (r.type === "outbound-rtp") {
          const a = {
            type: "video",
            streamId: r.id,
            frameHeight: r.frameHeight,
            frameWidth: r.frameWidth,
            framesPerSecond: r.framesPerSecond,
            framesSent: r.framesSent,
            firCount: r.firCount,
            pliCount: r.pliCount,
            nackCount: r.nackCount,
            packetsSent: r.packetsSent,
            bytesSent: r.bytesSent,
            qualityLimitationReason: r.qualityLimitationReason,
            qualityLimitationDurations: r.qualityLimitationDurations,
            qualityLimitationResolutionChanges: r.qualityLimitationResolutionChanges,
            rid: (s = r.rid) !== null && s !== void 0 ? s : r.id,
            retransmittedPacketsSent: r.retransmittedPacketsSent,
            targetBitrate: r.targetBitrate,
            timestamp: r.timestamp
          }, o = n.get(r.remoteId);
          o && (a.jitter = o.jitter, a.packetsLost = o.packetsLost, a.roundTripTime = o.roundTripTime), t.push(a);
        }
      }), t.sort((r, s) => {
        var a, o;
        return ((a = s.frameWidth) !== null && a !== void 0 ? a : 0) - ((o = r.frameWidth) !== null && o !== void 0 ? o : 0);
      }), t;
    });
  }
  /**
   * Whether `codec` is being published as SVC (a single stream carrying all spatial
   * layers) as opposed to rid based simulcast. VP9/AV1 are SVC unless the publisher
   * opted into simulcast, in which case each rid is an independent stream and the
   * layers can be enabled/disabled individually.
   */
  isSvcPublish(e) {
    return Pt(e) && !tn(e, this.publishOptions);
  }
  setPublishingQuality(e) {
    const t = [];
    for (let n = De.LOW; n <= De.HIGH; n += 1)
      t.push(new Us({
        quality: n,
        enabled: n <= e
      }));
    this.log.debug("setting publishing quality. max quality ".concat(e), this.logContext), this.setPublishingLayers(this.isSvcPublish(this.codec), t);
  }
  restartTrack(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r, s, a;
      let o;
      if (e) {
        const u = Vs({
          video: e
        });
        typeof u.video != "boolean" && (o = u.video);
      }
      yield this.restart(o), this.isCpuConstrained = !1;
      try {
        for (var c = !0, d = Ne(this.simulcastCodecs.values()), l; l = yield d.next(), t = l.done, !t; c = !0) {
          s = l.value, c = !1;
          const u = s;
          u.sender && ((a = u.sender.transport) === null || a === void 0 ? void 0 : a.state) !== "closed" && (u.mediaStreamTrack = this.mediaStreamTrack.clone(), yield u.sender.replaceTrack(u.mediaStreamTrack));
        }
      } catch (u) {
        n = {
          error: u
        };
      } finally {
        try {
          !c && !t && (r = d.return) && (yield r.call(d));
        } finally {
          if (n) throw n.error;
        }
      }
      yield this.onSenderTrackSwapped();
    });
  }
  onSenderTrackSwapped() {
    return m(this, void 0, void 0, function* () {
      yield this.refreshSenderEncodings();
    });
  }
  /**
   * Recomputes encoding parameters for this track's senders based on the current
   * MediaStreamTrack dimensions and reapplies them via setParameters. This is a no-op
   * if the track hasn't been published yet or if the track is in performance-optimized
   * mode (which manages its own encodings).
   */
  refreshSenderEncodings() {
    return m(this, void 0, void 0, function* () {
      var e;
      if (!this.sender || !this.publishOptions || this.optimizeForPerformance)
        return;
      const t = yield this.senderLock.lock();
      try {
        let r;
        try {
          r = yield this.waitForDimensions();
        } catch (o) {
          this.log.warn("could not determine new track dimensions, skipping encoding recompute", Object.assign(Object.assign({}, this.logContext), {
            error: o
          }));
          return;
        }
        if (this.lastEncodedDimensions && this.lastEncodedDimensions.width === r.width && this.lastEncodedDimensions.height === r.height)
          return;
        const s = this.source === E.Source.ScreenShare, a = Ri(s, r.width, r.height, Object.assign({}, this.publishOptions));
        yield this.applyEncodingsToSender(this.sender, a), this.encodings = a, this.lastEncodedDimensions = r;
        for (const o of this.simulcastCodecs) {
          var n = L(o, 2);
          const c = n[0], d = n[1];
          if (!d.sender || ((e = d.sender.transport) === null || e === void 0 ? void 0 : e.state) === "closed" || !kd(c))
            continue;
          const l = Object.assign({}, this.publishOptions), u = Kd(this, c, l);
          u && (yield this.applyEncodingsToSender(d.sender, u), d.encodings = u);
        }
      } catch (r) {
        this.log.warn("failed to apply recomputed encodings", Object.assign(Object.assign({}, this.logContext), {
          error: r
        }));
      } finally {
        t();
      }
    });
  }
  applyEncodingsToSender(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = e.getParameters();
      !n.encodings || n.encodings.length !== t.length || (n.encodings.forEach((r, s) => {
        if (r.active === !1)
          return;
        const a = t[s];
        a.scaleResolutionDownBy !== void 0 && (r.scaleResolutionDownBy = a.scaleResolutionDownBy), a.maxBitrate !== void 0 && (r.maxBitrate = a.maxBitrate), a.maxFramerate !== void 0 && (r.maxFramerate = a.maxFramerate), a.priority !== void 0 && (r.priority = a.priority, r.networkPriority = a.priority);
      }), this.log.debug("updating sender encodings after track restart", Object.assign(Object.assign({}, this.logContext), {
        encodings: n.encodings
      })), yield e.setParameters(n));
    });
  }
  setProcessor(e) {
    const t = Object.create(null, {
      setProcessor: {
        get: () => super.setProcessor
      }
    });
    return m(this, arguments, void 0, function(n) {
      var r = this;
      let s = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
      return (function* () {
        var a, o, c, d, l, u;
        if (yield t.setProcessor.call(r, n, s), !((l = r.processor) === null || l === void 0) && l.processedTrack)
          try {
            for (var h = !0, f = Ne(r.simulcastCodecs.values()), g; g = yield f.next(), a = g.done, !a; h = !0)
              d = g.value, h = !1, yield (u = d.sender) === null || u === void 0 ? void 0 : u.replaceTrack(r.processor.processedTrack);
          } catch (p) {
            o = {
              error: p
            };
          } finally {
            try {
              !h && !a && (c = f.return) && (yield c.call(f));
            } finally {
              if (o) throw o.error;
            }
          }
      })();
    });
  }
  setDegradationPreference(e) {
    return m(this, void 0, void 0, function* () {
      this.degradationPreference = e, yield this.applyDegradationPreference(this.sender);
      for (const t of this.simulcastCodecs.values())
        yield this.applyDegradationPreference(t.sender);
    });
  }
  /**
   * Degradation preference is a property of the sender, not of the track, so every sender
   * publishing this track needs it applied separately. A backup codec publishes over its
   * own sender, which would otherwise let the browser resolve a preference implicitly and
   * diverge from the primary encoder.
   *
   * Callers apply this sequentially rather than concurrently: `setParameters` is only valid
   * against the parameters most recently returned by `getParameters`, which is why this file
   * serializes other sender parameter updates through `senderLock`.
   */
  applyDegradationPreference(e) {
    return m(this, void 0, void 0, function* () {
      if (e)
        try {
          this.log.debug("setting degradationPreference to ".concat(this.degradationPreference), this.logContext);
          const t = e.getParameters();
          t.degradationPreference = this.degradationPreference, yield e.setParameters(t);
        } catch (t) {
          this.log.warn("failed to set degradationPreference", Object.assign({
            error: t
          }, this.logContext));
        }
    });
  }
  addSimulcastTrack(e, t) {
    if (this.simulcastCodecs.has(e)) {
      this.log.error("".concat(e, " already added, skipping adding simulcast codec"), this.logContext);
      return;
    }
    const n = {
      codec: e,
      mediaStreamTrack: this.mediaStreamTrack.clone(),
      sender: void 0,
      encodings: t
    };
    return this.simulcastCodecs.set(e, n), n;
  }
  setSimulcastTrackSender(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = this.simulcastCodecs.get(e);
      n && (n.sender = t, yield this.applyDegradationPreference(t), setTimeout(() => {
        this.subscribedCodecs && this.setPublishingCodecs(this.subscribedCodecs);
      }, Tp));
    });
  }
  /**
   * @internal
   * Sets codecs that should be publishing, returns new codecs that have not yet
   * been published
   */
  setPublishingCodecs(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r, s, a, o, c;
      if (this.log.debug("setting publishing codecs", Object.assign(Object.assign({}, this.logContext), {
        codecs: e,
        currentCodec: this.codec
      })), !this.codec && e.length > 0)
        return yield this.setPublishingLayers(this.isSvcPublish(e[0].codec), e[0].qualities), [];
      this.subscribedCodecs = e;
      const d = [];
      try {
        for (t = !0, n = Ne(e); r = yield n.next(), s = r.done, !s; t = !0) {
          c = r.value, t = !1;
          const l = c;
          if (!this.codec || this.codec === l.codec)
            yield this.setPublishingLayers(this.isSvcPublish(l.codec), l.qualities);
          else {
            const u = this.simulcastCodecs.get(l.codec);
            if (this.log.debug("try setPublishingCodec for ".concat(l.codec), Object.assign(Object.assign({}, this.logContext), {
              simulcastCodecInfo: u
            })), !u || !u.sender) {
              for (const h of l.qualities)
                if (h.enabled) {
                  d.push(l.codec);
                  break;
                }
            } else u.encodings && (this.log.debug("try setPublishingLayersForSender ".concat(l.codec), this.logContext), yield mo(u.sender, u.encodings, l.qualities, this.senderLock, this.isSvcPublish(l.codec), this.log, this.logContext));
          }
        }
      } catch (l) {
        a = {
          error: l
        };
      } finally {
        try {
          !t && !s && (o = n.return) && (yield o.call(n));
        } finally {
          if (a) throw a.error;
        }
      }
      return d;
    });
  }
  /**
   * @internal
   * Sets layers that should be publishing
   */
  setPublishingLayers(e, t) {
    return m(this, void 0, void 0, function* () {
      if (this.optimizeForPerformance) {
        this.log.info("skipping setPublishingLayers due to optimized publishing performance", Object.assign(Object.assign({}, this.logContext), {
          qualities: t
        }));
        return;
      }
      this.log.debug("setting publishing layers", Object.assign(Object.assign({}, this.logContext), {
        qualities: t
      })), !(!this.sender || !this.encodings) && (yield mo(this.sender, this.encodings, t, this.senderLock, e, this.log, this.logContext));
    });
  }
  /**
   * Designed for lower powered devices, reduces video publishing quality and disables simulcast.
   * @experimental
   */
  prioritizePerformance() {
    return m(this, void 0, void 0, function* () {
      if (!this.sender)
        throw new Error("sender not found");
      const e = yield this.senderLock.lock();
      try {
        this.optimizeForPerformance = !0;
        const t = this.sender.getParameters();
        t.encodings = t.encodings.map((n, r) => {
          var s;
          return Object.assign(Object.assign({}, n), {
            active: r === 0,
            scaleResolutionDownBy: Math.max(1, Math.ceil(((s = this.mediaStreamTrack.getSettings().height) !== null && s !== void 0 ? s : 360) / 360)),
            scalabilityMode: r === 0 && Pt(this.codec) ? "L1T3" : void 0,
            maxFramerate: r === 0 ? 15 : 0,
            maxBitrate: r === 0 ? n.maxBitrate : 0
          });
        }), this.log.debug("setting performance optimised encodings", Object.assign(Object.assign({}, this.logContext), {
          encodings: t.encodings
        })), this.encodings = t.encodings, yield this.sender.setParameters(t);
      } catch (t) {
        this.log.error("failed to set performance optimised encodings", Object.assign(Object.assign({}, this.logContext), {
          error: t
        })), this.optimizeForPerformance = !1;
      } finally {
        e();
      }
    });
  }
  handleAppVisibilityChanged() {
    const e = Object.create(null, {
      handleAppVisibilityChanged: {
        get: () => super.handleAppVisibilityChanged
      }
    });
    return m(this, void 0, void 0, function* () {
      yield e.handleAppVisibilityChanged.call(this), Rd() && this.isInBackground && this.source === E.Source.Camera && (this._mediaStreamTrack.enabled = !1);
    });
  }
}
function mo(i, e, t, n, r, s, a) {
  return m(this, void 0, void 0, function* () {
    const o = yield n.lock();
    s.debug("setPublishingLayersForSender", Object.assign(Object.assign({}, a), {
      sender: i,
      qualities: t,
      senderEncodings: e
    }));
    try {
      const c = i.getParameters(), d = c.encodings;
      if (!d)
        return;
      if (d.length !== e.length) {
        s.warn("cannot set publishing layers, encodings mismatch", Object.assign(Object.assign({}, a), {
          encodings: d,
          senderEncodings: e
        }));
        return;
      }
      let l = !1;
      !1 && d[0].scalabilityMode || (r && t.some((f) => f.enabled) && t.forEach((f) => f.enabled = !0), d.forEach((h, f) => {
        var g;
        let p = (g = h.rid) !== null && g !== void 0 ? g : "";
        p === "" && (p = "q");
        const k = zd(p), T = t.find((S) => S.quality === k);
        T && h.active !== T.enabled && (l = !0, h.active = T.enabled, s.debug("setting layer ".concat(T.quality, " to ").concat(h.active ? "enabled" : "disabled"), a), jt() && (T.enabled ? (h.scaleResolutionDownBy = e[f].scaleResolutionDownBy, h.maxBitrate = e[f].maxBitrate, h.maxFrameRate = e[f].maxFrameRate) : (h.scaleResolutionDownBy = 4, h.maxBitrate = 10, h.maxFrameRate = 2)));
      })), l && (c.encodings = d, s.debug("setting encodings", Object.assign(Object.assign({}, a), {
        encodings: c.encodings
      })), yield i.setParameters(c));
    } finally {
      o();
    }
  });
}
function zd(i) {
  switch (i) {
    case "f":
      return De.HIGH;
    case "h":
      return De.MEDIUM;
    case "q":
      return De.LOW;
    default:
      return De.HIGH;
  }
}
function po(i, e, t, n) {
  if (!t)
    return [new kt({
      quality: De.HIGH,
      width: i,
      height: e,
      bitrate: 0,
      ssrc: 0
    })];
  if (n) {
    const r = t[0].scalabilityMode, s = new Gd(r), a = [], o = s.suffix == "h" ? 1.5 : 2, c = s.suffix == "h" ? 2 : 3;
    for (let d = 0; d < s.spatial; d += 1)
      a.push(new kt({
        quality: Math.min(De.HIGH, s.spatial - 1) - d,
        width: Math.ceil(i / Math.pow(o, d)),
        height: Math.ceil(e / Math.pow(o, d)),
        bitrate: t[0].maxBitrate ? Math.ceil(t[0].maxBitrate / Math.pow(c, d)) : 0,
        ssrc: 0
      }));
    return a;
  }
  return t.map((r) => {
    var s, a, o;
    const c = (s = r.scaleResolutionDownBy) !== null && s !== void 0 ? s : 1;
    let d = zd((a = r.rid) !== null && a !== void 0 ? a : "");
    return new kt({
      quality: d,
      width: Math.ceil(i / c),
      height: Math.ceil(e / c),
      bitrate: (o = r.maxBitrate) !== null && o !== void 0 ? o : 0,
      ssrc: 0
    });
  });
}
const Sp = 2 * 1e3, Mr = "leave-reconnect", Cp = 10 * 1e3, Ep = 3e4, wp = 3, _p = 3;
var Oe;
(function(i) {
  i[i.New = 0] = "New", i[i.Connected = 1] = "Connected", i[i.Disconnected = 2] = "Disconnected", i[i.Reconnecting = 3] = "Reconnecting", i[i.Closed = 4] = "Closed";
})(Oe || (Oe = {}));
const go = 64e3;
class Pp extends Ie.EventEmitter {
  get isClosed() {
    return this._isClosed;
  }
  get isNewlyCreated() {
    return this._isNewlyCreated;
  }
  get pendingReconnect() {
    return !!this.reconnectTimeout;
  }
  get serverVersion() {
    var e, t, n;
    return ((t = (e = this.latestJoinResponse) === null || e === void 0 ? void 0 : e.serverInfo) === null || t === void 0 ? void 0 : t.version) || ((n = this.latestJoinResponse) === null || n === void 0 ? void 0 : n.serverVersion) || void 0;
  }
  get reliableChannel() {
    return this.dataChannels.reliable;
  }
  get lossyChannel() {
    return this.dataChannels.lossy;
  }
  get dataTrackChannel() {
    return this.dataChannels.dataTrack;
  }
  constructor(e) {
    var t;
    super(), this.options = e, this.rtcConfig = {}, this.peerConnectionTimeout = Zs.peerConnectionTimeout, this.fullReconnectOnNext = !1, this.latestRemoteOfferId = 0, this.subscriberPrimary = !1, this.pcState = Oe.New, this._isClosed = !0, this._isNewlyCreated = !0, this.pendingTrackResolvers = {}, this.reconnectAttempts = 0, this.reconnectStart = 0, this.attemptingReconnect = !1, this.joinAttempts = 0, this.maxJoinAttempts = 1, this.shouldFailNext = !1, this.shouldFailOnV1Path = !1, this.log = q, this.reliableReceivedState = new Lm(Ep), this.midToTrackId = {}, this.isWaitingForNetworkReconnect = !1, this.handleDataChannel = (n) => m(this, [n], void 0, function(r) {
      var s = this;
      let a = r.channel;
      return (function* () {
        a && s.dataChannels.adoptSubscriberChannel(a) && s.log.debug("on data channel ".concat(a.id, ", ").concat(a.label));
      })();
    }), this.handleDataMessage = (n) => m(this, void 0, void 0, function* () {
      var r, s, a, o;
      const c = yield this.dataProcessLock.lock();
      try {
        const d = yield this.decodeDataMessage(n);
        if (!d)
          return;
        const l = Ce.fromBinary(d);
        if (l.sequence > 0 && l.participantSid !== "") {
          const u = this.reliableReceivedState.get(l.participantSid);
          if (u && l.sequence <= u)
            return;
          this.reliableReceivedState.set(l.participantSid, l.sequence);
        }
        if (((r = l.value) === null || r === void 0 ? void 0 : r.case) === "speaker")
          this.emit(P.ActiveSpeakersUpdate, l.value.value.speakers);
        else if (((s = l.value) === null || s === void 0 ? void 0 : s.case) === "encryptedPacket") {
          if (!this.e2eeManager) {
            this.log.error("Received encrypted packet but E2EE not set up");
            return;
          }
          let u;
          try {
            u = yield this.e2eeManager.handleEncryptedData(l.value.value.encryptedValue, l.value.value.iv, l.participantIdentity, l.value.value.keyIndex);
          } catch (g) {
            this.log.debug("failed to decrypt data packet", {
              error: g,
              participantIdentity: l.participantIdentity
            });
            return;
          }
          const h = cc.fromBinary(u.payload), f = new Ce({
            value: h.value,
            participantIdentity: l.participantIdentity,
            participantSid: l.participantSid
          });
          ((a = f.value) === null || a === void 0 ? void 0 : a.case) === "user" && vo(f, f.value.value), this.emit(P.DataPacketReceived, f, l.value.value.encryptionType);
        } else
          ((o = l.value) === null || o === void 0 ? void 0 : o.case) === "user" && vo(l, l.value.value), this.emit(P.DataPacketReceived, l, G.NONE);
      } finally {
        c();
      }
    }), this.handleDataTrackMessage = (n) => m(this, void 0, void 0, function* () {
      const r = yield this.decodeDataMessage(n);
      r && this.emit("dataTrackPacketReceived", r);
    }), this.handleDataError = (n) => {
      if (this._isClosed)
        return;
      const s = n.currentTarget.maxRetransmits === 0 ? "lossy" : "reliable";
      if (typeof RTCErrorEvent < "u" && n instanceof RTCErrorEvent && n.error) {
        const a = n.error;
        this.log.error("DataChannel error on ".concat(s, ": ").concat(a.message), {
          error: a,
          errorDetail: a.errorDetail,
          sctpCauseCode: a.sctpCauseCode
        });
      } else
        this.log.error("Unknown DataChannel error on ".concat(s), {
          event: n
        });
    }, this.handleDataChannelClose = (n) => () => {
      var r;
      !this._isClosed && ((r = this.pcManager) === null || r === void 0 ? void 0 : r.publisher.getConnectionState()) === "connected" && this.log.error("publisher data channel '".concat(V[n], "' closed unexpectedly"), this.logContext);
    }, this.handleDisconnect = (n, r) => {
      if (this._isClosed)
        return;
      this.log.warn("".concat(n, " disconnected")), this.reconnectAttempts === 0 && (this.reconnectStart = Date.now());
      const s = (c) => {
        this.log.warn("could not recover connection after ".concat(this.reconnectAttempts, " attempts, ").concat(c, "ms. giving up")), this.emit(P.Disconnected), this.close("gave up reconnecting after ".concat(this.reconnectAttempts, " attempts, ").concat(c, "ms"));
      }, a = Date.now() - this.reconnectStart;
      let o = this.getNextRetryDelay({
        elapsedMs: a,
        retryCount: this.reconnectAttempts
      });
      if (o === null) {
        s(a);
        return;
      }
      n === Mr && (o = 0), this.log.debug("reconnecting in ".concat(o, "ms")), this.clearReconnectTimeout(), this.token && this.emit(P.TokenRefreshed, this.token), this.reconnectTimeout = Q.setTimeout(() => this.attemptReconnect(r).finally(() => this.reconnectTimeout = void 0), o);
    }, this.waitForRestarted = () => new Promise((n, r) => {
      this.pcState === Oe.Connected && n();
      const s = () => {
        this.off(P.Disconnected, a), n();
      }, a = () => {
        this.off(P.Restarted, s), r();
      };
      this.once(P.Restarted, s), this.once(P.Disconnected, a);
    }), this.onRtpMapAvailable = (n) => {
      const r = /* @__PURE__ */ new Map();
      n.forEach((s) => {
        const a = s.codec.toLowerCase();
        Od(a) && r.set(s.payload, a);
      }), this.emit(P.RTPVideoMapUpdate, r);
    }, this.handleBrowserOnLine = () => m(this, void 0, void 0, function* () {
      !this.url || !(yield fetch(Bn(this.url), {
        method: "HEAD"
      }).then((r) => r.ok).catch(() => !1)) || (this.log.info("detected network reconnected"), // in case the engine is currently reconnecting, attempt a reconnect immediately after the browser state has changed to 'onLine'
      (this.client.currentState === Se.RECONNECTING || // also if the browser went offline before and the engine still thinks it's in a connected state, treat it as a network interruption that we haven't noticed yet
      this.isWaitingForNetworkReconnect && this.client.currentState === Se.CONNECTED) && (this.clearReconnectTimeout(), this.attemptReconnect(rt.RR_SIGNAL_DISCONNECTED), this.isWaitingForNetworkReconnect = !1));
    }), this.handleBrowserOffline = () => m(this, void 0, void 0, function* () {
      if (this.url)
        try {
          yield Promise.race([
            fetch(Bn(this.url), {
              method: "HEAD"
            }),
            // if there's no internet connection the fetch rejects immediately, so we only use a short timeout here
            ke(4e3).then(() => Promise.reject())
          ]);
        } catch {
          window.navigator.onLine === !1 && (this.log.info("detected network interruption"), this.isWaitingForNetworkReconnect = !0);
        }
    }), this.log = he((t = e.loggerName) !== null && t !== void 0 ? t : te.Engine, () => this.logContext), this.loggerOptions = {
      loggerName: e.loggerName,
      loggerContextCb: () => this.logContext
    }, this.client = new $s(void 0, this.loggerOptions), this.client.signalLatency = this.options.expSignalLatency, this.reconnectPolicy = this.options.reconnectPolicy, this.closingLock = new ue(), this.dataProcessLock = new ue(), this.dataChannels = new ip({
      isEngineClosed: () => this.isClosed,
      isReconnecting: () => this.attemptingReconnect,
      onDataMessage: (n) => this.handleDataMessage(n),
      onDataTrackMessage: (n) => this.handleDataTrackMessage(n),
      onDataError: (n) => this.handleDataError(n),
      onChannelClose: (n) => this.handleDataChannelClose(n)(),
      onBufferStatusChanged: (n, r) => this.emit(P.DCBufferStatusChanged, r, n)
    }), this.client.onParticipantUpdate = (n) => this.emit(P.ParticipantUpdate, n), this.client.onConnectionQuality = (n) => {
      this.handleLocalConnectionQuality(n), this.emit(P.ConnectionQualityUpdate, n);
    }, this.client.onRoomUpdate = (n) => this.emit(P.RoomUpdate, n), this.client.onSubscriptionError = (n) => this.emit(P.SubscriptionError, n), this.client.onSubscriptionPermissionUpdate = (n) => this.emit(P.SubscriptionPermissionUpdate, n), this.client.onSpeakersChanged = (n) => this.emit(P.SpeakersChanged, n), this.client.onStreamStateUpdate = (n) => this.emit(P.StreamStateChanged, n), this.client.onRequestResponse = (n) => this.emit(P.SignalRequestResponse, n), this.client.onParticipantUpdate = (n) => this.emit(P.ParticipantUpdate, n), this.client.onJoined = (n) => this.emit(P.Joined, n);
  }
  /** @internal */
  get logContext() {
    var e, t, n, r, s, a;
    return {
      room: (t = (e = this.latestJoinResponse) === null || e === void 0 ? void 0 : e.room) === null || t === void 0 ? void 0 : t.name,
      roomID: (r = (n = this.latestJoinResponse) === null || n === void 0 ? void 0 : n.room) === null || r === void 0 ? void 0 : r.sid,
      participant: (a = (s = this.latestJoinResponse) === null || s === void 0 ? void 0 : s.participant) === null || a === void 0 ? void 0 : a.identity,
      participantID: this.participantSid
    };
  }
  join(e, t, n, r) {
    return m(this, arguments, void 0, function(s, a, o, c) {
      var d = this;
      let l = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !1;
      return (function* () {
        var u, h, f;
        d._isNewlyCreated = !1, d.url = s, d.token = a, d.signalOpts = o, d.maxJoinAttempts = o.maxRetries;
        try {
          d.joinAttempts += 1, d.setupSignalClientCallbacks();
          const g = !l && Vf();
          let p;
          if (g) {
            d.pcManager || (yield d.configure(), d.applyInitialPublisherLayout());
            const S = yield (u = d.pcManager) === null || u === void 0 ? void 0 : u.publisher.createInitialOffer();
            S && (p = Dt(S.offer, S.offerId));
          }
          if (c != null && c.aborted)
            throw x.cancelled("Connection aborted");
          if (!l && d.shouldFailOnV1Path)
            throw d.shouldFailOnV1Path = !1, x.serviceNotFound("Simulated v1 path failure", "v0-rtc");
          const k = yield d.client.join(s, a, o, c, l, p);
          d._isClosed = !1, d.latestJoinResponse = k, d.participantSid = (h = k.participant) === null || h === void 0 ? void 0 : h.sid, d.subscriberPrimary = k.subscriberPrimary, g ? (f = d.pcManager) === null || f === void 0 || f.updateConfiguration(d.makeRTCConfiguration(k)) : (d.pcManager || (yield d.configure(k, !l), l || d.applyInitialPublisherLayout()), (!d.subscriberPrimary || k.fastPublish) && d.negotiate().catch((S) => {
            d.log.error(S);
          })), d.registerOnLineListener(), d.clientConfiguration = k.clientConfiguration, d.emit(P.SignalConnected, k);
          let T = k.serverInfo;
          return T || (T = {
            version: k.serverVersion,
            region: k.serverRegion
          }), d.log.info("connected to Livekit Server ".concat(Object.entries(T).map((S) => {
            let I = L(S, 2), b = I[0], y = I[1];
            return "".concat(b, ": ").concat(y);
          }).join(", "))), {
            joinResponse: k,
            serverInfo: T
          };
        } catch (g) {
          if (g instanceof x) {
            if (g.reason === J.ServerUnreachable) {
              if (d.log.warn("Couldn't connect to server, attempt ".concat(d.joinAttempts, " of ").concat(d.maxJoinAttempts)), d.joinAttempts < d.maxJoinAttempts)
                return d.join(s, a, o, c, l);
            } else if (g.reason === J.ServiceNotFound)
              return d.log.warn("Initial connection failed: ".concat(g.message, " – Retrying")), d.pcManager && (d.pcManager.onStateChange = void 0, yield d.cleanupPeerConnections()), d.join(s, a, o, c, !0);
          }
          throw g;
        }
      })();
    });
  }
  /**
   * @param reason why the session is ending, recorded by the signal lifecycle. Worth passing
   * wherever the caller knows more than "someone called close" — the server's leave reason, or
   * having given up on reconnecting.
   */
  close(e) {
    return m(this, void 0, void 0, function* () {
      const t = yield this.closingLock.lock();
      if (this.isClosed) {
        t();
        return;
      }
      try {
        this._isClosed = !0, this.joinAttempts = 0, this.emit(P.Closing), this.removeAllListeners(), this.deregisterOnLineListener(), this.clearPendingReconnect(), this.clearLostQualityTimeout(), this.cleanupLossyDataStats(), yield this.cleanupPeerConnections(), yield this.cleanupClient(e);
      } finally {
        t();
      }
    });
  }
  cleanupPeerConnections() {
    return m(this, void 0, void 0, function* () {
      var e;
      this.dataChannels.teardown(), yield (e = this.pcManager) === null || e === void 0 ? void 0 : e.close(), this.pcManager = void 0, this.transportConnectingSince = void 0, this.reliableReceivedState.clear();
    });
  }
  cleanupLossyDataStats() {
    this.lossyChannel.stopThresholdTuning();
  }
  cleanupClient(e) {
    return m(this, void 0, void 0, function* () {
      yield this.client.close(!0, e), this.client.resetCallbacks();
      for (const t of Object.keys(this.pendingTrackResolvers))
        this.pendingTrackResolvers[t].reject();
      this.pendingTrackResolvers = {};
    });
  }
  addTrack(e) {
    if (this.pendingTrackResolvers[e.cid])
      throw new et("a track with the same ID has already been published");
    return new Promise((t, n) => {
      const r = Q.setTimeout(() => {
        delete this.pendingTrackResolvers[e.cid], n(x.timeout("publication of local track timed out, no response from server"));
      }, 1e4);
      this.pendingTrackResolvers[e.cid] = {
        resolve: (s) => {
          Q.clearTimeout(r), t(s);
        },
        reject: () => {
          Q.clearTimeout(r), n(new Error("Cancelled publication by calling unpublish"));
        }
      }, this.client.sendAddTrack(e);
    });
  }
  /**
   * Removes sender from PeerConnection, returning true if it was removed successfully
   * and a negotiation is necessary
   * @param sender
   * @returns
   */
  removeTrack(e) {
    if (e.track && this.pendingTrackResolvers[e.track.id]) {
      const t = this.pendingTrackResolvers[e.track.id].reject;
      t && t(), delete this.pendingTrackResolvers[e.track.id];
    }
    try {
      return this.pcManager.removeTrack(e), !0;
    } catch (t) {
      this.log.warn("failed to remove track", {
        error: t
      });
    }
    return !1;
  }
  updateMuteStatus(e, t) {
    this.client.sendMuteTrack(e, t);
  }
  get dataSubscriberReadyState() {
    var e;
    return (e = this.dataChannelForKind(V.RELIABLE, !0)) === null || e === void 0 ? void 0 : e.readyState;
  }
  getConnectedServerAddress() {
    return m(this, void 0, void 0, function* () {
      var e;
      return (e = this.pcManager) === null || e === void 0 ? void 0 : e.getConnectedAddress();
    });
  }
  /* @internal */
  setRegionStrategy(e) {
    this.regionStrategy = e;
  }
  configure(e, t) {
    return m(this, void 0, void 0, function* () {
      var n;
      if (!(this.pcManager && this.pcManager.currentState !== $.NEW)) {
        if (e) {
          this.participantSid = (n = e.participant) === null || n === void 0 ? void 0 : n.sid;
          const r = this.makeRTCConfiguration(e);
          this.pcManager = new so(t ? "publisher-only" : e.subscriberPrimary ? "subscriber-primary" : "publisher-primary", this.loggerOptions, r);
        } else {
          const r = this.makeRTCConfiguration();
          this.pcManager = new so("publisher-only", this.loggerOptions, r);
        }
        this.emit(P.TransportsCreated, this.pcManager.publisher, this.pcManager.subscriber), this.pcManager.onIceCandidate = (r, s) => {
          this.client.sendIceCandidate(r, s);
        }, this.pcManager.onPublisherOffer = (r, s) => {
          this.client.sendOffer(r, s);
        }, this.pcManager.onDataChannel = this.handleDataChannel, this.pcManager.onStateChange = (r, s, a) => m(this, void 0, void 0, function* () {
          if (this.log.debug("primary PC state changed ".concat(r)), r === $.CONNECTING ? this.transportConnectingSince = Date.now() : this.transportConnectingSince = void 0, ["closed", "disconnected", "failed"].includes(s) && (this.publisherConnectionPromise = void 0), r === $.CONNECTED) {
            const d = this.pcState === Oe.New;
            this.pcState = Oe.Connected, d && this.emit(P.Connected, this.latestJoinResponse);
          } else r === $.FAILED && (this.pcState === Oe.Connected || this.pcState === Oe.Reconnecting) && (this.pcState = Oe.Disconnected, this.handleDisconnect("peerconnection failed", a === "failed" ? rt.RR_SUBSCRIBER_FAILED : rt.RR_PUBLISHER_FAILED));
          const o = this.client.isDisconnected || this.client.currentState === Se.RECONNECTING, c = [$.FAILED, $.CLOSING, $.CLOSED].includes(r);
          o && c && !this._isClosed && this.emit(P.Offline);
        }), this.pcManager.onTrack = (r) => {
          r.streams.length !== 0 && this.emit(P.MediaTrackAdded, r.track, r.streams[0], r.receiver);
        };
      }
    });
  }
  setupSignalClientCallbacks() {
    this.client.onAnswer = (e, t, n) => m(this, void 0, void 0, function* () {
      this.pcManager && (this.log.debug("received server answer", {
        RTCSdpType: e.type,
        sdp: e.sdp,
        midToTrackId: n
      }), this.pcManager.mode === "publisher-only" && (this.midToTrackId = n), yield this.pcManager.setPublisherAnswer(e, t));
    }), this.client.onTrickle = (e, t) => {
      this.pcManager && (this.log.debug("got ICE candidate from peer", {
        candidate: e,
        target: t
      }), this.pcManager.addIceCandidate(e, t));
    }, this.client.onOffer = (e, t, n) => m(this, void 0, void 0, function* () {
      if (this.latestRemoteOfferId = t, !this.pcManager)
        return;
      this.midToTrackId = n;
      const r = yield this.pcManager.createSubscriberAnswerFromOffer(e, t);
      r && this.client.sendAnswer(r, t);
    }), this.client.onLocalTrackPublished = (e) => {
      var t;
      if (this.log.debug("received trackPublishedResponse", {
        cid: e.cid,
        track: (t = e.track) === null || t === void 0 ? void 0 : t.sid
      }), !this.pendingTrackResolvers[e.cid]) {
        this.log.error("missing track resolver for ".concat(e.cid), {
          cid: e.cid
        });
        return;
      }
      const n = this.pendingTrackResolvers[e.cid].resolve;
      delete this.pendingTrackResolvers[e.cid], n(e.track);
    }, this.client.onLocalTrackUnpublished = (e) => {
      this.emit(P.LocalTrackUnpublished, e);
    }, this.client.onLocalTrackSubscribed = (e) => {
      this.emit(P.LocalTrackSubscribed, e);
    }, this.client.onTokenRefresh = (e) => {
      this.token = e, this.emit(P.TokenRefreshed, e);
    }, this.client.onRemoteMuteChanged = (e, t) => {
      this.emit(P.RemoteMute, e, t);
    }, this.client.onSubscribedQualityUpdate = (e) => {
      this.emit(P.SubscribedQualityUpdate, e);
    }, this.client.onRoomMoved = (e) => {
      var t;
      this.participantSid = (t = e.participant) === null || t === void 0 ? void 0 : t.sid, this.latestJoinResponse && (this.latestJoinResponse.room = e.room), this.emit(P.RoomMoved, e);
    }, this.client.onMediaSectionsRequirement = (e) => {
      this.addMediaSections(e.numAudios, e.numVideos), this.negotiate();
    }, this.client.onPublishDataTrackResponse = (e) => {
      this.emit(P.PublishDataTrackResponse, e);
    }, this.client.onUnPublishDataTrackResponse = (e) => {
      this.emit(P.UnPublishDataTrackResponse, e);
    }, this.client.onDataTrackSubscriberHandles = (e) => {
      this.emit(P.DataTrackSubscriberHandles, e);
    }, this.client.onClose = () => {
      this.handleDisconnect("signal", rt.RR_SIGNAL_DISCONNECTED);
    }, this.client.onLeave = (e) => {
      var t;
      switch (this.log.info("client leave request received (action=".concat(e == null ? void 0 : e.action, ")"), {
        reason: e == null ? void 0 : e.reason
      }), e.regions && (this.log.debug("updating regions"), this.emit(P.ServerRegionsReported, e.regions)), e.action) {
        case $t.DISCONNECT:
          this.emit(P.Disconnected, e == null ? void 0 : e.reason), this.close("server leave: ".concat((t = Ae[e.reason]) !== null && t !== void 0 ? t : e.reason));
          break;
        case $t.RECONNECT:
          this.fullReconnectOnNext = !0, this.handleDisconnect(Mr);
          break;
        case $t.RESUME:
          this.handleDisconnect(Mr);
      }
    };
  }
  makeRTCConfiguration(e) {
    var t;
    const n = Object.assign({}, this.rtcConfig);
    if ((((t = this.signalOpts) === null || t === void 0 ? void 0 : t.e2eeEnabled) || this.frameMetadataWorker && !qn()) && Ks() && (this.log.debug("E2EE - setting up transports with insertable streams"), n.encodedInsertableStreams = !0), n.sdpSemantics = "unified-plan", n.continualGatheringPolicy = "gather_continually", !e)
      return n;
    if (e.iceServers && !n.iceServers) {
      const s = [];
      e.iceServers.forEach((a) => {
        const o = {
          urls: a.urls
        };
        a.username && (o.username = a.username), a.credential && (o.credential = a.credential), s.push(o);
      }), n.iceServers = s;
    }
    return e.clientConfiguration && e.clientConfiguration.forceRelay === An.ENABLED && (n.iceTransportPolicy = "relay"), n;
  }
  /**
   * Populate the publisher PC so its first offer carries the data channels + recvonly media
   * sections. Required for every V1 connection: Firefox only binds receive decoders for media
   * present in that first offer, and the offer-with-join path needs the sections to
   * build a meaningful initial offer. Must be called on a configured pcManager.
   */
  applyInitialPublisherLayout() {
    this.createDataChannels(), ze() || this.addMediaSections(wp, _p);
  }
  addMediaSections(e, t) {
    var n, r, s;
    const a = {
      direction: "recvonly"
    };
    for (let c = 0; c < e; c++)
      (n = this.pcManager) === null || n === void 0 || n.addPublisherTransceiverOfKind("audio", a);
    const o = ((r = this.pcManager) === null || r === void 0 ? void 0 : r.mode) === "publisher-only";
    for (let c = 0; c < t; c++) {
      const d = (s = this.pcManager) === null || s === void 0 ? void 0 : s.addPublisherTransceiverOfKind("video", a);
      if (o && d) {
        const l = Ef(d);
        this.log.debug("dependency descriptor negotiated for received video", {
          negotiated: l
        });
      }
    }
  }
  createDataChannels() {
    this.pcManager && this.dataChannels.createPublisherChannels(this.pcManager);
  }
  /** Normalizes an incoming data-channel message into bytes, or logs and returns undefined. */
  decodeDataMessage(e) {
    return m(this, void 0, void 0, function* () {
      if (e.data instanceof ArrayBuffer)
        return new Uint8Array(e.data);
      if (e.data instanceof Blob)
        return new Uint8Array(yield e.data.arrayBuffer());
      this.log.error("unsupported data type", {
        data: e.data
      });
    });
  }
  createSender(e, t, n) {
    return m(this, void 0, void 0, function* () {
      let r;
      if (Ci())
        r = yield this.createTransceiverRTCRtpSender(e, t, n);
      else if (ds())
        this.log.warn("using add-track fallback"), r = yield this.createRTCRtpSender(e.mediaStreamTrack);
      else
        throw new X("Required webRTC APIs not supported on this device");
      return this.setupFrameMetadataSender(r, t), r;
    });
  }
  createSimulcastSender(e, t, n, r) {
    return m(this, void 0, void 0, function* () {
      let s;
      if (Ci())
        s = yield this.createSimulcastTransceiverSender(e, t, n, r);
      else if (ds())
        this.log.debug("using add-track fallback"), s = yield this.createRTCRtpSender(e.mediaStreamTrack);
      else
        throw new X("Cannot stream on this device");
      return s && this.setupFrameMetadataSender(s, n), s;
    });
  }
  get frameMetadataWorker() {
    var e, t;
    return (t = (e = this.options.frameMetadata) !== null && e !== void 0 ? e : this.options.packetTrailer) === null || t === void 0 ? void 0 : t.worker;
  }
  setupFrameMetadataSender(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var n, r, s;
    const a = this.frameMetadataWorker;
    if (!a || !((n = this.signalOpts) === null || n === void 0) && n.e2eeEnabled)
      return;
    const o = (r = t.frameMetadata) !== null && r !== void 0 ? r : t.packetTrailer, c = _i(o);
    if (qn()) {
      c && (e.transform = new RTCRtpScriptTransform(a, {
        kind: "encode",
        packetTrailer: o
      }));
      return;
    }
    if (!jn((s = this.options.frameMetadata) !== null && s !== void 0 ? s : this.options.packetTrailer) || !("createEncodedStreams" in e)) {
      c && this.log.warn("frame metadata transform not supported; skipping write", this.logContext);
      return;
    }
    const d = e.createEncodedStreams(), l = d.readable, u = d.writable;
    c ? a.postMessage({
      kind: "encode",
      data: {
        readableStream: l,
        writableStream: u,
        packetTrailer: o
      }
    }, [l, u]) : l.pipeTo(u);
  }
  createTransceiverRTCRtpSender(e, t, n) {
    return m(this, void 0, void 0, function* () {
      if (!this.pcManager)
        throw new X("publisher is closed");
      const r = [];
      e.mediaStream && r.push(e.mediaStream), ht(e) && (e.codec = t.videoCodec);
      const s = {
        direction: "sendonly",
        streams: r
      };
      return n && (s.sendEncodings = n), (yield this.pcManager.addPublisherTransceiver(e.mediaStreamTrack, s)).sender;
    });
  }
  createSimulcastTransceiverSender(e, t, n, r) {
    return m(this, void 0, void 0, function* () {
      if (!this.pcManager)
        throw new X("publisher is closed");
      const s = {
        direction: "sendonly"
      };
      r && (s.sendEncodings = r);
      const a = yield this.pcManager.addPublisherTransceiver(t.mediaStreamTrack, s);
      if (n.videoCodec)
        return yield e.setSimulcastTrackSender(n.videoCodec, a.sender), a.sender;
    });
  }
  createRTCRtpSender(e) {
    return m(this, void 0, void 0, function* () {
      if (!this.pcManager)
        throw new X("publisher is closed");
      return this.pcManager.addPublisherTrack(e);
    });
  }
  /**
   * A sustained local `LOST` while connected and publishing means the server isn't receiving
   * our media, so force a full reconnect; any non-`LOST` value cancels a pending trigger.
   */
  handleLocalConnectionQuality(e) {
    if (!this.participantSid)
      return;
    const t = e.updates.find((n) => n.participantSid === this.participantSid);
    t && (t.quality === zt.LOST ? this.scheduleLostQualityReconnect() : this.clearLostQualityTimeout());
  }
  scheduleLostQualityReconnect() {
    this.lostQualityTimeout || (this.lostQualityTimeout = Q.setTimeout(() => {
      this.lostQualityTimeout = void 0, !(this._isClosed || this.pcState !== Oe.Connected || this.attemptingReconnect) && this.hasActivePublisherSenders() && (this.log.warn("local connection quality lost while publishing, triggering full reconnect", this.logContext), this.fullReconnectOnNext = !0, this.handleDisconnect("connection quality lost", rt.RR_PUBLISHER_FAILED));
    }, Cp));
  }
  clearLostQualityTimeout() {
    this.lostQualityTimeout && (Q.clearTimeout(this.lostQualityTimeout), this.lostQualityTimeout = void 0);
  }
  /** Whether the publisher currently has any sender with a live track. */
  hasActivePublisherSenders() {
    var e, t;
    return (t = (e = this.pcManager) === null || e === void 0 ? void 0 : e.publisher.getSenders().some((n) => !!n.track && n.track.readyState === "live")) !== null && t !== void 0 ? t : !1;
  }
  /**
   * Forces a full reconnect while keeping the engine (and its saved credentials) alive. Used by
   * Room's connection-reconcile safety net when the transport silently died but we looked connected.
   * @internal
   */
  reconnect() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : rt.RR_UNKNOWN;
    this.fullReconnectOnNext = !0, this.handleDisconnect("reconcile", e);
  }
  attemptReconnect(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r;
      if (this._isClosed)
        return;
      if (this.attemptingReconnect) {
        this.log.warn("already attempting reconnect, returning early");
        return;
      }
      this.clearLostQualityTimeout(), (((t = this.clientConfiguration) === null || t === void 0 ? void 0 : t.resumeConnection) === An.DISABLED || // signaling state could change to closed due to hardware sleep
      // those connections cannot be resumed
      ((r = (n = this.pcManager) === null || n === void 0 ? void 0 : n.currentState) !== null && r !== void 0 ? r : $.NEW) === $.NEW) && (this.fullReconnectOnNext = !0);
      const s = this.fullReconnectOnNext;
      this.fullReconnectOnNext = !1;
      let a = !1;
      try {
        this.attemptingReconnect = !0, s ? yield this.restartConnection() : yield this.resumeConnection(e), this.clearPendingReconnect(), a = !0;
      } catch (o) {
        this.reconnectAttempts += 1;
        let c = !0;
        o instanceof X ? (this.log.debug("received unrecoverable error", {
          error: o
        }), c = !1) : (s || !(o instanceof Kt)) && (this.fullReconnectOnNext = !0), c ? this.handleDisconnect("reconnect", rt.RR_UNKNOWN) : (this.log.info("could not recover connection after ".concat(this.reconnectAttempts, " attempts, ").concat(Date.now() - this.reconnectStart, "ms. giving up")), this.emit(P.Disconnected), yield this.close("gave up reconnecting after ".concat(this.reconnectAttempts, " attempts, ").concat(Date.now() - this.reconnectStart, "ms")));
      } finally {
        this.attemptingReconnect = !1, a && this.fullReconnectOnNext && !this._isClosed && (this.log.debug("full reconnect requested during in-progress attempt, dispatching"), this.handleDisconnect("reconnect"));
      }
    });
  }
  getNextRetryDelay(e) {
    try {
      return this.reconnectPolicy.nextRetryDelayInMs(e);
    } catch (t) {
      this.log.warn("encountered error in reconnect policy", {
        error: t
      });
    }
    return null;
  }
  restartConnection(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r;
      try {
        if (!this.url || !this.token)
          throw new X("could not reconnect, url or token not saved");
        this.log.info("reconnecting, attempt: ".concat(this.reconnectAttempts)), this.emit(P.Restarting), this.client.isDisconnected || (yield this.client.sendLeave()), yield this.cleanupPeerConnections(), yield this.cleanupClient();
        let s;
        try {
          if (!this.signalOpts)
            throw this.log.warn("attempted connection restart, without signal options present"), new Kt();
          s = (yield this.join(e ?? this.url, this.token, this.signalOpts, void 0, !this.options.singlePeerConnection)).joinResponse;
        } catch (a) {
          throw a instanceof x && a.reason === J.NotAllowed ? new X("could not reconnect, token might be expired") : new Kt();
        }
        if (this.shouldFailNext)
          throw this.shouldFailNext = !1, new Error("simulated failure");
        if (this.client.setReconnected(), this.emit(P.SignalRestarted, s), yield this.waitForPCReconnected(), this.client.currentState !== Se.CONNECTED)
          throw new Kt("Signal connection got severed during reconnect");
        (t = this.regionStrategy) === null || t === void 0 || t.resetAttempts(), this.emit(P.Restarted);
      } catch (s) {
        const a = yield (n = this.regionStrategy) === null || n === void 0 ? void 0 : n.getNextUrl();
        if (a) {
          yield this.restartConnection(a);
          return;
        } else
          throw (r = this.regionStrategy) === null || r === void 0 || r.resetAttempts(), s;
      }
    });
  }
  resumeConnection(e) {
    return m(this, void 0, void 0, function* () {
      if (!this.url || !this.token)
        throw new X("could not reconnect, url or token not saved");
      if (!this.pcManager)
        throw new X("publisher and subscriber connections unset");
      this.log.info("resuming signal connection, attempt ".concat(this.reconnectAttempts)), this.emit(P.Resuming);
      let t;
      try {
        this.setupSignalClientCallbacks(), t = yield this.client.reconnect(this.url, this.token, this.participantSid, e);
      } catch (r) {
        let s = "";
        throw r instanceof Error && (s = r.message, this.log.error(r.message, {
          error: r
        })), r instanceof x && r.reason === J.NotAllowed ? new X("could not reconnect, token might be expired") : r instanceof x && r.reason === J.LeaveRequest ? r : new Kt(s);
      }
      if (this.emit(P.SignalResumed), t) {
        const r = this.makeRTCConfiguration(t);
        this.pcManager.updateConfiguration(r), this.latestJoinResponse && (this.latestJoinResponse.serverInfo = t.serverInfo);
      } else
        this.log.warn("Did not receive reconnect response");
      if (this.shouldFailNext)
        throw this.shouldFailNext = !1, new Error("simulated failure");
      if (yield this.pcManager.triggerIceRestart(), yield this.waitForPCReconnected(), this.client.currentState !== Se.CONNECTED)
        throw new Kt("Signal connection got severed during reconnect");
      this.client.setReconnected();
      const n = this.dataChannelForKind(V.RELIABLE);
      (n == null ? void 0 : n.readyState) === "open" && n.id === null && this.createDataChannels(), t != null && t.lastMessageSeq && this.resendReliableMessagesForResume(t.lastMessageSeq).catch((r) => {
        this.log.warn("failed to resend reliable messages after resume", Object.assign(Object.assign({}, this.logContext), {
          error: r
        }));
      }), this.emit(P.Resumed);
    });
  }
  waitForPCInitialConnection(e, t) {
    return m(this, void 0, void 0, function* () {
      if (!this.pcManager)
        throw new X("PC manager is closed");
      yield this.pcManager.ensurePCTransportConnection(t, e);
    });
  }
  waitForPCReconnected() {
    return m(this, void 0, void 0, function* () {
      this.pcState = Oe.Reconnecting, this.log.debug("waiting for peer connection to reconnect");
      try {
        if (yield ke(Sp), !this.pcManager)
          throw new X("PC manager is closed");
        yield this.pcManager.ensurePCTransportConnection(void 0, this.peerConnectionTimeout), this.pcState = Oe.Connected;
      } catch (e) {
        throw this.pcState = Oe.Disconnected, x.internal("could not establish PC connection, ".concat(e.message));
      }
    });
  }
  /** @internal */
  publishRpcAck(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = new Ce({
        destinationIdentities: [e],
        kind: Tt.RELIABLE,
        value: {
          case: "rpcAck",
          value: new Ni({
            requestId: t
          })
        }
      });
      yield this.sendDataPacket(n, V.RELIABLE);
    });
  }
  /* @internal */
  sendDataPacket(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r;
      if (yield this.ensurePublisherConnected(t), this.e2eeManager && this.e2eeManager.isDataChannelEncryptionEnabled) {
        const o = nm(e);
        if (o) {
          const c = yield this.e2eeManager.encryptData(o.toBinary());
          e.value = {
            case: "encryptedPacket",
            value: new oc({
              encryptedValue: c.payload,
              iv: c.iv,
              keyIndex: c.keyIndex
            })
          };
        }
      }
      t === V.RELIABLE && (e.sequence = this.reliableChannel.nextSequence());
      const s = e.toBinary(), a = Math.min((r = (n = this.pcManager) === null || n === void 0 ? void 0 : n.getMaxPublisherMessageSize()) !== null && r !== void 0 ? r : go, go);
      if (typeof a < "u" && a !== 0 && s.byteLength > a)
        throw new af("cannot publish data packet larger than ".concat(a, " bytes (got ").concat(s.byteLength, ")"));
      t === V.RELIABLE ? yield this.reliableChannel.send(s, e.sequence) : yield this.lossyChannel.send(s);
    });
  }
  /**
   * Sends pre-serialized bytes on the data-track channel. This is the one send path that doesn't
   * go through {@link sendDataPacket} — Room's `packetAvailable` handler calls it directly with
   * bytes the data-track pipeline already serialized.
   *
   * @internal
   */
  sendDataTrackFrame(e) {
    return m(this, void 0, void 0, function* () {
      yield this.ensurePublisherConnected(V.DATA_TRACK_LOSSY), yield this.dataTrackChannel.send(e);
    });
  }
  resendReliableMessagesForResume(e) {
    return m(this, void 0, void 0, function* () {
      yield this.ensurePublisherConnected(V.RELIABLE), yield this.reliableChannel.replay(e);
    });
  }
  /** The flow-control gate for `kind` — see {@link FlowControlledDataChannel}. */
  flowControlFor(e) {
    return this.dataChannels.channelFor(e);
  }
  /**
   * Resolves once the caller may send on the `kind` channel — see
   * {@link FlowControlledDataChannel.waitForHeadroomWithLock}.
   */
  waitForBufferHeadroom(e) {
    return m(this, void 0, void 0, function* () {
      return this.flowControlFor(e).waitForHeadroomWithLock();
    });
  }
  /**
   * @internal
   */
  ensureDataTransportConnected(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.subscriberPrimary;
      return (function* () {
        var s;
        if (!n.pcManager)
          throw new X("PC manager is closed");
        const a = r ? n.pcManager.subscriber : n.pcManager.publisher, o = r ? "Subscriber" : "Publisher";
        if (!a)
          throw x.internal("".concat(o, " connection not set"));
        let c = !1;
        !r && !n.dataChannelForKind(t, r) && (n.createDataChannels(), c = !0), !c && !r && !n.pcManager.publisher.isICEConnected && n.pcManager.publisher.getICEConnectionState() !== "checking" && (c = !0), c && n.negotiate().catch((u) => {
          n.log.error(u);
        });
        const d = n.dataChannelForKind(t, r);
        if ((d == null ? void 0 : d.readyState) === "open")
          return;
        const l = (/* @__PURE__ */ new Date()).getTime() + n.peerConnectionTimeout;
        for (; (/* @__PURE__ */ new Date()).getTime() < l; ) {
          if (a.isICEConnected && ((s = n.dataChannelForKind(t, r)) === null || s === void 0 ? void 0 : s.readyState) === "open")
            return;
          yield ke(50);
        }
        throw x.internal("could not establish ".concat(o, " connection, state: ").concat(a.getICEConnectionState()));
      })();
    });
  }
  ensurePublisherConnected(e) {
    return m(this, void 0, void 0, function* () {
      this.publisherConnectionPromise || (this.publisherConnectionPromise = this.ensureDataTransportConnected(e, !1)), yield this.publisherConnectionPromise;
    });
  }
  /* @internal */
  verifyTransport() {
    if (!this.pcManager)
      return !1;
    const e = this.pcManager.currentState;
    return ![$.CONNECTING, $.CONNECTED].includes(e) || !this.client.ws || this.client.ws.readyState === WebSocket.CLOSED ? !1 : e === $.CONNECTING && this.transportConnectingSince !== void 0 && Date.now() - this.transportConnectingSince > this.peerConnectionTimeout ? (this.log.warn("transport stuck in connecting state", this.logContext), !1) : !0;
  }
  /** @internal */
  negotiate() {
    return m(this, void 0, void 0, function* () {
      return new Ee((e, t) => m(this, void 0, void 0, function* () {
        if (!this.pcManager) {
          t(new St("PC manager is closed"));
          return;
        }
        this.pcManager.requirePublisher(), this.pcManager.publisher.getTransceivers().length == 0 && !this.dataChannels.hasPublisherChannels && this.createDataChannels();
        const n = new AbortController(), r = () => {
          n.abort(), this.log.debug("engine disconnected while negotiation was ongoing"), e();
        };
        this.isClosed && t(new St("cannot negotiate on closed engine")), this.on(P.Closing, r), this.on(P.Restarting, r), this.pcManager.publisher.off(bt.RTPVideoPayloadTypes, this.onRtpMapAvailable), this.pcManager.publisher.once(bt.RTPVideoPayloadTypes, this.onRtpMapAvailable);
        try {
          yield this.pcManager.negotiate(n), e();
        } catch (s) {
          if (n.signal.aborted) {
            e();
            return;
          }
          s instanceof St && (this.fullReconnectOnNext = !0), this.handleDisconnect("negotiation", rt.RR_UNKNOWN), s instanceof Error ? t(s) : t(new Error(String(s)));
        } finally {
          this.off(P.Closing, r), this.off(P.Restarting, r);
        }
      }));
    });
  }
  dataChannelForKind(e, t) {
    return this.dataChannels.getHandle(e, t);
  }
  /** @internal */
  sendSyncState(e, t, n) {
    var r, s, a, o;
    if (!this.pcManager) {
      this.log.warn("sync state cannot be sent without peer connection setup");
      return;
    }
    const c = this.pcManager.publisher.getLocalDescription(), d = this.pcManager.publisher.getRemoteDescription(), l = (r = this.pcManager.subscriber) === null || r === void 0 ? void 0 : r.getRemoteDescription(), u = (s = this.pcManager.subscriber) === null || s === void 0 ? void 0 : s.getLocalDescription(), h = (o = (a = this.signalOpts) === null || a === void 0 ? void 0 : a.autoSubscribe) !== null && o !== void 0 ? o : !0, f = new Array(), g = new Array();
    e.forEach((p) => {
      p.isDesired !== h && f.push(p.trackSid), p.isEnabled || g.push(p.trackSid);
    }), this.client.sendSyncState(new Fs({
      answer: this.pcManager.mode === "publisher-only" ? d ? Dt({
        sdp: d.sdp,
        type: d.type
      }) : void 0 : u ? Dt({
        sdp: u.sdp,
        type: u.type
      }) : void 0,
      offer: this.pcManager.mode === "publisher-only" ? c ? Dt({
        sdp: c.sdp,
        type: c.type
      }) : void 0 : l ? Dt({
        sdp: l.sdp,
        type: l.type
      }) : void 0,
      subscription: new Hi({
        trackSids: f,
        subscribe: !h,
        participantTracks: []
      }),
      publishTracks: pf(t),
      dataChannels: this.dataChannelsInfo(),
      trackSidsDisabled: g,
      datachannelReceiveStates: this.reliableReceivedState.map((p, k) => new Ac({
        publisherSid: k,
        lastSeq: p
      })),
      publishDataTracks: n.map((p) => new As({
        info: Pi.toProtobuf(p)
      }))
    }));
  }
  /* @internal */
  failNext() {
    this.shouldFailNext = !0;
  }
  /* @internal */
  failNextV1Path() {
    this.shouldFailOnV1Path = !0;
  }
  dataChannelsInfo() {
    const e = [], t = (n, r) => {
      (n == null ? void 0 : n.id) !== void 0 && n.id !== null && e.push(new Dc({
        label: n.label,
        id: n.id,
        target: r
      }));
    };
    return t(this.dataChannelForKind(V.LOSSY), Ve.PUBLISHER), t(this.dataChannelForKind(V.RELIABLE), Ve.PUBLISHER), t(this.dataChannelForKind(V.LOSSY, !0), Ve.SUBSCRIBER), t(this.dataChannelForKind(V.RELIABLE, !0), Ve.SUBSCRIBER), e;
  }
  clearReconnectTimeout() {
    this.reconnectTimeout && Q.clearTimeout(this.reconnectTimeout);
  }
  clearPendingReconnect() {
    this.clearReconnectTimeout(), this.reconnectAttempts = 0;
  }
  registerOnLineListener() {
    Re() && (window.addEventListener("online", this.handleBrowserOnLine), window.addEventListener("offline", this.handleBrowserOffline));
  }
  deregisterOnLineListener() {
    Re() && (window.removeEventListener("online", this.handleBrowserOnLine), window.removeEventListener("offline", this.handleBrowserOffline));
  }
  getTrackIdForReceiver(e) {
    var t;
    const n = (t = this.pcManager) === null || t === void 0 ? void 0 : t.getMidForReceiver(e);
    if (n) {
      const r = Object.entries(this.midToTrackId).find((s) => L(s, 1)[0] === n);
      if (r)
        return r[1];
    }
  }
}
function vo(i, e) {
  const t = i.participantIdentity ? i.participantIdentity : e.participantIdentity;
  i.participantIdentity = t, e.participantIdentity = t;
  const n = i.destinationIdentities.length !== 0 ? i.destinationIdentities : e.destinationIdentities;
  i.destinationIdentities = n, e.destinationIdentities = n;
}
const ti = he(te.Region), bs = 5e3, Rp = 3e4;
class W {
  static fetchRegionSettings(e, t, n) {
    return m(this, void 0, void 0, function* () {
      const r = yield W.fetchLock.lock();
      try {
        const s = yield fetch("".concat(Ip(e), "/regions"), {
          headers: {
            authorization: "Bearer ".concat(t)
          },
          signal: n
        });
        if (s.ok) {
          const a = jf(s.headers), o = a ? a * 1e3 : bs;
          return {
            regionSettings: yield s.json(),
            updatedAtInMs: Date.now(),
            maxAgeInMs: o
          };
        } else
          throw s.status === 401 ? x.notAllowed("Could not fetch region settings: ".concat(s.statusText), s.status) : x.internal("Could not fetch region settings: ".concat(s.statusText));
      } catch (s) {
        throw s instanceof x ? s : n != null && n.aborted ? x.cancelled("Region fetching was aborted") : x.serverUnreachable("Could not fetch region settings, ".concat(s instanceof Error ? "".concat(s.name, ": ").concat(s.message) : s));
      } finally {
        r();
      }
    });
  }
  static scheduleRefetch(e, t, n) {
    return m(this, void 0, void 0, function* () {
      const r = W.settingsTimeouts.get(e.hostname);
      clearTimeout(r), W.settingsTimeouts.set(e.hostname, setTimeout(() => m(this, void 0, void 0, function* () {
        try {
          const s = yield W.fetchRegionSettings(e, t);
          W.updateCachedRegionSettings(e, t, s);
        } catch (s) {
          if (s instanceof x && s.reason === J.NotAllowed) {
            ti.debug("token is not valid, cancelling auto region refresh");
            return;
          }
          ti.debug("auto refetching of region settings failed", {
            error: s
          }), W.scheduleRefetch(e, t, n);
        }
      }), n));
    });
  }
  static updateCachedRegionSettings(e, t, n) {
    W.cache.set(e.hostname, n), W.scheduleRefetch(e, t, n.maxAgeInMs);
  }
  static stopRefetch(e) {
    const t = W.settingsTimeouts.get(e);
    t && (clearTimeout(t), W.settingsTimeouts.delete(e));
  }
  static scheduleCleanup(e) {
    let t = W.connectionTrackers.get(e);
    t && (t.cleanupTimeout && clearTimeout(t.cleanupTimeout), t.cleanupTimeout = setTimeout(() => {
      const n = W.connectionTrackers.get(e);
      n && n.connectionCount === 0 && (ti.debug("stopping region refetch after disconnect delay", {
        hostname: e
      }), W.stopRefetch(e)), n && (n.cleanupTimeout = void 0);
    }, Rp));
  }
  static cancelCleanup(e) {
    const t = W.connectionTrackers.get(e);
    t != null && t.cleanupTimeout && (clearTimeout(t.cleanupTimeout), t.cleanupTimeout = void 0);
  }
  notifyConnected() {
    const e = this.serverUrl.hostname;
    let t = W.connectionTrackers.get(e);
    t || (t = {
      connectionCount: 0
    }, W.connectionTrackers.set(e, t)), t.connectionCount++, W.cancelCleanup(e);
  }
  notifyDisconnected() {
    const e = this.serverUrl.hostname, t = W.connectionTrackers.get(e);
    t && (t.connectionCount = Math.max(0, t.connectionCount - 1), t.connectionCount === 0 && W.scheduleCleanup(e));
  }
  constructor(e, t) {
    this.attemptedRegions = [], this.serverUrl = new URL(e), this.token = t;
  }
  updateToken(e) {
    var t;
    this.token = e;
    const n = this.getServerUrl(), r = W.cache.get(n.hostname);
    W.scheduleRefetch(this.serverUrl, this.token, (t = r == null ? void 0 : r.maxAgeInMs) !== null && t !== void 0 ? t : bs);
  }
  isCloud() {
    return un(this.serverUrl);
  }
  getServerUrl() {
    return this.serverUrl;
  }
  /** @internal */
  fetchRegionSettings(e) {
    return m(this, void 0, void 0, function* () {
      return W.fetchRegionSettings(this.serverUrl, this.token, e);
    });
  }
  getNextBestRegionUrl(e) {
    return m(this, void 0, void 0, function* () {
      if (!this.isCloud())
        throw Error("region availability is only supported for LiveKit Cloud domains");
      let t = W.cache.get(this.serverUrl.hostname);
      (!t || Date.now() - t.updatedAtInMs > t.maxAgeInMs) && (t = yield this.fetchRegionSettings(e), W.updateCachedRegionSettings(this.serverUrl, this.token, t));
      const n = t.regionSettings.regions.filter((r) => !this.attemptedRegions.find((s) => s.url === r.url));
      if (n.length > 0) {
        const r = n[0];
        return this.attemptedRegions.push(r), ti.info("switching to region: ".concat(r.region), {
          region: r.region
        }), r.url;
      } else
        return null;
    });
  }
  resetAttempts() {
    this.attemptedRegions = [];
  }
  setServerReportedRegions(e) {
    W.updateCachedRegionSettings(this.serverUrl, this.token, e);
  }
}
W.cache = /* @__PURE__ */ new Map();
W.settingsTimeouts = /* @__PURE__ */ new Map();
W.connectionTrackers = /* @__PURE__ */ new Map();
W.fetchLock = new ue();
function Ip(i) {
  return "".concat(i.protocol.replace("ws", "http"), "//").concat(i.host, "/settings");
}
function Or() {
  return new CompressionStream("deflate-raw");
}
function Jd() {
  return new DecompressionStream("deflate-raw");
}
function bo(i, e) {
  return m(this, void 0, void 0, function* () {
    const t = new DecompressionStream("deflate-raw"), n = t.writable.getWriter();
    return n.write(i).catch(() => {
    }), n.close().catch(() => {
    }), Qd(t.readable, e);
  });
}
function Qd(i, e) {
  return m(this, void 0, void 0, function* () {
    const t = i.getReader(), n = [];
    let r = 0;
    for (; ; ) {
      const o = yield t.read(), c = o.done, d = o.value;
      if (c)
        break;
      if (n.push(d), r += d.byteLength, typeof e == "number" && r > e)
        throw yield t.cancel(), new de("Decompressed payload exceeds the maximum payload size of ".concat(e, " bytes"), ne.PayloadTooLarge);
    }
    const s = new Uint8Array(r);
    let a = 0;
    for (const o of n)
      s.set(o, a), a += o.byteLength;
    return s;
  });
}
const Lt = 15e3, Mp = 5e9;
class Yd {
  get info() {
    return this._info;
  }
  /** @internal */
  validateBytesReceived() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !1;
    if (!(typeof this.totalByteSize != "number" || this.totalByteSize === 0)) {
      if (e && this.bytesReceived < this.totalByteSize)
        throw new de("Not enough chunk(s) received - expected ".concat(this.totalByteSize, " bytes of data total, only received ").concat(this.bytesReceived, " bytes"), ne.Incomplete);
      if (this.bytesReceived > this.totalByteSize)
        throw new de("Extra chunk(s) received - expected ".concat(this.totalByteSize, " bytes of data total, received ").concat(this.bytesReceived, " bytes"), ne.LengthExceeded);
    }
  }
  constructor(e, t, n) {
    this.reader = t, this.totalByteSize = n, this._info = e, this.bytesReceived = 0;
  }
  /**
   * Counts a chunk's bytes against `totalByteSize` and reports progress. Chunk ordering and
   * de-duplication happen upstream in the manager's `ensureOrderedChunks`, so every chunk reaching
   * here is new and in order.
   */
  handleChunkReceived(e) {
    var t;
    this.bytesReceived += e.content.byteLength, this.validateBytesReceived();
    const n = this.totalByteSize ? this.bytesReceived / this.totalByteSize : void 0;
    (t = this.onProgress) === null || t === void 0 || t.call(this, n);
  }
}
class yo extends Yd {
  [Symbol.asyncIterator]() {
    const e = this.reader.getReader();
    e.closed.catch(() => {
    });
    const t = () => {
      e.releaseLock(), this.signal = void 0;
    };
    return {
      next: () => m(this, void 0, void 0, function* () {
        var n;
        try {
          const r = this.signal;
          if (r != null && r.aborted)
            throw r.reason;
          const s = yield new Promise((a, o) => {
            if (r) {
              const c = () => o(r.reason);
              r.addEventListener("abort", c, {
                once: !0
              }), e.read().then(a, o).finally(() => {
                r.removeEventListener("abort", c);
              });
            } else
              e.read().then(a, o);
          });
          return s.done ? (this.validateBytesReceived(!0), typeof this.totalByteSize == "number" && ((n = this.onProgress) === null || n === void 0 || n.call(this, 1)), {
            done: !0,
            value: void 0
          }) : (this.handleChunkReceived(s.value), {
            done: !1,
            value: s.value.content
          });
        } catch (r) {
          throw t(), r;
        }
      }),
      // note: `return` runs only for premature exits, see:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#errors_during_iteration
      return() {
        return m(this, void 0, void 0, function* () {
          return t(), {
            done: !0,
            value: void 0
          };
        });
      }
    };
  }
  /**
   * Injects an AbortSignal, which if aborted, will terminate the currently active
   * stream iteration operation.
   *
   * Note that when using AbortSignal.timeout(...), the timeout applies across
   * the whole iteration operation, not just one individual chunk read.
   */
  withAbortSignal(e) {
    return this.signal = e, this;
  }
  readAll() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      return (function* () {
        var n, r, s, a;
        let o = /* @__PURE__ */ new Set();
        const c = t.signal ? e.withAbortSignal(t.signal) : e;
        try {
          for (var d = !0, l = Ne(c), u; u = yield l.next(), n = u.done, !n; d = !0) {
            a = u.value, d = !1;
            const h = a;
            o.add(h);
          }
        } catch (h) {
          r = {
            error: h
          };
        } finally {
          try {
            !d && !n && (s = l.return) && (yield s.call(l));
          } finally {
            if (r) throw r.error;
          }
        }
        return Array.from(o);
      })();
    });
  }
}
class ko extends Yd {
  /**
   * Async iterator implementation to allow usage of `for await...of` syntax.
   * Yields each chunk's decoded text as it arrives - a delta, not the string accumulated so far.
   */
  [Symbol.asyncIterator]() {
    const e = this.reader.getReader();
    e.closed.catch(() => {
    });
    const t = new TextDecoder("utf-8"), n = this.signal, r = () => {
      e.releaseLock(), this.signal = void 0;
    };
    return {
      next: () => m(this, void 0, void 0, function* () {
        var s;
        try {
          if (n != null && n.aborted)
            throw n.reason;
          const a = yield new Promise((o, c) => {
            if (n) {
              const d = () => c(n.reason);
              n.addEventListener("abort", d, {
                once: !0
              }), e.read().then(o, c).finally(() => {
                n.removeEventListener("abort", d);
              });
            } else
              e.read().then(o, c);
          });
          if (a.done)
            return this.validateBytesReceived(!0), typeof this.totalByteSize == "number" && ((s = this.onProgress) === null || s === void 0 || s.call(this, 1)), {
              done: !0,
              value: void 0
            };
          {
            this.handleChunkReceived(a.value);
            let o;
            try {
              o = t.decode(a.value.content);
            } catch (c) {
              throw new de("Cannot decode datastream chunk ".concat(a.value.chunkIndex, " as text: ").concat(c), ne.DecodeFailed);
            }
            return {
              done: !1,
              value: o
            };
          }
        } catch (a) {
          throw r(), a;
        }
      }),
      // note: `return` runs only for premature exits, see:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#errors_during_iteration
      return() {
        return m(this, void 0, void 0, function* () {
          return r(), {
            done: !0,
            value: void 0
          };
        });
      }
    };
  }
  /**
   * Injects an AbortSignal, which if aborted, will terminate the currently active
   * stream iteration operation.
   *
   * Note that when using AbortSignal.timeout(...), the timeout applies across
   * the whole iteration operation, not just one individual chunk read.
   */
  withAbortSignal(e) {
    return this.signal = e, this;
  }
  readAll() {
    return m(this, arguments, void 0, function() {
      var e = this;
      let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      return (function* () {
        var n, r, s, a;
        let o = "";
        const c = t.signal ? e.withAbortSignal(t.signal) : e;
        try {
          for (var d = !0, l = Ne(c), u; u = yield l.next(), n = u.done, !n; d = !0)
            a = u.value, d = !1, o += a;
        } catch (h) {
          r = {
            error: h
          };
        } finally {
          try {
            !d && !n && (s = l.return) && (yield s.call(l));
          } finally {
            if (r) throw r.error;
          }
        }
        return o;
      })();
    });
  }
}
class Op {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Mp;
    this.log = q, this.byteStreamControllers = /* @__PURE__ */ new Map(), this.textStreamControllers = /* @__PURE__ */ new Map(), this.byteStreamHandlers = /* @__PURE__ */ new Map(), this.textStreamHandlers = /* @__PURE__ */ new Map(), this.isConnected = !1, this.bufferedPackets = [], this.maxPayloadByteLength = e;
  }
  setConnected(e) {
    this.isConnected = e, e && this.flushBufferedPackets();
  }
  flushBufferedPackets() {
    const e = this.bufferedPackets;
    this.bufferedPackets = [];
    for (const t of e) {
      const n = t.packet, r = t.encryptionType;
      this.handleDataStreamPacket(n, r);
    }
  }
  registerTextStreamHandler(e, t) {
    if (this.textStreamHandlers.has(e))
      throw new de('A text stream handler for topic "'.concat(e, '" has already been set.'), ne.HandlerAlreadyRegistered);
    this.textStreamHandlers.set(e, t);
  }
  unregisterTextStreamHandler(e) {
    this.textStreamHandlers.delete(e);
  }
  registerByteStreamHandler(e, t) {
    if (this.byteStreamHandlers.has(e))
      throw new de('A byte stream handler for topic "'.concat(e, '" has already been set.'), ne.HandlerAlreadyRegistered);
    this.byteStreamHandlers.set(e, t);
  }
  unregisterByteStreamHandler(e) {
    this.byteStreamHandlers.delete(e);
  }
  clearControllers() {
    this.byteStreamControllers.clear(), this.textStreamControllers.clear(), this.bufferedPackets = [];
  }
  validateParticipantHasNoActiveDataStreams(e) {
    const t = Array.from(this.textStreamControllers.entries()).filter((a) => a[1].sendingParticipantIdentity === e), n = Array.from(this.byteStreamControllers.entries()).filter((a) => a[1].sendingParticipantIdentity === e);
    if (t.length > 0 || n.length > 0) {
      const a = new de("Participant ".concat(e, " unexpectedly disconnected in the middle of sending data"), ne.AbnormalEnd);
      for (const o of n) {
        var r = L(o, 2);
        const c = r[0];
        r[1].controller.error(a), this.byteStreamControllers.delete(c);
      }
      for (const o of t) {
        var s = L(o, 2);
        const c = s[0];
        s[1].controller.error(a), this.textStreamControllers.delete(c);
      }
    }
  }
  handleDataStreamPacket(e, t) {
    if (!this.isConnected) {
      this.bufferedPackets.push({
        packet: e,
        encryptionType: t
      });
      return;
    }
    switch (e.value.case) {
      case "streamHeader":
        return this.handleStreamHeader(e.value.value, e.participantIdentity, t);
      case "streamChunk":
        return this.handleStreamChunk(e.value.value, t);
      case "streamTrailer":
        return this.handleStreamTrailer(e.value.value, t);
      default:
        throw new Error('DataPacket of value "'.concat(e.value.case, '" is not data stream related!'));
    }
  }
  handleStreamHeader(e, t, n) {
    var r;
    switch (e.contentHeader.case) {
      case "byteHeader": {
        const s = this.byteStreamHandlers.get(e.topic);
        if (!s) {
          this.log.debug("ignoring incoming byte stream due to no handler for topic", e.topic);
          return;
        }
        let a;
        const o = {
          id: e.streamId,
          name: (r = e.contentHeader.value.name) !== null && r !== void 0 ? r : "unknown",
          mimeType: e.mimeType,
          size: e.totalLength ? Number(e.totalLength) : void 0,
          topic: e.topic,
          timestamp: Gt(e.timestamp),
          attributes: e.attributes,
          encryptionType: n
        };
        let c;
        switch (e.compression) {
          case be.DEFLATE_RAW:
            if (!Ct()) {
              q.warn("Data stream ".concat(e.streamId, " received with deflate-raw compression, but this browser does not have support for DecompressionStream. Dropping..."));
              return;
            }
            c = !0;
            break;
          case be.NONE:
            c = !1;
            break;
          default:
            q.warn("Data stream ".concat(e.streamId, " received with unknown compression type ").concat(e.compression, ", dropping..."));
            return;
        }
        const d = e.inlineContent;
        if (typeof d < "u") {
          s(new yo(o, To(e.streamId, c ? bo(d, this.maxPayloadByteLength) : d), Gt(e.totalLength)), {
            identity: t
          });
          return;
        }
        const l = new ReadableStream({
          start: (u) => {
            if (a = u, this.byteStreamControllers.has(e.streamId))
              throw new de("A data stream read is already in progress for a stream with id ".concat(e.streamId, "."), ne.AlreadyOpened);
            this.byteStreamControllers.set(e.streamId, {
              info: o,
              controller: a,
              startTime: Date.now(),
              sendingParticipantIdentity: t
            });
          }
        });
        s(new yo(
          o,
          c ? Lp(l, e.streamId, this.maxPayloadByteLength) : l.pipeThrough(Ii(e.streamId)),
          // `totalLength` is the pre-compression size, and the reader counts decompressed bytes,
          // so it applies to both paths (mirrors text).
          Gt(e.totalLength)
        ), {
          identity: t
        });
        return;
      }
      case "textHeader": {
        const s = this.textStreamHandlers.get(e.topic);
        if (!s) {
          this.log.debug("ignoring incoming text stream due to no handler for topic", e.topic);
          return;
        }
        let a;
        const o = {
          id: e.streamId,
          mimeType: e.mimeType,
          size: e.totalLength ? Number(e.totalLength) : void 0,
          topic: e.topic,
          timestamp: Number(e.timestamp),
          attributes: e.attributes,
          encryptionType: n,
          attachedStreamIds: e.contentHeader.value.attachedStreamIds
        };
        let c;
        switch (e.compression) {
          case be.DEFLATE_RAW:
            if (!Ct()) {
              q.warn("Data stream ".concat(e.streamId, " received with deflate-raw compression, but this browser does not have support for DecompressionStream. Dropping..."));
              return;
            }
            c = !0;
            break;
          case be.NONE:
            c = !1;
            break;
          default:
            q.warn("Data stream ".concat(e.streamId, " received with unknown compression type ").concat(e.compression, ", dropping..."));
            return;
        }
        const d = e.inlineContent;
        if (typeof d < "u") {
          const u = c ? bo(d, this.maxPayloadByteLength) : d;
          s(new ko(o, To(e.streamId, u), Gt(e.totalLength)), {
            identity: t
          });
          return;
        }
        const l = new ReadableStream({
          start: (u) => {
            if (a = u, this.textStreamControllers.has(e.streamId))
              throw new de("A data stream read is already in progress for a stream with id ".concat(e.streamId, "."), ne.AlreadyOpened);
            this.textStreamControllers.set(e.streamId, {
              info: o,
              controller: a,
              startTime: Date.now(),
              sendingParticipantIdentity: t
            });
          }
        });
        s(new ko(
          o,
          c ? xp(l, e.streamId, this.maxPayloadByteLength) : l.pipeThrough(Ii(e.streamId)),
          // `totalLength` is the pre-compression size, and the reader sees decompressed bytes, so
          // it applies to both paths.
          Gt(e.totalLength)
        ), {
          identity: t
        });
        return;
      }
    }
  }
  handleStreamChunk(e, t) {
    const n = this.byteStreamControllers.get(e.streamId);
    n && (n.info.encryptionType !== t ? (n.controller.error(new de("Encryption type mismatch for stream ".concat(e.streamId, ". Expected ").concat(t, ", got ").concat(n.info.encryptionType), ne.EncryptionTypeMismatch)), this.byteStreamControllers.delete(e.streamId)) : n.controller.enqueue(e));
    const r = this.textStreamControllers.get(e.streamId);
    r && (r.info.encryptionType !== t ? (r.controller.error(new de("Encryption type mismatch for stream ".concat(e.streamId, ". Expected ").concat(t, ", got ").concat(r.info.encryptionType), ne.EncryptionTypeMismatch)), this.textStreamControllers.delete(e.streamId)) : r.controller.enqueue(e));
  }
  handleStreamTrailer(e, t) {
    const n = this.textStreamControllers.get(e.streamId);
    n && (n.info.encryptionType !== t ? n.controller.error(new de("Encryption type mismatch for stream ".concat(e.streamId, ". Expected ").concat(t, ", got ").concat(n.info.encryptionType), ne.EncryptionTypeMismatch)) : (n.info.attributes = Object.assign(Object.assign({}, n.info.attributes), e.attributes), e.reason ? n.controller.error(new de("Data stream ".concat(e.streamId, " closed abnormally: ").concat(e.reason), ne.AbnormalEnd)) : n.controller.close()), this.textStreamControllers.delete(e.streamId));
    const r = this.byteStreamControllers.get(e.streamId);
    r && (r.info.encryptionType !== t ? r.controller.error(new de("Encryption type mismatch for stream ".concat(e.streamId, ". Expected ").concat(t, ", got ").concat(r.info.encryptionType), ne.EncryptionTypeMismatch)) : (r.info.attributes = Object.assign(Object.assign({}, r.info.attributes), e.attributes), e.reason ? r.controller.error(new de("Data stream ".concat(e.streamId, " closed abnormally: ").concat(e.reason), ne.AbnormalEnd)) : r.controller.close()), this.byteStreamControllers.delete(e.streamId));
  }
}
function To(i, e) {
  return new ReadableStream({
    start: (t) => m(this, void 0, void 0, function* () {
      const n = yield e;
      t.enqueue(new lt({
        streamId: i,
        chunkIndex: BigInt(0),
        content: n
      })), t.close();
    })
  });
}
function Ii(i) {
  let e = -1;
  return new TransformStream({
    transform: (t, n) => {
      const r = Gt(t.chunkIndex);
      if (r <= e) {
        q.warn("ignoring duplicate chunk ".concat(r, " ").concat(t.version > 0 ? "(version ".concat(t.version, ")") : "", " for data stream ").concat(i, " (last processed: ").concat(e, ")"));
        return;
      }
      if (r > e + 1)
        throw new de("Missing chunk(s) ".concat(e + 1, "..").concat(r - 1, " for data stream ").concat(i, " - cannot reassemble payload"), ne.Incomplete);
      e = r, t.content.length !== 0 && n.enqueue(t);
    }
  });
}
function $d() {
  return new TransformStream({
    transform: (i, e) => {
      e.enqueue(i.content);
    }
  });
}
function Ap(i) {
  let e = 0;
  return new TransformStream({
    transform: (t, n) => {
      t.byteLength > 0 && (n.enqueue(new lt({
        streamId: i,
        chunkIndex: Ge(e),
        content: t
      })), e += 1);
    }
  });
}
function Dp(i) {
  const e = new TextDecoder("utf-8"), t = new TextEncoder();
  let n = 0;
  const r = (s) => {
    try {
      return s ? e.decode(s, {
        stream: !0
      }) : e.decode();
    } catch (a) {
      throw new de("Cannot decode compressed data stream ".concat(i, " as text: ").concat(a), ne.DecodeFailed);
    }
  };
  return new TransformStream({
    transform: (s, a) => {
      const o = r(s);
      o.length > 0 && (a.enqueue(new lt({
        streamId: i,
        chunkIndex: Ge(n),
        content: t.encode(o)
      })), n += 1);
    },
    flush: (s) => {
      const a = r();
      a.length > 0 && (s.enqueue(new lt({
        streamId: i,
        chunkIndex: Ge(n),
        content: t.encode(a)
      })), n += 1);
    }
  });
}
function Lp(i, e, t) {
  return i.pipeThrough(Ii(e)).pipeThrough($d()).pipeThrough(Jd()).pipeThrough(Xd(e, t)).pipeThrough(Ap(e));
}
function xp(i, e, t) {
  return i.pipeThrough(Ii(e)).pipeThrough($d()).pipeThrough(Jd()).pipeThrough(Xd(e, t)).pipeThrough(Dp(e));
}
function Xd(i, e) {
  let t = 0;
  return new TransformStream({
    transform: (n, r) => {
      if (t += n.byteLength, t > e)
        throw new de("Data stream ".concat(i, " exceeds the maximum payload size of ").concat(e, " bytes"), ne.PayloadTooLarge);
      r.enqueue(n);
    }
  });
}
class Zd {
  constructor(e, t, n) {
    this.writableStream = e, this.defaultWriter = e.getWriter(), this.onClose = n, this.info = t;
  }
  write(e) {
    return this.defaultWriter.write(e);
  }
  close() {
    return m(this, void 0, void 0, function* () {
      var e;
      yield this.defaultWriter.close(), this.defaultWriter.releaseLock(), (e = this.onClose) === null || e === void 0 || e.call(this);
    });
  }
}
class Np extends Zd {
}
class Up extends Zd {
}
function Ar(i, e, t) {
  var n;
  return new Ui({
    streamId: i.id,
    mimeType: i.mimeType,
    topic: i.topic,
    timestamp: Ge(i.timestamp),
    totalLength: Ge(i.size),
    attributes: i.attributes,
    compression: (n = t == null ? void 0 : t.compression) !== null && n !== void 0 ? n : be.NONE,
    inlineContent: t == null ? void 0 : t.inlineContent,
    contentHeader: {
      case: "textHeader",
      value: new yc({
        version: e == null ? void 0 : e.version,
        attachedStreamIds: i.attachedStreamIds,
        replyToStreamId: e == null ? void 0 : e.replyToStreamId,
        operationType: (e == null ? void 0 : e.type) === "update" ? Vr.UPDATE : Vr.CREATE
      })
    }
  });
}
function ni(i, e) {
  var t;
  return new Ui({
    streamId: i.id,
    mimeType: i.mimeType,
    topic: i.topic,
    timestamp: Ge(i.timestamp),
    totalLength: Ge(i.size),
    attributes: i.attributes,
    compression: (t = e == null ? void 0 : e.compression) !== null && t !== void 0 ? t : be.NONE,
    inlineContent: e == null ? void 0 : e.inlineContent,
    contentHeader: {
      case: "byteHeader",
      value: new kc({
        name: i.name
      })
    }
  });
}
function Mt(i, e) {
  return new Ce({
    destinationIdentities: e,
    value: {
      case: "streamHeader",
      value: i
    }
  });
}
const Fp = new TextEncoder();
class Bp {
  constructor(e, t, n, r, s) {
    this.engine = e, this.log = t, this.getRemoteParticipantClientProtocol = n, this.getRemoteParticipantCapabilities = r, this.getAllRemoteParticipantIdentities = s;
  }
  setupEngine(e) {
    this.engine = e;
  }
  /** {@inheritDoc LocalParticipant.sendText} */
  sendText(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r, s, a, o;
      const c = crypto.randomUUID(), d = Fp.encode(e), l = d.byteLength, u = (n = t == null ? void 0 : t.compress) !== null && n !== void 0 ? n : !0;
      let h = {
        id: c,
        mimeType: "text/plain",
        timestamp: Date.now(),
        topic: (r = t == null ? void 0 : t.topic) !== null && r !== void 0 ? r : "",
        size: l,
        // NOTE: size is always the pre-compression byte length
        attributes: t == null ? void 0 : t.attributes,
        encryptionType: !((s = this.engine.e2eeManager) === null || s === void 0) && s.isDataChannelEncryptionEnabled ? G.GCM : G.NONE
      }, g = u && Ct() && this.allRecipientsSupportV2(t == null ? void 0 : t.destinationIdentities) && this.allRecipientsSupportCompression(t == null ? void 0 : t.destinationIdentities) ? Mi.fromStream(vi(d).pipeThrough(Or())) : null;
      if ((!(t != null && t.attachments) || t.attachments.length === 0) && this.allRecipientsSupportV2(t == null ? void 0 : t.destinationIdentities)) {
        let b = d, y = be.NONE;
        if (g) {
          const A = yield g.collect();
          A.byteLength < d.byteLength && (b = A, y = be.DEFLATE_RAW);
        }
        const C = Ar(h, void 0, {
          compression: y,
          inlineContent: b
        }), M = Mt(C, t == null ? void 0 : t.destinationIdentities);
        if (M.toBinary().byteLength <= Lt)
          return yield this.engine.sendDataPacket(M, V.RELIABLE), (a = t == null ? void 0 : t.onProgress) === null || a === void 0 || a.call(t, 1), h;
      }
      const k = (o = t == null ? void 0 : t.attachments) === null || o === void 0 ? void 0 : o.map(() => crypto.randomUUID()), T = k ? k.length + 1 : 1, S = new Array(T).fill(0), I = (b, y) => {
        var C;
        S[y] = b, (C = t == null ? void 0 : t.onProgress) === null || C === void 0 || C.call(t, S.reduce((M, A) => M + A, 0) / T);
      };
      if (g) {
        h.attachedStreamIds = k;
        const b = Ar(h, void 0, {
          compression: be.DEFLATE_RAW
        }), y = Mt(b, t == null ? void 0 : t.destinationIdentities);
        yield this.sendChunkedByteStream(y, c, t == null ? void 0 : t.destinationIdentities, g.stream().pipeThrough(Dr(d.length, (C) => I(C, 0)))), d.length === 0 && I(1, 0);
      } else {
        const b = yield this.streamText({
          streamId: c,
          totalSize: l,
          destinationIdentities: t == null ? void 0 : t.destinationIdentities,
          topic: t == null ? void 0 : t.topic,
          attachedStreamIds: k,
          attributes: t == null ? void 0 : t.attributes
        });
        yield b.write(e), I(1, 0), yield b.close(), h = b.info;
      }
      return t != null && t.attachments && k && (yield Promise.all(t.attachments.map((b, y) => m(this, void 0, void 0, function* () {
        return this._sendFile(k[y], b, {
          topic: t.topic,
          mimeType: b.type,
          destinationIdentities: t.destinationIdentities,
          compress: t.compress,
          onProgress: (C) => {
            I(C, y + 1);
          }
        });
      })))), h;
    });
  }
  /**
   * Sends a complete in-memory byte payload. Mirrors {@link sendText}'s semantics: when every
   * recipient supports data streams v2 the payload rides inline in a single header packet
   * (optionally deflate-raw compressed), otherwise it is sent as a (optionally compressed)
   * chunked byte stream. Unlike {@link sendFile}, the whole payload is already in memory, so the
   * inline single-packet fast path applies.
   */
  sendBytes(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r, s, a, o, c, d;
      const l = crypto.randomUUID(), u = t == null ? void 0 : t.destinationIdentities, h = (n = t == null ? void 0 : t.compress) !== null && n !== void 0 ? n : !0, f = {
        id: l,
        name: (r = t == null ? void 0 : t.name) !== null && r !== void 0 ? r : "unknown",
        mimeType: (s = t == null ? void 0 : t.mimeType) !== null && s !== void 0 ? s : "application/octet-stream",
        timestamp: Date.now(),
        topic: (a = t == null ? void 0 : t.topic) !== null && a !== void 0 ? a : "",
        size: e.byteLength,
        // NOTE: size is always the pre-compression byte length
        attributes: t == null ? void 0 : t.attributes,
        encryptionType: !((o = this.engine.e2eeManager) === null || o === void 0) && o.isDataChannelEncryptionEnabled ? G.GCM : G.NONE
      }, g = Dr(e.length, t == null ? void 0 : t.onProgress);
      let k = h && Ct() && this.allRecipientsSupportV2(u) && this.allRecipientsSupportCompression(u) ? Mi.fromStream(vi(e).pipeThrough(g).pipeThrough(Or())) : null;
      if (this.allRecipientsSupportV2(u)) {
        let b = e, y = be.NONE;
        if (k) {
          const A = yield k.collect();
          A.byteLength < e.byteLength && (b = A, y = be.DEFLATE_RAW);
        }
        const C = ni(f, {
          compression: y,
          inlineContent: b
        }), M = Mt(C, u);
        if (M.toBinary().byteLength <= Lt)
          return yield this.engine.sendDataPacket(M, V.RELIABLE), (c = t == null ? void 0 : t.onProgress) === null || c === void 0 || c.call(t, 1), f;
      }
      const T = ni(f, {
        compression: k ? be.DEFLATE_RAW : be.NONE
      }), S = Mt(T, u), I = k ? k.stream() : vi(e).pipeThrough(g);
      return yield this.sendChunkedByteStream(S, l, u, I), e.length === 0 && ((d = t == null ? void 0 : t.onProgress) === null || d === void 0 || d.call(t, 1)), f;
    });
  }
  /**
   * Returns true only if every recipient is known to support data streams v2 (single-packet inline
   * streams and compression). For a targeted send this checks the named destination identities; for
   * a broadcast (no explicit destinations) it checks every remote participant currently in the room.
   * An empty room (nobody to receive) is considered eligible.
   */
  allRecipientsSupportV2(e) {
    return (e && e.length > 0 ? e : this.getAllRemoteParticipantIdentities()).every((n) => this.getRemoteParticipantClientProtocol(n) >= yd);
  }
  /**
   * Returns true only if every recipient advertises the deflate-raw compression capability (so it
   * can decompress a compressed stream). Resolved the same way as {@link allRecipientsSupportV2}:
   * named destinations, or every remote participant for a broadcast; an empty room is eligible.
   */
  allRecipientsSupportCompression(e) {
    return (e && e.length > 0 ? e : this.getAllRemoteParticipantIdentities()).every((n) => this.getRemoteParticipantCapabilities(n).includes(Ln.CAP_COMPRESSION_DEFLATE_RAW));
  }
  /**
   * Shared chunked-stream send for `sendText`/`sendFile`: sends the prebuilt header packet, then
   * forwards `source` (optionally deflate-raw compressed) as `streamChunk` packets re-chunked to
   * the MTU budget with contiguous indices, then sends the trailer. The source is consumed
   * incrementally, so a `file.stream()` is never buffered in full. The platform compressor can't
   * flush mid-stream, so compression is only used when the whole payload is available as a stream
   * up front (not for incremental writers like `streamText`/`streamBytes`).
   */
  sendChunkedByteStream(e, t, n, r) {
    return m(this, void 0, void 0, function* () {
      var s, a, o, c;
      const d = this.engine;
      yield Lr(d, e);
      let l = 0;
      try {
        for (var u = !0, h = Ne(qf(r, Lt)), f; f = yield h.next(), s = f.done, !s; u = !0) {
          c = f.value, u = !1;
          const g = c, p = new Ce({
            destinationIdentities: n,
            value: {
              case: "streamChunk",
              value: new lt({
                content: g,
                streamId: t,
                chunkIndex: Ge(l)
              })
            }
          });
          yield d.sendDataPacket(p, V.RELIABLE), l += 1;
        }
      } catch (g) {
        a = {
          error: g
        };
      } finally {
        try {
          !u && !s && (o = h.return) && (yield o.call(h));
        } finally {
          if (a) throw a.error;
        }
      }
      yield xr(t, n, d);
    });
  }
  /**
   * @internal
   */
  streamText(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r;
      const s = (t = e == null ? void 0 : e.streamId) !== null && t !== void 0 ? t : crypto.randomUUID(), a = e == null ? void 0 : e.destinationIdentities, o = {
        id: s,
        mimeType: "text/plain",
        timestamp: Date.now(),
        topic: (n = e == null ? void 0 : e.topic) !== null && n !== void 0 ? n : "",
        size: e == null ? void 0 : e.totalSize,
        attributes: e == null ? void 0 : e.attributes,
        encryptionType: !((r = this.engine.e2eeManager) === null || r === void 0) && r.isDataChannelEncryptionEnabled ? G.GCM : G.NONE,
        attachedStreamIds: e == null ? void 0 : e.attachedStreamIds
      }, c = Ar(o, e), d = Mt(c, a);
      yield Lr(this.engine, d);
      let l = 0;
      const u = this.engine, h = new WritableStream({
        write(p) {
          return m(this, void 0, void 0, function* () {
            for (const k of Bf(p, Lt)) {
              const T = new lt({
                content: k,
                streamId: s,
                chunkIndex: Ge(l)
              }), S = new Ce({
                destinationIdentities: a,
                value: {
                  case: "streamChunk",
                  value: T
                }
              });
              yield u.sendDataPacket(S, V.RELIABLE), l += 1;
            }
          });
        },
        close() {
          return m(this, void 0, void 0, function* () {
            yield xr(s, a, u);
          });
        },
        abort(p) {
          console.log("Sink error:", p);
        }
      });
      let f = () => m(this, void 0, void 0, function* () {
        yield g.close();
      });
      u.once(P.Closing, f);
      const g = new Np(h, o, () => this.engine.off(P.Closing, f));
      return g;
    });
  }
  sendFile(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = crypto.randomUUID();
      return yield this._sendFile(n, e, t), {
        id: n
      };
    });
  }
  /**
   * Streams a file as a chunked byte stream, compressed (deflate-raw) when the runtime supports it
   * and every recipient is on data streams v2. The file is piped `file.stream()` →
   * (`CompressionStream`) → chunk packets via {@link sendChunkedByteStream}, so it is never fully
   * buffered in memory — unlike {@link sendBytes}, there is no inline single-packet fast path for
   * files (the compressed size can't be known up front without buffering the whole file).
   */
  _sendFile(e, t, n) {
    return m(this, void 0, void 0, function* () {
      var r, s, a, o, c;
      const d = n == null ? void 0 : n.destinationIdentities, l = ((r = n == null ? void 0 : n.compress) !== null && r !== void 0 ? r : !0) && Ct() && this.allRecipientsSupportV2(d) && this.allRecipientsSupportCompression(d), u = {
        id: e,
        name: t.name,
        mimeType: (s = n == null ? void 0 : n.mimeType) !== null && s !== void 0 ? s : t.type,
        topic: (a = n == null ? void 0 : n.topic) !== null && a !== void 0 ? a : "",
        timestamp: Date.now(),
        size: t.size,
        encryptionType: !((o = this.engine.e2eeManager) === null || o === void 0) && o.isDataChannelEncryptionEnabled ? G.GCM : G.NONE
      }, h = ni(u, {
        compression: l ? be.DEFLATE_RAW : be.NONE
      }), f = Mt(h, d), g = t.stream().pipeThrough(Dr(t.size, n == null ? void 0 : n.onProgress)), p = l ? g.pipeThrough(Or()) : g;
      return yield this.sendChunkedByteStream(f, e, d, p), t.size === 0 && ((c = n == null ? void 0 : n.onProgress) === null || c === void 0 || c.call(n, 1)), u;
    });
  }
  streamBytes(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r, s, a;
      const o = (t = e == null ? void 0 : e.streamId) !== null && t !== void 0 ? t : crypto.randomUUID(), c = e == null ? void 0 : e.destinationIdentities, d = {
        id: o,
        mimeType: (n = e == null ? void 0 : e.mimeType) !== null && n !== void 0 ? n : "application/octet-stream",
        topic: (r = e == null ? void 0 : e.topic) !== null && r !== void 0 ? r : "",
        timestamp: Date.now(),
        attributes: e == null ? void 0 : e.attributes,
        size: e == null ? void 0 : e.totalSize,
        name: (s = e == null ? void 0 : e.name) !== null && s !== void 0 ? s : "unknown",
        encryptionType: !((a = this.engine.e2eeManager) === null || a === void 0) && a.isDataChannelEncryptionEnabled ? G.GCM : G.NONE
      }, l = ni(d), u = Mt(l, c);
      yield Lr(this.engine, u);
      let h = 0;
      const f = new ue(), g = this.engine, p = this.log, k = new WritableStream({
        write(S) {
          return m(this, void 0, void 0, function* () {
            const I = yield f.lock();
            let b = 0;
            try {
              for (; b < S.byteLength; ) {
                const y = S.slice(b, b + Lt), C = new Ce({
                  destinationIdentities: c,
                  value: {
                    case: "streamChunk",
                    value: new lt({
                      content: y,
                      streamId: o,
                      chunkIndex: Ge(h)
                    })
                  }
                });
                yield g.sendDataPacket(C, V.RELIABLE), h += 1, b += y.byteLength;
              }
            } finally {
              I();
            }
          });
        },
        close() {
          return m(this, void 0, void 0, function* () {
            yield xr(o, c, g);
          });
        },
        abort(S) {
          p.error("Sink error:", S);
        }
      });
      return new Up(k, d);
    });
  }
}
class Mi {
  constructor(e) {
    this.state = e;
  }
  static fromStream(e) {
    return new Mi({
      type: "stream",
      stream: e
    });
  }
  /** Collect data from the stream into memory and return as a Uint8Array. */
  collect() {
    return m(this, void 0, void 0, function* () {
      switch (this.state.type) {
        case "stream":
          const e = yield Qd(this.state.stream);
          return this.state = {
            type: "collected",
            bytes: e
          }, e;
        case "collected":
          return this.state.bytes;
      }
    });
  }
  /** Pass wrapped stream through to downstream consumer. */
  stream() {
    switch (this.state.type) {
      case "stream":
        return this.state.stream;
      case "collected":
        return vi(this.state.bytes);
    }
  }
}
function Dr(i, e) {
  let t = 0;
  return new TransformStream({
    transform(n, r) {
      t += n.byteLength, e && typeof i == "number" && i > 0 && e(Math.min(t / i, 1)), r.enqueue(n);
    }
  });
}
function Lr(i, e) {
  return m(this, void 0, void 0, function* () {
    if (e.toBinary().byteLength > Lt)
      throw new de("data stream header exceeds the ".concat(Lt, "-byte limit; reduce attribute size"), ne.HeaderTooLarge);
    yield i.sendDataPacket(e, V.RELIABLE);
  });
}
function xr(i, e, t) {
  return m(this, void 0, void 0, function* () {
    const n = new Ce({
      destinationIdentities: e,
      value: {
        case: "streamTrailer",
        value: new Ms({
          streamId: i
        })
      }
    });
    yield t.sendDataPacket(n, V.RELIABLE);
  });
}
function el(i) {
  if (i.length === 0)
    return new AbortController().signal;
  if (i.length === 1)
    return i[0];
  for (const r of i)
    if (r.aborted)
      return r;
  const e = new AbortController(), t = Array(i.length), n = () => {
    for (const r of t)
      r();
  };
  return i.forEach((r, s) => {
    const a = () => {
      e.abort(r.reason), n();
    };
    r.addEventListener("abort", a), t[s] = () => r.removeEventListener("abort", a);
  }), e.signal;
}
function tl(i) {
  const e = new AbortController();
  return setTimeout(() => {
    e.abort(new DOMException("signal timed out after ".concat(i, " ms"), "TimeoutError"));
  }, i), e.signal;
}
const re = 1, it = 2, So = 4, qp = 8, Co = 0, Eo = 12, wo = 5, jp = 7, _o = 3, Vp = 3, Po = 2, Ro = 1, Io = 0, Mo = 3, ii = 2, Oo = 2, Wp = 1, Hp = 0;
var at;
(function(i) {
  i[i.TooShort = 0] = "TooShort", i[i.HeaderOverrun = 1] = "HeaderOverrun", i[i.MissingExtWords = 2] = "MissingExtWords", i[i.UnsupportedVersion = 3] = "UnsupportedVersion", i[i.InvalidHandle = 4] = "InvalidHandle", i[i.MalformedExt = 5] = "MalformedExt";
})(at || (at = {}));
class Te extends Ue {
  constructor(e, t, n) {
    super(19, e, n), this.name = "DataTrackDeserializeError", this.reason = t, this.reasonName = at[t];
  }
  static tooShort() {
    return new Te("Too short to contain a valid header", at.TooShort);
  }
  static headerOverrun() {
    return new Te("Header exceeds total packet length", at.HeaderOverrun);
  }
  static missingExtWords() {
    return new Te("Extension word indicator is missing", at.MissingExtWords);
  }
  static unsupportedVersion(e) {
    return new Te("Unsupported version ".concat(e), at.UnsupportedVersion);
  }
  static invalidHandle(e) {
    return new Te("invalid track handle: ".concat(e.message), at.InvalidHandle, {
      cause: e
    });
  }
  static malformedExt(e) {
    return new Te("Extension with tag ".concat(e, " is malformed"), at.MalformedExt);
  }
}
var In;
(function(i) {
  i[i.TooSmallForHeader = 0] = "TooSmallForHeader", i[i.TooSmallForPayload = 1] = "TooSmallForPayload";
})(In || (In = {}));
class Hn extends Ue {
  constructor(e, t, n) {
    super(19, e, n), this.name = "DataTrackSerializeError", this.reason = t, this.reasonName = In[t];
  }
  static tooSmallForHeader() {
    return new Hn("Buffer cannot fit header", In.TooSmallForHeader);
  }
  static tooSmallForPayload() {
    return new Hn("Buffer cannot fit payload", In.TooSmallForPayload);
  }
}
class Qi {
  /** Encodes the instance as binary and returns the data as a Uint8Array. */
  toBinary() {
    const e = this.toBinaryLengthBytes(), t = new ArrayBuffer(e), n = new DataView(t), r = this.toBinaryInto(n);
    if (e !== r)
      throw new Error("".concat(this.constructor.name, ".toBinary: written bytes (").concat(r, " bytes) not equal to allocated array buffer length (").concat(e, " bytes)."));
    return new Uint8Array(t);
  }
}
var fn;
(function(i) {
  i[i.UserTimestamp = 2] = "UserTimestamp", i[i.E2ee = 1] = "E2ee";
})(fn || (fn = {}));
class nl extends Qi {
}
class We extends nl {
  constructor(e) {
    super(), this.timestamp = e;
  }
  toBinaryLengthBytes() {
    return re + re + We.lengthBytes;
  }
  toBinaryInto(e) {
    let t = 0;
    e.setUint8(t, We.tag), t += re, e.setUint8(t, We.lengthBytes), t += re, e.setBigUint64(t, this.timestamp), t += qp;
    const n = this.toBinaryLengthBytes();
    if (t !== n)
      throw new Error("DataTrackUserTimestampExtension.toBinaryInto: Wrote ".concat(t, " bytes but expected length was ").concat(n, " bytes"));
    return t;
  }
  toJSON() {
    return {
      tag: We.tag,
      lengthBytes: We.lengthBytes,
      timestamp: this.timestamp
    };
  }
}
We.tag = fn.UserTimestamp;
We.lengthBytes = 8;
class He extends nl {
  constructor(e, t) {
    super(), this.keyIndex = e, this.iv = t;
  }
  toBinaryLengthBytes() {
    return re + re + He.lengthBytes;
  }
  toBinaryInto(e) {
    let t = 0;
    e.setUint8(t, He.tag), t += re, e.setUint8(t, He.lengthBytes), t += re, e.setUint8(t, this.keyIndex), t += re;
    for (let r = 0; r < this.iv.length; r += 1)
      e.setUint8(t, this.iv[r]), t += re;
    const n = this.toBinaryLengthBytes();
    if (t !== n)
      throw new Error("DataTrackE2eeExtension.toBinaryInto: Wrote ".concat(t, " bytes but expected length was ").concat(n, " bytes"));
    return t;
  }
  toJSON() {
    return {
      tag: He.tag,
      lengthBytes: He.lengthBytes,
      keyIndex: this.keyIndex,
      iv: this.iv
    };
  }
}
He.tag = fn.E2ee;
He.lengthBytes = 13;
class on extends Qi {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    super(), this.userTimestamp = e.userTimestamp, this.e2ee = e.e2ee;
  }
  toBinaryLengthBytes() {
    let e = 0;
    return this.userTimestamp && (e += this.userTimestamp.toBinaryLengthBytes()), this.e2ee && (e += this.e2ee.toBinaryLengthBytes()), e;
  }
  toBinaryInto(e) {
    let t = 0;
    if (this.e2ee) {
      const r = this.e2ee.toBinaryInto(e);
      t += r;
    }
    if (this.userTimestamp) {
      const r = this.userTimestamp.toBinaryInto(new DataView(e.buffer, e.byteOffset + t));
      t += r;
    }
    const n = this.toBinaryLengthBytes();
    if (t !== n)
      throw new Error("DataTrackExtensions.toBinaryInto: Wrote ".concat(t, " bytes but expected length was ").concat(n, " bytes"));
    return t;
  }
  static fromBinary(e) {
    const t = Ys(e);
    let n, r, s = 0;
    for (; t.byteLength - s >= re + re; ) {
      const a = t.getUint8(s);
      s += re;
      const o = t.getUint8(s);
      if (s += re, a !== Hp)
        switch (a) {
          case fn.UserTimestamp:
            if (t.byteLength - s < We.lengthBytes)
              throw Te.malformedExt(a);
            n = new We(t.getBigUint64(s)), s += o;
            break;
          case fn.E2ee:
            if (t.byteLength - s < He.lengthBytes)
              throw Te.malformedExt(a);
            const c = t.getUint8(s), d = new Uint8Array(12);
            for (let l = 0; l < d.length; l += 1) {
              let u = s;
              u += re, u += l * re, d[l] = t.getUint8(u);
            }
            r = new He(c, d), s += o;
            break;
          default:
            if (t.byteLength - s < o)
              throw Te.malformedExt(a);
            s += o;
            break;
        }
    }
    return [new on({
      userTimestamp: n,
      e2ee: r
    }), t.byteLength];
  }
  toJSON() {
    var e, t, n, r;
    return {
      userTimestamp: (t = (e = this.userTimestamp) === null || e === void 0 ? void 0 : e.toJSON()) !== null && t !== void 0 ? t : null,
      e2ee: (r = (n = this.e2ee) === null || n === void 0 ? void 0 : n.toJSON()) !== null && r !== void 0 ? r : null
    };
  }
}
const il = {
  from(i) {
    return {
      payload: i.payload,
      extensions: new on({
        userTimestamp: i.userTimestamp ? new We(i.userTimestamp) : void 0
      })
    };
  },
  /** Converts from a DataTrackFrameInternal -> DataTrackFrame. Some internal information is
   * discarded like e2ee encrption extension data. */
  lossyIntoFrame(i) {
    var e;
    return {
      payload: i.payload,
      userTimestamp: (e = i.extensions.userTimestamp) === null || e === void 0 ? void 0 : e.timestamp
    };
  }
}, rl = Symbol.for("lk.track"), sl = Symbol.for("lk.data-track");
class al {
  /** @internal */
  constructor(e, t, n) {
    this.trackSymbol = rl, this.isLocal = !1, this.typeSymbol = sl, this.info = e, this.manager = t, this.publisherIdentity = n.publisherIdentity;
  }
  /** Subscribes to the data track to receive frames.
   *
   * # Returns
   *
   * A stream that yields {@link DataTrackFrame}s as they arrive.
   *
   * # Multiple Subscriptions
   *
   * An application may call `subscribe` more than once to process frames in
   * multiple places. For example, one async task might plot values on a graph
   * while another writes them to a file.
   *
   * Internally, only the first call to `subscribe` communicates with the SFU and
   * allocates the resources required to receive frames. Additional subscriptions
   * reuse the same underlying pipeline and do not trigger additional signaling.
   *
   * Note that newly created subscriptions only receive frames published after
   * the initial subscription is established.
   */
  subscribe(e) {
    try {
      const t = this.manager.openSubscriptionStream(this.info.sid, e == null ? void 0 : e.signal, e == null ? void 0 : e.bufferSize), n = L(t, 2), r = n[0];
      return n[1].catch(() => {
      }), r;
    } catch (t) {
      throw t;
    }
  }
  /** Configure how incoming frames for this track are processed before they are handed out to
   * subscribers (the "pipeline"). These options apply to all current and future subscriptions
   * of this track, and may be set at any time. */
  setPipelineOptions(e) {
    this.manager.setPipelineOptions(this.info.sid, e);
  }
}
class Kn extends Qi {
  constructor(e) {
    var t;
    super(), this.marker = e.marker, this.trackHandle = e.trackHandle, this.sequence = e.sequence, this.frameNumber = e.frameNumber, this.timestamp = e.timestamp, this.extensions = (t = e.extensions) !== null && t !== void 0 ? t : new on();
  }
  extensionsMetrics() {
    const e = this.extensions.toBinaryLengthBytes(), t = Math.ceil((ii + e) / 4), n = t * 4 - ii - e;
    return {
      lengthBytes: e,
      lengthWords: t,
      paddingLengthBytes: n
    };
  }
  toBinaryLengthBytes() {
    const e = this.extensionsMetrics(), t = e.lengthBytes, n = e.paddingLengthBytes;
    let r = Eo;
    return t > 0 && (r += ii + t + n), r;
  }
  toBinaryInto(e) {
    if (e.byteLength < this.toBinaryLengthBytes())
      throw Hn.tooSmallForHeader();
    let t = Co << wo, n;
    switch (this.marker) {
      case Z.Inter:
        n = Io;
        break;
      case Z.Final:
        n = Ro;
        break;
      case Z.Start:
        n = Po;
        break;
      case Z.Single:
        n = Mo;
        break;
    }
    t |= n << _o;
    const r = this.extensionsMetrics(), s = r.lengthBytes, a = r.lengthWords, o = r.paddingLengthBytes;
    s > 0 && (t |= 1 << Oo);
    let c = 0;
    if (e.setUint8(c, t), c += re, e.setUint8(c, 0), c += re, e.setUint16(c, this.trackHandle), c += it, e.setUint16(c, this.sequence.value), c += it, e.setUint16(c, this.frameNumber.value), c += it, e.setUint32(c, this.timestamp.asTicks()), c += So, s > 0) {
      const l = a - 1;
      e.setUint16(c, l), c += it;
      const u = this.extensions.toBinaryInto(new DataView(e.buffer, e.byteOffset + c));
      c += u;
      for (let h = 0; h < o; h += 1)
        e.setUint8(c, 0), c += re;
    }
    const d = this.toBinaryLengthBytes();
    if (c !== d)
      throw new Error("DataTrackPacketHeader.toBinaryInto: Wrote ".concat(c, " bytes but expected length was ").concat(d, " bytes"));
    return d;
  }
  static fromBinary(e) {
    const t = Ys(e);
    if (t.byteLength < Eo)
      throw Te.tooShort();
    let n = 0;
    const r = t.getUint8(n);
    n += re;
    const s = r >> wo & jp;
    if (s > Co)
      throw Te.unsupportedVersion(s);
    let a;
    switch (r >> _o & Vp) {
      case Po:
        a = Z.Start;
        break;
      case Ro:
        a = Z.Final;
        break;
      case Mo:
        a = Z.Single;
        break;
      case Io:
      default:
        a = Z.Inter;
        break;
    }
    const o = (r >> Oo & Wp) > 0;
    n += re;
    let c;
    try {
      c = hm.fromNumber(t.getUint16(n));
    } catch (f) {
      throw f instanceof hn && (f.isReason(Bt.Reserved) || f.isReason(Bt.TooLarge)) ? Te.invalidHandle(f) : f;
    }
    n += it;
    const d = Ke.u16(t.getUint16(n));
    n += it;
    const l = Ke.u16(t.getUint16(n));
    n += it;
    const u = sn.fromRtpTicks(t.getUint32(n));
    n += So;
    let h = new on();
    if (o) {
      if (t.byteLength - n < it)
        throw Te.missingExtWords();
      let f = t.getUint16(n);
      n += it;
      let p = 4 * (f + 1) - ii;
      if (n + p > t.byteLength)
        throw Te.headerOverrun();
      let k = new DataView(t.buffer, t.byteOffset + n, p);
      const T = on.fromBinary(k), S = L(T, 2), I = S[0], b = S[1];
      h = I, n += b;
    }
    return [new Kn({
      marker: a,
      trackHandle: c,
      sequence: d,
      frameNumber: l,
      timestamp: u,
      extensions: h
    }), n];
  }
  toJSON() {
    return {
      marker: this.marker,
      trackHandle: this.trackHandle,
      sequence: this.sequence.value,
      frameNumber: this.frameNumber.value,
      timestamp: this.timestamp.asTicks(),
      extensions: this.extensions.toJSON()
    };
  }
}
var Z;
(function(i) {
  i[i.Start = 0] = "Start", i[i.Inter = 1] = "Inter", i[i.Final = 2] = "Final", i[i.Single = 3] = "Single";
})(Z || (Z = {}));
class Yi extends Qi {
  constructor(e, t) {
    super(), this.header = e, this.payload = t;
  }
  toBinaryLengthBytes() {
    return this.header.toBinaryLengthBytes() + this.payload.byteLength;
  }
  toBinaryInto(e) {
    let t = 0;
    const n = this.header.toBinaryInto(e);
    if (t += n, e.byteLength - t < this.payload.byteLength)
      throw Hn.tooSmallForPayload();
    for (let s = 0; s < this.payload.length; s += 1)
      e.setUint8(t, this.payload[s]), t += re;
    const r = this.toBinaryLengthBytes();
    if (t !== r)
      throw new Error("DataTrackPacket.toBinaryInto: Wrote ".concat(t, " bytes but expected length was ").concat(r, " bytes"));
    return r;
  }
  static fromBinary(e) {
    const t = Ys(e), n = Kn.fromBinary(t), r = L(n, 2), s = r[0], a = r[1], o = t.buffer.slice(t.byteOffset + a, t.byteOffset + t.byteLength);
    return [new Yi(s, new Uint8Array(o)), t.byteLength];
  }
  toJSON() {
    return {
      header: this.header.toJSON(),
      payload: this.payload
    };
  }
}
const Nr = he(te.DataTracks);
class tt extends Ue {
  constructor(e, t, n, r) {
    super(19, "Frame ".concat(n, " dropped: ").concat(e), r), this.name = "DataTrackDepacketizerDropError", this.reason = t, this.reasonName = xt[t], this.frameNumber = n;
  }
  static interrupted(e, t) {
    return new tt("Interrupted by the start of a new frame ".concat(t), xt.Interrupted, e);
  }
  static unknownFrame(e) {
    return new tt("Initial packet was never received.", xt.UnknownFrame, e);
  }
  static bufferFull(e) {
    return new tt("Reorder buffer is full.", xt.BufferFull, e);
  }
  static incomplete(e, t, n) {
    return new tt("Not all packets received before final packet. Received ".concat(t, " packets, expected ").concat(n, " packets."), xt.Incomplete, e);
  }
}
var xt;
(function(i) {
  i[i.Interrupted = 0] = "Interrupted", i[i.UnknownFrame = 1] = "UnknownFrame", i[i.BufferFull = 2] = "BufferFull", i[i.Incomplete = 3] = "Incomplete";
})(xt || (xt = {}));
class $i {
  constructor() {
    this.partials = /* @__PURE__ */ new Map();
  }
  /** Should be repeatedly called with received {@link DataTrackPacket}s - intermediate calls
   * aggregate the packet's state internally, and return null.
   *
   * Once this method is called with the final packet to form a frame, a new {@link DataTrackFrameInternal}
   * is returned.*/
  push(e, t) {
    switch (e.header.marker) {
      case Z.Single:
        return this.frameFromSingle(e, t);
      case Z.Start:
        return this.beginPartial(e, t);
      case Z.Inter:
      case Z.Final:
        return this.pushToPartial(e);
    }
  }
  reset() {
    this.partials.clear();
  }
  peekOldestPartialFrameNumber() {
    const e = this.partials.keys().next();
    return e.done ? null : e.value;
  }
  frameFromSingle(e, t) {
    var n;
    if (e.header.marker !== Z.Single)
      throw new Error("Depacketizer.frameFromSingle: packet.header.marker was not FrameMarker.Single, found ".concat(e.header.marker, "."));
    const r = (n = t == null ? void 0 : t.maxPartialFrames) !== null && n !== void 0 ? n : 1;
    if (this.partials.size >= r) {
      const s = this.peekOldestPartialFrameNumber();
      if (typeof s != "number")
        throw new Error("Depacketizer.frameFromSingle: no oldest frame number found, but partials.size is ".concat(this.partials.size, "."));
      if (this.partials.delete(s), t != null && t.throwOnInterruption)
        throw tt.interrupted(s, e.header.frameNumber.value);
      Nr.warn("Data track frame ".concat(s, " was interrupted by single-packet frame ").concat(e.header.frameNumber.value, ", dropping."));
    }
    return {
      payload: e.payload,
      extensions: e.header.extensions
    };
  }
  /** Begin assembling a new packet. */
  beginPartial(e, t) {
    var n;
    if (e.header.marker !== Z.Start)
      throw new Error("Depacketizer.beginPartial: packet.header.marker was not FrameMarker.Start, found ".concat(e.header.marker, "."));
    const r = e.header.sequence, s = e.header.frameNumber.value, a = {
      startSequence: r,
      extensions: e.header.extensions,
      payloads: /* @__PURE__ */ new Map([[r.value, e.payload]])
    }, o = (n = t == null ? void 0 : t.maxPartialFrames) !== null && n !== void 0 ? n : 1;
    for (; this.partials.size >= o; ) {
      const c = this.peekOldestPartialFrameNumber();
      if (typeof c != "number")
        break;
      if (this.partials.delete(c), t != null && t.throwOnInterruption)
        throw tt.interrupted(c, s);
      Nr.warn("Data track partials full (max ".concat(o, "), evicted oldest frame ").concat(c, " to make room for new frame ").concat(s, "."));
    }
    return this.partials.set(s, a), null;
  }
  /** Push to the existing partial frame. */
  pushToPartial(e) {
    if (e.header.marker !== Z.Inter && e.header.marker !== Z.Final)
      throw new Error("Depacketizer.pushToPartial: packet.header.marker was not FrameMarker.Inter or FrameMarker.Final, found ".concat(e.header.marker, "."));
    const t = e.header.frameNumber.value, n = this.partials.get(t);
    if (!n)
      throw this.partials.delete(t), tt.unknownFrame(t);
    if (n.payloads.size >= $i.MAX_BUFFER_PACKETS)
      throw this.partials.delete(t), tt.bufferFull(t);
    return n.payloads.has(e.header.sequence.value) && Nr.warn("Data track frame ".concat(t, " received duplicate packet for sequence ").concat(e.header.sequence.value, ", so replacing with newly received packet.")), n.payloads.set(e.header.sequence.value, e.payload), e.header.marker === Z.Final ? this.finalize(t, n, e.header.sequence.value) : null;
  }
  /** Try to reassemble the complete frame. */
  finalize(e, t, n) {
    const r = t.payloads.size;
    let s = 0;
    for (const d of t.payloads.values())
      s += d.length;
    const a = new Uint8Array(s);
    let o = t.startSequence.clone(), c = 0;
    for (; ; ) {
      const d = t.payloads.get(o.value);
      if (!d)
        break;
      t.payloads.delete(o.value);
      const l = a.length - c;
      if (d.length > l)
        throw new Error("Depacketizer.finalize: Expected at least ".concat(d.length, " more bytes left in the payload buffer, only got ").concat(l, " bytes."));
      if (a.set(d, c), c += d.length, o.value != n) {
        o.increment();
        continue;
      }
      return this.partials.delete(e), {
        payload: a,
        extensions: t.extensions
      };
    }
    throw this.partials.delete(e), tt.incomplete(e, r, n - t.startSequence.value + 1);
  }
}
$i.MAX_BUFFER_PACKETS = 128;
var Nt;
(function(i) {
  i[i.Unpublished = 0] = "Unpublished", i[i.Timeout = 1] = "Timeout", i[i.Disconnected = 2] = "Disconnected", i[i.Cancelled = 4] = "Cancelled";
})(Nt || (Nt = {}));
class _e extends Ue {
  constructor(e, t, n) {
    super(22, e, n), this.name = "DataTrackSubscribeError", this.reason = t, this.reasonName = Nt[t];
  }
  static unpublished() {
    return new _e("The track has been unpublished and is no longer available", Nt.Unpublished);
  }
  static timeout() {
    return new _e("Request to subscribe to data track timed-out", Nt.Timeout);
  }
  static disconnected() {
    return new _e("Cannot subscribe to data track when disconnected", Nt.Disconnected);
  }
  // NOTE: this was introduced by web / there isn't a corresponding case in the rust version.
  static cancelled() {
    return new _e("Subscription to data track cancelled by caller", Nt.Cancelled);
  }
}
const Ur = he(te.DataTracks);
class Kp {
  /**
   * Creates a new pipeline with the given options.
   */
  constructor(e) {
    var t, n;
    const r = e.e2eeManager !== null;
    if (e.info.usesE2ee !== r)
      throw new Error("IncomingDataTrackPipeline: DataTrackInfo.usesE2ee must match presence of decryptionProvider");
    const s = new $i();
    this.publisherIdentity = e.publisherIdentity, this.e2eeManager = (t = e.e2eeManager) !== null && t !== void 0 ? t : null, this.depacketizer = s, this.options = (n = e.pipelineOptions) !== null && n !== void 0 ? n : {};
  }
  updateE2eeManager(e) {
    this.e2eeManager = e;
  }
  setOptions(e) {
    this.options = e;
  }
  processPacket(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.depacketize(e);
      if (!t)
        return null;
      const n = yield this.decryptIfNeeded(t);
      return n || null;
    });
  }
  /**
   * Depacketize the given frame, log if a drop occurs.
   */
  depacketize(e) {
    let t;
    try {
      t = this.depacketizer.push(e, {
        throwOnInterruption: !1,
        maxPartialFrames: this.options.maxPartialFrames
      });
    } catch (n) {
      return Ur.warn("Data frame depacketize error: ".concat(n)), null;
    }
    return t;
  }
  /**
   * Decrypt the frame's payload if E2EE is enabled for this track.
   */
  decryptIfNeeded(e) {
    return m(this, void 0, void 0, function* () {
      var t, n;
      const r = this.e2eeManager;
      if (!r)
        return e;
      const s = (n = (t = e.extensions) === null || t === void 0 ? void 0 : t.e2ee) !== null && n !== void 0 ? n : null;
      if (!s)
        return Ur.error("Missing E2EE meta"), null;
      let a;
      try {
        a = yield r.handleEncryptedData(e.payload, s.iv, this.publisherIdentity, s.keyIndex);
      } catch (o) {
        return Ur.error("Error decrypting packet: ".concat(o)), null;
      }
      return e.payload = a.payload, e;
    });
  }
}
const oe = he(te.DataTracks), Gp = 1e4, zp = 16;
class Jp extends Ie.EventEmitter {
  constructor(e) {
    var t;
    super(), this.descriptors = /* @__PURE__ */ new Map(), this.subscriptionHandles = /* @__PURE__ */ new Map(), this.e2eeManager = (t = e == null ? void 0 : e.e2eeManager) !== null && t !== void 0 ? t : null;
  }
  /** @internal */
  updateE2eeManager(e) {
    this.e2eeManager = e;
    for (const t of this.descriptors.values())
      t.subscription.type === "active" && t.subscription.pipeline.updateE2eeManager(e);
  }
  /** @internal */
  setPipelineOptions(e, t) {
    const n = this.descriptors.get(e);
    if (!n) {
      oe.warn("Unknown track ".concat(e, ", cannot set pipeline options."));
      return;
    }
    n.pipelineOptions = t, n.subscription.type === "active" && n.subscription.pipeline.setOptions(t);
  }
  /** Allocates a ReadableStream which emits when a new {@link DataTrackFrame} is received from the
   * SFU. The SFU subscription is initiated lazily when the stream is created.
   *
   * @returns A tuple of the ReadableStream and a Promise that resolves once the SFU subscription
   * is fully established / the stream is ready to receive frames.
   *
   * @internal
   **/
  openSubscriptionStream(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : zp, r = null;
    const s = new ve(), a = this.descriptors.get(e), o = () => {
      t == null || t.removeEventListener("abort", d);
    }, c = () => {
      if (o(), !r) {
        oe.warn("ReadableStream subscribed to ".concat(e, " was not started."));
        return;
      }
      if (!a || this.descriptors.get(a.info.sid) !== a) {
        oe.warn("Unknown track ".concat(e, ", skipping cancel..."));
        return;
      }
      if (a.subscription.type !== "active") {
        oe.warn("Subscription for track ".concat(e, " is not active, skipping cancel..."));
        return;
      }
      a.subscription.streamControllers.delete(r), a.subscription.streamControllers.size === 0 && this.unSubscribeRequest(a.info.sid);
    }, d = () => {
      var u;
      r && ((a == null ? void 0 : a.subscription.type) === "active" && a.subscription.streamControllers.delete(r), r.error(_e.cancelled()), (u = s.reject) === null || u === void 0 || u.call(s, _e.cancelled()), c());
    };
    return [new ReadableStream({
      start: (u) => {
        r = u, this.subscribeRequest(e, t).then(() => m(this, void 0, void 0, function* () {
          var h, f, g;
          if (!a || this.descriptors.get(a.info.sid) !== a) {
            oe.error("Unknown track ".concat(e));
            const p = _e.disconnected();
            u.error(p), (h = s.reject) === null || h === void 0 || h.call(s, p);
            return;
          }
          if (a.subscription.type !== "active") {
            oe.error("Subscription for track ".concat(e, " is not active"));
            const p = _e.disconnected();
            u.error(p), (f = s.reject) === null || f === void 0 || f.call(s, p);
            return;
          }
          if (t != null && t.aborted) {
            d();
            return;
          }
          t == null || t.addEventListener("abort", d), a.subscription.streamControllers.set(u, o), (g = s.resolve) === null || g === void 0 || g.call(s);
        })).catch((h) => {
          var f;
          u.error(h), (f = s.reject) === null || f === void 0 || f.call(s, h);
        });
      },
      cancel: () => {
        c();
      }
    }, new CountQueuingStrategy({
      highWaterMark: n
    })), s.promise];
  }
  /** Client requested to subscribe to a data track.
   *
   * This is sent when the user calls {@link RemoteDataTrack.subscribe}.
   *
   * Only the first request to subscribe to a given track incurs meaningful overhead; subsequent
   * requests simply attach an additional receiver to the broadcast channel, allowing them to consume
   * frames from the existing subscription pipeline.
   */
  subscribeRequest(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = this.descriptors.get(e);
      if (!n)
        throw new Error("Cannot subscribe to unknown track");
      const r = (s, a, o) => m(this, void 0, void 0, function* () {
        if (s.subscription.type === "active")
          return;
        if (s.subscription.type !== "pending")
          throw new Error("Descriptor for track ".concat(e, " is not pending, found ").concat(s.subscription.type));
        const c = el([a, o].filter((u) => typeof u < "u")), d = new ve();
        s.subscription.completionFuture.promise.then(() => {
          var u;
          return (u = d.resolve) === null || u === void 0 ? void 0 : u.call(d);
        }).catch((u) => {
          var h;
          return (h = d.reject) === null || h === void 0 ? void 0 : h.call(d, u);
        });
        const l = () => {
          var u;
          if (s.subscription.type === "pending") {
            if (s.subscription.pendingRequestCount -= 1, o != null && o.aborted) {
              s.subscription.cancel();
              return;
            }
            if (s.subscription.pendingRequestCount <= 0) {
              s.subscription.cancel();
              return;
            }
            (u = d.reject) === null || u === void 0 || u.call(d, _e.cancelled());
          }
        };
        c.aborted && l(), c.addEventListener("abort", l), yield d.promise, c.removeEventListener("abort", l);
      });
      switch (n.subscription.type) {
        case "none": {
          n.subscription = {
            type: "pending",
            completionFuture: new ve(),
            pendingRequestCount: 1,
            cancel: () => {
              var a, o;
              const c = n.subscription;
              n.subscription = {
                type: "none"
              }, this.emit("sfuUpdateSubscription", {
                sid: n.info.sid,
                subscribe: !1
              }), c.type === "pending" && ((o = (a = c.completionFuture).reject) === null || o === void 0 || o.call(a, s.aborted ? _e.timeout() : (
                // NOTE: the below cancelled case was introduced by web / there isn't a corresponding case in the rust version.
                _e.cancelled()
              )));
            }
          }, this.emit("sfuUpdateSubscription", {
            sid: e,
            subscribe: !0
          });
          const s = tl(Gp);
          yield r(n, t, s);
          return;
        }
        case "pending": {
          n.subscription.pendingRequestCount += 1, yield r(n, t);
          return;
        }
        case "active":
          return;
      }
    });
  }
  /**
   * Get information about all currently subscribed tracks.
   * @internal */
  querySubscribed() {
    return m(this, void 0, void 0, function* () {
      return Array.from(this.descriptors.values()).filter((t) => t.subscription.type === "active").map((t) => [t.info, t.publisherIdentity]);
    });
  }
  /** Client requested to unsubscribe from a data track. */
  unSubscribeRequest(e) {
    var t;
    const n = this.descriptors.get(e);
    if (!n)
      throw new Error("Cannot subscribe to unknown track");
    if (n.subscription.type !== "active") {
      oe.warn("Unexpected descriptor state in unSubscribeRequest, expected active, found ".concat((t = n.subscription) === null || t === void 0 ? void 0 : t.type));
      return;
    }
    this.closeStreamControllers(n.subscription.streamControllers, e);
    const r = n.subscription;
    n.subscription = {
      type: "none"
    }, this.subscriptionHandles.delete(r.subcriptionHandle), this.emit("sfuUpdateSubscription", {
      sid: e,
      subscribe: !1
    });
  }
  /** Detach abort-signal listeners and close all downstream stream controllers for an active
   * subscription. Used when the subscription is being torn down by the manager (unsubscribe,
   * unpublish, or shutdown). */
  closeStreamControllers(e, t) {
    for (const r of e) {
      var n = L(r, 2);
      const s = n[0], a = n[1];
      a();
      try {
        s.close();
      } catch (o) {
        oe.warn("Failed to close readable stream for track ".concat(t, ": ").concat(o));
      }
    }
  }
  /** SFU notification that track publications have changed.
   *
   * This event is produced from both {@link JoinResponse} and {@link ParticipantUpdate}
   * to provide a complete view of remote participants' track publications:
   *
   * - From a `JoinResponse`, it captures the initial set of tracks published when a participant joins.
   * - From a `ParticipantUpdate`, it captures subsequent changes (i.e., new tracks being
   *   published and existing tracks unpublished).
   */
  receiveSfuPublicationUpdates(e) {
    return m(this, void 0, void 0, function* () {
      if (e.size === 0)
        return;
      const t = /* @__PURE__ */ new Map();
      for (const s of e.entries()) {
        var n = L(s, 2);
        const a = n[0], o = n[1], c = /* @__PURE__ */ new Set();
        for (const d of o)
          c.add(d.sid), !this.descriptors.has(d.sid) && (this.handleSidReassigned(a, d) || (yield this.handleTrackPublished(a, d)));
        t.set(a, c);
      }
      for (const s of t.entries()) {
        var r = L(s, 2);
        const a = r[0], o = r[1];
        let d = Array.from(this.descriptors.entries()).filter((l) => {
          let u = L(l, 2);
          return u[0], u[1].publisherIdentity === a;
        }).map((l) => L(l, 1)[0]).filter((l) => !o.has(l));
        for (const l of d)
          this.handleTrackUnpublished(l);
      }
    });
  }
  /**
   * Get information about all currently remotely published tracks which could be subscribed to.
   * @internal */
  queryPublications() {
    return m(this, void 0, void 0, function* () {
      return Array.from(this.descriptors.values()).map((e) => e.info);
    });
  }
  handleTrackPublished(e, t) {
    return m(this, void 0, void 0, function* () {
      if (this.descriptors.has(t.sid)) {
        oe.error("Existing descriptor for track ".concat(t.sid));
        return;
      }
      let n = {
        info: t,
        publisherIdentity: e,
        subscription: {
          type: "none"
        },
        pipelineOptions: {}
      };
      this.descriptors.set(n.info.sid, n);
      const r = new al(n.info, this, {
        publisherIdentity: e
      });
      this.emit("trackPublished", {
        track: r
      });
    });
  }
  /**
   * Detects and handles SID reassignment, which occurs when the publisher
   * republishes its tracks after a full reconnect.
   *
   * Returns `true` if an SID reassignment occurred, `false` otherwise.
   */
  handleSidReassigned(e, t) {
    const n = Array.from(this.descriptors.entries()).find((u) => {
      let h = L(u, 2);
      h[0];
      let f = h[1];
      return f.publisherIdentity === e && f.info.pubHandle === t.pubHandle;
    });
    if (!n)
      return !1;
    const r = L(n, 2), s = r[0], a = r[1], o = a.info, c = o.name, d = o.usesE2ee;
    if (c !== t.name || d !== t.usesE2ee)
      return oe.warn("Info mismatch for ".concat(s, ", treating as new publication")), !1;
    const l = t.sid;
    if (oe.debug("SID reassigned: ".concat(s, " -> ").concat(l)), !this.descriptors.delete(s))
      return !1;
    switch (a.info.sid = l, a.subscription.type) {
      case "none":
        break;
      case "pending":
      case "active":
        this.emit("sfuUpdateSubscription", {
          sid: l,
          subscribe: !0
        });
        break;
    }
    return a.subscription.type === "active" && this.subscriptionHandles.set(a.subscription.subcriptionHandle, l), this.descriptors.set(l, a), !0;
  }
  handleTrackUnpublished(e) {
    const t = this.descriptors.get(e);
    if (!t) {
      oe.error("Unknown track ".concat(e));
      return;
    }
    this.descriptors.delete(e), t.subscription.type === "active" && (this.closeStreamControllers(t.subscription.streamControllers, e), this.subscriptionHandles.delete(t.subscription.subcriptionHandle)), this.emit("trackUnpublished", {
      sid: e,
      publisherIdentity: t.publisherIdentity
    });
  }
  /** SFU notification that handles have been assigned for requested subscriptions. */
  receivedSfuSubscriberHandles(e) {
    for (const n of e.entries()) {
      var t = L(n, 2);
      const r = t[0], s = t[1];
      this.registerSubscriberHandle(r, s);
    }
  }
  registerSubscriberHandle(e, t) {
    var n, r;
    const s = this.descriptors.get(t);
    if (!s) {
      oe.error("Unknown track ".concat(t));
      return;
    }
    switch (s.subscription.type) {
      case "none": {
        oe.warn("No subscription for ".concat(t));
        return;
      }
      case "active": {
        this.subscriptionHandles.delete(s.subscription.subcriptionHandle), s.subscription.subcriptionHandle = e, this.subscriptionHandles.set(e, t);
        return;
      }
      case "pending": {
        oe.debug("data track subscription activated", {
          sid: t,
          handle: e
        });
        const a = new Kp({
          info: s.info,
          publisherIdentity: s.publisherIdentity,
          e2eeManager: this.e2eeManager,
          pipelineOptions: s.pipelineOptions
        }), o = s.subscription;
        s.subscription = {
          type: "active",
          subcriptionHandle: e,
          pipeline: a,
          streamControllers: /* @__PURE__ */ new Map()
        }, this.subscriptionHandles.set(e, t), (r = (n = o.completionFuture).resolve) === null || r === void 0 || r.call(n);
      }
    }
  }
  /** Packet has been received over the transport. */
  packetReceived(e) {
    return m(this, void 0, void 0, function* () {
      let t;
      try {
        var n = Yi.fromBinary(e), r = L(n, 1);
        t = r[0];
      } catch (c) {
        oe.error("Failed to deserialize packet: ".concat(c));
        return;
      }
      const s = this.subscriptionHandles.get(t.header.trackHandle);
      if (!s) {
        oe.warn("Unknown subscriber handle ".concat(t.header.trackHandle));
        return;
      }
      const a = this.descriptors.get(s);
      if (!a) {
        oe.error("Missing descriptor for track ".concat(s));
        return;
      }
      if (a.subscription.type !== "active") {
        oe.warn("Received packet for track ".concat(s, " without active subscription"));
        return;
      }
      const o = yield a.subscription.pipeline.processPacket(t);
      if (o)
        for (const c of a.subscription.streamControllers.keys()) {
          if (c.desiredSize !== null && c.desiredSize <= 0) {
            oe.warn("Cannot send frame to subscribers: readable stream is full (desiredSize is ".concat(c.desiredSize, "). To increase this threshold, set a higher 'options.highWaterMark' when calling .subscribe()."));
            continue;
          }
          const d = il.lossyIntoFrame(o);
          c.enqueue(d);
        }
    });
  }
  /** Resend all subscription updates.
   *
   * This must be sent after a full reconnect to ensure the SFU knows which
   * tracks are subscribed to locally.
   */
  resendSubscriptionUpdates() {
    for (const t of this.descriptors) {
      var e = L(t, 2);
      const n = e[0];
      e[1].subscription.type !== "none" && this.emit("sfuUpdateSubscription", {
        sid: n,
        subscribe: !0
      });
    }
  }
  /** Called when a remote participant is disconnected so that any pending data tracks can be
   * cancelled. */
  handleRemoteParticipantDisconnected(e) {
    var t, n;
    for (const r of this.descriptors.values())
      if (r.publisherIdentity === e)
        switch (r.subscription.type) {
          case "none":
            break;
          case "pending":
            (n = (t = r.subscription.completionFuture).reject) === null || n === void 0 || n.call(t, _e.disconnected());
            break;
          case "active":
            this.unSubscribeRequest(r.info.sid);
            break;
        }
  }
  /** Resets the manager, ending any subscriptions, and getting it ready for the next room
   * connection.  */
  reset() {
    var e, t;
    for (const n of this.descriptors.values())
      this.emit("trackUnpublished", {
        sid: n.info.sid,
        publisherIdentity: n.publisherIdentity
      }), n.subscription.type === "pending" && ((t = (e = n.subscription.completionFuture).reject) === null || t === void 0 || t.call(e, _e.disconnected())), n.subscription.type === "active" && this.closeStreamControllers(n.subscription.streamControllers, n.info.sid);
    this.descriptors.clear(), this.subscriptionHandles.clear();
  }
}
class Xi extends Ue {
  constructor(e, t, n) {
    super(19, e, n), this.name = "DataTrackPacketizerError", this.reason = t, this.reasonName = Oi[t];
  }
  static mtuTooShort() {
    return new Xi("MTU is too short to send frame", Oi.MtuTooShort);
  }
}
var Oi;
(function(i) {
  i[i.MtuTooShort = 0] = "MtuTooShort";
})(Oi || (Oi = {}));
class ta {
  constructor(e, t) {
    this.sequence = Ke.u16(0), this.frameNumber = Ke.u16(0), this.clock = At.rtpStartingNow(sn.rtpRandom()), this.handle = e, this.mtuSizeBytes = t;
  }
  /** @internal */
  static computeFrameMarker(e, t) {
    return t <= 1 ? Z.Single : e === 0 ? Z.Start : e === t - 1 ? Z.Final : Z.Inter;
  }
  /** Generates a series of packets for the specified {@link DataTrackFrameInternal}.
   *
   * NOTE: The return value of this function is a generator, so it can be lazily ran if desired,
   * or converted to an array with {@link Array.from}.
   */
  *packetize(e, t) {
    var n;
    const r = this.frameNumber.getThenIncrement(), s = {
      marker: Z.Inter,
      trackHandle: this.handle,
      sequence: Ke.u16(0),
      frameNumber: r,
      timestamp: (n = t == null ? void 0 : t.now) !== null && n !== void 0 ? n : this.clock.now(),
      extensions: e.extensions
    }, a = new Kn(s).toBinaryLengthBytes();
    if (a >= this.mtuSizeBytes)
      throw Xi.mtuTooShort();
    const o = this.mtuSizeBytes - a, c = Math.ceil(e.payload.byteLength / o);
    for (let l = 0, u = 0; u < e.payload.byteLength; d = [l + 1, u + o], l = d[0], u = d[1], d) {
      var d;
      const h = this.sequence.getThenIncrement(), f = new Kn(Object.assign(Object.assign({}, s), {
        marker: ta.computeFrameMarker(l, c),
        sequence: h
      })), g = Math.min(
        // All but the last packet will be max length ...
        o,
        // ... and the last packet will be as long as it needs to be to finish out the buffer.
        e.payload.byteLength - u
      ), p = new Uint8Array(e.payload.buffer, e.payload.byteOffset + u, g);
      yield new Yi(f, p);
    }
  }
}
var Be;
(function(i) {
  i[i.NotAllowed = 0] = "NotAllowed", i[i.DuplicateName = 1] = "DuplicateName", i[i.Timeout = 2] = "Timeout", i[i.LimitReached = 3] = "LimitReached", i[i.Disconnected = 4] = "Disconnected", i[i.Cancelled = 5] = "Cancelled", i[i.InvalidName = 6] = "InvalidName", i[i.Unknown = 7] = "Unknown";
})(Be || (Be = {}));
class le extends Ue {
  constructor(e, t, n) {
    super(21, e, n), this.name = "DataTrackPublishError", this.reason = t, this.reasonName = Be[t], this.rawMessage = n == null ? void 0 : n.rawMessage;
  }
  static notAllowed(e) {
    return new le("Data track publishing unauthorized", Be.NotAllowed, {
      rawMessage: e
    });
  }
  static duplicateName(e) {
    return new le("Track name already taken", Be.DuplicateName, {
      rawMessage: e
    });
  }
  static invalidName(e) {
    return new le("Track name is invalid", Be.InvalidName, {
      rawMessage: e
    });
  }
  static timeout() {
    return new le("Publish data track timed-out. Does the LiveKit server support data tracks?", Be.Timeout);
  }
  static limitReached(e) {
    return new le("Data track publication limit reached", Be.LimitReached, {
      rawMessage: e
    });
  }
  static unknown(e, t) {
    return new le("Received RequestResponse for publishDataTrack, but reason was unrecognised (".concat(e, ", ").concat(t, ")"), Be.Unknown);
  }
  static disconnected() {
    return new le("Room disconnected", Be.Disconnected);
  }
  // NOTE: this was introduced by web / there isn't a corresponding case in the rust version.
  static cancelled() {
    return new le("Publish data track cancelled by caller", Be.Cancelled);
  }
}
var Mn;
(function(i) {
  i[i.TrackUnpublished = 0] = "TrackUnpublished", i[i.Dropped = 1] = "Dropped";
})(Mn || (Mn = {}));
class yt extends Ue {
  constructor(e, t, n) {
    super(22, e, n), this.name = "DataTrackPushFrameError", this.reason = t, this.reasonName = Mn[t];
  }
  static trackUnpublished() {
    return new yt("Track is no longer published", Mn.TrackUnpublished);
  }
  static dropped(e) {
    return new yt("Frame was dropped", Mn.Dropped, {
      cause: e
    });
  }
}
var On;
(function(i) {
  i[i.Packetizer = 0] = "Packetizer", i[i.Encryption = 1] = "Encryption";
})(On || (On = {}));
class Gn extends Ue {
  constructor(e, t, n) {
    super(21, e, n), this.name = "DataTrackOutgoingPipelineError", this.reason = t, this.reasonName = On[t];
  }
  static packetizer(e) {
    return new Gn("Error packetizing frame", On.Packetizer, {
      cause: e
    });
  }
  static encryption(e) {
    return new Gn("Error encrypting frame", On.Encryption, {
      cause: e
    });
  }
}
class Zi {
  /** @internal */
  constructor(e, t) {
    this.trackSymbol = rl, this.isLocal = !0, this.typeSymbol = sl, this.handle = null, this.log = q, this.flushedFuture = new ve(), this.isFlushed = !0, this.handleManagerReset = () => {
      var n, r;
      (r = (n = this.flushedFuture).resolve) === null || r === void 0 || r.call(n), this.manager.off("packetsFlushedChange", this.handleManagerPacketsFlushedChange), this.manager.off("reset", this.handleManagerReset);
    }, this.handleManagerPacketsFlushedChange = (n) => {
      var r, s;
      this.isFlushed = n.isFlushed, n.isFlushed && ((s = (r = this.flushedFuture).resolve) === null || s === void 0 || s.call(r), this.flushedFuture = new ve());
    }, this.options = e, this.manager = t, this.log = he(te.DataTracks), this.manager.on("packetsFlushedChange", this.handleManagerPacketsFlushedChange), this.manager.on("reset", this.handleManagerReset);
  }
  /** @internal */
  static withExplicitHandle(e, t, n) {
    const r = new Zi(e, t);
    return r.handle = n, r;
  }
  /** Metrics about the data track publication. */
  get info() {
    const e = this.descriptor;
    if ((e == null ? void 0 : e.type) === "active")
      return e.info;
  }
  /** The raw descriptor from the manager containing the internal state for this local track. */
  get descriptor() {
    return this.handle ? this.manager.getDescriptor(this.handle) : null;
  }
  /**
   * Publish the track to the SFU. This must be done before calling {@link tryPush} for the first time.
   * @internal
   * */
  publish(e) {
    return m(this, void 0, void 0, function* () {
      try {
        this.handle = yield this.manager.publishRequest(this.options, e);
      } catch (t) {
        throw t;
      }
    });
  }
  isPublished() {
    var e;
    return ((e = this.descriptor) === null || e === void 0 ? void 0 : e.type) === "active" && this.descriptor.publishState !== "unpublished";
  }
  /** Try pushing a frame to subscribers of the track.
   *
   * Pushing a frame can fail for several reasons:
   *
   * - The track has been unpublished by the local participant or SFU
   * - The room is no longer connected
   */
  tryPush(e) {
    if (!this.handle)
      throw yt.trackUnpublished();
    const t = il.from(e);
    try {
      return this.manager.tryProcessAndSend(this.handle, t);
    } catch (n) {
      throw n;
    }
  }
  /**
   * When called, waits for all in flight packets to be sent before resolving.
   *
   * Use this to:
   *
   * 1. Send frames exactly in order:
   * ```ts
   * await track.tryPush(/* ... *\/);
   * await track.flush();
   * await track.tryPush(/* ... *\/);
   * await track.flush();
   * // ... etc ...
   * ```
   *
   * 2. Wait for frames to all be delivered before unpublishing a local data track:
   *
   * ```ts
   * await track.tryPush(/* ... *\/);
   * await track.tryPush(/* ... *\/);
   * await track.tryPush(/* ... *\/);
   * // ... etc ...
   * await track.flush();
   * await track.unpublish();
   * ```
   **/
  flush() {
    return m(this, void 0, void 0, function* () {
      if (!this.isFlushed)
        return this.flushedFuture.promise;
    });
  }
  /**
   * Unpublish the track from the SFU. Once this is called, any further calls to {@link tryPush}
   * will fail.
   * */
  unpublish() {
    return m(this, void 0, void 0, function* () {
      if (!this.handle) {
        q.warn('Data track "'.concat(this.options.name, '" is not published, so unpublishing has no effect.'));
        return;
      }
      try {
        yield this.manager.unpublishRequest(this.handle);
      } catch (e) {
        throw e;
      }
    });
  }
}
class er {
  constructor(e) {
    this.e2eeManager = e.e2eeManager, this.packetizer = new ta(e.info.pubHandle, er.TRANSPORT_MTU_BYTES);
  }
  updateE2eeManager(e) {
    this.e2eeManager = e;
  }
  processFrame(e) {
    return Fc(this, arguments, function* () {
      const n = yield ut(this.encryptIfNeeded(e));
      try {
        yield ut(yield* Vh(Ne(this.packetizer.packetize(n))));
      } catch (r) {
        throw r instanceof Xi ? Gn.packetizer(r) : r;
      }
    });
  }
  encryptIfNeeded(e) {
    return m(this, void 0, void 0, function* () {
      if (!this.e2eeManager)
        return e;
      let t;
      try {
        t = yield this.e2eeManager.encryptData(e.payload);
      } catch (n) {
        throw Gn.encryption(n);
      }
      return e.payload = t.payload, e.extensions.e2ee = new He(t.keyIndex, t.iv), e;
    });
  }
}
er.TRANSPORT_MTU_BYTES = 16e3;
const Le = he(te.DataTracks), Ao = {
  pending() {
    return {
      type: "pending",
      completionFuture: new ve()
    };
  },
  active(i, e) {
    return {
      type: "active",
      info: i,
      publishState: "published",
      pipeline: new er({
        info: i,
        e2eeManager: e
      }),
      unpublishingFuture: new ve()
    };
  }
}, Qp = 1e4;
class na extends Ie.EventEmitter {
  constructor(e) {
    var t;
    super(), this.handleAllocator = new fm(), this.descriptors = /* @__PURE__ */ new Map(), this.inFlightPacketCounter = /* @__PURE__ */ new Map(), this.e2eeManager = (t = e == null ? void 0 : e.e2eeManager) !== null && t !== void 0 ? t : null;
  }
  static withDescriptors(e) {
    const t = new na();
    return t.descriptors = e, t;
  }
  /** @internal */
  updateE2eeManager(e) {
    this.e2eeManager = e;
    for (const t of this.descriptors.values())
      t.type === "active" && t.pipeline.updateE2eeManager(e);
  }
  /**
   * Used by attached {@link LocalDataTrack} instances to query their associated descriptor info.
   * @internal
   */
  getDescriptor(e) {
    var t;
    return (t = this.descriptors.get(e)) !== null && t !== void 0 ? t : null;
  }
  /** Used by attached {@link LocalDataTrack} instances to broadcast data track packets to other
   * subscribers.
   * @internal
   */
  tryProcessAndSend(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r, s, a, o;
      const c = this.getDescriptor(e);
      if ((c == null ? void 0 : c.type) !== "active" || c.publishState === "unpublished")
        throw yt.trackUnpublished();
      if (c.publishState === "republishing")
        throw yt.dropped("Data track republishing");
      try {
        try {
          for (var d = !0, l = Ne(c.pipeline.processFrame(t)), u; u = yield l.next(), n = u.done, !n; d = !0) {
            a = u.value, d = !1;
            const h = a, f = (o = this.inFlightPacketCounter.get(e)) !== null && o !== void 0 ? o : 0;
            this.inFlightPacketCounter.set(e, f + 1), f === 0 && this.emit("packetsFlushedChange", {
              handle: e,
              isFlushed: !1
            }), this.emit("packetAvailable", {
              handle: e,
              bytes: h.toBinary()
            });
          }
        } catch (h) {
          r = {
            error: h
          };
        } finally {
          try {
            !d && !n && (s = l.return) && (yield s.call(l));
          } finally {
            if (r) throw r.error;
          }
        }
      } catch (h) {
        throw yt.dropped(h);
      }
    });
  }
  /** The client has sent a packet over the rtc data channel. This signal is used for determining
   * once all packets are sent and a data track has been "flushed".
   *
   * @internal */
  handlePacketSendComplete(e) {
    var t;
    let r = ((t = this.inFlightPacketCounter.get(e)) !== null && t !== void 0 ? t : 0) - 1;
    r < 0 && (Le.warn("OutgoingDataTrackManager.handlePacketSendComplete: inFlightPacketCounter was decremented below 0 (got ".concat(this.inFlightPacketCounter, " - resetting to 0. Were more packets send than were emitted?")), r = 0), this.inFlightPacketCounter.set(e, r), r === 0 && this.emit("packetsFlushedChange", {
      handle: e,
      isFlushed: !0
    });
  }
  /**
   * Client requested to publish a track.
   *
   * If the LiveKit server is too old and doesn't support data tracks, a
   * {@link DataTrackPublishError#timeout} will be thrown.
   *
   * @internal
   **/
  publishRequest(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = this.handleAllocator.get();
      if (!n)
        throw le.limitReached();
      const r = tl(Qp), s = t ? el([t, r]) : r;
      if (this.descriptors.has(n))
        throw new Error("Descriptor for handle already exists");
      const a = Ao.pending();
      this.descriptors.set(n, a);
      const o = () => {
        var c, d;
        const l = this.descriptors.get(n);
        if (!l) {
          Le.warn("No descriptor for ".concat(n));
          return;
        }
        this.descriptors.delete(n), this.emit("sfuUnpublishRequest", {
          handle: n
        }), l.type === "pending" && ((d = (c = l.completionFuture).reject) === null || d === void 0 || d.call(c, r.aborted ? le.timeout() : (
          // NOTE: the below cancelled case was introduced by web / there isn't a corresponding case in the rust version.
          le.cancelled()
        )));
      };
      return s.aborted ? (o(), a.completionFuture.promise.then(
        () => n
        /* no-op, makes typescript happy */
      )) : (s.addEventListener("abort", o), this.emit("sfuPublishRequest", {
        handle: n,
        name: e.name,
        usesE2ee: this.e2eeManager !== null
      }), yield a.completionFuture.promise, s.removeEventListener("abort", o), this.emit("trackPublished", {
        track: Zi.withExplicitHandle(e, this, n)
      }), n);
    });
  }
  /**
   * Get information about all currently published tracks.
   * @internal
   **/
  queryPublished() {
    return Array.from(this.descriptors.values()).filter((t) => t.type === "active").map((t) => t.info);
  }
  /**
   * Client request to unpublish a track.
   * @internal
   **/
  unpublishRequest(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.descriptors.get(e);
      if (!t) {
        Le.warn("No descriptor for ".concat(e));
        return;
      }
      if (t.type !== "active") {
        Le.warn("Track ".concat(e, " not active"));
        return;
      }
      this.emit("sfuUnpublishRequest", {
        handle: e
      }), yield t.unpublishingFuture.promise, this.inFlightPacketCounter.delete(e), this.emit("trackUnpublished", {
        sid: t.info.sid
      });
    });
  }
  /**
   * SFU responded to a request to publish a data track.
   * @internal
   **/
  receivedSfuPublishResponse(e, t) {
    var n, r, s, a;
    const o = this.descriptors.get(e);
    if (!o) {
      Le.warn("No descriptor for ".concat(e));
      return;
    }
    switch (this.descriptors.delete(e), o.type) {
      case "pending": {
        if (t.type === "ok") {
          const c = t.data;
          Le.debug("SFU accepted publish request for handle ".concat(e), {
            sid: c.sid
          });
          const d = c.usesE2ee ? this.e2eeManager : null;
          this.descriptors.set(c.pubHandle, Ao.active(c, d)), (r = (n = o.completionFuture).resolve) === null || r === void 0 || r.call(n);
        } else
          Le.debug("SFU rejected publish request for handle ".concat(e), {
            error: t.error
          }), (a = (s = o.completionFuture).reject) === null || a === void 0 || a.call(s, t.error);
        return;
      }
      case "active": {
        if (o.publishState !== "republishing") {
          Le.warn("Track ".concat(e, " already active"));
          return;
        }
        if (t.type === "error") {
          Le.warn("Republish failed for track ".concat(e));
          return;
        }
        Le.debug("Track ".concat(e, " republished")), o.info.sid = t.data.sid, o.publishState = "published", this.descriptors.set(o.info.pubHandle, o);
      }
    }
  }
  /**
   * SFU notification that a track has been unpublished.
   * @internal
   **/
  receivedSfuUnpublishResponse(e) {
    var t, n;
    const r = this.descriptors.get(e);
    if (!r) {
      Le.warn("No descriptor for ".concat(e));
      return;
    }
    if (this.descriptors.delete(e), r.type !== "active") {
      Le.warn("Track ".concat(e, " not active"));
      return;
    }
    r.publishState = "unpublished", (n = (t = r.unpublishingFuture).resolve) === null || n === void 0 || n.call(t);
  }
  /** Republish all tracks.
   *
   * This must be sent after a full reconnect in order for existing publications
   * to be recognized by the SFU. Each republished track will be assigned a new SID.
   * @internal
   */
  sfuWillRepublishTracks() {
    var e, t;
    for (const r of this.descriptors.entries()) {
      var n = L(r, 2);
      const s = n[0], a = n[1];
      switch (a.type) {
        case "pending":
          this.descriptors.delete(s), (t = (e = a.completionFuture).reject) === null || t === void 0 || t.call(e, le.disconnected());
          break;
        case "active":
          a.publishState = "republishing", this.emit("sfuPublishRequest", {
            handle: a.info.pubHandle,
            name: a.info.name,
            usesE2ee: a.info.usesE2ee
          });
      }
    }
  }
  /**
   * Reset's the state of the manager and all associated tracks. Run on room disconnect to get
   * the manager ready for the next room connection.
   * @internal
   **/
  reset() {
    return m(this, void 0, void 0, function* () {
      var e, t, n, r;
      this.handleAllocator.reset();
      for (const s of this.descriptors.values())
        switch (s.type) {
          case "pending":
            (t = (e = s.completionFuture).reject) === null || t === void 0 || t.call(e, le.disconnected());
            break;
          case "active":
            (r = (n = s.unpublishingFuture).resolve) === null || r === void 0 || r.call(n), yield this.unpublishRequest(s.info.pubHandle);
            break;
        }
      this.descriptors.clear(), this.inFlightPacketCounter.clear(), this.emit("reset");
    });
  }
}
class z extends Error {
  /**
   * Creates an error object with the given code and message, plus an optional data payload.
   *
   * If thrown in an RPC method handler, the error will be sent back to the caller.
   *
   * Error codes 1001-1999 are reserved for built-in errors (see RpcError.ErrorCode for their meanings).
   */
  constructor(e, t, n, r) {
    super(t), this.code = e, this.message = Do(t, z.MAX_MESSAGE_BYTES), this.data = n ? Do(n, z.MAX_DATA_BYTES) : void 0, typeof (r == null ? void 0 : r.cause) < "u" && (this.cause = r == null ? void 0 : r.cause);
  }
  /**
   * @internal
   */
  static fromProto(e) {
    return new z(e.code, e.message, e.data);
  }
  /**
   * @internal
   */
  toProto() {
    return new uc({
      code: this.code,
      message: this.message,
      data: this.data
    });
  }
  /**
   * Creates an error object from the code, with an auto-populated message.
   *
   * @internal
   */
  static builtIn(e, t, n) {
    return new z(z.ErrorCode[e], z.ErrorMessage[e], t, n);
  }
}
z.MAX_MESSAGE_BYTES = 256;
z.MAX_DATA_BYTES = 15360;
z.ErrorCode = {
  APPLICATION_ERROR: 1500,
  CONNECTION_TIMEOUT: 1501,
  RESPONSE_TIMEOUT: 1502,
  RECIPIENT_DISCONNECTED: 1503,
  RESPONSE_PAYLOAD_TOO_LARGE: 1504,
  SEND_FAILED: 1505,
  UNSUPPORTED_METHOD: 1400,
  RECIPIENT_NOT_FOUND: 1401,
  REQUEST_PAYLOAD_TOO_LARGE: 1402,
  UNSUPPORTED_SERVER: 1403,
  UNSUPPORTED_VERSION: 1404
};
z.ErrorMessage = {
  APPLICATION_ERROR: "Application error in method handler",
  CONNECTION_TIMEOUT: "Connection timeout",
  RESPONSE_TIMEOUT: "Response timeout",
  RECIPIENT_DISCONNECTED: "Recipient disconnected",
  RESPONSE_PAYLOAD_TOO_LARGE: "Response payload too large",
  SEND_FAILED: "Failed to send",
  UNSUPPORTED_METHOD: "Method not supported at destination",
  RECIPIENT_NOT_FOUND: "Recipient not found",
  REQUEST_PAYLOAD_TOO_LARGE: "Request payload too large",
  UNSUPPORTED_SERVER: "RPC not supported by server",
  UNSUPPORTED_VERSION: "Unsupported RPC version"
};
const ol = 15360, cl = "lk.rpc_request", dl = "lk.rpc_response";
var ge;
(function(i) {
  i.RPC_REQUEST_ID = "lk.rpc_request_id", i.RPC_REQUEST_METHOD = "lk.rpc_request_method", i.RPC_REQUEST_RESPONSE_TIMEOUT_MS = "lk.rpc_request_response_timeout_ms", i.RPC_REQUEST_VERSION = "lk.rpc_request_version";
})(ge || (ge = {}));
const Yp = 1, ll = 2;
function ia(i) {
  return new TextEncoder().encode(i).length;
}
function Do(i, e) {
  if (ia(i) <= e)
    return i;
  let t = 0, n = i.length;
  const r = new TextEncoder();
  for (; t < n; ) {
    const s = Math.floor((t + n + 1) / 2);
    r.encode(i.slice(0, s)).length <= e ? t = s : n = s - 1;
  }
  return i.slice(0, t);
}
class $p extends Ie.EventEmitter {
  constructor(e, t, n, r) {
    super(), this.pendingAcks = /* @__PURE__ */ new Map(), this.pendingResponses = /* @__PURE__ */ new Map(), this.log = e, this.outgoingDataStreamManager = t, this.getRemoteParticipantClientProtocol = n, this.getServerVersion = r;
  }
  performRpc(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = t.destinationIdentity, s = t.method, a = t.payload, o = t.responseTimeout, c = o === void 0 ? 15e3 : o;
      return (function* () {
        const u = n.getRemoteParticipantClientProtocol(r);
        if (ia(a) > ol && u < ns)
          throw z.builtIn("REQUEST_PAYLOAD_TOO_LARGE");
        const f = n.getServerVersion();
        if (f && Je(f, "1.8.0") < 0)
          throw z.builtIn("UNSUPPORTED_SERVER");
        const g = Math.max(c, 8e3), p = crypto.randomUUID(), k = new ve();
        let T = null;
        const S = setTimeout(() => {
          var b;
          n.pendingAcks.delete(p), (b = k.reject) === null || b === void 0 || b.call(k, z.builtIn("CONNECTION_TIMEOUT")), n.pendingResponses.delete(p), T !== null && clearTimeout(T);
        }, 7e3);
        n.pendingAcks.set(p, {
          resolve: () => {
            clearTimeout(S);
          },
          participantIdentity: r
        }), n.pendingResponses.set(p, {
          completionFuture: k,
          participantIdentity: r
        }), yield n.publishRpcRequest(r, p, s, a, g, u), T = setTimeout(() => {
          var b;
          n.pendingResponses.delete(p), (b = k.reject) === null || b === void 0 || b.call(k, z.builtIn("RESPONSE_TIMEOUT"));
        }, c);
        const I = k.promise.finally(() => {
          clearTimeout(T), n.pendingAcks.has(p) && (n.log.warn("RPC response received before ack", p), n.pendingAcks.delete(p), clearTimeout(S));
        });
        return [p, I];
      })();
    });
  }
  publishRpcRequest(e, t, n, r, s, a) {
    return m(this, void 0, void 0, function* () {
      if (a >= ns) {
        yield this.outgoingDataStreamManager.sendText(r, {
          topic: cl,
          destinationIdentities: [e],
          attributes: {
            [ge.RPC_REQUEST_ID]: t,
            [ge.RPC_REQUEST_METHOD]: n,
            [ge.RPC_REQUEST_RESPONSE_TIMEOUT_MS]: "".concat(s),
            [ge.RPC_REQUEST_VERSION]: "".concat(ll)
          }
        });
        return;
      }
      this.emit("sendDataPacket", {
        packet: new Ce({
          destinationIdentities: [e],
          kind: Tt.RELIABLE,
          value: {
            case: "rpcRequest",
            value: new Rs({
              id: t,
              method: n,
              payload: r,
              responseTimeoutMs: s,
              version: Yp
            })
          }
        })
      });
    });
  }
  /**
   * Handle an incoming data stream containing an RPC response payload.
   * @internal
   */
  handleIncomingDataStream(e, t, n) {
    return m(this, void 0, void 0, function* () {
      const r = n[ge.RPC_REQUEST_ID];
      if (!r) {
        this.log.warn("RPC data stream malformed: ".concat(ge.RPC_REQUEST_ID, " not set."));
        return;
      }
      const s = this.pendingResponses.get(r);
      if (s && s.participantIdentity !== t) {
        this.log.warn("RPC response stream for ".concat(r, " arrived from unexpected sender ").concat(t, ", expected ").concat(s.participantIdentity, ". Ignoring."));
        return;
      }
      let a;
      try {
        a = yield e.readAll();
      } catch (o) {
        this.log.warn("Error reading RPC response payload: ".concat(o)), this.handleIncomingRpcResponseFailure(r, z.builtIn("APPLICATION_ERROR", "Error reading RPC response payload", {
          cause: o
        }));
        return;
      }
      this.handleIncomingRpcResponseSuccess(r, a);
    });
  }
  /** @internal */
  handleIncomingRpcResponseSuccess(e, t) {
    var n, r;
    const s = this.pendingResponses.get(e);
    s ? ((r = (n = s.completionFuture).resolve) === null || r === void 0 || r.call(n, t), this.pendingResponses.delete(e)) : this.log.error("Response received for unexpected RPC request", e);
  }
  /** @internal */
  handleIncomingRpcResponseFailure(e, t) {
    var n, r;
    const s = this.pendingResponses.get(e);
    s ? ((r = (n = s.completionFuture).reject) === null || r === void 0 || r.call(n, t), this.pendingResponses.delete(e)) : this.log.error("Response received for unexpected RPC request", e);
  }
  /** @internal */
  handleIncomingRpcAck(e) {
    const t = this.pendingAcks.get(e);
    t ? (t.resolve(), this.pendingAcks.delete(e)) : this.log.error("Ack received for unexpected RPC request: ".concat(e));
  }
  /** @internal */
  handleParticipantDisconnected(e) {
    var t;
    for (const a of this.pendingAcks) {
      var n = L(a, 2);
      const o = n[0];
      n[1].participantIdentity === e && this.pendingAcks.delete(o);
    }
    for (const a of this.pendingResponses) {
      var r = L(a, 2);
      const o = r[0];
      var s = r[1];
      const c = s.participantIdentity, d = s.completionFuture;
      c === e && ((t = d.reject) === null || t === void 0 || t.call(d, z.builtIn("RECIPIENT_DISCONNECTED")), this.pendingResponses.delete(o));
    }
  }
}
class Xp extends Ie.EventEmitter {
  constructor(e, t, n) {
    super(), this.rpcHandlers = /* @__PURE__ */ new Map(), this.log = e, this.outgoingDataStreamManager = t, this.getRemoteParticipantClientProtocol = n;
  }
  registerRpcMethod(e, t) {
    if (this.rpcHandlers.has(e))
      throw Error("RPC handler already registered for method ".concat(e, ", unregisterRpcMethod before trying to register again"));
    this.rpcHandlers.set(e, t);
  }
  unregisterRpcMethod(e) {
    this.rpcHandlers.delete(e);
  }
  /**
   * Handle an incoming RPCRequest message containing a payload.
   * This handles "version 1" of rpc requests.
   * @internal
   */
  handleIncomingRpcRequest(e, t) {
    return m(this, void 0, void 0, function* () {
      var n;
      if (this.publishRpcAck(e, t.id), t.version !== 1) {
        this.publishRpcResponsePacket(e, t.id, null, z.builtIn("UNSUPPORTED_VERSION"));
        return;
      }
      const r = this.rpcHandlers.get(t.method);
      if (!r) {
        this.publishRpcResponsePacket(e, t.id, null, z.builtIn("UNSUPPORTED_METHOD"));
        return;
      }
      let s;
      try {
        s = yield r({
          requestId: t.id,
          callerIdentity: e,
          payload: t.payload,
          responseTimeout: t.responseTimeoutMs
        });
      } catch (a) {
        let o;
        a instanceof z ? o = a : (this.log.warn("Uncaught error returned by RPC handler for ".concat(t.method, ". Returning APPLICATION_ERROR instead."), a), o = z.builtIn("APPLICATION_ERROR", "Uncaught error: ".concat((n = a == null ? void 0 : a.message) !== null && n !== void 0 ? n : a), {
          cause: a
        })), this.publishRpcResponsePacket(e, t.id, null, o);
        return;
      }
      yield this.publishRpcResponse(e, t.id, s ?? "");
    });
  }
  /**
   * Handle an incoming data stream containing a RPC request payload.
   * This handles "version 2" of rpc requests.
   * @internal
   */
  handleIncomingDataStream(e, t, n) {
    return m(this, void 0, void 0, function* () {
      const r = n[ge.RPC_REQUEST_ID], s = n[ge.RPC_REQUEST_METHOD], a = parseInt(n[ge.RPC_REQUEST_RESPONSE_TIMEOUT_MS], 10), o = parseInt(n[ge.RPC_REQUEST_VERSION], 10);
      if (!r || !s || Number.isNaN(a) || Number.isNaN(o)) {
        this.log.warn("RPC data stream malformed: ".concat(ge.RPC_REQUEST_ID, " / ").concat(ge.RPC_REQUEST_METHOD, " / ").concat(ge.RPC_REQUEST_RESPONSE_TIMEOUT_MS, " / ").concat(ge.RPC_REQUEST_VERSION, " not set.")), this.publishRpcResponsePacket(t, r, null, z.builtIn("APPLICATION_ERROR", "RPC data stream malformed"));
        return;
      }
      if (this.publishRpcAck(t, r), o !== ll) {
        this.publishRpcResponsePacket(t, r, null, z.builtIn("UNSUPPORTED_VERSION"));
        return;
      }
      let c;
      try {
        c = yield e.readAll();
      } catch (u) {
        this.log.warn("Error reading RPC request payload: ".concat(u)), this.publishRpcResponsePacket(t, r, null, z.builtIn("APPLICATION_ERROR", "Error reading RPC request payload", {
          cause: u
        }));
        return;
      }
      const d = this.rpcHandlers.get(s);
      if (!d) {
        this.publishRpcResponsePacket(t, r, null, z.builtIn("UNSUPPORTED_METHOD"));
        return;
      }
      let l;
      try {
        l = yield d({
          requestId: r,
          callerIdentity: t,
          payload: c,
          responseTimeout: a
        });
      } catch (u) {
        let h;
        u instanceof z ? h = u : (this.log.warn("Uncaught error returned by RPC handler for ".concat(s, ". Returning APPLICATION_ERROR instead."), u), h = z.builtIn("APPLICATION_ERROR")), this.publishRpcResponsePacket(t, r, null, h);
        return;
      }
      yield this.publishRpcResponse(t, r, l ?? "");
    });
  }
  publishRpcAck(e, t) {
    this.emit("sendDataPacket", {
      packet: new Ce({
        destinationIdentities: [e],
        kind: Tt.RELIABLE,
        value: {
          case: "rpcAck",
          value: new Ni({
            requestId: t
          })
        }
      })
    });
  }
  publishRpcResponsePacket(e, t, n, r) {
    this.emit("sendDataPacket", {
      packet: new Ce({
        destinationIdentities: [e],
        kind: Tt.RELIABLE,
        value: {
          case: "rpcResponse",
          value: new Is({
            requestId: t,
            value: r ? {
              case: "error",
              value: r.toProto()
            } : {
              case: "payload",
              value: n ?? ""
            }
          })
        }
      })
    });
  }
  /**
   * Send a successful RPC response payload, choosing the transport based on
   * the caller's client protocol version.
   */
  publishRpcResponse(e, t, n) {
    return m(this, void 0, void 0, function* () {
      if (this.getRemoteParticipantClientProtocol(e) >= ns) {
        yield this.outgoingDataStreamManager.sendText(n, {
          topic: dl,
          destinationIdentities: [e],
          attributes: {
            [ge.RPC_REQUEST_ID]: t
          }
        });
        return;
      }
      if (ia(n) > ol) {
        this.log.warn("RPC Response payload too large for request ".concat(t, ". To send larger responses, consider updating the sending client.")), this.publishRpcResponsePacket(e, t, null, z.builtIn("RESPONSE_PAYLOAD_TOO_LARGE"));
        return;
      }
      this.publishRpcResponsePacket(e, t, n, null);
    });
  }
}
class Zp extends xd {
  constructor(e, t, n, r, s, a) {
    super(e, t, E.Kind.Audio, n, a), this.monitorReceiver = () => m(this, void 0, void 0, function* () {
      if (!this.receiver) {
        this._currentBitrate = 0;
        return;
      }
      const o = yield this.getReceiverStats();
      o && this.prevStats && this.receiver && (this._currentBitrate = Ji(o, this.prevStats)), this.prevStats = o;
    }), this.audioContext = r, this.webAudioPluginNodes = [], s && (this.sinkId = s.deviceId);
  }
  /**
   * sets the volume for all attached audio elements
   */
  setVolume(e) {
    var t;
    for (const n of this.attachedElements)
      this.audioContext ? (t = this.gainNode) === null || t === void 0 || t.gain.setTargetAtTime(e, 0, 0.1) : n.volume = e;
    ze() && this._mediaStreamTrack._setVolume(e), this.elementVolume = e;
  }
  /**
   * gets the volume of attached audio elements (loudest)
   */
  getVolume() {
    if (this.elementVolume)
      return this.elementVolume;
    if (ze())
      return 1;
    let e = 0;
    return this.attachedElements.forEach((t) => {
      t.volume > e && (e = t.volume);
    }), e;
  }
  /**
   * calls setSinkId on all attached elements, if supported
   * @param deviceId audio output device
   */
  setSinkId(e) {
    return m(this, void 0, void 0, function* () {
      this.sinkId = e, yield Promise.all(this.attachedElements.map((t) => {
        if (Ei(t))
          return t.setSinkId(e);
      }));
    });
  }
  attach(e) {
    const t = this.attachedElements.length === 0;
    return e ? super.attach(e) : e = super.attach(), this.sinkId && Ei(e) && e.setSinkId(this.sinkId).catch((n) => {
      this.log.error("Failed to set sink id on remote audio track", n, this.logContext);
    }), this.audioContext && t && (this.log.debug("using audio context mapping", this.logContext), this.connectWebAudio(this.audioContext, e), e.volume = 0, e.muted = !0), this.elementVolume && this.setVolume(this.elementVolume), e;
  }
  detach(e) {
    let t;
    return e ? (t = super.detach(e), this.audioContext && (this.attachedElements.length > 0 ? this.connectWebAudio(this.audioContext, this.attachedElements[0]) : this.disconnectWebAudio())) : (t = super.detach(), this.disconnectWebAudio()), t;
  }
  /**
   * @internal
   * @experimental
   */
  setAudioContext(e) {
    this.audioContext = e, e && this.attachedElements.length > 0 ? this.connectWebAudio(e, this.attachedElements[0]) : e || this.disconnectWebAudio();
  }
  /**
   * @internal
   * @experimental
   * @param {AudioNode[]} nodes - An array of WebAudio nodes. These nodes should not be connected to each other when passed, as the sdk will take care of connecting them in the order of the array.
   */
  setWebAudioPlugins(e) {
    this.webAudioPluginNodes = e, this.attachedElements.length > 0 && this.audioContext && this.connectWebAudio(this.audioContext, this.attachedElements[0]);
  }
  connectWebAudio(e, t) {
    this.disconnectWebAudio(), this.sourceNode = e.createMediaStreamSource(t.srcObject);
    let n = this.sourceNode;
    this.webAudioPluginNodes.forEach((r) => {
      n.connect(r), n = r;
    }), this.gainNode = e.createGain(), n.connect(this.gainNode), this.gainNode.connect(e.destination), this.elementVolume && this.gainNode.gain.setTargetAtTime(this.elementVolume, 0, 0.1), e.state !== "running" && e.resume().then(() => {
      e.state !== "running" && this.emit(R.AudioPlaybackFailed, new Error("Audio Context couldn't be started automatically"));
    }).catch((r) => {
      this.emit(R.AudioPlaybackFailed, r);
    });
  }
  disconnectWebAudio() {
    var e, t;
    (e = this.gainNode) === null || e === void 0 || e.disconnect(), (t = this.sourceNode) === null || t === void 0 || t.disconnect(), this.gainNode = void 0, this.sourceNode = void 0;
  }
  getReceiverStats() {
    return m(this, void 0, void 0, function* () {
      if (!this.receiver || !this.receiver.getStats)
        return;
      const e = yield this.receiver.getStats();
      let t;
      return e.forEach((n) => {
        n.type === "inbound-rtp" && (t = {
          type: "audio",
          streamId: n.id,
          timestamp: n.timestamp,
          jitter: n.jitter,
          bytesReceived: n.bytesReceived,
          concealedSamples: n.concealedSamples,
          concealmentEvents: n.concealmentEvents,
          silentConcealedSamples: n.silentConcealedSamples,
          silentConcealmentEvents: n.silentConcealmentEvents,
          totalAudioEnergy: n.totalAudioEnergy,
          totalSamplesDuration: n.totalSamplesDuration
        });
      }), t;
    });
  }
}
class ot extends Ie.EventEmitter {
  constructor(e, t, n, r) {
    var s;
    super(), this.metadataMuted = !1, this.encryption = G.NONE, this.log = q, this.handleMuted = () => {
      this.emit(R.Muted);
    }, this.handleUnmuted = () => {
      this.emit(R.Unmuted);
    }, this.log = he((s = r == null ? void 0 : r.loggerName) !== null && s !== void 0 ? s : te.Publication), this.loggerContextCb = this.loggerContextCb, this.setMaxListeners(100), this.kind = e, this.trackSid = t, this.trackName = n, this.source = E.Source.Unknown;
  }
  /** @internal */
  setTrack(e) {
    this.track && (this.track.off(R.Muted, this.handleMuted), this.track.off(R.Unmuted, this.handleUnmuted)), this.track = e, e && (e.on(R.Muted, this.handleMuted), e.on(R.Unmuted, this.handleUnmuted));
  }
  get logContext() {
    var e;
    return Object.assign(Object.assign({}, (e = this.loggerContextCb) === null || e === void 0 ? void 0 : e.call(this)), j(this));
  }
  get isMuted() {
    return this.metadataMuted;
  }
  get isEnabled() {
    return !0;
  }
  get isSubscribed() {
    return this.track !== void 0;
  }
  get isEncrypted() {
    return this.encryption !== G.NONE;
  }
  /**
   * an [AudioTrack] if this publication holds an audio track
   */
  get audioTrack() {
    if (nt(this.track))
      return this.track;
  }
  /**
   * an [VideoTrack] if this publication holds a video track
   */
  get videoTrack() {
    if (ht(this.track))
      return this.track;
  }
  /** @internal */
  updateInfo(e) {
    this.trackSid = e.sid, this.trackName = e.name, this.source = E.sourceFromProto(e.source), this.mimeType = e.mimeType, this.kind === E.Kind.Video && e.width > 0 && (this.dimensions = {
      width: e.width,
      height: e.height
    }, this.simulcasted = e.simulcast), this.encryption = e.encryption, this.trackInfo = e, this.log.debug("update publication info", Object.assign(Object.assign({}, this.logContext), {
      info: e
    }));
  }
}
(function(i) {
  (function(e) {
    e.Desired = "desired", e.Subscribed = "subscribed", e.Unsubscribed = "unsubscribed";
  })(i.SubscriptionStatus || (i.SubscriptionStatus = {})), (function(e) {
    e.Allowed = "allowed", e.NotAllowed = "not_allowed";
  })(i.PermissionStatus || (i.PermissionStatus = {}));
})(ot || (ot = {}));
class ys extends ot {
  get isUpstreamPaused() {
    var e;
    return (e = this.track) === null || e === void 0 ? void 0 : e.isUpstreamPaused;
  }
  constructor(e, t, n, r) {
    super(e, t.sid, t.name, r), this.track = void 0, this.handleTrackEnded = () => {
      this.emit(R.Ended);
    }, this.handleCpuConstrained = () => {
      this.track && ht(this.track) && this.emit(R.CpuConstrained, this.track);
    }, this.updateInfo(t), this.setTrack(n);
  }
  setTrack(e) {
    this.track && (this.track.off(R.Ended, this.handleTrackEnded), this.track.off(R.CpuConstrained, this.handleCpuConstrained)), super.setTrack(e), e && (e.on(R.Ended, this.handleTrackEnded), e.on(R.CpuConstrained, this.handleCpuConstrained));
  }
  get isMuted() {
    return this.track ? this.track.isMuted : super.isMuted;
  }
  get audioTrack() {
    return super.audioTrack;
  }
  get videoTrack() {
    return super.videoTrack;
  }
  get isLocal() {
    return !0;
  }
  /**
   * Mute the track associated with this publication
   */
  mute() {
    return m(this, void 0, void 0, function* () {
      var e;
      return (e = this.track) === null || e === void 0 ? void 0 : e.mute();
    });
  }
  /**
   * Unmute track associated with this publication
   */
  unmute() {
    return m(this, void 0, void 0, function* () {
      var e;
      return (e = this.track) === null || e === void 0 ? void 0 : e.unmute();
    });
  }
  /**
   * Pauses the media stream track associated with this publication from being sent to the server
   * and signals "muted" event to other participants
   * Useful if you want to pause the stream without pausing the local media stream track
   */
  pauseUpstream() {
    return m(this, void 0, void 0, function* () {
      var e;
      yield (e = this.track) === null || e === void 0 ? void 0 : e.pauseUpstream();
    });
  }
  /**
   * Resumes sending the media stream track associated with this publication to the server after a call to [[pauseUpstream()]]
   * and signals "unmuted" event to other participants (unless the track is explicitly muted)
   */
  resumeUpstream() {
    return m(this, void 0, void 0, function* () {
      var e;
      yield (e = this.track) === null || e === void 0 ? void 0 : e.resumeUpstream();
    });
  }
  getTrackFeatures() {
    var e;
    if (nt(this.track)) {
      const t = this.track.getSourceTrackSettings(), n = /* @__PURE__ */ new Set();
      return t.autoGainControl && n.add(fe.TF_AUTO_GAIN_CONTROL), t.echoCancellation && n.add(fe.TF_ECHO_CANCELLATION), t.noiseSuppression && n.add(fe.TF_NOISE_SUPPRESSION), t.channelCount && t.channelCount > 1 && n.add(fe.TF_STEREO), !((e = this.options) === null || e === void 0) && e.dtx || n.add(fe.TF_NO_DTX), this.track.enhancedNoiseCancellation && n.add(fe.TF_ENHANCED_NOISE_CANCELLATION), Array.from(n.values());
    } else return [];
  }
}
function tr(i, e) {
  return m(this, void 0, void 0, function* () {
    i ?? (i = {});
    let t = !1;
    const n = Ed(i), r = n.audioProcessor, s = n.videoProcessor, a = n.optionsWithoutProcessor;
    let o = a.audio, c = a.video;
    if (r && typeof a.audio == "object" && (a.audio.processor = r), s && typeof a.video == "object" && (a.video.processor = s), i.audio && typeof a.audio == "object" && typeof a.audio.deviceId == "string") {
      const h = a.audio.deviceId;
      a.audio.deviceId = {
        exact: h
      }, t = !0, o = Object.assign(Object.assign({}, a.audio), {
        deviceId: {
          ideal: h
        }
      });
    }
    if (a.video && typeof a.video == "object" && typeof a.video.deviceId == "string") {
      const h = a.video.deviceId;
      a.video.deviceId = {
        exact: h
      }, t = !0, c = Object.assign(Object.assign({}, a.video), {
        deviceId: {
          ideal: h
        }
      });
    }
    a.audio === !0 ? a.audio = {
      deviceId: "default"
    } : typeof a.audio == "object" && a.audio !== null && (a.audio = Object.assign(Object.assign({}, a.audio), {
      deviceId: a.audio.deviceId || "default"
    })), a.video === !0 ? a.video = {
      deviceId: "default"
    } : typeof a.video == "object" && !a.video.deviceId && (a.video.deviceId = "default");
    const d = Td(a, jd, Vd), l = Vs(d), u = navigator.mediaDevices.getUserMedia(l);
    a.audio && (me.userMediaPromiseMap.set("audioinput", u), u.catch(() => me.userMediaPromiseMap.delete("audioinput"))), a.video && (me.userMediaPromiseMap.set("videoinput", u), u.catch(() => me.userMediaPromiseMap.delete("videoinput")));
    try {
      const h = yield u;
      return yield Promise.all(h.getTracks().map((f) => m(this, void 0, void 0, function* () {
        const g = f.kind === "audio";
        let p;
        const k = g ? l.audio : l.video;
        typeof k != "boolean" && (p = k);
        const T = f.getSettings().deviceId;
        p != null && p.deviceId && nn(p.deviceId) !== T ? p.deviceId = T : p || (p = {
          deviceId: T
        });
        const S = lp(f, p, e);
        return S.kind === E.Kind.Video ? S.source = E.Source.Camera : S.kind === E.Kind.Audio && (S.source = E.Source.Microphone), S.mediaStream = h, nt(S) && r ? yield S.setProcessor(r) : ht(S) && s && (yield S.setProcessor(s)), S;
      })));
    } catch (h) {
      if (!t)
        throw h;
      return tr(Object.assign(Object.assign({}, i), {
        audio: o,
        video: c
      }), e);
    }
  });
}
function eg(i) {
  return m(this, void 0, void 0, function* () {
    return (yield tr({
      audio: !1,
      video: i ?? !0
    }))[0];
  });
}
function tg(i) {
  return m(this, void 0, void 0, function* () {
    return (yield tr({
      audio: i ?? !0,
      video: !1
    }))[0];
  });
}
function Tv(i) {
  return m(this, void 0, void 0, function* () {
    if (i === void 0 && (i = {}), i.resolution === void 0 && !Pd() && (i.resolution = zi.h1080fps30.resolution), navigator.mediaDevices.getDisplayMedia === void 0)
      throw new Gi("getDisplayMedia not supported");
    const e = Cd(i), t = yield navigator.mediaDevices.getDisplayMedia(e), n = t.getVideoTracks();
    if (n.length === 0)
      throw new et("no video track found");
    const r = new Wn(n[0], void 0, !1);
    r.source = E.Source.ScreenShare;
    const s = [r];
    if (t.getAudioTracks().length > 0) {
      const a = new Vn(t.getAudioTracks()[0], void 0, !1);
      a.source = E.Source.ScreenShareAudio, s.push(a);
    }
    return s;
  });
}
var gt;
(function(i) {
  i.Excellent = "excellent", i.Good = "good", i.Poor = "poor", i.Lost = "lost", i.Unknown = "unknown";
})(gt || (gt = {}));
function ng(i) {
  switch (i) {
    case zt.EXCELLENT:
      return gt.Excellent;
    case zt.GOOD:
      return gt.Good;
    case zt.POOR:
      return gt.Poor;
    case zt.LOST:
      return gt.Lost;
    default:
      return gt.Unknown;
  }
}
class ul extends Ie.EventEmitter {
  get logContext() {
    var e, t;
    return Object.assign({}, (t = (e = this.loggerOptions) === null || e === void 0 ? void 0 : e.loggerContextCb) === null || t === void 0 ? void 0 : t.call(e));
  }
  get isEncrypted() {
    return this.trackPublications.size > 0 && Array.from(this.trackPublications.values()).every((e) => e.isEncrypted);
  }
  get isAgent() {
    var e;
    return ((e = this.permissions) === null || e === void 0 ? void 0 : e.agent) || this.kind === Dn.AGENT;
  }
  get isActive() {
    var e;
    return ((e = this.participantInfo) === null || e === void 0 ? void 0 : e.state) === Yt.ACTIVE;
  }
  get kind() {
    return this._kind;
  }
  /** participant attributes, similar to metadata, but as a key/value map */
  get attributes() {
    return Object.freeze(Object.assign({}, this._attributes));
  }
  /** @internal */
  constructor(e, t, n, r, s, a) {
    let o = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : Dn.STANDARD;
    var c;
    super(), this.audioLevel = 0, this.isSpeaking = !1, this._connectionQuality = gt.Unknown, this.log = q, this.loggerOptions = a, this.log = he((c = a == null ? void 0 : a.loggerName) !== null && c !== void 0 ? c : te.Participant, () => this.logContext), this.setMaxListeners(100), this.sid = e, this.identity = t, this.name = n, this.metadata = r, this.audioTrackPublications = /* @__PURE__ */ new Map(), this.videoTrackPublications = /* @__PURE__ */ new Map(), this.trackPublications = /* @__PURE__ */ new Map(), this._kind = o, this._attributes = s ?? {};
  }
  getTrackPublications() {
    return Array.from(this.trackPublications.values());
  }
  /**
   * Finds the first track that matches the source filter, for example, getting
   * the user's camera track with getTrackBySource(Track.Source.Camera).
   */
  getTrackPublication(e) {
    for (const n of this.trackPublications) {
      var t = L(n, 2);
      const r = t[1];
      if (r.source === e)
        return r;
    }
  }
  /**
   * Finds the first track that matches the track's name.
   */
  getTrackPublicationByName(e) {
    for (const n of this.trackPublications) {
      var t = L(n, 2);
      const r = t[1];
      if (r.trackName === e)
        return r;
    }
  }
  /**
   * Waits until the participant is active and ready to receive data messages
   * @returns a promise that resolves when the participant is active
   */
  waitUntilActive() {
    return this.isActive ? Promise.resolve() : this.activeFuture ? this.activeFuture.promise : (this.activeFuture = new ve(), this.once(O.Active, () => {
      var e, t;
      (t = (e = this.activeFuture) === null || e === void 0 ? void 0 : e.resolve) === null || t === void 0 || t.call(e), this.activeFuture = void 0;
    }), this.activeFuture.promise);
  }
  get connectionQuality() {
    return this._connectionQuality;
  }
  get isCameraEnabled() {
    var e;
    const t = this.getTrackPublication(E.Source.Camera);
    return !(!((e = t == null ? void 0 : t.isMuted) !== null && e !== void 0) || e);
  }
  get isMicrophoneEnabled() {
    var e;
    const t = this.getTrackPublication(E.Source.Microphone);
    return !(!((e = t == null ? void 0 : t.isMuted) !== null && e !== void 0) || e);
  }
  get isScreenShareEnabled() {
    return !!this.getTrackPublication(E.Source.ScreenShare);
  }
  get isLocal() {
    return !1;
  }
  /** when participant joined the room */
  get joinedAt() {
    return this.participantInfo ? new Date(Number.parseInt(this.participantInfo.joinedAt.toString()) * 1e3) : /* @__PURE__ */ new Date();
  }
  /** @internal */
  updateInfo(e) {
    var t;
    return this.participantInfo && this.participantInfo.sid === e.sid && this.participantInfo.version > e.version ? !1 : (this.identity = e.identity, this.sid = e.sid, this._setName(e.name), this._setMetadata(e.metadata), this._setAttributes(e.attributes), e.state === Yt.ACTIVE && ((t = this.participantInfo) === null || t === void 0 ? void 0 : t.state) !== Yt.ACTIVE && this.emit(O.Active), e.permission && this.setPermissions(e.permission), this.participantInfo = e, !0);
  }
  /**
   * Updates metadata from server
   **/
  _setMetadata(e) {
    const t = this.metadata !== e, n = this.metadata;
    this.metadata = e, t && this.emit(O.ParticipantMetadataChanged, n);
  }
  _setName(e) {
    const t = this.name !== e;
    this.name = e, t && this.emit(O.ParticipantNameChanged, e);
  }
  /**
   * Updates metadata from server
   **/
  _setAttributes(e) {
    const t = vf(this.attributes, e);
    this._attributes = e, Object.keys(t).length > 0 && this.emit(O.AttributesChanged, t);
  }
  /** @internal */
  setPermissions(e) {
    var t, n, r, s, a, o;
    const c = this.permissions, d = e.canPublish !== ((t = this.permissions) === null || t === void 0 ? void 0 : t.canPublish) || e.canSubscribe !== ((n = this.permissions) === null || n === void 0 ? void 0 : n.canSubscribe) || e.canPublishData !== ((r = this.permissions) === null || r === void 0 ? void 0 : r.canPublishData) || e.hidden !== ((s = this.permissions) === null || s === void 0 ? void 0 : s.hidden) || e.recorder !== ((a = this.permissions) === null || a === void 0 ? void 0 : a.recorder) || e.canPublishSources.length !== this.permissions.canPublishSources.length || e.canPublishSources.some((l, u) => {
      var h;
      return l !== ((h = this.permissions) === null || h === void 0 ? void 0 : h.canPublishSources[u]);
    }) || e.canSubscribeMetrics !== ((o = this.permissions) === null || o === void 0 ? void 0 : o.canSubscribeMetrics);
    return this.permissions = e, d && this.emit(O.ParticipantPermissionsChanged, c), d;
  }
  /** @internal */
  setIsSpeaking(e) {
    e !== this.isSpeaking && (this.isSpeaking = e, e && (this.lastSpokeAt = /* @__PURE__ */ new Date()), this.emit(O.IsSpeakingChanged, e));
  }
  /** @internal */
  setConnectionQuality(e) {
    const t = this._connectionQuality;
    this._connectionQuality = ng(e), t !== this._connectionQuality && this.emit(O.ConnectionQualityChanged, this._connectionQuality);
  }
  /**
   * @internal
   */
  setDisconnected() {
    var e, t;
    this.activeFuture && ((t = (e = this.activeFuture).reject) === null || t === void 0 || t.call(e, new Error("Participant disconnected")), this.activeFuture = void 0);
  }
  /**
   * @internal
   */
  setAudioContext(e) {
    this.audioContext = e, this.audioTrackPublications.forEach((t) => nt(t.track) && t.track.setAudioContext(e));
  }
  addTrackPublication(e) {
    this.log.debug("adding track publication", {
      trackSid: e.trackSid,
      source: e.source,
      kind: e.kind
    }), e.on(R.Muted, () => {
      this.emit(O.TrackMuted, e);
    }), e.on(R.Unmuted, () => {
      this.emit(O.TrackUnmuted, e);
    });
    const t = e;
    switch (t.track && (t.track.sid = e.trackSid), this.trackPublications.set(e.trackSid, e), e.kind) {
      case E.Kind.Audio:
        this.audioTrackPublications.set(e.trackSid, e);
        break;
      case E.Kind.Video:
        this.videoTrackPublications.set(e.trackSid, e);
        break;
    }
  }
}
function ig(i) {
  var e, t, n;
  if (!i.participantSid && !i.participantIdentity)
    throw new Error("Invalid track permission, must provide at least one of participantIdentity and participantSid");
  return new Mc({
    participantIdentity: (e = i.participantIdentity) !== null && e !== void 0 ? e : "",
    participantSid: (t = i.participantSid) !== null && t !== void 0 ? t : "",
    allTracks: (n = i.allowAll) !== null && n !== void 0 ? n : !1,
    trackSids: i.allowedTrackSids || []
  });
}
class rg extends ul {
  /** @internal */
  constructor(e, t, n, r, s, a, o, c) {
    super(e, t, void 0, void 0, void 0, {
      loggerName: r.loggerName,
      loggerContextCb: () => this.engine.logContext
    }), this.pendingPublishing = /* @__PURE__ */ new Set(), this.pendingPublishPromises = /* @__PURE__ */ new Map(), this.participantTrackPermissions = [], this.allParticipantsAllowedToSubscribe = !0, this.encryptionType = G.NONE, this.e2eeStateMutex = new ue(), this.enabledPublishVideoCodecs = [], this.handleReconnecting = () => {
      this.reconnectFuture || (this.reconnectFuture = new ve());
    }, this.handleReconnected = () => {
      var d, l;
      (l = (d = this.reconnectFuture) === null || d === void 0 ? void 0 : d.resolve) === null || l === void 0 || l.call(d), this.reconnectFuture = void 0, this.updateTrackSubscriptionPermissions();
    }, this.handleClosing = () => {
      var d, l, u, h, f, g;
      this.reconnectFuture && (this.reconnectFuture.promise.catch((p) => this.log.warn(p.message)), (l = (d = this.reconnectFuture) === null || d === void 0 ? void 0 : d.reject) === null || l === void 0 || l.call(d, new Error("Got disconnected during reconnection attempt")), this.reconnectFuture = void 0), this.signalConnectedFuture && ((h = (u = this.signalConnectedFuture).reject) === null || h === void 0 || h.call(u, new Error("Got disconnected without signal connected")), this.signalConnectedFuture = void 0), (g = (f = this.activeAgentFuture) === null || f === void 0 ? void 0 : f.reject) === null || g === void 0 || g.call(f, new Error("Got disconnected without active agent present")), this.activeAgentFuture = void 0, this.firstActiveAgent = void 0;
    }, this.handleSignalConnected = (d) => {
      var l, u;
      d.participant && this.updateInfo(d.participant), this.signalConnectedFuture || (this.signalConnectedFuture = new ve()), (u = (l = this.signalConnectedFuture).resolve) === null || u === void 0 || u.call(l);
    }, this.handleSignalRequestResponse = (d) => {
      const l = d.requestId, u = d.reason, h = d.message, f = this.pendingSignalRequests.get(l);
      switch (f && (u !== Ot.OK && f.reject(new Na(h, u)), this.pendingSignalRequests.delete(l)), d.request.case) {
        case "publishDataTrack": {
          let g;
          switch (d.reason) {
            case Ot.NOT_ALLOWED:
              g = le.notAllowed(d.message);
              break;
            case Ot.DUPLICATE_NAME:
              g = le.duplicateName(d.message);
              break;
            case Ot.INVALID_NAME:
              g = le.invalidName(d.message);
              break;
            case Ot.LIMIT_EXCEEDED:
              g = le.limitReached(d.message);
              break;
            default:
              g = le.unknown(d.reason, d.message);
              break;
          }
          this.roomOutgoingDataTrackManager.receivedSfuPublishResponse(d.request.value.pubHandle, {
            type: "error",
            error: g
          });
          break;
        }
      }
    }, this.updateTrackSubscriptionPermissions = () => {
      this.log.debug("updating track subscription permissions", {
        allParticipantsAllowed: this.allParticipantsAllowedToSubscribe,
        participantTrackPermissions: this.participantTrackPermissions
      }), this.engine.client.sendUpdateSubscriptionPermissions(this.allParticipantsAllowedToSubscribe, this.participantTrackPermissions.map((d) => ig(d)));
    }, this.onTrackUnmuted = (d) => {
      this.onTrackMuted(d, d.isUpstreamPaused);
    }, this.onTrackMuted = (d, l) => {
      if (l === void 0 && (l = !0), !d.sid) {
        this.log.error("could not update mute status for unpublished track", j(d));
        return;
      }
      this.engine.updateMuteStatus(d.sid, l);
    }, this.onTrackUpstreamPaused = (d) => {
      this.log.debug("upstream paused", j(d)), this.onTrackMuted(d, !0);
    }, this.onTrackUpstreamResumed = (d) => {
      this.log.debug("upstream resumed", j(d)), this.onTrackMuted(d, d.isMuted);
    }, this.onTrackFeatureUpdate = (d) => {
      const l = this.audioTrackPublications.get(d.sid);
      if (!l) {
        this.log.warn("Could not update local audio track settings, missing publication for track ".concat(d.sid));
        return;
      }
      this.engine.client.sendUpdateLocalAudioTrack(l.trackSid, l.getTrackFeatures());
    }, this.onTrackCpuConstrained = (d, l) => {
      this.log.debug("track cpu constrained", j(l)), this.emit(O.LocalTrackCpuConstrained, d, l);
    }, this.handleSubscribedQualityUpdate = (d) => m(this, void 0, void 0, function* () {
      var l, u, h, f, g;
      if (!(!((g = this.roomOptions) === null || g === void 0) && g.dynacast))
        return;
      const p = this.videoTrackPublications.get(d.trackSid);
      if (!p) {
        this.log.warn("received subscribed quality update for unknown track", {
          trackSid: d.trackSid
        });
        return;
      }
      if (!p.videoTrack)
        return;
      const k = yield p.videoTrack.setPublishingCodecs(d.subscribedCodecs);
      try {
        for (var T = !0, S = Ne(k), I; I = yield S.next(), l = I.done, !l; T = !0) {
          f = I.value, T = !1;
          const b = f;
          ff(b) && (this.log.debug("publish ".concat(b, " for ").concat(p.videoTrack.sid), j(p)), yield this.publishAdditionalCodecForTrack(p.videoTrack, b, p.options));
        }
      } catch (b) {
        u = {
          error: b
        };
      } finally {
        try {
          !T && !l && (h = S.return) && (yield h.call(S));
        } finally {
          if (u) throw u.error;
        }
      }
    }), this.handleLocalTrackUnpublished = (d) => {
      const l = this.trackPublications.get(d.trackSid);
      if (!l) {
        this.log.warn("received unpublished event for unknown track", {
          trackSid: d.trackSid
        });
        return;
      }
      this.unpublishTrack(l.track);
    }, this.handleTrackEnded = (d) => m(this, void 0, void 0, function* () {
      if (d.source === E.Source.ScreenShare || d.source === E.Source.ScreenShareAudio)
        this.log.debug("unpublishing local track due to TrackEnded", j(d)), this.unpublishTrack(d);
      else if (d.isUserProvided)
        yield d.mute();
      else if (st(d) || $e(d))
        try {
          if (Re())
            try {
              const l = yield navigator == null ? void 0 : navigator.permissions.query({
                // the permission query for camera and microphone currently not supported in Safari and Firefox
                // @ts-ignore
                name: d.source === E.Source.Camera ? "camera" : "microphone"
              });
              if (l && l.state === "denied")
                throw this.log.warn("user has revoked access to ".concat(d.source), j(d)), l.onchange = () => {
                  l.state !== "denied" && (d.isMuted || d.restartTrack(), l.onchange = null);
                }, new Error("GetUserMedia Permission denied");
            } catch {
            }
          d.isMuted || (this.log.debug("track ended, attempting to use a different device", j(d)), st(d) ? yield d.restartTrack({
            deviceId: "default"
          }) : yield d.restartTrack());
        } catch {
          this.log.warn("could not restart track, muting instead", j(d)), yield d.mute();
        }
    }), this.audioTrackPublications = /* @__PURE__ */ new Map(), this.videoTrackPublications = /* @__PURE__ */ new Map(), this.trackPublications = /* @__PURE__ */ new Map(), this.engine = n, this.roomOptions = r, this.setupEngine(n), this.activeDeviceMap = /* @__PURE__ */ new Map([["audioinput", "default"], ["videoinput", "default"], ["audiooutput", "default"]]), this.pendingSignalRequests = /* @__PURE__ */ new Map(), this.roomOutgoingDataStreamManager = s, this.roomOutgoingDataTrackManager = a, this.rpcClientManager = o, this.rpcServerManager = c;
  }
  get lastCameraError() {
    return this.cameraError;
  }
  get lastMicrophoneError() {
    return this.microphoneError;
  }
  get isE2EEEnabled() {
    return this.encryptionType !== G.NONE;
  }
  getTrackPublication(e) {
    const t = super.getTrackPublication(e);
    if (t)
      return t;
  }
  getTrackPublicationByName(e) {
    const t = super.getTrackPublicationByName(e);
    if (t)
      return t;
  }
  /**
   * @internal
   */
  setupEngine(e) {
    var t;
    this.engine = e, this.engine.on(P.RemoteMute, (n, r) => {
      const s = this.trackPublications.get(n);
      !s || !s.track || (r ? s.mute() : s.unmute());
    }), !((t = this.signalConnectedFuture) === null || t === void 0) && t.isResolved && (this.signalConnectedFuture = void 0), this.engine.on(P.Connected, this.handleReconnected).on(P.SignalConnected, this.handleSignalConnected).on(P.SignalRestarted, this.handleReconnected).on(P.SignalResumed, this.handleReconnected).on(P.Restarting, this.handleReconnecting).on(P.Resuming, this.handleReconnecting).on(P.LocalTrackUnpublished, this.handleLocalTrackUnpublished).on(P.SubscribedQualityUpdate, this.handleSubscribedQualityUpdate).on(P.Closing, this.handleClosing).on(P.SignalRequestResponse, this.handleSignalRequestResponse);
  }
  /**
   * Sets and updates the metadata of the local participant.
   * Note: this requires `canUpdateOwnMetadata` permission.
   * method will throw if the user doesn't have the required permissions
   * @param metadata
   */
  setMetadata(e) {
    return m(this, void 0, void 0, function* () {
      yield this.requestMetadataUpdate({
        metadata: e
      });
    });
  }
  /**
   * Sets and updates the name of the local participant.
   * Note: this requires `canUpdateOwnMetadata` permission.
   * method will throw if the user doesn't have the required permissions
   * @param metadata
   */
  setName(e) {
    return m(this, void 0, void 0, function* () {
      yield this.requestMetadataUpdate({
        name: e
      });
    });
  }
  /**
   * Set or update participant attributes. It will make updates only to keys that
   * are present in `attributes`, and will not override others.
   * Note: this requires `canUpdateOwnMetadata` permission.
   * @param attributes attributes to update
   */
  setAttributes(e) {
    return m(this, void 0, void 0, function* () {
      yield this.requestMetadataUpdate({
        attributes: e
      });
    });
  }
  requestMetadataUpdate(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = t.metadata, s = t.name, a = t.attributes;
      return (function* () {
        return new Ee((o, c) => m(n, void 0, void 0, function* () {
          var d, l;
          try {
            let u = !1;
            const h = yield this.engine.client.sendUpdateLocalMetadata((d = r ?? this.metadata) !== null && d !== void 0 ? d : "", (l = s ?? this.name) !== null && l !== void 0 ? l : "", a), f = performance.now();
            for (this.pendingSignalRequests.set(h, {
              resolve: o,
              reject: (g) => {
                c(g), u = !0;
              },
              values: {
                name: s,
                metadata: r,
                attributes: a
              }
            }); performance.now() - f < 5e3 && !u; ) {
              if ((!s || this.name === s) && (!r || this.metadata === r) && (!a || Object.entries(a).every((g) => {
                let p = L(g, 2), k = p[0], T = p[1];
                return this.attributes[k] === T || T === "" && !this.attributes[k];
              }))) {
                this.pendingSignalRequests.delete(h), o();
                return;
              }
              yield ke(50);
            }
            c(new Na("Request to update local metadata timed out", "TimeoutError"));
          } catch (u) {
            u instanceof Error ? c(u) : c(new Error(String(u)));
          }
        }));
      })();
    });
  }
  /**
   * Enable or disable a participant's camera track.
   *
   * If a track has already published, it'll mute or unmute the track.
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */
  setCameraEnabled(e, t, n) {
    return this.setTrackEnabled(E.Source.Camera, e, t, n);
  }
  /**
   * Enable or disable a participant's microphone track.
   *
   * If a track has already published, it'll mute or unmute the track.
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */
  setMicrophoneEnabled(e, t, n) {
    return this.setTrackEnabled(E.Source.Microphone, e, t, n);
  }
  /**
   * Start or stop sharing a participant's screen
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */
  setScreenShareEnabled(e, t, n) {
    return this.setTrackEnabled(E.Source.ScreenShare, e, t, n);
  }
  /** @internal */
  setE2EEEnabled(e) {
    return m(this, void 0, void 0, function* () {
      const t = yield this.e2eeStateMutex.lock();
      try {
        if (this.encryptionType = e ? G.GCM : G.NONE, yield Promise.all(this.pendingPublishPromises.values()), this.trackPublications.size === 0 || Array.from(this.trackPublications.values()).every((n) => n.isEncrypted === e))
          return;
        yield this.republishAllTracks(void 0, !1);
      } finally {
        t();
      }
    });
  }
  setTrackEnabled(e, t, n, r) {
    return m(this, void 0, void 0, function* () {
      var s, a;
      this.log.debug("setTrackEnabled", {
        source: e,
        enabled: t
      }), this.republishPromise && (yield this.republishPromise);
      let o = this.getTrackPublication(e);
      if (t)
        if (o)
          yield o.unmute();
        else {
          let u;
          if (this.pendingPublishing.has(e)) {
            const h = yield this.waitForPendingPublicationOfSource(e);
            return h || this.log.info("waiting for pending publication promise timed out", {
              source: e
            }), yield h == null ? void 0 : h.unmute(), h;
          }
          this.pendingPublishing.add(e);
          try {
            switch (e) {
              case E.Source.Camera:
                u = yield this.createTracks({
                  video: (s = n) !== null && s !== void 0 ? s : !0
                });
                break;
              case E.Source.Microphone:
                u = yield this.createTracks({
                  audio: (a = n) !== null && a !== void 0 ? a : !0
                });
                break;
              case E.Source.ScreenShare:
                u = yield this.createScreenTracks(Object.assign({}, n));
                break;
              default:
                throw new et(e);
            }
          } catch (h) {
            throw u == null || u.forEach((f) => {
              f.stop();
            }), h instanceof Error && this.emit(O.MediaDevicesError, h, cs(e)), this.pendingPublishing.delete(e), h;
          }
          for (const h of u) {
            const f = Object.assign(Object.assign({}, this.roomOptions.publishDefaults), n);
            e === E.Source.Microphone && nt(h) && f.preConnectBuffer && (this.log.info("starting preconnect buffer for microphone"), h.startPreConnectBuffer());
          }
          try {
            const h = [];
            for (const g of u)
              this.log.info("publishing track", j(g)), h.push(this.publishTrack(g, r));
            const f = yield Promise.all(h);
            var c = L(f, 1);
            o = c[0];
          } catch (h) {
            throw u == null || u.forEach((f) => {
              f.stop();
            }), h;
          } finally {
            this.pendingPublishing.delete(e);
          }
        }
      else if (!(o != null && o.track) && this.pendingPublishing.has(e) && (o = yield this.waitForPendingPublicationOfSource(e), o || this.log.info("waiting for pending publication promise timed out", {
        source: e
      })), o && o.track)
        if (e === E.Source.ScreenShare) {
          const u = [this.unpublishTrack(o.track)], h = this.getTrackPublication(E.Source.ScreenShareAudio);
          h && h.track && u.push(this.unpublishTrack(h.track));
          var d = yield Promise.all(u), l = L(d, 1);
          o = l[0];
        } else
          yield o.mute();
      return o;
    });
  }
  /**
   * Publish both camera and microphone at the same time. This is useful for
   * displaying a single Permission Dialog box to the end user.
   */
  enableCameraAndMicrophone() {
    return m(this, void 0, void 0, function* () {
      if (!(this.pendingPublishing.has(E.Source.Camera) || this.pendingPublishing.has(E.Source.Microphone))) {
        this.pendingPublishing.add(E.Source.Camera), this.pendingPublishing.add(E.Source.Microphone);
        try {
          const e = yield this.createTracks({
            audio: !0,
            video: !0
          });
          yield Promise.all(e.map((t) => this.publishTrack(t)));
        } finally {
          this.pendingPublishing.delete(E.Source.Camera), this.pendingPublishing.delete(E.Source.Microphone);
        }
      }
    });
  }
  /**
   * Create local camera and/or microphone tracks
   * @param options
   * @returns
   */
  createTracks(e) {
    return m(this, void 0, void 0, function* () {
      var t, n;
      e ?? (e = {});
      const r = Td(e, (t = this.roomOptions) === null || t === void 0 ? void 0 : t.audioCaptureDefaults, (n = this.roomOptions) === null || n === void 0 ? void 0 : n.videoCaptureDefaults);
      try {
        return (yield tr(r, {
          loggerName: this.roomOptions.loggerName,
          loggerContextCb: () => this.logContext
        })).map((o) => (nt(o) && (this.microphoneError = void 0, o.setAudioContext(this.audioContext), o.source = E.Source.Microphone, this.emit(O.AudioStreamAcquired)), ht(o) && (this.cameraError = void 0, o.source = E.Source.Camera), o));
      } catch (s) {
        throw s instanceof Error && (e.audio && (this.microphoneError = s), e.video && (this.cameraError = s)), s;
      }
    });
  }
  /**
   * Creates a screen capture tracks with getDisplayMedia().
   * A LocalVideoTrack is always created and returned.
   * If { audio: true }, and the browser supports audio capture, a LocalAudioTrack is also created.
   */
  createScreenTracks(e) {
    return m(this, void 0, void 0, function* () {
      if (e === void 0 && (e = {}), navigator.mediaDevices.getDisplayMedia === void 0)
        throw new Gi("getDisplayMedia not supported");
      e.resolution === void 0 && !Pd() && (e.resolution = zi.h1080fps30.resolution);
      const t = Cd(e), n = yield navigator.mediaDevices.getDisplayMedia(t), r = n.getVideoTracks();
      if (r.length === 0)
        throw new et("no video track found");
      const s = new Wn(r[0], void 0, !1, {
        loggerName: this.roomOptions.loggerName,
        loggerContextCb: () => this.logContext
      });
      s.source = E.Source.ScreenShare, e.contentHint && (s.mediaStreamTrack.contentHint = e.contentHint);
      const a = [s];
      if (n.getAudioTracks().length > 0) {
        this.emit(O.AudioStreamAcquired);
        const o = new Vn(n.getAudioTracks()[0], void 0, !1, this.audioContext, {
          loggerName: this.roomOptions.loggerName,
          loggerContextCb: () => this.logContext
        });
        o.source = E.Source.ScreenShareAudio, a.push(o);
      }
      return a;
    });
  }
  /**
   * Publish a new track to the room
   * @param track
   * @param options
   */
  publishTrack(e, t) {
    return m(this, void 0, void 0, function* () {
      return this.publishOrRepublishTrack(e, t);
    });
  }
  /**
   * Waits for the engine's next `Restarted` event. Unlike `engine.waitForRestarted`, this does
   * not short-circuit when `pcState === Connected` — at the point this is called (right after a
   * `NegotiationError`) the PC transport is still connected, but `fullReconnectOnNext` has been
   * set and `attemptReconnect` is queued via setTimeout. We need to wait for that restart to
   * actually complete (which clears `pendingTrackResolvers` via `cleanupClient`) before retrying.
   */
  waitForNextEngineRestart() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 15e3;
    return new Promise((t, n) => {
      const r = () => {
        clearTimeout(o), this.engine.off(P.Restarted, s), this.engine.off(P.Closing, a);
      }, s = () => {
        r(), t();
      }, a = () => {
        r(), n(new Error("engine closed before restart completed"));
      }, o = setTimeout(() => {
        r(), n(new Error("timed out waiting for engine restart"));
      }, e);
      this.engine.once(P.Restarted, s), this.engine.once(P.Closing, a);
    });
  }
  publishOrRepublishTrack(e, t) {
    return m(this, arguments, void 0, function(n, r) {
      var s = this;
      let a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1, o = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : !1;
      return (function* () {
        var c, d, l, u;
        st(n) && n.setAudioContext(s.audioContext), yield (c = s.reconnectFuture) === null || c === void 0 ? void 0 : c.promise, s.republishPromise && !a && (yield s.republishPromise), Ft(n) && s.pendingPublishPromises.has(n) && (yield s.pendingPublishPromises.get(n));
        let h;
        if (n instanceof MediaStreamTrack)
          h = n.getConstraints();
        else {
          h = n.constraints;
          let S;
          switch (n.source) {
            case E.Source.Microphone:
              S = "audioinput";
              break;
            case E.Source.Camera:
              S = "videoinput";
          }
          S && s.activeDeviceMap.has(S) && (h = Object.assign(Object.assign({}, h), {
            deviceId: s.activeDeviceMap.get(S)
          }));
        }
        if (n instanceof MediaStreamTrack)
          switch (n.kind) {
            case "audio":
              n = new Vn(n, h, !0, s.audioContext, {
                loggerName: s.roomOptions.loggerName,
                loggerContextCb: () => s.logContext
              });
              break;
            case "video":
              n = new Wn(n, h, !0, {
                loggerName: s.roomOptions.loggerName,
                loggerContextCb: () => s.logContext
              });
              break;
            default:
              throw new et("unsupported MediaStreamTrack kind ".concat(n.kind));
          }
        else
          n.updateLoggerOptions({
            loggerName: s.roomOptions.loggerName,
            loggerContextCb: () => s.logContext
          });
        let f;
        if (s.trackPublications.forEach((S) => {
          S.track && S.track === n && (f = S);
        }), f)
          return s.log.warn("track has already been published, skipping", j(f)), f;
        const g = Object.assign(Object.assign({}, s.roomOptions.publishDefaults), r), p = "channelCount" in n.mediaStreamTrack.getSettings() && // @ts-ignore `channelCount` on getSettings() is currently only available for Safari, but is generally the best way to determine a stereo track https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/channelCount
        n.mediaStreamTrack.getSettings().channelCount === 2 || n.mediaStreamTrack.getConstraints().channelCount === 2, k = (d = g.forceStereo) !== null && d !== void 0 ? d : p;
        k && (g.dtx === void 0 && s.log.debug("Opus DTX will be disabled for stereo tracks by default. Enable them explicitly to make it work.", j(n)), g.red === void 0 && s.log.debug("Opus RED will be disabled for stereo tracks by default. Enable them explicitly to make it work."), (l = g.dtx) !== null && l !== void 0 || (g.dtx = !1), (u = g.red) !== null && u !== void 0 || (g.red = !1)), !Mf() && s.roomOptions.e2ee && (s.log.info("End-to-end encryption is set up, simulcast publishing will be disabled on Safari versions and iOS browsers running iOS < v17.2"), g.simulcast = !1), g.source && (n.source = g.source);
        const T = new Promise((S, I) => m(s, void 0, void 0, function* () {
          try {
            if (this.engine.client.currentState !== Se.CONNECTED) {
              this.log.debug("deferring track publication until signal is connected", {
                track: j(n)
              });
              let b = !1;
              const y = setTimeout(() => {
                b = !0, n.stop(), I(new xa("publishing rejected as engine not connected within timeout", 408));
              }, 15e3);
              if (yield this.waitUntilEngineConnected(), clearTimeout(y), b)
                return;
              const C = yield this.publish(n, g, k);
              S(C);
            } else
              try {
                const b = yield this.publish(n, g, k);
                S(b);
              } catch (b) {
                I(b);
              }
          } catch (b) {
            I(b);
          }
        }));
        s.pendingPublishPromises.set(n, T);
        try {
          return yield T;
        } catch (S) {
          if (!o && S instanceof St)
            return s.log.warn("negotiation due to track publish failed, retrying after reconnect", {
              error: S
            }), s.pendingPublishPromises.delete(n), yield s.waitForNextEngineRestart(), yield s.publishOrRepublishTrack(n, r, a, !0);
          throw S;
        } finally {
          s.pendingPublishPromises.delete(n);
        }
      })();
    });
  }
  waitUntilEngineConnected() {
    return this.signalConnectedFuture || (this.signalConnectedFuture = new ve()), this.signalConnectedFuture.promise;
  }
  hasPermissionsToPublish(e) {
    if (!this.permissions)
      return this.log.warn("no permissions present for publishing track", j(e)), !1;
    const t = this.permissions, n = t.canPublish, r = t.canPublishSources;
    return n && (r.length === 0 || r.map((s) => bf(s)).includes(e.source)) ? !0 : (this.log.warn("insufficient permissions to publish", j(e)), !1);
  }
  publish(e, t, n) {
    return m(this, void 0, void 0, function* () {
      var r, s, a, o, c, d, l, u, h, f, g;
      if (!this.hasPermissionsToPublish(e))
        throw new xa("failed to publish track, insufficient permissions", 403);
      Array.from(this.trackPublications.values()).find((D) => Ft(e) && D.source === e.source) && e.source !== E.Source.Unknown && this.log.info("publishing a second track with the same source: ".concat(e.source), j(e)), t.stopMicTrackOnMute && nt(e) && (e.stopOnMute = !0), e.source === E.Source.ScreenShare && jt() && (t.simulcast = !1), t.videoCodec === "av1" && !Sf() && (t.videoCodec = void 0), t.videoCodec === "vp9" && !Cf() && (t.videoCodec = void 0), t.videoCodec === void 0 && (t.videoCodec = gs), this.enabledPublishVideoCodecs.length > 0 && (this.enabledPublishVideoCodecs.some((D) => t.videoCodec === wn(D.mime)) || (t.videoCodec = wn(this.enabledPublishVideoCodecs[0].mime)));
      const k = t.videoCodec;
      e.on(R.Muted, this.onTrackMuted), e.on(R.Unmuted, this.onTrackUnmuted), e.on(R.Ended, this.handleTrackEnded), e.on(R.UpstreamPaused, this.onTrackUpstreamPaused), e.on(R.UpstreamResumed, this.onTrackUpstreamResumed), e.on(R.AudioTrackFeatureUpdate, this.onTrackFeatureUpdate);
      const T = [], S = !(!((r = t.dtx) !== null && r !== void 0) || r), I = e.getSourceTrackSettings();
      I.autoGainControl && T.push(fe.TF_AUTO_GAIN_CONTROL), I.echoCancellation && T.push(fe.TF_ECHO_CANCELLATION), I.noiseSuppression && T.push(fe.TF_NOISE_SUPPRESSION), I.channelCount && I.channelCount > 1 && T.push(fe.TF_STEREO), S && T.push(fe.TF_NO_DTX), st(e) && e.hasPreConnectBuffer && T.push(fe.TF_PRECONNECT_BUFFER);
      const b = this.normalizeRequestedFrameMetadataOptions(e, t), y = new xn({
        // get local track id for use during publishing
        cid: e.mediaStreamTrack.id,
        name: t.name,
        type: E.kindToProto(e.kind),
        muted: e.isMuted,
        source: E.sourceToProto(e.source),
        disableDtx: S,
        encryption: this.encryptionType,
        stereo: n,
        disableRed: this.isE2EEEnabled || !(!((s = t.red) !== null && s !== void 0) || s),
        stream: t == null ? void 0 : t.stream,
        backupCodecPolicy: t == null ? void 0 : t.backupCodecPolicy,
        audioFeatures: T,
        packetTrailerFeatures: b
      });
      let C;
      if (e.kind === E.Kind.Video) {
        let D;
        try {
          D = yield e.waitForDimensions();
        } catch {
          const H = (o = (a = this.roomOptions.videoCaptureDefaults) === null || a === void 0 ? void 0 : a.resolution) !== null && o !== void 0 ? o : Un.h720.resolution;
          D = {
            width: H.width,
            height: H.height
          }, this.log.error("could not determine track dimensions, using defaults", Object.assign(Object.assign({}, j(e)), {
            dims: D
          }));
        }
        if (y.width = D.width, y.height = D.height, $e(e)) {
          tn(k, t) && (_d() || !_f((c = this.engine) === null || c === void 0 ? void 0 : c.serverVersion)) && (t.simulcast = !1, this.log.info("SVC simulcast is not supported, disabling simulcast.", j(e)));
          const U = tn(k, t);
          Pt(k) && !U && (e.source === E.Source.ScreenShare && (t.scalabilityMode = "L1T3", "contentHint" in e.mediaStreamTrack && (e.mediaStreamTrack.contentHint = "motion", this.log.debug("forcing contentHint to motion for screenshare with SVC codecs", j(e)))), t.scalabilityMode = (d = t.scalabilityMode) !== null && d !== void 0 ? d : "L3T3_KEY");
          const H = new Gr({
            codec: k,
            cid: e.mediaStreamTrack.id
          });
          U && (H.videoLayerMode = _s.ONE_SPATIAL_LAYER_PER_STREAM), y.simulcastCodecs = [H], t.backupCodec === !0 && (t.backupCodec = {
            codec: gs
          }), t.backupCodec && k !== t.backupCodec.codec && // TODO remove this once e2ee is supported for backup codecs
          y.encryption === G.NONE && (this.roomOptions.dynacast || (this.roomOptions.dynacast = !0), y.simulcastCodecs.push(new Gr({
            codec: t.backupCodec.codec,
            cid: ""
          })));
        }
        C = Ri(e.source === E.Source.ScreenShare, y.width, y.height, t), y.layers = po(y.width, y.height, C, Pt(t.videoCodec) && !tn(t.videoCodec, t));
      } else e.kind === E.Kind.Audio && (C = [{
        maxBitrate: (l = t.audioPreset) === null || l === void 0 ? void 0 : l.maxBitrate,
        priority: (h = (u = t.audioPreset) === null || u === void 0 ? void 0 : u.priority) !== null && h !== void 0 ? h : "high",
        networkPriority: (g = (f = t.audioPreset) === null || f === void 0 ? void 0 : f.priority) !== null && g !== void 0 ? g : "high"
      }]);
      if (!this.engine || this.engine.isClosed)
        throw new X("cannot publish track when not connected");
      const M = () => m(this, void 0, void 0, function* () {
        var D, U;
        if (!this.engine.pcManager)
          throw new X("pcManager is not ready");
        if (e.sender = yield this.engine.createSender(e, t, C), $e(e) && (e.publishOptions = t), this.emit(O.LocalSenderCreated, e.sender, e), $e(e) && ((D = t.degradationPreference) !== null && D !== void 0 || (t.degradationPreference = kp(e)), e.setDegradationPreference(t.degradationPreference)), C) {
          if (jt() && e.kind === E.Kind.Audio) {
            let H;
            for (const ae of this.engine.pcManager.publisher.getTransceivers())
              if (ae.sender === e.sender) {
                H = ae;
                break;
              }
            H && this.engine.pcManager.publisher.setTrackCodecBitrate({
              transceiver: H,
              codec: "opus",
              maxbr: !((U = C[0]) === null || U === void 0) && U.maxBitrate ? C[0].maxBitrate / 1e3 : 0
            });
          } else if (e.codec && Od(e.codec)) {
            const H = vp(e.codec, t, C);
            H > 0 && this.engine.pcManager.publisher.setTrackCodecBitrate({
              cid: y.cid,
              codec: e.codec,
              maxbr: H / 1e3,
              isScreenShare: e.source === E.Source.ScreenShare
            });
          }
        }
        yield this.engine.negotiate();
      });
      let A;
      const B = new Promise((D, U) => m(this, void 0, void 0, function* () {
        var H;
        try {
          A = yield this.engine.addTrack(y), D(A);
        } catch (ae) {
          if (e.sender && (!((H = this.engine.pcManager) === null || H === void 0) && H.publisher)) {
            try {
              this.engine.pcManager.publisher.removeTrack(e.sender);
            } catch (Me) {
              this.log.error(Me);
            }
            yield this.engine.negotiate().catch((Me) => {
              this.log.error("failed to negotiate after removing track due to failed add track request", Object.assign(Object.assign({}, j(e)), {
                error: Me
              }));
            });
          }
          U(ae);
        }
      }));
      if (this.enabledPublishVideoCodecs.length > 0 && b.length === 0)
        A = (yield Promise.all([B, M()]))[0];
      else {
        A = yield B;
        let D;
        if (A.codecs.forEach((U) => {
          D === void 0 && (D = U.mimeType);
        }), D && e.kind === E.Kind.Video) {
          const U = wn(D);
          U !== k && (this.log.debug("falling back to server selected codec", Object.assign(Object.assign({}, j(e)), {
            codec: U
          })), t.videoCodec = U, C = Ri(e.source === E.Source.ScreenShare, y.width, y.height, t));
        }
        yield M();
      }
      const F = new ys(e.kind, A, e, {
        loggerName: this.roomOptions.loggerName,
        loggerContextCb: () => this.logContext
      });
      if (F.on(R.CpuConstrained, (D) => this.onTrackCpuConstrained(D, F)), F.options = t, e.sid = A.sid, $e(e) && (e.publishOptions = t, y.width && y.height && (e.lastEncodedDimensions = {
        width: y.width,
        height: y.height
      })), this.log.debug("publishing ".concat(e.kind, " with encodings"), {
        encodings: C,
        trackInfo: A
      }), $e(e) ? e.startMonitor(this.engine.client) : st(e) && e.startMonitor(), this.addTrackPublication(F), this.emit(O.LocalTrackPublished, F), st(e) && A.audioFeatures.includes(fe.TF_PRECONNECT_BUFFER)) {
        const D = e.getPreConnectBuffer(), U = e.getPreConnectBufferMimeType();
        this.on(O.LocalTrackSubscribed, (H) => {
          if (H.trackSid === A.sid) {
            if (!e.hasPreConnectBuffer) {
              this.log.warn("subscribe event came to late, buffer already closed");
              return;
            }
            this.log.debug("finished recording preconnect buffer", j(e)), e.stopPreConnectBuffer();
          }
        }), D && new Promise((ae, Me) => m(this, void 0, void 0, function* () {
          var Ye, ft, Qn, pe, It, nr;
          try {
            this.log.debug("waiting for agent", j(e));
            const ar = setTimeout(() => {
              Me(new Error("agent not active within 10 seconds"));
            }, 1e4), bl = yield this.waitUntilActiveAgentPresent();
            clearTimeout(ar), this.log.debug("sending preconnect buffer", j(e));
            const sa = yield this.streamBytes({
              name: "preconnect-buffer",
              mimeType: U,
              topic: "lk.agent.pre-connect-audio-buffer",
              destinationIdentities: [bl.identity],
              attributes: {
                trackId: F.trackSid,
                sampleRate: String((It = I.sampleRate) !== null && It !== void 0 ? It : "48000"),
                channels: String((nr = I.channelCount) !== null && nr !== void 0 ? nr : "1")
              }
            });
            try {
              for (var ir = !0, rr = Ne(D), sr; sr = yield rr.next(), Ye = sr.done, !Ye; ir = !0) {
                pe = sr.value, ir = !1;
                const or = pe;
                yield sa.write(or);
              }
            } catch (or) {
              ft = {
                error: or
              };
            } finally {
              try {
                !ir && !Ye && (Qn = rr.return) && (yield Qn.call(rr));
              } finally {
                if (ft) throw ft.error;
              }
            }
            yield sa.close(), ae();
          } catch (ar) {
            Me(ar);
          }
        })).then(() => {
          this.log.debug("preconnect buffer sent successfully", j(e));
        }).catch((ae) => {
          this.log.error("error sending preconnect buffer", Object.assign(Object.assign({}, j(e)), {
            error: ae
          }));
        });
      }
      return F;
    });
  }
  canPublishFrameMetadata() {
    var e;
    return !!(this.roomOptions.e2ee || this.roomOptions.encryption || jn((e = this.roomOptions.frameMetadata) !== null && e !== void 0 ? e : this.roomOptions.packetTrailer));
  }
  normalizeRequestedFrameMetadataOptions(e, t) {
    var n;
    const r = (n = t.frameMetadata) !== null && n !== void 0 ? n : t.packetTrailer;
    if (e.kind !== E.Kind.Video || !_i(r))
      return t.frameMetadata = void 0, t.packetTrailer = void 0, [];
    if (!this.canPublishFrameMetadata())
      return this.log.warn("frame metadata transform not supported; not advertising features", Object.assign(Object.assign({}, this.logContext), j(e))), t.frameMetadata = void 0, t.packetTrailer = void 0, [];
    const s = sm(r), a = am(s);
    return t.frameMetadata = a, t.packetTrailer = a, s;
  }
  get isLocal() {
    return !0;
  }
  /** @internal
   * publish additional codec to existing track
   */
  publishAdditionalCodecForTrack(e, t, n) {
    return m(this, void 0, void 0, function* () {
      var r;
      if (this.encryptionType !== G.NONE)
        return;
      let s;
      if (this.trackPublications.forEach((g) => {
        g.track && g.track === e && (s = g);
      }), !s)
        throw new et("track is not published");
      if (!$e(e))
        throw new et("track is not a video track");
      const a = Object.assign(Object.assign({}, (r = this.roomOptions) === null || r === void 0 ? void 0 : r.publishDefaults), n), o = Kd(e, t, a);
      if (!o) {
        this.log.info("backup codec has been disabled, ignoring request to add additional codec for track", j(e));
        return;
      }
      const c = e.addSimulcastTrack(t, o);
      if (!c)
        return;
      const d = this.normalizeRequestedFrameMetadataOptions(e, a), l = new xn({
        cid: c.mediaStreamTrack.id,
        type: E.kindToProto(e.kind),
        muted: e.isMuted,
        source: E.sourceToProto(e.source),
        sid: e.sid,
        packetTrailerFeatures: d,
        simulcastCodecs: [{
          codec: a.videoCodec,
          cid: c.mediaStreamTrack.id
        }]
      });
      if (l.layers = po(l.width, l.height, o), !this.engine || this.engine.isClosed)
        throw new X("cannot publish track when not connected");
      const u = () => m(this, void 0, void 0, function* () {
        yield this.engine.createSimulcastSender(e, c, a, o), yield this.engine.negotiate();
      }), f = (yield Promise.all([this.engine.addTrack(l), u()]))[0];
      this.log.debug("published ".concat(t, " for track ").concat(e.sid), {
        encodings: o,
        trackInfo: f
      });
    });
  }
  unpublishTrack(e, t) {
    return m(this, void 0, void 0, function* () {
      var n, r;
      if (Ft(e)) {
        const l = this.pendingPublishPromises.get(e);
        l && (this.log.debug("awaiting publish promise before attempting to unpublish", j(e)), yield l);
      }
      const s = this.getPublicationForTrack(e), a = s ? j(s) : void 0;
      if (this.log.info("unpublishing track", a), !s || !s.track) {
        this.log.warn("track was not unpublished because no publication was found", a);
        return;
      }
      e = s.track, e.off(R.Muted, this.onTrackMuted), e.off(R.Unmuted, this.onTrackUnmuted), e.off(R.Ended, this.handleTrackEnded), e.off(R.UpstreamPaused, this.onTrackUpstreamPaused), e.off(R.UpstreamResumed, this.onTrackUpstreamResumed), e.off(R.AudioTrackFeatureUpdate, this.onTrackFeatureUpdate), t === void 0 && (t = (r = (n = this.roomOptions) === null || n === void 0 ? void 0 : n.stopLocalTrackOnUnpublish) !== null && r !== void 0 ? r : !0), t ? e.stop() : e.stopMonitor();
      let o = !1;
      const c = e.sender;
      if (e.sender = void 0, this.engine.pcManager && this.engine.pcManager.currentState < $.FAILED && c)
        try {
          for (const l of this.engine.pcManager.publisher.getTransceivers())
            l.sender === c && (l.direction = "inactive", o = !0);
          try {
            o = this.engine.removeTrack(c);
          } catch (l) {
            this.log.warn(l), o = !0;
          }
          if ($e(e)) {
            for (const l of e.simulcastCodecs) {
              var d = L(l, 2);
              const u = d[1];
              if (u.sender) {
                try {
                  o = this.engine.removeTrack(u.sender);
                } catch (h) {
                  this.log.warn(h), o = !0;
                }
                u.sender = void 0;
              }
            }
            e.simulcastCodecs.clear();
          }
        } catch (l) {
          this.log.warn("failed to unpublish track", Object.assign(Object.assign({}, a), {
            error: l
          }));
        }
      switch (this.trackPublications.delete(s.trackSid), s.kind) {
        case E.Kind.Audio:
          this.audioTrackPublications.delete(s.trackSid);
          break;
        case E.Kind.Video:
          this.videoTrackPublications.delete(s.trackSid);
          break;
      }
      return this.emit(O.LocalTrackUnpublished, s), s.setTrack(void 0), o && (yield this.engine.negotiate()), s;
    });
  }
  unpublishTracks(e) {
    return m(this, void 0, void 0, function* () {
      return (yield Promise.all(e.map((n) => this.unpublishTrack(n)))).filter((n) => !!n);
    });
  }
  republishAllTracks(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
      return (function* () {
        n.republishPromise && (yield n.republishPromise), n.republishPromise = new Ee((s, a) => m(n, void 0, void 0, function* () {
          try {
            const o = [];
            this.trackPublications.forEach((c) => {
              c.track && (t && (c.options = Object.assign(Object.assign({}, c.options), t)), o.push(c));
            }), yield Promise.all(o.map((c) => m(this, void 0, void 0, function* () {
              const d = c.track;
              yield this.unpublishTrack(d, !1), r && !d.isMuted && d.source !== E.Source.ScreenShare && d.source !== E.Source.ScreenShareAudio && (st(d) || $e(d)) && !d.isUserProvided && (this.log.debug("restarting existing track", {
                track: c.trackSid
              }), yield d.restartTrack()), yield this.publishOrRepublishTrack(d, c.options, !0);
            }))), s();
          } catch (o) {
            o instanceof Error ? a(o) : a(new Error(String(o)));
          } finally {
            this.republishPromise = void 0;
          }
        })), yield n.republishPromise;
      })();
    });
  }
  /**
   * Publish a new data payload to the room. Data will be forwarded to each
   * participant in the room if the destination field in publishOptions is empty
   *
   * @param data Uint8Array of the payload. To send string data, use TextEncoder.encode
   * @param options optionally specify a `reliable`, `topic` and `destination`
   */
  publishData(e) {
    return m(this, arguments, void 0, function(t) {
      var n = this;
      let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return (function* () {
        const s = r.reliable ? V.RELIABLE : V.LOSSY, a = r.reliable ? Tt.RELIABLE : Tt.LOSSY, o = r.destinationIdentities, c = r.topic;
        let d = new Ps({
          participantIdentity: n.identity,
          payload: t,
          destinationIdentities: o,
          topic: c
        });
        const l = new Ce({
          kind: a,
          value: {
            case: "user",
            value: d
          }
        });
        yield n.engine.sendDataPacket(l, s);
      })();
    });
  }
  /**
   * Publish SIP DTMF message to the room.
   *
   * @param code DTMF code
   * @param digit DTMF digit
   */
  publishDtmf(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = new Ce({
        kind: Tt.RELIABLE,
        value: {
          case: "sipDtmf",
          value: new lc({
            code: e,
            digit: t
          })
        }
      });
      yield this.engine.sendDataPacket(n, V.RELIABLE);
    });
  }
  /** @deprecated Consider migrating to {@link sendText} */
  sendChatMessage(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = {
        id: crypto.randomUUID(),
        message: e,
        timestamp: Date.now(),
        attachedFiles: t == null ? void 0 : t.attachments
      }, r = new Ce({
        value: {
          case: "chatMessage",
          value: new Ti(Object.assign(Object.assign({}, n), {
            timestamp: ee.parse(n.timestamp)
          }))
        }
      });
      return yield this.engine.sendDataPacket(r, V.RELIABLE), this.emit(O.ChatMessage, n), n;
    });
  }
  /** @deprecated Consider migrating to {@link sendText} */
  editChatMessage(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = Object.assign(Object.assign({}, t), {
        message: e,
        editTimestamp: Date.now()
      }), r = new Ce({
        value: {
          case: "chatMessage",
          value: new Ti(Object.assign(Object.assign({}, n), {
            timestamp: ee.parse(n.timestamp),
            editTimestamp: ee.parse(n.editTimestamp)
          }))
        }
      });
      return yield this.engine.sendDataPacket(r, V.RELIABLE), this.emit(O.ChatMessage, n), n;
    });
  }
  /**
   * Sends the given string to participants in the room via the data channel.
   * For longer messages, consider using {@link streamText} instead.
   *
   * @param text The text payload
   * @param options.topic Topic identifier used to route the stream to appropriate handlers.
   */
  sendText(e, t) {
    return m(this, void 0, void 0, function* () {
      return this.roomOutgoingDataStreamManager.sendText(e, t);
    });
  }
  /**
   * Creates a new TextStreamWriter which can be used to stream text incrementally
   * to participants in the room via the data channel.
   *
   * @param options.topic Topic identifier used to route the stream to appropriate handlers.
   *
   * @internal
   * @experimental CAUTION, might get removed in a minor release
   */
  streamText(e) {
    return m(this, void 0, void 0, function* () {
      return this.roomOutgoingDataStreamManager.streamText(e);
    });
  }
  /** Send a File to all participants in the room via the data channel.
   * @param file The File object payload
   * @param options.topic Topic identifier used to route the stream to appropriate handlers.
   * @param options.onProgress A callback function used to monitor the upload progress percentage.
   */
  sendFile(e, t) {
    return m(this, void 0, void 0, function* () {
      return this.roomOutgoingDataStreamManager.sendFile(e, t);
    });
  }
  /**
   * Sends the given bytes to participants in the room via the data channel.
   * For files, consider using {@link sendFile}; for longer/incremental payloads, {@link streamBytes}.
   *
   * @param bytes The byte payload
   * @param options.topic Topic identifier used to route the stream to appropriate handlers.
   */
  sendBytes(e, t) {
    return m(this, void 0, void 0, function* () {
      return this.roomOutgoingDataStreamManager.sendBytes(e, t);
    });
  }
  /**
   * Stream bytes incrementally to participants in the room via the data channel.
   * For sending files, consider using {@link sendFile} instead.
   *
   * @param options.topic Topic identifier used to route the stream to appropriate handlers.
   */
  streamBytes(e) {
    return m(this, void 0, void 0, function* () {
      return this.roomOutgoingDataStreamManager.streamBytes(e);
    });
  }
  /**
   * Initiate an RPC call to a remote participant
   * @param params - Parameters for initiating the RPC call, see {@link PerformRpcParams}
   * @returns A promise that resolves with the response payload or rejects with an error.
   * @throws Error on failure. Details in `message`.
   */
  performRpc(e) {
    return this.rpcClientManager.performRpc(e).then((t) => {
      let n = L(t, 2);
      return n[0], n[1];
    });
  }
  /**
   * @deprecated use `room.registerRpcMethod` instead
   */
  registerRpcMethod(e, t) {
    this.rpcServerManager.registerRpcMethod(e, t);
  }
  /**
   * @deprecated use `room.unregisterRpcMethod` instead
   */
  unregisterRpcMethod(e) {
    this.rpcServerManager.unregisterRpcMethod(e);
  }
  /**
   * Control who can subscribe to LocalParticipant's published tracks.
   *
   * By default, all participants can subscribe. This allows fine-grained control over
   * who is able to subscribe at a participant and track level.
   *
   * Note: if access is given at a track-level (i.e. both [allParticipantsAllowed] and
   * [ParticipantTrackPermission.allTracksAllowed] are false), any newer published tracks
   * will not grant permissions to any participants and will require a subsequent
   * permissions update to allow subscription.
   *
   * @param allParticipantsAllowed Allows all participants to subscribe all tracks.
   *  Takes precedence over [[participantTrackPermissions]] if set to true.
   *  By default this is set to true.
   * @param participantTrackPermissions Full list of individual permissions per
   *  participant/track. Any omitted participants will not receive any permissions.
   */
  setTrackSubscriptionPermissions(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
    this.participantTrackPermissions = t, this.allParticipantsAllowedToSubscribe = e, this.engine.client.isDisconnected || this.updateTrackSubscriptionPermissions();
  }
  /** @internal */
  setEnabledPublishCodecs(e) {
    this.enabledPublishVideoCodecs = e.filter((t) => t.mime.split("/")[0].toLowerCase() === "video");
  }
  /** @internal */
  updateInfo(e) {
    return super.updateInfo(e) ? (e.tracks.forEach((t) => {
      var n, r;
      const s = this.trackPublications.get(t.sid);
      if (s) {
        const a = s.isMuted || ((r = (n = s.track) === null || n === void 0 ? void 0 : n.isUpstreamPaused) !== null && r !== void 0 ? r : !1);
        a !== t.muted && (this.log.debug("updating server mute state after reconcile", Object.assign(Object.assign({}, j(s)), {
          mutedOnServer: a
        })), this.engine.client.sendMuteTrack(t.sid, a));
      }
    }), !0) : !1;
  }
  /** @internal */
  setActiveAgent(e) {
    var t, n, r, s;
    this.firstActiveAgent = e, e && !this.firstActiveAgent && (this.firstActiveAgent = e), e ? (n = (t = this.activeAgentFuture) === null || t === void 0 ? void 0 : t.resolve) === null || n === void 0 || n.call(t, e) : (s = (r = this.activeAgentFuture) === null || r === void 0 ? void 0 : r.reject) === null || s === void 0 || s.call(r, new Error("Agent disconnected")), this.activeAgentFuture = void 0;
  }
  waitUntilActiveAgentPresent() {
    return this.firstActiveAgent ? Promise.resolve(this.firstActiveAgent) : (this.activeAgentFuture || (this.activeAgentFuture = new ve()), this.activeAgentFuture.promise);
  }
  getPublicationForTrack(e) {
    let t;
    return this.trackPublications.forEach((n) => {
      const r = n.track;
      r && (e instanceof MediaStreamTrack ? (st(r) || $e(r)) && r.mediaStreamTrack === e && (t = n) : e === r && (t = n));
    }), t;
  }
  waitForPendingPublicationOfSource(e) {
    return m(this, void 0, void 0, function* () {
      const n = Date.now();
      for (; Date.now() < n + 1e4; ) {
        const r = Array.from(this.pendingPublishPromises.entries()).find((s) => L(s, 1)[0].source === e);
        if (r)
          return r[1];
        yield ke(20);
      }
    });
  }
  /** Publishes a data track.
   *
   * Returns the published data track if successful. Use {@link LocalDataTrack#tryPush}
   * to send data frames on the track.
   */
  publishDataTrack(e) {
    return m(this, void 0, void 0, function* () {
      const t = new Zi(e, this.roomOutgoingDataTrackManager);
      return yield t.publish(), t;
    });
  }
}
class Lo extends DOMException {
  constructor(e, t) {
    super(e, "AbortError"), this.reason = t;
  }
}
class sg extends Map {
  constructor() {
    super(...arguments), this.pending = /* @__PURE__ */ new Map();
  }
  set(e, t) {
    var n, r;
    super.set(e, t);
    const s = (n = this.pending) === null || n === void 0 ? void 0 : n.get(e);
    if (s) {
      for (const a of s)
        a.isResolved || (r = a.resolve) === null || r === void 0 || r.call(a, t);
      this.pending.delete(e);
    }
    return this;
  }
  get [Symbol.toStringTag]() {
    return "DeferrableMap";
  }
  getDeferred(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = this.get(e);
      if (typeof n < "u")
        return n;
      if (t != null && t.aborted)
        throw new Lo("The operation was aborted.", t.reason);
      const r = new ve(void 0, () => {
        const a = this.pending.get(e);
        if (!a)
          return;
        const o = a.indexOf(r);
        o !== -1 && a.splice(o, 1), a.length === 0 && this.pending.delete(e);
      }), s = this.pending.get(e);
      if (s ? s.push(r) : this.pending.set(e, [r]), t) {
        const a = () => {
          var o;
          r.isResolved || (o = r.reject) === null || o === void 0 || o.call(r, new Lo("The operation was aborted.", t.reason));
        };
        t.addEventListener("abort", a, {
          once: !0
        }), r.promise.finally(() => {
          t.removeEventListener("abort", a);
        });
      }
      return r.promise;
    });
  }
}
class ag extends ot {
  constructor(e, t, n, r) {
    super(e, t.sid, t.name, r), this.track = void 0, this.allowed = !0, this.requestedDisabled = void 0, this.visible = !0, this.handleEnded = (s) => {
      this.setTrack(void 0), this.emit(R.Ended, s);
    }, this.handleVisibilityChange = (s) => {
      this.log.debug("adaptivestream video visibility ".concat(this.trackSid, ", visible=").concat(s), this.logContext), this.visible = s, this.emitTrackUpdate();
    }, this.handleVideoDimensionsChange = (s) => {
      this.log.debug("adaptivestream video dimensions ".concat(s.width, "x").concat(s.height), this.logContext), this.videoDimensionsAdaptiveStream = s, this.emitTrackUpdate();
    }, this.subscribed = n, this.updateInfo(t);
  }
  /**
   * Subscribe or unsubscribe to this remote track
   * @param subscribed true to subscribe to a track, false to unsubscribe
   */
  setSubscribed(e) {
    const t = this.subscriptionStatus, n = this.permissionStatus;
    this.subscribed = e, e && (this.allowed = !0);
    const r = new Hi({
      trackSids: [this.trackSid],
      subscribe: this.subscribed,
      participantTracks: [new hc({
        // sending an empty participant id since TrackPublication doesn't keep it
        // this is filled in by the participant that receives this message
        participantSid: "",
        trackSids: [this.trackSid]
      })]
    });
    this.emit(R.UpdateSubscription, r), this.emitSubscriptionUpdateIfChanged(t), this.emitPermissionUpdateIfChanged(n);
  }
  get subscriptionStatus() {
    return this.subscribed === !1 ? ot.SubscriptionStatus.Unsubscribed : super.isSubscribed ? ot.SubscriptionStatus.Subscribed : ot.SubscriptionStatus.Desired;
  }
  get permissionStatus() {
    return this.allowed ? ot.PermissionStatus.Allowed : ot.PermissionStatus.NotAllowed;
  }
  /**
   * Returns true if track is subscribed, and ready for playback
   */
  get isSubscribed() {
    return this.subscribed === !1 ? !1 : super.isSubscribed;
  }
  // returns client's desire to subscribe to a track, also true if autoSubscribe is enabled
  get isDesired() {
    return this.subscribed !== !1;
  }
  get isEnabled() {
    return this.requestedDisabled !== void 0 ? !this.requestedDisabled : this.isAdaptiveStream ? this.visible : !0;
  }
  get isLocal() {
    return !1;
  }
  /**
   * disable server from sending down data for this track. this is useful when
   * the participant is off screen, you may disable streaming down their video
   * to reduce bandwidth requirements
   * @param enabled
   */
  setEnabled(e) {
    !this.isManualOperationAllowed() || this.requestedDisabled === !e || (this.requestedDisabled = !e, this.emitTrackUpdate());
  }
  /**
   * for tracks that support simulcasting, adjust subscribed quality
   *
   * This indicates the highest quality the client can accept. if network
   * bandwidth does not allow, server will automatically reduce quality to
   * optimize for uninterrupted video
   */
  setVideoQuality(e) {
    !this.isManualOperationAllowed() || this.requestedMaxQuality === e || (this.requestedMaxQuality = e, this.requestedVideoDimensions = void 0, this.emitTrackUpdate());
  }
  /**
   * Explicitly set the video dimensions for this track.
   *
   * This will take precedence over adaptive stream dimensions.
   *
   * @param dimensions The video dimensions to set.
   */
  setVideoDimensions(e) {
    var t, n;
    this.isManualOperationAllowed() && (((t = this.requestedVideoDimensions) === null || t === void 0 ? void 0 : t.width) === e.width && ((n = this.requestedVideoDimensions) === null || n === void 0 ? void 0 : n.height) === e.height || (Tr(this.track) && (this.requestedVideoDimensions = e), this.requestedMaxQuality = void 0, this.emitTrackUpdate()));
  }
  setVideoFPS(e) {
    this.isManualOperationAllowed() && Tr(this.track) && this.fps !== e && (this.fps = e, this.emitTrackUpdate());
  }
  get videoQuality() {
    var e;
    return (e = this.requestedMaxQuality) !== null && e !== void 0 ? e : De.HIGH;
  }
  /** @internal */
  setTrack(e) {
    const t = this.subscriptionStatus, n = this.permissionStatus, r = this.track;
    r !== e && (r && (r.off(R.VideoDimensionsChanged, this.handleVideoDimensionsChange), r.off(R.VisibilityChanged, this.handleVisibilityChange), r.off(R.Ended, this.handleEnded), r.detach(), r.stopMonitor(), this.emit(R.Unsubscribed, r)), super.setTrack(e), e && (e.sid = this.trackSid, e.on(R.VideoDimensionsChanged, this.handleVideoDimensionsChange), e.on(R.VisibilityChanged, this.handleVisibilityChange), e.on(R.Ended, this.handleEnded), this.emit(R.Subscribed, e)), this.emitPermissionUpdateIfChanged(n), this.emitSubscriptionUpdateIfChanged(t));
  }
  /** @internal */
  setAllowed(e) {
    const t = this.subscriptionStatus, n = this.permissionStatus;
    this.allowed = e, this.emitPermissionUpdateIfChanged(n), this.emitSubscriptionUpdateIfChanged(t);
  }
  /** @internal */
  setSubscriptionError(e) {
    this.emit(R.SubscriptionFailed, e);
  }
  /** @internal */
  updateInfo(e) {
    super.updateInfo(e);
    const t = this.metadataMuted;
    this.metadataMuted = e.muted, this.track ? this.track.setMuted(e.muted) : t !== e.muted && this.emit(e.muted ? R.Muted : R.Unmuted);
  }
  emitSubscriptionUpdateIfChanged(e) {
    const t = this.subscriptionStatus;
    e !== t && this.emit(R.SubscriptionStatusChanged, t, e);
  }
  emitPermissionUpdateIfChanged(e) {
    this.permissionStatus !== e && this.emit(R.SubscriptionPermissionChanged, this.permissionStatus, e);
  }
  isManualOperationAllowed() {
    return this.isDesired ? !0 : (this.log.warn("cannot update track settings when not subscribed", this.logContext), !1);
  }
  get isAdaptiveStream() {
    return Tr(this.track) && this.track.isAdaptiveStream;
  }
  /* @internal */
  emitTrackUpdate() {
    const e = new _c({
      trackSids: [this.trackSid],
      disabled: !this.isEnabled,
      fps: this.fps
    });
    if (this.kind === E.Kind.Video) {
      let t = this.requestedVideoDimensions;
      if (this.videoDimensionsAdaptiveStream !== void 0)
        if (t)
          Fa(this.videoDimensionsAdaptiveStream, t) && (this.log.debug("using adaptive stream dimensions instead of requested", Object.assign(Object.assign({}, this.logContext), this.videoDimensionsAdaptiveStream)), t = this.videoDimensionsAdaptiveStream);
        else if (this.requestedMaxQuality !== void 0 && this.trackInfo) {
          const n = yf(this.trackInfo, this.requestedMaxQuality);
          n && Fa(this.videoDimensionsAdaptiveStream, n) && (this.log.debug("using adaptive stream dimensions instead of max quality layer", Object.assign(Object.assign({}, this.logContext), this.videoDimensionsAdaptiveStream)), t = this.videoDimensionsAdaptiveStream);
        } else
          this.log.debug("using adaptive stream dimensions", Object.assign(Object.assign({}, this.logContext), this.videoDimensionsAdaptiveStream)), t = this.videoDimensionsAdaptiveStream;
      t ? (e.width = Math.ceil(t.width), e.height = Math.ceil(t.height)) : this.requestedMaxQuality !== void 0 ? (this.log.debug("using requested max quality", Object.assign(Object.assign({}, this.logContext), {
        quality: this.requestedMaxQuality
      })), e.quality = this.requestedMaxQuality) : (this.log.debug("using default quality", Object.assign(Object.assign({}, this.logContext), {
        quality: De.HIGH
      })), e.quality = De.HIGH);
    }
    this.emit(R.UpdateSettings, e);
  }
}
class Ai extends ul {
  /** @internal */
  static fromParticipantInfo(e, t, n, r) {
    return new Ai(e, t.sid, t.identity, t.name, t.metadata, t.attributes, n, t.kind, t.dataTracks.map((s) => {
      const a = Pi.from(s);
      return new al(a, r, {
        publisherIdentity: t.identity
      });
    }), t.clientProtocol, t.capabilities);
  }
  get logContext() {
    return Object.assign(Object.assign({}, super.logContext), {
      remoteParticipantID: this.sid,
      remoteParticipant: this.identity
    });
  }
  /** @internal */
  constructor(e, t, n, r, s, a, o) {
    let c = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : Dn.STANDARD, d = arguments.length > 8 && arguments[8] !== void 0 ? arguments[8] : [], l = arguments.length > 9 && arguments[9] !== void 0 ? arguments[9] : bd, u = arguments.length > 10 && arguments[10] !== void 0 ? arguments[10] : [];
    super(t, n || "", r, s, a, o, c), this.signalClient = e, this.trackPublications = /* @__PURE__ */ new Map(), this.audioTrackPublications = /* @__PURE__ */ new Map(), this.videoTrackPublications = /* @__PURE__ */ new Map(), this.dataTracks = new sg(d.map((h) => [h.info.name, h])), this.volumeMap = /* @__PURE__ */ new Map(), this.clientProtocol = l, this.capabilities = u;
  }
  addTrackPublication(e) {
    super.addTrackPublication(e), e.on(R.UpdateSettings, (t) => {
      this.log.debug("send update settings", Object.assign(Object.assign(Object.assign({}, this.logContext), j(e)), {
        settings: t
      })), this.signalClient.sendUpdateTrackSettings(t);
    }), e.on(R.UpdateSubscription, (t) => {
      t.participantTracks.forEach((n) => {
        n.participantSid = this.sid;
      }), this.signalClient.sendUpdateSubscription(t);
    }), e.on(R.SubscriptionPermissionChanged, (t) => {
      this.emit(O.TrackSubscriptionPermissionChanged, e, t);
    }), e.on(R.SubscriptionStatusChanged, (t) => {
      this.emit(O.TrackSubscriptionStatusChanged, e, t);
    }), e.on(R.Subscribed, (t) => {
      this.emit(O.TrackSubscribed, t, e);
    }), e.on(R.Unsubscribed, (t) => {
      this.emit(O.TrackUnsubscribed, t, e);
    }), e.on(R.SubscriptionFailed, (t) => {
      this.emit(O.TrackSubscriptionFailed, e.trackSid, t);
    });
  }
  getTrackPublication(e) {
    const t = super.getTrackPublication(e);
    if (t)
      return t;
  }
  getTrackPublicationByName(e) {
    const t = super.getTrackPublicationByName(e);
    if (t)
      return t;
  }
  /**
   * sets the volume on the participant's audio track
   * by default, this affects the microphone publication
   * a different source can be passed in as a second argument
   * if no track exists the volume will be applied when the microphone track is added
   */
  setVolume(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : E.Source.Microphone;
    this.volumeMap.set(t, e);
    const n = this.getTrackPublication(t);
    n && n.track && n.track.setVolume(e);
  }
  /**
   * gets the volume on the participant's microphone track
   */
  getVolume() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : E.Source.Microphone;
    const t = this.getTrackPublication(e);
    return t && t.track ? t.track.getVolume() : this.volumeMap.get(e);
  }
  /** @internal */
  addSubscribedMediaTrack(e, t, n, r, s, a) {
    let o = this.getTrackPublicationBySid(t);
    if (o || t.startsWith("TR") || this.trackPublications.forEach((l) => {
      !o && e.kind === l.kind.toString() && (o = l);
    }), !o) {
      if (a === 0) {
        this.log.error("could not find published track", Object.assign(Object.assign({}, this.logContext), {
          trackSid: t
        })), this.emit(O.TrackSubscriptionFailed, t);
        return;
      }
      a === void 0 && (a = 20), setTimeout(() => {
        this.addSubscribedMediaTrack(e, t, n, r, s, a - 1);
      }, 150);
      return;
    }
    if (e.readyState === "ended") {
      this.log.error("unable to subscribe because MediaStreamTrack is ended. Do not call MediaStreamTrack.stop()", Object.assign(Object.assign({}, this.logContext), j(o))), this.emit(O.TrackSubscriptionFailed, t);
      return;
    }
    const c = e.kind === "video";
    let d;
    return c ? d = new Js(e, t, r, s) : d = new Zp(e, t, r, this.audioContext, this.audioOutput), d.source = o.source, d.isMuted = o.isMuted, d.setMediaStream(n), d.start(), o.setTrack(d), this.volumeMap.has(o.source) && hs(d) && nt(d) && d.setVolume(this.volumeMap.get(o.source)), o;
  }
  /** @internal */
  get hasMetadata() {
    return !!this.participantInfo;
  }
  /**
   * @internal
   */
  getTrackPublicationBySid(e) {
    return this.trackPublications.get(e);
  }
  /** @internal */
  updateInfo(e) {
    if (!super.updateInfo(e))
      return !1;
    const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
    return e.tracks.forEach((r) => {
      var s, a;
      let o = this.getTrackPublicationBySid(r.sid);
      if (o)
        o.updateInfo(r);
      else {
        const c = E.kindFromProto(r.type);
        if (!c)
          return;
        o = new ag(c, r, (s = this.signalClient.connectOptions) === null || s === void 0 ? void 0 : s.autoSubscribe, {
          loggerContextCb: () => this.logContext,
          loggerName: (a = this.loggerOptions) === null || a === void 0 ? void 0 : a.loggerName
        }), o.updateInfo(r), n.set(r.sid, o);
        const d = Array.from(this.trackPublications.values()).find((l) => l.source === (o == null ? void 0 : o.source));
        d && o.source !== E.Source.Unknown && this.log.debug("received a second track publication for ".concat(this.identity, " with the same source: ").concat(o.source), Object.assign(Object.assign({}, this.logContext), {
          oldTrack: j(d),
          newTrack: j(o)
        })), this.addTrackPublication(o);
      }
      t.set(r.sid, o);
    }), this.trackPublications.forEach((r) => {
      t.has(r.trackSid) || (this.log.trace("detected removed track on remote participant, unpublishing", Object.assign(Object.assign({}, this.logContext), j(r))), this.unpublishTrack(r.trackSid, !0));
    }), n.forEach((r) => {
      this.emit(O.TrackPublished, r);
    }), !0;
  }
  /** @internal */
  unpublishTrack(e, t) {
    const n = this.trackPublications.get(e);
    if (!n)
      return;
    const r = n.track;
    switch (r && (r.stop(), n.setTrack(void 0)), this.trackPublications.delete(e), n.kind) {
      case E.Kind.Audio:
        this.audioTrackPublications.delete(e);
        break;
      case E.Kind.Video:
        this.videoTrackPublications.delete(e);
        break;
    }
    t && this.emit(O.TrackUnpublished, n);
  }
  /**
   * @internal
   */
  setAudioOutput(e) {
    return m(this, void 0, void 0, function* () {
      this.audioOutput = e;
      const t = [];
      this.audioTrackPublications.forEach((n) => {
        var r;
        nt(n.track) && hs(n.track) && t.push(n.track.setSinkId((r = e.deviceId) !== null && r !== void 0 ? r : "default"));
      }), yield Promise.all(t);
    });
  }
  /** @internal */
  addRemoteDataTrack(e) {
    this.dataTracks.set(e.info.name, e);
  }
  /** @internal */
  removeRemoteDataTrack(e) {
    for (const n of this.dataTracks.entries()) {
      var t = L(n, 2);
      const r = t[0], s = t[1];
      e === s.info.sid && this.dataTracks.delete(r);
    }
  }
  /** @internal */
  emit(e) {
    for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
      n[r - 1] = arguments[r];
    return this.log.trace("participant event", Object.assign(Object.assign({}, this.logContext), {
      event: e,
      args: n
    })), super.emit(e, ...n);
  }
}
var K;
(function(i) {
  i.Disconnected = "disconnected", i.Connecting = "connecting", i.Connected = "connected", i.Reconnecting = "reconnecting", i.SignalReconnecting = "signalReconnecting";
})(K || (K = {}));
const og = 4 * 1e3, cg = 30 * 1e3;
class zn extends Ie.EventEmitter {
  get hasE2EESetup() {
    return this.e2eeManager !== void 0;
  }
  /**
   * Creates a new Room, the primary construct for a LiveKit session.
   * @param options
   */
  constructor(e) {
    var t, n, r, s, a, o, c, d;
    if (super(), t = this, this.state = K.Disconnected, this.activeSpeakers = [], this.isE2EEEnabled = !1, this.audioEnabled = !0, this.e2eeStateMutex = new ue(), this.isVideoPlaybackBlocked = !1, this.log = q, this.statsLog = q, this.bufferedEvents = [], this.isResuming = !1, this.pendingTrackAddedCallbacks = /* @__PURE__ */ new Map(), this.connect = (l, u, h) => m(this, void 0, void 0, function* () {
      var f;
      if (!Pf())
        throw ze() ? Error("WebRTC isn't detected, have you called registerGlobals?") : Error("LiveKit doesn't seem to be supported on this browser. Try to update your browser and make sure no browser extensions are disabling webRTC.");
      const g = yield this.disconnectLock.lock();
      if (this.state === K.Connected)
        return this.log.info("already connected to room ".concat(this.name)), g(), Promise.resolve();
      if (this.connectFuture)
        return g(), this.connectFuture.promise;
      this.setAndEmitConnectionState(K.Connecting), ((f = this.regionUrlProvider) === null || f === void 0 ? void 0 : f.getServerUrl().toString()) !== Ad(l) && (this.regionUrl = void 0, this.regionUrlProvider = void 0), un(new URL(l)) && (this.regionUrlProvider === void 0 ? this.regionUrlProvider = new W(l, u) : this.regionUrlProvider.updateToken(u), this.regionUrlProvider.fetchRegionSettings().then((T) => {
        var S;
        (S = this.regionUrlProvider) === null || S === void 0 || S.setServerReportedRegions(T);
      }).catch((T) => {
        this.log.warn("could not fetch region settings", {
          error: T
        });
      }));
      const p = (T, S, I) => m(this, void 0, void 0, function* () {
        var b, y;
        this.abortController && this.abortController.abort();
        const C = new AbortController();
        this.abortController = C, g == null || g();
        try {
          if (yield rn.getInstance().getBackOffPromise(l), C.signal.aborted)
            throw x.cancelled("Connection attempt aborted");
          yield this.attemptConnection(I ?? l, u, h, C), this.abortController = void 0, T();
        } catch (M) {
          if (this.regionUrlProvider && M instanceof x && M.reason !== J.Cancelled && M.reason !== J.NotAllowed) {
            let A = null;
            try {
              this.log.debug("Fetching next region"), A = yield this.regionUrlProvider.getNextBestRegionUrl((b = this.abortController) === null || b === void 0 ? void 0 : b.signal);
            } catch (B) {
              if (B instanceof x && (B.status === 401 || B.reason === J.Cancelled)) {
                this.handleDisconnect(this.options.stopLocalTrackOnUnpublish), S(B);
                return;
              }
            }
            // making sure we only register failed attempts on things we actually care about
            [J.InternalError, J.ServerUnreachable, J.Timeout].includes(M.reason) && (this.log.debug("Adding failed connection attempt to back off"), rn.getInstance().addFailedConnectionAttempt(l)), A && !(!((y = this.abortController) === null || y === void 0) && y.signal.aborted) ? (this.log.info("Initial connection failed with ConnectionError: ".concat(M.message, ". Retrying with another region: ").concat(A)), this.recreateEngine(!0), yield p(T, S, A)) : (this.handleDisconnect(this.options.stopLocalTrackOnUnpublish, Va(M)), S(M));
          } else {
            let A = Ae.UNKNOWN_REASON;
            M instanceof x && (A = Va(M)), this.handleDisconnect(this.options.stopLocalTrackOnUnpublish, A), S(M);
          }
        }
      }), k = this.regionUrl;
      return this.regionUrl = void 0, this.connectFuture = new ve((T, S) => {
        p(T, S, k);
      }, () => {
        this.clearConnectionFutures();
      }), this.connectFuture.promise;
    }), this.connectSignal = (l, u, h, f, g, p) => m(this, void 0, void 0, function* () {
      const k = yield h.join(l, u, {
        autoSubscribe: f.autoSubscribe,
        adaptiveStream: typeof g.adaptiveStream == "object" ? !0 : g.adaptiveStream,
        clientInfoCapabilities: this.getClientInfoCapabilities(g),
        maxRetries: f.maxRetries,
        e2eeEnabled: !!this.e2eeManager,
        websocketTimeout: f.websocketTimeout
      }, p.signal, !g.singlePeerConnection), T = k.joinResponse, S = k.serverInfo;
      if (this.serverInfo = S, !S.version)
        throw new sf("unknown server version");
      return S.version === "0.15.1" && this.options.dynacast && (this.log.debug("disabling dynacast due to server version"), g.dynacast = !1), T;
    }), this.applyJoinResponse = (l) => {
      const u = l.participant;
      if (this.localParticipant.sid = u.sid, this.localParticipant.identity = u.identity, this.localParticipant.setEnabledPublishCodecs(l.enabledPublishCodecs), this.e2eeManager)
        try {
          this.e2eeManager.setSifTrailer(l.sifTrailer);
        } catch (h) {
          this.log.error(h instanceof Error ? h.message : "Could not set SifTrailer", {
            error: h
          });
        }
      this.handleParticipantUpdates([u, ...l.otherParticipants]), l.room && this.handleRoomUpdate(l.room);
    }, this.attemptConnection = (l, u, h, f) => m(this, void 0, void 0, function* () {
      var g, p;
      this.state === K.Reconnecting || this.isResuming || !((g = this.engine) === null || g === void 0) && g.pendingReconnect ? (this.log.info("Reconnection attempt replaced by new connection attempt"), this.recreateEngine(!0)) : this.maybeCreateEngine(), !((p = this.regionUrlProvider) === null || p === void 0) && p.isCloud() && this.engine.setRegionStrategy(this.createRegionStrategy()), this.acquireAudioContext(), this.connOptions = Object.assign(Object.assign({}, Zs), h), this.connOptions.rtcConfig && (this.engine.rtcConfig = this.connOptions.rtcConfig), this.connOptions.peerConnectionTimeout && (this.engine.peerConnectionTimeout = this.connOptions.peerConnectionTimeout);
      try {
        const k = yield this.connectSignal(l, u, this.engine, this.connOptions, this.options, f);
        this.applyJoinResponse(k), this.setupLocalParticipantEvents(), this.emit(_.SignalConnected);
      } catch (k) {
        yield this.engine.close(), this.recreateEngine();
        const T = f.signal.aborted ? x.cancelled("Signal connection aborted") : x.serverUnreachable("could not establish signal connection");
        throw k instanceof Error && (T.message = "".concat(T.message, ": ").concat(k.message)), k instanceof x && (T.reason = k.reason, T.status = k.status), this.log.debug("error trying to establish signal connection", {
          error: k
        }), T;
      }
      if (f.signal.aborted)
        throw yield this.engine.close(), this.recreateEngine(), x.cancelled("Connection attempt aborted");
      try {
        yield this.engine.waitForPCInitialConnection(this.connOptions.peerConnectionTimeout, f);
      } catch (k) {
        throw yield this.engine.close(), this.recreateEngine(), k;
      }
      Re() && this.options.disconnectOnPageLeave && (window.addEventListener("pagehide", this.onPageLeave), window.addEventListener("beforeunload", this.onPageLeave)), Re() && window.addEventListener("freeze", this.onPageLeave), this.setAndEmitConnectionState(K.Connected), this.emit(_.Connected), rn.getInstance().resetFailedConnectionAttempts(l), this.registerConnectionReconcile(), this.regionUrlProvider && this.regionUrlProvider.notifyConnected();
    }), this.disconnect = function() {
      for (var l = arguments.length, u = new Array(l), h = 0; h < l; h++)
        u[h] = arguments[h];
      return m(t, [...u], void 0, function() {
        var f = this;
        let g = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
        return (function* () {
          var p, k, T;
          const S = yield f.disconnectLock.lock();
          try {
            if (f.state === K.Disconnected) {
              f.log.debug("already disconnected");
              return;
            }
            if (f.log.info("disconnect from room"), f.state === K.Connecting || f.state === K.Reconnecting || f.isResuming) {
              const I = "Abort connection attempt due to user initiated disconnect";
              f.log.warn(I), (p = f.abortController) === null || p === void 0 || p.abort(I), (T = (k = f.connectFuture) === null || k === void 0 ? void 0 : k.reject) === null || T === void 0 || T.call(k, x.cancelled("Client initiated disconnect")), f.connectFuture = void 0;
            }
            f.engine && (f.engine.client.isDisconnected || (yield f.engine.client.sendLeave()), yield f.engine.close()), f.handleDisconnect(g, Ae.CLIENT_INITIATED), f.engine = void 0;
          } finally {
            S();
          }
        })();
      });
    }, this.onPageLeave = () => m(this, void 0, void 0, function* () {
      this.log.info("Page leave detected, disconnecting"), yield this.disconnect();
    }), this.startAudio = () => m(this, void 0, void 0, function* () {
      const l = [], u = ye();
      if (u && u.os === "iOS") {
        const h = "livekit-dummy-audio-el";
        let f = document.getElementById(h);
        if (!f) {
          f = document.createElement("audio"), f.id = h, f.autoplay = !0, f.hidden = !0;
          const g = kr();
          g.enabled = !0;
          const p = new MediaStream([g]);
          f.srcObject = p, document.addEventListener("visibilitychange", () => {
            f && (f.srcObject = document.hidden ? null : p, document.hidden || (this.log.debug("page visible again, triggering startAudio to resume playback and update playback status"), this.startAudio()));
          }), document.body.append(f), this.once(_.Disconnected, () => {
            f == null || f.remove(), f = null;
          });
        }
        l.push(f);
      }
      this.remoteParticipants.forEach((h) => {
        h.audioTrackPublications.forEach((f) => {
          f.track && f.track.attachedElements.forEach((g) => {
            l.push(g);
          });
        });
      });
      try {
        yield Promise.all([this.acquireAudioContext(), ...l.map((h) => (this.options.webAudioMix || (h.muted = !1), h.play()))]), this.handleAudioPlaybackStarted();
      } catch (h) {
        throw this.handleAudioPlaybackFailed(h), h;
      }
    }), this.startVideo = () => m(this, void 0, void 0, function* () {
      const l = [];
      for (const u of this.remoteParticipants.values())
        u.videoTrackPublications.forEach((h) => {
          var f;
          (f = h.track) === null || f === void 0 || f.attachedElements.forEach((g) => {
            l.includes(g) || l.push(g);
          });
        });
      yield Promise.all(l.map((u) => u.play())).then(() => {
        this.handleVideoPlaybackStarted();
      }).catch((u) => {
        u.name === "NotAllowedError" ? this.handleVideoPlaybackFailed() : this.log.warn("Resuming video playback failed, make sure you call `startVideo` directly in a user gesture handler");
      });
    }), this.handleRestarting = () => {
      this.clearConnectionReconcile(), this.isResuming = !1;
      for (const l of this.remoteParticipants.values())
        this.handleParticipantDisconnected(l.identity, l);
      this.setAndEmitConnectionState(K.Reconnecting) && this.emit(_.Reconnecting);
    }, this.handleRestarted = () => {
      this.outgoingDataTrackManager.sfuWillRepublishTracks(), this.incomingDataTrackManager.resendSubscriptionUpdates();
    }, this.handleSignalRestarted = (l) => m(this, void 0, void 0, function* () {
      this.log.debug("signal reconnected to server, region ".concat(l.serverRegion), {
        region: l.serverRegion
      }), this.bufferedEvents = [], this.applyJoinResponse(l);
      try {
        yield this.localParticipant.republishAllTracks(void 0, !0);
      } catch (u) {
        this.log.error("error trying to re-publish tracks after reconnection", {
          error: u
        });
      }
      try {
        yield this.engine.waitForRestarted(), this.log.debug("fully reconnected to server", {
          region: l.serverRegion
        });
      } catch {
        return;
      }
      this.setAndEmitConnectionState(K.Connected), this.emit(_.Reconnected), this.registerConnectionReconcile(), this.emitBufferedEvents();
    }), this.handleParticipantUpdates = (l) => {
      var u;
      for (const f of l) {
        if (f.identity === this.localParticipant.identity) {
          this.localParticipant.updateInfo(f);
          continue;
        }
        f.identity === "" && (f.identity = (u = this.sidToIdentity.get(f.sid)) !== null && u !== void 0 ? u : "");
        let g = this.remoteParticipants.get(f.identity);
        f.state === Yt.DISCONNECTED ? this.handleParticipantDisconnected(f.identity, g, f.disconnectReason === Ae.UNKNOWN_REASON ? void 0 : f.disconnectReason) : this.getOrCreateParticipant(f.identity, f);
      }
      const h = new Map(l.filter((f) => f.identity !== this.localParticipant.identity).map((f) => [f.identity, f.dataTracks.map((g) => Pi.from(g))]));
      this.incomingDataTrackManager.receiveSfuPublicationUpdates(h);
    }, this.handleActiveSpeakersUpdate = (l) => {
      const u = [], h = {};
      l.forEach((f) => {
        if (h[f.sid] = !0, f.sid === this.localParticipant.sid)
          this.localParticipant.audioLevel = f.level, this.localParticipant.setIsSpeaking(!0), u.push(this.localParticipant);
        else {
          const g = this.getRemoteParticipantBySid(f.sid);
          g && (g.audioLevel = f.level, g.setIsSpeaking(!0), u.push(g));
        }
      }), h[this.localParticipant.sid] || (this.localParticipant.audioLevel = 0, this.localParticipant.setIsSpeaking(!1)), this.remoteParticipants.forEach((f) => {
        h[f.sid] || (f.audioLevel = 0, f.setIsSpeaking(!1));
      }), this.activeSpeakers = u, this.emitWhenConnected(_.ActiveSpeakersChanged, u);
    }, this.handleSpeakersChanged = (l) => {
      const u = /* @__PURE__ */ new Map();
      this.activeSpeakers.forEach((f) => {
        const g = this.remoteParticipants.get(f.identity);
        g && g.sid !== f.sid || u.set(f.sid, f);
      }), l.forEach((f) => {
        let g = this.getRemoteParticipantBySid(f.sid);
        f.sid === this.localParticipant.sid && (g = this.localParticipant), g && (g.audioLevel = f.level, g.setIsSpeaking(f.active), f.active ? u.set(f.sid, g) : u.delete(f.sid));
      });
      const h = Array.from(u.values());
      h.sort((f, g) => g.audioLevel - f.audioLevel), this.activeSpeakers = h, this.emitWhenConnected(_.ActiveSpeakersChanged, h);
    }, this.handleStreamStateUpdate = (l) => {
      l.streamStates.forEach((u) => {
        const h = this.getRemoteParticipantBySid(u.participantSid);
        if (!h)
          return;
        const f = h.getTrackPublicationBySid(u.trackSid);
        if (!f || !f.track)
          return;
        const g = E.streamStateFromProto(u.state), p = f.track.streamState;
        f.track.setStreamState(g), g !== p && (h.emit(O.TrackStreamStateChanged, f, f.track.streamState), this.emitWhenConnected(_.TrackStreamStateChanged, f, f.track.streamState, h));
      });
    }, this.handleSubscriptionPermissionUpdate = (l) => {
      const u = this.getRemoteParticipantBySid(l.participantSid);
      if (!u)
        return;
      const h = u.getTrackPublicationBySid(l.trackSid);
      h && h.setAllowed(l.allowed);
    }, this.handleSubscriptionError = (l) => {
      this.cancelPendingTrackAdded(l.trackSid);
      const u = Array.from(this.remoteParticipants.values()).find((f) => f.trackPublications.has(l.trackSid));
      if (!u)
        return;
      const h = u.getTrackPublicationBySid(l.trackSid);
      h && h.setSubscriptionError(l.err);
    }, this.handleDataPacket = (l, u) => {
      const h = this.remoteParticipants.get(l.participantIdentity);
      if (l.value.case === "user")
        this.handleUserPacket(h, l.value.value, l.kind, u);
      else if (l.value.case === "transcription")
        this.handleTranscription(h, l.value.value);
      else if (l.value.case === "sipDtmf")
        this.handleSipDtmf(h, l.value.value);
      else if (l.value.case === "chatMessage")
        this.handleChatMessage(h, l.value.value);
      else if (l.value.case === "metrics")
        this.handleMetrics(l.value.value, h);
      else if (l.value.case === "streamHeader" || l.value.case === "streamChunk" || l.value.case === "streamTrailer")
        this.handleDataStream(l, u);
      else if (l.value.case === "rpcRequest") {
        const f = l.value.value;
        this.rpcServerManager.handleIncomingRpcRequest(l.participantIdentity, f);
      } else if (l.value.case === "rpcResponse") {
        const f = l.value.value;
        switch (f.value.case) {
          case "payload":
            this.rpcClientManager.handleIncomingRpcResponseSuccess(f.requestId, f.value.value);
            break;
          case "error":
            this.rpcClientManager.handleIncomingRpcResponseFailure(f.requestId, z.fromProto(f.value.value));
            break;
          default:
            this.log.warn("Unknown rpcResponse.value.case: ".concat(f.value.case), this.logContext);
            break;
        }
      } else l.value.case === "rpcAck" && this.rpcClientManager.handleIncomingRpcAck(l.value.value.requestId);
    }, this.handleUserPacket = (l, u, h, f) => {
      this.emit(_.DataReceived, u.payload, l, h, u.topic, f), l == null || l.emit(O.DataReceived, u.payload, h, f);
    }, this.handleSipDtmf = (l, u) => {
      this.emit(_.SipDTMFReceived, u, l), l == null || l.emit(O.SipDTMFReceived, u);
    }, this.handleTranscription = (l, u) => {
      const h = u.transcribedParticipantIdentity === this.localParticipant.identity ? this.localParticipant : this.getParticipantByIdentity(u.transcribedParticipantIdentity), f = h == null ? void 0 : h.trackPublications.get(u.trackId), g = xf(u, this.transcriptionReceivedTimes);
      f == null || f.emit(R.TranscriptionReceived, g), h == null || h.emit(O.TranscriptionReceived, g, f), this.emit(_.TranscriptionReceived, g, h, f);
    }, this.handleChatMessage = (l, u) => {
      const h = Nf(u);
      this.emit(_.ChatMessage, h, l);
    }, this.handleMetrics = (l, u) => {
      this.emit(_.MetricsReceived, l, u);
    }, this.handleDataStream = (l, u) => {
      this.incomingDataStreamManager.handleDataStreamPacket(l, u);
    }, this.bufferedSegments = /* @__PURE__ */ new Map(), this.handleAudioPlaybackStarted = () => {
      this.canPlaybackAudio || (this.audioEnabled = !0, this.emit(_.AudioPlaybackStatusChanged, !0));
    }, this.handleAudioPlaybackFailed = (l) => {
      this.log.warn("could not playback audio", {
        error: l
      }), this.canPlaybackAudio && (this.audioEnabled = !1, this.emit(_.AudioPlaybackStatusChanged, !1));
    }, this.handleVideoPlaybackStarted = () => {
      this.isVideoPlaybackBlocked && (this.isVideoPlaybackBlocked = !1, this.emit(_.VideoPlaybackStatusChanged, !0));
    }, this.handleVideoPlaybackFailed = () => {
      this.isVideoPlaybackBlocked || (this.isVideoPlaybackBlocked = !0, this.emit(_.VideoPlaybackStatusChanged, !1));
    }, this.handleDeviceChange = () => m(this, void 0, void 0, function* () {
      var l;
      ((l = ye()) === null || l === void 0 ? void 0 : l.os) !== "iOS" && (yield this.selectDefaultDevices()), this.emit(_.MediaDevicesChanged);
    }), this.handleRoomUpdate = (l) => {
      const u = this.roomInfo;
      this.roomInfo = l, u && u.metadata !== l.metadata && this.emitWhenConnected(_.RoomMetadataChanged, l.metadata), (u == null ? void 0 : u.activeRecording) !== l.activeRecording && this.emitWhenConnected(_.RecordingStatusChanged, l.activeRecording);
    }, this.handleConnectionQualityUpdate = (l) => {
      l.updates.forEach((u) => {
        if (u.participantSid === this.localParticipant.sid) {
          this.localParticipant.setConnectionQuality(u.quality);
          return;
        }
        const h = this.getRemoteParticipantBySid(u.participantSid);
        h && h.setConnectionQuality(u.quality);
      });
    }, this.getRemoteParticipantClientProtocol = (l) => {
      var u, h;
      return (h = (u = this.remoteParticipants.get(l)) === null || u === void 0 ? void 0 : u.clientProtocol) !== null && h !== void 0 ? h : bd;
    }, this.getRemoteParticipantCapabilities = (l) => {
      var u, h;
      return (h = (u = this.remoteParticipants.get(l)) === null || u === void 0 ? void 0 : u.capabilities) !== null && h !== void 0 ? h : [];
    }, this.getAllRemoteParticipantIdentities = () => Array.from(this.remoteParticipants.keys()), this.logWebRTCStats = () => m(this, void 0, void 0, function* () {
      var l, u, h, f;
      const g = (l = this.engine) === null || l === void 0 ? void 0 : l.pcManager;
      if (g)
        try {
          const p = yield Promise.all([g.publisher.getStats(), (u = g.subscriber) === null || u === void 0 ? void 0 : u.getStats()]), k = L(p, 2), T = k[0], S = k[1], I = T && rs(T), b = S && rs(S);
          this.statsLog.info("webrtc stats", {
            publisher: I == null ? void 0 : I.connection,
            subscriber: b == null ? void 0 : b.connection,
            inbound: [...(h = I == null ? void 0 : I.inbound) !== null && h !== void 0 ? h : [], ...(f = b == null ? void 0 : b.inbound) !== null && f !== void 0 ? f : []],
            outbound: I == null ? void 0 : I.outbound
          });
        } catch (p) {
          this.statsLog.debug("could not collect webrtc stats", {
            error: p
          });
        }
    }), this.onLocalParticipantMetadataChanged = (l) => {
      this.emit(_.ParticipantMetadataChanged, l, this.localParticipant);
    }, this.onLocalParticipantNameChanged = (l) => {
      this.emit(_.ParticipantNameChanged, l, this.localParticipant);
    }, this.onLocalAttributesChanged = (l) => {
      this.emit(_.ParticipantAttributesChanged, l, this.localParticipant);
    }, this.onLocalTrackMuted = (l) => {
      this.emit(_.TrackMuted, l, this.localParticipant);
    }, this.onLocalTrackUnmuted = (l) => {
      this.emit(_.TrackUnmuted, l, this.localParticipant);
    }, this.onTrackProcessorUpdate = (l) => {
      var u;
      (u = l == null ? void 0 : l.onPublish) === null || u === void 0 || u.call(l, this);
    }, this.onLocalTrackPublished = (l) => m(this, void 0, void 0, function* () {
      var u, h, f, g, p, k;
      (u = l.track) === null || u === void 0 || u.on(R.TrackProcessorUpdate, this.onTrackProcessorUpdate), (h = l.track) === null || h === void 0 || h.on(R.Restarted, this.onLocalTrackRestarted), (p = (g = (f = l.track) === null || f === void 0 ? void 0 : f.getProcessor()) === null || g === void 0 ? void 0 : g.onPublish) === null || p === void 0 || p.call(g, this), this.emit(_.LocalTrackPublished, l, this.localParticipant), st(l.track) && (yield l.track.checkForSilence()) && this.emit(_.LocalAudioSilenceDetected, l);
      const T = yield (k = l.track) === null || k === void 0 ? void 0 : k.getDeviceId(!1), S = cs(l.source);
      S && T && T !== this.localParticipant.activeDeviceMap.get(S) && (this.localParticipant.activeDeviceMap.set(S, T), this.emit(_.ActiveDeviceChanged, S, T));
    }), this.onLocalTrackUnpublished = (l) => {
      var u, h;
      (u = l.track) === null || u === void 0 || u.off(R.TrackProcessorUpdate, this.onTrackProcessorUpdate), (h = l.track) === null || h === void 0 || h.off(R.Restarted, this.onLocalTrackRestarted), this.emit(_.LocalTrackUnpublished, l, this.localParticipant);
    }, this.onLocalTrackRestarted = (l) => m(this, void 0, void 0, function* () {
      const u = yield l.getDeviceId(!1), h = cs(l.source);
      h && u && u !== this.localParticipant.activeDeviceMap.get(h) && (this.log.debug("local track restarted, setting ".concat(h, " ").concat(u, " active")), this.localParticipant.activeDeviceMap.set(h, u), this.emit(_.ActiveDeviceChanged, h, u));
    }), this.onLocalConnectionQualityChanged = (l) => {
      this.emit(_.ConnectionQualityChanged, l, this.localParticipant);
    }, this.onMediaDevicesError = (l, u) => {
      this.emit(_.MediaDevicesError, l, u);
    }, this.onLocalParticipantPermissionsChanged = (l) => {
      this.emit(_.ParticipantPermissionsChanged, l, this.localParticipant);
    }, this.onLocalChatMessageSent = (l) => {
      this.emit(_.ChatMessage, l, this.localParticipant);
    }, this.setMaxListeners(100), this.remoteParticipants = /* @__PURE__ */ new Map(), this.sidToIdentity = /* @__PURE__ */ new Map(), this.options = Object.assign(Object.assign({}, Qm), e), this.log = he((n = this.options.loggerName) !== null && n !== void 0 ? n : te.Room, () => this.logContext), this.statsLog = he(te.Stats, () => this.logContext), this.transcriptionReceivedTimes = /* @__PURE__ */ new Map(), this.options.audioCaptureDefaults = Object.assign(Object.assign({}, jd), e == null ? void 0 : e.audioCaptureDefaults), this.options.videoCaptureDefaults = Object.assign(Object.assign({}, Vd), e == null ? void 0 : e.videoCaptureDefaults), this.options.publishDefaults = Object.assign(Object.assign({}, Jm), e == null ? void 0 : e.publishDefaults), this.maybeCreateEngine(), this.incomingDataStreamManager = new Op((r = this.options.dataStream) === null || r === void 0 ? void 0 : r.maxPayloadByteLength), this.outgoingDataStreamManager = new Bp(this.engine, this.log, this.getRemoteParticipantClientProtocol, this.getRemoteParticipantCapabilities, this.getAllRemoteParticipantIdentities), this.incomingDataTrackManager = new Jp({
      e2eeManager: this.e2eeManager
    }), this.incomingDataTrackManager.on("sfuUpdateSubscription", (l) => {
      this.engine.client.sendUpdateDataSubscription(l.sid, l.subscribe);
    }).on("trackPublished", (l) => {
      var u;
      l.track.publisherIdentity !== this.localParticipant.identity && (this.emit(_.DataTrackPublished, l.track), (u = this.remoteParticipants.get(l.track.publisherIdentity)) === null || u === void 0 || u.addRemoteDataTrack(l.track));
    }).on("trackUnpublished", (l) => {
      var u;
      l.publisherIdentity !== this.localParticipant.identity && (this.emit(_.DataTrackUnpublished, l.sid), (u = this.remoteParticipants.get(l.publisherIdentity)) === null || u === void 0 || u.removeRemoteDataTrack(l.sid));
    }), this.outgoingDataTrackManager = new na({
      e2eeManager: this.e2eeManager
    }), this.outgoingDataTrackManager.on("sfuPublishRequest", (l) => {
      this.engine.client.sendPublishDataTrackRequest(l.handle, l.name, l.usesE2ee);
    }).on("sfuUnpublishRequest", (l) => {
      this.engine.client.sendUnPublishDataTrackRequest(l.handle);
    }).on("trackPublished", (l) => {
      this.emit(_.LocalDataTrackPublished, l.track);
    }).on("trackUnpublished", (l) => {
      this.emit(_.LocalDataTrackUnpublished, l.sid);
    }).on("packetAvailable", (l) => {
      let u = l.handle, h = l.bytes;
      this.engine.sendDataTrackFrame(h).finally(() => this.outgoingDataTrackManager.handlePacketSendComplete(u));
    }), this.registerRpcDataStreamHandler(), this.rpcClientManager = new $p(this.log, this.outgoingDataStreamManager, this.getRemoteParticipantClientProtocol, () => {
      var l;
      return (l = this.engine) === null || l === void 0 ? void 0 : l.serverVersion;
    }), this.rpcClientManager.on("sendDataPacket", (l) => {
      let u = l.packet;
      var h;
      (h = this.engine) === null || h === void 0 || h.sendDataPacket(u, V.RELIABLE);
    }), this.rpcServerManager = new Xp(this.log, this.outgoingDataStreamManager, this.getRemoteParticipantClientProtocol), this.rpcServerManager.on("sendDataPacket", (l) => {
      let u = l.packet;
      var h;
      (h = this.engine) === null || h === void 0 || h.sendDataPacket(u, V.RELIABLE);
    }), this.disconnectLock = new ue(), this.localParticipant = new rg("", "", this.engine, this.options, this.outgoingDataStreamManager, this.outgoingDataTrackManager, this.rpcClientManager, this.rpcServerManager), this.setupFrameMetadata(), (this.options.e2ee || this.options.encryption) && this.setupE2EE(), this.engine.e2eeManager = this.e2eeManager, this.incomingDataTrackManager.updateE2eeManager((s = this.e2eeManager) !== null && s !== void 0 ? s : null), this.outgoingDataTrackManager.updateE2eeManager((a = this.e2eeManager) !== null && a !== void 0 ? a : null), this.options.videoCaptureDefaults.deviceId && this.localParticipant.activeDeviceMap.set("videoinput", nn(this.options.videoCaptureDefaults.deviceId)), this.options.audioCaptureDefaults.deviceId && this.localParticipant.activeDeviceMap.set("audioinput", nn(this.options.audioCaptureDefaults.deviceId)), !((o = this.options.audioOutput) === null || o === void 0) && o.deviceId && this.switchActiveDevice("audiooutput", nn(this.options.audioOutput.deviceId)).catch((l) => this.log.warn("Could not set audio output: ".concat(l.message))), Re()) {
      const l = new AbortController();
      let u;
      if (zn.cleanupRegistry) {
        const h = new WeakRef(this);
        u = () => {
          const f = h.deref();
          f && f.handleDeviceChange();
        }, zn.cleanupRegistry.register(this, () => {
          l.abort();
        });
      } else
        u = this.handleDeviceChange;
      (d = (c = navigator.mediaDevices) === null || c === void 0 ? void 0 : c.addEventListener) === null || d === void 0 || d.call(c, "devicechange", u, {
        signal: l.signal
      });
    }
  }
  registerTextStreamHandler(e, t) {
    return this.incomingDataStreamManager.registerTextStreamHandler(e, t);
  }
  unregisterTextStreamHandler(e) {
    return this.incomingDataStreamManager.unregisterTextStreamHandler(e);
  }
  registerByteStreamHandler(e, t) {
    return this.incomingDataStreamManager.registerByteStreamHandler(e, t);
  }
  unregisterByteStreamHandler(e) {
    return this.incomingDataStreamManager.unregisterByteStreamHandler(e);
  }
  /**
   * Establishes the participant as a receiver for calls of the specified RPC method.
   *
   * @param method - The name of the indicated RPC method
   * @param handler - Will be invoked when an RPC request for this method is received
   * @returns A promise that resolves when the method is successfully registered
   * @throws {Error} If a handler for this method is already registered (must call unregisterRpcMethod first)
   *
   * @example
   * ```typescript
   * room.localParticipant?.registerRpcMethod(
   *   'greet',
   *   async (data: RpcInvocationData) => {
   *     console.log(`Received greeting from ${data.callerIdentity}: ${data.payload}`);
   *     return `Hello, ${data.callerIdentity}!`;
   *   }
   * );
   * ```
   *
   * The handler should return a Promise that resolves to a string.
   * If unable to respond within `responseTimeout`, the request will result in an error on the caller's side.
   *
   * You may throw errors of type `RpcError` with a string `message` in the handler,
   * and they will be received on the caller's side with the message intact.
   * Other errors thrown in your handler will not be transmitted as-is, and will instead arrive to the caller as `1500` ("Application Error").
   */
  registerRpcMethod(e, t) {
    this.rpcServerManager.registerRpcMethod(e, t);
  }
  /**
   * Unregisters a previously registered RPC method.
   *
   * @param method - The name of the RPC method to unregister
   */
  unregisterRpcMethod(e) {
    this.rpcServerManager.unregisterRpcMethod(e);
  }
  /**
   * @experimental
   */
  setE2EEEnabled(e) {
    return m(this, void 0, void 0, function* () {
      const t = yield this.e2eeStateMutex.lock();
      try {
        if (this.e2eeManager)
          this.isE2EEEnabled !== e && (yield this.localParticipant.setE2EEEnabled(e), this.localParticipant.identity !== "" && this.e2eeManager.setParticipantCryptorEnabled(e, this.localParticipant.identity));
        else
          throw Error("e2ee not configured, please set e2ee settings within the room options");
      } finally {
        t();
      }
    });
  }
  setupE2EE() {
    var e, t;
    const n = !!this.options.encryption, r = this.options.encryption || this.options.e2ee;
    r && ("e2eeManager" in r ? (this.e2eeManager = r.e2eeManager, this.e2eeManager.isDataChannelEncryptionEnabled = n) : this.e2eeManager = new Ut(r, n), this.e2eeManager.on(vt.ParticipantEncryptionStatusChanged, (s, a) => {
      Ff(a) && (this.isE2EEEnabled = s), this.emit(_.ParticipantEncryptionStatusChanged, s, a);
    }), this.e2eeManager.on(vt.EncryptionError, (s, a) => {
      const o = a ? this.getParticipantByIdentity(a) : void 0;
      this.emit(_.EncryptionError, s, o);
    }), (e = this.e2eeManager) === null || e === void 0 || e.setup(this), (t = this.e2eeManager) === null || t === void 0 || t.setupEngine(this.engine));
  }
  setupFrameMetadata() {
    var e;
    const t = (e = this.options.frameMetadata) !== null && e !== void 0 ? e : this.options.packetTrailer;
    this.frameMetadataManager = new Nd(t), this.frameMetadataManager.setup(this);
  }
  get logContext() {
    var e, t, n;
    return {
      room: this.name,
      roomID: (e = this.roomInfo) === null || e === void 0 ? void 0 : e.sid,
      participant: (t = this.localParticipant) === null || t === void 0 ? void 0 : t.identity,
      participantID: (n = this.localParticipant) === null || n === void 0 ? void 0 : n.sid
    };
  }
  /**
   * if the current room has a participant with `recorder: true` in its JWT grant
   **/
  get isRecording() {
    var e, t;
    return (t = (e = this.roomInfo) === null || e === void 0 ? void 0 : e.activeRecording) !== null && t !== void 0 ? t : !1;
  }
  /**
   * server assigned unique room id.
   * returns once a sid has been issued by the server.
   */
  getSid() {
    return this.state === K.Disconnected ? Ee.resolve("") : this.roomInfo && this.roomInfo.sid !== "" ? Ee.resolve(this.roomInfo.sid) : new Ee((e, t) => {
      const n = (r) => {
        r.sid !== "" && (this.engine.off(P.RoomUpdate, n), e(r.sid));
      };
      this.engine.on(P.RoomUpdate, n), this.once(_.Disconnected, () => {
        this.engine.off(P.RoomUpdate, n), t(new X("Room disconnected before room server id was available"));
      });
    });
  }
  /** user assigned name, derived from JWT token */
  get name() {
    var e, t;
    return (t = (e = this.roomInfo) === null || e === void 0 ? void 0 : e.name) !== null && t !== void 0 ? t : "";
  }
  /** room metadata */
  get metadata() {
    var e;
    return (e = this.roomInfo) === null || e === void 0 ? void 0 : e.metadata;
  }
  get numParticipants() {
    var e, t;
    return (t = (e = this.roomInfo) === null || e === void 0 ? void 0 : e.numParticipants) !== null && t !== void 0 ? t : 0;
  }
  get numPublishers() {
    var e, t;
    return (t = (e = this.roomInfo) === null || e === void 0 ? void 0 : e.numPublishers) !== null && t !== void 0 ? t : 0;
  }
  maybeCreateEngine() {
    this.engine && (this.engine.isNewlyCreated || !this.engine.isClosed) || (this.engine = new Pp(this.options), this.engine.e2eeManager = this.e2eeManager, this.engine.on(P.ParticipantUpdate, this.handleParticipantUpdates).on(P.RoomUpdate, this.handleRoomUpdate).on(P.SpeakersChanged, this.handleSpeakersChanged).on(P.StreamStateChanged, this.handleStreamStateUpdate).on(P.ConnectionQualityUpdate, this.handleConnectionQualityUpdate).on(P.SubscriptionError, this.handleSubscriptionError).on(P.SubscriptionPermissionUpdate, this.handleSubscriptionPermissionUpdate).on(P.MediaTrackAdded, (e, t, n) => {
      this.onTrackAdded(e, t, n);
    }).on(P.Disconnected, (e) => {
      this.handleDisconnect(this.options.stopLocalTrackOnUnpublish, e);
    }).on(P.ActiveSpeakersUpdate, this.handleActiveSpeakersUpdate).on(P.DataPacketReceived, this.handleDataPacket).on(P.Resuming, () => {
      this.clearConnectionReconcile(), this.isResuming = !0, this.log.debug("Resuming signal connection"), this.setAndEmitConnectionState(K.SignalReconnecting) && this.emit(_.SignalReconnecting);
    }).on(P.Resumed, () => {
      this.registerConnectionReconcile(), this.isResuming = !1, this.log.debug("Resumed signal connection"), this.updateSubscriptions(), this.setAndEmitConnectionState(K.Connected) && this.emit(_.Reconnected), this.emitBufferedEvents();
    }).on(P.SignalResumed, () => {
      (this.state === K.Reconnecting || this.isResuming) && this.sendSyncState(), this.emitBufferedEvents();
    }).on(P.Restarting, this.handleRestarting).on(P.Restarted, this.handleRestarted).on(P.SignalRestarted, this.handleSignalRestarted).on(P.Offline, () => {
      this.setAndEmitConnectionState(K.Reconnecting) && this.emit(_.Reconnecting);
    }).on(P.DCBufferStatusChanged, (e, t) => {
      this.emit(_.DCBufferStatusChanged, e, t);
    }).on(P.LocalTrackSubscribed, (e) => {
      this.handleLocalTrackSubscribed(e);
    }).on(P.RoomMoved, (e) => {
      this.log.debug("room moved", e), e.room && this.handleRoomUpdate(e.room), this.remoteParticipants.forEach((t, n) => {
        this.handleParticipantDisconnected(n, t);
      }), this.emit(_.Moved, e.room.name), e.participant ? this.handleParticipantUpdates([e.participant, ...e.otherParticipants]) : this.handleParticipantUpdates(e.otherParticipants);
    }).on(P.PublishDataTrackResponse, (e) => {
      if (!e.info) {
        this.log.warn("received PublishDataTrackResponse, but event.info was ".concat(e.info, ", so skipping."));
        return;
      }
      this.outgoingDataTrackManager.receivedSfuPublishResponse(e.info.pubHandle, {
        type: "ok",
        data: {
          sid: e.info.sid,
          pubHandle: e.info.pubHandle,
          name: e.info.name,
          usesE2ee: e.info.encryption !== G.NONE
        }
      });
    }).on(P.UnPublishDataTrackResponse, (e) => {
      if (!e.info) {
        this.log.warn("received UnPublishDataTrackResponse, but event.info was ".concat(e.info, ", so skipping."));
        return;
      }
      this.outgoingDataTrackManager.receivedSfuUnpublishResponse(e.info.pubHandle);
    }).on(P.DataTrackSubscriberHandles, (e) => {
      const t = new Map(Object.entries(e.subHandles).map((n) => {
        let r = L(n, 2), s = r[0], a = r[1];
        return [parseInt(s, 10), a.trackSid];
      }));
      this.incomingDataTrackManager.receivedSfuSubscriberHandles(t);
    }).on(P.DataTrackPacketReceived, (e) => {
      try {
        this.incomingDataTrackManager.packetReceived(e);
      } catch (t) {
        throw t;
      }
    }).on(P.Joined, (e) => {
      const t = new Map(e.otherParticipants.map((n) => [n.identity, n.dataTracks.map((r) => Pi.from(r))]));
      this.incomingDataTrackManager.receiveSfuPublicationUpdates(t);
    }).on(P.TokenRefreshed, (e) => {
      var t;
      (t = this.regionUrlProvider) === null || t === void 0 || t.updateToken(e);
    }).on(P.ServerRegionsReported, (e) => {
      var t;
      (t = this.regionUrlProvider) === null || t === void 0 || t.setServerReportedRegions({
        regionSettings: e,
        updatedAtInMs: Date.now(),
        maxAgeInMs: bs
      });
    }), this.localParticipant && this.localParticipant.setupEngine(this.engine), this.e2eeManager && this.e2eeManager.setupEngine(this.engine), this.outgoingDataStreamManager && this.outgoingDataStreamManager.setupEngine(this.engine));
  }
  createRegionStrategy() {
    return {
      getNextUrl: (e) => m(this, void 0, void 0, function* () {
        return this.regionUrlProvider ? this.regionUrlProvider.getNextBestRegionUrl(e) : null;
      }),
      resetAttempts: () => {
        var e;
        return (e = this.regionUrlProvider) === null || e === void 0 ? void 0 : e.resetAttempts();
      }
    };
  }
  /**
   * getLocalDevices abstracts navigator.mediaDevices.enumerateDevices.
   * In particular, it requests device permissions by default if needed
   * and makes sure the returned device does not consist of dummy devices
   * @param kind
   * @returns a list of available local devices
   */
  static getLocalDevices(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
    return me.getInstance().getDevices(e, t);
  }
  /**
   * prepareConnection should be called as soon as the page is loaded, in order
   * to speed up the connection attempt. This function will
   * - perform DNS resolution and pre-warm the DNS cache
   * - establish TLS connection and cache TLS keys
   *
   * With LiveKit Cloud, it will also determine the best edge data center for
   * the current client to connect to if a token is provided.
   */
  prepareConnection(e, t) {
    return m(this, void 0, void 0, function* () {
      if (this.state === K.Disconnected) {
        this.log.debug("prepareConnection to ".concat(e));
        try {
          if (un(new URL(e)) && t) {
            this.regionUrlProvider = new W(e, t);
            const n = yield this.regionUrlProvider.getNextBestRegionUrl();
            n && this.state === K.Disconnected && (this.regionUrl = n, yield fetch(Bn(n), {
              method: "HEAD"
            }), this.log.debug("prepared connection to ".concat(n)));
          } else
            yield fetch(Bn(e), {
              method: "HEAD"
            });
        } catch (n) {
          this.log.warn("could not prepare connection", {
            error: n
          });
        }
      }
    });
  }
  /**
   * retrieves a participant by identity
   * @param identity
   * @returns
   */
  getParticipantByIdentity(e) {
    return this.localParticipant.identity === e ? this.localParticipant : this.remoteParticipants.get(e);
  }
  clearConnectionFutures() {
    this.connectFuture = void 0;
  }
  /**
   * @internal for testing
   */
  simulateScenario(e, t) {
    return m(this, void 0, void 0, function* () {
      let n = () => m(this, void 0, void 0, function* () {
      }), r;
      switch (e) {
        case "signal-reconnect":
          yield this.engine.client.handleOnClose("simulate disconnect");
          break;
        case "fail-on-v1-path":
          this.engine.failNextV1Path();
          break;
        case "speaker":
          r = new Xe({
            scenario: {
              case: "speakerUpdate",
              value: 3
            }
          });
          break;
        case "node-failure":
          r = new Xe({
            scenario: {
              case: "nodeFailure",
              value: !0
            }
          });
          break;
        case "server-leave":
          r = new Xe({
            scenario: {
              case: "serverLeave",
              value: !0
            }
          });
          break;
        case "migration":
          r = new Xe({
            scenario: {
              case: "migration",
              value: !0
            }
          });
          break;
        case "resume-reconnect":
          this.engine.failNext(), yield this.engine.client.handleOnClose("simulate resume-disconnect");
          break;
        case "disconnect-signal-on-resume":
          n = () => m(this, void 0, void 0, function* () {
            yield this.engine.client.handleOnClose("simulate resume-disconnect");
          }), r = new Xe({
            scenario: {
              case: "disconnectSignalOnResume",
              value: !0
            }
          });
          break;
        case "disconnect-signal-on-resume-no-messages":
          n = () => m(this, void 0, void 0, function* () {
            yield this.engine.client.handleOnClose("simulate resume-disconnect");
          }), r = new Xe({
            scenario: {
              case: "disconnectSignalOnResumeNoMessages",
              value: !0
            }
          });
          break;
        case "full-reconnect":
          this.engine.fullReconnectOnNext = !0, yield this.engine.client.handleOnClose("simulate full-reconnect");
          break;
        case "force-tcp":
        case "force-tls":
          r = new Xe({
            scenario: {
              case: "switchCandidateProtocol",
              value: e === "force-tls" ? 2 : 1
            }
          }), n = () => m(this, void 0, void 0, function* () {
            const s = this.engine.client.onLeave;
            s && s(new Ki({
              reason: Ae.CLIENT_INITIATED,
              action: $t.RECONNECT
            }));
          });
          break;
        case "subscriber-bandwidth":
          if (t === void 0 || typeof t != "number")
            throw new Error("subscriber-bandwidth requires a number as argument");
          r = new Xe({
            scenario: {
              case: "subscriberBandwidth",
              value: Ge(t)
            }
          });
          break;
        case "leave-full-reconnect":
          r = new Xe({
            scenario: {
              case: "leaveRequestFullReconnect",
              value: !0
            }
          });
      }
      r && (yield this.engine.client.sendSimulateScenario(r), yield n());
    });
  }
  /**
   * Returns true if audio playback is enabled
   */
  get canPlaybackAudio() {
    return this.audioEnabled;
  }
  /**
   * Returns true if video playback is enabled
   */
  get canPlaybackVideo() {
    return !this.isVideoPlaybackBlocked;
  }
  getActiveDevice(e) {
    return this.localParticipant.activeDeviceMap.get(e);
  }
  /**
   * Switches all active devices used in this room to the given device.
   *
   * Note: setting AudioOutput is not supported on some browsers. See [setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId#browser_compatibility)
   *
   * @param kind use `videoinput` for camera track,
   *  `audioinput` for microphone track,
   *  `audiooutput` to set speaker for all incoming audio tracks
   * @param deviceId
   */
  switchActiveDevice(e, t) {
    return m(this, arguments, void 0, function(n, r) {
      var s = this;
      let a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !0;
      return (function* () {
        var o, c, d, l, u, h, f;
        let g = !0, p = !1;
        const k = a ? {
          exact: r
        } : r;
        if (n === "audioinput") {
          p = s.localParticipant.audioTrackPublications.size === 0;
          const T = (o = s.getActiveDevice(n)) !== null && o !== void 0 ? o : s.options.audioCaptureDefaults.deviceId;
          s.options.audioCaptureDefaults.deviceId = k;
          const S = Array.from(s.localParticipant.audioTrackPublications.values()).filter((b) => b.source === E.Source.Microphone);
          try {
            g = (yield Promise.all(S.map((b) => {
              var y;
              return (y = b.audioTrack) === null || y === void 0 ? void 0 : y.setDeviceId(k);
            }))).every((b) => b === !0);
          } catch (b) {
            throw s.options.audioCaptureDefaults.deviceId = T, b;
          }
          const I = S.some((b) => {
            var y, C;
            return (C = (y = b.track) === null || y === void 0 ? void 0 : y.isMuted) !== null && C !== void 0 ? C : !1;
          });
          g && I && (p = !0);
        } else if (n === "videoinput") {
          p = s.localParticipant.videoTrackPublications.size === 0;
          const T = (c = s.getActiveDevice(n)) !== null && c !== void 0 ? c : s.options.videoCaptureDefaults.deviceId;
          s.options.videoCaptureDefaults.deviceId = k;
          const S = Array.from(s.localParticipant.videoTrackPublications.values()).filter((b) => b.source === E.Source.Camera);
          try {
            g = (yield Promise.all(S.map((b) => {
              var y;
              return (y = b.videoTrack) === null || y === void 0 ? void 0 : y.setDeviceId(k);
            }))).every((b) => b === !0);
          } catch (b) {
            throw s.options.videoCaptureDefaults.deviceId = T, b;
          }
          const I = S.some((b) => {
            var y, C;
            return (C = (y = b.track) === null || y === void 0 ? void 0 : y.isMuted) !== null && C !== void 0 ? C : !1;
          });
          g && I && (p = !0);
        } else if (n === "audiooutput") {
          if (p = !0, !Ei() && !s.options.webAudioMix || s.options.webAudioMix && s.audioContext && !("setSinkId" in s.audioContext))
            throw new Error("cannot switch audio output, the current browser does not support it");
          s.options.webAudioMix && (r = (d = yield me.getInstance().normalizeDeviceId("audiooutput", r)) !== null && d !== void 0 ? d : ""), (l = (f = s.options).audioOutput) !== null && l !== void 0 || (f.audioOutput = {});
          const T = (u = s.getActiveDevice(n)) !== null && u !== void 0 ? u : s.options.audioOutput.deviceId;
          s.options.audioOutput.deviceId = r;
          try {
            s.options.webAudioMix && ((h = s.audioContext) === null || h === void 0 || h.setSinkId(r)), yield Promise.all(Array.from(s.remoteParticipants.values()).map((S) => S.setAudioOutput({
              deviceId: r
            })));
          } catch (S) {
            throw s.options.audioOutput.deviceId = T, S;
          }
        }
        return p && (s.localParticipant.activeDeviceMap.set(n, r), s.emit(_.ActiveDeviceChanged, n, r)), g;
      })();
    });
  }
  setupLocalParticipantEvents() {
    this.localParticipant.on(O.ParticipantMetadataChanged, this.onLocalParticipantMetadataChanged).on(O.ParticipantNameChanged, this.onLocalParticipantNameChanged).on(O.AttributesChanged, this.onLocalAttributesChanged).on(O.TrackMuted, this.onLocalTrackMuted).on(O.TrackUnmuted, this.onLocalTrackUnmuted).on(O.LocalTrackPublished, this.onLocalTrackPublished).on(O.LocalTrackUnpublished, this.onLocalTrackUnpublished).on(O.ConnectionQualityChanged, this.onLocalConnectionQualityChanged).on(O.MediaDevicesError, this.onMediaDevicesError).on(O.AudioStreamAcquired, this.startAudio).on(O.ChatMessage, this.onLocalChatMessageSent).on(O.ParticipantPermissionsChanged, this.onLocalParticipantPermissionsChanged);
  }
  recreateEngine(e) {
    const t = this.engine;
    e && t && !t.client.isDisconnected ? t.client.sendLeave().finally(() => t.close()) : t == null || t.close(), this.engine = void 0, this.isResuming = !1, this.remoteParticipants.clear(), this.sidToIdentity.clear(), this.bufferedEvents = [], this.maybeCreateEngine();
  }
  onTrackAdded(e, t, n) {
    var r, s;
    if ([K.Connecting, K.Reconnecting].includes(this.state)) {
      const f = Wa(e, t);
      this.log.debug("deferring on track for later", {
        mediaTrackId: e.id,
        mediaStreamId: t.id,
        tracksInStream: t.getTracks().map((k) => k.id)
      });
      const g = () => {
        p(), this.onTrackAdded(e, t, n);
      }, p = () => {
        if (this.off(_.Reconnected, g), this.off(_.Connected, g), this.off(_.Disconnected, p), f) {
          const k = this.pendingTrackAddedCallbacks.get(f);
          k == null || k.delete(p), (k == null ? void 0 : k.size) === 0 && this.pendingTrackAddedCallbacks.delete(f);
        }
      };
      if (this.once(_.Reconnected, g), this.once(_.Connected, g), this.once(_.Disconnected, p), f) {
        const k = (r = this.pendingTrackAddedCallbacks.get(f)) !== null && r !== void 0 ? r : /* @__PURE__ */ new Set();
        k.add(p), this.pendingTrackAddedCallbacks.set(f, k);
      }
      return;
    }
    if (this.state === K.Disconnected) {
      this.log.warn("skipping incoming track after Room disconnected");
      return;
    }
    if (e.readyState === "ended") {
      this.log.debug("skipping incoming track as it already ended");
      return;
    }
    const a = wd(t.id), o = a[0], c = a[1];
    let d = (s = Wa(e, t)) !== null && s !== void 0 ? s : e.id;
    if (o === this.localParticipant.sid) {
      this.log.warn("tried to create RemoteParticipant for local participant");
      return;
    }
    const l = Array.from(this.remoteParticipants.values()).find((f) => f.sid === o);
    if (!l) {
      o.startsWith("PA") && this.log.error("Tried to add a track for a participant, that's not present. Sid: ".concat(o));
      return;
    }
    if (!d.startsWith("TR")) {
      const f = this.engine.getTrackIdForReceiver(n);
      if (!f) {
        this.log.error("Tried to add a track whose 'sid' could not be found for a participant, that's not present. Sid: ".concat(o));
        return;
      }
      d = f;
    }
    d.startsWith("TR") || this.log.warn("Tried to add a track whose 'sid' could not be determined for a participant, that's not present. Sid: ".concat(o, ", streamId: ").concat(c, ", trackId: ").concat(d), {
      remoteParticipantID: o,
      streamId: c,
      trackId: d
    });
    let u;
    this.options.adaptiveStream && (typeof this.options.adaptiveStream == "object" ? u = this.options.adaptiveStream : u = {});
    const h = l.addSubscribedMediaTrack(e, d, t, n, u);
    h != null && h.isEncrypted && !this.e2eeManager && this.emit(_.EncryptionError, new Error("Encrypted ".concat(h.source, " track received from participant ").concat(l.sid, ", but room does not have encryption enabled!")));
  }
  cancelPendingTrackAdded(e) {
    var t;
    (t = this.pendingTrackAddedCallbacks.get(e)) === null || t === void 0 || t.forEach((n) => n());
  }
  handleLocalTrackSubscribed(e) {
    const t = () => this.localParticipant.getTrackPublications().find((c) => c.trackSid === e), n = t();
    if (n) {
      this.emitLocalTrackSubscribed(n);
      return;
    }
    this.log.debug("deferring LocalTrackSubscribed, publication not yet available", {
      subscribedSid: e
    });
    const r = 1e4;
    let s;
    const a = (c) => {
      c.trackSid === e && (o(), this.emitLocalTrackSubscribed(c));
    }, o = () => {
      clearTimeout(s), this.localParticipant.off(O.LocalTrackPublished, a), this.off(_.Disconnected, o);
    };
    this.localParticipant.on(O.LocalTrackPublished, a), this.once(_.Disconnected, o), s = setTimeout(() => {
      o();
      const c = t();
      c ? this.emitLocalTrackSubscribed(c) : this.log.warn("could not find local track publication for LocalTrackSubscribed event after timeout", {
        subscribedSid: e
      });
    }, r);
  }
  emitLocalTrackSubscribed(e) {
    this.localParticipant.emit(O.LocalTrackSubscribed, e), this.emitWhenConnected(_.LocalTrackSubscribed, e, this.localParticipant);
  }
  handleDisconnect() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0, t = arguments.length > 1 ? arguments[1] : void 0;
    var n, r;
    if (this.clearConnectionReconcile(), this.isResuming = !1, this.bufferedEvents = [], this.transcriptionReceivedTimes.clear(), this.incomingDataStreamManager.clearControllers(), this.incomingDataTrackManager.reset(), this.outgoingDataTrackManager.reset(), this.state !== K.Disconnected) {
      this.regionUrl = void 0, this.regionUrlProvider && this.regionUrlProvider.notifyDisconnected();
      try {
        this.remoteParticipants.forEach((s) => {
          s.trackPublications.forEach((a) => {
            s.unpublishTrack(a.trackSid);
          });
        }), this.localParticipant.trackPublications.forEach((s) => {
          var a, o, c;
          s.track && this.localParticipant.unpublishTrack(s.track, e), e ? ((a = s.track) === null || a === void 0 || a.detach(), (o = s.track) === null || o === void 0 || o.stop()) : (c = s.track) === null || c === void 0 || c.stopMonitor();
        }), this.localParticipant.off(O.ParticipantMetadataChanged, this.onLocalParticipantMetadataChanged).off(O.ParticipantNameChanged, this.onLocalParticipantNameChanged).off(O.AttributesChanged, this.onLocalAttributesChanged).off(O.TrackMuted, this.onLocalTrackMuted).off(O.TrackUnmuted, this.onLocalTrackUnmuted).off(O.LocalTrackPublished, this.onLocalTrackPublished).off(O.LocalTrackUnpublished, this.onLocalTrackUnpublished).off(O.ConnectionQualityChanged, this.onLocalConnectionQualityChanged).off(O.MediaDevicesError, this.onMediaDevicesError).off(O.AudioStreamAcquired, this.startAudio).off(O.ChatMessage, this.onLocalChatMessageSent).off(O.ParticipantPermissionsChanged, this.onLocalParticipantPermissionsChanged), this.localParticipant.trackPublications.clear(), this.localParticipant.videoTrackPublications.clear(), this.localParticipant.audioTrackPublications.clear(), this.remoteParticipants.clear(), this.sidToIdentity.clear(), this.activeSpeakers = [], this.audioContext && typeof this.options.webAudioMix == "boolean" && (this.audioContext.close(), this.audioContext = void 0), Re() && (window.removeEventListener("beforeunload", this.onPageLeave), window.removeEventListener("pagehide", this.onPageLeave), window.removeEventListener("freeze", this.onPageLeave), (r = (n = navigator.mediaDevices) === null || n === void 0 ? void 0 : n.removeEventListener) === null || r === void 0 || r.call(n, "devicechange", this.handleDeviceChange));
      } finally {
        this.setAndEmitConnectionState(K.Disconnected), this.emit(_.Disconnected, t);
      }
    }
  }
  handleParticipantDisconnected(e, t, n) {
    this.remoteParticipants.delete(e), t && (this.incomingDataStreamManager.validateParticipantHasNoActiveDataStreams(e), this.incomingDataTrackManager.handleRemoteParticipantDisconnected(e), t.trackPublications.forEach((r) => {
      t.unpublishTrack(r.trackSid, !0);
    }), this.emit(_.ParticipantDisconnected, t, n), t.setDisconnected(), this.rpcClientManager.handleParticipantDisconnected(t.identity));
  }
  /**
   * attempt to select the default devices if the previously selected devices are no longer available after a device change event
   */
  selectDefaultDevices() {
    return m(this, void 0, void 0, function* () {
      var e, t, n;
      const r = me.getInstance().previousDevices, s = yield me.getInstance().getDevices(void 0, !1), a = ye();
      if ((a == null ? void 0 : a.name) === "Chrome" && a.os !== "iOS")
        for (let c of s) {
          const d = r.find((l) => l.deviceId === c.deviceId);
          d && d.label !== "" && d.kind === c.kind && d.label !== c.label && this.getActiveDevice(c.kind) === "default" && this.emit(_.ActiveDeviceChanged, c.kind, c.deviceId);
        }
      const o = ["audiooutput", "audioinput", "videoinput"];
      for (let c of o) {
        const d = mf(c), l = this.localParticipant.getTrackPublication(d);
        if (l && (!((e = l.track) === null || e === void 0) && e.isUserProvided))
          continue;
        const u = s.filter((f) => f.kind === c), h = this.getActiveDevice(c);
        if (h === ((t = r.filter((f) => f.kind === c)[0]) === null || t === void 0 ? void 0 : t.deviceId) && u.length > 0 && ((n = u[0]) === null || n === void 0 ? void 0 : n.deviceId) !== h) {
          yield this.switchActiveDevice(c, u[0].deviceId);
          continue;
        }
        c === "audioinput" && !Fn() || c === "videoinput" || u.length > 0 && !u.find((f) => f.deviceId === this.getActiveDevice(c)) && // avoid switching audio output on safari without explicit user action as it leads to slowed down audio playback
        (c !== "audiooutput" || !Fn()) && (yield this.switchActiveDevice(c, u[0].deviceId));
      }
    });
  }
  acquireAudioContext() {
    return m(this, void 0, void 0, function* () {
      var e, t;
      if (typeof this.options.webAudioMix != "boolean" && this.options.webAudioMix.audioContext ? this.audioContext = this.options.webAudioMix.audioContext : (!this.audioContext || this.audioContext.state === "closed") && (this.audioContext = (e = Ws()) !== null && e !== void 0 ? e : void 0), this.options.webAudioMix && this.remoteParticipants.forEach((r) => r.setAudioContext(this.audioContext)), this.localParticipant.setAudioContext(this.audioContext), this.audioContext && this.audioContext.state === "suspended")
        try {
          yield Promise.race([this.audioContext.resume(), ke(200)]);
        } catch (r) {
          this.log.warn("Could not resume audio context", {
            error: r
          });
        }
      const n = ((t = this.audioContext) === null || t === void 0 ? void 0 : t.state) === "running";
      n !== this.canPlaybackAudio && (this.audioEnabled = n, this.emit(_.AudioPlaybackStatusChanged, n));
    });
  }
  createParticipant(e, t) {
    var n;
    let r;
    return t ? r = Ai.fromParticipantInfo(this.engine.client, t, {
      loggerContextCb: () => this.logContext,
      loggerName: this.options.loggerName
    }, this.incomingDataTrackManager) : r = new Ai(this.engine.client, "", e, void 0, void 0, void 0, {
      loggerContextCb: () => this.logContext,
      loggerName: this.options.loggerName
    }), this.options.webAudioMix && r.setAudioContext(this.audioContext), !((n = this.options.audioOutput) === null || n === void 0) && n.deviceId && r.setAudioOutput(this.options.audioOutput).catch((s) => this.log.warn("Could not set audio output: ".concat(s.message))), r;
  }
  getOrCreateParticipant(e, t) {
    if (this.remoteParticipants.has(e)) {
      const r = this.remoteParticipants.get(e);
      return t && r.updateInfo(t) && this.sidToIdentity.set(t.sid, t.identity), r;
    }
    const n = this.createParticipant(e, t);
    return this.remoteParticipants.set(e, n), this.sidToIdentity.set(t.sid, t.identity), this.emitWhenConnected(_.ParticipantConnected, n), n.on(O.TrackPublished, (r) => {
      this.emitWhenConnected(_.TrackPublished, r, n);
    }).on(O.TrackSubscribed, (r, s) => {
      r.kind === E.Kind.Audio ? (r.on(R.AudioPlaybackStarted, this.handleAudioPlaybackStarted), r.on(R.AudioPlaybackFailed, this.handleAudioPlaybackFailed)) : r.kind === E.Kind.Video && (r.on(R.VideoPlaybackFailed, this.handleVideoPlaybackFailed), r.on(R.VideoPlaybackStarted, this.handleVideoPlaybackStarted)), this.emitWhenConnected(_.TrackSubscribed, r, s, n);
    }).on(O.TrackUnpublished, (r) => {
      this.cancelPendingTrackAdded(r.trackSid), this.emit(_.TrackUnpublished, r, n);
    }).on(O.TrackUnsubscribed, (r, s) => {
      this.emit(_.TrackUnsubscribed, r, s, n);
    }).on(O.TrackMuted, (r) => {
      this.emitWhenConnected(_.TrackMuted, r, n);
    }).on(O.TrackUnmuted, (r) => {
      this.emitWhenConnected(_.TrackUnmuted, r, n);
    }).on(O.ParticipantMetadataChanged, (r) => {
      this.emitWhenConnected(_.ParticipantMetadataChanged, r, n);
    }).on(O.ParticipantNameChanged, (r) => {
      this.emitWhenConnected(_.ParticipantNameChanged, r, n);
    }).on(O.AttributesChanged, (r) => {
      this.emitWhenConnected(_.ParticipantAttributesChanged, r, n);
    }).on(O.ConnectionQualityChanged, (r) => {
      this.emitWhenConnected(_.ConnectionQualityChanged, r, n);
    }).on(O.ParticipantPermissionsChanged, (r) => {
      this.emitWhenConnected(_.ParticipantPermissionsChanged, r, n);
    }).on(O.TrackSubscriptionStatusChanged, (r, s) => {
      this.emitWhenConnected(_.TrackSubscriptionStatusChanged, r, s, n);
    }).on(O.TrackSubscriptionFailed, (r, s) => {
      this.emit(_.TrackSubscriptionFailed, r, n, s);
    }).on(O.TrackSubscriptionPermissionChanged, (r, s) => {
      this.emitWhenConnected(_.TrackSubscriptionPermissionChanged, r, s, n);
    }).on(O.Active, () => {
      this.emitWhenConnected(_.ParticipantActive, n), n.kind === Dn.AGENT && this.localParticipant.setActiveAgent(n);
    }), t && n.updateInfo(t), n;
  }
  sendSyncState() {
    const e = Array.from(this.remoteParticipants.values()).reduce((r, s) => (r.push(...s.getTrackPublications()), r), []), t = this.localParticipant.getTrackPublications(), n = this.outgoingDataTrackManager.queryPublished();
    this.engine.sendSyncState(e, t, n);
  }
  /**
   * After resuming, we'll need to notify the server of the current
   * subscription settings.
   */
  updateSubscriptions() {
    for (const e of this.remoteParticipants.values())
      for (const t of e.videoTrackPublications.values())
        t.isSubscribed && Uf(t) && t.emitTrackUpdate();
  }
  getRemoteParticipantBySid(e) {
    const t = this.sidToIdentity.get(e);
    if (t)
      return this.remoteParticipants.get(t);
  }
  /** The client capabilities this SDK advertises to other participants in its `ClientInfo`. */
  getClientInfoCapabilities(e) {
    var t;
    const n = [];
    return (jn((t = e.frameMetadata) !== null && t !== void 0 ? t : e.packetTrailer) || this.e2eeManager) && n.push(Ln.CAP_PACKET_TRAILER), Ct() && n.push(Ln.CAP_COMPRESSION_DEFLATE_RAW), n;
  }
  registerRpcDataStreamHandler() {
    this.incomingDataStreamManager.registerTextStreamHandler(cl, (e, t) => m(this, [e, t], void 0, function(n, r) {
      var s = this;
      let a = r.identity;
      return (function* () {
        var o;
        const c = (o = n.info.attributes) !== null && o !== void 0 ? o : {};
        yield s.rpcServerManager.handleIncomingDataStream(n, a, c);
      })();
    })), this.incomingDataStreamManager.registerTextStreamHandler(dl, (e, t) => m(this, [e, t], void 0, function(n, r) {
      var s = this;
      let a = r.identity;
      return (function* () {
        var o;
        const c = (o = n.info.attributes) !== null && o !== void 0 ? o : {};
        yield s.rpcClientManager.handleIncomingDataStream(n, a, c);
      })();
    }));
  }
  setStatsLogging(e) {
    e ? this.statsLogInterval || (this.statsLogInterval = Q.setInterval(() => {
      this.logWebRTCStats();
    }, cg)) : this.statsLogInterval && (Q.clearInterval(this.statsLogInterval), this.statsLogInterval = void 0);
  }
  registerConnectionReconcile() {
    this.clearConnectionReconcile();
    let e = 0;
    this.connectionReconcileInterval = Q.setInterval(() => {
      // ensure we didn't tear it down
      !this.engine || // engine detected close, but Room missed it
      this.engine.isClosed || // transports failed without notifying engine
      !this.engine.verifyTransport() ? (e++, this.log.warn("detected connection state mismatch", {
        numFailures: e,
        engine: this.engine ? {
          closed: this.engine.isClosed,
          transportsConnectedOrConnecting: this.engine.verifyTransport()
        } : void 0
      }), e >= 3 && (this.clearConnectionReconcile(), this.engine && !this.engine.isClosed ? (this.log.warn("detected connection state mismatch, attempting full reconnect"), this.engine.reconnect()) : (this.recreateEngine(), this.handleDisconnect(this.options.stopLocalTrackOnUnpublish, Ae.STATE_MISMATCH)))) : e = 0;
    }, og);
  }
  clearConnectionReconcile() {
    this.connectionReconcileInterval && Q.clearInterval(this.connectionReconcileInterval);
  }
  setAndEmitConnectionState(e) {
    return e === this.state ? !1 : (this.log.info("connection state changed: ".concat(this.state, " -> ").concat(e)), this.state = e, this.incomingDataStreamManager.setConnected(e === K.Connected), this.setStatsLogging(e === K.Connected), this.emit(_.ConnectionStateChanged, this.state), !0);
  }
  emitBufferedEvents() {
    this.bufferedEvents.forEach((e) => {
      let t = L(e, 2), n = t[0], r = t[1];
      this.emit(n, ...r);
    }), this.bufferedEvents = [];
  }
  emitWhenConnected(e) {
    for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
      n[r - 1] = arguments[r];
    if (this.state === K.Reconnecting || this.isResuming || !this.engine || this.engine.pendingReconnect)
      this.bufferedEvents.push([e, n]);
    else if (this.state === K.Connected)
      return this.emit(e, ...n);
    return !1;
  }
  /**
   * Allows to populate a room with simulated participants.
   * No actual connection to a server will be established, all state is
   * @experimental
   */
  simulateParticipants(e) {
    return m(this, void 0, void 0, function* () {
      var t, n, r, s;
      const a = Object.assign({
        audio: !0,
        video: !0,
        useRealTracks: !1
      }, e.publish), o = Object.assign({
        count: 9,
        audio: !1,
        video: !0,
        aspectRatios: [1.66, 1.7, 1.3]
      }, e.participants);
      if (this.handleDisconnect(), this.roomInfo = new Li({
        sid: "RM_SIMULATED",
        name: "simulated-room",
        emptyTimeout: 0,
        maxParticipants: 0,
        creationTime: ee.parse((/* @__PURE__ */ new Date()).getTime()),
        metadata: "",
        numParticipants: 1,
        numPublishers: 1,
        turnPassword: "",
        enabledCodecs: [],
        activeRecording: !1
      }), this.localParticipant.updateInfo(new qt({
        identity: "simulated-local",
        name: "local-name"
      })), this.setupLocalParticipantEvents(), this.emit(_.SignalConnected), this.emit(_.Connected), this.setAndEmitConnectionState(K.Connected), a.video) {
        const c = new ys(E.Kind.Video, new Jt({
          source: ce.CAMERA,
          sid: Math.floor(Math.random() * 1e4).toString(),
          type: je.AUDIO,
          name: "video-dummy"
        }), new Wn(a.useRealTracks && (!((t = window.navigator.mediaDevices) === null || t === void 0) && t.getUserMedia) ? (yield window.navigator.mediaDevices.getUserMedia({
          video: !0
        })).getVideoTracks()[0] : us(160 * ((n = o.aspectRatios[0]) !== null && n !== void 0 ? n : 1), 160, !0, !0), void 0, !1, {
          loggerName: this.options.loggerName,
          loggerContextCb: () => this.logContext
        }), {
          loggerName: this.options.loggerName,
          loggerContextCb: () => this.logContext
        });
        this.localParticipant.addTrackPublication(c), this.localParticipant.emit(O.LocalTrackPublished, c);
      }
      if (a.audio) {
        const c = new ys(E.Kind.Audio, new Jt({
          source: ce.MICROPHONE,
          sid: Math.floor(Math.random() * 1e4).toString(),
          type: je.AUDIO
        }), new Vn(a.useRealTracks && (!((r = navigator.mediaDevices) === null || r === void 0) && r.getUserMedia) ? (yield navigator.mediaDevices.getUserMedia({
          audio: !0
        })).getAudioTracks()[0] : kr(), void 0, !1, this.audioContext, {
          loggerName: this.options.loggerName,
          loggerContextCb: () => this.logContext
        }), {
          loggerName: this.options.loggerName,
          loggerContextCb: () => this.logContext
        });
        this.localParticipant.addTrackPublication(c), this.localParticipant.emit(O.LocalTrackPublished, c);
      }
      for (let c = 0; c < o.count - 1; c += 1) {
        let d = new qt({
          sid: Math.floor(Math.random() * 1e4).toString(),
          identity: "simulated-".concat(c),
          state: Yt.ACTIVE,
          tracks: [],
          joinedAt: ee.parse(Date.now())
        });
        const l = this.getOrCreateParticipant(d.identity, d);
        if (o.video) {
          const u = us(160 * ((s = o.aspectRatios[c % o.aspectRatios.length]) !== null && s !== void 0 ? s : 1), 160, !1, !0), h = new Jt({
            source: ce.CAMERA,
            sid: Math.floor(Math.random() * 1e4).toString(),
            type: je.AUDIO
          });
          l.addSubscribedMediaTrack(u, h.sid, new MediaStream([u]), new RTCRtpReceiver()), d.tracks = [...d.tracks, h];
        }
        if (o.audio) {
          const u = kr(), h = new Jt({
            source: ce.MICROPHONE,
            sid: Math.floor(Math.random() * 1e4).toString(),
            type: je.AUDIO
          });
          l.addSubscribedMediaTrack(u, h.sid, new MediaStream([u]), new RTCRtpReceiver()), d.tracks = [...d.tracks, h];
        }
        l.updateInfo(d);
      }
    });
  }
  // /** @internal */
  emit(e) {
    for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
      n[r - 1] = arguments[r];
    if (e !== _.ActiveSpeakersChanged && e !== _.TranscriptionReceived) {
      const s = hl(n).filter((a) => a !== void 0);
      (e === _.TrackSubscribed || e === _.TrackUnsubscribed) && this.log.trace("subscribe trace: ".concat(e), {
        event: e,
        args: s
      }), this.log.debug("room event ".concat(e), {
        event: e,
        args: s
      });
    }
    return super.emit(e, ...n);
  }
}
zn.cleanupRegistry = typeof FinalizationRegistry < "u" && typeof WeakRef < "u" && new FinalizationRegistry((i) => {
  i();
});
function hl(i) {
  return i.map((e) => {
    if (e)
      return Array.isArray(e) ? hl(e) : typeof e == "object" ? "logContext" in e ? e.logContext : void 0 : e;
  });
}
class dg {
  static toAgentAttributes(e) {
    return JSON.parse(e);
  }
  static agentAttributesToJson(e) {
    return JSON.stringify(e);
  }
  static toTranscriptionAttributes(e) {
    return JSON.parse(e);
  }
  static transcriptionAttributesToJson(e) {
    return JSON.stringify(e);
  }
}
var Sv = /* @__PURE__ */ Object.freeze({ __proto__: null, Convert: dg }), qe;
(function(i) {
  i[i.IDLE = 0] = "IDLE", i[i.RUNNING = 1] = "RUNNING", i[i.SKIPPED = 2] = "SKIPPED", i[i.SUCCESS = 3] = "SUCCESS", i[i.FAILED = 4] = "FAILED";
})(qe || (qe = {}));
class Rt extends Ie.EventEmitter {
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    super(), this.status = qe.IDLE, this.logs = [], this.options = {}, this.url = e, this.token = t, this.name = this.constructor.name, this.room = new zn(n.roomOptions), this.connectOptions = n.connectOptions, this.options = n;
  }
  run(e) {
    return m(this, void 0, void 0, function* () {
      if (this.status !== qe.IDLE)
        throw Error("check is running already");
      this.setStatus(qe.RUNNING);
      try {
        yield this.perform();
      } catch (t) {
        t instanceof Error && (this.options.errorsAsWarnings ? this.appendWarning(t.message) : this.appendError(t.message));
      }
      return yield this.disconnect(), yield new Promise((t) => setTimeout(t, 500)), this.status !== qe.SKIPPED && this.setStatus(this.isSuccess() ? qe.SUCCESS : qe.FAILED), e && e(), this.getInfo();
    });
  }
  isSuccess() {
    return !this.logs.some((e) => e.level === "error");
  }
  connect(e) {
    return m(this, void 0, void 0, function* () {
      return this.room.state === K.Connected ? this.room : (e || (e = this.url), yield this.room.connect(e, this.token, this.connectOptions), this.room);
    });
  }
  disconnect() {
    return m(this, void 0, void 0, function* () {
      this.room && this.room.state !== K.Disconnected && (yield this.room.disconnect(), yield new Promise((e) => setTimeout(e, 500)));
    });
  }
  skip() {
    this.setStatus(qe.SKIPPED);
  }
  switchProtocol(e) {
    return m(this, void 0, void 0, function* () {
      let t = !1, n = !1;
      if (this.room.on(_.Reconnecting, () => {
        t = !0;
      }), this.room.once(_.Reconnected, () => {
        n = !0;
      }), this.room.simulateScenario("force-".concat(e)), yield new Promise((s) => setTimeout(s, 1e3)), !t)
        return;
      const r = Date.now() + 1e4;
      for (; Date.now() < r; ) {
        if (n)
          return;
        yield ke(100);
      }
      throw new Error("Could not reconnect using ".concat(e, " protocol after 10 seconds"));
    });
  }
  appendMessage(e) {
    this.logs.push({
      level: "info",
      message: e
    }), this.emit("update", this.getInfo());
  }
  appendWarning(e) {
    this.logs.push({
      level: "warning",
      message: e
    }), this.emit("update", this.getInfo());
  }
  appendError(e) {
    this.logs.push({
      level: "error",
      message: e
    }), this.emit("update", this.getInfo());
  }
  setStatus(e) {
    this.status = e, this.emit("update", this.getInfo());
  }
  get engine() {
    var e;
    return (e = this.room) === null || e === void 0 ? void 0 : e.engine;
  }
  getInfo() {
    return {
      logs: this.logs,
      name: this.name,
      status: this.status,
      description: this.description
    };
  }
}
class lg extends Rt {
  get description() {
    return "Cloud regions";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      const e = new W(this.url, this.token);
      if (!e.isCloud()) {
        this.skip();
        return;
      }
      const t = [], n = /* @__PURE__ */ new Set();
      for (let s = 0; s < 3; s++) {
        const a = yield e.getNextBestRegionUrl();
        if (!a)
          break;
        if (n.has(a))
          continue;
        n.add(a);
        const o = yield this.checkCloudRegion(a);
        this.appendMessage("".concat(o.region, " RTT: ").concat(o.rtt, "ms, duration: ").concat(o.duration, "ms")), t.push(o);
      }
      t.sort((s, a) => (s.duration - a.duration) * 0.5 + (s.rtt - a.rtt) * 0.5);
      const r = t[0];
      this.bestStats = r, this.appendMessage("best Cloud region: ".concat(r.region));
    });
  }
  getInfo() {
    const e = super.getInfo();
    return e.data = this.bestStats, e;
  }
  checkCloudRegion(e) {
    return m(this, void 0, void 0, function* () {
      var t, n;
      yield this.connect(e), this.options.protocol === "tcp" && (yield this.switchProtocol("tcp"));
      const r = (t = this.room.serverInfo) === null || t === void 0 ? void 0 : t.region;
      if (!r)
        throw new Error("Region not found");
      const s = yield this.room.localParticipant.streamText({
        topic: "test"
      }), a = 1e3, c = 1e6 / a, d = "A".repeat(a), l = Date.now();
      for (let g = 0; g < c; g++)
        yield s.write(d);
      yield s.close();
      const u = Date.now(), h = yield (n = this.room.engine.pcManager) === null || n === void 0 ? void 0 : n.publisher.getStats(), f = {
        region: r,
        rtt: 1e4,
        duration: u - l
      };
      return h == null || h.forEach((g) => {
        g.type === "candidate-pair" && g.nominated && (f.rtt = g.currentRoundTripTime * 1e3);
      }), yield this.disconnect(), f;
    });
  }
}
const Fr = 1e4;
class ug extends Rt {
  get description() {
    return "Connection via UDP vs TCP";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      const e = yield this.checkConnectionProtocol("udp"), t = yield this.checkConnectionProtocol("tcp");
      this.bestStats = e, e.qualityLimitationDurations.bandwidth - t.qualityLimitationDurations.bandwidth > 0.5 || (e.packetsLost - t.packetsLost) / e.packetsSent > 0.01 ? (this.appendMessage("best connection quality via tcp"), this.bestStats = t) : this.appendMessage("best connection quality via udp");
      const n = this.bestStats;
      this.appendMessage("upstream bitrate: ".concat((n.bitrateTotal / n.count / 1e3 / 1e3).toFixed(2), " mbps")), this.appendMessage("RTT: ".concat((n.rttTotal / n.count * 1e3).toFixed(2), " ms")), this.appendMessage("jitter: ".concat((n.jitterTotal / n.count * 1e3).toFixed(2), " ms")), n.packetsLost > 0 && this.appendWarning("packets lost: ".concat((n.packetsLost / n.packetsSent * 100).toFixed(2), "%")), n.qualityLimitationDurations.bandwidth > 1 && this.appendWarning("bandwidth limited ".concat((n.qualityLimitationDurations.bandwidth / (Fr / 1e3) * 100).toFixed(2), "%")), n.qualityLimitationDurations.cpu > 0 && this.appendWarning("cpu limited ".concat((n.qualityLimitationDurations.cpu / (Fr / 1e3) * 100).toFixed(2), "%"));
    });
  }
  getInfo() {
    const e = super.getInfo();
    return e.data = this.bestStats, e;
  }
  checkConnectionProtocol(e) {
    return m(this, void 0, void 0, function* () {
      yield this.connect(), e === "tcp" ? yield this.switchProtocol("tcp") : yield this.switchProtocol("udp");
      const t = document.createElement("canvas");
      t.width = 1280, t.height = 720;
      const n = t.getContext("2d");
      if (!n)
        throw new Error("Could not get canvas context");
      let r = 0;
      const s = () => {
        r = (r + 1) % 360, n.fillStyle = "hsl(".concat(r, ", 100%, 50%)"), n.fillRect(0, 0, t.width, t.height), requestAnimationFrame(s);
      };
      s();
      const o = t.captureStream(30).getVideoTracks()[0], d = (yield this.room.localParticipant.publishTrack(o, {
        simulcast: !1,
        degradationPreference: "maintain-resolution",
        videoEncoding: {
          maxBitrate: 2e6
        }
      })).track, l = {
        protocol: e,
        packetsLost: 0,
        packetsSent: 0,
        qualityLimitationDurations: {},
        rttTotal: 0,
        jitterTotal: 0,
        bitrateTotal: 0,
        count: 0
      }, u = setInterval(() => m(this, void 0, void 0, function* () {
        const h = yield d.getRTCStatsReport();
        h == null || h.forEach((f) => {
          f.type === "outbound-rtp" ? (l.packetsSent = f.packetsSent, l.qualityLimitationDurations = f.qualityLimitationDurations, l.bitrateTotal += f.targetBitrate, l.count++) : f.type === "remote-inbound-rtp" && (l.packetsLost = f.packetsLost, l.rttTotal += f.roundTripTime, l.jitterTotal += f.jitter);
        });
      }), 1e3);
      return yield new Promise((h) => setTimeout(h, Fr)), clearInterval(u), o.stop(), t.remove(), yield this.disconnect(), l;
    });
  }
}
class hg extends Rt {
  get description() {
    return "Can publish audio";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.connect(), n = yield tg();
      if (yield Sd(n, 1e3))
        throw new Error("unable to detect audio from microphone");
      this.appendMessage("detected audio from microphone"), t.localParticipant.publishTrack(n), yield new Promise((o) => setTimeout(o, 3e3));
      const s = yield (e = n.sender) === null || e === void 0 ? void 0 : e.getStats();
      if (!s)
        throw new Error("Could not get RTCStats");
      let a = 0;
      if (s.forEach((o) => {
        o.type === "outbound-rtp" && (o.kind === "audio" || !o.kind && o.mediaType === "audio") && (a = o.packetsSent);
      }), a === 0)
        throw new Error("Could not determine packets are sent");
      this.appendMessage("published ".concat(a, " audio packets"));
    });
  }
}
class fg extends Rt {
  get description() {
    return "Can publish video";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.connect(), n = yield eg();
      yield this.checkForVideo(n.mediaStreamTrack), t.localParticipant.publishTrack(n), yield new Promise((a) => setTimeout(a, 5e3));
      const r = yield (e = n.sender) === null || e === void 0 ? void 0 : e.getStats();
      if (!r)
        throw new Error("Could not get RTCStats");
      let s = 0;
      if (r.forEach((a) => {
        a.type === "outbound-rtp" && (a.kind === "video" || !a.kind && a.mediaType === "video") && (s += a.packetsSent);
      }), s === 0)
        throw new Error("Could not determine packets are sent");
      this.appendMessage("published ".concat(s, " video packets"));
    });
  }
  checkForVideo(e) {
    return m(this, void 0, void 0, function* () {
      const t = new MediaStream();
      t.addTrack(e.clone());
      const n = document.createElement("video");
      n.srcObject = t, n.muted = !0, n.autoplay = !0, n.playsInline = !0, n.setAttribute("playsinline", "true"), document.body.appendChild(n), yield new Promise((r) => {
        n.onplay = () => {
          setTimeout(() => {
            var s, a, o, c;
            const d = document.createElement("canvas"), l = e.getSettings(), u = (a = (s = l.width) !== null && s !== void 0 ? s : n.videoWidth) !== null && a !== void 0 ? a : 1280, h = (c = (o = l.height) !== null && o !== void 0 ? o : n.videoHeight) !== null && c !== void 0 ? c : 720;
            d.width = u, d.height = h;
            const f = d.getContext("2d");
            f.drawImage(n, 0, 0);
            const p = f.getImageData(0, 0, d.width, d.height).data;
            let k = !0;
            for (let T = 0; T < p.length; T += 4)
              if (p[T] !== 0 || p[T + 1] !== 0 || p[T + 2] !== 0) {
                k = !1;
                break;
              }
            k ? this.appendError("camera appears to be producing only black frames") : this.appendMessage("received video frames"), r();
          }, 1e3);
        }, n.play();
      }), t.getTracks().forEach((r) => r.stop()), n.remove();
    });
  }
}
class mg extends Rt {
  get description() {
    return "Resuming connection after interruption";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      var e;
      const t = yield this.connect();
      let n = !1, r = !1, s;
      const a = new Promise((d) => {
        setTimeout(d, 5e3), s = d;
      }), o = () => {
        n = !0;
      };
      t.on(_.SignalReconnecting, o).on(_.Reconnecting, o).on(_.Reconnected, () => {
        r = !0, s(!0);
      }), (e = t.engine.client.ws) === null || e === void 0 || e.close();
      const c = t.engine.client.onClose;
      if (c && c(""), yield a, n) {
        if (!r || t.state !== K.Connected)
          throw this.appendWarning("reconnection is only possible in Redis-based configurations"), new Error("Not able to reconnect");
      } else throw new Error("Did not attempt to reconnect");
    });
  }
}
class pg extends Rt {
  get description() {
    return "Can connect via TURN";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      var e, t, n;
      un(new URL(this.url)) && (this.appendMessage("Using region specific url"), this.url = (e = yield new W(this.url, this.token).getNextBestRegionUrl()) !== null && e !== void 0 ? e : this.url);
      const r = new $s(), s = yield r.join(this.url, this.token, {
        autoSubscribe: !0,
        maxRetries: 0,
        e2eeEnabled: !1,
        websocketTimeout: 15e3
      }, void 0, !0);
      let a = !1, o = !1, c = !1;
      for (let d of s.iceServers)
        for (let l of d.urls)
          l.startsWith("turn:") ? (o = !0, c = !0) : l.startsWith("turns:") && (o = !0, c = !0, a = !0), l.startsWith("stun:") && (c = !0);
      c ? o && !a && this.appendWarning("TURN is configured server side, but TURN/TLS is unavailable.") : this.appendWarning("No STUN servers configured on server side."), yield r.close(), !((n = (t = this.connectOptions) === null || t === void 0 ? void 0 : t.rtcConfig) === null || n === void 0) && n.iceServers || o ? yield this.room.connect(this.url, this.token, {
        rtcConfig: {
          iceTransportPolicy: "relay"
        }
      }) : (this.appendWarning("No TURN servers configured."), this.skip(), yield new Promise((d) => setTimeout(d, 0)));
    });
  }
}
class gg extends Rt {
  get description() {
    return "Establishing WebRTC connection";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      let e = !1, t = !1;
      this.room.on(_.SignalConnected, () => {
        var n;
        const r = this.room.engine.client.onTrickle;
        this.room.engine.client.onTrickle = (s, a) => {
          if (s.candidate) {
            const o = new RTCIceCandidate(s);
            let c = "".concat(o.protocol, " ").concat(o.address, ":").concat(o.port, " ").concat(o.type);
            o.address && (vg(o.address) ? c += " (private)" : o.protocol === "tcp" && o.tcpType === "passive" ? (e = !0, c += " (passive)") : o.protocol === "udp" && (t = !0)), this.appendMessage(c);
          }
          r && r(s, a);
        }, !((n = this.room.engine.pcManager) === null || n === void 0) && n.subscriber && (this.room.engine.pcManager.subscriber.onIceCandidateError = (s) => {
          s instanceof RTCPeerConnectionIceErrorEvent && this.appendWarning("error with ICE candidate: ".concat(s.errorCode, " ").concat(s.errorText, " ").concat(s.url));
        });
      });
      try {
        yield this.connect(), q.info("now the room is connected");
      } catch (n) {
        throw this.appendWarning("ports need to be open on firewall in order to connect."), n;
      }
      e || this.appendWarning("Server is not configured for ICE/TCP"), t || this.appendWarning("No public IPv4 UDP candidates were found. Your server is likely not configured correctly");
    });
  }
}
function vg(i) {
  const e = i.split(".");
  if (e.length === 4) {
    if (e[0] === "10")
      return !0;
    if (e[0] === "192" && e[1] === "168")
      return !0;
    if (e[0] === "172") {
      const t = parseInt(e[1], 10);
      if (t >= 16 && t <= 31)
        return !0;
    }
  }
  return !1;
}
class bg extends Rt {
  get description() {
    return "Connecting to signal connection via WebSocket";
  }
  perform() {
    return m(this, void 0, void 0, function* () {
      var e, t, n;
      (this.url.startsWith("ws:") || this.url.startsWith("http:")) && this.appendWarning("Server is insecure, clients may block connections to it");
      let r = new $s(), s;
      try {
        s = yield r.join(this.url, this.token, {
          autoSubscribe: !0,
          maxRetries: 0,
          e2eeEnabled: !1,
          websocketTimeout: 15e3
        }, void 0, !0);
      } catch (a) {
        if (un(new URL(this.url))) {
          this.appendMessage("Initial connection failed with error ".concat(a.message, ". Retrying with region fallback"));
          const c = yield new W(this.url, this.token).getNextBestRegionUrl();
          c && (s = yield r.join(c, this.token, {
            autoSubscribe: !0,
            maxRetries: 0,
            e2eeEnabled: !1,
            websocketTimeout: 15e3
          }, void 0, !0), this.appendMessage("Fallback to region worked. To avoid initial connections failing, ensure you're calling room.prepareConnection() ahead of time"));
        }
      }
      s ? (this.appendMessage("Connected to server, version ".concat(s.serverVersion, ".")), ((e = s.serverInfo) === null || e === void 0 ? void 0 : e.edition) === mc.Cloud && (!((t = s.serverInfo) === null || t === void 0) && t.region) && this.appendMessage("LiveKit Cloud: ".concat((n = s.serverInfo) === null || n === void 0 ? void 0 : n.region))) : this.appendError("Websocket connection could not be established"), yield r.close();
    });
  }
}
class Cv extends Ie.EventEmitter {
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    super(), this.options = {}, this.checkResults = /* @__PURE__ */ new Map(), this.url = e, this.token = t, this.options = n;
  }
  getNextCheckId() {
    const e = this.checkResults.size;
    return this.checkResults.set(e, {
      logs: [],
      status: qe.IDLE,
      name: "",
      description: ""
    }), e;
  }
  updateCheck(e, t) {
    this.checkResults.set(e, t), this.emit("checkUpdate", e, t);
  }
  isSuccess() {
    return Array.from(this.checkResults.values()).every((e) => e.status !== qe.FAILED);
  }
  getResults() {
    return Array.from(this.checkResults.values());
  }
  createAndRunCheck(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.getNextCheckId(), n = new e(this.url, this.token, this.options), r = (a) => {
        this.updateCheck(t, a);
      };
      n.on("update", r);
      const s = yield n.run();
      return n.off("update", r), s;
    });
  }
  checkWebsocket() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(bg);
    });
  }
  checkWebRTC() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(gg);
    });
  }
  checkTURN() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(pg);
    });
  }
  checkReconnect() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(mg);
    });
  }
  checkPublishAudio() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(hg);
    });
  }
  checkPublishVideo() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(fg);
    });
  }
  checkConnectionProtocol() {
    return m(this, void 0, void 0, function* () {
      const e = yield this.createAndRunCheck(ug);
      if (e.data && "protocol" in e.data) {
        const t = e.data;
        this.options.protocol = t.protocol;
      }
      return e;
    });
  }
  checkCloudRegion() {
    return m(this, void 0, void 0, function* () {
      return this.createAndRunCheck(lg);
    });
  }
}
class yg {
}
class kg {
}
new TextEncoder();
const xo = new TextDecoder(), Tg = new TextDecoder("utf-8", {
  fatal: !0
});
class we extends Error {
  constructor(e, t) {
    var n;
    super(e, t), N(this, "code", "ERR_JOSE_GENERIC"), this.name = this.constructor.name, (n = Error.captureStackTrace) === null || n === void 0 || n.call(Error, this, this.constructor);
  }
}
N(we, "code", "ERR_JOSE_GENERIC");
class Sg extends we {
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "unspecified", r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "unspecified";
    super(e, {
      cause: {
        claim: n,
        reason: r,
        payload: t
      }
    }), N(this, "code", "ERR_JWT_CLAIM_VALIDATION_FAILED"), N(this, "claim", void 0), N(this, "reason", void 0), N(this, "payload", void 0), this.claim = n, this.reason = r, this.payload = t;
  }
}
N(Sg, "code", "ERR_JWT_CLAIM_VALIDATION_FAILED");
class Cg extends we {
  constructor(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "unspecified", r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "unspecified";
    super(e, {
      cause: {
        claim: n,
        reason: r,
        payload: t
      }
    }), N(this, "code", "ERR_JWT_EXPIRED"), N(this, "claim", void 0), N(this, "reason", void 0), N(this, "payload", void 0), this.claim = n, this.reason = r, this.payload = t;
  }
}
N(Cg, "code", "ERR_JWT_EXPIRED");
class Eg extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JOSE_ALG_NOT_ALLOWED");
  }
}
N(Eg, "code", "ERR_JOSE_ALG_NOT_ALLOWED");
class wg extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JOSE_NOT_SUPPORTED");
  }
}
N(wg, "code", "ERR_JOSE_NOT_SUPPORTED");
class _g extends we {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "decryption operation failed", t = arguments.length > 1 ? arguments[1] : void 0;
    super(e, t), N(this, "code", "ERR_JWE_DECRYPTION_FAILED");
  }
}
N(_g, "code", "ERR_JWE_DECRYPTION_FAILED");
class Pg extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JWE_INVALID");
  }
}
N(Pg, "code", "ERR_JWE_INVALID");
class Rg extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JWS_INVALID");
  }
}
N(Rg, "code", "ERR_JWS_INVALID");
class pt extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JWT_INVALID");
  }
}
N(pt, "code", "ERR_JWT_INVALID");
class Ig extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JWK_INVALID");
  }
}
N(Ig, "code", "ERR_JWK_INVALID");
class Mg extends we {
  constructor() {
    super(...arguments), N(this, "code", "ERR_JWKS_INVALID");
  }
}
N(Mg, "code", "ERR_JWKS_INVALID");
class Og extends we {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "no applicable key found in the JSON Web Key Set", t = arguments.length > 1 ? arguments[1] : void 0;
    super(e, t), N(this, "code", "ERR_JWKS_NO_MATCHING_KEY");
  }
}
N(Og, "code", "ERR_JWKS_NO_MATCHING_KEY");
class Ag extends we {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "multiple matching keys found in the JSON Web Key Set", t = arguments.length > 1 ? arguments[1] : void 0;
    super(e, t), N(this, Symbol.asyncIterator, Hl(function* () {
    })), N(this, "code", "ERR_JWKS_MULTIPLE_MATCHING_KEYS");
  }
}
N(Ag, "code", "ERR_JWKS_MULTIPLE_MATCHING_KEYS");
class Dg extends we {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "request timed out", t = arguments.length > 1 ? arguments[1] : void 0;
    super(e, t), N(this, "code", "ERR_JWKS_TIMEOUT");
  }
}
N(Dg, "code", "ERR_JWKS_TIMEOUT");
class Lg extends we {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "signature verification failed", t = arguments.length > 1 ? arguments[1] : void 0;
    super(e, t), N(this, "code", "ERR_JWS_SIGNATURE_VERIFICATION_FAILED");
  }
}
N(Lg, "code", "ERR_JWS_SIGNATURE_VERIFICATION_FAILED");
function xg(i) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(i);
  const e = atob(i), t = new Uint8Array(e.length);
  for (let n = 0; n < e.length; n++)
    t[n] = e.charCodeAt(n);
  return t;
}
const Br = "The input to be decoded is not correctly encoded.";
function Ng(i) {
  if (Uint8Array.fromBase64)
    try {
      return Uint8Array.fromBase64(typeof i == "string" ? i : xo.decode(i), {
        alphabet: "base64url"
      });
    } catch (t) {
      throw new TypeError(Br, {
        cause: t
      });
    }
  let e = i;
  if (e instanceof Uint8Array && (e = xo.decode(e)), e.includes("+") || e.includes("/"))
    throw new TypeError(Br);
  e = e.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return xg(e);
  } catch {
    throw new TypeError(Br);
  }
}
function Ug(i) {
  if (typeof i != "object" || i === null || Object.prototype.toString.call(i) !== "[object Object]")
    return !1;
  const e = Object.getPrototypeOf(i);
  if (e === null)
    return !0;
  let t = e;
  for (; Object.getPrototypeOf(t) !== null; )
    t = Object.getPrototypeOf(t);
  return e === t;
}
function Fg(i) {
  if (typeof i != "string") throw new pt("JWTs must use Compact JWS serialization, JWT must be a string");
  const e = i.split("."), t = e[1], n = e.length;
  if (n === 5) throw new pt("Only JWTs using Compact JWS serialization can be decoded");
  if (n !== 3) throw new pt("Invalid JWT");
  if (!t) throw new pt("JWTs must contain a payload");
  let r;
  try {
    r = Ng(t);
  } catch {
    throw new pt("Failed to base64url decode the payload");
  }
  let s;
  try {
    s = JSON.parse(Tg.decode(r));
  } catch {
    throw new pt("Failed to parse the decoded payload as JSON");
  }
  if (!Ug(s)) throw new pt("Invalid JWT Claims Set");
  return s;
}
const ks = 1e3, Bg = 60 * ks;
function qg(i) {
  const e = fl(i.participantToken);
  if (!(e != null && e.exp))
    return !1;
  const t = /* @__PURE__ */ new Date();
  if (e.nbf) {
    const s = e.nbf * ks;
    if (new Date(s) > t)
      return !1;
  }
  const n = e.exp * ks;
  return new Date(n - Bg) > t;
}
function fl(i) {
  const e = Fg(i);
  e.roomConfig;
  const t = Bs(e, ["roomConfig"]);
  return Object.assign(Object.assign({}, t), {
    roomConfig: e.roomConfig ? En.fromJson(e.roomConfig, {
      ignoreUnknownFields: !0
    }) : void 0
  });
}
function jg(i, e) {
  const t = /* @__PURE__ */ new Set([...Object.keys(i), ...Object.keys(e)]);
  for (const n of t)
    switch (n) {
      case "roomName":
      case "participantName":
      case "participantIdentity":
      case "participantMetadata":
      case "participantAttributes":
      case "agentName":
      case "agentMetadata":
      case "deployment":
        if (i[n] !== e[n])
          return !1;
        break;
      default:
        const r = n;
        throw new Error("Options key ".concat(r, " not being checked for equality!"));
    }
  return !0;
}
class ml extends kg {
  constructor() {
    super(...arguments), this.cachedFetchOptions = null, this.cachedResponse = null, this.fetchMutex = new ue();
  }
  isSameAsCachedFetchOptions(e) {
    return this.cachedFetchOptions ? jg(e, this.cachedFetchOptions) : !1;
  }
  shouldReturnCachedValueFromFetch(e) {
    return !(!this.cachedResponse || !qg(this.cachedResponse) || !this.isSameAsCachedFetchOptions(e));
  }
  getCachedResponseJwtPayload() {
    return this.cachedResponse ? fl(this.cachedResponse.participantToken) : null;
  }
  fetch(e, t) {
    return m(this, void 0, void 0, function* () {
      const n = yield this.fetchMutex.lock();
      try {
        if (t && (this.cachedResponse = null), this.shouldReturnCachedValueFromFetch(e))
          return this.cachedResponse.toJson();
        this.cachedFetchOptions = e;
        const r = yield this.update(e);
        return this.cachedResponse = r, r.toJson();
      } finally {
        n();
      }
    });
  }
}
class Vg extends yg {
  constructor(e) {
    super(), this.literalOrFn = e;
  }
  fetch() {
    return m(this, void 0, void 0, function* () {
      return typeof this.literalOrFn == "function" ? this.literalOrFn() : this.literalOrFn;
    });
  }
}
class Wg extends ml {
  constructor(e) {
    super(), this.customFn = e;
  }
  update(e) {
    return m(this, void 0, void 0, function* () {
      const t = this.customFn(e);
      let n;
      return t instanceof Promise ? n = yield t : n = t, Nc.fromJson(n, {
        // NOTE: it could be possible that the response body could contain more fields than just
        // what's in TokenSourceResponse depending on the implementation
        ignoreUnknownFields: !0
      });
    });
  }
}
class pl extends ml {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    super(), this.url = e, this.endpointOptions = t;
  }
  createRequestFromOptions(e) {
    var t, n, r, s;
    const a = new Lh();
    for (const o of Object.keys(e))
      switch (o) {
        case "roomName":
        case "participantName":
        case "participantIdentity":
        case "participantMetadata":
          a[o] = e[o];
          break;
        case "participantAttributes":
          a.participantAttributes = (t = e.participantAttributes) !== null && t !== void 0 ? t : {};
          break;
        case "agentName":
          a.roomConfig = (n = a.roomConfig) !== null && n !== void 0 ? n : new En(), a.roomConfig.agents.length === 0 && a.roomConfig.agents.push(new di()), a.roomConfig.agents[0].agentName = e.agentName;
          break;
        case "agentMetadata":
          a.roomConfig = (r = a.roomConfig) !== null && r !== void 0 ? r : new En(), a.roomConfig.agents.length === 0 && a.roomConfig.agents.push(new di()), a.roomConfig.agents[0].metadata = e.agentMetadata;
          break;
        case "deployment":
          a.roomConfig = (s = a.roomConfig) !== null && s !== void 0 ? s : new En(), a.roomConfig.agents.length === 0 && a.roomConfig.agents.push(new di()), a.roomConfig.agents[0].deployment = e.deployment;
          break;
        default:
          const c = o;
          throw new Error("Options key ".concat(c, " not being included in forming request!"));
      }
    return a;
  }
  update(e) {
    return m(this, void 0, void 0, function* () {
      var t;
      const n = this.createRequestFromOptions(e), r = yield fetch(this.url, Object.assign(Object.assign({}, this.endpointOptions), {
        method: (t = this.endpointOptions.method) !== null && t !== void 0 ? t : "POST",
        headers: Object.assign({
          "Content-Type": "application/json"
        }, this.endpointOptions.headers),
        body: n.toJsonString({
          useProtoFieldName: !0
        })
      }));
      if (!r.ok)
        throw new Error("Error generating token from endpoint ".concat(this.url, ": received ").concat(r.status, " / ").concat(yield r.text()));
      const s = yield r.json();
      return Nc.fromJson(s, {
        // NOTE: it could be possible that the response body could contain more fields than just
        // what's in TokenSourceResponse depending on the implementation (ie, DevelopmentTokenServer)
        ignoreUnknownFields: !0
      });
    });
  }
}
class gl extends pl {
  constructor(e, t) {
    const n = t.baseUrl, r = n === void 0 ? "https://cloud-api.livekit.io" : n, s = Bs(t, ["baseUrl"]);
    super("".concat(r, "/api/v2/sandbox/connection-details"), Object.assign(Object.assign({}, s), {
      headers: {
        "X-Sandbox-ID": e
      }
    }));
  }
}
class Hg extends gl {
}
const Ev = {
  /** TokenSource.literal contains a single, literal set of {@link TokenSourceResponseObject}
   * credentials, either provided directly or returned from a provided function. */
  literal(i) {
    return new Vg(i);
  },
  /**
   * TokenSource.custom allows a user to define a manual function which generates new
   * {@link TokenSourceResponseObject} values on demand.
   *
   * Use this to get credentials from custom backends / etc.
   */
  custom(i) {
    return new Wg(i);
  },
  /**
   * TokenSource.endpoint creates a token source that fetches credentials from a given URL using
   * the standard endpoint format:
   * @see https://docs.livekit.io/frontends/build/authentication/endpoint/
   */
  endpoint(i) {
    let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return new pl(i, e);
  },
  /**
   * @deprecated Use {@link TokenSource.developmentTokenServer} instead
   */
  sandboxTokenServer(i) {
    let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return new Hg(i, e);
  },
  /**
   * TokenSource.developmentTokenServer queries a development token server for credentials,
   * which supports quick prototyping / getting started types of use cases.
   *
   * This token provider is INSECURE and should NOT be used in production.
   *
   * For more info:
   * @see https://docs.livekit.io/frontends/build/authentication/sandbox-token-server/
   */
  developmentTokenServer(i) {
    let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return new gl(i, e);
  }
};
function wv(i) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var t;
  const n = Ft(i) ? i.mediaStreamTrack : i, r = n.getSettings();
  let s = {
    facingMode: (t = e.defaultFacingMode) !== null && t !== void 0 ? t : "user",
    confidence: "low"
  };
  if ("facingMode" in r) {
    const a = r.facingMode;
    q.trace("rawFacingMode", {
      rawFacingMode: a
    }), a && typeof a == "string" && zg(a) && (s = {
      facingMode: a,
      confidence: "high"
    });
  }
  if (["low", "medium"].includes(s.confidence)) {
    q.trace("Try to get facing mode from device label: (".concat(n.label, ")"));
    const a = Gg(n.label);
    a !== void 0 && (s = a);
  }
  return s;
}
const No = /* @__PURE__ */ new Map([["obs virtual camera", {
  facingMode: "environment",
  confidence: "medium"
}]]), Kg = /* @__PURE__ */ new Map([["iphone", {
  facingMode: "environment",
  confidence: "medium"
}], ["ipad", {
  facingMode: "environment",
  confidence: "medium"
}]]);
function Gg(i) {
  var e;
  const t = i.trim().toLowerCase();
  if (t !== "")
    return No.has(t) ? No.get(t) : (e = Array.from(Kg.entries()).find((n) => {
      let r = L(n, 1), s = r[0];
      return t.includes(s);
    })) === null || e === void 0 ? void 0 : e[1];
}
function zg(i) {
  return i === void 0 || ["user", "environment", "left", "right"].includes(i);
}
const vl = Symbol.for("lk.serializer");
function _v(i) {
  return typeof i == "object" && i !== null && "symbol" in i && i.symbol === vl;
}
function ra(i) {
  return Object.assign(Object.assign({}, i), {
    symbol: vl
  });
}
function Jg() {
  return ra({
    parse: (i) => JSON.parse(i),
    serialize: (i) => JSON.stringify(i)
  });
}
function Qg() {
  return ra({
    parse: (i) => i,
    serialize: (i) => i
  });
}
function Yg(i) {
  return ra(i);
}
const Pv = {
  json: Jg,
  raw: Qg,
  custom: Yg
};
export {
  ss as AudioPresets,
  Ua as BackupCodecPolicy,
  im as BaseKeyProvider,
  ns as CLIENT_PROTOCOL_DATA_STREAM_RPC,
  yd as CLIENT_PROTOCOL_DATA_STREAM_V2,
  bd as CLIENT_PROTOCOL_DEFAULT,
  qe as CheckStatus,
  Rt as Checker,
  Cv as ConnectionCheck,
  x as ConnectionError,
  J as ConnectionErrorReason,
  gt as ConnectionQuality,
  K as ConnectionState,
  Q as CriticalTimers,
  rm as CryptorError,
  wi as CryptorErrorReason,
  Ga as CryptorEvent,
  Tt as DataPacket_Kind,
  de as DataStreamError,
  ne as DataStreamErrorReason,
  Yi as DataTrackPacket,
  jh as DefaultReconnectPolicy,
  Gi as DeviceUnsupportedError,
  Ae as DisconnectReason,
  vt as EncryptionEvent,
  G as Encryption_Type,
  P as EngineEvent,
  gv as ExternalE2EEKeyProvider,
  Nd as FrameMetadataManager,
  Ka as KeyHandlerEvent,
  Et as KeyProviderEvent,
  Qe as LivekitError,
  Ue as LivekitReasonedError,
  Vn as LocalAudioTrack,
  Zi as LocalDataTrack,
  rg as LocalParticipant,
  Hd as LocalTrack,
  ys as LocalTrackPublication,
  ap as LocalTrackRecorder,
  Wn as LocalVideoTrack,
  Nn as LogLevel,
  te as LoggerNames,
  Si as MediaDeviceFailure,
  ue as Mutex,
  St as NegotiationError,
  vv as PacketTrailerManager,
  ul as Participant,
  O as ParticipantEvent,
  Dn as ParticipantKind,
  af as PublishDataError,
  xa as PublishTrackError,
  Zp as RemoteAudioTrack,
  al as RemoteDataTrack,
  Ai as RemoteParticipant,
  xd as RemoteTrack,
  ag as RemoteTrackPublication,
  Js as RemoteVideoTrack,
  zn as Room,
  _ as RoomEvent,
  z as RpcError,
  zi as ScreenSharePresets,
  Kt as SignalReconnectError,
  Na as SignalRequestError,
  Zg as SimulatedError,
  Ru as SubscriptionError,
  Ev as TokenSource,
  kg as TokenSourceConfigurable,
  yg as TokenSourceFixed,
  E as Track,
  R as TrackEvent,
  et as TrackInvalidError,
  ot as TrackPublication,
  je as TrackType,
  X as UnexpectedConnectionState,
  sf as UnsupportedServer,
  Y as VideoPreset,
  Un as VideoPresets,
  as as VideoPresets43,
  De as VideoQuality,
  jg as areTokenSourceFetchOptionsEqual,
  nm as asEncryptablePacket,
  Qt as attachToElement,
  Sv as attributes,
  lf as audioCodecs,
  rf as clientProtocol,
  Je as compareVersions,
  sv as createAudioAnalyser,
  uv as createE2EEKey,
  em as createKeyMaterialFromBuffer,
  Zf as createKeyMaterialFromString,
  tg as createLocalAudioTrack,
  Tv as createLocalScreenTracks,
  tr as createLocalTracks,
  eg as createLocalVideoTrack,
  fl as decodeTokenPayload,
  lv as deriveKeys,
  Zt as detachTrack,
  Gg as facingModeFromDeviceLabel,
  wv as facingModeFromLocalTrack,
  ye as getBrowser,
  kr as getEmptyAudioStreamTrack,
  rv as getEmptyVideoStreamTrack,
  he as getLogger,
  dv as importKey,
  av as isAudioCodec,
  nt as isAudioTrack,
  ff as isBackupCodec,
  kd as isBackupVideoCodec,
  Pf as isBrowserSupported,
  $f as isE2EESupported,
  Ks as isInsertableStreamSupported,
  Ff as isLocalParticipant,
  Ft as isLocalTrack,
  ov as isRemoteParticipant,
  hs as isRemoteTrack,
  Pt as isSVCCodec,
  Xf as isScriptTransformSupported,
  _v as isSerializer,
  Od as isVideoCodec,
  cv as isVideoFrame,
  ht as isVideoTrack,
  fv as needsRbspUnescaping,
  mv as parseRbsp,
  nf as protocolVersion,
  hv as ratchet,
  Pv as serializers,
  Xg as setLogExtension,
  $g as setLogLevel,
  Sf as supportsAV1,
  ev as supportsAdaptiveStream,
  iv as supportsAudioOutputSelection,
  tv as supportsDynacast,
  nv as supportsH265,
  Cf as supportsVP9,
  tf as version,
  hf as videoCodecs,
  pv as writeRbsp
};
