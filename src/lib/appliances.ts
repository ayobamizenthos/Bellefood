export interface AppliancePreset {
  name: string
  icon: string
  watts: number
  hours: number
}

export const APPLIANCES: AppliancePreset[] = [
  { name: 'Bulbs', icon: '/appliances/bulbs.png', watts: 15, hours: 6 },
  { name: 'Fan', icon: '/appliances/fan.png', watts: 65, hours: 8 },
  { name: 'Television', icon: '/appliances/television.png', watts: 100, hours: 6 },
  { name: 'Refrigerator', icon: '/appliances/refrigerator.png', watts: 150, hours: 12 },
  { name: 'Freezer', icon: '/appliances/freezer.png', watts: 200, hours: 12 },
  { name: 'Air Conditioner', icon: '/appliances/air-conditioner.png', watts: 900, hours: 6 },
  { name: 'Laptop', icon: '/appliances/laptop.png', watts: 65, hours: 5 },
  { name: 'Phone', icon: '/appliances/phone.png', watts: 10, hours: 3 },
  { name: 'WiFi Modem', icon: '/appliances/wifi-modem.png', watts: 20, hours: 24 },
  { name: 'Decoder', icon: '/appliances/decoder.png', watts: 30, hours: 6 },
  { name: 'Home Theatre', icon: '/appliances/home-theatre.png', watts: 120, hours: 4 },
  { name: 'Microwave', icon: '/appliances/microwave.png', watts: 1000, hours: 1 },
  { name: 'Pressing Iron', icon: '/appliances/pressing-iron.png', watts: 1000, hours: 1 },
  { name: 'Washing Machine', icon: '/appliances/washing-machine.png', watts: 500, hours: 1 },
  { name: 'Water Heater', icon: '/appliances/water-heater.png', watts: 1500, hours: 1 },
  { name: 'Water Pump', icon: '/appliances/water-pump.png', watts: 750, hours: 1 },
]
