//const v8  = require('v8');
//const variable = v8.getHeapStatistics();
//console.log(variable);

//const tamano = v8. serialize(v8.getHeapStatistics).lastIndexOf('v8');
//console.log(`la variable deltamaño es de ${tamano} bytes`);

 //if (true) {
       //console.log('esto funcina');
//}

//if (true){
    //let puntos=100
  //  console.log(puntos)
//}

//const pi = 3.1416
//pi= 3;//type error  
//const user = {id: 1, name: 'juan'}

//typeof user; //object
//typeof pi; //number 
//typeof puntos; //undefined

//console.log(typeof user);

//let nota = 5
//if (nota >= 5) {
  //  console.log('aprobado');
//} else {
  //  console.log('reprobado');
//}

//let frutas = ['manzana', 'pera', 'naranja']
//let precio = [100, 200, 300]
//console.log(frutas[0]);
//console.log(precio[1]);

//let estado= (edad) => {
  //  if (edad >= 18) {
    //    return 'mayor de edad';
    //} else {
     //   return 'menor de edad';
    //}
//Me muero de sueño jskajd codigo de operador ternario
   //const edad = 20;
   //const estado = edad >= 18 ? 'mayor de edad' : 'menor de edad';
   //console.log(estado);

switch (new Date().getDay()) {
    case 0:
        console.log('domingo');
        break;
    case 1:
        console.log('lunes');
        break;
    case 2:
        console.log('martes');
        break;
    case 3:
        console.log('miercoles');
        break;
    case 4:
        console.log('jueves');
        break;
    case 5:
        console.log('viernes');
        break;
    case 6:
        console.log('sabado');
        break;
    default:
        console.log('dia no valido');   

}
//Se uso switch no es recomendable usarlo repitiendo console.log recordar crear una variable para almacenar todo 

switch (new Date().getMonth()) {
    case 0:
        console.log('enero');
        break;
    case 1:
        console.log('febrero');
        break;
    case 2:
        console.log('marzo');
        break;
    case 3:
        console.log('abril');
        break;
default:
        console.log('mes no valido');
}
     
//Actividad 4 Con switchy con Ternario 
const rol = 'admin';
let permisos;

switch (rol) {
    case 'admin':
        permisos = 'tiene todos los permisos';
        break;
    case 'editor':
        permisos = 'puede editar contenido';
        break;
    case 'viewer':
        permisos = 'puede ver contenido';
        break;
    default:
        permisos = 'rol no valido';
}
console.log(permisos);

 //Ternario 
 const rol = 'admin';
 const permisos = rol === 'admin' ? 'tiene todos los permisos' :
                 rol === 'editor' ? 'puede editar contenido' :
                    rol === 'viewer' ? 'puede ver contenido' :
                    'rol no valido';
    console.log(permisos); 