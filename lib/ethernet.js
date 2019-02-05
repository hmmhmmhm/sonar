// Copyright (c) 2013, Benjamin J. Kelly ("Author")
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

/**
 * @author https://github.com/wanderview
 */
import MAC from './mac'

const TYPE_TO_STRING = {
  0x0800: 'ip',
  0x0806: 'arp'
}

const TYPE_FROM_STRING = {
  ip: 0x0800,
  arp: 0x0806
}

export default class Ethernet {
    constructor(option){
        if (option instanceof Buffer)
            return Ethernet.fromBuffer(option)

        option = option || {}
        this.src = option.src || MAC.empty
        this.dst = option.dst || MAC.full

        if (option.type) {
            this.type = option.type
            this.typeCode = TYPE_FROM_STRING[this.type]
        } else if (option.typeCode) {
            this.typeCode = option.typeCode
            this.type = TYPE_TO_STRING[this.typeCode]
        } else {
            this.type = 'ip'
            this.typeCode = TYPE_FROM_STRING[this.type]
        }

        if (typeof this.typeCode !== 'number')
            throw(new Error('Unsupported type [' + this.type + ']'))

        this.length = option.length || 14

        if (this.length !== 14) {
            throw new Error(
                'Unsupported ethernet frame length [' + this.length +
                ']; must be 14 as only most common cases are implemented.')
        }

        return this
    }

    fromBuffer(buffer, offset) {
        offset = ~~offset
        let length = 0

        let dst = MAC.toString(buffer, offset + length)
        length += MAC.length

        let src = MAC.toString(buffer, offset + length)
        length += MAC.length

        let typeCode = buffer.readUInt16BE(offset + length)
        length += 2

        let type = TYPE_TO_STRING[typeCode]
        if (!type) 
            throw(new Error('Unsupported type code [' + typeCode + ']'))

        return new Ethernet({
            dst,
            src,
            type,
            typeCode,
            length
        })
    }

    toBuffer(buffer, offset) {
        offset = ~~offset
        buffer = (buffer instanceof Buffer) ?
            buffer : Buffer.alloc(offset + this.length)

        MAC.toBuffer(this.dst, buffer, offset)
        offset += MAC.length

        MAC.toBuffer(this.src, buffer, offset)
        offset += MAC.length

        buffer.writeUInt16BE(this.typeCode, offset)
        offset += 2

        return buffer
    }
}