/* Tema neutro de partida. NÃO é a identidade da Rumbo nem de cliente nenhum:
   é um ponto de partida sóbrio para o motor rodar sem marca.

   Para um cliente, copie este arquivo para o plugin dele
   (plugins/rumbo-<cliente>/temas/<cliente>.js), troque os valores, e aponte
   os logos para os PNGs do plugin do cliente. Nunca edite este arquivo para
   colocar marca de cliente: ele é o default do motor. */
module.exports = {
  autor: 'Rumbo',

  // 1 a 3 acentos. O primeiro é o principal; os outros aparecem na barra
  // lateral, no dumbbell e onde o catálogo pedir contraste.
  acentos: ['1F4E79', '5B7C99', 'A8763E'],

  // Opcionais: sem eles, o motor clareia o acento principal sozinho.
  // acentoClaro: '7D9FE0',
  // acentoPalido: '9FB4DC',

  fontes: { titulo: 'Arial', corpo: 'Calibri' },

  // Sem logo o deck é montado sem logo, nada quebra.
  logos: { emFundoClaro: null, emFundoEscuro: null },
  logoAspecto: 1.13

  // neutros e semanticas podem ser sobrescritos aqui. Os defaults do motor
  // (metodo/deck-infograficos.md descreve o uso de cada um) servem para a
  // maioria dos casos.
};
