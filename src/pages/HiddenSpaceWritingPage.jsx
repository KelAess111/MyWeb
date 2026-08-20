import { useOutletContext } from 'react-router-dom'
import WritingContainer from '../components/WritingContainer'
import { hiddenSpaceWriting } from '../data/hiddenSpaceWriting.generated'

function HiddenSpaceWritingPage() {
  const { setActiveScene, defaultScene } = useOutletContext()

  return (
    <WritingContainer
      data={hiddenSpaceWriting}
      titlePrefix="Afterlight / 写作"
      routeLabel="写作角落"
      backTo=".."
      rootLabel="隐藏空间首页"
      onSceneChange={setActiveScene}
      defaultScene={defaultScene}
    />
  )
}

export default HiddenSpaceWritingPage
