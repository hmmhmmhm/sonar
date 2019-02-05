import IpHeader from 'ip-header'
import UdpHeader from 'udp-header'
import Dgram from 'dgram'
import Ethernet from './lib/ethernet'

export default class SONAR {
    constructor(callback, active){
        try{
            this._cap = require('cap')
        }catch(e){
            // 드라이버가 없으면 이를 알립니다.
            if(typeof callback === 'function')
                callback(false, null, 'nmap not exist')

            this._cap = null
            this._driver = null
            this._active = null
            //this._isOpened = false
            return
        }

        // 드라이버가 있으면 인스턴스를 구성합니다.
        this._driver = new this._cap.Cap()
        this._active = active
        this._noRaw = null

        callback(true, this)
    }
    write(buffer){
        // 드라이버가 없으면 진행하지 않습니다.
        if(this._driver === null) return 'nmap not exist'

        // 전송 중 문제가 있다면
        // 해당 오류 메시지를 반환합니다.
        try{
            let bias = this._driver.send(buffer, buffer.length)
        }catch(e){ return e }

        return null
    }
    send(buffer, option){
        if(typeof option !== 'object')
            return 'option not exist'
        if(typeof buffer === 'string')
            buffer = Buffer.from(buffer)

        // 전송시 로우소켓을 이용하지 않는 옵션도 존재합니다.
        if(typeof option['noRaw'] !== 'undefined' && option['noRaw']){
            if(this._noRaw === null)
                this._noRaw = Dgram.createSocket('udp4')

            this._noRaw.send(buffer, 0, buffer.length, option.to.port, option.to.address, (err, bytes)=>{
                if (err) {
                    console.log(`UDP NO RAW PACKET SEND FAILURE: ${err}`)
                    throw err
                }
            })
            return null
        }

        option.message = buffer
        let udpBuffer = this.udpBufferIPv4(option)
        return this.write(udpBuffer)
    }
    udpBufferIPv4(option){
        let etherOpt = { type: 'ip' }
        etherOpt.src = this._active.mac // '00:25:22:46:15:16'
        etherOpt.dst = this._active.gateway.mac // '00:08:9f:07:7b:80'

        let udpHeaderSize = 8
        let packetSize = udpHeaderSize + option.message.byteLength

        let etherh = new Ethernet(etherOpt)
		let iph = new IpHeader({
			src: option.from.address,
			dst: option.to.address,
			protocol: 'udp',
			flags: { df: false },
			dataLength: packetSize
		})
		let udph = new UdpHeader({
			srcPort: option.from.port,
			dstPort: option.to.port,
			totalLength: packetSize
        })

		let packet = Buffer.concat([
            etherh.toBuffer(),
			iph.toBuffer(),
			udph.toBuffer(),

			option.message
        ])

        return packet
    }
    open(clientAddress){

        let devices = this._cap.deviceList()
        let foundedLoopback = null
        for(let device of devices){
            if(typeof device['flags'] !== 'undefined'){
                if(device.flags == 'PCAP_IF_LOOPBACK')
                    foundedLoopback = device
                break
            }
        }

        if(foundedLoopback === null){
            console.log(devices)
            throw new Error(`CAN'T FOUNDED SOCKET`)
        }

        let device = this._cap.Cap.findDevice(clientAddress)
        let filter = ''
        let bufSize = 10 * 1024 * 1024
        this.buffer = Buffer.alloc(65535)

        //let linkType = this._driver.open(foundedLoopback.name, filter, bufSize, this.buffer)
        let linkType = this._driver.open(device, filter, bufSize, this.buffer)
        this._driver.setMinBytes && this._driver.setMinBytes(0)

        return linkType
    }
    on(callback){
        if(typeof callback === 'function')
            this._driver.on('packet', callback)
    }
    bind(option){
        if(typeof option !== 'object')
            return false

        // 기본인자 초기화
        if(typeof option['type'] === 'undefined')
            option['type'] = 'udp'
        if(typeof option['port'] === 'undefined')
            option['port'] = null

        // 기본콜백 초기화
        let bindCallback = undefined
        if(typeof option['bind'] === 'function')
            bindCallback = option['bind']

        let receiveCallback = undefined
        if(typeof option['bind'] === 'function')
            receiveCallback = option['receive']

        // NPCAP 시작
        let linkType = this.open(option.host)
        switch(option.type){
            case 'udp':
                let server = Dgram.createSocket('udp4')
                server.on('listening', (error) => {
                    if(typeof option['init'] === 'function')
                        option['init'](server, option, error)
                })

                server.on('message', (msg, remote, error) => {
                    if(typeof receiveCallback === 'function')
                        receiveCallback(msg, remote, error, server, option)
                })

                server.bind({
                    port: option.port, 
                    address: option.host
                }, (error)=>{
                    if(typeof bindCallback === 'function')
                        bindCallback(server, option, error)
                })

                break
            case 'sonar':
                let decoders = this._cap.decoders
                let PROTOCOL = decoders.PROTOCOL

                if(typeof option['init'] === 'function')
                    option['init'](linkType, option)

                this.on((nbytes, trunc)=>{

                    // raw packet data === buffer.slice(0, nbytes)

                    if (linkType === 'ETHERNET') {
                        let ret = decoders.Ethernet(this.buffer)

                        // console.log('packet: length ' + nbytes + ' bytes, truncated? ' + (trunc ? 'yes' : 'no'))

                        if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {

                            let retm = ret
                            ret = decoders.IPV4(this.buffer, ret.offset)
                            //console.log('RECEIVED PCAP PACKET...')
                            // if(String(ret.info.srcaddr) != String(ret.info.dstaddr)) return

                            if (ret.info.protocol === PROTOCOL.IP.TCP) {
                                return
                                let datalen = ret.info.totallen - ret.hdrlen

                                console.log('Decoding TCP ...')
 
                                ret = decoders.TCP(this.buffer, ret.offset)
                                console.log(' from port: ' + ret.info.srcport + ' to port: ' + ret.info.dstport)
                                datalen -= ret.hdrlen
                                console.log(new Buffer(this.buffer.toString('binary', ret.offset, ret.offset + datalen)))
                            } else if (ret.info.protocol === PROTOCOL.IP.UDP) {
                                //if(String(ret.info.srcaddr) != '18.18.18.18') return

                                let retb = ret
                                ret = decoders.UDP(this.buffer, ret.offset)
                                let data = this.buffer.toString('binary', ret.offset, ret.offset + ret.info.length)
                                if(data != 'hello! world') return
                                //if(retb.info.srcaddr == '58.233.73.13') return
                                //if(retb.info.dstaddr == '58.233.73.13') return

                                console.log('')
                                console.log('Decoding IPv4 ...')
                                console.log('from: ' + retb.info.srcaddr + ' to ' + retb.info.dstaddr)
                                console.log('Decoding UDP ...')
                                console.log(' from port: ' + ret.info.srcport + ' to port: ' + ret.info.dstport)
                                console.log(retm)
                                console.log(retb)
                                console.log(ret)
                                console.log(Buffer.from(this.buffer.toString('binary', ret.offset, ret.offset + ret.info.length)))
                                console.log(Buffer.from(this.buffer.toString('binary', ret.offset, ret.offset + ret.info.length)).byteLength)
                                console.log(this.buffer.toString('binary', ret.offset, ret.offset + ret.info.length))
                            } //else
                                //console.log('Unsupported IPv4 protocol: ' + PROTOCOL.IP[ret.info.protocol])
                        } else {
                            /*
                            console.log('Decoding IPv4 ...')
                            console.log('from: ' + ret.info.srcaddr + ' to ' + ret.info.dstaddr)
                            console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type])
                            console.log(ret.info)
                            console.log(ret)
                            */
                        }
                    }
                })

                if(typeof bindCallback === 'function')
                    bindCallback(linkType, option)

                break
            default:
                throw new Error('undefined bind type')
        }
        return true
    }
}