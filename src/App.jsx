import React from "react";
import "./App.css";

const API_KEY = "5f6af6b9fcfb543d699dbbfbcd9b971c";

const getDayName = (unixTime) =>
  new Date(unixTime * 1000).toLocaleDateString("en-US", { weekday: "short" });

const getHourLabel = (unixTime) =>
  new Date(unixTime * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const getDateLabel = (unixTime) =>
  new Date(unixTime * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const App = () => {
  const [city, setCity] = React.useState("New Delhi");
  const [current, setCurrent] = React.useState(null);
  const [daily, setDaily] = React.useState([]);
  const [hourly, setHourly] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [clock, setClock] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = async (cityName) => {
    if (!cityName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const currentData = await currentRes.json();

      if (!currentRes.ok) {
        throw new Error(currentData.message || "City not found");
      }

      const { lat, lon } = currentData.coord;

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const forecastData = await forecastRes.json();

      if (!forecastRes.ok) {
        throw new Error(forecastData.message || "Could not fetch forecast");
      }

      const nextHourly = forecastData.list.slice(0, 12);
      const groupedByDay = forecastData.list.reduce((acc, item) => {
        const dateKey = item.dt_txt.split(" ")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = item;
        }

        const targetHour = 12;
        const currentHour = new Date(item.dt * 1000).getHours();
        const savedHour = new Date(acc[dateKey].dt * 1000).getHours();

        if (Math.abs(currentHour - targetHour) < Math.abs(savedHour - targetHour)) {
          acc[dateKey] = item;
        }

        return acc;
      }, {});

      const nextDaily = Object.values(groupedByDay).slice(0, 7);

      setCurrent(currentData);
      setDaily(nextDaily);
      setHourly(nextHourly);
    } catch (err) {
      setCurrent(null);
      setDaily([]);
      setHourly([]);
      setError(err.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWeather("New Delhi");
  }, []);

  const handleSearch = () => {
    fetchWeather(city);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="dashboard-wrap">
      <div className="weather-dashboard">
        <aside className="left-panel">
          <div className="search">
            <input
              type="text"
              placeholder="Search..."
              value={city}
              onChange={(event) => setCity(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? "..." : "Search"}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}

          {current && (
            <>
              <div className="current-main">
                <img
                  src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`}
                  alt={current.weather[0].description}
                />
                <h1>{Math.round(current.main.temp)}°C</h1>
                <p>{getDateLabel(current.dt)}</p>
              </div>

              <div className="mini-cards">
                <div className="mini-card">
                  <h4>Clouds</h4>
                  <p>{current.weather[0].main}</p>
                </div>
                <div className="mini-card">
                  <h4>Feels Like</h4>
                  <p>{Math.round(current.main.feels_like)}°C</p>
                </div>
                <div className="mini-card">
                  <h4>Humidity</h4>
                  <p>{current.main.humidity}%</p>
                </div>
                <div className="mini-card">
                  <h4>Wind</h4>
                  <p>{Math.round(current.wind.speed * 3.6)} km/h</p>
                </div>
              </div>
            </>
          )}
        </aside>

        <section className="right-panel">
          <header className="dashboard-header">
            <h2>Hello! Subeshan </h2>
            <h3>{current ? current.name : "-"}</h3>
            <p>{clock.toLocaleTimeString("en-US", { hour12: false })}</p>
          </header>

          <section className="section-block">
            <h3>Daily Report</h3>
            <div className="daily-grid">
              {daily.map((item) => (
                <div className="daily-card" key={item.dt}>
                  <p>{getDayName(item.dt)}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                  />
                  <h4>{Math.round(item.main.temp)}°C</h4>
                  <span>{item.weather[0].description}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <h3>Hourly Report</h3>
            <div className="hourly-grid">
              {hourly.map((item) => (
                <div className="hour-card" key={item.dt}>
                  <p>{getHourLabel(item.dt)}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                  />
                  <h4>{Math.round(item.main.temp)}°C</h4>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default App;