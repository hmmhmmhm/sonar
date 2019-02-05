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
export default class MAC{
    /**
     * @param {string} mac 
     * @returns {boolean}
     */
    static isMAC(mac){
        if(mac === undefined) return false

        try{
            let copy = String(mac).split(':')
            if(copy.length != 6) return false

            for(let set of copy){
                if(set.length != 2) return false
                for(let item of set.split('')){
                    let n = parseInt(item, 16)
                    if(isNaN(n)) return false
                }
            }
        }catch(e){ return false }

        return true
    }

    /**
     * @param {buffer} buffer 
     * @param {number} offset 
     */
	static toString(buffer, offset){
		offset = ~~offset

        let addressClass = []

		for (let i = 0; i < MAC.length; ++i) {
			let classByte = buffer.readUInt8(offset + i)
			let classString = classByte.toString(16)
            if (classString.length == 1) classString = `0${classString}`
			addressClass.push(classString)
		}

		return addressClass.join(':')
    }

    /**
     * @param {string} macString 
     * @param {buffer} buffer 
     * @param {number} offset 
     */
    static toBuffer(macString, buffer, offset){
		offset = ~~offset

        if (!MAC.isMAC(macString))
			throw new Error(`Invalid MAC Address: ${macString}`)

        if(!(buffer instanceof Buffer))
            buffer = Buffer.alloc(MAC.length + offset)

        let addressClass = macString.split(':')
		for (let i = 0; i < MAC.length; ++i) {
			let classByte = parseInt(addressClass[i], 16)
			buffer.writeUInt8(classByte, offset + i)
		}

		return buffer
    }

	static get length(){
		return 6 // NO SUPPORT EXTERNAL TYPES
    }
    static get full(){
        return 'ff:ff:ff:ff:ff:ff'
    }
    static get empty(){
        return '00:00:00:00:00:00'
    }
}