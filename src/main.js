/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
  const discountRevenue = 1 - discount / 100;
  const revenue = sale_price * quantity * discountRevenue;
  return revenue;

  // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  // тоже самое что и profit = seller.profit
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return profit * 0;
  } else {
    return profit * 0.05;
  }

  // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некоректные данные");
  }

  // @TODO: Проверка наличия опций

  if (typeof options !== "object") {
    throw new Error("Некоректные данные");
  }
  if (!calculateBonus || !calculateRevenue) {
    throw new Error("чего-то не хватает");
  }
  if (typeof calculateRevenue !== "function") {
    throw new Error("Неопределены функции");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  // sellerStats - Массив с объектами продавцов
  const sellerStats = data.sellers.map((seller) => ({
    ...seller,
    sales_count: 0,
    revenue: 0,
    profit: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  //sellerIndex - Это объект объектов в котором ключ - это seller.id,
  // а значение - все его данные например:
  // seller_1 {id: 'seller_1', first_name: 'Alexey', last_name: 'Petrov', start_date: '2024-07-17', position: 'Senior Seller'}
  const sellerIndex = sellerStats.reduce(
    (acc, el) => ({
      ...acc,
      [el.id]: el,
    }),
    {}
  );

  // sellerIndex - Это объект объектов в котором ключ - это product.sku,
  // а значение - все его данные
  const productIndex = data.products.reduce(
    (acc, el) => ({
      ...acc,
      [el.sku]: el,
    }),
    {}
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  // цикл по всем чекам(record - любой чек)
  data.purchase_records.forEach((record) => {
    // seller - элемент объетка sellerIndex у которого
    // ключ - это record.seller_id например "seller_4" - а значение как в sellerIndex
    const seller = sellerIndex[record.seller_id]; //продавец именно этого чека
    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    // цикл по покупкам в чеке(items) el - отдельный объект в котором
    // есть sku, discound, quantity, sale_price
    record.items.forEach((el) => {
      const product = productIndex[el.sku]; //все данные о именно этом продукте в чеке
      // if (!product) {
      //     console.warn(`Товар с SKU ${el.sku} не найден!`);
      //     return;
      // }

      const cost = product.purchase_price * el.quantity; // общая закупочная стоимость
      const revenue = calculateRevenue(el);
      seller.profit += revenue - cost;

      if (!seller.products_sold[el.sku]) {
        seller.products_sold[el.sku] = 0;
      }
      seller.products_sold[el.sku] += el.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10) ;
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: `${seller.id}`,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: +Number(seller.revenue.toFixed(2)),
    profit: +Number(seller.profit.toFixed(2)),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +Number(seller.bonus.toFixed(2)),
  }));
}
