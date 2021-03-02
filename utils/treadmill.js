const noble = require('@abandonware/noble');

async function findTreadmill() {
    console.error("finding treadmill");
    const handle = setInterval(() => console.error("still living"), 1000);
    return new Promise(async (resolve) => {
        noble.on('discover', async (peripheral) => {
            console.error("peripheral found " + peripheral.address)
            clearInterval(handle);
            if (!peripheral?.advertisement?.localName?.includes("V-RUN")) {
                return;
            }
            await noble.stopScanningAsync();
            resolve(peripheral);
        });
        console.error("start scanning for peripherals")
        await noble.startScanningAsync([], false);
    })
}

async function getTreadmillWriteCharacteristic(treadmill) {
    const {characteristics} = await treadmill.discoverSomeServicesAndCharacteristicsAsync(
        ["fff0"], []);
    return characteristics.find(
        characteristic => characteristic.uuid === "fff2");
}

module.exports = {
    findTreadmill,
    getTreadmillWriteCharacteristic: getTreadmillWriteCharacteristic
}
