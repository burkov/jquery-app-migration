/** ****************************************************************************** */

const quantityDiscountApplicableItemNames = new Set(
  [
    'Кролик по-мексикански',
    'Индейка по-французски',
    'Нутрия по-корейски',
    'Телятина по-провансальски',
    'Мясное ассорти по-русски',
    'Горбуша по-итальянски',
  ].map((e) => e.toLowerCase().trim()),
);

const quantityDiscountLevels = [
  { quantity: 8, percent: 8 },
  { quantity: 15, percent: 15 },
];

/** ****************************************************************************** */

const isQuantityDiscountApplicable = (name) => {
  return quantityDiscountApplicableItemNames.has(name.toLowerCase().trim());
};

const numberOfQuantityDiscountApplicableItems = (products) => {
  return products.reduce((acc, { name, quantity, deleted }) => {
    if (deleted) return acc;
    if (!isQuantityDiscountApplicable(name)) return acc;
    return acc + quantity;
  }, 0);
};

const quantityDiscountPercent = (n) => {
  let result = 0;
  for (const { quantity, percent } of quantityDiscountLevels) {
    if (n >= quantity) result = percent;
  }
  return result;
};

const minusPercent = (n, p) => {
  if (p === 0) return n;
  return Math.round(n - n * (p / 100));
};

const applyQuantityDiscount = (product, percent) => {
  const { price, quantity, noDiscountPrice } = product;
  if (!noDiscountPrice) product.noDiscountPrice = price;
  product.price = minusPercent(product.noDiscountPrice, percent);
  product.amount = minusPercent(product.noDiscountPrice, percent) * quantity;
};

const currentQuantityDiscountPercent = () => {
  const n = numberOfQuantityDiscountApplicableItems(window.tcart.products);
  return quantityDiscountPercent(n);
};

const adjustPrices = () => {
  const percent = currentQuantityDiscountPercent();
  for (const product of window.tcart.products) {
    if (isQuantityDiscountApplicable(product.name)) applyQuantityDiscount(product, percent);
  }
  const total = window.tcart.products.reduce((acc, { amount, deleted }) => {
    if (deleted) return acc;
    return acc + amount;
  }, 0);

  window.tcart.prodamount = total;
  window.tcart.amount = total;
};

const monkeyPatch = () => {
  const old = {
    redrawTotal: window.tcart__reDrawTotal,
    redrawProducts: window.tcart__reDrawProducts,
    productMinus: window.tcart__product__minus,
    productPlus: window.tcart__product__plus,
    productEditQuantity: window.tcart__product__editquantity,
    productUpdateQuantity: window.tcart__product__updateQuantity,
    productDel: window.tcart__product__del,
  };

  const adjustAndRedrawTotal = () => {
    adjustPrices();
    old.redrawTotal();
  };

  const adjustAndRedrawProducts = () => {
    adjustPrices();
    old.redrawProducts();
    old.redrawTotal();
  };

  function withAdjustAndRedraw(fun) {
    return function () {
      debugger;
      const oldPercent = currentQuantityDiscountPercent();
      fun(...arguments);
      adjustPrices();
      const newPercent = currentQuantityDiscountPercent();
      if (oldPercent !== newPercent) old.redrawProducts();
      old.redrawTotal();
    };
  }

  window.tcart__reDrawTotal = adjustAndRedrawTotal;
  window.tcart__reDrawProducts = adjustAndRedrawProducts;
  window.tcart__product__minus = withAdjustAndRedraw(old.productMinus);
  window.tcart__product__plus = withAdjustAndRedraw(old.productPlus);
  window.tcart__product__editquantity = withAdjustAndRedraw(old.productEditQuantity);
  window.tcart__product__updateQuantity = withAdjustAndRedraw(old.productUpdateQuantity);
  window.tcart__product__del = withAdjustAndRedraw(old.productDel);
};

document.addEventListener('DOMContentLoaded', () => {
  // FIXME: do polling here until TCart will be initialized or find a better find to detect it's ready
  setTimeout(monkeyPatch, 1000);
});
