import { schema, t, type SchemaType } from "@colyseus/schema";

/**
 * One input frame, consumed by `Room.defineInput()`. Flat primitives only, and
 * deliberately minimal:
 *   - no `seq`  — the engine's input counter is the sequence
 *   - no `dt`   — fixed timestep: one input advances exactly one step
 *   - no time   — the SDK stamps lag-comp timing on the wire envelope
 *
 * `int8<-1 | 0 | 1>` narrows the type for your code; the room's `sanitize`
 * clamp is what actually enforces it against a modified client.
 */
export const MoveInput = schema({
  moveX: t.int8<-1 | 0 | 1>(),
  moveY: t.int8<-1 | 0 | 1>(),
});
export type MoveInput = SchemaType<typeof MoveInput>;

export const Player = schema({
  x: t.number(),
  y: t.number(),
  vx: t.number(),
  vy: t.number(),

  // Authoritative room membership, derived server-side from x/y (see
  // getRoomIndexAtPosition) — never trust a client-claimed roomIndex.
  // -1 means "in the open arena, not inside any room."
  roomIndex: t.int8().default(-1),

  // Authoritative sleeping state — the server, not the client, decides
  // this (see MyRoom.ts's "toggleSleep" message handler).
  sleeping: t.boolean().default(false),

  // Authoritative coin balance. Earned only server-side (one per second
  // while sleeping — see MyRoom.ts's step()) and spent only server-side
  // (a successful "build" message) — a client never sets this directly,
  // and a build request never carries a claimed balance.
  coins: t.number().default(0),
});
export type Player = SchemaType<typeof Player>;

/**
 * A built gun. Minimal on purpose (8A: placement/sync only) — no targeting,
 * cooldown or damage state yet. `tileIndex` + `roomIndex` identify the build
 * slot it occupies; x/y are the authoritative pixel centre, so clients render
 * it without recomputing room geometry.
 */
export const Gun = schema({
  roomIndex: t.int8(),
  tileIndex: t.int8(),
  x: t.number(),
  y: t.number(),
  type: t.string().default("basic"),
});
export type Gun = SchemaType<typeof Gun>;

export const MyRoomState = schema({

  players: t.map(Player),

  // One independent door state per room, indexed exactly like
  // server/src/shared/constants.ts ROOM_POSITIONS (doorsOpen[i] is room
  // i's door). The server owns this; clients only ever request a toggle
  // ("toggleDoor" message, { roomIndex }) and react to the synchronized
  // value. Populated with 4 `false` entries in MyRoom.onCreate().
  doorsOpen: t.array("boolean"),

  // Parallel to doorsOpen, one lock flag per room. A locked door rejects
  // every toggleDoor request regardless of who sends it (see MyRoom.ts).
  // Set true the moment a player starts sleeping in that room, false again
  // only when that player wakes — never when the door itself is toggled.
  doorsLocked: t.array("boolean"),

  // Flat, one entry per build-tile slot across all four rooms — index
  // `roomIndex * BUILD_TILES_PER_ROOM + tileIndex` (see
  // server/src/shared/constants.ts ROOM_BUILD_TILES/BUILD_TILES_PER_ROOM).
  // True once a gun has been built there. This single array is both the
  // server's placement-validation state (occupancy) and the entire
  // client sync for guns — a gun's room/tile/position is fully recovered
  // from its index, so no separate "guns" list is needed for this
  // milestone. Populated with BUILD_TILES_PER_ROOM * 4 `false` entries in
  // MyRoom.onCreate().
  buildTilesOccupied: t.array("boolean"),

  // Authoritative guns, keyed by a unique server-generated id ("gun-1", …).
  // Public: every client sees every gun. Created only by a validated
  // "build" message (see MyRoom.ts); buildTilesOccupied stays the
  // occupancy flag for the tile the gun sits on.
  guns: t.map(Gun),

});
export type MyRoomState = SchemaType<typeof MyRoomState>;
