import React, { useState, useEffect } from 'react';
import { API_URL, WEB_SOCKET_URL } from '../../../../../config.js';
import ToggleSwitch from '../../../helpers/toggle/ToggleSwitch';
import { connect } from 'react-redux';
import MarketsNPools from '../../../settings/prefrences/merc/MercMode'
import {isEqual} from 'lodash'
const socket = new WebSocket( WEB_SOCKET_URL );

const MiningOperations = (props) => {
    socket.addEventListener('open', function (event) {
        socket.send('Hello Server!');
    });
    socket.onmessage = (e) => {
        let message = JSON.parse(e.data)
        console.log('Message from server ',message)
      }
    socket.addEventListener('error', function (event) {
        console.log('WebSocket error: ', event);
    });

    console.log('PROPS ', props)
    const [err, setError] = useState({autoRent: false, autoTrade: false})
    const [miningOperations, setOperations] = useState({
            targetMargin: '',
            profitReinvestment:'',
            updateUnsold: '',
            dailyBudget: '',
            autoRent: false,
            spot: false,
            alwaysMineXPercent: false,
            autoTrade: false,
            morphie: false,
            supportedExchange: false,
            Xpercent: 15,
            token: 'FLO',
            address: ''
    });


        const [showSettingaModal, setShowSettingsModal] = useState(false)

        let {  
            targetMargin,
            profitReinvestment,
            updateUnsold,
            dailyBudget,
            autoRent,
            spot,
            alwaysMineXPercent,
            autoTrade,
            morphie,
            supportedExchange,
            Xpercent,
            token
            } = miningOperations

    useEffect(() => {
        if(props.profile){
            
            let {
                targetMargin,
                profitReinvestment,
                updateUnsold,
                dailyBudget,
                autoRent,
                autoTrade,
                token,
            } = props.profile
        
        
            setOperations({
                targetMargin: !targetMargin ? '' : targetMargin,
                profitReinvestment: !profitReinvestment ? '' : profitReinvestment,
                updateUnsold: !updateUnsold ? '' : updateUnsold,
                dailyBudget: !dailyBudget ? '' : dailyBudget,
                autoRent: autoRent.on,
                spot: autoRent.mode.spot,
                alwaysMineXPercent: autoRent.mode.alwaysMineXPercent.on,
                Xpercent: autoRent.mode.alwaysMineXPercent.Xpercent,
                autoTrade: autoTrade.on,
                morphie: autoTrade.mode.morphie,
                supportedExchange: autoTrade.mode.supportedExchanges,
                token: token
            })
            setError('')

        }  else if(props.address) { 
            console.log(props.address.mnemonic)
            setOperations({...miningOperations, address: props.address.mnemonic})
            
        } else {
            setOperations({
                targetMargin: '',
                profitReinvestment: '',
                updateUnsold: '',
                dailyBudget: '',
                autoRent: false,
                spot: false,
                alwaysMineXPercent: true,
                autoTrade: false,
                morphie: false,
                supportedExchange: false,
                Xpercent: 15,
                token: 'FLO'
            })
        } 
    }, [props.profile, props.address])

    useEffect((prevProf = props.profile) => {
        // rent(miningOperations)

        let formatedState= {
            profile: {
                autoRent: {
                mode: {
                    spot,
                    alwaysMineXPercent: {
                        on: alwaysMineXPercent,
                        Xpercent,
                    }
                },
                on: autoRent,
                },
                autoTrade: { 
                    mode: { 
                    morphie,
                    supportedExchanges: supportedExchange
                }, 
                on: autoTrade },
            targetMargin,
            profitReinvestment,
            updateUnsold,
            dailyBudget,
            }
        }
        let profile = {...props.profile, ...formatedState.profile}

        if(isEqual(prevProf, profile)){
            return;
        }

        props.updateProfile(profile)

        if (miningOperations.autoRent || miningOperations.autoTrade){

            rent(miningOperations)
        } 


    },[autoRent, autoTrade ]);


    const rent = (profile) => {
        // profile.userId = props.user._id

        fetch(API_URL+'/rent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profile),
        }).then((response) => {
            return response.json();
        })
          .then((data) => {
            console.log(data);
        }).catch((err)=> {
              console.log(err)
        });
    }

    const checkInputsAndRent = (e, slider) => {
        let profile = {}
       
        for (let key in miningOperations) {
            switch (key) {
                case 'targetMargin':
                    if (miningOperations[key] === '')
                        return setError({targetMargin: true})
                    break;
                case 'profitReinvestment':
                    if (miningOperations[key] === '') 
                        return setError({profitReinvestment: true})
                    break;
                case 'updateUnsold':
                    if (miningOperations[key] === '') 
                        return setError({updateUnsold: true})
                    break;
                case 'dailyBudget':
                    if (miningOperations[key] === '') 
                        return setError({dailyBudget: true})
                    break;
                case 'autoRent':
                    if (slider === 'autoRent') {
                        // If neither radios are checked
                        if (miningOperations.spot === miningOperations.alwaysMineXPercent) {
                            return setError({autoRent: true})
                        }
                        setOperations({...miningOperations, autoRent: !autoRent, autoTrade: false})
                    }
                    break;
                case 'autoTrade':
                    if (slider === 'autoTrade') {
                        // If neither radios are checked
                        if (miningOperations.morphie === miningOperations.supportedExchange) {
                            return setError({autoTrade: true})
                        }
                        setOperations({...miningOperations, autoRent: false, autoTrade: !autoTrade})
                    }
            }
        }
    }


    const updateInputs = (e) => {

        const targetElem = e.target.id

        
        switch ( targetElem ) {
            case "targetMargin":
                if (err.targetMargin) setError({targetMargin: false})
                setOperations({...miningOperations, targetMargin: e.target.value})
                break;
            case "profitReinvestment":
                if (err.profitReinvestment) setError({profitReinvestment: false})
                setOperations({...miningOperations, profitReinvestment: e.target.value})
                break;
            case "updateUnsold":
                if (err.updateUnsold) setError({updateUnsold: false})
                setOperations({...miningOperations, updateUnsold: e.target.value})
                break;
            case "dailyBudget":
                if (err.dailyBudget) setError({dailyBudget: false})
                    setOperations({...miningOperations, dailyBudget: e.target.value })
                break;
            case "autoRent":
                checkInputsAndRent(e, targetElem)
                break;
            case "spot":
                if (err.autoRent) setError({autoRent: false})
                setOperations({...miningOperations, spot: true, alwaysMineXPercent: false})
                break;
            case "alwaysMineXPercent":
                if (err.autoRent) setError({autoRent: false})
                setOperations({...miningOperations, alwaysMineXPercent: true, spot: false})
                break;
            case "autoTrade":
                checkInputsAndRent(e,targetElem)
                break;
            case "morphie":

                if (err.autoTrade) setError({autoTrade: false})
                setOperations({...miningOperations, morphie: true, supportedExchange: false})
                break;
            case "supportedExchange":
                if (err.autoTrade) setError({autoTrade: false})
                setOperations({...miningOperations, supportedExchange: true, morphie: false})
        }
    }

    const editPercent = e => {
        let value = e.target.value
        setOperations({...miningOperations, Xpercent: value})
    }
    
    const handleOptionChange = (e) => {
        console.log(selectedOption)
        setSelectedOption(e.target.value)
    }
    const updatePercent = e => {
        let value = e.target.value
        setOperations({...miningOperations, Xpercent: value})
    }
    const showPercentInput = () => {
        let elem = document.getElementsByClassName('percent-input-container')[0]
        let pos = elem.style.transform
        if (pos === '') {
            elem.style.transform = 'translate(0px)'
        } else {
            elem.style = ''
        }
    }

    return (
        <>
        {showSettingaModal 
            && 
            <MarketsNPools handleClick={() => setShowSettingsModal(!showSettingaModal)}/>
        }
        <div className="card mining-operation">
            {console.log(miningOperations)} 
            <div className="card-header">Mining Operations</div>
            <div className="card-body">
                <div className="mining-operation-inputs">
                    <div className="target-margin-container">
                        <label htmlFor="basic-url">Target Margin</label>
                        <div className="input-group">
                            <input type="text" id="targetMargin" className="form-control" aria-label="Target margin reinvest"
                            onChange={(e) => {updateInputs(e)}} maxLength="2" value={targetMargin}/>
                            <div className="input-group-append">
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                        <div style={{transform: err.targetMargin ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                            <span className="error-arrow"></span>
                            <p>Input a percentage!</p>
                        </div>
                    </div>
                    <div className="profit-reinvestment-container">
                        <label htmlFor="basic-url">Profit Reinvestment</label>
                        <div className="input-group">
                            <input type="text" id="profitReinvestment" className="form-control" aria-label="Target margin reinvest"
                            onChange={(e) => {updateInputs(e)}} maxLength="2" value={profitReinvestment}/>
                            <div className="input-group-append">
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                        <div style={{transform: err.profitReinvestment ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                            <span className="error-arrow"></span>
                            <p>Input a percentage!</p>
                        </div>
                    </div>
                    <div className="unusoled-offers-container">
                        <label htmlFor="basic-url">Update Unsold Offers</label>
                        <div className="input-group">
                            <select className="custom-select" id="updateUnsold" onChange={(e) => {updateInputs(e)}}
                            value={updateUnsold}
                            >
                                <option default>Hourly</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </div>
                        <div style={{transform: err.updateUnsold ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                            <span className="error-arrow"></span>
                            <p>Choose an interval!</p>
                        </div>
                    </div>
                    <div className="daily-budget-container">
                        <label htmlFor="basic-url">Daily Budget</label>
                        <div className="input-group">
                            <input type="text" className="form-control" id="dailyBudget" aria-label="Daily budget"
                            onChange={(e) => {updateInputs(e)}} value={dailyBudget}/>
                            <div className="input-group-append">
                                <span className="daily-budget-text">Edit</span>
                            </div>
                        </div>
                        <div style={{transform: err.dailyBudget ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                        <span className="error-arrow"></span>
                        <p>Choose one!</p>
                    </div>
                    </div>
                </div>

                {/* AUTO RENTING CONTAINER */}
                <div className="automatic-renting-container">
                    <ToggleSwitch  
                        handleChange={(e) => {updateInputs(e)}}
                        id={"autoRent"}
                        htmlFor={"autoRent"}
                        isOn={autoRent}/>
                    <div className="automatic-renting-content">
                        <h5>Automatic Renting</h5>
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="spot" 
                            value={spot}
                            name="auto-rent"
                            checked={miningOperations.spot ? true  : false}
                            onChange={(e) => {
                                updateInputs(e)
                            }} />
                            <label className="form-check-label" htmlFor="spotProfitable">
                                Mine only when spot profitable
                            </label>
                        </div>
                        <div className="percent-container">
                            <div className="form-check">
                                <input className="form-check-input" type="radio" id="alwaysMineXPercent"
                                value={alwaysMineXPercent}
                                name="auto-rent"
                                checked={miningOperations.alwaysMineXPercent ? true  : false}
                                onChange={(e) => {updateInputs(e)}} />
                                <label className="form-check-label" htmlFor="alwaysMineXPercent">
                                    Always mine {Xpercent}% of the network
                                </label>
                            </div>
                            <div className="percent-input-container" >
                            {/* <label for="validationCustom02">Last name</label> */}
                            <input type="text" className="form-control percent-field" id="Xpercent" 
                                required placeholder="0" onChange={(e) => {updatePercent(e)}} maxLength="2"
                                value={Xpercent}
                            />
                            <span>%</span>
                            <button className="edit-percent-btn" onClick={showPercentInput}>edit percentage</button>
                            </div>
                        </div>
                        <div style={{transform: err.autoRent ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                            <span className="error-arrow"></span>
                            <p>Need at least one checked before renting!</p>
                        </div>
                    </div>
                </div>

                {/* Select Rental Markets & Mining Pool */}
                <button onClick={() => setShowSettingsModal(!showSettingaModal)} className="select-markets-pools">Select Rental Markets & Mining Pools</button>

                {/* AUTO TRADING CONTAINER */}
                <div className="automatic-trading-container">
                    <ToggleSwitch  
                            handleChange={(e) => {updateInputs(e)}}
                            id={"autoTrade"}
                            htmlFor={"autoTrade"}
                            isOn={autoTrade}
        
                        /> 
                    <div className="automatic-renting-content">
                        <h5>Automatic Trading</h5>
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="morphie" 
                            value={morphie}
                            // checked={morphie}
                            checked={miningOperations.morphie ? true  : false}
                            name="auto-trading"
                            onChange={(e) => {updateInputs(e)}}  />
                            <label className="form-check-label" htmlFor="morphie">
                                Prefer the Morphie DEX
                            </label>
                        </div>
                        <div className="form-check">
                            <input className="form-check-input" type="radio" id="supportedExchange"
                            // value={supportedExchange}
                            name="auto-trading"
                            checked={miningOperations.supportedExchange ? true  : false}
                            onChange={(e) => {updateInputs(e)}} />
                            <label className="form-check-label" htmlFor="supportedExchange">
                                Supported exchanges
                            </label>
                        </div>
                        <div style={{transform: err.autoTrade ? 'scale(1)' : 'scale(0)'}} className="error-dialog">
                            <span className="error-arrow"></span>
                            <p>Need at least one checked before renting!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};


const mapStateToProps = state => {
    return {
        user: state.auth.user,
        address: state.account.wallet
    };
};

export default connect(mapStateToProps)(MiningOperations);