import React from 'react';

export default function DevicePage ({ devices, sendDeviceProp }) {
    const [ freq, setFreq ] = React.useState(20);
    const [ debug, setDebug ] = React.useState(true);
    const [ command, setCommand ] = React.useState("");
    const [ brightness, setBrightness ] = React.useState(1000);

    function setLight (deviceName, value) {
        sendDeviceProp(deviceName, "light", value ? "1" : "0");
    }

    function setSpeed (deviceName, value) {
        sendDeviceProp(deviceName, "speed", value)
    }

    function setDeviceFreq (deviceName, value) {
        sendDeviceProp(deviceName, "freq" ,value);
    }

    function setAllDebug (value) {
      for (const device of devices) {
        sendDeviceProp(device.id, "debug", value ? "1" : "0");
      }
      setDebug(value);
    }
    
    function sendCommand (command) {
        const [ name, kv ] = command.split(":");
        const [ key, value ] = kv.split("=");
        sendDeviceProp(name.trim(), key.trim(), value.trim());
    }  
  
    function stopDevice (deviceName) {
      sendDeviceProp(deviceName, "stop", "stop");
    }
  
    function allStop () {
      for (const device of devices) {
        stopDevice(device.id);
      }
    }
    
    React.useEffect(() => {
        const listener = e => {
        if (e.key === ",") {
            for (const device of devices) {
            setSpeed(device.id, Math.max(-1000, +device.speed - 100));
            }
        } else if (e.key === ".") {
            for (const device of devices) {
            setSpeed(device.id, Math.min(1000, +device.speed + 100));
            }
        } else if (e.key === " ") {
            allStop();
        } else if (e.key === "[") {
            const newFreq = freq - 10;
            for (const device of devices) {
            setDeviceFreq(device.id, newFreq);
            }
            setFreq(newFreq);
        } else if (e.key === "]") {
            const newFreq = freq + 10;
            for (const device of devices) {
            setDeviceFreq(device.id, newFreq);
            }
            setFreq(newFreq);
        } else if (e.key === "-") {
            const newBrightness = brightness - 100;
            for (const device of devices) {
            sendDeviceProp(device.id, "light_brightness", newBrightness);
            }
            setBrightness(newBrightness);
        } else if (e.key === "=") {
            const newBrightness = brightness + 100;
            for (const device of devices) {
            sendDeviceProp(device.id, "light_brightness", newBrightness);
            }
            setBrightness(newBrightness);
        }
        };

        document.addEventListener("keypress", listener);

        return () => document.removeEventListener("keypress", listener);
    }, [devices, freq]);


    return (
        <div>
            <div>Freq: {freq}</div>
            <div>Brightness: {brightness}</div>
            <label><input type="checkbox" checked={debug} onChange={e => setAllDebug(e.target.checked)} /> Debug</label>
            <Devices devices={devices} setSpeed={setSpeed} setLight={setLight} />
            <button onClick={() => setLight("all", true)}>All On</button>
            <button onClick={() => setLight("all", false)}>All Off</button>
            <form onSubmit={e => { e.preventDefault(); sendCommand(command); setCommand("")}}>
                <input value={command} onChange={e => setCommand(e.target.value)} style={{width:300}} />
                <button>Send</button>
            </form>
        </div>
    )
}

function Devices ({ devices, setSpeed, setLight }) {
    return (
      <div className="devices">
        { devices.map( device => <Device key={device.id} device={device} setSpeed={setSpeed} setLight={setLight} />) }
      </div>
    )
}
  
function Device ({ device, setSpeed, setLight }) {
    return (
      <div className="device" onClick={() => setLight(device.id, !device.light)} >
        <p className="name">{device.id}</p>
        <p className="time">{`${Math.round((Date.now() - +new Date(device.start))/1000)} seconds`}</p>
        <button onClick={e => { e.stopPropagation(); setSpeed(device.id, Math.max(-1000, +device.speed - 100)); }}>&lt;</button>
        <input type="number"
            min={-1000}
            max={1000}
          value={device.speed}
          onChange={e => setSpeed(device.id, +e.target.value)}
          onClick={e => e.stopPropagation()}
        />
        <button onClick={e => { e.stopPropagation(); setSpeed(device.id, Math.min(1000, +device.speed + 100)); }}>&gt;</button>
        <div className={`light light-${device.light?"on":"off"}`} />
      </div>
    );
  }
  