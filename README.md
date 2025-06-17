# TravelHub - Flight Search Application

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

### connect to the container
```bash
docker exec -it 'id_container'  "mongosh
```

### create a database

```
use travelhub
```

### insert data

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