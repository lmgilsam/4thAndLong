// Records an ad (src/ad/) to a 1080x1920 MP4, with the game's own sound effects
// and, if you have them, voice takes for the booth.
//
//   npm run dev                                          # in another terminal
//   node scripts/ad/record-ad.cjs                        # The Final Play: frames + sound + video
//   node scripts/ad/record-ad.cjs --ad turnover          # Turnover on Downs
//   node scripts/ad/record-ad.cjs --audio-only           # reuse the frames, redo the sound (after adding voices)
//
// Ads (--ad):  final-play (default)  ad.html, timeline.ts, voices in scripts/ad/voice/
//              turnover              ad-turnover.html, timeline-turnover.ts, voices in scripts/ad/voice-turnover/
//
// Voices: save one take per line in the ad's voice folder, named after the line id
// in its timeline, e.g. 02-color-brady.wav (.mp3 and .m4a work too). Each take
// starts at its line's start time. Missing takes are skipped, so you can add them
// one at a time. The crowd and effects duck under the voices automatically.
//
// Output: ad-out/4thandlong-<ad>.mp4 (or -voiced.mp4 when any take is found).
// Needs Playwright (not a project dependency): npm i -D playwright && npx playwright install chromium
// Needs ffmpeg and ffprobe on your PATH. CHROME_PATH=/path/to/chrome uses a system Chrome instead.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
let chromium
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require('playwright-core')) }

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt }

const ADS = {
  'final-play': { page: 'ad.html', voice: 'voice', frames: 'frames' },
  turnover: { page: 'ad-turnover.html', voice: 'voice-turnover', frames: 'frames-turnover' },
}
const AD = ADS[opt('--ad', 'final-play')]
if (!AD) throw new Error(`Unknown --ad. Use one of: ${Object.keys(ADS).join(', ')}`)

const ROOT = path.join(__dirname, '../..')
const OUT = path.join(ROOT, opt('--out', 'ad-out'))
const FRAMES = path.join(OUT, AD.frames)
const VOICE_DIR = path.join(__dirname, AD.voice)
const URL = opt('--url', `http://localhost:5173/${AD.page}`) + '?capture'
const FPS = Number(opt('--fps', '30'))
const SCALE = 2.5 // 432x768 CSS px -> 1080x1920

const ff = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' })
const probeDuration = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim())

;(async () => {
  fs.mkdirSync(FRAMES, { recursive: true })
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: SCALE })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  await page.goto(URL)
  await page.waitForFunction(() => window.__adReady === true, null, { timeout: 30000 })
  await page.waitForTimeout(500)
  const { name, duration, lines } = await page.evaluate(() => ({ name: window.__adName, duration: window.__adDuration, lines: window.__adLines }))
  const total = Math.round(duration * FPS)

  // 1. Frames
  if (flag('--audio-only')) {
    const have = fs.readdirSync(FRAMES).filter((f) => f.endsWith('.png')).length
    if (have !== total) throw new Error(`--audio-only needs ${total} frames in ${FRAMES}, found ${have}. Run without it first.`)
    console.log(`Reusing ${have} frames.`)
  } else {
    for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f))
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => window.__setT(t), i / FPS)
      await page.screenshot({ path: path.join(FRAMES, `f_${String(i).padStart(5, '0')}.png`) })
      if (i % 60 === 0) process.stdout.write(`\rFrames ${i}/${total}`)
    }
    console.log(`\rFrames ${total}/${total}`)
  }

  // 2. Sound effects and crowd, rendered offline with the game's own src/lib/sound.ts
  const b64 = await page.evaluate(async (dur) => {
    const SR = 48000
    const off = new OfflineAudioContext(2, Math.ceil(SR * dur), SR)
    window.__now = 0
    // sound.ts schedules everything at ctx.currentTime + offset; this lets each cue set "now".
    const proxy = new Proxy(off, {
      get(target, prop) {
        if (prop === 'currentTime') return window.__now
        if (prop === 'state') return 'running'
        const v = Reflect.get(target, prop, target)
        return typeof v === 'function' ? v.bind(target) : v
      },
    })
    window.AudioContext = function () { return proxy }
    localStorage.setItem('dd:sound', 'on')
    const { sound, preloadSamples } = await import('/src/lib/sound.ts')
    await preloadSamples()

    const len = Math.ceil(SR * dur)
    const nb = off.createBuffer(2, len, SR)
    for (let ch = 0; ch < 2; ch++) {
      const d = nb.getChannelData(ch); let last = 0
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5 }
    }
    const src = off.createBufferSource(); src.buffer = nb
    const lp = off.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700
    const g = off.createGain()
    window.__adMurmur.forEach(([t, v], i) => (i === 0 ? g.gain.setValueAtTime(v, t) : g.gain.linearRampToValueAtTime(v, t)))
    src.connect(lp).connect(g).connect(off.destination); src.start(0)

    for (const [t, name, arg] of window.__adSfx) { window.__now = t; sound[name](arg) }

    const buf = await off.startRendering()
    const n = buf.length, chs = 2
    const ab = new ArrayBuffer(44 + n * chs * 2), v = new DataView(ab)
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * chs * 2, true); w(8, 'WAVE'); w(12, 'fmt ')
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, chs, true); v.setUint32(24, SR, true)
    v.setUint32(28, SR * chs * 2, true); v.setUint16(32, chs * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * chs * 2, true)
    const L = buf.getChannelData(0), R = buf.getChannelData(1)
    let o = 44
    for (let i = 0; i < n; i++) for (const s of [L[i], R[i]]) { v.setInt16(o, Math.max(-1, Math.min(1, s)) * 32767, true); o += 2 }
    let bin = ''; const u8 = new Uint8Array(ab)
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000))
    return btoa(bin)
  }, duration)
  await browser.close()
  const sfxWav = path.join(OUT, 'sfx.wav')
  fs.writeFileSync(sfxWav, Buffer.from(b64, 'base64'))
  console.log('Sound effects rendered.')

  // 3. Voice takes
  const takes = []
  for (const [i, line] of lines.entries()) {
    const file = ['wav', 'mp3', 'm4a'].map((ext) => path.join(VOICE_DIR, `${line.id}.${ext}`)).find((f) => fs.existsSync(f))
    if (!file) continue
    const len = probeDuration(file)
    const next = lines[i + 1]
    const room = (next ? next.start : duration) - line.start
    const note = len > room ? `  runs ${(len - room).toFixed(2)}s into the next line: trim it or move the line in the ad's timeline` : ''
    console.log(`Voice ${line.id}: ${len.toFixed(2)}s at ${line.start.toFixed(2)}s${note}`)
    takes.push({ file, start: line.start })
  }
  if (!takes.length) console.log(`No voice takes in ${path.relative(ROOT, VOICE_DIR)}/, recording without voices.`)

  // 4. Mix and encode. Voices get the crowd ducked under them, then a fixed gain and a limiter
  //    (about -15 LUFS) so the silence before the Hail Mary stays silent.
  const inputs = ['-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%05d.png'), '-i', sfxWav]
  takes.forEach((tk) => inputs.push('-i', tk.file))
  let graph
  if (takes.length) {
    const vo = takes.map((tk, i) => {
      const ms = Math.round(tk.start * 1000)
      // Each take is leveled first, so quiet and loud recordings sit the same in the mix.
      return `[${i + 2}:a]aformat=channel_layouts=stereo,loudnorm=I=-25.5:TP=-8:LRA=9,aresample=48000,adelay=${ms}|${ms}[v${i}]`
    })
    const mixIn = takes.map((_, i) => `[v${i}]`).join('')
    graph = [
      ...vo,
      `${mixIn}amix=inputs=${takes.length}:normalize=0,apad[vo]`,
      '[vo]asplit[vk][vm]',
      '[1:a][vk]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=350[duck]',
      '[duck][vm]amix=inputs=2:normalize=0:duration=first,volume=11.5dB,alimiter=limit=0.82:attack=3:release=60:level=false[a]',
    ].join(';')
  } else {
    graph = '[1:a]volume=11.5dB,alimiter=limit=0.82:attack=3:release=60:level=false[a]'
  }
  const outFile = path.join(OUT, `4thandlong-${name}${takes.length ? '-voiced' : ''}.mp4`)
  ff([...inputs, '-filter_complex', graph, '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', outFile])
  console.log(`Done: ${path.relative(ROOT, outFile)}`)
})().catch((e) => { console.error(e); process.exit(1) })
