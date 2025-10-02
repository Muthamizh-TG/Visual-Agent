
import os
from dotenv import load_dotenv
load_dotenv()
import requests
from openai import OpenAI
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# --- FastAPI setup ---
app = FastAPI(title="Multi-Agent Chat API")

# --- OpenAI setup ---
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s - %(message)s')
 
# --- OpenAI setup ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-<key>")
client = OpenAI(api_key=OPENAI_API_KEY)
 
# --- API Keys ---
AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")
FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")

# --- Router ---
def router(user_input: str):
    import re, json
    # First, get the initial parse from LLM
    prompt = f"""
    You are an intelligent router AI for a business trip assistant. The user is planning or managing a business trip and may need to:

    - Check flight status and availability (FlightCheckerAgent)
    - Find the best tourist places to visit (TouristAttractionAgent)
    - Check the weather at the destination (WeatherAgent)
    - Get the latest news (NewsAgent)
    - Analyze their feelings or the popularity of a place (SentimentPopularityAgent)
    - Find food options, especially in their own state style, at the travel location (FoodPlannerAgent)
    - Get emergency alerts (war, natural disaster, etc.) (EmergencyAlertAgent)
    - Check traffic conditions to avoid missing meetings (TrafficConditionAgent)
    - Have a normal conversation (ChatAgent)

    Your job is to:
    1. Decide which agents should handle the following user input.
    2. Extract the city or location mentioned in the user input (if any). If not specified, return "default".
    3. If the user input is about flights, extract the origin and destination (city or airport name or IATA code) and the date (YYYY-MM-DD) if present. Return them as 'origin', 'destination', and 'date'.

    User input:
    "{user_input}"

    Respond in this JSON format:
    {{"agents": [<comma-separated agent names from this list: FlightCheckerAgent, TouristAttractionAgent, WeatherAgent, NewsAgent, SentimentPopularityAgent, FoodPlannerAgent, EmergencyAlertAgent, TrafficConditionAgent, ChatAgent>], "city": "<city or location or 'default'>", "origin": "<city/airport/IATA or ''>", "destination": "<city/airport/IATA or ''>", "date": "<YYYY-MM-DD or ''>"}}
    """
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    output_text = response.choices[0].message.content.strip()
    try:
        parsed = json.loads(output_text)
        agents = parsed.get("agents", [])
        city = parsed.get("city", "default")
        origin = parsed.get("origin", "")
        destination = parsed.get("destination", "")
        date = parsed.get("date", "")
    except Exception:
        # fallback: try to extract agent names as before
        valid_names = [
            "FlightCheckerAgent", "TouristAttractionAgent", "WeatherAgent", "NewsAgent",
            "SentimentPopularityAgent", "FoodPlannerAgent", "EmergencyAlertAgent", "TrafficConditionAgent", "ChatAgent"
        ]
        agents = []
        for name in valid_names:
            if name.lower() in output_text.lower():
                agents.append(name)
        city = "default"
        # Try to extract IATA codes and date from user_input
        iata_codes = re.findall(r'\b([A-Z]{3})\b', user_input)
        origin = iata_codes[0] if len(iata_codes) > 0 else ""
        destination = iata_codes[1] if len(iata_codes) > 1 else ""
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', user_input)
        date = date_match.group(1) if date_match else ""
    # If FlightCheckerAgent is selected, ensure origin/destination are IATA codes
    if "FlightCheckerAgent" in agents:
        def get_iata_code(place):
            # If already 3 uppercase letters, assume IATA
            if re.fullmatch(r"[A-Z]{3}", place):
                return place
            # Try city/airport first
            iata_prompt = f"What is the IATA airport code for '{place}'? Respond with only the 3-letter code. If not a city/airport, respond with 'UNK'."
            iata_resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": iata_prompt}],
                temperature=0
            )
            code = iata_resp.choices[0].message.content.strip().upper()
            if re.fullmatch(r"[A-Z]{3}", code) and code != "UNK":
                return code
            # If not found, try as a country: ask for major international airport
            country_prompt = f"A user wants to fly to or from the country '{place}'. What is the IATA code of the country's busiest or most popular international airport? Respond with only the 3-letter code. If not possible, respond with 'UNK'."
            country_resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": country_prompt}],
                temperature=0
            )
            country_code = country_resp.choices[0].message.content.strip().upper()
            return country_code if re.fullmatch(r"[A-Z]{3}", country_code) and country_code != "UNK" else ""
        if origin:
            origin = get_iata_code(origin)
        if destination:
            destination = get_iata_code(destination)
    if not agents:
        agents = ["ChatAgent"]
    return agents, city, origin, destination, date
 
import os
import requests

# --- Flight Checker Agent ---
from amadeus import Client, ResponseError
from dotenv import load_dotenv
load_dotenv()
AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")
amadeus = Client(
    client_id=AMADEUS_CLIENT_ID,
    client_secret=AMADEUS_CLIENT_SECRET
)
def flight_checker_agent(user_input: str, origin: str = "", destination: str = "", date: str = ""):
    """
    Search flight options using Amadeus Flight Offers Search API.
    origin/destination: IATA codes (e.g., MAA -> Chennai, DXB -> Dubai)
    date: YYYY-MM-DD
    """
    try:
        # If not provided, try to extract from user_input
        import re
        if not origin or not destination:
            iata_codes = re.findall(r'\b([A-Z]{3})\b', user_input)
            origin = iata_codes[0] if len(iata_codes) > 0 else "MAA"
            destination = iata_codes[1] if len(iata_codes) > 1 else "DXB"
        if not date:
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', user_input)
            date = date_match.group(1) if date_match else "2025-10-15"
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=date,
            adults=1,
            max=5
        )
        results = response.data
        if not results:
            return "No flights found."
        output = []
        for idx, flight in enumerate(results, 1):
            offer = flight["itineraries"][0]["segments"][0]
            dep = offer["departure"]["iataCode"]
            dep_time = offer["departure"]["at"]
            arr = offer["arrival"]["iataCode"]
            arr_time = offer["arrival"]["at"]
            carrier = offer["carrierCode"]
            price = flight["price"]["total"]
            output.append(f"{idx}. {carrier} | {dep} → {arr}\n   Departure: {dep_time}\n   Arrival:   {arr_time}\n   Price:     {price} EUR\n" + "-" * 40)
        return "\n".join(output)
    except ResponseError as error:
        return f"API Error: {error}"
    except Exception as e:
        return f"Error fetching flight info: {str(e)}"


# --- Tourist Attraction Agent (Using Geoapify Places API) ---
def tourist_attraction_agent(user_input: str):
    import re, os
    import openai
    from dotenv import load_dotenv
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Try to extract city and country from user_input
    city = None
    country = None
    # Look for 'in <city>[, <country>]' or just a city
    match = re.search(r'in ([A-Za-z ]+?)(?:,\s*([A-Za-z ]+))?(?:\.|$)', user_input)
    if match:
        city = match.group(1).strip()
        if match.group(2):
            country = match.group(2).strip()
    if not city:
        # fallback: look for just a city name
        match2 = re.search(r'([A-Z][a-z]+)', user_input)
        city = match2.group(1) if match2 else "Chennai"
    num_places = 5
    location = city if not country else f"{city}, {country}"
    prompt = f"""
    You are a helpful travel assistant.
    Provide a list of {num_places} top tourist attractions in {location}.
    For each place, give:
    1. Name
    2. Short description (1-2 sentences)
    3. Optional tips for visiting

    Format the output as a numbered list.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error fetching tourist attractions: {str(e)}"


# --- Weather Agent ---
def weather_agent(user_input: str):
    import re
    match = re.search(r'in ([A-Za-z ]+)', user_input)
    city = match.group(1).strip() if match else "Chennai"
    # Remove trailing words like 'today', 'now', 'currently', 'please', etc.
    city = re.sub(r'\b(today|now|currently|please|tomorrow|right now|at present)\b', '', city, flags=re.IGNORECASE).strip()
    city = re.sub(r'\s+', ' ', city)
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}
    try:
        res = requests.get(url, params=params)
        data = res.json()
        if data.get("main"):
            temp = data["main"]["temp"]
            cond = data["weather"][0]["description"]
            humidity = data["main"]["humidity"]
            return f"The weather in {city} is {temp}°C with {cond}. Humidity: {humidity}%."
        else:
            return f"Weather data not found for {city}."
    except Exception as e:
        return f"Error fetching weather: {str(e)}"


# --- News Agent ---
def news_agent(user_input: str):
    import os
    import requests
    from dotenv import load_dotenv
    import re
    load_dotenv()
    NEWSAPI_KEY = os.getenv("NEWSAPI_KEY") or os.getenv("NEWS_API_KEY")
    # Try to extract a topic or location from user_input
    match = re.search(r'news(?: about| on| for)? ([A-Za-z ]+)', user_input, re.IGNORECASE)
    if match:
        query = match.group(1).strip()
    else:
        # fallback: look for 'in <city>'
        match2 = re.search(r'in ([A-Za-z ]+)', user_input)
        query = match2.group(1).strip() if match2 else "world"
    def get_latest_news(query, max_results=5):
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "pageSize": max_results,
            "sortBy": "publishedAt",
            "language": "en",
            "apiKey": NEWSAPI_KEY
        }
        response = requests.get(url, params=params)
        data = response.json()
        articles = data.get("articles", [])
        results = []
        for art in articles:
            results.append({
                "title": art.get("title"),
                "description": art.get("description"),
                "source": art.get("source", {}).get("name"),
                "url": art.get("url"),
                "published_at": art.get("publishedAt")
            })
        return results
    try:
        articles = get_latest_news(query)
        if articles:
            output = []
            for idx, article in enumerate(articles, 1):
                output.append(f"{idx}. {article['title']} ({article['source']})\n   {article['description']}\n   URL: {article['url']}\n   Published: {article['published_at']}\n" + "-" * 60)
            return "\n".join(output)
        # If no news found, use OpenAI to generate a plausible summary
        import openai
        from dotenv import load_dotenv
        load_dotenv()
        openai.api_key = os.getenv("OPENAI_API_KEY")
        prompt = f"You are a news assistant. The user asked for news about: '{query}'. No direct news articles were found. Please provide a plausible summary or update about this topic, or explain why there may be no news available."
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error fetching news: {str(e)}"


# --- Sentiment & Popularity Agent ---
def sentiment_popularity_agent(user_input: str):
    import os
    import openai
    from dotenv import load_dotenv
    import re
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Try to extract a place name and reviews from user_input
    # Example: "What do people think about Marina Bay Sands? Reviews: ..."
    place_name = None
    user_reviews = None
    # Try to extract place name after 'about' or 'of' or 'for'
    match = re.search(r'(?:about|of|for) ([A-Za-z ,&-]+)', user_input, re.IGNORECASE)
    if match:
        place_name = match.group(1).strip()
    else:
        # fallback: use the whole input
        place_name = user_input.strip()
    # Try to extract reviews if present
    reviews_match = re.findall(r'Reviews?:\s*(.*)', user_input, re.IGNORECASE)
    if reviews_match:
        user_reviews = [r.strip() for r in reviews_match[0].split(';') if r.strip()]
    # Compose prompt
    review_text = ""
    if user_reviews:
        review_text = "Here are some recent user reviews:\n" + "\n".join(user_reviews)
    prompt = f"""
    You are an assistant that analyzes the popularity and public sentiment of places.
    Consider the place: {place_name}.
    {review_text}

    Provide a concise report including:
    1. Popularity: high, medium, low, with reasoning (e.g., number of visitors, online mentions, ratings)
    2. User sentiment: overall feeling (positive, negative, neutral), with examples if available
    3. Tips: any suggestions for visitors

    Format as a structured list.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        content = response.choices[0].message.content
        if not content or not content.strip():
            return "Sorry, I couldn't analyze the sentiment or popularity for this place. Please try rephrasing your request."
        return content
    except Exception as e:
        return f"Error analyzing sentiment/popularity: {str(e)}"


# --- Food Planner Agent ---
def food_planner_agent(user_input: str):
    import os
    import openai
    from dotenv import load_dotenv
    import re
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Try to extract user location, cuisine, and destination from user_input
    # Example: "I want Tamil Nadu style food in Singapore, I am from Tamil Nadu"
    cuisine = None
    destination = None
    user_location = None
    # Try to extract cuisine
    cuisine_match = re.search(r'(?:style|cuisine|food) ([A-Za-z ,&-]+)', user_input, re.IGNORECASE)
    if cuisine_match:
        cuisine = cuisine_match.group(1).strip()
    # Try to extract destination
    dest_match = re.search(r'in ([A-Za-z ,&-]+)', user_input, re.IGNORECASE)
    if dest_match:
        destination = dest_match.group(1).strip()
    # Try to extract user location
    loc_match = re.search(r'from ([A-Za-z ,&-]+)', user_input, re.IGNORECASE)
    if loc_match:
        user_location = loc_match.group(1).strip()
    # Fallbacks
    if not cuisine:
        cuisine = "South Indian"
    if not destination:
        destination = "Chennai"
    if not user_location:
        user_location = "Tamil Nadu, India"
    num_places = 5
    prompt = f"""
    You are a helpful food recommendation agent.

    A user usually eats {cuisine} cuisine in {user_location} 
    but is now visiting {destination}. Suggest {num_places} restaurants 
    or food places in {destination} where they can find authentic {cuisine} food.
    
    For each place, give:
    1. Name of the restaurant
    2. Address or area (if possible)
    3. Short description or recommendation
    4. Optional tip for visiting or ordering

    Format the output as a numbered list.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error fetching food recommendations: {str(e)}"


# --- Emergency Alert Agent ---
def emergency_alert_agent(user_input: str):
    import os
    import requests
    import openai
    from dotenv import load_dotenv
    import re
    load_dotenv()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEWSAPI_KEY = os.getenv("NEWSAPI_KEY") or os.getenv("NEWS_API_KEY")
    openai.api_key = OPENAI_API_KEY
    # Try to extract country or place from user_input
    match = re.search(r'in ([A-Za-z ]+)', user_input)
    place = match.group(1).strip() if match else "India"
    def fetch_emergency_news(country, max_articles=5):
        url = "https://newsapi.org/v2/top-headlines"
        params = {
            "q": f"{country} disaster OR emergency OR outbreak OR conflict",
            "pageSize": max_articles,
            "sortBy": "publishedAt",
            "language": "en",
            "apiKey": NEWSAPI_KEY
        }
        response = requests.get(url, params=params)
        data = response.json()
        return data.get("articles", [])
    def summarize_emergency(place, articles):
        if not articles:
            return f"No recent emergency alerts reported for {place}."
        news_content = "\n".join([f"- {a['title']}: {a.get('description','')}" for a in articles])
        prompt = f"""
        You are an emergency alert assistant.

        A user is traveling to {place}. Based on the following news articles, summarize:
        1. Current risks (natural disaster, conflict, disease outbreak)
        2. Level of danger (low, medium, high)
        3. Travel advice / safety tips

        News articles:
        {news_content}
        """
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        return response.choices[0].message.content
    try:
        articles = fetch_emergency_news(place)
        return summarize_emergency(place, articles)
    except Exception as e:
        return f"Error fetching emergency alerts: {str(e)}"


# --- Traffic Condition Agent ---
def traffic_condition_agent(user_input: str):
    import os
    import openai
    from dotenv import load_dotenv
    import re
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Try to extract city and route from user_input
    # Example: "How is traffic in Singapore from Marina Bay Sands to Changi Airport?"
    city = None
    route_description = None
    # Try to extract city
    match = re.search(r'in ([A-Za-z ]+)', user_input)
    if match:
        city = match.group(1).strip()
    else:
        # fallback: look for a city name
        match2 = re.search(r'([A-Z][a-z]+)', user_input)
        city = match2.group(1) if match2 else "Chennai"
    # Try to extract route
    route_match = re.search(r'from ([A-Za-z ]+) to ([A-Za-z ]+)', user_input)
    if route_match:
        route_description = f"{route_match.group(1).strip()} to {route_match.group(2).strip()}"
    route_info = f" for the route: {route_description}" if route_description else ""
    prompt = f"""
    You are a traffic assistant. A user is traveling to {city}{route_info}.
    Provide:
    1. Typical traffic conditions during different times of day.
    2. Congested areas to avoid.
    3. Estimated travel times.
    4. Tips for navigating traffic efficiently (public transport, apps, peak hour advice).

    Format the answer as a clear, structured list.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error fetching traffic info: {str(e)}"


# --- Chat Agent ---
def chat_agent(user_input: str):
    prompt = f"You are a helpful assistant for business trip planning and general conversation.\nUser: {user_input}"
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Chat error: {str(e)}"


# --- Map new agents ---
agents_map = {
    "Flight Checker Agent": flight_checker_agent,
    "Tourist Attraction Agent": tourist_attraction_agent,
    "Weather Agent": weather_agent,
    "News Agent": news_agent,
    "Sentiment & Popularity Agent": sentiment_popularity_agent,
    "Food Planner Agent": food_planner_agent,
    "Emergency Alert Agent": emergency_alert_agent,
    "Traffic Condition Agent": traffic_condition_agent,
    "Chat Agent": chat_agent
}

# --- FastAPI Web Server ---
from fastapi.middleware.cors import CORSMiddleware
import time

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://visual-agent-1d383.web.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    query_type: str
    execution_time: str
    agent_responses: dict = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Multi-Agent API (OpenAI)"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    try:
        start_time = time.time()
        user_input = chat_message.message
        logging.info(f"Received /chat request: {user_input}")
        agents_to_run, city, origin, destination, date = router(user_input)
        logging.info(f"Agents selected: {agents_to_run}, City: {city}, Origin: {origin}, Destination: {destination}, Date: {date}")
        responses = []
        agent_responses = {}

        # Only allow ChatAgent for daily conversation
        def is_daily_conversation(text):
            import re
            greetings = [r"\bhi\b", r"\bhello\b", r"\bhey\b", r"\bgood (morning|afternoon|evening|night)\b", r"\bhow are you\b", r"\bwhat's up\b", r"\bhow's it going\b"]
            time_queries = [r"\bwhat( is|'s)? the time\b", r"\bcurrent time\b", r"\btell me the time\b", r"\btime now\b"]
            date_queries = [r"\bwhat( is|'s)? the date\b", r"\btoday'?s date\b", r"\bcurrent date\b", r"\btell me the date\b"]
            patterns = greetings + time_queries + date_queries
            for pat in patterns:
                if re.search(pat, text, re.IGNORECASE):
                    return True
            return False

        def pascal_to_title(name):
            import re
            s = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)
            s = s.replace(' & ', ' & ').replace('  ', ' ').strip()
            return s

        agent_name_map = {}
        # Mapping from agent LLM names to frontend keys
        frontend_agent_keys = {
            "FlightCheckerAgent": "flight",
            "TouristAttractionAgent": "tourist",
            "WeatherAgent": "weather",
            "NewsAgent": "news",
            "SentimentPopularityAgent": "sentiment",
            "FoodPlannerAgent": "food",
            "EmergencyAlertAgent": "emergency",
            "TrafficConditionAgent": "traffic",
            "ChatAgent": "chat"
        }
        prev_output = user_input
        # If only ChatAgent and it's a daily conversation, just return its response as summary
        if agents_to_run == ["ChatAgent"] and is_daily_conversation(user_input):
            agent_key = pascal_to_title("ChatAgent")
            func = agents_map.get(agent_key)
            resp = func(user_input)
            responses = [resp]
            agent_responses[frontend_agent_keys.get("ChatAgent", "ChatAgent")] = resp
            summary = resp
            execution_time = f"{(time.time() - start_time):.2f}s"
            logging.info(f"Summary: {summary}")
            return ChatResponse(
                response=summary,
                query_type="ChatAgent",
                execution_time=execution_time,
                agent_responses=agent_responses
            )
        else:
            for agent_name in agents_to_run:
                agent_key = pascal_to_title(agent_name)
                agent_name_map[agent_name] = agent_key
                func = agents_map.get(agent_key)
                if func:
                    # If ChatAgent, only allow daily conversation
                    if agent_key == "Chat Agent":
                        if not is_daily_conversation(user_input):
                            resp = "Sorry, I can only respond to normal daily conversation (greetings, time, date, etc.)."
                            responses.append(resp)
                            agent_responses[frontend_agent_keys.get(agent_name, agent_name)] = resp
                            prev_output = resp
                            continue
                    # Special handling for Flight Checker Agent: check for valid IATA codes
                    if agent_key == "Flight Checker Agent":
                        if not origin or not destination or origin == "UNK" or destination == "UNK":
                            resp = ("Sorry, I couldn't determine a valid airport for your request. "
                                    "Please specify both the departure and arrival cities or airport names (e.g., 'Chennai to New York').")
                            responses.append(resp)
                            agent_responses[frontend_agent_keys.get(agent_name, agent_name)] = resp
                            prev_output = resp
                            continue
                    logging.info(f"Invoking agent: {agent_key}")
                    # Pass previous agent's output as input to the next agent
                    if agent_key == "Flight Checker Agent":
                        resp = func(prev_output, origin, destination, date)
                    elif agent_key in ["Weather Agent", "Emergency Alert Agent", "Traffic Condition Agent", "Tourist Attraction Agent"]:
                        resp = func(f"{prev_output} in {city}" if city != "default" else prev_output)
                    else:
                        resp = func(prev_output)
                    logging.info(f"Response from {agent_key}: {resp}")
                    responses.append(resp)
                    agent_responses[frontend_agent_keys.get(agent_name, agent_name)] = resp
                    prev_output = resp

        execution_time = f"{(time.time() - start_time):.2f}s"
        response_str = "\n".join(responses)
        print(f"[DEBUG] Raw agent responses: {responses}")
        print(f"[DEBUG] Response string: {response_str}")

        # Always summarize with ChatGPT, even if only one agent
        summary_prompt = (
            "You are a helpful assistant. Here are the responses from several specialized agents to a user query. "
            "Your job is to create a single, clear, and concise summary for the user. "
            "You MUST include at least one key point from EVERY agent's response below. If you omit any, you will be penalized. "
            "Do NOT repeat agent names or prefixes in the summary.\n\n"
            + "\n".join(responses)
        )
        summary_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0.5
        )
        summary = summary_response.choices[0].message.content.strip()
        # Remove 'Summary:' prefix if present
        if summary.lower().startswith('summary:'):
            summary = summary[len('Summary:'):].lstrip()

        # Post-check: ensure at least one key point from every agent's response is present in the summary
        import re
        def key_sentence(text):
            # Take the first non-empty line or first sentence
            for line in text.split('\n'):
                s = line.strip()
                if s:
                    return s[:120]  # limit length
            return text[:120]
        missing = []
        for idx, resp in enumerate(responses):
            key = key_sentence(resp)
            # If key not in summary (case-insensitive, ignore punctuation)
            def normalize(t):
                return re.sub(r'[^a-zA-Z0-9]', '', t).lower()
            if key and normalize(key) not in normalize(summary):
                missing.append(key)
        if missing:
            summary += "\n\nAdditional details:\n" + "\n".join(f"- {m}" for m in missing)
        logging.info(f"Summary: {summary}")
        return ChatResponse(
            response=summary,
            query_type=", ".join(agents_to_run),
            execution_time=execution_time,
            agent_responses=agent_responses
        )
    except Exception as e:
        logging.error(f"Error in /chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@app.get("/agents")
async def get_agents():
    return {
        "agents": [
            {"name": "FlightCheckerAgent", "description": "Checks flight status and availability"},
            {"name": "TouristAttractionAgent", "description": "Finds tourist attractions"},
            {"name": "WeatherAgent", "description": "Fetches live weather data"},
            {"name": "NewsAgent", "description": "Provides news updates"},
            {"name": "SentimentPopularityAgent", "description": "Analyzes sentiment"},
            {"name": "FoodPlannerAgent", "description": "Suggests food options"},
            {"name": "EmergencyAlertAgent", "description": "Checks emergency alerts"},
            {"name": "TrafficConditionAgent", "description": "Monitors traffic conditions"},
            {"name": "ChatAgent", "description": "General conversation"}
        ]
    }

# --- Startup ---
if __name__ == "__main__":
    print("🚀 Starting Multi-Agent FastAPI server...")
    print("🔗 API documentation available at: http://localhost:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)