$(document).ready(function () {
  let discountTrigger = 'quantity';
  let codeList = [
    [8, '7%', 'D5'],
    [15, '15%', 'D10'],
  ];
  let discountProducts = [
    'Кролик по-мексикански',
    'Индейка по-французски',
    'Нутрия по-корейски',
    'Телятина по-провансальски',
    'Мясное ассорти по-русски',
    'Горбуша по-итальянски',
  ]; // продукты у которых есть скидка

  let triggerValue = 0;
  let currentDiscount = [];
  let upswing = false;
  let saveinputPC = '';
  let cartID = $('div[data-record-type="706"]')
    .attr('id')
    .replace(/[^0-9]/g, '');
  let pcLid = $('.t-input-group_pc').attr('data-input-lid');
  setTimeout(function () {
    saveinputPC = $('.t-inputpromocode__wrapper').html();
  }, 1000);

  function getDiscountInfo(trval) {
    let products = trval.products;

    let prevLine = 0;
    let minTrigger = codeList[0][0];

    let sumAmount = 0; // общая скидка
    let sumTotal = 0; // общая сумма кол-ва товаров со скидкой

    for (let i = 0; i < products.length; i++) {
      if (discountProducts.includes(products[i].name)) {
        sumTotal += products[i].quantity; // кол-во товаров
        sumAmount += products[i].price * products[i].quantity; // цена товаров
        for (let i = 0; i < codeList.length; i++) {
          if (sumTotal >= codeList[i][0] && codeList[i][0] > prevLine) {
            prevLine = codeList[i][0];
            currentDiscount[0] = codeList[i][1]; // записываем текущую скидку
            currentDiscount[1] = codeList[i][2];
            upswing = true;
          }
          if (minTrigger > codeList[i][0]) {
            minTrigger = codeList[i][0];
          }
        }
      }
    }

    if (sumTotal < minTrigger) {
      currentDiscount = [];
      clearDiscount();
      upswing = false;
      if (pcLid != undefined) {
        $('.t-input-group_pc').show();
        $('.t-inputpromocode__wrapper').html(saveinputPC);
        t_input_promocode_init(cartID, pcLid);
      }
    } else {
      currentDiscount[0] = ((parseFloat(currentDiscount[0]) / 100) * sumAmount).toFixed(0).toString();
    }

    if (currentDiscount.length) {
      $('.t-input-group_pc').hide();
      window.tcart.promocode = {};
      let totalWrap = $('.t706__cartwin-totalamount-wrap');
      if (currentDiscount[0].indexOf('%') > 0) {
        window.tcart.promocode.discountpercent = (+currentDiscount[0].replace(/[^0-9.]/g, '')).toFixed(2);
        clearTotalWrapClass();
        totalWrap.addClass('prcode_act_percent');
      } else {
        window.tcart.promocode.discountsum = currentDiscount[0];
        clearTotalWrapClass();
        totalWrap.addClass('prcode_act_summ');
      }
      window.tcart.promocode.message = 'OK';
      window.tcart.promocode.promocode = currentDiscount[1];
      tcart__updateTotalProductsinCartObj();
    }
  }

  function clearTotalWrapClass() {
    $('.t706__cartwin-totalamount-wrap').removeClass('prcode_act_percent prcode_act_summ');
  }

  function clearDiscount() {
    if (window.tcart.hasOwnProperty('promocode')) {
      delete window.tcart.promocode;
      tcart__updateTotalProductsinCartObj();
      clearTotalWrapClass();
    }
  }

  $('.t706__cartwin-prodamount').bind('DOMSubtreeModified', function () {
    getDiscountInfo(window.tcart);
  });
});
