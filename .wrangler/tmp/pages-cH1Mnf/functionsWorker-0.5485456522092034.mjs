var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context: context2,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// api/guides/[[path]].js
var CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS }), "json");
async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS property_guides (
      property_id  TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at   INTEGER NOT NULL
    )
  `).run().catch(() => {
  });
}
__name(ensureTable, "ensureTable");
async function onRequest(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  if (request.method === "GET") {
    if (!property_id) return json({ error: "property_id required" }, 400);
    let guide = null;
    let source = "static";
    const db = env2.revenue_manager;
    if (db) {
      try {
        await ensureTable(db);
        const row = await db.prepare("SELECT content_json FROM property_guides WHERE property_id = ?").bind(property_id).first();
        if (row?.content_json) {
          guide = JSON.parse(row.content_json);
          source = "db";
        }
      } catch (_) {
      }
    }
    if (!guide) {
      try {
        const staticRes = await fetch(new URL(`/guides/${property_id}.json`, url.origin));
        if (staticRes.ok) {
          guide = await staticRes.json();
          source = "static";
        }
      } catch (_) {
      }
    }
    if (!guide) return json({ error: "Guide not found", property_id }, 404);
    return json({ ok: true, guide, source });
  }
  if (request.method === "POST") {
    const db = env2.revenue_manager;
    if (!db) return json({ error: "D1 binding not found" }, 503);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const { property_id: pid2, guide } = body;
    if (!pid2 || !guide) return json({ error: "property_id and guide required" }, 400);
    await ensureTable(db);
    const now = Date.now();
    guide.updated_at = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const content_json = JSON.stringify(guide);
    await db.prepare(`
      INSERT INTO property_guides (property_id, content_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(property_id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at
    `).bind(pid2, content_json, now).run();
    return json({ ok: true, property_id: pid2, saved_at: now });
  }
  return json({ error: "Method not allowed" }, 405);
}
__name(onRequest, "onRequest");

// api/rm-competitors/[[path]].js
var CORS2 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json2 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS2 }), "json");
function median(sorted) {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}
__name(median, "median");
function mean(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
__name(mean, "mean");
function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = p / 100 * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}
__name(percentile, "percentile");
async function handleList(db, url) {
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json2({ error: "property_id required" }, 400);
  const [setsRes, listingsRes] = await Promise.all([
    db.prepare(`SELECT * FROM rm_competitor_sets WHERE property_id = ? ORDER BY is_default DESC, name`).bind(property_id).all(),
    db.prepare(
      `SELECT cl.*, cs.name as set_name
         FROM rm_competitor_listings cl
         JOIN rm_competitor_sets cs ON cs.id = cl.set_id
         WHERE cl.property_id = ?
         ORDER BY cl.is_active DESC, cl.similarity_score DESC`
    ).bind(property_id).all()
  ]);
  const sets = setsRes.results || [];
  const listings = listingsRes.results || [];
  const setsWithListings = sets.map((s) => ({
    ...s,
    listings: listings.filter((l) => l.set_id === s.id)
  }));
  const competitors = listings.map((l) => ({
    ...l,
    listing_id: l.platform_listing_id,
    // alias for UI
    area_km: l.distance_km,
    standing: l.standing_estimated
  }));
  return json2({ competitor_sets: setsWithListings, competitors, total_listings: listings.length });
}
__name(handleList, "handleList");
async function handleSnapshot(db, body) {
  const { property_id, snapshots } = body;
  if (!property_id || !Array.isArray(snapshots) || !snapshots.length) {
    return json2({ error: "property_id and snapshots[] required" }, 400);
  }
  const now = Date.now();
  const insertSQL = `
    INSERT INTO rm_competitor_snapshots
      (id, listing_id, snapshot_date, observed_at, price_cents, is_available,
       min_stay_observed, source, apify_run_id, confidence, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT DO NOTHING
  `;
  const stmts = snapshots.map(
    (s) => db.prepare(insertSQL).bind(
      crypto.randomUUID(),
      s.listing_id,
      s.date,
      now,
      s.price_cents !== void 0 ? s.price_cents : null,
      s.is_available !== void 0 ? s.is_available ? 1 : 0 : null,
      s.min_stay_observed || null,
      s.source || "manual",
      s.apify_run_id || null,
      s.confidence || "medium",
      now
    )
  );
  const CHUNK = 80;
  let inserted = 0;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await db.batch(stmts.slice(i, i + CHUNK));
    inserted += Math.min(CHUNK, stmts.length - i);
  }
  return json2({ ok: true, inserted, property_id });
}
__name(handleSnapshot, "handleSnapshot");
async function handleRecalculateSignals(db, body) {
  const { property_id, horizon_days = 180 } = body;
  if (!property_id) return json2({ error: "property_id required" }, 400);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + horizon_days * 864e5).toISOString().slice(0, 10);
  const now = Date.now();
  const { results: listings } = await db.prepare(
    `SELECT cl.id, cl.similarity_score
       FROM rm_competitor_listings cl
       JOIN rm_competitor_sets cs ON cs.id = cl.set_id
       WHERE cl.property_id = ? AND cl.is_active = 1 AND cs.is_default = 1`
  ).bind(property_id).all();
  if (!listings || listings.length === 0) {
    return json2({ ok: true, property_id, message: "No active competitor listings found", signals_created: 0 });
  }
  const listingIds = listings.map((l) => l.id);
  const listingMap = {};
  for (const l of listings) listingMap[l.id] = l;
  const placeholders = listingIds.map(() => "?").join(",");
  const { results: snapshots } = await db.prepare(
    `SELECT listing_id, snapshot_date, price_cents, is_available, confidence
       FROM rm_competitor_snapshots
       WHERE listing_id IN (${placeholders}) AND snapshot_date >= ? AND snapshot_date <= ?
       ORDER BY snapshot_date ASC`
  ).bind(...listingIds, today, endDate).all();
  const byDate = {};
  for (const s of snapshots) {
    if (!byDate[s.snapshot_date]) byDate[s.snapshot_date] = [];
    byDate[s.snapshot_date].push(s);
  }
  const dates = [];
  const cur = /* @__PURE__ */ new Date(today + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  const upsertSQL = `
    INSERT INTO rm_market_signals
      (id, property_id, signal_date, calculated_at,
       competitors_total, competitors_with_data, competitors_available, competitors_unavailable,
       availability_rate, price_median_cents, price_mean_cents, price_p25_cents, price_p75_cents,
       price_min_cents, price_max_cents, high_sim_price_median,
       market_pressure_score, scarcity_score, premium_opportunity, vacancy_risk,
       data_confidence, market_label, alert_flags, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(property_id, signal_date) DO UPDATE SET
      calculated_at = excluded.calculated_at,
      competitors_total = excluded.competitors_total,
      competitors_with_data = excluded.competitors_with_data,
      competitors_available = excluded.competitors_available,
      competitors_unavailable = excluded.competitors_unavailable,
      availability_rate = excluded.availability_rate,
      price_median_cents = excluded.price_median_cents,
      price_mean_cents = excluded.price_mean_cents,
      price_p25_cents = excluded.price_p25_cents,
      price_p75_cents = excluded.price_p75_cents,
      price_min_cents = excluded.price_min_cents,
      price_max_cents = excluded.price_max_cents,
      high_sim_price_median = excluded.high_sim_price_median,
      market_pressure_score = excluded.market_pressure_score,
      scarcity_score = excluded.scarcity_score,
      premium_opportunity = excluded.premium_opportunity,
      vacancy_risk = excluded.vacancy_risk,
      data_confidence = excluded.data_confidence,
      market_label = excluded.market_label,
      alert_flags = excluded.alert_flags
  `;
  const signalStmts = [];
  for (const dateStr of dates) {
    const daySnaps = byDate[dateStr] || [];
    const total = listingIds.length;
    const withData = daySnaps.length;
    const available = daySnaps.filter((s) => s.is_available === 1).length;
    const unavailable = daySnaps.filter((s) => s.is_available === 0).length;
    const availRate = withData > 0 ? +(available / withData).toFixed(3) : null;
    const prices = daySnaps.filter((s) => s.price_cents !== null && s.price_cents > 0).map((s) => s.price_cents).sort((a, b) => a - b);
    const priceMedian = median(prices);
    const priceMean = mean(prices);
    const priceP25 = percentile(prices, 25);
    const priceP75 = percentile(prices, 75);
    const priceMin = prices.length ? prices[0] : null;
    const priceMax = prices.length ? prices[prices.length - 1] : null;
    const highSimSnaps = daySnaps.filter((s) => {
      const listing = listingMap[s.listing_id];
      return listing && (listing.similarity_score || 0) >= 70 && s.price_cents > 0;
    }).map((s) => s.price_cents).sort((a, b) => a - b);
    const highSimMedian = median(highSimSnaps);
    const pressure = availRate !== null ? Math.round((1 - availRate) * 100) : null;
    let scarcity = 20;
    if (availRate !== null) {
      if (availRate < 0.3) scarcity = 90;
      else if (availRate < 0.5) scarcity = 70;
      else if (availRate < 0.7) scarcity = 50;
    }
    const premiumOpp = Math.max(0, scarcity - 10);
    let vacancyRisk = 15;
    if (availRate !== null) {
      if (availRate > 0.7) vacancyRisk = 70;
      else if (availRate > 0.5) vacancyRisk = 40;
    }
    let marketLabel = "balanced";
    if (pressure !== null) {
      if (pressure > 70) marketLabel = "strong";
      else if (pressure < 40) marketLabel = "weak";
    }
    const dataConfidence = total > 0 ? Math.min(100, Math.round(withData / total * 100)) : 0;
    const alertFlags = [];
    if (pressure !== null && pressure > 80) alertFlags.push("high_demand");
    if (vacancyRisk > 60) alertFlags.push("low_demand");
    signalStmts.push(
      db.prepare(upsertSQL).bind(
        crypto.randomUUID(),
        property_id,
        dateStr,
        now,
        total,
        withData,
        available,
        unavailable,
        availRate,
        priceMedian,
        priceMean,
        priceP25,
        priceP75,
        priceMin,
        priceMax,
        highSimMedian,
        pressure,
        scarcity,
        premiumOpp,
        vacancyRisk,
        dataConfidence,
        marketLabel,
        JSON.stringify(alertFlags),
        now
      )
    );
  }
  const CHUNK = 50;
  let created = 0;
  for (let i = 0; i < signalStmts.length; i += CHUNK) {
    await db.batch(signalStmts.slice(i, i + CHUNK));
    created += Math.min(CHUNK, signalStmts.length - i);
  }
  return json2({ ok: true, property_id, signals_created: created, dates_range: `${today} \u2192 ${endDate}` });
}
__name(handleRecalculateSignals, "handleRecalculateSignals");
async function handleGetSignals(db, url) {
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  if (!property_id) return json2({ error: "property_id required" }, 400);
  const { results } = await db.prepare(
    `SELECT * FROM rm_market_signals
       WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?
       ORDER BY signal_date ASC`
  ).bind(property_id, from, to).all();
  return json2({ signals: results || [], count: (results || []).length });
}
__name(handleGetSignals, "handleGetSignals");
function parseCSV(text) {
  const rows = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("listing_id")) continue;
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 6) continue;
    const listing_id = cols[0] || "";
    const name = cols[1] || "";
    const platform2 = cols[2] || "airbnb";
    const capacity = cols[3] || "0";
    const bedrooms = cols[4] || "0";
    const bathrooms = cols[5] || "0";
    const has_pool = cols[6] || "0";
    const has_sea_view = cols[7] || "0";
    const area_km = cols[8] || "0";
    const standing = cols[9] || "standard";
    const notes = cols[10] || "";
    const similarity_score = cols[11] ? parseInt(cols[11]) : null;
    const priority = cols[12] || null;
    if (!listing_id || !name) continue;
    rows.push({
      listing_id: listing_id.trim(),
      name: name.trim(),
      platform: platform2.trim(),
      capacity: parseInt(capacity) || 0,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseFloat(bathrooms) || 0,
      has_pool: parseInt(has_pool) || 0,
      has_sea_view: parseInt(has_sea_view) || 0,
      area_km: parseFloat(area_km) || 0,
      standing: standing.trim(),
      notes: notes.trim(),
      similarity_score,
      priority
    });
  }
  return rows;
}
__name(parseCSV, "parseCSV");
async function handleImportListings(db, body) {
  const { property_id, csv_content } = body;
  if (!property_id) return json2({ error: "property_id required" }, 400);
  if (!csv_content) return json2({ error: "csv_content required" }, 400);
  const rows = parseCSV(csv_content);
  if (!rows.length) return json2({ error: "No valid rows found in CSV" }, 400);
  let setRow = await db.prepare(`SELECT id FROM rm_competitor_sets WHERE property_id = ? AND is_default = 1`).bind(property_id).first();
  const now = Date.now();
  if (!setRow) {
    const setId = crypto.randomUUID();
    await db.prepare(`INSERT INTO rm_competitor_sets (id, property_id, name, is_default, created_at, updated_at)
                VALUES (?, ?, ?, 1, ?, ?)`).bind(setId, property_id, "Concurrents principaux", now, now).run();
    setRow = { id: setId };
  }
  const set_id = setRow.id;
  let imported = 0;
  let errors = [];
  for (const row of rows) {
    try {
      const simScore = row.similarity_score != null && row.similarity_score > 0 ? row.similarity_score : row.standing === "premium" ? 75 : row.standing === "standard" ? 55 : 35;
      const listingUrl = `https://www.airbnb.com/rooms/${row.listing_id}`;
      const listingId = crypto.randomUUID();
      await db.prepare(`INSERT OR REPLACE INTO rm_competitor_listings
                    (id, set_id, property_id, platform, platform_listing_id, url,
                     name, capacity, bedrooms, bathrooms, has_pool, has_sea_view,
                     distance_km, standing_estimated, similarity_score, is_active, notes, created_at, updated_at)
                  VALUES (
                    COALESCE((SELECT id FROM rm_competitor_listings WHERE property_id=? AND platform_listing_id=?), ?),
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).bind(
        property_id,
        row.listing_id,
        listingId,
        set_id,
        property_id,
        row.platform,
        row.listing_id,
        listingUrl,
        row.name,
        row.capacity,
        row.bedrooms,
        row.bathrooms,
        row.has_pool,
        row.has_sea_view,
        row.area_km,
        row.standing,
        simScore,
        row.notes,
        now,
        now
      ).run();
      const savedListing = await db.prepare(`SELECT id FROM rm_competitor_listings WHERE property_id = ? AND platform_listing_id = ?`).bind(property_id, row.listing_id).first();
      const savedListingId = savedListing?.id || listingId;
      const existingCfg = await db.prepare(`SELECT id FROM rm_scraping_configs WHERE listing_id = ?`).bind(savedListingId).first();
      if (!existingCfg) {
        await db.prepare(`INSERT OR IGNORE INTO rm_scraping_configs
                      (id, listing_id, platform, platform_listing_id, scrape_url,
                       apify_actor_id, scrape_horizon_days,
                       is_active, consecutive_errors, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 365, 1, 0, ?, ?)`).bind(
          crypto.randomUUID(),
          savedListingId,
          row.platform,
          row.listing_id,
          listingUrl,
          "dtrungtin~airbnb-scraper",
          now,
          now
        ).run();
      }
      imported++;
    } catch (e) {
      errors.push(`${row.listing_id}: ${e.message}`);
    }
  }
  return json2({ ok: true, property_id, imported, total: rows.length, errors });
}
__name(handleImportListings, "handleImportListings");
async function handleExportListings(db, url) {
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json2({ error: "property_id required" }, 400);
  const { results } = await db.prepare(`SELECT * FROM rm_competitor_listings WHERE property_id = ? AND is_active = 1 ORDER BY similarity_score DESC`).bind(property_id).all();
  const lines = [
    `# Concurrents Airbnb \u2014 ${property_id}`,
    `# listing_id,name,platform,capacity,bedrooms,bathrooms,has_pool,has_sea_view,area_km,standing,notes,similarity_score,priority`,
    `listing_id,name,platform,capacity,bedrooms,bathrooms,has_pool,has_sea_view,area_km,standing,notes,similarity_score,priority`
  ];
  const getPriority = /* @__PURE__ */ __name((score) => {
    if (score >= 95) return "direct_premium";
    if (score >= 85) return "direct";
    if (score >= 70) return "secondary";
    if (score >= 50) return "tertiary";
    return "ignore";
  }, "getPriority");
  for (const r of results || []) {
    lines.push([
      r.platform_listing_id,
      r.name,
      r.platform,
      r.capacity,
      r.bedrooms,
      r.bathrooms,
      r.has_pool,
      r.has_sea_view,
      r.distance_km,
      r.standing_estimated,
      r.notes || "",
      r.similarity_score || 0,
      getPriority(r.similarity_score || 0)
    ].join(","));
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${property_id}-competitors.csv"`,
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(handleExportListings, "handleExportListings");
async function onRequest2(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS2 });
  const db = env2.revenue_manager;
  if (!db) return json2({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "GET") {
      if (path.endsWith("/signals")) return handleGetSignals(db, url);
      if (path.endsWith("/export")) return handleExportListings(db, url);
      return handleList(db, url);
    }
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (path.endsWith("/snapshot")) return handleSnapshot(db, body);
      if (path.endsWith("/recalculate-signals")) return handleRecalculateSignals(db, body);
      if (path.endsWith("/import-listings")) return handleImportListings(db, body);
      return json2({ error: "Unknown POST action. Use /snapshot, /recalculate-signals or /import-listings" }, 400);
    }
    return json2({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json2({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest2, "onRequest");

// api/rm-recommendations/[[path]].js
var CORS3 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json3 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS3 }), "json");
function findSeasonalProfile(profiles, dateStr) {
  const matching = profiles.filter(
    (p) => p.is_active && dateStr >= p.date_start && dateStr <= p.date_end
  );
  if (!matching.length) return null;
  return matching.sort((a, b) => b.priority - a.priority)[0];
}
__name(findSeasonalProfile, "findSeasonalProfile");
function getBasePrice(property, seasonType) {
  switch (seasonType) {
    case "peak":
      return property.base_price_high;
    // use high as proxy for peak
    case "high":
      return property.base_price_high;
    case "mid":
      return property.base_price_mid;
    case "low":
      return property.base_price_low;
    default:
      return property.base_price_mid;
  }
}
__name(getBasePrice, "getBasePrice");
function getMinStay(property, seasonType) {
  switch (seasonType) {
    case "peak":
    case "high":
      return property.min_stay_high;
    case "mid":
      return property.min_stay_mid;
    case "low":
      return property.min_stay_low;
    default:
      return property.min_stay_default;
  }
}
__name(getMinStay, "getMinStay");
function calcDateReco({
  property,
  dateStr,
  profiles,
  rules,
  overridesMap,
  holidayMap,
  eventsForDate,
  signalMap,
  today
}) {
  const dateObj = /* @__PURE__ */ new Date(dateStr + "T00:00:00Z");
  const dow = dateObj.getUTCDay();
  const leadTimeDays = Math.round((dateObj.getTime() - (/* @__PURE__ */ new Date(today + "T00:00:00Z")).getTime()) / 864e5);
  const isWeekend = dow === 5 || dow === 6 ? 1 : 0;
  const profile3 = findSeasonalProfile(profiles, dateStr);
  const seasonType = profile3 ? profile3.season_type : "mid";
  const profileFound = !!profile3;
  let basePrice = profile3 ? profile3.base_price_override || getBasePrice(property, seasonType) : getBasePrice(property, "mid");
  let minStay = profile3 ? profile3.min_stay_override || getMinStay(property, seasonType) : property.min_stay_default;
  let adjWeekend = 0;
  let adjHoliday = 0;
  let adjEvent = 0;
  let adjLeadTime = 0;
  let adjMarket = 0;
  let adjGapFill = 0;
  const factors = [];
  const activeRules = rules.filter((r) => {
    if (!r.is_active) return false;
    if (r.property_id && r.property_id !== property.id) return false;
    if (r.valid_from && dateStr < r.valid_from) return false;
    if (r.valid_until && dateStr > r.valid_until) return false;
    return true;
  }).sort((a, b) => a.priority - b.priority);
  for (const rule of activeRules) {
    if (rule.condition_season) {
      const seasons = rule.condition_season.split(",").map((s) => s.trim());
      if (!seasons.includes(seasonType)) continue;
    }
    if (rule.condition_dow) {
      const dows = rule.condition_dow.split(",").map((d) => parseInt(d.trim(), 10));
      if (!dows.includes(dow)) continue;
    }
    if (rule.condition_lead_time_min !== null && rule.condition_lead_time_min !== void 0) {
      if (leadTimeDays < rule.condition_lead_time_min) continue;
    }
    if (rule.condition_lead_time_max !== null && rule.condition_lead_time_max !== void 0) {
      if (leadTimeDays > rule.condition_lead_time_max) continue;
    }
    let rawAdj = 0;
    if (rule.adjustment_type === "fixed_cents") {
      rawAdj = rule.adjustment_value;
    } else if (rule.adjustment_type === "percent") {
      rawAdj = Math.round(basePrice * rule.adjustment_value / 100);
    } else if (rule.adjustment_type === "replace") {
      basePrice = rule.adjustment_value;
      continue;
    }
    if (rule.max_adjustment_cents && Math.abs(rawAdj) > rule.max_adjustment_cents) {
      rawAdj = rawAdj > 0 ? rule.max_adjustment_cents : -rule.max_adjustment_cents;
    }
    if (rule.rule_type === "weekend_uplift") {
      adjWeekend += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "weekend" });
    } else if (rule.rule_type === "holiday_uplift") {
    } else if (rule.rule_type === "event_uplift") {
    } else if (rule.rule_type === "lead_time_discount") {
      adjLeadTime += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "lead_time" });
    } else if (rule.rule_type === "far_out_markup") {
      adjLeadTime += rawAdj;
      factors.push({ rule: rule.name, adj: rawAdj, type: "far_out" });
    }
  }
  const holiday = holidayMap[dateStr];
  let isHoliday = 0;
  let holidayName = null;
  if (holiday) {
    isHoliday = 1;
    holidayName = holiday.name;
    const holidayRule = activeRules.find((r) => r.rule_type === "holiday_uplift");
    if (holidayRule && holidayRule.adjustment_type === "percent") {
      const adj = Math.round(basePrice * holidayRule.adjustment_value / 100);
      adjHoliday += adj;
      factors.push({ rule: holidayRule.name, adj, type: "holiday", holiday: holiday.name });
    }
  }
  let isEvent = 0;
  let eventName = null;
  if (eventsForDate.length > 0) {
    isEvent = 1;
    eventName = eventsForDate[0].name;
    const eventRule = activeRules.find((r) => r.rule_type === "event_uplift");
    if (eventRule && eventRule.adjustment_type === "percent") {
      let affected = true;
      try {
        const ap = JSON.parse(eventsForDate[0].affects_properties || "[]");
        if (ap.length > 0 && !ap.includes(property.id)) affected = false;
      } catch (_) {
      }
      if (affected) {
        const adj = Math.round(basePrice * eventRule.adjustment_value / 100);
        adjEvent += adj;
        factors.push({ rule: eventRule.name, adj, type: "event", event: eventName });
      }
    }
  }
  const override = overridesMap[dateStr];
  let overridePriceCents = null;
  let overrideMinStay = null;
  let overrideReason = null;
  if (override) {
    if (override.override_type === "price" && override.is_active) {
      overridePriceCents = override.value_cents;
    } else if (override.override_type === "min_stay" && override.is_active) {
      overrideMinStay = override.value_int;
    }
    overrideReason = override.reason;
  }
  const signal = signalMap[dateStr];
  if (signal) {
    if ((signal.market_pressure_score || 0) > 70) {
      const adj = Math.round(basePrice * 0.05);
      adjMarket += adj;
      factors.push({ type: "market_high", adj, pressure: signal.market_pressure_score });
    } else if ((signal.market_pressure_score || 0) < 30) {
      const adj = Math.round(basePrice * -0.05);
      adjMarket += adj;
      factors.push({ type: "market_low", adj, pressure: signal.market_pressure_score });
    }
  }
  let finalPrice = basePrice + adjWeekend + adjHoliday + adjEvent + adjLeadTime + adjMarket + adjGapFill;
  const effectivePrice = overridePriceCents !== null ? overridePriceCents : finalPrice;
  const effectiveMinStay = overrideMinStay !== null ? overrideMinStay : minStay;
  const clampedPrice = Math.max(property.price_min, Math.min(property.price_max, effectivePrice));
  let confidence = 50;
  if (signal && (signal.data_confidence || 0) > 60) confidence += 20;
  if (profileFound) confidence += 10;
  if (leadTimeDays > 30) confidence += 10;
  if (!signal) confidence -= 20;
  if (adjGapFill < 0) confidence -= 10;
  confidence = Math.max(0, Math.min(100, confidence));
  let vacancyRisk = 20;
  if (leadTimeDays < 14) {
    vacancyRisk = 80 + Math.min(19, 14 - leadTimeDays);
  } else if (leadTimeDays < 30) {
    vacancyRisk = 50 + Math.round((30 - leadTimeDays) / 16 * 29);
  } else if (signal && signal.availability_rate !== null) {
    vacancyRisk = Math.round((signal.availability_rate || 0.5) * 40);
  }
  vacancyRisk = Math.max(0, Math.min(100, vacancyRisk));
  let premiumOpportunity = 0;
  if (signal && (signal.scarcity_score || 0) > 70) {
    premiumOpportunity = 75 + Math.min(24, signal.scarcity_score - 70);
  } else if (isHoliday || isEvent) {
    premiumOpportunity = 60 + (isHoliday ? 10 : 0) + (isEvent ? 10 : 0);
  } else if (signal) {
    premiumOpportunity = Math.max(0, signal.premium_opportunity || 0);
  }
  premiumOpportunity = Math.max(0, Math.min(100, premiumOpportunity));
  const alertFlags = [];
  if (vacancyRisk > 70) alertFlags.push("vacancy_risk_high");
  if (premiumOpportunity > 70) alertFlags.push("premium_opportunity");
  if (leadTimeDays < 7 && vacancyRisk > 60) alertFlags.push("last_minute_unbooked");
  if (isHoliday) alertFlags.push(`holiday:${holidayName}`);
  if (isEvent) alertFlags.push(`event:${eventName}`);
  const priceFmt = (clampedPrice / 100).toFixed(0);
  const seasonLabel = { low: "basse saison", mid: "mi-saison", high: "haute saison", peak: "pleine saison" }[seasonType] || seasonType;
  let summary = `${dateStr} \u2014 ${priceFmt}\u20AC/nuit (${seasonLabel}`;
  if (isWeekend) summary += ", week-end";
  if (isHoliday) summary += `, ${holidayName}`;
  if (isEvent) summary += `, ${eventName}`;
  summary += `)`;
  if (vacancyRisk > 70) summary += " \u26A0\uFE0F risque vacance";
  if (premiumOpportunity > 70) summary += " \u2728 opportunit\xE9 premium";
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    property_id: property.id,
    date: dateStr,
    calculated_at: now,
    recommended_price_cents: clampedPrice,
    recommended_min_stay: effectiveMinStay,
    base_price_cents: basePrice,
    adj_weekday_cents: isWeekend ? 0 : 0,
    adj_weekend_cents: adjWeekend,
    adj_holiday_cents: adjHoliday,
    adj_event_cents: adjEvent,
    adj_lead_time_cents: adjLeadTime,
    adj_market_cents: adjMarket,
    adj_gap_fill_cents: adjGapFill,
    adj_premium_cents: 0,
    confidence_score: confidence,
    market_pressure_score: signal ? signal.market_pressure_score : null,
    vacancy_risk_score: vacancyRisk,
    premium_opportunity: premiumOpportunity,
    status: "pending",
    override_price_cents: overridePriceCents,
    override_min_stay: overrideMinStay,
    override_reason: overrideReason,
    currently_published_cents: null,
    alert_flags: JSON.stringify(alertFlags),
    season_type: seasonType,
    is_weekend: isWeekend,
    is_holiday: isHoliday,
    holiday_name: holidayName,
    is_event: isEvent,
    event_name: eventName,
    lead_time_days: leadTimeDays,
    summary_fr: summary,
    factors_json: JSON.stringify(factors),
    reviewed_at: null,
    published_at: null,
    created_at: now,
    updated_at: now
  };
}
__name(calcDateReco, "calcDateReco");
async function handleGet(request, db) {
  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  const status = url.searchParams.get("status");
  if (!property_id) return json3({ error: "property_id required" }, 400);
  let q = `SELECT * FROM rm_recommendations WHERE property_id = ? AND date >= ? AND date <= ?`;
  const binds = [property_id, from, to];
  if (status) {
    q += ` AND status = ?`;
    binds.push(status);
  }
  q += ` ORDER BY date ASC`;
  const { results } = await db.prepare(q).bind(...binds).all();
  return json3({ recommendations: results, count: results.length });
}
__name(handleGet, "handleGet");
async function handleCalculate(db, body) {
  const { property_id } = body;
  if (!property_id) return json3({ error: "property_id required" }, 400);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  const [propRes, profilesRes, rulesRes, overridesRes, holidaysRes, eventsRes, signalsRes] = await Promise.all([
    db.prepare(`SELECT * FROM rm_properties WHERE id = ? AND is_active = 1`).bind(property_id).first(),
    db.prepare(`SELECT * FROM rm_seasonal_profiles WHERE property_id = ? AND is_active = 1`).bind(property_id).all(),
    db.prepare(`SELECT * FROM rm_pricing_rules WHERE (property_id = ? OR property_id IS NULL) AND is_active = 1`).bind(property_id).all(),
    db.prepare(`SELECT * FROM rm_overrides WHERE property_id = ? AND is_active = 1 AND date >= ? AND date <= ?`).bind(property_id, today, endDate).all(),
    db.prepare(`SELECT * FROM rm_holidays WHERE date >= ? AND date <= ?`).bind(today, endDate).all(),
    db.prepare(`SELECT * FROM rm_events WHERE date_start <= ? AND date_end >= ?`).bind(endDate, today).all(),
    db.prepare(`SELECT * FROM rm_market_signals WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?`).bind(property_id, today, endDate).all()
  ]);
  if (!propRes) return json3({ error: "Property not found or inactive" }, 404);
  const profiles = profilesRes.results || [];
  const rules = rulesRes.results || [];
  const overrides = overridesRes.results || [];
  const holidays = holidaysRes.results || [];
  const events = eventsRes.results || [];
  const signals = signalsRes.results || [];
  const overridesMap = {};
  for (const o of overrides) overridesMap[o.date] = o;
  const holidayMap = {};
  for (const h of holidays) holidayMap[h.date] = h;
  const signalMap = {};
  for (const s of signals) signalMap[s.signal_date] = s;
  const dates = [];
  const cur = /* @__PURE__ */ new Date(today + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  const eventsByDate = {};
  for (const d of dates) {
    eventsByDate[d] = events.filter((e) => d >= e.date_start && d <= e.date_end);
  }
  const recos = dates.map(
    (dateStr) => calcDateReco({
      property: propRes,
      dateStr,
      profiles,
      rules,
      overridesMap,
      holidayMap,
      eventsForDate: eventsByDate[dateStr] || [],
      signalMap,
      today
    })
  );
  const upsertSQL = `
    INSERT INTO rm_recommendations
      (id, property_id, date, calculated_at, recommended_price_cents, recommended_min_stay,
       base_price_cents, adj_weekday_cents, adj_weekend_cents, adj_holiday_cents, adj_event_cents,
       adj_lead_time_cents, adj_market_cents, adj_gap_fill_cents, adj_premium_cents,
       confidence_score, market_pressure_score, vacancy_risk_score, premium_opportunity,
       status, override_price_cents, override_min_stay, override_reason, currently_published_cents,
       alert_flags, season_type, is_weekend, is_holiday, holiday_name, is_event, event_name,
       lead_time_days, summary_fr, factors_json, reviewed_at, published_at, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(property_id, date) DO UPDATE SET
      calculated_at = excluded.calculated_at,
      recommended_price_cents = excluded.recommended_price_cents,
      recommended_min_stay = excluded.recommended_min_stay,
      base_price_cents = excluded.base_price_cents,
      adj_weekend_cents = excluded.adj_weekend_cents,
      adj_holiday_cents = excluded.adj_holiday_cents,
      adj_event_cents = excluded.adj_event_cents,
      adj_lead_time_cents = excluded.adj_lead_time_cents,
      adj_market_cents = excluded.adj_market_cents,
      adj_gap_fill_cents = excluded.adj_gap_fill_cents,
      confidence_score = excluded.confidence_score,
      market_pressure_score = excluded.market_pressure_score,
      vacancy_risk_score = excluded.vacancy_risk_score,
      premium_opportunity = excluded.premium_opportunity,
      alert_flags = excluded.alert_flags,
      season_type = excluded.season_type,
      is_weekend = excluded.is_weekend,
      is_holiday = excluded.is_holiday,
      holiday_name = excluded.holiday_name,
      is_event = excluded.is_event,
      event_name = excluded.event_name,
      lead_time_days = excluded.lead_time_days,
      summary_fr = excluded.summary_fr,
      factors_json = excluded.factors_json,
      updated_at = excluded.updated_at
  `;
  const CHUNK = 50;
  let processed = 0;
  for (let i = 0; i < recos.length; i += CHUNK) {
    const chunk = recos.slice(i, i + CHUNK);
    const stmts = chunk.map(
      (r) => db.prepare(upsertSQL).bind(
        r.id,
        r.property_id,
        r.date,
        r.calculated_at,
        r.recommended_price_cents,
        r.recommended_min_stay,
        r.base_price_cents,
        r.adj_weekday_cents,
        r.adj_weekend_cents,
        r.adj_holiday_cents,
        r.adj_event_cents,
        r.adj_lead_time_cents,
        r.adj_market_cents,
        r.adj_gap_fill_cents,
        r.adj_premium_cents,
        r.confidence_score,
        r.market_pressure_score,
        r.vacancy_risk_score,
        r.premium_opportunity,
        r.status,
        r.override_price_cents,
        r.override_min_stay,
        r.override_reason,
        r.currently_published_cents,
        r.alert_flags,
        r.season_type,
        r.is_weekend,
        r.is_holiday,
        r.holiday_name,
        r.is_event,
        r.event_name,
        r.lead_time_days,
        r.summary_fr,
        r.factors_json,
        r.reviewed_at,
        r.published_at,
        r.created_at,
        r.updated_at
      )
    );
    await db.batch(stmts);
    processed += chunk.length;
  }
  return json3({ ok: true, property_id, dates_calculated: processed });
}
__name(handleCalculate, "handleCalculate");
async function handleApprove(db, body) {
  const { property_id, date, price_override, min_stay_override, reason } = body;
  if (!property_id || !date) return json3({ error: "property_id and date required" }, 400);
  const now = Date.now();
  const existing = await db.prepare(`SELECT * FROM rm_recommendations WHERE property_id = ? AND date = ?`).bind(property_id, date).first();
  if (!existing) return json3({ error: "Recommendation not found" }, 404);
  const newStatus = price_override || min_stay_override ? "overridden" : "approved";
  await db.prepare(
    `UPDATE rm_recommendations SET
        status = ?, override_price_cents = ?, override_min_stay = ?, override_reason = ?,
        reviewed_at = ?, updated_at = ?
       WHERE property_id = ? AND date = ?`
  ).bind(
    newStatus,
    price_override || null,
    min_stay_override || null,
    reason || null,
    now,
    now,
    property_id,
    date
  ).run();
  const updated = await db.prepare(`SELECT * FROM rm_recommendations WHERE property_id = ? AND date = ?`).bind(property_id, date).first();
  return json3({ ok: true, recommendation: updated });
}
__name(handleApprove, "handleApprove");
async function handleReject(db, body) {
  const { property_id, date, reason } = body;
  if (!property_id || !date) return json3({ error: "property_id and date required" }, 400);
  const now = Date.now();
  await db.prepare(
    `UPDATE rm_recommendations SET status = 'rejected', override_reason = ?, reviewed_at = ?, updated_at = ?
       WHERE property_id = ? AND date = ?`
  ).bind(reason || null, now, now, property_id, date).run();
  return json3({ ok: true });
}
__name(handleReject, "handleReject");
async function handleDeleteOverride(db, url) {
  const property_id = url.searchParams.get("property_id");
  const date = url.searchParams.get("date");
  if (!property_id || !date) return json3({ error: "property_id and date required" }, 400);
  const now = Date.now();
  await db.prepare(
    `UPDATE rm_recommendations SET
        status = 'pending', override_price_cents = NULL, override_min_stay = NULL,
        override_reason = NULL, reviewed_at = NULL, updated_at = ?
       WHERE property_id = ? AND date = ?`
  ).bind(now, property_id, date).run();
  return json3({ ok: true });
}
__name(handleDeleteOverride, "handleDeleteOverride");
async function onRequest3(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS3 });
  const db = env2.revenue_manager;
  if (!db) return json3({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "GET") {
      return handleGet(request, db);
    }
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (path.endsWith("/calculate")) return handleCalculate(db, body);
      if (path.endsWith("/approve")) return handleApprove(db, body);
      if (path.endsWith("/reject")) return handleReject(db, body);
      return json3({ error: "Unknown POST action. Use /calculate, /approve, or /reject" }, 400);
    }
    if (request.method === "DELETE") {
      if (path.endsWith("/override")) return handleDeleteOverride(db, url);
      return json3({ error: "Unknown DELETE action" }, 400);
    }
    return json3({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json3({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest3, "onRequest");

// api/rm-rules/[[path]].js
var CORS4 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json4 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS4 }), "json");
async function handleGet2(db, url) {
  const property_id = url.searchParams.get("property_id");
  let q, binds;
  if (property_id) {
    q = `SELECT * FROM rm_pricing_rules WHERE (property_id = ? OR property_id IS NULL) ORDER BY priority ASC, rule_type`;
    binds = [property_id];
  } else {
    q = `SELECT * FROM rm_pricing_rules ORDER BY priority ASC, rule_type`;
    binds = [];
  }
  const { results } = await db.prepare(q).bind(...binds).all();
  return json4({ rules: results || [], count: (results || []).length });
}
__name(handleGet2, "handleGet");
async function handlePost(db, body) {
  const {
    property_id,
    rule_type,
    name,
    description,
    params,
    adjustment_type,
    adjustment_value,
    condition_season,
    condition_lead_time_min,
    condition_lead_time_max,
    condition_dow,
    max_adjustment_cents,
    priority,
    valid_from,
    valid_until
  } = body;
  if (!rule_type || !name || !adjustment_type || adjustment_value === void 0) {
    return json4({ error: "rule_type, name, adjustment_type, and adjustment_value are required" }, 400);
  }
  const validAdjTypes = ["fixed_cents", "percent", "replace"];
  if (!validAdjTypes.includes(adjustment_type)) {
    return json4({ error: `adjustment_type must be one of: ${validAdjTypes.join(", ")}` }, 400);
  }
  const now = Date.now();
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO rm_pricing_rules
        (id, property_id, rule_type, name, description, params, adjustment_type, adjustment_value,
         condition_season, condition_lead_time_min, condition_lead_time_max, condition_dow,
         max_adjustment_cents, priority, is_active, valid_from, valid_until, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?)`
  ).bind(
    id,
    property_id || null,
    rule_type,
    name,
    description || null,
    params ? JSON.stringify(params) : "{}",
    adjustment_type,
    adjustment_value,
    condition_season || null,
    condition_lead_time_min !== void 0 ? condition_lead_time_min : null,
    condition_lead_time_max !== void 0 ? condition_lead_time_max : null,
    condition_dow || null,
    max_adjustment_cents || null,
    priority !== void 0 ? priority : 50,
    valid_from || null,
    valid_until || null,
    now,
    now
  ).run();
  const inserted = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  return json4({ ok: true, rule: inserted }, 201);
}
__name(handlePost, "handlePost");
async function handlePut(db, body, pathId) {
  const { id: bodyId, ...fields } = body;
  const id = pathId || bodyId;
  if (!id) return json4({ error: "id required" }, 400);
  const existing = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  if (!existing) return json4({ error: "Rule not found" }, 404);
  const now = Date.now();
  const allowed = [
    "name",
    "description",
    "params",
    "adjustment_type",
    "adjustment_value",
    "condition_season",
    "condition_lead_time_min",
    "condition_lead_time_max",
    "condition_dow",
    "max_adjustment_cents",
    "priority",
    "is_active",
    "valid_from",
    "valid_until"
  ];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      const val = key === "params" && typeof fields[key] === "object" ? JSON.stringify(fields[key]) : fields[key];
      values.push(val !== void 0 ? val : null);
    }
  }
  if (!updates.length) return json4({ error: "No valid fields to update" }, 400);
  updates.push("updated_at = ?");
  values.push(now, id);
  await db.prepare(`UPDATE rm_pricing_rules SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const updated = await db.prepare(`SELECT * FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  return json4({ ok: true, rule: updated });
}
__name(handlePut, "handlePut");
async function handleDelete(db, url) {
  const id = url.searchParams.get("id");
  if (!id) return json4({ error: "id required" }, 400);
  const existing = await db.prepare(`SELECT id FROM rm_pricing_rules WHERE id = ?`).bind(id).first();
  if (!existing) return json4({ error: "Rule not found" }, 404);
  const now = Date.now();
  await db.prepare(`UPDATE rm_pricing_rules SET is_active = 0, updated_at = ? WHERE id = ?`).bind(now, id).run();
  return json4({ ok: true, id });
}
__name(handleDelete, "handleDelete");
async function onRequest4(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS4 });
  const db = env2.revenue_manager;
  if (!db) return json4({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const pathId = pathSegments.length > 2 ? pathSegments[pathSegments.length - 1] : null;
  try {
    if (request.method === "GET") return handleGet2(db, url);
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost(db, body);
    }
    if (request.method === "PUT" || request.method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      return handlePut(db, body, pathId);
    }
    if (request.method === "DELETE") return handleDelete(db, url);
    return json4({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json4({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest4, "onRequest");

// api/rm-scrape/[[path]].js
var CORS5 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json5 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS5 }), "json");
var APIFY_BASE = "https://api.apify.com/v2";
var DEFAULT_ACTOR = "dtrungtin~airbnb-scraper";
async function triggerApifyRun(apifyToken, actor, startUrls, maxItems = 365) {
  const actorSlug = actor.replace("/", "~");
  const url = `${APIFY_BASE}/acts/${actorSlug}/runs?token=${apifyToken}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: startUrls.map((u) => typeof u === "string" ? { url: u } : u),
      maxItems
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify API error ${res.status}: ${text}`);
  }
  return res.json();
}
__name(triggerApifyRun, "triggerApifyRun");
async function ensureScrapingConfigs(db, property_id) {
  const now = Date.now();
  const { results: listings } = await db.prepare(`
      SELECT cl.id, cl.platform, cl.platform_listing_id, cl.url
      FROM rm_competitor_listings cl
      LEFT JOIN rm_scraping_configs sc ON sc.listing_id = cl.id
      WHERE cl.property_id = ? AND cl.is_active = 1 AND sc.id IS NULL
    `).bind(property_id).all();
  let created = 0;
  for (const l of listings || []) {
    try {
      await db.prepare(`INSERT OR IGNORE INTO rm_scraping_configs
                    (id, listing_id, platform, platform_listing_id, scrape_url,
                     apify_actor_id, scrape_horizon_days,
                     is_active, consecutive_errors, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, 365, 1, 0, ?, ?)`).bind(
        crypto.randomUUID(),
        l.id,
        l.platform || "airbnb",
        l.platform_listing_id,
        l.url || `https://www.airbnb.com/rooms/${l.platform_listing_id}`,
        "dtrungtin~airbnb-scraper",
        now,
        now
      ).run();
      created++;
    } catch (_) {
    }
  }
  return created;
}
__name(ensureScrapingConfigs, "ensureScrapingConfigs");
async function handlePost2(db, env2, body) {
  const { property_id, listing_ids } = body;
  if (!property_id) return json5({ error: "property_id required" }, 400);
  const apifyToken = env2.APIFY_TOKEN;
  if (!apifyToken) return json5({ error: "APIFY_TOKEN env var not configured" }, 503);
  const prop = await db.prepare(`SELECT id FROM rm_properties WHERE id = ?`).bind(property_id).first();
  if (!prop) return json5({ error: "Property not found" }, 404);
  const configsCreated = await ensureScrapingConfigs(db, property_id);
  let q, binds;
  if (listing_ids && listing_ids.length > 0) {
    const placeholders = listing_ids.map(() => "?").join(",");
    q = `
      SELECT sc.*, cl.url, cl.platform, cl.property_id, cl.name as listing_name
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1 AND cl.property_id = ? AND sc.listing_id IN (${placeholders})
    `;
    binds = [property_id, ...listing_ids];
  } else {
    q = `
      SELECT sc.*, cl.url, cl.platform, cl.property_id, cl.name as listing_name
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1 AND cl.property_id = ?
    `;
    binds = [property_id];
  }
  const { results: configs } = await db.prepare(q).bind(...binds).all();
  if (!configs || configs.length === 0) {
    return json5({ ok: false, message: "No active scraping configs found for this property", property_id });
  }
  const now = Date.now();
  const runs = [];
  const errors = [];
  const byActor = {};
  for (const cfg of configs) {
    const actor = cfg.apify_actor_id || DEFAULT_ACTOR;
    if (!byActor[actor]) byActor[actor] = [];
    byActor[actor].push(cfg);
  }
  for (const [actor, cfgs] of Object.entries(byActor)) {
    const validUrls = cfgs.filter((c) => c.scrape_url || c.url);
    const startUrls = validUrls.map((c) => ({ url: c.scrape_url || c.url }));
    if (!startUrls.length) continue;
    try {
      const result = await triggerApifyRun(apifyToken, actor, startUrls, cfgs[0].scrape_horizon_days || 365);
      const runId = result.data?.id || result.id || null;
      runs.push({
        actor,
        run_id: runId,
        listings: validUrls.map((c) => c.listing_id),
        status: result.data?.status || "RUNNING"
      });
      const updateStmts = validUrls.map(
        (c) => db.prepare(`UPDATE rm_scraping_configs SET last_scraped_at = ?, last_error = NULL, consecutive_errors = 0, updated_at = ? WHERE id = ?`).bind(now, now, c.id)
      );
      if (updateStmts.length) await db.batch(updateStmts);
    } catch (err2) {
      errors.push({ actor, error: err2.message, listings: cfgs.map((c) => c.listing_id) });
      const errorStmts = cfgs.map(
        (c) => db.prepare(`UPDATE rm_scraping_configs SET last_error = ?, consecutive_errors = consecutive_errors + 1, updated_at = ? WHERE id = ?`).bind(err2.message, now, c.id)
      );
      if (errorStmts.length) await db.batch(errorStmts);
    }
  }
  return json5({
    ok: errors.length === 0,
    property_id,
    runs,
    errors,
    configs_triggered: configs.length,
    configs_created: configsCreated
  });
}
__name(handlePost2, "handlePost");
async function handleGetStatus(db, url) {
  const property_id = url.searchParams.get("property_id");
  let q, binds;
  if (property_id) {
    q = `
      SELECT sc.*, cl.name as listing_name, cl.platform, cl.url
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE cl.property_id = ? AND sc.is_active = 1
      ORDER BY sc.last_scraped_at DESC NULLS LAST
    `;
    binds = [property_id];
  } else {
    q = `
      SELECT sc.*, cl.name as listing_name, cl.platform, cl.url, cl.property_id
      FROM rm_scraping_configs sc
      JOIN rm_competitor_listings cl ON cl.id = sc.listing_id
      WHERE sc.is_active = 1
      ORDER BY sc.last_scraped_at DESC NULLS LAST
      LIMIT 100
    `;
    binds = [];
  }
  const { results } = await db.prepare(q).bind(...binds).all();
  const configs = (results || []).map((c) => ({
    ...c,
    last_scraped_ago_hours: c.last_scraped_at ? Math.round((Date.now() - c.last_scraped_at) / 36e5) : null,
    health: c.consecutive_errors >= 3 ? "error" : c.consecutive_errors >= 1 ? "warning" : "ok"
  }));
  return json5({ configs, count: configs.length });
}
__name(handleGetStatus, "handleGetStatus");
async function onRequest5(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS5 });
  const db = env2.revenue_manager;
  if (!db) return json5({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "GET") {
      return handleGetStatus(db, url);
    }
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost2(db, env2, body);
    }
    return json5({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json5({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest5, "onRequest");

// api/_ratelimit.js
async function rateLimit(db, { key, limit = 5, windowSec = 900 }) {
  if (!db) return { ok: true, remaining: limit, retryAfter: 0 };
  const now = Math.floor(Date.now() / 1e3);
  const windowStart = now - windowSec;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits_v2 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        key        TEXT NOT NULL,
        ts         INTEGER NOT NULL
      )
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_v2_key_ts ON rate_limits_v2 (key, ts)
    `).run();
    if (Math.random() < 0.1) {
      await db.prepare("DELETE FROM rate_limits_v2 WHERE ts < ?").bind(windowStart).run();
    }
    const { results } = await db.prepare("SELECT COUNT(*) as cnt FROM rate_limits_v2 WHERE key = ? AND ts >= ?").bind(key, windowStart).all();
    const count3 = results[0]?.cnt ?? 0;
    if (count3 >= limit) {
      const oldest = await db.prepare("SELECT MIN(ts) as t FROM rate_limits_v2 WHERE key = ? AND ts >= ?").bind(key, windowStart).first();
      const retryAfter = oldest?.t ? oldest.t + windowSec - now : windowSec;
      return { ok: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
    }
    await db.prepare("INSERT INTO rate_limits_v2 (key, ts) VALUES (?, ?)").bind(key, now).run();
    return { ok: true, remaining: limit - count3 - 1, retryAfter: 0 };
  } catch (err2) {
    console.error("[ratelimit] erreur D1:", err2.message);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}
__name(rateLimit, "rateLimit");

// api/admin-auth.js
var ALLOWED_ORIGINS = [
  "https://villamaryllis.com",
  "https://www.villamaryllis.com",
  "https://dashboard-amaryllis.pages.dev"
];
function corsHeaders(origin = "") {
  const allowed = ALLOWED_ORIGINS.some((o) => origin === o || origin.endsWith(".dashboard-amaryllis.pages.dev"));
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed ? origin : "https://villamaryllis.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
__name(corsHeaders, "corsHeaders");
var json6 = /* @__PURE__ */ __name((d, s = 200, req) => new Response(JSON.stringify(d), { status: s, headers: corsHeaders(req?.headers?.get("Origin") || "") }), "json");
async function onRequestOptions(context3) {
  return new Response(null, { status: 204, headers: corsHeaders(context3.request?.headers?.get("Origin") || "") });
}
__name(onRequestOptions, "onRequestOptions");
async function onRequestPost(context3) {
  const { request, env: env2 } = context3;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(env2.revenue_manager, {
    key: `admin-auth:${ip}`,
    limit: 5,
    windowSec: 900
  });
  if (!rl.ok) {
    return json6({ error: "Trop de tentatives. R\xE9essayez dans quelques minutes.", retryAfter: rl.retryAfter }, 429, request);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json6({ error: "JSON invalide" }, 400, request);
  }
  const { password } = body;
  if (!password || typeof password !== "string") {
    return json6({ ok: false }, 401, request);
  }
  const adminPwd = env2.ADMIN_PWD;
  const menagePwd = env2.ADMIN_PWD_MENAGE;
  if (!adminPwd) {
    return json6({ error: "ADMIN_PWD non configur\xE9" }, 500, request);
  }
  if (password === adminPwd) {
    return json6({ ok: true, role: "admin" }, 200, request);
  }
  if (menagePwd && password === menagePwd) {
    return json6({ ok: true, role: "menage" }, 200, request);
  }
  return json6({ ok: false }, 401, request);
}
__name(onRequestPost, "onRequestPost");

// api/ai-summary.js
async function onRequestPost2(context3) {
  const { request, env: env2 } = context3;
  const apiKey = env2.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json7({ error: "ANTHROPIC_API_KEY manquante dans les variables Cloudflare" }, 500);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json7({ error: "Body JSON invalide" }, 400);
  }
  const { prompt, maxTokens = 500 } = body;
  if (!prompt || typeof prompt !== "string") {
    return json7({ error: "Champ 'prompt' requis" }, 400);
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        // rapide + peu coûteux pour les résumés
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return json7({ error: data.error?.message || "Erreur Anthropic", status: res.status }, 502);
    }
    return json7({ text: data.content?.[0]?.text || "" });
  } catch (err2) {
    return json7({ error: err2.message }, 502);
  }
}
__name(onRequestPost2, "onRequestPost");
async function onRequestOptions2() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions2, "onRequestOptions");
function json7(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json7, "json");

// api/airbnb-test.js
var LISTINGS = [
  { nom: "Villa Amaryllis", id: "54269844" },
  { nom: "Zandoli", id: "792768220924504884" },
  { nom: "G\xE9ko", id: "1263155865459755724" },
  { nom: "Mabouya", id: "1046596752160926069" },
  { nom: "Bellevue", id: "24242415" }
];
var AIRBNB_APP_ID = "d306zoyjsyarp7ifhu67rjxn52tv0t3v";
var AIRBNB_API = "https://api.airbnb.com";
async function getToken(email, password) {
  const res = await fetch(`${AIRBNB_API}/v2/logins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "Airbnb/19.50.1 iPhone/17.0",
      "X-Airbnb-API-Key": AIRBNB_APP_ID,
      "Accept": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }
  if (!res.ok || !data.login?.id) {
    throw new Error(`HTTP ${res.status} \u2014 ${JSON.stringify(data)}`);
  }
  return data.login.id;
}
__name(getToken, "getToken");
async function getListingPrices(token, listingId) {
  const today = /* @__PURE__ */ new Date();
  const start = today.toISOString().split("T")[0];
  const end = new Date(today.getTime() + 30 * 864e5).toISOString().split("T")[0];
  const res = await fetch(
    `${AIRBNB_API}/v2/calendars/${listingId}?start_date=${start}&end_date=${end}&_format=with_conditions`,
    {
      headers: {
        "X-Airbnb-OAuth-Token": token,
        "User-Agent": "Airbnb/19.50.1 iPhone/17.0"
      }
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_details?.description || `HTTP ${res.status}`);
  const days = data.calendar?.days || [];
  const prices = days.slice(0, 7).map((d) => ({
    date: d.date,
    price: d.price?.local_price_formatted || d.price?.native_price,
    available: d.available,
    min_nights: d.min_nights
  }));
  return prices;
}
__name(getListingPrices, "getListingPrices");
async function onRequestGet(context3) {
  const secret = new URL(context3.request.url).searchParams.get("secret");
  if (secret !== context3.env.AIRBNB_TEST_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const email = context3.env.AIRBNB_EMAIL;
  const password = context3.env.AIRBNB_PASSWORD;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "AIRBNB_EMAIL et AIRBNB_PASSWORD manquants dans les variables d'environnement Cloudflare" }), { status: 500 });
  }
  const results = [];
  try {
    const token = await getToken(email, password);
    results.push({ step: "auth", status: "ok", token_preview: token.slice(0, 12) + "\u2026" });
    for (const listing of LISTINGS) {
      try {
        const prices = await getListingPrices(token, listing.id);
        results.push({ listing: listing.nom, id: listing.id, status: "ok", prices });
      } catch (e) {
        results.push({ listing: listing.nom, id: listing.id, status: "error", error: e.message });
      }
    }
  } catch (e) {
    results.push({ step: "auth", status: "error", error: e.message });
  }
  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequestGet, "onRequestGet");

// api/analytics.js
async function onRequestGet2(context3) {
  const { env: env2 } = context3;
  const propertyId = env2.GA4_PROPERTY_ID;
  const clientEmail = env2.GA4_CLIENT_EMAIL;
  const privateKey = env2.GA4_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !privateKey) {
    return json8({ error: "GA4 non configur\xE9 \u2014 secrets manquants", missing: { propertyId: !propertyId, clientEmail: !clientEmail, privateKey: !privateKey } }, 503);
  }
  try {
    const token = await getAccessToken(clientEmail, privateKey);
    const [overview, pages, countries, sources, devices, bienConversions] = await Promise.all([
      runReport(token, propertyId, {
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }, { startDate: "60daysAgo", endDate: "31daysAgo" }],
        orderBys: [{ dimension: { dimensionName: "date" } }]
      }),
      runReport(token, propertyId, {
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15
      }),
      runReport(token, propertyId, {
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10
      }),
      runReport(token, propertyId, {
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10
      }),
      runReport(token, propertyId, {
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
      }),
      // data-006 : trafic + events par page bien (/amaryllis, /zandoli, etc.)
      runReport(token, propertyId, {
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            inListFilter: { values: ["/amaryllis", "/zandoli", "/iguana", "/geko", "/mabouya", "/schoelcher", "/nogent"] }
          }
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
      })
    ]);
    return new Response(JSON.stringify({
      ok: true,
      overview: parseReport(overview),
      pages: parseReport(pages),
      countries: parseReport(countries),
      sources: parseReport(sources),
      devices: parseReport(devices),
      bienConversions: parseReport(bienConversions)
      // data-006
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
      }
    });
  } catch (err2) {
    return json8({ error: err2.message }, 502);
  }
}
__name(onRequestGet2, "onRequestGet");
async function runReport(token, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, keepEmptyRows: false })
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GA4 API ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}
__name(runReport, "runReport");
function parseReport(raw) {
  if (!raw || !raw.rows) return [];
  const dimNames = (raw.dimensionHeaders || []).map((h) => h.name);
  const metNames = (raw.metricHeaders || []).map((h) => h.name);
  return raw.rows.map((row) => {
    const obj = {};
    (row.dimensionValues || []).forEach((v, i) => {
      obj[dimNames[i]] = v.value;
    });
    (row.metricValues || []).forEach((v, i) => {
      obj[metNames[i]] = parseFloat(v.value) || 0;
    });
    return obj;
  });
}
__name(parseReport, "parseReport");
async function getAccessToken(clientEmail, rawKey) {
  const now = Math.floor(Date.now() / 1e3);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  }));
  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(rawKey);
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  const sig = b64urlBuf(sigBuf);
  const jwt = `${signingInput}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token GA4 refus\xE9 : " + JSON.stringify(data));
  return data.access_token;
}
__name(getAccessToken, "getAccessToken");
async function importPrivateKey(pem) {
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    buf.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
__name(importPrivateKey, "importPrivateKey");
function b64url(str) {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(b64url, "b64url");
function b64urlBuf(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(b64urlBuf, "b64urlBuf");
function json8(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "s-maxage=300" }
  });
}
__name(json8, "json");
async function onRequestOptions3() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
__name(onRequestOptions3, "onRequestOptions");

// api/beds24-refresh.js
var THRESHOLD_DAYS = 30;
async function ensureTokenTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS beds24_tokens (
      id           INTEGER PRIMARY KEY,
      token        TEXT    NOT NULL,
      expires_at   INTEGER NOT NULL,
      refreshed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}
__name(ensureTokenTable, "ensureTokenTable");
async function onRequestGet3(context3) {
  const { env: env2, request } = context3;
  const refreshSecret = env2.BEDS24_REFRESH_SECRET;
  if (refreshSecret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== refreshSecret) {
      return json9({ error: "Non autoris\xE9" }, 401);
    }
  }
  const db = env2.revenue_manager;
  if (!db) return json9({ error: "D1 non configur\xE9" }, 503);
  const currentToken = await getActiveBeds24Token(env2, db);
  if (!currentToken) return json9({ error: "BEDS24_TOKEN manquant" }, 503);
  try {
    await ensureTokenTable(db);
    const detailsRes = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token: currentToken },
      signal: AbortSignal.timeout(8e3)
    });
    const details = await detailsRes.json();
    if (!details.validToken) {
      return json9({ ok: false, error: "Token actuel invalide", raw: details }, 400);
    }
    const expiresIn = details.token?.expiresIn ?? null;
    const daysLeft = expiresIn !== null ? Math.round(expiresIn / 86400) : null;
    if (daysLeft !== null && daysLeft > THRESHOLD_DAYS) {
      return json9({
        ok: true,
        action: "skipped",
        daysLeft,
        message: `Token valide encore ${daysLeft}j \u2014 refresh pas n\xE9cessaire (seuil ${THRESHOLD_DAYS}j)`
      });
    }
    const refreshRes = await fetch("https://beds24.com/api/v2/authentication/refresh", {
      method: "GET",
      headers: { token: currentToken },
      signal: AbortSignal.timeout(8e3)
    });
    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      return json9({ ok: false, error: `Beds24 refresh HTTP ${refreshRes.status}`, detail: errText.slice(0, 200) }, 502);
    }
    const refreshData = await refreshRes.json();
    const newToken = refreshData.token?.token ?? refreshData.refreshToken ?? null;
    const newExpiresIn = refreshData.token?.expiresIn ?? null;
    if (!newToken) {
      return json9({ ok: false, error: "Refresh OK mais pas de nouveau token dans la r\xE9ponse", raw: refreshData }, 502);
    }
    const expiresAt = Math.floor(Date.now() / 1e3) + (newExpiresIn ?? 60 * 86400);
    const now = Math.floor(Date.now() / 1e3);
    await db.prepare(`
      INSERT INTO beds24_tokens (id, token, expires_at, refreshed_at)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET token=excluded.token, expires_at=excluded.expires_at, refreshed_at=excluded.refreshed_at
    `).bind(newToken, expiresAt, now).run();
    console.log(`[beds24-refresh] Token renouvel\xE9 \u2014 expire dans ${Math.round((expiresAt - now) / 86400)}j`);
    if (env2.NTFY_TOPIC) {
      await fetch(`https://ntfy.sh/${env2.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", "Title": "\u{1F511} Beds24 token renouvel\xE9", "Tags": "key,refresh", "Priority": "low" },
        body: `Nouveau token actif \u2014 expire dans ${Math.round((expiresAt - now) / 86400)} jours`
      }).catch(() => {
      });
    }
    return json9({
      ok: true,
      action: "refreshed",
      daysLeft,
      newExpiresIn: Math.round((expiresAt - now) / 86400),
      message: "Token Beds24 renouvel\xE9 et stock\xE9 en D1"
    });
  } catch (err2) {
    console.error("[beds24-refresh] erreur:", err2);
    return json9({ ok: false, error: err2.message }, 500);
  }
}
__name(onRequestGet3, "onRequestGet");
async function getActiveBeds24Token(env2, db) {
  if (db) {
    try {
      const row = await db.prepare(
        "SELECT token, expires_at FROM beds24_tokens WHERE id=1 LIMIT 1"
      ).first();
      if (row && row.token && row.expires_at > Math.floor(Date.now() / 1e3) + 3600) {
        return row.token;
      }
    } catch {
    }
  }
  return env2.BEDS24_TOKEN || null;
}
__name(getActiveBeds24Token, "getActiveBeds24Token");
function json9(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
__name(json9, "json");
async function onRequestOptions4() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" }
  });
}
__name(onRequestOptions4, "onRequestOptions");

// api/beds24-bookings.js
var BEDS24_V2_URL = "https://beds24.com/api/v2/bookings";
var PROP_ID = "158192";
var PAGE_SIZE = 100;
async function onRequestGet4(context3) {
  const { request, env: env2 } = context3;
  const token = await getActiveBeds24Token(env2, env2.revenue_manager);
  if (!token) {
    return json10({ error: "BEDS24_TOKEN manquant dans les variables Cloudflare" }, 500);
  }
  const url = new URL(request.url);
  const params = url.searchParams;
  if (params.get("test") === "1") {
    try {
      const res = await fetch("https://beds24.com/api/v2/authentication/details", {
        headers: { token }
      });
      const data = await res.json();
      if (data.validToken) {
        return json10({ ok: true, propId: PROP_ID, expiresIn: data.token?.expiresIn });
      }
      return json10({ ok: false, error: "Token invalide", raw: data }, 400);
    } catch (err2) {
      return json10({ ok: false, error: err2.message }, 502);
    }
  }
  const qp = new URLSearchParams({ propId: PROP_ID });
  const pick = /* @__PURE__ */ __name((v2key, paramKey) => {
    const v = params.get(paramKey || v2key);
    if (v) qp.set(v2key, v);
  }, "pick");
  pick("arrivalFrom");
  pick("arrivalTo");
  pick("departureFrom");
  pick("departureTo");
  pick("modifiedFrom");
  pick("modifiedTo");
  const statusFilter = params.get("status");
  let allBookings = [];
  let pageNum = 0;
  const MAX_PAGES = 50;
  try {
    while (pageNum < MAX_PAGES) {
      qp.set("pageNum", pageNum);
      qp.set("numId", PAGE_SIZE);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12e3);
      const res = await fetch(`${BEDS24_V2_URL}?${qp}`, {
        headers: { token },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      if (!res.ok) {
        const txt = await res.text();
        return json10({ error: `Beds24 HTTP ${res.status}`, detail: txt.slice(0, 500) }, 502);
      }
      let data;
      try {
        data = await res.json();
      } catch (_) {
        return json10({ error: "R\xE9ponse non-JSON de Beds24 V2" }, 502);
      }
      if (!data.success) {
        return json10({ error: data.error || "Erreur Beds24 V2", raw: data }, 502);
      }
      allBookings = allBookings.concat(data.data || []);
      pageNum++;
      if (!data.pages?.nextPageExists) break;
    }
  } catch (err2) {
    return json10({ error: err2.message }, 502);
  }
  const normalize = /* @__PURE__ */ __name((b) => ({
    bookingId: b.id,
    firstName: b.firstName || "",
    lastName: b.lastName || "",
    guestName: `${b.firstName || ""} ${b.lastName || ""}`.trim() || "\u2014",
    email: b.email || "",
    phone: b.phone || b.mobile || "",
    arrival: b.arrival || "",
    departure: b.departure || "",
    lastNight: lastNightFrom(b.departure),
    nights: nightsCount(b.arrival, b.departure),
    status: statusCodeFrom(b.status),
    statusLabel: statusLabel(b.status),
    roomId: b.roomId || "",
    unitId: b.unitId || "",
    channel: b.referer || b.channel || "",
    channelLabel: channelLabel(b.referer || b.channel),
    price: parseFloat(b.price) || 0,
    currency: "EUR",
    notes: b.comments || b.notes || "",
    createdOn: b.bookingTime || "",
    modifiedOn: b.modifiedTime || "",
    numGuests: (b.numAdult || 1) + (b.numChild || 0)
  }), "normalize");
  let bookings = allBookings.map(normalize);
  if (statusFilter && statusFilter !== "99") {
    bookings = bookings.filter((b) => String(b.status) === statusFilter);
  }
  bookings.sort((a, b) => b.arrival > a.arrival ? 1 : -1);
  return json10({
    bookings,
    total: bookings.length,
    propId: PROP_ID,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    pages: pageNum
  }, 200, true);
}
__name(onRequestGet4, "onRequestGet");
async function onRequest6(context3) {
  return onRequestGet4(context3);
}
__name(onRequest6, "onRequest");
function json10(data, status = 200, cache = false) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };
  if (cache) headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=60";
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json10, "json");
function lastNightFrom(departure) {
  if (!departure) return "";
  const d = /* @__PURE__ */ new Date(departure + "T12:00:00Z");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
__name(lastNightFrom, "lastNightFrom");
function nightsCount(arrival, departure) {
  if (!arrival || !departure) return 0;
  const a = /* @__PURE__ */ new Date(arrival + "T12:00:00Z");
  const b = /* @__PURE__ */ new Date(departure + "T12:00:00Z");
  return Math.round((b - a) / 864e5);
}
__name(nightsCount, "nightsCount");
function statusCodeFrom(status) {
  const map = {
    "new": 0,
    "confirmed": 1,
    "cancelled": 2,
    "request": 3,
    "black": 90,
    "closed": 5,
    "archived": 99
  };
  return map[status] ?? 0;
}
__name(statusCodeFrom, "statusCodeFrom");
function statusLabel(status) {
  const labels = {
    "new": "Nouveau",
    "confirmed": "Confirm\xE9",
    "cancelled": "Annul\xE9",
    "request": "Demande",
    "black": "Bloqu\xE9",
    "closed": "Ferm\xE9",
    "archived": "Archiv\xE9"
  };
  return labels[status] || status || "Inconnu";
}
__name(statusLabel, "statusLabel");
function channelLabel(referer) {
  if (!referer) return "Direct";
  const r = referer.toLowerCase();
  if (r.includes("airbnb")) return "Airbnb";
  if (r.includes("booking")) return "Booking.com";
  if (r.includes("expedia")) return "Expedia";
  if (r.includes("vrbo")) return "VRBO";
  if (r.includes("beds24")) return "Beds24 Direct";
  if (r.includes("direct")) return "Direct";
  return referer;
}
__name(channelLabel, "channelLabel");

// api/beds24-create.js
var BEDS24_V2_BOOKINGS = "https://beds24.com/api/v2/bookings";
var BEDS24_AUTH_TOKEN = "https://beds24.com/api/v2/authentication/token";
var DEFAULT_PROP_ID = "158192";
var DEFAULT_ROOM_ID = "348880";
var CORS6 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json11 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS6 }), "json");
async function getAccessToken2(refreshToken) {
  const res = await fetch(BEDS24_AUTH_TOKEN, { headers: { refreshToken } });
  const data = await res.json();
  if (!data.token) throw new Error("Refresh token invalide ou expir\xE9");
  return data.token;
}
__name(getAccessToken2, "getAccessToken");
async function onRequestOptions5() {
  return new Response(null, { status: 204, headers: CORS6 });
}
__name(onRequestOptions5, "onRequestOptions");
async function onRequestPost3(context3) {
  const { request, env: env2 } = context3;
  let token;
  if (env2.BEDS24_REFRESH_TOKEN) {
    try {
      token = await getAccessToken2(env2.BEDS24_REFRESH_TOKEN);
    } catch (e) {
      return json11({ error: `Auth Beds24 \xE9chou\xE9e: ${e.message}` }, 500);
    }
  } else if (env2.BEDS24_TOKEN) {
    token = env2.BEDS24_TOKEN;
  } else {
    return json11({ error: "BEDS24_TOKEN ou BEDS24_REFRESH_TOKEN manquant" }, 500);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json11({ error: "JSON invalide" }, 400);
  }
  const {
    propId = DEFAULT_PROP_ID,
    checkin,
    checkout,
    firstName,
    lastName,
    email,
    phone = "",
    numAdult = 1,
    numChild = 0,
    localAmount,
    // montant calculé côté front (fallback si Beds24 ne renvoie pas de prix)
    notes = ""
  } = body;
  if (!checkin || !checkout)
    return json11({ error: "checkin et checkout requis" }, 400);
  if (!firstName || !lastName || !email)
    return json11({ error: "firstName, lastName et email requis" }, 400);
  if (!email.includes("@"))
    return json11({ error: "email invalide" }, 400);
  const BLOCKED_EMAILS = ["test@test.com", "test@test.fr", "test@example.com"];
  if (BLOCKED_EMAILS.includes(email.trim().toLowerCase()))
    return json11({ error: "Email non autoris\xE9" }, 400);
  const arrivalDate = /* @__PURE__ */ new Date(checkin + "T12:00:00Z");
  const departureDate = /* @__PURE__ */ new Date(checkout + "T12:00:00Z");
  if (isNaN(arrivalDate) || isNaN(departureDate))
    return json11({ error: "Dates invalides" }, 400);
  if (departureDate <= arrivalDate)
    return json11({ error: "La date de d\xE9part doit \xEAtre apr\xE8s l'arriv\xE9e" }, 400);
  const now = /* @__PURE__ */ new Date();
  now.setHours(0, 0, 0, 0);
  if (arrivalDate < now)
    return json11({ error: "La date d'arriv\xE9e doit \xEAtre dans le futur" }, 400);
  const bookingPayload = [{
    propId: String(propId),
    roomId: DEFAULT_ROOM_ID,
    arrival: checkin,
    departure: checkout,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    numAdult: Math.max(1, parseInt(numAdult) || 1),
    numChild: Math.max(0, parseInt(numChild) || 0),
    status: "new",
    // → "confirmed" après paiement Stripe réussi
    referer: "direct",
    comments: notes.trim()
  }];
  try {
    const createRes = await fetch(BEDS24_V2_BOOKINGS, {
      method: "POST",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload)
    });
    let createData;
    try {
      createData = await createRes.json();
    } catch {
      return json11({ error: "R\xE9ponse non-JSON de Beds24" }, 500);
    }
    const firstResult = Array.isArray(createData) ? createData[0] : createData;
    if (!createRes.ok || !firstResult?.success) {
      return json11({ error: "Cr\xE9ation Beds24 \xE9chou\xE9e", raw: createData }, 500);
    }
    const bookingId = firstResult?.new?.id;
    if (!bookingId) return json11({ error: "bookingId absent dans la r\xE9ponse Beds24", raw: createData }, 500);
    let price = 0;
    try {
      const since = new Date(Date.now() - 60 * 1e3).toISOString().slice(0, 10);
      const getRes = await fetch(
        `${BEDS24_V2_BOOKINGS}?propId=${propId}&arrivalFrom=${checkin}&arrivalTo=${checkin}&modifiedFrom=${since}&numId=20`,
        { headers: { token } }
      );
      const getData = await getRes.json();
      const match2 = (getData.data || []).find((b) => String(b.id) === String(bookingId));
      if (match2) {
        price = parseFloat(match2.totalPrice ?? match2.invoiceAmount ?? match2.price) || 0;
        console.log(JSON.stringify({
          level: "info",
          fn: "beds24-create",
          msg: "prix r\xE9cup\xE9r\xE9 depuis Beds24",
          bookingId,
          price,
          totalPrice: match2.totalPrice,
          invoiceAmount: match2.invoiceAmount,
          rawPrice: match2.price,
          ts: (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    } catch (fetchErr) {
      console.error(JSON.stringify({
        level: "error",
        fn: "beds24-create",
        msg: "GET prix \xE9chou\xE9",
        error: fetchErr.message,
        bookingId,
        ts: (/* @__PURE__ */ new Date()).toISOString()
      }));
    }
    if (!price && localAmount) {
      price = parseFloat(localAmount) || 0;
      console.log(JSON.stringify({
        level: "info",
        fn: "beds24-create",
        msg: "prix fallback local utilis\xE9",
        bookingId,
        price,
        ts: (/* @__PURE__ */ new Date()).toISOString()
      }));
    }
    console.log(JSON.stringify({
      level: "info",
      fn: "beds24-create",
      msg: "r\xE9servation cr\xE9\xE9e",
      bookingId,
      price,
      checkin,
      checkout,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
    return json11({
      ok: true,
      bookingId,
      price,
      // 0 si Beds24 ne répond pas ET pas de localAmount
      arrival: checkin,
      departure: checkout
    });
  } catch (e) {
    console.error(JSON.stringify({
      level: "error",
      fn: "beds24-create",
      msg: e.message,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
    return json11({ error: e.message }, 500);
  }
}
__name(onRequestPost3, "onRequestPost");

// api/beds24-manage.js
var BEDS24_V2_BOOKINGS2 = "https://beds24.com/api/v2/bookings";
var PROP_ID2 = "158192";
var CORS7 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json12 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS7 }), "json");
async function onRequestOptions6() {
  return new Response(null, { status: 204, headers: CORS7 });
}
__name(onRequestOptions6, "onRequestOptions");
async function onRequestPost4(context3) {
  const { request, env: env2 } = context3;
  const token = env2.BEDS24_TOKEN;
  if (!token) return json12({ error: "BEDS24_TOKEN manquant" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json12({ error: "JSON invalide" }, 400);
  }
  const { action } = body;
  if (action === "find") {
    const { email, lastName, checkin } = body;
    if (!email && !lastName) return json12({ error: "email ou lastName requis" }, 400);
    const qp = new URLSearchParams({ propId: PROP_ID2, numId: "50" });
    if (checkin) {
      qp.set("arrivalFrom", checkin);
      qp.set("arrivalTo", checkin);
    } else {
      const since = new Date(Date.now() - 6 * 3600 * 1e3).toISOString().slice(0, 10);
      qp.set("modifiedFrom", since);
    }
    try {
      const res = await fetch(`${BEDS24_V2_BOOKINGS2}?${qp}`, { headers: { token } });
      const data = await res.json();
      if (!data.success) return json12({ error: "Erreur Beds24 find", raw: data }, 502);
      const bookings = (data.data || []).filter((b) => b.status !== "cancelled");
      const byEmail = email ? bookings.find((b) => b.email && b.email.toLowerCase() === email.toLowerCase()) : null;
      const byName = lastName ? bookings.find((b) => b.lastName && b.lastName.toLowerCase() === lastName.toLowerCase()) : null;
      const match2 = byEmail || byName;
      if (!match2) {
        return json12({ error: "R\xE9servation Beds24 non trouv\xE9e", tried: bookings.length }, 404);
      }
      const priceDebug = {
        price: match2.price,
        totalPrice: match2.totalPrice,
        invoiceAmount: match2.invoiceAmount,
        guestPrice: match2.guestPrice,
        subTotal: match2.subTotal,
        numAdult: match2.numAdult,
        numChild: match2.numChild
      };
      console.log("[beds24-find] price fields:", JSON.stringify(priceDebug));
      const totalAmount = match2.totalPrice ?? match2.invoiceAmount ?? match2.price;
      return json12({
        ok: true,
        bookingId: match2.id,
        arrival: match2.arrival,
        departure: match2.departure,
        guestName: `${match2.firstName || ""} ${match2.lastName || ""}`.trim(),
        price: totalAmount,
        priceDebug,
        // temporary — remove after confirming correct field
        status: match2.status
      });
    } catch (e) {
      return json12({ error: e.message }, 502);
    }
  }
  if (action === "confirm" || action === "cancel") {
    const { bookingId } = body;
    if (!bookingId) return json12({ error: "bookingId requis" }, 400);
    const newStatus = action === "confirm" ? "confirmed" : "cancelled";
    const payload = [{ id: String(bookingId), status: newStatus }];
    try {
      const res = await fetch(BEDS24_V2_BOOKINGS2, {
        method: "PUT",
        headers: { token, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (!res.ok || data.success === false) {
        const res2 = await fetch(`${BEDS24_V2_BOOKINGS2}/${bookingId}`, {
          method: "PUT",
          headers: { token, "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) return json12({ error: `Beds24 ${action} \xE9chou\xE9`, raw: data2 }, 502);
      }
      return json12({ ok: true, bookingId, status: newStatus });
    } catch (e) {
      return json12({ error: e.message }, 502);
    }
  }
  return json12({ error: `Action inconnue: ${action}` }, 400);
}
__name(onRequestPost4, "onRequestPost");

// api/beds24-prices.js
var BEDS24_BOOKINGS_URL = "https://beds24.com/api/v2/bookings";
var PROP_ID3 = "158192";
var CORS8 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
var json13 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS8 }), "json");
async function onRequestOptions7() {
  return new Response(null, { status: 204, headers: CORS8 });
}
__name(onRequestOptions7, "onRequestOptions");
async function onRequestGet5(context3) {
  try {
    return await _handle(context3);
  } catch (fatal) {
    return json13({ error: "Fatal: " + String(fatal?.message || fatal) }, 500);
  }
}
__name(onRequestGet5, "onRequestGet");
async function _handle(context3) {
  const { env: env2 } = context3;
  const token = env2.BEDS24_TOKEN;
  if (!token) {
    return json13({ error: "BEDS24_TOKEN manquant" }, 500);
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let allBookings = [];
  let page = 0;
  const MAX_PAGES = 10;
  while (page < MAX_PAGES) {
    const qp = new URLSearchParams({
      propId: PROP_ID3,
      arrivalFrom: today,
      pageNum: page,
      numId: 100
    });
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15e3);
      const res = await fetch(`${BEDS24_BOOKINGS_URL}?${qp}`, {
        headers: { token },
        signal: controller.signal
      }).finally(() => clearTimeout(tid));
      if (!res.ok) {
        const txt = await res.text();
        return json13({ error: `Beds24 HTTP ${res.status}`, detail: txt.slice(0, 400) }, 502);
      }
      const data = await res.json();
      if (!data.success) {
        return json13({ error: data.error || "Erreur Beds24 V2" }, 502);
      }
      allBookings = allBookings.concat(data.data || []);
      page++;
      if (!data.pages?.nextPageExists) break;
    } catch (err2) {
      return json13({ error: err2.message || "Fetch error" }, 502);
    }
  }
  const confirmed = allBookings.filter((b) => b.status !== "cancelled" && b.status !== "black");
  const nogent = {};
  for (const b of confirmed) {
    if (!b.arrival || !b.departure || !b.price) continue;
    const price = parseFloat(b.price);
    if (isNaN(price) || price <= 0) continue;
    const arrival = /* @__PURE__ */ new Date(b.arrival + "T12:00:00Z");
    const departure = /* @__PURE__ */ new Date(b.departure + "T12:00:00Z");
    const nights = Math.round((departure - arrival) / 864e5);
    if (nights <= 0) continue;
    const pricePerNight = Math.round(price / nights);
    if (pricePerNight <= 0) continue;
    for (let i = 0; i < nights; i++) {
      const d = new Date(arrival);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      if (!nogent[dateStr]) {
        nogent[dateStr] = pricePerNight;
      }
    }
  }
  return json13({
    ok: true,
    nogent,
    source: "bookings",
    // N.B. l'API inventory V2 Beds24 retourne 500 pour ce compte
    propId: PROP_ID3,
    bookingCount: confirmed.length,
    count: Object.keys(nogent).length,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(_handle, "_handle");
async function onRequest7(context3) {
  return onRequestGet5(context3);
}
__name(onRequest7, "onRequest");

// api/beds24-rates.js
var BEDS24_BASE = "https://beds24.com/api/v2";
var PROP_ID4 = "158192";
var ROOM_ID = "348880";
var BIEN_ID = "nogent";
var CLEANING_FEE = 45;
var BOOKING_MULTIPLIER = 1;
var CORS9 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600"
  // cache CDN 1h
};
async function onRequestOptions8() {
  return new Response(null, { status: 204, headers: CORS9 });
}
__name(onRequestOptions8, "onRequestOptions");
async function onRequestGet6(context3) {
  const { env: env2 } = context3;
  const token = env2.BEDS24_TOKEN;
  if (!token) return err("BEDS24_TOKEN manquant", 500);
  const today = /* @__PURE__ */ new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 545);
  const startDate = today.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const url = `${BEDS24_BASE}/inventory/rooms/calendar?propId=${PROP_ID4}&roomId=${ROOM_ID}&startDate=${startDate}&endDate=${endStr}&includePrices=true`;
  try {
    const res = await fetch(url, { headers: { token } });
    const data = await res.json();
    if (!data.success) {
      return err(`Beds24 error: ${data.error}`, 502);
    }
    const roomData = data.data?.[0];
    if (!roomData) return err("Aucune donn\xE9e room retourn\xE9e", 502);
    const pricesMap = {};
    for (const range of roomData.calendar || []) {
      if (!range.price1 || !range.from || !range.to) continue;
      const price = Math.round(range.price1 * BOOKING_MULTIPLIER);
      const cur = /* @__PURE__ */ new Date(range.from + "T12:00:00Z");
      const end = /* @__PURE__ */ new Date(range.to + "T12:00:00Z");
      while (cur <= end) {
        pricesMap[cur.toISOString().slice(0, 10)] = price;
        cur.setDate(cur.getDate() + 1);
      }
    }
    const daysCount = Object.keys(pricesMap).length;
    const prices = Object.values(pricesMap);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return new Response(JSON.stringify({
      ok: true,
      bienId: BIEN_ID,
      roomId: ROOM_ID,
      propId: PROP_ID4,
      cleaningFee: CLEANING_FEE,
      prices: pricesMap,
      // { "2026-06-01": 110, ... }
      meta: {
        days: daysCount,
        startDate,
        endDate: endStr,
        minPrice,
        maxPrice,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), { status: 200, headers: CORS9 });
  } catch (e) {
    return err(e.message, 502);
  }
}
__name(onRequestGet6, "onRequestGet");
function err(msg, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: CORS9
  });
}
__name(err, "err");

// api/beds24-webhook.js
var BEDS24_URL = "https://api.beds24.com/json/getBookings";
var PROP_ID5 = "158192";
async function onRequestPost5(context3) {
  const { request, env: env2 } = context3;
  const apiKey = env2.BEDS24_API_KEY;
  const propKey = env2.BEDS24_PROP_KEY;
  const scriptUrl = env2.APPS_SCRIPT_URL;
  const webhookSecret = env2.BEDS24_WEBHOOK_SECRET;
  if (!apiKey || !propKey) return json14({ error: "Cl\xE9s Beds24 manquantes" }, 500);
  if (!scriptUrl) return json14({ error: "APPS_SCRIPT_URL manquante" }, 500);
  let payload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }
  console.log("[beds24-webhook] re\xE7u:", JSON.stringify(payload));
  const bookingId = payload.bookId || payload.bookingId || payload.id;
  let bookings = [];
  if (bookingId) {
    try {
      const res = await fetch(BEDS24_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          propKey,
          propId: Number(PROP_ID5),
          bookId: Number(bookingId),
          firstId: 0,
          numId: 1
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) bookings = data;
    } catch (err2) {
      console.error("[beds24-webhook] fetch booking error:", err2.message);
    }
  } else {
    const today = /* @__PURE__ */ new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const modifiedFrom = yesterday.toISOString().slice(0, 10);
    try {
      const res = await fetch(BEDS24_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          propKey,
          propId: Number(PROP_ID5),
          modifiedFrom,
          firstId: 0,
          numId: 50
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) bookings = data;
    } catch (err2) {
      console.error("[beds24-webhook] fetch recent error:", err2.message);
    }
  }
  if (bookings.length === 0) {
    return json14({ ok: true, msg: "Webhook re\xE7u, aucune r\xE9servation \xE0 synchroniser" });
  }
  const normalized = bookings.map(normalizeBooking);
  try {
    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importBeds24", bookings: normalized }),
      redirect: "follow"
    });
    const txt = await r.text();
    console.log("[beds24-webhook] Apps Script response:", txt);
    return json14({ ok: true, synced: normalized.length, script: txt });
  } catch (err2) {
    console.error("[beds24-webhook] Apps Script error:", err2.message);
    return json14({ error: err2.message }, 502);
  }
}
__name(onRequestPost5, "onRequestPost");
async function onRequestGet7(context3) {
  return json14({ ok: true, msg: "Beds24 webhook endpoint actif", prop: PROP_ID5 });
}
__name(onRequestGet7, "onRequestGet");
function normalizeBooking(b) {
  const lastNight = b.lastNight || "";
  let departure = "";
  if (lastNight) {
    const d = /* @__PURE__ */ new Date(lastNight + "T12:00:00Z");
    d.setDate(d.getDate() + 1);
    departure = d.toISOString().slice(0, 10);
  }
  const nights = (() => {
    if (!b.firstNight || !b.lastNight) return 0;
    const a = /* @__PURE__ */ new Date(b.firstNight + "T12:00:00Z");
    const c = /* @__PURE__ */ new Date(b.lastNight + "T12:00:00Z");
    return Math.round((c - a) / 864e5) + 1;
  })();
  return {
    bookingId: String(b.bookId || ""),
    guestName: `${b.firstName || ""} ${b.lastName || ""}`.trim() || "\u2014",
    email: b.guestEmail || "",
    phone: b.guestPhone || "",
    arrival: b.firstNight || "",
    departure,
    nights,
    channel: channelLabel2(b.referer),
    price: parseFloat(b.price) || 0,
    status: statusLabel2(b.status),
    statusCode: String(b.status),
    createdOn: b.createdOn || "",
    modifiedOn: b.modifiedOn || "",
    numGuests: parseInt(b.numGuests) || 1,
    notes: b.guestNote || ""
  };
}
__name(normalizeBooking, "normalizeBooking");
function statusLabel2(code) {
  const m = { "0": "Nouveau", "1": "Confirm\xE9", "2": "Annul\xE9", "3": "Demande", "4": "Paiement en attente", "5": "Ferm\xE9" };
  return m[String(code)] || `Statut ${code}`;
}
__name(statusLabel2, "statusLabel");
function channelLabel2(r) {
  if (!r) return "Direct";
  const s = r.toLowerCase();
  if (s.includes("airbnb")) return "Airbnb";
  if (s.includes("booking")) return "Booking.com";
  if (s.includes("expedia")) return "Expedia";
  if (s.includes("direct")) return "Direct";
  return r;
}
__name(channelLabel2, "channelLabel");
function json14(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json14, "json");

// api/caution-checkout.js
var CORS10 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json15 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS10 }), "json");
var NOMS = {
  amaryllis: "Villa Amaryllis",
  schoelcher: "Bellevue Sch\u0153lcher",
  geko: "G\xE9ko",
  mabouya: "Mabouya",
  zandoli: "Zandoli",
  iguana: "Villa Iguana",
  nogent: "Appartement Nogent"
};
var MAX_CAUTION = {
  amaryllis: 1500,
  schoelcher: 1e3,
  zandoli: 700,
  iguana: 500,
  geko: 500,
  mabouya: 500,
  nogent: 500
};
async function onRequestOptions9() {
  return new Response(null, { status: 204, headers: CORS10 });
}
__name(onRequestOptions9, "onRequestOptions");
async function onRequestPost6(context3) {
  const { request, env: env2 } = context3;
  const sk = env2.STRIPE_SECRET_KEY;
  if (!sk) return json15({ error: "STRIPE_SECRET_KEY manquante" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json15({ error: "JSON invalide" }, 400);
  }
  const {
    bienId,
    voyageur = "",
    email = "",
    checkin = "",
    checkout,
    amount
    // en euros (ex: 1500)
  } = body;
  if (!bienId || !checkout || !amount || amount < 50) {
    return json15({ error: "bienId, checkout et amount (\u20AC) requis" }, 400);
  }
  if (!NOMS[bienId]) {
    return json15({ error: `bienId inconnu: ${bienId}` }, 400);
  }
  const maxCaution = MAX_CAUTION[bienId] ?? 500;
  if (amount > maxCaution) {
    return json15({ error: `Montant maximum autoris\xE9 pour ${bienId}: ${maxCaution}\u20AC` }, 400);
  }
  const amountCents = Math.round(amount * 100);
  const bienNom = NOMS[bienId] || bienId;
  const expiresAt = Math.floor(Date.now() / 1e3) + 72 * 3600;
  const payload = new URLSearchParams({
    mode: "payment",
    "payment_intent_data[capture_method]": "manual",
    "payment_intent_data[metadata][type]": "deposit",
    "payment_intent_data[metadata][bienId]": bienId,
    "payment_intent_data[metadata][checkin]": checkin,
    "payment_intent_data[metadata][checkout]": checkout,
    "payment_intent_data[metadata][voyageur]": voyageur,
    "payment_intent_data[metadata][email]": email,
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(amountCents),
    "line_items[0][price_data][product_data][name]": `Caution \u2014 ${bienNom}`,
    "line_items[0][price_data][product_data][description]": `Pr\xE9autorisation de caution. Votre carte ne sera PAS d\xE9bit\xE9e. Les fonds seront lib\xE9r\xE9s automatiquement 3 jours apr\xE8s votre d\xE9part (${checkout}).`,
    "line_items[0][quantity]": "1",
    "success_url": "https://villamaryllis.com/?caution=ok",
    "cancel_url": "https://villamaryllis.com/?caution=cancelled",
    "expires_at": String(expiresAt),
    "locale": "fr"
  });
  if (email) payload.set("customer_email", email);
  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString()
    });
    const parsed = await res.json();
    if (parsed.error) return json15({ error: parsed.error.message }, 400);
    return json15({
      ok: true,
      url: parsed.url,
      session_id: parsed.id,
      expires_at: expiresAt,
      amount_eur: amount,
      bienId,
      checkout
    });
  } catch (err2) {
    return json15({ error: err2.message }, 500);
  }
}
__name(onRequestPost6, "onRequestPost");

// api/chat.js
var SYSTEM_PROMPT = `Tu es l'assistant virtuel d'Amaryllis Locations, une collection de villas et appartements de prestige en Martinique et \xE0 Nogent-sur-Marne (\xCEle-de-France).

Ton r\xF4le : aider les voyageurs \xE0 choisir le bon h\xE9bergement, r\xE9pondre \xE0 leurs questions sur les disponibilit\xE9s, les tarifs, les activit\xE9s, et les guider vers une r\xE9servation directe sur villamaryllis.com.

R\xC8GLES DE COMMUNICATION :
- Toujours vouvoyer (jamais "tu")
- Ton chaleureux, professionnel, sans jargon
- R\xE9ponses concises (3-5 phrases max sauf si on te demande un d\xE9tail)
- Si tu ne sais pas : "Je vous invite \xE0 nous contacter directement \xE0 contact@villamaryllis.com"
- Toujours proposer la r\xE9servation directe : avantage = pas de commission OTA, contact direct avec l'h\xF4te, flexibilit\xE9

FORMAT DE R\xC9PONSE OBLIGATOIRE :
\xC0 la toute fin de chaque r\xE9ponse, ajoute toujours cette ligne (jamais au milieu) :
NEXT: [question courte 1] | [question courte 2] | [question courte 3]
Les questions doivent \xEAtre naturelles, en lien avec la conversation, max 6 mots chacune.
Exemple : NEXT: Quelle villa pour 6 personnes ? | Meilleure saison pour venir ? | Comment r\xE9server en direct ?

NOS H\xC9BERGEMENTS EN MARTINIQUE (Sainte-Luce, Sud Martinique) :

\u{1F33A} Villa Amaryllis \u2014 villamaryllis.com/amaryllis
- 3 chambres king-size, 3,5 SDB, jusqu'\xE0 8 personnes (6 inclus + 50\u20AC/pers. suppl\xE9mentaire)
- Piscine \xE0 d\xE9bordement (4\xD77m, eau sal\xE9e), jacuzzi privatif, terrasse 100m\xB2 en bois Cumaru
- Vue panoramique mer des Cara\xEFbes, jardin tropical, carbet traditionnel avec hamac
- Cuisine \xE9quip\xE9e, barbecue gaz, Wifi Starlink, TV connect\xE9e, linge fourni
- Prix indicatif : \xE0 partir de 280\u20AC/nuit (varie selon saison et dur\xE9e)
- Note Airbnb : 4,94/5 (33 avis) \u2014 Coup de c\u0153ur Airbnb \u2B50
- Animaux bienvenus (max 2 \u2014 suppl\xE9ment 40\u20AC), non-fumeur
- Id\xE9al pour : familles, groupes, s\xE9minaires jusqu'\xE0 8 personnes
- Check-in 17h / Check-out 12h \xB7 Caution : 1 500\u20AC

\u{1F98E} Zandoli \u2014 villamaryllis.com/zandoli
- 2 chambres (dont mezzanine), jusqu'\xE0 5 personnes (4 inclus + 30\u20AC/pers. suppl\xE9mentaire)
- Piscine priv\xE9e avec cascade, vue mer, jardin tropical luxuriant
- Netflix & Disney+ inclus, Wifi Starlink, lave-linge, barbecue gaz
- Prix indicatif : \xE0 partir de 220\u20AC/nuit
- Note Airbnb : 4,5/5 (16 avis)
- Animaux bienvenus (max 2 \u2014 suppl\xE9ment 40\u20AC)
- Id\xE9al pour : couples, familles avec enfants, digital nomads
- Caution : 700\u20AC

\u{1F98E} Villa Iguana \u2014 villamaryllis.com/iguana
- 2 chambres Queen Size + canap\xE9 convertible, jusqu'\xE0 6 personnes
- Piscine eau sal\xE9e (unique dans la r\xE9sidence !), vue Rocher du Diamant
- Terrasse panoramique, jardin fleuri, barbecue gaz, Wifi Starlink
- Prix indicatif : \xE0 partir de 180\u20AC/nuit
- Note Airbnb : 4,75/5 (4 avis)
- Animaux bienvenus (max 2 \u2014 suppl\xE9ment 40\u20AC)
- Caution : 500\u20AC

\u{1F98E} G\xE9ko \u2014 villamaryllis.com/geko
- 1 chambre queen-size + canap\xE9 convertible, jusqu'\xE0 4 personnes
- Piscine priv\xE9e, jardin tropical, terrasse couverte avec cuisine ext\xE9rieure
- Wifi Starlink, lave-linge, barbecue gaz
- Prix indicatif : \xE0 partir de 150\u20AC/nuit
- Note Airbnb : 4,83/5 (23 avis)
- Animaux bienvenus (max 2 \u2014 suppl\xE9ment 40\u20AC)
- Caution : 500\u20AC

\u{1F98E} Mabouya \u2014 villamaryllis.com/mabouya
- Studio romantique, jusqu'\xE0 2 personnes
- Jacuzzi privatif, jardin fleuri, vue mer enchanteresse
- Cuisine ext\xE9rieure \xE9quip\xE9e, barbecue charbon, Wifi Starlink
- Prix indicatif : \xE0 partir de 90\u20AC/nuit
- Note Airbnb : bonne (studio premium)
- Id\xE9al pour : escapade romantique, couple

\u{1F3DB}\uFE0F Bellevue (Sch\u0153lcher) \u2014 villamaryllis.com/schoelcher
- Nord de la Martinique, vue exceptionnelle
- Infos sur demande \u2014 nous contacter

NOTRE H\xC9BERGEMENT EN \xCELE-DE-FRANCE :

\u{1F3D9}\uFE0F Appartement Nogent-sur-Marne \u2014 villamaryllis.com/nogent
- T2 standing, Nogent-sur-Marne (Val-de-Marne, proche Paris)
- Id\xE9al pour s\xE9jours professionnels, courts s\xE9jours, d\xE9couverte \xCEle-de-France
- Prix et disponibilit\xE9s sur demande

GRILLE TARIFAIRE COMPL\xC8TE (pour devis et calculs) :

SAISONS :
- Haute saison : 15 d\xE9c \u2192 5 jan / 15 juil \u2192 31 ao\xFBt / semaines de vacances scolaires fran\xE7aises
- Saison interm\xE9diaire : f\xE9v \u2192 juin / sept \u2192 nov 14
- Les prix ci-dessous sont les tarifs de base (saison interm\xE9diaire). En haute saison, appliquer +30%.

TARIFS PAR VILLA :
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Villa           \u2502 Base/nuit\u2502 Haute/nuit\u2502 Suppl\xE9ments                            \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Amaryllis       \u2502 280 \u20AC    \u2502 364 \u20AC     \u2502 +50\u20AC/pers au-del\xE0 de 6 (max 8)         \u2502
\u2502 Zandoli         \u2502 220 \u20AC    \u2502 286 \u20AC     \u2502 +30\u20AC/pers au-del\xE0 de 4 (max 5)         \u2502
\u2502 Villa Iguana    \u2502 180 \u20AC    \u2502 234 \u20AC     \u2502 max 6 personnes                        \u2502
\u2502 G\xE9ko            \u2502 150 \u20AC    \u2502 195 \u20AC     \u2502 max 4 personnes                        \u2502
\u2502 Mabouya         \u2502 90 \u20AC     \u2502 117 \u20AC     \u2502 max 2 personnes (studio)               \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

FRAIS COMMUNS \xC0 TOUTES LES VILLAS :
- Animaux : +40\u20AC par s\xE9jour (max 2 animaux)
- Early check-in (avant 17h) : +50-80\u20AC selon villa (Amaryllis : 80\u20AC, autres : 50\u20AC)
- Late check-out (apr\xE8s 12h) : m\xEAme tarif que early check-in
- M\xE9nage de fin de s\xE9jour : inclus dans le tarif

CAUTIONS (non d\xE9bit\xE9es, pr\xE9-autorisation uniquement) :
- Amaryllis : 1 500\u20AC \xB7 Zandoli : 700\u20AC \xB7 Iguana : 500\u20AC \xB7 G\xE9ko : 500\u20AC \xB7 Mabouya : 500\u20AC

COMMENT CALCULER UN DEVIS :
1. Compter les nuits (date d\xE9part - date arriv\xE9e)
2. Identifier la saison (haute ou interm\xE9diaire)
3. Prix nuits = nuits \xD7 tarif/nuit de la saison
4. Ajouter les suppl\xE9ments voyageurs si applicable
5. Ajouter les options (animaux, early/late)
6. Pr\xE9senter le total avec un r\xE9capitulatif clair

EXEMPLE DE DEVIS (format \xE0 utiliser) :
---
\u{1F33A} Devis Villa Amaryllis \u2014 7 nuits en juillet (haute saison)
\u2022 7 nuits \xD7 364\u20AC = 2 548\u20AC
\u2022 2 voyageurs suppl\xE9mentaires \xD7 50\u20AC \xD7 7 nuits = 700\u20AC
\u2022 Animal de compagnie = 40\u20AC
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Total estim\xE9 : 3 288\u20AC
*(tarif direct villamaryllis.com \u2014 sans frais de service Airbnb)*
---

IMPORTANT sur les devis :
- Pr\xE9cise toujours que c'est une estimation et que le prix exact d\xE9pend des disponibilit\xE9s
- Mentionne que la r\xE9servation directe \xE9vite les frais Airbnb (~14% c\xF4t\xE9 voyageur)
- Invite \xE0 confirmer par email : contact@villamaryllis.com
- Si les dates chevauchent haute et basse saison, calculer au prorata (ou utiliser le tarif majoritaire)

R\xC9SERVATION DIRECTE \u2014 AVANTAGES :
- Pas de frais de service Airbnb (~14% c\xF4t\xE9 voyageur, soit souvent 200-400\u20AC d'\xE9conomie)
- Contact direct avec l'h\xF4te avant et pendant le s\xE9jour
- Flexibilit\xE9 sur early check-in/late check-out
- Paiement s\xE9curis\xE9
- Site : villamaryllis.com \xB7 Email : contact@villamaryllis.com

MARTINIQUE \u2014 INFOS PRATIQUES :
- Meilleure saison : d\xE9cembre\u2013avril (saison s\xE8che) \xB7 Juillet\u2013ao\xFBt (vacances scolaires, forte demande)
- Sainte-Luce : village du Sud Martinique, 15 min du Marin, 30 min du Fran\xE7ois, plages \xE0 5-10 min
- Vol Paris \u2192 Martinique : ~8h30, vols directs depuis Paris-Orly (Air France, Corsair, Air Cara\xEFbes)
- Location de voiture recommand\xE9e
- Monnaie : Euro (DOM fran\xE7ais)

TOUTES LES PAGES ET RESSOURCES DU SITE (\xE0 proposer proactivement selon le contexte) :

PAGES VILLAS (proposer la page quand on parle d'une villa sp\xE9cifique) :
- villamaryllis.com/amaryllis \u2192 Villa Amaryllis (3ch, 8p, piscine d\xE9bordement, jacuzzi)
- villamaryllis.com/zandoli \u2192 Zandoli (2ch, 5p, piscine cascade, vue mer)
- villamaryllis.com/iguana \u2192 Villa Iguana (2ch, 6p, piscine eau sal\xE9e, vue Diamant)
- villamaryllis.com/geko \u2192 G\xE9ko (1ch, 4p, piscine priv\xE9e, jardin tropical)
- villamaryllis.com/mabouya \u2192 Mabouya (studio, 2p, jacuzzi privatif, vue mer)
- villamaryllis.com/schoelcher \u2192 Bellevue Sch\u0153lcher (infos sur demande)
- villamaryllis.com/nogent \u2192 Appartement Nogent-sur-Marne (IDF)

GUIDES DESTINATIONS (proposer quand on pose des questions sur ces lieux) :
- villamaryllis.com/sainte-luce-martinique \u2192 Tout sur Sainte-Luce : plages (Anse Mabouya, Anse Gros Raisin), restaurants, activit\xE9s, vie locale, transports
- villamaryllis.com/guide \u2192 Guide complet Martinique : incontournables, carte des villas, exp\xE9riences locales, road trip, gastronomie cr\xE9ole
- villamaryllis.com/guide-le-diamant \u2192 Guide Le Diamant : Rocher du Diamant, plage, village, activit\xE9s
- villamaryllis.com/guide-sainte-anne \u2192 Guide Sainte-Anne : plages paradisiaques, village cr\xE9ole, resto bord de mer
- villamaryllis.com/guide-arlet \u2192 Guide Les Anses d'Arlet : village de p\xEAcheurs, snorkeling, plong\xE9e, tortues marines
- villamaryllis.com/guide-trois-ilets \u2192 Guide Les Trois-\xCElets : village colonial, golf, kayak, village de la Poterie
- villamaryllis.com/guide-proximite \u2192 Ce qu'il y a \xE0 proximit\xE9 des villas : plages, supermarch\xE9s, pharmacies, distilleries
- villamaryllis.com/activites-sainte-luce \u2192 Activit\xE9s \xE0 Sainte-Luce : plong\xE9e, randonn\xE9e, kayak, surf, excursions
- villamaryllis.com/explorer \u2192 Carte interactive du Sud Martinique : explorer toutes les destinations, cr\xE9er son itin\xE9raire

PAGES PRATIQUES :
- villamaryllis.com/meilleure-saison-martinique \u2192 Quelle saison choisir ? M\xE9t\xE9o mois par mois, tableau comparatif, conseils h\xF4te local
- villamaryllis.com/reservation-directe-martinique \u2192 Pourquoi r\xE9server en direct : \xE9conomies vs Airbnb, process, FAQ r\xE9servation
- villamaryllis.com/seminaires \u2192 Offre s\xE9minaires entreprises : villa en exclusivit\xE9, jusqu'\xE0 8 personnes, devis sous 24h
- villamaryllis.com/villa-rental-martinique \u2192 Version anglaise du guide (pour les anglophones)
- villamaryllis.com/avis \u2192 Tous les avis voyageurs v\xE9rifi\xE9s
- villamaryllis.com/faq \u2192 FAQ compl\xE8te : r\xE9servation, paiement, annulation, caution, animaux, arriv\xE9e

R\xC8GLES POUR PROPOSER LES PAGES :
- Mentionne toujours les liens sous forme villamaryllis.com/page (jamais de https://, le widget les rend cliquables)
- Si quelqu'un h\xE9site entre deux villas \u2192 propose villamaryllis.com/explorer pour comparer sur la carte
- Si on parle de m\xE9t\xE9o / saison \u2192 propose villamaryllis.com/meilleure-saison-martinique
- Si on compare direct vs Airbnb \u2192 propose villamaryllis.com/reservation-directe-martinique
- Si on parle d'une destination proche \u2192 propose le guide correspondant
- Si c'est une entreprise ou \xE9quipe \u2192 propose villamaryllis.com/seminaires
- Si on veut lire des avis \u2192 propose villamaryllis.com/avis
- Pour les questions pratiques non r\xE9solues \u2192 propose villamaryllis.com/faq

Si on te demande la disponibilit\xE9 pour des dates pr\xE9cises, calcule le devis ET pr\xE9cise que la disponibilit\xE9 est \xE0 confirmer sur la page villa ou par email.`;
async function onRequestPost7(context3) {
  const corsHeaders3 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  try {
    const body = await context3.request.json();
    const { messages = [], mode = "public" } = body;
    if (!messages.length) {
      return Response.json({ error: "messages requis" }, { status: 400, headers: corsHeaders3 });
    }
    const apiKey = context3.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GROQ_API_KEY non configur\xE9e" }, { status: 500, headers: corsHeaders3 });
    }
    const systemContent = mode === "admin" ? SYSTEM_PROMPT + "\n\nMODE ADMIN : Tu peux aussi aider \xE0 analyser des donn\xE9es de gestion locative, r\xE9diger des emails professionnels, et r\xE9pondre \xE0 des questions de revenue management." : SYSTEM_PROMPT;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: context3.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemContent },
          ...messages.slice(-10)
          // garder les 10 derniers messages max (contrôle des tokens)
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const err2 = await response.text();
      return Response.json({ error: `xAI API error ${response.status}: ${err2}` }, { status: 502, headers: corsHeaders3 });
    }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const nextMatch = raw.match(/\nNEXT:\s*(.+)$/m);
    const suggestions = nextMatch ? nextMatch[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 3) : [];
    const reply = raw.replace(/\nNEXT:\s*.+$/m, "").trimEnd();
    return Response.json({
      reply,
      suggestions,
      usage: data.usage || null
    }, { headers: corsHeaders3 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders3 });
  }
}
__name(onRequestPost7, "onRequestPost");
async function onRequestOptions10() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions10, "onRequestOptions");

// api/contact.js
var ALLOWED_ORIGINS2 = ["https://villamaryllis.com", "https://www.villamaryllis.com", "https://dashboard-amaryllis.pages.dev"];
function corsHeaders2(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS2.some((o) => origin === o || origin.endsWith(".dashboard-amaryllis.pages.dev"));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://villamaryllis.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
__name(corsHeaders2, "corsHeaders");
async function ensureContactsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nom       TEXT NOT NULL,
      email     TEXT NOT NULL,
      message   TEXT NOT NULL,
      source    TEXT NOT NULL DEFAULT 'formulaire',
      bien      TEXT,
      status    TEXT NOT NULL DEFAULT 'nouveau' CHECK(status IN ('nouveau','r\xE9pondu','archiv\xE9')),
      notes     TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}
__name(ensureContactsTable, "ensureContactsTable");
async function sendNtfyLead(env2, { nom, email, bien, reason = "Resend KO" }) {
  const topic = env2.NTFY_TOPIC;
  if (!topic) return;
  const bienStr = bien ? ` \u2014 ${bien}` : "";
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Title": `\u{1F4E9} Lead Amaryllis${bienStr}`,
      "Priority": "high",
      "Tags": "email,warning"
    },
    body: `${nom} (${email})${bienStr}
\u26A0\uFE0F ${reason} \u2014 lead sauv\xE9 en D1`
  });
}
__name(sendNtfyLead, "sendNtfyLead");
async function onRequestPost8(context3) {
  try {
    const ip = context3.request.headers.get("CF-Connecting-IP") || "unknown";
    const rl = await rateLimit(context3.env.revenue_manager, {
      key: `contact:${ip}`,
      limit: 3,
      windowSec: 3600
    });
    if (!rl.ok) {
      return Response.json({ ok: false, error: "Trop de messages envoy\xE9s. R\xE9essayez dans une heure." }, { status: 429 });
    }
    const body = await context3.request.json();
    const { nom, email, message, bien, source } = body;
    if (!nom || !email || !message) {
      return Response.json({ ok: false, error: "Champs requis manquants" }, { status: 400 });
    }
    const esc = /* @__PURE__ */ __name((s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "esc");
    const db = context3.env.revenue_manager;
    if (db) {
      try {
        await ensureContactsTable(db);
        await db.prepare(
          "INSERT INTO contacts (nom, email, message, source, bien) VALUES (?, ?, ?, ?, ?)"
        ).bind(nom, email, message, source || "formulaire", bien || null).run();
        console.log(`[contact] Lead persist\xE9 en D1: ${email}`);
      } catch (dbErr) {
        console.error("[contact] D1 erreur:", dbErr.message);
      }
    }
    const apiKey = context3.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[contact] RESEND_API_KEY absent \u2014 email non envoy\xE9");
      return Response.json({ ok: !!db, warning: "Email non envoy\xE9 (config manquante)" });
    }
    const toEmail = context3.env.CONTACT_TO_EMAIL || "vinsmaf@hotmail.com";
    const bienLabel = bien ? ` \u2014 ${bien}` : "";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: context3.env.RESEND_FROM || "Amaryllis <contact@villamaryllis.com>",
        to: toEmail,
        reply_to: email,
        subject: `[Amaryllis] Message de ${nom}${bienLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#0e3b3a">Nouveau message \u2014 Amaryllis</h2>
            <p><strong>Nom :</strong> ${esc(nom)}</p>
            <p><strong>Email :</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
            ${bien ? `<p><strong>Propri\xE9t\xE9 :</strong> ${esc(bien)}</p>` : ""}
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="white-space:pre-wrap">${esc(message)}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:11px;color:#888">Ce message a \xE9t\xE9 sauvegard\xE9 automatiquement dans le CRM \u2192 Admin \u2192 Leads</p>
          </div>
        `
      })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("Resend error:", errBody);
      await sendNtfyLead(context3.env, { nom, email, bien, reason: "Resend KO" }).catch(() => {
      });
      return Response.json({ ok: true, warning: "Email non envoy\xE9" });
    }
    return Response.json({ ok: true });
  } catch (err2) {
    console.error("Contact error:", err2);
    return Response.json({ ok: false }, { status: 500 });
  }
}
__name(onRequestPost8, "onRequestPost");
function onRequestOptions11(context3) {
  return new Response(null, { status: 204, headers: corsHeaders2(context3.request) });
}
__name(onRequestOptions11, "onRequestOptions");

// api/contacts.js
var json16 = /* @__PURE__ */ __name((d, s = 200) => Response.json(d, {
  status: s,
  headers: { "Content-Type": "application/json" }
}), "json");
function checkAuth(context3) {
  const authHeader = context3.request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const pwd = context3.env.ADMIN_PASSWORD;
  if (!pwd) return true;
  return token === pwd;
}
__name(checkAuth, "checkAuth");
async function onRequestGet8(context3) {
  if (!checkAuth(context3)) return json16({ error: "Non autoris\xE9" }, 401);
  const db = context3.env.revenue_manager;
  if (!db) return json16({ error: "D1 non configur\xE9" }, 503);
  try {
    const url = new URL(context3.request.url);
    const status = url.searchParams.get("status") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    let query = "SELECT * FROM contacts";
    const params = [];
    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);
    const { results } = await db.prepare(query).bind(...params).all();
    return json16({ ok: true, contacts: results, total: results.length });
  } catch (err2) {
    if (err2.message?.includes("no such table")) {
      return json16({ ok: true, contacts: [], total: 0, hint: "no_table" });
    }
    console.error("[contacts] GET error:", err2);
    return json16({ error: err2.message }, 500);
  }
}
__name(onRequestGet8, "onRequestGet");
async function onRequestPatch(context3) {
  if (!checkAuth(context3)) return json16({ error: "Non autoris\xE9" }, 401);
  const db = context3.env.revenue_manager;
  if (!db) return json16({ error: "D1 non configur\xE9" }, 503);
  const url = new URL(context3.request.url);
  const id = url.searchParams.get("id");
  if (!id) return json16({ error: "id requis" }, 400);
  try {
    const body = await context3.request.json();
    const updates = [];
    const params = [];
    if (body.status !== void 0) {
      updates.push("status = ?");
      params.push(body.status);
    }
    if (body.notes !== void 0) {
      updates.push("notes = ?");
      params.push(body.notes);
    }
    if (updates.length === 0) return json16({ error: "Aucun champ \xE0 mettre \xE0 jour" }, 400);
    params.push(id);
    await db.prepare(`UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
    return json16({ ok: true });
  } catch (err2) {
    console.error("[contacts] PATCH error:", err2);
    return json16({ error: err2.message }, 500);
  }
}
__name(onRequestPatch, "onRequestPatch");
async function onRequestOptions12() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions12, "onRequestOptions");

// api/contacts-alert.js
async function onRequestGet9(context3) {
  const { env: env2, request } = context3;
  const secret = env2.CONTACTS_ALERT_SECRET;
  if (secret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== secret) {
      return json17({ error: "Non autoris\xE9" }, 401);
    }
  }
  const db = env2.revenue_manager;
  if (!db) return json17({ error: "D1 non configur\xE9" }, 503);
  const ntfyTopic = env2.NTFY_TOPIC;
  try {
    const cutoff = Math.floor(Date.now() / 1e3) - 86400;
    const { results } = await db.prepare(
      `SELECT id, nom, email, bien, created_at
       FROM contacts
       WHERE status = 'nouveau' AND created_at < ?
       ORDER BY created_at DESC
       LIMIT 20`
    ).bind(cutoff).all();
    if (!results || results.length === 0) {
      return json17({ ok: true, pending: 0, message: "Aucun lead en attente" });
    }
    if (ntfyTopic) {
      const lines = results.map((r) => {
        const bienStr = r.bien ? ` \u2014 ${r.bien}` : "";
        const hoursAgo = Math.round((Date.now() / 1e3 - r.created_at) / 3600);
        return `\u2022 ${r.nom} (${r.email})${bienStr} \xB7 il y a ${hoursAgo}h`;
      });
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `\u23F3 ${results.length} lead(s) sans r\xE9ponse depuis >24h`,
          "Priority": "default",
          "Tags": "crm,reminder"
        },
        body: lines.join("\n")
      }).catch((e) => console.error("[contacts-alert] ntfy erreur:", e.message));
    }
    return json17({
      ok: true,
      pending: results.length,
      leads: results.map((r) => ({ id: r.id, nom: r.nom, email: r.email, bien: r.bien || null, created_at: r.created_at }))
    });
  } catch (err2) {
    console.error("[contacts-alert] erreur:", err2);
    return json17({ error: err2.message }, 500);
  }
}
__name(onRequestGet9, "onRequestGet");
function json17(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
__name(json17, "json");
async function onRequestOptions13() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" }
  });
}
__name(onRequestOptions13, "onRequestOptions");

// api/create-deposit-intent.js
async function onRequestPost9(context3) {
  const { request, env: env2 } = context3;
  const sk = env2.STRIPE_SECRET_KEY;
  if (!sk) return json18({ error: "STRIPE_SECRET_KEY manquante" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json18({ error: "JSON invalide" }, 400);
  }
  const { amount, currency = "eur", metadata = {} } = body;
  if (!amount || amount < 50) return json18({ error: "Montant invalide" }, 400);
  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    capture_method: "manual",
    "automatic_payment_methods[enabled]": "true",
    "metadata[type]": "deposit",
    "metadata[bienId]": metadata.bienId || "",
    "metadata[checkin]": metadata.checkin || "",
    "metadata[checkout]": metadata.checkout || "",
    "metadata[voyageur]": metadata.voyageur || "",
    "metadata[email]": metadata.email || ""
  });
  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString()
    });
    const parsed = await res.json();
    if (parsed.error) return json18({ error: parsed.error.message }, 400);
    return json18({ clientSecret: parsed.client_secret, id: parsed.id });
  } catch (err2) {
    return json18({ error: err2.message }, 500);
  }
}
__name(onRequestPost9, "onRequestPost");
function onRequestOptions14() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions14, "onRequestOptions");
function json18(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json18, "json");

// api/create-payment-intent.js
async function onRequestPost10(context3) {
  const { request, env: env2 } = context3;
  const sk = env2.STRIPE_SECRET_KEY;
  if (!sk) return json19({ error: "STRIPE_SECRET_KEY manquante" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json19({ error: "JSON invalide" }, 400);
  }
  const { amount, currency = "eur", metadata = {}, bookingId = "" } = body;
  if (!currency || currency !== "eur")
    return json19({ error: "Devise non autoris\xE9e" }, 400);
  if (!amount || amount < 50) return json19({ error: "Montant invalide" }, 400);
  if (amount > 5e5)
    return json19({ error: "Montant hors limites" }, 400);
  const payload = new URLSearchParams({
    amount: String(Math.round(amount)),
    currency,
    "automatic_payment_methods[enabled]": "true",
    "metadata[bienId]": metadata.bienId || "",
    "metadata[checkin]": metadata.checkin || "",
    "metadata[checkout]": metadata.checkout || "",
    "metadata[voyageur]": metadata.voyageur || "",
    "metadata[email]": metadata.email || "",
    "metadata[bookingId]": bookingId || metadata.bookingId || metadata.beds24Id || ""
  });
  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString()
    });
    const parsed = await res.json();
    if (parsed.error) {
      console.error(JSON.stringify({
        level: "error",
        fn: "create-payment-intent",
        msg: parsed.error.message,
        bienId: metadata.bienId || "",
        checkin: metadata.checkin || "",
        checkout: metadata.checkout || "",
        amount,
        ts: (/* @__PURE__ */ new Date()).toISOString()
      }));
      return json19({ error: parsed.error.message }, 400);
    }
    console.log(JSON.stringify({
      level: "info",
      fn: "create-payment-intent",
      msg: "payment intent cr\xE9\xE9",
      paymentIntentId: parsed.id,
      amount,
      currency,
      bienId: metadata.bienId || "",
      checkin: metadata.checkin || "",
      checkout: metadata.checkout || "",
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
    return json19({ clientSecret: parsed.client_secret });
  } catch (err2) {
    console.error(JSON.stringify({
      level: "error",
      fn: "create-payment-intent",
      msg: err2.message,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }));
    return json19({ error: err2.message }, 500);
  }
}
__name(onRequestPost10, "onRequestPost");
function onRequestOptions15() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions15, "onRequestOptions");
function json19(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json19, "json");

// api/geo.js
var FRANCOPHONE = /* @__PURE__ */ new Set([
  "FR",
  "BE",
  "CH",
  "CA",
  "LU",
  "MC",
  "MA",
  "TN",
  "DZ",
  "SN",
  "CI",
  "CM",
  "MQ",
  "GP",
  "GY",
  "BL",
  "MF",
  "RE",
  "PM",
  "WF",
  "PF",
  "NC",
  "YT",
  "MU",
  "SC",
  "DJ",
  "KM",
  "BJ",
  "BF",
  "CD",
  "CG",
  "CF",
  "GA",
  "GN",
  "GQ",
  "HT",
  "ML",
  "MR",
  "NE",
  "RW",
  "TD",
  "TG"
]);
var CARIBBEAN = /* @__PURE__ */ new Set(["MQ", "GP", "GY", "BL", "MF", "LC", "BB", "DM", "VC", "AG", "KN", "TT"]);
async function onRequestGet10(context3) {
  const { request } = context3;
  const h = request.headers;
  const country = h.get("CF-IPCountry") || "XX";
  const city = h.get("CF-IPCity") || null;
  const region = h.get("CF-IPRegion") || null;
  const suggestedLang = FRANCOPHONE.has(country) ? "fr" : "en";
  const isCaribbean = CARIBBEAN.has(country);
  const isFranceMainland = country === "FR";
  const IDF_CITIES = [
    "Paris",
    "Versailles",
    "Boulogne",
    "Vincennes",
    "Cr\xE9teil",
    "Bobigny",
    "Nanterre",
    "\xC9vry",
    "Cergy",
    "Saint-Denis",
    "Montreuil",
    "Argenteuil",
    "Vitry",
    "Colombes",
    "Asni\xE8res",
    "Courbevoie",
    "Nanterre",
    "Levallois",
    "Nogent",
    "Roissy"
  ];
  const isIDF = isFranceMainland && city && IDF_CITIES.some((c) => city.includes(c));
  return new Response(JSON.stringify({
    country,
    city,
    region,
    suggestedLang,
    isCaribbean,
    isFranceMainland,
    isIDF
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
      // personnalisé par IP, ne jamais cacher
    }
  });
}
__name(onRequestGet10, "onRequestGet");
async function onRequestOptions16() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}
__name(onRequestOptions16, "onRequestOptions");

// api/get-config.js
async function onRequestGet11(context3) {
  const { env: env2 } = context3;
  const icalAirbnb = {};
  const icalVarMap = {
    amaryllis: "ICAL_AMARYLLIS",
    schoelcher: "ICAL_SCHOELCHER",
    geko: "ICAL_GEKO",
    mabouya: "ICAL_MABOUYA",
    zandoli: "ICAL_ZANDOLI",
    iguana: "ICAL_IGUANA",
    nogent: "ICAL_NOGENT"
  };
  for (const [bienId, envKey] of Object.entries(icalVarMap)) {
    if (env2[envKey]) icalAirbnb[bienId] = env2[envKey];
  }
  const data = {
    ok: true,
    scriptUrl: env2.APPS_SCRIPT_URL || "",
    icalAirbnb: Object.keys(icalAirbnb).length > 0 ? icalAirbnb : null,
    // cpw-006 : clé Stripe publique servie depuis env, hors bundle JS
    stripePk: env2.STRIPE_PUBLIC_KEY || ""
  };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
__name(onRequestGet11, "onRequestGet");
async function onRequestOptions17() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}
__name(onRequestOptions17, "onRequestOptions");

// api/health-check.js
var CORS11 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store"
};
async function onRequestGet12(context3) {
  const { env: env2 } = context3;
  const checks = {};
  let allOk = true;
  try {
    const db = env2.revenue_manager;
    if (!db) throw new Error("binding manquant");
    await db.prepare("SELECT 1").first();
    checks.d1 = { ok: true };
  } catch (e) {
    checks.d1 = { ok: false, error: e.message };
    allOk = false;
  }
  try {
    const token = env2.BEDS24_TOKEN;
    if (!token) throw new Error("BEDS24_TOKEN manquant");
    const res = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token },
      signal: AbortSignal.timeout(5e3)
    });
    const data = await res.json();
    if (!data.validToken) throw new Error("token invalide");
    const expiresIn = data.token?.expiresIn ?? null;
    checks.beds24 = { ok: true, expiresIn };
    if (expiresIn !== null && expiresIn < 604800) {
      checks.beds24.warning = `Token Beds24 expire dans ${Math.round(expiresIn / 86400)}j`;
    }
  } catch (e) {
    checks.beds24 = { ok: false, error: e.message };
    allOk = false;
  }
  try {
    if (!env2.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");
    checks.resend = { ok: true };
  } catch (e) {
    checks.resend = { ok: false, error: e.message };
    allOk = false;
  }
  const status = allOk ? 200 : 503;
  return new Response(JSON.stringify({
    ok: allOk,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    checks
  }), { status, headers: CORS11 });
}
__name(onRequestGet12, "onRequestGet");

// api/manage-deposit.js
async function onRequestPost11(context3) {
  const { request, env: env2 } = context3;
  const sk = env2.STRIPE_SECRET_KEY;
  if (!sk) return json20({ error: "STRIPE_SECRET_KEY manquante" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json20({ error: "JSON invalide" }, 400);
  }
  const { action, paymentIntentId, amount } = body;
  if (action === "list") {
    try {
      const res = await fetch(
        "https://api.stripe.com/v1/payment_intents/search?query=status%3A%27requires_capture%27%20AND%20metadata%5B%27type%27%5D%3A%27deposit%27&limit=50",
        { headers: { Authorization: `Bearer ${sk}` } }
      );
      const parsed = await res.json();
      if (parsed.error) return json20({ error: parsed.error.message }, 400);
      return json20({ ok: true, data: parsed.data || [] });
    } catch (err2) {
      return json20({ error: err2.message }, 500);
    }
  }
  if (!paymentIntentId) return json20({ error: "paymentIntentId requis" }, 400);
  let url;
  if (action === "capture") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`;
  } else if (action === "cancel") {
    url = `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`;
  } else {
    return json20({ error: "Action invalide (capture | cancel | list)" }, 400);
  }
  const capturePayload = action === "capture" && amount ? new URLSearchParams({ amount_to_capture: String(Math.round(amount * 100)) }).toString() : "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: capturePayload
    });
    const parsed = await res.json();
    if (parsed.error) return json20({ error: parsed.error.message }, 400);
    return json20({ ok: true, status: parsed.status });
  } catch (err2) {
    return json20({ error: err2.message }, 500);
  }
}
__name(onRequestPost11, "onRequestPost");
function onRequestOptions18() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions18, "onRequestOptions");
function json20(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json20, "json");

// api/send-prix-alert.js
var CORS12 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json21 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS12 }), "json");
var BIEN_LABELS = {
  amaryllis: "Villa Amaryllis",
  schoelcher: "Bellevue Sch\u0153lcher",
  geko: "G\xE9ko",
  mabouya: "Mabouya",
  zandoli: "Zandoli",
  iguana: "Villa Iguana",
  nogent: "Appartement Nogent"
};
async function onRequestOptions19() {
  return new Response(null, { status: 204, headers: CORS12 });
}
__name(onRequestOptions19, "onRequestOptions");
async function onRequestPost12(context3) {
  const { request, env: env2 } = context3;
  let body;
  try {
    body = await request.json();
  } catch {
    return json21({ error: "JSON invalide" }, 400);
  }
  const { bienId, dates = [], minPrice, year } = body;
  if (!bienId || dates.length === 0 || !minPrice) {
    return json21({ error: "bienId, dates, minPrice requis" }, 400);
  }
  const bienNom = BIEN_LABELS[bienId] || bienId;
  const dateList = dates.sort((a, b) => a.date.localeCompare(b.date)).map(({ date, price }) => {
    const [, m, d] = date.split("-");
    return { date, price, label: `${d}/${m}` };
  });
  const emailSent = await sendEmail(env2, bienNom, dateList, minPrice, year);
  const ntfySent = await sendNtfy(env2, bienNom, dateList, minPrice);
  return json21({ ok: true, emailSent, ntfySent, count: dateList.length });
}
__name(onRequestPost12, "onRequestPost");
async function sendEmail(env2, bienNom, dates, minPrice, year) {
  if (!env2.RESEND_API_KEY) return false;
  const dest = env2.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const rows = dates.slice(0, 30).map(({ label, price }) => `
    <tr>
      <td style="padding:6px 14px;color:#0e3b3a;font-weight:600;">${label}</td>
      <td style="padding:6px 14px;color:#ef4444;font-weight:700;">${price}\u20AC</td>
      <td style="padding:6px 14px;color:#f59e0b;font-size:12px;">seuil ${minPrice}\u20AC \u2014 manque ${minPrice - price}\u20AC</td>
    </tr>`).join("");
  const extra = dates.length > 30 ? `<p style="margin:8px 0;font-size:12px;color:#7a6b5a;">\u2026 et ${dates.length - 30} autres dates</p>` : "";
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;">
      <div style="max-width:560px;margin:32px auto;background:#fffdf9;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#b04530;padding:24px 28px;">
          <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">\u26A0\uFE0F Alerte prix</h1>
          <p style="margin:6px 0 0;color:#fde8e0;font-size:13px;">${bienNom}${year ? ` \u2014 ${year}` : ""}</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-size:14px;color:#0e3b3a;">
            <strong>${dates.length} date${dates.length > 1 ? "s" : ""}</strong> en dessous du prix minimum autoris\xE9 (<strong>${minPrice}\u20AC</strong>) pour <strong>${bienNom}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#fde8e0;">
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">Date</th>
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">Prix</th>
                <th style="padding:6px 14px;text-align:left;color:#7a6b5a;font-size:11px;">\xC9cart</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${extra}
          <div style="margin-top:20px;text-align:center;">
            <a href="https://villamaryllis.com/admin" style="background:#0e3b3a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;">Corriger dans le dashboard \u2192</a>
          </div>
        </div>
        <div style="padding:14px 28px;background:#fde8e0;text-align:center;font-size:11px;color:#7a6b5a;">Amaryllis Dashboard \xB7 Alerte automatique</div>
      </div>
    </body>
    </html>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: context.env.RESEND_FROM || "Amaryllis <notifications@mail.villamaryllis.com>",
        to: [dest],
        subject: `\u26A0\uFE0F ${dates.length} prix sous seuil \u2014 ${bienNom}`,
        html
      })
    });
    return r.ok;
  } catch {
    return false;
  }
}
__name(sendEmail, "sendEmail");
async function sendNtfy(env2, bienNom, dates, minPrice) {
  const topic = env2.NTFY_TOPIC;
  if (!topic) return false;
  const sample = dates.slice(0, 5).map(({ label, price }) => `${label}(${price}\u20AC)`).join(", ");
  const body = `${dates.length} date${dates.length > 1 ? "s" : ""} sous ${minPrice}\u20AC \xB7 ${sample}${dates.length > 5 ? " \u2026" : ""}`;
  try {
    const r = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": `\u26A0\uFE0F Prix sous seuil \u2014 ${bienNom}`,
        "Priority": "high",
        "Tags": "warning,moneybag"
      },
      body
    });
    return r.ok;
  } catch {
    return false;
  }
}
__name(sendNtfy, "sendNtfy");

// api/send-prix-recap.js
var LISTINGS2 = [
  { nom: "Villa Amaryllis", id: "54269844", base: 280 },
  { nom: "Zandoli", id: "792768220924504884", base: 220 },
  { nom: "G\xE9ko", id: "1263155865459755724", base: 150 },
  { nom: "Mabouya", id: "1046596752160926069", base: 110 },
  { nom: "Bellevue", id: "24242415", base: 100 }
];
function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
__name(formatDate, "formatDate");
function buildHtml() {
  const today = /* @__PURE__ */ new Date();
  const rows = LISTINGS2.map((l) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;font-weight:600;color:#0e3b3a;">${l.nom}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;color:#555;">\xC0 partir de <strong>${l.base}\u20AC</strong>/nuit</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e8dcc8;">
        <a href="https://www.airbnb.fr/hosting/listings/${l.id}/pricing"
           style="background:#c47254;color:#fff;padding:7px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">
          Modifier les prix \u2192
        </a>
      </td>
    </tr>`).join("");
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5e9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0e3b3a;padding:32px 32px 24px;">
      <p style="color:#c47254;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Rappel automatique</p>
      <h1 style="color:#faf5e9;font-weight:300;font-size:24px;margin:0;letter-spacing:0.05em;">Synchronisation des prix Airbnb</h1>
      <p style="color:rgba(250,245,233,0.6);font-size:13px;margin:12px 0 0;">${formatDate(today)}</p>
    </div>
    <div style="padding:28px 32px 8px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Pensez \xE0 v\xE9rifier et synchroniser vos tarifs sur Airbnb pour les 30 prochains jours.
        Cliquez sur chaque logement pour acc\xE9der directement \xE0 la page de tarification.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8dcc8;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f5efe0;">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Logement</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Prix de base</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:24px 32px 32px;">
      <a href="https://www.airbnb.fr/hosting/listings"
         style="display:inline-block;background:#0e3b3a;color:#faf5e9;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.06em;">
        Ouvrir Airbnb Host \u2192
      </a>
    </div>
    <div style="background:#f5efe0;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">Message automatique \xB7 <a href="https://villamaryllis.com" style="color:#aaa;">villamaryllis.com</a></p>
    </div>
  </div>
</body>
</html>`;
}
__name(buildHtml, "buildHtml");
async function onRequestGet13(context3) {
  const url = new URL(context3.request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== context3.env.PRIX_RECAP_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const resendKey = context3.env.RESEND_API_KEY;
  const toEmail = context3.env.RECAP_EMAIL;
  if (!resendKey || !toEmail) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY et RECAP_EMAIL manquants" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: context3.env.RESEND_FROM || "Amaryllis <notifications@mail.villamaryllis.com>",
        to: [toEmail],
        subject: `\u{1F4C5} Rappel prix Airbnb \u2014 ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR")}`,
        html: buildHtml()
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Resend error", details: data }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ ok: true, sent_at: (/* @__PURE__ */ new Date()).toISOString(), id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(onRequestGet13, "onRequestGet");

// api/sheets-proxy.js
async function onRequestPost13(context3) {
  const { request, env: env2 } = context3;
  const headerUrl = request.headers.get("X-Script-Url");
  let scriptUrl = env2.APPS_SCRIPT_URL;
  if (!scriptUrl && headerUrl) {
    try {
      const p = new URL(headerUrl);
      if (p.hostname === "script.google.com" && p.protocol === "https:") scriptUrl = headerUrl;
    } catch {
    }
  }
  if (!scriptUrl) return json22({ error: "APPS_SCRIPT_URL manquante" }, 500);
  let body;
  try {
    body = await request.text();
  } catch {
    return json22({ error: "Body invalide" }, 400);
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }
  if (parsed && parsed.action === "importAllReservations" && Array.isArray(parsed.reservations)) {
    return forwardChunked(scriptUrl, "importAllReservations", parsed.reservations);
  }
  if (parsed && parsed.action === "importBeds24" && Array.isArray(parsed.bookings)) {
    return forwardChunked(scriptUrl, "importBeds24", parsed.bookings);
  }
  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "follow"
    });
    const text = await res.text();
    try {
      JSON.parse(text);
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (_) {
      return json22({
        error: "Apps Script returned non-JSON",
        status: res.status,
        preview: text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400)
      }, 502);
    }
  } catch (err2) {
    return json22({ error: err2.message }, 502);
  }
}
__name(onRequestPost13, "onRequestPost");
var APPS_SCRIPT_URL_LIMIT = 1800;
async function forwardChunked(scriptUrl, action, items) {
  const chunks = [];
  let current = [];
  for (const item of items) {
    current.push(item);
    const testUrl = `${scriptUrl}?action=${action}&data=${encodeURIComponent(JSON.stringify(current))}`;
    if (testUrl.length > APPS_SCRIPT_URL_LIMIT && current.length > 1) {
      chunks.push(current.slice(0, -1));
      current = [item];
    }
  }
  if (current.length > 0) chunks.push(current);
  let totalAdded = 0, totalUpdated = 0, errors = [];
  for (let ci = 0; ci < chunks.length; ci++) {
    const params = new URLSearchParams({
      action,
      data: JSON.stringify(chunks[ci])
    });
    const url = `${scriptUrl}?${params}`;
    try {
      const r = await fetch(url, { redirect: "follow" });
      const t = await r.text();
      try {
        const d = JSON.parse(t);
        totalAdded += d.added || 0;
        totalUpdated += d.updated || 0;
        if (d.error) errors.push(`chunk ${ci}: ${d.error}`);
      } catch (_) {
        errors.push(`chunk ${ci}: non-JSON response`);
      }
    } catch (err2) {
      errors.push(`chunk ${ci}: ${err2.message}`);
    }
  }
  const result = {
    ok: errors.length === 0,
    added: totalAdded,
    updated: totalUpdated,
    total: items.length,
    chunks: chunks.length
  };
  if (errors.length) result.errors = errors;
  return json22(result);
}
__name(forwardChunked, "forwardChunked");
async function onRequestOptions20() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Script-Url"
    }
  });
}
__name(onRequestOptions20, "onRequestOptions");
function json22(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json22, "json");

// api/stripe-webhook.js
var BEDS24_V2_BOOKINGS3 = "https://beds24.com/api/v2/bookings";
var BEDS24_AUTH_TOKEN2 = "https://beds24.com/api/v2/authentication/token";
async function getBeds24Token(env2) {
  if (env2.BEDS24_REFRESH_TOKEN) {
    const res = await fetch(BEDS24_AUTH_TOKEN2, { headers: { refreshToken: env2.BEDS24_REFRESH_TOKEN } });
    const data = await res.json();
    if (!data.token) throw new Error("Beds24 refresh token invalide ou expir\xE9");
    return data.token;
  }
  if (env2.BEDS24_TOKEN) return env2.BEDS24_TOKEN;
  throw new Error("BEDS24_TOKEN ou BEDS24_REFRESH_TOKEN manquant");
}
__name(getBeds24Token, "getBeds24Token");
async function confirmBeds24Booking(bookingId, env2) {
  const token = await getBeds24Token(env2);
  const res = await fetch(BEDS24_V2_BOOKINGS3, {
    method: "PATCH",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify([{ id: bookingId, status: "confirmed" }])
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Beds24 PATCH \xE9chou\xE9 (${res.status}): ${JSON.stringify(data)}`);
  console.log(`[webhook] Beds24 booking ${bookingId} \u2192 confirmed`, JSON.stringify(data));
  return data;
}
__name(confirmBeds24Booking, "confirmBeds24Booking");
var json23 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), {
  status: s,
  headers: { "Content-Type": "application/json" }
}), "json");
var NOMS2 = {
  amaryllis: "Villa Amaryllis",
  schoelcher: "Bellevue Sch\u0153lcher",
  geko: "G\xE9ko",
  mabouya: "Mabouya",
  zandoli: "Zandoli",
  iguana: "Villa Iguana",
  nogent: "Appartement Nogent"
};
async function verifyStripeSignature(body, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = {};
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx !== -1) parts[part.slice(0, idx)] = part.slice(idx + 1);
  }
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;
  if (Math.abs(Date.now() / 1e3 - parseInt(timestamp)) > 300) return false;
  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(signatureBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === sig;
}
__name(verifyStripeSignature, "verifyStripeSignature");
async function sendEmail2(env2, { subject, html, to }) {
  if (!env2.RESEND_API_KEY) {
    console.error("[webhook] RESEND_API_KEY absent \u2014 email non envoy\xE9");
    return;
  }
  const recipient = to || env2.NOTIFICATION_EMAIL || "contact@villamaryllis.com";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env2.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env2.RESEND_FROM || "Amaryllis <notifications@mail.villamaryllis.com>",
      to: Array.isArray(recipient) ? recipient : [recipient],
      subject,
      html
    })
  });
  if (!r.ok) {
    const err2 = await r.text().catch(() => "");
    console.error(`[webhook] Resend erreur ${r.status}:`, err2);
  }
}
__name(sendEmail2, "sendEmail");
async function sendConfirmationToGuest(env2, { bienNom, voyageur, email, checkin, checkout, amount, bookingId }) {
  if (!email || !email.includes("@")) {
    console.log("[webhook] Pas d'email voyageur \u2014 confirmation non envoy\xE9e");
    return;
  }
  await sendEmail2(env2, {
    to: email,
    subject: `\u2705 R\xE9servation confirm\xE9e \u2014 ${bienNom}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d0">
        <!-- Header -->
        <div style="background:#0e3b3a;padding:36px 32px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:rgba(250,245,233,0.6);text-transform:uppercase">Amaryllis Locations</p>
          <h1 style="margin:0;font-size:26px;color:#faf5e9;font-weight:300">R\xE9servation confirm\xE9e</h1>
          <p style="margin:12px 0 0;font-size:28px">\u2705</p>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <p style="font-size:16px;color:#0e3b3a;margin-top:0">Bonjour ${voyageur},</p>
          <p style="font-size:14px;color:#4a3f35;line-height:1.7">
            Votre paiement a bien \xE9t\xE9 re\xE7u et votre s\xE9jour \xE0 <strong>${bienNom}</strong> est confirm\xE9.
            Nous avons h\xE2te de vous accueillir !
          </p>

          <!-- R\xE9capitulatif -->
          <div style="background:#f8f5ef;border-radius:12px;padding:20px 24px;margin:24px 0">
            <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a6b5a;font-weight:700">R\xE9capitulatif de votre s\xE9jour</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:7px 0;color:#7a6b5a;width:45%">Propri\xE9t\xE9</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${bienNom}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Arriv\xE9e</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${checkin}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">D\xE9part</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${checkout}</td></tr>
              <tr><td style="padding:7px 0;color:#7a6b5a">Montant pay\xE9</td><td style="padding:7px 0;font-weight:700;color:#0e3b3a">${amount}</td></tr>
              ${bookingId ? `<tr><td style="padding:7px 0;color:#7a6b5a">N\xB0 r\xE9servation</td><td style="padding:7px 0;font-size:12px;color:#5a4a3a">${bookingId}</td></tr>` : ""}
            </table>
          </div>

          <!-- Check-in info -->
          <div style="border-left:3px solid #14b8a6;padding-left:16px;margin:20px 0">
            <p style="margin:0 0 6px;font-weight:700;color:#0e3b3a;font-size:14px">\u{1F4CD} Informations d'arriv\xE9e</p>
            <p style="margin:0;font-size:13px;color:#4a3f35;line-height:1.6">
              Check-in \xE0 partir de <strong>17h00</strong> \xB7 Check-out avant <strong>12h00</strong><br/>
              Vous recevrez les instructions d'acc\xE8s et le code de la bo\xEEte \xE0 cl\xE9s par email dans les 24h avant votre arriv\xE9e.
            </p>
          </div>

          <p style="font-size:13px;color:#4a3f35;line-height:1.7">
            Pour toute question, n'h\xE9sitez pas \xE0 nous contacter directement :<br/>
            \u{1F4F1} WhatsApp : <a href="https://wa.me/33610880772" style="color:#0e3b3a;font-weight:700">+33 6 10 88 07 72</a><br/>
            \u2709\uFE0F Email : <a href="mailto:contact@villamaryllis.com" style="color:#0e3b3a;font-weight:700">contact@villamaryllis.com</a>
          </p>

          <p style="font-size:14px;color:#0e3b3a;margin-bottom:0">\xC0 tr\xE8s bient\xF4t,<br/><strong>L'\xE9quipe Amaryllis Locations</strong></p>
        </div>

        <!-- Footer -->
        <div style="background:#f8f5ef;padding:16px 32px;text-align:center;border-top:1px solid #e8e0d0">
          <p style="margin:0;font-size:11px;color:#7a6b5a">Amaryllis Locations \xB7 <a href="https://villamaryllis.com" style="color:#7a6b5a">villamaryllis.com</a> \xB7 contact@villamaryllis.com</p>
        </div>
      </div>
    `
  });
  console.log(`[webhook] Email confirmation envoy\xE9 \u2192 ${email}`);
}
__name(sendConfirmationToGuest, "sendConfirmationToGuest");
async function onRequestPost14(context3) {
  const { request, env: env2 } = context3;
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!env2.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET non configur\xE9 \u2014 requ\xEAte rejet\xE9e pour s\xE9curit\xE9");
    return json23({ error: "Webhook not configured" }, 503);
  }
  const valid = await verifyStripeSignature(rawBody, sig, env2.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error("[webhook] Signature Stripe invalide \u2014 possible tentative de fraude");
    return json23({ error: "Invalid signature" }, 400);
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json23({ error: "Invalid JSON" }, 400);
  }
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data?.object;
    const meta = pi?.metadata || {};
    const bookingId = meta.bookingId || meta.beds24Id || "";
    const bienId = meta.bienId || "";
    const bienNom = NOMS2[bienId] || bienId || "Amaryllis Locations";
    const voyageur = meta.voyageur || meta.nom || "";
    const guestEmail = meta.email || "";
    const checkin = meta.checkin || "?";
    const checkout = meta.checkout || "?";
    const amount = pi?.amount ? `${(pi.amount / 100).toFixed(0)} \u20AC` : "?";
    if (bookingId) {
      try {
        await confirmBeds24Booking(bookingId, env2);
        console.log(`[webhook] R\xE9servation Beds24 ${bookingId} confirm\xE9e via webhook`);
      } catch (e) {
        console.error(`[webhook] Erreur confirmation Beds24 ${bookingId}:`, e.message);
      }
    } else {
      console.log("[webhook] payment_intent.succeeded sans bookingId \u2014 Beds24 ignor\xE9");
    }
    await sendConfirmationToGuest(env2, { bienNom, voyageur, email: guestEmail, checkin, checkout, amount, bookingId });
    return json23({ ok: true, type: event.type });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const meta = session?.metadata || {};
    const type = meta.type;
    if (type !== "caution") return json23({ ok: true, ignored: true });
    const bienId = meta.bienId || "?";
    const voyageur = meta.voyageur || "voyageur";
    const checkin = meta.checkin || "?";
    const checkout = meta.checkout || "?";
    const amount = session.amount_total ? `${(session.amount_total / 100).toFixed(0)} \u20AC` : "?";
    const bienNom = NOMS2[bienId] || bienId;
    console.log(`[webhook] Caution s\xE9curis\xE9e: ${bienNom} \u2014 ${voyageur} \u2014 ${amount}`);
    await sendEmail2(env2, {
      subject: `\u{1F512} Caution s\xE9curis\xE9e \u2014 ${bienNom} (${voyageur})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8f5ef;padding:32px 24px;border-radius:12px">
          <h2 style="color:#0e3b3a;margin-top:0">\u{1F512} Caution s\xE9curis\xE9e</h2>
          <p>La caution de <strong>${amount}</strong> pour <strong>${voyageur}</strong> a bien \xE9t\xE9 pr\xE9-autoris\xE9e.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0">
            <tr><td style="padding:8px 0;color:#5a4a3a">Bien</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${bienNom}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Voyageur</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${voyageur}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">S\xE9jour</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${checkin} \u2192 ${checkout}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Montant bloqu\xE9</td><td style="padding:8px 0;font-weight:700;color:#0e3b3a">${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#5a4a3a">Lib\xE9ration auto</td><td style="padding:8px 0;color:#14b8a6;font-weight:700">J+3 apr\xE8s ${checkout}</td></tr>
          </table>
          <p style="font-size:13px;color:#7a6b5a">La CB du voyageur n'est PAS d\xE9bit\xE9e. En cas de dommage, connecte-toi \xE0 l'admin \u2192 Cautions pour d\xE9biter le montant souhait\xE9.</p>
          <a href="https://villamaryllis.com/admin" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#0e3b3a;color:#faf5e9;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Ouvrir l'admin \u2192</a>
        </div>
      `
    });
  }
  return json23({ ok: true, type: event.type });
}
__name(onRequestPost14, "onRequestPost");
async function onRequestOptions21() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
}
__name(onRequestOptions21, "onRequestOptions");

// api/weather.js
var LOCATIONS = {
  martinique: { lat: 14.47, lon: -60.92, label: "Sainte-Luce" },
  nogent: { lat: 48.836, lon: 2.481, label: "Nogent-sur-Marne" }
};
async function onRequestGet14(context3) {
  const { request, env: env2 } = context3;
  const apiKey = env2.OPENWEATHER_API_KEY;
  if (!apiKey) return json24({ error: "OPENWEATHER_API_KEY manquante" }, 500);
  const url = new URL(request.url);
  const locKey = url.searchParams.get("loc") || "martinique";
  const loc = LOCATIONS[locKey] || LOCATIONS.martinique;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}&units=metric&lang=fr`,
      { cf: { cacheTtl: 1800, cacheEverything: true } }
    );
    if (!res.ok) return json24({ error: "OpenWeatherMap error" }, 502);
    const d = await res.json();
    return json24({
      loc: loc.label,
      temp: Math.round(d.main.temp),
      feels: Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      wind: Math.round(d.wind.speed * 3.6),
      // m/s → km/h
      desc: d.weather[0].description,
      icon: d.weather[0].icon,
      id: d.weather[0].id
    });
  } catch (err2) {
    return json24({ error: err2.message }, 502);
  }
}
__name(onRequestGet14, "onRequestGet");
async function onRequestOptions22() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}
__name(onRequestOptions22, "onRequestOptions");
function json24(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=1800"
    }
  });
}
__name(json24, "json");

// api/agents-actions.js
var CORS13 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json25 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS13 }), "json");
var DDL = `
CREATE TABLE IF NOT EXISTS agent_actions (
  id           TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,
  agent_label  TEXT NOT NULL,
  agent_emoji  TEXT NOT NULL,
  category     TEXT NOT NULL,
  action       TEXT NOT NULL,
  priority     TEXT NOT NULL CHECK(priority IN ('critique','haute','moyenne','basse')),
  effort       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'backlog',
  notes        TEXT,
  last_analyzed INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent  ON agent_actions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_prio   ON agent_actions(priority);
`;
var MIGRATE_DDL = `
CREATE TABLE IF NOT EXISTS agent_actions_v2 (
  id           TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,
  agent_label  TEXT NOT NULL,
  agent_emoji  TEXT NOT NULL,
  category     TEXT NOT NULL,
  action       TEXT NOT NULL,
  priority     TEXT NOT NULL CHECK(priority IN ('critique','haute','moyenne','basse')),
  effort       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'backlog',
  notes        TEXT,
  last_analyzed INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT OR IGNORE INTO agent_actions_v2 SELECT * FROM agent_actions;
DROP TABLE agent_actions;
ALTER TABLE agent_actions_v2 RENAME TO agent_actions;
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent  ON agent_actions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_prio   ON agent_actions(priority);
`;
var SEED = [
  // ── Juriste Compliance ──────────────────────────────────────────────────
  { id: "jur-001", agent: "juriste-compliance", agent_label: "Juriste Compliance", agent_emoji: "\u2696\uFE0F", category: "legal", priority: "critique", effort: "30min", action: "Ajouter mentions RGPD sur les formulaires contact et r\xE9servation (art. 13 RGPD)" },
  { id: "jur-002", agent: "juriste-compliance", agent_label: "Juriste Compliance", agent_emoji: "\u2696\uFE0F", category: "legal", priority: "critique", effort: "4h", action: "R\xE9diger les CGV \u2014 manquantes alors que Stripe encaisse des paiements (contrat non form\xE9)" },
  { id: "jur-003", agent: "juriste-compliance", agent_label: "Juriste Compliance", agent_emoji: "\u2696\uFE0F", category: "legal", priority: "haute", effort: "1h", action: "Corriger expiration consentement cookies (localStorage infini \u2192 13 mois max CNIL)" },
  { id: "jur-004", agent: "juriste-compliance", agent_label: "Juriste Compliance", agent_emoji: "\u2696\uFE0F", category: "securite", priority: "haute", effort: "30min", action: "Corriger CORS ouvert sur /api/contact (Access-Control-Allow-Origin: *)" },
  // ── Architecte Réseau ───────────────────────────────────────────────────
  { id: "arch-001", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "securite", priority: "critique", effort: "1h", action: "Migrer URLs iCal Airbnb (tokens hardcod\xE9es dans Worker) vers wrangler secret put" },
  { id: "arch-002", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "securite", priority: "critique", effort: "30min", action: "Activer v\xE9rification HMAC Stripe webhook (bypass\xE9 si STRIPE_WEBHOOK_SECRET absent)" },
  { id: "arch-003", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "securite", priority: "haute", effort: "30min", action: "Ajouter headers s\xE9curit\xE9 HTTP dans public/_headers (CSP, X-Frame-Options, X-Content-Type-Options)" },
  { id: "arch-004", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "securite", priority: "haute", effort: "1h", action: "Mettre en place rate limiting WAF Cloudflare sur /api/admin-auth (brute-force possible)" },
  { id: "arch-005", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "securite", priority: "haute", effort: "30min", action: "Mettre en place rate limiting WAF Cloudflare sur /api/contact (anti-spam)" },
  { id: "arch-006", agent: "architecte-reseau", agent_label: "Architecte R\xE9seau", agent_emoji: "\u{1F50C}", category: "technique", priority: "moyenne", effort: "30min", action: "Ajouter timeout AbortController sur fetchICS dans le Worker (risque cron timeout si Airbnb lent)" },
  // ── Webmaster ───────────────────────────────────────────────────────────
  { id: "web-001", agent: "webmaster", agent_label: "Webmaster", agent_emoji: "\u{1F5A5}\uFE0F", category: "technique", priority: "critique", effort: "2h", action: "Compl\xE9ter secrets Cloudflare Pages manquants en production (OPENWEATHER_API_KEY, APIFY_TOKEN, secrets GA4)" },
  { id: "web-002", agent: "webmaster", agent_label: "Webmaster", agent_emoji: "\u{1F5A5}\uFE0F", category: "performance", priority: "haute", effort: "30min", action: "Convertir hosts.jpg (1.8 MB JPEG brut) en WebP optimis\xE9 \u2014 \xE9conomie directe 1.68 MB" },
  { id: "web-003", agent: "webmaster", agent_label: "Webmaster", agent_emoji: "\u{1F5A5}\uFE0F", category: "technique", priority: "haute", effort: "2h", action: "Migrer email contact@villamaryllis.com vers domaine Resend v\xE9rifi\xE9 (d\xE9livrabilit\xE9)" },
  { id: "web-004", agent: "webmaster", agent_label: "Webmaster", agent_emoji: "\u{1F5A5}\uFE0F", category: "securite", priority: "haute", effort: "1h", action: "Lancer npm audit et traiter les vuln\xE9rabilit\xE9s identifi\xE9es" },
  { id: "web-005", agent: "webmaster", agent_label: "Webmaster", agent_emoji: "\u{1F5A5}\uFE0F", category: "doc", priority: "moyenne", effort: "2h", action: "Mettre \xE0 jour la documentation des endpoints (28 r\xE9els vs 7 document\xE9s)" },
  // ── Traffic Manager ─────────────────────────────────────────────────────
  { id: "traf-001", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "performance", priority: "critique", effort: "30min", action: "Passer Stripe.js en chargement async (actuellement synchrone, bloque le parser HTML \u2192 nuit au LCP)" },
  { id: "traf-002", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "haute", effort: "1h", action: "Ajouter hreflang dans chaque fichier pr\xE9rendu (actuellement seulement dans index.html racine)" },
  { id: "traf-003", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "haute", effort: "4h", action: "Cr\xE9er page /sainte-luce-martinique (toutes les villas y sont \u2014 aucune page d\xE9di\xE9e, P0 SEO)" },
  { id: "traf-004", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "haute", effort: "4h", action: "Cr\xE9er page /reservation-directe-martinique (pilier conversion, ~1200 req/mois, quasi 0 concurrence)" },
  { id: "traf-005", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "haute", effort: "1h", action: "Configurer Google Search Console + soumettre sitemap.xml" },
  { id: "traf-006", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "ads", priority: "haute", effort: "2h", action: "Lancer campagne Google Ads Brand (test 200\u20AC \u2014 structure + annonces pr\xEAtes dans rapport)" },
  { id: "traf-007", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "haute", effort: "1h", action: "Corriger 11 meta titles > 60 caract\xE8res tronqu\xE9s par Google (corrections pr\xEAtes dans rapport SEO)" },
  { id: "traf-008", agent: "traffic-manager", agent_label: "Traffic Manager", agent_emoji: "\u{1F4C8}", category: "seo", priority: "moyenne", effort: "4h", action: "Cr\xE9er page /meilleure-saison-martinique (top TOFU, 5000+ req/mois)" },
  // ── Data Analyst ────────────────────────────────────────────────────────
  { id: "data-001", agent: "data-analyst", agent_label: "Data Analyst", agent_emoji: "\u{1F4CA}", category: "tracking", priority: "critique", effort: "1h", action: "Corriger double-comptage event purchase GA4 (cod\xE9 dans 2 composants \u2014 analytics corrompus)" },
  { id: "data-002", agent: "data-analyst", agent_label: "Data Analyst", agent_emoji: "\u{1F4CA}", category: "tracking", priority: "critique", effort: "30min", action: "Activer ad_storage dans le consentement cookies (bloqu\xE9 \u2192 tout remarketing impossible)" },
  { id: "data-003", agent: "data-analyst", agent_label: "Data Analyst", agent_emoji: "\u{1F4CA}", category: "tracking", priority: "haute", effort: "1h", action: "Ajouter event view_item_list sur la homepage (CTR des fiches non mesurable actuellement)" },
  { id: "data-004", agent: "data-analyst", agent_label: "Data Analyst", agent_emoji: "\u{1F4CA}", category: "business", priority: "haute", effort: "4h", action: "R\xE9duire co\xFBt conciergerie Nogent (8 575\u20AC/an \u2192 T2 en cashflow n\xE9gatif) ou ren\xE9gocier" },
  { id: "data-005", agent: "data-analyst", agent_label: "Data Analyst", agent_emoji: "\u{1F4CA}", category: "business", priority: "haute", effort: "4h", action: "R\xE9duire d\xE9pendance Booking.com Nogent (79% OTA \u2192 risque de d\xE9r\xE9f\xE9rencement)" },
  // ── Revenue Manager ─────────────────────────────────────────────────────
  { id: "rev-001", agent: "revenue-manager", agent_label: "Revenue Manager", agent_emoji: "\u{1F4A1}", category: "business", priority: "critique", effort: "2h", action: "Synchroniser rate plans Beds24/OTA avec la seed pricing du site (ADR r\xE9el 17-73% sous la seed)" },
  { id: "rev-002", agent: "revenue-manager", agent_label: "Revenue Manager", agent_emoji: "\u{1F4A1}", category: "business", priority: "haute", effort: "2h", action: "Am\xE9liorer distribution Mabouya (RevPAR 23\u20AC, mois entiers \xE0 0\u20AC malgr\xE9 jacuzzi privatif vue mer)" },
  { id: "rev-003", agent: "revenue-manager", agent_label: "Revenue Manager", agent_emoji: "\u{1F4A1}", category: "business", priority: "haute", effort: "4h", action: "Strat\xE9gie basse saison Villa Amaryllis (occupation 33,4% \u2014 mai 13%, septembre 0%)" },
  { id: "rev-004", agent: "revenue-manager", agent_label: "Revenue Manager", agent_emoji: "\u{1F4A1}", category: "business", priority: "haute", effort: "2h", action: "Optimiser s\xE9jours minimum par saison (levier RevPAR \u2014 grille d\xE9taill\xE9e dans rapport)" },
  // ── Développeur Multimédia ──────────────────────────────────────────────
  { id: "media-001", agent: "developpeur-multimedia", agent_label: "D\xE9v. Multim\xE9dia", agent_emoji: "\u{1F3AC}", category: "performance", priority: "haute", effort: "1h", action: "Recompresser 9 photos > 400KB (max: amaryllis/06.webp 780KB) \u2014 commandes cwebp -q 82 pr\xEAtes" },
  { id: "media-002", agent: "developpeur-multimedia", agent_label: "D\xE9v. Multim\xE9dia", agent_emoji: "\u{1F3AC}", category: "ux", priority: "moyenne", effort: "1h", action: "Ajouter animation fadeIn entre photos de la lightbox (swap brutal actuellement)" },
  { id: "media-003", agent: "developpeur-multimedia", agent_label: "D\xE9v. Multim\xE9dia", agent_emoji: "\u{1F3AC}", category: "performance", priority: "basse", effort: "4h", action: "Impl\xE9menter srcset responsive images (variantes 480w / 800w / 1200w \u2014 absentes)" },
  { id: "media-004", agent: "developpeur-multimedia", agent_label: "D\xE9v. Multim\xE9dia", agent_emoji: "\u{1F3AC}", category: "business", priority: "haute", effort: "ext", action: "Cr\xE9er vid\xE9os pr\xE9sentation propri\xE9t\xE9s 30-60s MP4/WebM \u2014 manque critique pour villa 280\u20AC/nuit" },
  // ── Photographe DA ──────────────────────────────────────────────────────
  { id: "photo-001", agent: "photographe-da", agent_label: "Photographe DA", agent_emoji: "\u{1F4F8}", category: "business", priority: "critique", effort: "ext", action: "Shooting photo nuit jacuzzi Mabouya (argument commercial principal \u2014 aucune photo de nuit)" },
  { id: "photo-002", agent: "photographe-da", agent_label: "Photographe DA", agent_emoji: "\u{1F4F8}", category: "performance", priority: "haute", effort: "30min", action: "Recompresser photos Nogent (24-60KB trop l\xE9ger \u2192 sous-dimensionn\xE9 pour affichage plein \xE9cran)" },
  { id: "photo-003", agent: "photographe-da", agent_label: "Photographe DA", agent_emoji: "\u{1F4F8}", category: "seo", priority: "haute", effort: "1h", action: "V\xE9rifier OG images des pages guides (pointent vers Wikimedia \u2014 risque indisponibilit\xE9)" },
  { id: "photo-004", agent: "photographe-da", agent_label: "Photographe DA", agent_emoji: "\u{1F4F8}", category: "business", priority: "haute", effort: "ext", action: "Shooting shot signature Rocher du Diamant pour Villa Iguana (hero photo manquant)" },
  // ── Webdesigner ─────────────────────────────────────────────────────────
  { id: "design-001", agent: "webdesigner", agent_label: "Webdesigner", agent_emoji: "\u{1F3A8}", category: "bug", priority: "haute", effort: "30min", action: "Corriger --font-display dans tokens.css (pointe sur Jost, pas Playfair Display comme document\xE9)" },
  { id: "design-002", agent: "webdesigner", agent_label: "Webdesigner", agent_emoji: "\u{1F3A8}", category: "bug", priority: "haute", effort: "1h", action: "Corriger dark mode ReviewCard (texte illisible en mode sombre \u2014 1 ligne de CSS)" },
  { id: "design-003", agent: "webdesigner", agent_label: "Webdesigner", agent_emoji: "\u{1F3A8}", category: "ux", priority: "haute", effort: "2h", action: "Ajouter RatingBadge sur les cards du listing (coh\xE9rence avec les fiches propri\xE9t\xE9s)" },
  { id: "design-004", agent: "webdesigner", agent_label: "Webdesigner", agent_emoji: "\u{1F3A8}", category: "ux", priority: "moyenne", effort: "2h", action: "Cr\xE9er \xE9tats d'erreur brand\xE9s Amaryllis (404, API timeout \u2014 actuellement pages g\xE9n\xE9riques)" },
  { id: "design-005", agent: "webdesigner", agent_label: "Webdesigner", agent_emoji: "\u{1F3A8}", category: "technique", priority: "moyenne", effort: "4h", action: "Cr\xE9er composants manquants : Toast, Modal, Skeleton, PropertyCard, SectionHeader" },
  // ── Chef Produit Web ────────────────────────────────────────────────────
  { id: "cpw-001", agent: "chef-produit-web", agent_label: "Chef Produit Web", agent_emoji: "\u{1F3D7}\uFE0F", category: "ux", priority: "critique", effort: "4h", action: "Cr\xE9er email de confirmation automatique au voyageur apr\xE8s paiement Stripe (absent actuellement)" },
  { id: "cpw-002", agent: "chef-produit-web", agent_label: "Chef Produit Web", agent_emoji: "\u{1F3D7}\uFE0F", category: "conversion", priority: "haute", effort: "2h", action: "Ajouter widget comparatif prix direct vs Airbnb sur les fiches propri\xE9t\xE9s" },
  { id: "cpw-003", agent: "chef-produit-web", agent_label: "Chef Produit Web", agent_emoji: "\u{1F3D7}\uFE0F", category: "ux", priority: "haute", effort: "30min", action: "Afficher message explicatif pour Villa Iguana d\xE9sactiv\xE9e (d\xE9route les visiteurs)" },
  { id: "cpw-004", agent: "chef-produit-web", agent_label: "Chef Produit Web", agent_emoji: "\u{1F3D7}\uFE0F", category: "seo", priority: "haute", effort: "2h", action: "Ajouter JSON-LD VacationRental dans les pages pr\xE9rendues (client-side seulement actuellement)" },
  // ── Community Manager ───────────────────────────────────────────────────
  { id: "cm-001", agent: "community-manager", agent_label: "Community Manager", agent_emoji: "\u{1F4F1}", category: "business", priority: "haute", effort: "30min", action: "Activer liens r\xE9seaux sociaux dans le footer du site (Instagram / Facebook absents)" },
  { id: "cm-002", agent: "community-manager", agent_label: "Community Manager", agent_emoji: "\u{1F4F1}", category: "content", priority: "haute", effort: "2h", action: "Cr\xE9er calendrier \xE9ditorial Instagram juin 2026 (plan complet + 5 posts r\xE9dig\xE9s dans rapport)" },
  { id: "cm-003", agent: "community-manager", agent_label: "Community Manager", agent_emoji: "\u{1F4F1}", category: "content", priority: "moyenne", effort: "2h", action: "Mettre en place process collecte photos voyageurs UGC via email post-s\xE9jour" },
  { id: "cm-004", agent: "community-manager", agent_label: "Community Manager", agent_emoji: "\u{1F4F1}", category: "content", priority: "moyenne", effort: "4h", action: "Cr\xE9er 12 templates Stories Instagram (rotation mensuelle)" },
  { id: "cm-005", agent: "community-manager", agent_label: "Community Manager", agent_emoji: "\u{1F4F1}", category: "content", priority: "basse", effort: "4h", action: "D\xE9finir strat\xE9gie TikTok / Reels Martinique (format vertical piscine / vue mer)" },
  // ── Commercial / Publicité ──────────────────────────────────────────────
  { id: "pub-001", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "conversion", priority: "haute", effort: "1h", action: "Mettre en avant remises dur\xE9e (-5%/-10%/-15%) dans les descriptions propri\xE9t\xE9s (cod\xE9 mais invisible)" },
  { id: "pub-002", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "conversion", priority: "haute", effort: "1h", action: "R\xE9\xE9crire description Iguana : piscine eau sal\xE9e = 'nager dans la mer' (argument rare non exploit\xE9)" },
  { id: "pub-003", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "bug", priority: "haute", effort: "30min", action: "Afficher rating Bellevue (null dans le code \u2192 badge absent \u2192 freine la conversion)" },
  { id: "pub-004", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "ads", priority: "haute", effort: "4h", action: "Lancer campagnes Google Ads (10 RSA + 5 Meta Ads r\xE9dig\xE9s dans rapport \u2014 budget 4500\u20AC/an)" },
  { id: "pub-005", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "business", priority: "moyenne", effort: "4h", action: "Cr\xE9er page /seminaires d\xE9di\xE9e B2B (offre packag\xE9e 4000\u20AC HT / 3 nuits Villa Amaryllis)" },
  { id: "pub-006", agent: "commercial-publicite", agent_label: "Commercial / Pub", agent_emoji: "\u{1F4BC}", category: "conversion", priority: "moyenne", effort: "1h", action: "Afficher citation James K. sur toutes les fiches (actuellement sur /avis uniquement)" },
  // ── CRM Manager ─────────────────────────────────────────────────────────
  { id: "crm-001", agent: "crm-manager", agent_label: "CRM Manager", agent_emoji: "\u{1F4E7}", category: "crm", priority: "critique", effort: "4h", action: "Persister contacts formulaire en base (actuellement perdus si non trait\xE9s manuellement)" },
  { id: "crm-002", agent: "crm-manager", agent_label: "CRM Manager", agent_emoji: "\u{1F4E7}", category: "crm", priority: "haute", effort: "2h", action: "Cr\xE9er s\xE9quence email post-s\xE9jour J+3 (demande avis Google + fid\xE9lisation)" },
  { id: "crm-003", agent: "crm-manager", agent_label: "CRM Manager", agent_emoji: "\u{1F4E7}", category: "crm", priority: "haute", effort: "2h", action: "Cr\xE9er s\xE9quence email pr\xE9-arriv\xE9e J-7 (conseils locaux + bons plans + contacts utiles)" },
  { id: "crm-004", agent: "crm-manager", agent_label: "CRM Manager", agent_emoji: "\u{1F4E7}", category: "crm", priority: "moyenne", effort: "2h", action: "Cr\xE9er segments Brevo (9 segments d\xE9finis dans rapport : prospect / voyageur / fid\xE8le / perdu\u2026)" },
  { id: "crm-005", agent: "crm-manager", agent_label: "CRM Manager", agent_emoji: "\u{1F4E7}", category: "crm", priority: "basse", effort: "8h", action: "Lancer programme fid\xE9lit\xE9 Amaryllis Club 4 niveaux (ROI estim\xE9 35\xD7 pour 480\u20AC/an)" },
  // ── Consultant e-Business ───────────────────────────────────────────────
  { id: "ebiz-001", agent: "consultant-ebusiness", agent_label: "Consultant e-biz", agent_emoji: "\u{1F680}", category: "conversion", priority: "haute", effort: "4h", action: "Ajouter upsells dans le tunnel r\xE9servation (chef \xE0 domicile, transfert, courses) \u2014 potentiel +390\u20AC/mois" },
  { id: "ebiz-002", agent: "consultant-ebusiness", agent_label: "Consultant e-biz", agent_emoji: "\u{1F680}", category: "business", priority: "haute", effort: "2h", action: "Email post-s\xE9jour \u2192 r\xE9duction d\xE9pendance OTA (objectif 20% \u2192 45% r\xE9servations directes)" },
  { id: "ebiz-003", agent: "consultant-ebusiness", agent_label: "Consultant e-biz", agent_emoji: "\u{1F680}", category: "business", priority: "haute", effort: "4h", action: "Cr\xE9er offre packag\xE9e s\xE9minaires B2B Amaryllis (potentiel +1200\u20AC/mois sur 6 s\xE9minaires/an)" },
  { id: "ebiz-004", agent: "consultant-ebusiness", agent_label: "Consultant e-biz", agent_emoji: "\u{1F680}", category: "conversion", priority: "haute", effort: "4h", action: "Cr\xE9er comparateur prix direct/Airbnb avec calcul \xE9conomie en temps r\xE9el sur la homepage" },
  // ── Responsable Service Client ──────────────────────────────────────────
  { id: "sc-001", agent: "responsable-service-client", agent_label: "Service Client", agent_emoji: "\u{1F91D}", category: "bug", priority: "critique", effort: "30min", action: "Corriger incoh\xE9rence check-in : 16h dans la FAQ vs 17h dans les fiches propri\xE9t\xE9s" },
  { id: "sc-002", agent: "responsable-service-client", agent_label: "Service Client", agent_emoji: "\u{1F91D}", category: "crm", priority: "haute", effort: "2h", action: "Cr\xE9er email automatique mi-s\xE9jour J+3 (satisfaction + services additionnels)" },
  { id: "sc-003", agent: "responsable-service-client", agent_label: "Service Client", agent_emoji: "\u{1F91D}", category: "ops", priority: "moyenne", effort: "4h", action: "Digitaliser les \xE9tats des lieux (application photo + signature horodat\xE9e)" },
  { id: "sc-004", agent: "responsable-service-client", agent_label: "Service Client", agent_emoji: "\u{1F91D}", category: "ops", priority: "moyenne", effort: "2h", action: "D\xE9finir SLA r\xE9ponse < 1h en haute saison (processus + outils + escalade)" },
  // ── Responsable Logistique ──────────────────────────────────────────────
  { id: "log-001", agent: "responsable-logistique", agent_label: "Resp. Logistique", agent_emoji: "\u{1F3E0}", category: "ops", priority: "haute", effort: "2h", action: "Digitaliser carnet contacts prestataires (m\xE9nage, plombier, \xE9lectricien, jardinier par propri\xE9t\xE9)" },
  { id: "log-002", agent: "responsable-logistique", agent_label: "Resp. Logistique", agent_emoji: "\u{1F3E0}", category: "ops", priority: "haute", effort: "4h", action: "R\xE9diger guide proc\xE9dures m\xE9nage prestataire (checklist par propri\xE9t\xE9, standards Amaryllis)" },
  { id: "log-003", agent: "responsable-logistique", agent_label: "Resp. Logistique", agent_emoji: "\u{1F3E0}", category: "ops", priority: "moyenne", effort: "4h", action: "Mettre en place syst\xE8me de suivi des interventions (Notion / Google Sheets)" },
  { id: "log-004", agent: "responsable-logistique", agent_label: "Resp. Logistique", agent_emoji: "\u{1F3E0}", category: "ops", priority: "moyenne", effort: "2h", action: "Cr\xE9er stock tracker partag\xE9 avec niveaux min/max par propri\xE9t\xE9" }
];
async function onRequest8(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS13 });
  const db = env2.revenue_manager;
  if (!db) return json25({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const method = request.method;
  if (method === "GET") {
    const agent = url.searchParams.get("agent");
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const category = url.searchParams.get("category");
    let q = "SELECT * FROM agent_actions WHERE 1=1";
    const params = [];
    if (agent) {
      q += " AND agent = ?";
      params.push(agent);
    }
    if (status) {
      q += " AND status = ?";
      params.push(status);
    }
    if (priority) {
      q += " AND priority = ?";
      params.push(priority);
    }
    if (category) {
      q += " AND category = ?";
      params.push(category);
    }
    q += " ORDER BY CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 WHEN 'moyenne' THEN 3 ELSE 4 END, agent";
    try {
      const { results } = await db.prepare(q).bind(...params).all();
      const stats = { backlog: 0, "en-cours": 0, fait: 0, "bloqu\xE9": 0, "a-planifier": 0 };
      results.forEach((r) => {
        if (r.status in stats) stats[r.status]++;
        else stats[r.status] = (stats[r.status] || 0) + 1;
      });
      return json25({ actions: results, stats, total: results.length });
    } catch (e) {
      if (e.message?.includes("no such table")) {
        return json25({ actions: [], stats: { backlog: 0, "en-cours": 0, fait: 0, "bloqu\xE9": 0, "a-planifier": 0 }, total: 0, hint: "Run POST ?action=init to initialize" });
      }
      return json25({ error: e.message }, 500);
    }
  }
  if (method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) return json25({ error: "id is required" }, 400);
    const body = await request.json().catch(() => ({}));
    const fields = [];
    const params = [];
    if (body.status !== void 0) {
      const valid = ["backlog", "en-cours", "fait", "bloqu\xE9", "a-planifier"];
      if (!valid.includes(body.status)) return json25({ error: "Invalid status" }, 400);
      fields.push("status = ?");
      params.push(body.status);
    }
    if (body.notes !== void 0) {
      fields.push("notes = ?");
      params.push(body.notes);
    }
    if (body.action !== void 0) {
      fields.push("action = ?");
      params.push(body.action);
    }
    if (body.priority !== void 0) {
      fields.push("priority = ?");
      params.push(body.priority);
    }
    if (!fields.length) return json25({ error: "Nothing to update" }, 400);
    fields.push("updated_at = ?");
    params.push(Math.floor(Date.now() / 1e3));
    params.push(id);
    try {
      await db.prepare(`UPDATE agent_actions SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();
      return json25({ ok: true, id });
    } catch (e) {
      return json25({ error: e.message }, 500);
    }
  }
  if (method === "POST") {
    const action = url.searchParams.get("action") || "init";
    const body = await request.json().catch(() => ({}));
    if (action === "migrate") {
      try {
        for (const stmt of MIGRATE_DDL.split(";").map((s) => s.trim()).filter(Boolean)) {
          await db.prepare(stmt).run();
        }
        return json25({ ok: true, message: "Migration termin\xE9e \u2014 CHECK constraint sur status supprim\xE9, 'a-planifier' support\xE9" });
      } catch (e) {
        return json25({ ok: false, error: e.message }, 500);
      }
    }
    if (action === "init") {
      try {
        for (const stmt of DDL.split(";").map((s) => s.trim()).filter(Boolean)) {
          await db.prepare(stmt).run();
        }
        const now = Math.floor(Date.now() / 1e3);
        for (const row of SEED) {
          await db.prepare(`
            INSERT OR IGNORE INTO agent_actions
              (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?)
          `).bind(row.id, row.agent, row.agent_label, row.agent_emoji, row.category, row.action, row.priority, row.effort, now, now).run();
        }
        return json25({ ok: true, seeded: SEED.length, message: `Table agent_actions cr\xE9\xE9e et seed\xE9e avec ${SEED.length} actions` });
      } catch (e) {
        return json25({ error: e.message }, 500);
      }
    }
    if (action === "upsert") {
      const { actions: incoming = [] } = body;
      if (!Array.isArray(incoming) || !incoming.length) return json25({ error: "actions[] is required" }, 400);
      const now = Math.floor(Date.now() / 1e3);
      let inserted = 0, updated = 0;
      for (const row of incoming) {
        if (!row.id || !row.agent || !row.action) continue;
        const existing = await db.prepare("SELECT id FROM agent_actions WHERE id = ?").bind(row.id).first();
        if (existing) {
          await db.prepare(`
            UPDATE agent_actions SET action=?, priority=?, effort=?, last_analyzed=?, updated_at=?
            WHERE id=?
          `).bind(row.action, row.priority || "moyenne", row.effort || "?", now, now, row.id).run();
          updated++;
        } else {
          await db.prepare(`
            INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, last_analyzed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?, ?)
          `).bind(row.id, row.agent, row.agent_label || row.agent, row.agent_emoji || "\u{1F916}", row.category || "autre", row.action, row.priority || "moyenne", row.effort || "?", now, now, now).run();
          inserted++;
        }
      }
      return json25({ ok: true, inserted, updated });
    }
    return json25({ error: `Unknown action: ${action}` }, 400);
  }
  return json25({ error: "Method not allowed" }, 405);
}
__name(onRequest8, "onRequest");

// api/agents-run.js
var CORS14 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json26 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS14 }), "json");
var AGENTS = [
  {
    id: "juriste-compliance",
    label: "Juriste Compliance",
    emoji: "\u2696\uFE0F",
    prefix: "jur",
    focus: "conformit\xE9 RGPD, LCEN, CGV, cookies, formulaires, mentions l\xE9gales, droit de la location meubl\xE9e touristique en France",
    files_hint: "MentionsLegales.jsx, PolitiqueConfidentialite.jsx, CookieBanner.jsx, index.html, PublicSite.jsx (formulaires), functions/api/contact.js"
  },
  {
    id: "architecte-reseau",
    label: "Architecte R\xE9seau",
    emoji: "\u{1F50C}",
    prefix: "arch",
    focus: "s\xE9curit\xE9 r\xE9seau, headers HTTP, CORS, rate limiting, secrets Cloudflare, Workers, webhooks, iCal sync",
    files_hint: "public/_headers, wrangler.toml, workers/ical-sync/index.js, functions/api/beds24-webhook.js, functions/api/stripe-webhook.js"
  },
  {
    id: "webmaster",
    label: "Webmaster",
    emoji: "\u{1F5A5}\uFE0F",
    prefix: "web",
    focus: "infrastructure Cloudflare Pages, variables d'environnement, d\xE9pendances npm, endpoints API, documentation technique",
    files_hint: "package.json, wrangler.toml, functions/api/ (tous les fichiers), .dev.vars.example"
  },
  {
    id: "traffic-manager",
    label: "Traffic Manager",
    emoji: "\u{1F4C8}",
    prefix: "traf",
    focus: "SEO technique, Google Ads, Meta Ads, performances Core Web Vitals, mots-cl\xE9s, pages de destination",
    files_hint: "scripts/prerender.mjs, public/sitemap.xml, public/robots.txt, index.html, src/SEOMeta.jsx"
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    emoji: "\u{1F4CA}",
    prefix: "data",
    focus: "tracking GA4, events analytics, cashflow propri\xE9t\xE9s, mix canal OTA vs direct, KPIs RevPAR/ADR/occupation",
    files_hint: "src/App.jsx (SEED_BIENS, REVENUS_CANAL_2025), index.html (GA4 setup, Consent Mode), PublicSite.jsx (events)"
  },
  {
    id: "revenue-manager",
    label: "Revenue Manager",
    emoji: "\u{1F4A1}",
    prefix: "rev",
    focus: "pricing dynamique, revenue management, taux d'occupation, strat\xE9gie tarifaire OTA vs direct, Beds24",
    files_hint: "src/seedPrices.js, src/RevenueManagerPro.jsx, functions/api/beds24-rates.js, functions/api/rm-*.js"
  },
  {
    id: "developpeur-multimedia",
    label: "D\xE9v. Multim\xE9dia",
    emoji: "\u{1F3AC}",
    prefix: "media",
    focus: "optimisation images WebP, galerie photos, lightbox, carousel, vid\xE9os, sprite SVG, performance m\xE9dias",
    files_hint: "public/photos/ (inventaire), src/PublicSite.jsx (galerie, lightbox), public/icons.svg"
  },
  {
    id: "photographe-da",
    label: "Photographe DA",
    emoji: "\u{1F4F8}",
    prefix: "photo",
    focus: "direction artistique, photo de couverture, OG images, identit\xE9 visuelle propri\xE9t\xE9s, besoins de shooting",
    files_hint: "scripts/prerender.mjs (OG images), public/photos/ (inventaire), src/PublicSite.jsx (HeroBrand)"
  },
  {
    id: "webdesigner",
    label: "Webdesigner",
    emoji: "\u{1F3A8}",
    prefix: "design",
    focus: "design system, tokens CSS, composants primitifs, coh\xE9rence visuelle, UX, dark mode, accessibilit\xE9",
    files_hint: "src/tokens.css, src/primitives.jsx, src/PublicSite.jsx (animations, composants)"
  },
  {
    id: "chef-produit-web",
    label: "Chef Produit Web",
    emoji: "\u{1F3D7}\uFE0F",
    prefix: "cpw",
    focus: "roadmap produit, user stories, features manquantes, funnel de conversion, exp\xE9rience voyageur",
    files_hint: "src/App.jsx, src/PublicSite.jsx, src/main.jsx, functions/api/"
  },
  {
    id: "community-manager",
    label: "Community Manager",
    emoji: "\u{1F4F1}",
    prefix: "cm",
    focus: "r\xE9seaux sociaux, Instagram, Facebook, copywriting, calendrier \xE9ditorial, UGC, engagement",
    files_hint: "src/PublicSite.jsx (footer, descriptions), ~/.claude/agents/skills/community-manager-skills.md"
  },
  {
    id: "commercial-publicite",
    label: "Commercial / Pub",
    emoji: "\u{1F4BC}",
    prefix: "pub",
    focus: "copywriting commercial, Google Ads, Meta Ads, propositions de valeur, landing pages, B2B s\xE9minaires",
    files_hint: "src/PublicSite.jsx (descriptions, CTAs, prix), scripts/prerender.mjs (meta descriptions)"
  },
  {
    id: "crm-manager",
    label: "CRM Manager",
    emoji: "\u{1F4E7}",
    prefix: "crm",
    focus: "CRM, emails automatiques, segmentation, fid\xE9lisation, collecte donn\xE9es voyageurs, Brevo",
    files_hint: "functions/api/contact.js, src/GuestGuide.jsx, src/PublicSite.jsx (formulaires)"
  },
  {
    id: "consultant-ebusiness",
    label: "Consultant e-biz",
    emoji: "\u{1F680}",
    prefix: "ebiz",
    focus: "strat\xE9gie e-business, tunnel de conversion, upsells, r\xE9duction d\xE9pendance OTA, nouvelles sources revenus",
    files_hint: "src/PublicSite.jsx (tunnel r\xE9servation, Stripe), src/App.jsx (donn\xE9es revenus)"
  },
  {
    id: "responsable-service-client",
    label: "Service Client",
    emoji: "\u{1F91D}",
    prefix: "sc",
    focus: "parcours voyageur, check-in/check-out, SLA r\xE9ponse, gestion des avis, templates messages",
    files_hint: "src/PublicSite.jsx (FAQ, descriptions check-in), src/GuestGuide.jsx"
  },
  {
    id: "responsable-logistique",
    label: "Resp. Logistique",
    emoji: "\u{1F3E0}",
    prefix: "log",
    focus: "op\xE9rations logistiques, m\xE9nage, maintenance, prestataires, stocks, planning rotations",
    files_hint: "src/App.jsx (MenageTab), src/PublicSite.jsx (\xE9quipements BIENS)"
  },
  {
    id: "seo-content-writer",
    label: "SEO Content Writer",
    emoji: "\u270D\uFE0F",
    prefix: "seo",
    focus: "r\xE9daction SEO, structure contenu, mots-cl\xE9s longue tra\xEEne, guides destination, maillage interne",
    files_hint: "scripts/prerender.mjs (meta data), src/GuideArlet.jsx, src/GuideDiamant.jsx, src/Faq.jsx"
  }
];
async function fetchAgentHistory(db, agentId) {
  try {
    const { results } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? ORDER BY id ASC"
    ).bind(agentId).all();
    return results || [];
  } catch {
    return [];
  }
}
__name(fetchAgentHistory, "fetchAgentHistory");
function buildPrompt(agent, history = []) {
  const done = history.filter((h) => h.status === "fait");
  const blocked = history.filter((h) => h.status === "bloqu\xE9");
  const planned = history.filter((h) => h.status === "a-planifier");
  const pending = history.filter((h) => h.status === "backlog" || h.status === "en-cours");
  const maxNum = history.reduce((max, h) => {
    const n = parseInt(h.id.split("-").pop(), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextId = maxNum + 1;
  const fmt = /* @__PURE__ */ __name((items) => items.map(
    (h) => `  \u2022 [${h.id}] ${h.action}${h.notes ? ` (note: ${h.notes})` : ""}`
  ).join("\n") || "  (aucune)", "fmt");
  const historySection = history.length === 0 ? "" : `
HISTORIQUE DE TES ANALYSES PR\xC9C\xC9DENTES :
${done.length ? `
\u2705 D\xC9J\xC0 FAIT (${done.length}) \u2014 ne pas re-proposer :
${fmt(done)}` : ""}
${blocked.length ? `
\u{1F6AB} BLOQU\xC9 (${blocked.length}) \u2014 \xE9viter ou proposer une alternative :
${fmt(blocked)}` : ""}
${planned.length ? `
\u{1F4C5} \xC0 PLANIFIER (${planned.length}) \u2014 d\xE9j\xE0 identifi\xE9, ne pas dupliquer :
${fmt(planned)}` : ""}
${pending.length ? `
\u23F3 EN ATTENTE (${pending.length}) \u2014 d\xE9j\xE0 dans le backlog, ne pas dupliquer :
${fmt(pending)}` : ""}

IMPORTANT : Tes nouvelles actions doivent compl\xE9ter ce travail, pas le r\xE9p\xE9ter.
Les IDs d\xE9j\xE0 utilis\xE9s vont jusqu'\xE0 ${agent.prefix}-${String(maxNum).padStart(3, "0")}.
Commence tes nouveaux IDs \xE0 ${agent.prefix}-${String(nextId).padStart(3, "0")}.
`;
  return `Tu es l'agent "${agent.label}" (${agent.emoji}) d'Amaryllis Locations, plateforme de location de 7 propri\xE9t\xE9s premium en Martinique et \xCEle-de-France (villamaryllis.com).

TON DOMAINE D'EXPERTISE : ${agent.focus}

FICHIERS CL\xC9S \xE0 analyser : ${agent.files_hint}
${historySection}
MISSION : Identifie les actions concr\xE8tes NOUVELLES \xE0 r\xE9aliser dans ton domaine. Tiens compte de ce qui a d\xE9j\xE0 \xE9t\xE9 fait ou identifi\xE9 pour approfondir ton analyse et aller plus loin.

Propri\xE9t\xE9s : Villa Amaryllis (280\u20AC/nuit, 8 pers, 4.94\u2605), Zandoli (220\u20AC, 5 pers, 4.5\u2605), Villa Iguana (180\u20AC, 6 pers, 4.75\u2605), G\xE9ko (150\u20AC, 4 pers, 4.83\u2605), Mabouya (110\u20AC, 2 pers, 4.55\u2605), Bellevue/Sch\u0153lcher (100\u20AC, 2 pers, 4.8\u2605), Nogent-sur-Marne (85\u20AC, 2 pers, 4.95\u2605).

Retourne un JSON strict avec cette structure :
{
  "actions": [
    {
      "id": "${agent.prefix}-NNN",
      "agent": "${agent.id}",
      "agent_label": "${agent.label}",
      "agent_emoji": "${agent.emoji}",
      "category": "une parmi: securite|legal|performance|seo|tracking|business|conversion|ux|ops|crm|content|ads|doc|technique|bug",
      "action": "Description pr\xE9cise et actionnable de ce qui doit \xEAtre fait (max 150 caract\xE8res)",
      "priority": "critique|haute|moyenne|basse",
      "effort": "dur\xE9e estim\xE9e (30min|1h|2h|4h|8h|ext pour externe)",
      "status": "backlog"
    }
  ]
}

R\xE8gles :
- Maximum 6 actions NOUVELLES (les plus importantes non encore trait\xE9es)
- Priorit\xE9 "critique" = risque l\xE9gal, s\xE9curit\xE9, perte revenus significative
- Priorit\xE9 "haute" = impact business direct mesurable
- "ext" pour effort = ressources externes n\xE9cessaires (photographe, agence, etc.)
- IDs format: ${agent.prefix}-${String(nextId).padStart(3, "0")}, ${agent.prefix}-${String(nextId + 1).padStart(3, "0")}, etc.
- Retourne UNIQUEMENT le JSON, aucun texte avant ou apr\xE8s`;
}
__name(buildPrompt, "buildPrompt");
async function onRequest9(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS14 });
  if (request.method !== "POST") return json26({ error: "POST only" }, 405);
  const apiKey = env2.ANTHROPIC_API_KEY;
  if (!apiKey) return json26({ error: "ANTHROPIC_API_KEY not configured in Cloudflare Pages env vars" }, 503);
  const db = env2.revenue_manager;
  if (!db) return json26({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const body = await request.json().catch(() => ({}));
  const targetAgents = body.agents === "all" || !body.agents ? AGENTS : AGENTS.filter((a) => body.agents.includes(a.id));
  if (!targetAgents.length) return json26({ error: "No matching agents found" }, 400);
  const results = [];
  const now = Math.floor(Date.now() / 1e3);
  for (const agent of targetAgents) {
    try {
      const history = await fetchAgentHistory(db, agent.id);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt(agent, history) }]
        })
      });
      if (!res.ok) {
        results.push({ agent: agent.id, error: `Anthropic API ${res.status}` });
        continue;
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      let parsed;
      try {
        const match2 = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match2 ? match2[0] : text);
      } catch {
        results.push({ agent: agent.id, error: "JSON parse failed", raw: text.slice(0, 200) });
        continue;
      }
      const actions = parsed.actions || [];
      let inserted = 0, updated = 0;
      for (const row of actions) {
        if (!row.id || !row.action) continue;
        const existing = await db.prepare("SELECT id, status FROM agent_actions WHERE id = ?").bind(row.id).first();
        if (existing) {
          const keepStatus = ["fait", "bloqu\xE9", "a-planifier", "en-cours"].includes(existing.status);
          await db.prepare(`
            UPDATE agent_actions SET action=?, priority=?, effort=?, category=?,
            last_analyzed=?, updated_at=? ${keepStatus ? "" : ", status='backlog'"}
            WHERE id=?
          `).bind(row.action, row.priority || "moyenne", row.effort || "?", row.category || "autre", now, now, row.id).run();
          updated++;
        } else {
          await db.prepare(`
            INSERT OR IGNORE INTO agent_actions
              (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, last_analyzed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?, ?)
          `).bind(
            row.id,
            row.agent || agent.id,
            row.agent_label || agent.label,
            row.agent_emoji || agent.emoji,
            row.category || "autre",
            row.action,
            row.priority || "moyenne",
            row.effort || "?",
            now,
            now,
            now
          ).run();
          inserted++;
        }
      }
      results.push({ agent: agent.id, ok: true, inserted, updated, actions: actions.length, context_size: history.length });
    } catch (e) {
      results.push({ agent: agent.id, error: e.message });
    }
  }
  const ok = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => r.error).length;
  return json26({ ok: true, agents_run: targetAgents.length, ok_count: ok, error_count: errors, results });
}
__name(onRequest9, "onRequest");

// api/contacts-purge.js
var TWO_YEARS_SEC = 2 * 365 * 24 * 3600;
async function onRequest10(context3) {
  const { env: env2, request } = context3;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "https://dashboard-amaryllis.pages.dev",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type"
      }
    });
  }
  if (method !== "DELETE") {
    return json27({ error: "M\xE9thode non autoris\xE9e \u2014 utiliser DELETE" }, 405);
  }
  const secret = env2.PURGE_SECRET;
  if (!secret) return json27({ error: "PURGE_SECRET non configur\xE9" }, 503);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== secret) {
    return json27({ error: "Non autoris\xE9" }, 401);
  }
  const db = env2.revenue_manager;
  if (!db) return json27({ error: "D1 non configur\xE9" }, 503);
  const cutoff = Math.floor(Date.now() / 1e3) - TWO_YEARS_SEC;
  try {
    const { results: toDelete } = await db.prepare(
      "SELECT id FROM contacts WHERE created_at < ?"
    ).bind(cutoff).all();
    const count3 = toDelete?.length ?? 0;
    if (count3 > 0) {
      await db.prepare(
        "DELETE FROM contacts WHERE created_at < ?"
      ).bind(cutoff).run();
    }
    const cutoffIso = new Date(cutoff * 1e3).toISOString().slice(0, 10);
    console.log(`[contacts-purge] ${count3} contact(s) supprim\xE9(s) ant\xE9rieurs au ${cutoffIso}`);
    return json27({
      ok: true,
      deleted: count3,
      cutoff_iso: cutoffIso,
      message: count3 > 0 ? `${count3} contact(s) ant\xE9rieur(s) au ${cutoffIso} supprim\xE9(s) (RGPD \u2014 2 ans max)` : `Aucun contact \xE0 purger (seuil : ${cutoffIso})`
    });
  } catch (err2) {
    console.error("[contacts-purge] erreur:", err2);
    return json27({ error: err2.message }, 500);
  }
}
__name(onRequest10, "onRequest");
function json27(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "https://dashboard-amaryllis.pages.dev"
    }
  });
}
__name(json27, "json");

// api/fetch-ical.js
async function onRequest11(context3) {
  const { request } = context3;
  const url = new URL(request.url);
  const icalUrl = url.searchParams.get("url");
  const jsonErr = /* @__PURE__ */ __name((msg, status = 400) => new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  }), "jsonErr");
  if (!icalUrl) return jsonErr("url manquant");
  const ICAL_HOSTS = ["ics.booking.com", "airbnb.com", "www.airbnb.com", "calendar.google.com"];
  let parsedIcalUrl;
  try {
    parsedIcalUrl = new URL(icalUrl);
  } catch {
    return jsonErr("URL invalide");
  }
  if (!["http:", "https:"].includes(parsedIcalUrl.protocol) || !ICAL_HOSTS.includes(parsedIcalUrl.hostname)) {
    return jsonErr("URL non autoris\xE9e");
  }
  try {
    const res = await fetch(icalUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iCal-Proxy/1.0)" },
      redirect: "follow"
    });
    if (!res.ok) return jsonErr(`HTTP ${res.status}`, 502);
    const text = await res.text();
    if (!text.includes("VCALENDAR")) return jsonErr("Format iCal invalide", 422);
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (err2) {
    return jsonErr(err2.message, 502);
  }
}
__name(onRequest11, "onRequest");

// api/get-availability.js
function icalBienMap(env2) {
  return {
    airbnb: {
      amaryllis: env2.ICAL_AMARYLLIS,
      schoelcher: env2.ICAL_SCHOELCHER,
      geko: env2.ICAL_GEKO,
      mabouya: env2.ICAL_MABOUYA,
      iguana: env2.ICAL_IGUANA,
      zandoli: env2.ICAL_ZANDOLI,
      nogent: env2.ICAL_NOGENT
    },
    booking: {
      amaryllis: env2.ICAL_BOOKING_AMARYLLIS,
      schoelcher: env2.ICAL_BOOKING_SCHOELCHER,
      geko: env2.ICAL_BOOKING_GEKO,
      mabouya: env2.ICAL_BOOKING_MABOUYA,
      iguana: env2.ICAL_BOOKING_IGUANA,
      zandoli: env2.ICAL_BOOKING_ZANDOLI,
      nogent: env2.ICAL_BOOKING_NOGENT
    }
  };
}
__name(icalBienMap, "icalBienMap");
async function fetchIcal(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Calendar-Sync/1.0)" },
      redirect: "follow"
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("VCALENDAR") ? text : null;
  } catch {
    return null;
  }
}
__name(fetchIcal, "fetchIcal");
function parseIcal(text) {
  const blocked = /* @__PURE__ */ new Set();
  for (const ev of text.split("BEGIN:VEVENT").slice(1)) {
    const startM = ev.match(/DTSTART(?:;[^:]+)?:(\d{8})/);
    const endM = ev.match(/DTEND(?:;[^:]+)?:(\d{8})/);
    if (!startM || !endM) continue;
    const fmt = /* @__PURE__ */ __name((s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`, "fmt");
    let cur = /* @__PURE__ */ new Date(fmt(startM[1]) + "T12:00:00Z");
    const end = /* @__PURE__ */ new Date(fmt(endM[1]) + "T12:00:00Z");
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return blocked;
}
__name(parseIcal, "parseIcal");
function json28(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600"
    }
  });
}
__name(json28, "json");
async function fetchBeds24Blocked(env2) {
  const token = env2.BEDS24_TOKEN;
  if (!token) return /* @__PURE__ */ new Set();
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const qp = new URLSearchParams({
      propId: "158192",
      arrivalFrom: since,
      numId: "200"
    });
    const res = await fetch(`https://beds24.com/api/v2/bookings?${qp}`, { headers: { token } });
    const data = await res.json();
    if (!data.success) return /* @__PURE__ */ new Set();
    const blocked = /* @__PURE__ */ new Set();
    for (const b of data.data || []) {
      if (b.status === "cancelled") continue;
      if (!b.arrival || !b.departure) continue;
      const cur = /* @__PURE__ */ new Date(b.arrival + "T12:00:00Z");
      const end = /* @__PURE__ */ new Date(b.departure + "T12:00:00Z");
      while (cur < end) {
        blocked.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    return blocked;
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
__name(fetchBeds24Blocked, "fetchBeds24Blocked");
async function onRequest12(context3) {
  const { request, env: env2 } = context3;
  const url = new URL(request.url);
  const bienId = url.searchParams.get("bienId");
  if (!bienId) return json28({ error: "bienId requis" }, 400);
  const VALID_BIENS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
  if (!VALID_BIENS.includes(bienId))
    return json28({ error: "bienId invalide" }, 400);
  const cacheKey = `avail_${bienId}`;
  if (bienId === "nogent") {
    const cached = env2.AVAIL_CACHE ? await env2.AVAIL_CACHE.get(cacheKey, "json") : null;
    if (cached) return json28({ ...cached, fromCache: true });
    const blocked = await fetchBeds24Blocked(env2);
    const result2 = {
      blockedDates: Array.from(blocked).sort(),
      sources: { beds24: { ok: blocked.size >= 0, count: blocked.size } }
    };
    if (env2.AVAIL_CACHE) {
      await env2.AVAIL_CACHE.put(cacheKey, JSON.stringify(result2), { expirationTtl: 600 });
    }
    return json28(result2);
  }
  const bookingUrlParam = url.searchParams.get("bookingUrl");
  if (!bookingUrlParam) {
    const cached = env2.AVAIL_CACHE ? await env2.AVAIL_CACHE.get(cacheKey, "json") : null;
    if (cached) return json28({ ...cached, fromCache: true });
  }
  const maps = icalBienMap(env2);
  const airbnbUrl = maps.airbnb[bienId];
  const ICAL_HOSTS = ["ics.booking.com", "airbnb.com", "www.airbnb.com", "calendar.google.com"];
  let bookingUrlSafe = null;
  if (bookingUrlParam) {
    try {
      const parsed = new URL(bookingUrlParam);
      if ((parsed.protocol === "https:" || parsed.protocol === "http:") && ICAL_HOSTS.includes(parsed.hostname)) {
        bookingUrlSafe = bookingUrlParam;
      }
    } catch {
    }
  }
  const bookingUrl = maps.booking[bienId] || bookingUrlSafe;
  if (!airbnbUrl && !bookingUrl) {
    return json28({ error: "Aucune URL iCal configur\xE9e pour ce bien" }, 404);
  }
  const [airbnbText, bookingText] = await Promise.all([
    fetchIcal(airbnbUrl),
    fetchIcal(bookingUrl)
  ]);
  const airbnbBlocked = airbnbText ? parseIcal(airbnbText) : /* @__PURE__ */ new Set();
  const bookingBlocked = bookingText ? parseIcal(bookingText) : /* @__PURE__ */ new Set();
  const merged = /* @__PURE__ */ new Set([...airbnbBlocked, ...bookingBlocked]);
  const result = {
    blockedDates: Array.from(merged).sort(),
    sources: {
      airbnb: { ok: !!airbnbText, count: airbnbBlocked.size },
      booking: { ok: !!bookingText, count: bookingBlocked.size, fromParam: !maps.booking[bienId] && !!bookingUrl }
    }
  };
  if (env2.AVAIL_CACHE && !bookingUrlSafe) {
    await env2.AVAIL_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });
  }
  return json28(result);
}
__name(onRequest12, "onRequest");

// api/google-reviews.js
var PLACES = {
  amaryllis: "ChIJWbeKdLghQIwRCppz2lJ39Jk",
  residence: "ChIJc2hlO7chQIwRQaczraCwlNs"
};
function json29(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json29, "json");
async function onRequest13(context3) {
  if (context3.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" }
    });
  }
  try {
    const apiKey = context3.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return json29({ ok: false, error: "GOOGLE_PLACES_API_KEY manquant" }, 503);
    const placeKey = new URL(context3.request.url).searchParams.get("place") || "amaryllis";
    const placeId = PLACES[placeKey] ?? PLACES.amaryllis;
    const fields = "displayName,rating,userRatingCount,reviews.rating,reviews.text,reviews.authorAttribution,reviews.relativePublishTimeDescription";
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`;
    const raw = await fetch(url, {
      headers: {
        "X-Goog-FieldMask": fields,
        "X-Goog-Api-Key": apiKey
      },
      cf: { cacheTtl: 3600, cacheEverything: true }
    });
    if (!raw.ok) {
      const err2 = await raw.text();
      return json29({ ok: false, error: `Google ${raw.status}: ${err2.slice(0, 200)}` }, 200);
    }
    const place = await raw.json();
    return json29({
      ok: true,
      name: place.displayName?.text ?? "Amaryllis Locations",
      rating: place.rating ?? null,
      userRatingsTotal: place.userRatingCount ?? 0,
      reviews: (place.reviews ?? []).map((r) => ({
        author: r.authorAttribution?.displayName ?? "Anonyme",
        avatar: r.authorAttribution?.photoUri ?? null,
        rating: r.rating,
        text: r.text?.text ?? "",
        time: r.relativePublishTimeDescription ?? ""
      }))
    });
  } catch (e) {
    return json29({ ok: false, error: String(e) }, 200);
  }
}
__name(onRequest13, "onRequest");

// api/ical-config.js
function json30(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json30, "json");
async function onRequest14(context3) {
  if (context3.request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" }
    });
  }
  const { env: env2 } = context3;
  return json30({
    ok: true,
    booking: {
      amaryllis: env2.ICAL_BOOKING_AMARYLLIS || "",
      geko: env2.ICAL_BOOKING_GEKO || "",
      mabouya: env2.ICAL_BOOKING_MABOUYA || "",
      schoelcher: env2.ICAL_BOOKING_SCHOELCHER || "",
      zandoli: env2.ICAL_BOOKING_ZANDOLI || ""
    }
  });
}
__name(onRequest14, "onRequest");

// api/rm-dashboard.js
var CORS15 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json31 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS15 }), "json");
async function onRequest15(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS15 });
  const db = env2.revenue_manager;
  if (!db) return json31({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  const property_id = url.searchParams.get("property_id");
  if (!property_id) return json31({ error: "property_id is required" }, 400);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const date90 = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  const date30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  try {
    const [propertyRes, recoRes, kpiRes, signalsRes, allPropsRes] = await Promise.all([
      // Property info
      db.prepare(
        `SELECT p.*,
            (SELECT COUNT(*) FROM rm_seasonal_profiles WHERE property_id = p.id AND is_active = 1) as profile_count
           FROM rm_properties p WHERE p.id = ?`
      ).bind(property_id).first(),
      // Recommendations for next 90 days
      db.prepare(
        `SELECT date, recommended_price_cents, recommended_min_stay, status,
                  confidence_score, vacancy_risk_score, premium_opportunity,
                  market_pressure_score, season_type, is_weekend, is_holiday, is_event,
                  holiday_name, event_name, lead_time_days, summary_fr, alert_flags,
                  override_price_cents, currently_published_cents
           FROM rm_recommendations
           WHERE property_id = ? AND date >= ? AND date <= ?
           ORDER BY date ASC`
      ).bind(property_id, today, date90).all(),
      // KPI snapshot (most recent)
      db.prepare(
        `SELECT * FROM rm_kpi_snapshots
           WHERE property_id = ? AND period_type = '30d'
           ORDER BY snapshot_date DESC LIMIT 1`
      ).bind(property_id).first(),
      // Market signals for next 30 days
      db.prepare(
        `SELECT signal_date, market_pressure_score, scarcity_score, premium_opportunity,
                  vacancy_risk, market_label, availability_rate, price_median_cents,
                  data_confidence, competitors_with_data, competitors_total, alert_flags
           FROM rm_market_signals
           WHERE property_id = ? AND signal_date >= ? AND signal_date <= ?
           ORDER BY signal_date ASC`
      ).bind(property_id, today, date30).all(),
      // All active properties (for sidebar/selector)
      db.prepare(
        `SELECT id, name, short_name, type, positioning, is_active FROM rm_properties WHERE is_active = 1 ORDER BY name`
      ).all()
    ]);
    if (!propertyRes) return json31({ error: "Property not found" }, 404);
    const recommendations = recoRes.results || [];
    const pending = recommendations.filter((r) => r.status === "pending").length;
    const approved = recommendations.filter((r) => r.status === "approved").length;
    const published = recommendations.filter((r) => r.status === "published").length;
    const withPrice = recommendations.filter((r) => r.recommended_price_cents > 0);
    const avgRecoPrice = withPrice.length > 0 ? Math.round(withPrice.reduce((s, r) => s + r.recommended_price_cents, 0) / withPrice.length) : 0;
    const alerts = recommendations.filter((r) => r.alert_flags && r.alert_flags !== "[]" && r.alert_flags !== "null");
    const opportunities = recommendations.filter((r) => (r.vacancy_risk_score || 0) > 60 || (r.premium_opportunity || 0) > 70).sort((a, b) => {
      const scoreA = Math.max(a.vacancy_risk_score || 0, a.premium_opportunity || 0);
      const scoreB = Math.max(b.vacancy_risk_score || 0, b.premium_opportunity || 0);
      return scoreB - scoreA;
    }).slice(0, 5);
    const signals = signalsRes.results || [];
    const signalsSummary = {
      total_days: signals.length,
      avg_pressure: signals.length > 0 ? Math.round(signals.reduce((s, x) => s + (x.market_pressure_score || 0), 0) / signals.length) : null,
      avg_availability_rate: signals.length > 0 ? +(signals.reduce((s, x) => s + (x.availability_rate || 0), 0) / signals.length).toFixed(3) : null,
      strong_days: signals.filter((s) => s.market_label === "strong").length,
      weak_days: signals.filter((s) => s.market_label === "weak").length,
      signals
    };
    return json31({
      property: propertyRes,
      recommendations,
      opportunities,
      kpis: {
        avg_reco_price_cents: avgRecoPrice,
        pending,
        approved,
        published,
        total_90d: recommendations.length,
        alerts_count: alerts.length,
        ...kpiRes || {}
      },
      market_signals: signalsSummary,
      all_properties: allPropsRes.results || [],
      generated_at: Date.now()
    });
  } catch (err2) {
    return json31({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest15, "onRequest");

// api/rm-init.js
var CORS16 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json32 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS16 }), "json");
var DDL2 = `
CREATE TABLE IF NOT EXISTS rm_properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL CHECK(type IN ('court','moyen','long')),
  capacity INTEGER NOT NULL DEFAULT 4,
  bedrooms INTEGER,
  bathrooms INTEGER,
  location TEXT,
  latitude REAL,
  longitude REAL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'America/Martinique',
  base_price_low INTEGER NOT NULL DEFAULT 30000,
  base_price_mid INTEGER NOT NULL DEFAULT 40000,
  base_price_high INTEGER NOT NULL DEFAULT 50000,
  price_min INTEGER NOT NULL DEFAULT 20000,
  price_max INTEGER NOT NULL DEFAULT 90000,
  min_stay_default INTEGER NOT NULL DEFAULT 4,
  min_stay_low INTEGER NOT NULL DEFAULT 3,
  min_stay_mid INTEGER NOT NULL DEFAULT 4,
  min_stay_high INTEGER NOT NULL DEFAULT 5,
  min_stay_last_minute INTEGER NOT NULL DEFAULT 2,
  positioning TEXT NOT NULL DEFAULT 'premium' CHECK(positioning IN ('budget','standard','premium','luxury')),
  beds24_property_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rm_seasonal_profiles (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season_type TEXT NOT NULL CHECK(season_type IN ('low','mid','high','peak')),
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  year INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 10,
  base_price_override INTEGER,
  min_stay_override INTEGER,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seasonal_property ON rm_seasonal_profiles(property_id, year);
CREATE INDEX IF NOT EXISTS idx_seasonal_dates ON rm_seasonal_profiles(date_start, date_end);

CREATE TABLE IF NOT EXISTS rm_pricing_rules (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES rm_properties(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  params TEXT NOT NULL DEFAULT '{}',
  adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('fixed_cents','percent','replace')),
  adjustment_value REAL NOT NULL DEFAULT 0,
  condition_season TEXT,
  condition_lead_time_min INTEGER,
  condition_lead_time_max INTEGER,
  condition_dow TEXT,
  max_adjustment_cents INTEGER,
  priority INTEGER NOT NULL DEFAULT 50,
  is_active INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT,
  valid_until TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rules_property ON rm_pricing_rules(property_id, is_active);

CREATE TABLE IF NOT EXISTS rm_overrides (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  date TEXT NOT NULL,
  override_type TEXT NOT NULL CHECK(override_type IN ('price','min_stay','block')),
  value_cents INTEGER,
  value_int INTEGER,
  reason TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_overrides_property_date ON rm_overrides(property_id, date);

CREATE TABLE IF NOT EXISTS rm_competitor_sets (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 1,
  min_similarity_score INTEGER DEFAULT 40,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rm_competitor_listings (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES rm_competitor_sets(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('airbnb','booking','vrbo','other')),
  platform_listing_id TEXT,
  url TEXT,
  name TEXT NOT NULL,
  internal_label TEXT,
  area TEXT,
  latitude REAL,
  longitude REAL,
  distance_km REAL,
  capacity INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  has_pool INTEGER DEFAULT 0,
  has_sea_view INTEGER DEFAULT 0,
  has_ac INTEGER DEFAULT 0,
  has_garden INTEGER DEFAULT 0,
  standing_estimated TEXT,
  review_score REAL,
  review_count INTEGER,
  similarity_score INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_set ON rm_competitor_listings(set_id, is_active);

CREATE TABLE IF NOT EXISTS rm_competitor_snapshots (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES rm_competitor_listings(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  price_cents INTEGER,
  is_available INTEGER,
  min_stay_observed INTEGER,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','csv','apify','api')),
  apify_run_id TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK(confidence IN ('low','medium','high')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_listing_date ON rm_competitor_snapshots(listing_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON rm_competitor_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS rm_market_signals (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  signal_date TEXT NOT NULL,
  calculated_at INTEGER NOT NULL,
  competitors_total INTEGER NOT NULL DEFAULT 0,
  competitors_with_data INTEGER NOT NULL DEFAULT 0,
  competitors_available INTEGER NOT NULL DEFAULT 0,
  competitors_unavailable INTEGER NOT NULL DEFAULT 0,
  availability_rate REAL,
  price_median_cents INTEGER,
  price_mean_cents INTEGER,
  price_p25_cents INTEGER,
  price_p75_cents INTEGER,
  price_min_cents INTEGER,
  price_max_cents INTEGER,
  high_sim_price_median INTEGER,
  market_pressure_score INTEGER,
  scarcity_score INTEGER,
  premium_opportunity INTEGER,
  vacancy_risk INTEGER,
  data_confidence INTEGER,
  market_label TEXT,
  alert_flags TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(property_id, signal_date)
);
CREATE INDEX IF NOT EXISTS idx_signals_property_date ON rm_market_signals(property_id, signal_date);

CREATE TABLE IF NOT EXISTS rm_holidays (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'MQ',
  holiday_type TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK(impact_level IN ('low','medium','high','peak')),
  uplift_suggestion_percent INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  UNIQUE(date, name, country)
);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON rm_holidays(date);

CREATE TABLE IF NOT EXISTS rm_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  location TEXT,
  event_type TEXT,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK(impact_level IN ('low','medium','high','peak')),
  affects_properties TEXT,
  uplift_suggestion_percent INTEGER DEFAULT 0,
  min_stay_suggestion INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_dates ON rm_events(date_start, date_end);

CREATE TABLE IF NOT EXISTS rm_recommendations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES rm_properties(id),
  date TEXT NOT NULL,
  calculated_at INTEGER NOT NULL,
  recommended_price_cents INTEGER NOT NULL,
  recommended_min_stay INTEGER NOT NULL,
  base_price_cents INTEGER NOT NULL,
  adj_weekday_cents INTEGER DEFAULT 0,
  adj_weekend_cents INTEGER DEFAULT 0,
  adj_holiday_cents INTEGER DEFAULT 0,
  adj_event_cents INTEGER DEFAULT 0,
  adj_lead_time_cents INTEGER DEFAULT 0,
  adj_market_cents INTEGER DEFAULT 0,
  adj_gap_fill_cents INTEGER DEFAULT 0,
  adj_premium_cents INTEGER DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 50,
  market_pressure_score INTEGER,
  vacancy_risk_score INTEGER,
  premium_opportunity INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','overridden','published','expired')),
  override_price_cents INTEGER,
  override_min_stay INTEGER,
  override_reason TEXT,
  currently_published_cents INTEGER,
  alert_flags TEXT,
  season_type TEXT,
  is_weekend INTEGER DEFAULT 0,
  is_holiday INTEGER DEFAULT 0,
  holiday_name TEXT,
  is_event INTEGER DEFAULT 0,
  event_name TEXT,
  lead_time_days INTEGER,
  summary_fr TEXT,
  factors_json TEXT,
  reviewed_at INTEGER,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, date)
);
CREATE INDEX IF NOT EXISTS idx_reco_property_date ON rm_recommendations(property_id, date);
CREATE INDEX IF NOT EXISTS idx_reco_status ON rm_recommendations(status, property_id);
CREATE INDEX IF NOT EXISTS idx_reco_vacancy ON rm_recommendations(vacancy_risk_score DESC);

CREATE TABLE IF NOT EXISTS rm_published_rates (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  min_stay INTEGER NOT NULL,
  published_at INTEGER NOT NULL,
  published_by TEXT NOT NULL DEFAULT 'admin',
  recommendation_id TEXT,
  UNIQUE(property_id, date)
);
CREATE INDEX IF NOT EXISTS idx_published_property_date ON rm_published_rates(property_id, date);

CREATE TABLE IF NOT EXISTS rm_scraping_configs (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES rm_competitor_listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_listing_id TEXT NOT NULL,
  scrape_url TEXT NOT NULL,
  scraping_service TEXT NOT NULL DEFAULT 'apify',
  apify_actor_id TEXT DEFAULT 'dtrungtin/airbnb-scraper',
  scrape_frequency TEXT NOT NULL DEFAULT 'weekly',
  scrape_horizon_days INTEGER NOT NULL DEFAULT 180,
  last_scraped_at INTEGER,
  last_error TEXT,
  consecutive_errors INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(listing_id)
);

CREATE TABLE IF NOT EXISTS rm_kpi_snapshots (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('30d','90d','mtd','ytd')),
  total_revenue_cents INTEGER,
  adr_cents INTEGER,
  occupancy_rate REAL,
  revpar_cents INTEGER,
  nights_sold INTEGER,
  nights_available INTEGER,
  bookings_count INTEGER,
  avg_reco_price_cents INTEGER,
  avg_published_price_cents INTEGER,
  active_opportunities INTEGER DEFAULT 0,
  active_vacancy_risks INTEGER DEFAULT 0,
  calculated_at INTEGER NOT NULL,
  UNIQUE(property_id, snapshot_date, period_type)
);
`;
function parseDDL(sql) {
  return sql.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
}
__name(parseDDL, "parseDDL");
async function runSeed(db) {
  const now = Date.now();
  const properties = [
    ["amaryllis", "Villa Amaryllis", "Amaryllis", "court", 8, 4, 2, "Sainte-Luce, Martinique", 14.47, -60.917, "EUR", "America/Martinique", 3e4, 4e4, 5e4, 2e4, 9e4, 4, 3, 4, 5, 2, "premium", null, 1, now, now],
    ["zandoli", "Zandoli", "Zandoli", "court", 6, 3, 2, "Sainte-Luce, Martinique", 14.468, -60.919, "EUR", "America/Martinique", 15e3, 22e3, 28e3, 1e4, 5e4, 3, 2, 3, 4, 2, "premium", null, 1, now, now],
    ["geko", "Geko", "G\xE9ko", "court", 4, 2, 1, "Sainte-Luce, Martinique", 14.467, -60.92, "EUR", "America/Martinique", 12e3, 18e3, 22e3, 8e3, 4e4, 3, 2, 3, 4, 2, "standard", null, 1, now, now],
    ["mabouya", "Mabouya", "Mabouya", "court", 3, 1, 1, "Sainte-Luce, Martinique", 14.466, -60.921, "EUR", "America/Martinique", 7e3, 9e3, 11e3, 5e3, 18e3, 2, 2, 2, 3, 1, "standard", null, 1, now, now],
    ["iguana", "Villa Iguana", "Iguana", "long", 4, 2, 1, "Sainte-Luce, Martinique", 14.465, -60.922, "EUR", "America/Martinique", 6e4, 6e4, 6e4, 5e4, 75e3, 30, 30, 30, 30, 30, "standard", null, 1, now, now],
    ["schoelcher", "T2 Schoelcher", "Schoelcher", "moyen", 4, 2, 1, "Schoelcher, Martinique", 14.617, -61.093, "EUR", "America/Martinique", 7e3, 9e3, 11e3, 5e3, 18e3, 3, 2, 3, 5, 2, "standard", null, 1, now, now],
    ["nogent", "T2 Nogent", "Nogent", "court", 4, 2, 1, "Nogent-sur-Marne, \xCEle-de-France", 48.836, 2.483, "EUR", "Europe/Paris", 8e3, 1e4, 13e3, 6e3, 22e3, 1, 1, 2, 3, 1, "standard", null, 1, now, now]
  ];
  const propSQL = `INSERT OR IGNORE INTO rm_properties VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const propStmts = properties.map((p) => db.prepare(propSQL).bind(...p));
  const spSQL = `INSERT OR IGNORE INTO rm_seasonal_profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const seasons = [
    // Amaryllis
    ["sp_am_peak_1", "amaryllis", "No\xEBl / Nouvel An 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 6e4, 5, null, 1, now, now],
    ["sp_am_high_1", "amaryllis", "Haute saison 2025 (jan-avr)", "high", "2025-01-06", "2025-04-30", 2025, 80, 5e4, 5, null, 1, now, now],
    ["sp_am_low_1", "amaryllis", "Basse saison mai-juin 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 3e4, 3, null, 1, now, now],
    ["sp_am_mid_1", "amaryllis", "Moyenne saison \xE9t\xE9 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 4e4, 4, null, 1, now, now],
    ["sp_am_low_2", "amaryllis", "Basse saison automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 3e4, 3, null, 1, now, now],
    ["sp_am_peak_2", "amaryllis", "No\xEBl / Nouvel An 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 6e4, 5, null, 1, now, now],
    ["sp_am_high_2", "amaryllis", "Haute saison 2026 (jan-avr)", "high", "2026-01-06", "2026-04-30", 2026, 80, 5e4, 5, null, 1, now, now],
    ["sp_am_low_3", "amaryllis", "Basse saison mai-juin 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 3e4, 3, null, 1, now, now],
    ["sp_am_mid_2", "amaryllis", "Moyenne saison \xE9t\xE9 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 4e4, 4, null, 1, now, now],
    ["sp_am_low_4", "amaryllis", "Basse saison automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 3e4, 3, null, 1, now, now],
    // Zandoli
    ["sp_za_peak_1", "zandoli", "No\xEBl / Nouvel An 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 35e3, 4, null, 1, now, now],
    ["sp_za_high_1", "zandoli", "Haute saison 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 28e3, 4, null, 1, now, now],
    ["sp_za_low_1", "zandoli", "Basse saison mai-juin 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 15e3, 2, null, 1, now, now],
    ["sp_za_mid_1", "zandoli", "\xC9t\xE9 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 22e3, 3, null, 1, now, now],
    ["sp_za_low_2", "zandoli", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 15e3, 2, null, 1, now, now],
    ["sp_za_peak_2", "zandoli", "No\xEBl 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 35e3, 4, null, 1, now, now],
    ["sp_za_high_2", "zandoli", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 28e3, 4, null, 1, now, now],
    ["sp_za_low_3", "zandoli", "Basse 2026 mai-juin", "low", "2026-05-01", "2026-06-30", 2026, 10, 15e3, 2, null, 1, now, now],
    ["sp_za_mid_2", "zandoli", "\xC9t\xE9 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 22e3, 3, null, 1, now, now],
    ["sp_za_low_4", "zandoli", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 15e3, 2, null, 1, now, now],
    // Geko
    ["sp_gk_peak_1", "geko", "No\xEBl 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 27e3, 4, null, 1, now, now],
    ["sp_gk_high_1", "geko", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 22e3, 3, null, 1, now, now],
    ["sp_gk_low_1", "geko", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 12e3, 2, null, 1, now, now],
    ["sp_gk_mid_1", "geko", "\xC9t\xE9 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 18e3, 3, null, 1, now, now],
    ["sp_gk_low_2", "geko", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 12e3, 2, null, 1, now, now],
    ["sp_gk_peak_2", "geko", "No\xEBl 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 27e3, 4, null, 1, now, now],
    ["sp_gk_high_2", "geko", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 22e3, 3, null, 1, now, now],
    ["sp_gk_low_3", "geko", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 12e3, 2, null, 1, now, now],
    ["sp_gk_mid_2", "geko", "\xC9t\xE9 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 18e3, 3, null, 1, now, now],
    ["sp_gk_low_4", "geko", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 12e3, 2, null, 1, now, now],
    // Mabouya
    ["sp_mb_peak_1", "mabouya", "No\xEBl 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 14e3, 3, null, 1, now, now],
    ["sp_mb_high_1", "mabouya", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 11e3, 2, null, 1, now, now],
    ["sp_mb_low_1", "mabouya", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 7e3, 2, null, 1, now, now],
    ["sp_mb_mid_1", "mabouya", "\xC9t\xE9 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 9e3, 2, null, 1, now, now],
    ["sp_mb_low_2", "mabouya", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 7e3, 2, null, 1, now, now],
    ["sp_mb_peak_2", "mabouya", "No\xEBl 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 14e3, 3, null, 1, now, now],
    ["sp_mb_high_2", "mabouya", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 11e3, 2, null, 1, now, now],
    ["sp_mb_low_3", "mabouya", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 7e3, 2, null, 1, now, now],
    ["sp_mb_mid_2", "mabouya", "\xC9t\xE9 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 9e3, 2, null, 1, now, now],
    ["sp_mb_low_4", "mabouya", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 7e3, 2, null, 1, now, now],
    // Schoelcher
    ["sp_sc_peak_1", "schoelcher", "No\xEBl 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 14e3, 5, null, 1, now, now],
    ["sp_sc_high_1", "schoelcher", "Haute 2025", "high", "2025-01-06", "2025-04-30", 2025, 80, 11e3, 3, null, 1, now, now],
    ["sp_sc_low_1", "schoelcher", "Basse 2025", "low", "2025-05-01", "2025-06-30", 2025, 10, 7e3, 2, null, 1, now, now],
    ["sp_sc_mid_1", "schoelcher", "\xC9t\xE9 2025", "mid", "2025-07-01", "2025-09-15", 2025, 50, 9e3, 3, null, 1, now, now],
    ["sp_sc_low_2", "schoelcher", "Automne 2025", "low", "2025-09-16", "2025-12-19", 2025, 10, 7e3, 2, null, 1, now, now],
    ["sp_sc_peak_2", "schoelcher", "No\xEBl 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 14e3, 5, null, 1, now, now],
    ["sp_sc_high_2", "schoelcher", "Haute 2026", "high", "2026-01-06", "2026-04-30", 2026, 80, 11e3, 3, null, 1, now, now],
    ["sp_sc_low_3", "schoelcher", "Basse 2026", "low", "2026-05-01", "2026-06-30", 2026, 10, 7e3, 2, null, 1, now, now],
    ["sp_sc_mid_2", "schoelcher", "\xC9t\xE9 2026", "mid", "2026-07-01", "2026-09-15", 2026, 50, 9e3, 3, null, 1, now, now],
    ["sp_sc_low_4", "schoelcher", "Automne 2026", "low", "2026-09-16", "2026-12-19", 2026, 10, 7e3, 2, null, 1, now, now],
    // Nogent
    ["sp_no_peak_1", "nogent", "No\xEBl 2024-25", "peak", "2024-12-20", "2025-01-05", 2025, 100, 16e3, 3, null, 1, now, now],
    ["sp_no_high_1", "nogent", "Haute saison \xE9t\xE9 2025", "high", "2025-07-01", "2025-08-31", 2025, 80, 13e3, 2, null, 1, now, now],
    ["sp_no_mid_1", "nogent", "Moyenne saison printemps 2025", "mid", "2025-03-01", "2025-06-30", 2025, 50, 1e4, 1, null, 1, now, now],
    ["sp_no_mid_2", "nogent", "Moyenne saison automne 2025", "mid", "2025-09-01", "2025-12-19", 2025, 50, 1e4, 1, null, 1, now, now],
    ["sp_no_low_1", "nogent", "Basse saison jan-f\xE9v 2025", "low", "2025-01-06", "2025-02-28", 2025, 10, 8e3, 1, null, 1, now, now],
    ["sp_no_peak_2", "nogent", "No\xEBl 2025-26", "peak", "2025-12-20", "2026-01-05", 2026, 100, 16e3, 3, null, 1, now, now],
    ["sp_no_high_2", "nogent", "Haute \xE9t\xE9 2026", "high", "2026-07-01", "2026-08-31", 2026, 80, 13e3, 2, null, 1, now, now],
    ["sp_no_mid_3", "nogent", "Printemps 2026", "mid", "2026-03-01", "2026-06-30", 2026, 50, 1e4, 1, null, 1, now, now],
    ["sp_no_mid_4", "nogent", "Automne 2026", "mid", "2026-09-01", "2026-12-19", 2026, 50, 1e4, 1, null, 1, now, now],
    ["sp_no_low_2", "nogent", "Basse jan-f\xE9v 2026", "low", "2026-01-06", "2026-02-28", 2026, 10, 8e3, 1, null, 1, now, now]
  ];
  const spStmts = seasons.map((s) => db.prepare(spSQL).bind(...s));
  const ruleSQL = `INSERT OR IGNORE INTO rm_pricing_rules VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const rules = [
    ["rule_am_we", "amaryllis", "weekend_uplift", "Surcharge week-end Amaryllis", null, '{"days":[5,6]}', "fixed_cents", 2e3, "low,mid,high,peak", null, null, "5,6", 5e3, 20, 1, null, null, now, now],
    ["rule_za_we", "zandoli", "weekend_uplift", "Surcharge week-end Zandoli", null, '{"days":[5,6]}', "fixed_cents", 1500, null, null, null, "5,6", 3e3, 20, 1, null, null, now, now],
    ["rule_gk_we", "geko", "weekend_uplift", "Surcharge week-end G\xE9ko", null, '{"days":[5,6]}', "fixed_cents", 1e3, null, null, null, "5,6", 2e3, 20, 1, null, null, now, now],
    ["rule_mb_we", "mabouya", "weekend_uplift", "Surcharge week-end Mabouya", null, '{"days":[5,6]}', "fixed_cents", 800, null, null, null, "5,6", 1500, 20, 1, null, null, now, now],
    ["rule_sc_we", "schoelcher", "weekend_uplift", "Surcharge week-end Schoelcher", null, '{"days":[5,6]}', "fixed_cents", 1e3, null, null, null, "5,6", 2e3, 20, 1, null, null, now, now],
    ["rule_no_we", "nogent", "weekend_uplift", "Surcharge week-end Nogent", null, '{"days":[5,6]}', "fixed_cents", 1500, null, null, null, "5,6", 3e3, 20, 1, null, null, now, now],
    ["rule_holiday_mq", null, "holiday_uplift", "Surcharge jours f\xE9ri\xE9s Martinique", null, "{}", "percent", 20, null, null, null, null, null, 10, 1, null, null, now, now],
    ["rule_event_mq", null, "event_uplift", "Surcharge \xE9v\xE9nements locaux", null, "{}", "percent", 25, null, null, null, null, null, 10, 1, null, null, now, now],
    ["rule_lm_7", null, "lead_time_discount", "Remise last-minute J-0 \xE0 J-7", null, '{"max_days":7}', "percent", -25, null, 0, 7, null, null, 30, 1, null, null, now, now],
    ["rule_lm_14", null, "lead_time_discount", "Remise last-minute J-8 \xE0 J-14", null, '{"max_days":14}', "percent", -15, null, 8, 14, null, null, 30, 1, null, null, now, now],
    ["rule_far_out", null, "far_out_markup", "Majoration r\xE9servation lointaine", null, '{"min_days":120}', "percent", 5, null, 120, null, null, null, 40, 1, null, null, now, now]
  ];
  const ruleStmts = rules.map((r) => db.prepare(ruleSQL).bind(...r));
  const holSQL = `INSERT OR IGNORE INTO rm_holidays VALUES (?,?,?,?,?,?,?,?)`;
  const holidays = [
    ["h_nj_2025", "2025-01-01", "Jour de l'An", "MQ", "national_holiday", "high", 15, 2025],
    ["h_ep_2025", "2025-03-04", "Mardi Gras Martinique", "MQ", "local_event", "peak", 30, 2025],
    ["h_vm_2025", "2025-04-18", "Vendredi Saint", "MQ", "national_holiday", "high", 20, 2025],
    ["h_pa_2025", "2025-04-21", "Lundi de P\xE2ques", "MQ", "national_holiday", "high", 20, 2025],
    ["h_ft_2025", "2025-05-01", "F\xEAte du Travail", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ve_2025", "2025-05-08", "Victoire 1945", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_as_2025", "2025-05-29", "Ascension", "MQ", "national_holiday", "medium", 15, 2025],
    ["h_pe_2025", "2025-06-09", "Lundi de Pentec\xF4te", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ba_2025", "2025-07-14", "F\xEAte Nationale", "MQ", "national_holiday", "high", 20, 2025],
    ["h_ao_2025", "2025-08-15", "Assomption", "MQ", "national_holiday", "high", 20, 2025],
    ["h_to_2025", "2025-11-01", "Toussaint", "MQ", "national_holiday", "medium", 10, 2025],
    ["h_ar_2025", "2025-11-11", "Armistice", "MQ", "national_holiday", "medium", 5, 2025],
    ["h_no_2025", "2025-12-25", "No\xEBl", "MQ", "national_holiday", "peak", 40, 2025],
    ["h_nj_2026", "2026-01-01", "Jour de l'An", "MQ", "national_holiday", "high", 15, 2026],
    ["h_ft_2026", "2026-05-01", "F\xEAte du Travail", "MQ", "national_holiday", "medium", 10, 2026],
    ["h_ba_2026", "2026-07-14", "F\xEAte Nationale", "MQ", "national_holiday", "high", 20, 2026],
    ["h_ao_2026", "2026-08-15", "Assomption", "MQ", "national_holiday", "high", 20, 2026],
    ["h_to_2026", "2026-11-01", "Toussaint", "MQ", "national_holiday", "medium", 10, 2026],
    ["h_no_2026", "2026-12-25", "No\xEBl", "MQ", "national_holiday", "peak", 40, 2026],
    ["h_nj_fr_2025", "2025-01-01", "Jour de l'An", "FR", "national_holiday", "high", 15, 2025],
    ["h_pa_fr_2025", "2025-04-21", "Lundi de P\xE2ques", "FR", "national_holiday", "medium", 10, 2025],
    ["h_ft_fr_2025", "2025-05-01", "F\xEAte du Travail", "FR", "national_holiday", "medium", 10, 2025],
    ["h_ba_fr_2025", "2025-07-14", "F\xEAte Nationale", "FR", "national_holiday", "high", 20, 2025],
    ["h_ao_fr_2025", "2025-08-15", "Assomption", "FR", "national_holiday", "medium", 10, 2025],
    ["h_no_fr_2025", "2025-12-25", "No\xEBl", "FR", "national_holiday", "peak", 30, 2025],
    ["h_nj_fr_2026", "2026-01-01", "Jour de l'An", "FR", "national_holiday", "high", 15, 2026],
    ["h_ba_fr_2026", "2026-07-14", "F\xEAte Nationale", "FR", "national_holiday", "high", 20, 2026],
    ["h_no_fr_2026", "2026-12-25", "No\xEBl", "FR", "national_holiday", "peak", 30, 2026]
  ];
  const holStmts = holidays.map((h) => db.prepare(holSQL).bind(...h));
  const evSQL = `INSERT OR IGNORE INTO rm_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  const events = [
    ["ev_yoles_2025", "Tour des Yoles Rondes 2025", "2025-08-08", "2025-08-16", "Martinique", "sport", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 35, 5, "Course de voile traditionnelle, tourisme fort", now],
    ["ev_yoles_2026", "Tour des Yoles Rondes 2026", "2026-08-07", "2026-08-15", "Martinique", "sport", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 35, 5, null, now],
    ["ev_carn_2025", "Carnaval Martinique 2025", "2025-02-28", "2025-03-05", "Martinique", "festival", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 30, 5, "Carnaval majeur", now],
    ["ev_carn_2026", "Carnaval Martinique 2026", "2026-02-13", "2026-02-18", "Martinique", "festival", "peak", '["amaryllis","zandoli","geko","mabouya","schoelcher"]', 30, 5, null, now]
  ];
  const evStmts = events.map((e) => db.prepare(evSQL).bind(...e));
  const allStmts = [...propStmts, ...spStmts, ...ruleStmts, ...holStmts, ...evStmts];
  const CHUNK = 80;
  for (let i = 0; i < allStmts.length; i += CHUNK) {
    await db.batch(allStmts.slice(i, i + CHUNK));
  }
  return allStmts.length;
}
__name(runSeed, "runSeed");
async function onRequest16(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS16 });
  if (request.method !== "POST") return json32({ error: "POST only" }, 405);
  const db = env2.revenue_manager;
  if (!db) return json32({ error: "D1 binding 'revenue_manager' not found" }, 503);
  try {
    const statements = parseDDL(DDL2);
    let tables_created = 0;
    for (const stmt of statements) {
      await db.prepare(stmt).run();
      if (stmt.toUpperCase().startsWith("CREATE TABLE")) tables_created++;
    }
    const seeded = await runSeed(db);
    return json32({ ok: true, tables_created, seed_statements: seeded });
  } catch (err2) {
    return json32({ ok: false, error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest16, "onRequest");

// api/rm-overrides.js
var CORS17 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json33 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS17 }), "json");
async function handleGet3(db, url) {
  const property_id = url.searchParams.get("property_id");
  const from = url.searchParams.get("from") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  if (!property_id) return json33({ error: "property_id required" }, 400);
  const { results } = await db.prepare(
    `SELECT * FROM rm_overrides
       WHERE property_id = ? AND date >= ? AND date <= ? AND is_active = 1
       ORDER BY date ASC`
  ).bind(property_id, from, to).all();
  return json33({ overrides: results || [], count: (results || []).length });
}
__name(handleGet3, "handleGet");
async function handlePost3(db, body) {
  const { property_id, date, override_type, value_cents, value_int, reason, expires_at, created_by } = body;
  if (!property_id || !date || !override_type) {
    return json33({ error: "property_id, date, and override_type are required" }, 400);
  }
  const validTypes = ["price", "min_stay", "block"];
  if (!validTypes.includes(override_type)) {
    return json33({ error: `override_type must be one of: ${validTypes.join(", ")}` }, 400);
  }
  if (override_type === "price" && (value_cents === void 0 || value_cents === null)) {
    return json33({ error: "value_cents required for price override" }, 400);
  }
  if (override_type === "min_stay" && (value_int === void 0 || value_int === null)) {
    return json33({ error: "value_int required for min_stay override" }, 400);
  }
  const prop = await db.prepare(`SELECT id FROM rm_properties WHERE id = ?`).bind(property_id).first();
  if (!prop) return json33({ error: "Property not found" }, 404);
  const now = Date.now();
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO rm_overrides
        (id, property_id, date, override_type, value_cents, value_int, reason, is_active, expires_at, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,1,?,?,?)`
  ).bind(id, property_id, date, override_type, value_cents || null, value_int || null, reason || null, expires_at || null, created_by || "admin", now).run();
  const inserted = await db.prepare(`SELECT * FROM rm_overrides WHERE id = ?`).bind(id).first();
  return json33({ ok: true, override: inserted }, 201);
}
__name(handlePost3, "handlePost");
async function handleDelete2(db, url) {
  const id = url.searchParams.get("id");
  if (!id) return json33({ error: "id required" }, 400);
  const existing = await db.prepare(`SELECT id FROM rm_overrides WHERE id = ?`).bind(id).first();
  if (!existing) return json33({ error: "Override not found" }, 404);
  await db.prepare(`UPDATE rm_overrides SET is_active = 0 WHERE id = ?`).bind(id).run();
  return json33({ ok: true, id });
}
__name(handleDelete2, "handleDelete");
async function onRequest17(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS17 });
  const db = env2.revenue_manager;
  if (!db) return json33({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  try {
    if (request.method === "GET") return handleGet3(db, url);
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return handlePost3(db, body);
    }
    if (request.method === "DELETE") return handleDelete2(db, url);
    return json33({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json33({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest17, "onRequest");

// api/rm-properties.js
var CORS18 = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json34 = /* @__PURE__ */ __name((d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS18 }), "json");
async function handleGet4(db, url) {
  const id = url.searchParams.get("id");
  if (id) {
    const [prop, profiles, competitorCount] = await Promise.all([
      db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first(),
      db.prepare(`SELECT * FROM rm_seasonal_profiles WHERE property_id = ? AND is_active = 1 ORDER BY year DESC, date_start ASC`).bind(id).all(),
      db.prepare(
        `SELECT COUNT(*) as cnt FROM rm_competitor_listings cl
           JOIN rm_competitor_sets cs ON cs.id = cl.set_id
           WHERE cl.property_id = ? AND cl.is_active = 1`
      ).bind(id).first()
    ]);
    if (!prop) return json34({ error: "Property not found" }, 404);
    return json34({
      property: prop,
      seasonal_profiles: profiles.results || [],
      competitor_count: competitorCount ? competitorCount.cnt : 0
    });
  }
  const { results: properties } = await db.prepare(`SELECT * FROM rm_properties WHERE is_active = 1 ORDER BY type, name`).all();
  if (!properties || !properties.length) return json34({ properties: [] });
  const propIds = properties.map((p) => p.id);
  const placeholders = propIds.map(() => "?").join(",");
  const { results: profileCounts } = await db.prepare(
    `SELECT property_id, COUNT(*) as cnt
       FROM rm_seasonal_profiles
       WHERE property_id IN (${placeholders}) AND is_active = 1
       GROUP BY property_id`
  ).bind(...propIds).all();
  const pcMap = {};
  for (const pc of profileCounts || []) pcMap[pc.property_id] = pc.cnt;
  const enriched = properties.map((p) => ({
    ...p,
    seasonal_profile_count: pcMap[p.id] || 0
  }));
  return json34({ properties: enriched, count: enriched.length });
}
__name(handleGet4, "handleGet");
async function handlePut2(db, body) {
  const { id, ...fields } = body;
  if (!id) return json34({ error: "id required" }, 400);
  const existing = await db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first();
  if (!existing) return json34({ error: "Property not found" }, 404);
  const allowed = [
    "name",
    "short_name",
    "type",
    "capacity",
    "bedrooms",
    "bathrooms",
    "location",
    "latitude",
    "longitude",
    "currency",
    "timezone",
    "base_price_low",
    "base_price_mid",
    "base_price_high",
    "price_min",
    "price_max",
    "min_stay_default",
    "min_stay_low",
    "min_stay_mid",
    "min_stay_high",
    "min_stay_last_minute",
    "positioning",
    "beds24_property_id",
    "is_active"
  ];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      values.push(fields[key] !== void 0 ? fields[key] : null);
    }
  }
  if (!updates.length) return json34({ error: "No valid fields to update" }, 400);
  const now = Date.now();
  updates.push("updated_at = ?");
  values.push(now, id);
  await db.prepare(`UPDATE rm_properties SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const updated = await db.prepare(`SELECT * FROM rm_properties WHERE id = ?`).bind(id).first();
  return json34({ ok: true, property: updated });
}
__name(handlePut2, "handlePut");
async function onRequest18(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS18 });
  const db = env2.revenue_manager;
  if (!db) return json34({ error: "D1 binding 'revenue_manager' not found" }, 503);
  const url = new URL(request.url);
  try {
    if (request.method === "GET") return handleGet4(db, url);
    if (request.method === "PUT") {
      const body = await request.json().catch(() => ({}));
      return handlePut2(db, body);
    }
    return json34({ error: "Method not allowed" }, 405);
  } catch (err2) {
    return json34({ error: err2.message, stack: err2.stack }, 500);
  }
}
__name(onRequest18, "onRequest");

// api/site-config.js
function json35(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(json35, "json");
async function onRequest19(context3) {
  const { request, env: env2 } = context3;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const scriptUrl = env2.APPS_SCRIPT_URL;
  if (!scriptUrl) return json35({ ok: false, error: "APPS_SCRIPT_URL manquante" });
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const type = url.searchParams.get("type") || "config";
      const key = type === "prices" ? "daily_prices" : "min_nights_config";
      const res = await fetch(`${scriptUrl}?action=getConfig&key=${encodeURIComponent(key)}`, { redirect: "follow" });
      const text = await res.text();
      try {
        JSON.parse(text);
        return new Response(text, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch {
        return json35({ ok: true, config: {} });
      }
    }
    if (request.method === "POST") {
      const body = await request.json();
      const key = body.type === "prices" ? "daily_prices" : "min_nights_config";
      const cfgStr = JSON.stringify(body.config || {});
      const params = new URLSearchParams({ action: "setConfig", key, config: cfgStr });
      const res = await fetch(`${scriptUrl}?${params}`, { redirect: "follow" });
      const text = await res.text();
      try {
        JSON.parse(text);
        return new Response(text, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch {
        return json35({ ok: false, error: "Apps Script non-JSON response" });
      }
    }
  } catch (e) {
    return json35({ ok: false, error: String(e) });
  }
  return json35({ ok: false, error: "Method not allowed" });
}
__name(onRequest19, "onRequest");

// [slug].js
var BASE = "https://villamaryllis.com";
var BIENS = {
  amaryllis: {
    nom: "Villa Amaryllis",
    lieu: "Sainte-Luce, Martinique",
    prix: 280,
    desc: "Perch\xE9e sur les hauteurs de Sainte-Luce, la Villa Amaryllis offre piscine \xE0 d\xE9bordement eau sal\xE9e (4\xD77 m), terrasse de 100 m\xB2 face \xE0 la mer des Cara\xEFbes, jacuzzi privatif et jardin tropical. 3 chambres, 8 personnes. R\xE9servation directe sans frais.",
    amenities: ["Piscine \xE0 d\xE9bordement", "Jacuzzi priv\xE9", "Vue mer", "Wifi Starlink", "Parking", "3 chambres"],
    rating: "4.94",
    reviews: 33
  },
  zandoli: {
    nom: "Zandoli",
    lieu: "Sainte-Luce, Martinique",
    prix: 220,
    desc: "Appartement tropical nich\xE9 dans un jardin luxuriant \xE0 Sainte-Luce, avec piscine priv\xE9e, vue mer et terrasse au coucher du soleil. WiFi Starlink, Netflix, lave-linge. Id\xE9al pour un s\xE9jour en couple ou en famille.",
    amenities: ["Piscine priv\xE9e", "Vue mer", "Jardin tropical", "Wifi Starlink", "Netflix"],
    rating: "4.9",
    reviews: 28
  },
  iguana: {
    nom: "Villa Iguana",
    lieu: "Sainte-Luce, Martinique",
    prix: 180,
    desc: "Villa sur deux niveaux dans la r\xE9sidence Amaryllis \xE0 Sainte-Luce, avec piscine eau sal\xE9e, vue sur le Rocher du Diamant et jardin fleuri. 2 chambres, 4 personnes, parking privatif.",
    amenities: ["Piscine eau sal\xE9e", "Vue Diamant", "Vue mer", "Wifi Starlink", "Parking"],
    rating: "4.92",
    reviews: 25
  },
  geko: {
    nom: "G\xE9ko",
    lieu: "Sainte-Luce, Martinique",
    prix: 150,
    desc: "Cocon tropical avec piscine priv\xE9e et jardin luxuriant au sein de la r\xE9sidence Amaryllis \xE0 Sainte-Luce. Climatisation, cuisine ext\xE9rieure, barbecue. \xC0 7 min des plages. 2 personnes.",
    amenities: ["Piscine priv\xE9e", "Jardin tropical", "Climatisation", "Cuisine ext\xE9rieure"],
    rating: "4.93",
    reviews: 20
  },
  mabouya: {
    nom: "Mabouya \u2014 Studio jacuzzi vue mer",
    lieu: "Sainte-Luce, Martinique",
    prix: 110,
    desc: "Studio romantique avec jacuzzi privatif et vue mer enchanteresse \xE0 flanc de colline \xE0 Sainte-Luce. Jardin fleuri, terrasse priv\xE9e, calme absolu. Id\xE9al pour un s\xE9jour en couple d\xE8s 110\u20AC/nuit.",
    amenities: ["Jacuzzi privatif", "Vue mer", "Jardin fleuri", "Terrasse priv\xE9e"],
    rating: "4.95",
    reviews: 18
  },
  schoelcher: {
    nom: "Bellevue \u2014 Sch\u0153lcher",
    lieu: "Sch\u0153lcher, Martinique",
    prix: 100,
    desc: "Appartement de standing au dernier \xE9tage avec vue panoramique sur la mer des Cara\xEFbes et la baie de Fort-de-France depuis Sch\u0153lcher. Brise marine, calme, \xE0 5 min des plages. D\xE8s 100\u20AC/nuit.",
    amenities: ["Vue panoramique mer", "Dernier \xE9tage", "R\xE9sidence s\xE9curis\xE9e", "Parking"],
    rating: "4.88",
    reviews: 15
  },
  nogent: {
    nom: "Appartement aux Portes de Paris",
    lieu: "Nogent-sur-Marne, \xCEle-de-France",
    prix: 85,
    desc: "Appartement calme \xE0 Nogent-sur-Marne, \xE0 15 minutes du centre de Paris en RER A. Id\xE9al pour s\xE9jours professionnels et touristiques en \xCEle-de-France. WiFi, tout \xE9quip\xE9. D\xE8s 85\u20AC/nuit.",
    amenities: ["15 min Paris RER A", "Wifi", "Calme", "Tout \xE9quip\xE9"],
    rating: "4.85",
    reviews: 12
  }
};
var GUIDE = {
  title: "Guide Sainte-Luce Martinique : plages, restaurants et activit\xE9s",
  desc: "Tout ce qu'il faut savoir pour visiter Sainte-Luce en Martinique : les meilleures plages (Anse Corps de Garde, Gros Raisin), restaurants cr\xE9oles, activit\xE9s (plong\xE9e, distilleries, catamaran) et conseils pratiques.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/guide`
};
var GUIDE_DIAMANT = {
  title: "Guide Le Diamant Martinique : rocher, plages et plong\xE9e",
  desc: "Tout sur Le Diamant en Martinique : le Rocher du Diamant (plong\xE9e, histoire), les plus belles plages et les meilleures adresses. \xC0 15 min de Sainte-Luce.",
  image: `${BASE}/photos/iguana/01.webp`,
  url: `${BASE}/guide-le-diamant`
};
var GUIDE_SAINTE_ANNE = {
  title: "Guide Sainte-Anne Martinique : plages, activit\xE9s et restaurants",
  desc: "Tout sur Sainte-Anne en Martinique : Grande Anse des Salines (plus belle plage des Cara\xEFbes), kitesurf, catamaran aux \xEElets et restaurants cr\xE9oles. \xC0 20 min de Sainte-Luce.",
  image: `${BASE}/photos/amaryllis/05.webp`,
  url: `${BASE}/guide-sainte-anne`
};
var GUIDE_EN = {
  title: "Villa Rental Martinique \u2014 Book Direct, No Airbnb Fees",
  desc: "Rent a luxury villa in Martinique with private pool and ocean view. Direct booking, no service fees. Sainte-Luce, Sch\u0153lcher. From \u20AC85/night.",
  image: `${BASE}/photos/amaryllis/02.webp`,
  url: `${BASE}/villa-rental-martinique`
};
var GUIDE_ACTIVITES = {
  title: "10 activit\xE9s incontournables \xE0 Sainte-Luce, Martinique",
  desc: "Notre s\xE9lection des 10 meilleures activit\xE9s \xE0 ne pas manquer \xE0 Sainte-Luce : plage, mangrove, excursion en bateau, plong\xE9e au Rocher du Diamant, mus\xE9e de la Canne, Fort-de-France. Guide r\xE9dig\xE9 par vos h\xF4tes.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/activites-sainte-luce`
};
var GUIDE_PROXIMITE = {
  title: "Activit\xE9s \xE0 proximit\xE9 de la Villa Amaryllis \u2014 Sainte-Luce, Martinique",
  desc: "Les meilleures adresses \xE0 moins de 15 minutes de la r\xE9sidence Amaryllis : Anse Corps de Garde, For\xEAt de Montravail, distillerie Trois-Rivi\xE8res, nager avec les tortues. Guide r\xE9dig\xE9 par vos h\xF4tes.",
  image: `${BASE}/photos/amaryllis/01.webp`,
  url: `${BASE}/guide-proximite`
};
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escHtml, "escHtml");
function buildMeta(title2, desc, url, image) {
  const t = escHtml(title2);
  const d = escHtml(desc);
  const u = escHtml(url);
  const img = escHtml(image);
  return { title: t, desc: d, url: u, image: img };
}
__name(buildMeta, "buildMeta");
function injectMeta(html, { title: title2, desc, url, image }, ldJson) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title2}</title>`).replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}" />`).replace(/<link id="canonical"[^>]*>/, `<link id="canonical" rel="canonical" href="${url}" />`).replace(/<meta id="og-title"[^>]*>/, `<meta id="og-title" property="og:title" content="${title2}" />`).replace(/<meta id="og-description"[^>]*>/, `<meta id="og-description" property="og:description" content="${desc}" />`).replace(/<meta id="og-url"[^>]*>/, `<meta id="og-url" property="og:url" content="${url}" />`).replace(/<meta id="og-image"[^>]*>/, `<meta id="og-image" property="og:image" content="${image}" />`).replace(/<meta id="tw-title"[^>]*>/, `<meta id="tw-title" name="twitter:title" content="${title2}" />`).replace(/<meta id="tw-description"[^>]*>/, `<meta id="tw-description" name="twitter:description" content="${desc}" />`).replace(/<meta id="tw-image"[^>]*>/, `<meta id="tw-image" name="twitter:image" content="${image}" />`).replace(/<script type="application\/ld\+json" id="ld-main">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="ld-main">${ldJson}<\/script>`);
}
__name(injectMeta, "injectMeta");
async function onRequest20(context3) {
  const { params, request } = context3;
  const slug = params.slug;
  if (BIENS[slug]) {
    const bien = BIENS[slug];
    const url = `${BASE}/${slug}`;
    const image = `${BASE}/photos/${slug}/01.webp`;
    const title2 = `${bien.nom} \u2014 Location ${bien.lieu} \xE0 partir de ${bien.prix}\u20AC/nuit`;
    const desc = bien.desc.slice(0, 155) + (bien.desc.length > 155 ? "\u2026" : "");
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      "@id": url,
      "name": bien.nom,
      "url": url,
      "description": bien.desc,
      "image": image,
      "priceRange": `\xC0 partir de ${bien.prix}\u20AC/nuit`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": bien.rating,
        "reviewCount": bien.reviews,
        "bestRating": "5"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": bien.lieu.split(",")[0]?.trim(),
        "addressRegion": bien.lieu.includes("Martinique") ? "Martinique" : "\xCEle-de-France",
        "addressCountry": "FR"
      },
      "amenityFeature": bien.amenities.map((a) => ({
        "@type": "LocationFeatureSpecification",
        "name": a
      })),
      "provider": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(title2, desc, url, image);
    const resp = await context3.next();
    const html = await resp.text();
    const modified = injectMeta(html, meta, ldJson);
    return new Response(modified, {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "guide") {
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": GUIDE.title,
      "description": GUIDE.desc,
      "url": GUIDE.url,
      "image": GUIDE.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(GUIDE.title, GUIDE.desc, GUIDE.url, GUIDE.image);
    const resp = await context3.next();
    const html = await resp.text();
    const modified = injectMeta(html, meta, ldJson);
    return new Response(modified, {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "guide-le-diamant") {
    const g = GUIDE_DIAMANT;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context3.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "guide-sainte-anne") {
    const g = GUIDE_SAINTE_ANNE;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context3.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "villa-rental-martinique") {
    const g = GUIDE_EN;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "inLanguage": "en",
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context3.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "activites-sainte-luce") {
    const g = GUIDE_ACTIVITES;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context3.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  if (slug === "guide-proximite") {
    const g = GUIDE_PROXIMITE;
    const ldJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": g.title,
      "description": g.desc,
      "url": g.url,
      "image": g.image,
      "author": { "@id": `${BASE}/#organization` },
      "publisher": { "@id": `${BASE}/#organization` }
    });
    const meta = buildMeta(g.title, g.desc, g.url, g.image);
    const resp = await context3.next();
    const html = await resp.text();
    return new Response(injectMeta(html, meta, ldJson), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }
  return context3.next();
}
__name(onRequest20, "onRequest");

// ../.wrangler/tmp/pages-cH1Mnf/functionsRoutes-0.3787628783839654.mjs
var routes = [
  {
    routePath: "/api/guides/:path*",
    mountPath: "/api/guides",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/rm-competitors/:path*",
    mountPath: "/api/rm-competitors",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/rm-recommendations/:path*",
    mountPath: "/api/rm-recommendations",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/rm-rules/:path*",
    mountPath: "/api/rm-rules",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/rm-scrape/:path*",
    mountPath: "/api/rm-scrape",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/admin-auth",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/admin-auth",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/ai-summary",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/ai-summary",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/airbnb-test",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/beds24-bookings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/beds24-create",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/api/beds24-create",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/beds24-manage",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/api/beds24-manage",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/beds24-prices",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/beds24-prices",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions7]
  },
  {
    routePath: "/api/beds24-rates",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/beds24-rates",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions8]
  },
  {
    routePath: "/api/beds24-refresh",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/beds24-refresh",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/beds24-webhook",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/beds24-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/caution-checkout",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions9]
  },
  {
    routePath: "/api/caution-checkout",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions10]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions11]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/contacts",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/contacts",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions12]
  },
  {
    routePath: "/api/contacts",
    mountPath: "/api",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/api/contacts-alert",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/contacts-alert",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions13]
  },
  {
    routePath: "/api/create-deposit-intent",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions14]
  },
  {
    routePath: "/api/create-deposit-intent",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/create-payment-intent",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions15]
  },
  {
    routePath: "/api/create-payment-intent",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/geo",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/geo",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions16]
  },
  {
    routePath: "/api/get-config",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/get-config",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions17]
  },
  {
    routePath: "/api/health-check",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/manage-deposit",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions18]
  },
  {
    routePath: "/api/manage-deposit",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/send-prix-alert",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions19]
  },
  {
    routePath: "/api/send-prix-alert",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost12]
  },
  {
    routePath: "/api/send-prix-recap",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/sheets-proxy",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions20]
  },
  {
    routePath: "/api/sheets-proxy",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost13]
  },
  {
    routePath: "/api/stripe-webhook",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions21]
  },
  {
    routePath: "/api/stripe-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost14]
  },
  {
    routePath: "/api/weather",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet14]
  },
  {
    routePath: "/api/weather",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions22]
  },
  {
    routePath: "/api/agents-actions",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/agents-run",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/beds24-bookings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/beds24-prices",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/contacts-purge",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/api/fetch-ical",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/api/get-availability",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/api/google-reviews",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/api/ical-config",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/api/rm-dashboard",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/api/rm-init",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  },
  {
    routePath: "/api/rm-overrides",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest17]
  },
  {
    routePath: "/api/rm-properties",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest18]
  },
  {
    routePath: "/api/site-config",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest19]
  },
  {
    routePath: "/:slug",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest20]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context3 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context3);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-eINmN7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-eINmN7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.5485456522092034.mjs.map
