class animal {
    constructor(nombre, especie, edad) {
        this.nombre = nombre;
        this.especie = especie;
        this.edad = edad;
    }

    importarInfo() {
        return `${this.nombre} es un ${this.especie} de ${this.edad} anios`;
    }
}
