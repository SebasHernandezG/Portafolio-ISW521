class perro extends animal {
    constructor(nombre, raza, edad) {
        super(nombre, "perro", edad);
        this.raza = raza;
    }

    importarInfo() {
        return `${super.importarInfo()} y es de raza ${this.raza}`;
    }

    ladrar() {
        return `${this.nombre} ladra: Guau guau`;
    }
}
