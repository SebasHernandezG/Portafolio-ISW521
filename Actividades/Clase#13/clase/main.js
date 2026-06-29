const miAnimal = new animal("Michi", "gato", 2);
const miPerro = new perro("Max", "Labrador", 3);

document.getElementById("infoAnimal").textContent = miAnimal.importarInfo();
document.getElementById("infoPerro").textContent = miPerro.importarInfo();
document.getElementById("ladridoPerro").textContent = miPerro.ladrar();

console.log(miAnimal.importarInfo());
console.log(miPerro.importarInfo());
console.log(miPerro.ladrar());
