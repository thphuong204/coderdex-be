const express = require('express')
const fs = require('fs')
const cors = require('cors')
const path = require('path')
const csv=require('csvtojson')
const app = express()

app.use(express.static('public'))
app.use(cors())


let totalPokemons = 721;
const convertedCsvToJsonFunction = async () => {
    let tmpData = await csv().fromFile("src/pokemon.csv");
    let limitedData = [];
    let pokemonObject ={};
    for (let i=0 ; i<totalPokemons; i++) {
        let name = tmpData[i].name.toLowerCase();
        let typeArray = [];
        let id = i + 1;
        let url=`http://localhost:5000/images/${id}.png`;
        let height = `${tmpData[i].height_m} m`;
        let weight = `${tmpData[i].weight_kg} kg`;
        let category = tmpData[i].classfication;
        let abilities = tmpData[i].abilities.replaceAll("'","").replace("[","").replace("]","");
        let description ="";

        if (tmpData[i].type2) {
            typeArray = [tmpData[i].type1.toLowerCase(),tmpData[i].type2.toLowerCase()]
        } else {
            typeArray = [tmpData[i].type1.toLowerCase()]
        }
        pokemonObject ={
            "name": name,
            "types" : typeArray,
            "id": id,
            "url": url,
            "description":description,
            "height":height,
            "weight": weight,
            "category":category,
            "abilities":abilities
        }
        limitedData.push(pokemonObject);
    }
    return limitedData;
}

const changeDataDBJson = async () => {
    const limitedData = await convertedCsvToJsonFunction();

    let convertedJsonToObject = JSON.parse(fs.readFileSync("db.json"));
    convertedJsonToObject.data = limitedData;
    fs.writeFileSync("db.json",JSON.stringify(convertedJsonToObject));
    console.log('done');
}

changeDataDBJson();


app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/api/pokemons', function (req, res) {

    let limit = req.query.limit || 20;
    let page =   req.query.page || 1;
    let search =   req.query.search || "";
    let type =   req.query.type || "";

    limit = parseInt(limit);
    page = parseInt(page);
    search = search.toLowerCase();
    type = type.toLowerCase();

    console.log("search", search, "\ntype", type)

    const tmpdata = JSON.parse(fs.readFileSync("db.json")).data;

    let filteredData =JSON.parse(JSON.stringify([...tmpdata]));
    let result = []

        if (search && !type) {
            result = filteredData.filter(pokemonObject =>pokemonObject.name.includes(search) 
           )
        }

        if (!search && type) {
            result = filteredData.filter(pokemonObject => pokemonObject.types.includes(type))
        }

        if (!search && !type) {
            result = filteredData.filter(pokemonObject =>pokemonObject)
        }

        if (search && type) {
            const tmpResult = filteredData.filter(pokemonObject => pokemonObject.types.includes(type))
            result = tmpResult.filter(pokemonObject => pokemonObject.name.includes(search))
        }


    let count = result.length;
    console.log("count", count)
    let totalPage =Math.ceil(count/limit);
    console.log("totalPage",totalPage);
    let offset = (page-1)*limit
    const sendData = result.slice(offset,offset+limit);

    res.send({
        "data":sendData,
        "totalPokemons":totalPokemons,
        "count":count,
        "totalPages":totalPage
})
})


app.get('/api/pokemons/:id', function (req, res) {
    console.log('params', req.params)
    let pokemonId = parseInt(req.params.id);
    let previousPokemonId = null;
    let nextPokemonId = null;

    const tmpdata = JSON.parse(fs.readFileSync("db.json")).data;
    let filteredData =JSON.parse(JSON.stringify([...tmpdata]));

    if (pokemonId === 1) {
        previousPokemonId = totalPokemons;
        nextPokemonId = pokemonId +1;
    } else if (pokemonId === totalPokemons) {
        nextPokemonId =1;
        previousPokemonId = pokemonId-1
    } else {
        nextPokemonId = pokemonId +1 ;
        previousPokemonId = pokemonId -1;
    }

    const pokemon = filteredData.find(pokemonObject => pokemonObject.id === pokemonId)
    const nextPokemon = filteredData.find(pokemonObject => pokemonObject.id === nextPokemonId);
    const previousPokemon = filteredData.find(pokemonObject => pokemonObject.id === previousPokemonId);

    console.log("pokemon", pokemon)
   

  res.send({"data":{
    "pokemon": pokemon,
    "previousPokemon": previousPokemon,
    "nextPokemon": nextPokemon
}})
})

const SERVER_PORT = 5000
console.log('Listening on http://localhost:'+SERVER_PORT)
app.listen(SERVER_PORT)