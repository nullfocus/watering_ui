import React from 'react';
import './App.css';
import ReactDOM from 'react-dom';

var api_url = 'http://192.168.1.243' + ':5000' //192.168.1.243

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

function api_setSchedule(dayOfWeek, timeOfDay, areaId){
    return fetch(api_url + '/set_schedule/'+dayOfWeek+'/'+timeOfDay+'/'+areaId+'/')
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
            addingSchedule : false,
            wateringAreas : [],     //list of all watering area states
            wateringSchedules : [], //list of all watering schedules
        }

        //could combine these, but wouldnt allow for pure components
        this.setManualMode = this.setManualMode.bind(this)
        this.setAutomaticMode = this.setAutomaticMode.bind(this)
        this.startAddingSchedule = this.startAddingSchedule.bind(this)
        this.finishAddingSchedule = this.finishAddingSchedule.bind(this)
        this.submitNewSchedule = this.submitNewSchedule.bind(this)
        this.deleteScheduledArea = this.deleteScheduledArea.bind(this)

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

    startAddingSchedule(){
        this.setState({
            addingSchedule : true
        })
    }

    finishAddingSchedule(){
        this.setState({
            addingSchedule : false
        })
    }

    submitNewSchedule(dayOfWeek, timeOfDay, areaId){
        console.log('/submitNewSchedule /'+dayOfWeek+'/'+timeOfDay+'/'+areaId+'/')

        return api_setSchedule(dayOfWeek, timeOfDay, areaId)
            .then(this.refreshState)
    }

    deleteScheduledArea(dayOfWeek, timeOfDay){
        console.log('/submitNewSchedule /'+dayOfWeek+'/'+timeOfDay+'/null/')

        return api_setSchedule(dayOfWeek, timeOfDay, 'null')
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
                activateArea={this.activateArea}
                deactivateAllAreas={this.deactivateAllAreas}

                setAutomaticMode={this.setAutomaticMode}
                startAddingSchedule={this.startAddingSchedule}
                finishAddingSchedule={this.finishAddingSchedule}
                submitNewSchedule={this.submitNewSchedule}
                deleteScheduledArea={this.deleteScheduledArea}
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
                        wateringAreas={props.wateringAreas}
                        wateringSchedules={props.wateringSchedules}
                        startAddingSchedule={props.startAddingSchedule}
                        finishAddingSchedule={props.finishAddingSchedule}
                        submitNewSchedule={props.submitNewSchedule}
                        deleteScheduledArea={props.deleteScheduledArea}></ScheduledWatering>
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
            <div className="counts">{props.wateringSchedules.length} schedules
                {props.addingSchedule ? 
                    <div className="addSchedule add" onClick={props.startAddingSchedule}>Add</div>
                    :
                    <div className="addSchedule done" onClick={props.finishAddingSchedule}>Done</div>
                }
            </div>

            <NewSchedulePanel 
                wateringAreas={props.wateringAreas}
                submitNewSchedule={props.submitNewSchedule}></NewSchedulePanel>

            <div className="scheduledAreas">
                {props.wateringSchedules.map((schedule, idx) => 
                    <ScheduledArea 
                        key={idx}
                        dayOfWeek={schedule.dayOfWeek}
                        timeOfDay={schedule.timeOfDay}
                        name={schedule.name}
                        active={schedule.active}
                        deleteScheduledArea={() => { props.deleteScheduledArea(schedule.dayOfWeek,schedule.timeOfDay) }}></ScheduledArea>)}
            </div>
        </div>
    )
}

class NewSchedulePanel extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            wateringAreas : props.wateringAreas,
            submitNewSchedule : props.submitNewSchedule,

            dayOfWeek : 0,
            timeOfDay : 0,
            areaId : 0
        }

        this.dayChange = this.dayChange.bind(this)
        this.timeChange = this.timeChange.bind(this)
        this.areaChange = this.areaChange.bind(this)
        this.submitNewSchedule = this.submitNewSchedule.bind(this)
    }

    dayChange(e){
        var dayId = e.target.value
        this.setState({dayOfWeek : dayId})
    }

    timesOfDay(){
        var times = []

        for(var i = 0; i < 96; i++){
            times.push(formatTimeOfDay(i))
        }

        return times
    }

    timeChange(e){
        var timeOfDay = e.target.value
        this.setState({timeOfDay : timeOfDay})
    }

    areaChange(e){

        var areaId = e.target.value
        this.setState({areaId : areaId})
    }

    submitNewSchedule(){
        this.state.submitNewSchedule(
            this.state.dayOfWeek,
            this.state.timeOfDay,
            this.state.areaId
        )
    }

    render(){
        return (
            <div className="scheduleEdit">
                <select value={this.state.dayOfWeek} onChange={this.dayChange}>
                    {daysOfWeek.map((dayName, i) => <option key={i} value={i}>{dayName}</option>)}
                </select>

                <select value={this.state.timeOfDay} onChange={this.timeChange}>
                    {this.timesOfDay().map((time, i) => <option key={i} value={i}>{time}</option>)}
                </select>

                <select value={this.state.areaId} onChange={this.areaChange}>
                    {this.state.wateringAreas.map((area, i) => <option key={i} value={area.areaId}>{area.name}</option>)}
                </select>

                <button onClick={this.submitNewSchedule}>Add</button>

            </div>
        )
    }
}


const ScheduledArea = (props) => {
    return (
        <div className="scheduledArea">
            <div className={props.active ? 'activeAreaIndicator' : 'inactiveAreaIndicator'}></div>
            <div className="">
                {daysOfWeek[props.dayOfWeek]} {formatTimeOfDay(props.timeOfDay)} - 
            </div>
            <div className="areaName">{props.name}</div>
            <div className="deleteSchedule" onClick={props.deleteScheduledArea}>X</div>
        </div>)
}


const ManualWatering = (props) => {
    return (
        <div className="manualContent">
            <div className="counts">{props.wateringAreas.length} areas</div>

            <div className="manualAreas">
                {props.wateringAreas.map((area, idx) => 
                    <ManualArea 
                        key={idx}
                        name={area.name} 
                        active={area.active}
                        activateArea={() => props.activateArea(area.areaId)}
                        deactivateAllAreas={props.deactivateAllAreas}></ManualArea>)}
            </div>
        </div>
    )
}

const ManualArea = (props) => {
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