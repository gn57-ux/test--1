/**
 * depthRange 基于 Feature 2 当前的 500vh 占位滚动高度均匀划分（0.1~0.8，
 * 首尾各留给开场标题与结尾展区）。后续如调整总滚动高度，这里需要同步复核。
 */
export interface ExhibitData {
  id: string
  index: number
  name: string
  story: string
  depthRange: [number, number]
  accentColor: string
}

export const exhibits: ExhibitData[] = [
  {
    id: 'paper-airplane',
    index: 1,
    name: '没有寄出的远方',
    story: '它曾经写满目的地，\n最后却一直停在出发之前。',
    depthRange: [0.1, 0.24],
    accentColor: '#DDF7FF',
  },
  {
    id: 'old-tape',
    index: 2,
    name: '没有播放完的夏天',
    story: '磁带停在某一首歌的中间，\n像那个没有正式说完的告别。',
    depthRange: [0.24, 0.38],
    accentColor: '#D98B4A',
  },
  {
    id: 'old-key',
    index: 3,
    name: '再也打不开的门',
    story: '钥匙还记得锁的形状，\n只是那扇门已经不在原来的地方。',
    depthRange: [0.38, 0.52],
    accentColor: '#FFD700',
  },
  {
    id: 'polaroid-photo',
    index: 4,
    name: '被时间曝光的人',
    story: '照片留下了那一天，\n却没有留下后来发生的事。',
    depthRange: [0.52, 0.66],
    accentColor: '#FFFFFF',
  },
  {
    id: 'astronaut',
    index: 5,
    name: '没有抵达的星球',
    story: '他一直向上看，\n却被留在了世界最深的地方。',
    depthRange: [0.66, 0.8],
    accentColor: '#DDF7FF',
  },
]
