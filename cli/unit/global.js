import SONAR from '../../sonar'
import Interface from '../../lib/interface'
import Logger from '../../logger'

import path from 'path'
import fs from 'fs'

export default (callback)=>{
    if(typeof callback !== 'function') return

    Logger(null, `SUBMARINE#1`)
    Logger(`Initialize Sequence Start.`)

    Logger(`Network Initiating..`)
    Interface((active)=>{
        if(active === null){
            Logger('Network Initiating.. [FAIL]')
            Logger('Failed to find an available network card.')
            Logger('Please check your internet connection.')
            return
        }
        Logger('Network Initiated.\n')
        Logger(`Stealth Host: ${active.external} [${active.ip}] [${active.mac}]`)
        Logger(`Type: [${active.type}] GateWay: ${active.gateway.ip} [${active.gateway.mac}]\n`)

        Logger(`Socket Initiating..`)

        let configPath = path.resolve(`${__dirname}../../data/config.json`)
        if(!fs.existsSync(configPath)){
            let defaultConfig = {
                receivePort: 12345
            }
        }

        let sonar = new SONAR((isLoaded, sonar)=>{
            if(!isLoaded){
                Logger('Socket Initiating.. [FAIL]')
                Logger('Please get npcap program and install it.')
                Logger('WinPcap API-compatible Mode must be checked.')
                return
            }
            Logger('Socket Initiated.\n')
            callback(sonar)
        }, active)

    }, true)
}