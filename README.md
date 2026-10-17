# MobileCity Chatbot

An AI sales chatbot for an online phone store that answers customer questions about products, prices and installment plans, takes orders and hands the chat over to staff when needed.

## Description

### What the application does

Customers chat with the bot on the MobileCity website to ask about phones, tablets, watches and accessories, compare prices and ask about installment plans. The bot answers using real product data from the database, collects the customer's details to create an order, and can pass the conversation to a human staff member.

Staff use an admin dashboard to manage products and orders, read past conversations and handle handoff requests.

This is a team project (5 members) for the Artificial Intelligence course. I was responsible for the backend, the Rasa chatbot, the Gemini API integration, the database and the Docker setup.

### Why these technologies

- **Rasa:** detects what the customer wants (intent) and controls the conversation flow, such as asking for an order or calling staff.
- **Gemini API:** writes natural, flexible replies that a rule-based bot cannot handle well.
- **Rasa + Gemini together:** Rasa decides *what* to do, Gemini decides *how* to say it. Product data from the database is added to the prompt so Gemini answers with real stock and prices instead of making them up.
- **FastAPI:** a fast Python framework that fits the Python-based Rasa actions and generates API docs automatically.
- **PostgreSQL:** stores products, orders, conversations and handoff requests, which are related data.
- **Docker Compose + Nginx:** the system has 7 services; Docker Compose starts them all with one command and Nginx routes requests to the right service.

### Challenges

- Rasa forms were too rigid for real conversations, so most intents are routed to a single action that sends the message to Gemini together with chat history and product data.
- Keeping Gemini's answers accurate: without product data in the prompt, it invented prices and models.
- Getting 7 containers to start in the right order (for example, the backend waits until PostgreSQL is healthy).

### Future features

- Measure intent classification accuracy and add more training data
- Online payment for orders
- Staff notifications by email or Zalo when a handoff is requested
- Deploy to a cloud server

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Author](#author)

## Tech Stack

| Layer | Technology |
|---|---|
| Chatbot | Rasa 3.6 (18 intents, 254 training examples), Rasa custom actions (Python) |
| AI | Google Gemini API (gemini-2.5-flash-lite) |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL 15 |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| DevOps | Docker Compose, Nginx |

## Installation and Running

### Requirements

- Docker Desktop
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### Step 1: Clone the repository

```bash
git clone https://github.com/Dinhminh04/mobilecity-chatbot.git
cd mobilecity-chatbot
```

### Step 2: Create the `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in `GEMINI_API_KEY`. The other values work as they are for local use.

### Step 3: Train the Rasa model

```bash
docker compose run --rm rasa train
```

### Step 4: Start all services

```bash
docker compose up --build
```

PostgreSQL runs `database/init.sql` automatically on the first start to create the tables and sample products.

### Step 5: Open the apps

| Service | URL |
|---|---|
| Store website with chatbot | http://localhost:3002 |
| Admin dashboard | http://localhost:3000 |
| FastAPI docs | http://localhost:8000/docs |
| Rasa API | http://localhost:5005 |
| Nginx (all in one) | http://localhost |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/products` | List products (`?search=&brand=&page=`) |
| GET | `/api/products/{id}` | Product details |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |
| GET | `/api/orders` | List orders (`?status=&search=`) |
| PUT | `/api/orders/{id}/status` | Update order status |
| GET | `/api/conversations` | List chat sessions |
| GET | `/api/conversations/{session_id}` | Chat session details |
| GET | `/api/handoffs` | List handoff requests |
| PUT | `/api/handoffs/{id}` | Assign or resolve a handoff |
| POST | `/api/rasa/log` | Log a message from Rasa |
| GET | `/health` | Health check |

### Rasa custom actions

| Action | Description |
|---|---|
| `action_gemini_reply` | Sends the message, chat history and product data to Gemini and returns the reply |
| `action_calculate_quote` | Calculates prices and installment plans |
| `action_save_lead` | Saves the customer's details as an order |
| `action_trigger_handoff` | Creates a request for a staff member to take over |

## Project Structure

```
mobilecity-chatbot/
├── actions/            # Rasa custom actions (Python, Gemini integration)
├── data/               # Rasa training data: nlu, rules, stories
├── tests/              # Rasa test stories
├── backend/            # FastAPI REST API
├── database/init.sql   # PostgreSQL schema and sample data
├── frontend/           # Next.js admin dashboard
├── website/            # Next.js store website with chat widget
├── nginx/              # Reverse proxy config
├── config.yml          # Rasa pipeline and policies
├── domain.yml          # Rasa intents, slots, responses
└── docker-compose.yml
```

## Author

Nguyen Dinh Minh — [github.com/Dinhminh04](https://github.com/Dinhminh04)
