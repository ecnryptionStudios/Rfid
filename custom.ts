import {read, write, onTap} from "./assets/js/custom.js"
namespace Rfid{
    //%block="read last data from the rfid scanner"
    export function rfidRead(){
        return read()
    }
    //%block="write $to to the rfid"
    export function rfidWrite(to: any){
        write(to)
    }
    //%block
    export function onRfidTap(handler: ()=>{}){
        onTap(handler)
    }
}
