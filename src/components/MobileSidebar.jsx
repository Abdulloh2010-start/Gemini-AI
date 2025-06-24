import { assets } from "../assets/assets";

export default function MobileSidebar({ onClose, onSelectChat, onNewChat, chats, activeChatId }) {
  return (
    <div className={`fixed inset-0 z-50 flex sm:hidden`}>
      <div className={`w-[250px] h-full bg-[#f0f4f9] px-[20px] pt-[30px] flex flex-col justify-between shadow-lg animate-slide-in-left`}>
        <div className="flex justify-end mb-[20px]">
          <img src={assets.menu_icon} alt="Close" className="w-[20px] cursor-pointer" onClick={onClose}/>
        </div>
        <div
          className="flex items-center gap-[12px] px-[10px] py-[6px] rounded-[9999px] text-[#5f6368] text-[14px] cursor-pointer hover:bg-[#e2e6eb]"
          onClick={onNewChat} // Добавлен обработчик
        >
          <img src={assets.plus_icon} alt="Plus" className="w-[20px]" />
          <p>Новый чат</p>
        </div>
        <div className="mt-[32px] flex-1 overflow-y-auto"> {/* Добавлено overflow-y-auto и flex-1 */}
          <p className="text-[14px] text-[#9aa0a6] mb-[12px] font-[600]">Недавние</p>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-[12px] pl-[16px] pr-[8px] py-[6px] rounded-[9999px] text-[#282828] hover:bg-[#e2e6eb] cursor-pointer ${
                activeChatId === chat.id ? "bg-[#e2e6eb]" : ""
              }`}
              onClick={() => {
                onSelectChat(chat.id); // Добавлен обработчик выбора чата
                onClose(); // Закрываем сайдбар после выбора
              }}
            >
              <p className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                {chat.title}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-auto mb-[20px]">
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