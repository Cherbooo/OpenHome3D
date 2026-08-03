/* ---------------------------------------------------------------------------
   Curated toy palette — the single source of color for parametric furniture,
   the room shell and thumbnails. Keep every new color here: the cartoon look
   stays "colorful but one coherent set" only if nothing picks its own hex.
--------------------------------------------------------------------------- */

export const PALETTE = {
  /** warm near-black: edge lines everywhere */
  ink: '#2E2A26',
  /** warm cream: walls, linens, door panels */
  cream: '#FFF3DC',
  /** light warm wood: floor, table tops */
  wood: '#D9A066',
  /** darker wood: legs, frames, shelf backs */
  woodDark: '#A9764B',
  /** coral red: sofas, stools, accents */
  coral: '#FF8A70',
  /** soft pink: cushions, rug */
  pink: '#FF9FB2',
  /** sunny yellow: lampshades, chair pads */
  yellow: '#FFC93C',
  /** leaf green: plants */
  green: '#7FB069',
  /** terracotta: plant pots */
  terra: '#E07A5F',
  /** teal: armchair, bathroom-ish accents */
  teal: '#57B8A2',
  /** mid blue: bed throw, TV glow */
  blue: '#6FA8DC',
  /** light sky blue: window glass, pillows */
  sky: '#A8D8F0',
  /** soft lavender: shadows/AO tint */
  lavender: '#C9A7EB',
} as const

export type PaletteKey = keyof typeof PALETTE

/** Room shell colors. */
export const SHELL = {
  wall: PALETTE.cream,
  floor: '#EAC493',
  doorLeaf: '#C98B5E',
  glass: '#BFE3FF',
} as const
