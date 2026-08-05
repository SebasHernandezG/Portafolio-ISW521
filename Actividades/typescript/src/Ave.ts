export class Ave {
    nombre: string;
    edad: number;

    constructor(nombre: string, edad: number) {
        this.nombre = nombre;
        this.edad = edad;
    }

    volar(): void {
        console.log(`${this.nombre} esta volando.`);
    }

    sonido(): void {
        console.log(`${this.nombre} hace un sonido.`);
    }
}
