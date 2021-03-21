interface OrderData {
    action: 'BUY' | 'SELL';
    totalQuantity: number;
    transmit?: boolean;
}

export interface LimitOrderData extends OrderData{
    lmtPrice: number;
    openClose?: string;
    tif?: 'DAY' | 'GTC' | 'OPG' | 'IOC' | 'GTD' | 'FOK' | 'DTC';
}

export interface MarketOrderData extends OrderData{
    goodAfterTime?: string;
    goodTillDate?: string;
}

export interface StopOrderData extends OrderData{
    /** Stop price
     * Stop Buy: When the market price goes OVER the stop price, execute a market buy. Expects the price to continue rising.
     * Stop Sell: When the market price goes UNDER the stop price, execute a market sell. Expects the price to continue falling.
     * Stop Limit Buy: When the market price goes UNDER the stop price, create a limit under the stop to buy when the price goes OVER the limit. Expects the price to reverse and rise.
     * Stop Limit Sell: When the market price goes OVER the stop price, create a limit over the stop to sell when the price goes UNDER the limit. Expects the price to reverse and fall.
     */
    auxPrice: number;
    /** ID of parent order. Some order types that assist with profit and loss can be attached to the parent orders they manage. */
    parentId?: number;
    /** Time in force
     * DAY: Day orders are good throughout regular trading hours until filled, cancelled, or expired. Submitting this after RTH will hold DAY orders and put them into action at the next RTH.
     * GTC: Good-Til-Canceled stays until cancelled, or if certain market conditions occur (ie. corporate action, 90 days IB account inactivity, end of following calendar quarter).
     * OPG: Requests your order be filled as close to market open price as possible. Must be submitted before 9:15am. Helps avoid open volatility/delays.
     * IOC: Any portion of an Immediate-or-Cancel order that is not filled as soon as it becomes available in the market is canceled.
     * GTD: A Good-Til-Date order will remain working within the system and in the marketplace until it executes or until the close of the market on the date specified.
     * FOK: If the entire Fill-or-Kill order does not execute as soon as it becomes available, the entire order is canceled.
     * DTC: Day-Til-Canceled orders are a GUI abstraction that keeps the order in the UI in a "deactivated" state until you retransmit it to the market. Mostly a TWS holdover.
     */
    tif?: 'DAY' | 'GTC' | 'OPG' | 'IOC' | 'GTD' | 'FOK' | 'DTC';
}

export class Order {

    static limit(data: LimitOrderData) {
        return {
            orderType: 'LMT',
            transmit: true,
            openClose: 'O',
            tif: 'DAY',
            ...data
        };
    }

    static market(data: MarketOrderData) {
        return {
            orderType: 'MKT',
            transmit: true,
            goodAfterTime: '',
            goodTillDate: '',
            ...data
        };
    }

    static stop(data: StopOrderData) {
        return {
            orderType: 'STP',
            transmit: true,
            parentId: 0,
            tif: 'DAY',
            ...data
        }
    }
}
