import Phaser from 'phaser'
import { WW, WH, PLACES, NPCS, LOCATIONS } from './world'

const hex = (s) => Number('0x' + s.slice(1))
const FONT = { fontFamily: '"Baloo 2", system-ui, sans-serif', fontStyle: 'bold' }
const JEEP = [0xef476f, 0x06d6a0, 0xffd166, 0x4cc9f0]

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game') }

  create() {
    const b = (this.b = this.registry.get('bridge'))
    this.zones = []
    this.physics.world.setBounds(0, 0, WW, WH)
    this.cameras.main.setBounds(0, 0, WW, WH)
    this.solid(0, 0, WW, 480) // everything behind the north row of buildings

    this.drawBackdrop()
    this.drawGround()
    PLACES.forEach((p) => this.drawBuilding(p))
    this.drawPark()
    this.drawPoles()

    JEEP.forEach((c, i) => this.jeepTexture('jeep' + i, c))
    this.vehicles = [[0, 610, -1], [1, 680, 1], [2, 640, -1]].map(([i, y, d], n) => {
      const s = this.add.image(300 + n * 800, y, 'jeep' + i).setOrigin(0.5, 1).setDepth(y)
      s.speed = d * (60 + n * 15); s.setFlipX(d < 0)
      return s
    })
    ;[[1700, 1180, 3, false], [2020, 1260, 1, true], [2260, 1170, 0, false]].forEach(([x, y, i, f]) => {
      this.add.image(x, y, 'jeep' + i).setOrigin(0.5, 1).setDepth(y).setFlipX(f)
      this.solid(x - 52, y - 16, 104, 16)
    })

    this.makeChar('player', b.look)
    this.player = this.physics.add.sprite(300, 520, 'player-0').setOrigin(0.5, 1).setCollideWorldBounds(true)
    this.player.body.setSize(16, 10).setOffset(8, 52)
    this.npcs = NPCS.map((n) => {
      this.makeChar('npc-' + n.id, n.look)
      const s = this.physics.add.sprite(n.x, n.y, 'npc-' + n.id + '-0').setOrigin(0.5, 1)
      s.body.setSize(16, 10).setOffset(8, 52)
      s.npc = n; s.key = 'npc-' + n.id; s.home = new Phaser.Math.Vector2(n.x, n.y)
      return s
    })
    this.physics.add.collider([this.player, ...this.npcs], this.zones)
    this.time.addEvent({
      delay: 1800, loop: true,
      callback: () => this.npcs.forEach((s) => {
        if (Math.random() < 0.4) return s.setVelocity(0)
        const far = Phaser.Math.Distance.Between(s.x, s.y, s.home.x, s.home.y) > 70
        const a = far ? Math.atan2(s.home.y - s.y, s.home.x - s.x) : Math.random() * Math.PI * 2
        s.setVelocity(Math.cos(a) * 40, Math.sin(a) * 40)
        this.time.delayedCall(1000, () => s.active && s.setVelocity(0))
      }),
    })

    this.input.keyboard.disableGlobalCapture()
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E')
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.fit()
    this.scale.on('resize', () => this.fit())

    b.doInteract = () => this.interact()
    b.teleport = (id) => {
      const [x, y] = LOCATIONS[id]
      this.player.setPosition(x, y)
      this.cameras.main.centerOn(x, y)
    }
    this.events.once('shutdown', () => { b.doInteract = null; b.teleport = null })
  }

  fit() {
    const { width, height } = this.scale
    this.cameras.main.setZoom(Phaser.Math.Clamp(Math.min(width, height) / 520, 1.1, 2.2))
  }

  solid(x, y, w, h) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h)
    this.physics.add.existing(z, true)
    this.zones.push(z)
  }

  // ---------- art ----------
  drawBackdrop() {
    const sky = this.add.graphics().setDepth(0)
    sky.fillGradientStyle(0x4aa8ff, 0x4aa8ff, 0xcdeeff, 0xcdeeff, 1).fillRect(0, 0, WW, 480)
    sky.fillStyle(0xfff3a0, 0.3).fillCircle(1900, 90, 62).fillStyle(0xfff3a0).fillCircle(1900, 90, 40)
    sky.fillStyle(0xffffff, 0.9)
    for (let i = 0; i < 7; i++) { const x = i * 380 + 120, y = 70 + (i % 3) * 36; sky.fillEllipse(x, y, 130, 38).fillEllipse(x + 40, y - 14, 84, 34) }
    sky.fillStyle(0x7fb7a4)
    for (let x = -100; x < WW; x += 300) sky.fillTriangle(x, 300, x + 150, 110 + ((x / 300) % 3) * 24, x + 300, 300)
    sky.fillStyle(0x9db4cc)
    for (let x = 0; x < WW; x += 70) { const h = 50 + ((x * 13) % 90); sky.fillRect(x, 300 - h + 70, 56, h + 110) }
  }

  drawGround() {
    const g = this.add.graphics().setDepth(1)
    g.fillStyle(0x86c66b).fillRect(0, 480, WW, WH - 480)
    g.fillStyle(0x72b457)
    for (let i = 0; i < 320; i++) g.fillRect(Phaser.Math.Between(0, WW), Phaser.Math.Between(500, WH), 3, 7)
    g.fillStyle(0xd6d3d1).fillRect(0, 480, WW, 60).fillRect(0, 700, WW, 60).fillRect(1200, 760, 240, WH - 760)
    g.fillStyle(0xcfc8bb).fillRect(1440, 1020, WW - 1440, 600)
    g.fillStyle(0x5fae5a).fillRect(60, 800, 1120, 840)
    g.fillStyle(0xe7d3a7).fillRect(60, 1180, 1120, 80).fillRect(540, 800, 80, 840)
    g.fillStyle(0x4b5563).fillRect(0, 540, WW, 160).fillRect(1240, 700, 160, WH - 700)
    g.fillStyle(0xa8a29e).fillRect(0, 536, WW, 4).fillRect(0, 700, WW, 4)
    g.fillStyle(0xfcd116)
    for (let x = 0; x < WW; x += 90) if (x < 1200 || x > 1440) g.fillRect(x, 618, 48, 5)
    for (let y = 770; y < WH; y += 90) g.fillRect(1316, y, 8, 48)
  }

  drawBuilding(p) {
    const top = p.base - 200
    const g = this.add.graphics().setDepth(p.base)
    g.fillStyle(0x000000, 0.15).fillRect(p.x, p.base - 6, p.w + 10, 10)
    g.fillStyle(p.color).fillRect(p.x, top + 20, p.w, 180)
    g.fillStyle(p.roof).fillRect(p.x - 10, top, p.w + 20, 28)
    g.fillStyle(0x000000, 0.14).fillRect(p.x, top + 28, p.w, 8)
    ;[p.x + 28, p.x + p.w - 98].forEach((wx) => {
      g.fillStyle(0xffffff).fillRect(wx - 4, top + 44, 78, 62)
      g.fillStyle(0xbfe9ff).fillRect(wx, top + 48, 70, 54)
      g.fillStyle(0xffffff).fillRect(wx + 33, top + 48, 4, 54).fillRect(wx, top + 72, 70, 4)
    })
    g.fillStyle(0x4a2c17).fillRect(p.door - 30, p.base - 104, 60, 104)
    g.fillStyle(0xfcd116).fillCircle(p.door + 20, p.base - 52, 4)
    if (p.awning) {
      for (let i = 0; i < 10; i++) g.fillStyle(i % 2 ? 0xffffff : 0xd62828).fillRect(p.door - 100 + i * 20, p.base - 116, 20, 28)
      g.fillStyle(0x000000, 0.18).fillRect(p.door - 100, p.base - 88, 200, 6)
    }
    this.add.graphics().setDepth(2).fillStyle(0xfcd116, 0.9).fillRoundedRect(p.door - 18, p.base + 22, 36, 10, 4)
    this.add.text(p.x + p.w / 2, top + 14, p.label, { ...FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0.5).setDepth(p.base + 1)
    this.solid(p.x, top, p.w, 200)
  }

  drawPark() {
    ;[[140, 900], [320, 900], [820, 900], [1020, 900], [140, 1500], [400, 1560], [760, 1560], [1040, 1500], [300, 1340], [860, 1340]].forEach(([x, y]) => this.palm(x, y))
    this.bench(430, 1180); this.bench(730, 1285)
    this.fountain(580, 1240)
    const g = this.add.graphics().setDepth(830)
    g.fillStyle(0x8b5a2b).fillRect(572, 800, 8, 40).fillRect(500, 790, 160, 34)
    this.add.text(580, 806, '🌳 Parke', { ...FONT, fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setDepth(831)
  }

  palm(x, y) {
    const g = this.add.graphics().setDepth(y)
    g.fillStyle(0x000000, 0.15).fillEllipse(x, y, 40, 10)
    g.fillStyle(0x7c4a21).fillRect(x - 6, y - 170, 12, 170)
    g.fillStyle(0x5a3416)
    for (let k = y - 160; k < y; k += 22) g.fillRect(x - 6, k, 12, 3)
    const top = y - 170
    g.fillStyle(0x2f9e44)
    ;[[-90, 20], [-60, 38], [-20, 46], [90, 20], [60, 38], [20, 46]].forEach(([dx, dy]) => g.fillTriangle(x, top, x + dx, top + dy, x + dx * 0.45, top - 4))
    g.fillStyle(0x7c4a21).fillCircle(x - 6, top + 8, 5).fillCircle(x + 6, top + 8, 5)
    this.solid(x - 7, y - 8, 14, 8)
  }

  bench(x, y) {
    const g = this.add.graphics().setDepth(y).fillStyle(0x8b5a2b)
    g.fillRect(x - 40, y - 34, 80, 8).fillRect(x - 40, y - 62, 80, 6)
    g.fillStyle(0x4a2c17).fillRect(x - 34, y - 26, 6, 26).fillRect(x + 28, y - 26, 6, 26)
  }

  fountain(x, y) {
    const g = this.add.graphics().setDepth(y)
    g.fillStyle(0xbdb8b4).fillRect(x - 70, y - 30, 140, 30)
    g.fillStyle(0x38bdf8).fillRect(x - 60, y - 26, 120, 14)
    g.fillStyle(0xbdb8b4).fillRect(x - 10, y - 74, 20, 46).fillRect(x - 34, y - 78, 68, 10)
    g.fillStyle(0xbae6fd).fillCircle(x, y - 90, 7).fillCircle(x - 18, y - 78, 5).fillCircle(x + 18, y - 78, 5)
    this.solid(x - 70, y - 30, 140, 30)
  }

  drawPoles() {
    for (let x = 120; x < WW; x += 360) {
      if (x > 1180 && x < 1460) continue
      const g = this.add.graphics().setDepth(750)
      g.fillStyle(0x374151).fillRect(x - 4, 600, 8, 150).fillStyle(0xfff3a0).fillCircle(x, 598, 8)
      this.solid(x - 5, 742, 10, 8)
    }
  }

  jeepTexture(key, color) {
    if (this.textures.exists(key)) return
    const g = this.make.graphics({ add: false })
    g.fillStyle(0x000000, 0.2).fillEllipse(56, 46, 100, 8)
    g.fillStyle(color).fillRoundedRect(0, 12, 112, 28, 6).fillRect(8, 4, 92, 10)
    g.fillStyle(0xffffff, 0.35).fillRect(6, 2, 96, 4)
    g.fillStyle(0xfcd116).fillRect(0, 30, 112, 4)
    g.fillStyle(0xffffff).fillRect(0, 35, 112, 2)
    g.fillStyle(0xbfe9ff)
    for (let i = 0; i < 4; i++) g.fillRect(10 + i * 20, 16, 15, 11)
    g.fillRect(92, 16, 12, 11)
    g.fillStyle(0xfff3a0).fillRect(108, 26, 4, 5)
    g.fillStyle(0x111111).fillCircle(26, 40, 8).fillCircle(88, 40, 8)
    g.fillStyle(0x9ca3af).fillCircle(26, 40, 3).fillCircle(88, 40, 3)
    g.generateTexture(key, 112, 50)
    g.destroy()
  }

  // character facing right; frames: 0 idle, 1/2 walk (flipped when facing left)
  // l.gender === 'female' -> narrower top, skirt, shoulder-length hair; anything else -> male
  makeChar(key, l) {
    const sk = hex(l.skin), ha = hex(l.hair), sh = hex(l.shirt), st = l.hairStyle ?? 0
    const fem = l.gender === 'female'
    for (let f = 0; f < 3; f++) {
      const name = `${key}-${f}`
      if (this.textures.exists(name)) this.textures.remove(name)
      const g = this.make.graphics({ add: false })
      const leg = f === 0 ? 0 : f === 1 ? -6 : 6, sw = f === 0 ? 0 : f === 1 ? 5 : -5
      g.fillStyle(0x000000, 0.22).fillEllipse(16, 60, 24, 6)
      // back hair
      if (st === 2) g.fillStyle(ha).fillRect(6, 5, 10, 34)
      else if (fem) g.fillStyle(ha).fillRect(6, 5, 10, 20)
      // legs + shoes
      g.fillStyle(fem ? sk : 0x333a4a).fillRect(12 + leg, 40, 7, 18).fillRect(12 - leg, 40, 7, 18)
      g.fillStyle(0x111111).fillRect(12 + leg, 56, 11, 4).fillRect(12 - leg, 56, 11, 4)
      // body
      if (fem) {
        g.fillStyle(sh).fillRect(10, 20, 12, 16).fillRect(8, 34, 16, 9)
        g.fillRect(13 + sw, 22, 6, 10)
      } else {
        g.fillStyle(sh).fillRect(9, 20, 14, 22).fillRect(13 + sw, 22, 6, 12)
      }
      // arm, head, nose
      g.fillStyle(sk).fillRect(13 + sw, fem ? 32 : 34, 6, fem ? 6 : 8).fillCircle(16, 11, 9).fillRect(23, 10, 3, 3)
      // front hair
      g.fillStyle(ha)
      if (st === 1) g.fillRect(6, 0, 19, 8); else g.fillRect(8, 1, 16, 5)
      // eye
      g.fillStyle(0x111111).fillRect(20, 9, 2, 3)
      // female: blush
      if (fem) g.fillStyle(0xf472b6, 0.6).fillRect(19, 14, 3, 2)
      g.generateTexture(name, 32, 62)
      g.destroy()
    }
  }

  // ---------- interaction ----------
  updateNearby() {
    const p = this.player
    let best = null, bd = 70
    PLACES.forEach((pl) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, pl.door, pl.base + 28)
      if (d < bd) { bd = d; best = { type: 'place', id: pl.id, label: pl.label } }
    })
    this.npcs.forEach((s) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y)
      if (d < Math.min(bd, 60)) { bd = d; best = { type: 'npc', id: s.npc.id, label: 'Talk to ' + s.npc.name, name: s.npc.name, line: s.npc.line, shop: s.npc.shop } }
    })
    const key = best && best.type + best.id
    if (key !== this.nearKey) {
      this.nearKey = key
      this.nearest = best
      this.b.onNearby?.(best && { type: best.type, id: best.id, label: best.label })
    }
  }

  interact() {
    if (this.b.paused || !this.nearest) return
    this.b.onInteract?.(this.nearest)
  }

  update(t) {
    const b = this.b, p = this.player, k = this.keys, c = this.cursors
    const pressed = Phaser.Input.Keyboard.JustDown(k.E)
    let dx = 0, dy = 0
    if (!b.paused) {
      dx = (k.D.isDown || c.right.isDown ? 1 : 0) - (k.A.isDown || c.left.isDown ? 1 : 0) + (Math.abs(b.vec.x) > 0.15 ? b.vec.x : 0)
      dy = (k.S.isDown || c.down.isDown ? 1 : 0) - (k.W.isDown || c.up.isDown ? 1 : 0) + (Math.abs(b.vec.y) > 0.15 ? b.vec.y : 0)
      if (pressed) this.interact()
    }
    const len = Math.hypot(dx, dy)
    if (len > 1) { dx /= len; dy /= len }
    p.setVelocity(dx * 165, dy * 165)
    if (Math.abs(dx) > 0.1) p.setFlipX(dx < 0)
    p.setTexture(`player-${len > 0.1 ? 1 + (Math.floor(t / 140) % 2) : 0}`)
    p.setDepth(p.y)

    this.npcs.forEach((s) => {
      const v = s.body.velocity
      if (Math.abs(v.x) > 1) s.setFlipX(v.x < 0)
      s.setTexture(`${s.key}-${v.length() > 1 ? 1 + (Math.floor(t / 220) % 2) : 0}`)
      s.setDepth(s.y)
    })
    this.vehicles.forEach((v) => {
      v.x += (v.speed * this.game.loop.delta) / 1000
      if (v.x > WW + 100) v.x = -100
      if (v.x < -100) v.x = WW + 100
    })
    this.updateNearby()
  }
}