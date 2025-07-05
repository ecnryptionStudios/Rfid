const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const possibleBaudRates = [9600, 115200];

let port;
let parser;
let lastRead = null;
let tapHandler = null;

async function autoDetectPortAndStart() {
    const ports = await SerialPort.list();
    console.log('Available ports:', ports.map(p => p.path));

    for (const p of ports) {
        for (const baudRate of possibleBaudRates) {
            try {
                console.log(`Trying ${p.path} at baud ${baudRate}`);
                const testPort = new SerialPort(p.path, { baudRate, autoOpen: false });

                await new Promise((resolve, reject) => {
                    testPort.open(err => err ? reject(err) : resolve());
                });

                const testParser = testPort.pipe(new Readline({ delimiter: '\r\n' }));

                let found = false;

                // Wait briefly to see if data comes in
                await new Promise(resolve => {
                    const timeout = setTimeout(() => resolve(), 2000);

                    testParser.once('data', line => {
                        console.log('Got data:', line);
                        if (line) {
                            found = true;
                            lastRead = line;
                            clearTimeout(timeout);
                            resolve();
                        }
                    });
                });

                if (found) {
                    console.log(`Using port: ${p.path} at baud ${baudRate}`);
                    port = testPort;
                    parser = testParser;

                    // Listen for future data
                    parser.on('data', line => {
                        console.log('Received:', line);
                        lastRead = line;
                        if (tapHandler) tapHandler();
                    });

                    return;
                } else {
                    testPort.close();
                }

            } catch (err) {
                console.log(`Failed to open ${p.path} at baud ${baudRate}:`, err.message);
            }
        }
    }

    throw new Error('No RFID reader detected.');
}

function read() {
    return lastRead;
}

function write(data) {
    if (!port) {
        console.error('RFID port not ready yet.');
        return;
    }
    port.write(`WRITE:${data}\n`, err => {
        if (err) console.error('Write failed:', err.message);
        else console.log('Write successful:', data);
    });
}

function onTap(handler) {
    tapHandler = handler;
}

// Start auto-detection immediately
autoDetectPortAndStart().catch(err => console.error('Auto-detect failed:', err));

module.exports = { read, write, onTap };
