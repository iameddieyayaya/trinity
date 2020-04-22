//todo: grab - shoot down user's menemonic to access said wallet.
// ? Ask user to enter password; if wallet is unlocked?
require('dotenv').config();
const { API_URL}  = process.env
const HDMW = require('@oipwg/hdmw')
const Wallet = HDMW.Wallet
const axios = require('axios')

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
let TotalQty  = 0; //Receviced + FeeFloTx1
let ReceivedQty; //what is deposited from rentals
let FeeFloTx1; //cumulative fee from rentals.
// These values come from what resulted in the rentals;

let SellableQty; //Qty to sell; TotalQty - FeeFloTx2
let FeeFloTx2; //Fee from moving tokens from Local Wallet to Bittrex

let  OfferPriceBtc, //formula 
     CostOfRentalBTC, //comes from rental
     TradeFee, //?
     EstFeeBtcTx1, //?
     ProfitUsd // = ( BtcFromTrades * PriceBtcUsd ) - CostOfRentalUsd

let orderReceipt;




module.exports = async function(profile, mnemonic, accessToken) {

    if(!accessToken){
        console.log('no access token');
        return 'ERROR; No Access Token'
    }
    if(!profile){
        console.log('no profile');
        return 'ERROR; Profile Not Found'
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': accessToken
        },
    };

    // formulas
    const getTotalQty = (ReceivedQty, FeeFloTx1) => {
        return (ReceivedQty + FeeFloTx1);
    }

    const getOfferPriceBtc = (CostOfRentalBTC, TradeFee, margin, EstFeeBtcTx1, TotalQty, FeeFloTx1, FeeFloTx2) => {
        let OfferPrice = (CostOfRentalBTC * ( TradeFee + 1 ) * ( margin + 1 ) + EstFeeBtcTx1 ) / ( TotalQty - FeeFloTx1 - FeeFloTx2 );
        return Number(OfferPrice.toFixed(8))
    }

    const getSellableQty = (TotalQty, FeeFloTx2) => {
        return TotalQty - FeeFloTx2
    }

    //bittrex wallet address
    const getBittrexAddress = async (token) => {
        try {
            
            let res = await axios.get(`${API_URL}/bittrex/deposit-addresses`, config)

            return res.data.bittrexAddresses[token].Address

        } catch (error) {
            console.log('getBittrexAddress Failed ------- ', error)
        }
    }

    const getBalanceFromAddress = async (address) => {
        try {
            let res = await axios.get(`https://livenet.flocha.in/api/addr/${address}`)

            return res.data    
        } catch (error) {
            console.log('error -------', error)
        }
    }

    const send_a_payment = async (address, amount) => {
        try {
            let txid = await myWallet.sendPayment({
                to: { [address]: amount }
            })
            console.log("Successfully sent Transaction! " + txid);
            return txid

        } catch (error) {
            console.log('error -----', error)
        }
    }

    const createSellOrder = async (market, quantity, rate) => {
                
        let body = {
            market,
            quantity,
            rate,
        }
        
        console.log('running createSellOrder -------', body)

        try {
            const res = await axios.post(`${API_URL}/bittrex/createSellOrder`, body, config)
            console.log(res.data)
            return res.data.result.uuid
        } catch (error) {
            console.log('error ---', error)
        }
        
    }

    const getFees = async transactions => {
        console.log('getting fees...')
        let total = 0;
    
        for(let i = 0; i < transactions.length; i++){
            
            let res = await axios.get(`https://livenet.flocha.in/api/tx/${transactions[i]}`)

            total += res.data.fees
        } 

        return Number(total.toFixed(8))
    }

    const getProfitUsd = (BtcFromTrades, PriceBtcUsd, CostOfRentalUsd) => {
         return  ( BtcFromTrades * PriceBtcUsd ) - CostOfRentalUsd
    }

    const getRentalBudget3HrCycleUsd = (CostOfRentalUsd, ProfitUsd, ProfiReinvestmentRate) => {
        return  RentalBudget3HrCycleUsd = CostOfRentalUsd + ( ProfitUsd * (ProfitReinvestmentRate) )
    }

    const getRentalBudgetDailyUsd = (RentalBudget3HrCycleUsd) => {
        return RentalBudget3HrCycleUsd * 8;
    }

    const getTakeProfitBtc = (ProfitUsd, ProfitReinvestmentRate, PriceBtcUsd) => {
        return  ProfitUsd * (1 - ProfitReinvestmentRate) / PriceBtcUsd
    }


    const {
        address,
        token,
        targetMargin,
        profitReinvestment,
        updateUnsold,
        dailyBudget,
        _id,
    } = profile


    const margin = targetMargin / 100;

    const myWallet = new Wallet(mnemonic);

    let {balance, transactions} = await getBalanceFromAddress(address);

    let floBittrexAddress = await getBittrexAddress(token);

            
            ReceivedQty = balance; 
            FeeFloTx1 = await getFees(transactions)
            TotalQty = getTotalQty(ReceivedQty, FeeFloTx1)



            //TXID
            // Sent to Bittrex. Get network Fee for moving tokens
            console.log('pre call -----', {ReceivedQty, FeeFloTx1, TotalQty, floBittrexAddress})

            if(balance == 0){
                return console.log('NO BALANCE', balance)
            }

            
            let bittrexTX = await send_a_payment(floBittrexAddress, TotalQty).catch(() => { 
                console.error("Unable to send Transaction!", error) 
            })

            if(!bittrexTX) {
                console.log('failed to send tokens')
                return;
            }

            try {

                let confirmed = false;
                let isUpdate = false;
                let orderReceiptID = ''

                const checkConfirmations = async () => {
                    try {
                        // let res = await axios.get(`${API_URL}/bittrex/deposit-history`, config)
                        console.log('checking confirmations')
                        let res = await axios.get(`https://livenet.flocha.in/api/tx/${bittrexTX}`)

                        let {fees, confirmations } = res.data

                        FeeFloTx2 = fees
                        CostOfRentalBTC=0.0003686 //! get this form AutoRent
                        TradeFee= .002 //!
                        EstFeeBtcTx1=0.00001551 //! get from somewhere
            
                        ReceivedQty= balance
                        TotalQty = getTotalQty(ReceivedQty, FeeFloTx1)
                        SellableQty = getSellableQty(TotalQty, FeeFloTx2)
                        
                        OfferPriceBtc = getOfferPriceBtc(CostOfRentalBTC,TradeFee,margin,EstFeeBtcTx1,TotalQty,FeeFloTx1,FeeFloTx2)
                    
                        console.log(
                            '---check confirmations---',
                            { 
                                confirmations,
                                TotalQty,
                                FeeFloTx1,
                                FeeFloTx2,
                                SellableQty,
                                FeeFloTx2, 
                                CostOfRentalBTC,
                                TradeFee,
                                margin,
                                EstFeeBtcTx1,
                                TotalQty,
                                FeeFloTx1,
                                FeeFloTx2,
                                OfferPriceBtc
                            
                            }
                            )
    
                        // bittrex need 150 confirmations 
                        if(confirmations > 150){
                            if(isUpdate){
                                //search open order that matches orderReciptID?
                                // update it;


                                
                                console.log(
                                    '---Updated---',
                                    { 
                                        TotalQty,
                                        FeeFloTx1,
                                        FeeFloTx2,
                                        SellableQty,
                                        FeeFloTx2, 
                                        CostOfRentalBTC,
                                        TradeFee,
                                        margin,
                                        EstFeeBtcTx1,
                                        TotalQty,
                                        FeeFloTx1,
                                        FeeFloTx2,
                                        OfferPriceBtc
                                    
                                    })

                                    ReceivedQty = balance; 
                                    TotalQty = getTotalQty(ReceivedQty, FeeFloTx1)
                                    SellableQty  = getSellableQty(TotalQty, FeeFloTx2)
                                    OfferPriceBtc = getOfferPriceBtc(CostOfRentalBTC, TradeFee,margin, EstFeeBtcTx1,TotalQty,FeeFloTx1,FeeFloTx2);
    

                                // SellableQty += SellableQtyUp;
                                // OfferPriceBtc += OfferPriceBtcUp;

                                    console.log('If Update --- before runing function;', {SellableQtyUp, OfferPriceBtcUp})


                                orderReceiptID = await updateOrder(orderReceipt,token, SellableQty, OfferPriceBtc)
                                return orderReceiptID;
                            } else { 
                            confirmed = true;

                            orderReceiptID = await createSellOrder(token, SellableQty, OfferPriceBtc)
                            // return clearInterval(timer);
                        }}
                    } catch (error) {
                        console.log(error)
                    }

                    
                }


                const timer = setInterval(() => {
                    checkConfirmations()
                }, (2 * ONE_MINUTE))




                //if more FLO/RVN show up in the wallet addres. Send them to Bittrex, update FeeFloTX1, TotalQTR, SellableQTY //TODO:

                //for testing should grab it from the first order created?
                console.log('orderReceiptID', orderReceiptID)

                    // BtcFromTrades = cumulative total of Bitcoin earned from trades;
                    // PriceBtcUsd = Coinbase's API - current exchange price for BTC in USD;
                    // ProfitUsd = ( BtcFromTrades * PriceBtcUsd ) - CostOfRentalUsd
                    const getCoinbaseBTCUSD = () => {
                        const coinbase = axios.create({
                            baseURL: 'https://api.coinbase.com/v2',
                            timeout: 1000,
                        });

                    return coinbase
                            .get('/exchange-rates?currency=BTC')
                            .then(res => {
                                console.log('BTC -> USD', res.data.rates.USD)
                                return res.data.rates.USD
                            })
                            .catch(err => {
                                console.log(err.response);
                            });
                    };

                PriceBtcUsd = await getCoinbaseBTCUSD();
                console.log({PriceBtcUsd})

                let hasUpdated = false;

                const updateOrder = async (orderUuid, market, quantity, rate) => {
                    let body = {
                        orderUuid,
                        market,
                        quantity,
                        rate,
                    }
                    
                    console.log(body)

                    try {
                        const res = await axios.post(`${API_URL}/bittrex/updateOrder`, body, config)
                        console.log(res.data)
                        return res.data.result.uuid
                    } catch (error) {
                        console.log('updateOrder ---', error)
                    }
                }
                

                const shouldIUpdated = async () => {
                    try {
                        console.log('runing updating')
                        const res = await getBalanceFromAddress(address);

                        updatedBalance = res.balance
                        transactions = res.transactions

                        // will need to create a variable for the least amount, I can push up to bittrex wallet.
                        if(updatedBalance > 10){
                            console.log('pre', {balance, updatedBalance})
                            balance += updatedBalance
                            FeeFloTx1 = await getFees(transactions)
                            console.log('pre', {balance, updatedBalance, FeeFloTx1})


                            isUpdate = true;
                            //push new tokens to wallet
                            bittrexTX = await send_a_payment(floBittrexAddress, updatedBalance).catch(() => { 
                                console.error("Unable to send Transaction!", error) 
                            })

                        } else {
                            console.log('Not enought to send to Bittrex', updatedBalance)

                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                const update = setInterval(() => {
                    shouldIUpdated()
                },(updateUnsold * (3 * ONE_MINUTE)))

            } catch (error) {
                console.log(error)
            }

            //Kill intervals after orders have ended.
            
}
