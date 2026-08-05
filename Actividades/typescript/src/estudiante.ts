export class Estudiante {
    nombre: string;
    edad: number;
    primer_apellido: string;
    cedula: string;

    constructor(nombre: string, edad: number, primer_apellido: string, cedula: string) {
        this.nombre = nombre;
        this.edad = edad;
        this.primer_apellido = primer_apellido;
        this.cedula = cedula;
    }

    matricular(): void {
        console.log(
            `La cedula es: ${this.cedula}, nombre: ${this.nombre}, edad: ${this.edad}, primer apellido: ${this.primer_apellido}`
        );
    }
}
