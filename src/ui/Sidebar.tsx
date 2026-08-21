import { type CSSProperties } from 'react'
import { useStore } from '../state/store'
import { ROOM_TYPES } from '../gen/roomTypes'
import { sideSpan, type Opening, type RoomDef, type Side } from '../state/home'
import { useUI } from './uiStore'
import SelectionPanel from './SelectionPanel'
import { OPENING_KIND_LABELS, SIDE_LABELS } from './labels'
import { GhostButton, IconButton, NumberInput, Row, Section, Slider } from './components'

const SIDES: Side[] = ['n', 's', 'e', 'w']

const cardStyle: CSSProperties = {
  border: '1px solid #e2e2e2',
  borderRadius: 6,
  padding: '6px 8px',
  marginTop: 6,
}

const miniBtnStyle: CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  whiteSpace: 'nowrap',
}

/** One opening on the room's exterior wall: kind select / offset slider / width / delete. */
function OpeningCard({ room, opening }: { room: RoomDef; opening: Opening }) {
  const updateOpening = useStore((s) => s.updateOpening)
  const removeOpening = useStore((s) => s.removeOpening)
  const span = sideSpan(room, opening.side).length
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select
          className="input"
          style={{ flex: 1, minWidth: 0 }}
          value={opening.kind}
          onChange={(e) => updateOpening(opening.id, { kind: e.target.value as Opening['kind'] })}
        >
          {(['door', 'open', 'window'] as const).map((k) => (
            <option key={k} value={k}>
              {OPENING_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <span className="caption">{SIDE_LABELS[opening.side]}</span>
        <IconButton title="删除 Delete" onClick={() => removeOpening(opening.id)}>
          ×
        </IconButton>
      </div>
      <Slider
        label="位置 Offset"
        value={opening.offset}
        min={opening.width / 2}
        max={Math.max(opening.width / 2, span - opening.width / 2)}
        step={0.05}
        display={`${opening.offset.toFixed(2)} m`}
        onChange={(v) => updateOpening(opening.id, { offset: v })}
      />
      <NumberInput
        label="宽度 Width"
        value={opening.width}
        min={0.5}
        max={2.4}
        step={0.05}
        unit="m"
        onCommit={(v) => updateOpening(opening.id, { width: v })}
      />
    </div>
  )
}

/** Door/window editing for the single room — all four walls are exterior. */
function OpeningsSection({ room }: { room: RoomDef }) {
  const home = useStore((s) => s.home)
  const addOpening = useStore((s) => s.addOpening)
  const own = home.openings.filter((o) => o.a === room.id)

  const addOnSide = (side: Side, kind: 'door' | 'window') => {
    addOpening({
      kind,
      a: room.id,
      b: 'exterior',
      side,
      offset: sideSpan(room, side).length / 2,
      width: kind === 'window' ? 1.2 : 0.9,
    })
  }

  return (
    <Section title="门窗 Openings" collapsible>
      {SIDES.map((side) => (
        <Row key={side} label={SIDE_LABELS[side]}>
          <GhostButton style={miniBtnStyle} onClick={() => addOnSide(side, 'door')}>
            + 门 Door
          </GhostButton>
          <GhostButton style={miniBtnStyle} onClick={() => addOnSide(side, 'window')}>
            + 窗 Window
          </GhostButton>
        </Row>
      ))}
      {own.map((o) => (
        <OpeningCard key={o.id} room={room} opening={o} />
      ))}
      {own.length === 0 && <p className="hint">还没有门窗 No openings yet.</p>}
    </Section>
  )
}

/** 方案 Plan: seed, room type, dimensions, wall height, partition, openings. */
function PlanSection() {
  const room = useStore((s) => s.home.rooms[0])
  const setRoomType = useStore((s) => s.setRoomType)
  const setRoomRect = useStore((s) => s.setRoomRect)
  const newRoom = useStore((s) => s.newRoom)
  const reshuffleFurniture = useStore((s) => s.reshuffleFurniture)
  const wallHeight = useStore((s) => s.wallHeight)
  const setStructure = useStore((s) => s.setStructure)
  const setRoomPartition = useStore((s) => s.setRoomPartition)

  const partitionHeight = room.partitionHeight
  const partitionUnit =
    partitionHeight === 0 ? '无 none' : partitionHeight === wallHeight ? '通高 full' : 'm'

  return (
    <>
      <div className="row">
        <span className="row-label">房间类型 Room type</span>
        <span className="row-value" style={{ flex: 1, maxWidth: 132 }}>
          <select
            className="input"
            value={room.type}
            onChange={(e) => setRoomType(e.target.value)}
          >
            {ROOM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </span>
      </div>
      <NumberInput
        label="面宽 Width"
        value={room.rect.w}
        min={1.5}
        max={12}
        step={0.05}
        unit="m"
        onCommit={(v) => setRoomRect(room.id, { ...room.rect, w: v })}
      />
      <NumberInput
        label="进深 Depth"
        value={room.rect.d}
        min={1.5}
        max={12}
        step={0.05}
        unit="m"
        onCommit={(v) => setRoomRect(room.id, { ...room.rect, d: v })}
      />
      <NumberInput
        label="墙高 Wall height"
        value={wallHeight}
        min={2}
        max={5}
        step={0.05}
        unit="m"
        onCommit={(v) => setStructure({ wallHeight: v })}
      />
      <NumberInput
        label="隔墙 Partition"
        value={partitionHeight}
        min={0}
        max={5}
        step={0.05}
        unit={partitionUnit}
        onCommit={(v) => setRoomPartition(v)}
      />
      <div className="btn-row">
        <GhostButton onClick={() => newRoom()}>新建房间 New room</GhostButton>
        <GhostButton onClick={() => reshuffleFurniture()}>换一换 Shuffle</GhostButton>
      </div>
      <OpeningsSection room={room} />
    </>
  )
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function Sidebar() {
  const collapsed = useUI((s) => s.collapsed)
  const openModal = useUI((s) => s.openModal)
  const selectedId = useStore((s) => s.selectedId)

  const extras = useStore((s) => s.extras)
  const setExtras = useStore((s) => s.setExtras)

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-inner">
        <div className="sb-header">
          <img className="sb-logo" src={`${import.meta.env?.BASE_URL ?? '/'}brand/logo-header.webp`} alt="家居生成器 logo" />
          <span className="sb-title">家居生成器</span>
          <span className="sb-axo">Cartoon</span>
          <a
            className="icon-btn sb-github"
            href="https://github.com/yuyou-dev/OpenHome3D"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub 仓库 Repository"
          >
            <GitHubIcon />
          </a>
        </div>

        {selectedId && <SelectionPanel />}

        <Section title="方案 Plan" collapsible>
          <PlanSection />
        </Section>

        <Section title="家具 Furniture" collapsible>
          <Slider
            label="装饰密度 Extras"
            value={extras}
            min={0}
            max={100}
            step={1}
            display={`${extras}%`}
            onChange={setExtras}
          />
          <div className="btn-row">
            <GhostButton onClick={() => openModal({ kind: 'add' })}>+ 添加家具 Add furniture</GhostButton>
          </div>
        </Section>

        <a
          className="link-btn sb-feedback"
          href="https://github.com/yuyou-dev/OpenHome3D/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
        >
          反馈 Feedback ↗
        </a>
      </div>
    </aside>
  )
}
