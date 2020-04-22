import React from "react";
import Diagram from './BlocksUI/Diagram';
import execute from "./blocks";
import StatementBlock from "./BlocksUI/StatementBlock";

const API_ROOT = `http://rail_master:8080`;

const SAVE_KEY = "digital-train-saved-blocks";

export default () => {
  const [ devices, setDevices ] = React.useState([]);
  const [ freq, setFreq ] = React.useState(20);
  const [ debug, setDebug ] = React.useState(true);
  const [ command, setCommand ] = React.useState("");
  const [ brightness, setBrightness ] = React.useState(1000);
  const [ blocks, setBlocks ] = useSavedState(SAVE_KEY, [ { id: "setup", type: "once" }, { id:"loop", type: "forever" } ]);
  const context = React.useRef({ running: false, getRunner });
  
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

  function updateBlock (block, newBlock) {
    // Not immutable
    Object.assign(block, newBlock);
    setBlocks(blocks);
  }

  function getRunner (block) {
    if (block.type === "loco-set") {
      return block => sendDeviceProp(block.device, block.prop, block.value);
    }
  }

  /**
   * 
   * @param {Block} block 
   * @returns {React.ReactElement}
   */
  function makeBlock (block) {
    if (block.type === "loco-set") {
      return <StatementBlock block={block} snapPoints={[{ type: "append", bottom: 0 }]} content={<LocoSetContent devices={devices} block={block} updateBlock={newBlock => updateBlock(block, newBlock)}  />} />;
    }
  }

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
      <button onClick={() => { context.current.running = true; execute(blocks, context.current); }}>Run</button>
      <button onClick={() => context.current.running = false }>Stop</button>
      <Diagram blocks={blocks} setBlocks={setBlocks} makeBlock={makeBlock} />
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

function LocoSetContent ({ block, devices, updateBlock }) {
  const [ prop, setProp ] = React.useState(block.prop||"");
  const [ value, setValue ] = React.useState(block.value||"");
  return (
    <div className="AppBlock-LocoSet-content">
      <p>Set Loco Property</p>
      <label><span>Device: </span><select value={block.device||""} onChange={e => updateBlock({ device: e.target.value })}><option />{devices.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</select></label>
      <label><span>Property: </span><input value={prop} onChange={e => setProp(e.target.value)} onBlur={() => updateBlock({ prop })}/></label>
      <label><span>Value: </span><input value={value} onChange={e => setValue(e.target.value)} onBlur={() => updateBlock({ value })}/></label>
    </div>
  );
}

function useSavedState(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      throttle(() => {
        const t = performance.now();
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        console.log("Saving took " + (performance.now() - t) + " ms");
      }, 10000);
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

// My own dodgy throttle implementation
let throttling = false;
function throttle (fn, t) {
  if (!throttling) {
    fn();
    throttling = true;
    setTimeout(() => throttling = false, t);
  }
  }

// My own dodgy throttle implementation
function useThrottle (fn, t) {
  const ref = React.useRef(false);

  return function run (...args) {
    if (!ref.current) {
      fn(...args);
      ref.current = true;
      setTimeout(() => ref.current = false, t);
    }
  }
}