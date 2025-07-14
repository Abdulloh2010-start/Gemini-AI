import { useState } from 'react'
import { assets } from '../assets/assets'

export default function MobileSidebar({ onClose, onSelectChat, onNewChat, onRenameChat, onDeleteChat, chats, activeChatId, user, onOpenProfileModal }) {
  const [menuOpenId, setMenuOpenId] = useState(null)
  return (
    <div className={`fixed inset-0 z-50 flex sm:hidden [animation:slide-in-left_0.3s_ease-out_forwards]`}>
      <div className="w-[250px] h-full bg-[#f0f4f9] px-[20px] pt-[30px] flex flex-col justify-between shadow-lg [animation:slide-in-left_0.3s_ease-out_forwards]">
        <div className="flex justify-start mb-[20px]">
          <img src={assets.menu_icon} alt="Close" className="w-[20px] cursor-pointer" onClick={onClose} />
        </div>
        <div className="flex items-center gap-[12px] px-[10px] py-[6px] rounded-[9999px] text-[#5f6368] text-[14px] cursor-pointer hover:bg-[#e2e6eb]" onClick={onNewChat}>
          <img src={assets.plus_icon} alt="Plus" className="w-[20px]" />
          <p>Новый чат</p>
        </div>
        <div className="mt-[32px] flex-1 overflow-y-auto">
          <p className="text-[14px] text-[#9aa0a6] mb-[12px] font-[600]">Недавние</p>
          {chats.map(chat => (
            <div key={chat.id} className={`flex items-center justify-between group gap-[12px] pl-[16px] pr-[8px] py-[6px] rounded-full text-[#282828] hover:bg-[#e2e6eb] cursor-pointer ${activeChatId===chat.id?'bg-[#e2e6eb]':''}`}>
              <p className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis flex-1" onClick={()=>{onSelectChat(chat.id);onClose()}}>{chat.title}</p>
              <div className="relative">
                <div className="px-[5px] py-[5px] rounded-full hover:bg-white" onClick={e=>{e.stopPropagation();setMenuOpenId(prev=>prev===chat.id?null:chat.id)}}>
                  <img src={assets.vert_icon} alt="More" className="w-[20px]" />
                </div>
                {menuOpenId===chat.id&&(
                  <div className="absolute right-0 top-[110%] z-10 bg-white border rounded shadow-md w-[150px] [animation:slide-in-left_0.2s_ease-out_forwards]">
                    <div className="px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer" onClick={()=>{onRenameChat(chat.id);setMenuOpenId(null);onClose()}}>Переименовать</div>
                    <div className="px-4 py-2 hover:bg-gray-100 text-sm text-red-500 cursor-pointer" onClick={()=>{onDeleteChat(chat.id);setMenuOpenId(null);onClose()}}>Удалить</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto mb-[20px]">
          {user&&(
            <div className="flex items-center gap-[12px] h-[40px] px-[10px] py-[10px] rounded-[9999px] cursor-pointer" onClick={()=>{onOpenProfileModal();onClose()}}>
              {user.photoURL?<img src={user.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />:<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{user.email?user.email[0].toUpperCase():'U'}</div>}
              <p className="[animation-pulse-cursor] text-[14px]">{user.displayName||user.email?.split('@')[0]}</p>
            </div>
          )}
          <div className="flex items-center gap-[12px] h-[40px] px-[10px] py-[10px] rounded-[9999px] hover:bg-[#e2e6eb] cursor-pointer">
            <img src={assets.setting_icon} alt="Settings" className="w-[20px]" />
            <p className="text-[14px]">Настройки и справка</p>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-transparent" onClick={onClose}></div>
    </div>
  )
};