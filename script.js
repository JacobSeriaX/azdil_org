// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyDzQo-3Qs3jLvMY0UBnd_vq985QZ-D7vng",
  authDomain: "azdilteksnew-new-new.firebaseapp.com",
  projectId: "azdilteksnew-new-new",
  storageBucket: "azdilteksnew-new-new.firebasestorage.app",
  messagingSenderId: "1016824946574",
  appId: "1:1016824946574:web:6d57411188d062c33a0edf"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Переменные для хранения текущего редактируемого заказа
let currentOrderId = null;

// Функция для обработки отправки формы нового заказа
document.getElementById('newOrderForm').onsubmit = function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

    const orderData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        size: document.getElementById('size').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        company: document.getElementById('company').value,
        note: document.getElementById('note').value,
        deadline: document.getElementById('deadline').value, // Храним как строку даты
        status: 'waiting' // Статус по умолчанию "ожидание"
    };

    // Добавляем заказ в Realtime Database
    const newOrderRef = database.ref('orders').push();
    newOrderRef.set(orderData)
        .then(() => {
            renderOrders(); // Обновляем отображение заказов
            closeFormModal(); // Закрываем модальное окно
            document.getElementById('newOrderForm').reset(); // Очищаем форму
        })
        .catch(error => {
            console.error('Ошибка при добавлении заказа:', error);
            alert('Произошла ошибка при добавлении заказа.');
        });
};

// Функция для отображения всех заказов на странице
function renderOrders() {
    const waitingContainer = document.getElementById('waiting-orders'); // Контейнер для заказов в ожидании
    const completedContainer = document.getElementById('completed-orders'); // Контейнер для завершенных заказов
    waitingContainer.innerHTML = ''; // Очищаем контейнер перед рендерингом
    completedContainer.innerHTML = ''; // Очищаем контейнер для завершенных заказов

    // Получаем все заказы из Realtime Database
    database.ref('orders').once('value')
        .then(snapshot => {
            const orders = snapshot.val();
            if (orders) {
                Object.keys(orders).forEach(key => {
                    const order = orders[key];
                    order.id = key; // Добавляем ID заказа
                    createOrderElement(order, waitingContainer, completedContainer);
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при получении заказов:', error);
            alert('Произошла ошибка при загрузке заказов.');
        });
}

// Функция для создания элемента заказа
function createOrderElement(order, waitingContainer, completedContainer) {
    const orderDiv = document.createElement('div');
    orderDiv.classList.add('order');
    orderDiv.innerText = `${order.company} - ${order.name}`;

    // Кнопка удаления заказа
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = function(event) {
        event.stopPropagation(); // Останавливаем всплытие события
        if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
            deleteOrder(order.id);
        }
    };
    orderDiv.appendChild(deleteBtn);

    // Кнопка редактирования заказа
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.classList.add('edit-btn');
    editBtn.onclick = function(event) {
        event.stopPropagation();
        editOrder(order);
    };
    orderDiv.appendChild(editBtn);

    // Кнопка изменения статуса заказа
    const statusBtn = document.createElement('button');
    statusBtn.innerHTML = order.status === 'waiting' ? '✔️' : '↩️';
    statusBtn.classList.add('status-btn');
    statusBtn.onclick = function(event) {
        event.stopPropagation();
        toggleOrderStatus(order.id, order.status);
    };
    orderDiv.appendChild(statusBtn);

    // Расчет оставшихся дней до дедлайна
    const now = new Date();
    const deadlineDate = new Date(order.deadline);
    const timeDiff = deadlineDate - now;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Количество оставшихся дней

    // Применение классов в зависимости от оставшегося времени до дедлайна или статуса
    if (order.status === 'waiting') {
        if (daysLeft <= 5 && daysLeft > 2) {
            orderDiv.classList.add('blink-yellow'); // Мигает желтым, если осталось менее 5 дней
        } else if (daysLeft <= 2 && daysLeft > 0) {
            orderDiv.classList.add('blink-red'); // Мигает красным, если осталось менее 2 дней
        } else if (daysLeft <= 0) {
            orderDiv.classList.add('blink-maroon'); // Мигает темно-красным, если срок истек
        }
    } else if (order.status === 'completed') {
        orderDiv.classList.add('blink-green'); // Мигает зелёным, если заказ готов
    }

    // Открытие модального окна с информацией о заказе при клике на заказ
    orderDiv.onclick = function() {
        showOrderInfo(order);
    };

    // Добавление заказов в соответствующие контейнеры в зависимости от статуса
    if (order.status === 'waiting') {
        waitingContainer.appendChild(orderDiv);
    } else if (order.status === 'completed') {
        completedContainer.appendChild(orderDiv);
    }
}

// Функция для отображения информации о заказе в модальном окне
function showOrderInfo(order) {
    const modal = document.getElementById('orderInfoModal');
    modal.style.display = 'flex'; // Изменено на 'flex' для центрирования

    document.getElementById('orderInfoName').innerText = order.name;
    document.getElementById('orderInfoPhone').innerText = order.phone;
    document.getElementById('orderInfoSize').innerText = order.size;
    document.getElementById('orderInfoQuantity').innerText = order.quantity;
    document.getElementById('orderInfoCompany').innerText = order.company;
    document.getElementById('orderInfoNote').innerText = order.note;
    document.getElementById('orderInfoDeadline').innerText = new Date(order.deadline).toLocaleDateString();

    // Сохраняем текущий заказ для редактирования
    currentOrderId = order.id;
}

// Функция для закрытия модального окна информации о заказе
function closeOrderInfoModal() {
    document.getElementById('orderInfoModal').style.display = 'none';
}

// Функция для удаления заказа по его идентификатору
function deleteOrder(id) {
    database.ref(`orders/${id}`).remove()
        .then(() => {
            alert('Заказ успешно удалён.');
        })
        .catch(error => {
            console.error('Ошибка при удалении заказа:', error);
            alert('Произошла ошибка при удалении заказа.');
        });
}

// Функция для закрытия модального окна оформления заказа
function closeFormModal() {
    document.getElementById('formModal').style.display = 'none';
}

// Функция для открытия модального окна оформления заказа
function openOrderForm() {
    document.getElementById('formModal').style.display = 'flex'; // Изменено на 'flex' для центрирования
}

// Функция для редактирования заказа
function editOrder(order) {
    const modal = document.getElementById('editOrderModal');
    modal.style.display = 'flex';

    // Заполняем форму текущими данными заказа
    document.getElementById('editName').value = order.name;
    document.getElementById('editPhone').value = order.phone;
    document.getElementById('editSize').value = order.size;
    document.getElementById('editQuantity').value = order.quantity;
    document.getElementById('editCompany').value = order.company;
    document.getElementById('editDeadline').value = order.deadline; // Храним как строку
    document.getElementById('editNote').value = order.note;

    // Сохраняем текущий заказ для редактирования
    currentOrderId = order.id;
}

// Обработчик отправки формы редактирования
document.getElementById('editOrderForm').onsubmit = function(event) {
    event.preventDefault();

    // Находим заказ по ID
    const orderRef = database.ref(`orders/${currentOrderId}`);
    const updatedOrder = {
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value,
        size: document.getElementById('editSize').value,
        quantity: parseInt(document.getElementById('editQuantity').value, 10),
        company: document.getElementById('editCompany').value,
        deadline: document.getElementById('editDeadline').value, // Храним как строку даты
        note: document.getElementById('editNote').value
        // Статус остаётся без изменений
    };

    // Обновляем данные заказа в Realtime Database
    orderRef.update(updatedOrder)
        .then(() => {
            alert('Заказ успешно обновлён.');
            closeEditOrderModal();
            closeOrderInfoModal();
        })
        .catch(error => {
            console.error('Ошибка при обновлении заказа:', error);
            alert('Произошла ошибка при обновлении заказа.');
        });
};

// Функция для закрытия модального окна редактирования заказа
function closeEditOrderModal() {
    document.getElementById('editOrderModal').style.display = 'none';
}

// Функция для открытия модального окна редактирования из информации о заказе
function openEditOrderForm() {
    closeOrderInfoModal();
    const order = { id: currentOrderId };
    database.ref(`orders/${currentOrderId}`).once('value')
        .then(snapshot => {
            const orderData = snapshot.val();
            if (orderData) {
                order.name = orderData.name;
                order.phone = orderData.phone;
                order.size = orderData.size;
                order.quantity = orderData.quantity;
                order.company = orderData.company;
                order.deadline = orderData.deadline;
                order.note = orderData.note;
                editOrder(order);
            } else {
                alert('Заказ не найден.');
            }
        })
        .catch(error => {
            console.error('Ошибка при получении заказа для редактирования:', error);
            alert('Произошла ошибка при получении заказа.');
        });
}

// Функция для изменения статуса заказа
function toggleOrderStatus(id, currentStatus) {
    const newStatus = currentStatus === 'waiting' ? 'completed' : 'waiting';
    const statusRef = database.ref(`orders/${id}/status`);
    statusRef.set(newStatus)
        .then(() => {
            alert(`Статус заказа изменён на "${newStatus === 'waiting' ? 'В ожидании' : 'Готово'}".`);
        })
        .catch(error => {
            console.error('Ошибка при изменении статуса заказа:', error);
            alert('Произошла ошибка при изменении статуса заказа.');
        });
}

// Функции для поиска заказов по тексту в поле поиска
function searchOrders() {
    const query = document.getElementById('searchInput').value.toLowerCase(); // Получаем поисковый запрос
    const orderElements = document.querySelectorAll('.order'); // Находим все заказы

    orderElements.forEach(orderElement => {
        // Проверяем наличие текста из поискового запроса в каждом заказе
        if (orderElement.innerText.toLowerCase().includes(query)) {
            orderElement.style.display = 'block'; // Показываем заказы, которые совпадают с запросом
        } else {
            orderElement.style.display = 'none'; // Скрываем неподходящие заказы
        }
    });
}

// Функция для фильтрации заказов по статусу
function filterOrders() {
    const filter = document.getElementById('filterStatus').value; // Получаем выбранный фильтр
    const orderElements = document.querySelectorAll('.order'); // Находим все заказы

    orderElements.forEach(orderElement => {
        // Получаем статус заказа из его классов
        const isBlinkGreen = orderElement.classList.contains('blink-green');
        const isBlinkWaiting = orderElement.classList.contains('blink-yellow') || 
                                orderElement.classList.contains('blink-red') || 
                                orderElement.classList.contains('blink-maroon');

        let status = 'completed';
        if (isBlinkWaiting) {
            status = 'waiting';
        }

        // Применяем фильтры к заказам
        if (filter === 'all') {
            orderElement.style.display = 'block'; // Показываем все заказы
        } else if (filter === 'waiting' && status === 'waiting') {
            orderElement.style.display = 'block'; // Показываем только заказы в ожидании
        } else if (filter === 'completed' && status === 'completed') {
            orderElement.style.display = 'block'; // Показываем только завершенные заказы
        } else {
            orderElement.style.display = 'none'; // Скрываем неподходящие заказы
        }
    });
}

// Функция для сортировки заказов по дате дедлайна
function sortOrders() {
    const sort = document.getElementById('sortOrders').value; // Получаем выбранную сортировку
    const waitingContainer = document.getElementById('waiting-orders');
    const completedContainer = document.getElementById('completed-orders');

    waitingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    // Получаем все заказы из Realtime Database
    database.ref('orders').once('value')
        .then(snapshot => {
            const orders = snapshot.val();
            if (orders) {
                let ordersArray = Object.keys(orders).map(key => {
                    const order = orders[key];
                    order.id = key;
                    return order;
                });

                // Сортировка по дате
                ordersArray.sort((a, b) => {
                    const dateA = new Date(a.deadline);
                    const dateB = new Date(b.deadline);
                    if (sort === 'dateAsc') {
                        return dateA - dateB;
                    } else {
                        return dateB - dateA;
                    }
                });

                ordersArray.forEach(order => {
                    createOrderElement(order, waitingContainer, completedContainer);
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при сортировке заказов:', error);
            alert('Произошла ошибка при сортировке заказов.');
        });
}

// Слушатель для реального обновления заказов
database.ref('orders').on('value', snapshot => {
    const waitingContainer = document.getElementById('waiting-orders');
    const completedContainer = document.getElementById('completed-orders');
    waitingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    const orders = snapshot.val();
    if (orders) {
        Object.keys(orders).forEach(key => {
            const order = orders[key];
            order.id = key; // Добавляем ID заказа
            createOrderElement(order, waitingContainer, completedContainer);
        });
    }
});
