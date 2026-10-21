'use client'
import { useEffect } from 'react'
import { actionEvent } from '@/lib/action-events'

export default function ActionEvents(){
  useEffect(()=>{
    const handle=(event:MouseEvent)=>{
      const target=event.target instanceof Element?event.target.closest<HTMLElement>('[data-action]'):null
      const payload=actionEvent(target?.dataset.action,window.location.pathname)
      const gtag=(window as Window & {gtag?:(...args:unknown[])=>void}).gtag
      if (payload && gtag) gtag('event',payload.name,payload.params)
    }
    document.addEventListener('click',handle)
    return ()=>document.removeEventListener('click',handle)
  },[])
  return null
}
