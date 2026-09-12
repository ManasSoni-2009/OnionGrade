import { Link } from 'react-router-dom'
import { Leaf } from '@phosphor-icons/react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/dashboard" className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark"><Leaf size={17} weight="fill" /></span>
      <span>onion<span>grade</span></span>
    </Link>
  )
}
