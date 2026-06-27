
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, MapPin, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import axios from "axios"

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  location: string
  description: string
  windSpeed: number
  feelsLike: number
}

interface LocationData {
  lat: number
  lon: number
  city: string
  country: string
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getFallbackWeather = (locationData?: LocationData): WeatherData => ({
    temperature: 28,
    condition: "Clouds",
    humidity: 74,
    location: locationData
      ? `${locationData.city}${locationData.country ? ', ' + locationData.country : ''}`
      : "Lagos, Nigeria",
    description: "Local snapshot",
    windSpeed: 3,
    feelsLike: 28
  })

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string, description: string) => {
    const iconClass = "h-6 w-6"
    
    if (condition === "Clear") {
      return <Sun className={`${iconClass} text-green-light`} />
    } else if (condition === "Clouds") {
      return <Cloud className={`${iconClass} text-white/70`} />
    } else if (condition === "Rain" || condition === "Drizzle") {
      return <CloudRain className={`${iconClass} text-green-light`} />
    } else if (condition === "Snow") {
      return <CloudSnow className={`${iconClass} text-white/80`} />
    } else if (condition === "Mist" || condition === "Fog" || condition === "Haze") {
      return <Wind className={`${iconClass} text-gray-300`} />
    } else {
      return <Cloud className={`${iconClass} text-white/70`} />
    }
  }

  // Get weather condition and description from Open-Meteo weather code
  const getWeatherCondition = (code: number) => {
    const conditions: { [key: number]: { condition: string; description: string } } = {
      0: { condition: "Clear", description: "Clear sky" },
      1: { condition: "Clouds", description: "Mainly clear" },
      2: { condition: "Clouds", description: "Partly cloudy" },
      3: { condition: "Clouds", description: "Overcast" },
      45: { condition: "Mist", description: "Fog" },
      48: { condition: "Mist", description: "Depositing rime fog" },
      51: { condition: "Rain", description: "Light drizzle" },
      53: { condition: "Rain", description: "Moderate drizzle" },
      55: { condition: "Rain", description: "Dense drizzle" },
      56: { condition: "Rain", description: "Light freezing drizzle" },
      57: { condition: "Rain", description: "Dense freezing drizzle" },
      61: { condition: "Rain", description: "Slight rain" },
      63: { condition: "Rain", description: "Moderate rain" },
      65: { condition: "Rain", description: "Heavy rain" },
      66: { condition: "Rain", description: "Light freezing rain" },
      67: { condition: "Rain", description: "Heavy freezing rain" },
      71: { condition: "Snow", description: "Slight snow fall" },
      73: { condition: "Snow", description: "Moderate snow fall" },
      75: { condition: "Snow", description: "Heavy snow fall" },
      77: { condition: "Snow", description: "Snow grains" },
      80: { condition: "Rain", description: "Slight rain showers" },
      81: { condition: "Rain", description: "Moderate rain showers" },
      82: { condition: "Rain", description: "Violent rain showers" },
      85: { condition: "Snow", description: "Slight snow showers" },
      86: { condition: "Snow", description: "Heavy snow showers" },
      95: { condition: "Thunderstorm", description: "Thunderstorm" },
      96: { condition: "Thunderstorm", description: "Thunderstorm with slight hail" },
      99: { condition: "Thunderstorm", description: "Thunderstorm with heavy hail" }
    }
    return conditions[code] || { condition: "Clouds", description: "Unknown" }
  }

  // Get user's location without blocking the hero on reverse-geocoding.
  const getUserLocation = () => {
    return new Promise<LocationData>((resolve) => {
      const fallbackLocation = {
        lat: 6.5244,
        lon: 3.3792,
        city: "Lagos",
        country: "Nigeria"
      }

      if (!navigator.geolocation) {
        resolve(fallbackLocation)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve({
            lat: latitude,
            lon: longitude,
            city: "Your area",
            country: ""
          })
        },
        () => {
          resolve(fallbackLocation)
        },
        {
          timeout: 2500,
          maximumAge: 300000, // 5 minutes
          enableHighAccuracy: false
        }
      )
    })
  }

  // Fetch weather data
  const fetchWeatherData = async (locationData: LocationData) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${locationData.lat}&longitude=${locationData.lon}&current_weather=true&windspeed_unit=ms&hourly=relative_humidity_2m`,
        { timeout: 3000 }
      )

      const data = response.data
      const current = data.current_weather
      const { condition, description } = getWeatherCondition(current.weathercode)

      const weatherData: WeatherData = {
        temperature: Math.round(current.temperature),
        condition,
        humidity: data.hourly.relative_humidity_2m[0],
        location: `${locationData.city}${locationData.country ? ', ' + locationData.country : ''}`,
        description,
        windSpeed: current.windspeed,
        feelsLike: Math.round(current.temperature) // Approximate with current temperature
      }

      setWeather(weatherData)
    } catch (error) {
      setWeather(getFallbackWeather(locationData))
    }
  }

  // Initialize weather data
  useEffect(() => {
    const initializeWeather = async () => {
      try {
        setWeather(getFallbackWeather())
        setIsLoading(false)
        setError(null)
        
        
        const locationData = await getUserLocation()
        setLocation(locationData)
        
        await fetchWeatherData(locationData)
      } catch (error) {
        setWeather(getFallbackWeather())
      } finally {
        setIsLoading(false)
      }
    }

    initializeWeather()
  }, [])

  // Update weather data every 10 minutes
  useEffect(() => {
    if (!location) return

    const interval = setInterval(async () => {
      try {
        await fetchWeatherData(location)
      } catch (error) {
        console.error("Failed to update weather data:", error)
      }
    }, 600000) // 10 minutes

    return () => clearInterval(interval)
  }, [location])

  if (isLoading) {
    return (
      <Card className="w-48 bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-6 bg-white/20 rounded w-1/2"></div>
            <div className="h-3 bg-white/20 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-48 bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center text-red-300">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-xs">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5 }}
    >
      <Card className="w-48 bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-green-light" />
              <span className="text-xs font-medium truncate">{weather.location}</span>
            </div>
            {getWeatherIcon(weather.condition, weather.description)}
          </div>

          <div className="flex items-center mb-2">
            <Thermometer className="h-4 w-4 mr-2 text-green-light" />
            <span className="text-2xl font-bold">{weather.temperature}°C</span>
          </div>

          <div className="text-xs text-gray-200 space-y-1">
            <div className="flex justify-between">
              <span>Feels like</span>
              <span>{weather.feelsLike}°C</span>
            </div>
            <div className="flex justify-between">
              <span>Humidity</span>
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span>Wind</span>
              <span>{weather.windSpeed} m/s</span>
            </div>
            <div className="flex justify-between">
              <span>Condition</span>
              <span className="capitalize">{weather.description}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
