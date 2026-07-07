//Uso de map,filter, pop y sort
//actividad 3

const estudiantes =[
    { nombre: "ana", carnet: "2024001"}, 
    { nombre: "luis", carnet: "2024002"}
];


estudiantes.map(estudiante => `Nombre: ${estudiante.nombre}, Carnet: ${estudiante.carnet}`.toUpperCase);

//Se uso interpolacion y map para reescribir el codigo 