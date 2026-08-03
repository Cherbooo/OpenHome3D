import type { ComponentType } from 'react'
import type { ParametricProps } from './shared'
import Sofa from './sofa'
import Armchair from './armchair'
import CoffeeTable from './coffee-table'
import SideTable from './side-table'
import DiningTable from './dining-table'
import Chair from './chair'
import Stool from './stool'
import Bed from './bed'
import Wardrobe from './wardrobe'
import TvBench from './tv-bench'
import Tv from './tv'
import FloorLamp from './floor-lamp'
import TableLamp from './table-lamp'
import Pendant from './pendant'
import Rug from './rug'
import Plant from './plant'
import Shelf from './shelf'
import Desk from './desk'

/** Map from builtin registry id to its parametric component. */
export const PARAMETRIC_COMPONENTS: Record<string, ComponentType<ParametricProps>> = {
  'builtin:sofa': Sofa,
  'builtin:armchair': Armchair,
  'builtin:coffee-table': CoffeeTable,
  'builtin:side-table': SideTable,
  'builtin:dining-table': DiningTable,
  'builtin:chair': Chair,
  'builtin:stool': Stool,
  'builtin:bed': Bed,
  'builtin:wardrobe': Wardrobe,
  'builtin:tv-bench': TvBench,
  'builtin:tv': Tv,
  'builtin:floor-lamp': FloorLamp,
  'builtin:table-lamp': TableLamp,
  'builtin:pendant': Pendant,
  'builtin:rug': Rug,
  'builtin:plant': Plant,
  'builtin:shelf': Shelf,
  'builtin:desk': Desk,
}

export { type ParametricProps } from './shared'
