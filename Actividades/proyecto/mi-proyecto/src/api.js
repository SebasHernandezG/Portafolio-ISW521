const apiURL = "https://jsonplaceholder.typicode.com/users";

export const obtenerUsuarios = async () => {
  try {
    const response = await fetch(apiURL);
    if (!response.ok) {
      throw new Error("Error de red");
    }
    return await response.json();
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    return [];
  }
};