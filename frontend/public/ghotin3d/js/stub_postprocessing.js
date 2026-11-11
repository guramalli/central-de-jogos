// O N8AO importa a classe Pass da biblioteca "postprocessing" só para uma variante que não usamos.
// Este arquivo ocupa o lugar dela no importmap, para não baixar a biblioteca inteira.
export class Pass { constructor() { this.enabled = true; } }
