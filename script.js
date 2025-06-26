// Бургер-меню
const burgerMenu = document.querySelector('.burger-menu');
const navList = document.querySelector('.nav-list');

burgerMenu.addEventListener('click', () => {
  burgerMenu.classList.toggle('active');
  navList.classList.toggle('active');
});

// Закрытие меню (для бургер-меню)
document.addEventListener('click', (e) => {
  if (!navList.contains(e.target) && !burgerMenu.contains(e.target)) {
    burgerMenu.classList.remove('active');
    navList.classList.remove('active');
  }
});

// Аккордеон меню
document.querySelectorAll('.menu-header').forEach(header => {
  header.addEventListener('click', () => {
    const category = header.parentElement;
    category.classList.toggle('active');

    document.querySelectorAll('.menu-category').forEach(other => {
      if (other !== category) other.classList.remove('active');
    });

    const items = category.querySelector('.menu-items');
    items.style.maxHeight = items.style.maxHeight ? null : items.scrollHeight + 'px';
  });
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Корзина - переменные объявлены, но присвоены будут после DOMContentLoaded
let cartOverlay;
let cartSidebar;
let closeCartButton;
let cartItemsList;
let totalPriceElement;
let addToCartButtons;
let cartIcon;
let cartCounter;
let checkoutButton; // Добавляем переменную для кнопки оформления заказа

// Получаем ссылки на элементы модального окна деталей заказа
let orderDetailsModalOverlay;
let orderDetailsModal;
let closeOrderDetailsButtons;
let orderDetailsForm; // Форма внутри модального окна деталей заказа
let tableNumberInput; // Поле номера столика
let orderCommentInput; // Поле комментария

// Получаем ссылки на элементы модального окна подтверждения возраста
let ageVerificationOverlay;
let ageVerificationModal;
let confirmAgeBtn;
let denyAgeBtn;

let cart = []; // Массив для хранения товаров в корзине

// Обновление интерфейса корзины
function updateCartUI() {
  if (!cartItemsList || !totalPriceElement || !cartCounter) {
    console.error('Cart UI elements not found!');
    return;
  }
  cartItemsList.innerHTML = ''; // Очищаем текущий список

  let total = 0;

  cart.forEach((item, index) => {
    const cartItemElement = document.createElement('div');
    cartItemElement.classList.add('cart-item');
    cartItemElement.innerHTML = `
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-details">${item.details}</div>
      </div>
      <div class="item-quantity">x${item.quantity}</div>
      <div class="item-price">${item.price * item.quantity}Р</div>
      <button class="remove-item" data-index="${index}">&times;</button>
    `;
    cartItemsList.appendChild(cartItemElement);
    total += item.price * item.quantity;
  });

  cartCounter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  totalPriceElement.textContent = `${total}Р`;

  // Добавляем обработчики удаления после создания элементов
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      removeItemFromCart(index);
    });
  });
}

// Удаление товара из корзины
function removeItemFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

// Загрузка расписания при загрузке страницы
async function loadSportsSchedules() {
  const matchesList = document.querySelector('.matches-list');
  if (!matchesList) return;

  matchesList.innerHTML = '<h2>Расписание трансляций</h2>';

  const leagues = [
    { id: 39, name: 'Футбол: Англия (Премьер-лига)' },
    { id: 140, name: 'Футбол: Испания (Ла Лига)' },
    { id: 135, name: 'Футбол: Италия (Серия А)' },
    { id: 78, name: 'Футбол: Германия (Бундеслига)' },
    { id: 61, name: 'Футбол: Франция (Лига 1)' }
  ];

  for (const league of leagues) {
    try {
      const response = await fetch(`/api/sports?id=${league.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка ${response.status}`);
      }

      const data = await response.json();
      console.log(`Данные для ${league.name}:`, data);

      if (!data.events || data.events.length === 0) {
        throw new Error('Нет данных о матчах');
      }

      const leagueSection = document.createElement('div');
      leagueSection.className = 'league-section';
      leagueSection.innerHTML = `
        <div class="league-header">
          <h3>${data.name}</h3>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="matches-container">
          ${data.events.map(match => `
            <div class="match-item">
              <div class="match-info">
                <div class="teams">${match.strEvent}</div>
                <div class="match-details">
                  <span class="date">${match.dateEvent}</span>
                  <span class="time">${match.strTime}</span>
                  ${match.venue ? `<span class="venue">${match.venue}</span>` : ''}
                </div>
              </div>
              <div class="match-status">
                ${match.status ? `<span class="status">${match.status}</span>` : ''}
                ${match.score ? `<span class="score">${match.score}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Добавляем обработчик клика для сворачивания/разворачивания
      const leagueHeader = leagueSection.querySelector('.league-header');
      const matchesContainer = leagueSection.querySelector('.matches-container');
      const toggleIcon = leagueSection.querySelector('.toggle-icon');

      leagueHeader.addEventListener('click', () => {
        const isExpanded = matchesContainer.style.maxHeight !== '0px';
        matchesContainer.style.maxHeight = isExpanded ? '0px' : matchesContainer.scrollHeight + 'px';
        toggleIcon.textContent = isExpanded ? '▶' : '▼';
        leagueSection.classList.toggle('collapsed');
      });

      // Инициализируем состояние (свернуто)
      matchesContainer.style.maxHeight = '0px';
      toggleIcon.textContent = '▶';
      leagueSection.classList.add('collapsed');

      matchesList.appendChild(leagueSection);
    } catch (error) {
      console.error(`Ошибка при загрузке данных для лиги ${league.name}:`, error);
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = `Не удалось загрузить данные для ${league.name}: ${error.message}`;
      matchesList.appendChild(errorElement);
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Временный обработчик для отладки кликов - оставлен для общей отладки
  document.addEventListener('click', (e) => {
    console.log('Clicked on:', e.target);
  });

  // Получаем ссылки на элементы корзины после загрузки DOM
  cartOverlay = document.querySelector('.cart-overlay');
  cartSidebar = document.querySelector('.cart-sidebar');
  closeCartButton = document.querySelector('.close-cart');
  cartItemsList = document.querySelector('.cart-items-list');
  cartCounter = document.querySelector('.cart-counter');
  totalPriceElement = document.querySelector('.total-price');
  addToCartButtons = document.querySelectorAll('.add-to-cart');
  cartIcon = document.querySelector('.cart-icon'); // Получаем ссылку здесь же
  checkoutButton = document.querySelector('.checkout-button'); // Получаем ссылку на кнопку оформления заказа

  // Получаем ссылки на элементы модального окна бронирования
  const bookingButton = document.querySelector('.booking-form button[type="submit"]');
  const bookingModalOverlay = document.querySelector('.booking-modal-overlay');
  const bookingModal = document.querySelector('.booking-modal');
  const closeModalButton = document.querySelector('.booking-modal .close-modal');
  const bookingInfoForm = document.querySelector('#bookingInfoForm'); // Получаем форму в модальном окне
  const userNameInput = document.querySelector('#userName'); // Поле имени
  const userPhoneInput = document.querySelector('#userPhone'); // Поле телефона

  // Получаем ссылки на поля ввода из основной формы бронирования (дата и гости)
  const bookingDateInput = document.querySelector('.booking-form input[type="datetime-local"]');
  const bookingGuestsInput = document.querySelector('.booking-form input[type="number"]');

  // Получаем ссылки на элементы кастомного окна подтверждения
  const confirmationModalOverlay = document.querySelector('.confirmation-modal-overlay');
  const confirmationModal = document.querySelector('.confirmation-modal');
  const closeConfirmationButtons = document.querySelectorAll('.close-confirmation-modal'); // Кнопки закрытия в новом окне

  // Получаем ссылки на элементы модального окна деталей заказа
  orderDetailsModalOverlay = document.querySelector('.order-details-modal-overlay');
  orderDetailsModal = document.querySelector('.order-details-modal');
  closeOrderDetailsButtons = document.querySelectorAll('.close-order-details-modal');
  orderDetailsForm = document.querySelector('#orderDetailsForm');
  tableNumberInput = document.querySelector('#tableNumber');
  orderCommentInput = document.querySelector('#orderComment');

  // Получаем ссылки на элементы модального окна подтверждения возраста
  ageVerificationOverlay = document.querySelector('.age-verification-overlay');
  ageVerificationModal = document.querySelector('.age-verification-modal');
  confirmAgeBtn = document.querySelector('#confirmAgeBtn');
  denyAgeBtn = document.querySelector('#denyAgeBtn');

  console.log('DOM fully loaded and parsed');
  console.log('Cart icon element:', cartIcon);
  console.log('Cart overlay element:', cartOverlay);
  console.log('Cart sidebar element:', cartSidebar);
  console.log('Close cart button element:', closeCartButton);
  console.log('Cart items list element:', cartItemsList);
  console.log('Cart counter element:', cartCounter);
  console.log('Total price element:', totalPriceElement);
  console.log('Add to cart buttons found (inside DOMContentLoaded):', addToCartButtons.length);
  console.log('Booking button element:', bookingButton);
  console.log('Booking modal overlay element:', bookingModalOverlay);
  console.log('Booking modal element:', bookingModal);
  console.log('Close modal button element:', closeModalButton);
  console.log('Booking info form element:', bookingInfoForm);
  console.log('User name input element:', userNameInput);
  console.log('User phone input element:', userPhoneInput);
  console.log('Booking date input element:', bookingDateInput);
  console.log('Booking guests input element:', bookingGuestsInput);
  console.log('Confirmation modal overlay element:', confirmationModalOverlay);
  console.log('Confirmation modal element:', confirmationModal);
  console.log('Close confirmation buttons count:', closeConfirmationButtons.length);
  console.log('Checkout button element:', checkoutButton); // Логируем кнопку оформления заказа
  console.log('Order details modal overlay element:', orderDetailsModalOverlay);
  console.log('Order details modal element:', orderDetailsModal);
  console.log('Close order details buttons count:', closeOrderDetailsButtons.length);
  console.log('Order details form element:', orderDetailsForm);
  console.log('Table number input element:', tableNumberInput);
  console.log('Order comment input element:', orderCommentInput);
  console.log('Age verification overlay element:', ageVerificationOverlay);
  console.log('Age verification modal element:', ageVerificationModal);
  console.log('Confirm age button element:', confirmAgeBtn);
  console.log('Deny age button element:', denyAgeBtn);

  // Проверяем статус подтверждения возраста в localStorage
  const ageConfirmed = localStorage.getItem('ageConfirmed');
  console.log('Age confirmed status from localStorage:', ageConfirmed);

  if (ageConfirmed === 'true') {
    console.log('Age already confirmed, hiding age verification modal.');
    // Если возраст подтвержден, скрываем модальное окно
    if (ageVerificationOverlay && ageVerificationModal) {
      ageVerificationOverlay.classList.remove('active');
      ageVerificationModal.classList.remove('active');
    }
  } else {
    console.log('Age not confirmed, showing age verification modal.');
    // Если возраст не подтвержден, показываем модальное окно
    if (ageVerificationOverlay && ageVerificationModal) {
      ageVerificationOverlay.classList.add('active'); // Показываем оверлей
      ageVerificationModal.classList.add('active'); // Показываем модальное окно
    }
  }

  // Открытие корзины - обработчик клика на иконке корзины
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      console.log('Cart icon clicked');
      if (cartOverlay && cartSidebar) {
        cartOverlay.style.display = 'block';
        cartSidebar.classList.add('open');
      } else {
        console.error('Cart overlay or sidebar not found inside click handler!');
      }
    });
  } else {
    console.error('Cart icon element not found inside DOMContentLoaded!');
  }

  // Закрытие корзины
  if (closeCartButton && cartOverlay && cartSidebar) {
    closeCartButton.addEventListener('click', () => {
      console.log('Close cart button clicked');
      cartOverlay.style.display = 'none';
      cartSidebar.classList.remove('open');
    });
  }

  if (cartOverlay && cartSidebar) {
    cartOverlay.addEventListener('click', () => {
      console.log('Cart overlay clicked');
      cartOverlay.style.display = 'none';
      cartSidebar.classList.remove('open');
    });
  }

  // Добавление товара в корзину - обработчик клика на кнопках "Добавить"
  if (addToCartButtons.length > 0) {
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        console.log('Add to cart button clicked', e.target);
        const menuitem = e.target.closest('.menu-item');
        if (!menuitem) {
          console.error('Could not find parent menu item for add to cart button.');
          return;
        }
        console.log('Menu item element:', menuitem);
        const itemNameElement = menuitem.querySelector('h4');
        const itemPriceElement = menuitem.querySelector('p');

        if (!itemNameElement || !itemPriceElement) {
          console.error('Could not find item name or price elements.');
          return;
        }

        const itemName = itemNameElement.textContent;
        const itemPriceText = itemPriceElement.textContent;
        console.log('Item Name:', itemName, 'Item Price Text:', itemPriceText);

        // Извлекаем только числовую часть цены
        const itemPrices = itemPriceText.match(/\d+/g); // Находим все числа
        const itemPrice = itemPrices ? parseInt(itemPrices[itemPrices.length - 1]) : 0; // Берем последнее число

        // Извлекаем детали, удаляя последнюю найденную цену из строки
        let itemDetails = itemPriceText;
        if (itemPrices && itemPrices.length > 0) {
          const lastPriceString = itemPrices[itemPrices.length - 1];
          const lastIndex = itemPriceText.lastIndexOf(lastPriceString);
          if (lastIndex !== -1) {
            itemDetails = itemPriceText.substring(0, lastIndex).trim();
          }
        }
        itemDetails = itemDetails.replace(/\|\s*$/, '').trim(); // Удаляем висячий разделитель в конце, если есть

        console.log('Parsed item details:', { name: itemName, price: itemPrice, details: itemDetails });

        const existingItemIndex = cart.findIndex(item => item.name === itemName);

        if (existingItemIndex > -1) {
          cart[existingItemIndex].quantity++;
          console.log('Increased quantity for existing item:', itemName);
        } else {
          cart.push({
            name: itemName,
            price: itemPrice,
            details: itemDetails,
            quantity: 1
          });
          console.log('Added new item to cart:', itemName);
        }

        updateCartUI();
        console.log('Cart updated:', cart);

        // Обновление счетчика корзины в шапке
        if (cartCounter) {
          const currentCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
          cartCounter.textContent = currentCartCount;
          console.log('Cart counter updated:', currentCartCount);
        }

        // Анимация кнопки
        button.style.transform = 'scale(1.2)';
        setTimeout(() => button.style.transform = 'scale(1)', 200);
      });
    });
  } else {
    console.log('No add to cart buttons found.');
  }

  // Открытие модального окна бронирования
  if (bookingButton && bookingModalOverlay && bookingModal) {
    bookingButton.addEventListener('click', (e) => {
      e.preventDefault(); // Предотвращаем стандартную отправку формы
      console.log('Booking button clicked');
      // Здесь мы не отправляем основную форму, а просто открываем модальное окно.
      // Отправка произойдет из формы в модальном окне.
      bookingModalOverlay.classList.add('active');
      bookingModal.classList.add('open');
    });
  }

  // Закрытие модального окна бронирования
  if (closeModalButton && bookingModalOverlay && bookingModal) {
    closeModalButton.addEventListener('click', () => {
      console.log('Close modal button clicked');
      bookingModalOverlay.classList.remove('active');
      bookingModal.classList.remove('open');
    });
  }

  if (bookingModalOverlay && bookingModal) {
    bookingModalOverlay.addEventListener('click', (e) => {
      // Закрываем только если клик был именно по оверлею, а не по модальному окну
      if (e.target === bookingModalOverlay) {
        console.log('Booking modal overlay clicked');
        bookingModalOverlay.classList.remove('active');
        bookingModal.classList.remove('open');
      }
    });
  }

  // Отправка данных из модального окна
  if (bookingInfoForm) {
    bookingInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Предотвращаем стандартную отправку формы
      console.log('Booking info form submitted');

      const userName = userNameInput.value;
      const userPhone = userPhoneInput.value;
      const bookingDate = bookingDateInput.value; // Получаем дату из основной формы
      const bookingGuests = bookingGuestsInput.value; // Получаем гостей из основной формы

      const bookingData = {
        name: userName,
        phone: userPhone,
        date: bookingDate,
        guests: bookingGuests
      };

      console.log('Sending booking data:', bookingData);

      try {
        const response = await fetch('/api/send-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        console.log('Server response:', result);

        if (response.ok) {
          // Вместо alert() показываем кастомное окно подтверждения
          console.log('Бронь успешно отправлена, показываем окно подтверждения');
          if (confirmationModalOverlay && confirmationModal) {
            confirmationModalOverlay.classList.add('active');
            confirmationModal.classList.add('open');
          }
          // Закрыть модальное окно бронирования после успешной отправки
          if (bookingModalOverlay && bookingModal) {
            bookingModalOverlay.classList.remove('active');
            bookingModal.classList.remove('open');
          }
          // Очистить формы (опционально)
          // bookingInfoForm.reset();
          // document.querySelector('.booking-form form').reset();

        } else {
          // Пока оставим alert для ошибок сервера, можно тоже кастомизировать потом
          alert(`Ошибка при бронировании: ${result.error || 'Неизвестная ошибка'}`);
        }
      } catch (error) {
        console.error('Error sending booking data:', error);
        // Пока оставим alert для ошибок сети, можно тоже касторизировать потом
        alert('Произошла ошибка при отправке брони.');
      }
    });
  }

  // Обработчики закрытия кастомного окна подтверждения
  if (closeConfirmationButtons.length > 0 && confirmationModalOverlay && confirmationModal) {
    closeConfirmationButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log('Close confirmation button clicked');
        confirmationModalOverlay.classList.remove('active');
        confirmationModal.classList.remove('open');
      });
    });

    // Закрытие по клику на оверлей
    confirmationModalOverlay.addEventListener('click', (e) => {
      if (e.target === confirmationModalOverlay) {
        console.log('Confirmation modal overlay clicked');
        confirmationModalOverlay.classList.remove('active');
        confirmationModal.classList.remove('open');
      }
    });
  }

  // Обработчик клика для кнопки "Оформить заказ" (открывает модальное окно деталей заказа)
  if (checkoutButton && orderDetailsModalOverlay && orderDetailsModal) {
    checkoutButton.addEventListener('click', () => {
      console.log('Checkout button clicked, opening order details modal');

      if (cart.length === 0) {
        alert('Ваша корзина пуста.');
        return;
      }

      // Закрываем корзину перед открытием модального окна деталей заказа
      if (cartOverlay && cartSidebar) {
        cartOverlay.style.display = 'none';
        cartSidebar.classList.remove('open');
      }

      // Открываем модальное окно деталей заказа
      orderDetailsModalOverlay.classList.add('active');
      orderDetailsModal.classList.add('open');
    });
  }

  // Обработчики закрытия модального окна деталей заказа
  if (closeOrderDetailsButtons.length > 0 && orderDetailsModalOverlay && orderDetailsModal) {
    closeOrderDetailsButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log('Close order details modal button clicked');
        orderDetailsModalOverlay.classList.remove('active');
        orderDetailsModal.classList.remove('open');
      });
    });

    // Закрытие по клику на оверлей
    orderDetailsModalOverlay.addEventListener('click', (e) => {
      if (e.target === orderDetailsModalOverlay) {
        console.log('Order details modal overlay clicked');
        orderDetailsModalOverlay.classList.remove('active');
        orderDetailsModal.classList.remove('open');
      }
    });
  }

  // Обработчик отправки формы деталей заказа
  if (orderDetailsForm) {
    orderDetailsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Order details form submitted');

      const tableNumber = tableNumberInput.value;
      const orderComment = orderCommentInput.value;

      if (!tableNumber) {
        alert('Пожалуйста, укажите номер столика.');
        return;
      }

      const orderData = {
        items: cart,
        total: totalPriceElement.textContent, // Получаем текст итоговой цены
        table: tableNumber,
        comment: orderComment
      };

      console.log('Sending final order data:', orderData);

      try {
        const response = await fetch('/api/send-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        const result = await response.json();

        console.log('Server response for order:', result);

        if (response.ok) {
          // Очищаем корзину после успешного оформления
          cart = [];
          updateCartUI(); // Обновляем UI корзины

          // Закрываем модальное окно деталей заказа
          if (orderDetailsModalOverlay && orderDetailsModal) {
            orderDetailsModalOverlay.classList.remove('active');
            orderDetailsModal.classList.remove('open');
          }

          // Показываем кастомное окно подтверждения заказа
          if (confirmationModalOverlay && confirmationModal) {
            // Возможно, стоит изменить текст в окне подтверждения
            // confirmationModal.querySelector('p').textContent = 'Ваш заказ успешно оформлен!';

            // Изменяем текст для подтверждения заказа
            const confirmationTextElement = confirmationModal.querySelector('.confirmation-modal-body p');
            if (confirmationTextElement) {
              confirmationTextElement.textContent = 'Заказ успешно сформирован!';
            }

            confirmationModalOverlay.classList.add('active');
            confirmationModal.classList.add('open');
          }

        } else {
          alert(`Ошибка при оформлении заказа: ${result.error || 'Неизвестная ошибка'}`);
        }
      } catch (error) {
        console.error('Error sending order data:', error);
        alert('Произошла ошибка при оформлении заказа.');
      }
    });
  }

  // Обработчик для кнопки "Да, мне есть 18"
  if (confirmAgeBtn && ageVerificationOverlay && ageVerificationModal) {
    console.log('Adding event listener for confirm age button.');
    confirmAgeBtn.addEventListener('click', () => {
      console.log('Confirm age button clicked');
      localStorage.setItem('ageConfirmed', 'true'); // Сохраняем статус в localStorage
      ageVerificationOverlay.classList.remove('active'); // Скрываем оверлей
      ageVerificationModal.classList.remove('active'); // Скрываем модальное окно
      console.log('Age confirmed, modal hidden.');
    });
  } else {
    console.log('Confirm age button or modal elements not found.');
  }

  // Обработчик для кнопки "Нет"
  if (denyAgeBtn) {
    console.log('Adding event listener for deny age button.');
    denyAgeBtn.addEventListener('click', () => {
      console.log('Deny age button clicked');
      // Здесь можно перенаправить пользователя или показать сообщение
      alert('Извините, контент сайта доступен только для совершеннолетних.');
      // Пример перенаправления:
      // window.location.href = 'https://google.com'; 
    });
  } else {
    console.log('Deny age button not found.');
  }

  // Обработчик клика для оверлея подтверждения возраста
  if (ageVerificationOverlay && ageVerificationModal) {
    console.log('Adding event listener for age verification overlay.');
    ageVerificationOverlay.addEventListener('click', (e) => {
      console.log('Age verification overlay clicked. Target:', e.target);
      // Закрываем только если клик был именно по оверлею, а не по модальному окну
      if (e.target === ageVerificationOverlay) {
        console.log('Click on age verification overlay itself, closing modal.');
        ageVerificationOverlay.classList.remove('active');
        ageVerificationModal.classList.remove('active');
      } else {
        console.log('Click inside age verification modal, not closing.');
      }
    });
  } else {
    console.log('Age verification overlay or modal elements not found for overlay click handler.');
  }

  loadSportsSchedules(); // Загрузка расписания
  // Обновление данных каждые 5 минут
  // setInterval(loadSportsSchedules, 5 * 60 * 1000); // Временно закомментируем, чтобы не мешать отладке корзины

  updateCartUI(); // Обновляем корзину при загрузке (если есть сохраненные данные)
});

// Function to show the age verification modal
function showAgeVerification() {
  console.log("Showing age verification modal"); // Debug log
  ageVerificationOverlay.classList.add('active');
  ageVerificationModal.classList.add('active');
  body.style.overflow = 'hidden'; // Prevent scrolling
}

// Function to hide the age verification modal
// ... existing code ...