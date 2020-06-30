import IncomeMessageType from '../const-income-message-type.js';
import ServerVersion from '../const-server-version.js';



class OrderDecoder {
  constructor(version, serverVersion, fields) {
    this.version = version;
    this.serverVersion = serverVersion;
    this.fields = fields;

    this.order = {};
    this.orderState = {};
    this.contract = {};
  }



  _shift() {
    return this.fields.shift();
  }



  _shiftInt() {
    return parseInt(this.fields.shift());
  }



  _shiftFloat() {
    return parseFloat(this.fields.shift());
  }



  _shiftBool() {
    return this.fields.shift() == '1';
  }



  decodeOrderId() {
    this.order.orderId = this._shiftInt();
  }



  decodeContractFields() {
    this.contract.conId = this._shiftInt();
    this.contract.symbol = this._shift();
    this.contract.secType = this._shift();
    this.contract.lastTradeDateOrContractMonth = this._shift();
    this.contract.strike = this._shiftFloat();
    this.contract.right = this._shift();

    if (this.version >= 32) {
      this.contract.multiplier = this._shift();
    }

    this.contract.exchange = this._shift();
    this.contract.currency = this._shift();
    this.contract.localSymbol = this._shift();

    if (this.version >= 32) {
      this.contract.tradingClass = this._shift();
    }
  }



  decodeAction() {
    this.order.action = this._shift();
  }



  decodeTotalQuantity() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_FRACTIONAL_POSITIONS) {
      this.order.totalQuantity = this._shiftFloat();
    } else {
      this.order.totalQuantity = this._shiftInt();
    }
}



  decodeOrderType() {
    this.order.orderType = this._shift();
  }



  decodeLmtPrice() {
    if (this.version < 29) {
      this.order.lmtPrice = this._shiftFloat();
    } else {
      this.order.lmtPrice = this._shiftFloat();
    }
  }



  decodeAuxPrice() {
    if (this.version < 30) {
      this.order.auxPrice = this._shiftFloat();
    } else {
      this.order.auxPrice = this._shiftFloat();
    }
  }



  decodeTIF() {
    this.order.tif = this._shift();
  }



  decodeOcaGroup() {
    this.order.ocaGroup = this._shift();
  }



  decodeAccount() {
    this.order.account = this._shift();
  }



  decodeOpenClose() {
    this.order.openClose = this._shift();
  }



  decodeOrigin() {
    this.order.origin = this._shiftInt();
  }



  decodeOrderRef() {
    this.order.orderRef = this._shift();
  }



  decodeClientId() {
    this.order.clientId = this._shiftInt();
  }



  decodePermId() {
    this.order.permId = this._shiftInt();
  }



  decodeOutsideRth() {
    this.order.outsideRth = this._shiftBool();
  }



  decodeHidden() {
    this.order.hidden = this._shiftBool();
  }



  decodeDiscretionaryAmt() {
    this.order.discretionaryAmt = this._shiftFloat();
  }



  decodeGoodAfterTime() {
    this.order.goodAfterTime = this._shift();
  }



  skipSharesAllocation() {
    let _sharesAllocation = this._shift();   // deprecated
  }



  decodeFAParams() {
    this.order.faGroup = this._shift();
    this.order.faMethod = this._shift();
    this.order.faPercentage = this._shift();
    this.order.faProfile = this._shift();
  }



  decodeModelCode() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
      this.order.modelCode = this._shift();
    }
  }



  decodeGoodTillDate() {
    this.order.goodTillDate = this._shift();
  }



  decodeRule80A() {
    this.order.rule80A = this._shift();
  }



  decodePercentOffset() {
    this.order.percentOffset = this._shiftFloat();
  }



  decodeSettlingFirm() {
    this.order.settlingFirm = this._shift();
  }



  decodeShortSaleParams() {
    this.order.shortSaleSlot = this._shiftInt();
    this.order.designatedLocation = this._shift();
    if (this.serverVersion == ServerVersion.MIN_SERVER_VER_SSHORTX_OLD) {
      this._shiftInt();
    } else if (this.version >= 23) {
      this.order.exemptCode = this._shiftInt();
    }
}



  decodeAuctionStrategy() {
    this.order.auctionStrategy = this._shiftInt();
  }



  decodeBoxOrderParams() {
    this.order.startingPrice = this._shiftFloat();
    this.order.stockRefPrice = this._shiftFloat();
    this.order.delta = this._shiftFloat();
  }



  decodePegToStkOrVolOrderParams() {
    this.order.stockRangeLower = this._shiftFloat();
    this.order.stockRangeUpper = this._shiftFloat();
  }



  decodeDisplaySize() {
    this.order.displaySize = this._shiftInt();
  }



  decodeBlockOrder() {
    this.order.blockOrder = this._shiftBool();
  }



  decodeSweepToFill() {
    this.order.sweepToFill = this._shiftBool();
  }



  decodeAllOrNone() {
    this.order.allOrNone = this._shiftBool();
  }



  decodeMinQty() {
    this.order.minQty = this._shiftInt();
  }



  decodeOcaType() {
    this.order.ocaType = this._shiftInt();
  }



  decodeETradeOnly() {
    this.order.eTradeOnly = this._shiftBool();
  }



  decodeFirmQuoteOnly() {
    this.order.firmQuoteOnly = this._shiftBool();
  }



  decodeNbboPriceCap() {
    this.order.nbboPriceCap = this._shiftFloat();
  }



  decodeParentId() {
    this.order.parentId = this._shiftInt();
  }



  decodeTriggerMethod() {
    this.order.triggerMethod = this._shiftInt();
  }


  decodeVolOrderParams(readOpenOrderAttribs) {
    this.order.volatility = this._shiftFloat();
    this.order.volatilityType = this._shiftInt();
    this.order.deltaNeutralOrderType = this._shift();
    this.order.deltaNeutralAuxPrice = this._shiftFloat();

    if (this.version >= 27 && this.order.deltaNeutralOrderType) {
      this.order.deltaNeutralConId = this._shiftInt();

      if (readOpenOrderAttribs) {
        this.order.deltaNeutralSettlingFirm = this._shift();
        this.order.deltaNeutralClearingAccount = this._shift();
        this.order.deltaNeutralClearingIntent = this._shift();
      }
    }

    if (this.version >= 31 && this.order.deltaNeutralOrderType) {
      if (readOpenOrderAttribs) {
        this.order.deltaNeutralOpenClose = this._shift();
        this.order.deltaNeutralShortSale = this._shiftBool();
        this.order.deltaNeutralShortSaleSlot = this._shiftInt();
        this.order.deltaNeutralDesignatedLocation = this._shift();
      }
    }

    this.order.continuousUpdate = this._shiftBool();
    this.order.referencePriceType = this._shiftInt();
  }



  decodeTrailParams() {
    this.order.trailStopPrice = this._shiftFloat();
    if (this.version >= 30) {
      this.order.trailingPercent = this._shiftFloat();
    }
  }



  decodeBasisPoints() {
    this.order.basisPoints = this._shiftFloat();
    this.order.basisPointsType = this._shiftInt();
  }



  decodeComboLegs() {
    this.contract.comboLegsDescrip = this._shift();

    if (this.version >= 29) {
      let comboLegsCount = this._shiftInt();

      if (comboLegsCount > 0) {
        this.contract.comboLegs = [];

        for (let n = 0; n < comboLegsCount; n++) {
            comboLeg = {};
            comboLeg.conId = this._shiftInt();
            comboLeg.ratio = this._shiftInt();
            comboLeg.action = this._shift();
            comboLeg.exchange = this._shift();
            comboLeg.openClose = this._shiftInt();
            comboLeg.shortSaleSlot = this._shiftInt();
            comboLeg.designatedLocation = this._shift();
            comboLeg.exemptCode = this._shiftInt();
            this.contract.comboLegs.push(comboLeg);
          }

        let orderComboLegsCount = this._shiftInt();
        if (orderComboLegsCount > 0) {
          this.order.orderComboLegs = [];
          for (let n = 0; n < orderComboLegsCount; n++) {
            orderComboLeg = {};
            orderComboLeg.price = this._shiftFloat();
            this.order.orderComboLegs.push(orderComboLeg);
          }
        }
      }
    }
  }



  decodeSmartComboRoutingParams() {
    if (this.version >= 26) {
      smartComboRoutingParamsCount = this._shiftInt();
      if (smartComboRoutingParamsCount > 0) {
        this.order.smartComboRoutingParams = [];
        for (let n = 0; n < smartComboRoutingParamsCount; n++) {
          tagValue = {};
          tagValue.tag = this._shift();
          tagValue.value = this._shift();
          this.order.smartComboRoutingParams.push(tagValue);
        }
      }
    }
  }



  decodeScaleOrderParams() {
    if (this.version >= 20) {
      this.order.scaleInitLevelSize = this._shiftInt();
      this.order.scaleSubsLevelSize = this._shiftInt();
    } else {
      this.order.notSuppScaleNumComponents = this._shiftInt();
      this.order.scaleInitLevelSize = this._shiftInt();
    }

    this.order.scalePriceIncrement = this._shiftFloat();

    if (this.version >= 28 && this.order.scalePriceIncrement != null &&
        this.order.scalePriceIncrement > 0.0) {
      this.order.scalePriceAdjustValue = this._shiftFloat();
      this.order.scalePriceAdjustInterval = this._shiftInt();
      this.order.scaleProfitOffset = this._shiftFloat();
      this.order.scaleAutoReset = this._shiftBool();
      this.order.scaleInitPosition = this._shiftInt();
      this.order.scaleInitFillQty = this._shiftInt();
      this.order.scaleRandomPercent = this._shiftBool();
    }
  }



  decodeHedgeParams() {
    if (this.version >= 24) {
      this.order.hedgeType = this._shift();
      if (this.order.hedgeType) {
        this.order.hedgeParam = this._shift();
      }
    }
  }



  decodeOptOutSmartRouting() {
    if (this.version >= 25) {
      this.order.optOutSmartRouting = this._shiftBool();
    }
  }



  decodeClearingParams() {
    this.order.clearingAccount = this._shift();
    this.order.clearingIntent = this._shift();
  }



  decodeNotHeld() {
    if (this.version >= 22) {
      this.order.notHeld = this._shiftBool();
    }
  }



  decodeDeltaNeutral() {
    if (this.version >= 20) {
      deltaNeutralContractPresent = this._shiftBool();
      if (deltaNeutralContractPresent) {
        this.contract.deltaNeutralContract = DeltaNeutralContract()
        this.contract.deltaNeutralContract.conId = this._shiftInt();
        this.contract.deltaNeutralContract.delta = this._shiftFloat();
        this.contract.deltaNeutralContract.price = this._shiftFloat();
      }
    }
  }



  decodeAlgoParams() {
    if (this.version >= 21) {
      this.order.algoStrategy = this._shift();
      if (this.order.algoStrategy) {
        algoParamsCount = this._shiftInt();
        if (algoParamsCount > 0) {
          this.order.algoParams = []
          for (let n = 0; n < algoParamsCount; n++) {
            let tagValue = {};
            tagValue.tag = this._shift();
            tagValue.value = this._shift();
            this.order.algoParams.push(tagValue);
          }
        }
      }
    }
  }



  decodeSolicited() {
    if (this.version >= 33) {
      this.order.solicited = this._shiftBool();
    }
  }



  decodeOrderStatus() {
    this.orderState.status = this._shift();
  }



  decodeWhatIfInfoAndCommission() {
    this.order.whatIf = this._shiftBool();
    this.decodeOrderStatus();

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_WHAT_IF_EXT_FIELDS) {
      this.orderState.initMarginBefore = this._shift();
      this.orderState.maintMarginBefore = this._shift();
      this.orderState.equityWithLoanBefore = this._shift();
      this.orderState.initMarginChange = this._shift();
      this.orderState.maintMarginChange = this._shift();
      this.orderState.equityWithLoanChange = this._shift();
    }

    this.orderState.initMarginAfter = this._shift();
    this.orderState.maintMarginAfter = this._shift();
    this.orderState.equityWithLoanAfter = this._shift();

    this.orderState.commission = this._shiftFloat();
    this.orderState.minCommission = this._shiftFloat();
    this.orderState.maxCommission = this._shiftFloat();
    this.orderState.commissionCurrency = this._shift();
    this.orderState.warningText = this._shift();
  }



  decodeVolRandomizeFlags() {
    if (this.version >= 34) {
      this.order.randomizeSize = this._shiftBool();
      this.order.randomizePrice = this._shiftBool();
    }
  }



  decodePegToBenchParams() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      if (this.order.orderType == "PEG BENCH") {
        this.order.referenceContractId = this._shiftInt();
        this.order.isPeggedChangeAmountDecrease = this._shiftBool();
        this.order.peggedChangeAmount = this._shiftFloat();
        this.order.referenceChangeAmount = this._shiftFloat();
        this.order.referenceExchangeId = this._shift();
      }
    }
  }



  decodeConditions() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      let conditionsSize = this._shiftInt();
      if (conditionsSize > 0) {
        this.order.conditions = [];
        for (let n = 0; n < conditionsSize; n++) {
          conditionType = this._shiftInt();
          condition = order_condition.Create(conditionType)
          condition.decode(fields)
          this.order.conditions.push(condition);
        }
      }

      this.order.conditionsIgnoreRth = this._shiftBool();
      this.order.conditionsCancelOrder = this._shiftBool();
    }
  }



  decodeAdjustedOrderParams() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      this.order.adjustedOrderType = this._shift();
      this.order.triggerPrice = this._shiftFloat();
      this.decodeStopPriceAndLmtPriceOffset();
      this.order.adjustedStopPrice = this._shiftFloat();
      this.order.adjustedStopLimitPrice = this._shiftFloat();
      this.order.adjustedTrailingAmount = this._shiftFloat();
      this.order.adjustableTrailingUnit = this._shiftInt();
    }
  }



  decodeStopPriceAndLmtPriceOffset() {
    this.order.trailStopPrice = this._shiftFloat();
    this.order.lmtPriceOffset = this._shiftFloat();
  }



  decodeSoftDollarTier() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_SOFT_DOLLAR_TIER) {
      let name = this._shift();
      let value = this._shift();
      let displayName = this._shift();
      this.order.softDollarTier = {
        name: name,
        value: value,
        displayName: displayName
      };
    }
  }



  decodeCashQty() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_CASH_QTY) {
      this.order.cashQty = this._shiftFloat();
    }
  }



  decodeDontUseAutoPriceForHedge() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_AUTO_PRICE_FOR_HEDGE) {
      this.order.dontUseAutoPriceForHedge = this._shiftBool();
    }
  }



  decodeIsOmsContainers() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
      this.order.isOmsContainer = this._shiftBool();
    }
  }



  decodeDiscretionaryUpToLimitPrice() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_D_PEG_ORDERS) {
      this.order.discretionaryUpToLimitPrice = this._shiftBool();
    }
  }



  decodeAutoCancelDate() {
    this.order.autoCancelDate = this._shift();
  }



  decodeFilledQuantity() {
    this.order.filledQuantity = this._shiftFloat();
  }



  decodeRefFuturesConId() {
    this.order.refFuturesConId = this._shiftInt();
  }



  decodeAutoCancelParent() {
    this.order.autoCancelParent = this._shiftBool();
  }



  decodeShareholder() {
    this.order.shareholder = this._shift();
  }



  decodeImbalanceOnly() {
    this.order.imbalanceOnly = this._shiftBool();
  }



  decodeRouteMarketableToBbo() {
    this.order.routeMarketableToBbo = this._shiftBool();
  }



  decodeParentPermId() {
    this.order.parentPermId = this._shiftInt();
  }



  decodeCompletedTime() {
    this.orderState.completedTime = this._shift();
  }



  decodeCompletedStatus() {
    this.orderState.completedStatus = this._shift();
  }



  decodeUsePriceMgmtAlgo() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PRICE_MGMT_ALGO) {
      this.order.usePriceMgmtAlgo = this._shiftBool();
    }
  }
}



export function handler_OPEN_ORDER(fields) {
  fields.shift();
  fields.shift();

  let version = null;
  if (this.serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
    version = parseInt(fields.shift());
  }

  let d = new OrderDecoder(version, this.serverVersion, fields);
  d.decodeOrderId();   // read orderId
  d.decodeContractFields();   // read contract fields

  // read order fields
  d.decodeAction();
  d.decodeTotalQuantity();
  d.decodeOrderType();
  d.decodeLmtPrice();
  d.decodeAuxPrice();
  d.decodeTIF();
  d.decodeOcaGroup();
  d.decodeAccount();
  d.decodeOpenClose();
  d.decodeOrigin();
  d.decodeOrderRef();
  d.decodeClientId();
  d.decodePermId();
  d.decodeOutsideRth();
  d.decodeHidden();
  d.decodeDiscretionaryAmt();
  d.decodeGoodAfterTime();
  d.skipSharesAllocation();
  d.decodeFAParams();
  d.decodeModelCode();
  d.decodeGoodTillDate();
  d.decodeRule80A();
  d.decodePercentOffset();
  d.decodeSettlingFirm();
  d.decodeShortSaleParams();
  d.decodeAuctionStrategy();
  d.decodeBoxOrderParams();
  d.decodePegToStkOrVolOrderParams();
  d.decodeDisplaySize();
  d.decodeBlockOrder();
  d.decodeSweepToFill();
  d.decodeAllOrNone();
  d.decodeMinQty();
  d.decodeOcaType();
  d.decodeETradeOnly();
  d.decodeFirmQuoteOnly();
  d.decodeNbboPriceCap();
  d.decodeParentId();
  d.decodeTriggerMethod();
  d.decodeVolOrderParams(true);
  d.decodeTrailParams();
  d.decodeBasisPoints();
  d.decodeComboLegs();
  d.decodeSmartComboRoutingParams();
  d.decodeScaleOrderParams();
  d.decodeHedgeParams();
  d.decodeOptOutSmartRouting();
  d.decodeClearingParams();
  d.decodeNotHeld();
  d.decodeDeltaNeutral();
  d.decodeAlgoParams();
  d.decodeSolicited();
  d.decodeWhatIfInfoAndCommission();
  d.decodeVolRandomizeFlags();
  d.decodePegToBenchParams();
  d.decodeConditions();
  d.decodeAdjustedOrderParams();
  d.decodeSoftDollarTier();
  d.decodeCashQty();
  d.decodeDontUseAutoPriceForHedge();
  d.decodeIsOmsContainers();
  d.decodeDiscretionaryUpToLimitPrice();
  d.decodeUsePriceMgmtAlgo();

  let storage = this.messageTypeStorageArray(IncomeMessageType.OPEN_ORDER_END);
  storage.push({
    contract: d.contract,
    order: d.order,
    orderState: d.orderState
  });
}



export function handler_COMPLETED_ORDER(fields) {
  fields.shift();
  fields.shift();

  d = new OrderDecoder(10000, this.serverVersion, fields);

  // read contract fields
  d.decodeContractFields();

  // read order fields
  d.decodeAction();
  d.decodeTotalQuantity();
  d.decodeOrderType();
  d.decodeLmtPrice();
  d.decodeAuxPrice();
  d.decodeTIF();
  d.decodeOcaGroup();
  d.decodeAccount();
  d.decodeOpenClose();
  d.decodeOrigin();
  d.decodeOrderRef();
  d.decodePermId();
  d.decodeOutsideRth();
  d.decodeHidden();
  d.decodeDiscretionaryAmt();
  d.decodeGoodAfterTime();
  d.decodeFAParams();
  d.decodeModelCode();
  d.decodeGoodTillDate();
  d.decodeRule80A();
  d.decodePercentOffset();
  d.decodeSettlingFirm();
  d.decodeShortSaleParams();
  d.decodeBoxOrderParams();
  d.decodePegToStkOrVolOrderParams();
  d.decodeDisplaySize();
  d.decodeSweepToFill();
  d.decodeAllOrNone();
  d.decodeMinQty();
  d.decodeOcaType();
  d.decodeTriggerMethod();
  d.decodeVolOrderParams(false);
  d.decodeTrailParams();
  d.decodeComboLegs();
  d.decodeSmartComboRoutingParams();
  d.decodeScaleOrderParams();
  d.decodeHedgeParams();
  d.decodeClearingParams();
  d.decodeNotHeld();
  d.decodeDeltaNeutral();
  d.decodeAlgoParams();
  d.decodeSolicited();
  d.decodeOrderStatus();
  d.decodeVolRandomizeFlags();
  d.decodePegToBenchParams();
  d.decodeConditions();
  d.decodeStopPriceAndLmtPriceOffset();
  d.decodeCashQty();
  d.decodeDontUseAutoPriceForHedge();
  d.decodeIsOmsContainers();
  d.decodeAutoCancelDate();
  d.decodeFilledQuantity();
  d.decodeRefFuturesConId();
  d.decodeAutoCancelParent();
  d.decodeShareholder();
  d.decodeImbalanceOnly();
  d.decodeRouteMarketableToBbo();
  d.decodeParentPermId();
  d.decodeCompletedTime();
  d.decodeCompletedStatus();

  let storage = this.messageTypeStorageArray(IncomeMessageType.COMPLETED_ORDERS_END);
  storage.push({
    contract: d.contract,
    order: d.order,
    orderState: d.orderState
  });
}
