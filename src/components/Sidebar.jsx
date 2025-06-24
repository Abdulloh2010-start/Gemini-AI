import { useState } from "react";
import { assets } from "../assets/assets"; // Убедись, что assets.js корректно настроен

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  pinned,
  onTogglePinned,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null); // Состояние для открытия/закрытия меню чата
  const extended = pinned; // Используем 'pinned' для расширения/сворачивания

  return (
    <div
      className={`min-h-screen overflow-hidden flex flex-col justify-between bg-[#f0f4f9] px-[20px] pt-[30px] transition-all duration-300 ${
        extended ? "w-[280px]" : "w-[80px]"
      } hidden sm:flex`} // Скрыт на мобильных, flex на десктопах
    >
      <div>
        <div className="flex items-center justify-between">
          <div
            onClick={() => onTogglePinned(!pinned)} // Переключаем закрепление сайдбара
            className="cursor-pointer hover:bg-[#e2e6eb] h-[40px] w-[40px] flex items-center justify-center rounded-full mb-[20px]"
          >
            <img src={assets.menu_icon} alt="Menu" className="w-[20px]" />
          </div>
        </div>

        <div className="px-[10px] mt-[10px]">
          <div
            onClick={onNewChat} // Создать новый чат
            className="flex items-center gap-[12px] pl-[16px] pr-[8px] py-[6px] mx-[-17px] rounded-full text-[#5f6368] text-[14px] cursor-pointer hover:bg-[#e2e6eb] transition-all duration-200"
          >
            <img
              src={assets.plus_icon}
              alt="Plus"
              className="w-[20px] min-w-[20px] min-h-[20px]"
            />
            <p
              className={`transition-opacity duration-300 whitespace-nowrap ${
                extended ? "opacity-100" : "opacity-0" // Показать/скрыть текст
              }`}
            >
              Новый чат
            </p>
          </div>

          <div
            className={`overflow-y-auto ${
              extended ? "max-h-[calc(100vh-250px)] mt-[32px]" : "max-h-0 mt-0" // Высота для прокрутки чатов
            } transition-all duration-300`}
            style={{ marginBottom: '10px' }} // Отступ снизу для красоты
          >
            <p className="text-[14px] text-[#9aa0a6] mb-[12px] font-[600] sticky top-0 bg-[#f0f4f9] py-1 z-10">
              Недавние
            </p>

            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center justify-between group gap-[12px] pl-[16px] pr-[8px] py-[6px] rounded-full text-[#282828] hover:bg-[#e2e6eb] cursor-pointer transition-all duration-200 ${
                  activeChatId === chat.id ? "bg-[#e2e6eb]" : "" // Выделение активного чата
                }`}
              >
                <p
                  className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                  onClick={() => {
                    onSelectChat(chat.id); // Выбрать чат
                    setMenuOpenId(null); // Закрыть меню, если открыто
                  }}
                >
                  {chat.title}
                </p>
                <div className="relative">
                  <div
                    className="px-[5px] py-[5px] rounded-full hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation(); // Остановить всплытие, чтобы не выбрать чат
                      setMenuOpenId((prev) => (prev === chat.id ? null : chat.id)); // Переключить меню
                    }}
                  >
                    <img src={assets.vert_icon} alt="More" className="w-[20px]" />
                  </div>
                  {menuOpenId === chat.id && (
                    <div className="absolute right-0 top-[110%] z-10 bg-white border rounded shadow-md w-[150px]">
                      <div
                        onClick={() => {
                          onRenameChat(chat.id); // Переименовать
                          setMenuOpenId(null);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer"
                      >
                        ✏️ Переименовать
                      </div>
                      <div
                        onClick={() => {
                          onDeleteChat(chat.id); // Удалить
                          setMenuOpenId(null);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 text-sm text-red-500 cursor-pointer"
                      >
                        🗑 Удалить
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Нижний блок: Настройки и справка */}
      <div className="flex flex-col gap-[8px] mb-[30px]">
        <div
          className={`flex items-center gap-[12px] h-[40px] px-[10px] py-[10px] rounded-full hover:bg-[#e2e6eb] cursor-pointer transition-all duration-200 ${
            extended ? "w-[250px]" : "w-[40px]"
          }`}
        >
          <img src={assets.setting_icon} alt="Settings" className="w-[20px]" />
          <p
            className={`text-[14px] transition-opacity duration-300 ${
              extended ? "opacity-100" : "opacity-0"
            }`}
          >
            Настройки и справка
          </p>
        </div>
      </div>
    </div>
  );
}