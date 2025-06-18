# TravelHub - Flight Search Application

## Sommaire

- [TravelHub - Flight Search Application](#travelhub---flight-search-application)
  - [Sommaire](#sommaire)
  - [Démarrage rapide](#démarrage-rapide)
  - [Add data](#add-data)
    - [MongoDB](#mongodb)
      - [connect to the container](#connect-to-the-container)
      - [create a database](#create-a-database)
      - [insert data](#insert-data)
    - [Neo4j](#neo4j)
      - [connect to the container](#connect-to-the-container-1)
      - [add constraints unique key](#add-constraints-unique-key)
      - [create cities](#create-cities)
      - [create relationships](#create-relationships)
  - [Questions](#questions)
    - [Question 1](#question-1)
    - [question 2](#question-2)
    - [Question 3](#question-3)
    - [Question 4](#question-4)
    - [Question 5](#question-5)
    - [Question 6](#question-6)
    - [Question 7](#question-7)



## Démarrage rapide

```
npm install
docker compose up -d
npm run dev
```

```
open http://localhost:3000
```


## Add data

### MongoDB

#### connect to the container
```bash
docker exec -it 'id_container'  "mongosh
```

#### create a database

```
use travelhub
```

#### insert data

```javascript 

db.offers.insertMany([
  { from:'PAR', to:'TYO', price:480, currency:'EUR', provider:'AirX',   legs:[] },
  { from:'PAR', to:'TYO', price:510, currency:'EUR', provider:'AirY',   legs:[] },
  { from:'PAR', to:'TYO', price:530, currency:'EUR', provider:'AirZ',   legs:[] },
  { from:'PAR', to:'NYC', price:350, currency:'EUR', provider:'AirX',   legs:[] },
  { from:'PAR', to:'NYC', price:370, currency:'EUR', provider:'AirY',   legs:[] },
  { from:'PAR', to:'LON', price:120, currency:'EUR', provider:'EuroFly',legs:[] },
  { from:'LON', to:'PAR', price:110, currency:'GBP', provider:'EuroFly',legs:[] },
  { from:'LON', to:'NYC', price:300, currency:'GBP', provider:'BritJet',legs:[] },
  { from:'LON', to:'TYO', price:600, currency:'GBP', provider:'BritJet',legs:[] },
  { from:'NYC', to:'PAR', price:340, currency:'USD', provider:'AirX',   legs:[] },
  { from:'NYC', to:'SFO', price:180, currency:'USD', provider:'USWest', legs:[] },
  { from:'NYC', to:'SFO', price:200, currency:'USD', provider:'SkyUS',  legs:[] },
  { from:'SFO', to:'NYC', price:190, currency:'USD', provider:'USWest', legs:[] },
  { from:'SFO', to:'PAR', price:560, currency:'USD', provider:'AirUS',  legs:[] },
  { from:'SFO', to:'TYO', price:650, currency:'USD', provider:'PacAir', legs:[] },
  { from:'TYO', to:'PAR', price:470, currency:'JPY', provider:'Nippon', legs:[] },
  { from:'TYO', to:'PAR', price:490, currency:'JPY', provider:'Sakura', legs:[] },
  { from:'TYO', to:'LON', price:620, currency:'JPY', provider:'Nippon', legs:[] },
  { from:'PAR', to:'BER', price: 90, currency:'EUR', provider:'EuroFly',legs:[] },
  { from:'BER', to:'PAR', price: 95, currency:'EUR', provider:'EuroFly',legs:[] }
])
db.offers.createIndex({ from: 1, to: 1 })
```
### Neo4j

#### connect to the container
```bash
docker exec -it 'id_container²' cypher-shell -u neo4j -p supersecret123
```

#### add constraints unique key

```neo4j
CREATE CONSTRAINT city_code IF NOT EXISTS
FOR (c:City) REQUIRE c.code IS UNIQUE;
```

####  create cities

```neo4j
UNWIND ['PAR','TYO','NYC','LON','SFO','BER'] AS code
MERGE (:City {code:code});
```

#### create relationships

```neo4j
MATCH (par:City {code:'PAR'}), (tyo:City {code:'TYO'})
MERGE (par)-[:NEAR {weight:0.60}]->(tyo);

MATCH (par:City {code:'PAR'}), (nyc:City {code:'NYC'})
MERGE (par)-[:NEAR {weight:0.70}]->(nyc);

MATCH (par:City {code:'PAR'}), (lon:City {code:'LON'})
MERGE (par)-[:NEAR {weight:0.90}]->(lon);

MATCH (nyc:City {code:'NYC'}), (sfo:City {code:'SFO'})
MERGE (nyc)-[:NEAR {weight:0.85}]->(sfo);

MATCH (lon:City {code:'LON'}), (ber:City {code:'BER'})
MERGE (lon)-[:NEAR {weight:0.80}]->(ber);
```



## Questions
### Question 1

```
GET http://localhost:3000/offers?from=PAR&to=SFO&limit=3
```
### question 2
```
GET http://localhost:3000/reco?city=PAR&k=3
```

### Question 3

```
POST http://localhost:3000/login
```

Avec json/raw body
```json
{
  "userId": "name",
}
```

### Question 4

```
GET http://localhost:3000/offers/{id}
```
### Question 5

```bash
docker exec -it $(docker compose ps -q redis) redis-cli SUBSCRIBE offers:new
```

Pour se connecter à Redis et écouter les messages sur le canal `offers:new`.

```
POST http://localhost:3000/offers
```

avec json/raw body

```json
{
  "from":"PAR",
  "to":"SFO",
  "price":420,
  "currency":"EUR",
  "provider":"AirTest",
  "legs":[]
}
```

### Question 6

Résultats observables : nouvelles clés Redis, message Pub/Sub visible, document ajouté dans Mongo, latences réduites sur hits cache


### Question 7

Ajouter un middleware pour :

- chronométrer chaque requête : il calcule la durée (en ms) entre l’arrivée et la fin du traitement

- écrire la durée dans l’en-tête X-Response-Time

- forcer Content-Type: application/json; charset=utf-8 si la route ne l’a pas déjà mis.