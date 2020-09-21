import React from 'react';
import './App.css';
import ReactDOM from 'react-dom';

var api_url = 'http://localhost:5000'

function api_getStatus(){
    return fetch(api_url + '/status/')
            .then(res => res.json())
}

function api_setManualMode(){
    return fetch(api_url + '/set_manual_mode/')
            .then(res => res.json())  
}

function api_setAutomaticMode(){
    return fetch(api_url + '/set_automatic_mode/')
            .then(res => res.json())  
}

function api_activateArea(areaId){
    return fetch(api_url + '/activate/' + areaId)
            .then(res => res.json())
}

function api_deactivate(){
    return fetch(api_url + '/deactivate/')
            .then(res => res.json())  
}

const daysOfWeek = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']

const formatTimeOfDay = (timeOfDay) => {
    let hour = Math.floor(timeOfDay / 4)
    const am = (hour <= 11)

    if(!am) hour -= 12

    if(hour === 0) hour = '12'

    const segment = timeOfDay % 4
    let timeStamp = hour + 
                    ':' + 
                    (segment === 0 ? '00' : (segment * 15))
                    +
                    (am ? 'am' : 'pm')
    

    return timeStamp
}

class App extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            manualMode : true,      //manual vs automatic
            wateringAreas : [],     //list of all watering area states
            wateringSchedules : [], //list of all watering schedules
        }

        //could combine these, but wouldnt allow for pure components
        this.setManualMode = this.setManualMode.bind(this)
        this.setAutomaticMode = this.setAutomaticMode.bind(this)
        this.activateArea = this.activateArea.bind(this)
        this.deactivateAllAreas = this.deactivateAllAreas.bind(this)

        this.refreshState = this.refreshState.bind(this)
    }

    setManualMode(){
        if(!this.state.manualMode)
            return api_setManualMode()      
                .then(this.refreshState)    
    }

    setAutomaticMode(){
        if(this.state.manualMode)
            return api_setAutomaticMode()      
                .then(this.refreshState)     
    }

    activateArea(areaId){
        console.log('activate area ' + areaId + '!')

        //lock ui

        return api_activateArea(areaId)
            .then(this.refreshState) //update state
    }

    deactivateAllAreas(){
        console.log('deactivate all areas!')

        //lock ui

        return api_deactivate()
            .then(this.refreshState) //update state
    }

    refresh(){
        console.log('refreshing!')

        //lock ui

        return api_getStatus()
            .then(this.refreshState)
    }

    refreshState(latestState){
        console.log('updating state')

        this.setState({
            manualMode : latestState.manualMode,
            wateringAreas : latestState.wateringAreas,
            wateringSchedules : latestState.wateringSchedules
        })

        //unlock ui
    }

    componentDidMount(){
        this.refresh()
            .then(() => {
                setInterval(() => this.refresh(), 3000)
            })
    }

    render(){
        return (
            <WateringSystem
                manualMode={this.state.manualMode}
                wateringAreas={this.state.wateringAreas}
                wateringSchedules={this.state.wateringSchedules}

                setManualMode={this.setManualMode}
                setAutomaticMode={this.setAutomaticMode}
                activateArea={this.activateArea}
                deactivateAllAreas={this.deactivateAllAreas}
            ></WateringSystem>
        )
    }
}

const WateringSystem = (props) => {
    return (
        <div className="content">
            <div className="heading">WATERING SYSTEM</div>

            <TabbedSystemMode 
                manualMode={props.manualMode}
                setManualMode={props.setManualMode}
                setAutomaticMode={props.setAutomaticMode}></TabbedSystemMode>
            
            <div className="modeContent"> 
                {props.manualMode ? 
                    <ManualWatering
                        wateringAreas={props.wateringAreas}
                        activateArea={props.activateArea}
                        deactivateAllAreas={props.deactivateAllAreas}></ManualWatering>
                    :
                    <ScheduledWatering
                        wateringSchedules={props.wateringSchedules}></ScheduledWatering>
                }
            </div>
        </div>
    )
}

const TabbedSystemMode = (props) => {
    return (
        <div className="tabs">
            <div 
                className={'modeButton' + (props.manualMode ? ' inactiveButton' : ' activeButton')}
                onClick={props.setAutomaticMode}>Scheduled</div>

            <div
                className={'modeButton' + (props.manualMode ? ' activeButton' : ' inactiveButton')}
                onClick={props.setManualMode}>Manual</div>
        </div>
        
    )
}

const ScheduledWatering = (props) => {
    return (
        <div className="scheduledContent">
            <div className="counts">{props.wateringSchedules.length} schedules</div>

            <div className="scheduledAreas">
                {props.wateringSchedules.map((schedule, idx) => 
                    <ScheduledArea 
                        key={idx}
                        dayOfWeek={schedule.dayOfWeek}
                        timeOfDay={schedule.timeOfDay}
                        name={schedule.name}
                        active={schedule.active}></ScheduledArea>)}
            </div>
        </div>
    )
}

const ScheduledArea = (props) => {
    return (
        <div className="scheduledArea">
            <div className={props.active ? 'activeAreaIndicator' : 'inactiveAreaIndicator'}></div>
            <div className="">
                {daysOfWeek[props.dayOfWeek]} {formatTimeOfDay(props.timeOfDay)} - 
            </div>
            <div className="areaName">{props.name}</div>
        </div>)
}


const ManualWatering = (props) => {
    return (
        <div className="manualContent">
            <div className="counts">{props.wateringAreas.length} areas</div>

            <div className="manualAreas">
                {props.wateringAreas.map((area, idx) => 
                    <ControlledArea 
                        key={idx}
                        name={area.name} 
                        active={area.active}
                        activateArea={() => props.activateArea(area.areaId)}
                        deactivateAllAreas={props.deactivateAllAreas}></ControlledArea>)}
            </div>
        </div>
    )
}

const ControlledArea = (props) => {
    return (
        <div className="manualArea">
            {props.active ? 
                <div className="manualButton stop" onClick={props.deactivateAllAreas}></div>
                :
                <div className="manualButton start" onClick={props.activateArea}></div>
            }

            <div className="areaName">{props.name}</div>
        </div>)
}

ReactDOM.render(<App/>, 
                document.getElementById('root'));

export default App;