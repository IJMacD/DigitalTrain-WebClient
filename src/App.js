import React from "react";

const API_ROOT = `http://rail_master:8080`;

export default () => {
  const [ devices, setDevices ] = React.useState([]);
  const [ freq, setFreq ] = React.useState(20);
  const [ debug, setDebug ] = React.useState(true);
  const [ command, setCommand ] = React.useState("");
  const [ brightness, setBrightness ] = React.useState(1000);
  
  async function fetchStatus () {
    const r = await fetch(API_ROOT + "/status");
    setDevices(await r.json());
  }

  function setLight (deviceName, value) {
    sendDeviceProp(deviceName, "light", value ? "1" : "0");
  }

  function setSpeed (deviceName, value) {
    sendDeviceProp(deviceName, "speed", value)
  }

  function setDeviceFreq (deviceName, value) {
    sendDeviceProp(deviceName, "freq" ,value);
  }

  function stopDevice (deviceName) {
    sendDeviceProp(deviceName, "stop", "stop");
  }

  async function sendDeviceProp (deviceName, prop, value) {
      const body = new URLSearchParams();
      body.set("name", deviceName);
      body.set(prop, value);
      await fetch (API_ROOT + "/update", {
          method: "post",
          body,
      });
      fetchStatus();
  }

  function allStop () {
    for (const device of devices) {
      stopDevice(device.name);
    }
  }

  function setAllDebug (value) {
    for (const device of devices) {
      sendDeviceProp(device.name, "debug", value ? "1" : "0");
    }
    setDebug(value);
  }

  function sendCommand (command) {
    const [ name, kv ] = command.split(":");
    const [ key, value ] = kv.split("=");
    sendDeviceProp(name.trim(), key.trim(), value.trim());
  }
  
  React.useEffect(() => {
    const intervalRef = setInterval(fetchStatus, 1000);

    return () => clearInterval(intervalRef);
  }, []);

  React.useEffect(() => {
    const listener = e => {
      if (e.key === ",") {
        for (const device of devices) {
          setSpeed(device.name, Math.max(0, +device.speed - 100));
        }
      } else if (e.key === ".") {
        for (const device of devices) {
          setSpeed(device.name, Math.min(1000, +device.speed + 100));
        }
      } else if (e.key === " ") {
        allStop();
      } else if (e.key === "[") {
        const newFreq = freq - 10;
        for (const device of devices) {
          setDeviceFreq(device.name, newFreq);
        }
        setFreq(newFreq);
      } else if (e.key === "]") {
        const newFreq = freq + 10;
        for (const device of devices) {
          setDeviceFreq(device.name, newFreq);
        }
        setFreq(newFreq);
      } else if (e.key === "-") {
        const newBrightness = brightness - 100;
        for (const device of devices) {
          sendDeviceProp(device.name, "light_brightness", newBrightness);
        }
        setBrightness(newBrightness);
      } else if (e.key === "=") {
        const newBrightness = brightness + 100;
        for (const device of devices) {
          sendDeviceProp(device.name, "light_brightness", newBrightness);
        }
        setBrightness(newBrightness);
      }
    };

    document.addEventListener("keypress", listener);

    return () => document.removeEventListener("keypress", listener);
  }, [devices, freq]);

  return (
    <>
      <button className="stop-btn" onClick={allStop}>STOP</button>
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
    </>
  );
};

function Devices ({ devices, setSpeed, setLight }) {
  return (
    <div className="devices">
      { devices.map( device => <Device key={device.name} device={device} setSpeed={setSpeed} setLight={setLight} />) }
    </div>
  )
}

function Device ({ device, setSpeed, setLight }) {
  return (
    <div className="device" onClick={() => setLight(device.name, !device.light)} >
      <p className="name">{device.name}</p>
      <p className="time">{`${Math.round((Date.now() - +new Date(device.start))/1000)} seconds`}</p>
      <button onClick={e => { e.stopPropagation(); setSpeed(device.name, Math.max(0, +device.speed - 100)); }}>&lt;</button>
      <input type="number"
        value={device.speed}
        onChange={e => setSpeed(device.name, +e.target.value)}
        onClick={e => e.stopPropagation()}
      />
      <button onClick={e => { e.stopPropagation(); setSpeed(device.name, Math.min(1000, +device.speed + 100)); }}>&gt;</button>
      <div className={`light light-${device.light?"on":"off"}`} />
    </div>
  );
}