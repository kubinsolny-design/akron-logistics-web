'use client'
import { useEffect, useId, useRef, useState } from 'react'

type Request={message:string}
function ConfirmationDialog({request,onAnswer}:{request:Request|null;onAnswer:(answer:boolean)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),id=useId()
  useEffect(()=>{if(request && !dialog.current?.open)dialog.current?.showModal();if(!request && dialog.current?.open)dialog.current.close()},[request])
  return <dialog ref={dialog} className="admin-confirmation" aria-labelledby={id} onCancel={event=>{event.preventDefault();onAnswer(false)}}><h3 id={id}>Potvrdit akci</h3><p>{request?.message}</p><div><button type="button" autoFocus onClick={()=>onAnswer(false)}>Zrušit</button><button type="button" className="admin-primary" onClick={()=>onAnswer(true)}>Potvrdit</button></div></dialog>
}
export function useConfirmation() {
  const [request,setRequest]=useState<Request|null>(null)
  const pending=useRef<((answer:boolean)=>void)|null>(null)
  useEffect(()=>()=>{pending.current?.(false)},[])
  function confirm(message:string){return new Promise<boolean>(resolve=>{pending.current?.(false);pending.current=resolve;setRequest({message})})}
  function answer(accepted:boolean){pending.current?.(accepted);pending.current=null;setRequest(null)}
  return {confirm,confirmation:<ConfirmationDialog request={request} onAnswer={answer}/>}
}
