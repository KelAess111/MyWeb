import cover2030 from '../assets/picture/2030/surface.jpg'
import cover2029 from '../assets/picture/2029/surface.jpg'
import cover2028 from '../assets/picture/2028/surface.jpg'
import cover2027 from '../assets/picture/2027/surface.jpg'
import cover2026 from '../assets/picture/2026/surface.jpg'
import image2026_1 from '../assets/picture/2026/图1.jpg'
import image2026_2 from '../assets/picture/2026/图2.jpg'
import image2026_3 from '../assets/picture/2026/图3.jpg'
import image2026_4 from '../assets/picture/2026/图4.jpg'
import image2026_5 from '../assets/picture/2026/图5.jpg'
import image2026_6 from '../assets/picture/2026/图6.jpg'
import image2026_7 from '../assets/picture/2026/图7.jpg'

export const publicGalleryData = [
  {
    id: '2030',
    year: '2030',
    title: '2030 图册',
    summary: '预留给这一年的新画面，先用封面和时间节点占位。',
    note: '这一年的图册还在整理中，等新图片到位后会继续补充。',
    cover: cover2030,
    images: [],
    side: 'left',
  },
  {
    id: '2029',
    year: '2029',
    title: '2029 图册',
    summary: '先把这一年的入口和封面保留下来。',
    note: '图册内容暂未展开，当前只有封面可供进入。',
    cover: cover2029,
    images: [],
    side: 'right',
  },
  {
    id: '2028',
    year: '2028',
    title: '2028 图册',
    summary: '为后续补图预留的年份节点。',
    note: '目前还没有正文图片，先显示封面和空状态。',
    cover: cover2028,
    images: [],
    side: 'left',
  },
  {
    id: '2027',
    year: '2027',
    title: '2027 图册',
    summary: '这一年先保留目录与封面。',
    note: '等图片整理好后，这一页会继续补全。',
    cover: cover2027,
    images: [],
    side: 'right',
  },
  {
    id: '2026',
    year: '2026',
    title: '2026 图册',
    summary: '目前已经整理好的图册，从这一年开始浏览。',
    note: '这一年已经放入了实际图片，可以直接放大查看。',
    cover: cover2026,
    images: [
      { src: image2026_1, alt: '2026 图册第 1 张' },
      { src: image2026_2, alt: '2026 图册第 2 张' },
      { src: image2026_3, alt: '2026 图册第 3 张' },
      { src: image2026_4, alt: '2026 图册第 4 张' },
      { src: image2026_5, alt: '2026 图册第 5 张' },
      { src: image2026_6, alt: '2026 图册第 6 张' },
      { src: image2026_7, alt: '2026 图册第 7 张' },
    ],
    side: 'left',
  },
]
