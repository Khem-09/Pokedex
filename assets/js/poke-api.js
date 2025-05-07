const pokeApi = {}

function convertPokeApiDetailToPokemon(pokeDetail) {
    const pokemon = new Pokemon()
    pokemon.number = pokeDetail.id
    pokemon.name = pokeDetail.name

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name)
    const [type] = types

    pokemon.types = types
    pokemon.type = type

    pokemon.photo = pokeDetail.sprites.other.dream_world.front_default || pokeDetail.sprites.front_default 

    pokemon.stats = pokeDetail.stats;
    pokemon.abilities = pokeDetail.abilities;
    pokemon.height = pokeDetail.height;
    pokemon.weight = pokeDetail.weight;
    pokemon.sprites = pokeDetail.sprites; 

    return pokemon
}

pokeApi.getPokemonDetail = (pokemon) => {
    return fetch(pokemon.url)
        .then((response) => response.json())
        .then(convertPokeApiDetailToPokemon)
}

pokeApi.getPokemons = (offset = 0, limit = 5) => {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)
        .then((response) => response.json())
        .then((jsonBody) => jsonBody.results)
        .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail)) 
        .then((detailRequests) => Promise.all(detailRequests))
        .then((pokemonsDetails) => pokemonsDetails)
        .catch((error) => {
            console.error("Error fetching Pokémon list:", error);
            return []; 
        });
}

pokeApi.getPokemonByNameOrId = (searchTerm) => {
    const term = String(searchTerm).toLowerCase().trim(); 
    if (!term) {
        return Promise.reject(new Error("Search term cannot be empty"));
    }
    const url = `https://pokeapi.co/api/v2/pokemon/${term}`;

    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Pokemon not found');
                }
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(convertPokeApiDetailToPokemon); 
}