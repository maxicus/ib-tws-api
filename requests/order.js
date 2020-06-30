import assert from 'assert';
import OutcomeMessageType from '../const-outcome-message-type.js';
import ServerVersion from '../const-server-version.js';



export function request_placeOrder(serverVersion, p) {
  /*
  p: orderId:OrderId, contract:Contract, order:Order

  Call this function to place an order. The order status will
  be returned by the orderStatus event.

  orderId:OrderId - The order id. You must specify a unique value. When the
      order START_APItus returns, it will be identified by this tag.
      This tag is also used when canceling the order.
  contract:Contract - This structure contains a description of the
      contract which is being traded.
  order:Order - This structure contains the details of tradedhe order.
      Note: Each client MUST connect with a unique clientId.*/
  let orderId = p.orderId;
  let contract = p.contract;
  let order = p.order;

  order.softDollarTier = order.softDollarTier || {};
  order.conditions = order.conditions || [];

  if (serverVersion < ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL) {
    if (contract.deltaNeutralContract) {
      throw new Error("It does not support delta-neutral orders.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SCALE_ORDERS2) {
    if (order.scaleSubsLevelSize != null) {
      throw new Error("It does not support Subsequent Level Size for Scale orders.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ALGO_ORDERS) {
    if (order.algoStrategy) {
      throw new Error("It does not support algo orders.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_NOT_HELD) {
    if (order.notHeld) {
      throw new Error("It does not support notHeld parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SEC_ID_TYPE) {
    if (contract.secIdType || contract.secId) {
      throw new Error("It does not support secIdType and secId parameters.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_PLACE_ORDER_CONID) {
    if (contract.conId && contract.conId > 0) {
      throw new Error("It does not support conId parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SSHORTX) {
    if (order.exemptCode != -1) {
      throw new Error("It does not support exemptCode parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SSHORTX) {
    if (contract.comboLegs) {
      contract.comboLegs.forEach((comboLeg) => {
        if (comboLeg.exemptCode != -1) {
          throw new Error("It does not support exemptCode parameter.");
        }
      });
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_HEDGE_ORDERS) {
    if (order.hedgeType) {
      throw new Error("It does not support hedge orders.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_OPT_OUT_SMART_ROUTING) {
    if (order.optOutSmartRouting) {
      throw new Error("It does not support optOutSmartRouting parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL_CONID) {
    if (order.deltaNeutralConId > 0 ||
          order.deltaNeutralSettlingFirm ||
          order.deltaNeutralClearingAccount ||
          order.deltaNeutralClearingIntent) {
      throw new Error("It does not support deltaNeutral parameters: ConId, SettlingFirm, ClearingAccount, ClearingIntent.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL_OPEN_CLOSE) {
    if (order.deltaNeutralOpenClose ||
          order.deltaNeutralShortSale ||
          order.deltaNeutralShortSaleSlot > 0 ||
          order.deltaNeutralDesignatedLocation) {
      throw new Error("It does not support deltaNeutral parameters: OpenClose, ShortSale, ShortSaleSlot, DesignatedLocation.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SCALE_ORDERS3) {
    if (order.scalePriceIncrement > 0 && order.scalePriceIncrement != null) {
      if (order.scalePriceAdjustValue != null ||
          order.scalePriceAdjustInterval != null ||
          order.scaleProfitOffset != null ||
          order.scaleAutoReset ||
          order.scaleInitPosition != null ||
          order.scaleInitFillQty != null ||
          order.scaleRandomPercent) {
        throw new Error("It does not support Scale order parameters: PriceAdjustValue, PriceAdjustInterval, " +
          "ProfitOffset, AutoReset, InitPosition, InitFillQty and RandomPercent");
      }
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_COMBO_LEGS_PRICE &&
      contract.secType == "BAG") {
    if (order.orderComboLegs) {
      order.orderComboLegs.forEach((orderComboLeg) => {
        if (orderComboLeg.price != null) {
          throw new Error("It does not support per-leg prices for order combo legs.");
        }
      });
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_TRAILING_PERCENT) {
    if (order.trailingPercent != null) {
      throw new Error("It does not support trailing percent parameter");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
    if (contract.tradingClass) {
      throw new Error("It does not support tradingClass parameter in placeOrder.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_SCALE_TABLE) {
    if (order.scaleTable || order.activeStartTime || order.activeStopTime) {
      throw new Error("It does not support scaleTable, activeStartTime and activeStopTime parameters");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ALGO_ID) {
    if (order.algoId) {
      throw new Error("It does not support algoId parameter");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_SOLICITED) {
    if (order.solicited) {
      throw new Error(" It does not support order solicited parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
    if (order.modelCode) {
      throw new Error(" It does not support model code parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_EXT_OPERATOR) {
    if (order.extOperator) {
      throw new Error(" It does not support ext operator parameter");
    }
  }


  if (serverVersion < ServerVersion.MIN_SERVER_VER_SOFT_DOLLAR_TIER) {
    if (order.softDollarTier.name || order.softDollarTier.val) {
      throw new Error("It does not support soft dollar tier");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_CASH_QTY) {
    if (order.cashQty) {
      throw new Error("It does not support cash quantity parameter");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_DECISION_MAKER &&
      (order.mifid2DecisionMaker != "" || order.mifid2DecisionAlgo != "")) {
    throw new Error("It does not support MIFID II decision maker parameters");
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_MIFID_EXECUTION &&
      (order.mifid2ExecutionTrade != "" || order.mifid2ExecutionAlgo != "")) {
    throw new Error("It does not support MIFID II execution parameters")
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_AUTO_PRICE_FOR_HEDGE &&
      order.dontUseAutoPriceForHedge) {
    throw new Error("It does not support dontUseAutoPriceForHedge parameter");
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER &&
      order.isOmsContainer) {
    throw new Error("It does not support oms container parameter");
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_PRICE_MGMT_ALGO &&
      order.usePriceMgmtAlgo) {
    throw new Error("It does not support Use price management algo requests");
  }

  let VERSION;
  if (serverVersion < ServerVersion.MIN_SERVER_VER_NOT_HELD) {
    VERSION = 27;
  } else {
    VERSION = 45;
  }

  // send place order msg
  let flds = [];
  flds.push(OutcomeMessageType.PLACE_ORDER);

  if (serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
    flds.push(VERSION);
  }

  flds.push(orderId);

  // send contract fields
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_PLACE_ORDER_CONID) {
    flds.push(contract.conId);
  }

  flds.push(contract.symbol);
  flds.push(contract.secType);
  flds.push(contract.lastTradeDateOrContractMonth);
  flds.push(contract.strike);
  flds.push(contract.right);
  flds.push(contract.multiplier);   // srv v15 and above
  flds.push(contract.exchange);
  flds.push(contract.primaryExchange);   // srv v14 and above
  flds.push(contract.currency);
  flds.push(contract.localSymbol);   // srv v2 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
    flds.push(contract.tradingClass);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SEC_ID_TYPE) {
    flds.push(contract.secIdType);
    flds.push(contract.secId);
  }

  // send main order fields
  flds.push(order.action);
  flds.push(order.totalQuantity);

  flds.push(order.orderType);
  if (serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_COMBO_LEGS_PRICE) {
    flds.push(order.lmtPrice ? order.lmtPrice : 0);
  } else {
    flds.push(order.lmtPrice);
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_TRAILING_PERCENT) {
    flds.push(order.auxPrice ? order.auxPrice : 0);
  } else {
    flds.push(order.auxPrice);
  }

  // send extended order fields
  flds.push(order.tif);
  flds.push(order.ocaGroup);
  flds.push(order.account);
  flds.push(order.openClose);
  flds.push(order.origin);
  flds.push(order.orderRef);
  flds.push(order.transmit);
  flds.push(order.parentId);      // srv v4 and above
  flds.push(order.blockOrder);    // srv v5 and above
  flds.push(order.sweepToFill);   // srv v5 and above
  flds.push(order.displaySize);   // srv v5 and above
  flds.push(order.triggerMethod); // srv v5 and above
  flds.push(order.outsideRth);    // srv v5 and above
  flds.push(order.hidden);        // srv v7 and above

  // Send combo legs for BAG requests (srv v8 and above)
  if (contract.secType == "BAG") {
    let comboLegsCount = contract.comboLegs ? contract.comboLegs.length : 0;
    flds.push(comboLegsCount);
    if (comboLegsCount > 0) {
      contract.comboLegs.forEach((comboLeg) => {
        flds.push(comboLeg.conId);
        flds.push(comboLeg.ratio);
        flds.push(comboLeg.action);
        flds.push(comboLeg.exchange);
        flds.push(comboLeg.openClose);
        flds.push(comboLeg.shortSaleSlot);      //srv v35 and above
        flds.push(comboLeg.designatedLocation); // srv v35 and above

        if (serverVersion >= ServerVersion.MIN_SERVER_VER_SSHORTX_OLD) {
          flds.push(comboLeg.exemptCode);
        }
      });
    }
  }

  // Send order combo legs for BAG requests
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_ORDER_COMBO_LEGS_PRICE &&
      contract.secType == "BAG") {
    let orderComboLegsCount = order.orderComboLegs ? order.orderComboLegs.length : 0;

    flds.push(orderComboLegsCount);
    if (orderComboLegsCount) {
      order.orderComboLegs.forEach((orderComboLeg) => {
        flds.push(orderComboLeg.price);
      });
    }
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SMART_COMBO_ROUTING_PARAMS &&
      contract.secType == "BAG") {
    let smartComboRoutingParamsCount = order.smartComboRoutingParams ?
      order.smartComboRoutingParams.length : 0;
    flds.push(smartComboRoutingParamsCount);

    if (smartComboRoutingParamsCount > 0) {
      order.smartComboRoutingParams.forEach((tagValue) => {
        flds.push(tagValue.tag);
        flds.push(tagValue.value);
      });
    }
  }

  //#####################################################################
  // Send the shares allocation.
  //
  // This specifies the number of order shares allocated to each Financial
  // Advisor managed account. The format of the allocation string is as
  // follows:
  //                      <account_code1>/<number_shares1>,<account_code2>/<number_shares2>,...N
  // E.g.
  //              To allocate 20 shares of a 100 share order to account 'U101' and the
  //      residual 80 to account 'U203' enter the following share allocation string:
  //          U101/20,U203/80
  //####################################################################
  // send deprecated sharesAllocation field

  flds.push("");            // srv v9 and above
  flds.push(order.discretionaryAmt); // srv v10 and above
  flds.push(order.goodAfterTime); // srv v11 and above
  flds.push(order.goodTillDate); // srv v12 and above

  flds.push(order.faGroup);      // srv v13 and above
  flds.push(order.faMethod);     // srv v13 and above
  flds.push(order.faPercentage); // srv v13 and above
  flds.push(order.faProfile);    // srv v13 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
    flds.push(order.modelCode);
  }

  // institutional short saleslot data (srv v18 and above)
  flds.push(order.shortSaleSlot);   // 0 for retail, 1 or 2 for institutions
  flds.push(order.designatedLocation);   // populate only when shortSaleSlot = 2.
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SSHORTX_OLD) {
    flds.push(order.exemptCode);
  }

  // not needed anymore
  //bool isVolOrder = (order.orderType.CompareNoCase("VOL") == 0)

  // srv v19 and above fields
  flds.push(order.ocaType);
  //if( serverVersion < 38) {
  // will never happen
  //      send( /* order.rthOnly */ false);
  //}
  flds.push(order.rule80A);
  flds.push(order.settlingFirm);
  flds.push(order.allOrNone);
  flds.push(order.minQty);
  flds.push(order.percentOffset);
  flds.push(order.eTradeOnly);
  flds.push(order.firmQuoteOnly);
  flds.push(order.nbboPriceCap);
  flds.push(order.auctionStrategy);   // AUCTION_MATCH, AUCTION_IMPROVEMENT, AUCTION_TRANSPARENT
  flds.push(order.startingPrice);
  flds.push(order.stockRefPrice);
  flds.push(order.delta);
  flds.push(order.stockRangeLower);
  flds.push(order.stockRangeUpper);

  flds.push(order.overridePercentageConstraints);    //srv v22 and above

  // Volatility orders (srv v26 and above)
  flds.push(order.volatility);
  flds.push(order.volatilityType);
  flds.push(order.deltaNeutralOrderType);             // srv v28 and above
  flds.push(order.deltaNeutralAuxPrice);   // srv v28 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL_CONID &&
      order.deltaNeutralOrderType) {
    flds.push(order.deltaNeutralConId);
    flds.push(order.deltaNeutralSettlingFirm);
    flds.push(order.deltaNeutralClearingAccount);
    flds.push(order.deltaNeutralClearingIntent);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL_OPEN_CLOSE &&
      order.deltaNeutralOrderType) {
    flds.push(order.deltaNeutralOpenClose);
    flds.push(order.deltaNeutralShortSale);
    flds.push(order.deltaNeutralShortSaleSlot);
    flds.push(order.deltaNeutralDesignatedLocation);
  }

  flds.push(order.continuousUpdate);
  flds.push(order.referencePriceType);
  flds.push(order.trailStopPrice);   // srv v30 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_TRAILING_PERCENT) {
    flds.push(order.trailingPercent);
  }

  // SCALE orders
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SCALE_ORDERS2) {
    flds.push(order.scaleInitLevelSize);
    flds.push(order.scaleSubsLevelSize);
  } else {
    // srv v35 and above)
    flds.push("");   // for not supported scaleNumComponents
    flds.push(order.scaleInitLevelSize);   // for scaleComponentSize
  }

  flds.push(order.scalePriceIncrement);

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SCALE_ORDERS3 &&
      order.scalePriceIncrement != null &&
      order.scalePriceIncrement > 0) {
    flds.push(order.scalePriceAdjustValue);
    flds.push(order.scalePriceAdjustInterval);
    flds.push(order.scaleProfitOffset);
    flds.push(order.scaleAutoReset);
    flds.push(order.scaleInitPosition);
    flds.push(order.scaleInitFillQty);
    flds.push(order.scaleRandomPercent);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SCALE_TABLE) {
    flds.push(order.scaleTable);
    flds.push(order.activeStartTime);
    flds.push(order.activeStopTime);
  }

  // HEDGE orders
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_HEDGE_ORDERS) {
    flds.push(order.hedgeType);
    if (order.hedgeType) {
      flds.push(order.hedgeParam);
    }
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_OPT_OUT_SMART_ROUTING) {
    flds.push(order.optOutSmartRouting);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_PTA_ORDERS) {
    flds.push(order.clearingAccount);
    flds.push(order.clearingIntent);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_NOT_HELD) {
    flds.push(order.notHeld);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL) {
    if (contract.deltaNeutralContract) {
      flds.push(true);
      flds.push(contract.deltaNeutralContract.conId);
      flds.push(contract.deltaNeutralContract.delta);
      flds.push(contract.deltaNeutralContract.price);
    } else {
      flds.push(false);
    }
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_ALGO_ORDERS) {
    flds.push(order.algoStrategy);
    if (order.algoStrategy) {
      let algoParamsCount = order.algoParams ? order.algoParams.length : order.algoParams;
      flds.push(algoParamsCount);
      if (algoParamsCount > 0) {
        order.algoParams.forEach((algoParam) => {
          flds.push(algoParam.tag);
          flds.push(algoParam.value);
        });
      }
    }
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_ALGO_ID) {
    flds.push(order.algoId);
  }

  flds.push(order.whatIf);   // srv v36 and above

  // send miscOptions parameter
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
    let miscOptionsStr = "";
    if (order.orderMiscOptions) {
      order.orderMiscOptions.forEach((tagValue) => {
        miscOptionsStr += tagValue;
      });
    }
    flds.push(miscOptionsStr);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_ORDER_SOLICITED) {
    flds.push(order.solicited);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_RANDOMIZE_SIZE_AND_PRICE) {
    flds.push(order.randomizeSize);
    flds.push(order.randomizePrice);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
    if (order.orderType == "PEG BENCH") {
      flds.push(order.referenceContractId);
      flds.push(order.isPeggedChangeAmountDecrease);
      flds.push(order.peggedChangeAmount);
      flds.push(order.referenceChangeAmount);
      flds.push(order.referenceExchangeId);
    }

    flds.push(order.conditions.length);

    if (order.conditions.length > 0) {
      throw new Error('order.conditions not implemented yet');
      /*
      order.conditions.forEach((cond) => {
        flds.push(cond.type());
        cond.push_fields(flds);
      });

      flds.push(order.conditionsIgnoreRth);
      flds.push(order.conditionsCancelOrder);*/
    }

    flds.push(order.adjustedOrderType);
    flds.push(order.triggerPrice);
    flds.push(order.lmtPriceOffset);
    flds.push(order.adjustedStopPrice);
    flds.push(order.adjustedStopLimitPrice);
    flds.push(order.adjustedTrailingAmount);
    flds.push(order.adjustableTrailingUnit);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_EXT_OPERATOR) {
    flds.push(order.extOperator);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_SOFT_DOLLAR_TIER) {
    flds.push(order.softDollarTier.name);
    flds.push(order.softDollarTier.val);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_CASH_QTY) {
    flds.push(order.cashQty);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_DECISION_MAKER) {
    flds.push(order.mifid2DecisionMaker);
    flds.push(order.mifid2DecisionAlgo);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_MIFID_EXECUTION) {
    flds.push(order.mifid2ExecutionTrader);
    flds.push(order.mifid2ExecutionAlgo);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_AUTO_PRICE_FOR_HEDGE) {
    flds.push(order.dontUseAutoPriceForHedge);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
    flds.push(order.isOmsContainer);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_D_PEG_ORDERS) {
    flds.push(order.discretionaryUpToLimitPrice);
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_PRICE_MGMT_ALGO) {
    if (order.usePriceMgmtAlgo == null) {
      flds.push("");
    } else if (order.usePriceMgmtAlgo) {
      flds.push(1);
    } else {
      flds.push(0);
    }
  }

  return flds;
}
