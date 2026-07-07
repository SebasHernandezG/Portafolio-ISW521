const estudiantes =[{nombre: "ana", promedio: 85},
    {nombre: "luis", promedio: 67},
    {nombre: "maria", promedio: 90}
];
const estudiantesAprobados = estudiantes.filter(estudiante => estudiante.promedio >= 70).map(estudiante => `Nombre: ${estudiante.nombre}, Promedio: ${estudiante.promedio}`.toUpperCase());
console.log(estudiantesAprobados);
//se uso filter 