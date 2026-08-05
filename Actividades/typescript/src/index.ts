import { Estudiante } from "./estudiante";
import { Pato } from "./pato";

const nombre = "Jeff";
const nombre2 = "hola profe esta a cachete";

function saludar(nombre: string): void {
    console.log(`Hola ${nombre}`);
}

function sumar(a: number, b: number): number {
    return a + b;
}

function restar(a: number, b: number, c?: number): number {
    return a - b - (c ?? 0);
}

console.log(nombre2);
saludar(nombre);
console.log(`La suma es: ${sumar(10, 5)}`);
console.log(`La resta es: ${restar(10, 5)}`);

const estudiante1 = new Estudiante("Jeff", 20, "Gonzalez", "119240733");
estudiante1.matricular();

const pato = new Pato("Donald", 5, "blanco");
pato.volar();
pato.nadar();
pato.sonido();

