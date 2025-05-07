const pokemonList = document.getElementById('pokemonList');
const loadMoreButton = document.getElementById('loadMoreButton');
const modal = document.getElementById('pokemonDetailModal');
const modalBody = document.getElementById('modalBody');
const closeModalButton = document.getElementById('closeModalButton');
const modalContent = document.querySelector('.modal-content');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

const maxRecords = 151;
const limit = 10;
let offset = 0;

function convertPokemonToLi(pokemon) {
    return `
        <li class="pokemon ${pokemon.type}" data-pokemon-id="${pokemon.number}">
            <span class="number">#${String(pokemon.number).padStart(3, '0')}</span>
            <span class="name">${pokemon.name}</span>

            <div class="detail">
                <ol class="types">
                    ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                </ol>

                <img src="${pokemon.photo}"
                     alt="${pokemon.name}">
            </div>
        </li>
    `;
}

function loadPokemonItems(currentOffset, currentLimit) {
    const actualLimit = Math.min(currentLimit, maxRecords - currentOffset);
    if (actualLimit <= 0 && currentOffset >= maxRecords) { 
        if(loadMoreButton) loadMoreButton.style.display = 'none';
        return;
    }

    pokeApi.getPokemons(currentOffset, actualLimit).then((pokemons = []) => {
        const newHtml = pokemons.map(convertPokemonToLi).join('');
        pokemonList.innerHTML += newHtml;

        const totalLoaded = currentOffset + pokemons.length;
        if (totalLoaded >= maxRecords) {
            if(loadMoreButton) loadMoreButton.style.display = 'none';
        } else {
            if(loadMoreButton) loadMoreButton.style.display = 'block';
        }

    }).catch((error) => {
        console.error("Failed to load Pokémon list:", error);
        pokemonList.innerHTML += `<p class="error-message">Could not load Pokémon. Please try again later.</p>`;
    });
}


function generatePokemonDetailHtml(pokemonDetail) { 
    const maxStatValue = 200; 

    const statsHtml = pokemonDetail.stats.map(statInfo => {
        const statName = statInfo.stat.name.replace(/-/g, ' '); 
        const statValue = statInfo.base_stat;
        const barWidth = Math.min((statValue / maxStatValue) * 100, 100);
        const statClass = statInfo.stat.name.toLowerCase().replace('special-', 'sp-');
        return `
            <li class="stat ${statClass}">
                <span class="stat-name">${statName}</span>
                <span class="stat-value">${statValue}</span>
                <div class="stat-bar-container">
                    <div class="stat-bar" style="width: ${barWidth}%;"></div>
                </div>
            </li>
        `;
    }).join('');

    const abilitiesHtml = pokemonDetail.abilities.map(abilityInfo =>
        `<li>${abilityInfo.ability.name.replace(/-/g, ' ')}</li>`
    ).join('');

    const typesHtml = pokemonDetail.types.map(typeInfo =>
        `<li class="type ${typeInfo.type.name}">${typeInfo.type.name}</li>`
    ).join('');

    const primaryType = pokemonDetail.types[0].type.name;
    modalContent.className = `modal-content ${primaryType}`; 

    return `
        <div class="detail-header">
            <span class="name">${pokemonDetail.name}</span>
            <span class="number">#${String(pokemonDetail.id).padStart(3, '0')}</span>
        </div>
        <img src="${pokemonDetail.sprites.other['official-artwork'].front_default || pokemonDetail.sprites.front_default}" alt="${pokemonDetail.name}" class="detail-img">

        <ol class="types detail-types">
            ${typesHtml}
        </ol>

        <div class="detail-section">
            <h3>Base Stats</h3>
            <ul class="stats">
                ${statsHtml}
            </ul>
        </div>

        <div class="detail-section">
            <h3>Abilities</h3>
            <ul class="abilities">
                ${abilitiesHtml}
            </ul>
        </div>

        <div class="detail-section">
             <h3>Details</h3>
             <ul class="abilities"> <!-- Reusing abilities style for simplicity -->
                <li>Height: ${pokemonDetail.height / 10} m</li>
                <li>Weight: ${pokemonDetail.weight / 10} kg</li>
             </ul>
        </div>
    `;
}

async function showPokemonDetails(pokemonId) {
    try {
        modalBody.innerHTML = '<p style="text-align: center; padding: 20px; color: #555;">Loading details...</p>';
        modalContent.className = 'modal-content'; 
        modal.classList.add('show');

        const detailUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}/`;
        const pokemonDetail = await fetch(detailUrl).then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        });

        const modalHtml = generatePokemonDetailHtml(pokemonDetail);
        modalBody.innerHTML = modalHtml;

    } catch (error) {
        console.error("Failed to load Pokémon details:", error);
        modalBody.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Could not load details. Please try again later.</p>';
        modalContent.className = 'modal-content';
        if (!modal.classList.contains('show')) { 
            modal.classList.add('show');
        }
    }
}

pokemonList.addEventListener('click', (event) => {
    const clickedLi = event.target.closest('li.pokemon');
    if (clickedLi) {
        const pokemonId = clickedLi.dataset.pokemonId;
        if (pokemonId) {
            showPokemonDetails(pokemonId);
        }
    }
});

if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
        offset += limit;
        const remainingRecords = maxRecords - offset;
        const newLimit = Math.min(limit, remainingRecords);

        if (newLimit > 0) {
            loadPokemonItems(offset, newLimit);
        }

        if (offset + newLimit >= maxRecords) {
            loadMoreButton.style.display = 'none';
        }
    });
}

closeModalButton.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('show');
    }
});

async function handleSearch(searchTerm) {
    if (!searchTerm) {
        pokemonList.innerHTML = ''; 
        offset = 0;
        const initialLimit = Math.min(limit, maxRecords);
        loadPokemonItems(offset, initialLimit);

        if (initialLimit < maxRecords && loadMoreButton) {
            loadMoreButton.style.display = 'block';
        } else if (loadMoreButton) {
            loadMoreButton.style.display = 'none';
        }
        return;
    }

    pokemonList.innerHTML = '<p style="text-align: center; padding: 20px;">Searching...</p>';
    if (loadMoreButton) loadMoreButton.style.display = 'none'; 

    try {
        const pokemon = await pokeApi.getPokemonByNameOrId(searchTerm); 
        const pokemonHtml = convertPokemonToLi(pokemon);
        pokemonList.innerHTML = pokemonHtml;
    } catch (error) {
        console.error("Search failed:", error);
        if (error.message.includes('Pokemon not found')) {
            pokemonList.innerHTML = '<p style="text-align: center; padding: 20px; color: #cc0000;">Pokémon not found. Try its full name (e.g., Pikachu) or Pokédex number (e.g., 25).</p>';
        } else {
            pokemonList.innerHTML = '<p style="text-align: center; padding: 20px; color: #cc0000;">Error searching for Pokémon. Please check the name/ID or try again.</p>';
        }
    }
}

if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        handleSearch(searchTerm);
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            handleSearch(searchTerm);
        }
    });
}

function initialLoad() {
    pokemonList.innerHTML = ''; 
    offset = 0;
    const initialLimit = Math.min(limit, maxRecords);
    loadPokemonItems(offset, initialLimit);

    if (initialLimit >= maxRecords && loadMoreButton) {
        loadMoreButton.style.display = 'none';
    } else if (loadMoreButton) {
        loadMoreButton.style.display = 'block';
    }
}

initialLoad();