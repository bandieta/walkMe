import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MapsService {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('GOOGLE_MAPS_API_KEY', '');
  }

  async geocode(address: string) {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: this.apiKey },
    });
    return response.data.results?.[0]?.geometry?.location ?? null;
  }

  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: { lat: number; lng: number }[] = [],
  ) {
    const waypointsStr = waypoints.map((w) => `${w.lat},${w.lng}`).join('|');
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        waypoints: waypointsStr || undefined,
        mode: 'walking',
        key: this.apiKey,
      },
    });
    return response.data;
  }
}
