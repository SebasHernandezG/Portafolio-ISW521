import { Ave } from "./Ave";

export class Pato extends Ave {
    color: string;

    constructor(nombre: string, edad: number, color: string) {
        super(nombre, edad);
        this.color = color;
    }

    nadar(): void {
        console.log(`${this.nombre} esta nadando.`);
    }

    sonido(): void {
        console.log(`${this.nombre} dice: cuac, cuac.`);
    }
}
