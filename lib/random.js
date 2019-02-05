export default class Random {
    static get(min, max){
        return Math.floor(Math.random() * (max - min) + min)
    }
    static getPort(){
        return Random.get(1,65534)
    }
    static getIPv4(){
        let addressClass = []
        for(let i=1;i<=4;i++)
            addressClass.push(Random.get(1,254))
        return addressClass.join('.')
    }
}