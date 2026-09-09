import { createContext, useContext } from 'react'

const TransitionContext = createContext({
  showGlobalMask: false,
  setShowGlobalMask: () => {}
})

export const useTransition = () => useContext(TransitionContext)

export default TransitionContext
