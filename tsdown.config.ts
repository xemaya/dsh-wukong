import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@dsh-external/dsh-wukong', ['src/index.ts'], {
  portableCssModuleIds: true,
})
