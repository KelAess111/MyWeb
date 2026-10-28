import { useLocation } from 'react-router-dom'
import { isLocalEditMode } from '../utils/editMode'
export default function useEditMode() {
  useLocation()
  return isLocalEditMode()
}
