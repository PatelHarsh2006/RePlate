# RePlate 🍽️📍

**Food rescue that knows food goes bad, and plans the pickup round around it.**

RePlate is a web platform that connects people with surplus cooked food to volunteers who can collect it. It was built as a minor project at IIIT Bhopal by Patel Harsh (24U020118) and Vatsal Kakadiya (24U020132), under the guidance of Dr. Sonal Telang Chandel.

---

## Why we built this

Every day, perfectly good cooked food gets thrown away while people a few kilometres away go hungry. When we looked into it, we found the donors are usually willing. The real problem is coordination:

- Cooked food is safe for only a few hours.
- Addresses like "near the tea stall" don't tell a volunteer where to go.
- A volunteer who handles one donation at a time can't cover much ground.
- Most platforms treat rice and biscuits as if they expire at the same time.

So instead of only matching food to a recipient, we focused on the part everyone skips: **the collection round.**

## The idea that makes RePlate different

> A donation isn't a database entry. It's a perishable logistics task.

Four things work together as one pipeline:

1. **Exact pinned location.** The donor drops a pin on a map. The form won't submit without it, so every route starts from a real coordinate. The typed address stays only as context for the volunteer.
2. **Predicted shelf life.** A machine learning model estimates how long the food stays safe. That becomes the donation's own deadline (submission time + predicted life - a safety margin). Once the deadline passes, the donation leaves the pool.
3. **Time-band pooling.** Donations that become available in the same time band are grouped into one round, because surplus food really does appear around meal times.
4. **Shortest route, with proof.** We compute the shortest visiting order and show the volunteer how much distance it saves compared with the order requests arrived in.

## What it does

- **Donors** sign up, post surplus food with quantity, category, availability window and a pinned location, and follow its status.
- **Volunteers** see the pool of available donations, accept pickups, and get a numbered route on a map with a stop list.
- **NGOs** are supported as a third role for redistribution.
- Donations move through clear states: `pending`, `accepted`, `collected` or `expired`.
- Accepting a donation is a conditional database update, so two volunteers can never claim the same one.

## How well does it work?

| What we measured | Baseline | RePlate |
|---|---|---|
| Shelf-life error (MAE) | 104.3 h (one fixed shelf life) | **32.1 h** (69.3% lower) |
| Median prediction error | n/a | **1.37 h** |
| Model R² (log scale) | n/a | **0.912** |
| Route length, 5 pickups | 24.06 km (arrival order) | **18.58 km** (22.8% shorter) |
| Gap to true optimum | n/a | **5.2%** (checked all 120 possible orders) |

**Please read this honestly:** the dataset is a constructed corpus (3,000 records, 32 attributes), and the route test uses a pool of five pickups. These numbers show the design works and beats its baselines. They are not a claim about accuracy in the field. The shelf-life estimate is decision support for deciding what's worth collecting, **never** a certificate that food is safe to eat.

One detail we're proud of: we removed 3 columns that were calculated directly from the target. Keeping them would have made the model look nearly perfect while learning nothing.

## How it works under the hood

```
Donor posts food + pins location
        |
        v
FastAPI service predicts shelf life  -->  deadline is set
        |
        v
Donation saved in MongoDB (GeoJSON point, status = pending)
        |
        v
Volunteer requests a round  -->  pool of donations in the same time band
        |
        v
OSRM road-distance matrix (one call)  -->  nearest neighbour + 2-opt
        |
        v
Numbered route shown on a Leaflet map
```

A couple of choices worth knowing about:

- **Open path, not a round trip.** A volunteer doesn't return to a depot, so we optimise the path as an open one.
- **Baseline every time.** The arrival-order distance is always computed, so the saving is measured on every route rather than assumed.
- **Fallback.** If the routing engine is down, a great-circle (straight-line) fallback keeps the volunteer from being blocked, and the response says which source was used.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 5, CSS, Leaflet 1.9 with OpenStreetMap tiles |
| Backend | Node.js 20, Express 4, Mongoose 8, express-validator |
| Database | MongoDB with a GeoJSON point and 2dsphere index |
| Security | bcrypt.js password hashing, JWT sessions, role-based middleware |
| Routing | OSRM table service, nearest neighbour + 2-opt |
| ML | Python 3.12, scikit-learn (HistGradientBoostingRegressor), NumPy, pandas |
| Model serving | FastAPI with Uvicorn |
| Testing | Jest and Supertest |

## Project structure

```
replate/
  client/
    src/
      components/   Navbar, DonationForm, LocationPicker, RouteMap, StopList
      pages/        Home, Login, Signup, DonorDashboard, VolunteerDashboard
      api/          fetch wrapper that attaches the bearer token
      styles/       global and component stylesheets
  server/
    config/         database connection, environment loading
    models/         User.js, Donation.js, Route.js
    routes/         auth, donation and route routes
    controllers/    auth, donation and route controllers
    middleware/     auth, role, validate and error handlers
    services/       route.service.js, distanceMatrix.js, shelfLife.client.js
    utils/          token.js, asyncHandler.js, haversine.js
    app.js          middleware chain and route mounting
    server.js       listener and graceful shutdown
  ml/
    preprocess.py   the seven-step cleaning pipeline
    train.py        training and evaluation
    app.py          FastAPI prediction service
    artifacts/      versioned model and encoder
```

## Getting started

You'll need Node.js 20, Python 3.12, and MongoDB (local or a hosted cluster).

**1. Clone the repo**

```bash
git clone https://github.com/<your-username>/replate.git
cd replate
```

**2. Start the prediction service** (runs on port 8000)

```bash
cd ml
pip install -r requirements.txt
python train.py          # trains the model and saves it to artifacts/
uvicorn app:app --port 8000
```

**3. Start the API** (runs on port 5000)

```bash
cd server
npm install
npm run dev
```

**4. Start the client** (runs on port 5173)

```bash
cd client
npm install
npm run dev
```

Then open http://localhost:5173.

### Environment variables

Configuration lives in `.env` files that are kept out of version control, so your secrets never end up in the git history.

The **server** needs: a MongoDB connection URI, a token signing secret, a token lifetime, the base URL of the prediction service, the base URL of the routing engine, and a routing timeout.

The **client** needs only the base URL of the API.

Create `server/.env` and `client/.env` using the names your code reads. A `.env.example` file in each folder is a good way to show them.

## API overview

| Method and path | What it does | Who can use it |
|---|---|---|
| `POST /api/auth/signup` | Create an account | Public |
| `POST /api/auth/login` | Log in and get a token | Public |
| `GET /api/auth/me` | Who am I? | Logged in |
| `POST /api/donations` | Post a donation with its pinned point | Donor |
| `GET /api/donations/mine` | My donations | Donor |
| `GET /api/donations/pending` | Available donations | Volunteer |
| `GET /api/donations/pool` | Available donations in a time band | Volunteer |
| `POST /api/donations/:id/accept` | Claim a donation | Volunteer |
| `GET /api/donations/mine/accepted` | My accepted pickups | Volunteer |
| `GET /api/donations/mine/completed` | My completed pickups | Volunteer |
| `POST /api/routes` | Compute and save the shortest visiting order | Volunteer |
| `GET /api/routes/mine` | My current route with stops | Volunteer |

Every successful response comes back in a consistent `data` envelope, and every failure returns a message with field-level errors when validation fails.

## What's next

- Vehicle capacity limits
- Ordering stops by urgency, not just distance
- A final leg from the last pickup to a verified NGO
- Retraining the model on real donation and spoilage outcomes
- Live volunteer tracking

## Acknowledgements

Thanks to Dr. Sonal Telang Chandel for her guidance, and to the open-source communities behind OpenStreetMap, OSRM, Leaflet, scikit-learn, React and MongoDB. Background figures come from FAO, WHO, UNEP and FSSAI publications.

---

Made with a lot of chai by Harsh and Vatsal, IIIT Bhopal.
