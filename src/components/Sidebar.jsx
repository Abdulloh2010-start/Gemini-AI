import { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import ThemeSettingsModal from './ThemeSettingsModal';

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onRenameChat, onDeleteChat, pinned, onTogglePinned, user}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null); 
  const extended = pinned;

  useEffect(() => {
    const getUserGeolocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=ru`
              );
              if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
              }
              const data = await response.json();
              
              setUserLocation({
                city: data.address.city || data.address.town || data.address.village || 'Неизвестно',
                country: data.address.country || 'Неизвестно',
              });
            } catch (error) {
              setUserLocation({ city: 'Ошибка загрузки города', country: '' });
            }
          },
          (error) => {
            let errorMessage = 'Геолокация недоступна';
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Доступ к геолокации отклонен пользователем.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Информация о местоположении недоступна.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Время ожидания запроса геолокации истекло.';
                break;
              default:
                errorMessage = 'Загрузка...';
            }
            setUserLocation({ city: errorMessage, country: errorMessage });
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        setUserLocation({ city: 'Браузер не поддерживает геолокацию', country: '' });
      }
    };

    getUserGeolocation();
  }, []);

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right });
    setMenuOpenId(prev => (prev === chatId ? null : chatId));
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className={`min-h-screen overflow-hidden flex flex-col justify-between bg-[#f0f4f9] px-[20px] pt-[30px] transition-all duration-300 ${extended ? 'w-[280px]' : 'w-[80px]'} hidden sm:flex`}>
        <div>
          <div className="flex items-center justify-between">
            <div onClick={() => onTogglePinned(!pinned)} className="cursor-pointer hover:bg-[#e2e6eb] h-[40px] w-[40px] flex items-center justify-center rounded-full mb-[20px]">
              <img src={assets.menu_icon} alt="Menu" className="w-[20px]" />
            </div>
          </div>

          <div className="px-[10px] mt-[10px]">
            <div onClick={onNewChat} className="flex items-center gap-[12px] pl-[16px] pr-[8px] py-[6px] mx-[-17px] rounded-full text-[#5f6368] text-[14px] cursor-pointer hover:bg-[#e2e6eb] transition-all duration-200">
              <img src={assets.plus_icon} alt="Plus" className="w-[20px] min-w-[20px] min-h-[20px]" />
              <p className={`transition-opacity duration-300 whitespace-nowrap ${extended ? 'opacity-100' : 'opacity-0'}`}>Новый чат</p>
            </div>

            {extended && (
              <div className="relative mt-[20px] mb-[10px] mx-[-17px]">
                <img src={assets.search_icon} alt="Search" className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[18px] text-[#5f6368]" />
                <input type="text" placeholder="Поиск чатов" className="w-full pl-[40px] pr-[10px] py-[8px] rounded-full bg-[#e2e6eb] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#9aa0a6]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
            )}

            <div className={`overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]{display:none} ${extended ? 'max-h-[calc(92vh-250px)] mt-[10px]' : 'max-h-0 mt-0'} transition-all duration-300`} style={{ marginBottom: '10px' }}>
              <p className="text-[14px] text-[#9aa0a6] mb-[12px] font-[600] sticky top-0 bg-[#f0f4f9] py-1 z-10">Недавние</p>
              {filteredChats.map(chat => (
                <div key={chat.id} onClick={() => { onSelectChat(chat.id); setMenuOpenId(null) }} className={`flex items-center justify-between group gap-[12px] pl-[16px] pr-[8px] py-[6px] rounded-full text-[#282828] hover:bg-[#e2e6eb] cursor-pointer transition-all duration-200 ${activeChatId === chat.id ? 'bg-[#e2e6eb]' : ''}`}>
                  <p className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis flex-1">{chat.title}</p>
                  <div onClick={e => handleMenuToggle(e, chat.id)} className="px-[5px] py-[5px] rounded-full hover:bg-white">
                    <img src={assets.vert_icon} alt="More" className="w-[20px]" />
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && extended && (
                <p className="text-[14px] text-[#9aa0a6] text-center mt-4">Чаты не найдены</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[8px] mb-[30px]">
          {user && extended && (
            <div className="flex items-center gap-[12px] h-[40px] px-[10px] py-[10px] rounded-full">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <p className={`text-[14px] transition-opacity duration-300 ${extended ? 'opacity-100' : 'opacity-0'}`}>{user.displayName || user.email?.split('@')[0]}</p>
            </div>
          )}
          <div onClick={ !showThemeModal ? () => setShowThemeModal(true) : () => setShowThemeModal(false)} className={`flex items-center gap-[12px] h-[40px] px-[10px] py-[10px] rounded-full hover:bg-[#e2e6eb] cursor-pointer transition-all duration-200 ${extended ? 'w-[250px]' : 'w-[40px]'}`}>
            <img src={assets.setting_icon} alt="Settings" className="w-[20px]" />
            <p className={`text-[14px] transition-opacity duration-300 ${extended ? 'opacity-100' : 'opacity-0'}`}>Настройки и справка</p>
          </div>
        </div>

        {menuOpenId && (
          <div className="fixed bg-white border-black border rounded rounded-bl-none shadow-md w-[150px] z-[10000]" style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}>
            <div onClick={() => { onRenameChat(menuOpenId); setMenuOpenId(null) }} className="px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer">Переименовать</div>
            <div onClick={() => { onDeleteChat(menuOpenId); setMenuOpenId(null) }} className="px-4 py-2 hover:bg-gray-100 text-sm text-red-500 cursor-pointer">Удалить</div>
          </div>
        )}
      </div>
      {showThemeModal && <ThemeSettingsModal onClose={() => setShowThemeModal(false)} userLocation={userLocation} />}
    </>
  );
};