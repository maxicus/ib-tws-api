import ServerVersion from '../constants/server-version';

export class OrderDecoder {

  public contract: any;
  public order: any;
  public orderState: any;

  constructor(private version: number, private serverVersion: number, private fields: any[]) {
    this.order = {};
    this.orderState = {};
    this.contract = {};
  }

  private shift() {
    return this.fields.shift();
  }

  private shiftInt() {
    return parseInt(this.fields.shift() as string);
  }

  private shiftFloat() {
    return parseFloat(this.fields.shift() as string);
  }

  private shiftBool() {
    return this.fields.shift() === '1';
  }

  decodeOrderId() {
    this.order.orderId = this.shiftInt();
  }

  decodeContractFields() {
    this.contract.conId = this.shiftInt();
    this.contract.symbol = this.shift();
    this.contract.secType = this.shift();
    this.contract.lastTradeDateOrContractMonth = this.shift();
    this.contract.strike = this.shiftFloat();
    this.contract.right = this.shift();

    if (this.version >= 32) {
      this.contract.multiplier = this.shift();
    }

    this.contract.exchange = this.shift();
    this.contract.currency = this.shift();
    this.contract.localSymbol = this.shift();

    if (this.version >= 32) {
      this.contract.tradingClass = this.shift();
    }
  }

  decodeAction() {
    this.order.action = this.shift();
  }

  decodeTotalQuantity() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_FRACTIONAL_POSITIONS) {
      this.order.totalQuantity = this.shiftFloat();
    } else {
      this.order.totalQuantity = this.shiftInt();
    }
}

  decodeOrderType() {
    this.order.orderType = this.shift();
  }

  decodeLmtPrice() {
    if (this.version < 29) {
      this.order.lmtPrice = this.shiftFloat();
    } else {
      this.order.lmtPrice = this.shiftFloat();
    }
  }

  decodeAuxPrice() {
    if (this.version < 30) {
      this.order.auxPrice = this.shiftFloat();
    } else {
      this.order.auxPrice = this.shiftFloat();
    }
  }

  decodeTIF() {
    this.order.tif = this.shift();
  }

  decodeOcaGroup() {
    this.order.ocaGroup = this.shift();
  }

  decodeAccount() {
    this.order.account = this.shift();
  }

  decodeOpenClose() {
    this.order.openClose = this.shift();
  }

  decodeOrigin() {
    this.order.origin = this.shiftInt();
  }

  decodeOrderRef() {
    this.order.orderRef = this.shift();
  }

  decodeClientId() {
    this.order.clientId = this.shiftInt();
  }

  decodePermId() {
    this.order.permId = this.shiftInt();
  }

  decodeOutsideRth() {
    this.order.outsideRth = this.shiftBool();
  }

  decodeHidden() {
    this.order.hidden = this.shiftBool();
  }

  decodeDiscretionaryAmt() {
    this.order.discretionaryAmt = this.shiftFloat();
  }

  decodeGoodAfterTime() {
    this.order.goodAfterTime = this.shift();
  }

  /** @deprecated */
  skipSharesAllocation() {
    this.shift();
  }

  decodeFAParams() {
    this.order.faGroup = this.shift();
    this.order.faMethod = this.shift();
    this.order.faPercentage = this.shift();
    this.order.faProfile = this.shift();
  }

  decodeModelCode() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
      this.order.modelCode = this.shift();
    }
  }

  decodeGoodTillDate() {
    this.order.goodTillDate = this.shift();
  }

  decodeRule80A() {
    this.order.rule80A = this.shift();
  }

  decodePercentOffset() {
    this.order.percentOffset = this.shiftFloat();
  }

  decodeSettlingFirm() {
    this.order.settlingFirm = this.shift();
  }

  decodeShortSaleParams() {
    this.order.shortSaleSlot = this.shiftInt();
    this.order.designatedLocation = this.shift();
    if (this.serverVersion === ServerVersion.MIN_SERVER_VER_SSHORTX_OLD) {
      this.shiftInt();
    } else if (this.version >= 23) {
      this.order.exemptCode = this.shiftInt();
    }
  }

  decodeAuctionStrategy() {
    this.order.auctionStrategy = this.shiftInt();
  }

  decodeBoxOrderParams() {
    this.order.startingPrice = this.shiftFloat();
    this.order.stockRefPrice = this.shiftFloat();
    this.order.delta = this.shiftFloat();
  }

  decodePegToStkOrVolOrderParams() {
    this.order.stockRangeLower = this.shiftFloat();
    this.order.stockRangeUpper = this.shiftFloat();
  }

  decodeDisplaySize() {
    this.order.displaySize = this.shiftInt();
  }

  decodeBlockOrder() {
    this.order.blockOrder = this.shiftBool();
  }

  decodeSweepToFill() {
    this.order.sweepToFill = this.shiftBool();
  }

  decodeAllOrNone() {
    this.order.allOrNone = this.shiftBool();
  }

  decodeMinQty() {
    this.order.minQty = this.shiftInt();
  }

  decodeOcaType() {
    this.order.ocaType = this.shiftInt();
  }

  decodeETradeOnly() {
    this.order.eTradeOnly = this.shiftBool();
  }

  decodeFirmQuoteOnly() {
    this.order.firmQuoteOnly = this.shiftBool();
  }

  decodeNbboPriceCap() {
    this.order.nbboPriceCap = this.shiftFloat();
  }

  decodeParentId() {
    this.order.parentId = this.shiftInt();
  }

  decodeTriggerMethod() {
    this.order.triggerMethod = this.shiftInt();
  }

  decodeVolOrderParams(readOpenOrderAttribs: boolean) {
    this.order.volatility = this.shiftFloat();
    this.order.volatilityType = this.shiftInt();
    this.order.deltaNeutralOrderType = this.shift();
    this.order.deltaNeutralAuxPrice = this.shiftFloat();

    if (this.version >= 27 && this.order.deltaNeutralOrderType) {
      this.order.deltaNeutralConId = this.shiftInt();

      if (readOpenOrderAttribs) {
        this.order.deltaNeutralSettlingFirm = this.shift();
        this.order.deltaNeutralClearingAccount = this.shift();
        this.order.deltaNeutralClearingIntent = this.shift();
      }
    }

    if (this.version >= 31 && this.order.deltaNeutralOrderType) {
      if (readOpenOrderAttribs) {
        this.order.deltaNeutralOpenClose = this.shift();
        this.order.deltaNeutralShortSale = this.shiftBool();
        this.order.deltaNeutralShortSaleSlot = this.shiftInt();
        this.order.deltaNeutralDesignatedLocation = this.shift();
      }
    }

    this.order.continuousUpdate = this.shiftBool();
    this.order.referencePriceType = this.shiftInt();
  }

  decodeTrailParams() {
    this.order.trailStopPrice = this.shiftFloat();
    if (this.version >= 30) {
      this.order.trailingPercent = this.shiftFloat();
    }
  }

  decodeBasisPoints() {
    this.order.basisPoints = this.shiftFloat();
    this.order.basisPointsType = this.shiftInt();
  }

  decodeComboLegs() {
    this.contract.comboLegsDescrip = this.shift();

    if (this.version >= 29) {
      const comboLegsCount = this.shiftInt();

      if (comboLegsCount > 0) {
        this.contract.comboLegs = [];

        for (let n = 0; n < comboLegsCount; n++) {
            const comboLeg: any = {};
            comboLeg.conId = this.shiftInt();
            comboLeg.ratio = this.shiftInt();
            comboLeg.action = this.shift();
            comboLeg.exchange = this.shift();
            comboLeg.openClose = this.shiftInt();
            comboLeg.shortSaleSlot = this.shiftInt();
            comboLeg.designatedLocation = this.shift();
            comboLeg.exemptCode = this.shiftInt();
            this.contract.comboLegs.push(comboLeg);
          }

        const orderComboLegsCount = this.shiftInt();
        if (orderComboLegsCount > 0) {
          this.order.orderComboLegs = [];
          for (let n = 0; n < orderComboLegsCount; n++) {
            const orderComboLeg: any = {};
            orderComboLeg.price = this.shiftFloat();
            this.order.orderComboLegs.push(orderComboLeg);
          }
        }
      }
    }
  }

  decodeSmartComboRoutingParams() {
    if (this.version >= 26) {
      const smartComboRoutingParamsCount = this.shiftInt();
      if (smartComboRoutingParamsCount > 0) {
        this.order.smartComboRoutingParams = [];
        for (let n = 0; n < smartComboRoutingParamsCount; n++) {
          const tagValue: any = {};
          tagValue.tag = this.shift();
          tagValue.value = this.shift();
          this.order.smartComboRoutingParams.push(tagValue);
        }
      }
    }
  }

  decodeScaleOrderParams() {
    if (this.version >= 20) {
      this.order.scaleInitLevelSize = this.shiftInt();
      this.order.scaleSubsLevelSize = this.shiftInt();
    } else {
      this.order.notSuppScaleNumComponents = this.shiftInt();
      this.order.scaleInitLevelSize = this.shiftInt();
    }

    this.order.scalePriceIncrement = this.shiftFloat();

    if (this.version >= 28 && this.order.scalePriceIncrement != null &&
        this.order.scalePriceIncrement > 0.0) {
      this.order.scalePriceAdjustValue = this.shiftFloat();
      this.order.scalePriceAdjustInterval = this.shiftInt();
      this.order.scaleProfitOffset = this.shiftFloat();
      this.order.scaleAutoReset = this.shiftBool();
      this.order.scaleInitPosition = this.shiftInt();
      this.order.scaleInitFillQty = this.shiftInt();
      this.order.scaleRandomPercent = this.shiftBool();
    }
  }

  decodeHedgeParams() {
    if (this.version >= 24) {
      this.order.hedgeType = this.shift();
      if (this.order.hedgeType) {
        this.order.hedgeParam = this.shift();
      }
    }
  }

  decodeOptOutSmartRouting() {
    if (this.version >= 25) {
      this.order.optOutSmartRouting = this.shiftBool();
    }
  }

  decodeClearingParams() {
    this.order.clearingAccount = this.shift();
    this.order.clearingIntent = this.shift();
  }

  decodeNotHeld() {
    if (this.version >= 22) {
      this.order.notHeld = this.shiftBool();
    }
  }

  decodeDeltaNeutral() {
    if (this.version >= 20) {
      const deltaNeutralContractPresent = this.shiftBool();
      if (deltaNeutralContractPresent) {
        // TODO why was this a class?
        // this.contract.deltaNeutralContract = DeltaNeutralContract()
        this.contract.deltaNeutralContract = {};
        this.contract.deltaNeutralContract.conId = this.shiftInt();
        this.contract.deltaNeutralContract.delta = this.shiftFloat();
        this.contract.deltaNeutralContract.price = this.shiftFloat();
      }
    }
  }



  decodeAlgoParams() {
    if (this.version >= 21) {
      this.order.algoStrategy = this.shift();
      if (this.order.algoStrategy) {
        const algoParamsCount = this.shiftInt();
        if (algoParamsCount > 0) {
          this.order.algoParams = []
          for (let n = 0; n < algoParamsCount; n++) {
            const tagValue: any = {};
            tagValue.tag = this.shift();
            tagValue.value = this.shift();
            this.order.algoParams.push(tagValue);
          }
        }
      }
    }
  }

  decodeSolicited() {
    if (this.version >= 33) {
      this.order.solicited = this.shiftBool();
    }
  }

  decodeOrderStatus() {
    this.orderState.status = this.shift();
  }

  decodeWhatIfInfoAndCommission() {
    this.order.whatIf = this.shiftBool();
    this.decodeOrderStatus();

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_WHAT_IF_EXT_FIELDS) {
      this.orderState.initMarginBefore = this.shift();
      this.orderState.maintMarginBefore = this.shift();
      this.orderState.equityWithLoanBefore = this.shift();
      this.orderState.initMarginChange = this.shift();
      this.orderState.maintMarginChange = this.shift();
      this.orderState.equityWithLoanChange = this.shift();
    }

    this.orderState.initMarginAfter = this.shift();
    this.orderState.maintMarginAfter = this.shift();
    this.orderState.equityWithLoanAfter = this.shift();

    this.orderState.commission = this.shiftFloat();
    this.orderState.minCommission = this.shiftFloat();
    this.orderState.maxCommission = this.shiftFloat();
    this.orderState.commissionCurrency = this.shift();
    this.orderState.warningText = this.shift();
  }

  decodeVolRandomizeFlags() {
    if (this.version >= 34) {
      this.order.randomizeSize = this.shiftBool();
      this.order.randomizePrice = this.shiftBool();
    }
  }

  decodePegToBenchParams() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      if (this.order.orderType === "PEG BENCH") {
        this.order.referenceContractId = this.shiftInt();
        this.order.isPeggedChangeAmountDecrease = this.shiftBool();
        this.order.peggedChangeAmount = this.shiftFloat();
        this.order.referenceChangeAmount = this.shiftFloat();
        this.order.referenceExchangeId = this.shift();
      }
    }
  }

  decodeConditions() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      const conditionsSize = this.shiftInt();
      if (conditionsSize > 0) {
        this.order.conditions = [];
        for (let n = 0; n < conditionsSize; n++) {
          const conditionType = this.shiftInt();
          // TODO order_condition doensn't exits. What was this?
          // const condition = order_condition.Create(conditionType)
          // condition.decode(this.fields)
          // this.order.conditions.push(condition);
        }
      }

      this.order.conditionsIgnoreRth = this.shiftBool();
      this.order.conditionsCancelOrder = this.shiftBool();
    }
  }

  decodeAdjustedOrderParams() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
      this.order.adjustedOrderType = this.shift();
      this.order.triggerPrice = this.shiftFloat();
      this.decodeStopPriceAndLmtPriceOffset();
      this.order.adjustedStopPrice = this.shiftFloat();
      this.order.adjustedStopLimitPrice = this.shiftFloat();
      this.order.adjustedTrailingAmount = this.shiftFloat();
      this.order.adjustableTrailingUnit = this.shiftInt();
    }
  }

  decodeStopPriceAndLmtPriceOffset() {
    this.order.trailStopPrice = this.shiftFloat();
    this.order.lmtPriceOffset = this.shiftFloat();
  }

  decodeSoftDollarTier() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_SOFT_DOLLAR_TIER) {
      const name = this.shift();
      const value = this.shift();
      const displayName = this.shift();
      this.order.softDollarTier = { name, value, displayName };
    }
  }

  decodeCashQty() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_CASH_QTY) {
      this.order.cashQty = this.shiftFloat();
    }
  }

  decodeDontUseAutoPriceForHedge() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_AUTO_PRICE_FOR_HEDGE) {
      this.order.dontUseAutoPriceForHedge = this.shiftBool();
    }
  }

  decodeIsOmsContainers() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
      this.order.isOmsContainer = this.shiftBool();
    }
  }

  decodeDiscretionaryUpToLimitPrice() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_D_PEG_ORDERS) {
      this.order.discretionaryUpToLimitPrice = this.shiftBool();
    }
  }

  decodeAutoCancelDate() {
    this.order.autoCancelDate = this.shift();
  }

  decodeFilledQuantity() {
    this.order.filledQuantity = this.shiftFloat();
  }

  decodeRefFuturesConId() {
    this.order.refFuturesConId = this.shiftInt();
  }

  decodeAutoCancelParent() {
    this.order.autoCancelParent = this.shiftBool();
  }

  decodeShareholder() {
    this.order.shareholder = this.shift();
  }

  decodeImbalanceOnly() {
    this.order.imbalanceOnly = this.shiftBool();
  }

  decodeRouteMarketableToBbo() {
    this.order.routeMarketableToBbo = this.shiftBool();
  }

  decodeParentPermId() {
    this.order.parentPermId = this.shiftInt();
  }

  decodeCompletedTime() {
    this.orderState.completedTime = this.shift();
  }

  decodeCompletedStatus() {
    this.orderState.completedStatus = this.shift();
  }

  decodeUsePriceMgmtAlgo() {
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_PRICE_MGMT_ALGO) {
      this.order.usePriceMgmtAlgo = this.shiftBool();
    }
  }
}
