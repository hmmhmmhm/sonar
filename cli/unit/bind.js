import Logger from '../../logger'

export default (sonar, active)=>{
    sonar.bind({
        host: active.ip,

        init: (server, option)=>{
            let serverIp = server.address()
            Logger(`UDP SERVER INITIALIZED... [${serverIp.address}:${serverIp.port}]`)
        },
        bind: (server, option)=>{
            let serverIp = server.address()
            Logger(`UDP SERVER BINDED... [${serverIp.address}:${serverIp.port}]`)

            let process = ()=>{
                console.log('')
                Logger(`SENDING PCAP PACKET...`)
                let sendAlert = sonar.send(`hello! world`, {
                    from: {
                        address: '1.2.3.4',
                        port: '5'
                    },
                    to: {
                        address: active.external,
                        port: serverIp.port
                    },
                    noRaw: false // IT MUST BE /FALSE/ WORK ON RAW.
                })
                if(sendAlert !== null)
                    Logger(`SENDING ALERT: ${sendAlert}`)
            }

            process()
            setInterval(process, 3000)
        },
        receive: (message, client, error, server, option)=>{
            let serverIp = server.address()
            Logger(`UDP MESSAGE RECEIVED... [${client.address}:${client.port}->${serverIp.address}:${serverIp.port}]`)
            Logger(String(message))
            console.log(message)
        }
    })
}