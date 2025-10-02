import requests

def weather_agent(user_input: str):
    import re
    match = re.search(r'in ([A-Za-z ]+)', user_input)
    city = match.group(1).strip() if match else "Chennai"
    # Remove trailing words like 'today', 'now', 'currently', 'please', etc.
    city = re.sub(r'\b(today|now|currently|please|tomorrow|right now|at present)\b', '', city, flags=re.IGNORECASE).strip()
    city = re.sub(r'\s+', ' ', city)
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": "828a0b481a0d0df1a6be33bf8ea99bfd", "units": "metric"}
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

# Example test
if __name__ == "__main__":
    print(weather_agent("How is the weather in Sydney today"))
