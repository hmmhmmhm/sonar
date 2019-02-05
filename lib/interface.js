import network from 'network'
import arp from  'node-arp'
import fs from 'fs'
import os from 'os'
import path from 'path'

export default (callback, needToCache = null, noNeedPublicIp = false) => {
    if(typeof callback !== 'function') return

    let active = {
        ip: null,
        mac: null,
        netmask: null,
    
        gateway: {
            ip: null,
            mac: null
        },
    
        vendor: null,
        model: null,
    
        name: null,
        type: null,
        external: null
    }

    let interfacePath = path.resolve(`${__dirname}/../data/interface.json`)
    let currentInterfaces = os.networkInterfaces()

    if(fs.existsSync(interfacePath)){
        let savedData = JSON.parse(fs.readFileSync(interfacePath))

        if(typeof savedData['os'] !== 'undefined'
            && typeof savedData['active'] !== 'undefined'){
            let savedInterfaces = JSON.stringify(savedData['os'])

            if(savedInterfaces == JSON.stringify(currentInterfaces)){
                callback(savedData['active'])
                return
            }
        }
    }

    let cacheIt = (active)=>{
        let cache = JSON.stringify({
            os: currentInterfaces,
            active
        }, null, 4)
        fs.writeFileSync(interfacePath, cache)
    }
    
    network.get_active_interface((error, resource) => {
        if(error !== null){
            callback(null, 'No Network Card')
            return
        }
    
        active.ip = resource.ip_address
        active.mac = resource.mac_address
        active.netmask = resource.netmask
    
        active.vendor = resource.vendor
        active.model = resource.model
    
        active.name = resource.name
        active.type = resource.type

        arp.getMAC(resource.gateway_ip, (error, gatewayMAC) => {
            if(error !== false){
                callback(null, 'No Gateway')
                return
            }
            active.gateway.ip = resource.gateway_ip
            active.gateway.mac = gatewayMAC

            if(noNeedPublicIp){
                callback(active)
                cacheIt(active)
            }else{
                network.get_public_ip((error, externalIp) => {
                    if(error === null)
                        active.external = externalIp
                    callback(active)
                    cacheIt(active)
                })
            }
        })
    })
}