const gastos = [
    {cat: "comida",monto: 5000},
    {cat: "transporte",monto: 2000},
    {cat: "entretenimiento",monto: 3000},
];
const porcategoria = gastos.reduce((acc,g) => { acc[g.cat] = (acc[g.cat] || 0) + g.monto; return acc; }, {});
console.log(porcategoria);

const suma = gastos.reduce((acc,g) => acc + g.monto, 0);
console.log(suma);